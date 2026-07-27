#!/usr/bin/env node
/*
 * Grounded answers must be exact, and must decline rather than guess.
 *
 * The sharpest test here is the input-basis pin. The engines do not agree on
 * whether `calculate` takes a monthly or an annual gross — Kenya and Tanzania
 * take monthly, Nigeria, Ghana, South Africa and Egypt take annual. Getting it
 * wrong is silent: feeding a GHS 6,000 monthly salary to Ghana's annual engine
 * returned a net of GHS 473, a number that looks like an answer and is wrong by
 * a factor of twelve. Nothing in the engine's shape reveals which it wants, so
 * the basis is asserted here against real behaviour.
 */
const assert = require("assert");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const answer = require(path.join(ROOT, "assets", "js", "ai", "afro-answer.js"));

function loadEngines() {
  const win = { AfroTools: { engines: {} } };
  ["ng-paye", "ke-paye", "gh-paye", "za-paye", "tz-paye", "eg-paye"].forEach((name) => {
    const file = path.join(ROOT, "assets", "js", "engines", name + ".js");
    if (!fs.existsSync(file)) return;
    new Function("window", fs.readFileSync(file, "utf8"))(win);
  });
  return win;
}

function main() {
  const win = loadEngines();

  // --- 1. Declared basis must match how the engine actually behaves ---------
  Object.keys(answer.PAYE_ENGINES).forEach((code) => {
    const spec = answer.PAYE_ENGINES[code];
    const engine = win.AfroTools.engines[spec.key];
    if (!engine) return;
    const probe = 120000;
    const result = engine.calculate(probe, {});
    const net = result.net != null ? result.net : null;
    const netMonthly = result.netMonthly != null ? result.netMonthly : null;

    if (net != null && netMonthly != null) {
      const looksAnnual = Math.abs(netMonthly - net / 12) < Math.abs(netMonthly - net);
      assert.strictEqual(spec.basis, looksAnnual ? "annual" : "monthly",
        code + ": declared basis '" + spec.basis + "' contradicts engine behaviour");
    } else if (netMonthly != null) {
      // Only a monthly figure: if it is far below the input, the input was annual.
      const looksAnnual = netMonthly < probe / 2;
      assert.strictEqual(spec.basis, looksAnnual ? "annual" : "monthly",
        code + ": declared basis '" + spec.basis + "' contradicts engine behaviour");
    }
  });

  // --- 2. Known-good figures, computed not recalled -------------------------
  const kenya = answer.answerPaye("I earn KES 50,000 a month", "KE",
    { window: win, amount: 50000, period: "monthly", engineOptions: { ahl: true } });
  assert.ok(kenya.answered, "Kenya should answer");
  assert.strictEqual(Math.round(kenya.taxMonthly), 5846);
  assert.strictEqual(Math.round(kenya.netMonthly), 39029);
  assert.ok(kenya.grounded, "answer must be marked grounded");
  assert.ok(/revenue authority/i.test(kenya.caveat), "must carry a verification caveat");

  const ghana = answer.answerPaye("Ghana salary of 6000 a month", "GH",
    { window: win, amount: 6000, period: "monthly" });
  assert.ok(ghana.answered, "Ghana should answer");
  // The bug this test exists for: 473 was the wrong answer, ~4,692 is right.
  assert.ok(ghana.netMonthly > 4000, "Ghana net must reflect a monthly salary, got " + ghana.netMonthly);
  assert.ok(ghana.netMonthly < 6000, "net cannot exceed gross");

  const nigeria = answer.answerPaye("250000 naira per month", "NG",
    { window: win, amount: 250000, period: "monthly" });
  assert.ok(nigeria.answered);
  assert.strictEqual(Math.round(nigeria.grossMonthly), 250000, "gross must round-trip to what the user said");
  assert.ok(nigeria.netMonthly < nigeria.grossMonthly);

  // --- 3. It declines rather than inventing --------------------------------
  const noAmount = answer.answerPaye("what is my take home pay in Kenya", "KE", { window: win });
  assert.strictEqual(noAmount.answered, false, "must not answer without an amount");
  assert.strictEqual(noAmount.reason, "no_amount_supplied");

  const noEngine = answer.answerPaye("salary 100000", "ZW", { window: win, amount: 100000 });
  assert.strictEqual(noEngine.answered, false, "must not answer for a country with no engine");
  assert.strictEqual(noEngine.reason, "no_engine_for_country");

  // --- 4. Amount extraction ------------------------------------------------
  assert.strictEqual(answer.extractAmount("I earn 450,000 monthly"), 450000);
  assert.strictEqual(answer.extractAmount("salary is 450k"), 450000);
  assert.strictEqual(answer.extractAmount("I make 1.2m a year"), 1200000);
  assert.strictEqual(answer.extractAmount("payroll for 5 employees"), null,
    "small counts are not salaries");
  assert.strictEqual(answer.extractAmount("import a 2016 Toyota"), null,
    "a model year is not an amount");
  assert.strictEqual(answer.extractPeriod("450000 per month"), "monthly");
  assert.strictEqual(answer.extractPeriod("3.6m per annum"), "annual");

  console.log("afro-answer tests passed (" + answer.VERSION + ") — basis pinned, figures exact, declines when ungrounded");
}

main();
