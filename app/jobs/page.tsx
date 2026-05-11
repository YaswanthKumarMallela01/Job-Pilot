'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabase } from '@/lib/supabase';
import type { Job, JobStatus, JobSource } from '@/lib/types';
import FilterBar from '@/components/FilterBar';
import JobTable from '@/components/JobTable';
import JobCard from '@/components/JobCard';

export default function JobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());
  const [userId, setUserId] = useState<string | null>(null);

  // Search Jobs Now state
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<{ success: boolean; message: string } | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<JobStatus | 'all'>('all');
  const [sourceFilter, setSourceFilter] = useState<JobSource | 'all'>('all');
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');

  const fetchJobs = useCallback(async () => {
    const supabase = getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }
    setUserId(user.id);

    const { data, error } = await supabase
      .from('jobs').select('*').eq('user_id', user.id)
      .order('date_found', { ascending: false });

    if (error) { console.error('Error fetching jobs:', error); }
    else { setJobs((data as Job[]) || []); }
    setLoading(false);
  }, [router]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  // ─── Search Jobs Now ───────────────────────────────────────
  const handleSearchNow = async () => {
    if (!userId || searching) return;
    setSearching(true);
    setSearchResult(null);

    try {
      const res = await fetch('/api/search-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId }),
      });
      const data = await res.json();

      if (res.ok) {
        setSearchResult({
          success: true,
          message: `Found ${data.total_found} jobs across ${data.sources_checked} sources. ${data.new_jobs} new jobs added.${data.email_sent ? ' Email digest sent!' : ''}`,
        });
        // Refresh the job list
        await fetchJobs();
      } else {
        setSearchResult({ success: false, message: data.error || 'Search failed.' });
      }
    } catch {
      setSearchResult({ success: false, message: 'Network error. Please try again.' });
    } finally {
      setSearching(false);
    }
  };

  // ─── Status Change ─────────────────────────────────────────
  const handleStatusChange = async (jobId: string, newStatus: JobStatus) => {
    setUpdatingIds(prev => new Set(prev).add(jobId));
    const supabase = getSupabase();
    const updateData: Record<string, unknown> = { status: newStatus };
    if (newStatus === 'applied') updateData.date_applied = new Date().toISOString();

    const { error } = await supabase.from('jobs').update(updateData).eq('id', jobId);
    if (!error) {
      setJobs(prev => prev.map(job =>
        job.id === jobId ? { ...job, status: newStatus, ...(newStatus === 'applied' ? { date_applied: new Date().toISOString() } : {}) } : job
      ));
    }
    setUpdatingIds(prev => { const next = new Set(prev); next.delete(jobId); return next; });
  };

  // ─── Delete Job ───────────────────────────────────────────
  const handleDelete = async (jobId: string) => {
    try {
      const res = await fetch(`/api/jobs/${jobId}`, { method: 'DELETE' });
      if (res.ok) {
        setJobs(prev => prev.filter(job => job.id !== jobId));
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  // ─── Export to CSV ─────────────────────────────────────────
  const handleExportCSV = () => {
    const headers = ['Title', 'Company', 'Location', 'Source', 'Status', 'Date Found', 'Job URL', 'Notes'];
    const rows = filteredJobs.map(j => [
      `"${(j.title || '').replace(/"/g, '""')}"`,
      `"${(j.company || '').replace(/"/g, '""')}"`,
      `"${(j.location || '').replace(/"/g, '""')}"`,
      j.source,
      j.status,
      new Date(j.date_found).toLocaleDateString(),
      j.job_url,
      `"${(j.notes || '').replace(/"/g, '""')}"`,
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `jobpilot-export-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // ─── Filters ───────────────────────────────────────────────
  const filteredJobs = jobs.filter(job => {
    const matchesSearch = search === '' ||
      job.title.toLowerCase().includes(search.toLowerCase()) ||
      (job.company || '').toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
    const matchesSource = sourceFilter === 'all' || job.source === sourceFilter;
    return matchesSearch && matchesStatus && matchesSource;
  });

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6"><div className="skeleton h-8 w-48 mb-2" /><div className="skeleton h-4 w-72" /></div>
        <div className="skeleton h-20 w-full mb-4" />
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="skeleton h-16 w-full" />)}</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header with Search Now + Export */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white sm:text-3xl">Job Dashboard</h1>
          <p className="mt-1 text-sm text-slate-400">Track and manage your job applications in one place</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Export CSV */}
          <button onClick={handleExportCSV} disabled={filteredJobs.length === 0}
            className="inline-flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-white/[0.06] hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            title="Export filtered jobs to CSV">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export CSV
          </button>

          {/* Search Jobs Now */}
          <button onClick={handleSearchNow} disabled={searching}
            className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed transition-all">
            {searching ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                Searching...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:scale-110"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                Search Jobs Now
              </>
            )}
          </button>
        </div>
      </div>

      {/* Search result notification */}
      {searchResult && (
        <div className={`mb-6 rounded-xl border px-4 py-3 text-sm flex items-center justify-between ${
          searchResult.success
            ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400'
            : 'border-rose-500/20 bg-rose-500/5 text-rose-400'
        }`}>
          <span>{searchResult.message}</span>
          <button onClick={() => setSearchResult(null)} className="ml-3 text-current opacity-60 hover:opacity-100">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      )}

      {/* Stats row */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { label: 'Total', value: jobs.length, color: 'text-white' },
          { label: 'New', value: jobs.filter(j => j.status === 'new').length, color: 'text-sky-400' },
          { label: 'Applied', value: jobs.filter(j => j.status === 'applied').length, color: 'text-emerald-400' },
          { label: 'Interview', value: jobs.filter(j => j.status === 'interview').length, color: 'text-violet-400' },
          { label: 'Saved', value: jobs.filter(j => j.status === 'saved').length, color: 'text-amber-400' },
        ].map(stat => (
          <div key={stat.label} className="rounded-xl border border-white/[0.06] bg-[#12121f]/40 px-4 py-3">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{stat.label}</p>
            <p className={`mt-1 text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="mb-6">
        <FilterBar search={search} onSearchChange={setSearch} statusFilter={statusFilter} onStatusFilterChange={setStatusFilter}
          sourceFilter={sourceFilter} onSourceFilterChange={setSourceFilter} viewMode={viewMode} onViewModeChange={setViewMode} totalCount={filteredJobs.length} />
      </div>

      {/* Jobs display */}
      {viewMode === 'table' ? (
        <JobTable jobs={filteredJobs} onStatusChange={handleStatusChange} onDelete={handleDelete} updatingIds={updatingIds} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredJobs.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center rounded-2xl border border-white/[0.06] bg-[#12121f]/40 py-20 px-6">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="1.5"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg>
              </div>
              <p className="text-slate-400 text-sm font-medium">No jobs match your filters</p>
              <p className="text-slate-500 text-xs mt-1">Try adjusting your filters or search for new jobs</p>
            </div>
          ) : (
            filteredJobs.map(job => (
              <JobCard key={job.id} job={job} onStatusChange={handleStatusChange} onDelete={handleDelete} isUpdating={updatingIds.has(job.id)} />
            ))
          )}
        </div>
      )}
    </div>
  );
}
