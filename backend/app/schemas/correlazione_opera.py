from typing import Optional

from pydantic import BaseModel

from .opera import OperaSummaryOut


class CorrelazioneBase(BaseModel):
    tipo_relazione: str
    motivazione: str


class CorrelazioneCreate(CorrelazioneBase):
    opera_sorgente_id: int
    opera_destinazione_id: int


class CorrelazioneUpdate(BaseModel):
    tipo_relazione: Optional[str] = None
    motivazione: Optional[str] = None


class CorrelazioneDelete(BaseModel):
    id: int


class CorrelazioneItemOut(CorrelazioneBase):
    opera: OperaSummaryOut


class CorrelazioniResponse(BaseModel):
    opera_sorgente_id: int
    from_cache: bool
    correlazioni: list[CorrelazioneItemOut]
