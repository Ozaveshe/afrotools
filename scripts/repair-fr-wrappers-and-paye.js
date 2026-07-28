#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const args = new Set(process.argv.slice(2));
const { buildPairs, assertSafePairs } = require("./lib/mojibake");
const write = args.has("--write");

const wrapperRoot = path.join(repoRoot, "fr", "tools");
const frRoot = path.join(repoRoot, "fr");

const EXACT_REPLACEMENTS = [
  ["https://afrotools.org", "https://afrotools.com"],
  ["https://afrotools.net", "https://afrotools.com"],
];

const MOJIBAKE_REPLACEMENTS = assertSafePairs(buildPairs({
  // Typographic characters these pages normalise back to ASCII.
  "\u2018": "'",
  "\u2019": "'",
  "\u201C": '"',
  "\u201D": '"',
  "\u2013": "-",
  "\u2014": "-",
  "\u2026": "...",
  "\u00A0": " ",
  "\u202F": " ",
  // Accented characters that must survive as themselves.
  "\u00C0": "\u00C0", "\u00C2": "\u00C2", "\u00C4": "\u00C4", "\u00C7": "\u00C7",
  "\u00C8": "\u00C8", "\u00C9": "\u00C9", "\u00CA": "\u00CA", "\u00CB": "\u00CB",
  "\u00CE": "\u00CE", "\u00CF": "\u00CF", "\u00D4": "\u00D4", "\u00D6": "\u00D6",
  "\u00D9": "\u00D9", "\u00DB": "\u00DB", "\u00DC": "\u00DC",
  "\u00E0": "\u00E0", "\u00E2": "\u00E2", "\u00E4": "\u00E4", "\u00E7": "\u00E7",
  "\u00E8": "\u00E8", "\u00E9": "\u00E9", "\u00EA": "\u00EA", "\u00EB": "\u00EB",
  "\u00EE": "\u00EE", "\u00EF": "\u00EF", "\u00F4": "\u00F4", "\u00F6": "\u00F6",
  "\u00F9": "\u00F9", "\u00FB": "\u00FB", "\u00FC": "\u00FC", "\u00F1": "\u00F1"
}), "repair-fr-wrappers-and-paye");

const PAYE_FILE_PATTERNS = [
  /^fr\/[^/]+\/[^/]*paye[^/]*\.html$/i,
  /^fr\/[^/]+\/[^/]*salary-tax[^/]*\.html$/i,
  /^fr\/[^/]+\/[^/]*paye\/index\.html$/i,
  /^fr\/[^/]+\/[^/]*salary-tax\/index\.html$/i,
];

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === ".git" || entry.name === "node_modules") continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, files);
      continue;
    }
    files.push(fullPath);
  }
  return files;
}

function toRepoRelative(fullPath) {
  return path.relative(repoRoot, fullPath).replace(/\\/g, "/");
}

function isTargetFile(relPath) {
  if (/^fr\/tools\/.+\/index\.html$/i.test(relPath)) return true;
  return PAYE_FILE_PATTERNS.some((pattern) => pattern.test(relPath));
}

function applyTable(text, replacements) {
  let next = text;
  let changes = 0;

  for (const [from, to] of replacements) {
    if (!next.includes(from)) continue;
    const parts = next.split(from);
    changes += parts.length - 1;
    next = parts.join(to);
  }

  return { text: next, changes };
}

function repairContent(text) {
  const exact = applyTable(text, EXACT_REPLACEMENTS);
  const mojibake = applyTable(exact.text, MOJIBAKE_REPLACEMENTS);
  return {
    text: mojibake.text,
    changes: exact.changes + mojibake.changes,
  };
}

function main() {
  const candidates = [
    ...walk(wrapperRoot),
    ...walk(frRoot),
  ]
    .filter((fullPath) => fullPath.endsWith(".html"))
    .map((fullPath) => ({ fullPath, relPath: toRepoRelative(fullPath) }))
    .filter(({ relPath }) => isTargetFile(relPath));

  const unique = new Map();
  for (const item of candidates) unique.set(item.relPath, item.fullPath);

  const changedFiles = [];

  for (const [relPath, fullPath] of unique.entries()) {
    const original = fs.readFileSync(fullPath, "utf8");
    const repaired = repairContent(original);
    if (repaired.text === original) continue;

    changedFiles.push({
      relPath,
      changes: repaired.changes,
    });

    if (write) {
      fs.writeFileSync(fullPath, repaired.text, "utf8");
    }
  }

  if (!changedFiles.length) {
    console.log(write ? "No French wrapper or PAYE repairs were needed." : "No pending French wrapper or PAYE repairs found.");
    return;
  }

  const totalReplacements = changedFiles.reduce((sum, item) => sum + item.changes, 0);
  console.log(`${write ? "Applied" : "Found"} ${totalReplacements} replacements across ${changedFiles.length} files.`);
  for (const item of changedFiles.slice(0, 80)) {
    console.log(`- ${item.relPath} (${item.changes})`);
  }
  if (changedFiles.length > 80) {
    console.log(`...and ${changedFiles.length - 80} more files.`);
  }
}

main();
