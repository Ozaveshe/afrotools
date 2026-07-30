'use strict';

const { renderFrenchAgriculturePage, escapeHtml } = require('../fr-agriculture-page-shell');

const PURPOSES = Object.freeze({
  inputs: 'Semences, engrais et produits phytosanitaires',
  equipment: 'Matériel ou machines agricoles',
  irrigation: 'Infrastructure d’irrigation',
  livestock: 'Achat de bétail',
  processing: 'Transformation après récolte',
  land: 'Acquisition ou aménagement foncier',
  working_capital: 'Fonds de roulement général',
});

const PROGRAM_TYPES = Object.freeze({
  'Gov Bank': 'Banque publique', 'Dev Bank': 'Banque de développement',
  'Gov Agri Bank': 'Banque agricole publique', 'CBN Scheme': 'Programme CBN',
  'Gov Scheme': 'Programme public', 'Gov Fund': 'Fonds public',
  'Government Guarantee': 'Garantie publique', Guarantee: 'Garantie',
  'BOAD Regional': 'Dispositif régional BOAD', 'BDEAC Regional': 'Dispositif régional BDEAC',
  Commercial: 'Banque commerciale', 'Commercial Bank': 'Banque commerciale',
  Microfinance: 'Microfinance', 'Rural Bank': 'Banque rurale',
  'Cooperative / SACCO': 'Coopérative / SACCO', SACCO: 'SACCO',
  'Credit Union': 'Coopérative de crédit', 'Gov SACCO': 'SACCO public',
  'Gov Grant': 'Subvention publique', 'Coop Finance': 'Finance coopérative',
  'Fintech / Agritech': 'Fintech / agritech', Fintech: 'Fintech',
  'NGO / Social Enterprise': 'ONG / entreprise sociale', NGO: 'ONG',
  'Islamic Finance': 'Finance islamique', 'Youth Scheme': 'Programme jeunesse',
  'Gov Programme': 'Programme public', 'Community MFI': 'Microfinance communautaire',
  'Community Finance': 'Finance communautaire',
  'Government-Supported Cooperative': 'Coopérative soutenue par l’État',
  'Gov Subsidy': 'Subvention publique', 'Cooperative Bank': 'Banque coopérative',
  'Cooperative Credit Union': 'Coopérative de crédit', 'Government Bank': 'Banque publique',
  'Government Commercial Bank': 'Banque commerciale publique',
  'Government Social Fund': 'Fonds social public',
});

function renderHub(row, context = {}) {
  const countries = (context.familyRows || []).filter(item => item.country)
    .sort((a, b) => a.country.frenchName.localeCompare(b.country.frenchName, 'fr'));
  if (countries.length !== 15) throw new Error('Farm Loans hub requires exactly 15 manifest countries.');
  return renderFrenchAgriculturePage({
    row,
    title: 'Éligibilité aux prêts agricoles par pays | AfroTools',
    description: 'Choisissez un pays pour comparer les programmes de financement agricole et estimer un remboursement.',
    heading: 'Éligibilité aux prêts agricoles',
    lead: 'Quinze applications pays utilisent le même moteur d’éligibilité et les programmes canoniques du référentiel anglais.',
    artwork: row.artwork.file,
    body: `<section class="card"><h2>Choisissez le pays</h2><ul class="country-list">${countries.map(item => `<li><a href="${escapeHtml(item.french.route)}">${escapeHtml(item.country.frenchName)}</a> <span>(${item.country.code})</span></li>`).join('')}</ul></section>
<section class="card"><h2>Limites</h2><p>Ce comparateur fournit un repère de planification à partir d’un référentiel statique. Il ne garantit ni éligibilité, ni taux, ni financement.</p><p><strong>Confidentialité :</strong> calcul local dans votre navigateur.</p></section>`,
    scripts: '',
    pageConfig: { id: row.english.id, family: 'farm-loans' },
    familyLabel: 'Prêts agricoles',
    familyRoute: '/fr/agriculture/farm-loans/',
  });
}

