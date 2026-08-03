(function initSwBuildingShellParity(root) {
  'use strict';

  var form = document.getElementById('shell-form');
  if (!form || !root.AfroTools) return;
  var toolId = document.body.getAttribute('data-shell-tool');
  var engine = toolId === 'scaffolding-calc' ? root.AfroTools.ScaffoldingEngine : root.AfroTools.WindowDoorSizingEngine;
  if (!engine) return;

  var panel = document.getElementById('shell-result');
  var breakdown = document.getElementById('shell-breakdown');
  var errorBox = document.getElementById('shell-error');
  var status = document.getElementById('shell-status');
  var actions = Array.prototype.slice.call(document.querySelectorAll('[data-shell-export]'));
  var latest = null;
  var restoring = false;

  var COUNTRY = { NG:'Nigeria',KE:'Kenya',ZA:'Afrika Kusini',GH:'Ghana',EG:'Misri',ET:'Ethiopia',TZ:'Tanzania',UG:'Uganda',RW:'Rwanda',MA:'Moroko' };
  var SCAFFOLD_TYPES = { tube_coupler:'Mirija na viungio',system:'Mfumo wa Kwikstage',bamboo:'Mianzi' };
  var MODES = { rent:'Kukodi',buy:'Kununua' };
  var WINDOW_MATERIALS = { aluminium:'Alumini',upvc:'uPVC',timber:'Mbao ngumu',steel:'Chuma' };
  var WINDOW_TYPES = { casement:'Bawaba ya upande',louvre:'Vipande vya kupitisha hewa',sliding:'Kuteleza',fixed:'Lisilofunguka' };
  var EXTERNAL_MATERIALS = { steel_security:'Chuma cha usalama',aluminium_glass:'Alumini na kioo',timber_solid:'Mbao ngumu',fibreglass:'Nyuzi za kioo' };
  var INTERNAL_MATERIALS = { flush_hdf:'Bapa la HDF lenye uwazi ndani',panel_timber:'Mbao yenye vipande',flush_solid:'Bapa gumu' };

  function value(id) { return document.getElementById(id).value; }
  function number(id) { return Number(value(id)); }
  function yes(id) { return value(id) === 'yes'; }
  function collect() {
    if (toolId === 'scaffolding-calc') return { country:value('country'),perimeter:number('perimeter'),height:number('height'),type:value('type'),mode:value('mode'),weeks:number('weeks'),includeLabour:yes('includeLabour') };
    return { country:value('country'),buildingType:value('buildingType'),rooms:number('rooms'),roomArea:number('roomArea'),externalDoors:number('externalDoors'),internalDoors:number('internalDoors'),windowMaterial:value('windowMaterial'),windowType:value('windowType'),externalMaterial:value('externalMaterial'),internalMaterial:value('internalMaterial') };
  }
  function finite(valueToCheck) {
    if (typeof valueToCheck === 'number') return Number.isFinite(valueToCheck);
    if (!valueToCheck || typeof valueToCheck !== 'object') return true;
    return Object.keys(valueToCheck).every(function (key) { return finite(valueToCheck[key]); });
  }
  function ownerStateError(current) {
    if (toolId !== 'scaffolding-calc' || current.type !== 'bamboo') return '';
    if (current.mode === 'buy') return 'Kiwango cha kununua mianzi hakipatikani kwenye injini inayodumishwa. Chagua kukodi au pata nukuu ya sasa ya msambazaji.';
    var rate = engine.rates && engine.rates[current.country];
    if (!rate || !Number.isFinite(rate.bamboo_rent_wk) || rate.bamboo_rent_wk <= 0) return 'Kiwango cha kukodi mianzi hakipatikani kwa nchi hii. Hii si bei ya sifuri; chagua aina nyingine au pata nukuu ya sasa.';
    return '';
  }
  function setActions(enabled) { actions.forEach(function (button) { button.disabled = !enabled; }); }
  function clear(message) {
    latest = null; panel.hidden = true; breakdown.innerHTML = ''; setActions(false);
    Array.prototype.slice.call(panel.querySelectorAll('[data-output]')).forEach(function (node) { node.textContent = '—'; node.removeAttribute('data-raw'); });
    errorBox.hidden = true; errorBox.textContent = ''; status.textContent = message || 'Tayari. Hesabu hufanyika ndani ya kivinjari.';
  }
  function money(symbol, amount) { return symbol + ' ' + Math.round(amount).toLocaleString('sw-TZ'); }
  function decimal(amount, digits) { return Number(amount).toLocaleString('sw-TZ', { maximumFractionDigits:digits == null ? 2 : digits }); }
  function output(key, raw, text) { var node=panel.querySelector('[data-output="'+key+'"]');if(!node)return;node.dataset.raw=String(raw);node.textContent=text; }
  function row(label, text, raw) {
    var tr=document.createElement('tr'),th=document.createElement('th'),td=document.createElement('td');th.scope='row';th.textContent=label;td.textContent=text;if(raw != null)td.dataset.raw=String(raw);tr.appendChild(th);tr.appendChild(td);breakdown.appendChild(tr);
  }
  function scheduleName(item) {
    if (item.kind === 'window') return 'Dirisha: ' + WINDOW_MATERIALS[item.material] + ', ' + WINDOW_TYPES[item.type];
    if (item.kind === 'external-door') return 'Mlango wa nje: ' + EXTERNAL_MATERIALS[item.material];
    if (item.kind === 'internal-door') return 'Mlango wa ndani: ' + INTERNAL_MATERIALS[item.material];
    return 'Vifaa vya kufunga: bawaba, kufuli na vipini';
  }
  function scheduleSize(size) { return size === 'Lump sum' ? 'Jumla ya mkupuo' : size; }
  function renderScaffold(report) {
    output('area',report.area,decimal(report.area)+' m²');output('tubes',report.tubes,decimal(report.tubes,0));output('boards',report.boards,decimal(report.boards,0));output('couplers',report.couplers,decimal(report.couplers,0));
    output('materialCost',report.materialCost,money(report.symbol,report.materialCost));output('labourCost',report.labourCost,money(report.symbol,report.labourCost));output('total',report.total,money(report.symbol,report.total));output('materialCostPerM2',report.materialCostPerM2,money(report.symbol,report.materialCostPerM2)+(report.mode==='rent'?' / m² / wiki':' / m²'));
    row('Chaguo la kiunzi',SCAFFOLD_TYPES[latest ? latest.inputs.type : value('type')]);row('Hali ya gharama',MODES[report.mode]+'; '+report.weeks+' wiki');
  }
  function renderWindow(report) {
    output('totalWindows',report.totalWindows,decimal(report.totalWindows,0));output('totalGlazingArea',report.totalGlazingArea,decimal(report.totalGlazingArea)+' m²');output('ventilationMeetsTarget',report.ventilationMeetsTarget,report.ventilationMeetsTarget?'Lengo la 5% limefikiwa':'Chini ya lengo la 5%');
    output('windowCost',report.windowCost,money(report.symbol,report.windowCost));output('externalDoorCost',report.externalDoorCost,money(report.symbol,report.externalDoorCost));output('internalDoorCost',report.internalDoorCost,money(report.symbol,report.internalDoorCost));output('hardwareCost',report.hardwareCost,money(report.symbol,report.hardwareCost));output('total',report.total,money(report.symbol,report.total));
    row('Eneo linalohitajika la uingizaji hewa',decimal(report.requiredVentilationArea)+' m²',report.requiredVentilationArea);row('Eneo halisi linalofunguka',decimal(report.actualVentilationArea)+' m²',report.actualVentilationArea);
    report.schedule.forEach(function (item) { row(scheduleName(item),decimal(item.qty,0)+' × '+scheduleSize(item.size)+' × '+money(report.symbol,item.unitCost)+' = '+money(report.symbol,item.total),item.total); });
  }
  function calculate(options) {
    options=options||{};clear('Inakokotoa…');
    if(!form.checkValidity()){errorBox.textContent='Kamilisha sehemu zote kwa thamani zilizo ndani ya mipaka iliyoonyeshwa.';errorBox.hidden=false;status.textContent='Hakuna matokeo mapya; kunakili na upakuaji vimezimwa.';if(!options.silent)form.reportValidity();return null;}
    var current=collect(),ownerError=ownerStateError(current);
    if(ownerError){setActions(false);errorBox.textContent=ownerError;errorBox.hidden=false;status.textContent='Kiwango hakipatikani; hakuna matokeo na vitendo vyote vimezimwa.';return null;}
    var report=engine.calculate(current);
    if(!report||!report.ok||!finite(report)){errorBox.textContent='Maingizo haya hayatoi makadirio halali. Kagua vipimo na ujaribu tena.';errorBox.hidden=false;status.textContent='Hesabu imeshindwa; matokeo ya zamani yameondolewa na vitendo vyote vimezimwa.';return null;}
    latest={schemaVersion:1,toolId:toolId,locale:'sw',generatedAt:new Date().toISOString(),planningOnly:true,source:{owner:toolId==='scaffolding-calc'?'engines/src/scaffolding-engine.js':'engines/src/window-door-sizing-engine.js',rateState:'static-planning-assumptions',lastSourceChange:'2026-07-30',confidence:'low-for-procurement'},inputs:current,result:report};
    if(toolId==='scaffolding-calc')renderScaffold(report);else renderWindow(report);
    panel.hidden=false;setActions(true);status.textContent='Makadirio mapya yako tayari. Kunakili na faili zitatumia maingizo na matokeo haya pekee.';if(!options.noFocus)panel.focus();return latest;
  }
  function reportText() {
    var lines=['AfroTools — Makadirio ya ganda la jengo','Zana: '+toolId,'Nchi: '+COUNTRY[latest.inputs.country],''];
    if(toolId==='scaffolding-calc')lines.push('Aina: '+SCAFFOLD_TYPES[latest.inputs.type],'Hali: '+MODES[latest.inputs.mode],'Wiki: '+latest.inputs.weeks,'Eneo: '+decimal(latest.result.area)+' m²','Mirija au nguzo: '+latest.result.tubes,'Mbao za jukwaa: '+latest.result.boards,'Viungio: '+latest.result.couplers,'Vifaa: '+money(latest.result.symbol,latest.result.materialCost),'Kazi: '+money(latest.result.symbol,latest.result.labourCost),'Jumla: '+money(latest.result.symbol,latest.result.total),'Gharama ya vifaa kwa m²'+(latest.result.mode==='rent'?' kwa wiki':'')+': '+money(latest.result.symbol,latest.result.materialCostPerM2));
    else {lines.push('Vyumba: '+latest.result.rooms,'Madirisha: '+latest.result.totalWindows,'Eneo la kioo: '+decimal(latest.result.totalGlazingArea)+' m²','Eneo linalohitajika la uingizaji hewa: '+decimal(latest.result.requiredVentilationArea)+' m²','Eneo halisi linalofunguka: '+decimal(latest.result.actualVentilationArea)+' m²','Hali ya uingizaji hewa: '+(latest.result.ventilationMeetsTarget?'Lengo la 5% limefikiwa':'Chini ya lengo la 5%'),'Gharama ya madirisha: '+money(latest.result.symbol,latest.result.windowCost),'Milango ya nje: '+money(latest.result.symbol,latest.result.externalDoorCost),'Milango ya ndani: '+money(latest.result.symbol,latest.result.internalDoorCost),'Vifaa vya kufunga: '+money(latest.result.symbol,latest.result.hardwareCost),'Jumla: '+money(latest.result.symbol,latest.result.total),'Ratiba:');latest.result.schedule.forEach(function(item){lines.push('- '+scheduleName(item)+': '+item.qty+'; '+scheduleSize(item.size)+'; '+money(latest.result.symbol,item.total));});}
    return lines.concat(['','Chanzo: '+latest.source.owner,'Hali: dhana tuli za kupanga; si bei hai wala rasmi.','Tarehe 2026-07-30 ni mabadiliko ya mwisho ya injini katika hazina, si uhakiki wa soko.','Uhakika: chini kwa ununuzi; thibitisha usanifu, usalama, BOQ na nukuu za sasa.','Faragha: ripoti hii imetengenezwa ndani ya kivinjari.']).join('\n');
  }
  function download(name,type,content){var url=URL.createObjectURL(new Blob([content],{type:type})),link=document.createElement('a');link.href=url;link.download=name;document.body.appendChild(link);link.click();link.remove();setTimeout(function(){URL.revokeObjectURL(url);},1000);}
  function fallbackCopy(text){var area=document.createElement('textarea');area.value=text;area.setAttribute('aria-hidden','true');document.body.appendChild(area);area.select();try{if(!document.execCommand('copy'))throw new Error('copy-failed');status.textContent='Matokeo ya sasa yamenakiliwa.';}catch(error){status.textContent='Kunakili kumeshindikana; tumia upakuaji wa TXT.';}area.remove();}
  function exportCurrent(kind){if(!latest)return;if(kind==='copy'){var text=reportText();if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(text).then(function(){status.textContent='Matokeo ya sasa yamenakiliwa.';}).catch(function(){fallbackCopy(text);});else fallbackCopy(text);return;}if(kind==='json')download(toolId+'-makadirio.json','application/json;charset=utf-8',JSON.stringify(latest,null,2));if(kind==='txt')download(toolId+'-makadirio.txt','text/plain;charset=utf-8',reportText());status.textContent=kind.toUpperCase()+' imepakuliwa kutoka kwenye matokeo ya sasa.';}
  function restore(payload){if(!payload||payload.schemaVersion!==1||payload.toolId!==toolId||!payload.inputs)throw new Error('invalid-report');restoring=true;Object.keys(payload.inputs).forEach(function(key){var node=document.getElementById(key);if(!node)return;var next=payload.inputs[key];if(typeof next==='boolean')next=next?'yes':'no';node.value=String(next);});restoring=false;if(!calculate({noFocus:true,silent:true}))throw new Error('invalid-inputs');status.textContent='JSON imefunguliwa na matokeo pamoja na ratiba yamekokotolewa upya.';}

  form.addEventListener('submit',function(event){event.preventDefault();calculate();});form.addEventListener('input',function(){if(!restoring)clear('Maingizo yamebadilika; kokotoa tena kabla ya kunakili au kupakua.');});form.addEventListener('change',function(){if(!restoring)clear('Maingizo yamebadilika; kokotoa tena kabla ya kunakili au kupakua.');});actions.forEach(function(button){button.addEventListener('click',function(){exportCurrent(button.dataset.shellExport);});});document.getElementById('shell-reset').addEventListener('click',function(){form.reset();clear('Fomu imewekwa upya.');});document.getElementById('import-json').addEventListener('change',function(event){var file=event.target.files&&event.target.files[0];if(!file)return;file.text().then(function(text){restore(JSON.parse(text));}).catch(function(){clear('JSON haikufunguka.');errorBox.textContent='Chagua JSON halali ya zana hii.';errorBox.hidden=false;});event.target.value='';});
  var consent=document.getElementById('ai-consent'),ai=document.getElementById('ai-link');consent.addEventListener('change',function(){ai.setAttribute('aria-disabled',consent.checked?'false':'true');ai.tabIndex=consent.checked?0:-1;});ai.addEventListener('click',function(event){if(!consent.checked)event.preventDefault();});clear();
}(window));
