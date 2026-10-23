const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../assets/js/pages/language-tool-focus.js'),'utf8');
function field({id='field',type='text',value='',checked=false,label='Field',tagName='INPUT',disabled=false,visible=true,options=[],selectedIndex=0}={}){
 const wrap={textContent:label};
 return {id,name:id,type,value,checked,tagName,disabled,visible,options,selectedIndex,style:{},closest(selector){return selector==='label'?wrap:null;},getAttribute(name){return name==='id'?id:null;},getBoundingClientRect(){return {width:visible?200:0,height:visible?40:0};}};
}
function harness(fields=[],result='Work — Iṣẹ',route='/tools/yoruba-translator/'){
 const output={textContent:''},status={textContent:''},written=[],copied=[],downloads=[],blobs=[],saved=new Map([['unrelated-saved-note','keep me']]),listeners={},timers=[],network={requests:0};let clickHandler;
 function elem(tag){return {tagName:tag.toUpperCase(),style:{},classList:{add(){}},setAttribute(){},addEventListener(name,fn){if(name==='click')clickHandler=fn;},querySelector(s){return s==='[data-language-output]'?output:s==='[data-language-status]'?status:null;},click(){downloads.push({name:this.download,href:this.href});},remove(){},select(){}};}
 const phrase={visible:true,textContent:result,getBoundingClientRect(){return {width:200,height:40};}};
 const document={body:{classList:{add(){}},appendChild(el){written.push(el);}},createElement:elem,addEventListener(name,fn){listeners[name]=fn;},querySelector(s){if(s==='h1')return {textContent:'Yoruba Translator'};return null;},querySelectorAll(s){if(s==='input, select, textarea')return fields;if(s==='.phrase:not([style*="display: none"])')return [phrase];return [];}};
 const deny=()=>{network.requests++;throw Error('No external translation request is allowed');};
 const context={document,window:{location:{pathname:route},CSS:{escape:x=>x},setTimeout(fn){timers.push(fn);},fetch:deny},CSS:{escape:x=>x},getComputedStyle:e=>({display:e.visible===false?'none':'block',visibility:'visible'}),navigator:{clipboard:{writeText(text){copied.push(text);return Promise.resolve();}}},localStorage:{setItem(k,v){saved.set(k,v);}},URL:{createObjectURL(blob){blobs.push(blob);return 'blob:synthetic-'+blobs.length;},revokeObjectURL(){}},Blob,Date,setTimeout(fn){timers.push(fn);},fetch:deny};
 vm.runInNewContext(source,context,{filename:'language-tool-focus.js',timeout:1000});assert.equal(typeof listeners.DOMContentLoaded,'function');listeners.DOMContentLoaded();assert.equal(typeof clickHandler,'function');
 return {output,status,fields,phrase,copied,downloads,blobs,saved,network,timers,async click(action){clickHandler({target:{closest(){return {getAttribute(){return action;}};}}});await Promise.resolve();assert.equal(network.requests,0);}};
}
const label='I choose to send this text for external machine translation.';
test('unchecked checkbox is captured as not checked with its exact label, never default on',()=>{
 const consent=field({id:'consent',type:'checkbox',value:'on',checked:false,label});const h=harness([consent]);assert.ok(h.output.textContent.includes(label+': Not checked'));assert.ok(!h.output.textContent.includes('translati:'));assert.ok(!h.output.textContent.includes(': on'));assert.equal(consent.checked,false);assert.equal(h.network.requests,0);
});
test('copy freshly captures a checked choice without changing consent or sending a request',async()=>{
 const consent=field({type:'checkbox',value:'on',checked:false,label});const h=harness([consent]);consent.checked=true;await h.click('copy');assert.ok(h.copied[0].includes(label+': Checked'));assert.equal(consent.checked,true);assert.equal(consent.value,'on');assert.equal(h.network.requests,0);
});
test('unchecking before TXT download captures the current state without manual Refresh',async()=>{
 const consent=field({type:'checkbox',value:'on',checked:true,label});const h=harness([consent]);consent.checked=false;await h.click('download');const text=await h.blobs[0].text();assert.ok(text.includes(label+': Not checked'));assert.ok(!text.includes(label+': Checked'));assert.equal(h.downloads[0].name,'yoruba-translator-language-brief.txt');assert.equal(consent.checked,false);
});
test('saving captures current visible field and result while preserving unrelated saved data',async()=>{
 const input=field({value:'Old query',label:'Search phrases'}),h=harness([input],'Old result');input.value='Work';h.phrase.textContent='Work — Iṣẹ';await h.click('save');const stored=JSON.parse(h.saved.get('afrotools:language-brief:yoruba-translator'));assert.ok(stored.brief.includes('Search phrases: Work'));assert.ok(stored.brief.includes('Work — Iṣẹ'));assert.ok(!stored.brief.includes('Old result'));assert.equal(h.saved.get('unrelated-saved-note'),'keep me');assert.ok(stored.savedAt);
});
test('radio groups record only the selected option and update at export time',async()=>{
 const formal=field({type:'radio',id:'formal',label:'Formal tone',value:'formal',checked:true}),casual=field({type:'radio',id:'casual',label:'Casual tone',value:'casual',checked:false}),h=harness([formal,casual]);assert.ok(h.output.textContent.includes('Formal tone: formal'));assert.ok(!h.output.textContent.includes('Casual tone: casual'));formal.checked=false;casual.checked=true;await h.click('copy');assert.ok(h.copied[0].includes('Casual tone: casual'));assert.ok(!h.copied[0].includes('Formal tone: formal'));
});
test('ordinary label text, selected option text, hidden and disabled exclusions are preserved',()=>{
 const h=harness([field({label:'Input translation',value:'translation'}),field({tagName:'SELECT',label:'Direction',options:[{text:'English to Yoruba'},{text:'Yoruba to English'}],selectedIndex:1,value:'yo-en'}),field({type:'hidden',value:'hidden synthetic'}),field({disabled:true,value:'disabled synthetic'}),field({visible:false,value:'invisible synthetic'})]);const text=h.output.textContent;assert.ok(text.includes('Input translation: translation'));assert.ok(text.includes('Direction: Yoruba to English'));for(const secret of ['hidden synthetic','disabled synthetic','invisible synthetic'])assert.ok(!text.includes(secret));
});
test('fresh download also captures a newly visible authored phrase result without translating it',async()=>{
 const h=harness([],'Hello — Bawo');h.phrase.textContent='Work — Iṣẹ';await h.click('download');const text=await h.blobs[0].text();assert.ok(text.includes('Work — Iṣẹ'));assert.ok(!text.includes('Hello — Bawo'));assert.equal(h.network.requests,0);assert.ok(text.includes('not certified translation'));
});
