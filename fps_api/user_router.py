from fastapi import Request, APIRouter, HTTPException, Depends
from fps_api.schemas import UserBase, UserResponse, UserAlterSetup, UserAlter
from fps_api.limiter import limiter 
from sqlalchemy.orm import Session
from fps_api.dependencies import get_current_user_id, get_session
from fps_api.build_db import Users

user_router = APIRouter(prefix="/profile", tags=["profile", "edit", "setup"])


@user_router.post("/edit_setup", response_model=UserResponse)
@limiter.limit("5/minute")
async def edit_setup(request: Request, data: UserAlterSetup, session:Session=Depends(get_session), user_id:int=Depends(get_current_user_id)):
    user = session.query(Users).filter(Users.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not Found")
    
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(user, field, value)

    session.commit()

    return UserResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        profile_photo=user.profile_photo, 
        gpu=user.gpu,
        cpu=user.cpu,
        ram=user.ram,
    )

@user_router.post("/edit", response_model=UserResponse)
@limiter.limit("5/minute")
async def edit_profile(request: Request, data: UserAlter, session:Session=Depends(get_session), user_id:int=Depends(get_current_user_id)):
    user = session.query(Users).filter(Users.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not Found")
    
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(user, field, value)

    session.commit()

    return UserResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        profile_photo=user.profile_photo, 
        gpu=user.gpu,
        cpu=user.cpu,
        ram=user.ram,
    )