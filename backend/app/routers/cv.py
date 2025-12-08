"""CV upload and management endpoints."""

import uuid
from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import attributes

from app.config import settings
from app.core.logging import get_logger
from app.db.database import get_db, get_db_session
from app.db.models.cv import CV, ParsingStatus
from app.db.models.user import User
from app.dependencies.auth import get_current_user
from app.dependencies.storage import get_storage_backend
from app.schemas.cv import (
    CVListResponse,
    CVParsedDataUpdate,
    CVParseResponse,
    CVResponse,
    CVUploadResponse,
    ParsingStatusSchema,
)
from app.services.cv_parser import CVParserService, CVParsingError
from app.services.pdf_extractor import PDFExtractionError, PDFExtractorService
from app.storage import StorageBackend, generate_cv_path

logger = get_logger(__name__)

router = APIRouter(prefix="/cv", tags=["cv"])

# File validation constants
ALLOWED_CONTENT_TYPES = {"application/pdf"}
MAX_FILE_SIZE = settings.max_upload_size_mb * 1024 * 1024  # Convert MB to bytes


async def validate_file(file: UploadFile) -> None:
    """
    Validate uploaded file.

    Args:
        file: Uploaded file

    Raises:
        HTTPException: If file is invalid
    """
    # Check content type
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type. Only PDF files are allowed. Got: {file.content_type}",
        )

    # Check file size
    file.file.seek(0, 2)  # Seek to end
    file_size = file.file.tell()
    file.file.seek(0)  # Reset to beginning

    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large. Maximum size is {settings.max_upload_size_mb}MB",
        )

    if file_size == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File is empty",
        )


@router.post("/upload", response_model=CVUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_cv(
    file: Annotated[UploadFile, File(description="PDF file to upload")],
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    storage: Annotated[StorageBackend, Depends(get_storage_backend)],
) -> CVUploadResponse:
    """
    Upload a new CV.

    Args:
        file: PDF file to upload
        current_user: Current authenticated user
        db: Database session
        storage: Storage backend

    Returns:
        Upload response with CV details

    Raises:
        HTTPException: If file is invalid or upload fails
    """
    # Validate file
    await validate_file(file)

    # Generate storage path
    filename = file.filename or "cv.pdf"
    file_path = generate_cv_path(current_user.id, filename)

    # Read file content
    content = await file.read()

    # Save to storage
    try:
        await storage.save(file_path, content)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save file: {str(e)}",
        ) from e

    # Create database record
    cv = CV(
        user_id=current_user.id,
        filename=filename,
        file_path=file_path,
    )
    db.add(cv)
    await db.commit()
    await db.refresh(cv)

    return CVUploadResponse(
        id=cv.id,
        filename=cv.filename,
        file_path=cv.file_path,
    )


@router.get("/", response_model=list[CVListResponse])
async def list_cvs(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[CVListResponse]:
    """
    List all CVs for the current user.

    Args:
        current_user: Current authenticated user
        db: Database session

    Returns:
        List of user's CVs
    """
    result = await db.execute(
        select(CV)
        .where(CV.user_id == current_user.id)
        .order_by(CV.is_primary.desc(), CV.created_at.desc())
    )
    cvs = result.scalars().all()
    return [CVListResponse.model_validate(cv) for cv in cvs]


@router.get("/{cv_id}", response_model=CVResponse)
async def get_cv(
    cv_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> CVResponse:
    """
    Get CV details by ID.

    Args:
        cv_id: CV UUID
        current_user: Current authenticated user
        db: Database session

    Returns:
        CV details

    Raises:
        HTTPException: If CV not found or user doesn't have access
    """
    cv = await db.get(CV, cv_id)

    if cv is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="CV not found",
        )

    if cv.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this CV",
        )

    return CVResponse.model_validate(cv)


