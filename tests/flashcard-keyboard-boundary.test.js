const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),test=require('node:test'),assert=require('node:assert/strict');
const html=fs.readFileSync(process.env.FLASHCARD_KEYBOARD_HTML||path.join(__dirname,'../tools/flashcard-maker/index.html'),'utf8');
function setup({hidden=false,emptyOrder=false,interactive=false,tabIndex=null}={}) {
  const marks=[],flips=[],activated=[],tabs=['decks','study','progress'].map(name=>({dataset:{tab:name},focus(){this.focused=true;}}));
  const state={mode:'flip',studyOrder:emptyOrder?[]:[0],studyIndex:0},deck={cards:[{front:'Synthetic',back:'Answer'}]};
  let handler,prevented=0;
  const context={state,getDeck:()=>deck,markCard:x=>marks.push(x),toggleFlashcard:x=>flips.push(x),switchTab:x=>activated.push(x),document:{
    addEventListener:(type,fn)=>handler=fn,querySelectorAll:()=>tabs,getElementById:id=>id==='panel-study'?{hidden}:{}
  }};
  vm.createContext(context);const start=html.indexOf("document.addEventListener('keydown', function(e) {",html.indexOf('/* ── Keyboard shortcuts'));vm.runInContext(html.slice(start,html.indexOf('\n});',start)+4),context);
  const target={tagName:interactive?'BUTTON':'BODY',closest:selector=>selector==='.fc-tab'?(tabIndex===null?null:tabs[tabIndex]):interactive?{}:null};
  return {marks,flips,activated,tabs,state,context,press(code,extra={}){handler({target,code,preventDefault(){prevented++;},...extra});return prevented;}};
}
test('hidden study panel never consumes arrow or space shortcuts',()=>{
  const x=setup({hidden:true});for(const key of ['ArrowRight','ArrowLeft','Space'])assert.equal(x.press(key),0);assert.equal(x.marks.length,0);assert.equal(x.flips.length,0);
});
test('empty study queue does not mark cards',()=>{
  const x=setup({emptyOrder:true});assert.equal(x.press('ArrowRight'),0);assert.equal(x.marks.length,0);
});
test('focused controls retain native keyboard behavior',()=>{
  const x=setup({interactive:true});assert.equal(x.press('Space'),0);assert.equal(x.press('ArrowRight'),0);assert.equal(x.flips.length,0);assert.equal(x.marks.length,0);
});
test('editable content does not trigger study actions',()=>{
  const x=setup();x.press('ArrowRight',{target:{isContentEditable:true,closest:()=>null}});assert.equal(x.marks.length,0);
});
test('modifiers, composition, repeats and already-handled events do not mark cards',()=>{
  for(const field of ['ctrlKey','altKey','metaKey','shiftKey','isComposing','repeat','defaultPrevented']){const x=setup();assert.equal(x.press('ArrowRight',{[field]:true}),0);assert.equal(x.marks.length,0);}
});
test('active study background shortcuts still flip and mark cards',()=>{
  const x=setup();x.press('Space');x.press('ArrowRight');x.press('ArrowLeft');assert.equal(x.flips.length,1);assert.deepEqual(x.marks,[true,false]);
});
test('tab arrows, Home and End activate and focus the requested tab',()=>{
  for(const [index,key,expected] of [[0,'ArrowRight',1],[0,'ArrowLeft',2],[1,'Home',0],[1,'End',2]]) {
    const x=setup({hidden:true,tabIndex:index});assert.equal(x.press(key),1);assert.deepEqual(x.activated,[x.tabs[expected].dataset.tab]);assert.equal(x.tabs[expected].focused,true);assert.equal(x.marks.length,0);
  }
});
test('tabs expose a single initial keyboard entry point',()=>{
  assert.match(html,/id="tab-decks" role="tab" tabindex="0"/);assert.match(html,/id="tab-study" role="tab" tabindex="-1"/);assert.match(html,/t\.tabIndex = active \? 0 : -1/);
});
test('mark action safely ignores absent or stale queues and hidden panels',()=>{
  const source=html.slice(html.indexOf('function markCard(gotIt)'),html.indexOf('/* ── Quiz mode'));
  for(const config of [{deck:null,order:[],hidden:false},{deck:{cards:[]},order:[0],hidden:false},{deck:{cards:[{}]},order:[0],hidden:true}]){
    const context={state:{mode:'flip',studyOrder:config.order,studyIndex:0},getDeck:()=>config.deck,document:{getElementById:()=>({hidden:config.hidden})}};vm.createContext(context);vm.runInContext(source,context);assert.doesNotThrow(()=>context.markCard(true));
  }
});
