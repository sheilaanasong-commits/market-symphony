"""Tests de la table de correspondance audiovisuelle (§5)."""

from __future__ import annotations

from app.core.constant import REGIME_PROFILES, Regime
from app.sonification.mapping import quantize_to_scale


def test_higher_return_gives_higher_or_equal_pitch() -> None:
    for regime in Regime:
        notes = [quantize_to_scale(p, regime) for p in (-1.0, -0.5, 0.0, 0.5, 1.0)]
        assert notes == sorted(notes)


def test_notes_belong_to_regime_scale() -> None:
    for regime in Regime:
        intervals = set(REGIME_PROFILES[regime]["scale_intervals"])  # type: ignore[arg-type]
        for p in (-0.9, -0.3, 0.2, 0.8):
            assert (quantize_to_scale(p, regime) - 60) % 12 in intervals


def test_pitch_range_is_bounded() -> None:
    for regime in Regime:
        assert abs(quantize_to_scale(5.0, regime) - 60) <= 24
