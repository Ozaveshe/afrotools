#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.resolve(__dirname, '..');
const OUTPUT = path.join(ROOT, 'data/afroatlas/research-indicators.json');
const FIRST_YEAR = 2016;
const LAST_YEAR = 2025;
const DEFINITIONS = {
  gdp: { indicator: 'NY.GDP.MKTP.CD', label: 'GDP', unit: 'current US$', min: 0 },
  population: { indicator: 'SP.POP.TOTL', label: 'Population', unit: 'people', min: 0 },
  gdpPC: { indicator: 'NY.GDP.PCAP.CD', label: 'GDP per person', unit: 'current US$ per person', min: 0 },
  growth: { indicator: 'NY.GDP.MKTP.KD.ZG', label: 'Real GDP growth', unit: 'annual %' },
  electricity: { indicator: 'EG.ELC.ACCS.ZS', label: 'Electricity access', unit: '% of population', min: 0, max: 100 },
  internet: { indicator: 'IT.NET.USER.ZS', label: 'Internet use', unit: '% of population', min: 0, max: 100 },
  lifeExp: { indicator: 'SP.DYN.LE00.IN', label: 'Life expectancy', unit: 'years at birth', min: 0, max: 120 },
  exportsTotal: { indicator: 'NE.EXP.GNFS.CD', label: 'Exports of goods and services', unit: 'current US$', min: 0 },
  importsTotal: { indicator: 'NE.IMP.GNFS.CD', label: 'Imports of goods and services', unit: 'current US$', min: 0 }
};

function registries() {
  const context = {};
  vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'engines/src/afroatlas-engine.js'), 'utf8'), context);
  return context.AfroAtlas;
}

function validValue(value, definition) {
  return Number.isFinite(value) && (definition.min == null || value >= definition.min)
    && (definition.max == null || value <= definition.max);
}

function validate(snapshot) {
  const atlas = registries();
  const codes = Object.keys(atlas.COUNTRIES).concat(Object.keys(atlas.WORLD_REF)).sort();
  if (snapshot.version !== 1 || !Number.isFinite(Date.parse(snapshot.retrieved_at))
      || snapshot.source_api !== 'https://api.worldbank.org/v2/'
      || snapshot.first_year !== FIRST_YEAR || snapshot.last_year !== LAST_YEAR
      || JSON.stringify(Object.keys(snapshot.definitions).sort()) !== JSON.stringify(Object.keys(DEFINITIONS).sort())
      || JSON.stringify(Object.keys(snapshot.countries).sort()) !== JSON.stringify(codes)) {
    throw new Error('Research snapshot identity or country coverage is invalid.');
  }
  const coverage = {};
  for (const [key, definition] of Object.entries(DEFINITIONS)) {
    coverage[key] = 0;
    if (JSON.stringify(snapshot.definitions[key]) !== JSON.stringify(definition)) throw new Error('Indicator definition mismatch: ' + key);
    for (const code of codes) {
      const record = snapshot.countries[code][key];
      if (!record) continue;
      const years = Object.keys(record.series).map(Number).sort((a, b) => b - a);
      if (!years.length || years[0] !== record.year || record.series[record.year] !== record.value
          || !Number.isFinite(Date.parse(record.provider_updated_at))
          || record.source_url !== `https://data.worldbank.org/indicator/${definition.indicator}?locations=${code}`) {
        throw new Error(`Invalid latest observation or source: ${code}/${key}`);
      }
      for (const year of years) {
        if (!Number.isInteger(year) || year < FIRST_YEAR || year > LAST_YEAR || !validValue(record.series[year], definition)) {
          throw new Error(`Invalid observation: ${code}/${key}/${year}`);
        }
      }
      coverage[key] += 1;
    }
    if (coverage[key] < (['exportsTotal', 'importsTotal'].includes(key) ? 45 : 55)) {
      throw new Error('Unexpectedly low indicator coverage: ' + key + ' ' + coverage[key]);
    }
  }
  return coverage;
}

async function fetchIndicator(codes, key, definition) {
  const url = `https://api.worldbank.org/v2/country/all/indicator/${definition.indicator}?format=json&date=${FIRST_YEAR}:${LAST_YEAR}&per_page=20000&source=2`;
  let payload;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(45000) });
      if (!response.ok) throw new Error('HTTP ' + response.status);
      payload = await response.json();
      if (!Array.isArray(payload) || !Array.isArray(payload[1]) || payload[0].pages !== 1) throw new Error('Incomplete World Bank response');
      break;
    } catch (error) {
      if (attempt === 3) throw new Error(`${key}: ${error.message}`);
      await new Promise(resolve => setTimeout(resolve, attempt * 1000));
    }
  }
  const series = Object.fromEntries(codes.map(code => [code, {}]));
  for (const row of payload[1]) {
    const code = row.country && row.country.id;
    const year = Number(row.date);
    if (!series[code] || row.indicator.id !== definition.indicator || !validValue(row.value, definition)
        || year < FIRST_YEAR || year > LAST_YEAR || !Number.isInteger(year)) continue;
    series[code][year] = row.value;
  }
  console.log(`${key}: ${Object.values(series).filter(row => Object.keys(row).length).length}/${codes.length} countries; WDI updated ${payload[0].lastupdated}`);
  return { key, series, updated: payload[0].lastupdated };
}

async function refresh() {
  const atlas = registries();
  const codes = Object.keys(atlas.COUNTRIES).concat(Object.keys(atlas.WORLD_REF)).sort();
  const snapshot = { version: 1, retrieved_at: '', source_name: 'World Bank World Development Indicators',
    source_api: 'https://api.worldbank.org/v2/', first_year: FIRST_YEAR, last_year: LAST_YEAR,
    coverage_note: 'Latest available non-null observations and annual series for 2016–2025. Observation years vary. Values may be revised; missing values are not zero.',
    definitions: DEFINITIONS, countries: Object.fromEntries(codes.map(code => [code, {}])) };
  const entries = Object.entries(DEFINITIONS);
  for (let offset = 0; offset < entries.length; offset += 3) {
    const results = await Promise.all(entries.slice(offset, offset + 3).map(([key, definition]) => fetchIndicator(codes, key, definition)));
    for (const result of results) {
      for (const code of codes) {
        const series = result.series[code];
        const year = Math.max(...Object.keys(series).map(Number));
        if (!Number.isFinite(year)) continue;
        snapshot.countries[code][result.key] = { value: series[year], year, series,
          source_url: `https://data.worldbank.org/indicator/${DEFINITIONS[result.key].indicator}?locations=${code}`,
          provider_updated_at: result.updated };
      }
    }
  }
  snapshot.retrieved_at = new Date().toISOString();
  const coverage = validate(snapshot);
  fs.writeFileSync(OUTPUT, JSON.stringify(snapshot, null, 2) + '\n');
  console.log('Saved verified research snapshot: ' + JSON.stringify(coverage));
}

if (require.main === module) {
  (process.argv.includes('--refresh') ? refresh() : Promise.resolve().then(() => console.log(validate(JSON.parse(fs.readFileSync(OUTPUT, 'utf8'))))))
    .catch(error => { console.error(error.message); process.exitCode = 1; });
}
module.exports = { DEFINITIONS, validate, validValue };
