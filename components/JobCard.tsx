'use client';

import type { Job, JobStatus, JobSource } from '@/lib/types';
import StatusDropdown from './StatusDropdown';

interface JobCardProps {
  job: Job;
  onStatusChange: (jobId: string, status: JobStatus) => void;
  isUpdating?: boolean;
}

const SOURCE_BADGE: Record<JobSource, { label: string; classes: string }> = {
  linkedin: { label: 'LinkedIn', classes: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  indeed: { label: 'Indeed', classes: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  remoteok: { label: 'RemoteOK', classes: 'bg-teal-500/10 text-teal-400 border-teal-500/20' },
};

export default function JobCard({ job, onStatusChange, isUpdating }: JobCardProps) {
  const sourceBadge = SOURCE_BADGE[job.source] || {
    label: job.source,
    classes: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  };

  const dateFound = new Date(job.date_found).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="group relative rounded-2xl border border-white/[0.06] bg-[#12121f]/60 p-5 transition-all duration-300 hover:border-indigo-500/20 hover:bg-[#16162a]/80 hover:shadow-lg hover:shadow-indigo-500/[0.03]">
      {/* Top row: Source + Date */}
      <div className="mb-3 flex items-center justify-between">
        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${sourceBadge.classes}`}>
          {sourceBadge.label}
        </span>
        <span className="text-xs text-slate-500">{dateFound}</span>
      </div>

      {/* Title */}
      <h3 className="mb-1 text-base font-semibold text-white leading-tight line-clamp-2">
        {job.title}
      </h3>

      {/* Company + Location */}
      <p className="mb-3 text-sm text-slate-400">
        {job.company || 'Unknown'}{' '}
        {job.location && (
          <span className="text-slate-500">
            &bull; {job.location}
          </span>
        )}
      </p>

      {/* Description */}
      {job.description && (
        <p className="mb-4 text-xs text-slate-500 line-clamp-2 leading-relaxed">
          {job.description}
        </p>
      )}

      {/* Bottom row: Status + Link */}
      <div className="flex items-center justify-between gap-3 pt-2 border-t border-white/[0.04]">
        <StatusDropdown
          status={job.status}
          onStatusChange={(status) => onStatusChange(job.id, status)}
          disabled={isUpdating}
        />
        <a
          href={job.job_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-500/10 px-3 py-1.5 text-xs font-semibold text-indigo-400 transition-all hover:bg-indigo-500/20 hover:text-indigo-300"
        >
          View Job
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </a>
      </div>
    </div>
  );
}
