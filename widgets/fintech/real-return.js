!function(){"use strict";window.AfroWidgets=window.AfroWidgets||{},window.AfroWidgets.realReturn=function(a,o){o=o||{};
var COUNTRIES=[{code:'NG',name:'Nigeria',sym:'₦'},{code:'KE',name:'Kenya',sym:'KES '},{code:'GH',name:'Ghana',sym:'GH₵'},{code:'ZA',name:'South Africa',sym:'R'},{code:'EG',name:'Egypt',sym:'E£'},{code:'ET',name:'Ethiopia',sym:'ETB '},{code:'MA',name:'Morocco',sym:'MAD '}];
var opts=COUNTRIES.map(function(c){return'<option value="'+c.code+'" data-sym="'+c.sym+'">'+c.name+'</option>';}).join('');
a.innerHTML='<div class="aw-title">📈 Real Return After Inflation</div><div class="aw-field"><label class="aw-label">Country</label><select class="aw-select" id="aw-rr-country">'+opts+'</select></div><div class="aw-row"><div class="aw-field"><label class="aw-label">Nominal Investment Return (%)</label><input class="aw-input" id="aw-rr-nominal" type="number" min="0" max="100" step="0.1" placeholder="e.g. 22.5"></div><div class="aw-field"><label class="aw-label">Annual Inflation Rate (%)</label><input class="aw-input" id="aw-rr-inflation" type="number" min="0" max="100" step="0.1" placeholder="e.g. 33"></div></div><div class="aw-row"><div class="aw-field"><label class="aw-label">Amount Invested</label><input class="aw-input" id="aw-rr-amount" type="number" min="0" inputmode="decimal" placeholder="e.g. 1000000"></div><div class="aw-field"><label class="aw-label">Years</label><select class="aw-select" id="aw-rr-years"><option value="1">1 year</option><option value="3" selected>3 years</option><option value="5">5 years</option><option value="10">10 years</option></select></div></div><button class="aw-btn" id="aw-rr-calc">Calculate Real Return</button><div class="aw-result-box" id="aw-rr-res" style="display:none"></div>'+(o.footerHTML||"");
a.querySelector('#aw-rr-calc').addEventListener('click',function(){
  var sel=a.querySelector('#aw-rr-country');
  var sym=sel.options[sel.selectedIndex].getAttribute('data-sym');
  var nominal=parseFloat(a.querySelector('#aw-rr-nominal').value)/100;
  var inflation=parseFloat(a.querySelector('#aw-rr-inflation').value)/100;
  var amount=parseFloat(a.querySelector('#aw-rr-amount').value)||0;
  var years=parseInt(a.querySelector('#aw-rr-years').value);
  if(!nominal)return;
  function fmt(n){return sym+Math.round(n).toLocaleString();}
  var realRate=((1+nominal)/(1+inflation))-1;
  var ppFuture=amount>0?amount*Math.pow(1+realRate,years):0;
  var nominalFuture=amount>0?amount*Math.pow(1+nominal,years):0;
  var positive=realRate>=0;
  var res=a.querySelector('#aw-rr-res');
  res.style.display='block';
  res.innerHTML='<div class="aw-result-label">Real Return (Fisher Equation)</div><div class="aw-result-main" style="color:'+(positive?'#16a34a':'#dc2626')+'">'+(realRate*100).toFixed(2)+'%</div><hr class="aw-divider"><div class="aw-result-row"><span class="aw-result-label">Nominal Return</span><span>'+(nominal*100).toFixed(2)+'%</span></div><div class="aw-result-row"><span class="aw-result-label">Inflation Rate</span><span>'+(inflation*100).toFixed(2)+'%</span></div>'+(amount>0?'<hr class="aw-divider"><div class="aw-result-row"><span class="aw-result-label">Nominal Value ('+years+'yr)</span><span>'+fmt(nominalFuture)+'</span></div><div class="aw-result-row"><span class="aw-result-label">Real Purchasing Power</span><span style="color:'+(positive?'#16a34a':'#dc2626')+'">'+fmt(ppFuture)+'</span></div>':'')+'<div class="aw-result-row" style="margin-top:8px;font-size:13px;color:var(--muted)"><span>'+(positive?'✓ Your investment beats inflation by '+(realRate*100).toFixed(2)+'%':'⚠ Inflation is eroding your wealth. Consider higher-yield assets.')+'</span></div>';
});
a.querySelectorAll('input').forEach(function(el){el.addEventListener('keyup',function(e){if(e.key==='Enter')a.querySelector('#aw-rr-calc').click();});});};}();
