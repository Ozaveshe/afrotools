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

function refreshKenyaRestore(target,source){
 const src=restoreMethod(source),dst=restoreMethod(target);
 const method=source.slice(src.start,src.end).replace('Saved scenario could not be loaded. Previous inputs are preserved. Calculate again before saving or exporting.',"Le calcul enregistré n’a pas pu être chargé. Vos saisies précédentes sont conservées. Relancez le calcul avant d’enregistrer ou d’exporter.");
 return target.slice(0,dst.start)+method+target.slice(dst.end);
}
module.exports.refreshKenyaRestore=refreshKenyaRestore;

function nigeriaStateDeclarations(html){
 const names=new Set(['PERIOD','REGIME','CALC_MODE','SALARY_PERIOD']),found=[];
 for(const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)){
  if(!match[1].includes('SALARY_PERIOD'))continue;
  const offset=match.index+match[0].indexOf(match[1]);
  for(const node of acorn.parse(match[1],{ecmaVersion:'latest'}).body){
   if(node.type!=='VariableDeclaration')continue;
   for(const declaration of node.declarations){
    if(!names.has(declaration.id.name))continue;
    if(node.declarations.length!==1)throw Error('Expected isolated Nigeria state declaration');
    found.push({name:declaration.id.name,kind:node.kind,start:offset+node.start});
   }
  }
 }
 if(found.length!==4||new Set(found.map(item=>item.name)).size!==4)throw Error('Expected four unique Nigeria runtime settings');
 return found;
}
function refreshNigeriaSaveState(target,source){
 if(nigeriaStateDeclarations(source).some(item=>item.kind!=='var'))throw Error('Nigeria source must expose settings to shared saver');
 for(const item of nigeriaStateDeclarations(target).sort((a,b)=>b.start-a.start)){
  if(item.kind==='var')continue;
  if(item.kind!=='let')throw Error('Unexpected Nigeria target declaration');
  target=target.slice(0,item.start)+'var'+target.slice(item.start+3);
 }
 return target;
}
module.exports.refreshNigeriaSaveState=refreshNigeriaSaveState;

function refreshHausaSavedStatus(target) {
 if (!/<html\b[^>]*\blang=["']ha["']/i.test(target)) return target;
 const maps=[];
 for (const match of target.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)) {
  if (!match[1].includes('var replacements')) continue;
  const offset=match.index+match[0].indexOf(match[1]);
  function walk(node) {
   if (!node || typeof node!=='object') return;
   if (node.type==='VariableDeclarator' && node.id.name==='replacements' && node.init?.type==='ObjectExpression') {
    const load=node.init.properties.find(p=>p.key.value==='Load' && p.value.value==='Loda');
    if (load) maps.push({offset,properties:node.init.properties,load});
   }
   for (const [key,value] of Object.entries(node)) {
    if (key==='start' || key==='end') continue;
    if (Array.isArray(value)) value.forEach(walk); else if (value && typeof value==='object') walk(value);
   }
  }
  walk(acorn.parse(match[1],{ecmaVersion:'latest'}));
 }
 if (maps.length!==1) throw Error('Expected one Hausa saved-status translation map');
 const map=maps[0],edits=[];
 const status=map.properties.filter(p=>p.key.value==='Loaded saved scenario.');
 if (status.length>1 || (status.length===1 && status[0].value.value!=='An loda lissafin da aka ajiye.')) throw Error('Unexpected Hausa saved-status translation');
 if (!status.length) {
  const at=map.offset+map.load.end;
  if (target[at]!==',') throw Error('Missing Hausa Load translation delimiter');
  edits.push({start:at+1,end:at+1,value:"\n    'Loaded saved scenario.': 'An loda lissafin da aka ajiye.',"});
 }
 const localizer=calculation(target,'localizeText');
 const textBlock=localizer.body.find(node=>node.type==='IfStatement' &&
  node.test.type==='BinaryExpression' && node.test.operator==='===' &&
  node.test.left.type==='MemberExpression' && node.test.left.object.name==='node' &&
  node.test.left.property.name==='nodeType' && node.test.right.value===3)?.consequent;
 if (!textBlock || textBlock.type!=='BlockStatement') throw Error('Missing Hausa text-node boundary');
 const legacy="Object.keys(replacements).forEach(function(key){\n        if (value.indexOf(key) !== -1) value = value.split(key).join(replacements[key]);\n      });";
 const exact="var key = value.trim();\n      if (Object.prototype.hasOwnProperty.call(replacements, key)) {\n        value = value.replace(key, function(){ return replacements[key]; });\n      }";
 const ast=value=>JSON.stringify(value,(key,item)=>['start','end','raw'].includes(key)?undefined:item);
 const legacyNode=acorn.parse(legacy,{ecmaVersion:'latest'}).body[0];
 const exactNodes=acorn.parse(exact,{ecmaVersion:'latest'}).body;
 const statements=textBlock.body;
 if (ast(statements[1])===ast(legacyNode)) {
  edits.push({start:localizer.offset+statements[1].start,end:localizer.offset+statements[1].end,value:exact});
 } else if (ast(statements.slice(1,3))!==ast(exactNodes)) throw Error('Unexpected Hausa text translation guard');
 for (const edit of edits.sort((a,b)=>b.start-a.start)) target=target.slice(0,edit.start)+edit.value+target.slice(edit.end);
 return target;
}

function refreshNigeriaRestore(target,source){
 target=refreshHausaSavedStatus(target);
 const src=calculation(source,'invalidateSavedScenarioResult');
 const body=source.slice(src.offset+src.start,src.offset+src.end);
 if(target.includes('function invalidateSavedScenarioResult(')){
  const dst=calculation(target,'invalidateSavedScenarioResult');
  return target.slice(0,dst.offset+dst.start)+body+target.slice(dst.offset+dst.end);
 }
 const anchor=calculation(target,'setCalcMode'),at=anchor.offset+anchor.start;
 return target.slice(0,at)+body+'\n\n'+target.slice(at);
}
module.exports.refreshNigeriaRestore=refreshNigeriaRestore;
