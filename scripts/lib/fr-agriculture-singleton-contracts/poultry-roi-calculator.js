'use strict';

const { renderFrenchAgriculturePage, escapeHtml } = require('../fr-agriculture-page-shell');

const COUNTRY_CODES = Object.freeze([
  'AO', 'CM', 'CI', 'EG', 'ET', 'GH', 'KE', 'MA', 'NG', 'RW', 'SN', 'ZA', 'TZ', 'TN', 'UG',
]);

function render(row, context = {}) {
  const countryByCode = new Map((context.countries || []).map(country => [country.id, country]));
  const countries = COUNTRY_CODES.map(code => countryByCode.get(code));
  if (countries.some(country => !country || !country.fr)) {
    throw new Error('Poultry ROI renderer requires the exact 15-country French registry slice.');
  }
  const countryOptions = countries
    .slice()
    .sort((a, b) => a.fr.localeCompare(b.fr, 'fr'))
    .map(country => `<option value="${country.id}">${escapeHtml(country.fr)}</option>`)
    .join('');
  const pageConfig = {
    id: row.english.id,
    locale: 'fr',
    countryNames: Object.fromEntries(countries.map(country => [country.id, country.fr])),
  };
  const body = `<style>.cashflow-mobile{display:none;gap:10px}.cashflow-mobile-row{border:1px solid var(--agri-border);border-radius:10px;padding:14px;min-width:0}.cashflow-mobile-row h4{margin:0 0 10px;overflow-wrap:anywhere}.cashflow-mobile-row dl{display:grid;gap:8px;margin:0}.cashflow-mobile-row div{min-width:0}.cashflow-mobile-row dt{color:var(--agri-muted);font-size:.82rem}.cashflow-mobile-row dd{margin:0;font-weight:800;overflow-wrap:anywhere}@media(max-width:480px){.cashflow-table{display:none}.cashflow-mobile{display:grid}}</style>
<section class="card"><h2>Hypothèses de l’élevage</h2><form id="poultryForm" novalidate>
<div class="grid"><div class="field"><label for="countryCode">Pays</label><select id="countryCode"><option value="">Choisir un pays</option>${countryOptions}</select></div>
<div class="field"><label for="mode">Type de production</label><select id="mode"><option value="broilers">Poulets de chair</option><option value="layers">Pondeuses</option><option value="indigenous">Poulets locaux / améliorés</option><option value="compare">Comparer les trois</option></select></div>
<div class="field"><label for="flockSize">Nombre d’oiseaux</label><input id="flockSize" type="number" min="1" step="1" value="100" inputmode="numeric"></div>
<div class="field"><label for="management">Niveau de conduite</label><select id="management"><option value="backyard">Basse-cour</option><option value="smallholder" selected>Petite exploitation</option><option value="semi_commercial">Semi-commercial</option><option value="commercial">Commercial</option></select></div>
<div class="field" id="cyclesField"><label for="cyclesPerYear">Cycles par an</label><input id="cyclesPerYear" type="number" min="1" max="12" step="1" value="4"></div>
<div class="field"><label for="ownHouse">Bâtiment déjà disponible</label><select id="ownHouse"><option value="yes" selected>Oui</option><option value="no">Non</option></select></div>
<div class="field" id="housingField" hidden><label for="housingType">Type de bâtiment à construire</label><select id="housingType"><option value="simple">Simple</option><option value="semi_commercial">Semi-commercial</option><option value="commercial">Commercial</option></select></div></div>
<fieldset><legend><strong>Prix et coûts locaux modifiables</strong></legend><p class="field-help">Valeurs statiques issues de l’application anglaise acceptée. Remplacez-les par des devis locaux actuels.</p><div class="grid">
<div class="field"><label for="chickPrice">Prix d’un poussin</label><input id="chickPrice" type="number" min="0" step="any"></div>
<div class="field"><label for="starterPrice">Aliment démarrage par kg</label><input id="starterPrice" type="number" min="0" step="any"></div>
<div class="field"><label for="growerPrice">Aliment croissance par kg</label><input id="growerPrice" type="number" min="0" step="any"></div>
<div class="field"><label for="finisherPrice">Aliment finition par kg</label><input id="finisherPrice" type="number" min="0" step="any"></div>
<div class="field"><label for="layerMashPrice">Aliment pondeuse par kg</label><input id="layerMashPrice" type="number" min="0" step="any"></div>
<div class="field"><label for="laborPrice">Main-d’œuvre par mois</label><input id="laborPrice" type="number" min="0" step="any"></div>
<div class="field"><label for="broilerSalePrice">Prix de vente d’un poulet de chair</label><input id="broilerSalePrice" type="number" min="0" step="any"></div>
<div class="field"><label for="eggSalePrice">Prix de vente d’un œuf</label><input id="eggSalePrice" type="number" min="0" step="any"></div>
<div class="field"><label for="spentLayerPrice">Prix de vente d’une pondeuse réformée</label><input id="spentLayerPrice" type="number" min="0" step="any"></div>
<div class="field"><label for="indigenousSalePrice">Prix de vente d’un poulet local</label><input id="indigenousSalePrice" type="number" min="0" step="any"></div>
</div></fieldset>
<div class="actions"><button class="action primary" type="submit">Calculer la rentabilité</button><button class="action" type="reset">Réinitialiser</button></div><p class="error" id="poultryError" role="alert" aria-live="assertive"></p></form></section>
<section class="card"><h2>Résultats</h2><div class="empty" id="poultryEmpty">Aucun scénario calculé.</div><div id="resultPanel" class="result-panel" hidden><div class="result-hero"><div class="result-value" id="annualProfit"></div><p id="resultLead"></p></div><div class="result-grid" id="summary"></div><h3>Détails de production</h3><div class="result-grid" id="details"></div><h3>Scénarios de risque</h3><div class="result-grid" id="risks"></div><section id="cashflowSection"><h3>Trésorerie</h3><div class="table-wrap cashflow-table"><table class="data-table"><thead><tr><th>Période</th><th>Recettes</th><th>Dépenses</th><th>Net</th></tr></thead><tbody id="cashflow"></tbody></table></div><div id="cashflowMobile" class="cashflow-mobile" aria-label="Trésorerie par période"></div></section>
<div class="actions"><button class="action" type="button" data-action="copy">Copier</button><button class="action" type="button" data-action="share">Partager</button><button class="action" type="button" data-action="save">Enregistrer dans ce navigateur</button><button class="action" type="button" data-action="pdf">Exporter en PDF</button><button class="action" type="button" data-action="csv">Exporter en CSV</button><button class="action" type="button" data-action="json">Exporter en JSON</button><button class="action" type="button" data-action="txt">Exporter en TXT</button></div><p class="status" id="actionStatus" role="status" aria-live="polite"></p></div></section>
<section class="card"><h2>Sources, fraîcheur et limites</h2><div class="trust-grid"><div class="trust-item"><strong>Sources</strong><span>Paramètres de production et coûts pays de poultry-data.js, utilisés par les calculateurs anglais acceptés.</span></div><div class="trust-item"><strong>Fraîcheur</strong><span>Hypothèses statiques mises à jour dans le référentiel; aucune donnée en direct.</span></div><div class="trust-item"><strong>Confiance</strong><span>Estimation de planification, pas une garantie de marge ni un devis.</span></div></div><p>La mortalité, les maladies, la biosécurité, l’indice de consommation, le prix des aliments et le débouché réel peuvent modifier fortement le résultat. Confirmez les prix et les conseils sanitaires localement.</p><p><strong>Confidentialité :</strong> calcul local; aucune saisie envoyée à un serveur.</p></section>`;

  const scripts = `<script src="/data/agriculture/poultry-data.js"></script><script src="/engines/poultry-roi-engine.js"></script><script src="/assets/vendor/jspdf/jspdf.umd.min.js"></script>
<script>(function(){'use strict';var cfg=window.__FR_AGRI_PAGE__,runtime=window.AfroTools||{},production=runtime.PoultryProduction,costs=runtime.PoultryCosts,engine=runtime.PoultryROIEngine,latest=null;
function id(x){return document.getElementById(x)}function number(x,fallback){var value=parseFloat(id(x).value);return value||fallback}function money(value){var data=costs[id('countryCode').value],symbol=data?data.symbol:'';return symbol+new Intl.NumberFormat('fr-FR',{maximumFractionDigits:0}).format(Number(value)||0)}function metric(label,value){var d=document.createElement('div'),s=document.createElement('strong'),l=document.createElement('span');d.className='metric';s.textContent=value;l.textContent=label;d.append(s,l);return d}function status(message,error){id('actionStatus').textContent=message;id('actionStatus').style.color=error?'var(--agri-danger)':'var(--agri-good)'}function download(content,type,name){var url=URL.createObjectURL(new Blob([content],{type:type})),link=document.createElement('a');link.href=url;link.download=name;document.body.appendChild(link);link.click();link.remove();setTimeout(function(){URL.revokeObjectURL(url)},0)}function csvCell(value){var text=String(value==null?'':value);return /[",\\n]/.test(text)?'"'+text.replace(/"/g,'""')+'"':text}function clone(value){return JSON.parse(JSON.stringify(value))}
function country(){return costs[id('countryCode').value]}function chickType(){var mode=id('mode').value;return mode==='layers'?'layer':mode==='indigenous'?'indigenous':'broiler'}function syncFields(){var data=country(),mode=id('mode').value;id('cyclesField').hidden=mode!=='broilers';id('housingField').hidden=id('ownHouse').value==='yes';if(!data)return;id('chickPrice').value=data.dayOldChick[chickType()]||data.dayOldChick.broiler;id('starterPrice').value=data.feed_per_kg.starter;id('growerPrice').value=data.feed_per_kg.grower;id('finisherPrice').value=data.feed_per_kg.finisher;id('layerMashPrice').value=data.feed_per_kg.layer_mash;id('laborPrice').value=data.labor_per_month;id('broilerSalePrice').value=data.sellingPrice.broiler_per_bird||0;id('eggSalePrice').value=data.sellingPrice.egg_per_egg||0;id('spentLayerPrice').value=data.sellingPrice.spent_layer_per_bird||0;id('indigenousSalePrice').value=data.sellingPrice.indigenous_live_per_bird||0}
function customCountry(){var base=country(),copy=clone(base),price=number('chickPrice',base.dayOldChick[chickType()]);copy.dayOldChick.broiler=price||base.dayOldChick.broiler;copy.dayOldChick.layer=price||base.dayOldChick.layer;copy.dayOldChick.indigenous=price||base.dayOldChick.indigenous;copy.feed_per_kg.starter=number('starterPrice',base.feed_per_kg.starter);copy.feed_per_kg.grower=number('growerPrice',base.feed_per_kg.grower);copy.feed_per_kg.finisher=number('finisherPrice',base.feed_per_kg.finisher);copy.feed_per_kg.layer_mash=number('layerMashPrice',base.feed_per_kg.layer_mash);copy.labor_per_month=number('laborPrice',base.labor_per_month);copy.sellingPrice.broiler_per_bird=number('broilerSalePrice',base.sellingPrice.broiler_per_bird);copy.sellingPrice.egg_per_egg=number('eggSalePrice',base.sellingPrice.egg_per_egg);copy.sellingPrice.spent_layer_per_bird=number('spentLayerPrice',base.sellingPrice.spent_layer_per_bird);copy.sellingPrice.indigenous_live_per_bird=number('indigenousSalePrice',base.sellingPrice.indigenous_live_per_bird);return copy}
function input(){return {mode:id('mode').value,countryCode:id('countryCode').value,flockSize:parseInt(id('flockSize').value,10)||100,management:id('management').value,cyclesPerYear:parseInt(id('cyclesPerYear').value,10)||4,ownHouse:id('ownHouse').value==='yes',housingType:id('housingType').value}}
function annual(result){return {revenue:result.mode==='layers'?result.annual.revenue.total:result.annual.revenue,costs:result.mode==='layers'?result.annual.costs.total:result.annual.costs,profit:result.annual.profit}}
function riskLabel(key){return {highMortality:'Mortalité défavorable',highFeed:'Aliments +20 %',lowPrice:'Prix de vente −15/20 %',lowEggPrice:'Prix des œufs −15 %'}[key]||key}
function renderOne(result,label){var a=annual(result),wrap=document.createElement('div');wrap.className='metric';wrap.appendChild(metric(label+' — profit annuel',money(a.profit)));wrap.appendChild(metric('ROI',result.metrics.roi.toFixed(1)+' %'));wrap.appendChild(metric('Recettes',money(a.revenue)));return wrap}
function render(){
id('summary').replaceChildren();id('details').replaceChildren();id('risks').replaceChildren();id('cashflow').replaceChildren();id('cashflowMobile').replaceChildren();
if(latest.mode==='compare'){
id('annualProfit').textContent='Comparaison';id('resultLead').textContent='Poulets de chair, pondeuses et poulets locaux avec les mêmes hypothèses.';
id('summary').append(renderOne(latest.broiler,'Chair'),renderOne(latest.layer,'Pondeuses'),renderOne(latest.indigenous,'Poulets locaux'));
['broiler','layer','indigenous'].forEach(function(key){Object.keys(latest[key].risks).forEach(function(risk){
id('risks').appendChild(metric((key==='broiler'?'Chair':key==='layer'?'Pondeuses':'Locaux')+' — '+riskLabel(risk),money(latest[key].risks[risk].annualProfit)));
});});id('cashflowSection').hidden=true;return;
}
var a=annual(latest);id('annualProfit').textContent=money(Math.abs(a.profit));id('resultLead').textContent=a.profit>=0?'Profit net annuel estimé':'Perte nette annuelle estimée';
id('summary').append(
metric('Recettes annuelles',money(a.revenue)),metric('Coûts annuels',money(a.costs)),metric('ROI',latest.metrics.roi.toFixed(1)+' %'),
metric('Délai de retour',latest.metrics.paybackMonths>=9999?'Non atteint':latest.metrics.paybackMonths.toFixed(1)+' mois'),metric('Part des aliments',latest.metrics.feedPct.toFixed(1)+' %')
);
if(latest.mode==='broilers'){
id('details').append(
metric('Oiseaux survivants',latest.survivingBirds+' / '+latest.flockSize),metric('Cycles par an',String(latest.cyclesYear)),
metric('Profit par cycle',money(latest.perCycle.profit)),metric('Investissement initial',money(latest.investment.total)),metric('Fonds de roulement',money(latest.workingCapital))
);
}else if(latest.mode==='layers'){
id('details').append(
metric('Pondeuses à l’entrée en ponte',String(latest.survivingToLay)),metric('Œufs par an',new Intl.NumberFormat('fr-FR').format(latest.eggsProduced)),
metric('Plateaux de 30',new Intl.NumberFormat('fr-FR').format(latest.cratesOf30)),metric('Pondeuses réformées',String(latest.spentHens)),
metric('Investissement initial',money(latest.investment.total)),metric('Fonds de roulement',money(latest.workingCapital))
);
}else{
id('details').append(
metric('Oiseaux survivants',latest.survivingBirds+' / '+latest.flockSize),metric('Cycles par an',String(latest.cyclesYear)),
metric('Profit par cycle',money(latest.perCycle.profit)),metric('Profit par oiseau',money(latest.metrics.profitPerBird))
);
}
Object.keys(latest.risks).forEach(function(key){id('risks').appendChild(metric(riskLabel(key),money(latest.risks[key].annualProfit)));});
id('cashflowSection').hidden=!latest.cashFlow;
if(latest.cashFlow)latest.cashFlow.forEach(function(item){
var tr=document.createElement('tr'),income=item.income!=null?item.income:item.type==='revenue'?item.amount:0,expense=item.expense!=null?item.expense:item.type==='expense'?Math.abs(item.amount):0,net=item.net!=null?item.net:item.amount;
[item.label,money(income),money(expense),money(net)].forEach(function(value){var td=document.createElement('td');td.textContent=value;tr.appendChild(td);});id('cashflow').appendChild(tr);
var article=document.createElement('article'),heading=document.createElement('h4'),list=document.createElement('dl');article.className='cashflow-mobile-row';heading.textContent=item.label;[['Recettes',income],['Dépenses',expense],['Net',net]].forEach(function(entry){var group=document.createElement('div'),term=document.createElement('dt'),description=document.createElement('dd');term.textContent=entry[0];description.textContent=money(entry[1]);group.append(term,description);list.appendChild(group)});article.append(heading,list);id('cashflowMobile').appendChild(article);
});
}
function calculate(){id('poultryError').textContent='';if(!id('countryCode').value){id('poultryError').textContent='Choisissez un pays.';id('countryCode').focus();return null}if((parseInt(id('flockSize').value,10)||0)<1){id('poultryError').textContent='Saisissez au moins un oiseau.';id('flockSize').focus();return null}var values=input();latest=engine.calculate(values,customCountry(),production);if(latest.error){id('poultryError').textContent='Le scénario ne peut pas être calculé avec ces données.';return null}window.__FR_AGRI_TEST__.latest={result:latest,input:values,countryData:customCountry()};render();id('poultryEmpty').hidden=true;id('resultPanel').hidden=false;status('Calcul effectué localement.');return latest}
function report(){if(!latest)return null;return {schemaVersion:1,outil:'rentabilite-elevage-volailles',langue:'fr',pays:{code:id('countryCode').value,nom:cfg.countryNames[id('countryCode').value]},entrees:input(),resultat:latest,sources:{donnees:'data/agriculture/poultry-data.js',moteur:'engines/src/poultry-roi-engine.js',donneesEnDirect:false},confidentialite:'Calcul local; aucune saisie envoyée.'}}function text(){var value=report();if(!value)return '';if(latest.mode==='compare')return ['AfroTools — rentabilité de l’élevage de volailles',value.pays.nom,'Comparaison des trois modes','Chair : '+money(latest.broiler.annual.profit),'Pondeuses : '+money(latest.layer.annual.profit),'Poulets locaux : '+money(latest.indigenous.annual.profit),'','Hypothèses statiques; aucune donnée en direct.','Confidentialité : calcul local.'].join('\\n');var a=annual(latest);return ['AfroTools — rentabilité de l’élevage de volailles',value.pays.nom,'Mode : '+latest.mode,'Recettes annuelles : '+money(a.revenue),'Coûts annuels : '+money(a.costs),'Profit annuel : '+money(a.profit),'ROI : '+latest.metrics.roi.toFixed(1)+' %','','Hypothèses statiques; aucune donnée en direct.','Vérifiez les prix, la mortalité et les conseils sanitaires locaux.','Confidentialité : calcul local.'].join('\\n')}
id('countryCode').addEventListener('change',syncFields);id('mode').addEventListener('change',syncFields);id('ownHouse').addEventListener('change',syncFields);id('management').addEventListener('change',function(){id('cyclesPerYear').value={backyard:3,smallholder:4,semi_commercial:5,commercial:6}[id('management').value]||4});id('poultryForm').addEventListener('submit',function(event){event.preventDefault();calculate()});id('poultryForm').addEventListener('reset',function(){setTimeout(function(){latest=null;window.__FR_AGRI_TEST__.latest=null;id('poultryEmpty').hidden=false;id('resultPanel').hidden=true;id('poultryError').textContent='';status('');syncFields()},0)});document.addEventListener('click',function(event){var button=event.target.closest('[data-action]');if(!button)return;if(!latest)return status('Calculez d’abord un scénario.',true);var action=button.dataset.action,value=report(),summary=text(),slug='afrotools-rentabilite-volailles-'+value.pays.code.toLowerCase();if(action==='copy')navigator.clipboard.writeText(summary);if(action==='share')navigator.clipboard.writeText(location.href+'\\n\\n'+summary);if(action==='save')localStorage.setItem('afrotools:fr-agriculture:poultry-roi',JSON.stringify(value));if(action==='txt')download('\\ufeff'+summary,'text/plain;charset=utf-8',slug+'.txt');if(action==='json')download(JSON.stringify(value,null,2),'application/json;charset=utf-8',slug+'.json');if(action==='csv'){var rows=[['champ','valeur'],['pays',value.pays.code],['mode',latest.mode]];if(latest.mode==='compare'){['broiler','layer','indigenous'].forEach(function(key){rows.push([key+'_profit_annuel',latest[key].annual.profit],[key+'_roi_pct',latest[key].metrics.roi])})}else{var a=annual(latest);rows.push(['recettes_annuelles',a.revenue],['couts_annuels',a.costs],['profit_annuel',a.profit],['roi_pct',latest.metrics.roi]);Object.keys(latest.risks).forEach(function(key){rows.push(['risque_'+key,latest.risks[key].annualProfit])})}download('\\ufeff'+rows.map(function(row){return row.map(csvCell).join(',')}).join('\\r\\n'),'text/csv;charset=utf-8',slug+'.csv')}if(action==='pdf'){var Pdf=window.jspdf&&window.jspdf.jsPDF;if(!Pdf)return status('Export PDF indisponible.',true);var pdf=new Pdf({unit:'pt',format:'a4'});pdf.text(pdf.splitTextToSize(summary.normalize('NFD').replace(/[\\u0300-\\u036f]/g,''),500),48,58);pdf.save(slug+'.pdf')}status(action==='save'?'Scénario enregistré dans ce navigateur.':'Action terminée.')});window.__FR_AGRI_TEST__={latest:null,engine:engine,production:production,costs:costs,calculate:calculate,reportObject:report,syncFields:syncFields}})();</script>`;

  return renderFrenchAgriculturePage({
    row,
    title: 'Calculateur de rentabilité avicole | AfroTools',
    description: 'Estimez les coûts, recettes, risques, ROI et délai de retour des poulets de chair, pondeuses et poulets locaux dans 15 pays africains.',
    heading: 'Rentabilité de l’élevage de volailles',
    lead: 'Comparez poulets de chair, pondeuses et poulets locaux avec les mêmes paramètres et les coûts statiques du calculateur anglais accepté.',
    artwork: row.artwork.file,
    body,
    scripts,
    pageConfig,
    familyLabel: 'Rentabilité avicole',
    familyRoute: row.french.routeKey,
  });
}

module.exports = { COUNTRY_CODES, render };
