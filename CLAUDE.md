# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Swing Decoder Handicap Tracker is a web application for tracking golf handicaps and managing user profiles. Built with Next.js 15, it provides full CRUD operations for user management with a clean Bootstrap-styled interface.

## Technology Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Styling**: Bootstrap 5 + react-bootstrap
- **Validation**: Zod for API input validation
- **Runtime**: Node.js

## Development Workflow

### Initial Setup

1. Install dependencies:
```bash
npm install
```

2. Configure the database:
   - Copy `.env.example` to `.env`
   - Update `DATABASE_URL` with your PostgreSQL connection string
   - Format: `postgresql://username:password@localhost:5432/swing_handicap_tracker?schema=public`

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

**Note**: The database is already set up with the User table. The initial migration is in `prisma/migrations/20241112000000_init_users_table/`.

## Project Structure

```
app/
├── api/
│   ├── users/             # API routes for user CRUD operations
│   │   ├── route.ts      # GET (all users) and POST (create user)
│   │   └── [id]/route.ts # GET, PUT, DELETE (single user)
│   └── rounds/            # API routes for round CRUD operations
│       ├── route.ts      # GET (all rounds) and POST (create round)
│       └── [id]/route.ts # GET, PUT, DELETE (single round)
├── users/                 # User management pages
│   ├── page.tsx          # User list with table
│   ├── new/page.tsx      # Create new user form
│   └── [id]/edit/page.tsx # Edit user form
├── layout.tsx            # Root layout with navigation
├── page.tsx              # Homepage
└── globals.css           # Global styles

components/
└── Navigation.tsx        # Bootstrap navbar component

lib/
├── prisma.ts            # Prisma client singleton
└── validation.ts        # Zod schemas for API validation

prisma/
└── schema.prisma        # Database schema
```

## Database Schema

### User Model

- `id` (Int, auto-increment): Primary key with SERIAL/IDENTITY
- `email` (String, unique): User email address
- `name` (String): Full name
- `handicapIndex` (Float, nullable): Golf handicap index
- `rounds` (Int, default: 0): Number of rounds played
- `createdAt` (DateTime): Creation timestamp
- `updatedAt` (DateTime): Last update timestamp
- `Round[]`: One-to-many relation with rounds

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

## API Endpoints

All endpoints return JSON and use appropriate HTTP status codes.

### Users Collection

- `GET /api/users` - Get all users (ordered by creation date, descending)
- `POST /api/users` - Create new user
  - Body: `{ email, name, handicapIndex?, rounds? }`
  - Validates with Zod schema

### Individual User

- `GET /api/users/[id]` - Get user by ID
- `PUT /api/users/[id]` - Update user
  - Body: Partial user object
- `DELETE /api/users/[id]` - Delete user

### Rounds Collection

- `GET /api/rounds` - Get all rounds (ordered by date played, descending)
  - Query params: `?userId=123` (optional, filter by user)
  - Includes user relation data
- `POST /api/rounds` - Create new round
  - Body: `{ userId, courseName, datePlayed, score, holes?, courseRating?, slopeRating?, notes? }`
  - Validates with Zod schema
  - Checks if user exists before creating

### Individual Round

- `GET /api/rounds/[id]` - Get round by ID
  - Includes user relation data
- `PUT /api/rounds/[id]` - Update round
  - Body: Partial round object
  - Validates userId if provided
- `DELETE /api/rounds/[id]` - Delete round

## Client-Side Pages

- `/` - Homepage with links to user and round management
- `/users` - User list table with edit/delete actions
- `/users/new` - Create new user form
- `/users/[id]/edit` - Edit existing user form
- `/rounds` - Rounds list table showing all rounds for all users
- `/rounds/new` - Create new round form
- `/rounds/[id]/edit` - Edit existing round form

All user-facing pages are client components (`'use client'`) using Bootstrap components for consistent styling.

## Key Implementation Details

- **Prisma Client**: Singleton pattern in `lib/prisma.ts` prevents multiple instances in development
- **Validation**: Zod schemas in `lib/validation.ts` ensure data integrity at API level
- **Error Handling**: All API routes handle errors gracefully with appropriate status codes
- **Bootstrap**: Imported globally in `app/layout.tsx`, components use react-bootstrap
- **Navigation**: Shared navbar component included in root layout

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
