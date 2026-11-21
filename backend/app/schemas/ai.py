from typing import Optional

from pydantic import BaseModel, Field


class AINarrationDraft(BaseModel):
    """Schema Structured Output Gemini per la narrazione adattiva."""

    testo_lettura: str = Field(..., description="Narrazione adattata al livello richiesto.")
    script_audio: str = Field(
        ...,
        description="Testo fluido senza sigle o parentesi, pronto per Web Speech API.",
    )
    curiosita: Optional[str] = None
    fonti_citate: list[str] = Field(default_factory=list)


class AICorrelationCandidate(BaseModel):
    """Singola opera correlata proposta da Gemini."""

    target_id: int = Field(..., description="ID numerico di un'altra opera del catalogo.")
    tipo_relazione: str
    motivazione: str


class AICorrelationsDraft(BaseModel):
    """Schema Structured Output Gemini per le correlazioni tra opere."""

    correlazioni: list[AICorrelationCandidate] = Field(default_factory=list)


class AIAskDraft(BaseModel):
    """Schema Structured Output Gemini per il Q&A contestuale."""

    answer: str
    in_scope: bool
    fonti_citate: list[str] = Field(default_factory=list)
