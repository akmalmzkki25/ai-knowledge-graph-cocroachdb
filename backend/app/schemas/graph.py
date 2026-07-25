from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime
from uuid import UUID

# Node Schemas
class NodeBase(BaseModel):
    canonical_name: str
    entity_type: str
    aliases: List[str] = []
    attributes: Dict[str, Any] = {}
    description: Optional[str] = None

class NodeCreate(NodeBase):
    pass

class NodeResponse(NodeBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Edge Schemas
class EdgeBase(BaseModel):
    source_node_id: UUID
    target_node_id: UUID
    predicate: str
    causal_direction: str = "DIRECTED"
    confidence_score: float = Field(..., ge=0.0, le=1.0)
    evidence_snippet: str
    metadata_json: Dict[str, Any] = {}

class EdgeCreate(EdgeBase):
    source_document_id: Optional[UUID] = None

class EdgeResponse(EdgeBase):
    id: UUID
    source_document_id: Optional[UUID] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Triplet Extraction Schema from LLM
class CausalTriplet(BaseModel):
    source_entity: str
    source_type: str
    predicate: str
    target_entity: str
    target_type: str
    confidence: float
    evidence: str

class ExtractionResult(BaseModel):
    triplets: List[CausalTriplet]
    source_title: Optional[str] = None

# Ingestion Schemas
class TextIngestRequest(BaseModel):
    title: str
    content: str
    authors: Optional[str] = None
    doi: Optional[str] = None

class HypothesisResponse(BaseModel):
    id: UUID
    title: str
    summary: str
    causal_path_json: List[Any]
    confidence_score: float
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

# Path Discovery Schema
class PathDiscoveryResponse(BaseModel):
    start_entity: str
    target_entity: str
    path_node_ids: List[str]
    hops: int
    confidence_score: float
