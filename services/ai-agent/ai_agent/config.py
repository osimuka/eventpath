"""Configuration for AI agent."""

import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings."""

    log_level: str = os.getenv("LOG_LEVEL", "info")
    workers: int = int(os.getenv("WORKERS", "4"))
    openai_api_key: str = os.getenv("OPENAI_API_KEY", "")
    model_name: str = "gpt-4-turbo-preview"

    class Config:
        """Pydantic config."""

        env_file = ".env"


settings = Settings()
