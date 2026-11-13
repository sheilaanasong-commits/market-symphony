"""Calcul des variables explicatives (§4.1)."""

from __future__ import annotations

import numpy as np
import pandas as pd

from app.core.config import get_settings
from app.core.constant import (
    COL_CLOSE,
    COL_DRAWDOWN,
    COL_LOG_RETURN,
    COL_REL_VOLUME,
    COL_VOLATILITY,
    COL_VOLUME,
    momentum_col,
)


def feature_columns() -> list[str]:
    """Liste ordonnée des variables utilisées en entrée des modèles."""
    return list(get_settings().features.model_inputs)


def compute_features(prices: pd.DataFrame, dropna: bool = True) -> pd.DataFrame:
    """Ajoute les features au DataFrame OHLCV (une ligne par séance).

    - ``log_return``      : ln(P_t / P_{t-1})
    - ``volatility``      : écart-type glissant des rendements, annualisé (× √252)
    - ``momentum_<n>``    : rendement logarithmique cumulé sur n jours
    - ``drawdown``        : P_t / max glissant − 1 (toujours ≤ 0)
    - ``relative_volume`` : volume / moyenne mobile (1.0 si volume absent ou nul)

    Avec ``dropna=True``, les premières séances (fenêtres incomplètes) sont retirées.
    """
    if COL_CLOSE not in prices:
        raise ValueError(f"Colonne {COL_CLOSE!r} absente des prix")
    cfg = get_settings().features
    df = prices.copy()
    close = df[COL_CLOSE].astype(float)

    df[COL_LOG_RETURN] = np.log(close / close.shift(1))
    df[COL_VOLATILITY] = df[COL_LOG_RETURN].rolling(cfg.volatility_window).std() * np.sqrt(cfg.annualization_factor)
    for w in cfg.momentum_windows:
        df[momentum_col(w)] = df[COL_LOG_RETURN].rolling(w).sum()
    df[COL_DRAWDOWN] = close / close.rolling(cfg.drawdown_window, min_periods=1).max() - 1.0

    # Certains indices (ex. CAC 40 sur Yahoo) n'ont pas de volume fiable : valeur neutre 1.0
    volume = df.get(COL_VOLUME, pd.Series(np.nan, index=df.index)).astype(float).replace(0, np.nan)
    df[COL_REL_VOLUME] = (volume / volume.rolling(cfg.volume_window, min_periods=1).mean()).fillna(1.0)

    return df.dropna(subset=feature_columns()) if dropna else df
