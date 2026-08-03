'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {
  renderSwahiliAgriculturePage,
} = require('../sw-agriculture-page-shell');

const ROOT = path.resolve(__dirname, '../../..');
const COUNTRY_REGISTRY = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'data/registry/countries.json'), 'utf8')
);
const COUNTRY_BY_CODE = new Map(COUNTRY_REGISTRY.map((country) => [
  country.isoCode || country.id,
  country,
]));

const METHODS = Object.freeze({
  flood: 'Umwagiliaji wa kufurika',
  furrow: 'Umwagiliaji wa mifereji',
  bucket: 'Ndoo au umwagiliaji wa mkono',
  sprinkler: 'Kinyunyizio',
  drip: 'Umwagiliaji wa matone',
});
const STAGES = Object.freeze({
  germination: 'Kuota na kuanza kukua',
  vegetative: 'Ukuaji wa majani na shina',
  flowering: 'Kutoa maua na ukuaji mkuu',
  maturity: 'Kukomaa na mwisho wa mzunguko',
});
const MONTHS = Object.freeze([
  'Januari', 'Februari', 'Machi', 'Aprili', 'Mei', 'Juni',
  'Julai', 'Agosti', 'Septemba', 'Oktoba', 'Novemba', 'Desemba',
]);
const CROP_NAMES = Object.freeze({
  avocado: 'Parachichi',
  banana: 'Ndizi',
  barley: 'Shayiri',
  cashew: 'Korosho',
  cassava: 'Muhogo',
  chickpea: 'Dengu aina ya chickpea',
  citrus: 'Michungwa na jamii yake',
  clove: 'Karafuu',
  cocoa: 'Kakao',
  coconut: 'Nazi',
  coffee_arabica: 'Kahawa arabika',
  coffee_robusta: 'Kahawa robusta',
  common_bean: 'Maharagwe',
  cotton: 'Pamba',
  cowpea: 'Kunde',
  dates: 'Tende',
  enset: 'Enseti',
  fonio: 'Fonio',
  grape: 'Zabibu',
  groundnut: 'Karanga',
  lentils: 'Dengu',
  maize: 'Mahindi',
  mango: 'Embe',
  millet: 'Ulezi',
  oil_palm: 'Mchikichi',
  olive: 'Mizeituni',
  onion: 'Vitunguu',
  pigeon_pea: 'Mbaazi',
  pineapple: 'Nanasi',
  plantain: 'Ndizi za kupika',
  potato: 'Viazi mviringo',
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
  yam: 'Kiazi kikuu',
});
const REGION_LABELS = Object.freeze({
  dz_te: 'Ukanda wa Tell / Pwani (Algiers, Oran, Annaba)',
  dz_hl: 'Nyanda za juu (Setif, Constantine, Batna)',
  dz_sa: 'Oasisi za Sahara (Biskra, Ouargla, Ghardaia)',
  dz_ka: 'Milima ya Kabylie (Tizi Ouzou, Bejaia)',
  cv_st: 'Santiago / Visiwa vya upande wa upepo',
  cv_sv: 'Santo Antao / Visiwa vilivyokingwa na upepo',
  cm_sw: 'Kusini-Magharibi / Pwani (Douala, Buea, Limbe)',
  cm_ce: 'Kati / Kusini (Yaounde, Ebolowa)',
  cm_ad: 'Adamawa (Ngaoundere)',
  cm_fn: 'Kaskazini ya mbali / Kaskazini (Maroua, Garoua)',
  cf_sw: 'Msitu wa Kusini-Magharibi (Berberati, Mbaiki)',
  cf_ce: 'Savanna ya Kati (Bambari, Bria)',
  dj_in: 'Maeneo ya ndani (Ali Sabieh, Dikhil, Tadjourah)',
  gq_bi: 'Kisiwa cha Bioko (Malabo, Luba)',
  gq_ri: 'Rio Muni / Eneo la bara (Bata, Evinayong)',
  sz_hv: 'Nyanda za juu (Mbabane, Piggs Peak)',
  sz_mv: 'Nyanda za kati (Manzini, Matsapha)',
  sz_lv: 'Nyanda za chini (Big Bend, Siteki)',
  ga_in: 'Maeneo ya ndani / Haut-Ogooue (Franceville, Moanda)',
  gm_ce: 'Mto wa Kati (Janjanbureh, Kuntaur)',
  gm_ea: 'Mto wa juu (Basse, Fatoto)',
  ls_ft: 'Vilima vya chini (Maseru, Leribe)',
  ls_mt: 'Milima / Nyanda za juu (Mokhotlong, Thaba-Tseka)',
  lr_in: 'Msitu wa ndani (Gbarnga, Ganta, Zwedru)',
  sc_ou: 'Visiwa vya mbali',
  tz_lv: 'Ukanda wa Ziwa Victoria (Mwanza, Kagera, Geita)',
});

