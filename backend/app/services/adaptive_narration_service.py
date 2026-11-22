from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.genai_client import GenAIClient
from app.models.enums import LivelloCompetenza
from app.models.narrazione_cache import NarrazioneCache
from app.schemas.ai import AIAskDraft, AINarrationDraft
from app.schemas.narrazione_cache import AskRequest, AskResponse, NarrazioneOut
from app.schemas.opera import OperaDetailOut
from app.services.catalog_service import CatalogService

# Dizionario di profili stilistici per evitare catene if/elif duplicate
LEVEL_PROFILES: dict[LivelloCompetenza, str] = {
    LivelloCompetenza.BAMBINO: (
        "Visitatore 6-11 anni: usa frasi brevi, immagini vivide, tono curioso e "
        "racconto coinvolgente, spiegando subito eventuali parole difficili."
    ),
    LivelloCompetenza.RAGAZZO: (
        "Visitatore 12-17 anni: tono diretto, dinamico e chiaro, evidenziando "
        "dettagli visivi, retroscena storici e legami col territorio."
    ),
    LivelloCompetenza.ADULTO: (
        "Visitatore adulto: registro culturale accessibile, equilibrato e scorrevole, "
        "con buon contesto storico-artistico senza tecnicismi eccessivi."
    ),
    LivelloCompetenza.ESPERTO: (
        "Studioso o appassionato esperto: massimo rigore storico, terminologia "
        "critica appropriata e richiami puntuali ai metadati archivistici."
    ),
}


def _build_sources_context(opera: OperaDetailOut) -> str:
    """Compone il contesto verificato dal DB per il grounding delle chiamate AI."""
    lines = [
        f"Titolo: {opera.titolo}",
        f"Autore: {opera.autore}",
        f"Datazione: {opera.anno}",
        f"Categoria: {opera.categoria.value}",
    ]
    if opera.sala:
        lines.append(f"Collocazione / Sala: {opera.sala}")

    lines.extend(
        [
            f"Ente / Luogo: {opera.ente.nome} ({opera.ente.tipologia.value})",
            f"Indirizzo: {opera.ente.indirizzo}, {opera.ente.citta}",
            f"Descrizione ufficiale verificata:\n{opera.descrizione_ufficiale}",
        ]
    )

    if opera.documento_archivio is not None:
        doc = opera.documento_archivio
        lines.extend(
            [
                "",
                "Documento d'archivio collegato:",
                f"- Ente di conservazione: {doc.ente_conservazione}",
                f"- Segnatura: {doc.segnatura}",
                f"- Fondo: {doc.fondo}",
                f"- Titolo documento: {doc.titolo}",
                f"- Datazione documento: {doc.datazione}",
                f"- Estratto verificato: {doc.estratto_verificato}",
            ]
        )

    return "\n".join(lines)


def _to_narrazione_out(record: NarrazioneCache, from_cache: bool) -> NarrazioneOut:
    """Converte una riga di narrazioni_cache nel DTO NarrazioneOut."""
    return NarrazioneOut(
        opera_id=record.opera_id,
        livello=record.livello,
        testo_lettura=record.testo_lettura,
        script_audio=record.script_audio,
        curiosita=record.curiosita,
        fonti_citate=list(record.fonti_citate),
        from_cache=from_cache,
    )


