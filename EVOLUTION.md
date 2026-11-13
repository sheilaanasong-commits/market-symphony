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
| S1 | Collecte des données, exploration, features | ✅ Terminé | 2026-11-13 |
| S2 | Entraînement K-Means / HMM, BIC, nommage | ✅ Terminé | 2026-11-13 |
| S3 | API FastAPI, mapping audiovisuel, tests | 🟡 API fonctionnelle et testée — reste à affiner | |
| S4 | Frontend : sélection, lecture, son | ⏳ À faire | |
| S5 | p5.js, courbe, légende, préréglages → MVP | ⏳ À faire | |
| S6 | Déploiement, README final, GIF, bonus | ⏳ À faire | |

---

## [Non publié]

*Modifications en cours, à reporter dans la prochaine version.*

---

## [0.2.0] — 2026-11-13 — Environnement, données, entraînement des modèles (S1–S2)

### Ajouté
- **Environnement Python 3.11** dans `backend/.venv` (créé avec `uv`) + fichier `backend/.python-version` ; dépendances installées depuis `requirements.txt`.
- **Dépendances frontend** installées (`npm install`) ; vérification TypeScript (`tsc -b`) sans erreur.
- **Dépôt Git** initialisé (branche `main`) + `.gitattributes` (fins de ligne LF, binaires Parquet/joblib).
- **`backend/app/core/network.py`** : bundle de certificats certifi + magasin Windows, passé à yfinance via une session `curl_cffi` explicite.
- Section **`network`** dans `config.yaml` (`use_system_certificates`, `ca_bundle_file`, `request_timeout_s`).
- **Données** : S&P 500 de 2000 à 2026 en cache Parquet (6 697 séances exploitables).
- **Modèles entraînés** : `models/hmm_regimes.joblib`, `models/kmeans_regimes.joblib`.
- **Notebook `01_exploration.ipynb`** exécuté : features, corrélations, BIC, K-Means vs HMM, cohérence historique, matrice de transition, limites.
- **`docs/regimes_sp500.png`** : graphique des régimes (livrable S2), intégré au README.
- **Préréglages pré-calculés** dans `frontend/public/presets/*.json` (6 périodes).
- **`tests/test_regimes.py`** : nommage des régimes sur le profil réel du S&P 500, bijection, durée moyenne.

### Modifié
- **Règle de nommage des régimes** (`label_states`) : panique = volatilité max ; **haussier = meilleur ratio rendement/volatilité** ; nerveux = volatilité la plus forte des deux restants ; calme = le dernier.
- `transition_matrix()` renvoie les régimes dans l'ordre canonique (calme, haussier, nerveux, panique).
- Descriptions des régimes « calme » et « haussier » (`REGIME_PROFILES`) alignées sur les profils observés.
- Préréglage `bull_2017` renommé « Marché haussier 2017 ».
- README : statut, règle de nommage, section 4.4 Résultats, installation avec `uv`, note antivirus, risques.

### Corrigé
- **Téléchargement yfinance impossible** (`CertificateVerifyError`, `unable to get local issuer certificate`) : cause identifiée — **Avast Web/Mail Shield** intercepte le HTTPS avec sa propre autorité de certification, reconnue seulement par Windows. Corrigé sans désactiver la vérification TLS (voir `network.py`).
- **Mauvais nommage avec la règle v0.1.0** : l'état « rendement ≈ 0 %, volatilité 22 %, drawdown −17 % » était étiqueté *haussier* ; le **marché baissier de 2022 sortait à 76 % « haussier »** et l'état à +25 %/an de rendement était appelé « calme ». Avec la nouvelle règle : 2022 → 76 % *nerveux*, 2017 → 93 % *haussier*.

### Décisions
- **4 états conservés** bien que le BIC continue de décroître jusqu'à 6 (72 399 → 54 342) : sur ~6 700 points la pénalité du BIC pèse peu ; le coude se situe vers 3–4 états et 4 correspond aux 4 ambiances musicales.
- **HMM retenu comme modèle principal** : K-Means fragmente (régimes de 5,7 jours en moyenne, classement surtout selon le signe du rendement du jour) alors que le HMM produit des régimes de 31,4 jours.
- **Python 3.11 via `uv --native-tls`** : le Python 3.14 système n'est pas garanti compatible avec `hmmlearn`.

### Résultats / métriques
| Indicateur | K-Means | HMM |
|---|---|---|
| Silhouette | 0,324 | — |
| BIC (n = 2 → 6) | — | 72 399 · 64 785 · 61 417 · 57 460 · 54 342 |
| Panique sept.–nov. 2008 | 80 % | **100 %** |
| Panique mars 2020 | 73 % | **100 %** |
| Durée moyenne d'un régime | 5,7 j | **31,4 j** |

Profils HMM : haussier +25 %/an, vol 9 % · calme ≈ 0 %, vol 14 % · nerveux +2 %, vol 22 % · panique −59 %, vol 47 %.
Matrice de transition : persistance 95,7 – 98,6 % ; haussier → panique = 0 % ; panique → nerveux = 4,3 %/jour (seule sortie).

Performance API `/symphony` : 0,20 s pour 5 ans de S&P 500 en cache (exigence < 2 s ✅) ; 1,3 s avec téléchargement initial (CAC 40).

### Écarts au cahier des charges
- Aucun écart fonctionnel. Ajout technique : module `network.py` (contrainte de l'environnement local).

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
