import os
from datetime import timedelta

os.environ["SECRET_KEY"] = "reference-test-key-with-at-least-thirty-two-bytes"
os.environ.pop("OPENAI_API_KEY", None)
os.environ.pop("GROQ_API_KEY", None)

import jwt
import pytest
from fastapi import HTTPException

from app.core.security import SecurityManager


def test_access_token_round_trip():
    security = SecurityManager()
    token = security.create_access_token({"sub": "test-user"})
    assert security.verify_token(token)["sub"] == "test-user"


def test_expired_token_is_rejected():
    security = SecurityManager()
    token = security.create_access_token({"sub": "test-user"}, timedelta(seconds=-1))
    with pytest.raises(HTTPException) as error:
        security.verify_token(token)
    assert error.value.status_code == 401


@pytest.mark.parametrize("algorithm", ["HS256", "HS384"])
def test_wrong_signature_or_algorithm_is_rejected(algorithm):
    security = SecurityManager()
    token = jwt.encode({"sub": "test-user"}, "different-test-key-with-at-least-thirty-two-bytes", algorithm=algorithm)
    with pytest.raises(HTTPException):
        security.verify_token(token)


def test_api_key_preserves_permissions_and_rejects_access_token():
    security = SecurityManager()
    token = security.create_api_key("test-service", ["read"])
    assert security.validate_api_key(token)["permissions"] == ["read"]
    with pytest.raises(HTTPException):
        security.validate_api_key(security.create_access_token({"sub": "test-user"}))


def test_bcrypt_hash_verification():
    security = SecurityManager()
    hashed = security.get_password_hash("test-password")
    assert security.verify_password("test-password", hashed)
    assert not security.verify_password("wrong-password", hashed)
    assert not security.verify_password("x" * 73, hashed)
    assert not security.verify_password("test-password", "invalid-hash")
