'use strict';

const { renderFrenchAgriculturePage, escapeHtml } = require('../fr-agriculture-page-shell');

const BEHAVIOR = Object.freeze({
  NG: { fertilizerPerKgDecimals: 0, seedSortStrategy: 'legacy-post-division-fallback' },
  CI: { fertilizerPerKgDecimals: 0, seedSortStrategy: 'legacy-post-division-fallback' },
  CM: { fertilizerPerKgDecimals: 0, seedSortStrategy: 'legacy-post-division-fallback' },
  SN: { fertilizerPerKgDecimals: 0, seedSortStrategy: 'legacy-post-division-fallback' },
  MA: { fertilizerPerKgDecimals: 0, seedSortStrategy: 'legacy-post-division-fallback' },
});

const CROPS = Object.freeze({
  Almond: 'Amande', Argan: 'Arganier', Banana: 'Banane', Barley: 'Orge', Beans: 'Haricots',
  Cashew: 'Anacarde', Cassava: 'Manioc', Chickpea: 'Pois chiche', Citrus: 'Agrumes', Cocoa: 'Cacao',
  Coffee: 'Café', 'Common bean': 'Haricot commun', Cotton: 'Coton', Cowpea: 'Niébé',
  'Date palm': 'Palmier dattier', Enset: 'Enset', Groundnut: 'Arachide', 'Irish potato': 'Pomme de terre',
  Maize: 'Maïs', Millet: 'Mil', Olive: 'Olive', 'Palm oil': 'Palmier à huile', Pepper: 'Piment',
  Plantain: 'Banane plantain', Potato: 'Pomme de terre', Rice: 'Riz', Rubber: 'Hévéa', Sesame: 'Sésame',
  Sorghum: 'Sorgho', Soybean: 'Soja', Sugarbeet: 'Betterave sucrière', Sugarcane: 'Canne à sucre',
  Sunflower: 'Tournesol', Tea: 'Thé', Teff: 'Teff', Tobacco: 'Tabac', Tomato: 'Tomate', Wheat: 'Blé',
  'Wheat (Planalto)': 'Blé (Planalto)', 'Wine grape': 'Raisin de cuve', Yam: 'Igname',
});

const SEED_TYPES = Object.freeze({
  Certified: 'Certifiée', 'Certified tuber': 'Tubercule certifié',
  'Certified tuber seed': 'Semence de tubercule certifiée', GMO: 'OGM', Hybrid: 'Hybride',
  'Hybrid clone': 'Clone hybride', 'Hybrid, GMO': 'Hybride, OGM', 'Hybrid, IMI': 'Hybride, IMI',
  Improved: 'Améliorée', 'Local improved': 'Locale améliorée', OPV: 'Variété à pollinisation libre',
});

const SEED_NOTES = Object.freeze({
  'Bt + RR trait': 'Caractères Bt et RR',
  'Climate-smart bean variety': 'Variété de haricot adaptée au climat',
  'Dry zone variety': 'Variété de zone sèche',
  'Farmer-saved seed possible': 'Réutilisation de semences paysannes possible',
  'High yield, drought-tolerant': 'Haut rendement et tolérance à la sécheresse',
  'High-yielding teff variety': 'Variété de teff à haut rendement',
  "Kenya's most popular maize hybrid": 'Hybride de maïs le plus répandu au Kenya',
  'Locally bred': 'Sélectionnée localement',
  'Main durum wheat variety': 'Principale variété de blé dur',
  'Most popular Ethiopian maize hybrid': 'Hybride de maïs le plus répandu en Éthiopie',
  'Most popular groundnut variety': 'Variété d’arachide la plus répandue',
  'Most widely planted variety': 'Variété la plus cultivée',
  'Quality protein maize': 'Maïs à protéines de qualité',
});

const CHEMICAL_TYPES = Object.freeze({
  Fungicide: 'Fongicide', Herbicide: 'Herbicide', Insecticide: 'Insecticide',
  'Seed treatment': 'Traitement des semences',
});

