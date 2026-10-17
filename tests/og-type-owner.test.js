"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");
const os = require("node:os");
const vm = require("node:vm");
const { createRequire } = require("node:module");
const { applyFallbacks, planOgTypeRepairs } = require("../scripts/apply-og-fallbacks");
const root = path.resolve(__dirname, "..");
const file = path.join(root, "cookies/index.html");
const record = { route: "/cookies/", state: "page", indexability: "indexable", pageType: "page", source: { file: "cookies/index.html" } };
const html = '<!doctype html><html lang="en"><head><title>Fees &amp; forms</title><meta name="description" content="Keep this description."><link rel="canonical" href="https://afrotools.com/cookies/"><meta property="og:image" content="/bespoke.png"><script type="application/ld+json">{"@type":"WebPage","name":"Original"}</script></head><body><h1>Unchanged</h1><p>Rates and translated copy stay exact.</p></body></html>';
const run = (input = html, row = record) => applyFallbacks(input, file, { typeOnly: true, routeRecord: row });
const added = '<meta property="og:type" content="website">\n';

test("type-only owner repairs a canonical public page with a one-tag byte inverse", () => {
  const result = run();
  assert.equal(result.changed, true);
  assert.equal(result.html.replace(added, ""), html);
  assert.equal((result.html.match(/og:type/g) || []).length, 1);
  assert.equal(run(result.html).html, result.html);
  assert.equal(run(result.html).changed, false);
  assert.equal(result.usedToolImage, false);
});

test("all reviewed non-article route classes receive website, not article", () => {
  for (const pageType of ["page", "country-tool", "category", "tool"]) {
    assert.ok(run(html, { ...record, pageType }).html.includes(added), pageType);
  }
});

test("existing property/name types and card choices stay byte-identical", () => {
  for (const tag of ['<meta property="og:type" content="article">', "<META content='video.movie' NAME = 'OG:TYPE'>", '<meta name=og:type content=website>', '<meta property="og:type" content="">']) {
    const input = html.replace("</head>", tag + "</head>");
    assert.equal(run(input).html, input);
  }
  const malformed = html.replace('{"@type":"WebPage","name":"Original"}', '{"broken":').replace("</head>", '<meta property="og:type" content="article"></head>');
  assert.equal(run(malformed).html, malformed, "existing type remains untouched even when other schema needs repair");
});

test("noindex from any crawler, redirects, private and unavailable records are excluded", () => {
  for (const tag of ['<meta name="robots" content="noindex, follow">', '<meta content="none" name="robots">', '<meta NAME = "googlebot" content="NOINDEX">', '<meta content="0;url=/other/" http-equiv = "refresh">']) {
    const input = html.replace("</head>", tag + "</head>");
    assert.equal(run(input).html, input);
  }
  for (const change of [{ state: "redirect" }, { indexability: "noindex" }, { localeCoverage: { state: "unavailable", indexableEligible: false } }, { route: "/auth/" }]) {
    assert.equal(run(html, { ...record, ...change }).html, html);
  }
});

test("missing, duplicate, foreign, non-self canonical or wrong physical owner cannot be promoted", () => {
  for (const input of [html.replace(/<link[^>]+>/, ""), html.replace("afrotools.com/cookies/", "example.org/cookies/"), html.replace("afrotools.com/cookies/", "afrotools.com/other/"), html.replace("</head>", '<link rel="canonical" href="https://afrotools.com/cookies/"></head>')]) {
    assert.equal(run(input).html, input);
  }
  assert.equal(run(html, { ...record, source: { file: "other/index.html" } }).html, html);
});

test("head parsing accepts casing and spacing while ignoring comments/script/body lookalikes", () => {
  const input = html.replace("</head>", '<!-- <meta name="og:type" content="article"> --><script>const x = \'<meta property="og:type" content="article">\';</script></HEAD>').replace('<body>', '<body><meta property="og:type" content="article">');
  const output = run(input).html;
  assert.equal(output.replace(added, ""), input);
  assert.ok(output.includes(added));
});

test("unreviewed classification or conflicting article semantics fails the entire plan before writes", () => {
  for (const bad of [{ ...record, pageType: "novel-product" }, { ...record, pageType: "article" }]) {
    assert.throws(() => run(html, bad), /classification review/i);
  }
  const article = html.replace('"WebPage"', '"NewsArticle"');
  assert.throws(() => run(article), /review|article/i);
  for (const type of ["TechArticle", "ScholarlyArticle", "MedicalScholarlyArticle", "https://schema.org/TechArticle", "http://schema.org/ScholarlyArticle", "schema:MedicalScholarlyArticle", "schema:APIReference", "LiveBlogPosting", "DiscussionForumPosting", "Report"]) {
    assert.throws(() => run(html.replace('"WebPage"', JSON.stringify(type))), /article semantics review/i, type);
  }
  const job = html.replace('"WebPage"', '"https://schema.org/JobPosting"');
  assert.equal(run(job).html.replace(added, ""), job, "JobPosting is not an Article conflict on an otherwise eligible page");
  assert.throws(() => run(html.replace('{"@type":"WebPage","name":"Original"}', '{"broken":')), /classification review.*malformed JSON-LD/i);
});

