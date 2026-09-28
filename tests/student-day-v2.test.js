'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const api=require('../assets/js/lib/student-day');
// Exact API and controller snapshots from 826abe8, before the v2 storage boundary.
const oldApi=require('./fixtures/student-day-v1/api');
const oldController=fs.readFileSync(path.join(__dirname,'fixtures/student-day-v1/controller.js'),'utf8');
const newController=fs.readFileSync(path.join(__dirname,'../assets/js/pages/student-day.js'),'utf8');
function storage(initial={}){
 const records=new Map(Object.entries(initial)),writes=[];
 return {records,writes,denied:false,full:false,getItem(key){if(this.denied)throw Error('Storage denied');return records.has(key)?records.get(key):null;},setItem(key,value){if(this.full)throw Error('Storage full');writes.push(key);records.set(key,value);}};
}
function task(id='ordinary',extra={}){return {id,subject:'Biology',date:'2026-09-28',minutes:25,doneAt:null,...extra};}
function legacyPlan(){return oldApi.normalize({version:1,activeId:'deck',tasks:[task('done',{doneAt:'2026-09-27T08:00:00.000Z'}),task('deck',{deckId:'saved-deck'}),task('ssce',{sourceId:'ssce-practice',revision:{bankId:'ssce-foundations-2026-09',locale:'fr',ids:['m3','m1']}})]});}
function revision(overrides={}){return {bankId:'afrotools-original-jamb-practice-v1',locale:'en',ids:['ato-math-v1-03','ato-math-v1-01'],contentHashes:['a'.repeat(64),'b'.repeat(64)],reviewRevision:'c'.repeat(64),...overrides};}
function addJamb(state=api.empty(),r=revision(),date='2026-09-29',subject='mathematics'){return api.scheduleJambRevision(state,r,subject,date);}
function clone(value){return JSON.parse(JSON.stringify(value));}

test('old-reader fixtures remain exact frozen API and controller sources from 826abe8',()=>{
 for(const [file,hash]of Object.entries({'api.js':'ed8a0a12328ebcaed3951a48f64ad799cf38832f0709d2296a3fa6e72fcd96a4','controller.js':'c9acde9561b5896f107f92f82309948d3fe9ab85b720529b189a123b290f4e7f'}))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname,'fixtures/student-day-v1',file))).digest('hex'),hash);
});

