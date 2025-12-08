"""Unit tests for job cache functionality."""

from datetime import UTC, datetime

import pytest

from app.schemas.job import Job, JobSearchParams, JobType, SearchResult
from app.services.cache import (
    SEARCH_CACHE_TTL_MINUTES,
    CacheType,
    generate_cache_key,
    generate_job_cache_key,
)


@pytest.mark.unit
class TestGenerateCacheKey:
    """Tests for cache key generation."""

    def test_same_params_same_source_same_key(self) -> None:
        """Same parameters and source should produce same key."""
        params = JobSearchParams(keywords=["python"], location="London")
        key1 = generate_cache_key(params, "adzuna")
        key2 = generate_cache_key(params, "adzuna")
        assert key1 == key2

    def test_different_source_different_key(self) -> None:
        """Different source should produce different key."""
        params = JobSearchParams(keywords=["python"])
        key_adzuna = generate_cache_key(params, "adzuna")
        key_indeed = generate_cache_key(params, "indeed")
        assert key_adzuna != key_indeed

    def test_different_params_different_key(self) -> None:
        """Different parameters should produce different key."""
        params1 = JobSearchParams(keywords=["python"])
        params2 = JobSearchParams(keywords=["java"])
        key1 = generate_cache_key(params1, "adzuna")
        key2 = generate_cache_key(params2, "adzuna")
        assert key1 != key2

    def test_param_order_does_not_matter(self) -> None:
        """Parameter order should not affect the key (JSON sorted)."""
        params1 = JobSearchParams(keywords=["python"], location="London", page=1)
        params2 = JobSearchParams(location="London", keywords=["python"], page=1)
        key1 = generate_cache_key(params1, "adzuna")
        key2 = generate_cache_key(params2, "adzuna")
        assert key1 == key2

    def test_none_values_excluded(self) -> None:
        """None values should be excluded from key generation."""
        params1 = JobSearchParams(keywords=["python"], salary_min=None)
        params2 = JobSearchParams(keywords=["python"])
        key1 = generate_cache_key(params1, "adzuna")
        key2 = generate_cache_key(params2, "adzuna")
        assert key1 == key2

    def test_key_is_md5_hash(self) -> None:
        """Key should be a 32-character MD5 hash."""
        params = JobSearchParams(keywords=["python"])
        key = generate_cache_key(params, "adzuna")
        assert len(key) == 32
        assert all(c in "0123456789abcdef" for c in key)

    def test_all_param_fields_affect_key(self) -> None:
        """Different values for each param field should produce different keys."""
        base_params = JobSearchParams(keywords=["python"])

        # Test each field produces different key
        variations = [
            JobSearchParams(keywords=["java"]),
            JobSearchParams(keywords=["python"], location="NYC"),
            JobSearchParams(keywords=["python"], radius_km=50),
            JobSearchParams(keywords=["python"], salary_min=50000),
            JobSearchParams(keywords=["python"], salary_max=100000),
            JobSearchParams(keywords=["python"], job_type=JobType.CONTRACT),
            JobSearchParams(keywords=["python"], remote=True),
            JobSearchParams(keywords=["python"], page=2),
            JobSearchParams(keywords=["python"], per_page=50),
        ]

        base_key = generate_cache_key(base_params, "test")
        for variant_params in variations:
            variant_key = generate_cache_key(variant_params, "test")
            assert base_key != variant_key, f"Key should differ for {variant_params}"


@pytest.mark.unit
class TestGenerateJobCacheKey:
    """Tests for job-specific cache key generation."""

    def test_format(self) -> None:
        """Key should have format job:source:id."""
        key = generate_job_cache_key("12345", "adzuna")
        assert key == "job:adzuna:12345"

    def test_same_job_same_key(self) -> None:
        """Same job ID and source should produce same key."""
        key1 = generate_job_cache_key("job-123", "adzuna")
        key2 = generate_job_cache_key("job-123", "adzuna")
        assert key1 == key2

    def test_different_source_different_key(self) -> None:
        """Same job ID but different source should produce different key."""
        key1 = generate_job_cache_key("job-123", "adzuna")
        key2 = generate_job_cache_key("job-123", "indeed")
        assert key1 != key2


@pytest.mark.unit
class TestCacheType:
    """Tests for CacheType constants."""

    def test_cache_types(self) -> None:
        """Verify cache type constants."""
        assert CacheType.SEARCH == "search"
        assert CacheType.JOB_DETAILS == "job_details"


@pytest.mark.unit
class TestCacheConstants:
    """Tests for cache configuration constants."""

    def test_search_ttl(self) -> None:
        """Search cache TTL should be 15 minutes."""
        assert SEARCH_CACHE_TTL_MINUTES == 15

    def test_job_details_ttl(self) -> None:
        """Job details cache TTL should be 60 minutes."""
        from app.services.cache import JOB_DETAILS_CACHE_TTL_MINUTES

        assert JOB_DETAILS_CACHE_TTL_MINUTES == 60


@pytest.mark.unit
class TestSearchResultSerialization:
    """Tests for SearchResult serialization for caching."""

    def test_search_result_to_dict_and_back(self) -> None:
        """SearchResult should round-trip through JSON serialization."""
        job = Job(
            id="test-123",
            source="adzuna",
            title="Software Engineer",
            company="Test Corp",
            location="London",
            description="A test job",
            url="https://example.com/job/123",
            salary_min=50000,
            salary_max=70000,
            salary_currency="GBP",
            job_type=JobType.FULL_TIME,
            posted_at=datetime(2025, 1, 15, 10, 0, 0, tzinfo=UTC),
        )

        result = SearchResult(
            jobs=[job],
            total_count=1,
            page=1,
            per_page=20,
            has_more=False,
        )

        # Serialize and deserialize
        data = result.model_dump(mode="json")
        restored = SearchResult.model_validate(data)

        assert restored.total_count == result.total_count
        assert restored.page == result.page
        assert len(restored.jobs) == 1
        assert restored.jobs[0].id == job.id
        assert restored.jobs[0].title == job.title
        assert restored.jobs[0].salary_min == job.salary_min

    def test_empty_search_result_serialization(self) -> None:
        """Empty SearchResult should serialize correctly."""
        result = SearchResult(
            jobs=[],
            total_count=0,
            page=1,
            per_page=20,
            has_more=False,
        )

        data = result.model_dump(mode="json")
        restored = SearchResult.model_validate(data)

        assert restored.jobs == []
        assert restored.total_count == 0
