'use strict';
const assert=require('assert');
const fs=require('fs');
const path=require('path');
const routeEntry=require('../assets/js/pages/sw-ai-route-entry');
const routeMap=require('../assets/js/ai/swahili-route-map.generated');
const {assertLifecycle}=require('./support/swahili-acceptance-lifecycle');
const ROOT=path.resolve(__dirname,'..');
const apps=[
  ['loan-shark-compare','sw/zana/mkopeshaji-hatari-dhidi-ya-benki/index.html','/sw/zana/mkopeshaji-hatari-dhidi-ya-benki/','/tools/loan-shark-compare/','/fr/tools/pret-usurier-vs-banque/','loan-shark-compare.js'],
  ['microfinance-loan','sw/zana/kikokotoo-mkopo-wa-microfinance/index.html','/sw/zana/kikokotoo-mkopo-wa-microfinance/','/tools/microfinance-loan/','/fr/tools/pret-microfinance/','microfinance-loan.js'],
  ['digital-lending','sw/zana/mikopo-ya-kidijitali/index.html','/sw/zana/mikopo-ya-kidijitali/','/tools/digital-lending/','/fr/tools/taux-credit-digital/','digital-lending.js'],
  ['bnpl-calc','sw/zana/lipa-sasa-au-baadaye/index.html','/sw/zana/lipa-sasa-au-baadaye/','/tools/bnpl-calc/','/fr/tools/cout-bnpl/','bnpl-calc.js']
];
const inventory=JSON.parse(fs.readFileSync(path.join(ROOT,'reports/swahili-free-app-parity-inventory.json'),'utf8'));
const acceptance=JSON.parse(fs.readFileSync(path.join(ROOT,'data/audits/swahili-free-app-acceptance.json'),'utf8'));
const acceptedIds=new Set((acceptance.entries||[]).filter((row)=>row.status==='accepted').map((row)=>row.englishId));
const scope=new Set(['small-business','fintech','transport','trade']);
const rows=inventory.rows.filter((row)=>scope.has(row.categoryKey));
assert.strictEqual(rows.length,99);
assert.strictEqual(rows.filter((row)=>acceptedIds.has(row.englishId)).length+rows.filter((row)=>!acceptedIds.has(row.englishId)).length,99);
assertLifecycle({inventory,acceptance,routeEntry,routeMap,apps:apps.map(([id,,sw])=>({id,swahiliRoute:sw}))});
for(const [id,file,sw,en,fr,controller] of apps){
  const html=fs.readFileSync(path.join(ROOT,file),'utf8');
  assert.ok(html.includes('lang="sw"'),id);
  assert.ok(html.includes('content="scripts/build-sw-fintech-credit-family.js"'),id);
  assert.ok(html.includes(`href="https://afrotools.com${sw}"`),`${id}: canonical`);
  assert.ok(html.includes(`/assets/img/tools/${id}.webp`),`${id}: artwork`);
  assert.ok(html.includes(`fintech-shared-controllers/${controller}`),`${id}: controller`);
  assert.ok(html.includes(`href="/sw/ai/?tool=${id}"`),`${id}: candidate AI`);
  assert.ok(html.includes('Udhamini au ushirika wa kibiashara haubadilishi fomula'),`${id}: sponsor independence`);
  assert.ok(html.includes('Hakuna jina, kiasi, mtoa huduma au taarifa ya mkopo inayotumwa'),`${id}: local privacy`);
  assert.ok(!/<script[^>]*>[\s\S]*function\s+(?:calc|calculate)/i.test(html),`${id}: generic inline calculator`);
  assert.ok(!/download\s*=|data-export=|pdf-download-gate/i.test(html),`${id}: unproved export advertising`);
  for(const paired of [en,fr]){
    const pairedHtml=fs.readFileSync(path.join(ROOT,paired.replace(/^\//,''),'index.html'),'utf8');
    assert.ok(pairedHtml.includes(`hreflang="sw" href="https://afrotools.com${sw}"`),`${id}: reciprocal ${paired}`);
  }
}
process.stdout.write('Swahili Fintech credit family: immutable 99-row scope and 4/4 lifecycle-aware route contracts passed\n');
