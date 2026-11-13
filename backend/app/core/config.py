"""Chargement et validation de ``config.yaml``.

La configuration est validée **au démarrage** par Pydantic : une faute de frappe,
un type erroné ou une incohérence (ex. ``start >= end``) lève immédiatement une
erreur explicite, au lieu d'un ``KeyError`` au milieu d'une requête.

Usage ::

    from app.core.config import get_settings
    get_settings().features.volatility_window
"""

from __future__ import annotations

import os
from datetime import date
from functools import lru_cache
from pathlib import Path
from typing import Literal

import yaml
from pydantic import BaseModel, ConfigDict, Field, PositiveInt, field_validator, model_validator

from app.core.constant import (
    COL_DRAWDOWN,
    COL_LOG_RETURN,
    COL_REL_VOLUME,
    COL_VOLATILITY,
    CONFIG_PATH,
    ROOT_DIR,
    momentum_col,
)

TICKER_PATTERN = r"^[\^A-Za-z0-9.\-=]{1,20}$"


class _Strict(BaseModel):
    """Base : refuse les clés inconnues (détecte les fautes de frappe dans le YAML)."""

    model_config = ConfigDict(extra="forbid", frozen=True)


def _absolute(path: Path) -> Path:
    return path if path.is_absolute() else ROOT_DIR / path


class Range(_Strict):
    min: float
    max: float

    @model_validator(mode="after")
    def _ordered(self) -> Range:
        if self.min > self.max:
            raise ValueError(f"min ({self.min}) > max ({self.max})")
        return self

    def lerp(self, t: float) -> float:
        """Interpolation linéaire, ``t`` étant ramené dans [0, 1]."""
        return self.min + (self.max - self.min) * min(max(t, 0.0), 1.0)


class Period(_Strict):
    start: date
    end: date

    @model_validator(mode="after")
    def _ordered(self) -> Period:
        if self.start >= self.end:
            raise ValueError(f"start ({self.start}) doit précéder end ({self.end})")
        return self


# --- Sections ----------------------------------------------------------------
class ProjectCfg(_Strict):
    name: str
    version: str
    description: str
    random_seed: int


class TrainingCfg(_Strict):
    ticker: str = Field(pattern=TICKER_PATTERN)
    start: date
    end: date | None = None


class DataCfg(_Strict):
    primary_source: Literal["yfinance", "coingecko", "alphavantage"]
    fallback_source: Literal["yfinance", "coingecko", "alphavantage"] | None = None
    interval: Literal["1d"]
    auto_adjust: bool
    cache_dir: Path
    cache_ttl_days: PositiveInt
    download_retries: PositiveInt = 2
    training: TrainingCfg

    _abs = field_validator("cache_dir")(_absolute)


class AssetCfg(_Strict):
    ticker: str = Field(pattern=TICKER_PATTERN)
    name: str
    type: Literal["index", "stock", "crypto"]
    source: str


class PresetCfg(Period):
    id: str = Field(pattern=r"^[a-z0-9_]+$")
    name: str
    ticker: str = Field(pattern=TICKER_PATTERN)


class FeaturesCfg(_Strict):
    volatility_window: int = Field(ge=2)
    annualization_factor: PositiveInt
    momentum_windows: list[PositiveInt]
    drawdown_window: PositiveInt
    volume_window: PositiveInt
    model_inputs: list[str] = Field(min_length=1)

    @model_validator(mode="after")
    def _inputs_exist(self) -> FeaturesCfg:
        known = {COL_LOG_RETURN, COL_VOLATILITY, COL_DRAWDOWN, COL_REL_VOLUME,
                 *(momentum_col(w) for w in self.momentum_windows)}
        if unknown := set(self.model_inputs) - known:
            raise ValueError(f"model_inputs inconnus : {sorted(unknown)} (disponibles : {sorted(known)})")
        return self


class KMeansCfg(_Strict):
    n_init: PositiveInt
    max_iter: PositiveInt


class HMMCfg(_Strict):
    covariance_type: Literal["full", "diag", "tied", "spherical"]
    n_iter: PositiveInt
    tol: float = Field(gt=0)


class EvaluationCfg(_Strict):
    min_mean_regime_duration: float = Field(gt=0)
    min_panic_share: float = Field(ge=0, le=1)
    panic_checks: list[Period]


class ModelsCfg(_Strict):
    n_regimes: Literal[4]  # le nommage et la sonification reposent sur 4 régimes
    artifacts_dir: Path
    kmeans: KMeansCfg
    hmm: HMMCfg
    candidate_states: list[int] = Field(min_length=1)
    evaluation: EvaluationCfg

    _abs = field_validator("artifacts_dir")(_absolute)


class SonificationCfg(_Strict):
    base_midi_note: int = Field(ge=24, le=96)
    octave_range: int = Field(ge=1, le=4)
    return_clip: float = Field(gt=0)
    volatility: Range  # volatilité annualisée ramenée dans cet intervalle
    relative_volume_max: float = Field(gt=0)
    tempo_bpm: Range
    reverb_wet: Range
    velocity: Range


class VisualCfg(_Strict):
    target_fps: PositiveInt
    particle_size: Range
    agitation: Range
    opacity: Range


class PlaybackCfg(_Strict):
    speeds: list[PositiveInt]
    default_speed: PositiveInt
    ms_per_day_at_x1: PositiveInt

    @model_validator(mode="after")
    def _default_in_speeds(self) -> PlaybackCfg:
        if self.default_speed not in self.speeds:
            raise ValueError(f"default_speed {self.default_speed} absent de {self.speeds}")
        return self


class ApiCfg(_Strict):
    host: str
    port: int = Field(ge=1, le=65535)
    cors_origins: list[str]
    cors_origin_regex: str | None = None  # ex. tout port localhost en développement
    max_years_per_request: PositiveInt
    warmup_days: PositiveInt
    response_time_target_s: float = Field(gt=0)


class LoggingCfg(_Strict):
    level: Literal["DEBUG", "INFO", "WARNING", "ERROR"]


class NetworkCfg(_Strict):
    use_system_certificates: Literal["auto"] | bool
    ca_bundle_file: Path
    request_timeout_s: PositiveInt

    _abs = field_validator("ca_bundle_file")(_absolute)


class Settings(_Strict):
    project: ProjectCfg
    data: DataCfg
    assets: list[AssetCfg] = Field(min_length=1)
    presets: list[PresetCfg]
    features: FeaturesCfg
    models: ModelsCfg
    sonification: SonificationCfg
    visual: VisualCfg
    playback: PlaybackCfg
    api: ApiCfg
    logging: LoggingCfg
    network: NetworkCfg

    @model_validator(mode="after")
    def _unique_preset_ids(self) -> Settings:
        ids = [p.id for p in self.presets]
        if len(ids) != len(set(ids)):
            raise ValueError(f"Identifiants de préréglages en double : {ids}")
        return self

    def preset(self, preset_id: str) -> PresetCfg:
        return next(p for p in self.presets if p.id == preset_id)


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Lit, valide et met en cache la configuration.

    Le chemin peut être surchargé par la variable d'environnement
    ``MARKET_SYMPHONY_CONFIG`` (tests, déploiement).
    """
    path = Path(os.getenv("MARKET_SYMPHONY_CONFIG", CONFIG_PATH))
    with path.open(encoding="utf-8") as f:
        return Settings.model_validate(yaml.safe_load(f))
