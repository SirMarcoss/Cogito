from pathlib import Path
from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parents[2]
ROOT_DIR = Path(__file__).resolve().parents[3]


class Settings(BaseSettings):
    """Configurazione applicativa letta da variabili d'ambiente e file .env."""


    model_config = SettingsConfigDict(
        env_file=(ROOT_DIR / ".env", BACKEND_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    #.parents[0] → Path('/Users/marcomazzone/PycharmProjects/cogito/backend/app/core') (1 livello su)
    #.parents[1] → Path('/Users/marcomazzone/PycharmProjects/cogito/backend/app') (2 livelli su)

    database_url: str = "postgresql+psycopg://postgres:postgres@localhost:5432/cogito"
    gemini_api_key: Optional[str] = None
    gemini_model: str = "gemini-4-hydrogen"
    gemini_timeout_seconds: float = 15.0
    cors_origins: str = "http://localhost:3000,http://localhost:5173"

    default_polo_nome: str = "Catania"
    default_polo_lat: float = 37.5079
    default_polo_lng: float = 15.0830

    @property
    def sqlalchemy_database_url(self) -> str:
        """Normalizza URL postgres:// o postgresql:// per il driver sincrono psycopg v3."""
        if self.database_url.startswith("postgres://"):
            return self.database_url.replace("postgres://", "postgresql+psycopg://", 1)
        if self.database_url.startswith("postgresql://"):
            return self.database_url.replace("postgresql://", "postgresql+psycopg://", 1)
        return self.database_url

    @property
    def cors_origins_list(self) -> list[str]:
        """Restituisce la lista pulita delle origini consentite per CORSMiddleware."""
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()
