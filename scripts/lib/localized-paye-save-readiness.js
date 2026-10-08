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
 if(!target.includes('window.sendChat = sendChat;')){if(!target.includes('window.calculate = calculate;'))throw Error('Missing Ghana public handlers');target=target.replace('window.calculate = calculate;','window.sendChat = sendChat;\n  window.calculate = calculate;');}
 for(const name of ['getAI','sendChat']){
  const src=calculation(source,name),dst=calculation(target,name);
  const start=src.offset+src.start,end=src.offset+src.end;
  target=target.slice(0,dst.offset+dst.start)+source.slice(start,end)+target.slice(dst.offset+dst.end);
 }
 return target;
}
module.exports.refreshGhanaAi=refreshGhanaAi;

function refreshGhanaControls(target){
 const names={togSSNIT:'SSNIT Niveaux I + II',togTier3:'SSNIT Niveau III',togMarriage:'Abattement pour Mariage',togChild1:'1 enfant',togChild2:'2 enfants',togChild3:'3 enfants ou plus',togDisabled:'Abattement Handicap',togOldAge:'Troisième Âge (60+)',togDependent:'Parent à Charge'};
 let count=0;
 target=target.replace(/<input\b[^>]*\bid="(tog[^"]+)"[^>]*>/g,(tag,id)=>{
  if(!names[id])throw Error('Unknown Ghana checkbox');count++;
  tag=tag.replace(/\s+hidden(?:="[^"]*")?/g,'').replace(/\s+aria-label="[^"]*"/g,'');
  if(!/\bclass=/.test(tag))tag=tag.replace(/>$/,' class="sr-only">');
  return tag.replace(/>$/,' aria-label="'+names[id]+'">');
 });
 if(count!==9)throw Error('Expected nine Ghana checkboxes');
 for(const [oldText,newText] of [['1 Child','1 enfant'],['2 Children','2 enfants'],['3+ Children','3 enfants ou plus']])target=target.replace('class="tog-label">'+oldText+'<','class="tog-label">'+newText+'<');
 const style='<style id="ghana-toggle-accessibility">.tog{position:relative;min-height:44px}.tog:focus-within{outline:2px solid var(--color-primary);outline-offset:3px}</style>';
 if(!target.includes('id="ghana-toggle-accessibility"'))target=target.replace('</head>',style+'\n</head>');
 target=target.replace('shareState.whatsappPartager(', 'shareState.whatsappShare(');
 return target;
}
module.exports.refreshGhanaControls=refreshGhanaControls;

function refreshGhanaSharing(target,source){
 const names=['cleanCalculatorUrl','shareCalculator','shareSalaryWhatsApp'];
 const functions=names.map(name=>{const node=calculation(source,name);return source.slice(node.offset+node.start,node.offset+node.end);}).join('\n  ');
 if(!target.includes('function cleanCalculatorUrl'))target=target.replace('  // --- EVENTS ---','  '+functions+'\n\n  // --- EVENTS ---');
 const start=target.indexOf('    // Actions\n'),end=target.indexOf('    // AI\n',start);
 if(start>=0&&end>start)target=target.slice(0,start)+"    // Sharing a calculator link must not embed salary or saved-record parameters.\n    $('waBtn').addEventListener('click', shareSalaryWhatsApp);\n    $('shareBtn').addEventListener('click', shareCalculator);\n\n"+target.slice(end);
 else if(!target.includes("$('waBtn').addEventListener('click', shareSalaryWhatsApp);"))throw Error('Missing sharing owner anchors');
 return target;
}
module.exports.refreshGhanaSharing=refreshGhanaSharing;

function restoreMethod(html) {
 const found=[];
 for(const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)){
  if(!match[1].includes('restorePayload:'))continue;
  const offset=match.index+match[0].indexOf(match[1]);
  function walk(node){if(!node||typeof node!=='object')return;if(node.type==='Property'&&node.key.name==='restorePayload')found.push({start:offset+node.value.start,end:offset+node.value.end});for(const [key,value] of Object.entries(node)){if(key==='start'||key==='end')continue;if(Array.isArray(value))value.forEach(walk);else if(value&&typeof value==='object')walk(value);}}
  walk(acorn.parse(match[1],{ecmaVersion:'latest'}));
 }
 if(found.length!==1)throw Error('Expected one Ghana restore adapter');return found[0];
}
function refreshGhanaRestore(target,source){
 const srcBonus=calculation(source,'calcBonus'),dstBonus=calculation(target,'calcBonus');
 if(srcBonus.body[0].type!=='IfStatement'||dstBonus.body[0].type!=='IfStatement')throw Error('Missing Ghana bonus guard');
 target=target.slice(0,dstBonus.offset+dstBonus.body[0].start)+source.slice(srcBonus.offset+srcBonus.body[0].start,srcBonus.offset+srcBonus.body[0].end)+target.slice(dstBonus.offset+dstBonus.body[0].end);
 const src=restoreMethod(source),dst=restoreMethod(target);
 const method=source.slice(src.start,src.end)
  .replaceAll('Desired Annual Net Pay','Salaire net annuel souhaité')
  .replaceAll('Annual Gross Salary','Salaire brut annuel')
  .replace('Saved scenario could not be loaded. Your previous inputs are preserved. Calculate again before saving or exporting.',"Le calcul enregistré n’a pas pu être chargé. Vos saisies précédentes sont conservées. Relancez le calcul avant d’enregistrer ou d’exporter.");
 return target.slice(0,dst.start)+method+target.slice(dst.end);
}
module.exports.refreshGhanaRestore=refreshGhanaRestore;
