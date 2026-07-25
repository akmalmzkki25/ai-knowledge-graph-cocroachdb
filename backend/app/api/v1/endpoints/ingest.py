import hashlib
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.db.session import get_cockroach_db
from app.schemas.graph import TextIngestRequest, ExtractionResult, CausalTriplet
from app.services.bedrock_service import bedrock_service
from app.services.pdf_service import pdf_service
from app.services.entity_resolver import entity_resolver
from app.models.graph import SourceDocument, Edge, AuditLog, User
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
    authors: str = Form(None),
    doi: str = Form(None),
    db: Session = Depends(get_cockroach_db),
    current_user: User = Depends(get_current_user)
):
    pdf_bytes = await file.read()
    parsed_pdf = pdf_service.parse_pdf_bytes(pdf_bytes, filename=file.filename)
    
    clean_content = clean_nul(parsed_pdf["full_text"])
    clean_title = clean_nul(parsed_pdf["title"])
    clean_authors = clean_nul(authors) if authors else None
    clean_doi = clean_nul(doi) if doi else None

    if not clean_content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not extract readable text from the provided PDF file."
        )

    file_hash = hashlib.sha256(pdf_bytes).hexdigest()
    
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
            user_id=current_user.id,
            metadata_json={"total_pages": parsed_pdf["total_pages"]}
        )
        db.add(source_doc)
        db.commit()
        db.refresh(source_doc)

    text_chunks = pdf_service.create_sliding_window_chunks(clean_content, chunk_size=4000, overlap=500)
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
