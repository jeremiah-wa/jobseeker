# Jobseeker - Product Roadmap

## Vision

An AI-enhanced web application that helps job seekers find relevant positions and tailor their CVs to specific job descriptions using LLM technology.

## Core Features

1. **CV Upload & Parsing** - Upload PDF/DOCX, extract structured data
2. **Job Search & Matching** - Search jobs via connectors, AI-powered matching to CV
3. **CV Tailoring** - LLM-powered CV modification to match job descriptions
4. **Job Saving & Tracking** - Save jobs, track application status
5. **Multi-source Connectors** - Plugin system for various job boards

---

## Phase 1: Foundation (MVP)

### Goals
- Basic working application with core functionality
- Single job source (Adzuna API)
- Local Docker deployment

### Tasks
- [ ] Project scaffolding (Python backend, frontend)
- [ ] Docker Compose setup
- [ ] Database schema (PostgreSQL)
- [ ] User authentication (email/password + JWT)
- [ ] CV upload endpoint
- [ ] CV parsing (PDF/DOCX text extraction)
- [ ] Basic UI for upload and viewing

### Deliverables
- Docker-based local deployment
- User registration/login
- CV upload and storage

---

## Phase 2: Job Search & Connectors

### Goals
- Implement connector plugin system
- First connector: Adzuna (Melbourne, AU focus)
- Job search functionality

### Tasks
- [ ] Define connector interface/protocol
- [ ] Implement Adzuna connector
- [ ] Job search API endpoints
- [ ] Job results caching
- [ ] Search UI with filters
- [ ] Job detail view

### Deliverables
- Working job search
- Configurable connector system
- Melbourne/Australia job results

---

## Phase 3: AI Matching

### Goals
- LLM integration via LangChain
- CV analysis and skill extraction
- Job-CV matching scores

### Tasks
- [ ] LangChain + Anthropic setup
- [ ] CV analysis prompts (extract skills, experience, preferences)
- [ ] Job matching algorithm
- [ ] Match score display
- [ ] Search query generation from CV

### Deliverables
- AI-powered job matching
- Match explanations
- Skill extraction from CV

---

## Phase 4: CV Tailoring

### Goals
- Generate tailored CV versions for specific jobs
- Preview and edit capabilities
- Export to PDF/DOCX

### Tasks
- [ ] CV tailoring prompts
- [ ] Diff view (original vs tailored)
- [ ] Version management (multiple tailored CVs)
- [ ] PDF/DOCX export
- [ ] Edit/refine tailored CV

### Deliverables
- One-click CV tailoring
- Multiple CV versions per job
- Export functionality

---

## Phase 5: Application Management

### Goals
- Save and organize jobs
- Track application status
- Notes and reminders

### Tasks
- [ ] Saved jobs functionality
- [ ] Application status pipeline
- [ ] Notes per job
- [ ] Dashboard overview
- [ ] Basic analytics (applications sent, response rate)

### Deliverables
- Job saving and organization
- Application tracking board
- User dashboard

---

## Phase 6: Scale & Polish

### Goals
- Additional job connectors
- Performance optimization
- Prepare for monetization

### Tasks
- [ ] Add Indeed, Jooble, RemoteOK connectors
- [ ] Email notifications for new matches
- [ ] Mobile-responsive UI
- [ ] Analytics/telemetry infrastructure
- [ ] Rate limiting and quotas (monetization prep)
- [ ] Ad placement infrastructure (optional)

### Deliverables
- Multi-source job search
- Production-ready application
- Monetization-ready architecture

---

## Future Considerations

- **Global expansion** - Multi-region support, localization
- **Premium features** - Unlimited tailoring, priority matching
- **Browser extension** - Apply directly from job sites
- **API access** - B2B offerings
- **Interview prep** - AI-powered interview coaching
