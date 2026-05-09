import { XMLParser } from 'fast-xml-parser';
import type { RawJob } from './types';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
});

const MAX_JOBS = 50;

// ─── Helper: check if a job location matches user preference ─
function locationMatches(jobLocation: string, userLocation: string): boolean {
  if (!userLocation || !jobLocation) return true;
  const loc = jobLocation.toLowerCase();
  const pref = userLocation.toLowerCase();
  // Split user preferences by comma (e.g. "Remote, India, Bangalore")
  const prefParts = pref.split(',').map(p => p.trim()).filter(Boolean);
  // If user wants "remote", accept remote jobs
  // If user wants "india", accept any Indian city
  const indianCities = ['india', 'bangalore', 'bengaluru', 'mumbai', 'delhi', 'hyderabad',
    'pune', 'chennai', 'kolkata', 'gurgaon', 'gurugram', 'noida', 'ahmedabad', 'jaipur',
    'chandigarh', 'indore', 'kochi', 'thiruvananthapuram', 'coimbatore', 'lucknow', 'nagpur'];

  for (const p of prefParts) {
    if (loc.includes(p)) return true;
    if (p === 'remote' && (loc.includes('remote') || loc.includes('anywhere') || loc.includes('worldwide'))) return true;
    if (p === 'india' || p === 'in') {
      if (indianCities.some(city => loc.includes(city))) return true;
    }
    // If user specified a specific city, check if it's in the job location
    if (indianCities.includes(p) && loc.includes(p)) return true;
  }
  return false;
}

// ─── Fetch from LinkedIn RSS ─────────────────────────────────
export async function fetchLinkedInJobs(keyword: string, location: string): Promise<RawJob[]> {
  try {
    // Use India-specific LinkedIn URL when location includes India
    const locParam = location.toLowerCase().includes('india') ? 'India' : location;
    const url = `https://www.linkedin.com/jobs/search/feed?keywords=${encodeURIComponent(keyword)}&location=${encodeURIComponent(locParam)}&f_TPR=r86400`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      signal: AbortSignal.timeout(10000),
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
        location: String(item['dc:location'] || locParam).trim(),
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
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      signal: AbortSignal.timeout(10000),
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
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      signal: AbortSignal.timeout(10000),
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
        description: String(job.description || '').replace(/<[^>]*>/g, '').trim().substring(0, 500),
      }));
  } catch (err) { console.error('RemoteOK fetch error:', err); return []; }
}

