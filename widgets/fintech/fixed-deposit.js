!function(){"use strict";window.AfroWidgets=window.AfroWidgets||{},window.AfroWidgets.fixedDeposit=function(a,o){o=o||{};
var COUNTRIES=[{code:'NG',name:'Nigeria',sym:'₦'},{code:'KE',name:'Kenya',sym:'KES '},{code:'GH',name:'Ghana',sym:'GH₵'},{code:'ZA',name:'South Africa',sym:'R'},{code:'EG',name:'Egypt',sym:'E£'},{code:'UG',name:'Uganda',sym:'USh '},{code:'TZ',name:'Tanzania',sym:'TSh '},{code:'RW',name:'Rwanda',sym:'RWF '},{code:'ET',name:'Ethiopia',sym:'ETB '},{code:'MA',name:'Morocco',sym:'MAD '}];
var opts=COUNTRIES.map(function(c){return'<option value="'+c.code+'" data-sym="'+c.sym+'">'+c.name+'</option>';}).join('');
a.innerHTML='<div class="aw-title">🏦 Fixed Deposit Calculator</div><div class="aw-field"><label class="aw-label">Country</label><select class="aw-select" id="aw-fd-country">'+opts+'</select></div><div class="aw-row"><div class="aw-field"><label class="aw-label">Principal Amount</label><input class="aw-input" id="aw-fd-amount" type="number" min="0" inputmode="decimal" placeholder="e.g. 500000"></div><div class="aw-field"><label class="aw-label">Interest Rate (% p.a.)</label><input class="aw-input" id="aw-fd-rate" type="number" min="0" max="100" step="0.1" placeholder="e.g. 14.5"></div></div><div class="aw-row"><div class="aw-field"><label class="aw-label">Tenor (months)</label><select class="aw-select" id="aw-fd-tenor"><option value="3">3 months</option><option value="6">6 months</option><option value="12" selected>12 months</option><option value="24">24 months</option></select></div><div class="aw-field"><label class="aw-label">Interest Type</label><select class="aw-select" id="aw-fd-type"><option value="simple">Simple interest</option><option value="compound">Compound monthly</option></select></div></div><div class="aw-field"><label class="aw-label">Withholding Tax (%)</label><input class="aw-input" id="aw-fd-tax" type="number" min="0" max="50" value="0" placeholder="0"></div><button class="aw-btn" id="aw-fd-calc">Calculate</button><div class="aw-result-box" id="aw-fd-res" style="display:none"></div>'+(o.footerHTML||"");
a.querySelector('#aw-fd-calc').addEventListener('click',function(){
  var sel=a.querySelector('#aw-fd-country');
  var sym=sel.options[sel.selectedIndex].getAttribute('data-sym');
  var p=parseFloat(a.querySelector('#aw-fd-amount').value)||0;
  var r=parseFloat(a.querySelector('#aw-fd-rate').value)/100;
  var m=parseInt(a.querySelector('#aw-fd-tenor').value);
  var tax=parseFloat(a.querySelector('#aw-fd-tax').value)/100;
  var compound=a.querySelector('#aw-fd-type').value==='compound';
  if(!p||!r)return;
  function fmt(n){return sym+Math.round(n).toLocaleString();}
  var gross,total;
  if(compound){total=p*Math.pow(1+r/12,m);gross=total-p;}
  else{gross=p*r*(m/12);total=p+gross;}
  var taxAmt=gross*tax;
  var net=gross-taxAmt;
  var netTotal=p+net;
  var ear=compound?Math.pow(1+r/12,12)-1:r;
  var res=a.querySelector('#aw-fd-res');
  res.style.display='block';
  res.innerHTML='<div class="aw-result-label">Total at Maturity</div><div class="aw-result-main">'+fmt(netTotal)+'</div><hr class="aw-divider"><div class="aw-result-row"><span class="aw-result-label">Principal</span><span>'+fmt(p)+'</span></div><div class="aw-result-row"><span class="aw-result-label">Gross Interest</span><span>'+fmt(gross)+'</span></div>'+(tax>0?'<div class="aw-result-row"><span class="aw-result-label">Withholding Tax</span><span style="color:#dc2626">-'+fmt(taxAmt)+'</span></div>':'')+'<div class="aw-result-row"><span class="aw-result-label">Net Interest</span><span style="color:#16a34a">'+fmt(net)+'</span></div><hr class="aw-divider"><div class="aw-result-row" style="font-weight:700"><span class="aw-result-label">Effective Annual Rate</span><span style="color:var(--accent)">'+(ear*100).toFixed(2)+'%</span></div><div class="aw-result-row"><span class="aw-result-label">Monthly Equivalent</span><span>'+fmt(net/m)+'/mo</span></div>';
});
a.querySelectorAll('input').forEach(function(el){el.addEventListener('keyup',function(e){if(e.key==='Enter')a.querySelector('#aw-fd-calc').click();});});};}();
