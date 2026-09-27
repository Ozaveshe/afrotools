const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const priceData = JSON.parse(fs.readFileSync(path.join(root, "data/cars/price-intelligence.json"), "utf8"));
const marketData = JSON.parse(fs.readFileSync(path.join(root, "data/cars/market-observations.json"), "utf8"));
const vehicles = new Set(priceData.vehicles.map((vehicle) => vehicle.id));
const seen = new Set();
const problems = [];
const now = new Date();
const staleDays = 14;

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
  if (!/^\d{4}-\d{2}-\d{2}$/.test(item.reviewedAt || "") || !Number.isFinite(Date.parse(item.reviewedAt))) problems.push(`${key}: invalid review date`);
  else if (new Date(item.reviewedAt) > now) problems.push(`${key}: review date is in the future`);
  if (!Number.isInteger(item.sampleSize) || item.sampleSize < 3) problems.push(`${key}: sample count too small or missing`);
  if (![item.lowerQuartile, item.median, item.upperQuartile].every((value) => Number.isFinite(value) && value > 0)
      || !(item.lowerQuartile <= item.median && item.median <= item.upperQuartile)) problems.push(`${key}: invalid price band`);
  for (const source of item.corroboratingSources || []) {
    if (!/^https:\/\//.test(source.sourceUrl || "") || !Number.isFinite(source.median) || source.median <= 0 || source.sampleSize < 3) {
      problems.push(`${key}: invalid corroborating source`);
    }
  }
}

const observations = marketData.observations || [];
const stale = observations.filter((item) => (now - new Date(item.reviewedAt)) / 86400000 > staleDays);
const uncovered = priceData.vehicles.filter((vehicle) => !seen.has(`NG:${vehicle.id}`));
console.log(`Car market evidence: ${observations.length} country/vehicle samples, ${stale.length} older than ${staleDays} days, ${uncovered.length}/${priceData.vehicles.length} starter vehicles without a Nigeria sample.`);
console.log(`Next Nigeria research: ${uncovered.slice(0, 8).map((vehicle) => `${vehicle.year} ${vehicle.make} ${vehicle.model}`).join("; ") || "none"}`);
if (problems.length) {
  problems.forEach((problem) => console.error(problem));
  process.exitCode = 1;
}
