from typing import Optional

from pydantic import BaseModel, ConfigDict

from app.models.enums import TipologiaEnte


class EnteBase(BaseModel):
    nome: str
    tipologia: TipologiaEnte
    indirizzo: str
    citta: str
    lat: float
    lng: float
    orari: Optional[str] = None
    sito_web: Optional[str] = None


class EnteCreate(EnteBase):
    pass


class EnteUpdate(BaseModel):
    nome: Optional[str] = None
    tipologia: Optional[TipologiaEnte] = None
    indirizzo: Optional[str] = None
    citta: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    orari: Optional[str] = None
    sito_web: Optional[str] = None


class EnteDelete(BaseModel):
    id: int


class EnteOut(EnteBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
