from model.consume import GAME_DF
from fastapi import APIRouter, Request, HTTPException, Depends
from fps_api.limiter import limiter
from fps_api.dependencies import get_session, get_current_user_id
from fps_api.schemas import (
    AddGameUserSchema,
    GameSchema,
    GameListSchema,
    GameInfoSchema,
    GameListInfoSchema,
    GameInfoResponseSchema,
)
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fps_api.build_db import Users, Game, GameUser

game_router = APIRouter(prefix="/games", tags=["games, analysis"])


@game_router.get("/list")
@limiter.limit("5/minute")
async def list_games(request: Request):
    return {"games": GAME_DF['name'].dropna().unique().tolist()}


@game_router.post("/include")
@limiter.limit("5/minute")
async def include(
    request: Request,
    game_schema: AddGameUserSchema,
    user_id=Depends(get_current_user_id),
    session: AsyncSession = Depends(get_session),
):
    try:
        stmt = select(GameUser).where(
            GameUser.user_id == user_id,
            GameUser.game_id == game_schema.game_id,
        )
        db_result = await session.execute(stmt)
        existing_entry = db_result.scalars().first()

        if existing_entry:
            has_changes = (
                existing_entry.preset != game_schema.preset or
                existing_entry.resolution != game_schema.resolution or
                existing_entry.upscaling != game_schema.upscaling or
                existing_entry.avg_fps != game_schema.avg_fps or
                existing_entry.min_fps != game_schema.min_fps or
                existing_entry.max_fps != game_schema.max_fps
            )

            if has_changes:
                existing_entry.preset = game_schema.preset
                existing_entry.resolution = game_schema.resolution
                existing_entry.upscaling = game_schema.upscaling
                existing_entry.avg_fps = game_schema.avg_fps
                existing_entry.min_fps = game_schema.min_fps
                existing_entry.max_fps = game_schema.max_fps

                await session.commit()
                return {"status": "ok", "message": "game benchmark updated"}
            else:
                return {"status": "ok", "message": "game benchmark already up to date"}

        else:
            new_item = GameUser(
                user_id=user_id,
                game_id=game_schema.game_id,
                avg_fps=game_schema.avg_fps,
                min_fps=game_schema.min_fps,
                max_fps=game_schema.max_fps,
                preset=game_schema.preset,
                resolution=game_schema.resolution,
                upscaling=game_schema.upscaling,
            )

            session.add(new_item)
            await session.commit()
            return {"status": "ok", "message": "game inserted"}

    except Exception as e:
        await session.rollback()
        print(f"Erro no /games/include: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")


@game_router.get("/user_list", response_model=GameListSchema)
@limiter.limit("5/minute")
async def user_list(
    request: Request,
    user_id=Depends(get_current_user_id),
    session: AsyncSession = Depends(get_session),
):
    stmt = (
        select(GameUser, Game.name.label("game_name"), Game.image_url.label("image_url"))
        .join(Game, Game.id == GameUser.game_id)
        .where(GameUser.user_id == user_id)
    )
    db_result = await session.execute(stmt)
    user_games = db_result.all()

    return GameListSchema(
        status="ok",
        items=[
            GameSchema(
                game_name=game_name,
                game_id=gu.game_id,
                image_url=image_url,
                avg_fps=gu.avg_fps,
                min_fps=gu.min_fps,
                max_fps=gu.max_fps,
                preset=gu.preset,
                resolution=gu.resolution,
                upscaling=gu.upscaling,
            )
            for gu, game_name, image_url in user_games
        ]
    )


@game_router.get("/all-info", response_model=GameListInfoSchema)
@limiter.limit("10/minute")
async def list_games_with_info(request: Request, session: AsyncSession = Depends(get_session)):
    """
    Lista todos os jogos disponíveis com nome e URL da imagem.

    Returns:
        GameListInfoSchema com lista de jogos contendo id, name e image_url
    """
    stmt = select(Game.id, Game.name, Game.image_url)
    db_result = await session.execute(stmt)
    games = db_result.all()

    return GameListInfoSchema(
        status="ok",
        count=len(games),
        games=[
            GameInfoSchema(
                id=g.id,
                name=g.name,
                image_url=g.image_url,
            )
            for g in games
        ]
    )


@game_router.get("/{game_identifier}/info", response_model=GameInfoResponseSchema)
@limiter.limit("10/minute")
async def get_game_info(
    request: Request,
    game_identifier: str,
    session: AsyncSession = Depends(get_session)
):
    """
    Recupera informações de um jogo específico (nome e URL da imagem).

    Busca por UUID ou por nome (usando vector similarity search).

    Args:
        game_identifier: UUID do jogo ou nome (será buscar por similaridade)

    Returns:
        GameInfoResponseSchema com id, name e image_url do jogo

    Raises:
        HTTPException: 404 se jogo não encontrado
    """
    # Lazy import para evitar sentence_transformers no startup
    from model.text_func import retrieval_game_info

    game_info = await retrieval_game_info(game_identifier, session)

    return GameInfoResponseSchema(
        status="ok",
        game=GameInfoSchema(**game_info)
    )


@game_router.get("/recent", response_model=GameListSchema)
@limiter.limit("10/minute")
async def recent_global_estimates(request: Request, session: AsyncSession = Depends(get_session)):
    """Busca as 3 últimas estimativas globais usando a ordenação nativa do banco."""

    stmt = (
        select(GameUser, Game.name.label("game_name"), Game.image_url.label("image_url"))
        .join(Game, Game.id == GameUser.game_id)
        .order_by(GameUser.updated_at.desc())
        .limit(3)
    )
    db_result = await session.execute(stmt)
    recent_games = db_result.all()

    return GameListSchema(
        status="ok",
        items=[
            GameSchema(
                game_name=game_name,
                game_id=gu.game_id,
                image_url=image_url,
                avg_fps=gu.avg_fps,
                min_fps=gu.min_fps,
                max_fps=gu.max_fps,
                preset=gu.preset,
                resolution=gu.resolution,
                upscaling=gu.upscaling,
            )
            for gu, game_name, image_url in recent_games
        ]
    )
