'use strict';
const assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const ROOT=path.resolve(__dirname,'..');
const cohort=require('../data/image-generation/placement-review-cohort.json');
const decisions=require('../data/image-generation/placement-decisions.json');
const library=require('../data/image-generation/image-library.json');
assert.equal(cohort.total,792);assert.equal(decisions.images.length,792);assert.equal(new Set(decisions.images.map(x=>x.path)).size,792);
for(const d of decisions.images){const original=cohort.images.find(x=>x.path===d.path),asset=library.images.find(x=>x.path===d.path);assert.equal(d.sha256,original.sha256);assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT,d.path))).digest('hex'),d.sha256);assert.ok(d.owner&&d.reason);assert.notEqual(asset.status,'unassigned');if(d.decision==='active')assert.ok(asset.placements.length,'Active must have real binding '+d.path);if(d.decision==='reserved-catalogue'){const [file,id]=d.owner.split('#');assert.ok(fs.readFileSync(path.join(ROOT,file),'utf8').split(/\r?\n/).some(line=>line.startsWith(id+',')));}}
for(const d of decisions.images.filter(x=>x.family==='blog')){const html=fs.readFileSync(path.join(ROOT,d.owner),'utf8');assert.ok(html.includes('content="https://afrotools.com'+d.path+'"'));}
assert.equal(require('../scripts/apply-reviewed-blog-images').apply(true),0);
assert.equal(library.summary.unassigned,0);
console.log('PASS: all 792 original hashes retained, explicit decisions, real active bindings, exact candidate owners, idempotent blog refresh.');
