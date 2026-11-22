from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app.core.genai_client import GenAIClient
from app.models.correlazione_opera import CorrelazioneOpera
from app.models.opera import Opera
from app.schemas.ai import AICorrelationsDraft
from app.schemas.correlazione_opera import CorrelazioneItemOut, CorrelazioniResponse
from app.services.catalog_service import CatalogService, build_opera_summary

MAX_CACHED_CORRELATIONS = 3


def _build_candidates_catalog(candidates: list[Opera]) -> str:
    """Costruisce la proiezione compatta delle altre opere da passare a Gemini."""
    lines: list[str] = []
    for opera in candidates:
        lines.append(
            f"- ID: {opera.id} | Titolo: {opera.titolo} | Autore: {opera.autore} | "
            f"Anno: {opera.anno} | Categoria: {opera.categoria.value} | "
            f"Ente: {opera.ente.nome} ({opera.ente.citta}) | "
            f"Sintesi: {opera.breve_sintesi}"
        )
    return "\n".join(lines)


def get_related_opere(
    db: Session,
    genai_client: GenAIClient,
    opera_id: int,
    limit: int = 3,
) -> CorrelazioniResponse:
    """Restituisce fino a `limit` opere correlate usando Cache-Aside e filtro anti-allucinazione."""
    if limit < 1:
        raise ValueError("Il parametro limit deve essere maggiore o uguale a 1.")

    # 1. Lookup cache in 1 sola query (doppio joinedload su opera_destinazione -> ente)
    cached_stmt = (
        select(CorrelazioneOpera)
        .options(
            joinedload(CorrelazioneOpera.opera_destinazione).joinedload(Opera.ente)
        )
        .where(CorrelazioneOpera.opera_sorgente_id == opera_id)
        .order_by(CorrelazioneOpera.id)
    )
    cached_rows = db.execute(cached_stmt).scalars().all()
    if cached_rows:
        items = [
            CorrelazioneItemOut(
                tipo_relazione=row.tipo_relazione,
                motivazione=row.motivazione,
                opera=build_opera_summary(row.opera_destinazione),
            )
            for row in cached_rows[:limit]
        ]
        return CorrelazioniResponse(
            opera_sorgente_id=opera_id,
            from_cache=True,
            correlazioni=items,
        )

    # 2. Cache miss: verifica esistenza opera sorgente e carica le altre opere candidate
    source_opera = CatalogService(db).get_opera_detail(opera_id)

    candidates_stmt = (
        select(Opera)
        .options(joinedload(Opera.ente))
        .where(Opera.id != opera_id)
        .order_by(Opera.id)
    )
    candidates = list(db.execute(candidates_stmt).scalars().all())
    if not candidates:
        return CorrelazioniResponse(
            opera_sorgente_id=opera_id,
            from_cache=False,
            correlazioni=[],
        )

    # 3. Chiama Gemini per proporre fino a 3 correlazioni dall'elenco reale
    source_lines = [
        f"ID: {source_opera.id}",
        f"Titolo: {source_opera.titolo}",
        f"Autore: {source_opera.autore}",
        f"Anno: {source_opera.anno}",
        f"Categoria: {source_opera.categoria.value}",
        f"Ente: {source_opera.ente.nome} ({source_opera.ente.citta})",
        f"Descrizione: {source_opera.descrizione_ufficiale}",
    ]
    if source_opera.documento_archivio is not None:
        doc = source_opera.documento_archivio
        source_lines.append(
            f"Documento d'archivio: {doc.titolo} (Segnatura: {doc.segnatura}, Fondo: {doc.fondo})"
        )

    system_instruction = (
        "Sei un curatore museale e archivista di Cogito. "
        "Individua fino a 3 collegamenti reali (storici, artistici, archivistici o territoriali) "
        "tra l'opera sorgente e le altre opere presenti nel catalogo fornito.\n"
        "Regole inderogabili:\n"
        "- Scegli target_id ESCLUSIVAMENTE tra gli ID numerici dell'elenco candidato.\n"
        "- Non inserire mai l'ID dell'opera sorgente né target_id duplicati.\n"
        "- Usa etichette brevi in snake_case per tipo_relazione "
        "(es. 'evento_storico', 'stesso_autore', 'territorio', 'fonte_archivistica')."
    )
    prompt = (
        "OPERA SORGENTE:\n"
        + "\n".join(source_lines)
        + "\n\nOPERE CANDIDATE NEL CATALOGO:\n"
        + _build_candidates_catalog(candidates)
    )

    draft = genai_client.generate_structured(
        prompt=prompt,
        system_instruction=system_instruction,
        response_schema=AICorrelationsDraft,
    )

    # 4. Filtro Python anti-allucinazione obbligatorio prima di salvare su DB
    candidates_by_id = {opera.id: opera for opera in candidates}
    seen_target_ids: set[int] = set()
    valid_items: list[tuple[Opera, str, str]] = []

    for candidate in draft.correlazioni:
        target_id = candidate.target_id
        if target_id == opera_id or target_id not in candidates_by_id:
            continue
        if target_id in seen_target_ids:
            continue

        tipo_relazione = candidate.tipo_relazione.strip()[:80]
        motivazione = candidate.motivazione.strip()
        if not tipo_relazione or not motivazione:
            continue

        seen_target_ids.add(target_id)
        valid_items.append((candidates_by_id[target_id], tipo_relazione, motivazione))
        if len(valid_items) >= MAX_CACHED_CORRELATIONS:
            break

    if not valid_items:
        return CorrelazioniResponse(
            opera_sorgente_id=opera_id,
            from_cache=False,
            correlazioni=[],
        )

    # 5. Salva le correlazioni validate in cache (con recupero sicuro su race condition)
    for target_opera, tipo_relazione, motivazione in valid_items:
        db.add(
            CorrelazioneOpera(
                opera_sorgente_id=opera_id,
                opera_destinazione_id=target_opera.id,
                tipo_relazione=tipo_relazione,
                motivazione=motivazione,
            )
        )

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        existing_rows = db.execute(cached_stmt).scalars().all()
        if existing_rows:
            return CorrelazioniResponse(
                opera_sorgente_id=opera_id,
                from_cache=True,
                correlazioni=[
                    CorrelazioneItemOut(
                        tipo_relazione=row.tipo_relazione,
                        motivazione=row.motivazione,
                        opera=build_opera_summary(row.opera_destinazione),
                    )
                    for row in existing_rows[:limit]
                ],
            )
        raise

    response_items = [
        CorrelazioneItemOut(
            tipo_relazione=tipo_relazione,
            motivazione=motivazione,
            opera=build_opera_summary(target_opera),
        )
        for target_opera, tipo_relazione, motivazione in valid_items[:limit]
    ]
    return CorrelazioniResponse(
        opera_sorgente_id=opera_id,
        from_cache=False,
        correlazioni=response_items,
    )
