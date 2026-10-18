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
