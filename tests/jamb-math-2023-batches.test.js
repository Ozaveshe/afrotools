'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const crypto = require('node:crypto');
const path = require('node:path');
const { assessQuestion, questionFingerprint } = require('../scripts/lib/jamb-content-trust');
const root = path.resolve(__dirname, '..');
const read = name => JSON.parse(fs.readFileSync(path.join(root, name), 'utf8'));
const batches = [2, 3].map(n => read(`ops/nigeria-exams/jamb-math-2023-reviewed-batch-0${n}.json`));
const items = batches.flatMap(batch => batch.items);
const pool = read('ops/jamb/source-pool.json');
const ledger = read('data/jamb/review-ledger.json');
const choose = (n, k) => { let value = 1; for (let i = 1; i <= k; i++) value = value * (n - i + 1) / i; return value; };
const round = (value, places) => Number(value.toFixed(places));
const determinant = m => m[0][0] * (m[1][1]*m[2][2]-m[1][2]*m[2][1])
  - m[0][1] * (m[1][0]*m[2][2]-m[1][2]*m[2][0])
  + m[0][2] * (m[1][0]*m[2][1]-m[1][1]*m[2][0]);
const isPrime = n => n > 1 && Array.from({ length: Math.floor(Math.sqrt(n)) - 1 }, (_, i) => i + 2).every(d => n % d);

test('every new Maths item has a unique inspected source and a pinned publication review', () => {
  assert.equal(items.length, 52);
  assert.equal(new Set(items.map(q => q.sourceItem)).size, items.length);
  for (const [index, batch] of batches.entries()) {
    const n = index + 2;
    const snapshotName = `ops/nigeria-exams/jamb-math-2023-source-snapshot-0${n}.json`;
    const raw = fs.readFileSync(path.join(root, snapshotName));
    const hash = crypto.createHash('sha256').update(raw).digest('hex');
    const snapshot = JSON.parse(raw);
    assert.equal(snapshot.records.length, batch.items.length);
    for (const item of batch.items) {
      const id = 'mathematics-2023-myschool-' + item.sourceItem;
      const question = pool.questions.find(q => q.id === id);
      assert.ok(question, id);
      assert.equal(question.num, null);
      assert.equal(question.source_provenance.year_basis, 'publisher-collection');
      assert.equal(question.source_provenance.url,
        `https://myschool.ng/classroom/mathematics/${item.sourceItem}?exam_type=jamb&exam_year=2023`);
      assert.equal(questionFingerprint(question), ledger.questions[id].content_sha256);
      assert.equal(ledger.sources[ledger.questions[id].source_id].content_sha256, hash);
      assert.equal(assessQuestion(question, ledger).state, 'eligible');
      assert.ok(item.explanation.length >= 80, id);
      assert.equal(snapshot.records.find(r => r.source_item === item.sourceItem).adapted_prompt, item.question);
    }
  }
});

