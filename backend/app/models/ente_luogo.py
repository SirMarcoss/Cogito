from __future__ import annotations

from typing import TYPE_CHECKING, Optional

from sqlalchemy import Enum as SQLEnum
from sqlalchemy import Float, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base
from .enums import TipologiaEnte, enum_values

if TYPE_CHECKING:
    from .documento_archivio import DocumentoArchivio
    from .opera import Opera


class EnteLuogo(Base):
    """Ente culturale o luogo storico sul territorio (museo, archivio, sito)."""

    __tablename__ = "enti_luoghi"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    nome: Mapped[str] = mapped_column(String(200), nullable=False)
    tipologia: Mapped[TipologiaEnte] = mapped_column(
        SQLEnum(TipologiaEnte, name="tipologia_ente_enum", values_callable=enum_values),
        nullable=False,
        index=True,
    )
    indirizzo: Mapped[str] = mapped_column(String(255), nullable=False)
    citta: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    lat: Mapped[float] = mapped_column(Float, nullable=False)
    lng: Mapped[float] = mapped_column(Float, nullable=False)
    orari: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    sito_web: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    opere: Mapped[list["Opera"]] = relationship(back_populates="ente")
    documenti: Mapped[list["DocumentoArchivio"]] = relationship(back_populates="ente")

    def __repr__(self) -> str:
        return (
            f"EnteLuogo(id={self.id!r}, nome={self.nome!r}, "
            f"tipologia={self.tipologia!r}, citta={self.citta!r})"
        )
