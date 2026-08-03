(function initSwWaterSanitation(root) {
  'use strict';
  var form = document.getElementById('water-form');
  if (!form || !root.AfroTools) return;
  var toolId = document.body.getAttribute('data-water-tool');
  var engine = toolId === 'septic-tank' ? root.AfroTools.SepticTankEngine : root.AfroTools.PlumbingMaterialEngine;
  if (!engine) return;
  var panel = document.getElementById('water-result');
  var errorBox = document.getElementById('water-error');
  var status = document.getElementById('water-status');
  var breakdown = document.getElementById('water-breakdown');
  var actions = Array.prototype.slice.call(document.querySelectorAll('[data-water-export]'));
  var latest = null;
  var restoring = false;
  var COUNTRY = { NG:'Nigeria',KE:'Kenya',ZA:'Afrika Kusini',GH:'Ghana',EG:'Misri',ET:'Ethiopia',TZ:'Tanzania',UG:'Uganda',RW:'Rwanda',MA:'Moroko' };
  var BOM_NAMES = { pipe:'Bomba',fittings:'Viungio, mikunjo na vali',sanitaryware:'Vifaa vya bafuni',connection:'Bomba la muunganisho wa pampu/kisima',tank:'Tanki la juu',labour:'Kazi ya fundi bomba' };
  var UNITS = { metres:'m',pcs:'vipande',sets:'seti',unit:'kimoja',days:'siku' };

  function value(id) { return document.getElementById(id).value; }
  function number(id) { return Number(value(id)); }
  function yes(id) { return value(id) === 'yes'; }
  function collect() {
    if (toolId === 'septic-tank') return { country:value('country'),people:number('people'),toilets:number('toilets'),buildingType:value('buildingType'),soil:value('soil'),material:value('material'),includeSoakaway:yes('includeSoakaway') };
    return { country:value('country'),buildingType:value('buildingType'),pipeType:value('pipeType'),bathrooms:number('bathrooms'),includeTank:yes('includeTank'),tankSize:number('tankSize'),includeLabour:yes('includeLabour') };
  }
  function allFinite(item) {
    if (typeof item === 'number') return Number.isFinite(item);
    if (!item || typeof item !== 'object') return true;
    return Object.keys(item).every(function (key) { return allFinite(item[key]); });
  }
  function setActions(enabled) { actions.forEach(function (button) { button.disabled = !enabled; }); }
  function clear(message) {
    latest = null; panel.hidden = true; breakdown.innerHTML = ''; setActions(false);
    Array.prototype.slice.call(panel.querySelectorAll('[data-output]')).forEach(function (node) { node.textContent = '—'; node.removeAttribute('data-raw'); });
    errorBox.hidden = true; errorBox.textContent = ''; status.textContent = message || 'Tayari. Hesabu hufanyika ndani ya kivinjari.';
  }
  function money(symbol, amount) { return symbol + ' ' + Math.round(amount).toLocaleString('sw-TZ'); }
  function decimal(amount, digits) { return Number(amount).toLocaleString('sw-TZ', { maximumFractionDigits: digits == null ? 2 : digits }); }
  function output(key, raw, text) { var node = panel.querySelector('[data-output="' + key + '"]'); if (!node) return; node.dataset.raw = String(raw); node.textContent = text; }
  function row(label, text, raw) {
    var tr = document.createElement('tr'); var th = document.createElement('th'); var td = document.createElement('td');
    th.scope = 'row'; th.textContent = label; td.textContent = text; if (raw != null) td.dataset.raw = String(raw); tr.appendChild(th); tr.appendChild(td); breakdown.appendChild(tr);
  }
  function renderSeptic(report) {
    output('volume', report.volume, decimal(report.volume) + ' m³'); output('total', report.total, money(report.symbol, report.total));
    output('dimensions', report.length * report.width * report.depth, decimal(report.length,1) + ' × ' + decimal(report.width,1) + ' × ' + decimal(report.depth,1) + ' m');
    output('chambers', report.chambers, decimal(report.chambers,0));
    row('Majitaka kwa siku', decimal(report.dailyWaste,0) + ' L', report.dailyWaste); row('Ujazo wa kuhifadhi siku 2', decimal(report.retentionVolume) + ' m³', report.retentionVolume);
    row('Akiba ya tope', decimal(report.sludgeVolume) + ' m³', report.sludgeVolume); row('Ujenzi wa tangi', money(report.symbol, report.constructionCost), report.constructionCost);
    row('Urefu wa shimo la ufyonzaji', decimal(report.soakLength) + ' m', report.soakLength); row('Shimo la ufyonzaji', money(report.symbol, report.soakCost), report.soakCost);
    row('Makadirio ya kutoa tope kwa mwaka', money(report.symbol, report.annualDesludgingEstimate), report.annualDesludgingEstimate);
  }
  function renderPlumbing(report) {
    output('materialTotal', report.materialTotal, money(report.symbol, report.materialTotal)); output('labourCost', report.labourCost, money(report.symbol, report.labourCost));
    output('total', report.total, money(report.symbol, report.total)); output('perBathroom', report.perBathroom, money(report.symbol, report.perBathroom));
    row('Urefu wa bomba', decimal(report.pipeMetres,0) + ' m', report.pipeMetres); row('Viungio', decimal(report.joints,0) + ' vipande', report.joints);
    report.bom.forEach(function (item) { row(BOM_NAMES[item.kind], decimal(item.qty) + ' ' + (UNITS[item.unit] || item.unit) + ' × ' + money(report.symbol,item.unitCost) + ' = ' + money(report.symbol,item.total), item.total); });
  }
  function calculate(options) {
    options = options || {}; clear('Inakokotoa…');
    if (!form.checkValidity()) { errorBox.textContent = 'Kamilisha sehemu zote kwa thamani zilizo ndani ya mipaka iliyoonyeshwa.'; errorBox.hidden = false; status.textContent = 'Hakuna matokeo mapya; kunakili na kupakua kumezimwa.'; if (!options.silent) form.reportValidity(); return null; }
    var currentInputs = collect(); var report = engine.calculate(currentInputs);
    if (!report || !report.ok || !allFinite(report)) { errorBox.textContent = 'Maingizo haya hayatoi makadirio halali. Kagua vipimo na ujaribu tena.'; errorBox.hidden = false; status.textContent = 'Hesabu imeshindwa; matokeo ya zamani yameondolewa.'; return null; }
    if (toolId === 'septic-tank') renderSeptic(report); else renderPlumbing(report);
    latest = { schemaVersion:1,toolId:toolId,locale:'sw',generatedAt:new Date().toISOString(),planningOnly:true,source:{ owner:toolId==='septic-tank'?'engines/src/septic-tank-engine.js':'engines/src/plumbing-material-engine.js',rateState:'static-planning-assumptions',lastSourceChange:'2026-07-30',confidence:'low-for-procurement' },inputs:currentInputs,result:report };
    panel.hidden = false; setActions(true); status.textContent = 'Makadirio mapya yako tayari. Vitendo vya faili vinatumia maingizo haya pekee.'; if (!options.noFocus) panel.focus(); return latest;
  }
  function reportText() {
    var lines = ['AfroTools — Makadirio ya maji na usafi','Zana: ' + toolId,'Nchi: ' + COUNTRY[latest.inputs.country],''];
    if (toolId === 'septic-tank') lines.push('Ujazo: ' + decimal(latest.result.volume) + ' m³','Vipimo: ' + decimal(latest.result.length,1) + ' × ' + decimal(latest.result.width,1) + ' × ' + decimal(latest.result.depth,1) + ' m','Vyumba: ' + latest.result.chambers,'Jumla: ' + money(latest.result.symbol,latest.result.total));
    else { lines.push('Vifaa: ' + money(latest.result.symbol,latest.result.materialTotal),'Kazi: ' + money(latest.result.symbol,latest.result.labourCost),'Jumla: ' + money(latest.result.symbol,latest.result.total),'Orodha ya vifaa:'); latest.result.bom.forEach(function (item) { lines.push('- ' + BOM_NAMES[item.kind] + ': ' + item.qty + ' ' + (UNITS[item.unit] || item.unit) + '; ' + money(latest.result.symbol,item.total)); }); }
    return lines.concat(['','Chanzo: ' + latest.source.owner,'Hali: dhana tuli za kupanga; si bei hai wala rasmi.','Tarehe 2026-07-30 ni mabadiliko ya mwisho ya injini katika hazina, si uhakiki wa soko.','Uhakika: chini kwa ununuzi; thibitisha usanifu, kanuni, BOQ na nukuu za sasa.','Faragha: ripoti hii imetengenezwa ndani ya kivinjari.']).join('\n');
  }
  function download(name, type, content) { var url = URL.createObjectURL(new Blob([content], { type:type })); var link = document.createElement('a'); link.href=url;link.download=name;document.body.appendChild(link);link.click();link.remove();setTimeout(function(){URL.revokeObjectURL(url);},1000); }
  function fallbackCopy(text) { var area=document.createElement('textarea');area.value=text;area.setAttribute('aria-hidden','true');document.body.appendChild(area);area.select();try{if(!document.execCommand('copy'))throw new Error('copy-failed');status.textContent='Matokeo ya sasa yamenakiliwa.';}catch(error){status.textContent='Kunakili kumeshindikana; tumia upakuaji wa TXT.';}area.remove(); }
  function exportCurrent(kind) {
    if (!latest) return;
    if (kind === 'json') download(toolId + '-makadirio.json','application/json;charset=utf-8',JSON.stringify(latest,null,2));
    if (kind === 'txt') download(toolId + '-makadirio.txt','text/plain;charset=utf-8',reportText());
    if (kind === 'copy') {
      var text = reportText();
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(function(){status.textContent='Matokeo ya sasa yamenakiliwa.';}).catch(function(){fallbackCopy(text);});
      else fallbackCopy(text);
      return;
    }
    status.textContent = kind.toUpperCase() + ' imepakuliwa kutoka kwenye matokeo ya sasa.';
  }
  function restore(payload) {
    if (!payload || payload.schemaVersion !== 1 || payload.toolId !== toolId || !payload.inputs) throw new Error('invalid-report');
    restoring = true; Object.keys(payload.inputs).forEach(function(key){var node=document.getElementById(key);if(!node)return;var next=payload.inputs[key];if(typeof next==='boolean')next=next?'yes':'no';node.value=String(next);}); restoring=false;
    if (!calculate({noFocus:true,silent:true})) throw new Error('invalid-inputs'); status.textContent='JSON imefunguliwa na matokeo pamoja na orodha ya vifaa yamekokotolewa upya.';
  }
  form.addEventListener('submit',function(event){event.preventDefault();calculate();});
  form.addEventListener('input',function(){if(!restoring)clear('Maingizo yamebadilika; kokotoa tena kabla ya kunakili au kupakua.');});
  form.addEventListener('change',function(){if(!restoring)clear('Maingizo yamebadilika; kokotoa tena kabla ya kunakili au kupakua.');});
  actions.forEach(function(button){button.addEventListener('click',function(){exportCurrent(button.dataset.waterExport);});});
  document.getElementById('water-reset').addEventListener('click',function(){form.reset();clear('Fomu imewekwa upya.');});
  document.getElementById('import-json').addEventListener('change',function(event){var file=event.target.files&&event.target.files[0];if(!file)return;file.text().then(function(text){restore(JSON.parse(text));}).catch(function(){clear('JSON haikufunguka.');errorBox.textContent='Chagua JSON halali ya zana hii.';errorBox.hidden=false;});event.target.value='';});
  var consent=document.getElementById('ai-consent');var ai=document.getElementById('ai-link');consent.addEventListener('change',function(){ai.setAttribute('aria-disabled',consent.checked?'false':'true');ai.tabIndex=consent.checked?0:-1;});ai.addEventListener('click',function(event){if(!consent.checked)event.preventDefault();});clear();
}(window));
