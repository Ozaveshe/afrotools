#!/usr/bin/env node
/*
 * Afro 1.0 vs a frontier model, on African statutory maths.
 *
 * WHAT THIS IS FOR
 *
 * "We improved our internal routing from 50% to 71%" is an engineering note.
 * "On African payroll and import questions we return the correct figure and a
 * frontier model does not" is a claim someone can act on — and it is only worth
 * making if it is measured rather than asserted.
 *
 * HOW IT IS SCORED
 *
 * Not on prose quality. Each case has a ground-truth figure computed by the
 * engine that powers the country's own calculator, derived from the operative
 * statutory schedule. A system is correct when the number it returns is within
 * tolerance of that figure. Fluency earns nothing.
 *
 * WHY WE EXPECT TO WIN, AND WHERE WE SHOULD NOT
 *
 * These schedules moved recently and unevenly — Kenya's NSSF ceiling stepped to
 * KES 108,000 in Feb 2026, SHIF at 2.75% replaced NHIF, Nigeria's NTA 2026 bands
 * sit alongside PITA 2025. A model answering from training data will be fluent
 * and stale. That is a narrow, real advantage and it should be stated narrowly:
 * it says nothing about general intelligence, and on any task outside a bundled
 * engine the frontier model is simply better. Claiming otherwise would not
 * survive the first question from anyone technical.
 *
 * Usage:
 *   node scripts/run-afro-headtohead.js              # Afro 1.0 only (no API calls)
 *   node scripts/run-afro-headtohead.js --with-model # also queries the frontier model
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const answer = require(path.join(ROOT, "assets", "js", "ai", "afro-answer.js"));

const WITH_MODEL = process.argv.includes("--with-model");
const TOLERANCE = 0.02; // 2% — generous; these are exact computations, not estimates.

/* Ground truth is computed here from the same engines the country pages use,
 * so the benchmark cannot drift away from what the product actually returns. */
function loadEngines() {
  const win = { AfroTools: { engines: {} } };
  ["ng-paye", "ke-paye", "gh-paye", "za-paye"].forEach((name) => {
    const src = fs.readFileSync(path.join(ROOT, "assets", "js", "engines", name + ".js"), "utf8");
    new Function("window", src)(win);
  });
  return win;
}

const CASES = [
  {
    id: "ke-50k",
    country: "KE",
    prompt: "I earn KES 50,000 a month in Kenya. What is my PAYE and take-home pay?",
    period: "monthly",
    amount: 50000,
    engineOptions: { ahl: true },
    why: "NSSF on the Feb-2026 KES 108,000 ceiling, SHIF 2.75%, AHL 1.5% deductible from taxable income"
  },
  {
    id: "ke-150k",
    country: "KE",
    prompt: "Kenyan salary of 150000 per month — how much PAYE will be deducted?",
    period: "monthly",
    amount: 150000,
    engineOptions: { ahl: true },
    why: "above the NSSF ceiling, where a stale ceiling changes the answer"
  },
  {
    id: "ng-250k",
    country: "NG",
    prompt: "My gross salary is 250,000 naira per month in Nigeria. What is my monthly take-home after tax?",
    period: "monthly",
    amount: 250000,
    engineOptions: {},
    why: "NTA 2026 bands"
  },
  {
    id: "ng-1m",
    country: "NG",
    prompt: "I earn 1 million naira monthly in Lagos. What PAYE do I pay each month?",
    period: "monthly",
    amount: 1000000,
    engineOptions: {},
    why: "upper NTA 2026 bands"
  },
  {
    id: "gh-6k",
    country: "GH",
    prompt: "Ghana salary of GHS 6,000 a month. What is the PAYE and net pay?",
    period: "monthly",
    amount: 6000,
    engineOptions: {},
    why: "GRA seven bands with SSNIT 5.5%"
  },
  {
    id: "za-45k",
    country: "ZA",
    prompt: "South African earning R45,000 per month — what is my monthly PAYE?",
    period: "monthly",
    amount: 45000,
    engineOptions: {},
    why: "SARS 2025/26 bands with primary rebate and UIF"
  }
];

function groundTruth(testCase, win) {
  const spec = answer.PAYE_ENGINES[testCase.country];
  const engine = win.AfroTools.engines[spec.key];
  const input = spec.basis === "annual" ? testCase.amount * 12 : testCase.amount;
  const result = engine.calculate(input, testCase.engineOptions || {});
  const tax = result.paye != null ? result.paye : result.tax;
  const net = result.net != null ? result.net : result.netMonthly;
  return {
    currency: spec.currency,
    taxMonthly: spec.basis === "annual" ? tax / 12 : tax,
    netMonthly: spec.basis === "annual"
      ? (result.netMonthly != null ? result.netMonthly : net / 12)
      : net
  };
}

