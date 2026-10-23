'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const html=fs.readFileSync(process.env.YORUBA_HTML||path.join(__dirname,'../tools/yoruba-translator/index.html'),'utf8');
const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
const controller=scripts.filter(s=>s.includes('const PHRASES=')&&s.includes('function filter()'));
assert.equal(controller.length,1,'one genuine local phrasebook controller');
function fixture(){
 const elements={search:{value:''},cats:{innerHTML:''},countBadge:{textContent:''},phrases:{innerHTML:''}};
 const context=vm.createContext({document:{getElementById:id=>elements[id],querySelectorAll:()=>[]}});
 vm.runInContext(controller[0],context,{filename:'actual-yoruba-phrasebook.js',timeout:1000});
 const rows=JSON.parse(vm.runInContext('JSON.stringify(PHRASES)',context));
 return {elements,rows,context,search(value){elements.search.value=value;context.filter();return elements.phrases.innerHTML;},category(value){context.setCat(value);},snapshot(){return vm.runInContext('JSON.stringify(PHRASES)',context);}};
}
test('canonically equivalent Yoruba input finds identical marked phrase and English meaning',()=>{const f=fixture();const phrase=f.rows.find(p=>p.en==='Good morning');assert.ok(phrase);const nfc=f.search(phrase.lang.normalize('NFC'));assert.match(nfc,/Good morning/);assert.ok(nfc.includes(phrase.lang));assert.equal(f.search(phrase.lang.normalize('NFD')),nfc);});
test('plain keyboard query finds authored marked Work alongside other substring matches',()=>{const f=fixture();const found=f.search('ise');assert.ok(found.includes('Work'));assert.ok(found.includes('Iṣẹ́'));assert.ok(found.includes('I am busy'),'other matching alternatives remain visible');});
test('unmarked query returns alternatives without changing distinct authored Yoruba forms',()=>{const f=fixture();const found=f.search('oko');const candidates=f.rows.filter(p=>['Car','Farm / farmland'].includes(p.en));assert.equal(candidates.length,2);for(const row of candidates){assert.ok(found.includes(row.en),row.en);assert.ok(found.includes(row.lang),row.lang);}assert.notEqual(candidates[0].lang,candidates[1].lang);});
test('English search keeps case and outer/internal whitespace tolerant matching',()=>{const f=fixture();const result=f.search('  GOOD   MORNING  ');assert.ok(result.includes('Good morning'));assert.ok(result.includes('Ẹ káàárọ̀'));});
test('empty query retains all175 authored rows and category filtering',()=>{const f=fixture();assert.equal(f.rows.length,175);f.search('');assert.equal(f.elements.countBadge.textContent,'175 phrases');f.category('Greetings');assert.equal(f.elements.countBadge.textContent,f.rows.filter(p=>p.cat==='Greetings').length+' phrases');assert.ok(!f.elements.phrases.innerHTML.includes('Farm / farmland'));f.category('All');assert.equal(f.elements.countBadge.textContent,'175 phrases');});
test('no-match lookup clears previous results and next valid lookup recovers',()=>{const f=fixture();f.search('Good morning');assert.equal(f.search('no-such-phrase-4f168'), '');assert.equal(f.elements.countBadge.textContent,'0 phrases');assert.ok(f.search('Good morning').includes('Ẹ káàárọ̀'));});
test('search folding never mutates display, pronunciation, note or authored phrase data',()=>{const f=fixture(),before=f.snapshot();for(const q of ['ise','oko','Ẹ káàárọ̀'.normalize('NFD'),'owo',''])f.search(q);assert.equal(f.snapshot(),before);assert.ok(f.elements.phrases.innerHTML.includes('Owó'));assert.ok(f.elements.phrases.innerHTML.includes('Tone and dot-below marks distinguish'));});
