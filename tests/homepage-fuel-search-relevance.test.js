const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=process.env.HOMEPAGE_RELEVANCE_ROOT||path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const registry=fs.readFileSync(path.join(root,'assets/js/components/tool-registry.js'),'utf8');
const source=html.slice(html.indexOf('    var CATEGORY_LABELS ='),html.indexOf('    var aiHeroPromptAnalytics ='));
const ctx={window:{},aiHomeLocale:()=> 'en'};vm.runInNewContext(registry,ctx);vm.runInNewContext(source,ctx);
function ranked(q){return Array.from(ctx.homepageSearchTools()).map(t=>({id:t.id,href:t.href,score:ctx.score(t,ctx.tokenise(q)),status:t.status})).filter(r=>r.score>0).sort((a,b)=>b.score-a.score||(['live','new'].includes(b.status)?1:0)-(['live','new'].includes(a.status)?1:0));}
for(const query of ['fuel prices Nigeria','petrol prices Nigeria','diesel prices Kenya','fuel prices Ghana','fuel prices South Africa','fuel prices Mauritius','fuel prices Cape Verde']){
 test(query+' finds the global finder without tax or generator substitutions',()=>{const rows=ranked(query);assert.equal(rows[0]?.id,'fuel-tracker');assert.equal(rows[0].href,'/tools/fuel-tracker/');assert.equal(rows.some(r=>/paye|generator/.test(r.id)),false);});
}
for(const [q,id] of [['salary Nigeria','ng-paye'],['PAYE Kenya','ke-paye'],['generator fuel Nigeria','generator-fuel-african'],['generator cost Ghana','generator-fuel-african'],['solar generator comparison','generator-fuel-african'],['solar sizing','solar-sizing'],['solar ROI','solar-roi'],['fuel cost','fuel-cost'],['fleet fuel budget','fleet-fuel'],['fuel tracker','fuel-tracker']]){
 test(q+' preserves its intended leading tool',()=>assert.equal(ranked(q)[0]?.id,id));
}
test('country names are geography, not invented registry market coverage',()=>{
 const countries=JSON.parse(fs.readFileSync(path.join(root,'data/registry/countries.json'),'utf8'));
 assert.deepEqual(Array.from(ctx.FUEL_FINDER_COUNTRY_NAMES),countries.map(c=>c.displayNames.en));
 const finder=ctx.AFRO_TOOLS.find(t=>t.id==='fuel-tracker');assert.equal(finder.countries.includes('MU'),false);
 assert.ok(ctx.score(finder,ctx.tokenise('fuel prices Nigeria'))>ctx.score(finder,ctx.tokenise('fuel prices Mauritius')),'existing country metadata is a relevance boost');
});
test('unknown location and unrelated terms are not silently ignored',()=>{
 const finder=ctx.AFRO_TOOLS.find(t=>t.id==='fuel-tracker');
 for(const q of ['fuel prices Atlantis','fuel prices purple','salary Mauritius','generator Atlantis'])assert.equal(ctx.score(finder,ctx.tokenise(q)),0,q);
});
test('non-finder fuel tools do not receive price-finder aliases',()=>{
 const generator=ctx.AFRO_TOOLS.find(t=>t.id==='generator-fuel-african');assert.equal(ctx.score(generator,ctx.tokenise('fuel prices Ghana')),0);assert.ok(ctx.score(generator,ctx.tokenise('generator fuel Ghana'))>0);
});
test('locale filtering and href deduplication remain in actual search',()=>{
 const tools=Array.from(ctx.homepageSearchTools());assert.ok(tools.length>100);assert.equal(tools.some(t=>/^\/(fr|sw|ha|yo)\//.test(t.href)),false);const hrefs=tools.map(t=>ctx.normalizeSearchHref(t.href));assert.equal(new Set(hrefs).size,hrefs.length);
});
