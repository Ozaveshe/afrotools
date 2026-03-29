!function(){"use strict";window.AfroWidgets=window.AfroWidgets||{};
// Inline insurance data: top 8 countries
var INS={NG:{name:'Nigeria',sym:'₦',tpMin:15e3,tpMax:15e3,compMin:3,compMax:7,providers:'Leadway, AXA Mansard, AIICO, NEM'},KE:{name:'Kenya',sym:'KSh ',tpMin:5e3,tpMax:8e3,compMin:4,compMax:8,providers:'Jubilee, AAR, Britam, CIC'},ZA:{name:'South Africa',sym:'R',tpMin:1500,tpMax:3e3,compMin:4,compMax:9,providers:'OUTsurance, Discovery, Santam, King Price'},GH:{name:'Ghana',sym:'GH₵',tpMin:200,tpMax:400,compMin:3.5,compMax:7,providers:'Enterprise, SIC, Vanguard, Star Assurance'},EG:{name:'Egypt',sym:'E£',tpMin:800,tpMax:1500,compMin:2,compMax:5,providers:'Misr Insurance, AXA Egypt, MetLife'},TZ:{name:'Tanzania',sym:'TSh ',tpMin:50e3,tpMax:120e3,compMin:3,compMax:6,providers:'Jubilee Tanzania, AAR, UAP'},UG:{name:'Uganda',sym:'USh ',tpMin:75e3,tpMax:150e3,compMin:4,compMax:8,providers:'Jubilee, UAP, AIG Uganda'},RW:{name:'Rwanda',sym:'RWF ',tpMin:15e3,tpMax:30e3,compMin:3,compMax:7,providers:'SORAS, UAP Rwanda, Prime Insurance'}};
window.AfroWidgets.carInsurance=function(a,o){o=o||{};
var ctryOpts=Object.keys(INS).map(function(k){return'<option value="'+k+'">'+INS[k].name+'</option>';}).join('');
a.innerHTML='<div class="aw-title">🚗 Car Insurance Estimator</div><div class="aw-row"><div class="aw-field"><label class="aw-label">Country</label><select class="aw-select" id="aw-ci-ctry">'+ctryOpts+'</select></div><div class="aw-field"><label class="aw-label">Cover Type</label><select class="aw-select" id="aw-ci-cover"><option value="tp">Third Party</option><option value="comp">Comprehensive</option></select></div></div><div class="aw-field" id="aw-ci-val-wrap"><label class="aw-label">Vehicle Value</label><input class="aw-input" id="aw-ci-value" type="number" min="0" inputmode="decimal" placeholder="e.g. 5000000"></div><div class="aw-row"><div class="aw-field"><label class="aw-label">Vehicle Age (years)</label><select class="aw-select" id="aw-ci-age"><option value="0">0-2 years (new)</option><option value="3" selected>3-5 years</option><option value="6">6-10 years</option><option value="11">11+ years</option></select></div><div class="aw-field"><label class="aw-label">Driver Age (years)</label><input class="aw-input" id="aw-ci-dage" type="number" min="18" max="80" value="35" placeholder="35"></div></div><div class="aw-field"><label class="aw-label">Claims in last 3 years</label><select class="aw-select" id="aw-ci-claims"><option value="0">None (NCD applies)</option><option value="1">1 claim</option><option value="2">2+ claims</option></select></div><button class="aw-btn" id="aw-ci-calc">Estimate Premium</button><div class="aw-result-box" id="aw-ci-res" style="display:none"></div>'+(o.footerHTML||"");
// Show/hide vehicle value field based on cover type
a.querySelector('#aw-ci-cover').addEventListener('change',function(){
  a.querySelector('#aw-ci-val-wrap').style.display=this.value==='comp'?'':'none';
});
a.querySelector('#aw-ci-cover').dispatchEvent(new Event('change'));
a.querySelector('#aw-ci-calc').addEventListener('click',function(){
  var k=a.querySelector('#aw-ci-ctry').value;
  var cover=a.querySelector('#aw-ci-cover').value;
  var d=INS[k];
  var driverAge=parseInt(a.querySelector('#aw-ci-dage').value)||35;
  var vehAge=parseInt(a.querySelector('#aw-ci-age').value);
  var claims=parseInt(a.querySelector('#aw-ci-claims').value);
  // Risk multiplier
  var riskFactor=(driverAge<25?1.25:driverAge>55?1.1:1)*(vehAge>=11?1.3:vehAge>=6?1.15:vehAge>=3?1:0.95)*(claims===0?0.9:claims===1?1:1.35);
  function fmt(n){return d.sym+Math.round(n).toLocaleString();}
  var minP,maxP,note='';
  if(cover==='tp'){
    minP=Math.round(d.tpMin*riskFactor);
    maxP=Math.round(d.tpMax*riskFactor);
    note='Third-party cover is mandatory in '+d.name+'.';
  } else {
    var value=parseFloat(a.querySelector('#aw-ci-value').value)||0;
    if(!value)return;
    minP=Math.round(value*d.compMin/100*riskFactor);
    maxP=Math.round(value*d.compMax/100*riskFactor);
    note='Comprehensive covers own damage + third party.';
  }
  var res=a.querySelector('#aw-ci-res');
  res.style.display='block';
  res.innerHTML='<div class="aw-result-label">Estimated Annual Premium</div><div class="aw-result-main">'+fmt(minP)+' – '+fmt(maxP)+'</div><hr class="aw-divider"><div class="aw-result-row"><span class="aw-result-label">Monthly Equivalent</span><span>'+fmt(minP/12)+' – '+fmt(maxP/12)+'</span></div><div class="aw-result-row"><span class="aw-result-label">Risk Factor</span><span>'+riskFactor.toFixed(2)+'x</span></div>'+(claims===0?'<div class="aw-result-row"><span class="aw-result-label">NCD Discount</span><span style="color:#16a34a">-10%</span></div>':'')+'<div class="aw-result-row"><span class="aw-result-label">Major Providers</span><span style="font-size:12px">'+d.providers+'</span></div><div class="aw-result-row" style="font-size:12px;color:var(--muted);margin-top:4px"><span>'+note+'</span></div>';
});
a.querySelectorAll('input').forEach(function(el){el.addEventListener('keyup',function(e){if(e.key==='Enter')a.querySelector('#aw-ci-calc').click();});});};}();
