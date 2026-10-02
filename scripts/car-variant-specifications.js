#!/usr/bin/env node
// Operator diagnostics only: manufacturer facts cannot approve a seller or price.
const fs = require('node:fs');
const path = require('node:path');
const { catalog } = require('./car-market-research');
const defaultRegistry = path.join(__dirname, '../data/cars/variant-specifications.json');
const normalize = value => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const read = file => JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));

function validateRegistry(input, vehicles = catalog(), now = new Date()) {
  if (!input || input.schema_version !== 1 || !input.sources || !Array.isArray(input.variants)) throw new Error('Expected variant specification schema1');
  if (!input.variants.length) throw new Error('No variant specifications');
  const ids = new Set(), aliases = new Set();
  for (const [id, source] of Object.entries(input.sources)) {
    if (!id || !source || !source.author || !source.title || !/^[A-Z]{2}$/.test(source.market_spec_country || '')) throw new Error('Missing source author, title or specification market');
    const url = new URL(source.url);
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) throw new Error('Unsafe manufacturer source URL');
    const checked = Date.parse(source.checked_at);
    if (!Number.isFinite(checked) || checked > now.getTime() + 300000) throw new Error('Invalid source check timestamp');
    if (!['manufacturer_press_release', 'manufacturer_brochure_mirror', 'manufacturer_reference_guide'].includes(source.format)) throw new Error('Unknown primary source format');
    if (source.publication_date != null) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(source.publication_date) || !Number.isFinite(Date.parse(source.publication_date)) || new Date(source.publication_date).toISOString().slice(0, 10) !== source.publication_date || Date.parse(source.publication_date) > checked) throw new Error('Invalid publication date');
    } else if (!Number.isInteger(source.publication_year) || source.publication_year < 1990 || source.publication_year > new Date(checked).getUTCFullYear()) throw new Error('Missing dated manufacturer source');
    if (source.format === 'manufacturer_brochure_mirror' && !source.document_code) throw new Error('Mirrored brochure needs OEM document identity');
  }
  for (const item of input.variants) {
    const vehicle = vehicles.get(item.vehicle_id);
    if (!vehicle || Number(vehicle.year) !== item.model_year) throw new Error('Wrong catalog model year');
    if (typeof item.variant_id !== 'string' || !item.variant_id || ids.has(item.variant_id)) throw new Error('Duplicate or missing variant ID');
    ids.add(item.variant_id);
    if (!input.sources[item.source_id]) throw new Error('Missing manufacturer source');
    if (!item.variant_label || !Array.isArray(item.aliases) || !item.aliases.length) throw new Error('Missing explicit variant labels');
    if (!Number.isFinite(item.engine_litres) || item.engine_litres < 0.5 || item.engine_litres > 10 || !Number.isInteger(item.cylinders) || item.cylinders < 1 || item.cylinders > 16) throw new Error('Invalid nominal engine facts');
    if (item.engine_cc_exact != null && (!Number.isSafeInteger(item.engine_cc_exact) || Math.round(item.engine_cc_exact / 100) / 10 !== item.engine_litres)) throw new Error('Exact displacement conflicts with nominal label');
    if (!['petrol', 'diesel', 'hybrid'].includes(item.fuel) || !item.transmission || ![null, 'RWD', 'FWD', 'AWD'].includes(item.drivetrain)) throw new Error('Unsupported or missing specification facts');
    for (const alias of item.aliases) {
      if (typeof alias !== 'string' || !normalize(alias)) throw new Error('Invalid variant alias');
      const key = item.vehicle_id + ':' + normalize(alias);
      if (aliases.has(key)) throw new Error('Ambiguous variant alias');
      aliases.add(key);
    }
    for (const key of Object.keys(item)) if (/price|asking|currency|image|contact|vin$/i.test(key)) throw new Error('Price, image or private facts do not belong in manufacturer specifications');
  }
  return input;
}

