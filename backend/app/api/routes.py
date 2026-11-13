"""Points d'accès de l'API (§6.2). L'API ne fait que de l'inférence."""

from __future__ import annotations

from functools import lru_cache

import pandas as pd
from fastapi import APIRouter, HTTPException, Query

from app.api.schemas import Asset, Preset, RegimeInfo, SymphonyResponse, TransitionMatrix
from app.core.config import get_config
from app.core.constant import HMM_MODEL_FILENAME, MODELS_DIR, REGIME_PROFILES
from app.data.fetcher import load_prices
from app.features.engineering import compute_features
from app.models.regimes import RegimeModel
from app.sonification.mapping import build_score

router = APIRouter()


@lru_cache(maxsize=1)
def get_model() -> RegimeModel:
    path = MODELS_DIR / HMM_MODEL_FILENAME
    if not path.exists():
        raise HTTPException(503, "Modèle absent : lancer `python -m scripts.train` d'abord.")
    return RegimeModel.load(path)


def regime_legend() -> list[RegimeInfo]:
    return [
        RegimeInfo(id=r.value, label=str(p["label_fr"]), color=str(p["color"]),
                   scale=str(p["scale"]), description=str(p["description"]))
        for r, p in REGIME_PROFILES.items()
    ]


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/assets", response_model=list[Asset])
def list_assets() -> list[dict]:
    return get_config()["assets"]


@router.get("/presets", response_model=list[Preset])
def list_presets() -> list[dict]:
    return get_config()["presets"]


@router.get("/symphony", response_model=SymphonyResponse)
def symphony(
    ticker: str = Query(..., examples=["^GSPC"]),
    start: str = Query(..., examples=["2007-06-01"]),
    end: str = Query(..., examples=["2009-06-30"]),
) -> SymphonyResponse:
    start_ts, end_ts = pd.Timestamp(start), pd.Timestamp(end)
    if end_ts <= start_ts:
        raise HTTPException(422, "`end` doit être postérieure à `start`.")
    max_years = get_config()["api"]["max_years_per_request"]
    if (end_ts - start_ts).days > max_years * 366:
        raise HTTPException(422, f"Période limitée à {max_years} ans.")

    # Marge en amont pour que les fenêtres glissantes soient remplies dès `start`
    warmup_start = (start_ts - pd.Timedelta(days=400)).strftime("%Y-%m-%d")
    try:
        prices = load_prices(ticker, warmup_start, end)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(404, f"Données indisponibles pour {ticker} : {exc}") from exc

    features = compute_features(prices).loc[start:end]
    if features.empty:
        raise HTTPException(404, "Aucune séance exploitable sur cette période.")

    model = get_model()
    regimes = model.predict(features)
    return SymphonyResponse(
        ticker=ticker, start=start, end=end, model=model.kind,
        regimes=regime_legend(), days=build_score(features, regimes),  # type: ignore[arg-type]
    )


@router.get("/regimes/transition", response_model=TransitionMatrix)
def transition() -> TransitionMatrix:
    tm = get_model().transition_matrix()
    return TransitionMatrix(labels=list(tm.index), matrix=tm.round(4).values.tolist())
