!function(){"use strict";window.AfroWidgets=window.AfroWidgets||{};
var TARIFF={NG:{name:'Nigeria',sym:'₦',rate:68},KE:{name:'Kenya',sym:'KES ',rate:25.4},ZA:{name:'South Africa',sym:'R',rate:3.5},GH:{name:'Ghana',sym:'GH₵',rate:1.26},EG:{name:'Egypt',sym:'E£',rate:1.0},ET:{name:'Ethiopia',sym:'ETB ',rate:0.69},TZ:{name:'Tanzania',sym:'TSh ',rate:292},UG:{name:'Uganda',sym:'USh ',rate:786},MA:{name:'Morocco',sym:'MAD ',rate:1.3}};
var APPLIANCES=[{id:'ac',label:'Air Conditioner',w:1500},{id:'fridge',label:'Refrigerator',w:150},{id:'tv',label:'TV (42")',w:120},{id:'fan',label:'Ceiling Fan',w:75},{id:'bulb',label:'LED Bulb',w:10},{id:'pump',label:'Water Pump',w:750},{id:'iron',label:'Electric Iron',w:1000},{id:'washing',label:'Washing Machine',w:500},{id:'microwave',label:'Microwave',w:1200},{id:'computer',label:'Desktop Computer',w:200},{id:'laptop',label:'Laptop',w:65},{id:'freezer',label:'Deep Freezer',w:200}];
window.AfroWidgets.appliancePower=function(a,o){o=o||{};
var ctryOpts=Object.keys(TARIFF).map(function(k){return'<option value="'+k+'">'+TARIFF[k].name+'</option>';}).join('');
var appRows=APPLIANCES.map(function(ap){
  return'<div class="aw-ap-row" style="display:flex;align-items:center;gap:8px;margin-bottom:8px"><label style="flex:2;font-size:13px">'+ap.label+'</label><input class="aw-input" style="flex:1;height:36px;font-size:13px" data-w="'+ap.w+'" data-id="'+ap.id+'" id="aw-ap-'+ap.id+'" type="number" min="0" max="24" step="0.5" placeholder="hrs/day" inputmode="decimal"><span style="font-size:12px;color:var(--muted);width:60px">'+ap.w+'W</span></div>';
}).join('');
a.innerHTML='<div class="aw-title">🔌 Appliance Power Calculator</div><div class="aw-row"><div class="aw-field"><label class="aw-label">Country</label><select class="aw-select" id="aw-ap-ctry">'+ctryOpts+'</select></div></div><div style="margin-bottom:12px"><div style="font-size:12px;font-weight:600;color:var(--muted);margin-bottom:6px">Enter daily hours per appliance:</div>'+appRows+'</div><button class="aw-btn" id="aw-ap-calc">Calculate Monthly Cost</button><div class="aw-result-box" id="aw-ap-res" style="display:none"></div>'+(o.footerHTML||"");
a.querySelector('#aw-ap-calc').addEventListener('click',function(){
  var k=a.querySelector('#aw-ap-ctry').value;
  var d=TARIFF[k];
  var totalKwh=0,rows='';
  APPLIANCES.forEach(function(ap){
    var hrs=parseFloat(a.querySelector('#aw-ap-'+ap.id).value)||0;
    if(hrs>0){
      var kwh=ap.w/1000*hrs*30;
      totalKwh+=kwh;
      rows+='<div class="aw-result-row"><span class="aw-result-label">'+ap.label+'</span><span>'+kwh.toFixed(1)+' kWh</span></div>';
    }
  });
  if(!totalKwh)return;
  var cost=totalKwh*d.rate;
  function fmt(n){return d.sym+Math.round(n).toLocaleString();}
  var res=a.querySelector('#aw-ap-res');
  res.style.display='block';
  res.innerHTML='<div class="aw-result-label">Monthly Electricity Cost</div><div class="aw-result-main">'+fmt(cost)+'</div><hr class="aw-divider">'+rows+'<hr class="aw-divider"><div class="aw-result-row"><span class="aw-result-label">Total kWh/month</span><span>'+totalKwh.toFixed(1)+' kWh</span></div><div class="aw-result-row"><span class="aw-result-label">Annual Cost</span><span>'+fmt(cost*12)+'</span></div>';
});};}();
