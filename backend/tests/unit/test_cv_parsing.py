"""Unit tests for CV parsing services."""

import pytest

from app.schemas.cv import Education, Experience, ParsedCV, ParsingStatusSchema
from app.services.pdf_extractor import PDFExtractionError, PDFExtractorService


@pytest.mark.unit
class TestPDFExtractorService:
    """Tests for PDF text extraction service."""

    def test_extract_text_invalid_pdf(self) -> None:
        """Test extraction fails with invalid PDF data."""
        invalid_content = b"not a pdf file"

        with pytest.raises(PDFExtractionError) as exc_info:
            PDFExtractorService.extract_text(invalid_content)

        assert (
            "Invalid PDF" in str(exc_info.value)
            or "extraction failed" in str(exc_info.value).lower()
        )

    def test_extract_text_empty_content(self) -> None:
        """Test extraction fails with empty content."""
        with pytest.raises(PDFExtractionError):
            PDFExtractorService.extract_text(b"")

    def test_extract_text_clean_removes_excessive_whitespace(self) -> None:
        """Test that extract_text_clean handles whitespace properly."""
        # This is a placeholder - actual PDF testing requires valid PDF bytes
        # In a real test, we would create a minimal valid PDF or use fixtures
        pass


@pytest.mark.unit
class TestParsedCVSchema:
    """Tests for ParsedCV Pydantic schema."""

    def test_parsed_cv_minimal(self) -> None:
        """Test ParsedCV with minimal required fields."""
        cv = ParsedCV(full_name="John Doe")

        assert cv.full_name == "John Doe"
        assert cv.email is None
        assert cv.skills == []
        assert cv.experience == []
        assert cv.education == []

    def test_parsed_cv_full(self) -> None:
        """Test ParsedCV with all fields populated."""
        cv = ParsedCV(
            full_name="Jane Smith",
            email="jane@example.com",
            phone="+1-555-1234",
            location="San Francisco, CA",
            summary="Senior software engineer with 10 years experience",
            skills=["Python", "FastAPI", "PostgreSQL"],
            experience=[
                Experience(
                    title="Senior Engineer",
                    company="Tech Corp",
                    location="SF",
                    start_date="2020",
                    end_date="Present",
                    description="Led backend team",
                    highlights=["Improved performance by 50%"],
                )
            ],
            education=[
                Education(
                    degree="BS Computer Science",
                    institution="MIT",
                    graduation_date="2015",
                )
            ],
            certifications=["AWS Solutions Architect"],
            languages=["English", "Spanish"],
        )

        assert cv.full_name == "Jane Smith"
        assert cv.email == "jane@example.com"
        assert len(cv.skills) == 3
        assert len(cv.experience) == 1
        assert cv.experience[0].title == "Senior Engineer"
        assert len(cv.education) == 1
        assert cv.education[0].degree == "BS Computer Science"

    def test_parsed_cv_to_dict(self) -> None:
        """Test ParsedCV serialization to dict."""
        cv = ParsedCV(
            full_name="Test User",
            skills=["Python"],
        )

        data = cv.model_dump(mode="json")

        assert data["full_name"] == "Test User"
        assert data["skills"] == ["Python"]
        assert data["email"] is None

    def test_parsed_cv_from_dict(self) -> None:
        """Test ParsedCV deserialization from dict."""
        data = {
            "full_name": "Test User",
            "email": "test@example.com",
            "phone": None,
            "location": None,
            "summary": None,
            "skills": ["Python", "JavaScript"],
            "experience": [],
            "education": [],
            "certifications": [],
            "languages": [],
        }

        cv = ParsedCV.model_validate(data)

        assert cv.full_name == "Test User"
        assert cv.email == "test@example.com"
        assert cv.skills == ["Python", "JavaScript"]


@pytest.mark.unit
class TestExperienceSchema:
    """Tests for Experience Pydantic schema."""

    def test_experience_minimal(self) -> None:
        """Test Experience with minimal required fields."""
        exp = Experience(
            title="Software Engineer",
            company="Acme Inc",
        )

        assert exp.title == "Software Engineer"
        assert exp.company == "Acme Inc"
        assert exp.location is None
        assert exp.highlights == []

    def test_experience_full(self) -> None:
        """Test Experience with all fields."""
        exp = Experience(
            title="Senior Developer",
            company="Big Tech",
            location="New York",
            start_date="Jan 2020",
            end_date="Present",
            description="Building amazing products",
            highlights=["Led team of 5", "Shipped 3 major features"],
        )

        assert exp.end_date == "Present"
        assert len(exp.highlights) == 2


@pytest.mark.unit
class TestEducationSchema:
    """Tests for Education Pydantic schema."""

    def test_education_minimal(self) -> None:
        """Test Education with minimal required fields."""
        edu = Education(
            degree="Bachelor of Science",
            institution="State University",
        )

        assert edu.degree == "Bachelor of Science"
        assert edu.institution == "State University"
        assert edu.gpa is None

    def test_education_with_gpa(self) -> None:
        """Test Education with GPA."""
        edu = Education(
            degree="MBA",
            institution="Harvard Business School",
            graduation_date="2023",
            gpa="3.9",
        )

        assert edu.gpa == "3.9"


@pytest.mark.unit
class TestParsingStatusSchema:
    """Tests for ParsingStatus enum."""

    def test_parsing_status_values(self) -> None:
        """Test all parsing status values exist."""
        assert ParsingStatusSchema.PENDING.value == "pending"
        assert ParsingStatusSchema.PROCESSING.value == "processing"
        assert ParsingStatusSchema.COMPLETED.value == "completed"
        assert ParsingStatusSchema.FAILED.value == "failed"
