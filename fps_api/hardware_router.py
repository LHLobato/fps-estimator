from fastapi import APIRouter, Depends, Query
from sqlalchemy import case, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql.elements import ColumnElement
from fps_api.build_db import CPU, GPU, Game
from fps_api.dependencies import get_session

hardware_router = APIRouter(prefix="/hardware", tags=["hardware"])


def _apply_name_search(stmt, name_column: ColumnElement, term: str):
    """Filtra por ILIKE (todas as palavras) e ordena prefixo antes de substring."""
    words = [w for w in term.split() if w]
    if not words:
        return stmt
    for word in words:
        stmt = stmt.where(name_column.ilike(f"%{word}%"))
    prefix = f"{words[0]}%"
    order_priority = case((name_column.ilike(prefix), 0), else_=1)
    return stmt.order_by(order_priority, name_column.asc())


@hardware_router.get("/gpus/search")
async def search_gpus(
    q: str = Query(..., min_length=1, max_length=100, description="Termo de busca"),
    limit: int = Query(10, ge=1, le=50, description="Máximo de resultados"),
    session: AsyncSession = Depends(get_session),
):
    term = q.strip()
    if not term:
        return {"gpus": []}
    stmt = select(GPU.id, GPU.name)
    stmt = _apply_name_search(stmt, GPU.name, term).limit(limit)
    result = await session.execute(stmt)
    gpus = result.all()
    return {"gpus": [{"id": str(g.id), "name": g.name} for g in gpus]}


@hardware_router.get("/cpus/search")
async def search_cpus(
    q: str = Query(..., min_length=1, max_length=100, description="Termo de busca"),
    limit: int = Query(10, ge=1, le=50, description="Máximo de resultados"),
    session: AsyncSession = Depends(get_session),
):
    term = q.strip()
    if not term:
        return {"cpus": []}
    stmt = select(CPU.id, CPU.name)
    stmt = _apply_name_search(stmt, CPU.name, term).limit(limit)
    result = await session.execute(stmt)
    cpus = result.all()
    return {"cpus": [{"id": str(c.id), "name": c.name} for c in cpus]}


@hardware_router.get("/games/search")
async def search_games(
    q: str = Query(..., min_length=1, max_length=100, description="Termo de busca"),
    limit: int = Query(10, ge=1, le=50, description="Máximo de resultados"),
    session: AsyncSession = Depends(get_session),
):
    """Busca jogos por nome no banco (ILIKE), com limite e ordenação por relevância."""
    term = q.strip()
    if not term:
        return {"games": []}
    stmt = select(Game.id, Game.name, Game.image_url)
    stmt = _apply_name_search(stmt, Game.name, term).limit(limit)
    result = await session.execute(stmt)
    games = result.all()
    return {
        "games": [
            {
                "id": str(g.id),
                "name": g.name,
                "image_url": g.image_url,
            }
            for g in games
        ]
    }


@hardware_router.get("/gpus")
async def list_gpus(session: AsyncSession = Depends(get_session)):
    stmt = select(GPU.id, GPU.name)
    result = await session.execute(stmt)
    gpus = result.all()
    return {"gpus": [{"id": str(g.id), "name": g.name} for g in gpus]}


@hardware_router.get("/cpus")
async def list_cpus(session: AsyncSession = Depends(get_session)):
    stmt = select(CPU.id, CPU.name)
    result = await session.execute(stmt)
    cpus = result.all()
    return {"cpus": [{"id": str(c.id), "name": c.name} for c in cpus]}


@hardware_router.get("/games")
async def list_games(session: AsyncSession = Depends(get_session)):
    """Lista todos os jogos disponíveis com nome e URL da imagem."""
    stmt = select(Game.id, Game.name, Game.image_url)
    result = await session.execute(stmt)
    games = result.all()
    return {
        "games": [
            {
                "id": str(g.id),
                "name": g.name,
                "image_url": g.image_url,
            }
            for g in games
        ]
    }