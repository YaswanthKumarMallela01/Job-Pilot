// Quick test to verify the relevance scoring logic works correctly
// Run with: npx tsx scripts/test-relevance.ts

const MODIFIER_WORDS = new Set([
  'intern', 'internship', 'junior', 'senior', 'associate', 'lead', 'staff',
  'principal', 'manager', 'head', 'director', 'vp', 'chief',
  'remote', 'hybrid', 'onsite', 'contract', 'freelance', 'part-time',
  'full-time', 'entry', 'level', 'i', 'ii', 'iii', 'iv', 'v',
  'work', 'job', 'position', 'role', 'opportunity', 'opening',
  'new', 'hiring', 'urgent', 'immediate', 'apply', 'now',
]);

const NOISE_WORDS = new Set(['the','and','for','with','from','into','are','was','has','had','can','may','will','not']);

const COMPOUND_TERMS = [
  'machine learning','deep learning','data science','data scientist',
  'data analyst','data engineer','data analytics',
  'artificial intelligence','computer vision','natural language',
  'full stack','fullstack','front end','frontend','front-end',
  'back end','backend','back-end','dev ops','devops',
  'generative ai','gen ai','genai','agentic ai',
  'software engineer','software developer','software development',
  'web developer','web development',
  'product manager','project manager','product engineer',
  'qa engineer','quality assurance','test engineer',
  'ml ops','mlops','ai engineer','ai developer',
  'rag engineer','llm engineer','llm developer',
  'prompt engineer','prompt engineering',
  'python developer','react developer','node developer',
  'cloud engineer','site reliability','sre',
  'ui ux','ux designer','ui designer',
  'business analyst','business intelligence',
  'solutions architect','system engineer','systems engineer',
];

const GENERIC_ROLE_WORDS = new Set([
  'developer', 'engineer', 'analyst', 'scientist', 'architect',
  'designer', 'specialist', 'consultant', 'coordinator',
]);

const DOMAIN_QUALIFIERS = new Set([
  'ai', 'ml', 'machine', 'learning', 'deep', 'data', 'software',
  'backend', 'frontend', 'fullstack', 'full', 'stack', 'web',
  'python', 'cloud', 'devops', 'mlops', 'llm', 'genai', 'gen',
  'generative', 'prompt', 'rag', 'agentic', 'automation',
  'qa', 'quality', 'test', 'project', 'product', 'research',
  'natural', 'language', 'computer', 'vision', 'neural',
]);

function tokenizePhrase(phrase: string): string[] {
  let lower = phrase.toLowerCase().trim();
  const tokens: string[] = [];
  for (const compound of COMPOUND_TERMS) {
    if (lower.includes(compound)) {
      tokens.push(compound);
      lower = lower.replace(compound, ' ').trim();
    }
  }
  const words = lower.split(/[\s\-_/,]+/).filter(w => w.length > 1);
  for (const word of words) {
    if (!NOISE_WORDS.has(word) && !tokens.some(t => t.includes(word))) {
      tokens.push(word);
    }
  }
  return tokens;
}

function classifyTokens(tokens: string[]): { core: string[]; modifiers: string[] } {
  const core: string[] = [];
  const modifiers: string[] = [];
  for (const token of tokens) {
    if (token.includes(' ') || !MODIFIER_WORDS.has(token)) {
      core.push(token);
    } else {
      modifiers.push(token);
    }
  }
  return { core, modifiers };
}

function matchesAsWord(text: string, word: string): boolean {
  if (word.length <= 3) {
    const regex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    return regex.test(text);
  }
  return text.includes(word);
}

function scoreKeywordMatch(jobTitle: string, keywordPhrase: string): number {
  const titleTokens = tokenizePhrase(jobTitle);
  const keywordTokens = tokenizePhrase(keywordPhrase);
  const { core: coreKeywords, modifiers: modKeywords } = classifyTokens(keywordTokens);
  if (coreKeywords.length === 0) return 0;
  const titleLower = jobTitle.toLowerCase();

  let coreMatches = 0;
  let hasCompoundMatch = false;
  let hasDomainMatch = false;
  let hasOnlyGenericMatch = false;

  for (const coreWord of coreKeywords) {
    let matched = false;
    if (coreWord.includes(' ')) {
      if (titleLower.includes(coreWord)) {
        matched = true; hasCompoundMatch = true;
      } else {
        const parts = coreWord.split(/\s+/);
        const allPartsMatch = parts.every(p => matchesAsWord(titleLower, p));
        if (allPartsMatch) { matched = true; hasCompoundMatch = true; }
      }
    } else {
      if (titleTokens.some(t => t === coreWord) || matchesAsWord(titleLower, coreWord)) {
        matched = true;
        if (DOMAIN_QUALIFIERS.has(coreWord)) hasDomainMatch = true;
        else if (GENERIC_ROLE_WORDS.has(coreWord)) hasOnlyGenericMatch = true;
        else hasDomainMatch = true;
      }
    }
    if (matched) coreMatches++;
  }

  if (coreMatches === 0) return 0;
  const coreRatio = coreMatches / coreKeywords.length;

  if (hasOnlyGenericMatch && !hasDomainMatch && !hasCompoundMatch) {
    const titleHasDomainContext = titleTokens.some(t => DOMAIN_QUALIFIERS.has(t));
    if (!titleHasDomainContext) {
      return Math.min(0.25, coreRatio * 0.3);
    }
  }

  let modBonus = 0;
  if (modKeywords.length > 0) {
    let modMatches = 0;
    for (const mod of modKeywords) { if (titleLower.includes(mod)) modMatches++; }
    modBonus = (modMatches / modKeywords.length) * 0.15;
  }
  const phraseBonus = titleLower.includes(keywordPhrase.toLowerCase()) ? 0.2 : 0;
  return Math.min(1.0, coreRatio * 0.8 + modBonus + phraseBonus);
}

