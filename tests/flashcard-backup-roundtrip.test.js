const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const engine = require('../tools/flashcard-maker/flashcard-engine.js');
const cards = [
  {front:'Synthetic question',back:'Synthetic answer',mastered:true,reviewCount:2},
  {front:'Comma, quote " and tab\t',back:'Line one\nLine two\r\nLine three',mastered:false,reviewCount:3},
  {front:'  Yoruba: ẹkọ  ',back:' Swahili: elimu ',mastered:false,reviewCount:0}
];
test('owned CSV restores exact text and review state without a header card',()=>{
  assert.deepEqual(engine.parseCards(engine.exportCsv({cards})),cards);
});
test('owned CSV accepts CRLF row separators and a missing BOM',()=>{
  const simple=[cards[0],cards[2]];
  assert.deepEqual(engine.parseCards(engine.exportCsv({cards:simple}).slice(1).replace(/\n/g,'\r\n')),simple);
});
test('plain CSV/TSV remains compatible including tabs inside quoted CSV fields',()=>{
  assert.deepEqual(engine.parseCards('"A\tB","C,D"\nForce\tMass × acceleration\nFront,Back'),[
    {front:'A\tB',back:'C,D'},{front:'Force',back:'Mass × acceleration'},{front:'Front',back:'Back'}
  ]);
});
test('malformed backup rows reject the whole import instead of losing cards silently',()=>{
  for(const invalid of ['"X","Y","Review","-1"','"X","Y","Review","Infinity"','"X","Y","Unknown","2"','"X","Y","New",""','"X","Y","Review","1.5"','"X","Y","New","0","extra"']) {
    assert.deepEqual(engine.parseCards(engine.exportCsv({cards:[cards[0]]})+'\n'+invalid),[]);
  }
});
test('unclosed quotes do not partially restore a backup',()=>{
  assert.deepEqual(engine.parseCards(engine.exportCsv({cards:[cards[0]]})+'\n"unfinished'),[]);
});
function ui(input) {
  const html=fs.readFileSync(path.join(__dirname,'../tools/flashcard-maker/index.html'),'utf8');
  const fn=html.slice(html.indexOf('function bulkImport()'),html.indexOf('function exportDeck()'));
  const deck={cards:[]}, field={value:input};let status='',saved=0,hidden=0;
  vm.runInNewContext(fn+'\nbulkImport();',{
    getDeck:()=>deck, document:{getElementById:id=>id==='bulkInput'?field:{classList:{remove:()=>hidden++}}},
    window:{AfroFlashcardEngine:engine},setAppStatus:s=>status=s,save:()=>saved++,
    renderCards(){},updateStats(){},renderExamDeckContext(){},alert(){throw Error('Unexpected alert');}
  });
  return {deck:JSON.parse(JSON.stringify(deck)),field,status,saved,hidden};
}
test('bulk UI preserves imported backup progress and clears successful input',()=>{
  const result=ui(engine.exportCsv({cards}));assert.deepEqual(result.deck.cards,cards);
  assert.equal(result.field.value,'');assert.equal(result.saved,1);assert.equal(result.hidden,1);
});
test('bulk UI keeps invalid pasted input visible and does not save an empty import',()=>{
  const input='"unfinished';const result=ui(input);
  assert.equal(result.field.value,input);assert.equal(result.saved,0);assert.equal(result.hidden,0);
  assert.match(result.status,/pasted text has been kept/);
});
test('plain bulk imports start with new-card review state',()=>{
  assert.deepEqual(ui('Question,Answer').deck.cards,[{front:'Question',back:'Answer',mastered:false,reviewCount:0}]);
});
