"""Schémas Pydantic des réponses de l'API (§6.2)."""

from __future__ import annotations

from pydantic import BaseModel


class Asset(BaseModel):
    ticker: str
    name: str
    type: str
    source: str


class Preset(BaseModel):
    id: str
    name: str
    ticker: str
    start: str
    end: str


class RegimeInfo(BaseModel):
    id: str
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
    date: str
    close: float
    features: dict[str, float]
    regime: str
    audio: AudioParams
    visual: VisualParams


class SymphonyResponse(BaseModel):
    ticker: str
    start: str
    end: str
    model: str
    regimes: list[RegimeInfo]
    days: list[SymphonyDay]


class TransitionMatrix(BaseModel):
    labels: list[str]
    matrix: list[list[float]]
