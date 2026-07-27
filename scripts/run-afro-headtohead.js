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

const ASK_SUFFIX = "\n\nAnswer with the monthly PAYE and the monthly take-home as plain numbers.";

/* Providers are read from the environment only — a key is never accepted as an
 * argument, so it cannot end up in a shell history or a committed script. */
const PROVIDERS = {
  openai: {
    label: "OpenAI",
    envKey: "OPENAI_API_KEY",
    defaultModel: "gpt-5",
    async call(prompt, key, model) {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: "Bearer " + key },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: prompt + ASK_SUFFIX }]
        })
      });
      if (!response.ok) {
        const detail = await response.text().catch(() => "");
        return { skipped: true, reason: "http " + response.status + " " + detail.slice(0, 120) };
      }
      const data = await response.json();
      const text = ((data.choices || [])[0] || {}).message;
      return { text: (text && text.content) || "" };
    }
  },
  anthropic: {
    label: "Anthropic",
    envKey: "ANTHROPIC_API_KEY",
    defaultModel: "claude-sonnet-4-5",
    async call(prompt, key, model) {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": key,
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model,
          max_tokens: 500,
          messages: [{ role: "user", content: prompt + ASK_SUFFIX }]
        })
      });
      if (!response.ok) {
        const detail = await response.text().catch(() => "");
        return { skipped: true, reason: "http " + response.status + " " + detail.slice(0, 120) };
      }
      const data = await response.json();
      return { text: (data.content || []).map((part) => part.text || "").join(" ") };
    }
  }
};

function selectedProviders() {
  const flag = process.argv.find((arg) => arg.startsWith("--provider="));
  const wanted = flag ? flag.split("=")[1].split(",") : Object.keys(PROVIDERS);
  return wanted
    .map((name) => PROVIDERS[name] && Object.assign({ name }, PROVIDERS[name]))
    .filter(Boolean)
    .filter((provider) => !!process.env[provider.envKey]);
}

async function askModel(provider, prompt) {
  const key = process.env[provider.envKey];
  if (!key) return { skipped: true, reason: provider.envKey + " not set" };
  const model = process.env[provider.name.toUpperCase() + "_BENCH_MODEL"] ||
    process.env.AFRO_BENCH_MODEL || provider.defaultModel;
  try {
    const result = await provider.call(prompt, key, model);
    return Object.assign({ model }, result);
  } catch (err) {
    return { skipped: true, reason: err.message.slice(0, 80) };
  }
}

async function main() {
  const win = loadEngines();
  const providers = WITH_MODEL ? selectedProviders() : [];
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

    const models = {};
    for (const provider of providers) {
      const reply = await askModel(provider, testCase.prompt);
      let correct = null;
      if (!reply.skipped) {
        const figures = extractFigures(reply.text);
        // Credit the model if BOTH key figures appear anywhere in its answer,
        // in any order or format. Deliberately generous: we are testing whether
        // the number is right, not how it chose to present it.
        correct = figures.some((value) => within(value, truth.taxMonthly, TOLERANCE)) &&
          figures.some((value) => within(value, truth.netMonthly, TOLERANCE));
      }
      models[provider.name] = { reply, correct, label: provider.label };
    }

    rows.push({ testCase, truth, afro, afroCorrect, models });
  }

  console.log("=== Afro 1.0 vs frontier models — African statutory maths ===");
  console.log("Ground truth computed by the engines behind each country's calculator.");
  console.log("Correct = both monthly PAYE and monthly take-home within " + (TOLERANCE * 100) + "%.");
  console.log("Fluency earns nothing; only the number counts.\n");

  rows.forEach(({ testCase, truth, afro, afroCorrect, models }) => {
    console.log(testCase.id + "  (" + testCase.why + ")");
    console.log("   truth        PAYE " + truth.currency + " " + Math.round(truth.taxMonthly).toLocaleString("en-US") +
      "  /  net " + truth.currency + " " + Math.round(truth.netMonthly).toLocaleString("en-US"));
    console.log("   Afro 1.0     " + (afroCorrect ? "CORRECT" : "wrong  ") + "  " +
      (afro.answered
        ? truth.currency + " " + Math.round(afro.taxMonthly).toLocaleString("en-US") + "  /  " +
          truth.currency + " " + Math.round(afro.netMonthly).toLocaleString("en-US")
        : "declined: " + afro.reason));
    Object.keys(models).forEach((name) => {
      const entry = models[name];
      const head = "   " + entry.label.padEnd(12);
      if (entry.reply.skipped) {
        console.log(head + "skipped (" + entry.reply.reason + ")");
        return;
      }
      const figures = extractFigures(entry.reply.text).slice(0, 6);
      console.log(head + (entry.correct ? "CORRECT" : "wrong  ") + "  figures seen: " +
        figures.map((f) => Math.round(f).toLocaleString("en-US")).join(", ").slice(0, 70));
    });
    console.log("");
  });

  const afroScore = rows.filter((row) => row.afroCorrect).length;
  console.log("SCORE (exact figures)");
  console.log("  Afro 1.0      " + afroScore + "/" + rows.length);
  if (!providers.length) {
    console.log("  frontier      not run — pass --with-model with OPENAI_API_KEY and/or ANTHROPIC_API_KEY set");
  } else {
    providers.forEach((provider) => {
      const scored = rows.filter((row) => row.models[provider.name] && row.models[provider.name].correct !== null);
      const won = scored.filter((row) => row.models[provider.name].correct).length;
      const model = (rows[0] && rows[0].models[provider.name] && rows[0].models[provider.name].reply.model) || "";
      console.log("  " + provider.label.padEnd(13) + (scored.length ? won + "/" + scored.length : "0 scored") +
        (model ? "   (" + model + ")" : ""));
    });
  }
  console.log("\nScope: bundled-engine tasks only. Outside them a frontier model is the");
  console.log("stronger system, and the claim should never be stretched past this.");
}

main();
