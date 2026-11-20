const fs = require('fs'), vm = require('vm'), assert = require('assert'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
function controller(html){return [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map(m=>m[1]).find(s=>s.includes('function calculate()'))}
function load(html,gross,basic,on=true){const nodes=new Map();function node(id){if(!nodes.has(id))nodes.set(id,{value:id==='grossSalary'?String(gross):id==='basicSalary'?basic:'',textContent:'',innerHTML:'',style:{},classList:{contains:()=>on,add(){},remove(){},toggle(){}},setAttribute(){},removeAttribute(){},getAttribute(){return ''},addEventListener(){},focus(){},scrollIntoView(){},getContext(){return {}}});return nodes.get(id)}const context={document:{getElementById:node,querySelector:s=>s.startsWith('[data-tog=')?node('napsaToggle'):null,querySelectorAll:()=>[],addEventListener(){}},console,getComputedStyle:()=>({getPropertyValue:()=>''}),Chart:function(){this.destroy=()=>{}},AfroChartColors:{doughnut:[],series:[],grid:''},setTimeout(){},clearTimeout(){}};context.window=context;vm.createContext(context);vm.runInContext(controller(html),context);vm.runInContext('calculate()',context);return {context,nodes,result:JSON.parse(JSON.stringify(context.RESULT))}}


const cases = [
 {gross:446820,basic:'300000',on:true,tax:136835.4,napsa:22341,nhima:3000,net:284643.6,employer:472161},
 {gross:446832,basic:'300000',on:true,tax:136839.84,napsa:22341.6,nhima:3000,net:284650.56,employer:472173.6},
 {gross:446844,basic:'300000',on:true,tax:136844.28,napsa:22341.6,nhima:3000,net:284658.12,employer:472185.6},
 {gross:180000,basic:'0',on:true,tax:38112,napsa:9000,nhima:0,net:132888,employer:189000},
 {gross:180000,basic:'120000',on:true,tax:38112,napsa:9000,nhima:1200,net:131688,employer:190200},
 {gross:600000,basic:'480000',on:true,tax:193512,napsa:22341.6,nhima:4800,net:379346.4,employer:627141.6},
 {gross:150000,basic:'',on:true,tax:27012,napsa:7500,nhima:1500,net:113988,employer:159000},
 {gross:61200,basic:'61200',on:true,tax:0,napsa:3060,nhima:612,net:57528,employer:64872},
 {gross:180000,basic:'120000',on:false,tax:38112,napsa:0,nhima:1200,net:140688,employer:190200}
];
const close=(a,b)=>assert(Math.abs(a-b)<0.000001, `${a} != ${b}`);
for (const fixture of cases) {
 const results=[];
 for (const file of ['zambia/zm-paye.html','sw/zambia/kikokotoo-kodi-mshahara/index.html']) {
  const html=fs.readFileSync(path.join(ROOT,file),'utf8');
  const {result,context,nodes}=load(html,fixture.gross,fixture.basic,fixture.on);
  for(const [field,key] of [['annualPAYE','tax'],['napsa','napsa'],['nhima','nhima'],['netAnnual','net'],['totalEmployerCostAnnual','employer']]) close(result[field],fixture[key]);
  close(result.empNhima,fixture.nhima);
  close(result.netAnnual+result.napsa+result.nhima+result.annualPAYE,result.gross);
  close(result.totalEmployerCostAnnual,result.gross+result.empNapsa+result.empNhima);
  close(vm.runInContext('_grossToNet(RESULT.gross)',context),result.netAnnual);
  vm.runInContext("PERIOD='monthly';renderSelectedPeriod()",context);
  assert(nodes.get('resContent').innerHTML.includes('NHIMA'));
  close(vm.runInContext('selectedPeriod().net',context),fixture.net/12);
  results.push(result);
  assert(!/37\.5%|57,600|1,221\.80|1,708\.20|20,498\.40|K7,560 (?:plus|\+) 37%/.test(html));
 }
 for (const key of ['gross','basicAnnual','annualPAYE','napsa','nhima','empNhima','empNapsa','netAnnual','monthlyNet','monthlyGross','monthlyTax','totalEmployerCostAnnual'])close(results[0][key],results[1][key]);
}
for(const basic of ['-1','180001'])for(const file of ['zambia/zm-paye.html','sw/zambia/kikokotoo-kodi-mshahara/index.html'])assert.strictEqual(load(fs.readFileSync(path.join(ROOT,file),'utf8'),180000,basic).result,null);
console.log('18 paired official-scenario EN/SW calculations, basic/gross distinction, caps, default NHIMA, contribution toggle, row/forward parity and four invalid basic cases pass.');
