'use strict';

const { renderFrenchAgriculturePage } = require('../fr-agriculture-page-shell');

const CURRENCIES = Object.freeze({
  NGN: '₦', KES: 'KSh', GHS: 'GH₵', ZAR: 'R', TZS: 'TSh', UGX: 'USh',
  ETB: 'Br', EGP: 'E£', MAD: 'DH', XOF: 'CFA', XAF: 'CFA',
  ZMW: 'K', RWF: 'RF', MWK: 'MK', USD: '$',
});

function options(values) {
  return Object.entries(values).map(([value, label]) => `<option value="${value}">${label}</option>`).join('');
}

function render(row) {
  const pageConfig = {
    id: row.english.id,
    currencies: CURRENCIES,
    errors: {
      'missing-revenue': 'Saisissez le revenu total de la coopérative.',
      'missing-members': 'Saisissez le nombre de membres.',
      'allocation-not-100': 'La répartition totale de l’excédent doit être égale à 100 %.',
      'negative-surplus': 'Les dépenses dépassent les revenus : aucun excédent ne peut être réparti.',
      'missing-total-produce': 'Pour la ristourne, saisissez la production totale collectée.',
      'missing-total-shares': 'Pour la méthode par parts, saisissez le capital social total.',
      'missing-hybrid-totals': 'Pour la méthode hybride, saisissez la production totale ou le capital social total.',
    },
  };
  const body = `<section class="card"><h2>Coopérative et exercice</h2>
<form id="coopForm" novalidate><div class="grid">
<div class="field"><label for="coopType">Type de coopérative</label><select id="coopType"><option value="agri">Coopérative agricole</option><option value="sacco">Coopérative d’épargne et de crédit (SACCO)</option><option value="multi">Coopérative polyvalente</option></select></div>
<div class="field"><label for="currency">Monnaie</label><select id="currency">${options(Object.fromEntries(Object.keys(CURRENCIES).map(code => [code, code])))}</select></div>
<div class="field"><label for="revenue">Revenu total de la coopérative</label><input id="revenue" type="number" min="0" step="0.01" value="10000000"></div>
<div class="field"><label for="expenses">Dépenses totales</label><input id="expenses" type="number" min="0" step="0.01" value="6500000"></div>
<div class="field"><label for="members">Nombre de membres</label><input id="members" type="number" min="1" step="1" value="120"></div>
<div class="field"><label for="method">Méthode de distribution</label><select id="method"><option value="patronage">Ristourne selon les apports</option><option value="shares">Distribution selon les parts</option><option value="hybrid">Méthode hybride</option></select></div>
<div class="field agri"><label for="myProduce">Votre production livrée (même unité)</label><input id="myProduce" type="number" min="0" step="0.01" value="1200"></div>
<div class="field agri"><label for="totalProduce">Production totale collectée (même unité)</label><input id="totalProduce" type="number" min="0" step="0.01" value="85000"></div>
<div class="field"><label for="myShares">Votre capital social</label><input id="myShares" type="number" min="0" step="0.01" value="50000"></div>
<div class="field"><label for="totalShares">Capital social total</label><input id="totalShares" type="number" min="0" step="0.01" value="3500000"></div>
<div class="field agri"><label for="marketPrice">Prix de vente indépendant par unité</label><input id="marketPrice" type="number" min="0" step="0.01" value="450"></div>
<div class="field sacco" hidden><label for="saccoRate">Taux déclaré sur les parts (%)</label><input id="saccoRate" type="number" min="0" max="100" step="0.01" value="12"></div>
<div class="field hybrid" hidden><label for="hybridPatronagePct">Part de la ristourne dans le fonds de distribution (%)</label><input id="hybridPatronagePct" type="number" min="0" max="100" step="1" value="50"></div>
</div>
<h3>Répartition de l’excédent</h3><div class="grid">
<div class="field"><label for="reserve">Réserve (%)</label><input id="reserve" type="number" min="0" max="100" step="0.1" value="25"></div>
<div class="field"><label for="education">Éducation et formation (%)</label><input id="education" type="number" min="0" max="100" step="0.1" value="5"></div>
<div class="field"><label for="dividend">Fonds distribué aux membres (%)</label><input id="dividend" type="number" min="0" max="100" step="0.1" value="50"></div>
<div class="field"><label for="social">Fonds social (%)</label><input id="social" type="number" min="0" max="100" step="0.1" value="5"></div>
<div class="field"><label for="retained">Résultat reporté (%)</label><input id="retained" type="number" min="0" max="100" step="0.1" value="15"></div>
</div><p id="allocationHelp">Total saisi : 100 %.</p>
<div class="actions"><button class="action primary" type="submit">Calculer ma part</button><button class="action" type="reset">Réinitialiser</button></div><p class="error" id="error" role="alert" aria-live="assertive"></p></form></section>
<section class="card"><h2>Résultats</h2><div class="empty" id="empty">Aucun scénario calculé.</div><div id="resultPanel" class="result-panel" hidden>
<div class="result-hero"><div class="result-value" id="headline"></div><p id="lead"></p></div>
<h3>Exercice et répartition</h3><div class="result-grid" id="summary"></div>
<h3>Votre distribution</h3><div class="result-grid" id="member"></div>
<div id="comparisonWrap" hidden><h3>Coopérative ou vente indépendante</h3><div class="result-grid" id="comparison"></div></div>
<div id="saccoWrap" hidden><h3>Rendement des parts SACCO</h3><div class="result-grid" id="sacco"></div></div>
<div class="actions"><button class="action" type="button" data-action="copy">Copier</button><button class="action" type="button" data-action="share">Partager</button><button class="action" type="button" data-action="save">Enregistrer dans ce navigateur</button><button class="action" type="button" data-action="pdf">Exporter en PDF</button><button class="action" type="button" data-action="csv">Exporter en CSV</button><button class="action" type="button" data-action="json">Exporter en JSON</button><button class="action" type="button" data-action="txt">Exporter en TXT</button></div><p class="status" id="status" role="status" aria-live="polite"></p>
</div></section>
<section class="card"><h2>Hypothèses, sources et limites</h2><div class="trust-grid">
<div class="trust-item"><strong>Propriétaire du calcul</strong><span>Même moteur pur et mêmes formules que la page anglaise acceptée; aucune formule dupliquée dans la présentation française.</span></div>
<div class="trust-item"><strong>Fraîcheur</strong><span>Vos chiffres et vos taux alimentent le modèle. Il ne contient ni taux légal, ni prix, ni données financières en direct.</span></div>
<div class="trust-item"><strong>Confiance</strong><span>Scénario de planification à rapprocher des statuts, comptes approuvés et règles applicables à votre coopérative.</span></div></div>
<p>Les valeurs préremplies de répartition sont seulement un exemple modifiable. Elles ne prouvent aucune obligation légale universelle. Confirmez réserve, fonds sociaux, méthode, base de ristourne et approbation de l’assemblée selon vos statuts et votre juridiction.</p>
<p><strong>Confidentialité :</strong> calcul local; aucune saisie envoyée à un serveur.</p></section>`;
  const scripts = `<script src="/engines/cooperative-engine.js"></script><script src="/assets/vendor/jspdf/jspdf.umd.min.js"></script>
<script>(function(){'use strict';var cfg=window.__FR_AGRI_PAGE__,engine=window.AfroTools.CooperativeEngine,latest=null;
function id(v){return document.getElementById(v)}function num(v){return Number(id(v).value)||0}function nf(v,d){return new Intl.NumberFormat('fr-FR',{minimumFractionDigits:d||0,maximumFractionDigits:d==null?0:d}).format(v)}function money(v){return(cfg.currencies[id('currency').value]||id('currency').value+' ')+nf(v,0)}function metric(l,v){var b=document.createElement('div'),s=document.createElement('strong'),x=document.createElement('span');b.className='metric';s.textContent=v;x.textContent=l;b.append(s,x);return b}function fill(node,rows){node.replaceChildren();rows.forEach(function(r){node.appendChild(metric(r[0],r[1]))})}function cell(v){var t=String(v==null?'':v);return/[",\\n]/.test(t)?'"'+t.replace(/"/g,'""')+'"':t}function dl(c,t,n){var u=URL.createObjectURL(new Blob([c],{type:t})),a=document.createElement('a');a.href=u;a.download=n;document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(u)},0)}function status(v,e){id('status').textContent=v;id('status').style.color=e?'var(--agri-danger)':'var(--agri-good)'}
function input(){return{coopType:id('coopType').value,method:id('method').value,revenue:num('revenue'),expenses:num('expenses'),members:num('members'),myProduce:num('myProduce'),totalProduce:num('totalProduce'),myShares:num('myShares'),totalShares:num('totalShares'),marketPrice:num('marketPrice'),saccoRate:num('saccoRate'),hybridPatronagePct:num('hybridPatronagePct'),allocations:{reserve:num('reserve'),education:num('education'),dividend:num('dividend'),social:num('social'),retained:num('retained')}}}
function sync(){var type=id('coopType').value,method=id('method').value;document.querySelectorAll('.agri').forEach(function(e){e.hidden=type==='sacco'});document.querySelectorAll('.sacco').forEach(function(e){e.hidden=type!=='sacco'});document.querySelectorAll('.hybrid').forEach(function(e){e.hidden=method!=='hybrid'});var a=input().allocations,total=a.reserve+a.education+a.dividend+a.social+a.retained;id('allocationHelp').textContent='Total saisi : '+nf(total,1)+' %.'}
function renderResult(r){id('headline').textContent=money(r.memberDividend);id('lead').textContent='Distribution individuelle estimée · '+r.input.method+'.';fill(id('summary'),[['Revenu',money(r.input.revenue)],['Dépenses',money(r.input.expenses)],['Excédent',money(r.surplus)],['Marge',nf(r.surplusMarginPct,1)+' %'],['Fonds distribué',money(r.amounts.dividend)],['Membres',nf(r.input.members)]]);fill(id('member'),[['Votre distribution',money(r.memberDividend)],['Moyenne par membre',money(r.averageDividend)],['Écart à la moyenne',money(r.dividendDifference)],['Part ristourne',money(r.patronageDividend)],['Part capital',money(r.shareDividend)],['Répartition totale',nf(r.totalAllocationPct,1)+' %']]);id('comparisonWrap').hidden=!r.comparison;if(r.comparison)fill(id('comparison'),[['Vente indépendante',money(r.comparison.independentRevenue)],['Recette via la coopérative',money(r.comparison.cooperativeProduceRevenue)],['Total coopératif avec distribution',money(r.comparison.cooperativeTotalEarnings)],['Prime ou déficit',nf(r.comparison.premiumPct,1)+' %']]);id('saccoWrap').hidden=r.input.coopType!=='sacco';if(r.input.coopType==='sacco')fill(id('sacco'),[['Votre capital',money(r.input.myShares)],['Taux saisi',nf(r.input.saccoRate,2)+' %'],['Rendement des parts',money(r.saccoInterest)],['Total avec distribution',money(r.totalSaccoEarnings)]])}
function calculate(){id('error').textContent='';latest=engine.calculate(input());if(!latest.ok){id('error').textContent=cfg.errors[latest.status]||'Vérifiez les valeurs saisies.';return null}window.__FR_AGRI_TEST__.latest=latest;renderResult(latest);id('empty').hidden=true;id('resultPanel').hidden=false;status('Scénario calculé localement.');return latest}
function report(){return latest?{schemaVersion:1,outil:'cooperative-calculator',langue:'fr',monnaie:id('currency').value,entrees:latest.input,resultat:latest,sources:{moteur:'engines/src/cooperative-engine.js',donneesEnDirect:false},limitations:['Répartition, taux et chiffres fournis par l’utilisateur; confirmer les statuts et règles applicables.'],confidentialite:'Calcul local; aucune saisie envoyée.'}:null}
function text(){return latest?['AfroTools — Répartition coopérative','Monnaie : '+id('currency').value,'Revenu : '+money(latest.input.revenue),'Dépenses : '+money(latest.input.expenses),'Excédent : '+money(latest.surplus),'Fonds distribué : '+money(latest.amounts.dividend),'Votre distribution : '+money(latest.memberDividend),'Moyenne par membre : '+money(latest.averageDividend),'','Hypothèses saisies par l’utilisateur; confirmer les statuts et règles applicables.','Confidentialité : calcul local.'].join('\\n'):''}
id('coopForm').addEventListener('input',sync);id('coopType').addEventListener('change',function(){if(id('coopType').value==='sacco')id('method').value='shares';sync()});id('coopForm').addEventListener('submit',function(e){e.preventDefault();calculate()});id('coopForm').addEventListener('reset',function(){setTimeout(function(){latest=null;window.__FR_AGRI_TEST__.latest=null;id('empty').hidden=false;id('resultPanel').hidden=true;id('error').textContent='';status('');sync()},0)});
document.addEventListener('click',function(e){var b=e.target.closest('[data-action]');if(!b)return;if(!latest)return status('Calculez d’abord un scénario.',true);var a=b.dataset.action,v=report(),s=text(),slug='afrotools-cooperative';if(a==='copy')navigator.clipboard.writeText(s);if(a==='share')navigator.clipboard.writeText(location.href+'\\n\\n'+s);if(a==='save')localStorage.setItem('afrotools:fr-agriculture:cooperative-calculator',JSON.stringify(v));if(a==='txt')dl('\\ufeff'+s,'text/plain;charset=utf-8',slug+'.txt');if(a==='json')dl(JSON.stringify(v,null,2),'application/json;charset=utf-8',slug+'.json');if(a==='csv'){var rows=[['champ','valeur'],['monnaie',id('currency').value],['revenu',latest.input.revenue],['depenses',latest.input.expenses],['excedent',latest.surplus],['fonds_distribution',latest.amounts.dividend],['distribution_membre',latest.memberDividend],['moyenne_membre',latest.averageDividend]];dl('\\ufeff'+rows.map(function(r){return r.map(cell).join(',')}).join('\\r\\n'),'text/csv;charset=utf-8',slug+'.csv')}if(a==='pdf'){var Pdf=window.jspdf&&window.jspdf.jsPDF;if(!Pdf)return status('Export PDF indisponible.',true);var pdf=new Pdf({unit:'pt',format:'a4'});pdf.text(pdf.splitTextToSize(s.normalize('NFD').replace(/[\\u0300-\\u036f]/g,''),500),48,58);pdf.save(slug+'.pdf')}status(a==='save'?'Scénario enregistré dans ce navigateur.':'Action terminée.')});
window.__FR_AGRI_TEST__={latest:null,engine:engine,calculate:calculate,input:input,reportObject:report};sync()})();</script>`;
  return renderFrenchAgriculturePage({
    row,
    title: 'Calculateur de répartition coopérative | AfroTools',
    description: 'Estimez un excédent, sa répartition et la distribution d’un membre avec le même moteur que la page anglaise.',
    heading: 'Répartition de l’excédent coopératif',
    lead: 'Testez ristourne, parts sociales ou méthode hybride à partir de vos propres hypothèses et statuts.',
    artwork: row.artwork.file,
    body,
    scripts,
    pageConfig,
    familyLabel: 'Répartition coopérative',
    familyRoute: row.french.routeKey,
  });
}

module.exports = { CURRENCIES, render };
