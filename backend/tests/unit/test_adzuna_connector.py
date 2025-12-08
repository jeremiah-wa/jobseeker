"""Unit tests for Adzuna connector."""

from unittest.mock import AsyncMock, MagicMock, patch

import httpx
import pytest

from app.connectors.adzuna import CONTRACT_TYPE_MAP, AdzunaConnector
from app.connectors.base import (
    ConnectorAPIError,
    ConnectorAuthError,
    ConnectorRateLimitError,
)
from app.schemas.job import JobSearchParams, JobType


@pytest.fixture
def connector() -> AdzunaConnector:
    """Create an Adzuna connector with test credentials."""
    return AdzunaConnector(
        app_id="test_app_id",
        app_key="test_app_key",
        country="au",
    )


@pytest.fixture
def mock_adzuna_response() -> dict:
    """Sample Adzuna API response (based on real API structure)."""
    return {
        "mean": 214823.08,
        "count": 150,
        "results": [
            {
                "id": "5520767983",
                "title": "Senior Python Developer",
                "company": {
                    "__CLASS__": "Adzuna::API::Response::Company",
                    "display_name": "Tech Corp",
                },
                "location": {
                    "__CLASS__": "Adzuna::API::Response::Location",
                    "display_name": "Melbourne, Melbourne Region",
                    "area": ["Australia", "Victoria", "Melbourne Region", "Melbourne"],
                },
                "category": {
                    "__CLASS__": "Adzuna::API::Response::Category",
                    "label": "IT Jobs",
                    "tag": "it-jobs",
                },
                "description": "We are looking for a senior Python developer...",
                "redirect_url": "https://www.adzuna.com.au/details/5520767983",
                "salary_min": 120000,
                "salary_max": 150000,
                "created": "2024-01-15T10:30:00Z",
                "contract_type": "permanent",
                "contract_time": "full_time",
                "latitude": -37.806509,
                "longitude": 144.957935,
                "adref": "eyJhbGciOiJIUzI1NiJ9...",
                "__CLASS__": "Adzuna::API::Response::Job",
            },
            {
                "id": "5512364708",
                "title": "Junior Developer",
                "company": {
                    "__CLASS__": "Adzuna::API::Response::Company",
                    "display_name": "Startup Inc",
                },
                "location": {
                    "__CLASS__": "Adzuna::API::Response::Location",
                    "display_name": "Sydney, Sydney Region",
                    "area": ["Australia", "New South Wales", "Sydney Region", "Sydney"],
                },
                "category": {
                    "__CLASS__": "Adzuna::API::Response::Category",
                    "label": "IT Jobs",
                    "tag": "it-jobs",
                },
                "description": "Entry level position...",
                "redirect_url": "https://www.adzuna.com.au/details/5512364708",
                "salary_min": 60000,
                "salary_max": 80000,
                "created": "2024-01-14T09:00:00Z",
                "contract_type": "contract",
                "contract_time": "full_time",
                "__CLASS__": "Adzuna::API::Response::Job",
            },
        ],
        "__CLASS__": "Adzuna::API::Response::JobSearchResults",
    }


@pytest.mark.unit
class TestAdzunaConnectorProperties:
    """Tests for connector properties."""

    def test_name(self, connector: AdzunaConnector):
        """Test connector name."""
        assert connector.name == "adzuna"

    def test_display_name(self, connector: AdzunaConnector):
        """Test connector display name."""
        assert connector.display_name == "Adzuna"

    def test_is_available_with_credentials(self, connector: AdzunaConnector):
        """Test is_available returns True when credentials are set."""
        assert connector.is_available() is True

    def test_is_available_without_app_id(self):
        """Test is_available returns False without app_id."""
        connector = AdzunaConnector(app_id="", app_key="test_key")
        assert connector.is_available() is False

    def test_is_available_without_app_key(self):
        """Test is_available returns False without app_key."""
        connector = AdzunaConnector(app_id="test_id", app_key="")
        assert connector.is_available() is False