// ─── Fetch from Arbeitnow API — with India location filter ──
export async function fetchArbeitnowJobs(keyword: string, location: string): Promise<RawJob[]> {
  try {
    // Only fetch if location matches (Arbeitnow is EU-focused, skip for pure India searches)
    const isIndiaOnly = location.toLowerCase().split(',').every(l =>
      ['india', 'remote', 'bangalore', 'mumbai', 'delhi', 'hyderabad', 'pune', 'chennai'].includes(l.trim().toLowerCase())
    );
    if (isIndiaOnly) return []; // Skip Arbeitnow for India-only searches

    const url = `https://www.arbeitnow.com/api/job-board-api?search=${encodeURIComponent(keyword)}&location=${encodeURIComponent(location)}`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return [];
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

// ─── Fetch from Jobicy API (remote jobs) ─────────────────────
export async function fetchJobicyJobs(keyword: string): Promise<RawJob[]> {
  try {
    const url = `https://jobicy.com/api/v2/remote-jobs?count=15&tag=${encodeURIComponent(keyword)}`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return [];
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

// ─── Fetch from Adzuna RSS ───────────────────────────────────
export async function fetchAdzunaJobs(keyword: string, location: string): Promise<RawJob[]> {
  try {
    const loc = location.toLowerCase();
    const country = loc.includes('india') ? 'in'
      : loc.includes('uk') || loc.includes('united kingdom') ? 'gb'
      : loc.includes('canad') ? 'ca'
      : loc.includes('australia') ? 'au'
      : loc.includes('germany') ? 'de'
      : 'in'; // Default to India
    const url = `https://www.adzuna.com/feed/rss?q=${encodeURIComponent(keyword)}&country=${country}`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return [];
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

// ─── Fetch from The Muse API ─────────────────────────────────
export async function fetchTheMuseJobs(keyword: string, location: string): Promise<RawJob[]> {
  try {
    const url = `https://www.themuse.com/api/public/jobs?category=${encodeURIComponent(keyword)}&location=${encodeURIComponent(location)}&page=0`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    const jobs = Array.isArray(data?.results) ? data.results : [];
    return jobs
      .filter((job: Record<string, unknown>) => job.name && job.refs)
      .map((job: Record<string, unknown>) => ({
        title: String(job.name || '').trim(),
        company: String((job.company as Record<string, unknown>)?.name || 'Unknown').trim(),
        location: Array.isArray(job.locations)
          ? (job.locations as Array<Record<string, unknown>>).map(l => String(l.name || '')).join(', ')
          : location,
        source: 'themuse' as const,
        job_url: String((job.refs as Record<string, unknown>)?.landing_page || '').trim(),
        description: String(job.contents || '').replace(/<[^>]*>/g, '').trim().substring(0, 500),
      }));
  } catch (err) { console.error('The Muse fetch error:', err); return []; }
}

// ─── Fetch from Unstop (India-focused, competitions & jobs) ──
export async function fetchUnstopJobs(keyword: string): Promise<RawJob[]> {
  try {
    const url = `https://unstop.com/api/public/opportunity/search-result?opportunity=jobs&per_page=15&oppstatus=open&search=${encodeURIComponent(keyword)}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) { console.warn(`Unstop returned ${res.status}`); return []; }
    const data = await res.json();
    const opportunities = data?.data?.data || [];
    if (!Array.isArray(opportunities)) return [];
    return opportunities
      .filter((opp: Record<string, unknown>) => opp.title && (opp.seo_url || opp.id))
      .map((opp: Record<string, unknown>) => ({
        title: String(opp.title || '').trim(),
        company: String((opp.organisation as Record<string, unknown>)?.name || opp.organisation || 'Unknown').trim(),
        location: String(opp.city || opp.location || 'India').trim(),
        source: 'unstop' as const,
        job_url: opp.seo_url ? `https://unstop.com/${opp.seo_url}` : `https://unstop.com/job/${opp.id}`,
        description: String(opp.short_desc || opp.desc || '').replace(/<[^>]*>/g, '').trim().substring(0, 500),
      }));
  } catch (err) { console.error('Unstop fetch error:', err); return []; }
}

// ─── Fetch all jobs — filtered by preferences, capped at 50 ─
export async function fetchAllJobs(keywords: string[], location: string): Promise<RawJob[]> {
  const allJobs: RawJob[] = [];
  // Parse location for filtering
  const locationStr = location || 'India, Remote';

  for (const keyword of keywords) {
    const results = await Promise.all([
      fetchLinkedInJobs(keyword, locationStr),
      fetchIndeedJobs(keyword, locationStr),
      fetchRemoteOKJobs(keyword),
      fetchArbeitnowJobs(keyword, locationStr),
      fetchJobicyJobs(keyword),
      fetchAdzunaJobs(keyword, locationStr),
      fetchTheMuseJobs(keyword, locationStr),
      fetchUnstopJobs(keyword),
    ]);

    for (const jobs of results) {
      allJobs.push(...jobs);
    }

    // Early exit if we already have enough
    if (allJobs.length >= MAX_JOBS * 2) break;
  }

  // Deduplicate by job URL
  const seen = new Set<string>();
  const deduped = allJobs.filter((job) => {
    if (!job.job_url || seen.has(job.job_url)) return false;
    seen.add(job.job_url);
    return true;
  });

  // Filter by location preference
  const filtered = deduped.filter(job => locationMatches(job.location, locationStr));

  // If filtering removed too many, fall back to all deduped results
  const result = filtered.length >= 5 ? filtered : deduped;

  // Cap at MAX_JOBS
  return result.slice(0, MAX_JOBS);
}
