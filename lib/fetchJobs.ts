import { XMLParser } from 'fast-xml-parser';
import type { RawJob } from './types';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
});

// ─── Fetch from LinkedIn RSS ─────────────────────────────────
export async function fetchLinkedInJobs(keyword: string, location: string): Promise<RawJob[]> {
  try {
    const url = `https://www.linkedin.com/jobs/search/feed?keywords=${encodeURIComponent(keyword)}&location=${encodeURIComponent(location)}&f_TPR=r86400`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; JobPilot/1.0)' },
    });
    if (!res.ok) { console.warn(`LinkedIn RSS returned ${res.status}`); return []; }
    const xml = await res.text();
    const parsed = parser.parse(xml);
    const items = parsed?.rss?.channel?.item || parsed?.feed?.entry || [];
    const jobItems = Array.isArray(items) ? items : [items];
    return jobItems
      .filter((item: Record<string, unknown>) => item.title && item.link)
      .map((item: Record<string, unknown>) => ({
        title: String(item.title || '').trim(),
        company: String(item['dc:creator'] || item.author || 'Unknown').trim(),
        location: location,
        source: 'linkedin' as const,
        job_url: String(item.link || '').trim(),
        description: String(item.description || item.summary || '').trim().substring(0, 500),
      }));
  } catch (err) { console.error('LinkedIn RSS fetch error:', err); return []; }
}

// ─── Fetch from Indeed RSS ───────────────────────────────────
export async function fetchIndeedJobs(keyword: string, location: string): Promise<RawJob[]> {
  try {
    const url = `https://www.indeed.com/rss?q=${encodeURIComponent(keyword)}&l=${encodeURIComponent(location)}`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; JobPilot/1.0)' },
    });
    if (!res.ok) { console.warn(`Indeed RSS returned ${res.status}`); return []; }
    const xml = await res.text();
    const parsed = parser.parse(xml);
    const items = parsed?.rss?.channel?.item || [];
    const jobItems = Array.isArray(items) ? items : [items];
    return jobItems
      .filter((item: Record<string, unknown>) => item.title && item.link)
      .map((item: Record<string, unknown>) => ({
        title: String(item.title || '').trim(),
        company: String(item.source || item['dc:creator'] || 'Unknown').trim(),
        location: location,
        source: 'indeed' as const,
        job_url: String(item.link || '').trim(),
        description: String(item.description || '').trim().substring(0, 500),
      }));
  } catch (err) { console.error('Indeed RSS fetch error:', err); return []; }
}

// ─── Fetch from RemoteOK API ────────────────────────────────
export async function fetchRemoteOKJobs(keyword: string): Promise<RawJob[]> {
  try {
    const url = `https://remoteok.com/api?tag=${encodeURIComponent(keyword)}`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; JobPilot/1.0)' },
    });
    if (!res.ok) { console.warn(`RemoteOK returned ${res.status}`); return []; }
    const data = await res.json();
    const jobs = Array.isArray(data) ? data.slice(1) : [];
    return jobs
      .filter((job: Record<string, unknown>) => job.position && job.url)
      .map((job: Record<string, unknown>) => ({
        title: String(job.position || '').trim(),
        company: String(job.company || 'Unknown').trim(),
        location: String(job.location || 'Remote').trim(),
        source: 'remoteok' as const,
        job_url: String(job.url || '').trim(),
        description: String(job.description || '').trim().substring(0, 500),
      }));
  } catch (err) { console.error('RemoteOK fetch error:', err); return []; }
}

// ─── Fetch from Arbeitnow API (free, no key) ────────────────
export async function fetchArbeitnowJobs(keyword: string, location: string): Promise<RawJob[]> {
  try {
    const url = `https://www.arbeitnow.com/api/job-board-api?search=${encodeURIComponent(keyword)}&location=${encodeURIComponent(location)}`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; JobPilot/1.0)' },
    });
    if (!res.ok) { console.warn(`Arbeitnow returned ${res.status}`); return []; }
    const data = await res.json();
    const jobs = Array.isArray(data?.data) ? data.data : [];
    return jobs
      .filter((job: Record<string, unknown>) => job.title && job.url)
      .map((job: Record<string, unknown>) => ({
        title: String(job.title || '').trim(),
        company: String(job.company_name || 'Unknown').trim(),
        location: String(job.location || location).trim(),
        source: 'arbeitnow' as const,
        job_url: String(job.url || '').trim(),
        description: String(job.description || '').replace(/<[^>]*>/g, '').trim().substring(0, 500),
      }));
  } catch (err) { console.error('Arbeitnow fetch error:', err); return []; }
}

