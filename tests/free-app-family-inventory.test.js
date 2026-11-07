'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {validateInventory}=require('../scripts/lib/free-app-family-inventory');
// All data below is declared synthetic. These controls exercise identity and
// accounting rules, never the functioning of an AfroTools app or live service.
const sha=(algorithm,bytes)=>crypto.createHash(algorithm).update(bytes).digest('hex');
function pin(path,bytes){return{path,bytes:bytes.length,sha256:sha('sha256',bytes),gitBlob:sha('sha1',Buffer.concat([Buffer.from('blob '+bytes.length+'\0'),bytes]))}}
function fixture(){
 const files={
  'assets/js/components/tool-registry.js':Buffer.from('// synthetic raw catalogue declaration only\n'),
  'tools/alpha/index.html':Buffer.from('<h1>Create a local document</h1><button>Download result</button>'),
  'tools/beta/index.html':Buffer.from('<h1>Convert a local image</h1><button>Download image</button>'),
  'assets/js/shared-helper.js':Buffer.from('function sharedHelper() { return 1; }'),
  'pro/index.html':Buffer.from('<h1>Paid product landing</h1>')
 };
 const row=(id,route,locale='en',availability='free')=>({id,route,canonicalRoute:route,localeCoverage:[locale],availability,publicationStatus:'published',deprecated:false,applicability:{countryIds:[]},source:{sourceId:null,compatibilityTargetId:null},redirectTarget:null});
 const registry={tools:[row('alpha','/tools/alpha/'),row('alpha-fr','/fr/tools/alpha/','fr'),row('beta','/tools/beta/','en','free-and-pro'),{...row('old-alpha','/tools/old-alpha/'),canonicalRoute:'/tools/alpha/',publicationStatus:'redirect',deprecated:true,redirectTarget:{toolId:'alpha',route:'/tools/alpha/'}},{...row('compat-alpha','/tools/compat-alpha/'),canonicalRoute:'/tools/alpha/',publicationStatus:'unpublished',deprecated:true,source:{compatibilityTargetId:'alpha'},redirectTarget:{toolId:'alpha',route:'/tools/alpha/'}},row('afrotools-pro','/pro/','en','free-and-pro')],proApps:[{id:'paid-one',route:'/pro/apps/paid-one/'},{id:'paid-two',route:'/pro/apps/paid-two/'}]};
 registry.tools[1].source.sourceId='alpha';
 files['data/registry/canonical-registry.json']=Buffer.from(JSON.stringify(registry));
 const evidence=(path,literal,kind='page-owner')=>({pin:pin(path,files[path]),kind,literal,scope:'Synthetic fixture source declaration, not behavior proof.'});
 const ev=evidence('tools/alpha/index.html','Create a local document');
 const requirements=['happy','error','export','recovery','accessibility','privacy'].map(kind=>({kind,description:'Independently exercise '+kind+' obligations.',state:'unknown',notes:[]}));
 const inventory={schemaVersion:1,coverage:'partial',acceptancePolicy:'requirements-only-no-functional-verdict',snapshot:{commit:'a'.repeat(40),tree:'b'.repeat(40),registry:pin('data/registry/canonical-registry.json',files['data/registry/canonical-registry.json']),rawRegistry:pin('assets/js/components/tool-registry.js',files['assets/js/components/tool-registry.js']),expectedCounts:{raw:6,eligible:3,english:2,localized:1,freeEnglish:1,freeAndProEnglish:1,separateProApps:2},exclusions:[{id:'old-alpha',route:'/tools/alpha/',reason:'redirect'},{id:'compat-alpha',route:'/tools/alpha/',reason:'unpublished-compatibility'},{id:'afrotools-pro',route:'/pro/',reason:'english-pro-landing'}]},families:[{appFamilyId:'alpha',label:'Synthetic authoring task',workflow:'Create a local document and export it.',freeCore:'Declared free, not exercised authorization.',identityReview:'proposed',membershipClosure:'partial',sourceEvidence:[ev],ambiguityKeys:['review-alpha']}],members:[{key:'alpha',catalogueId:'alpha',route:'/tools/alpha/',role:'app',appFamilyId:'alpha',identityReview:'proposed',locale:'en',countryIds:[],variant:'canonical',reason:'Explicit synthetic page-owner task.',sourceEvidence:[ev],requirements}],ambiguities:[{key:'review-alpha',memberKeys:['alpha'],reason:'Open locale and membership review.',neededEvidence:'Independent source and workflow review.'}]};
 return{inventory,context:{commit:inventory.snapshot.commit,tree:inventory.snapshot.tree,sourceFiles:files},registry,evidence};
}
function repack(f){const bytes=Buffer.from(JSON.stringify(f.registry));f.context.sourceFiles['data/registry/canonical-registry.json']=bytes;f.inventory.snapshot.registry=pin('data/registry/canonical-registry.json',bytes)}
const run=f=>validateInventory(f.inventory,f.context);
function denied(name,edit,code){test(name,()=>{const f=fixture();edit(f);assert.throws(()=>run(f),new RegExp('^Error: '+code+':'))})}

