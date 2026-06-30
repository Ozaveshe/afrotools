const assert = require('assert');
const fs = require('fs');
const path = require('path');

const migrationPath = path.resolve(__dirname, '..', 'supabase', 'migrations', '052-function-search-path-hardening.sql');
const sql = fs.readFileSync(migrationPath, 'utf8');
const normalized = sql.replace(/\s+/g, ' ').toLowerCase();

[
  'public.normalize_scholarship_source_defaults()',
  'public.parse_afrostream_money_value(text)',
].forEach((signature) => {
  assert.ok(
    normalized.includes("to_regprocedure('" + signature + "')"),
    signature + ' should be guarded with to_regprocedure'
  );
  assert.ok(
    normalized.includes('alter function ' + signature),
    signature + ' should have an ALTER FUNCTION clause'
  );
});

const searchPathPins = normalized.match(/set search_path = public/g) || [];
assert.strictEqual(
  searchPathPins.length,
  2,
  'The migration should pin exactly the two advised function search paths'
);

assert.ok(
  !normalized.includes('spatial_ref_sys'),
  'PostGIS/RLS remediation must stay separate from this low-risk function hardening migration'
);

assert.ok(
  !normalized.includes('enable row level security'),
  'This migration must not enable RLS on any table'
);

console.log('supabase-function-search-path-migration: ok');
