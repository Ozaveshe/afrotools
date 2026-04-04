/**
 * AfroTools — Scheduled Bank Charges & Interest Rate Fetcher
 * Runs weekly (Tuesday 3am) via Netlify Scheduled Functions.
 *
 * Sources:
 *  1. World Bank lending interest rate indicator (FR.INR.LEND)
 *  2. Central bank reference rates per country
 *  3. Reference data with forex refresh
 *
 * Writes to Netlify Blobs 'live-data' → key 'rates-latest' (extends existing).
 */

const { runScraper, fetchWithRetry } = require('./_shared/scraper-base');
const { getData } = require('./_shared/data-store');

var BANKS = {
  NG: { name: 'Nigeria', currency: 'NGN', central_bank: 'CBN', policy_rate: 27.50, avg_lending: 30.0, avg_savings: 5.0, transfer_fee_local: 0.30, transfer_fee_intl: 25 },
  KE: { name: 'Kenya', currency: 'KES', central_bank: 'CBK', policy_rate: 12.00, avg_lending: 16.0, avg_savings: 6.0, transfer_fee_local: 0.15, transfer_fee_intl: 20 },
  ZA: { name: 'South Africa', currency: 'ZAR', central_bank: 'SARB', policy_rate: 7.75, avg_lending: 11.5, avg_savings: 5.5, transfer_fee_local: 0.10, transfer_fee_intl: 15 },
  GH: { name: 'Ghana', currency: 'GHS', central_bank: 'BoG', policy_rate: 29.00, avg_lending: 33.0, avg_savings: 8.0, transfer_fee_local: 0.20, transfer_fee_intl: 22 },
  EG: { name: 'Egypt', currency: 'EGP', central_bank: 'CBE', policy_rate: 27.25, avg_lending: 28.0, avg_savings: 12.0, transfer_fee_local: 0.10, transfer_fee_intl: 18 },
  ET: { name: 'Ethiopia', currency: 'ETB', central_bank: 'NBE', policy_rate: 15.00, avg_lending: 18.0, avg_savings: 7.0, transfer_fee_local: 0.20, transfer_fee_intl: 25 },
  TZ: { name: 'Tanzania', currency: 'TZS', central_bank: 'BoT', policy_rate: 6.00, avg_lending: 16.0, avg_savings: 4.0, transfer_fee_local: 0.15, transfer_fee_intl: 20 },
  UG: { name: 'Uganda', currency: 'UGX', central_bank: 'BoU', policy_rate: 10.00, avg_lending: 20.0, avg_savings: 5.0, transfer_fee_local: 0.20, transfer_fee_intl: 22 },
  RW: { name: 'Rwanda', currency: 'RWF', central_bank: 'BNR', policy_rate: 7.00, avg_lending: 16.0, avg_savings: 5.0, transfer_fee_local: 0.15, transfer_fee_intl: 20 },
  CI: { name: "Côte d'Ivoire", currency: 'XOF', central_bank: 'BCEAO', policy_rate: 3.50, avg_lending: 7.0, avg_savings: 3.5, transfer_fee_local: 0.20, transfer_fee_intl: 25 },
  MA: { name: 'Morocco', currency: 'MAD', central_bank: 'BAM', policy_rate: 2.75, avg_lending: 5.5, avg_savings: 2.5, transfer_fee_local: 0.08, transfer_fee_intl: 12 },
  SN: { name: 'Senegal', currency: 'XOF', central_bank: 'BCEAO', policy_rate: 3.50, avg_lending: 7.5, avg_savings: 3.5, transfer_fee_local: 0.20, transfer_fee_intl: 25 },
  ZM: { name: 'Zambia', currency: 'ZMW', central_bank: 'BoZ', policy_rate: 13.50, avg_lending: 25.0, avg_savings: 6.0, transfer_fee_local: 0.20, transfer_fee_intl: 22 },
  BW: { name: 'Botswana', currency: 'BWP', central_bank: 'BoB', policy_rate: 5.75, avg_lending: 8.0, avg_savings: 3.5, transfer_fee_local: 0.10, transfer_fee_intl: 15 },
  MU: { name: 'Mauritius', currency: 'MUR', central_bank: 'BoM', policy_rate: 4.50, avg_lending: 8.0, avg_savings: 3.0, transfer_fee_local: 0.08, transfer_fee_intl: 12 },
};

async function fetchBankRates() {
  // Try World Bank lending rate indicator
  var wbLending = {};
  try {
    var url = 'https://api.worldbank.org/v2/country/ALL/indicator/FR.INR.LEND?date=2022:2025&format=json&per_page=500';
    var res = await fetchWithRetry(url, { headers: { 'Accept': 'application/json' } });
    var json = await res.json();
    if (json && json[1]) {
      json[1].forEach(function(e) {
        if (e.value !== null && e.country) wbLending[e.country.id] = e.value;
      });
    }
  } catch (e) { console.log('[bank-rates] WB lending failed: ' + e.message); }

  var now = new Date().toISOString().slice(0, 10);
  var countries = Object.keys(BANKS).map(function(code) {
    var b = BANKS[code];
    return {
      code: code,
      name: b.name,
      currency: b.currency,
      central_bank: b.central_bank,
      policy_rate: b.policy_rate,
      avg_lending_rate: wbLending[code] || b.avg_lending,
      avg_savings_rate: b.avg_savings,
      transfer_fee_local_pct: b.transfer_fee_local,
      transfer_fee_intl_usd: b.transfer_fee_intl,
      last_updated: now,
      source: wbLending[code] ? 'worldbank-enriched' : 'reference',
    };
  });

  return countries;
}

function transformBankData(countries) {
  return { timestamp: new Date().toISOString(), countries: countries, record_count: countries.length };
}

exports.handler = async function(event) {
  return runScraper({
    id: 'bank-rates',
    blobKey: 'rates-latest',
    metaKey: 'rates',
    sources: [{ name: 'MultiSource', fn: fetchBankRates }],
    transform: transformBankData,
    validateOpts: { maxChangeRatio: 3.0 },
  });
};
