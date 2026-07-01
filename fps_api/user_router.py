import asyncio
from concurrent.futures import ThreadPoolExecutor

from fastapi import Request, APIRouter, HTTPException, Depends, status
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from fps_api.schemas import (
    UserResponse,
    UserAlterSetup,
    UserAlter,
    ExcludeAccountRequest,
    ExcludeAccountResponse,
)
from fps_api.limiter import limiter
from fps_api.dependencies import get_current_user_id, get_session
from fps_api.build_db import Users
# from model.text_func import get_embedding  # Lazy import
from passlib.context import CryptContext
from uuid import UUID

bcrypt_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Thread pool dedicado para o bcrypt, que é lento de propósito (work factor) e
# bloquearia o event loop se chamado direto dentro de uma rota async.
_blocking_executor = ThreadPoolExecutor(max_workers=4)


async def verify_password(password: str, hashed: str) -> bool:
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(_blocking_executor, bcrypt_context.verify, password, hashed)


user_router = APIRouter(prefix="/profile", tags=["profile", "edit", "setup"])


@user_router.post("/edit_setup", response_model=UserResponse)
@limiter.limit("5/minute")
async def edit_setup(
    request: Request,
    data: UserAlterSetup,
    session: AsyncSession = Depends(get_session),
    user_id: UUID = Depends(get_current_user_id),
):
    # Lazy import para evitar sentence_transformers no startup
    from model.text_func import get_embedding

    stmt = select(Users).where(Users.id == user_id)
    result = await session.execute(stmt)
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not Found")

    if data.gpu:
        gpu_embedding = await get_embedding(data.gpu)
        gpu_result = await session.execute(
            text("SELECT id FROM gpus ORDER BY embedding <=> CAST(:vec AS vector) LIMIT 1"),
            {"vec": str(gpu_embedding)}
        )
        gpu_id = gpu_result.scalar()
        if gpu_id:
            user.gpu_id = gpu_id
        else:
            raise HTTPException(status_code=404, detail="GPU not found in database")

    if data.cpu:
        cpu_embedding = await get_embedding(data.cpu)
        cpu_result = await session.execute(
            text("SELECT id FROM cpus ORDER BY embedding <=> CAST(:vec AS vector) LIMIT 1"),
            {"vec": str(cpu_embedding)}
        )
        cpu_id = cpu_result.scalar()
        if cpu_id:
            user.cpu_id = cpu_id
        else:
            raise HTTPException(status_code=404, detail="CPU not found in database")

    if data.ram:
        user.ram = data.ram

    await session.commit()

    # Recarrega com gpu_rel/cpu_rel via selectinload para montar a resposta:
    # session.refresh() não garante reload seguro de relationships em contexto async.
    stmt = (
        select(Users)
        .where(Users.id == user_id)
        .options(selectinload(Users.gpu_rel), selectinload(Users.cpu_rel))
    )
    result = await session.execute(stmt)
    user = result.scalars().first()

    return UserResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        profile_photo=user.profile_photo,
        gpu=user.gpu_rel.name if user.gpu_rel else None,
        cpu=user.cpu_rel.name if user.cpu_rel else None,
        ram=user.ram,
    )


@user_router.post("/edit", response_model=UserResponse)
@limiter.limit("5/minute")
async def edit_profile(
    request: Request,
    data: UserAlter,
    session: AsyncSession = Depends(get_session),
    user_id: UUID = Depends(get_current_user_id),
):
    # Lazy import para evitar sentence_transformers no startup
    from model.text_func import get_embedding

    stmt = select(Users).where(Users.id == user_id)
    result = await session.execute(stmt)
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not Found")

    for field, value in data.model_dump(exclude_none=True).items():

        if field == "gpu":
            gpu_embedding = await get_embedding(value)
            gpu_result = await session.execute(
                text("SELECT id FROM gpus ORDER BY embedding <=> CAST(:vec AS vector) LIMIT 1"),
                {"vec": str(gpu_embedding)}
            )
            user.gpu_id = gpu_result.scalar()
        elif field == "cpu":
            cpu_embedding = await get_embedding(value)
            cpu_result = await session.execute(
                text("SELECT id FROM cpus ORDER BY embedding <=> CAST(:vec AS vector) LIMIT 1"),
                {"vec": str(cpu_embedding)}
            )
            user.cpu_id = cpu_result.scalar()
        else:
            setattr(user, field, value)

    await session.commit()

    # Mesmo motivo do /edit_setup: recarrega com eager load em vez de refresh().
    stmt = (
        select(Users)
        .where(Users.id == user_id)
        .options(selectinload(Users.gpu_rel), selectinload(Users.cpu_rel))
    )
    result = await session.execute(stmt)
    user = result.scalars().first()

    return UserResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        profile_photo=user.profile_photo,
        gpu=user.gpu_rel.name if user.gpu_rel else None,
        cpu=user.cpu_rel.name if user.cpu_rel else None,
        ram=user.ram,
    )


@user_router.delete("/exclude-account", response_model=ExcludeAccountResponse)
@limiter.limit("5/minute")
async def exclude_account(
    request: Request,
    data: ExcludeAccountRequest,
    session: AsyncSession = Depends(get_session),
    user_id: UUID = Depends(get_current_user_id),
):
    """
    Endpoint para excluir (deletar) a conta do usuário.

    Requer autenticação e confirmação de senha.
    Deleta completamente o usuário do banco de dados, incluindo dados relacionados.

    Args:
        data: ExcludeAccountRequest com a senha para confirmação
        session: Sessão assíncrona do banco de dados
        user_id: ID do usuário autenticado

    Returns:
        ExcludeAccountResponse com status e detalhes da exclusão

    Raises:
        HTTPException: 404 se usuário não encontrado
        HTTPException: 401 se senha incorreta
    """
    # Buscar o usuário no banco de dados
    stmt = select(Users).where(Users.id == user_id)
    result = await session.execute(stmt)
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Validar a senha
    if not await verify_password(data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid password"
        )

    # Deletar o usuário (cascade deleta os relacionamentos também)
    await session.delete(user)
    await session.commit()

    return ExcludeAccountResponse(
        status="success",
        message="Account successfully deleted",
        user_id=user_id,
    )