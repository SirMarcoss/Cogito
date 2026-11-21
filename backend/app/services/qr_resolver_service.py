from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models.documento_archivio import DocumentoArchivio
from app.models.opera import Opera
from app.schemas.opera import OperaDetailOut
from app.services.catalog_service import build_opera_detail


def resolve_qr(db: Session, qr_code: str) -> OperaDetailOut:
    """Normalizza il codice QR e restituisce il dettaglio opera in un'unica query."""
    # Normalizzazione coerente con il salvataggio su DB: rimuove spazi e porta tutto in maiuscolo
    normalized_code = qr_code.strip().upper()
    if not normalized_code:
        raise ValueError("Codice QR non valido.")

    # Lookup su colonna UNIQUE indicizzata + joinedload per evitare query N+1
    stmt = (
        select(Opera)
        .options(
            joinedload(Opera.ente),
            joinedload(Opera.documento_archivio).joinedload(DocumentoArchivio.ente),
        )
        .where(Opera.qr_code == normalized_code)
    )
    opera = db.execute(stmt).scalar_one_or_none()
    if opera is None:
        raise ValueError(f"Codice QR '{normalized_code}' non trovato.")

    return build_opera_detail(opera)