test('v1 migrates on the first successful mutation while legacy bytes, completed work, active deck and SSCE context remain intact',()=>{
 const original=JSON.stringify(legacyPlan()),store=storage({[api.legacyKey]:original});
 const state=api.read(store);assert.equal(state.version,2);assert.equal(store.getItem(api.key),null);assert.equal(state.activeId,'deck');
 const saved=api.write(store,addJamb(state));assert.equal(store.getItem(api.legacyKey),original);assert.deepEqual(store.writes,[api.key]);
 assert.deepEqual(saved.tasks.slice(0,3),state.tasks);assert.equal(api.read(store).activeId,'deck');assert.equal(api.read(store).tasks.length,4);
 assert.equal(api.revisionHref(saved.tasks[2]),'/fr/tools/pratique-waec-neco/#revision=ssce');
 assert.equal(api.revisionHref(saved.tasks[3]),'/jamb/original-practice/#revision='+encodeURIComponent(saved.tasks[3].id));
});
test('a present corrupt v2 store never falls back to valid legacy data or gets overwritten',()=>{
 for(const raw of ['', 'broken', 'null', JSON.stringify(legacyPlan()), JSON.stringify({version:2,tasks:[],activeId:null,extra:true}).replace('[]','[{}]')]){
  const old=JSON.stringify(legacyPlan()),store=storage({[api.key]:raw,[api.legacyKey]:old});
  assert.throws(()=>api.read(store));assert.throws(()=>api.write(store,api.empty()));assert.equal(store.getItem(api.key),raw);assert.equal(store.getItem(api.legacyKey),old);assert.equal(store.writes.length,0);
 }
});
test('denied reads and quota failures cannot create a false migration or replace either saved plan',()=>{
 const old=JSON.stringify(legacyPlan()),store=storage({[api.legacyKey]:old});store.denied=true;
 assert.throws(()=>api.read(store),/denied/);assert.throws(()=>api.write(store,api.empty()),/denied/);store.denied=false;store.full=true;
 assert.throws(()=>api.write(store,addJamb(api.read(store))),/full/);assert.equal(store.getItem(api.key),null);assert.equal(store.getItem(api.legacyKey),old);assert.equal(store.writes.length,0);
});
test('JAMB deduplication uses the exact pending date, subject, ordered IDs and hashes, while additive bank revisions do not duplicate tasks',()=>{
 const input=revision();let state=addJamb(api.empty(),input);const firstId=state.tasks[0].id;
 state=addJamb(state,revision({reviewRevision:'d'.repeat(64)}));assert.equal(state.tasks.length,1);
 input.ids[0]='ato-math-v1-12';input.contentHashes[0]='e'.repeat(64);assert.deepEqual(state.tasks[0].revision.ids,['ato-math-v1-03','ato-math-v1-01']);
 state=addJamb(state,revision({ids:['ato-math-v1-01','ato-math-v1-03'],contentHashes:['b'.repeat(64),'a'.repeat(64)]}));
 state=addJamb(state,revision({contentHashes:['f'.repeat(64),'b'.repeat(64)]}));
 state=addJamb(state,revision(),'2026-09-30');
 state=addJamb(state,revision({ids:['ato-english-v1-03','ato-english-v1-01']}),'2026-09-29','english');assert.equal(state.tasks.length,5);
 state=api.change(state,firstId,'done');state=addJamb(state);assert.equal(state.tasks.length,6);assert.ok(state.tasks[0].doneAt);assert.equal(new Set(state.tasks.map(t=>t.id)).size,6);
});
test('JAMB metadata is validated before writes and cannot cross subjects or source types',()=>{
 const invalid=[{bankId:'other'},{locale:'fr'},{ids:[]},{ids:['ato-math-v1-01','ato-math-v1-01']},{ids:['../question']},{ids:['ato-english-v1-03','ato-english-v1-01']},{ids:['ato-math-v1-00','ato-math-v1-01']},{ids:Array.from({length:13},(_,i)=>'ato-math-v1-'+String(i+1).padStart(2,'0')),contentHashes:Array(13).fill('a'.repeat(64))},{contentHashes:[]},{contentHashes:['A'.repeat(64),'b'.repeat(64)]},{reviewRevision:'old'}];
 invalid.forEach(r=>assert.throws(()=>addJamb(api.empty(),revision(r)),/revision/));
 assert.throws(()=>addJamb(api.empty(),revision(),'2026-09-29','Physics'),/revision/);
 const valid=addJamb();for(const sourceId of ['ssce-practice','other']){const bad=clone(valid);bad.tasks[0].sourceId=sourceId;assert.throws(()=>api.normalize(bad),/revision/);}
 const bad=clone(valid);delete bad.tasks[0].revision;assert.throws(()=>api.normalize(bad),/revision/);
 assert.throws(()=>api.normalize({...valid,version:1}),/revision/);
});
test('mixed backups round-trip and legacy imports keep current JAMB revisions and current task IDs',()=>{
 let current=addJamb(api.normalize(legacyPlan()));current=api.change(current,current.tasks[3].id,'start');
 const incoming={version:1,tasks:[task('from-backup',{doneAt:'2026-09-26T08:00:00Z'}),task(current.tasks[3].id)],activeId:null};
 const merged=api.mergeBackup(current,incoming);assert.equal(merged.tasks.length,5);assert.equal(merged.activeId,current.activeId);assert.deepEqual(merged.tasks[3],current.tasks[3]);
 assert.deepEqual(api.normalize(clone(merged)),merged);assert.deepEqual(api.mergeBackup(merged,incoming),merged);
 const bad=clone(incoming);bad.tasks[0].date='2026-02-30';assert.throws(()=>api.mergeBackup(merged,bad));assert.deepEqual(current.tasks[3],merged.tasks[3]);
});
test('the migrated plan still supports weekly imports, SSCE revision movement and deck completion',()=>{
 let state=api.normalize(legacyPlan());state=api.plan(state,[{id:'week-math',day:'Tuesday',subject:'Mathematics'}],'2026-09-28',30);
 state=api.scheduleRevision(state,{bankId:'ssce-foundations-2026-09',locale:'sw',ids:['m1']},'WAEC/NECO Mathematics','2026-09-29');
 state=api.change(state,'ssce','move','2026-09-30');state=api.change(state,'deck','done');
 assert.equal(state.tasks.length,5);assert.equal(state.activeId,null);assert.equal(state.tasks[1].deckId,'saved-deck');assert.deepEqual(state.tasks[2].revision.ids,['m3','m1']);assert.equal(state.tasks[2].date,'2026-09-30');
});

