'use strict';

const { renderSwahiliAgriculturePage } = require('../sw-agriculture-page-shell');

const ANIMALS = Object.freeze({
  all: 'Ng’ombe, mbuzi, kondoo na kuku',
  cattle: 'Ng’ombe',
  goats_sheep: 'Mbuzi na kondoo',
  poultry: 'Kuku'
});
const AGES = Object.freeze({
  mixed: 'Mchanganyiko wa wadogo na wakubwa',
  young: 'Wanyama wadogo pekee',
  adult: 'Wanyama wakubwa pekee'
});
const MONTHS = Object.freeze([
  'Januari', 'Februari', 'Machi', 'Aprili', 'Mei', 'Juni',
  'Julai', 'Agosti', 'Septemba', 'Oktoba', 'Novemba', 'Desemba'
]);
const DISEASES = Object.freeze({
  fmd: 'Ugonjwa wa miguu na midomo (FMD)',
  cbpp: 'Homa ya mapafu ya ng’ombe (CBPP)',
  blackquarter: 'Blackleg',
  anthrax: 'Kimeta',
  lsd: 'Ugonjwa wa ngozi wenye vinundu (LSD)',
  brucellosis: 'Brucellosis',
  ecf: 'Homa ya Pwani ya Mashariki (ECF)',
  rvf: 'Homa ya Bonde la Ufa (RVF)',
  rabies_cattle: 'Kichaa cha mbwa kwa ng’ombe',
  botulism: 'Botulism',
  ppr: 'Tauni ya mbuzi na kondoo (PPR)',
  goat_pox: 'Ndui ya mbuzi na kondoo',
  clostridial_sr: 'Magonjwa ya clostridia',
  ccpp: 'Homa ya mapafu ya mbuzi (CCPP)',
  bluetongue: 'Bluetongue',
  ndv: 'Ugonjwa wa Newcastle',
  gumboro: 'Ugonjwa wa Gumboro',
  fowl_pox: 'Ndui ya kuku',
  marek: 'Ugonjwa wa Marek',
  fowl_typhoid: 'Homa ya matumbo ya kuku',
  avian_flu: 'Mafua ya ndege'
});

function options(map) {
  return Object.entries(map)
    .map(([value, label]) => `<option value="${value}">${label}</option>`)
    .join('');
}

