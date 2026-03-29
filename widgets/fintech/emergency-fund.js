!function(){"use strict";window.AfroWidgets=window.AfroWidgets||{},window.AfroWidgets.emergencyFund=function(a,o){o=o||{};a.innerHTML='<div class="aw-title">🛡️ Emergency Fund Calculator</div><div class="aw-field"><label class="aw-label">Monthly Essential Expenses</label><input class="aw-input" id="aw-ef-monthly" type="number" min="0" inputmode="decimal" placeholder="e.g. 150000"></div><div class="aw-row"><div class="aw-field"><label class="aw-label">Months of Cover Target</label><select class="aw-select" id="aw-ef-months"><option value="3">3 months (minimum)</option><option value="6" selected>6 months (recommended)</option><option value="9">9 months</option><option value="12">12 months</option></select></div><div class="aw-field"><label class="aw-label">Current Savings</label><input class="aw-input" id="aw-ef-current" type="number" min="0" inputmode="decimal" placeholder="0"></div></div><div class="aw-row"><div class="aw-field"><label class="aw-label">Monthly Savings Amount</label><input class="aw-input" id="aw-ef-save" type="number" min="0" inputmode="decimal" placeholder="e.g. 20000"></div><div class="aw-field"><label class="aw-label">Est. Inflation (%/yr)</label><input class="aw-input" id="aw-ef-infl" type="number" min="0" max="100" value="22" placeholder="22"></div></div><button class="aw-btn" id="aw-ef-calc">Calculate</button><div class="aw-result-box" id="aw-ef-res" style="display:none"></div>'+(o.footerHTML||"");
function f(n){return Math.round(n).toLocaleString();}
a.querySelector('#aw-ef-calc').addEventListener('click',function(){
  var monthly=parseFloat(a.querySelector('#aw-ef-monthly').value)||0;
  var months=parseInt(a.querySelector('#aw-ef-months').value);
  var current=parseFloat(a.querySelector('#aw-ef-current').value)||0;
  var save=parseFloat(a.querySelector('#aw-ef-save').value)||1;
  var infl=parseFloat(a.querySelector('#aw-ef-infl').value)/100;
  if(!monthly){return;}
  var target=monthly*months;
  var gap=Math.max(0,target-current);
  var mToGoal=gap>0?Math.ceil(gap/save):0;
  var progress=target>0?Math.min(100,(current/target*100)):0;
  var inflAdj=target*Math.pow(1+infl,3);
  var res=a.querySelector('#aw-ef-res');
  res.style.display='block';
  res.innerHTML='<div class="aw-result-label">Emergency Fund Target</div><div class="aw-result-main">'+f(target)+'</div><hr class="aw-divider"><div class="aw-result-row"><span class="aw-result-label">Current Savings</span><span>'+f(current)+'</span></div><div class="aw-result-row"><span class="aw-result-label">Gap to Fill</span><span style="color:#dc2626">'+f(gap)+'</span></div><div class="aw-result-row"><span class="aw-result-label">Months to Goal</span><span>'+(gap>0?mToGoal+' months':'Reached! ✓')+'</span></div><div class="aw-result-row"><span class="aw-result-label">Progress</span><span>'+progress.toFixed(0)+'%</span></div><div style="background:var(--border);border-radius:4px;height:6px;margin:8px 0"><div style="background:var(--accent);width:'+progress+'%;height:6px;border-radius:4px"></div></div><div class="aw-result-row"><span class="aw-result-label">Inflation-adjusted (3yr)</span><span>'+f(inflAdj)+'</span></div>';
});
a.querySelectorAll('input').forEach(function(el){el.addEventListener('keyup',function(e){if(e.key==='Enter')a.querySelector('#aw-ef-calc').click();});});};}();
