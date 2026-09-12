'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname, '../assets/js/pages/jamb-reviewed-page-figures.js'), 'utf8');
const tick = () => new Promise(resolve => setImmediate(resolve));
function fixture(count) {
  const pending = [], events = {}, revoked = [];
  const questions = Array.from({length:count}, (_,i)=>({id:String(i),review:{content_sha256:'hash'+i}}));
  const hosts = questions.map((q,i)=>{
    const details = {hidden:true,style:{removeProperty(){}}};
    return {dataset:{reviewedFigure:'hash'+i},details,textContent:'waiting',closest:()=>({dataset:{reviewedQuestion:q.id},querySelector:()=>details}),replaceChildren(img){this.img=img;}};
  });
  vm.runInNewContext(source, {AbortController,document:{querySelectorAll:()=>hosts,createElement:()=>({style:{}})},window:{location:{pathname:'/jamb/mathematics/1984/'},addEventListener:(name,fn)=>events[name]=fn},AfroJAMB:{QuestionTrust:{loadPool:async(url)=>{assert.equal(url,'/data/jamb/pools/mathematics.json');return {questions,review_revision:'revision'};}},ReviewedFigure:{load:(q,revision,signal)=>new Promise((resolve,reject)=>pending.push({id:q.id,resolve:()=>resolve({url:'blob:'+q.id,alt:'Diagram',revoke:()=>revoked.push(q.id)}),reject,signal}))}}});
  return {pending,events,revoked,hosts};
}
test('slow and failed diagrams do not block other questions; answers stay gated', async()=>{
  const f=fixture(6);await tick();assert.equal(f.pending.length,4);
  assert.ok(f.hosts.every(h=>h.details.hidden));
  f.pending[1].reject(new Error('checksum mismatch'));await tick();
  assert.equal(f.pending.length,5);assert.equal(f.hosts[1].details.hidden,true);assert.equal(f.hosts[1].img,undefined);
  f.pending[2].resolve();await tick();assert.equal(f.pending.length,6);
  assert.equal(f.hosts[2].details.hidden,false);assert.equal(f.hosts[0].details.hidden,true);
  for(const i of [0,3,4,5]) f.pending[i].resolve();await tick();
  assert.equal(f.hosts.filter(h=>h.img).length,5);
  f.events.pagehide();assert.equal(f.revoked.length,5);
});
test('navigation cancels queued work and revokes results that arrive late', async()=>{
  const f=fixture(8);await tick();f.events.pagehide();
  assert.ok(f.pending.every(p=>p.signal.aborted));
  f.pending.forEach(p=>p.resolve());await tick();
  assert.equal(f.pending.length,4);assert.equal(f.revoked.length,4);
  assert.ok(f.hosts.every(h=>h.details.hidden&&!h.img));
});
