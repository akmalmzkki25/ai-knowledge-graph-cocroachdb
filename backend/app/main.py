import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from alembic.config import Config
from alembic import command
from app.core.config import settings
from app.api.v1.router import api_router
from app.db.session import CockroachSessionLocal
from app.core.security import seed_default_superadmin

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Dynamic Causal Discovery & Knowledge Base Graph API powered by CockroachDB and AWS Bedrock (GLM 5.2)",
    version="0.1.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Configure CORS Middleware with dynamic origin regex to support all IPs/domains with credentials
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex="https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_db_init():
    """Run Alembic migrations as the Single Source of Truth for DB schema on startup"""
    print("🚀 Running Alembic migrations (upgrade head)...")
    try:
        # Locate alembic.ini from backend directory
        backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        ini_path = os.path.join(backend_dir, "alembic.ini")
        
        if os.path.exists(ini_path):
            alembic_cfg = Config(ini_path)
            command.upgrade(alembic_cfg, "head")
            print("✅ Alembic schema migration (upgrade head) successful!")
        else:
            print(f"⚠️ alembic.ini not found at {ini_path}")
            
        # Auto-seed default superadmin user
        db = CockroachSessionLocal()
        try:
            superadmin = seed_default_superadmin(db)
            print(f"✅ Default Superadmin verified: '{superadmin.username}'")
        finally:
            db.close()
    except Exception as e:
        print(f"⚠️ Startup Alembic Migration notice: {e}")

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "message": "Welcome to Knowledge Base BioGraph API",
        "documentation": "/docs",
        "health_check": f"{settings.API_V1_STR}/health"
    }
