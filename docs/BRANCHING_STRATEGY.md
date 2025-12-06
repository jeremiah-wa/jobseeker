# Git Branching Strategy - Jobseeker

## Overview

This project follows **GitHub Flow** - a simple, lightweight branching strategy suitable for MVP development.

---

## Branch Structure

### Main Branch

#### `main`
- **Purpose**: Production-ready code, always deployable
- **Protection**: Required reviews, all tests must pass
- **Merge Strategy**: Squash and merge to keep history clean

---

## Branch Types

### Feature Branches
**Pattern**: `feature/<issue-number>-<short-description>`

**Examples**:
- `feature/2-project-scaffolding`
- `feature/5-user-authentication`
- `feature/10-adzuna-connector`

### Bugfix Branches
**Pattern**: `fix/<issue-number>-<description>`

**Examples**:
- `fix/45-login-error`
- `fix/67-cv-upload-timeout`

### Infrastructure Branches
**Pattern**: `infra/<description>`

**Examples**:
- `infra/docker-compose-setup`
- `infra/ci-pipeline`

### Hotfix Branches
**Pattern**: `hotfix/<critical-issue>`

**Examples**:
- `hotfix/auth-bypass`
- `hotfix/data-loss`

**Process**: Fast-track review, immediate merge and deploy.

---

## Commit Conventions

We use **Conventional Commits** for clear history:

### Format
```
<type>(<scope>): <description>
```

### Types

| Type | Description | Example |
|------|-------------|---------|
| `feat` | New feature | `feat(api): add CV upload endpoint` |
| `fix` | Bug fix | `fix(auth): resolve token refresh issue` |
| `api` | API changes | `api(jobs): add search filters` |
| `ui` | Frontend changes | `ui(search): add job card component` |
| `infra` | Infrastructure | `infra(docker): add PostgreSQL service` |
| `test` | Test changes | `test(api): add auth integration tests` |
| `docs` | Documentation | `docs(readme): update setup instructions` |
| `refactor` | Code refactoring | `refactor(connectors): extract base class` |
| `chore` | Maintenance | `chore(deps): update fastapi to 0.109` |

### Scope Examples
- `api`, `ui`, `auth`, `cv`, `jobs`, `connectors`, `docker`, `ci`, `db`

---

## Workflow

### 1. Create Branch
```bash
git checkout main
git pull origin main
git checkout -b feature/123-description
```

### 2. Develop
```bash
git add .
git commit -m "feat(scope): description"
git push origin feature/123-description
```

### 3. Open Pull Request
- Link to issue: `Closes #123`
- Describe changes and how to test
- Ensure CI passes

### 4. Review & Merge
- Address feedback
- Squash and merge when approved
- Delete branch after merge

---

## Best Practices

- ✅ Keep branches short-lived (< 3 days ideal)
- ✅ Rebase frequently to stay current with `main`
- ✅ Delete branches after merge
- ✅ Link PRs to issues
- ✅ Run tests locally before pushing
- ✅ Write descriptive commit messages
