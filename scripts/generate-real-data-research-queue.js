const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const wavePath = path.join(root, "data/cars/catalog-expansion-wave-1.csv");
const verifiedPath = path.join(root, "data/cars/verified-real-data-batch-1.json");
const outputPath = path.join(root, "data/cars/real-data-research-queue.csv");

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
  const highPriorityWaveCandidates = waveCandidates
    .filter((row) => row.candidate_priority === "high")
    .map((row) => ({
      vehicle_id: row.vehicle_id,
      make: row.make,
      model: row.model,
      year: row.year,
      body_type: row.body_type,
      candidate_priority: row.candidate_priority
    }));
  const candidateIds = new Set(highPriorityWaveCandidates.map((row) => row.vehicle_id));
  const verifiedOnlyCandidates = verified.entries
    .filter((entry) => !candidateIds.has(entry.vehicleId))
    .map(createCandidateFromEvidence);
  const candidates = [...verifiedOnlyCandidates, ...highPriorityWaveCandidates]
    .sort((left, right) => {
      const leftVerified = verifiedMap.has(left.vehicle_id) ? 0 : 1;
      const rightVerified = verifiedMap.has(right.vehicle_id) ? 0 : 1;
      if (leftVerified !== rightVerified) return leftVerified - rightVerified;
      if (left.make !== right.make) return left.make.localeCompare(right.make);
      if (left.model !== right.model) return left.model.localeCompare(right.model);
      return Number(left.year) - Number(right.year);
    })
    .slice(0, 100);

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
    "promotion_blockers"
  ];

  const rows = candidates.map((candidate) => {
    const evidence = verifiedMap.get(candidate.vehicle_id);
    const localValues = evidence ? evidence.localMarketSample.observedPrices : [];
    const sourceValues = evidence ? evidence.sourceMarketSample.observedPrices : [];
    return [
      candidate.vehicle_id,
      candidate.make,
      candidate.model,
      candidate.year,
      candidate.body_type,
      candidate.candidate_priority,
      evidence ? evidence.countryCode : "",
      evidence ? evidence.sourceMarket : "",
      evidence ? "verified-source-backed" : "research-pending",
      formatObservation(localValues),
      evidence ? evidence.localMarketSample.currency : "",
      median(localValues),
      evidence ? evidence.localMarketSample.sampleCount : "",
      evidence ? formatUrls(evidence.localMarketSample.urls) : "",
      formatObservation(sourceValues),
      evidence ? evidence.sourceMarketSample.currency : "",
      median(sourceValues),
      evidence ? evidence.sourceMarketSample.sampleCount : "",
      evidence ? formatUrls(evidence.sourceMarketSample.urls) : "",
      evidence ? evidence.imageLicenseStatus : "pending",
      evidence ? String(Boolean(evidence.promotionReady)) : "false",
      evidence ? evidence.promotionBlockers.join(" | ") : "Needs verified source-market listing, local-market listing, and licensed image before promotion."
    ];
  });

  fs.writeFileSync(outputPath, `${stringifyCsv([header, ...rows])}\n`, "utf8");
  const verifiedCount = rows.filter((row) => row[8] === "verified-source-backed").length;
  console.log(`Updated data/cars/real-data-research-queue.csv with ${rows.length} rows (${verifiedCount} verified so far).`);
}

main();
