'use strict';

// Exact controller extracted from tools/trade-credit/index.html.
// English and French route owners load this same file; keep formula changes shared.
function tradeText(key,fallback){
  return window.AfroToolsFintechI18n
    ? window.AfroToolsFintechI18n.text('trade-credit',key,fallback)
    : fallback;
}
function calcTradeCredit(){
  var invoice=Number(document.getElementById('tc-invoice').value);
  var netDays=Number(document.getElementById('tc-net-days').value);
  var discountInput=Number(document.getElementById('tc-discount').value);
  var discountDays=Number(document.getElementById('tc-discount-days').value);
  var borrowInput=Number(document.getElementById('tc-borrow-rate').value);
  var monthlyVol=Number(document.getElementById('tc-monthly-vol').value);
  var error=document.getElementById('tc-error');
  var results=document.getElementById('tc-results');
  if(!Number.isFinite(invoice)||invoice<=0||!Number.isInteger(netDays)||!Number.isInteger(discountDays)||discountDays<0||netDays<=discountDays||!Number.isFinite(discountInput)||discountInput<0||discountInput>=100||!Number.isFinite(borrowInput)||borrowInput<0||!Number.isFinite(monthlyVol)||monthlyVol<0){
    error.textContent=tradeText('invalid','Enter a positive invoice, a net date after the discount date, a discount below 100%, and non-negative borrowing rate and volume.');error.classList.add('on');results.classList.remove('on');return;
  }
  error.classList.remove('on');
  var discountPct=discountInput/100;
  var borrowRate=borrowInput/100;
  var discountAmt=invoice*discountPct;
  var daysDeferred=netDays-discountDays;
  var earlyPayment=invoice-discountAmt;
  var creditAPR=discountPct===0?0:(discountPct/(1-discountPct))*(365/daysDeferred)*100;
  var borrowCost=earlyPayment*(borrowRate/365)*daysDeferred;
  var invoiceAdvantage=discountAmt-borrowCost;
  var annualSaving=(monthlyVol*discountPct-monthlyVol*(1-discountPct)*(borrowRate/365)*daysDeferred)*12;
  var takeDeal=invoiceAdvantage>0;
  var currency=document.getElementById('tc-currency').value;
  var money=new Intl.NumberFormat(undefined,{style:'currency',currency:currency,maximumFractionDigits:2});
  function fmt(n){return money.format(n);}
  document.getElementById('tc-discount-amt').textContent=fmt(discountAmt);
  document.getElementById('tc-credit-cost').textContent=fmt(earlyPayment);
  document.getElementById('tc-credit-apr').textContent=creditAPR.toFixed(1)+'%';
  document.getElementById('tc-borrow-cost').textContent=fmt(borrowCost);
  document.getElementById('tc-annual-saving').textContent=(annualSaving>=0?'+':'')+fmt(annualSaving);
  document.getElementById('tc-days-free').textContent=daysDeferred+' '+tradeText('days','days');
  var hero=document.getElementById('tc-hero');
  var verdictMain=document.getElementById('tc-verdict-main');
  var verdictSub=document.getElementById('tc-sub');
  var verdictBox=document.getElementById('tc-verdict-box');
  if(takeDeal){
    hero.className='res-hero go';
    verdictMain.textContent=tradeText('payEarly','Modeled Lower Cost: Pay Early');
    verdictSub.textContent=tradeText('earlySub','Discount saved exceeds modeled borrowing cost over')+' '+daysDeferred+' '+tradeText('days','days');
    verdictBox.className='verdict take';
    verdictBox.textContent=tradeText('earlyVerdict','On the entered assumptions, paying early has a net advantage of')+' '+fmt(invoiceAdvantage)+' '+tradeText('perInvoice','per invoice after')+' '+fmt(borrowCost)+' '+tradeText('borrowingCost','modeled borrowing cost. Confirm lender fees, liquidity needs and supplier terms.');
  } else {
    hero.className='res-hero nogo';
    verdictMain.textContent=tradeText('payNet','Modeled Lower Cost: Pay at Net Date');
    verdictSub.textContent=tradeText('netSub','Modeled borrowing cost is not lower than the discount saved');
    verdictBox.className='verdict skip';
    verdictBox.textContent=tradeText('netVerdict','On the entered assumptions, borrowing to pay early costs')+' '+fmt(borrowCost)+' '+tradeText('versus','versus a')+' '+fmt(discountAmt)+' '+tradeText('planning','discount. This is a planning comparison, not a payment instruction.');
  }
  var tbody='<tr><th>'+tradeText('terms','Terms')+'</th><th>'+tradeText('discount','Discount')+'</th><th>'+tradeText('implied','Implied APR')+'</th><th>'+tradeText('action','Action')+'</th></tr>';
  tbody+='<tr class="highlight"><td>'+discountInput.toFixed(2)+'/'+discountDays+' Net '+netDays+'</td><td>'+discountInput.toFixed(2)+'%</td><td>'+creditAPR.toFixed(2)+'%</td><td>'+(takeDeal?tradeText('earlyAdvantage','Early pay has modeled advantage'):tradeText('netAdvantage','Net-date pay has modeled advantage'))+'</td></tr>';
  document.getElementById('tc-table').innerHTML=tbody;
  results.classList.add('on');
}
