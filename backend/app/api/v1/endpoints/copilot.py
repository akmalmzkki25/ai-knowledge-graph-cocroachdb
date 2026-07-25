from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.db.session import get_cockroach_db
from app.services.copilot_service import copilot_service

router = APIRouter()

class CopilotQueryRequest(BaseModel):
    query: str

@router.post("/chat")
def ask_copilot(
    payload: CopilotQueryRequest,
    db: Session = Depends(get_cockroach_db)
):
    return copilot_service.answer_question(db, user_query=payload.query)
