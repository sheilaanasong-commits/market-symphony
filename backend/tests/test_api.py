"""Tests de l'API : validation des entrées (aucun réseau ni modèle requis)."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health() -> None:
    assert client.get("/health").json() == {"status": "ok"}


def test_assets_contains_sp500() -> None:
    assert "^GSPC" in [a["ticker"] for a in client.get("/assets").json()]


def test_presets_have_ordered_iso_dates() -> None:
    for p in client.get("/presets").json():
        assert len(p["start"]) == 10 and p["start"] < p["end"]


@pytest.mark.parametrize("params", [
    {"ticker": "^GSPC", "start": "2020-01-01", "end": "2019-01-01"},   # dates inversées
    {"ticker": "^GSPC", "start": "pas-une-date", "end": "2019-01-01"},  # date invalide
    {"ticker": "../../etc", "start": "2019-01-01", "end": "2020-01-01"},  # ticker dangereux
    {"ticker": "^GSPC", "start": "1990-01-01", "end": "2020-01-01"},   # période trop longue
    {"ticker": "^GSPC", "start": "2019-01-01"},                         # paramètre manquant
])
def test_symphony_rejects_invalid_input(params: dict[str, str]) -> None:
    assert client.get("/symphony", params=params).status_code == 422
