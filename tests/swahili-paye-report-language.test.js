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
  angola: '89674035e6f40163c7841257dc787e5198ea642105c4c965ca49473f3f63e376',
  botswana: '9e0187a4826aa2562a20df86cc55bc38f205c876c03c75d83a6b01b87d680777',
  'burkina-faso': '1563580a29412af966c14ea0f8cabb3c768ff257fca7265e4b6f9a3255fe2332',
  burundi: '92d7ee88e21b5fcda9a6ab00f9e18abde5f1c16a17e99f9e33c0f2a8cfe9193e',
  cameroon: '45b86a1f302adab8601720a464e044bdffe32a3efd7fffa0a2d2fb72b5ceeb0f',
  'central-african-republic': '74325bb2c35c6451166715d0d1602243450b02b804508764f2d02366fe2ff4ba',
  chad: '41f1843dba3915348e377baf41edf3398b8bb988f08cf4fa0b5190b6fba986c8',
  'cote-divoire': '10537e71950d6beb051128d25be284a2501e67169cd213d99392f92c06ec237e',
  egypt: '857e0db7711fb32fb0207514802a8dfa4fafbcc25c171901c5ddb213843f912e',
  'equatorial-guinea': 'ce44af4ec2898ee2cd181bf1f6814c44592b680b7811a317aaaadca3eae26cba',
  eswatini: 'a483b30f211a12a52b7d72075544aa141628edc86a7bda1860eda943ada733b6',
  ethiopia: '8d0bf596abb24b4cd3d1efa9ae1db481c4b924e311a81f5a0110e3075df4f6cb',
  gabon: 'a99cc4e740ac2e3fd01f59865cba2d6e3b88ffd326705909fab0a82e1c0d416c',
  guinea: '741d81af67183defcdb0f10413e9742bdce691c03cac1759f8f0d9680bb179c0',
  lesotho: '856c4096ab92d3b5f65b674d1f4d5b336b9331c7d14939656a59d1e10353b305',
  malawi: '8e9e9e2cd3d25526c862a1c8ebe753e703b0787840ff90dd642d23ef4ac0951d',
  mali: 'e77040a99d277145a402d198ee02854a977c5f21f66052dbf06e480cca5559fb',
  mauritius: '1db9134b7c9ae58b9d1584dc64f6af2edf4d4e642f0a9abcd62ab9d88a8e313d',
  niger: '35d5e09c9614eed6b4151af6e620d3775ecabf864d9234a5092a8c2961263afe',
  rwanda: 'c9044623dee8cfa76a7f56022abe7605dfeb293cb3a53e2c475f5743bd7f3844',
  senegal: '0bbc0a60a7c230fce6fb90a98f0df081e43ab5207efb41cf47c1b9444d13c696',
  seychelles: '714a6d07644bfb0e6c97cf391c7ba6e60e6ae91c3237899d92405ee69d5c7b73',
  tanzania: '3f7081ffdedcf2ad6371b04775895f6e6c218ae1988d7206a2a070f9ffc955dd',
  uganda: '825174a6062fe275adaad7e8d0df6eedbe8f902d2b5d4c5ebb5310133fc709f8',
  zambia: '4795173d673ef543989b41a8e688393afaaf6040a64d300af837c0c47bb24316',
  zimbabwe: '8aae3c6a5166494c22a6129c01bbd0e10e4b3af23955cea5f57712b472e14431',
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
