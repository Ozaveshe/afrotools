"use strict";

const assert = require("assert");

const audit = require("../scripts/audit-search-snippets");

assert.deepStrictEqual(
  audit.extractMetadata(`<!doctype html><html><head>
    <meta content="Finish the task &amp; export l'output." name="description">
    <title>Task &amp; Export | AfroTools</title>
  </head><body><h1><span>Task</span> &amp; export</h1><iframe src="/tools/example/"></iframe></body></html>`),
  {
    title: "Task & Export | AfroTools",
    description: "Finish the task & export l'output.",
    h1: "Task & export",
    iframeSrc: "/tools/example/"
  },
  "metadata extraction must tolerate attribute order and nested H1 markup"
);

assert.strictEqual(audit.normalized("Calculateur — Côte d’Ivoire"), "calculateur côte d ivoire");

const rows = audit.buildRows();
const report = audit.buildReport(rows);
assert.strictEqual(report.scope.pages, rows.length, "the report denominator must equal the row-level inventory");
assert.deepStrictEqual(report.scope.locales, ["en", "fr", "sw"]);
assert.ok(report.byLocale.en.pages > 0 && report.byLocale.fr.pages > 0 && report.byLocale.sw.pages > 0);
assert.ok(rows.every((row) => ["en", "fr", "sw"].includes(row.locale)), "only the requested locales may enter the report");
assert.ok(rows.every((row) => !row.sourceFile.startsWith(".")), "hidden worktrees and evidence directories must stay outside the public denominator");
assert.strictEqual(new Set(rows.map((row) => row.route)).size, rows.length, "each canonical route must appear once");
assert.strictEqual(report.pagesWithErrors, 0, "indexable localized pages must not copy an English equivalent's full snippet");
assert.strictEqual(report.byLocale.fr.signals.DESCRIPTION_ENGLISH_SEARCH_TERMS || 0, 0, "French snippets must not retain generic English search wording");
assert.strictEqual(report.byLocale.sw.signals.TITLE_ENGLISH_SEARCH_TERMS || 0, 0, "Swahili task titles must not retain generic English search wording");
assert.strictEqual(report.byLocale.sw.signals.DESCRIPTION_ENGLISH_SEARCH_TERMS || 0, 0, "Swahili descriptions must not retain generic English search wording");
assert.strictEqual(report.byLocale.fr.signals.H1_IDENTICAL_TO_ENGLISH || 0, 0, "French pages must not reuse an English equivalent's H1");
assert.strictEqual(report.byLocale.sw.signals.H1_IDENTICAL_TO_ENGLISH || 0, 0, "Swahili pages must not reuse an English equivalent's H1");
assert.strictEqual(report.byLocale.fr.signals.H1_ENGLISH_SEARCH_TERMS || 0, 0, "French H1s must not retain generic English task wording");
assert.strictEqual(report.byLocale.sw.signals.H1_ENGLISH_SEARCH_TERMS || 0, 0, "Swahili H1s must not retain generic English task wording");
assert.strictEqual(report.byLocale.sw.signals.INDEXABLE_ENGLISH_IFRAME || 0, 0, "Swahili indexable routes must not wrap an English workflow in an iframe");
assert.strictEqual(report.byLocale.fr.signals.INDEXABLE_ENGLISH_IFRAME || 0, 0, "French indexable routes must not wrap an English workflow in an iframe");
assert.ok(rows.every((row) => row.h1), "every indexable English, French and Swahili route must expose a static H1");
assert.strictEqual(report.byLocale.sw.signals.TITLE_DUPLICATE_LOCALE || 0, 0, "distinct Swahili tasks must not compete with the same exact title");
assert.deepStrictEqual(report.topDuplicateTitles, [], "indexable English, French and Swahili routes must not share exact locale titles");
assert.deepStrictEqual(report.topDuplicateDescriptions, [], "indexable English, French and Swahili routes must not share exact locale descriptions");

const byRoute = new Map(rows.map((row) => [row.route, row]));
for (const retiredRoute of [
  "/business/invoice/",
  "/business/payroll/",
  "/business/setup/",
  "/tools/remittance-v2/",
  "/fr/tools/transfert-v2/",
  "/fr/tools/school-fees/app",
  "/sw/zana/ulinganisho-uhamishaji-pesa-kina/"
]) {
  assert.ok(!byRoute.has(retiredRoute), `${retiredRoute} must remain outside the indexable search denominator`);
}
const expectedSwahiliTitles = {
  "/sw/zana/gharama-za-mafuta-ya-generator/": "Gharama za Mafuta ya Jenereta | AfroTools",
  "/sw/zana/kigawanya-bili-na-tip/": "Kikokotoo cha Bakshishi na Kodi ya Bili | AfroTools",
  "/sw/zana/kikokotoo-kisayansi/": "Kikokotoo cha kisayansi | AfroTools",
  "/sw/zana/kilinganisha-maandishi/": "Kilinganisha Maandishi | AfroTools",
  "/sw/zana/solar-dhidi-ya-generator/": "Nishati ya Jua dhidi ya Jenereta | AfroTools"
};
for (const [route, title] of Object.entries(expectedSwahiliTitles)) {
  assert.strictEqual(byRoute.get(route)?.title, title, `${route} must retain distinct native task wording`);
}
assert.strictEqual(
  byRoute.get("/sw/zana/base64/")?.title,
  "Kisimbaji na Kisimbuzi cha Base64 | AfroTools",
  "the Base64 shell must expose its task in Swahili"
);
assert.strictEqual(
  byRoute.get("/sw/zana/kiigaji-ussd/")?.h1,
  "Kiigaji cha Menyu za USSD",
  "the Swahili USSD page must expose a native task heading"
);

console.log("Search snippet quality tests passed");
