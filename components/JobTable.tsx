'use client';

import type { Job, JobStatus, JobSource } from '@/lib/types';
import StatusDropdown from './StatusDropdown';
import { getCompanyTier, getCompanyTierLabel } from '@/lib/companies';

interface JobTableProps {
  jobs: Job[];
  onStatusChange: (jobId: string, status: JobStatus) => void;
  onDelete: (jobId: string) => void;
  updatingIds: Set<string>;
}

const SOURCE_BADGE: Record<JobSource, { label: string; classes: string }> = {
  linkedin: { label: 'LinkedIn', classes: 'bg-blue-500/10 text-blue-400' },
  unstop: { label: 'Unstop', classes: 'bg-rose-500/10 text-rose-400' },
  jsearch: { label: 'JSearch', classes: 'bg-emerald-500/10 text-emerald-400' },
};

function CompanyCell({ company }: { company: string | null }) {
  const name = company || 'Unknown';
  const tier = getCompanyTier(name);
  const tierInfo = getCompanyTierLabel(tier);

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-slate-400">{name}</span>
      {tier > 0 && (
        <span
          className={`text-[10px] font-bold ${tierInfo.color}`}
          title={tier === 3 ? 'Top Company' : tier === 2 ? 'Well Known' : 'Established'}
        >
          {tierInfo.label}
        </span>
      )}
    </div>
  );
}

export default function JobTable({ jobs, onStatusChange, onDelete, updatingIds }: JobTableProps) {
  if (jobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-white/[0.06] bg-[#12121f]/40 py-20 px-6">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
            <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
          </svg>
        </div>
        <p className="text-slate-400 text-sm font-medium">No jobs found</p>
        <p className="text-slate-500 text-xs mt-1">Jobs will appear here once fetched</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-white/[0.06] bg-[#12121f]/40">
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/[0.06]">
            <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Title</th>
            <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 hidden sm:table-cell">Company</th>
            <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 hidden md:table-cell">Location</th>
            <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 hidden lg:table-cell">Source</th>
            <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 hidden lg:table-cell">Date</th>
            <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
            <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Link</th>
            <th className="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-slate-500 w-12"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.04]">
          {jobs.map((job) => {
            const badge = SOURCE_BADGE[job.source] || { label: job.source, classes: 'bg-slate-500/10 text-slate-400' };
            return (
              <tr
                key={job.id}
                className="group transition-colors hover:bg-white/[0.02]"
              >
                <td className="px-5 py-4">
                  <span className="text-sm font-medium text-white">{job.title}</span>
                  <span className="block sm:hidden text-xs text-slate-500 mt-0.5">{job.company || 'Unknown'}</span>
                </td>
                <td className="px-5 py-4 hidden sm:table-cell">
                  <CompanyCell company={job.company} />
                </td>
                <td className="px-5 py-4 text-sm text-slate-400 hidden md:table-cell">{job.location || 'N/A'}</td>
                <td className="px-5 py-4 hidden lg:table-cell">
                  <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${badge.classes}`}>
                    {badge.label}
                  </span>
                </td>
                <td className="px-5 py-4 text-xs text-slate-500 hidden lg:table-cell whitespace-nowrap">
                  {new Date(job.date_found).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </td>
                <td className="px-5 py-4">
                  <StatusDropdown
                    status={job.status}
                    onStatusChange={(status) => onStatusChange(job.id, status)}
                    disabled={updatingIds.has(job.id)}
                  />
                </td>
                <td className="px-5 py-4">
                  <a
                    href={job.job_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    Open
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </a>
                </td>
                <td className="px-3 py-4 text-center">
                  <button
                    onClick={() => {
                      if (confirm('Delete this job?')) onDelete(job.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300"
                    title="Delete job"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                    </svg>
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
