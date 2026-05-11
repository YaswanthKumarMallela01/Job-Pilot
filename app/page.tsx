import Link from 'next/link';

const FEATURES = [
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
    title: 'LinkedIn + Unstop Search',
    description: 'Fetches jobs from LinkedIn and Unstop with experience-level filtering — the two best sources for jobs in India.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
        <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
      </svg>
    ),
    title: 'Track Applications',
    description: 'Mark jobs as Applied, Interview, Saved, or Rejected. See your entire pipeline at a glance.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
    ),
    title: 'Email Digests',
    description: 'Get a clean daily email with your new matches. No spam, just relevant jobs in your inbox.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
    title: 'Analytics Dashboard',
    description: 'Visualize your job search — see trends by source, status breakdowns, and daily activity.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    title: 'Private & Secure',
    description: 'Your data stays yours. Row-level security ensures only you can access your job list.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 12 20 22 4 22 4 12" />
        <rect x="2" y="7" width="20" height="5" />
        <line x1="12" y1="22" x2="12" y2="7" />
        <path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z" />
        <path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z" />
      </svg>
    ),
    title: '100% Free',
    description: 'Built on free-tier services — Supabase, Vercel, Gmail SMTP. No credit card needed.',
  },
];

export default function LandingPage() {
  return (
    <div className="relative overflow-hidden">
      {/* ─── Background glow ──────────────────────────────── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[600px] w-[800px] rounded-full bg-gradient-to-r from-indigo-600/20 via-violet-600/15 to-fuchsia-600/10 blur-3xl animate-glow-pulse" />
        <div className="absolute top-[60%] -left-40 h-[400px] w-[400px] rounded-full bg-indigo-700/10 blur-3xl" />
        <div className="absolute top-[70%] -right-40 h-[400px] w-[400px] rounded-full bg-violet-700/10 blur-3xl" />
      </div>

      {/* ─── Hero Section ─────────────────────────────────── */}
      <section className="relative mx-auto max-w-5xl px-4 py-24 sm:py-36 text-center">
        {/* Badge */}
        <div className="animate-fade-in-up mb-8 inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/5 px-4 py-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-medium text-indigo-300">Free &amp; Open Source</span>
        </div>

        {/* Headline */}
        <h1 className="animate-fade-in-up-delay-1 text-4xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl leading-[1.1]">
          Automate your job search.
          <br />
          <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent animate-gradient">
            Focus on preparing.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="animate-fade-in-up-delay-2 mx-auto mt-6 max-w-2xl text-lg text-slate-400 leading-relaxed sm:text-xl">
        JobPilot searches LinkedIn and Unstop every morning with smart relevance matching — filters out irrelevant results, prioritizes top companies, tracks your applications, and delivers a clean daily digest to your inbox.
      </p>

        {/* CTAs */}
        <div className="animate-fade-in-up-delay-3 mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/signup"
            className="group relative inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-600 px-8 py-3.5 text-sm font-semibold text-white shadow-xl shadow-indigo-500/25 transition-all hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98]"
          >
            Get Started Free
            <svg className="ml-2 transition-transform group-hover:translate-x-0.5" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.03] px-8 py-3.5 text-sm font-semibold text-slate-300 transition-all hover:bg-white/[0.06] hover:text-white"
          >
            Log In
          </Link>
        </div>

        {/* Trust badges */}
        <div className="mt-16 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            No credit card
          </span>
          <span className="flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            Smart relevance filtering
          </span>
          <span className="flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            Daily email digest
          </span>
        </div>
      </section>

      {/* ─── Features Grid ────────────────────────────────── */}
      <section className="relative mx-auto max-w-6xl px-4 pb-32">
        <div className="mb-12 text-center">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">Everything you need to land your next role</h2>
          <p className="mt-3 text-slate-400">Powerful features, zero cost.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, i) => (
            <div
              key={i}
              className="group relative rounded-2xl border border-white/[0.06] bg-[#12121f]/40 p-6 transition-all duration-300 hover:border-indigo-500/20 hover:bg-[#16162a]/60 hover:shadow-lg hover:shadow-indigo-500/[0.03]"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 transition-colors group-hover:bg-indigo-500/15">
                {feature.icon}
              </div>
              <h3 className="mb-2 text-base font-semibold text-white">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-slate-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Footer ───────────────────────────────────────── */}
      <footer className="border-t border-white/[0.06] py-8 text-center text-xs text-slate-500">
        Built with Next.js &middot; Supabase &middot; Gmail SMTP &middot; Vercel — 100% Free
      </footer>
    </div>
  );
}
