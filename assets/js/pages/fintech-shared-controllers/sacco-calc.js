'use strict';

// Exact controller extracted from tools/sacco-calc/index.html.
// English and French route owners load this same file; keep formula changes shared.
function scText(key,fallback){
  return window.AfroToolsFintechI18n
    ? window.AfroToolsFintechI18n.text('sacco-calc',key,fallback)
    : fallback;
}
function calcSACCO(){
  var currency=document.getElementById('sc-currency').value;
  var monthly=parseFloat(document.getElementById('sc-monthly').value);
  var years=parseInt(document.getElementById('sc-years').value);
  var divPercent=parseFloat(document.getElementById('sc-div').value);
  var bankPercent=parseFloat(document.getElementById('sc-bank-rate').value);
  var loanMult=parseFloat(document.getElementById('sc-loan-mult').value);
  var error=document.getElementById('sc-error');
  var results=document.getElementById('sc-results');
  error.textContent='';
  results.classList.remove('on');
  if(!Number.isFinite(monthly)||monthly<=0||!Number.isInteger(years)||years<1||!Number.isFinite(divPercent)||divPercent<0||divPercent>100||!Number.isFinite(bankPercent)||bankPercent<0||bankPercent>100||!Number.isFinite(loanMult)||loanMult<0||loanMult>20){
    error.textContent=scText('invalid','Enter a positive monthly contribution, rates from 0% to 100%, and a loan multiplier from 0 to 20.');
    return;
  }
  var months=years*12;
  var principal=monthly*months;
  var balance=0;
  var bankTotal=0;
  var monthlyDividend=Math.pow(1+divPercent/100,1/12)-1;
  var monthlyBank=Math.pow(1+bankPercent/100,1/12)-1;
  for(var m=1;m<=months;m++){
    balance=balance*(1+monthlyDividend)+monthly;
    bankTotal=bankTotal*(1+monthlyBank)+monthly;
  }
  var dividends=balance-principal;
  var loanCap=balance*loanMult;
  var advantage=balance-bankTotal;
  function fmt(n){return currency+' '+n.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});}
  document.getElementById('sc-total').textContent=fmt(balance);
  document.getElementById('sc-sub').textContent=years+' '+(years===1?scText('year','year'):scText('years','years'))+' | '+months+' '+scText('contributions','month-end contributions');
  document.getElementById('sc-principal').textContent=fmt(principal);
  document.getElementById('sc-dividend').textContent=fmt(dividends);
  document.getElementById('sc-loan-cap').textContent=fmt(loanCap);
  document.getElementById('sc-bank-total').textContent=fmt(bankTotal);
  document.getElementById('sc-advantage').textContent=fmt(advantage);
  results.classList.add('on');
  results.focus();
}
