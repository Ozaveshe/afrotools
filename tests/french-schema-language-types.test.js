'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const { createRequire } = require('node:module');
const ROOT = process.env.FRENCH_SCHEMA_SOURCE_ROOT || path.resolve(__dirname, '..');
const parityPath = path.join(ROOT, 'scripts/build-french-document-pdf-parity.js');
const parityModule = {exports:{}};
vm.runInNewContext(fs.readFileSync(parityPath, 'utf8') + '\nmodule.exports.schemaForTest = localizeSchemas;', {
  require:createRequire(parityPath),module:parityModule,exports:parityModule.exports,
  __dirname:path.dirname(parityPath),process:{argv:[]},URL,console
},{filename:parityPath});
const localize = parityModule.exports.schemaForTest;
const evidenceSource = fs.readFileSync(path.join(ROOT,'scripts/build-french-document-pdf-evidence.js'),'utf8');
const acceptance = evidenceSource.match(/const schemaAccepted = ([\s\S]*?);/);
assert.ok(acceptance, 'execute the actual evidence predicate');
const accepted = schema => vm.runInNewContext(acceptance[1],{schema});
const app={name:'Traduire un PDF',description:'Texte français',englishRoute:'/tools/pdf-translate/',frenchRoute:'/fr/tools/traduire-pdf/'};
const routes={'/tools/pdf-translate/':app.frenchRoute};
const parse = html => JSON.parse(html.match(/<script[^>]*>([\s\S]*?)<\/script>/)[1]);
const render = value => parse(localize('<script type="application/ld+json">'+JSON.stringify(value)+'</script>',app,'https://afrotools.com'+app.frenchRoute,routes,[app],{}));
const crumb = language => ({'@context':'https://schema.org','@type':'BreadcrumbList',...(language?{inLanguage:language}:{}),itemListElement:[{'@type':'ListItem',position:1,name:'AfroTools',item:'https://afrotools.com/'},{'@type':'ListItem',position:2,name:'PDF',item:'https://afrotools.com/tools/pdf-translate/'}]});
test('generated breadcrumbs omit unsupported language, including old localized input',()=>{
  for(const language of [undefined,'en','fr'])for(const type of ['BreadcrumbList',['BreadcrumbList']]){
    const input={...crumb(language),'@type':type};
    if(Array.isArray(type))input.itemListElement[0].item='https://afrotools.com/fr/';
    const output=render(input);
    assert.equal(Object.hasOwn(output,'inLanguage'),false);
    assert.equal(output.itemListElement[0].item,'https://afrotools.com/fr/');
    assert.equal(output.itemListElement[1].item,'https://afrotools.com/fr/tools/traduire-pdf/');
    assert.equal(output.itemListElement[1].name,app.name);
    assert.deepEqual(Array.from(output.itemListElement,x=>x.position),[1,2]);
  }
});
test('eligible page and application language survives with correct French identity',()=>{
  for(const type of ['WebApplication','SoftwareApplication','WebPage','CollectionPage','FAQPage','HowTo']){
    const output=render({'@context':'https://schema.org','@type':type,inLanguage:'en',name:'PDF',url:'https://afrotools.com/tools/pdf-translate/'});
    assert.equal(output.inLanguage,'fr');
    assert.equal(output.url,'https://afrotools.com/fr/tools/traduire-pdf/');
    assert.equal(output['@type'],type);
  }
});
test('nested graph and array breadcrumbs retain their translated hierarchy',()=>{
  for(const input of [[crumb('en')],{'@context':'https://schema.org','@graph':[crumb('en'),{'@type':'WebPage',inLanguage:'en'}]}]){
    const result=render(input),nodes=Array.isArray(result)?result:result['@graph'];
    assert.equal(Object.hasOwn(nodes[0],'inLanguage'),false);
    assert.equal(nodes[0].itemListElement[1].item,'https://afrotools.com/fr/tools/traduire-pdf/');
    if(nodes[1])assert.equal(nodes[1].inLanguage,'fr');
  }
});
test('actual evidence predicate accepts valid generated schema and rejects regressions',()=>{
  const page=render({'@context':'https://schema.org','@type':'WebApplication',inLanguage:'en'});
  const breadcrumbs=render(crumb('en'));
  assert.equal(accepted({parsed:[page,breadcrumbs],failures:[]}),true);
  assert.equal(accepted({parsed:[page,{...breadcrumbs,'@type':['BreadcrumbList']}],failures:[]}),true);
  assert.equal(accepted({parsed:[page,{...breadcrumbs,'@type':['BreadcrumbList'],inLanguage:'fr'}],failures:[]}),false);
  assert.equal(accepted({parsed:[page,{...breadcrumbs,inLanguage:'fr'}],failures:[]}),false);
  assert.equal(accepted({parsed:[{...page,inLanguage:'en'},breadcrumbs],failures:[]}),false);
  assert.equal(accepted({parsed:[{...page,inLanguage:undefined},breadcrumbs],failures:[]}),false);
  assert.equal(accepted({parsed:[page,breadcrumbs],failures:['malformed']}),false);
  assert.equal(accepted({parsed:[],failures:[]}),false);
  assert.equal(accepted({parsed:[null],failures:[]}),false);
});
test('French home generator retains identity and valid language without invented contact fields',()=>{
  const source=fs.readFileSync(path.join(ROOT,'scripts/build-french-product-surface.js'),'utf8');
  const block=[...source.matchAll(/<script type="application\/ld\+json">([^<]+)<\/script>/g)].map(m=>m[1]).find(s=>s.includes('https://afrotools.com/fr/#website'));
  assert.ok(block);
  const graph=JSON.parse(block)['@graph'];
  const org=graph.find(n=>n['@type']==='Organization');
  assert.equal(org.name,'AfroTools');
  assert.equal(org.url,'https://afrotools.com/');
  assert.equal(Object.hasOwn(org,'availableLanguage'),false);
  assert.equal(Object.hasOwn(org,'contactPoint'),false);
  assert.equal(graph.find(n=>n['@type']==='WebSite').inLanguage,'fr');
  assert.equal(graph.find(n=>n['@type']==='CollectionPage').inLanguage,'fr');
});

