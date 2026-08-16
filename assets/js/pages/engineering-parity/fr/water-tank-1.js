const STANDARD_TANKS = [500, 750, 1000, 1500, 2000, 3000, 5000, 10000];
const USAGE_BY_TYPE = { flat: 120, bungalow: 150, duplex: 150, compound: 130, office: 50, school: 30 };

// Tank prices (approximate, local currency)
var TANK_PRICES = {
  NG: {sym:'\u20A6', 500:35000, 750:50000, 1000:65000, 1500:90000, 2000:120000, 3000:180000, 5000:280000, 10000:500000},
  KE: {sym:'KSh ', 500:5000, 750:7000, 1000:9000, 1500:13000, 2000:17000, 3000:25000, 5000:40000, 10000:75000},
  ZA: {sym:'R', 500:1200, 750:1600, 1000:2100, 1500:3000, 2000:3800, 3000:5500, 5000:8500, 10000:15000},
  GH: {sym:'GHS ', 500:400, 750:550, 1000:700, 1500:1000, 2000:1300, 3000:1900, 5000:3000, 10000:5500}
};

// Rainfall data (mm/year approximate)
var RAINFALL = {lagos:1500,abuja:1200,nairobi:900,mombasa:1100,joburg:700,capetown:500,accra:800,kumasi:1400,dar:1100,cairo:25};

// Show/hide rain fields
document.getElementById('rainwater').addEventListener('change', function(){
  document.getElementById('rainFields').style.display = this.value==='yes'?'':'none';
});

