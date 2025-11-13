# Authentication Guide - Email/Password + Google OAuth

This guide explains the complete authentication system with email/password login, Google OAuth, forgot password, and remember me functionality.

## Features Implemented

### 1. Dual Authentication Methods
- **Email/Password**: Traditional username and password authentication
- **Google OAuth**: Sign in with Google account (existing feature)
- Users can use either method to sign in

### 2. User Registration
- Self-service sign-up at `/auth/signup`
- Email and password validation
- Automatic email verification for password-based accounts
- First user automatically becomes ADMIN

### 3. Login Landing Page
- **Location**: `/auth/signin`
- Email/password login form
- Google OAuth button
- "Remember Me" checkbox for extended sessions
- "Forgot Password" link
- "Sign up" link for new users

### 4. Forgot Password Flow
- **Request Reset**: `/auth/forgot-password`
  - User enters email address
  - System generates secure reset token (valid for 1 hour)
  - In development: Reset link shown on screen
  - In production: Link would be sent via email

- **Reset Password**: `/auth/reset-password?token=xxx`
  - User clicks link from email (or development page)
  - Enters new password
  - Token validated and password updated
  - Automatically redirected to sign-in page

### 5. Remember Me
- When checked, extends session duration
- Uses database-backed sessions for security
- Default session: 30 days
- Sessions automatically refreshed

## How to Use

### For Users

#### Sign Up (New Users)
1. Go to `/auth/signup`
2. Enter name, email, and password (min. 8 characters)
3. Click "Sign Up"
4. Automatically signed in and redirected

#### Sign In (Existing Users)
1. Go to `/auth/signin`
2. Choose method:
   - **Email/Password**: Enter credentials and optionally check "Remember Me"
   - **Google**: Click "Continue with Google"
3. Click "Sign In" or follow Google OAuth flow

#### Forgot Password
1. Go to `/auth/signin`
2. Click "Forgot password?"
3. Enter email address
4. Check console logs in development (or email in production)
5. Click the reset link
6. Enter new password
7. Sign in with new password

### For Developers

#### Database Schema Changes

**User Model - New Fields**:
```prisma
password          String?    // Bcrypt hashed password (nullable for OAuth-only users)
resetToken        String?    // Password reset token
resetTokenExpiry  DateTime?  // Reset token expiration
```

#### API Endpoints

**Sign Up**:
```
POST /api/auth/signup
Body: { email, password, name }
Response: { message, user: { id, email, name, role } }
```

**Forgot Password Request**:
```
POST /api/auth/forgot-password
Body: { email }
Response: { message, resetUrl (dev only) }
```

**Reset Password**:
```
POST /api/auth/reset-password
Body: { token, password }
Response: { message }
```

#### Authentication Providers

**auth.ts Configuration**:
- Google OAuth provider (existing)
- Credentials provider (new)
  - Validates email/password
  - Supports "remember me" flag
  - Returns user with role information

#### Password Security

**Hashing** (`lib/password.ts`):
- Uses bcrypt with 12 salt rounds
- `hashPassword(password)` - Hash plaintext password
- `verifyPassword(password, hash)` - Verify password

**Reset Tokens**:
- Cryptographically secure random tokens (64 characters)
- Stored hashed in database
- Expire after 1 hour
- Single-use (cleared after successful reset)

## Testing

### Test Email/Password Sign Up
1. Start dev server: `npm run dev`
2. Navigate to http://localhost:3000/auth/signup
3. Fill out the form:
   - Name: Test User
   - Email: test@example.com
   - Password: password123
4. Click "Sign Up"
5. You should be signed in automatically

### Test Sign In
1. Go to http://localhost:3000/auth/signin
2. Enter your email and password
3. Check "Remember Me" if desired
4. Click "Sign In"

### Test Forgot Password
1. Go to http://localhost:3000/auth/forgot-password
2. Enter your email
3. Check the browser console or page for the reset URL
4. Copy the URL and paste it in your browser
5. Enter a new password
6. Sign in with the new password

