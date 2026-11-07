'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ROOT=process.env.AFROTOOLS_ARTICLE_CANONICAL_TEST_ROOT||path.join(__dirname,'..');
const {replaceHeadLinks}=require(path.join(ROOT,'scripts/lib/route-contract.js'));
const U=require(path.join(ROOT,'tools/afrostream/news-utils.js'));
function templatesFromMaintainedBuilder(){
  const filename=path.join(ROOT,'scripts/build-afrostream-templates.js');let output;
  const context=vm.createContext({__dirname:path.dirname(filename),console:{log(){}},require(name){
    if(name==='node:path')return path;
    if(name==='node:fs')return {readFileSync(file,encoding){
      const original=fs.readFileSync(file,encoding);
      return path.resolve(file)===path.resolve(ROOT,'tools/afrostream/article.html')
        ? replaceHeadLinks(original,'/tools/afrostream/news',{}) : original;
    },writeFileSync(file,bytes){assert.equal(path.resolve(file),path.resolve(ROOT,'netlify/functions/_shared/afrostream-templates.json'));assert.equal(output,undefined);output=bytes;}};
    throw Error('Unexpected builder dependency '+name);
  }});
  vm.runInContext(fs.readFileSync(filename,'utf8'),context,{filename});assert.ok(output);return JSON.parse(output);
}
function renderer(templates,fetch){
  const exports={};
  const context=vm.createContext({exports,URL,AbortSignal,process:{env:{SUPABASE_DATA_SERVICE_ROLE_KEY:'synthetic-test-only'}},fetch:fetch||(async()=>{throw Error('Unexpected network attempt');}),require(name){if(name==='./_shared/afrostream-templates.json')return templates;if(name==='../../tools/afrostream/news-utils')return U;throw Error('Unexpected renderer dependency '+name);}});
  const filename=path.join(ROOT,'netlify/functions/afrostream-article.js');vm.runInContext(fs.readFileSync(filename,'utf8'),context,{filename});return exports;
}
function canonicals(html){return Array.from(html.matchAll(/<link\b[^>]*>/gi),m=>m[0]).filter(tag=>/\brel\s*=\s*["']canonical["']/i.test(tag)).map(tag=>/\bhref\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1]);}
const original={id:42,slug:'synthetic-creator-report',title:'Synthetic creator report',category:'platform',author:'AfroStream editorial',external_id:'editorial:synthetic:2026',source_name:'Public source',source_url:'https://example.org/report',body:Array(150).fill('reporting').join(' '),excerpt:'Synthetic test article.',image_url:null,published_at:'2026-09-23T12:00:00Z',updated_at:'2026-09-24T12:00:00Z'};
test('route metadata then template build: maintained builder preserves exactly one static fallback canonical inside replaceable article metadata',()=>{
  const templates=templatesFromMaintainedBuilder(),html=templates['article.html'];
  const block=/<!-- AS_ARTICLE_META_START -->([\s\S]*?)<!-- AS_ARTICLE_META_END -->/.exec(html)[1];
  assert.deepEqual(canonicals(html),['https://afrotools.com/tools/afrostream/news']);
  assert.deepEqual(canonicals(block),canonicals(html));assert.match(block,/noindex,follow/);
  assert.match(html,/Read the scene/);assert.match(html,/RSS feed/);
});
test('route metadata then template build: actual SSR replaces fallback with exactly one matching article canonical, OG URL and schema identity',()=>{
  const server=renderer(templatesFromMaintainedBuilder());
  for(const slug of ['synthetic-creator-report','second-creator-report','example-with--double-hyphen']){
    const row={...original,slug},url='https://afrotools.com/tools/afrostream/news/'+slug,html=server.__test.articlePage(row);
    assert.deepEqual(canonicals(html),[url]);assert.ok(html.includes('<meta property="og:url" content="'+url+'">'));
    assert.ok(html.includes('"url":"'+url+'"'));assert.match(html,/<h1>Synthetic creator report<\/h1>/);
    assert.match(html,/<meta name="robots" content="index,follow,max-image-preview:large">/);
    assert.equal((html.match(/id="as-article-bootstrap"/g)||[]).length,1);
  }
});
test('route metadata then template build: syndicated and insufficient-body stories retain noindex while getting only their own canonical',()=>{
  const server=renderer(templatesFromMaintainedBuilder());
  for(const row of [{...original,slug:'publisher-brief',external_id:'syndicated123',author:'Publisher',body:'Short source brief.'},{...original,slug:'short-original',body:'Short.'}]){
    const html=server.__test.articlePage(row);assert.deepEqual(canonicals(html),['https://afrotools.com/tools/afrostream/news/'+row.slug]);assert.match(html,/<meta name="robots" content="noindex,follow">/);
  }
});
test('route metadata then template build: scene and news collections preserve their existing canonical and usable story links',()=>{
  const templates=templatesFromMaintainedBuilder(),server=renderer(templates);
  for(const [view,file] of [['scene','index.html'],['news','news.html']]){
    const html=server.__test.collectionPage([original],1,view);assert.deepEqual(canonicals(html),canonicals(templates[file]));assert.equal(canonicals(html).length,1);assert.match(html,/synthetic-creator-report/);
  }
});
test('route metadata then template build: real handler returns one canonical for GET and preserves HEAD headers without a body',async()=>{
  const server=renderer(templatesFromMaintainedBuilder(),async()=>new Response(JSON.stringify([original]),{status:200}));
  const event={path:'/tools/afrostream/news/'+original.slug,httpMethod:'GET'};
  const get=await server.handler(event);assert.equal(get.statusCode,200);assert.deepEqual(canonicals(get.body),['https://afrotools.com/tools/afrostream/news/'+original.slug]);assert.equal(get.headers['X-Robots-Tag'],'index,follow,max-image-preview:large');
  const head=await server.handler({...event,httpMethod:'HEAD'});assert.equal(head.statusCode,200);assert.equal(head.body,'');assert.equal(head.headers['X-Robots-Tag'],get.headers['X-Robots-Tag']);
});
test('route metadata then template build: 404 and upstream failure have no generic canonical and keep genuine noindex error status',async()=>{
  for(const [status,fetch] of [[404,async()=>new Response('[]',{status:200})],[503,async()=>new Response('unavailable',{status:503})]]){
    const server=renderer(templatesFromMaintainedBuilder(),fetch),response=await server.handler({httpMethod:'GET',path:'/tools/afrostream/news/missing-synthetic'});
    assert.equal(response.statusCode,status);assert.deepEqual(canonicals(response.body),[]);assert.equal(response.headers['X-Robots-Tag'],'noindex,follow');assert.match(response.body,/<meta name="robots" content="noindex,follow">/);assert.equal(response.headers['Cache-Control'],'no-store');assert.match(response.body,/Back to the scene/);
  }
});
test('complete article block owns its canonical after repeated build transforms',()=>{
  const original=fs.readFileSync(path.join(ROOT,'tools/afrostream/article.html'),'utf8');
  const once=replaceHeadLinks(original,'/tools/afrostream/news',{});
  assert.equal(replaceHeadLinks(once,'/tools/afrostream/news',{}),once);
  const withPeers=replaceHeadLinks(original,'/tools/afrostream/news',{en:'/tools/afrostream/news','x-default':'/tools/afrostream/news'});
  assert.equal(replaceHeadLinks(withPeers,'/tools/afrostream/news',{en:'/tools/afrostream/news','x-default':'/tools/afrostream/news'}),withPeers);
  const block=/<!-- AS_ARTICLE_META_START -->([\s\S]*?)<!-- AS_ARTICLE_META_END -->/.exec(withPeers)[1];
  assert.deepEqual(canonicals(block),['https://afrotools.com/tools/afrostream/news']);
  assert.equal((withPeers.match(/hreflang=/g)||[]).length,2);
  assert.equal((block.match(/hreflang=/g)||[]).length,0);
});
test('ordinary page canonical, native alternates and fallback metadata remain normalized',()=>{
  const input='<html><head><title>Example</title><link rel="canonical" href="https://afrotools.com/old"><link rel="alternate" hreflang="fr" href="https://afrotools.com/old-fr"></head><body>Keep content</body></html>';
  const result=replaceHeadLinks(input,'/example/',{en:'/example/',fr:'/fr/example/','x-default':'/example/'});
  const expected='<html><head><title>Example</title><link rel="canonical" href="https://afrotools.com/example/">\n<link rel="alternate" hreflang="en" href="https://afrotools.com/example/">\n<link rel="alternate" hreflang="fr" href="https://afrotools.com/fr/example/">\n<link rel="alternate" hreflang="x-default" href="https://afrotools.com/example/">\n</head><body>Keep content</body></html>';
  assert.equal(result,expected);
  assert.equal(replaceHeadLinks(result,'/example/',{en:'/example/',fr:'/fr/example/','x-default':'/example/'}),result);
  const fallback=replaceHeadLinks(input,'/example/',{},{state:'english-fallback',fallbackRoute:'/example/'});
  assert.match(fallback,/<meta name="robots" content="noindex, follow">/);
  assert.match(fallback,/<meta name="afrotools-locale-coverage" content="english-fallback">/);
  assert.match(fallback,/<meta name="afrotools-locale-fallback" content="\/example\/">/);
});
test('partial, reversed, duplicate and body-only article markers do not redirect metadata placement',()=>{
  const start='<!-- AS_ARTICLE_META_START -->',end='<!-- AS_ARTICLE_META_END -->';
  for(const [head,body] of [[start,''],[end+start,''],[start+end+start+end,''],['',start+end],[start+end,start+end],[end,start],[start,end]]){
    const input='<html><head>'+head+'</head><body>'+body+'</body></html>';
    const result=replaceHeadLinks(input,'/example/',{});
    assert.equal(result,input.replace('</head>','<link rel="canonical" href="https://afrotools.com/example/">\n</head>'));
  }
});
