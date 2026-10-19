"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { applyFallbacks, getMetaContent } = require("../scripts/apply-og-fallbacks");
const root = path.resolve(__dirname, "..");
function fixture(locale = "en", title = "Payroll records & forms", description = "Keep payroll records and prepare the forms for your own country.", extra = "") {
  const route = locale === "en" ? "/cookies/" : "/" + locale + "/cookies/";
  const file = path.join(root, route.slice(1), "index.html");
  const row = { route, state: "page", indexability: "indexable", pageType: "page", locale, source: { file: route.slice(1) + "index.html" } };
  const html = '<!doctype html><html lang="' + locale + '"><head><title>' + title + '</title><meta name="description" content="' + description + '"><link rel="canonical" href="https://afrotools.com' + route + '"><meta property="og:type" content="website"><meta property="og:title" content="Keep the separate OG title"><meta property="og:description" content="Keep the separate OG description"><meta property="og:image" content="https://afrotools.com/assets/img/og-default.png"><meta name="twitter:image" content="https://afrotools.com/assets/img/og-default.png"><meta name="twitter:card" content="summary">' + extra + '</head><body><h1>Keep this heading</h1><p>Existing facts, links and dates stay exact.</p></body></html>';
  return { html, file, row, run(input = html) { return applyFallbacks(input, file, { routeRecord: row }); } };
}
test("existing summary card does not suppress missing title and description", () => {
  const f = fixture(); const out = f.run();
  assert.equal(getMetaContent(out.html, "name", "twitter:title"), "Payroll records & forms");
  assert.equal(getMetaContent(out.html, "name", "twitter:description"), "Keep payroll records and prepare the forms for your own country.");
  assert.equal(getMetaContent(out.html, "name", "twitter:card"), "summary");
});
test("French, Swahili, Hausa and Yoruba copy comes from that same locale page", () => {
  for (const [locale, title, description] of [["fr", "Documents et formulaires au S\u00e9n\u00e9gal", "Pr\u00e9parez vos documents avec les r\u00e8gles et les limites locales."], ["sw", "Hati na fomu za kazi", "Andaa hati zako kulingana na nchi na kazi yako."], ["ha", "Takardu da fom na aiki", "Shirya takardu bisa ga kasa da aikin da kake yi."], ["yo", "Aw\u1ecd\u1e47 f\u1ecd\u1ecdm\u1ee5 i\u1e63\u1eb9", "Mura aw\u1ecd\u1e47 iwe r\u1eb9 p\u1eb9lu alaye ti o ba orile-ede r\u1eb9 mu."]]) {
    const f = fixture(locale, title, description); const out = f.run().html;
    assert.equal(getMetaContent(out, "name", "twitter:title"), title, locale);
    assert.equal(getMetaContent(out, "name", "twitter:description"), description, locale);
    assert.ok(out.includes('lang="' + locale + '"'));
  }
});
test("existing intentional Twitter text and card choice remain unchanged", () => {
  const f = fixture("en", "Page title", "Page description", '<meta name="twitter:title" content="Hand edited social title"><meta name="twitter:description" content="Hand edited social description">');
  const out = f.run().html;
  assert.equal(getMetaContent(out, "name", "twitter:title"), "Hand edited social title");
  assert.equal(getMetaContent(out, "name", "twitter:description"), "Hand edited social description");
  assert.equal(getMetaContent(out, "name", "twitter:card"), "summary");
});
test("partial omissions fill independently without overwriting the other explicit field", () => {
  for (const [tag, expectedTitle, expectedDescription] of [['<meta name="twitter:title" content="Manual title">', "Manual title", "Page description"], ['<meta name="twitter:description" content="Manual description">', "Page title", "Manual description"]]) {
    const f = fixture("en", "Page title", "Page description", tag); const out = f.run().html;
    assert.equal(getMetaContent(out, "name", "twitter:title"), expectedTitle);
    assert.equal(getMetaContent(out, "name", "twitter:description"), expectedDescription);
  }
});
test("encoded accents, ampersands and quotes decode once and escape safely", () => {
  const f = fixture("fr", "Cr&eacute;er &amp; classer &quot;SARL&quot;", "Co&ucirc;ts &amp; documents &quot;RCCM&quot;"); const out = f.run().html;
  assert.equal(getMetaContent(out, "name", "twitter:title"), 'Cr\u00e9er & classer "SARL"');
  assert.equal(getMetaContent(out, "name", "twitter:description"), 'Co\u00fbts & documents "RCCM"');
  assert.ok(out.includes('content="Cr\u00e9er &amp; classer &quot;SARL&quot;"'));
});
test("Open Graph wording and page body remain unchanged", () => {
  const f = fixture(); const out = f.run().html;
  assert.equal(getMetaContent(out, "property", "og:title"), "Keep the separate OG title");
  assert.equal(getMetaContent(out, "property", "og:description"), "Keep the separate OG description");
  assert.equal(out.slice(out.indexOf("<body>")), f.html.slice(f.html.indexOf("<body>")));
});
test("missing source copy is not invented and repeated fallback is idempotent", () => {
  const f = fixture(); const input = f.html.replace(/<title>[\s\S]*?<\/title>/, "").replace(/<meta name="description"[^>]*>/, "");
  const out = f.run(input).html;
  assert.equal(getMetaContent(out, "name", "twitter:title"), null);
  assert.equal(getMetaContent(out, "name", "twitter:description"), null);
  const once = f.run().html; assert.equal(f.run(once).html, once); assert.equal(f.run(once).changed, false);
});
test("noindex and redirects keep their existing exclusion behavior", () => {
  const f = fixture();
  for (const extra of ['<meta name="robots" content="noindex, follow">', '<meta http-equiv="refresh" content="0;url=/other/">']) {
    const input = f.html.replace("</head>", extra + "</head>"); assert.equal(f.run(input).html, input);
  }
});
test("type-only mode does not expand into Twitter generation", () => {
  const f = fixture(); const input = f.html.replace('<meta property="og:type" content="website">', "");
  const out = applyFallbacks(input, f.file, { typeOnly: true, routeRecord: f.row }).html;
  assert.equal(getMetaContent(out, "name", "twitter:title"), null);
  assert.equal(getMetaContent(out, "name", "twitter:description"), null);
  assert.equal(out.replace('<meta property="og:type" content="website">\n', ""), input);
});
