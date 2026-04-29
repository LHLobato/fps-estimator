from model.consume import GAME_DF
from fastapi import APIRouter, Request, HTTPException, Depends
from fps_api.limiter import limiter
from fps_api.dependencies import get_session, get_current_user_id
from fps_api.schemas import GameSchema, GameListSchema
from sqlalchemy.orm import Session
from fps_api.build_db import Users,Game, GameUser

game_router = APIRouter(prefix="/games", tags=["games, analysis"])

@game_router.get("/list")
@limiter.limit("5/minute")
async def list_games(request:Request):
    return {"games": GAME_DF['Name'].dropna().unique().tolist()}

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