function countryPresentation(code) {
  const country = COUNTRY_BY_CODE.get(code);
  if (!country) throw new Error(`Missing country registry row for ${code}.`);
  return {
    name: country.displayNames && country.displayNames.sw
      ? country.displayNames.sw
      : country.title,
    locale: `sw-${code}`,
  };
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
  if (!sourceMatch) {
    throw new Error(`Missing English Irrigation source label in ${row.english.file}.`);
  }
  return {
    source: decodeHtmlEntities(sourceMatch[1].trim().replace(/\.$/, '')),
    dataReviewed: updatedMatch ? updatedMatch[1] : 'haijaainishwa',
  };
}

function decodeHtmlEntities(value) {
  let decoded = String(value || '');
  for (let pass = 0; pass < 4; pass += 1) {
    const next = decoded
      .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
      .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
      .replace(/&quot;/gi, '"')
      .replace(/&apos;|&#39;/gi, "'")
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&amp;/gi, '&');
    if (next === decoded) break;
    decoded = next;
  }
  return decoded;
}

function loadCountryData(code) {
  const file = path.join(ROOT, `data/agriculture/${code.toLowerCase()}-agri-data.js`);
  const sandbox = { window: { AfroTools: {} } };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(file, 'utf8'), sandbox, { filename: file });
  return sandbox.window.AfroTools.countryData;
}

function translateRegion(name, index, regionId) {
  if (REGION_LABELS[regionId]) {
    return `Eneo la kilimo ${index + 1} — ${REGION_LABELS[regionId]}`;
  }
  const replacements = [
    [/\bNorth(?:ern)?\b/gi, 'Kaskazini'],
    [/\bSouth(?:ern)?\b/gi, 'Kusini'],
    [/\bEast(?:ern)?\b/gi, 'Mashariki'],
    [/\bWest(?:ern)?\b/gi, 'Magharibi'],
    [/\bCentral\b/gi, 'Kati'],
    [/\bHighlands?\b/gi, 'Nyanda za juu'],
    [/\bLowlands?\b/gi, 'Nyanda za chini'],
    [/\bCoast(?:al)?\b/gi, 'Pwani'],
    [/\bRiver Valley\b/gi, 'Bonde la mto'],
    [/\bValley\b/gi, 'Bonde'],
    [/\bPlateau\b/gi, 'Uwanda wa juu'],
    [/\bBasin\b/gi, 'Bonde'],
    [/\bSemi-Arid\b/gi, 'Nusu kame'],
    [/\bArid\b/gi, 'Kame'],
  ];
  let label = String(name || '');
  for (const [pattern, replacement] of replacements) {
    label = label.replace(pattern, replacement);
  }
  return `Eneo la kilimo ${index + 1} — ${label}`;
}

function rowWithSwahiliCountry(row, name) {
  if (!row.country) return row;
  return {
    ...row,
    country: {
      ...row.country,
      swahiliName: name,
    },
  };
}

