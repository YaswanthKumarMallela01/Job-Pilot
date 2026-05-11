'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabase } from '@/lib/supabase';
import type { UserPreferences, ExperienceLevel } from '@/lib/types';

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [keywords, setKeywords] = useState('');
  const [location, setLocation] = useState('');
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('any');
  const [email, setEmail] = useState('');
  const [emailDigestEnabled, setEmailDigestEnabled] = useState(true);
  const [preferEstablished, setPreferEstablished] = useState(true);
  const [prefsId, setPrefsId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const supabase = getSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      const { data } = await supabase.from('user_preferences').select('*').eq('user_id', user.id).single();
      if (data) {
        const p = data as UserPreferences;
        setPrefsId(p.id);
        setKeywords((p.keywords || []).join(', '));
        setLocation(p.location || '');
        setExperienceLevel(p.experience_level || 'any');
        setEmail(p.email || user.email || '');
        setEmailDigestEnabled(p.email_digest_enabled);
        setPreferEstablished(p.prefer_established_companies !== false);
      } else { setEmail(user.email || ''); }
      setLoading(false);
    };
    load();
  }, [router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess(false); setSaving(true);
    try {
      const supabase = getSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      const kw = keywords.split(',').map(k => k.trim()).filter(k => k.length > 0);
      const payload = { user_id: user.id, keywords: kw, location, experience_level: experienceLevel, email, email_digest_enabled: emailDigestEnabled, prefer_established_companies: preferEstablished, updated_at: new Date().toISOString() };
      if (prefsId) {
        const { error: e } = await supabase.from('user_preferences').update(payload).eq('id', prefsId);
        if (e) throw e;
      } else {
        const { data, error: e } = await supabase.from('user_preferences').insert(payload).select().single();
        if (e) throw e;
        if (data) setPrefsId((data as UserPreferences).id);
      }
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch { setError('Failed to save preferences.'); }
    finally { setSaving(false); }
  };

  if (loading) return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="skeleton h-8 w-40 mb-2" /><div className="skeleton h-4 w-64 mb-8" />
      {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-16 w-full mb-4" />)}
    </div>
  );

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white sm:text-3xl">Settings</h1>
        <p className="mt-1 text-sm text-slate-400">Configure your job search preferences and email digest</p>
      </div>
      {success && <div className="mb-6 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-400">Preferences saved!</div>}
      {error && <div className="mb-6 rounded-xl border border-rose-500/20 bg-rose-500/5 px-4 py-3 text-sm text-rose-400">{error}</div>}
      <form onSubmit={handleSave} className="space-y-6">
        <div className="rounded-2xl border border-white/[0.06] bg-[#12121f]/40 p-5">
          <label htmlFor="keywords" className="mb-1 block text-sm font-semibold text-white">Job Keywords</label>
          <p className="mb-3 text-xs text-slate-500">Comma-separated (e.g. Software Engineer, Data Analyst)</p>
          <input id="keywords" type="text" value={keywords} onChange={e => setKeywords(e.target.value)} placeholder="Software Engineer, Data Analyst" className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500/40 focus:ring-2 focus:ring-indigo-500/20" />
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-[#12121f]/40 p-5">
          <label htmlFor="location" className="mb-1 block text-sm font-semibold text-white">Location</label>
          <p className="mb-3 text-xs text-slate-500">Comma-separated (e.g. Remote, India, Bangalore)</p>
          <input id="location" type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="Remote, India" className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500/40 focus:ring-2 focus:ring-indigo-500/20" />
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-[#12121f]/40 p-5">
          <label className="mb-1 block text-sm font-semibold text-white">Experience Level</label>
          <p className="mb-3 text-xs text-slate-500">Filter jobs by your experience level</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {([
              { value: 'internship', label: '🎓 Internship' },
              { value: 'entry', label: '🌱 Entry' },
              { value: 'mid', label: '💼 Mid Level' },
              { value: 'senior', label: '🚀 Senior' },
              { value: 'any', label: '🌐 Any Level' },
            ] as { value: ExperienceLevel; label: string }[]).map(opt => (
              <button key={opt.value} type="button" onClick={() => setExperienceLevel(opt.value)}
                className={`rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                  experienceLevel === opt.value
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                    : 'bg-white/[0.03] text-slate-400 border border-white/[0.06] hover:bg-white/[0.06]'
                }`}>{opt.label}</button>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-[#12121f]/40 p-5">
          <label htmlFor="digest-email" className="mb-1 block text-sm font-semibold text-white">Digest Email</label>
          <p className="mb-3 text-xs text-slate-500">Where to receive your daily job digest</p>
          <input id="digest-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500/40 focus:ring-2 focus:ring-indigo-500/20" />
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-[#12121f]/40 p-5 flex items-center justify-between">
          <div><p className="text-sm font-semibold text-white">Email Digest</p><p className="text-xs text-slate-500 mt-0.5">Receive daily email with new job matches</p></div>
          <button type="button" onClick={() => setEmailDigestEnabled(!emailDigestEnabled)} role="switch" aria-checked={emailDigestEnabled} className={`relative inline-flex h-7 w-12 rounded-full border-2 border-transparent transition-colors ${emailDigestEnabled ? 'bg-indigo-500' : 'bg-white/10'}`}>
            <span className={`inline-block h-6 w-6 rounded-full bg-white shadow transition-transform ${emailDigestEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-[#12121f]/40 p-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-white">Prefer Established Companies</p>
            <p className="text-xs text-slate-500 mt-0.5">Prioritize jobs from well-known companies (FAANG, top tech, Indian IT leaders, unicorns)</p>
          </div>
          <button type="button" onClick={() => setPreferEstablished(!preferEstablished)} role="switch" aria-checked={preferEstablished} className={`relative inline-flex h-7 w-12 flex-shrink-0 rounded-full border-2 border-transparent transition-colors ${preferEstablished ? 'bg-indigo-500' : 'bg-white/10'}`}>
            <span className={`inline-block h-6 w-6 rounded-full bg-white shadow transition-transform ${preferEstablished ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>
        <button type="submit" disabled={saving} className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed">
          {saving ? 'Saving...' : 'Save Preferences'}
        </button>
      </form>

      {/* Danger Zone: Delete Account */}
      <div className="mt-12 rounded-2xl border border-red-500/20 bg-red-500/5 p-5">
        <h2 className="text-lg font-bold text-red-400 mb-1">Danger Zone</h2>
        <p className="text-xs text-slate-400 mb-4">Once you delete your account, all your data will be permanently removed. This cannot be undone.</p>
        <button
          onClick={async () => {
            if (!confirm('Are you sure you want to delete your account? This action is PERMANENT.')) return;
            if (!confirm('This will delete ALL your saved jobs, preferences, and email logs.')) return;
            try {
              const supabase = getSupabase();
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) return;
              const res = await fetch('/api/delete-account', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: user.id }),
              });
              if (res.ok) {
                await supabase.auth.signOut();
                router.push('/');
              } else {
                const data = await res.json();
                alert(data.error || 'Failed to delete account.');
              }
            } catch { alert('An error occurred while deleting your account.'); }
          }}
          className="rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-2.5 text-sm font-semibold text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all"
        >
          Delete My Account
        </button>
      </div>
    </div>
  );
}
