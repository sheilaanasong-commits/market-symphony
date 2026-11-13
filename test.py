"""Diagnostic complet de Market Symphony — backend ET frontend.

Usage (depuis la racine du projet) ::

    python test.py                 # vérification complète (≈ 15 s)
    python test.py --quick         # sans pytest, TypeScript ni build (≈ 5 s)
    python test.py --network       # ajoute un téléchargement réel (yfinance)
    python test.py --only backend  # ou --only frontend ; -v pour les traces complètes

Se relance automatiquement avec ``backend/.venv`` si besoin.
Code de sortie : 0 si aucun échec, 1 sinon.
"""

from __future__ import annotations

import argparse
import json
import logging
import os
import re
import shutil
import subprocess
import sys
import time
import traceback
import warnings
from collections.abc import Callable
from pathlib import Path

ROOT = Path(__file__).resolve().parent
BACKEND, FRONTEND = ROOT / "backend", ROOT / "frontend"
VENV = BACKEND / ".venv"
VENV_PYTHON = VENV / ("Scripts/python.exe" if os.name == "nt" else "bin/python")

# Relance dans l'environnement du projet (dépendances + Python 3.11)
if VENV_PYTHON.exists() and Path(sys.prefix).resolve() != VENV.resolve():
    sys.exit(subprocess.call([str(VENV_PYTHON), __file__, *sys.argv[1:]]))

sys.path.insert(0, str(BACKEND))
sys.stdout.reconfigure(encoding="utf-8")  # type: ignore[attr-defined]
warnings.filterwarnings("ignore")
logging.disable(logging.INFO)  # pas de logs applicatifs dans le rapport
if os.name == "nt":
    os.system("")  # active les couleurs ANSI dans la console Windows


# =========================================================================== #
# Rapport
# =========================================================================== #
GREEN, RED, YELLOW, GREY, BOLD, RESET = "\033[32m", "\033[31m", "\033[33m", "\033[90m", "\033[1m", "\033[0m"
ICONS = {"ok": f"{GREEN}✔", "warn": f"{YELLOW}⚠", "fail": f"{RED}✘", "skip": f"{GREY}–"}


class Warn(Exception):
    """Problème non bloquant."""


class Report:
    def __init__(self, verbose: bool) -> None:
        self.verbose = verbose
        self.results: list[tuple[str, str, str]] = []  # (statut, nom, détail)

    def section(self, title: str) -> None:
        print(f"\n{BOLD}━━ {title} {'━' * max(0, 60 - len(title))}{RESET}")

    def check(self, name: str, fn: Callable[[], str], skip: str | None = None) -> None:
        """Exécute ``fn`` (qui renvoie un détail) ; ``skip`` donne la raison d'ignorer."""
        t0 = time.perf_counter()
        if skip:
            status, detail = "skip", skip
        else:
            try:
                status, detail = "ok", fn()
            except Warn as w:
                status, detail = "warn", str(w)
            except Exception as exc:  # noqa: BLE001 — tout échec doit être rapporté, pas planter
                status, detail = "fail", f"{type(exc).__name__}: {exc}"
                if self.verbose:
                    traceback.print_exc()
        self.results.append((status, name, detail))
        print(f"  {ICONS[status]} {name}{RESET} {GREY}({time.perf_counter() - t0:.1f}s)\n      {detail}{RESET}")

    def summary(self, elapsed: float) -> int:
        n = {s: sum(r[0] == s for r in self.results) for s in ICONS}
        color = RED if n["fail"] else YELLOW if n["warn"] else GREEN
        print(f"\n{BOLD}{color}{'━' * 64}\n  {n['ok']} OK · {n['warn']} avertissement(s) · "
              f"{n['fail']} échec(s) · {n['skip']} ignoré(s)   en {elapsed:.0f}s{RESET}")
        for status, name, detail in self.results:
            if status == "fail":
                print(f"{RED}   ✘ {name} : {detail.splitlines()[0]}{RESET}")
        if not n["fail"]:
            print(f"{GREEN}  Tout fonctionne. 🎶{RESET}")
        return 1 if n["fail"] else 0


def run(cmd: list[str], cwd: Path) -> str:
    """Lance une commande ; lève une erreur avec la fin de la sortie si elle échoue."""
    proc = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True, encoding="utf-8",
                          errors="replace", check=False)
    if proc.returncode != 0:
        raise RuntimeError((proc.stdout + proc.stderr).strip()[-1500:])
    return proc.stdout


