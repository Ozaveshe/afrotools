#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const WRITE = process.argv.includes("--write");
const idIndex = process.argv.indexOf("--id");
const requestedId = idIndex >= 0 ? process.argv[idIndex + 1] : "";

if (!requestedId) {
  throw new Error("Pass exactly one app with --id <englishId>.");
}

const LEDGER_PATH = path.join(ROOT, "data/audits/swahili-free-app-acceptance.json");
const OWNERS_PATH = path.join(ROOT, "data/localization/sw-finance-remainder-native-owners.json");
const RECEIPT_PATH = path.join(ROOT, "reports/swahili-finance-remainder-crypto-address-receipt.json");

const ledger = JSON.parse(fs.readFileSync(LEDGER_PATH, "utf8"));
const owners = JSON.parse(fs.readFileSync(OWNERS_PATH, "utf8"));
const receipt = JSON.parse(fs.readFileSync(RECEIPT_PATH, "utf8"));

if (!Array.isArray(ledger.entries)) throw new Error("Acceptance ledger entries are missing.");
if (!Array.isArray(owners.rows)) throw new Error("Finance native-owner rows are missing.");
if (!Array.isArray(receipt.acceptedRows)) throw new Error("Finance acceptance receipt rows are missing.");

const ownerRows = owners.rows.filter((row) => row.englishId === requestedId);
const receiptRows = receipt.acceptedRows.filter((row) => row.englishId === requestedId);
if (ownerRows.length !== 1) {
  throw new Error(`Expected one native owner for ${requestedId}, found ${ownerRows.length}.`);
}
if (receipt.acceptedRows.length !== 1 || receiptRows.length !== 1) {
  throw new Error(`Receipt must accept only ${requestedId}.`);
}
if (receipt.totals?.scoped !== 1 || receipt.totals?.accepted !== 1 || receipt.totals?.blocked !== 0) {
  throw new Error("Receipt totals must be exactly 1 scoped, 1 accepted and 0 blocked.");
}

const owner = ownerRows[0];
const accepted = receiptRows[0];
if (owner.acceptanceStatus !== "accepted" || accepted.status !== "accepted") {
  throw new Error(`${requestedId} is not accepted by both source-owned contracts.`);
}
if (owner.swahiliRoute.replace(/\/?$/, "/") !== accepted.swahiliRoute.replace(/\/?$/, "/")) {
  throw new Error(`${requestedId} has conflicting Swahili routes.`);
}

const requiredFiles = new Set([
  owner.sourceOwner,
  owner.engineOwner,
  owner.controllerOwner,
  owner.aiContextOwner,
  ...Object.values(owner.localeOwners || {}),
  ...Object.values(owner.proof || {}),
  ...(accepted.tests || []),
]);
for (const relativePath of requiredFiles) {
  if (!relativePath || !fs.existsSync(path.join(ROOT, relativePath))) {
    throw new Error(`Missing proof or owner file for ${requestedId}: ${relativePath || "(empty)"}`);
  }
}

const requiredProof = [
  "exactDeterministicValues",
  "invalidOrChangedInputClearsPriorResult",
  "invalidCopyShareExportFailClosed",
  "nativeRuntimeSwahili",
  "visibleEnglishRemoved",
  "rawAddressRedactedFromExport",
  "noInputPersistence",
  "noInputInUrl",
  "noValidationNetwork",
  "aiSensitiveInputNeverSent",
  "reciprocalHreflang",
  "canonicalOgSchema",
  "artworkExists",
  "mobile320",
  "mobile375",
  "reflow200Percent",
  "systemLightDark",
  "manualLightDark",
  "keyboardAndFocus",
  "labelsAndLiveRegion",
];
for (const key of requiredProof) {
  if (accepted.proof?.[key] !== true) throw new Error(`${requestedId} receipt lacks proof: ${key}`);
}
if (accepted.proof?.consoleErrors !== 0 || accepted.proof?.networkFailures !== 0) {
  throw new Error(`${requestedId} receipt is not console/network clean.`);
}
if (
  JSON.stringify(accepted.proof?.advertisedNativeFormats) !== JSON.stringify(["clipboard-text"])
  || JSON.stringify(accepted.proof?.parsedAndReopenedNativeFormats) !== JSON.stringify(["clipboard-text"])
) {
  throw new Error(`${requestedId} export proof must be exactly one parsed clipboard-text receipt.`);
}

const matchingLedgerRows = ledger.entries.filter((entry) => entry.englishId === requestedId);
if (matchingLedgerRows.length > 1) {
  throw new Error(`Duplicate acceptance ledger rows for ${requestedId}.`);
}

const desiredEntry = {
  englishId: requestedId,
  swahiliRoute: accepted.swahiliRoute,
  status: "accepted",
  categoryKey: "financial",
  evidence: {
    browserSpec: "tests/e2e/swahili-wallet-address-validator-vip.spec.js",
    engineTest: "tests/wallet-address-validator-contract.test.js",
    workflow: "BTC, EVM, Solana and TRON valid, invalid, checksum and boundary states; changed input removes visible and portable stale results; the native route is discoverable from the Swahili crypto hub and all-tools search.",
    export: "The only advertised export is a redacted clipboard-text receipt; it was copied, parsed and reopened with the full address absent and without persistence or network transmission.",
  },
};

if (matchingLedgerRows.length === 0) {
  ledger.entries.push(desiredEntry);
} else {
  const index = ledger.entries.findIndex((entry) => entry.englishId === requestedId);
  ledger.entries[index] = desiredEntry;
}

const ids = ledger.entries.map((entry) => entry.englishId);
if (new Set(ids).size !== ids.length) throw new Error("Acceptance ledger contains duplicate IDs.");

const desired = `${JSON.stringify(ledger, null, 2)}\n`;
const current = fs.readFileSync(LEDGER_PATH, "utf8");
if (current !== desired) {
  if (!WRITE) throw new Error(`Acceptance ledger is stale for ${requestedId}. Run with --write.`);
  fs.writeFileSync(LEDGER_PATH, desired, "utf8");
}

console.log(`${WRITE ? "Recorded" : "Verified"} accepted Swahili app: ${requestedId}.`);
