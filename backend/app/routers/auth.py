"""Authentication router."""

from fastapi import APIRouter, Depends, HTTPException, status
from jose import JWTError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.db.models.user import User
from app.dependencies.auth import get_current_user
from app.schemas.auth import Token, TokenRefresh, UserLogin, UserRegister, UserResponse
from app.utils.auth import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
    verify_token_type,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserRegister, db: AsyncSession = Depends(get_db)) -> Token:
    """Register a new user.

    Args:
        user_data: User registration data.
        db: Database session.

    Returns:
        JWT tokens for the new user.

    Raises:
        HTTPException: If email already exists.
    """
    # Check if user already exists
    result = await db.execute(select(User).where(User.email == user_data.email))
    existing_user = result.scalar_one_or_none()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    # Create new user
    hashed_password = hash_password(user_data.password)
    new_user = User(
        email=user_data.email,
        hashed_password=hashed_password,
        full_name=user_data.full_name,
    )

    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    # Generate tokens
    token_data = {"sub": str(new_user.id)}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    return Token(access_token=access_token, refresh_token=refresh_token)


@router.post("/login", response_model=Token)
async def login(credentials: UserLogin, db: AsyncSession = Depends(get_db)) -> Token:
    """Authenticate user and return JWT tokens.

    Args:
        credentials: User login credentials.
        db: Database session.

    Returns:
        JWT tokens.

    Raises:
        HTTPException: If credentials are invalid.
    """
    # Find user by email
    result = await db.execute(select(User).where(User.email == credentials.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Generate tokens
    token_data = {"sub": str(user.id)}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    return Token(access_token=access_token, refresh_token=refresh_token)


@router.post("/refresh", response_model=Token)
async def refresh(token_data: TokenRefresh, db: AsyncSession = Depends(get_db)) -> Token:
    """Refresh access token using refresh token.

    Args:
        token_data: Refresh token data.
        db: Database session.

    Returns:
        New JWT tokens.

    Raises:
        HTTPException: If refresh token is invalid.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = decode_token(token_data.refresh_token)
        if not verify_token_type(payload, "refresh"):
            raise credentials_exception

        user_id: str | None = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError as e:
        raise credentials_exception from e

    # Verify user still exists
    user = await db.get(User, user_id)
    if user is None:
        raise credentials_exception

    # Generate new tokens
    new_token_data = {"sub": user_id}
    access_token = create_access_token(new_token_data)
    refresh_token = create_refresh_token(new_token_data)

    return Token(access_token=access_token, refresh_token=refresh_token)


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)) -> UserResponse:
    """Get current authenticated user.

    Args:
        current_user: Current authenticated user from JWT token.

    Returns:
        User information.
    """
    return UserResponse(
        id=str(current_user.id),
        email=current_user.email,
        full_name=current_user.full_name,
        tier=current_user.tier.value,
    )


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(current_user: User = Depends(get_current_user)) -> None:
    """Logout user (client-side token removal).

    Args:
        current_user: Current authenticated user.

    Note:
        This endpoint exists for consistency but JWT tokens are stateless.
        The client should remove the tokens from storage.
    """
    # JWT tokens are stateless, so logout is handled client-side
    # This endpoint can be extended with token blacklisting if needed
    pass
