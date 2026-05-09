'use client';

import { JobStatus } from '@/lib/types';

interface StatusDropdownProps {
  status: JobStatus;
  onStatusChange: (status: JobStatus) => void;
  disabled?: boolean;
}

const STATUS_CONFIG: Record<JobStatus, { label: string; color: string; bg: string }> = {
  new: { label: 'New', color: 'text-sky-400', bg: 'bg-sky-500/10' },
  saved: { label: 'Saved', color: 'text-amber-400', bg: 'bg-amber-500/10' },
  applied: { label: 'Applied', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  interview: { label: 'Interview', color: 'text-violet-400', bg: 'bg-violet-500/10' },
  rejected: { label: 'Rejected', color: 'text-rose-400', bg: 'bg-rose-500/10' },
};

const ALL_STATUSES: JobStatus[] = ['new', 'saved', 'applied', 'interview', 'rejected'];

export default function StatusDropdown({ status, onStatusChange, disabled }: StatusDropdownProps) {
  const config = STATUS_CONFIG[status];

  return (
    <select
      value={status}
      onChange={(e) => onStatusChange(e.target.value as JobStatus)}
      disabled={disabled}
      className={`${config.bg} ${config.color} cursor-pointer rounded-lg border border-white/[0.06] px-3 py-1.5 text-xs font-semibold uppercase tracking-wide outline-none transition-all focus:ring-2 focus:ring-indigo-500/40 disabled:cursor-not-allowed disabled:opacity-50`}
      style={{ appearance: 'auto' }}
    >
      {ALL_STATUSES.map((s) => (
        <option key={s} value={s} className="bg-[#16162a] text-slate-300">
          {STATUS_CONFIG[s].label}
        </option>
      ))}
    </select>
  );
}
