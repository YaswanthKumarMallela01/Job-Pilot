'use client';

import type { JobStatus, JobSource } from '@/lib/types';

interface FilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: JobStatus | 'all';
  onStatusFilterChange: (value: JobStatus | 'all') => void;
  sourceFilter: JobSource | 'all';
  onSourceFilterChange: (value: JobSource | 'all') => void;
  viewMode: 'table' | 'card';
  onViewModeChange: (mode: 'table' | 'card') => void;
  totalCount: number;
}

export default function FilterBar({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  sourceFilter,
  onSourceFilterChange,
  viewMode,
  onViewModeChange,
  totalCount,
}: FilterBarProps) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-white/[0.06] bg-[#12121f]/40 p-4 sm:p-5">
      {/* Top row: search + count */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <svg
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search by title or company..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none transition-all focus:border-indigo-500/40 focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <span className="hidden sm:inline-flex items-center rounded-lg bg-white/[0.04] px-3 py-2 text-xs font-medium text-slate-400">
          {totalCount} job{totalCount !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Bottom row: filters + view toggle */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value as JobStatus | 'all')}
          className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-sm text-slate-300 outline-none focus:border-indigo-500/40 focus:ring-2 focus:ring-indigo-500/20"
        >
          <option value="all" className="bg-[#16162a]">All Status</option>
          <option value="new" className="bg-[#16162a]">New</option>
          <option value="saved" className="bg-[#16162a]">Saved</option>
          <option value="applied" className="bg-[#16162a]">Applied</option>
          <option value="interview" className="bg-[#16162a]">Interview</option>
          <option value="rejected" className="bg-[#16162a]">Rejected</option>
        </select>

        {/* Source filter */}
        <select
          value={sourceFilter}
          onChange={(e) => onSourceFilterChange(e.target.value as JobSource | 'all')}
          className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-sm text-slate-300 outline-none focus:border-indigo-500/40 focus:ring-2 focus:ring-indigo-500/20"
        >
          <option value="all" className="bg-[#16162a]">All Sources</option>
          <option value="linkedin" className="bg-[#16162a]">LinkedIn</option>
          <option value="indeed" className="bg-[#16162a]">Indeed</option>
          <option value="remoteok" className="bg-[#16162a]">RemoteOK</option>
          <option value="arbeitnow" className="bg-[#16162a]">Arbeitnow</option>
          <option value="jobicy" className="bg-[#16162a]">Jobicy</option>
          <option value="adzuna" className="bg-[#16162a]">Adzuna</option>
          <option value="themuse" className="bg-[#16162a]">The Muse</option>
          <option value="unstop" className="bg-[#16162a]">Unstop</option>
        </select>

        {/* View mode toggle */}
        <div className="ml-auto flex items-center rounded-xl border border-white/[0.06] bg-white/[0.02] p-0.5">
          <button
            onClick={() => onViewModeChange('table')}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              viewMode === 'table'
                ? 'bg-white/[0.08] text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-300'
            }`}
            title="Table view"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" />
              <line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
          </button>
          <button
            onClick={() => onViewModeChange('card')}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              viewMode === 'card'
                ? 'bg-white/[0.08] text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-300'
            }`}
            title="Card view"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
