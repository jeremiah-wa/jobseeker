# Jobseeker

AI-enhanced web application that helps job seekers find relevant positions and tailor their CVs using LLM technology.

## Features

- **CV Upload & Parsing** - Upload PDF CVs, extract skills and experience using AI
- **Job Search** - Search jobs from multiple sources via plugin connectors
- **AI Matching** - Get match scores showing how well jobs fit your profile
- **CV Tailoring** - Generate tailored CV versions optimized for specific jobs
- **Application Tracking** - Save jobs and track your application progress

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js, TypeScript, TailwindCSS, shadcn/ui |
| **Backend** | FastAPI, Python 3.11+ |
| **Database** | PostgreSQL, SQLAlchemy |
| **LLM** | Anthropic Claude via LangChain |
| **Deployment** | Docker Compose |

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Git

### Setup

```bash
# Clone the repository
git clone https://github.com/jeremiah-wa/jobseeker.git
cd jobseeker

# Copy environment variables
cp .env.example .env

# Start all services
docker compose up
```

### Access

- **Frontend**: http://localhost:3000
- **API Docs**: http://localhost:8000/docs
- **Database**: localhost:5432

## Project Structure

```
jobseeker/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── routers/        # API endpoints
│   │   ├── models/         # SQLAlchemy models
│   │   ├── schemas/        # Pydantic schemas
│   │   ├── services/       # Business logic
│   │   └── connectors/     # Job source connectors
│   └── tests/
├── frontend/               # Next.js frontend
│   └── src/
│       ├── app/           # Pages and routes
│       ├── components/    # React components
│       └── lib/           # Utilities
├── docs/                   # Documentation
└── docker-compose.yml
```

## Development

### Running Locally

```bash
# Start services
docker compose up

# Run backend tests
docker compose exec backend pytest

# Run frontend tests
docker compose exec frontend pnpm test

# Run linting
docker compose exec backend ruff check .
docker compose exec frontend pnpm lint
```

### Pre-commit Hooks

```bash
pip install pre-commit
pre-commit install
```

### Branch Naming

- `feature/<issue>-<description>` - New features
- `fix/<issue>-<description>` - Bug fixes
- `infra/<description>` - Infrastructure changes

See [Branching Strategy](docs/BRANCHING_STRATEGY.md) for details.

## Documentation

- [Backend README](backend/README.md) - API endpoints, database models, and backend development
- [Frontend README](frontend/README.md) - UI components, theming, and frontend development
- [Roadmap](docs/ROADMAP.md) - Development phases and milestones
- [Architecture](docs/ARCHITECTURE.md) - Technical decisions (ADRs)
- [Tech Stack](docs/TECH_STACK.md) - Technology choices
- [Contributing](docs/CONTRIBUTING.md) - How to contribute
- [Branching Strategy](docs/BRANCHING_STRATEGY.md) - Git workflow

## Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/jobseeker

# Auth
JWT_SECRET_KEY=your-secret-key
JWT_ALGORITHM=HS256

# LLM
ANTHROPIC_API_KEY=sk-ant-...

# Job Connectors
ADZUNA_APP_ID=your-app-id
ADZUNA_APP_KEY=your-app-key
```

## Job Connectors

The app uses a plugin system for job sources:

| Connector | Status | Coverage |
|-----------|--------|----------|
| Adzuna | 🚧 MVP | AU, UK, US |
| Jooble | 📋 Planned | Global |
| RemoteOK | 📋 Planned | Remote |

## Roadmap

- [x] **Phase 1**: Foundation (auth, CV upload, parsing)
- [ ] **Phase 2**: Job search & connectors
- [ ] **Phase 3**: AI matching
- [ ] **Phase 4**: CV tailoring
- [ ] **Phase 5**: Application management

See [full roadmap](docs/ROADMAP.md) for details.

## License

Private - All rights reserved
