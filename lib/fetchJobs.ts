import type { RawJob, ExperienceLevel } from './types';
import { getCompanyTier } from './companies';

const MAX_JOBS = 50;

// ─── Stop words that are too generic to match alone ──────────
// These words appear in many unrelated job titles. They contribute to
// relevance score but cannot qualify a match by themselves.
const MODIFIER_WORDS = new Set([
  'intern', 'internship', 'junior', 'senior', 'associate', 'lead', 'staff',
  'principal', 'manager', 'head', 'director', 'vp', 'chief',
  'remote', 'hybrid', 'onsite', 'contract', 'freelance', 'part-time',
  'full-time', 'entry', 'level', 'i', 'ii', 'iii', 'iv', 'v',
  'work', 'job', 'position', 'role', 'opportunity', 'opening',
  'new', 'hiring', 'urgent', 'immediate', 'apply', 'now',
]);

// Words too short or common to be meaningful
const NOISE_WORDS = new Set(['the', 'and', 'for', 'with', 'from', 'into', 'are', 'was', 'has', 'had', 'can', 'may', 'will', 'not']);

// ─── Compound terms that should be treated as single tokens ──
// This prevents "machine" and "learning" from matching separately
const COMPOUND_TERMS = [
  'machine learning', 'deep learning', 'data science', 'data scientist',
  'data analyst', 'data engineer', 'data analytics',
  'artificial intelligence', 'computer vision', 'natural language',
  'full stack', 'fullstack', 'front end', 'frontend', 'front-end',
  'back end', 'backend', 'back-end', 'dev ops', 'devops',
  'generative ai', 'gen ai', 'genai', 'agentic ai',
  'software engineer', 'software developer', 'software development',
  'web developer', 'web development',
  'product manager', 'project manager', 'product engineer',
  'qa engineer', 'quality assurance', 'test engineer',
  'ml ops', 'mlops', 'ai engineer', 'ai developer',
  'rag engineer', 'llm engineer', 'llm developer',
  'prompt engineer', 'prompt engineering',
  'python developer', 'react developer', 'node developer',
  'cloud engineer', 'site reliability', 'sre',
  'ui ux', 'ux designer', 'ui designer',
  'business analyst', 'business intelligence',
  'solutions architect', 'system engineer', 'systems engineer',
];

// ─── Extract meaningful tokens from a phrase ─────────────────
// Preserves compound terms as single tokens
function tokenizePhrase(phrase: string): string[] {
  let lower = phrase.toLowerCase().trim();
  const tokens: string[] = [];

  // First, extract compound terms
  for (const compound of COMPOUND_TERMS) {
    if (lower.includes(compound)) {
      tokens.push(compound);
      lower = lower.replace(compound, ' ').trim();
    }
  }

  // Then extract remaining individual words
  const words = lower.split(/[\s\-_/,]+/).filter(w => w.length > 1);
  for (const word of words) {
    if (!NOISE_WORDS.has(word) && !tokens.some(t => t.includes(word))) {
      tokens.push(word);
    }
  }

  return tokens;
}

// ─── Separate tokens into core vs modifier ───────────────────
function classifyTokens(tokens: string[]): { core: string[]; modifiers: string[] } {
  const core: string[] = [];
  const modifiers: string[] = [];

  for (const token of tokens) {
    // Compound terms are always core
    if (token.includes(' ') || !MODIFIER_WORDS.has(token)) {
      core.push(token);
    } else {
      modifiers.push(token);
    }
  }

  return { core, modifiers };
}

// ─── Generic role words that need domain context to be meaningful ─
// "developer" alone matches too many things (JavaScript Developer, Game Developer, etc.)
// These only score fully when paired with domain-specific words
const GENERIC_ROLE_WORDS = new Set([
  'developer', 'engineer', 'analyst', 'scientist', 'architect',
  'designer', 'specialist', 'consultant', 'coordinator',
]);

