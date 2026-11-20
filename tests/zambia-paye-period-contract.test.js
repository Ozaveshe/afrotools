const fs = require('fs'), vm = require('vm'), assert = require('assert'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
function controller(html){return [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map(m=>m[1]).find(s=>s.includes('function calculate()'))}
function load(html,gross,basic,on=true){const nodes=new Map();function node(id){if(!nodes.has(id))nodes.set(id,{value:id==='grossSalary'?String(gross):id==='basicSalary'?basic:'',textContent:'',innerHTML:'',style:{},classList:{contains:()=>on,add(){},remove(){},toggle(){}},setAttribute(){},removeAttribute(){},getAttribute(){return ''},addEventListener(){},focus(){},scrollIntoView(){},getContext(){return {}}});return nodes.get(id)}const context={document:{getElementById:node,querySelector:s=>s.startsWith('[data-tog=')?node('napsaToggle'):null,querySelectorAll:()=>[],addEventListener(){}},console,getComputedStyle:()=>({getPropertyValue:()=>''}),Chart:function(){this.destroy=()=>{}},AfroChartColors:{doughnut:[],series:[],grid:''},setTimeout(){},clearTimeout(){}};context.window=context;vm.createContext(context);vm.runInContext(controller(html),context);vm.runInContext('calculate()',context);return {context,nodes,result:JSON.parse(JSON.stringify(context.RESULT))}}

for (const sw of [false, true]) {
  const file = sw ? 'sw/zambia/kikokotoo-kodi-mshahara/index.html' : 'zambia/zm-paye.html';
  const html = fs.readFileSync(path.join(ROOT, file), 'utf8');
  const loaded = load(html, 180000, '108000');
  const {context, nodes, result} = loaded;
  assert.strictEqual(result.annualPAYE, 38112);
  assert.strictEqual(result.netAnnual, 131808);
  for (const period of ['annual', 'monthly']) {
    vm.runInContext(`PERIOD='${period}';renderSelectedPeriod()`, context);
    const divisor = period === 'monthly' ? 12 : 1;
    assert.strictEqual(vm.runInContext('selectedPeriod().net', context), result.netAnnual / divisor);
    assert.strictEqual(vm.runInContext('selectedPeriod().gross', context), 180000 / divisor);
    assert(!/NaN|undefined|Infinity/.test(nodes.get('resContent').innerHTML));
    assert(nodes.get('resLabel').textContent.includes(sw ? (period === 'monthly' ? 'Mwezi' : 'Mwaka') : (period === 'monthly' ? 'Monthly' : 'Annual')));
  }
  vm.runInContext('calculate()', context);
  assert(nodes.get(sw ? 'resKiasi' : 'resAmount').textContent.includes('10,984'));
  context.CALC_MODE = 'net';
  vm.runInContext('renderSelectedPeriod()', context);
  assert(nodes.get(sw ? 'resKiasi' : 'resAmount').textContent.includes('15,000'));
  context.navigator = { share(payload) { context.shared = payload; } };
  vm.runInContext('shareResult()', context);
  assert(context.shared.text.includes('15,000'));
  assert(context.shared.text.includes(sw ? '/mwezi' : '/month'));
  assert(!context.shared.text.includes('180,000'));
  nodes.get('grossSalary').value = '';
  vm.runInContext('calculate()', context);
  assert.strictEqual(context.RESULT, null);
  const unticked = load(html, 180000, '108000', false);
  vm.runInContext("PERIOD='monthly';renderSelectedPeriod()", unticked.context);
  assert(!unticked.nodes.get('resContent').innerHTML.includes('NAPSA (5%'));
  assert(html.includes('/assets/js/pages/zambia-paye-reverse.js'));
  assert(!html.includes('src="/assets/js/lib/net-to-gross.js'));
}
console.log('Zambia annual input, selected-period recalculation/share, inverse presentation, invalidation and unticked contributions pass in EN/SW. Historical tax fixtures are unchanged.');
