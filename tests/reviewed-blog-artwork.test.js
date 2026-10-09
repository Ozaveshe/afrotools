'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
const {imageSize}=require('../scripts/lib/image-size');
const ROOT=path.resolve(__dirname,'..');
const bindings=require('../data/image-generation/blog-artwork-bindings.json').images;

test('reviewed blog imagery retains exact subjects, hashes and explicit illustration labels',()=>{
 assert.equal(new Set(bindings.map(row=>row.file+'#'+row.route)).size,bindings.length);
 for(const row of bindings){
  const file=path.join(ROOT,row.path),bytes=fs.readFileSync(file);
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),row.sha256);
  assert.deepEqual(imageSize(file),{w:row.width,h:row.height});
  assert.equal(row.original_prompt,null,'Do not reconstruct historical generation prompts');
  const html=fs.readFileSync(path.join(ROOT,row.file),'utf8');
  if(row.placement==='article-hero'){
   const figures=html.match(/<figure class="article-featured-img" data-reviewed-blog-image="true"[^>]*>[\s\S]*?<\/figure>/g)||[];
   assert.equal(figures.length,1,row.file);
   assert.ok(figures[0].includes('src="'+row.path+'"'));
   assert.ok(figures[0].includes('<figcaption>'+row.caption+'</figcaption>'));
   assert.ok(figures[0].includes('width="'+row.width+'" height="'+row.height+'"'));
   assert.ok(!figures[0].includes('AI-generated'),'Legacy illustration review is not generation evidence');
   assert.ok(html.includes('href="https://afrotools.com'+row.route+'"'),'Canonical route retained');
  }else{
   const cards=[...html.matchAll(/<article\b[^>]*>[\s\S]*?<\/article>/g)].map(m=>m[0]).filter(card=>card.includes('href="'+row.route+'"'));
   assert.equal(cards.length,1);
   assert.ok(cards[0].includes('src="'+row.path+'"'));
   assert.ok(!cards[0].includes('/assets/img/og-home.png'));
  }
 }
});

test('native blog image owner is idempotent',()=>{
 assert.equal(require('../scripts/apply-reviewed-blog-images').apply(true),0);
});
