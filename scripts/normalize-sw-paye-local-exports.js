const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const WRITE = process.argv.includes('--write');

// These pages already contain a complete, local generatePdf() implementation.
// This owner only removes the obsolete lead-capture layer around that existing
// export. Country engines and PDF templates remain untouched.
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

const MOBILE_REPAIRS = new Set([
  'burundi',
  'central-african-republic',
  'chad',
  'equatorial-guinea',
  'gabon',
  'rwanda',
  'tanzania',
  'uganda',
]);

const MOBILE_CONTRACT = `<style data-sw-paye-mobile-contract>
@media(max-width:480px){
  .tool-main,.tool-main *,.grid,.grid *,.ng-guide-sec,.ng-guide-sec *{box-sizing:border-box!important}
  .tool-main,.tool-main-inner,.tool-main-inner>*,.grid,.grid>*,.ng-guide-sec,.ng-guide-grid,.ng-guide-grid>*,.ng-guide-col,.sidebar,.card,.ai-card,.tool-info-card,.last-updated{width:100%!important;min-width:0!important;max-width:100%!important}
  .tool-main-inner,.grid,.ng-guide-grid{grid-template-columns:minmax(0,1fr)!important}
  .tool-main-inner{padding-left:12px!important;padding-right:12px!important}
  .ng-guide-grid{display:grid!important}
  .ng-guide-card{min-width:0!important;max-width:100%!important;overflow-x:auto}
  canvas,table,img,svg{max-width:100%}
}
</style>`;

function fail(message, file) {
  throw new Error(`${message}: ${path.relative(ROOT, file).replace(/\\/g, '/')}`);
}

function removeBalancedDivById(html, id, file) {
  const startPattern = new RegExp(`<div\\b[^>]*\\bid=["']${id}["'][^>]*>`, 'i');
  const startMatch = startPattern.exec(html);
  if (!startMatch) fail(`Missing #${id} lead modal`, file);

  const tagPattern = /<\/?div\b[^>]*>/gi;
  tagPattern.lastIndex = startMatch.index;
  let depth = 0;
  let end = -1;
  let match;

  while ((match = tagPattern.exec(html))) {
    depth += /^<div\b/i.test(match[0]) ? 1 : -1;
    if (depth === 0) {
      end = tagPattern.lastIndex;
      break;
    }
  }

  if (end < 0) fail(`Unbalanced #${id} lead modal`, file);
  return `${html.slice(0, startMatch.index)}${html.slice(end)}`.replace(/\n{3,}/g, '\n\n');
}

function transform(file, country) {
  const original = fs.readFileSync(file, 'utf8');
  if (/<meta name="sw-paye-source-owner" content="scripts\/build-sw-paye-exact-three\.js">/.test(original)) {
    return { original, html: original };
  }
  if (!/function\s+generatePdf\s*\(/.test(original)) {
    fail('Missing existing local generatePdf() implementation', file);
  }
  const hasLeadAction = /onclick=["']openPdfModal\(\)["']/.test(original);
  const hasDirectAction = /<button\b[^>]*onclick=["']generatePdf\(\)["'][^>]*data-no-gate=["']true["'][^>]*>/i.test(original);
  if (!hasLeadAction && !hasDirectAction) {
    fail('Missing lead-gated PDF action', file);
  }
  const hasLeadForm = /name=["']pdf-leads["']|id=["']pdfEmail["']/.test(original);
  if (hasLeadAction && !hasLeadForm) {
    fail('Missing expected PDF lead form', file);
  }

  let html = original;
  html = html.replace(
    /\s*<script\b[^>]*src=["'][^"']*\/assets\/js\/lib\/auto-email-gate\.js[^"']*["'][^>]*><\/script>/gi,
    '',
  );
  html = html.replace(
    /onclick=["']openPdfModal\(\)["']/g,
    'onclick="generatePdf()" data-no-gate="true"',
  );
  if (/\bid=["']pdfModal["']/.test(html)) {
    html = removeBalancedDivById(html, 'pdfModal', file);
  }

  const leadFunctions = /function\s+openPdfModal\s*\([\s\S]*?(?=function\s+generatePdf\s*\()/;
  if (hasLeadAction && !leadFunctions.test(html)) {
    fail('Unable to isolate lead-capture functions before generatePdf()', file);
  }
  html = html.replace(leadFunctions, '');
  html = html.replace(
    /document\.getElementById\(["']hiddenGross["']\)\.value\s*=\s*[^,;}]+[,;]?/g,
    '',
  );
  if (/function\s+renderChart\s*\(/.test(html) && !/function\s+renderChart\s*\([^)]*\)\s*\{\s*if\s*\(typeof Chart===['"]undefined['"]\)return;/.test(html)) {
    html = html.replace(
      /function\s+renderChart\s*\(([^)]*)\)\s*\{/,
      "function renderChart($1){if(typeof Chart==='undefined')return;",
    );
  }
  if (MOBILE_REPAIRS.has(country)) {
    if (/<style data-sw-paye-mobile-contract>[\s\S]*?<\/style>/.test(html)) {
      html = html.replace(/<style data-sw-paye-mobile-contract>[\s\S]*?<\/style>/, MOBILE_CONTRACT);
    } else {
      if (!/<\/head>/i.test(html)) fail('Missing </head> for mobile contract', file);
      html = html.replace(/<\/head>/i, `${MOBILE_CONTRACT}\n</head>`);
    }
  }
  html = html.replace(/[ \t]+$/gm, '').replace(/\n{3,}/g, '\n\n');

  const forbidden = [
    /auto-email-gate\.js/i,
    /name=["']pdf-leads["']/i,
    /id=["']pdfEmail["']/i,
    /id=["']hiddenGross["']/i,
    /openPdfModal/i,
    /submitPdf/i,
    /form-name['"]?\s*:\s*['"]pdf-leads/i,
  ];
  for (const pattern of forbidden) {
    if (pattern.test(html)) fail(`Residual lead-capture token ${pattern}`, file);
  }
  if (!/<button\b[^>]*onclick=["']generatePdf\(\)["'][^>]*data-no-gate=["']true["'][^>]*>/i.test(html)) {
    fail('PDF action is not a direct local export', file);
  }
  if (MOBILE_REPAIRS.has(country) && !/data-sw-paye-mobile-contract/.test(html)) {
    fail('Missing bounded 320px layout contract', file);
  }
  if (/function\s+renderChart\s*\(/.test(html)
    && !/function\s+renderChart\s*\([^)]*\)\s*\{\s*if\s*\(typeof Chart===['"]undefined['"]\)return;/.test(html)) {
    fail('Missing fail-closed Chart.js boundary', file);
  }

  return { original, html };
}

let changed = 0;
for (const country of TARGETS) {
  const file = path.join(ROOT, 'sw', country, 'kikokotoo-kodi-mshahara', 'index.html');
  if (!fs.existsSync(file)) fail('Missing target page', file);
  const { original, html } = transform(file, country);
  if (html !== original) {
    changed += 1;
    if (WRITE) fs.writeFileSync(file, html, 'utf8');
  }
}

if (!WRITE && changed) {
  throw new Error(
    `${changed}/${TARGETS.length} Swahili PAYE local-export pages are stale. `
      + 'Run node scripts/normalize-sw-paye-local-exports.js --write.',
  );
}

console.log(
  `${WRITE ? 'Normalized' : 'Verified'} ${TARGETS.length} Swahili PAYE local PDF exports`
    + `${WRITE ? ` (${changed} changed)` : ''}.`,
);