const SUBSIDY_COPY = Object.freeze({
  NG: ['Agriculteurs inscrits au système de portefeuille électronique de l’ADP de leur État.', 'Distribution par les programmes de développement agricole des États; vérifier les modalités auprès du ministère de l’Agriculture de l’État.'],
  KE: ['Petits exploitants achetant auprès des dépôts du National Cereals and Produce Board.', 'CAN et DAP subventionnés selon les stocks saisonniers des dépôts NCPB.'],
  ZA: ['Pas de subvention directe aux intrants; le CASP finance surtout infrastructures et formation.', 'Des financements Land Bank et des aides CASP provinciales peuvent être disponibles selon le profil de l’exploitation.'],
  GH: ['Petits exploitants inscrits avec une Ghana Card.', 'Le programme PFJ subventionne certains engrais et semences; inscription auprès de l’unité agricole du district.'],
  EG: ['Agriculteurs inscrits disposant de titres fonciers, dans la limite indiquée par le programme.', 'Urée et superphosphate subventionnés via les coopératives agricoles; pièces d’identité et foncières requises.'],
  ET: ['Petits exploitants passant par les coopératives et agents de développement.', 'DAP et urée distribués par les unions coopératives dans le cadre du programme ATA.'],
  TZ: ['Petits exploitants enregistrés auprès du bureau agricole du ward.', 'Les bons saisonniers concernent notamment DAP, urée et semences de maïs; confirmer auprès de l’agent agricole du ward.'],
  UG: ['Groupes d’agriculteurs enregistrés dans le cadre du Parish Development Model.', 'Distribution via Operation Wealth Creation et appui PDM selon les règles locales en vigueur.'],
  RW: ['Membres de coopératives agricoles agréées passant par les SACCO.', 'DAP et urée subventionnés distribués via les SACCO agricoles; inscription au bureau agricole du secteur.'],
  CI: ['Producteurs de cacao et de café enregistrés.', 'Aide aux engrais ciblée cacao-café; pour les autres cultures, vérifier les possibilités de crédit auprès de l’ANADER.'],
  CM: ['Petits exploitants enregistrés via un groupe d’initiative commune.', 'Distribution du MINADER via les coopératives; dispositifs spécifiques de la SODECOTON pour les producteurs sous contrat.'],
  SN: ['Agriculteurs enregistrés dans les zones agricoles ciblées.', 'NPK et urée subventionnés via les organisations paysannes et les directions régionales du développement rural.'],
  MA: ['Petites exploitations enregistrées auprès des offices régionaux de mise en valeur agricole.', 'Programmes groupés et prix réduits selon l’ORMVA et les dispositifs nationaux; confirmer localement.'],
  TN: ['Agriculteurs enregistrés dans les bases du commissariat régional au développement agricole.', 'Le fonds FOSDAP soutient certaines semences certifiées et certains engrais via les bureaux régionaux.'],
  AO: ['Petits exploitants enregistrés auprès des services provinciaux du MINAGRIP.', 'Le programme rural cible certaines provinces; la disponibilité varie fortement selon la chaîne d’approvisionnement locale.'],
});

function behaviorFor(countryCode) {
  return BEHAVIOR[countryCode] || { fertilizerPerKgDecimals: 1, seedSortStrategy: 'pack-fallback-25' };
}

function renderHub(row, context = {}) {
  const countries = (context.familyRows || [])
    .filter(item => item.country)
    .sort((a, b) => a.country.frenchName.localeCompare(b.country.frenchName, 'fr'));
  if (countries.length !== 15) throw new Error('Input Prices hub requires exactly 15 manifest countries.');
  return renderFrenchAgriculturePage({
    row,
    title: 'Prix des intrants agricoles par pays | AfroTools',
    description: 'Comparez engrais, semences et produits phytosanitaires dans quinze pays avec les données pays maintenues.',
    heading: 'Prix des intrants agricoles',
    lead: 'Choisissez un pays pour comparer les prix du marché et les prix subventionnés maintenus.',
    artwork: row.artwork.file,
    body: `<style>@media(max-width:360px){.input-prices-hub-card h2{max-width:calc(100% - 8px);overflow-wrap:anywhere}}</style><section class="card"><h2>Choisissez le pays</h2><ul class="country-list">${countries.map(item => `<li><a href="${escapeHtml(item.french.route)}">${escapeHtml(item.country.frenchName)}</a> <span>(${item.country.code})</span></li>`).join('')}</ul></section>
<section class="card input-prices-hub-card"><h2>Portée et confidentialité</h2><p>Chaque application utilise le moteur partagé et les données canoniques de son pays. Les prix sont des repères statiques de planification, pas des devis en direct.</p><p><strong>Confidentialité :</strong> tous les calculs restent dans votre navigateur.</p></section>`,
    scripts: '',
    pageConfig: { id: row.english.id, family: 'input-prices' },
    familyLabel: 'Prix des intrants',
    familyRoute: '/fr/agriculture/input-prices/',
  });
}

