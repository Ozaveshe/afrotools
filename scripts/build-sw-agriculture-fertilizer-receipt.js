"use strict";

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const MANIFEST_FILE = "data/localization/sw-agriculture-parity-manifest.json";
const BROWSER_FILE = "reports/sw-agriculture-acceptance/fertilizer-browser.json";
const RECEIPT_FILE = "reports/sw-agriculture-acceptance/fertilizer.json";
const ARTWORK_FILE = "reports/sw-agriculture-acceptance/fertilizer-artwork.json";
const BASELINE_SHA = "4c4c06e068cf1d868f3a44d88935d22f1dc400ea";

function sha256(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(path.join(ROOT, file))).digest("hex");
}

function webpDimensions(file) {
  const buffer = fs.readFileSync(path.join(ROOT, file));
  if (
    buffer.length < 30
    || buffer.toString("ascii", 0, 4) !== "RIFF"
    || buffer.toString("ascii", 8, 12) !== "WEBP"
  ) {
    throw new Error(`Artwork is not a valid WebP container: ${file}`);
  }
  const chunk = buffer.toString("ascii", 12, 16);
  if (chunk === "VP8X") {
    return { width: 1 + buffer.readUIntLE(24, 3), height: 1 + buffer.readUIntLE(27, 3) };
  }
  if (chunk === "VP8 ") {
    return { width: buffer.readUInt16LE(26) & 0x3fff, height: buffer.readUInt16LE(28) & 0x3fff };
  }
  if (chunk === "VP8L") {
    const bits = buffer.readUInt32LE(21);
    return {
      width: 1 + (bits & 0x3fff),
      height: 1 + ((bits >>> 14) & 0x3fff)
    };
  }
  throw new Error(`Unsupported WebP chunk ${chunk} in ${file}`);
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, file), "utf8"));
}

function writeOrCheck(file, value, check) {
  const absolute = path.join(ROOT, file);
  const content = `${JSON.stringify(value, null, 2)}\n`;
  if (check) {
    if (!fs.existsSync(absolute) || fs.readFileSync(absolute, "utf8") !== content) {
      throw new Error(`${file} is stale.`);
    }
    return;
  }
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  fs.writeFileSync(absolute, content, "utf8");
}

