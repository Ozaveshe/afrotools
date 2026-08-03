(function initSwahiliMiningParity(root) {
  'use strict';

  var engine = root.AfroToolsMiningPlanners;
  var form = document.getElementById('mining-form');
  if (!engine || !form) return;

  var tool = document.body.getAttribute('data-mining-tool');
  var result = document.getElementById('result');
  var error = document.getElementById('error');
  var status = document.getElementById('status');
  var sourceSummary = document.getElementById('source-summary');
  var breakdown = document.getElementById('breakdown');
  var exports = Array.prototype.slice.call(document.querySelectorAll('.export'));
  var lastReport = null;
  var updating = false;

  var COUNTRY_NAMES = { BW:'Botswana',BF:'Burkina Faso',CD:'Jamhuri ya Kidemokrasia ya Kongo',CI:'Côte d’Ivoire',EG:'Misri',GA:'Gabon',GH:'Ghana',KE:'Kenya',LR:'Liberia',MG:'Madagaska',ML:'Mali',NA:'Namibia',NG:'Nigeria',SL:'Sierra Leone',TZ:'Tanzania',ZA:'Afrika Kusini',ZM:'Zambia',ZW:'Zimbabwe' };
  var MINERAL_NAMES = { gold:'Dhahabu',diamond:'Almasi',bauxite:'Bauxite',manganese:'Manganese',gemstone:'Vito',copper:'Shaba',coal:'Makaa ya mawe',platinum:'Platinamu (PGM)',cobalt:'Kobalti',coltan:'Coltan / tantalum',iron:'Madini ya chuma',lithium:'Lithium',uranium:'Uranium',tin:'Bati',limestone:'Chokaa',leadZinc:'Risasi / zinki',titanium:'Madini ya titani' };
  var LICENCE_NAMES = { reconnaissance:'Kibali cha upelelezi',exploration:'Kibali cha uchunguzi',prospecting:'Kibali cha utafutaji',smallScale:'Leseni ya uchimbaji mdogo',artisanal:'Haki ya uchimbaji wa kijadi',mining:'Leseni ya uchimbaji',specialMining:'Leseni maalum ya uchimbaji',claim:'Dai la uchimbaji' };
  var AREA_UNITS = { perKm2:'km²',perHa:'hekta',perCadastralUnit:'vitengo vya cadastral' };
  var TITLES = { 'diamond-valuation':'Ripoti ya thamani ya almasi','oil-well-production':'Ripoti ya uzalishaji wa kisima cha mafuta','oil-gas-revenue':'Ripoti ya mgawanyo wa mapato ya mafuta na gesi','mining-license-fee':'Ripoti ya gharama ya leseni ya madini','mining-royalty':'Ripoti ya mrahaba wa madini','artisanal-mining-income':'Ripoti ya mapato ya uchimbaji mdogo' };
  var ERRORS = { positive:'Ingiza namba iliyo zaidi ya sifuri.',source_price:'Ingiza bei kutoka chanzo chako chenye tarehe; hakuna bei inayokadiriwa.',numeric:'Thamani zote lazima ziwe namba.',pressures:'Ingiza shinikizo la hifadhi na la mtiririko.',pressure_order:'Shinikizo la hifadhi lazima liwe juu ya shinikizo la mtiririko.',radius_order:'Radius ya mifereji lazima iwe kubwa kuliko radius ya kisima.',non_negative:'Ingiza namba ya sifuri au zaidi.',percentage:'Ingiza asilimia kati ya 0 na 100.',uptime:'Uptime lazima iwe zaidi ya 0 na isizidi 100%.',non_positive_flow:'Dhana hizi zinatoa mtiririko usio chanya; kagua skin na radius.',gross_or_volume_price:'Ingiza mapato ghafi, au kiasi na bei zilizo zaidi ya sifuri.',selection:'Chagua nchi na aina inayotumika.',years:'Ingiza angalau mwaka mmoja.',missing_fee:'Ingiza ada iliyothibitishwa; ada iliyokosekana si sifuri.',area:'Leseni hii hulipiwa kwa eneo; ingiza eneo lililo zaidi ya sifuri.',missing_rate:'Ingiza kiwango halisi cha mrahaba; kiwango kinachokosekana si 0%.',team:'Idadi ya wachimbaji lazima iwe angalau 1.',source_name:'Ingiza jina la chanzo au hati.',source_date:'Ingiza tarehe ya kuthibitisha chanzo.',source_date_future:'Tarehe ya kuthibitisha haiwezi kuwa ya baadaye.',source_confidence:'Chagua kiwango cha kujiamini.',import:'Faili ya JSON si ripoti halali ya zana hii.' };

  function field(name) { return form.elements.namedItem(name); }
  function value(name) { var control = field(name); return control ? control.value : ''; }
  function number(name) { var raw = value(name); if (raw === '') return null; var parsed = Number(raw); return Number.isFinite(parsed) ? parsed : null; }
  function numbers(names) { var values = {}; names.forEach(function (name) { values[name] = number(name); }); return values; }
  function localToday() { var now = new Date(); return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0,10); }
  function ageDays(date) { return Math.floor((new Date(localToday() + 'T00:00:00Z') - new Date(date + 'T00:00:00Z')) / 86400000); }
  function fmt(value, decimals) { return new Intl.NumberFormat('sw-KE',{minimumFractionDigits:decimals,maximumFractionDigits:decimals}).format(value); }
  function money(value, symbol) { return (symbol ? symbol + ' ' : '') + fmt(value,2); }
  function whole(value) { return new Intl.NumberFormat('sw-KE',{maximumFractionDigits:0}).format(Math.round(value)); }
  function escapeCsv(value) { var text = String(value == null ? '' : value); return /[",\n]/.test(text) ? '"' + text.replace(/"/g,'""') + '"' : text; }

  function clearValidity() { Array.prototype.forEach.call(form.elements,function (control) { if (control.removeAttribute) control.removeAttribute('aria-invalid'); }); }
  function clearResult(message) {
    result.hidden = true; result.classList.remove('is-stale'); lastReport = null;
    exports.forEach(function (button) { button.disabled = true; });
    Array.prototype.forEach.call(document.querySelectorAll('[data-output]'),function (output) { output.textContent = '—'; delete output.dataset.raw; });
    breakdown.textContent = ''; sourceSummary.textContent = '';
    if (message) status.textContent = message;
  }
  function invalidate() { if (updating) return; clearResult('Maingizo yamebadilika. Kokotoa tena kabla ya kuhamisha matokeo.'); }
  function fail(failure) {
    clearValidity(); clearResult('Hesabu imesimamishwa. Sahihisha sehemu iliyoonyeshwa.');
    var control = field(failure.field); if (control) { control.setAttribute('aria-invalid','true'); control.focus(); }
    error.textContent = ERRORS[failure.code] || 'Kagua maingizo yako.'; error.hidden = false;
  }
  function validateEvidence() {
    if (!value('sourceName').trim()) return {field:'sourceName',code:'source_name'};
    if (!value('sourceDate')) return {field:'sourceDate',code:'source_date'};
    if (value('sourceDate') > localToday()) return {field:'sourceDate',code:'source_date_future'};
    if (!value('sourceConfidence')) return {field:'sourceConfidence',code:'source_confidence'};
    return null;
  }
  function evidence(extra) {
    var days = ageDays(value('sourceDate'));
    var freshness = days > 90 ? 'IMEPITWA NA WAKATI (' + days + ' siku)' : 'ya karibuni (' + days + ' siku)';
    return { sourceName:value('sourceName').trim(),sourceDate:value('sourceDate'),confidence:value('sourceConfidence'),freshness:freshness,stale:days > 90,summary:extra + ' Chanzo cha hali: ' + value('sourceName').trim() + '. Kilithibitishwa ' + value('sourceDate') + '. Uhakika: ' + value('sourceConfidence') + '. Hali ya tarehe: ' + freshness + '. Hesabu ni ya ndani; hakuna ingizo linalotumwa au kuhifadhiwa.' };
  }
  function snapshot() {
    var inputs = {}; Array.prototype.forEach.call(form.elements,function (control) {
      if (!control.name || control.type === 'file' || control.type === 'submit' || control.type === 'button') return;
      inputs[control.name] = control.type === 'number' ? (control.value === '' ? null : Number(control.value)) : control.value;
    }); return inputs;
  }
  function output(name, raw, formatted) { var node = document.querySelector('[data-output="' + name + '"]'); if (!node) return; node.dataset.raw = String(raw); node.textContent = formatted; }
  function finish(raw, rows, sourceText) {
    var proof = evidence(sourceText); var frozenInputs = snapshot();
    clearValidity(); error.hidden = true; breakdown.innerHTML = rows.map(function (row) { return '<tr><td>' + row[0] + '</td><td>' + row[1] + '</td></tr>'; }).join('');
    sourceSummary.textContent = proof.summary; result.hidden = false; result.classList.toggle('is-stale',proof.stale);
    lastReport = Object.freeze({schemaVersion:1,locale:'sw',toolId:tool,planningOnly:true,calculatedAt:new Date().toISOString(),inputs:frozenInputs,results:Object.assign({},raw),rows:rows.map(function (row) { return row.slice(); }),evidence:proof});
    exports.forEach(function (button) { button.disabled = false; });
    status.textContent = proof.stale ? 'Makadirio yamekokotolewa kwa chanzo kilichopitwa na wakati. Thibitisha upya kabla ya uamuzi.' : 'Makadirio yamekokotolewa. Kagua dhana na chanzo kabla ya uamuzi.';
    result.focus();
  }

  function calcDiamond() { var input=numbers(['carat','base','cut','color','clarity','pWhole','pIns','pResale']); var r=engine.diamond(input); if(!r.ok)return fail(r); output('retail',r.retail,money(r.retail,'$'));output('wholesale',r.wholesale,money(r.wholesale,'$'));output('insurance',r.insurance,money(r.insurance,'$'));output('resale',r.resale,money(r.resale,'$'));finish(r,[['Thamani ya karati × bei',money(r.baseValue,'$')],['Kipengele cha pamoja cha 4C','× '+fmt(r.qualityFactor,3)],['Thamani iliyorekebishwa',money(r.retail,'$')]],'Bei zote zimetolewa na mtumiaji; vipengele vya 4C si nukuu ya GIA au Rapaport.'); }
  function calcWell() { var r=engine.oilWell(numbers(['k','h','pe','pwf','mu','bo','re','rw','skin','uptime','price','opex','roy']));if(!r.ok)return fail(r);output('q',r.q,whole(r.q)+' bbl/siku');output('annual',r.annual,whole(r.annual)+' bbl/mwaka');output('net',r.net,money(r.net,'$'));finish(r,[['Uzalishaji wa siku',whole(r.q)+' bbl/siku'],['Uzalishaji wa mwaka',whole(r.annual)+' bbl/mwaka'],['Mapato ghafi',money(r.gross,'$')],['Mrahaba','− '+money(r.royalty,'$')],['Gharama za uendeshaji','− '+money(r.operating,'$')],['Mapato halisi',money(r.net,'$')]],'Fomula ya Darcy ya hali thabiti (0.00708 kwa vipimo vya mafuta); si uigaji wa hifadhi.'); }
  function calcOilGas() { var r=engine.oilGas(numbers(['vol','price','gross','roy','costs','ceiling','conshare','tax']));if(!r.ok)return fail(r);output('contractorNet',r.contractorNet,money(r.contractorNet,'$'));output('governmentTake',r.governmentTake,money(r.governmentTake,'$'));output('governmentPct',r.governmentPct,fmt(r.governmentPct,1)+'%');finish(r,[['Mapato ghafi',money(r.gross,'$')],['Mrahaba','− '+money(r.royalty,'$')],['Cost oil',money(r.costOil,'$')],['Profit oil',money(r.profitOil,'$')],['Faida ya mkandarasi',money(r.contractorProfit,'$')],['Faida ya serikali',money(r.governmentProfit,'$')],['Kodi',money(r.taxAmount,'$')],['Halisi ya mkandarasi',money(r.contractorNet,'$')],['Jumla ya serikali',money(r.governmentTake,'$')]],'Mfano rahisi wa PSC unaotumia masharti ya mtumiaji pekee.'); }
  function licenceSelected(){var data=root.MINING_FEES||{countries:{}};var country=data.countries[value('country')];var record=country&&country.licences?country.licences[value('licence')]:null;return{data:data,country:country,record:record};}
  function calcLicence(){var s=licenceSelected();var r=engine.licence(numbers(['area','years','oneOff','annual']),s.country,s.record);if(!r.ok)return fail(r);output('oneOffTotal',r.oneOffTotal,money(r.oneOffTotal,r.symbol));output('annualComputed',r.annualComputed,money(r.annualComputed,r.symbol));output('total',r.total,money(r.total,r.symbol));var authority=s.country.authority||'mamlaka husika';var confidence=s.country.confidence||'haijaainishwa';finish(r,[['Ada za mwanzo',money(r.oneOffTotal,r.symbol)],['Ada ya mwaka iliyokokotolewa',money(r.annualComputed,r.symbol)],['Muda',r.years+' miaka'],['Jumla ya kupanga',money(r.total,r.symbol)]],'Data iliyojumuishwa ilikaguliwa '+(s.data.lastUpdated||'tarehe haipo')+'. Mamlaka: '+authority+'. Uhakika wa data: '+confidence+'. Thibitisha ada kabla ya kulipa.');}
  function royaltySelected(){var data=root.MINING_DATA||{countries:{},sources:{}};var country=data.countries[value('country')];var mineral=country&&country.minerals?country.minerals[value('mineral')]:null;return{data:data,country:country,mineral:mineral};}
  function calcRoyalty(){var s=royaltySelected();var r=engine.royalty({gross:number('gross'),rate:number('rate')},s.country);if(!r.ok)return fail(r);output('royalty',r.royalty,money(r.royalty,r.symbol));output('rate',r.rate,fmt(r.rate,2)+'%');output('net',r.net,money(r.net,r.symbol));var src=s.country&&s.data.sources?s.data.sources[s.country.source]:null;finish(r,[['Thamani ghafi',money(r.gross,r.symbol)],['Mrahaba','− '+money(r.royalty,r.symbol)],['Tozo tofauti','− '+money(r.extraLevy,r.symbol)],['Mapato halisi',money(r.net,r.symbol)]],'Viwango vilikaguliwa '+(s.data.lastUpdated||'tarehe haipo')+'. Chanzo: '+(src?src.authority:'mamlaka husika')+'. Kiwango lazima kithibitishwe kwa sheria, bei na mradi unaotumika.');}
  function calcArtisanal(){var r=engine.artisanal(numbers(['qty','formal','informalPct','costs','team']));if(!r.ok)return fail(r);output('netPerMiner',r.netPerMiner,money(r.netPerMiner,''));output('annualPerMiner',r.annualPerMiner,money(r.annualPerMiner,''));output('gap',r.gap,money(r.gap,''));finish(r,[['Mapato ghafi yenye leseni',money(r.formalGross,'')],['Mapato ghafi yasiyo rasmi',money(r.informalGross,'')],['Pengo la mapato','− '+money(r.gap,'')],['Halisi ya timu kwa mwezi',money(r.netTotal,'')],['Halisi kwa mchimbaji',money(r.netPerMiner,'')]],'Kiasi, bei, gharama na mgao ni maingizo ya mtumiaji; hakuna bei au uhalali unaohakikishwa.');}
  var calculators={'diamond-valuation':calcDiamond,'oil-well-production':calcWell,'oil-gas-revenue':calcOilGas,'mining-license-fee':calcLicence,'mining-royalty':calcRoyalty,'artisanal-mining-income':calcArtisanal};

  function populateLicences(){var data=root.MINING_FEES||{countries:{}};var c=field('country');var l=field('licence');if(!c||!l)return;updating=true;c.innerHTML=Object.keys(data.countries).sort(function(a,b){return(COUNTRY_NAMES[a]||a).localeCompare(COUNTRY_NAMES[b]||b,'sw');}).map(function(code){return'<option value="'+code+'">'+(COUNTRY_NAMES[code]||data.countries[code].name)+'</option>';}).join('');if(data.countries.NG)c.value='NG';syncLicences();updating=false;clearResult();}
  function syncLicences(){var data=root.MINING_FEES||{countries:{}};var country=data.countries[value('country')];var l=field('licence');if(!country||!l)return;updating=true;l.innerHTML=Object.keys(country.licences||{}).map(function(key){return'<option value="'+key+'">'+(LICENCE_NAMES[key]||key)+'</option>';}).join('');if(country.licences.exploration)l.value='exploration';syncLicenceFields();updating=false;invalidate();}
  function syncLicenceFields(){var s=licenceSelected();if(!s.record)return;updating=true;field('oneOff').value=typeof s.record.oneOff==='number'?s.record.oneOff:'';field('annual').value=typeof s.record.annual==='number'?s.record.annual:'';var unit=AREA_UNITS[s.record.annualBasis];document.getElementById('area-wrap').hidden=!unit;document.getElementById('area-unit').textContent=unit||'';updating=false;invalidate();}
  function populateRoyalties(){var data=root.MINING_DATA||{countries:{}};var c=field('country');if(!c)return;updating=true;c.innerHTML=Object.keys(data.countries).sort(function(a,b){return(COUNTRY_NAMES[a]||a).localeCompare(COUNTRY_NAMES[b]||b,'sw');}).map(function(code){return'<option value="'+code+'">'+(COUNTRY_NAMES[code]||data.countries[code].name)+'</option>';}).join('');if(data.countries.TZ)c.value='TZ';syncMinerals();updating=false;clearResult();}
  function syncMinerals(){var s=royaltySelected();var m=field('mineral');if(!s.country||!m)return;updating=true;m.innerHTML=Object.keys(s.country.minerals||{}).map(function(key){return'<option value="'+key+'">'+(MINERAL_NAMES[key]||key)+'</option>';}).join('');if(s.country.minerals.gold)m.value='gold';syncRate();updating=false;invalidate();}
  function syncRate(){var s=royaltySelected();var rate=field('rate');if(!s.mineral||!rate)return;updating=true;if(s.mineral.variable){rate.value='';rate.placeholder='Ingiza kiwango halisi';}else{rate.value=s.mineral.rate;rate.placeholder='';}updating=false;invalidate();}

  function download(name,type,text){var blob=new Blob([text],{type:type});var url=URL.createObjectURL(blob);var link=document.createElement('a');link.href=url;link.download=name;document.body.appendChild(link);link.click();link.remove();setTimeout(function(){URL.revokeObjectURL(url);},0);}
  function requireReport(){if(!lastReport){status.textContent='Kokotoa tena kabla ya kuhamisha matokeo.';return false;}return true;}
  function exportJson(){if(!requireReport())return;download(tool+'-afrotools.json','application/json',JSON.stringify(lastReport,null,2));status.textContent='JSON imeundwa ndani ya kifaa hiki.';}
  function exportCsv(){if(!requireReport())return;var lines=[['sehemu','thamani'],['toolId',lastReport.toolId],['planningOnly','true'],['sourceName',lastReport.evidence.sourceName],['sourceDate',lastReport.evidence.sourceDate],['confidence',lastReport.evidence.confidence],['freshness',lastReport.evidence.freshness]];Object.keys(lastReport.inputs).forEach(function(k){lines.push(['input.'+k,lastReport.inputs[k]]);});Object.keys(lastReport.results).forEach(function(k){if(typeof lastReport.results[k]!=='object')lines.push(['result.'+k,lastReport.results[k]]);});download(tool+'-afrotools.csv','text/csv;charset=utf-8','\ufeff'+lines.map(function(row){return row.map(escapeCsv).join(',');}).join('\n'));status.textContent='CSV imeundwa ndani ya kifaa hiki.';}
  function exportPdf(){if(!requireReport()||!root.jspdf||!root.jspdf.jsPDF)return;var doc=new root.jspdf.jsPDF({unit:'pt',format:'a4'});var y=54;var width=480;function write(text,bold){doc.setFont('helvetica',bold?'bold':'normal');doc.splitTextToSize(String(text).replace(/[’–—]/g,'-'),width).forEach(function(line){if(y>780){doc.addPage();y=54;}doc.text(line,56,y);y+=14;});y+=4;}doc.setFontSize(16);write(TITLES[tool],true);doc.setFontSize(10);write('AfroTools - makadirio ya kupanga yaliyokokotolewa ndani ya kivinjari',false);lastReport.rows.forEach(function(row){write(row[0]+': '+row[1],false);});write('Chanzo, tarehe na uhakika',true);write(lastReport.evidence.summary,false);write('Makadirio ya kupanga tu. Thibitisha data, leseni, viwango na masharti kwa mamlaka na mtaalamu anayefaa.',false);doc.save(tool+'-afrotools.pdf');status.textContent='PDF imeundwa ndani ya kifaa hiki.';}
  function restore(report){if(!report||report.schemaVersion!==1||report.toolId!==tool||!report.inputs||typeof report.inputs!=='object')return fail({field:null,code:'import'});updating=true;var inputs=report.inputs;if(tool==='mining-license-fee'&&inputs.country){field('country').value=inputs.country;syncLicences();field('licence').value=inputs.licence;syncLicenceFields();}if(tool==='mining-royalty'&&inputs.country){field('country').value=inputs.country;syncMinerals();field('mineral').value=inputs.mineral;syncRate();}Object.keys(inputs).forEach(function(name){var control=field(name);if(control&&inputs[name]!==null&&inputs[name]!==undefined)control.value=String(inputs[name]);else if(control)control.value='';});updating=false;clearResult('JSON imefunguliwa. Inakokotolewa upya kutoka maingizo yaliyohifadhiwa; matokeo ya faili hayaaminiki moja kwa moja.');form.requestSubmit();}

  form.addEventListener('submit',function(event){event.preventDefault();var evidenceFailure=validateEvidence();if(evidenceFailure)return fail(evidenceFailure);var calculate=calculators[tool];if(calculate)calculate();});
  form.addEventListener('input',invalidate);form.addEventListener('change',invalidate);field('sourceDate').max=localToday();
  document.getElementById('reset').addEventListener('click',function(){form.reset();clearValidity();error.hidden=true;if(tool==='mining-license-fee')populateLicences();else if(tool==='mining-royalty')populateRoyalties();else clearResult('Hali imewekwa upya. Hakuna data iliyohifadhiwa.');});
  document.getElementById('export-json').addEventListener('click',exportJson);document.getElementById('export-csv').addEventListener('click',exportCsv);document.getElementById('export-pdf').addEventListener('click',exportPdf);
  document.getElementById('import-json').addEventListener('change',function(event){var file=event.target.files&&event.target.files[0];if(!file)return;var reader=new FileReader();reader.onload=function(){try{restore(JSON.parse(reader.result));}catch(ignore){fail({field:null,code:'import'});}};reader.readAsText(file);});
  var consent=document.getElementById('ai-consent');var aiLink=document.getElementById('ai-link');consent.addEventListener('change',function(){aiLink.setAttribute('aria-disabled',consent.checked?'false':'true');aiLink.tabIndex=consent.checked?0:-1;});aiLink.addEventListener('click',function(event){if(!consent.checked)event.preventDefault();});
  if(tool==='mining-license-fee'){populateLicences();field('country').addEventListener('change',syncLicences);field('licence').addEventListener('change',syncLicenceFields);}else if(tool==='mining-royalty'){populateRoyalties();field('country').addEventListener('change',syncMinerals);field('mineral').addEventListener('change',syncRate);}
})(typeof globalThis !== 'undefined' ? globalThis : this);