@pytest.mark.unit
class TestAdzunaQueryParams:
    """Tests for query parameter building."""

    def test_basic_params(self, connector: AdzunaConnector):
        """Test basic query parameters."""
        params = JobSearchParams(keywords=["python"])
        query = connector._build_query_params(params)

        assert query["app_id"] == "test_app_id"
        assert query["app_key"] == "test_app_key"
        assert query["results_per_page"] == 20
        assert query["what"] == "python"

    def test_multiple_keywords(self, connector: AdzunaConnector):
        """Test multiple keywords are joined."""
        params = JobSearchParams(keywords=["python", "developer", "senior"])
        query = connector._build_query_params(params)

        assert query["what"] == "python developer senior"

    def test_location_param(self, connector: AdzunaConnector):
        """Test location parameter."""
        params = JobSearchParams(location="Melbourne")
        query = connector._build_query_params(params)

        assert query["where"] == "Melbourne"

    def test_radius_param(self, connector: AdzunaConnector):
        """Test radius/distance parameter."""
        params = JobSearchParams(location="Melbourne", radius_km=50)
        query = connector._build_query_params(params)

        assert query["distance"] == 50

    def test_salary_params(self, connector: AdzunaConnector):
        """Test salary filter parameters."""
        params = JobSearchParams(salary_min=80000, salary_max=150000)
        query = connector._build_query_params(params)

        assert query["salary_min"] == 80000
        assert query["salary_max"] == 150000

    def test_job_type_mapping(self, connector: AdzunaConnector):
        """Test job type to contract_type mapping."""
        params = JobSearchParams(job_type=JobType.FULL_TIME)
        query = connector._build_query_params(params)

        assert query["contract_type"] == "permanent"

    def test_job_type_contract(self, connector: AdzunaConnector):
        """Test contract job type mapping."""
        params = JobSearchParams(job_type=JobType.CONTRACT)
        query = connector._build_query_params(params)

        assert query["contract_type"] == "contract"

    def test_pagination(self, connector: AdzunaConnector):
        """Test pagination parameters."""
        params = JobSearchParams(page=3, per_page=50)
        query = connector._build_query_params(params)

        assert query["results_per_page"] == 50


@pytest.mark.unit
class TestAdzunaJobParsing:
    """Tests for job response parsing."""

    def test_parse_job_basic(self, connector: AdzunaConnector):
        """Test parsing a basic job listing."""
        item = {
            "id": 12345,
            "title": "Python Developer",
            "company": {"display_name": "Test Corp"},
            "location": {"display_name": "Melbourne"},
            "description": "A job description",
            "redirect_url": "https://example.com/job/12345",
        }

        job = connector._parse_job(item)

        assert job.id == "12345"
        assert job.source == "adzuna"
        assert job.title == "Python Developer"
        assert job.company == "Test Corp"
        assert job.location == "Melbourne"
        assert job.description == "A job description"
        assert job.url == "https://example.com/job/12345"

    def test_parse_job_with_salary(self, connector: AdzunaConnector):
        """Test parsing job with salary information."""
        item = {
            "id": 1,
            "title": "Dev",
            "company": {"display_name": "Corp"},
            "location": {"display_name": "City"},
            "description": "Desc",
            "redirect_url": "https://example.com",
            "salary_min": 80000,
            "salary_max": 120000,
        }

        job = connector._parse_job(item)

        assert job.salary_min == 80000
        assert job.salary_max == 120000
        assert job.salary_currency == "AUD"

    def test_parse_job_with_date(self, connector: AdzunaConnector):
        """Test parsing job with created date."""
        item = {
            "id": 1,
            "title": "Dev",
            "company": {"display_name": "Corp"},
            "location": {"display_name": "City"},
            "description": "Desc",
            "redirect_url": "https://example.com",
            "created": "2024-01-15T10:30:00Z",
        }

        job = connector._parse_job(item)

        assert job.posted_at is not None
        assert job.posted_at.year == 2024
        assert job.posted_at.month == 1
        assert job.posted_at.day == 15

    def test_parse_job_with_contract_type(self, connector: AdzunaConnector):
        """Test parsing job with contract type."""
        item = {
            "id": 1,
            "title": "Dev",
            "company": {"display_name": "Corp"},
            "location": {"display_name": "City"},
            "description": "Desc",
            "redirect_url": "https://example.com",
            "contract_type": "permanent",
        }

        job = connector._parse_job(item)

        assert job.job_type == JobType.FULL_TIME

    def test_parse_job_missing_nested_fields(self, connector: AdzunaConnector):
        """Test parsing job with missing nested fields."""
        item = {
            "id": 1,
            "title": "Dev",
            "description": "Desc",
            "redirect_url": "https://example.com",
            # Missing company and location
        }

        job = connector._parse_job(item)

        assert job.company == "Unknown"
        assert job.location == "Unknown"

    def test_parse_job_invalid_date(self, connector: AdzunaConnector):
        """Test parsing job with invalid date format."""
        item = {
            "id": 1,
            "title": "Dev",
            "company": {"display_name": "Corp"},
            "location": {"display_name": "City"},
            "description": "Desc",
            "redirect_url": "https://example.com",
            "created": "invalid-date",
        }

        job = connector._parse_job(item)

        assert job.posted_at is None

    def test_parse_job_stores_raw_data(self, connector: AdzunaConnector):
        """Test that raw data is stored."""
        item = {
            "id": 1,
            "title": "Dev",
            "company": {"display_name": "Corp"},
            "location": {"display_name": "City"},
            "description": "Desc",
            "redirect_url": "https://example.com",
            "extra_field": "extra_value",
        }

        job = connector._parse_job(item)

        assert job.raw_data == item
        assert job.raw_data["extra_field"] == "extra_value"


