#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const OUTPUT = path.join(
  ROOT,
  "data/localization/sw-coordinator-accepted-rows-2026-08-08-wave2.json",
);

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), "utf8"));
}

function normalizeRoute(value) {
  const route = String(value || "")
    .replace(/^https?:\/\/[^/]+/i, "")
    .replace(/\/index\.html$/i, "")
    .replace(/\.html$/i, "")
    .replace(/\/+/g, "/");
  return `/${route.replace(/^\/+|\/+$/g, "")}/`;
}

function acceptedRows({ path: receiptPath, pointer, statusKey, acceptedValues, idKey, routeKey }) {
  const document = readJson(receiptPath);
  const rows = pointer.split("/").filter(Boolean).reduce((value, key) => value[key], document);
  if (!Array.isArray(rows)) throw new Error(`${receiptPath} ${pointer} is not an array.`);
  return rows
    .filter((row) => acceptedValues.includes(row[statusKey]))
    .map((row) => ({ englishId: row[idKey], swahiliRoute: normalizeRoute(row[routeKey]) }));
}

function manifestRows(relativePath) {
  const document = readJson(relativePath);
  if (!Array.isArray(document.routes)) throw new Error(`${relativePath} /routes is not an array.`);
  return document.routes.map((row) => ({
    englishId: row.id,
    swahiliRoute: normalizeRoute(row.swahili),
  }));
}

const candidates = {
  creativeImage: acceptedRows({
    path: "reports/sw-creative-image-parity-candidate-receipt.json",
    pointer: "/rows",
    statusKey: "status",
    acceptedValues: ["accepted-candidate"],
    idKey: "englishId",
    routeKey: "swahiliRoute",
  }),
  educationDeveloper: [
    ...manifestRows("data/localization/sw-education-parity.json"),
    ...manifestRows("data/localization/sw-developer-parity.json"),
  ],
  fintechSmallBusiness: acceptedRows({
    path: "reports/sw-fintech-small-business-candidate-receipt.json",
    pointer: "/entries",
    statusKey: "state",
    acceptedValues: ["accepted"],
    idKey: "englishId",
    routeKey: "swahiliRoute",
  }),
  energy: acceptedRows({
    path: "reports/sw-engineering-energy-transport-candidate-receipt-2026-08-08.json",
    pointer: "/apps",
    statusKey: "status",
    acceptedValues: ["accepted-candidate"],
    idKey: "englishId",
    routeKey: "swahiliRoute",
  }),
  religiousCulturalAfrican: acceptedRows({
    path: "data/localization/sw-religious-cultural-african-lane-candidate.json",
    pointer: "/rows",
    statusKey: "status",
    acceptedValues: ["candidate-accepted"],
    idKey: "englishId",
    routeKey: "swahiliRoute",
  }),
  agricultureTrade: acceptedRows({
    path: "reports/sw-agriculture-trade-parity-candidate-2026-08-08.json",
    pointer: "/apps",
    statusKey: "status",
    acceptedValues: ["accepted"],
    idKey: "id",
    routeKey: "swahili",
  }),
  financialShardB: acceptedRows({
    path: "reports/swahili-financial-shard-b-candidate-receipt.json",
    pointer: "/rows",
    statusKey: "status",
    acceptedValues: ["accepted"],
    idKey: "englishId",
    routeKey: "swahiliRoute",
  }),
  financialShardA: acceptedRows({
    path: "data/localization/sw-financial-shard-a-candidate.json",
    pointer: "/rows",
    statusKey: "status",
    acceptedValues: ["accepted"],
    idKey: "englishId",
    routeKey: "swahiliRoute",
  }),
};

const expected = {
  creativeImage: 4,
  educationDeveloper: 58,
  fintechSmallBusiness: 57,
  energy: 17,
  religiousCulturalAfrican: 25,
  agricultureTrade: 36,
  financialShardB: 16,
  financialShardA: 14,
};

const ids = new Set();
const routes = new Set();
for (const [key, rows] of Object.entries(candidates)) {
  if (rows.length !== expected[key]) {
    throw new Error(`${key} expected ${expected[key]} accepted rows, found ${rows.length}.`);
  }
  for (const row of rows) {
    if (!row.englishId || !row.swahiliRoute.startsWith("/sw/")) {
      throw new Error(`${key} contains an invalid accepted row.`);
    }
    if (ids.has(row.englishId)) throw new Error(`Duplicate accepted English ID: ${row.englishId}.`);
    if (routes.has(row.swahiliRoute)) throw new Error(`Duplicate accepted Swahili route: ${row.swahiliRoute}.`);
    ids.add(row.englishId);
    routes.add(row.swahiliRoute);
  }
}

const output = {
  schemaVersion: 1,
  programme: "swahili-free-app-parity-coordinator-wave2-accepted-rows",
  generatedFrom: "eight independently reviewed candidate receipts and manifests",
  totalAcceptedRows: ids.size,
  candidates,
};

fs.writeFileSync(OUTPUT, `${JSON.stringify(output, null, 2)}\n`, "utf8");
console.log(`Built ${ids.size} fail-closed coordinator accepted rows.`);
