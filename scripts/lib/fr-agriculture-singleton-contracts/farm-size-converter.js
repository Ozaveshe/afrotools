'use strict';

const { renderFrenchAgriculturePage, escapeHtml } = require('../fr-agriculture-page-shell');
const data = require('../../../data/agriculture/farm-size-data.json');

const UNIT_LABELS = Object.freeze({
  hectare:'Hectare (ha)',acre:'Acre',sqm:'Mètre carré (m²)',sqkm:'Kilomètre carré (km²)',sqft:'Pied carré (ft²)',
  plot_ng_standard:'Parcelle — standard Nigeria (648 m²)',plot_ng_450:'Parcelle — Nigeria 450 m²',
  plot_ng_460:'Parcelle — Nigeria FCT/Abuja (460 m²)',plot_ng_930:'Parcelle — Nigeria 930 m² (demi-acre)',
  feddan:'Feddan (Égypte / Soudan)',kirat:'Kirat (Égypte)',sahm:'Sahm (Égypte)',qasaba:'Qasaba carrée (Égypte)',
  morgen:'Morgen (Afrique du Sud / Namibie)',timad:'Timad (Éthiopie)',tseri:'Tseri (Éthiopie / Érythrée)',
  gasha:'Gasha / Gasga (Éthiopie)',kert:'Kert (Éthiopie)',arpent:'Arpent (Maurice / Seychelles)',
  perche_sq:'Perche carrée (Maurice)',rope_gh:'Rope (Ghana — 100 ft)',polo_gh:'Polo (Ghana)',are:'Are',
  corde_sn:'Corde (Sénégal)',football_pitch:'Terrain de football (FIFA)',tennis_court:'Court de tennis',
  basketball_court:'Terrain de basket-ball',
});
const CATEGORY_LABELS = Object.freeze({
  international:'Unités internationales',nigeria:'Nigeria',egypt_sudan:'Égypte et Soudan',
  southern_africa:'Afrique australe',ethiopia:'Éthiopie et Érythrée',islands:'Maurice et îles',
  ghana:'Ghana',francophone:'Afrique francophone',reference:'Repères visuels',
});
const NOTES = Object.freeze({
  plot_ng_standard:'60 ft × 120 ft, soit environ 18 m × 36 m. Format courant à Lagos, Ogun et Oyo.',
  plot_ng_450:'15 m × 30 m. Format rencontré notamment à Abuja, Kaduna et Enugu.',
  plot_ng_460:'Parcelle de référence AGIS dans le Territoire de la capitale fédérale, Abuja.',
  plot_ng_930:'Désignée localement comme un demi-acre dans certaines zones du nord.',
  feddan:'1 feddan = 24 kirat = 0,42 ha. Unité traditionnelle en Égypte et au Soudan.',
  kirat:'1/24 de feddan, unité traditionnelle secondaire.',
  sahm:'2 kirat = 1 sahm.',qasaba:'1 qasaba linéaire vaut environ 2,7 m; sa surface carrée vaut 7,29 m².',
  morgen:'Morgen du Cap, encore rencontré en Afrique du Sud, Namibie et Zimbabwe; environ 2,1 acres.',
  timad:'Environ 0,25 ha. Unité d’Amhara et du Tigré liée à la surface labourée par une paire de bœufs en une journée.',
  tseri:'Environ 0,25 ha. Unité du Tigré et de l’Érythrée, proche du timad.',
  gasha:'Environ 40 ha. Ancienne grande unité de concession foncière.',
  kert:'Environ 1/16 d’hectare, rencontré dans certaines régions éthiopiennes.',
  arpent:'Unité d’origine française, encore utilisée pour les terres sucrières à Maurice et aux Seychelles.',
  perche_sq:'1/100 d’arpent.',rope_gh:'100 ft × 100 ft. Unité informelle de transactions foncières.',
  polo_gh:'25 m × 25 m. Unité rencontrée dans des régions cacaoyères.',
  are:'100 m². Unité utilisée dans plusieurs pays d’Afrique francophone.',
  corde_sn:'Unité sénégalaise traditionnelle d’environ 0,25 ha; la valeur peut varier selon la région.',
  football_pitch:'105 m × 68 m = 7 140 m², soit environ 0,71 ha. Repère visuel seulement.',
  tennis_court:'23,77 m × 10,97 m, soit environ 260 m².',basketball_court:'28 m × 15 m = 420 m².',
});

