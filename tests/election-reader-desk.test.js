
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const html = fs.readFileSync('tools/africa-election-tracker/index.html','utf8');
const ledger = require('../data/government/africa-election-tracker.json');
const news = require('../data/government/election-news.json');
function between(start,end) { return html.slice(html.indexOf(start),html.indexOf(end,html.indexOf(start))); }
const context = {URL,Date,Intl,Set,Number,Math};
vm.createContext(context);
vm.runInContext('const MS_PER_DAY=86400000; function todayUtc(){return Date.UTC(2026,9,1);}' +
  between('  function dateUtc(value)','  function formatDate(value)') +
  between('  function formatDate(value)','  function monthDay(value)') +
  between('  function sourceReview(record','  function initializeReaderDesk(data)'),context);
function survey() { return {id:'synthetic-fixture-not-real',reviewStatus:'source-reviewed',electionId:ledger.elections[0].id,
  measure:'approval',samplingType:'probability',sourceType:'pollster',pollster:'Synthetic test pollster',sponsor:'Synthetic sponsor',
  population:'Synthetic test population',method:'Synthetic telephone fixture',question:'Synthetic question',limitations:'Synthetic fixture only',
  weighting:'Synthetic published weighting',sampleSize:1000,fieldworkStart:'2026-09-01',fieldworkEnd:'2026-09-03',
  publishedOn:'2026-09-05',reviewedOn:'2026-09-06',sourceUrl:'https://example.org/synthetic',sourceLabel:'Synthetic report',
  marginOfError:3,includesAllResponseOptions:true,results:[{label:'Approve',percent:45},{label:'Disapprove',percent:40},{label:'Undecided',percent:15}]}; }
const admit=(value)=>context.verifiedSurveys({schemaVersion:1,surveys:[value]},ledger.elections).length;
test('survey observations require full original-source methodology and review',()=>{
  assert.equal(admit(survey()),1);
  for (const field of ['pollster','sponsor','population','method','question','limitations','weighting','sourceLabel']) {
    assert.equal(admit({...survey(),[field]:''}),0,field);
  }
  for (const patch of [{sourceUrl:'javascript:alert(1)'},{sourceUrl:'https://user:pass@example.org/'},
    {sampleSize:0},{sampleSize:1.5},{reviewStatus:'unreviewed'},{electionId:'unknown'},
    {fieldworkStart:'2026-02-30'},{fieldworkEnd:'2026-10-02'},
    {fieldworkStart:'2026-09-04'},{publishedOn:'2026-09-02'},{reviewedOn:'2026-09-04'},
    {samplingType:'self-selected',marginOfError:3},{sourceType:'reader-survey'},
    {results:[{label:'x',percent:101}]},{results:[{label:'x',percent:'45'}]},
    {results:[{label:'x',percent:45}]}]) assert.equal(admit({...survey(),...patch}),0,JSON.stringify(patch));
  assert.equal(admit({...survey(),sourceType:'reader-survey',samplingType:'self-selected',marginOfError:null}),1);
});
test('freshly generated ledger cannot disguise old source checks',()=>{
  const result=context.sourceReview({sources:[{checkedAt:'2026-09-30'},{checkedAt:'2026-08-01'}]},7);
  assert.equal(result.overdue,true);
  assert.equal(result.latest,'2026-09-30');
  assert.equal(context.sourceReview({sources:[]},7).overdue,true);
  assert.equal(context.sourceReview({sources:[{checkedAt:'2026-10-02'}]},7).overdue,true);
});
test('reviewed brief stream excludes unknown records, future articles and unsafe links',()=>{
  const article=structuredClone(news.articles[0]);
  article.electionId=ledger.elections[0].id;
  for(const field of ['publishedOn','reviewedOn','updatedOn']) article.localizations.en[field]='2026-09-27';
  article.officialSources.forEach(source=>{source.checkedOn='2026-09-27';});
  assert.equal(context.approvedBriefs({articles:[article]},ledger.elections).length,1);
  article.officialSources[0].url='javascript:alert(1)';
  assert.equal(context.approvedBriefs({articles:[article]},ledger.elections).length,0);
});
test('page inline JavaScript compiles and official snapshots retain generator contracts',()=>{
  for (const match of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)) {
    if (match[0].includes('application/ld+json')) continue;
    new vm.Script(match[1]);
  }
  const generator=require('../scripts/generate-election-calendar-snapshot');
  assert.ok(html.includes(generator.renderCountryIndex(ledger).split('\n').map(line=>'        '+line).join('\n')));
  for (const record of ledger.elections) assert.ok(fs.existsSync('assets/img/flags/afroatlas/'+record.countryCode.toLowerCase()+'.svg'));
  const surveyData=require('../data/government/election-surveys.json');
  assert.equal(surveyData.schemaVersion,1);
  assert.ok(Array.isArray(surveyData.surveys));
});
