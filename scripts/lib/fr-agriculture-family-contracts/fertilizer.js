'use strict';

const {
  renderFrenchAgriculturePage,
  escapeHtml,
  frenchFamilyRoute,
} = require('../fr-agriculture-page-shell');
const cropYieldContract = require('./crop-yield');

const PREVIOUS_CROPS = Object.freeze({
  none: 'Aucun, céréale ou autre',
  cowpea: 'Niébé',
  groundnut: 'Arachide',
  soybean: 'Soja',
  common_bean: 'Haricot commun',
  pigeon_pea: 'Pois d’Angole',
  chickpea: 'Pois chiche',
  lentils: 'Lentilles',
  fallow_grass: 'Jachère ou herbe',
});

function renderHub(row, context = {}) {
  const countryRows = (context.familyRows || [])
    .filter((candidate) => candidate.country)
    .sort((left, right) => left.country.frenchName.localeCompare(right.country.frenchName, 'fr'));
  if (countryRows.length !== 54) throw new Error(`Fertilizer hub requires 54 country routes; found ${countryRows.length}.`);
  const body = `
<style>@media(max-width:360px){.fertilizer-hub-card h2{overflow-wrap:anywhere}}</style>
<section class="card" aria-labelledby="countriesTitle">
  <h2 id="countriesTitle">Choisissez le pays du référentiel</h2>
  <p>Chaque page charge le moteur NPK maintenu et le référentiel pays correspondant. Les produits, prix, subventions, cultures et devises ne sont jamais déduits d’un autre pays.</p>
  <ul class="country-list">${countryRows.map((candidate) => `<li><a href="${escapeHtml(candidate.french.route)}">${escapeHtml(candidate.country.frenchName)}</a> <span>(${candidate.country.code})</span></li>`).join('')}</ul>
</section>
<section class="card fertilizer-hub-card">
  <h2>Une recommandation de planification</h2>
  <p>Le résultat estime les besoins N, P₂O₅ et K₂O, propose une liste de produits disponible dans le référentiel et présente un calendrier indicatif. Confirmez toujours la dose avec une analyse de sol et un agronome local.</p>
  <p><strong>Confidentialité :</strong> les calculs sont locaux au navigateur et aucune saisie n’est envoyée.</p>
</section>`;
  return renderFrenchAgriculturePage({
    row,
    title: 'Calculateurs d’engrais NPK par pays | AfroTools',
    description: 'Choisissez parmi 54 référentiels pays pour estimer en français des besoins indicatifs en engrais NPK.',
    heading: 'Calculateurs d’engrais NPK',
    lead: 'Sélectionnez un pays pour conserver ses cultures, produits, prix, subventions, unités et devise.',
    artwork: row.artwork.file,
    body,
    scripts: '',
    pageConfig: { id: row.english.id, frenchRoute: row.french.routeKey },
    familyLabel: 'Engrais NPK',
    familyRoute: '/fr/agriculture/fertilizer/',
  });
}