class Element{
 constructor(tag){this.tagName=tag;this.children=[];this.handlers={};this._text='';this.disabled=false;this.files=[];}
 set textContent(value){this._text=String(value);this.children=[];}
 get textContent(){return this._text+this.children.map(child=>child.textContent).join('');}
 append(...children){children.forEach(child=>{child.parent=this;this.children.push(child);});}
 prepend(...children){children.forEach(child=>child.parent=this);this.children.unshift(...children);}
 replaceChildren(...children){this.children=[];this._text='';this.append(...children);}
 setAttribute(key,value){this[key]=value;}
 addEventListener(type,handler){(this.handlers[type]||(this.handlers[type]=[])).push(handler);}
 focus(){}
 querySelector(selector){return walk(this).find(el=>selector.startsWith('.')?el.className===selector.slice(1):el.tagName===selector)||null;}
 async fire(type,event={}){if(this.disabled)return;for(const handler of this.handlers[type]||[])await handler.call(this,{preventDefault(){},...event});}
 click(){this.clicked=true;return this.fire('click');}
}
function walk(root){return root.children.flatMap(child=>[child,...walk(child)]);}
let nextUuid=0;
function ui(store,version='new'){
 const host=new Element('section'),events={},downloads=[];
 const window={AfroTools:{studentDay:version==='old'?oldApi:api},addEventListener(type,fn){(events[type]||(events[type]=[])).push(fn);},dispatchEvent(event){for(const fn of events[event.type]||[])fn(event);}};
 const document={readyState:'complete',createElement:tag=>new Element(tag),querySelectorAll:()=>[host]};
 vm.runInNewContext(version==='old'?oldController:newController,{window,document,localStorage:store,crypto:{randomUUID:()=>version+'-uuid-'+nextUuid++},CustomEvent:class{constructor(type){this.type=type;}},Blob,URL:{createObjectURL(blob){downloads.push(blob);return 'blob:synthetic';},revokeObjectURL(){}},setTimeout(){}});
 return {host,events,downloads,button(label){const found=walk(host).find(el=>el.tagName==='button'&&el.textContent===label);assert.ok(found,'Button exists: '+label);return found;},status(){return host.querySelector('.sd-status').textContent;},async add(subject){const form=host.querySelector('.sd-add');walk(form).find(el=>el.type==='text').value=subject;await form.fire('submit');},async restore(state){const input=walk(host).find(el=>el.type==='file');input.files=[{size:100,text:async()=>JSON.stringify(state)}];await input.fire('change');},event(type,value){window.dispatchEvent({type,...value});}};
}
test('frozen already-open v1 readers can complete, move and import without changing the v2 canonical plan',async()=>{
 const old=JSON.stringify(legacyPlan()),store=storage({[api.legacyKey]:old}),tab=ui(store,'old');
 api.write(store,addJamb(api.read(store)));const canonical=store.getItem(api.key);
 await tab.button('Finish this session').click();assert.equal(store.getItem(api.key),canonical);
 const date=walk(tab.host).find(el=>el.type==='date'&&el.value==='2026-09-28');date.value='2026-10-02';
 await tab.button('Move session').click();assert.equal(store.getItem(api.key),canonical);
 await tab.restore({version:1,tasks:[task('legacy-import')],activeId:null});assert.equal(store.getItem(api.key),canonical);assert.notEqual(store.getItem(api.legacyKey),old);
 const fresh=ui(store,'old');await fresh.button('Mark done').click();assert.equal(store.getItem(api.key),canonical);assert.equal(api.read(store).tasks.length,4);
});
test('current controllers re-read before completing, moving and importing, retaining another tab additions',async()=>{
 const store=storage({[api.key]:JSON.stringify(api.normalize({version:1,tasks:[task()],activeId:null}))}),tab=ui(store);
 let state=addJamb(api.read(store));api.write(store,state);await tab.button('Mark done').click();assert.equal(api.read(store).tasks.length,2);assert.ok(api.read(store).tasks[0].doneAt);
 await tab.button('Undo completion').click();state=api.read(store);state.tasks.push(task('second-tab'));api.write(store,state);
 const date=walk(tab.host).find(el=>el.type==='date'&&el.value==='2026-09-28');date.value='2026-10-03';await tab.button('Move session').click();assert.equal(api.read(store).tasks.length,3);
 await tab.restore({version:1,tasks:[task('imported')],activeId:null});assert.equal(api.read(store).tasks.length,4);assert.equal(api.read(store).tasks[0].date,'2026-10-03');assert.ok(api.read(store).tasks.some(t=>t.sourceId==='jamb-original-practice'));
});
test('two current tabs add and complete sessions from freshly read storage even without delivered storage events',async()=>{
 const store=storage({[api.key]:JSON.stringify(api.normalize({version:1,tasks:[task()],activeId:null}))}),first=ui(store),second=ui(store);
 await second.add('Chemistry from tab two');await first.add('English from tab one');assert.equal(api.read(store).tasks.length,3);
 await second.button('Mark done').click();const saved=api.read(store);assert.equal(saved.tasks.length,3);assert.ok(saved.tasks[0].doneAt);
 assert.deepEqual(saved.tasks.slice(1).map(t=>t.subject),['Chemistry from tab two','English from tab one']);
});
test('all current mutation and backup controls disable on corrupt storage, and stale clicks cannot export an empty fallback',async()=>{
 const state=api.normalize(legacyPlan()),store=storage({[api.key]:JSON.stringify(state)}),tab=ui(store);
 store.records.set(api.key,'corrupt current');await tab.button('Mark done').click();assert.match(tab.status(),/Could not save/);assert.equal(store.getItem(api.key),'corrupt current');
 assert.ok(walk(tab.host).filter(el=>el.tagName==='button').every(el=>el.disabled));assert.ok(walk(tab.host).find(el=>el.type==='file').disabled);
 await tab.button('Download study backup').click();assert.equal(tab.downloads.length,0);assert.equal(store.writes.length,0);
 const otherStore=storage({[api.key]:JSON.stringify(state)}),otherTab=ui(otherStore);otherStore.records.set(api.key,'');await otherTab.button('Download study backup').click();assert.match(otherTab.status(),/Backup not downloaded/);assert.equal(otherTab.downloads.length,0);
});
test('current controller quota feedback does not mark a task complete or erase new revisions',async()=>{
 const state=addJamb(api.normalize(legacyPlan())),raw=JSON.stringify(state),store=storage({[api.key]:raw}),tab=ui(store);store.full=true;
 await tab.button('Finish this session').click();assert.match(tab.status(),/Could not save: Storage full/);assert.equal(store.getItem(api.key),raw);assert.equal(store.writes.length,0);
});
test('current backup downloads freshly read v2 tasks rather than the controller cached plan',async()=>{
 const store=storage(),tab=ui(store);api.write(store,addJamb());await tab.button('Download study backup').click();assert.equal(tab.downloads.length,1);
 const exported=JSON.parse(await tab.downloads[0].text());assert.equal(exported.version,2);assert.deepEqual(exported.tasks[0].revision.ids,revision().ids);
});
