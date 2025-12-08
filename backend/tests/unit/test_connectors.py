"""Unit tests for job connector interface and manager."""

from datetime import UTC, datetime

import pytest

from app.connectors.base import (
    ConnectorAPIError,
    ConnectorAuthError,
    ConnectorError,
    ConnectorRateLimitError,
    JobConnector,
)
from app.connectors.manager import ConnectorManager
from app.schemas.job import Job, JobSearchParams, JobType, SearchResult


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


class FailingConnector(JobConnector):
    """Connector that always fails."""

    @property
    def name(self) -> str:
        return "failing"

    @property
    def display_name(self) -> str:
        return "Failing Connector"

    async def search(self, params: JobSearchParams) -> SearchResult:
        raise ConnectorAPIError("failing", "API error", status_code=500)


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


@pytest.fixture(autouse=True)
def clear_connectors():
    """Clear connectors before and after each test."""
    ConnectorManager.clear()
    yield
    ConnectorManager.clear()


@pytest.mark.unit
class TestJobConnector:
    """Tests for JobConnector base class."""

    def test_abstract_methods_required(self):
        """Test that abstract methods must be implemented."""
        with pytest.raises(TypeError):
            JobConnector()  # type: ignore

    def test_mock_connector_properties(self):
        """Test connector name and display_name properties."""
        connector = MockConnector()
        assert connector.name == "mock"
        assert connector.display_name == "Mock Connector"

    def test_is_available_default(self):
        """Test is_available returns True by default."""
        connector = MockConnector()
        assert connector.is_available() is True

    def test_is_available_when_unavailable(self):
        """Test is_available when connector is not available."""
        connector = MockConnector(available=False)
        assert connector.is_available() is False

    @pytest.mark.asyncio
    async def test_get_job_details_default(self):
        """Test get_job_details returns None by default."""
        connector = MockConnector()
        result = await connector.get_job_details("job-123")
        assert result is None

    @pytest.mark.asyncio
    async def test_search_returns_results(self):
        """Test search returns SearchResult."""
        connector = MockConnector()
        connector.set_jobs([create_mock_job()])

        params = JobSearchParams(keywords=["python"])
        result = await connector.search(params)

        assert isinstance(result, SearchResult)
        assert len(result.jobs) == 1
        assert result.total_count == 1
        assert result.page == 1
        assert result.has_more is False


@pytest.mark.unit
class TestConnectorErrors:
    """Tests for connector exception classes."""

    def test_connector_error(self):
        """Test base ConnectorError."""
        error = ConnectorError("test", "Something went wrong")
        assert error.connector_name == "test"
        assert error.message == "Something went wrong"
        assert "[test]" in str(error)

    def test_connector_auth_error(self):
        """Test ConnectorAuthError."""
        error = ConnectorAuthError("adzuna", "Invalid API key")
        assert isinstance(error, ConnectorError)
        assert error.connector_name == "adzuna"

    def test_connector_rate_limit_error(self):
        """Test ConnectorRateLimitError with retry_after."""
        error = ConnectorRateLimitError("adzuna", "Rate limited", retry_after=60)
        assert error.retry_after == 60

    def test_connector_api_error(self):
        """Test ConnectorAPIError with status code."""
        error = ConnectorAPIError("adzuna", "Server error", status_code=500)
        assert error.status_code == 500


