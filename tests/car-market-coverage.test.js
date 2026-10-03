const test = require('node:test');
const assert = require('node:assert/strict');
const { PROJECT, loadScope, scopeHash, captureSql, auditCapture } = require('../scripts/audit-car-market-coverage');
const NOW = new Date('2026-10-03T17:00:00Z');
const A = 'toyota-corolla-2018', B = 'toyota-camry-2018', C = 'kia-sorento-2015';
const scope = { original_ids: [A, B], markets: [{ country_code: 'NG', currency: 'NGN' }, { country_code: 'KE', currency: 'KES' }] };
function fixture() {
  const row = (country_code, currency, private_ids) => ({ country_code, currency, private_rows: private_ids.length, private_ids, private_currency_mismatches: 0, old_postings: 0, unknown_posting_dates: private_ids.length, specification_conflicts: 0, pending_observations: 0, accepted_observations: 0, accepted_ids: [], published_snapshots: 0, published_ids: [], current_published_snapshots: 0, current_published_ids: [], stale_published_snapshots: 0, automated_approved_sources: 0 });
  return { schema_version: 1, project_ref: PROJECT, captured_at: NOW.toISOString(), scope_sha256: scopeHash(scope), catalog_ids: [A, B, C], markets: [row('NG', 'NGN', [A, B]), row('KE', 'KES', [A, C])] };
}
const audit = value => auditCapture(value, scope, { now: NOW });

test('a car seen in two countries counts once globally and twice by market', () => {
  const out = audit(fixture());
  assert.deepEqual(out.counts, { activeCatalog: 3, supportedMarkets: 2, expectedIdentityMarketPairs: 6, originalIdentities: 2, expectedOriginalMarketPairs: 4, privateDistinctIdentities: 3, privateIdentityMarketPairs: 4, privateOriginalMarketPairs: 3, privateOriginalMissingMarketPairs: 1, privateMissingMarketPairs: 2, currentPublishedIdentityMarketPairs: 0, currentPublishedMissingMarketPairs: 6 });
  assert.deepEqual(out.markets.find(row => row.country_code === 'NG').private_missing_ids, [C]);
  assert.deepEqual(out.markets.find(row => row.country_code === 'KE').private_missing_ids, [B]);
});

test('an empty supported market keeps every active identity as a gap', () => {
  const f = fixture(); Object.assign(f.markets[1], { private_rows: 0, private_ids: [], unknown_posting_dates: 0 });
  const out = audit(f);
  assert.equal(out.counts.privateMissingMarketPairs, 4);
  assert.deepEqual(out.markets[0].private_missing_ids, [C, B, A].sort());
});

test('private, accepted, published and current counts do not substitute for each other', () => {
  const f = fixture(); Object.assign(f.markets[0], { accepted_observations: 3, accepted_ids: [A], published_snapshots: 1, published_ids: [A], stale_published_snapshots: 1 });
  Object.assign(f.markets[1], { published_snapshots: 1, published_ids: [C], current_published_snapshots: 1, current_published_ids: [C] });
  const out = audit(f);
  assert.equal(out.counts.privateIdentityMarketPairs, 4);
  assert.equal(out.counts.currentPublishedIdentityMarketPairs, 1);
  assert.equal(out.counts.currentPublishedMissingMarketPairs, 5);
  assert(out.limitations.some(text => text.includes('not permission')));
});

test('missing original catalog entries remain explicit instead of being hidden by additions', () => {
  const f = fixture(); f.catalog_ids = [A, C]; f.markets[0].private_ids = [A];
  const out = audit(f);
  assert.deepEqual(out.originalIdsMissingFromActiveCatalog, [B]);
  assert.equal(out.counts.expectedOriginalMarketPairs, 4);
  assert.equal(out.counts.expectedIdentityMarketPairs, 4);
});

test('wrong project, currency, scope, repeated or omitted countries are refused', () => {
  for (const mutate of [f => { f.project_ref = 'wrong'; }, f => { f.scope_sha256 = 'wrong'; }, f => { f.markets[0].currency = 'KES'; }, f => { f.markets[1].country_code = 'NG'; }, f => { f.markets.pop(); }]) {
    const f = fixture(); mutate(f); assert.throws(() => audit(f));
  }
});