// ─── Domain words that qualify generic role words ────────────
const DOMAIN_QUALIFIERS = new Set([
  'ai', 'ml', 'machine', 'learning', 'deep', 'data', 'software',
  'backend', 'frontend', 'fullstack', 'full', 'stack', 'web',
  'python', 'cloud', 'devops', 'mlops', 'llm', 'genai', 'gen',
  'generative', 'prompt', 'rag', 'agentic', 'automation',
  'qa', 'quality', 'test', 'project', 'product', 'research',
  'natural', 'language', 'computer', 'vision', 'neural',
]);

// ─── Word-boundary-aware matching ────────────────────────────
// Prevents 'ai' from matching inside 'training' or 'chain'
function matchesAsWord(text: string, word: string): boolean {
  // For very short tokens (2-3 chars), require strict word boundary
  if (word.length <= 3) {
    const regex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    return regex.test(text);
  }
  // For longer tokens, substring match is fine (e.g., "engineer" in "engineering" is close enough)
  return text.includes(word);
}

// ─── Score how well a job title matches a keyword phrase ──────
// Returns 0.0 to 1.0
function scoreKeywordMatch(jobTitle: string, keywordPhrase: string): number {
  const titleTokens = tokenizePhrase(jobTitle);
  const keywordTokens = tokenizePhrase(keywordPhrase);
  const { core: coreKeywords, modifiers: modKeywords } = classifyTokens(keywordTokens);

  if (coreKeywords.length === 0) return 0;

  const titleLower = jobTitle.toLowerCase();

  // Count how many core keywords appear in the title
  let coreMatches = 0;
  let hasCompoundMatch = false;
  let hasDomainMatch = false;
  let hasOnlyGenericMatch = false;

  for (const coreWord of coreKeywords) {
    let matched = false;

    // For compound terms (e.g., "software engineer", "data analyst"), require the full compound
    if (coreWord.includes(' ')) {
      if (titleLower.includes(coreWord)) {
        matched = true;
        hasCompoundMatch = true;
      } else {
        // Check if all parts of the compound appear as distinct words in the title
        const parts = coreWord.split(/\s+/);
        const allPartsMatch = parts.every(p => matchesAsWord(titleLower, p));
        if (allPartsMatch) {
          matched = true;
          hasCompoundMatch = true;
        }
      }
    } else {
      // Single word matching — use word boundary for short words
      if (titleTokens.some(t => t === coreWord) || matchesAsWord(titleLower, coreWord)) {
        matched = true;

        if (DOMAIN_QUALIFIERS.has(coreWord)) {
          hasDomainMatch = true;
        } else if (GENERIC_ROLE_WORDS.has(coreWord)) {
          hasOnlyGenericMatch = true;
        } else {
          hasDomainMatch = true; // Non-generic, non-qualifier words are treated as domain-specific
        }
      }
    }

    if (matched) coreMatches++;
  }

  // If NO core keywords match, irrelevant
  if (coreMatches === 0) return 0;

  // Core match ratio
  const coreRatio = coreMatches / coreKeywords.length;

  // PENALTY: If only a generic role word matched without domain context,
  // cap the score very low. This prevents "developer" from matching "Graphic Developer" etc.
  if (hasOnlyGenericMatch && !hasDomainMatch && !hasCompoundMatch) {
    // Check if the job title has any of our domain qualifiers
    const titleHasDomainContext = titleTokens.some(t => DOMAIN_QUALIFIERS.has(t));
    if (!titleHasDomainContext) {
      return Math.min(0.25, coreRatio * 0.3); // Below threshold
    }
  }

  // Modifier match bonus (small contribution)
  let modBonus = 0;
  if (modKeywords.length > 0) {
    let modMatches = 0;
    for (const mod of modKeywords) {
      if (titleLower.includes(mod)) modMatches++;
    }
    modBonus = (modMatches / modKeywords.length) * 0.15;
  }

  // Exact phrase bonus — if the entire keyword phrase appears as-is in the title
  const phraseBonus = titleLower.includes(keywordPhrase.toLowerCase()) ? 0.2 : 0;

  return Math.min(1.0, coreRatio * 0.8 + modBonus + phraseBonus);
}

