'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ROOT=process.env.AFROTOOLS_ARTICLE_CANONICAL_TEST_ROOT||path.join(__dirname,'..');
const U=require(path.join(ROOT,'tools/afrostream/news-utils.js'));
function templatesFromMaintainedBuilder(){
  const filename=path.join(ROOT,'scripts/build-afrostream-templates.js');let output;
  const context=vm.createContext({__dirname:path.dirname(filename),console:{log(){}},require(name){
    if(name==='node:path')return path;
    if(name==='node:fs')return {readFileSync:fs.readFileSync.bind(fs),writeFileSync(file,bytes){assert.equal(path.resolve(file),path.resolve(ROOT,'netlify/functions/_shared/afrostream-templates.json'));assert.equal(output,undefined);output=bytes;}};
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
test('maintained builder preserves exactly one static fallback canonical inside replaceable article metadata',()=>{
  const templates=templatesFromMaintainedBuilder(),html=templates['article.html'];
  const block=/<!-- AS_ARTICLE_META_START -->([\s\S]*?)<!-- AS_ARTICLE_META_END -->/.exec(html)[1];
  assert.deepEqual(canonicals(html),['https://afrotools.com/tools/afrostream/news']);
  assert.deepEqual(canonicals(block),canonicals(html));assert.match(block,/noindex,follow/);
  assert.match(html,/Read the scene/);assert.match(html,/RSS feed/);
});
test('actual SSR replaces fallback with exactly one matching article canonical, OG URL and schema identity',()=>{
  const server=renderer(templatesFromMaintainedBuilder());
  for(const slug of ['synthetic-creator-report','second-creator-report','example-with--double-hyphen']){
    const row={...original,slug},url='https://afrotools.com/tools/afrostream/news/'+slug,html=server.__test.articlePage(row);
    assert.deepEqual(canonicals(html),[url]);assert.ok(html.includes('<meta property="og:url" content="'+url+'">'));
    assert.ok(html.includes('"url":"'+url+'"'));assert.match(html,/<h1>Synthetic creator report<\/h1>/);
    assert.match(html,/<meta name="robots" content="index,follow,max-image-preview:large">/);
    assert.equal((html.match(/id="as-article-bootstrap"/g)||[]).length,1);
  }
});
test('syndicated and insufficient-body stories retain noindex while getting only their own canonical',()=>{
  const server=renderer(templatesFromMaintainedBuilder());
  for(const row of [{...original,slug:'publisher-brief',external_id:'syndicated123',author:'Publisher',body:'Short source brief.'},{...original,slug:'short-original',body:'Short.'}]){
    const html=server.__test.articlePage(row);assert.deepEqual(canonicals(html),['https://afrotools.com/tools/afrostream/news/'+row.slug]);assert.match(html,/<meta name="robots" content="noindex,follow">/);
  }
});
test('scene and news collections preserve their existing canonical and usable story links',()=>{
  const templates=templatesFromMaintainedBuilder(),server=renderer(templates);
  for(const [view,file] of [['scene','index.html'],['news','news.html']]){
    const html=server.__test.collectionPage([original],1,view);assert.deepEqual(canonicals(html),canonicals(templates[file]));assert.equal(canonicals(html).length,1);assert.match(html,/synthetic-creator-report/);
  }
});
test('real handler returns one canonical for GET and preserves HEAD headers without a body',async()=>{
  const server=renderer(templatesFromMaintainedBuilder(),async()=>new Response(JSON.stringify([original]),{status:200}));
  const event={path:'/tools/afrostream/news/'+original.slug,httpMethod:'GET'};
  const get=await server.handler(event);assert.equal(get.statusCode,200);assert.deepEqual(canonicals(get.body),['https://afrotools.com/tools/afrostream/news/'+original.slug]);assert.equal(get.headers['X-Robots-Tag'],'index,follow,max-image-preview:large');
  const head=await server.handler({...event,httpMethod:'HEAD'});assert.equal(head.statusCode,200);assert.equal(head.body,'');assert.equal(head.headers['X-Robots-Tag'],get.headers['X-Robots-Tag']);
});
test('404 and upstream failure have no generic canonical and keep genuine noindex error status',async()=>{
  for(const [status,fetch] of [[404,async()=>new Response('[]',{status:200})],[503,async()=>new Response('unavailable',{status:503})]]){
    const server=renderer(templatesFromMaintainedBuilder(),fetch),response=await server.handler({httpMethod:'GET',path:'/tools/afrostream/news/missing-synthetic'});
    assert.equal(response.statusCode,status);assert.deepEqual(canonicals(response.body),[]);assert.equal(response.headers['X-Robots-Tag'],'noindex,follow');assert.match(response.body,/<meta name="robots" content="noindex,follow">/);assert.equal(response.headers['Cache-Control'],'no-store');assert.match(response.body,/Back to the scene/);
  }
});