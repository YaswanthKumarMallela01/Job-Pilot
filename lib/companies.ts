// ─── Top 500+ Trusted Companies Database ────────────────────
// Hard whitelist: when "Top Companies Only" is ON,
// ONLY jobs from these companies will be shown.
//
// Tier 1 (score 3): FAANG, top global tech, dream companies
// Tier 2 (score 2): Well-known tech, finance, consulting, unicorns
// Tier 3 (score 1): Established Indian IT, funded startups, PSUs, MNCs

const TIER_1: string[] = [
  // FAANG / Magnificent 7
  'google', 'alphabet', 'meta', 'facebook', 'amazon', 'apple', 'microsoft',
  'netflix', 'nvidia', 'tesla',
  // Top AI / Cloud
  'openai', 'anthropic', 'deepmind', 'databricks', 'snowflake', 'palantir',
  'stripe', 'spacex', 'bloomberg', 'oracle', 'ibm',
  // Top Semiconductor / Hardware
  'intel', 'amd', 'qualcomm', 'samsung', 'sony', 'cisco', 'dell', 'hp',
  'hewlett packard', 'broadcom', 'texas instruments', 'arm', 'micron',
  // Top SaaS / Enterprise
  'sap', 'vmware', 'adobe', 'salesforce', 'servicenow', 'workday',
  // Top Finance (Global)
  'goldman sachs', 'morgan stanley', 'jpmorgan', 'jp morgan',
  'blackrock', 'citadel', 'two sigma', 'jane street', 'de shaw',
  'tower research', 'world quant', 'worldquant',
  // Top Consulting
  'mckinsey', 'bcg', 'boston consulting', 'bain', 'bain & company',
];

