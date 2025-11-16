# AWS Deployment Guide - Swing Decoder Handicap Tracker

This guide walks you through deploying the Swing Decoder Handicap Tracker to AWS using AWS Amplify with automated CI/CD.

## Architecture Overview

- **Hosting**: AWS Amplify (Serverless Next.js with SSR)
- **Database**: Supabase PostgreSQL (managed)
- **CI/CD**: GitHub Actions + AWS Amplify auto-deploy
- **Custom Domain**: Your domain with automatic SSL
- **Estimated Cost**: $15-30/month for low traffic (or FREE with Supabase free tier!)

---

## Prerequisites

Before you begin, ensure you have:

1. **AWS Account** with billing enabled
2. **GitHub Repository** for this project
3. **Custom Domain** (optional, can be added later)
4. **Google OAuth Credentials** (already set up)
5. **AWS CLI** installed locally (optional but recommended)

---

## Step 1: Configure Supabase Database

You're already using Supabase! This is much simpler and more cost-effective than setting up RDS.

### 1.1 Get Your Supabase Connection String

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard/project/shibkbqpojebxiderrni)
2. Click **Settings** (gear icon) → **Database**
3. Scroll to **Connection String** section

### 1.2 Choose the Right Connection String

Supabase provides two connection strings:

**For Amplify Deployment (Connection Pooling - RECOMMENDED):**
```
postgresql://postgres.[project-ref]:[password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

**For Local Development or Direct Connection:**
```
postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
```

### 1.3 Copy Your Connection String

1. Click **Connection Pooling** tab
2. Mode: **Transaction** (recommended for serverless)
3. Copy the **URI** connection string
4. Replace `[YOUR-PASSWORD]` with your actual database password

**Your final DATABASE_URL will look like:**
```
DATABASE_URL="postgresql://postgres.shibkbqpojebxiderrni:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
```

### 1.4 Verify Database is Ready

Your Supabase database is already set up! No additional configuration needed.

**Supabase Free Tier Includes:**
- 500 MB database space
- 1 GB file storage
- 50 MB file uploads
- 2 GB bandwidth
- Social OAuth providers
- Auto-generated APIs
- Realtime subscriptions

**Perfect for:**
- Development
- Small production apps (< 10,000 users)
- MVP launches

---

## Step 2: Set Up AWS Amplify Hosting

### 2.1 Navigate to Amplify Console

1. Go to AWS Amplify in AWS Console
2. Click **New app** → **Host web app**

### 2.2 Connect GitHub Repository

1. Select **GitHub** as source
2. Authenticate with GitHub
3. Select your repository: `swing-decoder-handicap-tracker`
4. Select branch: `main`
5. Click **Next**

### 2.3 Configure Build Settings

Amplify should auto-detect the `amplify.yml` file. Verify it matches:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
        - npx prisma generate
    build:
      commands:
        - npx prisma migrate deploy
        - npm run build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
      - .next/cache/**/*
```

**App name:** `swing-handicap-tracker`

Click **Next**

### 2.4 Add Environment Variables

Before deploying, add all required environment variables:

1. Click **Advanced settings**
2. Add the following environment variables:

| Key | Value | Notes |
|-----|-------|-------|
| `DATABASE_URL` | Your Supabase connection string from Step 1.3 | Keep secure |
| `AUTH_SECRET` | Generate with `openssl rand -base64 32` | Keep secure |
| `NEXTAUTH_URL` | Leave empty for now (will update after deployment) | |
| `AUTH_GOOGLE_ID` | Your Google OAuth Client ID | From Google Console |
| `AUTH_GOOGLE_SECRET` | Your Google OAuth Client Secret | Keep secure |
| `GOLF_COURSE_API_KEY` | Your Golf Course API key | Keep secure |
| `NODE_ENV` | `production` | |

**To generate AUTH_SECRET:**
```bash
openssl rand -base64 32
```

3. Click **Next**
4. Review settings
5. Click **Save and deploy**

### 2.5 Initial Deployment

- Amplify will start building and deploying
- This takes 5-10 minutes for the first deployment
- Monitor the build logs for any errors

