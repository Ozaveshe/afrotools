// ── COUNTRY DATA ──
// Peak Sun Hours (PSH) = average daily irradiance in kWh/m²/day
const COUNTRIES = [
  // West Africa
  {code:'NG',name:'Nigeria',        flag:'🇳🇬',psh:5.0,curr:'NGN',sym:'₦',   lat:9},
  {code:'GH',name:'Ghana',          flag:'🇬🇭',psh:5.2,curr:'GHS',sym:'₵',   lat:8},
  {code:'SN',name:'Senegal',        flag:'🇸🇳',psh:5.8,curr:'XOF',sym:'CFA', lat:15},
  {code:'CI',name:"Côte d'Ivoire",  flag:'🇨🇮',psh:5.2,curr:'XOF',sym:'CFA', lat:6},
  {code:'ML',name:'Mali',           flag:'🇲🇱',psh:6.1,curr:'XOF',sym:'CFA', lat:17},
  {code:'BF',name:'Burkina Faso',   flag:'🇧🇫',psh:5.9,curr:'XOF',sym:'CFA', lat:12},
  {code:'NE',name:'Niger',          flag:'🇳🇪',psh:6.2,curr:'XOF',sym:'CFA', lat:17},
  {code:'BJ',name:'Benin',          flag:'🇧🇯',psh:5.3,curr:'XOF',sym:'CFA', lat:9},
  {code:'GM',name:'Gambia',         flag:'🇬🇲',psh:5.5,curr:'GMD',sym:'D',   lat:13},
  // Central Africa
  {code:'CM',name:'Cameroon',       flag:'🇨🇲',psh:4.9,curr:'XAF',sym:'FCFA',lat:4},
  {code:'CD',name:'DR Congo',       flag:'🇨🇩',psh:5.0,curr:'CDF',sym:'FC',  lat:-4},
  // East Africa
  {code:'KE',name:'Kenya',          flag:'🇰🇪',psh:5.5,curr:'KES',sym:'KSh', lat:-1},
  {code:'TZ',name:'Tanzania',       flag:'🇹🇿',psh:5.4,curr:'TZS',sym:'TSh', lat:-6},
  {code:'UG',name:'Uganda',         flag:'🇺🇬',psh:5.3,curr:'UGX',sym:'USh', lat:1},
  {code:'RW',name:'Rwanda',         flag:'🇷🇼',psh:5.2,curr:'RWF',sym:'RF',  lat:-2},
  {code:'ET',name:'Ethiopia',       flag:'🇪🇹',psh:5.6,curr:'ETB',sym:'Br',  lat:9},
  {code:'SD',name:'Sudan',          flag:'🇸🇩',psh:6.0,curr:'SDG',sym:'£S',  lat:15},
  {code:'DJ',name:'Djibouti',       flag:'🇩🇯',psh:6.3,curr:'DJF',sym:'Fr',  lat:12},
  // Southern Africa
  {code:'ZA',name:'South Africa',   flag:'🇿🇦',psh:5.8,curr:'ZAR',sym:'R',   lat:-29},
  {code:'ZM',name:'Zambia',         flag:'🇿🇲',psh:5.5,curr:'ZMW',sym:'K',   lat:-15},
  {code:'ZW',name:'Zimbabwe',       flag:'🇿🇼',psh:5.7,curr:'ZWL',sym:'Z$',  lat:-20},
  {code:'MW',name:'Malawi',         flag:'🇲🇼',psh:5.4,curr:'MWK',sym:'MK',  lat:-14},
  {code:'MZ',name:'Mozambique',     flag:'🇲🇿',psh:5.6,curr:'MZN',sym:'MT',  lat:-18},
  {code:'AO',name:'Angola',         flag:'🇦🇴',psh:5.3,curr:'AOA',sym:'Kz',  lat:-11},
  {code:'NA',name:'Namibia',        flag:'🇳🇦',psh:6.0,curr:'NAD',sym:'N$',  lat:-22},
  {code:'BW',name:'Botswana',       flag:'🇧🇼',psh:6.1,curr:'BWP',sym:'P',   lat:-22},
  // Island nations
  {code:'MG',name:'Madagascar',     flag:'🇲🇬',psh:5.5,curr:'MGA',sym:'Ar',  lat:-20},
  {code:'MU',name:'Mauritius',      flag:'🇲🇺',psh:4.8,curr:'MUR',sym:'Rs',  lat:-20},
  // North Africa
  {code:'EG',name:'Egypt',          flag:'🇪🇬',psh:6.2,curr:'EGP',sym:'E£',  lat:27},
  {code:'MA',name:'Morocco',        flag:'🇲🇦',psh:5.5,curr:'MAD',sym:'DH',  lat:32},
  {code:'TN',name:'Tunisia',        flag:'🇹🇳',psh:5.2,curr:'TND',sym:'DT',  lat:34},
  {code:'DZ',name:'Algeria',        flag:'🇩🇿',psh:6.0,curr:'DZD',sym:'DA',  lat:28},
  {code:'LY',name:'Libya',          flag:'🇱🇾',psh:6.5,curr:'LYD',sym:'LD',  lat:27},
];

