from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.enums import CategoriaOpera
from app.schemas.opera import NearbyResponse, OperaDetailOut, OperaListResponse
from app.services.catalog_service import CatalogService
from app.services.geo_map_service import find_nearby_opere

router = APIRouter()


@router.get("/opere", response_model=OperaListResponse)
def list_opere(
    categoria: Optional[CategoriaOpera] = None,
    ente_id: Optional[int] = None,
    search: Optional[str] = None,
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
) -> OperaListResponse:
    """Restituisce il catalogo delle opere con filtri opzionali e paginazione."""
    catalog_service = CatalogService(db)
    try:
        return catalog_service.list_opere(
            categoria=categoria,
            ente_id=ente_id,
            search=search,
            limit=limit,
            offset=offset,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


# NOTA DI ROUTING: /opere/nearby va registrato PRIMA di /opere/{opera_id},
# altrimenti FastAPI proverebbe a interpretare "nearby" come intero (422).
@router.get("/opere/nearby", response_model=NearbyResponse)
def get_nearby_opere(
    lat: float = Query(..., ge=-90.0, le=90.0),
    lng: float = Query(..., ge=-180.0, le=180.0),
    radius_km: float = Query(default=20.0, gt=0.0),
    categoria: Optional[CategoriaOpera] = None,
    db: Session = Depends(get_db),
) -> NearbyResponse:
    """Restituisce le opere vicine tramite Haversine, con fallback sul polo di default."""
    try:
        return find_nearby_opere(
            db=db,
            lat=lat,
            lng=lng,
            radius_km=radius_km,
            categoria=categoria,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get("/opere/{opera_id}", response_model=OperaDetailOut)
def get_opera_detail(
    opera_id: int,
    db: Session = Depends(get_db),
) -> OperaDetailOut:
    """Restituisce la scheda dettagliata dell'opera con ente ed eventuale archivio."""
    catalog_service = CatalogService(db)
    try:
        return catalog_service.get_opera_detail(opera_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))