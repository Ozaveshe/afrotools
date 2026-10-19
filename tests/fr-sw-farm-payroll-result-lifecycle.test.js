'use strict';
const fs=require('node:fs'),vm=require('node:vm'),zlib=require('node:zlib'),assert=require('node:assert/strict');
const ROOT=require('node:path').join(__dirname,'..');
const input={files:new Proxy(Object.create(null),{get(_target,file){return fs.readFileSync(require('node:path').join(ROOT,file),'utf8')}})};
function blocks(html){return [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].map((m,ordinal)=>({ordinal,attrs:m[1],src:(/\bsrc="([^"]+)"/.exec(m[1])||[])[1],body:m[2]}));}
function fixture(html){
 const ids=new Map(),sinks=[],timers=[],all=[];let document;
 function match(n,s){if(s[0]==='#')return n.id===s.slice(1);if(s[0]==='.')return n.className.split(/\s+/).includes(s.slice(1));let m=/^\[([\w-]+)\]$/.exec(s);if(m)return n.hasAttribute(m[1]);throw Error('Unimplemented selector: '+s);}
 class Element{
 constructor(tag){this.tagName=tag.toUpperCase();this.attrs=new Map();this.children=[];this.listeners=new Map();this.parentNode=null;this.style={};this._value='';this._text='';this._html='';this.defaultValue='';this.checked=false;this.hidden=false;this.disabled=false;all.push(this);}
 set id(v){this.attrs.set('id',String(v));ids.set(String(v),this)}get id(){return this.attrs.get('id')||''}
 set className(v){this.attrs.set('class',v)}get className(){return this.attrs.get('class')||''}
 set value(v){this._value=String(v)}get value(){return this._value}
 set textContent(v){this._text=String(v);this.children=[]}get textContent(){return this._text+this.children.map(c=>c.textContent).join('')}
 set innerHTML(v){this._html=String(v);this.children=[]}get innerHTML(){return this._html}
 get dataset(){const o={};for(const[k,v]of this.attrs)if(k.startsWith('data-'))o[k.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=v;return o}
 setAttribute(k,v){if(k==='id')this.id=v;else this.attrs.set(k,String(v));if(k==='hidden')this.hidden=true;if(k==='disabled')this.disabled=true}
 getAttribute(k){return this.attrs.has(k)?this.attrs.get(k):null}hasAttribute(k){return this.attrs.has(k)}removeAttribute(k){this.attrs.delete(k);if(k==='hidden')this.hidden=false;if(k==='disabled')this.disabled=false}
 appendChild(n){n.parentNode=this;this.children.push(n);if(this.tagName==='SELECT'&&this.children.length===1)this.value=n.value;return n}
 replaceChildren(...nodes){for(const n of this.children)n.parentNode=null;this.children=[];for(const n of nodes)this.appendChild(n)}
 insertBefore(n,b){const i=this.children.indexOf(b);assert(i>=0);n.parentNode=this;this.children.splice(i,0,n);return n}
 remove(){if(this.parentNode)this.parentNode.children=this.parentNode.children.filter(n=>n!==this)}
 get nextElementSibling(){if(!this.parentNode)return null;const a=this.parentNode.children;return a[a.indexOf(this)+1]||null}
 querySelectorAll(s){return this.children.flatMap(n=>[...(match(n,s)?[n]:[]),...n.querySelectorAll(s)])}querySelector(s){return this.querySelectorAll(s)[0]||null}
 closest(s){return match(this,s)?this:this.parentNode?.closest(s)||null}
 addEventListener(k,f){if(!this.listeners.has(k))this.listeners.set(k,[]);this.listeners.get(k).push(f)}
 focus(){document.activeElement=this}scrollIntoView(){}
 click(){if(this.disabled)return;fire(this,'click');if(this.tagName==='A')sinks.push({type:'download',href:this.href,name:this.download})}
 }
 const root=new Element('document');document={getElementById:id=>ids.get(id)||null,createElement:t=>new Element(t),createTextNode:t=>{const n=new Element('#text');n.textContent=t;return n},querySelectorAll:s=>root.querySelectorAll(s),querySelector:s=>root.querySelector(s),addEventListener:(...a)=>root.addEventListener(...a)};
 let stack=[root];const markup=html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,'').replace(/<!--[\s\S]*?-->/g,'');
 for(const m of markup.matchAll(/<\/?([a-z][\w-]*)\b((?:"[^"]*"|'[^']*'|[^'">])*)>/gi)){
  const tag=m[1].toLowerCase();if(m[0][1]==='/'){for(let i=stack.length-1;i>0;i--)if(stack[i].tagName===tag.toUpperCase()){stack.length=i;break;}continue}
  const n=new Element(tag);for(const a of m[2].matchAll(/(?:^|\s)([\w:-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>]+)))?/g)){const v=a[2]??a[3]??a[4]??'';n.setAttribute(a[1],v);if(a[1]==='value')n.value=n.defaultValue=v;}
  stack.at(-1).appendChild(n);if(tag==='body')document.body=n;if(tag==='option'&&n.hasAttribute('selected'))n.parentNode.value=n.value;
  if(!['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'].includes(tag)&&!m[0].endsWith('/>'))stack.push(n);
 }
 function fire(n,type){const event={type,target:n,preventDefault(){},stopImmediatePropagation(){this.stopped=true}};for(let p=n;p;p=p.parentNode){for(const fn of p.listeners.get(type)||[]){fn(event);if(event.stopped)return}}}
 function reset(){for(const n of all)if(['INPUT','SELECT'].includes(n.tagName))n.value=n.defaultValue;fire(ids.get('payrollForm'),'reset');while(timers.length)timers.shift()();}
 return{document,ids,sinks,timers,fire,reset};
}
function page(locale,row,options={}){
 const file=row[locale==='fr'?'french':'swahili'].file,html=options.html||input.files[file];assert(html,file);const f=fixture(html),loaded=[],errors=[];let next=0;const blobs=new Map();
 const ctx={document:f.document,console:{log(){},error(e){errors.push(String(e.stack||e))}},Intl,Blob:class{constructor(parts,options){this.parts=parts;this.type=options.type}},URL:{createObjectURL(b){const key='blob:fixture/'+(++next);blobs.set(key,b);return key},revokeObjectURL(){}},navigator:{clipboard:{writeText:t=>{f.sinks.push({type:'copy',text:t});return Promise.resolve()}}},localStorage:{getItem(){return null},setItem:(key,value)=>f.sinks.push({type:'save',key,value})},location:{origin:'https://afrotools.com',pathname:row[locale==='fr'?'french':'swahili'].route,href:'https://afrotools.com'+row[locale==='fr'?'french':'swahili'].route},setTimeout:fn=>{f.timers.push(fn);return f.timers.length},clearTimeout(){}};ctx.window=ctx;vm.createContext(ctx);
 const scripts=blocks(html);const configuration=scripts.filter(s=>s.body.startsWith('window.__'+locale.toUpperCase()+'_AGRI_PAGE__='));assert.equal(configuration.length,1);vm.runInContext(configuration[0].body,ctx,{filename:file+':config'});
 const modelSet=new Set(['data/agriculture/farm-payroll-data.js','engines/farm-payroll-engine.js','assets/js/lib/farm-payroll-input-validation.js','assets/js/lib/ng-farm-payroll-contributions.js','assets/js/lib/ng-farm-payroll-labour-assumptions.js','assets/js/lib/ng-farm-payroll-contribution-form.js','assets/js/lib/ng-farm-payroll-pdf.js']);
 let controller;if(locale==='fr'){const candidates=scripts.filter(s=>s.body.includes('window.__FR_AGRI_TEST__=')&&s.body.includes('function calculate()'));assert.equal(candidates.length,1);controller=candidates[0]}else{controller=scripts.find(s=>s.src?.split('?')[0]==='/assets/js/pages/sw-agriculture-farm-payroll.js');assert(controller)}
 for(const s of scripts){const p=s.src?.split('?')[0].replace(/^\//,'');if(!modelSet.has(p))continue;assert(s.ordinal<controller.ordinal,p);assert(!/\b(?:async|defer)\b/.test(s.attrs));assert(input.files[p],p);vm.runInContext(input.files[p],ctx,{filename:p});loaded.push(p)}
 assert(loaded.includes('data/agriculture/farm-payroll-data.js'));assert(loaded.includes('engines/farm-payroll-engine.js'));
 const data=ctx.AfroTools.FarmPayrollData[row.country.code];if(options.benchmark==='none'){data.agriMinWage_monthly=null;data.nationalMinWage_monthly=null;data.agriMinWage_daily=null;}if(options.benchmark==='daily'){data.agriMinWage_monthly=null;data.nationalMinWage_monthly=null;data.agriMinWage_daily=100;}
 const calls=[],calc=ctx.AfroTools.FarmPayrollEngine.calculate;ctx.AfroTools.FarmPayrollEngine.calculate=(i,c)=>{const result=calc(i,c);calls.push({input:JSON.parse(JSON.stringify(i)),result});return result};
 vm.runInContext(locale==='fr'?(options.controller||controller.body):input.files['assets/js/pages/sw-agriculture-farm-payroll.js'],ctx,{filename:locale==='fr'?file+':complete-controller':'assets/js/pages/sw-agriculture-farm-payroll.js'});assert.deepEqual(errors,[],'complete bootstrap errors');
 const test=ctx['__'+locale.toUpperCase()+'_AGRI_TEST__'];assert(test);const get=id=>{const n=f.ids.get(id);assert(n,'actual element '+id);return n};
 function set(values,event){for(const[id,v]of Object.entries(values)){get(id).value=String(v);if(event)f.fire(get(id),event)}}
 if(row.country.code==='NG')set({ng_pension:'not-applicable',ng_health:'not-applicable',ng_housing:'not-participating',ng_wageCoverage:'unknown',ng_leaveBudget:'exclude'});
 function action(name){const attr=locale==='fr'?'data-action':'data-result-action';const n=f.document.querySelectorAll('['+attr+']').find(n=>n.getAttribute(attr)===name);assert(n,'action '+name);n.click();}
 function exports(){return f.sinks.map(s=>s.type==='download'?{...s,raw:blobs.get(s.href)?.parts.join('')}:s)}
 return{...f,ctx,test,get,set,action,exports,loaded,calls,row,file,html,submit(){f.fire(get('payrollForm'),'submit');return test.latest?.result||null}};
}


// Genuine generated FR output and current maintained FR/SW controllers; no browser or current-law proof.
const test=require('node:test');
const frenchRenderer=require('../scripts/lib/fr-agriculture-family-contracts/farm-payroll');
const manifests={fr:JSON.parse(input.files['data/localization/fr-agriculture-parity-manifest.json']),sw:JSON.parse(input.files['data/localization/sw-agriculture-parity-manifest.json'])};
for(const mode of ['fr-maintained','sw-maintained','fr-generated']){const locale=mode.slice(0,2);for(const row of manifests[locale].rows.filter(r=>r.family==='farm-payroll'&&r.country)){
 const code=row.country.code;const create=()=>page(locale,row,mode==='fr-generated'?{html:frenchRenderer.render(row,{manifest:manifests.fr,familyRows:manifests.fr.rows.filter(r=>r.family==='farm-payroll')})}:{});
 test(mode+' '+code+' valid real result and actual JSON export',()=>{const p=create();const result=p.submit();assert(result);assert(Number.isFinite(result.farmMonthlyCost));assert.equal(p.calls.length,1);assert.equal(p.get('resultPanel').hidden,false);p.action('json');const s=p.exports().filter(s=>s.type==='download');assert.equal(s.length,1);const report=JSON.parse(s[0].raw);assert.equal(locale==='fr'?report.entrees.grossPay:report.ingizo.grossPay,p.test.latest.input.grossPay);assert.equal(locale==='fr'?report.resultat.coutMensuelExploitation:report.matokeo.gharamaShambaKwaMwezi,result.farmMonthlyCost)});
 test(mode+' '+code+' changed input removes stale report and export capability',async()=>{for(const event of ['input','change']){const p=create();assert(p.submit());p.action('json');assert.equal(p.exports().filter(s=>s.type==='download').length,1);const before=p.exports().length;const changed=Number(p.get('grossPay').value)+123;p.set({grossPay:changed},event);for(const action of ['json','csv','txt','copy','save'])p.action(action);await Promise.resolve();await Promise.resolve();assert.equal(p.test.latest,null);assert.equal(p.test.reportObject(),null);assert.equal(p.get('resultPanel').hidden,true);assert.equal(p.get('emptyState').hidden,false);assert.equal(p.exports().length,before);assert(p.submit());p.action('json');const report=JSON.parse(p.exports().filter(s=>s.type==='download').at(-1).raw);assert.equal(locale==='fr'?report.entrees.grossPay:report.ingizo.grossPay,changed)}});
 test(mode+' '+code+' invalid submit cannot publish previous valid result',()=>{const p=create();assert(p.submit());p.set({numWorkers:0});assert.equal(p.submit(),null);assert(p.get('formError').textContent);assert.equal(p.test.latest,null);assert.equal(p.test.reportObject(),null);assert.equal(p.get('resultPanel').hidden,true);p.action('json');assert.equal(p.exports().length,0)});
 test(mode+' '+code+' actual reset clears then genuine retry works',()=>{const p=create();assert(p.submit());p.reset();assert.equal(p.test.latest,null);assert.equal(p.test.reportObject(),null);assert.equal(p.get('resultPanel').hidden,true);p.action('json');assert.equal(p.exports().length,0);if(code==='NG'){assert.equal(p.document.querySelectorAll('#ng_pension').length,1);p.set({ng_pension:'not-applicable',ng_health:'not-applicable',ng_housing:'not-participating',ng_wageCoverage:'unknown',ng_leaveBudget:'exclude'})}assert(p.submit());p.action('json');assert.equal(p.exports().filter(s=>s.type==='download').length,1)});
}}
for(const locale of ['fr','sw'])for(const benchmark of ['none','daily'])for(const type of ['permanent','casual','seasonal','piece_rate'])test(locale+' synthetic '+benchmark+' '+type+' genuine comparator stays qualified',()=>{const row=manifests[locale].rows.find(r=>r.country?.code==='DZ'&&r.family==='farm-payroll');const p=page(locale,row,{benchmark});p.set({workerType:type,grossPay:200,daysWorked:26,ratePerUnit:10,unitsCompleted:80},'change');const r=p.submit();assert(r);if(benchmark==='none'||type==='piece_rate'||type==='permanent'){assert.equal(r.mwCheck,null);assert.equal(p.get('minimumStatus').textContent,locale==='fr'?'Non calculable':'Hakuna ulinganisho')}else{assert(r.mwCheck);assert.equal(r.mwCheck.minWage,100);assert.equal(r.mwCheck.compliant,true);p.set({grossPay:50},'input');const low=p.submit();assert.equal(low.mwCheck.compliant,false);assert.equal(p.get('minimumStatus').textContent,locale==='fr'?'Sous le repère':'Chini ya rejea')}assert(!/\bok\b/.test(p.get('minimumStatus').className));});

// Invalid -> native-reset semantics -> valid: do not retain an old error after recovery.
for(const mode of ['fr-maintained','fr-generated'])for(const row of manifests.fr.rows.filter(r=>r.family==='farm-payroll'&&r.country))test(mode+' '+row.country.code+' invalid reset clears alert and genuine valid retry',()=>{
 const p=page('fr',row,mode==='fr-generated'?{html:frenchRenderer.render(row,{manifest:manifests.fr,familyRows:manifests.fr.rows.filter(r=>r.family==='farm-payroll')})}:{});assert(p.submit());const valid=JSON.stringify(p.test.reportObject());p.set({numWorkers:0},'input');assert.equal(p.submit(),null);assert(p.get('formError').textContent);assert.equal(p.test.reportObject(),null);p.reset();assert.equal(p.get('formError').textContent,'');assert.equal(p.get('resultPanel').hidden,true);assert.equal(p.test.latest,null);assert.equal(p.test.reportObject(),null);p.action('json');assert.equal(p.exports().length,0);
 if(row.country.code==='NG'){assert.equal(p.document.querySelectorAll('#ng_pension').length,1);p.set({ng_pension:'not-applicable',ng_health:'not-applicable',ng_housing:'not-participating',ng_wageCoverage:'unknown',ng_leaveBudget:'exclude'})}assert(p.submit());assert.equal(p.get('formError').textContent,'');assert.equal(JSON.stringify(p.test.reportObject()),valid);p.action('json');assert.equal(p.exports().filter(s=>s.type==='download').length,1);
});