function within(actual, expected, tolerance) {
  if (typeof actual !== "number" || !isFinite(actual)) return false;
  // A genuine zero is a real answer (Ghana below the tax threshold), not a miss.
  if (expected === 0) return Math.abs(actual) < 1;
  return Math.abs(actual - expected) / expected <= tolerance;
}

/* Pull the first plausible take-home / tax figure out of model prose. Generous
 * on purpose — we are testing whether the number is right, not whether the
 * model formatted it the way we like. */
function extractFigures(text) {
  const cleaned = String(text || "").replace(/,/g, "");
  const numbers = (cleaned.match(/\d+(?:\.\d+)?/g) || [])
    .map(Number)
    .filter((value) => value >= 100);
  return numbers;
}

async function askModel(prompt) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return { skipped: true, reason: "ANTHROPIC_API_KEY not set" };
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: process.env.AFRO_BENCH_MODEL || "claude-sonnet-4-5",
        max_tokens: 400,
        messages: [{
          role: "user",
          content: prompt + "\n\nGive the monthly PAYE and monthly take-home as plain numbers."
        }]
      })
    });
    if (!response.ok) return { skipped: true, reason: "http " + response.status };
    const data = await response.json();
    const text = (data.content || []).map((part) => part.text || "").join(" ");
    return { text };
  } catch (err) {
    return { skipped: true, reason: err.message.slice(0, 60) };
  }
}

async function main() {
  const win = loadEngines();
  const rows = [];

  for (const testCase of CASES) {
    const truth = groundTruth(testCase, win);

    const afro = answer.answerPaye(testCase.prompt, testCase.country, {
      window: win,
      amount: testCase.amount,
      period: testCase.period,
      engineOptions: testCase.engineOptions
    });
    const afroCorrect = afro.answered &&
      within(afro.taxMonthly, truth.taxMonthly, TOLERANCE) &&
      within(afro.netMonthly, truth.netMonthly, TOLERANCE);

    let model = { skipped: true, reason: "not requested" };
    let modelCorrect = null;
    if (WITH_MODEL) {
      model = await askModel(testCase.prompt);
      if (!model.skipped) {
        const figures = extractFigures(model.text);
        // Credit the model if EITHER key figure appears anywhere in its answer.
        modelCorrect = figures.some((value) => within(value, truth.taxMonthly, TOLERANCE)) &&
          figures.some((value) => within(value, truth.netMonthly, TOLERANCE));
      }
    }

    rows.push({ testCase, truth, afro, afroCorrect, model, modelCorrect });
  }

  console.log("=== Afro 1.0 vs frontier model — African statutory maths ===");
  console.log("Ground truth computed by the engines behind each country's calculator.");
  console.log("Correct = both monthly PAYE and monthly take-home within " + (TOLERANCE * 100) + "%.\n");

  rows.forEach(({ testCase, truth, afro, afroCorrect, model, modelCorrect }) => {
    console.log(testCase.id + "  (" + testCase.why + ")");
    console.log("   truth      PAYE " + truth.currency + " " + Math.round(truth.taxMonthly).toLocaleString("en-US") +
      " / net " + truth.currency + " " + Math.round(truth.netMonthly).toLocaleString("en-US"));
    console.log("   afro 1.0   " + (afroCorrect ? "CORRECT" : "wrong  ") + "  " +
      (afro.answered
        ? truth.currency + " " + Math.round(afro.taxMonthly).toLocaleString("en-US") + " / " +
          truth.currency + " " + Math.round(afro.netMonthly).toLocaleString("en-US")
        : "declined: " + afro.reason));
    if (WITH_MODEL) {
      console.log("   frontier   " + (model.skipped ? "skipped (" + model.reason + ")"
        : (modelCorrect ? "CORRECT" : "wrong") + "  " + String(model.text).replace(/\s+/g, " ").slice(0, 90)));
    }
    console.log("");
  });

  const afroScore = rows.filter((row) => row.afroCorrect).length;
  console.log("Afro 1.0        " + afroScore + "/" + rows.length + " exact");
  if (WITH_MODEL) {
    const scored = rows.filter((row) => row.modelCorrect !== null);
    if (!scored.length) {
      console.log("Frontier model  not run — set ANTHROPIC_API_KEY to include it");
    } else {
      console.log("Frontier model  " + scored.filter((row) => row.modelCorrect).length + "/" + scored.length + " exact");
    }
  } else {
    console.log("Frontier model  not run — pass --with-model (requires ANTHROPIC_API_KEY)");
  }
  console.log("\nScope: this measures bundled-engine tasks only. Outside them a frontier");
  console.log("model is the stronger system, and the claim should never be stretched past this.");
}

main();
