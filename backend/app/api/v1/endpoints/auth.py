from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_cockroach_db
from app.models.graph import User
from app.schemas.user import LoginRequest
from app.core.security import verify_password, create_access_token, get_current_user, seed_default_superadmin

router = APIRouter()

@router.post("/login")
def login(
    payload: LoginRequest,
    db: Session = Depends(get_cockroach_db)
):
    seed_default_superadmin(db)

    user = db.query(User).filter(User.username == payload.username).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(data={"sub": user.username, "role": user.role})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": str(user.id),
            "username": user.username,
            "role": user.role,
            "created_at": user.created_at.isoformat() if user.created_at else None
        }
    }

@router.get("/me")
def get_current_user_profile(
    current_user: User = Depends(get_current_user)
):
    return {
        "id": str(current_user.id),
        "username": current_user.username,
        "role": current_user.role,
        "created_at": current_user.created_at.isoformat() if current_user.created_at else None
    }
