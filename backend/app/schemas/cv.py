"""CV schemas for request/response validation."""

import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


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
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CVListResponse(BaseModel):
    """Schema for listing CVs."""

    id: uuid.UUID
    filename: str
    is_primary: bool
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
