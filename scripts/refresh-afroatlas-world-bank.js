#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const OUTPUT = path.join(ROOT, "data", "afroatlas", "world-bank-core-indicators.json");
const CACHE = path.join(ROOT, ".tmp", "afroatlas-world-bank-cache", new Date().toISOString().slice(0, 10));
const ENGINE = path.join(ROOT, "engines", "src", "afroatlas-engine.js");
const DEFINITIONS = {
  gdp: { code: "NY.GDP.MKTP.CD", unit: "current US$" },
  population: { code: "SP.POP.TOTL", unit: "people" },
  gdpPC: { code: "NY.GDP.PCAP.CD", unit: "current US$ per person" }
};
const FIRST_YEAR = 2016;
const LAST_YEAR = 2025;

function countryCodes() {
  const context = {};
  vm.runInNewContext(fs.readFileSync(ENGINE, "utf8"), context, { filename: ENGINE });
  return Object.keys(context.AfroAtlas.COUNTRIES).sort();
}

function validSnapshot(snapshot, codes) {
  if (!snapshot || snapshot.version !== 1 || !snapshot.countries || !/^20\d\d-\d\d-\d\dT/.test(snapshot.retrieved_at)) {
    throw new Error("AfroAtlas World Bank snapshot has no valid version, countries, or retrieval date.");
  }
  const actual = Object.keys(snapshot.countries).sort();
  if (JSON.stringify(actual) !== JSON.stringify(codes)) throw new Error("Snapshot country codes differ from AfroAtlas.");
  const coverage = { gdp: 0, population: 0, gdpPC: 0 };
  for (const code of codes) {
    for (const [key, definition] of Object.entries(DEFINITIONS)) {
      const point = snapshot.countries[code][key];
      if (!point) continue;
      if (!Number.isFinite(point.value) || point.value <= 0 || !/^20\d\d$/.test(String(point.year))) {
        throw new Error(`Invalid ${key} point for ${code}.`);
      }
      if (point.indicator !== definition.code || point.unit !== definition.unit || point.source !== "World Bank WDI") {
        throw new Error(`Missing source or unit for ${key} in ${code}.`);
      }
      if (point.year < FIRST_YEAR || point.year > LAST_YEAR ||
          point.source_url !== `https://data.worldbank.org/indicator/${definition.code}?locations=${code}` ||
          point.confidence !== "source-backed") {
        throw new Error(`Invalid source date or link for ${key} in ${code}.`);
      }
      coverage[key] += 1;
    }
    const history = snapshot.countries[code].gdp_history || {};
    if (snapshot.countries[code].gdp && history[snapshot.countries[code].gdp.year] !== snapshot.countries[code].gdp.value) {
      throw new Error(`GDP history does not match the latest point for ${code}.`);
    }
    if (!snapshot.countries[code].gdp && Object.keys(history).length) {
      throw new Error(`Unexpected GDP history for ${code}.`);
    }
  }
  if (coverage.population < 48 || coverage.gdp < 45 || coverage.gdpPC < 45) {
    throw new Error(`World Bank coverage is too low: ${JSON.stringify(coverage)}`);
  }
  return coverage;
}

async function fetchSeries(codes, definition) {
  const records = new Map(codes.map(code => [code, []]));
  for (let start = 0; start < codes.length; start += 5) {
    const group = codes.slice(start, start + 5);
    const url = `https://api.worldbank.org/v2/country/${group.join(";")}/indicator/${definition.code}?format=json&date=${FIRST_YEAR}:${LAST_YEAR}&per_page=20000&source=2`;
    const cacheFile = path.join(CACHE, `${definition.code}-${group.join("-")}.json`);
    let payload;
    if (fs.existsSync(cacheFile)) {
      payload = JSON.parse(fs.readFileSync(cacheFile, "utf8"));
    } else {
      let lastError;
      for (let attempt = 1; attempt <= 3; attempt += 1) {
        try {
          const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          payload = await response.json();
          break;
        } catch (error) {
          lastError = error;
          if (attempt < 3) await new Promise(resolve => setTimeout(resolve, attempt * 1000));
        }
      }
      if (!payload) throw new Error(`World Bank ${definition.code} failed for ${group.join(",")}: ${lastError.message}`);
      fs.mkdirSync(CACHE, { recursive: true });
      fs.writeFileSync(cacheFile, JSON.stringify(payload));
    }
    if (!Array.isArray(payload) || !Array.isArray(payload[1])) throw new Error(`World Bank ${definition.code} response has no rows for ${group.join(",")}.`);
    for (const row of payload[1]) {
      const code = row && row.country && row.country.id;
      if (!records.has(code) || !Number.isFinite(row.value) || row.value <= 0) continue;
      const year = Number(row.date);
      if (year < FIRST_YEAR || year > LAST_YEAR) continue;
      records.get(code).push({ year, value: row.value });
    }
    console.log(`World Bank ${definition.code}: ${Math.min(start + group.length, codes.length)}/${codes.length} countries read`);
  }
  return records;
}

async function refresh() {
  const codes = countryCodes();
  const series = {};
  for (const [key, definition] of Object.entries(DEFINITIONS)) {
    series[key] = await fetchSeries(codes, definition);
  }
  const countries = {};
  for (const code of codes) {
    const record = {};
    for (const [key, definition] of Object.entries(DEFINITIONS)) {
      const points = series[key].get(code).sort((a, b) => b.year - a.year);
      if (!points.length) continue;
      const latest = points[0];
      record[key] = {
        value: latest.value,
        year: latest.year,
        indicator: definition.code,
        unit: definition.unit,
        source: "World Bank WDI",
        source_url: `https://data.worldbank.org/indicator/${definition.code}?locations=${code}`,
        confidence: "source-backed"
      };
      if (key === "gdp") record.gdp_history = Object.fromEntries(points.map(point => [point.year, point.value]).sort((a, b) => Number(a[0]) - Number(b[0])));
    }
    countries[code] = record;
  }
  const snapshot = {
    version: 1,
    retrieved_at: new Date().toISOString(),
    source_name: "World Bank World Development Indicators",
    source_api: "https://api.worldbank.org/v2/",
    coverage_note: "The latest non-null observation from 2016–2025 is retained per country and indicator. The World Bank may revise these values.",
    countries
  };
  const coverage = validSnapshot(snapshot, codes);
  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  fs.writeFileSync(OUTPUT, JSON.stringify(snapshot, null, 2) + "\n");
  console.log(`Saved dated AfroAtlas World Bank snapshot for ${codes.length} countries: ${JSON.stringify(coverage)}`);
}

function check() {
  const coverage = validSnapshot(JSON.parse(fs.readFileSync(OUTPUT, "utf8")), countryCodes());
  console.log(`AfroAtlas World Bank snapshot is valid: ${JSON.stringify(coverage)}`);
}

if (require.main === module) {
  (process.argv.includes("--refresh") ? refresh() : Promise.resolve().then(check)).catch(error => {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  });
}

module.exports = { validSnapshot, countryCodes };
