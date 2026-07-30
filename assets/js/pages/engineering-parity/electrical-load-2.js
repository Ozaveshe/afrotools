/* ── Appliance Library ── */
var APPLIANCES = {
  'Lighting': [
    {name:'LED Bulb',w:10},{name:'Fluorescent Tube (36W)',w:36},{name:'Security Light',w:100},{name:'Recessed Downlight',w:15},{name:'Floodlight (exterior)',w:50}
  ],
  'Kitchen': [
    {name:'Refrigerator',w:150},{name:'Freezer (chest)',w:200},{name:'Microwave',w:1000},{name:'Electric Cooker',w:2000},{name:'Electric Kettle',w:2200},{name:'Blender',w:400},{name:'Toaster',w:800},{name:'Rice Cooker',w:700}
  ],
  'Cooling': [
    {name:'Standing Fan',w:75},{name:'Ceiling Fan',w:60},{name:'AC 1HP (split)',w:750},{name:'AC 1.5HP (split)',w:1120},{name:'AC 2HP (split)',w:1500},{name:'AC 2.5HP (split)',w:1900}
  ],
  'Heating': [
    {name:'Water Heater (geyser)',w:2000},{name:'Immersion Heater',w:3000},{name:'Electric Iron',w:1000},{name:'Room Heater',w:1500}
  ],
  'Entertainment': [
    {name:'TV (LED 43")',w:100},{name:'TV (LED 55")',w:150},{name:'Home Theatre System',w:300},{name:'DSTV / Decoder',w:30},{name:'Gaming Console',w:200},{name:'Sound Bar',w:60}
  ],
  'Office': [
    {name:'Laptop',w:65},{name:'Desktop Computer',w:300},{name:'Printer',w:500},{name:'Router / Modem',w:15},{name:'Monitor',w:40},{name:'UPS (small)',w:150}
  ],
  'Laundry': [
    {name:'Washing Machine',w:500},{name:'Tumble Dryer',w:2500},{name:'Iron',w:1000}
  ],
  'Power Tools': [
    {name:'Angle Grinder',w:800},{name:'Electric Drill',w:600},{name:'Welding Machine',w:3000},{name:'Circular Saw',w:1200}
  ],
  'Water': [
    {name:'Borehole Pump (0.75kW)',w:750},{name:'Borehole Pump (1.5kW)',w:1500},{name:'Borehole Pump (2.2kW)',w:2200},{name:'Pressure Pump',w:370}
  ],
  'Other': [
    {name:'Phone Charger',w:15},{name:'Hair Dryer',w:1500},{name:'CCTV Camera',w:15},{name:'Gate Motor',w:200},{name:'Electric Fence Energiser',w:100}
  ]
};

var rowId = 0;
var appList = document.getElementById('applianceList');
var lastElectricalLoad = null;

function addRow(name, watts, qty, hrs) {
  var id = rowId++;
  var div = document.createElement('div');
  div.className = 'app-row';
  div.id = 'row-' + id;
  div.innerHTML = '<input aria-label="Appliance" type="text" value="' + (name||'') + '" placeholder="Appliance" style="font-weight:600">' +
    '<input aria-label="W" type="number" value="' + (watts||'') + '" min="1" placeholder="W">' +
    '<input type="number" value="' + (qty||1) + '" min="1" max="50" aria-label="Input value">' +
    '<input type="number" value="' + (hrs||8) + '" min="0.5" max="24" step="0.5" aria-label="Input value">' +
    '<button type="button" class="remove-btn" onclick="this.parentElement.remove()">X</button>';
  appList.appendChild(div);
}

function addCustomRow() { addRow('', '', 1, 8); }

/* ── Quick Add Buttons ── */
var quickAdd = document.getElementById('quickAdd');
Object.keys(APPLIANCES).forEach(function(cat) {
  APPLIANCES[cat].forEach(function(a) {
    var btn = document.createElement('button');
    btn.className = 'btn-sm';
    btn.textContent = a.name + ' (' + a.w + 'W)';
    btn.style.fontSize = '.65rem';
    btn.onclick = function() { addRow(a.name, a.w, 1, 8); };
    quickAdd.appendChild(btn);
  });
});

/* ── Presets ── */
function loadHomePreset() {
  appList.innerHTML = ''; rowId = 0;
  addRow('LED Bulb', 10, 8, 6);
  addRow('Ceiling Fan', 60, 4, 10);
  addRow('TV (LED 43")', 100, 1, 6);
  addRow('Refrigerator', 150, 1, 24);
  addRow('AC 1.5HP', 1120, 2, 8);
  addRow('Washing Machine', 500, 1, 1);
  addRow('Water Pump', 750, 1, 2);
  addRow('Electric Iron', 1000, 1, 0.5);
  addRow('Microwave', 1000, 1, 0.5);
  addRow('Phone Charger', 15, 4, 3);
  addRow('Router / Modem', 15, 1, 24);
  addRow('DSTV / Decoder', 30, 1, 8);
}

