from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.genai_client import GenAIClient, get_genai_client
from app.models.enums import LivelloCompetenza
from app.schemas.correlazione_opera import CorrelazioniResponse
from app.schemas.narrazione_cache import AskRequest, AskResponse, NarrazioneOut
from app.services.adaptive_narration_service import ask_question, get_narration
from app.services.correlation_service import get_related_opere

router = APIRouter()


@router.get("/opere/{opera_id}/narration", response_model=NarrazioneOut)
def get_opera_narration(
    opera_id: int,
    livello: LivelloCompetenza = Query(...),
    db: Session = Depends(get_db),
    genai_client: GenAIClient = Depends(get_genai_client),
) -> NarrazioneOut:
    """Restituisce la narrazione adattiva per l'opera usando Cache-Aside e Gemini."""
    try:
        return get_narration(
            db=db,
            genai_client=genai_client,
            opera_id=opera_id,
            livello=livello,
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))


@router.get("/opere/{opera_id}/related", response_model=CorrelazioniResponse)
def get_opera_related(
    opera_id: int,
    limit: int = Query(default=3, ge=1, le=4),
    db: Session = Depends(get_db),
    genai_client: GenAIClient = Depends(get_genai_client),
) -> CorrelazioniResponse:
    """Restituisce fino a `limit` opere correlate validate contro il database."""
    try:
        return get_related_opere(
            db=db,
            genai_client=genai_client,
            opera_id=opera_id,
            limit=limit,
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))


@router.post("/opere/{opera_id}/ask", response_model=AskResponse)
def ask_opera_question(
    opera_id: int,
    payload: AskRequest,
    db: Session = Depends(get_db),
    genai_client: GenAIClient = Depends(get_genai_client),
) -> AskResponse:
    """Risponde in modo grounded a una domanda contestuale sull'opera."""
    try:
        return ask_question(
            db=db,
            genai_client=genai_client,
            opera_id=opera_id,
            request=payload,
        )
    except ValueError as exc:
        status_code = 404 if "non trovata" in str(exc).lower() else 422 #Domanda vuota /inesistente
        raise HTTPException(status_code=status_code, detail=str(exc))
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))