"""Unit tests for jobs router and rate limiting."""

import time
from datetime import UTC, datetime
from unittest.mock import MagicMock
from uuid import uuid4

import pytest

from app.connectors.base import JobConnector
from app.connectors.manager import ConnectorManager
from app.db.models.user import User, UserTier
from app.dependencies.rate_limit import (
    RATE_LIMITS,
    RateLimiter,
    check_job_search_rate_limit,
)
from app.schemas.job import (
    Job,
    JobSearchParams,
    JobType,
    SearchResult,
)


class MockConnector(JobConnector):
    """Mock connector for testing."""

    def __init__(
        self,
        name: str = "mock",
        display_name: str = "Mock Connector",
        available: bool = True,
    ) -> None:
        self._name = name
        self._display_name = display_name
        self._available = available
        self._jobs: list[Job] = []
        self._job_details: dict[str, Job] = {}

    @property
    def name(self) -> str:
        return self._name

    @property
    def display_name(self) -> str:
        return self._display_name

    def is_available(self) -> bool:
        return self._available

    def set_jobs(self, jobs: list[Job]) -> None:
        """Set jobs to return in search results."""
        self._jobs = jobs

    def set_job_details(self, job_id: str, job: Job) -> None:
        """Set job details for a specific job."""
        self._job_details[job_id] = job

    async def search(self, params: JobSearchParams) -> SearchResult:
        """Return mock search results."""
        start = (params.page - 1) * params.per_page
        end = start + params.per_page
        paginated = self._jobs[start:end]

        return SearchResult(
            jobs=paginated,
            total_count=len(self._jobs),
            page=params.page,
            per_page=params.per_page,
            has_more=end < len(self._jobs),
        )

    async def get_job_details(self, job_id: str) -> Job | None:
        """Return mock job details."""
        return self._job_details.get(job_id)


def create_mock_job(
    id: str = "job-1",
    source: str = "mock",
    title: str = "Software Engineer",
) -> Job:
    """Create a mock job for testing."""
    return Job(
        id=id,
        source=source,
        title=title,
        company="Test Company",
        location="Melbourne, AU",
        description="A test job description",
        url="https://example.com/jobs/1",
        salary_min=80000,
        salary_max=120000,
        salary_currency="AUD",
        job_type=JobType.FULL_TIME,
        posted_at=datetime.now(UTC),
        raw_data={"original_id": id},
    )


def create_mock_user(tier: UserTier = UserTier.FREE) -> MagicMock:
    """Create a mock user for testing."""
    user = MagicMock(spec=User)
    user.id = uuid4()
    user.email = "test@example.com"
    user.tier = tier
    return user


@pytest.fixture(autouse=True)
def clear_connectors():
    """Clear connectors before and after each test."""
    ConnectorManager.clear()
    yield
    ConnectorManager.clear()


@pytest.mark.unit
class TestRateLimiter:
    """Tests for RateLimiter class."""

    def test_first_request_allowed(self):
        """Test first request is always allowed."""
        limiter = RateLimiter(window_seconds=60)
        user_id = str(uuid4())

        is_allowed, remaining, retry_after = limiter.check_rate_limit(user_id, UserTier.FREE)

        assert is_allowed is True
        assert remaining == RATE_LIMITS[UserTier.FREE] - 1
        assert retry_after == 0

    def test_rate_limit_exceeded(self):
        """Test rate limit is enforced."""
        limiter = RateLimiter(window_seconds=60)
        user_id = str(uuid4())
        limit = RATE_LIMITS[UserTier.FREE]

        # Make requests up to the limit
        for _ in range(limit):
            limiter.check_rate_limit(user_id, UserTier.FREE)

        # Next request should be blocked
        is_allowed, remaining, retry_after = limiter.check_rate_limit(user_id, UserTier.FREE)

        assert is_allowed is False
        assert remaining == 0
        assert retry_after > 0

    def test_premium_tier_higher_limit(self):
        """Test premium users have higher rate limits."""
        limiter = RateLimiter(window_seconds=60)
        free_user = str(uuid4())
        premium_user = str(uuid4())

        # Exhaust free tier limit
        for _ in range(RATE_LIMITS[UserTier.FREE]):
            limiter.check_rate_limit(free_user, UserTier.FREE)

        # Free user should be blocked
        is_allowed_free, _, _ = limiter.check_rate_limit(free_user, UserTier.FREE)

        # Premium user with same number of requests should still be allowed
        for _ in range(RATE_LIMITS[UserTier.FREE]):
            limiter.check_rate_limit(premium_user, UserTier.PREMIUM)

        is_allowed_premium, remaining_premium, _ = limiter.check_rate_limit(
            premium_user, UserTier.PREMIUM
        )

        assert is_allowed_free is False
        assert is_allowed_premium is True
        assert remaining_premium > 0

    def test_window_expires(self):
        """Test requests outside window are not counted."""
        limiter = RateLimiter(window_seconds=1)  # 1 second window
        user_id = str(uuid4())
        limit = RATE_LIMITS[UserTier.FREE]

        # Exhaust limit
        for _ in range(limit):
            limiter.check_rate_limit(user_id, UserTier.FREE)

        # Wait for window to expire
        time.sleep(1.1)

        # Should be allowed again
        is_allowed, _, _ = limiter.check_rate_limit(user_id, UserTier.FREE)
        assert is_allowed is True

    def test_get_headers(self):
        """Test rate limit headers are generated correctly."""
        limiter = RateLimiter(window_seconds=60)
        user_id = str(uuid4())

        # Make one request
        limiter.check_rate_limit(user_id, UserTier.FREE)

        headers = limiter.get_headers(user_id, UserTier.FREE)

        assert "X-RateLimit-Limit" in headers
        assert "X-RateLimit-Remaining" in headers
        assert "X-RateLimit-Reset" in headers
        assert headers["X-RateLimit-Limit"] == str(RATE_LIMITS[UserTier.FREE])
        assert int(headers["X-RateLimit-Remaining"]) == RATE_LIMITS[UserTier.FREE] - 1


