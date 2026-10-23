'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const python="import runpy,json,sys;sys.stdout.reconfigure(encoding='utf-8');g=runpy.run_path(sys.argv[1]);t=next(x for x in g['TOOLS'] if x['slug']=='contractor-vs-employee');print(json.dumps({c[0]:g['gen_country_page'](t,*c) for c in g['COUNTRIES_54']}))";
const pages=JSON.parse(execFileSync(process.platform==='win32'?'python':'python3',['-I','-B','-c',python,path.join(root,'generate_hr_tools.py')],{encoding:'utf8'}));
const fields=['employeeGross','contractorInvoice','withholdingRate'];
class Element{
 constructor(){this.children=[];this.attrs={};this.listeners={};this.hidden=false;this.disabled=false;this.value='';this._text='';this.classList={add(){},remove(){}};}
 set textContent(v){this._text=v;this.children=[];}get textContent(){return this._text+this.children.map(e=>e.textContent).join('');}
 appendChild(e){this.children.push(e);return e;}setAttribute(k,v){this.attrs[k]=v;}getAttribute(k){return this.attrs[k]??null;}removeAttribute(k){delete this.attrs[k];}addEventListener(k,f){this.listeners[k]=f;}focus(){this.owner.activeElement=this;}createTHead(){return this.appendChild(new Element());}createTBody(){return this.appendChild(new Element());}insertRow(){return this.appendChild(new Element());}insertCell(){return this.appendChild(new Element());}click(){if(this.onClick)this.onClick(this);}remove(){}
}
function harness(cc='LS',clipboard=()=>Promise.resolve()){
 assert.match(pages[cc],/id="contractorComparison"/);assert.doesNotMatch(pages[cc],/data-country-name=/);
 const elements={},downloads=[],blobs=[],copied=[];
 const document={activeElement:null,body:new Element(),getElementById:id=>elements[id],createElement:tag=>{const e=new Element();if(tag==='a')e.onClick=x=>downloads.push({name:x.download,url:x.href});return e;}};
 for(const id of [...fields,...fields.map(id=>id+'Error'),'contractorComparison','comparisonStatus','comparisonCurrency','results','copyComparison','downloadComparison']){const e=elements[id]=new Element();e.id=id;e.owner=document;}
 elements.contractorComparison.attrs['data-comparison-country']=cc;
 const sandbox={document,Number,Blob,console,setTimeout:fn=>fn(),URL:{createObjectURL:b=>{blobs.push(b);return 'blob:synthetic';},revokeObjectURL(){}},navigator:{clipboard:{writeText:text=>{copied.push(text);return clipboard(text);}}}};sandbox.window=sandbox;vm.createContext(sandbox);
 for(const p of ['data/hr/employer-cost-data.js','data/hr/severance-data.js','engines/src/employee-cost-engine.js','assets/js/pages/contractor-comparison.js'])vm.runInContext(fs.readFileSync(path.join(root,p),'utf8'),sandbox,{filename:p});
 const edit=(id,value,event='input')=>{elements[id].value=String(value);elements[id].listeners[event]();};
 const calc=()=>elements.contractorComparison.listeners.submit({preventDefault(){}});
 const valid=(gross=10000,invoice=10000,rate='')=>{edit('employeeGross',gross);edit('contractorInvoice',invoice);edit('withholdingRate',rate);calc();};
 return {elements,document,downloads,blobs,copied,edit,calc,valid};
}
test('all54 generated routes have scoped comparison form and real controller',()=>{assert.equal(Object.keys(pages).length,54);for(const html of Object.values(pages)){assert.match(html,/id="contractorComparison"/);assert.match(html,/\/assets\/js\/pages\/contractor-comparison.js/);assert.match(html,/Add a withholding rate to estimate contractor take-home/);}});
test('Lesotho comparison useful without inventing missing tax or empty net rows',()=>{const h=harness();h.valid();assert.equal(h.elements.results.hidden,false);assert.match(h.elements.results.textContent,/Same employer cost/);assert.match(h.elements.results.textContent,/Cost-only comparison/);assert.doesNotMatch(h.elements.results.textContent,/0%|Contractor take-home after/);assert.match(h.elements.results.textContent,/LSL 10,000.00/);});
test('employee gross, contributions and total have distinct actual values',()=>{const h=harness('GH');h.valid(10000,9000,10);const rows=h.elements.results.children[1].children[1].children.map(row=>row.children.map(cell=>cell.textContent));assert.deepEqual(rows[0],['Gross salary / invoice','GHS 10,000.00','GHS 9,000.00']);assert.deepEqual(rows[1],['Employer contributions in model','GHS 1,300.00','Not added to invoice']);assert.deepEqual(rows[2],['Total employer cost','GHS 11,300.00','GHS 9,000.00']);assert.match(h.elements.results.textContent,/GHS 8,100.00/);});
test('input/change of each actual dependency empties stale result and disables Copy/TXT',()=>{for(const id of fields){const h=harness();h.valid();h.edit(id,20000,id==='withholdingRate'?'change':'input');assert.equal(h.elements.results.hidden,true);assert.equal(h.elements.results.textContent,'');assert.equal(h.elements.copyComparison.disabled,true);assert.equal(h.elements.downloadComparison.disabled,true);h.elements.downloadComparison.listeners.click();assert.equal(h.downloads.length,0);}});
test('valid and invalid recovery focuses the right field and clears obsolete feedback',()=>{for(const [id,value] of [['employeeGross',''],['contractorInvoice',-1],['withholdingRate',101]]){const h=harness();h.valid();h.edit(id,value);h.calc();assert.equal(h.elements.results.hidden,true);assert.equal(h.document.activeElement.id,id);assert.equal(h.elements[id+'Error'].hidden,false);h.edit(id,id==='withholdingRate'?10:20000);assert.equal(h.elements[id+'Error'].hidden,true);h.calc();assert.equal(h.elements.results.hidden,false);}});
test('more expensive contractor invoice has honest direction, not lower cost claim',()=>{const h=harness();h.valid(10000,20000);assert.match(h.elements.results.textContent,/Contractor invoice costs more/);assert.match(h.elements.results.textContent,/LSL 10,000.00/);assert.doesNotMatch(h.elements.results.textContent,/lower than employee/);});
test('copy and actual local TXT payload include assumed withholding and net',async()=>{const h=harness();h.valid(10000,9000,10);await h.elements.copyComparison.listeners.click();h.elements.downloadComparison.listeners.click();const text=await h.blobs[0].text();assert.equal(text,h.copied[0]);assert.equal(h.downloads[0].name,'contractor-comparison-ls.txt');for(const value of ['Employee gross salary: LSL 10,000.00','Visitor withholding assumption: 10%','Withheld from invoice: LSL 900.00','Contractor take-home after assumed withholding: LSL 8,100.00','does not reduce the business invoice cost'])assert.ok(text.includes(value),value);});
test('copy-only cost summary excludes net calculations until visitor supplies rate',async()=>{const h=harness();h.valid();await h.elements.copyComparison.listeners.click();assert.match(h.copied[0],/withholding and contractor take-home are not assessed/);assert.doesNotMatch(h.copied[0],/Visitor withholding assumption: 0%|Withheld from invoice:/);});
test('late copy completion cannot overwrite stale-state instruction',async()=>{let finish;const h=harness('LS',()=>new Promise(resolve=>finish=resolve));h.valid();const p=h.elements.copyComparison.listeners.click();h.edit('employeeGross',20000);finish();await p;assert.match(h.elements.comparisonStatus.textContent,/Inputs changed/);});

