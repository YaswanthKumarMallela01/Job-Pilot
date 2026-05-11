// ─── Job Status ──────────────────────────────────────────────
export type JobStatus = 'new' | 'saved' | 'applied' | 'interview' | 'rejected';

// ─── Job Source ──────────────────────────────────────────────
export type JobSource = 'linkedin' | 'unstop';

// ─── Experience Level ────────────────────────────────────────
export type ExperienceLevel = 'internship' | 'entry' | 'mid' | 'senior' | 'any';

// ─── Job ─────────────────────────────────────────────────────
export interface Job {
  id: string;
  user_id: string;
  title: string;
  company: string | null;
  location: string | null;
  source: JobSource;
  job_url: string;
  description: string | null;
  notes: string | null;
  status: JobStatus;
  date_found: string;
  date_applied: string | null;
  created_at: string;
}

// ─── User Preferences ───────────────────────────────────────
export interface UserPreferences {
  id: string;
  user_id: string;
  keywords: string[];
  location: string;
  experience_level: ExperienceLevel;
  email: string;
  email_digest_enabled: boolean;
  prefer_established_companies: boolean;
  created_at: string;
  updated_at: string;
}

// ─── Email Log ───────────────────────────────────────────────
export interface EmailLog {
  id: string;
  user_id: string;
  sent_at: string;
  status: 'success' | 'failed';
  jobs_count: number;
  error_message: string | null;
}

// ─── Raw Job (before inserting into DB) ──────────────────────
export interface RawJob {
  title: string;
  company: string;
  location: string;
  source: JobSource;
  job_url: string;
  description: string;
}
