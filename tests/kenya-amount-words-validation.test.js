'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const parser = require('../assets/js/engines/amount-words-input');
function page(options = {}) {
  const html = fs.readFileSync(path.join(root, 'tools/amount-words-ke/index.html'), 'utf8');
  const script = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]).find(s => s.includes('function amountToWords('));
  const nodes = Object.fromEntries([...html.matchAll(/id="([^"]+)"/g)].map(m => [m[1], { value:'', textContent:'', innerHTML:'', style:{}, attrs:{}, isConnected:true, setAttribute(k,v) { this.attrs[k]=v; } }]));
  nodes.caseMode.value='upper'; nodes.docMode.value='cheque';
  const buttons=[{textContent:'Copy Words',isConnected:true},{textContent:'Copy Document Line',isConnected:true}];
  const copies=[],prompts=[];
  const document={getElementById:id=>nodes[id],activeElement:buttons[0],querySelector:s=>s.includes('copyDocumentLine')?buttons[1]:buttons[0],querySelectorAll:()=>buttons};
  const window={AfroTools: options.missing ? {} : {engines:{amountWordsInput:parser}},prompt:(...args)=>prompts.push(args)};
  const context={document,window,navigator:{clipboard:{writeText:text=>{copies.push(text);return options.write?options.write(text):Promise.resolve();}}},setTimeout:()=>0};
  vm.runInNewContext(script,context);
  const enter=value=>{nodes.amount.value=value;return context.convert();};
  return {context,nodes,copies,prompts,enter,html};
}
test('negative, malformed, blank and overflowing inputs cannot become copied money', async()=>{
  const p=page();
  for(const raw of ['-10','12,34','abc100','1.2.3','1e3','1000000000000','999999999999.995','']) {
    p.enter('1250.75');
    p.enter(raw);
    assert.equal(p.nodes.resultCard.style.display,'none',raw);
    assert.equal(p.nodes.reviewGrid.style.display,'none',raw);
    assert.equal(p.nodes.wordsResult.textContent,'',raw);
    p.context.copyWords();p.context.copyDocumentLine();await Promise.resolve();
    assert.equal(p.copies.length,0,raw);
    if(raw)assert.ok(p.nodes.amountError.textContent,raw);
  }
  p.enter('25.50');p.context.copyDocumentLine();await Promise.resolve();
  assert.equal(p.copies[0],'KENYA SHILLINGS TWENTY-FIVE AND CENTS FIFTY ONLY (KES 25.50)');
});
test('real wording and figures share exact decimal rounding, cents and supported maximum',()=>{
  const p=page();
  for(const [raw,figure,words] of [
    ['0','0.00','ZERO KENYA SHILLINGS ONLY'],
    ['0.005','0.01','CENTS ONE ONLY'],
    ['1.005','1.01','KENYA SHILLINGS ONE AND CENTS ONE ONLY'],
    ['2.675','2.68','KENYA SHILLINGS TWO AND CENTS SIXTY-EIGHT ONLY'],
    ['999.995','1,000.00','KENYA SHILLINGS ONE THOUSAND ONLY'],
    ['125,750.50','125,750.50','KENYA SHILLINGS ONE HUNDRED AND TWENTY-FIVE THOUSAND SEVEN HUNDRED AND FIFTY AND CENTS FIFTY ONLY']
  ]){p.enter(raw);assert.equal(p.nodes.fmtResult.textContent,'KES '+figure);assert.equal(p.nodes.wordsResult.textContent,words);assert.ok(p.nodes.docPreview.textContent.includes('KES '+figure));}
  p.enter('999999999999.99');assert.equal(p.nodes.fmtResult.textContent,'KES 999,999,999,999.99');assert.match(p.nodes.wordsResult.textContent,/BILLION.*CENTS NINETY-NINE ONLY$/);
  p.enter('1.999');assert.match(p.nodes.reviewGrid.innerHTML,/Whole shillings/);assert.match(p.nodes.amountError.textContent,/Rounded to KES 2.00/);
});
test('all existing document modes and text styles copy the current edited amount',async()=>{
  const p=page();p.nodes.payeeName.value='Example Vendor';p.nodes.docRef.value='TEST-KE-001';
  for(const mode of ['cheque','invoice','rent','rtgs']) for(const style of ['upper','title','sentence']) {
    p.nodes.docMode.value=mode;p.nodes.caseMode.value=style;p.enter('1250.75');
    // Copy must refresh from actual input even if an input event has not fired.
    p.nodes.amount.value='100.01';p.context.copyDocumentLine();await Promise.resolve();
    const copy=p.copies.at(-1);assert.ok(copy.includes('KES 100.01'));assert.ok(copy.includes('Example Vendor'));assert.ok(copy.includes('TEST-KE-001'));assert.ok(!copy.includes('1,250.75'));
  }
});
test('late clipboard rejection or success cannot restore feedback or prompt for invalidated result',async()=>{
  let reject;const p=page({write:()=>new Promise((_,r)=>{reject=r;})});p.enter('100');p.context.copyWords();p.enter('-1');reject(Error('blocked'));await Promise.resolve();await Promise.resolve();assert.equal(p.prompts.length,0);assert.equal(p.nodes.copyStatus.textContent,'');
  let resolve;const q=page({write:()=>new Promise(r=>{resolve=r;})});q.enter('100');q.context.copyWords();q.enter('200');resolve();await Promise.resolve();await Promise.resolve();assert.equal(q.nodes.copyStatus.textContent,'');
});
test('missing shared parser fails visibly without yielding or copying an amount',()=>{
  const p=page({missing:true});p.enter('100');assert.match(p.nodes.amountError.textContent,/Unable to load/);assert.equal(p.nodes.resultCard.style.display,'none');p.context.copyWords();assert.equal(p.copies.length,0);
});
