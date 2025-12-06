# Testing the Authentication System

This guide walks you through testing the authentication implementation.

## Prerequisites

- Docker and Docker Compose installed
- Ports 3000, 8000, 5432, and 8080 available

## Step 1: Set Up Environment Variables

1. Copy the environment file:
```bash
cp .env.example .env
```

2. (Optional) Edit `.env` if you want to change default values. The defaults work fine for testing.

3. Create frontend environment file:
```bash
cd frontend
cp .env.example .env.local
```

The default `NEXT_PUBLIC_API_URL=http://localhost:8000/api` should work.

## Step 2: Start Docker Services

From the project root:

```bash
# Start all services (db, backend, frontend, adminer)
docker-compose up -d

# Or start specific services
docker-compose up -d db backend frontend
```

Wait for services to start (about 30-60 seconds). Check status:

```bash
docker-compose ps
```

You should see:
- `jobseeker-db` - healthy
- `jobseeker-backend` - healthy
- `jobseeker-frontend` - running
- `jobseeker-adminer` - running (optional)

## Step 3: Run Database Migrations

The backend needs to create the database tables:

```bash
# Run migrations inside the backend container
docker-compose exec backend alembic upgrade head
```

You should see output like:
```
INFO  [alembic.runtime.migration] Running upgrade  -> d05a36f38db1, initial_schema
```

## Step 4: Verify Services

### Check Backend Health
```bash
curl http://localhost:8000/health
```

Expected response:
```json
{"status":"healthy"}
```

### Check API Docs
Open in browser: http://localhost:8000/docs

You should see the FastAPI Swagger UI with auth endpoints.

### Check Frontend
Open in browser: http://localhost:3000

You should see the homepage.

## Step 5: Test Authentication Flow

### Option A: Using the Frontend (Recommended)

1. **Register a new account:**
   - Go to http://localhost:3000/register
   - Fill in:
     - Full name: `Test User`
     - Email: `test@example.com`
     - Password: `password123` (min 8 characters)
   - Click "Create account"
   - You should be redirected to `/dashboard`

2. **Verify dashboard access:**
   - You should see: "Welcome, Test User!"
   - Your email and tier should be displayed
   - Navigation bar with logout button

3. **Test logout:**
   - Click "Logout" button
   - You should be redirected to `/login`

4. **Test login:**
   - Go to http://localhost:3000/login
   - Enter: `test@example.com` / `password123`
   - Click "Sign in"
   - You should be redirected to `/dashboard`

5. **Test protected route:**
   - Logout if logged in
   - Try to access http://localhost:3000/dashboard directly
   - You should be redirected to `/login`

### Option B: Using API Directly (curl)

1. **Register:**
```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "full_name": "Test User"
  }'
```

Expected response:
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer"
}
```

2. **Login:**
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

3. **Get current user (replace TOKEN with your access_token):**
```bash
curl -X GET http://localhost:8000/api/auth/me \
  -H "Authorization: Bearer TOKEN"
```

Expected response:
```json
{
  "id": "uuid-here",
  "email": "test@example.com",
  "full_name": "Test User",
  "tier": "free"
}
```

4. **Refresh token:**
```bash
curl -X POST http://localhost:8000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "YOUR_REFRESH_TOKEN"
  }'
```

### Option C: Using Swagger UI

1. Go to http://localhost:8000/docs
2. Expand `/api/auth/register` endpoint
3. Click "Try it out"
4. Fill in the request body:
```json
{
  "email": "swagger@example.com",
  "password": "password123",
  "full_name": "Swagger User"
}
```
5. Click "Execute"
6. Copy the `access_token` from the response
7. Click the "Authorize" button at the top
8. Enter: `Bearer YOUR_ACCESS_TOKEN`
9. Now you can test protected endpoints like `/api/auth/me`

## Step 6: Inspect Database (Optional)

Use Adminer to view the database:

1. Go to http://localhost:8080
2. Login with:
   - System: `PostgreSQL`
   - Server: `db`
   - Username: `jobseeker`
   - Password: `change-me` (or your value from .env)
   - Database: `jobseeker`
3. Click on `users` table to see registered users
4. Note: Passwords are hashed with bcrypt

## Step 7: Run Backend Tests

```bash
# Run unit tests
docker-compose exec backend pytest tests/unit/test_auth.py -v

# Run with coverage
docker-compose exec backend pytest tests/unit/test_auth.py --cov=app.utils.auth -v
```

Expected output:
```
test_auth.py::TestPasswordHashing::test_hash_password PASSED
test_auth.py::TestPasswordHashing::test_verify_password_correct PASSED
test_auth.py::TestPasswordHashing::test_verify_password_incorrect PASSED
test_auth.py::TestJWTTokens::test_create_access_token PASSED
test_auth.py::TestJWTTokens::test_create_refresh_token PASSED
test_auth.py::TestJWTTokens::test_decode_access_token PASSED
test_auth.py::TestJWTTokens::test_decode_refresh_token PASSED
test_auth.py::TestJWTTokens::test_verify_token_type_access PASSED
test_auth.py::TestJWTTokens::test_verify_token_type_refresh PASSED
test_auth.py::TestJWTTokens::test_token_expiration PASSED

========== 10 passed in 0.5s ==========
```

## Troubleshooting

### Services won't start
```bash
# Check logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs db

# Restart services
docker-compose restart
```

### Database connection errors
```bash
# Ensure database is healthy
docker-compose ps db

# Check database logs
docker-compose logs db

# Recreate database
docker-compose down -v
docker-compose up -d db
docker-compose exec backend alembic upgrade head
```

### Frontend can't connect to backend
- Check that `NEXT_PUBLIC_API_URL` in `frontend/.env.local` is set to `http://localhost:8000/api`
- Verify backend is running: `curl http://localhost:8000/health`
- Check CORS settings in backend config

### Token errors (401 Unauthorized)
- Access tokens expire after 15 minutes
- The frontend automatically refreshes tokens
- If refresh token is also expired (7 days), you need to login again
- Clear browser localStorage and try again

### Port conflicts
If ports are already in use, edit `docker-compose.yml`:
```yaml
ports:
  - "3001:3000"  # Change frontend port
  - "8001:8000"  # Change backend port
```

## Clean Up

Stop services:
```bash
docker-compose down
```

Remove all data (including database):
```bash
docker-compose down -v
```

## Next Steps

After testing authentication:
1. Test with different user accounts
2. Try invalid credentials
3. Test token expiration (wait 15+ minutes)
4. Test protected routes
5. Integrate auth with other features (CV upload, job search, etc.)