def ts_const(source: str, name: str, pattern: str) -> str:
    """Valeur d'une constante TypeScript ``name`` ; erreur claire si introuvable."""
    match = re.search(rf"{name}\s*=\s*{pattern}", source)
    if not match:
        raise RuntimeError(f"Constante {name} introuvable dans constants.ts")
    return match.group(1)


# =========================================================================== #
# Backend
# =========================================================================== #
def python_version() -> str:
    if sys.version_info[:2] != (3, 11):
        raise Warn(f"Python {sys.version.split()[0]} — 3.11 recommandé (hmmlearn), voir README §9")
    return f"Python {sys.version.split()[0]} ({sys.prefix})"


def dependencies() -> str:
    import importlib.util

    modules = ["fastapi", "uvicorn", "pydantic", "pandas", "numpy", "pyarrow", "sklearn", "hmmlearn",
               "joblib", "yfinance", "yaml", "curl_cffi", "certifi", "httpx", "pytest"]
    if missing := [m for m in modules if importlib.util.find_spec(m) is None]:
        raise RuntimeError(f"Modules manquants : {', '.join(missing)} → pip install -r backend/requirements.txt")
    return f"{len(modules)} modules disponibles"


def config() -> str:
    from app.core.config import get_settings

    s = get_settings()  # validation Pydantic complète
    return f"v{s.project.version} · {len(s.assets)} actifs · {len(s.presets)} préréglages · schéma valide"


def constants() -> str:
    from app.core.constant import REGIME_PROFILES, Regime

    required = {"label_fr", "color", "scale", "scale_intervals", "instrument", "shape", "description"}
    if set(REGIME_PROFILES) != set(Regime):
        raise RuntimeError("REGIME_PROFILES ne couvre pas exactement les 4 régimes")
    for regime, profile in REGIME_PROFILES.items():
        if missing := required - set(profile):
            raise RuntimeError(f"Profil {regime.value} incomplet : {sorted(missing)}")
    return "4 régimes complets (couleur, gamme, instrument, forme, description)"


def tls_bundle() -> str:
    from app.core.network import ca_bundle_path

    path = Path(ca_bundle_path())
    return f"{path.read_text(encoding='utf-8').count('BEGIN CERTIFICATE')} certificats ({path.name})"


def data_cache() -> str:
    import pandas as pd

    from app.core.config import get_settings
    from app.data.fetcher import cache_file

    s = get_settings().data
    path = cache_file(s.training.ticker)
    if not path.exists():
        raise RuntimeError(f"{path.name} absent → python -m scripts.train (depuis backend/)")
    index = pd.read_parquet(path, columns=["close"]).index
    years, age = (index[-1] - index[0]).days / 365.25, (time.time() - path.stat().st_mtime) / 86_400
    if years < 20:
        raise RuntimeError(f"{years:.1f} ans d'historique (≥ 20 exigés)")
    detail = f"{s.training.ticker} : {len(index)} séances, {years:.1f} ans, cache âgé de {age:.0f} j"
    if age > s.cache_ttl_days:
        raise Warn(detail + " — sera rafraîchi au prochain appel")
    return detail


def network() -> str:
    from app.data.fetcher import download_prices

    return f"{len(download_prices('^GSPC', '2024-01-01', '2024-02-01'))} séances téléchargées"


def regimes_quality() -> str:
    """Features calculables, modèles chargeables, critères §4.3 / §10 atteints."""
    from app.core.config import get_settings
    from app.core.constant import HMM_MODEL_FILENAME, KMEANS_MODEL_FILENAME
    from app.data.fetcher import load_prices
    from app.features.engineering import compute_features, feature_columns
    from app.models.regimes import RegimeModel, evaluate_regimes

    s = get_settings()
    features = compute_features(load_prices(s.data.training.ticker, s.data.training.start))
    if features[feature_columns()].isna().any().any() or (features["drawdown"] > 0).any():
        raise RuntimeError("Features incohérentes (NaN ou drawdown positif)")
    for name in (KMEANS_MODEL_FILENAME, HMM_MODEL_FILENAME):
        if not (s.models.artifacts_dir / name).exists():
            raise RuntimeError(f"{name} absent → python -m scripts.train (depuis backend/)")
        model = RegimeModel.load(s.models.artifacts_dir / name)
    result = evaluate_regimes(model.predict(features))  # model = HMM (dernier chargé)
    if not result.passed:
        raise RuntimeError(f"Critères non atteints : {result.summary()}")
    return f"{len(features)} jours · {result.summary()}"


