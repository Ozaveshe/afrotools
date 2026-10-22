const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');

function app() {
  const copied = [], pdfs = [], downloads = [];
  class Element {
    constructor(tag) { this.tagName = tag; this.children = []; this.listeners = {}; this.dataset = {}; this.value = ''; this.checked = false; this.disabled = false; this.textContent = ''; this.classes = new Set(); this.classList = { add: v => this.classes.add(v), remove: v => this.classes.delete(v), contains: v => this.classes.has(v), toggle: (v,on) => on ? this.classes.add(v) : this.classes.delete(v) }; }
    addEventListener(type, fn) { (this.listeners[type] ||= []).push(fn); }
    emit(type) { for (const fn of this.listeners[type] || []) fn({ preventDefault() {} }); }
    appendChild(child) { child.parent = this; this.children.push(child); return child; }
    remove() { if (this.parent) this.parent.children.splice(this.parent.children.indexOf(this), 1); }
    focus() { this.focused = true; }
    click() { if (this.tagName === 'a') downloads.push(this.download); this.emit('click'); }
    set innerHTML(html) {
      this.children = []; this.html = html;
      if (this.tagName !== 'fieldset') return;
      this.fields = {};
      for (const m of html.matchAll(/<input name="([^"]+)"[^>]*value="([^"]*)"/g)) { const e = new Element('input'); e.value = m[2]; this.fields[m[1]] = e; }
      const method = new Element('select'); method.value = 'reducing'; this.fields.rateMethod = method;
      this.heading = new Element('h3');
      this.removeButton = html.includes('class="lc-remove"') ? new Element('button') : null;
    }
    querySelector(selector) { if (selector === 'h3') return this.heading; if (selector === '.lc-remove') return this.removeButton; const m = selector.match(/^\[name="([^"]+)"\]$/); return m ? this.fields[m[1]] : null; }
  }
  const ids = Object.fromEntries(['loanCompareForm','offerCards','currency','status','resultsCard','resultTitle','resultNote','resultRows','addOfferBtn','confirmedAssumptions','copyBtn','shareBtn','pdfBtn'].map(id => [id,new Element('div')]));
  ids.currency.value = 'NGN'; ids.confirmedAssumptions.checked = true;
  const cfg = Object.fromEntries(['offer','remove','labelName','helpName','labelMethod','reducing','flat','labelAmount','labelRate','helpRate','labelTerm','labelUpfront','labelDeducted','helpDeducted','labelMonthly','labelFinal','changed','equal','equalNote','review','mismatch','months','success','pdfTitle','comparable','cash','monthlyDue','totalPaid','cost','disclaimer','copied','copyError','shareTitle','canonical','linkShared','shareError','linkCopied','amount','method','sourceNote','pdfFilename','pdfReady','pdfError'].map(x => [x,x]));
  Object.assign(cfg,{ locale:'en', defaultA:'Reducing offer',defaultB:'Flat offer',winner:'Winner {name}',savings:'Saving {amount}' });
  class Pdf { constructor() { this.texts=[]; pdfs.push(this); } text(value) { this.texts.push(value); } splitTextToSize(value) { return value; } output() { return {}; } }
  for (const method of ['setProperties','setFillColor','rect','setTextColor','setFont','setFontSize','roundedRect','addPage']) Pdf.prototype[method] = function() {};
  const sandbox = { console,Intl,URL:{createObjectURL:()=> 'blob:synthetic',revokeObjectURL(){}},setTimeout(){},CustomEvent:class {},navigator:{clipboard:{writeText(text){copied.push(text);return Promise.resolve();}}},document:{getElementById:id=>ids[id],createElement:tag=>new Element(tag),body:new Element('body')},LoanComparePage:cfg,jspdf:{jsPDF:Pdf},dispatchEvent(){} };
  sandbox.window=sandbox; vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(root,'assets/js/engines/loan-compare.js'),'utf8'),sandbox);
  vm.runInContext(fs.readFileSync(path.join(root,'assets/js/pages/loan-compare-vip.js'),'utf8'),sandbox);
  const cards = ids.offerCards.children;
  function compare() { ids.loanCompareForm.emit('submit'); }
  function setup() { for (const card of cards) { card.fields.amount.value='120000'; card.fields.annualRate.value='12'; card.fields.termMonths.value='12'; } cards[1].fields.rateMethod.value='flat'; compare(); }
  function exportNow() { ids.copyBtn.emit('click'); ids.pdfBtn.emit('click'); }
  function invalidated() { assert.equal(ids.resultsCard.classes.has('on'),false,'edited inputs must hide the old financial verdict'); assert.equal(ids.status.textContent,'changed'); exportNow(); assert.equal(copied.length,0,'old summary must be unavailable'); assert.equal(pdfs.length,0,'old PDF must be unavailable'); }
  return {ids,cards,compare,setup,exportNow,invalidated,copied,pdfs,downloads};
}

test('real engine comparison still gives the reducing and flat totals',()=>{const a=app();a.setup();assert.equal(a.ids.resultsCard.classes.has('on'),true);assert.match(a.ids.resultRows.children[0].children[5].textContent,/127,942\.26/);assert.match(a.ids.resultRows.children[1].children[5].textContent,/134,400\.00/);});

for (const field of ['amount','annualRate','termMonths','paidUpfront','deductedFees','monthlyFees','finalPayment','name']) {
  test(`editing ${field} invalidates both verdict and export snapshot`,()=>{const a=app();a.setup();a.cards[0].fields[field].value=field==='name'?'Renamed offer':'130';a.ids.loanCompareForm.emit('input');a.invalidated();});
}
for (const field of ['currency','rateMethod','confirmedAssumptions']) {
  test(`changing ${field} invalidates the comparison`,()=>{const a=app();a.setup();if(field==='currency')a.ids.currency.value='USD';else if(field==='rateMethod')a.cards[0].fields.rateMethod.value='flat';else a.ids.confirmedAssumptions.checked=false;a.ids.loanCompareForm.emit('change');a.invalidated();});
}
test('adding and removing an offer invalidates, preserving the four-offer limit',()=>{const a=app();a.setup();a.ids.addOfferBtn.emit('click');assert.equal(a.cards.length,3);a.invalidated();a.compare();assert.equal(a.ids.resultsCard.classes.has('on'),true);a.cards[2].removeButton.emit('click');assert.equal(a.cards.length,2);a.invalidated();a.ids.addOfferBtn.emit('click');a.ids.addOfferBtn.emit('click');a.ids.addOfferBtn.emit('click');assert.equal(a.cards.length,4);assert.equal(a.ids.addOfferBtn.disabled,true);});
test('invalid submission and correction recover a fresh current export',()=>{const a=app();a.setup();a.cards[0].fields.amount.value='-1';a.ids.loanCompareForm.emit('input');a.compare();assert.equal(a.ids.resultsCard.classes.has('on'),false);assert.match(a.ids.status.textContent,/zero or greater/);for(const card of a.cards)card.fields.amount.value='130000';a.ids.currency.value='USD';a.compare();assert.equal(a.ids.resultsCard.classes.has('on'),true);assert.match(a.ids.resultRows.children[0].children[5].textContent,/138,604\.11/);a.exportNow();assert.equal(a.copied.length,1);assert.match(a.copied[0],/130,000/);assert.doesNotMatch(a.copied[0],/120,000/);assert.equal(a.pdfs.length,1);assert.ok(a.pdfs[0].texts.includes('amount: USD 130,000.00'));assert.deepEqual(a.downloads,['pdfFilename']);});
