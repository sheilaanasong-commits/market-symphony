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
| S3 | API FastAPI, mapping audiovisuel, tests | ✅ Terminé | 2026-11-13 |
| S4 | Frontend : sélection, lecture, son | ✅ Prototype sonore | 2026-11-13 |
| S5 | p5.js, courbe, légende, préréglages → MVP | ✅ MVP complet | 2026-11-18 |
| S6 | Déploiement, README final, GIF, bonus | ⏳ À faire | |

---

## [Non publié]

*Modifications en cours, à reporter dans la prochaine version.*

---

## [0.7.0] — 2026-11-18 — Scène d'accueil « crépuscule », humeurs illustrées, musique plus cohérente

### Ajouté
- **Scène d'accueil** (`visual/heroScene.ts`, `components/HeroScene.tsx`), inspirée de deux visuels de référence fournis (auditeur au casque devant une ville au crépuscule et des chandeliers ; déclinaison ASCII néon) :
  - ciel dégradé violet → rose → orange, étoiles, carte du monde en points (masque 64 × 21) ;
  - chandeliers menthe / corail qui défilent **au tempo du régime simulé** (calme → haussier → nerveux → panique), avec moyenne mobile ;
  - casque lumineux, ondes sonores et notes ♪ qui s'envolent (plus vite en panique) ;
  - skyline texturée en ASCII néon, Grande Arche et temple boursier, fenêtres qui clignotent, reflet ondulant dans l'eau ;
  - panneaux « terminal » en verre dépoli : `[ MARCHÉS ]` (cotations simulées qui suivent le régime) et `[ ÉCOUTE ]` (régime, tempo, gamme, égaliseur animé).
  - Couches statiques mises en cache, animation suspendue hors écran ; `prefers-reduced-motion` respecté.
- **Tableaux des humeurs** (`visual/moodArt.ts`, `ui/MoodArt.tsx`) : calme = étang au clair de lune, haussier = soleil levant et notes en spirale, nerveux = éclairs brisés et triangles, panique = explosion d'éclats, pluie de caractères et bandes *datamosh*. Remplacent les glyphes ASCII sur l'accueil et la page Méthode.
- **Dynamisme** : mot d'accroche qui change toutes les 2,4 s (respirer, s'emballer, douter, s'effondrer, renaître) ; ruban incliné défilant ; apparition des cartes, tickets et épisodes au défilement ; survol des cartes plus vivant ; bouton principal lumineux ; accents « crépuscule » (surligneur, puces, ombres).
- Icône d'onglet (♪ sur dégradé crépuscule), qui supprime la requête 404 vers `favicon.ico`.

### Modifié — musique
- **Structure** : mesures de 4 séances ; **grille d'accords par régime** (`audio/harmony.ts`) : calme I–vi–IV–V, haussier I–V–vi–IV, nerveux i–VI–iv–V7, panique diminués glissants. La nappe change d'accord à chaque mesure.
- **Mélodie accordée** : aux temps forts, la note du jour se cale sur l'accord le plus proche ; elle garde son sens (plus haut = hausse).
- **Basse** (fondamentale au 1ᵉʳ temps, octave ou quinte au 3ᵉ) et **batterie par régime** (rien en calme, pulsation dansante en haussier, contretemps en nerveux, grosse caisse à chaque temps en panique).
- **Haussier nettement plus audible** : lead FM à 0 dB (−14 auparavant) + arpège ascendant sur les notes de l'accord + charleston.
- **Volume général relevé** : maître 0 dB (−6 auparavant), compresseur et limiteur à −1 dB ; vélocité plancher (60–70 %) pour que les séances à faible volume restent audibles ; tous les instruments relevés de 6 à 12 dB.
- **Transitions** : chaque changement de régime ouvre une nouvelle section, annoncée par un souffle de bruit filtré.
- `PAD_CHORDS` / `PAD_ROOT_MIDI` quittent `config/constants.ts` pour `audio/harmony.ts`.

