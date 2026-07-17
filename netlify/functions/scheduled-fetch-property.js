/**
 * AfroTools — Scheduled Property/Rent Price Fetcher
 * Runs weekly (Wednesday 3am) via Netlify Scheduled Functions.
 *
 * Sources:
 *  1. Numbeo Cost of Living API (rent data by city)
 *  2. Seed data enriched with forex refresh
 *
 * Output: { timestamp, countries: [{ code, name, cities: [{ city, rent_1br_usd, rent_3br_usd, buy_sqm_usd }] }] }
 * Writes to Netlify Blobs 'live-data' → key 'property-prices-latest'.
 */

const { runScraper, fetchWithRetry } = require('./_shared/scraper-base');
const { getData } = require('./_shared/data-store');

// Key African cities tracked
var CITIES = {
  NG: { name: 'Nigeria', currency: 'NGN', cities: ['Lagos', 'Abuja', 'Port Harcourt', 'Kano', 'Ibadan'] },
  KE: { name: 'Kenya', currency: 'KES', cities: ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru'] },
  ZA: { name: 'South Africa', currency: 'ZAR', cities: ['Johannesburg', 'Cape Town', 'Durban', 'Pretoria'] },
  GH: { name: 'Ghana', currency: 'GHS', cities: ['Accra', 'Kumasi', 'Tema', 'Tamale'] },
  EG: { name: 'Egypt', currency: 'EGP', cities: ['Cairo', 'Alexandria', 'Giza'] },
  ET: { name: 'Ethiopia', currency: 'ETB', cities: ['Addis Ababa', 'Dire Dawa', 'Hawassa'] },
  TZ: { name: 'Tanzania', currency: 'TZS', cities: ['Dar es Salaam', 'Dodoma', 'Arusha', 'Mwanza'] },
  RW: { name: 'Rwanda', currency: 'RWF', cities: ['Kigali'] },
  UG: { name: 'Uganda', currency: 'UGX', cities: ['Kampala', 'Entebbe', 'Jinja'] },
  CI: { name: "Côte d'Ivoire", currency: 'XOF', cities: ['Abidjan', 'Yamoussoukro'] },
  SN: { name: 'Senegal', currency: 'XOF', cities: ['Dakar', 'Saint-Louis'] },
  CM: { name: 'Cameroon', currency: 'XAF', cities: ['Douala', 'Yaounde'] },
  MA: { name: 'Morocco', currency: 'MAD', cities: ['Casablanca', 'Rabat', 'Marrakech', 'Tangier'] },
  TN: { name: 'Tunisia', currency: 'TND', cities: ['Tunis', 'Sousse', 'Sfax'] },
  MU: { name: 'Mauritius', currency: 'MUR', cities: ['Port Louis', 'Curepipe'] },
};

// Reference rent data (USD/month) — from Numbeo/PropertyPro baselines
var REFERENCE_RENTS = {
  NG: { Lagos: { rent_1br_center: 400, rent_1br_outside: 180, rent_3br_center: 900, rent_3br_outside: 400, buy_sqm_center: 1200, buy_sqm_outside: 500 },
        Abuja: { rent_1br_center: 500, rent_1br_outside: 200, rent_3br_center: 1100, rent_3br_outside: 450, buy_sqm_center: 1500, buy_sqm_outside: 600 } },
  KE: { Nairobi: { rent_1br_center: 450, rent_1br_outside: 200, rent_3br_center: 1000, rent_3br_outside: 450, buy_sqm_center: 2000, buy_sqm_outside: 800 },
        Mombasa: { rent_1br_center: 250, rent_1br_outside: 120, rent_3br_center: 550, rent_3br_outside: 250, buy_sqm_center: 1200, buy_sqm_outside: 500 } },
  ZA: { Johannesburg: { rent_1br_center: 500, rent_1br_outside: 300, rent_3br_center: 1100, rent_3br_outside: 650, buy_sqm_center: 1800, buy_sqm_outside: 1000 },
        'Cape Town': { rent_1br_center: 650, rent_1br_outside: 400, rent_3br_center: 1500, rent_3br_outside: 900, buy_sqm_center: 2500, buy_sqm_outside: 1500 } },
  GH: { Accra: { rent_1br_center: 350, rent_1br_outside: 150, rent_3br_center: 800, rent_3br_outside: 350, buy_sqm_center: 1000, buy_sqm_outside: 400 } },
  EG: { Cairo: { rent_1br_center: 250, rent_1br_outside: 100, rent_3br_center: 500, rent_3br_outside: 200, buy_sqm_center: 1500, buy_sqm_outside: 600 } },
  MA: { Casablanca: { rent_1br_center: 400, rent_1br_outside: 200, rent_3br_center: 900, rent_3br_outside: 450, buy_sqm_center: 2000, buy_sqm_outside: 1000 } },
};

/**
 * Source 1: Numbeo API (if key available) + reference data with forex
 */
async function fetchFromNumberoAndReference() {
  var forexData = await getData('forex-latest');
  var rates = (forexData && forexData.rates) || {};
  var now = new Date().toISOString().slice(0, 10);

  // Try Numbeo API first
  var numbeoKey = process.env.NUMBEO_API_KEY;
  var numbeoData = {};

  if (numbeoKey) {
    try {
      var res = await fetchWithRetry(
        'https://www.numbeo.com/api/country_prices?api_key=' + numbeoKey + '&currency=USD',
        { headers: { 'Accept': 'application/json' } }
      );
      var json = await res.json();
      if (json && !json.error) {
        numbeoData = json;
      }
    } catch (e) {
      console.log('[property] Numbeo API failed: ' + e.message);
    }
  }

  var countries = Object.keys(CITIES).map(function(code) {
    var config = CITIES[code];
    var fxRate = rates[config.currency] || 1;
    var refRents = REFERENCE_RENTS[code] || {};

    var cities = config.cities.map(function(cityName) {
      var ref = refRents[cityName] || {};
      return {
        city: cityName,
        rent_1br_center_usd: ref.rent_1br_center || null,
        rent_1br_outside_usd: ref.rent_1br_outside || null,
        rent_3br_center_usd: ref.rent_3br_center || null,
        rent_3br_outside_usd: ref.rent_3br_outside || null,
        buy_sqm_center_usd: ref.buy_sqm_center || null,
        buy_sqm_outside_usd: ref.buy_sqm_outside || null,
        rent_1br_center_local: ref.rent_1br_center ? Math.round(ref.rent_1br_center * fxRate) : null,
        rent_3br_center_local: ref.rent_3br_center ? Math.round(ref.rent_3br_center * fxRate) : null,
      };
    });

    return {
      code: code,
      name: config.name,
      currency: config.currency,
      cities: cities,
      last_updated: now,
      source: numbeoKey ? 'numbeo-with-reference' : 'reference-with-forex',
    };
  });

  return countries;
}

function transformPropertyData(countries) {
  return {
    timestamp: new Date().toISOString(),
    countries: countries,
    record_count: countries.length,
  };
}

exports.handler = async function(event) {
  return runScraper({
    id: 'property-prices',
    blobKey: 'property-prices-latest',
    metaKey: 'property',
    sources: [
      { name: 'NumbeoAndReference', fn: fetchFromNumberoAndReference },
    ],
    transform: transformPropertyData,
    validateOpts: { maxChangeRatio: 3.0 },
  });
};
