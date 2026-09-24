const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (quoted) {
      if (char === '"' && next === '"') {
        cell += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        cell += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (char !== "\r") {
      cell += char;
    }
  }

  return rows.filter((fields) => fields.some(Boolean));
}

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "afrotools-car-queue-"));
try {
  const wavePath = path.join(tempDir, "wave.csv");
  const verifiedPath = path.join(tempDir, "verified.json");
  const outputPath = path.join(tempDir, "queue.csv");

  fs.writeFileSync(
    wavePath,
    "vehicle_id,make,model,year,body_type,candidate_priority\nfixture-car-2024,Fixture,Car,2024,suv,high\n",
    "utf8"
  );
  fs.writeFileSync(
    verifiedPath,
    `${JSON.stringify({
      schemaVersion: 2,
      entries: [{
        vehicleId: "fixture-car-2024",
        countryCode: "KE",
        sourceMarket: "japan",
        vehicle: { make: "Fixture", model: "Car", year: 2024, bodyType: "suv", trim: "2.0 AWD" },
        localMarketSample: {
          currency: "KES",
          observedPrices: [100, 120],
          sampleCount: 2,
          verifiedAt: "2026-09-15",
          urls: ["https://example.test/local-1", "https://example.test/local-2"]
        },
        sourceMarketSample: {
          currency: "USD",
          observedPrices: [10, 12],
          sampleCount: 2,
          verifiedAt: "2026-09-14",
          urls: ["https://example.test/source-1", "https://example.test/source-2"]
        },
        imageLicenseStatus: "licensed",
        promotionReady: true,
        promotionBlockers: []
      }]
    }, null, 2)}\n`,
    "utf8"
  );

  const result = spawnSync(process.execPath, [
    path.join(ROOT, "scripts", "generate-real-data-research-queue.js"),
    "--wave", wavePath,
    "--verified", verifiedPath,
    "--output", outputPath,
    "--wave-only"
  ], { cwd: ROOT, encoding: "utf8" });

  assert.strictEqual(result.status, 0, result.stderr || result.stdout);
  const [header, values] = parseCsv(fs.readFileSync(outputPath, "utf8"));
  const row = Object.fromEntries(header.map((key, index) => [key, values[index]]));

  assert.strictEqual(row.normalized_trim, "2.0 AWD");
  assert.strictEqual(row.local_observed_date, "2026-09-15");
  assert.strictEqual(row.source_observed_date, "2026-09-14");
  assert.strictEqual(row.local_sample_count, "2");
  assert.strictEqual(row.source_sample_count, "2");
  assert.strictEqual(row.local_listing_urls, "https://example.test/local-1 | https://example.test/local-2");
  assert.strictEqual(row.source_listing_urls, "https://example.test/source-1 | https://example.test/source-2");
  assert.strictEqual(row.image_license_status, "licensed");
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

console.log("Car research queue provenance fields verified.");