// ─── Score a job against ALL user keywords ───────────────────
// Returns the best match score across all keyword phrases
function scoreJobRelevance(jobTitle: string, jobDescription: string, keywords: string[]): number {
  let bestScore = 0;

  for (const keyword of keywords) {
    const titleScore = scoreKeywordMatch(jobTitle, keyword);
    // Description matching is less reliable — give it 40% weight
    const descScore = scoreKeywordMatch(jobDescription, keyword) * 0.4;
    const combined = Math.max(titleScore, descScore);

    if (combined > bestScore) {
      bestScore = combined;
    }
  }

  return bestScore;
}

// ─── Deduplicate keywords into consolidated search queries ───
// Groups overlapping keywords to reduce API calls
export function deduplicateKeywords(keywords: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  // Normalize and extract unique core search terms
  for (const keyword of keywords) {
    const tokens = tokenizePhrase(keyword);
    const { core } = classifyTokens(tokens);

    // Create a canonical key from sorted core tokens
    const key = core.sort().join('|');
    if (!seen.has(key) && core.length > 0) {
      seen.add(key);
      // Use the best representation for API query — prioritize compound terms
      const searchQuery = core.join(' ');
      result.push(searchQuery);
    }
  }

  return result;
}

// ─── Helper: check if a job location matches user preference ─
function locationMatches(jobLocation: string, userLocation: string): boolean {
  if (!userLocation || !jobLocation) return true;
  const loc = jobLocation.toLowerCase();
  const pref = userLocation.toLowerCase();
  const prefParts = pref.split(',').map(p => p.trim()).filter(Boolean);
  const indianCities = ['india', 'bangalore', 'bengaluru', 'mumbai', 'delhi', 'hyderabad',
    'pune', 'chennai', 'kolkata', 'gurgaon', 'gurugram', 'noida', 'ahmedabad', 'jaipur',
    'chandigarh', 'indore', 'kochi', 'thiruvananthapuram', 'coimbatore', 'lucknow', 'nagpur',
    'surat', 'vadodara', 'bhopal', 'visakhapatnam', 'patna', 'ranchi'];

  for (const p of prefParts) {
    if (loc.includes(p)) return true;
    if (p === 'remote' && (loc.includes('remote') || loc.includes('anywhere') || loc.includes('worldwide') || loc.includes('work from home') || loc.includes('wfh'))) return true;
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

    const mapped = opportunities
      .map((opp: Record<string, unknown>): RawJob | null => {
        if (!opp.title) return null;
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

    return mapped.filter((j): j is RawJob => j !== null);
  } catch (err) { console.error('Unstop fetch error:', err); return []; }
}

// ─── Scored job with relevance and company info ──────────────
interface ScoredJob extends RawJob {
  relevanceScore: number;
  companyTier: number;
  experienceMatch: number; // 0-1: how well it matches the requested experience level
  combinedScore: number;
}

// ─── Experience-level signals in job titles ──────────────────
const INTERN_SIGNALS = ['intern', 'internship', 'trainee', 'apprentice', 'fresher', 'fresh graduate', 'graduate trainee', 'co-op', 'coop', 'summer analyst', 'summer associate', 'placement'];
const ENTRY_SIGNALS = ['junior', 'jr', 'entry level', 'entry-level', 'associate', 'graduate', 'fresher', 'new grad', 'campus', 'trainee', 'intern'];
const SENIOR_SIGNALS = ['senior', 'sr', 'staff', 'principal', 'lead', 'architect', 'director', 'vp', 'vice president', 'head of', 'chief', 'cto', 'cio', 'distinguished', 'fellow'];
const MID_SIGNALS = ['mid', 'mid-level', 'mid level', 'ii', 'iii', 'level 2', 'level 3', 'l3', 'l4', 'l5'];
const YEARS_EXP_REGEX = /(\d+)\+?\s*(?:years?|yrs?)\s*(?:of\s+)?(?:experience|exp)/i;

/**
 * Score how well a job matches the requested experience level (0.0 to 1.0).
 * Returns 1.0 for perfect match, 0.0 for clear mismatch, 0.5 for uncertain.
 */
function scoreExperienceMatch(title: string, description: string, level: ExperienceLevel): number {
  if (level === 'any') return 1.0;

  const text = `${title} ${description}`.toLowerCase();
  const titleLower = title.toLowerCase();

  // Check years of experience mentioned
  const yearsMatch = YEARS_EXP_REGEX.exec(text);
  const yearsRequired = yearsMatch ? parseInt(yearsMatch[1], 10) : -1;

  const hasInternSignal = INTERN_SIGNALS.some(s => titleLower.includes(s));
  const hasEntrySignal = ENTRY_SIGNALS.some(s => titleLower.includes(s));
  const hasSeniorSignal = SENIOR_SIGNALS.some(s => matchesAsWord(titleLower, s));
  const hasMidSignal = MID_SIGNALS.some(s => titleLower.includes(s));

  switch (level) {
    case 'internship': {
      // Perfect: title has intern signals
      if (hasInternSignal) return 1.0;
      // Hard reject: title clearly says senior/lead/staff/principal/director
      if (hasSeniorSignal) return 0.0;
      // Hard reject: requires 3+ years experience
      if (yearsRequired >= 3) return 0.0;
      // Reject: has mid-level signals
      if (hasMidSignal) return 0.0;
      // Penalize but don't reject: no intern signal but no senior signal either
      // (e.g., "LLM Developer" — could be any level, but probably not intern)
      // Check description for intern signals
      const descHasInternSignal = INTERN_SIGNALS.some(s => text.includes(s));
      if (descHasInternSignal) return 0.8;
      // No signals at all — this is likely a full-time role
      return 0.15;
    }
    case 'entry': {
      if (hasInternSignal || hasEntrySignal) return 1.0;
      if (hasSeniorSignal) return 0.1;
      if (yearsRequired >= 5) return 0.0;
      if (hasMidSignal) return 0.3;
      // No signals — probably entry-friendly
      return 0.6;
    }
    case 'mid': {
      if (hasMidSignal) return 1.0;
      if (hasSeniorSignal) return 0.5;
      if (hasInternSignal) return 0.1;
      if (yearsRequired >= 2 && yearsRequired <= 7) return 0.9;
      // No signals — could be mid
      return 0.6;
    }
    case 'senior': {
      if (hasSeniorSignal) return 1.0;
      if (hasInternSignal) return 0.0;
      if (hasEntrySignal) return 0.1;
      if (yearsRequired >= 5) return 0.9;
      // No signals — could be senior
      return 0.5;
    }
    default:
      return 1.0;
  }
}

// ─── Fetch all jobs — smart relevance + company + experience scoring ─
export async function fetchAllJobs(
  keywords: string[],
  location: string,
  experience: ExperienceLevel = 'any',
  preferEstablished: boolean = true
): Promise<RawJob[]> {
  const locationStr = location || 'India, Remote';

  // Day-based offset for rotation (cycle through pages 0-4)
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  const pageOffset = (dayOfYear % 5);

  // Step 1: Deduplicate keywords for API calls
  const searchQueries = deduplicateKeywords(keywords);
  console.log(`[JobPilot] ${keywords.length} keywords → ${searchQueries.length} search queries:`, searchQueries);

  // Step 2: Fetch from all sources in parallel
  const linkedInJobs: RawJob[] = [];
  const unstopJobs: RawJob[] = [];

  // For internship searches, also add "intern" to search queries for better API results
  const effectiveQueries = experience === 'internship'
    ? [...new Set([...searchQueries, ...searchQueries.map(q => `${q} intern`)])]
    : searchQueries;

  // Process in batches of 5 to avoid overwhelming APIs
  const BATCH_SIZE = 5;
  for (let i = 0; i < effectiveQueries.length; i += BATCH_SIZE) {
    const batch = effectiveQueries.slice(i, i + BATCH_SIZE);
    const promises = batch.flatMap(query => [
      fetchLinkedInJobs(query, locationStr, experience, pageOffset),
      fetchUnstopJobs(query, experience, pageOffset),
    ]);

    const results = await Promise.all(promises);
    for (let j = 0; j < results.length; j++) {
      if (j % 2 === 0) linkedInJobs.push(...results[j]);
      else unstopJobs.push(...results[j]);
    }
  }

  // Step 3: Deduplicate by URL
  const dedup = (jobs: RawJob[]): RawJob[] => {
    const seen = new Set<string>();
    return jobs.filter(j => {
      if (!j.job_url || seen.has(j.job_url)) return false;
      seen.add(j.job_url);
      return true;
    });
  };

  const allJobs = dedup([...linkedInJobs, ...unstopJobs]);
  console.log(`[JobPilot] Total unique jobs fetched: ${allJobs.length}`);

  // Step 4: Score each job for relevance + company quality + experience match
  const RELEVANCE_THRESHOLD = 0.35;
  const EXPERIENCE_THRESHOLD = 0.15; // Hard floor — anything below is completely wrong level

  const scoredJobs: ScoredJob[] = allJobs.map(job => {
    const relevanceScore = scoreJobRelevance(job.title, job.description || '', keywords);
    const companyTier = getCompanyTier(job.company);
    const experienceMatch = scoreExperienceMatch(job.title, job.description || '', experience);

    // Combined score: relevance * experience * company
    // Experience acts as a multiplier — wrong level tanks the score
    let combinedScore = relevanceScore * 3 * (0.4 + experienceMatch * 0.6);
    if (preferEstablished) {
      combinedScore += companyTier * 0.3;
    }

    return { ...job, relevanceScore, companyTier, experienceMatch, combinedScore };
  });

  // Step 5: Filter out irrelevant jobs AND wrong experience level
  const relevantJobs = scoredJobs.filter(j =>
    j.relevanceScore >= RELEVANCE_THRESHOLD && j.experienceMatch > EXPERIENCE_THRESHOLD
  );
  console.log(`[JobPilot] After relevance (${RELEVANCE_THRESHOLD}) + experience filter: ${relevantJobs.length}/${scoredJobs.length}`);

  // Step 6: Sort by combined score (highest first)
  relevantJobs.sort((a, b) => b.combinedScore - a.combinedScore);

  // Step 7: If preferEstablished, ensure at least 60% of results are from known companies (when available)
  let finalJobs: ScoredJob[];
  if (preferEstablished) {
    const knownCompanyJobs = relevantJobs.filter(j => j.companyTier > 0);
    const unknownCompanyJobs = relevantJobs.filter(j => j.companyTier === 0);

    const targetKnown = Math.min(knownCompanyJobs.length, Math.ceil(MAX_JOBS * 0.6));
    const targetUnknown = MAX_JOBS - targetKnown;

    finalJobs = [
      ...knownCompanyJobs.slice(0, targetKnown),
      ...unknownCompanyJobs.slice(0, targetUnknown),
    ];

    // Re-sort the final mix by combined score
    finalJobs.sort((a, b) => b.combinedScore - a.combinedScore);

    console.log(`[JobPilot] Company mix: ${targetKnown} known + ${Math.min(unknownCompanyJobs.length, targetUnknown)} unknown`);
  } else {
    finalJobs = relevantJobs.slice(0, MAX_JOBS);
  }

  // Step 8: Location filter (soft — fallback if too few)
  const locFiltered = finalJobs.filter(j => locationMatches(j.location, locationStr));
  const result = locFiltered.length >= 10 ? locFiltered : finalJobs;

  // Strip scoring metadata before returning
  return result.slice(0, MAX_JOBS).map(({ relevanceScore, companyTier, experienceMatch, combinedScore, ...job }) => job);
}
