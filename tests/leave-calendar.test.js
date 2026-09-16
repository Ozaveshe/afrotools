const test = require('node:test');
const assert = require('node:assert/strict');
const {plan, calendar} = require('../assets/js/lib/leave-calendar');
test('calendar-day leave uses inclusive final day and exclusive calendar end', () => {
  assert.deepEqual(plan({start:'2028-02-28', days:3, unit:'calendar'}), {start:'2028-02-28', lastLeaveDate:'2028-03-01', endExclusive:'2028-03-02', returnDate:'2028-03-02', days:3, unit:'calendar'});
});
test('working-day leave counts selected weekdays and explicit holidays only', () => {
  const value = plan({start:'2026-09-18', days:3, unit:'working', excludedDates:['2026-09-21']});
  assert.equal(value.lastLeaveDate, '2026-09-23');
  assert.equal(value.returnDate, '2026-09-24');
  assert.equal(plan({start:'2026-09-18', days:1, unit:'working'}).returnDate, '2026-09-21');
});
test('invalid dates, zero duration and empty work weeks cannot create schedules', () => {
  for(const input of [{start:'2026-02-30',days:2,unit:'calendar'},{start:'2026-09-18',days:0,unit:'calendar'},{start:'2026-09-18',days:2,unit:'working',weekdays:[]}]) assert.throws(()=>plan(input));
});
test('calendar preserves exact dates, localized text, unique event identities and UTF-8 folds', () => {
  const value = calendar(plan({start:'2026-09-18',days:1,unit:'calendar'}), {uid:'synthetic-42', timestamp:'2026-09-16T12:00:00Z', title:'Congé, confirmé', returnTitle:'Reprise du travail', description:'Échéance; vérifiée\n'+ 'É'.repeat(100)});
  assert.equal((value.match(/BEGIN:VEVENT/g)||[]).length,2);
  assert.match(value,/DTEND;VALUE=DATE:20260919/);
  assert.match(value,/DTEND;VALUE=DATE:20260920/);
  assert.match(value,/DTSTAMP:20260916T120000Z/);
  assert.match(value,/SUMMARY:Congé\\, confirmé/);
  assert.match(value.replace(/\r\n /g,''),new RegExp('É'.repeat(100)));
  assert.ok(value.split('\r\n').every(line=>Buffer.byteLength(line,'utf8')<=75));
});
