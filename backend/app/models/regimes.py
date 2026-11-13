"""Détection des régimes de marché : K-Means (référence) et HMM gaussien (§4.2)."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any, Literal

import joblib
import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler

from app.core.config import get_settings
from app.core.constant import COL_LOG_RETURN, COL_REGIME, COL_VOLATILITY, Regime

ModelKind = Literal["hmm", "kmeans"]


def label_states(features: pd.DataFrame, states: np.ndarray) -> dict[int, Regime]:
    """Nomme chaque état d'après ses moyennes de rendement et de volatilité.

    1. volatilité la plus forte                              → PANIC
    2. parmi le reste, meilleur ratio rendement / volatilité → BULL
    3. des deux restants, volatilité la plus forte           → NERVOUS
    4. le dernier                                            → CALM

    Le ratio (type Sharpe) évite d'appeler « haussier » un état à rendement à
    peine positif mais très volatil (ex. marché baissier de 2022).
    """
    stats = (pd.DataFrame({"state": states,
                           "ret": features[COL_LOG_RETURN].to_numpy(),
                           "vol": features[COL_VOLATILITY].to_numpy()})
             .groupby("state").mean())
    if len(stats) != len(Regime):
        raise ValueError(f"Nommage impossible : {len(stats)} états observés, {len(Regime)} attendus")

    panic = stats["vol"].idxmax()
    rest = stats.drop(panic)
    bull = (rest["ret"] / rest["vol"]).idxmax()
    rest = rest.drop(bull)
    nervous = rest["vol"].idxmax()
    calm = rest.drop(nervous).index[0]
    return {int(panic): Regime.PANIC, int(bull): Regime.BULL,
            int(nervous): Regime.NERVOUS, int(calm): Regime.CALM}


@dataclass(frozen=True)
class RegimeModel:
    """Enveloppe sérialisable : scaler + modèle + correspondance état → régime."""

    kind: ModelKind
    feature_names: tuple[str, ...]
    scaler: StandardScaler
    model: Any  # KMeans | GaussianHMM
    state_to_regime: dict[int, Regime]

    @classmethod
    def fit(cls, features: pd.DataFrame, feature_names: list[str], kind: ModelKind = "hmm",
            n_states: int | None = None) -> RegimeModel:
        """Entraîne le modèle. Les états ne sont nommés que pour 4 états (sinon dict vide)."""
        settings = get_settings()
        seed, n = settings.project.random_seed, n_states or settings.models.n_regimes

        scaler = StandardScaler()
        X = scaler.fit_transform(features[feature_names].to_numpy())

        if kind == "kmeans":
            p = settings.models.kmeans
            model = KMeans(n_clusters=n, n_init=p.n_init, max_iter=p.max_iter, random_state=seed).fit(X)
        else:
            from hmmlearn.hmm import GaussianHMM

            p = settings.models.hmm
            model = GaussianHMM(n_components=n, covariance_type=p.covariance_type,
                                n_iter=p.n_iter, tol=p.tol, random_state=seed).fit(X)

        mapping = label_states(features, model.predict(X)) if n == len(Regime) else {}
        return cls(kind, tuple(feature_names), scaler, model, mapping)

    def _matrix(self, features: pd.DataFrame) -> np.ndarray:
        missing = set(self.feature_names) - set(features.columns)
        if missing:
            raise ValueError(f"Features manquantes : {sorted(missing)}")
        return self.scaler.transform(features[list(self.feature_names)].to_numpy())

    def predict_states(self, features: pd.DataFrame) -> np.ndarray:
        """Numéro d'état brut de chaque jour."""
        return np.asarray(self.model.predict(self._matrix(features)))

    def predict(self, features: pd.DataFrame) -> pd.Series:
        """Régime nommé (``calm``, ``bull``...) de chaque jour."""
        if not self.state_to_regime:
            raise ValueError("Modèle sans nommage des états (entraîné avec ≠ 4 états)")
        names = {s: r.value for s, r in self.state_to_regime.items()}
        return pd.Series(self.predict_states(features), index=features.index, name=COL_REGIME).map(names)

    def transition_matrix(self) -> pd.DataFrame:
        """Matrice de transition entre régimes nommés, dans l'ordre canonique (HMM uniquement)."""
        if self.kind != "hmm":
            raise ValueError("La matrice de transition n'existe que pour le HMM")
        labels = [self.state_to_regime[i].value for i in range(len(self.state_to_regime))]
        order = [r.value for r in Regime]
        return pd.DataFrame(self.model.transmat_, index=labels, columns=labels).loc[order, order]

    def save(self, path: Path) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        joblib.dump(self, path)

    @staticmethod
    def load(path: Path) -> RegimeModel:
        model = joblib.load(path)
        if not isinstance(model, RegimeModel):
            raise TypeError(f"{path} ne contient pas un RegimeModel")
        return model


def mean_regime_duration(regimes: pd.Series) -> float:
    """Durée moyenne (en jours) d'une séquence ininterrompue d'un même régime (§4.3)."""
    runs = (regimes != regimes.shift()).cumsum()
    return float(regimes.groupby(runs).size().mean())


@dataclass(frozen=True)
class Evaluation:
    """Résultat des critères de réussite §4.3."""

    panic_shares: dict[str, float]  # « 2008-09-15 → 2008-11-30 » → part de jours en panique
    mean_duration: float
    passed: bool

    def summary(self) -> str:
        parts = [f"panique {k[:7]} = {v:.0%}" for k, v in self.panic_shares.items()]
        return " · ".join([*parts, f"durée moyenne {self.mean_duration:.1f} j"])


def evaluate_regimes(regimes: pd.Series) -> Evaluation:
    """Crises de référence classées en panique et régimes suffisamment stables ?"""
    ev = get_settings().models.evaluation
    shares = {f"{p.start} → {p.end}": float((regimes.loc[str(p.start):str(p.end)] == Regime.PANIC.value).mean())
              for p in ev.panic_checks}
    duration = mean_regime_duration(regimes)
    passed = all(s >= ev.min_panic_share for s in shares.values()) and duration >= ev.min_mean_regime_duration
    return Evaluation(shares, duration, passed)
