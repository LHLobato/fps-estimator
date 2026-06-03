from fastapi import APIRouter, Depends, Query
from sqlalchemy import case
from sqlalchemy.orm import Session
from sqlalchemy.sql.elements import ColumnElement
from fps_api.build_db import CPU, GPU, Game
from fps_api.dependencies import get_session

hardware_router = APIRouter(prefix="/hardware", tags=["hardware"])


def _apply_name_search(query, name_column: ColumnElement, term: str):
    """Filtra por ILIKE (todas as palavras) e ordena prefixo antes de substring."""
    words = [w for w in term.split() if w]
    if not words:
        return query

    for word in words:
        query = query.filter(name_column.ilike(f"%{word}%"))

    prefix = f"{words[0]}%"
    order_priority = case((name_column.ilike(prefix), 0), else_=1)
    return query.order_by(order_priority, name_column.asc())


@hardware_router.get("/gpus/search")
async def search_gpus(
    q: str = Query(..., min_length=1, max_length=100, description="Termo de busca"),
    limit: int = Query(10, ge=1, le=50, description="Máximo de resultados"),
    session: Session = Depends(get_session),
):
    term = q.strip()
    if not term:
        return {"gpus": []}

    query = session.query(GPU).with_entities(GPU.id, GPU.name)
    query = _apply_name_search(query, GPU.name, term)
    gpus = query.limit(limit).all()

    return {"gpus": [{"id": str(g.id), "name": g.name} for g in gpus]}


@hardware_router.get("/cpus/search")
async def search_cpus(
    q: str = Query(..., min_length=1, max_length=100, description="Termo de busca"),
    limit: int = Query(10, ge=1, le=50, description="Máximo de resultados"),
    session: Session = Depends(get_session),
):
    term = q.strip()
    if not term:
        return {"cpus": []}

    query = session.query(CPU).with_entities(CPU.id, CPU.name)
    query = _apply_name_search(query, CPU.name, term)
    cpus = query.limit(limit).all()

    return {"cpus": [{"id": str(c.id), "name": c.name} for c in cpus]}


@hardware_router.get("/games/search")
async def search_games(
    q: str = Query(..., min_length=1, max_length=100, description="Termo de busca"),
    limit: int = Query(10, ge=1, le=50, description="Máximo de resultados"),
    session: Session = Depends(get_session),
):
    """Busca jogos por nome no banco (ILIKE), com limite e ordenação por relevância."""
    term = q.strip()
    if not term:
        return {"games": []}

    query = session.query(Game).with_entities(Game.id, Game.name, Game.image_url)
    query = _apply_name_search(query, Game.name, term)
    games = query.limit(limit).all()

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
async def list_gpus(session: Session = Depends(get_session)):
    gpus = session.query(GPU).with_entities(GPU.id, GPU.name).all()
    return {"gpus": [{"id": str(g.id), "name": g.name} for g in gpus]}


@hardware_router.get("/cpus")
async def list_cpus(session: Session = Depends(get_session)):
    cpus = session.query(CPU).with_entities(CPU.id, CPU.name).all()
    return {"cpus": [{"id": str(c.id), "name": c.name} for c in cpus]}


@hardware_router.get("/games")
async def list_games(session: Session = Depends(get_session)):
    """Lista todos os jogos disponíveis com nome e URL da imagem."""
    games = session.query(Game).with_entities(
        Game.id,
        Game.name,
        Game.image_url,
    ).all()
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
