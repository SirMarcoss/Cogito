from typing import Optional

from pydantic import BaseModel, Field

from app.models.enums import LivelloCompetenza


class NarrazioneBase(BaseModel):
    opera_id: int
    livello: LivelloCompetenza
    testo_lettura: str
    script_audio: str
    curiosita: Optional[str] = None
    fonti_citate: list[str] = Field(default_factory=list)


class NarrazioneCreate(NarrazioneBase):
    pass


class NarrazioneUpdate(BaseModel):
    testo_lettura: Optional[str] = None
    script_audio: Optional[str] = None
    curiosita: Optional[str] = None
    fonti_citate: Optional[list[str]] = None


class NarrazioneDelete(BaseModel):
    id: int


class NarrazioneOut(NarrazioneBase):
    from_cache: bool


class AskRequest(BaseModel):
    question: str = Field(..., min_length=3, max_length=300)
    livello: LivelloCompetenza = LivelloCompetenza.ADULTO


class AskResponse(BaseModel):
    opera_id: int
    answer: str
    in_scope: bool
    fonti_citate: list[str]
