# Contributing to Jobseeker

## Getting Started

### Prerequisites

1. **Clone the repository**
   ```bash
   git clone https://github.com/jeremiah-wa/jobseeker.git
   cd jobseeker
   ```

2. **Set up development environment**
   ```bash
   # Copy environment variables
   cp .env.example .env

   # Start all services
   docker compose up
   ```

3. **Verify setup**
   - Frontend: http://localhost:3000
   - API: http://localhost:8000/docs
   - Database: localhost:5432

---

## Development Workflow

See [Branching Strategy](./BRANCHING_STRATEGY.md) for complete details.

### Quick Reference

```bash
# Create feature branch
git checkout -b feature/123-description

# Make changes with conventional commits
git commit -m "feat(scope): description"

# Push and create PR
git push origin feature/123-description
```

---

## Coding Standards

### Python (Backend)

- **Style**: PEP 8, enforced by Ruff
- **Type hints**: Required for all functions
- **Docstrings**: Google-style

```python
def search_jobs(keywords: list[str], location: str | None = None) -> list[Job]:
    """Search for jobs matching criteria.

    Args:
        keywords: Search terms
        location: Optional location filter

    Returns:
        List of matching jobs
    """
    pass
```

**Run linting**:
```bash
docker compose exec backend ruff check .
docker compose exec backend ruff format .
```

### TypeScript (Frontend)

- **Style**: ESLint + Prettier
- **Components**: Functional components with hooks

```typescript
interface JobCardProps {
  job: Job;
  onSave: (jobId: string) => void;
}

export function JobCard({ job, onSave }: JobCardProps) {
  // Component logic
}
```

**Run linting**:
```bash
docker compose exec frontend pnpm lint
docker compose exec frontend pnpm format
```

---

## Testing

### Python Tests (pytest)

```bash
# Run all tests
docker compose exec backend pytest

# Run with coverage
docker compose exec backend pytest --cov=app --cov-report=html

# Run specific marker
docker compose exec backend pytest -m unit
```

**Test structure**:
```
backend/tests/
├── unit/           # Fast, isolated tests
├── integration/    # Tests with database/services
└── conftest.py     # Shared fixtures
```

### Frontend Tests

```bash
# Run tests
docker compose exec frontend pnpm test

# Run with coverage
docker compose exec frontend pnpm test:coverage
```

---

## Pre-commit Hooks

Install pre-commit hooks:
```bash
pip install pre-commit
pre-commit install
```

Hooks will run automatically on commit:
- Ruff linting and formatting
- Trailing whitespace removal
- YAML validation
- Large file check

---

## Pull Request Checklist

- [ ] Code follows style guidelines
- [ ] Tests added for new functionality
- [ ] All tests pass locally
- [ ] Documentation updated if needed
- [ ] PR linked to issue
- [ ] Commit messages follow conventions
