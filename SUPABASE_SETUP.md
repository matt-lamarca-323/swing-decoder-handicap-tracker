# Supabase Database Setup - Quick Reference

Your Supabase project is already set up! Here's how to get your connection string for AWS Amplify deployment.

## Your Supabase Project

**Project Reference:** `shibkbqpojebxiderrni`
**Dashboard:** https://supabase.com/dashboard/project/shibkbqpojebxiderrni

---

## Getting Your Connection String

### Step 1: Navigate to Database Settings

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard/project/shibkbqpojebxiderrni)
2. Click **Settings** (gear icon in sidebar)
3. Click **Database**
4. Scroll to **Connection String** section

### Step 2: Get Connection Pooling String (RECOMMENDED for Amplify)

1. Click the **Connection Pooling** tab
2. Mode should be: **Transaction**
3. Copy the **URI** string

**Your connection string will look like this:**
```
postgresql://postgres.shibkbqpojebxiderrni:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

**Important:** Replace `[YOUR-PASSWORD]` with your actual database password.

### Step 3: Find Your Database Password

If you don't know your database password:

1. Go to **Settings** → **Database**
2. Scroll to **Database Password**
3. Click **Reset database password** if needed
4. Copy the new password immediately (you can't view it again)

### Step 4: Construct Final DATABASE_URL

**For AWS Amplify (add connection_limit parameter):**
```
DATABASE_URL="postgresql://postgres.shibkbqpojebxiderrni:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
```

**For Local Development (use direct connection):**
```
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.shibkbqpojebxiderrni.supabase.co:5432/postgres"
```

---

## Environment Variables for AWS Amplify

When setting up AWS Amplify, you'll need these environment variables:

| Variable | Value | Where to get it |
|----------|-------|----------------|
| `DATABASE_URL` | `postgresql://postgres.shibkbqpojebxiderrni:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1` | Supabase Dashboard → Settings → Database → Connection Pooling |
| `AUTH_SECRET` | Generate with `openssl rand -base64 32` | Your terminal |
| `NEXTAUTH_URL` | Your Amplify URL (e.g., `https://main.d123.amplifyapp.com`) | Set after first Amplify deployment |
| `AUTH_GOOGLE_ID` | Your Google OAuth Client ID | Google Cloud Console |
| `AUTH_GOOGLE_SECRET` | Your Google OAuth Client Secret | Google Cloud Console |
| `GOLF_COURSE_API_KEY` | Your Golf Course API key | RapidAPI or Golf Course API provider |
| `NODE_ENV` | `production` | Just type this value |

---

## Testing Your Connection Locally

Before deploying to AWS, test your connection locally:

1. Create a `.env` file (don't commit this!)
2. Add your DATABASE_URL:
   ```env
   DATABASE_URL="postgresql://postgres.shibkbqpojebxiderrni:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
   ```
3. Run Prisma commands:
   ```bash
   # Generate Prisma Client
   npx prisma generate

   # Run migrations
   npx prisma migrate deploy

   # Test connection
   npx prisma studio
   ```

If Prisma Studio opens and shows your database tables, you're connected! ✅

---

## Common Issues

### Issue: "Can't reach database server"

**Solution:**
- Check your password is correct
- Ensure no special characters in password need URL encoding
- Verify Supabase project is not paused (go to dashboard and click "Resume" if needed)

### Issue: "Too many connections"

**Solution:**
- Use connection pooling URL (port 6543, not 5432)
- Add `connection_limit=1` parameter for serverless deployments
- Your connection string should end with: `?pgbouncer=true&connection_limit=1`

### Issue: "SSL connection required"

**Solution:**
- Add `?sslmode=require` to the end of your connection string:
  ```
  postgresql://...postgres?pgbouncer=true&connection_limit=1&sslmode=require
  ```

---

## Supabase Free Tier Limits

Your database is on the **free tier**, which includes:

- ✅ 500 MB database storage
- ✅ 1 GB file storage
- ✅ 2 GB bandwidth per month
- ✅ Unlimited API requests
- ✅ Up to 50 MB file uploads
- ✅ 7-day log retention
- ⚠️ Projects pause after 1 week of inactivity (just click "Resume" to reactivate)

**Monitoring usage:**
1. Go to [Settings → Billing & Usage](https://supabase.com/dashboard/project/shibkbqpojebxiderrni/settings/billing)
2. View current usage vs. limits
3. Upgrade to Pro ($25/month) if you exceed limits

---

## Next Steps

1. **Copy your DATABASE_URL** with pooling enabled
2. **Follow AWS_DEPLOYMENT.md** to deploy to AWS Amplify
3. **Add DATABASE_URL** to Amplify environment variables
4. **Test deployment** and verify database connectivity

---

## Quick Links

- [Your Supabase Dashboard](https://supabase.com/dashboard/project/shibkbqpojebxiderrni)
- [Database Settings](https://supabase.com/dashboard/project/shibkbqpojebxiderrni/settings/database)
- [SQL Editor](https://supabase.com/dashboard/project/shibkbqpojebxiderrni/editor)
- [Table Editor](https://supabase.com/dashboard/project/shibkbqpojebxiderrni/editor/17500?schema=public)
- [Logs](https://supabase.com/dashboard/project/shibkbqpojebxiderrni/logs/postgres-logs)
- [Billing & Usage](https://supabase.com/dashboard/project/shibkbqpojebxiderrni/settings/billing)

---

## Support

If you need help:
1. Check [Supabase Documentation](https://supabase.com/docs)
2. Ask in [Supabase Discord](https://discord.supabase.com)
3. Review Prisma + Supabase guides
4. Check the troubleshooting section in `AWS_DEPLOYMENT.md`

You're all set! 🚀
