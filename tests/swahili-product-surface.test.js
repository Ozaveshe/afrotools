'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { buildCanonicalRegistry, getSelector } = require('../scripts/lib/canonical-registry');
const localization = require('../assets/js/lib/localization.js');

const ROOT = path.resolve(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const json = (rel) => JSON.parse(read(rel));

function visibleText(html) {
  return html
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<template\b[\s\S]*?<\/template>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z#0-9]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

execFileSync(process.execPath, ['scripts/build-swahili-product-surface.js', '--check'], { cwd: ROOT, stdio: 'pipe' });

const registry = buildCanonicalRegistry();
const swCount = getSelector(registry, 'tools.locale.sw.published').value;
assert(swCount > 0, 'Swahili must have a named published-record selector');

const glossary = json('data/localization/sw-product-glossary.json');
assert.strictEqual(glossary.locale, 'sw');
assert.strictEqual(glossary.normalization, 'NFC');
assert.strictEqual(JSON.stringify(glossary), JSON.stringify(glossary).normalize('NFC'));
for (const term of ['payroll', 'overtime', 'leave', 'benefits', 'dashboard', 'fallback']) assert(glossary.terms[term], `glossary missing ${term}`);
for (const acronym of ['PAYE', 'VAT', 'NSSF', 'SHIF', 'PDF']) assert(glossary.retainedTerms.includes(acronym), `reviewed acronym missing ${acronym}`);

const manifest = json('data/registry/locale-manifest.json');
const swLocale = manifest.locales.find((locale) => locale.id === 'sw');
assert(swLocale && swLocale.launchStatus === 'launched');
assert.strictEqual(swLocale.formatting.currency.defaultCurrency, null, 'Swahili must not silently imply Kenya currency');
for (const code of ['KE', 'TZ', 'UG', 'RW', 'BI', 'CD']) assert(swLocale.formatting.marketFormats[code], `market format missing ${code}`);

const catalogs = { sw: json('lang/sw.json'), en: json('lang/en.json') };
const fmt = localization.create({ manifest, catalogs, locale: 'sw' });
for (const currency of ['KES', 'TZS', 'UGX', 'RWF', 'BIF', 'CDF']) {
  const result = fmt.formatCurrency(123456.78, currency);
  assert(/[0-9]/.test(result), `${currency} formatting should contain digits`);
}
assert(fmt.formatDate('2026-07-11').length > 4);
assert(fmt.formatPercent(0.125).includes('12'));

const home = read('sw/index.html');
const directory = read('sw/zana-zote/index.html');
assert(home.includes(`data-registry-count="tools.locale.sw.published">${swCount}<`));
assert(directory.includes(`data-registry-count="tools.locale.sw.published">${swCount}<`));
assert(!/Inatumiwa na wataalamu|Viwango vya leo|Fedha za Kigeni vya Moja kwa Moja|Kila nchi ya Afrika ina vikokotoo/i.test(visibleText(home)));
assert(/nchi na lugha ni vitu tofauti/i.test(visibleText(home)));
assert(/Matokeo ya Kiingereza huwekwa alama/i.test(visibleText(directory)));

const claims = json('data/audits/public-claim-registry.json');
for (const key of ['free.public-core', 'pro.current-capabilities', 'privacy.browser-local', 'ai.optional-provider', 'freshness.live-data', 'account.optional-sync']) {
  const record = claims.claims.find((claim) => claim.key === key);
  assert(record && record.translations.sw && record.translations.sw.summary, `missing Swahili claim ${key}`);
}

const privacy = read('sw/faragha/index.html');
const terms = read('sw/masharti/index.html');
assert(privacy.includes('data-claim-key="privacy.browser-local"'));
assert(terms.includes('data-claim-key="free.public-core"'));
assert(terms.includes('data-claim-key="pro.current-capabilities"'));
assert(!/Mahesabu yote|hazitumiwi kwenye seva zetu kamwe|haikusanyi kamwe/i.test(visibleText(privacy)));
assert(!/jukwaa bure la zana|kwa nchi 54 za Afrika|kusasisha zana zetu ndani ya siku/i.test(visibleText(terms)));

const policy = json('data/registry/locale-coverage-policy.json');
for (const [route, fallbackRoute] of [['/sw/auth/', '/auth/'], ['/sw/dashboard/', '/dashboard/'], ['/sw/vault/', '/pro/vault/']]) {
  const override = policy.overrides.find((entry) => entry.route === route);
  assert(override, `missing coverage override ${route}`);
  assert.strictEqual(override.state, 'english-fallback');
  assert.strictEqual(override.fallbackRoute, fallbackRoute);
  const html = read(route.slice(1) + 'index.html');
  assert(/Ukurasa unaofuata ni wa Kiingereza/.test(html));
  assert(/noindex,\s*follow/.test(html));
  assert(!/hreflang=/i.test(html), `${route} must not claim a language equivalent`);
  assert(!/http-equiv=["']refresh/i.test(html), `${route} must wait for explicit user action`);
}

const pricing = read('sw/bei/index.html');
assert(pricing.includes(registry.productPlans.find((plan) => plan.id === 'product:monthly_kes').title));
assert(pricing.includes(registry.productPlans.find((plan) => plan.id === 'product:annual_kes').title));
assert(/hatua ya sasa ya malipo.*Kiingereza/i.test(visibleText(pricing)));
assert(read('sw/msaada/index.html').includes('Lugha ya ukurasa na nchi ya hesabu ni vitu tofauti'));

const navbar = read('assets/js/components/navbar.js');
const footer = read('assets/js/components/footer.js');
const assistant = read('assets/js/components/site-assistant.js');
const favorite = read('assets/js/favorites-widget.js');
const consent = read('assets/js/components/cookie-consent.js');
assert(navbar.includes('/sw/bei/'));
assert(navbar.includes('/sw/dashboard/'));
assert(navbar.includes('/sw/auth/'));
assert(navbar.includes('Chagua nchi bila kubadili lugha'));
assert(footer.includes('/sw/faragha/'));
assert(footer.includes('/sw/masharti/'));
assert(footer.includes('/sw/msaada/'));
assert(assistant.includes('Ukituma ombi'));
assert(assistant.includes('Fungua msaidizi wa kutafuta zana za AfroTools'));
assert(favorite.includes('Hifadhi zana'));
assert(favorite.includes('Imehifadhiwa'));
assert(consent.includes('/sw/faragha/'));

const fx = read('sw/zana/kibadilishaji-sarafu/index.html');
assert(fx.includes('id="fxDataStatus"'));
assert(fx.includes('Chanzo cha mtandao hakipatikani'));
assert(fx.includes('si viwango vya moja kwa moja'));
assert(fx.includes("Object.keys(data.rates).length"));
assert.strictEqual((fx.match(/addEventListener\('click',fetchFx\)/g) || []).length, 1, 'retry listener must be idempotent');

const payePages = fs.readdirSync(path.join(ROOT, 'sw'), { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => path.join('sw', entry.name, 'kikokotoo-kodi-mshahara', 'index.html'))
  .filter((rel) => fs.existsSync(path.join(ROOT, rel)));
assert.strictEqual(payePages.length, 54, 'expected the 54-country Swahili PAYE family');
for (const rel of payePages) {
  const html = read(rel);
  assert(!html.includes("window.location.href='/auth/?mode=login&next=/dashboard/';"), `${rel} silently switches to English auth`);
  assert(!/>Share as Image</i.test(html), `${rel} exposes English share UI`);
}

const critical = [
  'sw/index.html', 'sw/zana-zote/index.html', 'sw/nchi/index.html',
  'sw/kenya/kikokotoo-kodi-mshahara/index.html', 'sw/zana/kibadilishaji-sarafu/index.html',
  'sw/zana/kikokotoo-vat/index.html', 'sw/faragha/index.html', 'sw/masharti/index.html',
  'sw/wasiliana/index.html', 'sw/msaada/index.html', 'sw/bei/index.html'
  , 'sw/kuhusu/index.html'
];
for (const rel of critical) {
  const text = visibleText(read(rel));
  assert(!/\b(?:Save Tool|Share as Image|Open Ask AfroTools AI|Privacy Policy|Terms of Use|Sign in|Try again|No results|Loading tools)\b/i.test(text), `${rel} contains unexplained functional English`);
}

for (const file of fs.readdirSync(path.join(ROOT, 'sw'), { recursive: true, withFileTypes: true })) {
  if (!file.isFile() || !file.name.endsWith('.html')) continue;
  const html = fs.readFileSync(path.join(file.parentPath || file.path, file.name), 'utf8');
  const absolute = path.join(file.parentPath || file.path, file.name);
  assert(!/>\s*(?:Save Tool|Share as Image|Copy|Copy Link|Print|Reset|Result|Export CSV|Export JSON|Download TXT|Try again|No results|Loading tools|Sign in|Privacy Policy|Terms of Use)\s*</i.test(html), `${path.relative(ROOT, absolute)} contains an unexplained English action`);
}

console.log('Swahili product surface contract tests passed');