test('counts instances separately from proposed workflows and never invents completion',()=>{
 const result=run(fixture());assert.deepEqual(result.counts,{raw:6,eligible:3,english:2,localized:1,freeEnglish:1,freeAndProEnglish:1,separateProApps:2});
 assert.equal(result.proposedFamilyCount,1);assert.equal(result.eligibleEntriesWithoutSeedDisposition,2);
 assert.deepEqual(result.requirementStates,{unknown:6,blocked:0});
 assert.equal(result.globalFamilyTotal,null);assert.equal(result.completedFamilies,null);assert.equal(result.remainingFamilies,null);assert.equal(result.completionPercentage,null);
});
test('an explicit source-authorized alias links its app without adding another app',()=>{
 const f=fixture(),app=f.inventory.members[0];f.inventory.members.push({...structuredClone(app),key:'old-alpha',catalogueId:'old-alpha',route:'/tools/old-alpha/',role:'alias',targetRoute:'/tools/alpha/',requirements:[]});
 const result=run(f);assert.equal(result.proposedFamilyCount,1);assert.deepEqual(result.memberRoles,{alias:1,app:1});
});
test('source-only unresolved workflow remains outside the denominator and has its own ambiguity',()=>{
 const f=fixture(),p='tools/source-only/index.html';f.context.sourceFiles[p]=Buffer.from('<h1>Review unresolved source route</h1>');
 f.inventory.members.push({key:'source-only',catalogueId:null,route:'/tools/source-only/',role:'unresolved',appFamilyId:null,identityReview:'proposed',locale:'en',countryIds:[],variant:'source-only',reason:'No canonical source ID; app versus hub not decided.',sourceEvidence:[f.evidence(p,'Review unresolved source route')],requirements:[]});
 f.inventory.ambiguities.push({key:'review-source-only',memberKeys:['source-only'],reason:'Unresolved task identity.',neededEvidence:'Read the actual guided workflow.'});
 const result=run(f);assert.equal(result.sourceOnlySeedCount,1);assert.equal(result.proposedFamilyCount,1);assert.equal(result.remainingFamilies,null);
});
test('blocked requirements are explicit pending work, never passing families',()=>{const f=fixture();f.inventory.members[0].requirements[0].state='blocked';f.inventory.members[0].requirements[0].notes=['Actual native fixture prerequisite pending.'];const result=run(f);assert.deepEqual(result.requirementStates,{unknown:5,blocked:1});assert.equal(result.completedFamilies,null)});
test('JSON object property order does not change census or explicit exclusion meaning',()=>{const f=fixture();f.inventory.snapshot.expectedCounts=Object.fromEntries(Object.entries(f.inventory.snapshot.expectedCounts).reverse());f.inventory.snapshot.exclusions=f.inventory.snapshot.exclusions.map(row=>({reason:row.reason,route:row.route,id:row.id}));assert.equal(run(f).counts.eligible,3)});

denied('duplicate stable family ID is rejected',f=>f.inventory.families.push(structuredClone(f.inventory.families[0])),'DUPLICATE_FAMILY');
denied('duplicate member ID is rejected',f=>f.inventory.members.push(structuredClone(f.inventory.members[0])),'DUPLICATE_MEMBER');
denied('index.html spelling cannot conceal overlapping route memberships',f=>f.inventory.members.push({...structuredClone(f.inventory.members[0]),key:'other-key',route:'/tools/alpha/index.html'}),'AMBIGUOUS_MEMBERSHIP');
denied('missing family target is rejected',f=>{f.inventory.members[0].appFamilyId='not-declared'},'DANGLING_FAMILY');
denied('a fabricated canonical ID cannot be adopted from a similar title',f=>{f.inventory.members[0].catalogueId='alpha-lookalike'},'CATALOGUE_JOIN');
denied('a real ID paired with the wrong route is rejected',f=>{f.inventory.members[0].route='/tools/beta/'},'CATALOGUE_JOIN');
denied('a locale link does not excuse mismatching explicit context',f=>{f.inventory.members[0].locale='fr'},'CATALOGUE_JOIN');
denied('country membership is not expanded from a scalar or guessed jurisdiction',f=>{f.inventory.members[0].countryIds=['NG']},'CONTEXT_DRIFT');
denied('source-only label cannot conceal an existing catalogue ID',f=>{f.inventory.members[0].variant='source-only'},'CATALOGUE_JOIN');
denied('new publication states cannot silently alter the census filter',f=>{f.registry.tools[2].publicationStatus='draft';repack(f)},'CENSUS_SCOPE');
denied('expected denominator cannot be altered without actual source drift review',f=>{f.inventory.snapshot.expectedCounts.english=200},'DENOMINATOR_DRIFT');
denied('new source records trigger explicit denominator drift',f=>{f.registry.tools.push({...structuredClone(f.registry.tools[2]),id:'gamma',route:'/tools/gamma/',canonicalRoute:'/tools/gamma/'});repack(f)},'DENOMINATOR_DRIFT');
denied('omitting an explicit exclusion is rejected',f=>f.inventory.snapshot.exclusions.pop(),'EXCLUSION_DRIFT');
denied('duplicate IDs in the genuine source context fail before inventory grouping',f=>{f.registry.tools[2].id='alpha';repack(f)},'CATALOGUE');
denied('missing actual source bytes are not excused by a ledger pin',f=>{delete f.context.sourceFiles['tools/alpha/index.html']},'SOURCE_MISSING');
denied('changed source bytes invalidate an old owner pin',f=>{f.context.sourceFiles['tools/alpha/index.html']=Buffer.from('<h1>Changed source</h1>')},'SOURCE_PIN');
denied('a real file without the claimed task literal is insufficient',f=>{f.inventory.members[0].sourceEvidence[0].literal='A control that never existed'},'SOURCE_LITERAL');
denied('shared helper code cannot join two different page workflows automatically',f=>{
 const helper=f.evidence('assets/js/shared-helper.js','sharedHelper','engine-entrypoint');f.inventory.families[0].sourceEvidence.push(helper);
 f.inventory.members.push({...structuredClone(f.inventory.members[0]),key:'beta',catalogueId:'beta',route:'/tools/beta/',sourceEvidence:[f.evidence('tools/beta/index.html','Convert a local image'),helper]});
},'FAMILY_AUTHORITY');
denied('a family page cannot substitute for the actual member page owner',f=>{f.inventory.members[0].sourceEvidence=[f.evidence('tools/beta/index.html','Convert a local image')]},'MEMBER_OWNER');
denied('free source rows cannot be classified paid-only to hide obligations',f=>{f.inventory.members[0].role='pro-only';f.inventory.members[0].appFamilyId=null;f.inventory.members[0].requirements=[]},'PRO_ROLE');
denied('Pro landing cannot become a free app through a family label',f=>{f.inventory.members[0].catalogueId='afrotools-pro';f.inventory.members[0].route='/pro/';f.inventory.members[0].sourceEvidence=[f.evidence('pro/index.html','Paid product landing')]},'PAID_OR_ALIAS_APP');
denied('orphan ambiguity references cannot certify partial membership',f=>{f.inventory.families[0].ambiguityKeys=['missing-review']},'DANGLING_AMBIGUITY');
denied('alias target must be the actual declared redirect destination',f=>{f.inventory.members.push({...structuredClone(f.inventory.members[0]),key:'old-alpha',catalogueId:'old-alpha',route:'/tools/old-alpha/',role:'alias',targetRoute:'/tools/beta/',requirements:[]})},'ALIAS_TARGET');
denied('cyclic source alias authority fails closed',f=>{f.registry.tools[3].redirectTarget.toolId='old-alpha';repack(f);f.inventory.members.push({...structuredClone(f.inventory.members[0]),key:'old-alpha',catalogueId:'old-alpha',route:'/tools/old-alpha/',role:'alias',targetRoute:'/tools/alpha/',requirements:[]})},'ALIAS_TARGET');
denied('functional PASS cannot be fabricated from static declarations',f=>{f.inventory.members[0].requirements[0].state='passed'},'SHAPE');
denied('functional success booleans are not a supported claim',f=>{f.inventory.members[0].functionalStatus=true},'SHAPE');
denied('a forged global percentage is rejected',f=>{f.inventory.completionPercentage=99},'SHAPE');
denied('a partial proposal cannot declare global coverage closed',f=>{f.inventory.coverage='closed'},'SHAPE');
denied('string or boolean review shortcuts cannot replace the proposed state',f=>{f.inventory.families[0].identityReview=true},'SHAPE');
denied('snapshot source identity cannot be silently rebound',f=>{f.context.commit='f'.repeat(40)},'SOURCE_BINDING');

