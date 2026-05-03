const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const pricePath = path.join(root, "data/cars/price-intelligence.json");

const markets = [
  { code: "NG", slug: "nigeria", name: "Nigeria", currency: "NGN", city: "lagos", side: "left-or-right", importEnabled: true, multiplier: 2.05, spread: 0.24, sampleSize: 18, confidence: "medium", sourceType: "marketplace-sample" },
  { code: "KE", slug: "kenya", name: "Kenya", currency: "KES", city: "nairobi", side: "right", importEnabled: true, multiplier: 1.82, spread: 0.18, sampleSize: 22, confidence: "medium", sourceType: "marketplace-sample" },
  { code: "GH", slug: "ghana", name: "Ghana", currency: "GHS", city: "accra", side: "left-or-right", importEnabled: true, multiplier: 1.92, spread: 0.22, sampleSize: 16, confidence: "medium", sourceType: "marketplace-sample" },
  { code: "UG", slug: "uganda", name: "Uganda", currency: "UGX", city: "kampala", side: "right", importEnabled: true, multiplier: 1.78, spread: 0.24, sampleSize: 10, confidence: "low", sourceType: "modelled-market-sample" },
  { code: "ZM", slug: "zambia", name: "Zambia", currency: "ZMW", city: "lusaka", side: "right", importEnabled: true, multiplier: 1.95, spread: 0.22, sampleSize: 8, confidence: "low", sourceType: "modelled-market-sample" },
  { code: "TZ", slug: "tanzania", name: "Tanzania", currency: "TZS", city: "dar-es-salaam", side: "right", importEnabled: true, multiplier: 1.86, spread: 0.23, sampleSize: 14, confidence: "medium", sourceType: "marketplace-sample" },
  { code: "ZA", slug: "south-africa", name: "South Africa", currency: "ZAR", city: "johannesburg", side: "right", multiplier: 1.55, spread: 0.18 },
  { code: "EG", slug: "egypt", name: "Egypt", currency: "EGP", city: "cairo", side: "left", multiplier: 1.72, spread: 0.2 },
  { code: "MA", slug: "morocco", name: "Morocco", currency: "MAD", city: "casablanca", side: "right", multiplier: 1.68, spread: 0.2 },
  { code: "CI", slug: "cote-divoire", name: "Cote d'Ivoire", currency: "XOF", city: "abidjan", side: "right", multiplier: 1.9, spread: 0.23 },
  { code: "SN", slug: "senegal", name: "Senegal", currency: "XOF", city: "dakar", side: "right", multiplier: 1.88, spread: 0.23 },
  { code: "CM", slug: "cameroon", name: "Cameroon", currency: "XAF", city: "douala", side: "right", multiplier: 1.92, spread: 0.24 },
  { code: "ET", slug: "ethiopia", name: "Ethiopia", currency: "ETB", city: "addis-ababa", side: "right", multiplier: 2.08, spread: 0.26 },
  { code: "RW", slug: "rwanda", name: "Rwanda", currency: "RWF", city: "kigali", side: "right", multiplier: 1.82, spread: 0.22 },
  { code: "AO", slug: "angola", name: "Angola", currency: "AOA", city: "luanda", side: "left", multiplier: 2.15, spread: 0.27 },
  { code: "DZ", slug: "algeria", name: "Algeria", currency: "DZD", city: "algiers", side: "right", multiplier: 1.9, spread: 0.24 },
  { code: "TN", slug: "tunisia", name: "Tunisia", currency: "TND", city: "tunis", side: "right", multiplier: 1.7, spread: 0.21 },
  { code: "MZ", slug: "mozambique", name: "Mozambique", currency: "MZN", city: "maputo", side: "left", multiplier: 1.95, spread: 0.24 },
  { code: "BW", slug: "botswana", name: "Botswana", currency: "BWP", city: "gaborone", side: "right", multiplier: 1.72, spread: 0.2 },
  { code: "NA", slug: "namibia", name: "Namibia", currency: "NAD", city: "windhoek", side: "right", multiplier: 1.7, spread: 0.2 }
];

