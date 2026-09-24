'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '../../..');
const { questionFingerprint, assessQuestion } = require('../../../scripts/lib/jamb-content-trust');
const read = relative => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));

// These are independent answer selections by meaning, recorded separately from
// the source-page key and the question's answer letter. An option or key mutation
// cannot pass merely by recalculating its fingerprint.
const expectedAnswerText = {
  2022: {
    16: 'Made every possible effort', 17: 'Soon after they entered',
    18: 'They failed', 19: 'Live honestly', 20: 'Respond as events unfolded',
    22: 'Despite', 25: 'All the', 26: 'In', 28: 'Us and them',
    31: 'Attends', 34: 'Five-day', 35: 'Advice', 38: 'Unavoidable',
    39: 'Arrest', 40: 'Notice', 41: 'Exacerbate', 42: 'Distraction',
    43: 'Fares', 44: 'Consul', 46: 'Reconnaissance', 47: 'Diminish',
    48: 'Vanquished', 49: 'Indifference', 52: 'Who bought the shoes?',
    53: 'For how long did it rain?', 55: 'Yam', 56: 'Home', 57: 'How',
    58: 'Feign', 59: 'Cite', 60: 'Gear'
  },
  2023: {
    26: 'She fell just short despite serious preparation',
    27: 'Beneath the mat', 28: 'She overcame her hesitation',
    30: 'She reached the top in bad weather', 31: 'Generous',
    32: 'Enthusiasm', 34: 'Clear', 35: 'Exceptional', 36: 'Bubbly',
    38: 'Skill', 39: 'Layoffs', 40: 'Captivating', 43: 'Altered',
    45: 'Explicit', 46: 'Forfeit', 49: 'Bolstered', 50: 'Enhances',
    52: 'Pint', 60: 'Result'
  }
};

function verify(year) {
  assert.ok(year === 2022 || year === 2023);
  const pool = read('ops/jamb/source-pool.json').questions;
  const ledger = read('data/jamb/review-ledger.json');
  const manifestPath = 'ops/nigeria-exams/jamb-english-2022-2023-curated.json';
  const bytes = fs.readFileSync(path.join(root, manifestPath));
  const hash = crypto.createHash('sha256').update(bytes).digest('hex');
  const manifest = JSON.parse(bytes);
  const batch = read(`ops/jamb/verification/english-${year}-publishable-901.json`);
  assert.equal(batch.source_snapshot_sha256, hash);
  assert.equal(batch.source_file, manifestPath);
  assert.equal(batch.source_url, manifest.source_pages[String(year)]);
  assert.equal(batch.year_basis, 'publisher-collection');
  const expected = expectedAnswerText[year];
  const checked = [];
  for (const entry of manifest.records.filter(row => row[0] === year)) {
    const [, sourceItem, prompt, choices, , explanation, sourceObservation] = entry;
    const id = `english-${year}-poscholars-${String(sourceItem).padStart(2, '0')}`;
    const question = pool.find(row => row.id === id);
    const record = batch.records.find(row => row.id === id);
    assert.ok(question && record, id);
    assert.equal(questionFingerprint(question), record.content_sha256, id);
    assert.equal(ledger.questions[id].content_sha256, record.content_sha256, id);
    assert.equal(ledger.sources[ledger.questions[id].source_id].content_sha256, hash, id);
    assert.equal(question.question, prompt, id);
    assert.deepEqual(Object.values(question.options), choices, id);
    assert.equal(question.options[question.answer], expected[sourceItem], id + ': answer independently selected by meaning');
    assert.equal(question.explanation, explanation, id);
    assert.equal(record.independent_reasoning, explanation, id);
    assert.equal(record.independently_selected_answer, expected[sourceItem], id);
    assert.equal(record.source_observation, sourceObservation, id);
    assert.equal(question.source_provenance.url, batch.source_url, id);
    assert.equal(question.num, null, id + ': webpage item number is not an official paper number');
    assert.equal(question.passage, undefined, id + ': no passage-dependent question is published');
    assert.equal(assessQuestion(question, ledger).state, 'eligible', id);
    checked.push(id);
  }
  assert.equal(checked.length, Object.keys(expected).length);
  assert.equal(batch.records.length, checked.length);
  assert.equal(new Set(checked).size, checked.length);
  return { passed: true, question_ids: checked };
}

module.exports = { verify };
