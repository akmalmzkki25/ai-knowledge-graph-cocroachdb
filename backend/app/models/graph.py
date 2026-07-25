import uuid
from sqlalchemy import Column, String, Text, Float, DateTime, ForeignKey, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.db.session import Base

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String(128), unique=True, nullable=False, index=True)
    hashed_password = Column(String(256), nullable=False)
    role = Column(String(64), nullable=False, default="user")  # superadmin | user
    created_at = Column(DateTime(timezone=True), server_default=func.clock_timestamp())


class SourceDocument(Base):
    __tablename__ = "source_documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(512), nullable=False)
    authors = Column(Text, nullable=True)
    publication_date = Column(DateTime, nullable=True)
    journal = Column(String(256), nullable=True)
    doi = Column(String(256), nullable=True)
    file_hash = Column(String(64), nullable=False)
    raw_content = Column(Text, nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    metadata_json = Column(JSONB, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.clock_timestamp())

    user = relationship("User", foreign_keys=[user_id])
    edges = relationship("Edge", back_populates="source_document")


class Node(Base):
    __tablename__ = "nodes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    canonical_name = Column(String(256), nullable=False)
    entity_type = Column(String(64), nullable=False)  # Gene, Protein, Drug, Disease, Pathway, Symptom
    aliases = Column(JSONB, default=list)
    attributes = Column(JSONB, default=dict)
    description = Column(Text, nullable=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.clock_timestamp())
    updated_at = Column(DateTime(timezone=True), server_default=func.clock_timestamp(), onupdate=func.clock_timestamp())

    user = relationship("User", foreign_keys=[user_id])


class Edge(Base):
    __tablename__ = "edges"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    source_node_id = Column(UUID(as_uuid=True), ForeignKey("nodes.id", ondelete="CASCADE"), nullable=False)
    target_node_id = Column(UUID(as_uuid=True), ForeignKey("nodes.id", ondelete="CASCADE"), nullable=False)
    predicate = Column(String(128), nullable=False)  # INHIBITS, ACTIVATES, UPREGULATES, DOWNREGULATES, BINDS_TO
    causal_direction = Column(String(32), default="DIRECTED")  # DIRECTED, BIDIRECTIONAL, INHIBITORY
    confidence_score = Column(Float, nullable=False)
    evidence_snippet = Column(Text, nullable=False)
    source_document_id = Column(UUID(as_uuid=True), ForeignKey("source_documents.id", ondelete="SET NULL"), nullable=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    metadata_json = Column(JSONB, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.clock_timestamp())

    user = relationship("User", foreign_keys=[user_id])
    source_node = relationship("Node", foreign_keys=[source_node_id])
    target_node = relationship("Node", foreign_keys=[target_node_id])
    source_document = relationship("SourceDocument", back_populates="edges")


class Hypothesis(Base):
    __tablename__ = "hypotheses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(512), nullable=False)
    summary = Column(Text, nullable=False)
    causal_path_json = Column(JSONB, nullable=False)
    confidence_score = Column(Float, nullable=False)
    status = Column(String(32), default="DRAFT")  # DRAFT, VERIFIED, REJECTED
    reviewer_notes = Column(Text, nullable=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.clock_timestamp())
    updated_at = Column(DateTime(timezone=True), server_default=func.clock_timestamp(), onupdate=func.clock_timestamp())

    user = relationship("User", foreign_keys=[user_id])


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    operation_type = Column(String(64), nullable=False)  # INGEST, DEDUPLICATE, MERGE_NODE, LINT_CONTRADICTION
    details_json = Column(JSONB, nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.clock_timestamp())

    user = relationship("User", foreign_keys=[user_id])
