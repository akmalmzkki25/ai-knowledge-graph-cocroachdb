import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

logger = logging.getLogger(__name__)

# Primary PostgreSQL Engine
postgres_engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20
)
PostgresSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=postgres_engine)

# CockroachDB Engine (with PostgreSQL fallback if CockroachDB isn't running)
def create_active_engine():
    try:
        engine = create_engine(settings.COCKROACH_URL, pool_pre_ping=True, connect_args={"connect_timeout": 2})
        with engine.connect() as conn:
            pass
        logger.info("Successfully connected to CockroachDB engine.")
        return engine
    except Exception as e:
        logger.warning(f"CockroachDB at 26257 unreachable ({e}). Falling back to PostgreSQL on 5432.")
        return postgres_engine

cockroach_engine = create_engine(
    settings.COCKROACH_URL,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20
)
CockroachSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=cockroach_engine)

Base = declarative_base()

def get_postgres_db():
    db = PostgresSessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_cockroach_db():
    db = CockroachSessionLocal()
    try:
        yield db
    finally:
        db.close()
