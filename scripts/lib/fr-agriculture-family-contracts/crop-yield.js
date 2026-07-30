'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const {
  renderFrenchAgriculturePage,
  escapeHtml,
  frenchFamilyRoute,
  safeJson,
} = require('../fr-agriculture-page-shell');
const ROOT = path.resolve(__dirname, '../../..');

const PILOT_CODES = Object.freeze(['SN', 'CI', 'CM', 'MA', 'CD']);

const PRESENTATION = Object.freeze({
  SN: {
    name: 'Sénégal',
    locale: 'fr-SN',
    source: 'FAOSTAT (FAO), HarvestStat Africa, Agence nationale de la statistique et de la démographie, Banque mondiale et CGIAR',
    regions: {
      sn_nk: 'Niayes et littoral de Dakar (Dakar, Thiès)',
      sn_gb: 'Bassin arachidier (Kaolack, Kaffrine, Fatick, Diourbel)',
      sn_cs: 'Casamance (Ziguinchor, Sédhiou, Kolda)',
      sn_rv: 'Vallée du fleuve Sénégal (Saint-Louis, Matam)',
      sn_se: 'Sud-Est (Tambacounda, Kédougou)',
    },
    seasons: {
      hivernage: 'Hivernage — juin à octobre',
      contre_saison: 'Contre-saison irriguée — novembre à mai',
    },
  },
  CI: {
    name: 'Côte d’Ivoire',
    locale: 'fr-CI',
    source: 'FAOSTAT (FAO), HarvestStat Africa, Institut national de la statistique, Banque mondiale et CGIAR',
    regions: {
      ci_sf: 'Forêt du Sud (Abidjan, San-Pédro, Sassandra)',
      ci_cf: 'Forêt et savane du Centre (Yamoussoukro, Bouaké, Daloa)',
      ci_nw: 'Nord-Ouest (Man, Touba, Odienné)',
      ci_ne: 'Savane du Nord-Est (Korhogo, Bondoukou, Bouna)',
    },
    seasons: {
      main_rainy: 'Grande saison des pluies — mars à juillet',
      minor_rainy: 'Petite saison des pluies — septembre à novembre',
      single_season: 'Saison des pluies unique au Nord — juin à octobre',
    },
  },
  CM: {
    name: 'Cameroun',
    locale: 'fr-CM',
    source: 'FAOSTAT (FAO), HarvestStat Africa, Institut national de la statistique du Cameroun, Banque mondiale et CGIAR',
    regions: {
      cm_sw: 'Sud-Ouest et Littoral (Buéa, Douala, Limbé)',
      cm_ce: 'Centre et Sud (Yaoundé, Ebolowa)',
      cm_wt: 'Ouest et Nord-Ouest (Bamenda, Bafoussam)',
      cm_ad: 'Adamaoua (Ngaoundéré)',
      cm_fn: 'Extrême-Nord et Nord (Maroua, Garoua)',
    },
    seasons: {
      main_season: 'Saison principale — mars à août',
      dry_season_north: 'Saison des pluies au Nord — juin à octobre',
      minor_season: 'Petite saison — septembre à novembre',
    },
  },
  MA: {
    name: 'Maroc',
    locale: 'fr-MA',
    source: 'FAOSTAT (FAO), HarvestStat Africa, Haut-Commissariat au Plan, Banque mondiale et CGIAR',
    regions: {
      ma_at: 'Plaines atlantiques (Casablanca-Settat, Rabat-Salé, Gharb)',
      ma_su: 'Souss-Massa (Agadir, Tiznit)',
      ma_fk: 'Fès-Meknès et plateau du Saïss',
      ma_or: 'Oriental et Drâa-Tafilalet (Oujda, Errachidia)',
      ma_rn: 'Rif et montagnes du Nord (Tanger-Tétouan, Al Hoceïma)',
    },
    seasons: {
      autumn_winter: 'Saison d’automne-hiver (bour) — octobre à mars',
      spring: 'Saison de printemps — mars à juin',
      irrigated_summer: 'Été irrigué — mai à septembre',
    },
  },
  CD: {
    name: 'République démocratique du Congo',
    shortName: 'RDC',
    locale: 'fr-CD',
    source: 'FAOSTAT (FAO), HarvestStat Africa, Institut national de la statistique, Banque mondiale et CGIAR',
    regions: {
      cd_wt: 'Ouest (Kinshasa, Kongo Central, Kwilu, Kwango)',
      cd_eq: 'Zone équatoriale (Équateur, Mongala, Tshopo, Tshuapa)',
      cd_ek: 'Kivu oriental (Nord-Kivu, Sud-Kivu, Maniema)',
      cd_ka: 'Katanga et Sud-Est (Haut-Katanga, Lualaba, Tanganyika)',
      cd_ks: 'Kasaï (Kasaï, Kasaï Central, Kasaï Oriental, Sankuru)',
    },
    seasons: {
      main_season_a: 'Saison A — septembre à décembre',
      main_season_b: 'Saison B — mars à juin',
      year_round: 'Toute l’année — zones équatoriale et Kivu oriental',
    },
  },
});

