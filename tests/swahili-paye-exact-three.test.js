const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const { TARGETS } = require('../scripts/build-sw-paye-exact-three.js');
const { analyticsVersion, loaderMatches } = require('../scripts/inject-analytics-loader.js');
const UgandaPaye = require('../assets/js/engines/ug-paye.js');

const EXACT_IDS = ['bi-paye', 'rw-paye', 'ug-paye'];
const TAXABLE_FIXTURES = {
  'bi-paye': 482000,
  'rw-paye': 282000,
  'ug-paye': 1900000,
};
const COPY_ORACLES = {
  'bi-paye': [/0%/, /20%/, /30%/, /450,000/, /80,000/, /84,600/, /529,400/],
  'rw-paye': [/60,000/, /100,000/, /200,000/, /6%/, /0\.3%/, /CBHI/, /0\.5%/, /mshahara halisi/, /hatari ya kazi/, /2%/, /48,600/, /1,157/, /231,343/, /324,900/],
  'ug-paye': [/2 Agosti 2026/, /235,000/, /335,000/, /410,000/, /10,000,000/, /nyongeza ya 10%/, /Asiye Mkazi/, /imezimwa kwa chaguo-msingi/, /mshahara ghafi/, /420,000/, /30,000/, /348,000/, /472,000/, /1,328,000/],
};
const STALE_COPY = {
  'bi-paye': [/4% ya mshahara wote/i, /BIF 20,000/, /BIF 530,000/],
  'rw-paye': [/RWF 30,001/, /RSSB[^\n.]*5% mfanyakazi/i, /RWF 69,500/, /RWF 315,900/],
  'ug-paye': [/2025\/26/, /2026\/27/, /UGX 485,000/, /NSSF.*inapunguza PAYE/i, /LST (?:hukatwa|inakatwa) baada ya PAYE/i, /30% kwa ghafi/i, /UGX 488,250/, /UGX 458,250/],
};
const OFFICIAL_SOURCES = {
  'bi-paye': ['https://obr.gov.bi'],
  'rw-paye': [
    'https://rra.gov.rw',
    'https://www.rssb.rw/scheme/cbhi-scheme',
    'https://www.rssb.rw/fileadmin/user_upload/Announcement_to_all_employers_.pdf',
    'https://www.rssb.rw/fileadmin/user_upload/Prime_Minister_s_order_CBHI-subsidies_13th_February_2020.pdf',
    'https://www.rssb.rw/scheme/occupational-hazards',
  ],
  'ug-paye': [
    'https://ura.go.ug/en/domestic-taxes/paye-rates/',
    'https://www.parliament.go.ug/news/4488/president-museveni-returns-two-tax-bills-parliament',
    'https://ulii.org/en/akn/ug/act/1997/11/eng@2024-12-23',
    'https://ura.go.ug/en/taxes-on-employment-income/',
    'https://kcca.go.ug/uDocs/Local_Service_Tax_FAQs.pdf',
    'https://www.nssfug.org/about-us/membership/',
  ],
};

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

function extractFunction(source, functionName) {
  const start = source.search(new RegExp(`function\\s+${functionName}\\s*\\(`));
  assert.notStrictEqual(start, -1, `Missing ${functionName}`);
  const braceStart = source.indexOf('{', start);
  let depth = 0;
  let quote = '';
  let escaped = false;
  for (let index = braceStart; index < source.length; index += 1) {
    const char = source[index];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (quote) {
      if (char === '\\') escaped = true;
      else if (char === quote) quote = '';
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }
    if (char === '{') depth += 1;
    if (char === '}' && --depth === 0) return source.slice(start, index + 1);
  }
  throw new Error(`Unbalanced ${functionName}`);
}

function runTaxOracle(html, config) {
  if (config.id === 'ug-paye') return UgandaPaye.taxMonthly(TAXABLE_FIXTURES[config.id], 'RESIDENT').tax;
  const source = extractFunction(html, 'calcMonthlyPAYE');
  const calculator = new Function(`${source}; return calcMonthlyPAYE;`)();
  const result = calculator(TAXABLE_FIXTURES[config.id], false);
  return Number.isFinite(result?.tax) ? result.tax : result;
}

function runRwandaNetCbhiOracle(html, gross) {
  const taxSource = extractFunction(html, 'calcMonthlyPAYE');
  const cbhiSource = extractFunction(html, 'solveEmployeeCbhi');
  const calculate = new Function(`${taxSource};${cbhiSource}; return function (monthlyGross) {
    const pension = monthlyGross * 0.06;
    const maternity = monthlyGross * 0.003;
    const paye = calcMonthlyPAYE(Math.max(0, monthlyGross - pension)).tax;
    const cbhi = solveEmployeeCbhi(monthlyGross - pension - maternity - paye);
    const net = monthlyGross - pension - maternity - paye - cbhi;
    return { gross: monthlyGross, pension, maternity, paye, cbhi, net, fixedPoint: Math.round(net * 0.005) };
  };`)();
  return calculate(gross);
}