function renderHub(row, context = {}) {
  const countries = (context.familyRows || [])
    .filter((item) => item.country)
    .map((item) => ({
      row: item,
      name: countryPresentation(item.country.code).name,
    }))
    .sort((left, right) => left.name.localeCompare(right.name, 'sw'));
  if (countries.length !== 54) {
    throw new Error(`Irrigation hub requires 54 country routes; found ${countries.length}.`);
  }
  const body = `<style>@media(max-width:360px){.irrigation-hub-card>h2,.irrigation-hub-card>p{max-width:calc(100% - 8px);overflow-wrap:anywhere}}</style>
<section class="card irrigation-hub-card">
  <h2>Chagua rejea ya nchi</h2>
  <p>Kila ukurasa hutumia injini ileile ya maji pamoja na mvua, uvukizaji-rejea, mazao na maeneo ya nchi husika.</p>
  <ul class="country-list">${countries.map(({ row: item, name }) => `<li><a href="${item.swahili.route}">${name}</a> <span>(${item.country.code})</span></li>`).join('')}</ul>
</section>
<section class="card irrigation-hub-card">
  <h2>Makadirio ya kupanga</h2>
  <p>Kiasi cha maji na gharama ni makadirio. Thibitisha upatikanaji wa maji, vizuizi, mtiririko na bei kwa mamlaka au mtaalamu wa eneo lako.</p>
  <p><strong>Faragha:</strong> ukurasa huu hautumi taarifa zako kwa seva.</p>
</section>
<section class="card" data-ai-routing="irrigation-calculator" data-ai-consent="required-before-model-send">
  <h2>Msaidizi wa hiari</h2>
  <p><a href="/sw/ai/?q=Panga%20mahitaji%20ya%20umwagiliaji">Fungua msaidizi wa Kiswahili</a> ili atafute ukurasa sahihi. Kiungo hakitumi maingizo ya kikokotoo; msaada wa modeli huomba idhini kabla ya kutuma maelezo.</p>
</section>`;
  return renderPage({
    row,
    title: 'Vikokotoo vya umwagiliaji kwa nchi 54 | AfroTools',
    description: 'Chagua rejea ya nchi ili kukadiria mahitaji ya maji ya umwagiliaji kwa Kiswahili.',
    heading: 'Vikokotoo vya mahitaji ya maji ya umwagiliaji',
    lead: 'Tumia mazao, maeneo, mvua, vipimo na gharama za rejea ya nchi uliyochagua.',
    artwork: row.artwork.file,
    body,
    scripts: '',
    pageConfig: { id: row.english.id, locale: 'sw' },
    familyLabel: 'Umwagiliaji',
    familyRoute: row.swahili.route,
  });
}

