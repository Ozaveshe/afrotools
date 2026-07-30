'use strict';

const { renderFrenchAgriculturePage, escapeHtml } = require('../fr-agriculture-page-shell');

const WORKER_TYPES = Object.freeze({
  permanent: 'Salarié permanent',
  casual: 'Journalier',
  seasonal: 'Travailleur saisonnier',
  piece_rate: 'Travail à la tâche',
});

function renderHub(row, context = {}) {
  const countries = (context.familyRows || []).filter(item => item.country)
    .sort((a, b) => a.country.frenchName.localeCompare(b.country.frenchName, 'fr'));
  if (countries.length !== 54) throw new Error('Farm Payroll hub requires exactly 54 manifest countries.');
  return renderFrenchAgriculturePage({
    row,
    title: 'Paie agricole par pays | AfroTools',
    description: 'Choisissez un pays pour estimer salaire brut, retenues, salaire net et coût employeur agricole.',
    heading: 'Calculateur de paie agricole',
    lead: 'Cinquante-quatre applications pays utilisent le moteur et le référentiel de paie agricole acceptés.',
    artwork: row.artwork.file,
    body: `<section class="card"><h2>Choisissez le pays</h2><ul class="country-list">${countries.map(item => `<li><a href="${escapeHtml(item.french.route)}">${escapeHtml(item.country.frenchName)}</a> <span>(${item.country.code})</span></li>`).join('')}</ul></section>
<section class="card"><h2>Limites</h2><p>Les montants légaux et taux du référentiel sont statiques. Vérifiez les règles actuelles auprès de l’administration ou d’un professionnel local avant de payer ou déclarer.</p><p><strong>Confidentialité :</strong> calcul local.</p></section>`,
    scripts: '',
    pageConfig: { id: row.english.id, family: 'farm-payroll' },
    familyLabel: 'Paie agricole',
    familyRoute: '/fr/agriculture/farm-payroll/',
  });
}