test("plan uses only eligible records, checks all inputs before returning exact pending writes", () => {
  const other = { ...record, route: "/terms/", source: { file: "terms/index.html" } };
  const planned = planOgTypeRepairs([record, { ...record, state: "redirect" }, other], row => row.source.file === "terms/index.html" ? html.replaceAll("/cookies/", "/terms/") : html);
  assert.equal(planned.length, 2);
  assert.deepEqual(planned.map(row => row.file), [file, path.join(root, "terms/index.html")]);
  assert.equal(planned[0].html.replace(added, ""), html);
  assert.equal(planOgTypeRepairs([record], () => planned[0].html).length, 0);
});

test("normal fallback owner with route context repairs type and retains its existing card behavior", () => {
  const result = applyFallbacks(html, file, { routeRecord: record });
  assert.ok(result.html.includes(added));
  assert.ok(result.html.includes('name="twitter:card"'));
  assert.equal(result.html.slice(result.html.indexOf("<body>")), html.slice(html.indexOf("<body>")));
  const article = html.replace("</head>", '<meta property="og:type" content="article"></head>');
  assert.equal((applyFallbacks(article, file, { routeRecord: { ...record, pageType: "article" } }).html.match(/og:type/g) || []).length, 1);
});

test("actual CLI check is read-only, writes are type-only and repeatable, unknowns abort before first write", () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "afrotools-og-owner-"));
  const owner = path.join(root, "scripts/apply-og-fallbacks.js");
  const code = fs.readFileSync(owner, "utf8");
  const target = path.join(temp, "cookies/index.html");
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, html);
  const invoke = (args, rows = [record]) => {
    const module = { exports: {} }, logs = [];
    const localRequire = createRequire(owner);
    const load = name => name === "./lib/route-contract" ? { buildRouteGraph: () => ({ routes: rows }) } : localRequire(name);
    load.main = module;
    const processBoundary = { argv: ["node", owner, ...args], pid: process.pid, exitCode: 0 };
    vm.runInNewContext(code, { require: load, module, __dirname: path.join(temp, "scripts"), process: processBoundary, console: { log: (...values) => logs.push(values.join(" ")), warn() {} }, URL }, { filename: owner });
    return { exit: processBoundary.exitCode, logs };
  };
  try {
    assert.equal(invoke(["--type-only", "--check"]).exit, 1);
    assert.equal(fs.readFileSync(target, "utf8"), html);
    assert.equal(invoke(["--type-only"]).exit, 0);
    const after = fs.readFileSync(target, "utf8");
    assert.equal(after.replace(added, ""), html);
    assert.equal(invoke(["--type-only", "--check"]).exit, 0);
    invoke(["--type-only"]);
    assert.equal(fs.readFileSync(target, "utf8"), after);
    fs.writeFileSync(target, html);
    fs.mkdirSync(path.join(temp, "terms"));
    fs.writeFileSync(path.join(temp, "terms/index.html"), html.replaceAll("/cookies/", "/terms/"));
    const bad = { ...record, route: "/terms/", pageType: "unknown", source: { file: "terms/index.html" } };
    assert.throws(() => invoke(["--type-only"], [record, bad]), /classification review/);
    assert.equal(fs.readFileSync(target, "utf8"), html, "no earlier valid output was written before the late guard failure");
    const malformedSchema = html.replaceAll("/cookies/", "/terms/").replace('{"@type":"WebPage","name":"Original"}', '{"broken":');
    fs.writeFileSync(path.join(temp, "terms/index.html"), malformedSchema);
    assert.throws(() => invoke(["--type-only"], [record, { ...bad, pageType: "page" }]), /classification review.*malformed JSON-LD/i);
    assert.equal(fs.readFileSync(target, "utf8"), html, "late malformed JSON-LD must abort before the first otherwise-valid write");
    assert.equal(fs.readFileSync(path.join(temp, "terms/index.html"), "utf8"), malformedSchema);
    assert.throws(() => invoke(["--typo"]), /Usage/);
  } finally {
    assert.ok(path.resolve(temp).startsWith(path.resolve(os.tmpdir()) + path.sep));
    fs.rmSync(temp, { recursive: true });
  }
});
