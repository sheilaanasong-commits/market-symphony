"""Collecte des prix OHLCV journaliers avec cache Parquet (§3)."""

from __future__ import annotations

import logging
import re
import time
from datetime import date
from pathlib import Path

import pandas as pd

from app.core.config import TICKER_PATTERN, get_settings
from app.core.constant import COL_CLOSE, COL_DATE, OHLCV_COLUMNS

logger = logging.getLogger(__name__)


class DataUnavailableError(RuntimeError):
    """Aucune donnée exploitable (ticker inconnu, réseau indisponible sans cache...)."""


def cache_file(ticker: str) -> Path:
    """Fichier Parquet d'un ticker. Le ticker est validé (il sert à construire un chemin)."""
    if not re.fullmatch(TICKER_PATTERN, ticker):
        raise ValueError(f"Ticker invalide : {ticker!r}")
    return get_settings().data.cache_dir / f"{ticker.replace('^', 'IDX_')}.parquet"


def download_prices(ticker: str, start: date | str, end: date | str | None = None) -> pd.DataFrame:
    """Télécharge l'historique via yfinance et renvoie un OHLCV propre (index ``date``)."""
    import yfinance as yf  # imports locaux : inutiles hors téléchargement
    from curl_cffi import requests as curl_requests

    from app.core.network import ca_bundle_path

    settings = get_settings()
    session = curl_requests.Session(impersonate="chrome", verify=ca_bundle_path(),
                                    timeout=settings.network.request_timeout_s)
    raw = yf.download(ticker, start=str(start), end=str(end) if end else None,
                      interval=settings.data.interval, auto_adjust=settings.data.auto_adjust,
                      progress=False, session=session)
    if raw is None or raw.empty:
        raise DataUnavailableError(f"Aucune donnée renvoyée par yfinance pour {ticker!r}")
    if isinstance(raw.columns, pd.MultiIndex):  # yfinance renvoie un MultiIndex (champ, ticker)
        raw.columns = raw.columns.get_level_values(0)
    df = raw.rename(columns=str.lower).reindex(columns=list(OHLCV_COLUMNS))
    df.index = pd.DatetimeIndex(df.index).tz_localize(None)
    df.index.name = COL_DATE
    return clean_prices(df)


def clean_prices(df: pd.DataFrame) -> pd.DataFrame:
    """Tri chronologique, suppression des doublons et des prix manquants ou non positifs."""
    df = df.sort_index()
    df = df[~df.index.duplicated(keep="last")]
    return df[df[COL_CLOSE].notna() & (df[COL_CLOSE] > 0)]


def _download_with_retries(ticker: str) -> pd.DataFrame:
    settings = get_settings().data
    for attempt in range(1, settings.download_retries + 2):
        try:
            return download_prices(ticker, settings.history_start)
        except Exception as exc:  # noqa: BLE001 — yfinance lève des exceptions hétérogènes
            if attempt > settings.download_retries:
                raise DataUnavailableError(f"Téléchargement impossible pour {ticker!r} : {exc}") from exc
            logger.info("Échec du téléchargement de %s (tentative %d) : %s", ticker, attempt, exc)
            time.sleep(attempt)
    raise AssertionError("unreachable")


def _write_atomic(df: pd.DataFrame, path: Path) -> None:
    """Écrit dans un fichier temporaire puis renomme : jamais de cache à moitié écrit."""
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(".tmp")
    df.to_parquet(tmp)
    tmp.replace(path)


def load_prices(ticker: str, start: date | str, end: date | str | None = None,
                refresh: bool = False) -> pd.DataFrame:
    """Prix OHLCV de ``ticker`` entre ``start`` et ``end`` (inclus).

    Le cache contient l'historique complet du ticker et est rafraîchi au-delà de
    ``cache_ttl_days``. Si le réseau échoue, le cache existant est utilisé (§11).
    """
    path = cache_file(ticker)
    ttl_s = get_settings().data.cache_ttl_days * 86_400
    is_fresh = path.exists() and time.time() - path.stat().st_mtime < ttl_s

    if refresh or not is_fresh:
        try:
            _write_atomic(_download_with_retries(ticker), path)
        except DataUnavailableError:
            if not path.exists():
                raise
            logger.warning("Réseau indisponible : utilisation du cache existant pour %s", ticker)

    df = pd.read_parquet(path)
    return df.loc[pd.Timestamp(start):pd.Timestamp(end) if end else None]
