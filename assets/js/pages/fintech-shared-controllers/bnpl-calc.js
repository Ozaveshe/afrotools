'use strict';

// Exact controller extracted from tools/bnpl-calc/index.html.
// English and French route owners load this same file; keep formula changes shared.
function bnplText(key,fallback){
  return window.AfroToolsFintechI18n
    ? window.AfroToolsFintechI18n.text('bnpl-calc',key,fallback)
    : fallback;
}
function calcBNPL(){
  var currency=document.getElementById('bnpl-currency').value;
  var price=parseFloat(document.getElementById('bnpl-price').value);
  var installments=Number(document.getElementById('bnpl-installments').value);
  var feePercent=parseFloat(document.getElementById('bnpl-rate').value);
  var firstNow=document.getElementById('bnpl-first-payment').value==='now';
  var error=document.getElementById('bnpl-error');
  var output=document.getElementById('bnpl-results');
  error.textContent='';
  output.classList.remove('on');
  if(!Number.isFinite(price)||price<=0||!Number.isInteger(installments)||installments<2||installments>24||!Number.isFinite(feePercent)||feePercent<0||feePercent>100){
    error.textContent=bnplText('invalid','Enter a positive item price, 2 to 24 whole installments, and a total fee from 0% to 100%.');
    return;
  }
  var feeRate=feePercent/100;
  var totalFee=price*feeRate;
  var totalPay=price+totalFee;
  var instAmt=totalPay/installments;
  var financed=firstNow?price-instAmt:price;
  var futurePayments=firstNow?installments-1:installments;
  if(financed<=0){
    error.textContent=bnplText('invalidCheckout','This checkout payment is as large as the item price, so a finite APR cannot be derived. Lower the fee or choose first payment in one month.');
    return;
  }
  var apr=0;
  if(feeRate>0){
    function paymentPV(rate){return instAmt*(1-Math.pow(1+rate,-futurePayments))/rate;}
    var lo=0,hi=1;
    while(paymentPV(hi)>financed&&hi<1024) hi*=2;
    for(var k=0;k<100;k++){
      var mid=(lo+hi)/2;
      var pv=paymentPV(mid);
      if(pv>financed){lo=mid;}else{hi=mid;}
    }
    var monthly=(lo+hi)/2;
    apr=(Math.pow(1+monthly,12)-1)*100;
  }
  function fmt(n){return currency+' '+n.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});}
  document.getElementById('bnpl-extra-cost').textContent=fmt(totalFee);
  document.getElementById('bnpl-sub').textContent=bnplText('totalPayable','Total payable')+': '+fmt(totalPay)+' | '+bnplText('cashPrice','Cash price')+': '+fmt(price);
  document.getElementById('bnpl-installment-amt').textContent=fmt(instAmt);
  document.getElementById('bnpl-total').textContent=fmt(totalPay);
  document.getElementById('bnpl-fee').textContent=fmt(totalFee);
  document.getElementById('bnpl-apr').textContent=apr.toFixed(2)+'%';
  var schedule=document.getElementById('bnpl-schedule');
  schedule.replaceChildren();
  for(var i=1;i<=installments;i++){
    var item=document.createElement('div');
    item.className='installment';
    var label=document.createElement('div');
    label.className='inst-label';
    label.textContent=bnplText('installment','Installment')+' '+i+' — '+(firstNow?(i===1?bnplText('now','Now'):bnplText('month','Month')+' '+(i-1)):bnplText('month','Month')+' '+i);
    var value=document.createElement('div');
    value.className='inst-val';
    value.textContent=fmt(instAmt);
    item.append(label,value);
    schedule.appendChild(item);
  }
  output.classList.add('on');
  output.focus();
}
