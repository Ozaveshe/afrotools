const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
function load(language){
 const html=fs.readFileSync(path.join(__dirname,'../tools/'+language+'-translator/index.html'),'utf8');
 const scripts=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]).filter(s=>/(?:const|var|let) PHRASES=/.test(s));assert.equal(scripts.length,1,'unique complete phrase controller');
 const inputTag=html.match(/<input\b[^>]*id="search"[^>]*>/)[0];const handler=inputTag.match(/oninput="([^"]+)"/)[1];const elements={};
 for(const id of ['search','countBadge','cats','phrases','phraseRecovery','phraseEmpty','usePhraseQuery'])elements[id]={value:'',textContent:'',innerHTML:'',hidden:true,focus(){this.focused=true;}};
 const document={getElementById(id){assert.ok(elements[id],'unexpected search controller element '+id);return elements[id];},querySelectorAll(){return [];}};
 let requests=0;const context=vm.createContext({document,SpeechSynthesisUtterance(){throw Error('No voice requested');},speechSynthesis:{speak(){throw Error('No voice requested');}},fetch(){requests++;throw Error('No cloud request');}});
 vm.runInContext(scripts[0],context,{timeout:1000});
 return {html,elements,context,inventory:JSON.parse(vm.runInContext('JSON.stringify(PHRASES)',context)),search(value){elements.search.value=value;vm.runInContext(handler,context);assert.equal(requests,0);return this.rows();},rows(){return [...elements.phrases.innerHTML.matchAll(/<span class="en">([^<]*)<\/span>/g)].map(m=>m[1]);},native(){return [...elements.phrases.innerHTML.matchAll(/<span class="lang"[^>]*>([^<]*)<\/span>/g)].map(m=>m[1]);},category(name){const buttons=[...elements.cats.innerHTML.matchAll(/<button\b[^>]*onclick="([^"]+)"[^>]*>([^<]+)<\/button>/g)];const button=buttons.find(m=>m[2]===name);assert.ok(button);vm.runInContext(button[1],context);return this.rows();}};
}
test('Igbo NFC and decomposed native queries return the same authored Work result',()=>{
 const h=load('igbo');assert.ok(h.search('Ọrụ').includes('Work'));assert.deepEqual(h.search('Ọrụ'.normalize('NFD')),h.search('Ọrụ'));assert.ok(h.native().includes('Ọrụ'));
});
test('Igbo plain keyboard retrieval retains native spelling rather than rewriting translation',()=>{
 const h=load('igbo');assert.ok(h.search('oru').includes('Work'));assert.ok(h.native().includes('Ọrụ'));assert.ok(!h.native().includes('Oru'));
});
test('Hausa unhooked keyboard query returns all six Kuɗi alternatives, retaining letters and notes',()=>{
 const h=load('hausa'),native=h.search('Kuɗi');assert.equal(native.length,6);assert.deepEqual(h.search('kudi'),native);assert.ok(h.native().includes('Kuɗi'));assert.match(h.elements.phrases.innerHTML,/The imperative is gendered/);
});
test('Hausa plain karshen finds the authored Ƙarshen phrase',()=>{
 const h=load('hausa');assert.deepEqual(h.search('karshen'),h.search('Ƙarshen'));assert.ok(h.rows().includes('Final price'));assert.ok(h.native().includes('Ƙarshen farashi'));
});
test('English queries and category filters still select actual inventory rows',()=>{
 for(const lang of ['igbo','hausa']){const h=load(lang);assert.ok(h.search('Water').includes('Water'));h.search('');const expected=h.inventory.filter(p=>p.cat==='Business').map(p=>p.en);assert.deepEqual(h.category('Business'),expected);assert.equal(h.search('Water').length,0);h.search('');assert.deepEqual(h.category('All'),h.inventory.map(p=>p.en).map(x=>x.replaceAll("'",'&#39;')));}
});
test('no-match recovery clears the query and returns every authored row in All categories',()=>{
 for(const [lang,count,empty] of [['igbo',129,'phraseRecovery'],['hausa',131,'phraseEmpty']]){const h=load(lang);assert.equal(h.search('zz-no-such-phrase-xy').length,0);assert.equal(h.elements[empty].hidden,false);h.search('');h.category('All');assert.equal(h.rows().length,count);assert.equal(h.elements[empty].hidden,true);assert.equal(h.elements.countBadge.textContent,count+' phrases');}
});
test('retrieval never mutates the authored inventory or opts into cloud translation',()=>{
 for(const lang of ['igbo','hausa']){const h=load(lang),original=JSON.stringify(h.inventory);for(const q of ['oru','kudi','karshen','','zz-no-such'])h.search(q);assert.equal(vm.runInContext('JSON.stringify(PHRASES)',h.context),original);assert.match(h.html,/external-translation-consent\.js/);assert.doesNotMatch(h.html,/checked="checked"[^>]*data-external-translation/);}
});
