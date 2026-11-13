"""Point d'entrée FastAPI.

Lancement local (depuis ``backend/``) ::

    uvicorn app.main:app --reload
"""

from __future__ import annotations

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router
from app.core.config import get_config
from app.core.constant import DISCLAIMER_FR

cfg = get_config()
logging.basicConfig(level=cfg["logging"]["level"])

app = FastAPI(
    title=cfg["project"]["name"],
    version=cfg["project"]["version"],
    description=f"{cfg['project']['description']}. {DISCLAIMER_FR}",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=cfg["api"]["cors_origins"],
    allow_methods=["GET"],
    allow_headers=["*"],
)
app.include_router(router)
