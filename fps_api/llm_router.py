import sys
import os
from fastapi import APIRouter, HTTPException
from model.consume import send_question
from fps_api.schemas import InputSchema, ModelOutputSchema
import json
from fps_api.limiter import limiter
from fastapi import Request
import asyncio


llm_router = APIRouter(
    prefix="/estimate", tags=["estimate, llm, regression"]
)

@llm_router.post("/ask_llm", response_model=ModelOutputSchema)
@limiter.limit("5/minute")
async def estimate(request:Request, input:InputSchema)-> ModelOutputSchema:
    components = [input.gpu, input.cpu, input.ram]
    try:
        estimated_fps = await asyncio.to_thread(send_question, components, input.gamename, input.resolution, input.preset, input.upscaling)
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")

    return json.loads(estimated_fps)
