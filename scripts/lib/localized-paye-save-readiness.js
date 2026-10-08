"use strict";
const acorn=require('acorn');
function calculation(html,name="calculate"){
 const found=[];
 for(const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)){
  if(!match[1].includes('function '+name))continue;
  const offset=match.index+match[0].indexOf(match[1]);
  function walk(node){if(!node||typeof node!=='object')return;if(node.type==='FunctionDeclaration'&&node.id.name===name)found.push({body:node.body.body,offset,start:node.start,end:node.end});for(const [key,value] of Object.entries(node)){if(key==='start'||key==='end')continue;if(Array.isArray(value))value.forEach(walk);else if(value&&typeof value==='object')walk(value);}}
  walk(acorn.parse(match[1],{ecmaVersion:'latest'}));
 }
 if(found.length!==1)throw Error('Expected one calculate function');return found[0];
}
function refreshSaveReadiness(target,source){
 const src=calculation(source),dst=calculation(target);
 const index=src.body.findIndex(n=>n.type==='VariableDeclaration'&&n.declarations.some(d=>d.id.name==='saveButton'));
 if(index<0||src.body[index+1].type!=='IfStatement')throw Error('Missing source save readiness contract');
 const block=source.slice(src.offset+src.body[index].start,src.offset+src.body[index+1].end);
 if(!block.includes('saveButton.disabled = false'))throw Error('Unexpected source readiness');
 const existing=dst.body.findIndex(n=>n.type==='VariableDeclaration'&&n.declarations.some(d=>d.id.name==='saveButton'));
 if(existing>=0){const current=target.slice(dst.offset+dst.body[existing].start,dst.offset+dst.body[existing+1].end);if(current!==block)throw Error('Target readiness differs');return target;}
 const anchors=dst.body.filter(n=>target.slice(dst.offset+n.start,dst.offset+n.end)==="$('bonusCard').style.display = 'block';");
 if(anchors.length!==1)throw Error('Missing unique result anchor');
 const at=dst.offset+anchors[0].end;return target.slice(0,at)+'\n    '+block+target.slice(at);
}
module.exports={refreshSaveReadiness};

function refreshGhanaSafety(target,source){
 const staleRate="setTimeout(() => { $('rateFill').style.width = Math.min(R.effectiveRate * 200, 100) + '%'; }, 50);";
 const safeRate="const renderedResult = R;\n    setTimeout(() => { if (R === renderedResult) $('rateFill').style.width = Math.min(R.effectiveRate * 200, 100) + '%'; }, 50);";
 if(target.includes(staleRate)){if(target.split(staleRate).length!==2)throw Error('Ambiguous rate callback');target=target.replace(staleRate,safeRate);}
 if(target.includes('// Ghana result safety parity v1'))return target;
 function replace(oldValue,newValue){if(target.split(oldValue).length!==2)throw Error('Expected unique safety anchor: '+oldValue.slice(0,60));target=target.replace(oldValue,newValue);}
 const invalid=calculation(source,'invalidateResult');
 let body=source.slice(invalid.offset+invalid.start,invalid.offset+invalid.end);
 body=body.replace('Inputs changed. Calculate again to update your results.','Les données ont changé. Relancez le calcul pour actualiser les résultats.').replace('Calculate your salary first for personalised Ghana tax advice.','Calculez votre salaire avant de demander une analyse fiscale.');
 replace('  function calculate() {','  // Ghana result safety parity v1\n  let salaryRecalculationTimer = null;\n  '+body+'\n\n  function calculate() {\n    invalidateResult();');
 replace("$('bonusCard').style.display = 'block';","$('bonusCard').style.display = 'block';\n    $('resultsCard').removeAttribute('aria-hidden');\n    $('calculationStatus').textContent = '';");
 replace("salaryEl.addEventListener('input', debounce(calculate, 300));","salaryEl.addEventListener('input', () => { invalidateResult(); salaryRecalculationTimer = setTimeout(calculate, 300); });\n    ['basicSalary', 'tier3Amt'].forEach(id => $(id).addEventListener('input', invalidateResult));");
 for(const mode of ['gross','net']){const id=mode==='gross'?'modeGross':'modeNet';const prefix="$('"+id+"').addEventListener('click', () => { ";replace(prefix+"calcMode = '"+mode+"';",prefix+"if (calcMode !== '"+mode+"') invalidateResult(); calcMode = '"+mode+"';");}
 replace("cb.addEventListener('change', () => {","cb.addEventListener('change', () => {\n        invalidateResult();");
 replace("async function renderChart(type) {\n    if (!R) return;","async function renderChart(type) {\n    if (!R) return;\n    const chartResult = R;");
 replace("    if (chartInstance) chartInstance.destroy();","    if (R !== chartResult || type !== chartType) return;\n    if (chartInstance) chartInstance.destroy();");
 replace("{ gross: R.gross, effective_rate: R.effectiveRate }","{ tool_id: 'gh-paye', country_code: 'GH', mode: calcMode }");
 const button=/<button\b[^>]*\bid="calcBtn"[^>]*>/g;const matches=[...target.matchAll(button)];if(matches.length!==1)throw Error('Expected one calculate button');
 const at=matches[0].index;target=target.slice(0,at)+'<p class="f-note" id="calculationStatus" role="status" aria-live="polite"></p>\n          '+target.slice(at);
 return target;
}
module.exports.refreshGhanaSafety=refreshGhanaSafety;

function refreshGhanaAi(target,source){
 for(const name of ['getAI','sendChat']){
  const src=calculation(source,name),dst=calculation(target,name);
  const start=src.offset+src.start,end=src.offset+src.end;
  target=target.slice(0,dst.offset+dst.start)+source.slice(start,end)+target.slice(dst.offset+dst.end);
 }
 return target;
}
module.exports.refreshGhanaAi=refreshGhanaAi;
