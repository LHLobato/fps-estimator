from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from fps_api.build_db import CPU, GPU
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
