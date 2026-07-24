'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const engine = require('../assets/js/engines/salary-evidence-notebook.js');
const now = '2026-07-22T12:00:00Z';

function row(amount, overrides) {
  return Object.assign({ country:'KE', city:'Nairobi', role:'Software engineering', experience:'Mid-level', currency:'KES', basis:'gross', period:'annual', amount, source:'Survey table', observedDate:'2026-07-20' }, overrides || {});
}

assert.equal(engine.normalize(row(1200000), now).annualAmount, 1200000);
assert.equal(engine.normalize(row(100000, { period:'monthly' }), now).annualAmount, 1200000);
assert.equal(engine.normalize(row(-1), now).ok, false);
assert.equal(engine.normalize(row(1, { observedDate:'2026-07-23' }), now).error, 'invalid_date');
assert.equal(engine.percentile([10,20,30,40,50], .25), 15);
assert.equal(engine.percentile([10,20,30,40,50], .5), 30);
assert.equal(engine.percentile([10,20,30,40,50], .75), 45);

const result = engine.analyze([10,20,30,40,50].map(value => row(value)), { now, horizonDays:365 });
assert.equal(result.ok, true);
assert.deepEqual([result.q1,result.median,result.q3],[15,30,45]);
assert.equal(result.count, 5);
assert.equal(result.staleCount, 0);
assert.equal(engine.analyze([10,20,30,40].map(value => row(value)), { now, horizonDays:365 }).error, 'insufficient_fresh');
assert.equal(engine.analyze([10,20,30,40,50].map((value,index) => row(value,index===4?{currency:'USD'}:{})), { now, horizonDays:365 }).error, 'incomparable');
assert.equal(engine.analyze([10,20,30,40,50].map((value,index) => row(value,index===4?{observedDate:'2025-01-01'}:{})), { now, horizonDays:365 }).error, 'insufficient_fresh');

['tools/salary-intelligence/index.html','fr/jobs/salary-benchmarks/index.html'].forEach(route => {
  const html=fs.readFileSync(path.join(__dirname,'..',route),'utf8');
  assert.ok(html.includes('data-salary-evidence-app'));
  assert.ok(html.includes('salary-evidence-notebook.js'));
  assert.ok(html.includes('www.itl.nist.gov'));
  assert.ok(html.includes('ilostat.ilo.org'));
  assert.ok(!/MarketDataApp|api\/salary-intelligence|afropoints-submit|proof[_ -]?url|verified crowd|recruiter|benchmark medians/i.test(html));
});
const controller=fs.readFileSync(path.join(__dirname,'..','assets/js/pages/salary-intelligence-vip.js'),'utf8');
assert.ok(!/fetch\s*\(|XMLHttpRequest|localStorage|sessionStorage/.test(controller));
assert.ok(controller.includes('salary-evidence.csv'));
assert.ok(controller.includes('salary-evidence.json'));
assert.ok(controller.includes('window.AfroTools.pdf.generate'));
console.log('salary-evidence-notebook: 23 assertions passed');
