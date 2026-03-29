!function(){"use strict";window.AfroWidgets=window.AfroWidgets||{},window.AfroWidgets.tbillCalc=function(a,o){o=o||{};
var COUNTRIES=[{code:'NG',name:'Nigeria',sym:'₦'},{code:'KE',name:'Kenya',sym:'KES '},{code:'GH',name:'Ghana',sym:'GH₵'},{code:'ZA',name:'South Africa',sym:'R'},{code:'EG',name:'Egypt',sym:'E£'},{code:'UG',name:'Uganda',sym:'USh '},{code:'TZ',name:'Tanzania',sym:'TSh '},{code:'RW',name:'Rwanda',sym:'RWF '}];
var opts=COUNTRIES.map(function(c){return'<option value="'+c.code+'" data-sym="'+c.sym+'">'+c.name+'</option>';}).join('');
a.innerHTML='<div class="aw-title">📊 Treasury Bill Yield Calculator</div><div class="aw-field"><label class="aw-label">Country</label><select class="aw-select" id="aw-tb-country">'+opts+'</select></div><div class="aw-row"><div class="aw-field"><label class="aw-label">Face Value</label><input class="aw-input" id="aw-tb-amount" type="number" min="0" inputmode="decimal" placeholder="e.g. 1000000"></div><div class="aw-field"><label class="aw-label">Discount Rate (%)</label><input class="aw-input" id="aw-tb-rate" type="number" min="0" max="100" step="0.1" placeholder="e.g. 22.5"></div></div><div class="aw-row"><div class="aw-field"><label class="aw-label">Tenor (days)</label><select class="aw-select" id="aw-tb-tenor"><option value="91">91 days</option><option value="182">182 days</option><option value="364" selected>364 days</option></select></div><div class="aw-field"><label class="aw-label">Withholding Tax (%)</label><input class="aw-input" id="aw-tb-tax" type="number" min="0" max="50" value="0" placeholder="0"></div></div><button class="aw-btn" id="aw-tb-calc">Calculate Yield</button><div class="aw-result-box" id="aw-tb-res" style="display:none"></div>'+(o.footerHTML||"");
a.querySelector('#aw-tb-calc').addEventListener('click',function(){
  var sel=a.querySelector('#aw-tb-country');
  var sym=sel.options[sel.selectedIndex].getAttribute('data-sym');
  var fv=parseFloat(a.querySelector('#aw-tb-amount').value)||0;
  var rate=parseFloat(a.querySelector('#aw-tb-rate').value)/100;
  var days=parseInt(a.querySelector('#aw-tb-tenor').value);
  var tax=parseFloat(a.querySelector('#aw-tb-tax').value)/100;
  if(!fv||!rate)return;
  function fmt(n){return sym+Math.round(n).toLocaleString();}
  var price=fv/(1+rate*(days/365));
  var gross=fv-price;
  var taxAmt=gross*tax;
  var net=gross-taxAmt;
  var netTotal=price+net;
  var actualYield=(gross/price)*(365/days)*100;
  var annNet=(net/price)*(365/days)*100;
  var res=a.querySelector('#aw-tb-res');
  res.style.display='block';
  res.innerHTML='<div class="aw-result-label">Net Proceeds at Maturity</div><div class="aw-result-main">'+fmt(netTotal)+'</div><hr class="aw-divider"><div class="aw-result-row"><span class="aw-result-label">Purchase Price</span><span>'+fmt(price)+'</span></div><div class="aw-result-row"><span class="aw-result-label">Gross Return</span><span>'+fmt(gross)+'</span></div>'+(tax>0?'<div class="aw-result-row"><span class="aw-result-label">Withholding Tax</span><span style="color:#dc2626">-'+fmt(taxAmt)+'</span></div>':'')+'<div class="aw-result-row"><span class="aw-result-label">Net Return</span><span style="color:#16a34a">'+fmt(net)+'</span></div><hr class="aw-divider"><div class="aw-result-row"><span class="aw-result-label">Actual Yield (gross)</span><span>'+actualYield.toFixed(2)+'%</span></div><div class="aw-result-row" style="font-weight:700"><span class="aw-result-label">Annualised Net Yield</span><span style="color:var(--accent)">'+annNet.toFixed(2)+'%</span></div>';
});
a.querySelectorAll('input').forEach(function(el){el.addEventListener('keyup',function(e){if(e.key==='Enter')a.querySelector('#aw-tb-calc').click();});});};}();