const CROP_NAMES = Object.freeze({
  avocado: 'Avocat',
  groundnut: 'Arachide',
  millet: 'Mil',
  rice: 'Riz paddy',
  maize: 'Maïs',
  sorghum: 'Sorgho',
  cowpea: 'Niébé',
  cotton: 'Coton',
  tomato: 'Tomate',
  onion: 'Oignon',
  mango: 'Mangue',
  cocoa: 'Cacao',
  coffee_robusta: 'Café robusta',
  cashew: 'Anacarde',
  rubber: 'Hévéa',
  oil_palm: 'Palmier à huile',
  cassava: 'Manioc',
  yam: 'Igname',
  plantain: 'Banane plantain',
  banana: 'Banane',
  wheat: 'Blé',
  barley: 'Orge',
  citrus: 'Agrumes',
  olive: 'Olive',
  potato: 'Pomme de terre',
  sugar_cane: 'Canne à sucre',
  dates: 'Dattes',
  grape: 'Raisin',
  common_bean: 'Haricot commun',
  chickpea: 'Pois chiche',
  clove: 'Clou de girofle',
  coconut: 'Noix de coco',
  coffee_arabica: 'Café arabica',
  enset: 'Ensete',
  fonio: 'Fonio',
  lentils: 'Lentilles',
  pigeon_pea: 'Pois d’Angole',
  pineapple: 'Ananas',
  sesame: 'Sésame',
  soybean: 'Soja',
  sunflower: 'Tournesol',
  sweet_potato: 'Patate douce',
  tea: 'Thé',
  teff: 'Teff',
  tobacco: 'Tabac',
  vanilla: 'Vanille',
});

const SOIL_NAMES = Object.freeze({
  loamy: 'Sol limoneux',
  clay: 'Sol argileux',
  sandy: 'Sol sableux',
  sandy_loam: 'Sol sablo-limoneux',
  clay_loam: 'Sol argilo-limoneux',
  volcanic: 'Sol volcanique',
  laterite: 'Sol latéritique',
  alluvial: 'Sol alluvial',
  black_cotton: 'Vertisol',
  red_soil: 'Sol rouge',
});

const MONTH_NAMES = Object.freeze([
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
]);

function loadCountryData(countryCode) {
  const relativePath = `data/agriculture/${countryCode.toLowerCase()}-agri-data.js`;
  const sandbox = { window: { AfroTools: {} } };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(ROOT, relativePath), 'utf8'), sandbox, { filename: relativePath });
  if (!sandbox.window.AfroTools.countryData) throw new Error(`No countryData export in ${relativePath}.`);
  return sandbox.window.AfroTools.countryData;
}

function translateRegionLabel(value, index) {
  let label = String(value || '').trim();
  const replacements = [
    [/\bNorth(?:ern)?\b/gi, 'Nord'],
    [/\bSouth(?:ern)?\b/gi, 'Sud'],
    [/\bEast(?:ern)?\b/gi, 'Est'],
    [/\bWest(?:ern)?\b/gi, 'Ouest'],
    [/\bCentral\b/gi, 'Centre'],
    [/\bCoastal\b/gi, 'Littoral'],
    [/\bCoast\b/gi, 'Littoral'],
    [/\bHighlands?\b/gi, 'Hautes terres'],
    [/\bLowlands?\b/gi, 'Basses terres'],
    [/\bPlains?\b/gi, 'Plaines'],
    [/\bMountains?\b/gi, 'Montagnes'],
    [/\bValleys?\b/gi, 'Vallée'],
    [/\bRiver\b/gi, 'Fleuve'],
    [/\bForest\b/gi, 'Forêt'],
    [/\bSavann?ah?\b/gi, 'Savane'],
    [/\bBasin\b/gi, 'Bassin'],
    [/\bPlateau\b/gi, 'Plateau'],
    [/\bDesert\b/gi, 'Désert'],
    [/\bInland\b/gi, 'Intérieur'],
    [/\bZone\b/gi, 'Zone'],
    [/\bRegion\b/gi, 'Région'],
    [/\bBelt\b/gi, 'Ceinture'],
    [/\band\b/gi, 'et'],
  ];
  replacements.forEach(([pattern, replacement]) => {
    label = label.replace(pattern, replacement);
  });
  return `Zone agricole ${index + 1} — ${label}`;
}

