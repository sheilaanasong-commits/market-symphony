"""Chargement de ``config.yaml``.

Usage ::

    from app.core.config import get_config
    cfg = get_config()
    cfg["features"]["volatility_window"]
"""

from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path
from typing import Any

import yaml

from app.core.constant import CONFIG_PATH, ROOT_DIR


@lru_cache(maxsize=1)
def get_config(path: str | None = None) -> dict[str, Any]:
    """Lit et met en cache la configuration YAML.

    Le chemin peut être surchargé par la variable d'environnement
    ``MARKET_SYMPHONY_CONFIG`` (utile pour les tests ou le déploiement).
    """
    config_path = Path(path or os.getenv("MARKET_SYMPHONY_CONFIG", CONFIG_PATH))
    with config_path.open(encoding="utf-8") as f:
        return yaml.safe_load(f)


def resolve_path(relative: str) -> Path:
    """Convertit un chemin relatif de la config en chemin absolu depuis la racine."""
    path = Path(relative)
    return path if path.is_absolute() else ROOT_DIR / path
