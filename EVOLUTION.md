# 📜 EVOLUTION — Journal des modifications

Ce fichier assure la **traçabilité** du projet Market Symphony : chaque modification significative (fonctionnalité, choix de modèle, changement de paramètre dans `config.yaml`, écart au cahier des charges) y est consignée.

Format inspiré de [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/) et du [versionnage sémantique](https://semver.org/lang/fr/) :
- **Ajouté** — nouvelles fonctionnalités / fichiers
- **Modifié** — changements de comportement ou de paramètres
- **Corrigé** — corrections de bugs
- **Supprimé** — éléments retirés
- **Décisions** — choix techniques et leur justification
- **Écarts au cahier des charges** — ce qui diverge de la v1.0 et pourquoi

---

## Suivi d'avancement

| Semaine | Objectif | Statut | Date |
|---|---|---|---|
| S0 | Initialisation du dépôt, structure, configuration | ✅ Terminé | 2026-11-13 |
| S1 | Collecte des données, exploration, features | ⏳ À faire | |
| S2 | Entraînement K-Means / HMM, BIC, nommage | ⏳ À faire | |
| S3 | API FastAPI, mapping audiovisuel, tests | 🟡 Squelette prêt | |
| S4 | Frontend : sélection, lecture, son | ⏳ À faire | |
| S5 | p5.js, courbe, légende, préréglages → MVP | ⏳ À faire | |
| S6 | Déploiement, README final, GIF, bonus | ⏳ À faire | |

---

## [Non publié]

*Modifications en cours, à reporter dans la prochaine version.*

---

## [0.1.0] — 2026-11-13 — Initialisation du projet

### Ajouté
- **Structure du dépôt** : `backend/` (FastAPI + ML), `frontend/` (React/Vite/TS), `notebooks/`, `data/{raw,cache,processed}`, `models/`, `docs/`.
- **`README.md`** : description complète du projet, extension du cahier des charges v1.0 (architecture, structure, installation, configuration, limites).
- **`EVOLUTION.md`** : ce journal.
- **`config.yaml`** : paramètres réglables (données, actifs, préréglages, features, modèles, sonification, visuel, lecture, API).
- **`backend/app/core/constant.py`** : constantes invariantes (chemins, colonnes, énumération `Regime`, profils audiovisuels des 4 régimes, avertissement).
- **`backend/app/core/config.py`** : chargement mis en cache de `config.yaml` (surchargeable par `MARKET_SYMPHONY_CONFIG`).
- **Pipeline backend (première version)** :
  - `data/fetcher.py` — téléchargement yfinance, nettoyage, cache Parquet avec TTL et repli sur cache.
  - `features/engineering.py` — rendement log, volatilité annualisée, momentum 20/60, drawdown, volume relatif.
  - `models/regimes.py` — `RegimeModel` (K-Means / HMM), nommage automatique des états, matrice de transition, durée moyenne des régimes, persistance joblib.
  - `sonification/mapping.py` — note MIDI quantifiée sur la gamme du régime, vélocité, tempo, réverbération, paramètres visuels.
  - `api/` — routes `/health`, `/assets`, `/presets`, `/symphony`, `/regimes/transition` et schémas Pydantic.
  - `scripts/train.py` (entraînement + BIC + contrôles de cohérence) et `scripts/export_presets.py`.
- **Tests pytest** : features, mapping, API (sans réseau ni modèle).
- **Frontend (squelette)** : routing (Accueil, Studio, Jeu, À propos), client API avec repli sur JSON pré-calculés, types miroirs de l'API, constantes, thème sombre.

### Décisions
- **Séparation `config.yaml` / `constant.py`** : ce qui se règle (hyperparamètres) vs ce qui définit le contrat de l'application (noms de colonnes, identifiants de régimes partagés avec le frontend).
- **Mapping audiovisuel calculé côté serveur** : le frontend reste un simple « lecteur » de partition ; les préréglages peuvent ainsi être exportés en JSON statique.
- **Drawdown sur fenêtre glissante de 252 jours** pour interpréter « plus haut historique récent ».
- **Volume nul → volume relatif = 1.0** (neutre) : certains indices (ex. CAC 40 sur Yahoo) n'ont pas de volume fiable.
- **Nommage des états** par règles successives (volatilité max → panique ; volatilité min → calme ; meilleur rendement → haussier ; reste → nerveux).
- **Marge d'échauffement de 400 jours** avant `start` dans `/symphony`, pour que les fenêtres glissantes soient remplies dès le premier jour demandé.
- **Notes limitées à 2 octaves** autour de MIDI 60 et gamme « dissonante » (secondes mineures + triton) pour la panique.

### Écarts au cahier des charges
- Ajout d'une route `/health` (utile pour le déploiement Render / HF Spaces).
- Ajout du Dow Jones et de Tesla dans la liste d'actifs, et d'un préréglage « Marché calme 2017 » (contraste avec les krachs pour la démo).
- Python 3.11 recommandé explicitement (l'environnement local est en 3.14, potentiellement incompatible avec `hmmlearn`).

---

## Modèle d'entrée

```markdown
## [x.y.z] — AAAA-MM-JJ — Titre court

### Ajouté
-
### Modifié
-
### Corrigé
-
### Décisions
-
### Écarts au cahier des charges
-
### Résultats / métriques (si pertinent)
- Silhouette K-Means : …
- BIC HMM (n = 2..6) : …
- Part « panique » sept.–nov. 2008 : … % · mars 2020 : … %
- Durée moyenne d'un régime : … jours
```
