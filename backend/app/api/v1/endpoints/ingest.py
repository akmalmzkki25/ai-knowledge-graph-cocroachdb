import hashlib
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.db.session import get_cockroach_db
from app.schemas.graph import TextIngestRequest, ExtractionResult, CausalTriplet
from app.services.bedrock_service import bedrock_service
from app.services.pdf_service import pdf_service
from app.services.entity_resolver import entity_resolver
from app.models.graph import SourceDocument, Edge, Node, AuditLog, User
from app.core.security import get_current_user

router = APIRouter()

def clean_nul(text: str) -> str:
    if not text:
        return ""
    return text.replace("\x00", "").strip()

@router.post("/text", response_model=ExtractionResult)
def ingest_text_document(
    payload: TextIngestRequest,
    db: Session = Depends(get_cockroach_db),
    current_user: User = Depends(get_current_user)
):
    clean_content = clean_nul(payload.content)
    clean_title = clean_nul(payload.title)
    clean_authors = clean_nul(payload.authors) if payload.authors else None
    clean_doi = clean_nul(payload.doi) if payload.doi else None

    file_hash = hashlib.sha256(clean_content.encode('utf-8')).hexdigest()
    
    source_doc = db.query(SourceDocument).filter(
        SourceDocument.file_hash == file_hash,
        SourceDocument.user_id == current_user.id
    ).first()

    if not source_doc:
        source_doc = SourceDocument(
            title=clean_title,
            authors=clean_authors,
            doi=clean_doi,
            file_hash=file_hash,
            raw_content=clean_content,
            user_id=current_user.id
        )
        db.add(source_doc)
        db.commit()
        db.refresh(source_doc)

    try:
        extraction_result = bedrock_service.extract_causal_triplets(
            text_content=clean_content,
            title=clean_title
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Bedrock Extraction Error: {str(e)}"
        )

    for triplet in extraction_result.triplets:
        src_name = clean_nul(triplet.source_entity)
        src_type = clean_nul(triplet.source_type)
        tgt_name = clean_nul(triplet.target_entity)
        tgt_type = clean_nul(triplet.target_type)

        if not src_name or not tgt_name:
            continue

        source_node = entity_resolver.get_or_create_canonical_node(
            db=db, name=src_name, entity_type=src_type
        )
        target_node = entity_resolver.get_or_create_canonical_node(
            db=db, name=tgt_name, entity_type=tgt_type
        )

        edge = Edge(
            source_node_id=source_node.id,
            target_node_id=target_node.id,
            predicate=clean_nul(triplet.predicate),
            confidence_score=triplet.confidence,
            evidence_snippet=clean_nul(triplet.evidence),
            source_document_id=source_doc.id,
            user_id=current_user.id
        )
        db.add(edge)

    audit = AuditLog(
        operation_type="INGEST_TEXT",
        details_json={
            "document_id": str(source_doc.id),
            "triplets_count": len(extraction_result.triplets)
        },
        user_id=current_user.id
    )
    db.add(audit)
    db.commit()

    return extraction_result


@router.post("/pdf", response_model=ExtractionResult)

async def ingest_pdf_document(
    file: UploadFile = File(...),
    title: str = Form(None),
    authors: str = Form(None),
    doi: str = Form(None),
    db: Session = Depends(get_cockroach_db),
    current_user: User = Depends(get_current_user)
):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are accepted."
        )

    file_bytes = await file.read()
    file_hash = hashlib.sha256(file_bytes).hexdigest()
    clean_title = clean_nul(title or file.filename)
    clean_authors = clean_nul(authors) if authors else None
    clean_doi = clean_nul(doi) if doi else None

    source_doc = db.query(SourceDocument).filter(
        SourceDocument.file_hash == file_hash,
        SourceDocument.user_id == current_user.id
    ).first()

    if not source_doc:
        source_doc = SourceDocument(
            title=clean_title,
            authors=clean_authors,
            doi=clean_doi,
            file_hash=file_hash,
            raw_content=f"PDF File: {file.filename}",
            user_id=current_user.id
        )
        db.add(source_doc)
        db.commit()
        db.refresh(source_doc)

    try:
        pdf_text = pdf_service.extract_text_from_pdf(file_bytes)
        text_chunks = pdf_service.chunk_text(pdf_text, chunk_size=3000, overlap=300)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"PDF Parsing Failed: {str(e)}"
        )

    all_extracted_triplets = []

    for i, chunk in enumerate(text_chunks[:5]):
        try:
            res = bedrock_service.extract_causal_triplets(
                text_content=chunk,
                title=f"{clean_title} (Part {i+1})"
            )
            all_extracted_triplets.extend(res.triplets)
        except Exception:
            continue

    for triplet in all_extracted_triplets:
        src_name = clean_nul(triplet.source_entity)
        src_type = clean_nul(triplet.source_type)
        tgt_name = clean_nul(triplet.target_entity)
        tgt_type = clean_nul(triplet.target_type)

        if not src_name or not tgt_name:
            continue

        source_node = entity_resolver.get_or_create_canonical_node(
            db=db, name=src_name, entity_type=src_type
        )
        target_node = entity_resolver.get_or_create_canonical_node(
            db=db, name=tgt_name, entity_type=tgt_type
        )

        edge = Edge(
            source_node_id=source_node.id,
            target_node_id=target_node.id,
            predicate=clean_nul(triplet.predicate),
            confidence_score=triplet.confidence,
            evidence_snippet=clean_nul(triplet.evidence),
            source_document_id=source_doc.id,
            user_id=current_user.id
        )
        db.add(edge)

    audit = AuditLog(
        operation_type="INGEST_PDF",
        details_json={
            "document_id": str(source_doc.id),
            "filename": file.filename,
            "chunks_processed": len(text_chunks),
            "triplets_count": len(all_extracted_triplets)
        },
        user_id=current_user.id
    )
    db.add(audit)
    db.commit()

    return ExtractionResult(triplets=all_extracted_triplets, source_title=clean_title)


@router.get("/sources")
def list_ingested_sources(
    db: Session = Depends(get_cockroach_db),
    current_user: User = Depends(get_current_user)
):
    sources = db.query(SourceDocument).order_by(SourceDocument.created_at.desc()).all()
    result = []
    for s in sources:
        edge_count = db.query(Edge).filter(Edge.source_document_id == s.id).count()
        result.append({
            "id": str(s.id),
            "title": s.title,
            "authors": s.authors,
            "doi": s.doi,
            "created_at": s.created_at.isoformat() if s.created_at else None,
            "edge_count": edge_count
        })
    return result


@router.delete("/sources/{source_id}")
def delete_ingested_source(
    source_id: str,
    db: Session = Depends(get_cockroach_db),
    current_user: User = Depends(get_current_user)
):
    source_doc = db.query(SourceDocument).filter(SourceDocument.id == source_id).first()
    if not source_doc:
        raise HTTPException(status_code=404, detail="Source document not found")

    db.query(Edge).filter(Edge.source_document_id == source_id).delete(synchronize_session=False)
    db.delete(source_doc)
    db.commit()
    return {"message": f"Successfully deleted document '{source_doc.title}' and associated edges."}


@router.delete("/reset")
def reset_all_knowledge_graph_data(
    db: Session = Depends(get_cockroach_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != 'superadmin':
        raise HTTPException(status_code=403, detail="Only superadmin can reset graph data")

    db.query(Edge).delete(synchronize_session=False)
    db.query(Node).delete(synchronize_session=False)
    db.query(SourceDocument).delete(synchronize_session=False)
    db.commit()
    return {"message": "All Knowledge Graph data, nodes, edges, and sources have been completely reset to 0."}
