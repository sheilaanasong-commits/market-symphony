"""Bundle de certificats TLS compatible avec les antivirus qui inspectent le HTTPS.

Certains antivirus (ex. Avast « Web Shield ») remplacent les certificats des
sites par les leurs, approuvés uniquement par le magasin Windows : certifi et
curl_cffi (utilisé par yfinance) les rejettent. On construit donc un bundle
« certifi + racines Windows ». La vérification TLS n'est JAMAIS désactivée.
"""

from __future__ import annotations

import logging
import ssl
import sys
from functools import lru_cache
from pathlib import Path

import certifi

from app.core.config import get_settings

logger = logging.getLogger(__name__)

_SERVER_AUTH_OID = "1.3.6.1.5.5.7.3.1"


def _windows_certificates_pem() -> str:
    """Certificats des magasins Windows ROOT et CA autorisés pour l'authentification serveur."""
    pems = []
    for store in ("ROOT", "CA"):
        for der, encoding, trust in ssl.enum_certificates(store):  # type: ignore[attr-defined]
            if encoding == "x509_asn" and (trust is True or _SERVER_AUTH_OID in trust):
                pems.append(ssl.DER_cert_to_PEM_cert(der))
    return "".join(pems)


@lru_cache(maxsize=1)
def ca_bundle_path() -> str:
    """Chemin du bundle CA : étendu sous Windows (mode ``auto``), certifi sinon.

    En cas d'échec de lecture du magasin Windows, on retombe sur certifi.
    """
    cfg = get_settings().network
    use_system = sys.platform == "win32" if cfg.use_system_certificates == "auto" else cfg.use_system_certificates
    if not use_system:
        return certifi.where()
    try:
        bundle = Path(certifi.where()).read_text(encoding="utf-8") + _windows_certificates_pem()
        cfg.ca_bundle_file.parent.mkdir(parents=True, exist_ok=True)
        cfg.ca_bundle_file.write_text(bundle, encoding="utf-8")
        return str(cfg.ca_bundle_file)
    except (OSError, AttributeError) as exc:
        logger.warning("Bundle CA étendu impossible (%s) : utilisation de certifi seul", exc)
        return certifi.where()
