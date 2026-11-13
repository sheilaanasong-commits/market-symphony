"""Configuration réseau / TLS.

Problème rencontré : un antivirus (ex. Avast « Web Shield ») inspecte le HTTPS
en substituant ses propres certificats, approuvés uniquement par le magasin
Windows. Les bibliothèques Python (certifi, curl_cffi utilisé par yfinance)
les rejettent alors (« unable to get local issuer certificate »).

Solution : construire un bundle PEM = certificats certifi + racines du magasin
Windows, et le fournir explicitement aux sessions HTTP. On ne désactive JAMAIS
la vérification TLS.
"""

from __future__ import annotations

import logging
import os
import ssl
import sys
from functools import lru_cache
from pathlib import Path

import certifi

from app.core.config import get_config, resolve_path

logger = logging.getLogger(__name__)


def _windows_root_certificates_pem() -> list[str]:
    """Certificats racines (et intermédiaires) du magasin Windows au format PEM."""
    pems: list[str] = []
    for store in ("ROOT", "CA"):
        for cert, encoding, trust in ssl.enum_certificates(store):  # type: ignore[attr-defined]
            # trust == True : utilisable pour tout ; sinon ensemble d'OID d'usage
            if encoding == "x509_asn" and (trust is True or "1.3.6.1.5.5.7.3.1" in trust):
                pems.append(ssl.DER_cert_to_PEM_cert(cert))
    return pems


@lru_cache(maxsize=1)
def ca_bundle_path() -> str:
    """Chemin du bundle CA à utiliser pour les requêtes HTTPS.

    - ``network.use_system_certificates: auto`` (défaut) : bundle étendu sous Windows,
      certifi ailleurs.
    - ``true`` / ``false`` : force le comportement.
    """
    mode = get_config().get("network", {}).get("use_system_certificates", "auto")
    use_system = sys.platform == "win32" if mode == "auto" else bool(mode)
    if not use_system:
        return certifi.where()

    target = resolve_path(get_config()["network"]["ca_bundle_file"])
    target.parent.mkdir(parents=True, exist_ok=True)
    content = Path(certifi.where()).read_text(encoding="utf-8")
    content += "\n# --- Magasin de certificats Windows ---\n" + "".join(_windows_root_certificates_pem())
    target.write_text(content, encoding="utf-8")
    logger.debug("Bundle CA étendu écrit dans %s", target)
    return str(target)


def configure_tls_environment() -> str:
    """Expose le bundle aux bibliothèques qui lisent les variables d'environnement (requests...)."""
    path = ca_bundle_path()
    for var in ("SSL_CERT_FILE", "REQUESTS_CA_BUNDLE", "CURL_CA_BUNDLE"):
        os.environ.setdefault(var, path)
    return path
