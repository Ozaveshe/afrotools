'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { assessQuestion, questionFingerprint } = require('../../../scripts/lib/jamb-content-trust');

const root = path.resolve(__dirname, '../../..');
const manifestPath = 'ops/nigeria-exams/jamb-math-2021-curated-batch-01.json';
const snapshotPath = 'ops/nigeria-exams/jamb-math-2021-source-snapshot-01.json';
const receiptPath = 'ops/jamb/verification/mathematics-2021-publishable-001.json';
const ACCEPTED = Object.freeze(['60716', '60732', '60735', '60736', '60739']);
const DUPLICATES = Object.freeze(['60723', '60728', '60729', '60730']);
const read = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const clean = value => value.replace(/−/g, '-').replace(/\s+/g, '');

function select(item, predicate) {
  const choices = Object.entries(item.options).filter(([, option]) => predicate(option));
  assert.equal(choices.length, 1, item.sourceItem + ': independent calculation must select one option');
  return choices[0][0];
}

function multiply(left, right) {
  const result = Array(left.length + right.length - 1).fill(0);
  left.forEach((a, i) => right.forEach((b, j) => { result[i + j] += a * b; }));
  return result;
}

function polynomialProduct(option) {
  const text = clean(option);
  const factors = [...text.matchAll(/\(([^()]*)\)/g)].map(match => match[1]);
  assert.equal(factors.map(factor => '(' + factor + ')').join(''), text, 'Unsupported factor expression');
  return factors.reduce((product, factor) => {
    const quadratic = factor.match(/^m²\+([0-9]+)$/);
    const linear = factor.match(/^m([+-])([0-9]+)$/);
    assert(quadratic || linear, 'Unsupported polynomial factor');
    const coefficients = quadratic ? [Number(quadratic[1]), 0, 1]
      : [(linear[1] === '-' ? -1 : 1) * Number(linear[2]), 1];
    return multiply(product, coefficients);
  }, [1]);
}

// Calculate from the actual adapted prompt and option values, never from its key.
function solveAnswers(manifest) {
  assert.deepEqual(manifest.items.map(item => item.sourceItem), ACCEPTED);
  const answers = {};
  for (const item of manifest.items) {
    let key;
    if (item.sourceItem === '60716') {
      const match = item.question.match(/m³ − m² \+ ([0-9]+)m − ([0-9]+)/);
      assert(match, '60716: complete polynomial is required');
      const expected = [-Number(match[2]), Number(match[1]), -1, 1];
      key = select(item, option => JSON.stringify(polynomialProduct(option)) === JSON.stringify(expected));
    } else if (item.sourceItem === '60732') {
      assert.match(item.question, /set of all integers x satisfying/);
      const match = item.question.match(/(−?[0-9]+) < ([0-9]+)x − ([0-9]+) < ([0-9]+)/);
      assert(match, '60732: strict inequality is required');
      const lower = Number(match[1].replace('−', '-'));
      const coefficient = Number(match[2]);
      const shift = Number(match[3]);
      const upper = Number(match[4]);
      const integers = [];
      for (let x = Math.floor((lower + shift) / coefficient); x <= Math.ceil((upper + shift) / coefficient); x++) {
        if (lower < coefficient * x - shift && coefficient * x - shift < upper) integers.push(x);
      }
      assert.deepEqual(integers, [3, 4]);
      key = select(item, option => {
        assert.match(option, /^\{[0-9, ]+\}$/);
        return JSON.stringify(option.slice(1, -1).split(',').map(Number)) === JSON.stringify(integers);
      });
    } else if (item.sourceItem === '60735') {
      assert.match(item.question, /X is due east of Y/);
      assert.match(item.question, /bearing of Z from X/);
      const match = item.question.match(/Z is ([0-9.]+) km due south of Y, and XZ is ([0-9.]+) km/);
      assert(match, '60735: directions and both lengths are required');
      const south = Number(match[1]), diagonal = Number(match[2]);
      assert(south > 0 && diagonal > south);
      const west = Math.sqrt(diagonal ** 2 - south ** 2);
      const bearing = (Math.atan2(-west, -south) * 180 / Math.PI + 360) % 360;
      assert(Math.abs(bearing - 240) < 1e-10);
      key = select(item, option => /^\d+°$/.test(option) && Math.abs(Number(option.slice(0, -1)) - bearing) < 1e-10);
    } else if (item.sourceItem === '60736') {
      assert.match(item.question, /each sells at least one of maize, yam and plantain/);
      const value = pattern => {
        const match = item.question.match(pattern); assert(match, '60736: missing set count'); return Number(match[1]);
      };
      const m = value(/([0-9]+) sell maize/), y = value(/([0-9]+) sell yam/), p = value(/([0-9]+) sell plantain/);
      const pm = value(/([0-9]+) sell both plantain and maize/), ym = value(/([0-9]+) sell both yam and maize/);
      const ypOnly = value(/([0-9]+) sell yam and plantain only/), all = value(/([0-9]+) sell all three/);
      const yp = ypOnly + all;
      const count = m + y + p - pm - ym - yp + all;
      const regions = [m - pm - ym + all, y - ym - yp + all, p - pm - yp + all,
        pm - all, ym - all, ypOnly, all];
      assert(regions.every(number => number >= 0));
      assert.equal(regions.reduce((sum, number) => sum + number, 0), count);
      assert.equal(count, 25);
      key = select(item, option => /^\d+$/.test(option) && Number(option) === count);
    } else {
      const expression = item.question.match(/P\(x\) = Lx \+ ([0-9]+)kx² \+ ([0-9]+)/);
      const factors = item.question.match(/If x \+ ([0-9]+) and x − ([0-9]+) are factors/);
      assert(expression && factors, '60739: stated quadratic and both factors are required');
      const coefficient = Number(expression[1]), constant = Number(expression[2]);
      const r1 = -Number(factors[1]), r2 = Number(factors[2]);
      const b1 = coefficient * r1 * r1, b2 = coefficient * r2 * r2;
      const determinant = r1 * b2 - r2 * b1;
      assert.notEqual(determinant, 0);
      const L = (-constant * b2 + constant * b1) / determinant;
      const k = (-r1 * constant + r2 * constant) / determinant;
      assert.equal(L, -12); assert.equal(k, -6);
      for (const x of [r1, r2]) assert.equal(L * x + coefficient * k * x * x + constant, 0);
      key = select(item, option => {
        const pair = clean(option).match(/^L=(-?\d+),k=(-?\d+)$/);
        return !!pair && Number(pair[1]) === L && Number(pair[2]) === k;
      });
    }
    answers[item.sourceItem] = key;
  }
  return answers;
}

