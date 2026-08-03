"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const engine = require("../tools/roman-numerals/roman-numerals-engine.js");
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");

assert.strictEqual(engine.toRoman(49), "XLIX");
assert.strictEqual(engine.toRoman(2024), "MMXXIV");
assert.strictEqual(engine.fromRoman("CMXLIV"), 944);
assert.strictEqual(engine.convert("3999").output, "MMMCMXCIX");
assert.strictEqual(engine.convert("MMXXIV").output, "2024");
for (const bad of ["0", "4000", "IIII", "IL", "12.5", "hello"]) {
  assert.strictEqual(engine.convert(bad).ok, false, bad);
}

const batch = engine.convertBatch("49\nMMXXIV\nIL");
assert.strictEqual(batch.rows[0].result.output, "XLIX");
assert.strictEqual(batch.rows[1].result.output, "2024");
assert.strictEqual(batch.rows[2].result.ok, false);
assert.strictEqual(
  engine.convertBatch(Array.from({ length: 201 }, (_, index) => String(index + 1)).join("\n")).truncated,
  true
);
assert.strictEqual(engine.checkQuizAnswer("toRoman", 49, "XLIX"), true);
assert.strictEqual(engine.checkQuizAnswer("toRoman", 49, "IL"), false);
assert.strictEqual(engine.checkQuizAnswer("toDecimal", 2024, "2024"), true);

const englishPage = read("tools/roman-numerals/index.html");
const englishController = read("tools/roman-numerals/roman-numerals-vip.js");
const swahiliPage = read("sw/zana/namba-za-kirumi/index.html");
const swahiliController = read("assets/js/pages/sw-roman-numerals.js");

assert(swahiliPage.includes("/tools/roman-numerals/roman-numerals-engine.js"));
assert(swahiliPage.includes("/assets/js/pages/sw-roman-numerals.js"));
assert(!swahiliPage.includes("roman-numerals-vip.js"));
for (const type of ["WebApplication", "WebPage", "BreadcrumbList", "FAQPage", "HowTo"]) {
  assert(
    swahiliPage.includes(`\"@type\":\"${type}`) || swahiliPage.includes(`\"${type}\"`),
    type
  );
}
assert(!/operatingSystem[^<]*Any/i.test(swahiliPage));
for (const contrastContract of [
  "--roman-control-border:#475569",
  'html[data-theme="dark"] .roman-sw',
  "@media(prefers-color-scheme:dark)",
  "#main.roman-sw .field select option",
  "--roman-disabled-border:#cbd5e1",
  "outline:3px solid var(--roman-focus)!important"
]) {
  assert(swahiliPage.includes(contrastContract), `Missing control contrast contract: ${contrastContract}`);
}
const browserProof = read("tests/e2e/swahili-roman-owner.spec.js");
for (const browserContract of [
  "assertRomanControlContrast",
  '"light", "manual-dark", "system-dark"',
  'selector: "#romanInput", type: "input"',
  'selector: "#quizDifficulty", type: "select"',
  'selector: "#batchInput", type: "textarea"',
  'selector: "#convertButton", type: "button-primary"'
]) {
  assert(browserProof.includes(browserContract), `Missing computed browser contrast proof: ${browserContract}`);
}

const pairedBehaviorIds = [
  "copyResultButton",
  "swapResultButton",
  "downloadResultButton",
  "printResultButton",
  "batchInput",
  "copyBatchButton",
  "downloadBatchButton",
  "quizDifficulty",
  "quizDirection",
  "quizPrompt",
  "quizAnswer",
  "checkQuizButton",
  "skipQuizButton",
  "nextQuizButton",
  "quizScore",
  "quizTotal",
  "quizStreak"
];
pairedBehaviorIds.forEach((id) => {
  assert(englishPage.includes(`id="${id}"`), `English owner missing ${id}`);
  assert(swahiliPage.includes(`id="${id}"`), `Swahili owner missing ${id}`);
});

const pairedControllerBehaviors = [
  "fallbackCopy",
  "swapResult",
  "quizRange",
  "newQuiz",
  "checkQuiz",
  "skipQuizButton",
  "quizDifficulty",
  "quiz.score",
  "quiz.total",
  "quiz.streak",
  "quiz.answered"
];
pairedControllerBehaviors.forEach((behavior) => {
  assert(englishController.includes(behavior), `English controller missing ${behavior}`);
  assert(swahiliController.includes(behavior), `Swahili controller missing ${behavior}`);
});

assert(swahiliController.includes("removeAttribute(\"aria-invalid\")"));
assert(swahiliController.includes("id(\"batchError\").textContent = \"\""));
assert(swahiliController.includes(".catch(function ()"));
assert(swahiliController.includes("document.execCommand(\"copy\")"));
assert(!/\bfetch\s*\(|XMLHttpRequest|sendBeacon\s*\(/.test(swahiliController));
assert(!/afro-related-tools|related-tools\.min\.js|afro-newsletter-cta|newsletter-cta\.min\.js/.test(swahiliPage));

const alternate = '<link rel="alternate" hreflang="sw" href="https://afrotools.com/sw/zana/namba-za-kirumi/">';
assert(read("tools/roman-numerals/index.html").includes(alternate));
assert(read("fr/tools/chiffres-romains/index.html").includes(alternate));
const registryContext = {};
vm.createContext(registryContext);
vm.runInContext(read("assets/js/components/tool-registry.js"), registryContext, { filename: "tool-registry.js" });
const romanRegistryRows = registryContext.AFRO_TOOLS.filter((row) => row.id === "roman-numerals-sw");
assert.strictEqual(romanRegistryRows.length, 1);
assert.deepStrictEqual(
  JSON.parse(JSON.stringify({
    sourceId: romanRegistryRows[0].sourceId,
    href: romanRegistryRows[0].href,
    category: romanRegistryRows[0].category,
    lang: romanRegistryRows[0].lang,
    status: romanRegistryRows[0].status,
    imageId: romanRegistryRows[0].imageId
  })),
  {
    sourceId: "roman-numerals",
    href: "/sw/zana/namba-za-kirumi/",
    category: "education",
    lang: "sw",
    status: "live",
    imageId: "roman-numerals"
  }
);
assert(read("data/registry/locale-coverage-policy.json").includes('"route": "/sw/zana/namba-za-kirumi/"'));

const acceptance = JSON.parse(read("data/audits/swahili-free-app-acceptance.json"));
assert.strictEqual(
  acceptance.entries.some((entry) => entry.englishId === "roman-numerals"),
  true,
  "Coordinator acceptance records the independently verified Roman owner"
);

const receipt = JSON.parse(read("reports/swahili-roman-numerals-route-receipt.json"));
assert.strictEqual(receipt.state, "repair-candidate-unaccepted");
assert.strictEqual(receipt.coordinatorAcceptanceEdited, false);
assert.deepStrictEqual(receipt.coordinatorGenerationCommands, [
  "npm run sw:parity:build",
  "node scripts/minify.js --only=tool-registry.js",
  "npm run registry:build",
  "node scripts/build-search-index.js"
]);

console.log("Clean-base Swahili Roman owner, source registry, stale-state, clipboard and no-network contracts passed.");
