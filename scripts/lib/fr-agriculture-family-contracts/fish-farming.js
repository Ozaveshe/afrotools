'use strict';

const { renderFrenchAgriculturePage, escapeHtml } = require('../fr-agriculture-page-shell');

const SPECIES = Object.freeze({ catfish: 'Poisson-chat africain', tilapia: 'Tilapia du Nil', trout: 'Truite arc-en-ciel' });
const SYSTEMS = Object.freeze({ earthen_pond: 'Étang en terre', concrete_tank: 'Bassin en béton', tarpaulin_tank: 'Bassin bâché', cage: 'Cage en lac ou étang' });
const DENSITIES = Object.freeze({ low: 'Faible', medium: 'Moyenne', high: 'Élevée' });
const MANAGEMENT = Object.freeze({ good: 'Bonne', average: 'Moyenne', poor: 'Faible' });
const TARGETS = Object.freeze({ min: 'Taille minimale', typical: 'Taille courante', premium: 'Taille premium' });
const FEEDS = Object.freeze({ imported: 'Aliment commercial importé', local_float: 'Aliment flottant local', local_sink: 'Aliment coulant local', farm_made: 'Aliment formulé à la ferme' });
const PROCESSING = Object.freeze({ none: 'Vente fraîche ou vivante', smoked: 'Poisson fumé', dried: 'Poisson séché', fillet: 'Filets' });

function options(values) {
  return Object.entries(values).map(([value, label]) => `<option value="${value}">${escapeHtml(label)}</option>`).join('');
}

function renderHub(row, context = {}) {
  const countries = (context.familyRows || []).filter((item) => item.country)
    .sort((a, b) => a.country.frenchName.localeCompare(b.country.frenchName, 'fr'));
  if (countries.length !== 15) throw new Error('Fish Farming hub requires 15 manifest countries.');
  return renderFrenchAgriculturePage({
    row,
    title: 'Rentabilité de la pisciculture par pays | AfroTools',
    description: 'Choisissez un pays pour estimer la rentabilité d’un élevage de poisson avec les coûts maintenus pour ce pays.',
    heading: 'Rentabilité de la pisciculture',
    lead: 'Quinze applications pays conservent les espèces, prix, devises et hypothèses du référentiel anglais accepté.',
    artwork: row.artwork.file,
    body: `<section class="card"><h2>Choisissez le pays</h2><ul class="country-list">${countries.map((item) => `<li><a href="${escapeHtml(item.french.route)}">${escapeHtml(item.country.frenchName)}</a> <span>(${item.country.code})</span></li>`).join('')}</ul></section>
<section class="card"><h2>Limites</h2><p>Les coûts sont des références statiques de planification, pas des prix en direct ni un devis.</p><p><strong>Confidentialité :</strong> navigation et calculs locaux.</p></section>`,
    scripts: '',
    pageConfig: { id: row.english.id },
    familyLabel: 'Pisciculture',
    familyRoute: '/fr/agriculture/fish-farming/',
  });
}

