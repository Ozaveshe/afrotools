const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");

function parseArgs(argv) {
  const options = {};

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) {
      options[key] = true;
      continue;
    }
    options[key] = value;
    index += 1;
  }

  return options;
}

const args = parseArgs(process.argv.slice(2));
const wavePath = path.resolve(root, args.wave || "data/cars/catalog-expansion-wave-1.csv");
const verifiedPath = path.resolve(root, args.verified || "data/cars/verified-real-data-batch-1.json");
const outputPath = path.resolve(root, args.output || "data/cars/real-data-research-queue.csv");
const queueLimit = Number(args.limit || 100);
const waveOnly = Boolean(args["wave-only"]);

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

function readWaveCandidates() {
  const csv = fs.readFileSync(wavePath, "utf8");
  const [headers, ...lines] = parseCsv(csv);
  return lines
    .filter((line) => line.some((value) => String(value || "").trim()))
    .map((line) => {
      const row = {};
      headers.forEach((header, index) => {
        row[header] = line[index] || "";
      });
      return row;
    });
}

function createCandidateFromEvidence(entry) {
  return {
    vehicle_id: entry.vehicleId,
    make: entry.vehicle.make,
    model: entry.vehicle.model,
    year: String(entry.vehicle.year),
    body_type: entry.vehicle.bodyType,
    candidate_priority: "high"
  };
}

function createCandidateFromWaveRow(row) {
  return {
    vehicle_id: row.vehicle_id,
    make: row.make,
    model: row.model,
    year: row.year,
    body_type: row.body_type,
    candidate_priority: row.candidate_priority
  };
}

function getEvidenceSets(entry) {
  if (Array.isArray(entry.marketEvidence) && entry.marketEvidence.length) {
    return entry.marketEvidence
      .filter((item) => item && item.countryCode && item.sourceMarket && item.localMarketSample && item.sourceMarketSample)
      .map((item) => ({
        countryCode: item.countryCode,
        sourceMarket: item.sourceMarket,
        localMarketSample: item.localMarketSample,
        sourceMarketSample: item.sourceMarketSample
      }));
  }

  if (entry.countryCode && entry.sourceMarket && entry.localMarketSample && entry.sourceMarketSample) {
    return [
      {
        countryCode: entry.countryCode,
        sourceMarket: entry.sourceMarket,
        localMarketSample: entry.localMarketSample,
        sourceMarketSample: entry.sourceMarketSample
      }
    ];
  }

  return [];
}

function getPrimaryEvidence(entry) {
  const evidenceSets = getEvidenceSets(entry);
  if (!evidenceSets.length) return null;
  const index = Number.isInteger(entry.primaryEvidenceIndex) ? entry.primaryEvidenceIndex : 0;
  return evidenceSets[index] || evidenceSets[0];
}

function summarizeDistinct(values) {
  return Array.from(
    new Set(
      values
        .map((value) => String(value || "").trim())
        .filter(Boolean)
    )
  ).join("|");
}

function median(values) {
  if (!values.length) return "";
  const sorted = values.slice().sort((left, right) => left - right);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2) return sorted[mid];
  return (sorted[mid - 1] + sorted[mid]) / 2;
}

function formatObservation(values) {
  return values && values.length ? values.join("|") : "";
}

function formatUrls(values) {
  return values && values.length ? values.join(" | ") : "";
}

