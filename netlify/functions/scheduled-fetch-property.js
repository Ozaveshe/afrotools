/**
 * AfroTools — Scheduled Property/Rent Price Fetcher
 * Runs weekly (Wednesday 3am) via Netlify Scheduled Functions.
 *
 * Sources: undated AfroTools planning references, with separately qualified FX.
 *
 * Output: { timestamp, countries: [{ code, name, cities: [{ city, rent_1br_usd, rent_3br_usd, buy_sqm_usd }] }] }
 * Writes to Netlify Blobs 'live-data' → key 'property-prices-latest'.
 */

const { runScraper } = require('./_shared/scraper-base');
const feeds = require('./_shared/reference-feeds');
const { conversionReceipt } = require('./_shared/reference-fx');
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

// Reference rent data (USD/month) — undated planning references; source review remains open
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

// No Numbeo request: its former response was unused and key presence cannot
// establish that these reference amounts came from that provider.
async function fetchReferenceProperty() {
  const forex = await getData('forex-latest'), now = new Date().toISOString();
  return Object.keys(CITIES).map(code => {
    const config = CITIES[code], references = REFERENCE_RENTS[code] || {};
    return {code,name:config.name,currency:config.currency,source:'reference',...feeds.referenceFields(),
      last_updated:null,collected_at:now,conversion:conversionReceipt(forex,config.currency,feeds.options(now)),
      cities:config.cities.map(city => {
        const values = references[city] || {};
        return {city,...feeds.referenceFields(),rent_period:'monthly',purchase_unit:'square_metre',
          ...Object.fromEntries(feeds.PROPERTY_FIELDS.map(field => [field+'_usd',values[field] ?? null])),
          rent_1br_center_local:feeds.localAmount(values.rent_1br_center,config.currency,forex,now),
          rent_3br_center_local:feeds.localAmount(values.rent_3br_center,config.currency,forex,now)};
      })};
  });
}
exports.handler = async function() {
  return runScraper({
    id: 'property-prices',
    blobKey: feeds.KEYS.property,
    metaKey: 'property',
    sourceType: 'reference',
    sources: [{name:'ReferenceProperty',fn:fetchReferenceProperty}],
    transform: countries => feeds.buildSnapshot('property',countries,new Date().toISOString()),
    validateOpts: {maxChangeRatio:3.0}
  });
};
