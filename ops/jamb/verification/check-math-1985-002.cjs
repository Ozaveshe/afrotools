'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../../..');
const {questionFingerprint} = require(path.join(root, 'scripts/lib/jamb-content-trust'));
const {assertVisualAssetFiles} = require(path.join(root, 'scripts/lib/jamb-visual-assets'));
const pool = require(path.join(root, 'ops/jamb/source-pool.json')).questions;
const batch = require('./math-1985-publishable-002.json');
const checked = [];
const close = (a,b) => Math.abs(a-b) < 1e-9;
for (const record of batch.records) {
  const q = pool.find(q => q.id === record.id);
  assert.equal(questionFingerprint(q), record.content_sha256);
  const svg = fs.readFileSync(path.join(root, q.image.slice(1)), 'utf8');
  let values, result;
  if (q.num === 33) {
    // Coordinates encoded in the reviewed drawing: ten pixels per centimetre.
    assert.ok(svg.includes('M 50 210 L 130 60 L 330 210 Z'));
    assert.ok(svg.includes('M 130 60 L 130 210'));
    const height = (210-60)/10, hypotenuse = Math.hypot(330-130,210-60)/10;
    const leftBase = (130-50)/10;
    assert.equal(height,15); assert.equal(hypotenuse,25); assert.equal(leftBase,8);
    result = (leftBase + Math.sqrt(hypotenuse**2-height**2))*height/2;
    values = Object.fromEntries(Object.entries(q.options).map(([k,v]) => [k,parseFloat(v)]));
  } else if (q.num === 41) {
    // Opposite cube vertices differ by one edge length in all three axes.
    assert.ok(svg.includes('>H</text>') && svg.includes('>N</text>'));
    for (const a of [1,2,7]) {
      const distance = Math.hypot(a,a,a);
      assert.ok(close(distance,a*Math.sqrt(3)));
    }
    // Evaluate every printed distractor at a=2; identities must hold for any side.
    assert.deepEqual(q.options,{A:'3√a',B:'3a',C:'3a2',D:'a√2',E:'a√3'});
    const a=2; result=Math.hypot(a,a,a);
    values={A:3*Math.sqrt(a),B:3*a,C:3*a*a,D:a*Math.sqrt(2),E:a*Math.sqrt(3)};
  } else if (q.num === 47) {
    assert.deepEqual(q.options,{A:'3π',B:'9√3/4',C:'3(π − 3√3/4)',D:'3(√3 − π)/4',E:'π + 9√3/4'});
    const arc=svg.match(/M ([\d.]+) ([\d.]+) A 120 120 0 0 1 ([\d.]+) ([\d.]+) Z/);
    assert.ok(arc);
    const [x1,y1,x2,y2]=arc.slice(1).map(Number);
    const u=[x1-180,y1-180],v=[x2-180,y2-180];
    assert.ok(close(Math.hypot(...u),120)&&close(Math.hypot(...v),120));
    const angle=Math.acos((u[0]*v[0]+u[1]*v[1])/120**2);
    assert.ok(close(angle,2*Math.PI/3));
    const radius=120/40;
    result=radius**2*angle/2-radius**2*Math.sin(angle)/2;
    values={A:3*Math.PI,B:9*Math.sqrt(3)/4,C:3*(Math.PI-3*Math.sqrt(3)/4),D:3*(Math.sqrt(3)-Math.PI)/4,E:Math.PI+9*Math.sqrt(3)/4};
  } else throw new Error('Unexpected geometry question');
  assert.deepEqual(Object.keys(values).filter(k=>close(values[k],result)),[q.answer]);
  checked.push(q.id);
}
assert.equal(assertVisualAssetFiles(root,pool.filter(q=>checked.includes(q.id)),require(path.join(root,'data/jamb/review-ledger.json'))),3);
console.log(JSON.stringify({passed:true,count:checked.length,question_ids:checked}));
