#!/usr/bin/env node
'use strict';

// Regression test for the SEO bot / site build churn loop.
//
// scripts/seo-daily-fix.js runs unattended and pushes straight to main. It used to
// rewrite the canonical and og:url tags unconditionally, normalising `<meta ... />`
// into `<meta ... >` even when the URL was already correct. No SEO effect, but it
// changed every page byte-for-byte, and the site build re-emits the self-closing
// form -- so the two overwrote each other on every cycle. That left ~700 files
// permanently "out of date" in CI and broke the content digest pinned for
// route-itax-guide (tools/itax-guide/index.html), which reached main on 2026-07-25
// behind a `[skip ci]` commit.
//
// The contract: rewrite a tag only when the URL actually changes.

const assert = require('assert');
const {
  upsertCanonical,
  upsertOgUrl,
  rewriteJsonLdUrlLiterals,
} = require('../scripts/lib/seo-tags.js');

const URL = 'https://afrotools.com/tools/itax-guide/';

// A pretty-printed FAQPage block, the shape the site build emits.
const PRETTY_JSON_LD = [
  '',
  '      {',
  '        "@context": "https://schema.org",',
  '        "@type": "FAQPage",',
  '        "mainEntity": [',
  '          {',
  '            "@type": "Question",',
  '            "name": "What is PAYE?",',
  '            "acceptedAnswer": {',
  '              "@type": "Answer",',
  '              "text": "A payroll tax."',
  '            }',
  '          }',
  '        ],',
  '        "url": "https://afrotools.com/old-path"',
  '      }',
  '    ',
].join('\n');

function run() {
  // The exact byte that broke main: correct URL, self-closing tag. Leave it alone.
  const ogSelfClosing = `<head><meta property="og:url" content="${URL}" /></head>`;
  assert.strictEqual(
    upsertOgUrl(ogSelfClosing, URL),
    ogSelfClosing,
    'og:url with a correct URL must not be rewritten just to drop the self-closing slash'
  );

  const canonicalSelfClosing = `<head><link rel="canonical" href="${URL}" /></head>`;
  assert.strictEqual(
    upsertCanonical(canonicalSelfClosing, URL),
    canonicalSelfClosing,
    'canonical with a correct URL must not be rewritten just to drop the self-closing slash'
  );

  // Already-normalised tags are likewise untouched.
  const ogPlain = `<head><meta property="og:url" content="${URL}"></head>`;
  assert.strictEqual(upsertOgUrl(ogPlain, URL), ogPlain);

  // A genuinely wrong URL must still be corrected -- the fix must not disable the tool.
  assert.strictEqual(
    upsertOgUrl(`<head><meta property="og:url" content="https://afrotools.com/wrong/" /></head>`, URL),
    `<head><meta property="og:url" content="${URL}"></head>`,
    'a wrong og:url must still be rewritten'
  );
  assert.strictEqual(
    upsertCanonical(`<head><link rel="canonical" href="https://afrotools.com/wrong/" /></head>`, URL),
    `<head><link rel="canonical" href="${URL}"></head>`,
    'a wrong canonical must still be rewritten'
  );

  // A missing tag must still be inserted.
  assert.ok(
    upsertCanonical('<head><title>x</title></head>', URL).includes(`<link rel="canonical" href="${URL}">`),
    'a missing canonical must still be inserted'
  );
  assert.ok(
    upsertOgUrl('<head><title>x</title></head>', URL).includes(`<meta property="og:url" content="${URL}">`),
    'a missing og:url must still be inserted'
  );

  // True idempotence: a second pass over the tool's own output changes nothing.
  const first = upsertOgUrl(upsertCanonical('<head><title>x</title></head>', URL), URL);
  const second = upsertOgUrl(upsertCanonical(first, URL), URL);
  assert.strictEqual(second, first, 'running the pass twice must be a no-op');

  // ---- JSON-LD: the 47,016-line regression -------------------------------
  // Nothing to normalise: the block must come back byte-identical, not minified.
  const identity = (url) => url;
  const untouched = rewriteJsonLdUrlLiterals(PRETTY_JSON_LD, identity);
  assert.strictEqual(untouched.changed, false, 'a block with no URL change must report changed=false');
  assert.strictEqual(
    untouched.text,
    PRETTY_JSON_LD,
    'a JSON-LD block with nothing to fix must not be reformatted'
  );

  // A real URL change must apply, and must still preserve every other byte.
  const remap = (url) => (url === 'https://afrotools.com/old-path' ? URL : url);
  const fixed = rewriteJsonLdUrlLiterals(PRETTY_JSON_LD, remap);
  assert.strictEqual(fixed.changed, true, 'a genuine URL change must be applied');
  assert.ok(fixed.text.includes(`"${URL}"`), 'the new URL must be present');
  assert.ok(!fixed.text.includes('old-path'), 'the old URL must be gone');
  assert.strictEqual(
    fixed.text,
    PRETTY_JSON_LD.replace('https://afrotools.com/old-path', URL),
    'only the URL literal may change -- indentation and newlines must survive'
  );

  // The formatting-destruction signature: multi-line in, multi-line out.
  assert.strictEqual(
    fixed.text.split('\n').length,
    PRETTY_JSON_LD.split('\n').length,
    'the block must not be collapsed onto one line'
  );

  // Structured data must survive intact -- this is what 47k removed lines were.
  const parsed = JSON.parse(fixed.text);
  assert.strictEqual(parsed['@type'], 'FAQPage');
  assert.strictEqual(parsed.mainEntity[0].acceptedAnswer.text, 'A payroll tax.');
  assert.strictEqual(parsed.url, URL);

  // Search-action templates are not page URLs and must be left alone.
  const template = '{"urlTemplate":"https://afrotools.com/search?q={search_term_string}"}';
  assert.strictEqual(
    rewriteJsonLdUrlLiterals(template, () => 'https://afrotools.com/CLOBBERED').text,
    template,
    'a {search_term_string} template must never be rewritten'
  );

  // Object keys are not values. Rewriting one would rename a schema.org property
  // instead of fixing a URL -- an aggressive normaliser must not be able to reach them.
  const clobber = () => 'https://afrotools.com/CLOBBERED';
  assert.strictEqual(
    rewriteJsonLdUrlLiterals('{ "urlTemplate" : "safe" }', clobber).text.indexOf('"urlTemplate"'),
    2,
    'object keys must never be rewritten'
  );
  assert.strictEqual(
    rewriteJsonLdUrlLiterals('{"url":"https://afrotools.com/old-path"}', remap).text,
    `{"url":"${URL}"}`,
    'the value must change while its key stays put'
  );

  // Idempotence: a second pass over the tool's own output changes nothing.
  assert.strictEqual(
    rewriteJsonLdUrlLiterals(fixed.text, remap).changed,
    false,
    'running the JSON-LD pass twice must be a no-op'
  );

  console.log('seo-daily-fix-idempotence.test.js passed');
}

run();
