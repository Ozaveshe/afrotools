'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { renderFrenchAgriculturePage, escapeHtml } = require('../fr-agriculture-page-shell');
const ROOT = path.resolve(__dirname, '../../..');

function loadCountries() {
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'data/agriculture/country-index.js'), 'utf8'), context);
  const display = new Intl.DisplayNames(['fr'], { type: 'region' });
  return context.window.AfroTools.countryIndex.map(country => ({
    code: country.code,
    name: display.of(country.code) || country.name,
    region: country.region,
  }));
}
const COUNTRIES = Object.freeze(loadCountries());
const CROPS = Object.freeze({
  maize:'Maïs',rice:'Riz',sorghum:'Sorgho',millet:'Mil',wheat:'Blé',teff:'Teff',barley:'Orge',fonio:'Fonio',
  cowpea:'Niébé',groundnut:'Arachide',soybean:'Soja',common_bean:'Haricot commun',pigeon_pea:'Pois d’Angole',
  chickpea:'Pois chiche',lentils:'Lentilles',bambara_groundnut:'Voandzou',cassava:'Manioc',yam:'Igname',
  sweet_potato:'Patate douce',potato:'Pomme de terre',tomato:'Tomate',onion:'Oignon',pepper:'Piment',
  cabbage:'Chou',cotton:'Coton',sesame:'Sésame',sunflower:'Tournesol',tobacco:'Tabac',sugar_cane:'Canne à sucre',
  oil_palm:'Palmier à huile',cocoa:'Cacao',coffee_arabica:'Café arabica',coffee_robusta:'Café robusta',
  plantain:'Banane plantain',banana:'Banane',cashew:'Anacarde',
});
const GOALS = Object.freeze({ maximize_yield:'Maximiser le rendement',restore_soil:'Restaurer le sol',minimize_pests:'Réduire ravageurs et maladies',maximize_profit:'Maximiser la valeur marchande' });
const SOILS = Object.freeze({ depleted:'Épuisé',average:'Moyen',good:'Bon',excellent:'Excellent' });
const GROUPS = Object.freeze({ cereal:'Céréale',legume:'Légumineuse fixatrice d’azote',root:'Racine ou tubercule',vegetable:'Légume',cash:'Culture commerciale' });
const PROVEN = Object.freeze({
  'West Africa Savanna Classic':'Rotation classique de la savane ouest-africaine',
  'Sahel Millet-Cowpea':'Rotation sahélienne mil-niébé',
  'East Africa Highland':'Rotation des hautes terres d’Afrique de l’Est',
  'Ethiopian Teff Rotation':'Rotation éthiopienne autour du teff',
  'Cotton Belt Rotation':'Rotation de la ceinture cotonnière',
  'Nigerian Middle Belt':'Rotation de la Middle Belt nigériane',
  'Southern Africa Maize-Soy':'Rotation maïs-soja d’Afrique australe',
  'Rice Paddy Rotation':'Rotation de rizière',
  'East Africa Semi-Arid':'Rotation semi-aride d’Afrique de l’Est',
  'North Africa Dryland':'Rotation pluviale d’Afrique du Nord',
  'Egypt Irrigated':'Rotation irriguée égyptienne',
});
function countryOptions() {
  return COUNTRIES.map(country => `<option value="${country.code}">${escapeHtml(country.name)}</option>`).join('');
}
function radio(name, values, checked) {
  return Object.entries(values).map(([value, label]) => `<label><input type="radio" name="${name}" value="${value}"${value === checked ? ' checked' : ''}> ${label}</label>`).join('');
}
function render(row) {
  const pageConfig = {
    id: row.english.id, locale: 'fr',
    countryNames: Object.fromEntries(COUNTRIES.map(country => [country.code, country.name])),
    crops: CROPS, goals: GOALS, soils: SOILS, groups: GROUPS, proven: PROVEN,
  };
  const body = `<style>.rotation-mobile{display:none;gap:10px}.rotation-card{border:1px solid var(--agri-border);border-radius:10px;padding:14px;min-width:0}.rotation-card strong,.rotation-card span{display:block;overflow-wrap:anywhere}.rotation-card span{color:var(--agri-muted);margin-top:5px}@media(max-width:480px){.rotation-table-wrap{display:none}.rotation-mobile{display:grid}}</style><section class="card"><h2>Contexte de la rotation</h2><form id="rotationForm" novalidate><div class="grid">
<div class="field"><label for="country">Pays</label><select id="country"><option value="">Choisissez un pays</option>${countryOptions()}</select><small>Le pays détermine les cultures courantes proposées par le référentiel.</small></div>
<div class="field"><label for="previousCrop">Culture actuelle ou précédente</label><select id="previousCrop" disabled><option value="">Choisissez d’abord un pays</option></select></div>
<fieldset class="field"><legend>Nombre de saisons</legend><div class="actions">${radio('seasons',{2:'2',3:'3',4:'4',6:'6',8:'8'},'4')}</div></fieldset>
<fieldset class="field"><legend>Objectif</legend><div class="actions">${radio('goal',GOALS,'maximize_yield')}</div></fieldset>
<fieldset class="field"><legend>État actuel du sol</legend><div class="actions">${radio('soil',SOILS,'average')}</div></fieldset>
</div><div class="actions"><button class="action primary" type="submit">Générer la rotation</button><button class="action" type="reset">Réinitialiser</button></div><p class="error" id="error" role="alert" aria-live="assertive"></p></form></section>
<section class="card"><h2>Plan de rotation</h2><div class="empty" id="empty">Aucun plan généré.</div><div id="resultPanel" class="result-panel" hidden>
<div class="result-hero"><div class="result-value" id="headline"></div><p id="lead"></p></div><div class="result-grid" id="summary"></div>
<div id="provenBox" hidden><h3>Rotation documentée pour ce contexte</h3><p id="provenText"></p></div>
<h3>Saison par saison</h3><div class="table-wrap rotation-table-wrap"><table class="data-table"><thead><tr><th>Saison</th><th>Culture</th><th>Groupe</th><th>Pourquoi</th><th>Alternatives</th></tr></thead><tbody id="sequence"></tbody></table></div><div id="sequenceMobile" class="rotation-mobile" aria-label="Rotation saison par saison"></div>
<h3>Trajectoire de santé du sol</h3><p id="soilProjection"></p><div id="warnings" role="status"></div>
<div class="actions"><button class="action" type="button" data-action="copy">Copier</button><button class="action" type="button" data-action="share">Partager</button><button class="action" type="button" data-action="save">Enregistrer dans ce navigateur</button><button class="action" type="button" data-action="pdf">Exporter en PDF</button><button class="action" type="button" data-action="csv">Exporter en CSV</button><button class="action" type="button" data-action="json">Exporter en JSON</button><button class="action" type="button" data-action="txt">Exporter en TXT</button></div><p class="status" id="status" role="status" aria-live="polite"></p></div></section>
<section class="card"><h2>Sources, fraîcheur et limites</h2><div class="trust-grid"><div class="trust-item"><strong>Moteur et données</strong><span>Même moteur de rotation et même index pays-cultures que l’application anglaise acceptée.</span></div><div class="trust-item"><strong>Fraîcheur</strong><span>Référentiel agronomique statique; aucune météo, analyse de sol, pression parasitaire ou donnée de marché en direct.</span></div><div class="trust-item"><strong>Confiance</strong><span>Point de départ de planification, à valider avec l’historique de parcelle et le conseil agronomique local.</span></div></div><p>Le score ordonne des partenaires de rotation selon famille, fixation d’azote, profondeur racinaire, objectif et état du sol. Il ne prédit pas un rendement garanti. Vérifiez calendrier, eau, variété, ravageurs, herbicides rémanents et débouchés.</p><p><strong>Confidentialité :</strong> calcul local; aucune saisie envoyée à un serveur.</p></section>`;
  const scripts = `<script src="/data/agriculture/country-index.js"></script><script src="/engines/crop-rotation-engine.js"></script><script src="/assets/vendor/jspdf/jspdf.umd.min.js"></script>
<script>(function(){'use strict';var cfg=window.__FR_AGRI_PAGE__,engine=window.AfroTools.CropRotationEngine,countries=window.AfroTools.countryIndex,latest=null;
function id(v){return document.getElementById(v)}function metric(label,value){var box=document.createElement('div'),strong=document.createElement('strong'),span=document.createElement('span');box.className='metric';strong.textContent=value;span.textContent=label;box.append(strong,span);return box}function fill(node,rows){node.replaceChildren();rows.forEach(function(row){node.appendChild(metric(row[0],row[1]))})}function cell(v){var text=String(v==null?'':v);return /[",\\n]/.test(text)?'"'+text.replace(/"/g,'""')+'"':text}function download(content,type,name){var url=URL.createObjectURL(new Blob([content],{type:type})),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(url)},0)}function status(v,e){id('status').textContent=v;id('status').style.color=e?'var(--agri-danger)':'var(--agri-good)'}function selected(name){return document.querySelector('input[name="'+name+'"]:checked').value}
function syncCrops(){var code=id('country').value,select=id('previousCrop');select.replaceChildren();if(!code){var first=document.createElement('option');first.value='';first.textContent='Choisissez d’abord un pays';select.appendChild(first);select.disabled=true;return}var country=countries.find(function(item){return item.code===code}),top=engine.getAvailableCrops(country.topCrops),topSet=new Set(top),all=engine.getAllCrops().map(function(crop){return crop.id});function group(label,items){var og=document.createElement('optgroup');og.label=label;items.forEach(function(key){var option=document.createElement('option');option.value=key;option.textContent=cfg.crops[key]||key;og.appendChild(option)});select.appendChild(og)}group('Cultures courantes en '+cfg.countryNames[code],top);group('Autres cultures du moteur',all.filter(function(key){return!topSet.has(key)}));select.disabled=false}
function input(){var code=id('country').value,country=countries.find(function(item){return item.code===code});return{countryCode:code,prevCrop:id('previousCrop').value,seasons:Number(selected('seasons')),goal:selected('goal'),soilCondition:selected('soil'),availableCrops:country?engine.getAvailableCrops(country.topCrops):[]}}
function reason(item){var crop=engine.getCropGroups()[item.crop],previous=engine.getCropGroups()[item.prevCrop],parts=[];if(item.nFixer)parts.push('Fixe environ '+item.nFixed+' kg N/ha selon le référentiel');if(crop&&previous&&crop.group!==previous.group)parts.push('Change de famille pour rompre des cycles de ravageurs et maladies');if(crop&&previous&&crop.rootDepth!==previous.rootDepth)parts.push('Alterne les profondeurs racinaires');if(!parts.length)parts.push('Partenaire classé par le moteur selon la rotation et l’objectif choisis');return parts.slice(0,2).join('. ')}
function renderResult(r,values){id('headline').textContent='+'+r.yieldBoost+' %';id('lead').textContent='Gain de rendement indicatif du moteur — '+cfg.countryNames[values.countryCode]+'.';fill(id('summary'),[['Azote fixé',r.totalNFixed+' kg/ha'],['Saisons avec légumineuse',String(r.legumeSeasonsCount)],['Cultures distinctes',String(r.summary.rotationDiversity)],['Santé du sol au départ',r.soilHealth.start+'/100'],['Santé du sol à la fin',r.soilHealth.end+'/100'],['Variation du score',(r.summary.soilHealthChange>=0?'+':'')+r.summary.soilHealthChange]]);id('provenBox').hidden=!r.provenRotation;if(r.provenRotation)id('provenText').textContent=(cfg.proven[r.provenRotation.name]||'Rotation documentée')+' : '+r.provenRotation.sequence.map(function(key){return cfg.crops[key]||key}).join(' → ')+'. Gain documenté dans le référentiel : '+r.provenRotation.yieldBoost+' %.';id('sequence').replaceChildren();id('sequenceMobile').replaceChildren();r.sequence.forEach(function(item){var cropName=cfg.crops[item.crop]||item.crop,groupName=cfg.groups[item.group]||item.group,why=reason(item),alternatives=item.alternatives.map(function(alt){return cfg.crops[alt.id]||alt.id}).join(', ')||'—',tr=document.createElement('tr'),rowValues=[item.season,cropName,groupName,why,alternatives];rowValues.forEach(function(value){var td=document.createElement('td');td.textContent=value;tr.appendChild(td)});id('sequence').appendChild(tr);var card=document.createElement('article'),heading=document.createElement('strong');card.className='rotation-card';heading.textContent='Saison '+item.season+' — '+cropName;card.appendChild(heading);[['Groupe',groupName],['Pourquoi',why],['Alternatives',alternatives]].forEach(function(entry){var line=document.createElement('span');line.textContent=entry[0]+' : '+entry[1];card.appendChild(line)});id('sequenceMobile').appendChild(card)});id('soilProjection').textContent=r.soilHealth.trajectory.join(' → ')+' sur 100.';id('warnings').textContent=r.warnings.length?r.warnings.map(function(w){return'Saison '+w.season+' : vérifier ce couple de cultures avec un agronome.'}).join(' '):'Aucun avertissement de succession déclenché par le moteur.'}
function calculate(){id('error').textContent='';var values=input();if(!values.countryCode){id('error').textContent='Choisissez un pays.';id('country').focus();return null}if(!values.prevCrop){id('error').textContent='Choisissez la culture actuelle ou précédente.';id('previousCrop').focus();return null}latest=engine.calculate(values);if(latest.error){id('error').textContent='Le moteur ne reconnaît pas cette culture.';return null}latest.__input=values;window.__FR_AGRI_TEST__.latest=latest;renderResult(latest,values);id('empty').hidden=true;id('resultPanel').hidden=false;status('Rotation générée localement.');return latest}
function report(){if(!latest)return null;return{schemaVersion:1,outil:'planificateur-rotation-cultures',langue:'fr',pays:{code:latest.__input.countryCode,nom:cfg.countryNames[latest.__input.countryCode]},entrees:latest.__input,resultat:latest,sources:{donnees:'data/agriculture/country-index.js',moteur:'engines/src/crop-rotation-engine.js',donneesEnDirect:false},limitations:['Planification statique; valider historique, sol, eau, calendrier, ravageurs, herbicides et débouchés localement.'],confidentialite:'Calcul local; aucune saisie envoyée.'}}
function text(){if(!latest)return'';return['AfroTools — Plan de rotation',cfg.countryNames[latest.__input.countryCode],'Culture précédente : '+cfg.crops[latest.prevCrop],'Objectif : '+cfg.goals[latest.summary.goal],...latest.sequence.map(function(item){return'Saison '+item.season+' : '+cfg.crops[item.crop]}),'Azote fixé : '+latest.totalNFixed+' kg/ha','Santé du sol : '+latest.soilHealth.start+' → '+latest.soilHealth.end+' /100','','Référentiel statique; aucune donnée en direct.','À valider avec un agronome et l’historique de la parcelle.','Confidentialité : calcul local.'].join('\\n')}
id('country').addEventListener('change',syncCrops);id('rotationForm').addEventListener('submit',function(e){e.preventDefault();calculate()});id('rotationForm').addEventListener('reset',function(){setTimeout(function(){syncCrops();latest=null;window.__FR_AGRI_TEST__.latest=null;id('empty').hidden=false;id('resultPanel').hidden=true;id('error').textContent='';status('')},0)});document.addEventListener('click',function(e){var b=e.target.closest('[data-action]');if(!b)return;if(!latest)return status('Générez d’abord une rotation.',true);var action=b.dataset.action,value=report(),summary=text(),slug='afrotools-rotation-cultures';if(action==='copy')navigator.clipboard.writeText(summary);if(action==='share')navigator.clipboard.writeText(location.href+'\\n\\n'+summary);if(action==='save')localStorage.setItem('afrotools:fr-agriculture:crop-rotation',JSON.stringify(value));if(action==='txt')download('\\ufeff'+summary,'text/plain;charset=utf-8',slug+'.txt');if(action==='json')download(JSON.stringify(value,null,2),'application/json;charset=utf-8',slug+'.json');if(action==='csv'){var rows=[['saison','culture','groupe','score','azote_fixe_kg_ha']].concat(latest.sequence.map(function(item){return[item.season,item.crop,item.group,item.score,item.nFixed]}));download('\\ufeff'+rows.map(function(row){return row.map(cell).join(',')}).join('\\r\\n'),'text/csv;charset=utf-8',slug+'.csv')}if(action==='pdf'){var Pdf=window.jspdf&&window.jspdf.jsPDF;if(!Pdf)return status('Export PDF indisponible.',true);var pdf=new Pdf({unit:'pt',format:'a4'});pdf.text(pdf.splitTextToSize(summary.normalize('NFD').replace(/[\\u0300-\\u036f]/g,''),500),48,58);pdf.save(slug+'.pdf')}status(action==='save'?'Rotation enregistrée dans ce navigateur.':'Action terminée.')});window.__FR_AGRI_TEST__={latest:null,engine:engine,countries:countries,calculate:calculate,reportObject:report,input:input};syncCrops()})();</script>`;
  return renderFrenchAgriculturePage({ row, title:'Planificateur de rotation des cultures | AfroTools', description:'Générez une rotation pluri-saison avec le moteur agronomique et les cultures du pays, en français et localement.', heading:'Planificateur de rotation des cultures', lead:'Choisissez pays, culture précédente, objectif et état du sol pour classer une séquence à vérifier avec un agronome.', artwork:row.artwork.file, body, scripts, pageConfig, familyLabel:'Rotation des cultures', familyRoute:row.french.routeKey });
}
module.exports = { COUNTRIES, CROPS, GOALS, SOILS, GROUPS, PROVEN, render };
