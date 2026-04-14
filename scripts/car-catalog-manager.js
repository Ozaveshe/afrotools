const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const masterCatalogPath = path.join(root, "data/cars/master-vehicle-catalog.csv");
const imageManifestPath = path.join(root, "data/cars/image-upload-manifest.csv");
const seedJsonPath = path.join(root, "data/cars/price-intelligence.json");
const targetsPath = path.join(root, "data/cars/catalog-expansion-targets.json");
const validStatuses = new Set(["active", "planned", "draft", "archived"]);
const validBodies = new Set(["sedan", "suv", "pickup", "hatchback", "mpv", "wagon", "coupe", "van", "truck"]);

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
      continue;
    }

    if (char === '"') {
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

  return rows;
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

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function splitList(value) {
  return String(value || "")
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeFile(filePath, content) {
  fs.writeFileSync(filePath, content, "utf8");
}

function readMasterRows() {
  const csv = fs.readFileSync(masterCatalogPath, "utf8");
  const [headers, ...lines] = parseCsv(csv);

  if (!headers || !headers.length) {
    throw new Error("Master catalog is empty.");
  }

  return lines
    .filter((line) => line.some((value) => String(value || "").trim()))
    .map((line, index) => {
      const raw = {};
      headers.forEach((header, headerIndex) => {
        raw[header] = line[headerIndex] || "";
      });
      return normalizeRow(raw, index + 2);
    });
}

function normalizeRow(raw, rowNumber) {
  return {
    rowNumber,
    vehicleId: String(raw.vehicle_id || "").trim(),
    make: String(raw.make || "").trim(),
    makeSlug: String(raw.make_slug || "").trim(),
    model: String(raw.model || "").trim(),
    modelSlug: String(raw.model_slug || "").trim(),
    year: toNumber(raw.year),
    bodyType: String(raw.body_type || "").trim().toLowerCase(),
    trim: String(raw.trim || "").trim(),
    engineCcMin: toNumber(raw.engine_cc_min),
    engineCcMax: toNumber(raw.engine_cc_max),
    fuelTypes: splitList(raw.fuel_types),
    transmissions: splitList(raw.transmissions),
    sourceMarkets: splitList(raw.source_markets),
    mileageBand: String(raw.mileage_band || "").trim(),
    conditionNote: String(raw.condition_note || "").trim(),
    priceMinUsd: toNumber(raw.price_min_usd),
    priceMedianUsd: toNumber(raw.price_median_usd),
    priceMaxUsd: toNumber(raw.price_max_usd),
    confidence: String(raw.confidence || "").trim().toLowerCase(),
    lastUpdated: String(raw.last_updated || "").trim(),
    tags: splitList(raw.tags),
    catalogStatus: String(raw.catalog_status || "").trim().toLowerCase(),
    launchPriority: String(raw.launch_priority || "").trim().toLowerCase()
  };
}

function validateRows(rows) {
  const issues = [];
  const seenVehicleIds = new Map();
  const currentYear = new Date().getUTCFullYear() + 1;

  rows.forEach((row) => {
    if (!row.vehicleId) issues.push(issue("error", row, "Missing vehicle_id."));
    if (!row.make) issues.push(issue("error", row, "Missing make."));
    if (!row.makeSlug) issues.push(issue("error", row, "Missing make_slug."));
    if (!row.model) issues.push(issue("error", row, "Missing model."));
    if (!row.modelSlug) issues.push(issue("error", row, "Missing model_slug."));
    if (!row.year) issues.push(issue("error", row, "Missing or invalid year."));
    if (!row.bodyType) issues.push(issue("error", row, "Missing body_type."));
    if (!row.catalogStatus) issues.push(issue("error", row, "Missing catalog_status."));
    if (!validStatuses.has(row.catalogStatus)) issues.push(issue("error", row, `Invalid catalog_status "${row.catalogStatus}".`));
    if (row.bodyType && !validBodies.has(row.bodyType)) issues.push(issue("error", row, `Unsupported body_type "${row.bodyType}".`));
    if (row.year && (row.year < 1990 || row.year > currentYear)) issues.push(issue("error", row, `Year ${row.year} is outside the supported range.`));
    if (row.engineCcMin == null || row.engineCcMax == null) issues.push(issue("error", row, "Engine cc range is incomplete."));
    if (row.engineCcMin != null && row.engineCcMax != null && row.engineCcMin > row.engineCcMax) issues.push(issue("error", row, "engine_cc_min is greater than engine_cc_max."));
    if (!row.fuelTypes.length) issues.push(issue("warn", row, "No fuel_types supplied."));
    if (!row.transmissions.length) issues.push(issue("warn", row, "No transmissions supplied."));
    if (!row.sourceMarkets.length) issues.push(issue("warn", row, "No source_markets supplied."));
    if (row.priceMinUsd == null || row.priceMedianUsd == null || row.priceMaxUsd == null) issues.push(issue("error", row, "Price range is incomplete."));
    if (row.priceMinUsd != null && row.priceMedianUsd != null && row.priceMaxUsd != null) {
      if (!(row.priceMinUsd <= row.priceMedianUsd && row.priceMedianUsd <= row.priceMaxUsd)) {
        issues.push(issue("error", row, "Price range must be ordered min <= median <= max."));
      }
    }
    if (!row.lastUpdated) issues.push(issue("warn", row, "Missing last_updated."));
    if (row.vehicleId && row.year) {
      const expectedSuffix = `-${row.year}`;
      if (!row.vehicleId.endsWith(expectedSuffix)) {
        issues.push(issue("error", row, `vehicle_id should end with ${expectedSuffix}.`));
      }
    }

    if (row.vehicleId) {
      if (seenVehicleIds.has(row.vehicleId)) {
        issues.push(issue("error", row, `Duplicate vehicle_id "${row.vehicleId}" also found on row ${seenVehicleIds.get(row.vehicleId)}.`));
      } else {
        seenVehicleIds.set(row.vehicleId, row.rowNumber);
      }
    }
  });

  return issues;
}

function issue(severity, row, message) {
  return {
    severity,
    rowNumber: row.rowNumber,
    vehicleId: row.vehicleId || "(missing vehicle_id)",
    message
  };
}

function deriveImageDirectory(row) {
  return `C:/Users/Oza/Documents/afrotools/assets/img/cars/${row.makeSlug}/${row.modelSlug}/${row.year}/`;
}

function deriveImageName(row) {
  return `${row.vehicleId}-hero.jpg`;
}

function buildImageManifest(rows) {
  const header = ["vehicle_id", "make", "model", "year", "body_type", "image_name", "save_directory"];
  const records = rows
    .filter((row) => row.catalogStatus === "active")
    .map((row) => [row.vehicleId, row.make, row.model, row.year, row.bodyType, deriveImageName(row), deriveImageDirectory(row)]);
  return stringifyCsv([header, ...records]) + "\n";
}

function buildVehicles(rows) {
  return rows
    .filter((row) => row.catalogStatus === "active")
    .map((row) => ({
      id: row.vehicleId,
      make: row.make,
      makeSlug: row.makeSlug,
      model: row.model,
      modelSlug: row.modelSlug,
      year: row.year,
      trim: row.trim,
      cc: [row.engineCcMin, row.engineCcMax],
      fuel: row.fuelTypes,
      transmissions: row.transmissions,
      sources: row.sourceMarkets,
      body: row.bodyType,
      mileage: row.mileageBand,
      condition: row.conditionNote,
      price: [row.priceMinUsd, row.priceMedianUsd, row.priceMaxUsd],
      confidence: row.confidence || "medium",
      lastUpdated: row.lastUpdated,
      tags: row.tags
    }));
}

function summarize(rows) {
  const activeRows = rows.filter((row) => row.catalogStatus === "active");
  const bodyCounts = {};
  const makeCounts = {};
  const yearBuckets = {
    old: 0,
    fairly_recent: 0,
    very_recent: 0
  };

  activeRows.forEach((row) => {
    bodyCounts[row.bodyType] = (bodyCounts[row.bodyType] || 0) + 1;
    makeCounts[row.make] = (makeCounts[row.make] || 0) + 1;
    if (row.year <= 2012) yearBuckets.old += 1;
    else if (row.year <= 2019) yearBuckets.fairly_recent += 1;
    else yearBuckets.very_recent += 1;
  });

  const targets = fs.existsSync(targetsPath) ? readJson(targetsPath) : null;
  return {
    totalRows: rows.length,
    activeRows: activeRows.length,
    bodyCounts,
    makeCounts,
    yearBuckets,
    targets
  };
}

function printSummary(summary) {
  console.log(`Master catalog rows: ${summary.totalRows}`);
  console.log(`Active catalog rows: ${summary.activeRows}`);
  console.log("Year buckets:");
  Object.keys(summary.yearBuckets).forEach((key) => {
    const actual = summary.yearBuckets[key];
    const target = summary.targets && summary.targets.yearBuckets && summary.targets.yearBuckets[key] ? summary.targets.yearBuckets[key].target : null;
    const suffix = target != null ? ` / target ${target}` : "";
    console.log(`  - ${key}: ${actual}${suffix}`);
  });
  console.log("Body mix:");
  Object.keys(summary.bodyCounts)
    .sort()
    .forEach((key) => {
      const actual = summary.bodyCounts[key];
      const target = summary.targets && summary.targets.bodyTypes ? summary.targets.bodyTypes[key] : null;
      const suffix = target != null ? ` / target ${target}` : "";
      console.log(`  - ${key}: ${actual}${suffix}`);
    });
  console.log("Top makes:");
  Object.entries(summary.makeCounts)
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, 10)
    .forEach(([make, count]) => {
      console.log(`  - ${make}: ${count}`);
    });
}

function syncSeedJson(rows) {
  const data = readJson(seedJsonPath);
  data.vehicles = buildVehicles(rows);
  writeFile(seedJsonPath, `${JSON.stringify(data, null, 2)}\n`);
}

function run() {
  const command = process.argv[2];
  const rows = readMasterRows();
  const issues = validateRows(rows);
  const errorCount = issues.filter((item) => item.severity === "error").length;
  const warningCount = issues.filter((item) => item.severity === "warn").length;

  if (!command || command === "help" || command === "--help") {
    console.log("Usage: node scripts/car-catalog-manager.js <summary|validate|build-image-manifest|sync-seed-json>");
    process.exit(0);
  }

  if (command === "summary") {
    printSummary(summarize(rows));
    process.exit(0);
  }

  if (command === "validate") {
    printSummary(summarize(rows));
    issues.forEach((item) => {
      console.log(`${item.severity.toUpperCase()} row ${item.rowNumber} ${item.vehicleId}: ${item.message}`);
    });
    console.log(`Validation complete: ${errorCount} error(s), ${warningCount} warning(s).`);
    process.exit(errorCount ? 1 : 0);
  }

  if (errorCount) {
    issues.forEach((item) => {
      console.log(`${item.severity.toUpperCase()} row ${item.rowNumber} ${item.vehicleId}: ${item.message}`);
    });
    console.log(`Refusing to continue with ${errorCount} error(s).`);
    process.exit(1);
  }

  if (command === "build-image-manifest") {
    writeFile(imageManifestPath, buildImageManifest(rows));
    console.log(`Updated ${path.relative(root, imageManifestPath)}`);
    process.exit(0);
  }

  if (command === "sync-seed-json") {
    syncSeedJson(rows);
    console.log(`Updated ${path.relative(root, seedJsonPath)}`);
    process.exit(0);
  }

  console.log(`Unknown command "${command}".`);
  process.exit(1);
}

run();
