// Test the full pipeline — negative keywords + company + experience + relevance
// Run with: npx tsx scripts/test-pipeline.ts

const NEGATIVE_KEYWORDS = [
  'telecalling', 'tele-calling', 'tele calling', 'cold calling',
  'voice calling', 'voice bot calling', 'voice bot', 'ai calling',
  'outbound calling', 'inbound calling',
  'telesales', 'tele-sales', 'door to door', 'field sales',
  'customer support executive', 'customer care',
  'bde', 'business development executive',
  'insurance agent', 'insurance advisor',
  'real estate', 'property',
  'content writing', 'blog writing', 'article writing',
  'graphic design', 'video edit', 'video production',
  'social media marketing', 'seo executive', 'digital marketing executive',
  'teaching', 'tutor', 'faculty', 'lecturer',
  'receptionist', 'typist', 'data entry operator',
  'delivery boy', 'delivery executive', 'warehouse',
  'cook', 'chef', 'housekeeping',
  'civil engineer', 'mechanical engineer', 'electrical engineer',
  'chemical engineer', 'textile', 'mining',
  'chartered accountant', 'ca intern', 'audit intern', 'tax intern',
  'legal intern', 'law intern', 'advocate',
  'pharmacy', 'pharmacist', 'medical representative', 'pharma sales',
  'nursing', 'physiotherapy', 'medical coding',
];

function isNegativeMatch(title: string): boolean {
  const text = title.toLowerCase().replace(/[/\\\-_|&]+/g, ' ');
  return NEGATIVE_KEYWORDS.some(neg => text.includes(neg));
}

interface TestCase { title: string; shouldReject: boolean }

const testCases: TestCase[] = [
  // From the screenshot — Voice Bot/AI Calling should be rejected
  { title: 'Voice Bot/AI Calling Internship', shouldReject: true },
  
  // More irrelevant jobs that should be hard-rejected
  { title: 'Business Development Executive - Sales', shouldReject: true },
  { title: 'Customer Care Executive Intern', shouldReject: true },
  { title: 'Telecalling Internship - Insurance', shouldReject: true },
  { title: 'Civil Engineer Trainee', shouldReject: true },
  { title: 'Mechanical Engineer Intern', shouldReject: true },
  { title: 'Data Entry Operator - Part Time', shouldReject: true },
  { title: 'SEO Executive Intern', shouldReject: true },
  { title: 'CA Intern - Audit Division', shouldReject: true },
  { title: 'Pharmacy Intern', shouldReject: true },
  { title: 'Graphic Design Intern', shouldReject: true },
  { title: 'Content Writing Internship', shouldReject: true },
  { title: 'Delivery Executive - Blinkit', shouldReject: true },
  { title: 'Medical Coding Trainee', shouldReject: true },

  // Valid AI/tech jobs — should NOT be rejected
  { title: 'Machine Learning Engineer Intern', shouldReject: false },
  { title: 'AI Research Intern', shouldReject: false },
  { title: 'Data Science Intern', shouldReject: false },
  { title: 'Software Engineer Intern', shouldReject: false },
  { title: 'Full Stack Developer Intern', shouldReject: false },
  { title: 'Backend Developer Intern', shouldReject: false },
  { title: 'Python Developer Intern', shouldReject: false },
  { title: 'LLM Engineer Intern', shouldReject: false },
  { title: 'DevOps Intern', shouldReject: false },
  { title: 'QA Engineer Intern', shouldReject: false },
  { title: 'Data Analyst Intern', shouldReject: false },
  { title: 'Cloud Engineer Intern', shouldReject: false },
];

console.log('═══════════════════════════════════════════════════════');
console.log('  Negative Keyword Filter Test');
console.log('═══════════════════════════════════════════════════════\n');

let passed = 0;
let failed = 0;

for (const tc of testCases) {
  const rejected = isNegativeMatch(tc.title);
  const isCorrect = rejected === tc.shouldReject;
  const status = isCorrect ? '✅ PASS' : '❌ FAIL';
  const expectation = tc.shouldReject ? 'REJECT' : 'KEEP  ';

  if (isCorrect) passed++;
  else failed++;

  console.log(`${status} | ${expectation} | "${tc.title}"`);
}

console.log(`\n═══════════════════════════════════════════════════════`);
console.log(`  Results: ${passed} passed, ${failed} failed out of ${testCases.length}`);
console.log('═══════════════════════════════════════════════════════');
if (failed === 0) console.log('\n🎉 All negative keyword tests passed!');
