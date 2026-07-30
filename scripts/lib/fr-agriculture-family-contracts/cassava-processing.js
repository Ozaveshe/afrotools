'use strict';

const { renderFrenchAgriculturePage, escapeHtml } = require('../fr-agriculture-page-shell');

const PATHWAYS = Object.freeze({
  garri: 'Garri',
  fufu_flour: 'Fufu / farine de manioc',
  hqcf: 'Farine de manioc de haute qualité (HQCF)',
  cassava_chips: 'Cossettes de manioc séchées',
  cassava_starch: 'Amidon de manioc',
});
const LEVELS = Object.freeze({ manual: 'Manuel', semi_mechanized: 'Semi-mécanisé', mechanized: 'Mécanisé' });
const PRICE_KEYS = Object.freeze({
  garri: 'garri_per_kg',
  fufu_flour: 'fufu_flour_per_kg',
  hqcf: 'hqcf_per_kg',
  cassava_chips: 'cassava_chips_per_kg',
  cassava_starch: 'cassava_starch_per_kg',
});

function options(values) {
  return Object.entries(values).map(([value, label]) => `<option value="${value}">${escapeHtml(label)}</option>`).join('');
}

function renderHub(row, context = {}) {
  const countries = (context.familyRows || []).filter((item) => item.country)
    .sort((a, b) => a.country.frenchName.localeCompare(b.country.frenchName, 'fr'));
  if (countries.length !== 15) throw new Error('Cassava Processing hub requires 15 manifest countries.');
  return renderFrenchAgriculturePage({
    row,
    title: 'Rentabilité de la transformation du manioc par pays | AfroTools',
    description: 'Choisissez un pays pour comparer les filières de transformation du manioc avec les coûts locaux maintenus.',
    heading: 'Transformation du manioc',
    lead: 'Comparez garri, farines, cossettes et amidon dans quinze applications pays.',
    artwork: row.artwork.file,
    body: `<section class="card"><h2>Choisissez le pays</h2><ul class="country-list">${countries.map((item) => `<li><a href="${escapeHtml(item.french.route)}">${escapeHtml(item.country.frenchName)}</a> <span>(${item.country.code})</span></li>`).join('')}</ul></section>
<section class="card"><h2>Planification</h2><p>Les prix et coûts sont des références statiques 2024–2025, pas des prix en direct. Vérifiez marché, qualité, eau, énergie et équipement avant d’investir.</p><p><strong>Confidentialité :</strong> calcul local.</p></section>`,
    scripts: '',
    pageConfig: { id: row.english.id },
    familyLabel: 'Transformation du manioc',
    familyRoute: '/fr/agriculture/cassava-processing/',
  });
}