function options() {
  return data.categoryOrder.map(category => {
    const rows = Object.entries(data.units)
      .filter(([, unit]) => unit.category === category)
      .map(([key]) => `<option value="${escapeHtml(key)}">${escapeHtml(UNIT_LABELS[key])}</option>`)
      .join('');
    return `<optgroup label="${escapeHtml(CATEGORY_LABELS[category])}">${rows}</optgroup>`;
  }).join('');
}

function render(row) {
  const pageConfig = {
    id: row.english.id,
    locale: 'fr',
    unitLabels: UNIT_LABELS,
    categoryLabels: CATEGORY_LABELS,
    notes: NOTES,
  };
  const unitOptions = options();
  const body = `<style>.conversion-mobile{display:none;gap:10px}.conversion-mobile-row{border:1px solid var(--agri-border);border-radius:10px;padding:14px;min-width:0}.conversion-mobile-row strong,.conversion-mobile-row span{display:block;overflow-wrap:anywhere}.conversion-mobile-row span{color:var(--agri-muted);margin-top:5px}@media(max-width:480px){.conversion-table-wrap{display:none}.conversion-mobile{display:grid}}</style>
<section class="card"><h2>Convertir une surface agricole</h2><form id="farmSizeForm" novalidate><div class="grid">
<div class="field"><label for="amount">Surface</label><input id="amount" type="number" min="0" step="any" inputmode="decimal" value="1"><small>La valeur doit être positive ou nulle.</small></div>
<div class="field"><label for="fromUnit">Unité de départ</label><select id="fromUnit">${unitOptions}</select><small id="fromNote"></small></div>
<div class="field"><label for="toUnit">Unité d’arrivée</label><select id="toUnit">${unitOptions}</select><small id="toNote"></small></div></div>
<div class="actions"><button class="action primary" type="submit">Convertir</button><button class="action" id="swap" type="button">Inverser les unités</button><button class="action" type="reset">Réinitialiser</button></div><p class="error" id="error" role="alert" aria-live="assertive"></p></form></section>
<section class="card"><h2>Résultat</h2><div class="empty" id="empty">Aucune conversion calculée.</div><div id="resultPanel" class="result-panel" hidden>
<div class="result-hero"><p id="equation"></p><div class="result-value" id="resultValue"></div><p id="resultUnit"></p><p id="context"></p></div>
<div id="unitContext" class="trust-item" hidden></div><h3>Repères équivalents</h3><div class="result-grid" id="references"></div>
<h3>Table complète des conversions</h3><div class="table-wrap conversion-table-wrap"><table class="data-table"><thead><tr><th>Unité</th><th>Valeur</th><th>Région</th></tr></thead><tbody id="conversionTable"></tbody></table></div><div id="conversionMobile" class="conversion-mobile" aria-label="Conversions par unité"></div>
<div class="actions"><button class="action" type="button" data-action="copy">Copier</button><button class="action" type="button" data-action="share">Partager</button><button class="action" type="button" data-action="save">Enregistrer dans ce navigateur</button><button class="action" type="button" data-action="pdf">Exporter en PDF</button><button class="action" type="button" data-action="csv">Exporter en CSV</button><button class="action" type="button" data-action="json">Exporter en JSON</button><button class="action" type="button" data-action="txt">Exporter en TXT</button></div><p class="status" id="status" role="status" aria-live="polite"></p></div></section>
<section class="card"><h2>Sources, fraîcheur et limites</h2><div class="trust-grid"><div class="trust-item"><strong>Source des facteurs</strong><span>Catalogue statique extrait de l’application anglaise acceptée; conversion par le mètre carré.</span></div><div class="trust-item"><strong>Fraîcheur</strong><span>Facteurs de référence statiques; aucune donnée en direct ni registre foncier interrogé.</span></div><div class="trust-item"><strong>Confiance</strong><span>Conversion arithmétique exacte pour le facteur choisi; identité et dimensions locales à confirmer.</span></div></div>
<p>Les noms « parcelle », corde, timad et autres unités traditionnelles peuvent varier selon la région, l’usage ou le document foncier. Confirmez les dimensions auprès d’un géomètre, du cadastre ou du vendeur avant une transaction.</p><p><strong>Confidentialité :</strong> calcul local; aucune saisie envoyée à un serveur.</p></section>`;
  const scripts = `<script src="/data/agriculture/farm-size-data.js"></script><script src="/engines/farm-size-engine.js"></script><script src="/assets/vendor/jspdf/jspdf.umd.min.js"></script>
<script>(function(){'use strict';var cfg=window.__FR_AGRI_PAGE__,data=window.AfroTools.FarmSizeData,engine=window.AfroTools.FarmSizeEngine,latest=null;
function id(value){return document.getElementById(value)}function number(value){if(value===0)return'0';if(value>=1000000)return value.toLocaleString('fr-FR',{maximumFractionDigits:2});if(value>=1000)return value.toLocaleString('fr-FR',{maximumFractionDigits:3});if(value>=1)return value.toLocaleString('fr-FR',{maximumFractionDigits:4});if(value>=.01)return value.toLocaleString('fr-FR',{maximumFractionDigits:5});return value.toExponential(4).replace('.',',')}function metric(label,value){var box=document.createElement('div'),strong=document.createElement('strong'),span=document.createElement('span');box.className='metric';strong.textContent=value;span.textContent=label;box.append(strong,span);return box}function cell(value){var text=String(value==null?'':value);return /[",\\n]/.test(text)?'"'+text.replace(/"/g,'""')+'"':text}function download(content,type,name){var url=URL.createObjectURL(new Blob([content],{type:type})),link=document.createElement('a');link.href=url;link.download=name;document.body.appendChild(link);link.click();link.remove();setTimeout(function(){URL.revokeObjectURL(url)},0)}function setStatus(value,error){id('status').textContent=value;id('status').style.color=error?'var(--agri-danger)':'var(--agri-good)'}
function note(key){return cfg.notes[key]||''}function syncNotes(){id('fromNote').textContent=note(id('fromUnit').value);id('toNote').textContent=note(id('toUnit').value)}function context(value){var c=value.context;if(c.code==='smaller-than-tennis')return'Environ '+number(c.squareMetres)+' m² — plus petit qu’un court de tennis';if(c.code==='pitch-percent')return'Environ '+number(c.percent)+' % d’un terrain de football';if(c.code==='pitch-about')return'Environ '+number(c.pitches)+' terrain de football';if(c.code==='pitches')return number(c.pitches)+' terrains de football';return number(c.pitches)+' terrains de football ('+number(c.squareKilometres)+' km²)'}
function render(){id('equation').textContent=number(latest.input.amount)+' '+cfg.unitLabels[latest.input.fromKey]+' équivaut à';id('resultValue').textContent=number(latest.result);id('resultUnit').textContent=cfg.unitLabels[latest.input.toKey];id('context').textContent='≈ '+context(latest);var local=note(latest.input.fromKey);id('unitContext').hidden=!local;id('unitContext').textContent=local?'À propos de cette unité : '+local:'';id('references').replaceChildren();latest.keyReferences.forEach(function(item){id('references').appendChild(metric(cfg.unitLabels[item.key],number(item.value)+' '+item.unit.abbr))});id('conversionTable').replaceChildren();id('conversionMobile').replaceChildren();latest.table.forEach(function(item){var label=cfg.unitLabels[item.key],value=number(item.value)+' '+item.unit.abbr,region=cfg.categoryLabels[item.category],tr=document.createElement('tr');[label,value,region].forEach(function(text){var td=document.createElement('td');td.textContent=text;tr.appendChild(td)});id('conversionTable').appendChild(tr);var article=document.createElement('article'),heading=document.createElement('strong'),amount=document.createElement('span'),area=document.createElement('span');article.className='conversion-mobile-row';heading.textContent=label;amount.textContent=value;area.textContent=region;article.append(heading,amount,area);id('conversionMobile').appendChild(article)})}
function calculate(){id('error').textContent='';latest=engine.calculate({amount:Number(id('amount').value),fromKey:id('fromUnit').value,toKey:id('toUnit').value},data);if(!latest.ok){id('error').textContent='Saisissez une surface positive ou nulle et choisissez deux unités valides.';id('amount').focus();return null}window.__FR_AGRI_TEST__.latest=latest;render();id('empty').hidden=true;id('resultPanel').hidden=false;setStatus('Conversion calculée localement.');return latest}function report(){if(!latest)return null;return{schemaVersion:1,outil:'convertisseur-surface-agricole',langue:'fr',entrees:latest.input,resultat:{metresCarres:latest.squareMetres,valeur:latest.result,unite:latest.input.toKey,contexte:latest.context},conversions:latest.table.map(function(item){return{unite:item.key,valeur:item.value}}),sources:{donnees:'data/agriculture/farm-size-data.json',moteur:'engines/src/farm-size-engine.js',donneesEnDirect:false},limitations:['La valeur locale d’une unité traditionnelle peut varier; confirmer les dimensions.'],confidentialite:'Calcul local; aucune saisie envoyée.'}}function text(){if(!latest)return'';return['AfroTools — Convertisseur de surface agricole',number(latest.input.amount)+' '+cfg.unitLabels[latest.input.fromKey]+' = '+number(latest.result)+' '+cfg.unitLabels[latest.input.toKey],context(latest),'','Facteurs statiques; aucune donnée en direct.','Confirmez les dimensions des unités locales avant une transaction.','Confidentialité : calcul local.'].join('\\n')}
id('fromUnit').value='hectare';id('toUnit').value='acre';syncNotes();id('fromUnit').addEventListener('change',syncNotes);id('toUnit').addEventListener('change',syncNotes);id('farmSizeForm').addEventListener('submit',function(event){event.preventDefault();calculate()});id('swap').addEventListener('click',function(){var from=id('fromUnit'),to=id('toUnit'),tmp=from.value;from.value=to.value;to.value=tmp;syncNotes();calculate()});id('farmSizeForm').addEventListener('reset',function(){setTimeout(function(){id('fromUnit').value='hectare';id('toUnit').value='acre';syncNotes();latest=null;window.__FR_AGRI_TEST__.latest=null;id('empty').hidden=false;id('resultPanel').hidden=true;id('error').textContent='';setStatus('')},0)});
document.addEventListener('click',function(event){var button=event.target.closest('[data-action]');if(!button)return;if(!latest)return setStatus('Effectuez d’abord une conversion.',true);var action=button.dataset.action,value=report(),summary=text(),slug='afrotools-convertisseur-surface';if(action==='copy')navigator.clipboard.writeText(summary);if(action==='share')navigator.clipboard.writeText(location.href+'\\n\\n'+summary);if(action==='save')localStorage.setItem('afrotools:fr-agriculture:farm-size',JSON.stringify(value));if(action==='txt')download('\\ufeff'+summary,'text/plain;charset=utf-8',slug+'.txt');if(action==='json')download(JSON.stringify(value,null,2),'application/json;charset=utf-8',slug+'.json');if(action==='csv'){var rows=[['unite','valeur']].concat(value.conversions.map(function(item){return[item.unite,item.valeur]}));download('\\ufeff'+rows.map(function(row){return row.map(cell).join(',')}).join('\\r\\n'),'text/csv;charset=utf-8',slug+'.csv')}if(action==='pdf'){var Pdf=window.jspdf&&window.jspdf.jsPDF;if(!Pdf)return setStatus('Export PDF indisponible.',true);var pdf=new Pdf({unit:'pt',format:'a4'});pdf.text(pdf.splitTextToSize(summary.normalize('NFD').replace(/[\\u0300-\\u036f]/g,''),500),48,58);pdf.save(slug+'.pdf')}setStatus(action==='save'?'Conversion enregistrée dans ce navigateur.':'Action terminée.')});window.__FR_AGRI_TEST__={latest:null,engine:engine,data:data,calculate:calculate,reportObject:report};calculate()})();</script>`;
  return renderFrenchAgriculturePage({
    row,
    title: 'Convertisseur de surface agricole africaine | AfroTools',
    description: 'Convertissez hectares, acres, mètres carrés et unités foncières africaines avec facteurs, limites et exports locaux.',
    heading: 'Convertisseur de surface agricole',
    lead: 'Passez des hectares et acres aux feddan, parcelles nigérianes, morgen, timad, arpent et autres unités sans envoyer vos données.',
    artwork: row.artwork.file,
    body,
    scripts,
    pageConfig,
    familyLabel: 'Surface agricole',
    familyRoute: row.french.routeKey,
  });
}

module.exports = { UNIT_LABELS, CATEGORY_LABELS, NOTES, render };
