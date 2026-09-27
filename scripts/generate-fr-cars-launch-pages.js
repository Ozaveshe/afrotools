const fs = require("fs");
const path = require("path");

const ImportEngine = require("../assets/js/lib/car-import-cost-engine.js");
const Price = require("../assets/js/lib/car-price-intelligence.js");
const { FR_CARS_COUNTRY_SLUG_TO_EN } = require("./lib/french-cars-route-map");

const root = path.join(__dirname, "..");
const englishCarsHtml = fs.readFileSync(path.join(root, "cars", "index.html"), "utf8");
const currentChatBundle = englishCarsHtml.match(/\bdata-chat-bundle=["']([^"']+)["']/);
if (!currentChatBundle) {
  throw new Error("English cars owner is missing its data-chat-bundle source.");
}
const chatBundlePath = currentChatBundle[1];
const priceData = readJson("data/cars/price-intelligence.json");
const observations = readJson("data/cars/market-observations.json").observations || [];
const importData = loadImportData();
const reciprocalPairs = [];

const COUNTRIES = [
  { code: "CI", frSlug: "cote-divoire", enSlug: "cote-divoire", frName: "Côte d'Ivoire", city: "Abidjan" },
  { code: "SN", frSlug: "senegal", enSlug: "senegal", frName: "Sénégal", city: "Dakar" },
  { code: "CM", frSlug: "cameroun", enSlug: "cameroon", frName: "Cameroun", city: "Douala" },
  { code: "MA", frSlug: "maroc", enSlug: "morocco", frName: "Maroc", city: "Casablanca" },
  { code: "DZ", frSlug: "algerie", enSlug: "algeria", frName: "Algérie", city: "Alger" },
  { code: "TN", frSlug: "tunisie", enSlug: "tunisia", frName: "Tunisie", city: "Tunis" },
  { code: "RW", frSlug: "rwanda", enSlug: "rwanda", frName: "Rwanda", city: "Kigali" },
  { code: "NG", frSlug: "nigeria", enSlug: "nigeria", frName: "Nigeria", city: "Lagos" },
  { code: "GH", frSlug: "ghana", enSlug: "ghana", frName: "Ghana", city: "Accra" },
  { code: "KE", frSlug: "kenya", enSlug: "kenya", frName: "Kenya", city: "Nairobi" },
  { code: "EG", frSlug: "egypte", enSlug: "egypt", frName: "Egypte", city: "Le Caire" },
  { code: "ET", frSlug: "ethiopie", enSlug: "ethiopia", frName: "Ethiopie", city: "Addis-Abeba" },
  { code: "AO", frSlug: "angola", enSlug: "angola", frName: "Angola", city: "Luanda" },
  { code: "ZA", frSlug: "afrique-du-sud", enSlug: "south-africa", frName: "Afrique du Sud", city: "Johannesburg" },
  { code: "MZ", frSlug: "mozambique", enSlug: "mozambique", frName: "Mozambique", city: "Maputo" },
  { code: "BW", frSlug: "botswana", enSlug: "botswana", frName: "Botswana", city: "Gaborone" },
  { code: "NA", frSlug: "namibie", enSlug: "namibia", frName: "Namibie", city: "Windhoek" },
  { code: "UG", frSlug: "ouganda", enSlug: "uganda", frName: "Ouganda", city: "Kampala" },
  { code: "ZM", frSlug: "zambie", enSlug: "zambia", frName: "Zambie", city: "Lusaka" },
  { code: "TZ", frSlug: "tanzanie", enSlug: "tanzania", frName: "Tanzanie", city: "Dar es Salaam" }
];

for (const country of COUNTRIES) {
  if (FR_CARS_COUNTRY_SLUG_TO_EN[country.frSlug] !== country.enSlug) {
    throw new Error(`French cars route map mismatch for ${country.frSlug}: expected ${country.enSlug}`);
  }
}

const COUNTRY_PLACE_FR = {
  CI: "en C\u00f4te d'Ivoire",
  SN: "au S\u00e9n\u00e9gal",
  CM: "au Cameroun",
  MA: "au Maroc",
  DZ: "en Alg\u00e9rie",
  TN: "en Tunisie",
  RW: "au Rwanda",
  NG: "au Nigeria",
  GH: "au Ghana",
  KE: "au Kenya",
  EG: "en \u00c9gypte",
  ET: "en \u00c9thiopie",
  AO: "en Angola",
  ZA: "en Afrique du Sud",
  MZ: "au Mozambique",
  BW: "au Botswana",
  NA: "en Namibie",
  UG: "en Ouganda",
  ZM: "en Zambie",
  TZ: "en Tanzanie"
};

