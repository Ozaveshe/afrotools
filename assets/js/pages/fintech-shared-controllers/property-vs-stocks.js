'use strict';

// Exact controller extracted from tools/property-vs-stocks/index.html.
// English and French route owners load this same file; keep formula changes shared.
function pvsText(key,fallback){
  return window.AfroToolsFintechI18n
    ? window.AfroToolsFintechI18n.text('property-vs-stocks',key,fallback)
    : fallback;
}
document.getElementById('pv-down').addEventListener('input',function(){
  var price=parseFloat(document.getElementById('pv-price').value)||0;
  var down=parseFloat(this.value)/100;
  document.getElementById('sv-initial').value=Math.round(price*down);
});
document.getElementById('pv-price').addEventListener('input',function(){
  var down=parseFloat(document.getElementById('pv-down').value)/100;
  document.getElementById('sv-initial').value=Math.round(parseFloat(this.value)*down);
});
function syncStartingCapital(){
  var price=parseFloat(document.getElementById('pv-price').value)||0,cost=parseFloat(document.getElementById('pv-down').value)||0;
  document.getElementById('sv-initial').value=(price*(1+cost/100)).toFixed(2);
}
document.getElementById('pv-down').addEventListener('input',syncStartingCapital);
document.getElementById('pv-price').addEventListener('input',syncStartingCapital);
function calcPvS(){
  var price=parseFloat(document.getElementById('pv-price').value);
  var purchaseCostPercent=parseFloat(document.getElementById('pv-down').value);
  var rent=parseFloat(document.getElementById('pv-rent').value);
  var appPercent=parseFloat(document.getElementById('pv-appreciation').value);
  var expensePercent=parseFloat(document.getElementById('pv-expenses').value);
  var vacancyPercent=parseFloat(document.getElementById('pv-vacancy').value);
  var saleCostPercent=parseFloat(document.getElementById('pv-sale-cost').value);
  var years=parseInt(document.getElementById('pv-years').value);
  var stockPercent=parseFloat(document.getElementById('sv-return').value),currency=document.getElementById('pvs-currency').value,error=document.getElementById('pvs-error'),output=document.getElementById('pvs-results');
  error.textContent='';output.classList.remove('on');
  var percentages=[purchaseCostPercent,expensePercent,vacancyPercent,saleCostPercent];
  if(!Number.isFinite(price)||price<=0||!Number.isFinite(rent)||rent<0||percentages.some(function(v){return !Number.isFinite(v)||v<0||v>100;})||!Number.isFinite(appPercent)||appPercent<=-100||appPercent>1000||!Number.isFinite(stockPercent)||stockPercent<=-100||stockPercent>1000||!Number.isFinite(years)||years<1){error.textContent=pvsText('invalid','Check the amounts and scenarios. Costs must be 0% to 100%; return assumptions must be above -100% and no more than 1,000%.');return;}
  var appRate=appPercent/100,expenses=expensePercent/100,vacancy=vacancyPercent/100,sReturn=stockPercent/100,saleCost=saleCostPercent/100;
  var initialCapital=price*(1+purchaseCostPercent/100);document.getElementById('sv-initial').value=initialCapital.toFixed(2);
  var propValue=price*Math.pow(1+appRate,years);
  var annualRent=rent*12*(1-vacancy);
  var annualExpenses=price*expenses;
  var netAnnualRent=annualRent-annualExpenses;
  var totalRentalIncome=netAnnualRent*years;
  var propertyEnding=propValue*(1-saleCost)+totalRentalIncome,propertyGain=propertyEnding-initialCapital,propROI=propertyGain/initialCapital*100;
  var stockPortfolio=initialCapital*Math.pow(1+sReturn,years),stockGain=stockPortfolio-initialCapital,stockROI=stockGain/initialCapital*100;
  function fmt(n){return currency+' '+n.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});}
  document.getElementById('prop-value').textContent=fmt(propertyEnding);
  document.getElementById('prop-sub').textContent=pvsText('propertyGain','Net gain after entered purchase, operating and sale costs')+(window.AfroToolsFintechI18n&&window.AfroToolsFintechI18n.isFrench()?' : ':': ')+fmt(propertyGain);
  document.getElementById('stock-value').textContent=fmt(stockPortfolio);
  document.getElementById('stock-sub').textContent=pvsText('stockGain','Total-return gain')+(window.AfroToolsFintechI18n&&window.AfroToolsFintechI18n.isFrench()?' : ':': ')+fmt(stockGain);
  document.getElementById('pvs-prop-roi').textContent=propROI.toFixed(1)+'%';
  document.getElementById('pvs-stock-roi').textContent=stockROI.toFixed(1)+'%';
  document.getElementById('pvs-prop-income').textContent=fmt(totalRentalIncome);
  document.getElementById('pvs-stock-income').textContent=pvsText('included','Included');
  var propWins=propertyEnding>=stockPortfolio;
  document.getElementById('prop-card').className='comp-card'+(propWins?' winner':'');
  document.getElementById('stock-card').className='comp-card'+(!propWins?' winner':'');
  output.classList.add('on');output.focus({preventScroll:true});
}
