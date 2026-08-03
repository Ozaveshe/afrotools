'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { renderSwahiliAgriculturePage } = require('../sw-agriculture-page-shell');
const irrigation = require('./irrigation');

const ROOT = path.resolve(__dirname, '../../..');
const COST_LABELS = Object.freeze({
  seeds: 'Mbegu',
  fertilizer: 'Mbolea',
  agrochemicals: 'Dawa za kilimo',
  labor: 'Kazi',
  land: 'Ardhi',
  mechanization: 'Mitambo',
  irrigation: 'Umwagiliaji',
  transport: 'Usafiri',
  marketingFees: 'Ada za soko',
  middleman: 'Kamisheni ya dalali',
  storage: 'Uhifadhi',
  finance: 'Gharama ya mkopo',
  insurance: 'Bima',
});
const SCENARIO_LABELS = Object.freeze({
  yieldUp25: 'Mavuno yakiongezeka kwa 25%',
  priceUp20: 'Bei ikiongezeka kwa 20%',
  phLossHalved: 'Hasara baada ya mavuno ikipungua nusu',
  familyLabor100: 'Kazi yote ikifanywa na familia',
  processBeforeSelling: 'Kusindika kabla ya kuuza',
});

function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderPage(options) {
  return renderSwahiliAgriculturePage(options).replace(
    'class="skip-link"',
    'class="skip-link skip-main-link"'
  );
}

function sourceMetadata(row) {
  const html = fs.readFileSync(path.join(ROOT, row.english.file), 'utf8');
  const sourceMatch = html.match(/Data Sources:\s*([^<\r\n]+)/i);
  const updatedMatch = html.match(/Last updated:\s*([0-9]{4})/i);
  if (!sourceMatch) throw new Error(`Missing English Farm Profit source label in ${row.english.file}.`);
  return {
    source: irrigation.decodeHtmlEntities(sourceMatch[1].trim().replace(/\.$/, '')),
    dataReviewed: updatedMatch ? updatedMatch[1] : 'haijaainishwa',
  };
}

function loadFarmRuntime(code, engineFile = 'engines/src/farm-profit-engine.js') {
  const sandbox = { window: { AfroTools: {} } };
  vm.createContext(sandbox);
  [
    'data/agriculture/crop-database.js',
    `data/agriculture/${code.toLowerCase()}-agri-data.js`,
    'data/agriculture/farm-costs.js',
    engineFile,
  ].forEach((file) => {
    vm.runInContext(fs.readFileSync(path.join(ROOT, file), 'utf8'), sandbox, { filename: file });
  });
  return sandbox.window.AfroTools;
}

function renderHub(row, context = {}) {
  const countries = (context.familyRows || [])
    .filter((item) => item.country)
    .map((item) => ({
      ...item,
      presentation: irrigation.countryPresentation(item.country.code),
    }))
    .sort((left, right) => (
      left.presentation.name.localeCompare(right.presentation.name, 'sw')
    ));
  if (countries.length !== 54) {
    throw new Error(`Farm Profit hub requires 54 country routes; found ${countries.length}.`);
  }
  return renderPage({
    row,
    title: 'Vikokotoo vya faida na hasara ya shamba kwa nchi | AfroTools',
    description: 'Chagua nchi ukadirie mapato, gharama, faida au hasara ya shamba kwa Kiswahili.',
    heading: 'Faida na hasara ya shamba kwa nchi',
    lead: 'Chagua rejea ya nchi ili utumie mazao, gharama, bei, vitengo na sarafu yake.',
    artwork: row.artwork.file,
    body: `<section class="card" data-ai-routing="farm-profit-calculator" data-ai-consent="required-before-model-send">
  <h2>Chagua nchi ya rejea</h2>
  <ul class="country-list">${countries.map((item) => (
    `<li><a href="${escapeHtml(item.swahili.route)}">${escapeHtml(item.presentation.name)}</a> <span>(${escapeHtml(item.country.code)})</span></li>`
  )).join('')}</ul>
</section>
<section class="card">
  <h2>Makadirio ya kupanga</h2>
  <p>Badilisha kila gharama, bei, mavuno na kiwango cha hasara kwa hali yako. Rejea hizi tuli si bei za moja kwa moja wala ahadi ya faida.</p>
  <p><strong>Faragha:</strong> hub hii huchagua nchi tu; haina hesabu, usafirishaji wa data wala eksporti ya matokeo.</p>
</section>`,
    scripts: '',
    pageConfig: {
      id: row.english.id,
      aiRouteId: 'farm-profit-calculator',
    },
    familyLabel: 'Faida ya shamba',
    familyRoute: '/sw/zana/faida-na-hasara-ya-shamba/',
  });
}

