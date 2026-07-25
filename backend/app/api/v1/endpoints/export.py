from fastapi import APIRouter, Depends
from fastapi.responses import Response, PlainTextResponse, JSONResponse
from sqlalchemy.orm import Session
from app.db.session import get_cockroach_db
from app.services.exporter import exporter_service

router = APIRouter()

@router.get("/json-ld")
def export_json_ld(db: Session = Depends(get_cockroach_db)):
    data = exporter_service.export_json_ld(db)
    return JSONResponse(content=data, media_type="application/ld+json")

@router.get("/marp", response_class=PlainTextResponse)
def export_marp_slides(db: Session = Depends(get_cockroach_db)):
    markdown_content = exporter_service.export_marp_slides(db)
    return Response(
        content=markdown_content, 
        media_type="text/markdown",
        headers={"Content-Disposition": "attachment; filename=hypotheses_presentation.md"}
    )

@router.get("/csv", response_class=PlainTextResponse)
def export_csv_edges(db: Session = Depends(get_cockroach_db)):
    csv_content = exporter_service.export_edges_csv(db)
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=knowledge_graph_edges.csv"}
    )