function seasonLabel(season, index) {
  const start = Number(season.startMonth);
  const end = Number(season.endMonth);
  if (start >= 1 && start <= 12 && end >= 1 && end <= 12) {
    return `Saison ${index + 1} — ${MONTH_NAMES[start - 1]} à ${MONTH_NAMES[end - 1]}`;
  }
  return `Saison agricole ${index + 1}`;
}

function sourceMetadata(row) {
  const html = fs.readFileSync(path.join(ROOT, row.english.file), 'utf8');
  const sourceMatch = html.match(/Data Sources:\s*([^<\r\n]+)/i);
  const updatedMatch = html.match(/Last updated:\s*([0-9]{4})/i);
  if (!sourceMatch) throw new Error(`Missing accepted English source label in ${row.english.file}.`);
  return {
    source: sourceMatch[1].trim().replace(/\.$/, '').replace(/\bWorld Bank\b/g, 'Banque mondiale'),
    dataReviewed: updatedMatch ? updatedMatch[1] : 'non indiquée',
  };
}

function pagePresentation(row) {
  const code = row.country && row.country.code;
  const presentation = PRESENTATION[code];
  if (presentation) return { ...presentation, dataReviewed: '2026' };
  if (!code) throw new Error(`Crop Yield country presentation requires a country row: ${row.english.id}.`);
  const data = loadCountryData(code);
  const metadata = sourceMetadata(row);
  return {
    name: row.country.frenchName,
    locale: `fr-${code}`,
    source: metadata.source,
    dataReviewed: metadata.dataReviewed,
    regions: Object.fromEntries(data.regions.map((region, index) => [
      region.id,
      translateRegionLabel(region.name, index),
    ])),
    seasons: Object.fromEntries(data.seasons.map((season, index) => [
      season.id,
      seasonLabel(season, index),
    ])),
  };
}

function buildEngineInput(values, countryCode) {
  return {
    countryCode,
    cropId: values.cropId,
    regionId: values.regionId,
    farmSizeHa: Number(values.farmSizeHa),
    soilType: values.soilType,
    irrigationType: values.irrigationType,
    fertilizerUsage: values.fertilizerUsage,
    seedType: values.seedType,
    season: values.season,
  };
}

function renderHub(row, context = {}) {
  const countryRows = (context.familyRows || [])
    .filter((candidate) => candidate.country)
    .sort((left, right) => left.country.frenchName.localeCompare(right.country.frenchName, 'fr'));
  if (countryRows.length !== 54) {
    throw new Error(`Crop Yield hub requires exactly 54 country routes; found ${countryRows.length}.`);
  }
  const body = `
<section class="card" aria-labelledby="countriesTitle">
  <h2 id="countriesTitle">Choisissez le pays du référentiel</h2>
  <p>Chaque calculateur utilise le même moteur de rendement que la version anglaise et charge le référentiel agricole propre au pays sélectionné. Aucun pays n’est déduit d’un modèle générique.</p>
  <ul class="country-list">${countryRows.map((candidate) => `<li><a href="${escapeHtml(candidate.french.route)}">${escapeHtml(candidate.country.frenchName)}</a> <span>(${candidate.country.code})</span></li>`).join('')}</ul>
</section>
<section class="card">
  <h2>Ce que produit l’estimation</h2>
  <p>Rendement par hectare, récolte totale, écart par rapport au potentiel, fourchette de revenus et recommandations indicatives. Les sources et la fraîcheur sont précisées sur chaque page pays.</p>
  <p><strong>Confidentialité :</strong> les calculs sont effectués dans le navigateur. Les saisies ne sont pas envoyées à un serveur.</p>
</section>`;
  return renderFrenchAgriculturePage({
    row,
    title: 'Estimateurs de rendement agricole par pays | AfroTools',
    description: 'Choisissez parmi 54 référentiels pays pour estimer en français un rendement agricole avec le moteur AfroTools.',
    heading: 'Estimateurs de rendement agricole',
    lead: 'Sélectionnez un pays pour utiliser son référentiel de cultures, régions, saisons, unités et devise.',
    artwork: row.artwork.file,
    body,
    scripts: '',
    pageConfig: { id: row.english.id, frenchRoute: row.french.routeKey },
    familyLabel: 'Rendement des cultures',
    familyRoute: '/fr/agriculture/crop-yield/',
  });
}

