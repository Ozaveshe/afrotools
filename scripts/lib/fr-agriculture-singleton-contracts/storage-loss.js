'use strict';

const { renderFrenchAgriculturePage } = require('../fr-agriculture-page-shell');

const COUNTRIES = Object.freeze({
  ALL: 'Valeurs en dollars US',
  NG: 'Nigeria', KE: 'Kenya', ET: 'Éthiopie', GH: 'Ghana', TZ: 'Tanzanie',
  ZA: 'Afrique du Sud', UG: 'Ouganda', ZM: 'Zambie', MW: 'Malawi',
  MZ: 'Mozambique', RW: 'Rwanda', BF: 'Burkina Faso', NE: 'Niger',
  ML: 'Mali', SN: 'Sénégal', CI: 'Côte d’Ivoire', CM: 'Cameroun',
  MA: 'Maroc', EG: 'Égypte', TN: 'Tunisie', SD: 'Soudan',
  SS: 'Soudan du Sud', ZW: 'Zimbabwe', AO: 'Angola', TG: 'Togo', BJ: 'Bénin',
});
const CROPS = Object.freeze({
  maize: 'Maïs', sorghum: 'Sorgho', millet: 'Mil',
  rice_paddy: 'Riz paddy', cowpea: 'Niébé', wheat: 'Blé',
  common_bean: 'Haricot commun', groundnut: 'Arachide',
});
const METHODS = Object.freeze({
  traditional_granary: 'Grenier traditionnel (chaume ou bois)',
  traditional: 'Stockage traditionnel',
  polypropylene_bags: 'Sacs en polypropylène',
  pp_bags_with_chemical: 'Sacs PP avec traitement chimique',
  hermetic_bags_PICS: 'Sacs hermétiques PICS',
  hermetic_bags_other: 'Autres sacs hermétiques',
  hermetic_bags: 'Sacs hermétiques',
  metal_silo: 'Silo métallique galvanisé',
  warehouse_fumigated: 'Entrepôt commercial avec fumigation',
});
const METHOD_HELP = Object.freeze({
  traditional_granary: 'Protection variable contre insectes et rongeurs; inspectez le grain et l’humidité.',
  traditional: 'Méthode locale dont la performance dépend du séchage, de l’étanchéité et de l’hygiène.',
  polypropylene_bags: 'Protection limitée contre les insectes; contrôler humidité, perforations et infestation.',
  pp_bags_with_chemical: 'Respecter strictement l’étiquette, les délais et les règles sanitaires du produit autorisé.',
  hermetic_bags_PICS: 'Fermer hermétiquement et vérifier chaque couche avant réutilisation.',
  hermetic_bags_other: 'Vérifier l’intégrité et les instructions du fabricant avant le remplissage.',
  hermetic_bags: 'Le résultat dépend d’une fermeture étanche et d’un grain suffisamment sec.',
  metal_silo: 'Le modèle amortit le silo sur 15 ans; confirmer le prix, la capacité et l’entretien locaux.',
  warehouse_fumigated: 'La fumigation doit être réalisée par un opérateur qualifié selon les règles locales.',
});

function options(map) {
  return Object.entries(map).map(([value, label]) => `<option value="${value}">${label}</option>`).join('');
}

