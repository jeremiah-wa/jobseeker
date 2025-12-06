"""Unit tests for authentication utilities."""

from datetime import UTC, datetime, timedelta

import pytest

from app.utils.auth import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
    verify_token_type,
)


@pytest.mark.unit
class TestPasswordHashing:
    """Tests for password hashing functions."""

    def test_hash_password(self):
        """Test password hashing."""
        password = "test_password_123"
        hashed = hash_password(password)

        assert hashed != password
        assert len(hashed) > 0
        assert hashed.startswith("$argon2id$")  # Argon2id prefix

    def test_verify_password_correct(self):
        """Test password verification with correct password."""
        password = "test_password_123"
        hashed = hash_password(password)

        assert verify_password(password, hashed) is True

    def test_verify_password_incorrect(self):
        """Test password verification with incorrect password."""
        password = "test_password_123"
        wrong_password = "wrong_password"
        hashed = hash_password(password)

        assert verify_password(wrong_password, hashed) is False


@pytest.mark.unit
class TestJWTTokens:
    """Tests for JWT token functions."""

    def test_create_access_token(self):
        """Test access token creation."""
        data = {"sub": "user_id_123"}
        token = create_access_token(data)

        assert isinstance(token, str)
        assert len(token) > 0

    def test_create_refresh_token(self):
        """Test refresh token creation."""
        data = {"sub": "user_id_123"}
        token = create_refresh_token(data)

        assert isinstance(token, str)
        assert len(token) > 0

    def test_decode_access_token(self):
        """Test decoding access token."""
        data = {"sub": "user_id_123"}
        token = create_access_token(data)
        decoded = decode_token(token)

        assert decoded["sub"] == "user_id_123"
        assert decoded["type"] == "access"
        assert "exp" in decoded

    def test_decode_refresh_token(self):
        """Test decoding refresh token."""
        data = {"sub": "user_id_123"}
        token = create_refresh_token(data)
        decoded = decode_token(token)

        assert decoded["sub"] == "user_id_123"
        assert decoded["type"] == "refresh"
        assert "exp" in decoded

    def test_verify_token_type_access(self):
        """Test token type verification for access token."""
        data = {"sub": "user_id_123"}
        token = create_access_token(data)
        decoded = decode_token(token)

        assert verify_token_type(decoded, "access") is True
        assert verify_token_type(decoded, "refresh") is False

    def test_verify_token_type_refresh(self):
        """Test token type verification for refresh token."""
        data = {"sub": "user_id_123"}
        token = create_refresh_token(data)
        decoded = decode_token(token)

        assert verify_token_type(decoded, "refresh") is True
        assert verify_token_type(decoded, "access") is False

    def test_token_expiration(self):
        """Test that token contains expiration time."""
        data = {"sub": "user_id_123"}
        token = create_access_token(data)
        decoded = decode_token(token)

        exp_timestamp = decoded["exp"]
        exp_datetime = datetime.fromtimestamp(exp_timestamp, tz=UTC)
        now = datetime.now(UTC)

        # Token should expire in the future
        assert exp_datetime > now
        # Token should expire within reasonable time (less than 1 hour for access token)
        assert exp_datetime < now + timedelta(hours=1)
