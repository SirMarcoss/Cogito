from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.opera import OperaDetailOut
from app.services.qr_resolver_service import resolve_qr

router = APIRouter()


@router.get("/qr/{qr_code}", response_model=OperaDetailOut)
def get_opera_by_qr(
    qr_code: str,
    db: Session = Depends(get_db),
) -> OperaDetailOut:
    """Risolve un codice QR e restituisce la scheda dettagliata dell'opera."""
    try:
        return resolve_qr(db=db, qr_code=qr_code)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))