test('independent calculations and definitions select all 52 reviewed answer choices', () => {
  const sumPrimes = Array.from({ length: 6 }, (_, i) => i + 2).filter(isPrime);
  const deviations = [2,3,5,7,11].map(v => Math.abs(v - 5.6));
  const areaPrimitive = x => -2*x**3/3 + 2*x*x + 6*x;
  const answer = {
    67260: `${150/(225/4.5)} hours`,
    67261: `${(parseInt('1101001', 2)/parseInt('101', 2)).toString(2)}₂`,
    67262: `a = ${3*2+3}, b = ${-(3+2)}`.replace('-','−'),
    67263: String(-3).replace('-','−'),
    67264: `${10*(4/2)} years`,
    67265: String((2+6)/2),
    67266: `${round((29*5.5+40*7.5+38*9.5)/(29+40+38),1)} years`,
    67269: String(choose(4,3)*choose(6,2)+choose(4,4)*choose(6,1)),
    67270: String(determinant([[2,-1,3],[4,1,2],[1,-3,1]])).replace('-','−'),
    67271: `${Math.round(360-Math.atan2(6,8)*180/Math.PI)}°`,
    67272: `${8-1}/8`,
    67273: `3y = 2x + ${3*3-2*2}`,
    67274: '(10/3)x^(2/3) − (8/3)x^(5/3)',
    67276: String(round(deviations.reduce((a,b)=>a+b)/5,2)),
    67277: `${Math.round((areaPrimitive(3)-areaPrimitive(-1))*3)}/3`,
    67278: String(Math.sqrt((102-2)/4)),
    67282: '(2x − y)(2x + y)(4x² + y²)',
    67283: `{${[1,3,5,8].join(',')}}`,
    67286: `${6.5+(53.5-29)/40*2} years`,
    67292: '[[0,1],[1/2,1/2]]',
    67301: String(-2*(-1)**3+6*(-1)**2+17*(-1)-21).replace('-','−'),
    67302: 'a*b = b*a',
    67309: '−2 ≤ x ≤ 3',
    67329: '5n − 2',
    67332: 'The two angle bisectors',
    67335: '3:4',
    67336: `${24+(24/Math.sqrt(3))*(1/Math.sqrt(3))} m`,
    67358: `${round((230/1.15-180)/(230/1.15)*100,0)}% loss`,
    67364: `${37.5*51.5} m² ≤ A < ${38.5*52.5} m²`,
    67365: String(135-81),
    67366: `${Math.round(Math.sqrt(90*50*30*10))} cm²`,
    67367: `₦${(15700*((1.08)**2-1)).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}`,
    67369: String(12/2*(2*0+11*3)),
    67372: `${round(.4/18.4*100,2)}%`,
    67377: String(13),
    67378: `${Array.from({length:6},(_,i)=>i+1).flatMap(a=>Array.from({length:6},(_,i)=>i+1).map(b=>a+b)).filter(isPrime).length/3}/12`,
    67380: `${20**2} cm², ${4*20} cm`,
    67381: `${round((13400-9200-1500)/(9200+1500)*100,2)}%`,
    67382: '7/40',
    67383: `${(68-16)/4} cm`,
    67384: '−1/3',
    67386: String((48-6*(-2))/3),
    67387: String(171000/(250+5*520)),
    67388: 'x = 2 or 4',
    67392: `${5*5*12/3}π cm³`,
    67394: `${25*2/5} cm and ${25*3/5} cm`,
    67396: `${3/(1/120+1/150)} km`,
    67397: '−2 + 2√2 m',
    67398: `${Math.round(6370*Math.cos(86*Math.PI/180)*8*3.142/180)} km`,
    67400: `${2*Math.sqrt(13**2-12**2)} cm`,
    67402: '80 VIP, 120 regular',
    67405: `${12*8*4/(4*16)} days`
  };
  assert.equal(Object.keys(answer).length, items.length);
  for (const item of items) assert.equal(item.options[item.answer], answer[item.sourceItem], item.sourceItem);
  // Checks that the symbolic answers above are mathematical identities rather than copied keys.
  for (const x of [-2, 0, 3]) for (const y of [-1, 1, 5])
    assert.equal((2*x-y)*(2*x+y)*(4*x*x+y*y), 16*x**4-y**4);
  assert.deepEqual([[0,1],[.5,.5]].map(row => [row[1]*2, row[0]-row[1]]), [[2,-1],[1,0]]);
  const x = 8, h = 1e-5, f = t => t**(2/3)*(2*t-t*t);
  assert.ok(Math.abs((f(x+h)-f(x-h))/(2*h)-((10/3)*x**(2/3)-(8/3)*x**(5/3))) < 1e-5);
});

test('ambiguous, incorrect-key, and figure-dependent candidates stay out of the published pool', () => {
  const held = read('ops/nigeria-exams/jamb-math-2023-held-20260924.json').held;
  assert.ok(held.length >= 20);
  for (const item of held) assert.ok(!pool.questions.some(q => q.id === 'mathematics-2023-myschool-' + item.sourceItem));
});
