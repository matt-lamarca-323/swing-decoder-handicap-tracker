# Grafana-Compliant Structured Logging

This document describes the structured logging implementation following Grafana best practices.

## Overview

All logging is JSON-formatted for easy parsing by log aggregation systems like Grafana Loki, Elasticsearch, or Splunk.

## Logger Utility

Location: `lib/logger.ts`

### Features

- **Structured JSON output**: All logs are JSON-formatted
- **Standard log levels**: DEBUG, INFO, WARN, ERROR
- **Contextual data**: Each log includes service name, environment, timestamp
- **Performance tracking**: Built-in timing utilities
- **Specialized helpers**: Auth events, API requests, database queries

### Log Entry Structure

```json
{
  "timestamp": "2025-11-13T14:30:45.123Z",
  "level": "info",
  "message": "User created successfully",
  "service": "swing-decoder-handicap-tracker",
  "environment": "development",
  "context": {
    "database": {
      "operation": "create",
      "model": "User",
      "recordId": 123
    },
    "user": {
      "email": "user@example.com",
      "role": "USER"
    }
  },
  "performance": {
    "duration_ms": 45
  }
}
```

## Usage Examples

### Authentication Logging

```typescript
// Sign-in event
logger.authEvent('signin', userId, email, 'google', {
  performance: { duration_ms: 123 },
  rememberMe: true
})

// Auth error
logger.authError('signin_callback', error, email, 'credentials')
```

### API Request Logging

```typescript
// Request start
logger.apiRequest('GET', '/api/users', currentUser.id, currentUser.role)

// Request complete
logger.apiResponse('GET', '/api/users', 200, duration, currentUser.id)

// Request error
logger.apiError('GET', '/api/users', error, 500, currentUser.id)
```

### Database Query Logging

```typescript
// Successful query
logger.dbQuery('findMany', 'User', duration, recordCount)

// Query error
logger.dbError('create', 'User', error)
```

### Performance Measurement

```typescript
const startTime = logger.startTimer()
// ... perform operation
const duration = logger.endTimer(startTime)
```

## Implemented Logging Coverage

### ✅ Authentication (`auth.ts`)

**Credentials Provider:**
- Sign-in attempts with email
- Password validation success/failure
- Session creation with performance metrics

**OAuth Provider:**
- Sign-in callback events
- User creation/linking
- Profile data updates

**JWT Callbacks:**
- Token creation with user data
- First user ADMIN promotion
- Token refresh operations

**Session Callbacks:**
- Session data population
- Role assignment

**Events:**
- User creation (signup)
- First user ADMIN assignment
- OAuth account linking

### ✅ Users API (`app/api/users/*`)

**Collection (`/api/users`):**
- GET: List all users (admin only)
- POST: Create new user with validation

**Individual (`/api/users/[id]`):**
- GET: Fetch single user
- PUT: Update user profile
- DELETE: Delete user (admin only)

**Logged Details:**
- Request method, path, status code
- Current user ID and role
- Database operation timing
- Validation errors
- Authorization failures (403, 401)
- Resource not found (404)

### 🔄 Rounds API (Pattern Established)

The same logging pattern should be applied to:
- `app/api/rounds/route.ts`
- `app/api/rounds/[id]/route.ts`

## Log Levels

| Level | Usage |
|-------|-------|
| **DEBUG** | Detailed diagnostic information (e.g., "Creating new user", "Updating user") |
| **INFO** | General informational messages (e.g., "User created successfully", "API request completed") |
| **WARN** | Warning messages (e.g., "User not found", "Validation failed") |
| **ERROR** | Error conditions (e.g., "Database query failed", "API request failed") |

## Grafana Queries

### Example Loki Queries

**Find all authentication errors:**
```logql
{service="swing-decoder-handicap-tracker"} | json | level="error" | line_format "{{.context.auth}}"
```

**API performance metrics:**
```logql
{service="swing-decoder-handicap-tracker"} | json | context_performance_duration_ms > 1000
```

**User creation events:**
```logql
{service="swing-decoder-handicap-tracker"} | json | message="New user created"
```

**Failed sign-ins:**
```logql
{service="swing-decoder-handicap-tracker"} | json | level="warn" | message=~".*sign-in failed.*"
```

## Benefits

1. **Centralized Logging**: All logs follow consistent format
2. **Easy Filtering**: JSON structure allows precise queries in Grafana
3. **Performance Monitoring**: Duration metrics for all operations
4. **Security Auditing**: Track authentication events and authorization failures
5. **Debugging**: Contextual information helps trace issues
6. **Compliance**: Structured logs support audit requirements

## Environment Variables

The logger automatically uses:
- `NODE_ENV`: Sets the environment field
- Service name: Hardcoded as "swing-decoder-handicap-tracker"

## Output Format

**Development:**
Logs output to console (stdout/stderr) in JSON format

**Production:**
- Logs should be piped to a log collector (e.g., Grafana Loki agent)
- Configure log rotation and retention policies
- Set up alerts for ERROR level logs

## Next Steps

To complete the logging implementation:

1. **Apply pattern to Rounds API** - Follow the same structure as Users API
2. **Configure log shipping** - Set up Grafana Loki or similar
3. **Create dashboards** - Build Grafana dashboards for monitoring
4. **Set up alerts** - Configure alerts for errors and performance issues
5. **Document queries** - Add more LogQL examples for common scenarios
