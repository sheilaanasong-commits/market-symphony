"""Point d'entrée FastAPI.

Depuis ``backend/`` ::

    uvicorn app.main:app --reload     # développement
    python -m app.main                # hôte et port lus dans config.yaml
"""

from __future__ import annotations

import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router
from app.core.config import get_settings
from app.core.constant import DISCLAIMER_FR
from app.services.symphony import ModelNotTrainedError, get_model

settings = get_settings()  # valide config.yaml dès l'import : échec immédiat si invalide
logging.basicConfig(level=settings.logging.level, format="%(levelname)s %(name)s: %(message)s")
logger = logging.getLogger("market_symphony")


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    """Charge le modèle au démarrage : première requête rapide, problème signalé tôt."""
    try:
        get_model()
        logger.info("Modèle de régimes chargé")
    except ModelNotTrainedError as exc:
        logger.warning("%s — /symphony renverra 503", exc)
    yield


app = FastAPI(
    title=settings.project.name,
    version=settings.project.version,
    description=f"{settings.project.description}. {DISCLAIMER_FR}",
    lifespan=lifespan,
)
app.add_middleware(CORSMiddleware, allow_origins=settings.api.cors_origins,
                   allow_methods=["GET"], allow_headers=["*"])
app.include_router(router)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host=settings.api.host, port=settings.api.port)
