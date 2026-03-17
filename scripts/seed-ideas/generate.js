#!/usr/bin/env node
/**
 * AfroIdeas Seed Generator
 * Generates 10,000+ business ideas by combining 210 concept templates with 54 African countries.
 *
 * Usage:
 *   node scripts/seed-ideas/generate.js > supabase/ideas-seed.sql
 *   -- Then paste the SQL into Supabase SQL Editor
 */

const countries = require('./countries');
const concepts = require('./concepts');

// Currency conversion rates from NGN (approximate, for cost scaling)
const NGN_RATES = {
  NGN:1, KES:0.85, ZAR:0.011, GHS:0.0096, ETB:0.078, EGP:0.033,
  TZS:1.7, UGX:2.48, RWF:0.87, XOF:0.41, XAF:0.41, CDF:1.78,
  MZN:0.043, MAD:0.0067, AOA:0.57, MGA:3.02, MWK:1.17, ZMW:0.018,
  ZWL:1.7, GNF:5.81, SLE:0.015, LRD:0.13, MRU:0.027, ERN:0.01,
  GMD:0.047, BWP:0.009, NAD:0.012, LSL:0.012, CVE:0.069,
  MUR:0.031, SZL:0.012, DJF:0.12, KMF:0.31, STN:0.015, SCR:0.009,
  SDG:0.4, SSP:0.89, SOS:0.385, LYD:0.003, TND:0.002, DZD:0.091,
  BIF:1.95, CDF:1.78, USD:0.00067
};

// Currency symbols
const SYMBOLS = {
  NGN:'\u20A6', KES:'KSh', ZAR:'R', GHS:'GH\u20B5', ETB:'Br', EGP:'E\u00A3',
  TZS:'TSh', UGX:'USh', RWF:'RF', XOF:'CFA', XAF:'FCFA', CDF:'FC',
  MZN:'MT', MAD:'MAD', AOA:'Kz', MGA:'Ar', MWK:'MK', ZMW:'ZK',
  ZWL:'Z$', GNF:'FG', SLE:'Le', LRD:'L$', MRU:'UM', ERN:'Nfk',
  GMD:'D', BWP:'P', NAD:'N$', LSL:'M', CVE:'$', MUR:'Rs',
  SZL:'E', DJF:'Fdj', KMF:'CF', STN:'Db', SCR:'SR', SDG:'SDG',
  SSP:'SSP', SOS:'Sh', LYD:'LD', TND:'DT', DZD:'DA', BIF:'FBu',
  USD:'$'
};

function convertCost(ngnAmount, targetCurrency, countryMult) {
  var rate = NGN_RATES[targetCurrency] || 1;
  return Math.round(ngnAmount * countryMult * rate);
}

