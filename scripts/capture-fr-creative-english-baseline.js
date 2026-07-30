"use strict";

const crypto = require("node:crypto");
const childProcess = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const INVENTORY = path.join(
  ROOT,
  "reports",
  "french-free-app-parity-inventory.json"
);
const OUTPUT = path.join(
  ROOT,
  "data",
  "localization",
  "fr-creative-english-baseline.json"
);

const WORKFLOW_EXPECTATIONS = Object.freeze({
  "african-palette": "module.exports|colors",
  "art-commission": "₦29,000",
  "book-publishing-cost": "$1,200.00",
  "engagement-rate": "3.6%",
  "linkedin-optimizer": "PROFILE SCORE",
  "music-royalty-splitter": "Royalty Split|Total Royalties",
  "personal-brand-audit": "2 / 100",
  "photography-pricing": "₦100,000",
  "podcast-monetization": "$372.5",
  "self-publishing-royalty": "$559.44",
  "social-media-calendar": "TOTAL POSTS 13",
  "wedding-photo-package": "₦200,000",
});

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function readFoundation(relativePath) {
  return childProcess.execFileSync(
    "git",
    [
      "show",
      `8ce5cac175e42201968b1f7540752d6acf92d4ca:${relativePath.replace(/\\/g, "/")}`,
    ],
    { cwd: ROOT, encoding: "utf8", maxBuffer: 16 * 1024 * 1024 }
  );
}

function executableInlineScripts(html) {
  return Array.from(
    html.matchAll(/<script(?<attrs>[^>]*)>(?<body>[\s\S]*?)<\/script>/gi)
  )
    .filter((match) => {
      const attrs = match.groups.attrs || "";
      return !/\bsrc\s*=/i.test(attrs) && !/application\/ld\+json/i.test(attrs);
    })
    .map((match) => match.groups.body.replace(/\r\n/g, "\n"));
}

function extractedControllerSource(value) {
  return `${value.replace(/^\n/, "").replace(/\s+$/, "")}\n`;
}

function externalScripts(html) {
  return Array.from(
    html.matchAll(/<script[^>]+\bsrc=["']([^"']+)["'][^>]*><\/script>/gi),
    (match) => match[1]
  );
}

function structuralHtml(html) {
  return html.replace(
    /<script(?![^>]*\bsrc\s*=)(?![^>]*application\/ld\+json)[^>]*>[\s\S]*?<\/script>/gi,
    "<!-- CREATIVE_EXECUTABLE_OWNER -->"
  );
}

function captureFile(relativePath) {
  const html = readFoundation(relativePath);
  const inline = executableInlineScripts(html);
  return {
    file: relativePath.replace(/\\/g, "/"),
    sha256: sha256(html.replace(/\r\n/g, "\n")),
    inlineScriptCount: inline.length,
    inlineScriptSha256: inline.map((script) =>
      sha256(extractedControllerSource(script))
    ),
    structuralSha256: sha256(
      structuralHtml(html).replace(/\r\n/g, "\n")
    ),
    externalScripts: externalScripts(html),
  };
}

const inventory = JSON.parse(fs.readFileSync(INVENTORY, "utf8"));
const rows = inventory.rows.filter((row) => row.categoryKey === "creative");

if (rows.length !== 46) {
  throw new Error(`Expected 46 Creative Economy rows, found ${rows.length}`);
}

const owners = rows.map((row) => {
  const id = row.englishId;
  const files = [captureFile(path.join("tools", id, "index.html"))];
  const appFile = path.join(ROOT, "tools", id, "app.html");
  if (fs.existsSync(appFile)) {
    files.push(captureFile(path.join("tools", id, "app.html")));
  }
  return {
    id,
    englishRoute: row.englishRoute,
    preExtractionFrenchState: row.state,
    files,
    deterministicBrowserExpectation: WORKFLOW_EXPECTATIONS[id] || null,
  };
});

const payload = {
  schemaVersion: 1,
  foundationCommit: "8ce5cac175e42201968b1f7540752d6acf92d4ca",
  category: "Creative Economy",
  exactOwnerCount: owners.length,
  capturePolicy:
    "Immutable pre-extraction source receipt. Behavioral acceptance additionally requires the scoped browser and oracle suites.",
  owners,
};

fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
fs.writeFileSync(OUTPUT, `${JSON.stringify(payload, null, 2)}\n`);
console.log(path.relative(ROOT, OUTPUT).replace(/\\/g, "/"));