function render(row, context = {}) {
  if (!row.country) return renderHub(row, context);
  const presentation = irrigation.countryPresentation(row.country.code);
  const swRow = {
    ...row,
    country: {
      ...row.country,
      swahiliName: presentation.name,
    },
  };
  const source = sourceMetadata(row);
  const config = {
    id: row.english.id,
    countryCode: row.country.code,
    countryName: presentation.name,
    locale: presentation.locale,
    cropNames: irrigation.CROP_NAMES,
    sourceLabel: source.source,
    dataReviewed: source.dataReviewed,
    costLabels: COST_LABELS,
    scenarioLabels: SCENARIO_LABELS,
    aiRouteId: 'farm-profit-calculator',
  };
  const numericFields = [
    ['farmSize', 'Ukubwa wa shamba (hekta)', '0.1', '0.1', null],
    ['yieldPerHa', 'Mavuno yanayotarajiwa (tani kwa hekta)', '0.1', '0.1', null],
    ['marketPrice', 'Bei ya soko kwa tani', '1', '0.01', null],
    ['exportPrice', 'Bei ya eksporti kwa tani — si lazima', '1', '0', null],
    ['lossPct', 'Hasara baada ya mavuno (%)', '0.1', '0', '100'],
    ['seedCost', 'Jumla ya gharama ya mbegu', '1', '0', null],
    ['fertilizerCost', 'Jumla ya gharama ya mbolea', '1', '0', null],
    ['herbicideCost', 'Dawa ya magugu kwa hekta', '1', '0', null],
    ['pesticideCost', 'Dawa ya wadudu kwa hekta', '1', '0', null],
    ['fungicideCost', 'Dawa ya kuvu kwa hekta', '1', '0', null],
    ['laborDays', 'Siku za kazi kwa hekta', '1', '0', null],
    ['laborWage', 'Malipo kwa siku ya kazi', '1', '0', null],
    ['familyLabor', 'Sehemu ya kazi ya familia (%)', '0.1', '0', '100'],
    ['landRent', 'Kodi ya ardhi kwa hekta kwa msimu', '1', '0', null],
    ['tractorCost', 'Kulima kwa trekta kwa hekta', '1', '0', null],
    ['irrigationCost', 'Jumla ya gharama ya umwagiliaji', '1', '0', null],
    ['distance', 'Umbali hadi sokoni (km)', '1', '0', null],
    ['transportRate', 'Usafiri kwa tani-km', '0.1', '0', null],
    ['marketFees', 'Ada za soko (%)', '0.1', '0', '100'],
    ['middlemanPct', 'Kamisheni ya dalali (%)', '0.1', '0', '100'],
    ['storageMonths', 'Miezi ya kuhifadhi', '1', '0', null],
    ['storageRate', 'Uhifadhi kwa tani kwa mwezi', '1', '0', null],
    ['loanAmount', 'Kiasi kilichokopwa', '1', '0', null],
    ['loanInterest', 'Riba ya mkopo (%)', '0.1', '0', '100'],
    ['insurancePct', 'Bima (% ya mapato ghafi)', '0.1', '0', '100'],
  ];
  const body = `<style>
.profit-costs-mobile{display:none;gap:10px}.profit-cost-card{border:1px solid var(--agri-border);border-radius:10px;padding:14px;min-width:0}.profit-cost-card strong,.profit-cost-card span{display:block;overflow-wrap:anywhere}.profit-cost-card span{color:var(--agri-muted);margin-top:5px}@media(max-width:640px){.profit-costs-table{display:none}.profit-costs-mobile{display:grid}}
</style>
<section class="card" data-ai-routing="farm-profit-calculator" data-ai-consent="required-before-model-send">
  <h2>Kadiria faida au hasara</h2>
  <p>Thamani za mwanzo hutoka kwenye rejea ya nchi pale zinapopatikana. Hakiki na ubadilishe kila dhana kwa bei na gharama zako.</p>
  <form id="profitForm" novalidate>
    <div class="grid">
      <div class="field"><label for="crop">Zao</label><select id="crop" aria-describedby="formError"></select></div>
      <div class="field"><label for="sellingMethod">Njia ya kuuza</label><select id="sellingMethod" aria-describedby="formError"><option value="local">Soko la ndani</option><option value="export">Eksporti ya zao ghafi</option><option value="process">Sindika kabla ya kuuza</option></select></div>
      <div class="field"><label for="landType">Upatikanaji wa ardhi</label><select id="landType" aria-describedby="formError"><option value="communal">Ardhi ya jamii au bila kodi</option><option value="rented">Ardhi ya kukodi</option></select></div>
      <div class="field"><label for="mechanization">Matumizi ya mitambo</label><select id="mechanization" aria-describedby="formError"><option value="none">Hakuna</option><option value="animal">Nguvu ya wanyama</option><option value="tractor">Trekta</option></select></div>
      <div class="field"><label for="middleman">Kuuza kupitia dalali</label><select id="middleman" aria-describedby="formError"><option value="no">Hapana</option><option value="yes">Ndiyo</option></select></div>
      ${numericFields.map(([id, label, step, min, max]) => (
    `<div class="field"><label for="${id}">${label}</label><input id="${id}" type="number" min="${min}"${max ? ` max="${max}"` : ''} step="${step}" inputmode="decimal" aria-describedby="formError"></div>`
  )).join('')}
    </div>
    <div class="actions"><button class="action primary" type="submit">Hesabu faida au hasara</button><button class="action" type="reset">Weka upya</button></div>
    <p class="error" id="formError" role="alert" aria-live="assertive"></p>
  </form>
</section>
<section class="card">
  <h2>Matokeo</h2>
  <div class="empty" id="emptyState">Bado hujafanya hesabu.</div>
  <div class="result-panel" id="resultPanel" tabindex="-1" hidden>
    <div class="result-hero"><div class="result-value" id="netProfit">—</div><div id="profitState"></div></div>
    <div class="result-grid">
      <div class="metric"><strong id="revenue">—</strong><span>Mapato baada ya hasara</span></div>
      <div class="metric"><strong id="totalCost">—</strong><span>Jumla ya gharama</span></div>
      <div class="metric"><strong id="roi">—</strong><span>Faida kwa gharama (ROI)</span></div>
    </div>
    <h3>Mgawanyo wa gharama</h3>
    <div class="table-wrap profit-costs-table"><table class="data-table"><caption class="visually-hidden">Mgawanyo wa gharama za makadirio</caption><thead><tr><th>Kipengele</th><th>Kiasi</th><th>Sehemu</th></tr></thead><tbody id="costRows"></tbody></table></div>
    <div id="costCards" class="profit-costs-mobile" aria-label="Mgawanyo wa gharama"></div>
    <h3>Viwango vya kutofanya hasara na hali mbadala</h3>
    <ul id="scenarios"></ul><p id="breakEven"></p>
    <div class="actions" aria-label="Vitendo vya matokeo">
      <button class="action" type="button" data-result-action data-action="copy" disabled>Nakili</button>
      <button class="action" type="button" data-result-action data-action="share" disabled>Shiriki</button>
      <button class="action" type="button" data-result-action data-action="save" disabled>Hifadhi kwenye kifaa hiki</button>
      <button class="action" type="button" data-result-action data-action="pdf" disabled>Pakua PDF</button>
      <button class="action" type="button" data-result-action data-action="csv" disabled>Pakua CSV</button>
      <button class="action" type="button" data-result-action data-action="json" disabled>Pakua JSON</button>
      <button class="action" type="button" data-result-action data-action="txt" disabled>Pakua TXT</button>
    </div>
    <p class="status" id="actionStatus" role="status" aria-live="polite"></p>
  </div>
</section>
<section class="card">
  <h2>Vyanzo, upya wa data na mipaka</h2>
  <div class="trust-grid">
    <div class="trust-item"><strong>Vyanzo</strong><span>${escapeHtml(source.source)}</span></div>
    <div class="trust-item"><strong>Upya wa data</strong><span>Rejea tuli ${escapeHtml(source.dataReviewed)}; si data ya moja kwa moja.</span></div>
    <div class="trust-item"><strong>Uhakika</strong><span>Makadirio ya kupanga yanayotegemea mavuno, bei, hasara na gharama ulizoingiza.</span></div>
  </div>
  <p><strong>Faragha:</strong> hesabu, hifadhi na eksporti hufanyika kwenye kivinjari hiki; hakuna ulichoingiza kinachotumwa kwa seva.</p>
  <p>Haya si manukuu ya bei, ofa ya mkopo, ushauri wa fedha wala dhamana ya faida. Thibitisha bei, gharama, upatikanaji na masharti ya soko lako.</p>
</section>`;
  const scripts = `<script src="/data/agriculture/crop-database.js"></script>
<script src="/data/agriculture/${row.country.code.toLowerCase()}-agri-data.js"></script>
<script src="/data/agriculture/farm-costs.js"></script>
<script src="/engines/farm-profit-engine.js"></script>
<script src="/assets/vendor/jspdf/jspdf.umd.min.js"></script>
<script>
(function(){
  'use strict';
  var cfg=window.__SW_AGRI_PAGE__,data=window.AfroTools.countryData,costs=window.AfroTools.farmCosts&&window.AfroTools.farmCosts[cfg.countryCode],engine=window.AfroTools.FarmProfitEngine,latest=null;
  function id(value){return document.getElementById(value)}
  function raw(value){return id(value).value}
  function number(value){return Number(raw(value))}
  function finite(value){return Number.isFinite(value)}
  function format(value){return new Intl.NumberFormat(cfg.locale,{maximumFractionDigits:1}).format(Number(value)||0)}
  function money(value){return new Intl.NumberFormat(cfg.locale,{style:'currency',currency:data.currency,maximumFractionDigits:0}).format(Number(value)||0)}
  function option(value,label){var element=document.createElement('option');element.value=value;element.textContent=label;return element}
  function cropName(value,fallback){return cfg.cropNames[value]||fallback||value}
  function status(message,error){id('actionStatus').textContent=message||'';id('actionStatus').style.color=error?'var(--agri-danger)':'var(--agri-good)'}
  function setActionsEnabled(enabled){Array.prototype.forEach.call(document.querySelectorAll('[data-result-action]'),function(button){button.disabled=!enabled})}
  function invalidateResult(message){latest=null;window.__SW_AGRI_TEST__.latest=null;id('resultPanel').hidden=true;id('emptyState').hidden=false;setActionsEnabled(false);if(message)status(message,true)}
  function download(content,type,filename){var url=URL.createObjectURL(new Blob([content],{type:type})),link=document.createElement('a');link.href=url;link.download=filename;document.body.appendChild(link);link.click();link.remove();setTimeout(function(){URL.revokeObjectURL(url)},0)}
  function copy(text){return navigator.clipboard&&navigator.clipboard.writeText?navigator.clipboard.writeText(text):Promise.reject(new Error('clipboard unavailable'))}
  function cell(value){var text=String(value==null?'':value);return /[",\\n]/.test(text)?'"'+text.replace(/"/g,'""')+'"':text}
  function defaults(){
    var crop=data.crops.find(function(item){return item.id===id('crop').value})||data.crops[0],storage=costs.storage&&costs.storage.perTonne_perMonth;
    id('farmSize').value=data.agriStats.avgFarmSizeHa||1;id('yieldPerHa').value=crop.baseYieldPerHa||1;id('marketPrice').value=crop.localMarketPrice||0;id('exportPrice').value='';
    id('lossPct').value=15;id('seedCost').value=0;id('fertilizerCost').value=0;id('laborDays').value=costs.labor.manDaysPerHa_simplified||100;id('laborWage').value=costs.labor.dailyWageRate||0;id('familyLabor').value=50;
    id('landRent').value=costs.landCost.rental_perHa_perSeason||0;id('tractorCost').value=costs.mechanization.tractorPloughing_perHa||0;id('distance').value=20;id('transportRate').value=costs.transport.farmToMarket_perTonne_perKm||0;id('marketFees').value=costs.transport.marketFees_percentOfSale||0;id('middlemanPct').value=15;
    id('loanInterest').value=costs.finance.averageInterestRate_percent||0;id('herbicideCost').value=costs.agrochemicals.herbicide_perHa||0;id('pesticideCost').value=costs.agrochemicals.pesticide_perHa||0;id('fungicideCost').value=costs.agrochemicals.fungicide_perHa||0;id('irrigationCost').value=0;id('storageMonths').value=0;id('storageRate').value=storage||0;id('loanAmount').value=0;id('insurancePct').value=0;
  }
  function init(){if(!data||!costs||!engine)throw new Error('Injini au rejea ya gharama haipatikani.');data.crops.forEach(function(crop){id('crop').appendChild(option(crop.id,cropName(crop.id,crop.name)))});id('crop').addEventListener('change',function(){defaults();invalidateResult('Zao limebadilika; fanya hesabu tena.')});defaults();setActionsEnabled(false)}
  function input(){return {cropId:raw('crop'),farmSizeHa:number('farmSize'),yieldPerHa:number('yieldPerHa'),marketPricePerTonne:number('marketPrice'),sellingMethod:raw('sellingMethod'),exportPricePerTonne:number('exportPrice'),postHarvestLossPct:number('lossPct'),seedCost:number('seedCost'),fertilizerCost:number('fertilizerCost'),herbicideCostPerHa:number('herbicideCost'),pesticideCostPerHa:number('pesticideCost'),fungicideCostPerHa:number('fungicideCost'),laborManDaysPerHa:number('laborDays'),laborDailyWage:number('laborWage'),familyLaborPct:number('familyLabor'),landType:raw('landType'),landRentPerHa:number('landRent'),mechanizationType:raw('mechanization'),tractorCostPerHa:number('tractorCost'),irrigationCost:number('irrigationCost'),distanceToMarket:number('distance'),transportCostPerTonneKm:number('transportRate'),marketFeesPct:number('marketFees'),throughMiddleman:raw('middleman')==='yes',middlemanCommissionPct:number('middlemanPct'),storageMonths:number('storageMonths'),storageCostPerTonneMonth:number('storageRate'),loanAmount:number('loanAmount'),loanInterestPct:number('loanInterest'),insurancePremiumPct:number('insurancePct')}}
  function localizedResult(){
    if(!latest)return null;var result=latest.result;
    return {zao:cropName(latest.input.cropId,result.cropName),ukubwaHekta:result.farmSizeHa,mavunoTaniKwaHekta:result.yieldPerHa,mavunoJumlaTani:result.totalYield,mapatoGhafi:result.grossRevenue,hasaraBaadaYaMavuno:result.postHarvestLossAmount,mapatoBaadaYaHasara:result.netRevenue,gharama:result.costs,jumlaYaGharama:result.totalCost,faidaHalisi:result.netProfit,faidaKwaHekta:result.profitPerHa,roiAsilimia:result.roi,marginAsilimia:result.profitMargin,mavunoYaKutofanyaHasaraTaniKwaHekta:result.breakEvenYieldPerHa,beiYaKutofanyaHasaraKwaTani:result.breakEvenPrice,sarafu:result.currency,inaFaida:result.isProfitable}
  }
  function report(){return latest?{schemaVersion:1,zana:'faida-ya-shamba',lugha:'sw',nchi:{code:cfg.countryCode,jina:cfg.countryName},maingizo:latest.input,matokeo:localizedResult(),vyanzo:{lebo:cfg.sourceLabel,upya:cfg.dataReviewed,dataYaMojaKwaMoja:false},faragha:'Hesabu ya ndani; hakuna maingizo yanayotumwa.'}:null}
  function plainText(){var result=localizedResult();if(!result)return '';return ['AfroTools — makadirio ya faida ya shamba',cfg.countryName,'Zao: '+result.zao,'Ukubwa: '+format(result.ukubwaHekta)+' ha','Mapato baada ya hasara: '+money(result.mapatoBaadaYaHasara),'Jumla ya gharama: '+money(result.jumlaYaGharama),'Faida halisi: '+money(result.faidaHalisi),'ROI: '+format(result.roiAsilimia)+' %','Mavuno ya kutofanya hasara: '+format(result.mavunoYaKutofanyaHasaraTaniKwaHekta)+' t/ha','','Vyanzo: '+cfg.sourceLabel,'Upya wa data: rejea tuli '+cfg.dataReviewed+', si data ya moja kwa moja.','Kikomo: thibitisha bei, gharama, hasara na mavuno.','Faragha: hesabu ya ndani.'].join('\\n')}
  function invalid(field,message){invalidateResult();id('formError').textContent=message;id(field).focus();return null}
  function calculate(){
    id('formError').textContent='';status('');
    if(!finite(number('farmSize'))||number('farmSize')<0.1)return invalid('farmSize','Weka ukubwa halali wa angalau hekta 0.1.');
    if(!finite(number('yieldPerHa'))||number('yieldPerHa')<=0)return invalid('yieldPerHa','Weka mavuno yanayotarajiwa yaliyo zaidi ya sifuri.');
    if(!finite(number('marketPrice'))||number('marketPrice')<=0)return invalid('marketPrice','Weka bei ya soko iliyo zaidi ya sifuri.');
    if(raw('sellingMethod')==='export'&&(!finite(number('exportPrice'))||number('exportPrice')<=0))return invalid('exportPrice','Weka bei halali ya eksporti kwa tani.');
    if(!finite(number('lossPct'))||number('lossPct')<0||number('lossPct')>100)return invalid('lossPct','Asilimia ya hasara lazima iwe kati ya 0 na 100.');
    if(!finite(number('familyLabor'))||number('familyLabor')<0||number('familyLabor')>100)return invalid('familyLabor','Asilimia ya kazi ya familia lazima iwe kati ya 0 na 100.');
    var values=input(),result=engine.calculate(values,data,costs);
    if(result.error)return invalid('crop','Hesabu ya faida haikukamilika.');
    latest={input:values,result:result};window.__SW_AGRI_TEST__.latest=latest;id('emptyState').hidden=true;id('resultPanel').hidden=false;setActionsEnabled(true);id('resultPanel').focus();
    id('netProfit').textContent=money(result.netProfit);id('profitState').textContent=result.isProfitable?'Faida ya makadirio':'Hasara ya makadirio';id('revenue').textContent=money(result.netRevenue);id('totalCost').textContent=money(result.totalCost);id('roi').textContent=format(result.roi)+' %';
    var table=id('costRows'),cards=id('costCards');table.innerHTML='';cards.innerHTML='';
    Object.keys(cfg.costLabels).forEach(function(key){var label=cfg.costLabels[key],amount=money(result.costs[key]),share=format(result.costPcts[key])+' %',tr=document.createElement('tr');tr.innerHTML='<td>'+label+'</td><td>'+amount+'</td><td>'+share+'</td>';table.appendChild(tr);var card=document.createElement('article');card.className='profit-cost-card';card.innerHTML='<strong>'+label+'</strong><span>'+amount+' · '+share+'</span>';cards.appendChild(card)});
    var scenarios=id('scenarios');scenarios.innerHTML='';Object.keys(result.scenarios).forEach(function(key){var item=document.createElement('li'),scenario=result.scenarios[key],label=cfg.scenarioLabels[key]||cfg.scenarioLabels.processBeforeSelling;item.textContent=label+': '+money(scenario.netProfit)+' ('+(scenario.change>=0?'+':'')+money(scenario.change)+')';scenarios.appendChild(item)});
    id('breakEven').textContent='Mavuno ya kutofanya hasara: '+format(result.breakEvenYieldPerHa)+' t/ha · Bei ya kutofanya hasara: '+money(result.breakEvenPrice)+' kwa tani.';
    status('Matokeo yamekamilika.');return result;
  }
  id('profitForm').addEventListener('submit',function(event){event.preventDefault();calculate()});
  id('profitForm').addEventListener('input',function(){if(latest)invalidateResult('Maingizo yamebadilika; hesabu tena kabla ya kuhifadhi au kupakua.')});
  id('profitForm').addEventListener('change',function(){if(latest)invalidateResult('Maingizo yamebadilika; hesabu tena kabla ya kuhifadhi au kupakua.')});
  id('profitForm').addEventListener('reset',function(){setTimeout(function(){invalidateResult();id('formError').textContent='';defaults();status('Fomu imewekwa upya.')},0)});
  document.addEventListener('click',function(event){
    var button=event.target.closest('[data-action]');if(!button)return;if(!latest){status('Fanya hesabu kwanza.',true);return}
    var action=button.dataset.action,object=report(),text=plainText(),slug='afrotools-faida-shamba-'+cfg.countryCode.toLowerCase();
    if(action==='copy')copy(text).then(function(){status('Matokeo yamenakiliwa.')});
    if(action==='share'){var payload={title:'AfroTools — makadirio ya faida ya shamba',text:text,url:location.origin+location.pathname};if(navigator.share)navigator.share(payload).then(function(){status('Matokeo yameshirikiwa.')}).catch(function(error){if(error&&error.name!=='AbortError')status('Kushiriki hakukukamilika.',true)});else copy(text+'\\n'+payload.url).then(function(){status('Matokeo na kiungo vimenakiliwa kwa ajili ya kushiriki.')})}
    if(action==='save')try{localStorage.setItem('afrotools:sw-agriculture:farm-profit:'+cfg.countryCode,JSON.stringify(object));status('Matokeo yamehifadhiwa kwenye kifaa hiki.')}catch(error){status('Hifadhi ya ndani imezuiwa.',true)}
    if(action==='txt')download('\\ufeff'+text,'text/plain;charset=utf-8',slug+'.txt');
    if(action==='json')download(JSON.stringify(object,null,2),'application/json;charset=utf-8',slug+'.json');
    if(action==='csv'){var result=localizedResult(),rows=[['nchi','code_nchi','zao','ukubwa_hekta','mapato_baada_ya_hasara','jumla_ya_gharama','faida_halisi','roi_asilimia','sarafu','data_moja_kwa_moja'],[cfg.countryName,cfg.countryCode,result.zao,result.ukubwaHekta,result.mapatoBaadaYaHasara,result.jumlaYaGharama,result.faidaHalisi,result.roiAsilimia,result.sarafu,'hapana']];download('\\ufeff'+rows.map(function(row){return row.map(cell).join(',')}).join('\\r\\n'),'text/csv;charset=utf-8',slug+'.csv')}
    if(action==='pdf'){var Pdf=window.jspdf&&window.jspdf.jsPDF;if(!Pdf){status('PDF haipatikani sasa.',true);return}var pdf=new Pdf({unit:'pt',format:'a4'}),safe=text.normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').replace(/[’‘]/g,"'").replace(/[—–]/g,'-');pdf.text(pdf.splitTextToSize(safe,500),48,58);pdf.save(slug+'.pdf')}
  });
  window.__SW_AGRI_TEST__={calculate:calculate,invalidateResult:invalidateResult,latest:null,engine:engine,data:data,costs:costs,config:cfg,reportObject:report};
  try{init()}catch(error){id('formError').textContent=error.message;console.error(error)}
}());
</script>`;
  return renderPage({
    row: swRow,
    title: `Kikokotoo cha faida ya shamba — ${presentation.name} | AfroTools`,
    description: `Kadiria mapato, gharama, faida, ukingo wa faida na viwango vya kutofanya hasara kwa ${presentation.name} kwa kutumia marejeo ya nchi hiyo.`,
    heading: `Faida ya shamba — ${presentation.name}`,
    lead: `Jaribu mavuno, bei, hasara na gharama kwa kutumia sarafu na marejeo ya kilimo ya ${presentation.name}.`,
    artwork: row.artwork.file,
    body,
    scripts,
    pageConfig: config,
    familyLabel: 'Faida ya shamba',
    familyRoute: '/sw/zana/faida-na-hasara-ya-shamba/',
  });
}

module.exports = {
  id: 'farm-profit',
  COST_LABELS,
  SCENARIO_LABELS,
  loadFarmRuntime,
  render,
  renderHub,
  sourceMetadata,
};
