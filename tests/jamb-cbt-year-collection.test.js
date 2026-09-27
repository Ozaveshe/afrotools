'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { webcrypto } = require('node:crypto');
const { bank, questions, reviewed } = require('./support/jamb-reviewed-fixtures');

async function createSession(enginePath = '../engines/src/jamb-cbt-engine.js') {
  const { review, ...base } = questions()[0];
  const rows = [
    reviewed({ ...base, id: 'english-2025-a', subject: 'english', year: 2025 }),
    reviewed({ ...base, id: 'english-2025-b', subject: 'english', year: 2025 }),
    reviewed({ ...base, id: 'english-2024-a', subject: 'english', year: 2024 }),
    reviewed({ ...base, id: 'mathematics-2025-a', subject: 'mathematics', year: 2025 }),
    reviewed({ ...base, id: 'mathematics-2025-b', subject: 'mathematics', year: 2025 }),
    reviewed({ ...base, id: 'mathematics-2024-a', subject: 'mathematics', year: 2024 })
  ];
  const fixture = bank(rows);
  const storage = new Map();
  const posts = [];
  const context = { crypto: webcrypto, TextEncoder,
    fetch: async (url, options) => {
      if (options && options.method === 'POST') { posts.push({ url, options }); return { ok: true }; }
      return { ok: true, json: async () => JSON.parse(JSON.stringify(url.endsWith('/index.json') ? fixture.index : fixture.pool)) };
    },
    localStorage: { getItem: key => storage.get(key) || null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) },
    setInterval: () => 1, clearInterval: () => {}
  };
  context.window = context;
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../assets/js/lib/jamb-question-trust.js'), 'utf8'), context);
  const loaded = await context.AfroJAMB.QuestionTrust.loadPool();
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, enginePath), 'utf8'), context);
  return { cbt: context.AfroJAMB.CBT, pool: loaded.questions, revision: loaded.review_revision, storage, posts };
}

for (const enginePath of ['../engines/src/jamb-cbt-engine.js', '../engines/jamb-cbt-engine.js']) {
  test(`${enginePath}: year collection selects only that year, restores its answers, and stays out of /400 attempt history`, async () => {
    const { cbt, pool, revision, storage, posts } = await createSession(enginePath);
    const config = { pool, poolRevision: revision, subjects: ['english'], mode: 'subject', year: 2025, questionsPerSubject: 40, durationMinutes: 40 };
    assert.equal(cbt.selectQuestions(config).length, 2);
    cbt.init(config);
    assert.equal(cbt.getCurrentQuestion().question.year, 2025);
    cbt.selectAnswer('B');
    const snapshot = JSON.parse(storage.get('afrojamb-cbt-state'));
    assert.equal(snapshot.year, 2025);
    assert.equal(snapshot.questionIds.length, 2);
    const savedAttempt = storage.get('afrojamb-cbt-state');
    assert.throws(() => cbt.restore({ ...config, year: 2024 }, snapshot), /saved collection changed/);
    assert.throws(() => cbt.restore({ ...config, subjects: ['mathematics'] }, snapshot), /saved collection changed/);
    assert.equal(storage.get('afrojamb-cbt-state'), savedAttempt, 'opening another collection must preserve saved answers');
    assert.equal(storage.get('afrojamb-history'), undefined);
    cbt.restore(config, snapshot);
    assert.equal(cbt.getCurrentQuestion().selectedAnswer, 'B');
    const result = cbt.submit();
    assert.equal(result.total, 1);
    assert.equal(result.outOf, 2);
    assert.equal(result.pctCorrect, 50);
    assert.ok(result.reviewItems.every(item => item.year === 2025 && item.explanation));
    assert.equal(posts.length, 0);
  });

  test(`${enginePath}: generic mock keeps its all-year selection and attempt POST`, async () => {
    const { cbt, pool, revision, posts } = await createSession(enginePath);
    cbt.init({ pool, poolRevision: revision, subjects: ['english'], mode: 'subject', questionsPerSubject: 40 });
    const result = cbt.submit();
    assert.equal(result.outOf, 3);
    assert.equal(posts.length, 1);
  });

  test(`${enginePath}: 2025 Mathematics practice excludes other subjects and years and keeps a raw result`, async () => {
    const { cbt, pool, revision, storage, posts } = await createSession(enginePath);
    const config = { pool, poolRevision: revision, subjects: ['mathematics'], mode: 'subject', year: 2025,
      questionsPerSubject: 40, durationMinutes: 40 };
    const selected = cbt.selectQuestions(config);
    assert.equal(selected.length, 2);
    assert.ok(selected.every(question => question.subject === 'mathematics' && question.year === 2025));
    cbt.init(config);
    cbt.selectAnswer('B');
    const snapshot = JSON.parse(storage.get('afrojamb-cbt-state'));
    assert.deepEqual(snapshot.subjects, ['mathematics']);
    assert.equal(snapshot.year, 2025);
    const savedAttempt = storage.get('afrojamb-cbt-state');
    assert.throws(() => cbt.restore({ ...config, subjects: ['english'] }, snapshot), /saved collection changed/);
    assert.equal(storage.get('afrojamb-cbt-state'), savedAttempt);
    cbt.restore(config, snapshot);
    assert.equal(cbt.getCurrentQuestion().selectedAnswer, 'B');
    const result = cbt.submit();
    assert.equal(result.total, 1);
    assert.equal(result.outOf, 2);
    assert.equal(result.pctCorrect, 50);
    assert.ok(result.reviewItems.every(item => item.subject === 'mathematics' && item.year === 2025 && item.explanation));
    assert.equal(posts.length, 0);
  });
}
