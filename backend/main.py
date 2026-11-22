from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.endpoints import ai, health, opere, qr

app = FastAPI(
    title="Cogito API",
    description="Backend REST per Cogito — Beyond the Museum",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api/v1", tags=["Health"])
app.include_router(opere.router, prefix="/api/v1", tags=["Opere"])
app.include_router(qr.router, prefix="/api/v1", tags=["QR"])
app.include_router(ai.router, prefix="/api/v1", tags=["AI"])