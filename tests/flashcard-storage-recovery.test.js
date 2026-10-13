const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),test=require('node:test'),assert=require('node:assert/strict');
const html=fs.readFileSync(process.env.FLASHCARD_STORAGE_HTML || path.join(__dirname,'../tools/flashcard-maker/index.html'),'utf8');
function setup({failWrite=false,failRemove=false}={}) {
  const state={remember:true,decks:[{name:'Synthetic deck',cards:[{front:'Question',back:'Answer'}]}],activeDeck:0,matchPairCount:6,studyDates:[]};
  const checkbox={checked:true},calls=[],messages=[];
  const context={state,REMEMBER_KEY:'remember',STORAGE_KEY:'decks',STREAK_KEY:'streak',document:{getElementById:id=>id==='rememberDecks'?checkbox:{set textContent(x){messages.push(x);}}},localStorage:{
    setItem(k,v){calls.push(['set',k,v]);if(failWrite)throw Error('Synthetic quota');},
    removeItem(k){calls.push(['remove',k]);if(failRemove&&k==='decks')throw Error('Synthetic denied');}
  }};
  vm.createContext(context);vm.runInContext(html.slice(html.indexOf('function save()'),html.indexOf('/* ── Tab switching')),context);
  return {context,state,checkbox,calls,messages};
}
test('storage quota failure does not interrupt UI continuation or discard current cards',()=>{
  const x=setup({failWrite:true});const original=JSON.stringify(x.state.decks);let rendered=false;
  assert.doesNotThrow(()=>{x.context.save();rendered=true;});assert.equal(rendered,true);
  assert.equal(JSON.stringify(x.state.decks),original);assert.equal(x.state.remember,false);assert.equal(x.checkbox.checked,false);
  assert.match(x.messages.at(-1),/saved browser copy may be older/);
});
test('normal remembered save still writes deck and streak data',()=>{
  const x=setup();x.context.save();assert.deepEqual(x.calls.map(c=>c[1]),['decks','streak']);assert.equal(x.state.remember,true);
});
test('session-only editing does not write browser storage',()=>{
  const x=setup();x.state.remember=false;x.context.save();assert.equal(x.calls.length,0);
});
test('failed clearing attempts all keys and does not claim complete removal',()=>{
  const x=setup({failRemove:true});const original=JSON.stringify(x.state.decks);x.context.clearSavedDecks();
  assert.deepEqual(x.calls.map(c=>c[1]),['remember','decks','streak']);assert.equal(JSON.stringify(x.state.decks),original);
  assert.match(x.messages.at(-1),/Could not remove all saved browser data/);assert.equal(x.checkbox.checked,false);
});
test('successful clearing preserves open decks and disables remembering',()=>{
  const x=setup();const original=JSON.stringify(x.state.decks);x.context.clearSavedDecks();
  assert.equal(JSON.stringify(x.state.decks),original);assert.equal(x.state.remember,false);assert.match(x.messages.at(-1),/^Saved browser copy cleared/);
});
test('remember opt-out uses the same truthful removal handler',()=>{
  const fn=html.slice(html.indexOf('function load()'),html.indexOf('function save()'));
  assert.match(fn,/else\s*\{\s*clearSavedDecks\(\);/);
});
