from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_cockroach_db
from app.schemas.graph import HypothesisResponse
from app.models.graph import Hypothesis

router = APIRouter()

@router.get("", response_model=List[HypothesisResponse])
def list_hypotheses(
    limit: int = 50,
    db: Session = Depends(get_cockroach_db)
):
    return db.query(Hypothesis).order_by(Hypothesis.confidence_score.desc()).limit(limit).all()