@router.get("/{cv_id}/download")
async def download_cv(
    cv_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    storage: Annotated[StorageBackend, Depends(get_storage_backend)],
) -> Response:
    """
    Download a CV file.

    Args:
        cv_id: CV UUID
        current_user: Current authenticated user
        db: Database session
        storage: Storage backend

    Returns:
        PDF file response

    Raises:
        HTTPException: If CV not found or user doesn't have access
    """
    cv = await db.get(CV, cv_id)

    if cv is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="CV not found",
        )

    if cv.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this CV",
        )

    try:
        content = await storage.get(cv.file_path)
    except FileNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="CV file not found in storage",
        ) from e

    return Response(
        content=content,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{cv.filename}"',
        },
    )


@router.delete("/{cv_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_cv(
    cv_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    storage: Annotated[StorageBackend, Depends(get_storage_backend)],
) -> None:
    """
    Delete a CV.

    Args:
        cv_id: CV UUID
        current_user: Current authenticated user
        db: Database session
        storage: Storage backend

    Raises:
        HTTPException: If CV not found or user doesn't have access
    """
    cv = await db.get(CV, cv_id)

    if cv is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="CV not found",
        )

    if cv.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this CV",
        )

    # Delete from storage
    try:
        await storage.delete(cv.file_path)
    except FileNotFoundError:
        # File already deleted, continue with database deletion
        pass
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete file: {str(e)}",
        ) from e

    # Delete from database
    await db.delete(cv)
    await db.commit()


@router.patch("/{cv_id}/primary", response_model=CVResponse)
async def set_primary_cv(
    cv_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> CVResponse:
    """
    Set a CV as the primary CV.

    Only one CV can be primary at a time. This will unset any other primary CV.

    Args:
        cv_id: CV UUID to set as primary
        current_user: Current authenticated user
        db: Database session

    Returns:
        Updated CV details

    Raises:
        HTTPException: If CV not found or user doesn't have access
    """
    cv = await db.get(CV, cv_id)

    if cv is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="CV not found",
        )

    if cv.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this CV",
        )

    # Unset any existing primary CV
    result = await db.execute(
        select(CV).where(CV.user_id == current_user.id, CV.is_primary == True)  # noqa: E712
    )
    existing_primary = result.scalar_one_or_none()
    if existing_primary:
        existing_primary.is_primary = False

    # Set new primary
    cv.is_primary = True
    await db.commit()
    await db.refresh(cv)

    return CVResponse.model_validate(cv)


async def _parse_cv_background(
    cv_id: uuid.UUID,
    pdf_content: bytes,
) -> None:
    """
    Background task to parse CV content.

    Args:
        cv_id: CV UUID to update.
        pdf_content: Raw PDF file bytes.
    """
    async with get_db_session() as db:
        cv = await db.get(CV, cv_id)
        if cv is None:
            logger.error("cv_not_found", cv_id=str(cv_id))
            return

        try:
            # Update status to processing
            cv.parsing_status = ParsingStatus.PROCESSING
            cv.parsing_error = None
            await db.commit()

            # Extract text from PDF
            logger.info("cv_text_extraction_started", cv_id=str(cv_id))
            extractor = PDFExtractorService()
            raw_text = extractor.extract_text_clean(pdf_content)
            cv.raw_text = raw_text
            await db.commit()

            # Parse with LLM
            logger.info("cv_llm_parsing_started", cv_id=str(cv_id))
            parser = CVParserService()
            parsed_data = await parser.parse_cv(raw_text)

            # Update CV with parsed data
            cv.parsed_data = parser.parsed_cv_to_dict(parsed_data)
            cv.parsing_status = ParsingStatus.COMPLETED
            cv.parsing_error = None
            await db.commit()

            logger.info("cv_parsing_completed", cv_id=str(cv_id))

        except PDFExtractionError as e:
            logger.error("pdf_extraction_failed", cv_id=str(cv_id), error=str(e))
            cv.parsing_status = ParsingStatus.FAILED
            cv.parsing_error = f"PDF extraction failed: {e}"
            await db.commit()

        except CVParsingError as e:
            logger.error("cv_parsing_failed", cv_id=str(cv_id), error=str(e))
            cv.parsing_status = ParsingStatus.FAILED
            cv.parsing_error = f"CV parsing failed: {e}"
            await db.commit()

        except Exception as e:
            logger.exception("cv_parsing_unexpected_error", cv_id=str(cv_id), error=str(e))
            cv.parsing_status = ParsingStatus.FAILED
            cv.parsing_error = f"Unexpected error: {e}"
            await db.commit()


