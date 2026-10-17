"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("node:child_process");

const ROOT = path.resolve(__dirname, "..");

function assertBlogFallbackLabels() {
  const temporary = fs.mkdtempSync(path.join(require("node:os").tmpdir(), "afrotools-blog-labels-"));
  const write = (relative, text) => { const file = path.join(temporary, relative); fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, text); };
  try {
    for (const relative of ["scripts/retire-french-english-iframe-routes.js", "scripts/lib/safe-write.js", "data/registry/route-policy.json"]) write(relative, fs.readFileSync(path.join(ROOT, relative)));
    const paragraph = "<p>Contenu disponible en anglais — traduction à venir.</p>";
    const wrapper = (slug) => `<html lang="fr"><head><meta name="robots" content="noindex, follow"><meta name="afrotools-localization-state" content="english-fallback-noindex"><link rel="canonical" href="https://afrotools.com/blog/${slug}/"><meta property="og:url" content="https://afrotools.com/blog/${slug}/"></head><body>${paragraph}<iframe src="/blog/${slug}/" title="Sujet du guide" loading="lazy" sandbox="allow-scripts allow-same-origin allow-popups"></iframe><p class="fr-note"><a href="/blog/${slug}/">Lire la version originale en anglais</a></p></body></html>`;
    for (const [slug, language] of [["french", "fr"], ["swahili", "sw"], ["english", "en"], ["unknown", ""]]) {
      write(`blog/${slug}/index.html`, `<html${language ? ` lang="${language}"` : ""}><head></head><body>Source inchangée</body></html>`);
      write(`fr/blog/${slug}/index.html`, wrapper(slug));
    }
    const neutral = wrapper("french").replace(paragraph, "<p>Article complet</p>").replace("Lire la version originale en anglais", "Ouvrir l’article source");
    write("fr/blog/neutral/index.html", neutral);
    write("fr/tools/control/index.html", wrapper("french"));
    write("_redirects", "Unrelated redirects remain unchanged\n");
    write("reports/french-english-iframe-retirement.json", "{\"sentinel\":true}\n");
    const fixtureOwner = require(path.join(temporary, "scripts/retire-french-english-iframe-routes.js"));
    const projected = fixtureOwner.retireWrapper(wrapper("french"), "/blog/french/", { blogFallback: true });
    assert.ok(projected.includes("Article disponible en français sur la page source."), "actual retirement transform must correct the target-language claim");
    const command = (mode) => execFileSync(process.execPath, [path.join(temporary, "scripts/retire-french-english-iframe-routes.js"), mode, "--blog-labels-only"], { encoding: "utf8", timeout: 10000, stdio: "pipe" });
    const snapshot = (directory, result = new Map()) => {
      for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const file = path.join(directory, entry.name);
        if (entry.isDirectory()) snapshot(file, result); else result.set(path.relative(temporary, file).replace(/\\/g, "/"), fs.readFileSync(file));
      }
      return result;
    };
    const before = snapshot(temporary);
    assert.throws(() => command("--check"), /STALE fr\/blog\/french\/index.html/);
    assert.deepStrictEqual(snapshot(temporary), before, "check must not write");
    command("--write");
    const after = snapshot(temporary);
    for (const [slug, language, label] of [["french", "fr", "français"], ["swahili", "sw", "swahili"], ["unknown", "", ""]]) {
      const expected = wrapper(slug).replace(paragraph, language ? `<p>Article disponible en ${label} sur la page source.</p>` : "<p>Consultez la page source pour lire l’article.</p>")
        .replace(`<a href="/blog/${slug}/">Lire la version originale en anglais</a>`, `<a href="/blog/${slug}/"${language ? ` hreflang="${language}"` : ""}>${language ? `Lire l’article source en ${label}` : "Ouvrir l’article source"}</a>`);
      assert.strictEqual(after.get(`fr/blog/${slug}/index.html`).toString(), expected, `${slug}: exact two-node/attribute delta only`);
      after.set(`fr/blog/${slug}/index.html`, before.get(`fr/blog/${slug}/index.html`));
    }
    assert.deepStrictEqual(after, before, "English/neutral/non-blog/target/report/redirect bytes remain unchanged");
    command("--check");
    const once = snapshot(temporary); command("--write");
    assert.deepStrictEqual(snapshot(temporary), once, "second write is idempotent");
    for (const [label, bad] of [
      ["duplicate label", wrapper("french").replace(paragraph, paragraph + paragraph)],
      ["duplicate iframe", wrapper("french").replace("</body>", '<iframe src="/blog/french/"></iframe></body>')],
      ["unsafe remote", wrapper("french").replaceAll("/blog/french/", "https://example.invalid/article/")],
      ["unsafe traversal", wrapper("french").replaceAll("/blog/french/", "/blog/../french/")],
      ["missing target", wrapper("missing")],
      ["mismatched link", wrapper("french").replace('<a href="/blog/french/"', '<a href="/blog/english/"')]
    ]) {
      write("fr/blog/aaa-pending/index.html", wrapper("french"));
      write("fr/blog/zzz-invalid/index.html", bad);
      const frozen = snapshot(temporary);
      assert.throws(() => command("--write"), /Blog fallback labels:/, label);
      assert.deepStrictEqual(snapshot(temporary), frozen, `${label}: whole batch validates before any write`);
    }
    assert.throws(() => fixtureOwner.parseArgs(["--write", "--blog-labels-only", "--country-prefill-only"]), /cannot be combined/);
    console.log("French blog fallback label lifecycle passed (target-language projection, read-only check, idempotence and 6 whole-batch rejection controls).");
  } finally {
    assert.strictEqual(path.dirname(temporary), path.resolve(require("node:os").tmpdir()));
    fs.rmSync(temporary, { recursive: true, force: true });
  }
}

