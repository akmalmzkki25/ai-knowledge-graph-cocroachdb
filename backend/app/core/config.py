import os
from pathlib import Path
from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent.parent  # backend/
ROOT_DIR = BASE_DIR.parent  # root project dir

if (ROOT_DIR / ".env").exists():
    load_dotenv(ROOT_DIR / ".env")
elif (BASE_DIR / ".env").exists():
    load_dotenv(BASE_DIR / ".env")

class Settings(BaseSettings):
    PROJECT_NAME: str = "BioGraph Knowledge Base"
    API_V1_STR: str = "/api/v1"
    
    # Environment
    FASTAPI_ENV: str = "development"
    FASTAPI_HOST: str = "0.0.0.0"
    FASTAPI_PORT: int = 8000
    
    # Databases
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres:postgrespw123@localhost:5432/knowledge_base")
    COCKROACH_URL: str = os.getenv("COCKROACH_URL", "cockroachdb://root@localhost:26257/knowledge_base?sslmode=disable")
    REDIS_URI: str = os.getenv("REDIS_URI", "redis://:redispw123@localhost:6379/0")
    
    # AWS Bedrock Mantle / OpenAI Client Settings
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "dummy-key-for-init")
    OPENAI_BASE_URL: str = os.getenv("OPENAI_BASE_URL", "https://bedrock-mantle.ap-southeast-3.api.aws/v1")
    BEDROCK_MODEL: str = os.getenv("BEDROCK_MODEL", "zai.glm-5")
    BEDROCK_PROJECT: str = os.getenv("BEDROCK_PROJECT", "default")

    model_config = SettingsConfigDict(
        extra="ignore"
    )

settings = Settings()
