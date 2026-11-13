"""Calcul des variables explicatives (§4.1)."""

from __future__ import annotations

import numpy as np
import pandas as pd

from app.core.config import get_config
from app.core.constant import (
    COL_CLOSE,
    COL_DRAWDOWN,
    COL_LOG_RETURN,
    COL_REL_VOLUME,
    COL_VOLATILITY,
    COL_VOLUME,
    momentum_col,
)


def compute_features(prices: pd.DataFrame, dropna: bool = True) -> pd.DataFrame:
    """Ajoute les features au DataFrame OHLCV.

    - ``log_return``      : ln(P_t / P_{t-1})
    - ``volatility``      : écart-type glissant des rendements, annualisé (× √252)
    - ``momentum_<n>``    : rendement logarithmique cumulé sur n jours
    - ``drawdown``        : P_t / max glissant - 1 (≤ 0)
    - ``relative_volume`` : volume / moyenne mobile du volume (1.0 si volume absent)
    """
    cfg = get_config()["features"]
    df = prices.copy()
    close = df[COL_CLOSE]

    df[COL_LOG_RETURN] = np.log(close / close.shift(1))

    vol_w = cfg["volatility_window"]
    df[COL_VOLATILITY] = df[COL_LOG_RETURN].rolling(vol_w).std() * np.sqrt(cfg["annualization_factor"])

    for w in cfg["momentum_windows"]:
        df[momentum_col(w)] = df[COL_LOG_RETURN].rolling(w).sum()

    rolling_max = close.rolling(cfg["drawdown_window"], min_periods=1).max()
    df[COL_DRAWDOWN] = close / rolling_max - 1.0

    # Certains indices (ex. CAC 40 sur Yahoo) ont un volume nul : on neutralise à 1.0
    volume = df[COL_VOLUME].replace(0, np.nan) if COL_VOLUME in df else pd.Series(np.nan, index=df.index)
    avg_volume = volume.rolling(cfg["volume_window"], min_periods=1).mean()
    df[COL_REL_VOLUME] = (volume / avg_volume).fillna(1.0)

    if dropna:
        df = df.dropna(subset=feature_columns())
    return df


def feature_columns() -> list[str]:
    """Liste ordonnée des variables utilisées en entrée des modèles."""
    return list(get_config()["features"]["model_inputs"])
