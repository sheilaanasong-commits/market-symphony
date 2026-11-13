"""Pré-calcule les préréglages en JSON pour le frontend (§11 : backend en veille).

Depuis ``backend/`` ::

    python -m scripts.export_presets
"""

from __future__ import annotations

import json
import logging

from app.api.routes import symphony
from app.core.config import get_config
from app.core.constant import FRONTEND_PRESETS_DIR

logger = logging.getLogger("export_presets")


def main() -> None:
    logging.basicConfig(level="INFO")
    FRONTEND_PRESETS_DIR.mkdir(parents=True, exist_ok=True)
    for preset in get_config()["presets"]:
        result = symphony(ticker=preset["ticker"], start=preset["start"], end=preset["end"])
        out = FRONTEND_PRESETS_DIR / f"{preset['id']}.json"
        out.write_text(json.dumps(result.model_dump(), ensure_ascii=False), encoding="utf-8")
        logger.info("%s -> %s (%d jours)", preset["id"], out.name, len(result.days))


if __name__ == "__main__":
    main()
