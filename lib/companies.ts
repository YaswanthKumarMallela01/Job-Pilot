// ─── Company Reputation Database ─────────────────────────────
// Used to score and prioritize jobs from well-known, established companies
// Tier 1 (score 3): FAANG, top global tech
// Tier 2 (score 2): Well-known tech, unicorns, large enterprises
// Tier 3 (score 1): Established Indian IT, growing startups, consulting firms

const TIER_1: string[] = [
  // FAANG / Magnificent 7
  'google', 'alphabet', 'meta', 'facebook', 'amazon', 'apple', 'microsoft',
  'netflix', 'nvidia', 'tesla',
  // Top global tech
  'openai', 'anthropic', 'deepmind', 'databricks', 'snowflake', 'palantir',
  'stripe', 'spacex', 'bloomberg', 'oracle', 'ibm', 'intel', 'amd',
  'qualcomm', 'samsung', 'sony', 'cisco', 'dell', 'hp', 'hewlett packard',
  'sap', 'vmware', 'broadcom', 'adobe', 'salesforce',
];

const TIER_2: string[] = [
  // Well-known tech companies
  'uber', 'lyft', 'airbnb', 'spotify', 'twitter', 'x corp', 'snap',
  'pinterest', 'reddit', 'linkedin', 'slack', 'zoom', 'twilio',
  'cloudflare', 'datadog', 'elastic', 'mongodb', 'confluent',
  'hashicorp', 'atlassian', 'jira', 'github', 'gitlab',
  'shopify', 'square', 'block', 'paypal', 'visa', 'mastercard',
  'american express', 'goldman sachs', 'morgan stanley', 'jpmorgan',
  'jp morgan', 'blackrock', 'citadel', 'two sigma', 'jane street',
  'robinhood', 'coinbase', 'binance', 'ripple',
  'dropbox', 'box', 'notion', 'figma', 'canva', 'vercel',
  'supabase', 'netlify', 'digitalocean', 'linode', 'akamai',
  'palo alto networks', 'crowdstrike', 'fortinet', 'zscaler',
  'servicenow', 'workday', 'hubspot', 'zendesk', 'freshworks',
  'twitch', 'epic games', 'roblox', 'unity', 'ea', 'electronic arts',
  'autodesk', 'intuit', 'docusign', 'okta', 'splunk',
  'boeing', 'lockheed martin', 'raytheon', 'general electric', 'ge',
  'siemens', 'bosch', 'philips', 'honeywell', 'johnson controls',
  'procter & gamble', 'p&g', 'unilever', 'nestle', 'coca-cola',
  'pepsico', 'johnson & johnson', 'pfizer', 'novartis', 'roche',
  'mckinsey', 'bcg', 'boston consulting', 'bain', 'deloitte',
  'kpmg', 'ey', 'ernst & young', 'pwc', 'pricewaterhousecoopers',
  'accenture', 'capgemini', 'cognizant', 'thoughtworks',
  'samsung', 'lg', 'huawei', 'xiaomi', 'bytedance', 'tiktok',
  'baidu', 'alibaba', 'tencent', 'grab', 'gojek',
  // Other notable
  'walmart', 'target', 'costco', 'starbucks', 'disney', 'warner bros',
  'nbc universal', 'fox', 'viacom', 'paramount',
  'hsbc', 'barclays', 'citibank', 'citi', 'deutsche bank',
  'ubs', 'credit suisse', 'bnp paribas', 'standard chartered',
  'ikea', 'nike', 'adidas', 'louis vuitton', 'lvmh',
  'bmw', 'mercedes', 'audi', 'volkswagen', 'toyota', 'honda',
  'ford', 'general motors', 'gm',
];

