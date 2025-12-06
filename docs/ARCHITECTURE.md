# Jobseeker - Architecture Decisions

## Overview

This document records architectural decisions made during development.

---

## ADR-001: Deployment Strategy

**Status:** Accepted  
**Date:** 2024-12-06

### Context
Need to choose deployment approach for MVP development and testing.

### Decision
Use **Docker Compose** for local development and MVP deployment.

### Rationale
- Consistent environment across development machines
- Easy to add services (database, cache, etc.)
- Straightforward path to cloud deployment later
- No cloud costs during MVP phase

### Consequences
- Developers need Docker installed
- Production deployment strategy TBD post-MVP

---

## ADR-002: Backend Language & Framework

**Status:** Accepted  
**Date:** 2024-12-06

### Context
Need to choose backend technology stack.

### Decision
Use **Python** with **FastAPI** (pending confirmation).

### Rationale
- Strong AI/ML ecosystem (LangChain, document processing)
- FastAPI provides modern async support, auto-generated API docs
- Team familiarity with Python
- Good library support for PDF/DOCX processing

### Consequences
- Need separate frontend (if not using Python UI framework)
- Async considerations for I/O-bound operations

---

## ADR-003: LLM Integration Strategy

**Status:** Accepted  
**Date:** 2024-12-06

### Context
Need LLM for CV analysis, matching, and tailoring. Should be swappable.

### Decision
Use **LangChain** as abstraction layer, starting with **Anthropic Claude**.

### Rationale
- LangChain provides unified interface across LLM providers
- Easy to swap between OpenAI, Anthropic, local models
- Built-in prompt templates, chains, and memory
- MCP (Model Context Protocol) support possible in future

### Consequences
- Additional abstraction layer
- Need to manage LangChain version compatibility
- API key management for Anthropic

---

## ADR-004: Geographic Focus

**Status:** Accepted  
**Date:** 2024-12-06

### Context
Need to scope initial job search coverage.

### Decision
Start with **Melbourne, Australia**. Design for global expansion.

### Rationale
- Focused MVP scope
- Adzuna API supports Australian job market
- Currency, locale considerations deferred

### Consequences
- Initial connectors configured for AU
- Database schema should support multiple regions
- UI should be region-aware from start

---

## ADR-005: Monetization Architecture

**Status:** Accepted  
**Date:** 2024-12-06

### Context
No monetization for MVP, but should be easy to add later.

### Decision
Design with monetization hooks but don't implement.

### Implementation Considerations
- User tiers table in database (free/premium)
- Rate limiting middleware (configurable limits)
- Feature flags for premium features
- Analytics/telemetry infrastructure for ad revenue
- Quota tracking for API usage

### Consequences
- Slightly more complex initial schema
- Feature flag system needed
- Analytics infrastructure planned early

---

## ADR-006: Job Connector Architecture

**Status:** Accepted  
**Date:** 2024-12-06

### Context
Need to support multiple job board APIs with easy addition of new sources.

### Decision
Implement **plugin-based connector system** with:
- Common interface/protocol for all connectors
- Configuration-driven where possible
- Normalized job data format

### Interface (Draft)
```python
from abc import ABC, abstractmethod
from typing import List, Optional
from pydantic import BaseModel

class JobSearchParams(BaseModel):
    keywords: List[str]
    location: Optional[str] = None
    radius_km: Optional[int] = None
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    job_type: Optional[str] = None  # full-time, part-time, contract
    page: int = 1
    per_page: int = 20

class Job(BaseModel):
    id: str
    source: str
    title: str
    company: str
    location: str
    description: str
    url: str
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    salary_currency: Optional[str] = None
    job_type: Optional[str] = None
    posted_at: Optional[datetime] = None
    raw_data: dict  # Original API response

class JobConnector(ABC):
    @property
    @abstractmethod
    def name(self) -> str:
        pass
    
    @abstractmethod
    async def search(self, params: JobSearchParams) -> List[Job]:
        pass
    
    async def get_details(self, job_id: str) -> Optional[Job]:
        """Optional: fetch full job details"""
        return None
```

### Rationale
- Decoupled from specific APIs
- Easy to add new job sources
- Consistent data format for matching algorithm

### First Connector
**Adzuna API** - Free tier, good Australian coverage, well-documented.

---

## ADR-007: Database Choice

**Status:** Accepted  
**Date:** 2024-12-06

### Context
Need persistent storage for users, CVs, jobs, applications.

### Decision
Use **PostgreSQL** with **SQLAlchemy** ORM.

### Rationale
- Robust, production-ready
- Good JSON support for flexible data
- Full-text search capabilities
- SQLAlchemy provides good Python integration

### Consequences
- Docker Compose includes PostgreSQL service
- Migrations via Alembic

---

## ADR-008: Frontend Framework

**Status:** Accepted  
**Date:** 2024-12-06

### Decision
Use **React/Next.js** with TypeScript, TailwindCSS, and shadcn/ui.

### Rationale
- Modern, flexible UI capabilities
- Large ecosystem and community
- SSR support for SEO (future)
- Separation of concerns from Python backend

---

## ADR-009: Authentication Approach

**Status:** Accepted  
**Date:** 2024-12-06

### Decision
Use **email/password with JWT tokens** for MVP.

### Implementation
- `passlib` with bcrypt for password hashing
- `python-jose` for JWT encoding/decoding
- Access token: 15 min expiry
- Refresh token: 7 days expiry

### Future
- Add OAuth (Google/GitHub) post-MVP if needed

---

## ADR-010: CV Parsing Strategy

**Status:** Accepted  
**Date:** 2024-12-06

### Decision
Use **hybrid approach**: PyMuPDF for text extraction + LLM for structuring.

### Rationale
- PyMuPDF: Fast, free, no API costs for extraction
- LLM: Better understanding of CV structure and context
- Best of both worlds

### Scope
- PDF only for MVP (no DOCX initially)

---

## ADR-011: PDF Export

**Status:** Accepted  
**Date:** 2024-12-06

### Decision
Use **WeasyPrint** for PDF generation from HTML/CSS templates.

### Rationale
- Good CSS support for styled output
- Pure Python (no external binaries)
- Start with Markdown download, add PDF later in Phase 4
