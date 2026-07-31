const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const TARGETS = [
  'angola',
  'botswana',
  'burkina-faso',
  'burundi',
  'cameroon',
  'central-african-republic',
  'chad',
  'cote-divoire',
  'egypt',
  'equatorial-guinea',
  'eswatini',
  'ethiopia',
  'gabon',
  'guinea',
  'lesotho',
  'malawi',
  'mali',
  'mauritius',
  'niger',
  'rwanda',
  'senegal',
  'seychelles',
  'tanzania',
  'uganda',
  'zambia',
  'zimbabwe',
];

const FORMULA_HASHES = {
  angola: 'a576e1d46911d1391b128ce30c587f90277318ab1f6a38a4bec53b599bbb0e32',
  botswana: '3a2e9a0554dc6e09f54263b4e824c2ccdcbbf6fa906fafee0b6f25effef884e9',
  'burkina-faso': '0cee77c70e185efe193003a055c141035279500ff5dfcb9314c5edb4eb87b32e',
  burundi: '76fdcbe0a30b110649fe2ab77e667a9d3d7d6515d0830ac31db5f21938a974ad',
  cameroon: '6bb2b6f6dab745045d43a62d32c431aa5c2fd43b323235fa46fe7bc04efbafa4',
  'central-african-republic': '9fede56cbf81bb9a257a391d74c05c929539f592c7c9ef7343845ee30a3afd06',
  chad: 'fe0370dbf220039a78a67c97bc31652c152f2b0323215ab80e66cd443daac5d5',
  'cote-divoire': 'd517c94bdaccbd9fc725f9f9fb4e2cd2fdbf0d8b64d0d0df1f99f02a1aad14e7',
  egypt: '2810d5ef232f08016f0fbbb798427257d59e9ad5bd7f42c5b43bdb9ec69261d0',
  'equatorial-guinea': '8c5e2074d930253135434d75293fa212287ff43afbc3fe71b87bab518384b872',
  eswatini: '8534e1bbaa041b409eb1874812ea9639fbc1dd6947eb86051d33b07a87504c40',
  ethiopia: '0299b1eff35efa963c31348e4d60b0ff5f43872b3020de136af5f1a050faa07a',
  gabon: 'e68a416afaafc902990c0de3c1f4ff71f07de18687c36595c6ba214517d9dd58',
  guinea: 'a329a3e2e6b590bd0a7b748e3f1e0efae090dc2655e2ac44191645a310760458',
  lesotho: '0502bf1c22ab2fd8df034ded8a75057948f84f885fb8882f7408bbce38bd8ea2',
  malawi: '8ed394a430e3f2b82b33dbdb2b0d86086f25cbcb96f4dce177ba2de36c925069',
  mali: 'ec1abd3dc0098de5ec181e9ee813e299496ef5f8af8519b501e54224bb713bc4',
  mauritius: '3ac5f215b0e781e29fdcd92acf50ba89e0b4bb08101a5051c73fe78cfa90de8d',
  niger: '279b54090ff75df7e10be1b393466cb719973372c87644a51d3ac13bd8f7ab20',
  rwanda: 'a316278afbff8f4a4c3ebbc387bf1a5127b5ad393f87201cb8d3dafb991b5a7b',
  senegal: '005f958e602f37589587c4338002e50e0c757db23e4c1e8e9b32789a87356ed3',
  seychelles: '351fad7a69040fbf2ebfdc368977f00a0cb266c6dcad5e175faad3dd137c3fc7',
  tanzania: 'a4ea6c7c4372506b8941ac115e29012817c323d09da176cc3f2d0c0610cd9af1',
  uganda: '4ade59dec334c920c3b0e86055df18fa4df3cd0a60acfc8a2f298a9ac30c1267',
  zambia: '4795173d673ef543989b41a8e688393afaaf6040a64d300af837c0c47bb24316',
  zimbabwe: '4ae1d460cb3d97a2544fc7f0f6ecc1da300bd0e5dac6b48576b19cc980beb230',
};

function extractFunction(source, start) {
  const braceStart = source.indexOf('{', start);
  let depth = 0;
  let quote = '';
  let escaped = false;
  let templateExpressionDepth = 0;
  for (let index = braceStart; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (quote) {
      if (char === '\\') escaped = true;
      else if (char === quote && !(quote === '`' && templateExpressionDepth > 0)) quote = '';
      else if (quote === '`' && char === '$' && next === '{') {
        templateExpressionDepth += 1;
        index += 1;
      } else if (quote === '`' && char === '}' && templateExpressionDepth > 0) {
        templateExpressionDepth -= 1;
      }
      continue;
    }
    if (char === '"' || char === "'" || char === '`') {
      quote = char;
      continue;
    }
    if (char === '{') depth += 1;
    if (char === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(start, index + 1);
    }
  }
  throw new Error('Unbalanced function source');
}