### Corrigé
- **Son brouillé en lecture rapide** : en ×8, une séance de crise dure ~20 ms et chaque séance déclenchait mélodie, basse, batterie et arpège (≈ 24 séances/s, plus de 100 notes/s). L'accord changeait toutes les 80 ms alors que la nappe met 0,8 s à monter, et la réverbération empilait le tout. Désormais :
  - la densité musicale ne suit plus la vitesse : au plus un « temps » toutes les 120 ms (≈ 8/s) ; les séances intermédiaires sont regroupées et l'on joue **la plus marquante** (plus grand mouvement), pour que les krachs restent audibles ; un changement de régime est toujours joué ;
  - les ornements dépendent de la durée réelle d'un temps : arpège complet ≥ 250 ms, une note ≥ 150 ms, aucun en dessous ; contretemps, tierce de réponse et note répétée retirés quand ça va vite ;
  - attaque de la nappe proportionnelle à la durée d'une mesure ; réverbération divisée par deux en lecture rapide ; souffles de transition espacés d'au moins 1,5 s.
  - Mesure en ×8 (Chrome headless) : ≈ 10 déclenchements/s toutes voix confondues en 2008, 12 en 2017.
- Erreur Tone.js *« The time must be greater than or equal to the last scheduled time »* en lecture rapide ou au changement de régime : basse et grosse caisse sont désormais polyphoniques ; un coup de bruit qui chevaucherait le précédent est ignoré au lieu de lever une erreur.
- Couleurs des tableaux d'humeur qui saturaient (dégradés translucides accumulés d'une image à l'autre).
- Débordement horizontal d'un pixel sur mobile causé par le ruban incliné (`overflow-x: clip`).

### Vérifié
- `python test.py` : 16 OK, 0 échec.
- Lecture 2017 et 2008 en ×4 et ×8 dans Chrome headless : aucune erreur audio ni JavaScript. **Le rendu sonore reste à valider à l'oreille.**
- Accueil, Contexte, Méthode, Jeu, Studio à 390 px : aucun défilement horizontal.

---

## [0.6.0] — 2026-11-18 — Refonte graphique et pages éditoriales

