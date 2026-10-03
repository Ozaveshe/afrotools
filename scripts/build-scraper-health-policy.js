#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { inferHealth } = require('./audit-live-automation-health');
const { previousScheduledAt } = require('../netlify/functions/_shared/cron-schedule');
const ROOT = path.resolve(__dirname, '..');
const OUTPUT = path.join(ROOT, 'netlify/functions/_shared/scraper-health-policy.json');

function buildPolicy() {
  const records = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/automation/automation-registry.json'), 'utf8')).records;
  const toml = fs.readFileSync(path.join(ROOT, 'netlify.toml'), 'utf8');
  const schedules = new Map();
  let current = null;
  for (const line of toml.split(/\r?\n/)) {
    const section = line.match(/^\s*\[functions\."([^"]+)"\]\s*$/);
    if (section) current = section[1];
    else if (/^\s*\[/.test(line)) current = null;
    const schedule = line.match(/^\s*schedule\s*=\s*"([^"]+)"\s*$/);
    if (current && schedule) schedules.set(current, schedule[1]);
  }
  const collectors = {};
  for (const record of records) {
    if (record.runner !== 'netlify' || !record.production_required || !String(record.id).startsWith('netlify:')) continue;
    const health = inferHealth(record.netlify_function);
    if (!health || health.type !== 'scraper_run') continue;
    const schedule = schedules.get(record.netlify_function);
    const slaHours = Number(record.sla_hours);
    if (!schedule || schedule !== record.expected_schedule || !(slaHours > 0) ||
        !previousScheduledAt(schedule, new Date('2026-01-01T00:00:00Z'))) {
      throw new Error('Invalid collector cadence: ' + record.netlify_function);
    }
    if (collectors[health.scraperId]) throw new Error('Duplicate scraper owner: ' + health.scraperId);
    collectors[health.scraperId] = {
      function_name: record.netlify_function,
      schedule,
      sla_hours: slaHours,
      requires_scheduled_source: health.requireScheduledSource === true,
    };
  }
  if (!Object.keys(collectors).length) throw new Error('No registered scraper owners found');
  return {
    schema_version: 1,
    scope: 'collector_run_history',
    generated_from: ['data/automation/automation-registry.json', 'netlify.toml', 'scripts/audit-live-automation-health.js', 'netlify/functions/*.js'],
    collectors: Object.fromEntries(Object.entries(collectors).sort(([a], [b]) => a.localeCompare(b))),
  };
}

function main() {
  const policy = buildPolicy();
  const content = JSON.stringify(policy, null, 2) + '\n';
  if (process.argv.includes('--check')) {
    if (!fs.existsSync(OUTPUT) || fs.readFileSync(OUTPUT, 'utf8').replace(/\r\n/g, '\n') !== content) {
      throw new Error('Scraper health policy is out of date; run node scripts/build-scraper-health-policy.js');
    }
    console.log('Scraper health policy matches registered owners and schedules');
  } else {
    fs.writeFileSync(OUTPUT, content);
    console.log('Built scraper health policy for ' + Object.keys(policy.collectors).length + ' owners');
  }
}
if (require.main === module) main();
module.exports = { buildPolicy };
