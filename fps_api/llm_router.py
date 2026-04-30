import sys
import os
from fastapi import APIRouter, HTTPException
from sqlalchemy.orm import Session
from model.consume import send_question
from fps_api.schemas import InputSchema, ModelOutputSchema, AuthInputSchema
import json
from fps_api.limiter import limiter
from fastapi import Request, Depends
import asyncio
from fps_api.dependencies import get_current_user_id, get_session
from fps_api.build_db import Users
llm_router = APIRouter(
    prefix="/estimate", tags=["estimate, llm, regression"]
)

@llm_router.post("/ask_llm", response_model=ModelOutputSchema)
@limiter.limit("5/minute")
async def estimate(request:Request, input:InputSchema)-> ModelOutputSchema:
    components = {'gpu': input.gpu, 'cpu': input.cpu, 'ram': input.ram}
    try:
        estimated_fps = await asyncio.to_thread(send_question, components, input.gamename, input.resolution, input.preset, input.upscaling)
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")

    return json.loads(estimated_fps)

@llm_router.post("/ask_llm/auth", response_model=ModelOutputSchema)
@limiter.limit("5/minute")
async def estimate_auth(request:Request, input: AuthInputSchema, user_id: int = Depends(get_current_user_id), session:Session = Depends(get_session)):
    user = session.query(Users).filter(Users.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User Not Found")

    if not all([user.gpu, user.cpu, user.ram]):
        raise HTTPException(status_code=400, detail="Complete your hardware profile before using this route")

    components = {'gpu': user.gpu, 'cpu': user.cpu, 'ram': user.ram}
    try:
        estimated_fps = await asyncio.to_thread(send_question, components, input.gamename, input.resolution, input.preset, input.upscaling)
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")

    return json.loads(estimated_fps)