const TIER_3: string[] = [
  // Indian IT / Services
  'tcs', 'tata consultancy', 'tata', 'infosys', 'wipro', 'hcl',
  'hcl technologies', 'tech mahindra', 'l&t', 'larsen & toubro',
  'l&t infotech', 'lti', 'ltimindtree', 'mindtree', 'mphasis',
  'persistent systems', 'cyient', 'zensar', 'hexaware',
  'coforge', 'niit', 'birlasoft', 'mastek', 'sonata software',
  // Indian unicorns / well-funded startups
  'flipkart', 'meesho', 'swiggy', 'zomato', 'razorpay', 'cred',
  'phonepe', 'paytm', 'ola', 'ola electric', 'byjus', "byju's",
  'unacademy', 'upgrad', 'vedantu', 'physicswallah',
  'zerodha', 'groww', 'dream11', 'dream sports', 'mpl',
  'nykaa', 'myntra', 'ajio', 'urban company', 'urbanclap',
  'lenskart', 'boat', 'noise', 'fire-boltt',
  'ola cabs', 'rapido', 'dunzo', 'blinkit', 'zepto', 'instamart',
  'freshworks', 'zoho', 'chargebee', 'browserstack', 'postman',
  'hasura', 'druva', 'icertis', 'moglix', 'delhivery',
  'rivigo', 'blackbuck', 'licious', 'bigbasket', 'jiomart',
  'reliance', 'reliance jio', 'jio', 'jio platforms',
  'mahindra', 'bajaj', 'adani', 'godrej', 'hdfc', 'icici',
  'kotak', 'axis bank', 'sbi', 'state bank',
  'bharti airtel', 'airtel', 'vodafone', 'vi',
  'oyo', 'makemytrip', 'cleartrip', 'policybazaar', 'paisa bazaar',
  'sharechat', 'moj', 'koo', 'verse innovation', 'dailyhunt',
  'cars24', 'spinny', 'park+', 'ather energy',
  'slice', 'jupiter', 'fi', 'niyo', 'khatabook',
  'mamaearth', 'sugar cosmetics', 'plum',
  // Indian public sector / research
  'isro', 'drdo', 'barc', 'iit', 'iisc', 'nit',
  'npci', 'uidai', 'nic', 'cdac',
  // Other established
  'samsung india', 'amazon india', 'google india', 'microsoft india',
  'goldman sachs india', 'morgan stanley india', 'jpmorgan india',
  'deutsche bank india', 'barclays india', 'hsbc india',
  'bosch india', 'siemens india', 'abb', 'schneider electric',
  'dell india', 'hp india', 'cisco india', 'intel india',
  'qualcomm india', 'nvidia india', 'amd india',
  'walmart global tech', 'walmart labs',
  'media.net', 'directi', 'indeed', 'glassdoor',
  'sprinklr', 'commvault', 'nutanix', 'cohesity',
  'pega', 'pegasystems', 'uipath', 'automation anywhere',
  'harness', 'thales', 'dassault', 'airbus',
];

// Build a normalized lookup map for O(1) matching
const companyTierMap = new Map<string, number>();

for (const name of TIER_1) {
  companyTierMap.set(name.toLowerCase().trim(), 3);
}
for (const name of TIER_2) {
  if (!companyTierMap.has(name.toLowerCase().trim())) {
    companyTierMap.set(name.toLowerCase().trim(), 2);
  }
}
for (const name of TIER_3) {
  if (!companyTierMap.has(name.toLowerCase().trim())) {
    companyTierMap.set(name.toLowerCase().trim(), 1);
  }
}

/**
 * Get the reputation tier of a company (0-3).
 * Performs fuzzy matching: checks if any known company name is contained
 * in the provided name, or vice versa.
 */
export function getCompanyTier(companyName: string): number {
  if (!companyName) return 0;
  const normalized = companyName.toLowerCase().trim();

  // Exact match
  if (companyTierMap.has(normalized)) {
    return companyTierMap.get(normalized)!;
  }

  // Fuzzy: check if any known company is a substring of the input,
  // or if the input is a substring of a known company
  for (const [knownName, tier] of companyTierMap.entries()) {
    // "Tata Consultancy Services Limited" contains "tata consultancy"
    if (normalized.includes(knownName) || knownName.includes(normalized)) {
      return tier;
    }
  }

  return 0; // Unknown company
}

/**
 * Check if a company is in our known companies database at all.
 */
export function isKnownCompany(companyName: string): boolean {
  return getCompanyTier(companyName) > 0;
}
