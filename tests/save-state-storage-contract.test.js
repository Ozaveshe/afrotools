'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const { buildSaveState, OUTPUTS, OWNER } = require('../scripts/build-save-state');
const ROOT = path.resolve(__dirname, '..');
function fixture(id = 'existing') { return { id, title: 'Synthetic item', data: { value: 'synthetic' }, thumbnail: null, createdAt: 1, updatedAt: 2 }; }
function harness(file, initial = null) {
  let raw = initial, writes = 0, readsDenied = false, writesDenied = false, nextTimer = 0;
  const timers = new Map(), events = [], logs = [];
  const root = { document: { documentElement: { lang: 'en' } }, localStorage: {
    getItem() { if (readsDenied) throw Error('PRIVATE_SENTINEL'); return raw; },
    setItem(key, value) { writes++; if (writesDenied) throw Error('PRIVATE_SENTINEL'); raw = value; }
  }, setInterval(fn) { const id = nextTimer++; timers.set(id, fn); return id; }, clearInterval(id) { timers.delete(id); }, dispatchEvent(event) { events.push(event); }, CustomEvent: function(type, value) { this.type = type; this.detail = value.detail; } };
  const context = { window: root, console: {warn: x => logs.push(x),error:x=>logs.push(x)}, setInterval:root.setInterval,clearInterval:root.clearInterval };
  const source = fs.readFileSync(path.join(ROOT, file), 'utf8');
  vm.runInNewContext(file === OWNER ? source + '\nwindow.SaveState=createSaveStateApi(window).SaveState;' : source.replace(/export\s*\{[^}]*\}\s*;?/g, ''), context);
  return { API: root.SaveState, root, timers, events, logs, raw: () => raw, writes: () => writes, denyRead: () => { readsDenied = true; }, denyWrite: () => { writesDenied = true; }, allowWrite: () => { writesDenied = false; } };
}
function rejectsCode(fn, code) { assert.throws(fn, failure => failure.name === 'SaveStateError' && failure.code === code && !failure.message.includes('PRIVATE_SENTINEL')); }
for (const file of [OWNER, ...OUTPUTS]) {
  test(file + ': CRUD preserves schema, stable IDs and creation time', () => {
    const h = harness(file), store = new h.API('synthetic'); const first = store.save({title:'First',data:{number:1}});
    const updated = store.save({id:first.id,title:'Updated',data:{number:2}});
    assert.equal(updated.id,first.id);assert.equal(updated.createdAt,first.createdAt);assert.equal(store.getAll().length,1);assert.equal(store.load(first.id).data.number,2);
    assert.equal(store.delete('missing'),false);assert.equal(h.writes(),2);assert.equal(store.delete(first.id),true);assert.equal(store.getAll().length,0);
  });
  test(file + ': denied write throws once and never evicts an existing record', () => {
    const raw=JSON.stringify([fixture('one'),fixture('two')]),h=harness(file,raw),store=new h.API('synthetic');h.denyWrite();
    rejectsCode(()=>store.save({title:'New',data:{}}),'WRITE_FAILED');assert.equal(h.raw(),raw);assert.equal(h.writes(),1);assert.equal(store.lastError.code,'WRITE_FAILED');assert.equal(h.logs.length,0);
    h.allowWrite();store.save({title:'Retry',data:{}});assert.equal(store.getAll().length,3);assert.equal(store.lastError,null);
  });
  for (const raw of ['{broken','null','{}',JSON.stringify([fixture(),fixture()]),JSON.stringify([{id:'bad'}])]) test(file + ': malformed storage is preserved ' + raw.slice(0,8), () => {
    const h=harness(file,raw),store=new h.API('synthetic');
    for(const call of [()=>store.save({title:'New',data:{}}),()=>store.delete('existing'),()=>store.clear(),()=>store.load('existing'),()=>store.getAll()])rejectsCode(call,'INVALID_STORAGE');
    assert.equal(h.raw(),raw);assert.equal(h.writes(),0);
  });
  test(file + ': unreadable storage is not treated as an empty collection',()=>{
    const raw=JSON.stringify([fixture()]),h=harness(file,raw),store=new h.API('synthetic');h.denyRead();rejectsCode(()=>store.save({data:{}}),'READ_FAILED');assert.equal(h.raw(),raw);assert.equal(h.writes(),0);
  });
  test(file + ': failed delete and clear preserve the complete collection',()=>{
    const raw=JSON.stringify([fixture()]),h=harness(file,raw),store=new h.API('synthetic');h.denyWrite();rejectsCode(()=>store.delete('existing'),'WRITE_FAILED');assert.equal(h.raw(),raw);rejectsCode(()=>store.clear(),'WRITE_FAILED');assert.equal(h.raw(),raw);
  });
  test(file + ': capacity blocks additions but permits explicit updates and deletion',()=>{
    const raw=JSON.stringify([fixture()]),h=harness(file,raw),store=new h.API('synthetic',{maxFree:1});rejectsCode(()=>store.save({data:{}}),'LIMIT_REACHED');assert.equal(h.raw(),raw);assert.equal(h.writes(),0);store.save({id:'existing',title:'Updated',data:{value:3}});assert.equal(store.getAll().length,1);store.delete('existing');store.save({data:{}});assert.equal(store.getAll().length,1);
  });
  test(file + ': unserializable or missing data cannot corrupt a valid collection',()=>{
    const raw=JSON.stringify([fixture()]),h=harness(file,raw),store=new h.API('synthetic'),cycle={};cycle.self=cycle;
    for(const input of [{data:cycle},{title:'Missing'},{data:()=>{}},{data:{},id:5}])rejectsCode(()=>store.save(input),'INVALID_RECORD');assert.equal(h.raw(),raw);assert.equal(h.writes(),0);
  });
  test(file + ': serialization runs once per save',()=>{
    const h=harness(file),store=new h.API('synthetic');let calls=0;store.save({data:{toJSON(){calls++;return{value:calls}}}});assert.equal(calls,1);assert.equal(store.getAll()[0].data.value,1);
  });
  test(file + ': autosave signals a safe failure and never advances the saved ID',()=>{
    const h=harness(file),store=new h.API('synthetic');h.denyWrite();const stop=store.enableAutoSave(()=>({title:'Test',data:{}}));h.timers.get(0)();assert.equal(store._currentId,null);assert.equal(h.events[0].detail.code,'WRITE_FAILED');assert.deepEqual(Object.keys(h.events[0].detail).sort(),['code','toolId']);assert.equal(h.logs.length,0);stop.stop();assert.equal(h.timers.size,0);
  });
  test(file + ': callback errors never expose content through logs or error objects',()=>{
    const h=harness(file);let reported;const store=new h.API('synthetic',{onError:failure=>{reported=failure;throw Error('PRIVATE_SENTINEL')}});store.enableAutoSave(()=>{throw Error('PRIVATE_SENTINEL')});assert.doesNotThrow(()=>h.timers.get(0)());assert.equal(reported.code,'AUTOSAVE_FAILED');assert(!reported.message.includes('PRIVATE_SENTINEL'));assert.equal(h.logs.length,0);
  });
  test(file + ': error copy is localized without including submitted data',()=>{
    const h=harness(file);for(const locale of ['en','fr','sw']){const text=h.API.message({code:'WRITE_FAILED',message:'PRIVATE_SENTINEL'},locale);assert(text.length>20);assert(!text.includes('PRIVATE_SENTINEL'));}assert.notEqual(h.API.message({code:'WRITE_FAILED'},'en'),h.API.message({code:'WRITE_FAILED'},'fr'));
  });
}
test('all shared SaveState runtimes are generated from the readable owner',async()=>{await buildSaveState({check:true});});
