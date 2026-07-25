from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool, create_engine
from alembic import context
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import settings
from app.db.session import Base
from app.models.graph import SourceDocument, Node, Edge, Hypothesis, AuditLog

config = context.config

# Primary target CockroachDB
target_url = settings.COCKROACH_URL
try:
    test_engine = create_engine(target_url, connect_args={"connect_timeout": 3})
    with test_engine.connect() as conn:
        pass
except Exception as e:
    # Fallback to PostgreSQL 5432 if CockroachDB is down
    target_url = settings.DATABASE_URL

config.set_main_option("sqlalchemy.url", target_url)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata

def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
