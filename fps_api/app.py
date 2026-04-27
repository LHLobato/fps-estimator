from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fps_api.llm_router import llm_router
from fps_api.hardware_router import hardware_router

limiter = Limiter(key_func=get_remote_address)

app = FastAPI()

origins=[
    "http://localhost",
    "http://localhost:5173",
]
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware, allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

@app.get("/heatlh")
async def health():
    return {"status":"ok", "message": "welcome to our project."}

app.include_router(llm_router)
app.include_router(hardware_router)
