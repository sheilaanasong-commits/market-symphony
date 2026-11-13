"""Tests du nommage automatique des régimes et des utilitaires (§4.2 / §4.3)."""

from __future__ import annotations

import numpy as np
import pandas as pd

from app.core.constant import Regime
from app.models.regimes import label_states, mean_regime_duration


def _frame(stats: dict[int, tuple[float, float]]) -> tuple[pd.DataFrame, np.ndarray]:
    """Construit des features dont chaque état a exactement (rendement, volatilité) donnés."""
    states = np.repeat(list(stats), 10)
    ret = np.array([stats[s][0] for s in states])
    vol = np.array([stats[s][1] for s in states])
    return pd.DataFrame({"log_return": ret, "volatility": vol}), states


def test_labels_match_real_sp500_profile() -> None:
    # Profil observé sur le S&P 500 2000-2026 (rendement journalier moyen, vol annualisée)
    features, states = _frame({
        0: (0.001, 0.09),     # haussier tranquille
        1: (0.0000, 0.14),    # marché sans tendance
        2: (0.00006, 0.22),   # marché baissier agité (2022) — ne doit PAS être « haussier »
        3: (-0.0023, 0.47),   # krach
    })
    assert label_states(features, states) == {
        0: Regime.BULL, 1: Regime.CALM, 2: Regime.NERVOUS, 3: Regime.PANIC,
    }


def test_labels_are_a_bijection() -> None:
    rng = np.random.default_rng(0)
    features, states = _frame({i: (rng.normal(0, 0.001), rng.uniform(0.05, 0.6)) for i in range(4)})
    assert sorted(r.value for r in label_states(features, states).values()) == sorted(r.value for r in Regime)


def test_mean_regime_duration() -> None:
    assert mean_regime_duration(pd.Series(["a", "a", "b", "b", "b", "a"])) == 2.0