function loadOfficePreset() {
  appList.innerHTML = ''; rowId = 0;
  addRow('LED Panel Light', 36, 12, 10);
  addRow('AC 2HP', 1500, 3, 10);
  addRow('Desktop Computer', 300, 8, 10);
  addRow('Monitor', 40, 8, 10);
  addRow('Printer', 500, 2, 2);
  addRow('Router / Modem', 15, 2, 24);
  addRow('Water Dispenser', 100, 1, 12);
  addRow('Refrigerator', 150, 1, 24);
  addRow('Microwave', 1000, 1, 0.5);
  addRow('Security Camera', 15, 4, 24);
}

function resetAll() {
  appList.innerHTML = ''; rowId = 0;
  document.getElementById('resultCard').style.display = 'none';
  addRow('', '', 1, 8);
}

function updateCountry() {
  // No-op for now, country data is embedded in select options
}

/* ── Calculate ── */
function calculate() {
  var opt = document.getElementById('country').options[document.getElementById('country').selectedIndex];
  var voltage = parseFloat(opt.dataset.v);
  var phases = parseInt(document.getElementById('phase').value);
  var divFactor = parseFloat(document.getElementById('diversity').value);
  var tariff = parseFloat(opt.dataset.tariff);
  var currSym = opt.dataset.sym;
  var rows = document.querySelectorAll('.app-row');

  var totalWatts = 0, monthlyKwh = 0;
  var catTotals = {};
  rows.forEach(function(row) {
    var inputs = row.querySelectorAll('input');
    var name = inputs[0].value || 'Unknown';
    var watts = parseFloat(inputs[1].value) || 0;
    var qty = parseInt(inputs[2].value) || 1;
    var hrs = parseFloat(inputs[3].value) || 0;
    var itemWatts = watts * qty;
    totalWatts += itemWatts;
    monthlyKwh += (itemWatts * hrs * 30) / 1000;
    // Categorise for chart
    var cat = 'Other';
    Object.keys(APPLIANCES).forEach(function(c) {
      APPLIANCES[c].forEach(function(a) { if (name.toLowerCase().includes(a.name.toLowerCase().split(' ')[0].toLowerCase())) cat = c; });
    });
    catTotals[cat] = (catTotals[cat] || 0) + itemWatts;
  });

  var demandWatts = totalWatts * divFactor;
  var totalKW = totalWatts / 1000;
  var demandKW = demandWatts / 1000;

  var amps;
  if (phases === 1) {
    amps = demandWatts / voltage;
  } else {
    amps = demandWatts / (voltage * 1.732);
  }

  // Breaker
  var breakerSizes = [6, 10, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125, 160];
  var breaker = breakerSizes[breakerSizes.length - 1];
  for (var i = 0; i < breakerSizes.length; i++) {
    if (breakerSizes[i] >= amps * 1.25) { breaker = breakerSizes[i]; break; }
  }

  // Cable
  var cable = '25mm²+';
  if (amps <= 15) cable = '1.5mm²';
  else if (amps <= 20) cable = '2.5mm²';
  else if (amps <= 30) cable = '4.0mm²';
  else if (amps <= 40) cable = '6.0mm²';
  else if (amps <= 60) cable = '10mm²';
  else if (amps <= 80) cable = '16mm²';
  else if (amps <= 100) cable = '25mm²';

  // Generator (kVA = kW / 0.8 power factor × 1.25 safety margin)
  var genKVA = Math.ceil((demandKW / 0.8) * 1.25);
  var genSizes = [2.5, 3.5, 5, 6.5, 8, 10, 12.5, 15, 20, 25, 30, 40, 50, 60, 80, 100];
  var recGen = genSizes[genSizes.length - 1];
  for (var j = 0; j < genSizes.length; j++) {
    if (genSizes[j] >= genKVA) { recGen = genSizes[j]; break; }
  }

  // Monthly cost
  var monthlyCost = Math.round(monthlyKwh * tariff);
  lastElectricalLoad = {
    country: opt.textContent.trim(),
    voltage: voltage,
    phases: phases,
    diversity: divFactor,
    tariff: tariff,
    currencySymbol: currSym,
    appliances: Array.from(rows).map(function(row){
      var inputs = row.querySelectorAll('input');
      var watts = parseFloat(inputs[1].value) || 0;
      var qty = parseInt(inputs[2].value) || 1;
      var hrs = parseFloat(inputs[3].value) || 0;
      return {
        name: inputs[0].value || 'Unknown',
        watts: watts,
        quantity: qty,
        hoursPerDay: hrs,
        connectedWatts: watts * qty,
        monthlyKwh: (watts * qty * hrs * 30) / 1000
      };
    }),
    totalKW: totalKW,
    demandKW: demandKW,
    amps: amps,
    breaker: breaker,
    cable: cable,
    generatorKva: recGen,
    monthlyKwh: monthlyKwh,
    monthlyCost: monthlyCost,
    recommendation: recTitle + ': ' + recText
  };

  // Results grid
  var html = '';
  html += '<div class="result-box"><div class="num">' + totalKW.toFixed(1) + ' kW</div><div class="lbl">Total Connected</div></div>';
  html += '<div class="result-box"><div class="num">' + demandKW.toFixed(1) + ' kW</div><div class="lbl">Demand Load (' + Math.round(divFactor*100) + '%)</div></div>';
  html += '<div class="result-box"><div class="num">' + amps.toFixed(1) + ' A</div><div class="lbl">Current Draw</div></div>';
  html += '<div class="result-box"><div class="num">' + breaker + 'A</div><div class="lbl">Main Breaker</div></div>';
  html += '<div class="result-box"><div class="num">' + cable + '</div><div class="lbl">Main Cable</div></div>';
  html += '<div class="result-box green"><div class="num">' + recGen + ' kVA</div><div class="lbl">Min. Generator</div></div>';
  document.getElementById('resultGrid').innerHTML = html;

  // Load distribution bars
  var maxCat = Math.max.apply(null, Object.values(catTotals).concat([1]));
  var barColors = {Lighting:'#fbbf24',Kitchen:'#ef4444',Cooling:'#3b82f6',Heating:'#f97316',Entertainment:'#8b5cf6',Office:'#06b6d4',Laundry:'#ec4899',Water:'#0ea5e9','Power Tools':'#64748b',Other:'#94a3b8'};
  var barsHtml = '';
  Object.keys(catTotals).sort(function(a,b){return catTotals[b]-catTotals[a];}).forEach(function(cat) {
    var pct = (catTotals[cat] / totalWatts * 100).toFixed(0);
    var color = barColors[cat] || '#94a3b8';
    barsHtml += '<div class="load-bar-row"><span class="load-bar-label">' + cat + '</span><div class="load-bar-wrap"><div class="load-bar" style="width:' + pct + '%;background:' + color + '"><span>' + (catTotals[cat]/1000).toFixed(1) + 'kW (' + pct + '%)</span></div></div></div>';
  });
  document.getElementById('loadBars').innerHTML = '<h4 style="font-size:.82rem;font-weight:700;margin-bottom:8px">Load Distribution</h4>' + barsHtml;

  // Recommendation
  var recClass = 'green', recTitle = 'Single Phase Adequate', recText = '';
  if (demandKW > 13 && phases === 1) {
    recClass = 'red';
    recTitle = 'Three Phase Required';
    recText = 'Your demand load of ' + demandKW.toFixed(1) + ' kW exceeds single-phase capacity (~13 kW). Apply for three-phase supply.';
  } else if (demandKW > 8 && phases === 1) {
    recClass = 'amber';
    recTitle = 'Approaching Single Phase Limit';
    recText = 'Your demand load of ' + demandKW.toFixed(1) + ' kW is high for single phase. Consider three-phase if adding more appliances.';
  } else {
    recText = 'Your demand load of ' + demandKW.toFixed(1) + ' kW is within ' + (phases === 1 ? 'single' : 'three') + '-phase capacity. Use a ' + breaker + 'A main breaker with ' + cable + ' cable.';
  }
  document.getElementById('recommendation').innerHTML = '<div class="rec-card ' + recClass + '"><h3>' + recTitle + '</h3><p>' + recText + '</p></div>';

  // Generator section
  document.getElementById('genSection').innerHTML = '<div class="cost-note"><strong>Generator recommendation:</strong> Minimum ' + recGen + ' kVA generator for your ' + demandKW.toFixed(1) + ' kW demand load (includes 25% margin for motor starting surges). Popular sizes in Africa: Sumec Firman, Mikano, Mantrac/CAT, Elepaq.<br><a href="/tools/generator-fuel/" style="color:#1E40AF;font-weight:700">Calculate fuel costs →</a></div>';

  // Monthly cost
  document.getElementById('costSection').innerHTML = '<div class="cost-note" style="margin-top:10px"><strong>Estimated monthly electricity:</strong> ' + Math.round(monthlyKwh) + ' kWh × ' + currSym + tariff + '/kWh = <strong>' + currSym + monthlyCost.toLocaleString() + '/month</strong><br><span style="font-size:.72rem;color:#64748b">Based on appliance wattages × daily usage hours × 30 days. Actual cost varies by tariff band and provider.</span></div>';

  // Safety warnings
  var warns = '';
  if (totalKW > 20 && phases === 1) warns += '<p>Your total connected load exceeds 20 kW on single phase. This is unsafe and could cause cable overheating and fire.</p>';
  if (amps > 100) warns += '<p>Current draw exceeds 100A. Ensure your main cable and distribution board are rated for this load. Consult a licensed electrician.</p>';
  document.getElementById('warnings').innerHTML = warns ? '<div class="warning"><strong>Safety Warning:</strong>' + warns + '</div>' : '';

  document.getElementById('resultCard').style.display = 'block';
  var status = document.getElementById('electricalStatus');
  if(status) status.textContent = 'Load analysis ready. Copy the brief or download CSV before asking an electrician to verify.';
  document.getElementById('resultCard').scrollIntoView({behavior:'smooth'});
}