function render(row) {
  if (!row.country) return renderHub(row, arguments[1]);
  const countryCode = row.country.code;
  const config = {
    id: row.english.id,
    countryCode,
    countryName: row.country.frenchName,
    locale: 'fr',
    behavior: behaviorFor(countryCode),
    crops: CROPS,
    seedTypes: SEED_TYPES,
    seedNotes: SEED_NOTES,
    chemicalTypes: CHEMICAL_TYPES,
    subsidyCopy: SUBSIDY_COPY[countryCode],
    dataReviewed: '2026-03-01',
  };
  const body = `<style>.input-prices-mobile{display:none;gap:10px}.input-price-card{border:1px solid var(--agri-border);border-radius:10px;padding:14px;min-width:0}.input-price-card strong,.input-price-card span{display:block;overflow-wrap:anywhere}.input-price-card span{color:var(--agri-muted);margin-top:5px}.input-price-card.cheapest{border-color:var(--agri-good)}#subsidyBox{overflow-wrap:anywhere}@media(max-width:480px){.input-prices-table{display:none}.input-prices-mobile{display:grid}}@media(max-width:360px){.input-prices-trust{grid-template-columns:minmax(0,1fr)}.input-prices-trust>*{min-width:0;overflow-wrap:anywhere}}</style><section class="card"><h2>Comparer les intrants</h2>
<form id="inputPricesForm" novalidate><div class="grid">
<div class="field"><label for="inputType">Catégorie</label><select id="inputType"><option value="all">Tous les intrants</option><option value="fertilizers">Engrais</option><option value="seeds">Semences</option><option value="agrochemicals">Produits phytosanitaires</option></select></div>
<div class="field" id="cropField"><label for="cropSel">Culture <small>(filtre les semences)</small></label><select id="cropSel"><option value="">Toutes les cultures</option></select></div>
<div class="field"><label for="farmSize">Surface de l’exploitation (ha)</label><input id="farmSize" type="number" min="0.1" step="0.1" value="2" inputmode="decimal"></div>
<div class="field"><label for="priceType">Type de prix</label><select id="priceType"><option value="market">Prix du marché</option><option value="subsidized">Prix subventionné, s’il existe</option></select></div>
</div><div class="actions"><button class="action primary" type="submit">Comparer les prix</button><button class="action" type="reset">Réinitialiser</button></div><p class="error" id="formError" role="alert" aria-live="assertive"></p></form></section>
<section class="card"><h2>Résultats</h2><div class="empty" id="emptyState">Aucune comparaison n’a encore été calculée.</div><div id="resultPanel" class="result-panel" hidden>
<section id="fertCard"><h3>Engrais</h3><div class="table-wrap input-prices-table"><table class="data-table" id="fertTable"></table></div><div id="fertMobile" class="input-prices-mobile" aria-label="Prix des engrais"></div></section>
<section id="seedCard"><h3>Semences</h3><p class="status" id="seedStatus" role="status"></p><div class="table-wrap input-prices-table"><table class="data-table" id="seedTable"></table></div><div id="seedMobile" class="input-prices-mobile" aria-label="Prix des semences"></div></section>
<section id="chemCard"><h3>Produits phytosanitaires</h3><div class="table-wrap input-prices-table"><table class="data-table" id="chemTable"></table></div><div id="chemMobile" class="input-prices-mobile" aria-label="Prix des produits phytosanitaires"></div></section>
<div class="result-grid" id="budgetGrid"></div><p id="premiumSummary"></p>
<div class="actions"><button class="action" type="button" data-action="copy">Copier</button><button class="action" type="button" data-action="share">Partager</button><button class="action" type="button" data-action="save">Enregistrer dans ce navigateur</button><button class="action" type="button" data-action="pdf">Exporter en PDF</button><button class="action" type="button" data-action="csv">Exporter en CSV</button><button class="action" type="button" data-action="json">Exporter en JSON</button><button class="action" type="button" data-action="txt">Exporter en TXT</button></div><p class="status" id="actionStatus" role="status" aria-live="polite"></p>
</div></section>
<section class="card"><h2>Subvention, sources et limites</h2><div id="subsidyBox"></div><div class="trust-grid input-prices-trust"><div class="trust-item"><strong>Source</strong><span>Données canoniques AfroTools : data/agriculture/input-prices-data.js et page pays anglaise correspondante.</span></div><div class="trust-item"><strong>Fraîcheur</strong><span>Révision statique du ${config.dataReviewed}; aucune donnée en direct.</span></div><div class="trust-item"><strong>Confiance</strong><span>Repère de planification; les prix, stocks et règles de subvention varient selon le lieu et la saison.</span></div></div><p>Confirmez prix, qualité, quantité et éligibilité auprès du fournisseur ou du service agricole compétent. Le résultat n’est ni un devis ni une recommandation agronomique.</p><p><strong>Confidentialité :</strong> aucune saisie envoyée à un serveur.</p></section>`;

  const scripts = `<script src="/data/agriculture/input-prices-data.js"></script><script src="/engines/input-prices-engine.js"></script><script src="/assets/vendor/jspdf/jspdf.umd.min.js"></script>
<script>(function(){'use strict';
var cfg=window.__FR_AGRI_PAGE__,engine=window.AfroTools&&window.AfroTools.InputPricesEngine,data=window.INPUT_PRICES,country=null,latest=null;
function id(x){return document.getElementById(x)}function option(v,l){var o=document.createElement('option');o.value=v;o.textContent=l;return o}function money(v){return new Intl.NumberFormat(cfg.locale,{style:'currency',currency:country.currency,maximumFractionDigits:0}).format(Number(v)||0)}function num(v,d){return new Intl.NumberFormat(cfg.locale,{maximumFractionDigits:d==null?1:d}).format(Number(v)||0)}function status(m,e){id('actionStatus').textContent=m;id('actionStatus').style.color=e?'var(--agri-danger)':'var(--agri-good)'}function dl(c,t,f){var u=URL.createObjectURL(new Blob([c],{type:t})),a=document.createElement('a');a.href=u;a.download=f;document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(u)},0)}function cell(v){var s=String(v==null?'':v);return /[",\\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s}function tr(values,cheap){var r=document.createElement('tr');if(cheap)r.className='cheapest';values.forEach(function(v){var c=document.createElement('td');c.textContent=v;r.appendChild(c)});return r}function tableHead(table,labels){var h=document.createElement('thead'),r=document.createElement('tr');labels.forEach(function(label){var c=document.createElement('th');c.scope='col';c.textContent=label;r.appendChild(c)});h.appendChild(r);var b=document.createElement('tbody');table.replaceChildren(h,b);return b}function inputCard(container,title,fields,cheap){var card=document.createElement('article'),heading=document.createElement('strong');card.className='input-price-card'+(cheap?' cheapest':'');heading.textContent=title;card.appendChild(heading);fields.forEach(function(entry){var line=document.createElement('span');line.textContent=entry[0]+' : '+entry[1];card.appendChild(line)});container.appendChild(card)}
function init(){if(!engine||!data||!data[cfg.countryCode])throw new Error('Moteur ou données de prix indisponibles.');country=data[cfg.countryCode];id('cropSel').replaceChildren(option('','Toutes les cultures'));country.crops.forEach(function(c){id('cropSel').appendChild(option(c,cfg.crops[c]||c))});id('inputType').value='all';id('farmSize').value='2';id('priceType').value='market';id('cropField').hidden=false}
function input(){return {countryCode:cfg.countryCode,inputType:id('inputType').value,crop:id('cropSel').value,farmSize:id('farmSize').value,priceMode:id('priceType').value}}
function report(){if(!latest)return null;var r=latest.result;return {schemaVersion:1,outil:'comparateur-prix-intrants',langue:'fr',pays:{code:cfg.countryCode,nom:cfg.countryName},entrees:r.input,resultat:{engrais:r.fertilizers.rows,semences:r.seeds.rows,produitsPhytosanitaires:r.agrochemicals.groups,budget:r.budget},subvention:r.subsidyProgram,sources:{proprietaire:'data/agriculture/input-prices-data.js',revision:cfg.dataReviewed,donneesEnDirect:false},confidentialite:'Calcul local; aucune saisie envoyée.'}}
function text(){if(!latest)return '';var r=latest.result,b=r.budget;return ['AfroTools — prix des intrants agricoles',cfg.countryName,'Catégorie : '+r.input.inputType,'Surface : '+num(r.input.farmSize)+' ha','Mode : '+(r.input.priceMode==='subsidized'?'prix subventionné si disponible':'prix du marché'),'Engrais : '+money(b.fertilizerSubtotal),'Semences : '+money(b.seedSubtotal),'Produits phytosanitaires : '+money(b.agrochemicalSubtotal),'Total : '+money(b.total),'Référence marques premium : '+money(b.premium),'Économie indicative : '+money(b.savings),'','Source : data/agriculture/input-prices-data.js','Révision statique : '+cfg.dataReviewed+'; aucune donnée en direct.','Confidentialité : calcul local.'].join('\\n')}
function render(r){id('fertCard').hidden=!r.visibility.fertilizers;id('seedCard').hidden=!r.visibility.seeds;id('chemCard').hidden=!r.visibility.agrochemicals;id('fertMobile').replaceChildren();id('seedMobile').replaceChildren();id('chemMobile').replaceChildren();
if(r.visibility.fertilizers){var fb=tableHead(id('fertTable'),['Produit et fournisseur','Sac','Prix du sac','Prix par kg','Coût par ha']);r.fertilizers.rows.forEach(function(x){var title=x.brand+' — '+x.supplier,bag=num(x.bagKg)+' kg',price=money(x.selectedPrice),perKg=money(x.perKg)+'/kg',perHa=money(x.perHa);fb.appendChild(tr([title,bag,price,perKg,perHa],x.isCheapest));inputCard(id('fertMobile'),title,[['Sac',bag],['Prix du sac',price],['Prix par kg',perKg],['Coût par ha',perHa]],x.isCheapest)})}
if(r.visibility.seeds){var sb=tableHead(id('seedTable'),['Culture et variété','Conditionnement','Prix','Type et note']);r.seeds.rows.forEach(function(x){var title=(cfg.crops[x.crop]||x.crop)+' — '+x.brand+' — '+x.supplier,pack=x.bagKg?num(x.bagKg)+' kg':(x.unit||'—'),price=money(x.price),note=(cfg.seedTypes[x.type]||x.type||'—')+(x.notes?' — '+(cfg.seedNotes[x.notes]||x.notes):'');sb.appendChild(tr([title,pack,price,note],x.isCheapest));inputCard(id('seedMobile'),title,[['Conditionnement',pack],['Prix',price],['Type et note',note]],x.isCheapest)});id('seedStatus').textContent=r.seeds.usedFallback?'Cette culture n’est pas maintenue dans le référentiel pays; toutes les semences disponibles sont affichées.':''}
if(r.visibility.agrochemicals){var cb=tableHead(id('chemTable'),['Type et produit','Conditionnement','Prix']);r.agrochemicals.groups.forEach(function(g){g.rows.forEach(function(x){var title=(cfg.chemicalTypes[x.type]||x.type)+' — '+x.brand,price=money(x.price);cb.appendChild(tr([title,x.size,price],x.isCheapestInType));inputCard(id('chemMobile'),title,[['Conditionnement',x.size],['Prix',price]],x.isCheapestInType)})})}
var b=r.budget,items=[['Engrais',b.fertilizerSubtotal],['Semences',b.seedSubtotal],['Produits phytosanitaires',b.agrochemicalSubtotal],['Total au coût minimal',b.total]];id('budgetGrid').replaceChildren();items.forEach(function(x){if(!x[1])return;var d=document.createElement('div');d.className='metric';var s=document.createElement('strong'),l=document.createElement('span');s.textContent=money(x[1]);l.textContent=x[0];d.append(s,l);id('budgetGrid').appendChild(d)});id('premiumSummary').textContent=b.total?'Référence marques premium : '+money(b.premium)+'; économie indicative : '+money(b.savings)+' (35 %).':'';var sp=r.subsidyProgram,sc=cfg.subsidyCopy||[];id('subsidyBox').textContent=sp&&sp.name?sp.name+' — '+(sp.subsidyPercent?sp.subsidyPercent+' % de réduction annoncée. ':'')+(sc[0]||'')+' '+(sc[1]||''):''}
function calculate(){id('formError').textContent='';var i=input(),ha=Number(i.farmSize);if(!Number.isFinite(ha)||ha<=0){id('formError').textContent='Saisissez une surface supérieure à zéro.';id('farmSize').focus();return null}var r=engine.calculate(i,country,data.appRates,cfg.behavior);if(!r.ok){id('formError').textContent='Le calcul n’est pas disponible pour ce pays.';return null}latest={input:i,result:r};window.__FR_AGRI_TEST__.latest=latest;render(r);id('emptyState').hidden=true;id('resultPanel').hidden=false;status('Comparaison calculée localement.');return r}
id('inputType').addEventListener('change',function(){id('cropField').hidden=!(this.value==='all'||this.value==='seeds')});id('inputPricesForm').addEventListener('submit',function(e){e.preventDefault();calculate()});id('inputPricesForm').addEventListener('reset',function(){setTimeout(function(){latest=null;window.__FR_AGRI_TEST__.latest=null;id('resultPanel').hidden=true;id('emptyState').hidden=false;id('actionStatus').textContent='';init()},0)});
document.addEventListener('click',function(e){var b=e.target.closest('[data-action]');if(!b)return;if(!latest)return status('Lancez d’abord une comparaison.',true);var a=b.dataset.action,o=report(),t=text(),slug='afrotools-prix-intrants-'+cfg.countryCode.toLowerCase();if(a==='copy')navigator.clipboard.writeText(t);if(a==='share')navigator.clipboard.writeText(location.href+'\\n\\n'+t);if(a==='save')localStorage.setItem('afrotools:fr-agriculture:input-prices:'+cfg.countryCode,JSON.stringify(o));if(a==='txt')dl('\\ufeff'+t,'text/plain;charset=utf-8',slug+'.txt');if(a==='json')dl(JSON.stringify(o,null,2),'application/json;charset=utf-8',slug+'.json');if(a==='csv'){var r=latest.result,x=[['pays','code_pays','surface_ha','mode_prix','sous_total_engrais','sous_total_semences','sous_total_phytosanitaires','total','reference_premium','economie','devise','revision','donnees_en_direct'],[cfg.countryName,cfg.countryCode,r.input.farmSize,r.input.priceMode,r.budget.fertilizerSubtotal,r.budget.seedSubtotal,r.budget.agrochemicalSubtotal,r.budget.total,r.budget.premium,r.budget.savings,country.currency,cfg.dataReviewed,'non']];dl('\\ufeff'+x.map(function(row){return row.map(cell).join(',')}).join('\\r\\n'),'text/csv;charset=utf-8',slug+'.csv')}if(a==='pdf'){var J=window.jspdf&&window.jspdf.jsPDF;if(!J)return status('Export PDF indisponible.',true);var d=new J({unit:'pt',format:'a4'});d.text(d.splitTextToSize(t.normalize('NFD').replace(/[\\u0300-\\u036f]/g,''),500),48,58);d.save(slug+'.pdf')}status(a==='save'?'Résultat enregistré dans ce navigateur.':'Action terminée.')});
window.__FR_AGRI_TEST__={calculate:calculate,latest:null,engine:engine,data:data,reportObject:report};try{init()}catch(error){id('formError').textContent=error.message;console.error(error)}})();</script>`;

  return renderFrenchAgriculturePage({
    row,
    title: `Prix des intrants agricoles — ${row.country.frenchName} | AfroTools`,
    description: `Comparez engrais, semences et produits phytosanitaires en ${row.country.frenchName}, au prix du marché ou subventionné.`,
    heading: `Prix des intrants — ${row.country.frenchName}`,
    lead: 'Comparez les produits du référentiel pays, estimez les quantités pour votre surface et exportez le budget.',
    artwork: row.artwork.file,
    body,
    scripts,
    pageConfig: config,
    familyLabel: 'Prix des intrants',
    familyRoute: '/fr/agriculture/input-prices/',
  });
}

module.exports = {
  id: 'input-prices',
  BEHAVIOR,
  CROPS,
  SEED_TYPES,
  SEED_NOTES,
  CHEMICAL_TYPES,
  SUBSIDY_COPY,
  behaviorFor,
  renderHub,
  render,
};
