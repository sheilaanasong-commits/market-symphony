"""Tests unitaires du calcul des features (§8 — qualité du code)."""

from __future__ import annotations

import numpy as np
import pandas as pd
import pytest

from app.features.engineering import compute_features, feature_columns


@pytest.fixture
def prices() -> pd.DataFrame:
    rng = np.random.default_rng(42)
    n = 300
    close = 100 * np.exp(np.cumsum(rng.normal(0, 0.01, n)))
    idx = pd.bdate_range("2020-01-01", periods=n, name="date")
    return pd.DataFrame({"open": close, "high": close, "low": close, "close": close,
                         "volume": rng.integers(1_000, 2_000, n)}, index=idx)


def test_all_feature_columns_present(prices: pd.DataFrame) -> None:
    out = compute_features(prices)
    assert set(feature_columns()) <= set(out.columns)
    assert not out[feature_columns()].isna().any().any()


def test_log_return_definition(prices: pd.DataFrame) -> None:
    out = compute_features(prices, dropna=False)
    expected = np.log(prices["close"].iloc[1] / prices["close"].iloc[0])
    assert out["log_return"].iloc[1] == pytest.approx(expected)


def test_drawdown_is_non_positive(prices: pd.DataFrame) -> None:
    assert (compute_features(prices)["drawdown"] <= 0).all()


def test_volatility_is_annualized(prices: pd.DataFrame) -> None:
    out = compute_features(prices, dropna=False)
    raw = out["log_return"].iloc[1:21].std()
    assert out["volatility"].iloc[20] == pytest.approx(raw * np.sqrt(252))


def test_zero_volume_gives_neutral_relative_volume(prices: pd.DataFrame) -> None:
    prices["volume"] = 0
    assert (compute_features(prices)["relative_volume"] == 1.0).all()
