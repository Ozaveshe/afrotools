// Identity-only view shared by private evidence intake and catalog seeding.
const fs = require('node:fs');
const path = require('node:path');
const { parseCsv } = require('./car-catalog-manager');
const identityFields = ['vehicle_id', 'make', 'make_slug', 'model', 'model_slug', 'year', 'body_type', 'catalog_status'];
const additionFields = new Set([...identityFields, 'identity_evidence_url', 'market_listing_url', 'reviewed_at']);
const normalize = value => String(value).toLowerCase().replace(/[^a-z0-9]/g, '');

function safeUrl(value) {
  let url;
  try { url = new URL(value); } catch { return false; }
  return url.protocol === 'https:' && !url.username && !url.password && !url.port && !url.search && !url.hash;
}

function mergeCatalog(pricedRows, additions = []) {
  const rows = new Map();
  const tuples = new Map();
  for (const [batch, identityOnly] of [[pricedRows, false], [additions, true]]) {
    for (const input of batch) {
      const fail = message => { throw Error(`Catalog ${input.vehicle_id || 'missing id'}: ${message}`); };
      if (identityOnly) {
        if (Object.keys(input).some(field => !additionFields.has(field))) fail('identity additions cannot contain price or other fields');
        if (!safeUrl(input.identity_evidence_url) || !safeUrl(input.market_listing_url)) fail('identity and listing evidence URLs required');
        const date = String(input.reviewed_at || '');
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date + 'T00:00:00Z')) || new Date(date + 'T00:00:00Z').toISOString().slice(0, 10) !== date) fail('invalid review date');
      }
      for (const field of identityFields) {
        if (typeof input[field] !== 'string' || !input[field].trim() || input[field].length > 120 || /[<>\r\n]/.test(input[field])) fail(`invalid ${field}`);
      }
      const row = Object.fromEntries(identityFields.map(field => [field, input[field].trim()]));
      for (const field of ['vehicle_id', 'make_slug', 'model_slug']) if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(row[field])) fail(`invalid ${field}`);
      if (!/^\d{4}$/.test(row.year) || Number(row.year) < 1990 || Number(row.year) > 2100 || !row.vehicle_id.endsWith('-' + row.year)) fail('invalid identity year');
      if (!['sedan', 'suv', 'pickup', 'mpv', 'van', 'wagon', 'hatchback', 'coupe', 'convertible'].includes(row.body_type)) fail('invalid body type');
      if (!['active', 'retired'].includes(row.catalog_status)) fail('invalid private catalog status');
      const tuple = `${row.make_slug}/${row.model_slug}/${row.year}`;
      if (tuples.has(tuple) && tuples.get(tuple) !== row.vehicle_id) fail('duplicate make/model/year under another ID');
      tuples.set(tuple, row.vehicle_id);
      const previous = rows.get(row.vehicle_id);
      if (previous) {
        if (['make_slug', 'model_slug', 'year', 'body_type', 'catalog_status'].some(field => previous[field] !== row[field]) || normalize(previous.make) !== normalize(row.make) || normalize(previous.model) !== normalize(row.model)) fail('conflicting duplicate identity');
        if (identityOnly) fail('addition already present in the priced catalog');
      } else rows.set(row.vehicle_id, row);
    }
  }
  return [...rows.values()].sort((a, b) => a.vehicle_id.localeCompare(b.vehicle_id));
}

function loadCatalog(directory = path.join(__dirname, '../data/cars')) {
  const read = name => {
    const lines = parseCsv(fs.readFileSync(path.join(directory, name), 'utf8').replace(/^\uFEFF/, ''));
    const headers = lines.shift();
    return lines.filter(cells => cells.some(Boolean)).map(cells => Object.fromEntries(headers.map((field, index) => [field, cells[index] || ''])));
  };
  // Private identity aliases preserve the priced catalogs and existing IDs.
  // Toyota distinguishes Land Cruiser Prado from the wider Land Cruiser range:
  // https://global.toyota/en/newsroom/toyota/40658942.html
  return mergeCatalog([...read('master-vehicle-catalog.csv'), ...read('import-duty-vehicle-estimates.csv')], read('market-identity-additions.csv'))
    .map(row => row.make_slug === 'toyota' && row.model_slug === 'prado' && row.model === 'Prado'
      ? { ...row, model: 'Prado / Land Cruiser Prado' }
      : row);
}

module.exports = { loadCatalog, mergeCatalog };
