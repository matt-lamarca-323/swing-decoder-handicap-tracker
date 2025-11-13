# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Swing Decoder Handicap Tracker is a web application for tracking golf handicaps and managing user profiles. Built with Next.js 15, it provides full CRUD operations for user management with a clean Bootstrap-styled interface.

## Technology Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Auth.js (NextAuth.js v5) with Google OAuth
- **Styling**: Bootstrap 5 + react-bootstrap
- **Validation**: Zod for API input validation
- **Runtime**: Node.js

## Development Workflow

### Initial Setup

1. Install dependencies:
```bash
npm install
```

2. Configure the database and authentication:
   - Copy `.env.example` to `.env`
   - Update `DATABASE_URL` with your PostgreSQL connection string
   - Format: `postgresql://username:password@localhost:5432/swing_handicap_tracker?schema=public`
   - Generate `AUTH_SECRET` with: `openssl rand -base64 32`
   - Set `NEXTAUTH_URL` to `http://localhost:3000` (or your deployment URL)
   - Get Google OAuth credentials from https://console.cloud.google.com/apis/credentials
     - Create OAuth 2.0 Client ID
     - Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
   - Set `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` from Google Console

3. Run Prisma migrations (when database is configured):
```bash
npx prisma migrate dev
```

4. Generate Prisma client:
```bash
npx prisma generate
```

### Running the Application

