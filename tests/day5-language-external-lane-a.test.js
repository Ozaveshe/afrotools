'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const sharedLaneCss = fs.readFileSync(path.join(root, 'tools', 'swahili-translator', 'translator-vip.css'), 'utf8');
const routes = [
  {
    slug: 'swahili-translator',
    count: 194,
    fixtures: ['Uwanja wa ndege uko wapi?', 'Niko vizuri', 'Samahani', 'Ufukwe', 'Buni'],
    boundaries: ['Kingwana', 'apostrophes'],
  },
  {
    slug: 'yoruba-translator',
    count: 175,
    fixtures: ['Báwo ni?', 'Ẹ káàárọ̀', 'Ẹ ṣéun', 'Iṣẹ́', 'Ikọ́', 'Ẹ̀jẹ̀ ríru / ìfúnpá gíga'],
    boundaries: ['Tone marking remains incomplete', 'dot-below'],
  },
  {
    slug: 'hausa-translator',
    count: 131,
    fixtures: ['Kuɗi', 'Gyaɗa', 'Yaya kake? / Yaya kike?', 'Ina kewarka / kewarki'],
    boundaries: ['Latin-script Boko Hausa', 'Ajami transliteration'],
  },
  {
    slug: 'igbo-translator',
    count: 129,
    fixtures: ['Afọ na-awa m', 'Ụlọ akụ', 'Mgbazinye ego', 'Gbalịsie ike'],
    boundaries: ['vowel-harmony', 'Onitsha'],
  },
];

for (const route of routes) {
  const directory = path.join(root, 'tools', route.slug);
  const html = fs.readFileSync(path.join(directory, 'index.html'), 'utf8');
  const css = fs.readFileSync(path.join(directory, 'translator-vip.css'), 'utf8');
  const js = fs.readFileSync(path.join(directory, 'translator-vip.js'), 'utf8');
  const context = JSON.parse(fs.readFileSync(path.join(root, 'data', 'ai', 'tool-context', route.slug + '.json'), 'utf8'));

  assert.strictEqual((html.match(/\{en:/g) || []).length, route.count, `${route.slug} inventory count`);
  if (route.slug === 'swahili-translator') {
    assert.ok(html.includes(`${route.count} app-local English`), `${route.slug} metadata must state the exact draft inventory`);
  } else {
    assert.ok(html.includes(`${route.count} local English`), `${route.slug} metadata must state exact inventory`);
  }
  assert.ok(html.includes(`data-vip-inventory>${route.count}<`), `${route.slug} visible boundary must state exact inventory`);
  assert.ok(!/\b(?:200|400|500|50,?000)\+\s+(?:phrases|word pairs)/i.test(html), `${route.slug} must not inflate inventory`);
  if (route.slug === 'swahili-translator') {
    assert.ok(html.includes('snapshot dated 26 July 2026'), `${route.slug} must date the unverified snapshot honestly`);
    assert.ok(html.includes('unverified app-local draft'), `${route.slug} must expose the provenance limitation`);
    assert.ok(!/\breviewed(?: source)? (?:records|entries|phrase array)\b/i.test(html + js), `${route.slug} must not claim qualified review`);
    assert.ok(!html.includes('data-df-upgrade') && !html.includes('data-df-form') && !html.includes('df-faq'), `${route.slug} must not retain the generic calculator workflow`);
    assert.ok(!html.includes('english-df-app-upgrades'), `${route.slug} must not load the removed generic workflow`);
    assert.ok(html.includes("sw:'Shinikizo la juu la damu'"), `${route.slug} must use the supported hypertension phrase`);
    assert.ok(!html.includes("sw:'Shinikizo la damu juu'"), `${route.slug} must remove the incorrect hypertension ordering`);
    assert.strictEqual((html.match(/note:'/g) || []).length, 9, `${route.slug} must flag nine context-sensitive draft entries`);
    assert.ok(html.includes('id="swahiliMeaningSelect"') && html.includes('id="swahiliMeaningOutput"'), `${route.slug} must provide its local ambiguity checker`);
    assert.ok(html.includes('aria-pressed="true"') && html.includes('aria-pressed="false"'), `${route.slug} category controls must expose selected state`);
    assert.ok(html.includes('aria-label="Listen to ${escapeMarkup(p.sw)} in Swahili"'), `${route.slug} audio labels must identify their phrase`);
    assert.ok(html.includes("Democratic Republic of Congo's national languages"), `${route.slug} must not call Swahili the DRC official language`);
  } else {
    assert.ok(html.includes('checked 26 July 2026'), `${route.slug} must show checked date`);
  }
  assert.ok(html.includes('Default: local lookup'), `${route.slug} must preserve local-first default`);
  assert.ok(html.includes('explicit page-session consent'), `${route.slug} must state non-persistent consent boundary`);
  assert.ok(html.includes('Download TXT') && html.includes('Print / save PDF'), `${route.slug} must expose local exports`);
  assert.ok(html.includes('<label for="search">'), `${route.slug} search needs a visible label`);
  assert.ok(html.includes('aria-live="polite"'), `${route.slug} needs live status`);
  assert.ok(html.includes('aria-label="Listen to'), `${route.slug} audio buttons need stable accessible names`);
  assert.ok(!/fonts\.googleapis|fonts\.gstatic|cdnjs|cdn\.jsdelivr|unpkg/i.test(html + css), `${route.slug} must not use route-level font/CDN dependencies`);
  assert.ok(/prefers-color-scheme:dark/.test(css + sharedLaneCss), `${route.slug} needs dark-mode styling`);
  assert.ok(/focus-visible/.test(css + sharedLaneCss), `${route.slug} needs visible focus styling`);
  assert.ok(/max-width:375px/.test(css) || /swahili-translator\/translator-vip\.css/.test(css), `${route.slug} needs narrow-screen styling`);
  assert.ok(!/localStorage|sessionStorage|indexedDB|gtag\s*\(|analytics|memoryCache|cacheKey|location\.(?:hash|search)/i.test(js), `${route.slug} app-local code must not persist, cache, analyze, or URL-encode raw text`);

  for (const fixture of route.fixtures) {
    assert.ok(html.includes(fixture), `${route.slug} missing reviewed language fixture: ${fixture}`);
  }
  for (const boundary of route.boundaries) {
    assert.ok(html.includes(boundary), `${route.slug} missing coverage boundary: ${boundary}`);
  }

  assert.strictEqual(context.toolKey, route.slug);
  assert.strictEqual(context.inventoryCount, route.count);
  assert.strictEqual(context.checkedDate, '2026-07-26');
  if (route.slug === 'swahili-translator') {
    assert.strictEqual(context.status, 'unverified-static');
    assert.strictEqual(context.legacyTextSha256, 'sha256:169e36a7920521b844fdfdf43b04a326825a5a54d50992df67bff23ba3b9db80');
    assert.ok(/no entry-level source ledger or qualified-speaker sign-off/.test(context.staticText));
  }
  assert.ok(context.boundaries.some((item) => /Never place raw source or translated text/.test(item)));
  assert.ok(context.boundaries.some((item) => /human-quality|human review/.test(item)));
}

const sharedClient = fs.readFileSync(path.join(root, 'assets', 'js', 'lib', 'live-translate.js'), 'utf8');
assert.ok(sharedClient.includes('consent.requireConsent'));
assert.ok(sharedClient.includes("cache: 'no-store'"));
assert.ok(sharedClient.includes('data.unchanged'), 'unchanged valid translations must be rendered and labeled');
assert.ok(!sharedClient.includes('allowFallback: true'), 'fallback must never be silently forced');

console.log('day5-language-external-lane-a.test.js passed');