Once deployed, you'll get an Amplify URL like:
```
https://main.d1234abcd5678.amplifyapp.com
```

### 2.6 Update NEXTAUTH_URL

1. Go to **App settings** → **Environment variables**
2. Edit `NEXTAUTH_URL` to your Amplify URL:
   ```
   NEXTAUTH_URL=https://main.d1234abcd5678.amplifyapp.com
   ```
3. Save and redeploy

---

## Step 3: Update Google OAuth Settings

### 3.1 Add Authorized Redirect URI

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Select your OAuth 2.0 Client ID
3. Add to **Authorized redirect URIs**:
   ```
   https://main.d1234abcd5678.amplifyapp.com/api/auth/callback/google
   ```
   (Replace with your actual Amplify URL)

### 3.2 Add Authorized JavaScript Origins

Add to **Authorized JavaScript origins**:
```
https://main.d1234abcd5678.amplifyapp.com
```

4. Click **Save**

---

## Step 4: Set Up Custom Domain (Optional)

### 4.1 Add Domain in Amplify

1. In Amplify Console, go to **Domain management**
2. Click **Add domain**
3. Enter your domain (e.g., `swingdecoder.com`)
4. Choose subdomain (e.g., `app.swingdecoder.com`)
5. Click **Configure domain**

### 4.2 Update DNS Records

Amplify will provide DNS records. In your domain registrar:

**For subdomain (e.g., app.swingdecoder.com):**
- Type: CNAME
- Name: `app`
- Value: (provided by Amplify)

**For root domain (e.g., swingdecoder.com):**
- Type: A or ANAME
- Name: `@`
- Value: (provided by Amplify)

### 4.3 Wait for SSL Certificate

- Amplify automatically provisions SSL certificate
- Takes 10-30 minutes
- Domain status will change to **Available**

### 4.4 Update Environment Variables

1. Update `NEXTAUTH_URL` in Amplify environment variables:
   ```
   NEXTAUTH_URL=https://app.swingdecoder.com
   ```
2. Save and redeploy

### 4.5 Update Google OAuth Again

Add your custom domain to Google OAuth settings:

**Authorized redirect URIs:**
```
https://app.swingdecoder.com/api/auth/callback/google
```

**Authorized JavaScript origins:**
```
https://app.swingdecoder.com
```

---

## Step 5: Enable Automated Deployments

### 5.1 Configure Auto-Deploy

Amplify automatically deploys when you push to the `main` branch.

**Test the auto-deploy:**
1. Make a small change to your code
2. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Test auto-deploy"
   git push origin main
   ```
3. Amplify will automatically detect the change and deploy

### 5.2 Set Up Branch Deployments (Optional)

For staging environment:

1. Create a `staging` branch
2. In Amplify Console, click **Connect branch**
3. Select `staging` branch
4. Use different environment variables for staging

---

## Step 6: Verify Deployment

### 6.1 Test Core Functionality

Visit your deployed app and test:

1. **Homepage loads correctly**
2. **Sign in with Google OAuth**
   - Should redirect to Google
   - Should create/link account
   - Should redirect back to app
3. **Create a golf round**
4. **View rounds list**
5. **View statistics page**
6. **Test admin mode toggle** (if you're admin)
7. **Test all CRUD operations**

### 6.2 Check Database Migrations

Verify Prisma migrations ran successfully:

1. Check Amplify build logs
2. Look for "Running database migrations" message
3. Verify no migration errors

### 6.3 Monitor Application Logs

1. In Amplify Console, go to **Monitoring**
2. View CloudWatch logs
3. Check for any runtime errors

---

## Step 7: Set Up Monitoring and Alerts

### 7.1 CloudWatch Alarms

Create alarms for:

1. **High Error Rate**
   - Metric: 5xx errors
   - Threshold: > 10 errors in 5 minutes

2. **Low Request Rate** (for detecting downtime)
   - Metric: Request count
   - Threshold: < 1 request in 15 minutes

### 7.2 AWS Budgets

Set up budget alerts:

1. Go to AWS Budgets
2. Create budget for $50/month
3. Alert at 80% and 100%

---

## Step 8: Production Checklist

Before going live, ensure:

- [ ] Supabase database is accessible and not paused
- [ ] Database backups are enabled in Supabase (auto-enabled)
- [ ] All environment variables are set correctly in Amplify
- [ ] Using connection pooling DATABASE_URL for production
- [ ] Google OAuth is configured with production URLs
- [ ] Custom domain is working with SSL
- [ ] Auto-deploy is working from GitHub
- [ ] Error monitoring is set up (CloudWatch)
- [ ] Budget alerts are configured
- [ ] All tests pass locally
- [ ] Authentication flow works end-to-end
- [ ] All CRUD operations work
- [ ] Admin mode works correctly
- [ ] Mobile responsiveness is tested
- [ ] Supabase usage is within free tier limits (or upgraded to Pro)

---

## Deployment Commands Reference

### Local Development
```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Seed database
npm run db:seed

