# Golf Course API Tests

## Overview

These tests verify the Golf Course API proxy routes that integrate with golfcourseapi.com.

## Test Files

- `search.route.test.ts` - Tests for the search endpoint (`/api/golf-courses/search`)
- `id.route.test.ts` - Tests for the course details endpoint (`/api/golf-courses/[id]`)

## Running Tests

The tests use mocked fetch calls and don't require an actual API key. Run them with:

```bash
npm test -- app/api/golf-courses
```

## Test Coverage

### Search Endpoint Tests (7 tests)
- ✓ Successfully search for golf courses
- ✓ Encode special characters in search query
- ✓ Return error when API returns non-ok response
- ✓ Return 500 on network error
- ✓ Handle empty search results
- ✓ Handle rate limiting from Golf Course API
- ✓ Handle multiple search results

### Course Details Endpoint Tests (8 tests)
- ✓ Successfully fetch course details
- ✓ Return 404 when course is not found
- ✓ Return error when API returns non-ok response
- ✓ Return 500 on network error
- ✓ Handle rate limiting from Golf Course API
- ✓ Handle different course ID formats
- ✓ Verify course has both male and female tees
- ✓ Verify tee data structure contains required fields

## Note

The tests mock the external API calls using Vitest's `vi.fn()`, so no actual HTTP requests are made to golfcourseapi.com during testing.

To use the Golf Course API in the application, add your API key to `.env`:

```
GOLF_COURSE_API_KEY="your-api-key-here"
```
