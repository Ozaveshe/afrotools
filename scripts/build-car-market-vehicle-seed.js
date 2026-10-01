#!/usr/bin/env node
// Emits a bounded, idempotent seed for the private car-market catalog table.
// Run each chunk through the configured AfroTools Supabase MCP, never a client key.
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const chunkSize = 100;

function parseCsv(input) {
  const rows = [];
  let row = [], cell = "", quoted = false;
  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    if (char === '"' && quoted && input[i + 1] === '"') { cell += '"'; i += 1; }
    else if (char === '"') quoted = !quoted;
    else if (char === "," && !quoted) { row.push(cell); cell = ""; }
    else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && input[i + 1] === "\n") i += 1;
      row.push(cell);
      if (row.some(Boolean)) rows.push(row);
      row = []; cell = "";
    } else cell += char;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const headers = rows.shift() || [];
  return rows.map((cells) => Object.fromEntries(headers.map((name, index) => [name, cells[index] || ""])));
}

function readRows(name) {
  return parseCsv(fs.readFileSync(path.join(root, "data/cars", name), "utf8"));
}

function catalog() {
  const rows = new Map();
  for (const row of readRows("master-vehicle-catalog.csv").concat(readRows("import-duty-vehicle-estimates.csv"))) {
    if (!row.vehicle_id || !row.make || !row.model || !/^\d{4}$/.test(row.year)) throw new Error(`Invalid catalog row: ${row.vehicle_id || "missing id"}`);
    if (!rows.has(row.vehicle_id)) rows.set(row.vehicle_id, row);
  }
  if (rows.size !== 482) throw new Error(`Expected 482 distinct vehicles; found ${rows.size}`);
  return [...rows.values()].sort((a, b) => a.vehicle_id.localeCompare(b.vehicle_id));
}

function sqlString(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

function seedSql(rows) {
  const values = rows.map((row) => `(${[
    row.vehicle_id, row.make, row.make_slug, row.model, row.model_slug,
    row.year, row.body_type
  ].map((value, index) => index === 5 ? Number(value) : sqlString(value)).join(", ")}, 'active')`).join(",\n  ");
  return `insert into public.car_market_vehicles (vehicle_id, make, make_slug, model, model_slug, model_year, body_type, catalog_status) values\n  ${values}\non conflict (vehicle_id) do update set\n  make = excluded.make, make_slug = excluded.make_slug, model = excluded.model,\n  model_slug = excluded.model_slug, model_year = excluded.model_year,\n  body_type = excluded.body_type, catalog_status = excluded.catalog_status,\n  updated_at = now();`;
}

const rows = catalog();
if (process.argv.includes("--count")) {
  console.log(JSON.stringify({ vehicles: rows.length, chunks: Math.ceil(rows.length / chunkSize), chunkSize }));
} else {
  const index = Number(process.argv[process.argv.indexOf("--chunk") + 1]);
  if (!Number.isInteger(index) || index < 0 || index >= Math.ceil(rows.length / chunkSize)) {
    throw new Error(`Pass --chunk 0..${Math.ceil(rows.length / chunkSize) - 1}`);
  }
  process.stdout.write(seedSql(rows.slice(index * chunkSize, (index + 1) * chunkSize)));
}
