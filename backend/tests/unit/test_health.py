"""Tests for health check endpoint."""

import pytest
from fastapi.testclient import TestClient


@pytest.mark.unit
def test_health_check(client: TestClient) -> None:
    """Test health check returns healthy status."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}


@pytest.mark.unit
def test_root(client: TestClient) -> None:
    """Test root endpoint returns API info."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert "Jobseeker" in data["message"]
