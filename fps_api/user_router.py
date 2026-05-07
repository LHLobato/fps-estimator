from fastapi import Request, APIRouter, HTTPException, Depends, status
from sqlalchemy import text
from sqlalchemy.orm import Session
from fps_api.schemas import UserResponse, UserAlterSetup, UserAlter
from fps_api.limiter import limiter
from fps_api.dependencies import get_current_user_id, get_session
from fps_api.build_db import Users
from model.text_func import get_embedding


user_router = APIRouter(prefix="/profile", tags=["profile", "edit", "setup"])

@user_router.post("/edit_setup", response_model=UserResponse)
@limiter.limit("5/minute")
async def edit_setup(request: Request, data: UserAlterSetup, session: Session = Depends(get_session), user_id: int = Depends(get_current_user_id)):
    user = session.query(Users).filter(Users.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not Found")

    if data.gpu:
        gpu_embedding = await get_embedding(data.gpu)
        gpu_id = session.execute(
            text("SELECT id FROM gpus ORDER BY embedding <=> CAST(:vec AS vector) LIMIT 1"),
            {"vec": str(gpu_embedding)}
        ).scalar()
        if gpu_id:
            user.gpu_id = gpu_id
        else:
            raise HTTPException(status_code=404, detail="GPU not found in database")

    if data.cpu:
        cpu_embedding = await get_embedding(data.cpu)
        cpu_id = session.execute(
            text("SELECT id FROM cpus ORDER BY embedding <=> CAST(:vec AS vector) LIMIT 1"),
            {"vec": str(cpu_embedding)}
        ).scalar()
        if cpu_id:
            user.cpu_id = cpu_id
        else:
            raise HTTPException(status_code=404, detail="CPU not found in database")

    if data.ram:
        user.ram = data.ram

    session.commit()
    session.refresh(user)

    return UserResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        profile_photo=user.profile_photo,
        gpu_id=user.gpu_id,
        cpu_id=user.cpu_id,
        ram=user.ram,
    )

@user_router.post("/edit", response_model=UserResponse)
@limiter.limit("5/minute")
async def edit_profile(request: Request, data: UserAlter, session: Session = Depends(get_session), user_id: int = Depends(get_current_user_id)):
    user = session.query(Users).filter(Users.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not Found")


    for field, value in data.model_dump(exclude_none=True).items():

        if field == "gpu":
            gpu_embedding = await get_embedding(value)
            user.gpu_id = session.execute(
                text("SELECT id FROM gpus ORDER BY embedding <=> CAST(:vec AS vector) LIMIT 1"),
                {"vec": str(gpu_embedding)}
            ).scalar()
        elif field == "cpu":
            cpu_embedding = await get_embedding(value)
            user.cpu_id = session.execute(
                text("SELECT id FROM cpus ORDER BY embedding <=> CAST(:vec AS vector) LIMIT 1"),
                {"vec": str(cpu_embedding)}
            ).scalar()
        else:

            setattr(user, field, value)

    session.commit()
    session.refresh(user)

    return UserResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        profile_photo=user.profile_photo,
        gpu_id=user.gpu_id,
        cpu_id=user.cpu_id,
        ram=user.ram,
    )