def api() -> str:
    from fastapi.testclient import TestClient

    from app.api.schemas import SymphonyResponse, TransitionMatrix
    from app.core.config import get_settings
    from app.main import app

    with TestClient(app) as client:  # déclenche aussi le chargement du modèle au démarrage
        for route in ("/health", "/assets", "/presets"):
            if (r := client.get(route)).status_code != 200:
                raise RuntimeError(f"GET {route} → {r.status_code}")
        tm = TransitionMatrix.model_validate(client.get("/regimes/transition").json())
        if any(abs(sum(row) - 1) > 1e-2 for row in tm.matrix):
            raise RuntimeError("Matrice de transition non stochastique")

        params = {"ticker": "^GSPC", "start": "2015-01-01", "end": "2019-12-31"}
        t0 = time.perf_counter()
        r = client.get("/symphony", params=params)
        elapsed = time.perf_counter() - t0
    if r.status_code != 200:
        raise RuntimeError(f"/symphony → {r.status_code} {r.text[:200]}")
    days = len(SymphonyResponse.model_validate(r.json()).days)
    target = get_settings().api.response_time_target_s
    detail = f"5 routes OK · /symphony 5 ans = {days} jours en {elapsed:.2f}s (cible < {target:.0f}s)"
    if elapsed > target:
        raise Warn(detail)
    return detail


# =========================================================================== #
# Frontend
# =========================================================================== #
def node_tool(name: str) -> str:
    """Exécutable local (node_modules/.bin) en priorité, sinon global."""
    found = shutil.which(name, path=str(FRONTEND / "node_modules" / ".bin")) or shutil.which(name)
    if not found:
        raise RuntimeError(f"`{name}` introuvable")
    return found


def node() -> str:
    version = run([node_tool("node"), "--version"], ROOT).strip()
    if int(version.lstrip("v").split(".")[0]) < 18:
        raise RuntimeError(f"Node {version} trop ancien (≥ 18 requis)")
    return f"Node {version}"


def npm_packages() -> str:
    pkg = json.loads((FRONTEND / "package.json").read_text(encoding="utf-8"))
    deps = {**pkg.get("dependencies", {}), **pkg.get("devDependencies", {})}
    if missing := [d for d in deps if not (FRONTEND / "node_modules" / d).exists()]:
        raise RuntimeError(f"Non installés : {', '.join(missing)} → cd frontend && npm install")
    return f"{len(deps)} dépendances installées"


def frontend_constants() -> str:
    """constants.ts doit refléter constant.py et config.yaml."""
    from app.core.config import get_settings
    from app.core.constant import REGIME_PROFILES

    ts = (FRONTEND / "src" / "config" / "constants.ts").read_text(encoding="utf-8")
    s = get_settings()
    front_colors = {k: v.upper() for k, v in re.findall(r'(calm|bull|nervous|panic):\s*"(#[0-9A-Fa-f]{6})"', ts)}
    back_colors = {r.value: str(p["color"]).upper() for r, p in REGIME_PROFILES.items()}
    speeds = [int(x) for x in ts_const(ts, "PLAYBACK_SPEEDS", r"\[([^\]]*)\]").split(",")]
    checks = {
        "couleurs des régimes": (front_colors, back_colors),
        "vitesses de lecture": (speeds, s.playback.speeds),
        "MS_PER_DAY_AT_X1": (int(ts_const(ts, "MS_PER_DAY_AT_X1", r"(\d+)")), s.playback.ms_per_day_at_x1),
        "TARGET_FPS": (int(ts_const(ts, "TARGET_FPS", r"(\d+)")), s.visual.target_fps),
    }
    for label, (front, back) in checks.items():
        if front != back:
            raise RuntimeError(f"{label} : frontend {front} ≠ backend {back}")
    hero = ts_const(ts, "HERO_PRESET_ID", r'"([^"]+)"')
    if hero not in {p.id for p in s.presets}:
        raise RuntimeError(f"HERO_PRESET_ID « {hero} » absent des préréglages")
    return f"{len(checks) + 1} constantes synchronisées (couleurs, vitesses, ms/jour, fps, préréglage d'accueil)"