test('schema vocabulary survives hostile UI lexicon while human text is translated',()=>{
 const lexicon={'WebApplication':'Application Web','Organization':'Organisation','BusinessApplication':'Application métier','Invoice':'Facture','description':'description traduite','https://schema.org':'contexte traduit'};
 const input={'@context':'https://schema.org','@type':['WebApplication','SoftwareApplication'],applicationCategory:'BusinessApplication',name:'Invoice',description:'Invoice',author:{'@type':'Organization',name:'Invoice'}};
 const out=parse(localize('<script type="application/ld+json">'+JSON.stringify(input)+'</script>',app,'https://afrotools.com'+app.frenchRoute,routes,[app],lexicon));
 assert.deepEqual(Array.from(out['@type']),['WebApplication','SoftwareApplication']);
 assert.equal(out['@context'],'https://schema.org');
 assert.equal(out.applicationCategory,'BusinessApplication');
 assert.equal(out.author['@type'],'Organization');
 assert.equal(out.author.name,'Facture');
 assert.equal(out.description,'Facture');
 assert.equal(Object.hasOwn(out,'description traduite'),false);
});
test('legacy translated identifiers normalize without changing human-readable labels',()=>{
 const input={'@context':'https://schema.org','@type':'Application Web',name:'Application Web',applicationCategory:'Application métier',author:{'@type':'Organisation',name:'Organisation'}};
 const out=render(input);
 assert.equal(out['@type'],'WebApplication');
 assert.equal(out.applicationCategory,'BusinessApplication');
 assert.equal(out.author['@type'],'Organization');
 assert.equal(out.author.name,'Organisation');
 assert.equal(render(out)['@type'],'WebApplication');
});
test('all configured English schema identifiers survive actual French schema generation',()=>{
 const config=require(path.join(ROOT,'data/localization/fr-document-pdf-parity.json'));
 const lexicon=require(path.join(ROOT,'data/localization/fr-document-pdf-lexicon.json'));
 const routeMap=Object.fromEntries(config.apps.map(a=>[a.englishRoute,a.frenchRoute]));
 let documents=0;
 function vocabulary(node,result=[]){
  if(Array.isArray(node))node.forEach(n=>vocabulary(n,result));
  else if(node&&typeof node==='object')for(const [key,value]of Object.entries(node)){
   if(['@type','@context','applicationCategory'].includes(key))result.push([key,value]);
   vocabulary(value,result);
  }
  return result;
 }
 for(const entry of config.apps)for(const [file,route]of [[entry.englishFile,entry.frenchRoute],[entry.englishWorkspaceFile,entry.frenchWorkspaceRoute]].filter(x=>x[0]&&x[1])){
  const source=fs.readFileSync(path.join(ROOT,file),'utf8');
  const before=[...source.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].map(m=>JSON.parse(m[1]));
  const output=localize(source,entry,'https://afrotools.com'+route,routeMap,config.apps,lexicon.routes[entry.id]||{});
  const after=[...output.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].map(m=>JSON.parse(m[1]));
  assert.deepEqual(vocabulary(after),vocabulary(before),file);
  documents++;
 }
 assert.equal(documents,35);
});