- **Development server**: `npm run dev` (runs on http://localhost:3000)
- **Production build**: `npm run build`
- **Start production**: `npm start`
- **Lint code**: `npm run lint`

### Testing

- **Run tests**: `npm test` (runs in watch mode)
- **Run tests once**: `npm test -- --run`
- **Test UI**: `npm run test:ui` (opens Vitest UI in browser)
- **Coverage**: `npm run test:coverage` (generates coverage report)

### Database Management

- **Push schema to database**: `npm run db:push` or `npx prisma db push`
- **Seed database with sample data**: `npm run db:seed`
- **Open Prisma Studio (GUI)**: `npm run db:studio` or `npx prisma studio`
- **Generate Prisma client**: `npx prisma generate`
- **Create migration**: `npx prisma migrate dev --name migration_name`
- **Reset database**: `npx prisma migrate reset`

**Note**: The database is set up with User, Round, Account, Session, and VerificationToken tables for authentication.

## Project Structure

```
app/
├── api/
│   ├── auth/
│   │   └── [...nextauth]/route.ts  # Auth.js API routes
│   ├── users/             # API routes for user CRUD operations (protected)
│   │   ├── route.ts      # GET (all users) and POST (create user)
│   │   └── [id]/route.ts # GET, PUT, DELETE (single user)
│   └── rounds/            # API routes for round CRUD operations (protected)
│       ├── route.ts      # GET (all rounds) and POST (create round)
│       └── [id]/route.ts # GET, PUT, DELETE (single round)
├── auth/
│   ├── signin/page.tsx   # Google sign-in page
│   └── error/page.tsx    # Authentication error page
├── users/                 # User management pages (protected)
│   ├── page.tsx          # User list with table
│   ├── new/page.tsx      # Create new user form
│   └── [id]/edit/page.tsx # Edit user form
├── rounds/                # Round management pages (protected)
│   ├── page.tsx          # Rounds list with table
│   ├── new/page.tsx      # Create new round form
│   └── [id]/edit/page.tsx # Edit round form
├── layout.tsx            # Root layout with navigation and SessionProvider
├── page.tsx              # Homepage (public)
└── globals.css           # Global styles

components/
├── Navigation.tsx        # Bootstrap navbar with auth state
└── SessionProvider.tsx   # NextAuth session provider wrapper

lib/
├── auth-utils.ts         # Authentication and authorization utilities
├── prisma.ts            # Prisma client singleton
└── validation.ts        # Zod schemas for API validation

types/
└── next-auth.d.ts       # TypeScript type extensions for NextAuth

auth.ts                   # Auth.js configuration with Google provider
middleware.ts             # Route protection middleware

prisma/
└── schema.prisma        # Database schema with auth models
```

## Authentication

The application uses **Auth.js (NextAuth.js v5)** with Google OAuth for authentication.

### User Roles

- **ADMIN**: First user to sign in becomes admin. Can manage all users and rounds.
- **USER**: Regular users. Can only manage their own rounds.

### Authentication Flow

1. User clicks "Sign In" and is redirected to `/auth/signin`
2. User authenticates with Google OAuth
3. On first sign-in, account is created and linked via email
4. If an existing user with matching email exists, OAuth account is linked
5. Session is created and user is redirected to `/users`

### Protected Routes

- **Public**: `/`, `/auth/signin`, `/auth/error`
- **Protected**: All other routes require authentication
- Middleware in `middleware.ts` handles route protection

### Authorization Utilities (`lib/auth-utils.ts`)

- `getSession()`: Get current session (returns null if not authenticated)
- `getCurrentUser()`: Get current user (throws if not authenticated)
- `isAdmin()`: Check if current user is admin
- `requireAdmin()`: Require admin role (throws if not admin)
- `canAccessResource(userId)`: Check if user can access resource
- `requireResourceAccess(userId)`: Require resource access (throws if unauthorized)

## Database Schema

### User Model

- `id` (Int, auto-increment): Primary key with SERIAL/IDENTITY
- `email` (String, unique): User email address
- `emailVerified` (DateTime, nullable): Email verification timestamp
- `name` (String): Full name
- `image` (String, nullable): Profile picture URL from OAuth provider
- `role` (Role enum): USER or ADMIN (default: USER)
- `handicapIndex` (Float, nullable): Golf handicap index
- `rounds` (Int, default: 0): Number of rounds played
- `createdAt` (DateTime): Creation timestamp
- `updatedAt` (DateTime): Last update timestamp
- `Round[]`: One-to-many relation with rounds
- `accounts[]`: One-to-many relation with OAuth accounts
- `sessions[]`: One-to-many relation with sessions

### Round Model

- `id` (Int, auto-increment): Primary key with SERIAL/IDENTITY
- `userId` (Int, foreign key): References User.id (CASCADE on delete)
- `courseName` (String): Name of the golf course
- `datePlayed` (DateTime): Date and time the round was played
- `score` (Int): Total score for the round
- `holes` (Int, default: 18): Number of holes (9 or 18)
- `courseRating` (Float, nullable): Course rating for handicap calculation
- `slopeRating` (Int, nullable): Slope rating for handicap calculation
- `notes` (String, nullable): Additional notes about the round
- `createdAt` (DateTime): Creation timestamp
- `updatedAt` (DateTime): Last update timestamp
- `user`: Relation to User model

### Account Model (Auth.js)

OAuth provider accounts linked to users.

- `id` (String, cuid): Primary key
- `userId` (Int, foreign key): References User.id (CASCADE on delete)
- `type` (String): Account type (oauth, email, etc.)
- `provider` (String): OAuth provider name (google)
- `providerAccountId` (String): Provider's user ID
- `refresh_token` (String, nullable): OAuth refresh token
- `access_token` (String, nullable): OAuth access token
- `expires_at` (Int, nullable): Token expiration timestamp
- `token_type` (String, nullable): Token type
- `scope` (String, nullable): OAuth scopes
- `id_token` (String, nullable): OpenID Connect ID token
- `session_state` (String, nullable): OAuth session state

### Session Model (Auth.js)

User sessions for authentication.

- `id` (String, cuid): Primary key
- `sessionToken` (String, unique): Session token
- `userId` (Int, foreign key): References User.id (CASCADE on delete)
- `expires` (DateTime): Session expiration timestamp

### VerificationToken Model (Auth.js)

Tokens for email verification and passwordless auth.

- `identifier` (String): User identifier (email)
- `token` (String, unique): Verification token
- `expires` (DateTime): Token expiration timestamp

## API Endpoints

All endpoints return JSON and use appropriate HTTP status codes. All endpoints (except auth) require authentication.

### Authentication Endpoints

- `GET /api/auth/signin` - Sign in page (redirects to Google OAuth)
- `GET /api/auth/signout` - Sign out endpoint
- `GET /api/auth/session` - Get current session
- `POST /api/auth/callback/google` - Google OAuth callback

### Users Collection

- `GET /api/users` - Get all users (ordered by creation date, descending)
  - **Auth**: Admin only
  - Returns: Array of users

- `POST /api/users` - Create new user
  - **Auth**: Admin only
  - Body: `{ email, name, handicapIndex?, rounds?, role? }`
  - Validates with Zod schema
  - Returns: Created user (201)

### Individual User

- `GET /api/users/[id]` - Get user by ID
  - **Auth**: Own profile or admin
  - Returns: User object

- `PUT /api/users/[id]` - Update user
  - **Auth**: Own profile or admin
  - Body: Partial user object
  - Returns: Updated user

- `DELETE /api/users/[id]` - Delete user
  - **Auth**: Admin only
  - Returns: Success message

### Rounds Collection

- `GET /api/rounds` - Get rounds (ordered by date played, descending)
  - **Auth**: Required
  - **Regular users**: See only their own rounds
  - **Admins**: See all rounds (can filter with `?userId=123`)
  - Query params: `?userId=123` (optional, admin only)
  - Includes user relation data
  - Returns: Array of rounds

- `POST /api/rounds` - Create new round
  - **Auth**: Required
  - **Regular users**: Can only create rounds for themselves
  - **Admins**: Can create rounds for any user
  - Body: `{ userId, courseName, datePlayed, score, holes?, courseRating?, slopeRating?, notes? }`
  - Validates with Zod schema
  - Checks if user exists before creating
  - Returns: Created round with user data (201)

### Individual Round

- `GET /api/rounds/[id]` - Get round by ID
  - **Auth**: Own round or admin
  - Includes user relation data
  - Returns: Round object

- `PUT /api/rounds/[id]` - Update round
  - **Auth**: Own round or admin
  - **Regular users**: Can only update their own rounds (cannot change userId)
  - **Admins**: Can update any round and change ownership
  - Body: Partial round object
  - Validates userId if provided
  - Returns: Updated round with user data

- `DELETE /api/rounds/[id]` - Delete round
  - **Auth**: Own round or admin
  - Returns: Success message

### Error Responses

All protected endpoints return:
- `401 Unauthorized`: No active session
- `403 Forbidden`: Insufficient permissions

## Client-Side Pages

### Public Pages

- `/` - Homepage (public, shows sign-in prompt if not authenticated)
- `/auth/signin` - Google OAuth sign-in page
- `/auth/error` - Authentication error page with helpful messages

### Protected Pages (Require Authentication)

- `/users` - User list table (admin only)
- `/users/new` - Create new user form (admin only)
- `/users/[id]/edit` - Edit user profile (own profile or admin)
- `/rounds` - Rounds list table (own rounds or all if admin)
- `/rounds/new` - Create new round form
- `/rounds/[id]/edit` - Edit round (own round or admin)

All user-facing pages are client components (`'use client'`) using Bootstrap components for consistent styling. The Navigation component shows/hides links based on authentication state and user role.

## Key Implementation Details

- **Authentication**: Auth.js v5 with Google OAuth provider, database sessions via Prisma adapter
- **Authorization**: Role-based access control (ADMIN vs USER) with utility functions in `lib/auth-utils.ts`
- **First User**: Automatically assigned ADMIN role on account creation
- **Account Linking**: Existing users matched by email are linked to OAuth accounts on first sign-in
- **Middleware**: Route protection via `middleware.ts` - redirects unauthenticated users to sign-in
- **Session Management**: Database sessions (not JWT) for better security and user management
- **Prisma Client**: Singleton pattern in `lib/prisma.ts` prevents multiple instances in development
- **Validation**: Zod schemas in `lib/validation.ts` ensure data integrity at API level
- **Error Handling**: All API routes handle auth errors (401/403) and other errors gracefully
- **Bootstrap**: Imported globally in `app/layout.tsx`, components use react-bootstrap
- **Navigation**: Shared navbar with conditional rendering based on auth state and role
- **SessionProvider**: Wraps app in `layout.tsx` to provide session context to all components

## Testing

The project uses **Vitest** as the test framework for unit testing business logic.

### Test Structure

```
lib/__tests__/
└── validation.test.ts          # Tests for Zod validation schemas

app/api/__tests__/
├── mocks/
│   ├── prisma.ts              # Prisma client mock (User & Round)
│   └── nextRequest.ts         # Next.js request helper
├── users.route.test.ts        # Tests for GET/POST /api/users
├── users.id.route.test.ts     # Tests for GET/PUT/DELETE /api/users/[id]
├── rounds.route.test.ts       # Tests for GET/POST /api/rounds
└── rounds.id.route.test.ts    # Tests for GET/PUT/DELETE /api/rounds/[id]
```

### Test Coverage

**83 unit tests** covering:

1. **Validation Logic** (35 tests)
   - User schema validation (17 tests)
     - Valid/invalid email, name, handicap, rounds
     - Optional field handling
     - Partial update validation
   - Round schema validation (18 tests)
     - Valid/invalid courseName, score, datePlayed, holes
     - 9 vs 18 hole validation
     - Optional fields (courseRating, slopeRating, notes)
     - Partial update validation

2. **User API Endpoints** (23 tests)
   - GET /api/users - List all users
   - POST /api/users - Create user with validation
   - GET /api/users/[id] - Get single user, 404 handling
   - PUT /api/users/[id] - Update user with validation
   - DELETE /api/users/[id] - Delete user
   - Database error handling for all endpoints

3. **Round API Endpoints** (25 tests)
   - GET /api/rounds - List all rounds, filter by userId
   - POST /api/rounds - Create round with validation, user existence check
   - GET /api/rounds/[id] - Get single round with user data, 404 handling
   - PUT /api/rounds/[id] - Update round with validation, userId validation
   - DELETE /api/rounds/[id] - Delete round
   - Database error handling for all endpoints

### Running Tests

```bash
# Run in watch mode (recommended during development)
npm test

# Run once (for CI/CD)
npm test -- --run

# Open test UI in browser
npm run test:ui

# Generate coverage report
npm run test:coverage
```

### Writing New Tests

When adding new business logic:

1. Create test file adjacent to code: `__tests__/filename.test.ts`
2. Use Vitest's `describe`, `it`, and `expect` functions
3. Mock Prisma using the existing mock in `app/api/__tests__/mocks/prisma.ts`
4. Reset mocks in `beforeEach` hooks
5. Test both success and error cases

Example test structure:
```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { resetMocks } from './mocks/prisma'

describe('Feature Name', () => {
  beforeEach(() => {
    resetMocks()
  })

  it('should handle valid input', async () => {
    // Arrange, Act, Assert
  })

  it('should handle errors', async () => {
    // Test error cases
  })
})
```
