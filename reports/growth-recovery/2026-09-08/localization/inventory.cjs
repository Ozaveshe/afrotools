'use strict';
// Read-only snapshot using the existing parity builders and page coverage policy.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'../../../..');
const fr=require(path.join(root,'scripts/build-french-free-app-parity-inventory')).buildReport();
const sw=require(path.join(root,'scripts/build-swahili-free-app-parity-inventory')).buildReport();
const normalize=require(path.join(root,'scripts/build-french-free-app-parity-inventory')).normalizeRoute;
const coverage=JSON.parse(fs.readFileSync(path.join(root,'data/registry/locale-page-coverage.json'),'utf8')).records;
const sandbox={window:{},CustomEvent:function(){},document:{readyState:'complete',getElementById:()=>null,createElement:()=>({textContent:''}),head:{appendChild:()=>{}},addEventListener:()=>{},dispatchEvent:()=>{},querySelector:()=>null}};
vm.runInNewContext(fs.readFileSync(path.join(root,'assets/js/components/tool-registry.js'),'utf8'),sandbox);
const count=(rows,key)=>rows.reduce((sum,row)=>{const value=row[key]||'unknown';sum[value]=(sum[value]||0)+1;return sum;},{});
const byRoute=new Map(coverage.map(row=>[normalize(row.route),row]));
const locales={};
for(const [locale,report,routeKey] of [['fr',fr,'primaryFrenchRoute'],['sw',sw,'primarySwahiliRoute']]) {
  const rows=report.rows.map(row=>({englishId:row.englishId,englishRoute:row.englishRoute,route:row[routeKey],candidateState:row.state,policyState:row[routeKey]?(byRoute.get(normalize(row[routeKey]))?.state||null):'missing-owner-evidence',recordedAccepted:row.accepted,verifiedThisWave:locale==='fr'&&row.englishId==='mobile-money-fees'?'focused-local-task-tests':'not-browser-verified-this-wave',humanReview:'pending-human-review'}));
  locales[locale]={existingInventoryTotals:report.totals,freeAppPolicyStates:count(rows,'policyState'),pagePolicyStates:count(coverage.filter(row=>row.locale===locale),'state'),rows};
}
for(const locale of ['ha','yo']) {
  const pages=coverage.filter(row=>row.locale===locale).map(page=>{
    const owner=path.join(root,page.ownerFile);
    const html=fs.existsSync(owner)?fs.readFileSync(owner,'utf8'):'';
    return {...page,englishHreflang:[...html.matchAll(/<link\b[^>]*hreflang=["']en["'][^>]*href=["']([^"']+)/gi)].map(match=>normalize(match[1])),registrySourceIds:sandbox.AFRO_TOOLS.filter(row=>row.lang===locale&&normalize(row.href)===normalize(page.route)).map(row=>row.sourceId)};
  });
  const rows=fr.rows.map(app=>{
    const candidates=[];
    for(const page of pages) {
      const evidence=[];
      if(page.equivalentRoute&&normalize(page.equivalentRoute)===app.englishRoute)evidence.push('coverage-equivalent-route');
      if(page.fallbackRoute&&normalize(page.fallbackRoute)===app.englishRoute)evidence.push('explicit-fallback-route');
      if(page.registrySourceIds.includes(app.englishId))evidence.push('registry-source-id');
      if(page.englishHreflang.includes(app.englishRoute))evidence.push('hreflang-en');
      if(evidence.length)candidates.push({route:page.route,state:page.state,sourceOwner:page.sourceOwner,evidence:[...new Set(evidence)],indexableEligible:page.indexableEligible});
    }
    candidates.sort((a,b)=>['native','localized-shell','english-fallback','unavailable','deprecated'].indexOf(a.state)-['native','localized-shell','english-fallback','unavailable','deprecated'].indexOf(b.state));
    return {englishId:app.englishId,englishRoute:app.englishRoute,route:candidates[0]?.route||null,policyState:candidates[0]?.state||'missing-owner-evidence',recordedAccepted:null,verifiedThisWave:'not-browser-verified-this-wave',humanReview:'pending-human-review',candidates};
  });
  locales[locale]={freeAppPolicyStates:count(rows,'policyState'),mappedOwnerRows:rows.filter(row=>row.route).length,unmappedOwnerRows:rows.filter(row=>!row.route).length,pagePolicyStates:count(pages,'state'),rows};
}
const snapshot={schemaVersion:1,baselineSha:'9b29eab0408eedd9442c98c2cabf567098da80ab',observedDate:'2026-09-08',denominator:fr.totals.englishFreeApps,method:'FR/SW use existing free-app inventory builders. HA/YO conservatively map page-policy equivalents, explicit fallback targets, registry sourceId and English hreflang. Missing-owner-evidence means no mapped owner was established, not proof that no physical translation exists. Page-policy counts include hubs/articles/utility pages and are separate from the free-app denominator. Native/shell labels and recorded acceptance do not prove current functional parity.',locales};
fs.writeFileSync(path.join(__dirname,'coverage.json'),JSON.stringify(snapshot,null,2)+'\n');
console.log(JSON.stringify(Object.fromEntries(Object.entries(locales).map(([locale,data])=>[locale,{freeAppPolicyStates:data.freeAppPolicyStates,mappedOwnerRows:data.mappedOwnerRows,unmappedOwnerRows:data.unmappedOwnerRows,pagePolicyStates:data.pagePolicyStates}])),null,2));
