'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
function fixture(){
 const file=process.env.GATEWAY_CONTROLLER||path.join(__dirname,'../assets/js/pages/fintech-shared-controllers/payment-gateway.js');
 const nodes=new Map();
 function make(id,value=''){
  const classes=new Set();const handlers={};
  const n={id,value,textContent:'',children:[],className:'',classList:{add:x=>classes.add(x),remove:x=>classes.delete(x),contains:x=>classes.has(x)},focus(){this.focused=true;},replaceChildren(){this.children=[];},appendChild(x){this.children.push(x);},addEventListener(name,fn){(handlers[name]??=[]).push(fn);},dispatch(name){for(const fn of handlers[name]||[])fn({target:this});}};
  nodes.set(id,n);return n;
 }
 const values={'pg-currency':'NGN','pg-avg-txn':'15000','pg-monthly-txns':'200'};
 for(let i=1;i<=3;i++)Object.assign(values,{['pg-name-'+i]:'Gateway '+String.fromCharCode(64+i),['pg-rate-'+i]:['1.5','1.4','2'][i-1],['pg-flat-'+i]:i===1?'100':'0',['pg-cap-'+i]:i===1?'2000':'0'});
 for(const [id,value]of Object.entries(values))make(id,value);
 const fields=[...nodes.values()];for(const id of ['pg-error','pg-results','pg-monthly-vol','pg-cheapest-fee','pg-most-exp','pg-annual-saving','pg-winner-name','pg-winner-detail','pg-table-body'])make(id);
 const context={document:{getElementById:id=>nodes.get(id),querySelectorAll:()=>fields,createElement:tag=>make('generated-'+nodes.size)}};
 context.window=context;vm.createContext(context);vm.runInContext(fs.readFileSync(file,'utf8'),context,{filename:file});
 return {nodes,calc:()=>context.calcGateway(),edit(id,value,event='input'){const n=nodes.get(id);n.value=value;n.dispatch(event);},visible:()=>nodes.get('pg-results').classList.contains('on')};
}
test('normal quote arithmetic and ordering remain unchanged',()=>{const f=fixture();f.calc();assert.equal(f.visible(),true);assert.match(f.nodes.get('pg-monthly-vol').textContent,/3,000,000/);assert.match(f.nodes.get('pg-cheapest-fee').textContent,/42,000/);assert.match(f.nodes.get('pg-winner-name').textContent,/Gateway B/);});
test('transaction edit retires old answer until deliberate comparison',()=>{const f=fixture();f.calc();f.edit('pg-avg-txn','10000');assert.equal(f.visible(),false);f.calc();assert.equal(f.visible(),true);assert.match(f.nodes.get('pg-monthly-vol').textContent,/2,000,000/);assert.match(f.nodes.get('pg-cheapest-fee').textContent,/28,000/);});
test('currency select change retires prior-currency result and recovery labels new currency',()=>{const f=fixture();f.calc();f.edit('pg-currency','GHS','change');assert.equal(f.visible(),false);f.calc();assert.match(f.nodes.get('pg-winner-detail').textContent,/GHS/);});
test('each quote name, rate, flat fee and cap invalidates existing result',()=>{for(const id of ['pg-name-1','pg-rate-1','pg-flat-1','pg-cap-1','pg-name-2','pg-rate-2','pg-flat-2','pg-cap-2','pg-name-3','pg-rate-3','pg-flat-3','pg-cap-3','pg-monthly-txns']){const f=fixture();f.calc();f.edit(id,f.nodes.get(id).value);assert.equal(f.visible(),false,id);}});
test('blank invalid amount has no visible result; correction clears old error before recovery',()=>{const f=fixture();f.calc();f.edit('pg-avg-txn','');f.calc();assert.equal(f.visible(),false);assert.match(f.nodes.get('pg-error').textContent,/positive transaction/);f.edit('pg-avg-txn','10000');assert.equal(f.nodes.get('pg-error').textContent,'');assert.equal(f.visible(),false);f.calc();assert.equal(f.visible(),true);assert.equal(f.nodes.get('pg-error').textContent,'');});
test('invalid quote remains rejected and corrected quote recovers with cap arithmetic',()=>{const f=fixture();f.calc();f.edit('pg-rate-1','-1');assert.equal(f.visible(),false);f.calc();assert.match(f.nodes.get('pg-error').textContent,/non-negative/);f.edit('pg-rate-1','10');f.edit('pg-cap-1','500');f.calc();assert.equal(f.visible(),true);const row=f.nodes.get('pg-table-body').children.find(r=>r.children[1].textContent==='Gateway A');assert.match(row.children[2].textContent,/500/);});