function render(row, context = {}) {
  if (!row.country) return renderHub(row, context);
  const presentation = {
    ...countryPresentation(row.country.code),
    ...sourceMetadata(row),
  };
  const data = loadCountryData(row.country.code);
  const regionNames = Object.fromEntries(data.regions.map((region, index) => [
    region.id,
    translateRegion(region.name, index, region.id),
  ]));
  const swRow = rowWithSwahiliCountry(row, presentation.name);
  const config = {
    id: row.english.id,
    countryCode: row.country.code,
    countryName: presentation.name,
    locale: presentation.locale,
    cropNames: CROP_NAMES,
    regionNames,
    methods: METHODS,
    stages: STAGES,
    months: MONTHS,
    sourceLabel: presentation.source,
    dataReviewed: presentation.dataReviewed,
    countryCurrency: data.currency,
    countryCurrencySymbol: data.currencySymbol,
  };
  const body = `
<style>
.irrigation-details-mobile{display:none;gap:10px}.irrigation-detail-card{border:1px solid var(--agri-border);border-radius:10px;padding:14px;min-width:0}.irrigation-detail-card strong,.irrigation-detail-card span{display:block;overflow-wrap:anywhere}.irrigation-detail-card span{color:var(--agri-muted);margin-top:5px}
@media(max-width:480px){.irrigation-details-table{display:none}.irrigation-details-mobile{display:grid}}
</style>
<section class="card">
  <h2>Kadiria mahitaji ya maji</h2>
  <p>Chaguo la mzunguko mzima hutumia muda wa kukua na mwezi wa kupanda katika rejea ya nchi. Chaguo la mwezi hutumia hatua ya ukuaji uliyochagua.</p>
  <form id="irrigationForm" novalidate>
    <div class="grid">
      <div class="field"><label for="crop">Zao</label><select id="crop" required></select></div>
      <div class="field"><label for="region">Eneo la kilimo</label><select id="region" required></select></div>
      <div class="field"><label for="farmSize">Ukubwa wa shamba (hekta)</label><input id="farmSize" type="number" min="0.1" step="0.1" required></div>
      <div class="field"><label for="method">Njia ya umwagiliaji</label><select id="method"></select></div>
      <div class="field"><label for="month">Kipindi cha hesabu</label><select id="month"><option value="0">Mzunguko mzima wa zao</option>${MONTHS.map((name, index) => `<option value="${index + 1}">${name}</option>`).join('')}</select></div>
      <div class="field"><label for="stage">Hatua ya ukuaji — kwa hesabu ya mwezi</label><select id="stage">${Object.entries(STAGES).map(([id, name]) => `<option value="${id}"${id === 'flowering' ? ' selected' : ''}>${name}</option>`).join('')}</select></div>
    </div>
    <div class="actions"><button class="action primary" type="submit">Hesabu mahitaji ya maji</button><button class="action" type="reset">Weka upya</button></div>
    <p class="error" id="formError" role="alert" aria-live="assertive"></p>
  </form>
</section>
<section class="card">
  <h2>Matokeo</h2>
  <div class="empty" id="emptyState">Bado hujafanya hesabu.</div>
  <div class="result-panel" id="resultPanel" tabindex="-1" hidden>
    <div class="result-hero"><div class="result-value" id="waterTotal">—</div><div>m³ za maji ya kupeleka shambani</div></div>
    <div class="result-grid"><div class="metric"><strong id="dailyVolume">—</strong><span>Wastani wa kila siku</span></div><div class="metric"><strong id="efficiency">—</strong><span>Ufanisi wa njia</span></div><div class="metric"><strong id="waterLost">—</strong><span>Maji yanayopotea kwa makadirio</span></div></div>
    <p id="scheduleNote"></p>
    <h3>Mchanganuo wa mwezi au ulinganisho wa njia</h3>
    <div class="table-wrap irrigation-details-table"><table class="data-table"><caption class="visually-hidden">Ulinganisho wa njia za umwagiliaji na matumizi ya maji</caption><thead id="detailHead"></thead><tbody id="detailRows"></tbody></table></div>
    <div id="detailCards" class="irrigation-details-mobile" aria-label="Maelezo ya mahitaji ya maji"></div>
    <p id="costNote"></p><p id="savingNote"></p>
    <div class="actions" aria-label="Hatua za matokeo">
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
  <h2>Vyanzo, upya wa taarifa na kiwango cha kuamini</h2>
  <div class="trust-grid">
    <div class="trust-item"><strong>Vyanzo</strong><span>${presentation.source}</span></div>
    <div class="trust-item"><strong>Upya uliotajwa</strong><span>Rejea tuli ya ${presentation.dataReviewed}; hakuna taarifa ya moja kwa moja.</span></div>
    <div class="trust-item"><strong>Kiwango cha kuamini</strong><span>Makadirio ya kupanga yanayotumia ET₀, mvua na vigawo vya mazao vilivyohifadhiwa.</span></div>
  </div>
  <p><strong>Sarafu ya nchi:</strong> ${data.currency} (${data.currencySymbol}). Injini ikikosa bei ya maji kwa nchi hutumia dhana ya kusukuma ya USD 0.05 kwa m³ na huiandika wazi; hiyo si bei rasmi ya nchi.</p>
  <p><strong>Faragha:</strong> hesabu, hifadhi na upakuaji wa faili hufanyika kwenye kivinjari hiki; hakuna ulichoingiza kinachotumwa kwa seva.</p>
  <p>Thibitisha mtiririko, upatikanaji, upotevu, vizuizi, gharama ya nishati na bei ya maji katika eneo lako.</p>
</section>
<section class="card" data-ai-routing="irrigation-calculator" data-ai-consent="required-before-model-send">
  <h2>Msaidizi wa hiari</h2>
  <p><a href="/sw/ai/?q=Panga%20mahitaji%20ya%20umwagiliaji">Fungua msaidizi wa Kiswahili</a>. Kiungo hiki hakitumi maingizo ya shamba; msaada wa modeli huomba idhini kabla ya kutuma maelezo.</p>
</section>`;

  const scripts = `
<script src="/data/agriculture/crop-database.js"></script>
<script src="/data/agriculture/${row.country.code.toLowerCase()}-agri-data.js"></script>
<script src="/engines/irrigation-engine.js"></script>
<script src="/assets/vendor/jspdf/jspdf.umd.min.js"></script>
<script>
(function(){
  'use strict';
  var cfg=window.__SW_AGRI_PAGE__,data=window.AfroTools&&window.AfroTools.countryData,cropDb=window.AfroTools&&window.AfroTools.cropDatabase,engine=window.AfroTools&&window.AfroTools.IrrigationEngine,latest=null;
  function id(x){return document.getElementById(x)}
  function opt(value,label){var option=document.createElement('option');option.value=value;option.textContent=label;return option}
  function num(value){return new Intl.NumberFormat(cfg.locale,{maximumFractionDigits:1}).format(Number(value)||0)}
  function cropName(value,fallback){return cfg.cropNames[value]||fallback||value}
  function method(value){return cfg.methods[value]||value}
  function stage(value){return cfg.stages[value]||value}
  function month(value){return cfg.months[Number(value)-1]||value}
  function status(message,error){id('actionStatus').textContent=message;id('actionStatus').style.color=error?'var(--agri-danger)':'var(--agri-good)'}
  function setActionsEnabled(enabled){Array.prototype.forEach.call(document.querySelectorAll('[data-result-action]'),function(button){button.disabled=!enabled})}
  function invalidateResult(message){
    latest=null;window.__SW_AGRI_TEST__.latest=null;id('resultPanel').hidden=true;id('emptyState').hidden=false;
    setActionsEnabled(false);id('detailRows').innerHTML='';id('detailCards').innerHTML='';id('actionStatus').textContent='';
    if(message)status(message,true)
  }
  function download(content,type,name){var url=URL.createObjectURL(new Blob([content],{type:type})),anchor=document.createElement('a');anchor.href=url;anchor.download=name;document.body.appendChild(anchor);anchor.click();anchor.remove();setTimeout(function(){URL.revokeObjectURL(url)},0)}
  function cell(value){var text=String(value==null?'':value);return /[",\\r\\n]/.test(text)?'"'+text.replace(/"/g,'""')+'"':text}
  function copy(text){if(navigator.clipboard&&navigator.clipboard.writeText)return navigator.clipboard.writeText(text);var area=document.createElement('textarea');area.value=text;document.body.appendChild(area);area.select();document.execCommand('copy');area.remove();return Promise.resolve()}
  function swResult(){
    if(!latest)return null;
    var result=latest.result;
    if(result.mode==='season')return {hali:'mzunguko',zao:cropName(latest.input.cropId,result.cropName),eneo:cfg.regionNames[latest.input.regionId]||result.regionName,ukubwaHekta:result.farmSizeHa,njia:method(result.irrigationMethod),ufanisiAsilimia:result.efficiencyPercent,majiJumlaM3:result.totalWater_m3,wastaniKilaSikuM3:result.dailyAvgVolume_m3,majiYanayopoteaM3:result.waterWasted_m3,mchangoMvuaM3:result.totalRainfallContrib_m3,gharama:result.costEstimate,miezi:result.monthlyData.map(function(item){return {mwezi:month(item.month),hatua:stage(item.stage),mvuaMm:item.rainfall_mm,hitajiBrutoMm:item.gir_mm_month}})};
    return {hali:'mwezi',zao:cropName(latest.input.cropId,result.cropName),eneo:cfg.regionNames[latest.input.regionId]||result.regionName,ukubwaHekta:result.farmSizeHa,njia:method(result.irrigationMethod),ufanisiAsilimia:result.efficiencyPercent,mwezi:month(result.month),hatua:stage(result.growthStage),majiJumlaM3:result.monthVolume_m3,wastaniKilaSikuM3:result.dailyVolume_m3,majiYanayopoteaM3:result.waterLost_m3,majiKwaMaraM3:result.perEvent_m3,gharama:result.costEstimate};
  }
  function report(){
    return latest?{schemaVersion:1,zana:'umwagiliaji',lugha:'sw',nchi:{code:cfg.countryCode,jina:cfg.countryName,sarafu:cfg.countryCurrency,alama:cfg.countryCurrencySymbol},imetengenezwa:new Date().toISOString(),maingizo:latest.input,matokeo:swResult(),vyanzo:{maelezo:cfg.sourceLabel,upya:cfg.dataReviewed,dataMojaKwaMoja:false,dataFile:'data/agriculture/'+cfg.countryCode.toLowerCase()+'-agri-data.js',engine:'engines/src/irrigation-engine.js#calculate'},kiwangoChaKuamini:'Makadirio ya kupanga; thibitisha hali ya eneo.',faragha:'Hesabu ya ndani; hakuna maingizo yanayotumwa.'}:null
  }
  function plainText(){
    var result=swResult();
    if(!result)return '';
    var cost=result.gharama||{};
    return ['AfroTools — makadirio ya umwagiliaji',cfg.countryName,'Zao: '+result.zao,'Eneo: '+result.eneo,'Njia: '+result.njia,'Ukubwa: '+num(result.ukubwaHekta)+' ha','Maji ya kupeleka: '+num(result.majiJumlaM3)+' m³','Wastani wa kila siku: '+num(result.wastaniKilaSikuM3)+' m³','Maji yanayopotea: '+num(result.majiYanayopoteaM3)+' m³','Ufanisi: '+result.ufanisiAsilimia+'%','Gharama ya injini: '+num(cost.total)+' '+(cost.currency||''),'Sarafu ya nchi: '+cfg.countryCurrency+' ('+cfg.countryCurrencySymbol+')','','Vyanzo: '+cfg.sourceLabel,'Upya: rejea tuli '+cfg.dataReviewed+', hakuna data ya moja kwa moja.','Kiwango cha kuamini: makadirio ya kupanga; thibitisha mtiririko, bei na hali ya eneo.','Faragha: hesabu ya ndani ya kivinjari.'].join('\\n')
  }
  function init(){
    if(!data||!cropDb||!engine)throw new Error('Injini au data ya umwagiliaji haipatikani.');
    data.crops.filter(function(crop){return crop.cropCoefficients||(cropDb.crops[crop.id]&&cropDb.crops[crop.id].cropCoefficients)}).forEach(function(crop){id('crop').appendChild(opt(crop.id,cropName(crop.id,crop.name)))});
    data.regions.forEach(function(region){id('region').appendChild(opt(region.id,cfg.regionNames[region.id]||region.name))});
    Object.keys(cfg.methods).forEach(function(key){id('method').appendChild(opt(key,cfg.methods[key]))});
    id('method').value='furrow';id('farmSize').value=data.agriStats.avgFarmSizeHa||1
  }
  function detailCard(title,fields){var card=document.createElement('article'),heading=document.createElement('strong');card.className='irrigation-detail-card';heading.textContent=title;card.appendChild(heading);fields.forEach(function(field){var line=document.createElement('span');line.textContent=field[0]+': '+field[1];card.appendChild(line)});id('detailCards').appendChild(card)}
  function calculate(){
    id('formError').textContent='';
    var size=Number(id('farmSize').value);
    if(!Number.isFinite(size)||size<0.1){invalidateResult();id('formError').textContent='Weka ukubwa halali wa angalau hekta 0.1.';id('farmSize').focus();return null}
    var input={cropId:id('crop').value,regionId:id('region').value,farmSizeHa:size,irrigationMethod:id('method').value,month:Number(id('month').value),growthStage:id('stage').value},result=engine.calculate(input,data,cropDb.crops);
    if(result.error){invalidateResult();id('formError').textContent='Hesabu ya maji haikukamilika.';return null}
    latest={input:input,result:result};window.__SW_AGRI_TEST__.latest=latest;id('emptyState').hidden=true;id('resultPanel').hidden=false;setActionsEnabled(true);
    var total=result.mode==='season'?result.totalWater_m3:result.monthVolume_m3,daily=result.mode==='season'?result.dailyAvgVolume_m3:result.dailyVolume_m3,lost=result.mode==='season'?result.waterWasted_m3:result.waterLost_m3;
    id('waterTotal').textContent=num(total);id('dailyVolume').textContent=num(daily)+' m³';id('efficiency').textContent=result.efficiencyPercent+'%';id('waterLost').textContent=num(lost)+' m³';
    id('scheduleNote').textContent=result.mode==='season'?'Mzunguko wa zao wa siku '+result.growingPeriodDays+'; rekebisha kwa unyevu wa udongo na mvua halisi.':'Makadirio ya '+num(result.perEvent_m3)+' m³ kila baada ya siku '+result.irrigationInterval.typical+'.';
    var head=id('detailHead'),rows=id('detailRows'),cards=id('detailCards');rows.innerHTML='';cards.innerHTML='';
    if(result.mode==='season'){
      head.innerHTML='<tr><th>Mwezi</th><th>Hatua</th><th>Mvua (mm)</th><th>Hitaji bruto (mm)</th></tr>';
      result.monthlyData.forEach(function(item){var monthName=month(item.month),stageName=stage(item.stage),rain=num(item.rainfall_mm),need=num(item.gir_mm_month),tr=document.createElement('tr');tr.innerHTML='<td>'+monthName+'</td><td>'+stageName+'</td><td>'+rain+'</td><td>'+need+'</td>';rows.appendChild(tr);detailCard(monthName,[['Hatua',stageName],['Mvua',rain+' mm'],['Hitaji bruto',need+' mm']])})
    }else{
      head.innerHTML='<tr><th>Njia</th><th>Ufanisi</th><th>Maji yanayotumika</th><th>Maji yanayopotea</th></tr>';
      result.methodComparison.forEach(function(item){var methodName=method(item.method),efficiency=item.efficiencyPercent+'%',used=num(item.waterUsed_m3)+' m³',wasted=num(item.waterWasted_m3)+' m³',tr=document.createElement('tr');tr.innerHTML='<td>'+methodName+'</td><td>'+efficiency+'</td><td>'+used+'</td><td>'+wasted+'</td>';rows.appendChild(tr);detailCard(methodName,[['Ufanisi',efficiency],['Maji yanayotumika',used],['Maji yanayopotea',wasted]])})
    }
    id('costNote').textContent=result.costEstimate.type==='pump'?'Dhana ya kusukuma ya injini: '+num(result.costEstimate.total)+' '+result.costEstimate.currency+' (USD 0.05 kwa m³); si bei rasmi ya '+cfg.countryName+'.':'Makadirio ya bei ya maji: '+num(result.costEstimate.total)+' '+result.costEstimate.currency+'. Thibitisha bei ya eneo lako.';
    id('savingNote').textContent=result.mode==='season'&&result.irrigationMethod!=='drip'?'Umwagiliaji wa matone ungepunguza kiasi kwa dhana ya ufanisi ya injini; thibitisha uwezekano na gharama ya kufunga mfumo.':'';
    status('Mahitaji ya maji yamehesabiwa kwenye kifaa hiki.');id('resultPanel').focus();return result
  }
  id('irrigationForm').addEventListener('submit',function(event){event.preventDefault();calculate()});
  id('irrigationForm').addEventListener('input',function(){if(latest)invalidateResult('Maingizo yamebadilika; hesabu tena kabla ya kuhifadhi au kupakua.')});
  id('irrigationForm').addEventListener('change',function(){if(latest)invalidateResult('Maingizo yamebadilika; hesabu tena kabla ya kuhifadhi au kupakua.')});
  id('irrigationForm').addEventListener('reset',function(){setTimeout(function(){invalidateResult();id('formError').textContent='';id('farmSize').value=data.agriStats.avgFarmSizeHa||1;status('Fomu imewekwa upya.')},0)});
  document.addEventListener('click',function(event){
    var button=event.target.closest('[data-action]');if(!button)return;if(!latest){status('Fanya hesabu kwanza.',true);return}
    var action=button.dataset.action,object=report(),text=plainText(),slug='afrotools-umwagiliaji-'+cfg.countryCode.toLowerCase();
    if(action==='copy')copy(text).then(function(){status('Matokeo yamenakiliwa.')});
    if(action==='share'){var sharePayload={title:'AfroTools — makadirio ya umwagiliaji',text:text,url:location.origin+location.pathname};if(navigator.share)navigator.share(sharePayload).then(function(){status('Matokeo yameshirikiwa.')}).catch(function(error){if(error&&error.name!=='AbortError')status('Kushiriki hakukukamilika.',true)});else copy(text+'\\n'+sharePayload.url).then(function(){status('Matokeo na kiungo vimenakiliwa kwa ajili ya kushiriki.')})}
    if(action==='save')try{localStorage.setItem('afrotools:sw-agriculture:irrigation:'+cfg.countryCode,JSON.stringify(object));status('Matokeo yamehifadhiwa kwenye kifaa hiki.')}catch(error){status('Hifadhi ya ndani imezuiwa.',true)}
    if(action==='txt')download('\\ufeff'+text,'text/plain;charset=utf-8',slug+'.txt');
    if(action==='json')download(JSON.stringify(object,null,2),'application/json;charset=utf-8',slug+'.json');
    if(action==='csv'){var result=swResult(),lines=[['nchi','code_nchi','zao','eneo','ukubwa_hekta','njia','maji_jumla_m3','maji_kila_siku_m3','maji_yanayopotea_m3','ufanisi_asilimia','sarafu_nchi','data_moja_kwa_moja'],[cfg.countryName,cfg.countryCode,result.zao,result.eneo,result.ukubwaHekta,result.njia,result.majiJumlaM3,result.wastaniKilaSikuM3,result.majiYanayopoteaM3,result.ufanisiAsilimia,cfg.countryCurrency,'hapana']];download('\\ufeff'+lines.map(function(row){return row.map(cell).join(',')}).join('\\r\\n'),'text/csv;charset=utf-8',slug+'.csv')}
    if(action==='pdf'){var Pdf=window.jspdf&&window.jspdf.jsPDF;if(!Pdf){status('PDF haipatikani sasa.',true);return}var pdf=new Pdf({unit:'pt',format:'a4'}),safe=text.normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').replace(/[’‘]/g,"'").replace(/[—–]/g,'-');pdf.text(pdf.splitTextToSize(safe,500),48,58);pdf.save(slug+'.pdf')}
  });
  window.__SW_AGRI_TEST__={calculate:calculate,invalidateResult:invalidateResult,latest:null,engine:engine,data:data,config:cfg,reportObject:report};
  try{init()}catch(error){id('formError').textContent=error.message;console.error(error)}
}());
</script>`;

  return renderPage({
    row: swRow,
    title: `Kikokotoo cha umwagiliaji — ${presentation.name} | AfroTools`,
    description: `Kadiria mahitaji ya maji ya umwagiliaji kwa ${presentation.name} kwa kutumia mazao, mvua na maeneo ya nchi hiyo.`,
    heading: `Kikokotoo cha umwagiliaji — ${presentation.name}`,
    lead: `Hesabu kiasi cha maji kwa mwezi au mzunguko wa zao kwa kutumia marejeo ya kilimo na hali ya hewa ya ${presentation.name}.`,
    artwork: row.artwork.file,
    body,
    scripts,
    pageConfig: config,
    familyLabel: 'Umwagiliaji',
    familyRoute: '/sw/zana/kikokotoo-umwagiliaji/',
  });
}

module.exports = {
  id: 'irrigation',
  CROP_NAMES,
  REGION_LABELS,
  METHODS,
  MONTHS,
  STAGES,
  countryPresentation,
  decodeHtmlEntities,
  loadCountryData,
  render,
  renderHub,
  sourceMetadata,
  translateRegion,
};
