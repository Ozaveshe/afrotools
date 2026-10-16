"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const cp = require("node:child_process");
const crypto = require("node:crypto");
const { RELATED_IDS, FRENCH_SOLAR_FILE, localizeFrenchSolarRelatedTools } = require("../scripts/lib/french-solar-related-tools");
const { findFrenchEnergyApp } = require("../scripts/lib/french-energy-parity-contract");
const ROOT = path.resolve(__dirname, "..");
const read = file => fs.readFileSync(path.join(ROOT, file), "utf8");
const host = html => html.match(/<afro-related-tools\b[^>]*>[\s\S]*?<\/afro-related-tools>/i)?.[0] || "";
const links = html => [...host(html).matchAll(/<a\b[^>]*>[\s\S]*?<\/a>/gi)].map(match => match[0]);
const escape = value => value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
const hash = bytes => crypto.createHash("sha256").update(bytes).digest("hex");
// The parent French clone has no host. Recreate the observed inherited SSR
// state from the actual English native host, using the old French-prefix
// rewrite, without importing an arbitrary generated fixture.
const englishPage = read("tools/solar-roi/index.html");
const inheritedHost = host(englishPage).replace(/href="\/tools\//g, 'href="/fr/tools/')
  .replace(/Related tools/g, "Outils associés");
const componentTag = englishPage.match(/<script\b[^>]*src="[^\"]*related-tools\.min\.js[^\"]*"[^>]*><\/script>/)[0];
const baseline = read(FRENCH_SOLAR_FILE).replace(/<afro-related-tools\b[^>]*>[\s\S]*?<\/afro-related-tools>/gi, "")
  .replace(/<script\b[^>]*src="[^\"]*related-tools\.min\.js[^\"]*"[^>]*><\/script>/gi, "")
  .replace("</body>", inheritedHost + "\n" + componentTag + "\n</body>");

function assertFrench(html) {
  const anchors = links(html);
  assert.equal(anchors.length, 6);
  assert.deepEqual(anchors.map(anchor => anchor.match(/data-id="([^"]+)"/)[1]), RELATED_IDS);
  for (let i = 0; i < anchors.length; i++) {
    const app = findFrenchEnergyApp(RELATED_IDS[i]), anchor = anchors[i];
    assert.ok(anchor.includes('href="' + app.frRoute + '"'), app.id + " exact canonical destination");
    assert.ok(anchor.includes('data-name="' + escape(app.title) + '"'), app.id + " hydrated accessible name");
    assert.ok(anchor.includes('data-desc="' + escape(app.description) + '"'), app.id + " owned French description");
    assert.ok(anchor.endsWith(">" + escape(app.title) + "</a>"), app.id + " static visible name");
    const destination = read(app.frRoute.slice(1) + "index.html");
    assert.ok(destination.includes("<h1>" + app.title + "</h1>"));
    assert.ok(destination.includes('rel="canonical" href="https://afrotools.com' + app.frRoute + '"'));
  }
}

test("existing French Solar SSR uses six owned French names, descriptions and real canonical destinations", () => {
  const after = localizeFrenchSolarRelatedTools(baseline);
  assertFrench(after);
  assert.equal(after.replace(host(after), "PANEL"), baseline.replace(host(baseline), "PANEL"), "all bytes outside host including scripts unchanged");
  const old = links(baseline), next = links(after);
  for (let i = 0; i < old.length; i++) {
    const structural = anchor => anchor.replace(/\bhref="[^"]*"|\bdata-name="[^"]*"|\bdata-desc="[^"]*"/g, "FIELD").replace(/>[^<]*<\/a>$/, ">TEXT</a>");
    assert.equal(structural(next[i]), structural(old[i]), "IDs, category, icon, attribute order and structure retained");
  }
  assert.equal(localizeFrenchSolarRelatedTools(after), after);
});

test("unrelated locales, canonical pages, displayed code and absent hosts remain untouched", () => {
  for (const html of [baseline.replace('lang="fr"', 'lang="en"'), baseline.replace(/(<link\b[^>]*rel="canonical"[^>]*href=")[^"]+/, '$1https://afrotools.com/fr/tools/other/'), baseline.replace(host(baseline), ""), '<html lang="fr"><pre>' + host(baseline) + '</pre></html>']) {
    assert.equal(localizeFrenchSolarRelatedTools(html), html);
  }
  const displayed = baseline.replace(host(baseline), "<pre>" + host(baseline) + "</pre>");
  assert.equal(localizeFrenchSolarRelatedTools(displayed), displayed, "real French canonical does not authorize displayed code edits");
});

test("unknown, duplicate, malformed and unexpected destinations fail before returning a partial panel", () => {
  const panel = host(baseline), first = links(baseline)[0];
  for (const changed of [
    panel.replace('data-id="generator-fuel"', 'data-id="unknown-tool"'), panel.replace(links(baseline)[1], first),
    panel.replace('href="/fr/tools/generator-fuel/"', 'href="/fr/tools/unreviewed/"'),
    panel.replace(first, ""), panel.replace('data-name="Generator Fuel Cost Calculator"', ""),
    panel + panel, panel.replace("</afro-related-tools>", "<script>doNotChange()</script></afro-related-tools>"),
  ]) {
    assert.notEqual(changed, panel, "negative control changes its actual panel input");
    assert.throws(() => localizeFrenchSolarRelatedTools(baseline.replace(panel, () => changed)), /French Solar/);
  }
});

const SUPPORT = [
  "scripts/inject-internal-links.js", "scripts/lib/french-solar-related-tools.js", "scripts/lib/french-energy-parity-contract.js",
  "scripts/lib/canonical-aliases.js", "scripts/lib/safe-write.js", "scripts/repair-french-navigation-links.js",
  "scripts/fix-canonical-alias-links.js", "scripts/update-html-canonical-redirects.js", "scripts/lib/route-contract.js",
  "scripts/lib/localization-platform.js", "scripts/lib/static-owner-policy.js", "data/tool-directory.json",
  "data/registry/route-policy.json", "data/registry/locale-manifest.json", "data/registry/locale-coverage-policy.json",
  "data/registry/yoruba-route-manifest.json", "data/registry/countries.json", "assets/js/components/related-tools.min.js",
  "_redirects", "netlify.toml", "tools/solar-roi/index.html", "tools/africa-conflict/conflicts.html",
  "fr/cape-verde/cv-paye.html", "fr/cape-verde/cv-vat.html", "fr/cote-divoire/ci-paye.html",
  "fr/eq-guinea/gq-paye.html", "fr/eq-guinea/gq-vat.html",
];

function fixture(t, html) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "afrotools-fr-solar-related-"));
  t.after(() => {
    assert.equal(path.dirname(path.resolve(dir)), path.resolve(os.tmpdir()));
    assert.ok(path.basename(dir).startsWith("afrotools-fr-solar-related-"));
    fs.rmSync(dir, { recursive: true, force: true });
  });
  function write(file, bytes) { fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true }); fs.writeFileSync(path.join(dir, file), bytes); }
  for (const file of SUPPORT) write(file, fs.readFileSync(path.join(ROOT, file)));
  for (const id of RELATED_IDS) {
    const file = findFrenchEnergyApp(id).frRoute.slice(1) + "index.html";
    write(file, fs.readFileSync(path.join(ROOT, file)));
  }
  for (const locale of ["sw", "ha", "yo"]) write(locale + "/index.html", '<!doctype html><html lang="' + locale + '"><head><link rel="canonical" href="https://afrotools.com/' + locale + '/"></head><body><p>Unchanged control</p></body></html>');
  write(FRENCH_SOLAR_FILE, html);
  return { dir, write, read: file => fs.readFileSync(path.join(dir, file), "utf8") };
}

