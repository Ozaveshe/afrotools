const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const {reviewedArtwork,localizeBreadcrumbParents}=require('../scripts/lib/french-document-seo');
const config=require('../data/localization/fr-document-pdf-parity.json'),artwork=require('../data/localization/fr-document-pdf-artwork.json');
test('all32 reviewed document mappings resolve existing assets and missing files fall back',()=>{
 assert.equal(config.apps.length,32);
 for(const app of config.apps){const row=artwork.rows.find(r=>r.id===app.id);assert.ok(row);assert.equal(reviewedArtwork(path.resolve(__dirname,'..'),app.frenchRoute,config,artwork),row.asset);assert.equal(reviewedArtwork('.',app.frenchRoute,config,artwork,()=>false),null);}
 assert.equal(reviewedArtwork('.','/tools/invoice-generator/',config,artwork,()=>true),null);
});
test('only breadcrumb parent destinations change, including nested graph',()=>{
 const source={'@graph':[{'@type':'Organization',url:'https://afrotools.com/',logo:'https://afrotools.com/tools/'},{'@type':'BreadcrumbList',itemListElement:[{position:1,name:'Accueil',item:'https://afrotools.com/'},{position:2,name:'Outils',item:'https://afrotools.com/tools/'},{position:3,item:'https://afrotools.com/fr/tools/generateur-factures/'}]}]};
 const out=localizeBreadcrumbParents(source);assert.deepEqual(out['@graph'][0],source['@graph'][0]);assert.equal(out['@graph'][1].itemListElement[0].item,'https://afrotools.com/fr/');assert.equal(out['@graph'][1].itemListElement[1].item,'https://afrotools.com/fr/all-tools/');assert.deepEqual(out['@graph'][1].itemListElement[2],source['@graph'][1].itemListElement[2]);assert.deepEqual(localizeBreadcrumbParents(out),out);
});
test('final SEO boundary scopes physical JSON-LD repair and preserves unrelated schema bytes',()=>{
 const {repairDocumentBreadcrumbs}=require('../scripts/lib/french-document-seo');
 const org='<script type="application/ld+json">{ "@type":"Organization", "url":"https://afrotools.com/" }</script>';
 const crumb='<script type="application/ld+json">{"@type":"BreadcrumbList","itemListElement":[{"item":"https://afrotools.com/"},{"item":"https://afrotools.com/tools/"}]}</script>';
 for(const app of config.apps){const repaired=repairDocumentBreadcrumbs(org+crumb,app.frenchRoute,config);assert.ok(repaired.startsWith(org));assert.ok(repaired.includes('https://afrotools.com/fr/all-tools/'));assert.equal(repairDocumentBreadcrumbs(repaired,app.frenchRoute,config),repaired);}
 assert.equal(repairDocumentBreadcrumbs(org+crumb,'/fr/other/',config),org+crumb);
});
