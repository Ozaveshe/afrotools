/* ── Prices per 50kg bag & per m³ sand/gravel by country ── */
var PRICES = {
  NG: {sym:'\u20A6', cement:6000, sand:3500, gravel:5500, sandUnit:'per m\u00B3', gravelUnit:'per m\u00B3'},
  KE: {sym:'KSh ', cement:850, sand:2500, gravel:3500, sandUnit:'per m\u00B3', gravelUnit:'per m\u00B3'},
  ZA: {sym:'R', cement:95, sand:400, gravel:550, sandUnit:'per m\u00B3', gravelUnit:'per m\u00B3'},
  GH: {sym:'GHS ', cement:82, sand:350, gravel:500, sandUnit:'per m\u00B3', gravelUnit:'per m\u00B3'}
};

function updateGrade() {
  var sel = document.getElementById('grade');
  var opt = sel.options[sel.selectedIndex];
  document.getElementById('customRatioRow').style.display = sel.value==='custom'?'grid':'none';
}

function toggleShape() {
  var shapes = ['dimSlab','dimColumn','dimBeam','dimFoot','dimCirc','dimDirect'];
  var map = {slab:'dimSlab',column:'dimColumn',beam:'dimBeam',footing:'dimFoot',circular:'dimCirc',direct:'dimDirect'};
  var val = document.getElementById('shape').value;
  shapes.forEach(function(s){document.getElementById(s).style.display='none';});
  if(map[val]) document.getElementById(map[val]).style.display='';
}

function getVolume() {
  var shape = document.getElementById('shape').value;
  if(shape==='slab'){
    return (parseFloat(document.getElementById('sLen').value)||0)*(parseFloat(document.getElementById('sWid').value)||0)*(parseFloat(document.getElementById('sDep').value)||0);
  } else if(shape==='column'){
    return (parseFloat(document.getElementById('cW').value)||0)*(parseFloat(document.getElementById('cD').value)||0)*(parseFloat(document.getElementById('cH').value)||0)*(parseInt(document.getElementById('cQ').value)||1);
  } else if(shape==='beam'){
    return (parseFloat(document.getElementById('bW').value)||0)*(parseFloat(document.getElementById('bD').value)||0)*(parseFloat(document.getElementById('bL').value)||0)*(parseInt(document.getElementById('bQ').value)||1);
  } else if(shape==='footing'){
    return (parseFloat(document.getElementById('fL').value)||0)*(parseFloat(document.getElementById('fW').value)||0)*(parseFloat(document.getElementById('fD').value)||0)*(parseInt(document.getElementById('fQ').value)||1);
  } else if(shape==='circular'){
    var r = (parseFloat(document.getElementById('ciDia').value)||0)/2;
    return Math.PI*r*r*(parseFloat(document.getElementById('ciH').value)||0)*(parseInt(document.getElementById('ciQ').value)||1);
  } else {
    return parseFloat(document.getElementById('directVol').value)||0;
  }
}

function getRatio() {
  var sel = document.getElementById('grade');
  if(sel.value==='custom'){
    return [parseFloat(document.getElementById('cRatio1').value)||1,parseFloat(document.getElementById('cRatio2').value)||2,parseFloat(document.getElementById('cRatio3').value)||4];
  }
  var opt = sel.options[sel.selectedIndex];
  return opt.dataset.ratio.split(':').map(Number);
}

function getWC() {
  var sel = document.getElementById('grade');
  var opt = sel.options[sel.selectedIndex];
  return parseFloat(opt.dataset.wc)||0.50;
}

