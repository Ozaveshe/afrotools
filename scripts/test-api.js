#!/usr/bin/env node
/**
 * AfroTools API Test Suite
 *
 * Run:  node scripts/test-api.js [base_url] [api_key]
 *
 * Examples:
 *   node scripts/test-api.js https://afrotools.com afro_live_abc123
 *   node scripts/test-api.js http://localhost:8888 afro_test_0000000000000000
 */

const BASE = (process.argv[2] || 'https://afrotools.com').replace(/\/+$/, '');
const KEY  = process.argv[3] || 'afro_test_0000000000000000';

let passed = 0;
let failed = 0;
const results = [];

// ── Helpers ──────────────────────────────────────────────────

async function get(path) {
  const url = BASE + path;
  const res = await fetch(url, { headers: { 'x-api-key': KEY } });
  const data = await res.json();
  return { status: res.status, ok: res.ok, data };
}

async function post(path, body) {
  const url = BASE + path;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'x-api-key': KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return { status: res.status, ok: res.ok, data };
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg);
}

async function test(name, fn) {
  try {
    await fn();
    passed++;
    results.push({ name, status: 'PASS' });
    console.log(`  \x1b[32mPASS\x1b[0m  ${name}`);
  } catch (err) {
    failed++;
    results.push({ name, status: 'FAIL', error: err.message });
    console.log(`  \x1b[31mFAIL\x1b[0m  ${name}`);
    console.log(`        ${err.message}`);
  }
}

// ── Tests ────────────────────────────────────────────────────

