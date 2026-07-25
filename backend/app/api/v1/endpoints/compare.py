from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.db.session import get_cockroach_db
from app.services.drug_compare_service import drug_compare_service

router = APIRouter()

class DrugCompareRequest(BaseModel):
    drug_a_id: str
    drug_b_id: str

@router.post("/drugs")
def compare_drugs(
    payload: DrugCompareRequest,
    db: Session = Depends(get_cockroach_db)
):
    return drug_compare_service.compare_drugs(
        db, drug_a_id=payload.drug_a_id, drug_b_id=payload.drug_b_id
    )
