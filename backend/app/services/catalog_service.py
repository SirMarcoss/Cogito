from typing import Optional

from sqlalchemy import or_, select, text
from sqlalchemy.orm import Session, joinedload

from app.models.documento_archivio import DocumentoArchivio
from app.models.enums import CategoriaOpera
from app.models.opera import Opera
from app.schemas.documento_archivio import DocumentoArchivioOut
from app.schemas.ente_luogo import EnteOut
from app.schemas.opera import OperaDetailOut, OperaListResponse, OperaSummaryOut


def build_opera_summary(opera: Opera) -> OperaSummaryOut:
    """Costruisce OperaSummaryOut da un'istanza Opera con ente già caricato."""
    return OperaSummaryOut(
        id=opera.id,
        qr_code=opera.qr_code,
        titolo=opera.titolo,
        autore=opera.autore,
        anno=opera.anno,
        categoria=opera.categoria,
        sala=opera.sala,
        breve_sintesi=opera.breve_sintesi,
        immagine_url=opera.immagine_url,
        ente_id=opera.ente_id,
        ente_nome=opera.ente.nome,
        citta=opera.ente.citta,
        lat=opera.resolved_lat,
        lng=opera.resolved_lng,
        has_archivio=opera.has_archivio,
    )


def build_opera_detail(opera: Opera) -> OperaDetailOut:
    """Costruisce OperaDetailOut includendo ente e documento d'archivio se presente."""
    documento_out: Optional[DocumentoArchivioOut] = None
    if opera.documento_archivio is not None:
        doc = opera.documento_archivio
        documento_out = DocumentoArchivioOut(
            id=doc.id,
            segnatura=doc.segnatura,
            fondo=doc.fondo,
            titolo=doc.titolo,
            datazione=doc.datazione,
            estratto_verificato=doc.estratto_verificato,
            immagine_url=doc.immagine_url,
            ente_conservazione=doc.ente.nome,
        )

    return OperaDetailOut(
        id=opera.id,
        qr_code=opera.qr_code,
        titolo=opera.titolo,
        autore=opera.autore,
        anno=opera.anno,
        categoria=opera.categoria,
        sala=opera.sala,
        breve_sintesi=opera.breve_sintesi,
        immagine_url=opera.immagine_url,
        ente_id=opera.ente_id,
        ente_nome=opera.ente.nome,
        citta=opera.ente.citta,
        lat=opera.resolved_lat,
        lng=opera.resolved_lng,
        has_archivio=opera.has_archivio,
        descrizione_ufficiale=opera.descrizione_ufficiale,
        ente=EnteOut.model_validate(opera.ente),
        documento_archivio=documento_out,
    )


class CatalogService:
    """Logica applicativa per health check DB, catalogo opere e schede di dettaglio."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def check_db_health(self) -> None:
        """Verifica la connettività attiva verso il database."""
        try:
            self.db.execute(text("SELECT 1"))
        except Exception as exc:
            raise RuntimeError("Database non raggiungibile.") from exc

    def list_opere(
        self,
        categoria: Optional[CategoriaOpera] = None,
        ente_id: Optional[int] = None,
        search: Optional[str] = None,
        limit: int = 50, # quanti elementi max restituire nella risposta
        offset: int = 0, # ""      ""     saltare dall'inizio prima di prendere i risultati
    ) -> OperaListResponse:
        """Restituisce il catalogo paginato delle opere con filtri opzionali."""
        if limit < 1 or offset < 0:
            raise ValueError("Parametri di paginazione non validi.")

        # joinedload carica subito anche i dati dell'ente in un'unica JOIN (evita query N+1)
        stmt = select(Opera).options(joinedload(Opera.ente))

        if categoria is not None:
            stmt = stmt.where(Opera.categoria == categoria)
        if ente_id is not None:
            stmt = stmt.where(Opera.ente_id == ente_id)
        if search and search.strip():
            # Il doppio '%' (%testo%) corrisponde al LIKE di SQL per cercare una sottostringa
            # in qualsiasi posizione (inizio, centro o fine), a differenza di 'Ro%' (solo inizio).
            # Usiamo .ilike() al posto di .like() perché su PostgreSQL LIKE distingue
            # maiuscole e minuscole, mentre ILIKE le ignora (come il LIKE predefinito di MySQL).
            pattern = f"%{search.strip()}%"
            stmt = stmt.where(
                or_(
                    Opera.titolo.ilike(pattern),
                    Opera.autore.ilike(pattern),
                    Opera.breve_sintesi.ilike(pattern),
                )
            )

        opere = self.db.execute(stmt.order_by(Opera.id)).scalars().all()
        paginated = opere[offset : offset + limit]

        return OperaListResponse(
            total=len(opere),
            items=[build_opera_summary(opera) for opera in paginated],
        )

    def get_opera_detail(self, opera_id: int) -> OperaDetailOut:
        """Restituisce la scheda completa di un'opera o solleva ValueError se assente."""
        stmt = (
            select(Opera)
            .options(
                joinedload(Opera.ente),
                joinedload(Opera.documento_archivio).joinedload(DocumentoArchivio.ente),
            )
            .where(Opera.id == opera_id)
        )
        opera = self.db.execute(stmt).scalar_one_or_none()
        if opera is None:
            raise ValueError(f"Opera con id {opera_id} non trovata.")
        return build_opera_detail(opera)