function scoreJobRelevance(jobTitle: string, keywords: string[]): number {
  let bestScore = 0;
  for (const keyword of keywords) {
    const score = scoreKeywordMatch(jobTitle, keyword);
    if (score > bestScore) bestScore = score;
  }
  return bestScore;
}

// ─── TEST CASES ──────────────────────────────────────────────
const USER_KEYWORDS = [
  'AI Engineer Intern', 'Generative AI Intern', 'LLM Engineer Intern',
  'Machine Learning Engineer Intern', 'AI Application Developer Intern',
  'Data Science Intern', 'Prompt Engineer Intern', 'AI Automation Intern',
  'Python Developer Intern AI', 'AI Research Intern', 'GenAI Intern',
  'LLM Developer', 'AI Full Stack Developer', 'AI Product Engineer',
  'RAG Engineer', 'AI Backend Engineer', 'MLOps Intern',
  'Agentic AI Developer', 'Software Engineer', 'Data Analyst',
  'Frontend Developer', 'Full Stack Developer', 'Backend Developer',
  'Machine Learning', 'Data Scientist', 'QA Engineer', 'Project Manager',
];

const THRESHOLD = 0.35;

interface TestCase { title: string; shouldMatch: boolean }

const testCases: TestCase[] = [
  // SHOULD MATCH (relevant)
  { title: 'Machine Learning Engineer Intern', shouldMatch: true },
  { title: 'AI Engineer - Internship', shouldMatch: true },
  { title: 'Software Engineer', shouldMatch: true },
  { title: 'Data Analyst', shouldMatch: true },
  { title: 'Data Scientist - ML', shouldMatch: true },
  { title: 'Full Stack Developer', shouldMatch: true },
  { title: 'Backend Developer', shouldMatch: true },
  { title: 'Frontend Developer', shouldMatch: true },
  { title: 'MLOps Engineer Intern', shouldMatch: true },
  { title: 'LLM Engineer', shouldMatch: true },
  { title: 'Generative AI Developer', shouldMatch: true },
  { title: 'AI Application Developer Intern', shouldMatch: true },
  { title: 'Python Developer - AI Team', shouldMatch: true },
  { title: 'QA Engineer', shouldMatch: true },
  { title: 'Project Manager', shouldMatch: true },
  { title: 'RAG Engineer - LLM Applications', shouldMatch: true },
  { title: 'Prompt Engineer', shouldMatch: true },
  { title: 'Deep Learning Research Intern', shouldMatch: true },

  // SHOULD NOT MATCH (irrelevant)
  { title: 'Graphic Design Intern', shouldMatch: false },
  { title: 'Business Development & Training Coordinator Internship', shouldMatch: false },
  { title: 'Global Sales Operations Intern', shouldMatch: false },
  { title: 'Junior JavaScript Developer - Remote work', shouldMatch: false },
  { title: 'Mobile Developer - React Native (Internship)', shouldMatch: false },
  { title: 'Marketing Manager Intern', shouldMatch: false },
  { title: 'HR Coordinator Intern', shouldMatch: false },
  { title: 'Content Writer Intern', shouldMatch: false },
  { title: 'Video Editor Internship', shouldMatch: false },
  { title: 'Social Media Manager', shouldMatch: false },
  { title: 'Accounting Intern', shouldMatch: false },
  { title: 'Supply Chain Analyst Intern', shouldMatch: false },
  { title: 'Mechanical Engineer Intern', shouldMatch: false },
  { title: 'Civil Engineer Intern', shouldMatch: false },
  { title: "Master's Hardware Engineering Internship", shouldMatch: false },
  { title: 'Electrical Engineer Intern', shouldMatch: false },
  { title: 'Sales Executive', shouldMatch: false },
  { title: 'Customer Support Agent', shouldMatch: false },
  { title: 'Legal Intern', shouldMatch: false },
  { title: 'Finance Analyst Intern', shouldMatch: false },
];

console.log('═══════════════════════════════════════════════════════');
console.log('  JobPilot Relevance Scoring Test');
console.log('═══════════════════════════════════════════════════════\n');

let passed = 0;
let failed = 0;

for (const tc of testCases) {
  const score = scoreJobRelevance(tc.title, USER_KEYWORDS);
  const wouldInclude = score >= THRESHOLD;
  const isCorrect = wouldInclude === tc.shouldMatch;

  const status = isCorrect ? '✅ PASS' : '❌ FAIL';
  const expectation = tc.shouldMatch ? 'RELEVANT' : 'IRRELEVANT';

  if (isCorrect) passed++;
  else failed++;

  const line = `${status} | Score: ${score.toFixed(3)} | ${expectation.padEnd(10)} | "${tc.title}"`;
  console.log(line);
}

console.log('\n═══════════════════════════════════════════════════════');
console.log(`  Results: ${passed} passed, ${failed} failed out of ${testCases.length}`);
console.log('═══════════════════════════════════════════════════════');

if (failed > 0) {
  console.log('\n⚠️  Some tests failed — review the scoring logic.');
  process.exit(1);
} else {
  console.log('\n🎉 All tests passed! Relevance filtering is working correctly.');
}
