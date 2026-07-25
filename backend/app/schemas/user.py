from typing import Optional, List, Any
from pydantic import BaseModel
from datetime import datetime
from uuid import UUID

class UserBase(BaseModel):
    username: str
    role: str = "user"  # superadmin | user

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: Any
    created_at: Optional[Any] = None

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any] if False else Any

class LoginRequest(BaseModel):
    username: str
    password: str
