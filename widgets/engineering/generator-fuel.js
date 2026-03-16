(function(){
window.AfroWidgets=window.AfroWidgets||{};
window.AfroWidgets.generator_fuel=function(c,o){
c.innerHTML='<div class="aw-title">Generator Fuel Cost</div><div class="aw-row"><div class="aw-field"><label class="aw-label">Generator kVA</label><input class="aw-input" id="aw-kva" type="number" min="1" value="5"></div><div class="aw-field"><label class="aw-label">Load %</label><input class="aw-input" id="aw-load" type="number" min="10" max="100" value="75"></div></div><div class="aw-row"><div class="aw-field"><label class="aw-label">Fuel Price/L</label><input class="aw-input" id="aw-fp" type="number" min="0" placeholder="e.g. 700"></div><div class="aw-field"><label class="aw-label">Hours/Day</label><input class="aw-input" id="aw-hrs" type="number" min="1" max="24" value="8"></div></div><button class="aw-btn aw-btn--primary" id="aw-calc">Calculate</button><div class="aw-result-box" id="aw-res" style="display:none"></div>'+(o.footerHTML||'');
c.querySelector('#aw-calc').addEventListener('click',function(){
var kva=parseFloat(c.querySelector('#aw-kva').value)||0,load=parseFloat(c.querySelector('#aw-load').value)/100,fp=parseFloat(c.querySelector('#aw-fp').value)||0,hrs=parseFloat(c.querySelector('#aw-hrs').value)||8;
if(kva<=0||fp<=0)return;
var lph=kva*0.8*load*0.27,daily=lph*hrs,costD=daily*fp,costM=daily*30*fp;
var f=function(n){return Math.round(n).toLocaleString('en')};
var r=c.querySelector('#aw-res');r.style.display='block';
r.innerHTML='<div class="aw-result-row"><span class="aw-result-label">Fuel/Hour</span><span class="aw-result-main">'+lph.toFixed(1)+' L</span></div><div class="aw-result-row"><span class="aw-result-label">Daily Cost</span><span class="aw-result-main">'+f(costD)+'</span></div><hr class="aw-divider"><div class="aw-result-row"><span class="aw-result-label">Monthly Cost</span><span class="aw-result-main">'+f(costM)+'</span></div>';
});};})();
