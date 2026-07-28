'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const test = require('node:test');

const ROOT = path.resolve(__dirname, '..');
const SPOOFED_EVENT = {
  httpMethod: 'POST',
  headers: { 'x-nf-event': 'schedule' },
  body: JSON.stringify({ next_run: '2026-07-29T00:00:00.000Z' }),
  queryStringParameters: {},
};

function freshRequire(relativePath) {
  const resolved = require.resolve(path.join(ROOT, relativePath));
  delete require.cache[resolved];
  return require(resolved);
}

test('caller-controlled schedule signals never authorize public handlers', async function() {
  const previous = {
    ADMIN_SECRET: process.env.ADMIN_SECRET,
    ADMIN_KEY: process.env.ADMIN_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    SUPABASE_DATA_SERVICE_ROLE_KEY: process.env.SUPABASE_DATA_SERVICE_ROLE_KEY,
  };

  process.env.ADMIN_SECRET = 'test-admin-secret';
  process.env.ADMIN_KEY = 'test-admin-secret';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
  process.env.SUPABASE_DATA_SERVICE_ROLE_KEY = 'test-service-role-key';

  try {
    const news = freshRequire('netlify/functions/afrostream-news-monitor.js');
    const sync = freshRequire('netlify/functions/afrostream-sync.js');
    const fx = freshRequire('netlify/functions/scrape-fx-rates.js');
    delete require.cache[require.resolve(path.join(ROOT, 'netlify/functions/_shared/market-data.js'))];
    const market = freshRequire('netlify/functions/scheduled-refresh-market-data.js');

    assert.strictEqual((await news.handler(SPOOFED_EVENT)).statusCode, 401);
    assert.strictEqual((await sync.handler(SPOOFED_EVENT)).statusCode, 401);
    assert.strictEqual((await fx.handler(SPOOFED_EVENT)).statusCode, 401);
    assert.strictEqual((await market.handler(SPOOFED_EVENT)).statusCode, 401);
    assert.strictEqual((await fx.handler({
      httpMethod: 'PUT',
      headers: { 'x-admin-key': 'test-admin-secret' },
    })).statusCode, 405);
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});

test('scheduled jobs use dedicated schedule-only wrapper names', function() {
  const config = fs.readFileSync(path.join(ROOT, 'netlify.toml'), 'utf8');
  const redirects = fs.readFileSync(path.join(ROOT, '_redirects'), 'utf8');
  const pairs = [
    ['afrostream-sync', 'afrostream-sync-scheduled'],
    ['afrostream-news-monitor', 'afrostream-news-monitor-scheduled'],
    ['scheduled-refresh-market-data', 'scheduled-refresh-market-data-runner'],
    ['scheduled-source-health-watchdog', 'scheduled-source-health-watchdog-runner'],
    ['scrape-fx-rates', 'scrape-fx-rates-scheduled'],
  ];

  for (const [manualName, scheduledName] of pairs) {
    assert.match(config, new RegExp(`\\[functions\\."${scheduledName}"\\][\\s\\S]*?schedule\\s*=`));
    assert.doesNotMatch(config, new RegExp(`\\[functions\\."${manualName}"\\][\\s\\S]*?schedule\\s*=`));

    const manualSource = fs.readFileSync(
      path.join(ROOT, 'netlify', 'functions', manualName + '.js'),
      'utf8'
    );
    assert.doesNotMatch(manualSource, /require\(['"]\.\/_shared\/scheduled-event['"]\)/);
    assert.ok(fs.existsSync(path.join(ROOT, 'netlify', 'functions', scheduledName + '.js')));
  }

  assert.match(redirects, /\/\.netlify\/functions\/afrostream-sync\b/);
  assert.match(redirects, /\/\.netlify\/functions\/afrostream-news-monitor\b/);
  assert.match(redirects, /\/\.netlify\/functions\/scheduled-refresh-market-data\b/);
  assert.match(redirects, /\/\.netlify\/functions\/scrape-fx-rates\b/);

  const publicTargets = Array.from(
    redirects.matchAll(/\/\.netlify\/functions\/([A-Za-z0-9_-]+)/g),
    (match) => match[1]
  );
  for (const functionName of new Set(publicTargets)) {
    const functionPath = path.join(ROOT, 'netlify', 'functions', functionName + '.js');
    if (!fs.existsSync(functionPath)) continue;
    const source = fs.readFileSync(functionPath, 'utf8');
    assert.doesNotMatch(
      source,
      /(?:scheduled-event|isScheduledEvent)/,
      `public function ${functionName} must not infer scheduled trust from caller-controlled input`
    );
  }
});