function render(row, context = {}) {
  if (!row.country) return renderHub(row, context);
  const config = {
    id: row.english.id,
    countryCode: row.country.code,
    countryName: row.country.frenchName,
    locale: 'fr',
    species: SPECIES,
    systems: SYSTEMS,
    feeds: FEEDS,
    processing: PROCESSING,
    sourceLabel: 'FAO SOFIA 2024, WorldFish, enquêtes nationales sur les alevins, ministères agricoles et statistiques de travail OIT',
    dataReviewed: 'coûts de marché 2024–2025 du référentiel accepté',
  };
  const body = `<section class="card"><h2>Configurer le cycle d’élevage</h2><form id="fishForm" novalidate><div class="grid">
<div class="field"><label for="species">Espèce</label><select id="species"></select></div>
<div class="field"><label for="system">Système d’élevage</label><select id="system">${options(SYSTEMS)}</select></div>
<div class="field"><label for="area">Surface ou volume</label><input id="area" type="number" min="1" step="1"><small id="areaUnit">m²</small></div>
<div class="field"><label for="density">Densité de peuplement</label><select id="density">${options(DENSITIES)}</select></div>
<div class="field"><label for="management">Niveau de gestion</label><select id="management">${options(MANAGEMENT)}</select></div>
<div class="field"><label for="target">Taille cible</label><select id="target">${options(TARGETS)}</select></div>
<div class="field"><label for="months">Durée du cycle (mois)</label><input id="months" type="number" min="1" max="24" step="1"></div>
<div class="field"><label for="cycles">Cycles par an</label><input id="cycles" type="number" min="1" max="12" step="1" value="1"></div>
<div class="field"><label for="feed">Type d’aliment</label><select id="feed">${options(FEEDS)}</select></div>
<div class="field"><label for="processing">Vente ou transformation</label><select id="processing">${options(PROCESSING)}</select></div>
<div class="field"><label for="laborDays">Jours de travail par cycle</label><input id="laborDays" type="number" min="0" step="1"></div>
<div class="field"><label for="familyLabor">Part de travail familial (%)</label><input id="familyLabor" type="number" min="0" max="100" step="5" value="0"></div>
<div class="field"><label for="infrastructure">Infrastructure existante</label><select id="infrastructure"><option value="no">Non, inclure l’installation</option><option value="yes">Oui, déjà disponible</option></select></div>
<div class="field"><label for="water">Source d’eau</label><select id="water"><option value="surface">Eau de surface ou réseau</option><option value="borehole">Forage nécessaire</option></select></div>
</div><div class="actions"><button class="action primary" type="submit">Calculer la rentabilité</button><button class="action" type="reset">Réinitialiser</button></div><p class="error" id="formError" role="alert" aria-live="assertive"></p></form></section>
<section class="card"><h2>Résultat</h2><div class="empty" id="emptyState">Aucun résultat n’est encore calculé.</div><div class="result-panel" id="resultPanel" hidden><div class="result-hero"><div class="result-value" id="profit">—</div><div id="profitLabel">Résultat par cycle</div></div><div class="result-grid"><div class="metric"><strong id="harvest">—</strong><span>Récolte</span></div><div class="metric"><strong id="cost">—</strong><span>Coût par cycle</span></div><div class="metric"><strong id="revenue">—</strong><span>Revenu brut</span></div><div class="metric"><strong id="roi">—</strong><span>ROI sur installation</span></div><div class="metric"><strong id="stocked">—</strong><span>Poissons mis en charge</span></div><div class="metric"><strong id="survival">—</strong><span>Survie</span></div></div><p id="feedSummary"></p><div class="actions"><button class="action" type="button" data-action="copy">Copier</button><button class="action" type="button" data-action="share">Partager</button><button class="action" type="button" data-action="save">Enregistrer dans ce navigateur</button><button class="action" type="button" data-action="pdf">Exporter en PDF</button><button class="action" type="button" data-action="csv">Exporter en CSV</button><button class="action" type="button" data-action="json">Exporter en JSON</button><button class="action" type="button" data-action="txt">Exporter en TXT</button></div><p class="status" id="actionStatus" role="status" aria-live="polite"></p></div></section>
<section class="card"><h2>Sources, fraîcheur et limites</h2><div class="trust-grid"><div class="trust-item"><strong>Sources</strong><span>${escapeHtml(config.sourceLabel)}</span></div><div class="trust-item"><strong>Fraîcheur</strong><span>${escapeHtml(config.dataReviewed)}; aucune donnée en direct.</span></div><div class="trust-item"><strong>Confiance</strong><span>Estimation de planification sensible à la survie, au FCR, aux prix, à l’eau et à la gestion.</span></div></div><p>Vérifiez les prix, la disponibilité des alevins, la qualité de l’eau, la température et les obligations locales.</p><p><strong>Confidentialité :</strong> aucune saisie envoyée à un serveur.</p></section>`;
  const scripts = `<script src="/data/agriculture/aquaculture-data.js"></script><script src="/engines/aquaculture-roi-engine.js"></script><script src="/assets/vendor/jspdf/jspdf.umd.min.js"></script><script>(function(){'use strict';
var cfg=window.__FR_AGRI_PAGE__,data=window.AquaData,engine=window.AquaROI,latest=null;function id(x){return document.getElementById(x)}function option(v,l){var o=document.createElement('option');o.value=v;o.textContent=l;return o}function num(v){return new Intl.NumberFormat(cfg.locale,{maximumFractionDigits:2}).format(Number(v)||0)}function money(v){return new Intl.NumberFormat(cfg.locale,{style:'currency',currency:data.COSTS[cfg.countryCode].currency,maximumFractionDigits:0}).format(Number(v)||0)}function status(m,e){id('actionStatus').textContent=m;id('actionStatus').style.color=e?'var(--agri-danger)':'var(--agri-good)'}function dl(c,t,f){var u=URL.createObjectURL(new Blob([c],{type:t})),a=document.createElement('a');a.href=u;a.download=f;document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(u)},0)}function copy(t){return navigator.clipboard.writeText(t)}function cell(v){var s=String(v==null?'':v);return /[",\\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s}
function systemDefaults(){var v=id('system').value;if(v==='tarpaulin_tank'){id('area').value=5000;id('areaUnit').textContent='litres'}else if(v==='earthen_pond'){id('area').value=500;id('areaUnit').textContent='m²'}else if(v==='cage'){id('area').value=200;id('areaUnit').textContent='m²'}else{id('area').value=100;id('areaUnit').textContent='m²'}}function speciesDefaults(){var s=data.SPECIES[id('species').value];id('months').value=s.growOutPeriod_months.typical;if(id('species').value==='trout'){id('system').value='concrete_tank';systemDefaults()}}
function init(){if(!data||!engine||!data.COSTS[cfg.countryCode])throw new Error('Moteur ou données aquacoles indisponibles.');id('species').innerHTML='';data.COSTS[cfg.countryCode].dominantSpecies.forEach(function(key){id('species').appendChild(option(key,cfg.species[key]||data.SPECIES[key].name))});id('density').value='medium';id('management').value='average';id('target').value='typical';id('feed').value='local_float';id('system').value='earthen_pond';id('laborDays').value=data.COSTS[cfg.countryCode].labor_days_cycle;systemDefaults();speciesDefaults()}
function input(){return {countryCode:cfg.countryCode,speciesId:id('species').value,system:id('system').value,pondArea:Number(id('area').value),densityLevel:id('density').value,managementLevel:id('management').value,targetSizeLevel:id('target').value,growPeriodMonths:Number(id('months').value),cyclesPerYear:Number(id('cycles').value),feedType:id('feed').value,processingLevel:id('processing').value,sellingMethod:'fresh',hasExistingInfra:id('infrastructure').value==='yes',needsBorehole:id('water').value==='borehole',familyLaborPct:Number(id('familyLabor').value),laborDays:Number(id('laborDays').value)}}function fr(){if(!latest)return null;var r=latest.result;return {espece:cfg.species[latest.input.speciesId],systeme:cfg.systems[latest.input.system],surfaceOuVolume:latest.input.pondArea,poissonsMisEnCharge:r.fishStocked,poissonsRecoltes:r.fishHarvested,recolteKg:r.harvestKg,alimentKg:r.feedKg,coutCycle:r.totalCostPerCycle,revenuBrut:r.revenue,resultatCycle:r.profitPerCycle,resultatAnnuel:r.annualProfit,roiPct:r.roiPct,devise:data.COSTS[cfg.countryCode].currency}}function object(){return latest?{schemaVersion:1,outil:'rentabilite-pisciculture',langue:'fr',pays:{code:cfg.countryCode,nom:cfg.countryName},entrees:latest.input,resultat:fr(),sources:{libelle:cfg.sourceLabel,fraicheur:cfg.dataReviewed,donneesEnDirect:false},confidentialite:'Calcul local; aucune saisie envoyée.'}:null}function text(){var r=fr();if(!r)return '';return ['AfroTools — rentabilité piscicole',cfg.countryName,'Espèce : '+r.espece,'Système : '+r.systeme,'Récolte : '+num(r.recolteKg)+' kg','Coût par cycle : '+money(r.coutCycle),'Revenu brut : '+money(r.revenuBrut),'Résultat par cycle : '+money(r.resultatCycle),'Résultat annuel : '+money(r.resultatAnnuel),'ROI : '+(r.roiPct==null?'Non calculable':num(r.roiPct)+' %'),'','Sources : '+cfg.sourceLabel,'Fraîcheur : '+cfg.dataReviewed+'; aucune donnée en direct.','Limites : vérifier survie, FCR, prix, eau, température et obligations locales.','Confidentialité : calcul local.'].join('\\n')}
function calculate(){id('formError').textContent='';var i=input();if(!Number.isFinite(i.pondArea)||i.pondArea<1){id('formError').textContent='Saisissez une surface ou un volume valide d’au moins 1.';id('area').focus();return null}if(!Number.isFinite(i.growPeriodMonths)||i.growPeriodMonths<1){id('formError').textContent='Saisissez une durée de cycle valide.';id('months').focus();return null}var r=engine.calculate(i);if(r.error){id('formError').textContent='Le calcul de rentabilité a échoué : '+r.error;return null}latest={input:i,result:r};window.__FR_AGRI_TEST__.latest=latest;id('emptyState').hidden=true;id('resultPanel').hidden=false;id('profit').textContent=money(r.profitPerCycle);id('profitLabel').textContent=r.isProfit?'Bénéfice par cycle':'Perte par cycle';id('harvest').textContent=num(r.harvestKg)+' kg';id('cost').textContent=money(r.totalCostPerCycle);id('revenue').textContent=money(r.revenue);id('roi').textContent=r.roiPct==null?'Non calculable':num(r.roiPct)+' %';id('stocked').textContent=num(r.fishStocked);id('survival').textContent=r.survivalPct+' %';id('feedSummary').textContent='Aliment par cycle : '+num(r.feedKg)+' kg ('+num(r.feedBags)+' sacs de 25 kg), au prix maintenu de '+money(r.feedPricePerKg)+'/kg.';status('Rentabilité calculée localement.');return r}
id('species').addEventListener('change',speciesDefaults);id('system').addEventListener('change',systemDefaults);id('fishForm').addEventListener('submit',function(e){e.preventDefault();calculate()});id('fishForm').addEventListener('reset',function(){setTimeout(function(){latest=null;window.__FR_AGRI_TEST__.latest=null;id('resultPanel').hidden=true;id('emptyState').hidden=false;init()},0)});document.addEventListener('click',function(e){var b=e.target.closest('[data-action]');if(!b)return;if(!latest)return status('Lancez d’abord un calcul.',true);var a=b.dataset.action,o=object(),t=text(),slug='afrotools-pisciculture-'+cfg.countryCode.toLowerCase();if(a==='copy')copy(t);if(a==='share')copy(location.href+'\\n\\n'+t);if(a==='save')localStorage.setItem('afrotools:fr-agriculture:fish-farming:'+cfg.countryCode,JSON.stringify(o));if(a==='txt')dl('\\ufeff'+t,'text/plain;charset=utf-8',slug+'.txt');if(a==='json')dl(JSON.stringify(o,null,2),'application/json;charset=utf-8',slug+'.json');if(a==='csv'){var r=fr(),x=[['pays','code_pays','espece','systeme','recolte_kg','cout_cycle','revenu_brut','resultat_cycle','roi_pct','devise','donnees_en_direct'],[cfg.countryName,cfg.countryCode,r.espece,r.systeme,r.recolteKg,r.coutCycle,r.revenuBrut,r.resultatCycle,r.roiPct,r.devise,'non']];dl('\\ufeff'+x.map(function(row){return row.map(cell).join(',')}).join('\\r\\n'),'text/csv;charset=utf-8',slug+'.csv')}if(a==='pdf'){var J=window.jspdf&&window.jspdf.jsPDF;if(!J)return;var d=new J({unit:'pt',format:'a4'});d.text(d.splitTextToSize(t.normalize('NFD').replace(/[\\u0300-\\u036f]/g,''),500),48,58);d.save(slug+'.pdf')}});window.__FR_AGRI_TEST__={calculate:calculate,latest:null,engine:engine,data:data,reportObject:object};try{init()}catch(e){id('formError').textContent=e.message;console.error(e)}})();</script>`;
  return renderFrenchAgriculturePage({
    row,
    title: `Rentabilité de la pisciculture — ${row.country.frenchName} | AfroTools`,
    description: `Estimez coûts, récolte, revenu et rentabilité d’un cycle piscicole en ${row.country.frenchName}.`,
    heading: `Rentabilité piscicole — ${row.country.frenchName}`,
    lead: 'Utilisez les espèces dominantes, prix, devises et coûts du référentiel pays accepté.',
    artwork: row.artwork.file,
    body,
    scripts,
    pageConfig: config,
    familyLabel: 'Pisciculture',
    familyRoute: '/fr/agriculture/fish-farming/',
  });
}

module.exports = {
  id: 'fish-farming',
  SPECIES,
  SYSTEMS,
  DENSITIES,
  MANAGEMENT,
  TARGETS,
  FEEDS,
  PROCESSING,
  renderHub,
  render,
};
