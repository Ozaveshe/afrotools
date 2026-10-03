#!/usr/bin/env node
// Compatibility entry point for the retired direct-to-price marketplace scraper.
// Feed access, listing review and public snapshot export belong to separate stages.
const fs = require('node:fs');
const path = require('node:path');

function refreshBlocker(registry) {
  if (!registry || !registry.sources || typeof registry.sources !== 'object'
      || Array.isArray(registry.sources)) throw new Error('Invalid car market source registry');
  const sources = [
    { id: 'dubicars-uae', domain: 'dubicars.com' },
    { id: 'autochek-ng', domain: 'autochek.africa' }
  ].map(source => {
    const row = registry.sources[source.id];
    return { ...source, accessStatus: row && row.access_status || 'unregistered' };
  });
  return {
    code: 'CAR_MARKET_LEGACY_REFRESH_DISABLED',
    sources,
    message: 'Legacy direct-to-price refresh is disabled. '
      + sources.map(source => `${source.domain}: ${source.accessStatus}`).join('; ') + '. '
      + 'No marketplace requests or price-file changes were made. '
      + 'Use a documented automated-approved feed, pending listing intake, independent review '
      + 'and reviewed public snapshot export under docs/CAR-MARKET-EVIDENCE-WORKFLOW.md. '
      + 'A source status alone cannot enable this retired scraper or approve a public price.'
  };
}

function main() {
  const sourceFile = path.join(__dirname, '../data/cars/market-source-registry.json');
  const registry = JSON.parse(fs.readFileSync(sourceFile, 'utf8').replace(/^\uFEFF/, ''));
  const blocker = refreshBlocker(registry);
  const error = new Error(blocker.message);
  error.code = blocker.code;
  throw error;
}

if (require.main === module) {
  try { main(); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
module.exports = { refreshBlocker, main };
