#!/usr/bin/env node
"use strict";

const fs = require("fs");

const {
  ROOT,
  SITE_ORIGIN,
  buildCanonicalAliasMap,
  relativeHtmlPath,
  walkHtmlFiles,
} = require("./lib/canonical-aliases");

const aliases = buildCanonicalAliasMap();
const aliasMap = new Map();

for (const alias of aliases) {
  aliasMap.set(alias.source, alias.target);
  aliasMap.set(`${SITE_ORIGIN}${alias.source}`, `${SITE_ORIGIN}${alias.target}`);
}

const HREF_RE =
  /href\s*=\s*(["'])(https:\/\/afrotools\.com\/[^"'?#]+\.html\/?|\/[^"'?#]+\.html\/?)((?:[?#][^"']*)?)\1/gi;

let totalReplacements = 0;
const changedFiles = [];

for (const filePath of walkHtmlFiles(ROOT)) {
  const original = fs.readFileSync(filePath, "utf8");
  let replacements = 0;

  const next = original.replace(HREF_RE, (match, quote, href, suffix) => {
    const aliasKey = href.endsWith(".html/") ? href.slice(0, -1) : href;
    const target = aliasMap.get(aliasKey);
    if (!target) return match;
    replacements += 1;
    return `href=${quote}${target}${suffix}${quote}`;
  });

  if (!replacements || next === original) continue;

  fs.writeFileSync(filePath, next, "utf8");
  totalReplacements += replacements;
  changedFiles.push(relativeHtmlPath(filePath));
}

console.log("Canonical alias href replacements:", totalReplacements);
console.log("Files patched:", changedFiles.length);
changedFiles.slice(0, 30).forEach((file) => console.log(`  ${file}`));
if (changedFiles.length > 30) {
  console.log(`  ... and ${changedFiles.length - 30} more`);
}