function verify(manifest, pool, ledger, receipt, snapshotBytes) {
  const snapshot = JSON.parse(snapshotBytes);
  const answers = solveAnswers(manifest);
  assert.equal(manifest.year_basis, 'publisher-collection');
  assert.equal(manifest.sitting_authenticated, false);
  assert.equal(snapshot.collection_year, 2021);
  assert.equal(snapshot.sitting_authenticated, false);
  assert.equal(receipt.source_file, snapshotPath);
  assert.equal(receipt.source_snapshot_sha256, sha(snapshotBytes));
  assert.deepEqual(receipt.records.map(record => record.source_item), ACCEPTED);
  assert.deepEqual(snapshot.records.map(record => record.source_item), ACCEPTED);
  const checkedIds = [];
  for (const item of manifest.items) {
    const id = 'mathematics-2021-myschool-' + item.sourceItem;
    const question = pool.questions.find(record => record.id === id);
    const review = ledger.questions[id];
    const proof = receipt.records.find(record => record.id === id);
    const captured = snapshot.records.find(record => record.source_item === item.sourceItem);
    const source = review && ledger.sources[review.source_id];
    assert(question && review && proof && captured && source, id);
    assert.equal(item.answer, answers[item.sourceItem], id + ': independently selected answer');
    assert.equal(item.publisher_answer, answers[item.sourceItem], id + ': publisher comparison key');
    assert.equal(question.answer, answers[item.sourceItem], id + ': independently selected answer');
    assert.equal(proof.answer, answers[item.sourceItem]);
    assert.equal(proof.publisher_answer, item.publisher_answer);
    assert.equal(proof.independently_selected_answer, answers[item.sourceItem]);
    assert.equal(question.question, item.question);
    assert.deepEqual(question.options, item.options);
    assert.equal(question.explanation, item.explanation);
    assert.equal(question.year, 2021); assert.equal(question.num, null);
    assert.equal(captured.adapted_prompt, item.question);
    assert.deepEqual(captured.options, item.options);
    assert.deepEqual(captured.observed_options, item.observed_options);
    assert.equal(captured.publisher_answer, item.publisher_answer);
    assert.equal(captured.collection_position, item.position);
    assert.equal(captured.source_observed_at, item.source_observed_at);
    assert.equal(captured.source_prompt_sha256, item.source_prompt_sha256);
    assert.equal(captured.source_url, item.source_url);
    assert.equal(source.source_url, item.source_url);
    assert.equal(source.source_file, snapshotPath);
    assert.equal(source.content_sha256, receipt.source_snapshot_sha256);
    assert.equal(source.reuse_authorization.material_sha256, receipt.source_snapshot_sha256);
    assert.equal(source.official_answer_key, false);
    assert.equal(source.sitting_authenticated, false);
    assert.equal(questionFingerprint(question), proof.content_sha256);
    assert.equal(review.content_sha256, proof.content_sha256);
    assert.equal(assessQuestion(question, ledger).state, 'eligible', id);
    checkedIds.push(id);
  }
  for (const sourceItem of DUPLICATES) assert(!pool.questions.some(q => q.id === 'mathematics-2021-myschool-' + sourceItem));
  return { passed: true, accepted: checkedIds.length, excluded_public_duplicates: DUPLICATES.length,
    question_ids: checkedIds, scope: 'adapted publisher-collection practice; authenticated UTME sitting not asserted' };
}

if (require.main === module) {
  const result = verify(read(manifestPath), read('ops/jamb/source-pool.json'), read('data/jamb/review-ledger.json'),
    read(receiptPath), fs.readFileSync(path.join(root, snapshotPath)));
  process.stdout.write(JSON.stringify(result) + '\n');
}
module.exports = { solveAnswers, verify, ACCEPTED, DUPLICATES };
