'use strict';

// Exact controller extracted from tools/fire-calc/index.html.
// English and French route owners load this same file; keep formula changes shared.
function fireText(key,fallback){
  return window.AfroToolsFintechI18n
    ? window.AfroToolsFintechI18n.text('fire-calc',key,fallback)
    : fallback;
}
function calcFIRE(){
  var age=parseInt(document.getElementById('fire-age').value);
  var retireAge=parseInt(document.getElementById('fire-retire-age').value);
  var monthlyExpenses=parseFloat(document.getElementById('fire-expenses').value);
  var retireExpenses=parseFloat(document.getElementById('fire-retire-expenses').value);
  var currentSavings=parseFloat(document.getElementById('fire-savings').value);
  var monthlySave=parseFloat(document.getElementById('fire-monthly-save').value);
  var returnPercent=parseFloat(document.getElementById('fire-return').value);
  var inflationPercent=parseFloat(document.getElementById('fire-inflation').value);
  var withdrawalPercent=parseFloat(document.getElementById('fire-withdrawal').value);
  var currency=document.getElementById('fire-currency').value,error=document.getElementById('fire-error'),output=document.getElementById('fire-results');
  error.textContent='';output.classList.remove('on');
  if(!Number.isFinite(age)||!Number.isFinite(retireAge)||retireAge<=age){error.textContent=fireText('invalidAge','Target age must be greater than current age.');return;}
  if(!Number.isFinite(monthlyExpenses)||monthlyExpenses<0||!Number.isFinite(retireExpenses)||retireExpenses<=0||!Number.isFinite(currentSavings)||currentSavings<0||!Number.isFinite(monthlySave)||monthlySave<0){error.textContent=fireText('invalidAmounts','Enter non-negative current spending, savings and contributions, plus retirement spending above zero.');return;}
  if(!Number.isFinite(returnPercent)||returnPercent<=-100||returnPercent>1000||!Number.isFinite(inflationPercent)||inflationPercent<=-100||inflationPercent>1000||!Number.isFinite(withdrawalPercent)||withdrawalPercent<=0||withdrawalPercent>20){error.textContent=fireText('invalidRates','Return and inflation must be above -100% and no more than 1,000%; withdrawal rate must be above 0% and no more than 20%.');return;}
  var returnRate=returnPercent/100,inflation=inflationPercent/100,withdrawalRate=withdrawalPercent/100;
  var realReturn=((1+returnRate)/(1+inflation))-1;
  var yearsToRetire=retireAge-age;
  var retireExpensesAtTarget=retireExpenses*Math.pow(1+inflation,yearsToRetire);
  var annualRetireExp=retireExpensesAtTarget*12;
  var fireNumber=annualRetireExp/withdrawalRate;
  var monthlyRate=Math.pow(1+returnRate,1/12)-1;
  var months=yearsToRetire*12;
  var growthFactor=Math.pow(1+monthlyRate,months),annuityFactor=Math.abs(monthlyRate)<1e-12?months:(growthFactor-1)/monthlyRate;
  var portfolioAtRetire=currentSavings*growthFactor+monthlySave*annuityFactor;
  var needed=Math.max(0,(fireNumber-currentSavings*growthFactor)/annuityFactor);
  var savingsRate=(monthlyExpenses+monthlySave)>0?(monthlySave/(monthlyExpenses+monthlySave))*100:0;
  function fmt(n){return currency+' '+n.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});}
  document.getElementById('fire-number').textContent=fmt(fireNumber);
  document.getElementById('fire-sub').textContent=fireText('targetSpending','Target-date spending')+' '+fmt(retireExpensesAtTarget)+'/'+fireText('perMonth','month')+' ÷ '+withdrawalPercent.toFixed(2)+'% | '+fireText('realReturn','Real return scenario')+' '+(realReturn*100).toFixed(2)+'%';
  document.getElementById('fire-years').textContent=yearsToRetire+' '+(yearsToRetire===1?fireText('year','year'):fireText('years','years'));
  document.getElementById('fire-retire-year').textContent=(new Date().getFullYear()+yearsToRetire);
  document.getElementById('fire-portfolio-at-retire').textContent=fmt(portfolioAtRetire);
  document.getElementById('fire-monthly-needed').textContent=fmt(needed);
  document.getElementById('fire-savings-rate').textContent=savingsRate.toFixed(2)+'%';
  document.getElementById('fire-swr3').textContent=fmt(portfolioAtRetire*0.03/12)+'/'+fireText('monthlyShort','mo');
  document.getElementById('fire-swr4').textContent=fmt(portfolioAtRetire*0.04/12)+'/'+fireText('monthlyShort','mo');
  document.getElementById('fire-swr5').textContent=fmt(portfolioAtRetire*0.05/12)+'/'+fireText('monthlyShort','mo');
  document.getElementById('fire-swr6').textContent=fmt(portfolioAtRetire*0.06/12)+'/'+fireText('monthlyShort','mo');
  output.classList.add('on');output.focus({preventScroll:true});
}
