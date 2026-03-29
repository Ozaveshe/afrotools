!function(){"use strict";window.AfroWidgets=window.AfroWidgets||{},window.AfroWidgets.bnplCalc=function(a,o){o=o||{};
a.innerHTML='<div class="aw-title">🛒 BNPL Cost Calculator</div><div class="aw-field"><label class="aw-label">Item Price</label><input class="aw-input" id="aw-bp-price" type="number" min="0" inputmode="decimal" placeholder="e.g. 120000"></div><div class="aw-row"><div class="aw-field"><label class="aw-label">Number of Installments</label><select class="aw-select" id="aw-bp-inst"><option value="2">2 payments</option><option value="3">3 payments</option><option value="4" selected>4 payments</option><option value="6">6 payments</option><option value="12">12 payments</option></select></div><div class="aw-field"><label class="aw-label">Provider Fee (%)</label><input class="aw-input" id="aw-bp-fee" type="number" min="0" max="30" step="0.1" value="5" placeholder="5"></div></div><button class="aw-btn" id="aw-bp-calc">Calculate</button><div class="aw-result-box" id="aw-bp-res" style="display:none"></div>'+(o.footerHTML||"");
a.querySelector('#aw-bp-calc').addEventListener('click',function(){
  var price=parseFloat(a.querySelector('#aw-bp-price').value)||0;
  var inst=parseInt(a.querySelector('#aw-bp-inst').value);
  var fee=parseFloat(a.querySelector('#aw-bp-fee').value)/100;
  if(!price)return;
  function fmt(n){return Math.round(n).toLocaleString();}
  var totalFee=price*fee;
  var total=price+totalFee;
  var instAmt=total/inst;
  var apr=fee>0?(Math.pow(1+fee,12/inst)-1)*100:0;
  var rows='';
  for(var i=1;i<=inst;i++)rows+='<div class="aw-result-row"><span class="aw-result-label">Installment '+i+'</span><span>'+fmt(instAmt)+'</span></div>';
  var res=a.querySelector('#aw-bp-res');
  res.style.display='block';
  res.innerHTML='<div class="aw-result-label">Per Installment</div><div class="aw-result-main">'+fmt(instAmt)+'</div><hr class="aw-divider">'+rows+'<hr class="aw-divider"><div class="aw-result-row"><span class="aw-result-label">Total Extra Cost</span><span style="color:#dc2626">+'+fmt(totalFee)+'</span></div><div class="aw-result-row"><span class="aw-result-label">Total You Pay</span><span>'+fmt(total)+'</span></div><div class="aw-result-row" style="font-weight:700"><span class="aw-result-label">Effective APR</span><span style="color:'+(fee===0?'#16a34a':'#dc2626')+'">'+( fee===0?'0% (Free!)':apr.toFixed(0)+'%')+'</span></div>';
});
a.querySelectorAll('input').forEach(function(el){el.addEventListener('keyup',function(e){if(e.key==='Enter')a.querySelector('#aw-bp-calc').click();});});};}();
