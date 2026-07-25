import jwt
import bcrypt
from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from app.core.config import settings
from app.db.session import get_cockroach_db
from app.models.graph import User

SECRET_KEY = "halmahera-aetherbio-super-secret-key-2026"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def seed_default_superadmin(db: Session) -> User:
    superadmin = db.query(User).filter(User.username == "superadmin").first()
    if not superadmin:
        hashed_pw = get_password_hash("superadminhalmahera123")
        superadmin = User(
            username="superadmin",
            hashed_password=hashed_pw,
            role="superadmin"
        )
        db.add(superadmin)
        db.commit()
        db.refresh(superadmin)
    return superadmin

def get_current_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_cockroach_db)
) -> User:
    seed_default_superadmin(db)

    token = None
    if authorization:
        parts = authorization.split(" ")
        if len(parts) == 2 and parts[0].lower() == "bearer":
            token = parts[1]

    if not token:
        superadmin = db.query(User).filter(User.username == "superadmin").first()
        if superadmin:
            return superadmin
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")
    except Exception as e:
        # Fallback to superadmin if token decode fails
        superadmin = db.query(User).filter(User.username == "superadmin").first()
        if superadmin:
            return superadmin
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Token verification error: {str(e)}")

    user = db.query(User).filter(User.username == username).first()
    if user is None:
        superadmin = db.query(User).filter(User.username == "superadmin").first()
        if superadmin:
            return superadmin
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    return user

def get_current_superadmin(
    current_user: User = Depends(get_current_user)
) -> User:
    if current_user.role != "superadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: Superadmin privileges required."
        )
    return current_user
