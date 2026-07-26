from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.session import get_cockroach_db
from app.services.counterfactual_engine import counterfactual_engine

router = APIRouter()

@router.get("/knockout")
def simulate_gene_knockout(
    node_id: str,
    max_depth: int = Query(3, le=5),
    db: Session = Depends(get_cockroach_db)
):
    return counterfactual_engine.simulate_knockout(db, target_node_id=node_id, max_depth=max_depth)
