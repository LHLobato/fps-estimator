"""
Router de autenticação - cadastro, login, verificação de email e tokens JWT.
Implementa criptografia de senhas, JWT e verificação por email (OTP).
"""

import time
from datetime import datetime, timedelta, timezone
from uuid import UUID
import pyotp
from fps_api.auth_config import (
    ACCESS_TOKEN_EXPIRE_MINUTES,
    ALGORITHM,
    OTP_LOGIN_INTERVAL,
    OTP_SIGNUP_INTERVAL,
    REFRESH_TOKEN_EXPIRE_DAYS,
    SECRET_KEY,
)
from fps_api.build_db import Users
from fps_api.email_utils import send_email_login, send_email_recovery, send_email_signup
from fastapi import APIRouter, Depends, HTTPException, status, Request
from jose import JWTError, jwt
from passlib.context import CryptContext
from fps_api.limiter import limiter
from fps_api.dependencies import get_current_user_id, get_session
from fps_api.schemas import (
    CodeSchema,
    LoginSchema,
    PasswordReset,
    RefreshTokenRequest,
    UserBase,
    UserCreate,
    UserResponse,
)
from sqlalchemy.orm import Session


bcrypt_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

auth_router = APIRouter(
    prefix="/auth",
    tags=["autenticação"],
)


# ========================
# Funções auxiliares
# ========================
def generate_token(
    user_id: UUID,
    expires_delta: timedelta = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
) -> str:
    """
    Gera JWT token com payload {sub: user_id, exp: expiration}.
    """
    expire = datetime.now(timezone.utc) + expires_delta
    payload = {"sub": str(user_id), "exp": expire}
    return jwt.encode(payload, SECRET_KEY, ALGORITHM)

def authenticate_user(email: str, password: str, session: Session):
    """
    Verifica credenciais do usuário.
    Retorna o usuário se autenticado, None caso contrário.
    """
    user = session.query(Users).filter(Users.email == email).first()
    if not user:
        return None
    if not bcrypt_context.verify(password, user.password):
        return None
    return user


# ========================
# Rotas
# ========================
@auth_router.get("/", summary="Health check do sistema de autenticação")
async def auth_home():
    """Health check do módulo de autenticação."""
    return {
        "message": "Sistema de autenticação ativo",
        "endpoints": [
            "/auth/sign_in",
            "/auth/verify_code_sig",
            "/auth/login",
            "/auth/verify_code_log",
            "/auth/refresh_token",
            "/auth/forgotpassword",
        ],
    }


@auth_router.post(
    "/sign_in",
    summary="Criar nova conta de usuário",
    status_code=status.HTTP_201_CREATED,
)
@limiter.limit("5/minute")
async def create_account(
    request: Request,
    user_data: UserCreate,
    session: Session = Depends(get_session),
):
    """
    Cria nova conta de usuário com email de verificação OTP.

    - Verifica se email já está em uso
    - Hasheia a senha com bcrypt
    - Envia código OTP para verificação de email
    - Usuário fica inativo até verificação
    """
    # Verifica se email já existe
    existing_user = session.query(Users).filter(Users.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email já cadastrado!",
        )

    try:
        hashed_password = bcrypt_context.hash(user_data.password)

        # Gera segredo OTP para 2FA
        otp_secret = pyotp.random_base32()
        totp = pyotp.TOTP(otp_secret, interval=OTP_SIGNUP_INTERVAL)
        otp_code = totp.now()

        # Cria usuário inativo
        new_user = Users(
            name=user_data.name or "",
            email=user_data.email,
            password=hashed_password,
            gpu=user_data.gpu,
            cpu=user_data.cpu,
            ram=user_data.ram,
            otp_secret=otp_secret,
            ativo=False,
        )

        # Envia email de verificação
        email_sent = send_email_signup(user_data.email, otp_code)
        if not email_sent:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Erro ao enviar email de verificação. Tente novamente.",
            )

        session.add(new_user)
        session.commit()
        session.refresh(new_user)

        return {
            "status": "success",
            "message": "Conta criada! Verifique seu email para receber o código de ativação.",
            "user_id": new_user.id,
        }

    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao criar conta: {str(e)}",
        )


@auth_router.post("/verify_code_sig", summary="Verificar código de signup")
@limiter.limit("10/minute")
async def verify_signup_code(
    request: Request,
    code_data: CodeSchema,
    session: Session = Depends(get_session),
):
    """
    Verifica código OTP de ativação de conta.

    - Ativa o usuário se código válido
    - Retorna access_token e refresh_token
    """
    user = session.query(Users).filter(Users.email == code_data.email).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado",
        )

    if user.ativo:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Conta já está ativada. Faça login diretamente.",
        )

    # Verifica código OTP
    totp = pyotp.TOTP(user.otp_secret, interval=OTP_SIGNUP_INTERVAL)
    if not totp.verify(code_data.code):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Código inválido ou expirado",
        )

    # Ativa usuário
    user.ativo = True
    session.commit()

    # Gera tokens
    access_token = generate_token(user.id)
    refresh_token = generate_token(user.id, timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS))

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user_id": user.id,
        "message": "Conta ativada com sucesso!",
    }