// Explicitly synthetic identity controls for eight named English primary owners.
const EIGHT_MAPPING_EXPECTED=[["remittance-compare","remittance-quote-comparison","/tools/remittance-compare/","tools/remittance-compare/index.html"],["pdf-editor","pdf-document-edit","/tools/pdf-editor/","tools/pdf-editor/index.html"],["invoice-generator","invoice-document-compose","/tools/invoice-generator/","tools/invoice-generator/index.html"],["car-import-cost","vehicle-landed-cost","/tools/car-import-cost/","tools/car-import-cost/index.html"],["pdf-compress","pdf-document-compress","/tools/pdf-compress/","tools/pdf-compress/index.html"],["pdf-convert","pdf-format-conversion","/tools/pdf-convert/","tools/pdf-convert/index.html"],["payslip-generator","payslip-draft-compose","/tools/payslip-generator/","tools/payslip-generator/index.html"],["currency-converter","currency-observation-conversion","/tools/currency-converter/","tools/currency-converter/index.html"]];
const mappedInventory=require('../data/registry/free-app-families.json');
function eightFixture(){
 const f=fixture();
 for(const [id,familyId,route,owner] of EIGHT_MAPPING_EXPECTED){
  const member=structuredClone(mappedInventory.members.find(x=>x.key===id));
  const family=structuredClone(mappedInventory.families.find(x=>x.appFamilyId===familyId));
  f.context.sourceFiles[owner]=Buffer.from('Synthetic task control for '+id);
  const ev=f.evidence(owner,'Synthetic task control for '+id);
  member.sourceEvidence=[ev];family.sourceEvidence=[structuredClone(ev)];
  f.inventory.members.push(member);f.inventory.families.push(family);
  f.inventory.ambiguities.push(structuredClone(mappedInventory.ambiguities.find(x=>x.key===family.ambiguityKeys[0])));
  f.registry.tools.push({id,route,canonicalRoute:route,localeCoverage:['en'],availability:id.startsWith('pdf-')?'free-and-pro':'free',publicationStatus:'published',deprecated:false,applicability:{countryIds:member.countryIds.slice()},source:{sourceId:null,compatibilityTargetId:null},redirectTarget:null});
 }
 Object.assign(f.inventory.snapshot.expectedCounts,{raw:14,eligible:11,english:10,localized:1,freeEnglish:6,freeAndProEnglish:4,separateProApps:2});repack(f);return f;
}
test('eight named English mappings retain literal owners and only proposed partial identity',()=>{
 assert.equal(mappedInventory.families.length,19);assert.equal(mappedInventory.members.filter(x=>x.role==='app').length,20);
 for(const [id,familyId,route,owner] of EIGHT_MAPPING_EXPECTED){
  const member=mappedInventory.members.find(x=>x.key===id),family=mappedInventory.families.find(x=>x.appFamilyId===familyId);
  assert.ok(member&&family,id);assert.equal(member.catalogueId,id);assert.equal(member.route,route);assert.equal(member.role,'app');assert.equal(member.appFamilyId,familyId);assert.equal(member.locale,'en');assert.equal(member.variant,'canonical');
  assert.equal(member.identityReview,'proposed');assert.equal(family.identityReview,'proposed');assert.equal(family.membershipClosure,'partial');
  assert.ok(member.sourceEvidence.some(x=>x.kind==='page-owner'&&x.pin.path===owner));assert.ok(family.sourceEvidence.some(x=>x.kind==='page-owner'&&x.pin.path===owner));
 }
});
test('eight synthetic memberships validate without adding locale country or alias assumptions',()=>{
 const f=eightFixture(),result=run(f);assert.equal(result.proposedFamilyCount,9);assert.equal(result.cataloguedSeedCount,9);assert.deepEqual(result.memberRoles,{app:9});assert.deepEqual(result.requirementStates,{unknown:54,blocked:0});
 assert.equal(result.globalFamilyTotal,null);assert.equal(result.completedFamilies,null);assert.equal(result.remainingFamilies,null);assert.equal(result.completionPercentage,null);
});
for(const [id] of EIGHT_MAPPING_EXPECTED)test(id+': shared helper cannot collapse distinct page workflow identity',()=>{
 const f=eightFixture(),member=f.inventory.members.find(x=>x.key===id);
 const helper=f.evidence('assets/js/shared-helper.js','sharedHelper','engine-entrypoint');
 f.inventory.families[0].sourceEvidence.push(helper);member.sourceEvidence.push(helper);member.appFamilyId='alpha';
 assert.throws(()=>run(f),/^Error: FAMILY_AUTHORITY:/);
});
test('all 48 added requirements remain unknown and do not manufacture a global percentage',()=>{
 const added=mappedInventory.members.filter(x=>EIGHT_MAPPING_EXPECTED.some(([id])=>id===x.key)).flatMap(x=>x.requirements);
 assert.equal(added.length,48);assert.ok(added.every(x=>x.state==='unknown'));assert.equal(mappedInventory.members.flatMap(x=>x.requirements).filter(x=>x.state==='unknown').length,120);
 assert.equal(Object.hasOwn(mappedInventory,'completionPercentage'),false);assert.equal(mappedInventory.coverage,'partial');assert.equal(mappedInventory.acceptancePolicy,'requirements-only-no-functional-verdict');
 assert.ok(!mappedInventory.members.some(x=>['ng-paye','cover-letter'].includes(x.catalogueId)));
});

