'use strict';

// Exact controller extracted from tools/dca-calc/index.html.
// English and French route owners load this same file; keep formula changes shared.
function dcaText(key,fallback){
  return window.AfroToolsFintechI18n
    ? window.AfroToolsFintechI18n.text('dca-calc',key,fallback)
    : fallback;
}
function calcDCA(){
  var currency=document.getElementById('dca-currency').value;
  var monthly=parseFloat(document.getElementById('dca-monthly').value);
  var initial=parseFloat(document.getElementById('dca-initial').value);
  var years=parseInt(document.getElementById('dca-years').value);
  var ratePercent=parseFloat(document.getElementById('dca-rate').value);
  var error=document.getElementById('dca-error');var output=document.getElementById('dca-results');error.textContent='';output.classList.remove('on');
  if(!Number.isFinite(monthly)||monthly<0||!Number.isFinite(initial)||initial<0||monthly+initial<=0||!Number.isInteger(years)||years<1||!Number.isFinite(ratePercent)||ratePercent<=-100||ratePercent>1000){error.textContent=dcaText('invalid','Enter non-negative contributions with at least one amount above zero, and an annual return above -100% and no higher than 1,000%.');return;}
  var months=years*12;
  function futureValue(annualPercent){var annual=annualPercent/100;var mr=Math.pow(1+annual,1/12)-1;var fvA=Math.abs(mr)<1e-12?monthly*months:monthly*((Math.pow(1+mr,months)-1)/mr);return {value:fvA+initial*Math.pow(1+mr,months),monthlyRate:mr};}
  var target=futureValue(ratePercent);var total=target.value;
  var totalInvested=monthly*months+initial;
  var totalReturn=total-totalInvested;
  function fmt(n){return currency+' '+n.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});}
  var lower=Math.max(-99.99,ratePercent-5),higher=Math.min(1000,ratePercent+5);
  document.getElementById('dca-value').textContent=fmt(total);
  document.getElementById('dca-sub').textContent=dcaText('totalInvested','Total invested')+': '+fmt(totalInvested)+' | '+dcaText('over','Over')+' '+years+' '+dcaText('years','years');
  document.getElementById('dca-total-invested').textContent=fmt(totalInvested);
  document.getElementById('dca-total-return').textContent=fmt(totalReturn);
  document.getElementById('dca-total-units').textContent=months;
  document.getElementById('dca-avg-cost').textContent=(target.monthlyRate*100).toFixed(4)+'%';
  document.getElementById('dca-l1').textContent=dcaText('lowerScenario','Lower scenario')+' ('+lower.toFixed(2)+'%)';document.getElementById('dca-l2').textContent=dcaText('enteredScenario','Entered scenario')+' ('+ratePercent.toFixed(2)+'%)';document.getElementById('dca-l3').textContent=dcaText('higherScenario','Higher scenario')+' ('+higher.toFixed(2)+'%)';
  document.getElementById('dca-s1').textContent=fmt(futureValue(lower).value);document.getElementById('dca-s2').textContent=fmt(total);document.getElementById('dca-s3').textContent=fmt(futureValue(higher).value);document.getElementById('dca-s4').textContent=fmt(totalInvested);
  output.classList.add('on');output.focus();
}
