'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {assertHead,assertSourceBody}=require('./support/education-social-wrap-oracle');
const {rows}=require('./fixtures/education-social-wrap-recovery/native-current-main-baseline-five.json');
const baseline={title:'Source | AfroTools',canonical:'https://afrotools.com/education/',alternates:[['en','https://afrotools.com/education/']],robots:'',jsonLd:[],meta:{description:'Source description','og:title':'Source | AfroTools','og:description':'Source description','og:url':'https://afrotools.com/education/','og:image':'/existing.png'}};
const actual={...structuredClone(baseline),meta:{...baseline.meta,'twitter:title':baseline.title,'twitter:description':baseline.meta.description,'twitter:image':baseline.meta['og:image'],'twitter:card':'summary_large_image'},counts:Object.fromEntries(['description','og:title','og:description','og:url','og:image','twitter:card','twitter:title','twitter:description','twitter:image'].map(k=>[k,1]))};
test('social oracle rejects missing, duplicate and corrupted tags and changed route identity',()=>{
  assertHead(actual,baseline);
  for(const change of [v=>v.counts['twitter:title']=0,v=>v.counts['twitter:title']=2,v=>v.meta['twitter:description']='Changed',v=>v.meta['og:title']='Changed',v=>v.canonical='/wrong/',v=>v.alternates=[],v=>v.robots='noindex']) {
    const broken=structuredClone(actual);change(broken);assert.throws(()=>assertHead(broken,baseline));
  }
});
test('raw native body oracle rejects removed controls and changed public copy',()=>{
  for(const row of rows){assertSourceBody(row.raw_html,row.raw_html);assert.throws(()=>assertSourceBody(row.raw_html.replace('<h1>','<h1>Changed '),row.raw_html));}
  const html='<html><body><button id="clear">Clear</button></body></html>';
  assert.throws(()=>assertSourceBody(html.replace('<button id="clear">Clear</button>',''),html));
});
