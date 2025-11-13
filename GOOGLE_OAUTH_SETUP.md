# Google OAuth Setup Guide

This guide will help you set up Google OAuth authentication for the Swing Decoder Handicap Tracker application.

## Prerequisites

- A Google account
- Your application running locally or deployed

## Step 1: Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top of the page
3. Click **New Project**
4. Enter a project name (e.g., "Swing Handicap Tracker")
5. Click **Create**

## Step 2: Configure OAuth Consent Screen

1. In the Google Cloud Console, select your project
2. Navigate to **APIs & Services** > **OAuth consent screen**
3. Select **External** user type (unless you have a Google Workspace)
4. Click **Create**

Fill in the required information:
- **App name**: Swing Decoder Handicap Tracker
- **User support email**: Your email address
- **Developer contact information**: Your email address
- Click **Save and Continue**

On the Scopes page:
- Click **Save and Continue** (default scopes are sufficient)

On the Test users page (if in testing mode):
- Add your email and any other test users
- Click **Save and Continue**

Click **Back to Dashboard**

## Step 3: Create OAuth 2.0 Credentials

1. Navigate to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth client ID**
3. Select **Web application** as the application type
4. Enter a name (e.g., "Swing Handicap Tracker Web Client")

Configure the authorized URIs:

**Authorized JavaScript origins:**
- Development: `http://localhost:3000`
- Production: `https://yourdomain.com` (add your actual domain)

**Authorized redirect URIs:**
- Development: `http://localhost:3000/api/auth/callback/google`
- Production: `https://yourdomain.com/api/auth/callback/google`

5. Click **Create**
6. Copy the **Client ID** and **Client Secret** - you'll need these for your `.env` file

## Step 4: Configure Environment Variables

1. Copy `.env.example` to `.env` in your project root:
```bash
cp .env.example .env
```

2. Edit `.env` and add your Google OAuth credentials:
```env
# Authentication (NextAuth.js / Auth.js)
AUTH_SECRET="your-generated-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth
AUTH_GOOGLE_ID="your-google-client-id-from-step-3"
AUTH_GOOGLE_SECRET="your-google-client-secret-from-step-3"
```

3. Generate `AUTH_SECRET`:
```bash
openssl rand -base64 32
```

Or use an online generator: https://generate-secret.vercel.app/32

## Step 5: Test Authentication

1. Start your development server:
```bash
npm run dev
```

2. Navigate to `http://localhost:3000`
3. Click **Sign In**
4. Sign in with your Google account
5. You should be redirected back to the application

## First User = Admin

The first user to sign in will automatically be assigned the **ADMIN** role and can:
- View all users
- Create/edit/delete users
- View all rounds from all users
- Create/edit/delete any round

Subsequent users will have the **USER** role and can only:
- View and edit their own profile
- Create, view, edit, and delete their own rounds

## Publishing Your App (Moving from Testing to Production)

By default, your OAuth consent screen is in "Testing" mode, which limits access to test users you've added.

To allow anyone with a Google account to sign in:

1. Go to **APIs & Services** > **OAuth consent screen**
2. Click **Publish App**
3. Review and confirm

**Note**: Publishing may require Google verification if you request sensitive scopes. Basic profile and email don't typically require verification.

## Troubleshooting

### "Access blocked: This app's request is invalid"

- Check that your redirect URI exactly matches what's configured in Google Console
- Make sure you're using `http://localhost:3000` (not `http://127.0.0.1:3000`)

### "Error 400: redirect_uri_mismatch"

- The redirect URI in your request doesn't match the authorized redirect URIs in Google Console
- Double-check the URI configuration in Step 3

### Can't see the sign-in page

- Verify `AUTH_SECRET`, `AUTH_GOOGLE_ID`, and `AUTH_GOOGLE_SECRET` are set in `.env`
- Restart your dev server after changing environment variables
- Check the browser console for errors

### Session issues

- Clear your browser cookies and local storage
- Restart the development server
- Verify `NEXTAUTH_URL` matches your actual URL

## Production Deployment

When deploying to production:

1. Update Google Cloud Console with your production domain
2. Add production URLs to authorized origins and redirect URIs
3. Update `NEXTAUTH_URL` in your production environment variables
4. Ensure `AUTH_SECRET` is different from your development secret
5. Keep `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` secure and never commit them to version control

## Security Best Practices

- Never commit `.env` files to version control
- Use different OAuth credentials for development and production
- Rotate your `AUTH_SECRET` periodically
- Monitor your Google Cloud Console for unusual activity
- Keep your dependencies up to date

## Additional Resources

- [Auth.js Documentation](https://authjs.dev/)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
