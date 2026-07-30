'use strict';

// Exact controller extracted from tools/loan-shark-compare/index.html.
// English and French route owners load this same file; keep formula changes shared.
function lsText(key,fallback){
  return window.AfroToolsFintechI18n
    ? window.AfroToolsFintechI18n.text('loan-shark-compare',key,fallback)
    : fallback;
}
function calcLoanShark(){
  var currency=document.getElementById('ls-currency').value;
  var amount=parseFloat(document.getElementById('ls-amount').value);
  var months=parseInt(document.getElementById('ls-tenor').value,10);
  var sharkMonthly=parseFloat(document.getElementById('ls-shark-rate').value)/100;
  var bankAnnual=parseFloat(document.getElementById('ls-bank-rate').value)/100;
  var error=document.getElementById('ls-error');
  if(!Number.isFinite(amount)||amount<=0||!Number.isFinite(months)||months<=0||!Number.isFinite(sharkMonthly)||sharkMonthly<0||sharkMonthly>1||!Number.isFinite(bankAnnual)||bankAnnual<0||bankAnnual>10){
    error.textContent=lsText('invalid','Enter a loan amount above zero, a flat monthly rate from 0% to 100%, and a bank annual rate from 0% to 1,000%.');
    error.classList.add('on');
    document.getElementById('ls-results').classList.remove('on');
    return;
  }
  error.textContent='';
  error.classList.remove('on');
  var bankMonthly=bankAnnual/12;
  // Shark: flat interest on original principal each month
  var sharkInterestPerMonth=amount*sharkMonthly;
  var sharkTotalInterest=sharkInterestPerMonth*months;
  var sharkTotal=amount+sharkTotalInterest;
  var sharkMonthlyPayment=(amount/months)+sharkInterestPerMonth;
  function monthlyCashFlowRate(principal,payment,periods){
    if(payment<=principal/periods)return 0;
    var low=0,high=10;
    for(var i=0;i<100;i++){
      var mid=(low+high)/2;
      var presentValue=payment*(1-Math.pow(1+mid,-periods))/mid;
      if(presentValue>principal)low=mid;else high=mid;
    }
    return (low+high)/2;
  }
  var sharkCashFlowMonthly=monthlyCashFlowRate(amount,sharkMonthlyPayment,months);
  var sharkEffectiveAnnual=(Math.pow(1+sharkCashFlowMonthly,12)-1)*100;
  // Bank: reducing balance amortized
  var bankMonthlyPayment=bankMonthly>0?amount*(bankMonthly*Math.pow(1+bankMonthly,months))/(Math.pow(1+bankMonthly,months)-1):amount/months;
  var bankTotalPayment=bankMonthlyPayment*months;
  var bankTotalInterest=bankTotalPayment-amount;
  var bankEffectiveAnnual=(Math.pow(1+bankMonthly,12)-1)*100;
  var overpay=sharkTotal-bankTotalPayment;
  var minCost=Math.min(sharkTotalInterest,bankTotalInterest),maxCost=Math.max(sharkTotalInterest,bankTotalInterest);
  var multiple=minCost>0?(maxCost/minCost).toFixed(2)+'x':(maxCost===0?lsText('same','Same'):lsText('notFinite','Not finite'));
  function fmt(n){return currency+' '+n.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});}
  document.getElementById('ls-overpay').textContent=fmt(Math.abs(overpay));
  document.getElementById('ls-overpay-sub').textContent=Math.abs(overpay)<0.005
    ?lsText('sameTotal','The entered offers have the same total repayment')
    :(overpay>0
      ?lsText('flatCosts','The flat-rate offer costs')+' '+fmt(overpay)+' '+lsText('moreOver','more over')+' '+months+' '+lsText('months','months')
      :lsText('reducingCosts','The reducing-balance offer costs')+' '+fmt(-overpay)+' '+lsText('moreOver','more over')+' '+months+' '+lsText('months','months'));
  document.getElementById('ls-shark-total').textContent=fmt(sharkTotal);
  document.getElementById('ls-shark-monthly').textContent=lsText('monthly','Monthly')+': '+fmt(sharkMonthlyPayment);
  document.getElementById('ls-shark-interest').textContent=lsText('totalInterest','Total interest')+': '+fmt(sharkTotalInterest);
  document.getElementById('ls-shark-apr').textContent=lsText('effectiveAnnual','Effective annual rate')+': '+sharkEffectiveAnnual.toFixed(2)+'%';
  document.getElementById('ls-bank-total').textContent=fmt(bankTotalPayment);
  document.getElementById('ls-bank-monthly').textContent=lsText('monthly','Monthly')+': '+fmt(bankMonthlyPayment);
  document.getElementById('ls-bank-interest').textContent=lsText('totalInterest','Total interest')+': '+fmt(bankTotalInterest);
  document.getElementById('ls-bank-apr').textContent=lsText('effectiveAnnual','Effective annual rate')+': '+bankEffectiveAnnual.toFixed(2)+'%';
  document.getElementById('ls-shark-apr-val').textContent=sharkEffectiveAnnual.toFixed(2)+'%';
  document.getElementById('ls-bank-apr-val').textContent=bankEffectiveAnnual.toFixed(2)+'%';
  document.getElementById('ls-multiple').textContent=multiple;
  document.getElementById('ls-results').classList.add('on');
  document.getElementById('ls-results').focus();
}