function escSQL(s) {
  if (!s) return '';
  return s.replace(/'/g, "''").replace(/\\/g, '\\\\');
}

function pgArray(arr) {
  if (!arr || arr.length === 0) return "'{}'";
  return "'{" + arr.map(function(s) { return '"' + escSQL(s) + '"'; }).join(',') + "}'";
}

// Determine which countries a concept applies to (most apply to all, some region-specific)
function getApplicableCountries(concept) {
  // All concepts work in all countries for maximum coverage
  return countries;
}

// Generate cost breakdown for a concept in a specific country
function generateBreakdown(concept, country) {
  var slug = concept[0];
  var currency = country.currency;
  var sym = SYMBOLS[currency] || currency;
  var mult = country.costMult;
  var rate = NGN_RATES[currency] || 1;

  // Generic breakdowns based on cost tier
  var tier = concept[3];
  var costMin = concept[5];

  var items = [];
  if (tier === 'micro') {
    items = [
      {item: 'Equipment & Tools', cost: sym + Math.round(costMin * 0.4 * mult * rate).toLocaleString()},
      {item: 'Initial Stock/Materials', cost: sym + Math.round(costMin * 0.3 * mult * rate).toLocaleString()},
      {item: 'Marketing & Branding', cost: sym + Math.round(costMin * 0.15 * mult * rate).toLocaleString()},
      {item: 'Working Capital', cost: sym + Math.round(costMin * 0.15 * mult * rate).toLocaleString()}
    ];
  } else if (tier === 'small') {
    items = [
      {item: 'Equipment & Setup', cost: sym + Math.round(costMin * 0.35 * mult * rate).toLocaleString()},
      {item: 'Inventory/Materials', cost: sym + Math.round(costMin * 0.25 * mult * rate).toLocaleString()},
      {item: 'Rent & Utilities (3 months)', cost: sym + Math.round(costMin * 0.15 * mult * rate).toLocaleString()},
      {item: 'Staff (3 months)', cost: sym + Math.round(costMin * 0.1 * mult * rate).toLocaleString()},
      {item: 'Marketing & Registration', cost: sym + Math.round(costMin * 0.1 * mult * rate).toLocaleString()},
      {item: 'Working Capital', cost: sym + Math.round(costMin * 0.05 * mult * rate).toLocaleString()}
    ];
  } else if (tier === 'medium') {
    items = [
      {item: 'Major Equipment/Assets', cost: sym + Math.round(costMin * 0.4 * mult * rate).toLocaleString()},
      {item: 'Premises Setup', cost: sym + Math.round(costMin * 0.15 * mult * rate).toLocaleString()},
      {item: 'Inventory/Raw Materials', cost: sym + Math.round(costMin * 0.15 * mult * rate).toLocaleString()},
      {item: 'Staff (3 months)', cost: sym + Math.round(costMin * 0.1 * mult * rate).toLocaleString()},
      {item: 'Licenses & Registration', cost: sym + Math.round(costMin * 0.05 * mult * rate).toLocaleString()},
      {item: 'Marketing Launch', cost: sym + Math.round(costMin * 0.08 * mult * rate).toLocaleString()},
      {item: 'Working Capital', cost: sym + Math.round(costMin * 0.07 * mult * rate).toLocaleString()}
    ];
  } else {
    items = [
      {item: 'Land/Property', cost: sym + Math.round(costMin * 0.3 * mult * rate).toLocaleString()},
      {item: 'Construction/Renovation', cost: sym + Math.round(costMin * 0.2 * mult * rate).toLocaleString()},
      {item: 'Major Equipment', cost: sym + Math.round(costMin * 0.2 * mult * rate).toLocaleString()},
      {item: 'Staff Recruitment & Training', cost: sym + Math.round(costMin * 0.08 * mult * rate).toLocaleString()},
      {item: 'Licenses & Compliance', cost: sym + Math.round(costMin * 0.05 * mult * rate).toLocaleString()},
      {item: 'Marketing & Launch', cost: sym + Math.round(costMin * 0.07 * mult * rate).toLocaleString()},
      {item: 'Working Capital (6 months)', cost: sym + Math.round(costMin * 0.1 * mult * rate).toLocaleString()}
    ];
  }
  return JSON.stringify(items);
}

// Generate regulations based on country and sector
function generateRegulations(concept, country) {
  var sector = concept[2];
  var cc = country.code;
  var regs = [];

  // Universal
  regs.push('Business registration required with ' + country.name + ' corporate affairs');
  regs.push('Tax identification number (TIN) mandatory');

  // Sector-specific
  if (sector === 'food') {
    regs.push('Food safety and hygiene certification required');
    regs.push('Health inspection from local authority');
    if (cc === 'NG') regs.push('NAFDAC registration for packaged food products');
    if (cc === 'KE') regs.push('KEBS certification for food products');
    if (cc === 'ZA') regs.push('Department of Health compliance certificate');
  } else if (sector === 'health') {
    regs.push('Healthcare facility license required');
    regs.push('Professional practitioners must be registered');
    if (cc === 'NG') regs.push('Pharmacy Council of Nigeria license for pharmacies');
    if (cc === 'KE') regs.push('Kenya Medical Practitioners Board registration');
  } else if (sector === 'fintech') {
    regs.push('Central bank license or approval may be required');
    regs.push('AML/KYC compliance mandatory');
    regs.push('Data protection regulations apply');
  } else if (sector === 'energy') {
    regs.push('Energy regulatory authority license may be required');
    regs.push('Environmental impact assessment for larger installations');
  } else if (sector === 'construction') {
    regs.push('Building permits required from local authority');
    regs.push('Environmental compliance for excavation/quarrying');
  } else if (sector === 'education') {
    regs.push('Education ministry registration for formal institutions');
    regs.push('Curriculum approval may be required');
  } else if (sector === 'mining') {
    regs.push('Mining license from minerals authority required');
    regs.push('Environmental impact assessment mandatory');
    regs.push('Community development agreement often required');
  } else if (sector === 'telecom') {
    regs.push('Telecommunications regulatory license required');
    regs.push('Spectrum allocation for wireless services');
  }

  return regs;
}

// Main generation
function generate() {
  var count = 0;

  console.log('-- ================================================================');
  console.log('-- AfroIdeas Seed Data — Generated ' + new Date().toISOString().slice(0,10));
  console.log('-- ' + concepts.length + ' concepts x ' + countries.length + ' countries');
  console.log('-- ================================================================');
  console.log('');
  console.log('BEGIN;');
  console.log('');
  console.log('-- Clear existing seeded ideas');
  console.log("DELETE FROM business_ideas WHERE source = 'seed';");
  console.log('');

  // Process in batches for SQL performance
  var batchSize = 100;
  var values = [];

  for (var c = 0; c < concepts.length; c++) {
    var concept = concepts[c];
    var applicable = getApplicableCountries(concept);

    for (var k = 0; k < applicable.length; k++) {
      var country = applicable[k];

      var slug = concept[0] + '-' + country.code.toLowerCase();
      var name = concept[1];
      var sector = concept[2];
      var costTier = concept[3];
      var risk = concept[4];
      var costMin = convertCost(concept[5], country.currency, country.costMult);
      var costMax = convertCost(concept[6], country.currency, country.costMult);
      var revMin = convertCost(concept[7], country.currency, country.revMult);
      var revMax = convertCost(concept[8], country.currency, country.revMult);
      var beMin = concept[9];
      var beMax = concept[10];
      var desc = concept[11];
      var whyAfrica = concept[12];
      var revModel = concept[13];
      var risksStr = concept[14] ? concept[14].split('|') : [];
      var scalePath = concept[15];
      var tags = concept[16] ? (Array.isArray(concept[16]) ? concept[16] : [concept[16]]) : [];

      // Add country-specific tags
      tags.push(country.code.toLowerCase());
      tags.push(country.region);

      var regs = generateRegulations(concept, country);
      var cities = country.cities.slice(0, 5); // Top 5 cities
      var breakdown = generateBreakdown(concept, country);

      // Rough monthly costs estimate (40-60% of revenue)
      var monthlyCostsMin = Math.round(revMin * 0.45);
      var monthlyCostsMax = Math.round(revMax * 0.55);

      var row = "(gen_random_uuid(),'" + escSQL(slug) + "','" + escSQL(name) + "','" + escSQL(sector) + "','" +
        escSQL(country.code) + "','" + escSQL(country.name) + "','" + costTier + "','" + risk + "','" +
        escSQL(desc) + "','" + escSQL(whyAfrica) + "','" + escSQL(revModel) + "'," +
        pgArray(risksStr) + ",'" + escSQL(scalePath) + "'," +
        costMin + "," + costMax + ",'" + country.currency + "'," +
        revMin + "," + revMax + "," + monthlyCostsMin + "," + monthlyCostsMax + "," +
        beMin + "," + beMax + "," +
        pgArray(regs) + "," + pgArray(cities) + ",'" + escSQL(breakdown) + "'::jsonb," +
        pgArray(tags) + ",'seed',0,0,0,NOW(),NOW())";

      values.push(row);
      count++;

      if (values.length >= batchSize) {
        flushBatch(values);
        values = [];
      }
    }
  }

  // Flush remaining
  if (values.length > 0) {
    flushBatch(values);
  }

  console.log('');
  console.log('COMMIT;');
  console.log('');
  console.log('-- Total ideas generated: ' + count);
  console.log('-- Run: SELECT COUNT(*) FROM business_ideas; to verify');

  // Also print to stderr so user sees count
  process.stderr.write('Generated ' + count + ' ideas (' + concepts.length + ' concepts x ' + countries.length + ' countries)\n');
}

function flushBatch(values) {
  console.log('INSERT INTO business_ideas (id,slug,name,sector,country_code,country_name,cost_tier,risk,description,why_africa,revenue_model,risks,scale_path,startup_cost_min,startup_cost_max,currency,monthly_revenue_min,monthly_revenue_max,monthly_costs_min,monthly_costs_max,breakeven_months_min,breakeven_months_max,regulations,best_cities,breakdown,tags,source,vote_count,save_count,view_count,created_at,updated_at) VALUES');
  console.log(values.join(',\n') + ';');
  console.log('');
}

generate();
