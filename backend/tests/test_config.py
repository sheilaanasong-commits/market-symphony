"""Tests de la validation de config.yaml."""

from __future__ import annotations

import copy
from typing import Any

import pytest
import yaml
from pydantic import ValidationError

from app.core.config import Settings
from app.core.constant import CONFIG_PATH

RAW: dict[str, Any] = yaml.safe_load(CONFIG_PATH.read_text(encoding="utf-8"))


def _with(path: str, value: Any) -> dict[str, Any]:
    """Copie de la config brute avec ``path`` (ex. ``features.volatility_window``) remplacé."""
    raw = copy.deepcopy(RAW)
    *parents, leaf = path.split(".")
    node = raw
    for key in parents:
        node = node[int(key)] if key.isdigit() else node[key]
    node[leaf] = value
    return raw


def test_project_config_is_valid() -> None:
    Settings.model_validate(RAW)


@pytest.mark.parametrize(("path", "value"), [
    ("features.volatility_wndow", 20),               # faute de frappe → clé inconnue
    ("features.model_inputs", ["log_return", "rsi"]),  # feature inexistante
    ("presets.0.end", "1900-01-01"),                  # end < start (avant toute donnée)
    ("presets.0.ticker", "../secret"),                # ticker invalide
    ("sonification.tempo_bpm", {"min": 200, "max": 100}),  # intervalle inversé
    ("playback.default_speed", 3),                    # vitesse absente de la liste
    ("models.n_regimes", 5),                          # le projet repose sur 4 régimes
])
def test_invalid_config_is_rejected(path: str, value: Any) -> None:
    with pytest.raises(ValidationError):
        Settings.model_validate(_with(path, value))
