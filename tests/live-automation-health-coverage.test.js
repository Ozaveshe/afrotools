const assert = require('assert');
const fs = require('fs');
const path = require('path');

const { inferHealth } = require('../scripts/audit-live-automation-health');

const ROOT = path.resolve(__dirname, '..');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function parseNetlifySchedules() {
  const text = fs.readFileSync(path.join(ROOT, 'netlify.toml'), 'utf8');
  const schedules = new Map();
  let currentFunction = null;

  for (const rawLine of text.split(/\r?\n/)) {
    const section = rawLine.match(/^\s*\[functions\."([^"]+)"\]\s*$/);
    if (section) {
      currentFunction = section[1];
      continue;
    }
    if (/^\s*\[/.test(rawLine)) {
      currentFunction = null;
      continue;
    }
    const schedule = rawLine.match(/^\s*schedule\s*=\s*"([^"]+)"\s*$/);
    if (currentFunction && schedule) schedules.set(currentFunction, schedule[1]);
  }

  return schedules;
}

function registryRecordsByFunction() {
  const registry = readJson(path.join(ROOT, 'data', 'automation', 'automation-registry.json'));
  const records = Array.isArray(registry.records) ? registry.records : [];
  const byFunction = new Map();

  records.forEach((record) => {
    if (!record || !record.netlify_function) return;
    const existing = byFunction.get(record.netlify_function);
    if (!existing || String(record.id || '').startsWith('netlify:')) {
      byFunction.set(record.netlify_function, record);
    }
  });

  return byFunction;
}

const schedules = parseNetlifySchedules();
const registryByFunction = registryRecordsByFunction();
const missingRegistry = [];
const missingHealth = [];
const missingEvidenceId = [];

Array.from(schedules.keys()).sort().forEach((functionName) => {
  const record = registryByFunction.get(functionName);
  if (!record) {
    missingRegistry.push(functionName);
    return;
  }

  const health = inferHealth(functionName);
  if (!health) {
    missingHealth.push(functionName);
    return;
  }

  const evidenceId = health.key || health.scraperId || health.metaKey || health.table || health.trigger;
  if (!evidenceId) missingEvidenceId.push(functionName);
});

assert.deepStrictEqual(
  missingRegistry,
  [],
  'Every scheduled Netlify function in netlify.toml must be registered in automation-registry.json'
);

assert.deepStrictEqual(
  missingHealth,
  [],
  'Every scheduled Netlify function must have durable live-health evidence inference'
);

assert.deepStrictEqual(
  missingEvidenceId,
  [],
  'Every scheduled Netlify live-health mapper must expose a stable evidence id'
);

assert.strictEqual(
  schedules.size,
  34,
  'Update this expected scheduled-function count when netlify.toml intentionally changes'
);

console.log('live-automation-health-coverage: ok');
