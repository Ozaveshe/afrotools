const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const masterPath = path.join(root, "data", "cars", "master-vehicle-catalog.csv");
const verifiedPath = path.join(root, "data", "cars", "verified-real-data-batch-1.json");
const outputPath = path.join(root, "data", "cars", "import-duty-vehicle-estimates.csv");
const expansionPaths = [
  path.join(root, "data", "cars", "catalog-expansion-wave-1.csv"),
  path.join(root, "data", "cars", "catalog-expansion-wave-2-ev-luxury.csv"),
  path.join(root, "data", "cars", "catalog-expansion-wave-3-premium-ev.csv")
];

const headers = [
  "vehicle_id",
  "make",
  "make_slug",
  "model",
  "model_slug",
  "year",
  "body_type",
  "trim",
  "engine_cc_min",
  "engine_cc_max",
  "fuel_types",
  "transmissions",
  "source_markets",
  "mileage_band",
  "condition_note",
  "price_min_usd",
  "price_median_usd",
  "price_max_usd",
  "confidence",
  "last_updated",
  "tags",
  "catalog_status",
  "launch_priority",
  "price_source_type",
  "price_source_name",
  "price_source_url",
  "price_source_count",
  "price_notes"
];

const bodyDefaults = {
  sedan: { price: 6800, engineMin: 1500, engineMax: 2500 },
  hatchback: { price: 4800, engineMin: 1000, engineMax: 1600 },
  suv: { price: 10800, engineMin: 1800, engineMax: 3500 },
  pickup: { price: 14500, engineMin: 2200, engineMax: 3500 },
  mpv: { price: 8800, engineMin: 1800, engineMax: 2500 },
  wagon: { price: 7200, engineMin: 1500, engineMax: 2500 },
  coupe: { price: 9000, engineMin: 1800, engineMax: 3200 },
  van: { price: 10000, engineMin: 1800, engineMax: 3000 },
  truck: { price: 22000, engineMin: 3000, engineMax: 8000 },
  motorcycle: { price: 1800, engineMin: 125, engineMax: 1000 }
};

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (inQuotes) {
      if (char === '"' && next === '"') {
        cell += '"';
        index += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        cell += char;
      }
    } else if (char === '"') {
      inQuotes = true;
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
  if (cell.length || row.length) {
    row.push(cell);
    rows.push(row);
  }
  if (!rows.length) return [];
  const csvHeaders = rows.shift().map((header) => header.trim());
  return rows
    .filter((line) => line.some((value) => String(value || "").trim()))
    .map((line) => Object.fromEntries(csvHeaders.map((header, index) => [header, line[index] || ""])));
}

function stringifyCsv(rows) {
  return rows
    .map((row) =>
      row
        .map((value) => {
          const text = String(value == null ? "" : value);
          return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
        })
        .join(",")
    )
    .join("\n");
}

