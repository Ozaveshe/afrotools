'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const draft=process.argv.includes('--draft');
const root=draft?'C:/Users/Oza/.codex/worktrees/three-area-integration-20260909/afrotools':path.resolve(__dirname,'../../..');
const batch=draft?null:require('./math-1986-publishable-008.json');
const r=draft?null:batch.records[0];
const q=draft?null:require(path.join(root,'ops/jamb/source-pool.json')).questions.find(q=>q.id===r.id);
const svg=fs.readFileSync(draft?__dirname+'/jamb-1986-48-draft.svg':path.join(root,q.image.slice(1)),'utf8');
const arcs=[...svg.matchAll(/M 195 165 L ([\d.]+) ([\d.]+) A 140 140 0 0 1 ([\d.]+) ([\d.]+) Z/g)];
assert.equal(arcs.length,5);
const angles=[116,104,64,52,24];
let previous=[195,25];
for(let i=0;i<arcs.length;i++){
 const [,sx,sy,ex,ey]=arcs[i].map(Number),start=[sx,sy],end=[ex,ey];
 assert.ok(Math.hypot(start[0]-previous[0],start[1]-previous[1])<1e-5);
 for(const [x,y] of [start,end])assert.ok(Math.abs(Math.hypot(x-195,y-165)-140)<1e-5);
 const from=Math.atan2(sx-195,165-sy),to=Math.atan2(ex-195,165-ey);
 const degrees=((to-from)*180/Math.PI+360)%360;
 assert.ok(Math.abs(degrees-angles[i])<1e-5);
 assert.ok(svg.includes('>'+angles[i]+'°</text>'));
 previous=end;
}
assert.ok(Math.hypot(previous[0]-195,previous[1]-25)<1e-5);
const answer=900000*angles[1]/360;assert.equal(answer,260000);
if(!draft){
 const {questionFingerprint}=require(path.join(root,'scripts/lib/jamb-content-trust'));
 const {assertVisualAssetFiles}=require(path.join(root,'scripts/lib/jamb-visual-assets'));
 assert.equal(batch.records.length,1);assert.equal(questionFingerprint(q),r.content_sha256);
 assert.equal(q.year,1986);assert.equal(r.before.year,1987);assert.equal(r.population,900000);
 assert.deepEqual(r.sector_angles,angles);assert.match(q.question,/population of 0\.9 million/);
 assert.equal(q.explanation,r.explanation);assert.equal(q.ai_explanation,r.explanation);
 assert.doesNotMatch(q.explanation,/supplied compilation|Source note:/);
 assert.ok(r.presentation_history.some(entry=>/supplied compilation prints 109 million/.test(entry.previous_explanation)));
 const parse=v=>{const m=v.match(/^(\d+) × 10⁴$/);assert.ok(m);return Number(m[1])*10000;};
 assert.deepEqual(Object.entries(q.options).filter(([,v])=>parse(v)===answer).map(([k])=>k),[q.answer]);
 assert.equal(assertVisualAssetFiles(root,[q],require(path.join(root,'data/jamb/review-ledger.json'))),1);
}
console.log(JSON.stringify({passed:true,count:1,question_ids:[draft?'mathematics-1987-48-e42578101923':q.id]}));