function render(row, context) {
  const countries = context.countries;
  const countryNames = Object.fromEntries(countries.map(country => [country.code, country.sw]));
  const pageConfig = {
    id: row.english.id,
    countryNames,
    animals: ANIMALS,
    ages: AGES,
    diseases: DISEASES,
    months: MONTHS
  };
  const countryOptions = countries
    .map(country => `<option value="${country.code}">${country.sw}</option>`)
    .join('');
  const monthOptions = MONTHS
    .map((month, index) => `<option value="${index + 1}">${month}</option>`)
    .join('');

  const body = `<style>
.sw-vaccination-mobile{display:none;gap:10px}.sw-vaccination-card{border:1px solid var(--agri-border);border-radius:10px;padding:14px;min-width:0}.sw-vaccination-card strong,.sw-vaccination-card span{display:block;overflow-wrap:anywhere}.sw-vaccination-card span{color:var(--agri-muted);margin-top:5px}
@media(max-width:480px){.sw-vaccination-table{display:none}.sw-vaccination-mobile{display:grid}}
</style>
<section class="card">
  <h2>Wanyama na mwezi wa kuanzia</h2>
  <form id="vaccinationForm" novalidate>
    <div class="grid">
      <div class="field"><label for="country">Nchi</label><select id="country">${countryOptions}</select></div>
      <div class="field"><label for="animalType">Aina ya wanyama</label><select id="animalType">${options(ANIMALS)}</select></div>
      <div class="field"><label for="herdSize">Idadi ya wanyama</label><input id="herdSize" type="number" min="1" step="1" value="10"></div>
      <div class="field"><label for="currentMonth">Mwezi wa kuanzia</label><select id="currentMonth">${monthOptions}</select></div>
      <div class="field"><label for="ageGroup">Kundi la umri</label><select id="ageGroup">${options(AGES)}</select></div>
    </div>
    <div class="actions"><button class="action primary" type="submit">Tengeneza ratiba</button><button class="action" type="reset">Weka upya</button></div>
    <p class="error" id="error" role="alert" aria-live="assertive"></p>
  </form>
</section>
<section class="card">
  <h2>Ratiba elekezi ya chanjo</h2>
  <div class="empty" id="empty">Bado hujatengeneza ratiba.</div>
  <div id="resultPanel" class="result-panel" hidden>
    <div class="result-hero"><div class="result-value" id="headline"></div><p id="lead"></p></div>
    <div class="result-grid" id="summary"></div>
    <h3>Chanjo katika rejea</h3>
    <div class="table-wrap sw-vaccination-table"><table class="data-table"><thead><tr><th>Mnyama</th><th>Ugonjwa</th><th>Muda unaofuata</th><th>Dozi kwa mwaka</th><th>Gharama ya mwaka</th><th>Mpango wa serikali</th></tr></thead><tbody id="schedule"></tbody></table></div>
    <div id="scheduleMobile" class="sw-vaccination-mobile" aria-label="Ratiba ya chanjo"></div>
    <h3>Huduma na kampeni</h3><p id="government"></p>
    <div class="actions">
      <button class="action" type="button" data-action="copy">Nakili</button>
      <button class="action" type="button" data-action="save">Hifadhi kwenye kifaa hiki</button>
      <button class="action" type="button" data-action="pdf">Pakua PDF</button>
      <button class="action" type="button" data-action="csv">Pakua CSV</button>
      <button class="action" type="button" data-action="json">Pakua JSON</button>
      <button class="action" type="button" data-action="txt">Pakua TXT</button>
    </div>
    <p class="status" id="status" role="status" aria-live="polite"></p>
  </div>
</section>
<section class="card">
  <h2>Vyanzo, upya wa taarifa na mipaka</h2>
  <div class="trust-grid">
    <div class="trust-item"><strong>Rejea</strong><span>Inatumia injini, magonjwa, programu za nchi, miezi na makadirio ya gharama sawa na programu ya Kiingereza.</span></div>
    <div class="trust-item"><strong>Upya wa taarifa</strong><span>Rejea ni tuli. Haina taarifa za moja kwa moja za mlipuko, upatikanaji, bei au kampeni.</span></div>
    <div class="trust-item"><strong>Kiwango cha kuamini</strong><span>Ni msaada wa kujiandaa kuzungumza na daktari wa mifugo, si agizo la chanjo.</span></div>
  </div>
  <p>Thibitisha aina, umri, hali ya afya, ujauzito, bidhaa iliyoidhinishwa, dozi, njia, dozi ya nyongeza na mnyororo wa baridi na daktari wa mifugo. Kutajwa kwa kampeni hakuthibitishi kuwa inapatikana sasa au ni bure.</p>
  <p><strong>Faragha:</strong> hesabu hufanyika kwenye kivinjari hiki; hakuna ulichoingiza kinachotumwa kwa seva.</p>
</section>`;

  const scripts = `<script src="/data/agriculture/country-index.js"></script>
<script src="/data/agriculture/vaccination-data.js"></script>
<script src="/engines/vaccination-engine.js"></script>
<script src="/assets/vendor/jspdf/jspdf.umd.min.js"></script>
<script>
(function(){
  'use strict';
  var cfg=window.__SW_AGRI_PAGE__,engine=window.AfroTools.VaccinationEngine,latest=null;
  function id(value){return document.getElementById(value)}
  function number(value,digits){return new Intl.NumberFormat('sw-KE',{minimumFractionDigits:digits||0,maximumFractionDigits:digits==null?0:digits}).format(value)}
  function money(value,result){return result.costs.symbol+' '+number(value,2)}
  function metric(label,value){var box=document.createElement('div'),strong=document.createElement('strong'),span=document.createElement('span');box.className='metric';strong.textContent=value;span.textContent=label;box.append(strong,span);return box}
  function fill(node,rows){node.replaceChildren();rows.forEach(function(row){node.appendChild(metric(row[0],row[1]))})}
  function cell(value){var text=String(value==null?'':value);return /[",\\n]/.test(text)?'"'+text.replace(/"/g,'""')+'"':text}
  function download(content,type,name){var url=URL.createObjectURL(new Blob([content],{type:type})),link=document.createElement('a');link.href=url;link.download=name;document.body.appendChild(link);link.click();link.remove();setTimeout(function(){URL.revokeObjectURL(url)},0)}
  function setStatus(value,error){id('status').textContent=value;id('status').style.color=error?'var(--agri-danger)':'var(--agri-good)'}
  function input(){return{countryCode:id('country').value,animalType:id('animalType').value,herdSize:Number(id('herdSize').value),currentMonth:Number(id('currentMonth').value),ageGroup:id('ageGroup').value,purpose:'planning'}}
  function renderResult(result){
    id('headline').textContent=result.vaccineCount+' chanjo za msingi';
    id('lead').textContent=cfg.countryNames[result.country.code]+' — '+cfg.animals[result.animalType]+' — wanyama '+result.herdSize+'.';
    fill(id('summary'),[['Chanjo za msingi',String(result.vaccineCount)],['Hatari kubwa',String(result.criticalCount)],['Gharama ya mwaka',money(result.costs.totalAnnual,result)],['Gharama kwa mnyama',money(result.costs.perAnimal,result)],['Punguzo la serikali kwenye modeli',money(result.costs.govSavings,result)],['Mwezi wa kuanzia',cfg.months[result.currentMonth-1]]]);
    id('schedule').replaceChildren();id('scheduleMobile').replaceChildren();
    result.schedule.forEach(function(row){
      var animal=cfg.animals[row.animalType]||row.animalType,disease=cfg.diseases[row.id]||row.short,due=cfg.months[row.nextDueMonth-1]+' ('+row.daysUntilNext+' siku)',frequency=number(row.annualDoses,1),cost=money(row.totalAnnualCost,result),campaign=row.govCampaign?'Kampeni ya serikali imetajwa':'Thibitisha na daktari wa mifugo',tr=document.createElement('tr'),values=[animal,disease,due,frequency,cost,campaign];
      values.forEach(function(value){var td=document.createElement('td');td.textContent=value;tr.appendChild(td)});id('schedule').appendChild(tr);
      var card=document.createElement('article'),heading=document.createElement('strong');card.className='sw-vaccination-card';heading.textContent=animal+' — '+disease;card.appendChild(heading);
      [['Muda unaofuata',due],['Dozi kwa mwaka',frequency],['Gharama ya mwaka',cost],['Hali',campaign]].forEach(function(entry){var line=document.createElement('span');line.textContent=entry[0]+': '+entry[1];card.appendChild(line)});id('scheduleMobile').appendChild(card)
    });
    id('government').textContent='Huduma iliyotajwa katika rejea: '+(result.govInfo.service||'wasiliana na idara ya mifugo')+'. Thibitisha tarehe, masharti, hisa, gharama na usajili moja kwa moja.';
  }
  function calculate(){
    id('error').textContent='';var values=input(),validation=engine.validateInput(values);
    if(!validation.valid){id('error').textContent='Chagua nchi na ujaze idadi halali ya wanyama pamoja na mwezi.';id('herdSize').focus();return null}
    latest=engine.calculate(values.countryCode,values.animalType,values.herdSize,values.currentMonth,values.ageGroup,values.purpose);latest.__input=values;window.__SW_AGRI_TEST__.latest=latest;renderResult(latest);id('empty').hidden=true;id('resultPanel').hidden=false;setStatus('Ratiba elekezi imetengenezwa kwenye kifaa hiki.');return latest
  }
  function report(){if(!latest)return null;return{schemaVersion:1,tool:'ratiba-ya-chanjo',language:'sw',country:{code:latest.country.code,name:cfg.countryNames[latest.country.code]},inputs:latest.__input,result:latest,sources:{data:['data/agriculture/country-index.js','data/agriculture/vaccination-data.js'],engine:'engines/src/vaccination-engine.js#calculate',liveData:false},limitations:['Ratiba ni ya kupanga pekee; lazima ithibitishwe na daktari wa mifugo.'],privacy:'Hesabu ya ndani; hakuna taarifa inayotumwa.'}}
  function text(){if(!latest)return'';return['AfroTools — Ratiba elekezi ya chanjo',cfg.countryNames[latest.country.code],cfg.animals[latest.animalType]+': wanyama '+latest.herdSize].concat(latest.schedule.map(function(row){return(cfg.diseases[row.id]||row.short)+': '+cfg.months[row.nextDueMonth-1]}),['Gharama ya mwaka: '+money(latest.costs.totalAnnual,latest),'','Thibitisha na daktari wa mifugo; hakuna kampeni au upatikanaji wa moja kwa moja.','Faragha: hesabu ya ndani.']).join('\\n')}
  id('vaccinationForm').addEventListener('submit',function(event){event.preventDefault();calculate()});
  id('vaccinationForm').addEventListener('reset',function(){setTimeout(function(){latest=null;window.__SW_AGRI_TEST__.latest=null;id('empty').hidden=false;id('resultPanel').hidden=true;id('error').textContent='';setStatus('')},0)});
  document.addEventListener('click',function(event){var button=event.target.closest('[data-action]');if(!button)return;if(!latest)return setStatus('Tengeneza ratiba kwanza.',true);var action=button.dataset.action,object=report(),plain=text(),slug='afrotools-ratiba-chanjo';if(action==='copy')navigator.clipboard.writeText(plain);if(action==='save')localStorage.setItem('afrotools:sw-agriculture:vaccination',JSON.stringify(object));if(action==='txt')download('\\ufeff'+plain,'text/plain;charset=utf-8',slug+'.txt');if(action==='json')download(JSON.stringify(object,null,2),'application/json;charset=utf-8',slug+'.json');if(action==='csv'){var rows=[['mnyama','ugonjwa','mwezi','gharama_ya_mwaka','sarafu','kampeni_ya_serikali']].concat(latest.schedule.map(function(row){return[row.animalType,row.id,row.nextDueMonth,row.totalAnnualCost,row.currency,row.govCampaign]}));download('\\ufeff'+rows.map(function(row){return row.map(cell).join(',')}).join('\\r\\n'),'text/csv;charset=utf-8',slug+'.csv')}if(action==='pdf'){var Pdf=window.jspdf&&window.jspdf.jsPDF;if(!Pdf)return setStatus('PDF haipatikani sasa.',true);var pdf=new Pdf({unit:'pt',format:'a4'});pdf.text(pdf.splitTextToSize(plain.normalize('NFD').replace(/[\\u0300-\\u036f]/g,''),500),48,58);pdf.save(slug+'.pdf')}setStatus(action==='save'?'Ratiba imehifadhiwa kwenye kifaa hiki.':'Hatua imekamilika.')});
  window.__SW_AGRI_TEST__={latest:null,engine:engine,calculate:calculate,reportObject:report,input:input};
  id('currentMonth').value=String(new Date().getMonth()+1);
}());
</script>`;

  return renderSwahiliAgriculturePage({
    row,
    title: 'Ratiba ya chanjo za mifugo | AfroTools',
    description: 'Tengeneza ratiba elekezi ya chanjo za ng’ombe, mbuzi, kondoo na kuku kwa kutumia rejea ya nchi, kisha ithibitishe na daktari wa mifugo.',
    heading: 'Ratiba elekezi ya chanjo za mifugo',
    lead: 'Panga miezi na gharama za chanjo kabla ya kuthibitisha bidhaa, dozi na kampeni na daktari wa mifugo wa eneo lako.',
    artwork: row.artwork.file,
    body,
    scripts,
    pageConfig,
    familyLabel: 'Chanjo za mifugo',
    familyRoute: row.swahili.route
  });
}

module.exports = {
  AGES,
  ANIMALS,
  DISEASES,
  MONTHS,
  render
};
