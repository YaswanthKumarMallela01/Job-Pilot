import type { RawJob, ExperienceLevel } from './types';
import { getCompanyTier } from './companies';

const MAX_JOBS = 80;

// ─── Compound terms ─────────────────────────────────────────
const COMPOUND_TERMS = [
  'machine learning', 'deep learning', 'data science', 'data scientist',
  'data analyst', 'data engineer', 'artificial intelligence',
  'computer vision', 'natural language', 'full stack', 'fullstack',
  'front end', 'frontend', 'back end', 'backend', 'devops',
  'generative ai', 'gen ai', 'genai', 'agentic ai',
  'software engineer', 'software developer', 'web developer',
  'product manager', 'project manager', 'qa engineer',
  'ml ops', 'mlops', 'ai engineer', 'ai developer',
  'rag engineer', 'llm engineer', 'llm developer',
  'prompt engineer', 'python developer', 'cloud engineer',
  'business analyst',
];

const NOISE_WORDS = new Set(['the', 'and', 'for', 'with', 'from', 'into', 'are', 'was', 'has', 'can', 'may', 'will', 'not', 'at', 'in', 'on', 'to', 'of', 'a', 'an']);
const MODIFIER_WORDS = new Set(['intern', 'internship', 'junior', 'senior', 'associate', 'lead', 'staff', 'principal', 'manager', 'head', 'director', 'vp', 'chief', 'remote', 'hybrid', 'contract', 'entry', 'level']);

// ─── Negative keywords — hard reject ─────────────────────────
const NEGATIVE_KEYWORDS = [
  'telecalling', 'tele calling', 'cold calling', 'voice bot',
  'outbound calling', 'inbound calling', 'telesales',
  'door to door', 'field sales',
  'customer support executive', 'customer care executive',
  'business development executive',
  'insurance agent', 'insurance advisor',
  'content writing', 'blog writing',
  'graphic design', 'video production',
  'seo executive', 'digital marketing executive',
  'teaching', 'tutor', 'faculty', 'lecturer',
  'receptionist', 'typist', 'data entry operator',
  'delivery boy', 'delivery executive', 'warehouse operative',
  'cook', 'chef', 'housekeeping',
  'civil engineer', 'mechanical engineer', 'electrical engineer',
  'chemical engineer',
  'chartered accountant', 'ca intern', 'audit intern', 'tax intern',
  'legal intern', 'law intern',
  'pharmacist', 'medical representative',
  'nursing', 'physiotherapy', 'medical coding',
];

function isNegativeMatch(title: string, desc: string): boolean {
  const t = `${title} ${desc}`.toLowerCase().replace(/[/\\-_|&]+/g, ' ');
  return NEGATIVE_KEYWORDS.some(neg => t.includes(neg));
}

// ─── Tokenization ────────────────────────────────────────────
function tokenize(phrase: string): string[] {
  let s = phrase.toLowerCase().trim();
  const tokens: string[] = [];
  for (const c of COMPOUND_TERMS) {
    if (s.includes(c)) { tokens.push(c); s = s.replace(c, ' ').trim(); }
  }
  for (const w of s.split(/[\s\-_/,]+/).filter(w => w.length > 1)) {
    if (!NOISE_WORDS.has(w) && !tokens.some(t => t.includes(w))) tokens.push(w);
  }
  return tokens;
}

function wordMatch(text: string, word: string): boolean {
  if (word.length <= 3) return new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(text);
  return text.includes(word);
}

// ─── Relevance scoring ───────────────────────────────────────
function scoreRelevance(title: string, desc: string, keywords: string[]): number {
  let best = 0;
  for (const kw of keywords) {
    const core = tokenize(kw).filter(t => t.includes(' ') || !MODIFIER_WORDS.has(t));
    if (core.length === 0) continue;
    const tl = title.toLowerCase();
    let hits = 0;
    for (const c of core) {
      if (c.includes(' ')) {
        if (tl.includes(c) || c.split(/\s+/).every(p => wordMatch(tl, p))) hits++;
      } else if (wordMatch(tl, c)) hits++;
    }
    let score = hits > 0 ? (hits / core.length) * 0.8 : 0;
    if (score === 0) {
      // Check description too
      const dl = desc.toLowerCase();
      let dHits = 0;
      for (const c of core) {
        if (c.includes(' ') ? dl.includes(c) : wordMatch(dl, c)) dHits++;
      }
      score = dHits > 0 ? (dHits / core.length) * 0.3 : 0;
    }
    if (tl.includes(kw.toLowerCase())) score = Math.max(score, 0.9);
    if (score > best) best = score;
  }
  return best;
}

