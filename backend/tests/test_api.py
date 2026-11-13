"""Tests de l'API (routes ne nécessitant ni réseau ni modèle entraîné)."""

from __future__ import annotations

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health() -> None:
    assert client.get("/health").json() == {"status": "ok"}


def test_assets_contains_sp500() -> None:
    tickers = [a["ticker"] for a in client.get("/assets").json()]
    assert "^GSPC" in tickers


def test_presets_have_valid_dates() -> None:
    for p in client.get("/presets").json():
        assert p["start"] < p["end"]


def test_symphony_rejects_inverted_dates() -> None:
    r = client.get("/symphony", params={"ticker": "^GSPC", "start": "2020-01-01", "end": "2019-01-01"})
    assert r.status_code == 422
