'use strict';

// Exact controller extracted from tools/merchant-fees/index.html.
// English and French route owners load this same file; keep formula changes shared.
function mfFeeText(key,fallback){
  return window.AfroToolsFintechI18n
    ? window.AfroToolsFintechI18n.text('merchant-fees',key,fallback)
    : fallback;
}
function updateRange(id,valId){
  document.getElementById(valId).textContent=document.getElementById(id).value+'%';
}
function calcMerchantFees(){
  var vol=parseFloat(document.getElementById('mf-monthly-vol').value);
  var avgTxn=parseFloat(document.getElementById('mf-avg-txn').value);
  var cardPct=parseFloat(document.getElementById('mf-card-pct').value)/100;
  var mmPct=parseFloat(document.getElementById('mf-mm-pct').value)/100;
  var bankPct=parseFloat(document.getElementById('mf-bank-pct').value)/100;
  var cashPct=parseFloat(document.getElementById('mf-cash-pct').value)/100;
  var cardRate=parseFloat(document.getElementById('mf-card-rate').value)/100;
  var mmRate=parseFloat(document.getElementById('mf-mm-rate').value)/100;
  var bankRate=parseFloat(document.getElementById('mf-bank-rate').value)/100;
  var cashRate=parseFloat(document.getElementById('mf-cash-rate').value)/100;
  var currency=document.getElementById('mf-currency').value,error=document.getElementById('mf-error'),output=document.getElementById('mf-results');
  error.textContent='';output.classList.remove('on');
  var mixTotal=cardPct+mmPct+bankPct+cashPct,rates=[cardRate,mmRate,bankRate,cashRate];
  if(!Number.isFinite(vol)||vol<=0||!Number.isFinite(avgTxn)||avgTxn<=0){error.textContent=mfFeeText('invalidAmounts','Monthly sales and average transaction value must both be greater than zero.');return;}
  if(Math.abs(mixTotal-1)>0.0001){error.textContent=mfFeeText('invalidMix','Payment mix must total exactly 100%. Current total:')+' '+(mixTotal*100).toFixed(0)+'%.';return;}
  if(rates.some(function(rate){return !Number.isFinite(rate)||rate<0||rate>1;})){error.textContent=mfFeeText('invalidRates','Each entered fee rate must be from 0% to 100%.');return;}
  var cardVol=vol*cardPct,mmVol=vol*mmPct,bankVol=vol*bankPct,cashVol=vol*cashPct;
  var cardFee=cardVol*cardRate,mmFee=mmVol*mmRate,bankFee=bankVol*bankRate,cashFee=cashVol*cashRate;
  var totalFee=cardFee+mmFee+bankFee+cashFee;
  var blendedRate=(totalFee/vol)*100;
  var totalTxns=Math.round(vol/avgTxn);
  function fmt(n){return currency+' '+n.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});}
  document.getElementById('mf-total-fee').textContent=fmt(totalFee);
  document.getElementById('mf-sub').textContent=mfFeeText('on','On')+' '+fmt(vol)+' '+mfFeeText('monthlyRevenue','monthly revenue')+' | '+mfFeeText('blendedRate','Blended rate')+(window.AfroToolsFintechI18n&&window.AfroToolsFintechI18n.isFrench()?' : ':': ')+blendedRate.toFixed(2)+'%';
  document.getElementById('mf-blended-rate').textContent=blendedRate.toFixed(2)+'%';
  document.getElementById('mf-net-revenue').textContent=fmt(vol-totalFee);
  document.getElementById('mf-annual-fees').textContent=fmt(totalFee*12);
  document.getElementById('mf-transactions').textContent=totalTxns.toLocaleString();
  var rows=[
    [mfFeeText('card','Card / POS'),fmt(cardVol),Math.round(cardPct*100)+'%',fmt(cardFee),(cardVol>0?(cardFee/cardVol*100).toFixed(2):0)+'%'],
    [mfFeeText('mobileMoney','Mobile Money'),fmt(mmVol),Math.round(mmPct*100)+'%',fmt(mmFee),(mmVol>0?(mmFee/mmVol*100).toFixed(2):0)+'%'],
    [mfFeeText('bankTransfer','Bank Transfer'),fmt(bankVol),Math.round(bankPct*100)+'%',fmt(bankFee),(bankVol>0?(bankFee/bankVol*100).toFixed(2):0)+'%'],
    [mfFeeText('cash','Cash'),fmt(cashVol),Math.round(cashPct*100)+'%',fmt(cashFee),(cashVol>0?(cashFee/cashVol*100).toFixed(2):0)+'%']
  ];
  var html='<tr><th>'+mfFeeText('method','Method')+'</th><th>'+mfFeeText('volume','Volume')+'</th><th>'+mfFeeText('mix','Mix')+'</th><th>'+mfFeeText('fees','Fees')+'</th><th>'+mfFeeText('effectiveRate','Effective Rate')+'</th></tr>';
  for(var i=0;i<rows.length;i++){
    html+='<tr><td>'+rows[i][0]+'</td><td>'+rows[i][1]+'</td><td>'+rows[i][2]+'</td><td>'+rows[i][3]+'</td><td>'+rows[i][4]+'</td></tr>';
  }
  html+='<tr class="total-row"><td>'+mfFeeText('total','TOTAL')+'</td><td>'+fmt(vol)+'</td><td>100%</td><td>'+fmt(totalFee)+'</td><td>'+blendedRate.toFixed(2)+'%</td></tr>';
  document.getElementById('mf-table').innerHTML=html;
  output.classList.add('on');output.focus({preventScroll:true});
}
