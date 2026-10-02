#!/usr/bin/env node
// Emit bounded identity-only SQL; execution belongs to the verified AfroTools MCP.
const { loadCatalog, mergeCatalog } = require('./car-market-catalog');
const chunkSize = 100;

function sqlString(value) {
  return "'" + String(value).replace(/'/g, "''") + "'";
}

function seedSql(input) {
  if (!Array.isArray(input) || input.length < 1 || input.length > chunkSize) throw Error('Expected 1..100 identities');
  const rows = mergeCatalog(input);
  const values = rows.map(row => `(${[
    row.vehicle_id, row.make, row.make_slug, row.model, row.model_slug,
    row.year, row.body_type, row.catalog_status
  ].map((value, index) => index === 5 ? Number(value) : sqlString(value)).join(', ')})`).join(',\n  ');
  return `insert into public.car_market_vehicles (vehicle_id, make, make_slug, model, model_slug, model_year, body_type, catalog_status) values\n  ${values}\non conflict (vehicle_id) do update set\n  make = excluded.make, make_slug = excluded.make_slug, model = excluded.model,\n  model_slug = excluded.model_slug, model_year = excluded.model_year,\n  body_type = excluded.body_type, catalog_status = excluded.catalog_status,\n  updated_at = now();`;
}

if (require.main === module) {
  const rows = loadCatalog();
  const args = process.argv.slice(2);
  if (args.includes('--count')) {
    console.log(JSON.stringify({ vehicles: rows.length, chunks: Math.ceil(rows.length / chunkSize), chunkSize }));
  } else if (args.includes('--ids')) {
    const value = args[args.indexOf('--ids') + 1] || '';
    const ids = value.split(',');
    if (args.includes('--chunk') || ids.length > chunkSize || ids.some(id => !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) || new Set(ids).size !== ids.length) throw Error('Pass distinct --ids, without --chunk');
    const selected = rows.filter(row => ids.includes(row.vehicle_id));
    if (selected.length !== ids.length) throw Error('Unknown catalog identity');
    process.stdout.write(seedSql(selected));
  } else {
    const index = args.includes('--chunk') ? Number(args[args.indexOf('--chunk') + 1]) : NaN;
    if (!Number.isInteger(index) || index < 0 || index >= Math.ceil(rows.length / chunkSize)) throw Error(`Pass --chunk 0..${Math.ceil(rows.length / chunkSize) - 1} or --ids ID,ID`);
    process.stdout.write(seedSql(rows.slice(index * chunkSize, (index + 1) * chunkSize)));
  }
}

module.exports = { seedSql };
