"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const engine = require("../tools/waist-hip-ratio/waist-hip-engine.js");
const oracle = {
  units: "cm", applicability: "adult", waist: 84, repeatWaist: 86,
  hip: 100, repeatHip: 102, reference: "women"
};

test("shared English waist-to-hip engine preserves the exact route oracle", () => {
  const result = engine.calculate(oracle);
  assert.strictEqual(result.meanWaist, 85);
  assert.strictEqual(result.meanHip, 101);
  assert(Math.abs(result.ratio - 0.8415841584158416) < 1e-12);
  assert(Math.abs(result.low - 0.8235294117647058) < 1e-12);
  assert.strictEqual(result.high, 0.86);
  assert.strictEqual(result.waistDifference, 2);
  assert.strictEqual(result.hipDifference, 2);
  assert.strictEqual(result.referenceApplied, true);
  assert.strictEqual(result.referenceLabel, "Below the selected 0.85 population reference");
  assert.match(result.boundaryNote, /crosses the selected 0\.85 reference/);
});

test("route-specific invalid, limit, repeat and applicability cases fail closed", () => {
  assert.throws(() => engine.calculate({ ...oracle, applicability: "" }), /measurement context/);
  assert.throws(() => engine.calculate({ ...oracle, waist: 29.9 }), /First waist must be between 30 and 250 cm/);
  assert.throws(() => engine.calculate({ ...oracle, hip: 250.1 }), /First hip must be between 30 and 250 cm/);
  assert.throws(() => engine.calculate({ ...oracle, units: "in", waist: 11.9, repeatWaist: "", hip: 40, repeatHip: "" }), /12 and 100 in/);
  assert.doesNotThrow(() => engine.calculate({ ...oracle, units: "in", waist: 12, repeatWaist: 100, hip: 100, repeatHip: 12 }));
  const single = engine.calculate({ ...oracle, repeatWaist: "", repeatHip: "", reference: "none" });
  assert.strictEqual(single.anyRepeat, false);
  assert.strictEqual(single.low, single.ratio);
  assert.strictEqual(single.high, single.ratio);
  assert.match(single.boundaryNote, /Only one waist and hip reading/);
  for (const applicability of ["limited", "under18", "unsure"]) {
    const suppressed = engine.calculate({ ...oracle, applicability, reference: "women" });
    assert.strictEqual(suppressed.referenceApplied, false);
    assert.match(suppressed.context, /not applied/);
  }
  const womenBoundary = engine.calculate({ ...oracle, waist: 85, repeatWaist: "", hip: 100, repeatHip: "" });
  assert.match(womenBoundary.referenceLabel, /At or above/);
  const menBoundary = engine.calculate({ ...oracle, waist: 90, repeatWaist: "", hip: 100, repeatHip: "", reference: "men" });
  assert.match(menBoundary.referenceLabel, /At or above/);
});

test("native owner preserves original exports, health boundary, source freshness and privacy", () => {
  const page = read("sw/zana/uwiano-wa-kiuno-na-nyonga/index.html");
  const controller = read("assets/js/pages/sw-waist-hip-ratio.js");
  assert(page.includes("/tools/waist-hip-ratio/waist-hip-engine.js"));
  assert(page.includes("Pakua TXT") && page.includes("Chapa / Hifadhi PDF"));
  assert(!page.includes("Nakili"));
  assert(page.includes("hauwezi kutambua unene, mafuta ya mwili, kisukari, ugonjwa wa moyo na mishipa au afya kwa ujumla"));
  assert(page.includes("Ujauzito, upasuaji wa tumbo wa karibuni, maji tumboni, uvimbe"));
  assert(page.includes("https://www.who.int/publications/i/item/9789241501491"));
  assert(page.includes("https://www.who.int/teams/noncommunicable-diseases/surveillance/systems-tools/steps/manuals"));
  assert(page.includes('datetime="2026-08-02"'));
  assert(page.includes("Havihifadhiwi, havitumwi kwa seva, AI au analytics"));
  assert(!page.includes("<iframe"));
  assert(!/\bfetch\s*\(|XMLHttpRequest|sendBeacon\s*\(|WebSocket\s*\(|localStorage|sessionStorage/.test(controller));
  assert(controller.includes("engine.calculate(values)"));
  assert(controller.includes("function invalidate()"));
  assert(controller.includes("window.print()"));
});

test("translated schema, reciprocal metadata, discovery and blocked acceptance are exact", () => {
  const route = "/sw/zana/uwiano-wa-kiuno-na-nyonga/";
  const page = read("sw/zana/uwiano-wa-kiuno-na-nyonga/index.html");
  const alternate = '<link rel="alternate" hreflang="sw" href="https://afrotools.com' + route + '">';
  assert(read("tools/waist-hip-ratio/index.html").includes(alternate));
  assert(read("fr/tools/ratio-taille-hanches/index.html").includes(alternate));
  const schemas = [...page.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((match) => JSON.parse(match[1]));
  const types = schemas.flatMap((schema) => Array.isArray(schema["@type"]) ? schema["@type"] : [schema["@type"]]);
  ["WebApplication", "WebPage", "BreadcrumbList", "FAQPage", "HowTo"].forEach((type) => assert(types.includes(type)));
  schemas.forEach((schema) => assert.strictEqual(schema.inLanguage, "sw"));
  assert(!page.includes('"operatingSystem":"Any"'));
  const registry = read("assets/js/components/tool-registry.js");
  const rows = registry.match(/\{ id: ['"]waist-hip-ratio-sw['"][^\n]+\}/g) || [];
  assert.strictEqual(rows.length, 1);
  assert(/sourceId: ['"]waist-hip-ratio['"]/.test(rows[0]));
  const policy = JSON.parse(read("data/registry/locale-coverage-policy.json"));
  assert.strictEqual(policy.overrides.filter((entry) => entry.route === route).length, 1);
  const acceptance = JSON.parse(read("data/audits/swahili-free-app-acceptance.json"));
  const accepted = acceptance.entries.filter((entry) => entry.englishId === "waist-hip-ratio");
  assert.strictEqual(accepted.length, 1);
  assert.strictEqual(accepted[0].status, "accepted");
  assert.strictEqual(accepted[0].swahiliRoute, route);
  const receipt = JSON.parse(read("reports/swahili-waist-hip-ratio-route-receipt.json"));
  assert.strictEqual(receipt.acceptanceState, "repair-candidate-unaccepted");
  assert.deepStrictEqual(receipt.coordinatorGenerationCommands, [
    "npm run sw:parity:build",
    "node scripts/minify.js --only=tool-registry.js",
    "npm run registry:build",
    "node scripts/build-search-index.js"
  ]);
});
