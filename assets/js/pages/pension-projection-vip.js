(function () {
  'use strict';
  var form = document.getElementById('pension-form');
  var resultBox = document.getElementById('pension-result');
  var errorBox = document.getElementById('pension-error');
  var statusBox = document.getElementById('pension-status');
  var lastResult = null;
  var french = document.documentElement.lang === 'fr';
  function t(english, frenchCopy) { return french ? frenchCopy : english; }
  function field(id) { return document.getElementById(id); }
  function value(id) { return field(id).value; }
  function money(amount, currency) { return new Intl.NumberFormat(french ? 'fr' : 'en', { style: 'currency', currency: currency, maximumFractionDigits: 2 }).format(amount); }
  function input() {
    return {
      currency:value('currency'), currentBalance:value('current-balance'), monthlyPersonal:value('personal-contribution'),
      monthlyEmployer:value('employer-contribution'), monthlyVoluntary:value('voluntary-contribution'), years:value('years'),
      annualReturnPercent:value('annual-return'), annualFeePercent:value('annual-fee'), inflationPercent:value('inflation'),
      contributionGrowthPercent:value('contribution-growth'), sourceLabel:value('source-label'), sourceCheckedDate:value('source-date'),
      asOfDate:new Date().toISOString().slice(0,10), schemeInputsConfirmed:field('scheme-confirmed').checked,
      assumptionsConfirmed:field('assumptions-confirmed').checked
    };
  }
  function render(result) {
    var b=result.base,c=result.inputs.currency;
    field('ending-balance').textContent=money(b.endingBalance,c);
    field('real-value').textContent=money(b.realValue,c);
    field('future-contributions').textContent=money(b.futureContributions,c);
    field('investment-growth').textContent=money(b.investmentGrowth,c);
    field('personal-total').textContent=money(b.personalContributions,c);
    field('employer-total').textContent=money(b.employerContributions,c);
    field('voluntary-total').textContent=money(b.voluntaryContributions,c);
    field('net-return').textContent=b.netAnnualReturnPercent.toFixed(2)+'%';
    field('sensitivity').textContent=french
      ? 'Avec un rendement brut de '+result.lower.annualReturnPercent.toFixed(2)+' % : '+money(result.lower.endingBalance,c)+'. Avec '+result.higher.annualReturnPercent.toFixed(2)+' % : '+money(result.higher.endingBalance,c)+'. Ce sont des scénarios déterministes, pas des probabilités.'
      : 'At '+result.lower.annualReturnPercent.toFixed(2)+'% gross return: '+money(result.lower.endingBalance,c)+'. At '+result.higher.annualReturnPercent.toFixed(2)+'%: '+money(result.higher.endingBalance,c)+'. These are deterministic sensitivity cases, not probabilities.';
    field('year-body').innerHTML=b.yearly.map(function(row){return '<tr><td>'+row.year+'</td><td>'+money(row.balance,c)+'</td></tr>';}).join('');
    resultBox.hidden=false; statusBox.textContent=t('Projection calculated locally. Nothing was sent or stored.','Projection calculée localement. Rien n’a été envoyé ni enregistré.');
  }
  form.addEventListener('submit',function(e){e.preventDefault();errorBox.textContent='';try{lastResult=window.AfroTools.engines.pensionProjectionPlanner.calculate(input());render(lastResult);}catch(error){lastResult=null;resultBox.hidden=true;errorBox.textContent=error.message;errorBox.focus();}});
  function summaryLines(){var r=lastResult,b=r.base,c=r.inputs.currency;return french
    ? ['Note de planification de projection de pension','Devise : '+c,'Durée de projection : '+r.inputs.years+' ans','Solde final : '+money(b.endingBalance,c),'Valeur corrigée de l’inflation : '+money(b.realValue,c),'Cotisations futures : '+money(b.futureContributions,c),'Croissance du placement : '+money(b.investmentGrowth,c),'Hypothèse de rendement brut : '+r.inputs.annualReturnPercent+' %','Frais annuels : '+r.inputs.annualFeePercent+' %','Hypothèse d’inflation : '+r.inputs.inflationPercent+' %','Preuve : '+r.inputs.sourceLabel+' (vérifiée le '+r.inputs.sourceCheckedDate+')','Estimation de planification uniquement ; ni droit à pension, ni devis, rente, résultat fiscal ou garantie.']
    : ['Pension projection planning brief','Currency: '+c,'Projection years: '+r.inputs.years,'Ending balance: '+money(b.endingBalance,c),'Inflation-adjusted value: '+money(b.realValue,c),'Future contributions: '+money(b.futureContributions,c),'Investment growth: '+money(b.investmentGrowth,c),'Gross return assumption: '+r.inputs.annualReturnPercent+'%','Annual fee drag: '+r.inputs.annualFeePercent+'%','Inflation assumption: '+r.inputs.inflationPercent+'%','Evidence: '+r.inputs.sourceLabel+' (checked '+r.inputs.sourceCheckedDate+')','Planning estimate only; not a pension entitlement, provider quote, annuity, tax result or guarantee.'];}
  document.getElementById('copy-result').addEventListener('click',async function(){if(!lastResult)return;if(!navigator.clipboard){statusBox.textContent=t('Copy is unavailable; use CSV or PDF.','Copie indisponible ; utilisez le CSV ou le PDF.');return;}try{await navigator.clipboard.writeText(summaryLines().join('\n'));statusBox.textContent=t('Summary copied locally.','Résumé copié localement.');}catch(_){statusBox.textContent=t('Copy is unavailable; use CSV or PDF.','Copie indisponible ; utilisez le CSV ou le PDF.');}});
  document.getElementById('csv-result').addEventListener('click',function(){if(!lastResult)return;var c=lastResult.inputs.currency;var rows=[[t('Year','Année'),t('Projected balance','Solde projeté')+' ('+c+')']].concat(lastResult.base.yearly.map(function(x){return [x.year,x.balance.toFixed(2)];}));var blob=new Blob(['\uFEFF'+rows.map(function(r){return r.join(',');}).join('\n')],{type:'text/csv;charset=utf-8'});var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=french?'projection-pension.csv':'pension-projection.csv';a.click();URL.revokeObjectURL(a.href);statusBox.textContent=t('CSV downloaded locally.','CSV téléchargé localement.');});
  document.getElementById('pdf-result').addEventListener('click',async function(){if(!lastResult||!window.AfroTools.pdf)return;var r=lastResult,b=r.base,c=r.inputs.currency;await window.AfroTools.pdf.generate({toolId:'pension-proj',category:'financial',title:t('Pension Projection Planning Brief','Note de planification de projection de pension'),subtitle:t('User assumptions only','Hypothèses saisies par l’utilisateur uniquement'),currency:c,noGate:true,skipGate:true,heroStats:[[t('Ending balance','Solde final'),money(b.endingBalance,c)],[t('Real value','Valeur réelle'),money(b.realValue,c)],[t('Investment growth','Croissance du placement'),money(b.investmentGrowth,c)]],sections:[{title:t('Inputs and evidence','Entrées et preuves'),rows:[[t('Projection years','Durée de projection'),r.inputs.years],[t('Gross annual return','Rendement annuel brut'),r.inputs.annualReturnPercent+'%'],[t('Annual fee drag','Frais annuels'),r.inputs.annualFeePercent+'%'],[t('Annual inflation','Inflation annuelle'),r.inputs.inflationPercent+'%'],[t('Evidence','Preuve'),r.inputs.sourceLabel+' '+t('checked','vérifiée le')+' '+r.inputs.sourceCheckedDate]]},{title:t('Contribution breakdown','Ventilation des cotisations'),rows:[[t('Personal','Personnelles'),money(b.personalContributions,c)],[t('Employer','Employeur'),money(b.employerContributions,c)],[t('Voluntary','Volontaires'),money(b.voluntaryContributions,c)],[t('Future contributions','Cotisations futures'),money(b.futureContributions,c)],[t('Ending balance','Solde final'),money(b.endingBalance,c)]]}],source:t('Investor.gov compound-interest method; IOPS pension-projection disclosure practices. All plan values are user supplied.','Méthode des intérêts composés d’Investor.gov et bonnes pratiques IOPS de présentation des projections. Toutes les valeurs du régime sont saisies par l’utilisateur.'),disclaimer:t('Planning estimate only. Not a pension entitlement, provider quote, annuity, tax result, legal advice or guaranteed return.','Estimation de planification uniquement. Ni droit à pension, devis, rente, résultat fiscal, conseil juridique ou rendement garanti.')});statusBox.textContent=t('PDF generated locally.','PDF généré localement.');});
})();
