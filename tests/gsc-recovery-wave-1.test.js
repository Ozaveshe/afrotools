"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "..");
const priority = require("../data/seo/priority-pages.json");
const releaseRegistry = require("../data/seo/gsc-recovery-waves.json");

const routes = {
  "/tools/amount-words-gh/": {
    file: "tools/amount-words-gh/index.html",
    hreflang: {
      en: "https://afrotools.com/tools/amount-words-gh/",
      fr: "https://afrotools.com/fr/tools/montant-lettres-gh/",
      sw: "https://afrotools.com/sw/zana/kiasi-kwa-maneno-ghana/",
      "x-default": "https://afrotools.com/tools/amount-words-gh/"
    }
  },
  "/blog/ghana-cedi-words/": {
    file: "blog/ghana-cedi-words/index.html",
    hreflang: {
      en: "https://afrotools.com/blog/ghana-cedi-words/",
      fr: "https://afrotools.com/fr/blog/ghana-cedi-words/",
      "x-default": "https://afrotools.com/blog/ghana-cedi-words/"
    }
  },
  "/tools/naira-to-words/": {
    file: "tools/naira-to-words/index.html",
    hreflang: {
      en: "https://afrotools.com/tools/naira-to-words/",
      fr: "https://afrotools.com/fr/tools/naira-en-lettres/",
      ha: "https://afrotools.com/ha/kayan-aiki/naira-zuwa-kalmomi/",
      "x-default": "https://afrotools.com/tools/naira-to-words/"
    }
  },
  "/tools/market-days/": {
    file: "tools/market-days/index.html",
    hreflang: {
      en: "https://afrotools.com/tools/market-days/",
      fr: "https://afrotools.com/fr/tools/jours-marche/",
      "x-default": "https://afrotools.com/tools/market-days/"
    }
  },
  "/blog/igbo-market-days/": {
    file: "blog/igbo-market-days/index.html",
    hreflang: {
      en: "https://afrotools.com/blog/igbo-market-days/",
      fr: "https://afrotools.com/fr/blog/igbo-market-days/",
      "x-default": "https://afrotools.com/blog/igbo-market-days/"
    }
  },
  "/tools/waec-calculator/": {
    file: "tools/waec-calculator/index.html",
    hreflang: {
      en: "https://afrotools.com/tools/waec-calculator/",
      fr: "https://afrotools.com/fr/tools/calculateur-waec/",
      sw: "https://afrotools.com/sw/zana/kikokotoo-waec-neco/",
      ha: "https://afrotools.com/ha/kayan-aiki/kalkuletan-waec-neco/",
      "x-default": "https://afrotools.com/tools/waec-calculator/"
    }
  },
  "/blog/waec-result-guide-2026/": {
    file: "blog/waec-result-guide-2026/index.html",
    hreflang: {
      en: "https://afrotools.com/blog/waec-result-guide-2026/",
      fr: "https://afrotools.com/fr/blog/waec-result-guide-2026/",
      "x-default": "https://afrotools.com/blog/waec-result-guide-2026/"
    }
  }
};

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