const BASE_MODEL_PAGES = [
  { countryCode: "CI", make: "toyota", model: "corolla", year: 2018 },
  { countryCode: "SN", make: "toyota", model: "corolla", year: 2018 },
  { countryCode: "CM", make: "toyota", model: "corolla", year: 2018 },
  { countryCode: "CI", make: "toyota", model: "prado", year: 2016 },
  { countryCode: "CI", make: "toyota", model: "hilux", year: 2015 },
  { countryCode: "SN", make: "toyota", model: "prado", year: 2016 },
  { countryCode: "SN", make: "honda", model: "cr-v", year: 2016 },
  { countryCode: "CM", make: "toyota", model: "hilux", year: 2015 },
  { countryCode: "CM", make: "honda", model: "cr-v", year: 2016 },
  { countryCode: "MA", make: "toyota", model: "corolla", year: 2018 },
  { countryCode: "MA", make: "toyota", model: "prado", year: 2016 },
  { countryCode: "DZ", make: "toyota", model: "corolla", year: 2018 },
  { countryCode: "TN", make: "toyota", model: "corolla", year: 2018 },
  { countryCode: "RW", make: "toyota", model: "corolla", year: 2018 },
  { countryCode: "NG", make: "toyota", model: "corolla", year: 2018 },
  { countryCode: "CI", make: "honda", model: "cr-v", year: 2020 },
  { countryCode: "CI", make: "toyota", model: "camry", year: 2012 },
  { countryCode: "CI", make: "hyundai", model: "elantra", year: 2018 },
  { countryCode: "CI", make: "ford", model: "ranger", year: 2018 },
  { countryCode: "SN", make: "toyota", model: "hilux", year: 2015 },
  { countryCode: "SN", make: "hyundai", model: "elantra", year: 2018 },
  { countryCode: "SN", make: "toyota", model: "camry", year: 2012 },
  { countryCode: "SN", make: "nissan", model: "x-trail", year: 2015 },
  { countryCode: "CM", make: "toyota", model: "prado", year: 2016 },
  { countryCode: "CM", make: "hyundai", model: "elantra", year: 2018 },
  { countryCode: "CM", make: "ford", model: "ranger", year: 2018 },
  { countryCode: "CM", make: "toyota", model: "camry", year: 2012 },
  { countryCode: "MA", make: "honda", model: "cr-v", year: 2016 },
  { countryCode: "MA", make: "hyundai", model: "elantra", year: 2018 },
  { countryCode: "MA", make: "mercedes-benz", model: "c-class", year: 2016 },
  { countryCode: "MA", make: "toyota", model: "hilux", year: 2015 },
  { countryCode: "DZ", make: "toyota", model: "prado", year: 2016 },
  { countryCode: "DZ", make: "hyundai", model: "elantra", year: 2018 },
  { countryCode: "DZ", make: "kia", model: "sportage", year: 2017 },
  { countryCode: "TN", make: "toyota", model: "prado", year: 2016 },
  { countryCode: "TN", make: "hyundai", model: "elantra", year: 2018 },
  { countryCode: "TN", make: "kia", model: "sportage", year: 2017 },
  { countryCode: "RW", make: "toyota", model: "prado", year: 2016 },
  { countryCode: "RW", make: "toyota", model: "hilux", year: 2015 },
  { countryCode: "RW", make: "honda", model: "cr-v", year: 2016 },
  { countryCode: "EG", make: "toyota", model: "corolla", year: 2018 },
  { countryCode: "EG", make: "toyota", model: "prado", year: 2016 },
  { countryCode: "EG", make: "hyundai", model: "elantra", year: 2018 },
  { countryCode: "ET", make: "toyota", model: "corolla", year: 2018 },
  { countryCode: "ET", make: "toyota", model: "hilux", year: 2015 },
  { countryCode: "AO", make: "toyota", model: "hilux", year: 2015 },
  { countryCode: "AO", make: "toyota", model: "prado", year: 2016 },
  { countryCode: "ZA", make: "toyota", model: "corolla", year: 2018 },
  { countryCode: "ZA", make: "ford", model: "ranger", year: 2018 },
  { countryCode: "MZ", make: "toyota", model: "hilux", year: 2015 },
  { countryCode: "MZ", make: "toyota", model: "corolla", year: 2018 },
  { countryCode: "BW", make: "toyota", model: "hilux", year: 2015 },
  { countryCode: "NA", make: "toyota", model: "hilux", year: 2015 },
  { countryCode: "GH", make: "toyota", model: "corolla", year: 2018 },
  { countryCode: "GH", make: "toyota", model: "prado", year: 2016 },
  { countryCode: "GH", make: "toyota", model: "hilux", year: 2015 },
  { countryCode: "KE", make: "toyota", model: "corolla", year: 2018 },
  { countryCode: "KE", make: "toyota", model: "prado", year: 2016 },
  { countryCode: "KE", make: "toyota", model: "hilux", year: 2015 },
  { countryCode: "UG", make: "toyota", model: "corolla", year: 2018 },
  { countryCode: "UG", make: "toyota", model: "prado", year: 2016 },
  { countryCode: "UG", make: "toyota", model: "hilux", year: 2015 },
  { countryCode: "ZM", make: "toyota", model: "corolla", year: 2018 },
  { countryCode: "ZM", make: "toyota", model: "prado", year: 2016 },
  { countryCode: "ZM", make: "toyota", model: "hilux", year: 2015 },
  { countryCode: "TZ", make: "toyota", model: "corolla", year: 2018 },
  { countryCode: "TZ", make: "toyota", model: "prado", year: 2016 },
  { countryCode: "TZ", make: "toyota", model: "hilux", year: 2015 },
  { countryCode: "CI", make: "honda", model: "cr-v", year: 2016 },
  { countryCode: "DZ", make: "toyota", model: "hilux", year: 2015 },
  { countryCode: "DZ", make: "honda", model: "cr-v", year: 2016 },
  { countryCode: "TN", make: "toyota", model: "hilux", year: 2015 },
  { countryCode: "TN", make: "honda", model: "cr-v", year: 2016 },
  { countryCode: "RW", make: "hyundai", model: "elantra", year: 2018 },
  { countryCode: "NG", make: "toyota", model: "prado", year: 2016 },
  { countryCode: "NG", make: "toyota", model: "hilux", year: 2015 },
  { countryCode: "NG", make: "honda", model: "cr-v", year: 2016 },
  { countryCode: "NG", make: "hyundai", model: "elantra", year: 2018 },
  { countryCode: "GH", make: "honda", model: "cr-v", year: 2016 },
  { countryCode: "GH", make: "hyundai", model: "elantra", year: 2018 },
  { countryCode: "KE", make: "honda", model: "cr-v", year: 2016 },
  { countryCode: "KE", make: "hyundai", model: "elantra", year: 2018 },
  { countryCode: "EG", make: "toyota", model: "hilux", year: 2015 },
  { countryCode: "EG", make: "honda", model: "cr-v", year: 2016 },
  { countryCode: "ET", make: "toyota", model: "prado", year: 2016 },
  { countryCode: "ET", make: "honda", model: "cr-v", year: 2016 },
  { countryCode: "ET", make: "hyundai", model: "elantra", year: 2018 },
  { countryCode: "AO", make: "toyota", model: "corolla", year: 2018 },
  { countryCode: "AO", make: "honda", model: "cr-v", year: 2016 },
  { countryCode: "AO", make: "hyundai", model: "elantra", year: 2018 },
  { countryCode: "ZA", make: "toyota", model: "prado", year: 2016 },
  { countryCode: "ZA", make: "toyota", model: "hilux", year: 2015 },
  { countryCode: "ZA", make: "honda", model: "cr-v", year: 2016 },
  { countryCode: "ZA", make: "hyundai", model: "elantra", year: 2018 },
  { countryCode: "MZ", make: "toyota", model: "prado", year: 2016 },
  { countryCode: "MZ", make: "honda", model: "cr-v", year: 2016 },
  { countryCode: "MZ", make: "hyundai", model: "elantra", year: 2018 },
  { countryCode: "BW", make: "toyota", model: "corolla", year: 2018 },
  { countryCode: "BW", make: "toyota", model: "prado", year: 2016 },
  { countryCode: "BW", make: "honda", model: "cr-v", year: 2016 },
  { countryCode: "BW", make: "hyundai", model: "elantra", year: 2018 },
  { countryCode: "NA", make: "toyota", model: "corolla", year: 2018 },
  { countryCode: "NA", make: "toyota", model: "prado", year: 2016 },
  { countryCode: "NA", make: "honda", model: "cr-v", year: 2016 },
  { countryCode: "NA", make: "hyundai", model: "elantra", year: 2018 },
  { countryCode: "UG", make: "honda", model: "cr-v", year: 2016 },
  { countryCode: "UG", make: "hyundai", model: "elantra", year: 2018 },
  { countryCode: "ZM", make: "honda", model: "cr-v", year: 2016 },
  { countryCode: "ZM", make: "hyundai", model: "elantra", year: 2018 },
  { countryCode: "TZ", make: "honda", model: "cr-v", year: 2016 },
  { countryCode: "TZ", make: "hyundai", model: "elantra", year: 2018 }
];

const PRACTICAL_MARKET_MODEL_WAVE = [
  { make: "toyota", model: "vitz-yaris", year: 2015 },
  { make: "honda", model: "accord", year: 2014 },
  { make: "mazda", model: "demio", year: 2017 },
  { make: "nissan", model: "x-trail", year: 2015 },
  { make: "kia", model: "sportage", year: 2017 }
];