function calculate() {
  var wetVol = getVolume();
  if(wetVol<=0){alert('Please enter valid dimensions.');return;}

  var parts = getRatio();
  var cement = parts[0], sand = parts[1], agg = parts[2]||0;
  var totalParts = cement + sand + agg;
  var bagSize = parseInt(document.getElementById('bagSize').value);
  var wastage = 1 + parseInt(document.getElementById('wastage').value)/100;
  var wc = getWC();
  var bulking = 1.54;

  var dryVol = wetVol * bulking;

  // Materials
  var cementVol = (cement/totalParts)*dryVol;
  var cementKg = cementVol * 1440;
  var cementBags = Math.ceil((cementKg/bagSize)*wastage);

  var sandVol = (sand/totalParts)*dryVol*wastage;
  var sandTonnes = sandVol*1.6;
  var sandWB = Math.ceil(sandVol/0.065);

  var aggVol = (agg/totalParts)*dryVol*wastage;
  var aggTonnes = aggVol*1.75;
  var aggWB = Math.ceil(aggVol/0.065);

  var waterLitres = Math.round(cementKg*wc);

  // Display
  document.getElementById('rCement').textContent = cementBags + ' bags';
  document.getElementById('rCementKg').textContent = Math.round(cementBags*bagSize) + ' kg (' + cementVol.toFixed(2) + ' m\u00B3)';
  document.getElementById('rSand').textContent = sandVol.toFixed(2) + ' m\u00B3';
  document.getElementById('rSandTrips').textContent = sandTonnes.toFixed(1) + ' tonnes | ' + sandWB + ' wheelbarrows';
  if(agg>0){
    document.getElementById('rGravel').textContent = aggVol.toFixed(2) + ' m\u00B3';
    document.getElementById('rGravelTrips').textContent = aggTonnes.toFixed(1) + ' tonnes | ' + aggWB + ' wheelbarrows';
  }else{
    document.getElementById('rGravel').textContent = 'N/A';
    document.getElementById('rGravelTrips').textContent = 'Not required for mortar';
  }
  document.getElementById('rVolume').textContent = wetVol.toFixed(2) + ' m\u00B3';
  document.getElementById('rDryVol').textContent = dryVol.toFixed(2) + ' m\u00B3';
  document.getElementById('rWC').textContent = wc.toFixed(2);
  document.getElementById('rWater').textContent = waterLitres + ' litres';

  // Cost
  var country = document.getElementById('country').value;
  if(country!=='none' && PRICES[country]){
    var p = PRICES[country];
    var cCost = cementBags * p.cement;
    var sCost = sandVol * p.sand;
    var gCost = aggVol * p.gravel;
    var total = cCost + sCost + gCost;
    var html = '<tr><td>Cement ('+bagSize+'kg bags)</td><td>'+cementBags+'</td><td class="num">'+p.sym+p.cement.toLocaleString()+'</td><td class="num">'+p.sym+Math.round(cCost).toLocaleString()+'</td></tr>';
    html += '<tr><td>Sand</td><td>'+sandVol.toFixed(2)+' m\u00B3</td><td class="num">'+p.sym+p.sand.toLocaleString()+' /m\u00B3</td><td class="num">'+p.sym+Math.round(sCost).toLocaleString()+'</td></tr>';
    if(agg>0) html += '<tr><td>Aggregate / Gravel</td><td>'+aggVol.toFixed(2)+' m\u00B3</td><td class="num">'+p.sym+p.gravel.toLocaleString()+' /m\u00B3</td><td class="num">'+p.sym+Math.round(gCost).toLocaleString()+'</td></tr>';
    document.getElementById('costBody').innerHTML = html;
    document.getElementById('costTotal').textContent = p.sym + Math.round(total).toLocaleString();
    document.getElementById('costSection').style.display = '';
  } else {
    document.getElementById('costSection').style.display = 'none';
  }

  // Curing note
  var grade = document.getElementById('grade').value;
  document.getElementById('curingNote').style.display = '';
  if(grade.startsWith('M2')||grade.startsWith('M3')){
    document.getElementById('curingText').textContent = 'This grade requires minimum 14 days of curing. Keep concrete moist with wet hessian, plastic sheeting, or curing compound. In hot weather (>35\u00B0C), water 3-4 times daily.';
  } else {
    document.getElementById('curingText').textContent = 'Cure for minimum 7 days. Keep concrete moist — cover with wet hessian or plastic sheeting. Avoid direct sun exposure in the first 24 hours.';
  }

  // Rebar note for M20+
  var gradeNum = parseInt(grade.replace('M',''));
  document.getElementById('rebarNote').style.display = gradeNum>=20?'':'none';

  document.getElementById('results').style.display = 'block';
  document.getElementById('results').scrollIntoView({behavior:'smooth',block:'start'});
}

function resetCalc(){
  document.getElementById('results').style.display='none';
  document.getElementById('sLen').value='';
  document.getElementById('sWid').value='';
  document.getElementById('sDep').value='0.15';
}

function shareResult(){
  var bags = document.getElementById('rCement').textContent;
  var sand = document.getElementById('rSand').textContent;
  var vol = document.getElementById('rVolume').textContent;
  var text = 'Concrete: '+vol+' wet volume\nCement: '+bags+'\nSand: '+sand+'\nCalculated with AfroTools\nhttps://afrotools.com/tools/concrete-mix/';
  if(navigator.share){navigator.share({title:'Concrete Mix | AfroTools',text:text}).catch(function(){});}
  else{navigator.clipboard.writeText(text).then(function(){alert('Copied!');});}
}
