from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_cockroach_db
from app.services.report_service import report_service

router = APIRouter()

@router.post("/generate")
def generate_executive_report(db: Session = Depends(get_cockroach_db)):
    return report_service.generate_research_report(db)
