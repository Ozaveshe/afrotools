'use strict';

// Exact controller extracted from tools/debt-snowball/index.html.
// English and French route owners load this same file; keep formula changes shared.
function dsText(key,fallback){
  return window.AfroToolsFintechI18n
    ? window.AfroToolsFintechI18n.text('debt-snowball',key,fallback)
    : fallback;
}
function addDebtRow(){
  var tbody=document.getElementById('debt-list');
  var tr=document.createElement('tr');
  tr.innerHTML='<td><input aria-label="'+dsText('debtName','Debt name')+'" type="text" placeholder="'+dsText('debtName','Debt name')+'"></td><td><input aria-label="'+dsText('debtBalance','Debt balance')+'" type="number" min="0.01" step="0.01" placeholder="0"></td><td><input aria-label="'+dsText('minimumPayment','Monthly minimum payment')+'" type="number" min="0.01" step="0.01" placeholder="0"></td><td><input aria-label="'+dsText('annualRate','Annual interest rate')+'" type="number" min="0" max="1000" step="0.01" placeholder="0"></td><td><button type="button" aria-label="'+dsText('removeDebt','Remove debt')+'" class="btn-del" onclick="this.closest(\'tr\').remove()">&#x2715;</button></td>';
  tbody.appendChild(tr);
}
function parseDebts(){
  var rows=document.querySelectorAll('#debt-list tr');
  var debts=[],message='';
  rows.forEach(function(row,index){
    var inputs=row.querySelectorAll('input');
    var name=inputs[0].value.trim()||(dsText('debt','Debt')+' '+(index+1));
    var balance=parseFloat(inputs[1].value);
    var minPayment=parseFloat(inputs[2].value);
    var annualRate=parseFloat(inputs[3].value);
    if(!Number.isFinite(balance)||balance<=0||!Number.isFinite(minPayment)||minPayment<=0||!Number.isFinite(annualRate)||annualRate<0||annualRate>1000){message=dsText('invalidDebt','Each debt needs a positive balance and minimum payment, plus an annual rate from 0% to 1,000%.');return;}
    debts.push({id:index,name:name,balance:balance,minPayment:minPayment,annualRate:annualRate/100});
  });
  return {debts:debts,error:message};
}
function simulatePayoff(debts,extra,sortFn){
  var ds=debts.map(function(d){return {id:d.id,name:d.name,balance:d.balance,minPayment:d.minPayment,annualRate:d.annualRate,origBalance:d.balance};});
  var budget=ds.reduce(function(sum,d){return sum+d.minPayment;},0)+extra;
  var order=ds.slice().sort(sortFn).map(function(d){return d.id;});
  var payoffMonths={},month=0,totalInterest=0,totalPaid=0,maxMonths=600;
  while(ds.some(function(d){return d.balance>0.005;})&&month<maxMonths){
    month++;
    var paymentPool=budget;
    ds.forEach(function(d){
      if(d.balance<=0.005)return;
      var interest=d.balance*(d.annualRate/12);
      totalInterest+=interest;
      d.balance+=interest;
    });
    ds.forEach(function(d){
      if(d.balance<=0.005||paymentPool<=0)return;
      var payment=Math.min(d.balance,d.minPayment,paymentPool);
      d.balance-=payment;paymentPool-=payment;totalPaid+=payment;
    });
    ds.slice().sort(sortFn).forEach(function(d){
      if(d.balance<=0.005||paymentPool<=0)return;
      var payment=Math.min(d.balance,paymentPool);
      d.balance-=payment;paymentPool-=payment;totalPaid+=payment;
    });
    ds.forEach(function(d){if(d.balance<=0.005&&!payoffMonths[d.id]){d.balance=0;payoffMonths[d.id]=month;}});
  }
  var paidOff=!ds.some(function(d){return d.balance>0.005;});
  return {months:month,totalInterest:totalInterest,totalPaid:totalPaid,order:order,payoffMonths:payoffMonths,paidOff:paidOff};
}
function calcDebtPayoff(){
  var parsed=parseDebts(),debts=parsed.debts,error=document.getElementById('ds-error'),output=document.getElementById('ds-results');
  var extra=parseFloat(document.getElementById('ds-extra').value),currency=document.getElementById('ds-currency').value;
  error.textContent='';output.classList.remove('on');
  if(parsed.error){error.textContent=parsed.error;return;}
  if(debts.length===0){error.textContent=dsText('addDebt','Add at least one debt with a positive balance.');return;}
  if(!Number.isFinite(extra)||extra<0){error.textContent=dsText('invalidExtra','Extra monthly payment must be zero or more.');return;}
  var snowball=simulatePayoff(debts,extra,function(a,b){return a.balance-b.balance||b.annualRate-a.annualRate;});
  var avalanche=simulatePayoff(debts,extra,function(a,b){return b.annualRate-a.annualRate||a.balance-b.balance;});
  function months(result){return result.paidOff?(result.months+' '+dsText('months','months')+' ('+(result.months/12).toFixed(1)+' '+dsText('years','years')+')'):dsText('notRepaid','Not repaid within 600 months');}
  function fmt(n){return currency+' '+n.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});}
  document.getElementById('ds-snowball-months').textContent=months(snowball);
  document.getElementById('ds-snowball-interest').textContent=dsText('modelledInterest','Modelled interest')+': '+fmt(snowball.totalInterest);
  document.getElementById('ds-snowball-total').textContent=dsText('modelledTotal','Modelled total paid')+': '+fmt(snowball.totalPaid);
  document.getElementById('ds-avalanche-months').textContent=months(avalanche);
  document.getElementById('ds-avalanche-interest').textContent=dsText('modelledInterest','Modelled interest')+': '+fmt(avalanche.totalInterest);
  document.getElementById('ds-avalanche-total').textContent=dsText('modelledTotal','Modelled total paid')+': '+fmt(avalanche.totalPaid);
  var avWins=avalanche.paidOff&&(!snowball.paidOff||avalanche.totalInterest<=snowball.totalInterest);
  var interestSaved=Math.abs(snowball.totalInterest-avalanche.totalInterest);
  document.getElementById('ds-snowball-card').className='comp-method method-snowball'+(avWins?'':' winner');
  document.getElementById('ds-avalanche-card').className='comp-method method-avalanche'+(avWins?' winner':'');
  var rec=document.getElementById('ds-recommendation');
  if(!snowball.paidOff||!avalanche.paidOff){
    rec.innerHTML='<div style="background:#fff7ed;border:1px solid #fdba74;border-radius:12px;padding:1rem;margin-bottom:1rem;font-size:.85rem;color:#9a3412"><strong>'+dsText('planNotRepaid','At least one plan was not repaid within 600 months.')+'</strong> '+dsText('increaseBudget','Increase the payment budget or review the entered rates and minimums.')+'</div>';
  } else if(avWins&&interestSaved>0.005){
    rec.innerHTML='<div style="background:#f5f3ff;border:1px solid #86efac;border-radius:12px;padding:1rem;margin-bottom:1rem;font-size:.85rem;color:#4c1d95"><strong>'+dsText('avalancheSaves','Avalanche saves')+' '+fmt(interestSaved)+'</strong> '+dsText('scheduledAssumption','in this model. The comparison assumes every scheduled payment is made.')+'</div>';
  } else {
    rec.innerHTML='<div style="background:#f5f3ff;border:1px solid #86efac;border-radius:12px;padding:1rem;margin-bottom:1rem;font-size:.85rem;color:#4c1d95"><strong>'+dsText('sameInterest','The modelled interest is the same')+'</strong> '+dsText('displayedPrecision','at the displayed precision for these inputs.')+'</div>';
  }
  var tbody=document.getElementById('ds-order');
  tbody.innerHTML='';
  snowball.order.forEach(function(id,i){
    var d=debts.find(function(item){return item.id===id;}),tr=document.createElement('tr');
    [String(i+1),d.name,fmt(d.balance),(d.annualRate*100).toFixed(2)+'%',snowball.payoffMonths[id]?(snowball.payoffMonths[id]+' '+dsText('months','months')):dsText('notRepaidShort','Not repaid')].forEach(function(value){var td=document.createElement('td');td.textContent=value;tr.appendChild(td);});
    tbody.appendChild(tr);
  });
  output.classList.add('on');output.focus({preventScroll:true});
}
