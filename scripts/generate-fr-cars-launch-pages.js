const fs = require("fs");
const path = require("path");

const ImportEngine = require("../assets/js/lib/car-import-cost-engine.js");
const Price = require("../assets/js/lib/car-price-intelligence.js");
const { FR_CARS_COUNTRY_SLUG_TO_EN } = require("./lib/french-cars-route-map");

const root = path.join(__dirname, "..");
const priceData = readJson("data/cars/price-intelligence.json");
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
  ...expandModelWave(PREMIUM_AND_WORKHORSE_MODEL_WAVE)
], (page) => `${page.countryCode}|${page.make}|${page.model}|${page.year}`);

const TOP_MODELS = [
  { make: "toyota", model: "corolla", year: 2018 },
  { make: "toyota", model: "prado", year: 2016 },
  { make: "toyota", model: "hilux", year: 2015 },
  { make: "honda", model: "cr-v", year: 2016 },
  { make: "hyundai", model: "elantra", year: 2018 }
];

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

function rememberReciprocal(enRoute, frRoute) {
  reciprocalPairs.push({
    enRoute: enRoute.replace(/^\/+|\/+$/g, ""),
    frRoute: frRoute.replace(/^\/+|\/+$/g, "")
  });
}

function injectEnglishHreflang({ enRoute, frRoute }) {
  const filePath = path.join(root, enRoute, "index.html");
  if (!fs.existsSync(filePath)) {
    throw new Error(`English cars counterpart missing: ${enRoute}`);
  }

  let html = fs.readFileSync(filePath, "utf8");
  const block = [
    `<link rel="alternate" hreflang="en" href="${absUrl(enRoute)}">`,
    `<link rel="alternate" hreflang="fr" href="${absUrl(frRoute)}">`,
    `<link rel="alternate" hreflang="x-default" href="${absUrl(enRoute)}">`
  ].join("\n  ");

  html = html.replace(/<link\s+rel=["']alternate["']\s+hreflang=["'][^"']+["']\s+href=["'][^"']+["']\s*\/?>\s*\n?/gi, "");
  if (html.includes('<meta name="robots"')) {
    html = html.replace('<meta name="robots"', `${block}\n  <meta name="robots"`);
  } else {
    html = html.replace("</head>", `  ${block}\n</head>`);
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

function frenchRecommendation(status) {
  return {
    "import-likely-cheaper": "Import potentiellement moins cher",
    "import-better-spec": "Import surtout utile pour une meilleure version",
    borderline: "À comparer avec prudence",
    "buy-local": "Achat local probablement plus simple",
    "too-risky": "Trop risqué sans vérification"
  }[status] || "Estimation à vérifier";
}

function frenchRecommendationExplanation(ctx) {
  const ratio = ctx.localPrice.median ? Math.round((ctx.landed.normal / ctx.localPrice.median) * 100) : null;
  const prefix = ratio ? `Le coût rendu normal représente environ ${ratio}% du prix local médian estimé. ` : "";
  const messages = {
    "import-likely-cheaper": "L'import peut sembler moins cher, mais il faut garder une marge pour le change, le stockage, les documents et l'évaluation finale.",
    "import-better-spec": "L'import peut surtout se justifier pour obtenir une version plus propre, une meilleure finition ou un kilométrage plus bas, pas seulement pour gagner sur le prix.",
    borderline: "L'écart n'est pas assez large pour conclure vite. Comparez la version exacte, l'état réel, les documents et les frais de port avant de payer.",
    "buy-local": "L'achat local paraît plus simple ou plus compétitif une fois les délais, le transport intérieur et l'immatriculation ajoutés.",
    "too-risky": "Le profil est trop sensible pour être recommandé sans vérification locale des règles et des documents."
  };
  return prefix + (messages[ctx.recommendation.status] || "Utilisez cette estimation comme point de départ avant de demander un devis local.");
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

function frenchPricingMode(value) {
  return value === "full-rule-pack" ? "règles complètes" : "estimation d'annuaire";
}

function frenchCountryIntro(country, sourceCountry) {
  return `${country.frName} démarre en français avec des fourchettes en ${sourceCountry.currency_code}, une lecture du coût rendu et une comparaison prudente avec le prix local.`;
}

function frenchHiddenCosts() {
  return "Le change, l'inspection, les documents d'expédition, le transport intérieur, le stockage, l'immatriculation et la marge du vendeur peuvent déplacer le budget final.";
}

function frenchRiskCopy(sourceCountry) {
  if (sourceCountry.pricingMode === "full-rule-pack") {
    return "Ce marché dispose d'un pack plus complet, mais le résultat reste une estimation à vérifier avant paiement.";
  }
  return "Ce marché reste en estimation d'annuaire jusqu'à l'ajout d'un pack complet de règles douanières. Utilisez les fourchettes pour préparer le budget, puis vérifiez les droits avec un transitaire ou un agent local.";
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

function layout({ title, description, canonical, enUrl, schema, body }) {
  const pageBody = normalizeFrenchText(body);
  return `<!DOCTYPE html>
<html lang="fr" data-chat-bundle="/assets/js/bundles/chat.8446833d.min.js">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="canonical" href="${canonical}">
  <link rel="alternate" hreflang="en" href="${enUrl}">
  <link rel="alternate" hreflang="fr" href="${canonical}">
  <link rel="alternate" hreflang="x-default" href="${enUrl}">
  <meta name="robots" content="index, follow">
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
    .fr-cars-main{background:#f8fafc;color:#172033}
    .fr-cars-shell{max-width:1180px;margin:0 auto;padding:0 1.25rem}
    .fr-cars-hero{background:#111827;color:#fff;padding:4.5rem 0 3.5rem}
    .fr-cars-hero h1{font-size:clamp(2rem,5vw,4rem);line-height:1.05;margin:.5rem 0 1rem}
    .fr-cars-hero p{max-width:760px;color:#d1d5db;font-size:1.08rem}
    .fr-kicker{color:#fbbf24;font-weight:800;text-transform:uppercase;font-size:.78rem;letter-spacing:.08em}
    .fr-cars-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:1rem;margin:2rem 0}
    .fr-cars-card{background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:1.15rem;box-shadow:0 8px 24px rgba(15,23,42,.06)}
    .fr-cars-card h2,.fr-cars-card h3{margin:.15rem 0 .55rem;color:#111827}
    .fr-cars-card p{color:#4b5563}
    .fr-cars-card a{font-weight:800;color:#0f766e;text-decoration:none}
    .fr-cars-band{padding:2rem 0}
    .fr-cars-note{background:#ecfdf5;border-left:4px solid #0f766e;padding:1rem;border-radius:6px;color:#164e43}
    .fr-cars-table{width:100%;border-collapse:collapse;background:#fff;border-radius:8px;overflow:hidden}
    .fr-cars-table th,.fr-cars-table td{padding:.9rem;border-bottom:1px solid #e5e7eb;text-align:left}
    .fr-cars-actions{display:flex;flex-wrap:wrap;gap:.75rem;margin-top:1rem}
    .fr-cars-button{display:inline-flex;align-items:center;justify-content:center;padding:.8rem 1rem;border-radius:7px;background:#0f766e;color:#fff;text-decoration:none;font-weight:800}
    .fr-cars-button.secondary{background:#fff;color:#0f766e;border:1px solid #99f6e4}

    .fr-cars-tool{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(280px,.95fr);gap:1rem;margin:1.25rem 0 2rem}
    .fr-cars-form{background:#fff;border:1px solid #dbe5f0;border-radius:10px;padding:1rem;box-shadow:0 14px 36px rgba(15,23,42,.08)}
    .fr-cars-form h2,.fr-cars-output h2{margin:.1rem 0 .4rem;color:#111827}
    .fr-cars-form p,.fr-cars-output p{color:#4b5563;margin:.2rem 0 .85rem;line-height:1.6}
    .fr-cars-fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.8rem}
    .fr-cars-field{display:grid;gap:.35rem;color:#334155;font-weight:800;font-size:.88rem}
    .fr-cars-field input,.fr-cars-field select,.fr-cars-field textarea{width:100%;border:1px solid #cbd5e1;border-radius:8px;padding:.75rem;font:inherit;color:#111827;background:#fff}
    .fr-cars-field textarea{min-height:108px;resize:vertical}
    .fr-cars-output{background:#0f172a;color:#fff;border-radius:10px;padding:1rem;box-shadow:0 18px 44px rgba(15,23,42,.22)}
    .fr-cars-output h2,.fr-cars-output p{color:#fff}
    .fr-cars-result-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.7rem;margin:.85rem 0}
    .fr-cars-metric{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.14);border-radius:8px;padding:.75rem}
    .fr-cars-metric span{display:block;color:#cbd5e1;font-size:.75rem;text-transform:uppercase;letter-spacing:.08em}
    .fr-cars-metric strong{display:block;font-size:1.05rem;margin-top:.22rem}
    .fr-cars-output textarea{width:100%;min-height:132px;border:1px solid rgba(255,255,255,.2);border-radius:8px;background:#111827;color:#e5e7eb;padding:.75rem;font:inherit;resize:vertical}
    .fr-cars-source-list{display:grid;gap:.55rem;margin:0;padding-left:1.1rem}
    .fr-cars-source-list a{color:#0f766e;font-weight:800}
    @media(max-width:860px){.fr-cars-tool{grid-template-columns:1fr}.fr-cars-fields{grid-template-columns:1fr}.fr-cars-result-grid{grid-template-columns:1fr}}
    @media(max-width:720px){.fr-cars-hero{padding:3rem 0}.fr-cars-table{font-size:.92rem}}
  </style>
  <script type="application/ld+json">${escapeJson(schema)}</script>
</head>
<body class="cars-page fr-cars-main">
  <afro-navbar theme="dark" active="transport"></afro-navbar>
  ${pageBody}
  <afro-footer></afro-footer>
  <script src="/assets/js/components/navbar.min.js?v=43e4d9b2" defer></script>
  <script src="/assets/js/components/footer.min.js" defer></script>

  <script>
    (function () {
      var form = document.getElementById('frCarsEstimator');
      if (!form) return;
      var market = document.getElementById('fr-car-market');
      var model = document.getElementById('fr-car-model');
      var budget = document.getElementById('fr-car-budget');
      var fx = document.getElementById('fr-car-fx');
      var logistics = document.getElementById('fr-car-logistics');
      var localFees = document.getElementById('fr-car-local-fees');
      var verdict = document.getElementById('frCarsVerdict');
      var context = document.getElementById('frCarsContext');
      var landed = document.getElementById('frCarsLanded');
      var local = document.getElementById('frCarsLocal');
      var gap = document.getElementById('frCarsGap');
      var risk = document.getElementById('frCarsRisk');
      var summary = document.getElementById('frCarsSummary');
      function num(el){ return Math.max(0, Number(el.value) || 0); }
      function selected(el){ return el.options[el.selectedIndex]; }
      function fmt(value, currency){ return Math.round(value).toLocaleString('fr-FR') + ' ' + currency; }
      function calculate(){
        var m = selected(market);
        var car = selected(model);
        var currency = m.dataset.currency || '';
        var baseUsd = Number(car.dataset.price) || 0;
        var fxRate = num(fx);
        var duty = Number(m.dataset.duty) || 0;
        var factor = Number(m.dataset.factor) || 1;
        var landedLocal = ((baseUsd + num(logistics)) * (1 + duty) * fxRate) + num(localFees);
        var localLow = landedLocal * factor * 0.92;
        var localHigh = landedLocal * factor * 1.08;
        var budgetValue = num(budget);
        var gapValue = budgetValue - landedLocal;
        var ok = gapValue >= 0;
        verdict.textContent = ok ? 'Budget plausible, marge a garder' : 'Budget court, hypothese a revoir';
        context.textContent = selected(market).text + ' - ' + selected(model).text + '. Comparez ce repere avec un devis vendeur, douane et transitaire avant paiement.';
        landed.textContent = fmt(landedLocal, currency);
        local.textContent = fmt(localLow, currency) + ' - ' + fmt(localHigh, currency);
        gap.textContent = (ok ? '+' : '-') + fmt(Math.abs(gapValue), currency);
        risk.textContent = (car.dataset.risk || 'Moyen') + ' / revente ' + (car.dataset.resale || 'a verifier');
        summary.value = 'Marche: ' + selected(market).text + '\nModele: ' + selected(model).text + '\nCout rendu estime: ' + landed.textContent + '\nFourchette locale: ' + local.textContent + '\nMarge budget: ' + gap.textContent + '\nNote: estimation AfroTools, a verifier avec vendeur, transitaire et autorite.';
      }
      form.addEventListener('submit', function(event){ event.preventDefault(); calculate(); });
      ['change','input'].forEach(function(evt){ [market, model, budget, fx, logistics, localFees].forEach(function(el){ el.addEventListener(evt, calculate); }); });
      document.getElementById('frCarsExample').addEventListener('click', function(){ market.value='ci'; model.value='Toyota Corolla 2018'; budget.value='9500000'; fx.value='610'; logistics.value='2400'; localFees.value='450000'; calculate(); });
      document.getElementById('frCarsCopy').addEventListener('click', function(){ calculate(); if (navigator.clipboard) navigator.clipboard.writeText(summary.value); });
      calculate();
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
          text: "Non. Les pages françaises de lancement utilisent les fourchettes AfroTools existantes, le taux de change et les profils de marché disponibles. Elles servent à préparer un budget, pas à remplacer une cotation de douane ou de transitaire."
        }
      },
      {
        "@type": "Question",
        name: "Pourquoi certains marchés sont-ils en mode estimation ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Les pays sans pack complet de règles douanières restent marqués comme estimation d'annuaire. AfroTools affiche la devise locale et les fourchettes, puis recommande une vérification locale avant paiement."
        }
      }
    ]
  };
}

function renderHub() {
  const route = "fr/cars";
  const title = "Voitures en Afrique francophone | Prix, import et achat local | AfroTools";
  const description = "Point de départ français pour comparer les prix de voitures, les coûts d'importation, les fourchettes locales et les pages utiles avant d'acheter ou d'importer.";
  rememberReciprocal("cars", route);
  const countryCards = COUNTRIES.map((country) => {
    const dataCountry = priceData.countries[country.code];
    return `<article class="fr-cars-card">
      <h2>${escapeHtml(country.frName)}</h2>
      <p>${escapeHtml(dataCountry.currency_code)} - ${escapeHtml(country.city)}. Marché en ${escapeHtml(frenchPricingMode(dataCountry.pricingMode))}.</p>
      <a href="/fr/cars/${country.frSlug}/">Voir les prix voiture</a>
    </article>`;
  }).join("\n");
  const modelLinks = MODEL_PAGES.map((page) => {
    const country = countryByCode(page.countryCode);
    const ctx = contextFor(page.countryCode, page);
    const vehicleName = `${ctx.vehicle.year} ${ctx.vehicle.make} ${ctx.vehicle.model}`;
    return `<li><a href="/fr/cars/${country.frSlug}/${page.make}/${page.model}/${page.year}/">${escapeHtml(vehicleName)} - ${escapeHtml(country.frName)}</a></li>`;
  }).join("\n");

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
        <p>Une surface française plus utile pour préparer un achat automobile sans prétendre que tout l'annuaire anglais est déjà traduit. Les pages ci-dessous reprennent les données voitures existantes, les devises locales et les modes d'estimation disponibles.</p>
        <div class="fr-cars-actions">
          <a class="fr-cars-button" href="/fr/cars/cote-divoire/">Commencer par la Côte d'Ivoire</a>
          <a class="fr-cars-button secondary" href="/cars/">Annuaire complet en anglais</a>
        </div>
      </div>
    </section>
    <section class="fr-cars-shell fr-cars-band">
      <p class="fr-cars-note">Lancement prudent : ${COUNTRIES.length} marchés francophones ou très pertinents en français, ${MAKE_PAGES.length} pages de marque, ${MODEL_INDEX_PAGES.length} pages de modèle et ${MODEL_PAGES.length} pages année. Aucun lot massif n'est ajouté à la main.</p>

      <section class="fr-cars-tool" aria-label="Estimateur voiture Afrique francophone" data-tool-verification-panel="fr-cars-estimator" data-tool-id="car-price-intelligence-fr">
        <form class="fr-cars-form" id="frCarsEstimator">
          <span class="fr-kicker">Estimateur 2026</span>
          <h2>Comparer achat local et import</h2>
          <p>Choisissez un marche, une voiture cible et vos hypotheses. Le resultat reste une estimation de planification, pas une cotation officielle.</p>
          <div class="fr-cars-fields">
            <label class="fr-cars-field">Marche
              <select id="fr-car-market" name="market">
                <option value="ci" data-currency="XOF" data-city="Abidjan" data-factor="1.12" data-duty="0.38">Cote d'Ivoire</option>
                <option value="sn" data-currency="XOF" data-city="Dakar" data-factor="1.10" data-duty="0.36">Senegal</option>
                <option value="cm" data-currency="XAF" data-city="Douala" data-factor="1.16" data-duty="0.42">Cameroun</option>
                <option value="ma" data-currency="MAD" data-city="Casablanca" data-factor="1.08" data-duty="0.34">Maroc</option>
                <option value="ng" data-currency="NGN" data-city="Lagos" data-factor="1.18" data-duty="0.45">Nigeria</option>
                <option value="ke" data-currency="KES" data-city="Nairobi" data-factor="1.14" data-duty="0.40">Kenya</option>
                <option value="gh" data-currency="GHS" data-city="Accra" data-factor="1.13" data-duty="0.38">Ghana</option>
              </select>
            </label>
            <label class="fr-cars-field">Modele
              <select id="fr-car-model" name="model">
                <option value="Toyota Corolla 2018" data-price="9800" data-risk="Faible" data-resale="Fort">Toyota Corolla 2018</option>
                <option value="Toyota Prado 2016" data-price="23500" data-risk="Moyen" data-resale="Fort">Toyota Prado 2016</option>
                <option value="Toyota Hilux 2015" data-price="18500" data-risk="Moyen" data-resale="Fort">Toyota Hilux 2015</option>
                <option value="Honda CR-V 2016" data-price="14500" data-risk="Moyen" data-resale="Bon">Honda CR-V 2016</option>
                <option value="Hyundai Elantra 2018" data-price="9200" data-risk="Faible" data-resale="Bon">Hyundai Elantra 2018</option>
              </select>
            </label>
            <label class="fr-cars-field">Budget local
              <input id="fr-car-budget" name="budget" type="number" inputmode="decimal" min="0" step="1000" value="9500000">
            </label>
            <label class="fr-cars-field">Taux FX local pour 1 USD
              <input id="fr-car-fx" name="fx" type="number" inputmode="decimal" min="1" step="1" value="610">
            </label>
            <label class="fr-cars-field">Fret, assurance et port (USD)
              <input id="fr-car-logistics" name="logistics" type="number" inputmode="decimal" min="0" step="100" value="2400">
            </label>
            <label class="fr-cars-field">Frais agent et immatriculation
              <input id="fr-car-local-fees" name="localFees" type="number" inputmode="decimal" min="0" step="1000" value="450000">
            </label>
          </div>
          <div class="fr-cars-actions">
            <button class="fr-cars-button" type="submit">Comparer</button>
            <button class="fr-cars-button secondary" type="button" id="frCarsExample">Exemple</button>
            <button class="fr-cars-button secondary" type="button" id="frCarsCopy">Copier le resume</button>
          </div>
        </form>
        <aside class="fr-cars-output" aria-live="polite">
          <span class="fr-kicker">Resultat</span>
          <h2 id="frCarsVerdict">Budget a verifier</h2>
          <p id="frCarsContext">Comparez le cout rendu, la marge de securite et le risque avant de parler a un vendeur ou transitaire.</p>
          <div class="fr-cars-result-grid">
            <div class="fr-cars-metric"><span>Cout rendu estime</span><strong id="frCarsLanded">-</strong></div>
            <div class="fr-cars-metric"><span>Fourchette achat local</span><strong id="frCarsLocal">-</strong></div>
            <div class="fr-cars-metric"><span>Marge budget</span><strong id="frCarsGap">-</strong></div>
            <div class="fr-cars-metric"><span>Risque / revente</span><strong id="frCarsRisk">-</strong></div>
          </div>
          <label class="fr-cars-field">Resume acheteur
            <textarea id="frCarsSummary" readonly>Remplissez le formulaire pour generer un resume.</textarea>
          </label>
        </aside>
      </section>
      <div class="fr-cars-grid">
        <article class="fr-cars-card">
          <h2>Methode</h2>
          <p>Nous calculons un cout rendu indicatif avec prix source, fret, assurance, frais portuaires, droit/taxe estime et frais locaux. La fourchette locale applique une prime de marche pour comparer import et achat sur place.</p>
        </article>
        <article class="fr-cars-card">
          <h2>Limites</h2>
          <p>Avertissement : ce n'est pas un devis officiel, une valuation douaniere, un conseil financier ou une garantie de disponibilite. Confirmez les droits, l'etat du vehicule, les restrictions d'age et les frais avec l'autorite ou un agent agree.</p>
        </article>
        <article class="fr-cars-card">
          <h2>Sources et fraicheur</h2>
          <ul class="fr-cars-source-list">
            <li><a href="https://customs.gov.ng/?page_id=3161" rel="nofollow noopener" target="_blank">Nigeria Customs Service</a> - reference officielle, verification repo 2026-04-10.</li>
            <li><a href="https://www.kra.go.ke/individual/importing/learn-about-importation/procedures-for-motor-vehicle" rel="nofollow noopener" target="_blank">Kenya Revenue Authority</a> - procedure officielle, verification repo 2026-04-10.</li>
            <li><a href="https://gra.gov.gh/customs/vehicle-importation/" rel="nofollow noopener" target="_blank">Ghana Revenue Authority</a> - guide officiel, verification repo 2026-04-10.</li>
          </ul>
        </article>
      </div>
      <div class="fr-cars-grid">${countryCards}</div>
      <div class="fr-cars-grid">
        <article class="fr-cars-card">
          <h2>Pages modèle lancées</h2>
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

  return writePage(route, layout({ title, description, canonical: absUrl(route), enUrl: absUrl("cars"), schema, body }));
}

function renderCountryPage(country) {
  const route = `fr/cars/${country.frSlug}`;
  const enRoute = `cars/${country.enSlug}`;
  rememberReciprocal(enRoute, route);
  const sourceCountry = priceData.countries[country.code];
  const profile = priceData.countryMarketProfiles[country.code] || {};
  const place = countryPlace(country);
  const title = `Prix des voitures ${place} | Import ou achat local | AfroTools`;
  const description = `Comparez les fourchettes de prix voiture ${place}, les estimations d'import, les prix locaux en ${sourceCountry.currency_code} et les modèles prioritaires.`;
  const rows = TOP_MODELS.map((spec) => {
    const ctx = contextFor(country.code, spec);
    const modelRoute = MODEL_PAGES.some((page) => page.countryCode === country.code && page.make === spec.make && page.model === spec.model && page.year === spec.year)
      ? `/fr/cars/${country.frSlug}/${spec.make}/${spec.model}/${spec.year}/`
      : `/cars/${country.enSlug}/${spec.make}/${spec.model}/${spec.year}/`;
    const suffix = modelRoute.startsWith("/fr/") ? "" : " <small>(anglais)</small>";
    return `<tr>
      <td><a href="${modelRoute}">${escapeHtml(ctx.vehicle.year)} ${escapeHtml(ctx.vehicle.make)} ${escapeHtml(ctx.vehicle.model)}</a>${suffix}</td>
      <td>${money(ctx.landed.normal * ctx.usdToLocal, ctx.localCurrency)}</td>
      <td>${money(ctx.localPrice.median * ctx.usdToLocal, ctx.localCurrency)}</td>
      <td>${escapeHtml(frenchRecommendation(ctx.recommendation.status))}</td>
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
    <section class="fr-cars-hero">
      <div class="fr-cars-shell">
        <span class="fr-kicker">Marché automobile</span>
        <h1>Prix de voitures ${escapeHtml(place)}</h1>
        <p>${escapeHtml(frenchCountryIntro(country, sourceCountry))}</p>
        <div class="fr-cars-actions">
          <a class="fr-cars-button" href="/fr/cars/">Retour aux voitures</a>
          <a class="fr-cars-button secondary" href="/cars/${country.enSlug}/">Annuaire complet en anglais</a>
        </div>
      </div>
    </section>
    <section class="fr-cars-shell fr-cars-band">
      <p class="fr-cars-note">Source de vérité : <code>data/cars/price-intelligence.json</code>. Mode actuel : ${escapeHtml(frenchPricingMode(sourceCountry.pricingMode))}. Confiance du profil local : ${escapeHtml(profile.confidence === "medium" ? "moyenne" : "faible")}.</p>
      <table class="fr-cars-table">
        <thead><tr><th>Modèle</th><th>Coût rendu estimé</th><th>Prix local indicatif</th><th>Lecture AfroTools</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="fr-cars-grid">
        <article class="fr-cars-card">
          <h2>Points à vérifier</h2>
          <p>${escapeHtml(frenchHiddenCosts())}</p>
        </article>
        <article class="fr-cars-card">
          <h2>Prochaine étape</h2>
          <p>${escapeHtml(frenchRiskCopy(sourceCountry))}</p>
          <a href="/fr/tools/droits-douane/">Voir les droits de douane</a>
        </article>
      </div>
    </section>
  </main>`;

  return writePage(route, layout({ title, description, canonical: absUrl(route), enUrl: absUrl(enRoute), schema, body }));
}

function hasFrenchModelIndex(page) {
  return MODEL_INDEX_PAGES.some((item) => item.countryCode === page.countryCode && item.make === page.make && item.model === page.model);
}

function renderMakePage(page) {
  const country = countryByCode(page.countryCode);
  const route = `fr/cars/${country.frSlug}/${page.make}`;
  const enRoute = `cars/${country.enSlug}/${page.make}`;
  rememberReciprocal(enRoute, route);
  const sourceCountry = priceData.countries[country.code];
  const place = countryPlace(country);
  const makeLabel = page.make.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
  const entries = MODEL_PAGES.filter((item) => item.countryCode === page.countryCode && item.make === page.make);
  const title = `${makeLabel} ${place} | Prix rendus et modèles | AfroTools`;
  const description = `Repères français pour comparer les modèles ${makeLabel} ${place}: prix rendu, prix local indicatif, risque import et pages modèle disponibles.`;
  const rows = entries.map((item) => {
    const ctx = contextFor(item.countryCode, item);
    const modelRoute = hasFrenchModelIndex(item)
      ? `/fr/cars/${country.frSlug}/${ctx.vehicle.makeSlug}/${ctx.vehicle.modelSlug}/`
      : `/fr/cars/${country.frSlug}/${ctx.vehicle.makeSlug}/${ctx.vehicle.modelSlug}/${ctx.vehicle.year}/`;
    return `<tr>
      <td><a href="${modelRoute}">${escapeHtml(ctx.vehicle.model)}</a></td>
      <td>${escapeHtml(ctx.vehicle.year)}</td>
      <td>${money(ctx.landed.normal * ctx.usdToLocal, ctx.localCurrency)}</td>
      <td>${money(ctx.localPrice.median * ctx.usdToLocal, ctx.localCurrency)}</td>
      <td>${escapeHtml(frenchRecommendation(ctx.recommendation.status))}</td>
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
        <p>Comparez les modèles ${escapeHtml(makeLabel)} déjà couverts par le lancement français, avec une lecture prudente du coût rendu et du prix local indicatif en ${escapeHtml(sourceCountry.currency_code)}.</p>
        <div class="fr-cars-actions">
          <a class="fr-cars-button" href="/fr/cars/${country.frSlug}/">Voir ${escapeHtml(country.frName)}</a>
          <a class="fr-cars-button secondary" href="/cars/${country.enSlug}/${page.make}/">Marque complète en anglais</a>
        </div>
      </div>
    </section>
    <section class="fr-cars-shell fr-cars-band">
      <p class="fr-cars-note">Ces pages restent des repères de budget. Elles n'annoncent pas un tarif officiel et ne remplacent pas un devis de transitaire, de vendeur ou de douane.</p>
      <table class="fr-cars-table">
        <thead><tr><th>Modèle</th><th>Année repère</th><th>Coût rendu estimé</th><th>Prix local indicatif</th><th>Lecture</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
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
  const sourceCountry = priceData.countries[country.code];
  const place = countryPlace(country);
  const vehicleLabel = `${ctx.vehicle.make} ${ctx.vehicle.model}`;
  const entries = MODEL_PAGES.filter((item) => item.countryCode === page.countryCode && item.make === page.make && item.model === page.model);
  const title = `${vehicleLabel} ${place} | Années, prix et import | AfroTools`;
  const description = `Vue française pour ${vehicleLabel} ${place}: années disponibles, coût rendu estimé, prix local indicatif et liens vers les pages détaillées.`;
  const rows = entries.map((item) => {
    const yearCtx = contextFor(item.countryCode, item);
    return `<tr>
      <td><a href="/fr/cars/${country.frSlug}/${yearCtx.vehicle.makeSlug}/${yearCtx.vehicle.modelSlug}/${yearCtx.vehicle.year}/">${escapeHtml(yearCtx.vehicle.year)}</a></td>
      <td>${money(yearCtx.landed.normal * yearCtx.usdToLocal, yearCtx.localCurrency)}</td>
      <td>${money(yearCtx.localPrice.median * yearCtx.usdToLocal, yearCtx.localCurrency)}</td>
      <td>${escapeHtml(frenchRisk(yearCtx.importRisk.label))}</td>
      <td>${escapeHtml(frenchLiquidity(yearCtx.liquidity.label))}</td>
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
        <p>Choisissez une année disponible pour comparer le coût rendu estimé, le prix local indicatif en ${escapeHtml(sourceCountry.currency_code)} et les signaux de risque avant de parler à un vendeur ou à un transitaire.</p>
        <div class="fr-cars-actions">
          <a class="fr-cars-button" href="/fr/cars/${country.frSlug}/${ctx.vehicle.makeSlug}/">Voir ${escapeHtml(ctx.vehicle.make)}</a>
          <a class="fr-cars-button secondary" href="/cars/${country.enSlug}/${ctx.vehicle.makeSlug}/${ctx.vehicle.modelSlug}/">Modèle complet en anglais</a>
        </div>
      </div>
    </section>
    <section class="fr-cars-shell fr-cars-band">
      <p class="fr-cars-note">Ce récapitulatif regroupe uniquement les années déjà présentes dans la vague française. Les autres années restent dans l'annuaire anglais jusqu'à une génération plus large.</p>
      <table class="fr-cars-table">
        <thead><tr><th>Année</th><th>Coût rendu estimé</th><th>Prix local indicatif</th><th>Risque</th><th>Liquidité</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </section>
  </main>`;

  return writePage(route, layout({ title, description, canonical: absUrl(route), enUrl: absUrl(enRoute), schema, body }));
}

function renderModelPage(page) {
  const country = countryByCode(page.countryCode);
  const ctx = contextFor(page.countryCode, page);
  const route = `fr/cars/${country.frSlug}/${ctx.vehicle.makeSlug}/${ctx.vehicle.modelSlug}/${ctx.vehicle.year}`;
  const enRoute = `cars/${country.enSlug}/${ctx.vehicle.makeSlug}/${ctx.vehicle.modelSlug}/${ctx.vehicle.year}`;
  rememberReciprocal(enRoute, route);
  const place = countryPlace(country);
  const vehicleName = `${ctx.vehicle.year} ${ctx.vehicle.make} ${ctx.vehicle.model}`;
  const title = `${vehicleName} ${place} | Prix rendu et local | AfroTools`;
  const description = `Estimation française pour ${vehicleName} ${place}: prix source, coût rendu, prix local indicatif, risque d'import et lecture achat local.`;
  const priceRows = [
    ["Prix source", ctx.sourcePrice.median, "Avant fret, assurance et frais du pays de destination."],
    ["Coût rendu estimé", ctx.landed.normal, "Scénario normal AfroTools, avec devise locale affichée."],
    ["Prix local indicatif", ctx.localPrice.median, "Fourchette de demande locale ou modèle de marché disponible."]
  ].map(([label, value, note]) => `<tr><td>${label}</td><td>${money(value * ctx.usdToLocal, ctx.localCurrency)}</td><td>${money(value, "USD")}</td><td>${note}</td></tr>`).join("\n");

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
        <span class="fr-kicker">Modèle prioritaire</span>
        <h1>${escapeHtml(vehicleName)} ${escapeHtml(place)}</h1>
        <p>${escapeHtml(frenchRecommendationExplanation(ctx))}</p>
        <div class="fr-cars-actions">
          <a class="fr-cars-button" href="/fr/cars/${country.frSlug}/">Voir ${escapeHtml(country.frName)}</a>
          <a class="fr-cars-button secondary" href="/cars/${country.enSlug}/${ctx.vehicle.makeSlug}/${ctx.vehicle.modelSlug}/${ctx.vehicle.year}/">Ouvrir l'app complète en anglais</a>
        </div>
      </div>
    </section>
    <section class="fr-cars-shell fr-cars-band">
      <p class="fr-cars-note">Lecture rapide : ${escapeHtml(frenchRecommendation(ctx.recommendation.status))}. Risque import : ${escapeHtml(frenchRisk(ctx.importRisk.label))}. Liquidité : ${escapeHtml(frenchLiquidity(ctx.liquidity.label))}.</p>
      <table class="fr-cars-table">
        <thead><tr><th>Couche de prix</th><th>Devise locale</th><th>Référence USD</th><th>Note</th></tr></thead>
        <tbody>${priceRows}</tbody>
      </table>
      <div class="fr-cars-grid">
        <article class="fr-cars-card">
          <h2>Profil véhicule</h2>
          <p>${escapeHtml(frenchVehicleProfile(ctx.vehicle))}</p>
        </article>
        <article class="fr-cars-card">
          <h2>À ne pas oublier</h2>
          <p>Cette page ne remplace pas une évaluation douanière. Gardez une marge pour le change, les documents, le stockage, le transport intérieur et la différence entre version affichée et version réellement achetée.</p>
        </article>
      </div>
    </section>
  </main>`;

  return writePage(route, layout({ title, description, canonical: absUrl(route), enUrl: absUrl(enRoute), schema, body }));
}

const written = [renderHub()];
COUNTRIES.forEach((country) => written.push(renderCountryPage(country)));
MAKE_PAGES.forEach((page) => written.push(renderMakePage(page)));
MODEL_INDEX_PAGES.forEach((page) => written.push(renderModelIndexPage(page)));
MODEL_PAGES.forEach((page) => written.push(renderModelPage(page)));
reciprocalPairs.forEach(injectEnglishHreflang);

console.log(`Generated ${written.length} French cars launch pages`);
console.log(`Updated ${reciprocalPairs.length} English cars hreflang counterparts`);
written.forEach((filePath) => console.log(path.relative(root, filePath)));
