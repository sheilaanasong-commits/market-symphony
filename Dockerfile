# syntax=docker/dockerfile:1
# =============================================================================
# Market Symphony — image du backend (API FastAPI, inférence seule)
# -----------------------------------------------------------------------------
# Une seule image pour Render et Hugging Face Spaces :
#   - le port est lu dans $PORT (Render le fournit ; Hugging Face utilise 7860) ;
#   - l'application tourne sous un utilisateur non-root (exigence de Hugging Face).
# Les modèles entraînés (models/*.joblib) sont copiés tels quels : pas d'entraînement au démarrage.
# Le cache de données (data/cache) se remplit au fil des requêtes via yfinance.
#
#   docker build -t market-symphony-api .
#   docker run -p 7860:7860 market-symphony-api        →  http://localhost:7860/docs
# =============================================================================
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PORT=7860

RUN useradd --create-home --uid 1000 app
WORKDIR /app

COPY backend/requirements-prod.txt backend/requirements-prod.txt
# Secret optionnel « ca » : bundle de certificats pour un poste dont l'antivirus intercepte le HTTPS
# (voir README §9). Absent sur Render / Hugging Face : rien ne change. La vérification TLS n'est
# jamais désactivée.
#   docker build --secret id=ca,src=data/cache/ca-bundle.pem -t market-symphony-api .
RUN --mount=type=secret,id=ca,required=false \
    if [ -f /run/secrets/ca ]; then export PIP_CERT=/run/secrets/ca; fi; \
    pip install -r backend/requirements-prod.txt

COPY config.yaml ./
COPY models/ models/
COPY backend/app backend/app
RUN mkdir -p data/cache && chown -R app:app /app

USER app
WORKDIR /app/backend
EXPOSE 7860

# Vérification de disponibilité (Docker) ; Render et Hugging Face ont leur propre sonde sur /health
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s \
  CMD python -c "import os, urllib.request; urllib.request.urlopen(f'http://127.0.0.1:{os.environ[\"PORT\"]}/health', timeout=4)"

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT} --proxy-headers --forwarded-allow-ips='*'"]
