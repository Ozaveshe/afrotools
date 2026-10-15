const test=require('node:test'),assert=require('node:assert/strict');
const engine=require('../engines/src/business-roi-engine.js');
const convert=(date,zone,occurrence)=>engine.timeZone({localDateTime:date,fromZone:zone,toZone:'Africa/Nairobi',locale:'en',occurrence});
test('ordinary Lagos preserves the requested instant',()=>assert.equal(convert('2026-07-29T10:00','Africa/Lagos').iso,'2026-07-29T09:00:00.000Z'));
for(const [zone,date] of [['Africa/Cairo','2026-04-24T00:30'],['Africa/Casablanca','2026-03-22T02:30']]) {
 test(zone+' rejects skipped wall time for every occurrence choice',()=>{for(const choice of [undefined,'earlier','later'])assert.throws(()=>convert(date,zone,choice),/nonexistent-local-time/);});
}
test('repeated Casablanca time requires an explicit occurrence',()=>assert.throws(()=>convert('2026-02-15T02:30','Africa/Casablanca'),/ambiguous-local-time/));
test('repeated Casablanca time can select either real instant',()=>{
 assert.equal(convert('2026-02-15T02:30','Africa/Casablanca','earlier').iso,'2026-02-15T01:30:00.000Z');
 assert.equal(convert('2026-02-15T02:30','Africa/Casablanca','later').iso,'2026-02-15T02:30:00.000Z');
});
test('invalid calendar and time components cannot normalize silently',()=>{for(const input of ['2026-02-30T10:00','2026-07-29T25:00','2026-07-29T10:60','2026-13-01T10:00','0000-01-01T10:00','2026-01-00T10:00'])assert.throws(()=>convert(input,'Africa/Lagos'),/invalid-date/);});
test('valid leap date succeeds',()=>assert.equal(convert('2028-02-29T10:30','Africa/Lagos').iso,'2028-02-29T09:30:00.000Z'));
test('invalid zone and occurrence are rejected',()=>{assert.throws(()=>convert('2026-01-01T10:00','Invalid/Zone'));assert.throws(()=>convert('2026-01-01T10:00','Africa/Lagos','invented'),/invalid-time-occurrence/);});
test('all eight offered zones round-trip ordinary wall time',()=>{
 for(const zone of ['Africa/Abidjan','Africa/Lagos','Africa/Johannesburg','Africa/Cairo','Africa/Nairobi','Africa/Casablanca','Indian/Mauritius','Africa/Windhoek']){
  const result=convert('2026-07-29T10:00',zone);
  const parts=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date(result.iso)).map(x=>[x.type,x.value]));
  assert.equal(`${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`,'2026-07-29T10:00');
 }
});