# Start dev server
npm run dev
```

### Production Deployment
```bash
# Prisma migrations (runs automatically in Amplify)
npx prisma migrate deploy

# Build for production
npm run build

# Start production server
npm start
```

---

## Troubleshooting

### Build Fails with Database Error

**Problem:** Prisma can't connect to database during build

**Solution:**
1. Verify `DATABASE_URL` is correct in environment variables
2. Use the **Connection Pooling** string from Supabase (port 6543)
3. Ensure password doesn't contain special characters that need URL encoding
4. Check Supabase project is not paused (free tier pauses after 1 week of inactivity)
5. Verify database password is correct

### OAuth Redirect Error

**Problem:** "Error 400: redirect_uri_mismatch"

**Solution:**
1. Verify Google OAuth redirect URI exactly matches deployment URL
2. Include `/api/auth/callback/google` path
3. Check for http vs https
4. Wait a few minutes after updating Google Console

### App Loads but Can't Connect to Database

**Problem:** 500 errors when accessing API routes

**Solution:**
1. Check CloudWatch logs for database connection errors
2. Verify `DATABASE_URL` includes correct connection parameters
3. Test database connectivity from Supabase Dashboard
4. Wake up Supabase project if it's paused (click "Resume" in dashboard)
5. Try switching between pooled and direct connection string
6. Check connection limit in DATABASE_URL (set to 1 for serverless)

### Migrations Fail During Build

**Problem:** Prisma migrate fails

**Solution:**
1. Ensure migrations directory is committed to git
2. Run `npx prisma migrate deploy` locally first
3. Check database permissions
4. Verify database schema exists

### Image Load Errors

**Problem:** Google profile images don't load

**Solution:**
1. Verify `next.config.js` includes `lh3.googleusercontent.com` in image domains
2. Redeploy after config change

---

## Cost Optimization

### Current Estimated Costs (Low Traffic)

| Service | Cost/Month |
|---------|------------|
| AWS Amplify (build minutes + hosting) | $15-30 |
| Supabase PostgreSQL (Free tier) | $0 |
| Data transfer | $1-5 |
| **Total** | **$16-35/month** |

**Supabase Free Tier is FREE until you exceed:**
- 500 MB database
- 1 GB file storage
- 2 GB bandwidth

**Supabase Pro ($25/month) includes:**
- 8 GB database
- 100 GB file storage
- 250 GB bandwidth
- Daily backups
- No pausing

### Ways to Reduce Costs

1. **Stay on Supabase free tier** - Perfect for < 10k users
2. **Optimize images** - Reduce bandwidth costs
3. **Enable Amplify build caching** - Reduce build minutes
4. **Use branch deployments wisely** - Each branch counts as a deployment
5. **Monitor Supabase usage** - Upgrade to Pro only when needed

---

## Scaling for Higher Traffic

If you exceed 10,000 users/month, consider:

1. **Upgrade to Supabase Pro** ($25/month) for more resources
2. **Use Supabase Edge Functions** for compute-heavy tasks
3. **Use Amazon CloudFront CDN** for static assets
4. **Enable Supabase connection pooling** (already recommended)
5. **Monitor database performance** in Supabase Dashboard
6. **Consider Supabase Team/Enterprise** for > 100k users

---

## Security Best Practices

### Database Security
- [ ] Use strong Supabase database password (20+ characters)
- [ ] Enable Row Level Security (RLS) policies in Supabase (optional)
- [ ] Use connection pooling for production
- [ ] Enable Supabase's built-in encryption (enabled by default)
- [ ] Monitor database activity in Supabase Dashboard
- [ ] Rotate database password quarterly

### Application Security
- [ ] Use strong `AUTH_SECRET` (32+ characters)
- [ ] Store secrets in AWS Secrets Manager (advanced)
- [ ] Enable HTTPS only (handled by Amplify)
- [ ] Implement rate limiting for API routes
- [ ] Monitor CloudWatch logs for suspicious activity
- [ ] Keep dependencies up to date

### Environment Variables
- [ ] Never commit `.env` files to git
- [ ] Use different secrets for dev/staging/prod
- [ ] Rotate secrets regularly
- [ ] Audit who has access to environment variables

---

## Backup and Disaster Recovery

### Database Backups

**Supabase Free Tier:**
- Automatic daily backups (7-day retention)
- No point-in-time recovery
- Can export database via pg_dump

**Supabase Pro ($25/month):**
- Daily backups with 7-day retention
- Point-in-time recovery
- Automated backups

**Manual Backup (Export Data):**
1. Go to Supabase Dashboard → Database → Backups
2. Click **Download** to export SQL dump
3. Or use pg_dump:
```bash
# Using Supabase CLI
npx supabase db dump -f backup.sql

