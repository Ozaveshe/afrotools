'use strict';

// Exact controller extracted from tools/payment-gateway/index.html.
// English and French route owners load this same file; keep formula changes shared.
function pgText(key,fallback){
  return window.AfroToolsFintechI18n
    ? window.AfroToolsFintechI18n.text('payment-gateway',key,fallback)
    : fallback;
}
function calcGateway(){
  var currency=document.getElementById('pg-currency').value;
  var avgTxn=parseFloat(document.getElementById('pg-avg-txn').value);
  var monthlyTxns=Number(document.getElementById('pg-monthly-txns').value);
  var monthlyVol=avgTxn*monthlyTxns;
  var error=document.getElementById('pg-error');
  var output=document.getElementById('pg-results');
  error.textContent='';
  output.classList.remove('on');
  if(!Number.isFinite(avgTxn)||avgTxn<=0||!Number.isInteger(monthlyTxns)||monthlyTxns<1){
    error.textContent=pgText('invalid','Enter a positive transaction value and a whole monthly transaction count of at least 1.');
    return;
  }
  var results=[];
  for(var i=1;i<=3;i++){
    var name=document.getElementById('pg-name-'+i).value.trim();
    var rate=parseFloat(document.getElementById('pg-rate-'+i).value);
    var flat=parseFloat(document.getElementById('pg-flat-'+i).value);
    var cap=parseFloat(document.getElementById('pg-cap-'+i).value);
    if(!name||!Number.isFinite(rate)||rate<0||rate>100||!Number.isFinite(flat)||flat<0||!Number.isFinite(cap)||cap<0){
      error.textContent=pgText('invalidQuote','Give each quote a name, a percentage from 0% to 100%, and non-negative flat fee and cap values.');
      return;
    }
    var txnFee=avgTxn*(rate/100)+flat;
    if(cap>0) txnFee=Math.min(txnFee,cap);
    var monthlyFee=txnFee*monthlyTxns;
    var effectiveRate=(monthlyFee/monthlyVol)*100;
    results.push({name:name,txnFee:txnFee,monthlyFee:monthlyFee,effectiveRate:effectiveRate,order:i});
  }
  results.sort(function(a,b){return a.monthlyFee-b.monthlyFee||a.order-b.order;});
  function fmt(n){return currency+' '+n.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});}
  document.getElementById('pg-monthly-vol').textContent=fmt(monthlyVol);
  document.getElementById('pg-cheapest-fee').textContent=fmt(results[0].monthlyFee);
  document.getElementById('pg-most-exp').textContent=fmt(results[results.length-1].monthlyFee);
  document.getElementById('pg-annual-saving').textContent=fmt((results[results.length-1].monthlyFee-results[0].monthlyFee)*12);
  document.getElementById('pg-winner-name').textContent=results[0].name+' — '+pgText('lowest','lowest entered quote');
  document.getElementById('pg-winner-detail').textContent=pgText('monthlyFees','Monthly fees')+': '+fmt(results[0].monthlyFee)+' | '+pgText('effectiveRate','Effective rate')+': '+results[0].effectiveRate.toFixed(2)+'%';
  var tbody=document.getElementById('pg-table-body');
  tbody.replaceChildren();
  for(var j=0;j<results.length;j++){
    var r=results[j];
    var row=document.createElement('tr');
    if(j===0) row.className='best';
    [String(j+1),r.name,fmt(r.txnFee),fmt(r.monthlyFee),r.effectiveRate.toFixed(2)+'%'].forEach(function(value){
      var cell=document.createElement('td');
      cell.textContent=value;
      row.appendChild(cell);
    });
    tbody.appendChild(row);
  }
  output.classList.add('on');
  output.focus();
}