### Test Remember Me
1. Sign in with "Remember Me" checked
2. Close browser completely
3. Reopen and navigate to the app
4. You should still be signed in (session persists)

## Security Features

### Password Requirements
- Minimum 8 characters
- Hashed with bcrypt (12 salt rounds)
- Never stored in plaintext

### Session Management
- Database-backed sessions (not JWT)
- Automatic expiration (30 days default)
- Secure session tokens (cuid)

### Reset Token Security
- Cryptographically random (32 bytes)
- Single-use tokens
- 1-hour expiration
- Cleared after use

### Email Enumeration Prevention
- Forgot password always returns same message
- Doesn't reveal if email exists
- Prevents user discovery attacks

## Production Deployment

### Email Service Integration

To send actual emails in production, integrate an email service:

**Popular Options**:
- SendGrid
- Mailgun
- AWS SES
- Postmark
- Resend

**Implementation**:
1. Choose an email service
2. Install SDK: `npm install @sendgrid/mail` (example)
3. Update `app/api/auth/forgot-password/route.ts`:

```typescript
import sgMail from '@sendgrid/mail'

sgMail.setApiKey(process.env.SENDGRID_API_KEY!)

// Replace console.log with:
await sgMail.send({
  to: user.email,
  from: 'noreply@yourdomain.com',
  subject: 'Reset Your Password',
  html: `
    <h2>Reset Your Password</h2>
    <p>Click the link below to reset your password:</p>
    <a href="${resetUrl}">Reset Password</a>
    <p>This link expires in 1 hour.</p>
  `
})
```

4. Add environment variable:
```env
SENDGRID_API_KEY=your-api-key-here
```

### Environment Variables

Ensure these are set in production:
```env
DATABASE_URL=your-production-database-url
AUTH_SECRET=your-production-secret
NEXTAUTH_URL=https://yourdomain.com
AUTH_GOOGLE_ID=your-google-client-id
AUTH_GOOGLE_SECRET=your-google-client-secret
SENDGRID_API_KEY=your-email-api-key  # Optional, for emails
```

## Troubleshooting

### "Invalid email or password"
- Check email is correct
- Verify password is at least 8 characters
- Ensure account was created with email/password (not Google OAuth)

### Google OAuth users can't use password login
- Correct behavior - OAuth users don't have passwords
- They must continue using Google sign-in
- To add password: Use "forgot password" flow

### Reset link not working
- Check if link expired (1 hour limit)
- Ensure you copied the full URL
- Request a new reset link

### Remember me not working
- Check browser allows cookies
- Verify not in incognito/private mode
- Sessions stored in database, check connection

### Cannot sign up with existing email
- Email addresses must be unique
- If you have an account, use sign in instead
- Use "forgot password" if you don't remember password

## Architecture Decisions

### Why Bcrypt?
- Industry-standard password hashing
- Adaptive (can increase rounds as computers get faster)
- Built-in salt generation

### Why Database Sessions over JWT?
- Better security (can revoke sessions server-side)
- Easier to track active users
- No token size limitations
- Integrates well with Prisma adapter

### Why 1-hour Reset Token Expiry?
- Balance between security and usability
- Long enough for users to complete flow
- Short enough to minimize attack window

### Why Not Email Verification for Sign Up?
- Simpler onboarding
- Email verification can be added later if needed
- Focus on core functionality first
- OAuth accounts are already verified by provider

## Next Steps

1. **Test all flows** in development
2. **Integrate email service** for password resets
3. **Configure production environment variables**
4. **Optional**: Add email verification for new sign-ups
5. **Optional**: Add 2FA (two-factor authentication)
6. **Optional**: Add social login (GitHub, Facebook, etc.)

## Support

For issues or questions:
- Check CLAUDE.md for project documentation
- Review Auth.js documentation: https://authjs.dev
- Check Next.js authentication guide: https://nextjs.org/docs/authentication
