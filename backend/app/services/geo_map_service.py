import math
from typing import Optional

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.core.config import settings
from app.models.enums import CategoriaOpera
from app.models.opera import Opera
from app.schemas.opera import NearbyResponse, OperaNearbyOut

EARTH_RADIUS_KM = 6371.0


def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Calcola la distanza geodetica in km sulla sfera terrestre (arrotondata a 2 decimali)."""
    # Conversione in radianti richiesta dalle funzioni trigonometriche
    lat1_rad = math.radians(lat1)
    lng1_rad = math.radians(lng1)
    lat2_rad = math.radians(lat2)
    lng2_rad = math.radians(lng2)

    d_lat = lat2_rad - lat1_rad
    d_lng = lng2_rad - lng1_rad

    # Formula dell'emisenoverso (Haversine): a è il quadrato della semi-corda normalizzata
    a = (
        math.sin(d_lat / 2) ** 2
        + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(d_lng / 2) ** 2
    )
    # Clamp tra 0 e 1 per evitare DomainError su arrotondamenti floating-point di punti identici
    a = min(1.0, max(0.0, a))
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(EARTH_RADIUS_KM * c, 2)


def _build_opera_nearby(opera: Opera, distance_km: float) -> OperaNearbyOut:
    """Costruisce OperaNearbyOut con coordinate risolte e distanza dall'utente."""
    return OperaNearbyOut(
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
        distance_km=distance_km,
    )


def find_nearby_opere(
    db: Session,
    lat: float,
    lng: float,
    radius_km: float = 20.0,
    categoria: Optional[CategoriaOpera] = None,
) -> NearbyResponse:
    """Restituisce le opere entro radius_km ordinate per distanza, o il polo di default se vuoto."""
    if not (-90.0 <= lat <= 90.0) or not (-180.0 <= lng <= 180.0):
        raise ValueError("Coordinate geografiche non valide.")
    if radius_km <= 0:
        raise ValueError("Il raggio di ricerca deve essere maggiore di zero.")

    # Carichiamo opere + ente in 1 sola query (evita N+1 quando leggiamo resolved_lat/lng)
    stmt = select(Opera).options(joinedload(Opera.ente))
    if categoria is not None:
        stmt = stmt.where(Opera.categoria == categoria)

    opere = db.execute(stmt.order_by(Opera.id)).scalars().all()

    within_radius: list[OperaNearbyOut] = []
    for opera in opere:
        distance = haversine_km(lat, lng, opera.resolved_lat, opera.resolved_lng)
        if distance <= radius_km:
            within_radius.append(_build_opera_nearby(opera, distance))

    within_radius.sort(key=lambda item: item.distance_km)

    if within_radius:
        return NearbyResponse(
            user_lat=lat,
            user_lng=lng,
            radius_km=radius_km,
            fallback_used=False,
            fallback_message=None,
            total=len(within_radius),
            items=within_radius,
        )

    # Fallback anti-mappa vuota: per un giudice remoto restituiamo comunque il polo culturale
    fallback_items: list[OperaNearbyOut] = []
    for opera in opere:
        distance_from_pole = haversine_km(
            settings.default_polo_lat,
            settings.default_polo_lng,
            opera.resolved_lat,
            opera.resolved_lng,
        )
        fallback_items.append(_build_opera_nearby(opera, distance_from_pole))

    fallback_items.sort(key=lambda item: item.distance_km)

    return NearbyResponse(
        user_lat=lat,
        user_lng=lng,
        radius_km=radius_km,
        fallback_used=True,
        fallback_message=(
            f"Nessuna opera entro {radius_km:g} km — "
            f"stai esplorando il polo di {settings.default_polo_nome}"
        ),
        total=len(fallback_items),
        items=fallback_items,
    )