function main() {
  const verified = JSON.parse(fs.readFileSync(verifiedPath, "utf8"));
  const verifiedMap = new Map(verified.entries.map((entry) => [entry.vehicleId, entry]));
  const waveCandidates = readWaveCandidates();
  const verifiedWaveCandidates = waveCandidates
    .filter((row) => verifiedMap.has(row.vehicle_id))
    .map(createCandidateFromWaveRow);
  const pendingHighPriorityWaveCandidates = waveCandidates
    .filter((row) => row.candidate_priority === "high" && !verifiedMap.has(row.vehicle_id))
    .map(createCandidateFromWaveRow);
  const candidateIds = new Set([
    ...verifiedWaveCandidates.map((row) => row.vehicle_id),
    ...pendingHighPriorityWaveCandidates.map((row) => row.vehicle_id)
  ]);
  const verifiedOnlyCandidates = waveOnly
    ? []
    : verified.entries.filter((entry) => !candidateIds.has(entry.vehicleId)).map(createCandidateFromEvidence);
  const candidates = [...verifiedOnlyCandidates, ...verifiedWaveCandidates, ...pendingHighPriorityWaveCandidates]
    .sort((left, right) => {
      const leftVerified = verifiedMap.has(left.vehicle_id) ? 0 : 1;
      const rightVerified = verifiedMap.has(right.vehicle_id) ? 0 : 1;
      if (leftVerified !== rightVerified) return leftVerified - rightVerified;
      if (left.make !== right.make) return left.make.localeCompare(right.make);
      if (left.model !== right.model) return left.model.localeCompare(right.model);
      return Number(left.year) - Number(right.year);
    })
    .slice(0, queueLimit);

  const header = [
    "vehicle_id",
    "make",
    "model",
    "year",
    "body_type",
    "candidate_priority",
    "target_country_code",
    "source_market",
    "verification_status",
    "observed_local_prices",
    "local_currency",
    "local_median_price",
    "local_sample_count",
    "local_listing_urls",
    "observed_source_prices",
    "source_currency",
    "source_median_price",
    "source_sample_count",
    "source_listing_urls",
    "image_license_status",
    "promotion_ready",
    "promotion_blockers",
    "available_country_codes",
    "available_source_markets",
    "evidence_pair_count"
  ];

  const rows = candidates.map((candidate) => {
    const evidence = verifiedMap.get(candidate.vehicle_id);
    const evidenceSets = evidence ? getEvidenceSets(evidence) : [];
    const primaryEvidence = evidence ? getPrimaryEvidence(evidence) : null;
    const localValues = primaryEvidence ? primaryEvidence.localMarketSample.observedPrices : [];
    const sourceValues = primaryEvidence ? primaryEvidence.sourceMarketSample.observedPrices : [];
    return [
      candidate.vehicle_id,
      candidate.make,
      candidate.model,
      candidate.year,
      candidate.body_type,
      candidate.candidate_priority,
      primaryEvidence ? primaryEvidence.countryCode : "",
      primaryEvidence ? primaryEvidence.sourceMarket : "",
      evidence ? "verified-source-backed" : "research-pending",
      formatObservation(localValues),
      primaryEvidence ? primaryEvidence.localMarketSample.currency : "",
      median(localValues),
      primaryEvidence ? primaryEvidence.localMarketSample.sampleCount : "",
      primaryEvidence ? formatUrls(primaryEvidence.localMarketSample.urls) : "",
      formatObservation(sourceValues),
      primaryEvidence ? primaryEvidence.sourceMarketSample.currency : "",
      median(sourceValues),
      primaryEvidence ? primaryEvidence.sourceMarketSample.sampleCount : "",
      primaryEvidence ? formatUrls(primaryEvidence.sourceMarketSample.urls) : "",
      evidence ? evidence.imageLicenseStatus : "pending",
      evidence ? String(Boolean(evidence.promotionReady)) : "false",
      evidence ? evidence.promotionBlockers.join(" | ") : "Needs verified source-market listing, local-market listing, and licensed image before promotion.",
      evidence ? summarizeDistinct(evidenceSets.map((item) => item.countryCode)) : "",
      evidence ? summarizeDistinct(evidenceSets.map((item) => item.sourceMarket)) : "",
      evidence ? evidenceSets.length : ""
    ];
  });

  fs.writeFileSync(outputPath, `${stringifyCsv([header, ...rows])}\n`, "utf8");
  const verifiedCount = rows.filter((row) => row[8] === "verified-source-backed").length;
  console.log(`Updated ${path.relative(root, outputPath)} with ${rows.length} rows (${verifiedCount} verified so far).`);
}

main();
