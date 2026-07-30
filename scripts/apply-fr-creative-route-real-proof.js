"use strict";

const fs = require("node:fs");
const path = require("node:path");
const {
  frenchRouteForEnglishToolSource,
} = require("./lib/french-tool-route-map.js");

const ROOT = path.resolve(__dirname, "..");
const BASELINE = require("../data/localization/fr-creative-english-baseline.json");
const STYLESHEET = "/assets/css/fr-creative-route-real-proof.css";
const PRIVACY_BOOTSTRAP =
  "/assets/js/pages/creative/fr-creative-privacy-bootstrap.js";
const SCRIPT = "/assets/js/pages/creative/fr-creative-route-real-reflow.js";
const CONSENT_ANALYTICS =
  "/assets/js/pages/creative/fr-creative-consent-analytics.js";
const LINK = `  <link rel="stylesheet" href="${STYLESHEET}">`;
const PRIVACY_BOOTSTRAP_TAG =
  `  <script src="${PRIVACY_BOOTSTRAP}"></script>`;
const SCRIPT_TAG = `  <script src="${SCRIPT}" defer></script>`;
const CONSENT_ANALYTICS_TAG =
  `  <script src="${CONSENT_ANALYTICS}" defer></script>`;
const PRIVACY_POLICY =
  "default-src 'self'; script-src 'self' 'unsafe-inline' blob:; "
  + "style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; "
  + "media-src 'self' data: blob:; connect-src 'self'; font-src 'self' data:; "
  + "worker-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self'";
const PRIVACY_META =
  `  <meta http-equiv="Content-Security-Policy" content="${PRIVACY_POLICY}">`;
const write = process.argv.includes("--write");

function targetFiles() {
  const files = [];
  for (const owner of BASELINE.owners) {
    const route = frenchRouteForEnglishToolSource(`tools/${owner.id}`);
    if (!route) throw new Error(`Missing French Creative mapping for ${owner.id}`);
    const directory = path.join(ROOT, route.replace(/^\/+/, ""));
    files.push(path.join(directory, "index.html"));
    if (owner.id.startsWith("creator-")) files.push(path.join(directory, "app.html"));
  }
  return files;
}

const changed = [];
for (const file of targetFiles()) {
  if (!fs.existsSync(file)) throw new Error(`Missing French Creative route file: ${file}`);
  let updated = fs.readFileSync(file, "utf8");
  if (!/<\/head>/i.test(updated)) throw new Error(`Missing </head> in ${file}`);
  if (!updated.includes(STYLESHEET)) {
    updated = updated.replace(/<\/head>/i, `${LINK}\n</head>`);
  }
  if (!updated.includes(SCRIPT)) {
    updated = updated.replace(/<\/head>/i, `${SCRIPT_TAG}\n</head>`);
  }
  updated = updated.replace(
    /<script\b[^>]*\bsrc=["'][^"']*\/assets\/js\/lazy-analytics\.js[^"']*["'][^>]*><\/script>/gi,
    CONSENT_ANALYTICS_TAG
  );
  updated = updated.replace(
    /\s*<link\b[^>]*\bhref=["']https:\/\/fonts\.(?:googleapis|gstatic)\.com(?:\/[^"']*)?["'][^>]*>\s*/gi,
    "\n"
  );
  updated = updated.replace(
    /\s*<link\b(?=[^>]*\brel=["']preconnect["'])(?=[^>]*\bhref=["']https:\/\/)[^>]*>\s*/gi,
    "\n"
  );
  if (!updated.includes(CONSENT_ANALYTICS)) {
    updated = updated.replace(/<\/head>/i, `${CONSENT_ANALYTICS_TAG}\n</head>`);
  }
  if (!/http-equiv=["']Content-Security-Policy["']/i.test(updated)) {
    updated = updated.replace(/<head>/i, `<head>\n${PRIVACY_META}`);
  }
  if (!updated.includes(PRIVACY_BOOTSTRAP)) {
    updated = updated.replace(
      /(<meta\b[^>]*http-equiv=["']Content-Security-Policy["'][^>]*>)/i,
      `$1\n${PRIVACY_BOOTSTRAP_TAG}`
    );
  }
  const source = fs.readFileSync(file, "utf8");
  if (updated === source) continue;
  changed.push(path.relative(ROOT, file).replaceAll("\\", "/"));
  if (write) fs.writeFileSync(file, updated, "utf8");
}

if (changed.length && !write) {
  console.error(`French Creative route-real assets missing from ${changed.length} routes:`);
  for (const file of changed) console.error(`- ${file}`);
  process.exitCode = 1;
} else {
  console.log(
    `French Creative route-real stylesheet ${write ? "applied to" : "verified on"} `
      + `${targetFiles().length} physical routes.`
  );
}
