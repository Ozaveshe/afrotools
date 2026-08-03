'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { renderSwahiliAgriculturePage } = require('../sw-agriculture-page-shell');
const { escapeHtml } = require('../fr-agriculture-page-shell');

const ROOT = path.resolve(__dirname, '../../..');
const MONTHS = Object.freeze([
  'Januari', 'Februari', 'Machi', 'Aprili', 'Mei', 'Juni',
  'Julai', 'Agosti', 'Septemba', 'Oktoba', 'Novemba', 'Desemba'
]);
const CROPS = Object.freeze({
  avocado: 'Parachichi',
  banana: 'Ndizi',
  barley: 'Shayiri',
  cashew: 'Korosho',
  cassava: 'Muhogo',
  chickpea: 'Dengu ya njano',
  citrus: 'Machungwa na jamii yake',
  clove: 'Karafuu',
  cocoa: 'Kakao',
  coconut: 'Nazi',
  coffee_arabica: 'Kahawa arabika',
  coffee_robusta: 'Kahawa robusta',
  common_bean: 'Maharagwe',
  cotton: 'Pamba',
  cowpea: 'Kunde',
  dates: 'Tende',
  enset: 'Ensete',
  fonio: 'Fonio',
  grape: 'Zabibu',
  groundnut: 'Karanga',
  lentils: 'Dengu',
  maize: 'Mahindi',
  mango: 'Embe',
  millet: 'Uwele',
  oil_palm: 'Mchikichi',
  olive: 'Mzeituni',
  onion: 'Kitunguu',
  pigeon_pea: 'Mbaazi',
  pineapple: 'Nanasi',
  plantain: 'Ndizi za kupika',
  potato: 'Viazi',
  rice: 'Mpunga',
  rubber: 'Mpira',
  sesame: 'Ufuta',
  sorghum: 'Mtama',
  soybean: 'Soya',
  sugar_cane: 'Miwa',
  sunflower: 'Alizeti',
  sweet_potato: 'Viazi vitamu',
  tea: 'Chai',
  teff: 'Teff',
  tobacco: 'Tumbaku',
  tomato: 'Nyanya',
  vanilla: 'Vanila',
  wheat: 'Ngano',
  yam: 'Kiazi kikuu'
});
const SOILS = Object.freeze({
  alluvial: 'Udongo wa mtoni',
  black_cotton: 'Udongo mweusi mzito',
  clay: 'Udongo wa mfinyanzi',
  clay_loam: 'Udongo tifutifu wenye mfinyanzi',
  coral: 'Udongo wa matumbawe',
  laterite: 'Udongo wa lateriti',
  loamy: 'Udongo tifutifu',
  red_soil: 'Udongo mwekundu',
  sandy: 'Udongo wa kichanga',
  sandy_loam: 'Udongo tifutifu wenye mchanga',
  volcanic: 'Udongo wa volkano'
});

function loadCountryData(countryCode) {
  const relative = `data/agriculture/${countryCode.toLowerCase()}-agri-data.js`;
  const sandbox = { window: { AfroTools: {} } };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(ROOT, relative), 'utf8'), sandbox, { filename: relative });
  if (!sandbox.window.AfroTools.countryData) throw new Error(`No countryData export in ${relative}.`);
  return sandbox.window.AfroTools.countryData;
}

