!function(){"use strict";window.AfroWidgets=window.AfroWidgets||{};
var TARIFF={NG:{name:'Nigeria',sym:'₦',res:68,com:85,ind:75,svc:0.12},KE:{name:'Kenya',sym:'KES ',res:25.4,com:20,ind:15,svc:0.08},ZA:{name:'South Africa',sym:'R',res:3.5,com:2.8,ind:2.2,svc:0.05},GH:{name:'Ghana',sym:'GH₵',res:1.26,com:1.68,ind:1.08,svc:0.1},EG:{name:'Egypt',sym:'E£',res:1.0,com:1.5,ind:1.25,svc:0.06},ET:{name:'Ethiopia',sym:'ETB ',res:0.69,com:1.04,ind:0.86,svc:0.08},TZ:{name:'Tanzania',sym:'TSh ',res:292,com:369,ind:252,svc:0.1},UG:{name:'Uganda',sym:'USh ',res:786,com:918,ind:715,svc:0.12},RW:{name:'Rwanda',sym:'RWF ',res:221,com:276,ind:194,svc:0.09},MA:{name:'Morocco',sym:'MAD ',res:1.3,com:1.7,ind:1.15,svc:0.07}};
window.AfroWidgets.prepaidMeter=function(a,o){o=o||{};
var opts=Object.keys(TARIFF).map(function(k){return'<option value="'+k+'">'+TARIFF[k].name+'</option>';}).join('');
a.innerHTML='<div class="aw-title">🔢 Prepaid Meter Calculator</div><div class="aw-row"><div class="aw-field"><label class="aw-label">Country</label><select class="aw-select" id="aw-pm-ctry">'+opts+'</select></div><div class="aw-field"><label class="aw-label">Customer Type</label><select class="aw-select" id="aw-pm-type"><option value="res">Residential</option><option value="com">Commercial</option></select></div></div><div class="aw-field"><label class="aw-label">Token / Recharge Amount</label><input class="aw-input" id="aw-pm-amount" type="number" min="0" inputmode="decimal" placeholder="e.g. 5000"></div><button class="aw-btn" id="aw-pm-calc">Calculate Units</button><div class="aw-result-box" id="aw-pm-res" style="display:none"></div>'+(o.footerHTML||"");
a.querySelector('#aw-pm-calc').addEventListener('click',function(){
  var k=a.querySelector('#aw-pm-ctry').value;
  var type=a.querySelector('#aw-pm-type').value;
  var amount=parseFloat(a.querySelector('#aw-pm-amount').value)||0;
  if(!amount)return;
  var d=TARIFF[k];
  var rate=type==='com'?d.com:d.res;
  var svcPct=d.svc||0.10;
  var svc=Math.round(amount*svcPct);
  var energy=amount-svc;
  var units=rate>0?Math.round(energy/rate*10)/10:0;
  var dailyUse=type==='com'?30:10;// kWh/day estimate
  var days=units>0&&dailyUse>0?Math.round(units/dailyUse):0;
  function fmt(n){return d.sym+Math.round(n).toLocaleString();}
  var res=a.querySelector('#aw-pm-res');
  res.style.display='block';
  res.innerHTML='<div class="aw-result-label">Units You Receive</div><div class="aw-result-main">'+units+' kWh</div><hr class="aw-divider"><div class="aw-result-row"><span class="aw-result-label">Token Amount</span><span>'+fmt(amount)+'</span></div><div class="aw-result-row"><span class="aw-result-label">Service Charge (~'+Math.round(svcPct*100)+'%)</span><span style="color:#dc2626">-'+fmt(svc)+'</span></div><div class="aw-result-row"><span class="aw-result-label">Energy Value</span><span>'+fmt(energy)+'</span></div><div class="aw-result-row"><span class="aw-result-label">Rate</span><span>'+d.sym+rate.toFixed(2)+'/kWh</span></div>'+(days>0?'<div class="aw-result-row"><span class="aw-result-label">Est. Duration</span><span>~'+days+' days</span></div>':'')+'<div class="aw-result-row" style="font-size:12px;color:var(--muted);margin-top:4px"><span>💡 Larger top-ups reduce % lost to service charges</span></div>';
});
a.querySelector('#aw-pm-amount').addEventListener('keyup',function(e){if(e.key==='Enter')a.querySelector('#aw-pm-calc').click();});};}();