def get_narration(
    db: Session,
    genai_client: GenAIClient,
    opera_id: int,
    livello: LivelloCompetenza,
) -> NarrazioneOut:
    """Restituisce la narrazione adattiva usando Cache-Aside su DB e grounding Gemini."""
    # 1. Lookup diretto su cache (indice composito opera_id + livello -> < 20 ms)
    cache_stmt = select(NarrazioneCache).where(
        NarrazioneCache.opera_id == opera_id,
        NarrazioneCache.livello == livello,
    )
    cached = db.execute(cache_stmt).scalar_one_or_none()
    if cached is not None:
        return _to_narrazione_out(cached, from_cache=True)

    # 2. Cache miss: carica solo dati verificati dal DB riusando CatalogService
    opera = CatalogService(db).get_opera_detail(opera_id)
    sources_context = _build_sources_context(opera)

    system_instruction = (
        "Sei la guida culturale ufficiale di Cogito. "
        "Usa ESCLUSIVAMENTE le informazioni presenti nelle fonti fornite: "
        "non inventare mai date, segnature, nomi, aneddoti o dettagli esterni.\n"
        f"Profilo target ({livello.value}): {LEVEL_PROFILES[livello]}\n"
        "Regole per i campi:\n"
        "- testo_lettura: testo narrativo ricco e coinvolgente in italiano di 2 o 3 paragrafi "
        "(circa 130-190 parole totali) separati da una riga vuota (\\n\\n): "
        "primo paragrafo sul bene e il luogo, secondo paragrafo sui dettagli storici e artistici "
        "presenti nelle fonti, terzo paragrafo sul legame con l'ente o l'eventuale documento d'archivio. "
        "Resta fedele ai fatti delle fonti senza inventare date, nomi o segnature.\n"
        "- script_audio: versione parlata completa (circa 130-190 parole, coerente con testo_lettura) "
        "pronta per lettura ad alta voce (Web Speech API): scrivi eventuali numeri o secoli per esteso "
        "ed evita sigle, abbreviazioni puntate (es. 'sec.', 'ca.', 'n.'), parentesi ed elenchi puntati.\n"
        "evita sigle, abbreviazioni puntate (es. 'sec.', 'ca.', 'n.'), parentesi ed elenchi puntati.\n"
        "- curiosita: breve spunto interessante ricavato dalle fonti oppure null.\n"
        "- fonti_citate: elenca solo i nomi degli enti e le segnature archivistiche effettivamente presenti nei dati."
    )
    prompt = (
        f"Genera la narrazione per il livello '{livello.value}' basandoti solo su queste fonti:\n\n"
        f"{sources_context}"
    )

    draft = genai_client.generate_structured(
        prompt=prompt,
        system_instruction=system_instruction,
        response_schema=AINarrationDraft,
    )

    # 3. Salva in cache; gestisce eventuali richieste simultanee sulla stessa coppia (opera_id, livello)
    record = NarrazioneCache(
        opera_id=opera.id,
        livello=livello,
        testo_lettura=draft.testo_lettura,
        script_audio=draft.script_audio,
        curiosita=draft.curiosita,
        fonti_citate=draft.fonti_citate,
    )
    db.add(record)
    try:
        db.commit()
        db.refresh(record)
        return _to_narrazione_out(record, from_cache=False)
    except IntegrityError:
        db.rollback()
        existing = db.execute(cache_stmt).scalar_one_or_none()
        if existing is not None:
            return _to_narrazione_out(existing, from_cache=True)
        raise


def ask_question(
    db: Session,
    genai_client: GenAIClient,
    opera_id: int,
    request: AskRequest,
) -> AskResponse:
    """Risponde in modo grounded a una domanda sull'opera segnalando eventuali fuori tema."""
    question = request.question.strip()
    if len(question) < 3:
        raise ValueError("La domanda deve contenere almeno 3 caratteri utili.")

    opera = CatalogService(db).get_opera_detail(opera_id)
    sources_context = _build_sources_context(opera)

    system_instruction = (
        "Sei l'assistente culturale di Cogito per una singola opera. "
        "Rispondi in italiano basandoti ESCLUSIVAMENTE sulle fonti verificate fornite.\n"
        f"Profilo target ({request.livello.value}): {LEVEL_PROFILES[request.livello]}\n"
        "Se la domanda riguarda argomenti estranei all'opera, al suo autore, "
        "all'ente che la ospita o al contesto storico-archivistico fornito, "
        "imposta in_scope=false, lascia fonti_citate vuota e invita cortesemente a chiedere "
        "informazioni sul bene culturale."
    )
    prompt = (
        f"Fonti verificate:\n{sources_context}\n\n"
        f"Domanda del visitatore: {question}"
    )

    draft = genai_client.generate_structured(
        prompt=prompt,
        system_instruction=system_instruction,
        response_schema=AIAskDraft,
    )

    return AskResponse(
        opera_id=opera.id,
        answer=draft.answer,
        in_scope=draft.in_scope,
        fonti_citate=draft.fonti_citate if draft.in_scope else [],
    )
