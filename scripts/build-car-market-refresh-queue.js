const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const outputPath = path.join(root, "audit-results", "car-market-refresh-queue.json");
const coveragePath = path.join(root, "data", "cars", "import-duty-car-market-coverage.json");
const masterPath = path.join(root, "data", "cars", "master-vehicle-catalog.csv");
const estimatePath = path.join(root, "data", "cars", "import-duty-vehicle-estimates.csv");
const onlineEvidencePath = path.join(root, "data", "cars", "import-duty-online-price-evidence.json");
const expansionPaths = [
  path.join(root, "data", "cars", "catalog-expansion-wave-1.csv"),
  path.join(root, "data", "cars", "catalog-expansion-wave-2-ev-luxury.csv"),
  path.join(root, "data", "cars", "catalog-expansion-wave-3-premium-ev.csv")
];
const verifiedPath = path.join(root, "data", "cars", "verified-real-data-batch-1.json");

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

  if (!rows.length) return [];
  const headers = rows.shift().map((header) => header.trim());
  return rows
    .filter((line) => line.some((value) => String(value || "").trim()))
    .map((line) => {
      const record = {};
      headers.forEach((header, index) => {
        record[header] = line[index] || "";
      });
      return record;
    });
}

function readCsv(filePath) {
  return parseCsv(fs.readFileSync(filePath, "utf8"));
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function unique(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function vehicleKey(row) {
  return row.vehicle_id || [row.make_slug || row.make, row.model_slug || row.model, row.year].join("-");
}

function summarizeRows(rows) {
  return {
    count: rows.length,
    makes: unique(rows.map((row) => row.make)).length,
    models: unique(rows.map((row) => `${row.make}|${row.model}`)).length,
    years: unique(rows.map((row) => row.year)).length
  };
}

function summarizeEstimateConfidence(rows) {
  return rows.reduce((summary, row) => {
    const confidence = row.confidence || "unknown";
    const sourceType = row.price_source_type || "unknown";
    summary.confidence[confidence] = (summary.confidence[confidence] || 0) + 1;
    summary.priceSourceType[sourceType] = (summary.priceSourceType[sourceType] || 0) + 1;
    return summary;
  }, { confidence: {}, priceSourceType: {} });
}

function summarizeOnlineEvidence() {
  if (!fs.existsSync(onlineEvidencePath)) {
    return { entries: 0, matchedRows: 0, usdSourceMarketRows: 0 };
  }
  const evidence = readJson(onlineEvidencePath);
  const entries = evidence.entries || [];
  return {
    entries: entries.length,
    matchedRows: entries.filter((entry) => entry.evidence && entry.evidence.length).length,
    usdSourceMarketRows: entries.filter((entry) =>
      (entry.evidence || []).some((item) => item.currency === "USD" && item.sourceName === "DubiCars UAE used listings")
    ).length
  };
}

function main() {
  const coverage = readJson(coveragePath);
  const masterRows = readCsv(masterPath);
  const estimateRows = fs.existsSync(estimatePath) ? readCsv(estimatePath) : [];
  const expansionRows = expansionPaths.flatMap((filePath) => readCsv(filePath));
  const verified = readJson(verifiedPath);
  const masterIds = new Set(masterRows.map(vehicleKey));
  const expansionOnly = expansionRows.filter((row) => !masterIds.has(vehicleKey(row)));
  const verifiedIds = new Set((verified.entries || []).map((entry) => entry.vehicleId));
  const verifiedExpansion = expansionOnly.filter((row) => verifiedIds.has(vehicleKey(row)));
  const researchPending = expansionOnly.filter((row) => !verifiedIds.has(vehicleKey(row)));
  const countries = coverage.destinationCountries.map((country) => ({
    code: country.code,
    name: country.name,
    rulePackStatus: country.rulePackStatus,
    dataStatus: country.dataStatus,
    nextAction:
      country.rulePackStatus === "full"
        ? "Refresh rule-pack source dates and marketplace samples."
        : "Source official duty/tax rules before enabling full import calculations."
  }));

  const targetVehicleCount = coverage.targetVehicleCount || 1000;
  const report = {
    generatedAt: new Date().toISOString(),
    targetVehicleCount,
    currentPricedCatalog: summarizeRows(masterRows),
    usableEstimateCatalog: summarizeRows(estimateRows),
    estimateConfidence: summarizeEstimateConfidence(estimateRows),
    onlineEvidence: summarizeOnlineEvidence(),
    usableVehicleOptions: summarizeRows(masterRows.concat(estimateRows)),
    stagedExpansionCatalog: summarizeRows(expansionOnly),
    verifiedButNotPromoted: summarizeRows(verifiedExpansion),
    researchPending: summarizeRows(researchPending),
    gapToTargetAfterStagedRows: Math.max(0, targetVehicleCount - masterRows.length - expansionOnly.length),
    promotionPolicy: coverage.refreshPlan && coverage.refreshPlan.promotionRule,
    countries,
    refreshQueue: [
      {
        step: "country-market-source-check",
        command: "node scripts/build-car-market-refresh-queue.js",
        output: "audit-results/car-market-refresh-queue.json",
        purpose: "Keep market coverage, staged catalog counts, and promotion gaps visible."
      },
      {
        step: "catalog-validation",
        command: "npm run cars:catalog:validate",
        purpose: "Confirm promoted master catalog rows remain internally consistent."
      },
      {
        step: "research-queue-wave-1",
        command: "npm run cars:research:queue",
        purpose: "Prioritize source-backed rows that can be promoted after evidence and image review."
      },
      {
        step: "research-queue-wave-2",
        command: "npm run cars:research:queue:wave2",
        purpose: "Refresh premium and EV research queue."
      },
      {
        step: "research-queue-wave-3",
        command: "npm run cars:research:queue:wave3",
        purpose: "Refresh newer premium EV queue."
      }
    ],
    guardrails: [
      "Do not scrape marketplace pages in production runtime.",
      "Do not promote marketplace observations without source URL, observed date, sample count, trim normalization, and licensed image status.",
      "Do not treat marketplace samples as official vehicle values.",
      "Do not use used-car catalog prices as new-car dealer prices."
    ]
  };

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(`Car market refresh queue written to ${path.relative(root, outputPath)}`);
  console.log(
    `Priced catalog: ${masterRows.length}; estimate overlay: ${estimateRows.length}; staged rows: ${expansionOnly.length}; target: ${targetVehicleCount}.`
  );
}

main();
