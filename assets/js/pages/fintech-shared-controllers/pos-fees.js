'use strict';

// Exact controller extracted from tools/pos-fees/index.html.
// English and French route owners load this same file; keep formula changes shared.
function posText(key,fallback){
  return window.AfroToolsFintechI18n
    ? window.AfroToolsFintechI18n.text('pos-fees',key,fallback)
    : fallback;
}
function calcPOS(){
  var mdrPercent=parseFloat(document.getElementById('pos-mdr').value),mdr=mdrPercent/100;
  var flat=parseFloat(document.getElementById('pos-flat').value);
  var cap=parseFloat(document.getElementById('pos-cap').value);
  var monthlyFee=parseFloat(document.getElementById('pos-monthly-fee').value);
  var avgTxn=parseFloat(document.getElementById('pos-avg-txn').value);
  var dailyTxns=parseInt(document.getElementById('pos-txn-count').value);
  var cardPct=parseFloat(document.getElementById('pos-card-pct').value)/100;
  var days=parseInt(document.getElementById('pos-days').value),currency=document.getElementById('pos-currency').value,error=document.getElementById('pos-error'),output=document.getElementById('pos-results');
  error.textContent='';output.classList.remove('on');
  if(!Number.isFinite(mdrPercent)||mdrPercent<0||mdrPercent>100||!Number.isFinite(flat)||flat<0||!Number.isFinite(cap)||cap<0||!Number.isFinite(monthlyFee)||monthlyFee<0||!Number.isFinite(avgTxn)||avgTxn<=0||!Number.isFinite(dailyTxns)||dailyTxns<1||!Number.isFinite(cardPct)||cardPct<=0||cardPct>1||!Number.isFinite(days)||days<1||days>31){error.textContent=posText('invalid','Check the fee terms and volume: amounts cannot be negative, card share must be above 0% and at most 100%, and operating days must be 1 to 31.');return;}
  var dailyCardTxns=dailyTxns*cardPct;
  var dailyCardVol=dailyCardTxns*avgTxn;
  var monthlyCardVol=dailyCardVol*days;
  var txnFee=avgTxn*mdr+flat;
  if(cap>0) txnFee=Math.min(txnFee,cap);
  var monthlyTxnFees=txnFee*dailyCardTxns*days;
  var totalMonthly=monthlyTxnFees+monthlyFee;
  var effectiveRate=(totalMonthly/monthlyCardVol)*100;
  var annualCost=totalMonthly*12;
  function fmt(n){return currency+' '+n.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});}
  document.getElementById('pos-daily-vol').textContent=fmt(dailyCardVol);
  document.getElementById('pos-monthly-vol').textContent=fmt(monthlyCardVol);
  document.getElementById('pos-txn-fees').textContent=fmt(monthlyTxnFees);
  document.getElementById('pos-terminal-fee').textContent=fmt(monthlyFee);
  document.getElementById('pos-effective-rate').textContent=effectiveRate.toFixed(2)+'%';
  document.getElementById('pos-annual-cost').textContent=fmt(annualCost);
  document.getElementById('pos-total-monthly').textContent=fmt(totalMonthly);
  document.getElementById('pos-sub').textContent=posText('on','On')+' '+fmt(monthlyCardVol)+' '+posText('monthlyVolume','monthly card volume')+' | '+Math.round(cardPct*100)+'% '+posText('cardAcceptance','card acceptance');
  output.classList.add('on');output.focus({preventScroll:true});
}