// DOD (Depth of Discharge) by battery type
const BATT_DOD = {lead:0.5,gel:0.55,lifepo4:0.8};
const BATT_EFF = {lead:0.85,gel:0.87,lifepo4:0.97};
const BATT_CYCLES = {lead:500,gel:700,lifepo4:3500};
// Typical 100Ah 12V battery
const BATT_UNIT_WH = 1200; // 100Ah x 12V = 1200 Wh
const BASE_SYSTEM_FACTOR = 0.82; // wiring, inverter, controller and heat allowance

function numVal(id, fallback){
  const el = document.getElementById(id);
  const val = el ? parseFloat(el.value) : NaN;
  return Number.isFinite(val) ? val : fallback;
}

function textForSelect(id){
  const el = document.getElementById(id);
  return el && el.selectedOptions && el.selectedOptions[0] ? el.selectedOptions[0].textContent : '';
}

function panelAreaM2(panelW){
  if(panelW >= 520) return 2.6;
  if(panelW >= 430) return 2.25;
  if(panelW >= 380) return 2.05;
  if(panelW >= 300) return 1.75;
  return 1.55;
}

function getSiteProfile(psh, panelW, panelCount){
  const orientation = Math.max(0.5, numVal('orientationFactor', 1));
  const shade = Math.min(0.6, Math.max(0, numVal('shadeLoss', 0) / 100));
  const soiling = Math.min(0.4, Math.max(0, numVal('soilingLoss', 7) / 100));
  const performanceFactor = Math.max(0.35, BASE_SYSTEM_FACTOR * orientation * (1 - shade) * (1 - soiling));
  const roofNeeded = panelCount ? panelCount * panelAreaM2(panelW) * 1.15 : 0;
  const roofAvailable = numVal('roofArea', 0);
  return {
    orientation,
    orientationLabel: textForSelect('orientationFactor'),
    shadePct: Math.round(shade * 100),
    soilingPct: Math.round(soiling * 100),
    totalLossPct: Math.round((1 - performanceFactor) * 100),
    performanceFactor,
    effectivePsh: psh * performanceFactor,
    roofNeeded,
    roofAvailable,
    roofOk: !roofAvailable || roofAvailable >= roofNeeded
  };
}

function setBatteryMode(){
  const onGrid = document.getElementById('systemType') && document.getElementById('systemType').value === 'ongrid';
  ['battType','backupDays'].forEach(function(id){
    const el = document.getElementById(id);
    if(el) el.disabled = onGrid;
  });
}

// Default appliances
const DEFAULT_APPLIANCES = [
  {name:'LED Lights (×4)',watts:40,qty:1,hrs:6},
  {name:'Phone Chargers (×4)',watts:20,qty:1,hrs:4},
  {name:'32″ TV',watts:80,qty:1,hrs:5},
  {name:'Laptop',watts:65,qty:1,hrs:6},
  {name:'Fan (ceiling/standing)',watts:75,qty:2,hrs:8},
  {name:'Fridge (Energy Star)',watts:150,qty:1,hrs:24},
  {name:'WiFi Router',watts:15,qty:1,hrs:24},
];

