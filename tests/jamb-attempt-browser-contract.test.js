'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { webcrypto } = require('node:crypto');
const { questionFingerprint: digest } = require('../scripts/lib/jamb-content-trust');
const { buildPublications } = require('../scripts/lib/jamb-publication');
const { createReviewedBank } = require('../netlify/functions/_shared/jamb-reviewed-data');

function fixture() {
  const question = { id: 'synthetic-contract-math', subject: 'mathematics', year: 2027, num: 1,
    question: 'What is the value of 6 multiplied by 7?', options: { A: '36', B: '42', C: '48', D: '49' },
    answer: 'B', format: 4, has_diagram: false, explanation: 'Six groups of seven contain 42 items.' };
  const review = { status: 'accepted', reviewer: 'synthetic-test', reviewed_at: '2026-09-10', evidence: 'Synthetic fixture only' };
  const ledger = { schema_version: 1, sources: { fixture: { permission: { status: 'permitted', basis: 'original-work',
    evidence: 'Synthetic fixture only', reviewed_by: 'synthetic-test', reviewed_at: '2026-09-10' } } },
  questions: { [question.id]: { source_id: 'fixture', content_sha256: digest(question), question_review: review,
    answer_review: review, explanation_review: review } }, flashcards: {} };
  const built = buildPublications({ questions: [question] }, { decks: [] }, ledger);
  return { pool: built.files['pools/practice-pool.json'], index: built.files['pools/index.json'], ledger };
}

async function submitFromBrowser(mode, enginePath, persist = false) {
  const fixtureData = fixture();
  const bank = createReviewedBank(fixtureData.pool, fixtureData.index, fixtureData.ledger);
  let body;
  const browser = { crypto: webcrypto, TextEncoder, setInterval: () => 1, clearInterval() {},
    localStorage: { getItem: () => null, setItem() {}, removeItem() {} }, fetch: async (url, options) => {
      if (url.endsWith('/jamb-attempt')) { body = JSON.parse(options.body); return { ok: true }; }
      return { ok: true, json: async () => JSON.parse(JSON.stringify(url.endsWith('/index.json') ? fixtureData.index : fixtureData.pool)) };
    } };
  browser.window = browser;
  vm.runInNewContext(fs.readFileSync('assets/js/lib/jamb-question-trust.js', 'utf8'), browser);
  const pool = await browser.AfroJAMB.QuestionTrust.loadPool();
  vm.runInNewContext(fs.readFileSync(enginePath, 'utf8'), browser);
  browser.AfroJAMB.CBT.init({ mode, pool: pool.questions, poolRevision: pool.review_revision,
    subjects: ['english', 'mathematics', 'physics', 'biology'] });
  browser.AfroJAMB.CBT.selectAnswer('B');
  browser.AfroJAMB.CBT.submit();
  let providerCalls = 0;
  let storedRow;
  if (persist) body.metadata = { review_validation: { review_revision: 'client-forgery', validator_version: 99 } };
  const server = { exports: {}, process: { env: persist ? { SUPABASE_SERVICE_KEY: 'synthetic-server-key' } : {} }, console: { warn() {} }, require(id) {
    if (id === './_shared/jamb-reviewed-data') return { getReviewedBank: () => bank };
    if (id === '@supabase/supabase-js') return { createClient(url, key) { providerCalls++;
      if (!persist) throw new Error('No live database allowed');
      assert.equal(url, 'https://zpclagtgczsygrgztlts.supabase.co'); assert.equal(key, 'synthetic-server-key');
      return { from(table) { assert.equal(table, 'jamb_attempts'); return { async insert(row) { storedRow = JSON.parse(JSON.stringify(row)); return { error: null }; } }; } };
    } };
    throw new Error('Unexpected dependency ' + id);
  } };
  vm.runInNewContext(fs.readFileSync('netlify/functions/jamb-attempt.js', 'utf8'), server);
  const response = await server.exports.handler({ httpMethod: 'POST', body: JSON.stringify(body) });
  return { response, body, recomputed: () => bank.attempt(body), providerCalls, storedRow };
}

test('trusted persistence stamps the validated revision and ignores a client-supplied trust marker', async () => {
  const result = await submitFromBrowser('full', 'engines/src/jamb-cbt-engine.js', true);
  assert.equal(JSON.parse(result.response.body).persisted, true);
  assert.equal(result.storedRow.score, 400);
  assert.deepEqual(result.storedRow.metadata.review_validation, { policy: 'reviewed-only', validator_version: 1, review_revision: result.body.pool_revision });
  assert.equal(result.providerCalls, 1);
});

for (const enginePath of ['engines/src/jamb-cbt-engine.js', 'engines/jamb-cbt-engine.js']) {
  for (const mode of ['full', 'cbt-full', 'quick', 'subject', 'topic-drill', 'past-paper']) {
    test(`${enginePath}: ${mode} submits actual reviewed subjects through the real endpoint contract`, async () => {
      const result = await submitFromBrowser(mode, enginePath);
      assert.equal(result.response.statusCode, 200, result.response.body);
      assert.equal(result.body.mode, mode === 'full' ? 'cbt-full' : mode);
      assert.deepEqual(result.body.subjects, ['mathematics']);
      assert.equal(result.recomputed().score, 400);
      assert.deepEqual(JSON.parse(result.response.body), { ok: true, persisted: false });
      assert.equal(result.providerCalls, 0);
    });
  }
}
