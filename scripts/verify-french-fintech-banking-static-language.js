'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const MANIFEST_PATH = path.join(ROOT, 'data', 'localization', 'fr-fintech-banking-parity-manifest.json');
const SOURCE_DIR = path.join(ROOT, 'data', 'localization', 'fr-fintech-banking-pages');

const REVIEWED_ALLOWLIST = [
  'AfroTools', 'FIRE', 'SACCO', 'BNPL', 'DCA', 'B2B', 'QR', 'POS',
  'API', 'HTML', 'CSV', 'TXT', 'JSON', 'NGN', 'KES', 'GHS', 'ZAR',
  'XOF', 'XAF', 'USD', 'EUR', 'GBP', 'KSh', 'Net 30', 'mobile money',
  'Investor.gov',
];

const ENGLISH_ORACLE = [
  /\bcalculator\b/gi,
  /\bcalculate\b/gi,
  /\bcompare (?:offers|options|rates|costs|results)\b/gi,
  /\bcomparison\b/gi,
  /\bresults?\b/gi,
  /\brecommendation\b/gi,
  /\breset\b/gi,
  /\bdownload\b/gi,
  /\bcopy result\b/gi,
  /\bsave result\b/gi,
  /\bprivacy\b/gi,
  /\bfrequently asked questions\b/gi,
  /\bhow it works\b/gi,
  /\bannual rate\b/gi,
  /\bmonthly payment\b/gi,
  /\btotal cost\b/gi,
  /\bloan amount\b/gi,
  /\binvoice amount\b/gi,
  /\bcurrency\b/gi,
  /\bnumber of\b/gi,
  /\benter (?:a|an|your)\b/gi,
  /\bplease (?:enter|select|provide)\b/gi,
  /\binvalid (?:value|amount|input)\b/gi,
  /\bthis (?:tool|calculator|estimate)\b/gi,
  /\byour (?:result|payment|portfolio|loan|investment)\b/gi,
];

function routeFile(route) {
  return path.join(ROOT, route.replace(/^\/+|\/+$/g, ''), 'index.html');
}

function visibleAndSearchText(html) {
  const headFields = [];
  for (const match of html.matchAll(/<(?:title|meta|script)[^>]*?(?:content="([^"]*)"|type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>|>([\s\S]*?)<\/title>)/gi)) {
    headFields.push(match[1] || match[2] || match[3] || '');
  }
  const body = (html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i) || [null, ''])[1]
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ');
  return `${headFields.join(' ')} ${body}`
    .replace(/&(?:nbsp|amp|quot|#39);/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function residualEnglish(text, routeAllowlist = []) {
  let reviewed = text.replace(/https?:\/\/\S+|\/[\w./-]+/g, ' ');
  for (const allowed of REVIEWED_ALLOWLIST.concat(routeAllowlist)) reviewed = reviewed.split(allowed).join('');
  return ENGLISH_ORACLE.flatMap((pattern) => reviewed.match(pattern) || []);
}

function assertFrenchDocument(filePath, route, owner, routeAllowlist) {
  if (!fs.existsSync(filePath)) throw new Error(`${route}: missing ${owner} ${path.relative(ROOT, filePath)}`);
  const html = fs.readFileSync(filePath, 'utf8');
  if (!/<html\b[^>]*\blang="fr"/i.test(html)) throw new Error(`${route}: ${owner} is not lang=fr`);
  if (/<iframe\b/i.test(html)) throw new Error(`${route}: ${owner} contains an iframe`);
  const canonical = `https://afrotools.com${route}`;
  if (!html.includes(`rel="canonical" href="${canonical}"`)) throw new Error(`${route}: ${owner} canonical mismatch`);
  if (!/"inLanguage"\s*:\s*"fr"/.test(html)) throw new Error(`${route}: ${owner} JSON-LD lacks inLanguage=fr`);
  const residual = residualEnglish(visibleAndSearchText(html), routeAllowlist);
  if (residual.length) throw new Error(`${route}: ${owner} residual English ${JSON.stringify([...new Set(residual)])}`);
}

function main() {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  if (manifest.expectedEnglishFreeApps !== 31 || manifest.routes.length !== 31) {
    throw new Error(`denominator mismatch: expected 31, found ${manifest.routes.length}`);
  }
  assertFrenchDocument(path.join(ROOT, 'fr', 'fintech', 'index.html'), '/fr/fintech/', 'French category hub', ['fintech']);
  for (const record of manifest.routes) {
    assertFrenchDocument(path.join(SOURCE_DIR, `${record.englishId}.html`), record.frenchRoute, 'source template', [record.englishId]);
    assertFrenchDocument(routeFile(record.frenchRoute), record.frenchRoute, 'physical route', [record.englishId]);
  }
  console.log(JSON.stringify({
    accepted: true,
    denominator: manifest.routes.length,
    hub: { route: '/fr/fintech/', residualEnglish: [] },
    allowlist: REVIEWED_ALLOWLIST,
    routes: manifest.routes.map((record) => ({
      englishId: record.englishId,
      frenchRoute: record.frenchRoute,
      sourceTemplate: `data/localization/fr-fintech-banking-pages/${record.englishId}.html`,
      residualEnglish: [],
    })),
  }, null, 2));
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = { ENGLISH_ORACLE, REVIEWED_ALLOWLIST, residualEnglish, visibleAndSearchText };