function formulaHash(html) {
  const functions = [];
  const matcher = /function\s+(calc[\w]*)\s*\(/g;
  for (let match = matcher.exec(html); match; match = matcher.exec(html)) {
    functions.push(extractFunction(html, match.index));
  }
  assert.ok(functions.length >= 2, 'Expected the calculation engine and calculate controller');
  return crypto.createHash('sha256').update(functions.join('\n')).digest('hex');
}

for (const country of TARGETS) {
  const rel = `sw/${country}/kikokotoo-kodi-mshahara/index.html`;
  const html = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  const canonical = `https://afrotools.com/sw/${country}/kikokotoo-kodi-mshahara/`;
  const reportStart = html.indexOf('function generatePdf');
  const reportEnd = html.indexOf('function ensureSwAiConsent', reportStart);
  const report = html.slice(reportStart, reportEnd);
  const aiRuntime = html.slice(reportEnd, html.indexOf('</script>', reportEnd));

  assert.match(html, /<html\b[^>]*\blang="sw"/i, `${rel} must declare Swahili`);
  assert.ok(html.includes(`<link rel="canonical" href="${canonical}"`), `${rel} canonical must be self`);
  assert.ok(
    html.includes(`<link rel="alternate" hreflang="sw" href="${canonical}"`),
    `${rel} must include a self Swahili hreflang`,
  );
  assert.match(html, /hreflang="en" href="https:\/\/afrotools\.com\/[^"]+"/, `${rel} must retain English parity`);
  assert.match(html, /hreflang="x-default" href="https:\/\/afrotools\.com\/[^"]+"/, `${rel} needs x-default`);

  const image = (html.match(/<meta property="og:image" content="([^"]+)"/i) || [])[1];
  assert.ok(image, `${rel} needs an OG artwork URL`);
  const artworkPath = path.join(ROOT, ...new URL(image).pathname.split('/').filter(Boolean));
  assert.ok(fs.existsSync(artworkPath), `${rel} artwork must resolve locally: ${artworkPath}`);

  assert.match(report, /<html lang="sw"/, `${rel} report artifact must declare Swahili`);
  assert.match(report, /new Blob\(\[html\]/, `${rel} report must be a reopenable local artifact`);
  assert.match(report, /Sehemu(?: ya)? [123]/, `${rel} report needs structured Swahili sections`);
  assert.match(
    report,
    /(?:Msingi wa [Kk]isheria|Sheria|Mamlaka|Vyanzo|Thibitisha na)/,
    `${rel} report needs source context`,
  );
  assert.match(
    report,
    /(?:Kwa taarifa|Makadirio|Kwa madhumuni|Taarifa za habari|Si ushauri)/,
    `${rel} report needs an estimate boundary`,
  );
  assert.doesNotMatch(
    report,
    /Africa's Everything Platform|Planning estimate|Legal Basis|Generated on|Monthly Income|Annual Income|Analysis unavailable|Generating analysis/i,
    `${rel} report must not retain high-signal English runtime copy`,
  );

  assert.match(html, /function ensureSwAiConsent\(\)/, `${rel} AI must have an explicit consent boundary`);
  assert.match(
    html,
    /mshahara ghafi, mshahara halisi, kodi, michango ya kijamii na swali lako vitatumwa/,
    `${rel} consent must name the financial fields sent`,
  );
  assert.match(
    html,
    /async function getAI\(\)\s*\{\s*if \(!ensureSwAiConsent\(\)\) return;/,
    `${rel} initial AI action must fail closed without consent`,
  );
  assert.match(
    html,
    /async function sendChat\(\)\s*\{\s*if \(!ensureSwAiConsent\(\)\) return;/,
    `${rel} follow-up AI action must fail closed without consent`,
  );
  assert.match(html, /Jibu kwa Kiswahili/, `${rel} AI route must require a Swahili response`);
  assert.doesNotMatch(
    aiRuntime,
    /You are|Answer concisely|Give [123]\)|tax position|tax optimization|compliance point|Generating analysis|Analysis unavailable|Ask follow-up|Network error|Unable to|Try Again/i,
    `${rel} AI prompts, progress and error copy must remain native Swahili`,
  );
  assert.strictEqual(formulaHash(html), FORMULA_HASHES[country], `${rel} formula functions changed`);
}

assert.strictEqual(TARGETS.length, 26, 'The exact report-language lane must remain explicit');
console.log(`Verified native report, artwork, AI-consent, SEO and frozen-formula contracts for ${TARGETS.length} Swahili PAYE routes.`);
