# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Swing Decoder Handicap Tracker is a comprehensive web application for tracking golf performance, handicaps, and detailed round statistics. Built with Next.js 15, it provides intelligent golf statistics calculation, personalized dashboards, and full CRUD operations with automatic GIR, up & down, and putt distribution analysis.

## Technology Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Auth.js (NextAuth.js v5) with Google OAuth and JWT sessions
- **Styling**: Bootstrap 5 + react-bootstrap
- **Validation**: Zod for API input validation
- **Logging**: Structured JSON logging (Grafana/Loki compatible)
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
│   ├── dashboard/
│   │   └── route.ts      # GET dashboard statistics (GIR%, FIR%, putts, up & down%)
│   ├── users/             # API routes for user CRUD operations (protected)
│   │   ├── route.ts      # GET (all users) and POST (create user)
│   │   └── [id]/route.ts # GET, PUT, DELETE (single user)
│   └── rounds/            # API routes for round CRUD operations (protected)
│       ├── route.ts      # GET (all rounds) and POST (create round)
│       └── [id]/route.ts # GET, PUT, DELETE (single round)
├── auth/
│   ├── signin/page.tsx   # Google sign-in page
│   └── error/page.tsx    # Authentication error page
├── dashboard/
│   └── page.tsx          # Personalized user dashboard with stats
├── users/                 # User management pages (protected)
│   ├── page.tsx          # User list with table
│   ├── new/page.tsx      # Create new user form
│   └── [id]/edit/page.tsx # Edit user form
├── rounds/                # Round management pages (protected)
│   ├── page.tsx          # Rounds list with table
│   ├── new/page.tsx      # Create new round form (dual-mode: simple/detailed)
│   └── [id]/edit/page.tsx # Edit round form (dual-mode: simple/detailed)
├── layout.tsx            # Root layout with navigation and SessionProvider
├── page.tsx              # Homepage (redirects authenticated users to dashboard)
└── globals.css           # Global styles

components/
├── Navigation.tsx        # Bootstrap navbar with auth state
└── SessionProvider.tsx   # NextAuth session provider wrapper

lib/
├── auth-utils.ts         # Authentication and authorization utilities
├── golf-calculator.ts    # Golf statistics calculation engine (GIR, up & down, putts)
├── logger.ts            # Structured JSON logging (Grafana/Loki compatible)
├── prisma.ts            # Prisma client singleton
└── validation.ts        # Zod schemas for API validation

types/
└── next-auth.d.ts       # TypeScript type extensions for NextAuth

auth.ts                   # Auth.js configuration with Google provider and JWT sessions
middleware.ts             # Route protection middleware

