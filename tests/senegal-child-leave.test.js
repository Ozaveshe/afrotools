const {test}=require('node:test'),assert=require('node:assert/strict'),engine=require('../assets/js/engines/senegal-child-leave.js');
const fixture={assessment:'2026-09-16',children:2,taken:3.5,mother:true,rule:true,service:true,age:true};
test('Senegal full annual base and separate one-day child allowance',()=>{
 const r=engine.calculate(fixture);assert.equal(r.baseDays,24);assert.equal(r.childDays,2);assert.equal(r.totalDays,26);assert.equal(r.remainingDays,22.5);
 assert.equal(engine.calculate({...fixture,mother:false}).totalDays,24);
 assert.equal(engine.calculate({...fixture,children:0,taken:0}).remainingDays,24);
 assert.equal(engine.calculate({...fixture,taken:27}).remainingDays,-1);
 for(const key of ['rule','age','service']){const pending=engine.calculate({...fixture,[key]:false});assert.equal(pending.confirmed,false);assert.equal(pending.totalDays,null);assert.equal(pending.childDays,null);}
});
test('Senegal malformed and negative inputs do not yield a result',()=>{
 for(const changes of [{assessment:'2026-02-30'},{assessment:''},{children:-1},{children:1.5},{children:''},{taken:-1},{taken:'NaN'},{taken:''}])assert.throws(()=>engine.calculate({...fixture,...changes}));
});
test('Senegal calendar spends confirmed balance without prorating child allowance',()=>{
 const request={start:'2026-09-18',days:3,schedule:'five',exclusions:'2026-09-21',confirmed:true};
 const r=engine.plan(fixture,request);assert.equal(r.schedule.lastLeaveDate,'2026-09-23');assert.equal(r.schedule.returnDate,'2026-09-24');assert.equal(r.remainingAfterRequest,19.5);
 for(const patch of [{days:0},{days:23},{days:1.5},{confirmed:false},{start:'2026-09-20'},{exclusions:'bad'}])assert.throws(()=>engine.plan(fixture,{...request,...patch}));
 assert.throws(()=>engine.plan({...fixture,rule:false},request));
});
