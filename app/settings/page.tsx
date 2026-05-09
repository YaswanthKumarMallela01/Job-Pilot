'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabase } from '@/lib/supabase';
import type { UserPreferences } from '@/lib/types';

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [keywords, setKeywords] = useState('');
  const [location, setLocation] = useState('');
  const [email, setEmail] = useState('');
  const [emailDigestEnabled, setEmailDigestEnabled] = useState(true);
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
        setEmail(p.email || user.email || '');
        setEmailDigestEnabled(p.email_digest_enabled);
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
      const payload = { user_id: user.id, keywords: kw, location, email, email_digest_enabled: emailDigestEnabled, updated_at: new Date().toISOString() };
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
          <p className="mb-3 text-xs text-slate-500">e.g. Remote, India, Bangalore</p>
          <input id="location" type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="Remote" className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500/40 focus:ring-2 focus:ring-indigo-500/20" />
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
        <button type="submit" disabled={saving} className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed">
          {saving ? 'Saving...' : 'Save Preferences'}
        </button>
      </form>
    </div>
  );
}
