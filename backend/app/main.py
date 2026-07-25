from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.router import api_router
from app.db.session import cockroach_engine, postgres_engine, Base, CockroachSessionLocal
from app.core.security import seed_default_superadmin
from scripts.add_user_id_columns import add_user_id_columns

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Dynamic Causal Discovery & Knowledge Base Graph API powered by CockroachDB and AWS Bedrock (GLM 5.2)",
    version="0.1.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Configure CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_db_init():
    """Auto-create tables, apply user_id migrations, and seed default superadmin on startup"""
    print("🚀 Auto-initializing database schemas and superadmin account...")
    try:
        # Create all tables on both CockroachDB and PostgreSQL
        Base.metadata.create_all(bind=cockroach_engine)
        Base.metadata.create_all(bind=postgres_engine)
        
        # Ensure user_id columns exist on pre-existing tables
        add_user_id_columns()
        
        # Auto-seed default superadmin user
        db = CockroachSessionLocal()
        try:
            superadmin = seed_default_superadmin(db)
            print(f"✅ Auto-initialization complete! Default Superadmin: '{superadmin.username}'")
        finally:
            db.close()
    except Exception as e:
        print(f"⚠️ Startup Database Initialization notice: {e}")

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "message": "Welcome to Knowledge Base BioGraph API",
        "documentation": "/docs",
        "health_check": f"{settings.API_V1_STR}/health"
    }