function translateRegion(value, index) {
  let label = String(value || '').trim();
  const replacements = [
    [/\bNorth(?:ern)?\b/gi, 'Kaskazini'],
    [/\bSouth(?:ern)?\b/gi, 'Kusini'],
    [/\bEast(?:ern)?\b/gi, 'Mashariki'],
    [/\bWest(?:ern)?\b/gi, 'Magharibi'],
    [/\bCentral\b/gi, 'Kati'],
    [/\bCoastal?\b/gi, 'Pwani'],
    [/\bInterior\b/gi, 'Ndani ya nchi'],
    [/\bFar\b/gi, 'Mbali'],
    [/\bUpper\b/gi, 'Juu'],
    [/\bLower\b/gi, 'Chini'],
    [/\bMiddle\b/gi, 'Kati'],
    [/\bGreater\b/gi, 'Eneo kubwa la'],
    [/\bLake\b/gi, 'Ziwa'],
    [/\bIslands?\b/gi, 'Visiwa'],
    [/\bOases\b/gi, 'Oasisi'],
    [/\bHighlands?\b/gi, 'Nyanda za juu'],
    [/\bHigh Plateaus\b/gi, 'Nyanda za juu'],
    [/\bHighveld\b/gi, 'Nyanda za juu'],
    [/\bMiddleveld\b/gi, 'Nyanda za kati'],
    [/\bLowveld\b/gi, 'Nyanda za chini'],
    [/\bLowlands?\b/gi, 'Nyanda za chini'],
    [/\bPlains?\b/gi, 'Tambarare'],
    [/\bMountains?\b/gi, 'Milima'],
    [/\bValleys?\b/gi, 'Bonde'],
    [/\bRiver\b/gi, 'Mto'],
    [/\bForest\b/gi, 'Msitu'],
    [/\bSavann?ah?\b/gi, 'Savanna'],
    [/\bBasin\b/gi, 'Bonde'],
    [/\bPlateau\b/gi, 'Uwanda wa juu'],
    [/\bDesert\b/gi, 'Jangwa'],
    [/\bSemi-Arid\b/gi, 'Nusu kame'],
    [/\bArid\b/gi, 'Kame'],
    [/\bIrrigated\b/gi, 'Umwagiliaji'],
    [/\bReclaimed\b/gi, 'Iliyorejeshwa'],
    [/\bAgricultural\b/gi, 'Kilimo'],
    [/\bPastoral\b/gi, 'Ufugaji'],
    [/\bCommercial\b/gi, 'Biashara'],
    [/\bCommunal\b/gi, 'Jumuiya'],
    [/\bEquatorial\b/gi, 'Ikweta'],
    [/\bContinental\b/gi, 'Bara'],
    [/\bAtlantic\b/gi, 'Atlantiki'],
    [/\bRain\b/gi, 'Mvua'],
    [/\bDeciduous\b/gi, 'Miti inayopukutika'],
    [/\bTransition\b/gi, 'Mpito'],
    [/\bNatural\b/gi, 'Asili'],
    [/\bClimate\b/gi, 'Hali ya hewa'],
    [/\bVolcanoes\b/gi, 'Volkano'],
    [/\bFoothills\b/gi, 'Vilima vya chini'],
    [/\bRiverine\b/gi, 'Kando ya mto'],
    [/\bOuter\b/gi, 'Nje'],
    [/\bWindward\b/gi, 'Upande wa upepo'],
    [/\bLeeward\b/gi, 'Upande wa kivuli cha upepo'],
    [/\bParts?\b/gi, 'Sehemu'],
    [/\bNew Lands\b/gi, 'Ardhi mpya'],
    [/\bCity\b/gi, 'Jiji'],
    [/\bZone\b/gi, 'Ukanda'],
    [/\bRegion\b/gi, 'Eneo'],
    [/\bBelt\b/gi, 'Ukanda'],
    [/&/g, 'na'],
    [/\band\b/gi, 'na']
  ];
  for (const [pattern, replacement] of replacements) label = label.replace(pattern, replacement);
  return `Eneo la kilimo ${index + 1} — ${label}`;
}

function seasonLabel(season, index) {
  const start = Number(season.startMonth);
  const end = Number(season.endMonth);
  if (start >= 1 && start <= 12 && end >= 1 && end <= 12) {
    return `Msimu ${index + 1} — ${MONTHS[start - 1]} hadi ${MONTHS[end - 1]}`;
  }
  return `Msimu wa kilimo ${index + 1}`;
}

function sourceMetadata(row) {
  const html = fs.readFileSync(path.join(ROOT, row.english.file), 'utf8');
  const source = html.match(/Data Sources:\s*([^<\r\n]+)/i);
  const updated = html.match(/Last updated:\s*([0-9]{4})/i);
  if (!source) throw new Error(`Missing English source label in ${row.english.file}.`);
  return {
    label: source[1].trim().replace(/\.$/, '').replace(/\bWorld Bank\b/g, 'Benki ya Dunia'),
    reviewed: updated ? updated[1] : 'haijaonyeshwa'
  };
}