@auth_router.post("/login", summary="Fazer login")
@limiter.limit("5/minute")
async def login(
    request: Request,
    login_data: LoginSchema,
    session: Session = Depends(get_session),
):
    """
    Autentica usuário com email/senha e envia OTP por email.

    - Verifica credenciais
    - Verifica se conta está ativa
    - Envia código OTP 2FA por email
    """
    user = authenticate_user(login_data.email, login_data.password, session)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha incorretos!",
        )

    if not user.ativo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Conta não ativada. Verifique seu email primeiro.",
        )

    # Gera e envia OTP para 2FA
    totp = pyotp.TOTP(user.otp_secret, interval=OTP_LOGIN_INTERVAL)
    otp_code = totp.now()

    email_sent = send_email_login(user.email, otp_code)
    if not email_sent:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao enviar código de verificação. Tente novamente.",
        )

    return {
        "status": "success",
        "message": "Código OTP enviado! Verifique seu email para completar o login.",
    }


@auth_router.post("/verify_code_log", summary="Verificar código de login")
@limiter.limit("10/minute")
async def verify_login_code(
    request: Request,
    code_data: CodeSchema,
    session: Session = Depends(get_session),
):
    """
    Verifica código OTP de login e retorna tokens JWT.

    - Valida código OTP
    - Retorna access_token e refresh_token
    """
    user = session.query(Users).filter(Users.email == code_data.email).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado",
        )

    if not user.ativo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Conta não ativada.",
        )

    # Verifica código OTP
    totp = pyotp.TOTP(user.otp_secret, interval=OTP_LOGIN_INTERVAL)
    if not totp.verify(code_data.code):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Código inválido ou expirado",
        )

    # Gera tokenss
    access_token = generate_token(user.id)
    refresh_token = generate_token(user.id, timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS))

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user_id": user.id,
    }


@auth_router.post("/refresh_token", summary="Renovar token de acesso")
@limiter.limit("10/minute")
async def refresh_token(
    request: Request,
    body: RefreshTokenRequest,
    session: Session = Depends(get_session),
):
    """
    Renova o access_token usando um refresh_token válido.

    - Verifica validade e expiração do refresh_token
    - Retorna novo access_token e refresh_token
    """
    try:
        # Decodifica o refresh token
        payload = jwt.decode(body.refresh_token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")

        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido",
            )

        # Verifica se usuário existe e está ativo
        user = session.query(Users).filter(Users.id == user_id).first()
        if not user or not user.ativo:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Usuário inválido ou inativo",
            )

        # Gera novos tokens
        new_access = generate_token(user.id)
        new_refresh = generate_token(user.id, timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS))

        return {
            "access_token": new_access,
            "refresh_token": new_refresh,
            "token_type": "bearer",
        }

    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expirado ou inválido",
        )


@auth_router.get(
    "/me", summary="Obter dados do usuário logado", response_model=UserResponse
)
@limiter.limit("5/minute")
async def get_current_user(
    request: Request,
    user_id: UUID = Depends(get_current_user_id),
    session: Session = Depends(get_session),
):
    """
    Retorna dados do usuário autenticado via token JWT no header Authorization.

    - Extrai user_id do token Bearer
    - Retorna dados do usuário (sem senha)
    """
    user = session.query(Users).filter(Users.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado",
        )

    return UserResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        gpu=user.gpu if user.gpu else None,
        cpu=user.cpu if user.cpu else None,
        ram=user.ram if user.ram else None,
    )


@auth_router.post(
    "/forgotpassword",
    summary="Recuperação de senha para troca",
    status_code=status.HTTP_200_OK,
)
@limiter.limit("5/minute")
async def forgot_password(request: Request, user_schema: UserBase, session: Session = Depends(get_session)
):
    """
    Consulta o Banco para verificar se o usuário está cadastro, caso esteja, um código será enviado
    para que ele possa confirmar sua identidade e trocar sua senha.
    """
    user = session.query(Users).filter(Users.email == user_schema.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado",
        )

    totp = pyotp.TOTP(user.otp_secret, interval=OTP_LOGIN_INTERVAL)
    otp_code = totp.now()
    email_sent = send_email_recovery(user.email, otp_code)
    if not email_sent:
        raise HTTPException(500, "Erro ao enviar email de recuperação")

    return {"status": "Success", "message": "you'll be redirected"}


@auth_router.post("/verify_recovery_code")
@limiter.limit("10/minute")
async def verify_recovery_code(request: Request, code_schema: CodeSchema, session: Session = Depends(get_session)
):
    user = session.query(Users).filter(Users.email == code_schema.email).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado",
        )

    if not user.ativo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Conta não ativada.",
        )

    totp = pyotp.TOTP(user.otp_secret, interval=OTP_LOGIN_INTERVAL)

    if not totp.verify(code_schema.code):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Código inválido ou expirado",
        )

    reset_token = jwt.encode(
        {
            "sub": str(user.id),
            "purpose": "password_reset",
            "exp": datetime.now(timezone.utc) + timedelta(minutes=5),
        },
        SECRET_KEY,
        ALGORITHM,
    )
    return {"reset_token": reset_token}


@auth_router.post("/change_password")
@limiter.limit("5/minute")
async def change_password(request: Request, new_password: PasswordReset, session=Depends(get_session)):
    try:
        payload = jwt.decode(new_password.reset_token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido ou expirado")
    if payload.get("purpose") != "password_reset":
        raise HTTPException(401, "Token inválido para esta operação")

    user_id = payload["sub"]
    user = session.query(Users).filter(Users.id == user_id).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado",
        )

    hashed_password = bcrypt_context.hash(new_password.new_password)

    user.password = hashed_password
    session.commit()

    access_token = generate_token(user.id)
    refresh_token = generate_token(user.id, timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS))

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user_id": user.id,
    }
