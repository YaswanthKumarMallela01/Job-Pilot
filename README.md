# JobPilot — Automated Job Tracker

JobPilot automatically searches for jobs daily from LinkedIn, Indeed, and RemoteOK, stores them in a database, lets you track applications, and sends email digests. **100% Free** to deploy and use.

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-000?logo=vercel)

## Features

- **Auto-Search Daily** — Fetches jobs from LinkedIn RSS, Indeed RSS, and RemoteOK API every morning
- **Track Applications** — Mark jobs as New / Saved / Applied / Interview / Rejected
- **Email Digests** — Daily email with new job matches via Gmail SMTP
- **Analytics Dashboard** — Pie chart by source, line chart by date, stats overview
- **Auth & Privacy** — Supabase Auth with Row Level Security
- **Mobile Responsive** — Works on all screen sizes

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router) + Tailwind CSS |
| Backend | Next.js API Routes (serverless) |
| Database | Supabase (PostgreSQL) |
| Job Sources | LinkedIn RSS, Indeed RSS, RemoteOK API |
| Email | Gmail SMTP via Nodemailer |
| Scheduler | Vercel Cron Jobs |
| Deployment | Vercel (free) |
| Auth | Supabase Auth |

## Quick Start

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd jobpilot
npm install
```

### 2. Set up Supabase (Free)

1. Go to [supabase.com](https://supabase.com) → Create account → New Project
2. Go to **SQL Editor** → paste and run:

```sql
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

CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  company TEXT,
  location TEXT,
  source TEXT,
  job_url TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'new',
  date_found TIMESTAMPTZ DEFAULT NOW(),
  date_applied TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT,
  jobs_count INTEGER,
  error_message TEXT
);

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own preferences" ON user_preferences FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users see own jobs" ON jobs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users see own email logs" ON email_logs FOR ALL USING (auth.uid() = user_id);
```

3. Go to **Project Settings → API** → copy URL and keys

### 3. Set up Gmail App Password (Free)

1. Go to [myaccount.google.com](https://myaccount.google.com) → Security
2. Enable **2-Step Verification**
3. Go back to Security → **App Passwords**
4. Click "Create" → name it "JobPilot" → Generate
5. Copy the 16-character password

### 4. Configure Environment

Copy `.env.local` and fill in your values:

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

## Deploy to Vercel (Free)

1. Push to GitHub
2. Go to [vercel.com](https://vercel.com) → Import Project → select repo
3. Add all env variables in Vercel dashboard
4. Change `NEXT_PUBLIC_APP_URL` to your Vercel URL
5. Deploy — cron jobs run automatically via `vercel.json`

## Project Structure

```
jobpilot/
├── app/
│   ├── page.tsx              # Landing page
│   ├── layout.tsx            # Root layout
│   ├── login/page.tsx        # Login
│   ├── signup/page.tsx       # Signup
│   ├── jobs/page.tsx         # Job dashboard
│   ├── settings/page.tsx     # User preferences
│   ├── analytics/page.tsx    # Analytics
│   └── api/
│       ├── fetch-jobs/       # Cron job fetcher
│       ├── send-email/       # Email sender
│       └── jobs/             # CRUD API
├── components/               # UI components
├── lib/                      # Utilities
├── vercel.json              # Cron config
└── .env.local               # Environment vars
```

## Free Tier Limits

- **Supabase**: 500MB DB, 50k monthly active users
- **Gmail SMTP**: 500 emails/day
- **Vercel**: Unlimited deploys, cron jobs included
- **Job Sources**: All free, no API keys needed

---

*Built with Next.js · Supabase · Gmail SMTP · Vercel — 100% Free*