# Or using pg_dump directly
pg_dump "postgresql://postgres:[password]@db.shibkbqpojebxiderrni.supabase.co:5432/postgres" > backup-$(date +%Y%m%d).sql
```

### Application Rollback

If a deployment breaks:

1. In Amplify Console, go to build history
2. Find last working build
3. Click **Redeploy this version**

Or rollback via git:
```bash
git revert HEAD
git push origin main
```

---

## Maintenance

### Regular Tasks

**Weekly:**
- [ ] Review CloudWatch logs for errors
- [ ] Check application performance
- [ ] Review cost and usage reports
- [ ] Check Supabase usage dashboard (ensure within free tier)
- [ ] Keep Supabase project active (free tier pauses after 1 week of inactivity)

**Monthly:**
- [ ] Review security alerts
- [ ] Update dependencies (`npm update`)
- [ ] Test backup restoration
- [ ] Review database performance metrics

**Quarterly:**
- [ ] Rotate database password
- [ ] Rotate AUTH_SECRET
- [ ] Review and optimize costs
- [ ] Update to latest Next.js version

---

## Additional Resources

- [AWS Amplify Documentation](https://docs.aws.amazon.com/amplify/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Prisma Deployment](https://www.prisma.io/docs/guides/deployment)
- [RDS Best Practices](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_BestPractices.html)
- [NextAuth.js Deployment](https://next-auth.js.org/deployment)

---

## Support

If you encounter issues:

1. Check Amplify build logs in AWS Console
2. Review CloudWatch logs for runtime errors
3. Verify all environment variables are set
4. Test database connectivity
5. Check Google OAuth configuration
6. Review this documentation for troubleshooting steps

---

## Summary

You've successfully deployed the Swing Decoder Handicap Tracker to AWS! Your application is now:

✅ Hosted on AWS Amplify with auto-scaling
✅ Connected to Supabase PostgreSQL database
✅ Auto-deploying from GitHub
✅ Secured with SSL/TLS
✅ Using custom domain (if configured)
✅ Monitored with CloudWatch
✅ Backed up automatically (Supabase)
✅ **Running on free tier!** (Supabase Free + Amplify ~$15-30/month)

**Next Steps:**
- Invite users to test the application
- Monitor performance and costs
- Set up additional environments (staging, dev)
- Implement additional features
- Scale as needed based on usage

Happy tracking! ⛳
