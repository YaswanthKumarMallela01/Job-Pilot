import type { RawJob, ExperienceLevel } from './types';

const MAX_JOBS = 50;

// ─── Helper: check if a job location matches user preference ─
function locationMatches(jobLocation: string, userLocation: string): boolean {
  if (!userLocation || !jobLocation) return true;
  const loc = jobLocation.toLowerCase();
  const pref = userLocation.toLowerCase();
  const prefParts = pref.split(',').map(p => p.trim()).filter(Boolean);
  const indianCities = ['india', 'bangalore', 'bengaluru', 'mumbai', 'delhi', 'hyderabad',
    'pune', 'chennai', 'kolkata', 'gurgaon', 'gurugram', 'noida', 'ahmedabad', 'jaipur',
    'chandigarh', 'indore', 'kochi', 'thiruvananthapuram', 'coimbatore', 'lucknow', 'nagpur'];

  for (const p of prefParts) {
    if (loc.includes(p)) return true;
    if (p === 'remote' && (loc.includes('remote') || loc.includes('anywhere') || loc.includes('worldwide'))) return true;
    if (p === 'india' || p === 'in') {
      if (indianCities.some(city => loc.includes(city))) return true;
    }
    if (indianCities.includes(p) && loc.includes(p)) return true;
  }
  return false;
}

// ─── Map experience level to LinkedIn filter param ──────────
function getLinkedInExpFilter(level: ExperienceLevel): string {
  // LinkedIn f_E values: 1=Internship, 2=Entry, 3=Associate, 4=Mid-Senior, 5=Director, 6=Executive
  switch (level) {
    case 'internship': return '&f_E=1';
    case 'entry': return '&f_E=1,2';
    case 'mid': return '&f_E=3,4';
    case 'senior': return '&f_E=4,5,6';
    default: return ''; // 'any' = no filter
  }
}

// ─── Map experience level to Unstop filter ──────────────────
function getUnstopExpFilter(level: ExperienceLevel): string {
  switch (level) {
    case 'internship': return '&oppstatus=open&type=internships';
    case 'entry': return '&oppstatus=open';
    case 'mid': return '&oppstatus=open';
    case 'senior': return '&oppstatus=open';
    default: return '&oppstatus=open';
  }
}

// ─── Fetch from LinkedIn Public Jobs API ─────────────────────
export async function fetchLinkedInJobs(keyword: string, location: string, experience: ExperienceLevel = 'any', page: number = 0): Promise<RawJob[]> {
  try {
    const locParam = location.toLowerCase().includes('india') ? 'India' : location;
    const expFilter = getLinkedInExpFilter(experience);
    const start = page * 25; // LinkedIn paginates by 25
    const url = `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=${encodeURIComponent(keyword)}&location=${encodeURIComponent(locParam)}&start=${start}${expFilter}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) { console.warn(`LinkedIn returned ${res.status}`); return []; }
    const html = await res.text();

    const jobs: RawJob[] = [];

    // Extract job links
    const linkRegex = /href="(https?:\/\/[^"]*linkedin\.com\/jobs\/view\/[^"]+)"[^>]*>/gi;
    const links: string[] = [];
    let linkMatch;
    while ((linkMatch = linkRegex.exec(html)) !== null) {
      const href = linkMatch[1].split('?')[0];
      if (!links.includes(href)) links.push(href);
    }

    // Extract titles
    const titleRegex = /<span[^>]*class="sr-only"[^>]*>([^<]+)<\/span>/gi;
    const titles: string[] = [];
    let titleMatch;
    while ((titleMatch = titleRegex.exec(html)) !== null) {
      titles.push(titleMatch[1].trim());
    }

    // Extract companies
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

    const count = Math.min(links.length, titles.length, 25);
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

// ─── Fetch from Unstop (India-focused) ───────────────────────
export async function fetchUnstopJobs(keyword: string, experience: ExperienceLevel = 'any', page: number = 0): Promise<RawJob[]> {
  try {
    const expFilter = getUnstopExpFilter(experience);
    const opportunity = experience === 'internship' ? 'internships' : 'jobs';
    const url = `https://unstop.com/api/public/opportunity/search-result?opportunity=${opportunity}&per_page=25&page=${page + 1}${expFilter}&search=${encodeURIComponent(keyword)}`;
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

    const keywordParts = keyword.toLowerCase().split(/\s+/);

    return opportunities
      .filter((opp: Record<string, unknown>) => {
        if (!opp.title) return false;
        const title = String(opp.title).toLowerCase();
        return keywordParts.some(part => title.includes(part));
      })
      .map((opp: Record<string, unknown>) => {
        const locations = Array.isArray(opp.locations) ? opp.locations : [];
        const cityName = locations.length > 0
          ? (locations as Array<Record<string, unknown>>).map(l => `${l.city || ''}, ${l.country || ''}`).join('; ').trim()
          : 'India';

        const seoUrl = String(opp.seo_url || '');
        const shortUrl = String(opp.short_url || '');
        const publicUrl = String(opp.public_url || '');
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

// ─── Fetch all jobs — 25 LinkedIn + 25 Unstop, day-based rotation ─
export async function fetchAllJobs(keywords: string[], location: string, experience: ExperienceLevel = 'any'): Promise<RawJob[]> {
  const locationStr = location || 'India, Remote';

  // Day-based offset for rotation
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  const pageOffset = (dayOfYear % 5);

  const linkedInJobs: RawJob[] = [];
  const unstopJobs: RawJob[] = [];

  for (const keyword of keywords) {
    const [liJobs, unJobs] = await Promise.all([
      fetchLinkedInJobs(keyword, locationStr, experience, pageOffset),
      fetchUnstopJobs(keyword, experience, pageOffset),
    ]);
    linkedInJobs.push(...liJobs);
    unstopJobs.push(...unJobs);
  }

  // Deduplicate
  const dedup = (jobs: RawJob[]): RawJob[] => {
    const seen = new Set<string>();
    return jobs.filter(j => {
      if (!j.job_url || seen.has(j.job_url)) return false;
      seen.add(j.job_url);
      return true;
    });
  };

  const dedupedLI = dedup(linkedInJobs);
  const dedupedUN = dedup(unstopJobs);

  // Keyword relevance filter
  const allKeywordParts = keywords.flatMap(k => k.toLowerCase().split(/\s+/)).filter(p => p.length > 2);
  const filterRelevant = (jobs: RawJob[]): RawJob[] => {
    if (allKeywordParts.length === 0) return jobs;
    return jobs.filter(job => {
      const title = (job.title || '').toLowerCase();
      const desc = (job.description || '').toLowerCase();
      return allKeywordParts.some(part => title.includes(part) || desc.includes(part));
    });
  };

  const relevantLI = filterRelevant(dedupedLI);
  const relevantUN = filterRelevant(dedupedUN);

  // 25 from each source
  const selectedLI = relevantLI.slice(0, 25);
  const selectedUN = relevantUN.slice(0, 25);

  // Combine and fill remaining
  const combined = [...selectedLI, ...selectedUN];
  const remaining = MAX_JOBS - combined.length;
  if (remaining > 0) {
    const usedUrls = new Set(combined.map(j => j.job_url));
    const extras = [...relevantLI, ...relevantUN]
      .filter(j => !usedUrls.has(j.job_url))
      .slice(0, remaining);
    combined.push(...extras);
  }

  // Location filter (soft — fallback if too few)
  const locFiltered = combined.filter(j => locationMatches(j.location, locationStr));
  const final = locFiltered.length >= 10 ? locFiltered : combined;

  return final.slice(0, MAX_JOBS);
}
