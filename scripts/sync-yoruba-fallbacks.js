#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const MANIFEST_PATH = path.join(ROOT, "data", "registry", "yoruba-route-manifest.json");
const write = process.argv.includes("--write");
const START = "<!-- yoruba-fallback:start -->";
const END = "<!-- yoruba-fallback:end -->";
const STYLESHEET = '<link rel="stylesheet" href="/assets/css/yoruba-fallback.css" data-yoruba-fallback-style>';

function renderBanner(record) {
  return [
    START,
    '<aside class="yoruba-fallback" data-yoruba-fallback role="note" aria-labelledby="yoruba-fallback-title">',
    '  <div class="yoruba-fallback__inner">',
    '    <h2 id="yoruba-fallback-title">Ìtumọ̀ Yorùbá pípé kò tíì sí fún iṣẹ́ yìí</h2>',
    '    <p>Ojú-ìwé yìí ní àkóónú díẹ̀ ní Yorùbá, ṣùgbọ́n iṣẹ́ pípé ṣì wà ní Gẹ̀ẹ́sì. A kò ní yí èdè padà láì sọ fún ọ.</p>',
    '    <a lang="en" hreflang="en" href="' + record.fallbackRoute + '">Tẹ̀síwájú sí ojú-ìwé Gẹ̀ẹ́sì</a>',
    '  </div>',
    '</aside>',
    END
  ].join("\n");
}

function removeBanner(html) {
  const start = html.indexOf(START);
  const end = html.indexOf(END);
  if (start === -1 && end === -1) return html;
  if (start === -1 || end === -1 || end < start) {
    throw new Error("Malformed Yoruba fallback marker.");
  }
  const before = html.slice(0, start).replace(/\r?\n$/, "");
  const after = html.slice(end + END.length).replace(/^\r?\n/, "");
  return before + after;
}

function setRobots(html, value) {
  const tag = '<meta name="robots" content="' + value + '">';
  const pattern = /<meta\s+name=["']robots["']\s+content=["'][^"']*["']\s*\/?\s*>/i;
  if (pattern.test(html)) return html.replace(pattern, tag);
  return html.replace(/<\/head>/i, "  " + tag + "\n</head>");
}

function removeAlternates(html) {
  return html.replace(/^[ \t]*<link\b[^>]*\brel=["']alternate["'][^>]*>\s*\r?\n?/gim, "");
}

function syncContent(html, record) {
  let output = removeBanner(html);
  output = output.replace(/^[ \t]*<link rel="stylesheet" href="\/assets\/css\/yoruba-fallback\.css" data-yoruba-fallback-style>\s*\r?\n?/gim, "");
  if (!["english-fallback", "unavailable"].includes(record.state)) return output;
  output = setRobots(output, "noindex, follow");
  output = removeAlternates(output);
  const canonical = /<link\b[^>]*\brel=["']canonical["'][^>]*>/i;
  if (canonical.test(output)) {
    output = output.replace(canonical, STYLESHEET + "\n$&");
  } else {
    output = output.replace(/<\/head>/i, "  " + STYLESHEET + "\n</head>");
  }
  const body = output.match(/<body\b[^>]*>/i);
  if (!body) throw new Error(record.sourceOwner + " has no body element.");
  return output.replace(body[0], body[0] + "\n" + renderBanner(record) + "\n");
}

function main() {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
  const changed = [];
  for (const record of manifest.routes || []) {
    const file = path.join(ROOT, record.sourceOwner);
    const before = fs.readFileSync(file, "utf8");
    const after = syncContent(before, record);
    if (before === after) continue;
    changed.push(record.sourceOwner);
    if (write) fs.writeFileSync(file, after, "utf8");
  }
  if (changed.length && !write) {
    console.error("Yoruba fallback surfaces are stale: " + changed.join(", "));
    process.exitCode = 1;
    return;
  }
  console.log((write ? "Synchronized" : "Validated") + " Yoruba fallback surfaces in " + changed.length + " file(s).");
}

if (require.main === module) main();

module.exports = { renderBanner, syncContent };