function cli(context, script, args = []) {
  const result = cp.spawnSync(process.execPath, [path.join(context.dir, script), ...args], { cwd: context.dir, encoding: "utf8", timeout: 15000, maxBuffer: 1024 * 1024 });
  assert.equal(result.error, undefined, String(result.error));
  return result;
}

test("actual late native CLI restores an absent early host and survives real later navigation/canonical owners", t => {
  const context = fixture(t, baseline.replace(host(baseline), "").replace(/<script\b[^>]*src="[^\"]*related-tools\.min\.js[^\"]*"[^>]*><\/script>/, ""));
  const args = ["--related-only", "--files=" + FRENCH_SOLAR_FILE];
  assert.equal(cli(context, "scripts/inject-internal-links.js", [...args, "--check-related"]).status, 1, "missing early host is stale");
  const controls = ["tools/solar-roi/index.html", "sw/index.html", "ha/index.html", "yo/index.html", ...RELATED_IDS.map(id => findFrenchEnergyApp(id).frRoute.slice(1) + "index.html")];
  const before = controls.map(file => hash(context.read(file)));
  assert.equal(cli(context, "scripts/inject-internal-links.js", args).status, 0);
  assertFrench(context.read(FRENCH_SOLAR_FILE));
  const projected = context.read(FRENCH_SOLAR_FILE);
  assert.equal(cli(context, "scripts/inject-internal-links.js", args).status, 0);
  assert.equal(context.read(FRENCH_SOLAR_FILE), projected, "late native projection idempotent");
  assert.equal(cli(context, "scripts/inject-internal-links.js", [...args, "--check-related"]).status, 0);
  for (const [script, options] of [["scripts/repair-french-navigation-links.js", ["--write"]], ["scripts/fix-canonical-alias-links.js", []], ["scripts/update-html-canonical-redirects.js", []]]) {
    const result = cli(context, script, options);
    assert.equal(result.status, 0, script + "\n" + result.stderr);
    assert.equal(host(context.read(FRENCH_SOLAR_FILE)), host(projected), script + " preserves exact six localized cards");
  }
  assert.deepEqual(controls.map(file => hash(context.read(file))), before, "no other locale/destination/page changes");
});

