'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'..');
const target=process.argv.includes('--dist')?path.join(root,'dist'):root;
const config=require('../data/localization/fr-document-pdf-parity.json');
const artwork=require('../data/localization/fr-document-pdf-artwork.json');
let pages=0,breadcrumbs=0;
function inspect(schema){
 if(Array.isArray(schema)){schema.forEach(inspect);return;}
 if(!schema||typeof schema!=='object')return;
 if(schema['@type']==='BreadcrumbList'){
  breadcrumbs++;
  for(const item of schema.itemListElement||[])for(const key of ['item','url'])assert(!['https://afrotools.com/','https://afrotools.com/tools/','/','/tools/'].includes(item[key]),'English breadcrumb parent remains');
 }
 Object.values(schema).forEach(inspect);
}
for(const app of config.apps){
 const html=fs.readFileSync(path.join(target,app.frenchFile),'utf8');
 const expected='https://afrotools.com'+artwork.rows.find(row=>row.id===app.id).asset;
 for(const field of ['og:image','twitter:image']){
  const meta=[...html.matchAll(/<meta\b[^>]*>/gi)].find(match=>new RegExp('(?:name|property)=["\\\']'+field+'["\\\']','i').test(match[0]));
  assert(meta&&meta[0].includes('content="'+expected+'"'),app.id+' '+field+' artwork mismatch');
 }
 const before=breadcrumbs;
 for(const block of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi))inspect(JSON.parse(block[1]));
 // The category landing page has no breadcrumb in its source contract.
 if(app.id!=='document-pdf')assert(breadcrumbs>before,app.id+' has no breadcrumb');pages++;
}
console.log(`${pages} physical French document pages: artwork and ${breadcrumbs} breadcrumb lists passed (${target}).`);
