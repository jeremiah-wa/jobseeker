# Testing Guide

This document describes the testing strategy, markers, and how to run tests for the Jobseeker application.

## Test Structure

```
backend/tests/
├── conftest.py          # Shared fixtures
├── unit/                # Unit tests (no external dependencies)
│   ├── test_auth.py     # Authentication utility tests
│   ├── test_health.py   # Health endpoint tests
│   └── test_models.py   # Database model tests
└── integration/         # Integration tests (requires database/services)
    └── (future tests)
```

## Test Markers

We use pytest markers to categorize tests by their dependencies and execution requirements.

### Available Markers

| Marker | Description | External Dependencies | Run in CI |
|--------|-------------|----------------------|-----------|
| `unit` | Standalone tests with no external dependencies | None | ✅ Yes |
| `integration` | Tests requiring database or external services | Database, Redis, etc. | ❌ No |

### Marker Definitions

Markers are defined in `backend/pyproject.toml`:

```toml
[tool.pytest.ini_options]
markers = [
    "unit: Unit tests (no external dependencies)",
    "integration: Integration tests (requires database/services)",
]
```

## Running Tests

### Run All Tests

```bash
# Inside Docker container
docker-compose exec backend uv run pytest

# Or locally (with virtual environment activated)
cd backend
uv run pytest
```

### Run Only Unit Tests (CI-safe)

```bash
# Recommended for CI pipelines
docker-compose exec backend uv run pytest -m unit

# With coverage
docker-compose exec backend uv run pytest -m unit --cov=app --cov-report=term-missing
```

### Run Only Integration Tests

```bash
# Requires database and services to be running
docker-compose exec backend uv run pytest -m integration
```

### Exclude Integration Tests

```bash
# Run everything except integration tests
docker-compose exec backend uv run pytest -m "not integration"
```

### Run Specific Test File

```bash
docker-compose exec backend uv run pytest tests/unit/test_auth.py -v
```

### Run Specific Test Class or Function

```bash
# Run a specific class
docker-compose exec backend uv run pytest tests/unit/test_auth.py::TestPasswordHashing -v

# Run a specific test
docker-compose exec backend uv run pytest tests/unit/test_auth.py::TestPasswordHashing::test_hash_password -v
```

## CI Configuration

**Important**: Only run `unit` tests in CI. Integration tests require external services and should NOT run in CI pipelines.

```yaml
# Example GitHub Actions step
- name: Run unit tests
  run: |
    cd backend
    uv run pytest -m unit --cov=app --cov-report=xml
```

### CI Command Summary

```bash
# ✅ Use this in CI - runs only unit tests
uv run pytest -m unit

# ❌ Do NOT use in CI - requires database/services
uv run pytest -m integration
uv run pytest  # runs all tests including integration
```

### Why Separate Unit and Integration Tests?

| Aspect | Unit Tests | Integration Tests |
|--------|------------|-------------------|
| **Dependencies** | None | Database, Redis, APIs |
| **Speed** | Fast (ms) | Slow (seconds) |
| **CI Safe** | ✅ Yes | ❌ No |
| **Parallelizable** | ✅ Yes | ⚠️ May conflict |
| **Reliability** | Deterministic | May flake |

## Writing Tests

### Unit Tests

Unit tests should:
- Test a single function or class in isolation
- Mock external dependencies
- Be fast (< 100ms per test)
- Have no side effects

```python
import pytest

@pytest.mark.unit
class TestMyFeature:
    def test_something(self):
        # Test logic here
        assert True
```

### Integration Tests

Integration tests should:
- Test multiple components working together
- Use real database connections (via fixtures)
- Clean up after themselves

```python
import pytest

@pytest.mark.integration
class TestDatabaseOperations:
    async def test_create_user(self, db_session):
        # Test with real database
        pass
```

## Test Fixtures

Common fixtures are defined in `tests/conftest.py`:

### `client`
A FastAPI TestClient for making HTTP requests to the application.

```python
def test_endpoint(client):
    response = client.get("/health")
    assert response.status_code == 200
```

### Future Fixtures

For integration tests, we'll add:
- `db_session` - Async database session
- `test_user` - Pre-created test user
- `auth_headers` - Authentication headers for protected endpoints

## Coverage

Generate coverage reports:

```bash
# Terminal report
docker-compose exec backend uv run pytest -m unit --cov=app --cov-report=term-missing

# HTML report
docker-compose exec backend uv run pytest -m unit --cov=app --cov-report=html

# XML report (for CI)
docker-compose exec backend uv run pytest -m unit --cov=app --cov-report=xml
```

## Best Practices

1. **Always mark tests** - Every test class or function should have a marker
2. **Unit tests first** - Write unit tests before integration tests
3. **Keep unit tests fast** - If a test takes > 1 second, it might be an integration test
4. **Isolate tests** - Tests should not depend on each other
5. **Clean up** - Integration tests should clean up any data they create
6. **Use fixtures** - Share common setup code via fixtures
7. **Descriptive names** - Test names should describe what they test