// ─── Experience scoring ──────────────────────────────────────
const INTERN_SIGNALS = ['intern', 'internship', 'trainee', 'apprentice', 'fresher', 'fresh graduate', 'graduate trainee', 'co-op', 'summer analyst', 'placement'];
const SENIOR_SIGNALS = ['senior', 'sr.', 'staff', 'principal', 'lead', 'architect', 'director', 'vp', 'head of', 'chief', 'cto', 'distinguished'];

function scoreExperience(title: string, desc: string, level: ExperienceLevel, source: string): number {
  if (level === 'any') return 1.0;
  const tl = title.toLowerCase();
  const text = `${title} ${desc}`.toLowerCase();

  if (level === 'internship') {
    if (INTERN_SIGNALS.some(s => tl.includes(s))) return 1.0;
    if (SENIOR_SIGNALS.some(s => wordMatch(tl, s))) return 0.0;
    if (/(\d+)\+?\s*(?:years?|yrs?)/.test(text) && parseInt(RegExp.$1) >= 3) return 0.0;
    if (INTERN_SIGNALS.some(s => text.includes(s))) return 0.85;
    if (source === 'unstop') return 0.7; // Unstop internship type = trusted
    return 0.4; // Don't hard-reject, rank lower
  }
  if (level === 'entry') {
    if (INTERN_SIGNALS.some(s => tl.includes(s))) return 1.0;
    if (SENIOR_SIGNALS.some(s => wordMatch(tl, s))) return 0.1;
    return 0.6;
  }
  if (level === 'senior') {
    if (SENIOR_SIGNALS.some(s => wordMatch(tl, s))) return 1.0;
    if (INTERN_SIGNALS.some(s => tl.includes(s))) return 0.0;
    return 0.5;
  }
  return 0.6;
}

// ─── Dedup keywords ──────────────────────────────────────────
export function deduplicateKeywords(keywords: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const kw of keywords) {
    const core = tokenize(kw).filter(t => t.includes(' ') || !MODIFIER_WORDS.has(t));
    const key = core.sort().join('|');
    if (key && !seen.has(key)) { seen.add(key); result.push(core.join(' ')); }
  }
  return result;
}

// ─── LinkedIn experience filter ──────────────────────────────
function liExpFilter(l: ExperienceLevel): string {
  return l === 'internship' ? '&f_E=1' : l === 'entry' ? '&f_E=1,2' : l === 'mid' ? '&f_E=3,4' : l === 'senior' ? '&f_E=4,5,6' : '';
}

// ─── Fetch LinkedIn ──────────────────────────────────────────
export async function fetchLinkedIn(kw: string, loc: string, exp: ExperienceLevel, page = 0): Promise<RawJob[]> {
  try {
    const lp = loc.toLowerCase().includes('india') ? 'India' : loc;
    const url = `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=${encodeURIComponent(kw)}&location=${encodeURIComponent(lp)}&start=${page * 25}${liExpFilter(exp)}`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'Accept': 'text/html' },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return [];
    const html = await res.text();
    const jobs: RawJob[] = [];
    const links: string[] = []; let m;
    const lr = /href="(https?:\/\/[^"]*linkedin\.com\/jobs\/view\/[^"]+)"[^>]*>/gi;
    while ((m = lr.exec(html))) { const h = m[1].split('?')[0]; if (!links.includes(h)) links.push(h); }
    const titles: string[] = [];
    const tr = /<span[^>]*class="sr-only"[^>]*>([^<]+)<\/span>/gi;
    while ((m = tr.exec(html))) titles.push(m[1].trim());
    const cm = html.match(/class="[^"]*base-search-card__subtitle[^"]*"[\s\S]*?<a[^>]*>([^<]+)<\/a>/gi) || [];
    const cos = cm.map(x => { const m2 = x.match(/>([^<]+)<\/a>/); return m2 ? m2[1].trim() : 'Unknown'; });
    const lm = html.match(/class="[^"]*job-search-card__location[^"]*"[^>]*>[^<]+/gi) || [];
    const locs = lm.map(x => { const m2 = x.match(/>([^<]+)$/); return m2 ? m2[1].trim() : lp; });
    for (let i = 0; i < Math.min(links.length, titles.length, 25); i++) {
      jobs.push({ title: titles[i] || 'Unknown', company: cos[i] || 'Unknown', location: locs[i] || lp, source: 'linkedin', job_url: links[i], description: `${titles[i]} at ${cos[i] || 'Unknown'}` });
    }
    return jobs;
  } catch { return []; }
}

