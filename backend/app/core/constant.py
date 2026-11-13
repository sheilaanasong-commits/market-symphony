"""Constantes invariantes de Market Symphony.

Ce module contient les valeurs qui ne doivent PAS être modifiées au gré des
expérimentations : chemins, noms de colonnes, identifiants et identité
audiovisuelle des régimes. Les paramètres réglables (fenêtres, nombre d'états,
tempo...) se trouvent dans ``config.yaml``.
"""

from __future__ import annotations

from enum import Enum
from pathlib import Path
from typing import Final

# -----------------------------------------------------------------------------
# Chemins
# -----------------------------------------------------------------------------
# backend/app/core/constant.py -> racine du dépôt = parents[3]
ROOT_DIR: Final[Path] = Path(__file__).resolve().parents[3]
BACKEND_DIR: Final[Path] = ROOT_DIR / "backend"
CONFIG_PATH: Final[Path] = ROOT_DIR / "config.yaml"
DATA_DIR: Final[Path] = ROOT_DIR / "data"
MODELS_DIR: Final[Path] = ROOT_DIR / "models"
FRONTEND_PRESETS_DIR: Final[Path] = ROOT_DIR / "frontend" / "public" / "presets"

HMM_MODEL_FILENAME: Final[str] = "hmm_regimes.joblib"
KMEANS_MODEL_FILENAME: Final[str] = "kmeans_regimes.joblib"

# -----------------------------------------------------------------------------
# Finance
# -----------------------------------------------------------------------------
TRADING_DAYS_PER_YEAR: Final[int] = 252
DATE_FORMAT: Final[str] = "%Y-%m-%d"

# -----------------------------------------------------------------------------
# Colonnes
# -----------------------------------------------------------------------------
COL_DATE: Final[str] = "date"
COL_OPEN: Final[str] = "open"
COL_HIGH: Final[str] = "high"
COL_LOW: Final[str] = "low"
COL_CLOSE: Final[str] = "close"
COL_VOLUME: Final[str] = "volume"
OHLCV_COLUMNS: Final[tuple[str, ...]] = (COL_OPEN, COL_HIGH, COL_LOW, COL_CLOSE, COL_VOLUME)

COL_LOG_RETURN: Final[str] = "log_return"
COL_VOLATILITY: Final[str] = "volatility"
COL_DRAWDOWN: Final[str] = "drawdown"
COL_REL_VOLUME: Final[str] = "relative_volume"
COL_REGIME: Final[str] = "regime"


def momentum_col(window: int) -> str:
    """Nom de la colonne de momentum pour une fenêtre donnée (ex. ``momentum_20``)."""
    return f"momentum_{window}"


# -----------------------------------------------------------------------------
# Régimes de marché (§1.1 / §5)
# -----------------------------------------------------------------------------
class Regime(str, Enum):
    """Les quatre régimes détectés, dans l'ordre d'intensité croissante."""

    CALM = "calm"
    BULL = "bull"
    NERVOUS = "nervous"
    PANIC = "panic"


# Identité audiovisuelle de chaque régime : couleur (charte §7), gamme et
# instrument (Tone.js), forme (p5.js), explication courte (F5).
REGIME_PROFILES: Final[dict[Regime, dict[str, object]]] = {
    Regime.CALM: {
        "label_fr": "Calme",
        "color": "#3B82F6",
        "palette": ["#1E3A8A", "#3B82F6", "#93C5FD"],
        "scale": "major",
        "scale_intervals": [0, 2, 4, 5, 7, 9, 11],
        "instrument": "soft_piano",
        "articulation": "legato",
        "shape": "circle",
        "description": "Le marché respire : faible volatilité, variations modestes.",
    },
    Regime.BULL: {
        "label_fr": "Haussier",
        "color": "#22C55E",
        "palette": ["#15803D", "#22C55E", "#EAB308"],
        "scale": "pentatonic",
        "scale_intervals": [0, 2, 4, 7, 9],
        "instrument": "bright_synth",
        "articulation": "lively",
        "shape": "spiral",
        "description": "Les prix montent avec confiance : rendements positifs et réguliers.",
    },
    Regime.NERVOUS: {
        "label_fr": "Nerveux",
        "color": "#F97316",
        "palette": ["#C2410C", "#F97316", "#FDBA74"],
        "scale": "minor",
        "scale_intervals": [0, 2, 3, 5, 7, 8, 10],
        "instrument": "pluck",
        "articulation": "staccato",
        "shape": "triangle",
        "description": "L'incertitude monte : la volatilité augmente, la tendance hésite.",
    },
    Regime.PANIC: {
        "label_fr": "Panique",
        "color": "#EF4444",
        "palette": ["#7F1D1D", "#EF4444", "#FCA5A5"],
        "scale": "dissonant",
        "scale_intervals": [0, 1, 3, 6, 7, 10],  # secondes mineures + triton
        "instrument": "low_percussion",
        "articulation": "accented",
        "shape": "shard",
        "description": "Krach : forte baisse et volatilité extrême, les investisseurs fuient.",
    },
}

DISCLAIMER_FR: Final[str] = "Projet éducatif — pas de conseil en investissement."
