const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source=fs.readFileSync(process.env.LANGUAGE_BRIEF_SOURCE||path.join(__dirname,'../assets/js/pages/language-tool-focus.js'),'utf8');
function field({id='field',type='text',value='',checked=false,label='Field',tagName='INPUT',disabled=false,visible=true,options=[],selectedIndex=0}={}){
 const wrap={textContent:label};
 return {id,name:id,type,value,checked,tagName,disabled,visible,options,selectedIndex,style:{},closest(selector){return selector==='label'?wrap:null;},getAttribute(name){return name==='id'?id:null;},getBoundingClientRect(){return {width:visible?200:0,height:visible?40:0};}};
}
function harness(fields=[],result='Work — Iṣẹ',route='/tools/yoruba-translator/',nodes={}){
 const output={textContent:''},status={textContent:''},written=[],copied=[],downloads=[],blobs=[],saved=new Map([['unrelated-saved-note','keep me']]),listeners={},timers=[],network={requests:0};let clickHandler;
 function elem(tag){return {tagName:tag.toUpperCase(),style:{},classList:{add(){}},setAttribute(){},addEventListener(name,fn){if(name==='click')clickHandler=fn;},querySelector(s){return s==='[data-language-output]'?output:s==='[data-language-status]'?status:null;},click(){downloads.push({name:this.download,href:this.href});},remove(){},select(){}};}
 const phrase={visible:true,textContent:result,getBoundingClientRect(){return {width:200,height:40};}};
 const document={body:{classList:{add(){}},appendChild(el){written.push(el);}},createElement:elem,addEventListener(name,fn){listeners[name]=fn;},querySelector(s){if(s==='h1')return {textContent:'Language tool'};if(s[0]==='#')return fields.find(f=>f.id===s.slice(1))||nodes[s]||null;return nodes[s]||null;},querySelectorAll(s){if(s==='input, select, textarea')return fields;if(s==='.phrase:not([style*="display: none"])')return nodes.phrases||[phrase];return nodes[s]||[];}};
 const deny=()=>{network.requests++;throw Error('No external translation request is allowed');};
 const context={document,window:{location:{pathname:route},CSS:{escape:x=>x},setTimeout(fn){timers.push(fn);},fetch:deny},CSS:{escape:x=>x},getComputedStyle:e=>({display:e.visible===false?'none':'block',visibility:'visible'}),navigator:{clipboard:{writeText(text){copied.push(text);return Promise.resolve();}}},localStorage:{setItem(k,v){saved.set(k,v);}},URL:{createObjectURL(blob){blobs.push(blob);return 'blob:synthetic-'+blobs.length;},revokeObjectURL(){}},Blob,Date,setTimeout(fn){timers.push(fn);},fetch:deny};
 let observer;context.MutationObserver=class {constructor(callback){observer=callback;}observe(){}};
 vm.runInNewContext(source,context,{filename:'language-tool-focus.js',timeout:1000});assert.equal(typeof listeners.DOMContentLoaded,'function');listeners.DOMContentLoaded();assert.equal(typeof clickHandler,'function');
 return {output,status,fields,phrase,document,mutate(target){observer([{target}]);},fire(type){if(listeners[type])listeners[type]({});},flush(){while(timers.length)timers.shift()();},copied,downloads,blobs,saved,network,timers,async click(action){clickHandler({target:{closest(){return {getAttribute(){return action;}};}}});await Promise.resolve();assert.equal(network.requests,0);}};
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
 const input=field({id:'search',value:'Old query',label:'Search phrases'}),h=harness([input],'Old result');input.value='Work';h.phrase.textContent='Work — Iṣẹ';await h.click('save');const stored=JSON.parse(h.saved.get('afrotools:language-brief:yoruba-translator'));assert.ok(stored.brief.includes('Search phrases: Work'));assert.ok(stored.brief.includes('Work — Iṣẹ'));assert.ok(!stored.brief.includes('Old result'));assert.equal(h.saved.get('unrelated-saved-note'),'keep me');assert.ok(stored.savedAt);
});
test('radio groups record only the selected option and update at export time',async()=>{
 const formal=field({type:'radio',id:'formal',label:'Formal tone',value:'formal',checked:true}),casual=field({type:'radio',id:'casual',label:'Casual tone',value:'casual',checked:false}),h=harness([formal,casual]);assert.ok(h.output.textContent.includes('Formal tone: formal'));assert.ok(!h.output.textContent.includes('Casual tone: casual'));formal.checked=false;casual.checked=true;await h.click('copy');assert.ok(h.copied[0].includes('Casual tone: casual'));assert.ok(!h.copied[0].includes('Formal tone: formal'));
});
test('ordinary label text, selected option text, hidden and disabled exclusions are preserved',()=>{
 const h=harness([field({label:'Input translation',value:'translation'}),field({tagName:'SELECT',label:'Direction',options:[{text:'English to Yoruba'},{text:'Yoruba to English'}],selectedIndex:1,value:'yo-en'}),field({type:'hidden',value:'hidden synthetic'}),field({disabled:true,value:'disabled synthetic'}),field({visible:false,value:'invisible synthetic'})]);const text=h.output.textContent;assert.ok(text.includes('Input translation: translation'));assert.ok(text.includes('Direction: Yoruba to English'));for(const secret of ['hidden synthetic','disabled synthetic','invisible synthetic'])assert.ok(!text.includes(secret));
});
test('fresh download also captures a newly visible authored phrase result without translating it',async()=>{
 const h=harness([field({id:'search',value:'Work',label:'Search phrases'})],'Hello — Bawo');h.phrase.textContent='Work — Iṣẹ';await h.click('download');const text=await h.blobs[0].text();assert.ok(text.includes('Work — Iṣẹ'));assert.ok(!text.includes('Hello — Bawo'));assert.equal(h.network.requests,0);assert.ok(text.includes('not certified translation'));
});

