"""RigScout FastAPI entrypoint."""

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src import __version__
from src.core.config import get_settings
from src.routers import catalog, health


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    settings = get_settings()
    if not settings.supabase_configured:
        # Beginner-friendly: service still boots without Supabase in Phase 1.
        print(
            "[RigScout API] Supabase not configured — running without service-role access. "
            "Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY for ingestion jobs."
        )
    yield


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title="RigScout API",
        version=__version__,
        description="Backend logic for RigScout: ingestion, scoring, compatibility, alerts.",
        lifespan=lifespan,
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(health.router)
    app.include_router(catalog.router)
    return app


app = create_app()