function render(row, context = {}) {
  if (!row.country) return renderHub(row, context);
  const config = {
    id: row.english.id,
    countryCode: row.country.code,
    countryName: row.country.frenchName,
    locale: 'fr',
    pathways: PATHWAYS,
    levels: LEVELS,
    priceKeys: PRICE_KEYS,
    sourceLabel: 'FAO, rapports post-récolte IITA sur le manioc et enquêtes de marché régionales',
    dataReviewed: 'référentiel de prix 2024–2025',
  };
  const body = `<section class="card"><h2>Configurer un lot</h2><form id="cassavaForm" novalidate><div class="grid">
<div class="field"><label for="pathway">Produit transformé</label><select id="pathway">${options(PATHWAYS)}</select></div>
<div class="field"><label for="rawTonnes">Manioc frais par lot (tonnes)</label><input id="rawTonnes" type="number" min="0.1" step="0.1" value="1"></div>
<div class="field"><label for="batches">Lots par mois</label><input id="batches" type="number" min="1" max="100" step="1" value="4"></div>
<div class="field"><label for="level">Niveau de transformation</label><select id="level">${options(LEVELS)}</select></div>
<div class="field"><label for="rawPrice">Prix du manioc frais par tonne</label><input id="rawPrice" type="number" min="0" step="1"></div>
<div class="field"><label for="sellingPrice">Prix de vente par kg</label><input id="sellingPrice" type="number" min="0" step="0.01"></div>
<div class="field"><label for="transport">Inclure le transport</label><select id="transport"><option value="no">Non</option><option value="yes">Oui</option></select></div>
<div class="field"><label for="distance">Distance de transport (km)</label><input id="distance" type="number" min="0" step="1" value="0"></div>
</div><p id="pathwayHelp" class="empty"></p><div class="actions"><button class="action primary" type="submit">Calculer le bénéfice</button><button class="action" type="reset">Réinitialiser</button></div><p class="error" id="formError" role="alert" aria-live="assertive"></p></form></section>
<section class="card"><h2>Résultat</h2><div class="empty" id="emptyState">Aucun résultat n’est encore calculé.</div><div class="result-panel" id="resultPanel" hidden><div class="result-hero"><div class="result-value" id="profit">—</div><div id="profitLabel">Résultat par lot</div></div><div class="result-grid"><div class="metric"><strong id="output">—</strong><span>Produit obtenu</span></div><div class="metric"><strong id="cost">—</strong><span>Coût total</span></div><div class="metric"><strong id="revenue">—</strong><span>Revenu</span></div><div class="metric"><strong id="margin">—</strong><span>Marge</span></div><div class="metric"><strong id="monthly">—</strong><span>Résultat mensuel</span></div><div class="metric"><strong id="annual">—</strong><span>Résultat annuel</span></div></div><p id="comparison"></p><div class="actions"><button class="action" type="button" data-action="copy">Copier</button><button class="action" type="button" data-action="share">Partager</button><button class="action" type="button" data-action="save">Enregistrer dans ce navigateur</button><button class="action" type="button" data-action="pdf">Exporter en PDF</button><button class="action" type="button" data-action="csv">Exporter en CSV</button><button class="action" type="button" data-action="json">Exporter en JSON</button><button class="action" type="button" data-action="txt">Exporter en TXT</button></div><p class="status" id="actionStatus" role="status" aria-live="polite"></p></div></section>
<section class="card"><h2>Sources, fraîcheur et limites</h2><div class="trust-grid"><div class="trust-item"><strong>Sources</strong><span>${escapeHtml(config.sourceLabel)}</span></div><div class="trust-item"><strong>Fraîcheur</strong><span>${escapeHtml(config.dataReviewed)}; aucune donnée en direct.</span></div><div class="trust-item"><strong>Confiance</strong><span>Estimation de planification sensible au rendement de conversion, aux prix, à l’équipement et à l’énergie.</span></div></div><p>Le manioc frais se détériore rapidement après récolte. Respectez les exigences locales de sécurité alimentaire, notamment pour réduire les composés cyanogènes.</p><p><strong>Confidentialité :</strong> aucune saisie envoyée à un serveur.</p></section>`;
  const scripts = `<script src="/data/agriculture/cassava-processing-data.js"></script><script src="/engines/cassava-processing-engine.js"></script><script src="/assets/vendor/jspdf/jspdf.umd.min.js"></script><script>(function(){'use strict';
var cfg=window.__FR_AGRI_PAGE__,data=window.AfroTools.cassavaProcessing,engine=window.AfroTools.CassavaProcessingEngine,country=null,latest=null;function id(x){return document.getElementById(x)}function num(v){return new Intl.NumberFormat(cfg.locale,{maximumFractionDigits:1}).format(Number(v)||0)}function money(v){return new Intl.NumberFormat(cfg.locale,{style:'currency',currency:country.currency,maximumFractionDigits:0}).format(Number(v)||0)}function status(m,e){id('actionStatus').textContent=m;id('actionStatus').style.color=e?'var(--agri-danger)':'var(--agri-good)'}function dl(c,t,f){var u=URL.createObjectURL(new Blob([c],{type:t})),a=document.createElement('a');a.href=u;a.download=f;document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(u)},0)}function copy(t){return navigator.clipboard.writeText(t)}function cell(v){var s=String(v==null?'':v);return /[",\\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s}
function supported(key){return Number(country[cfg.priceKeys[key]])>0}function refresh(){var key=id('pathway').value,path=data.pathways[key];id('sellingPrice').value=country[cfg.priceKeys[key]]||0;id('pathwayHelp').textContent='Conversion maintenue : '+num(path.conversionRate)+' kg de racines pour 1 kg de produit. Conservation indicative : '+path.shelfLife+'.'+(supported(key)?'':' Aucun prix de vente pays n’est maintenu pour cette filière.')}
function init(){if(!data||!engine||!data.countries[cfg.countryCode])throw new Error('Moteur ou données de transformation indisponibles.');country=data.countries[cfg.countryCode];id('rawPrice').value=country.fresh_cassava_per_tonne;var first=Object.keys(cfg.pathways).find(supported);id('pathway').value=first||'garri';id('level').value='manual';refresh()}
function input(){return {pathwayId:id('pathway').value,rawTonnes:Number(id('rawTonnes').value),batchesPerMonth:Number(id('batches').value),rawPricePerTonne:Number(id('rawPrice').value),sellingPricePerKg:Number(id('sellingPrice').value),processingLevel:id('level').value,includeTransport:id('transport').value==='yes',distanceKm:Number(id('distance').value)}}function fr(){if(!latest)return null;var r=latest.result;return {filiere:cfg.pathways[r.pathway],maniocFraisKg:r.rawKg,produitKg:r.outputKg,tauxConversion:r.conversionRate,prixVenteKg:r.sellingPrice,revenu:r.revenue,couts:r.costs,resultatLot:r.profitPerBatch,margePct:r.profitMarginPct,resultatMensuel:r.monthlyProfit,resultatAnnuel:r.annualProfit,roiPct:r.roi,devise:country.currency,meilleureFiliere:latest.comparisons.length?cfg.pathways[latest.comparisons[0].pathway]:null}}function object(){return latest?{schemaVersion:1,outil:'transformation-manioc',langue:'fr',pays:{code:cfg.countryCode,nom:cfg.countryName},entrees:latest.input,resultat:fr(),comparaison:latest.comparisons.map(function(r){return {filiere:cfg.pathways[r.pathway],resultatLot:r.profitPerBatch,margePct:r.profitMarginPct}}),sources:{libelle:cfg.sourceLabel,fraicheur:cfg.dataReviewed,donneesEnDirect:false},confidentialite:'Calcul local; aucune saisie envoyée.'}:null}function text(){var r=fr();if(!r)return '';return ['AfroTools — transformation du manioc',cfg.countryName,'Filière : '+r.filiere,'Manioc frais : '+num(r.maniocFraisKg)+' kg','Produit obtenu : '+num(r.produitKg)+' kg','Revenu : '+money(r.revenu),'Coûts : '+money(r.couts.total),'Résultat par lot : '+money(r.resultatLot),'Marge : '+num(r.margePct)+' %','Résultat mensuel : '+money(r.resultatMensuel),'Résultat annuel : '+money(r.resultatAnnuel),'Meilleure filière comparable : '+(r.meilleureFiliere||'Non disponible'),'','Sources : '+cfg.sourceLabel,'Fraîcheur : '+cfg.dataReviewed+'; aucune donnée en direct.','Limites : vérifier prix, qualité, eau, énergie, sécurité alimentaire et débouchés.','Confidentialité : calcul local.'].join('\\n')}
function calculate(){id('formError').textContent='';var i=input();if(!Number.isFinite(i.rawTonnes)||i.rawTonnes<.1){id('formError').textContent='Saisissez au moins 0,1 tonne de manioc frais.';id('rawTonnes').focus();return null}if(!supported(i.pathwayId)&&i.sellingPricePerKg<=0){id('formError').textContent='Aucun prix pays n’est maintenu pour cette filière; saisissez un prix vérifié.';id('sellingPrice').focus();return null}var r=engine.calculate(i,cfg.countryCode),comparisons=engine.compareAll(i,cfg.countryCode);if(r.error){id('formError').textContent='Le calcul de transformation a échoué.';return null}latest={input:i,result:r,comparisons:comparisons};window.__FR_AGRI_TEST__.latest=latest;id('emptyState').hidden=true;id('resultPanel').hidden=false;id('profit').textContent=money(r.profitPerBatch);id('profitLabel').textContent=r.isProfit?'Bénéfice par lot':'Perte par lot';id('output').textContent=num(r.outputKg)+' kg';id('cost').textContent=money(r.costs.total);id('revenue').textContent=money(r.revenue);id('margin').textContent=num(r.profitMarginPct)+' %';id('monthly').textContent=money(r.monthlyProfit);id('annual').textContent=money(r.annualProfit);id('comparison').textContent=comparisons.length?'Meilleure filière comparable : '+cfg.pathways[comparisons[0].pathway]+' ('+money(comparisons[0].profitPerBatch)+' par lot).':'Aucune autre filière avec prix pays maintenu.';status('Rentabilité calculée localement.');return r}
id('pathway').addEventListener('change',refresh);id('cassavaForm').addEventListener('submit',function(e){e.preventDefault();calculate()});id('cassavaForm').addEventListener('reset',function(){setTimeout(function(){latest=null;window.__FR_AGRI_TEST__.latest=null;id('resultPanel').hidden=true;id('emptyState').hidden=false;init()},0)});document.addEventListener('click',function(e){var b=e.target.closest('[data-action]');if(!b)return;if(!latest)return status('Lancez d’abord un calcul.',true);var a=b.dataset.action,o=object(),t=text(),slug='afrotools-manioc-'+cfg.countryCode.toLowerCase();if(a==='copy')copy(t);if(a==='share')copy(location.href+'\\n\\n'+t);if(a==='save')localStorage.setItem('afrotools:fr-agriculture:cassava-processing:'+cfg.countryCode,JSON.stringify(o));if(a==='txt')dl('\\ufeff'+t,'text/plain;charset=utf-8',slug+'.txt');if(a==='json')dl(JSON.stringify(o,null,2),'application/json;charset=utf-8',slug+'.json');if(a==='csv'){var r=fr(),x=[['pays','code_pays','filiere','manioc_frais_kg','produit_kg','revenu','cout_total','resultat_lot','marge_pct','devise','donnees_en_direct'],[cfg.countryName,cfg.countryCode,r.filiere,r.maniocFraisKg,r.produitKg,r.revenu,r.couts.total,r.resultatLot,r.margePct,r.devise,'non']];dl('\\ufeff'+x.map(function(row){return row.map(cell).join(',')}).join('\\r\\n'),'text/csv;charset=utf-8',slug+'.csv')}if(a==='pdf'){var J=window.jspdf&&window.jspdf.jsPDF;if(!J)return;var d=new J({unit:'pt',format:'a4'});d.text(d.splitTextToSize(t.normalize('NFD').replace(/[\\u0300-\\u036f]/g,''),500),48,58);d.save(slug+'.pdf')}});window.__FR_AGRI_TEST__={calculate:calculate,latest:null,engine:engine,data:data,reportObject:object};try{init()}catch(e){id('formError').textContent=e.message;console.error(e)}})();</script>`;
  return renderFrenchAgriculturePage({
    row,
    title: `Transformation du manioc — ${row.country.frenchName} | AfroTools`,
    description: `Comparez coûts, rendement de conversion et bénéfice des filières manioc en ${row.country.frenchName}.`,
    heading: `Transformation du manioc — ${row.country.frenchName}`,
    lead: 'Comparez les filières avec les prix, la devise et les coûts pays du référentiel accepté.',
    artwork: row.artwork.file,
    body,
    scripts,
    pageConfig: config,
    familyLabel: 'Transformation du manioc',
    familyRoute: '/fr/agriculture/cassava-processing/',
  });
}

module.exports = { id: 'cassava-processing', PATHWAYS, LEVELS, PRICE_KEYS, renderHub, render };