@pytest.mark.unit
class TestConnectorManager:
    """Tests for ConnectorManager."""

    def test_register_connector(self):
        """Test registering a connector."""
        connector = MockConnector()
        ConnectorManager.register(connector)

        assert ConnectorManager.get("mock") is connector
        assert len(ConnectorManager.all()) == 1

    def test_register_duplicate_fails(self):
        """Test registering duplicate connector name fails."""
        ConnectorManager.register(MockConnector())

        with pytest.raises(ValueError, match="already registered"):
            ConnectorManager.register(MockConnector())

    def test_unregister_connector(self):
        """Test unregistering a connector."""
        ConnectorManager.register(MockConnector())
        ConnectorManager.unregister("mock")

        assert ConnectorManager.get("mock") is None
        assert len(ConnectorManager.all()) == 0

    def test_get_nonexistent_returns_none(self):
        """Test getting non-existent connector returns None."""
        assert ConnectorManager.get("nonexistent") is None

    def test_available_filters_unavailable(self):
        """Test available() only returns configured connectors."""
        ConnectorManager.register(MockConnector(name="available", available=True))
        ConnectorManager.register(MockConnector(name="unavailable", available=False))

        available = ConnectorManager.available()
        assert len(available) == 1
        assert available[0].name == "available"

    def test_list_connectors(self):
        """Test list_connectors returns ConnectorInfo objects."""
        ConnectorManager.register(MockConnector())

        info_list = ConnectorManager.list_connectors()
        assert len(info_list) == 1
        assert info_list[0].name == "mock"
        assert info_list[0].display_name == "Mock Connector"
        assert info_list[0].is_available is True

    @pytest.mark.asyncio
    async def test_search_single_connector(self):
        """Test searching a single connector."""
        connector = MockConnector()
        connector.set_jobs([create_mock_job()])
        ConnectorManager.register(connector)

        params = JobSearchParams(keywords=["python"])
        result = await ConnectorManager.search("mock", params)

        assert len(result.jobs) == 1

    @pytest.mark.asyncio
    async def test_search_nonexistent_fails(self):
        """Test searching non-existent connector fails."""
        params = JobSearchParams(keywords=["python"])

        with pytest.raises(ValueError, match="not found"):
            await ConnectorManager.search("nonexistent", params)

    @pytest.mark.asyncio
    async def test_search_unavailable_fails(self):
        """Test searching unavailable connector fails."""
        ConnectorManager.register(MockConnector(available=False))
        params = JobSearchParams(keywords=["python"])

        with pytest.raises(ValueError, match="not available"):
            await ConnectorManager.search("mock", params)

    @pytest.mark.asyncio
    async def test_search_all_aggregates_results(self):
        """Test search_all aggregates results from multiple connectors."""
        connector1 = MockConnector(name="source1", display_name="Source 1")
        connector1.set_jobs([create_mock_job(id="job-1", source="source1")])

        connector2 = MockConnector(name="source2", display_name="Source 2")
        connector2.set_jobs([create_mock_job(id="job-2", source="source2")])

        ConnectorManager.register(connector1)
        ConnectorManager.register(connector2)

        params = JobSearchParams(keywords=["python"])
        result = await ConnectorManager.search_all(params)

        assert len(result.jobs) == 2
        assert result.total_count == 2
        assert set(result.sources_searched) == {"source1", "source2"}
        assert result.errors == {}

    @pytest.mark.asyncio
    async def test_search_all_with_specific_sources(self):
        """Test search_all with specific sources."""
        connector1 = MockConnector(name="source1", display_name="Source 1")
        connector1.set_jobs([create_mock_job(id="job-1", source="source1")])

        connector2 = MockConnector(name="source2", display_name="Source 2")
        connector2.set_jobs([create_mock_job(id="job-2", source="source2")])

        ConnectorManager.register(connector1)
        ConnectorManager.register(connector2)

        params = JobSearchParams(keywords=["python"])
        result = await ConnectorManager.search_all(params, sources=["source1"])

        assert len(result.jobs) == 1
        assert result.jobs[0].source == "source1"
        assert result.sources_searched == ["source1"]

    @pytest.mark.asyncio
    async def test_search_all_handles_failures(self):
        """Test search_all continues when some connectors fail."""
        working = MockConnector(name="working", display_name="Working")
        working.set_jobs([create_mock_job(source="working")])

        failing = FailingConnector()

        ConnectorManager.register(working)
        ConnectorManager.register(failing)

        params = JobSearchParams(keywords=["python"])
        result = await ConnectorManager.search_all(params)

        assert len(result.jobs) == 1
        assert "working" in result.sources_searched
        assert "failing" in result.errors
        assert "API error" in result.errors["failing"]

    @pytest.mark.asyncio
    async def test_search_all_empty_when_no_connectors(self):
        """Test search_all returns empty when no connectors available."""
        params = JobSearchParams(keywords=["python"])
        result = await ConnectorManager.search_all(params)

        assert result.jobs == []
        assert result.total_count == 0
        assert result.sources_searched == []

    def test_clear_removes_all_connectors(self):
        """Test clear removes all registered connectors."""
        ConnectorManager.register(MockConnector(name="one"))
        ConnectorManager.register(MockConnector(name="two"))

        ConnectorManager.clear()

        assert len(ConnectorManager.all()) == 0


@pytest.mark.unit
class TestJobSearchParams:
    """Tests for JobSearchParams validation."""

    def test_default_values(self):
        """Test default parameter values."""
        params = JobSearchParams()
        assert params.keywords == []
        assert params.page == 1
        assert params.per_page == 20
        assert params.location is None

    def test_with_all_params(self):
        """Test with all parameters set."""
        params = JobSearchParams(
            keywords=["python", "developer"],
            location="Melbourne",
            radius_km=50,
            salary_min=80000,
            salary_max=150000,
            job_type=JobType.FULL_TIME,
            remote=True,
            page=2,
            per_page=50,
        )

        assert params.keywords == ["python", "developer"]
        assert params.location == "Melbourne"
        assert params.radius_km == 50
        assert params.job_type == JobType.FULL_TIME

    def test_page_must_be_positive(self):
        """Test page must be >= 1."""
        with pytest.raises(ValueError):
            JobSearchParams(page=0)

    def test_per_page_max_100(self):
        """Test per_page must be <= 100."""
        with pytest.raises(ValueError):
            JobSearchParams(per_page=101)


@pytest.mark.unit
class TestJob:
    """Tests for Job model."""

    def test_required_fields(self):
        """Test Job requires all mandatory fields."""
        job = Job(
            id="123",
            source="adzuna",
            title="Software Engineer",
            company="Acme Inc",
            location="Melbourne",
            description="A job",
            url="https://example.com/job/123",
        )

        assert job.id == "123"
        assert job.source == "adzuna"
        assert job.raw_data == {}

    def test_optional_fields(self):
        """Test Job with all optional fields."""
        now = datetime.now(UTC)
        job = Job(
            id="123",
            source="adzuna",
            title="Software Engineer",
            company="Acme Inc",
            location="Melbourne",
            description="A job",
            url="https://example.com/job/123",
            salary_min=80000,
            salary_max=120000,
            salary_currency="AUD",
            job_type=JobType.FULL_TIME,
            posted_at=now,
            expires_at=now,
            raw_data={"key": "value"},
        )

        assert job.salary_min == 80000
        assert job.job_type == JobType.FULL_TIME
        assert job.raw_data == {"key": "value"}
