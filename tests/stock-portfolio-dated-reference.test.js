'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'assets/js/pages/fintech-shared-controllers/stock-portfolio.js'),'utf8');
const page=fs.readFileSync(path.join(root,'tools/stock-portfolio/index.html'),'utf8');
function harness({legacy=false,values=['BOAC','10','10000','11250']}={}){
  const nodes=new Map();let focused;const downloads=[];
  function node(tagName='DIV'){
    const attrs=new Map(),classes=new Set();let html='';
    return {tagName,style:{},value:'',textContent:'',disabled:false,children:[],listeners:{},validity:{badInput:false},
      classList:{add:x=>classes.add(x),remove:x=>classes.delete(x),contains:x=>classes.has(x)},
      setAttribute:(k,v)=>attrs.set(k,String(v)),getAttribute:k=>attrs.get(k)??null,removeAttribute:k=>attrs.delete(k),
      focus(){focused=this;},addEventListener(type,fn){this.listeners[type]=fn;},
      appendChild(child){this.children.push(child);child.parentNode=this;},
      remove(){this.parentNode.children.splice(this.parentNode.children.indexOf(this),1);},click(){downloads.push({filename:this.download,url:this.href});},
      querySelectorAll(){return[];},get innerHTML(){return html;},set innerHTML(v){html=v;this.children=[];}};
  }
  const tbody=node('TBODY'),row=node('TR');row.inputs=values.map(value=>Object.assign(node('INPUT'),{value}));row.querySelectorAll=()=>row.inputs;tbody.appendChild(row);nodes.set('holdings-tbody',tbody);
  ['sp-error','sp-results','sp-table-body','sp-total-value','sp-total-cost','sp-total-gain','sp-return-pct'].forEach(id=>nodes.set(id,node()));
  if(!legacy)['sp-quote-date','sp-quote-source','sp-result-reference','sp-download'].forEach(id=>nodes.set(id,node(id==='sp-download'?'BUTTON':id==='sp-result-reference'?'P':'INPUT')));
  const tabs=[node('BUTTON'),node('BUTTON')],blobs=[],revoked=[];
  const document={body:node('BODY'),getElementById:id=>nodes.get(id),createElement:tag=>node(tag.toUpperCase()),querySelectorAll:sel=>sel==='#holdings-tbody tr'?tbody.children:sel==='.etab'?tabs:[]};
  const context=vm.createContext({document,window:{},Intl,Number,Date,Blob,URL:{createObjectURL(blob){blobs.push(blob);return 'blob:synthetic';},revokeObjectURL(url){revoked.push(url);}},setTimeout(fn){fn();}});
  vm.runInContext(source,context,{filename:'stock-portfolio.js'});
  return {context,nodes,tabs,tbody,focused:()=>focused,blobs,revoked,downloads,
    calculate:()=>context.calcPortfolio(),visible:()=>nodes.get('sp-results').classList.contains('on'),
    reference(date='2026-10-21',source='BRVM BOC 200 — official report'){nodes.get('sp-quote-date').value=date;nodes.get('sp-quote-source').value=source;},
    edit(id,value,type='input'){const n=nodes.get(id);n.value=value;n.listeners[type]({target:n});},
    xof(){context.setExchange('XOF','XOF',tabs[1]);}};
}
test('BRVM entry offers XOF, a direct official report and optional common-date provenance',()=>{
  assert.match(page,/setExchange\('XOF','XOF',this\)/);
  assert.match(page,/href="https:\/\/www\.brvm\.org\/en\/bulletins-officiels-de-la-cote" target="_blank" rel="noopener noreferrer"/);
  assert.match(page,/<label for="sp-quote-date">Quote date for all current prices \(optional\)/);
  assert.match(page,/id="sp-download"[^>]+disabled/);
});
test('dated XOF manual valuation retains exact arithmetic and a usable summary',()=>{
  const h=harness();h.xof();h.reference();h.calculate();assert.equal(h.visible(),true);
  assert.equal(h.context.spCurrentPortfolio.totalValue,112500);assert.equal(h.context.spCurrentPortfolio.totalCost,100000);assert.equal(h.context.spCurrentPortfolio.totalGain,12500);
  assert.equal(h.nodes.get('sp-return-pct').textContent,'+12.5%');
  assert.equal(h.context.spMoney('XOF').resolvedOptions().maximumFractionDigits,0);
  assert.equal(h.context.spMoney('NGN').resolvedOptions().maximumFractionDigits,2);
  const txt=h.context.spBuildPortfolioSummary();for(const t of ['Currency: XOF','2026-10-21','BRVM BOC 200','BOAC','Shares: 10','Buy price: 10000 XOF','Current price: 11250 XOF','no live quote fetched'])assert.ok(txt.includes(t),t);
});
test('the actual TXT builder and download keep currency/date without any provider call',async()=>{
  const h=harness();h.xof();h.reference();h.calculate();h.context.spDownloadPortfolio();
  assert.equal(h.downloads.length,1);assert.equal(h.downloads[0].filename,'afrotools-stock-valuation-XOF-2026-10-21.txt');
  assert.match(await h.blobs[0].text(),/Currency: XOF[\s\S]*2026-10-21[\s\S]*Current price: 11250 XOF/);
  assert.deepEqual(h.revoked,['blob:synthetic']);
});
test('quote date and source edits retire the result and export until recalculation',()=>{
  for(const [id,value,type]of [['sp-quote-date','2026-10-20','change'],['sp-quote-source','My dated broker statement','input']]){
    const h=harness();h.xof();h.reference();h.calculate();h.edit(id,value,type);
    assert.equal(h.visible(),false);assert.equal(h.context.spBuildPortfolioSummary(),'');assert.equal(h.nodes.get('sp-download').disabled,true);h.calculate();assert.equal(h.visible(),true);assert.ok(h.context.spBuildPortfolioSummary().includes(value));
  }
});
test('invalid and future quote dates focus the error and recover without stale exports',()=>{
  for(const value of ['2026-02-30','2099-01-01']){
    const h=harness();h.reference();h.calculate();h.edit('sp-quote-date',value);h.calculate();
    assert.equal(h.visible(),false);assert.equal(h.context.spBuildPortfolioSummary(),'');assert.equal(h.focused(),h.nodes.get('sp-quote-date'));assert.equal(h.focused().getAttribute('aria-invalid'),'true');
    h.edit('sp-quote-date','2026-10-21');h.calculate();assert.equal(h.visible(),true);assert.equal(h.nodes.get('sp-quote-date').getAttribute('aria-invalid'),null);
  }
});
test('holding/currency changes prevent a stale downloaded valuation',()=>{
  const h=harness();h.xof();h.reference();h.calculate();h.tbody.children[0].inputs[1].value='20';h.tbody.listeners.input({target:h.tbody.children[0].inputs[1]});
  assert.equal(h.context.spBuildPortfolioSummary(),'');h.context.spDownloadPortfolio();assert.equal(h.downloads.length,0);h.calculate();assert.equal(h.context.spCurrentPortfolio.totalValue,225000);
  h.context.setExchange('GHS','GHS',h.tabs[0]);assert.equal(h.context.spBuildPortfolioSummary(),'');h.calculate();assert.match(h.context.spBuildPortfolioSummary(),/Currency: GHS/);
});
test('optional blank reference does not invent a date and legacy shared routes still calculate',()=>{
  const h=harness({legacy:true});h.calculate();assert.equal(h.visible(),true);assert.equal(h.context.spCurrentPortfolio.totalValue,112500);
  assert.doesNotMatch(h.context.spBuildPortfolioSummary(),/Quote date|Price source entered/);
  assert.equal(h.nodes.get('sp-total-value').textContent,new Intl.NumberFormat(undefined,{style:'currency',currency:'NGN',maximumFractionDigits:2}).format(112500));
});
test('fractional holdings retain precision, explicit zero is valid and source text is a plain line',()=>{
  const h=harness({values:['BOAC','2.5','10000','11250']});h.xof();h.reference('2026-10-21','Official\nreport <img src=x>');h.calculate();
  assert.equal(h.context.spCurrentPortfolio.totalValue,28125);assert.match(h.context.spBuildPortfolioSummary(),/Shares: 2.5/);assert.match(h.nodes.get('sp-result-reference').textContent,/Official report <img src=x>/);
  h.tbody.children[0].inputs[3].value='0';h.calculate();assert.equal(h.context.spCurrentPortfolio.totalValue,0);assert.equal(h.nodes.get('sp-return-pct').textContent,'-100.0%');
});
