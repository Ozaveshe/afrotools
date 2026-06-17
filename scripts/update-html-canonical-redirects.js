#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const { writeFileSyncWithRetry } = require("./lib/safe-write");

const { ROOT, buildCanonicalAliasMap } = require("./lib/canonical-aliases");

const REDIRECTS_PATH = path.join(ROOT, "_redirects");
const START_MARKER = "# BEGIN AUTO HTML CANONICAL ALIASES";
const END_MARKER = "# END AUTO HTML CANONICAL ALIASES";
const INSERT_BEFORE = "# Tool pages: /tools/xyz";
const EOL = "\n";
const FORBIDDEN_GENERATED_ROUTE_PATTERNS = [
  /^\/admin(?:\/|\.|$)/i,
  /^\/docs(?:\/|$)/i,
  /^\/fr\/docs(?:\/|$)/i,
  /^\/scripts(?:\/|$)/i,
  /^\/supabase(?:\/|$)/i,
  /^\/afrotools-mission-control(?:\.html)?$/i,
  /^\/mc-7a2f9x(?:\.html)?$/i,
  /^\/tools\/afrostream\/admin(?:\.html)?$/i,
  /^\/widgets\/iframe\/template(?:\.html)?$/i,
  /^\/fr\/widgets\/iframe\/template(?:\.html)?$/i,
];

function normalizeLf(text) {
  return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parseExistingSources(text) {
  const existing = new Set();

  text.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const source = trimmed.split(/\s+/)[0];
    if (source) existing.add(source);
  });

  return existing;
}

function buildBlock(eol, aliases, existingSources) {
  const rules = aliases
    .filter((alias) => !existingSources.has(alias.source))
    .map((alias) => `${alias.source}  ${alias.target}  301!`);

  const forbiddenRule = rules.find((rule) => {
    const source = rule.trim().split(/\s+/)[0];
    return FORBIDDEN_GENERATED_ROUTE_PATTERNS.some((pattern) => pattern.test(source));
  });

  if (forbiddenRule) {
    throw new Error(`Refusing to generate internal canonical redirect: ${forbiddenRule}`);
  }

  const lines = [
    START_MARKER,
    "# Generated from HTML pages whose preferred canonical route differs from the .html file URL.",
    "# Safe scope only: simple .html aliases plus redirect-like compatibility pages.",
    "# Forced because Netlify otherwise serves existing .html files before applying alias redirects.",
    ...rules,
    END_MARKER,
  ];

  return { block: lines.join(eol), count: rules.length };
}

const original = normalizeLf(fs.readFileSync(REDIRECTS_PATH, "utf8"));
const eol = EOL;
const stripGenerated = original.replace(
  new RegExp(`${START_MARKER}[\\s\\S]*?${END_MARKER}\\r?\\n?`, "m"),
  ""
);
const existingSources = parseExistingSources(stripGenerated);
const aliases = buildCanonicalAliasMap();
const { block, count } = buildBlock(eol, aliases, existingSources);

let next;
if (stripGenerated.includes(INSERT_BEFORE)) {
  const insertBeforeRegex = new RegExp(`${eol}*${escapeRegExp(INSERT_BEFORE)}`);
  next = stripGenerated.replace(insertBeforeRegex, `${eol}${eol}${block}${eol}${eol}${INSERT_BEFORE}`);
} else {
  next = `${stripGenerated.trimEnd()}${eol}${eol}${block}${eol}`;
}

writeFileSyncWithRetry(REDIRECTS_PATH, next, "utf8");

console.log("Generated HTML canonical redirect rules:", count);
console.log(`Updated ${path.relative(ROOT, REDIRECTS_PATH).replace(/\\/g, "/")}`);