async function run() {
  console.log(`\nAfroTools API Test Suite`);
  console.log(`Base URL : ${BASE}`);
  console.log(`API Key  : ${KEY.slice(0, 12)}...\n`);

  // ── TAX ──

  await test('GET /api/tax — list all countries', async () => {
    const { ok, data } = await get('/api/tax');
    assert(ok, 'Expected 200 OK');
    assert(data.countries || data.data || Array.isArray(data), 'Expected countries list in response');
    const list = data.countries || data.data || data;
    assert(Array.isArray(list), 'Countries should be an array');
    assert(list.length >= 10, `Expected at least 10 countries, got ${list.length}`);
  });

  await test('GET /api/tax?country=NG — Nigeria info', async () => {
    const { ok, data } = await get('/api/tax?country=NG');
    assert(ok, 'Expected 200 OK');
    assert(data.country || data.code || data.name, 'Expected country info in response');
  });

  await test('POST /api/tax — Nigeria PAYE at 5,000,000', async () => {
    const { ok, data } = await post('/api/tax', {
      country: 'NG',
      income: 5000000,
    });
    assert(ok, 'Expected 200 OK');
    assert(data.tax !== undefined || data.total_tax !== undefined, 'Expected tax amount in response');
    assert(data.net !== undefined || data.net_income !== undefined, 'Expected net income in response');
  });

  await test('POST /api/tax — Kenya PAYE at KES 1,200,000', async () => {
    const { ok, data } = await post('/api/tax', {
      country: 'KE',
      income: 1200000,
    });
    assert(ok, 'Expected 200 OK');
    assert(data.tax !== undefined || data.total_tax !== undefined, 'Expected tax amount');
  });

  await test('POST /api/tax — South Africa at R500,000', async () => {
    const { ok, data } = await post('/api/tax', {
      country: 'ZA',
      income: 500000,
    });
    assert(ok, 'Expected 200 OK');
    assert(data.tax !== undefined || data.total_tax !== undefined, 'Expected tax amount');
  });

  await test('POST /api/tax — Ghana at GHS 60,000', async () => {
    const { ok, data } = await post('/api/tax', {
      country: 'GH',
      income: 60000,
    });
    assert(ok, 'Expected 200 OK');
    assert(data.tax !== undefined || data.total_tax !== undefined, 'Expected tax amount');
  });

  await test('POST /api/tax — net-to-gross reverse calculation', async () => {
    const { ok, data } = await post('/api/tax', {
      country: 'NG',
      income: 3500000,
      direction: 'net-to-gross',
    });
    assert(ok, 'Expected 200 OK');
    assert(data.gross !== undefined || data.gross_income !== undefined, 'Expected gross income in reverse calc');
  });

  // ── VAT ──

  await test('GET /api/vat — list all countries', async () => {
    const { ok, data } = await get('/api/vat');
    assert(ok, 'Expected 200 OK');
    assert(data.countries || data.rates || data.data || Array.isArray(data), 'Expected VAT data');
  });

  await test('POST /api/vat — Nigeria VAT add 7.5% on 100,000', async () => {
    const { ok, data } = await post('/api/vat', {
      country: 'NG',
      amount: 100000,
      direction: 'add',
    });
    assert(ok, 'Expected 200 OK');
    const gross = data.gross || data.total || data.amount_with_vat;
    assert(gross, 'Expected gross amount');
    // Nigeria VAT is 7.5%, so 100000 + 7500 = 107500
    if (typeof gross === 'number') {
      assert(Math.abs(gross - 107500) < 1, `Expected gross ~107500, got ${gross}`);
    }
  });

  await test('POST /api/vat — Nigeria VAT extract from 107,500', async () => {
    const { ok, data } = await post('/api/vat', {
      country: 'NG',
      amount: 107500,
      direction: 'extract',
    });
    assert(ok, 'Expected 200 OK');
    const net = data.net || data.amount_without_vat || data.exclusive;
    assert(net, 'Expected net amount');
    if (typeof net === 'number') {
      assert(Math.abs(net - 100000) < 1, `Expected net ~100000, got ${net}`);
    }
  });

  // ── FOREX ──

  await test('GET /api/forex — latest rates', async () => {
    const { ok, data } = await get('/api/forex');
    assert(ok, 'Expected 200 OK');
    assert(data.rates || data.data, 'Expected rates in response');
  });

  // ── FUEL ──

  await test('GET /api/fuel — fuel prices', async () => {
    const { ok, data } = await get('/api/fuel');
    assert(ok, 'Expected 200 OK');
    assert(data.prices || data.countries || data.data || Array.isArray(data), 'Expected fuel data');
  });

  // ── RATES ──

  await test('GET /api/rates — central bank rates', async () => {
    const { ok, data } = await get('/api/rates');
    assert(ok, 'Expected 200 OK');
    assert(data.rates || data.countries || data.data || Array.isArray(data), 'Expected rates data');
  });

  // ── ERROR HANDLING ──

  await test('POST /api/tax — invalid country returns error', async () => {
    const { ok, status } = await post('/api/tax', {
      country: 'XX',
      income: 100000,
    });
    assert(!ok, `Expected error status, got ${status}`);
    assert(status === 400 || status === 422 || status === 404, `Expected 4xx, got ${status}`);
  });

  await test('POST /api/tax — missing fields returns error', async () => {
    const { ok, status } = await post('/api/tax', {});
    assert(!ok, `Expected error status, got ${status}`);
    assert(status >= 400 && status < 500, `Expected 4xx, got ${status}`);
  });

  await test('GET /api/tax — bad API key returns 401/403', async () => {
    const url = BASE + '/api/tax';
    const res = await fetch(url, {
      headers: { 'x-api-key': 'invalid_key_000' }
    });
    assert(res.status === 401 || res.status === 403, `Expected 401/403, got ${res.status}`);
  });

  // ── CROSS-VALIDATION ──

  await test('Nigeria PAYE matches expected brackets', async () => {
    const { ok, data } = await post('/api/tax', {
      country: 'NG',
      income: 5000000,
    });
    assert(ok, 'Expected 200 OK');
    const tax = data.tax || data.total_tax;
    assert(typeof tax === 'number', 'Tax should be a number');
    // Nigerian PAYE on 5M: first 300k@7%, next 300k@11%, next 500k@15%,
    // next 500k@19%, next 1.6M@21%, above 3.2M@24%
    // = 21000 + 33000 + 75000 + 95000 + 336000 + 432000 = 992,000
    // Allow some tolerance for CRA deductions or different calculation approaches
    assert(tax > 500000 && tax < 1500000,
      `Nigeria PAYE on 5M expected between 500k-1.5M, got ${tax}`);
  });

  // ── Summary ────────────────────────────────────────────────

  console.log('\n' + '='.repeat(50));
  console.log(`Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
  console.log('='.repeat(50));

  if (failed > 0) {
    console.log('\nFailed tests:');
    results.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`  - ${r.name}: ${r.error}`);
    });
    process.exit(1);
  } else {
    console.log('\nAll tests passed!');
    process.exit(0);
  }
}

run().catch(err => {
  console.error('\nFatal error:', err);
  process.exit(2);
});
