# MahvaBridge Backend API

FastAPI backend service powering the **Dynamic Causal Discovery & Hypothesis Graph System** with CockroachDB, PostgreSQL, Redis, and AWS Bedrock (GLM 5.2).

## Setup & Running

```bash
# 1. Install dependencies with uv
uv venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
uv pip install -e .

# 2. Run Database Migrations
uv run alembic upgrade head

# 3. Start Development Server
uv run uvicorn app.main:app --reload --port 8000
```