function shareResult() {
  var grid = document.getElementById('resultGrid');
  var text = 'Electrical Load Analysis:\n' + grid.textContent.replace(/\s+/g, ' ').trim() + '\nCalculated with AfroTools\nhttps://afrotools.com/tools/electrical-load/';
  if (navigator.share) { navigator.share({title:'Electrical Load | AfroTools',text:text}).catch(function(){}); }
  else { navigator.clipboard.writeText(text).then(function(){alert('Copied!');}); }
}

function ensureElectricalLoad(){
  if(!lastElectricalLoad) calculate();
  return lastElectricalLoad;
}

function electricalBriefText(){
  var r = ensureElectricalLoad();
  if(!r) return '';
  return [
    'AfroTools electrical load brief',
    'Country/standard profile: '+r.country,
    'Supply: '+r.voltage+'V, '+(r.phases===1?'single phase':'three phase')+', diversity '+Math.round(r.diversity*100)+'%',
    'Connected load: '+r.totalKW.toFixed(1)+' kW; demand load: '+r.demandKW.toFixed(1)+' kW; current draw: '+r.amps.toFixed(1)+' A',
    'Recommended main breaker: '+r.breaker+'A; main cable: '+r.cable+'; minimum generator: '+r.generatorKva+' kVA',
    'Estimated monthly use: '+Math.round(r.monthlyKwh)+' kWh; estimated monthly cost: '+r.currencySymbol+r.monthlyCost.toLocaleString(),
    'Top loads: '+r.appliances.filter(function(a){return a.connectedWatts>0;}).sort(function(a,b){return b.connectedWatts-a.connectedWatts;}).slice(0,5).map(function(a){return a.name+' '+a.connectedWatts+'W';}).join('; '),
    'Safety note: confirm wiring, earthing, breaker coordination, phase, load balancing, RCDs, generator surge, and local code compliance with a licensed electrician.'
  ].join('\n');
}