// Quick load presets for common African home types
const HOME_PRESETS = [
  {label:'🏠 Small Flat', apps:[
    {name:'LED Lights (×3)',watts:30,qty:1,hrs:5},
    {name:'Standing Fan',watts:75,qty:1,hrs:8},
    {name:'32″ TV',watts:80,qty:1,hrs:5},
    {name:'Phone Chargers (×2)',watts:15,qty:1,hrs:4},
    {name:'WiFi Router',watts:15,qty:1,hrs:24},
  ]},
  {label:'👨‍👩‍👧 Family Home', apps:[
    {name:'LED Lights (×6)',watts:60,qty:1,hrs:6},
    {name:'Ceiling Fans (×2)',watts:75,qty:2,hrs:10},
    {name:'43″ Smart TV',watts:120,qty:1,hrs:6},
    {name:'Fridge (Energy Star)',watts:150,qty:1,hrs:24},
    {name:'Phone Chargers (×4)',watts:20,qty:1,hrs:4},
    {name:'Laptop',watts:65,qty:1,hrs:6},
    {name:'WiFi Router',watts:15,qty:1,hrs:24},
    {name:'Water Pump (small)',watts:500,qty:1,hrs:1},
  ]},
  {label:'🏪 Small Shop', apps:[
    {name:'LED Shop Lights (×6)',watts:60,qty:1,hrs:10},
    {name:'Ceiling Fans (×2)',watts:75,qty:2,hrs:10},
    {name:'CCTV (4 cameras)',watts:20,qty:1,hrs:24},
    {name:'POS Terminal',watts:15,qty:1,hrs:10},
    {name:'Computer / Laptop',watts:65,qty:1,hrs:8},
    {name:'Fridge (drinks)',watts:150,qty:1,hrs:24},
  ]},
  {label:'🌾 Rural Homestead', apps:[
    {name:'LED Lights (×4)',watts:40,qty:1,hrs:5},
    {name:'Radio / Small TV',watts:50,qty:1,hrs:4},
    {name:'Phone Chargers (×3)',watts:15,qty:1,hrs:3},
    {name:'Water Pump (motor)',watts:250,qty:1,hrs:2},
    {name:'Electric Kettle (1L)',watts:1000,qty:1,hrs:0.3},
  ]},
  {label:'🏢 Small Office', apps:[
    {name:'LED Lights (×8)',watts:80,qty:1,hrs:9},
    {name:'Ceiling Fans (×3)',watts:75,qty:3,hrs:9},
    {name:'Desktop PCs (×3)',watts:120,qty:3,hrs:8},
    {name:'Laser Printer',watts:400,qty:1,hrs:1},
    {name:'Router + Switch',watts:25,qty:1,hrs:24},
    {name:'CCTV (4 cameras)',watts:20,qty:1,hrs:24},
  ]},
];

let selectedCountry = COUNTRIES[0];
let appliances = JSON.parse(JSON.stringify(DEFAULT_APPLIANCES));

// ── INIT ──
(function init(){
  // Build country grid
  const grid = document.getElementById('countryGrid');
  COUNTRIES.forEach((c,i) => {
    const btn = document.createElement('button');
    btn.className = 'country-btn' + (i===0?' active':'');
    btn.dataset.code = c.code;
    btn.innerHTML = `<span class="flag">${c.flag}</span>${c.name}`;
    btn.onclick = () => selectCountry(c, btn);
    grid.appendChild(btn);
  });
  // Currency sync
  document.getElementById('currency').value = selectedCountry.curr;
  document.getElementById('systemType').addEventListener('change', setBatteryMode);
  setBatteryMode();
  showIrradiance(selectedCountry);
  renderAppliances();
  updateTotals();

  // Build preset buttons
  var presetBtnsEl = document.getElementById('presetBtns');
  HOME_PRESETS.forEach(function(p) {
    var btn = document.createElement('button');
    btn.style.cssText = 'padding:5px 10px;border:1.5px solid #e5e7eb;border-radius:6px;background:#fafafa;cursor:pointer;font-size:.72rem;font-weight:600;color:#374151;transition:all .15s;font-family:inherit;';
    btn.textContent = p.label;
    btn.onmouseover = function(){ this.style.borderColor='#ffc800'; this.style.background='#fffbeb'; };
    btn.onmouseout = function(){ this.style.borderColor='#e5e7eb'; this.style.background='#fafafa'; };
    btn.onclick = function(){ appliances = JSON.parse(JSON.stringify(p.apps)); renderAppliances(); };
    presetBtnsEl.appendChild(btn);
  });
})();

