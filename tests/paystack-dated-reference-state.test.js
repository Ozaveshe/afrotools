const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const engine=require('../assets/js/engines/paystack-fee-planner.js');
const source=fs.readFileSync(path.join(__dirname,'../assets/js/pages/paystack-fee-planner.js'),'utf8');
const due=new Date(engine.REVIEW_DUE_AT+'T23:59:59Z').getTime();

// Whole maintained controller, actual engine and event listeners; only browser
// DOM, local export sinks and the PDF font/document boundary are synthetic.
function fixture(locale,stamp=due+1000){
  const effects={downloads:[],copies:[],pdf:[],prints:[],fetches:[]};
  let clock=stamp;
  class Element{
    constructor(tag){this.tagName=tag;this.attrs={};this.dataset={};this.children=[];this.events={};this._text='';this._value='';this.hidden=false;this.disabled=false;this.classList={add(){},remove(){}};}
    setAttribute(key,value){this.attrs[key]=String(value);if(key==='hidden')this.hidden=true;if(key==='value')this._value=String(value);if(key==='class')this.className=value;if(key.startsWith('data-'))this.dataset[key.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=String(value);}
    get value(){return this._value;}
    set value(value){this._value=String(value);}
    get textContent(){return this._text+this.children.map(child=>child.textContent).join('');}
    set textContent(value){this._text=String(value);this.children=[];}
    append(...children){for(const child of children){child.parent=this;this.children.push(child);if(this.tagName==='select'&&this.children.length===1)this.value=child.attrs.value;}}
    replaceChildren(){this.children=[];this._text='';if(this.tagName==='select')this.value='';}
    matches(selector){if(selector==='[type=submit]')return this.attrs.type==='submit';const match=selector.match(/^\[([^=\]]+)(?:=([^\]]+))?\]$/);return !!match&&Object.hasOwn(this.attrs,match[1])&&(match[2]===undefined||this.attrs[match[1]]===match[2]);}
    querySelector(selector){return this.children.find(child=>child.matches(selector))||this.children.map(child=>child.querySelector(selector)).find(Boolean)||null;}
    closest(selector){return this.matches(selector)?this:this.parent?.closest(selector);}
    addEventListener(event,callback){this.events[event]=callback;}
    reset(){for(const name of ['amount','count','targetNet'])this.querySelector('[name='+name+']').value=name==='count'?'1':'';this.querySelector('[name=country]').value='NG';}
    click(){if(this.tagName==='a')effects.downloads.push({name:this.attrs.download,blob:blobs.get(this.attrs.href)});}
    remove(){if(this.parent)this.parent.children=this.parent.children.filter(child=>child!==this);}
  }
  const root=new Element('div');root.dataset.locale=locale;
  const body=new Element('body');body.append(root);
  const document={body,querySelector:selector=>selector==='[data-paystack-planner]'?root:null,createElement:tag=>new Element(tag)};
  const blobs=new Map();let nextBlob=0;
  class MockDate extends Date{constructor(...args){super(...(args.length?args:[clock]));}static now(){return clock;}}
  class PDF{
    addFileToVFS(){} addFont(){} setFont(){} setFontSize(){} addPage(){}
    getFont(){return {metadata:{characterToGlyph:()=>1}};}
    splitTextToSize(text){this.report=text;return text.split('\n');}
    text(){} save(name){effects.pdf.push({name,text:this.report});}
  }
  const window={AfroTools:{PaystackFeePlanner:engine},jspdf:{jsPDF:PDF},print:()=>effects.prints.push(root.querySelector('[data-report]').textContent)};
  const context={window,document,Date:MockDate,Intl,Blob,URL:{createObjectURL(blob){const url='blob:'+ ++nextBlob;blobs.set(url,blob);return url;},revokeObjectURL(){}},FormData:class{constructor(form){this.form=form;}get(name){return this.form.querySelector('[name='+name+']')?.value;}},navigator:{clipboard:{writeText:async text=>effects.copies.push(text)}},fetch:async url=>{effects.fetches.push(url);assert.equal(url,'/assets/fonts/noto-sans/NotoSans-Regular.ttf');return {ok:true,arrayBuffer:async()=>new Uint8Array([0,1]).buffer};},AbortController,btoa:text=>Buffer.from(text,'binary').toString('base64'),setTimeout,clearTimeout,Uint8Array,Promise};
  vm.runInNewContext(source,context,{filename:'paystack-fee-planner.js'});
  const form=root.querySelector('[data-form]');
  return {root,effects,field:name=>root.querySelector('[name='+name+']'),note:()=>root.querySelector('[data-reference-note]'),setClock:value=>{clock=value;},submit(){form.events.submit({preventDefault(){}});},edit(name,value){this.field(name).value=value;form.events.input({target:this.field(name)});},country(value){this.field('country').value=value;this.field('country').events.change();},async action(action){root.events.click({target:root.querySelector('[data-action='+action+']')});await new Promise(resolve=>setImmediate(resolve));await new Promise(resolve=>setImmediate(resolve));}};
}