function render(row, context = {}) {
  if (!row.country) return renderHub(row, context);
  const presentation = pagePresentation(row);
  const displayName = presentation.shortName || presentation.name;
  const description = `Estimez le rendement par hectare, la récolte totale et une fourchette de revenus pour ${presentation.name}, à partir du référentiel agricole ${row.country.code}.`;
  const artwork = row.artwork.file;
  const config = {
    id: row.english.id,
    countryCode: row.country.code,
    countryName: presentation.name,
    locale: presentation.locale,
    englishRoute: row.english.routeKey,
    frenchRoute: row.french.routeKey,
    currencyOwner: `data/agriculture/${row.country.code.toLowerCase()}-agri-data.js`,
    cropNames: CROP_NAMES,
    soilNames: SOIL_NAMES,
    regionNames: presentation.regions,
    seasonNames: presentation.seasons,
    sourceLabel: presentation.source,
    dataReviewed: presentation.dataReviewed,
    confidence: 'Estimation indicative',
  };

  const fertilizerRoute = frenchFamilyRoute(context, 'fertilizer', row.country.code);
  const farmProfitRoute = frenchFamilyRoute(context, 'farm-profit', row.country.code);
  const body = `
<style>@media(max-width:360px){.crop-reference-card h2{max-width:calc(100% - 8px);overflow-wrap:anywhere}.crop-reference-table{min-width:0;table-layout:fixed}.crop-reference-table th,.crop-reference-table td{overflow-wrap:anywhere;padding:6px 3px}}</style>
<section class="card" aria-labelledby="calcTitle">
  <h2 id="calcTitle">Calculer un rendement estimatif</h2>
  <p>Choisissez la culture, la zone et vos hypothèses d’exploitation. Les valeurs restent modifiables et le calcul s’exécute entièrement dans votre navigateur.</p>
  <form id="yieldForm" novalidate>
    <div class="grid">
      <div class="field"><label for="crop">Culture</label><select id="crop" required></select><small>Le prix et le rendement de base viennent du jeu de données du pays.</small></div>
      <div class="field"><label for="region">Région ou zone agricole</label><select id="region" required></select><small>La zone ajuste le potentiel de la culture sélectionnée.</small></div>
      <div class="field"><label for="farmSize">Superficie de l’exploitation (hectares)</label><input id="farmSize" type="number" min="0.1" step="0.1" inputmode="decimal" required><small>Entrez une valeur supérieure ou égale à 0,1 hectare.</small></div>
      <div class="field"><label for="soil">Type de sol</label><select id="soil" required></select></div>
      <div class="field"><label for="irrigation">Accès à l’eau</label><select id="irrigation"><option value="rainfed">Culture pluviale, sans irrigation</option><option value="supplemental">Irrigation d’appoint</option><option value="full_irrigation">Irrigation complète</option></select></div>
      <div class="field"><label for="fertilizer">Apport fertilisant</label><select id="fertilizer"><option value="none">Aucun apport</option><option value="organic_only">Apport organique seulement</option><option value="moderate_inorganic" selected>Apport minéral modéré</option><option value="optimized">Dose recommandée optimisée</option></select></div>
      <div class="field"><label for="seed">Type de semences</label><select id="seed"><option value="local_variety">Variété locale ou traditionnelle</option><option value="improved_oga">Variété améliorée à pollinisation libre</option><option value="hybrid">Hybride F1</option><option value="certified">Semence améliorée certifiée</option></select></div>
      <div class="field"><label for="season">Saison culturale</label><select id="season" required></select></div>
    </div>
    <div class="actions">
      <button class="action primary" type="submit">Calculer l’estimation</button>
      <button class="action" id="resetAction" type="reset">Réinitialiser</button>
    </div>
    <p class="error" id="formError" role="alert" aria-live="assertive"></p>
  </form>
</section>
<section class="card" aria-labelledby="resultsTitle">
  <h2 id="resultsTitle">Résultat</h2>
  <div class="empty" id="emptyState">Renseignez les champs puis lancez le calcul. Aucun résultat n’est encore enregistré.</div>
  <div class="result-panel" id="resultPanel" hidden aria-live="polite">
    <div class="result-hero"><div class="result-value" id="yieldPerHa">—</div><div>tonnes estimées par hectare</div></div>
    <div class="result-grid">
      <div class="metric"><strong id="totalYield">—</strong><span>Récolte totale estimée</span></div>
      <div class="metric"><strong id="yieldGap">—</strong><span>Écart par rapport au potentiel</span></div>
      <div class="metric"><strong id="farmSizeResult">—</strong><span>Superficie calculée</span></div>
    </div>
    <div class="compare" aria-label="Comparaison des rendements">
      <div class="compare-row"><strong>Votre estimation</strong><div class="bar"><span id="estimateBar"></span></div></div>
      <div class="compare-row"><strong>Moyenne nationale</strong><div class="bar"><span id="nationalBar"></span></div></div>
      <div class="compare-row"><strong>Potentiel agronomique</strong><div class="bar"><span id="potentialBar"></span></div></div>
    </div>
    <h3 style="margin-top:22px">Fourchette de revenus</h3>
    <div class="result-grid">
      <div class="metric"><strong id="revenueLow">—</strong><span>Hypothèse basse</span></div>
      <div class="metric"><strong id="revenueMid">—</strong><span>Hypothèse centrale</span></div>
      <div class="metric"><strong id="revenueHigh">—</strong><span>Hypothèse haute</span></div>
    </div>
    <p id="revenueNote"></p>
    <div id="recommendationBlock" hidden><h3>Pistes d’amélioration</h3><ul class="recommendations" id="recommendations"></ul></div>
    <div class="actions" aria-label="Actions sur le résultat">
      <button class="action" type="button" data-action="copy">Copier</button>
      <button class="action" type="button" data-action="share">Partager</button>
      <button class="action" type="button" data-action="save">Enregistrer dans ce navigateur</button>
      <button class="action" type="button" data-action="pdf">Exporter en PDF</button>
      <button class="action" type="button" data-action="csv">Exporter en CSV</button>
      <button class="action" type="button" data-action="json">Exporter en JSON</button>
      <button class="action" type="button" data-action="txt">Exporter en TXT</button>
    </div>
    <p class="status" id="actionStatus" role="status" aria-live="polite"></p>
  </div>
</section>
<section class="card" aria-labelledby="trustTitle">
  <h2 id="trustTitle">Sources, fraîcheur et limites</h2>
  <div class="trust-grid">
    <div class="trust-item"><strong>Sources</strong><span>${escapeHtml(presentation.source)}</span></div>
    <div class="trust-item"><strong>Fraîcheur</strong><span>Référentiel statique de la page anglaise, indiqué comme mis à jour en 2026. Il ne s’agit pas de données en direct.</span></div>
    <div class="trust-item"><strong>Confiance</strong><span>Estimation indicative pour la planification. Les conditions réelles de la parcelle peuvent modifier le résultat.</span></div>
  </div>
  <p><strong>Confidentialité :</strong> le calcul, la copie et la préparation des exports sont locaux. Aucune saisie n’est envoyée à un serveur. L’enregistrement utilise uniquement le stockage de ce navigateur.</p>
  <p><strong>À vérifier :</strong> confirmez les hypothèses, les prix et les pratiques avec un service de conseil agricole local avant d’engager des dépenses.</p>
</section>
<section class="card crop-reference-card" aria-labelledby="cropTableTitle">
  <h2 id="cropTableTitle">Cultures du référentiel ${escapeHtml(displayName)}</h2>
  <div class="table-wrap"><table class="data-table crop-reference-table"><thead><tr><th>Culture</th><th>Rendement moyen (t/ha)</th><th>Potentiel (t/ha)</th><th>Période de plantation</th></tr></thead><tbody id="cropRows"></tbody></table></div>
</section>
<section class="card" aria-labelledby="nextTitle">
  <h2 id="nextTitle">Poursuivre votre préparation agricole</h2>
  <p><a href="${escapeHtml(fertilizerRoute)}">Calculer les besoins en engrais</a> · <a href="${escapeHtml(farmProfitRoute)}">Estimer la rentabilité de l’exploitation</a> · <a href="/fr/agriculture/">Voir les outils agricoles en français</a></p>
</section>`;

  const scripts = `
<script src="/data/agriculture/crop-database.js"></script>
<script src="/data/agriculture/${row.country.code.toLowerCase()}-agri-data.js"></script>
<script src="/engines/crop-yield-engine.js"></script>
<script src="/assets/vendor/jspdf/jspdf.umd.min.js"></script>
<script>
(function(){
  'use strict';
  var cfg=window.__FR_AGRI_PAGE__;
  var data=window.AfroTools&&window.AfroTools.countryData;
  var cropDatabase=window.AfroTools&&window.AfroTools.cropDatabase;
  var engine=window.AfroTools&&window.AfroTools.CropYieldEngine;
  var latest=null;
  var monthNames=['janv.','févr.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.'];
  function byId(id){return document.getElementById(id);}
  function cropName(id,fallback){return cfg.cropNames[id]||fallback||id;}
  function number(value){return new Intl.NumberFormat(cfg.locale,{maximumFractionDigits:2}).format(Number(value)||0);}
  function currency(value){return new Intl.NumberFormat(cfg.locale,{style:'currency',currency:data.currency,maximumFractionDigits:0}).format(Number(value)||0);}
  function option(value,label){var node=document.createElement('option');node.value=value;node.textContent=label;return node;}
  function download(content,type,fileName){var url=URL.createObjectURL(new Blob([content],{type:type}));var link=document.createElement('a');link.href=url;link.download=fileName;document.body.appendChild(link);link.click();link.remove();setTimeout(function(){URL.revokeObjectURL(url);},0);}
  function csvCell(value){var text=String(value==null?'':value);return /[",\\r\\n]/.test(text)?'"'+text.replace(/"/g,'""')+'"':text;}
  function status(message,isError){var node=byId('actionStatus');node.textContent=message;node.style.color=isError?'var(--agri-danger)':'var(--agri-good)';}
  function reportObject(){return latest?{schemaVersion:1,tool:'crop-yield',locale:'fr',country:{code:cfg.countryCode,name:cfg.countryName},generatedAt:new Date().toISOString(),inputs:latest.input,result:latest.result,sources:{label:cfg.sourceLabel,dataReviewed:cfg.dataReviewed,confidence:cfg.confidence,live:false},privacy:'Calcul local dans le navigateur; aucune saisie envoyée.'}:null;}
  function reportText(){
    if(!latest)return '';
    var r=latest.result;
    return ['AfroTools — estimation de rendement',cfg.countryName,'Culture : '+cropName(r.cropId,r.cropName),'Région : '+(cfg.regionNames[latest.input.regionId]||r.regionName),'Superficie : '+number(r.farmSizeHa)+' ha','Rendement estimé : '+number(r.estimatedYieldPerHa)+' t/ha','Récolte totale : '+number(r.totalEstimatedYield)+' '+r.yieldUnit,'Écart de rendement : '+r.yieldGapPercent+' %','Revenu bas : '+currency(r.revenueEstimate.low),'Revenu central : '+currency(r.revenueEstimate.mid),'Revenu haut : '+currency(r.revenueEstimate.high),'','Sources : '+cfg.sourceLabel,'Fraîcheur : référentiel statique indiqué comme mis à jour en '+cfg.dataReviewed+'; aucune donnée en direct.','Limite : estimation indicative à confirmer localement.','Confidentialité : calcul local dans ce navigateur.'].join('\\n');
  }
  function copyText(text){
    if(navigator.clipboard&&navigator.clipboard.writeText)return navigator.clipboard.writeText(text);
    var area=document.createElement('textarea');area.value=text;area.setAttribute('readonly','');area.style.position='fixed';area.style.left='-9999px';document.body.appendChild(area);area.select();document.execCommand('copy');area.remove();return Promise.resolve();
  }
  function recommendationText(item){
    var text=String(item.text||'');
    if(text.indexOf('Consider a soil test')===0)return 'Envisagez une analyse du sol et un plan de fertilisation ou de compostage avant le semis.';
    if(text.indexOf('Ask an extension officer')===0)return 'Demandez à un conseiller agricole ou à un fournisseur fiable quelles semences améliorées conviennent à '+cropName(latest.input.cropId)+' en '+cfg.countryName+'.';
    if(text.indexOf('Supplemental irrigation')===0)return 'Une irrigation d’appoint aux stades critiques peut réduire les pertes de rendement dans cette zone.';
    if(text.indexOf('Add mulch')===0)return 'Ajoutez du paillage, du compost ou du fumier pour améliorer la rétention d’eau et la disponibilité des nutriments.';
    return 'Vérifiez cette recommandation avec un conseiller agricole local.';
  }
  function setBar(id,value,max){
    var element=byId(id);var percent=max>0?Math.min(100,Math.max(7,value/max*100)):7;
    element.style.width=percent+'%';element.textContent=number(value)+' t/ha';
  }
  function updateDependents(){
    var region=data.regions.find(function(item){return item.id===byId('region').value;});
    var soil=byId('soil');soil.innerHTML='';
    (region&&region.soilTypes||[]).forEach(function(id){soil.appendChild(option(id,cfg.soilNames[id]||id));});
    var season=byId('season');season.innerHTML='';
    data.seasons.forEach(function(item){if(!item.applicableRegions||item.applicableRegions.indexOf(byId('region').value)!==-1)season.appendChild(option(item.id,cfg.seasonNames[item.id]||item.name));});
  }
  function initialize(){
    if(!data||!cropDatabase||!engine)throw new Error('Le moteur ou les données agricoles ne sont pas disponibles.');
    data.crops.forEach(function(item){var local=item.localNames&&item.localNames.length?' — '+item.localNames.join(', '):'';byId('crop').appendChild(option(item.id,cropName(item.id,item.name)+local));});
    data.regions.forEach(function(item){byId('region').appendChild(option(item.id,cfg.regionNames[item.id]||item.name));});
    byId('region').addEventListener('change',updateDependents);updateDependents();
    byId('farmSize').value=data.agriStats.avgFarmSizeHa||0.5;
    data.crops.forEach(function(item){var row=document.createElement('tr');var planting=(item.plantingMonths||[]).map(function(value){return monthNames[value-1];}).join(', ');row.innerHTML='<td>'+escapeHtml(cropName(item.id,item.name))+'</td><td>'+number(item.baseYieldPerHa)+'</td><td>'+number(item.potentialYieldPerHa||0)+'</td><td>'+escapeHtml(planting||'À vérifier localement')+'</td>';byId('cropRows').appendChild(row);});
  }
  function escapeHtml(value){return String(value==null?'':value).replace(/[&<>"']/g,function(character){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character];});}
  function calculate(){
    byId('formError').textContent='';
    var farmSize=Number(byId('farmSize').value);
    if(!Number.isFinite(farmSize)||farmSize<0.1){byId('formError').textContent='Saisissez une superficie valide d’au moins 0,1 hectare.';byId('farmSize').focus();return null;}
    var input={countryCode:cfg.countryCode,cropId:byId('crop').value,regionId:byId('region').value,farmSizeHa:farmSize,soilType:byId('soil').value,irrigationType:byId('irrigation').value,fertilizerUsage:byId('fertilizer').value,seedType:byId('seed').value,season:byId('season').value};
    var result=engine.calculate(input,data,cropDatabase);
    if(result.error){byId('formError').textContent='Le calcul n’a pas pu être effectué. Vérifiez la culture et la région sélectionnées.';return null;}
    latest={input:input,result:result};
    byId('emptyState').hidden=true;byId('resultPanel').hidden=false;
    byId('yieldPerHa').textContent=number(result.estimatedYieldPerHa);
    byId('totalYield').textContent=number(result.totalEstimatedYield)+' '+result.yieldUnit;
    byId('yieldGap').textContent=result.yieldGapPercent+' %';
    byId('farmSizeResult').textContent=number(result.farmSizeHa)+' ha';
    setBar('estimateBar',result.estimatedYieldPerHa,result.potentialYield);
    setBar('nationalBar',result.nationalAverage,result.potentialYield);
    setBar('potentialBar',result.potentialYield,result.potentialYield);
    byId('revenueLow').textContent=currency(result.revenueEstimate.low);
    byId('revenueMid').textContent=currency(result.revenueEstimate.mid);
    byId('revenueHigh').textContent=currency(result.revenueEstimate.high);
    byId('revenueNote').textContent='Fourchette calculée avec le prix local statique du référentiel, en '+result.revenueEstimate.currency+'. Il ne s’agit pas d’un prix de marché en direct.';
    var recommendations=byId('recommendations');recommendations.innerHTML='';
    (result.recommendations||[]).forEach(function(item){var li=document.createElement('li');li.textContent=recommendationText(item)+' Impact indicatif : '+String(item.impact||'').replace('yield potential','potentiel de rendement');recommendations.appendChild(li);});
    byId('recommendationBlock').hidden=!result.recommendations||!result.recommendations.length;
    status('Estimation calculée localement.');
    window.__FR_AGRI_TEST__.latest=latest;
    return result;
  }
  byId('yieldForm').addEventListener('submit',function(event){event.preventDefault();calculate();});
  byId('yieldForm').addEventListener('reset',function(){setTimeout(function(){latest=null;window.__FR_AGRI_TEST__.latest=null;byId('resultPanel').hidden=true;byId('emptyState').hidden=false;byId('formError').textContent='';byId('farmSize').value=data.agriStats.avgFarmSizeHa||0.5;byId('region').selectedIndex=0;updateDependents();status('Formulaire réinitialisé.');},0);});
  document.addEventListener('click',function(event){
    var button=event.target.closest('[data-action]');if(!button)return;
    if(!latest){status('Lancez d’abord un calcul.',true);return;}
    var action=button.getAttribute('data-action');var object=reportObject();var slug='afrotools-rendement-'+cfg.countryCode.toLowerCase();
    if(action==='copy')copyText(reportText()).then(function(){status('Résultat copié.');}).catch(function(){status('La copie est bloquée par ce navigateur.',true);});
    if(action==='share'){if(navigator.share)navigator.share({title:'Estimation de rendement — '+cfg.countryName,text:reportText(),url:location.href}).then(function(){status('Feuille de partage ouverte.');}).catch(function(error){if(error&&error.name!=='AbortError')status('Le partage est indisponible.',true);});else copyText(location.href+'\\n\\n'+reportText()).then(function(){status('Lien et résultat copiés pour le partage.');});}
    if(action==='save')try{localStorage.setItem('afrotools:fr-agriculture:crop-yield:'+cfg.countryCode,JSON.stringify(object));status('Résultat enregistré dans ce navigateur.');}catch(error){status('L’enregistrement local est bloqué.',true);}
    if(action==='txt'){download('\\ufeff'+reportText(),'text/plain;charset=utf-8',slug+'.txt');status('Export TXT téléchargé.');}
    if(action==='json'){download(JSON.stringify(object,null,2),'application/json;charset=utf-8',slug+'.json');status('Export JSON téléchargé.');}
    if(action==='csv'){var r=latest.result;var rows=[['pays','code_pays','culture','region','superficie_ha','rendement_t_ha','recolte_totale','unite','ecart_pct','devise','revenu_bas','revenu_central','revenu_haut','donnees_en_direct'],[cfg.countryName,cfg.countryCode,cropName(r.cropId,r.cropName),cfg.regionNames[latest.input.regionId]||r.regionName,r.farmSizeHa,r.estimatedYieldPerHa,r.totalEstimatedYield,r.yieldUnit,r.yieldGapPercent,r.revenueEstimate.currency,r.revenueEstimate.low,r.revenueEstimate.mid,r.revenueEstimate.high,'non']];download('\\ufeff'+rows.map(function(row){return row.map(csvCell).join(',');}).join('\\r\\n'),'text/csv;charset=utf-8',slug+'.csv');status('Export CSV téléchargé.');}
    if(action==='pdf'){var JsPdf=window.jspdf&&window.jspdf.jsPDF;if(!JsPdf){status('L’export PDF est indisponible.',true);return;}var doc=new JsPdf({unit:'pt',format:'a4'});var printable=reportText().normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').replace(/[’‘]/g,"'").replace(/[—–]/g,'-');var lines=doc.splitTextToSize(printable,500);doc.setFont('helvetica','normal');doc.setFontSize(10);doc.text(lines,48,58);doc.save(slug+'.pdf');status('Export PDF téléchargé.');}
  });
  window.__FR_AGRI_TEST__={calculate:calculate,latest:null,engine:engine,data:data,config:cfg,reportObject:reportObject};
  try{initialize();}catch(error){byId('formError').textContent=error.message;console.error(error);}
})();
</script>`;

  return renderFrenchAgriculturePage({
    row,
    title: `Estimateur de rendement agricole — ${presentation.name} | AfroTools`,
    description,
    heading: `Estimateur de rendement agricole — ${displayName}`,
    lead: `Estimez le rendement par hectare, la récolte totale et les revenus indicatifs à partir des cultures, zones, sols et saisons du référentiel ${row.country.code}.`,
    artwork,
    body,
    scripts,
    pageConfig: config,
    familyLabel: 'Rendement des cultures',
    familyRoute: '/fr/agriculture/crop-yield/',
  });
}

module.exports = {
  id: 'crop-yield',
  PILOT_CODES,
  PRESENTATION,
  CROP_NAMES,
  SOIL_NAMES,
  loadCountryData,
  sourceMetadata,
  pagePresentation,
  buildEngineInput,
  renderHub,
  render,
};
