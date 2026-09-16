const test=require('node:test'),assert=require('node:assert/strict'),engine=require('../assets/js/engines/ci-birth-leave.js');
const base={birth:'2026-09-18',start:'2026-09-18',months:6,used:8,schedule:'six',family:true,authorization:'prior',confirmed:true};
test('conditional two-day birth permission respects service, annual cap and confirmations',()=>{
 const result=engine.calculate(base);assert.equal(result.eligible,true);assert.equal(result.schedule.lastLeaveDate,'2026-09-19');assert.equal(result.schedule.returnDate,'2026-09-21');
 for(const patch of [{months:5},{used:9},{family:false},{authorization:'unknown'},{confirmed:false}])assert.equal(engine.calculate({...base,...patch}).schedule,null);
 for(const patch of [{months:-1},{used:11},{months:'bad'},{birth:'2026-02-30'},{start:'2026-09-17'},{schedule:'bad'}])assert.throws(()=>engine.calculate({...base,...patch}));
});
test('five-day counting, explicit holidays and evidence deadline remain distinct',()=>{
 let result=engine.calculate({...base,schedule:'five',exclusions:'2026-09-21'});assert.equal(result.schedule.lastLeaveDate,'2026-09-22');assert.equal(result.schedule.endExclusive,'2026-09-23');assert.equal(result.schedule.returnDate,'2026-09-23');
 assert.equal(engine.calculate({...base,authorization:'force',force:true,proof:'2026-10-03'}).eligible,true);
 assert.equal(engine.calculate({...base,authorization:'force',force:true,proof:'2026-10-04'}).eligible,false);
 assert.equal(engine.calculate({...base,start:'2026-09-20'}).eligible,false);
});