// ─── Fetch Unstop ────────────────────────────────────────────
export async function fetchUnstop(kw: string, exp: ExperienceLevel, page = 0): Promise<RawJob[]> {
  try {
    const opp = exp === 'internship' ? 'internships' : 'jobs';
    const url = `https://unstop.com/api/public/opportunity/search-result?opportunity=${opp}&per_page=25&page=${page + 1}&oppstatus=open&search=${encodeURIComponent(kw)}`;
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' }, signal: AbortSignal.timeout(10000) });
    if (!res.ok) return [];
    const data = await res.json();
    const arr = data?.data?.data;
    if (!Array.isArray(arr)) return [];
    return arr.map((o: Record<string, unknown>): RawJob | null => {
      if (!o.title) return null;
      const ls = Array.isArray(o.locations) ? o.locations : [];
      const city = ls.length > 0 ? (ls as Array<Record<string, unknown>>).map(l => `${l.city || ''}`).filter(Boolean).join(', ') : 'India';
      const seo = String(o.seo_url || ''); const sh = String(o.short_url || ''); const pu = String(o.public_url || '');
      const jurl = seo.startsWith('http') ? seo : sh.startsWith('http') ? sh : pu ? `https://unstop.com/${pu}` : 'https://unstop.com';
      return {
        title: String(o.title).trim(),
        company: String((typeof o.organisation === 'object' && o.organisation ? (o.organisation as Record<string, unknown>).name : o.organisation) || 'Unknown').trim(),
        location: city || 'India', source: 'unstop', job_url: jurl,
        description: String(o.details || o.short_desc || '').replace(/<[^>]*>/g, '').substring(0, 500),
      };
    }).filter((j): j is RawJob => j !== null);
  } catch { return []; }
}

// ─── Fetch JSearch (RapidAPI) — PRIMARY SOURCE ───────────────
export async function fetchJSearch(kw: string, loc: string, exp: ExperienceLevel, numPages = 3): Promise<RawJob[]> {
  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) return [];
  try {
    const lp = loc.toLowerCase().includes('india') ? 'India' : loc;
    const empType = exp === 'internship' ? '&employment_types=INTERN' : '';
    const url = `https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(`${kw} in ${lp}`)}&page=1&num_pages=${numPages}&date_posted=month${empType}`;
    const res = await fetch(url, {
      headers: { 'x-rapidapi-key': apiKey, 'x-rapidapi-host': 'jsearch.p.rapidapi.com' },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) { console.warn(`[JSearch] ${res.status} for "${kw}"`); return []; }
    const data = await res.json();
    const arr = data?.data;
    if (!Array.isArray(arr)) return [];
    return arr.map((item: Record<string, unknown>): RawJob => ({
      title: String(item.job_title || 'Unknown'),
      company: String(item.employer_name || 'Unknown'),
      location: [item.job_city, item.job_state, item.job_country].filter(Boolean).join(', ') || 'Remote',
      source: 'jsearch' as const,
      job_url: String(item.job_apply_link || item.job_google_link || ''),
      description: String(item.job_description || '').substring(0, 500),
    }));
  } catch (err) { console.error('[JSearch] error:', err); return []; }
}

// ─── Scored job ──────────────────────────────────────────────
interface ScoredJob extends RawJob { relevance: number; tier: number; expMatch: number; score: number; }

// ─── Dedup ───────────────────────────────────────────────────
function dedup(jobs: RawJob[]): RawJob[] {
  const urls = new Set<string>(), keys = new Set<string>();
  return jobs.filter(j => {
    if (j.job_url && urls.has(j.job_url)) return false;
    if (j.job_url) urls.add(j.job_url);
    const k = `${j.title.toLowerCase().trim()}|${(j.company || '').toLowerCase().trim()}`;
    if (keys.has(k)) return false;
    keys.add(k);
    return true;
  });
}

