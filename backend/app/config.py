import os
import sys

from pydantic_settings import BaseSettings, SettingsConfigDict

# Debug: print env vars visible to this process (masked)
_env_db = os.getenv("DATABASE_URL", "<NOT SET>")
_masked = _env_db[:45] + "..." if len(_env_db) > 45 else _env_db
print(f"[CONFIG] DATABASE_URL env var: {_masked}", file=sys.stderr, flush=True)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+psycopg2://darukaa:darukaa@localhost:5432/darukaa"
    jwt_secret: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24
    cors_origins: str = "http://localhost:5173"


settings = Settings()

# Debug: what did pydantic actually resolve?
_resolved = settings.database_url[:45]
print(f"[CONFIG] Resolved database_url: {_resolved}...", file=sys.stderr, flush=True)
