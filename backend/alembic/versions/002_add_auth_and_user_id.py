"""add auth and user_id

Revision ID: 002_add_auth_and_user_id
Revises: 001_initial_schema
Create Date: 2026-07-25 21:50:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '002_add_auth_and_user_id'
down_revision: Union[str, None] = '001_initial_schema'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # 1. Users Table
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('username', sa.String(128), unique=True, nullable=False),
        sa.Column('hashed_password', sa.String(256), nullable=False),
        sa.Column('role', sa.String(64), server_default='user', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('clock_timestamp()'))
    )

    # 2. Add user_id foreign keys to existing tables
    op.add_column('source_documents', sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=True))
    op.add_column('nodes', sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=True))
    op.add_column('edges', sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=True))
    op.add_column('hypotheses', sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=True))
    op.add_column('audit_logs', sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=True))

def downgrade() -> None:
    op.drop_column('audit_logs', 'user_id')
    op.drop_column('hypotheses', 'user_id')
    op.drop_column('edges', 'user_id')
    op.drop_column('nodes', 'user_id')
    op.drop_column('source_documents', 'user_id')
    op.drop_table('users')