// Additive owner/identity controls. The frozen original46 controls above stay exact.
const {normalizeRoute,routeOwnerCandidates,resolveRouteOwner}=require('../scripts/lib/free-app-family-inventory');
for(const [input,expected]of[
 ['/tools/alpha/','/tools/alpha'],['/tools/alpha/index.html','/tools/alpha'],
 ['/tools/alpha/app.html','/tools/alpha/app.html'],['/tools/alpha/app','/tools/alpha/app'],
 ['/tools/alpha/index.html?mode=a','/tools/alpha?mode=a'],
 ['/tools/alpha/?mode=b','/tools/alpha?mode=b'],
 ['/tools/alpha/?b=2&a=1','/tools/alpha?b=2&a=1']
])test('route identity preserves declared task/query semantics: '+input,()=>assert.equal(normalizeRoute(input),expected));
test('query values/order and app versus index never merge',()=>{
 assert.notEqual(normalizeRoute('/tool/?view=a'),normalizeRoute('/tool/?view=b'));
 assert.notEqual(normalizeRoute('/tool/?a=1&b=2'),normalizeRoute('/tool/?b=2&a=1'));
 assert.notEqual(normalizeRoute('/tool/index.html'),normalizeRoute('/tool/app.html'));
 assert.notEqual(normalizeRoute('/tool/index.html'),normalizeRoute('/tool.html'));
});
for(const [route,expected]of[
 ['/agriculture/cassava-processing/angola',['agriculture/cassava-processing/angola/index.html','agriculture/cassava-processing/angola.html']],
 ['/tool/',['tool/index.html']],['/tool/index.html',['tool/index.html']],
 ['/tool/app?from=USD&to=NGN',['tool/app/index.html','tool/app.html']],
 ['/tool/app.html?x=%2F',['tool/app.html']],['/',['index.html']],
 ['//elsewhere/tool',[]],['/tool/../app',[]],['/tool%2Fapp',[]]
])test('physical owner candidates stay literal and bounded: '+route,()=>assert.deepEqual(routeOwnerCandidates(route),expected));
test('competing index and flat owners stay ambiguous, explicit routes stay separate',()=>{
 const paths=['tool/index.html','tool.html','tool/app.html'];
 assert.equal(resolveRouteOwner('/tool',paths).status,'ambiguous');
 assert.equal(resolveRouteOwner('/tool',paths).owner,null);
 assert.equal(resolveRouteOwner('/tool/',paths).owner,'tool/index.html');
 assert.equal(resolveRouteOwner('/tool.html',paths).owner,'tool.html');
 assert.equal(resolveRouteOwner('/tool/app',paths).owner,'tool/app.html');
 assert.equal(resolveRouteOwner('/missing',paths).status,'unresolved');
});
function countryFixture(options={}){
 const f=fixture(),member=f.inventory.members[0],family=f.inventory.families[0];
 const route='/tools/alpha/country',owner='tools/alpha/country.html';
 f.registry.tools[0].route=route;f.registry.tools[0].canonicalRoute=route;repack(f);
 f.context.sourceFiles[owner]=Buffer.from('<link rel="canonical" href="'+(options.canonical||'https://afrotools.com'+route)+'"><h1>Create a local document</h1>');
 const ev=f.evidence(owner,'Create a local document');member.route=route;member.sourceEvidence=[ev];family.sourceEvidence=[ev];
 f.context.routeOwnerPaths=Object.keys(f.context.sourceFiles);
 return f;
}
test('extensionless declared country destination admits its unique pinned canonical flat owner',()=>{
 const f=countryFixture();assert.doesNotThrow(()=>run(f));assert.equal(run(f).globalFamilyTotal,null);
});
test('flat owner does not join solely by stripping html',()=>{
 const f=countryFixture({canonical:'https://afrotools.com/a-different-task'});assert.throws(()=>run(f),/^Error: MEMBER_OWNER:/);
});
test('flat owner rejects wrong-site canonical authority',()=>{
 const f=countryFixture({canonical:'https://elsewhere.test/tools/alpha/country'});assert.throws(()=>run(f),/^Error: MEMBER_OWNER:/);
});
test('flat owner rejects omitted complete owner-path context',()=>{
 const f=countryFixture();delete f.context.routeOwnerPaths;assert.throws(()=>run(f),/^Error: MEMBER_OWNER:/);
});
test('flat owner rejects a competing index file even with a plausible canonical',()=>{
 const f=countryFixture();f.context.routeOwnerPaths.push('tools/alpha/country/index.html');assert.throws(()=>run(f),/^Error: MEMBER_OWNER:/);
});
test('duplicate canonical declarations cannot excuse ambiguous ownership',()=>{
 const f=countryFixture(),owner='tools/alpha/country.html';f.context.sourceFiles[owner]=Buffer.concat([f.context.sourceFiles[owner],Buffer.from('<link rel="canonical" href="https://afrotools.com/tools/alpha/country">')]);
 const ev=f.evidence(owner,'Create a local document');f.inventory.members[0].sourceEvidence=[ev];f.inventory.families[0].sourceEvidence=[ev];assert.throws(()=>run(f),/^Error: MEMBER_OWNER:/);
});
test('declared query state keeps its identity while resolving the same physical owner',()=>{
 const f=countryFixture(),route=f.inventory.members[0].route+'?mode=a';f.inventory.members[0].route=route;f.registry.tools[0].route=route;f.registry.tools[0].canonicalRoute=route;repack(f);assert.doesNotThrow(()=>run(f));
});
test('a different query state cannot impersonate the declared catalogue route',()=>{
 const f=countryFixture(),base=f.inventory.members[0].route;f.inventory.members[0].route=base+'?mode=b';f.registry.tools[0].route=base+'?mode=a';f.registry.tools[0].canonicalRoute=base+'?mode=a';repack(f);assert.throws(()=>run(f),/^Error: CATALOGUE_JOIN:/);
});

