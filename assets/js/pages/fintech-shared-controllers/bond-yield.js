'use strict';

// Exact controller extracted from tools/bond-yield/index.html.
// English and French route owners load this same file; keep formula changes shared.
function byText(key,fallback){
  return window.AfroToolsFintechI18n
    ? window.AfroToolsFintechI18n.text('bond-yield',key,fallback)
    : fallback;
}
function calcBond(){
  var currency=document.getElementById('by-currency').value;
  var face=parseFloat(document.getElementById('by-face').value);
  var couponPercent=parseFloat(document.getElementById('by-coupon').value);
  var enteredPricePercent=parseFloat(document.getElementById('by-price').value);
  var years=parseFloat(document.getElementById('by-years').value);
  var freq=parseInt(document.getElementById('by-freq').value);
  var error=document.getElementById('by-error');var output=document.getElementById('by-results');
  error.textContent='';output.classList.remove('on');
  var n=years*freq;
  if(!Number.isFinite(face)||face<=0||!Number.isFinite(couponPercent)||couponPercent<0||couponPercent>1000||!Number.isFinite(enteredPricePercent)||enteredPricePercent<=0||enteredPricePercent>10000||!Number.isFinite(years)||years<=0||years>100||!Number.isInteger(freq)||Math.abs(n-Math.round(n))>1e-9){error.textContent=byText('invalid','Enter positive face and price values, coupon from 0% to 1,000%, and a term that produces a whole number of coupon periods.');return;}
  n=Math.round(n);
  var couponRate=couponPercent/100;
  var pricePercent=enteredPricePercent/100;
  var price=face*pricePercent;
  var periodicCoupon=(face*couponRate)/freq;
  var totalCouponIncome=periodicCoupon*n;
  var capitalGain=face-price;
  var totalReturn=totalCouponIncome+capitalGain;
  var currentYield=(face*couponRate)/price;
  function presentValue(rate){if(Math.abs(rate)<1e-12)return periodicCoupon*n+face;return periodicCoupon*(1-Math.pow(1+rate,-n))/rate+face/Math.pow(1+rate,n);}
  var low=-0.999999,high=1;
  while(presentValue(high)>price&&high<1048576)high*=2;
  for(var i=0;i<160;i++){var mid=(low+high)/2;if(presentValue(mid)>price)low=mid;else high=mid;}
  var periodicYield=(low+high)/2;
  var annualYtm=(Math.pow(1+periodicYield,freq)-1)*100;
  function fmt(v){return currency+' '+v.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});}
  document.getElementById('by-ytm').textContent=annualYtm.toFixed(2)+'%';
  document.getElementById('by-sub').textContent=byText('coupon','Coupon')+': '+couponPercent.toFixed(2)+'% | '+byText('price','Price')+': '+enteredPricePercent.toFixed(2)+'% '+byText('ofFace','of face')+' | '+n+' '+byText('periods','periods');
  document.getElementById('by-current-yield').textContent=(currentYield*100).toFixed(2)+'%';
  document.getElementById('by-annual-coupon').textContent=fmt(face*couponRate);
  document.getElementById('by-total-return').textContent=fmt(totalReturn);
  document.getElementById('by-market-price').textContent=fmt(price);
  output.classList.add('on');output.focus();
}