const TIER_2: string[] = [
  // ─── Well-known Tech Companies ────────────────────────────
  'uber', 'lyft', 'airbnb', 'spotify', 'twitter', 'x corp', 'snap',
  'pinterest', 'reddit', 'linkedin', 'slack', 'zoom', 'twilio',
  'cloudflare', 'datadog', 'elastic', 'mongodb', 'confluent',
  'hashicorp', 'atlassian', 'github', 'gitlab',
  'shopify', 'square', 'block', 'paypal', 'robinhood', 'coinbase',
  'dropbox', 'notion', 'figma', 'canva', 'vercel',
  'supabase', 'netlify', 'digitalocean', 'akamai',
  'palo alto networks', 'crowdstrike', 'fortinet', 'zscaler',
  'hubspot', 'zendesk', 'freshworks',
  'twitch', 'epic games', 'unity', 'ea', 'electronic arts',
  'autodesk', 'intuit', 'docusign', 'okta', 'splunk',
  'roblox', 'discord', 'grammarly', 'duolingo',
  'doordash', 'instacart', 'rivian', 'lucid motors',
  'databricks', 'cockroachdb', 'timescale',
  'grafana', 'new relic', 'dynatrace', 'appdynamics',
  'mulesoft', 'kong', 'postman api',
  'contentful', 'sanity', 'strapi',
  'segment', 'amplitude', 'mixpanel', 'braze',
  'plaid', 'marqeta', 'affirm', 'klarna',
  'airtable', 'asana', 'monday', 'clickup',
  'webflow', 'framer', 'retool', 'appsmith',
  'snyk', 'sonarqube', 'jfrog', 'launchdarkly',
  'twilio', 'sendgrid', 'messagebird',
  'algolia', 'meilisearch',
  'mapbox', 'here technologies',
  'sentry', 'bugsnag',

  // ─── Big 4 + Consulting ───────────────────────────────────
  'deloitte', 'kpmg', 'ey', 'ernst & young', 'ernst and young',
  'pwc', 'pricewaterhousecoopers', 'accenture', 'capgemini',
  'cognizant', 'thoughtworks', 'boston consulting group',
  'oliver wyman', 'roland berger', 'strategy&', 'lek consulting',
  'zs associates', 'zs', 'atkearney', 'kearney',

  // ─── Finance / Banking (Global) ───────────────────────────
  'visa', 'mastercard', 'american express', 'amex',
  'hsbc', 'barclays', 'citibank', 'citi', 'citigroup',
  'deutsche bank', 'ubs', 'credit suisse', 'bnp paribas',
  'standard chartered', 'nomura', 'macquarie',
  'wells fargo', 'bank of america', 'capital one',
  'charles schwab', 'fidelity', 'vanguard',

  // ─── Manufacturing / Engineering ──────────────────────────
  'boeing', 'lockheed martin', 'general electric', 'ge',
  'siemens', 'bosch', 'honeywell', 'schneider electric', 'abb',
  'dassault', 'dassault systemes', 'airbus', 'thales',
  'rolls royce', 'caterpillar', 'john deere', '3m',
  'emerson', 'rockwell', 'parker hannifin',

  // ─── Consumer / FMCG ─────────────────────────────────────
  'procter & gamble', 'p&g', 'unilever', 'nestle', 'coca-cola', 'pepsico',
  'johnson & johnson', 'colgate', 'hindustan unilever', 'hul',
  'itc', 'itc limited', 'dabur', 'godrej consumer', 'marico',
  'britannia', 'parle', 'amul', 'mother dairy',
  'mondelez', 'mars', 'danone', 'kelloggs',
  'loreal', "l'oreal", 'nivea', 'beiersdorf',

  // ─── Pharma / Healthcare ──────────────────────────────────
  'pfizer', 'novartis', 'roche', 'dr reddy', 'dr reddys',
  'sun pharma', 'cipla', 'biocon', 'divis labs', 'lupin',
  'aurobindo', 'glenmark', 'torrent pharma', 'alkem',
  'abbott', 'medtronic', 'ge healthcare', 'philips healthcare',
  'johnson & johnson medical',

  // ─── Auto / EV ────────────────────────────────────────────
  'bmw', 'mercedes', 'audi', 'volkswagen', 'toyota', 'honda',
  'ford', 'general motors', 'gm', 'hyundai', 'kia',
  'tata motors', 'mahindra & mahindra', 'maruti', 'maruti suzuki',
  'hero motocorp', 'bajaj auto', 'tvs motor',
  'ola electric', 'ather energy', 'ather', 'revolt',

  // ─── Retail / eCommerce ───────────────────────────────────
  'walmart', 'target', 'costco', 'ikea',
  'amazon', 'flipkart', 'myntra', 'ajio', 'nykaa',

  // ─── Media / Entertainment ────────────────────────────────
  'disney', 'warner bros', 'nbc universal', 'paramount',
  'sony pictures', 'zee', 'star india', 'hotstar',
  'viacom18', 'jio cinema', 'netflix india',

  // ─── Asian Tech ───────────────────────────────────────────
  'samsung', 'lg', 'huawei', 'bytedance', 'tiktok',
  'baidu', 'alibaba', 'tencent', 'grab', 'sea group',
  'xiaomi', 'oppo', 'vivo', 'oneplus', 'realme',

  // ─── Other Global Notable ─────────────────────────────────
  'nike', 'adidas', 'puma', 'starbucks',
  'uipath', 'automation anywhere', 'pegasystems', 'pega',
  'media.net', 'directi', 'indeed', 'glassdoor',
  'sprinklr', 'commvault', 'nutanix', 'cohesity',
  'verint', 'nice systems', 'genesys',
  'wolters kluwer', 'thomson reuters', 'bloomberg',
  'gartner', 'idc', 'forrester',
];