@pytest.mark.unit
class TestCheckJobSearchRateLimit:
    """Tests for check_job_search_rate_limit dependency."""

    @pytest.mark.asyncio
    async def test_returns_user_when_allowed(self):
        """Test dependency returns user when within limits."""
        limiter = RateLimiter()
        user = create_mock_user()

        result = await check_job_search_rate_limit(user, limiter)

        assert result is user

    @pytest.mark.asyncio
    async def test_raises_when_rate_limited(self):
        """Test dependency raises HTTPException when rate limited."""
        from fastapi import HTTPException

        limiter = RateLimiter(window_seconds=60)
        user = create_mock_user()
        limit = RATE_LIMITS[UserTier.FREE]

        # Exhaust limit
        for _ in range(limit):
            await check_job_search_rate_limit(user, limiter)

        # Next request should raise
        with pytest.raises(HTTPException) as exc_info:
            await check_job_search_rate_limit(user, limiter)

        assert exc_info.value.status_code == 429
        assert "Rate limit exceeded" in exc_info.value.detail


@pytest.mark.unit
class TestConnectorManagerForRouter:
    """Tests for ConnectorManager methods used by router."""

    def test_list_connectors_empty(self):
        """Test list_connectors when no connectors registered."""
        info_list = ConnectorManager.list_connectors()
        assert info_list == []

    def test_list_connectors_with_connectors(self):
        """Test list_connectors with registered connectors."""
        ConnectorManager.register(MockConnector(name="conn1", display_name="Conn 1"))
        ConnectorManager.register(
            MockConnector(name="conn2", display_name="Conn 2", available=False)
        )

        info_list = ConnectorManager.list_connectors()

        assert len(info_list) == 2
        names = {info.name for info in info_list}
        assert names == {"conn1", "conn2"}

    def test_get_connector(self):
        """Test getting a connector by name."""
        connector = MockConnector()
        ConnectorManager.register(connector)

        result = ConnectorManager.get("mock")
        assert result is connector

    def test_get_nonexistent_connector(self):
        """Test getting non-existent connector returns None."""
        result = ConnectorManager.get("nonexistent")
        assert result is None

    @pytest.mark.asyncio
    async def test_search_all_empty_sources(self):
        """Test search_all with no available sources."""
        params = JobSearchParams(keywords=["test"])
        result = await ConnectorManager.search_all(params)

        assert result.jobs == []
        assert result.total_count == 0
        assert result.sources_searched == []

    @pytest.mark.asyncio
    async def test_search_all_with_sources_filter(self):
        """Test search_all filters by source names."""
        connector1 = MockConnector(name="source1", display_name="Source 1")
        connector1.set_jobs([create_mock_job(id="job1", source="source1")])
        ConnectorManager.register(connector1)

        connector2 = MockConnector(name="source2", display_name="Source 2")
        connector2.set_jobs([create_mock_job(id="job2", source="source2")])
        ConnectorManager.register(connector2)

        params = JobSearchParams(keywords=["test"])
        result = await ConnectorManager.search_all(params, sources=["source1"])

        assert len(result.jobs) == 1
        assert result.jobs[0].id == "job1"
        assert result.sources_searched == ["source1"]


@pytest.mark.unit
class TestJobDetailsEndpoint:
    """Tests for get_job_details logic."""

    @pytest.mark.asyncio
    async def test_get_job_details_found(self):
        """Test getting job details when job exists."""
        connector = MockConnector()
        job = create_mock_job(id="test-job-123")
        connector.set_job_details("test-job-123", job)
        ConnectorManager.register(connector)

        result = await ConnectorManager.get("mock").get_job_details("test-job-123")

        assert result is not None
        assert result.id == "test-job-123"

    @pytest.mark.asyncio
    async def test_get_job_details_not_found(self):
        """Test getting job details when job doesn't exist."""
        connector = MockConnector()
        ConnectorManager.register(connector)

        result = await ConnectorManager.get("mock").get_job_details("nonexistent")

        assert result is None


@pytest.mark.unit
class TestJobSearchParamsFromQuery:
    """Tests for building JobSearchParams from query parameters."""

    def test_keywords_from_query_string(self):
        """Test parsing keywords from query string."""
        query = "python developer melbourne"
        keywords = query.split() if query else []

        params = JobSearchParams(keywords=keywords)

        assert params.keywords == ["python", "developer", "melbourne"]

    def test_empty_query_string(self):
        """Test empty query results in empty keywords."""
        query = None
        keywords = query.split() if query else []

        params = JobSearchParams(keywords=keywords)

        assert params.keywords == []

    def test_sources_parsing(self):
        """Test parsing comma-separated sources."""
        sources_str = "adzuna, indeed, linkedin"
        source_list = [s.strip() for s in sources_str.split(",")] if sources_str else None

        assert source_list == ["adzuna", "indeed", "linkedin"]

    def test_validate_sources(self):
        """Test validating source names against available connectors."""
        ConnectorManager.register(MockConnector(name="valid"))

        available_connectors = {c.name for c in ConnectorManager.available()}
        source_list = ["valid", "invalid"]
        invalid_sources = set(source_list) - available_connectors

        assert invalid_sources == {"invalid"}
