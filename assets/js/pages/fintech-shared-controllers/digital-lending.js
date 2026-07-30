'use strict';

// Exact controller extracted from tools/digital-lending/index.html.
// English and French route owners load this same file; keep formula changes shared.
function dlText(key,fallback){
  return window.AfroToolsFintechI18n
    ? window.AfroToolsFintechI18n.text('digital-lending',key,fallback)
    : fallback;
}
function calcDigitalLending(){
  var currency=document.getElementById('dl-currency').value;
  var amount=parseFloat(document.getElementById('dl-amount').value);
  var days=parseInt(document.getElementById('dl-days').value,10);
  var error=document.getElementById('dl-error');
  var offers=['a','b','c'].map(function(id,index){
    return {name:document.getElementById('dl-name-'+id).value.trim()||dlText('offer','Offer')+' '+String.fromCharCode(65+index),total:parseFloat(document.getElementById('dl-total-'+id).value)};
  });
  if(!Number.isFinite(amount)||amount<=0||!Number.isFinite(days)||days<=0||days>3650||offers.some(function(offer){return !Number.isFinite(offer.total)||offer.total<amount;})){
    error.textContent=dlText('invalid','Enter an amount above zero, a term from 1 to 3,650 days, and total repayments at least equal to the amount received.');
    error.classList.add('on');
    document.getElementById('dl-results').classList.remove('on');
    return;
  }
  error.textContent='';
  error.classList.remove('on');
  var tbody=document.getElementById('dl-tbody');
  tbody.innerHTML='';
  var results=offers.map(function(offer){
    var financeCost=offer.total-amount;
    var termCost=financeCost/amount;
    var annualRate=(Math.pow(offer.total/amount,365/days)-1)*100;
    return {name:offer.name,total:offer.total,financeCost:financeCost,termCost:termCost,annualRate:annualRate};
  });
  results.sort(function(a,b){return a.total-b.total;});
  var minTotal=results[0].total;
  function fmt(value){return currency+' '+value.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});}
  results.forEach(function(result){
    var row=document.createElement('tr');
    var isBest=Math.abs(result.total-minTotal)<0.005;
    if(isBest)row.className='best';
    var values=[result.name,fmt(amount),fmt(result.financeCost),fmt(result.total),(result.termCost*100).toFixed(2)+'%',result.annualRate.toFixed(2)+'%'];
    values.forEach(function(value,index){var cell=document.createElement('td');cell.textContent=value;if(index===0)cell.className='provider-name';if(index===5)cell.classList.add(result.annualRate<100?'low-apr':'high-apr');row.appendChild(cell);});
    if(isBest){var badge=document.createElement('span');badge.className='best-badge';badge.textContent=dlText('lowest','LOWEST REPAYMENT');row.cells[0].appendChild(badge);}
    tbody.appendChild(row);
  });
  document.getElementById('dl-results').classList.add('on');
  document.getElementById('dl-results').focus();
}
