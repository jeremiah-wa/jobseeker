# LLM Cost Analysis & Infrastructure Investigation
## Jobseeker MVP - December 2024

---

## Executive Summary

**Key Finding:** Using Groq's free/paid API is **10-30x cheaper** than self-hosting Ollama for MVP scale (0-5K users).

**Recommendation:** Start with Groq API, only consider self-hosting at 50K+ users or for privacy-focused premium tier.

**Estimated Infrastructure Cost:** $0-50/month for MVP (0-1000 users)

---

## Table of Contents

1. [Background & Context](#background--context)
2. [LLM Strategy Options](#llm-strategy-options)
3. [Cost Analysis: Groq vs Self-Hosted](#cost-analysis-groq-vs-self-hosted)
4. [Infrastructure Costs Breakdown](#infrastructure-costs-breakdown)
5. [Competitive Landscape](#competitive-landscape)
6. [Technical Implementation](#technical-implementation)
7. [Recommendations](#recommendations)

---

## Background & Context

### Project Overview

**Jobseeker** is an AI-enhanced web application that helps job seekers:
- Upload and parse CVs using LLM technology
- Search jobs from multiple sources
- Get AI-powered match scores
- Generate tailored CV versions for specific jobs
- Track application progress

### Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js, TypeScript, TailwindCSS, shadcn/ui |
| **Backend** | FastAPI, Python 3.11+ |
| **Database** | PostgreSQL, SQLAlchemy |
| **LLM** | TBD (This investigation) |
| **Deployment** | Docker Compose |

### Investigation Goals

1. Minimize LLM costs for MVP
2. Maintain acceptable performance
3. Enable future scalability
4. Allow model swapping flexibility

---

## LLM Strategy Options

### Option 1: Hybrid Approach (Small + Large Model)

**Concept:** Use small local model for simple tasks, large cloud model for complex tasks.

**Routing Strategy:**
```
Simple Tasks → Small Model (Ollama/Groq)
- FAQ responses
- Data extraction
- Classification
- Initial filtering

Complex Tasks → Large Model (Claude Opus)
- CV tailoring (premium feature)
- Detailed matching explanations
- Creative content generation
```

**Cost Savings:** 30-40% reduction by handling commodity tasks locally/cheaply.

### Option 2: Cloud API Only

**Concept:** Use cloud LLM APIs exclusively (Groq, Anthropic, OpenAI, etc.)

**Pros:**
- Zero infrastructure overhead
- Instant scalability
- High performance
- No maintenance burden

**Cons:**
- Ongoing API costs
- Vendor lock-in risk
- Rate limiting concerns

### Option 3: Self-Hosted Only

**Concept:** Run Ollama models on own infrastructure.

**Pros:**
- Potential long-term cost savings at scale
- Full data control (privacy marketing angle)
- No rate limits

**Cons:**
- High upfront infrastructure cost
- Maintenance overhead
- Performance challenges without GPU
- Complex scaling

---

## Cost Analysis: Groq vs Self-Hosted

### Usage Assumptions (1000 users/month)

| Task | Tokens/Request | Requests | Total Tokens |
|------|----------------|----------|--------------|
| **CV Parsing** | 2,000 | 1,000 | 2M |
| **Job Matching** | 5,000 | 10,000 | 50M |
| **CV Tailoring** | 3,000 | 2,000 | 6M |
| **Total** | - | 13,000 | **58M tokens/month** |

---

### Groq API Costs

#### Free Tier
- **Limits:** 14,400 requests/day, 30 requests/minute
- **Effective capacity:** ~500 requests/day comfortably
- **Models:** Llama 3.1 8B, Llama 3.1 70B, Mixtral 8x7B
- **Cost:** **$0/month** ✅

#### Paid Tier
- **Pricing:** ~$0.10-0.20 per 1M tokens
- **58M tokens:** $5.80-11.60/month
- **Actual cost:** **$5-15/month** (likely stays in free tier for MVP)

**Performance:**
- Response time: 0.3-1 second
- Reliability: High (managed service)
- Scalability: Infinite

---

### Self-Hosted Ollama Costs

#### Minimum Viable Specs

| Spec | Requirement | Reason |
|------|-------------|--------|
| **RAM** | 8GB+ | Models load into RAM |
| **Storage** | 20GB+ | llama3.1:8b = 4.7GB |
| **CPU** | 4+ cores | Inference without GPU |
| **GPU** | Recommended | 10-50x faster |

#### Cloud Provider Options (CPU-only)

| Provider | Instance | RAM | vCPU | Cost/Month | Speed |
|----------|----------|-----|------|------------|-------|
| **Hetzner** | CX31 | 8GB | 2 | **$10** | 10-15s/response 🐌 |
| **DigitalOcean** | Basic | 8GB | 4 | **$48** | 10s/response 🐌 |
| **AWS EC2** | t3.large | 8GB | 2 | **$60** | 10s/response 🐌 |
| **Fly.io** | 8GB shared | 8GB | 2 | **$40-50** | 10s/response 🐌 |

**Problem:** CPU-only inference is unacceptably slow for production use.

#### Cloud Provider Options (GPU)

| Provider | Instance | GPU | VRAM | Cost/Month | Speed |
|----------|----------|-----|------|------------|-------|
| **Vast.ai** | RTX 3090 | 24GB | - | **$220** | 0.5-2s ⚡ |
| **Runpod** | RTX 4090 | 24GB | - | **$500** | 0.5-1s ⚡ |
| **Lambda** | A10 | 24GB | 30GB | **$430** | 1-2s ⚡ |
| **AWS** | g4dn.xlarge | T4 16GB | 16GB | **$380** | 2-3s ⚡ |

**Performance:** GPU inference is fast but extremely expensive.

#### Serverless GPU Options

| Provider | GPU | Pricing | Notes |
|----------|-----|---------|-------|
| **Modal** | A100 | $1.10/hr active | Auto-scales to zero |
| **Replicate** | A40 | $0.00055/sec | Easy API, good for testing |
| **Banana** | A100 | $0.0005/sec | Cold start issues |

**Estimated cost:** $5-50/month depending on usage, but still more than Groq free tier.

---

### Direct Cost Comparison (1000 users/month)

| Solution | Monthly Cost | Response Time | Maintenance | Scalability |
|----------|--------------|---------------|-------------|-------------|
| **Groq API (Free)** | **$0** | 0.3-1s ⚡ | Zero ✅ | Infinite ✅ |
| **Groq API (Paid)** | **$5-15** | 0.3-1s ⚡ | Zero ✅ | Infinite ✅ |
| **Self-Host CPU** | **$10-60** | 10-15s 🐌 | High ❌ | Poor ❌ |
| **Self-Host GPU** | **$220-500** | 0.5-2s ⚡ | High ❌ | Manual ❌ |
| **Serverless GPU** | **$5-50** | 1-3s ⚡ | Low ⚠️ | Good ✅ |

**Winner:** Groq API by 10-30x cost advantage

---

### Break-Even Analysis

#### Groq vs CPU Self-Hosting (Hetzner)
```
Hetzner cost: $10/month
Groq pricing: $0.15/1M tokens

Break-even: $10 ÷ $0.15 = 66M tokens/month
≈ 1,200 users at current usage
```

#### Groq vs GPU Self-Hosting (Vast.ai)
```
Vast.ai cost: $220/month
Groq pricing: $0.15/1M tokens

Break-even: $220 ÷ $0.15 = 1.47 BILLION tokens/month
≈ 25,000+ active users
```

**Conclusion:** Self-hosting only makes economic sense at massive scale (50K+ users).

---

### Hidden Costs of Self-Hosting

#### Infrastructure Management
- Docker/Kubernetes setup and maintenance
- Monitoring, logging, alerting setup
- Security patches and updates
- Backup and disaster recovery
- **Time investment:** 5-10 hours/month

#### Operational Challenges
- Handling out-of-memory errors
- Model loading time on restarts
- No built-in redundancy
- Manual scaling configuration
- Queue system for concurrent requests

#### Opportunity Cost
- 5-10 hours/month × $50-200/hr = **$250-2000/month** in lost productivity
- Could be spent on feature development or customer acquisition

---

## Infrastructure Costs Breakdown

### Scenario 1: Bare Minimum (Testing, 10-50 users)

| Service | Provider | Spec | Cost |
|---------|----------|------|------|
| **Compute (Backend)** | Fly.io | Free tier | $0 |
| **Compute (Frontend)** | Vercel | Free tier | $0 |
| **Database** | Neon | 500MB free | $0 |
| **LLM API** | Groq | Free tier | $0 |
| **Storage** | Cloudflare R2 | Free tier | $0 |
| **Domain** | Namecheap | .com | $1 |

**Total: $0-1/month** 🎉

---

### Scenario 2: Realistic MVP (100-500 users)

| Service | Provider | Spec | Cost |
|---------|----------|------|------|
| **Compute (Backend)** | Fly.io | 1x shared-cpu-1x | $5-10 |
| **Compute (Frontend)** | Vercel | Free tier | $0 |
| **Database** | Neon Pro | 5GB | $19 |
| **LLM API** | Groq | Free → paid | $0-20 |
| **Storage** | Cloudflare R2 | <1GB | $0-2 |
| **Email** | Resend | Free tier | $0 |
| **Monitoring** | Sentry | Free tier | $0 |
| **Domain** | - | .com | $1 |

**Total: $25-52/month**

---

### Scenario 3: Growing (1,000-5,000 users)

| Service | Provider | Spec | Cost |
|---------|----------|------|------|
| **Compute (Backend)** | Fly.io | 2x shared-cpu-1x | $15-20 |
| **Compute (Frontend)** | Vercel Pro | Pro plan | $20 |
| **Database** | Neon Scale | 20GB | $69 |
| **LLM API** | Groq | Paid tier | $50-100 |
| **Storage** | Cloudflare R2 | 5-10GB | $5-10 |
| **Email** | Resend | Paid | $20 |
| **Monitoring** | Sentry Team | Team plan | $26 |
| **Auth** | Clerk/Supabase | Paid | $0-25 |

**Total: $205-290/month**

---

### Cost Progression Timeline

```
Month 1-2 (Building):           $0-10/month
Month 3 (Soft launch):          $25-50/month
Month 4-6 (Growing to 500):     $50-150/month
Month 7-12 (1K+ users):         $150-300/month
Year 2 (5K+ users):             $300-600/month
```

---

### Additional Costs to Consider

#### Marketing & Acquisition
- Domain + email setup: $15/month
- Product Hunt promotion: $0-100 one-time
- Google Ads testing: $100-500/month
- Content creation tools: $0-50/month
- SEO tools (Ahrefs/SEMrush): $99-199/month

#### Development Tools
- GitHub Copilot: $10/month
- Deployment tools: $0-20/month
- Testing services: $0-50/month

#### Premium Features (Post-MVP)
- Claude API (CV tailoring): +$50-200/month
- Premium job APIs (Adzuna, Jooble): $50-200/month
- Advanced email (Sendgrid): $20-50/month
- Analytics (Mixpanel): $0-89/month

---

## Competitive Landscape

### Direct Competitors

#### AI CV Tailoring Services

| Competitor | Features | Pricing | Strengths |
|------------|----------|---------|-----------|
| **Teal** | CV customization, job tracking, Chrome extension | Free + $29/mo premium | Strong brand, comprehensive |
| **Rezi** | AI writer, ATS optimization | $29/month | ATS focus |
| **Resume Worded** | AI feedback, tailoring | $19-49/month | LinkedIn integration |
| **Kickresume** | Templates, AI writer | $19/month | Design quality |
| **Enhancv** | AI writer, modern design | $24.99/month | Visual appeal |

#### Job Aggregation + Matching

| Competitor | Features | Market Position |
|------------|----------|-----------------|
| **LinkedIn** | Jobs, networking, AI features | Dominant (800M users) |
| **Indeed** | Massive database, resume upload | Market leader |
| **ZipRecruiter** | AI matching, one-click apply | Strong #3 |
| **Wellfound** | Startup jobs, equity info | Niche leader |

#### All-in-One Platforms

| Competitor | Features | Threat Level |
|------------|----------|--------------|
| **Teal** | CV tailoring + job tracking + AI | **HIGH** - Does almost everything we plan |
| **Huntr** | Job board view + AI + tracking | HIGH - Similar feature set |
| **JobScan** | ATS optimization + tailoring | MEDIUM - More specialized |

---

### Market Challenges

#### Why This Market is Hard

❌ **Network Effects**
- LinkedIn/Indeed have jobs AND candidates
- Winner-take-all dynamics
- Hard to compete without critical mass

❌ **High Customer Acquisition Cost**
- Job seekers are price-sensitive
- Many unemployed (limited budget)
- Competitive advertising market

❌ **High Churn Rate**
- Users leave after finding job (2-3 months)
- Need constant new user acquisition
- Lifetime value vs CAC unfavorable

❌ **Feature Commoditization**
- AI CV tailoring becoming table stakes
- Hard to differentiate on features alone
- Competitors rapidly copy innovations

❌ **Data Moat Challenges**
- Hard to build without existing job data
- Aggregating jobs = scraping legal issues
- Premium job APIs are expensive

---

### Potential Differentiation Strategies

#### 1. Hyper-Niche Focus

**Instead of:** "Job seekers" (everyone)

**Target:**
- Tech workers laid off from FAANG
- Career switchers (industry changes)
- International job seekers (cross-border)
- Remote-only positions
- Senior engineers → FAANG

**Benefits:** Smaller TAM but less competition, higher willingness to pay

#### 2. Privacy-First Positioning

**Marketing angle:**
- "Your data never leaves your control"
- Self-hosted option available
- No selling data to recruiters
- Local LLM processing option
- EU/GDPR compliant by design

**Appeals to:** Privacy-conscious tech workers, EU market

#### 3. Execution Speed

**Competitive advantage through speed:**
1. Upload CV (drag-drop)
2. See matched jobs instantly
3. One-click tailor CV
4. Download and apply

**Goal:** Complete flow in <60 seconds

#### 4. Quality Over Quantity

**Don't aggregate millions of jobs. Curate the best:**
- Verified companies only (no scams)
- Salary transparency required
- Company culture info included
- Interview process transparency
- "Hacker News Jobs" vibe but with AI

---

### Business Model Reality Check

#### Typical Pricing Model

**Free Tier** (to get users):
- CV upload + parsing
- Basic job search
- 3 tailored CVs/month
- View match scores

**Paid Tier** ($15-30/month):
- Unlimited CV tailoring
- Advanced matching algorithms
- Application tracking
- Interview prep materials
- Priority support

#### Revenue Challenges

**Problem:** Users pay for 1-2 months, then cancel

**To hit $10K MRR:**
- Need 333-667 paying users at $15-30/month
- With 10% conversion: 3,330-6,670 total users
- With 50% monthly churn: Need 150-300 new users/month

**Customer Acquisition:**
- CAC (paid ads): $20-50 per user
- Monthly ad spend: $3,000-15,000
- Before profitability: $30K-150K investment

#### Alternative: B2B Pivot

**Sell to recruitment agencies:**
- "White-label AI CV matching for your clients"
- Price point: $200-500/month per agency
- Lower churn (annual contracts)
- Fewer customers needed ($10K MRR = 20-50 agencies)

---

## Technical Implementation

### LangChain Abstraction for Model Swapping

#### Service Architecture

```python
# backend/app/services/llm_service.py
from langchain_groq import ChatGroq
from langchain_anthropic import ChatAnthropic
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from pydantic import BaseModel, Field
from typing import Literal
import os

class CVData(BaseModel):
    """Structured CV data schema"""
    name: str = Field(description="Full name")
    email: str = Field(description="Email address")
    phone: str | None = Field(description="Phone number")
    skills: list[str] = Field(description="List of skills")
    experience: list[dict] = Field(description="Work experience")
    education: list[dict] = Field(description="Education history")

class JobMatch(BaseModel):
    """Job matching result schema"""
    score: int = Field(description="Match score 0-100")
    reasoning: str = Field(description="Why this score")
    key_matches: list[str] = Field(description="Matching qualifications")
    gaps: list[str] = Field(description="Missing qualifications")

class LLMService:
    def __init__(self):
        self.models = self._init_models()

    def _init_models(self) -> dict:
        """Initialize models based on available API keys"""
        models = {}

        # Groq (free/cheap tier)
        if os.getenv("GROQ_API_KEY"):
            models["groq_fast"] = ChatGroq(
                model="llama-3.1-8b-instant",
                temperature=0,
                api_key=os.getenv("GROQ_API_KEY")
            )
            models["groq_quality"] = ChatGroq(
                model="llama-3.1-70b-versatile",
                temperature=0.3,
                api_key=os.getenv("GROQ_API_KEY")
            )

        # Claude (premium)
        if os.getenv("ANTHROPIC_API_KEY"):
            models["claude_sonnet"] = ChatAnthropic(
                model="claude-sonnet-4-20250514",
                temperature=0.3,
                api_key=os.getenv("ANTHROPIC_API_KEY")
            )
            models["claude_opus"] = ChatAnthropic(
                model="claude-opus-4-20250514",
                temperature=0.3,
                api_key=os.getenv("ANTHROPIC_API_KEY")
            )

        return models

    def _get_model(self, task: Literal["parse", "match", "tailor"]):
        """Route to appropriate model based on task"""
        if task == "parse":
            return self.models.get("groq_fast") or self.models.get("claude_sonnet")
        elif task == "match":
            return self.models.get("groq_quality") or self.models.get("claude_sonnet")
        elif task == "tailor":
            # Premium feature - use best available
            return (
                self.models.get("claude_opus") or
                self.models.get("claude_sonnet") or
                self.models.get("groq_quality")
            )

    async def parse_cv(self, cv_text: str) -> CVData:
        """Extract structured data from CV"""
        model = self._get_model("parse")
        parser = JsonOutputParser(pydantic_object=CVData)

        prompt = ChatPromptTemplate.from_messages([
            ("system",
             "You are a CV parsing expert. Extract structured information.\n"
             "{format_instructions}"),
            ("user", "{cv_text}")
        ])

        chain = prompt | model | parser

        result = await chain.ainvoke({
            "cv_text": cv_text,
            "format_instructions": parser.get_format_instructions()
        })

        return CVData(**result)

    async def match_job(self, cv_data: dict, job_data: dict) -> JobMatch:
        """Score how well a job matches the CV"""
        model = self._get_model("match")
        parser = JsonOutputParser(pydantic_object=JobMatch)

        prompt = ChatPromptTemplate.from_messages([
            ("system",
             "You are a job matching expert. Score candidate fit.\n"
             "{format_instructions}"),
            ("user",
             "Candidate:\n{cv}\n\nJob:\n{job}\n\n"
             "Provide match score (0-100) with reasoning.")
        ])

        chain = prompt | model | parser

        result = await chain.ainvoke({
            "cv": cv_data,
            "job": job_data,
            "format_instructions": parser.get_format_instructions()
        })

        return JobMatch(**result)

    async def tailor_cv(self, cv_data: dict, job_data: dict) -> str:
        """Generate tailored CV for specific job"""
        model = self._get_model("tailor")

        prompt = ChatPromptTemplate.from_messages([
            ("system",
             "You are a professional CV writer. Tailor CVs to highlight "
             "relevant experience for specific jobs. Maintain honesty."),
            ("user",
             "Original CV:\n{cv}\n\nJob:\n{job}\n\n"
             "Create tailored version emphasizing relevant skills. "
             "Return as markdown.")
        ])

        chain = prompt | model

        result = await chain.ainvoke({
            "cv": cv_data,
            "job": job_data
        })

        return result.content
```

---

### Configuration-Based Model Selection

```python
# backend/app/config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Database
    database_url: str

    # LLM API Keys
    groq_api_key: str | None = None
    anthropic_api_key: str | None = None

    # Model Selection (easy to change!)
    llm_parser_model: str = "groq_fast"
    llm_matcher_model: str = "groq_quality"
    llm_tailor_model: str = "groq_quality"

    class Config:
        env_file = ".env"

settings = Settings()
```

---

### Environment Configuration Examples

#### MVP - All Groq (Free)
```bash
GROQ_API_KEY=gsk_...
LLM_PARSER_MODEL=groq_fast
LLM_MATCHER_MODEL=groq_quality
LLM_TAILOR_MODEL=groq_quality
```

#### Hybrid - Groq + Claude Premium
```bash
GROQ_API_KEY=gsk_...
ANTHROPIC_API_KEY=sk-ant-...
LLM_PARSER_MODEL=groq_fast        # Still free
LLM_MATCHER_MODEL=groq_quality    # Still free
LLM_TAILOR_MODEL=claude_opus      # Premium feature
```

#### All Premium
```bash
ANTHROPIC_API_KEY=sk-ant-...
LLM_PARSER_MODEL=claude_sonnet
LLM_MATCHER_MODEL=claude_sonnet
LLM_TAILOR_MODEL=claude_opus
```

---

### FastAPI Integration

```python
# backend/app/routers/cv.py
from fastapi import APIRouter, UploadFile, Depends
from app.services.llm_service import LLMService

router = APIRouter()

def get_llm_service():
    return LLMService()

@router.post("/cv/parse")
async def parse_cv(
    file: UploadFile,
    llm_service: LLMService = Depends(get_llm_service)
):
    """Parse uploaded CV"""
    cv_text = extract_text_from_pdf(file)
    cv_data = await llm_service.parse_cv(cv_text)
    return cv_data

@router.post("/jobs/match")
async def match_jobs(
    cv_id: int,
    job_ids: list[int],
    llm_service: LLMService = Depends(get_llm_service)
):
    """Match CV against jobs"""
    cv_data = get_cv(cv_id)
    jobs = get_jobs(job_ids)

    matches = []
    for job in jobs:
        match = await llm_service.match_job(cv_data, job)
        matches.append(match)

    return matches

@router.post("/cv/tailor")
async def tailor_cv(
    cv_id: int,
    job_id: int,
    llm_service: LLMService = Depends(get_llm_service)
):
    """Generate tailored CV"""
    cv_data = get_cv(cv_id)
    job_data = get_job(job_id)

    tailored_cv = await llm_service.tailor_cv(cv_data, job_data)
    return {"tailored_cv": tailored_cv}
```

---

### Docker Compose Configuration

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: jobseeker
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      DATABASE_URL: postgresql://user:pass@postgres:5432/jobseeker
      GROQ_API_KEY: ${GROQ_API_KEY}
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY:-}
      LLM_PARSER_MODEL: ${LLM_PARSER_MODEL:-groq_fast}
      LLM_MATCHER_MODEL: ${LLM_MATCHER_MODEL:-groq_quality}
      LLM_TAILOR_MODEL: ${LLM_TAILOR_MODEL:-groq_quality}
    depends_on:
      - postgres
    volumes:
      - ./backend:/app

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:8000
    depends_on:
      - backend
    volumes:
      - ./frontend:/app
      - /app/node_modules

volumes:
  postgres_data:
```

---

### Dependencies

```txt
# backend/requirements.txt
fastapi==0.109.0
uvicorn[standard]==0.27.0
sqlalchemy==2.0.25
pydantic==2.5.3
pydantic-settings==2.1.0
python-multipart==0.0.6
pypdf2==3.0.1

# LangChain
langchain==0.1.0
langchain-core==0.1.10
langchain-groq==0.0.1
langchain-anthropic==0.1.1

# LLM Providers
groq==0.4.1
anthropic==0.18.0
```

---

## Recommendations

### Phase 1: MVP (Month 1-3)

**Goal:** Validate product-market fit with minimal cost

**Infrastructure:**
```
Frontend: Vercel (free)
Backend: Fly.io ($5-10/mo)
Database: Neon free tier
LLM: Groq free tier
Storage: Cloudflare R2 (free)

Total: $5-10/month
```

**Strategy:**
- Use Groq for ALL LLM tasks
- Stay within free tier limits (14.4K requests/day)
- Focus on 50-200 beta users
- Collect feedback on which features matter most

**Success Metrics:**
- 20%+ weekly active usage
- 10%+ users complete full workflow (upload → match → tailor)
- Qualitative feedback shows clear value

---

### Phase 2: Beta Launch (Month 4-6)

**Goal:** Grow to 500-1000 users, validate pricing

**Infrastructure:**
```
Frontend: Vercel (free)
Backend: Fly.io ($10-20/mo)
Database: Neon Pro - 5GB ($19/mo)
LLM: Groq paid tier ($10-30/mo)
Storage: Cloudflare R2 ($2-5/mo)

Total: $40-75/month
```

**Strategy:**
- Keep using Groq for most tasks
- A/B test pricing ($15 vs $25/month)
- Add premium features (more tailoring credits)
- Product Hunt / Hacker News launch

**Success Metrics:**
- 1000+ total users
- 5%+ conversion to paid
- $500+ MRR
- <$50 CAC

---

### Phase 3: Optimization (Month 7-12)

**Goal:** Optimize unit economics, reach $3-5K MRR

**Infrastructure:**
```
Frontend: Vercel Pro ($20/mo)
Backend: Fly.io scaled ($20-40/mo)
Database: Neon Scale - 20GB ($69/mo)
LLM: Hybrid (Groq + Claude) ($100-200/mo)
Storage: Cloudflare R2 ($5-10/mo)
Other: Email, monitoring ($50/mo)

Total: $250-400/month
```

**Strategy:**
- Use Groq for parsing/matching (free/cheap)
- Use Claude Opus for CV tailoring (premium feature)
- Introduce tiered pricing:
  - Free: 3 tailored CVs
  - Basic ($15/mo): 20 tailored CVs
  - Pro ($30/mo): Unlimited + priority support

**Success Metrics:**
- 3,000-5,000 total users
- 10%+ conversion to paid
- $3-5K MRR
- Positive unit economics (LTV > 3x CAC)

---

### Decision Points

#### When to Add Claude API

**Trigger:** When users explicitly complain about CV tailoring quality

**Test:** Run A/B test comparing Groq vs Claude for tailoring
- Measure user satisfaction
- Measure conversion impact
- Calculate ROI (does better quality → more conversions?)

**If positive:** Gradually migrate tailoring to Claude

---

#### When to Self-Host

**Trigger:** When spending $500+/month on LLM APIs

**Prerequisites:**
- Have paying customers funding it
- Have DevOps capacity
- Have validated product-market fit

**Consideration:** May never make sense. Groq is cheap enough that self-hosting overhead outweighs savings until massive scale (50K+ users).

---

#### Privacy Tier Alternative

**If privacy is a differentiator:**

Offer premium "Privacy Tier":
- **Standard ($20/mo):** Groq API (shared infrastructure)
- **Privacy ($49/mo):** Dedicated self-hosted Ollama instance
  - Your data never touches third-party APIs
  - Marketed as premium privacy feature
  - Covers GPU costs + margin

This makes self-hosting a feature, not a cost center.

---

### Key Principles

1. **Start Free, Scale Smart**
   - Use free tiers to validate
   - Only pay when necessary
   - Scale infrastructure AFTER revenue

2. **Optimize for Learning**
   - Build MVP fast (4-6 weeks)
   - Launch quickly
   - Iterate based on real usage

3. **Don't Over-Engineer**
   - Simple stack is maintainable stack
   - Avoid premature optimization
   - Add complexity only when needed

4. **Focus on Unit Economics**
   - LTV must be > 3x CAC
   - Monitor churn closely
   - Optimize conversion funnel

5. **Be Ready to Pivot**
   - Market is competitive
   - Stay flexible on positioning
   - Listen to user feedback

---

## Appendix

### Useful Resources

#### LLM Providers
- Groq: https://console.groq.com
- Anthropic Claude: https://console.anthropic.com
- Together.ai: https://together.ai
- OpenRouter: https://openrouter.ai

#### Infrastructure
- Fly.io: https://fly.io
- Vercel: https://vercel.com
- Neon (Postgres): https://neon.tech
- Cloudflare R2: https://cloudflare.com/r2

#### Tools
- LangChain: https://langchain.com
- FastAPI: https://fastapi.tiangolo.com
- Next.js: https://nextjs.org

---

### Contact & Updates

**Project:** Jobseeker MVP
**Author:** Jeremiah
**Date:** December 6, 2024
**Version:** 1.0

**Status:** Investigation complete - Ready for implementation

---

## Conclusion

**Final Recommendation:** Start with Groq API for MVP

**Rationale:**
1. ✅ **Cost:** $0-15/month vs $220-500/month self-hosting
2. ✅ **Speed:** 0.3-1s responses (production-ready)
3. ✅ **Maintenance:** Zero infrastructure overhead
4. ✅ **Scalability:** Handles growth automatically
5. ✅ **Flexibility:** Easy to swap models via LangChain

**Next Steps:**
1. Sign up for Groq API (free)
2. Implement LangChain abstraction layer
3. Build MVP using Groq for all LLM tasks
4. Monitor usage and costs
5. Upgrade strategically based on real data

**Expected Infrastructure Cost:** $25-75/month for MVP (0-1000 users)
