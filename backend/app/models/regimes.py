"""Détection des régimes de marché : K-Means (référence) et HMM gaussien (§4.2)."""

from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
from typing import Literal

import joblib
import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler

from app.core.config import get_config
from app.core.constant import COL_LOG_RETURN, COL_VOLATILITY, Regime

ModelKind = Literal["hmm", "kmeans"]


def label_states(features: pd.DataFrame, states: np.ndarray) -> dict[int, Regime]:
    """Nomme automatiquement chaque état d'après sa moyenne de rendement et de volatilité.

    Règles (4 états) :
      1. volatilité la plus forte                                   -> PANIC
      2. parmi le reste, meilleur ratio rendement / volatilité      -> BULL
      3. parmi les deux restants, volatilité la plus forte          -> NERVOUS
      4. le dernier                                                 -> CALM

    Le ratio (type Sharpe) évite de qualifier de « haussier » un état à
    rendement à peine positif mais très volatil (ex. marché baissier 2022).
    """
    stats = (
        pd.DataFrame({"state": states, "ret": features[COL_LOG_RETURN].to_numpy(),
                      "vol": features[COL_VOLATILITY].to_numpy()})
        .groupby("state")[["ret", "vol"]].mean()
    )
    if len(stats) != 4:
        raise ValueError("Le nommage automatique suppose exactement 4 états.")
    remaining = stats.copy()
    mapping: dict[int, Regime] = {}

    panic = int(remaining["vol"].idxmax())
    mapping[panic] = Regime.PANIC
    remaining = remaining.drop(panic)

    bull = int((remaining["ret"] / remaining["vol"]).idxmax())
    mapping[bull] = Regime.BULL
    remaining = remaining.drop(bull)

    nervous = int(remaining["vol"].idxmax())
    mapping[nervous] = Regime.NERVOUS
    remaining = remaining.drop(nervous)

    mapping[int(remaining.index[0])] = Regime.CALM
    return mapping


@dataclass
class RegimeModel:
    """Enveloppe sérialisable : scaler + modèle + correspondance état -> régime."""

    kind: ModelKind
    feature_names: list[str]
    scaler: StandardScaler
    model: object
    state_to_regime: dict[int, Regime] = field(default_factory=dict)

    # --- Entraînement -------------------------------------------------------
    @classmethod
    def fit(cls, features: pd.DataFrame, feature_names: list[str], kind: ModelKind = "hmm",
            n_states: int | None = None) -> RegimeModel:
        cfg = get_config()
        seed = cfg["project"]["random_seed"]
        n = n_states or cfg["models"]["n_regimes"]

        scaler = StandardScaler()
        X = scaler.fit_transform(features[feature_names].to_numpy())

        if kind == "kmeans":
            p = cfg["models"]["kmeans"]
            model: object = KMeans(n_clusters=n, n_init=p["n_init"], max_iter=p["max_iter"], random_state=seed).fit(X)
        else:
            from hmmlearn.hmm import GaussianHMM

            p = cfg["models"]["hmm"]
            model = GaussianHMM(n_components=n, covariance_type=p["covariance_type"],
                                n_iter=p["n_iter"], tol=p["tol"], random_state=seed).fit(X)

        instance = cls(kind=kind, feature_names=feature_names, scaler=scaler, model=model)
        if n == 4:
            instance.state_to_regime = label_states(features, instance.predict_states(features))
        return instance

    # --- Inférence ----------------------------------------------------------
    def predict_states(self, features: pd.DataFrame) -> np.ndarray:
        X = self.scaler.transform(features[self.feature_names].to_numpy())
        return np.asarray(self.model.predict(X))  # type: ignore[attr-defined]

    def predict(self, features: pd.DataFrame) -> pd.Series:
        """Renvoie le régime nommé de chaque jour."""
        states = self.predict_states(features)
        return pd.Series([self.state_to_regime[int(s)].value for s in states], index=features.index, name="regime")

    def transition_matrix(self) -> pd.DataFrame:
        """Matrice de transition entre régimes nommés (HMM uniquement, bonus §2.2)."""
        if self.kind != "hmm":
            raise ValueError("La matrice de transition n'existe que pour le HMM.")
        labels = [self.state_to_regime[i].value for i in range(len(self.state_to_regime))]
        tm = pd.DataFrame(self.model.transmat_, index=labels, columns=labels)  # type: ignore[attr-defined]
        order = [r.value for r in Regime]  # ordre canonique : calm, bull, nervous, panic
        return tm.loc[order, order]

    # --- Persistance --------------------------------------------------------
    def save(self, path: Path) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        joblib.dump(self, path)

    @staticmethod
    def load(path: Path) -> RegimeModel:
        return joblib.load(path)


def mean_regime_duration(regimes: pd.Series) -> float:
    """Durée moyenne (en jours) d'une séquence ininterrompue d'un même régime (§4.3)."""
    runs = (regimes != regimes.shift()).cumsum()
    return float(regimes.groupby(runs).size().mean())
