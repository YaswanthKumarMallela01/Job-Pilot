// Test experience-level filtering against the actual jobs from the screenshot
// Run with: npx tsx scripts/test-experience.ts

const INTERN_SIGNALS = ['intern', 'internship', 'trainee', 'apprentice', 'fresher', 'fresh graduate', 'graduate trainee', 'co-op', 'coop', 'summer analyst', 'summer associate', 'placement'];
const SENIOR_SIGNALS = ['senior', 'sr', 'staff', 'principal', 'lead', 'architect', 'director', 'vp', 'vice president', 'head of', 'chief', 'cto', 'cio', 'distinguished', 'fellow'];
const MID_SIGNALS = ['mid', 'mid-level', 'mid level', 'ii', 'iii', 'level 2', 'level 3', 'l3', 'l4', 'l5'];
const YEARS_EXP_REGEX = /(\d+)\+?\s*(?:years?|yrs?)\s*(?:of\s+)?(?:experience|exp)/i;

function matchesAsWord(text: string, word: string): boolean {
  if (word.length <= 3) {
    const regex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    return regex.test(text);
  }
  return text.includes(word);
}

function scoreExperienceMatch(title: string, description: string): number {
  const text = `${title} ${description}`.toLowerCase();
  const titleLower = title.toLowerCase();
  const yearsMatch = YEARS_EXP_REGEX.exec(text);
  const yearsRequired = yearsMatch ? parseInt(yearsMatch[1], 10) : -1;

  const hasInternSignal = INTERN_SIGNALS.some(s => titleLower.includes(s));
  const hasSeniorSignal = SENIOR_SIGNALS.some(s => matchesAsWord(titleLower, s));
  const hasMidSignal = MID_SIGNALS.some(s => titleLower.includes(s));

  if (hasInternSignal) return 1.0;
  if (hasSeniorSignal) return 0.0;
  if (yearsRequired >= 3) return 0.0;
  if (hasMidSignal) return 0.0;
  const descHasInternSignal = INTERN_SIGNALS.some(s => text.includes(s));
  if (descHasInternSignal) return 0.8;
  return 0.15;
}

const THRESHOLD = 0.15;

interface TestCase { title: string; shouldPass: boolean }

const testCases: TestCase[] = [
  // From screenshot — should be FILTERED OUT (they're full-time, not internship)
  { title: 'LLM Model Developer', shouldPass: false },
  { title: 'Software Engineer (C# .NET & Delphi)', shouldPass: false },
  { title: 'LLM Developer', shouldPass: false },

  // From screenshot — should PASS (they have intern in title)
  { title: 'Full Stack Developer Intern', shouldPass: true },
  { title: 'DATA SCIENCE - ML INTERNSHIP AHMEDABAD', shouldPass: true },

  // Extra test cases
  { title: 'Machine Learning Engineer Intern', shouldPass: true },
  { title: 'AI Research Intern', shouldPass: true },
  { title: 'Data Science Intern', shouldPass: true },
  { title: 'Software Engineer Internship', shouldPass: true },
  { title: 'Backend Developer Intern', shouldPass: true },
  { title: 'Senior Software Engineer', shouldPass: false },
  { title: 'Lead Data Scientist', shouldPass: false },
  { title: 'Staff ML Engineer', shouldPass: false },
  { title: 'Principal Engineer - AI', shouldPass: false },
  { title: 'Director of Engineering', shouldPass: false },
  { title: 'Full Stack Developer', shouldPass: false }, // No intern signal — ambiguous, should be filtered at internship level
  { title: 'Data Analyst', shouldPass: false }, // Same — no intern signal
  { title: 'Python Developer', shouldPass: false },
];

console.log('═══════════════════════════════════════════════════════');
console.log('  Experience Level Filter Test (Internship mode)');
console.log('═══════════════════════════════════════════════════════\n');

let passed = 0;
let failed = 0;

for (const tc of testCases) {
  const score = scoreExperienceMatch(tc.title, '');
  const wouldPass = score > THRESHOLD;
  const isCorrect = wouldPass === tc.shouldPass;

  const status = isCorrect ? '✅ PASS' : '❌ FAIL';
  const expectation = tc.shouldPass ? 'KEEP' : 'FILTER';

  if (isCorrect) passed++;
  else failed++;

  console.log(`${status} | ExpScore: ${score.toFixed(2)} | ${expectation.padEnd(6)} | "${tc.title}"`);
}

console.log(`\n═══════════════════════════════════════════════════════`);
console.log(`  Results: ${passed} passed, ${failed} failed out of ${testCases.length}`);
console.log('═══════════════════════════════════════════════════════');
if (failed === 0) console.log('\n🎉 All experience filter tests passed!');
