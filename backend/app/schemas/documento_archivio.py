from typing import Optional

from pydantic import BaseModel, ConfigDict


class DocumentoArchivioBase(BaseModel):
    segnatura: str
    fondo: str
    titolo: str
    datazione: str
    estratto_verificato: str
    immagine_url: Optional[str] = None


class DocumentoArchivioCreate(DocumentoArchivioBase):
    ente_id: int


class DocumentoArchivioUpdate(BaseModel):
    ente_id: Optional[int] = None
    segnatura: Optional[str] = None
    fondo: Optional[str] = None
    titolo: Optional[str] = None
    datazione: Optional[str] = None
    estratto_verificato: Optional[str] = None
    immagine_url: Optional[str] = None


class DocumentoArchivioDelete(BaseModel):
    id: int


class DocumentoArchivioOut(DocumentoArchivioBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    ente_conservazione: str
