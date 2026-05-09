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

// ─── Fetch from LinkedIn Public Jobs API ─────────────────────
export async function fetchLinkedInJobs(keyword: string, location: string): Promise<RawJob[]> {
  try {
    const locParam = location.toLowerCase().includes('india') ? 'India' : location;
    const url = `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=${encodeURIComponent(keyword)}&location=${encodeURIComponent(locParam)}&start=0`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) { console.warn(`LinkedIn returned ${res.status}`); return []; }
    const html = await res.text();

    // Parse job cards from HTML using regex
    const jobs: RawJob[] = [];
    // Match job URL + title: [Title](URL) pattern from the converted markdown/HTML
    // LinkedIn HTML has: <a class="base-card__full-link" href="URL"><span>Title</span></a>
    // And company: <h4 class="base-search-card__subtitle"><a>Company</a></h4>
    // And location: <span class="job-search-card__location">Location</span>

    // Extract job cards — each <li> contains one job
    const cardRegex = /<div[^>]*class="[^"]*base-card[^"]*"[^>]*>[\s\S]*?<\/div>\s*<\/li>/gi;
    const titleUrlRegex = /href="(https?:\/\/[^"]*linkedin\.com\/jobs\/view\/[^"]+)"[\s\S]*?<span[^>]*class="sr-only"[^>]*>([^<]+)<\/span>/i;
    const companyRegex = /class="[^"]*base-search-card__subtitle[^"]*"[\s\S]*?>([^<]+)</i;
    const locationRegex = /class="[^"]*job-search-card__location[^"]*"[^>]*>([^<]+)</i;

    // Simpler approach: find all job links with titles
    const linkRegex = /href="(https?:\/\/[^"]*linkedin\.com\/jobs\/view\/[^"]+)"[^>]*>/gi;
    const links: string[] = [];
    let linkMatch;
    while ((linkMatch = linkRegex.exec(html)) !== null) {
      const href = linkMatch[1].split('?')[0]; // Clean URL
      if (!links.includes(href)) links.push(href);
    }

    // Extract titles from ### headings or <span class="sr-only"> tags
    const titleRegex = /<span[^>]*class="sr-only"[^>]*>([^<]+)<\/span>/gi;
    const titles: string[] = [];
    let titleMatch;
    while ((titleMatch = titleRegex.exec(html)) !== null) {
      titles.push(titleMatch[1].trim());
    }

    // Extract companies from base-search-card__subtitle
    const companyMatches = html.match(/class="[^"]*base-search-card__subtitle[^"]*"[\s\S]*?<a[^>]*>([^<]+)<\/a>/gi) || [];
    const companies: string[] = companyMatches.map(m => {
      const match = m.match(/>([^<]+)<\/a>/);
      return match ? match[1].trim() : 'Unknown';
    });

    // Extract locations
    const locMatches = html.match(/class="[^"]*job-search-card__location[^"]*"[^>]*>[^<]+/gi) || [];
    const locations: string[] = locMatches.map(m => {
      const match = m.match(/>([^<]+)$/);
      return match ? match[1].trim() : locParam;
    });

    // Build job objects
    const count = Math.min(links.length, titles.length, 15);
    for (let i = 0; i < count; i++) {
      jobs.push({
        title: titles[i] || 'Unknown Title',
        company: companies[i] || 'Unknown',
        location: locations[i] || locParam,
        source: 'linkedin' as const,
        job_url: links[i],
        description: `${titles[i] || ''} at ${companies[i] || 'Unknown'} — ${locations[i] || locParam}`,
      });
    }

    return jobs;
  } catch (err) { console.error('LinkedIn fetch error:', err); return []; }
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

    // Keyword parts for relevance filtering (e.g. "Software Engineer" -> ["software", "engineer"])
    const keywordParts = keyword.toLowerCase().split(/\s+/);

    return opportunities
      .filter((opp: Record<string, unknown>) => {
        if (!opp.title) return false;
        // Only include jobs whose title contains at least one keyword word
        const title = String(opp.title).toLowerCase();
        return keywordParts.some(part => title.includes(part));
      })
      .map((opp: Record<string, unknown>) => {
        // Extract city from locations array
        const locations = Array.isArray(opp.locations) ? opp.locations : [];
        const cityName = locations.length > 0
          ? (locations as Array<Record<string, unknown>>).map(l => `${l.city || ''}, ${l.country || ''}`).join('; ').trim()
          : 'India';

        // seo_url already contains the full URL like "https://unstop.com/jobs/..."
        const seoUrl = String(opp.seo_url || '');
        const shortUrl = String(opp.short_url || '');
        const publicUrl = String(opp.public_url || '');
        // Use seo_url directly if it starts with http, otherwise build from public_url
        const jobUrl = seoUrl.startsWith('http') ? seoUrl
          : shortUrl.startsWith('http') ? shortUrl
          : publicUrl ? `https://unstop.com/${publicUrl}`
          : `https://unstop.com/jobs`;

        return {
          title: String(opp.title || '').trim(),
          company: String(
            (typeof opp.organisation === 'object' && opp.organisation !== null
              ? (opp.organisation as Record<string, unknown>).name
              : opp.organisation) || 'Unknown'
          ).trim(),
          location: cityName || 'India',
          source: 'unstop' as const,
          job_url: jobUrl,
          description: String(opp.details || opp.short_desc || '').replace(/<[^>]*>/g, '').replace(/\\n/g, ' ').trim().substring(0, 500),
        };
      });
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

  // Filter by keyword relevance — job title must contain at least one keyword word
  const allKeywordParts = keywords.flatMap(k => k.toLowerCase().split(/\s+/)).filter(p => p.length > 2);
  const keywordFiltered = deduped.filter(job => {
    const title = (job.title || '').toLowerCase();
    const desc = (job.description || '').toLowerCase();
    return allKeywordParts.some(part => title.includes(part) || desc.includes(part));
  });

  // Filter by location preference
  const locationFiltered = keywordFiltered.filter(job => locationMatches(job.location, locationStr));

  // Use keyword-filtered if we have enough, otherwise fall back to all deduped
  const result = locationFiltered.length >= 5 ? locationFiltered
    : keywordFiltered.length >= 5 ? keywordFiltered
    : deduped;

  // Cap at MAX_JOBS
  return result.slice(0, MAX_JOBS);
}