def frontend_types() -> str:
    """Les interfaces TypeScript ont les mêmes champs que les schémas Pydantic."""
    from app.api import schemas

    ts = (FRONTEND / "src" / "types" / "symphony.ts").read_text(encoding="utf-8")
    interfaces = re.findall(r"export interface (\w+)\s*\{([^}]*)\}", ts)
    for name, body in interfaces:
        model = getattr(schemas, name, None)
        if model is None:
            raise RuntimeError(f"Interface {name} sans schéma Pydantic")
        front, back = set(re.findall(r"(\w+)\??\s*:", body)), set(model.model_fields)
        if front != back:
            raise RuntimeError(f"{name} : frontend {sorted(front)} ≠ backend {sorted(back)}")
    return f"{len(interfaces)} interfaces identiques aux schémas de l'API"


def presets_json() -> str:
    """Préréglages pré-calculés (repli hors ligne) présents et conformes au schéma."""
    from app.api.schemas import SymphonyResponse
    from app.core.config import get_settings

    folder = FRONTEND / "public" / "presets"
    presets = get_settings().presets
    for p in presets:
        path = folder / f"{p.id}.json"
        if not path.exists():
            raise RuntimeError(f"{path.name} absent → python -m scripts.export_presets (depuis backend/)")
        days = SymphonyResponse.model_validate_json(path.read_text(encoding="utf-8")).days
        if not days:
            raise RuntimeError(f"{path.name} est vide")
        if p.id == "subprime_2008" and all(d.regime != "panic" for d in days):
            raise RuntimeError("Le préréglage 2008 ne contient aucun jour de panique")
    return f"{len(presets)} préréglages conformes au schéma SymphonyResponse"


def typescript() -> str:
    run([node_tool("tsc"), "-b"], FRONTEND)
    return "aucune erreur de typage"


def vite_build() -> str:
    run([node_tool("vite"), "build", "--logLevel", "warn"], FRONTEND)
    size = sum(f.stat().st_size for f in (FRONTEND / "dist").rglob("*") if f.is_file())
    return f"build de production OK ({size / 1e6:.1f} Mo dans frontend/dist)"


# =========================================================================== #
def main() -> int:
    parser = argparse.ArgumentParser(description="Diagnostic complet de Market Symphony")
    parser.add_argument("--quick", action="store_true", help="sans pytest, TypeScript ni build")
    parser.add_argument("--network", action="store_true", help="teste un téléchargement réel")
    parser.add_argument("--only", choices=["backend", "frontend"], help="limiter à une partie")
    parser.add_argument("-v", "--verbose", action="store_true", help="traces complètes en cas d'échec")
    args = parser.parse_args()

    slow = "ignoré (--quick)" if args.quick else None
    report = Report(args.verbose)
    t0 = time.perf_counter()
    print(f"{BOLD}🎼 Market Symphony — diagnostic{RESET}  {GREY}{ROOT}{RESET}")

    if args.only != "frontend":
        report.section("BACKEND · environnement")
        report.check("Version de Python", python_version)
        report.check("Dépendances Python", dependencies)
        report.check("config.yaml (validation du schéma)", config)
        report.check("constant.py", constants)
        report.check("Bundle de certificats TLS", tls_bundle)

        report.section("BACKEND · données & modèles")
        report.check("Cache Parquet (≥ 20 ans)", data_cache)
        report.check("Téléchargement yfinance", network, None if args.network else "ignoré (ajouter --network)")
        report.check("Features, modèles et critères de réussite", regimes_quality)

        report.section("BACKEND · tests & API")
        report.check("Tests unitaires pytest",
                     lambda: run([sys.executable, "-m", "pytest", "-q", "-p", "no:cacheprovider"],
                                 BACKEND).strip().splitlines()[-1], slow)
        report.check("API FastAPI (routes, schémas, performance)", api)

    if args.only != "backend":
        report.section("FRONTEND")
        report.check("Node.js", node)
        report.check("Dépendances npm", npm_packages)
        report.check("Constantes synchronisées avec le backend", frontend_constants)
        report.check("Types TypeScript ↔ schémas API", frontend_types)
        report.check("Préréglages JSON (repli hors ligne)", presets_json)
        report.check("Vérification TypeScript (tsc)", typescript, slow)
        report.check("Build de production (vite)", vite_build, slow)

    return report.summary(time.perf_counter() - t0)


if __name__ == "__main__":
    sys.exit(main())
