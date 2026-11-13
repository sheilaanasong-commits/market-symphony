"""Collecte des prix OHLCV journaliers avec cache Parquet (§3)."""

from __future__ import annotations

import logging
import time
from pathlib import Path

import pandas as pd

from app.core.config import get_config, resolve_path
from app.core.constant import COL_DATE, OHLCV_COLUMNS

logger = logging.getLogger(__name__)


def _cache_file(ticker: str) -> Path:
    """Chemin du fichier Parquet associé à un ticker (caractères spéciaux neutralisés)."""
    safe = ticker.replace("^", "IDX_").replace("/", "_")
    return resolve_path(get_config()["data"]["cache_dir"]) / f"{safe}.parquet"


def _is_fresh(path: Path, ttl_days: int) -> bool:
    return path.exists() and (time.time() - path.stat().st_mtime) < ttl_days * 86400


def _download_yfinance(ticker: str, start: str, end: str | None) -> pd.DataFrame:
    """Télécharge l'historique via yfinance et normalise les colonnes."""
    import yfinance as yf  # import local : dépendance réseau optionnelle pour les tests
    from curl_cffi import requests as curl_requests

    from app.core.network import ca_bundle_path

    cfg = get_config()["data"]
    # Session explicite : bundle CA compatible antivirus (voir app/core/network.py)
    session = curl_requests.Session(
        impersonate="chrome",
        verify=ca_bundle_path(),
        timeout=get_config()["network"]["request_timeout_s"],
    )
    raw = yf.download(
        ticker,
        start=start,
        end=end,
        interval=cfg["interval"],
        auto_adjust=cfg["auto_adjust"],
        progress=False,
        session=session,
    )
    if raw.empty:
        raise ValueError(f"Aucune donnée renvoyée par yfinance pour {ticker!r}")
    if isinstance(raw.columns, pd.MultiIndex):  # yfinance >= 0.2 renvoie un MultiIndex
        raw.columns = raw.columns.get_level_values(0)
    df = raw.rename(columns=str.lower)[list(OHLCV_COLUMNS)]
    df.index = pd.to_datetime(df.index).tz_localize(None)
    df.index.name = COL_DATE
    return df


def clean_prices(df: pd.DataFrame) -> pd.DataFrame:
    """Nettoyage : tri, doublons, jours manquants / prix non positifs."""
    df = df.sort_index()
    df = df[~df.index.duplicated(keep="last")]
    df = df.dropna(subset=["close"])
    return df[df["close"] > 0]


def load_prices(ticker: str, start: str, end: str | None = None, refresh: bool = False) -> pd.DataFrame:
    """Renvoie les prix OHLCV de ``ticker`` entre ``start`` et ``end``.

    Stratégie : le cache Parquet contient l'historique complet du ticker ; il est
    rafraîchi s'il est trop ancien. En cas d'échec réseau, le cache existant est
    utilisé (robustesse en démo, §11).
    """
    cfg = get_config()["data"]
    path = _cache_file(ticker)

    if refresh or not _is_fresh(path, cfg["cache_ttl_days"]):
        try:
            df = clean_prices(_download_yfinance(ticker, cfg["training"]["start"], None))
            path.parent.mkdir(parents=True, exist_ok=True)
            df.to_parquet(path)
        except Exception as exc:  # noqa: BLE001 — on bascule sur le cache
            if not path.exists():
                raise
            logger.warning("Téléchargement impossible (%s), utilisation du cache %s", exc, path)

    df = pd.read_parquet(path)
    return df.loc[start:end] if end else df.loc[start:]
