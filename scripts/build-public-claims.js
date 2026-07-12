#!/usr/bin/env node

const path = require('path');
const claims = require('./lib/public-claims');

const root = process.cwd();
const write = process.argv.includes('--write');
const check = process.argv.includes('--check') || !write;

if (write && process.argv.includes('--check')) {
  console.error('Choose either --write or --check.');
  process.exit(2);
}

const result = claims.buildRepository({ root, write });
console.log(`Public claims ${write ? 'build' : 'check'}`);
console.log(`Scanned files: ${result.scannedFiles}`);
console.log(`Detected claim phrases: ${result.rawHits}`);
console.log(`Approved claim hits: ${result.approvedHits}`);
console.log(`Projected HTML files: ${result.changedFiles.length}`);

if (!result.ok) {
  for (const error of result.errors.slice(0, 100)) console.error(`- ${claims.formatIssue(error)}`);
  if (result.errors.length > 100) console.error(`- ${result.errors.length - 100} more errors omitted`);
  process.exit(1);
}

if (check && result.changedFiles.length) {
  console.error('Claim selectors are stale. Run npm run claims:build.');
  for (const file of result.changedFiles.slice(0, 50)) console.error(`- ${path.relative(root, path.join(root, file))}`);
  process.exit(1);
}

console.log('Public claims contract passed.');
