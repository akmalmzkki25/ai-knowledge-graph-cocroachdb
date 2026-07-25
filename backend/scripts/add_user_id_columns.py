from sqlalchemy import text
from app.db.session import cockroach_engine, postgres_engine

def add_user_id_columns():
    alter_statements = [
        "CREATE TABLE IF NOT EXISTS users (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), username VARCHAR(128) UNIQUE NOT NULL, hashed_password VARCHAR(256) NOT NULL, role VARCHAR(64) NOT NULL DEFAULT 'user', created_at TIMESTAMPTZ DEFAULT clock_timestamp());",
        "ALTER TABLE source_documents ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;",
        "ALTER TABLE nodes ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;",
        "ALTER TABLE edges ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;",
        "ALTER TABLE hypotheses ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;",
        "ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;"
    ]

    for name, engine in [("CockroachDB", cockroach_engine), ("PostgreSQL", postgres_engine)]:
        print(f"Applying user_id columns alter statements on {name}...")
        try:
            with engine.connect() as conn:
                with conn.begin():
                    for stmt in alter_statements:
                        conn.execute(text(stmt))
            print(f"Successfully updated columns on {name}!")
        except Exception as e:
            print(f"Error altering columns on {name}: {e}")

if __name__ == "__main__":
    add_user_id_columns()