// ─── MAIN ────────────────────────────────────────────────────
export async function fetchAllJobs(
  keywords: string[],
  location: string,
  experience: ExperienceLevel = 'any',
  preferEstablished: boolean = true
): Promise<RawJob[]> {
  const loc = location || 'India';
  const queries = deduplicateKeywords(keywords);
  const eq = experience === 'internship' ? queries.map(q => `${q} intern`) : queries;
  console.log(`[JobPilot] ${keywords.length} keywords → ${eq.length} queries`);

  // ─── JSearch: PRIMARY source (most reliable, structured data) ───
  // Use top 10 queries, 3 pages each = ~300 potential results
  const hasJSearch = !!process.env.RAPIDAPI_KEY;
  const jsearchJobs: RawJob[] = [];
  if (hasJSearch) {
    const jsQueries = eq.slice(0, 10);
    console.log(`[JSearch] Fetching ${jsQueries.length} queries × 3 pages...`);
    // Batch 5 at a time to avoid overwhelming API
    for (let i = 0; i < jsQueries.length; i += 5) {
      const batch = jsQueries.slice(i, i + 5);
      const results = await Promise.all(batch.map(q => fetchJSearch(q, loc, experience, 3)));
      for (const r of results) jsearchJobs.push(...r);
    }
    console.log(`[JSearch] Got ${jsearchJobs.length} raw jobs`);
  }

  // ─── Unstop: secondary source ──────────────────────────────
  const unstopJobs: RawJob[] = [];
  const uQueries = eq.slice(0, 15);
  const uResults = await Promise.all(uQueries.map(q => fetchUnstop(q, experience, 0)));
  for (const r of uResults) unstopJobs.push(...r);
  console.log(`[Unstop] Got ${unstopJobs.length} raw jobs`);

  // ─── LinkedIn: tertiary (rate-limited, best effort) ────────
  const linkedInJobs: RawJob[] = [];
  const liQueries = eq.slice(0, 4); // Only 4 queries to minimize 429s
  for (const q of liQueries) {
    const r = await fetchLinkedIn(q, loc, experience, 0);
    linkedInJobs.push(...r);
    if (liQueries.indexOf(q) < liQueries.length - 1) await new Promise(r => setTimeout(r, 2000));
  }
  console.log(`[LinkedIn] Got ${linkedInJobs.length} raw jobs`);

  // ─── Deduplicate ───────────────────────────────────────────
  const allJobs = dedup([...jsearchJobs, ...linkedInJobs, ...unstopJobs]);
  console.log(`[JobPilot] Unique after dedup: ${allJobs.length}`);

  // ─── Score all jobs ────────────────────────────────────────
  let negCount = 0, relCount = 0, expCount = 0;
  const scored: ScoredJob[] = [];

  for (const job of allJobs) {
    if (isNegativeMatch(job.title, job.description || '')) { negCount++; continue; }

    const relevance = scoreRelevance(job.title, job.description || '', keywords);
    if (relevance < 0.15) { relCount++; continue; }

    const expMatch = scoreExperience(job.title, job.description || '', experience, job.source);
    if (expMatch < 0.1) { expCount++; continue; }

    const tier = getCompanyTier(job.company);

    // Score: relevance + experience + company bonus
    // Known companies get a BIG bonus but unknown ones are NOT blocked
    let score = relevance * 2 + expMatch * 1.5;
    score += tier * 1.5; // Tier 3=1.5, Tier 2=3, Tier 1=4.5 bonus

    scored.push({ ...job, relevance, tier, expMatch, score });
  }

  console.log(`[JobPilot] Rejected: negative=${negCount}, relevance=${relCount}, experience=${expCount}`);
  console.log(`[JobPilot] Scored: ${scored.length} jobs`);

  // ─── Sort by score (verified companies float to top) ───────
  scored.sort((a, b) => b.score - a.score);

  // ─── Return top results ────────────────────────────────────
  const final = scored.slice(0, MAX_JOBS);
  console.log(`[JobPilot] Returning ${final.length} jobs (${final.filter(j => j.tier > 0).length} from verified companies)`);

  return final.map(({ relevance, tier, expMatch, score, ...job }) => job);
}
