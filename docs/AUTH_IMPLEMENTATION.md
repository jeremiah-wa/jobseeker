# Authentication Implementation

This document describes the JWT-based authentication system implemented for the Jobseeker application.

## Overview

The authentication system uses:
- **JWT tokens** for stateless authentication
- **bcrypt** for password hashing
- **Access tokens** (15 min expiry) for API requests
- **Refresh tokens** (7 days expiry) for obtaining new access tokens

## Backend Implementation

### Dependencies

- `passlib[bcrypt]` - Password hashing
- `python-jose[cryptography]` - JWT encoding/decoding

### Project Structure

```
backend/app/
├── dependencies/
│   └── auth.py              # Auth dependencies (get_current_user)
├── routers/
│   └── auth.py              # Auth endpoints
├── schemas/
│   └── auth.py              # Pydantic schemas
├── utils/
│   └── auth.py              # Password & JWT utilities
└── db/models/
    └── user.py              # User model
```

### API Endpoints

All endpoints are prefixed with `/api/auth`:

#### `POST /api/auth/register`
Register a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "full_name": "John Doe"
}
```

**Response:**
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer"
}
```

#### `POST /api/auth/login`
Login with email and password.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer"
}
```

#### `POST /api/auth/refresh`
Refresh access token using refresh token.

**Request:**
```json
{
  "refresh_token": "eyJ..."
}
```

**Response:**
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer"
}
```

#### `GET /api/auth/me`
Get current authenticated user information.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "full_name": "John Doe",
  "tier": "free"
}
```

#### `POST /api/auth/logout`
Logout (client-side token removal).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:** 204 No Content

### Protected Routes

To protect a route, use the `get_current_user` dependency:

```python
from fastapi import APIRouter, Depends
from app.dependencies.auth import get_current_user
from app.db.models.user import User

router = APIRouter()

@router.get("/protected")
async def protected_route(current_user: User = Depends(get_current_user)):
    return {"message": f"Hello {current_user.email}"}
```

### Configuration

Environment variables in `.env`:

```env
JWT_SECRET_KEY=your-secret-key-change-in-production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7
```

## Frontend Implementation

### Project Structure

```
frontend/src/
├── lib/
│   ├── api/
│   │   ├── client.ts        # Axios client with interceptors
│   │   └── auth.ts          # Auth API functions
│   ├── contexts/
│   │   └── auth-context.tsx # Auth context provider
│   └── components/
│       └── protected-route.tsx # Protected route wrapper
└── app/
    ├── login/
    │   └── page.tsx         # Login page
    ├── register/
    │   └── page.tsx         # Register page
    └── dashboard/
        └── page.tsx         # Protected dashboard
```

### API Client

The axios client automatically:
- Adds access token to requests
- Refreshes expired tokens
- Redirects to login on auth failure

### Auth Context

The `AuthProvider` provides:
- `user` - Current user or null
- `isLoading` - Loading state
- `isAuthenticated` - Boolean auth status
- `login(data)` - Login function
- `register(data)` - Register function
- `logout()` - Logout function

### Usage Example

```tsx
import { useAuth } from '@/lib/contexts/auth-context';

function MyComponent() {
  const { user, isAuthenticated, logout } = useAuth();

  if (!isAuthenticated) {
    return <div>Please login</div>;
  }

  return (
    <div>
      <p>Welcome {user?.full_name}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### Protected Routes

Wrap protected pages with `ProtectedRoute`:

```tsx
import { ProtectedRoute } from '@/lib/components/protected-route';

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <div>Protected content</div>
    </ProtectedRoute>
  );
}
```

### Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

## Security Considerations

### Implemented

- ✅ Password hashing with bcrypt
- ✅ JWT token expiration
- ✅ Separate access and refresh tokens
- ✅ Token type verification
- ✅ Secure token storage (localStorage)
- ✅ Automatic token refresh
- ✅ Password minimum length (8 characters)

### Future Enhancements

- [ ] Rate limiting on auth endpoints
- [ ] Password strength validation (complexity)
- [ ] Token blacklisting for logout
- [ ] Secure HTTP-only cookies for refresh tokens
- [ ] Two-factor authentication (2FA)
- [ ] Account email verification
- [ ] Password reset flow
- [ ] Session management

## Testing

Run backend tests:

```bash
cd backend
pytest tests/unit/test_auth.py -v
```

## Database Schema

The `users` table includes:

- `id` (UUID) - Primary key
- `email` (String) - Unique, indexed
- `hashed_password` (String) - Bcrypt hash
- `full_name` (String)
- `tier` (Enum) - FREE or PREMIUM
- `created_at` (DateTime)
- `updated_at` (DateTime)

## Troubleshooting

### Token Expired Error

If you get 401 errors, the access token may have expired. The frontend automatically refreshes tokens, but if the refresh token is also expired, you'll be redirected to login.

### CORS Issues

Ensure `cors_origins` in backend config includes your frontend URL:

```python
cors_origins: list[str] = ["http://localhost:3000"]
```

### Database Migration

If the users table doesn't exist, run:

```bash
cd backend
alembic upgrade head
```
