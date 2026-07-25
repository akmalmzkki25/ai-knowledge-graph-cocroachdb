from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db.session import get_postgres_db, get_cockroach_db
from app.core.config import settings

router = APIRouter()

@router.get("/health")
def health_check(
    pg_db: Session = Depends(get_postgres_db),
    cr_db: Session = Depends(get_cockroach_db)
):
    status = {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "environment": settings.FASTAPI_ENV,
        "postgres": "disconnected",
        "cockroach": "disconnected"
    }
    
    try:
        pg_db.execute(text("SELECT 1"))
        status["postgres"] = "connected"
    except Exception as e:
        status["postgres"] = f"error: {str(e)}"
        
    try:
        cr_db.execute(text("SELECT 1"))
        status["cockroach"] = "connected"
    except Exception as e:
        status["cockroach"] = f"error: {str(e)}"
        
    return status
