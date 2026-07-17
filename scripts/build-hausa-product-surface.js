#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const registryApi = require('./lib/canonical-registry');

const ROOT = path.resolve(__dirname, '..');
const WRITE = process.argv.includes('--write');
const MANIFEST_PATH = path.join(ROOT, 'data/localization/ha-bridge-manifest.json');
const GLOSSARY_PATH = path.join(ROOT, 'data/localization/ha-product-glossary.json');
const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
const glossary = JSON.parse(fs.readFileSync(GLOSSARY_PATH, 'utf8'));
const generated = new Set(manifest.bridges.map((bridge) => `${bridge.route.replace(/^\/+|\/+$/g, '')}/index.html`));
const stale = [];

function normalize(value) { return String(value).normalize('NFC').replace(/\r\n/g, '\n'); }
function comparableHtml(value) {
  return normalize(value)
    .replace(/\sdata-chat-bundle="[^"]+"/g, '')
    .replace(/((?:href|src)="[^"?#]+)\?v=[a-f0-9]+("[^>]*>)/gi, '$1$2');
}
function escapeHtml(value) { return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function hash(value) { return crypto.createHash('sha256').update(value).digest('hex').slice(0, 16); }
function routeForFile(relative) { return `/${relative.replace(/\\/g, '/').replace(/index\.html$/, '')}`; }

function writeOrCheck(relative, value) {
  const absolute = path.join(ROOT, relative);
  const expected = normalize(value);
  const current = fs.existsSync(absolute) ? normalize(fs.readFileSync(absolute, 'utf8')) : '';
  if (comparableHtml(current) === comparableHtml(expected)) return;
  stale.push(relative);
  if (WRITE) {
    fs.mkdirSync(path.dirname(absolute), { recursive: true });
    fs.writeFileSync(absolute, expected, 'utf8');
  }
}

function destinationWithContext(bridge) {
  const url = new URL(bridge.destination, 'https://afrotools.com');
  url.searchParams.set('locale', 'ha');
  if (!url.searchParams.has('return_to')) url.searchParams.set('return_to', bridge.route);
  return `${url.pathname}${url.search}${url.hash}`;
}

function bridgePage(bridge) {
  const destination = destinationWithContext(bridge);
  const source = JSON.stringify({ manifest: manifest.schemaVersion, bridge });
  const sourceHash = hash(source);
  return `<!doctype html>
<html lang="ha">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="afrotools-ha-source-hash" content="${sourceHash}">
<meta name="afrotools-content-id" content="ha-bridge:${escapeHtml(bridge.id)}">
<meta name="afrotools-source-owner" content="scripts/build-hausa-product-surface.js">
<meta name="content-language" content="ha">
<meta name="robots" content="noindex, follow">
<title>${escapeHtml(bridge.title)} — gadar Hausa | AfroTools</title>
<meta name="description" content="${escapeHtml(bridge.description)}">
<link rel="stylesheet" href="/assets/css/design-system.min.css">
<link rel="stylesheet" href="/assets/css/top-level-page-ui-refresh.css">
<script src="/assets/js/data/african-countries.js" defer></script>
<script src="/assets/js/components/navbar.min.js" defer></script>
<script src="/assets/js/components/footer.min.js" defer></script>
<style>.ha-bridge{max-width:760px;margin:auto;padding:64px 20px 88px}.ha-bridge h1{font-size:clamp(2rem,7vw,3.5rem);line-height:1.05}.ha-bridge p{line-height:1.75}.ha-bridge-warning{padding:18px;border:1px solid #e7b84f;border-radius:14px;background:#fff8e6}.ha-bridge-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:22px}.ha-bridge-actions a{display:inline-flex;min-height:44px;align-items:center;padding:10px 16px;border-radius:10px;background:#0062cc;color:#fff;font-weight:800;text-decoration:none}.ha-bridge-actions a.alt{background:#fff;color:#075fb8;border:1px solid #9dc4ec}</style>
<link rel="canonical" href="https://afrotools.com${bridge.route}">
<meta name="afrotools-locale-coverage" content="english-fallback">
<meta name="afrotools-locale-fallback" content="${escapeHtml(new URL(bridge.destination, 'https://afrotools.com').pathname)}">
</head>
<body class="top-level-page-ui-refresh" data-ha-coverage-state="english-fallback">
<a class="skip-link" href="#main">Tsallake zuwa babban abun ciki</a>
<afro-navbar></afro-navbar>
<main id="main" class="ha-bridge">
<p>Gadar harshe</p>
<h1>${escapeHtml(bridge.title)}</h1>
<div class="ha-bridge-warning" role="note">
<p><strong>Shafin da za a buɗe yana Turanci.</strong> ${escapeHtml(bridge.destinationName)} bai samu cikakkiyar fuskar Hausa ba tukuna. Ba ma kiran wannan shafi fassarar Hausa, kuma ba ya shiga hreflang ko sitemap na Hausa.</p>
<p>Harshen shafi da ƙasar da bayanai suka shafa abubuwa ne daban. Ci gaba ba zai sauya ƙasar da ka zaɓa ba. Za mu aika <code>locale=ha</code> da hanyar komawa idan shafin Turanci yana goyon bayansu.</p>
<p>Buɗe wannan gada kaɗai ba ya nufin cewa an ajiye ko an daidaita bayananka. Ka duba saƙon nasara ko kuskure a shafin da ya biyo baya.</p>
</div>
<div class="ha-bridge-actions">
<a id="haBridgeContinue" data-destination-base="${escapeHtml(new URL(bridge.destination, 'https://afrotools.com').pathname)}" href="${escapeHtml(destination)}">Ci gaba zuwa shafin Turanci</a>
<a class="alt" href="${escapeHtml(bridge.back)}">${escapeHtml(bridge.backLabel)}</a>
</div>
</main>
<afro-footer></afro-footer>
<script>(function(){'use strict';var link=document.getElementById('haBridgeContinue');if(!link)return;var params=new URLSearchParams(location.search),requested=params.get('destination'),returnTo=params.get('return_to'),base=link.getAttribute('data-destination-base');if(!returnTo||returnTo.charAt(0)!=='/'||returnTo.indexOf('//')===0)returnTo=${JSON.stringify(bridge.route)};if(requested&&requested.charAt(0)==='/'&&requested.indexOf('//')!==0){try{var url=new URL(requested,location.origin);if(url.origin===location.origin&&url.pathname.indexOf(base)===0){url.searchParams.set('locale','ha');url.searchParams.set('return_to',returnTo);link.href=url.pathname+url.search+url.hash}}catch(_){}}})();</script>
</body>
</html>
`;
}

function allHausaHtml(directory) {
  const output = [];
  fs.readdirSync(directory, { withFileTypes: true }).forEach((entry) => {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) output.push(...allHausaHtml(absolute));
    else if (entry.name === 'index.html') output.push(absolute);
  });
  return output;
}

function bridgeForHref(href) {
  if (!href || href.charAt(0) !== '/' || href.indexOf('//') === 0 || href.startsWith('/ha/')) return null;
  const url = new URL(href, 'https://afrotools.com');
  return manifest.bridges.find((bridge) => {
    const bases = [new URL(bridge.destination, 'https://afrotools.com').pathname, ...(bridge.destinationAliases || [])];
    return bases.some((base) => url.pathname === base || url.pathname.startsWith(base.endsWith('/') ? base : `${base}/`));
  }) || null;
}

function rewriteSensitiveLinks(html, relative) {
  const returnTo = routeForFile(relative);
  return html.replace(/\bhref=(["'])(\/[^"']*)\1/gi, (match, quote, href) => {
    const bridge = bridgeForHref(href);
    if (!bridge) return match;
    const destination = encodeURIComponent(href);
    return `href=${quote}${bridge.route}?destination=${destination}&amp;return_to=${encodeURIComponent(returnTo)}${quote}`;
  });
}

function validateContracts() {
  const ids = new Set();
  const routes = new Set();
  manifest.bridges.forEach((bridge) => {
    if (ids.has(bridge.id)) throw new Error(`Duplicate Hausa bridge id ${bridge.id}`);
    if (routes.has(bridge.route)) throw new Error(`Duplicate Hausa bridge route ${bridge.route}`);
    ids.add(bridge.id); routes.add(bridge.route);
    if (!bridge.route.startsWith('/ha/') || !bridge.route.endsWith('/')) throw new Error(`Invalid Hausa bridge route ${bridge.route}`);
    if (!registryApi.routeExists(new URL(bridge.destination, 'https://afrotools.com').pathname)) throw new Error(`Hausa bridge destination missing: ${bridge.destination}`);
  });
  if (glossary.normalization !== 'NFC') throw new Error('Hausa product glossary must declare NFC normalization.');
  ['account', 'dashboard', 'vault', 'country', 'currency', 'privacy', 'terms', 'englishPage', 'languageBridge'].forEach((key) => {
    if (!glossary.terms[key]) throw new Error(`Hausa product glossary missing ${key}.`);
  });
}

function run() {
  validateContracts();
  manifest.bridges.forEach((bridge) => writeOrCheck(`${bridge.route.replace(/^\/+|\/+$/g, '')}/index.html`, bridgePage(bridge)));
  allHausaHtml(path.join(ROOT, 'ha')).forEach((absolute) => {
    const relative = path.relative(ROOT, absolute).replace(/\\/g, '/');
    if (generated.has(relative)) return;
    const before = fs.readFileSync(absolute, 'utf8');
    writeOrCheck(relative, rewriteSensitiveLinks(before, relative));
  });
  if (!WRITE && stale.length) throw new Error(`Hausa product surface is stale:\n- ${stale.join('\n- ')}\nRun node scripts/build-hausa-product-surface.js --write.`);
  console.log(`${WRITE ? 'Updated' : 'Verified'} Hausa product surface: ${manifest.bridges.length} explicit English bridge(s), ${stale.length} changed file(s).`);
  return { bridges: manifest.bridges.length, stale };
}

if (require.main === module) {
  try { run(); } catch (error) { console.error(error.message); process.exit(1); }
}

module.exports = { run, bridgePage, rewriteSensitiveLinks, bridgeForHref };
