const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const engine=require('../engines/src/business-roi-engine.js');
const html=fs.readFileSync(path.join(__dirname,'../tools/budget-planner/index.html'),'utf8');
const categories=vm.runInNewContext(html.match(/var CATEGORIES=(\[[\s\S]*?\n\s*\]);/)[1]);
const calculate=html.slice(html.indexOf('function calculate('),html.indexOf('function saveBudget(){'));
function run(input){
 const elements={currency:{value:'USD'}};
 const get=id=>elements[id]||(elements[id]={textContent:'',innerHTML:'',className:'',style:{},scrollIntoView(){}});
 const context={window:{BusinessRoiEngine:engine},CATEGORIES:categories,parseNum:Number,fmt:n=>String(n),saveBudget(){},document:{getElementById:get,querySelectorAll(selector){if(selector==='.inc-amt, .exp-amt')return[];if(selector==='.inc-amt')return[{value:String(input.income)}];const index=Number(selector.match(/#catRows(\d+)/)[1]);return[{value:String(index===0?input.housing:index===7?input.planned:0)}];}}};
 vm.runInNewContext(html.slice(html.indexOf('function parseNum('),html.indexOf('var CUR_SYMBOLS='))+calculate+'\ncalculate();',context);
 return {rate:get('sRate').textContent,balance:get('sSavings').textContent,message:get('ruleIndicator').innerHTML,color:get('sRate').className};
}
for(const fixture of [
 {name:'allocated savings plus remaining balance',income:1000,housing:600,planned:200,rate:'40.0%',balance:'200'},
 {name:'fully allocated savings',income:1000,housing:800,planned:200,rate:'20.0%',balance:'0'},
 {name:'unallocated balance without explicit savings',income:1000,housing:800,planned:0,rate:'20.0%',balance:'200'},
 {name:'all income allocated to expenses',income:1000,housing:1000,planned:0,rate:'0.0%',balance:'0'},
 {name:'empty budget remains finite',income:0,housing:0,planned:0,rate:'0.0%',balance:'0'}
])test(fixture.name,()=>{const result=run(fixture);assert.equal(result.rate,fixture.rate);assert.equal(result.balance,fixture.balance);assert.ok(!result.message.includes('NaN'));});
test('deficit takes priority over an apparently healthy savings allocation',()=>{const result=run({income:1000,housing:900,planned:200});assert.equal(result.balance,'-100');assert.equal(result.rate,'20.0%');assert.match(result.message,/rule-bad/);assert.match(result.message,/not fully funded/);assert.doesNotMatch(result.message,/at or above/);assert.match(result.color,/red/);});
test('display distinguishes allocations from unallocated balance',()=>{assert.match(html,/>Total Allocated<\/div>/);assert.match(html,/>Unallocated Balance<\/div>/);assert.match(html,/>Savings Allocation<\/div>/);assert.doesNotMatch(calculate,/editable example/);});