function render(row, context = {}) {
  if (!row.country) return renderHub(row, context);
  const config = {
    id: row.english.id,
    countryCode: row.country.code,
    countryName: row.country.frenchName,
    locale: 'fr',
    purposes: PURPOSES,
    programTypes: PROGRAM_TYPES,
  };
  const purposeOptions = Object.entries(PURPOSES)
    .map(([value, label]) => `<option value="${value}">${escapeHtml(label)}</option>`).join('');
  const body = `<style>.loan-program-card h3,.loan-program-card .recommendations{min-width:0;overflow-wrap:anywhere}.loan-program-card .recommendations{padding-left:1.15rem}.loan-program-card .recommendations li{max-width:100%;overflow-wrap:anywhere}@media(max-width:360px){.farm-loans-trust{grid-template-columns:minmax(0,1fr)}.farm-loans-trust>*{min-width:0;overflow-wrap:anywhere}}</style><section class="card"><h2>Votre profil et votre demande</h2><form id="loanForm" novalidate>
<div class="grid"><div class="field"><label for="age">Âge</label><input id="age" type="number" min="16" max="100" step="1" value="30"></div>
<div class="field"><label for="farmSize">Surface agricole (ha)</label><input id="farmSize" type="number" min="0.1" step="0.1" value="1" inputmode="decimal"></div>
<div class="field"><label for="amount">Montant demandé</label><input id="amount" type="number" min="0" step="1" value="500000" inputmode="decimal"><small id="currencyHint"></small></div>
<div class="field"><label for="tenor">Durée de remboursement</label><select id="tenor"><option value="6">6 mois</option><option value="12" selected>12 mois</option><option value="18">18 mois</option><option value="24">24 mois</option><option value="36">36 mois</option><option value="48">48 mois</option><option value="60">60 mois</option></select></div>
<div class="field"><label for="purpose">Objet du financement</label><select id="purpose">${purposeOptions}</select></div>
<div class="field"><span id="coopLabel"><strong>Membre d’une coopérative ou d’un groupe agricole ?</strong></span><div><input id="coopYes" name="coop" type="radio" value="yes" checked><label for="coopYes">Oui</label> <input id="coopNo" name="coop" type="radio" value="no"><label for="coopNo">Non</label></div></div>
<div class="field"><span><strong>Compte bancaire disponible ?</strong></span><div><input id="bankYes" name="bank" type="radio" value="yes" checked><label for="bankYes">Oui</label> <input id="bankNo" name="bank" type="radio" value="no"><label for="bankNo">Non</label></div></div>
<div class="field"><span><strong>Garantie disponible ?</strong> <small>titre foncier, bien ou équipement</small></span><div><input id="collateralYes" name="collateral" type="radio" value="yes"><label for="collateralYes">Oui</label> <input id="collateralNo" name="collateral" type="radio" value="no" checked><label for="collateralNo">Non</label></div></div>
</div><div class="actions"><button class="action primary" type="submit">Vérifier mon éligibilité</button><button class="action" type="reset">Réinitialiser</button></div><p class="error" id="formError" role="alert" aria-live="assertive"></p></form></section>
<section class="card"><h2>Résultats</h2><div class="empty" id="emptyState">Aucune vérification n’a encore été effectuée.</div><div id="resultPanel" class="result-panel" hidden><div class="result-grid" id="summary"></div><h3 id="eligibleTitle"></h3><div id="eligibleList"></div><section id="ineligibleSection"><h3 id="ineligibleTitle"></h3><div id="ineligibleList"></div></section>
<div class="actions"><button class="action" type="button" data-action="copy">Copier</button><button class="action" type="button" data-action="share">Partager</button><button class="action" type="button" data-action="save">Enregistrer dans ce navigateur</button><button class="action" type="button" data-action="pdf">Exporter en PDF</button><button class="action" type="button" data-action="csv">Exporter en CSV</button><button class="action" type="button" data-action="json">Exporter en JSON</button><button class="action" type="button" data-action="txt">Exporter en TXT</button></div><p class="status" id="actionStatus" role="status" aria-live="polite"></p></div></section>
<section class="card"><h2>Sources, fraîcheur et limites</h2><div class="trust-grid farm-loans-trust"><div class="trust-item"><strong>Source</strong><span>Référentiel canonique data/agriculture/agri-loans-data.js et moteur farm-loan-engine.js.</span></div><div class="trust-item"><strong>Fraîcheur</strong><span>Référentiel statique; aucune donnée en direct. Taux et programmes à confirmer.</span></div><div class="trust-item"><strong>Confiance</strong><span>Présélection indicative fondée sur les critères structurés du programme.</span></div></div><p>Confirmez le programme, le taux, les frais, les garanties, la durée, les documents et l’ouverture des candidatures directement auprès de l’organisme prêteur. Ce résultat n’est ni une offre de crédit ni un conseil financier.</p><p><strong>Confidentialité :</strong> aucune saisie envoyée à un serveur.</p></section>`;

  const scripts = `<script src="/data/agriculture/agri-loans-data.js"></script><script src="/engines/farm-loan-engine.js"></script><script src="/assets/vendor/jspdf/jspdf.umd.min.js"></script>
<script>(function(){'use strict';var cfg=window.__FR_AGRI_PAGE__,engine=window.AfroTools&&window.AfroTools.FarmLoanEngine,allData=window.AfroTools&&window.AfroTools.AgriLoansData,country=null,latest=null;
function id(x){return document.getElementById(x)}function radio(n){return document.querySelector('input[name="'+n+'"]:checked').value==='yes'}function money(v){return new Intl.NumberFormat(cfg.locale,{style:'currency',currency:country.currency,maximumFractionDigits:0}).format(Number(v)||0)}function num(v){return new Intl.NumberFormat(cfg.locale,{maximumFractionDigits:1}).format(Number(v)||0)}function status(m,e){id('actionStatus').textContent=m;id('actionStatus').style.color=e?'var(--agri-danger)':'var(--agri-good)'}function dl(c,t,f){var u=URL.createObjectURL(new Blob([c],{type:t})),a=document.createElement('a');a.href=u;a.download=f;document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(u)},0)}function cell(v){var s=String(v==null?'':v);return /[",\\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s}function metric(label,value){var d=document.createElement('div'),s=document.createElement('strong'),l=document.createElement('span');d.className='metric';s.textContent=value;l.textContent=label;d.append(s,l);return d}
function reason(value){var m;if((m=value.match(/^Minimum age: (\\d+) years \\(you are (\\d+)\\)$/)))return 'Âge minimal : '+m[1]+' ans (âge saisi : '+m[2]+').';if((m=value.match(/^Maximum age: (\\d+) years \\(you are (\\d+)\\)$/)))return 'Âge maximal : '+m[1]+' ans (âge saisi : '+m[2]+').';if(value==='Must be a cooperative or farmer group member')return 'Adhésion obligatoire à une coopérative ou à un groupe agricole.';if(value==='Joining a cooperative improves your chances')return 'L’adhésion à une coopérative améliore les chances.';if(value==='Requires a bank account')return 'Compte bancaire obligatoire.';if(value.indexOf('Requires collateral')===0)return 'Garantie obligatoire : titre foncier, bien ou équipement.';if((m=value.match(/^Minimum farm size: ([\\d.]+) ha/)))return 'Surface minimale : '+m[1]+' ha.';if((m=value.match(/^Maximum farm size: ([\\d.]+) ha/)))return 'Surface maximale : '+m[1]+' ha; programme réservé aux petites exploitations.';if(value==='Mandatory entrepreneurship training required before application')return 'Formation entrepreneuriale obligatoire avant la demande.';if(value.indexOf('Your requested amount exceeds the maximum')===0)return 'Le montant demandé dépasse le plafond du programme.';if(value.indexOf('Minimum loan:')===0)return 'Le montant demandé est inférieur au minimum du programme.';return 'Critère du programme non satisfait; confirmer auprès de l’organisme.'}
function profile(){return {age:parseInt(id('age').value,10)||30,farmSize_ha:parseFloat(id('farmSize').value)||1,isCoop:radio('coop'),hasBankAccount:radio('bank'),hasCollateral:radio('collateral'),requestedAmount:parseFloat(id('amount').value)||0,tenorMonths:parseInt(id('tenor').value,10)||12}}
function programCard(r){var p=r.program,article=document.createElement('article');article.className='card loan-program-card';var h=document.createElement('h3');h.textContent=p.name;var type=document.createElement('p');type.textContent=cfg.programTypes[p.typeBadge]||'Programme de financement';var grid=document.createElement('div');grid.className='result-grid';var rate=p.interestRate_pct==null?'Taux intégré ou non précisé':(typeof p.interestRate_pct==='object'?num(p.interestRate_pct.min)+'–'+num(p.interestRate_pct.max)+' % par an':num(p.interestRate_pct)+' % par an');var tenor=p.tenor_months&&!(p.tenor_months.min===0&&p.tenor_months.max===0)?p.tenor_months.min+'–'+p.tenor_months.max+' mois':'Sans échéance de prêt';grid.append(metric('Taux',rate),metric('Montant minimal',p.minAmount?money(p.minAmount):'Non précisé'),metric('Montant maximal',p.maxAmount?money(p.maxAmount):'Selon le programme'),metric('Durée',tenor));article.append(h,type,grid);if(r.repayment){var repay=document.createElement('div');repay.className='result-grid';repay.append(metric('Mensualité estimée',money(r.repayment.monthly)),metric('Total remboursé',money(r.repayment.totalPayable)),metric('Intérêts totaux',money(r.repayment.totalInterest)));article.appendChild(repay)}var messages=r.eligible?r.warnings:r.blockers;if(messages.length){var ul=document.createElement('ul');ul.className='recommendations';messages.forEach(function(x){var li=document.createElement('li');li.textContent=reason(x);ul.appendChild(li)});article.appendChild(ul)}return article}
function render(results){var eligible=results.filter(function(r){return r.eligible}),ineligible=results.filter(function(r){return !r.eligible}),lowest=eligible.length?Math.min.apply(null,eligible.map(function(r){return r.rate||99})):null,max=eligible.length?Math.max.apply(null,eligible.map(function(r){return r.program.maxAmount||0})):0;id('summary').replaceChildren(metric('Programmes compatibles',String(eligible.length)),metric('Programmes examinés',String(results.length)));if(lowest!=null&&lowest<99)id('summary').appendChild(metric('Taux minimal indicatif',num(lowest)+' %'));if(max>0)id('summary').appendChild(metric('Plafond maximal indicatif',money(max)));id('eligibleTitle').textContent=eligible.length?'Programmes compatibles ('+eligible.length+')':'Aucun programme compatible avec le profil saisi';id('eligibleList').replaceChildren();eligible.forEach(function(r){id('eligibleList').appendChild(programCard(r))});if(!eligible.length){var p=document.createElement('p');p.textContent='Essayez de vérifier l’adhésion à une coopérative, le compte bancaire, la garantie ou le montant demandé.';id('eligibleList').appendChild(p)}id('ineligibleSection').hidden=!ineligible.length;id('ineligibleTitle').textContent='Programmes non compatibles actuellement ('+ineligible.length+')';id('ineligibleList').replaceChildren();ineligible.forEach(function(r){id('ineligibleList').appendChild(programCard(r))})}
function report(){if(!latest)return null;return {schemaVersion:1,outil:'eligibilite-prets-agricoles',langue:'fr',pays:{code:cfg.countryCode,nom:cfg.countryName},entrees:Object.assign({objet:id('purpose').value},latest.profile),resultat:latest.results.map(function(r){return {programmeId:r.program.id,programme:r.program.name,eligible:r.eligible,tauxPct:r.rate,blocages:r.blockers.map(reason),avertissements:r.warnings.map(reason),remboursement:r.repayment}}),sources:{donnees:'data/agriculture/agri-loans-data.js',moteur:'engines/src/farm-loan-engine.js',donneesEnDirect:false},confidentialite:'Calcul local; aucune saisie envoyée.'}}
function text(){var o=report();if(!o)return '';var ok=o.resultat.filter(function(r){return r.eligible});return ['AfroTools — éligibilité aux prêts agricoles',cfg.countryName,'Montant demandé : '+money(o.entrees.requestedAmount),'Durée : '+o.entrees.tenorMonths+' mois','Programmes compatibles : '+ok.length+' / '+o.resultat.length].concat(ok.map(function(r){return r.programme+' — '+num(r.tauxPct)+' %'}),['','Référentiel statique; aucune donnée en direct.','Résultat indicatif, à confirmer auprès de l’organisme prêteur.','Confidentialité : calcul local.']).join('\\n')}
function calculate(){id('formError').textContent='';var age=Number(id('age').value),size=Number(id('farmSize').value),amount=Number(id('amount').value);if(!Number.isFinite(age)||age<16){id('formError').textContent='Saisissez un âge d’au moins 16 ans.';id('age').focus();return null}if(!Number.isFinite(size)||size<=0){id('formError').textContent='Saisissez une surface supérieure à zéro.';id('farmSize').focus();return null}if(!Number.isFinite(amount)||amount<0){id('formError').textContent='Saisissez un montant valide.';id('amount').focus();return null}var p=profile(),results=engine.evaluatePrograms(p,country),eligible=results.filter(function(r){return r.eligible});latest={profile:p,results:results,result:{countryCode:cfg.countryCode,eligibleCount:eligible.length,totalPrograms:results.length,results:results}};window.__FR_AGRI_TEST__.latest=latest;render(results);id('emptyState').hidden=true;id('resultPanel').hidden=false;status('Éligibilité indicative calculée localement.');return results}
id('loanForm').addEventListener('submit',function(e){e.preventDefault();calculate()});id('loanForm').addEventListener('reset',function(){setTimeout(function(){latest=null;window.__FR_AGRI_TEST__.latest=null;id('emptyState').hidden=false;id('resultPanel').hidden=true;id('actionStatus').textContent=''},0)});document.addEventListener('click',function(e){var b=e.target.closest('[data-action]');if(!b)return;if(!latest)return status('Lancez d’abord une vérification.',true);var a=b.dataset.action,o=report(),t=text(),slug='afrotools-prets-agricoles-'+cfg.countryCode.toLowerCase();if(a==='copy')navigator.clipboard.writeText(t);if(a==='share')navigator.clipboard.writeText(location.href+'\\n\\n'+t);if(a==='save')localStorage.setItem('afrotools:fr-agriculture:farm-loans:'+cfg.countryCode,JSON.stringify(o));if(a==='txt')dl('\\ufeff'+t,'text/plain;charset=utf-8',slug+'.txt');if(a==='json')dl(JSON.stringify(o,null,2),'application/json;charset=utf-8',slug+'.json');if(a==='csv'){var x=[['pays','code_pays','programme_id','programme','eligible','taux_pct','mensualite','total_rembourse','devise','donnees_en_direct']];o.resultat.forEach(function(r){x.push([cfg.countryName,cfg.countryCode,r.programmeId,r.programme,r.eligible?'oui':'non',r.tauxPct,r.remboursement?r.remboursement.monthly:'',r.remboursement?r.remboursement.totalPayable:'',country.currency,'non'])});dl('\\ufeff'+x.map(function(row){return row.map(cell).join(',')}).join('\\r\\n'),'text/csv;charset=utf-8',slug+'.csv')}if(a==='pdf'){var J=window.jspdf&&window.jspdf.jsPDF;if(!J)return status('Export PDF indisponible.',true);var d=new J({unit:'pt',format:'a4'});d.text(d.splitTextToSize(t.normalize('NFD').replace(/[\\u0300-\\u036f]/g,''),500),48,58);d.save(slug+'.pdf')}status(a==='save'?'Résultat enregistré dans ce navigateur.':'Action terminée.')});
try{if(!engine||!allData||!allData[cfg.countryCode])throw new Error('Moteur ou référentiel de prêts indisponible.');country=allData[cfg.countryCode];id('currencyHint').textContent='Devise : '+country.currency;window.__FR_AGRI_TEST__={calculate:calculate,latest:null,engine:engine,data:country,reportObject:report}}catch(error){id('formError').textContent=error.message;console.error(error)}})();</script>`;
  return renderFrenchAgriculturePage({
    row,
    title: `Éligibilité aux prêts agricoles — ${row.country.frenchName} | AfroTools`,
    description: `Comparez les programmes de financement agricole et estimez les remboursements en ${row.country.frenchName}.`,
    heading: `Prêts agricoles — ${row.country.frenchName}`,
    lead: 'Vérifiez les critères structurés du référentiel pays et estimez les remboursements sans envoyer vos données.',
    artwork: row.artwork.file,
    body,
    scripts,
    pageConfig: config,
    familyLabel: 'Prêts agricoles',
    familyRoute: '/fr/agriculture/farm-loans/',
  });
}

module.exports = { id: 'farm-loans', PURPOSES, PROGRAM_TYPES, renderHub, render };