function build() {
  const manifest = readJson(MANIFEST_FILE);
  const rows = manifest.rows.filter(row => row.family === "fertilizer");
  const hubRows = rows.filter(row => !row.country);
  const countryRows = rows.filter(row => row.country);
  if (rows.length !== 55 || hubRows.length !== 1 || countryRows.length !== 54) {
    throw new Error(`Expected 55/1/54 fertilizer rows, received ${rows.length}/${hubRows.length}/${countryRows.length}.`);
  }

  const browser = readJson(BROWSER_FILE);
  if (browser.browser !== "chromium" || browser.expectedRows !== 55 || browser.acceptedRows !== 55) {
    throw new Error(`Chromium receipt is incomplete: ${browser.acceptedRows || 0}/55.`);
  }
  const browserByRoute = new Map(browser.rows.map(row => [row.route, row]));
  const aiMap = require(path.join(ROOT, "assets/js/ai/swahili-agriculture-route-map.generated.js"));

  const artworkRows = rows.map(row => {
    const file = row.artwork.file;
    const absolute = path.join(ROOT, file);
    if (!fs.existsSync(absolute)) {
      return {
        id: row.english.id,
        route: row.swahili.routeKey,
        file,
        state: "missing"
      };
    }
    const dimensions = webpDimensions(file);
    return {
      id: row.english.id,
      route: row.swahili.routeKey,
      countryCode: row.country && row.country.code || null,
      file,
      state: "present",
      format: "webp",
      bytes: fs.statSync(absolute).size,
      width: dimensions.width,
      height: dimensions.height,
      sha256: sha256(file)
    };
  });
  const missingArtwork = artworkRows.filter(row => row.state !== "present");
  if (missingArtwork.length) {
    throw new Error(`Artwork queue has ${missingArtwork.length} missing rows.`);
  }

  const receiptRows = rows.map(row => {
    const browserRow = browserByRoute.get(row.swahili.routeKey);
    if (!browserRow || browserRow.state !== "passed") {
      throw new Error(`No passing Chromium row receipt for ${row.swahili.routeKey}.`);
    }
    const swFile = path.join(ROOT, row.swahili.file);
    const enFile = path.join(ROOT, row.english.file);
    if (!fs.existsSync(swFile) || !fs.existsSync(enFile)) {
      throw new Error(`Missing physical route pair for ${row.english.id}.`);
    }
    if (aiMap.routes[row.english.routeKey] !== row.swahili.routeKey) {
      throw new Error(`AI route map mismatch for ${row.english.id}.`);
    }
    return {
      id: row.english.id,
      countryCode: row.country && row.country.code || null,
      english: { route: row.english.routeKey, file: row.english.file },
      swahili: { route: row.swahili.routeKey, file: row.swahili.file },
      sourceOwner: "scripts/lib/sw-agriculture-family-contracts/fertilizer.js",
      generator: "scripts/build-sw-agriculture-family.js --family fertilizer",
      englishReciprocalOwner: "scripts/sync-sw-fertilizer-hreflang.js",
      controller: "assets/js/pages/sw-fertilizer-controller.js",
      engine: "engines/src/fertilizer-engine.js -> engines/fertilizer-engine.js",
      countryData: row.country ? `data/agriculture/${row.country.code.toLowerCase()}-agri-data.js` : "data/agriculture/country-index.js",
      browser: browserRow,
      artwork: artworkRows.find(item => item.id === row.english.id),
      masterLedgerState: row.acceptance.state,
      familyReceiptState: "passed-local-proof"
    };
  });

  const hashes = {
    sourceOwner: sha256("scripts/lib/sw-agriculture-family-contracts/fertilizer.js"),
    controller: sha256("assets/js/pages/sw-fertilizer-controller.js"),
    englishReciprocalOwner: sha256("scripts/sync-sw-fertilizer-hreflang.js"),
    englishEngineSource: sha256("engines/src/fertilizer-engine.js"),
    browserEngine: sha256("engines/fertilizer-engine.js"),
    manifest: sha256(MANIFEST_FILE),
    aiRouteMap: sha256("assets/js/ai/swahili-agriculture-route-map.generated.js")
  };

  return {
    receipt: {
      schemaVersion: 1,
      family: "fertilizer",
      locale: "sw",
      baselineSha: BASELINE_SHA,
      commitSha: "the Git commit containing this immutable receipt",
      scope: {
        rows: 55,
        hubRows: 1,
        countryRows: 54,
        physicalRoutes: 55,
        otherAgricultureFamiliesTouched: 0,
        masterLedgerMutated: false,
        sitemapMutated: false,
        distMutated: false,
        deployPerformed: false,
        mergePerformed: false
      },
      proof: {
        sourceParity: "node --test tests/sw-agriculture-fertilizer-parity.test.js",
        englishReciprocal: "node scripts/sync-sw-fertilizer-hreflang.js --check",
        chromium: "npx playwright test tests/e2e/sw-agriculture-fertilizer-family.spec.js --project=chromium --workers=1",
        browserAcceptedRows: browser.acceptedRows,
        browserExpectedRows: browser.expectedRows,
        viewports: [320, 375],
        textReflowPercent: 200,
        themes: ["light", "dark"],
        parsedExportsPerCountry: ["json", "txt", "csv", "pdf"],
        failClosed: true
      },
      hashes,
      rows: receiptRows
    },
    artwork: {
      schemaVersion: 1,
      family: "fertilizer",
      locale: "sw",
      expectedRows: 55,
      reviewedRows: artworkRows.length,
      presentRows: artworkRows.filter(row => row.state === "present").length,
      missingRows: missingArtwork.length,
      queueState: missingArtwork.length ? "blocked" : "clear",
      rows: artworkRows
    }
  };
}

function main() {
  const check = process.argv.includes("--check");
  const artifacts = build();
  writeOrCheck(RECEIPT_FILE, artifacts.receipt, check);
  writeOrCheck(ARTWORK_FILE, artifacts.artwork, check);
  console.log(JSON.stringify({
    family: "fertilizer",
    rows: artifacts.receipt.scope.rows,
    browser: `${artifacts.receipt.proof.browserAcceptedRows}/${artifacts.receipt.proof.browserExpectedRows}`,
    artwork: `${artifacts.artwork.presentRows}/${artifacts.artwork.expectedRows}`,
    mode: check ? "check" : "write"
  }, null, 2));
}

if (require.main === module) main();

module.exports = { build, webpDimensions };
