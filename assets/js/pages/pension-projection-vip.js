(function () {
  'use strict';
  var form = document.getElementById('pension-form');
  var resultBox = document.getElementById('pension-result');
  var errorBox = document.getElementById('pension-error');
  var statusBox = document.getElementById('pension-status');
  var lastResult = null;
  function field(id) { return document.getElementById(id); }
  function value(id) { return field(id).value; }
  function money(amount, currency) { return new Intl.NumberFormat('en', { style: 'currency', currency: currency, maximumFractionDigits: 2 }).format(amount); }
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
    field('sensitivity').textContent='At '+result.lower.annualReturnPercent.toFixed(2)+'% gross return: '+money(result.lower.endingBalance,c)+'. At '+result.higher.annualReturnPercent.toFixed(2)+'%: '+money(result.higher.endingBalance,c)+'. These are deterministic sensitivity cases, not probabilities.';
    field('year-body').innerHTML=b.yearly.map(function(row){return '<tr><td>'+row.year+'</td><td>'+money(row.balance,c)+'</td></tr>';}).join('');
    resultBox.hidden=false; statusBox.textContent='Projection calculated locally. Nothing was sent or stored.';
  }
  form.addEventListener('submit',function(e){e.preventDefault();errorBox.textContent='';try{lastResult=window.AfroTools.engines.pensionProjectionPlanner.calculate(input());render(lastResult);}catch(error){lastResult=null;resultBox.hidden=true;errorBox.textContent=error.message;errorBox.focus();}});
  function summaryLines(){var r=lastResult,b=r.base,c=r.inputs.currency;return ['Pension projection planning brief','Currency: '+c,'Projection years: '+r.inputs.years,'Ending balance: '+money(b.endingBalance,c),'Inflation-adjusted value: '+money(b.realValue,c),'Future contributions: '+money(b.futureContributions,c),'Investment growth: '+money(b.investmentGrowth,c),'Gross return assumption: '+r.inputs.annualReturnPercent+'%','Annual fee drag: '+r.inputs.annualFeePercent+'%','Inflation assumption: '+r.inputs.inflationPercent+'%','Evidence: '+r.inputs.sourceLabel+' (checked '+r.inputs.sourceCheckedDate+')','Planning estimate only; not a pension entitlement, provider quote, annuity, tax result or guarantee.'];}
  document.getElementById('copy-result').addEventListener('click',async function(){if(!lastResult)return;await navigator.clipboard.writeText(summaryLines().join('\n'));statusBox.textContent='Summary copied locally.';});
  document.getElementById('csv-result').addEventListener('click',function(){if(!lastResult)return;var c=lastResult.inputs.currency;var rows=[['Year','Projected balance ('+c+')']].concat(lastResult.base.yearly.map(function(x){return [x.year,x.balance.toFixed(2)];}));var blob=new Blob([rows.map(function(r){return r.join(',');}).join('\n')],{type:'text/csv;charset=utf-8'});var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='pension-projection.csv';a.click();URL.revokeObjectURL(a.href);statusBox.textContent='CSV downloaded locally.';});
  document.getElementById('pdf-result').addEventListener('click',async function(){if(!lastResult||!window.AfroTools.pdf)return;var r=lastResult,b=r.base,c=r.inputs.currency;await window.AfroTools.pdf.generate({toolId:'pension-proj',category:'financial',title:'Pension Projection Planning Brief',subtitle:'User assumptions only',currency:c,noGate:true,skipGate:true,heroStats:[['Ending balance',money(b.endingBalance,c)],['Real value',money(b.realValue,c)],['Investment growth',money(b.investmentGrowth,c)]],sections:[{title:'Inputs and evidence',rows:[['Projection years',r.inputs.years],['Gross annual return',r.inputs.annualReturnPercent+'%'],['Annual fee drag',r.inputs.annualFeePercent+'%'],['Annual inflation',r.inputs.inflationPercent+'%'],['Evidence',r.inputs.sourceLabel+' checked '+r.inputs.sourceCheckedDate]]},{title:'Contribution breakdown',rows:[['Personal',money(b.personalContributions,c)],['Employer',money(b.employerContributions,c)],['Voluntary',money(b.voluntaryContributions,c)],['Future contributions',money(b.futureContributions,c)],['Ending balance',money(b.endingBalance,c)]]}],source:'Investor.gov compound-interest method; IOPS pension-projection disclosure practices. All plan values are user supplied.',disclaimer:'Planning estimate only. Not a pension entitlement, provider quote, annuity, tax result, legal advice or guaranteed return.'});statusBox.textContent='PDF generated locally.';});
})();