function render(row, context = {}) {
  if (!row.country) return renderHub(row, context);
  const config = {
    id: row.english.id,
    countryCode: row.country.code,
    countryName: row.country.frenchName,
    locale: 'fr',
    workerTypes: WORKER_TYPES,
  };
  const workerOptions = Object.entries(WORKER_TYPES)
    .map(([value, label]) => `<option value="${value}">${escapeHtml(label)}</option>`).join('');
  const body = `<style>.payroll-deductions-mobile{display:none;gap:10px}.payroll-deduction-card{border:1px solid var(--agri-border);border-radius:10px;padding:14px;min-width:0}.payroll-deduction-card strong,.payroll-deduction-card span{display:block;overflow-wrap:anywhere}.payroll-deduction-card span{color:var(--agri-muted);margin-top:5px}@media(max-width:480px){.payroll-deductions-table{display:none}.payroll-deductions-mobile{display:grid}}@media(max-width:360px){.farm-payroll-trust{grid-template-columns:minmax(0,1fr)}.farm-payroll-trust>*{min-width:0;overflow-wrap:anywhere}}</style><section class="card"><h2>Configurer la paie</h2><form id="payrollForm" novalidate><div class="grid">
<div class="field"><label for="workerType">Type de travailleur</label><select id="workerType">${workerOptions}</select></div>
<div class="field"><label for="numWorkers">Nombre de travailleurs</label><input id="numWorkers" type="number" min="1" step="1" value="1"></div>
<div class="field" id="grossField"><label for="grossPay" id="grossLabel">Salaire brut mensuel par travailleur</label><input id="grossPay" type="number" min="0" step="0.01" inputmode="decimal"></div>
<div class="field" id="daysField" hidden><label for="daysWorked">Jours travaillés dans le mois</label><input id="daysWorked" type="number" min="0" max="31" step="1" value="26"></div>
<div class="field" id="rateField" hidden><label for="ratePerUnit">Tarif par unité ou tâche</label><input id="ratePerUnit" type="number" min="0" step="0.01" inputmode="decimal"></div>
<div class="field" id="unitsField" hidden><label for="unitsCompleted">Unités ou tâches terminées</label><input id="unitsCompleted" type="number" min="0" step="1" value="80"></div>
<div class="field"><label for="overtimeHours">Heures supplémentaires</label><input id="overtimeHours" type="number" min="0" step="0.5" value="0"></div>
<div class="field"><label for="inKindHousing">Avantage logement, valeur mensuelle</label><input id="inKindHousing" type="number" min="0" step="0.01" value="0"></div>
<div class="field"><label for="inKindFood">Avantage repas, valeur mensuelle</label><input id="inKindFood" type="number" min="0" step="0.01" value="0"></div>
</div><div class="actions"><button class="action primary" type="submit">Calculer la paie</button><button class="action" type="reset">Réinitialiser</button></div><p class="error" id="formError" role="alert" aria-live="assertive"></p></form></section>
<section class="card"><h2>Résultat</h2><div class="empty" id="emptyState">Aucun bulletin estimatif n’a encore été calculé.</div><div id="resultPanel" class="result-panel" hidden>
<div class="result-hero"><div class="result-value" id="netPay">—</div><div>Salaire net estimé par travailleur</div></div>
<div class="result-grid"><div class="metric"><strong id="gross">—</strong><span>Brut soumis aux retenues</span></div><div class="metric"><strong id="deductions">—</strong><span>Retenues du travailleur</span></div><div class="metric"><strong id="employerCost">—</strong><span>Coût employeur par travailleur</span></div><div class="metric"><strong id="farmMonthly">—</strong><span>Coût mensuel de l’exploitation</span></div><div class="metric"><strong id="farmAnnual">—</strong><span>Coût annuel de l’exploitation</span></div><div class="metric"><strong id="minimumStatus">—</strong><span>Repère de salaire minimum</span></div></div>
<h3>Retenues et charges</h3><div class="table-wrap payroll-deductions-table"><table class="data-table" id="deductionTable"></table></div><div id="deductionCards" class="payroll-deductions-mobile" aria-label="Retenues et charges"></div>
<h3>Repères de droit du travail</h3><ul id="lawList"></ul><p id="taxStatus"></p>
<div class="actions"><button class="action" type="button" data-action="copy">Copier</button><button class="action" type="button" data-action="share">Partager</button><button class="action" type="button" data-action="save">Enregistrer dans ce navigateur</button><button class="action" type="button" data-action="pdf">Exporter en PDF</button><button class="action" type="button" data-action="csv">Exporter en CSV</button><button class="action" type="button" data-action="json">Exporter en JSON</button><button class="action" type="button" data-action="txt">Exporter en TXT</button></div><p class="status" id="actionStatus" role="status" aria-live="polite"></p></div></section>
<section class="card"><h2>Sources, fraîcheur et limites</h2><div class="trust-grid farm-payroll-trust"><div class="trust-item"><strong>Source</strong><span>Moteur engines/src/farm-payroll-engine.js et données data/agriculture/farm-payroll-data.js.</span></div><div class="trust-item"><strong>Fraîcheur</strong><span>Référentiel statique; aucune donnée en direct.</span></div><div class="trust-item"><strong>Confiance</strong><span>Estimation fondée sur les taux et repères pays maintenus, sans calcul fiscal PAYE détaillé.</span></div></div><p>Les retenues, minimums, avantages, heures supplémentaires et obligations peuvent changer ou dépendre du statut de l’employeur. Vérifiez avant paiement, contrat ou déclaration. Cet outil ne remplace ni un bulletin officiel ni un conseil juridique, fiscal ou comptable.</p><p><strong>Confidentialité :</strong> aucune saisie envoyée à un serveur.</p></section>`;

  const scripts = `<script src="/data/agriculture/farm-payroll-data.js"></script><script src="/engines/farm-payroll-engine.js"></script><script src="/assets/vendor/jspdf/jspdf.umd.min.js"></script>
<script>(function(){'use strict';var cfg=window.__FR_AGRI_PAGE__,engine=window.AfroTools&&window.AfroTools.FarmPayrollEngine,allData=window.AfroTools&&window.AfroTools.FarmPayrollData,country=null,latest=null;
function id(x){return document.getElementById(x)}function value(x){return Number(id(x).value)||0}function money(v){try{return new Intl.NumberFormat(cfg.locale,{style:'currency',currency:country.currency,maximumFractionDigits:0}).format(Number(v)||0)}catch(e){return country.symbol+' '+new Intl.NumberFormat(cfg.locale,{maximumFractionDigits:0}).format(Number(v)||0)}}function num(v,d){return new Intl.NumberFormat(cfg.locale,{maximumFractionDigits:d==null?1:d}).format(Number(v)||0)}function status(m,e){id('actionStatus').textContent=m;id('actionStatus').style.color=e?'var(--agri-danger)':'var(--agri-good)'}function dl(c,t,f){var u=URL.createObjectURL(new Blob([c],{type:t})),a=document.createElement('a');a.href=u;a.download=f;document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(u)},0)}function cell(v){var s=String(v==null?'':v);return /[",\\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s}
function syncType(){var t=id('workerType').value,d=t==='casual'||t==='seasonal',p=t==='piece_rate';id('grossField').hidden=p;id('daysField').hidden=!d;id('rateField').hidden=!p;id('unitsField').hidden=!p;id('grossLabel').textContent=d?'Tarif journalier par travailleur':'Salaire brut mensuel par travailleur'}
function init(){if(!engine||!allData||!allData[cfg.countryCode])throw new Error('Moteur ou référentiel de paie indisponible.');country=allData[cfg.countryCode];id('workerType').value='permanent';id('numWorkers').value='1';id('grossPay').value=String(country.agriMinWage_monthly||country.nationalMinWage_monthly||country.typicalDailyRate.mid*26);id('daysWorked').value='26';id('ratePerUnit').value=String(country.typicalDailyRate.mid/5);id('unitsCompleted').value='80';id('overtimeHours').value='0';id('inKindHousing').value='0';id('inKindFood').value='0';syncType()}
function input(){return {workerType:id('workerType').value,numWorkers:value('numWorkers'),grossPay:value('grossPay'),daysWorked:value('daysWorked'),ratePerUnit:value('ratePerUnit'),unitsCompleted:value('unitsCompleted'),overtimeHours:value('overtimeHours'),inKindHousing:value('inKindHousing'),inKindFood:value('inKindFood')}}
function contributionName(name){return name.indexOf('Employer ')===0?'Part employeur — '+name.slice(9):name}
function rows(r){return r.deductions.map(function(x){return {categorie:'Retenue du travailleur',nom:x.name,tauxPct:x.rate,montant:x.amount}}).concat(r.employerContributions.map(function(x){return {categorie:'Charge employeur',nom:contributionName(x.name),tauxPct:null,montant:x.amount}}))}
function render(r){id('netPay').textContent=money(r.netPay);id('gross').textContent=money(r.grossForDeductions);id('deductions').textContent=money(r.totalDeductions);id('employerCost').textContent=money(r.totalEmployerCost);id('farmMonthly').textContent=money(r.farmMonthlyCost);id('farmAnnual').textContent=money(r.farmAnnualCost);id('minimumStatus').textContent=r.mwCheck?(r.mwCheck.compliant?'Conforme au repère':'Sous le repère'):'Non calculable';var table=id('deductionTable'),cards=id('deductionCards'),head=document.createElement('thead'),hr=document.createElement('tr');['Catégorie','Nom','Taux','Montant'].forEach(function(x){var th=document.createElement('th');th.scope='col';th.textContent=x;hr.appendChild(th)});head.appendChild(hr);var body=document.createElement('tbody');cards.replaceChildren();rows(r).forEach(function(x){var rate=x.tauxPct==null?'—':num(x.tauxPct)+' %',amount=money(x.montant),tr=document.createElement('tr');[x.categorie,x.nom,rate,amount].forEach(function(v){var td=document.createElement('td');td.textContent=v;tr.appendChild(td)});body.appendChild(tr);var card=document.createElement('article'),heading=document.createElement('strong');card.className='payroll-deduction-card';heading.textContent=x.nom;card.appendChild(heading);[['Catégorie',x.categorie],['Taux',rate],['Montant',amount]].forEach(function(entry){var line=document.createElement('span');line.textContent=entry[0]+' : '+entry[1];card.appendChild(line)});cards.appendChild(card)});table.replaceChildren(head,body);var law=r.laborLaw||{},items=['Durée maximale : '+(law.maxHoursPerDay||'—')+' h par jour et '+(law.maxHoursPerWeek||'—')+' h par semaine.','Majoration des heures supplémentaires : coefficient '+num(law.overtimeRate||1.5,2)+'.','Congé annuel de référence : '+(law.annualLeave_days||'—')+' jours.','Jours fériés de référence : '+(law.publicHolidays||'—')+'.'];id('lawList').replaceChildren();items.forEach(function(x){var li=document.createElement('li');li.textContent=x;id('lawList').appendChild(li)});id('taxStatus').textContent=r.likelyTaxable?'Le niveau brut peut être imposable; utilisez le calcul fiscal pays applicable et vérifiez localement.':'Aucun calcul PAYE détaillé n’est effectué dans cet outil.'}
function report(){if(!latest)return null;var r=latest.result;return {schemaVersion:1,outil:'paie-agricole',langue:'fr',pays:{code:cfg.countryCode,nom:cfg.countryName},entrees:latest.input,resultat:{devise:r.currency,salaireBrutBase:r.baseGross,heuresSupplementaires:r.overtimePay,avantagesEnNature:r.inKindValue,brutSoumis:r.grossForDeductions,retenues:rows(r).filter(function(x){return x.categorie==='Retenue du travailleur'}),totalRetenues:r.totalDeductions,salaireNet:r.netPay,chargesEmployeur:rows(r).filter(function(x){return x.categorie==='Charge employeur'}),coutEmployeurParTravailleur:r.totalEmployerCost,coutMensuelExploitation:r.farmMonthlyCost,coutAnnuelExploitation:r.farmAnnualCost,controleMinimum:r.mwCheck,possiblementImposable:r.likelyTaxable,droitTravail:{heuresJour:r.laborLaw.maxHoursPerDay,heuresSemaine:r.laborLaw.maxHoursPerWeek,coefficientHeuresSupplementaires:r.laborLaw.overtimeRate,congeAnnuelJours:r.laborLaw.annualLeave_days,joursFeries:r.laborLaw.publicHolidays}},sources:{donnees:'data/agriculture/farm-payroll-data.js',moteur:'engines/src/farm-payroll-engine.js',donneesEnDirect:false},confidentialite:'Calcul local; aucune saisie envoyée.'}}
function text(){var o=report(),r=o&&o.resultat;if(!r)return '';return ['AfroTools — paie agricole',cfg.countryName,'Type : '+cfg.workerTypes[latest.input.workerType],'Travailleurs : '+latest.input.numWorkers,'Brut soumis : '+money(r.brutSoumis),'Retenues : '+money(r.totalRetenues),'Net par travailleur : '+money(r.salaireNet),'Coût employeur par travailleur : '+money(r.coutEmployeurParTravailleur),'Coût mensuel exploitation : '+money(r.coutMensuelExploitation),'Coût annuel exploitation : '+money(r.coutAnnuelExploitation),'','Référentiel statique; aucune donnée en direct.','Vérifier les règles actuelles avant paiement ou déclaration.','Confidentialité : calcul local.'].join('\\n')}
function calculate(){id('formError').textContent='';var workers=Number(id('numWorkers').value);if(!Number.isFinite(workers)||workers<1){id('formError').textContent='Saisissez au moins un travailleur.';id('numWorkers').focus();return null}var i=input();if(i.workerType!=='piece_rate'&&i.grossPay<0){id('formError').textContent='Saisissez une rémunération valide.';id('grossPay').focus();return null}var r=engine.calculate(i,country);if(r.error){id('formError').textContent='Le calcul pays est indisponible.';return null}latest={input:i,result:r};window.__FR_AGRI_TEST__.latest=latest;render(r);id('emptyState').hidden=true;id('resultPanel').hidden=false;status('Paie estimée localement.');return r}
id('workerType').addEventListener('change',syncType);id('payrollForm').addEventListener('submit',function(e){e.preventDefault();calculate()});id('payrollForm').addEventListener('reset',function(){setTimeout(function(){latest=null;window.__FR_AGRI_TEST__.latest=null;id('emptyState').hidden=false;id('resultPanel').hidden=true;id('actionStatus').textContent='';init()},0)});document.addEventListener('click',function(e){var b=e.target.closest('[data-action]');if(!b)return;if(!latest)return status('Lancez d’abord un calcul.',true);var a=b.dataset.action,o=report(),t=text(),slug='afrotools-paie-agricole-'+cfg.countryCode.toLowerCase();if(a==='copy')navigator.clipboard.writeText(t);if(a==='share')navigator.clipboard.writeText(location.href+'\\n\\n'+t);if(a==='save')localStorage.setItem('afrotools:fr-agriculture:farm-payroll:'+cfg.countryCode,JSON.stringify(o));if(a==='txt')dl('\\ufeff'+t,'text/plain;charset=utf-8',slug+'.txt');if(a==='json')dl(JSON.stringify(o,null,2),'application/json;charset=utf-8',slug+'.json');if(a==='csv'){var r=o.resultat,x=[['pays','code_pays','type_travailleur','nombre_travailleurs','brut_soumis','total_retenues','salaire_net','cout_employeur','cout_mensuel_exploitation','cout_annuel_exploitation','devise','donnees_en_direct'],[cfg.countryName,cfg.countryCode,latest.input.workerType,latest.input.numWorkers,r.brutSoumis,r.totalRetenues,r.salaireNet,r.coutEmployeurParTravailleur,r.coutMensuelExploitation,r.coutAnnuelExploitation,r.devise,'non']];dl('\\ufeff'+x.map(function(row){return row.map(cell).join(',')}).join('\\r\\n'),'text/csv;charset=utf-8',slug+'.csv')}if(a==='pdf'){var J=window.jspdf&&window.jspdf.jsPDF;if(!J)return status('Export PDF indisponible.',true);var d=new J({unit:'pt',format:'a4'});d.text(d.splitTextToSize(t.normalize('NFD').replace(/[\\u0300-\\u036f]/g,''),500),48,58);d.save(slug+'.pdf')}status(a==='save'?'Résultat enregistré dans ce navigateur.':'Action terminée.')});window.__FR_AGRI_TEST__={calculate:calculate,latest:null,engine:engine,data:allData,reportObject:report};try{init()}catch(error){id('formError').textContent=error.message;console.error(error)}})();</script>`;
  return renderFrenchAgriculturePage({
    row,
    title: `Paie agricole — ${row.country.frenchName} | AfroTools`,
    description: `Estimez salaire brut, retenues, net et coût employeur agricole en ${row.country.frenchName}.`,
    heading: `Paie agricole — ${row.country.frenchName}`,
    lead: 'Calculez localement la rémunération d’un travailleur et le coût total de votre équipe avec les repères pays maintenus.',
    artwork: row.artwork.file,
    body,
    scripts,
    pageConfig: config,
    familyLabel: 'Paie agricole',
    familyRoute: '/fr/agriculture/farm-payroll/',
  });
}

module.exports = { id: 'farm-payroll', WORKER_TYPES, renderHub, render };
