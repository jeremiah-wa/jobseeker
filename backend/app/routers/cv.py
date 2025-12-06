"""CV upload and management endpoints."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.db.database import get_db
from app.db.models.cv import CV
from app.db.models.user import User
from app.dependencies.auth import get_current_user
from app.dependencies.storage import get_storage_backend
from app.schemas.cv import CVListResponse, CVResponse, CVUploadResponse
from app.storage import StorageBackend, generate_cv_path

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