const FAMILY_AND_COMMERCIAL_MODEL_WAVE = [
  { make: "toyota", model: "camry", year: 2005 },
  { make: "toyota", model: "camry", year: 2012 },
  { make: "toyota", model: "axio", year: 2018 },
  { make: "toyota", model: "axio", year: 2019 },
  { make: "toyota", model: "noah", year: 2014 },
  { make: "toyota", model: "noah", year: 2018 },
  { make: "toyota", model: "prado", year: 2020 },
  { make: "toyota", model: "hilux", year: 2020 },
  { make: "honda", model: "cr-v", year: 2020 }
];

const PREMIUM_AND_WORKHORSE_MODEL_WAVE = [
  { make: "mercedes-benz", model: "c-class", year: 2016 },
  { make: "mercedes-benz", model: "e-class", year: 2017 },
  { make: "mercedes-benz", model: "g-wagon", year: 2022 },
  { make: "lexus", model: "rx", year: 2017 },
  { make: "lexus", model: "es", year: 2016 },
  { make: "ford", model: "ranger", year: 2018 }
];

const MODEL_PAGES = uniqueBy([
  ...BASE_MODEL_PAGES,
  ...expandModelWave(PRACTICAL_MARKET_MODEL_WAVE),
  ...expandModelWave(FAMILY_AND_COMMERCIAL_MODEL_WAVE),
  ...expandModelWave(PREMIUM_AND_WORKHORSE_MODEL_WAVE),
  ...observations.map((row) => {
    const vehicle = priceData.vehicles.find((item) => item.id === row.vehicleId);
    return vehicle && COUNTRIES.some((country) => country.code === row.countryCode)
      ? { countryCode: row.countryCode, make: vehicle.makeSlug, model: vehicle.modelSlug, year: vehicle.year }
      : null;
  }).filter(Boolean)
], (page) => `${page.countryCode}|${page.make}|${page.model}|${page.year}`);

const MAKE_PAGES = uniqueBy(MODEL_PAGES.map((page) => ({
  countryCode: page.countryCode,
  make: page.make
})), (page) => `${page.countryCode}|${page.make}`);

const MODEL_INDEX_PAGES = uniqueBy(MODEL_PAGES.map((page) => ({
  countryCode: page.countryCode,
  make: page.make,
  model: page.model
})), (page) => `${page.countryCode}|${page.make}|${page.model}`);

