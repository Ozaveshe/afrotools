const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const html = fs.readFileSync(process.env.WA_LINK_HTML || path.join(__dirname, '../tools/whatsapp-link/index.html'), 'utf8');
const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(x => x[1]).filter(x => x.includes("let currentLink = '';") && x.includes('function generateLink()'));
assert.equal(scripts.length, 1, 'exactly one maintained page controller');
function fixture(qrAvailable = true) {
  const downloads=[], copied=[], qrs=[], nodes={};
  function node(id='') {
    let text=''; const children=[]; const classes=new Set();
    return {id,width:180,height:180,value:'',innerHTML:'',href:'',disabled:false,children,
      getContext:()=>({fillRect:()=>{},drawImage:()=>{}}),
      get textContent(){return text}, set textContent(v){text=v;children.length=0},
      classList:{add:x=>classes.add(x),remove:x=>classes.delete(x),contains:x=>classes.has(x),toggle:(x,on)=>on?classes.add(x):classes.delete(x)},
      listeners:{},addEventListener(type,fn){(this.listeners[type]??=[]).push(fn)},
      fire(type){for(const fn of this.listeners[type]||[]) fn({target:this})},
      removeAttribute(name){if(name==='href')this.href=''},
      appendChild(child){children.push(child)},querySelector(tag){return children.find(x=>x.tag===tag)||null},
      toDataURL:()=> 'data:image/png;base64,c3ludGhldGlj', click(){downloads.push({href:this.href,name:this.download})}
    };
  }
  for(const id of ['countryCode','phoneNumber','message','businessName','offerItem','messageTemplate','linkCoach','resultArea','linkDisplay','openLink','resultCoach','qrCanvas','qrStatus','downloadQrButton','toast','singleTab','bulkTab','bulkCountry','bulkNumbers','bulkMessage','bulkResults']) nodes[id]=node(id);
  nodes.countryCode.value='1'; nodes.messageTemplate.value='order'; nodes.downloadQrButton.disabled=true;
  function QRCode(box,options){qrs.push(options.text);const canvas=node();canvas.tag='canvas';box.appendChild(canvas);}
  QRCode.CorrectLevel={M:0}; QRCode.toCanvas=(box,text)=>qrs.push(text);
  const context={document:{getElementById:id=>nodes[id],querySelectorAll:()=>[],createElement:()=>node()},navigator:{clipboard:{writeText:async x=>copied.push(x)}},setTimeout:()=>0,clearTimeout:()=>{}};
  if(qrAvailable)context.QRCode=QRCode;
  vm.createContext(context);vm.runInContext(scripts[0],context,{filename:'maintained-whatsapp-link-controller.js'});
  const edit=(id,value,type='input')=>{nodes[id].value=value;nodes[id].fire(type)};
  const generate=(phone='2025550123',message='Invoice DEMO-101 for USD 50')=>{edit('phoneNumber',phone);edit('message',message);context.generateLink();};
  return {context,nodes,edit,generate,downloads,copied,qrs};
}
function unavailable(f){assert.equal(f.nodes.resultArea.classList.contains('show'),false);f.context.copyLink();f.context.downloadQR();assert.equal(f.copied.length,0);assert.equal(f.downloads.length,0);assert.equal(f.nodes.openLink.href,'');}
test('formatted international number and native reminder text produce a useful encoded current link',()=>{const f=fixture();f.generate('+1 (202) 555-0123','Invoice USD 50 — thank you & please confirm');const u=new URL(f.nodes.openLink.href);assert.equal(u.pathname,'/12025550123');assert.equal(u.searchParams.get('text'),'Invoice USD 50 — thank you & please confirm');assert.equal(f.nodes.resultArea.classList.contains('show'),true)});
test('blank after valid result removes all stale share and QR actions',()=>{const f=fixture();f.generate();f.edit('phoneNumber','');f.context.generateLink();unavailable(f);assert.match(f.nodes.toast.textContent,/enter a phone number/i)});
test('letters and extensions are not generated as share-ready phone destinations',()=>{for(const value of ['abc','2025550123 ext 5','<invalid>']){const f=fixture();f.generate(value);unavailable(f);assert.match(f.nodes.toast.textContent,/digits/i)}});
for(const [id,value,type] of [['phoneNumber','2025550144','input'],['countryCode','44','change'],['message','Invoice DEMO-101 for USD 75','input']])test(id+' edit invalidates old link until Generate',()=>{const f=fixture();f.generate();f.edit(id,value,type);unavailable(f)});
test('recalculation after edits uses the new message and selected country',()=>{const f=fixture();f.generate();f.edit('message','Invoice DEMO-101 for USD 75');f.edit('countryCode','44','change');f.edit('phoneNumber','020 7946 0000');f.context.generateLink();const u=new URL(f.nodes.openLink.href);assert.equal(u.pathname,'/442079460000');assert.equal(u.searchParams.get('text'),'Invoice DEMO-101 for USD 75');assert.equal(f.nodes.resultArea.classList.contains('show'),true)});
test('applying an existing template invalidates old output and remains regeneratable',()=>{const f=fixture();f.generate();f.nodes.businessName.value='Synthetic shop';f.nodes.offerItem.value='DEMO order';f.context.applyTemplate();unavailable(f);assert.match(f.nodes.message.value,/Synthetic shop/);f.context.generateLink();assert.equal(new URL(f.nodes.openLink.href).searchParams.get('text'),f.nodes.message.value)});
test('broad international structure accepts seven to fifteen digits and rejects overflow',()=>{for(const phone of ['123456','23456789012345']){const f=fixture();f.generate(phone);assert.equal(f.nodes.resultArea.classList.contains('show'),true)}const f=fixture();f.generate('234567890123456');unavailable(f)});
test('missing QR library preserves usable link but cannot export a blank QR',()=>{const f=fixture(false);f.generate();assert.equal(f.nodes.resultArea.classList.contains('show'),true);f.context.downloadQR();assert.equal(f.downloads.length,0);assert.match(f.nodes.qrStatus.textContent,/QR unavailable/)});
test('QR download belongs to current generated link and is unavailable after an edit',()=>{const f=fixture();f.generate();assert.equal(f.qrs.at(-1),f.nodes.openLink.href);f.context.downloadQR();assert.equal(f.downloads.length,1);assert.equal(f.downloads[0].name,'whatsapp-qr.png');f.edit('message','Changed');f.context.downloadQR();assert.equal(f.downloads.length,1)});
test('Clear removes only current page inputs and generated output while retaining country',()=>{const f=fixture();f.generate();f.context.clearForm();unavailable(f);assert.equal(f.nodes.phoneNumber.value,'');assert.equal(f.nodes.message.value,'');assert.equal(f.nodes.countryCode.value,'1')});
