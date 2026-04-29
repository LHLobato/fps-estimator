from model.consume import GPU_DF, CPU_DF
from fastapi import APIRouter

hardware_router = APIRouter(prefix="/hardware")

@hardware_router.get("/hardware/gpus")
async def list_gpus():
    return {"gpus": GPU_DF['Name'].dropna().unique().tolist()}

@hardware_router.get("/hardware/cpus")
async def list_cpus():
    return {"cpus": CPU_DF['name'].dropna().unique().tolist()}
