const test = require('node:test');
const assert = require('node:assert/strict');
const {validateStudyPlanRequest,parseStudyPlanResponse} = require('../netlify/functions/_shared/jamb-study-plan');

const input = {days:2,hours_per_day:1,start_date:'2028-02-28'};
const fixture = () => ({summary:'A synthetic revision schedule',days:[
  {day:1,date:'2028-02-28',focus:'Mathematics',tasks:[{time:'30 min',task:'Review checked algebra notes'},{time:'30 min',task:'Practise textbook exercises'}]},
  {day:2,date:'2028-02-29',focus:'English',tasks:[{time:'60 min',task:'Review comprehension notes'}]}
]});

test('valid plan preserves sequential leap dates and exact daily budget',() => {
  assert.deepEqual(validateStudyPlanRequest(input),input);
  assert.deepEqual(parseStudyPlanResponse(JSON.stringify(fixture()),input),fixture());
});
test('request rejects invalid types, bounds, dates and overflowing final date',() => {
  for(const bad of [null,[],{...input,days:'2'},{...input,days:0},{...input,days:8},{...input,days:1.5},{...input,hours_per_day:'1'},{...input,hours_per_day:0},{...input,hours_per_day:13},{...input,start_date:20280228},{...input,start_date:'2027-02-29'},{...input,start_date:'2028-02-30'},{...input,start_date:'2028-2-28'},{...input,start_date:'2028-13-01'},{...input,start_date:'9999-12-31'}]) assert.throws(()=>validateStudyPlanRequest(bad));
  assert.doesNotThrow(()=>validateStudyPlanRequest({...input,days:7,hours_per_day:12}));
});
test('response rejects prose suffixes, code fences and oversized UTF-8 payloads',() => {
  const raw=JSON.stringify(fixture());
  for(const text of [null,raw+'\nEducation notice','```json\n'+raw+'\n```',' '.repeat(35001),JSON.stringify({summary:'é'.repeat(18000)})]) assert.throws(()=>parseStudyPlanResponse(text,input));
});
test('response rejects malformed schemas, nonsequential and impossible dates',() => {
  for(const mutate of [p=>p.days.pop(),p=>p.days[0].day='1',p=>p.days[1].day=1,p=>p.days[1].date='2028-03-01',p=>p.days[1].date='2028-02-30',p=>p.days[0].tasks=[],p=>p.days[0].tasks=Array(7).fill({time:'1 min',task:'Read notes'}),p=>p.summary=' ',p=>p.days[0].focus='x'.repeat(121),p=>p.days[0].tasks[0].task='x'.repeat(601)]) {
    const plan=fixture();mutate(plan);assert.throws(()=>parseStudyPlanResponse(JSON.stringify(plan),input));
  }
});
test('response rejects HTML across all text fields and invalid minute budgets',() => {
  for(const mutate of [p=>p.summary='<img src=x onerror=alert(1)>',p=>p.days[0].focus='<svg/onload=alert(1)>',p=>p.days[0].tasks[0].task='<script>alert(1)</script>',p=>p.days[0].tasks[0].time='0 min',p=>p.days[0].tasks[0].time='01 min',p=>p.days[0].tasks[0].time='30.5 min',p=>p.days[0].tasks[0].time=30,p=>p.days[0].tasks[0].time='31 min']) {
    const plan=fixture();mutate(plan);assert.throws(()=>parseStudyPlanResponse(JSON.stringify(plan),input));
  }
});
test('valid response strips unrendered extra fields and spans calendar years',() => {
  const limits={days:2,hours_per_day:12,start_date:'2027-12-31'};
  const plan=fixture();plan.days[0].date='2027-12-31';plan.days[1].date='2028-01-01';plan.provider_note='<img src=x>';plan.days[0].tasks[0].extra='<script>';
  const result=parseStudyPlanResponse(JSON.stringify(plan),limits);
  assert.equal(result.days[1].date,'2028-01-01');assert.equal(result.provider_note,undefined);assert.equal(result.days[0].tasks[0].extra,undefined);
});
