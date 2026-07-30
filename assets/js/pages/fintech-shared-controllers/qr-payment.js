'use strict';

// Exact controller extracted from tools/qr-payment/index.html.
// English and French route owners load this same file; keep formula changes shared.
function qrText(key,fallback){
  return window.AfroToolsFintechI18n
    ? window.AfroToolsFintechI18n.text('qr-payment',key,fallback)
    : fallback;
}
function calcQR(){
  var ids=['qr-avg-txn','qr-daily-txns','qr-days','qr-rate','qr-flat','qr-pos-rate','qr-pos-flat','qr-mm-rate','qr-mm-flat','qr-cash-cost'];
  var v={};
  ids.forEach(function(id){v[id]=Number(document.getElementById(id).value);});
  var error=document.getElementById('qr-error');
  var results=document.getElementById('qr-results');
  if(ids.some(function(id){return !Number.isFinite(v[id]);})||v['qr-avg-txn']<=0||v['qr-daily-txns']<=0||v['qr-days']<1||v['qr-days']>31||ids.slice(3).some(function(id){return v[id]<0;})){
    error.textContent=qrText('invalid','Enter a positive transaction value and count, 1–31 operating days, and non-negative fee values.');
    error.classList.add('on');results.classList.remove('on');return;
  }
  error.classList.remove('on');
  var currency=document.getElementById('qr-currency').value;
  var avgTxn=v['qr-avg-txn'];
  var monthlyTxns=v['qr-daily-txns']*v['qr-days'];
  var monthlyVol=avgTxn*monthlyTxns;
  var fee=function(rate,flat){return monthlyVol*rate/100+monthlyTxns*flat;};
  var monthlyQRFee=fee(v['qr-rate'],v['qr-flat']);
  var qrTxnFee=monthlyQRFee/monthlyTxns;
  var effectiveRate=monthlyQRFee/monthlyVol*100;
  var posFee=fee(v['qr-pos-rate'],v['qr-pos-flat']);
  var mmFee=fee(v['qr-mm-rate'],v['qr-mm-flat']);
  var cashFee=monthlyVol*v['qr-cash-cost']/100;
  var nf=new Intl.NumberFormat(undefined,{style:'currency',currency:currency,maximumFractionDigits:2});
  function fmt(n){return nf.format(n);}
  document.getElementById('qr-monthly-vol').textContent=fmt(monthlyVol);
  document.getElementById('qr-per-txn').textContent=fmt(qrTxnFee);
  document.getElementById('qr-effective-rate').textContent=effectiveRate.toFixed(2)+'%';
  document.getElementById('qr-annual-fee').textContent=fmt(monthlyQRFee*12);
  document.getElementById('qr-monthly-fee').textContent=fmt(monthlyQRFee);
  document.getElementById('qr-sub').textContent=qrText('on','On')+' '+fmt(monthlyVol)+' '+qrText('monthlyVolume','monthly volume')+' · '+monthlyTxns.toLocaleString()+' '+qrText('transactions','transactions');
  var methods=[
    {name:qrText('qr','QR Payments'),fee:monthlyQRFee,rate:effectiveRate},
    {name:qrText('mobileMoney','Mobile Money'),fee:mmFee,rate:mmFee/monthlyVol*100},
    {name:qrText('card','POS / Card'),fee:posFee,rate:posFee/monthlyVol*100},
    {name:qrText('cash','Cash Handling'),fee:cashFee,rate:cashFee/monthlyVol*100}
  ];
  methods.sort(function(a,b){return a.fee-b.fee;});
  var compareHTML='';
  for(var i=0;i<methods.length;i++){
    var m=methods[i];
    compareHTML+='<div class="method-item'+(i===0?' best':'')+'"><div class="method-name">'+m.name+(i===0?' · '+qrText('lowest','Lowest entered cost'):'')+'</div><div class="method-fee">'+fmt(m.fee)+'/'+qrText('perMonth','mo')+'</div><div class="method-rate">'+m.rate.toFixed(2)+'% '+qrText('ofVolume','of volume')+'</div></div>';
  }
  document.getElementById('qr-compare').innerHTML=compareHTML;
  document.getElementById('qr-results').classList.add('on');
}