function uniqueBy(items, keyFn) {
  const seen = new Set();
  const out = [];
  for (const item of items) {
    const key = keyFn(item);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

function expandModelWave(modelSpecs) {
  const pages = [];
  for (const country of COUNTRIES) {
    for (const spec of modelSpecs) {
      const enPath = path.join(root, "cars", country.enSlug, spec.make, spec.model, String(spec.year), "index.html");
      if (!fs.existsSync(enPath)) continue;
      pages.push({
        countryCode: country.code,
        make: spec.make,
        model: spec.model,
        year: spec.year
      });
    }
  }
  return pages;
}

function readJson(relPath) {
  return JSON.parse(fs.readFileSync(path.join(root, relPath), "utf8"));
}

function loadImportData() {
  const core = readJson("data/trade/car-import-cost-core.json");
  const packs = ["ng", "ke", "gh", "ug", "zm", "tz"].map((slug) => readJson(`data/trade/car-import-cost-${slug}.json`));
  return ImportEngine.mergeData(core, packs, {
    USD: 1,
    NGN: 1535.5,
    KES: 129.45,
    GHS: 14.89,
    UGX: 3720,
    ZMW: 27.5,
    TZS: 2650,
    ZAR: 18.25,
    EGP: 53.7,
    MAD: 9.25,
    XOF: 560,
    XAF: 560,
    ETB: 157,
    RWF: 1461,
    AOA: 918,
    DZD: 132,
    TND: 2.92,
    MZN: 63.9,
    BWP: 13.6,
    NAD: 18.25
  });
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writePage(routePath, html) {
  const filePath = path.join(root, routePath, "index.html");
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, html, "utf8");
  return filePath;
}

function rememberReciprocal(enRoute, frRoute, indexable = false) {
  reciprocalPairs.push({
    enRoute: enRoute.replace(/^\/+|\/+$/g, ""),
    frRoute: frRoute.replace(/^\/+|\/+$/g, ""),
    indexable
  });
}

function injectEnglishHreflang({ enRoute, frRoute, indexable }) {
  const filePath = path.join(root, enRoute, "index.html");
  if (!fs.existsSync(filePath)) {
    throw new Error(`English cars counterpart missing: ${enRoute}`);
  }

  let html = fs.readFileSync(filePath, "utf8");
  const frenchTag = indexable ? `<link rel="alternate" hreflang="fr" href="${absUrl(frRoute)}">` : "";
  html = html.replace(
    /^[ \t]*<link\b(?=[^>]*\brel=["']alternate["'])(?=[^>]*\bhreflang=["']fr["'])[^>]*>[ \t]*\r?\n?/gim,
    ""
  );
  const canonical = html.match(/<link\b(?=[^>]*\brel=["']canonical["'])[^>]*>/i);
  const englishAlternate = html.match(/<link\b(?=[^>]*\brel=["']alternate["'])(?=[^>]*\bhreflang=["']en["'])[^>]*>/i);
  const anchor = englishAlternate || canonical;
  if (anchor && indexable) {
    html = html.replace(anchor[0], `${anchor[0]}\n${frenchTag}`);
  } else if (indexable) {
    html = html.replace("</head>", `  ${frenchTag}\n</head>`);
  }
  fs.writeFileSync(filePath, html, "utf8");
}

function absUrl(routePath) {
  return `https://afrotools.com/${routePath.replace(/^\/+|\/+$/g, "")}/`;
}

function normalizeFrenchText(value) {
  if (Array.isArray(value)) return value.map(normalizeFrenchText);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, nested]) => [key, normalizeFrenchText(nested)]));
  }
  let text = String(value == null ? "" : value);
  if (/[\u00c2\u00c3\u00e2]/.test(text)) {
    try {
      const repaired = Buffer.from(text, "latin1").toString("utf8");
      if (!repaired.includes("\ufffd")) text = repaired;
    } catch (_) {
      // Keep the original text if the runtime cannot safely repair mojibake.
    }
  }
  return text;
}

function escapeHtml(value) {
  return normalizeFrenchText(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[char]));
}

function escapeJson(value) {
  return JSON.stringify(normalizeFrenchText(value)).replace(/</g, "\\u003c");
}

function money(value, currency) {
  try {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: 0
    }).format(Number(value || 0));
  } catch (_) {
    return `${currency || "USD"} ${Math.round(Number(value || 0)).toLocaleString("fr-FR")}`;
  }
}

function countryByCode(code) {
  return COUNTRIES.find((country) => country.code === code);
}

function countryPlace(country) {
  return COUNTRY_PLACE_FR[country.code] || `en ${country.frName}`;
}

function contextFor(countryCode, vehicleSpec) {
  const country = countryByCode(countryCode);
  return Price.buildVehicleContext(priceData, importData, {
    country: country.enSlug,
    make: vehicleSpec.make,
    model: vehicleSpec.model,
    year: vehicleSpec.year
  });
}

function observationFor(countryCode, vehicle) {
  return observations.find((row) => row.countryCode === countryCode && row.vehicleId === vehicle.id) || null;
}

function observationLabel(observation, vehicle) {
  return observation.sampleVariantFr || observation.sampleVariant || `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
}

function freshObservation(observation) {
  if (!observation || observation.searchIndexEligible === false || !/^\d{4}-\d{2}-\d{2}$/.test(observation.reviewedAt || "")) return false;
  const ageDays = (Date.now() - Date.parse(`${observation.reviewedAt}T00:00:00Z`)) / 86400000;
  return ageDays >= 0 && ageDays <= 14;
}

function observedLocalPrice(ctx, countryCode) {
  const observation = observationFor(countryCode, ctx.vehicle);
  if (!observation) return "Aucun relevé local daté";
  return `<a href="${escapeHtml(observation.sourceUrl)}" rel="nofollow noopener">${money(observation.median, observation.currency)}</a><small> ${escapeHtml(observation.reviewedAt)} · ${observation.sampleSize} annonces</small>`;
}

function frenchRisk(label) {
  return {
    Low: "faible",
    Moderate: "modéré",
    Elevated: "élevé",
    High: "fort"
  }[label] || String(label || "estimé").toLowerCase();
}

function frenchLiquidity(label) {
  return {
    Slow: "lente",
    Fair: "correcte",
    Healthy: "bonne",
    Strong: "forte"
  }[label] || String(label || "estimée").toLowerCase();
}

function frenchVehicleProfile(vehicle) {
  const body = {
    sedan: "berline",
    suv: "SUV",
    pickup: "pick-up",
    hatchback: "citadine",
    mpv: "monospace",
    wagon: "break",
    coupe: "coupé",
    van: "fourgon",
    truck: "camion"
  }[vehicle.body] || vehicle.body;
  const fuel = (vehicle.fuel || []).map((item) => ({
    petrol: "essence",
    diesel: "diesel",
    hybrid: "hybride",
    ev: "électrique"
  }[item] || item)).join(" / ");
  const trim = String(vehicle.trim || "").replace(/\bsedan\b/gi, "berline").replace(/\bpetrol\b/gi, "essence");
  return `${trim} - ${body} - ${fuel} - ${vehicle.mileage}.`;
}

function layout({ title, description, canonical, enUrl, swUrl, schema, body, indexable = false }) {
  const pageBody = normalizeFrenchText(body);
  return `<!DOCTYPE html>
<html lang="fr" data-chat-bundle="${chatBundlePath}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="canonical" href="${canonical}">
  ${indexable ? `<link rel="alternate" hreflang="en" href="${enUrl}">\n  <link rel="alternate" hreflang="fr" href="${canonical}">\n  ${swUrl ? `<link rel="alternate" hreflang="sw" href="${swUrl}">` : ""}\n  <link rel="alternate" hreflang="x-default" href="${enUrl}">` : ""}
  <meta name="robots" content="${indexable ? "index, follow" : "noindex, follow"}">
  <meta name="tool-id" content="car-price-intelligence-fr">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="fr_FR">
  <meta property="og:site_name" content="AfroTools">
  <meta property="og:image" content="https://afrotools.com/assets/img/tools/car-price-intelligence.webp">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:image" content="https://afrotools.com/assets/img/tools/car-price-intelligence.webp">
  <link rel="stylesheet" href="/assets/css/tokens.min.css">
  <link rel="stylesheet" href="/assets/css/global.min.css">
  <link rel="stylesheet" href="/assets/css/cars-directory.css">
  <style>
    @view-transition{navigation:none}
    .fr-cars-main{background:#f8fafc;color:#172033}
    .fr-cars-shell{max-width:1180px;min-width:0;margin:0 auto;padding:0 1.25rem}
    .fr-cars-hero{background:#111827;color:#fff;padding:4.5rem 0 3.5rem}
    .fr-cars-hero h1{font-size:clamp(2rem,5vw,4rem);line-height:1.05;margin:.5rem 0 1rem}
    .fr-cars-hero p{max-width:760px;color:#d1d5db;font-size:1.08rem}
    .fr-kicker{color:#fbbf24;font-weight:800;text-transform:uppercase;font-size:.78rem;letter-spacing:.08em}
    .fr-cars-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:1rem;margin:2rem 0}
    .fr-cars-card{min-width:0;background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:1.15rem;box-shadow:0 8px 24px rgba(15,23,42,.06)}
    .fr-cars-card h2,.fr-cars-card h3{margin:.15rem 0 .55rem;color:#111827}
    .fr-cars-card p{color:#4b5563}
    .fr-cars-card a{font-weight:800;color:#0f766e;text-decoration:none;overflow-wrap:anywhere}
    .fr-cars-band{padding:2rem 0}
    .fr-cars-note{background:#ecfdf5;border-left:4px solid #0f766e;padding:1rem;border-radius:6px;color:#164e43}
    .fr-cars-table{width:100%;border-collapse:collapse;background:#fff;border-radius:8px;overflow:hidden}
    .fr-cars-table th,.fr-cars-table td{padding:.9rem;border-bottom:1px solid #e5e7eb;text-align:left}
    .fr-cars-actions{display:flex;flex-wrap:wrap;gap:.75rem;margin-top:1rem}
    .fr-cars-button{display:inline-flex;align-items:center;justify-content:center;padding:.8rem 1rem;border-radius:7px;background:#0f766e;color:#fff;text-decoration:none;font-weight:800}
    .fr-cars-button.secondary{background:#fff;color:#0f766e;border:1px solid #99f6e4}
    .fr-cars-picker{display:flex;flex-wrap:wrap;align-items:end;gap:.75rem;margin:1rem 0}
    .fr-cars-picker label{display:block;width:100%;font-weight:700}
    .fr-cars-picker select{min-height:44px;min-width:min(100%,300px);padding:.65rem;border:1px solid #94a3b8;border-radius:7px;background:#fff;color:#111827;font:inherit}
    .fr-cars-picker button{border:0;min-height:44px;cursor:pointer}
    .fr-cars-picker :focus-visible{outline:3px solid #f59e0b;outline-offset:2px}

    .fr-cars-source-list{display:grid;gap:.55rem;margin:0;padding-left:1.1rem}
    .fr-cars-source-list a{color:#0f766e;font-weight:800}
    .fr-cars-table-wrap{max-width:100%;overflow-x:auto}
    @media(max-width:720px){
      .fr-cars-hero{padding:3rem 0}
      .fr-cars-table,.fr-cars-table tbody,.fr-cars-table tr,.fr-cars-table td{display:block;width:100%;box-sizing:border-box}
      .fr-cars-table thead{display:none}
      .fr-cars-table tr{padding:.5rem 0;border-bottom:1px solid #e5e7eb}
      .fr-cars-table td{padding:.45rem .75rem;border:0;overflow-wrap:anywhere}
      .fr-cars-table td::before{content:attr(data-label);display:block;margin-bottom:.1rem;color:#334155;font-size:.85em;font-weight:700}
    }
  </style>
  <script type="application/ld+json">${escapeJson(schema)}</script>
</head>
<body class="cars-page fr-cars-main" data-fr-transport-parity="car-price-intelligence">
  <afro-navbar theme="dark" active="transport"></afro-navbar>
  ${pageBody}
  <afro-footer></afro-footer>
  <script src="/assets/js/components/navbar.min.js?v=43e4d9b2" defer></script>
  <script src="/assets/js/components/footer.min.js" defer></script>
  <script>
    (function () {
      var form = document.getElementById('frCarsEstimator');
      if (!form) return;
      form.addEventListener('submit', function (event) {
        event.preventDefault();
        var route = document.getElementById('fr-car-model').value;
        if (route && route.indexOf('/fr/cars/') === 0) window.location.assign(route);
      });
    })();
  </script>

</body>
</html>
`;
}

function breadcrumb(items) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  };
}

function faqSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Ces prix sont-ils des devis officiels ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Non. Les prix demandés datés viennent de petits relevés de marché liés à leur source. Les budgets source et les coûts d'import restent des estimations à vérifier auprès d'un vendeur, des douanes et d'un transitaire."
        }
      },
      {
        "@type": "Question",
        name: "Pourquoi certains marchés sont-ils en mode estimation ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Une page sans relevé local daté indique qu'un devis vendeur est nécessaire. Elle ne transforme pas un budget import en prix de marché."
        }
      }
    ]
  };
}

function renderHub() {
  const route = "fr/cars";
  const title = "Prix des voitures en Afrique | AfroTools";
  const description = "Choisissez une voiture, consultez les relevés datés de prix demandés au Nigeria et ouvrez un devis d'import modifiable. Les autres marchés exigent un devis vendeur.";
  rememberReciprocal("cars", route, true);
  const countryCards = COUNTRIES.map((country) => {
    const dataCountry = priceData.countries[country.code];
    return `<article class="fr-cars-card">
      <h2>${escapeHtml(country.frName)}</h2>
      <p>${escapeHtml(dataCountry.currency_code)} - ${escapeHtml(country.city)}. ${country.code === "NG" ? "Relevés datés disponibles pour quelques modèles." : "Un devis vendeur est nécessaire pour un prix local."}</p>
      <a href="/fr/cars/${country.frSlug}/">Voir le pays</a>
    </article>`;
  }).join("\n");
  const observedChoices = observations.map((row) => {
    const vehicle = priceData.vehicles.find((item) => item.id === row.vehicleId);
    const country = countryByCode(row.countryCode);
    if (!vehicle || !country) return null;
    return {
      route: `/fr/cars/${country.frSlug}/${vehicle.makeSlug}/${vehicle.modelSlug}/${vehicle.year}/`,
      label: observationLabel(row, vehicle),
      observation: row
    };
  }).filter(Boolean);
  const observedOptions = observedChoices.map((item) => `<option value="${escapeHtml(item.route)}">${escapeHtml(item.label)}</option>`).join("\n");
  const modelLinks = observedChoices.map((item) => {
    return `<li><a href="${escapeHtml(item.route)}">${escapeHtml(item.label)}</a> — ${money(item.observation.median, item.observation.currency)}, ${escapeHtml(item.observation.reviewedAt)} (${item.observation.sampleSize} annonces)</li>`;
  }).join("\n");
  const marketSources = observedChoices.map((item) => `<li><a href="${escapeHtml(item.observation.sourceUrl)}" rel="nofollow noopener">${escapeHtml(item.label)} — ${escapeHtml(item.observation.sourceName)}</a> · ${escapeHtml(item.observation.reviewedAt)}</li>`).join("\n");

  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: title,
      url: absUrl(route),
      inLanguage: "fr",
      description,
      publisher: { "@type": "Organization", name: "AfroTools", url: "https://afrotools.com/" }
    },
    breadcrumb([
      { name: "AfroTools", url: "https://afrotools.com/" },
      { name: "Voitures", url: absUrl(route) }
    ]),
    faqSchema()
  ];

  const body = `<main>
    <section class="fr-cars-hero">
      <div class="fr-cars-shell">
        <span class="fr-kicker">Voitures et import</span>
        <h1>Prix de voitures, import et achat local en Afrique francophone</h1>
        <p>Consultez des prix demandés datés lorsque nous avons un relevé. Pour les autres voitures, partez d'un vrai prix vendeur et ouvrez un devis d'import modifiable.</p>
        <div class="fr-cars-actions">
          <a class="fr-cars-button" href="/fr/cars/nigeria/">Voir les relevés au Nigeria</a>
          <a class="fr-cars-button secondary" href="/cars/">Annuaire complet en anglais</a>
        </div>
      </div>
    </section>
    <section class="fr-cars-shell fr-cars-band">
      <p class="fr-cars-note">${observedChoices.length} relevés locaux datés sur ${COUNTRIES.length} pays affichés. Les autres pages servent à trouver une voiture et préparer un devis ; elles ne prouvent pas un prix local.</p>

      <section class="fr-cars-card" data-tool-verification-panel="fr-cars-evidence" data-tool-id="car-price-intelligence-fr">
        <h2>Choisir un relevé local</h2>
        <p>Ces chiffres sont des prix demandés observés au Nigeria, pas des ventes conclues. Ouvrez une voiture pour la source, la date et les limites de l'échantillon.</p>
        <form class="fr-cars-picker" id="frCarsEstimator">
          <label for="fr-car-model">Voiture avec relevé daté</label>
          <select id="fr-car-model" name="vehicle">${observedOptions}</select>
          <button class="fr-cars-button" type="submit">Voir le relevé</button>
        </form>
        <p>Pour un autre modèle, cherchez dans l'<a href="/cars/">annuaire complet</a>. Pour calculer un coût d'import, saisissez le prix réel du vendeur dans le <a href="/tools/car-import-cost/">devis d'import modifiable</a> (en anglais).</p>
      </section>
      <div class="fr-cars-grid">
        <article class="fr-cars-card">
          <h2>Méthode</h2>
          <p>Les relevés sont des médianes de prix demandés avec une date, une taille d'échantillon et un lien source. Un budget source ou un taux de change ne devient pas un prix local observé.</p>
        </article>
        <article class="fr-cars-card">
          <h2>Limites</h2>
          <p>Avertissement : ce n'est pas un devis officiel, une évaluation douanière, un conseil financier ou une garantie de disponibilité. Confirmez les droits, l'état du véhicule, les restrictions d'âge et les frais avec l'autorité ou un agent agréé.</p>
        </article>
        <article class="fr-cars-card">
          <h2>Sources et fraîcheur</h2>
          <p>Les relevés sont liés aux pages de recherche consultées à la date indiquée. Ces annonces peuvent changer ou disparaître.</p>
          <ul class="fr-cars-source-list">
            ${marketSources}
          </ul>
        </article>
      </div>
      <div class="fr-cars-grid">${countryCards}</div>
      <div class="fr-cars-grid">
        <article class="fr-cars-card">
          <h2>Prix demandés observés</h2>
          <ul>${modelLinks}</ul>
        </article>
        <article class="fr-cars-card">
          <h2>Outils liés</h2>
          <ul>
            <li><a href="/fr/tools/droits-douane/">Droits de douane</a></li>
            <li><a href="/fr/tools/impact-fx-import/">Impact du change sur l'import</a></li>
            <li><a href="/fr/tools/pret-automobile/">Prêt automobile</a></li>
            <li><a href="/tools/car-import-cost/">Calculateur complet d'import voiture en anglais</a></li>
          </ul>
        </article>
      </div>
    </section>
  </main>`;

  return writePage(route, layout({ title, description, canonical: absUrl(route), enUrl: absUrl("cars"), swUrl: absUrl("sw/zana/bei-na-akili-ya-gari"), schema, body, indexable: true }));
}

function renderCountryPage(country) {
  const route = `fr/cars/${country.frSlug}`;
  const enRoute = `cars/${country.enSlug}`;
  const localObservations = observations
    .filter((row) => row.countryCode === country.code)
    .map((observation) => ({ observation, vehicle: priceData.vehicles.find((item) => item.id === observation.vehicleId) }))
    .filter((item) => item.vehicle);
  const indexable = localObservations.filter((item) => freshObservation(item.observation)).length >= 3;
  rememberReciprocal(enRoute, route, indexable);
  const place = countryPlace(country);
  const title = `Prix voitures — ${country.frName} | AfroTools`;
  const description = localObservations.length
    ? `${localObservations.length} relevés datés de prix demandés ${place}, avec source et taille d'échantillon. Préparez un devis d'import avec le prix réel du vendeur.`
    : `Trouvez une voiture ${place} et préparez un devis d'import. Aucun prix local observé n'est disponible pour ce pays.`;
  const rows = localObservations.map(({ observation, vehicle }) => {
    const modelRoute = `/fr/cars/${country.frSlug}/${vehicle.makeSlug}/${vehicle.modelSlug}/${vehicle.year}/`;
    return `<tr>
      <td data-label="Voiture"><a href="${modelRoute}">${escapeHtml(observationLabel(observation, vehicle))}</a></td>
      <td data-label="Médiane demandée">${money(observation.median, observation.currency)}</td>
      <td data-label="Quartiles observés">${money(observation.lowerQuartile, observation.currency)}–${money(observation.upperQuartile, observation.currency)}</td>
      <td data-label="Relevé">${escapeHtml(observation.reviewedAt)} · ${observation.sampleSize} annonces · <a href="${escapeHtml(observation.sourceUrl)}" rel="nofollow noopener">Source</a></td>
    </tr>`;
  }).join("\n");
  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: title,
      url: absUrl(route),
      inLanguage: "fr",
      description,
      isPartOf: { "@type": "WebSite", name: "AfroTools", url: "https://afrotools.com/" }
    },
    breadcrumb([
      { name: "AfroTools", url: "https://afrotools.com/" },
      { name: "Voitures", url: absUrl("fr/cars") },
      { name: country.frName, url: absUrl(route) }
    ]),
    faqSchema()
  ];
  const body = `<main>
    <section class="fr-cars-hero"><div class="fr-cars-shell">
      <span class="fr-kicker">Marché automobile</span>
      <h1>Prix de voitures ${escapeHtml(place)}</h1>
      <p>${localObservations.length ? `${localObservations.length} petits relevés de prix demandés avec date et lien source. Ils ne représentent pas des ventes conclues.` : "Aucun relevé local daté n'est disponible pour ce pays. Utilisez un devis vendeur pour comparer achat local et import."}</p>
      <div class="fr-cars-actions">
        <a class="fr-cars-button" href="/fr/cars/">Retour aux voitures</a>
        <a class="fr-cars-button secondary" href="/cars/${country.enSlug}/">Annuaire complet en anglais</a>
      </div>
    </div></section>
    <section class="fr-cars-shell fr-cars-band">
      <p class="fr-cars-note">Un prix demandé dépend de la version, de l'état, du kilométrage et du vendeur. La douane utilise sa propre évaluation ; vérifiez les règles en vigueur avant de payer.</p>
      ${rows ? `<div class="fr-cars-table-wrap"><table class="fr-cars-table"><thead><tr><th>Voiture</th><th>Médiane demandée</th><th>Quartiles observés</th><th>Relevé</th></tr></thead><tbody>${rows}</tbody></table></div>` : `<p>Les modèles de l'annuaire sont disponibles pour préparer un budget source, sans prix local observé pour ${escapeHtml(country.frName)}.</p>`}
      <div class="fr-cars-grid">
        <article class="fr-cars-card"><h2>Comparer un import</h2><p>Saisissez le prix réel du vendeur, le fret et les frais connus dans le calculateur. Les taux et la valeur douanière doivent être confirmés pour votre véhicule.</p><a href="/tools/car-import-cost/">Ouvrir le devis d'import modifiable (anglais)</a></article>
        <article class="fr-cars-card"><h2>Autres voitures</h2><p>Recherchez un modèle ou une année dans l'annuaire sans supposer qu'un prix local est déjà vérifié.</p><a href="/cars/">Chercher dans l'annuaire complet (anglais)</a></article>
      </div>
    </section>
  </main>`;
  return writePage(route, layout({ title, description, canonical: absUrl(route), enUrl: absUrl(enRoute), schema, body, indexable }));
}

function hasFrenchModelIndex(page) {
  return MODEL_INDEX_PAGES.some((item) => item.countryCode === page.countryCode && item.make === page.make && item.model === page.model);
}

function renderMakePage(page) {
  const country = countryByCode(page.countryCode);
  const route = `fr/cars/${country.frSlug}/${page.make}`;
  const enRoute = `cars/${country.enSlug}/${page.make}`;
  rememberReciprocal(enRoute, route);
  const place = countryPlace(country);
  const makeLabel = page.make.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
  const entries = MODEL_PAGES.filter((item) => item.countryCode === page.countryCode && item.make === page.make);
  const title = `Prix ${makeLabel} — ${country.frName} | AfroTools`;
  const description = `Modèles ${makeLabel} ${place}, budgets source indicatifs et relevés locaux datés lorsqu'ils existent. Les autres prix locaux exigent un devis vendeur.`;
  const rows = entries.map((item) => {
    const ctx = contextFor(item.countryCode, item);
    const modelRoute = hasFrenchModelIndex(item)
      ? `/fr/cars/${country.frSlug}/${ctx.vehicle.makeSlug}/${ctx.vehicle.modelSlug}/`
      : `/fr/cars/${country.frSlug}/${ctx.vehicle.makeSlug}/${ctx.vehicle.modelSlug}/${ctx.vehicle.year}/`;
    return `<tr>
      <td data-label="Modèle"><a href="${modelRoute}">${escapeHtml(ctx.vehicle.model)}</a></td>
      <td data-label="Année repère">${escapeHtml(ctx.vehicle.year)}</td>
      <td data-label="Coût rendu illustratif">${money(ctx.landed.normal * ctx.usdToLocal, ctx.localCurrency)}</td>
      <td data-label="Prix local daté">${observedLocalPrice(ctx, country.code)}</td>
      <td data-label="Statut">${observationFor(country.code, ctx.vehicle) ? "Relevé daté" : "Devis vendeur requis"}</td>
    </tr>`;
  }).join("\n");

  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: title,
      url: absUrl(route),
      inLanguage: "fr",
      description,
      isPartOf: { "@type": "WebSite", name: "AfroTools", url: "https://afrotools.com/" }
    },
    breadcrumb([
      { name: "AfroTools", url: "https://afrotools.com/" },
      { name: "Voitures", url: absUrl("fr/cars") },
      { name: country.frName, url: absUrl(`fr/cars/${country.frSlug}`) },
      { name: makeLabel, url: absUrl(route) }
    ])
  ];

  const body = `<main>
    <section class="fr-cars-hero">
      <div class="fr-cars-shell">
        <span class="fr-kicker">Marque automobile</span>
        <h1>${escapeHtml(makeLabel)} ${escapeHtml(place)}</h1>
        <p>Parcourez les modèles ${escapeHtml(makeLabel)}. Un prix local apparaît uniquement lorsqu'un relevé daté existe ; les autres cas exigent un devis vendeur.</p>
        <div class="fr-cars-actions">
          <a class="fr-cars-button" href="/fr/cars/${country.frSlug}/">Voir ${escapeHtml(country.frName)}</a>
          <a class="fr-cars-button secondary" href="/cars/${country.enSlug}/${page.make}/">Marque complète en anglais</a>
        </div>
      </div>
    </section>
    <section class="fr-cars-shell fr-cars-band">
      <p class="fr-cars-note">Ces pages restent des repères de budget. Elles n'annoncent pas un tarif officiel et ne remplacent pas un devis de transitaire, de vendeur ou de douane.</p>
      <div class="fr-cars-table-wrap"><table class="fr-cars-table">
        <thead><tr><th>Modèle</th><th>Année repère</th><th>Coût rendu illustratif</th><th>Prix local daté</th><th>Statut</th></tr></thead>
        <tbody>${rows}</tbody>
      </table></div>
    </section>
  </main>`;

  return writePage(route, layout({ title, description, canonical: absUrl(route), enUrl: absUrl(enRoute), schema, body }));
}

function renderModelIndexPage(page) {
  const country = countryByCode(page.countryCode);
  const ctx = contextFor(page.countryCode, { ...page, year: MODEL_PAGES.find((item) => item.countryCode === page.countryCode && item.make === page.make && item.model === page.model).year });
  const route = `fr/cars/${country.frSlug}/${ctx.vehicle.makeSlug}/${ctx.vehicle.modelSlug}`;
  const enRoute = `cars/${country.enSlug}/${ctx.vehicle.makeSlug}/${ctx.vehicle.modelSlug}`;
  rememberReciprocal(enRoute, route);
  const place = countryPlace(country);
  const vehicleLabel = `${ctx.vehicle.make} ${ctx.vehicle.model}`;
  const entries = MODEL_PAGES.filter((item) => item.countryCode === page.countryCode && item.make === page.make && item.model === page.model);
  const title = `Prix ${vehicleLabel} — ${country.frName} | AfroTools`;
  const description = `Années disponibles pour ${vehicleLabel} ${place}, budgets d'import illustratifs et prix locaux datés lorsqu'un relevé existe.`;
  const rows = entries.map((item) => {
    const yearCtx = contextFor(item.countryCode, item);
    return `<tr>
      <td data-label="Année"><a href="/fr/cars/${country.frSlug}/${yearCtx.vehicle.makeSlug}/${yearCtx.vehicle.modelSlug}/${yearCtx.vehicle.year}/">${escapeHtml(yearCtx.vehicle.year)}</a></td>
      <td data-label="Coût rendu illustratif">${money(yearCtx.landed.normal * yearCtx.usdToLocal, yearCtx.localCurrency)}</td>
      <td data-label="Prix local daté">${observedLocalPrice(yearCtx, country.code)}</td>
      <td data-label="Risque estimé">${escapeHtml(frenchRisk(yearCtx.importRisk.label))}</td>
      <td data-label="Liquidité estimée">${escapeHtml(frenchLiquidity(yearCtx.liquidity.label))}</td>
    </tr>`;
  }).join("\n");

  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: title,
      url: absUrl(route),
      inLanguage: "fr",
      description,
      about: {
        "@type": "Thing",
        name: vehicleLabel,
        description: `Repere de budget AfroTools pour ${vehicleLabel} ${place}.`
      }
    },
    breadcrumb([
      { name: "AfroTools", url: "https://afrotools.com/" },
      { name: "Voitures", url: absUrl("fr/cars") },
      { name: country.frName, url: absUrl(`fr/cars/${country.frSlug}`) },
      { name: ctx.vehicle.make, url: absUrl(`fr/cars/${country.frSlug}/${ctx.vehicle.makeSlug}`) },
      { name: ctx.vehicle.model, url: absUrl(route) }
    ])
  ];

  const body = `<main>
    <section class="fr-cars-hero">
      <div class="fr-cars-shell">
        <span class="fr-kicker">Modèle automobile</span>
        <h1>${escapeHtml(vehicleLabel)} ${escapeHtml(place)}</h1>
        <p>Choisissez une année. Le coût rendu reste illustratif et le prix local n'est affiché que lorsqu'un relevé daté existe.</p>
        <div class="fr-cars-actions">
          <a class="fr-cars-button" href="/fr/cars/${country.frSlug}/${ctx.vehicle.makeSlug}/">Voir ${escapeHtml(ctx.vehicle.make)}</a>
          <a class="fr-cars-button secondary" href="/cars/${country.enSlug}/${ctx.vehicle.makeSlug}/${ctx.vehicle.modelSlug}/">Modèle complet en anglais</a>
        </div>
      </div>
    </section>
    <section class="fr-cars-shell fr-cars-band">
      <p class="fr-cars-note">Ce récapitulatif regroupe uniquement les années déjà présentes dans la vague française. Les autres années restent dans l'annuaire anglais jusqu'à une génération plus large.</p>
      <div class="fr-cars-table-wrap"><table class="fr-cars-table">
        <thead><tr><th>Année</th><th>Coût rendu illustratif</th><th>Prix local daté</th><th>Risque estimé</th><th>Liquidité estimée</th></tr></thead>
        <tbody>${rows}</tbody>
      </table></div>
    </section>
  </main>`;

  return writePage(route, layout({ title, description, canonical: absUrl(route), enUrl: absUrl(enRoute), schema, body }));
}

function renderModelPage(page) {
  const country = countryByCode(page.countryCode);
  const ctx = contextFor(page.countryCode, page);
  const route = `fr/cars/${country.frSlug}/${ctx.vehicle.makeSlug}/${ctx.vehicle.modelSlug}/${ctx.vehicle.year}`;
  const enRoute = `cars/${country.enSlug}/${ctx.vehicle.makeSlug}/${ctx.vehicle.modelSlug}/${ctx.vehicle.year}`;
  const observation = observationFor(country.code, ctx.vehicle);
  const importIneligible = ctx.eligibilityStatus === "ineligible";
  const indexable = freshObservation(observation);
  rememberReciprocal(enRoute, route, indexable);
  const place = countryPlace(country);
  const vehicleName = `${ctx.vehicle.year} ${ctx.vehicle.make} ${ctx.vehicle.model}`;
  const title = `Prix ${vehicleName} — ${country.frName} | AfroTools`;
  const description = observation
    ? importIneligible
      ? `Prix demandés observés pour ${vehicleName} ${place}: médiane, quartiles, date et source. Ce modèle déclenche une alerte d'admissibilité à l'import.`
      : `Prix demandés observés pour ${vehicleName} ${place}: médiane, quartiles, date, échantillon et source. Le coût d'import reste illustratif.`
    : `Budget source et coût d'import illustratifs pour ${vehicleName} ${place}. Aucun relevé de prix local daté n'est disponible.`;
  const priceRows = [
    ["Budget source illustratif", money(ctx.sourcePrice.median * ctx.usdToLocal, ctx.localCurrency), money(ctx.sourcePrice.median, "USD"), "Ancien budget AfroTools, pas une annonce vendeur actuelle."],
    ["Coût rendu illustratif", importIneligible ? "Non applicable" : money(ctx.landed.normal * ctx.usdToLocal, ctx.localCurrency), importIneligible ? "—" : money(ctx.landed.normal, "USD"), importIneligible ? "Ce véhicule déclenche une alerte d'admissibilité à l'import. Confirmez la règle auprès des douanes avant tout achat." : country.code === "NG" ? "Le pack douanier Nigeria est sous revue de la politique 2026." : "Vérifiez les droits et frais avec l'autorité et un transitaire."],
    ["Prix demandé local observé", observation ? money(observation.median, observation.currency) : "Aucun relevé local daté", "—", observation ? `${escapeHtml(observation.reviewedAt)} · ${observation.sampleSize} annonces · <a href="${escapeHtml(observation.sourceUrl)}" rel="nofollow noopener">Consulter la source</a>` : "Un budget import ne prouve pas le prix d'un véhicule local."]
  ].map(([label, local, usd, note]) => `<tr><td data-label="Couche de prix">${label}</td><td data-label="Devise locale">${local}</td><td data-label="Référence USD">${usd}</td><td data-label="Note">${note}</td></tr>`).join("\n");

  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: title,
      url: absUrl(route),
      inLanguage: "fr",
      description,
      about: {
        "@type": "Thing",
        name: vehicleName,
        description: `Estimation AfroTools pour ${vehicleName} ${place}, sans annonce vendeur ni offre commerciale.`,
        identifier: `${ctx.vehicle.makeSlug}-${ctx.vehicle.modelSlug}-${ctx.vehicle.year}`
      }
    },
    breadcrumb([
      { name: "AfroTools", url: "https://afrotools.com/" },
      { name: "Voitures", url: absUrl("fr/cars") },
      { name: country.frName, url: absUrl(`fr/cars/${country.frSlug}`) },
      { name: vehicleName, url: absUrl(route) }
    ])
  ];

  const body = `<main>
    <section class="fr-cars-hero">
      <div class="fr-cars-shell">
        <span class="fr-kicker">Fiche voiture</span>
        <h1>${escapeHtml(vehicleName)} ${escapeHtml(place)}</h1>
        <p>${observation ? `Au ${escapeHtml(observation.reviewedAt)}, un petit relevé de ${observation.sampleSize} annonces${observation.sampleVariant ? ` pour ${escapeHtml(observationLabel(observation, ctx.vehicle))}` : ""} donnait un prix demandé médian de ${money(observation.median, observation.currency)}. Ce n'est pas un prix de vente conclu.` : "Aucun prix local observé et daté n'est disponible pour cette voiture. Demandez un devis vendeur avant de comparer."}</p>
        <div class="fr-cars-actions">
          <a class="fr-cars-button" href="/fr/cars/${country.frSlug}/">Voir ${escapeHtml(country.frName)}</a>
          <a class="fr-cars-button secondary" href="/cars/${country.enSlug}/${ctx.vehicle.makeSlug}/${ctx.vehicle.modelSlug}/${ctx.vehicle.year}/">Voir la fiche complète en anglais</a>
        </div>
      </div>
    </section>
    <section class="fr-cars-shell fr-cars-band">
      <p class="fr-cars-note">${observation ? `Relevé : ${escapeHtml(observation.market)}, ${escapeHtml(observation.condition)}, ${observation.sampleSize} annonces. Prix demandés, non ventes conclues. Les annonces peuvent varier selon la version, le kilométrage et l'état du véhicule. La méthode détaillée et les exclusions figurent sur la fiche anglaise.` : "Sans relevé local, aucune recommandation d'achat local ou d'import ne peut être déduite de ce budget."} ${importIneligible && country.code === "NG" ? "Le portail commercial du Nigeria indique que les véhicules importés doivent avoir moins de 15 ans depuis leur année de fabrication. Ce modèle dépasse la limite indiquée ; confirmez la règle actuelle auprès des douanes." : country.code === "NG" ? "Les taux d'import du Nigeria sont sous revue pour 2026." : "Confirmez les règles d'import avant paiement."}</p>
      <div class="fr-cars-table-wrap"><table class="fr-cars-table">
        <thead><tr><th>Couche de prix</th><th>Devise locale</th><th>Référence USD</th><th>Note</th></tr></thead>
        <tbody>${priceRows}</tbody>
      </table></div>
      <div class="fr-cars-grid">
        <article class="fr-cars-card">
          <h2>Profil véhicule</h2>
          <p>${escapeHtml(frenchVehicleProfile(ctx.vehicle))}</p>
        </article>
        <article class="fr-cars-card">
          <h2>À ne pas oublier</h2>
          <p>Cette page ne remplace pas une évaluation douanière. Le budget source et le coût rendu sont des scénarios, tandis que le relevé local, lorsqu'il existe, regroupe des prix demandés et non des ventes conclues.</p>
        </article>
      </div>
    </section>
  </main>`;

  return writePage(route, layout({ title, description, canonical: absUrl(route), enUrl: absUrl(enRoute), schema, body, indexable }));
}

const written = [renderHub()];
COUNTRIES.forEach((country) => written.push(renderCountryPage(country)));
MAKE_PAGES.forEach((page) => written.push(renderMakePage(page)));
MODEL_INDEX_PAGES.forEach((page) => written.push(renderModelIndexPage(page)));
MODEL_PAGES.forEach((page) => written.push(renderModelPage(page)));
reciprocalPairs.forEach(injectEnglishHreflang);

console.log(`Generated ${written.length} French cars launch pages`);
console.log(`Updated ${reciprocalPairs.length} English cars hreflang counterparts`);