assertBlogFallbackLabels();
if (process.argv.includes("--blog-labels-only")) process.exit(0);
const retirement = require("../scripts/retire-french-english-iframe-routes");
const routeApi = require("../scripts/lib/route-contract");
const result = retirement.buildChanges();
assert.strictEqual(result.changes.size, 0, "French English-iframe retirement outputs must be current");
assert.ok(result.report.wrapperPages >= 379, "the frozen French iframe denominator must remain governed by the retirement policy");

const agricultureCount = Object.entries(result.report.byFamily)
  .filter(([family]) => family.startsWith("agriculture/"))
  .reduce((sum, [, count]) => sum + count, 0);
assert.strictEqual(agricultureCount, 192, "all 192 French agriculture country wrappers must consolidate into native owners");

for (const row of result.report.routes) {
  const html = fs.readFileSync(path.join(ROOT, row.sourceFile), "utf8");
  assert.match(html, /<meta\s+name="robots"\s+content="noindex, follow">/i, `${row.route} must be noindex`);
  assert.match(html, /<meta\s+name="afrotools-localization-state"\s+content="english-fallback-noindex">/i, `${row.route} must declare its fallback state`);
  assert.doesNotMatch(html, /<link\b[^>]*\brel=["']alternate["'][^>]*\bhreflang=/i, `${row.route} must not advertise false locale equivalence`);
  assert.ok(html.includes(`<link rel="canonical" href="https://afrotools.com${row.canonical}">`), `${row.route} must retain its consolidated canonical owner`);
  assert.ok(html.includes(`<meta property="og:url" content="https://afrotools.com${row.canonical}">`), `${row.route} OG URL must match the consolidated canonical owner`);
}

assert.strictEqual(
  retirement.canonicalFor(path.join(ROOT, "fr", "api", "pricing.html"), "/api/pricing.html"),
  "/api/pricing",
  "generic iframe wrappers must inherit the English owner's preferred canonical instead of the iframe file path"
);
assert.match(
  fs.readFileSync(path.join(ROOT, "agriculture", "crop-insurance", "index.html"), "utf8"),
  /hreflang="fr" href="https:\/\/afrotools\.com\/fr\/agriculture\/crop-insurance\/"/,
  "retiring country wrappers must not remove the native French hub from its valid reciprocal group"
);

const graph = routeApi.buildRouteGraph();
const remaining = graph.routes.filter((record) => {
  if (record.locale !== "fr" || record.state !== "page" || record.indexability !== "indexable") return false;
  const html = fs.readFileSync(path.join(ROOT, record.source.file), "utf8");
  return Boolean(retirement.iframeSource(html));
});
assert.deepStrictEqual(remaining.map((row) => row.route), [], "no indexable French route may visibly wrap an English workflow");

for (const [slug, selector] of [
  ["crop-insurance", "country"],
  ["export-docs", "country"],
  ["poultry-roi", "countryCode"],
  ["vaccination-schedule", "country"]
]) {
  const file = path.join(ROOT, "fr", "agriculture", slug, "index.html");
  const html = fs.readFileSync(file, "utf8");
  assert.doesNotMatch(html, /<iframe\b/i, `${slug} must remain a native French workflow`);
  assert.match(html, new RegExp(`id=["']${selector}["']`), `${slug} must retain a country selector`);
  assert.match(html, /\/assets\/js\/pages\/fr-agriculture-country-preset\.js/, `${slug} must preserve redirected country context`);
}

const redirects = fs.readFileSync(path.join(ROOT, "_redirects"), "utf8");
assert.match(redirects, /# BEGIN FRENCH ENGLISH-IFRAME RETIREMENT/);
for (const alias of retirement.loadCountryAliases()) {
  for (const sourcePath of [`/${alias.sourceFile}`, `/${alias.sourceFile.replace(/\.html$/, "")}`, `/${alias.sourceFile.replace(/\.html$/, "/")}`]) {
    assert.ok(redirects.includes(`${sourcePath}  ${alias.canonicalHub}?country=${alias.countrySlug}  301!`));
  }
}
assert.strictEqual(result.report.countryPrefillAliases.length, 138);
assert.strictEqual(result.report.countryPrefillAliases.flatMap(alias => alias.variants).length, 414);
assert.strictEqual(result.report.agricultureRedirectRules, 429);
assert.match(redirects, /\/fr\/agriculture\/harvest-date\/:country\s+\/fr\/agriculture\/harvest-date\/\s+301!/);

console.log(`French English-iframe retirement tests passed (${result.report.wrapperPages} governed wrappers).`);
execFileSync(process.execPath, [path.join(ROOT, "tests/french-agriculture-literal-country-redirects.test.mjs")], { stdio: "inherit" });
