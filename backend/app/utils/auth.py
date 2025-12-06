"""Authentication utilities for password hashing and JWT tokens."""

from datetime import UTC, datetime, timedelta
from typing import Any

from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from jose import jwt

from app.config import settings

# Argon2id password hasher with OWASP recommended settings
# memory_cost=19456 (19 MiB), time_cost=2, parallelism=1
ph = PasswordHasher(
    time_cost=2,
    memory_cost=19456,
    parallelism=1,
)


def hash_password(password: str) -> str:
    """Hash a password using Argon2id.

    Args:
        password: Plain text password.

    Returns:
        Hashed password.
    """
    return ph.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash.

    Args:
        plain_password: Plain text password.
        hashed_password: Hashed password to verify against.

    Returns:
        True if password matches, False otherwise.
    """
    try:
        ph.verify(hashed_password, plain_password)
        return True
    except VerifyMismatchError:
        return False


def create_access_token(data: dict[str, Any]) -> str:
    """Create a JWT access token.

    Args:
        data: Data to encode in the token.

    Returns:
        Encoded JWT token.
    """
    to_encode = data.copy()
    expire = datetime.now(UTC) + timedelta(minutes=settings.access_token_expire_minutes)
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def create_refresh_token(data: dict[str, Any]) -> str:
    """Create a JWT refresh token.

    Args:
        data: Data to encode in the token.

    Returns:
        Encoded JWT token.
    """
    to_encode = data.copy()
    expire = datetime.now(UTC) + timedelta(days=settings.refresh_token_expire_days)
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def decode_token(token: str) -> dict[str, Any]:
    """Decode and verify a JWT token.

    Args:
        token: JWT token to decode.

    Returns:
        Decoded token payload.

    Raises:
        JWTError: If token is invalid or expired.
    """
    return jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])


def verify_token_type(payload: dict[str, Any], expected_type: str) -> bool:
    """Verify that a token payload has the expected type.

    Args:
        payload: Decoded token payload.
        expected_type: Expected token type ('access' or 'refresh').

    Returns:
        True if token type matches, False otherwise.
    """
    return payload.get("type") == expected_type
