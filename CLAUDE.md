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
├── api/users/              # API routes for user CRUD operations
│   ├── route.ts           # GET (all users) and POST (create user)
│   └── [id]/route.ts      # GET, PUT, DELETE (single user)
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

## Client-Side Pages

- `/` - Homepage with link to user management
- `/users` - User list table with edit/delete actions
- `/users/new` - Create new user form
- `/users/[id]/edit` - Edit existing user form

All user-facing pages are client components (`'use client'`) using Bootstrap components for consistent styling.

## Key Implementation Details

- **Prisma Client**: Singleton pattern in `lib/prisma.ts` prevents multiple instances in development
- **Validation**: Zod schemas in `lib/validation.ts` ensure data integrity at API level
- **Error Handling**: All API routes handle errors gracefully with appropriate status codes
- **Bootstrap**: Imported globally in `app/layout.tsx`, components use react-bootstrap
- **Navigation**: Shared navbar component included in root layout
