"""Diagnostic complet de Market Symphony — backend ET frontend.

Usage (depuis la racine du projet) ::

    python test.py                # vérification complète
    python test.py --quick        # sans pytest, TypeScript ni build (≈ 10 s)
    python test.py --network      # ajoute un test de téléchargement réel (yfinance)
    python test.py --only backend # ou --only frontend

Le script se relance automatiquement avec l'environnement ``backend/.venv``
s'il est lancé avec un autre Python. Code de sortie : 0 si tout est OK, 1 sinon.

Ce fichier n'est pas un test pytest : c'est un « bilan de santé » lisible,
à lancer avant une démo, après une modification ou après un ``git pull``.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import time
import traceback
from dataclasses import dataclass
from pathlib import Path
from typing import Callable

ROOT = Path(__file__).resolve().parent
BACKEND = ROOT / "backend"
FRONTEND = ROOT / "frontend"
VENV_PYTHON = BACKEND / ".venv" / ("Scripts/python.exe" if os.name == "nt" else "bin/python")

# --------------------------------------------------------------------------- #
# Relance dans le bon environnement Python
# --------------------------------------------------------------------------- #
if VENV_PYTHON.exists() and Path(sys.prefix).resolve() != (BACKEND / ".venv").resolve():
    sys.exit(subprocess.call([str(VENV_PYTHON), __file__, *sys.argv[1:]]))

sys.path.insert(0, str(BACKEND))
try:
    sys.stdout.reconfigure(encoding="utf-8")  # type: ignore[attr-defined]
except AttributeError:
    pass

# --------------------------------------------------------------------------- #
# Mini-framework de rapport
# --------------------------------------------------------------------------- #
GREEN, RED, YELLOW, GREY, BOLD, RESET = "\033[32m", "\033[31m", "\033[33m", "\033[90m", "\033[1m", "\033[0m"
if os.name == "nt":
    os.system("")  # active les couleurs ANSI dans la console Windows


class Warn(Exception):
    """Problème non bloquant (avertissement)."""


class Skip(Exception):
    """Vérification non applicable."""


@dataclass
class Result:
    section: str
    name: str
    status: str  # ok | warn | fail | skip
    detail: str
    duration: float


results: list[Result] = []


def check(section: str, name: str, fn: Callable[[], str | None], verbose: bool = False) -> None:
    """Exécute une vérification et affiche une ligne de résultat."""
    t0 = time.perf_counter()
    try:
        detail, status = fn() or "", "ok"
    except Warn as w:
        detail, status = str(w), "warn"
    except Skip as s:
        detail, status = str(s), "skip"
    except Exception as exc:  # noqa: BLE001
        detail, status = f"{type(exc).__name__}: {exc}", "fail"
        if verbose:
            traceback.print_exc()
    dt = time.perf_counter() - t0
    results.append(Result(section, name, status, detail, dt))
    icon = {"ok": f"{GREEN}✔", "warn": f"{YELLOW}⚠", "fail": f"{RED}✘", "skip": f"{GREY}–"}[status]
    print(f"  {icon} {name}{RESET} {GREY}({dt:.1f}s){RESET}" + (f"\n      {GREY}{detail}{RESET}" if detail else ""))


def section(title: str) -> None:
    print(f"\n{BOLD}━━ {title} {'━' * max(0, 60 - len(title))}{RESET}")


# =========================================================================== #
# BACKEND
# =========================================================================== #
def check_python_version() -> str:
    v = sys.version_info
    if (v.major, v.minor) != (3, 11):
        raise Warn(f"Python {v.major}.{v.minor} détecté — 3.11 recommandé (hmmlearn). Voir README §9.")
    return f"Python {sys.version.split()[0]} ({sys.prefix})"


def check_dependencies() -> str:
    import importlib

    modules = ["fastapi", "uvicorn", "pydantic", "pandas", "numpy", "pyarrow", "sklearn",
               "hmmlearn", "joblib", "yfinance", "yaml", "curl_cffi", "certifi", "httpx", "pytest"]
    missing = []
    for m in modules:
        try:
            importlib.import_module(m)
        except ImportError:
            missing.append(m)
    if missing:
        raise RuntimeError(f"Modules manquants : {', '.join(missing)} → pip install -r backend/requirements.txt")
    return f"{len(modules)} modules importés"


def check_config() -> str:
    from app.core.config import get_config

    cfg = get_config()
    required = ["project", "data", "assets", "presets", "features", "models", "sonification",
                "visual", "playback", "api", "network"]
    missing = [k for k in required if k not in cfg]
    if missing:
        raise RuntimeError(f"Sections absentes de config.yaml : {missing}")
    for p in cfg["presets"]:
        if p["start"] >= p["end"]:
            raise RuntimeError(f"Préréglage {p['id']} : start >= end")
    ids = [p["id"] for p in cfg["presets"]]
    if len(ids) != len(set(ids)):
        raise RuntimeError("Identifiants de préréglages en double")
    return f"v{cfg['project']['version']} · {len(cfg['assets'])} actifs · {len(cfg['presets'])} préréglages"


def check_constants() -> str:
    from app.core.constant import REGIME_PROFILES, Regime

    if set(REGIME_PROFILES) != set(Regime):
        raise RuntimeError("REGIME_PROFILES ne couvre pas exactement les 4 régimes")
    keys = {"label_fr", "color", "scale", "scale_intervals", "instrument", "shape", "description"}
    for r, p in REGIME_PROFILES.items():
        if not keys <= set(p):
            raise RuntimeError(f"Profil {r.value} incomplet : manque {keys - set(p)}")
        if not re.fullmatch(r"#[0-9A-Fa-f]{6}", str(p["color"])):
            raise RuntimeError(f"Couleur invalide pour {r.value}")
    return "4 régimes complets (couleur, gamme, instrument, forme, description)"


def check_tls() -> str:
    from app.core.network import ca_bundle_path

    path = Path(ca_bundle_path())
    n = path.read_text(encoding="utf-8").count("BEGIN CERTIFICATE")
    return f"{n} certificats dans {path.name}"


def check_data_cache() -> str:
    import pandas as pd

    from app.core.config import get_config
    from app.data.fetcher import _cache_file

    tr = get_config()["data"]["training"]
    path = _cache_file(tr["ticker"])
    if not path.exists():
        raise RuntimeError(f"Cache absent ({path.name}) → python -m scripts.train (depuis backend/)")
    df = pd.read_parquet(path)
    years = (df.index[-1] - df.index[0]).days / 365.25
    if years < 20:
        raise RuntimeError(f"Seulement {years:.1f} ans d'historique (≥ 20 exigés)")
    age = (time.time() - path.stat().st_mtime) / 86400
    msg = f"{tr['ticker']} : {len(df)} séances, {years:.1f} ans, cache âgé de {age:.0f} j"
    if age > get_config()["data"]["cache_ttl_days"]:
        raise Warn(msg + " (sera rafraîchi au prochain appel)")
    return msg


def check_network() -> str:
    from app.data.fetcher import _download_yfinance

    df = _download_yfinance("^GSPC", "2024-01-01", "2024-02-01")
    return f"yfinance OK — {len(df)} séances téléchargées"


def check_features() -> str:
    from app.core.config import get_config
    from app.data.fetcher import load_prices
    from app.features.engineering import compute_features, feature_columns

    tr = get_config()["data"]["training"]
    f = compute_features(load_prices(tr["ticker"], tr["start"], tr["end"]))
    cols = feature_columns()
    if f[cols].isna().any().any():
        raise RuntimeError("Valeurs manquantes dans les features")
    if (f["drawdown"] > 0).any():
        raise RuntimeError("Drawdown positif détecté")
    if not (f["volatility"] > 0).all():
        raise RuntimeError("Volatilité nulle ou négative")
    return f"{len(cols)} features × {len(f)} jours, sans NaN"


def check_models() -> str:
    from app.core.constant import HMM_MODEL_FILENAME, KMEANS_MODEL_FILENAME, MODELS_DIR, Regime
    from app.models.regimes import RegimeModel

    out = []
    for fname in (HMM_MODEL_FILENAME, KMEANS_MODEL_FILENAME):
        path = MODELS_DIR / fname
        if not path.exists():
            raise RuntimeError(f"{fname} absent → python -m scripts.train (depuis backend/)")
        m = RegimeModel.load(path)
        if set(m.state_to_regime.values()) != set(Regime):
            raise RuntimeError(f"{fname} : nommage des états incomplet")
        out.append(m.kind)
    return f"Modèles chargés : {', '.join(out)}"


def check_ml_criteria() -> str:
    """Critères de réussite du cahier des charges (§4.3 / §10)."""
    from app.core.config import get_config
    from app.core.constant import HMM_MODEL_FILENAME, MODELS_DIR, Regime
    from app.data.fetcher import load_prices
    from app.features.engineering import compute_features
    from app.models.regimes import RegimeModel, mean_regime_duration

    cfg = get_config()
    tr = cfg["data"]["training"]
    regimes = RegimeModel.load(MODELS_DIR / HMM_MODEL_FILENAME).predict(
        compute_features(load_prices(tr["ticker"], tr["start"], tr["end"])))
    parts = []
    for c in cfg["models"]["evaluation"]["panic_checks"]:
        share = (regimes.loc[c["start"]:c["end"]] == Regime.PANIC.value).mean()
        parts.append(f"panique {c['start'][:7]} = {share:.0%}")
        if share < 0.8:
            raise RuntimeError(f"Crise {c['start']} → {c['end']} classée panique à {share:.0%} seulement (< 80 %)")
    duration = mean_regime_duration(regimes)
    if duration < cfg["models"]["evaluation"]["min_mean_regime_duration"]:
        raise RuntimeError(f"Régimes instables : durée moyenne {duration:.1f} j")
    return " · ".join(parts) + f" · durée moyenne {duration:.1f} j"


def check_pytest() -> str:
    proc = subprocess.run([sys.executable, "-m", "pytest", "-q", "-p", "no:cacheprovider"],
                          cwd=BACKEND, capture_output=True, text=True, encoding="utf-8", errors="replace")
    summary = (proc.stdout.strip().splitlines() or ["(aucune sortie)"])[-1]
    if proc.returncode != 0:
        raise RuntimeError(f"{summary}\n{proc.stdout[-1500:]}")
    return summary


def check_api() -> str:
    import logging
    import warnings

    warnings.filterwarnings("ignore", category=DeprecationWarning)
    warnings.filterwarnings("ignore", message=".*httpx.*")
    from fastapi.testclient import TestClient

    from app.api.schemas import SymphonyResponse
    from app.main import app

    logging.getLogger("httpx").setLevel(logging.WARNING)  # pas de log par requête
    client = TestClient(app)
    for route in ("/health", "/assets", "/presets", "/regimes/transition"):
        r = client.get(route)
        if r.status_code != 200:
            raise RuntimeError(f"GET {route} → {r.status_code} {r.text[:200]}")

    tm = client.get("/regimes/transition").json()
    for row in tm["matrix"]:
        if abs(sum(row) - 1) > 1e-2:
            raise RuntimeError("Matrice de transition : une ligne ne somme pas à 1")

    if client.get("/symphony", params={"ticker": "^GSPC", "start": "2020-01-01", "end": "2019-01-01"}).status_code != 422:
        raise RuntimeError("/symphony accepte des dates inversées")

    # Exigence §8 : < 2 s pour 5 ans de données
    params = {"ticker": "^GSPC", "start": "2015-01-01", "end": "2019-12-31"}
    client.get("/symphony", params=params)  # chauffe (chargement du modèle)
    t0 = time.perf_counter()
    r = client.get("/symphony", params=params)
    dt = time.perf_counter() - t0
    if r.status_code != 200:
        raise RuntimeError(f"/symphony → {r.status_code} {r.text[:200]}")
    data = SymphonyResponse.model_validate(r.json())
    target = 2.0
    msg = f"5 routes OK · /symphony 5 ans = {len(data.days)} jours en {dt:.2f}s (cible < {target:.0f}s)"
    if dt > target:
        raise Warn(msg)
    return msg


# =========================================================================== #
# FRONTEND
# =========================================================================== #
def _node_bin(name: str) -> str:
    local = shutil.which(name, path=str(FRONTEND / "node_modules" / ".bin"))
    found = local or shutil.which(name)
    if not found:
        raise RuntimeError(f"`{name}` introuvable")
    return found


def check_node() -> str:
    node = shutil.which("node")
    if not node:
        raise RuntimeError("Node.js introuvable — installer Node ≥ 18")
    version = subprocess.run([node, "--version"], capture_output=True, text=True).stdout.strip()
    if int(version.lstrip("v").split(".")[0]) < 18:
        raise RuntimeError(f"Node {version} trop ancien (≥ 18 requis)")
    return f"Node {version}"


def check_node_modules() -> str:
    pkg = json.loads((FRONTEND / "package.json").read_text(encoding="utf-8"))
    deps = {**pkg.get("dependencies", {}), **pkg.get("devDependencies", {})}
    missing = [d for d in deps if not (FRONTEND / "node_modules" / d).exists()]
    if missing:
        raise RuntimeError(f"Paquets non installés : {', '.join(missing)} → cd frontend && npm install")
    must_have = {"react", "tone", "p5", "lightweight-charts", "vite", "typescript"}
    if not must_have <= set(deps):
        raise RuntimeError(f"package.json incomplet : manque {must_have - set(deps)}")
    return f"{len(deps)} dépendances installées"


def check_frontend_constants() -> str:
    """Le frontend doit refléter constant.py et config.yaml (couleurs, vitesses, préréglage d'accueil)."""
    from app.core.config import get_config
    from app.core.constant import REGIME_PROFILES

    ts = (FRONTEND / "src" / "config" / "constants.ts").read_text(encoding="utf-8")
    ts_colors = {k: v.upper() for k, v in re.findall(r'(calm|bull|nervous|panic):\s*"(#[0-9A-Fa-f]{6})"', ts)}
    py_colors = {r.value: str(p["color"]).upper() for r, p in REGIME_PROFILES.items()}
    if ts_colors != py_colors:
        raise RuntimeError(f"Couleurs désynchronisées : frontend={ts_colors} backend={py_colors}")

    cfg = get_config()
    speeds = [int(x) for x in re.search(r"PLAYBACK_SPEEDS\s*=\s*\[([^\]]*)\]", ts).group(1).split(",")]  # type: ignore[union-attr]
    if speeds != cfg["playback"]["speeds"]:
        raise RuntimeError(f"Vitesses : frontend {speeds} ≠ config {cfg['playback']['speeds']}")
    ms = int(re.search(r"MS_PER_DAY_AT_X1\s*=\s*(\d+)", ts).group(1))  # type: ignore[union-attr]
    if ms != cfg["playback"]["ms_per_day_at_x1"]:
        raise RuntimeError(f"MS_PER_DAY_AT_X1 : frontend {ms} ≠ config {cfg['playback']['ms_per_day_at_x1']}")
    hero = re.search(r'HERO_PRESET_ID\s*=\s*"([^"]+)"', ts).group(1)  # type: ignore[union-attr]
    if hero not in {p["id"] for p in cfg["presets"]}:
        raise RuntimeError(f"HERO_PRESET_ID « {hero} » absent des préréglages de config.yaml")
    return "couleurs, vitesses, durée par jour et préréglage d'accueil synchronisés"


def check_frontend_types() -> str:
    """Les interfaces TypeScript doivent avoir les mêmes champs que les schémas Pydantic."""
    from app.api import schemas

    ts = (FRONTEND / "src" / "types" / "symphony.ts").read_text(encoding="utf-8")
    interfaces = {name: set(re.findall(r"(\w+)\??\s*:", body))
                  for name, body in re.findall(r"export interface (\w+)\s*\{([^}]*)\}", ts)}
    for name, ts_fields in interfaces.items():
        model = getattr(schemas, name, None)
        if model is None:
            raise RuntimeError(f"Interface {name} sans schéma Pydantic correspondant")
        py_fields = set(model.model_fields)
        if ts_fields != py_fields:
            raise RuntimeError(f"{name} : frontend {sorted(ts_fields)} ≠ backend {sorted(py_fields)}")
    return f"{len(interfaces)} interfaces identiques aux schémas de l'API"


def check_presets_json() -> str:
    """Les préréglages pré-calculés (repli hors ligne) existent et respectent le schéma."""
    from app.api.schemas import SymphonyResponse
    from app.core.config import get_config

    cfg = get_config()
    folder = FRONTEND / "public" / "presets"
    missing = [p["id"] for p in cfg["presets"] if not (folder / f"{p['id']}.json").exists()]
    if missing:
        raise RuntimeError(f"JSON manquants : {missing} → python -m scripts.export_presets (depuis backend/)")
    for p in cfg["presets"]:
        data = SymphonyResponse.model_validate_json((folder / f"{p['id']}.json").read_text(encoding="utf-8"))
        if not data.days:
            raise RuntimeError(f"{p['id']}.json est vide")
        if p["id"] == "subprime_2008" and not any(d.regime == "panic" for d in data.days):
            raise RuntimeError("Le préréglage 2008 ne contient aucun jour de panique")
    return f"{len(cfg['presets'])} préréglages valides (schéma SymphonyResponse)"


def check_typescript() -> str:
    proc = subprocess.run([_node_bin("tsc"), "-b"], cwd=FRONTEND, capture_output=True, text=True,
                          encoding="utf-8", errors="replace")
    if proc.returncode != 0:
        raise RuntimeError((proc.stdout + proc.stderr)[-1500:])
    return "aucune erreur de typage"


def check_vite_build() -> str:
    proc = subprocess.run([_node_bin("vite"), "build", "--logLevel", "warn"], cwd=FRONTEND,
                          capture_output=True, text=True, encoding="utf-8", errors="replace")
    if proc.returncode != 0:
        raise RuntimeError((proc.stdout + proc.stderr)[-1500:])
    size = sum(f.stat().st_size for f in (FRONTEND / "dist").rglob("*") if f.is_file())
    return f"build de production OK ({size / 1e6:.1f} Mo dans frontend/dist)"


# =========================================================================== #
# Exécution
# =========================================================================== #
def main() -> int:
    parser = argparse.ArgumentParser(description="Diagnostic complet de Market Symphony")
    parser.add_argument("--quick", action="store_true", help="sans pytest, TypeScript ni build")
    parser.add_argument("--network", action="store_true", help="teste un téléchargement réel via yfinance")
    parser.add_argument("--only", choices=["backend", "frontend"], help="limiter à une partie")
    parser.add_argument("-v", "--verbose", action="store_true", help="affiche les traces complètes")
    args = parser.parse_args()
    v = args.verbose
    skip_slow = lambda: (_ for _ in ()).throw(Skip("ignoré (--quick)"))  # noqa: E731

    print(f"{BOLD}🎼 Market Symphony — diagnostic{RESET}  {GREY}{ROOT}{RESET}")
    t0 = time.perf_counter()

    if args.only != "frontend":
        section("BACKEND · environnement")
        check("env", "Version de Python", check_python_version, v)
        check("env", "Dépendances Python", check_dependencies, v)
        check("env", "config.yaml", check_config, v)
        check("env", "constant.py", check_constants, v)
        check("env", "Bundle de certificats TLS", check_tls, v)

        section("BACKEND · données & modèles")
        check("data", "Cache Parquet (≥ 20 ans)", check_data_cache, v)
        check("data", "Téléchargement yfinance",
              check_network if args.network else lambda: (_ for _ in ()).throw(Skip("ignoré (ajouter --network)")), v)
        check("data", "Calcul des features", check_features, v)
        check("ml", "Modèles sauvegardés", check_models, v)
        check("ml", "Critères de réussite (2008, 2020, stabilité)", check_ml_criteria, v)

        section("BACKEND · tests & API")
        check("api", "Tests unitaires pytest", skip_slow if args.quick else check_pytest, v)
        check("api", "API FastAPI (routes, validation, performance)", check_api, v)

    if args.only != "backend":
        section("FRONTEND")
        check("front", "Node.js", check_node, v)
        check("front", "Dépendances npm", check_node_modules, v)
        check("front", "Constantes synchronisées avec le backend", check_frontend_constants, v)
        check("front", "Types TypeScript ↔ schémas API", check_frontend_types, v)
        check("front", "Préréglages JSON (repli hors ligne)", check_presets_json, v)
        check("front", "Vérification TypeScript (tsc)", skip_slow if args.quick else check_typescript, v)
        check("front", "Build de production (vite)", skip_slow if args.quick else check_vite_build, v)

    counts = {s: sum(r.status == s for r in results) for s in ("ok", "warn", "fail", "skip")}
    color = RED if counts["fail"] else (YELLOW if counts["warn"] else GREEN)
    print(f"\n{BOLD}{color}{'━' * 64}\n  {counts['ok']} OK · {counts['warn']} avertissement(s) · "
          f"{counts['fail']} échec(s) · {counts['skip']} ignoré(s)   en {time.perf_counter() - t0:.0f}s{RESET}")
    if counts["fail"]:
        print(f"{RED}  Échecs :{RESET}")
        for r in results:
            if r.status == "fail":
                print(f"   - {r.name} : {r.detail.splitlines()[0]}")
    else:
        print(f"{GREEN}  Tout fonctionne. 🎶{RESET}")
    return 1 if counts["fail"] else 0


if __name__ == "__main__":
    sys.exit(main())
