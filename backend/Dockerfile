FROM python:3.12-slim

# Install uv package manager
RUN pip install --no-cache-dir uv

WORKDIR /app

# Copy dependency specifications
COPY pyproject.toml .env* ./

# Install python dependencies
RUN uv pip install --system fastapi uvicorn[standard] sqlalchemy sqlalchemy-cockroachdb alembic psycopg2-binary openai redis pypdf python-dotenv pyjwt passlib bcrypt pydantic pydantic-settings python-multipart

# Copy backend application source and alembic migrations
COPY app ./app
COPY alembic ./alembic
COPY alembic.ini ./alembic.ini

EXPOSE 8000

# Command to run backend
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