const existingContent = {
  NG: {
    intro: "Nigeria buyers need a practical landed-cost view because Lagos port costs, clearing delays, FX, and age eligibility can change the answer quickly.",
    hiddenCosts: "Storage, terminal handling, broker fees, valuation differences, and registration buffers often matter as much as headline duty.",
    riskCopy: "Vehicles older than the active passenger-vehicle age rule should be treated as ineligible unless a verified exception applies."
  },
  KE: {
    intro: "Kenya pages emphasize Japan-to-Mombasa workflows, RHD eligibility, KEBS inspection, and KRA valuation-pack assumptions.",
    hiddenCosts: "CRSP valuation differences, IDF/RDL/VAT stacking, inspection documents, and Mombasa-to-city transport are the big watch-outs.",
    riskCopy: "A vehicle outside the eight-year or right-hand-drive rules should not be recommended without official clearance."
  },
  GH: {
    intro: "Ghana buyers need to see official taxes separately from third-party port and clearing costs because the market often blends them together.",
    hiddenCosts: "ICUMS valuation, age penalties, local shipping-line fees, safe bond/rent, trade plates, and agent charges can move the final number.",
    riskCopy: "Right-hand-steering restrictions and age penalties should be checked before paying for a car abroad."
  },
  UG: {
    intro: "Uganda estimates lean on valuation-pack logic and corridor costs from the coast into Kampala.",
    hiddenCosts: "The gap between a quick marketplace price and URA valuation can be material, especially when the official valuation pack is incomplete.",
    riskCopy: "When the valuation pack is thin, treat results as planning estimates and keep a larger buffer."
  },
  ZM: {
    intro: "Zambia needs specific-duty and valuation-schedule friendly logic, not only percentage-of-CIF math.",
    hiddenCosts: "ASYCUDA processing, motor vehicle fees, surtax, additional agency fees, and corridor delivery costs can all affect the on-road answer.",
    riskCopy: "Schedule freshness matters. If the rule pack is stale, preview against the latest ZRA schedule before publishing a quote."
  },
  TZ: {
    intro: "Tanzania pages split customs costs from first-registration and licensing costs so buyers can see where the final on-road total comes from.",
    hiddenCosts: "Age-based excise, registration tax, licence fees, Dar port costs, and inland transport are the common surprises.",
    riskCopy: "Used passenger vehicles around the 8-10 and over-10-year age bands should be inspected carefully for excise sensitivity."
  }
};

function contentFor(market) {
  if (existingContent[market.code]) return existingContent[market.code];
  return {
    intro: `${market.name} buyers can now review the same AfroTools vehicle price brackets in ${market.currency}, using live USD exchange rates and a local-market planning band.`,
    hiddenCosts: "FX movement, inspection, shipping documents, inland delivery, storage, registration, and dealer margins can move the final on-road number.",
    riskCopy: "This market is in directory-estimate mode until a full customs rule pack is added, so use the local currency range for planning and verify duties with a licensed clearing agent before paying."
  };
}

function sync() {
  const data = JSON.parse(fs.readFileSync(pricePath, "utf8"));
  data.schemaVersion = "2026-05-03.local-fx.1";
  data.generatedAt = "2026-05-03T00:00:00+05:00";
  data.marketCoverage = {
    countryCount: markets.length,
    countryCodes: markets.map((market) => market.code),
    fxSourceKey: "forex-latest",
    fxEndpoint: "/api/forex?base=USD",
    note: "Cars display the existing USD vehicle brackets in local currency through the shared live forex container. Countries without full rule packs are labelled as directory estimates."
  };

  data.countries = data.countries || {};
  data.countryMarketProfiles = data.countryMarketProfiles || {};
  data.countryContent = data.countryContent || {};

  markets.forEach((market) => {
    data.countries[market.code] = Object.assign({}, data.countries[market.code] || {}, {
      id: market.code.toLowerCase(),
      code: market.code,
      slug: market.slug,
      name: market.name,
      currency_code: market.currency,
      currency_symbol: market.currency,
      import_enabled: Boolean(market.importEnabled),
      directory_enabled: true,
      defaultCity: market.city,
      requiredDriveSide: market.side,
      pricingMode: market.importEnabled ? "full-rule-pack" : "directory-estimate"
    });

    data.countryMarketProfiles[market.code] = Object.assign({}, data.countryMarketProfiles[market.code] || {}, {
      localMultiplier: market.multiplier,
      localSpread: market.spread,
      sampleSize: market.sampleSize || 0,
      confidence: market.confidence || "low",
      sourceType: market.sourceType || "site-bracket-fx-model",
      pricingBasis: market.importEnabled ? "rule-pack-plus-local-market-sample" : "existing-site-bracket-plus-live-fx"
    });

    data.countryContent[market.code] = contentFor(market);
  });

  Object.keys(data.countries).forEach((code) => {
    if (!markets.some((market) => market.code === code)) {
      data.countries[code].directory_enabled = false;
    }
  });

  fs.writeFileSync(pricePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  console.log(`Synced ${markets.length} car directory markets to ${path.relative(root, pricePath)}`);
}

sync();