function inspectVariant(facts, input) {
  const item = input.variants.find(row => row.vehicle_id === facts.vehicle_id && row.aliases.some(alias => normalize(alias) === normalize(facts.trim_label)));
  if (!item) return { status: 'unresolved-variant', variant_id: null, issues: ['No explicit reviewed variant match'], stock_verified: false, publishable: false };
  const issues = [], missing = [];
  if (facts.model_year != null && facts.model_year !== item.model_year) issues.push('Claimed year differs from manufacturer variant');
  const engine = facts.engine_cc;
  if (engine == null) missing.push('engine_cc');
  else if (!Number.isSafeInteger(engine) || engine < 500 || engine > 10000) issues.push('Invalid claimed engine displacement');
  else if (item.engine_cc_exact != null ? ![item.engine_cc_exact, Math.round(item.engine_litres * 1000)].includes(engine) : Math.round(engine / 100) / 10 !== item.engine_litres) issues.push('Claimed engine differs from manufacturer variant');
  if (facts.cylinders == null) missing.push('cylinders');
  else if (facts.cylinders !== item.cylinders) issues.push('Claimed cylinders differ from manufacturer variant');
  if (facts.drivetrain != null && item.drivetrain != null && String(facts.drivetrain).toUpperCase() !== item.drivetrain) issues.push('Claimed drivetrain differs from manufacturer variant');
  if (facts.drivetrain == null || item.drivetrain == null) missing.push('drivetrain');
  return { status: issues.length ? 'specification-conflict' : missing.length ? 'needs-specification-review' : 'plausible-manufacturer-variant', variant_id: item.variant_id, source_url: input.sources[item.source_id].url, specification_market: input.sources[item.source_id].market_spec_country, issues, missing, stock_verified: false, publishable: false };
}

function auditResearch(payload, registry) {
  if (!payload || !Array.isArray(payload.listings) || !Array.isArray(payload.contexts)) throw new Error('Expected private research and explicit context');
  return payload.listings.map(row => {
    const matches = payload.contexts.filter(context => context.source_listing_id === row.source_listing_id);
    if (matches.length !== 1) throw new Error('Research needs one unambiguous context');
    const context = matches[0];
    const engine = context.engine_display == null ? null : /^\d+cc$/i.test(context.engine_display) ? Number(context.engine_display.slice(0, -2)) : NaN;
    const cylinders = context.cylinders_display == null ? null : /^\d+$/.test(context.cylinders_display) ? Number(context.cylinders_display) : NaN;
    // Read only literal listing tokens; never infer a drivetrain from the OEM match.
    const trim = String(row.trim_label || '');
    const drives = ['AWD', 'RWD', 'FWD'].filter(drive => drive === 'AWD' ? /\b(?:AWD|4MATIC|4X4)\b/i.test(trim) : new RegExp('\\b' + drive + '\\b', 'i').test(trim));
    const drivetrain = context.drivetrain_claim ?? (drives.length === 1 ? drives[0] : drives.length > 1 ? 'contradictory' : null);
    return { source_listing_id: row.source_listing_id, ...inspectVariant({ vehicle_id: row.vehicle_id, model_year: row.model_year, trim_label: row.trim_label, engine_cc: engine, cylinders, drivetrain }, registry) };
  });
}

if (require.main === module) {
  const [command, input] = process.argv.slice(2);
  const registry = validateRegistry(read(defaultRegistry));
  if (command === 'check') console.log(JSON.stringify({ variants: registry.variants.length, identities: new Set(registry.variants.map(row => row.vehicle_id)).size, sources: Object.keys(registry.sources).length, market_prices: 0, stock_verified: false }));
  else if (command === 'research' && input) console.log(JSON.stringify({ diagnostics: auditResearch(read(input), registry), public_prices: 0 }, null, 2));
  else throw new Error('Usage: car-variant-specifications.js check|research PRIVATE-RESEARCH.json');
}
module.exports = { validateRegistry, inspectVariant, auditResearch };
