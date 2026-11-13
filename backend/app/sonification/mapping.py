"""Table de correspondance données financières → paramètres audiovisuels (§5).

Calculée côté serveur : le frontend n'a qu'à « jouer » la partition reçue.
"""

from __future__ import annotations

from functools import lru_cache
from typing import Any

import numpy as np
import pandas as pd

from app.core.config import get_settings
from app.core.constant import (
    COL_CLOSE,
    COL_LOG_RETURN,
    COL_REL_VOLUME,
    COL_VOLATILITY,
    REGIME_PROFILES,
    Regime,
)


@lru_cache(maxsize=None)
def _scale_degrees(regime: Regime) -> np.ndarray:
    """Demi-tons autorisés (relatifs à la note de base) pour la gamme d'un régime."""
    octaves = get_settings().sonification.octave_range
    intervals = REGIME_PROFILES[regime]["scale_intervals"]
    return np.array(sorted(12 * o + i for o in range(-octaves, octaves + 1) for i in intervals))  # type: ignore[union-attr]


def quantize_to_scale(position: float, regime: Regime) -> int:
    """Convertit une position dans [-1, 1] en note MIDI de la gamme du régime.

    La plage est limitée à ``octave_range`` octaves (± la moitié autour de la base)
    pour éviter un rendu désagréable (§11).
    """
    cfg = get_settings().sonification
    target = float(np.clip(position, -1, 1)) * cfg.octave_range * 6  # demi-étendue en demi-tons
    degrees = _scale_degrees(regime)
    return int(cfg.base_midi_note + degrees[np.abs(degrees - target).argmin()])


def map_day(log_return: float, volatility: float, relative_volume: float, regime: Regime) -> dict[str, Any]:
    """Paramètres sonores et visuels d'une séance."""
    s, v = get_settings().sonification, get_settings().visual
    pitch = log_return / s.return_clip                                      # hausse → aigu
    vol_span = max(s.volatility.max - s.volatility.min, 1e-9)
    agitation = (volatility - s.volatility.min) / vol_span                  # 0 calme → 1 extrême
    intensity = relative_volume / s.relative_volume_max                     # 1 = volume maximal
    profile = REGIME_PROFILES[regime]
    return {
        "audio": {
            "midi": quantize_to_scale(pitch, regime),
            "velocity": round(s.velocity.lerp(intensity), 3),
            "tempo_bpm": round(s.tempo_bpm.lerp(agitation), 1),
            "reverb_wet": round(s.reverb_wet.lerp(agitation), 3),
            "instrument": profile["instrument"],
            "articulation": profile["articulation"],
        },
        "visual": {
            "y": round(float(np.clip(pitch, -1, 1)), 4),
            "size": round(v.particle_size.lerp(agitation), 2),
            "agitation": round(v.agitation.lerp(agitation), 3),
            "opacity": int(v.opacity.lerp(intensity)),
            "color": profile["color"],
            "shape": profile["shape"],
        },
    }


def build_score(features: pd.DataFrame, regimes: pd.Series) -> list[dict[str, Any]]:
    """Assemble la « partition » : une entrée par jour, dans l'ordre chronologique."""
    if not features.index.equals(regimes.index):
        raise ValueError("Les features et les régimes doivent avoir le même index")
    inputs = get_settings().features.model_inputs
    rows = features[[COL_CLOSE, *inputs]].astype(float).to_dict("records")
    return [
        {
            "date": day.strftime("%Y-%m-%d"),
            "close": round(row[COL_CLOSE], 4),
            "features": {k: round(row[k], 6) for k in inputs},  # arrondi d'affichage uniquement
            "regime": regime,
            **map_day(row[COL_LOG_RETURN], row[COL_VOLATILITY], row[COL_REL_VOLUME], Regime(regime)),
        }
        for day, row, regime in zip(features.index, rows, regimes)
    ]
