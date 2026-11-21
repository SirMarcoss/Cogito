from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import DateTime, ForeignKey, Integer, JSON, Text, UniqueConstraint, func
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base
from .enums import LivelloCompetenza, enum_values

if TYPE_CHECKING:
    from .opera import Opera


class NarrazioneCache(Base):
    """Cache persistente delle narrazioni AI grounded per coppia (opera, livello)."""

    __tablename__ = "narrazioni_cache"
    __table_args__ = (
        UniqueConstraint("opera_id", "livello", name="uq_opera_livello_competenza"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    opera_id: Mapped[int] = mapped_column(
        ForeignKey("opere.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    livello: Mapped[LivelloCompetenza] = mapped_column(
        SQLEnum(
            LivelloCompetenza,
            name="livello_competenza_enum",
            values_callable=enum_values,
        ),
        nullable=False,
    )
    testo_lettura: Mapped[str] = mapped_column(Text, nullable=False)
    script_audio: Mapped[str] = mapped_column(Text, nullable=False)
    curiosita: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    fonti_citate: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    opera: Mapped["Opera"] = relationship(back_populates="narrazioni_cache")

    def __repr__(self) -> str:
        return (
            f"NarrazioneCache(id={self.id!r}, opera_id={self.opera_id!r}, "
            f"livello={self.livello!r})"
        )
