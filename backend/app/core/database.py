from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from .config import settings

engine = create_engine(settings.sqlalchemy_database_url, pool_pre_ping=True) # sincrono

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    """Dependency FastAPI che apre e chiude una sessione SQLAlchemy per richiesta."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
