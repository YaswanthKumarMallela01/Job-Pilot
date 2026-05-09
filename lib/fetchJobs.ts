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
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; JobPilot/1.0)',
      },
    });

    if (!res.ok) {
      console.warn(`LinkedIn RSS returned ${res.status} for "${keyword}" in "${location}"`);
      return [];
    }

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
  } catch (err) {
    console.error('LinkedIn RSS fetch error:', err);
    return [];
  }
}

// ─── Fetch from Indeed RSS ───────────────────────────────────
export async function fetchIndeedJobs(keyword: string, location: string): Promise<RawJob[]> {
  try {
    const url = `https://www.indeed.com/rss?q=${encodeURIComponent(keyword)}&l=${encodeURIComponent(location)}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; JobPilot/1.0)',
      },
    });

    if (!res.ok) {
      console.warn(`Indeed RSS returned ${res.status} for "${keyword}" in "${location}"`);
      return [];
    }

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
  } catch (err) {
    console.error('Indeed RSS fetch error:', err);
    return [];
  }
}

// ─── Fetch from RemoteOK API ────────────────────────────────
export async function fetchRemoteOKJobs(keyword: string): Promise<RawJob[]> {
  try {
    const url = `https://remoteok.com/api?tag=${encodeURIComponent(keyword)}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; JobPilot/1.0)',
      },
    });

    if (!res.ok) {
      console.warn(`RemoteOK returned ${res.status} for "${keyword}"`);
      return [];
    }

    const data = await res.json();
    // First item is metadata, skip it
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
  } catch (err) {
    console.error('RemoteOK fetch error:', err);
    return [];
  }
}

// ─── Fetch all jobs for a user's keywords ────────────────────
export async function fetchAllJobs(keywords: string[], location: string): Promise<RawJob[]> {
  const allJobs: RawJob[] = [];

  for (const keyword of keywords) {
    const [linkedinJobs, indeedJobs, remoteOKJobs] = await Promise.all([
      fetchLinkedInJobs(keyword, location),
      fetchIndeedJobs(keyword, location),
      fetchRemoteOKJobs(keyword),
    ]);

    allJobs.push(...linkedinJobs, ...indeedJobs, ...remoteOKJobs);
  }

  // Deduplicate by job URL
  const seen = new Set<string>();
  return allJobs.filter((job) => {
    if (seen.has(job.job_url)) return false;
    seen.add(job.job_url);
    return true;
  });
}
