const test = require('node:test');
const assert = require('node:assert/strict');
const engine = require('../engines/src/whatsapp-bot-engine');
test('salary parsing preserves magnitude and excludes overtime hours',()=>{
 for(const [text,expected] of [['PAYE Nigeria 300000',300000],['PAYE Nigeria ₦300,000',300000],['PAYE Kenya KSh120000',120000],['PAYE Ghana 2.5 million',2500000],['PENSION Ghana 25k',25000],['OT Nigeria 4 hours',null],['OT Nigeria 4 hours 200000',200000],['PAYE Nigeria -300000',null],['PAYE Nigeria 1,2',null],['PAYE Nigeria 0',null],['PAYE Nigeria 1e6',null]])assert.equal(engine.parseSalary(text),expected,text);
 assert.equal(engine.parseSalary('PAYE Nigeria '+'9'.repeat(400)),null);
});
test('overtime hours reject negative and missing values without changing day category',()=>{
 assert.deepEqual(engine.parseOvertimeParams('OT Kenya 120000 4.5 hours public holiday'),{hours:4.5,dayType:'public_holiday'});
 for(const text of ['OT Nigeria 120000 -4 hours','OT Nigeria 120000 0 hours','OT Nigeria 120000'])assert.equal(engine.parseOvertimeParams(text).hours,null);
 assert.equal(engine.parseOvertimeParams('OT Nigeria 120000 4 hrs sunday').dayType,'weekend');
});
test('help describes coverage and per-question consent without unsupported promises',()=>{
 const text=engine.buildHelpMessage();assert(text.includes('Country recognition does not guarantee'));assert(text.includes('AI CONSENT:'));assert(!/#1|free for everyone, forever|cover all/.test(text));
});
