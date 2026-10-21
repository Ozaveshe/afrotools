'use strict';

// Exact controller extracted from tools/emergency-fund/index.html.
// English and French route owners load this same file; keep formula changes shared.
function efText(key,fallback){
  return window.AfroToolsFintechI18n
    ? window.AfroToolsFintechI18n.text('emergency-fund',key,fallback)
    : fallback;
}
function clearEfResults(){
  var output=document.getElementById('ef-results');if(output)output.classList.remove('on');
  ['ef-target','ef-sub','ef-gap','ef-months-to-goal','ef-monthly-need','ef-inflation-adj','ef-inflation-label','ef-progress-pct'].forEach(function(id){var node=document.getElementById(id);if(node)node.textContent='';});
  var fill=document.getElementById('ef-progress-fill');if(fill)fill.style.width='0%';
}
function efFail(key,message){
  var error=document.getElementById('ef-error');error.textContent=efText(key,message);error.setAttribute('tabindex','-1');error.focus();
}
(function(){
  function invalidate(event){if(['ef-currency','ef-monthly','ef-months','ef-current','ef-monthly-save','ef-inflation','ef-inflation-years'].indexOf(event.target&&event.target.id)<0)return;clearEfResults();var error=document.getElementById('ef-error');if(error)error.textContent='';}
  document.addEventListener('input',invalidate);document.addEventListener('change',invalidate);
}());
function calcEF(){
  clearEfResults();
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
    efFail('invalid','Enter positive essential expenses, 1 to 24 whole coverage months, non-negative savings, inflation from 0% to 100%, and 0 to 10 whole planning years.');return;
  }
  var inflation=inflationPercent/100;
  var target=monthly*months;
  var gap=Math.max(0,target-current);
  var savingMonths=gap>0&&monthlySave>0?Math.max(1,Math.ceil(gap/monthlySave)):0;
  var monthlyNeeded=gap/12;
  var inflAdj=target*Math.pow(1+inflation,inflationYears);
  var progress=target>0?Math.min(100,(current/target)*100):0;
  if(![target,gap,savingMonths,monthlyNeeded,inflAdj,progress].every(Number.isFinite)){
    efFail('unrepresentable','These values produce a result too large to calculate. Reduce the amounts or increase monthly saving.');return;
  }
  var monthsToGoal=gap===0?efText('goalReached','Goal reached'):(monthlySave>0?savingMonths+' '+efText('months','months'):efText('addSaving','Add monthly saving'));
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
