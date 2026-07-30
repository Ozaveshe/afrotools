'use strict';

// Exact controller extracted from tools/tbill-calc/index.html.
// English and French route owners load this same file; keep formula changes shared.
function tbText(key,fallback){
  return window.AfroToolsFintechI18n
    ? window.AfroToolsFintechI18n.text('tbill-calc',key,fallback)
    : fallback;
}
function fillTBRates(){
  document.getElementById('tb-results').classList.remove('on');
}
function calcTBill(){
  var csel=document.getElementById('tb-country');
  var copt=csel.options[csel.selectedIndex];
  var sym=copt.getAttribute('data-sym');
  var faceValue=parseFloat(document.getElementById('tb-amount').value);
  var rate=parseFloat(document.getElementById('tb-rate').value)/100;
  var days=parseInt(document.getElementById('tb-tenor').value,10);
  var taxRate=parseFloat(document.getElementById('tb-tax').value)/100;
  var rateType=document.getElementById('tb-ratetype').value;
  var error=document.getElementById('tb-error');
  if(!Number.isFinite(faceValue)||faceValue<=0||!Number.isFinite(rate)||rate<0||rate>1||!Number.isFinite(taxRate)||taxRate<0||taxRate>1||!Number.isFinite(days)||days<=0){
    error.textContent=tbText('invalid','Enter a face value above zero and quoted rate and tax values from 0% to 100%.');
    error.classList.add('on');
    document.getElementById('tb-results').classList.remove('on');
    return;
  }
  error.textContent='';
  error.classList.remove('on');
  var t=days/365;
  // Discount rate quotes the return against face value: Price = Face * (1 - rate * days/365)
  // True/investment yield quotes the return against price paid: Price = Face / (1 + rate * days/365)
  var price=rateType==='discount' ? faceValue*(1-rate*t) : faceValue/(1+rate*t);
  if(price<=0){
    error.textContent=tbText('invalidDiscount','These discount-rate terms produce a zero or negative purchase price. Check the quote and rate type.');
    error.classList.add('on');
    document.getElementById('tb-results').classList.remove('on');
    return;
  }
  var grossReturn=faceValue-price;
  var tax=grossReturn*taxRate;
  var netReturn=grossReturn-tax;
  var netMaturity=price+netReturn;
  var actualYield=(grossReturn/price)*(365/days)*100;
  var annualizedNet=(netReturn/price)*(365/days)*100;
  function fmt(n){return sym+n.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});}
  document.getElementById('tb-maturity').textContent=fmt(netMaturity);
  document.getElementById('tb-sub').textContent=tbText('faceValue','Face Value')+': '+fmt(faceValue)+' | '+tbText('youPay','You pay')+': '+fmt(price);
  document.getElementById('tb-price').textContent=fmt(price);
  document.getElementById('tb-return').textContent=fmt(grossReturn);
  document.getElementById('tb-tax-amt').textContent=fmt(tax);
  document.getElementById('tb-net').textContent=fmt(netReturn);
  document.getElementById('tb-actual-yield').textContent=actualYield.toFixed(2)+'%';
  document.getElementById('tb-annualized').textContent=annualizedNet.toFixed(2)+'%';
  document.getElementById('tb-results').classList.add('on');
  document.getElementById('tb-results').focus();
}
