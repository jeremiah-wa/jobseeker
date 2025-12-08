"""CV schemas for request/response validation."""

import enum
import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class ParsingStatusSchema(str, enum.Enum):
    """CV parsing status enum for API schemas."""

    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class CVBase(BaseModel):
    """Base CV schema with common fields."""

    filename: str = Field(..., max_length=255, description="Original filename")
    is_primary: bool = Field(default=False, description="Whether this is the primary CV")


class CVCreate(CVBase):
    """Schema for creating a new CV (internal use)."""

    file_path: str = Field(..., max_length=512, description="Storage path")
    raw_text: str | None = Field(None, description="Extracted text from PDF")
    parsed_data: dict[str, Any] | None = Field(None, description="Parsed CV data")


class CVUpdate(BaseModel):
    """Schema for updating CV metadata."""

    is_primary: bool | None = Field(None, description="Set as primary CV")


class CVResponse(CVBase):
    """Schema for CV response."""

    id: uuid.UUID
    user_id: uuid.UUID
    file_path: str
    raw_text: str | None
    parsed_data: dict[str, Any] | None
    parsing_status: ParsingStatusSchema
    parsing_error: str | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CVListResponse(BaseModel):
    """Schema for listing CVs."""

    id: uuid.UUID
    filename: str
    is_primary: bool
    parsing_status: ParsingStatusSchema
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CVUploadResponse(BaseModel):
    """Schema for CV upload response."""

    id: uuid.UUID
    filename: str
    file_path: str
    message: str = "CV uploaded successfully"

    model_config = ConfigDict(from_attributes=True)


# --- Parsed CV Data Schemas ---


class Experience(BaseModel):
    """Work experience entry from parsed CV."""

    title: str = Field(..., description="Job title")
    company: str = Field(..., description="Company name")
    location: str | None = Field(None, description="Job location")
    start_date: str | None = Field(None, description="Start date")
    end_date: str | None = Field(None, description="End date or 'Present'")
    description: str = Field(default="", description="Role description")
    highlights: list[str] = Field(default_factory=list, description="Key achievements")


class Education(BaseModel):
    """Education entry from parsed CV."""

    degree: str = Field(..., description="Degree/qualification name")
    institution: str = Field(..., description="School/university name")
    location: str | None = Field(None, description="Institution location")
    graduation_date: str | None = Field(None, description="Graduation date")
    gpa: str | None = Field(None, description="GPA if available")


class ParsedCV(BaseModel):
    """Structured data extracted from CV using LLM."""

    full_name: str = Field(..., description="Full name of the candidate")
    email: str | None = Field(None, description="Email address")
    phone: str | None = Field(None, description="Phone number")
    location: str | None = Field(None, description="Current location")
    summary: str | None = Field(None, description="Professional summary/objective")
    skills: list[str] = Field(default_factory=list, description="List of skills")
    experience: list[Experience] = Field(default_factory=list, description="Work experience")
    education: list[Education] = Field(default_factory=list, description="Education history")
    certifications: list[str] = Field(default_factory=list, description="Certifications")
    languages: list[str] = Field(default_factory=list, description="Languages spoken")


class CVParseResponse(BaseModel):
    """Response for CV parsing endpoint."""

    id: uuid.UUID
    parsing_status: ParsingStatusSchema
    parsing_error: str | None = None
    parsed_data: ParsedCV | None = None
    message: str = "Parsing initiated"

    model_config = ConfigDict(from_attributes=True)


class CVParsedDataUpdate(BaseModel):
    """Schema for manually updating parsed CV data."""

    full_name: str | None = Field(None, description="Full name of the candidate")
    email: str | None = Field(None, description="Email address")
    phone: str | None = Field(None, description="Phone number")
    location: str | None = Field(None, description="Current location")
    summary: str | None = Field(None, description="Professional summary/objective")
    skills: list[str] | None = Field(None, description="List of skills")
    experience: list[Experience] | None = Field(None, description="Work experience")
    education: list[Education] | None = Field(None, description="Education history")
    certifications: list[str] | None = Field(None, description="Certifications")
    languages: list[str] | None = Field(None, description="Languages spoken")
