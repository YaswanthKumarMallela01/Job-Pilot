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

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<JobStatus | 'all'>('all');
  const [sourceFilter, setSourceFilter] = useState<JobSource | 'all'>('all');
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');

  const fetchJobs = useCallback(async () => {
    const supabase = getSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push('/login');
      return;
    }

    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('user_id', user.id)
      .order('date_found', { ascending: false });

    if (error) {
      console.error('Error fetching jobs:', error);
    } else {
      setJobs((data as Job[]) || []);
    }
    setLoading(false);
  }, [router]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleStatusChange = async (jobId: string, newStatus: JobStatus) => {
    setUpdatingIds((prev) => new Set(prev).add(jobId));

    const supabase = getSupabase();
    const updateData: Record<string, unknown> = { status: newStatus };
    if (newStatus === 'applied') {
      updateData.date_applied = new Date().toISOString();
    }

    const { error } = await supabase
      .from('jobs')
      .update(updateData)
      .eq('id', jobId);

    if (error) {
      console.error('Error updating job status:', error);
    } else {
      setJobs((prev) =>
        prev.map((job) =>
          job.id === jobId
            ? { ...job, status: newStatus, ...(newStatus === 'applied' ? { date_applied: new Date().toISOString() } : {}) }
            : job
        )
      );
    }

    setUpdatingIds((prev) => {
      const next = new Set(prev);
      next.delete(jobId);
      return next;
    });
  };

  // Apply filters
  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      search === '' ||
      job.title.toLowerCase().includes(search.toLowerCase()) ||
      (job.company || '').toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
    const matchesSource = sourceFilter === 'all' || job.source === sourceFilter;
    return matchesSearch && matchesStatus && matchesSource;
  });

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <div className="skeleton h-8 w-48 mb-2" />
          <div className="skeleton h-4 w-72" />
        </div>
        <div className="skeleton h-20 w-full mb-4" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white sm:text-3xl">Job Dashboard</h1>
        <p className="mt-1 text-sm text-slate-400">
          Track and manage your job applications in one place
        </p>
      </div>

      {/* Stats row */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total', value: jobs.length, color: 'text-white' },
          { label: 'Applied', value: jobs.filter((j) => j.status === 'applied').length, color: 'text-emerald-400' },
          { label: 'Interview', value: jobs.filter((j) => j.status === 'interview').length, color: 'text-violet-400' },
          { label: 'New', value: jobs.filter((j) => j.status === 'new').length, color: 'text-sky-400' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-white/[0.06] bg-[#12121f]/40 px-4 py-3"
          >
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{stat.label}</p>
            <p className={`mt-1 text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="mb-6">
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          sourceFilter={sourceFilter}
          onSourceFilterChange={setSourceFilter}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          totalCount={filteredJobs.length}
        />
      </div>

      {/* Jobs display */}
      {viewMode === 'table' ? (
        <JobTable
          jobs={filteredJobs}
          onStatusChange={handleStatusChange}
          updatingIds={updatingIds}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredJobs.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center rounded-2xl border border-white/[0.06] bg-[#12121f]/40 py-20 px-6">
              <p className="text-slate-400 text-sm font-medium">No jobs match your filters</p>
            </div>
          ) : (
            filteredJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onStatusChange={handleStatusChange}
                isUpdating={updatingIds.has(job.id)}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
