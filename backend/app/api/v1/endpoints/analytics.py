from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_cockroach_db
from app.services.analytics_service import analytics_engine

router = APIRouter()

@router.get("/stats")
def get_graph_analytics(db: Session = Depends(get_cockroach_db)):
    return analytics_engine.get_network_statistics(db)