// Actual complete-validator regressions for canonical source-owner authority.
function canonicalMarkupFixture(html){
 const f=countryFixture(),owner='tools/alpha/country.html';
 f.context.sourceFiles[owner]=Buffer.from(html+'<h1>Create a local document</h1>');
 const ev=f.evidence(owner,'Create a local document');
 f.inventory.members[0].sourceEvidence=[ev];f.inventory.families[0].sourceEvidence=[ev];return f;
}
const canonicalTarget='https://afrotools.com/tools/alpha/country';
for(const [name,markup]of[
 ['standard order','<link rel="canonical" href="'+canonicalTarget+'">'],
 ['reversed order and single quotes',"<link href='"+canonicalTarget+"' rel='canonical'>"],
 ['mixed case and whitespace',"<LiNk\n HREF = '"+canonicalTarget+"'\t ReL = 'CaNoNiCaL' >"],
 ['quoted greater-than in unrelated value','<link data-note="review > old" href="'+canonicalTarget+'" rel="canonical">'],
 ['quoted fake attributes do not override real ones',"<link data-note='rel=\"alternate\" href=\"https://elsewhere.test/\"' rel='canonical' href='"+canonicalTarget+"'>"],
 ['unquoted valid attributes','<link rel=canonical href='+canonicalTarget+'>'],
 ['self closing with space','<link href="'+canonicalTarget+'" rel="canonical" />'],
 ['noncanonical link and genuine canonical','<link rel="stylesheet" href="/site.css"><link rel="canonical" href="'+canonicalTarget+'">'],
 ['boolean attributes preserve following attributes','<link crossorigin rel="preconnect" href="https://fonts.gstatic.com"><link disabled href="'+canonicalTarget+'" rel="canonical">'],
 ['raw text fake and genuine canonical','<script>const text=\'<link rel="canonical" href="https://elsewhere.test/">\';</script><link rel="canonical" href="'+canonicalTarget+'">'],
 ['comment fake and genuine canonical','<!-- <link rel="canonical" href="https://elsewhere.test/"> --><link rel="canonical" href="'+canonicalTarget+'">']
])test('canonical attribute authority accepts '+name,()=>assert.doesNotThrow(()=>run(canonicalMarkupFixture(markup))));
for(const [name,markup]of[
 ['data-rel','<link data-rel="canonical" href="'+canonicalTarget+'">'],
 ['data-href','<link rel="canonical" data-href="'+canonicalTarget+'">'],
 ['prefix rel','<link xrel="canonical" href="'+canonicalTarget+'">'],
 ['suffix rel','<link rel-extra="canonical" href="'+canonicalTarget+'">'],
 ['prefix href','<link rel="canonical" xhref="'+canonicalTarget+'">'],
 ['suffix href','<link rel="canonical" href-extra="'+canonicalTarget+'">'],
 ['different tag name','<linker rel="canonical" href="'+canonicalTarget+'">'],
 ['attributes only inside another value',"<link data-note='rel=\"canonical\" href=\""+canonicalTarget+"\"'>"],
 ['embedded tag inside another attribute',"<div data-template='<link rel=\"canonical\" href=\""+canonicalTarget+"\">'></div>"],
 ['comment only','<!-- <link rel="canonical" href="'+canonicalTarget+'"> -->'],
 ['script string only','<script>const text=\'<link rel="canonical" href="'+canonicalTarget+'">\';</script>'],
 ['textarea text only','<textarea><link rel="canonical" href="'+canonicalTarget+'"></textarea>'],
 ['unterminated quote','<link rel="canonical" href="'+canonicalTarget+'>'],
 ['missing attribute separation','<link rel="canonical"href="'+canonicalTarget+'">'],
 ['duplicate href','<link rel="canonical" href="'+canonicalTarget+'" href="https://elsewhere.test/">'],
 ['duplicate rel','<link rel="alternate" rel="canonical" href="'+canonicalTarget+'">'],
 ['two genuine matching canonicals','<link rel="canonical" href="'+canonicalTarget+'"><link href="'+canonicalTarget+'" rel="canonical">'],
 ['conflicting genuine canonicals','<link rel="canonical" href="'+canonicalTarget+'"><link href="https://afrotools.com/other" rel="canonical">'],
 ['canonical missing href','<link rel="canonical">'],
 ['wrong task with genuine attributes','<link rel="canonical" href="https://afrotools.com/other">']
])test('canonical attribute authority rejects '+name,()=>assert.throws(()=>run(canonicalMarkupFixture(markup)),/^Error: MEMBER_OWNER:/));


