'use strict';

const { renderFrenchAgriculturePage } = require('../fr-agriculture-page-shell');

const REGION_LABELS = Object.freeze({
  west_africa: { name: 'Afrique de l’Ouest', count: 16 },
  east_africa: { name: 'Afrique de l’Est', count: 10 },
  central_africa: { name: 'Afrique centrale', count: 8 },
  southern_africa: { name: 'Afrique australe', count: 10 },
  north_africa: { name: 'Afrique du Nord', count: 6 },
  island_nations: { name: 'États insulaires', count: 4 },
});
const REGION_ORDER = Object.freeze(Object.keys(REGION_LABELS));
const CROP_LABELS = Object.freeze({
  avocado: 'avocat', banana: 'banane', barley: 'orge', cashew: 'noix de cajou',
  cassava: 'manioc', chickpea: 'pois chiche', citrus: 'agrumes', clove: 'girofle',
  cocoa: 'cacao', coconut: 'noix de coco', coffee_arabica: 'café arabica',
  coffee_robusta: 'café robusta', common_bean: 'haricot commun', cotton: 'coton',
  cowpea: 'niébé', dates: 'dattes', enset: 'ensète', fonio: 'fonio', grape: 'raisin',
  groundnut: 'arachide', lentils: 'lentilles', maize: 'maïs', mango: 'mangue',
  millet: 'mil', oil_palm: 'palmier à huile', olive: 'olive', onion: 'oignon',
  pigeon_pea: 'pois d’Angole', pineapple: 'ananas', plantain: 'banane plantain',
  potato: 'pomme de terre', rice: 'riz', rubber: 'hévéa', sesame: 'sésame',
  sisal: 'sisal', sorghum: 'sorgho', soybean: 'soja', sugar_cane: 'canne à sucre',
  sunflower: 'tournesol', sweet_potato: 'patate douce', tea: 'thé', teff: 'teff',
  tobacco: 'tabac', tomato: 'tomate', vanilla: 'vanille', wheat: 'blé', yam: 'igname',
});