function visible(text,attrs={}) {return {visible:true,textContent:text,getAttribute(name){return Object.hasOwn(attrs,name)?attrs[name]:null;},getBoundingClientRect(){return {width:200,height:40};},attrs};}
function cloud(slug,text='Ẹ ṣé.') {
 const input=field({id:slug==='pidgin-translator'?'srcText':'translateInput',value:'Thank you',label:'Original text'});
 const pidgin=slug==='pidgin-translator',out=visible(text),label=visible(pidgin?'Nigerian Pidgin result':'Yoruba output'),button=visible('Translate');
 const nodes={[pidgin?'#tgtOutput':'#translateOutput']:out,[pidgin?'#tgtLabel':'#translateOutputLabel']:label,'#translateBtn':button,phrases:Array.from({length:16},(_,i)=>visible('Unrelated phrase example '+i))};
 const h=harness([input],'ignored','/tools/'+slug+'/',nodes);return {...h,input,out,label,button,nodes};
}
for(const [slug,text] of [['swahili-translator','Asante.'],['yoruba-translator','Ẹ ṣé.']]) {
 test(slug+' exports the actual current cloud result before any phrase examples',async()=>{
  const h=cloud(slug,text);await h.click('download');const brief=await h.blobs[0].text();
  assert.ok(brief.includes(text));assert.ok(brief.includes('Original text: Thank you'));assert.ok(!brief.includes('Unrelated phrase example'));assert.equal(h.network.requests,0);
 });
 test(slug+' captures cleared, edited, pending and failed VT01 result states without stale output',async()=>{
  const h=cloud(slug,text);h.input.value='Edited draft';h.out.textContent='Translation will appear here.';h.fire('input');h.flush();assert.ok(!h.output.textContent.includes(text));assert.ok(h.output.textContent.includes('Edited draft'));
  await h.click('copy');assert.ok(!h.copied.at(-1).includes(text));
  h.button.textContent='Translating…';h.out.textContent='Translating…';await h.click('save');assert.ok(JSON.parse(h.saved.get('afrotools:language-brief:'+slug)).brief.includes('still pending'));
  h.button.textContent='Translate';h.out.textContent='Cloud translation is unavailable. The local phrasebook still works.';await h.click('download');assert.ok((await h.blobs.at(-1).text()).includes('No current translation is available'));
  h.input.value='';h.out.textContent='Cloud translation appears here after you opt in.';await h.click('copy');assert.ok(!h.copied.at(-1).includes(text));assert.ok(!h.copied.at(-1).includes('Unrelated phrase example'));
 });
}
test('Pidgin never exports an unowned late result and always preserves the original text',async()=>{
 const h=cloud('pidgin-translator','Late response for an older input');await h.click('download');const brief=await h.blobs[0].text();
 assert.ok(!brief.includes('Late response for an older input'));assert.ok(brief.includes('Original text: Thank you'));assert.ok(brief.includes('could not be matched'));
});
test('Pidgin accepts only exact ready input, output and direction ownership from its controller',async()=>{
 const h=cloud('pidgin-translator','I dey thank you.');Object.assign(h.out.attrs,{'data-translation-state':'ready','data-translation-input':h.input.value,'data-translation-output':h.out.textContent,'data-translation-target-label':h.label.textContent});
 await h.click('copy');assert.ok(h.copied.at(-1).includes('I dey thank you.'));
 for(const change of [()=>{h.input.value='Different text';},()=>{h.input.value='Thank you';h.label.textContent='English';},()=>{h.label.textContent='Nigerian Pidgin result';h.out.textContent='Unrelated later output';},()=>{h.out.textContent='I dey thank you.';h.out.attrs['data-translation-state']='pending';}]){
  change();await h.click('download');const brief=await h.blobs.at(-1).text();assert.ok(!brief.includes('I dey thank you.'));assert.ok(!brief.includes('Unrelated later output'));
 }
});
test('all phrasebook routes exclude unselected examples and keep an explicit search useful',async()=>{
 for(const slug of ['swahili-translator','yoruba-translator','pidgin-translator']){
  const search=field({id:'search',value:'',label:'Search phrases'}),h=harness([search],'Authored matching phrase','/tools/'+slug+'/');
  assert.ok(!h.output.textContent.includes('Authored matching phrase'));search.value='matching';await h.click('copy');assert.ok(h.copied[0].includes('Authored matching phrase'));
 }
});
test('transliteration and name tools retain current visible output without cloud translation',async()=>{
 const input=field({id:'input',value:'Latin mapping tokens',label:'Latin input'}),mapped=visible('Mapped Unicode Ɛ');
 const h=harness([input],'ignored','/tools/transliterate/',{'#output':mapped});await h.click('download');assert.ok((await h.blobs[0].text()).includes('Mapped Unicode Ɛ'));
 input.value='';mapped.textContent='';await h.click('copy');assert.ok(h.copied.at(-1).includes('No mapped script output yet'));
 const names=harness([],'ignored','/tools/african-name-meaning/',{'.name-card':[visible('Visible name meaning'),{...visible('Hidden name'),visible:false}]});await names.click('save');const b=JSON.parse(names.saved.get('afrotools:language-brief:african-name-meaning')).brief;assert.ok(b.includes('Visible name meaning'));assert.ok(!b.includes('Hidden name'));assert.equal(names.network.requests,0);
});
test('consent/input changes refresh the displayed brief without exporting or sending anything',()=>{
 const consent=field({type:'checkbox',value:'on',label,checked:false}),h=harness([consent]);consent.checked=true;h.fire('change');h.flush();assert.ok(h.output.textContent.includes(label+': Checked'));
 consent.checked=false;h.fire('afrotools:external-translation-consent-change');h.flush();assert.ok(h.output.textContent.includes(label+': Not checked'));assert.equal(h.downloads.length,0);assert.equal(h.copied.length,0);assert.equal(h.network.requests,0);
});
test('asynchronous result changes refresh display and brief changes do not refresh themselves',()=>{
 const h=cloud('swahili-translator','First current translation');h.flush();h.out.textContent='New current translation';
 h.mutate({nodeType:1,closest(){return null;},matches(){return true;},querySelector(){return null;}});h.flush();assert.ok(h.output.textContent.includes('New current translation'));assert.ok(!h.output.textContent.includes('First current translation'));
 const before=h.output.textContent;h.mutate({nodeType:1,closest(){return {};}});assert.equal(h.timers.length,0);assert.equal(h.output.textContent,before);assert.equal(h.network.requests,0);
});
test('late cloud cards receive one result-adjacent brief without a footer fallback',()=>{
 for(const slug of ['swahili-translator','yoruba-translator']){
  const nodes={},h=harness([],'irrelevant','/tools/'+slug+'/',nodes),children=[];
  const host={appendChild(child){children.push(child);child.parentNode=this;}};nodes['#liveTranslateCard']=host;
  const record={nodeType:1,closest(){return null;},matches(){return false;},querySelector(){return null;}};
  h.mutate(record);h.flush();h.mutate(record);h.flush();assert.equal(children.length,1);
  assert.match(children[0].innerHTML,/<details class="language-handoff-card"><summary>Copy or download current result<\/summary>/);assert.doesNotMatch(children[0].innerHTML,/<details[^>]*\bopen\b/);
 }
});
test('Pidgin, script mapping and names mount exports within their existing task containers',()=>{
 for(const slug of ['pidgin-translator','transliterate','african-name-meaning']){
  const children=[],host={appendChild(child){children.push(child);child.parentNode=this;}},nodes={};
  if(slug==='pidgin-translator')nodes['#panel-translate']=host;
  if(slug==='transliterate')nodes['#output']={...visible(''),closest(selector){assert.equal(selector,'.card');return host;}};
  if(slug==='african-name-meaning')nodes['#panel-search .card-body']=host;
  harness([],'ignored','/tools/'+slug+'/',nodes);assert.equal(children.length,1);assert.match(children[0].innerHTML,/<summary>Copy or download current result<\/summary>/);
 }
});
test('all five maintained consumer pages attach the shared brief once and load its existing stylesheet',()=>{
 const root=process.env.LANGUAGE_BRIEF_PAGE_ROOT||path.join(__dirname,'..');
 for(const slug of ['pidgin-translator','swahili-translator','yoruba-translator','transliterate','african-name-meaning']){
  const override=slug==='pidgin-translator'?process.env.PIDGIN_HTML:slug==='african-name-meaning'?process.env.LANGUAGE_BRIEF_NAMES_HTML:null;
  const html=fs.readFileSync(override||path.join(root,'tools',slug,'index.html'),'utf8');
  const tags=[...html.matchAll(/<script\b[^>]*src=["']\/assets\/js\/pages\/language-tool-focus\.js(?:\?[^"']*)?["'][^>]*>/g)].map(m=>m[0]);
  assert.equal(tags.length,1,slug+' actual HTML attaches one shared module');assert.match(tags[0],/\bdefer\b/);assert.match(html,/href=["']\/assets\/css\/language-focus\.css/);
  if(slug==='pidgin-translator')assert.match(html,/id="panel-translate"/);
  if(slug==='african-name-meaning')assert.match(html,/id="panel-search"/);
  if(slug==='transliterate')assert.match(html,/id="output"/);
 }
});

function authoredButtonNodes(markup,containerText) {
 const decode=text=>text.replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n))).replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&amp;/g,'&');
 return [...markup.matchAll(/<button\b([^>]+)>([\s\S]*?)<\/button>/g)].map(match=>{
  const attrs={};for(const a of match[1].matchAll(/([\w-]+)="([^"]*)"/g))attrs[a[1]]=decode(a[2]);
  const parent={textContent:containerText};
  return {attrs,textContent:decode(match[2].replace(/<[^>]+>/g,'')),parentNode:parent,
   classList:{contains(name){return (attrs.class||'').split(/\s+/).includes(name);}},
   closest(){return parent;},getAttribute(name){return attrs[name]??null;},setAttribute(name,value){attrs[name]=String(value);}};
 });
}
function actualPidginButtons() {
 const root=process.env.LANGUAGE_BRIEF_PAGE_ROOT||path.join(__dirname,'..');
 const html=fs.readFileSync(process.env.PIDGIN_HTML||path.join(root,'tools/pidgin-translator/index.html'),'utf8');
 const entries=html.slice(html.indexOf('var PHRASES='),html.indexOf('var swapped ='));
 const renderer=html.slice(html.indexOf('function filterPhrases()'),html.indexOf('function resetPhrasebook()'));
 const rendered={};const context={pbCat:'All',document:{getElementById(id){return rendered[id]||(rendered[id]={textContent:'',innerHTML:''});}}};
 vm.runInNewContext(entries+'\nfunction getFilteredPhrases(){return PHRASES;}\n'+renderer+'\nfilterPhrases();',context);
 const cloud=html.slice(html.indexOf('id="panel-translate"'),html.indexOf('id="panel-phrasebook"'));
 assert.ok(cloud.length>0,'actual cloud panel found before phrasebook');
 const buttons=[...authoredButtonNodes(cloud,'Optional Cloud Translator The phrasebook stays local'),...authoredButtonNodes(rendered.phrases.innerHTML,'Hello / How are you? How far? Most common greeting')].filter(b=>b.classList.contains('p-btn'));
 assert.equal(buttons.length,220,'two actual cloud controls plus two buttons for each of 109 actual phrase entries');
 return buttons;
}
test('actual Pidgin cloud and 109 phrase DOM buttons retain authored names, icons and actions after brief refresh',async()=>{
 const buttons=actualPidginButtons(),before=buttons.map(b=>JSON.stringify({attrs:b.attrs,text:b.textContent}));
 const h=harness([],'','/tools/pidgin-translator/',{'.speak-btn, .p-btn':buttons});h.flush();h.fire('input');h.flush();await h.click('copy');
 buttons.forEach((b,i)=>{assert.equal(JSON.stringify({attrs:b.attrs,text:b.textContent}),before[i]);assert.equal(b.getAttribute('data-mark'),null);});
 const clear=buttons.find(b=>b.getAttribute('onclick')==='clearCloudTranslation()');assert.equal(clear.textContent,'Clear');assert.equal(clear.getAttribute('aria-label'),null);
 const temporary=buttons.find(b=>b.getAttribute('aria-label')==='Copy temporary translation');assert.equal(temporary.textContent,'📋');
 const speech=buttons.find(b=>b.getAttribute('onclick')==="speak('How far?')");assert.equal(speech.textContent,'🔊');assert.match(speech.getAttribute('aria-label'),/^Play synthetic voice preview/);
 const phraseCopy=buttons.find(b=>b.getAttribute('onclick')==="copyText('How far?')");assert.equal(phraseCopy.getAttribute('aria-label'),'Copy listed Pidgin wording');
 const calls=[],actions={clearCloudTranslation(){calls.push('clear');},speak(text){calls.push(['speak',text]);},copyText(text){calls.push(['copy',text]);},document:{getElementById(){return {textContent:'I dey thank you.'};}}};
 for(const b of [clear,temporary,speech,phraseCopy])vm.runInNewContext(b.getAttribute('onclick'),actions);
 assert.deepEqual(calls,['clear',['copy','I dey thank you.'],['speak','How far?'],['copy','How far?']]);
});
test('Swahili and Yoruba authored pronunciation labels survive shared brief initialization and refresh',async()=>{
 const root=process.env.LANGUAGE_BRIEF_PAGE_ROOT||path.join(__dirname,'..');
 for(const slug of ['swahili-translator','yoruba-translator']){
  const html=fs.readFileSync(path.join(root,'tools',slug,'index.html'),'utf8');
  const buttons=authoredButtonNodes(html,'Phrase context').filter(b=>b.classList.contains('speak-btn'));
  assert.equal(buttons.length,1,'actual maintained dynamic speech button template');
  const before=JSON.stringify(buttons[0].attrs),h=harness([],'','/tools/'+slug+'/',{'.speak-btn, .p-btn':buttons});h.flush();await h.click('copy');
  assert.equal(JSON.stringify(buttons[0].attrs),before);assert.match(buttons[0].getAttribute('aria-label'),/^Listen to /);assert.equal(buttons[0].getAttribute('data-mark'),null);
 }
});
test('shared CSS leaves authored action text and icons visible without generated A or C pseudo-content',()=>{
 const css=fs.readFileSync(process.env.LANGUAGE_BRIEF_CSS||path.join(__dirname,'../assets/css/language-focus.css'),'utf8');
 for(const rule of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)){
  if(/\.(?:p-btn|speak-btn)\b/.test(rule[1])){
   assert.doesNotMatch(rule[2],/font-size\s*:\s*0(?:\s|!|;|$)/,'action text must not be suppressed');
   assert.doesNotMatch(rule[2],/content\s*:\s*attr\(data-mark\)/,'no fabricated action initials');
  }
 }
 assert.match(css,/\.tab-icon::after\{content:attr\(data-mark\)/,'unrelated tab presentation retained');
});
