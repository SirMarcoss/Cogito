from typing import Optional

from pydantic import BaseModel

from app.models.enums import CategoriaOpera

from .documento_archivio import DocumentoArchivioOut
from .ente_luogo import EnteOut


class OperaBase(BaseModel):
    qr_code: str
    titolo: str
    autore: str
    anno: str
    categoria: CategoriaOpera
    sala: Optional[str] = None
    breve_sintesi: str
    immagine_url: str
    ente_id: int


class OperaCreate(OperaBase):
    descrizione_ufficiale: str
    documento_archivio_id: Optional[int] = None
    lat: Optional[float] = None
    lng: Optional[float] = None


class OperaUpdate(BaseModel):
    qr_code: Optional[str] = None
    titolo: Optional[str] = None
    autore: Optional[str] = None
    anno: Optional[str] = None
    categoria: Optional[CategoriaOpera] = None
    sala: Optional[str] = None
    breve_sintesi: Optional[str] = None
    descrizione_ufficiale: Optional[str] = None
    immagine_url: Optional[str] = None
    ente_id: Optional[int] = None
    documento_archivio_id: Optional[int] = None
    lat: Optional[float] = None
    lng: Optional[float] = None


class OperaDelete(BaseModel):
    id: int


class OperaSummaryOut(OperaBase):
    id: int
    ente_nome: str
    citta: str
    lat: float
    lng: float
    has_archivio: bool


class OperaDetailOut(OperaSummaryOut):
    descrizione_ufficiale: str
    ente: EnteOut
    documento_archivio: Optional[DocumentoArchivioOut] = None


class OperaListResponse(BaseModel):
    total: int
    items: list[OperaSummaryOut]


class OperaNearbyOut(OperaSummaryOut):
    distance_km: float


class NearbyResponse(BaseModel):
    user_lat: float
    user_lng: float
    radius_km: float
    fallback_used: bool
    fallback_message: Optional[str] = None
    total: int
    items: list[OperaNearbyOut]


    # le classi Out sono quelle che vengono usati da fastAPI per restituire al front-end esattamente
    # i campi definiti nel contratto api.ts