function calculate() {
  const peopleInput = document.getElementById('people');
  const backupDaysInput = document.getElementById('backupDays');
  const people = +peopleInput.value;
  const type = document.getElementById('propertyType').value;
  const backupDays = +backupDaysInput.value;
  if (
    !peopleInput.checkValidity() ||
    !backupDaysInput.checkValidity() ||
    !Number.isFinite(people) ||
    !Number.isFinite(backupDays) ||
    people <= 0 ||
    backupDays <= 0
  ) {
    return;
  }
  const result = EngineeringMaterialsEngine.waterTank({people:people,propertyType:type,backupDays:backupDays,garden:document.getElementById('garden').checked,carwash:document.getElementById('carwash').checked,laundry:document.getElementById('laundry').checked,cooking:document.getElementById('cooking').checked,rainwater:document.getElementById('rainwater').value==='yes',roofArea:parseFloat(document.getElementById('roofArea').value)||0});
  if (result.error) return;
  const baseUsage=result.baseUsage,dailyTotal=result.dailyTotal,totalNeeded=result.totalNeeded,recTank=result.recommendedTank;

  document.getElementById('recSize').textContent = recTank.toLocaleString() + ' Litres';
  document.getElementById('recDesc').textContent = `Calcul fondé sur ${people} personnes × ${baseUsage} L/jour × ${backupDays} jours = ${totalNeeded.toLocaleString()}L nécessaires`;

  let html = '';
  html += `<div class="result-box"><div class="num">${dailyTotal.toLocaleString()}L</div><div class="lbl">Daily Usage</div></div>`;
  html += `<div class="result-box"><div class="num">${totalNeeded.toLocaleString()}L</div><div class="lbl">Total nécessaires</div></div>`;
  html += `<div class="result-box"><div class="num">${backupDays} jours</div><div class="lbl">Période d’autonomie</div></div>`;
  html += `<div class="result-box"><div class="num">${(recTank / dailyTotal).toFixed(1)} jours</div><div class="lbl">Réservoir Lasts</div></div>`;
  document.getElementById('resultGrid').innerHTML = html;

  // Tank visualization
  const fillPct = result.fillPct;
  document.getElementById('tankViz').style.setProperty('--fill', fillPct + '%');
  document.getElementById('tankLabel').textContent = `${recTank.toLocaleString()}L Réservoir (${Math.round(fillPct)}% used for ${backupDays}-jour d’autonomie)`;

  // Standard tank options
  let opts = '';
  const nearTanks = result.nearTanks;
  nearTanks.forEach(s => {
    const days = (s / dailyTotal).toFixed(1);
    const active = s === recTank ? ' active' : '';
    opts += `<div class="tank-opt${active}"><div class="size">${s >= 1000 ? (s/1000) + ',000' : s}L</div><div class="desc">${days} jours d’autonomie</div></div>`;
  });
  document.getElementById('tankOptions').innerHTML = opts;

  // ── Pump & Pipe ──
  var pos = document.getElementById('tankPosition').value;
  var pumpText = '';
  if (pos === 'ground') {
    var pumpHP = dailyTotal <= 1000 ? '0.5 HP' : dailyTotal <= 2000 ? '0.75 HP' : dailyTotal <= 5000 ? '1.0 HP' : '1.5 HP';
    var pipeSize = dailyTotal <= 1000 ? '\u00BD inch (15mm)' : dailyTotal <= 3000 ? '\u00BE inch (20mm)' : '1 inch (25mm)';
    pumpText = '<strong>Pump:</strong> ' + pumpHP + ' pompe de surface ou immergée (débit ~30-50 L/min)<br>' +
      '<strong>Pipe:</strong> ' + pipeSize + ' PPR or HDPE du réservoir au bâtiment<br>' +
      '<strong>Note:</strong> Les réservoirs au sol nécessitent une pompe pour alimenter la distribution en hauteur. Prévoyez un ballon de pression pour stabiliser la pression.';
  } else if (pos === 'elevated') {
    pumpText = '<strong>Pump:</strong>Informations et hypothèses du calcul<br>' +
      '<strong>Pipe:</strong> ¾ inch (20mm) PPR du réservoir au bâtiment<br>' +
      '<strong>Stand Hauteur:</strong> Minimum 3m for adequate shower pressure. 5m+ Puissance recommandée : for multi-storey.';
  } else {
    pumpText = '<strong>Pump:</strong> 0.75-1.5 HP submersible or transfer pump required<br>' +
      '<strong>Note:</strong> Underground tanks protect Eau from heat and theft but need pumping to any point of use.';
  }
  document.getElementById('pumpText').innerHTML = pumpText;
  document.getElementById('pumpSection').style.display = '';

  // ── Tank Pricing ──
  var country = document.getElementById('country').value;
  var prices = TANK_PRICES[country];
  if (prices && prices[recTank]) {
    document.getElementById('priceText').innerHTML = '<strong>' + recTank.toLocaleString() + 'L Réservoir:</strong> ' + prices.sym + prices[recTank].toLocaleString() + ' (approximate)<br>' +
      '<span style="font-size:.72rem;color:#94a3b8">Marques : ' + (country==='NG'?'Geepee, Sintex, Polytank, Roto':country==='KE'?'Roto, Kentank, Jumbo, Toptank':country==='ZA'?'JoJo, Nel, Ecotank':'Polytank, Duraplast') + '. Les prix varient selon la marque et le lieu.</span>';
    document.getElementById('priceSection').style.display = '';
  }

  // ── Multiple tank suggestion ──
  if (recTank > 10000 || totalNeeded > 10000) {
    var numTanks = result.multipleTanks;
    document.getElementById('multiTankNote').innerHTML = '<strong>Multiple tanks Recommandé:</strong> Your storage need of ' + totalNeeded.toLocaleString() + 'L exceeds standard monophasée-Réservoir sizes. Consider ' + numTanks + ' × 5,000L tanks instead. This also provides redundancy — one Réservoir can be cleaned while others remain in service.';
    document.getElementById('multiTankNote').style.display = '';
  } else {
    document.getElementById('multiTankNote').style.display = 'none';
  }

  // ── Rainwater Harvesting ──
  if (document.getElementById('rainwater').value === 'yes') {
    var roofArea = parseFloat(document.getElementById('roofArea').value) || 100;
    var catchmentLitres = result.annualRainCatchment;
    var monthlyRain = result.monthlyRainCatchment;
    var pctCovered = result.rainCoveragePct;
    document.getElementById('rainText').innerHTML = '<strong>Annual catchment:</strong> ' + catchmentLitres.toLocaleString() + ' litres/year (~' + monthlyRain.toLocaleString() + ' L/mois)<br>' +
      '<strong>Toiture Surface:</strong> ' + roofArea + ' m² × ~1,000mm average rainfall × 80% efficiency<br>' +
      '<strong>Coverage:</strong> Rainwater could supply ~' + pctCovered + '% of your monthly Eau need.<br>' +
      '<span style="font-size:.72rem;color:#94a3b8">Le contrat accepté calcule le besoin quotidien, applique l’autonomie et la réserve, puis recommande une capacité standard.</span>';
    document.getElementById('rainSection').style.display = '';
  } else {
    document.getElementById('rainSection').style.display = 'none';
  }

  document.getElementById('resultCard').style.display = 'block';
  document.getElementById('resultCard').scrollIntoView({ behavior: 'smooth', block: 'start' });
}
