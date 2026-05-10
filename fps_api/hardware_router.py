from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from fps_api.build_db import CPU, GPU, Game
from fps_api.dependencies import get_session

hardware_router = APIRouter(prefix="/hardware", tags=["hardware"])

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
        Game.image_url
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
