"""Logique métier de l'API, indépendante de FastAPI (réutilisée par les scripts)."""

from __future__ import annotations

from datetime import date, timedelta
from functools import lru_cache

from app.api.schemas import RegimeInfo, SymphonyResponse, TransitionMatrix
from app.core.config import get_settings
from app.core.constant import HMM_MODEL_FILENAME, REGIME_PROFILES
from app.data.fetcher import load_prices
from app.features.engineering import compute_features
from app.models.regimes import RegimeModel
from app.sonification.mapping import build_score


class ModelNotTrainedError(RuntimeError):
    """Le modèle n'a pas encore été entraîné (``python -m scripts.train``)."""


class InvalidPeriodError(ValueError):
    """Période demandée incohérente ou trop longue."""


@lru_cache(maxsize=1)
def get_model() -> RegimeModel:
    path = get_settings().models.artifacts_dir / HMM_MODEL_FILENAME
    if not path.exists():
        raise ModelNotTrainedError("Modèle absent : lancer `python -m scripts.train` depuis backend/")
    return RegimeModel.load(path)


def regime_legend() -> list[RegimeInfo]:
    return [RegimeInfo(id=r.value, label=str(p["label_fr"]), color=str(p["color"]),
                       scale=str(p["scale"]), description=str(p["description"]))
            for r, p in REGIME_PROFILES.items()]


def validate_period(start: date, end: date) -> None:
    max_years = get_settings().api.max_years_per_request
    if end <= start:
        raise InvalidPeriodError("`end` doit être postérieure à `start`")
    if (end - start).days > max_years * 366:
        raise InvalidPeriodError(f"Période limitée à {max_years} ans")


def compose_symphony(ticker: str, start: date, end: date) -> SymphonyResponse:
    """Prix → features → régimes → partition audiovisuelle, pour chaque jour de la période.

    Lève ``InvalidPeriodError``, ``DataUnavailableError`` ou ``ModelNotTrainedError``.
    """
    validate_period(start, end)
    model = get_model()

    # Historique supplémentaire avant `start` pour que les fenêtres glissantes soient remplies
    warmup = start - timedelta(days=get_settings().api.warmup_days)
    features = compute_features(load_prices(ticker, warmup, end)).loc[str(start):str(end)]
    if features.empty:
        raise InvalidPeriodError(f"Aucune séance exploitable pour {ticker} entre {start} et {end}")

    return SymphonyResponse(
        ticker=ticker, start=start, end=end, model=model.kind,
        regimes=regime_legend(),
        days=build_score(features, model.predict(features)),  # type: ignore[arg-type]
    )


def transition_matrix() -> TransitionMatrix:
    tm = get_model().transition_matrix()
    return TransitionMatrix(labels=list(tm.index), matrix=tm.round(4).to_numpy().tolist())
