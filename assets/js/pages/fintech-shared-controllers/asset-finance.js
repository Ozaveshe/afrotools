'use strict';

// Exact controller extracted from tools/asset-finance/index.html.
// English and French route owners load this same file; keep formula changes shared.
function afText(key,fallback){
  return window.AfroToolsFintechI18n
    ? window.AfroToolsFintechI18n.text('asset-finance',key,fallback)
    : fallback;
}
function calcAssetFinance(){
  var currency=document.getElementById('af-currency').value;
  var price=parseFloat(document.getElementById('af-price').value);
  var depositPercent=parseFloat(document.getElementById('af-deposit').value);
  var annualPercent=parseFloat(document.getElementById('af-rate').value);
  var months=parseInt(document.getElementById('af-tenor').value);
  var balloonPercent=parseFloat(document.getElementById('af-balloon').value);
  var error=document.getElementById('af-error');
  var output=document.getElementById('af-results');
  error.textContent='';output.classList.remove('on');
  if(!Number.isFinite(price)||price<=0||!Number.isFinite(depositPercent)||depositPercent<0||depositPercent>=100||!Number.isFinite(annualPercent)||annualPercent<0||annualPercent>1000||!Number.isInteger(months)||months<1||!Number.isFinite(balloonPercent)||balloonPercent<0||depositPercent+balloonPercent>100){
    error.textContent=afText('invalid','Enter a positive price, a deposit below 100%, a rate from 0% to 1,000%, and deposit plus balloon no higher than 100% of the price.');return;
  }
  var depositPct=depositPercent/100;
  var annualRate=annualPercent/100;
  var balloonPct=balloonPercent/100;
  var deposit=price*depositPct;
  var balloon=price*balloonPct;
  var financed=price-deposit;
  var monthlyRate=annualRate/12;
  var monthly=monthlyRate>0?(financed-balloon/Math.pow(1+monthlyRate,months))*(monthlyRate*Math.pow(1+monthlyRate,months))/(Math.pow(1+monthlyRate,months)-1):(financed-balloon)/months;
  var totalPay=monthly*months+deposit+balloon;
  var totalInterest=totalPay-price;
  var effectiveAnnual=(Math.pow(1+monthlyRate,12)-1)*100;
  function fmt(n){return currency+' '+n.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});}
  document.getElementById('af-monthly').textContent=fmt(monthly);
  document.getElementById('af-sub').textContent=afText('financed','Financed')+': '+fmt(financed)+' '+afText('over','over')+' '+months+' '+afText('months','months');
  document.getElementById('af-financed').textContent=fmt(financed);
  document.getElementById('af-total-pay').textContent=fmt(totalPay);
  document.getElementById('af-total-interest').textContent=fmt(totalInterest);
  document.getElementById('af-deposit-amt').textContent=fmt(deposit);
  document.getElementById('af-balloon-amt').textContent=balloon>0?fmt(balloon):afText('none','None');
  document.getElementById('af-effective-rate').textContent=effectiveAnnual.toFixed(2)+'%';
  output.classList.add('on');output.focus();
}
