"""
Router para endpoints de autocomplete do frontend.
Fornece dados completos de CPUs, GPUs e jogos para cache no cliente.
"""
from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fps_api.build_db import CPU, GPU, Game
from fps_api.dependencies import get_session
from fps_api.schemas import (
    AutocompleteDataSchema,
    AutocompleteItemSchema,
)

autocomplete_router = APIRouter(prefix="/autocomplete", tags=["autocomplete"])


@autocomplete_router.get("/data", response_model=AutocompleteDataSchema)
async def get_autocomplete_data(session: AsyncSession = Depends(get_session)):
    """
    Retorna todos os CPUs, GPUs e jogos para autocomplete no frontend.

    O frontend deve fazer cache desta resposta localmente para evitar múltiplas requisições.

    Returns:
        AutocompleteDataSchema com listas de CPUs, GPUs e Games
        - Cada item tem: id, name, type, image_url (opcional)
        - total_items: Contagem total de itens
        - timestamp: Momento da requisição (ISO 8601)

    Rate Limit: Sem limite explícito (use cache no frontend)

    Example:
        >>> response = requests.get("/autocomplete/data")
        >>> data = response.json()
        >>> cpus = [item['name'] for item in data['cpus']]
        >>> gpus = [item['name'] for item in data['gpus']]
        >>> games = [item['name'] for item in data['games']]
    """
    # Buscar todos os CPUs
    cpu_result = await session.execute(select(CPU.id, CPU.name))
    cpu_items = [
        AutocompleteItemSchema(
            id=cpu.id,
            name=cpu.name,
            type="cpu",
            image_url=None,  # CPUs não têm imagem
        )
        for cpu in cpu_result.all()
    ]

    # Buscar todos os GPUs
    gpu_result = await session.execute(select(GPU.id, GPU.name))
    gpu_items = [
        AutocompleteItemSchema(
            id=gpu.id,
            name=gpu.name,
            type="gpu",
            image_url=None,  # GPUs podem ter imagem se adicionado no futuro
        )
        for gpu in gpu_result.all()
    ]

    # Buscar todos os Games
    game_result = await session.execute(select(Game.id, Game.name, Game.image_url))
    game_items = [
        AutocompleteItemSchema(
            id=game.id,
            name=game.name,
            type="game",
            image_url=game.image_url,
        )
        for game in game_result.all()
    ]

    total_items = len(cpu_items) + len(gpu_items) + len(game_items)

    return AutocompleteDataSchema(
        status="ok",
        timestamp=datetime.now(timezone.utc).isoformat(),
        cpus=cpu_items,
        gpus=gpu_items,
        games=game_items,
        total_items=total_items,
    )


@autocomplete_router.get("/cpus", response_model=list[AutocompleteItemSchema])
async def get_cpus_for_autocomplete(session: AsyncSession = Depends(get_session)):
    """
    Retorna apenas a lista de CPUs para autocomplete.

    Returns:
        List[AutocompleteItemSchema] com CPUs disponíveis
    """
    result = await session.execute(select(CPU.id, CPU.name))
    return [
        AutocompleteItemSchema(
            id=cpu.id,
            name=cpu.name,
            type="cpu",
            image_url=None,
        )
        for cpu in result.all()
    ]


@autocomplete_router.get("/gpus", response_model=list[AutocompleteItemSchema])
async def get_gpus_for_autocomplete(session: AsyncSession = Depends(get_session)):
    """
    Retorna apenas a lista de GPUs para autocomplete.

    Returns:
        List[AutocompleteItemSchema] com GPUs disponíveis
    """
    result = await session.execute(select(GPU.id, GPU.name))
    return [
        AutocompleteItemSchema(
            id=gpu.id,
            name=gpu.name,
            type="gpu",
            image_url=None,
        )
        for gpu in result.all()
    ]


@autocomplete_router.get("/games", response_model=list[AutocompleteItemSchema])
async def get_games_for_autocomplete(session: AsyncSession = Depends(get_session)):
    """
    Retorna apenas a lista de Games para autocomplete.

    Returns:
        List[AutocompleteItemSchema] com Games disponíveis
    """
    result = await session.execute(select(Game.id, Game.name, Game.image_url))
    return [
        AutocompleteItemSchema(
            id=game.id,
            name=game.name,
            type="game",
            image_url=game.image_url,
        )
        for game in result.all()
    ]