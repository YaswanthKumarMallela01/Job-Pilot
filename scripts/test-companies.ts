// Test company whitelist against real examples
// Run with: npx tsx scripts/test-companies.ts

import { getCompanyTier, isKnownCompany } from '../lib/companies';

interface TestCase { company: string; shouldBeKnown: boolean }

const testCases: TestCase[] = [
  // From screenshot — these are FRAUD/UNKNOWN companies that should be FILTERED
  { company: 'Inficore Soft', shouldBeKnown: false },
  { company: 'Sankar Group', shouldBeKnown: false },
  { company: 'Quarki technologies', shouldBeKnown: false },
  { company: 'DigiChefs', shouldBeKnown: false },

  // Top companies that SHOULD be kept
  { company: 'Google', shouldBeKnown: true },
  { company: 'Microsoft', shouldBeKnown: true },
  { company: 'Amazon', shouldBeKnown: true },
  { company: 'Meta', shouldBeKnown: true },
  { company: 'Apple', shouldBeKnown: true },
  { company: 'NVIDIA', shouldBeKnown: true },
  { company: 'OpenAI', shouldBeKnown: true },
  { company: 'Flipkart', shouldBeKnown: true },
  { company: 'Razorpay', shouldBeKnown: true },
  { company: 'Swiggy', shouldBeKnown: true },
  { company: 'Zomato', shouldBeKnown: true },
  { company: 'PhonePe', shouldBeKnown: true },
  { company: 'CRED', shouldBeKnown: true },

  // Indian IT — should be known
  { company: 'Tata Consultancy Services', shouldBeKnown: true },
  { company: 'TCS', shouldBeKnown: true },
  { company: 'Infosys', shouldBeKnown: true },
  { company: 'Wipro', shouldBeKnown: true },
  { company: 'HCL Technologies', shouldBeKnown: true },
  { company: 'Tech Mahindra', shouldBeKnown: true },
  { company: 'Zoho', shouldBeKnown: true },

  // Consulting / Finance — should be known
  { company: 'Deloitte', shouldBeKnown: true },
  { company: 'Goldman Sachs', shouldBeKnown: true },
  { company: 'Morgan Stanley', shouldBeKnown: true },
  { company: 'Accenture', shouldBeKnown: true },
  { company: 'KPMG', shouldBeKnown: true },

  // Indian Banks
  { company: 'HDFC Bank', shouldBeKnown: true },
  { company: 'ICICI Bank', shouldBeKnown: true },

  // More small/unknown companies that should be FILTERED
  { company: 'XYZ Solutions Pvt Ltd', shouldBeKnown: false },
  { company: 'TechStar Innovations', shouldBeKnown: false },
  { company: 'Random Startup Inc', shouldBeKnown: false },
  { company: 'ABC Corp', shouldBeKnown: false },

  // Tricky edge cases — company names with suffixes
  { company: 'Tata Consultancy Services Limited', shouldBeKnown: true },
  { company: 'Infosys Limited', shouldBeKnown: true },
  { company: 'Wipro Technologies', shouldBeKnown: true },
  { company: 'Amazon India', shouldBeKnown: true },
  { company: 'Google India Pvt Ltd', shouldBeKnown: true },
  { company: 'Walmart Global Tech India', shouldBeKnown: true },

  // Indian unicorns / startups
  { company: 'BrowserStack', shouldBeKnown: true },
  { company: 'Postman', shouldBeKnown: true },
  { company: 'Freshworks', shouldBeKnown: true },
  { company: 'Lenskart', shouldBeKnown: true },
  { company: 'Meesho', shouldBeKnown: true },
];

console.log('═══════════════════════════════════════════════════════');
console.log('  Company Whitelist Test');
console.log('═══════════════════════════════════════════════════════\n');

let passed = 0;
let failed = 0;

for (const tc of testCases) {
  const tier = getCompanyTier(tc.company);
  const known = isKnownCompany(tc.company);
  const isCorrect = known === tc.shouldBeKnown;

  const status = isCorrect ? '✅ PASS' : '❌ FAIL';
  const expectation = tc.shouldBeKnown ? 'KNOWN' : 'UNKNOWN';

  if (isCorrect) passed++;
  else failed++;

  console.log(`${status} | Tier ${tier} | ${expectation.padEnd(7)} | "${tc.company}"`);
}

console.log(`\n═══════════════════════════════════════════════════════`);
console.log(`  Results: ${passed} passed, ${failed} failed out of ${testCases.length}`);
console.log('═══════════════════════════════════════════════════════');
if (failed === 0) console.log('\n🎉 All company whitelist tests passed!');
else console.log('\n⚠️ Some tests failed — review the output above.');
