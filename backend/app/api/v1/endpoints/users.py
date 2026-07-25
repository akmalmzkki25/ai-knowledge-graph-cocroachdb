from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_cockroach_db
from app.models.graph import User
from app.schemas.user import UserCreate
from app.core.security import get_current_superadmin, get_password_hash

router = APIRouter()

@router.get("")
def list_users(
    db: Session = Depends(get_cockroach_db),
    admin: User = Depends(get_current_superadmin)
):
    users = db.query(User).all()
    return [
        {
            "id": str(u.id),
            "username": u.username,
            "role": u.role,
            "created_at": u.created_at.isoformat() if u.created_at else None
        }
        for u in users
    ]

@router.post("")
def create_user(
    payload: UserCreate,
    db: Session = Depends(get_cockroach_db),
    admin: User = Depends(get_current_superadmin)
):
    existing = db.query(User).filter(User.username == payload.username).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Username '{payload.username}' already exists."
        )

    new_user = User(
        username=payload.username,
        hashed_password=get_password_hash(payload.password),
        role=payload.role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return {
        "id": str(new_user.id),
        "username": new_user.username,
        "role": new_user.role,
        "created_at": new_user.created_at.isoformat() if new_user.created_at else None
    }
