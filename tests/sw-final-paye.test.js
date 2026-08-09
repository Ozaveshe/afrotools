const assert = require('assert');
const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');
const engine = require('../engines/src/sw-final-paye-engine.js');

const ROOT = path.resolve(__dirname, '..');
const BASE = '2f5fb8988ddd40e28eb17123fe653b18ff0801c3';
const rows = [
  ['ng-paye','sw/nigeria/kikokotoo-kodi-mshahara/index.html','/nigeria/ng-salary-tax',['regime','pension','nhf','nhis','annualRent','lifeAssurance','mortgageInterest']],
  ['za-paye','sw/south-africa/kikokotoo-kodi-mshahara/index.html','/south-africa/za-paye',['ageGroup','retirement','medMembers','uif']],
  ['ma-paye','sw/morocco/kikokotoo-kodi-mshahara/index.html','/morocco/ma-paye',['cnss','amo']],
  ['dz-paye','sw/algeria/kikokotoo-kodi-mshahara/index.html','/algeria/dz-paye',['includeContribution']],
  ['tn-paye','sw/tunisia/kikokotoo-kodi-mshahara/index.html','/tunisia/tn-paye',['cnss']],
  ['ly-paye','sw/libya/kikokotoo-kodi-mshahara/index.html','/libya/ly-paye',['includeContribution']],
  ['sd-paye','sw/sudan/kikokotoo-kodi-mshahara/index.html','/sudan/sd-paye',['includeContribution']],
  ['mz-paye','sw/mozambique/kikokotoo-kodi-mshahara/index.html','/mozambique/mz-paye',['includeContribution']],
  ['na-paye','sw/namibia/kikokotoo-kodi-mshahara/index.html','/namibia/na-paye',['includeContribution']],
  ['mg-paye','sw/madagascar/kikokotoo-kodi-mshahara/index.html','/madagascar/mg-paye',['cnaps','dependents']],
  ['cd-paye','sw/dr-congo/kikokotoo-kodi-mshahara/index.html','/dr-congo/cd-paye',['includeContribution']],
  ['cg-paye','sw/congo/kikokotoo-kodi-mshahara/index.html','/congo/cg-paye',['includeContribution']],
  ['sl-paye','sw/sierra-leone/kikokotoo-kodi-mshahara/index.html','/sierra-leone/sl-paye',['nassit','secondary']],
];

function metrics(html) {
  const visible = html.replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&\w+;/g,' ');
  return {
    words:(visible.match(/[\p{L}\p{N}]+/gu)||[]).length,
    h2:(html.match(/<h2\b/gi)||[]).length,
    controls:(html.match(/<(?:input|select|textarea)\b/gi)||[]).length,
    actions:(html.match(/<button\b/gi)||[]).length,
    links:(html.match(/<a\b/gi)||[]).length,
    schema:(html.match(/application\/ld\+json/gi)||[]).length,
  };
}

