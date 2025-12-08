# Jobseeker Backend

FastAPI backend for the Jobseeker application.

## Tech Stack

- **Framework**: FastAPI
- **Language**: Python 3.11+
- **Database**: PostgreSQL with SQLAlchemy 2.0 (async)
- **Migrations**: Alembic
- **Auth**: JWT with Argon2 password hashing
- **LLM**: LangChain + Anthropic Claude
- **PDF Parsing**: PyMuPDF

## Getting Started

### Prerequisites

- Python 3.11+
- uv (package manager)
- PostgreSQL

### Development

```bash
# Install dependencies
uv sync

# Run server
uv run uvicorn app.main:app --reload

# Run tests
uv run pytest -m unit

# Lint & format
uv run ruff check .
uv run ruff format .

# Type check
uv run mypy app
```

### With Docker

```bash
# From project root
docker compose up backend
```

## API Documentation

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Project Structure

```
backend/
├── alembic/                # Database migrations
│   └── versions/           # Migration files
├── app/
│   ├── db/                 # Database layer
│   │   ├── models/         # SQLAlchemy models
│   │   ├── base.py         # Base model class
│   │   └── database.py     # Database connection
│   ├── routers/            # API endpoints
│   │   ├── auth.py         # Authentication routes
│   │   └── cv.py           # CV management routes
│   ├── schemas/            # Pydantic schemas
│   ├── dependencies/       # FastAPI dependencies
│   ├── storage/            # File storage utilities
│   ├── utils/              # Helper utilities
│   ├── config.py           # App configuration
│   └── main.py             # FastAPI app entry
└── tests/
    └── unit/               # Unit tests
```

## Database Models

| Model | Description |
|-------|-------------|
| `User` | User accounts with auth credentials |
| `CV` | Uploaded CVs with parsed data |
| `SavedJob` | Jobs saved by users |
| `TailoredCV` | CVs tailored for specific jobs |

## API Endpoints

### Authentication (`/api/auth`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/register` | Create new account |
| POST | `/login` | Get access token |
| GET | `/me` | Get current user |

### CVs (`/api/cvs`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/upload` | Upload PDF CV |
| GET | `/` | List user's CVs |
| GET | `/{id}` | Get CV details |
| GET | `/{id}/download` | Download CV file |
| PATCH | `/{id}/primary` | Set as primary CV |
| DELETE | `/{id}` | Delete CV |

## Environment Variables

```bash
# Database
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/jobseeker

# Auth
JWT_SECRET_KEY=your-secret-key
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Storage
STORAGE_TYPE=local
STORAGE_PATH=./storage

# LLM (optional)
ANTHROPIC_API_KEY=sk-ant-...
```

See `.env.example` for all variables.

## Scripts

| Script | Description |
|--------|-------------|
| `uv sync` | Install dependencies |
| `uv run uvicorn app.main:app --reload` | Start dev server |
| `uv run pytest` | Run all tests |
| `uv run pytest -m unit` | Run unit tests only |
| `uv run ruff check .` | Lint code |
| `uv run ruff format .` | Format code |
| `uv run mypy app` | Type check |
| `uv run alembic upgrade head` | Run migrations |
| `uv run alembic revision --autogenerate -m "msg"` | Create migration |
