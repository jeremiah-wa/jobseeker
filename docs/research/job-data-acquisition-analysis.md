# Job Data Acquisition Analysis
## Melbourne, Australia Focus - December 2024

---

## Executive Summary

**Key Finding:** Multiple viable job API options exist for Melbourne/Australia, with **Adzuna** being the most cost-effective starting point.

**Recommendation:** Start with Adzuna API (free tier), supplement with Jooble as backup, consider SEEK partnership for premium tier.

**Estimated Cost:** $0-50/month for MVP (0-1000 users)

---

## Table of Contents

1. [Background & Requirements](#background--requirements)
2. [API Options Overview](#api-options-overview)
3. [Detailed API Analysis](#detailed-api-analysis)
4. [Cost Comparison](#cost-comparison)
5. [Technical Implementation](#technical-implementation)
6. [Recommendations](#recommendations)

---

## Background & Requirements

### Target Market

**Primary:** Melbourne, Australia job seekers
**Secondary:** Remote jobs accessible to Australian residents
**Tertiary:** Other Australian cities (Sydney, Brisbane, Perth)

### Data Requirements

| Requirement | Priority | Notes |
|-------------|----------|-------|
| **Job Title** | Critical | For matching and display |
| **Company Name** | Critical | Trust and filtering |
| **Location** | Critical | Melbourne focus |
| **Description** | Critical | For LLM matching |
| **Salary** | High | User decision factor |
| **Job Type** | High | Full-time/part-time/contract |
| **Remote Option** | High | Growing demand |
| **Application URL** | Critical | Conversion point |
| **Posted Date** | Medium | Freshness indicator |
| **Skills/Tags** | Medium | Better matching |

### Volume Estimates (1000 users)

| Activity | Requests/User/Month | Total Requests |
|----------|---------------------|----------------|
| **Initial Search** | 10 | 10,000 |
| **Filtered Search** | 20 | 20,000 |
| **Job Detail View** | 30 | 30,000 |
| **Match Scoring** | 10 | 10,000 |
| **Total** | 70 | **70,000/month** |

---

## API Options Overview

### Quick Comparison Matrix

| API | Australia Coverage | Cost | Rate Limits | Ease of Use | Verdict |
|-----|-------------------|------|-------------|-------------|---------|
| **Adzuna** | ✅ Excellent | Free → $50/mo | 250/day free | ⭐⭐⭐⭐⭐ | **Best for MVP** |
| **SEEK** | ✅ Best (Market Leader) | Partner only | Unknown | ⭐⭐⭐ | Premium tier |
| **Jooble** | ✅ Good | Free | Unknown | ⭐⭐⭐⭐ | Good backup |
| **Careerjet** | ✅ Good | Free | Limited | ⭐⭐⭐ | Supplement |
| **Arbeitnow** | ❌ Europe only | Free | Reasonable | ⭐⭐ | Not suitable |
| **Remotive** | ⚠️ Remote only | Free | 4/day max | ⭐⭐⭐ | Remote supplement |
| **Indeed** | ✅ Excellent | ❌ Closed | N/A | ❌ | Not available |
| **LinkedIn** | ✅ Excellent | $$$ Enterprise | Strict | ⭐⭐ | Too expensive |

---

## Detailed API Analysis

### 1. Adzuna API ⭐ RECOMMENDED

**Website:** https://developer.adzuna.com/

#### Coverage
- ✅ Australia-specific endpoint: `api.adzuna.com/v1/api/jobs/au/search`
- ✅ Melbourne location filtering
- ✅ Aggregates from multiple sources
- ✅ 100K+ Australian jobs

#### Pricing

**Free Tier:**
- 25 requests/minute
- 250 requests/day
- 1,000 requests/week
- 2,500 requests/month

**Paid Tier:**
- Contact for custom limits
- Estimated: $50-200/month for 10K-50K requests
- Millions of requests/day available for large partners

#### Rate Limit Analysis

```
MVP (100 users):
- 7,000 requests/month
- ~230 requests/day
- ✅ Stays within free tier

Growing (500 users):
- 35,000 requests/month
- ~1,150 requests/day
- ❌ Exceeds free tier
- Need paid plan: ~$50-100/month

Scale (1000 users):
- 70,000 requests/month
- ~2,300 requests/day
- Need custom pricing: ~$100-200/month
```

#### Features

✅ **Search Parameters:**
- Keywords
- Location (city, region, country)
- Radius (km)
- Salary range
- Job type (full-time, part-time, contract)
- Category filtering
- Sort by relevance/date/salary

✅ **Response Data:**
```json
{
  "results": [
    {
      "id": "12345",
      "title": "Senior Software Engineer",
      "company": {
        "display_name": "Tech Company"
      },
      "location": {
        "display_name": "Melbourne VIC",
        "area": ["Australia", "Victoria", "Melbourne"]
      },
      "description": "Full job description...",
      "salary_min": 120000,
      "salary_max": 150000,
      "salary_is_predicted": false,
      "contract_type": "permanent",
      "category": {
        "label": "IT Jobs"
      },
      "created": "2024-12-01T10:30:00Z",
      "redirect_url": "https://..."
    }
  ],
  "count": 1234
}
```

✅ **Additional Endpoints:**
- Salary histogram (salary distribution data)
- Historical salary data (trends over time)
- Top companies (hiring volume)
- Regional data (jobs by location)

#### Requirements

**Attribution:**
- Must display "Jobs by Adzuna" logo (116x23px minimum)
- Link back to Adzuna
- Logo images: https://www.adzuna.co.uk/press.html

**Trial Period:**
- 14 days for commercial validation
- After trial: License agreement required for commercial use
- Contact for commercial licensing

#### Pros
- ✅ Excellent Australian coverage
- ✅ Free tier sufficient for MVP
- ✅ Rich data (salary, company, location)
- ✅ Well-documented API
- ✅ Salary prediction data (unique feature)
- ✅ RESTful, JSON responses
- ✅ Multiple filtering options

#### Cons
- ⚠️ Attribution requirements (logo display)
- ⚠️ Commercial license needed after trial
- ⚠️ Rate limits on free tier
- ⚠️ Need to contact for paid pricing

---

### 2. SEEK API

**Website:** https://developer.seek.com/

#### Coverage
- ✅ **Market leader** in Australia/NZ
- ✅ Largest job database in Australia
- ✅ Premium employers
- ✅ High-quality listings

#### Access Model

**Partner Program Only:**
- Must apply via Integration Request form
- Requires business relationship
- Not self-service signup
- Approval process required

#### Use Cases Supported
1. **Job Posting** - Post jobs to SEEK (employer side)
2. **Optimised Apply** - Export applications (employer side)
3. **Apply with SEEK** - Pre-fill forms with SEEK profile
4. **Ad Performance** - Analytics for job ads

#### API Type
- GraphQL-based API
- Modern, flexible querying
- Well-documented schema

#### Pricing
- Not publicly disclosed
- Partner/enterprise pricing
- Likely $200-1000+/month minimum

#### Pros
- ✅ Best Australian job coverage
- ✅ Premium brand recognition
- ✅ High-quality employers
- ✅ Modern GraphQL API
- ✅ Trusted by job seekers

#### Cons
- ❌ No self-service access
- ❌ Requires partnership approval
- ❌ Likely expensive
- ❌ Primarily employer-focused (job posting)
- ⚠️ May not allow job aggregation for competing platforms

#### Recommendation
**Not suitable for MVP** - Consider for premium tier or B2B partnerships once product-market fit is proven.

---

### 3. Jooble API

**Website:** https://jooble.org/api/about

#### Coverage
- ✅ Australia supported
- ✅ Global job aggregator
- ✅ Aggregates from multiple sources

#### Pricing
- **Free** with API key
- No disclosed rate limits
- Simple registration process

#### API Details

**Endpoint:**
```
POST https://jooble.org/api/{api_key}
```

**Request:**
```json
{
  "keywords": "Software Engineer",
  "location": "Melbourne",
  "radius": "80",
  "salary": 100000,
  "page": 1,
  "ResultOnPage": 20,
  "companysearch": false
}
```

**Response:**
```json
{
  "totalCount": 1234,
  "jobs": [
    {
      "title": "Software Engineer",
      "location": "Melbourne VIC",
      "snippet": "Job description...",
      "salary": "$100,000 - $120,000",
      "source": "jooble",
      "type": "Full-time",
      "link": "https://...",
      "company": "Tech Corp",
      "updated": "2024-12-01T10:30:00",
      "id": 12345
    }
  ]
}
```

#### Features
- ✅ Keyword search
- ✅ Location filtering
- ✅ Radius search (0, 4, 8, 16, 26, 40, 80 km)
- ✅ Salary filtering
- ✅ Company name search
- ✅ Pagination support

#### Pros
- ✅ Free to use
- ✅ Simple REST API
- ✅ Good documentation
- ✅ Australia coverage
- ✅ Easy registration

#### Cons
- ⚠️ Less detailed than Adzuna
- ⚠️ Unknown rate limits
- ⚠️ Salary data less reliable
- ⚠️ Smaller database than Adzuna

---

### 4. Careerjet API

**Website:** https://www.careerjet.com.au/partners/api/

#### Coverage
- ✅ Australia supported (careerjet.com.au)
- ✅ Global job search engine
- ✅ Aggregates from multiple sources

#### Pricing
- **Free** for basic use
- Rate limited (unspecified)
- Can request limit increase for high-volume

#### API Type
- REST API
- JSON/XML responses
- Requires API key

#### Features
- ✅ Location-based search
- ✅ Keyword filtering
- ✅ Job type filtering
- ✅ Pagination

#### Pros
- ✅ Free to use
- ✅ Australia-specific domain
- ✅ Simple integration

#### Cons
- ⚠️ Limited documentation
- ⚠️ Rate limits unclear
- ⚠️ Less features than Adzuna
- ⚠️ Smaller Australian database

---

### 5. Arbeitnow API ⭐ REMOTE JOBS

**Website:** https://www.arbeitnow.com/api/job-board-api

#### Coverage
- ⚠️ **Europe + Remote jobs only**
- ✅ Excellent for remote positions
- ✅ Direct from ATS systems (Greenhouse, SmartRecruiters, etc.)

#### Pricing
- **100% Free**
- No API key required
- No rate limits disclosed
- Open API

#### API Details

**Endpoint:**
```
GET https://www.arbeitnow.com/api/job-board-api
```

**Parameters:**
- `page` - Pagination
- `remote` - Filter remote jobs (true/false)
- `visa_sponsorship` - Filter visa sponsorship (true/false)

**Response:**
```json
{
  "data": [
    {
      "slug": "job-slug",
      "company_name": "Company",
      "title": "Senior Developer",
      "description": "Full description...",
      "remote": true,
      "url": "https://...",
      "tags": ["python", "remote"],
      "job_types": ["full_time"],
      "location": "Remote",
      "created_at": 1234567890
    }
  ]
}
```

#### Data Sources
- Greenhouse
- SmartRecruiters
- Join.com
- Team Tailor
- Recruitee
- Comeet

#### Pros
- ✅ Completely free
- ✅ No API key needed
- ✅ Direct from ATS (accurate data)
- ✅ Remote job focus
- ✅ Visa sponsorship filter
- ✅ Clean, consistent format

#### Cons
- ❌ No Melbourne-specific jobs
- ❌ Europe-focused
- ⚠️ Limited to remote positions
- ⚠️ Smaller database

#### Use Case
**NOT RECOMMENDED for Australian focus.** Europe-based jobs only. Remote positions may occasionally be open to Australians, but this is not a reliable source for Australian job seekers. Consider only if specifically targeting European remote opportunities.

---

### 6. Remotive API

**Website:** https://github.com/remotive-com/remote-jobs-api

#### Coverage
- ⚠️ **Remote jobs only**
- ✅ High-quality remote positions
- ✅ Global remote opportunities

#### Pricing
- **Free** for public API
- Paid private API available
- Contact for commercial use

#### Rate Limits
- **Maximum 4 requests per day**
- 24-hour delay on job postings
- Max 2 requests per minute (blocked if exceeded)

#### API Details

**Endpoint:**
```
GET https://remotive.com/api/remote-jobs
```

**Parameters:**
- `category` - Filter by category (software-dev, etc.)
- `company_name` - Filter by company
- `search` - Keyword search
- `limit` - Results per page

**Response:**
```json
{
  "job-count": 100,
  "jobs": [
    {
      "id": 123,
      "url": "https://remotive.com/remote-jobs/...",
      "title": "Lead Developer",
      "company_name": "Company",
      "company_logo": "https://...",
      "category": "Software Development",
      "job_type": "full_time",
      "publication_date": "2024-12-01T10:23:26",
      "candidate_required_location": "Worldwide",
      "salary": "$100,000 - $150,000",
      "description": "Full HTML description..."
    }
  ]
}
```

#### Requirements
- Must link back to Remotive
- Must mention Remotive as source
- Cannot submit to third-party sites (Jooble, Google Jobs, LinkedIn)
- 24-hour delay on job display

#### Pros
- ✅ High-quality remote jobs
- ✅ Free to use
- ✅ Good documentation
- ✅ Salary data included
- ✅ Company logos

#### Cons
- ❌ **Only 4 requests per day** (severe limitation)
- ❌ Remote only (no Melbourne local jobs)
- ⚠️ 24-hour delay
- ⚠️ Strict attribution requirements
- ⚠️ Cannot use for email collection

#### Use Case
**Very limited use** - Only suitable for daily batch job updates, not real-time search. Better for newsletter/email digest than live search.

---

### 7. Indeed API ❌ NOT AVAILABLE

**Status:** Closed to new partners

#### Background
- Previously had public API
- Shut down to new applications
- Requires "published account" (no longer issued)
- May reopen in future

#### Alternative
- Indeed has Partner Program for ATS/recruitment software
- Requires business relationship
- Not suitable for job aggregation platforms

#### Verdict
**Not an option** for MVP or foreseeable future.

---

### 8. LinkedIn Jobs API ❌ TOO EXPENSIVE

**Website:** https://developer.linkedin.com/

#### Access Model
- Enterprise partnership required
- Part of LinkedIn Talent Solutions
- Requires LinkedIn Recruiter license
- Not self-service

#### Pricing
- LinkedIn Recruiter: $8,000-10,000/year per seat
- API access: Additional enterprise pricing
- Total: $10,000-50,000+/year

#### Verdict
**Not viable** for MVP or small-scale operation. Only consider for enterprise B2B pivot.

---

## Cost Comparison

### Scenario 1: MVP (100 users, 7K requests/month)

| API | Monthly Cost | Coverage | Verdict |
|-----|--------------|----------|---------|
| **Adzuna** | $0 | Melbourne + Australia | ✅ Primary |
| **Jooble** | $0 | Australia | ✅ Backup |
| **Careerjet** | $0 | Australia | ⚠️ Backup |
| **Remotive** | $0 | Remote (4/day limit) | ⚠️ Newsletter only |
| **Arbeitnow** | $0 | Europe only | ❌ Not suitable |
| **SEEK** | N/A | Not accessible | ❌ |
| **Indeed** | N/A | Not available | ❌ |
| **LinkedIn** | $10K+/year | Not viable | ❌ |

**Total: $0/month** ✅

---

### Scenario 2: Growing (500 users, 35K requests/month)

| API | Monthly Cost | Coverage | Verdict |
|-----|--------------|----------|---------|
| **Adzuna** | $50-100 | Melbourne + Australia | ✅ Primary |
| **Jooble** | $0 | Australia | ✅ Backup |
| **Careerjet** | $0 | Australia | ⚠️ Backup |

**Total: $50-100/month**

---

### Scenario 3: Scale (1000+ users, 70K+ requests/month)

| API | Monthly Cost | Coverage | Verdict |
|-----|--------------|----------|---------|
| **Adzuna** | $100-200 | Melbourne + Australia | ✅ Primary |
| **Jooble** | $0 | Australia | ✅ Backup |
| **SEEK Partnership** | $200-500 | Premium listings | ⚠️ Consider |

**Total: $100-200/month (basic) or $300-700/month (with SEEK)**

---

## Technical Implementation

### Multi-API Strategy

#### Architecture

```python
# backend/app/services/job_service.py
from typing import List, Optional
import httpx
from datetime import datetime
from app.config import settings

class JobAggregator:
    """Aggregate jobs from multiple APIs"""

    def __init__(self):
        self.adzuna = AdzunaClient()
        self.jooble = JoobleClient()
        self.careerjet = CareerjetClient()  # Optional backup

    async def search_jobs(
        self,
        keywords: str,
        location: str = "Melbourne",
        remote: bool = False,
        limit: int = 20
    ) -> List[dict]:
        """Search across multiple APIs and merge results"""

        results = []

        # Primary: Adzuna (Melbourne + Australia)
        adzuna_jobs = await self.adzuna.search(
            keywords=keywords,
            location=location,
            limit=limit
        )
        results.extend(self._normalize_adzuna(adzuna_jobs))

        # Backup: Jooble (if Adzuna returns few results)
        if len(results) < limit // 2:
            jooble_jobs = await self.jooble.search(
                keywords=keywords,
                location=location,
                limit=limit
            )
            results.extend(self._normalize_jooble(jooble_jobs))

        # Deduplicate by title + company
        results = self._deduplicate(results)

        # Sort by relevance/date
        results = sorted(results, key=lambda x: x['posted_date'], reverse=True)

        return results[:limit]

    def _normalize_adzuna(self, jobs: List[dict]) -> List[dict]:
        """Normalize Adzuna response to common format"""
        return [
            {
                'id': f"adzuna_{job['id']}",
                'title': job['title'],
                'company': job['company']['display_name'],
                'location': job['location']['display_name'],
                'description': job['description'],
                'salary_min': job.get('salary_min'),
                'salary_max': job.get('salary_max'),
                'job_type': job.get('contract_type', 'full_time'),
                'remote': 'remote' in job['title'].lower() or
                         'remote' in job['description'].lower(),
                'url': job['redirect_url'],
                'posted_date': job['created'],
                'source': 'adzuna'
            }
            for job in jobs
        ]

    def _normalize_jooble(self, jobs: List[dict]) -> List[dict]:
        """Normalize Jooble response to common format"""
        return [
            {
                'id': f"jooble_{job['id']}",
                'title': job['title'],
                'company': job['company'],
                'location': job['location'],
                'description': job['snippet'],
                'salary_min': None,  # Parse from salary string if needed
                'salary_max': None,
                'job_type': job.get('type', 'full_time'),
                'remote': 'remote' in job['title'].lower() or
                         'remote' in job['snippet'].lower(),
                'url': job['link'],
                'posted_date': job['updated'],
                'source': 'jooble'
            }
            for job in jobs
        ]

    def _deduplicate(self, jobs: List[dict]) -> List[dict]:
        """Remove duplicate jobs based on title + company"""
        seen = set()
        unique = []

        for job in jobs:
            key = f"{job['title'].lower()}_{job['company'].lower()}"
            if key not in seen:
                seen.add(key)
                unique.append(job)

        return unique


class AdzunaClient:
    """Adzuna API client"""

    BASE_URL = "https://api.adzuna.com/v1/api/jobs/au/search"

    def __init__(self):
        self.app_id = settings.adzuna_app_id
        self.app_key = settings.adzuna_app_key

    async def search(
        self,
        keywords: str,
        location: str = "Melbourne",
        limit: int = 20,
        page: int = 1
    ) -> List[dict]:
        """Search Adzuna API"""

        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.BASE_URL}/{page}",
                params={
                    'app_id': self.app_id,
                    'app_key': self.app_key,
                    'what': keywords,
                    'where': location,
                    'results_per_page': limit,
                    'content-type': 'application/json'
                }
            )
            response.raise_for_status()
            data = response.json()
            return data.get('results', [])


class JoobleClient:
    """Jooble API client"""

    BASE_URL = "https://jooble.org/api"

    def __init__(self):
        self.api_key = settings.jooble_api_key

    async def search(
        self,
        keywords: str,
        location: str = "Melbourne",
        limit: int = 20,
        page: int = 1
    ) -> List[dict]:
        """Search Jooble API"""

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.BASE_URL}/{self.api_key}",
                json={
                    'keywords': keywords,
                    'location': location,
                    'page': page,
                    'ResultOnPage': limit
                }
            )
            response.raise_for_status()
            data = response.json()
            return data.get('jobs', [])
```

---

### Configuration

```python
# backend/app/config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Database
    database_url: str

    # Job APIs
    adzuna_app_id: str
    adzuna_app_key: str
    jooble_api_key: str | None = None

    # Feature flags
    enable_jooble_backup: bool = True

    class Config:
        env_file = ".env"

settings = Settings()
```

---

### Environment Variables

```bash
# .env
DATABASE_URL=postgresql://user:pass@localhost:5432/jobseeker

# Adzuna (Primary)
ADZUNA_APP_ID=your_app_id
ADZUNA_APP_KEY=your_app_key

# Jooble (Backup - optional)
JOOBLE_API_KEY=your_api_key

# Feature flags
ENABLE_JOOBLE_BACKUP=true
```

---

### FastAPI Routes

```python
# backend/app/routers/jobs.py
from fastapi import APIRouter, Query, Depends
from app.services.job_service import JobAggregator
from typing import List

router = APIRouter()

def get_job_aggregator():
    return JobAggregator()

@router.get("/jobs/search")
async def search_jobs(
    keywords: str = Query(..., description="Search keywords"),
    location: str = Query("Melbourne", description="Job location"),
    remote: bool = Query(False, description="Include remote jobs"),
    limit: int = Query(20, ge=1, le=100),
    aggregator: JobAggregator = Depends(get_job_aggregator)
):
    """
    Search for jobs across multiple sources

    - **keywords**: Job title, skills, or keywords
    - **location**: City or region (default: Melbourne)
    - **remote**: Include remote positions
    - **limit**: Number of results (max 100)
    """
    jobs = await aggregator.search_jobs(
        keywords=keywords,
        location=location,
        remote=remote,
        limit=limit
    )

    return {
        'count': len(jobs),
        'jobs': jobs
    }

@router.get("/jobs/{job_id}")
async def get_job_details(job_id: str):
    """Get detailed information about a specific job"""
    # Implementation here
    pass
```

---

### Caching Strategy

```python
# backend/app/services/cache_service.py
from redis import Redis
import json
from typing import Optional
from datetime import timedelta

class JobCache:
    """Cache job search results to reduce API calls"""

    def __init__(self):
        self.redis = Redis(
            host='localhost',
            port=6379,
            decode_responses=True
        )
        self.ttl = timedelta(hours=6)  # Cache for 6 hours

    def get(self, cache_key: str) -> Optional[List[dict]]:
        """Get cached results"""
        data = self.redis.get(cache_key)
        if data:
            return json.loads(data)
        return None

    def set(self, cache_key: str, jobs: List[dict]):
        """Cache results"""
        self.redis.setex(
            cache_key,
            self.ttl,
            json.dumps(jobs)
        )

    def make_key(self, keywords: str, location: str, remote: bool) -> str:
        """Generate cache key"""
        return f"jobs:{keywords}:{location}:{remote}"
```

**Benefits:**
- Reduces API calls by 60-80%
- Faster response times
- Stays within rate limits
- Jobs don't change that frequently (6-hour cache is reasonable)

---

## Recommendations

### Phase 1: MVP (Month 1-3)

**Strategy:** Single API, minimal complexity

**Implementation:**
```
Primary: Adzuna (free tier)
Supplement: None
Backup: None

Cost: $0/month
Coverage: Melbourne + Australia
Requests: 250/day (sufficient for 100-200 users)
```

**Pros:**
- ✅ Zero cost
- ✅ Simple implementation
- ✅ Excellent coverage
- ✅ Fast to market

**Cons:**
- ⚠️ Single point of failure
- ⚠️ Rate limit constraints

**Action Items:**
1. Register for Adzuna API
2. Implement AdzunaClient
3. Add caching layer (6-hour TTL)
4. Monitor usage vs rate limits
5. Implement attribution (logo + link)

---

### Phase 2: Beta Launch (Month 4-6)

**Strategy:** Multi-API with backup

**Implementation:**
```
Primary: Adzuna (paid tier if needed)
Backup: Jooble (failover)
Optional: Careerjet (additional coverage)

Cost: $0-50/month
Coverage: Melbourne + Australia
Requests: Sufficient for 500+ users
```

**Pros:**
- ✅ Redundancy/failover
- ✅ Broader coverage
- ✅ Still low cost
- ✅ Multiple data sources

**Action Items:**
1. Register for Jooble API
2. Implement JoobleClient
3. Add job deduplication logic
4. Monitor API reliability
5. Track which API provides better results

---

### Phase 3: Growth (Month 7-12)

**Strategy:** Premium data sources

**Implementation:**
```
Primary: Adzuna (custom pricing)
Backup: Jooble
Premium: SEEK partnership (if approved)
Optional: Careerjet

Cost: $100-300/month
Coverage: Comprehensive Australian market
```

**Pros:**
- ✅ Best-in-class coverage
- ✅ SEEK brand recognition
- ✅ Premium employers
- ✅ Competitive advantage

**Cons:**
- ⚠️ Higher costs
- ⚠️ SEEK partnership may be difficult
- ⚠️ More complex integration

**Action Items:**
1. Apply for SEEK partnership
2. Upgrade Adzuna to custom tier
3. Implement premium tier features
4. Add salary prediction (Adzuna data)
5. Company insights (Adzuna top companies)

---

### Alternative: Scraping (Not Recommended)

**Concept:** Scrape job boards directly

**Pros:**
- No API costs
- No rate limits
- Full control

**Cons:**
- ❌ **Legal risk** (terms of service violations)
- ❌ Fragile (breaks when sites change)
- ❌ High maintenance
- ❌ Ethical concerns
- ❌ Can get IP banned
- ❌ Poor data quality

**Verdict:** **Avoid scraping.** APIs are cheap enough that the legal and technical risks aren't worth it.

---

### Data Quality Considerations

#### Deduplication Strategy

Jobs appear on multiple platforms. Need to deduplicate:

```python
def deduplicate_jobs(jobs: List[dict]) -> List[dict]:
    """
    Deduplicate based on:
    1. Exact title + company match
    2. Fuzzy title match + company (80% similarity)
    3. Same URL
    """
    # Implementation using fuzzy matching
    pass
```

#### Data Enrichment

Enhance job data with:
- **Salary prediction** (Adzuna Jobsworth)
- **Company info** (from database/API)
- **Skills extraction** (LLM parsing)
- **Location normalization** (Melbourne CBD vs Melbourne VIC)

#### Freshness

- Cache jobs for 6 hours
- Mark jobs >7 days old as "Posted 1 week ago"
- Remove jobs >30 days old
- Refresh popular searches more frequently

---

## Cost Projection

### 12-Month Forecast

| Month | Users | Requests/Month | Adzuna Cost | Other APIs | Total |
|-------|-------|----------------|-------------|------------|-------|
| 1-2 | 50 | 3,500 | $0 | $0 | **$0** |
| 3-4 | 200 | 14,000 | $0 | $0 | **$0** |
| 5-6 | 500 | 35,000 | $50 | $0 | **$50** |
| 7-8 | 800 | 56,000 | $100 | $0 | **$100** |
| 9-10 | 1,200 | 84,000 | $150 | $0 | **$150** |
| 11-12 | 2,000 | 140,000 | $200 | $50 | **$250** |

**Year 1 Total:** ~$700 ($58/month average)

---

## Conclusion

### Final Recommendation

**Start with Adzuna API**

**Rationale:**
1. ✅ **Best Australian coverage** - Aggregates from multiple sources
2. ✅ **Free for MVP** - 250 requests/day covers 100-200 users
3. ✅ **Rich data** - Salary, location, company, full descriptions
4. ✅ **Easy integration** - RESTful API, JSON responses
5. ✅ **Scalable** - Can upgrade to paid tier as you grow
6. ✅ **Unique features** - Salary prediction, market data

**Phase 2: Add Arbeitnow** for remote job coverage

**Phase 3: Consider SEEK partnership** for premium tier

### Next Steps

1. **Week 1:** Register for Adzuna API
2. **Week 1:** Implement AdzunaClient + caching
3. **Week 2:** Build job search endpoint
4. **Week 2:** Add attribution (logo + link)
5. **Week 3:** Test with real Melbourne job searches
6. **Week 4:** Monitor usage vs rate limits

### Success Metrics

- API uptime: >99.5%
- Response time: <500ms (with caching)
- Job freshness: <24 hours old
- Coverage: 1000+ Melbourne jobs
- Cost: <$50/month for first 500 users

---

## Appendix

### Useful Resources

#### API Documentation
- Adzuna: https://developer.adzuna.com/
- Arbeitnow: https://documenter.getpostman.com/view/18545278/UVJbJdKh
- Jooble: https://jooble.org/api/about
- Careerjet: https://www.careerjet.com.au/partners/api/

#### Tools
- JobsMulti (PHP): https://github.com/jobapis/jobs-multi
- JobApis: https://jobapis.github.io/

#### Australian Job Boards
- SEEK: https://www.seek.com.au/
- Indeed Australia: https://au.indeed.com/
- LinkedIn Jobs: https://www.linkedin.com/jobs/

---

### Contact & Updates

**Project:** Jobseeker MVP
**Author:** Jeremiah
**Date:** December 6, 2024
**Version:** 1.0

**Status:** Analysis complete - Ready for implementation

---

## Summary Table

| Criteria | Adzuna | SEEK | Jooble | Careerjet | Remotive |
|----------|--------|------|--------|-----------|----------|
| **Melbourne Coverage** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ❌ |
| **Cost (MVP)** | ⭐⭐⭐⭐⭐ Free | ❌ Partner | ⭐⭐⭐⭐⭐ Free | ⭐⭐⭐⭐⭐ Free | ⭐⭐⭐⭐⭐ Free |
| **Rate Limits** | ⭐⭐⭐⭐ 250/day | ❓ Unknown | ❓ Unknown | ⭐⭐⭐ Limited | ⭐ 4/day |
| **Data Quality** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Documentation** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Ease of Access** | ⭐⭐⭐⭐⭐ | ⭐ Partner | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Remote Jobs** | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Salary Data** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ |
| **Overall Score** | **38/40** | 25/40 | 30/40 | 25/40 | 24/40 |

**Winner: Adzuna** 🏆

**Note:** Arbeitnow removed from comparison as it only covers Europe, not suitable for Australian market.