function presentation(row) {
  const data = loadCountryData(row.country.code);
  const source = sourceMetadata(row);
  return {
    name: row.country.swahiliName,
    locale: `sw-${row.country.code}`,
    source: source.label,
    reviewed: source.reviewed,
    regions: Object.fromEntries(data.regions.map((region, index) => [
      region.id,
      translateRegion(region.name, index)
    ])),
    seasons: Object.fromEntries(data.seasons.map((season, index) => [
      season.id,
      seasonLabel(season, index)
    ]))
  };
}

function renderHub(row, context) {
  const countries = context.familyRows
    .filter(candidate => candidate.country)
    .sort((left, right) => left.country.swahiliName.localeCompare(right.country.swahiliName, 'sw'));
  if (countries.length !== 54) throw new Error(`Crop Yield hub requires 54 countries; found ${countries.length}.`);
  const body = `<section class="card" aria-labelledby="countriesTitle">
  <h2 id="countriesTitle">Chagua nchi ya marejeo</h2>
  <p>Kila kikokotoo hutumia injini ileile ya mavuno inayotumiwa na ukurasa wa Kiingereza, pamoja na data mahsusi ya kilimo ya nchi uliyochagua.</p>
  <ul class="country-list">${countries.map(candidate => (
    `<li><a href="${escapeHtml(candidate.swahili.route)}">${escapeHtml(candidate.country.swahiliName)}</a> <span>(${candidate.country.code})</span></li>`
  )).join('')}</ul>
</section>
<section class="card">
  <h2>Makisio yanayopatikana</h2>
  <p>Utapata mavuno kwa hekta, jumla ya mazao, pengo la mavuno, makisio ya mapato na mapendekezo ya kupanga. Kila ukurasa unaonyesha chanzo, mwaka wa marejeo na mipaka yake.</p>
  <p><strong>Faragha:</strong> hesabu hufanyika kwenye kivinjari chako na hakuna ulichoingiza kinachotumwa kwa seva.</p>
</section>`;
  return renderSwahiliAgriculturePage({
    row,
    title: 'Makisio ya mavuno ya kilimo kwa nchi | AfroTools',
    description: 'Chagua mojawapo ya nchi 54 za Afrika ukadirie mavuno kwa Kiswahili kwa kutumia data ya kilimo ya nchi hiyo.',
    heading: 'Makisio ya mavuno ya kilimo',
    lead: 'Chagua nchi ili utumie mazao, maeneo, misimu, vipimo na sarafu ya rejea yake.',
    artwork: row.artwork.file,
    body,
    scripts: '',
    pageConfig: { id: row.english.id, swahiliRoute: row.swahili.routeKey },
    familyLabel: 'Makisio ya mavuno',
    familyRoute: row.swahili.route
  });
}

