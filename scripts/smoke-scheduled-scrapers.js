const path = require('path');

const SCRAPER_FILES = [
  'scheduled-detect-changes.js',
  'scheduled-fetch-agri-inputs.js',
  'scheduled-fetch-central-bank-rates.js',
  'scheduled-fetch-commodity-prices.js',
  'scheduled-fetch-crypto.js',
  'scheduled-fetch-electricity-tariffs.js',
  'scheduled-fetch-forex-rates.js',
  'scheduled-fetch-fuel-prices.js',
  'scheduled-fetch-insurance.js',
  'scheduled-fetch-property.js',
  'scheduled-fetch-salaries.js',
  'scheduled-fetch-shipping.js',
  'scheduled-fetch-stocks.js',
  'scheduled-fetch-telecom-plans.js',
  'scheduled-scan-gazette.js',
];

async function runOne(file) {
  const original = { log: console.log, warn: console.warn, error: console.error };
  const logs = [];

  console.log = (...args) => logs.push('[log] ' + args.join(' '));
  console.warn = (...args) => logs.push('[warn] ' + args.join(' '));
  console.error = (...args) => logs.push('[error] ' + args.join(' '));

  const startedAt = Date.now();

  try {
    const mod = require(path.resolve(__dirname, '..', 'netlify', 'functions', file));
    const response = await mod.handler({});
    return {
      file,
      ok: true,
      statusCode: response && response.statusCode,
      body: response && response.body,
      durationMs: Date.now() - startedAt,
      logs: logs.slice(-12),
    };
  } catch (error) {
    return {
      file,
      ok: false,
      error: error && (error.stack || error.message || String(error)),
      durationMs: Date.now() - startedAt,
      logs: logs.slice(-12),
    };
  } finally {
    console.log = original.log;
    console.warn = original.warn;
    console.error = original.error;
  }
}

async function main() {
  const results = [];
  for (const file of SCRAPER_FILES) {
    results.push(await runOne(file));
  }

  const failed = results.filter((result) => !result.ok || (result.statusCode && result.statusCode >= 400));

  process.stdout.write(JSON.stringify({
    total: results.length,
    failed: failed.length,
    results,
  }, null, 2));

  if (failed.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error && (error.stack || error.message || String(error)));
  process.exit(1);
});
