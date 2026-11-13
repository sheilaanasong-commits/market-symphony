"""Pré-calcule les préréglages en JSON pour le frontend (§11 : backend en veille).

Depuis ``backend/`` ::

    python -m scripts.export_presets
"""

from __future__ import annotations

import json
import logging
import sys

from app.api.schemas import Preset
from app.core.config import get_settings
from app.core.constant import FRONTEND_PRESETS_DIR
from app.services.symphony import compose_symphony

log = logging.getLogger("export_presets")


def main() -> int:
    logging.basicConfig(level="INFO", format="%(message)s")
    FRONTEND_PRESETS_DIR.mkdir(parents=True, exist_ok=True)
    presets = get_settings().presets
    # Liste des préréglages, lisible par le frontend même si l'API est en veille
    index = [Preset(**p.model_dump()).model_dump(mode="json") for p in presets]
    (FRONTEND_PRESETS_DIR / "index.json").write_text(json.dumps(index, ensure_ascii=False, indent=1),
                                                     encoding="utf-8")
    failures = 0
    for preset in presets:
        try:
            result = compose_symphony(preset.ticker, preset.start, preset.end)
        except Exception as exc:  # noqa: BLE001 — on continue avec les autres préréglages
            failures += 1
            log.error("✘ %s : %s", preset.id, exc)
            continue
        out = FRONTEND_PRESETS_DIR / f"{preset.id}.json"
        out.write_text(result.model_dump_json(), encoding="utf-8")
        log.info("✔ %s → %s (%d jours)", preset.id, out.name, len(result.days))
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