for(const [locale,warning] of [['en','Confirm current Paystack fees'],['fr','Vérifiez les frais Paystack actuels'],['ha','Tabbatar da kuɗin Paystack na yanzu'],['sw','Thibitisha ada za sasa za Paystack']]){
  test(locale+' overdue mode calculates, preserves a permanent warning and carries provenance through local exports',async()=>{
    const ui=fixture(locale);
    assert.equal(ui.root.querySelector('[type=submit]').disabled,false);
    assert.equal(ui.note().hidden,false);assert.match(ui.note().textContent,new RegExp(warning));assert.match(ui.note().textContent,new RegExp(engine.REVIEWED_AT));
    ui.edit('amount','2000');ui.submit();
    assert.equal(ui.root.querySelector('[data-results]').hidden,false);
    assert.match(ui.root.querySelector('[data-report]').textContent,/30[.,]00/);
    for(const action of ['copy','txt','csv','json','pdf','print']){
      await ui.action(action);assert.equal(ui.note().hidden,false);assert.ok(ui.note().textContent.includes(warning));
    }
    assert.ok(ui.effects.copies[0].includes(warning));assert.ok(ui.effects.pdf[0].text.includes(warning));assert.ok(ui.effects.prints[0].includes(warning));
    const files=Object.fromEntries(await Promise.all(ui.effects.downloads.map(async file=>[file.name,await file.blob.text()])));
    assert.ok(files['paystack-fee-plan.txt'].includes(warning));
    const csv=files['paystack-fee-plan.csv'];for(const value of ['dated-reference',warning,engine.SOURCE_URL,engine.COUNTRIES.NG.pricingUrl,engine.REVIEWED_AT])assert.ok(csv.includes(value),value);
    const json=JSON.parse(files['paystack-fee-plan.json']);assert.equal(json.result.freshness.fresh,false);assert.equal(json.result.freshness.mode,'dated-reference');assert.ok(json.referenceNotice.includes(warning));assert.equal(json.result.source.url,engine.SOURCE_URL);
    assert.deepEqual(ui.effects.fetches,['/assets/fonts/noto-sans/NotoSans-Regular.ttf']);
    ui.edit('amount','-1');assert.equal(ui.root.querySelector('[data-results]').hidden,true);ui.submit();assert.equal(ui.root.querySelector('[data-results]').hidden,true);assert.equal(ui.note().hidden,false);
    const count=ui.effects.downloads.length;await ui.action('csv');assert.equal(ui.effects.downloads.length,count);
    ui.edit('amount','2000');ui.submit();assert.equal(ui.root.querySelector('[data-results]').hidden,false);
    ui.country('KE');assert.equal(ui.root.querySelector('[data-results]').hidden,true);assert.equal(ui.field('channel').children.length,3);assert.ok(ui.root.querySelector('[data-currency]').textContent.includes('KES'));ui.submit();assert.equal(ui.root.querySelector('[data-results]').hidden,false);
  });
}

test('an already calculated scenario crossing the review boundary is labelled on export without changing arithmetic',async()=>{
  const ui=fixture('en',due-1000);assert.equal(ui.note().hidden,true);ui.edit('amount','2000');ui.submit();
  ui.setClock(due+1000);await ui.action('json');
  const data=JSON.parse(await ui.effects.downloads[0].blob.text());assert.equal(data.result.perTransaction.fee,30);assert.equal(data.result.freshness.mode,'dated-reference');assert.equal(ui.note().hidden,false);assert.match(data.referenceNotice,/Confirm current Paystack fees/);
});
