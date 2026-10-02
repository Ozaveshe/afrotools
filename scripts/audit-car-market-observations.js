#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");
const DAY = 86400000;

function dateOnly(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const time = Date.parse(value + "T00:00:00Z");
  return Number.isFinite(time) && new Date(time).toISOString().slice(0, 10) === value ? time : null;
}

function auditMarketObservations(priceData, marketData, sourceMarketData, { now = new Date() } = {}) {
  if (!(now instanceof Date) || !Number.isFinite(now.getTime())) throw new Error("Invalid audit clock");
  if (!Array.isArray(priceData.vehicles) || !priceData.countries
      || !Array.isArray(priceData.localMarketPrices) || !Array.isArray(priceData.sourceMarketPrices)
      || !Array.isArray(marketData.observations) || !Array.isArray(sourceMarketData.observations)) {
    throw new Error("Missing price-pack or observation arrays");
  }
  const staleDays = priceData.staleAfterDays;
  if (!Number.isInteger(staleDays) || staleDays < 1 || staleDays > 365) throw new Error("Invalid price-pack freshness window");
  const vehicles = new Set(priceData.vehicles.map((vehicle) => vehicle.id));
  const seen = new Set();
  const problems = [];

  for (const item of marketData.observations || []) {
    const key = `${item.countryCode}:${item.vehicleId}`;
    if (seen.has(key)) problems.push(`${key}: duplicate country/vehicle observation`);
    seen.add(key);
    if (!vehicles.has(item.vehicleId)) problems.push(`${key}: no matching priced vehicle`);
    if (!priceData.countries[item.countryCode]) problems.push(`${key}: unknown country`);
    if (!/^https:\/\//.test(item.sourceUrl || "")) problems.push(`${key}: missing source URL`);
    if (![item.market, item.condition, item.currency, item.sourceName, item.method, item.limitations].every((value) => typeof value === "string" && value.trim())) {
      problems.push(`${key}: market, condition, currency, source name, method, or limitations missing`);
    }
    if (item.sampleVariant !== undefined && (typeof item.sampleVariant !== "string" || !item.sampleVariant.trim())) {
      problems.push(`${key}: invalid sampled variant`);
    }
    if (item.sampleVariantFr !== undefined && (typeof item.sampleVariantFr !== "string" || !item.sampleVariantFr.trim())) {
      problems.push(`${key}: invalid French sampled variant`);
    }
    if (item.searchIndexEligible !== undefined && typeof item.searchIndexEligible !== "boolean") {
      problems.push(`${key}: searchIndexEligible must be a boolean`);
    }
    if (item.confidence !== undefined && !["low", "medium", "high"].includes(item.confidence)) {
      problems.push(`${key}: confidence must be low, medium, or high`);
    }
    if (dateOnly(item.reviewedAt) === null) problems.push(`${key}: invalid review date`);
    else if (dateOnly(item.reviewedAt) > now.getTime()) problems.push(`${key}: review date is in the future`);
    if (!Number.isInteger(item.sampleSize) || item.sampleSize < 3) problems.push(`${key}: sample count too small or missing`);
    if (![item.lowerQuartile, item.median, item.upperQuartile].every((value) => Number.isFinite(value) && value > 0)
        || !(item.lowerQuartile <= item.median && item.median <= item.upperQuartile)) problems.push(`${key}: invalid price band`);
    const vehicle = priceData.vehicles.find((entry) => entry.id === item.vehicleId);
    const projected = vehicle && priceData.localMarketPrices.find((entry) => entry.country_code === item.countryCode && entry.make === vehicle.make && entry.model === vehicle.model && entry.year === vehicle.year && entry.source_url === item.sourceUrl);
    if (!projected || projected.median_ask !== item.median || projected.sample_size !== item.sampleSize
        || (item.confidence && projected.confidence !== item.confidence)) {
      problems.push(`${key}: reviewed asking prices are missing from the interactive price pack; run cars:catalog:sync`);
    }
    for (const source of item.corroboratingSources || []) {
      if (!/^https:\/\//.test(source.sourceUrl || "") || !Number.isFinite(source.median) || source.median <= 0 || source.sampleSize < 3) {
        problems.push(`${key}: invalid corroborating source`);
      }
    }
  }

  const sourceSeen = new Set();
  for (const item of sourceMarketData.observations || []) {
    const key = `${item.sourceMarket}:${item.vehicleId}`;
    if (sourceSeen.has(key)) problems.push(`${key}: duplicate source-market observation`);
    sourceSeen.add(key);
    const vehicle = priceData.vehicles.find((entry) => entry.id === item.vehicleId);
    if (!vehicle) problems.push(`${key}: no matching priced vehicle`);
    if (!/^https:\/\//.test(item.sourceUrl || "") || !/^https:\/\//.test(item.fxSourceUrl || "")) problems.push(`${key}: source or FX URL missing`);
    if (![item.market, item.condition, item.currency, item.sampleVariant, item.sourceName, item.fxSourceName, item.method, item.limitations].every((value) => typeof value === "string" && value.trim())) {
      problems.push(`${key}: source-market evidence fields missing`);
    }
    if (dateOnly(item.sourceSnapshotAt) === null) problems.push(`${key}: invalid source snapshot date`);
    else if (dateOnly(item.sourceSnapshotAt) > now.getTime()) problems.push(`${key}: source snapshot date is in the future`);
    if (dateOnly(item.reviewedAt) === null || dateOnly(item.reviewedAt) > now.getTime()) problems.push(`${key}: invalid review date`);
    else if (dateOnly(item.sourceSnapshotAt) !== null && dateOnly(item.sourceSnapshotAt) > dateOnly(item.reviewedAt)) problems.push(`${key}: review precedes source snapshot`);
    if (!Number.isInteger(item.sampleSize) || item.sampleSize < 3) problems.push(`${key}: sample count too small or missing`);
    if (![item.lowerQuartile, item.median, item.upperQuartile].every((value) => Number.isFinite(value) && value > 0)
        || !(item.lowerQuartile <= item.median && item.median <= item.upperQuartile)) problems.push(`${key}: invalid price band`);
    if (!Number.isFinite(item.sourceCurrencyPerUsd) || item.sourceCurrencyPerUsd <= 0) problems.push(`${key}: invalid FX conversion`);
    const projected = vehicle && priceData.sourceMarketPrices.find((entry) => entry.source_market === item.sourceMarket && entry.make === vehicle.make && entry.model === vehicle.model && entry.year === vehicle.year && entry.source_url === item.sourceUrl);
    const expectedMedian = Math.round(item.median / item.sourceCurrencyPerUsd / 100) * 100;
    if (!projected || projected.median_price !== expectedMedian || projected.sample_size !== item.sampleSize) {
      problems.push(`${key}: reviewed source prices are missing from the interactive price pack; run cars:catalog:sync`);
    }
  }


  const staleRows = (rows, dateField, keyField) => rows
    .filter(item => dateOnly(item[dateField]) !== null && now.getTime() - dateOnly(item[dateField]) > staleDays * DAY)
    .map(item => ({
      key: `${item[keyField]}:${item.vehicleId}`, dateField, date: item[dateField],
      sourceUrl: item.sourceUrl
    }));
  const stale = {
    local: staleRows(marketData.observations, "reviewedAt", "countryCode"),
    source: staleRows(sourceMarketData.observations, "sourceSnapshotAt", "sourceMarket")
  };
  const uncovered = priceData.vehicles.filter(vehicle => !seen.has(`NG:${vehicle.id}`));
  return {
    schemaVersion: 1, asOf: now.toISOString(), staleAfterDays: staleDays,
    counts: {
      localObservations: marketData.observations.length, sourceObservations: sourceMarketData.observations.length,
      staleLocal: stale.local.length, staleSource: stale.source.length,
      uncoveredNigeria: uncovered.length, starterVehicles: priceData.vehicles.length
    },
    stale, uncoveredNigeria: uncovered.map(vehicle => vehicle.id), problems,
    validationFailed: problems.length > 0, freshnessFailed: stale.local.length + stale.source.length > 0
  };
}

function auditExitCode(report, strictFreshness = false) {
  return report.validationFailed || (strictFreshness && report.freshnessFailed) ? 1 : 0;
}

function main(args) {
  const clocks = args.filter(arg => arg.startsWith("--as-of="));
  if (clocks.length > 1 || args.some(arg => !["--json", "--strict-freshness"].includes(arg) && !arg.startsWith("--as-of="))) {
    throw new Error("Usage: audit-car-market-observations.js [--json] [--strict-freshness] [--as-of=ISO_TIMESTAMP]");
  }
  if (clocks.length && (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(clocks[0].slice(8))
      || dateOnly(clocks[0].slice(8, 18)) === null)) throw new Error("Invalid audit clock");
  const now = clocks.length ? new Date(clocks[0].slice(8)) : new Date();
  const root = path.join(__dirname, "..");
  const read = file => JSON.parse(fs.readFileSync(path.join(root, "data/cars", file), "utf8").replace(/^\uFEFF/, ""));
  const priceData = read("price-intelligence.json");
  const report = auditMarketObservations(priceData, read("market-observations.json"), read("source-market-observations.json"), { now });
  if (args.includes("--json")) console.log(JSON.stringify(report, null, 2));
  else {
    const c = report.counts;
    console.log(`Car market evidence: ${c.localObservations} local and ${c.sourceObservations} source-market samples, ${c.staleLocal} local and ${c.staleSource} source-market older than ${report.staleAfterDays} days, ${c.uncoveredNigeria}/${c.starterVehicles} starter vehicles without a Nigeria sample.`);
    const ids = new Set(report.uncoveredNigeria.slice(0, 8));
    console.log(`Next Nigeria research: ${priceData.vehicles.filter(vehicle => ids.has(vehicle.id)).map(vehicle => `${vehicle.year} ${vehicle.make} ${vehicle.model}`).join("; ") || "none"}`);
    if (report.stale.source.length) console.log(`Source-market refresh due: ${report.stale.source.map(item => item.key).join("; ")}`);
    report.problems.forEach(problem => console.error(problem));
  }
  process.exitCode = auditExitCode(report, args.includes("--strict-freshness"));
}

if (require.main === module) {
  try { main(process.argv.slice(2)); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
module.exports = { auditMarketObservations, auditExitCode };
