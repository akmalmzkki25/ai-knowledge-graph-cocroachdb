"""initial schema

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-07-25 19:11:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # 1. Source Documents
    op.create_table(
        'source_documents',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('title', sa.String(512), nullable=False),
        sa.Column('authors', sa.Text(), nullable=True),
        sa.Column('publication_date', sa.DateTime(), nullable=True),
        sa.Column('journal', sa.String(256), nullable=True),
        sa.Column('doi', sa.String(256), unique=True, nullable=True),
        sa.Column('file_hash', sa.String(64), unique=True, nullable=False),
        sa.Column('raw_content', sa.Text(), nullable=False),
        sa.Column('metadata_json', postgresql.JSONB(), server_default='{}'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('clock_timestamp()'))
    )

    # 2. Nodes
    op.create_table(
        'nodes',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('canonical_name', sa.String(256), nullable=False),
        sa.Column('entity_type', sa.String(64), nullable=False),
        sa.Column('aliases', postgresql.JSONB(), server_default='[]'),
        sa.Column('attributes', postgresql.JSONB(), server_default='{}'),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('clock_timestamp()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('clock_timestamp()')),
        sa.UniqueConstraint('canonical_name', 'entity_type', name='uq_canonical_name_type')
    )
    op.create_index('idx_nodes_type_name', 'nodes', ['entity_type', 'canonical_name'])

    # 3. Edges
    op.create_table(
        'edges',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('source_node_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('nodes.id', ondelete='CASCADE'), nullable=False),
        sa.Column('target_node_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('nodes.id', ondelete='CASCADE'), nullable=False),
        sa.Column('predicate', sa.String(128), nullable=False),
        sa.Column('causal_direction', sa.String(32), server_default='DIRECTED'),
        sa.Column('confidence_score', sa.Float(), nullable=False),
        sa.Column('evidence_snippet', sa.Text(), nullable=False),
        sa.Column('source_document_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('source_documents.id', ondelete='SET NULL'), nullable=True),
        sa.Column('metadata_json', postgresql.JSONB(), server_default='{}'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('clock_timestamp()'))
    )
    op.create_index('idx_edges_source_target', 'edges', ['source_node_id', 'target_node_id', 'predicate'])
    op.create_index('idx_edges_target_source', 'edges', ['target_node_id', 'source_node_id', 'predicate'])

    # 4. Hypotheses
    op.create_table(
        'hypotheses',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('title', sa.String(512), nullable=False),
        sa.Column('summary', sa.Text(), nullable=False),
        sa.Column('causal_path_json', postgresql.JSONB(), nullable=False),
        sa.Column('confidence_score', sa.Float(), nullable=False),
        sa.Column('status', sa.String(32), server_default='DRAFT'),
        sa.Column('reviewer_notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('clock_timestamp()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('clock_timestamp()'))
    )

    # 5. Audit Logs
    op.create_table(
        'audit_logs',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('operation_type', sa.String(64), nullable=False),
        sa.Column('details_json', postgresql.JSONB(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('clock_timestamp()'))
    )

def downgrade() -> None:
    op.drop_table('audit_logs')
    op.drop_table('hypotheses')
    op.drop_table('edges')
    op.drop_table('nodes')
    op.drop_table('source_documents')