test('applicable employer model assumptions are disclosed in result and Copy/TXT only where relevant',async()=>{
 for(const [cc,required,irrelevant] of [
  ['NG',['40%, 15% and 10%','NGN 4,000.00','5 or more employees'],['60% of gross','1 employee: annual payroll']],
  ['ET',['60% of gross','ETB 6,000.00'],['40%, 15% and 10%','5 or more employees','1 employee: annual payroll']],
  ['ZA',['1 employee: annual payroll','ZAR 120,000.00','ZAR 500,000'],['60% of gross','40%, 15% and 10%','5 or more employees']],
  ['LS',[],['60% of gross','40%, 15% and 10%','5 or more employees','1 employee: annual payroll']]
 ]){
  const h=harness(cc);h.valid();await h.elements.copyComparison.listeners.click();h.elements.downloadComparison.listeners.click();const txt=await h.blobs[0].text();assert.equal(txt,h.copied[0]);
  for(const phrase of required){assert.ok(h.elements.results.textContent.includes(phrase),cc+': result '+phrase);assert.ok(txt.includes(phrase),cc+': export '+phrase);}
  for(const phrase of irrelevant){assert.ok(!h.elements.results.textContent.includes(phrase),cc+': irrelevant result '+phrase);assert.ok(!txt.includes(phrase),cc+': irrelevant export '+phrase);}
  assert.equal(h.elements.results.children.some(e=>String(e.className).includes('hr-model-assumptions')),required.length>0);
 }
});
