import os
import asyncio
from concurrent.futures import ProcessPoolExecutor
from fastapi import HTTPException
from sentence_transformers import SentenceTransformer
from sqlalchemy.orm import Session
from sqlalchemy import text

_model = None
NUM_WORKERS = os.cpu_count() // 2
executor = ProcessPoolExecutor(max_workers=NUM_WORKERS)

def _get_model():
    global _model
    if _model is None:
        _model = SentenceTransformer("all-MiniLM-L6-v2")
    return _model

def _encode(text: str) -> list:
    return _get_model().encode(text).tolist()

async def get_embedding(text: str) -> list:
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(executor, _encode, text)

GPU_COLS = [
    "shading_units", "boost_clock", "game_clock", "gpu_clock", "fp32",
    "mem_bandwidth", "vram", "mem_type", "mem_bus", "rops", "tmus",
    "pixel_rate", "texture_rate", "architecture", "process", "tdp",
    "rt_cores", "tensor_cores", "dx", "vulkan", "cuda", "fp16", "transistors",
]

def _format_row(row, cols: list) -> str:
    parts = []
    for col in cols:
        val = getattr(row, col, None)
        if val is None or val == "":
            continue
        parts.append(f"{col}={val}")
    return " | ".join(parts)

async def retrieval_gpu_feat(gpu_name: str, session: Session) -> str:
    embedding = await get_embedding(gpu_name)
    result = session.execute(
        text("""
            SELECT * FROM gpus
            ORDER BY embedding <=> CAST(:vec AS vector)
            LIMIT 1
        """),
        {"vec": str(embedding)}
    ).first()

    if not result:
        raise HTTPException(status_code=404, detail=f"GPU '{gpu_name}' não encontrada")

    return _format_row(result, GPU_COLS)


CPU_COLS = [
    "date", "socket", "category", "speed", "turbo",
    "cores", "threads", "l1_cache", "l2_cache", "l3_cache",
]

async def retrieval_cpu_feat(cpu_name: str, session: Session) -> str:
    embedding = await get_embedding(cpu_name)
    result = session.execute(
        text("""
            SELECT * FROM cpus
            ORDER BY embedding <=> CAST(:vec AS vector)
            LIMIT 1
        """),
        {"vec": str(embedding)}
    ).first()

    if not result:
        raise HTTPException(status_code=404, detail=f"CPU '{cpu_name}' não encontrada")

    return _format_row(result, CPU_COLS)
