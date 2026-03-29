!function(){"use strict";window.AfroWidgets=window.AfroWidgets||{};
// Inline tariff data: top 10 African countries
var TARIFF={NG:{name:'Nigeria',sym:'₦',res:68,com:85,ind:75,bands:[{lbl:'Band A (20+hrs)',r:225},{lbl:'Band B (16-20hrs)',r:63.36},{lbl:'Band C (12-16hrs)',r:50},{lbl:'Band D (8-12hrs)',r:43},{lbl:'Band E (4-8hrs)',r:40}]},KE:{name:'Kenya',sym:'KES ',res:25.4,com:20,ind:15,bands:[]},ZA:{name:'South Africa',sym:'R',res:3.5,com:2.8,ind:2.2,bands:[{lbl:'Lifeline (≤350kWh)',r:1.2},{lbl:'Standard (350+kWh)',r:3.5}]},GH:{name:'Ghana',sym:'GH₵',res:1.26,com:1.68,ind:1.08,bands:[]},EG:{name:'Egypt',sym:'E£',res:1.0,com:1.5,ind:1.25,bands:[]},ET:{name:'Ethiopia',sym:'ETB ',res:0.69,com:1.04,ind:0.86,bands:[]},TZ:{name:'Tanzania',sym:'TSh ',res:292,com:369,ind:252,bands:[]},UG:{name:'Uganda',sym:'USh ',res:786,com:918,ind:715,bands:[]},RW:{name:'Rwanda',sym:'RWF ',res:221,com:276,ind:194,bands:[]},SN:{name:'Senegal',sym:'CFA ',res:101,com:121,ind:89,bands:[]},MA:{name:'Morocco',sym:'MAD ',res:1.3,com:1.7,ind:1.15,bands:[]}};
window.AfroWidgets.electricityTariff=function(a,o){o=o||{};
var opts=Object.keys(TARIFF).map(function(k){return'<option value="'+k+'">'+TARIFF[k].name+'</option>';}).join('');
a.innerHTML='<div class="aw-title">⚡ Electricity Bill Calculator</div><div class="aw-row"><div class="aw-field"><label class="aw-label">Country</label><select class="aw-select" id="aw-et-ctry">'+opts+'</select></div><div class="aw-field"><label class="aw-label">Customer Type</label><select class="aw-select" id="aw-et-type"><option value="res">Residential</option><option value="com">Commercial</option><option value="ind">Industrial</option></select></div></div><div class="aw-field"><label class="aw-label">Monthly Usage (kWh)</label><input class="aw-input" id="aw-et-kwh" type="number" min="0" inputmode="decimal" placeholder="e.g. 200"></div><button class="aw-btn" id="aw-et-calc">Calculate Bill</button><div class="aw-result-box" id="aw-et-res" style="display:none"></div>'+(o.footerHTML||"");
a.querySelector('#aw-et-calc').addEventListener('click',function(){
  var k=a.querySelector('#aw-et-ctry').value;
  var type=a.querySelector('#aw-et-type').value;
  var kwh=parseFloat(a.querySelector('#aw-et-kwh').value)||0;
  if(!kwh)return;
  var d=TARIFF[k];
  var rate=type==='com'?d.com:type==='ind'?d.ind:d.res;
  var monthly,bandRows='';
  // Use bands for residential if available
  if(type==='res'&&d.bands&&d.bands.length){
    // Simple: use band rates based on usage
    var rem=kwh;monthly=0;
    var bandSize=kwh/d.bands.length;
    d.bands.forEach(function(b){var u=Math.min(rem,bandSize);monthly+=u*b.r;rem-=u;bandRows+='<div class="aw-result-row"><span class="aw-result-label">'+b.lbl+'</span><span>'+d.sym+b.r.toFixed(2)+'/kWh</span></div>';});
    if(rem>0)monthly+=rem*d.bands[d.bands.length-1].r;
    rate=monthly/kwh;
  } else {monthly=kwh*rate;}
  function fmt(n){return d.sym+Math.round(n).toLocaleString();}
  var daily=monthly/30;
  var res=a.querySelector('#aw-et-res');
  res.style.display='block';
  res.innerHTML='<div class="aw-result-label">Monthly Bill ('+d.name+')</div><div class="aw-result-main">'+fmt(monthly)+'</div><hr class="aw-divider">'+bandRows+'<div class="aw-result-row"><span class="aw-result-label">Daily Cost</span><span>'+fmt(daily)+'</span></div><div class="aw-result-row"><span class="aw-result-label">Annual Bill</span><span>'+fmt(monthly*12)+'</span></div><div class="aw-result-row"><span class="aw-result-label">Avg Rate</span><span>'+d.sym+rate.toFixed(2)+'/kWh</span></div>';
});
a.querySelectorAll('input,select').forEach(function(el){el.addEventListener('change',function(){});});
a.querySelector('#aw-et-kwh').addEventListener('keyup',function(e){if(e.key==='Enter')a.querySelector('#aw-et-calc').click();});};}();
