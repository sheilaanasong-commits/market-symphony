"""Table de correspondance données financières -> paramètres audiovisuels (§5).

Le calcul est fait côté serveur pour que le frontend n'ait qu'à « jouer » la
partition reçue.
"""

from __future__ import annotations

from typing import Any

import numpy as np
import pandas as pd

from app.core.config import get_config
from app.core.constant import (
    COL_CLOSE,
    COL_LOG_RETURN,
    COL_REL_VOLUME,
    COL_VOLATILITY,
    REGIME_PROFILES,
    Regime,
)


def _lerp(t: float, lo: float, hi: float) -> float:
    return lo + (hi - lo) * float(np.clip(t, 0.0, 1.0))


def quantize_to_scale(position: float, regime: Regime) -> int:
    """Convertit une position dans [-1, 1] en note MIDI quantifiée sur la gamme du régime.

    La plage est limitée à ``octave_range`` octaves autour de ``base_midi_note``
    afin d'éviter un rendu désagréable (§11).
    """
    cfg = get_config()["sonification"]
    intervals: list[int] = REGIME_PROFILES[regime]["scale_intervals"]  # type: ignore[assignment]
    octaves = cfg["octave_range"]
    degrees = [o * 12 + i for o in range(-(octaves // 2) - 1, octaves // 2 + 1) for i in intervals]
    half_span = octaves * 12 / 2
    target = float(np.clip(position, -1, 1)) * half_span
    closest = min(degrees, key=lambda d: abs(d - target))
    return int(cfg["base_midi_note"] + closest)


def map_day(row: pd.Series, regime: Regime) -> dict[str, Any]:
    """Calcule les paramètres sonores et visuels d'une séance."""
    s_cfg = get_config()["sonification"]
    v_cfg = get_config()["visual"]

    ret_pos = row[COL_LOG_RETURN] / s_cfg["return_clip"]               # hausse -> aigu
    vmin, vmax = s_cfg["volatility_clip"]
    vol_t = (row[COL_VOLATILITY] - vmin) / (vmax - vmin)                 # 0 = calme, 1 = extrême
    volu_t = np.clip(row[COL_REL_VOLUME] / 3.0, 0, 1)                    # 3× la moyenne = max

    profile = REGIME_PROFILES[regime]
    return {
        "audio": {
            "midi": quantize_to_scale(ret_pos, regime),
            "velocity": round(_lerp(volu_t, s_cfg["velocity"]["min"], s_cfg["velocity"]["max"]), 3),
            "tempo_bpm": round(_lerp(vol_t, s_cfg["tempo"]["min_bpm"], s_cfg["tempo"]["max_bpm"]), 1),
            "reverb_wet": round(_lerp(vol_t, s_cfg["reverb"]["min_wet"], s_cfg["reverb"]["max_wet"]), 3),
            "instrument": profile["instrument"],
            "articulation": profile["articulation"],
        },
        "visual": {
            "y": round(float(np.clip(ret_pos, -1, 1)), 4),                   # position verticale
            "size": round(_lerp(vol_t, v_cfg["particle_size"]["min"], v_cfg["particle_size"]["max"]), 2),
            "agitation": round(_lerp(vol_t, v_cfg["agitation"]["min"], v_cfg["agitation"]["max"]), 3),
            "opacity": int(_lerp(volu_t, v_cfg["opacity"]["min"], v_cfg["opacity"]["max"])),
            "color": profile["color"],
            "shape": profile["shape"],
        },
    }


def build_score(features: pd.DataFrame, regimes: pd.Series) -> list[dict[str, Any]]:
    """Assemble la « partition » complète : une entrée par jour."""
    score: list[dict[str, Any]] = []
    for date, row in features.iterrows():
        regime = Regime(regimes.loc[date])
        score.append({
            "date": pd.Timestamp(date).strftime("%Y-%m-%d"),
            "close": round(float(row[COL_CLOSE]), 4),
            "features": {k: round(float(row[k]), 6) for k in get_config()["features"]["model_inputs"]},
            "regime": regime.value,
            **map_day(row, regime),
        })
    return score