const metricReceipt=[];
for (const [id,file,englishRoute,profileControls] of rows) {
  const html=fs.readFileSync(path.join(ROOT,file),'utf8');
  const baseline=childProcess.execFileSync('git',['show',`${BASE}:${file}`],{cwd:ROOT,encoding:'utf8'});
  const before=metrics(baseline),after=metrics(html);metricReceipt.push({id,before,after});
  assert.match(html,/<html\b[^>]*\blang="sw"/i,`${id}: Swahili owner`);
  assert.ok(html.includes(`data-tool-id="${id}"`)&&html.includes('data-sw-paye-app="paye"'),`${id}: exact source-owned PAYE identity`);
  for(const name of ['inputPeriod','gross','desiredNet','aiConsent',...profileControls])assert.ok(html.includes(`name="${name}"`),`${id}: control ${name}`);
  for(const action of ['data-reset','data-net-to-gross','data-copy','data-save','data-load','data-print','data-explain','data-ai'])assert.ok(html.includes(action),`${id}: action ${action}`);
  assert.strictEqual((html.match(/data-preset=/g)||[]).length,5,`${id}: five salary presets`);
  assert.ok(html.includes('data-breakdown')&&html.includes('data-chart'),`${id}: result breakdown and chart`);
  for(const format of ['json','csv','txt','pdf'])assert.ok(html.includes(`data-export="${format}"`),`${id}: export ${format}`);
  assert.doesNotMatch(html,/form-name="pdf-leads"|name="pdfEmail"|data-explicit-language-fallback/i,`${id}: no email gate or fallback`);
  assert.ok(html.includes('/engines/sw-final-paye-engine.js')&&html.includes('/assets/js/pages/sw-final-paye.js'),`${id}: maintained engine/controller`);
  assert.match(html,/data-source-status="(?:stale|reviewed)"/,`${id}: visible freshness state`);
  assert.strictEqual(after.schema,before.schema,`${id}: schema count preserved`);
  assert.ok(after.h2>=before.h2,`${id}: H2 depth preserved`);
  assert.ok(after.words>=Math.floor(before.words*.80),`${id}: at least 80% localized visible words preserved`);
  assert.ok(after.links>=before.links,`${id}: internal/source link depth preserved`);
  assert.ok(after.actions>=13,`${id}: complete action surface`);
  const enPath=englishRoute.replace(/^\//,'').replace(/\/$/,'');const direct=path.join(ROOT,`${enPath}.html`);const owner=fs.existsSync(direct)?direct:path.join(ROOT,enPath,'index.html');const english=fs.readFileSync(owner,'utf8');const canonical=html.match(/<link rel="canonical" href="([^"]+)"/i)[1];assert.ok(english.includes(`hreflang="sw" href="${canonical}"`),`${id}: reciprocal English hreflang`);
}

const controller=fs.readFileSync(path.join(ROOT,'assets/js/pages/sw-final-paye.js'),'utf8');
assert.match(controller,/aiConsent[\s\S]*consent\.checked[\s\S]*fetch\('\/.netlify\/functions\/ai-advisor'/, 'AI transport is behind explicit consent');
assert.match(controller,/maelezo ya ndani bila mtandao/i, 'local explanation fallback is present');

const fixtures=JSON.parse(fs.readFileSync(path.join(ROOT,'tests/fixtures/sw-final-paye-english-parity.json'),'utf8'));
assert.strictEqual(fixtures.frozenEnglishBase,BASE);
for(const fixture of fixtures.cases){const actual=engine.calculatePaye(fixture.id,fixture.input);for(const [field,expected] of Object.entries(fixture.expected))assert.ok(Math.abs(Number(actual[field]||0)-expected)<0.001,`${fixture.id} ${field}: expected ${expected}, got ${actual[field]}`);}
assert.strictEqual(new Set(fixtures.cases.map(row=>row.id)).size,13,'all 13 PAYE profiles covered');
for(const [id,profile] of Object.entries(engine.PAYE_PROFILES)){assert.match(profile.source,/^https:\/\//,`${id}: authority URL`);assert.match(profile.reviewed,/^\d{4}-\d{2}-\d{2}$/,`${id}: review date`);assert.throws(()=>engine.calculatePaye(id,{gross:0}),RangeError,`${id}: invalid fails closed`);}

const tunisia=fs.readFileSync(path.join(ROOT,'sw/tunisia/kikokotoo-kodi-mshahara/index.html'),'utf8');
assert.ok(tunisia.includes('https://www.finances.gov.tn/fr/apercu-general-sur-la-fiscalite'));
assert.ok(tunisia.includes('10% ya mshahara, hadi TND 2,000'));
assert.doesNotMatch(tunisia,/TND 1,200|30,001[^<]*50,000[\s\S]{0,180}>34%|5,001[^<]*10,000|10,001[^<]*20,000/i,'Tunisia contradictory visible bands removed');

console.log(JSON.stringify({accepted:13,fixtures:fixtures.cases.length,metrics:metricReceipt},null,2));
