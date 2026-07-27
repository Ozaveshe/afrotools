"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "..");
const {
  repairPdfTranslatorConsent,
  repairPidginTranslatorConsent
} = require("../scripts/lib/swahili-translation-consent-repairs");

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

function inlineScriptContaining(html, needle) {
  for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    if (/\bsrc\s*=|application\/ld\+json/i.test(match[1])) continue;
    if (match[2].includes(needle)) return match[2];
  }
  throw new Error(`Inline script containing ${needle} was not found`);
}

test("Swahili Pidgin generator repair requires per-page consent and sends a private no-store request", () => {
  const source = read("sw/zana/mtafsiri-wa-pidgin-ya-nigeria/index.html");
  const result = repairPidginTranslatorConsent(source);

  assert.match(result, /external-translation-consent\.js/);
  assert.equal(
    (result.match(/external-translation-consent\.js(?:\?v=[a-f0-9]{8})?/g) || []).length,
    1,
    "repair must collapse raw and cache-busted consent runtimes to one tag"
  );
  assert.match(result, /id="pidginTranslationConsent"/);
  assert.match(result, /id="translateBtn"[^>]*disabled/);
  assert.match(result, /consent\.requireConsent\('pidgin-translator'/);
  assert.match(result, /consent\.headers\('pidgin-translator'\)/);
  assert.match(result, /credentials:\s*'same-origin'/);
  assert.match(result, /cache:\s*'no-store'/);
  assert.match(result, /referrerPolicy:\s*'no-referrer'/);
  assert.match(result, /allowFallback:\s*false/);
  assert.match(result, /r\.status === 428/);
  assert.match(result, /clearCloudTranslation/);
  assert.doesNotMatch(result, /afro_translate_cache_(?:sw|pcm)|localStorage\.setItem\(\s*['"][^'"]*(?:translate|translation|srcText|tgtOutput)/i);
  assert.equal(repairPidginTranslatorConsent(result), result, "repair must be idempotent");
});

test("Swahili Pidgin repair deduplicates cache-busted consent runtimes", () => {
  const source = read("sw/zana/mtafsiri-wa-pidgin-ya-nigeria/index.html");
  const duplicated = source.replace(
    "</head>",
    '<script src="/assets/js/lib/external-translation-consent.js?v=524e1efa" defer></script>\n</head>'
  );
  const result = repairPidginTranslatorConsent(duplicated);

  assert.equal(
    (result.match(/external-translation-consent\.js(?:\?v=[a-f0-9]{8})?/g) || []).length,
    1
  );
  assert.equal(repairPidginTranslatorConsent(result), result);
});

test("Swahili PDF generator repair requires document consent and sends translation text no-store", () => {
  const source = read("sw/zana/kutafsiri-pdf/index.html");
  const result = repairPdfTranslatorConsent(source);

  assert.match(result, /id="cloudConsent"/);
  assert.match(result, /const cloudConsent = \$\('cloudConsent'\)/);
  assert.match(result, /ensureCloudContentConsent\(true\)/);
  assert.match(result, /hasCloudContentConsent\(\)/);
  assert.match(result, /'X-AfroTools-External-Translation-Consent':\s*'accepted'/);
  assert.match(result, /'X-AfroTools-AI-Consent':\s*'accepted'/);
  assert.match(result, /'X-AfroTools-AI-Content-Consent':\s*'accepted'/);
  assert.match(result, /credentials:\s*'same-origin'/);
  assert.match(result, /cache:\s*'no-store'/);
  assert.match(result, /referrerPolicy:\s*'no-referrer'/);
  assert.match(result, /allowFallback:\s*false/);
  assert.match(result, /response\.status === 428/);
  assert.doesNotMatch(result, /afro_translate_cache_sw|localStorage|sessionStorage|indexedDB/i);
  assert.equal(repairPdfTranslatorConsent(result), result, "repair must be idempotent");
});

test("Swahili product-surface owner wires only the two affected translation routes", () => {
  const builder = read("scripts/build-swahili-product-surface.js");

  assert.match(builder, /repairPidginTranslatorConsent\(read\('sw\/zana\/mtafsiri-wa-pidgin-ya-nigeria\/index\.html'\)\)/);
  assert.match(builder, /repairPdfTranslatorConsent\(read\('sw\/zana\/kutafsiri-pdf\/index\.html'\)\)/);
});

test("English source consumers retain the same consent and no-store boundary", () => {
  const pidgin = read("tools/pidgin-translator/index.html");
  const pdf = read("tools/pdf-translate/index.html");

  assert.match(pidgin, /consent\.headers\('pidgin-translator'\)/);
  assert.match(pidgin, /cache:\s*'no-store'/);
  assert.match(pdf, /'X-AfroTools-External-Translation-Consent':\s*'accepted'/);
  assert.match(pdf, /cache:\s*'no-store'/);
  assert.doesNotMatch(pidgin, /afro_translate_cache_(?:sw|pcm)|localStorage\.setItem\(\s*['"][^'"]*(?:translate|translation|srcText|tgtOutput)/i);
  assert.doesNotMatch(pdf, /afro_translate_cache_sw|localStorage|sessionStorage|indexedDB/i);
});

test("generated inline consumers remain valid JavaScript after the repairs", () => {
  const pidgin = repairPidginTranslatorConsent(read("sw/zana/mtafsiri-wa-pidgin-ya-nigeria/index.html"));
  const pdf = repairPdfTranslatorConsent(read("sw/zana/kutafsiri-pdf/index.html"));

  assert.doesNotThrow(() => new vm.Script(inlineScriptContaining(pidgin, "function doTranslate()")));
  assert.doesNotThrow(() => new vm.Script(inlineScriptContaining(pdf, "async function translateWithApi")));
});
