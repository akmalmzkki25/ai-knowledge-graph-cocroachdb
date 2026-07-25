from app.db.session import cockroach_engine, postgres_engine, Base, CockroachSessionLocal, PostgresSessionLocal
from app.models.graph import *

def run_auth_migration():
    print("Creating tables for Auth and User Multi-Tenancy...")
    Base.metadata.create_all(bind=cockroach_engine)
    Base.metadata.create_all(bind=postgres_engine)
    
    # Seed default superadmin
    from app.core.security import seed_default_superadmin
    db = CockroachSessionLocal()
    try:
        superadmin = seed_default_superadmin(db)
        print(f"Default Superadmin seeded successfully: Username '{superadmin.username}', Role '{superadmin.role}'")
    finally:
        db.close()

if __name__ == "__main__":
    run_auth_migration()