function slug(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function toNumber(value) {
  const number = Number(String(value || "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(number) ? number : 0;
}

function median(values) {
  const sorted = values.filter((value) => Number.isFinite(value) && value > 0).sort((a, b) => a - b);
  if (!sorted.length) return 0;
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function vehicleKey(row) {
  return row.vehicle_id || [row.make_slug || slug(row.make), row.model_slug || slug(row.model), row.year].join("-");
}

function normalizeBody(bodyType) {
  const body = String(bodyType || "").toLowerCase();
  return bodyDefaults[body] ? body : "sedan";
}

function adjustmentForYear(targetYear, baseYear) {
  const diff = Number(targetYear) - Number(baseYear);
  return Math.min(2.2, Math.max(0.35, Math.pow(1.06, diff)));
}

function buildTraining(masterRows, verifiedEntries) {
  const rows = masterRows
    .map((row) => ({
      vehicleId: vehicleKey(row),
      make: row.make,
      model: row.model,
      makeSlug: row.make_slug || slug(row.make),
      modelSlug: row.model_slug || slug(row.model),
      bodyType: normalizeBody(row.body_type),
      year: toNumber(row.year),
      median: toNumber(row.price_median_usd),
      source: "master"
    }))
    .filter((row) => row.median > 0 && row.year > 0);

  verifiedEntries.forEach((entry) => {
    const source = entry.sourceMarketSample || {};
    const prices = (source.observedPrices || []).map(toNumber).filter(Boolean);
    if (String(source.currency || "").toUpperCase() !== "USD" || !prices.length) return;
    rows.push({
      vehicleId: entry.vehicleId,
      make: entry.vehicle && entry.vehicle.make,
      model: entry.vehicle && entry.vehicle.model,
      makeSlug: slug(entry.vehicle && entry.vehicle.make),
      modelSlug: slug(entry.vehicle && entry.vehicle.model),
      bodyType: normalizeBody(entry.vehicle && entry.vehicle.bodyType),
      year: toNumber(entry.vehicle && entry.vehicle.year),
      median: median(prices),
      source: "verified"
    });
  });

  return rows;
}

function estimateFromComparables(row, training) {
  const makeSlug = row.make_slug || slug(row.make);
  const modelSlug = row.model_slug || slug(row.model);
  const bodyType = normalizeBody(row.body_type);
  const year = toNumber(row.year);
  const pools = [
    training.filter((item) => item.makeSlug === makeSlug && item.modelSlug === modelSlug),
    training.filter((item) => item.makeSlug === makeSlug && item.bodyType === bodyType),
    training.filter((item) => item.bodyType === bodyType)
  ];
  const pool = pools.find((items) => items.length) || [];
  if (!pool.length) return bodyDefaults[bodyType].price;
  const estimates = pool.map((item) => item.median * adjustmentForYear(year, item.year));
  return median(estimates);
}

function exactVerifiedEstimate(row, verifiedById) {
  const entry = verifiedById.get(vehicleKey(row));
  if (!entry) return null;
  const source = entry.sourceMarketSample || {};
  const prices = (source.observedPrices || []).map(toNumber).filter(Boolean);
  if (String(source.currency || "").toUpperCase() !== "USD" || !prices.length) return null;
  const exactMedian = median(prices);
  return {
    median: exactMedian,
    min: Math.min(...prices),
    max: Math.max(...prices),
    entry,
    source
  };
}

function rounded(value) {
  const step = value >= 20000 ? 500 : 100;
  return Math.max(900, Math.round(value / step) * step);
}

function buildEstimateRow(row, training, verifiedById) {
  const bodyType = normalizeBody(row.body_type);
  const defaults = bodyDefaults[bodyType];
  const exact = exactVerifiedEstimate(row, verifiedById);
  const center = exact ? exact.median : estimateFromComparables(row, training);
  const min = exact ? exact.min : center * 0.78;
  const max = exact ? exact.max : center * 1.28;
  const verifiedVehicle = exact && exact.entry.vehicle ? exact.entry.vehicle : {};
  const sourceUrls = exact && exact.source.urls ? exact.source.urls.join(" | ") : "/data/cars/master-vehicle-catalog.csv | /data/cars/verified-real-data-batch-1.json";
  const sampleCount = exact ? exact.source.sampleCount || exact.source.observedPrices.length : "";

  return {
    vehicle_id: vehicleKey(row),
    make: row.make,
    make_slug: row.make_slug || slug(row.make),
    model: row.model,
    model_slug: row.model_slug || slug(row.model),
    year: row.year,
    body_type: bodyType,
    trim: verifiedVehicle.trim || "Comparable-market planning estimate",
    engine_cc_min: verifiedVehicle.engineCc || defaults.engineMin,
    engine_cc_max: verifiedVehicle.engineCc || defaults.engineMax,
    fuel_types: row.fuel_types || verifiedVehicle.fuelType || "",
    transmissions: row.transmissions || verifiedVehicle.transmission || "",
    source_markets: row.source_markets || (exact && exact.entry.sourceMarket) || "japan|uae|uk|local-dealer",
    mileage_band: "Used-market planning band; mileage varies",
    condition_note: "Used planning estimate. Override with seller quote, invoice, or assessed value.",
    price_min_usd: rounded(min),
    price_median_usd: rounded(center),
    price_max_usd: Math.max(rounded(max), rounded(center)),
    confidence: exact ? "market_sample_estimate" : "comparable_market_estimate",
    last_updated: new Date().toISOString().slice(0, 10),
    tags: [row.tags, "import-duty-estimate", exact ? "source-backed-sample" : "comparable-estimate"].filter(Boolean).join("|"),
    catalog_status: "active",
    launch_priority: row.candidate_priority || "medium",
    price_source_type: exact ? "market_sample" : "comparable_market_estimate",
    price_source_name: exact ? "Verified marketplace/source-market sample" : "AfroTools comparable vehicle estimate",
    price_source_url: sourceUrls,
    price_source_count: sampleCount,
    price_notes: exact
      ? "Planning estimate from stored marketplace/source-market observations. Not a customs assessed value."
      : "Planning estimate derived from comparable AfroTools catalog and verified sample bands. Not source-backed for this exact trim."
  };
}

function main() {
  const masterRows = parseCsv(fs.readFileSync(masterPath, "utf8"));
  const masterIds = new Set(masterRows.map(vehicleKey));
  const expansionRows = expansionPaths
    .flatMap((filePath) => parseCsv(fs.readFileSync(filePath, "utf8")))
    .filter((row) => !masterIds.has(vehicleKey(row)));
  const verifiedEntries = JSON.parse(fs.readFileSync(verifiedPath, "utf8")).entries || [];
  const verifiedById = new Map(verifiedEntries.map((entry) => [entry.vehicleId, entry]));
  const training = buildTraining(masterRows, verifiedEntries);
  const estimateRows = expansionRows.map((row) => buildEstimateRow(row, training, verifiedById));

  fs.writeFileSync(
    outputPath,
    `${stringifyCsv([headers, ...estimateRows.map((row) => headers.map((header) => row[header] || ""))])}\n`,
    "utf8"
  );

  const exactCount = estimateRows.filter((row) => row.price_source_type === "market_sample").length;
  console.log(
    `Import-duty vehicle estimates written: ${estimateRows.length} rows (${exactCount} source-backed samples, ${
      estimateRows.length - exactCount
    } comparable estimates).`
  );
}

main();
