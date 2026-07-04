from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from fastapi.responses import FileResponse
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from slowapi import _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
# Import auth_config primeiro para carregar .env
import fps_api.auth_config
from fps_api.llm_router import llm_router
from fps_api.hardware_router import hardware_router
from fps_api.limiter import limiter
from fps_api.auth_router import auth_router
from fps_api.game_router import game_router
from fps_api.user_router import user_router
from fps_api.autocomplete_router import autocomplete_router
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Lazy import para evitar carregar sentence_transformers no startup
    from model.text_func import executor
    yield
    executor.shutdown(wait=True)

app = FastAPI(lifespan=lifespan)

# CORS: origens fixas + regex para Vite/Cursor em portas dinâmicas (ex.: :58871)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost",
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:5176",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
    ],
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.get("/health")
async def health():
    return {"status":"ok", "message": "welcome to our project."}

app.include_router(llm_router)
app.include_router(hardware_router)
app.include_router(auth_router)
app.include_router(game_router)
app.include_router(user_router)
app.include_router(autocomplete_router)


FRONTEND_DIST = os.path.join(os.path.dirname(__file__), "..", "client", "dist")

@app.get("/{full_path:path}")
async def serve_frontend(full_path: str):
    # Se o arquivo existir de fato (JS, CSS, favicon etc.), serve ele
    candidate = os.path.join(FRONTEND_DIST, full_path)
    if full_path and os.path.isfile(candidate):
        return FileResponse(candidate)
    # Qualquer outra rota (ex: /profile, /login) é do React Router → cai no index.html
    return FileResponse(os.path.join(FRONTEND_DIST, "index.html"))