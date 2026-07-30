'use strict';

// Exact controller extracted from tools/microfinance-loan/index.html.
// English and French route owners load this same file; keep formula changes shared.
function mfText(key,fallback){
  return window.AfroToolsFintechI18n
    ? window.AfroToolsFintechI18n.text('microfinance-loan',key,fallback)
    : fallback;
}
function fillMFRate(){
  document.getElementById('mf-results').classList.remove('on');
}
function calcMFLoan(){
  var currency=document.getElementById('mf-currency').value;
  var amount=parseFloat(document.getElementById('mf-amount').value);
  var monthlyRate=parseFloat(document.getElementById('mf-rate').value)/100;
  var rateType=document.getElementById('mf-rate-type').value;
  var months=parseInt(document.getElementById('mf-tenor').value,10);
  var fees=parseFloat(document.getElementById('mf-fees').value);
  var bankAnnual=parseFloat(document.getElementById('mf-bank-rate').value)/100;
  var error=document.getElementById('mf-error');
  if(!Number.isFinite(amount)||amount<=0||!Number.isFinite(monthlyRate)||monthlyRate<0||monthlyRate>1||!Number.isFinite(months)||months<=0||!Number.isFinite(fees)||fees<0||fees>=amount||!Number.isFinite(bankAnnual)||bankAnnual<0||bankAnnual>10){
    error.textContent=mfText('invalid','Enter a loan above zero, monthly rate from 0% to 100%, fees from zero to below the loan amount, and comparison rate from 0% to 1,000%.');
    error.classList.add('on');
    document.getElementById('mf-results').classList.remove('on');
    return;
  }
  error.textContent='';
  error.classList.remove('on');
  var bankMonthly=bankAnnual/12;
  var mfiPayment=rateType==='flat'?(amount/months+amount*monthlyRate):(monthlyRate>0?amount*(monthlyRate*Math.pow(1+monthlyRate,months))/(Math.pow(1+monthlyRate,months)-1):amount/months);
  var netProceeds=amount-fees;
  var mfiTotal=mfiPayment*months;
  var mfiInterest=mfiTotal-netProceeds;
  function monthlyCashFlowRate(proceeds,payment,periods){
    if(payment<=proceeds/periods)return 0;
    var low=0,high=10;
    for(var i=0;i<100;i++){
      var mid=(low+high)/2;
      var pv=payment*(1-Math.pow(1+mid,-periods))/mid;
      if(pv>proceeds)low=mid;else high=mid;
    }
    return (low+high)/2;
  }
  var cashFlowMonthly=monthlyCashFlowRate(netProceeds,mfiPayment,months);
  var apr=(Math.pow(1+cashFlowMonthly,12)-1)*100;
  // Bank reducing balance
  var bankPayment=bankMonthly>0?netProceeds*(bankMonthly*Math.pow(1+bankMonthly,months))/(Math.pow(1+bankMonthly,months)-1):netProceeds/months;
  var bankTotal=bankPayment*months;
  var diff=mfiTotal-bankTotal;
  function fmt(n){return currency+' '+n.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});}
  document.getElementById('mf-monthly').textContent=fmt(mfiPayment);
  document.getElementById('mf-sub').textContent=(rateType==='flat'?mfText('flat','Flat interest'):mfText('reducing','Reducing balance'))+' | '+months+' '+mfText('payments','payments')+' | '+mfText('netProceeds','Net proceeds')+' '+fmt(netProceeds);
  document.getElementById('mf-total').textContent=fmt(mfiTotal);
  document.getElementById('mf-interest').textContent=fmt(mfiInterest);
  document.getElementById('mf-apr').textContent=apr.toFixed(2)+'%';
  document.getElementById('mf-bank-total').textContent=fmt(bankTotal);
  document.getElementById('mf-vs-bank').textContent=Math.abs(diff)<0.005?mfText('same','Same'):(diff>0?fmt(diff)+' '+mfText('more','more'):fmt(-diff)+' '+mfText('less','less'));
  document.getElementById('mf-results').classList.add('on');
  document.getElementById('mf-results').focus();
}