function render(row, context = {}) {
  if (!row.country) return renderHub(row, context);
  const presentation = {
    ...cropYieldContract.pagePresentation(row),
    ...cropYieldContract.sourceMetadata(row),
  };
  const displayName = presentation.shortName || presentation.name;
  const config = {
    id: row.english.id,
    countryCode: row.country.code,
    countryName: presentation.name,
    locale: presentation.locale,
    cropNames: cropYieldContract.CROP_NAMES,
    soilNames: cropYieldContract.SOIL_NAMES,
    regionNames: presentation.regions,
    previousCrops: PREVIOUS_CROPS,
    sourceLabel: presentation.source,
    dataReviewed: presentation.dataReviewed,
  };
  const cropYieldRoute = frenchFamilyRoute(context, 'crop-yield', row.country.code);
  const farmProfitRoute = frenchFamilyRoute(context, 'farm-profit', row.country.code);
  const body = `
<style>.fertilizer-products-mobile{display:none;gap:10px}.fertilizer-product-card{border:1px solid var(--agri-border);border-radius:10px;padding:14px;min-width:0}.fertilizer-product-card strong,.fertilizer-product-card span{display:block;overflow-wrap:anywhere}.fertilizer-product-card span{color:var(--agri-muted);margin-top:5px}@media(max-width:480px){.fertilizer-products-table{display:none}.fertilizer-products-mobile{display:grid}}</style>
<section class="card" aria-labelledby="calculatorTitle">
  <h2 id="calculatorTitle">Estimer les besoins en engrais</h2>
  <p>Choisissez une culture disposant d’une méthode d’exportation des nutriments maintenue. Une analyse de sol améliore l’estimation.</p>
  <form id="fertilizerForm" novalidate>
    <div class="grid">
      <div class="field"><label for="crop">Culture</label><select id="crop" required></select><small>Seules les cultures couvertes par le moteur sont proposées.</small></div>
      <div class="field"><label for="region">Zone agricole</label><select id="region" required></select></div>
      <div class="field"><label for="farmSize">Superficie de l’exploitation (hectares)</label><input id="farmSize" type="number" min="0.1" step="0.1" required></div>
      <div class="field"><label for="targetYield">Rendement visé (tonnes/ha)</label><input id="targetYield" type="number" min="0.1" step="0.1" placeholder="Calcul automatique"></div>
      <div class="field"><label for="soil">Type de sol</label><select id="soil" required></select></div>
      <div class="field"><label for="previousCrop">Culture précédente — crédit azoté</label><select id="previousCrop"></select></div>
      <div class="field"><label for="organicMatter">Matière organique du sol (%) — facultatif</label><input id="organicMatter" type="number" min="0" step="0.1"></div>
      <div class="field"><label for="phosphorus">Phosphore Olsen (ppm) — facultatif</label><input id="phosphorus" type="number" min="0" step="0.1"></div>
      <div class="field"><label for="potassium">Potassium disponible (ppm) — facultatif</label><input id="potassium" type="number" min="0" step="0.1"></div>
    </div>
    <div class="actions"><button class="action primary" type="submit">Calculer les besoins NPK</button><button class="action" type="reset">Réinitialiser</button></div>
    <p class="error" id="formError" role="alert" aria-live="assertive"></p>
  </form>
</section>
<section class="card" aria-labelledby="resultsTitle">
  <h2 id="resultsTitle">Résultat</h2>
  <div class="empty" id="emptyState">Aucun résultat n’est encore enregistré. Remplissez le formulaire puis lancez le calcul.</div>
  <div class="result-panel" id="resultPanel" hidden>
    <div class="result-grid">
      <div class="metric"><strong id="nitrogen">—</strong><span>Azote N (kg/ha)</span></div>
      <div class="metric"><strong id="phosphorusResult">—</strong><span>Phosphore P₂O₅ (kg/ha)</span></div>
      <div class="metric"><strong id="potassiumResult">—</strong><span>Potassium K₂O (kg/ha)</span></div>
    </div>
    <h3>Produits et quantités</h3><div class="table-wrap fertilizer-products-table"><table class="data-table"><thead><tr><th>Produit</th><th>Sacs</th><th>Poids</th><th>Coût indicatif</th></tr></thead><tbody id="productRows"></tbody></table></div><div id="productCards" class="fertilizer-products-mobile" aria-label="Produits et quantités"></div>
    <p id="productEmpty" class="empty" hidden>Aucun produit d’engrais n’est renseigné dans ce référentiel pays. Consultez un fournisseur local.</p>
    <div class="result-grid">
      <div class="metric"><strong id="marketCost">—</strong><span>Coût indicatif au prix du référentiel</span></div>
      <div class="metric"><strong id="subsidyCost">—</strong><span>Coût indicatif subventionné</span></div>
      <div class="metric"><strong id="savings">—</strong><span>Économie indicative</span></div>
    </div>
    <h3>Calendrier d’application indicatif</h3><ol id="schedule"></ol>
    <h3>Équivalents organiques indicatifs</h3><ul id="organic"></ul>
    <p id="subsidyNote"></p>
    <div class="actions" aria-label="Actions sur le résultat">
      <button class="action" type="button" data-action="copy">Copier</button><button class="action" type="button" data-action="share">Partager</button><button class="action" type="button" data-action="save">Enregistrer dans ce navigateur</button>
      <button class="action" type="button" data-action="pdf">Exporter en PDF</button><button class="action" type="button" data-action="csv">Exporter en CSV</button><button class="action" type="button" data-action="json">Exporter en JSON</button><button class="action" type="button" data-action="txt">Exporter en TXT</button>
    </div>
    <p class="status" id="actionStatus" role="status" aria-live="polite"></p>
  </div>
</section>
<section class="card">
  <h2>Sources, fraîcheur et limites</h2>
  <div class="trust-grid">
    <div class="trust-item"><strong>Sources</strong><span>${escapeHtml(presentation.source)}</span></div>
    <div class="trust-item"><strong>Fraîcheur déclarée</strong><span>Référentiel statique indiqué comme mis à jour en ${escapeHtml(presentation.dataReviewed)}. Aucune donnée en direct.</span></div>
    <div class="trust-item"><strong>Confiance</strong><span>Estimation de planification à confirmer par analyse de sol et conseil agronomique local.</span></div>
  </div>
  <p><strong>Confidentialité :</strong> le calcul, la copie et les exports sont effectués dans ce navigateur. Aucune saisie n’est envoyée à un serveur.</p>
  <p>Les prix et subventions viennent du référentiel pays maintenu et peuvent avoir changé. Ce résultat n’est ni une prescription officielle ni une garantie de disponibilité.</p>
</section>
<section class="card"><h2>Poursuivre</h2><p><a href="${escapeHtml(cropYieldRoute)}">Estimer le rendement</a> · <a href="${escapeHtml(farmProfitRoute)}">Estimer la rentabilité</a> · <a href="/fr/agriculture/">Outils agricoles en français</a></p></section>`;

  const scripts = `
<script src="/data/agriculture/crop-database.js"></script>
<script src="/data/agriculture/${row.country.code.toLowerCase()}-agri-data.js"></script>
<script src="/engines/fertilizer-engine.js"></script>
<script src="/assets/vendor/jspdf/jspdf.umd.min.js"></script>
<script>
(function(){
  'use strict';
  var cfg=window.__FR_AGRI_PAGE__,data=window.AfroTools&&window.AfroTools.countryData,cropDatabase=window.AfroTools&&window.AfroTools.cropDatabase,engine=window.AfroTools&&window.AfroTools.FertilizerEngine,latest=null;
  function byId(id){return document.getElementById(id);}
  function option(value,label){var node=document.createElement('option');node.value=value;node.textContent=label;return node;}
  function number(value){return new Intl.NumberFormat(cfg.locale,{maximumFractionDigits:2}).format(Number(value)||0);}
  function currency(value){return new Intl.NumberFormat(cfg.locale,{style:'currency',currency:data.currency,maximumFractionDigits:0}).format(Number(value)||0);}
  function cropName(id,fallback){return cfg.cropNames[id]||fallback||id;}
  function productName(value){return String(value||'').replace(/\\bUrea\\b/gi,'Urée').replace(/Ammonium Sulphate/gi,'Sulfate d’ammonium').replace(/Single Super Phosphate/gi,'Superphosphate simple').replace(/Muriate of Potash/gi,'Chlorure de potassium');}
  function organicName(value){return {cattle_manure:'Fumier bovin',poultry_manure:'Fumier de volaille',compost:'Compost'}[value]||'Matière organique';}
  function scheduleName(index){return ['Apport de fond au semis','Premier apport de couverture','Deuxième apport de couverture'][index]||'Apport complémentaire';}
  function scheduleTiming(index,item){if(index===0)return 'Au semis ou juste avant';var weeks=String(item.timing||'').match(/\\d+/);return (weeks?weeks[0]:'Quelques')+' semaines après le semis';}
  function scheduleNote(index){return index===0?'Incorporer tout le phosphore et le potassium dans le sol, sans contact direct avec les semences.':index===1?'Appliquer l’azote le long des rangs sans toucher les feuilles.':'Appliquer le dernier apport azoté au stade de floraison ou de remplissage.';}
  function download(content,type,fileName){var url=URL.createObjectURL(new Blob([content],{type:type})),link=document.createElement('a');link.href=url;link.download=fileName;document.body.appendChild(link);link.click();link.remove();setTimeout(function(){URL.revokeObjectURL(url);},0);}
  function csvCell(value){var text=String(value==null?'':value);return /[",\\r\\n]/.test(text)?'"'+text.replace(/"/g,'""')+'"':text;}
  function copyText(text){if(navigator.clipboard&&navigator.clipboard.writeText)return navigator.clipboard.writeText(text);var area=document.createElement('textarea');area.value=text;document.body.appendChild(area);area.select();document.execCommand('copy');area.remove();return Promise.resolve();}
  function status(message,isError){byId('actionStatus').textContent=message;byId('actionStatus').style.color=isError?'var(--agri-danger)':'var(--agri-good)';}
  function frenchResult(){
    if(!latest)return null;var r=latest.result;
    return {culture:cropName(r.cropId,r.cropName),zone:cfg.regionNames[latest.input.regionId]||r.regionName,superficieHa:r.farmSizeHa,rendementViseTonnesHa:r.targetYieldPerHa,besoinParHa:r.perHa,besoinTotal:r.totalNPK,produits:r.products.map(function(item){return {nom:productName(item.name),sacs:item.bags,poidsKg:item.totalWeight_kg,coutIndicatif:item.totalCostMarket};}),calendrier:r.schedule.map(function(item,index){return {etape:scheduleName(index),moment:scheduleTiming(index,item),conseil:scheduleNote(index),nutriments:item.nutrients};}),equivalentsOrganiques:r.organic.map(function(item){return {type:organicName(item.type),tonnes:item.tonnes};}),coutMarche:r.costMarket,coutSubventionne:r.costSubsidy,economie:r.savings,devise:r.currency};
  }
  function reportObject(){return latest?{schemaVersion:1,outil:'engrais-npk',langue:'fr',pays:{code:cfg.countryCode,nom:cfg.countryName},genereLe:new Date().toISOString(),entrees:latest.input,resultat:frenchResult(),sources:{libelle:cfg.sourceLabel,fraicheur:cfg.dataReviewed,donneesEnDirect:false},confidentialite:'Calcul local dans le navigateur; aucune saisie envoyée.'}:null;}
  function reportText(){var r=frenchResult();if(!r)return '';var lines=['AfroTools — estimation des besoins en engrais',cfg.countryName,'Culture : '+r.culture,'Zone : '+r.zone,'Superficie : '+number(r.superficieHa)+' ha','N : '+number(r.besoinParHa.N)+' kg/ha','P₂O₅ : '+number(r.besoinParHa.P)+' kg/ha','K₂O : '+number(r.besoinParHa.K)+' kg/ha','Coût indicatif : '+currency(r.coutMarche),''];r.produits.forEach(function(item){lines.push(item.nom+' : '+item.sacs+' sacs, '+number(item.poidsKg)+' kg, '+currency(item.coutIndicatif));});lines.push('','Sources : '+cfg.sourceLabel,'Fraîcheur : référentiel statique '+cfg.dataReviewed+', aucune donnée en direct.','Limite : estimation à confirmer par analyse de sol et conseil agronomique.','Confidentialité : calcul local dans ce navigateur.');return lines.join('\\n');}
  function updateSoils(){var region=data.regions.find(function(item){return item.id===byId('region').value;}),soil=byId('soil');soil.innerHTML='';(region&&region.soilTypes||[]).forEach(function(id){soil.appendChild(option(id,cfg.soilNames[id]||id));});}
  function initialize(){
    if(!data||!cropDatabase||!engine)throw new Error('Le moteur ou les données d’engrais ne sont pas disponibles.');
    data.crops.filter(function(item){return item.nutrientUptake||(cropDatabase.crops[item.id]&&cropDatabase.crops[item.id].nutrientUptake);}).forEach(function(item){var local=item.localNames&&item.localNames.length?' — '+item.localNames.join(', '):'';byId('crop').appendChild(option(item.id,cropName(item.id,item.name)+local));});
    data.regions.forEach(function(item){byId('region').appendChild(option(item.id,cfg.regionNames[item.id]||item.name));});byId('region').addEventListener('change',updateSoils);updateSoils();
    Object.keys(cfg.previousCrops).forEach(function(id){byId('previousCrop').appendChild(option(id,cfg.previousCrops[id]));});byId('farmSize').value=data.agriStats.avgFarmSizeHa||1;
    if(!byId('crop').options.length)throw new Error('Aucune culture couverte par la méthode NPK dans ce référentiel.');
  }
  function calculate(){
    byId('formError').textContent='';var farmSize=Number(byId('farmSize').value),target=byId('targetYield').value?Number(byId('targetYield').value):null;
    if(!Number.isFinite(farmSize)||farmSize<0.1){byId('formError').textContent='Saisissez une superficie valide d’au moins 0,1 hectare.';byId('farmSize').focus();return null;}
    if(target!==null&&(!Number.isFinite(target)||target<0.1)){byId('formError').textContent='Le rendement visé doit être supérieur ou égal à 0,1 tonne par hectare.';byId('targetYield').focus();return null;}
    var soilTest={organicMatter:Number(byId('organicMatter').value)||0,P_ppm:Number(byId('phosphorus').value)||0,K_ppm:Number(byId('potassium').value)||0};
    var input={cropId:byId('crop').value,regionId:byId('region').value,farmSizeHa:farmSize,targetYieldPerHa:target,soilType:byId('soil').value,previousCrop:byId('previousCrop').value,soilTest:soilTest};
    var result=engine.calculate(input,data,cropDatabase);if(result.error){byId('formError').textContent='Le calcul NPK n’a pas pu être effectué pour cette sélection.';return null;}latest={input:input,result:result};window.__FR_AGRI_TEST__.latest=latest;
    byId('emptyState').hidden=true;byId('resultPanel').hidden=false;byId('nitrogen').textContent=number(result.perHa.N);byId('phosphorusResult').textContent=number(result.perHa.P);byId('potassiumResult').textContent=number(result.perHa.K);
    var products=byId('productRows'),productCards=byId('productCards');products.innerHTML='';productCards.innerHTML='';result.products.forEach(function(item){var name=productName(item.name),bags=number(item.bags),weight=number(item.totalWeight_kg)+' kg',cost=currency(item.totalCostMarket),row=document.createElement('tr');row.innerHTML='<td>'+name+'</td><td>'+bags+'</td><td>'+weight+'</td><td>'+cost+'</td>';products.appendChild(row);var card=document.createElement('article'),heading=document.createElement('strong'),bagText=document.createElement('span'),weightText=document.createElement('span'),costText=document.createElement('span');card.className='fertilizer-product-card';heading.textContent=name;bagText.textContent='Sacs : '+bags;weightText.textContent='Poids : '+weight;costText.textContent='Coût indicatif : '+cost;card.append(heading,bagText,weightText,costText);productCards.appendChild(card);});byId('productEmpty').hidden=!!result.products.length;
    byId('marketCost').textContent=currency(result.costMarket);byId('subsidyCost').textContent=result.costSubsidy==null?'Non renseigné':currency(result.costSubsidy);byId('savings').textContent=result.costSubsidy==null?'Non renseigné':currency(result.savings);
    var schedule=byId('schedule');schedule.innerHTML='';result.schedule.forEach(function(item,index){var li=document.createElement('li');li.textContent=scheduleName(index)+' — '+scheduleTiming(index,item)+'. '+scheduleNote(index);schedule.appendChild(li);});
    var organic=byId('organic');organic.innerHTML='';result.organic.forEach(function(item){var li=document.createElement('li');li.textContent=organicName(item.type)+' : '+number(item.tonnes)+' tonnes environ';organic.appendChild(li);});
    byId('subsidyNote').textContent=result.subsidyInfo&&result.subsidyInfo.active?'Le référentiel signale un programme actif (« '+result.subsidyInfo.programName+' »). Vérifiez l’éligibilité, le prix et la disponibilité auprès de l’organisme local.':'Aucun programme de subvention actif n’est indiqué dans ce référentiel.';
    status('Estimation NPK calculée localement.');return result;
  }
  byId('fertilizerForm').addEventListener('submit',function(event){event.preventDefault();calculate();});
  byId('fertilizerForm').addEventListener('reset',function(){setTimeout(function(){latest=null;window.__FR_AGRI_TEST__.latest=null;byId('resultPanel').hidden=true;byId('emptyState').hidden=false;byId('formError').textContent='';byId('farmSize').value=data.agriStats.avgFarmSizeHa||1;byId('region').selectedIndex=0;updateSoils();status('Formulaire réinitialisé.');},0);});
  document.addEventListener('click',function(event){var button=event.target.closest('[data-action]');if(!button)return;if(!latest){status('Lancez d’abord un calcul.',true);return;}var action=button.dataset.action,object=reportObject(),text=reportText(),slug='afrotools-engrais-'+cfg.countryCode.toLowerCase();
    if(action==='copy')copyText(text).then(function(){status('Résultat copié.');});
    if(action==='share'){if(navigator.share)navigator.share({title:'Besoins en engrais — '+cfg.countryName,text:text,url:location.href}).catch(function(){});else copyText(location.href+'\\n\\n'+text).then(function(){status('Lien et résultat copiés pour le partage.');});}
    if(action==='save')try{localStorage.setItem('afrotools:fr-agriculture:fertilizer:'+cfg.countryCode,JSON.stringify(object));status('Résultat enregistré dans ce navigateur.');}catch(error){status('L’enregistrement local est bloqué.',true);}
    if(action==='txt'){download('\\ufeff'+text,'text/plain;charset=utf-8',slug+'.txt');status('Export TXT téléchargé.');}
    if(action==='json'){download(JSON.stringify(object,null,2),'application/json;charset=utf-8',slug+'.json');status('Export JSON téléchargé.');}
    if(action==='csv'){var r=frenchResult(),rows=[['pays','code_pays','culture','zone','superficie_ha','n_kg_ha','p2o5_kg_ha','k2o_kg_ha','devise','cout_indicatif','donnees_en_direct'],[cfg.countryName,cfg.countryCode,r.culture,r.zone,r.superficieHa,r.besoinParHa.N,r.besoinParHa.P,r.besoinParHa.K,r.devise,r.coutMarche,'non']];download('\\ufeff'+rows.map(function(row){return row.map(csvCell).join(',');}).join('\\r\\n'),'text/csv;charset=utf-8',slug+'.csv');status('Export CSV téléchargé.');}
    if(action==='pdf'){var JsPdf=window.jspdf&&window.jspdf.jsPDF;if(!JsPdf){status('L’export PDF est indisponible.',true);return;}var doc=new JsPdf({unit:'pt',format:'a4'}),printable=text.normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').replace(/[’‘]/g,\"'\").replace(/[—–]/g,'-');doc.text(doc.splitTextToSize(printable,500),48,58);doc.save(slug+'.pdf');status('Export PDF téléchargé.');}
  });
  window.__FR_AGRI_TEST__={calculate:calculate,latest:null,engine:engine,data:data,config:cfg,reportObject:reportObject};try{initialize();}catch(error){byId('formError').textContent=error.message;console.error(error);}
})();
</script>`;

  return renderFrenchAgriculturePage({
    row,
    title: `Calculateur d’engrais NPK — ${presentation.name} | AfroTools`,
    description: `Estimez les besoins N, P₂O₅ et K₂O, les produits et les coûts indicatifs pour ${presentation.name} avec le référentiel ${row.country.code}.`,
    heading: `Calculateur d’engrais NPK — ${displayName}`,
    lead: `Planifiez des besoins en nutriments et des produits indicatifs avec les cultures, produits, prix et subventions du référentiel ${row.country.code}.`,
    artwork: row.artwork.file,
    body,
    scripts,
    pageConfig: config,
    familyLabel: 'Engrais NPK',
    familyRoute: '/fr/agriculture/fertilizer/',
  });
}

module.exports = {
  id: 'fertilizer',
  PREVIOUS_CROPS,
  renderHub,
  render,
};
