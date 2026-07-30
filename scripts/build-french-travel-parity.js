#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const { PAGES, renderPage, renderHub } = require("./lib/french-travel-pages");

const ROOT = path.resolve(__dirname, "..");
const CHECK = process.argv.includes("--check");
const slugArg = process.argv.find((argument) => argument.startsWith("--slugs="));
const requestedSlugs = slugArg
  ? new Set(slugArg.slice("--slugs=".length).split(",").map((slug) => slug.trim()).filter(Boolean))
  : null;

function ownedMarkers(content) {
  const patterns = [
    /<meta name="afrotools-content-id"[^>]*>/,
    /<meta name="afrotools-source-owner"[^>]*>/,
    /<link rel="canonical"[^>]*>/,
    /<script type="application\/json" id="fr-travel-config">[\s\S]*?<\/script>/,
    /data-fr-travel-app="[^"]+"/
  ];
  return patterns.map((pattern) => content.match(pattern)?.[0]).filter(Boolean);
}

function formFieldNames(content) {
  const form = content.match(/<form\b[^>]*data-fr-travel-form[\s\S]*?<\/form>/i)?.[0] || "";
  return [...form.matchAll(/\bname="([^"]+)"/g)].map((match) => match[1]).sort();
}

function verifyOwnedOutput(relativePath, current, expected) {
  for (const marker of ownedMarkers(expected)) {
    if (!current.includes(marker)) {
      throw new Error(`${relativePath} is stale at source-owned marker: ${marker.slice(0, 120)}`);
    }
  }
  const expectedFields = formFieldNames(expected);
  const currentFields = formFieldNames(current);
  if (JSON.stringify(currentFields) !== JSON.stringify(expectedFields)) {
    throw new Error(`${relativePath} has stale source-owned form fields.`);
  }
  const expectedToolLinks = [...expected.matchAll(/href="(\/fr\/tools\/[^"]+\/)"/g)].map((match) => match[1]);
  for (const href of expectedToolLinks) {
    if (!current.includes(`href="${href}"`)) {
      throw new Error(`${relativePath} is missing source-owned route ${href}.`);
    }
  }
}

function verifyOrWrite(relativePath, content) {
  const file = path.join(ROOT, relativePath);
  const current = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
  if (CHECK) {
    verifyOwnedOutput(relativePath, current, content);
    return;
  }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content, "utf8");
}

function main() {
  const selectedPages = requestedSlugs
    ? PAGES.filter((page) => requestedSlugs.has(page.frSlug) || requestedSlugs.has(page.enSlug))
    : PAGES;
  if (requestedSlugs) {
    const matched = new Set(selectedPages.flatMap((page) => [page.frSlug, page.enSlug]));
    const unknown = [...requestedSlugs].filter((slug) => slug !== "hub" && !matched.has(slug));
    if (unknown.length) throw new Error(`Unknown French Travel slug(s): ${unknown.join(", ")}`);
  }
  selectedPages.forEach((page) => verifyOrWrite(`fr/tools/${page.frSlug}/index.html`, renderPage(page)));
  if (!requestedSlugs || requestedSlugs.has("hub")) {
    verifyOrWrite("fr/travel/index.html", renderHub());
  }
  console.log(`${CHECK ? "Checked" : "Generated"} ${selectedPages.length} French Travel app(s)${!requestedSlugs || requestedSlugs.has("hub") ? " and the exact hub" : ""}.`);
}

try { main(); } catch (error) { console.error(error.message); process.exitCode = 1; }