function copyElectricalBrief(){
  var text = electricalBriefText();
  var status = document.getElementById('electricalStatus');
  if(!text) return;
  if(navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(function(){ if(status) status.textContent = 'Electrical load brief copied.'; }).catch(function(){ if(status) status.textContent = text; });
  } else if(status) status.textContent = text;
}

function downloadElectricalCsv(){
  var r = ensureElectricalLoad();
  var status = document.getElementById('electricalStatus');
  if(!r) return;
  var rows = [
    ['appliance','watts','quantity','hours_per_day','connected_watts','monthly_kwh']
  ];
  r.appliances.forEach(function(a){ rows.push([a.name,a.watts,a.quantity,a.hoursPerDay,a.connectedWatts,a.monthlyKwh.toFixed(2)]); });
  rows.push([]);
  rows.push(['field','value']);
  rows.push(['country_profile',r.country],['voltage',r.voltage],['phases',r.phases],['diversity_percent',Math.round(r.diversity*100)],['connected_kw',r.totalKW.toFixed(2)],['demand_kw',r.demandKW.toFixed(2)],['amps',r.amps.toFixed(2)],['main_breaker_a',r.breaker],['main_cable',r.cable],['minimum_generator_kva',r.generatorKva],['monthly_kwh',r.monthlyKwh.toFixed(2)],['monthly_cost',r.monthlyCost],['safety_note','Verify wiring, earthing, breaker coordination, phase, load balancing, RCDs, generator surge, and local code compliance.']);
  var csv = rows.map(function(row){ return row.map(function(cell){ return '"' + String(cell == null ? '' : cell).replace(/"/g,'""') + '"'; }).join(','); }).join('\n');
  var blob = new Blob([csv], {type:'text/csv;charset=utf-8'});
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'afrotools-electrical-load-schedule.csv';
  a.dataset.noPdfGate = 'true';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  if(status) status.textContent = 'CSV downloaded. Have a licensed electrician verify the final design.';
}

// Init with typical home
loadHomePreset();
