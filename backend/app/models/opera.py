from __future__ import annotations

from typing import TYPE_CHECKING, Optional

from sqlalchemy import CheckConstraint, Float, ForeignKey, Integer, String, Text
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship, validates

from .base import Base
from .enums import CategoriaOpera, enum_values

if TYPE_CHECKING:
    from .correlazione_opera import CorrelazioneOpera
    from .documento_archivio import DocumentoArchivio
    from .ente_luogo import EnteLuogo
    from .narrazione_cache import NarrazioneCache


class Opera(Base):
    """Bene culturale fruibile tramite catalogo, mappa o scansione QR."""

    __tablename__ = "opere"
    __table_args__ = (
        CheckConstraint(
            "(lat IS NULL AND lng IS NULL) OR (lat IS NOT NULL AND lng IS NOT NULL)",
            name="lat_lng_pair",
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    qr_code: Mapped[str] = mapped_column(
        String(50), unique=True, index=True, nullable=False
    )
    titolo: Mapped[str] = mapped_column(String(255), nullable=False)
    autore: Mapped[str] = mapped_column(String(200), nullable=False)
    anno: Mapped[str] = mapped_column(String(50), nullable=False)
    categoria: Mapped[CategoriaOpera] = mapped_column(
        SQLEnum(CategoriaOpera, name="categoria_opera_enum", values_callable=enum_values),
        nullable=False,
        index=True,
    )
    sala: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    breve_sintesi: Mapped[str] = mapped_column(String(300), nullable=False)
    descrizione_ufficiale: Mapped[str] = mapped_column(Text, nullable=False)
    immagine_url: Mapped[str] = mapped_column(String(500), nullable=False)

    ente_id: Mapped[int] = mapped_column(
        ForeignKey("enti_luoghi.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    documento_archivio_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("archivi_documenti.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    lat: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    lng: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    ente: Mapped["EnteLuogo"] = relationship(back_populates="opere")
    documento_archivio: Mapped[Optional["DocumentoArchivio"]] = relationship(
        back_populates="opere_collegate"
    )
    narrazioni_cache: Mapped[list["NarrazioneCache"]] = relationship(
        back_populates="opera",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    correlazioni_uscenti: Mapped[list["CorrelazioneOpera"]] = relationship(
        foreign_keys="CorrelazioneOpera.opera_sorgente_id",
        back_populates="opera_sorgente",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    correlazioni_entranti: Mapped[list["CorrelazioneOpera"]] = relationship(
        foreign_keys="CorrelazioneOpera.opera_destinazione_id",
        back_populates="opera_destinazione",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    @validates("qr_code")
    def _normalize_qr_code(self, _key: str, value: str) -> str:
        """Normalizza il codice QR (trim + uppercase) prima della persistenza."""
        if not isinstance(value, str):
            raise ValueError("qr_code must be a non-empty string")
        normalized = value.strip().upper()
        if not normalized:
            raise ValueError("qr_code cannot be empty")
        return normalized

    @property
    def has_archivio(self) -> bool:
        """Indica se l'opera è collegata a un documento d'archivio verificato."""
        return self.documento_archivio_id is not None

    @property
    def resolved_lat(self) -> float:
        """Latitudine effettiva dell'opera con fallback sulle coordinate dell'ente."""
        return self.lat if self.lat is not None else self.ente.lat

    @property
    def resolved_lng(self) -> float:
        """Longitudine effettiva dell'opera con fallback sulle coordinate dell'ente."""
        return self.lng if self.lng is not None else self.ente.lng

    def __repr__(self) -> str:
        return (
            f"Opera(id={self.id!r}, qr_code={self.qr_code!r}, "
            f"titolo={self.titolo!r}, categoria={self.categoria!r})"
        )
