#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const WRITE = process.argv.includes("--write");
const LEDGER_PATH = path.join(ROOT, "data/audits/swahili-free-app-acceptance.json");
const RECEIPT_PATH = path.join(ROOT, "reports/swahili-trade-utility-acceptance-receipt.json");
const BROWSER_SPEC = "tests/e2e/sw-trade-utility-product.spec.js";
const ENGINE_TEST = "tests/sw-trade-utility-product.test.js";
const { PAGES, html } = require("./build-sw-trade-utility-pages.js");

const expected = new Map([
  ["proforma-invoice", { route: "/sw/zana/ankara-proforma/", formats: ["pdf", "csv", "json"] }],
  ["packing-list", { route: "/sw/zana/orodha-ya-kupakia/", formats: ["pdf", "csv", "json"] }],
  ["bol-generator", { route: "/sw/zana/bill-of-lading/", formats: ["pdf", "txt"] }],
  ["customs-time", { route: "/sw/zana/muda-wa-kupitisha-forodha/", formats: ["csv"] }],
  ["shipping-weight", { route: "/sw/zana/uzito-wa-usafirishaji/", formats: ["txt"] }],
  ["cross-border-data", { route: "/sw/zana/uhamishaji-data-mpaka/", formats: ["pdf", "json"] }]
]);

const ledger = JSON.parse(fs.readFileSync(LEDGER_PATH, "utf8"));
const receipt = JSON.parse(fs.readFileSync(RECEIPT_PATH, "utf8"));
if (!Array.isArray(ledger.entries)) throw new Error("Acceptance ledger entries are missing.");
if (!Array.isArray(receipt.acceptedRows)) throw new Error("Trade acceptance receipt rows are missing.");
if (receipt.totals?.scoped !== 6 || receipt.totals?.accepted !== 6 || receipt.totals?.blocked !== 0) {
  throw new Error("Trade receipt totals must be exactly 6 scoped, 6 accepted and 0 blocked.");
}
if (receipt.acceptedRows.length !== expected.size || PAGES.length !== expected.size) {
  throw new Error("Trade source owners and receipt must contain exactly six rows.");
}

const requiredCommonProof = [
  "nativeRuntimeSwahili",
  "englishProductDepthPreserved",
  "exactDeterministicOracles",
  "invalidOrChangedInputClearsPriorResult",
  "dirtyOrInvalidExportFailsClosed",
  "allAdvertisedFormatsParsedAndReopened",
  "mobile320",
  "mobile375",
  "reflow200Percent",
  "systemLightDark",
  "manualLightDark",
  "keyboardAndFocus",
  "labelsAndLiveRegion",
  "canonicalOgSchema",
  "reciprocalHreflang",
  "artworkExists",
  "internalCandidateCopyAbsent",
  "sharedAiHandoffWorks"
];
for (const key of requiredCommonProof) {
  if (receipt.commonProof?.[key] !== true) throw new Error(`Trade receipt lacks common proof: ${key}`);
}
if (receipt.commonProof?.unexpectedNetworkRequests !== 0 || receipt.commonProof?.consoleErrors !== 0) {
  throw new Error("Trade receipt is not console/network clean.");
}

for (const relativePath of [
  BROWSER_SPEC,
  ENGINE_TEST,
  "tests/sw-trade-utility.playwright.config.js",
  "assets/js/pages/sw-trade-utility.js",
  "assets/css/sw-trade-utility.css",
  "engines/src/trade-utility-engine.js"
]) {
  if (!fs.existsSync(path.join(ROOT, relativePath))) throw new Error(`Missing Trade proof/owner: ${relativePath}`);
}

const pagesById = new Map(PAGES.map((page) => [page.id, page]));
const receiptById = new Map(receipt.acceptedRows.map((row) => [row.englishId, row]));
if (pagesById.size !== expected.size || receiptById.size !== expected.size) {
  throw new Error("Trade source owners or receipt contain duplicate IDs.");
}

for (const [englishId, contract] of expected) {
  const page = pagesById.get(englishId);
  const accepted = receiptById.get(englishId);
  if (!page || !accepted || accepted.status !== "accepted") {
    throw new Error(`${englishId} lacks one accepted source-owner row.`);
  }
  if (page.route !== contract.route || accepted.swahiliRoute !== contract.route) {
    throw new Error(`${englishId} has a conflicting Swahili route.`);
  }
  if (JSON.stringify(accepted.advertisedFormats) !== JSON.stringify(contract.formats)
    || JSON.stringify(accepted.parsedAndReopenedFormats) !== JSON.stringify(contract.formats)) {
    throw new Error(`${englishId} does not have exact parsed/reopened export proof.`);
  }

  const swPath = path.join(ROOT, ...contract.route.split("/").filter(Boolean), "index.html");
  const enPath = path.join(ROOT, ...page.englishRoute.split("/").filter(Boolean), "index.html");
  const sw = fs.readFileSync(swPath, "utf8");
  const en = fs.readFileSync(enPath, "utf8");
  if (sw !== html(page)) throw new Error(`${englishId} generated owner is stale.`);
  if (!en.includes(`hreflang="sw" href="https://afrotools.com${contract.route}"`)) {
    throw new Error(`${englishId} English owner lacks reciprocal Swahili hreflang.`);
  }

  const desiredEntry = {
    englishId,
    swahiliRoute: contract.route,
    status: "accepted",
    categoryKey: "trade",
    evidence: {
      browserSpec: BROWSER_SPEC,
      engineTest: ENGINE_TEST,
      workflow: accepted.workflow,
      export: `${contract.formats.map((format) => format.toUpperCase()).join(", ")} downloads were parsed and reopened; changed or invalid input disables stale exports.`
    }
  };
  const matches = ledger.entries.filter((entry) => entry.englishId === englishId);
  if (matches.length > 1) throw new Error(`Duplicate acceptance rows for ${englishId}.`);
  if (matches.length === 0) ledger.entries.push(desiredEntry);
  else ledger.entries[ledger.entries.findIndex((entry) => entry.englishId === englishId)] = desiredEntry;
}

const ids = ledger.entries.map((entry) => entry.englishId);
if (new Set(ids).size !== ids.length) throw new Error("Acceptance ledger contains duplicate IDs.");

const desired = `${JSON.stringify(ledger, null, 2)}\n`;
const current = fs.readFileSync(LEDGER_PATH, "utf8");
if (current !== desired) {
  if (!WRITE) throw new Error("Trade acceptance ledger is stale. Run with --write.");
  fs.writeFileSync(LEDGER_PATH, desired, "utf8");
}

console.log(`${WRITE ? "Recorded" : "Verified"} six accepted Swahili Trade utilities.`);