prisma/
└── schema.prisma        # Database schema with auth models and golf statistics
```

## Authentication

The application uses **Auth.js (NextAuth.js v5)** with Google OAuth for authentication.

### User Roles

- **ADMIN**: First user to sign in becomes admin. Can manage all users and rounds.
- **USER**: Regular users. Can only manage their own rounds.

### Authentication Flow

1. User clicks "Sign In" and is redirected to `/auth/signin`
2. User authenticates with Google OAuth
3. On first sign-in, user account is created automatically
4. First user to sign in receives ADMIN role in JWT callback
5. If an existing user with matching email exists, OAuth account is linked
6. JWT session is created with user data and role
7. User is redirected to `/dashboard`

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
- **Golf Statistics (Auto-calculated)**:
  - `greensInRegulation` (Int, nullable): Number of greens hit in regulation (0-18)
  - `fairwaysInRegulation` (Int, nullable): Number of fairways hit in regulation (0-14)
  - `putts` (Int, nullable): Total putts for the round
  - `upAndDowns` (Int, nullable): Successful up & downs (par saves from missed greens)
  - `upAndDownAttempts` (Int, nullable): Total up & down attempts (missed greens)
  - `girPutts` (Int, nullable): Total putts on greens hit in regulation
  - `nonGirPutts` (Int, nullable): Total putts when green was missed
  - `holeByHoleData` (Json, nullable): Detailed hole-by-hole scores, putts, fairways, and pars
- **Handicap Calculation**:
  - `handicapDifferential` (Float, nullable): Calculated differential for handicap index using formula: (113 / Slope Rating) × (Score − Course Rating). Auto-calculated when courseRating and slopeRating are provided.
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
  - Body: `{ userId, courseName, datePlayed, score, holes?, courseRating?, slopeRating?, notes?, putts?, greensInRegulation?, fairwaysInRegulation?, upAndDowns?, upAndDownAttempts?, girPutts?, nonGirPutts?, holeByHoleData? }`
  - Validates with Zod schema
  - Checks if user exists before creating
  - Golf statistics auto-calculated in detailed mode or estimated in simple mode
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

### Dashboard

- `GET /api/dashboard` - Get comprehensive user statistics
  - **Auth**: Required (returns stats for current user)
  - **Returns**: Dashboard object with:
    - User profile (handicapIndex, rounds count)
    - Average score and best score
    - Performance statistics:
      - `greensInRegulationPct` (GIR%): Percentage of greens hit in regulation
      - `fairwaysInRegulationPct` (FIR%): Percentage of fairways hit in regulation
      - `avgPutts`: Average putts per round
      - `upAndDownPct`: Percentage of successful up & downs
      - `avgGirPutts`: Average putts on GIR holes
      - `avgNonGirPutts`: Average putts on non-GIR holes
    - `recentRounds`: Last 5 rounds with scores and dates

### Error Responses

All protected endpoints return:
- `401 Unauthorized`: No active session
- `403 Forbidden`: Insufficient permissions

## Client-Side Pages

### Public Pages

- `/` - Homepage (redirects authenticated users to `/dashboard`, unauthenticated to `/auth/signin`)
- `/auth/signin` - Google OAuth sign-in page
- `/auth/error` - Authentication error page with helpful messages

### Protected Pages (Require Authentication)

- `/dashboard` - Personalized user dashboard showing:
  - Handicap index and total rounds
  - Average score and best score
  - Performance statistics (GIR%, FIR%, avg putts, up & down%)
  - Putt distribution (GIR putts vs non-GIR putts)
  - Recent 5 rounds table
- `/users` - User list table (admin only)
- `/users/new` - Create new user form (admin only)
- `/users/[id]/edit` - Edit user profile (own profile or admin)
- `/rounds` - Rounds list table (own rounds or all if admin)
- `/rounds/new` - Create new round form with dual-mode entry:
  - **Simple Mode**: Enter total score and putts (stats auto-estimated)
  - **Detailed Mode**: Hole-by-hole scorecard with real-time stat calculation
- `/rounds/[id]/edit` - Edit round with dual-mode editing:
  - **Simple Mode**: Edit totals only
  - **Detailed Mode**: Edit hole-by-hole data (if available)
  - Prevents hole count changes when detailed data exists

All user-facing pages are client components (`'use client'`) using Bootstrap components for consistent styling. The Navigation component shows/hides links based on authentication state and user role.

## Key Implementation Details

- **Authentication**: Auth.js v5 with Google OAuth provider and JWT sessions
  - JWT strategy used for Edge Runtime compatibility
  - Custom cookie naming (`next-auth.session-token-jwt`) to avoid conflicts
  - Structured logging throughout all auth callbacks and events
- **Authorization**: Role-based access control (ADMIN vs USER) with utility functions in `lib/auth-utils.ts`
- **First User**: Automatically assigned ADMIN role in JWT callback on first sign-in
- **Account Linking**: Existing users matched by email are linked to OAuth accounts on first sign-in
- **Middleware**: Route protection via `middleware.ts` - redirects unauthenticated users to sign-in
- **Session Management**: JWT sessions for Edge Runtime compatibility and scalability
- **Structured Logging**: Grafana/Loki-compatible JSON logging via `lib/logger.ts`
  - Auth events (signin, signout, account linking)
  - API requests and responses with timing
  - Database queries with performance metrics
  - Error tracking with context
- **Golf Statistics Calculation**: Intelligent auto-calculation via `lib/golf-calculator.ts`
  - **GIR Detection**: Based on (score - putts) ≤ (par - 2), or par with 2+ putts, or birdie/better
  - **Up & Down**: Tracks par saves from missed greens
  - **Putt Distribution**: Separates GIR putts from non-GIR putts for analysis
  - **Dual-Mode Entry**: Simple (totals with estimation) vs Detailed (hole-by-hole with precise calculation)
- **Prisma Client**: Singleton pattern in `lib/prisma.ts` prevents multiple instances in development
- **Validation**: Zod schemas in `lib/validation.ts` ensure data integrity at API level
  - User validation (email, name, handicapIndex, rounds)
  - Round validation including all golf statistics fields
- **Error Handling**: All API routes handle auth errors (401/403) and other errors gracefully
- **Bootstrap**: Imported globally in `app/layout.tsx`, components use react-bootstrap
- **Navigation**: Shared navbar with conditional rendering based on auth state and role
- **SessionProvider**: Wraps app in `layout.tsx` to provide session context to all components

## Golf Statistics Calculation

The application includes an intelligent golf statistics calculation engine in `lib/golf-calculator.ts` that automatically calculates GIR, up & down, and putt distribution from hole-by-hole data or estimates from totals.

### Core Functions

#### `calculateGIR(par: number, score: number, putts: number): boolean`

Determines if a green was hit in regulation using multiple detection methods:

1. **Standard GIR**: `(score - putts) ≤ (par - 2)`
   - Par 3: On green in 1 stroke
   - Par 4: On green in 2 strokes
   - Par 5: On green in 3 strokes

2. **Par with multiple putts**: If score equals par and putts ≥ 2, assume GIR
   - Example: Par 4 with score of 4 and 2 putts = GIR

3. **Birdie or better**: Any score under par is assumed GIR
   - Birdie, eagle, or better = GIR

#### `calculateUpAndDown(hole: HoleData): boolean`

Determines if an up & down was achieved:
- Green must have been **missed** (not a GIR hole)
- Score must equal **par** (par save)
- Returns `true` for successful up & down, `false` otherwise

#### `calculateRoundStats(holes: HoleData[]): CalculatedStats`

Aggregates all hole data into round statistics:

```typescript
{
  totalScore: number        // Sum of all hole scores
  totalPutts: number        // Sum of all putts
  greensInRegulation: number // Count of GIR holes
  fairwaysInRegulation: number // Count of fairways hit (par 4s and 5s only)
  upAndDowns: number        // Count of successful up & downs
  upAndDownAttempts: number // Count of missed greens
  girPutts: number          // Total putts on GIR holes
  nonGirPutts: number       // Total putts on non-GIR holes
  parOrBetter: number       // Count of holes at par or better
}
```

### Dual-Mode Entry System

#### Simple Mode (Totals Only)

When users enter only total score and putts, the system estimates statistics:

1. **GIR Estimation** based on average putts per hole:
   - < 1.7 avg putts: ~30% GIR (struggling with putting)
   - < 2.0 avg putts: ~65% GIR (excellent putting)
   - < 2.2 avg putts: ~45% GIR (average)
   - ≥ 2.2 avg putts: ~25% GIR (poor)

2. **Up & Down Estimation**:
   - Calculates missed greens = holes - estimatedGIR
   - Estimates success rate based on score vs par
   - Better scores suggest higher up & down success rate

3. **Putt Distribution**:
   - Assumes ~2 putts per GIR hole
   - Remaining putts assigned to non-GIR holes

#### Detailed Mode (Hole-by-Hole)

When users enter hole-by-hole data:
- Each hole is analyzed for GIR using the precise algorithm
- Up & downs are calculated exactly from par saves on missed greens
- Putt distribution is precisely tracked by GIR status
- Fairway tracking available for par 4s and 5s
- Real-time statistics preview during data entry

### Standard Par Values

The calculator includes standard par configurations:

```typescript
STANDARD_PARS = {
  18: [4, 4, 3, 5, 4, 4, 3, 4, 5, 4, 5, 4, 3, 4, 4, 3, 4, 5], // Full round
  9: [4, 4, 3, 5, 4, 4, 3, 4, 5] // Front 9
}
```

Users can customize par values for individual holes to match the actual course layout.

### Data Validation

The `validateHoleData()` function ensures:
- All holes have valid scores (> 0)
- All holes have valid putt counts (≥ 0)
- Par values are between 3 and 6
- Data completeness before calculation

## Handicap Calculation

The application implements USGA (United States Golf Association) handicap calculation rules in `lib/handicap-calculator.ts`. The system automatically calculates handicap differentials for each round and determines the player's handicap index.

### Handicap Differential

A handicap differential represents how a player performed relative to the course difficulty.

#### Formula

```
Handicap Differential = (113 / Slope Rating) × (Score − Course Rating)
```

#### Parameters

- **Score**: The player's adjusted gross score for the round
- **Course Rating**: Expected score for a scratch golfer (e.g., 72.3)
- **Slope Rating**: Course difficulty for bogey golfer, scaled from 55-155 (113 is average)
- **113**: Standard slope rating constant

#### Implementation

```typescript
export function calculateHandicapDifferential(
  score: number,
  courseRating: number | null,
  slopeRating: number | null
): number | null {
  if (!courseRating || !slopeRating) return null
  const differential = (113 / slopeRating) * (score - courseRating)
  return Math.round(differential * 10) / 10 // Round to 1 decimal
}
```

**Auto-calculation**: Differentials are automatically calculated when:
- Creating a new round with courseRating and slopeRating
- Updating an existing round's score, courseRating, or slopeRating
- Both courseRating and slopeRating must be provided

**Storage**: Stored in `Round.handicapDifferential` field

### Handicap Index

The handicap index is calculated from a player's best recent differentials, following USGA rules.

#### USGA Rules by Round Count

| Rounds | Differentials Used | Calculation |
|--------|-------------------|-------------|
| 1-3    | 1                 | Lowest differential − 2.0 |
| 4-5    | 1                 | Lowest differential − 1.0 |
| 6      | 2                 | Average of lowest 2 − 1.0 |
| 7-8    | 2                 | Average of lowest 2 |
| 9-11   | 3                 | Average of lowest 3 |
| 12-14  | 4                 | Average of lowest 4 |
| 15-16  | 5                 | Average of lowest 5 |
| 17-18  | 6                 | Average of lowest 6 |
| 19     | 7                 | Average of lowest 7 |
| 20+    | 8                 | Average of lowest 8 |

#### Key Rules

- **Minimum**: Handicap index cannot be negative (floor at 0.0)
- **Precision**: Rounded to 1 decimal place
- **Encouragement**: Extra deductions for beginners (1-6 rounds) to provide achievable targets

#### Core Functions

**`calculateHandicapIndex(differentials: number[]): number | null`**

Calculates handicap index from an array of differentials:

```typescript
// Example: 6 rounds
const differentials = [15.0, 12.0, 18.0, 14.0, 11.0, 16.0]
const index = calculateHandicapIndex(differentials)
// Result: 10.5 (average of lowest 2: (11.0 + 12.0) / 2 - 1.0)
```

**`calculateHandicapIndexFromRounds(rounds: RoundWithDifferential[]): number | null`**

Calculates handicap index directly from round data:

```typescript
const rounds = await prisma.round.findMany({
  where: { userId: 1 },
  select: {
    id: true,
    score: true,
    courseRating: true,
    slopeRating: true,
    handicapDifferential: true,
    datePlayed: true
  }
})
const index = calculateHandicapIndexFromRounds(rounds)
```

- Automatically filters out rounds with null differentials
- Returns null if insufficient valid rounds

**`getNumberOfDifferentialsUsed(totalRounds: number): number`**

Returns how many differentials are used for a given round count (for display purposes):

```typescript
getNumberOfDifferentialsUsed(6)  // Returns 2
getNumberOfDifferentialsUsed(20) // Returns 8
```

### Dashboard Integration

The dashboard (`/app/api/dashboard/route.ts`) displays handicap information:

```typescript
interface DashboardStats {
  handicapIndex: number | null              // Stored handicap (legacy)
  calculatedHandicapIndex: number | null    // Live calculated index
  numberOfDifferentialsUsed: number         // How many rounds used
  roundsWithDifferential: number            // Total rounds with ratings
  totalRounds: number                       // All rounds (including no ratings)
  // ... other stats
}
```

**Display Logic** (`/app/dashboard/page.tsx`):
- Shows calculated handicap index prominently
- Displays "Based on X best of Y" to show calculation transparency
- Shows "Add course rating & slope to rounds" hint when ratings are missing
- Each recent round shows its differential as a badge

### Round Management

**Creating Rounds**: When a round is created via `POST /api/rounds`:
1. Validate courseRating and slopeRating (optional, nullable)
2. Calculate handicapDifferential if ratings provided
3. Store differential in database
4. Return round with differential

**Updating Rounds**: When a round is updated via `PUT /api/rounds/[id]`:
1. Detect if score, courseRating, or slopeRating changed
2. Recalculate differential with final values
3. Update stored differential
4. Return updated round

**Viewing Rounds**: Differential displayed in:
- Dashboard recent rounds table (badge format)
- Rounds list page
- Individual round detail page

### Hole-by-Hole Statistics Display

In detailed (hole-by-hole) entry mode, the application displays real-time calculated statistics for each hole:

**Display Columns**:
- **GIR** (Greens in Regulation): ✓ (green) if hit, ✗ (gray) if missed
- **FIR** (Fairways in Regulation): User-entered via dropdown for par 4s and 5s
- **Up & Down**: ✓ (green) if successful, ✗ (red) if failed, − if not applicable (GIR holes)

**Real-time Calculation**:
- GIR calculated using `calculateGIR(par, score, putts)` from golf-calculator
- Up & Down calculated using `calculateUpAndDown(par, score, putts, hitGIR)`
- Updates instantly as user enters scores and putts
- Provides immediate feedback on performance

**Implementation** (in `/app/rounds/new/page.tsx` and `/app/rounds/[id]/edit/page.tsx`):

```tsx
{holeData.map((hole, index) => {
  const hasValidData = hole.score > 0 && hole.putts >= 0
  const hitGIR = hasValidData ? calculateGIR(hole.par, hole.score, hole.putts) : false
  const upDownResult = hasValidData ? calculateUpAndDown(hole.par, hole.score, hole.putts, hitGIR) : { isAttempt: false, isSuccess: false }

  return (
    <tr key={hole.holeNumber}>
      {/* ... score, putts inputs ... */}
      <td className="text-center">
        {hasValidData && (
          <span className={hitGIR ? 'text-success' : 'text-muted'}>
            {hitGIR ? '✓' : '✗'}
          </span>
        )}
      </td>
      <td className="text-center">
        {hasValidData && upDownResult.isAttempt && (
          <span className={upDownResult.isSuccess ? 'text-success' : 'text-danger'}>
            {upDownResult.isSuccess ? '✓' : '✗'}
          </span>
        )}
      </td>
    </tr>
  )
})}
```

### Testing

Comprehensive unit tests for handicap calculations are in `lib/__tests__/handicap-calculator.test.ts` (35 tests):

**Test Coverage**:
1. **Handicap Differential Calculation** (11 tests)
   - Valid calculations with various course ratings and slopes
   - Null handling (missing ratings)
   - Rounding to 1 decimal place
   - Negative differentials (score below rating)
   - Edge cases (very high slope, very low score)

2. **Number of Differentials Used** (9 tests)
   - All USGA round count ranges (1-3, 4-8, 9-11, etc.)
   - Verification of correct differential count for each range

3. **Handicap Index Calculation** (9 tests)
   - All round count scenarios per USGA rules
   - Proper averaging and deductions
   - Negative index prevention (floor at 0)
   - Rounding verification

4. **Calculate from Rounds** (6 tests)
   - Integration with round data structures
   - Filtering null differentials
   - Mixed valid/invalid differential handling

**Running Handicap Tests**:
```bash
npm test -- handicap-calculator.test.ts --run
```

## Structured Logging

The application includes comprehensive structured logging via `lib/logger.ts` that outputs JSON-formatted logs compatible with Grafana and Loki.

### Log Format

All logs follow a consistent JSON structure:

```json
{
  "timestamp": "2024-01-15T10:30:45.123Z",
  "level": "info|warn|error",
  "service": "swing-handicap-tracker",
  "environment": "development|production",
  "event": "auth.signin|api.request|db.query|etc",
  "message": "Human-readable message",
  "context": {
    // Event-specific data
  }
}
```

### Logger Functions

#### Authentication Events

```typescript
logger.authEvent(
  event: 'signin' | 'signout' | 'signup' | 'link_account',
  userId?: string | number,
  email?: string,
  provider?: string,
  context?: Record<string, any>
)
```

Used in `auth.ts` for tracking:
- User sign-ins and sign-outs
- Account creation and linking
- Authentication errors
- Role assignments

#### API Request/Response

```typescript
logger.apiRequest(
  method: string,
  path: string,
  userId?: string | number,
  userRole?: string,
  context?: Record<string, any>
)

