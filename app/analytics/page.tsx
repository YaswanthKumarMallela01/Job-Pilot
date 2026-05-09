'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabase } from '@/lib/supabase';
import type { Job } from '@/lib/types';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const PIE_COLORS = ['#6366f1', '#8b5cf6', '#14b8a6'];

export default function AnalyticsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const supabase = getSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      const { data } = await supabase.from('jobs').select('*').eq('user_id', user.id);
      setJobs((data as Job[]) || []);
      setLoading(false);
    };
    load();
  }, [router]);

  if (loading) return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="skeleton h-8 w-40 mb-8" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-24" />)}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="skeleton h-80" /><div className="skeleton h-80" />
      </div>
    </div>
  );

  const totalJobs = jobs.length;
  const appliedJobs = jobs.filter(j => j.status === 'applied').length;
  const interviewJobs = jobs.filter(j => j.status === 'interview').length;
  const savedJobs = jobs.filter(j => j.status === 'saved').length;

  // Pie chart: jobs by source
  const sourceMap: Record<string, number> = {};
  jobs.forEach(j => { sourceMap[j.source] = (sourceMap[j.source] || 0) + 1; });
  const pieData = Object.entries(sourceMap).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }));

  // Line chart: jobs per day (last 14 days)
  const dayMap: Record<string, number> = {};
  jobs.forEach(j => {
    const day = new Date(j.date_found).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    dayMap[day] = (dayMap[day] || 0) + 1;
  });
  const lineData = Object.entries(dayMap)
    .map(([date, count]) => ({ date, count }))
    .slice(-14);

  const stats = [
    { label: 'Total Found', value: totalJobs, color: 'text-white', bg: 'bg-indigo-500/10' },
    { label: 'Applied', value: appliedJobs, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Interviews', value: interviewJobs, color: 'text-violet-400', bg: 'bg-violet-500/10' },
    { label: 'Saved', value: savedJobs, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white sm:text-3xl">Analytics</h1>
        <p className="mt-1 text-sm text-slate-400">Insights into your job search activity</p>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-8">
        {stats.map(s => (
          <div key={s.label} className="rounded-2xl border border-white/[0.06] bg-[#12121f]/40 p-5">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{s.label}</p>
            <p className={`mt-2 text-3xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pie Chart */}
        <div className="rounded-2xl border border-white/[0.06] bg-[#12121f]/40 p-6">
          <h2 className="mb-4 text-base font-semibold text-white">Jobs by Source</h2>
          {pieData.length === 0 ? (
            <p className="text-sm text-slate-500 py-20 text-center">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value" stroke="none">
                  {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#1e1e36', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, color: '#e0e0f0', fontSize: 13 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
          {/* Legend */}
          <div className="flex flex-wrap justify-center gap-4 mt-2">
            {pieData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-2 text-xs text-slate-400">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                {d.name} ({d.value})
              </div>
            ))}
          </div>
        </div>

        {/* Line Chart */}
        <div className="rounded-2xl border border-white/[0.06] bg-[#12121f]/40 p-6">
          <h2 className="mb-4 text-base font-semibold text-white">Jobs Found Per Day</h2>
          {lineData.length === 0 ? (
            <p className="text-sm text-slate-500 py-20 text-center">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ background: '#1e1e36', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, color: '#e0e0f0', fontSize: 13 }} />
                <Line type="monotone" dataKey="count" stroke="#818cf8" strokeWidth={2.5} dot={{ fill: '#818cf8', r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
