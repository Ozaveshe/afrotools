'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const INVENTORY = JSON.parse(fs.readFileSync(
  path.join(ROOT, 'reports', 'swahili-free-app-parity-inventory.json'),
  'utf8'
));

const APPS = [
  ['swahili-translator', 'mtafsiri-wa-kiswahili'],
  ['yoruba-translator', 'mtafsiri-wa-kiyoruba'],
  ['hausa-translator', 'mtafsiri-wa-kihausa'],
  ['igbo-translator', 'mtafsiri-wa-kiigbo'],
  ['amharic-translator', 'mtafsiri-wa-kiamhari'],
  ['zulu-translator', 'mtafsiri-wa-kizulu'],
  ['arabic-calc', 'nambari-za-kiarabu'],
  ['transliterate', 'transliteration-ya-maandishi'],
  ['pidgin-translator', 'mtafsiri-wa-pidgin-ya-nigeria'],
  ['french-african', 'mtafsiri-wa-kifaransa-afrika'],
  ['african-name-meaning', 'maana-ya-majina-ya-afrika']
];

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

function page(slug) {
  return read(`sw/zana/${slug}/index.html`);
}

function visibleInterface(html) {
  return html
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<template\b[\s\S]*?<\/template>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&(?:#\d+|#x[0-9a-f]+|[a-z]+);/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function inlineScripts(html) {
  return Array.from(html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi))
    .filter((match) => !/\bsrc\s*=|application\/(?:ld\+json|json)|speculationrules/i.test(match[1]))
    .map((match) => match[2]);
}

test('language lane is exactly the 11 English free-app rows and has one Swahili owner each', () => {
  const rows = INVENTORY.rows.filter((row) => row.categoryKey === 'language');
  assert.equal(rows.length, 11);
  assert.deepEqual(
    rows.map((row) => row.englishId).sort(),
    APPS.map(([englishId]) => englishId).sort()
  );

  for (const [englishId, slug] of APPS) {
    const row = rows.find((candidate) => candidate.englishId === englishId);
    assert.ok(row, `${englishId} is absent from the parity inventory`);
    assert.equal(row.primarySwahiliFile, `sw/zana/${slug}/index.html`);
    assert.equal(row.state, 'localized-shell-candidate');
    assert.doesNotMatch(page(slug), /<iframe\b[^>]*\bsrc=["'][^"']*\/tools\//i);
  }
});

test('all 11 routes expose Swahili metadata, reciprocal English ownership and valid inline JavaScript', () => {
  for (const [englishId, slug] of APPS) {
    const html = page(slug);
    assert.match(html, /<html\b[^>]*\blang=["']sw["']/i, `${englishId}: lang`);
    assert.match(
      html,
      new RegExp(`<link rel="canonical" href="https://afrotools\\.com/sw/zana/${slug}/">`),
      `${englishId}: canonical`
    );
    assert.match(html, /<link rel="alternate" hreflang="en" href="https:\/\/afrotools\.com\//);
    assert.match(html, /<link rel="alternate" hreflang="sw" href="https:\/\/afrotools\.com\/sw\//);
    assert.match(html, /"inLanguage"\s*:\s*"sw"/);
    assert.match(html, /<meta property="og:url" content="https:\/\/afrotools\.com\/sw\//);
    const ogImage = html.match(/<meta property="og:image" content="https:\/\/afrotools\.com\/([^"]+)"/i);
    assert.ok(ogImage, `${englishId}: og:image`);
    assert.notEqual(ogImage[1], 'assets/img/og-default.png', `${englishId}: dedicated artwork`);
    assert.ok(fs.existsSync(path.join(ROOT, ogImage[1])), `${englishId}: artwork file`);
    assert.doesNotMatch(html, /\uFFFD|Ã.|Â.|â[€™“”–—]|ðŸ/u, `${englishId}: mojibake`);
    for (const [index, source] of inlineScripts(html).entries()) {
      assert.doesNotThrow(
        () => new vm.Script(source),
        `${englishId}: inline script ${index + 1} is invalid`
      );
    }
  }
});

test('shared Swahili language UI and accessibility labels no longer expose mixed shell copy', () => {
  for (const [englishId, slug] of APPS) {
    const html = page(slug);
    assert.doesNotMatch(html, />\s*Nakili brief\s*</i, `${englishId}: brief label`);
    assert.doesNotMatch(html, /aria-label=["'](?:Lang Filter|Gender Filter|Suggest Gender|Direction|ingizo Format)["']/i);
  }

  const pidgin = visibleInterface(page('mtafsiri-wa-pidgin-ya-nigeria'));
  assert.doesNotMatch(
    pidgin,
    /\b(?:Learn Naija|Master Nigerian|Phrases|Speakers|Flashcard Mode|How do you say|Tap to reveal|Skip|I Knew It|Live Translator|Swap languages)\b/i
  );

  const transliteration = visibleInterface(page('transliteration-ya-maandishi'));
  assert.doesNotMatch(
    transliteration,
    /\b(?:Character Map|Click to Insert|keyboard|Consonant mapping|Key mapping|Syllable mapping|African Writing Systems|Used for|Right-to-left)\b/i
  );
});

test('external translation remains opt-in, no-store and limited to the Pidgin app', () => {
  for (const [englishId, slug] of APPS) {
    const html = page(slug);
    if (englishId !== 'pidgin-translator') {
      assert.doesNotMatch(html, /\bfetch\s*\(\s*['"`]\/api\/translate/i, `${englishId}: unexpected network translator`);
      continue;
    }
    assert.match(html, /external-translation-consent\.js/);
    assert.match(html, /requireConsent\('pidgin-translator'/);
    assert.match(html, /fetch\('\/api\/translate'/);
    assert.match(html, /cache:\s*'no-store'/);
    assert.match(html, /referrerPolicy:\s*'no-referrer'/);
    assert.match(html, /credentials:\s*'same-origin'/);
    assert.doesNotMatch(html, /localStorage\.(?:setItem|getItem)\([^)]*(?:translate|translation|srcText|tgtOutput)/i);
  }
});

test('the source owner explicitly owns the exact language lane and preserves post-processed pages', () => {
  const owner = read('scripts/build-swahili-product-surface.js');
  for (const [, slug] of APPS) {
    assert.match(owner, new RegExp(`sw/zana/${slug}/index\\.html`));
  }
  assert.match(owner, /language-app parity lane is deliberately narrow/);
  assert.match(owner, /including in --write mode/);
  assert.match(owner, /current\.includes\(`name="afrotools-sw-source-hash"/);
});
