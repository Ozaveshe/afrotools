(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else api.install(root);
}(typeof window === 'object' ? window : this, function () {
  'use strict';
  var crops = {maize:'Mahindi',sorghum:'Mtama',millet:'Uwele / ulezi',rice_paddy:'Mpunga',cowpea:'Kunde',wheat:'Ngano',common_bean:'Maharagwe',groundnut:'Karanga'};
  var methods = {traditional_granary:'Ghala la jadi',traditional:'Uhifadhi wa jadi',polypropylene_bags:'Mifuko ya kawaida ya PP',pp_bags_with_chemical:'Mifuko ya PP yenye dawa',hermetic_bags_PICS:'Mifuko isiyopitisha hewa (PICS)',hermetic_bags_other:'Mifuko mingine isiyopitisha hewa',hermetic_bags:'Mifuko isiyopitisha hewa',metal_silo:'Silo ya chuma',warehouse_fumigated:'Ghala lenye udhibiti wa wadudu'};
  var countries = {ALL:'Dola za Marekani (USD)',ZA:'Afrika Kusini',EG:'Misri',ET:'Ethiopia',MA:'Moroko',SS:'Sudan Kusini',CI:'Côte d’Ivoire',CM:'Kamerun'};
  function validate(input, data) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Kagua taarifa za hesabu.');
    if (!Object.hasOwn(data.lossRates, input.crop)) throw new Error('Chagua zao lililo kwenye orodha.');
    if ((!Object.hasOwn(data.countries, input.countryCode) || !data.countries[input.countryCode])) throw new Error('Chagua nchi na sarafu kwenye orodha.');
    if (!Object.hasOwn(data.lossRates[input.crop].methods, input.methodKey)) throw new Error('Chagua njia ya uhifadhi inayofaa kwa zao hili.');
    var clean = {crop:input.crop,countryCode:input.countryCode,methodKey:input.methodKey};
    for (var key of ['quantityTonnes','durationMonths','pricePerTonne']) {
      var raw = input[key];
      if ((typeof raw !== 'number' && typeof raw !== 'string') || String(raw).trim()==='' || !Number.isFinite(Number(raw)) || Number(raw)<=0) {
        throw new Error('Weka kiasi, miezi na bei zilizo namba kubwa kuliko sifuri.');
      }
      clean[key] = Number(raw);
    }
    if (!Number.isSafeInteger(clean.durationMonths)) throw new Error('Muda wa kuhifadhi uwe idadi kamili ya miezi, kuanzia 1.');
    return clean;
  }
  function rows(result) {
    return [
      ['Njia ya sasa',result.adjCurrentLoss,result.currentLossTonnes,result.currentLossVal,null],
      ['Mifuko isiyopitisha hewa (PICS)',result.adjPicsLoss,result.picsLossTonnes,result.picsLossVal,result.picsValSaved],
      ['Silo ya chuma',result.adjSiloLoss,result.siloLossTonnes,result.siloLossVal,result.siloValSaved]
    ];
  }
  function number(value) { return new Intl.NumberFormat('sw-KE',{maximumFractionDigits:3}).format(value); }
  function reportText(input, result) {
    var currency=result.country.currency;
    return ['Hasara za uhifadhi',crops[input.crop],methods[input.methodKey],
      'Kiasi: '+number(input.quantityTonnes)+' tani; muda: '+input.durationMonths+' miezi',
      'Bei kwa tani: '+currency+' '+number(input.pricePerTonne),
      ...rows(result).map(function(row){return row[0]+': '+number(row[1])+'%; '+number(row[2])+' tani; thamani ya hasara '+currency+' '+number(row[3])+(row[4]===null?'':'; thamani iliyookolewa '+currency+' '+number(row[4]));}),
      'Gharama za mifuko PICS: '+currency+' '+number(result.picsTotalCost)+'; kwa matumizi moja kati ya 3: '+currency+' '+number(result.picsPerUseCost),
      'Gharama ya silo: '+currency+' '+number(result.siloCostLocal)+'; kwa mwaka kati ya 15: '+currency+' '+number(result.siloAnnualCost),
      'Makadirio ya kupanga kutoka data tuli, si bei ya sasa wala ahadi ya kuokoa mazao. Gharama za njia mbili zimegawanywa kwa vipindi tofauti.',
      'Chanzo: data/agriculture/storage-data.js'].join('\n');
  }
  function install(win) {
    var doc=win.document,host=doc.querySelector('[data-storage-loss-form]');
    if (!host) return;
    var cfg=win.__SW_AGRI_CONFIG__,data=win.STORAGE_DATA,engine=win.AfroTools&&win.AfroTools.StorageLossEngine;
    if (!cfg || cfg.id!=='storage-loss' || !data || !engine) return;
    var form=host.querySelector('form'),status=host.querySelector('[data-status]'),box=host.querySelector('[data-result]'),output=host.querySelector('[data-output]'),latest=null,revision=0;
    function field(key){return form.elements.namedItem(key);}
    function options(select, keys, labels) { select.replaceChildren();keys.forEach(function(key){var option=doc.createElement('option');option.value=key;option.textContent=labels(key);select.appendChild(option);}); }
    options(field('crop'),Object.keys(data.lossRates),function(key){return crops[key]||key;});
    options(field('countryCode'),Object.keys(data.countries).filter(function(key){return Boolean(data.countries[key]);}),function(key){return (countries[key]||data.countries[key].name)+' · '+data.countries[key].currency;});
    function updateMethods(value){options(field('methodKey'),Object.keys(data.lossRates[field('crop').value].methods),function(key){return methods[key]||key;});if(value&&Object.hasOwn(data.lossRates[field('crop').value].methods,value))field('methodKey').value=value;}
    function put(input){field('crop').value=input.crop;updateMethods(input.methodKey);for(var key of ['countryCode','quantityTonnes','durationMonths','pricePerTonne'])field(key).value=input[key];}
    function get(){var input={};for(var key of ['crop','countryCode','methodKey','quantityTonnes','durationMonths','pricePerTonne']){var control=field(key);if(control.validity&&control.validity.badInput)throw new Error('Kagua namba ulizoingiza.');input[key]=control.value;}return validate(input,data);}
    function clear(message){revision++;latest=null;box.hidden=true;output.replaceChildren();status.textContent=message;}
    function calculate(input){var clean=validate(input,data),result=engine.calculate(clean,data);if(!result||!result.ok)throw new Error('Hesabu haijakamilika. Kagua taarifa zako.');if(rows(result).some(function(row){return row.slice(1).some(function(value){return value!==null&&!Number.isFinite(value);});})||![result.picsTotalCost,result.picsPerUseCost,result.siloCostLocal,result.siloAnnualCost].every(Number.isFinite))throw new Error('Thamani ni kubwa mno. Punguza kiasi au bei kisha ujaribu tena.');return{input:clean,result:result};}
    function show(calculation){latest=calculation;var table=doc.createElement('table');table.className='swa-storage-table';var head=doc.createElement('thead'),headRow=doc.createElement('tr');['Njia','Hasara (%)','Hasara (tani)','Thamani ya hasara','Thamani iliyookolewa'].forEach(function(label){var th=doc.createElement('th');th.scope='col';th.textContent=label;headRow.appendChild(th);});head.appendChild(headRow);table.appendChild(head);var body=doc.createElement('tbody');rows(latest.result).forEach(function(row){var tr=doc.createElement('tr');row.forEach(function(value,index){var cell=doc.createElement(index===0?'th':'td');if(index===0)cell.scope='row';else cell.dataset.label=['','Hasara (%)','Hasara (tani)','Thamani ya hasara','Thamani iliyookolewa'][index];cell.textContent=value===null?'—':typeof value==='number'?(index>=3?latest.result.country.currency+' ':'')+number(value):value;tr.appendChild(cell);});body.appendChild(tr);});table.appendChild(body);output.replaceChildren(table);host.querySelector('[data-result-summary]').textContent='Kwa '+number(latest.input.quantityTonnes)+' tani za '+crops[latest.input.crop].toLowerCase()+' kwa miezi '+latest.input.durationMonths+', njia ya sasa inapoteza takriban '+number(latest.result.currentLossTonnes)+' tani zenye thamani ya '+latest.result.country.currency+' '+number(latest.result.currentLossVal)+'.';host.querySelector('[data-result-costs]').textContent=reportText(latest.input,latest.result).split('\n').filter(function(line){return line.startsWith('Gharama');}).join(' ');box.hidden=false;status.textContent='Hesabu imekamilika ndani ya kivinjari. Makadirio haya si bei ya sasa.';box.focus();}
    put(validate(cfg.input,data));
    form.addEventListener('input',function(){clear('Taarifa zimebadilika. Kokotoa tena kabla ya kupakua ripoti.');});
    form.addEventListener('change',function(event){if(event.target===field('crop'))updateMethods();clear('Taarifa zimebadilika. Kokotoa tena kabla ya kupakua ripoti.');});
    form.addEventListener('submit',function(event){event.preventDefault();clear('');try{show(calculate(get()));}catch(error){status.textContent=error.message;}});
    form.addEventListener('reset',function(){clear('Fomu imewekwa upya. Kokotoa ili kuona matokeo mapya.');win.setTimeout(function(){put(validate(cfg.input,data));},0);});
    function save(bytes,type,extension){var url=win.URL.createObjectURL(new win.Blob([bytes],{type:type})),link=doc.createElement('a');link.href=url;link.download='afrotools-storage-loss.'+extension;doc.body.appendChild(link);link.click();link.remove();win.setTimeout(function(){win.URL.revokeObjectURL(url);},5000);}
    function report(){if(!latest)return null;return{schemaVersion:1,tool:cfg.id,locale:'sw',generatedAt:new Date().toISOString(),source:cfg.source,input:latest.input,result:latest.result,privacy:'local-only'};}
    host.addEventListener('click',function(event){var button=event.target.closest('[data-export]');if(!button)return;if(!latest){status.textContent='Kokotoa matokeo kwanza.';return;}var payload=report(),type=button.dataset.export;if(type==='json')save(JSON.stringify(payload,null,2),'application/json','json');else if(type==='txt')save(reportText(payload.input,payload.result),'text/plain','txt');else if(type==='csv'){var csv=[['Njia','Hasara (%)','Hasara (tani)','Thamani ya hasara ('+latest.result.country.currency+')','Thamani iliyookolewa ('+latest.result.country.currency+')']].concat(rows(latest.result));save('\uFEFF'+csv.map(function(row){return row.map(function(cell){return '"'+String(cell===null?'':cell).replace(/"/g,'""')+'"';}).join(',');}).join('\r\n'),'text/csv','csv');}else if(type==='pdf'){var P=win.jspdf&&win.jspdf.jsPDF;if(!P){status.textContent='Moduli ya PDF haikupatikana.';return;}var pdf=new P({unit:'pt',format:'a4'});pdf.text(pdf.splitTextToSize(reportText(payload.input,payload.result),490),48,48);pdf.save('afrotools-storage-loss.pdf');}});
    host.querySelector('[data-import]').addEventListener('change',async function(event){var file=event.target.files&&event.target.files[0];if(!file)return;clear('Ripoti inasomwa…');var token=revision;try{if(file.size>1048576)throw new Error('Chagua ripoti ya JSON isiyozidi MB 1.');var payload=JSON.parse(await file.text());if(token!==revision)return;if(payload.schemaVersion!==1||payload.tool!=='storage-loss'||payload.locale!=='sw'||!payload.input)throw new Error('Faili si ripoti ya Hasara za uhifadhi ya Kiswahili.');var calculation=calculate(payload.input);put(calculation.input);show(calculation);status.textContent='Ripoti imefunguliwa; matokeo yamekokotolewa upya kutoka taarifa zake.';}catch(error){if(token===revision)clear(error.message);}finally{event.target.value='';}});
    win.__SW_AGRI_TEST__={run:function(input){return calculate(input).result;},getLatest:function(){return latest&&latest.result;},report:report};
  }
  return {validate:validate,rows:rows,reportText:reportText,install:install};
}));
