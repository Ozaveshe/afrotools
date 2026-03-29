!function(){"use strict";window.AfroWidgets=window.AfroWidgets||{};
var SCHEMES={KE:{name:'Kenya',sym:'KES ',scheme:'SHIF',mode:'pct',rate:2.75,min:300,max:null,note:'2.75% of gross salary, min KES 300/month'},NG:{name:'Nigeria',sym:'₦',scheme:'NHIA',mode:'pct',empEE:1.75,empER:3.25,min:0,note:'Employee: 1.75% + Employer: 3.25% of basic salary'},GH:{name:'Ghana',sym:'GH₵',scheme:'NHIL',mode:'flat',rate:2.5,note:'2.5% National Health Insurance Levy on income'},ZA:{name:'South Africa',sym:'R',scheme:'Medical Aid',mode:'manual',note:'Medical aid scheme rates vary. Typical: R1,500–R5,000/month'},TZ:{name:'Tanzania',sym:'TSh ',scheme:'NHIF',mode:'pct',rate:3,min:0,note:'3% of employee gross salary'},UG:{name:'Uganda',sym:'USh ',scheme:'NHIF',mode:'pct',rate:4,min:0,note:'4% employee + 4% employer of basic pay'},RW:{name:'Rwanda',sym:'RWF ',scheme:'RSSB (Medical)',mode:'pct',rate:7.5,min:0,note:'7.5% total: 2.5% employee + 5% employer'},ET:{name:'Ethiopia',sym:'ETB ',scheme:'CBE Health',mode:'pct',rate:3,min:0,note:'~3% contribution toward health (varies by scheme)'}};
window.AfroWidgets.healthContribution=function(a,o){o=o||{};
var opts=Object.keys(SCHEMES).map(function(k){var s=SCHEMES[k];return'<option value="'+k+'">'+s.name+' ('+s.scheme+')</option>';}).join('');
a.innerHTML='<div class="aw-title">🩺 Health Contribution Calculator</div><div class="aw-field"><label class="aw-label">Country / Scheme</label><select class="aw-select" id="aw-hc-ctry">'+opts+'</select></div><div class="aw-field"><label class="aw-label">Monthly Gross Salary</label><input class="aw-input" id="aw-hc-salary" type="number" min="0" inputmode="decimal" placeholder="e.g. 80000"></div><button class="aw-btn" id="aw-hc-calc">Calculate</button><div class="aw-result-box" id="aw-hc-res" style="display:none"></div>'+(o.footerHTML||"");
a.querySelector('#aw-hc-calc').addEventListener('click',function(){
  var k=a.querySelector('#aw-hc-ctry').value;
  var salary=parseFloat(a.querySelector('#aw-hc-salary').value)||0;
  if(!salary)return;
  var s=SCHEMES[k];
  function fmt(n){return s.sym+Math.round(n).toLocaleString();}
  var empEE=0,empER=0,total=0,rows='';
  if(s.mode==='pct'){
    empEE=Math.max(s.min||0,salary*(s.empEE||s.rate)/100);
    empER=s.empER?salary*s.empER/100:0;
    total=empEE+empER;
    rows='<div class="aw-result-row"><span class="aw-result-label">Employee Share</span><span style="color:#dc2626">'+fmt(empEE)+'</span></div>'+(empER?'<div class="aw-result-row"><span class="aw-result-label">Employer Share</span><span>'+fmt(empER)+'</span></div>':'');
  } else if(s.mode==='flat'){
    empEE=salary*s.rate/100;total=empEE;
    rows='<div class="aw-result-row"><span class="aw-result-label">NHIL (2.5%)</span><span style="color:#dc2626">'+fmt(empEE)+'</span></div>';
  } else {
    var res=a.querySelector('#aw-hc-res');
    res.style.display='block';
    res.innerHTML='<div class="aw-result-label">'+s.scheme+'</div><div class="aw-result-main" style="font-size:14px">'+s.note+'</div>';
    return;
  }
  var res=a.querySelector('#aw-hc-res');
  res.style.display='block';
  res.innerHTML='<div class="aw-result-label">Monthly '+s.scheme+' Contribution</div><div class="aw-result-main">'+fmt(empEE)+'</div><hr class="aw-divider">'+rows+(total>empEE?'<div class="aw-result-row"><span class="aw-result-label">Total (EE+ER)</span><span>'+fmt(total)+'</span></div>':'')+'<div class="aw-result-row"><span class="aw-result-label">Annual Contribution</span><span>'+fmt(empEE*12)+'</span></div><div class="aw-result-row" style="font-size:12px;color:var(--muted);margin-top:4px"><span>'+s.note+'</span></div>';
});
a.querySelector('#aw-hc-salary').addEventListener('keyup',function(e){if(e.key==='Enter')a.querySelector('#aw-hc-calc').click();});};}();