test("actual late CLI replaces old English SSR and leaves all controller/module bytes intact", t => {
  const context = fixture(t, baseline);
  const result = cli(context, "scripts/inject-internal-links.js", ["--related-only", "--files=" + FRENCH_SOLAR_FILE]);
  assert.equal(result.status, 0, result.stderr);
  const after = context.read(FRENCH_SOLAR_FILE);
  assertFrench(after);
  assert.equal(after.replace(host(after), "PANEL"), baseline.replace(host(baseline), "PANEL"), "outside-host/controller/module bytes exact");
});

test("actual CLI honors manual navigation and a different selected file without touching French Solar", t => {
  const manual = baseline.replace("<body", '<body data-related-tools="manual"');
  const context = fixture(t, manual);
  assert.equal(cli(context, "scripts/inject-internal-links.js", ["--related-only", "--files=" + FRENCH_SOLAR_FILE]).status, 0);
  assert.equal(context.read(FRENCH_SOLAR_FILE), manual);
  assert.equal(cli(context, "scripts/inject-internal-links.js", ["--related-only", "--files=tools/solar-roi/index.html"]).status, 0);
  assert.equal(context.read(FRENCH_SOLAR_FILE), manual);
});

test("default native owner changes only French Solar and refuses protected-host content without writing it", t => {
  const context = fixture(t, baseline);
  const controls = SUPPORT.filter(file => file.endsWith(".html")).concat(["sw/index.html", "ha/index.html", "yo/index.html", ...RELATED_IDS.map(id => findFrenchEnergyApp(id).frRoute.slice(1) + "index.html")]);
  const before = controls.map(file => hash(context.read(file)));
  const result = cli(context, "scripts/inject-internal-links.js");
  assert.equal(result.status, 0, result.stderr);
  assertFrench(context.read(FRENCH_SOLAR_FILE));
  assert.deepEqual(controls.map(file => hash(context.read(file))), before, "default native pass leaves other pages exact");
  assert.equal(hash(context.read("assets/js/components/related-tools.min.js")), hash(read("assets/js/components/related-tools.min.js")));
  const protectedPage = baseline.replace(host(baseline), "<pre>" + host(baseline) + "</pre>");
  context.write(FRENCH_SOLAR_FILE, protectedPage);
  const rejected = cli(context, "scripts/inject-internal-links.js", ["--related-only", "--files=" + FRENCH_SOLAR_FILE]);
  assert.equal(rejected.status, 1);
  assert.match(rejected.stderr, /protected content requires review/);
  assert.equal(context.read(FRENCH_SOLAR_FILE), protectedPage);
});
