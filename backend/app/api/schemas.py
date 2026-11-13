"""Schémas Pydantic des réponses de l'API (§6.2).

Miroir côté frontend : frontend/src/types/symphony.ts (vérifié par test.py).
"""

from __future__ import annotations

from datetime import date
from typing import Literal

from pydantic import BaseModel

RegimeId = Literal["calm", "bull", "nervous", "panic"]


class Asset(BaseModel):
    ticker: str
    name: str
    type: str
    source: str


class Preset(BaseModel):
    id: str
    name: str
    ticker: str
    start: date
    end: date


class RegimeInfo(BaseModel):
    id: RegimeId
    label: str
    color: str
    scale: str
    description: str


class AudioParams(BaseModel):
    midi: int
    velocity: float
    tempo_bpm: float
    reverb_wet: float
    instrument: str
    articulation: str


class VisualParams(BaseModel):
    y: float
    size: float
    agitation: float
    opacity: int
    color: str
    shape: str


class SymphonyDay(BaseModel):
    date: date
    close: float
    features: dict[str, float]
    regime: RegimeId
    audio: AudioParams
    visual: VisualParams


class SymphonyResponse(BaseModel):
    ticker: str
    start: date
    end: date
    model: str
    regimes: list[RegimeInfo]
    days: list[SymphonyDay]


class TransitionMatrix(BaseModel):
    labels: list[RegimeId]
    matrix: list[list[float]]
