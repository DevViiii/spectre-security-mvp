"""
Symmetric encryption for sensitive column values (e.g. third-party API keys
we hold on behalf of customers for scan execution).

Fernet key is derived deterministically from SECRET_KEY via SHA-256, so rotating
SECRET_KEY rotates the encryption key. Rotating SECRET_KEY without re-encrypting
existing ciphertext will make those rows unreadable — coordinate with a migration.
"""
from __future__ import annotations

import base64
import hashlib
from functools import lru_cache

from cryptography.fernet import Fernet, InvalidToken
from sqlalchemy import String, TypeDecorator

from app.config import settings


@lru_cache(maxsize=1)
def _fernet() -> Fernet:
    digest = hashlib.sha256(settings.SECRET_KEY.encode("utf-8")).digest()
    return Fernet(base64.urlsafe_b64encode(digest))


def encrypt(plaintext: str) -> str:
    return _fernet().encrypt(plaintext.encode("utf-8")).decode("ascii")


def decrypt(ciphertext: str) -> str:
    return _fernet().decrypt(ciphertext.encode("ascii")).decode("utf-8")


def try_decrypt(ciphertext: str) -> str | None:
    """Returns plaintext, or None if the value isn't valid ciphertext for the current key."""
    try:
        return decrypt(ciphertext)
    except (InvalidToken, ValueError):
        return None


class EncryptedString(TypeDecorator):
    """
    Transparently encrypts string values at write time and decrypts at read time.

    NULL values pass through unchanged. The `length` argument is the maximum
    *ciphertext* length in the underlying column — Fernet output is ~1.5–2×
    plaintext after base64, plus a fixed 73-byte header, so size the column
    generously.
    """

    impl = String
    cache_ok = True

    def __init__(self, length: int = 1000, **kwargs):
        super().__init__(length=length, **kwargs)

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        return encrypt(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return None
        return decrypt(value)