function selectCountry(c, btn){
  selectedCountry = c;
  document.querySelectorAll('.country-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  // Update currency
  const sel = document.getElementById('currency');
  const opt = [...sel.options].find(o => o.value === c.curr);
  if(opt) sel.value = c.curr;
  showIrradiance(c);
}

function showIrradiance(c){
  const badge = document.getElementById('irrBadge');
  const val = document.getElementById('irrVal');
  let quality = c.psh >= 6 ? '☀️☀️ Exceptional' : c.psh >= 5.5 ? '☀️ Very Good' : c.psh >= 5 ? '☀️ Good' : '⛅ Moderate';
  const tilt = Math.min(35, Math.abs(c.lat || 5) + 10);
  const facing = (c.lat || 0) < 0 ? 'north-facing' : 'south-facing';
  val.textContent = `${c.name}: ${c.psh} PSH/day - ${quality} · Tilt panels ${tilt}° ${facing}`;
  badge.style.display = 'inline-flex';
}

// ── APPLIANCES ──
function renderAppliances(){
  const tbody = document.getElementById('applianceBody');
  tbody.innerHTML = '';
  appliances.forEach((app, i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input type="text" value="${app.name}" onchange="appliances[${i}].name=this.value" style="width:100%;padding:5px 8px;border:1.5px solid #e5e7eb;border-radius:6px;font-size:.82rem;background:#fafafa;" aria-label="Appliance name"></td>
      <td><input aria-label="Appliance watts" type="number" class="appliance-qty" value="${app.watts}" onchange="appliances[${i}].watts=+this.value;updateTotals()"></td>
      <td><input aria-label="Appliance quantity" type="number" class="appliance-qty" value="${app.qty}" onchange="appliances[${i}].qty=+this.value;updateTotals()"></td>
      <td><input aria-label="Appliance hours per day" type="number" class="appliance-qty" value="${app.hrs}" onchange="appliances[${i}].hrs=+this.value;updateTotals()"></td>
      <td><button type="button" class="appliance-del" onclick="removeAppliance(${i})" aria-label="Remove appliance">✕</button></td>
    `;
    tbody.appendChild(tr);
  });
  updateTotals();
}

function addAppliance(){
  appliances.push({name:'New Appliance',watts:0,qty:1,hrs:0});
  renderAppliances();
}

function removeAppliance(i){
  appliances.splice(i,1);
  renderAppliances();
}

function getTotals(){
  let totalWh = 0, peakW = 0;
  appliances.forEach(a => {
    totalWh += a.watts * a.qty * a.hrs;
    peakW += a.watts * a.qty;
  });
  return {totalWh, peakW};
}

function updateTotals(){
  const {totalWh, peakW} = getTotals();
  const buf = totalWh * 1.25;
  document.getElementById('totalWh').textContent = formatNum(totalWh) + ' Wh';
  document.getElementById('peakW').textContent = formatNum(peakW) + ' W';
  document.getElementById('totalWhBuffer').textContent = formatNum(Math.round(buf)) + ' Wh';
}

// ── CALCULATE ──
function calculate(){
  const {totalWh, peakW} = getTotals();
  if(totalWh === 0){ alert('Please add some appliances first.'); return; }

  const psh = selectedCountry.psh;
  const panelW = +document.getElementById('panelWatts').value;
  const battType = document.getElementById('battType').value;
  const backupDays = +document.getElementById('backupDays').value;
  const degradation = +document.getElementById('degradation').value / 100;
  const genCost = +document.getElementById('genCost').value || 0;
  const curr = document.getElementById('currency').value;
  const currSym = [...document.getElementById('currency').options].find(o=>o.value===curr)?.text.split(' ')[1] || '';
  const systemType = document.getElementById('systemType').value;
  const needsBattery = systemType !== 'ongrid';

  // Build a PVWatts-style derating profile from site inputs.
  const firstPassSite = getSiteProfile(psh, panelW, 0);
  const sharedSizing = window.SolarCalculatorEngine.calculate({
    appliances: appliances.map(function(item){return {name:item.name,watts:item.watts,qty:item.qty,hoursPerDay:item.hrs};}),
    sunHours: psh, panelWatts: panelW, batteryType: battType, backupDays: backupDays,
    systemType: systemType, orientationFactor: numVal('orientationFactor',1),
    shadeLossPct: numVal('shadeLoss',0), soilingLossPct: numVal('soilingLoss',7),
    roofArea: numVal('roofArea',0), monthlyGeneratorCost: genCost, usdRate: 1
  });
  if(sharedSizing.error){ alert('Please check the appliance load and site assumptions.'); return; }

  // ── PANELS ──
  // Panel kWp needed = daily Wh needed / derated peak sun hours.
  const panelKW = sharedSizing.arrayKwp;
  const numPanels = sharedSizing.panels;
  const actualKWp = sharedSizing.arrayKwp;
  const siteProfile = Object.assign(getSiteProfile(psh, panelW, numPanels), {
    effectivePsh: sharedSizing.effectiveSunHours,
    roofNeeded: sharedSizing.roofNeeded,
    roofAvailable: sharedSizing.roofAvailable,
    roofOk: sharedSizing.roofOk,
    totalLossPct: sharedSizing.lossPercent
  });

  // ── BATTERIES ──
  const dod = BATT_DOD[battType];
  const eff = BATT_EFF[battType];
  // Battery bank stores the actual daily AC load for the autonomy period.
  // Panel-side losses (soiling, shade, orientation) size the array, not the
  // battery, so use the real load and let round-trip efficiency (eff) and
  // depth of discharge (dod) carry the storage derate.
  const battKWhNeeded = sharedSizing.batteryKwh;
  const numBatteries = sharedSizing.batteries;
  const actualBattKWh = sharedSizing.batteryKwh;

  // ── INVERTER ──
  // Size for peak load + 20% headroom
  const invKVA = sharedSizing.inverterKva;

  // ── MPPT ──
  const mpptA = sharedSizing.mpptA;

  // ── APPROX SYSTEM COST ──
  const panelCostUSD = numPanels * sharedSizing.assumptions.panelUsd;
  const battCostUSD = numBatteries * (battType === 'lifepo4' ? 280 : 90);
  const invCostUSD = invKVA * sharedSizing.assumptions.inverterUsdPerKva;
  const totalCostUSD = sharedSizing.systemCostUsd;

  // ── ROI ──
  const monthlyGenCost = sharedSizing.monthlyGeneratorCost;
  const annualGenCost = sharedSizing.annualGeneratorCost;

  // Currency conversion (rough)
  const USD_RATES = {
    NGN:1600,KES:130,GHS:15,ZAR:19,UGX:3800,TZS:2700,EGP:50,ETB:110,
    RWF:1300,XOF:620,XAF:620,ZMW:26,ZWL:350,MWK:1700,MZN:64,AOA:850,
    SDG:600,MAD:10,TND:3.1,GMD:68,CDF:2800,DJF:178,NAD:19,BWP:13.5,
    MGA:4600,MUR:46,DZD:135,LYD:4.8,USD:1
  };
  const rate = USD_RATES[curr] || 1;
  const sysLocalCost = totalCostUSD * rate;
  window.__solarLatest = {
    country: selectedCountry.name,
    currency: curr,
    currencySymbol: currSym,
    totalWh: totalWh,
    peakW: peakW,
    systemType: systemType,
    panelWatts: panelW,
    panels: numPanels,
    arrayKwp: actualKWp,
    batteries: numBatteries,
    batteryType: battType,
    batteryKwh: actualBattKWh,
    inverterKva: invKVA,
    mpptA: mpptA,
    effectiveSunHours: siteProfile.effectivePsh,
    roofNeeded: siteProfile.roofNeeded,
    systemCostLocal: sysLocalCost,
    monthlyGeneratorCost: monthlyGenCost,
    annualGeneratorCost: annualGenCost,
    lossPercent: siteProfile.totalLossPct,
    generatedAt: new Date().toISOString()
  };

  // ── UPDATE UI ──
  document.getElementById('rPanels').textContent = numPanels;
  document.getElementById('rBatteries').textContent = numBatteries;
  document.getElementById('rInverter').textContent = invKVA + ' kVA';
  document.getElementById('rPanelKW').innerHTML = actualKWp.toFixed(1) + ' <span>kWp</span>';
  document.getElementById('rBattKWh').innerHTML = actualBattKWh.toFixed(1) + ' <span>kWh</span>';
  document.getElementById('rEffSun').innerHTML = siteProfile.effectivePsh.toFixed(1) + ' <span>h</span>';
  document.getElementById('rRoofArea').innerHTML = Math.ceil(siteProfile.roofNeeded) + ' <span>m2</span>';

  // Savings
  if(monthlyGenCost > 0){
    const annualSaving = annualGenCost;
    const payback = sysLocalCost / annualSaving;
    document.getElementById('rMonthlySave').textContent = currSym + formatNum(monthlyGenCost);
    document.getElementById('rSavingsCard').style.display = '';
  } else {
    document.getElementById('rSavingsCard').style.display = 'none';
  }

  // Diagram
  document.getElementById('diagPanels').textContent = numPanels + ' × ' + panelW + 'W';
  document.getElementById('diagMPPT').textContent = mpptA + 'A MPPT';
  document.getElementById('diagBatt').textContent = needsBattery ? actualBattKWh.toFixed(1) + ' kWh' : 'Grid-tie only';
  document.getElementById('diagInv').textContent = invKVA + ' kVA';
  document.getElementById('diagLoad').textContent = (totalWh/1000).toFixed(1) + ' kWh/d';

  // ROI Table
  buildROITable(sysLocalCost, annualGenCost, curr, currSym, degradation, rate);

  // Specs
  buildSpecs(numPanels, panelW, actualKWp, numBatteries, battType, actualBattKWh, invKVA, mpptA, siteProfile, systemType);

  // Tips
  buildTips(selectedCountry, systemType, battType, numPanels, invKVA, siteProfile);
  buildSiteQA(siteProfile, systemType, totalWh, peakW);

  document.getElementById('resultsSection').style.display = 'block';
  setSolarExportStatus('Solar sizing ready. Copy or download the plan before requesting quotes.');
  document.getElementById('resultsSection').scrollIntoView({behavior:'smooth',block:'start'});
}

function buildROITable(sysCost, annualGen, curr, sym, degradation, rate){
  const tbody = document.getElementById('roiTableBody');
  tbody.innerHTML = '';
  const roiChart = document.getElementById('roiChart');
  roiChart.innerHTML = '<div style="font-size:.75rem;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.06em;margin-bottom:12px;">10-Year Cumulative Cost Comparison</div>';

  let solarCum = sysCost;
  let genCum = 0;
  // Annual maintenance ~2% of system cost
  const annualMaint = sysCost * 0.02;
  const maxBar = (annualGen * 10);

  for(let y=1; y<=10; y++){
    genCum += annualGen;
    solarCum += annualMaint;
    const saving = genCum - solarCum;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>Year ${y}</td>
      <td>${sym}${formatNum(Math.round(solarCum))}</td>
      <td>${sym}${formatNum(Math.round(genCum))}</td>
      <td class="${saving>0?'positive':'neutral'}">${saving>0?'Saved ':'Loss '}${sym}${formatNum(Math.abs(Math.round(saving)))}</td>
    `;
    tbody.appendChild(tr);

    // Chart bar (years 1,3,5,7,10)
    if([1,3,5,7,10].includes(y)){
      const barWrap = document.createElement('div');
      barWrap.className = 'roi-bar-wrap';
      const solarPct = Math.min(100, (solarCum/maxBar)*100);
      const genPct = Math.min(100, (genCum/maxBar)*100);
      barWrap.innerHTML = `
        <div class="roi-bar-label">Year ${y}</div>
        <div style="flex:1;">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
            <div style="width:60px;font-size:.68rem;color:#6b7280;">Solar</div>
            <div class="roi-bar-outer" style="flex:1;"><div class="roi-bar-inner" style="width:${solarPct}%;background:linear-gradient(90deg,#fbbf24,#f59e0b);"><span class="roi-val">${sym}${formatNum(Math.round(solarCum))}</span></div></div>
          </div>
          <div style="display:flex;align-items:center;gap:6px;">
            <div style="width:60px;font-size:.68rem;color:#6b7280;">Generator</div>
            <div class="roi-bar-outer" style="flex:1;"><div class="roi-bar-inner" style="width:${genPct}%;background:linear-gradient(90deg,#ef4444,#dc2626);"><span class="roi-val">${sym}${formatNum(Math.round(genCum))}</span></div></div>
          </div>
        </div>
      `;
      roiChart.appendChild(barWrap);
    }
  }
}

function buildSpecs(nPanels, pW, kWp, nBatt, bType, bKWh, invKVA, mpptA, site, sysType){
  const battNames = {lead:'Lead-Acid FLA (100Ah/12V)',gel:'Gel VRLA (100Ah/12V)',lifepo4:'LiFePO4 Lithium (100Ah/12V)'};
  const invRecs = invKVA <= 2 ? 'Victron Phoenix / Axpert 2kVA' : invKVA <= 5 ? 'Victron MultiPlus / Axpert 5kVA' : 'Victron Quattro / Deye 8kVA';
  const specs = [
    ['Solar Panels', `${nPanels} × ${pW}W = ${kWp.toFixed(1)} kWp`, pW>=400?'Mono PERC or Half-Cut preferred':'Mono PERC recommended'],
    ['Effective Sun', `${site.effectivePsh.toFixed(1)} peak sun hours after losses`, `${site.totalLossPct}% combined loss from wiring, heat, direction, shade and dust`],
    ['Roof Area', `${Math.ceil(site.roofNeeded)} m2 recommended`, site.roofOk ? 'Entered roof area is enough or was left blank' : `Needs about ${Math.ceil(site.roofNeeded - site.roofAvailable)} m2 more usable roof`],
    ['Battery Bank', sysType==='ongrid' ? 'No battery bank for grid-tied mode' : `${nBatt} × ${battNames[bType]}`, sysType==='ongrid' ? 'Add batteries only if backup is required' : (bType==='lifepo4'?'Best ROI long-term (3,500+ cycles)':'Consider upgrading to LiFePO4')],
    ['Battery Total', `${bKWh.toFixed(1)} kWh usable`, sysType==='ongrid' ? 'Grid-tied systems rely on grid export or self-consumption' : 'Wire batteries in series/parallel for 24V or 48V bank'],
    ['Inverter/Charger', `${invKVA} kVA`, invRecs],
    ['MPPT Controller', `${mpptA}A`, 'Victron SmartSolar or EPever MPPT'],
    ['DC Cable (Panels→MPPT)', `Panels in series → MPPT input`, '6mm² or 10mm² DC solar cable (TÜV certified)'],
    ['AC Cable (Inv→DB)', `AC distribution board`, '6mm² for runs under 10m, 10mm² for longer'],
    ['Mounting', `Roof/ground mount`, (function(){ const tilt = Math.min(35, Math.abs(selectedCountry.lat||5)+10); const dir = (selectedCountry.lat||0)<0?'north':'south'; return `Tilt ${tilt}° ${dir}-facing for ${selectedCountry.name}. Fixed mount on IBR/concrete roof.`; })()],
  ];

  const tbody = document.getElementById('specsBody');
  tbody.innerHTML = '';
  specs.forEach(([comp,spec,rec]) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td style="font-weight:700;">${comp}</td><td style="color:#2563EB;font-weight:600;">${spec}</td><td>${rec}</td>`;
    tbody.appendChild(tr);
  });
}

function buildTips(country, sysType, battType, nPanels, invKVA, site){
  const tips = [
    `<strong>☀️ ${country.name} Solar Tips:</strong> With ${country.psh} peak sun hours/day, ${country.name} has excellent solar potential. Dry season produces more energy - plan your battery bank for the rainy season.`,
    `<strong>Site Losses:</strong> This run uses ${site.totalLossPct}% combined loss and ${site.effectivePsh.toFixed(1)} effective sun hours/day. Reduce shade and dust before buying extra panels.`,
    `<strong>Roof Check:</strong> Plan about ${Math.ceil(site.roofNeeded)} m2 of usable roof for ${nPanels} panels. ${site.roofOk ? 'Your roof area input does not show a space problem.' : 'Your entered roof area is too small for this array.'}`,
    `<strong>🔋 Battery Tip:</strong> ${battType==='lifepo4'?'LiFePO4 is the right choice - 3,500+ cycles means 10-year life with proper care. Charge to 90% daily max, not 100%.':'Consider upgrading to LiFePO4 lithium batteries when budget allows. They last 5-7× longer than lead-acid.'}`,
    `<strong>⚡ Inverter Sizing:</strong> Your ${invKVA}kVA inverter handles normal loads. Avoid running high-surge devices (AC units, water pumps, welders) simultaneously. Motor loads have 3-6× surge current at startup.`,
    `<strong>🌡️ Heat Management:</strong> Solar panels lose efficiency above 25°C. In tropical African climates, derate by 15-20%. Ensure 10-15cm air gap below panels for cooling.`,
    `<strong>🔧 Maintenance Schedule:</strong> Clean panels monthly with a soft cloth and water. Check cable connections quarterly. Test battery voltage monthly. Professional inspection annually.`,
    `<strong>📋 Installation Note:</strong> Use a certified solar installer - improper wiring is a fire risk. In Nigeria (NEMSA), Kenya (ERC), Ghana (ECG) - always get a certified system inspection.`,
  ];

  const sysNotes = {
    offgrid: `<strong>🏠 Off-Grid Mode:</strong> You are fully independent from the utility grid. Size your battery bank generously - ${Math.round(+document.getElementById('backupDays').value)} days of autonomy during cloudy periods.`,
    hybrid: `<strong>🔌 Hybrid Mode:</strong> Your solar charges batteries first, uses grid as backup. This is ideal for most African cities - you get solar savings while maintaining grid reliability.`,
    ongrid: `<strong>🔄 On-Grid (Grid-Tied):</strong> No battery needed. Feed excess power back to the grid if your utility allows net metering. Check with your DISCO/utility about connection requirements.`,
  };
  tips.push(sysNotes[sysType]);

  document.getElementById('tipsContent').innerHTML = tips.map(t => `<div class="info-box" style="margin-bottom:10px;">${t}</div>`).join('');
}

// ── TABS ──
function buildSiteQA(site, sysType, totalWh, peakW){
  const cards = [
    ['PVWatts-style derate', `${site.totalLossPct}% total loss. Direction: ${site.orientationLabel || 'Best facing roof'}, shade: ${site.shadePct}%, dust: ${site.soilingPct}%.`],
    ['Load discipline', `${(totalWh/1000).toFixed(1)} kWh/day and ${formatNum(peakW)} W peak. Move irons, kettles, welders and pumps to grid or generator unless the inverter is sized for surge.`],
    ['Roof fit', site.roofAvailable ? `${Math.ceil(site.roofAvailable)} m2 entered, ${Math.ceil(site.roofNeeded)} m2 needed. ${site.roofOk ? 'Space looks workable.' : 'Reduce loads, use higher watt panels or split the array.'}` : `Enter usable roof area to catch space problems before quoting. Estimate now: ${Math.ceil(site.roofNeeded)} m2.`],
    ['System mode', sysType === 'ongrid' ? 'Grid-tied mode skips batteries. Confirm net metering, anti-islanding protection and utility approval.' : 'Backup mode includes batteries. Confirm ventilation, cable protection, fuses and safe battery location.'],
    ['Installer handoff', 'Ask for string layout, isolators, earthing, breaker schedule, battery datasheet, inverter surge rating and warranty terms.']
  ];
  const target = document.getElementById('siteQaContent');
  if(!target) return;
  target.innerHTML = cards.map(function(card){
    return `<div class="site-qa-card"><strong>${card[0]}</strong><span>${card[1]}</span></div>`;
  }).join('');
}

function showTab(id){
  document.querySelectorAll('.result-tab').forEach((t,i) => {
    const panes = ['roi','specs','tips','site'];
    t.classList.toggle('active', panes[i]===id);
  });
  document.querySelectorAll('.tab-pane').forEach(p => {
    p.classList.toggle('active', p.id==='tab-'+id);
  });
}

// ── UTIL ──
function solarPlanText(){
  const d = window.__solarLatest;
  if(!d) return '';
  return [
    'AfroTools solar sizing plan',
    'Country: ' + d.country,
    'Daily load: ' + (d.totalWh/1000).toFixed(1) + ' kWh',
    'Peak load: ' + Math.round(d.peakW).toLocaleString('en') + ' W',
    'System mode: ' + d.systemType,
    'Panels: ' + d.panels + ' x ' + d.panelWatts + 'W (' + d.arrayKwp.toFixed(1) + ' kWp)',
    'Battery bank: ' + d.batteries + ' batteries, approx ' + d.batteryKwh.toFixed(1) + ' kWh (' + d.batteryType + ')',
    'Inverter: ' + d.inverterKva + ' kVA',
    'MPPT: ' + d.mpptA + 'A',
    'Effective sun: ' + d.effectiveSunHours.toFixed(1) + ' hours after ' + d.lossPercent + '% losses',
    'Roof area needed: ' + Math.ceil(d.roofNeeded) + ' m2',
    'Estimated system cost: ' + d.currencySymbol + formatNum(Math.round(d.systemCostLocal)),
    'Monthly generator cost entered: ' + d.currencySymbol + formatNum(Math.round(d.monthlyGeneratorCost)),
    '',
    'Planning estimate only. Confirm final design, roof shade, protection, utility rules, FX, pricing, and warranty terms with a certified installer.'
  ].join('\n');
}

function copySolarPlan(){
  if(!window.__solarLatest){setSolarExportStatus('Run the solar calculator first.');return}
  const text = solarPlanText();
  const done = () => setSolarExportStatus('Solar plan copied.');
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(text).then(done).catch(()=>{window.prompt('Copy solar plan', text);done();});
  } else {
    window.prompt('Copy solar plan', text);
    done();
  }
}

function downloadSolarCsv(){
  const d = window.__solarLatest;
  if(!d){setSolarExportStatus('Run the solar calculator first.');return}
  const rows = [
    ['Field','Value'],
    ['Country', d.country],
    ['Daily load kWh', (d.totalWh/1000).toFixed(2)],
    ['Peak load W', Math.round(d.peakW)],
    ['System mode', d.systemType],
    ['Panels', d.panels],
    ['Panel watts', d.panelWatts],
    ['Array kWp', d.arrayKwp.toFixed(2)],
    ['Batteries', d.batteries],
    ['Battery type', d.batteryType],
    ['Battery kWh', d.batteryKwh.toFixed(2)],
    ['Inverter kVA', d.inverterKva],
    ['MPPT amps', d.mpptA],
    ['Effective sun hours', d.effectiveSunHours.toFixed(2)],
    ['Roof area m2', Math.ceil(d.roofNeeded)],
    ['System cost local', Math.round(d.systemCostLocal)],
    ['Currency', d.currency],
    ['Monthly generator cost', Math.round(d.monthlyGeneratorCost)]
  ];
  const csv = rows.map(row=>row.map(cell=>'"'+String(cell).replace(/"/g,'""')+'"').join(',')).join('\n');
  const blob = new Blob([csv], { type:'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'solar-sizing-plan.csv';
  a.dataset.noPdfGate = 'true';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(()=>URL.revokeObjectURL(a.href),1500);
  setSolarExportStatus('CSV downloaded.');
}

function setSolarExportStatus(message){
  const el = document.getElementById('solarExportStatus');
  if(el) el.textContent = message;
}
function formatNum(n){ return n.toLocaleString('en'); }
