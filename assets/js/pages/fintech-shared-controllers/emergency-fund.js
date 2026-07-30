'use strict';

// Exact controller extracted from tools/emergency-fund/index.html.
// English and French route owners load this same file; keep formula changes shared.
function efText(key,fallback){
  return window.AfroToolsFintechI18n
    ? window.AfroToolsFintechI18n.text('emergency-fund',key,fallback)
    : fallback;
}
function calcEF(){
  var currency=document.getElementById('ef-currency').value;
  var monthly=parseFloat(document.getElementById('ef-monthly').value);
  var months=Number(document.getElementById('ef-months').value);
  var current=parseFloat(document.getElementById('ef-current').value);
  var monthlySave=parseFloat(document.getElementById('ef-monthly-save').value);
  var inflationPercent=parseFloat(document.getElementById('ef-inflation').value);
  var inflationYears=Number(document.getElementById('ef-inflation-years').value);
  var error=document.getElementById('ef-error');
  var output=document.getElementById('ef-results');
  error.textContent='';output.classList.remove('on');
  if(!Number.isFinite(monthly)||monthly<=0||!Number.isInteger(months)||months<1||months>24||!Number.isFinite(current)||current<0||!Number.isFinite(monthlySave)||monthlySave<0||!Number.isFinite(inflationPercent)||inflationPercent<0||inflationPercent>100||!Number.isInteger(inflationYears)||inflationYears<0||inflationYears>10){
    error.textContent=efText('invalid','Enter positive essential expenses, 1 to 24 whole coverage months, non-negative savings, inflation from 0% to 100%, and 0 to 10 whole planning years.');return;
  }
  var inflation=inflationPercent/100;
  var target=monthly*months;
  var gap=Math.max(0,target-current);
  var monthsToGoal=gap===0?efText('goalReached','Goal reached'):(monthlySave>0?Math.ceil(gap/monthlySave)+' '+efText('months','months'):efText('addSaving','Add monthly saving'));
  var monthlyNeeded=gap/12;
  var inflAdj=target*Math.pow(1+inflation,inflationYears);
  var progress=target>0?Math.min(100,(current/target)*100):0;
  function fmt(n){return currency+' '+n.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});}
  document.getElementById('ef-target').textContent=fmt(target);
  document.getElementById('ef-sub').textContent=months+' '+efText('expenses','months of expenses')+' | '+efText('monthly','Monthly')+': '+fmt(monthly);
  document.getElementById('ef-gap').textContent=fmt(gap);
  document.getElementById('ef-months-to-goal').textContent=monthsToGoal;
  document.getElementById('ef-monthly-need').textContent=fmt(monthlyNeeded);
  document.getElementById('ef-inflation-adj').textContent=fmt(inflAdj);
  document.getElementById('ef-inflation-label').textContent=efText('inflationAdjusted','Inflation-Adjusted Target')+' ('+inflationYears+' '+(inflationYears===1?efText('year','year'):efText('years','years'))+')';
  document.getElementById('ef-progress-pct').textContent=progress.toFixed(0)+'%';
  document.getElementById('ef-progress-fill').style.width=progress+'%';
  output.classList.add('on');output.focus();
}