// ─── Fetch from Jobicy API (free, remote jobs) ──────────────
export async function fetchJobicyJobs(keyword: string): Promise<RawJob[]> {
  try {
    const url = `https://jobicy.com/api/v2/remote-jobs?count=20&tag=${encodeURIComponent(keyword)}`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; JobPilot/1.0)' },
    });
    if (!res.ok) { console.warn(`Jobicy returned ${res.status}`); return []; }
    const data = await res.json();
    const jobs = Array.isArray(data?.jobs) ? data.jobs : [];
    return jobs
      .filter((job: Record<string, unknown>) => job.jobTitle && job.url)
      .map((job: Record<string, unknown>) => ({
        title: String(job.jobTitle || '').trim(),
        company: String(job.companyName || 'Unknown').trim(),
        location: String(job.jobGeo || 'Remote').trim(),
        source: 'jobicy' as const,
        job_url: String(job.url || '').trim(),
        description: String(job.jobExcerpt || '').trim().substring(0, 500),
      }));
  } catch (err) { console.error('Jobicy fetch error:', err); return []; }
}

// ─── Fetch from Adzuna API (free tier, no key needed for RSS) ─
export async function fetchAdzunaJobs(keyword: string, location: string): Promise<RawJob[]> {
  try {
    // Adzuna RSS feed — works without API key
    const country = location.toLowerCase().includes('india') ? 'in'
      : location.toLowerCase().includes('uk') ? 'gb'
      : location.toLowerCase().includes('canad') ? 'ca'
      : location.toLowerCase().includes('australia') ? 'au'
      : 'us';
    const url = `https://www.adzuna.com/feed/rss?q=${encodeURIComponent(keyword)}&country=${country}`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; JobPilot/1.0)' },
    });
    if (!res.ok) { console.warn(`Adzuna returned ${res.status}`); return []; }
    const xml = await res.text();
    const parsed = parser.parse(xml);
    const items = parsed?.rss?.channel?.item || [];
    const jobItems = Array.isArray(items) ? items : [items];
    return jobItems
      .filter((item: Record<string, unknown>) => item.title && item.link)
      .map((item: Record<string, unknown>) => ({
        title: String(item.title || '').trim(),
        company: String(item['dc:creator'] || item.source || 'Unknown').trim(),
        location: location,
        source: 'adzuna' as const,
        job_url: String(item.link || '').trim(),
        description: String(item.description || '').replace(/<[^>]*>/g, '').trim().substring(0, 500),
      }));
  } catch (err) { console.error('Adzuna fetch error:', err); return []; }
}

// ─── Fetch from The Muse API (free, no key needed) ──────────
export async function fetchTheMuseJobs(keyword: string, location: string): Promise<RawJob[]> {
  try {
    const url = `https://www.themuse.com/api/public/jobs?category=${encodeURIComponent(keyword)}&location=${encodeURIComponent(location)}&page=0`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; JobPilot/1.0)' },
    });
    if (!res.ok) { console.warn(`The Muse returned ${res.status}`); return []; }
    const data = await res.json();
    const jobs = Array.isArray(data?.results) ? data.results : [];
    return jobs
      .filter((job: Record<string, unknown>) => job.name && job.refs)
      .map((job: Record<string, unknown>) => ({
        title: String(job.name || '').trim(),
        company: String((job.company as Record<string, unknown>)?.name || 'Unknown').trim(),
        location: Array.isArray(job.locations) ? (job.locations as Array<Record<string, unknown>>).map(l => String(l.name || '')).join(', ') : location,
        source: 'themuse' as const,
        job_url: String((job.refs as Record<string, unknown>)?.landing_page || '').trim(),
        description: String(job.contents || '').replace(/<[^>]*>/g, '').trim().substring(0, 500),
      }));
  } catch (err) { console.error('The Muse fetch error:', err); return []; }
}

// ─── Fetch all jobs for a user's keywords ────────────────────
export async function fetchAllJobs(keywords: string[], location: string): Promise<RawJob[]> {
  const allJobs: RawJob[] = [];

  for (const keyword of keywords) {
    const results = await Promise.all([
      fetchLinkedInJobs(keyword, location),
      fetchIndeedJobs(keyword, location),
      fetchRemoteOKJobs(keyword),
      fetchArbeitnowJobs(keyword, location),
      fetchJobicyJobs(keyword),
      fetchAdzunaJobs(keyword, location),
      fetchTheMuseJobs(keyword, location),
    ]);

    for (const jobs of results) {
      allJobs.push(...jobs);
    }
  }

  // Deduplicate by job URL
  const seen = new Set<string>();
  return allJobs.filter((job) => {
    if (seen.has(job.job_url)) return false;
    seen.add(job.job_url);
    return true;
  });
}