test('duplicate and unknown identity references cannot inflate coverage', () => {
  for (const [target, value] of [['catalog_ids', [A, A, C]], ['private_ids', [A, A]], ['private_ids', ['unknown-car-2018']]]) {
    const f = fixture(); if (target === 'catalog_ids') f[target] = value; else f.markets[0][target] = value;
    assert.throws(() => audit(f), /Invalid identities/);
  }
});

test('impossible counters and current snapshots outside published identities are refused', () => {
  for (const mutate of [r => { r.private_rows = 1; }, r => { r.private_currency_mismatches = 1; }, r => { r.accepted_ids = [A]; }, r => { r.current_published_snapshots = 1; r.current_published_ids = [A]; }, r => { r.old_postings = 1; }, r => { r.specification_conflicts = -1; }, r => { r.pending_observations = 1.5; }]) {
    const f = fixture(); mutate(f.markets[0]); assert.throws(() => audit(f));
  }
});

test('stale, future and impossible-calendar captures are refused', () => {
  for (const captured_at of ['2026-10-02T16:59:59Z', '2026-10-03T17:05:01Z', '2026-02-30T00:00:00Z', '2026-10-03T24:00:00Z', 'today']) {
    const f = fixture(); f.captured_at = captured_at; assert.throws(() => audit(f), /fresh/);
  }
});

test('unexpected prices, URLs and personal fields are not retained by the audit', () => {
  for (const name of ['asking_price', 'listing_url', 'seller_phone', 'vin']) {
    const f = fixture(); f.markets[0][name] = 'private'; assert.throws(() => audit(f), /Unexpected capture fields/);
  }
  const f = fixture(); f.extra = 'private'; assert.throws(() => audit(f), /Unexpected capture fields/);
});

test('query is read-only, counts latest revisions and filters local currency', () => {
  const sql = captureSql(scope);
  assert(!/\b(insert|update|delete|alter|drop|create|grant|revoke|truncate)\b/i.test(sql));
  assert(sql.includes('distinct on(source_id,listing_url)'));
  assert(sql.includes('r.currency=m.currency'));
  assert(sql.includes("interval '14 days'"));
  assert(!/asking_price|median_ask|listing_url'|seller_phone|vin/i.test(sql));
});

test('malformed scope values cannot enter the SQL', () => {
  assert.throws(() => captureSql({ ...scope, markets: [{ country_code: "NG'); drop table x;--", currency: 'NGN' }] }));
  assert.throws(() => captureSql({ ...scope, original_ids: [A, A] }));
});

test('repository scope preserves the original catalog and every product market', () => {
  const actual = loadScope();
  assert.equal(actual.original_ids.length, 482);
  assert.equal(actual.markets.length, 20);
  assert(actual.original_ids.includes(A));
  assert(actual.markets.some(row => row.country_code === 'NA' && row.currency === 'NAD'));
});

test('CLI file output preserves the full market list without printing it', () => {
  const fs = require('node:fs'), os = require('node:os'), path = require('node:path'), cp = require('node:child_process');
  const actual = loadScope(), f = fixture(), temp = fs.mkdtempSync(path.join(os.tmpdir(), 'car-coverage-'));
  const input = path.join(temp, 'capture.json'), output = path.join(temp, 'report.json');
  try {
    f.captured_at = new Date().toISOString(); f.scope_sha256 = scopeHash(actual); f.catalog_ids = [A];
    f.markets = actual.markets.map(m => ({ ...f.markets[0], ...m, private_rows: 0, private_ids: [], unknown_posting_dates: 0 }));
    fs.writeFileSync(input, JSON.stringify(f));
    const result = cp.spawnSync(process.execPath, [path.join(__dirname, '../scripts/audit-car-market-coverage.js'), 'report', input, output], { encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    const summary = JSON.parse(result.stdout), report = JSON.parse(fs.readFileSync(output, 'utf8'));
    assert.equal(summary.counts.privateMissingMarketPairs, 20);
    assert.equal(report.markets.length, 20);
    assert(report.markets.every(row => row.private_missing_ids.includes(A)));
    assert(!result.stdout.includes('private_missing_ids'));
  } finally {
    assert.equal(path.dirname(path.resolve(temp)), path.resolve(os.tmpdir()));
    assert(path.basename(temp).startsWith('car-coverage-'));
    assert.equal(fs.lstatSync(temp).isSymbolicLink(), false);
    fs.rmSync(temp, { recursive: true });
  }
});
