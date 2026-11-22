from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.common import HealthResponse
from app.services.catalog_service import CatalogService

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
def health_check(db: Session = Depends(get_db)) -> HealthResponse:
    """Verifica che il server FastAPI e il database rispondano correttamente."""

    catalog_service = CatalogService(db)
    try:
        catalog_service.check_db_health()
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))

    return HealthResponse(status="ok")
