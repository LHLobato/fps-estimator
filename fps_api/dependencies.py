"""
Dependencies compartilhadas da API.
Fornece sessões de banco de dados e verificação de tokens JWT.
"""

from fps_api.auth_config import ALGORITHM, SECRET_KEY
from fps_api.build_db import Users, db
from fastapi import Depends, Header, HTTPException, status
from jose import JWTError, jwt
from sqlalchemy.orm import Session, sessionmaker


def get_session():
    """
    Dependency que fornece uma sessão de banco de dados.
    Garante que a sessão seja fechada após o uso.
    """
    try:
        Session = sessionmaker(bind=db)
        session = Session()
        yield session
    finally:
        session.close()


def get_token_from_header(authorization: str = Header(...)) -> str:
    """
    Extrai o token JWT do header Authorization.
    Formato esperado: "Bearer <token>"
    """
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Formato de token inválido. Use: Bearer <token>",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return authorization.replace("Bearer ", "")


def verify_token(token: str = Depends(get_token_from_header)) -> dict:
    """
    Verifica e decodifica um token JWT.
    Retorna o payload se válido, lança exceção caso contrário.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expirado ou inválido",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_current_user_id(token_payload: dict = Depends(verify_token)) -> int:
    """
    Dependency para extrair o ID do usuário do token JWT.
    Usada em rotas protegidas que precisam do user_id.
    """

    return int(token_payload["sub"])