@pytest.mark.unit
class TestContractTypeMapping:
    """Tests for contract type to JobType mapping."""

    def test_permanent_maps_to_full_time(self):
        """Test permanent maps to full-time."""
        assert CONTRACT_TYPE_MAP["permanent"] == JobType.FULL_TIME

    def test_full_time_maps_to_full_time(self):
        """Test full_time maps to full-time."""
        assert CONTRACT_TYPE_MAP["full_time"] == JobType.FULL_TIME

    def test_part_time_maps_to_part_time(self):
        """Test part_time maps to part-time."""
        assert CONTRACT_TYPE_MAP["part_time"] == JobType.PART_TIME

    def test_contract_maps_to_contract(self):
        """Test contract maps to contract."""
        assert CONTRACT_TYPE_MAP["contract"] == JobType.CONTRACT

    def test_temporary_maps_to_temporary(self):
        """Test temporary maps to temporary."""
        assert CONTRACT_TYPE_MAP["temporary"] == JobType.TEMPORARY

    def test_none_maps_to_none(self):
        """Test None maps to None."""
        assert CONTRACT_TYPE_MAP[None] is None


@pytest.mark.unit
class TestAdzunaSearch:
    """Tests for search functionality."""

    @pytest.mark.asyncio
    async def test_search_success(self, connector: AdzunaConnector, mock_adzuna_response: dict):
        """Test successful search returns parsed results."""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = mock_adzuna_response

        with patch.object(
            httpx.AsyncClient, "get", new_callable=AsyncMock, return_value=mock_response
        ):
            params = JobSearchParams(keywords=["python"])
            result = await connector.search(params)

        assert result.total_count == 150
        assert len(result.jobs) == 2
        assert result.page == 1
        assert result.has_more is True

        # Check first job parsed correctly
        job = result.jobs[0]
        assert job.title == "Senior Python Developer"
        assert job.company == "Tech Corp"
        assert job.salary_min == 120000

    @pytest.mark.asyncio
    async def test_search_without_credentials(self):
        """Test search raises error when credentials not configured."""
        connector = AdzunaConnector(app_id="", app_key="")

        with pytest.raises(ConnectorAuthError, match="credentials not configured"):
            await connector.search(JobSearchParams())

    @pytest.mark.asyncio
    async def test_search_auth_error_401(self, connector: AdzunaConnector):
        """Test 401 response raises ConnectorAuthError."""
        mock_response = MagicMock()
        mock_response.status_code = 401
        mock_response.text = "Invalid API key"

        with (
            patch.object(
                httpx.AsyncClient, "get", new_callable=AsyncMock, return_value=mock_response
            ),
            pytest.raises(ConnectorAuthError, match="Authentication failed"),
        ):
            await connector.search(JobSearchParams())

    @pytest.mark.asyncio
    async def test_search_auth_error_403(self, connector: AdzunaConnector):
        """Test 403 response raises ConnectorAuthError."""
        mock_response = MagicMock()
        mock_response.status_code = 403
        mock_response.text = "Forbidden"

        with (
            patch.object(
                httpx.AsyncClient, "get", new_callable=AsyncMock, return_value=mock_response
            ),
            pytest.raises(ConnectorAuthError, match="Authentication failed"),
        ):
            await connector.search(JobSearchParams())

    @pytest.mark.asyncio
    async def test_search_rate_limit_error(self, connector: AdzunaConnector):
        """Test 429 response raises ConnectorRateLimitError."""
        mock_response = MagicMock()
        mock_response.status_code = 429
        mock_response.headers = {"Retry-After": "60"}

        with (
            patch.object(
                httpx.AsyncClient, "get", new_callable=AsyncMock, return_value=mock_response
            ),
            pytest.raises(ConnectorRateLimitError) as exc_info,
        ):
            await connector.search(JobSearchParams())

        assert exc_info.value.retry_after == 60

    @pytest.mark.asyncio
    async def test_search_api_error(self, connector: AdzunaConnector):
        """Test 500 response raises ConnectorAPIError."""
        mock_response = MagicMock()
        mock_response.status_code = 500
        mock_response.text = "Internal Server Error"

        # The retry decorator will retry 3 times, so we need to handle that
        with (
            patch.object(
                httpx.AsyncClient, "get", new_callable=AsyncMock, return_value=mock_response
            ),
            pytest.raises(ConnectorAPIError) as exc_info,
        ):
            await connector.search(JobSearchParams())

        assert exc_info.value.status_code == 500

    @pytest.mark.asyncio
    async def test_search_request_error(self, connector: AdzunaConnector):
        """Test network error raises ConnectorAPIError."""
        with (
            patch.object(
                httpx.AsyncClient,
                "get",
                new_callable=AsyncMock,
                side_effect=httpx.RequestError("Connection failed"),
            ),
            pytest.raises(ConnectorAPIError, match="Request failed"),
        ):
            await connector.search(JobSearchParams())

    @pytest.mark.asyncio
    async def test_search_pagination_has_more_false(self, connector: AdzunaConnector):
        """Test has_more is False when on last page."""
        response = {
            "count": 25,
            "results": [
                {
                    "id": i,
                    "title": f"Job {i}",
                    "company": {"display_name": "Corp"},
                    "location": {"display_name": "City"},
                    "description": "Desc",
                    "redirect_url": f"https://example.com/{i}",
                }
                for i in range(5)
            ],
        }

        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = response

        with patch.object(
            httpx.AsyncClient, "get", new_callable=AsyncMock, return_value=mock_response
        ):
            params = JobSearchParams(page=2, per_page=20)  # 25 total, page 2 of 2
            result = await connector.search(params)

        assert result.has_more is False

    @pytest.mark.asyncio
    async def test_search_url_construction(self, connector: AdzunaConnector):
        """Test search URL is constructed correctly."""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"count": 0, "results": []}

        with patch.object(
            httpx.AsyncClient, "get", new_callable=AsyncMock, return_value=mock_response
        ) as mock_get:
            params = JobSearchParams(page=3)
            await connector.search(params)

            # Check URL contains country and page
            call_args = mock_get.call_args
            url = call_args[0][0]
            assert "/au/search/3" in url


@pytest.mark.unit
class TestAdzunaCurrencyMapping:
    """Tests for currency mapping based on country."""

    def test_au_country_uses_aud(self):
        """Test Australian connector uses AUD currency."""
        connector = AdzunaConnector(app_id="test", app_key="test", country="au")
        item = {
            "id": 1,
            "title": "Dev",
            "company": {"display_name": "Corp"},
            "location": {"display_name": "City"},
            "description": "Desc",
            "redirect_url": "https://example.com",
            "salary_min": 80000,
        }

        job = connector._parse_job(item)

        assert job.salary_currency == "AUD"

    def test_other_country_no_currency(self):
        """Test non-AU connector doesn't assume currency."""
        connector = AdzunaConnector(app_id="test", app_key="test", country="gb")
        item = {
            "id": 1,
            "title": "Dev",
            "company": {"display_name": "Corp"},
            "location": {"display_name": "City"},
            "description": "Desc",
            "redirect_url": "https://example.com",
            "salary_min": 50000,
        }

        job = connector._parse_job(item)

        assert job.salary_currency is None
