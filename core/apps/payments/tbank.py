from __future__ import annotations
import hashlib
import json
import typing as t
import requests
from django.conf import settings


def _flatten_for_token(data: dict) -> dict:
    clean = {}
    for i, j in data.items():
        if i == "Token" or j is None:
            continue
        if isinstance(j, (dict, list)):
            continue
        clean[i] = j
    return clean

def make_token(payload: dict, password: str) -> str:
    flat = _flatten_for_token(payload)
    flat['password'] = password
    concatenated = "".join(str(flat[i]) for i in sorted(flat.keys()))
    return hashlib.sha256(
        concatenated.encode('utf-8')
    ).hexdigest()
    
def tbank_post(method: str, payload: dict) -> dict:
    base = settings.T_BANK['BASE_URL'].rstrip('/')
    url = f'{base}/{method.lstrip('/')}'
    r = requests.post(
        url,
        json=payload,
        timeout=20
    )
    r.raise_for_status()
    return r.json()