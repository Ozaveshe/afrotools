const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),test=require('node:test'),assert=require('node:assert/strict');
const html=fs.readFileSync(process.env.FLASHCARD_LOAD_HTML||path.join(__dirname,'../tools/flashcard-maker/index.html'),'utf8');
const valid={decks:[{name:'Synthetic saved deck',id:'synthetic-id',cards:[{front:'Question',back:'Answer',mastered:true,reviewCount:2}]}],activeDeck:0,matchPairCount:6};
function setup(raw,{streak=null,readFails=false,removeFails=false}={}) {
  const stored=new Map([['decks',raw],['remember','yes'],['streak',streak]]),writes=[],messages=[];
  const checkbox={checked:false,disabled:false,addEventListener(type,fn){this.change=fn;}};
  const state={decks:[],activeDeck:null,remember:false,studyDates:[],matchPairCount:6,storageRecoveryRequired:false};
  const context={state,REMEMBER_KEY:'remember',STORAGE_KEY:'decks',STREAK_KEY:'streak',document:{getElementById:id=>id==='rememberDecks'?checkbox:{set textContent(value){messages.push(value);}}},localStorage:{
    getItem(key){if(readFails)throw Error('Synthetic denied');return stored.get(key)||null;},
    setItem(key,value){writes.push(key);stored.set(key,value);},
    removeItem(key){if(removeFails)throw Error('Synthetic denied');stored.delete(key);}
  },renderDecks(){state.decks.forEach(d=>d.cards.forEach(c=>assert.equal(typeof c.front,'string')));},renderCards(){},updateStats(){},updateStreak(){},renderPresets(){},renderExamDeckContext(){}};
  vm.createContext(context);const helper=html.indexOf('function restoredDecks(');vm.runInContext(html.slice(helper>=0?helper:html.indexOf('function load()'),html.indexOf('/* ── Tab switching')),context);
  return {context,state,stored,writes,messages,checkbox};
}
test('valid remembered decks restore content, review progress and scheduled identity',()=>{
  const x=setup(JSON.stringify(valid));x.context.load();assert.deepEqual(JSON.parse(JSON.stringify(x.state.decks)),valid.decks);assert.equal(x.checkbox.checked,true);assert.equal(x.checkbox.disabled,false);assert.equal(x.writes.length,0);
});
for(const [name,raw] of [['invalid JSON','{bad'],['null deck',JSON.stringify({decks:[null]})],['missing cards',JSON.stringify({decks:[{name:'Synthetic'}]})],['invalid card',JSON.stringify({decks:[{name:'Synthetic',cards:[null]}]})],['invalid progress',JSON.stringify({decks:[{name:'Synthetic',cards:[{front:'Q',back:'A',reviewCount:-1}]}]})]]) {
  test(name+' cannot crash startup or overwrite original saved data',()=>{
    const x=setup(raw);assert.doesNotThrow(()=>x.context.load());x.context.save();
    assert.equal(x.stored.get('decks'),raw);assert.equal(x.writes.length,0);assert.equal(x.checkbox.disabled,true);assert.equal(x.state.remember,false);assert.match(x.messages.at(-1),/stored copy has been left unchanged/);
    x.checkbox.checked=true;x.checkbox.change();assert.equal(x.writes.length,0);assert.equal(x.checkbox.checked,false);
  });
}
test('invalid active index falls back to the first valid deck',()=>{
  const x=setup(JSON.stringify({...valid,activeDeck:-1,matchPairCount:'oops'}));x.context.load();assert.equal(x.state.activeDeck,0);assert.equal(x.state.matchPairCount,6);
});
test('invalid streak preserves valid decks and prevents overwriting either saved record',()=>{
  const raw=JSON.stringify(valid),x=setup(raw,{streak:'{bad'});x.context.load();x.context.save();assert.equal(x.state.decks.length,1);assert.equal(x.stored.get('decks'),raw);assert.equal(x.stored.get('streak'),'{bad');assert.equal(x.writes.length,0);assert.equal(x.checkbox.disabled,true);
});
test('storage access failure leaves the tab usable and reports recovery',()=>{
  const x=setup(null,{readFails:true});assert.doesNotThrow(()=>x.context.load());assert.equal(x.checkbox.disabled,true);assert.match(x.messages.at(-1),/could not be fully restored/);
});
test('successful explicit clearing unlocks remembering new session decks',()=>{
  const x=setup('{bad');x.context.load();x.context.clearSavedDecks();assert.equal(x.checkbox.disabled,false);x.state.decks=valid.decks;x.checkbox.checked=true;x.checkbox.change();assert.equal(x.state.remember,true);assert.equal(JSON.parse(x.stored.get('decks')).decks[0].name,'Synthetic saved deck');
});
test('failed explicit clearing keeps the damaged copy protected',()=>{
  const x=setup('{bad',{removeFails:true});x.context.load();x.context.clearSavedDecks();assert.equal(x.checkbox.disabled,true);assert.equal(x.stored.get('decks'),'{bad');assert.throws(()=>x.context.persist(),/needs recovery/);
});
