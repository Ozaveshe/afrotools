const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const masterCatalogPath = path.join(root, "data/cars/master-vehicle-catalog.csv");

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
const blueprintsPath = path.resolve(root, args.blueprints || "data/cars/catalog-candidate-blueprints.json");
const outputCatalogPath = path.resolve(root, args["output-catalog"] || "data/cars/catalog-expansion-wave-1.csv");
const outputImageManifestPath = path.resolve(root, args["output-manifest"] || "data/cars/image-upload-manifest-wave-1.csv");

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

function splitList(value) {
  return String(value || "")
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);
}

function readMasterCatalog() {
  const csv = fs.readFileSync(masterCatalogPath, "utf8");
  const [headers, ...lines] = parseCsv(csv);

  return lines
    .filter((line) => line.some((value) => String(value || "").trim()))
    .map((line) => {
      const record = {};
      headers.forEach((header, index) => {
        record[header] = line[index] || "";
      });
      return record;
    });
}

function yearBucket(year) {
  if (year <= 2012) return "old";
  if (year <= 2019) return "fairly_recent";
  return "very_recent";
}

function imageName(vehicleId) {
  return `${vehicleId}-hero.jpg`;
}

function imageDirectory(makeSlug, modelSlug, year) {
  return `C:/Users/Oza/Documents/afrotools/assets/img/cars/${makeSlug}/${modelSlug}/${year}/`;
}

function buildCandidates() {
  const existing = readMasterCatalog();
  const existingIds = new Set(existing.map((row) => row.vehicle_id));
  const existingKeys = new Set(existing.map((row) => `${row.make_slug}|${row.model_slug}|${row.year}|${row.body_type}`));
  const blueprints = JSON.parse(fs.readFileSync(blueprintsPath, "utf8"));
  const candidates = [];

  blueprints.forEach((blueprint) => {
    blueprint.years.forEach((year) => {
      const vehicleId = `${blueprint.makeSlug}-${blueprint.modelSlug}-${year}`;
      const key = `${blueprint.makeSlug}|${blueprint.modelSlug}|${year}|${blueprint.bodyType}`;

      if (existingIds.has(vehicleId) || existingKeys.has(key)) {
        return;
      }

      candidates.push({
        vehicleId,
        make: blueprint.make,
        makeSlug: blueprint.makeSlug,
        model: blueprint.model,
        modelSlug: blueprint.modelSlug,
        year,
        yearBucket: yearBucket(year),
        bodyType: blueprint.bodyType,
        fuelTypes: blueprint.fuelTypes || [],
        transmissions: blueprint.transmissions || [],
        sourceMarkets: blueprint.sourceMarkets || [],
        candidatePriority: blueprint.candidatePriority || "medium",
        tags: blueprint.tags || [],
        blueprintFamily: blueprint.familyId,
        imageName: imageName(vehicleId),
        saveDirectory: imageDirectory(blueprint.makeSlug, blueprint.modelSlug, year)
      });
    });
  });

  return candidates.sort((left, right) => {
    if (left.make !== right.make) return left.make.localeCompare(right.make);
    if (left.model !== right.model) return left.model.localeCompare(right.model);
    return left.year - right.year;
  });
}

function writeCatalog(candidates) {
  const header = [
    "vehicle_id",
    "make",
    "make_slug",
    "model",
    "model_slug",
    "year",
    "year_bucket",
    "body_type",
    "fuel_types",
    "transmissions",
    "source_markets",
    "candidate_priority",
    "tags",
    "blueprint_family",
    "image_name",
    "save_directory"
  ];

  const rows = candidates.map((candidate) => [
    candidate.vehicleId,
    candidate.make,
    candidate.makeSlug,
    candidate.model,
    candidate.modelSlug,
    candidate.year,
    candidate.yearBucket,
    candidate.bodyType,
    candidate.fuelTypes.join("|"),
    candidate.transmissions.join("|"),
    candidate.sourceMarkets.join("|"),
    candidate.candidatePriority,
    candidate.tags.join("|"),
    candidate.blueprintFamily,
    candidate.imageName,
    candidate.saveDirectory
  ]);

  fs.writeFileSync(outputCatalogPath, `${stringifyCsv([header, ...rows])}\n`, "utf8");
}

function writeImageManifest(candidates) {
  const header = ["vehicle_id", "make", "model", "year", "body_type", "image_name", "save_directory"];
  const rows = candidates.map((candidate) => [
    candidate.vehicleId,
    candidate.make,
    candidate.model,
    candidate.year,
    candidate.bodyType,
    candidate.imageName,
    candidate.saveDirectory
  ]);

  fs.writeFileSync(outputImageManifestPath, `${stringifyCsv([header, ...rows])}\n`, "utf8");
}

function printSummary(candidates) {
  const yearCounts = { old: 0, fairly_recent: 0, very_recent: 0 };
  const bodyCounts = {};
  const priorityCounts = {};

  candidates.forEach((candidate) => {
    yearCounts[candidate.yearBucket] += 1;
    bodyCounts[candidate.bodyType] = (bodyCounts[candidate.bodyType] || 0) + 1;
    priorityCounts[candidate.candidatePriority] = (priorityCounts[candidate.candidatePriority] || 0) + 1;
  });

  console.log(`Generated ${candidates.length} candidate vehicles.`);
  console.log("Year buckets:");
  Object.keys(yearCounts).forEach((key) => {
    console.log(`  - ${key}: ${yearCounts[key]}`);
  });
  console.log("Body mix:");
  Object.keys(bodyCounts)
    .sort()
    .forEach((key) => {
      console.log(`  - ${key}: ${bodyCounts[key]}`);
    });
  console.log("Priority mix:");
  Object.keys(priorityCounts)
    .sort()
    .forEach((key) => {
      console.log(`  - ${key}: ${priorityCounts[key]}`);
    });
}

function main() {
  const candidates = buildCandidates();
  writeCatalog(candidates);
  writeImageManifest(candidates);
  printSummary(candidates);
  console.log(`Updated ${path.relative(root, outputCatalogPath)}`);
  console.log(`Updated ${path.relative(root, outputImageManifestPath)}`);
}

main();
