'use strict';

// Exact controller extracted from tools/b2b-payment/index.html.
// English and French route owners load this same file; keep formula changes shared.
function b2bText(key,fallback){
  return window.AfroToolsFintechI18n
    ? window.AfroToolsFintechI18n.text('b2b-payment',key,fallback)
    : fallback;
}
function calcB2B(){
  var currency=document.getElementById('b2b-currency').value;
  var amount=parseFloat(document.getElementById('b2b-amount').value);
  var frequency=Number(document.getElementById('b2b-frequency').value);
  var error=document.getElementById('b2b-error');var output=document.getElementById('b2b-results');
  error.textContent='';output.classList.remove('on');
  if(!Number.isFinite(amount)||amount<=0||!Number.isInteger(frequency)||frequency<1||frequency>1000){error.textContent=b2bText('invalid','Enter a positive send amount and a whole monthly frequency from 1 to 1,000.');return;}
  var results=[];
  for(var i=1;i<=3;i++){
    var name=document.getElementById('b2b-name-'+i).value.trim();
    var pct=parseFloat(document.getElementById('b2b-pct-'+i).value);
    var flat=parseFloat(document.getElementById('b2b-flat-'+i).value);
    var fx=parseFloat(document.getElementById('b2b-fx-'+i).value);
    var days=parseFloat(document.getElementById('b2b-days-'+i).value);
    if(!name||!Number.isFinite(pct)||pct<0||pct>100||!Number.isFinite(flat)||flat<0||!Number.isFinite(fx)||fx<0||fx>100||!Number.isFinite(days)||days<0||days>365){error.textContent=b2bText('invalidQuote','Give each quote a name, fee and FX percentages from 0% to 100%, a non-negative flat fee, and settlement from 0 to 365 days.');return;}
    var txnFee=flat+amount*pct/100;var fxCost=amount*fx/100;var totalCost=txnFee+fxCost;
    results.push({name:name,txnFee:txnFee,fxCost:fxCost,totalCost:totalCost,effectivePct:totalCost/amount*100,days:days,order:i});
  }
  var quoteA=results[0].totalCost;
  results.sort(function(a,b){return a.totalCost-b.totalCost||a.order-b.order;});
  var cheapest=results[0];
  var monthlySaving=Math.max(0,(quoteA-cheapest.totalCost)*frequency);
  function fmt(n){return currency+' '+n.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});}
  document.getElementById('b2b-winner-name').textContent=cheapest.name;
  var metrics=document.getElementById('b2b-winner-metrics');metrics.replaceChildren();
  [[fmt(cheapest.totalCost),b2bText('perTransaction','Per transaction')],[cheapest.effectivePct.toFixed(2)+'%',b2bText('effectiveRate','Effective rate')],[cheapest.days.toFixed(1)+' '+b2bText('days','days'),b2bText('settlement','Settlement')],[fmt(cheapest.txnFee),b2bText('transferFee','Transfer fee')]].forEach(function(pair){var box=document.createElement('div');box.className='wm';var value=document.createElement('div');value.className='wm-val';value.textContent=pair[0];var label=document.createElement('div');label.className='wm-label';label.textContent=pair[1];box.append(value,label);metrics.appendChild(box);});
  document.getElementById('b2b-cheapest-fee').textContent=fmt(cheapest.totalCost);
  document.getElementById('b2b-swift-fee').textContent=fmt(quoteA);
  document.getElementById('b2b-monthly-saving').textContent=fmt(monthlySaving);
  document.getElementById('b2b-annual-saving').textContent=fmt(monthlySaving*12);
  var tbody=document.getElementById('b2b-table-body');tbody.replaceChildren();
  results.forEach(function(r,index){var row=document.createElement('tr');if(index===0)row.className='best';[String(index+1),r.name,fmt(r.txnFee),fmt(r.fxCost),fmt(r.totalCost),r.effectivePct.toFixed(2)+'%',r.days.toFixed(1)+' '+b2bText('days','days')].forEach(function(value){var cell=document.createElement('td');cell.textContent=value;row.appendChild(cell);});tbody.appendChild(row);});
  output.classList.add('on');output.focus();
}
