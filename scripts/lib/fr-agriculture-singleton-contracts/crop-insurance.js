'use strict';

const { renderFrenchAgriculturePage } = require('../fr-agriculture-page-shell');

const COVERED = Object.freeze(['NG', 'KE', 'ZA', 'GH', 'EG', 'ET', 'TZ', 'UG', 'RW', 'CI', 'CM', 'SN', 'MA', 'TN', 'AO']);
const META = Object.freeze({
  NG: { flag: '🇳🇬', slug: 'nigeria', region: 'west_africa' },
  GH: { flag: '🇬🇭', slug: 'ghana', region: 'west_africa' },
  CI: { flag: '🇨🇮', slug: 'cote-d-ivoire', region: 'west_africa' },
  SN: { flag: '🇸🇳', slug: 'senegal', region: 'west_africa' },
  KE: { flag: '🇰🇪', slug: 'kenya', region: 'east_africa' },
  ET: { flag: '🇪🇹', slug: 'ethiopia', region: 'east_africa' },
  TZ: { flag: '🇹🇿', slug: 'tanzania', region: 'east_africa' },
  UG: { flag: '🇺🇬', slug: 'uganda', region: 'east_africa' },
  RW: { flag: '🇷🇼', slug: 'rwanda', region: 'east_africa' },
  CM: { flag: '🇨🇲', slug: 'cameroon', region: 'central_africa' },
  ZA: { flag: '🇿🇦', slug: 'south-africa', region: 'southern_africa' },
  AO: { flag: '🇦🇴', slug: 'angola', region: 'southern_africa' },
  EG: { flag: '🇪🇬', slug: 'egypt', region: 'north_africa' },
  MA: { flag: '🇲🇦', slug: 'morocco', region: 'north_africa' },
  TN: { flag: '🇹🇳', slug: 'tunisia', region: 'north_africa' },
});
const REGION_ORDER = Object.freeze(['west_africa', 'east_africa', 'central_africa', 'southern_africa', 'north_africa']);
const REGION_LABELS = Object.freeze({
  west_africa: 'Afrique de l’Ouest',
  east_africa: 'Afrique de l’Est',
  central_africa: 'Afrique centrale',
  southern_africa: 'Afrique australe',
  north_africa: 'Afrique du Nord',
});
const COUNTRY_NAMES = Object.freeze({ NG: 'Nigeria', KE: 'Kenya', ZA: 'Afrique du Sud', GH: 'Ghana', EG: 'Égypte', ET: 'Éthiopie', TZ: 'Tanzanie', UG: 'Ouganda', RW: 'Rwanda', CI: 'Côte d’Ivoire', CM: 'Cameroun', SN: 'Sénégal', MA: 'Maroc', TN: 'Tunisie', AO: 'Angola' });

function options(map) {
  return Object.entries(map).map(([value, label]) => `<option value="${value}">${label}</option>`).join('');
}