assert.deepStrictEqual(
  Object.values(TARGETS).map((target) => target.id).sort(),
  EXACT_IDS,
  'The source owner must stay constrained to the exact three requested routes',
);

for (const config of Object.values(TARGETS)) {
  const swahili = read(config.file);
  const english = read(config.englishFile);

  const swCanonical = `https://afrotools.com${config.route}`;
  const englishCanonical = (english.match(/<link rel="canonical" href="([^"]+)"/) || [])[1];
  assert.ok(englishCanonical, `${config.id} English owner canonical is required`);
  assert.ok(swahili.includes(`<link rel="canonical" href="${swCanonical}"`), `${config.id} self canonical`);
  assert.ok(swahili.includes(`hreflang="sw" href="${swCanonical}"`), `${config.id} Swahili self hreflang`);
  assert.ok(swahili.includes(`hreflang="en" href="${englishCanonical}"`), `${config.id} English hreflang`);
  assert.ok(swahili.includes(`hreflang="x-default" href="${englishCanonical}"`), `${config.id} x-default`);
  assert.ok(english.includes(`hreflang="sw" href="${swCanonical}"`), `${config.id} reciprocal English hreflang`);
  assert.match(swahili, new RegExp(`/assets/img/tools/${config.id}\\.webp`), `${config.id} exact artwork`);
  assert.ok(fs.existsSync(path.join(ROOT, 'assets', 'img', 'tools', `${config.id}.webp`)));

  for (const oracle of COPY_ORACLES[config.id]) assert.match(swahili, oracle, `${config.id} current copy`);
  for (const stale of STALE_COPY[config.id]) assert.doesNotMatch(swahili, stale, `${config.id} stale copy`);
  assert.match(swahili, /function invalidateResult\(message\)[\s\S]*?RESULT = null;/);
  assert.match(swahili, /if \(!RESULT\) \{\s*invalidateResult\(/);
  assert.match(swahili, /function generatePdf\(\)\s*\{\s*if \(!RESULT\)/);
  assert.match(swahili, /async function getAI\(\)\s*\{\s*if \(!ensureSwAiConsent\(\)\) return;/);
  assert.doesNotMatch(swahili, /hiddenGross|pdfEmail|form name="pdf-leads"/i);
  assert.match(swahili, /data-tog="[^"]+" role="switch" tabindex="0" aria-checked="(?:true|false)"/);
  assert.match(swahili, /id="aiStatus" role="status" aria-live="polite" aria-atomic="true"/);
  assert.match(swahili, /function syncChoiceState\(control\)/);
  assert.match(swahili, /class="skip-main skip-link sw-paye-skip-link" href="#main-content"/);
  assert.match(swahili, /class="card-head" role="button" tabindex="0" aria-expanded="false"/);
  assert.doesNotMatch(swahili, /share-image-inject\.js|Share as Image|Generating\.\.\./i);
  const analyticsLoaders = swahili.match(
    /<script defer src="\/assets\/js\/lazy-analytics\.js\?v=[a-f0-9]+"><\/script>/g,
  ) || [];
  assert.strictEqual(
    analyticsLoaders.length,
    1,
    `${config.id} must retain exactly one standard consent-aware analytics loader`,
  );
  assert.ok(
    loaderMatches(analyticsLoaders[0], analyticsVersion()),
    `${config.id} analytics loader must match the current consent-aware source hash`,
  );
  assert.match(swahili, /<meta name="afrotools-network-policy" content="local-only" data-source-owner="scripts\/build-sw-paye-exact-three\.js">[\s\S]*?<script src="\/assets\/js\/components\/navbar\.min\.js/, `${config.id} declares the navbar local-only network policy`);
  assert.match(swahili, /local-first-chart-fallback[\s\S]*?typeof window\.Chart !== 'function'/, `${config.id} degrades locally when Chart.js is unavailable`);
  for (const url of OFFICIAL_SOURCES[config.id]) {
    assert.ok(swahili.includes(url), `${config.id} visible and exported official source ${url}`);
  }

  const schemas = [...swahili.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
    .map((match) => JSON.parse(match[1]));
  const faq = schemas.find((schema) => schema['@type'] === 'FAQPage');
  const howTo = schemas.find((schema) => schema['@type'] === 'HowTo');
  assert.ok(faq?.mainEntity?.length >= 4, `${config.id} formula FAQ schema`);
  assert.ok(howTo?.step?.length >= 3, `${config.id} formula HowTo schema`);

  if (config.id !== 'ug-paye') {
    assert.strictEqual(runTaxOracle(english, config), config.fixture.tax, `${config.id} English tax oracle`);
  }
  assert.strictEqual(runTaxOracle(swahili, config), config.fixture.tax, `${config.id} Swahili tax oracle`);

  if (config.id === 'ug-paye') {
    assert.deepStrictEqual(
      [235000, 335000, 410000, 10000000, 10000001].map((income) => UgandaPaye.taxMonthly(income, 'RESIDENT').tax),
      [0, 10000, 25000, 2902000, 2902000.4],
      'ug-paye current resident boundaries',
    );
    assert.deepStrictEqual(
      [335000, 410000, 10000000, 10000001].map((income) => UgandaPaye.taxMonthly(income, 'NON_RESIDENT').tax),
      [33500, 48500, 2925500, 2925500.4],
      'ug-paye current progressive nonresident boundaries',
    );
    assert.strictEqual(UgandaPaye.annualLst(2000000), 100000, 'ug-paye official annual LST schedule');
    const boundary = UgandaPaye.calculate({ grossMonthly: 420000, regime: 'RESIDENT', nssfEnabled: true, lstEnabled: true });
    assert.deepStrictEqual(
      [boundary.lstAssessmentGross, boundary.lstAnnual, boundary.monthlyPaye, boundary.employeeNssfMonthly, boundary.netMonthly],
      [420000, 30000, 21000, 21000, 348000],
      'ug-paye KCCA gross-salary LST worked example',
    );
  }
  if (config.id === 'rw-paye') {
    const boundaries = [60000, 100000, 200000, 300000];
    const expected = [
      { gross: 60000, pension: 3600, maternity: 180, paye: 0, cbhi: 280, net: 55940, fixedPoint: 280 },
      { gross: 100000, pension: 6000, maternity: 300, paye: 3400, cbhi: 449, net: 89851, fixedPoint: 449 },
      { gross: 200000, pension: 12000, maternity: 600, paye: 21600, cbhi: 825, net: 164975, fixedPoint: 825 },
      { gross: 300000, pension: 18000, maternity: 900, paye: 48600, cbhi: 1157, net: 231343, fixedPoint: 1157 },
    ];
    assert.deepStrictEqual(boundaries.map((gross) => runRwandaNetCbhiOracle(english, gross)), expected, 'rw-paye English net-salary CBHI boundaries');
    assert.deepStrictEqual(boundaries.map((gross) => runRwandaNetCbhiOracle(swahili, gross)), expected, 'rw-paye Swahili net-salary CBHI boundaries');
  }
}

for (const file of ['uganda/ug-paye.html']) {
  const owner = read(file);
  assert.match(owner, /<meta name="afrotools-network-policy" content="local-only" data-source-owner="scripts\/build-sw-paye-exact-three\.js">[\s\S]*?<script src="\/assets\/js\/components\/navbar\.min\.js/, `${file} declares the navbar local-only network policy`);
  assert.match(owner, /local-first-chart-fallback[\s\S]*?typeof window\.Chart !== 'function'/, `${file} degrades without Chart.js`);
}

const rwandaEnglish = read('rwanda/rw-paye.html');
for (const token of [
  'function solveEmployeeCbhi(preCbhiNet)',
  'const employeeCbhi = solveEmployeeCbhi(gross - rssb - monthlyPAYE - employeeMaternity)',
  'const employerOccupationalHazard = gross * 0.02',
  'Mandatory employee CBHI (0.5%)',
  'Occupational Hazard Contribution (2%, employer only)',
  'https://www.rssb.rw/scheme/cbhi-scheme',
  'https://www.rssb.rw/fileadmin/user_upload/Prime_Minister_s_order_CBHI-subsidies_13th_February_2020.pdf',
  'https://www.rssb.rw/scheme/occupational-hazards',
]) assert.ok(rwandaEnglish.includes(token), `Rwanda English current contribution parity: ${token}`);
assert.doesNotMatch(rwandaEnglish, /employeeCbhi\s*=\s*gross\s*\*\s*0\.005/, 'Rwanda English must not use gross-salary CBHI');
assert.match(rwandaEnglish, /"@type":"WebApplication"[^\n]*0\.5% of employee net salary[^\n]*2% occupational-hazard contribution/, 'Rwanda English WebApplication schema carries current contributions');
assert.match(rwandaEnglish, /function generatePdf\(\)[\s\S]*?Mandatory employee CBHI \(0\.5%\)[\s\S]*?Occupational Hazard Contribution \(2%, employer only\)/, 'Rwanda English reopenable report carries current contributions');

const registrySource = read('assets/js/components/tool-registry.js');
for (const [id, sourceId] of [['bi-paye-sw', 'bi-paye'], ['rw-paye-sw', 'rw-paye'], ['ug-paye-sw', 'ug-paye']]) {
  const rowStart = registrySource.indexOf(`id: '${id}'`);
  assert.notStrictEqual(rowStart, -1, `${id} discovery row`);
  assert.match(registrySource.slice(rowStart, rowStart + 800), new RegExp(`sourceId: '${sourceId}'`), `${id} sourceId`);
}

const hub = read('sw/mshahara-na-kodi/index.html');
assert.ok(
  hub.includes('/sw/burundi/kikokotoo-kodi-mshahara/'),
  'The Swahili salary hub must expose Burundi PAYE discovery',
);
console.log('Verified exact-three Swahili PAYE source ownership, independent formula oracles, copy, schema, accessibility, privacy, exports, SEO and Burundi discovery.');
