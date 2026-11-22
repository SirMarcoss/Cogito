from app.endpoints import health


app.include_router(health.router, prefix="/api/v1", tags=["Health"])