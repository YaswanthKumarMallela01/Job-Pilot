# JobPilot — Automated Job Tracker

JobPilot automatically searches for jobs daily from **7 sources** (LinkedIn, Indeed, RemoteOK, Arbeitnow, Jobicy, Adzuna, The Muse), stores them in a database, lets you track applications, and sends email digests. **100% Free** to deploy and use.

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-000?logo=vercel)

## Features

- **7 Job Sources** — LinkedIn, Indeed, RemoteOK, Arbeitnow, Jobicy, Adzuna, The Muse
- **Search Jobs Now** — Manual search button to fetch jobs on demand
- **Auto-Search Daily** — Cron job fetches jobs every morning at 9:00 AM IST
- **Track Applications** — Mark jobs as New / Saved / Applied / Interview / Rejected
- **Email Digests** — Daily email with new job matches via Gmail SMTP
- **Onboarding Wizard** — 3-step setup for new users (keywords, location, email)
- **Export to CSV** — Download your job list as a spreadsheet
- **Analytics Dashboard** — Pie chart by source, line chart by date, stats overview
- **Auth & Privacy** — Supabase Auth with Row Level Security
- **Mobile Responsive** — Works on all screen sizes

## Quick Start

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd jobpilot
npm install
```

### 2. Set up Supabase (Free)

1. Go to [supabase.com](https://supabase.com) → Create account → New Project
2. Go to **SQL Editor** → paste and run this schema:

```sql
-- User preferences
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  keywords TEXT[],
  location TEXT,
  email TEXT,
  email_digest_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Jobs table
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  company TEXT,
  location TEXT,
  source TEXT,
  job_url TEXT NOT NULL,
  description TEXT,
  notes TEXT,
  status TEXT DEFAULT 'new',
  date_found TIMESTAMPTZ DEFAULT NOW(),
  date_applied TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email logs
CREATE TABLE email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT,
  jobs_count INTEGER,
  error_message TEXT
);

-- Enable Row Level Security
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users see own preferences" ON user_preferences FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users see own jobs" ON jobs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users see own email logs" ON email_logs FOR ALL USING (auth.uid() = user_id);
```

> **If you already had the old schema**, run this migration to add the `notes` column:
> ```sql
> ALTER TABLE jobs ADD COLUMN IF NOT EXISTS notes TEXT;
> ```

3. Go to **Project Settings → API** → copy URL and keys

### 3. Set up Gmail App Password (Free)

1. Go to [myaccount.google.com](https://myaccount.google.com) → Security
2. Enable **2-Step Verification**
3. Go back to Security → **App Passwords**
4. Click "Create" → name it "JobPilot" → Generate
5. Copy the 16-character password

### 4. Configure Environment

Edit `.env.local` with your values:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
GMAIL_USER=your_gmail@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
RECIPIENT_EMAIL=your_email@example.com
CRON_SECRET=your_random_secret_string
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deploy to Vercel (Free) — Step by Step

Follow these steps to deploy JobPilot so anyone can access it:

### Step 1: Push to GitHub

```bash
cd jobpilot
git init
git add .
git commit -m "Initial commit - JobPilot"
```

Then create a new repository on [github.com](https://github.com/new) and push:

```bash
git remote add origin https://github.com/YOUR_USERNAME/jobpilot.git
git branch -M main
git push -u origin main
```

### Step 2: Create Vercel Account

1. Go to [vercel.com](https://vercel.com) and sign up with your GitHub account (it's free)
2. Click **"Add New..."** → **"Project"**

### Step 3: Import Your Repository

1. In the Vercel dashboard, you'll see your GitHub repositories listed
2. Find **jobpilot** and click **"Import"**
3. Vercel will auto-detect it as a Next.js project

### Step 4: Configure Environment Variables

Before clicking Deploy, you MUST add your environment variables:

1. Scroll down to **"Environment Variables"**
2. Add each variable one by one:

| Variable Name | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key |
| `GMAIL_USER` | Your Gmail address |
| `GMAIL_APP_PASSWORD` | Your 16-char app password |
| `RECIPIENT_EMAIL` | Email for digest delivery |
| `CRON_SECRET` | Any random string (e.g. `my-secret-key-123`) |
| `NEXT_PUBLIC_APP_URL` | `https://your-project.vercel.app` (update after first deploy) |

3. Click **"Deploy"**

### Step 5: Get Your URL

1. After deployment completes (usually 1-2 minutes), Vercel gives you a URL like:
   `https://jobpilot-abc123.vercel.app`
2. Go back to **Settings → Environment Variables**
3. Update `NEXT_PUBLIC_APP_URL` to your actual Vercel URL
4. Click **"Redeploy"** from the Deployments tab

### Step 6: Update Supabase Auth Redirect URL

1. Go to your Supabase dashboard → **Authentication → URL Configuration**
2. Add your Vercel URL to **Redirect URLs**:
   `https://your-project.vercel.app/**`

### Step 7: Verify Cron Jobs

The `vercel.json` file configures a daily cron job that runs at 9:00 AM IST (3:30 AM UTC).
- Cron jobs are included free on Vercel's Hobby plan
- You can verify it's configured in **Vercel Dashboard → Settings → Cron Jobs**

### Step 8: Share Your Link!

Your JobPilot is now live! Share the Vercel URL with anyone searching for jobs.

---

## Free Tier Limits

| Service | Limit |
|---------|-------|
| Supabase | 500MB DB, 50k monthly active users |
| Gmail SMTP | 500 emails/day |
| Vercel | Unlimited deploys, cron jobs included |
| Job Sources | All 7 sources free, no API keys needed |

---

*Built with Next.js · Supabase · Gmail SMTP · Vercel — 100% Free*
