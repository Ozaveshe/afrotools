'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
const {imageSize}=require('../scripts/lib/image-size');
const ROOT=path.resolve(__dirname,'..');
const bindings=require('../data/image-generation/blog-artwork-bindings.json').images;
const generatedArtwork=new Map(require('../data/image-generation/blog-generated-2026-10-09.json').images.map(row=>[row.slug,row]));

test('reviewed blog imagery retains exact subjects, hashes and explicit illustration labels',()=>{
 assert.equal(new Set(bindings.map(row=>row.file+'#'+row.route)).size,bindings.length);
 for(const row of bindings){
  const file=path.join(ROOT,row.path),bytes=fs.readFileSync(file);
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),row.sha256);
  assert.deepEqual(imageSize(file),{w:row.width,h:row.height});
  const generated=row.generation_slug&&generatedArtwork.get(row.generation_slug);
  if(row.generation_slug){assert.ok(generated&&generated.prompt.length>200);assert.equal(generated.source,'built-in image_gen');assert.ok(generated.routes.includes(row.route));}
  else assert.equal(row.original_prompt,null,'Do not reconstruct historical generation prompts');
  const html=fs.readFileSync(path.join(ROOT,row.file),'utf8');
  if(row.placement==='article-hero'){
   const figures=html.match(/<figure class="article-featured-img" data-reviewed-blog-image="true"[^>]*>[\s\S]*?<\/figure>/g)||[];
   assert.equal(figures.length,1,row.file);
   assert.ok(figures[0].includes('src="'+row.path+'"'));
   assert.ok(figures[0].includes('<figcaption>'+row.caption+'</figcaption>'));
   assert.ok(figures[0].includes('width="'+row.width+'" height="'+row.height+'"'));
   if(generated){assert.match(row.caption,/AI-generated|générée par IA/);for(const v of generated.variants)assert.ok(figures[0].includes(`${v.path} ${v.width}w`));}
   else assert.ok(!figures[0].includes('AI-generated'),'Legacy illustration review is not generation evidence');
   assert.ok(html.includes('href="https://afrotools.com'+row.route+'"'),'Canonical route retained');
  }else{
   const cards=[...html.matchAll(/<article\b[^>]*>[\s\S]*?<\/article>/g)].map(m=>m[0]).filter(card=>card.includes('href="'+row.route+'"'));
   assert.equal(cards.length,1);
   assert.ok(cards[0].includes('src="'+row.path+'"'));
   assert.ok(!cards[0].includes('/assets/img/og-home.png'));
  }
  if(row.update_social){assert.ok(html.includes('content="https://afrotools.com'+row.path+'"'));for(const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)){const s=JSON.parse(m[1]);if(['Article','BlogPosting','WebPage'].includes(s['@type']))assert.equal(s.image,'https://afrotools.com'+row.path);}}
 }
});

test('native blog image owner is idempotent',()=>{
 assert.equal(require('../scripts/apply-reviewed-blog-images').apply(true),0);
});

test('later OG fallback passes preserve reviewed article imagery around embedded tools',()=>{
 const {applyFallbacks,getMetaContent}=require('../scripts/apply-og-fallbacks');
 for(const row of bindings.filter(row=>row.placement==='article-hero'&&row.update_social)){
  const file=path.join(ROOT,row.file),html=fs.readFileSync(file,'utf8');
  const result=applyFallbacks(html,file),url='https://afrotools.com'+row.path;
  assert.equal(getMetaContent(result.html,'property','og:image'),url,row.file);
  assert.equal(getMetaContent(result.html,'name','twitter:image'),url,row.file);
  assert.equal(getMetaContent(result.html,'property','og:image:width'),String(row.width),row.file);
  assert.equal(getMetaContent(result.html,'property','og:image:height'),String(row.height),row.file);
  for(const match of result.html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)){
   const schema=JSON.parse(match[1]);
   if(['Article','BlogPosting','WebPage','WebApplication'].includes(schema['@type'])&&schema.image)assert.equal(schema.image,url,row.file);
  }
 }
});
