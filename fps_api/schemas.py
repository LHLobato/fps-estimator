from pydantic import BaseModel
from typing import Optional

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


class UserCreate(UserBase):
    password: str
    gpu: Optional[str] = None
    cpu: Optional[str] = None
    ram: Optional[str] = None


class UserResponse(UserBase):
    id: int
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
    user_id: int

class PasswordReset(BaseModel):
        new_password: str
        reset_token: str

        class Config:
            from_attributes = True
