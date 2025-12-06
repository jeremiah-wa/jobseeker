# Jobseeker Backend

FastAPI backend for the Jobseeker application.

## Development

```bash
# Install dependencies
uv sync

# Run server
uv run uvicorn app.main:app --reload

# Run tests
uv run pytest -m unit

# Lint
uv run ruff check .
uv run ruff format .
```

## API Docs

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
