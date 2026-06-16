#!/usr/bin/env node

const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");

const TARGETS = [
  "assets/js/ai",
  "widgets/ai",
  "netlify/functions/ai-route-intent.js",
  "netlify/functions/api-v1-ai-route.js",
  "netlify/functions/ai-advisor.js",
  "netlify/functions/ai-business-plan.js",
  "scripts/generate-ai-landing-pages.js",
  "tests/ai-tool-manifest.test.js",
  "tests/ai-prompt-examples.test.js",
  "tests/ai-intent-router.test.js",
  "tests/ai-guardrails.test.js",
  "tests/api-ai-route.test.js",
];

function walkJs(target) {
  const abs = path.join(ROOT, target);
  if (!fs.existsSync(abs)) return [];
  const stat = fs.statSync(abs);
  if (stat.isFile()) return abs.endsWith(".js") ? [abs] : [];
  return fs.readdirSync(abs, { withFileTypes: true }).flatMap((entry) => {
    const child = path.join(target, entry.name);
    if (entry.isDirectory()) return walkJs(child);
    return entry.name.endsWith(".js") ? [path.join(ROOT, child)] : [];
  });
}

const files = Array.from(new Set(TARGETS.flatMap(walkJs))).sort();

if (!files.length) {
  console.log("No CI lint targets found.");
  process.exit(0);
}

const failures = [];

files.forEach((file) => {
  const result = spawnSync(process.execPath, ["--check", file], {
    cwd: ROOT,
    encoding: "utf8",
  });
  if (result.status !== 0) {
    failures.push({
      file: path.relative(ROOT, file),
      output: (result.stderr || result.stdout || "").trim(),
    });
  }
});

if (failures.length) {
  console.error("CI lint failed:");
  failures.forEach((failure) => {
    console.error("- " + failure.file);
    if (failure.output) console.error(failure.output);
  });
  process.exit(1);
}

console.log("CI lint passed: checked " + files.length + " JavaScript files.");
