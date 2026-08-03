"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const engine = require("../tools/course-load/course-load-engine.js");
const oracle = {
  required: 120, earned: 72, min: 12, max: 18,
  courses: [
    { name: "BIO 201", credits: 3 },
    { name: "CHE 202", credits: 4 },
    { name: "MAT 203", credits: 5 }
  ],
  contact: 18, study: 20, work: 15, commute: 5, sleepNight: 7.5, personal: 14
};

test("shared English course-load engine preserves the exact route oracle", () => {
  const result = engine.calculate(oracle);
  assert.strictEqual(result.registered, 12);
  assert.strictEqual(result.band, "inside");
  assert.strictEqual(result.remainingBefore, 48);
  assert.strictEqual(result.remainingIfCompleted, 36);
  assert.strictEqual(result.progress, 60);
  assert.strictEqual(result.accounted, 124.5);
  assert.strictEqual(result.unallocated, 43.5);
  assert.deepStrictEqual(result.courses, oracle.courses);
  assert.deepStrictEqual(result.time, {
    contact: 18, study: 20, work: 15, commute: 5, sleepNight: 7.5, personal: 14
  });
});

test("route-specific invalid and boundary contracts fail closed", () => {
  assert.throws(() => engine.calculate({ ...oracle, required: "" }), /Programme credits must be between/);
  assert.throws(() => engine.calculate({ ...oracle, required: "not-a-number" }), /Programme credits must be a number/);
  assert.throws(() => engine.calculate({ ...oracle, min: 19, max: 18 }), /Minimum credits cannot exceed/);
  assert.throws(() => engine.calculate({ ...oracle, courses: [] }), /Add at least one course/);
  assert.throws(() => engine.calculate({ ...oracle, courses: [{ name: "BIO", credits: 0 }] }), /Course 1 credits must be between/);
  assert.throws(() => engine.calculate({ ...oracle, courses: [{ name: "BIO", credits: 100.01 }] }), /Course 1 credits must be between/);
  assert.throws(() => engine.calculate({ ...oracle, contact: 168.1 }), /Class and placement hours must be between/);
  assert.throws(() => engine.calculate({ ...oracle, sleepNight: 24.1 }), /Sleep per night must be between/);

  const minimum = engine.calculate({
    required: 1, earned: 0, min: 0, max: 0.01,
    courses: [{ name: "", credits: 0.01 }],
    contact: 0, study: 0, work: 0, commute: 0, sleepNight: 0, personal: 0
  });
  assert.strictEqual(minimum.registered, 0.01);
  assert.strictEqual(minimum.band, "inside");
  assert.strictEqual(minimum.remainingIfCompleted, 0.99);
  assert.strictEqual(minimum.accounted, 0);
  assert.strictEqual(minimum.unallocated, 168);
  assert.strictEqual(minimum.courses[0].name, "Course 1");

  assert.strictEqual(engine.calculate({ ...oracle, courses: [{ name: "LOW", credits: 11.99 }] }).band, "below");
  assert.strictEqual(engine.calculate({ ...oracle, courses: [{ name: "HIGH", credits: 18.01 }] }).band, "above");
  const capped = engine.calculate({ ...oracle, required: 100, earned: 150 });
  assert.strictEqual(capped.progress, 100);
  assert.strictEqual(capped.remainingBefore, 0);
  const overbooked = engine.calculate({ ...oracle, contact: 168, study: 168 });
  assert(overbooked.unallocated < 0);
});

