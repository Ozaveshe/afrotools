#!/usr/bin/env node

const claims = require('./lib/public-claims');

const result = claims.buildRepository({ root: process.cwd(), write: false });
console.log('Public claim truth audit');
console.log(`Scanned files: ${result.scannedFiles}`);
console.log(`Detected claim phrases: ${result.rawHits}`);
console.log(`Approved claim hits: ${result.approvedHits}`);
console.log(`Failures: ${result.errors.length}`);

if (!result.ok) {
  for (const error of result.errors.slice(0, 100)) console.error(`- ${claims.formatIssue(error)}`);
  if (result.errors.length > 100) console.error(`- ${result.errors.length - 100} more failures omitted`);
  console.error('\nAudit failed. Use a registered approved variant or update the evidence-backed registry.');
  process.exit(1);
}

console.log('\nAudit passed. Public sensitive claims are registered and no prohibited absolute wording was found.');
