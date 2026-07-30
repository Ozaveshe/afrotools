'use strict';

// Exact controller extracted from tools/dividend-yield/index.html.
// English and French route owners load this same file; keep formula changes shared.
function dvText(key,fallback){
  return window.AfroToolsFintechI18n
    ? window.AfroToolsFintechI18n.text('dividend-yield',key,fallback)
    : fallback;
}
function calcDividend(){
  var price=parseFloat(document.getElementById('dv-price').value);
  var dps=parseFloat(document.getElementById('dv-dps').value);
  var shares=parseFloat(document.getElementById('dv-shares').value);
  var epsText=document.getElementById('dv-eps').value.trim(),eps=epsText===''?null:parseFloat(epsText);
  var benchmark=parseFloat(document.getElementById('dv-fd-rate').value);
  var inflationPercent=parseFloat(document.getElementById('dv-inflation').value);
  var taxPercent=parseFloat(document.getElementById('dv-tax').value);
  var growthPercent=parseFloat(document.getElementById('dv-growth').value);
  var currency=document.getElementById('dv-currency').value,error=document.getElementById('dv-error'),output=document.getElementById('dv-results');
  error.textContent='';output.classList.remove('on');
  if(!Number.isFinite(price)||price<=0||!Number.isFinite(dps)||dps<0||!Number.isFinite(shares)||shares<0){error.textContent=dvText('invalid','Enter a share price above zero, plus a non-negative dividend and number of shares.');return;}
  if(eps!==null&&(!Number.isFinite(eps)||eps<=0)){error.textContent=dvText('invalidEps','Earnings per share must be blank or greater than zero.');return;}
  if(!Number.isFinite(benchmark)||benchmark<=-100||benchmark>1000||!Number.isFinite(inflationPercent)||inflationPercent<=-100||inflationPercent>1000||!Number.isFinite(taxPercent)||taxPercent<0||taxPercent>100||!Number.isFinite(growthPercent)||growthPercent<=-100||growthPercent>1000){error.textContent=dvText('invalidRates','Check the entered percentages: tax must be 0% to 100%, and other rates must be above -100% and no more than 1,000%.');return;}
  var taxRate=taxPercent/100,growth=growthPercent/100,inflation=inflationPercent/100;
  var divYield=(dps/price)*100;
  var annualIncome=dps*shares;
  var netIncome=annualIncome*(1-taxRate);
  var payoutRatio=eps!==null?(dps/eps)*100:null;
  var netYield=divYield*(1-taxRate);
  var realYield=((1+netYield/100)/(1+inflation)-1)*100;
  var vsfd=netYield-benchmark;
  var fiveYrIncome=0;
  var d=dps;
  for(var i=0;i<5;i++){fiveYrIncome+=d*shares*(1-taxRate);d*=(1+growth);}
  var payback=netYield>0?100/netYield:null;
  function fmt(n){return currency+' '+n.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});}
  document.getElementById('dv-yield').textContent=divYield.toFixed(2)+'%';
  document.getElementById('dv-sub').textContent=dvText('afterTax','After-tax yield at')+' '+taxPercent.toFixed(2)+'%'+(dvText('enteredTax',' entered tax')||'')+(window.AfroToolsFintechI18n&&window.AfroToolsFintechI18n.isFrench()?' : ':': ')+netYield.toFixed(2)+'%';
  document.getElementById('dv-annual-income').textContent=fmt(annualIncome);
  document.getElementById('dv-net-income').textContent=fmt(netIncome);
  document.getElementById('dv-payout-ratio').textContent=payoutRatio===null?dvText('notAvailable','N/A'):payoutRatio.toFixed(2)+'%';
  document.getElementById('dv-pe-ratio').textContent=eps===null?dvText('notAvailable','N/A'):(price/eps).toFixed(2)+'x';
  document.getElementById('dv-vs-fd').textContent=(vsfd>=0?'+':'')+vsfd.toFixed(2)+'%';
  document.getElementById('dv-real-yield').textContent=realYield.toFixed(2)+'%';
  document.getElementById('dv-5yr-income').textContent=fmt(fiveYrIncome);
  document.getElementById('dv-payback').textContent=payback===null?dvText('notAvailable','N/A'):payback.toFixed(2)+' '+dvText('years','years');
  var verdict=dvText('verdictPrefix','The entered after-tax dividend yield is')+' '+Math.abs(vsfd).toFixed(2)+' '+dvText('points','percentage points')+' '+(vsfd>=0?dvText('above','above'):dvText('below','below'))+' '+dvText('verdictSuffix','the entered comparison yield. This arithmetic does not make the risks equal or recommend either option.');
  document.getElementById('dv-verdict').textContent=verdict;
  output.classList.add('on');output.focus({preventScroll:true});
}
