'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabase } from '@/lib/supabase';

const POPULAR_KEYWORDS = [
  'Software Engineer', 'Data Analyst', 'Frontend Developer', 'Backend Developer',
  'Full Stack Developer', 'DevOps Engineer', 'Product Manager', 'UI/UX Designer',
  'Machine Learning', 'Data Scientist', 'Cloud Engineer', 'Mobile Developer',
  'Cybersecurity', 'QA Engineer', 'Business Analyst', 'Project Manager',
];

const POPULAR_LOCATIONS = [
  'Remote', 'India', 'United States', 'United Kingdom', 'Canada',
  'Germany', 'Bangalore', 'Mumbai', 'Delhi', 'Hyderabad',
  'New York', 'San Francisco', 'London', 'Singapore', 'Dubai',
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [customKeyword, setCustomKeyword] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [customLocation, setCustomLocation] = useState('');
  const [email, setEmail] = useState('');
  const [emailDigest, setEmailDigest] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadUser = async () => {
      const supabase = getSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      setEmail(user.email || '');
    };
    loadUser();
  }, [router]);

  const toggleKeyword = (kw: string) => {
    setSelectedKeywords(prev =>
      prev.includes(kw) ? prev.filter(k => k !== kw) : [...prev, kw]
    );
  };

  const addCustomKeyword = () => {
    const kw = customKeyword.trim();
    if (kw && !selectedKeywords.includes(kw)) {
      setSelectedKeywords(prev => [...prev, kw]);
      setCustomKeyword('');
    }
  };

  const handleFinish = async () => {
    const location = selectedLocation || customLocation;
    if (selectedKeywords.length === 0) { setError('Please select at least one job keyword.'); return; }
    if (!location) { setError('Please select or enter a location.'); return; }

    setSaving(true);
    setError('');
    try {
      const supabase = getSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      const { error: insertError } = await supabase.from('user_preferences').insert({
        user_id: user.id,
        keywords: selectedKeywords,
        location,
        email: email || user.email,
        email_digest_enabled: emailDigest,
      });

      if (insertError) throw insertError;
      router.push('/jobs');
    } catch (err) {
      console.error('Onboarding save error:', err);
      setError('Failed to save preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 h-[500px] w-[700px] rounded-full bg-gradient-to-r from-indigo-600/10 via-violet-600/10 to-fuchsia-600/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-2xl">
        {/* Progress indicator */}
        <div className="mb-8 flex items-center justify-center gap-2">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
                step >= s ? 'bg-indigo-500 text-white' : 'bg-white/[0.06] text-slate-500'
              }`}>{s}</div>
              {s < 3 && <div className={`h-0.5 w-12 rounded-full transition-all ${step > s ? 'bg-indigo-500' : 'bg-white/[0.06]'}`} />}
            </div>
          ))}
        </div>

        <div className="rounded-3xl border border-white/[0.06] bg-[#12121f]/60 p-8 shadow-2xl backdrop-blur-sm">
          {error && <div className="mb-6 rounded-xl border border-rose-500/20 bg-rose-500/5 px-4 py-3 text-sm text-rose-400">{error}</div>}

          {/* Step 1: Keywords */}
          {step === 1 && (
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">What jobs are you looking for?</h1>
              <p className="text-sm text-slate-400 mb-6">Select your target roles or add custom ones. You can change these later in Settings.</p>

              <div className="flex flex-wrap gap-2 mb-4">
                {POPULAR_KEYWORDS.map(kw => (
                  <button key={kw} onClick={() => toggleKeyword(kw)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                      selectedKeywords.includes(kw)
                        ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                        : 'bg-white/[0.04] text-slate-400 hover:bg-white/[0.08] hover:text-white border border-white/[0.06]'
                    }`}>{kw}</button>
                ))}
              </div>

              <div className="flex gap-2 mb-6">
                <input value={customKeyword} onChange={e => setCustomKeyword(e.target.value)} onKeyDown={e => e.key === 'Enter' && addCustomKeyword()}
                  placeholder="Add custom keyword..." className="flex-1 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500/40 focus:ring-2 focus:ring-indigo-500/20" />
                <button onClick={addCustomKeyword} className="rounded-xl bg-white/[0.06] px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-white/[0.1] transition-all">Add</button>
              </div>

              {selectedKeywords.length > 0 && (
                <p className="text-xs text-slate-500 mb-4">Selected: <span className="text-indigo-400">{selectedKeywords.join(', ')}</span></p>
              )}

              <button onClick={() => { setError(''); setStep(2); }} disabled={selectedKeywords.length === 0}
                className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                Continue
              </button>
            </div>
          )}

          {/* Step 2: Location */}
          {step === 2 && (
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">Where do you want to work?</h1>
              <p className="text-sm text-slate-400 mb-6">Pick a location or type your preferred one.</p>

              <div className="flex flex-wrap gap-2 mb-4">
                {POPULAR_LOCATIONS.map(loc => (
                  <button key={loc} onClick={() => { setSelectedLocation(loc); setCustomLocation(''); }}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                      selectedLocation === loc
                        ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                        : 'bg-white/[0.04] text-slate-400 hover:bg-white/[0.08] hover:text-white border border-white/[0.06]'
                    }`}>{loc}</button>
                ))}
              </div>

              <input value={customLocation} onChange={e => { setCustomLocation(e.target.value); setSelectedLocation(''); }}
                placeholder="Or type a custom location..." className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500/40 focus:ring-2 focus:ring-indigo-500/20 mb-6" />

              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm font-medium text-slate-300 hover:bg-white/[0.06] transition-all">Back</button>
                <button onClick={() => { setError(''); setStep(3); }} disabled={!selectedLocation && !customLocation}
                  className="flex-1 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Email Digest */}
          {step === 3 && (
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">Stay updated with email digests</h1>
              <p className="text-sm text-slate-400 mb-6">Get a daily summary of new job matches delivered to your inbox.</p>

              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 mb-4">
                <label htmlFor="digest-email" className="mb-2 block text-sm font-medium text-slate-300">Email for digest</label>
                <input id="digest-email" type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com" className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500/40 focus:ring-2 focus:ring-indigo-500/20" />
              </div>

              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 mb-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">Enable daily email digest</p>
                  <p className="text-xs text-slate-500 mt-0.5">Receive new jobs every morning at 9:00 AM IST</p>
                </div>
                <button type="button" onClick={() => setEmailDigest(!emailDigest)} role="switch" aria-checked={emailDigest}
                  className={`relative inline-flex h-7 w-12 rounded-full border-2 border-transparent transition-colors ${emailDigest ? 'bg-indigo-500' : 'bg-white/10'}`}>
                  <span className={`inline-block h-6 w-6 rounded-full bg-white shadow transition-transform ${emailDigest ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              {/* Summary */}
              <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-4 mb-6">
                <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-2">Your Setup Summary</p>
                <p className="text-sm text-slate-300"><span className="text-slate-500">Keywords:</span> {selectedKeywords.join(', ')}</p>
                <p className="text-sm text-slate-300"><span className="text-slate-500">Location:</span> {selectedLocation || customLocation}</p>
                <p className="text-sm text-slate-300"><span className="text-slate-500">Email Digest:</span> {emailDigest ? 'On' : 'Off'}</p>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="flex-1 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm font-medium text-slate-300 hover:bg-white/[0.06] transition-all">Back</button>
                <button onClick={handleFinish} disabled={saving}
                  className="flex-1 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                  {saving ? 'Setting up...' : 'Start Finding Jobs'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
