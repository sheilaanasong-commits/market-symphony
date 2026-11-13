"""Points d'accès de l'API (§6.2). Les routes ne font que traduire HTTP ↔ services."""

from __future__ import annotations

from datetime import date

from fastapi import APIRouter, HTTPException, Query

from app.api.schemas import Asset, Preset, SymphonyResponse, TransitionMatrix
from app.core.config import TICKER_PATTERN, get_settings
from app.data.fetcher import DataUnavailableError
from app.services import symphony as service

router = APIRouter()


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/assets", response_model=list[Asset])
def list_assets() -> list[Asset]:
    return [Asset(**a.model_dump()) for a in get_settings().assets]


@router.get("/presets", response_model=list[Preset])
def list_presets() -> list[Preset]:
    return [Preset(**p.model_dump()) for p in get_settings().presets]


@router.get("/symphony", response_model=SymphonyResponse)
def symphony(
    ticker: str = Query(..., pattern=TICKER_PATTERN, examples=["^GSPC"]),
    start: date = Query(..., examples=["2007-06-01"]),
    end: date = Query(..., examples=["2009-06-30"]),
) -> SymphonyResponse:
    """Pour chaque jour : prix, features, régime et paramètres audiovisuels."""
    try:
        return service.compose_symphony(ticker, start, end)
    except service.InvalidPeriodError as exc:
        raise HTTPException(422, str(exc)) from exc
    except DataUnavailableError as exc:
        raise HTTPException(404, str(exc)) from exc
    except service.ModelNotTrainedError as exc:
        raise HTTPException(503, str(exc)) from exc


@router.get("/regimes/transition", response_model=TransitionMatrix)
def transition() -> TransitionMatrix:
    try:
        return service.transition_matrix()
    except service.ModelNotTrainedError as exc:
        raise HTTPException(503, str(exc)) from exc
