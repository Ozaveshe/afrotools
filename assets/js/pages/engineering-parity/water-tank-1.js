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
  const baseUsage = USAGE_BY_TYPE[type] || 150;

  let extraDaily = 0;
  if (document.getElementById('garden').checked) extraDaily += 50;
  if (document.getElementById('carwash').checked) extraDaily += 30;
  if (document.getElementById('laundry').checked) extraDaily += 40;
  if (document.getElementById('cooking').checked) extraDaily += 20;

  const dailyTotal = (people * baseUsage) + extraDaily;
  const totalNeeded = dailyTotal * backupDays;

  // Find recommended standard size
  let recTank = STANDARD_TANKS[STANDARD_TANKS.length - 1];
  for (const s of STANDARD_TANKS) {
    if (s >= totalNeeded) { recTank = s; break; }
  }

  document.getElementById('recSize').textContent = recTank.toLocaleString() + ' Litres';
  document.getElementById('recDesc').textContent = `Based on ${people} people x ${baseUsage}L/day x ${backupDays} days = ${totalNeeded.toLocaleString()}L needed`;

  let html = '';
  html += `<div class="result-box"><div class="num">${dailyTotal.toLocaleString()}L</div><div class="lbl">Daily Usage</div></div>`;
  html += `<div class="result-box"><div class="num">${totalNeeded.toLocaleString()}L</div><div class="lbl">Total Needed</div></div>`;
  html += `<div class="result-box"><div class="num">${backupDays} days</div><div class="lbl">Backup Period</div></div>`;
  html += `<div class="result-box"><div class="num">${(recTank / dailyTotal).toFixed(1)} days</div><div class="lbl">Tank Lasts</div></div>`;
  document.getElementById('resultGrid').innerHTML = html;

  // Tank visualization
  const fillPct = Math.min((totalNeeded / recTank) * 100, 100);
  document.getElementById('tankViz').style.setProperty('--fill', fillPct + '%');
  document.getElementById('tankLabel').textContent = `${recTank.toLocaleString()}L Tank (${Math.round(fillPct)}% used for ${backupDays}-day backup)`;

  // Standard tank options
  let opts = '';
  const nearTanks = STANDARD_TANKS.filter(s => s >= totalNeeded * 0.6 && s <= totalNeeded * 2.5).slice(0, 4);
  if (nearTanks.length === 0) nearTanks.push(recTank);
  nearTanks.forEach(s => {
    const days = (s / dailyTotal).toFixed(1);
    const active = s === recTank ? ' active' : '';
    opts += `<div class="tank-opt${active}"><div class="size">${s >= 1000 ? (s/1000) + ',000' : s}L</div><div class="desc">${days} days backup</div></div>`;
  });
  document.getElementById('tankOptions').innerHTML = opts;

  // ── Pump & Pipe ──
  var pos = document.getElementById('tankPosition').value;
  var pumpText = '';
  if (pos === 'ground') {
    var pumpHP = dailyTotal <= 1000 ? '0.5 HP' : dailyTotal <= 2000 ? '0.75 HP' : dailyTotal <= 5000 ? '1.0 HP' : '1.5 HP';
    var pipeSize = dailyTotal <= 1000 ? '\u00BD inch (15mm)' : dailyTotal <= 3000 ? '\u00BE inch (20mm)' : '1 inch (25mm)';
    pumpText = '<strong>Pump:</strong> ' + pumpHP + ' surface or submersible pump (flow rate ~30-50 L/min)<br>' +
      '<strong>Pipe:</strong> ' + pipeSize + ' PPR or HDPE from tank to building<br>' +
      '<strong>Note:</strong> Ground-level tanks need a pump to push water to overhead distribution. Consider a pressure tank for consistent pressure.';
  } else if (pos === 'elevated') {
    pumpText = '<strong>Pump:</strong> Not required (gravity-fed at ~0.1 bar per metre of height)<br>' +
      '<strong>Pipe:</strong> \u00BE inch (20mm) PPR from tank to building<br>' +
      '<strong>Stand height:</strong> Minimum 3m for adequate shower pressure. 5m+ recommended for multi-storey.';
  } else {
    pumpText = '<strong>Pump:</strong> 0.75-1.5 HP submersible or transfer pump required<br>' +
      '<strong>Note:</strong> Underground tanks protect water from heat and theft but need pumping to any point of use.';
  }
  document.getElementById('pumpText').innerHTML = pumpText;
  document.getElementById('pumpSection').style.display = '';

  // ── Tank Pricing ──
  var country = document.getElementById('country').value;
  var prices = TANK_PRICES[country];
  if (prices && prices[recTank]) {
    document.getElementById('priceText').innerHTML = '<strong>' + recTank.toLocaleString() + 'L tank:</strong> ' + prices.sym + prices[recTank].toLocaleString() + ' (approximate)<br>' +
      '<span style="font-size:.72rem;color:#94a3b8">Brands: ' + (country==='NG'?'Geepee, Sintex, Polytank, Roto':country==='KE'?'Roto, Kentank, Jumbo, Toptank':country==='ZA'?'JoJo, Nel, Ecotank':'Polytank, Duraplast') + '. Prices vary by brand and location.</span>';
    document.getElementById('priceSection').style.display = '';
  }

  // ── Multiple tank suggestion ──
  if (recTank > 10000 || totalNeeded > 10000) {
    var numTanks = Math.ceil(totalNeeded / 5000);
    document.getElementById('multiTankNote').innerHTML = '<strong>Multiple tanks recommended:</strong> Your storage need of ' + totalNeeded.toLocaleString() + 'L exceeds standard single-tank sizes. Consider ' + numTanks + ' × 5,000L tanks instead. This also provides redundancy — one tank can be cleaned while others remain in service.';
    document.getElementById('multiTankNote').style.display = '';
  } else {
    document.getElementById('multiTankNote').style.display = 'none';
  }

  // ── Rainwater Harvesting ──
  if (document.getElementById('rainwater').value === 'yes') {
    var roofArea = parseFloat(document.getElementById('roofArea').value) || 100;
    var rainfall = 1000; // default mm/year
    var catchmentLitres = Math.round(roofArea * (rainfall / 1000) * 0.8 * 1000); // 80% efficiency
    var monthlyRain = Math.round(catchmentLitres / 12);
    var pctCovered = Math.min(100, Math.round((monthlyRain / (dailyTotal * 30)) * 100));
    document.getElementById('rainText').innerHTML = '<strong>Annual catchment:</strong> ' + catchmentLitres.toLocaleString() + ' litres/year (~' + monthlyRain.toLocaleString() + ' L/month)<br>' +
      '<strong>Roof area:</strong> ' + roofArea + ' m² × ~1,000mm average rainfall × 80% efficiency<br>' +
      '<strong>Coverage:</strong> Rainwater could supply ~' + pctCovered + '% of your monthly water need.<br>' +
      '<span style="font-size:.72rem;color:#94a3b8">Actual catchment depends on local rainfall. Install first-flush diverter and filters for best water quality.</span>';
    document.getElementById('rainSection').style.display = '';
  } else {
    document.getElementById('rainSection').style.display = 'none';
  }

  document.getElementById('resultCard').style.display = 'block';
  document.getElementById('resultCard').scrollIntoView({ behavior: 'smooth', block: 'start' });
}
