#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const IGNORE_DIRS = new Set([
  ".git",
  ".claude",
  ".jamb",
  ".jamb-tools",
  "node_modules",
  "afrotools-deploy",
]);

const ALIASES = {
  "/nigeria/ng-paye": "/nigeria/ng-salary-tax",
  "/kenya/ke-salary-tax": "/kenya/ke-paye",
  "/south-africa/za-salary-tax": "/south-africa/za-paye",
  "/blog/import-duty-kenya-2026/": "/blog/import-duty-calculator-kenya-2026/",
  "/tools/paye-calculator/": "/salary-tax/",
  "/tools/salary-tax/": "/salary-tax/",
  "/tools/salary-calculator/": "/salary-tax/",
  "/tools/vat-calculator/vat-calc": "/tools/vat-calculator/",
  "/categories/financial/": "/salary-tax/",
  "/fr/tools/paye-calculator/": "/fr/tools/calculateur-paye/",
  "/fr/tools/vat-calculator/": "/fr/tools/calculateur-tva/",
  "/fr/tools/vat-calculator/vat-calc": "/fr/tools/calculateur-tva/",
  "/fr/tools/import-duty/": "/fr/tools/droits-douane/",
  "/fr/tools/mobile-money-fees/": "/fr/tools/frais-mobile-money/",
  "/fr/tools/remittance-compare/": "/fr/tools/transfert-argent/",
  "/fr/tools/remittance-v2/": "/fr/tools/transfert-v2/",
  "/fr/tools/japa-calculator/": "/fr/tools/calculateur-japa/",
  "/fr/tools/cv-builder/": "/fr/tools/generateur-cv/",
  "/fr/tools/pdf-workspace/": "/fr/tools/espace-pdf/",
  "/fr/tools/waec-calculator/": "/fr/tools/calculateur-waec/",
  "/fr/tools/education-hub/": "/fr/tools/hub-education/",
  "/fr/tools/gpa-calculator/": "/fr/tools/calculateur-gpa/",
  "/fr/tools/jamb-aggregate/": "/fr/tools/calculateur-jamb/",
  "/fr/tools/ielts-calculator/": "/fr/tools/calculateur-ielts/",
  "/fr/tools/scholarship-finder/": "/fr/tools/recherche-bourses/",
  "/fr/tools/study-planner/": "/fr/tools/planificateur-etudes/",
  "/fr/tools/fuel-tracker/": "/fr/tools/suivi-carburant/",
  "/fr/tools/afrorates/": "/fr/tools/afrotaux/",
};

function findHtmlFiles(dir) {
  const files = [];
  let entries;

  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (error) {
    return files;
  }

  for (const entry of entries) {
    if (IGNORE_DIRS.has(entry.name)) continue;
    if (entry.name.startsWith(".") && entry.name !== ".well-known") continue;

    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...findHtmlFiles(full));
    } else if (entry.isFile() && entry.name.endsWith(".html")) {
      files.push(full);
    }
  }

  return files;
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildVariants(from, to) {
  const variants = [[from, to]];

  if (from.endsWith("/") && !to.endsWith("/")) {
    variants.push([from.slice(0, -1), to]);
  } else if (!from.endsWith("/") && to.endsWith("/")) {
    variants.push([from + "/", to]);
  } else if (!from.endsWith("/") && !to.endsWith("/")) {
    variants.push([from + "/", to]);
  }

  return variants;
}

function rewriteHrefAliases(html) {
  let next = html;
  let replacements = 0;

  for (const [from, to] of Object.entries(ALIASES)) {
    for (const [variantFrom, variantTo] of buildVariants(from, to)) {
      const pattern = new RegExp('(href=["\\\'])' + escapeRegex(variantFrom) + '((?:[?#][^"\\\']*)?["\\\'])', "g");
      next = next.replace(pattern, function (_match, prefix, suffix) {
        replacements += 1;
        return prefix + variantTo + suffix;
      });
    }
  }

  return { html: next, replacements };
}

function main() {
  const files = findHtmlFiles(ROOT);
  const changedFiles = [];
  let totalReplacements = 0;

  for (const file of files) {
    const html = fs.readFileSync(file, "utf8");
    const result = rewriteHrefAliases(html);

    if (!result.replacements) continue;

    fs.writeFileSync(file, result.html, "utf8");
    totalReplacements += result.replacements;
    changedFiles.push(path.relative(ROOT, file).replace(/\\/g, "/"));
  }

  console.log("SEO alias href replacements:", totalReplacements);
  console.log("Files patched:", changedFiles.length);
  changedFiles.slice(0, 20).forEach((file) => console.log("  " + file));
  if (changedFiles.length > 20) {
    console.log("  ... and " + (changedFiles.length - 20) + " more");
  }
}

main();
