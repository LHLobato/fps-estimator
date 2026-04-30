from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID

class InputSchema(BaseModel):
    gamename: str
    preset: str
    resolution: str
    upscaling: str
    gpu: str
    cpu: str
    ram: str

class AuthInputSchema(BaseModel):
    gamename: str
    preset: str
    resolution: str
    upscaling: str

class ModelOutputSchema(BaseModel):
    avg_fps: int
    min_fps: int
    max_fps: int

class UserBase(BaseModel):
    name: Optional[str] = None
    email: str

    class Config:
        from_attributes = True


class UserAlter(UserBase):
    profile_photo: Optional[str]


class UserAlterSetup(UserBase):
    gpu: Optional[str] = None
    cpu: Optional[str] = None
    ram: Optional[str] = None

class UserCreate(UserBase):
    password: str
    profile_photo: Optional[str]
    gpu: Optional[str] = None
    cpu: Optional[str] = None
    ram: Optional[str] = None


class UserResponse(UserBase):
    id: UUID
    profile_photo: Optional[str] = None
    gpu: Optional[str] = None
    cpu: Optional[str] = None
    ram: Optional[str] = None

    class Config:
        from_attributes = True


class LoginSchema(BaseModel):
    email: str
    password: str

    class Config:
        from_attributes = True


class CodeSchema(BaseModel):
    email: str
    code: str

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class UserSignupResponse(BaseModel):
    status: str
    message: str
    user_id: UUID

class PasswordReset(BaseModel):
        new_password: str
        reset_token: str

        class Config:
            from_attributes = True

class GameSchema(BaseModel):
    game_name: str
    game_id: UUID
    avg_fps: int
    min_fps: int
    max_fps: int
    preset: str
    resolution: str
    upscaling: str

    class Config:
            from_attributes = True

class GameListSchema(BaseModel):
    status: str
    items: Optional[List[GameSchema]] = None
