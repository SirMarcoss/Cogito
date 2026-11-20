from __future__ import annotations

from typing import TYPE_CHECKING, Optional

from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base

if TYPE_CHECKING:
    from .ente_luogo import EnteLuogo
    from .opera import Opera


class DocumentoArchivio(Base):
    """Documento d'archivio primario verificato con segnatura e fondo di provenienza."""

    __tablename__ = "archivi_documenti"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    ente_id: Mapped[int] = mapped_column(
        ForeignKey("enti_luoghi.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    segnatura: Mapped[str] = mapped_column(
        String(100), unique=True, index=True, nullable=False
    )
    fondo: Mapped[str] = mapped_column(String(200), nullable=False)
    titolo: Mapped[str] = mapped_column(String(255), nullable=False)
    datazione: Mapped[str] = mapped_column(String(100), nullable=False)
    estratto_verificato: Mapped[str] = mapped_column(Text, nullable=False)
    immagine_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    ente: Mapped["EnteLuogo"] = relationship(back_populates="documenti")
    opere_collegate: Mapped[list["Opera"]] = relationship(
        back_populates="documento_archivio"
    )

    def __repr__(self) -> str:
        return (
            f"DocumentoArchivio(id={self.id!r}, segnatura={self.segnatura!r}, "
            f"fondo={self.fondo!r})"
        )
