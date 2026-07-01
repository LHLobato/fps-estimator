import os
import asyncio
from concurrent.futures import ThreadPoolExecutor
from fastapi import HTTPException
# from sentence_transformers import SentenceTransformer  # Lazy import
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text, select
import uuid
from fps_api.build_db import GPU, CPU, Game

_model = None
NUM_WORKERS = os.cpu_count() or 2
executor = ThreadPoolExecutor(max_workers=NUM_WORKERS)


def is_valid_uuid(val: str) -> bool:
    try:
        uuid.UUID(str(val))
        return True
    except ValueError:
        return False


def _get_model():
    global _model
    if _model is None:
        from sentence_transformers import SentenceTransformer
        _model = SentenceTransformer("all-MiniLM-L6-v2")
    return _model


def _encode(text: str) -> list:
    return _get_model().encode(text).tolist()


async def get_embedding(text: str) -> list:
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(executor, _encode, text)


GPU_COLS = [
    "name",
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


async def retrieval_gpu_feat(gpu_name: str, session: AsyncSession) -> str:
    if is_valid_uuid(gpu_name):
        stmt = select(GPU).where(GPU.id == gpu_name)
        db_result = await session.execute(stmt)
        result = db_result.scalars().first()
    else:
        embedding = await get_embedding(gpu_name)
        db_result = await session.execute(
            text("""
                SELECT * FROM gpus
                ORDER BY embedding <=> CAST(:vec AS vector)
                LIMIT 1
            """),
            {"vec": str(embedding)}
        )
        result = db_result.first()
    if not result:
        raise HTTPException(status_code=404, detail=f"GPU '{gpu_name}' não encontrada")
    return _format_row(result, GPU_COLS)


CPU_COLS = [
    "name",
    "date", "socket", "category", "speed", "turbo",
    "cores", "threads", "l1_cache", "l2_cache", "l3_cache",
]


async def retrieval_cpu_feat(cpu_name: str, session: AsyncSession) -> str:
    if is_valid_uuid(cpu_name):
        stmt = select(CPU).where(CPU.id == cpu_name)
        db_result = await session.execute(stmt)
        result = db_result.scalars().first()
    else:
        embedding = await get_embedding(cpu_name)
        db_result = await session.execute(
            text("""
                SELECT * FROM cpus
                ORDER BY embedding <=> CAST(:vec AS vector)
                LIMIT 1
            """),
            {"vec": str(embedding)}
        )
        result = db_result.first()
    if not result:
        raise HTTPException(status_code=404, detail=f"CPU '{cpu_name}' não encontrada")
    return _format_row(result, CPU_COLS)


async def retrieval_game_info(game_name: str, session: AsyncSession) -> dict:
    """
    Recupera informações de um jogo (nome e URL da imagem).

    Busca por UUID ou por similaridade de embedding.

    Args:
        game_name: Nome do jogo ou UUID
        session: Sessão assíncrona do banco de dados

    Returns:
        Dict com id, name e image_url do jogo

    Raises:
        HTTPException: 404 se jogo não encontrado
    """
    if is_valid_uuid(game_name):
        stmt = select(Game).where(Game.id == game_name)
        db_result = await session.execute(stmt)
        result = db_result.scalars().first()
    else:
        embedding = await get_embedding(game_name)
        db_result = await session.execute(
            text("""
                SELECT * FROM games
                ORDER BY embedding <=> CAST(:vec AS vector)
                LIMIT 1
            """),
            {"vec": str(embedding)}
        )
        result = db_result.first()
    if not result:
        raise HTTPException(status_code=404, detail=f"Jogo '{game_name}' não encontrado")
    return {
        "id": str(result.id),
        "name": result.name,
        "image_url": result.image_url,
    }