function decodeHtml(value) {
  return String(value || "")
    .replace(/&#(\d+);/g, function (_, code) { return String.fromCodePoint(Number(code)); })
    .replace(/&#x([0-9a-f]+);/gi, function (_, code) { return String.fromCodePoint(parseInt(code, 16)); })
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&apos;|&#39;/g, "'")
    .replace(/&ndash;|&mdash;/g, "-")
    .replace(/&rsquo;|&lsquo;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function normalize(value) {
  return decodeHtml(value).replace(/\s+/g, " ").trim();
}

function visibleText(html) {
  return normalize(
    html
      .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
      .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
  );
}

function firstMatch(html, pattern, label) {
  const match = html.match(pattern);
  assert.ok(match, "missing " + label);
  return normalize(match[1]);
}

function jsonLd(html) {
  return Array.from(html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)).map(function (match) {
    return JSON.parse(match[1]);
  });
}

function localPathExists(href) {
  const clean = href.split("#")[0].split("?")[0];
  if (!clean || !clean.startsWith("/") || clean.startsWith("/api/")) return true;
  const relative = clean.replace(/^\/+/, "");
  const candidates = [];
  if (clean.endsWith("/")) candidates.push(path.join(ROOT, relative, "index.html"));
  else {
    candidates.push(path.join(ROOT, relative));
    candidates.push(path.join(ROOT, relative + ".html"));
    candidates.push(path.join(ROOT, relative, "index.html"));
  }
  return candidates.some(fs.existsSync);
}

test("priority config owns all seven Wave 1 routes", function () {
  assert.deepEqual(Object.keys(routes).filter(function (route) { return !priority.pages[route]; }), []);
  assert.equal(priority.updatedAt, "2026-08-13");
  assert.deepEqual(Object.keys(priority.clusters).filter(function (key) {
    return ["amount-in-words", "igbo-market-days", "waec-grading"].includes(key);
  }).sort(), ["amount-in-words", "igbo-market-days", "waec-grading"]);
});

test("tool and guide pairs have unique intent-specific title, description, and H1", function () {
  const pairs = [
    ["/tools/amount-words-gh/", "/blog/ghana-cedi-words/"],
    ["/tools/market-days/", "/blog/igbo-market-days/"],
    ["/tools/waec-calculator/", "/blog/waec-result-guide-2026/"]
  ];
  pairs.forEach(function (pair) {
    const values = pair.map(function (route) {
      const html = read(routes[route].file);
      return {
        title: firstMatch(html, /<title>([\s\S]*?)<\/title>/i, route + " title"),
        description: firstMatch(html, /<meta\s+name="description"\s+content="([^"]*)"/i, route + " description"),
        h1: firstMatch(html, /<h1\b[^>]*>([\s\S]*?)<\/h1>/i, route + " H1").replace(/<[^>]+>/g, " ")
      };
    });
    assert.notEqual(values[0].title, values[1].title, pair.join(" vs ") + " title overlap");
    assert.notEqual(values[0].description, values[1].description, pair.join(" vs ") + " description overlap");
    assert.notEqual(normalize(values[0].h1), normalize(values[1].h1), pair.join(" vs ") + " H1 overlap");
  });

  const naira = read(routes["/tools/naira-to-words/"].file);
  assert.match(firstMatch(naira, /<title>([\s\S]*?)<\/title>/i, "Naira title"), /Naira to Words Converter/i);
});

test("canonicals and hreflang relationships are preserved", function () {
  Object.entries(routes).forEach(function ([route, details]) {
    const html = read(details.file);
    assert.equal(
      firstMatch(html, /<link\s+rel="canonical"\s+href="([^"]+)"/i, route + " canonical"),
      "https://afrotools.com" + route
    );
    const actual = {};
    for (const match of html.matchAll(/<link\s+rel="alternate"\s+hreflang="([^"]+)"\s+href="([^"]+)"/gi)) {
      actual[match[1]] = match[2];
    }
    assert.deepEqual(actual, details.hreflang, route + " hreflang changed");
  });
});

test("JSON-LD parses and FAQ schema is visible on each page", function () {
  Object.entries(routes).forEach(function ([route, details]) {
    const html = read(details.file);
    const schemas = jsonLd(html);
    assert.ok(schemas.length, route + " has no JSON-LD");
    const visible = visibleText(html);
    const comparableVisible = visible.replace(/["']/g, "");
    schemas.filter(function (schema) { return schema["@type"] === "FAQPage"; }).forEach(function (schema) {
      schema.mainEntity.forEach(function (item) {
        assert.ok(comparableVisible.includes(normalize(item.name).replace(/["']/g, "")), route + " hides FAQ question: " + item.name);
        assert.ok(comparableVisible.includes(normalize(item.acceptedAnswer.text).replace(/["']/g, "")), route + " hides FAQ answer: " + item.name);
      });
    });
  });
});

test("static quick answers, tables, and reciprocal links are crawlable", function () {
  Object.values(routes).forEach(function (details) {
    const html = read(details.file);
    assert.equal((html.match(/seo-quick-answer-block:start/g) || []).length, 1, details.file + " quick-answer marker");
    assert.ok(html.indexOf("seo-quick-answer-block:start") < html.indexOf("seo-cluster-block:start"), details.file + " answer is not before link cluster");
  });

  const ghTool = read(routes["/tools/amount-words-gh/"].file);
  const ghGuide = read(routes["/blog/ghana-cedi-words/"].file);
  const naira = read(routes["/tools/naira-to-words/"].file);
  assert.match(ghTool, /GHS 10,000[\s\S]*Ghana Cedis Ten Thousand Only/);
  assert.match(ghGuide, /GHS 1,000,000,000[\s\S]*Ghana Cedis One Billion Only/);
  assert.match(naira, /NGN 10,000[\s\S]*Ten Thousand Naira Only/);
  assert.match(ghTool, /href="\/blog\/ghana-cedi-words\/"/);
  assert.match(ghGuide, /href="\/tools\/amount-words-gh\/"/);

  const marketTool = read(routes["/tools/market-days/"].file);
  const marketGuide = read(routes["/blog/igbo-market-days/"].file);
  assert.match(marketTool, /What Igbo market day is today\?/i);
  assert.doesNotMatch(firstMatch(marketTool, /<meta\s+name="description"\s+content="([^"]*)"/i, "market description"), /today is (Eke|Orie|Afor|Nkwo)/i);
  assert.match(marketTool, /href="\/blog\/igbo-market-days\/"/);
  assert.match(marketGuide, /href="\/tools\/market-days\/"/);

  const waecTool = read(routes["/tools/waec-calculator/"].file);
  const waecGuide = read(routes["/blog/waec-result-guide-2026/"].file);
  assert.match(waecTool, /id="subjectsContainer"/);
  assert.match(waecTool, /href="\/blog\/waec-result-guide-2026\/"/);
  assert.match(waecGuide, /WAEC A1-F9 grade table/);
  assert.match(waecGuide, /href="\/tools\/waec-calculator\/"/);
  assert.doesNotMatch(waecGuide, /Approx\. Aggregate Cutoff|results are expected around|typically require a minimum JAMB score/i);
});

test("configured internal links and target-page assets resolve locally", function () {
  Object.keys(routes).forEach(function (route) {
    const page = priority.pages[route];
    const cluster = priority.clusters[page.cluster];
    const links = []
      .concat(page.relatedTools || cluster.relatedTools || [])
      .concat(page.relatedGuides || cluster.relatedGuides || [])
      .concat(page.primaryCta || cluster.primaryCta || []);
    links.forEach(function (item) {
      if (item && item.href) assert.ok(localPathExists(item.href), route + " broken configured link: " + item.href);
    });

    const html = read(routes[route].file);
    for (const match of html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/gi)) {
      assert.ok(localPathExists(match[1]), route + " broken asset: " + match[1]);
    }
  });
});

test("amount conversion behavior is preserved", function () {
  const gh = read("tools/amount-words-gh/index.html");
  const ghPure = gh.slice(gh.indexOf("const ones ="), gh.indexOf("function escapeHtml"));
  const ghSandbox = {};
  vm.runInNewContext(ghPure + "; result = { numWords, amountToWords };", ghSandbox);
  assert.equal(ghSandbox.result.amountToWords(10000), "Ghana Cedis Ten Thousand Only");
  assert.equal(ghSandbox.result.amountToWords(12500.75), "Ghana Cedis Twelve Thousand Five Hundred and Pesewas Seventy-Five Only");
  assert.equal(ghSandbox.result.amountToWords(0), "Zero Ghana Cedis Only");

  const ngn = read("tools/naira-to-words/index.html");
  const ngnPure = ngn.slice(ngn.indexOf("var ones ="), ngn.indexOf("function applyCaseMode"));
  const ngnSandbox = {};
  vm.runInNewContext(ngnPure + "; result = { numToWords, amountToWords };", ngnSandbox);
  const option = { dataset: { main: "Naira", sub: "Kobo" } };
  assert.equal(ngnSandbox.result.amountToWords(10000, option), "Ten Thousand Naira Only");
  assert.equal(ngnSandbox.result.amountToWords(50000.75, option), "Fifty Thousand Naira and Seventy-Five Kobo Only");
});

test("Igbo market-day engine and timezone behavior are preserved", function () {
  const source = read("assets/js/engines/igbo-market-days.js");
  const sandbox = {window: {AfroTools: {engines: {}}}, Intl, Date, Math, RegExp, Number, String, Object, Array, console};
  vm.runInNewContext(source, sandbox, {filename: "igbo-market-days.js"});
  const engine = sandbox.window.AfroTools.engines.igboMarketDays;
  assert.equal(engine.getMarketDay("2026-01-01").name, "Orie");
  assert.equal(engine.getMarketDay("2026-04-17").name, "Nkwo");
  assert.equal(engine.getTodayDateKey("Africa/Lagos", new Date("2026-04-16T23:30:00Z")), "2026-04-17");
  assert.equal(engine.getTodayDateKey("America/New_York", new Date("2026-04-16T23:30:00Z")), "2026-04-16");
});

test("Wave 1 adds no amount-specific routes and records a deployment anchor", function () {
  const toolDirs = fs.readdirSync(path.join(ROOT, "tools"), {withFileTypes: true})
    .filter(function (entry) { return entry.isDirectory(); })
    .map(function (entry) { return entry.name; });
  assert.deepEqual(toolDirs.filter(function (name) {
    return /^(?:amount-words-gh|naira-to-words)-\d/.test(name);
  }), []);
  assert.deepEqual(Object.keys(priority.pages).filter(function (route) {
    return /^\/tools\/(?:amount-words-gh|naira-to-words)-\d/.test(route);
  }), []);

  const wave = releaseRegistry.waves.find(function (entry) { return entry.id === "gsc-recovery-wave-1"; });
  assert.ok(wave);
  assert.equal(wave.status, "ready-for-deployment");
  assert.equal(wave.deployedAt, null);
  assert.deepEqual(wave.routes, Object.keys(routes));
  assert.equal(wave.baseline.totals.impressions, 54311);
  assert.equal(wave.baseline.totals.clicks, 446);
});
