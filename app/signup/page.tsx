'use client';

import { useState } from 'react';
import Link from 'next/link';
import { getSupabase } from '@/lib/supabase';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }

    setLoading(true);
    try {
      const supabase = getSupabase();
      const { error: authError } = await supabase.auth.signUp({ email, password });
      if (authError) {
        // Handle Supabase email rate limit
        if (authError.message.toLowerCase().includes('rate limit') || authError.message.toLowerCase().includes('email rate')) {
          setError('Email rate limit reached. Please wait a few minutes and try again, or ask the admin to increase the rate limit in Supabase Dashboard → Authentication → Rate Limits.');
        } else {
          setError(authError.message);
        }
        return;
      }
      setEmailSent(true);
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Show verification message after successful signup
  if (emailSent) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[600px] rounded-full bg-emerald-600/10 blur-3xl" />
        </div>
        <div className="relative w-full max-w-md">
          <div className="rounded-3xl border border-white/[0.06] bg-[#12121f]/60 p-8 shadow-2xl backdrop-blur-sm text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Check your email</h1>
            <p className="text-sm text-slate-400 mb-4 leading-relaxed">
              We&apos;ve sent a verification link to<br />
              <span className="text-indigo-400 font-medium">{email}</span>
            </p>
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-300 mb-6">
              <p className="font-medium mb-1">Please verify your email to continue</p>
              <p className="text-xs text-amber-400/70">Check your spam folder if you don&apos;t see it within a few minutes.</p>
            </div>
            <Link href="/login" className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 hover:brightness-110 transition-all">
              Go to Login
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[600px] rounded-full bg-violet-600/10 blur-3xl" />
      </div>
      <div className="relative w-full max-w-md">
        <div className="rounded-3xl border border-white/[0.06] bg-[#12121f]/60 p-8 shadow-2xl backdrop-blur-sm">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 shadow-lg shadow-violet-500/20">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
            </div>
            <h1 className="text-2xl font-bold text-white">Create your account</h1>
            <p className="mt-2 text-sm text-slate-400">Start automating your job search today</p>
          </div>
          {error && <div className="mb-6 rounded-xl border border-rose-500/20 bg-rose-500/5 px-4 py-3 text-sm text-rose-400">{error}</div>}
          <form onSubmit={handleSignup} className="space-y-5">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-300">Email</label>
              <input id="email" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500/40 focus:ring-2 focus:ring-indigo-500/20" />
            </div>
            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-300">Password</label>
              <input id="password" type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500/40 focus:ring-2 focus:ring-indigo-500/20" />
            </div>
            <div>
              <label htmlFor="confirm-password" className="mb-1.5 block text-sm font-medium text-slate-300">Confirm Password</label>
              <input id="confirm-password" type="password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500/40 focus:ring-2 focus:ring-indigo-500/20" />
            </div>
            <button type="submit" disabled={loading} className="w-full rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? <span className="inline-flex items-center gap-2"><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Creating account...</span> : 'Sign Up'}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-400">Already have an account?{' '}<Link href="/login" className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors">Log in</Link></p>
        </div>
      </div>
    </div>
  );
}