@router.post("/{cv_id}/parse", response_model=CVParseResponse, status_code=status.HTTP_202_ACCEPTED)
async def parse_cv(
    cv_id: uuid.UUID,
    background_tasks: BackgroundTasks,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    storage: Annotated[StorageBackend, Depends(get_storage_backend)],
) -> CVParseResponse:
    """
    Trigger CV parsing (PDF text extraction + LLM structuring).

    This initiates background processing to extract text from the PDF
    and structure it using an LLM.

    Args:
        cv_id: CV UUID to parse.
        background_tasks: FastAPI background tasks.
        current_user: Current authenticated user.
        db: Database session.
        storage: Storage backend.

    Returns:
        Parse response with current status.

    Raises:
        HTTPException: If CV not found, access denied, or already processing.
    """
    cv = await db.get(CV, cv_id)

    if cv is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="CV not found",
        )

    if cv.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this CV",
        )

    # Check if already processing
    if cv.parsing_status == ParsingStatus.PROCESSING:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="CV is already being parsed",
        )

    # Get PDF content from storage
    try:
        pdf_content = await storage.get(cv.file_path)
    except FileNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="CV file not found in storage",
        ) from e

    # Queue background task
    background_tasks.add_task(_parse_cv_background, cv_id, pdf_content)

    # Update status to pending (will be set to processing by background task)
    cv.parsing_status = ParsingStatus.PENDING
    cv.parsing_error = None
    await db.commit()
    await db.refresh(cv)

    return CVParseResponse(
        id=cv.id,
        parsing_status=ParsingStatusSchema(cv.parsing_status.value),
        parsing_error=cv.parsing_error,
        message="Parsing initiated. Check status with GET /cv/{cv_id}",
    )


@router.patch("/{cv_id}/parsed-data", response_model=CVResponse)
async def update_parsed_data(
    cv_id: uuid.UUID,
    update_data: CVParsedDataUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> CVResponse:
    """
    Manually update parsed CV data.

    Allows users to correct or add parsed data manually, especially useful
    when automatic parsing fails or produces incomplete results.

    Args:
        cv_id: CV UUID to update.
        update_data: Partial parsed data to update.
        current_user: Current authenticated user.
        db: Database session.

    Returns:
        Updated CV with new parsed data.

    Raises:
        HTTPException: If CV not found or access denied.
    """
    # Get CV and verify ownership
    result = await db.execute(select(CV).where(CV.id == cv_id))
    cv = result.scalar_one_or_none()

    if not cv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="CV not found",
        )

    if cv.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )

    # Get existing parsed data or start fresh
    existing_data = cv.parsed_data or {}

    # Update only provided fields
    update_dict = update_data.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        if value is not None:
            # For lists, convert Pydantic models to dicts
            if isinstance(value, list) and value and hasattr(value[0], "model_dump"):
                existing_data[key] = [item.model_dump() for item in value]
            else:
                existing_data[key] = value

    cv.parsed_data = existing_data
    # Flag the JSONB column as modified so SQLAlchemy detects the change
    attributes.flag_modified(cv, "parsed_data")

    # If there was a parsing error and user is manually fixing, clear the error
    # and set status to completed
    if cv.parsing_status == ParsingStatus.FAILED:
        cv.parsing_status = ParsingStatus.COMPLETED
        cv.parsing_error = None

    await db.commit()
    await db.refresh(cv)

    logger.info("cv_parsed_data_updated", cv_id=str(cv_id), user_id=str(current_user.id))

    return CVResponse.model_validate(cv)