function render(row) {
  const pageConfig = {
    id: row.english.id,
    covered: COVERED,
    metadata: META,
    regionOrder: REGION_ORDER,
    regionLabels: REGION_LABELS,
    countryNames: COUNTRY_NAMES,
  };
  const body = `<section class="card"><h2>Contexte pays du référentiel</h2><div class="grid"><div class="field"><label for="country">Pays (contexte facultatif)</label><select id="country"><option value="">Sans pays</option>${options(COUNTRY_NAMES)}</select><small>Ce choix n’applique aucun tarif, subvention, franchise, garantie ou règle pays au calcul générique.</small></div><div class="field"><label for="directorySearch">Filtrer les 15 pays du référentiel</label><input id="directorySearch" type="search" placeholder="Ex. Sénégal, SN" autocomplete="off"><small id="directoryStatus" role="status" aria-live="polite">15 pays disponibles.</small></div></div><div id="directory" class="country-list" aria-label="Pays couverts par le référentiel statique"></div><p id="countryContext" class="status" role="status" aria-live="polite"></p></section>
<section class="card"><h2>Prime et excédent à charge</h2><form id="insuranceForm" novalidate><div class="grid">
<div class="field"><label for="currency">Devise d’affichage</label><select id="currency"><option value="NGN">NGN</option><option value="KES">KES</option><option value="GHS">GHS</option><option value="ZAR">ZAR</option></select><small>Les quatre devises sont celles du formulaire anglais accepté.</small></div>
<div class="field"><label for="farmValue">Valeur assurée de l’exploitation</label><input id="farmValue" type="number" min="0" step="any" value="750000"></div>
<div class="field"><label for="premiumRate">Taux de prime (%)</label><input id="premiumRate" type="number" min="0" max="100" step="any" value="5"></div>
<div class="field"><label for="excess">Excédent / part restant à charge (%)</label><input id="excess" type="number" min="0" max="100" step="any" value="10"><small>Le modèle multiplie ce taux par la valeur assurée; il ne calcule pas une indemnité.</small></div>
</div><div class="actions"><button class="action primary" type="submit">Estimer la prime et la part à charge</button><button class="action" type="reset">Réinitialiser</button></div><p class="error" id="error" role="alert" aria-live="assertive"></p></form></section>
<section class="card"><h2>Résultats</h2><div class="empty" id="empty">Aucune estimation calculée.</div><div id="resultPanel" class="result-panel" hidden><div class="result-hero"><div class="result-value" id="headline"></div><p id="lead"></p></div><div class="result-grid"><div class="metric"><strong id="insuredValue"></strong><span>Valeur assurée saisie</span></div><div class="metric"><strong id="premium"></strong><span>Prime estimée</span></div><div class="metric"><strong id="retained"></strong><span>Part à charge au taux saisi</span></div></div>
<div class="actions"><button class="action" type="button" data-action="copy">Copier</button><button class="action" type="button" data-action="share">Partager</button><button class="action" type="button" data-action="save">Enregistrer dans ce navigateur</button><button class="action" type="button" data-action="pdf">Exporter en PDF</button><button class="action" type="button" data-action="csv">Exporter en CSV</button><button class="action" type="button" data-action="json">Exporter en JSON</button><button class="action" type="button" data-action="txt">Exporter en TXT</button></div><p class="status" id="status" role="status" aria-live="polite"></p></div></section>
<section class="card"><h2>Sources, fraîcheur et limites</h2><div class="trust-grid"><div class="trust-item"><strong>Méthode</strong><span>Prime = valeur assurée × taux de prime; part à charge = valeur assurée × taux saisi, selon le workflow anglais accepté.</span></div><div class="trust-item"><strong>Données pays</strong><span>crop-insurance-data.js contient 15 identités et scénarios de programmes statiques non datés; ils ne pilotent pas ce calcul générique.</span></div><div class="trust-item"><strong>Confiance</strong><span>Simple feuille de préparation, pas un devis, une recommandation, une éligibilité ni une estimation d’indemnité.</span></div></div><p>Vérifiez directement avec l’assureur la valeur reconnue, la prime, la subvention, la franchise, l’excédent, les périls couverts, les déclencheurs, les exclusions, la carence, les preuves, le délai et le mécanisme d’indemnisation. Aucune offre, disponibilité, subvention ou règle n’est vérifiée en direct.</p><p>Les 15 sous-routes pays anglaises et françaises existantes sont hors de la ligne manifeste acceptée ici; elles restent intactes et non comptées.</p><p><strong>Confidentialité :</strong> calcul et exports locaux; aucune saisie envoyée à un serveur.</p></section>`;
  const scripts = `<script src="/data/agriculture/crop-insurance-data.js"></script><script src="/engines/crop-insurance-hub-engine.js"></script><script src="/assets/vendor/jspdf/jspdf.umd.min.js"></script><script>(function(){'use strict';var cfg=window.__FR_AGRI_PAGE__,data=window.AfroTools.cropInsuranceData,engine=window.AfroTools.CropInsuranceHubEngine,directory=engine.buildCountryDirectory(data,cfg.covered,cfg.metadata,cfg.regionOrder,cfg.regionLabels),latest=null;
if(!directory.ok)throw new Error('Répertoire assurance récolte invalide : '+directory.status);function id(v){return document.getElementById(v)}function num(v){return Number(id(v).value)}function money(v,c){return c+' '+new Intl.NumberFormat('fr-FR',{maximumFractionDigits:2}).format(v)}function cell(v){var t=String(v==null?'':v);return/[",\\n]/.test(t)?'"'+t.replace(/"/g,'""')+'"':t}function dl(c,t,n){var u=URL.createObjectURL(new Blob([c],{type:t})),a=document.createElement('a');a.href=u;a.download=n;document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(u)},0)}function status(v,e){id('status').textContent=v;id('status').style.color=e?'var(--agri-danger)':'var(--agri-good)'}
function renderDirectory(query){var needle=String(query||'').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase(),rows=directory.rows.filter(function(row){return!needle||[row.code,cfg.countryNames[row.code],row.slug].join(' ').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase().includes(needle)});id('directory').replaceChildren();rows.forEach(function(row){var b=document.createElement('button');b.type='button';b.className='action';b.dataset.code=row.code;b.textContent=row.flag+' '+cfg.countryNames[row.code]+' · '+row.programCount+' programme'+(row.programCount>1?'s':'')+' statique'+(row.programCount>1?'s':'');id('directory').appendChild(b)});id('directoryStatus').textContent=rows.length+' pays correspondant'+(rows.length>1?'s':'')+'.'}function selectCountry(code){id('country').value=code;var result=engine.selectCountry(directory,code);if(!result.ok){id('countryContext').textContent='Aucun contexte pays sélectionné.';return}var c=result.country;id('countryContext').textContent=cfg.countryNames[c.code]+' · '+c.currency+' · '+c.programCount+' scénario'+(c.programCount>1?'s':'')+' de programme dans le fichier statique. Aucun statut actuel n’est affirmé.';if(['NGN','KES','GHS','ZAR'].includes(c.currency))id('currency').value=c.currency}
function input(){return{currency:id('currency').value,farmValue:num('farmValue'),premiumRate:num('premiumRate'),excess:num('excess')}}function calculate(){id('error').textContent='';var values=input(),numbers=[values.farmValue,values.premiumRate,values.excess];if(numbers.some(function(v){return!Number.isFinite(v)})){id('error').textContent='Complétez chaque champ avec un nombre valide.';return null}if(numbers.some(function(v){return v<0})){id('error').textContent='Les valeurs ne peuvent pas être négatives.';return null}if(values.premiumRate>100){id('error').textContent='Le taux de prime ne peut pas dépasser 100 %.';id('premiumRate').focus();return null}if(values.excess>100){id('error').textContent='Le taux de part à charge ne peut pas dépasser 100 %.';id('excess').focus();return null}latest=engine.calculate(values);latest.countryCode=id('country').value||null;window.__FR_AGRI_TEST__.latest=latest;id('headline').textContent=money(latest.premium,latest.input.currency);id('lead').textContent='Prime arithmétique selon le taux saisi; ce résultat n’est pas un devis.';id('insuredValue').textContent=money(latest.input.farmValue,latest.input.currency);id('premium').textContent=money(latest.premium,latest.input.currency);id('retained').textContent=money(latest.retainedExcess,latest.input.currency);id('empty').hidden=true;id('resultPanel').hidden=false;status('Estimation calculée localement.');return latest}
function report(){return latest?{schemaVersion:1,outil:'assurance-recolte',langue:'fr',pays:latest.countryCode?{code:latest.countryCode,nom:cfg.countryNames[latest.countryCode]}:null,entrees:latest.input,resultat:{prime:latest.premium,partACharge:latest.retainedExcess},sources:{donnees:'data/agriculture/crop-insurance-data.js',moteur:'engines/src/crop-insurance-hub-engine.js',donneesEnDirect:false},limitations:['Calcul générique; les programmes pays statiques ne pilotent pas le taux ou le résultat.','Pas un devis, une éligibilité, une recommandation ou une indemnité.'],confidentialite:'Calcul local; aucune saisie envoyée.'}:null}function text(){return latest?['AfroTools — Assurance récolte',latest.countryCode?cfg.countryNames[latest.countryCode]:'Sans contexte pays','Valeur assurée : '+money(latest.input.farmValue,latest.input.currency),'Taux de prime : '+latest.input.premiumRate+' %','Prime estimée : '+money(latest.premium,latest.input.currency),'Part à charge au taux saisi : '+money(latest.retainedExcess,latest.input.currency),'','Calcul générique; aucun tarif, programme, péril, subvention ou statut pays vérifié en direct.','Pas un devis ni une indemnité.','Confidentialité : calcul local.'].join('\\n'):''}
id('directorySearch').addEventListener('input',function(){renderDirectory(this.value)});id('directory').addEventListener('click',function(e){var b=e.target.closest('[data-code]');if(b)selectCountry(b.dataset.code)});id('country').addEventListener('change',function(){selectCountry(this.value)});id('insuranceForm').addEventListener('submit',function(e){e.preventDefault();calculate()});id('insuranceForm').addEventListener('reset',function(){setTimeout(function(){latest=null;window.__FR_AGRI_TEST__.latest=null;id('empty').hidden=false;id('resultPanel').hidden=true;id('error').textContent='';status('')},0)});document.addEventListener('click',function(e){var b=e.target.closest('[data-action]');if(!b)return;if(!latest)return status('Calculez d’abord une estimation.',true);var a=b.dataset.action,v=report(),s=text(),slug='afrotools-assurance-recolte';if(a==='copy')navigator.clipboard.writeText(s);if(a==='share')navigator.clipboard.writeText(location.href+'\\n\\n'+s);if(a==='save')localStorage.setItem('afrotools:fr-agriculture:crop-insurance',JSON.stringify(v));if(a==='txt')dl('\\ufeff'+s,'text/plain;charset=utf-8',slug+'.txt');if(a==='json')dl(JSON.stringify(v,null,2),'application/json;charset=utf-8',slug+'.json');if(a==='csv'){var rows=[['champ','valeur'],['pays',latest.countryCode||''],['devise',latest.input.currency],['valeur_assuree',latest.input.farmValue],['taux_prime_pct',latest.input.premiumRate],['prime',latest.premium],['taux_part_charge_pct',latest.input.excess],['part_charge',latest.retainedExcess]];dl('\\ufeff'+rows.map(function(r){return r.map(cell).join(',')}).join('\\r\\n'),'text/csv;charset=utf-8',slug+'.csv')}if(a==='pdf'){var Pdf=window.jspdf&&window.jspdf.jsPDF;if(!Pdf)return status('Export PDF indisponible.',true);var pdf=new Pdf({unit:'pt',format:'a4'});pdf.text(pdf.splitTextToSize(s.normalize('NFD').replace(/[\\u0300-\\u036f]/g,''),500),48,58);pdf.save(slug+'.pdf')}status(a==='save'?'Estimation enregistrée dans ce navigateur.':'Action terminée.')});window.__FR_AGRI_TEST__={latest:null,engine:engine,data:data,directory:directory,calculate:calculate,input:input,reportObject:report};renderDirectory('');selectCountry('')})();</script>`;
  return renderFrenchAgriculturePage({
    row,
    title: 'Assurance récolte — prime et part à charge | AfroTools',
    description: 'Estimez une prime et une part à charge avec la formule générique acceptée, sans transformer les scénarios pays statiques en offres actuelles.',
    heading: 'Estimer une prime d’assurance récolte',
    lead: 'Une feuille locale pour appliquer vos propres taux à une valeur assurée, puis préparer les vérifications à demander à l’assureur.',
    artwork: row.artwork.file,
    body,
    scripts,
    pageConfig,
    familyLabel: 'Assurance récolte',
    familyRoute: row.french.routeKey,
  });
}

module.exports = { COVERED, META, REGION_ORDER, REGION_LABELS, COUNTRY_NAMES, render };
