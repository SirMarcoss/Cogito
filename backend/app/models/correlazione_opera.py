from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base

if TYPE_CHECKING:
    from .opera import Opera


class CorrelazioneOpera(Base):
    """Cache persistente delle correlazioni culturali e territoriali validate tra opere."""

    __tablename__ = "correlazioni_opere"
    __table_args__ = (
        UniqueConstraint(
            "opera_sorgente_id",
            "opera_destinazione_id",
            name="uq_correlazione_coppia",
        ),
        CheckConstraint(
            "opera_sorgente_id != opera_destinazione_id",
            name="no_self_loop",
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    opera_sorgente_id: Mapped[int] = mapped_column(
        ForeignKey("opere.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    opera_destinazione_id: Mapped[int] = mapped_column(
        ForeignKey("opere.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    tipo_relazione: Mapped[str] = mapped_column(String(80), nullable=False)
    motivazione: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    opera_sorgente: Mapped["Opera"] = relationship(
        foreign_keys=[opera_sorgente_id],
        back_populates="correlazioni_uscenti",
    )
    opera_destinazione: Mapped["Opera"] = relationship(
        foreign_keys=[opera_destinazione_id],
        back_populates="correlazioni_entranti",
    )

    def __repr__(self) -> str:
        return (
            f"CorrelazioneOpera(id={self.id!r}, "
            f"opera_sorgente_id={self.opera_sorgente_id!r}, "
            f"opera_destinazione_id={self.opera_destinazione_id!r}, "
            f"tipo_relazione={self.tipo_relazione!r})"
        )