function render(row, context) {
  const countryNames = Object.fromEntries(context.countries.map(country => [
    country.id,
    country.fr,
  ]));
  const pageConfig = {
    id: row.english.id,
    countryNames,
    cropLabels: CROP_LABELS,
    regionLabels: REGION_LABELS,
    regionOrder: REGION_ORDER,
  };
  const body = `<style>@media(max-width:360px){.export-docs-trust{grid-template-columns:minmax(0,1fr)}.export-docs-trust>*{min-width:0;overflow-wrap:anywhere}}</style><section class="card"><h2>Répertoire de planification par pays</h2>
<p>Recherchez un pays ou une culture, puis sélectionnez une ligne. Ce répertoire reprend uniquement l’identité, la région et les cultures de référence du propriétaire de données anglais accepté.</p>
<div class="grid"><div class="field"><label for="search">Rechercher un pays, un code ou une culture</label><input id="search" type="search" autocomplete="off" placeholder="Ex. Sénégal, maïs, SN" aria-describedby="matchStatus"><small id="matchStatus" role="status" aria-live="polite">54 pays disponibles.</small></div>
<div class="field"><label for="country">Pays à préparer</label><select id="country"><option value="">Choisir un pays</option></select><small>La sélection ne valide aucune exigence documentaire.</small></div></div>
<div id="directory" class="country-list" aria-label="Pays correspondant à la recherche"></div>
<div class="actions"><button class="action" id="reset" type="button">Réinitialiser</button></div></section>
<section class="card"><h2>Fiche de préparation</h2><div class="empty" id="empty">Sélectionnez un pays pour afficher sa fiche de référence.</div><div id="resultPanel" class="result-panel" hidden>
<div class="result-hero"><div class="result-value" id="countryName"></div><p id="countryLead"></p></div>
<div class="result-grid"><div class="metric"><strong id="countryCode"></strong><span>Code pays</span></div><div class="metric"><strong id="regionName"></strong><span>Région source</span></div><div class="metric"><strong id="cropCount"></strong><span>Cultures de référence</span></div></div>
<h3>Cultures associées dans le registre</h3><ul id="cropList" class="country-list"></ul>
<h3>Étapes de vérification à organiser</h3><ol><li>Confirmer la marchandise, le code tarifaire, la quantité et la destination avec les parties concernées.</li><li>Demander aux autorités et prestataires compétents la liste actuelle des documents, délais, coûts et périodes de validité.</li><li>Vérifier les exigences du pays de destination et du transporteur avant l’expédition.</li><li>Conserver les versions, références et dates des justificatifs confirmés.</li></ol>
<div class="actions"><button class="action" type="button" data-action="copy">Copier</button><button class="action" type="button" data-action="share">Partager</button><button class="action" type="button" data-action="save">Enregistrer dans ce navigateur</button><button class="action" type="button" data-action="pdf">Exporter en PDF</button><button class="action" type="button" data-action="csv">Exporter en CSV</button><button class="action" type="button" data-action="json">Exporter en JSON</button><button class="action" type="button" data-action="txt">Exporter en TXT</button></div><p class="status" id="status" role="status" aria-live="polite"></p></div></section>
<section class="card"><h2>Sources, fraîcheur et limites</h2><div class="trust-grid export-docs-trust"><div class="trust-item"><strong>Propriétaire</strong><span>data/agriculture/country-index.js : identité, région et cultures associées.</span></div><div class="trust-item"><strong>Fraîcheur</strong><span>Registre statique non daté; aucune vérification réglementaire en direct.</span></div><div class="trust-item"><strong>Confiance</strong><span>Répertoire de préparation, pas une liste officielle ou exhaustive de documents.</span></div></div><p>Les 54 pages pays anglaises et leurs équivalents français existants ne font pas partie de la ligne manifeste acceptée ici. Cette surface ne prétend donc pas traduire, vérifier ou valider leurs exigences. Consultez des sources officielles actuelles avant toute expédition.</p><p><strong>Confidentialité :</strong> recherche, sélection et exports restent dans votre navigateur; aucune saisie n’est envoyée à un serveur.</p></section>`;
  const scripts = `<script src="/data/agriculture/country-index.js"></script><script src="/engines/export-docs-directory-engine.js"></script><script src="/assets/vendor/jspdf/jspdf.umd.min.js"></script><script>(function(){'use strict';var cfg=window.__FR_AGRI_PAGE__,engine=window.AfroTools.ExportDocsDirectoryEngine,raw=window.AfroTools.countryIndex,localized=raw.map(function(row){return Object.assign({},row,{name:cfg.countryNames[row.code]||row.name})}),directory=engine.buildDirectory(localized,cfg.regionLabels,cfg.regionOrder),latest=null;
if(!directory.ok)throw new Error('Répertoire Export Documents invalide : '+directory.status);function id(v){return document.getElementById(v)}function crop(v){return cfg.cropLabels[v]||v.replace(/_/g,' ')}function cell(v){var t=String(v==null?'':v);return/[",\\n]/.test(t)?'"'+t.replace(/"/g,'""')+'"':t}function dl(c,t,n){var u=URL.createObjectURL(new Blob([c],{type:t})),a=document.createElement('a');a.href=u;a.download=n;document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(u)},0)}function status(v,e){id('status').textContent=v;id('status').style.color=e?'var(--agri-danger)':'var(--agri-good)'}
function renderOptions(){directory.rows.forEach(function(row){var option=document.createElement('option');option.value=row.code;option.textContent=row.name+' ('+row.code+')';id('country').appendChild(option)})}function choose(code){var result=engine.select(directory,code);if(!result.ok){latest=null;id('empty').hidden=false;id('resultPanel').hidden=true;return}latest=result.country;window.__FR_AGRI_TEST__.latest=latest;id('country').value=latest.code;id('countryName').textContent=latest.flag+' '+latest.name;id('countryLead').textContent='Référence de planification issue du registre accepté; exigences documentaires à confirmer.';id('countryCode').textContent=latest.code;id('regionName').textContent=cfg.regionLabels[latest.region].name;id('cropCount').textContent=String(latest.topCrops.length);id('cropList').replaceChildren();latest.topCrops.forEach(function(value){var li=document.createElement('li');li.textContent=crop(value);id('cropList').appendChild(li)});id('empty').hidden=true;id('resultPanel').hidden=false;status('Fiche chargée localement.')}
function renderMatches(query){var result=engine.search(directory,query),node=id('directory');node.replaceChildren();result.rows.forEach(function(row){var button=document.createElement('button');button.type='button';button.className='action';button.dataset.code=row.code;button.textContent=row.flag+' '+row.name+' · '+row.code;node.appendChild(button)});id('matchStatus').textContent=result.count+' pays correspondant'+(result.count>1?'s':'')+'.';return result}function report(){return latest?{schemaVersion:1,outil:'export-docs',langue:'fr',pays:{code:latest.code,nom:latest.name,region:latest.region,regionNom:cfg.regionLabels[latest.region].name,cultures:latest.topCrops.map(function(value){return{id:value,libelle:crop(value)}})},sources:{donnees:'data/agriculture/country-index.js',moteur:'engines/src/export-docs-directory-engine.js',donneesEnDirect:false},limitations:['Répertoire de préparation non officiel et non exhaustif.','Les exigences documentaires, délais, coûts et validités ne sont pas vérifiés ici.'],confidentialite:'Traitement local; aucune saisie envoyée.'}:null}function text(){return latest?['AfroTools — Préparation des documents d’exportation',latest.name+' ('+latest.code+')','Région : '+cfg.regionLabels[latest.region].name,'Cultures du registre : '+latest.topCrops.map(crop).join(', '),'','Étapes : confirmer la marchandise et la destination; demander la liste actuelle aux autorités; vérifier les exigences de destination et du transporteur; conserver les références et dates.','','Limite : répertoire de préparation non officiel et non exhaustif; exigences à confirmer.','Confidentialité : traitement local.'].join('\\n'):''}
id('search').addEventListener('input',function(){renderMatches(this.value)});id('directory').addEventListener('click',function(e){var button=e.target.closest('[data-code]');if(button)choose(button.dataset.code)});id('country').addEventListener('change',function(){choose(this.value)});id('reset').addEventListener('click',function(){id('search').value='';id('country').value='';latest=null;window.__FR_AGRI_TEST__.latest=null;id('empty').hidden=false;id('resultPanel').hidden=true;status('');renderMatches('');id('search').focus()});document.addEventListener('click',function(e){var button=e.target.closest('[data-action]');if(!button)return;if(!latest)return status('Sélectionnez d’abord un pays.',true);var action=button.dataset.action,value=report(),content=text(),slug='afrotools-documents-export-'+latest.code.toLowerCase();if(action==='copy')navigator.clipboard.writeText(content);if(action==='share')navigator.clipboard.writeText(location.href+'\\n\\n'+content);if(action==='save')localStorage.setItem('afrotools:fr-agriculture:export-docs',JSON.stringify(value));if(action==='txt')dl('\\ufeff'+content,'text/plain;charset=utf-8',slug+'.txt');if(action==='json')dl(JSON.stringify(value,null,2),'application/json;charset=utf-8',slug+'.json');if(action==='csv'){var rows=[['champ','valeur'],['code_pays',latest.code],['pays',latest.name],['region',cfg.regionLabels[latest.region].name],['cultures',latest.topCrops.map(crop).join('; ')],['donnees_en_direct','false']];dl('\\ufeff'+rows.map(function(row){return row.map(cell).join(',')}).join('\\r\\n'),'text/csv;charset=utf-8',slug+'.csv')}if(action==='pdf'){var Pdf=window.jspdf&&window.jspdf.jsPDF;if(!Pdf)return status('Export PDF indisponible.',true);var pdf=new Pdf({unit:'pt',format:'a4'});pdf.text(pdf.splitTextToSize(content.normalize('NFD').replace(/[\\u0300-\\u036f]/g,''),500),48,58);pdf.save(slug+'.pdf')}status(action==='save'?'Fiche enregistrée dans ce navigateur.':'Action terminée.')});window.__FR_AGRI_TEST__={latest:null,engine:engine,directory:directory,select:choose,search:renderMatches,reportObject:report};renderOptions();renderMatches('')})();</script>`;
  return renderFrenchAgriculturePage({
    row,
    title: 'Documents d’exportation agricole — répertoire de préparation | AfroTools',
    description: 'Explorez les 54 pays du registre agricole et exportez une fiche locale de préparation sans prétendre valider des exigences officielles.',
    heading: 'Préparer les documents d’exportation agricole',
    lead: 'Un répertoire local de 54 pays pour organiser vos vérifications, sans liste réglementaire inventée ni donnée présentée comme actuelle.',
    artwork: row.artwork.file,
    body,
    scripts,
    pageConfig,
    familyLabel: 'Documents d’exportation',
    familyRoute: row.french.routeKey,
  });
}

module.exports = { REGION_LABELS, REGION_ORDER, CROP_LABELS, render };
