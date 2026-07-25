from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_cockroach_db
from app.services.graph_linter import graph_linter

router = APIRouter()

@router.get("/contradictions")
def run_graph_contradiction_lint(
    db: Session = Depends(get_cockroach_db)
):
    contradictions = graph_linter.scan_contradictions(db)
    return {
        "total_contradictions": len(contradictions),
        "contradictions": contradictions
    }