test("native owner preserves dynamic workflow, original exports, safety, source and privacy", () => {
  const page = read("sw/zana/mzigo-wa-masomo/index.html");
  const controller = read("assets/js/pages/sw-course-load.js");
  assert(page.includes("/tools/course-load/course-load-engine.js"));
  assert(!page.includes('name="afrotools-source-owner"'));
  assert(page.includes("Nakili mpango") && page.includes("Pakua TXT") && page.includes("Chapa / Hifadhi PDF"));
  assert(page.includes("Si idhini ya usajili, uamuzi wa mzigo mzito au utabiri wa kuhitimu"));
  assert(page.includes("AfroTools haiweki kiwango cha chini au juu"));
  assert(page.includes('datetime="2026-08-02"'));
  assert(page.includes("Hakuna njia ya AI kwenye zana hii"));
  assert.match(page, /Havihifadhiwi, havitumwi kwa taasisi, seva, AI au analytics/);
  assert(!page.includes("<iframe"));
  assert(!/\bfetch\s*\(|XMLHttpRequest|sendBeacon\s*\(|WebSocket\s*\(|localStorage|sessionStorage/.test(controller));
  assert(controller.includes("engine.calculate(input())"));
  assert(controller.includes("function invalidate()"));
  assert(controller.includes("function addCourse(name, credits)"));
  assert(controller.includes("navigator.clipboard.writeText(text).then"));
  assert(controller.includes('link.download = "ukaguzi-wa-mzigo-wa-kozi.txt"'));
  assert(controller.includes("window.print()"));
  assert.strictEqual((controller.match(/"data-audit"/g) || []).length, 1);
  assert(controller.includes("AUDIT = [") && controller.includes("mradi wa mwisho"));
});

test("translated schema, reciprocal metadata, discovery and coordinator acceptance are exact", () => {
  const route = "/sw/zana/mzigo-wa-masomo/";
  const page = read("sw/zana/mzigo-wa-masomo/index.html");
  const alternate = '<link rel="alternate" hreflang="sw" href="https://afrotools.com' + route + '">';
  assert(read("tools/course-load/index.html").includes(alternate));
  assert(read("fr/tools/charge-cours/index.html").includes(alternate));
  const schemas = [...page.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((match) => JSON.parse(match[1]));
  const types = schemas.flatMap((schema) => Array.isArray(schema["@type"]) ? schema["@type"] : [schema["@type"]]);
  ["WebApplication", "WebPage", "BreadcrumbList", "FAQPage", "HowTo"].forEach((type) => assert(types.includes(type)));
  schemas.forEach((schema) => assert.strictEqual(schema.inLanguage, "sw"));
  assert(!page.includes('"operatingSystem":"Any"'));
  const registry = read("assets/js/components/tool-registry.js");
  const rows = registry.split("\n").filter((line) => line.includes('href: "/sw/zana/mzigo-wa-masomo/"'));
  assert.strictEqual(rows.length, 1);
  assert(rows[0].includes('sourceId: "course-load"'));
  assert(rows[0].includes('lang: "sw"'));
  const wave = JSON.parse(read("data/localization/coverage-wave-2026-07.json"));
  const owner = wave.swahili.find((entry) => entry.enSlug === "course-load");
  assert(owner && owner.swSlug === "mzigo-wa-masomo" && owner.reuseExisting === true);
  const policy = JSON.parse(read("data/registry/locale-coverage-policy.json"));
  assert.strictEqual(policy.overrides.filter((entry) => entry.route === route).length, 0);
  const acceptance = JSON.parse(read("data/audits/swahili-free-app-acceptance.json"));
  const acceptedRows = acceptance.entries.filter((entry) => entry.englishId === "course-load");
  assert.strictEqual(acceptedRows.length, 1);
  assert.strictEqual(acceptedRows[0].status, "accepted");
  const receipt = JSON.parse(read("reports/swahili-course-load-route-receipt.json"));
  const browserProof = read("tests/e2e/swahili-course-load-owner.spec.js");
  assert.strictEqual(receipt.acceptanceState, "repair-candidate-unaccepted");
  assert.deepStrictEqual(receipt.reflowProof.viewports, [320, 375]);
  assert.strictEqual(receipt.reflowProof.computedRootFontDoubled, true);
  assert.strictEqual(receipt.reflowProof.visibleOverflowOffenders, 0);
  assert.deepStrictEqual(receipt.axeProof.themes, ["manual-light", "manual-dark", "system-light", "system-dark"]);
  assert.strictEqual(receipt.axeProof.violations, 0);
  assert(!browserProof.includes("style.zoom"));
  assert(browserProof.includes("base * 2"));
  assert(browserProof.includes("window.axe.run(document"));
  assert.strictEqual(JSON.parse(read("package.json")).devDependencies["axe-core"], "^4.11.0");
  assert.deepStrictEqual(receipt.coordinatorGenerationCommands, [
    "npm run sw:parity:build",
    "node scripts/minify.js --only=tool-registry.js",
    "npm run registry:build",
    "node scripts/build-search-index.js"
  ]);
});
