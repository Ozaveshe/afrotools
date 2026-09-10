#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { auditQuestions, questionFingerprint } = require('./lib/jamb-content-trust');
const ROOT = path.resolve(__dirname, '..');

function buildAudit(root = ROOT) {
  const read = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
  const pool = read('ops/jamb/source-pool.json');
  const ledger = read('data/jamb/review-ledger.json');
  if (ledger.schema_version !== 1) throw new Error('Unsupported JAMB review ledger schema');
  const audit = auditQuestions(pool.questions, ledger);
  const sourceFiles = {}; const rawById = new Map();
  for (const subject of Object.keys(audit.subjects)) {
    const file = 'ops/jamb/raw/' + subject + '.json';
    if (!fs.existsSync(path.join(root, file))) continue;
    for (const q of read(file).questions || []) {
      if (!rawById.has(q.id)) rawById.set(q.id, []);
      rawById.get(q.id).push(q.source_file || null);
    }
  }
  for (const record of audit.records) {
    record.source_files = [...new Set((rawById.get(record.id) || []).filter(Boolean))].sort();
    for (const source of record.source_files) sourceFiles[source] = (sourceFiles[source] || 0) + 1;
  }
  return { schema_version: 1, pool_sha256: questionFingerprint(pool), ledger_sha256: questionFingerprint(ledger),
    scope: 'Repository practice pool; structural screening and evidence-record completeness. Does not independently prove answer correctness, permission validity, deployment or human review.',
    publication_status: 'Audit only. Runtime and deployed pools are not changed by this command.',
    ...audit, source_files: sourceFiles };
}

function main(args = process.argv.slice(2)) {
  const audit = buildAudit();
  const outputArg = args.indexOf('--output');
  const output = outputArg === -1 ? path.join(ROOT, 'reports/jamb-content-audit.json') : path.resolve(args[outputArg + 1]);
  const content = JSON.stringify(audit, null, 2) + '\n';
  if (args.includes('--check')) {
    if (!fs.existsSync(output) || fs.readFileSync(output, 'utf8') !== content) throw new Error('JAMB content audit is missing or stale');
  } else {
    fs.mkdirSync(path.dirname(output), { recursive: true });
    fs.writeFileSync(output, content);
  }
  console.log(JSON.stringify({ total: audit.total, eligible: audit.eligible, quarantined: audit.quarantined,
    reasons: audit.reasons, sourceFiles: Object.keys(audit.source_files).length, output }, null, 2));
  if (args.includes('--require-reviewed') && audit.quarantined) process.exitCode = 1;
}

if (require.main === module) main();
module.exports = { buildAudit, main };
