import json
from uuid import UUID

from fastapi import APIRouter, HTTPException, Request, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from model.consume import send_question
from fps_api.schemas import InputSchema, ModelOutputSchema, AuthInputSchema
from fps_api.limiter import limiter
from fps_api.dependencies import get_current_user_id, get_session
from fps_api.build_db import Users

llm_router = APIRouter(
    prefix="/estimate", tags=["estimate, llm, regression"]
)


@llm_router.post("/ask_llm", response_model=ModelOutputSchema)
@limiter.limit("5/minute")
async def estimate(
    request: Request,
    input: InputSchema,
    session: AsyncSession = Depends(get_session),
) -> ModelOutputSchema:
    components = {'gpu': input.gpu, 'cpu': input.cpu, 'ram': input.ram}
    try:
        estimated_fps = await send_question(
            components, input.gamename, input.preset, input.resolution, input.upscaling, session
        )
        return json.loads(estimated_fps)
    except HTTPException as e:
        raise e
    except json.JSONDecodeError:
        raise HTTPException(status_code=502, detail="O modelo retornou um JSON inválido. Tente novamente.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")


@llm_router.post("/ask_llm/auth", response_model=ModelOutputSchema)
@limiter.limit("5/minute")
async def estimate_auth(
    request: Request,
    input: AuthInputSchema,
    user_id: UUID = Depends(get_current_user_id),
    session: AsyncSession = Depends(get_session),
):
    stmt = select(Users).where(Users.id == user_id)
    result = await session.execute(stmt)
    user = result.scalars().first()

    if not user:
        raise HTTPException(status_code=404, detail="User Not Found")
    if not all([user.gpu_id, user.cpu_id, user.ram]):
        raise HTTPException(status_code=400, detail="Complete your hardware profile before using this route")

    components = {'gpu': user.gpu_id, 'cpu': user.cpu_id, 'ram': user.ram}
    try:
        estimated_fps = await send_question(
            components, input.gamename, input.preset, input.resolution, input.upscaling, session
        )
        return json.loads(estimated_fps)
    except HTTPException as e:
        raise e
    except json.JSONDecodeError:
        raise HTTPException(status_code=502, detail="O modelo retornou um JSON inválido. Tente novamente.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")