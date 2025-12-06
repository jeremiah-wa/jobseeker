"""Unit tests for database models."""

import uuid

import pytest

from app.db.models.cv import CV
from app.db.models.saved_job import JobStatus, SavedJob
from app.db.models.tailored_cv import TailoredCV
from app.db.models.user import User, UserTier


class TestUserModel:
    """Tests for the User model."""

    @pytest.mark.unit
    def test_user_tier_enum_values(self) -> None:
        """Test UserTier enum has expected values."""
        assert UserTier.FREE.value == "free"
        assert UserTier.PREMIUM.value == "premium"

    @pytest.mark.unit
    def test_user_model_has_required_columns(self) -> None:
        """Test User model has all required columns."""
        columns = {c.name for c in User.__table__.columns}
        expected = {"id", "email", "hashed_password", "full_name", "tier", "created_at", "updated_at"}
        assert expected.issubset(columns)

    @pytest.mark.unit
    def test_user_model_repr(self) -> None:
        """Test User model string representation."""
        user = User(
            id=uuid.uuid4(),
            email="test@example.com",
            hashed_password="hashed",
            full_name="Test User",
        )
        assert "test@example.com" in repr(user)


class TestCVModel:
    """Tests for the CV model."""

    @pytest.mark.unit
    def test_cv_model_has_required_columns(self) -> None:
        """Test CV model has all required columns."""
        columns = {c.name for c in CV.__table__.columns}
        expected = {
            "id", "user_id", "filename", "file_path", "raw_text",
            "parsed_data", "is_primary", "created_at", "updated_at"
        }
        assert expected.issubset(columns)

    @pytest.mark.unit
    def test_cv_model_repr(self) -> None:
        """Test CV model string representation."""
        cv = CV(
            id=uuid.uuid4(),
            user_id=uuid.uuid4(),
            filename="resume.pdf",
            file_path="/uploads/resume.pdf",
        )
        assert "resume.pdf" in repr(cv)


class TestSavedJobModel:
    """Tests for the SavedJob model."""

    @pytest.mark.unit
    def test_job_status_enum_values(self) -> None:
        """Test JobStatus enum has expected values."""
        assert JobStatus.SAVED.value == "saved"
        assert JobStatus.APPLYING.value == "applying"
        assert JobStatus.APPLIED.value == "applied"
        assert JobStatus.INTERVIEW.value == "interview"
        assert JobStatus.OFFER.value == "offer"
        assert JobStatus.REJECTED.value == "rejected"

    @pytest.mark.unit
    def test_saved_job_model_has_required_columns(self) -> None:
        """Test SavedJob model has all required columns."""
        columns = {c.name for c in SavedJob.__table__.columns}
        expected = {
            "id", "user_id", "job_source", "job_external_id", "job_data",
            "status", "notes", "tailored_cv_id", "created_at", "updated_at"
        }
        assert expected.issubset(columns)

    @pytest.mark.unit
    def test_saved_job_model_repr(self) -> None:
        """Test SavedJob model string representation."""
        job = SavedJob(
            id=uuid.uuid4(),
            user_id=uuid.uuid4(),
            job_source="adzuna",
            job_external_id="123456",
            job_data={},
        )
        assert "adzuna" in repr(job)


class TestTailoredCVModel:
    """Tests for the TailoredCV model."""

    @pytest.mark.unit
    def test_tailored_cv_model_has_required_columns(self) -> None:
        """Test TailoredCV model has all required columns."""
        columns = {c.name for c in TailoredCV.__table__.columns}
        expected = {
            "id", "user_id", "base_cv_id", "content", "version",
            "created_at", "updated_at"
        }
        assert expected.issubset(columns)

    @pytest.mark.unit
    def test_tailored_cv_model_repr(self) -> None:
        """Test TailoredCV model string representation."""
        tailored = TailoredCV(
            id=uuid.uuid4(),
            user_id=uuid.uuid4(),
            base_cv_id=uuid.uuid4(),
            content="Tailored content",
            version=1,
        )
        assert "version=1" in repr(tailored)