// Report controls use synthetic historical role snapshots, not app completion.
const {reportInventory}=require('../scripts/lib/free-app-family-inventory');
function roleDocument(name,payload,indexes){
 const payloadText=JSON.stringify(payload),bytes=Buffer.from(payloadText);
 const out={name,source:{path:'synthetic/'+name+'.json.gz',bytes:1,sha256:'c'.repeat(64)},raw:{bytes:bytes.length,sha256:sha('sha256',bytes)},payloadText};
 if(indexes!==undefined)out.evidenceIndexes=indexes;
 return out;
}
function reportSnapshot(cohorts){
 const counts=cohorts.map(c=>JSON.parse(c.payloadText).rows.length),count=counts.reduce((a,b)=>a+b,0);
 const recordText=JSON.stringify({rootActual:{originalUnresolvedEnglishPool:count,sevenFrozenDispositionsVerified:cohorts.length}}),bytes=Buffer.from(recordText);
 return {schemaVersion:1,status:'accepted-historical-source-role-snapshot',acceptance:{pin:{path:'synthetic/root-review.json',bytes:bytes.length,sha256:sha('sha256',bytes)},recordText,expectedRows:count,cohortRows:counts},cohorts,qualification:'Synthetic source-role evidence only.'};
}
function reportRows(){
 const required=kind=>({kind,state:'unknown',notes:[]}),kinds=['happy','error','export','recovery','accessibility','privacy'];
 return [
  {catalogueId:'alpha',route:'/tools/alpha/',proposedRole:'app-entry-context',appFamilyId:null,requirementStates:Object.fromEntries(kinds.map(kind=>[kind,'unknown'])),extraAcceptedRole:{kept:true}},
  {catalogueId:'beta',route:'/tools/beta/',proposedRole:'mounted-workflow-with-child-app-context',appFamilyId:'provisional-beta',requirements:kinds.map(required)}
 ];
}
function reportFixture(){const f=fixture();f.snapshot=reportSnapshot([roleDocument('cohort',{rows:reportRows()},[])]);return f;}
function reportRun(f){return reportInventory(f.inventory,f.registry,f.snapshot,sha('sha256',Buffer.from(JSON.stringify(f.registry))));}
test('report preserves heterogeneous role labels/requirements and never promotes source review to completion',()=>{
 const f=reportFixture(),before=JSON.stringify(f.snapshot),r=reportRun(f);
 assert.equal(r.catalogue.raw,6);assert.equal(r.catalogue.english,2);assert.equal(r.catalogue.explicitExcludedEntries,3);
 assert.equal(r.installedFamilyModel.proposedFamilies,1);assert.deepEqual(r.installedFamilyModel.requirementStates,{unknown:6});
 assert.equal(r.historicalRoleReview.reviewedRows,2);assert.deepEqual(r.historicalRoleReview.roleLabels,{'app-entry-context':1,'mounted-workflow-with-child-app-context':1});
 assert.deepEqual(r.historicalRoleReview.unknownRequirementsByKind,{happy:2,error:2,export:2,recovery:2,accessibility:2,privacy:2});
 assert.equal(JSON.stringify(f.snapshot),before);assert.deepEqual(r.functional,{uniqueApps:null,completedApps:null,remainingApps:null,completionPercentage:null,reason:'No closed family job set or independent happy/error/export/recovery/accessibility/privacy acceptance.'});
 assert.equal(r.currentCompatibility.ownerContext,'not-assessed');
});
test('report exposes current ID/route drift while retaining historical review coverage',()=>{
 const f=reportFixture();f.registry.tools=f.registry.tools.filter(row=>row.id!=='beta');f.registry.tools[0].canonicalRoute='/tools/alpha/app.html';
 const r=reportRun(f);assert.equal(r.historicalRoleReview.reviewedRows,2);assert.deepEqual(r.currentCompatibility.roleIdsAbsentFromCurrentEnglish,['beta']);assert.deepEqual(r.currentCompatibility.roleRouteDrift,[{id:'alpha',reviewed:'/tools/alpha/',current:'/tools/alpha/app.html'}]);assert.equal(r.currentCompatibility.registryMatchesFamilySnapshot,false);assert.equal(r.functional.uniqueApps,null);
});
test('report rejects a new unsupported catalogue disposition using the shared eligibility policy',()=>{
 const f=reportFixture();f.registry.tools[0].publicationStatus='held-new-state';assert.throws(()=>reportRun(f),/CENSUS_SCOPE/);
});
test('report rejects changed payload bytes despite unchanged declared provenance',()=>{
 const f=reportFixture();f.snapshot.cohorts[0].payloadText+=' ';assert.throws(()=>reportRun(f),/ROLE_PAYLOAD/);
});
test('report rejects duplicated reviewed IDs across cohorts rather than silently deduplicating',()=>{
 const row=reportRows()[0],f=fixture();f.snapshot=reportSnapshot([roleDocument('one',{rows:[row]},[]),roleDocument('two',{rows:[row]},[])]);assert.throws(()=>reportRun(f),/ROLE_IDENTITY/);
});
test('report refuses a total that differs from the pinned Root review document',()=>{
 const f=reportFixture();f.snapshot.acceptance.expectedRows++;assert.throws(()=>reportRun(f),/ROLE_ACCEPTANCE/);
});
test('report refuses functional PASS or missing obligations in source-role evidence',()=>{
 for(const mode of ['pass','missing']){const f=reportFixture(),rows=reportRows();if(mode==='pass')rows[0].requirementStates.happy='pass';else delete rows[0].requirementStates.privacy;f.snapshot=reportSnapshot([roleDocument('cohort',{rows},[])]);assert.throws(()=>reportRun(f),/ROLE_REQUIREMENTS/);}
});
test('report resolves positional evidence only for its exact reviewed catalogue ID',()=>{
 const f=reportFixture(),rows=reportRows();rows[0].evidenceOrdinal=0;
 f.snapshot=reportSnapshot([roleDocument('cohort',{rows},[roleDocument('sourceRows',{rows:[{catalogueId:'alpha'}]})])]);assert.equal(reportRun(f).historicalRoleReview.reviewedRows,2);
 f.snapshot=reportSnapshot([roleDocument('cohort',{rows},[roleDocument('sourceRows',{rows:[{catalogueId:'beta'}]})])]);assert.throws(()=>reportRun(f),/ROLE_EVIDENCE/);
});
test('report refuses dangling inline ordinals and direct-source pin references',()=>{
 const rows=reportRows();rows[0].inlineEvidenceOrdinals=[7];rows[1].allDirectSourcePinsOrdinal=1;
 const indexes=[roleDocument('sourceRows',[{catalogueId:'alpha',inlineControllers:[{ordinal:7}]},{catalogue:{id:'beta'}}]),roleDocument('directPins',{rows:[{path:'controller.js'}],directLocalByCatalogueId:{beta:['controller.js']}})];
 const f=reportFixture();f.snapshot=reportSnapshot([roleDocument('cohort',{rows},indexes)]);assert.equal(reportRun(f).historicalRoleReview.reviewedRows,2);
 rows[0].inlineEvidenceOrdinals=[8];f.snapshot=reportSnapshot([roleDocument('cohort',{rows},indexes)]);assert.throws(()=>reportRun(f),/ROLE_EVIDENCE/);
 rows[0].inlineEvidenceOrdinals=[7];indexes[1]=roleDocument('directPins',{rows:[],directLocalByCatalogueId:{beta:['controller.js']}});f.snapshot=reportSnapshot([roleDocument('cohort',{rows},indexes)]);assert.throws(()=>reportRun(f),/ROLE_EVIDENCE/);
});
test('report import does not read or parse the large snapshot or invoke report main',()=>{
 const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),file=path.resolve(__dirname,'../scripts/lib/free-app-family-inventory.js'),module={exports:{}};
 let reads=0;const guarded=request=>{if(request==='node:fs')return{readFileSync(){reads++;throw Error('Eager snapshot read');}};if(request==='../../data/registry/free-app-families.schema.json')return require('../data/registry/free-app-families.schema.json');return require(request);};
 guarded.main=null;vm.runInNewContext(fs.readFileSync(file,'utf8'),{module,exports:module.exports,require:guarded,Buffer,URL,console,__dirname:path.dirname(file)});
 assert.equal(reads,0);assert.equal(typeof module.exports.validateInventory,'function');assert.equal(typeof module.exports.reportInventory,'function');
});
test('report actual maintained snapshot remains historical even when current registry IDs join',()=>{
 const fs=require('node:fs'),path=require('node:path'),root=path.resolve(__dirname,'..'),read=owner=>fs.readFileSync(path.join(root,owner),'utf8');
 const registryText=read('data/registry/canonical-registry.json'),snapshot=JSON.parse(read('data/registry/free-app-source-role-review.json'));
 const r=reportInventory(JSON.parse(read('data/registry/free-app-families.json')),JSON.parse(registryText),snapshot,sha('sha256',Buffer.from(registryText)));
 assert.equal(r.historicalRoleReview.status,'accepted-historical-source-role-snapshot');assert.equal(r.currentCompatibility.ownerContext,'not-assessed');assert.equal(r.functional.uniqueApps,null);assert.equal(r.functional.completedApps,null);assert.equal(r.functional.remainingApps,null);assert.equal(r.functional.completionPercentage,null);
});