logger.apiResponse(
  method: string,
  path: string,
  statusCode: number,
  duration: number,
  userId?: string | number,
  context?: Record<string, any>
)
```

Used in all API routes to track:
- Request method and path
- User ID and role
- Response status and timing
- Query parameters

#### Database Operations

```typescript
logger.dbQuery(
  operation: string,
  model: string,
  duration: number,
  recordCount?: number,
  context?: Record<string, any>
)
```

Used to monitor:
- Query types (findMany, create, update, delete)
- Model being queried
- Query duration
- Number of records affected

#### Error Logging

```typescript
logger.apiError(
  error: Error,
  method: string,
  path: string,
  userId?: string | number,
  context?: Record<string, any>
)
```

Captures:
- Error message and stack trace
- Request context
- User information
- Additional debugging context

### Log Levels

- **INFO**: Normal operations (requests, queries, auth events)
- **WARN**: Unusual but handled situations
- **ERROR**: Errors and exceptions with stack traces

### Integration Points

Logging is integrated throughout:
- `auth.ts`: All callbacks (jwt, session, signIn) and events (signOut, linkAccount)
- `app/api/users/route.ts`: User CRUD operations
- `app/api/users/[id]/route.ts`: Individual user operations
- `app/api/rounds/*`: Round CRUD operations (planned)
- `app/api/dashboard/route.ts`: Dashboard statistics (planned)

## Testing

The project uses **Vitest** as the test framework for unit testing business logic.

### Test Structure

```
lib/__tests__/
├── validation.test.ts          # Tests for Zod validation schemas
├── golf-calculator.test.ts     # Tests for golf statistics calculation engine
└── handicap-calculator.test.ts # Tests for USGA handicap calculations

app/api/__tests__/
├── mocks/
│   ├── prisma.ts              # Prisma client mock (User & Round)
│   └── nextRequest.ts         # Next.js request helper
├── dashboard.route.test.ts    # Tests for GET /api/dashboard
├── users.route.test.ts        # Tests for GET/POST /api/users
├── users.id.route.test.ts     # Tests for GET/PUT/DELETE /api/users/[id]
├── rounds.route.test.ts       # Tests for GET/POST /api/rounds
└── rounds.id.route.test.ts    # Tests for GET/PUT/DELETE /api/rounds/[id]
```

### Test Coverage

**144 unit tests** covering:

1. **Validation Logic** (48 tests)
   - User schema validation (17 tests)
     - Valid/invalid email, name, handicap, rounds
     - Optional field handling
     - Partial update validation
   - Round schema validation (31 tests)
     - Valid/invalid courseName, score, datePlayed, holes
     - 9 vs 18 hole validation
     - Optional fields (courseRating, slopeRating, notes)
     - Golf statistics validation (greensInRegulation, fairwaysInRegulation, putts, upAndDowns, girPutts, nonGirPutts)
     - Boundary value testing for all statistics fields
     - Partial update validation

2. **Golf Statistics Calculator** (50 tests)
   - calculateGIR() function (15 tests)
     - Standard GIR detection based on strokes to green
     - Par with multiple putts heuristic
     - Birdie or better assumed GIR
     - Edge cases (0 putts, high scores, par 6)
   - calculateUpAndDown() function (7 tests)
     - Up and down detection for missed greens
     - Par saves and successful scrambles
     - Different par values
   - calculateRoundStats() aggregation (11 tests)
     - Perfect rounds, missed greens, birdies
     - GIR, FIR, putts, up & down calculation
     - Scrambling percentage
     - Empty and partial data handling
   - generateDefaultHoles() utility (5 tests)
   - validateHoleData() validation (7 tests)
   - estimateStatsFromTotals() estimation (5 tests)

3. **Handicap Calculator** (35 tests)
   - calculateHandicapDifferential() function (11 tests)
     - Valid calculations with various course ratings and slopes
     - Null handling for missing ratings
     - Rounding to 1 decimal place
     - Negative differentials (score below rating)
     - Edge cases (very high slope, very low score)
   - getNumberOfDifferentialsUsed() function (9 tests)
     - All USGA round count ranges (1-3, 4-8, 9-11, 12-14, 15-16, 17-18, 19, 20+)
     - Verification of correct differential count for each range
   - calculateHandicapIndex() function (9 tests)
     - All round count scenarios per USGA rules
     - Proper averaging and deductions for each tier
     - Negative index prevention (floor at 0.0)
     - Rounding to 1 decimal place
     - Handling identical differentials
   - calculateHandicapIndexFromRounds() function (6 tests)
     - Integration with round data structures
     - Filtering rounds with null differentials
     - Mixed valid/invalid differential handling
     - Proper calculation for various round counts

4. **Dashboard API Endpoint** (11 tests)
   - GET /api/dashboard - User statistics calculation
   - Average score, GIR%, FIR%, putts, up & down%
   - Handling rounds with partial statistics
   - Mixed 9-hole and 18-hole rounds
   - Recent rounds limiting (5 max)
   - Error handling (404, 500, auth errors)
   - Precision rounding validation
   - Handicap index calculation and display

5. **User API Endpoints** (23 tests - pre-existing)
   - GET /api/users - List all users
   - POST /api/users - Create user with validation
   - GET /api/users/[id] - Get single user, 404 handling
   - PUT /api/users/[id] - Update user with validation
   - DELETE /api/users/[id] - Delete user
   - Database error handling for all endpoints

6. **Round API Endpoints** (25 tests - pre-existing)
   - GET /api/rounds - List all rounds, filter by userId
   - POST /api/rounds - Create round with validation, user existence check, handicap differential calculation
   - GET /api/rounds/[id] - Get single round with user data, 404 handling
   - PUT /api/rounds/[id] - Update round with validation, userId validation, handicap differential recalculation
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