function render(row, context = {}) {
  if (!row.country) return renderHub(row, context);
  const view = presentation(row);
  const config = {
    id: row.english.id,
    countryCode: row.country.code,
    countryName: view.name,
    locale: view.locale,
    cropNames: CROPS,
    soilNames: SOILS,
    regionNames: view.regions,
    seasonNames: view.seasons,
    sourceLabel: view.source,
    dataReviewed: view.reviewed,
    confidence: 'Makisio ya kupanga'
  };
  const body = `<style>
@media(max-width:480px){.crop-reference{display:none}.crop-reference-mobile{display:grid}}
.crop-reference-mobile{display:none;gap:10px}.crop-reference-card{border:1px solid var(--agri-border);border-radius:10px;padding:12px;overflow-wrap:anywhere}
@media(max-width:480px){.crop-reference-mobile{display:grid}}
</style>
<section class="card" aria-labelledby="calcTitle">
  <h2 id="calcTitle">Kadiria mavuno</h2>
  <p>Chagua zao, eneo na hali za shamba. Thamani zinaweza kubadilishwa na hesabu yote hufanyika kwenye kivinjari hiki.</p>
  <form id="yieldForm" novalidate>
    <div class="grid">
      <div class="field"><label for="crop">Zao</label><select id="crop" required></select><small>Bei na mavuno ya msingi hutoka kwenye data ya nchi.</small></div>
      <div class="field"><label for="region">Eneo la kilimo</label><select id="region" required></select><small>Eneo hubadilisha uwezo wa zao lililochaguliwa.</small></div>
      <div class="field"><label for="farmSize">Ukubwa wa shamba (hekta)</label><input id="farmSize" type="number" min="0.1" step="0.1" inputmode="decimal" required><small>Weka angalau hekta 0.1.</small></div>
      <div class="field"><label for="soil">Aina ya udongo</label><select id="soil" required></select></div>
      <div class="field"><label for="irrigation">Upatikanaji wa maji</label><select id="irrigation"><option value="rainfed">Kutegemea mvua</option><option value="supplemental">Umwagiliaji wa nyongeza</option><option value="full_irrigation">Umwagiliaji kamili</option></select></div>
      <div class="field"><label for="fertilizer">Matumizi ya mbolea</label><select id="fertilizer"><option value="none">Hakuna mbolea</option><option value="organic_only">Mbolea ya asili pekee</option><option value="moderate_inorganic" selected>Mbolea ya viwandani ya wastani</option><option value="optimized">Kiwango kilichopendekezwa</option></select></div>
      <div class="field"><label for="seed">Aina ya mbegu</label><select id="seed"><option value="local_variety">Mbegu ya kienyeji</option><option value="improved_oga">Mbegu bora inayochavushwa wazi</option><option value="hybrid">Chotara F1</option><option value="certified">Mbegu bora iliyothibitishwa</option></select></div>
      <div class="field"><label for="season">Msimu wa kilimo</label><select id="season" required></select></div>
    </div>
    <div class="actions"><button class="action primary" type="submit">Kokotoa makisio</button><button class="action" type="reset">Weka upya</button></div>
    <p class="error" id="formError" role="alert" aria-live="assertive"></p>
  </form>
</section>
<section class="card" aria-labelledby="resultsTitle">
  <h2 id="resultsTitle">Matokeo</h2>
  <div class="empty" id="emptyState">Jaza taarifa kisha ufanye hesabu.</div>
  <div class="result-panel" id="resultPanel" hidden aria-live="polite">
    <div class="result-hero"><div class="result-value" id="yieldPerHa">—</div><div>tani zinazokadiriwa kwa hekta</div></div>
    <div class="result-grid">
      <div class="metric"><strong id="totalYield">—</strong><span>Jumla ya mavuno</span></div>
      <div class="metric"><strong id="yieldGap">—</strong><span>Pengo dhidi ya uwezo</span></div>
      <div class="metric"><strong id="farmSizeResult">—</strong><span>Ukubwa uliokokotolewa</span></div>
    </div>
    <h3>Makisio ya mapato</h3>
    <div class="result-grid">
      <div class="metric"><strong id="revenueLow">—</strong><span>Kiwango cha chini</span></div>
      <div class="metric"><strong id="revenueMid">—</strong><span>Kiwango cha kati</span></div>
      <div class="metric"><strong id="revenueHigh">—</strong><span>Kiwango cha juu</span></div>
    </div>
    <p id="revenueNote"></p>
    <div id="recommendationBlock" hidden><h3>Mambo ya kuboresha</h3><ul id="recommendations"></ul></div>
    <div class="actions">
      <button class="action" type="button" data-action="copy">Nakili</button>
      <button class="action" type="button" data-action="share">Shiriki</button>
      <button class="action" type="button" data-action="save">Hifadhi kwenye kifaa hiki</button>
      <button class="action" type="button" data-action="pdf">Pakua PDF</button>
      <button class="action" type="button" data-action="csv">Pakua CSV</button>
      <button class="action" type="button" data-action="json">Pakua JSON</button>
      <button class="action" type="button" data-action="txt">Pakua TXT</button>
    </div>
    <p class="status" id="actionStatus" role="status" aria-live="polite"></p>
  </div>
</section>
<section class="card">
  <h2>Vyanzo, upya wa taarifa na mipaka</h2>
  <div class="trust-grid">
    <div class="trust-item"><strong>Vyanzo</strong><span>${escapeHtml(view.source)}</span></div>
    <div class="trust-item"><strong>Mwaka wa marejeo</strong><span>${escapeHtml(view.reviewed)}; data ni tuli na si bei au hali ya moja kwa moja.</span></div>
    <div class="trust-item"><strong>Kiwango cha kuamini</strong><span>Makisio ya kupanga; hali ya shamba inaweza kubadilisha matokeo.</span></div>
  </div>
  <p><strong>Faragha:</strong> hesabu, nakala na maandalizi ya faili hufanyika ndani ya kivinjari. Hakuna ulichoingiza kinachotumwa kwa seva.</p>
  <p>Thibitisha udongo, mbegu, maji, bei na ushauri wa kilimo wa eneo lako kabla ya kutumia fedha.</p>
</section>
<section class="card">
  <h2>Mazao katika rejea ya ${escapeHtml(view.name)}</h2>
  <div class="table-wrap crop-reference"><table class="data-table"><thead><tr><th>Zao</th><th>Wastani (t/ha)</th><th>Uwezo (t/ha)</th><th>Miezi ya kupanda</th></tr></thead><tbody id="cropRows"></tbody></table></div>
  <div id="cropRowsMobile" class="crop-reference-mobile" aria-label="Mazao ya marejeo"></div>
</section>`;

  const scripts = `<script src="/data/agriculture/crop-database.js"></script>
<script src="/data/agriculture/${row.country.code.toLowerCase()}-agri-data.js"></script>
<script src="/engines/crop-yield-engine.js"></script>
<script src="/assets/vendor/jspdf/jspdf.umd.min.js"></script>
<script>
(function(){
  'use strict';
  var cfg=window.__SW_AGRI_PAGE__,data=window.AfroTools&&window.AfroTools.countryData,db=window.AfroTools&&window.AfroTools.cropDatabase,engine=window.AfroTools&&window.AfroTools.CropYieldEngine,latest=null;
  function id(value){return document.getElementById(value)}
  function number(value){return new Intl.NumberFormat(cfg.locale,{maximumFractionDigits:2}).format(Number(value)||0)}
  function money(value){return new Intl.NumberFormat(cfg.locale,{style:'currency',currency:data.currency,maximumFractionDigits:0}).format(Number(value)||0)}
  function cropName(value,fallback){return cfg.cropNames[value]||fallback||value}
  function option(value,label){var node=document.createElement('option');node.value=value;node.textContent=label;return node}
  function cell(value){var text=String(value==null?'':value);return /[",\\r\\n]/.test(text)?'"'+text.replace(/"/g,'""')+'"':text}
  function download(content,type,name){var url=URL.createObjectURL(new Blob([content],{type:type})),link=document.createElement('a');link.href=url;link.download=name;document.body.appendChild(link);link.click();link.remove();setTimeout(function(){URL.revokeObjectURL(url)},0)}
  function status(value,error){id('actionStatus').textContent=value;id('actionStatus').style.color=error?'var(--agri-danger)':'var(--agri-good)'}
  function copy(value){if(navigator.clipboard&&navigator.clipboard.writeText)return navigator.clipboard.writeText(value);var area=document.createElement('textarea');area.value=value;document.body.appendChild(area);area.select();document.execCommand('copy');area.remove();return Promise.resolve()}
  function report(){return latest?{schemaVersion:1,tool:'makisio-ya-mavuno',language:'sw',country:{code:cfg.countryCode,name:cfg.countryName},generatedAt:new Date().toISOString(),inputs:latest.input,result:latest.result,sources:{label:cfg.sourceLabel,reviewed:cfg.dataReviewed,confidence:cfg.confidence,live:false},privacy:'Hesabu ya ndani; hakuna taarifa inayotumwa.'}:null}
  function text(){if(!latest)return'';var r=latest.result;return['AfroTools — Makisio ya mavuno',cfg.countryName,'Zao: '+cropName(r.cropId,r.cropName),'Eneo: '+(cfg.regionNames[latest.input.regionId]||r.regionName),'Shamba: '+number(r.farmSizeHa)+' ha','Mavuno kwa hekta: '+number(r.estimatedYieldPerHa)+' t/ha','Jumla ya mavuno: '+number(r.totalEstimatedYield)+' '+r.yieldUnit,'Pengo la mavuno: '+r.yieldGapPercent+'%','Mapato ya chini: '+money(r.revenueEstimate.low),'Mapato ya kati: '+money(r.revenueEstimate.mid),'Mapato ya juu: '+money(r.revenueEstimate.high),'','Vyanzo: '+cfg.sourceLabel,'Mwaka wa marejeo: '+cfg.dataReviewed+'; si data ya moja kwa moja.','Faragha: hesabu ya ndani.'].join('\\n')}
  function updateDependents(){var region=data.regions.find(function(item){return item.id===id('region').value}),soil=id('soil'),season=id('season');soil.replaceChildren();(region&&region.soilTypes||[]).forEach(function(value){soil.appendChild(option(value,cfg.soilNames[value]||value))});season.replaceChildren();data.seasons.forEach(function(item){if(!item.applicableRegions||item.applicableRegions.indexOf(id('region').value)!==-1)season.appendChild(option(item.id,cfg.seasonNames[item.id]||item.name))})}
  function initialize(){if(!data||!db||!engine)throw new Error('Injini au data ya kilimo haipatikani.');data.crops.forEach(function(item){id('crop').appendChild(option(item.id,cropName(item.id,item.name)))});data.regions.forEach(function(item){id('region').appendChild(option(item.id,cfg.regionNames[item.id]||item.name))});id('region').addEventListener('change',updateDependents);updateDependents();id('farmSize').value=data.agriStats.avgFarmSizeHa||0.5;data.crops.forEach(function(item){var planting=(item.plantingMonths||[]).map(function(value){return cfg.months[value-1]}).join(', ')||'Thibitisha eneo lako',values=[cropName(item.id,item.name),number(item.baseYieldPerHa),number(item.potentialYieldPerHa||0),planting],tr=document.createElement('tr');values.forEach(function(value){var td=document.createElement('td');td.textContent=value;tr.appendChild(td)});id('cropRows').appendChild(tr);var card=document.createElement('article');card.className='crop-reference-card';values.forEach(function(value,index){var line=document.createElement(index?'span':'strong');line.textContent=(index?['Wastani: ','Uwezo: ','Kupanda: '][index-1]:'')+value;line.style.display='block';card.appendChild(line)});id('cropRowsMobile').appendChild(card)})}
  function calculate(){id('formError').textContent='';var size=Number(id('farmSize').value);if(!Number.isFinite(size)||size<0.1){id('formError').textContent='Weka ukubwa halali wa angalau hekta 0.1.';id('farmSize').focus();return null}var input={countryCode:cfg.countryCode,cropId:id('crop').value,regionId:id('region').value,farmSizeHa:size,soilType:id('soil').value,irrigationType:id('irrigation').value,fertilizerUsage:id('fertilizer').value,seedType:id('seed').value,season:id('season').value},result=engine.calculate(input,data,db);if(result.error){id('formError').textContent='Hesabu haikukamilika. Angalia zao na eneo.';return null}latest={input:input,result:result};window.__SW_AGRI_TEST__.latest=latest;id('emptyState').hidden=true;id('resultPanel').hidden=false;id('yieldPerHa').textContent=number(result.estimatedYieldPerHa);id('totalYield').textContent=number(result.totalEstimatedYield)+' '+result.yieldUnit;id('yieldGap').textContent=result.yieldGapPercent+'%';id('farmSizeResult').textContent=number(result.farmSizeHa)+' ha';id('revenueLow').textContent=money(result.revenueEstimate.low);id('revenueMid').textContent=money(result.revenueEstimate.mid);id('revenueHigh').textContent=money(result.revenueEstimate.high);id('revenueNote').textContent='Makisio hutumia bei tuli ya rejea katika '+result.revenueEstimate.currency+'; si bei ya soko ya moja kwa moja.';var list=id('recommendations');list.replaceChildren();(result.recommendations||[]).forEach(function(){var li=document.createElement('li');li.textContent='Thibitisha udongo, mbegu, maji na mpango wa virutubisho na mtaalamu wa kilimo wa eneo lako.';list.appendChild(li)});id('recommendationBlock').hidden=!list.children.length;status('Makisio yamekokotolewa kwenye kifaa hiki.');return result}
  id('yieldForm').addEventListener('submit',function(event){event.preventDefault();calculate()});
  id('yieldForm').addEventListener('reset',function(){setTimeout(function(){latest=null;window.__SW_AGRI_TEST__.latest=null;id('resultPanel').hidden=true;id('emptyState').hidden=false;id('formError').textContent='';id('farmSize').value=data.agriStats.avgFarmSizeHa||0.5;id('region').selectedIndex=0;updateDependents();status('Fomu imewekwa upya.')},0)});
  document.addEventListener('click',function(event){var button=event.target.closest('[data-action]');if(!button)return;if(!latest)return status('Fanya hesabu kwanza.',true);var action=button.dataset.action,object=report(),plain=text(),slug='afrotools-mavuno-'+cfg.countryCode.toLowerCase();if(action==='copy')copy(plain).then(function(){status('Matokeo yamenakiliwa.')}).catch(function(){status('Kunakili kumezuiwa.',true)});if(action==='share'){if(navigator.share)navigator.share({title:'Makisio ya mavuno — '+cfg.countryName,text:plain,url:location.href}).catch(function(error){if(error&&error.name!=='AbortError')status('Kushiriki hakupatikani.',true)});else copy(location.href+'\\n\\n'+plain).then(function(){status('Kiungo na matokeo yamenakiliwa.')})}if(action==='save'){try{localStorage.setItem('afrotools:sw-agriculture:crop-yield:'+cfg.countryCode,JSON.stringify(object));status('Matokeo yamehifadhiwa kwenye kifaa hiki.')}catch(error){status('Hifadhi ya kifaa imezuiwa.',true)}}if(action==='txt')download('\\ufeff'+plain,'text/plain;charset=utf-8',slug+'.txt');if(action==='json')download(JSON.stringify(object,null,2),'application/json;charset=utf-8',slug+'.json');if(action==='csv'){var r=latest.result,rows=[['nchi','msimbo','zao','eneo','hekta','mavuno_t_ha','jumla','kipimo','pengo_pct','sarafu','mapato_chini','mapato_kati','mapato_juu','data_moja_kwa_moja'],[cfg.countryName,cfg.countryCode,cropName(r.cropId,r.cropName),cfg.regionNames[latest.input.regionId]||r.regionName,r.farmSizeHa,r.estimatedYieldPerHa,r.totalEstimatedYield,r.yieldUnit,r.yieldGapPercent,r.revenueEstimate.currency,r.revenueEstimate.low,r.revenueEstimate.mid,r.revenueEstimate.high,'hapana']];download('\\ufeff'+rows.map(function(row){return row.map(cell).join(',')}).join('\\r\\n'),'text/csv;charset=utf-8',slug+'.csv')}if(action==='pdf'){var Pdf=window.jspdf&&window.jspdf.jsPDF;if(!Pdf)return status('PDF haipatikani.',true);var pdf=new Pdf({unit:'pt',format:'a4'});pdf.text(pdf.splitTextToSize(plain.normalize('NFD').replace(/[\\u0300-\\u036f]/g,''),500),48,58);pdf.save(slug+'.pdf')}if(['txt','json','csv','pdf'].indexOf(action)!==-1)status('Faili limepakuliwa.');});
  window.__SW_AGRI_TEST__={calculate:calculate,latest:null,engine:engine,data:data,config:cfg,reportObject:report};
  try{initialize()}catch(error){id('formError').textContent=error.message;console.error(error)}
}());
</script>`;
  config.months = MONTHS;
  return renderSwahiliAgriculturePage({
    row,
    title: `Makisio ya mavuno ya kilimo — ${view.name} | AfroTools`,
    description: `Kadiria mavuno kwa hekta, jumla ya mazao na mapato ya ${view.name} kwa kutumia data ya kilimo ya ${row.country.code}.`,
    heading: `Makisio ya mavuno — ${view.name}`,
    lead: `Tumia mazao, maeneo, udongo, misimu na sarafu ya rejea ya ${row.country.code} kukadiria mavuno na mapato.`,
    artwork: row.artwork.file,
    body,
    scripts,
    pageConfig: config,
    familyLabel: 'Makisio ya mavuno',
    familyRoute: context.familyRows.find(candidate => !candidate.country).swahili.route
  });
}

module.exports = {
  CROPS,
  MONTHS,
  SOILS,
  loadCountryData,
  presentation,
  render,
  renderHub,
  seasonLabel,
  sourceMetadata,
  translateRegion
};