// Source1 primary-job/entry-edge controls. Synthetic files and registry only.
const JOB_MEMBER_KEYS=['boq-builder-discovery','boq-builder-operating','boq-gen','school-fees','school-fees-comparator','emergency-fund','security-emergency-fund'];
function jobFixture(){
 const f=fixture(),added=mappedInventory.members.filter(m=>JOB_MEMBER_KEYS.includes(m.key));
 const familyIds=new Set(added.map(m=>m.appFamilyId).filter(Boolean));
 const familyRows=mappedInventory.families.filter(r=>familyIds.has(r.appFamilyId));
 const allEvidence=added.flatMap(m=>m.sourceEvidence);
 for(const e of allEvidence){if(!f.context.sourceFiles[e.pin.path])f.context.sourceFiles[e.pin.path]=Buffer.from(e.pin.path.endsWith('.html')?'<h1>Synthetic operating source</h1>':'// Synthetic runtime owner declaration');}
 f.context.sourceFiles['tools/boq-builder/index.html']=Buffer.from('<h1>Synthetic landing</h1><a href="app.html">Open app</a>');
 f.context.sourceFiles['tools/school-fees/index.html']=Buffer.from('<h1>Synthetic reserve planner</h1><a href="/tools/school-fees/app">Compare quotes</a>');
 for(const p of ['tools/boq-builder/app.html','tools/school-fees/app.html'])f.context.sourceFiles[p]=Buffer.from('<link rel="canonical" href="https://afrotools.com/'+p.slice(0,-5)+'"><h1>Synthetic operating source</h1>');
 const ev=e=>f.evidence(e.pin.path,e.pin.path.endsWith('.html')?'Synthetic':'Synthetic runtime',e.kind);
 for(const m of added){const row=structuredClone(m);row.sourceEvidence=row.sourceEvidence.map(ev);f.inventory.members.push(row);if(row.catalogueId)f.registry.tools.push({id:row.catalogueId,route:row.route,canonicalRoute:row.route,localeCoverage:['en'],availability:'free',publicationStatus:'published',deprecated:false,applicability:{countryIds:row.countryIds.slice()},source:{sourceId:null,compatibilityTargetId:null},redirectTarget:null});}
 for(const r of familyRows){const row=structuredClone(r);row.sourceEvidence=row.sourceEvidence.map(ev);f.inventory.families.push(row);}
 for(const r of mappedInventory.ambiguities.filter(r=>familyRows.some(family=>family.ambiguityKeys.includes(r.key))))f.inventory.ambiguities.push(structuredClone(r));
 f.inventory.entryEdges=structuredClone(mappedInventory.entryEdges);for(const edge of f.inventory.entryEdges)edge.sourceEvidence=edge.sourceEvidence.map(ev);
 f.context.routeOwnerPaths=new Set(Object.keys(f.context.sourceFiles));
 Object.assign(f.inventory.snapshot.expectedCounts,{raw:11,eligible:8,english:7,localized:1,freeEnglish:6,freeAndProEnglish:1,separateProApps:2});repack(f);return f;
}
function jobDenied(name,edit,code){test(name,()=>{const f=jobFixture();edit(f);assert.throws(()=>run(f),new RegExp('^Error: '+code+':'))});}
test('current-source adaptation retains repinned original rows and appends exactly five families, seven surfaces and two directed entries',()=>{
 const expected={"families":"b786ae312a32cd3fffe2b7702eac0ee4de02365a7eb228789bf487e75599036d","members":"00c8179730bcac2611921e95aed5f350f0a631e375ce74e5fca63f8f9c99b119","ambiguities":"3d476be25dcb106fa1f4ea80a85192d8ffdf375982186fa5f2111175c9136def"};
 for(const [key,n] of [['families',14],['members',18],['ambiguities',19]])assert.equal(sha('sha256',Buffer.from(JSON.stringify(mappedInventory[key].slice(0,n)))),expected[key]);
 const f=jobFixture(),result=run(f);assert.equal(result.proposedFamilyCount,6);assert.equal(result.memberRoles.app,7);assert.equal(result.memberRoles.discovery,1);assert.equal(result.sourceOnlySeedCount,2);assert.equal(f.inventory.entryEdges.length,2);
 assert.equal(result.globalFamilyTotal,null);assert.equal(result.completedFamilies,null);assert.equal(result.completionPercentage,null);
 const added=f.inventory.members.filter(m=>JOB_MEMBER_KEYS.includes(m.key));assert.equal(added.length,7);assert.equal(new Set(added.filter(m=>m.catalogueId).map(m=>m.catalogueId)).size,5);assert.equal(added.flatMap(m=>m.requirements).length,36);assert.ok(added.flatMap(m=>m.requirements).every(r=>r.state==='unknown'));
});
test('BOQ landing remains discovery while two different operating schemas retain different jobs',()=>{const f=jobFixture();run(f);const lookup=k=>f.inventory.members.find(m=>m.key===k);assert.equal(lookup('boq-builder-discovery').appFamilyId,null);assert.equal(lookup('boq-builder-discovery').requirements.length,0);assert.notEqual(lookup('boq-builder-operating').jobContract.jobId,lookup('boq-gen').jobContract.jobId);assert.match(lookup('boq-builder-operating').jobContract.negativeExamples[0],/qty=3/);assert.match(lookup('boq-builder-operating').jobContract.actions,/escaped quotes/);assert.match(lookup('boq-builder-operating').jobContract.actions,/Failed import preserves current items/);assert.match(lookup('boq-gen').jobContract.negativeExamples[0],/2025-Q1/);});
test('School planner and noncatalogued canonical comparator remain distinct primary jobs',()=>{const f=jobFixture();run(f);const a=f.inventory.members.find(m=>m.key==='school-fees'),b=f.inventory.members.find(m=>m.key==='school-fees-comparator');assert.equal(a.role,'app');assert.equal(b.role,'app');assert.equal(b.catalogueId,null);assert.equal(b.variant,'source-only');assert.notEqual(a.jobContract.jobId,b.jobContract.jobId);assert.equal(b.route,'/tools/school-fees/app');assert.match(b.jobContract.inputs,/same period/);});
test('Emergency model variants retain independent numeric and lifecycle obligations under one proposed job',()=>{const f=jobFixture();run(f);const a=f.inventory.members.find(m=>m.key==='emergency-fund'),b=f.inventory.members.find(m=>m.key==='security-emergency-fund');assert.equal(a.appFamilyId,b.appFamilyId);assert.notEqual(a.jobContract.variant,b.jobContract.variant);assert.match(a.jobContract.obligations,/checks finite derived/);assert.match(a.jobContract.actions,/input\/change on all seven fields/);assert.match(b.jobContract.obligations,/Math.max/);assert.match(a.jobContract.negativeExamples[0],/363/);assert.match(b.jobContract.negativeExamples[0],/370/);assert.ok([...a.requirements,...b.requirements].every(r=>r.state==='unknown'));});
jobDenied('job cannot bind a different family merely because totals resemble each other',f=>{f.inventory.members.find(m=>m.key==='boq-gen').jobContract.jobId='boq-priced-document-authoring'},'JOB_CONTRACT');
jobDenied('job owner cannot be replaced by a related landing or shared helper',f=>{f.inventory.members.find(m=>m.key==='boq-builder-operating').jobContract.primaryOwner='tools/boq-builder/index.html'},'JOB_CONTRACT');
jobDenied('contract runtime paths must each have a current pinned declaration',f=>{f.inventory.members.find(m=>m.key==='school-fees-comparator').jobContract.runtimeOwners.push('unreviewed/provider.js')},'JOB_CONTRACT');
jobDenied('nonapp discovery cannot acquire a job contract',f=>{f.inventory.members.find(m=>m.key==='boq-builder-discovery').jobContract=structuredClone(f.inventory.members.find(m=>m.key==='boq-gen').jobContract)},'JOB_CONTRACT');
jobDenied('entry target must be a real operating member',f=>{f.inventory.entryEdges[0].toMemberKey='boq-builder-discovery'},'ENTRY_EDGE');
jobDenied('entry source must exist',f=>{f.inventory.entryEdges[0].fromMemberKey='invented-landing'},'ENTRY_EDGE');
jobDenied('entry canonical cannot hide another child path',f=>{f.inventory.entryEdges[0].targetCanonicalRoute='/tools/boq-builder/app.html'},'ENTRY_EDGE');
jobDenied('entry href must occur as an actual anchor',f=>{f.inventory.entryEdges[0].href='imagined.html'},'ENTRY_EDGE');
jobDenied('duplicate directed entries are rejected even with another key',f=>{f.inventory.entryEdges.push({...structuredClone(f.inventory.entryEdges[0]),key:'duplicate-directed-entry'})},'ENTRY_EDGE');
jobDenied('another page cannot authorize an entry edge',f=>{f.inventory.entryEdges[0].sourceEvidence=f.inventory.entryEdges[1].sourceEvidence},'ENTRY_EDGE');
jobDenied('source-only comparator cannot steal its root catalogue ID',f=>{f.inventory.members.find(m=>m.key==='school-fees-comparator').catalogueId='school-fees'},'AMBIGUOUS_MEMBERSHIP');
jobDenied('an identity proposal cannot fabricate functional PASS',f=>{f.inventory.members.find(m=>m.key==='security-emergency-fund').requirements[0].state='passed'},'SHAPE');
test('script and comment text cannot impersonate an operating entry anchor',()=>{
 const f=jobFixture(),p='tools/boq-builder/index.html';f.context.sourceFiles[p]=Buffer.from('<h1>Synthetic landing</h1><!-- <a href="app.html">fake</a> --><script>var text=\'<a href="app.html">fake</a>\';</script>');
 const refresh=e=>e.pin.path===p?f.evidence(p,'Synthetic',e.kind):e;
 for(const m of f.inventory.members)m.sourceEvidence=m.sourceEvidence.map(refresh);for(const e of f.inventory.entryEdges)e.sourceEvidence=e.sourceEvidence.map(refresh);
 assert.throws(()=>run(f),/^Error: ENTRY_EDGE:/);
});
