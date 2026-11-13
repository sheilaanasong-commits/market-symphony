"""Entraînement hors ligne des modèles de régimes (§4, planning S2).

Depuis ``backend/`` ::

    python -m scripts.train            # entraîne K-Means + HMM, évalue et sauvegarde
    python -m scripts.train --bic      # affiche en plus le BIC pour chaque nombre d'états

Code de sortie 1 si les critères de réussite (§4.3) ne sont pas atteints.
"""

from __future__ import annotations

import argparse
import logging
import sys

import numpy as np
from sklearn.metrics import silhouette_score

from app.core.config import get_settings
from app.core.constant import HMM_MODEL_FILENAME, KMEANS_MODEL_FILENAME
from app.data.fetcher import load_prices
from app.features.engineering import compute_features, feature_columns
from app.models.regimes import RegimeModel, evaluate_regimes

log = logging.getLogger("train")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--bic", action="store_true", help="sélection du nombre d'états par BIC")
    args = parser.parse_args()
    logging.basicConfig(level="INFO", format="%(message)s")

    settings = get_settings()
    np.random.seed(settings.project.random_seed)
    tr, out_dir = settings.data.training, settings.models.artifacts_dir

    features = compute_features(load_prices(tr.ticker, tr.start, tr.end))
    cols = feature_columns()
    log.info("Jeu d'entraînement : %d séances (%s → %s)", len(features),
             features.index[0].date(), features.index[-1].date())

    if args.bic:
        for n in settings.models.candidate_states:
            m = RegimeModel.fit(features, cols, kind="hmm", n_states=n)
            X = m.scaler.transform(features[cols].to_numpy())
            log.info("HMM n=%d  logL=%.1f  BIC=%.1f", n, m.model.score(X), m.model.bic(X))

    kmeans = RegimeModel.fit(features, cols, kind="kmeans")
    X = kmeans.scaler.transform(features[cols].to_numpy())
    log.info("K-Means silhouette = %.3f", silhouette_score(X, kmeans.predict_states(features)))
    kmeans.save(out_dir / KMEANS_MODEL_FILENAME)

    hmm = RegimeModel.fit(features, cols, kind="hmm")
    hmm.save(out_dir / HMM_MODEL_FILENAME)
    log.info("Modèles sauvegardés dans %s", out_dir)

    result = evaluate_regimes(hmm.predict(features))
    log.info("%s Critères §4.3 : %s", "✔" if result.passed else "✘", result.summary())
    return 0 if result.passed else 1


if __name__ == "__main__":
    sys.exit(main())
