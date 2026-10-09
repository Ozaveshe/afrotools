#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const { writeFileSyncWithRetry } = require("./lib/safe-write");

const { ROOT, buildCanonicalAliasMap } = require("./lib/canonical-aliases");
const routeContract = require("./lib/route-contract");

const REDIRECTS_PATH = path.join(ROOT, "_redirects");
const START_MARKER = "# BEGIN AUTO HTML CANONICAL ALIASES";
const END_MARKER = "# END AUTO HTML CANONICAL ALIASES";
const INSERT_BEFORE = "# Tool pages: /tools/xyz";
const PRIORITY_START_MARKER = "# BEGIN AUTO FRENCH CALCULATOR HTML ALIASES";
const PRIORITY_END_MARKER = "# END AUTO FRENCH CALCULATOR HTML ALIASES";
const PRIORITY_INSERT_BEFORE = "# French fallback redirects";
// These reviewed aliases must precede the broad French-to-English fallback.
// A later forced rule cannot override an earlier matching non-forced rule.
const PRIORITY_SOURCES = new Set([
  "/fr/cape-verde/cv-paye.html",
  "/fr/cape-verde/cv-vat.html",
  "/fr/cote-divoire/ci-paye.html",
  "/fr/eq-guinea/gq-paye.html",
  "/fr/eq-guinea/gq-vat.html",
]);
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

function buildBlock(eol, aliases, existingSources, startMarker = START_MARKER, endMarker = END_MARKER) {
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
    startMarker,
    "# Generated from HTML pages whose preferred canonical route differs from the .html file URL.",
    "# Safe scope only: simple .html aliases plus redirect-like compatibility pages.",
    "# Forced because Netlify otherwise serves existing .html files before applying alias redirects.",
    ...rules,
    endMarker,
  ];

  return { block: lines.join(eol), count: rules.length };
}

const original = normalizeLf(fs.readFileSync(REDIRECTS_PATH, "utf8"));
const eol = EOL;
const stripGenerated = [[START_MARKER, END_MARKER], [PRIORITY_START_MARKER, PRIORITY_END_MARKER]].reduce(
  (text, [start, end]) => text.replace(new RegExp(`${escapeRegExp(start)}[\\s\\S]*?${escapeRegExp(end)}\\r?\\n?`, "m"), ""),
  original
);
const existingSources = parseExistingSources(stripGenerated);
const routeGraph = routeContract.buildRouteGraph();
const aliases = buildCanonicalAliasMap().map((alias) => ({
  ...alias,
  target: routeContract.resolveFinalRoute(routeGraph, alias.target).finalRoute,
}));
const priorityAliases = aliases.filter((alias) => PRIORITY_SOURCES.has(alias.source));
if (!stripGenerated.includes(PRIORITY_INSERT_BEFORE) || priorityAliases.length !== PRIORITY_SOURCES.size ||
    priorityAliases.some((alias) => existingSources.has(alias.source) || !alias.target.startsWith("/fr/"))) {
  throw new Error("Review French calculator alias ownership and fallback anchor before regeneration");
}
const priority = buildBlock(eol, priorityAliases, existingSources, PRIORITY_START_MARKER, PRIORITY_END_MARKER);
const { block, count } = buildBlock(eol, aliases.filter((alias) => !PRIORITY_SOURCES.has(alias.source)), existingSources);

let next;
if (stripGenerated.includes(INSERT_BEFORE)) {
  const insertBeforeRegex = new RegExp(`${eol}*${escapeRegExp(INSERT_BEFORE)}`);
  next = stripGenerated.replace(insertBeforeRegex, `${eol}${eol}${block}${eol}${eol}${INSERT_BEFORE}`);
} else {
  next = `${stripGenerated.trimEnd()}${eol}${eol}${block}${eol}`;
}
next = next.replace(
  new RegExp(`${eol}*${escapeRegExp(PRIORITY_INSERT_BEFORE)}`),
  `${eol}${eol}${priority.block}${eol}${eol}${PRIORITY_INSERT_BEFORE}`
);

writeFileSyncWithRetry(REDIRECTS_PATH, next, "utf8");

console.log("Generated HTML canonical redirect rules:", count + priority.count);
console.log(`Updated ${path.relative(ROOT, REDIRECTS_PATH).replace(/\\/g, "/")}`);