const TIER_3: string[] = [
  // ─── Indian IT / Services ─────────────────────────────────
  'tcs', 'tata consultancy', 'tata consultancy services',
  'infosys', 'wipro',
  'hcl', 'hcl technologies', 'hcltech',
  'tech mahindra',
  'l&t', 'larsen & toubro', 'l&t infotech', 'lti', 'ltimindtree', 'lt infotech',
  'mindtree', 'mphasis',
  'persistent systems', 'persistent',
  'cyient', 'zensar', 'hexaware',
  'coforge', 'niit', 'birlasoft', 'mastek', 'sonata software',
  'happiest minds', 'newgen software', 'nucleus software',
  'sasken', 'subex', 'mroads', 'kellton tech', 'kellton',
  'vakrangee', 'affle', 'intellect design', 'ramco systems',
  'kpit technologies', 'kpit', 'tata elxsi',
  'l&t technology services', 'ltts',
  'cgi', 'cgi group', 'atos', 'dxc technology', 'dxc',
  'ntt data', 'ntt', 'fujitsu',
  'virtusa', 'mphasis', 'microland', 'mindteck',
  'softchoice', 'zenith', 'igate',
  'geometric', 'ansys', 'mathworks',
  'epicor', 'infor', 'ifs',
  'sopra steria', 'alten', 'altran',

  // ─── Indian Unicorns / Well-funded Startups ────────────────
  'flipkart', 'meesho', 'swiggy', 'zomato',
  'razorpay', 'cred', 'phonepe', 'paytm',
  'ola', 'ola electric', 'ola cabs',
  "byju's", 'byjus', 'unacademy', 'upgrad', 'vedantu', 'physicswallah',
  'zerodha', 'groww', 'dream11', 'dream sports',
  'nykaa', 'myntra', 'ajio', 'urban company', 'urbanclap',
  'lenskart', 'boat', 'noise',
  'rapido', 'dunzo', 'blinkit', 'zepto', 'instamart', 'bigbasket',
  'freshworks', 'zoho', 'chargebee', 'browserstack', 'postman',
  'hasura', 'druva', 'icertis', 'moglix', 'delhivery',
  'licious', 'jiomart',
  'oyo', 'makemytrip', 'cleartrip', 'ixigo', 'goibibo',
  'policybazaar', 'paisa bazaar', 'etmoney',
  'sharechat', 'dailyhunt', 'verse innovation',
  'cars24', 'spinny', 'ather energy', 'ather',
  'slice', 'jupiter', 'fi money', 'niyo', 'khatabook',
  'mamaearth', 'sugar cosmetics',
  'instamojo', 'cashfree', 'juspay', 'razorpay',
  'leadsquared', 'clevertap', 'webengage', 'moengage',
  'haptik', 'yellow.ai', 'yellow ai',
  'fractal analytics', 'fractal', 'mu sigma', 'tiger analytics',
  'sigmoid', 'latentview', 'latentview analytics',
  'tredence', 'manthan', 'dataweave',
  'mindtickle', 'darwinbox', 'springworks',
  'smallcase', 'angel one', 'upstox', 'dhan',
  'apna', 'internshala', 'naukri', 'monster india',
  'practo', 'pharmeasy', '1mg', 'netmeds', 'healthkart',
  'cure.fit', 'curefit', 'cult.fit', 'cultfit',
  'vedanta resources', 'sterlite', 'aditya birla capital',
  'portea', 'mfine',
  'zetwerk', 'moglix', 'udaan', 'infra.market',
  'rivigo', 'blackbuck', 'porter', 'rivigo',
  'spinny', 'droom', 'cardekho', 'carwale',
  'simplilearn', 'great learning', 'scaler', 'coding ninjas',
  'masai school', 'newton school', 'almabetter',
  'cuemath', 'toppr', 'doubtnut',
  'lendingkart', 'capital float', 'rupeek', 'indiagold',
  'moneycontrol', 'zerodha', 'coin', 'kuvera',
  'open financial', 'razorpayx', 'bankopen',
  'navi technologies', 'navi', 'bajaj finserv health',
  'acko', 'digit insurance', 'go digit',
  'park+', 'fixcraft',
  'stellapps', 'ninjacart', 'waycool', 'dehaat',
  'stashfin', 'kreditbee', 'early salary', 'kissht',
  'furlenco', 'rentomojo', 'quikr',
  'yulu', 'bounce', 'vogo',
  'classplus', 'teachmint', 'winuall',
  'whatfix', 'mindpeers', 'intellipaat',
  'gupshup', 'kaleyra', 'exotel', 'knowlarity',
  'servify', 'cashify', 'yaantra',
  'ofbusiness', 'indiamart', 'justdial',
  'ninjacart', 'jumbotail', 'elastic run',
  'shadowfax', 'ecom express', 'xpressbees',
  'shiprocket', 'pickrr', 'clickpost',

  // ─── Indian Conglomerates / Large Corp ─────────────────────
  'reliance', 'reliance jio', 'jio', 'jio platforms',
  'reliance industries', 'reliance retail', 'reliance digital',
  'tata', 'tata motors', 'tata steel', 'tata power', 'tata digital',
  'tata elxsi', 'tata communications', 'tata chemicals',
  'tata consumer', 'titan', 'tanishq', 'tata sky', 'tata play',
  'mahindra', 'mahindra & mahindra', 'tech mahindra',
  'mahindra finance', 'mahindra logistics',
  'bajaj', 'bajaj finserv', 'bajaj auto', 'bajaj finance',
  'bajaj electricals', 'bajaj allianz',
  'adani', 'adani group', 'adani enterprises', 'adani ports',
  'adani green', 'adani power', 'adani wilmar',
  'godrej', 'godrej properties', 'godrej consumer', 'godrej industries',
  'aditya birla', 'aditya birla group', 'grasim', 'hindalco',
  'aditya birla capital', 'aditya birla fashion',
  'vedanta', 'vedanta limited', 'sterlite',
  'jindal', 'jindal steel', 'jsw', 'jsw steel', 'jsw energy',
  'hero', 'hero motocorp', 'hero fincorp',
  'larsen', 'ultratech', 'ultratech cement',
  'dl', 'dlf', 'prestige', 'sobha', 'brigade',
  'raymond', 'arvind', 'page industries',
  'havells', 'crompton', 'orient electric', 'polycab',
  'asian paints', 'berger paints', 'pidilite',
  'dalmia', 'shree cement', 'ambuja', 'acc',
  'sun tv', 'zee entertainment', 'tv18',
  'bharat forge', 'motherson', 'samvardhana motherson',
  'pi industries', 'upl', 'coromandel', 'rallis',
  'max healthcare', 'fortis', 'apollo hospitals', 'narayana health',
  'manipal', 'aster dm', 'medanta',

  // ─── Indian Banks / Finance / Insurance ────────────────────
  'hdfc', 'hdfc bank', 'hdfc life', 'hdfc ergo', 'hdfc securities',
  'icici', 'icici bank', 'icici prudential', 'icici lombard', 'icici securities',
  'kotak', 'kotak mahindra', 'kotak bank', 'kotak securities',
  'axis bank', 'axis', 'axis securities', 'axis mutual fund',
  'sbi', 'state bank', 'state bank of india', 'sbi life', 'sbi cards',
  'yes bank', 'idfc first', 'idfc', 'idfc first bank',
  'indusind', 'indusind bank', 'federal bank', 'rbl bank',
  'bandhan bank', 'au small finance', 'ujjivan', 'equitas',
  'bajaj finance', 'muthoot', 'manappuram', 'shriram finance',
  'npci', 'nse', 'bse', 'cams', 'kfintech',
  'lic', 'sbi mutual fund', 'nippon india', 'hdfc mutual fund',
  'icici pru mutual fund', 'aditya birla sun life',
  'max life', 'tata aia', 'pnb metlife', 'star health',
  'sbi general', 'iffco tokio', 'oriental insurance',
  'angel broking', 'iifl', 'motilal oswal', 'sharekhan',
  'edelweiss', 'jm financial', 'kotak investment banking',
  'crisil', 'icra', 'care ratings', 'india ratings',

  // ─── Indian Telecom / Media ───────────────────────────────
  'bharti airtel', 'airtel', 'vodafone', 'vi', 'vodafone idea',
  'jio', 'bsnl', 'mtnl', 'tata teleservices',
  'dish tv', 'den networks', 'hathway',
  'times internet', 'times group', 'bennett coleman',
  'hindustan times', 'ht media', 'india today', 'ndtv',
  'network18', 'tv18 broadcast',

  // ─── Indian Public Sector / Research / Defense ─────────────
  'isro', 'drdo', 'barc', 'hal', 'bhel', 'ongc', 'ntpc', 'iocl',
  'sail', 'gail', 'power grid', 'coal india', 'bpcl', 'hpcl',
  'oil india', 'nalco', 'nmdc', 'mdl', 'bel',
  'beml', 'hmt', 'garden reach', 'grse',
  'iisc', 'cdac', 'uidai', 'nic', 'nasscom',
  'iit', 'iiit', 'nit', 'bits', 'ism',
  'csir', 'tifr', 'iari', 'icar', 'icmr',
  'npcil', 'ireda', 'pfc', 'rec', 'nhpc',
  'irctc', 'indian railways', 'rites', 'ircon',
  'cochin shipyard', 'mazagon dock',
  'ecil', 'eil', 'mecon', 'wapcos',

  // ─── Global Companies with Major India Engineering Centers ─
  'samsung india', 'samsung r&d', 'samsung research',
  'amazon india', 'amazon development centre',
  'google india', 'google bangalore',
  'microsoft india', 'microsoft idc', 'microsoft hyderabad',
  'goldman sachs india', 'goldman sachs bangalore',
  'morgan stanley india', 'morgan stanley mumbai',
  'jpmorgan india', 'jpmorgan mumbai', 'jpmorgan hyderabad',
  'deutsche bank india', 'db india',
  'barclays india', 'barclays chennai', 'barclays pune',
  'hsbc india', 'hsbc technology', 'hsbc glc',
  'bosch india', 'bosch bangalore', 'robert bosch',
  'siemens india', 'siemens technology',
  'cisco india', 'cisco systems india',
  'intel india', 'intel technology india',
  'qualcomm india', 'qualcomm hyderabad',
  'nvidia india', 'nvidia bangalore',
  'amd india', 'amd hyderabad',
  'texas instruments india', 'ti india',
  'walmart global tech', 'walmart labs', 'walmart india',
  'target india', 'target corporation',
  'societe generale', 'bnp paribas india',
  'philips', 'philips india', 'philips innovation',
  'harness', 'harness io',
  'capgemini india', 'accenture india',
  'ericsson', 'ericsson india', 'nokia', 'nokia india',
  'sap india', 'sap labs', 'sap labs india',
  'oracle india', 'oracle financial services', 'ofss',
  'ibm india', 'ibm research',
  'adobe india', 'adobe systems india',
  'vmware india', 'broadcom india',
  'salesforce india', 'salesforce hyderabad',
  'servicenow india', 'workday india',
  'uber india', 'uber bangalore',
  'linkedin india', 'linkedin bangalore',
  'visa india', 'mastercard india',
  'american express india', 'amex india',
  'wells fargo india', 'wells fargo hyderabad',
  'bank of america india',
  'standard chartered india', 'stanchart india',
  'nomura india', 'nomura mumbai',
  'credit suisse india', 'ubs india',
  'macquarie india',
  'fidelity india', 'fidelity investments india',
  'ge india', 'ge digital india', 'ge healthcare india',
  'honeywell india', 'honeywell technology solutions',
  'schneider electric india',
  'abb india',
  'dassault systemes india', '3dexperience',
  'thales india',
  'unilever india', 'hul india',
  'nestle india',
  'pepsico india',
  'coca-cola india',
  'p&g india', 'procter & gamble india',
  'colgate palmolive india',
  'johnson controls india',
  'carrier india', 'otis india',
  'caterpillar india',
  'cummins india',
  'continental india',
  'zf india', 'zf friedrichshafen',
  'denso india',
  'toyota india', 'toyota kirloskar',
  'hyundai india', 'hyundai motor india',
  'kia india',
  'ford india',
  'volkswagen india', 'skoda india',

  // ─── More Indian Product / SaaS Companies ─────────────────
  'freshdesk', 'freshsales', 'freshcaller',
  'zoho crm', 'zoho books', 'zoho one',
  'wingify', 'vwo',
  'icertis', 'o9 solutions',
  'innovaccer', 'healthify', 'healthifyme',
  'grey orange', 'greyorange',
  'eruditus', 'emeritus',
  'lead school', 'lead', 'extramarks',
  'embibe', 'testbook', 'gradeup',
  'ixigo', 'goibibo', 'yatra', 'easemytrip',
  'firstcry', 'hopscotch', 'mamaearth',
  'bewakoof', 'the souled store',
  'snapdeal', 'shopclues',
  'pepperfry', 'urban ladder', 'wakefit',
  'bluestone', 'caratlane',
  'navi', 'turtlemint', 'plum insurance',
  'mswipe', 'ezetap', 'pine labs',
  'billdesk', 'payu', 'payumoney',
  'citrus pay', 'freecharge',
  'airtel payments bank', 'paytm payments bank',
  'fino payments bank',
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
 * Performs fuzzy matching with smart name normalization.
 */
export function getCompanyTier(companyName: string): number {
  if (!companyName) return 0;
  const normalized = companyName.toLowerCase().trim()
    .replace(/\s*(private|pvt|ltd|limited|inc|corp|corporation|llc|llp|technologies|solutions|services|consulting|software|systems|group|india|global|labs|digital|enterprises|infosystems|infotech)\s*/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Exact match
  if (companyTierMap.has(normalized)) {
    return companyTierMap.get(normalized)!;
  }

  // Also check the raw input
  const raw = companyName.toLowerCase().trim();
  if (companyTierMap.has(raw)) {
    return companyTierMap.get(raw)!;
  }

  // Fuzzy: check if any known company is a substring
  let bestTier = 0;
  for (const [knownName, tier] of companyTierMap.entries()) {
    if (knownName.length < 3) continue;

    if (normalized.includes(knownName) || raw.includes(knownName)) {
      if (tier > bestTier) bestTier = tier;
    }
    if (knownName.length >= 4 && (normalized.startsWith(knownName) || raw.startsWith(knownName))) {
      if (tier > bestTier) bestTier = tier;
    }
  }

  return bestTier;
}

/**
 * Check if a company is in our known companies database at all.
 */
export function isKnownCompany(companyName: string): boolean {
  return getCompanyTier(companyName) > 0;
}

/**
 * Get a human-readable tier label for display.
 */
export function getCompanyTierLabel(tier: number): { label: string; color: string } {
  switch (tier) {
    case 3: return { label: '★★★', color: 'text-amber-400' };
    case 2: return { label: '★★', color: 'text-blue-400' };
    case 1: return { label: '★', color: 'text-slate-400' };
    default: return { label: '', color: '' };
  }
}
