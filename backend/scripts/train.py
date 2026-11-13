"""Entraînement hors ligne des modèles de régimes (§4, planning S2).

Depuis ``backend/`` ::

    python -m scripts.train            # entraîne K-Means + HMM et sauvegarde
    python -m scripts.train --bic      # affiche en plus le BIC pour 2..6 états
"""

from __future__ import annotations

import argparse
import logging

import numpy as np
from sklearn.metrics import silhouette_score

from app.core.config import get_config
from app.core.constant import HMM_MODEL_FILENAME, KMEANS_MODEL_FILENAME, MODELS_DIR, Regime
from app.data.fetcher import load_prices
from app.features.engineering import compute_features, feature_columns
from app.models.regimes import RegimeModel, mean_regime_duration

logger = logging.getLogger("train")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--bic", action="store_true", help="Sélection du nombre d'états par BIC")
    args = parser.parse_args()
    logging.basicConfig(level="INFO")

    cfg = get_config()
    np.random.seed(cfg["project"]["random_seed"])
    tr = cfg["data"]["training"]

    prices = load_prices(tr["ticker"], tr["start"], tr["end"])
    features = compute_features(prices)
    cols = feature_columns()
    logger.info("Jeu d'entraînement : %d séances (%s -> %s)", len(features), features.index[0].date(), features.index[-1].date())

    # --- Sélection du nombre d'états (BIC) ---------------------------------
    if args.bic:
        for n in cfg["models"]["selection"]["candidate_states"]:
            m = RegimeModel.fit(features, cols, kind="hmm", n_states=n)
            X = m.scaler.transform(features[cols].to_numpy())
            logger.info("HMM n=%d  logL=%.1f  BIC=%.1f", n, m.model.score(X), m.model.bic(X))

    # --- K-Means (référence) ------------------------------------------------
    km = RegimeModel.fit(features, cols, kind="kmeans")
    X = km.scaler.transform(features[cols].to_numpy())
    logger.info("K-Means silhouette = %.3f", silhouette_score(X, km.predict_states(features)))
    km.save(MODELS_DIR / KMEANS_MODEL_FILENAME)

    # --- HMM (principal) ----------------------------------------------------
    hmm = RegimeModel.fit(features, cols, kind="hmm")
    regimes = hmm.predict(features)
    logger.info("HMM durée moyenne d'un régime = %.1f jours", mean_regime_duration(regimes))
    for check in cfg["models"]["evaluation"]["panic_checks"]:
        share = (regimes.loc[check["start"]:check["end"]] == Regime.PANIC.value).mean()
        logger.info("Part de 'panic' %s -> %s : %.0f %%", check["start"], check["end"], 100 * share)
    hmm.save(MODELS_DIR / HMM_MODEL_FILENAME)
    logger.info("Modèles sauvegardés dans %s", MODELS_DIR)


if __name__ == "__main__":
    main()
