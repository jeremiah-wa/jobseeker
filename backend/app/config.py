"""Application configuration."""

from functools import cached_property

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Database
    database_url: str = "postgresql://jobseeker:jobseeker@db:5432/jobseeker"

    # Auth
    jwt_secret_key: str = "dev-secret-key-change-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 7

    # LLM
    anthropic_api_key: str = ""
    llm_model: str = "claude-3-5-sonnet-20241022"
    llm_max_tokens: int = 4096
    llm_temperature: float = 0.3

    # Job Connectors
    adzuna_app_id: str = ""
    adzuna_app_key: str = ""
    adzuna_default_country: str = "au"

    # Application
    environment: str = "development"
    debug: bool = True
    # Store as string, convert to list via property
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"

    # File uploads
    max_upload_size_mb: int = 2
    upload_dir: str = "/data/uploads"

    @cached_property
    def cors_origins_list(self) -> list[str]:
        """Get CORS origins as a list (comma-separated string to list)."""
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",  # Ignore extra env vars not defined in Settings
    )


settings = Settings()
