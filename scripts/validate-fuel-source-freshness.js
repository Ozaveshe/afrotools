const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const fuelPath = path.join(root, 'data/fuel/latest.json');
const workflowPath = path.join(root, 'data/fuel/official-source-workflow.json');
const data = JSON.parse(fs.readFileSync(fuelPath, 'utf8'));
const workflow = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));

const errors = [];
const today = new Date().toISOString().slice(0, 10);
const rows = Array.isArray(data.countries) ? data.countries : [];
const priorityCodes = new Set((workflow.priority_countries || []).map((item) => item.code));

if (!rows.length) {
  errors.push('data/fuel/latest.json has no country rows.');
}

rows.forEach((row) => {
  if (!row.code) errors.push('Fuel row missing country code.');
  const inheritedSourceState = row.source_state || data.source_state;
  if (!inheritedSourceState) errors.push(`${row.code || 'unknown'} missing source_state.`);
  if (row.official_verified === true && !row.official_source_url) {
    errors.push(`${row.code} is official_verified without official_source_url.`);
  }
  if (inheritedSourceState === 'static_seed_forex_only' && row.last_updated === today && row.official_verified !== true) {
    errors.push(`${row.code} seed fallback stamped today's date without official verification.`);
  }
  if (priorityCodes.has(row.code) && !row.official_source_state) {
    errors.push(`${row.code} priority row missing official_source_state.`);
  }
});

if (data.official_verified_count !== rows.filter((row) => row.official_verified === true).length) {
  errors.push('official_verified_count does not match row flags.');
}

if (!workflow.price_update_policy || workflow.price_update_policy.length < 3) {
  errors.push('Official-source workflow is missing price update policy rules.');
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log(`Fuel source freshness OK: ${rows.length} rows, ${data.official_verified_count || 0} official-verified rows.`);