### Ajouté
- **Charte claire « papier de caisse »** : fond crème tramé, encre chaude, polices *Instrument Serif* / *DM Sans* / *JetBrains Mono* (Google Fonts). La couleur reste réservée aux régimes.
- **Motifs** : ticket de caisse (`ui/Receipt.tsx` : bords dentelés en masque CSS, lignes à points de conduite, code-barres déterministe, impression animée) ; **art ASCII animé** (`ui/AsciiMarket.tsx`, marché simulé qui traverse les 4 régimes ; `ui/AsciiGlyph.tsx` + `visual/ascii.ts`, une animation par humeur) ; **datamosh** (`ui/GlitchText.tsx`, transition de page en tranches, glissements de pixels sur la toile p5 à chaque changement de régime, plus forts en panique).
- **Barre de navigation** avec bandeau boursier défilant (chiffres clés des crises) ; pied de page.
- **Page Contexte** (`/contexte`) : rôle des actions et du S&P 500 ; 9 familles d'acteurs (bourses, fournisseurs d'indices, banques centrales, régulateurs, gérants, banques, agences de notation, entreprises, particuliers) avec exemples et métaphore ; 8 épisodes détaillés (contexte, causes, protagonistes, 4 chiffres clés, « à l'écoute »). Les chiffres marqués « (données) » sont recalculés sur les séries du projet.
- **Page Méthode** (`/methode`, remplace « À propos » ; `/a-propos` redirige) : quoi / comment / pourquoi, fiche technique en ticket, pipeline en cinq mouvements, tableau des mesures, K-Means contre HMM, régimes et matrice de transition en ASCII, « un sismographe, pas une boule de cristal », 13 outils, limites, lexique de 22 termes.
- **Jeu « Devine le krach »** (`/jeu`, bonus §2.2) désormais jouable : 5 manches, extrait de 100 séances parmi les plus agitées de la période, date et prix masqués, 4 propositions, 100 points + bonus de rapidité (≤ 50), fiche de contexte après chaque réponse, reçu de partie et titre final.
- **Ticket de séance** dans le Studio (`SessionReceipt.tsx`) : part de chaque régime en barres ASCII, pire et meilleure séance, pire repli, durée d'écoute, performance, tampon « KRACH » ou « SÉRÉNITÉ ».
- Contenu éditorial séparé de la mise en page : `src/content/history.ts`, `src/content/method.ts`.

### Corrigé
- **La scène gardait la teinte de la période précédente** : le halo de fond prenait la couleur du premier jour de la nouvelle période avant toute lecture (même orange en passant du Covid au Bitcoin, par exemple). La scène reste désormais neutre, avec l'invite « ▶ appuyez sur lecture », tant que la lecture n'a pas commencé (prop `started`).
- Fuite de calques p5 : chaque redimensionnement abandonnait un canevas caché ; l'ancien calque est maintenant libéré.
- **Page blanche en mode développement** : `useEffect(() => window.scrollTo(0, 0))` renvoyait la valeur de `scrollTo`, qui est une promesse dans les versions récentes de Chrome. React la prenait pour une fonction de nettoyage (« destroy is not a function ») et l'application plantait, React StrictMode exécutant ce nettoyage dès le montage. Les effets à corps implicite sont désormais écrits entre accolades (`App.tsx`, `usePlayer.ts`).

### Modifié
- Toile p5 adaptée au fond clair : tête de lecture à l'encre, ligne de base en pointillés, traces plus marquées, opacité plancher des particules (les régimes calmes restaient trop pâles).
- Courbe : bandes de régime pastel, texte en mono, courbe jouée à l'encre.

### Vérifié
- `python test.py --only frontend` : 7/7 OK.
- Toutes les pages contrôlées dans Chrome headless, sans erreur JavaScript : Studio en ×8, une manche de jeu, changement de période ; à 390 px de large, aucun défilement horizontal.

---

## [0.5.0] — 2026-11-18 — S5 : art génératif et courbe de référence (MVP)

### Ajouté
- **Canevas génératif p5.js** (`frontend/src/visual/sketch.ts`, mode instance) : la toile **se peint au fil de la période**.
  - Axe horizontal = temps : le jour *i* émet ses particules à l'abscisse *i / (n − 1)*, à la hauteur de son rendement (`visual.y`).
  - Forme et mouvement propres à chaque régime : **calme** = cercles qui flottent (bruit de Perlin), **haussier** = spirales ascendantes avec reflet doré, **nerveux** = triangles aux trajectoires brisées, **panique** = éclats projetés puis attirés vers le bas.
  - Volatilité → taille, vitesse et nombre de particules (2 à 12 par séance) ; volume → luminosité.
  - Calque persistant : chaque particule y laisse une trace légère. En fin de lecture, la toile résume toute la période (base de l'export PNG prévu en bonus).
  - Tête de lecture : halo pulsant à la position du jour courant, pulsation plus rapide quand la volatilité monte.
  - `prefers-reduced-motion` respecté (mouvements ralentis × 0,25).
- **Courbe de référence F6** (`PriceChart.tsx`, Lightweight Charts) : prix de toute la période en gris, partie déjà jouée en blanc, marqueur du jour courant à la couleur du régime, **bandes de régime** en arrière-plan. **Un clic sur la courbe place la lecture à cette date.**

### Modifié
- `Stage.tsx` : le halo CSS provisoire de la S4 est remplacé par le canevas p5.js. Le relevé (date, prix, rendement, volatilité) reste en surimpression.
- p5 est chargé **à la demande** (import dynamique) : bundle séparé, premier affichage plus léger.
- Mise en page du Studio en colonne flexible (scène extensible, courbe de 150 px, barre de lecture).

### Corrigé
- Les boutons du panneau de gauche débordaient de leur colonne : la largeur minimale des champs de date élargissait la grille (`minmax(0, 1fr)`).

### Décisions
- **Une toile qui s'accumule** plutôt qu'une animation qui s'efface : à la fin de la lecture, l'image résume la période (le krach de 2008 apparaît comme une gerbe d'éclats rouges entre septembre et décembre). Elle se compare d'un coup d'œil d'une crise à l'autre, et c'est la base de l'export PNG.
- **Bandes de régime en dégradé CSS** sous le graphique, plutôt qu'un histogramme Lightweight Charts : l'histogramme laisse des espaces entre les barres (rendu zébré). Défilement et zoom étant désactivés, la frontière avant le jour *i* est exactement à *i / n* de la zone de tracé, sans dépendre du moment où la bibliothèque calcule ses coordonnées.
- **Rattrapage** : si la lecture (×8, séance ≈ 20 ms en crise) va plus vite que l'affichage, chaque jour sauté émet quand même ses particules ; seuls les sauts de plus de 30 jours (curseur, clic sur la courbe) sont peints d'un coup sous forme de points.
- Redimensionnement : l'ancien calque est **recopié à la nouvelle échelle** au lieu d'être repeint, ce qui conserve la peinture.

### Limites connues
- p5 1.11 lève une `TypeError` sur `Graphics.remove()` en mode instance : l'ancien calque est abandonné lors d'un redimensionnement (fuite mémoire négligeable, l'événement est rare).
- Le bundle p5 pèse environ 1 Mo (chargé seulement sur le Studio).

### Vérifié
- `python test.py --only frontend` : 7/7 OK (tsc, build, synchronisation des constantes et des types).
- Rendu contrôlé dans Chrome headless (préréglages 2008 et Covid, ×2 et ×8, saut par clic sur la courbe, largeur mobile 390 px sans défilement horizontal), aucune erreur JavaScript.

---

## [0.4.0] — 2026-11-13 — S4 : prototype sonore

### Ajouté
- **Moteur audio Tone.js** (`frontend/src/audio/`) :
  - `engine.ts` : une note par séance, nappe d'accord propre à chaque régime, réverbération pilotée par la volatilité, volume maître, muet, limiteur ;
  - `instruments.ts` : 4 instruments (piano doux legato, synthé FM avec écho à l'octave, staccato répété si agitation, percussions graves + seconde mineure + bruit) ;
  - `timing.ts` : durée d'une séance = `MS_PER_DAY_AT_X1 × REFERENCE_BPM / tempo ÷ vitesse`. Le tempo issu de la volatilité accélère réellement la lecture pendant les crises.
- **Hooks** : `usePlayer` (lecture/pause, vitesse ×1–×8, curseur, muet, volume ; audio créé seulement au premier clic), `useSymphony` (chargement annulable, repli hors ligne signalé).
- **Composants** : `SelectionPanel` (préréglages, actif de la liste ou ticker libre, dates, validation côté client), `PlaybackBar`, `RegimeLegend` (F5, régime courant mis en avant), `Stage` (scène provisoire : halo qui suit couleur, taille, position et opacité du jour, en attendant p5.js en S5).
- **Page Studio** : état dans l'URL (`?preset=…` ou `?ticker=…&start=…&end=…`, liens partageables), barre d'espace = lecture/pause, affichage responsive.
- **Préréglages** `crash_1929` et `black_monday_1987` ; `frontend/public/presets/index.json`, qui liste les préréglages pour le mode hors ligne.
- `config.yaml` : `data.history_start: 1927-01-01` (validé ≤ `training.start`).
- Constantes frontend : `REFERENCE_BPM`, `PAD_ROOT_MIDI`, `PAD_CHORDS`, type `PlaybackSpeed`.

### Modifié
- Le cache télécharge désormais **tout l'historique** disponible (S&P 500 depuis 1927) au lieu de partir de la date d'entraînement. Le préréglage « Bulle Internet » commence enfin en juin 1999 (902 jours au lieu de 692).
- `api.ts` : `fetchPresets` et `fetchPresetSymphony` renvoient `{ data, offline }` ; annulation via `AbortSignal`.

### Résultats
- Le modèle, entraîné sur 2000–2026, **généralise aux crises jamais vues** : Lundi noir (15 oct. – 30 nov. 1987) **100 % panique** ; krach de 1929 (20 oct. – 31 déc.) **85 % panique**, le reste en nerveux ; été 1987 avant le krach : calme / haussier.
- Données d'entraînement et critères §4.3 inchangés (panique 100 % en 2008 et 2020, durée moyenne 31,4 j).

### Décisions
- **Le tempo modifie la durée des séances** (et pas seulement un paramètre sonore) : une crise se joue plus vite qu'un marché calme, ce qui rend le contraste perceptible sans explication.
- **La nappe d'accord** change avec le régime : c'est elle qui fait « entendre » le changement d'ambiance, la mélodie seule variant trop vite.
- Scène provisoire en CSS plutôt que p5.js : le cahier place l'art génératif en S5 ; le halo permet déjà de vérifier la synchronisation son ↔ image.

### Limites connues
- Le rendu sonore n'a pas encore été évalué à l'oreille par un non-spécialiste (critère §10).
- Avant ~1960, pas de volume fourni par Yahoo : l'intensité des notes est constante sur 1929.

---

## [0.3.0] — 2026-11-13 — Robustesse et clarté du code

### Modifié
- **Configuration typée et validée** (`config.py`) : modèles Pydantic stricts (`extra="forbid"`, figés). Ils détectent les clés inconnues, les types erronés, les intervalles inversés, `start ≥ end`, les `model_inputs` inexistants, une `default_speed` absente de `speeds`, des identifiants de préréglages en double et `n_regimes ≠ 4`. Accès par attributs (`get_settings().features.volatility_window`) au lieu de `cfg["a"]["b"]`.
- **`config.yaml`** : intervalles uniformisés en `{min, max}` (`tempo_bpm`, `reverb_wet`, `velocity`, `volatility`) ; ajout de `download_retries`, `relative_volume_max`, `min_panic_share`, `api.warmup_days` (auparavant codé en dur) ; `candidate_states` remonté sous `models` ; suppression de clés inutilisées (`cache_format`, `raw_dir`, `processed_dir`).
- **Service métier** `app/services/symphony.py` : la logique (prix → features → régimes → partition) est séparée des routes HTTP et réutilisée par `export_presets.py`, qui appelait auparavant une route FastAPI directement.
- **API** : dates typées (`date`) et ticker validé par motif (une entrée invalide renvoie 422 au lieu de 500), exceptions métier traduites en codes HTTP (422 / 404 / 503), modèle chargé au démarrage (`lifespan`), lancement possible par `python -m app.main`.
- **Collecte** : `DataUnavailableError` dédiée, nouvelles tentatives avec attente progressive, écriture **atomique** du cache (fichier temporaire puis renommage), ticker validé avant de servir de nom de fichier, fonctions publiques (`cache_file`, `download_prices`).
- **Modèles** : `RegimeModel` immuable, nommage des états condensé, `predict` vectorisé avec erreur explicite si des features manquent ou si le nommage est absent, `load` vérifie le type. **`evaluate_regimes()`** centralise les critères §4.3 (utilisée par `train.py` et `test.py`).
- **`train.py`** renvoie le code 1 si les critères de réussite ne sont pas atteints ; **`export_presets.py`** continue après un échec et renvoie 1.
- **Sonification** : gammes pré-calculées par régime (`lru_cache`), `Range.lerp()`, protection contre une division par zéro, construction de la partition sans `iterrows`.
- **`network.py`** : repli sur certifi si le magasin Windows est illisible.
- **`test.py`** : classe `Report`, option `skip=` à la place d'un lambda générateur, extraction sûre des constantes TypeScript (`ts_const`), réutilisation de `evaluate_regimes`, ajout de la vérification de `TARGET_FPS`. Il passe de 19 à 17 lignes de rapport pour davantage de contrôles.
- **Frontend `api.ts`** : délai maximal de 8 s par requête (backend gratuit en veille), `ApiError` avec le `detail` de FastAPI, contrôle de `res.ok` sur le repli JSON ; les erreurs 4xx ne sont pas masquées par le repli.
- `MODELS_DIR` et `DATA_DIR` retirés de `constant.py` : une seule source de vérité, `config.yaml`.

### Ajouté
- `tests/test_config.py` : config valide, et 7 configurations invalides rejetées.
- `tests/test_api.py` : 5 entrées invalides renvoient 422 (dates inversées, date mal formée, ticker `../../etc`, période > 10 ans, paramètre manquant).

### Vérifié
- 27 tests pytest (15 auparavant) ; `python test.py --network` → 17/17 OK.
- Modèles ré-entraînés : **résultats identiques** (panique 100 % en 2008 et 2020, durée moyenne 31,4 j) ; préréglages JSON régénérés **identiques au jour près** à la v0.2.1.
- Une faute de frappe dans `config.yaml` (`volatility_wndow`) est signalée avec le champ exact.

---

## [0.2.1] — 2026-11-13 — Diagnostic global et notebook pédagogique

### Ajouté
- **`test.py`** (racine) : diagnostic complet en 19 vérifications. Il se relance automatiquement dans `backend/.venv`, renvoie le code 1 en cas d'échec et accepte les options `--quick`, `--network`, `--only backend|frontend` et `-v`.
  - Backend : version de Python, dépendances, `config.yaml`, `constant.py`, bundle TLS, cache ≥ 20 ans, téléchargement réel (option), features, modèles, critères de réussite (panique ≥ 80 % en 2008 / 2020, durée moyenne des régimes), pytest, API (routes, matrice stochastique, rejet des dates inversées, temps de réponse < 2 s).
  - Frontend : Node ≥ 18, paquets npm, **synchronisation des constantes** (couleurs, vitesses, ms/jour, préréglage d'accueil), **types TypeScript identiques aux schémas Pydantic**, préréglages JSON validés par le schéma, `tsc`, build Vite.
- **Notebook** : introduction pédagogique. Elle couvre le problème, l'idée de sonification, le rôle de l'IA et des régimes (tableau son/visuel), la raison de décrire plutôt que prédire, un schéma du pipeline et les critères de réussite. Chaque étape est désormais expliquée (OHLCV, features et leur rôle musical, HMM et BIC, K-Means vs HMM, nommage), et une conclusion a été ajoutée.

### Vérifié
- `python test.py --network` → 19 OK, 0 échec (11 s).
- Une config volontairement désynchronisée (vitesses `[1, 2, 4, 16]`) est bien détectée.

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
