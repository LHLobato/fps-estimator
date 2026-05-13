from model.consume import GAME_DF
from fastapi import APIRouter, Request, HTTPException, Depends
from fps_api.limiter import limiter
from fps_api.dependencies import get_session, get_current_user_id
from fps_api.schemas import (
    GameSchema,
    GameListSchema,
    GameInfoSchema,
    GameListInfoSchema,
    GameInfoResponseSchema,
)
from sqlalchemy.orm import Session
from fps_api.build_db import Users, Game, GameUser
from model.text_func import retrieval_game_info

game_router = APIRouter(prefix="/games", tags=["games, analysis"])

@game_router.get("/list")
@limiter.limit("5/minute")
async def list_games(request:Request, session:Session=Depends(get_session)):
    return {"games": GAME_DF['name'].dropna().unique().tolist()}

@game_router.post("/include")
@limiter.limit("5/minute")
async def include(request:Request, game_schema: GameSchema, user_id: int=Depends(get_current_user_id), session:Session=Depends(get_session)):
    item = GameUser(
            user_id=user_id,
            game_id = game_schema.game_id,
            avg_fps = game_schema.avg_fps,
            min_fps = game_schema.min_fps,
            max_fps = game_schema.max_fps,
            preset = game_schema.preset,
            resolution = game_schema.resolution,
            upscaling = game_schema.upscaling
    )

    try:
        session.add(item)
        session.commit()
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal Server Error")

    return {
        "status": "ok",
        "message": "game inserted"
    }

@game_router.get("/user_list", response_model=GameListSchema)
@limiter.limit("5/minute")
async def user_list(request: Request, user_id: int = Depends(get_current_user_id), session: Session = Depends(get_session)):
    user_games = (
        session.query(GameUser, Game.name.label("game_name"))
        .join(Game, Game.id == GameUser.game_id)
        .filter(GameUser.user_id == user_id)
        .all()
    )

    return GameListSchema(
        status="ok",
        items=[
            GameSchema(
                game_name=game_name,
                game_id = gu.game_id,
                avg_fps=gu.avg_fps,
                min_fps=gu.min_fps,
                max_fps=gu.max_fps,
                preset=gu.preset,
                resolution=gu.resolution,
                upscaling=gu.upscaling,
            )
            for gu, game_name in user_games
        ]
    )


@game_router.get("/all-info", response_model=GameListInfoSchema)
@limiter.limit("10/minute")
async def list_games_with_info(request: Request, session: Session = Depends(get_session)):
    """
    Lista todos os jogos disponíveis com nome e URL da imagem.

    Returns:
        GameListInfoSchema com lista de jogos contendo id, name e image_url
    """
    games = session.query(Game).with_entities(
        Game.id,
        Game.name,
        Game.image_url
    ).all()

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
    session: Session = Depends(get_session)
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
    game_info = await retrieval_game_info(game_identifier, session)

    return GameInfoResponseSchema(
        status="ok",
        game=GameInfoSchema(**game_info)
    )
    }
