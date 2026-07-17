#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const datasetPath = path.join(root, "data", "energy", "solar-roi-country-dataset.js");
const dataset = require(datasetPath);

const REQUIRED_COUNTRY_COUNT = 54;
const REQUIRED_ASSUMPTIONS = [
  "electricityTariff",
  "fuelPrice",
  "installCostPerKw",
  "batteryCost",
  "solarYield",
  "performanceRatio"
];
const OPTIONAL_VALUE_ASSUMPTIONS = new Set(["co2Factor"]);
const ALL_ASSUMPTIONS = REQUIRED_ASSUMPTIONS.concat(["co2Factor"]);
const ALLOWED_CONFIDENCE = new Set(["High", "Medium", "Low"]);
const ALLOWED_SOURCE_TYPES = new Set([
  "official",
  "market_estimate",
  "afrotools_planning_assumption",
  "not_available"
]);
const REQUIRED_SOLAR_RESOURCE_FALLBACKS = [
  "manualOverride",
  "cityOverrides",
  "regionOverrides",
  "countryDefaults",
  "legacyEnergyData",
  "afrotoolsFallback"
];
const FORBIDDEN_COPY_PHRASES = [
  "one of africa's key markets",
  "one of africa's key market",
  "one of africa\u2019s key markets",
  "one of africa\u2019s key market",
  "one of africa\u00e2\u20ac\u2122s key markets",
  "one of africa\u00e2\u20ac\u2122s key market",
  "key market in africa",
  "this country page is a quick bill-and-system check"
];

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function validDate(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function validNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function decodeHtml(value) {
  return String(value || "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&mdash;/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

function getTitle(html) {
  const match = html.match(/<title>([\s\S]*?)<\/title>/i);
  return match ? decodeHtml(match[1]) : "";
}

function getMetaContent(html, selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = selector.startsWith("og:")
    ? new RegExp(`<meta\\s+property="${escaped}"\\s+content="([^"]*)"`, "i")
    : new RegExp(`<meta\\s+name="${escaped}"\\s+content="([^"]*)"`, "i");
  const match = html.match(pattern);
  return match ? decodeHtml(match[1]) : "";
}

function getCanonical(html) {
  const match = html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i);
  return match ? decodeHtml(match[1]) : "";
}

function addUniqueValue(map, value, file, label, failures) {
  if (!hasText(value)) {
    failures.push(`${file}: missing ${label}.`);
    return;
  }
  if (map.has(value)) {
    failures.push(`${file}: duplicate ${label} also used by ${map.get(value)}.`);
    return;
  }
  map.set(value, file);
}

function formatStatus(passed) {
  return passed ? "PASS" : "FAIL";
}

function printTable(checks) {
  const headers = ["Check", "Status", "Details"];
  const rows = checks.map(check => [check.name, formatStatus(check.passed), check.details]);
  const widths = headers.map((header, index) => {
    return Math.max(header.length, ...rows.map(row => String(row[index]).length));
  });
  const renderRow = row => {
    return `| ${row.map((cell, index) => String(cell).padEnd(widths[index])).join(" | ")} |`;
  };
  const divider = `| ${widths.map(width => "-".repeat(width)).join(" | ")} |`;

  console.log("Solar ROI country data report");
  console.log(renderRow(headers));
  console.log(divider);
  for (const row of rows) console.log(renderRow(row));
}

function firstFailures(failures, limit = 30) {
  if (failures.length <= limit) return failures;
  return failures.slice(0, limit).concat([`...and ${failures.length - limit} more.`]);
}

function buildReport() {
  const checks = [];
  const rows = dataset && dataset.countries ? dataset.countries : {};
  const entries = Object.entries(rows);
  const slugs = new Map();
  const countryCountFailures = [];
  const currencyFailures = [];
  const assumptionFailures = [];
  const freshnessFailures = [];
  const confidenceFailures = [];
  const slugFailures = [];
  const pageFailures = [];
  const metadataFailures = [];
  const copyFailures = [];
  const solarResourceFailures = [];

  function addCheck(name, passed, details, failures) {
    checks.push({
      name,
      passed,
      details,
      failures: failures || []
    });
  }

  if (!dataset || dataset.requiredCountryCount !== REQUIRED_COUNTRY_COUNT) {
    countryCountFailures.push("Dataset requiredCountryCount must be 54.");
  }
  if (!dataset || dataset.countryCount !== REQUIRED_COUNTRY_COUNT) {
    countryCountFailures.push("Dataset countryCount must be 54.");
  }
  if (entries.length !== REQUIRED_COUNTRY_COUNT) {
    countryCountFailures.push(`Expected ${REQUIRED_COUNTRY_COUNT} countries, found ${entries.length}.`);
  }

  if (!dataset.solarResource || typeof dataset.solarResource !== "object") {
    solarResourceFailures.push("Dataset missing solarResource adapter metadata.");
  } else {
    if (dataset.solarResource.interface !== "getSolarYield(country, region?, city?)") {
      solarResourceFailures.push("Dataset solarResource.interface must document getSolarYield(country, region?, city?).");
    }
    if (!hasText(dataset.solarResource.currentProvider)) {
      solarResourceFailures.push("Dataset solarResource missing currentProvider.");
    }
    if (!hasText(dataset.solarResource.countryValueField)) {
      solarResourceFailures.push("Dataset solarResource missing countryValueField.");
    }
    if (!Array.isArray(dataset.solarResource.fallbackOrder)) {
      solarResourceFailures.push("Dataset solarResource fallbackOrder must be an array.");
    } else {
      for (const fallback of REQUIRED_SOLAR_RESOURCE_FALLBACKS) {
        if (!dataset.solarResource.fallbackOrder.includes(fallback)) {
          solarResourceFailures.push(`Dataset solarResource fallbackOrder missing ${fallback}.`);
        }
      }
    }
    if (!dataset.solarResource.regionOverrides || typeof dataset.solarResource.regionOverrides !== "object") {
      solarResourceFailures.push("Dataset solarResource.regionOverrides must exist for future region PVOUT values.");
    }
    if (!dataset.solarResource.cityOverrides || typeof dataset.solarResource.cityOverrides !== "object") {
      solarResourceFailures.push("Dataset solarResource.cityOverrides must exist for future city PVOUT values.");
    }
  }

  for (const [code, country] of entries) {
    const prefix = `${code}:`;
    if (!hasText(country.countryName)) currencyFailures.push(`${prefix} missing countryName.`);
    if (!hasText(country.slug)) slugFailures.push(`${prefix} missing slug.`);
    if (!hasText(country.currency)) currencyFailures.push(`${prefix} missing currency.`);
    if (!hasText(country.currencySymbol)) currencyFailures.push(`${prefix} missing currencySymbol.`);
    if (!ALLOWED_CONFIDENCE.has(country.confidenceLevel)) {
      confidenceFailures.push(`${prefix} confidenceLevel must be High, Medium, or Low.`);
    }
    if (!hasText(country.notes)) assumptionFailures.push(`${prefix} missing notes.`);

    if (country.slug) {
      if (slugs.has(country.slug)) {
        slugFailures.push(`${prefix} duplicate slug ${country.slug} also used by ${slugs.get(country.slug)}.`);
      }
      slugs.set(country.slug, code);
      const routePath = path.join(root, "tools", "solar-roi", country.slug, "index.html");
      if (!fs.existsSync(routePath)) {
        pageFailures.push(`${prefix} missing country route tools/solar-roi/${country.slug}/index.html.`);
      }
    }

    if (!country.assumptions || typeof country.assumptions !== "object") {
      assumptionFailures.push(`${prefix} missing assumptions object.`);
      continue;
    }

    for (const key of REQUIRED_ASSUMPTIONS) {
      if (!country.assumptions[key]) {
        assumptionFailures.push(`${prefix} missing ${key} assumption.`);
      }
    }

    for (const key of ALL_ASSUMPTIONS) {
      const assumption = country.assumptions[key];
      if (!assumption) continue;
      const field = `${prefix} ${key}`;
      if (!OPTIONAL_VALUE_ASSUMPTIONS.has(key) && !validNumber(assumption.value)) {
        assumptionFailures.push(`${field} missing numeric value.`);
      }
      if (OPTIONAL_VALUE_ASSUMPTIONS.has(key) && assumption.value != null && !validNumber(assumption.value)) {
        assumptionFailures.push(`${field} value must be numeric or null.`);
      }
      if (!hasText(assumption.unit)) assumptionFailures.push(`${field} missing unit.`);
      if (!hasText(assumption.sourceName)) assumptionFailures.push(`${field} missing sourceName.`);
      if (!Object.prototype.hasOwnProperty.call(assumption, "sourceUrl")) {
        assumptionFailures.push(`${field} missing sourceUrl field.`);
      } else if (assumption.sourceUrl != null && !hasText(assumption.sourceUrl)) {
        assumptionFailures.push(`${field} sourceUrl must be a non-empty string or null.`);
      }
      if (!validDate(assumption.freshness)) freshnessFailures.push(`${field} freshness must be YYYY-MM-DD.`);
      if (!ALLOWED_CONFIDENCE.has(assumption.confidence)) {
        confidenceFailures.push(`${field} confidence must be High, Medium, or Low.`);
      }
      if (!ALLOWED_SOURCE_TYPES.has(assumption.sourceType)) {
        assumptionFailures.push(`${field} sourceType must be official, market_estimate, afrotools_planning_assumption, or not_available.`);
      }
      if (assumption.sourceType === "official" && !hasText(assumption.sourceUrl)) {
        assumptionFailures.push(`${field} official sourceType requires sourceUrl.`);
      }
      if (!hasText(assumption.notes)) assumptionFailures.push(`${field} missing notes.`);
    }
  }

  const titles = new Map();
  const descriptions = new Map();
  const canonicals = new Map();
  const countryPages = entries
    .map(([, country]) => {
      if (!country.slug) return null;
      return {
        country,
        file: path.join(root, "tools", "solar-roi", country.slug, "index.html")
      };
    })
    .filter(Boolean);

  for (const page of countryPages) {
    if (!fs.existsSync(page.file)) continue;
    const html = fs.readFileSync(page.file, "utf8");
    addUniqueValue(titles, getTitle(html), page.file, "title", metadataFailures);
    addUniqueValue(descriptions, getMetaContent(html, "description"), page.file, "description", metadataFailures);
    addUniqueValue(canonicals, getCanonical(html), page.file, "canonical", metadataFailures);

    const lowerHtml = html.toLowerCase();
    for (const phrase of FORBIDDEN_COPY_PHRASES) {
      if (lowerHtml.includes(phrase)) {
        copyFailures.push(`${page.file}: forbidden generic phrase "${phrase}".`);
      }
    }
  }

  addCheck(
    "All 54 countries exist",
    countryCountFailures.length === 0,
    `${entries.length}/${REQUIRED_COUNTRY_COUNT} records; dataset declares ${dataset && dataset.countryCount}`,
    countryCountFailures
  );
  addCheck(
    "Currency present",
    currencyFailures.length === 0,
    `${entries.length - new Set(currencyFailures.map(item => item.split(":")[0])).size}/${entries.length} countries pass`,
    currencyFailures
  );
  addCheck(
    "Tariff/fuel/install/battery/yield assumptions",
    assumptionFailures.length === 0,
    `${REQUIRED_ASSUMPTIONS.join(", ")} checked`,
    assumptionFailures
  );
  addCheck(
    "Freshness dates present",
    freshnessFailures.length === 0,
    `YYYY-MM-DD freshness checked on ${ALL_ASSUMPTIONS.join(", ")}`,
    freshnessFailures
  );
  addCheck(
    "Source confidence present",
    confidenceFailures.length === 0,
    "High / Medium / Low checked for countries and assumptions",
    confidenceFailures
  );
  addCheck(
    "No duplicate slugs",
    slugFailures.length === 0,
    `${slugs.size} unique slugs`,
    slugFailures
  );
  addCheck(
    "No missing country pages",
    pageFailures.length === 0,
    `${countryPages.length - pageFailures.length}/${countryPages.length} generated routes found`,
    pageFailures
  );
  addCheck(
    "Metadata unique",
    metadataFailures.length === 0,
    `${titles.size} titles, ${descriptions.size} descriptions, ${canonicals.size} canonicals`,
    metadataFailures
  );
  addCheck(
    "Forbidden generic copy absent",
    copyFailures.length === 0,
    `${FORBIDDEN_COPY_PHRASES.length} forbidden phrase variants scanned`,
    copyFailures
  );
  addCheck(
    "Solar resource adapter metadata",
    solarResourceFailures.length === 0,
    "getSolarYield fallback metadata checked",
    solarResourceFailures
  );

  const errors = checks.flatMap(check => check.failures);
  return {
    checks,
    errors,
    passed: errors.length === 0
  };
}

function run() {
  const report = buildReport();
  printTable(report.checks);

  if (report.errors.length) {
    console.error("");
    console.error("Failures:");
    for (const failure of firstFailures(report.errors)) {
      console.error(`- ${failure}`);
    }
    process.exit(1);
  }

  console.log("");
  console.log(`Solar ROI country data report: PASS (${REQUIRED_COUNTRY_COUNT} countries)`);
}

if (require.main === module) {
  run();
}

module.exports = {
  buildReport,
  FORBIDDEN_COPY_PHRASES,
  REQUIRED_COUNTRY_COUNT,
  REQUIRED_ASSUMPTIONS
};