function render(row) {
  const pageConfig = {
    id: row.english.id,
    locale: 'fr',
    countries: COUNTRIES,
    crops: CROPS,
    methods: METHODS,
    methodHelp: METHOD_HELP,
  };
  const body = `<section class="card"><h2>Stock, méthode et prix</h2>
<form id="storageForm" novalidate><div class="grid">
<div class="field"><label for="crop">Culture stockée</label><select id="crop">${options(CROPS)}</select></div>
<div class="field"><label for="country">Pays et monnaie</label><select id="country">${options(COUNTRIES)}</select></div>
<div class="field"><label for="quantity">Quantité récoltée (tonnes)</label><input id="quantity" type="number" min="0.01" step="0.01" value="5"></div>
<div class="field"><label for="duration">Durée de stockage (mois)</label><input id="duration" type="number" min="1" max="18" step="1" value="6"></div>
<div class="field"><label for="method">Méthode actuelle</label><select id="method"></select><small id="methodHelp"></small></div>
<div class="field"><label for="price">Prix à la récolte par tonne</label><input id="price" type="number" min="0.01" step="0.01"><small id="priceHelp"></small></div>
</div><div class="actions"><button class="action primary" type="submit">Estimer les pertes</button><button class="action" type="reset">Réinitialiser</button></div><p class="error" id="error" role="alert" aria-live="assertive"></p></form></section>
<section class="card"><h2>Résultats</h2><div class="empty" id="empty">Aucun scénario calculé.</div><div id="resultPanel" class="result-panel" hidden>
<div class="result-hero"><div class="result-value" id="headline"></div><p id="lead"></p></div>
<h3>Comparaison des pertes</h3><div class="result-grid" id="lossMetrics"></div>
<h3>Investissement de stockage</h3><div class="result-grid" id="costMetrics"></div>
<h3>Valeur préservée et vente différée</h3><div class="result-grid" id="benefitMetrics"></div>
<p id="aflatoxin" role="status"></p>
<div class="actions"><button class="action" type="button" data-action="copy">Copier</button><button class="action" type="button" data-action="share">Partager</button><button class="action" type="button" data-action="save">Enregistrer dans ce navigateur</button><button class="action" type="button" data-action="pdf">Exporter en PDF</button><button class="action" type="button" data-action="csv">Exporter en CSV</button><button class="action" type="button" data-action="json">Exporter en JSON</button><button class="action" type="button" data-action="txt">Exporter en TXT</button></div><p class="status" id="status" role="status" aria-live="polite"></p></div></section>
<section class="card"><h2>Sources, fraîcheur et limites</h2><div class="trust-grid">
<div class="trust-item"><strong>Propriétaires du calcul</strong><span>Même jeu statique de pertes, prix, monnaies et coûts et même moteur pur que l’application anglaise acceptée.</span></div>
<div class="trust-item"><strong>Fraîcheur</strong><span>Hypothèses statiques de planification; aucun prix de marché, taux de change ou relevé de stock en direct.</span></div>
<div class="trust-item"><strong>Confiance</strong><span>Comparaison indicative. Confirmez humidité, infestation, prix, capacité, durée de vie et coût auprès de fournisseurs et conseillers locaux.</span></div></div>
<p>Le modèle compare la méthode choisie aux sacs hermétiques et au silo métallique. Il ne mesure ni humidité, ni qualité, ni contamination. Pour le maïs et l’arachide, une faible perte de poids ne prouve jamais l’absence d’aflatoxines.</p>
<p><strong>Confidentialité :</strong> calcul local; aucune saisie envoyée à un serveur.</p></section>`;
  const scripts = `<script src="/data/agriculture/storage-data.js"></script><script src="/engines/storage-loss-engine.js"></script><script src="/assets/vendor/jspdf/jspdf.umd.min.js"></script>
<script>(function(){'use strict';var cfg=window.__FR_AGRI_PAGE__,data=window.STORAGE_DATA||window.StorageData||STORAGE_DATA,engine=window.AfroTools.StorageLossEngine,latest=null;
function id(v){return document.getElementById(v)}function number(v,d){return new Intl.NumberFormat('fr-FR',{minimumFractionDigits:d||0,maximumFractionDigits:d==null?0:d}).format(v)}function money(v,r){return r.symbol+' '+number(v,0)}function metric(label,value){var box=document.createElement('div'),strong=document.createElement('strong'),span=document.createElement('span');box.className='metric';strong.textContent=value;span.textContent=label;box.append(strong,span);return box}function fill(node,rows){node.replaceChildren();rows.forEach(function(row){node.appendChild(metric(row[0],row[1]))})}function cell(v){var text=String(v==null?'':v);return /[",\\n]/.test(text)?'"'+text.replace(/"/g,'""')+'"':text}function download(content,type,name){var url=URL.createObjectURL(new Blob([content],{type:type})),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(url)},0)}function status(v,e){id('status').textContent=v;id('status').style.color=e?'var(--agri-danger)':'var(--agri-good)'}
function syncMethods(){var crop=data.lossRates[id('crop').value],previous=id('method').value;id('method').replaceChildren();Object.keys(crop.methods).forEach(function(key){var o=document.createElement('option');o.value=key;o.textContent=cfg.methods[key]||key;id('method').appendChild(o)});if(crop.methods[previous])id('method').value=previous;syncMethodHelp()}function syncMethodHelp(){var key=id('method').value,method=data.lossRates[id('crop').value].methods[key];id('methodHelp').textContent=(cfg.methodHelp[key]||'')+' Perte de référence : '+method.loss_pct+' % sur '+method.period_months+' mois.'}
function syncPrice(){var crop=id('crop').value,code=id('country').value,country=data.countries[code],local=data.harvestPrices[code]&&data.harvestPrices[code][crop],price=local||data.lossRates[crop].defaultHarvestPrice_USD*country.rate;id('price').value=String(price);id('priceHelp').textContent='Hypothèse statique en '+country.currency+'; remplacez-la par un prix local vérifié.'}
function input(){return{crop:id('crop').value,countryCode:id('country').value,methodKey:id('method').value,quantityTonnes:Number(id('quantity').value),durationMonths:Number(id('duration').value),pricePerTonne:Number(id('price').value)}}
function renderResult(r){id('headline').textContent=number(r.picsGrainSaved,2)+' t préservées avec PICS';id('lead').textContent=cfg.crops[r.input.crop]+' — '+cfg.countries[r.input.countryCode]+' — '+number(r.input.durationMonths)+' mois.';fill(id('lossMetrics'),[['Méthode actuelle',number(r.adjCurrentLoss,1)+' % · '+number(r.currentLossTonnes,2)+' t'],['Sacs hermétiques',number(r.adjPicsLoss,1)+' % · '+number(r.picsLossTonnes,2)+' t'],['Silo métallique',number(r.adjSiloLoss,1)+' % · '+number(r.siloLossTonnes,2)+' t'],['Valeur perdue actuellement',money(r.currentLossVal,r.country)],['Valeur perdue avec PICS',money(r.picsLossVal,r.country)],['Valeur perdue avec silo',money(r.siloLossVal,r.country)]]);fill(id('costMetrics'),[['Sacs de 100 kg nécessaires',number(r.bagsNeeded)],['Coût total des sacs PICS',money(r.picsTotalCost,r.country)],['Coût PICS par utilisation',money(r.picsPerUseCost,r.country)],['Configuration silo',r.siloLabel.replace('silos','silos').replace('silo','silo')],['Coût du silo',money(r.siloCostLocal,r.country)],['Coût annuel du silo',money(r.siloAnnualCost,r.country)]]);fill(id('benefitMetrics'),[['Valeur préservée par PICS',money(r.picsValSaved,r.country)],['Gain net PICS par utilisation',money(r.picsNetSave,r.country)],['ROI PICS',number(r.picsROI,0)+' %'],['Retour PICS',r.picsPaybackSeasons+' saisons'],['Gain potentiel de vente différée',money(r.timingGain,r.country)],['Bénéfice total modélisé',money(r.totalBenefit,r.country)]]);id('aflatoxin').textContent=r.aflatoxinRisk?'Attention aflatoxines : séchage, humidité et analyse restent indispensables; ce calcul ne certifie pas la sécurité alimentaire.':'Le calcul estime la perte de poids uniquement; inspectez toujours humidité, insectes et qualité.'}
function calculate(){id('error').textContent='';latest=engine.calculate(input(),data);if(!latest.ok){id('error').textContent='Saisissez une quantité et un prix positifs, puis choisissez une culture et une méthode valides.';id('quantity').focus();return null}window.__FR_AGRI_TEST__.latest=latest;renderResult(latest);id('empty').hidden=true;id('resultPanel').hidden=false;status('Scénario calculé localement.');return latest}
function report(){if(!latest)return null;return{schemaVersion:1,outil:'pertes-stockage',langue:'fr',entrees:latest.input,resultat:{perteActuellePct:latest.adjCurrentLoss,perteActuelleTonnes:latest.currentLossTonnes,pertePicsPct:latest.adjPicsLoss,pertePicsTonnes:latest.picsLossTonnes,perteSiloPct:latest.adjSiloLoss,perteSiloTonnes:latest.siloLossTonnes,valeurPreserveePics:latest.picsValSaved,coutPics:latest.picsTotalCost,coutSilo:latest.siloCostLocal,roiPics:latest.picsROI,gainVenteDifferee:latest.timingGain,beneficeTotal:latest.totalBenefit,risqueAflatoxines:latest.aflatoxinRisk},sources:{donnees:'data/agriculture/storage-data.js',moteur:'engines/src/storage-loss-engine.js',donneesEnDirect:false},limitations:['Hypothèses statiques; confirmer prix, humidité, infestation, durée de vie et coût localement.','Le calcul ne mesure ni qualité ni aflatoxines.'],confidentialite:'Calcul local; aucune saisie envoyée.'}}
function text(){if(!latest)return'';return['AfroTools — Pertes après récolte','Culture : '+cfg.crops[latest.input.crop],'Pays : '+cfg.countries[latest.input.countryCode],'Stock : '+number(latest.input.quantityTonnes,2)+' t pendant '+latest.input.durationMonths+' mois','Perte actuelle : '+number(latest.adjCurrentLoss,1)+' % · '+number(latest.currentLossTonnes,2)+' t','Perte PICS : '+number(latest.adjPicsLoss,1)+' % · '+number(latest.picsLossTonnes,2)+' t','Valeur préservée PICS : '+money(latest.picsValSaved,latest.country),'Coût PICS : '+money(latest.picsTotalCost,latest.country),'Bénéfice total modélisé : '+money(latest.totalBenefit,latest.country),'','Hypothèses statiques; aucune donnée de marché en direct.','Le calcul ne mesure ni qualité ni aflatoxines.','Confidentialité : calcul local.'].join('\\n')}
id('crop').addEventListener('change',function(){syncMethods();syncPrice()});id('country').addEventListener('change',syncPrice);id('method').addEventListener('change',syncMethodHelp);id('storageForm').addEventListener('submit',function(e){e.preventDefault();calculate()});id('storageForm').addEventListener('reset',function(){setTimeout(function(){syncMethods();syncPrice();latest=null;window.__FR_AGRI_TEST__.latest=null;id('empty').hidden=false;id('resultPanel').hidden=true;id('error').textContent='';status('')},0)});
document.addEventListener('click',function(e){var b=e.target.closest('[data-action]');if(!b)return;if(!latest)return status('Calculez d’abord un scénario.',true);var action=b.dataset.action,value=report(),summary=text(),slug='afrotools-pertes-stockage';if(action==='copy')navigator.clipboard.writeText(summary);if(action==='share')navigator.clipboard.writeText(location.href+'\\n\\n'+summary);if(action==='save')localStorage.setItem('afrotools:fr-agriculture:storage-loss',JSON.stringify(value));if(action==='txt')download('\\ufeff'+summary,'text/plain;charset=utf-8',slug+'.txt');if(action==='json')download(JSON.stringify(value,null,2),'application/json;charset=utf-8',slug+'.json');if(action==='csv'){var rows=[['champ','valeur'],['culture',latest.input.crop],['pays',latest.input.countryCode],['quantite_t',latest.input.quantityTonnes],['duree_mois',latest.input.durationMonths],['perte_actuelle_pct',latest.adjCurrentLoss],['perte_pics_pct',latest.adjPicsLoss],['valeur_preservee_pics',latest.picsValSaved],['cout_pics',latest.picsTotalCost],['cout_silo',latest.siloCostLocal],['benefice_total',latest.totalBenefit]];download('\\ufeff'+rows.map(function(r){return r.map(cell).join(',')}).join('\\r\\n'),'text/csv;charset=utf-8',slug+'.csv')}if(action==='pdf'){var Pdf=window.jspdf&&window.jspdf.jsPDF;if(!Pdf)return status('Export PDF indisponible.',true);var pdf=new Pdf({unit:'pt',format:'a4'});pdf.text(pdf.splitTextToSize(summary.normalize('NFD').replace(/[\\u0300-\\u036f]/g,''),500),48,58);pdf.save(slug+'.pdf')}status(action==='save'?'Scénario enregistré dans ce navigateur.':'Action terminée.')});
window.__FR_AGRI_TEST__={latest:null,engine:engine,data:data,calculate:calculate,reportObject:report};syncMethods();syncPrice()})();</script>`;
  return renderFrenchAgriculturePage({
    row,
    title: 'Calculateur de pertes après récolte | AfroTools',
    description: 'Comparez les pertes de stockage, sacs hermétiques et silos avec les mêmes hypothèses agricoles que l’application anglaise.',
    heading: 'Pertes après récolte et stockage',
    lead: 'Estimez la quantité et la valeur perdues, puis comparez sacs hermétiques et silo sans envoyer vos données.',
    artwork: row.artwork.file,
    body,
    scripts,
    pageConfig,
    familyLabel: 'Pertes de stockage',
    familyRoute: row.french.routeKey,
  });
}

module.exports = { COUNTRIES, CROPS, METHODS, METHOD_HELP, render };
