// ── COUNTRY PRICES DATA ──
// All prices in local currency per standard unit
// Updated: Q1 2025 (approximate market rates)
const COUNTRY_DATA = {
  NG:{sym:'₦',name:'Nigeria',rates:{
    cement:10000,       // per 50kg bag
    block9:350,         // per 9" block
    block6:280,         // per 6" block
    sand_m3:12000,      // per m³
    granite_m3:22000,   // per m³
    rebar_ton:680000,   // per tonne
    zinc_sheet:6500,    // per long-span 0.55mm sheet (3m)
    clay_tile:800,      // per clay roof tile
    pvc_32mm:800,       // per 6m pipe
    pvc_110mm:3500,     // per 6m pipe
    wire_25mm:1800,     // per metre
    door_wood:45000,    // per door
    door_steel:75000,   // per steel door
    window_alum:35000,  // per window
    tiles_floor:3500,   // per m²
    tiles_wall:4000,    // per m²
    paint_5L:8500,      // per 5L tin
    wc_unit:35000,      // per WC set
    shower_unit:25000,  // per shower set
    sink_kitchen:15000, // per kitchen sink
    glass_m2:8000,      // per m²
    plaster_bag:3500,   // per 25kg bag
    gravel_m3:15000,    // per m³
    inverter_kva:180000,// per 2kVA inverter
  },labourRate:0.4},

  KE:{sym:'KSh',name:'Kenya',rates:{
    cement:680,block9:35,block6:28,sand_m3:2500,granite_m3:4500,
    rebar_ton:110000,zinc_sheet:900,clay_tile:85,pvc_32mm:120,
    pvc_110mm:550,wire_25mm:280,door_wood:8000,door_steel:12000,
    window_alum:6000,tiles_floor:600,tiles_wall:700,paint_5L:1400,
    wc_unit:6000,shower_unit:4500,sink_kitchen:2500,glass_m2:1200,
    plaster_bag:550,gravel_m3:2800,inverter_kva:32000,
  },labourRate:0.35},

  GH:{sym:'₵',name:'Ghana',rates:{
    cement:90,block9:5,block6:4,sand_m3:180,granite_m3:350,
    rebar_ton:8500,zinc_sheet:85,clay_tile:8,pvc_32mm:18,
    pvc_110mm:75,wire_25mm:40,door_wood:650,door_steel:1100,
    window_alum:550,tiles_floor:55,tiles_wall:65,paint_5L:120,
    wc_unit:500,shower_unit:380,sink_kitchen:220,glass_m2:110,
    plaster_bag:55,gravel_m3:200,inverter_kva:2800,
  },labourRate:0.35},

  ZA:{sym:'R',name:'South Africa',rates:{
    cement:280,block9:7,block6:5.5,sand_m3:550,granite_m3:980,
    rebar_ton:15000,zinc_sheet:350,clay_tile:28,pvc_32mm:45,
    pvc_110mm:220,wire_25mm:120,door_wood:2200,door_steel:4500,
    window_alum:1800,tiles_floor:220,tiles_wall:260,paint_5L:350,
    wc_unit:1800,shower_unit:1400,sink_kitchen:650,glass_m2:420,
    plaster_bag:180,gravel_m3:900,inverter_kva:6500,
  },labourRate:0.45},

  // Simplified rates for other countries (USD-based estimations)
  UG:{sym:'USh',name:'Uganda',rates:{cement:185000,block9:900,block6:700,sand_m3:280000,granite_m3:520000,rebar_ton:4200000,zinc_sheet:65000,clay_tile:6500,pvc_32mm:12000,pvc_110mm:55000,wire_25mm:25000,door_wood:480000,door_steel:850000,window_alum:420000,tiles_floor:55000,tiles_wall:68000,paint_5L:62000,wc_unit:380000,shower_unit:290000,sink_kitchen:160000,glass_m2:95000,plaster_bag:48000,gravel_m3:320000,inverter_kva:1200000},labourRate:0.35},

  TZ:{sym:'TSh',name:'Tanzania',rates:{cement:28000,block9:1200,block6:950,sand_m3:55000,granite_m3:120000,rebar_ton:2200000,zinc_sheet:15000,clay_tile:1500,pvc_32mm:4500,pvc_110mm:22000,wire_25mm:9000,door_wood:180000,door_steel:320000,window_alum:160000,tiles_floor:22000,tiles_wall:28000,paint_5L:24000,wc_unit:145000,shower_unit:115000,sink_kitchen:62000,glass_m2:38000,plaster_bag:18000,gravel_m3:72000,inverter_kva:480000},labourRate:0.35},

  RW:{sym:'RF',name:'Rwanda',rates:{cement:12000,block9:500,block6:400,sand_m3:25000,granite_m3:55000,rebar_ton:1050000,zinc_sheet:8000,clay_tile:750,pvc_32mm:2200,pvc_110mm:10000,wire_25mm:4200,door_wood:85000,door_steel:150000,window_alum:75000,tiles_floor:9500,tiles_wall:12000,paint_5L:11000,wc_unit:68000,shower_unit:52000,sink_kitchen:29000,glass_m2:17000,plaster_bag:8200,gravel_m3:32000,inverter_kva:220000},labourRate:0.35},

  ET:{sym:'Br',name:'Ethiopia',rates:{cement:900,block9:22,block6:17,sand_m3:1800,granite_m3:3800,rebar_ton:85000,zinc_sheet:650,clay_tile:55,pvc_32mm:180,pvc_110mm:820,wire_25mm:340,door_wood:6500,door_steel:12000,window_alum:5800,tiles_floor:750,tiles_wall:900,paint_5L:820,wc_unit:5200,shower_unit:3900,sink_kitchen:2200,glass_m2:1400,plaster_bag:620,gravel_m3:2600,inverter_kva:16000},labourRate:0.35},

  SN:{sym:'CFA',name:'Senegal',rates:{cement:8500,block9:220,block6:175,sand_m3:18000,granite_m3:38000,rebar_ton:920000,zinc_sheet:7500,clay_tile:680,pvc_32mm:2200,pvc_110mm:9500,wire_25mm:3800,door_wood:95000,door_steel:165000,window_alum:82000,tiles_floor:10500,tiles_wall:13000,paint_5L:12500,wc_unit:75000,shower_unit:58000,sink_kitchen:32000,glass_m2:19000,plaster_bag:9000,gravel_m3:35000,inverter_kva:250000},labourRate:0.38},

  CI:{sym:'CFA',name:'Côte d\'Ivoire',rates:{cement:8200,block9:210,block6:165,sand_m3:17000,granite_m3:36000,rebar_ton:880000,zinc_sheet:7200,clay_tile:650,pvc_32mm:2100,pvc_110mm:9200,wire_25mm:3600,door_wood:90000,door_steel:158000,window_alum:78000,tiles_floor:10000,tiles_wall:12500,paint_5L:12000,wc_unit:72000,shower_unit:55000,sink_kitchen:30000,glass_m2:18000,plaster_bag:8600,gravel_m3:33000,inverter_kva:240000},labourRate:0.38},

  CM:{sym:'FCFA',name:'Cameroon',rates:{cement:8000,block9:200,block6:158,sand_m3:16000,granite_m3:35000,rebar_ton:860000,zinc_sheet:7000,clay_tile:640,pvc_32mm:2000,pvc_110mm:8800,wire_25mm:3500,door_wood:88000,door_steel:155000,window_alum:76000,tiles_floor:9500,tiles_wall:12000,paint_5L:11500,wc_unit:70000,shower_unit:53000,sink_kitchen:29000,glass_m2:17500,plaster_bag:8200,gravel_m3:32000,inverter_kva:235000},labourRate:0.38},

  ZM:{sym:'K',name:'Zambia',rates:{cement:120,block9:5.5,block6:4.2,sand_m3:280,granite_m3:580,rebar_ton:17000,zinc_sheet:420,clay_tile:38,pvc_32mm:55,pvc_110mm:270,wire_25mm:145,door_wood:2800,door_steel:5200,window_alum:2400,tiles_floor:280,tiles_wall:340,paint_5L:420,wc_unit:2200,shower_unit:1700,sink_kitchen:820,glass_m2:520,plaster_bag:220,gravel_m3:1100,inverter_kva:8200},labourRate:0.38},

  ZW:{sym:'USD',name:'Zimbabwe',rates:{cement:18,block9:0.45,block6:0.35,sand_m3:45,granite_m3:90,rebar_ton:1800,zinc_sheet:22,clay_tile:2.5,pvc_32mm:4.5,pvc_110mm:22,wire_25mm:12,door_wood:220,door_steel:420,window_alum:195,tiles_floor:22,tiles_wall:28,paint_5L:35,wc_unit:180,shower_unit:140,sink_kitchen:65,glass_m2:42,plaster_bag:18,gravel_m3:85,inverter_kva:680},labourRate:0.4},

  EG:{sym:'E£',name:'Egypt',rates:{cement:3200,block9:22,block6:17,sand_m3:900,granite_m3:1800,rebar_ton:55000,zinc_sheet:850,clay_tile:75,pvc_32mm:95,pvc_110mm:480,wire_25mm:220,door_wood:4500,door_steel:8500,window_alum:4200,tiles_floor:550,tiles_wall:680,paint_5L:780,wc_unit:4200,shower_unit:3200,sink_kitchen:1800,glass_m2:880,plaster_bag:420,gravel_m3:1800,inverter_kva:18000},labourRate:0.35},

  MA:{sym:'DH',name:'Morocco',rates:{cement:120,block9:4.5,block6:3.5,sand_m3:180,granite_m3:380,rebar_ton:9500,zinc_sheet:220,clay_tile:18,pvc_32mm:28,pvc_110mm:140,wire_25mm:68,door_wood:1800,door_steel:3500,window_alum:1600,tiles_floor:180,tiles_wall:220,paint_5L:320,wc_unit:1400,shower_unit:1100,sink_kitchen:580,glass_m2:320,plaster_bag:85,gravel_m3:680,inverter_kva:7200},labourRate:0.38},
};

// ── BUILD TYPE PRESETS ──
const BUILD_PRESETS = {
  res1:{area:60,doors:3,windows:5,wc:1,showers:1,sinks:1,beds:1},
  res2:{area:90,doors:4,windows:7,wc:2,showers:2,sinks:1,beds:2},
  res3:{area:120,doors:5,windows:8,wc:2,showers:2,sinks:1,beds:3},
  res4:{area:160,doors:7,windows:10,wc:3,showers:3,sinks:1,beds:4},
  res5:{area:220,doors:9,windows:14,wc:4,showers:4,sinks:1,beds:5},
  comm:{area:100,doors:4,windows:10,wc:2,showers:0,sinks:1,beds:0},
  warehouse:{area:200,doors:3,windows:6,wc:1,showers:1,sinks:1,beds:0},
  custom:{area:0,doors:4,windows:8,wc:2,showers:2,sinks:1,beds:3},
};

document.getElementById('buildType').onchange = function(){
  const p = BUILD_PRESETS[this.value]||BUILD_PRESETS.res3;
  if(p.area>0) document.getElementById('floorArea').value=p.area;
  document.getElementById('numDoors').value=p.doors;
  document.getElementById('numWindows').value=p.windows;
  document.getElementById('numWC').value=p.wc;
  document.getElementById('numShowers').value=p.showers;
  document.getElementById('numSinks').value=p.sinks;
  document.getElementById('numBeds').value=p.beds;
};

function updateCurrency(){
  const code = document.getElementById('country').value;
  // auto-set socket values based on country norm
}

function toggleSection(id, btn){
  const sec = document.getElementById(id);
  sec.classList.toggle('open');
  btn.classList.toggle('active');
}

// ── GENERATE ──
function generate(){
  const countryCode = document.getElementById('country').value;
  const cd = COUNTRY_DATA[countryCode];
  if(!cd){showBoqError('Country data not available', 'country');return;}
  const r = cd.rates;
  const sym = cd.sym;

  const A = +document.getElementById('floorArea').value; // m²
  const floors = +document.getElementById('floors').value;
  const wallH = +document.getElementById('wallHeight').value;
  const wallType = document.getElementById('wallType').value;
  const roofType = document.getElementById('roofType').value;
  const finishing = document.getElementById('finishing').value;
  const cont = +document.getElementById('contingency').value;

  const numDoors = +document.getElementById('numDoors').value;
  const numWindows = +document.getElementById('numWindows').value;
  const numGlazed = +document.getElementById('numGlazed').value;
  const numWC = +document.getElementById('numWC').value;
  const numShowers = +document.getElementById('numShowers').value;
  const numSinks = +document.getElementById('numSinks').value;
  const numBeds = +document.getElementById('numBeds').value;
  const numSockets = +document.getElementById('numSockets').value;
  const inverterYN = +document.getElementById('inverterYN').value;
  const invalidField = [
    ['floorArea', A > 0],
    ['floors', floors > 0],
    ['wallHeight', wallH > 0],
    ['contingency', cont >= 0 && cont <= 100],
    ['numDoors', numDoors >= 0],
    ['numWindows', numWindows >= 0],
    ['numGlazed', numGlazed >= 0],
    ['numWC', numWC >= 0],
    ['numShowers', numShowers >= 0],
    ['numSinks', numSinks >= 0],
    ['numBeds', numBeds >= 0],
    ['numSockets', numSockets >= 0]
  ].find((entry) => !entry[1]);
  if(invalidField){
    showBoqError('Enter valid positive dimensions and quantities before generating the BOQ.', invalidField[0]);
    return;
  }

  // ── CALCULATIONS ──
  const perimeter = Math.sqrt(A) * 4;
  const wallArea = perimeter * wallH * floors;
  const blockKey = wallType === 'block9' ? 'block9' : 'block6';
  // Standard block covers ~0.1m² of wall
  const blocksPerM2 = 10;
  const wallOpenings = (numDoors * 2 + numWindows * 1.5); // subtract door+window openings
  const netWallArea = wallArea - wallOpenings;

  // Foundation: strip foundation volume = perimeter × 0.45m wide × 0.9m deep
  const foundVol = perimeter * 0.45 * 0.9;

  // ── BOQ SECTIONS ──
  const sections = [
    {
      name: 'A. SUBSTRUCTURE (Foundation)',
      items: [
        {desc:'Excavation for strip foundation',unit:'m³',qty:foundVol*1.2,rate:0,note:'Labour only'},
        {desc:'Hardcore fill (150mm compacted)',unit:'m³',qty:A*0.15,rate:r.gravel_m3,note:'Sub-base'},
        {desc:'Cement (1:2:4 blinding, 50mm)',unit:'bags',qty:Math.round(A*0.1),rate:r.cement,note:'Mass concrete'},
        {desc:'9" blocks for foundation walls',unit:'blocks',qty:Math.round(perimeter*1.2*blocksPerM2),rate:r[blockKey],note:'Foundation walling'},
        {desc:'Portland Cement (mortar)',unit:'bags',qty:Math.round(A*0.15),rate:r.cement,note:'Foundation mortar'},
        {desc:'Sharp Sand',unit:'m³',qty:(A*0.15).toFixed(1),rate:r.sand_m3,note:''},
        {desc:'Reinforcement steel (Y10, Y12)',unit:'kg',qty:Math.round(A*8),rate:r.rebar_ton/1000,note:'Foundation RC'},
      ]
    },
    {
      name: 'B. SUPERSTRUCTURE (Walls)',
      items: [
        {desc:`${wallType==='block9'?'9"':'6"'} hollow block (walls)`,unit:'blocks',qty:Math.round(netWallArea*blocksPerM2*floors),rate:r[blockKey],note:'All floors'},
        {desc:'Portland Cement (wall mortar)',unit:'bags',qty:Math.round(netWallArea*0.15*floors),rate:r.cement,note:'1:6 mortar'},
        {desc:'Sharp Sand (wall mortar)',unit:'m³',qty:(netWallArea*0.04*floors).toFixed(1),rate:r.sand_m3,note:''},
        {desc:'Ring beam steel (Y12)',unit:'kg',qty:Math.round(perimeter*floors*4.5),rate:r.rebar_ton/1000,note:'Per floor ring beam'},
        {desc:'Ring beam formwork + concrete',unit:'m run',qty:Math.round(perimeter*floors),rate:r.cement*1.2,note:'Estimated'},
      ]
    },
    {
      name: 'C. ROOF',
      items: roofType === 'zinc' ? [
        {desc:'Long-span aluminium zinc sheet (0.55mm)',unit:'sheets',qty:Math.round(A*1.2/3.6),rate:r.zinc_sheet,note:'3.6m sheet, 10% overlap'},
        {desc:'Hardwood rafters (50×100mm)',unit:'pcs',qty:Math.round(A*0.5),rate:r.door_wood*0.04,note:'3m spans'},
        {desc:'Ceiling board (PVC or hardboard)',unit:'sheets',qty:Math.round(A/2.88),rate:r.paint_5L*2,note:'1200×2400mm sheets'},
        {desc:'Roofing screws (with washers)',unit:'boxes',qty:Math.round(A/25),rate:r.paint_5L*0.3,note:'Per 100 box'},
        {desc:'Ridge cap / flashing',unit:'m run',qty:Math.round(perimeter/4*1.2),rate:r.zinc_sheet*0.3,note:''},
      ] : roofType === 'concrete' ? [
        {desc:'Reinforcement steel (Y12 slab)',unit:'kg',qty:Math.round(A*12),rate:r.rebar_ton/1000,note:'2-way slab'},
        {desc:'Portland Cement (slab concrete)',unit:'bags',qty:Math.round(A*0.55),rate:r.cement,note:'1:2:4 mix'},
        {desc:'Sharp Sand',unit:'m³',qty:(A*0.12).toFixed(1),rate:r.sand_m3,note:''},
        {desc:'Granite aggregate',unit:'m³',qty:(A*0.15).toFixed(1),rate:r.granite_m3,note:'3/4" granite'},
        {desc:'Formwork (plywood + props)',unit:'m²',qty:Math.round(A*1.05),rate:r.paint_5L*1.5,note:'Slab soffit'},
      ] : [
        {desc:'Clay roof tiles',unit:'pcs',qty:Math.round(A*12),rate:r.clay_tile,note:'10% wastage'},
        {desc:'Hardwood rafters & battens',unit:'pcs',qty:Math.round(A*0.6),rate:r.door_wood*0.04,note:''},
        {desc:'Ridge tiles',unit:'pcs',qty:Math.round(perimeter/4*5),rate:r.clay_tile*1.5,note:''},
        {desc:'Roofing felt / membrane',unit:'m²',qty:Math.round(A*1.1),rate:r.glass_m2*0.3,note:'Underlay'},
      ]
    },
    {
      name: 'D. DOORS & WINDOWS',
      items: [
        {desc:'Wooden panel doors (900×2100mm)',unit:'units',qty:numDoors,rate:r.door_wood,note:'Standard internal'},
        {desc:'Steel security door (main entrance)',unit:'units',qty:Math.max(1,Math.round(numDoors*0.2)),rate:r.door_steel,note:'Front + back'},
        {desc:'Aluminium sliding window (1500×1200mm)',unit:'units',qty:numWindows,rate:r.window_alum,note:'Standard casement'},
        {desc:'Glazed entrance door',unit:'units',qty:numGlazed,rate:r.door_steel*0.7,note:''},
        {desc:'Door frames (hardwood)',unit:'sets',qty:numDoors,rate:r.door_wood*0.15,note:''},
        {desc:'Door hardware (hinges, locks, handles)',unit:'sets',qty:numDoors+numWindows,rate:r.paint_5L*0.8,note:'Per set'},
      ]
    },
    {
      name: 'E. FINISHES',
      items: [
        {desc:'Render/plaster (interior walls)',unit:'bags',qty:Math.round(netWallArea*0.12),rate:r.plaster_bag||r.cement*0.8,note:'2-coat plaster'},
        {desc:'Floor tiles (600×600mm)',unit:'m²',qty:Math.round(A*(finishing==='basic'?0:1)*1.1+A*(finishing==='basic'?0.5:0)),rate:r.tiles_floor,note:'10% wastage'},
        {desc:'Floor tiles (600×600mm) – all areas',unit:'m²',qty:finishing!=='basic'?Math.round(A*1.1):0,rate:r.tiles_floor,note:''},
        {desc:'Plain screed (where no tiles)',unit:'m²',qty:finishing==='basic'?Math.round(A):0,rate:r.cement*0.4,note:'50mm screeded floor'},
        {desc:'Wall tiles – wet areas (200×300mm)',unit:'m²',qty:Math.round((numWC+numShowers)*8),rate:r.tiles_wall,note:'Bathrooms + kitchen'},
        {desc:'Emulsion paint – interior',unit:'tins',qty:Math.round(netWallArea/20),rate:r.paint_5L,note:'5L tins, 2 coats'},
        {desc:'Gloss/trim paint – doors + windows',unit:'tins',qty:Math.round((numDoors+numWindows)/4),rate:r.paint_5L*1.2,note:''},
        {desc:'Tile adhesive (25kg bags)',unit:'bags',qty:finishing!=='basic'?Math.round(A*0.5):Math.round((numWC+numShowers)*4),rate:r.plaster_bag||r.cement,note:''},
        {desc:'Tile grout (5kg bags)',unit:'bags',qty:finishing!=='basic'?Math.round(A*0.2):Math.round((numWC+numShowers)*2),rate:(r.plaster_bag||r.cement)*0.6,note:''},
      ]
    },
    {
      name: 'F. PLUMBING',
      items: [
        {desc:'WC suite (pan, cistern, seat)',unit:'sets',qty:numWC,rate:r.wc_unit,note:''},
        {desc:'Shower set (tray, mixer, head)',unit:'sets',qty:numShowers,rate:r.shower_unit,note:''},
        {desc:'Kitchen sink (stainless, double bowl)',unit:'units',qty:numSinks,rate:r.sink_kitchen,note:''},
        {desc:'PVC waste pipe 110mm',unit:'m',qty:Math.round((numWC+numShowers+numSinks)*5),rate:r.pvc_110mm/6,note:''},
        {desc:'PVC water supply pipe 32mm',unit:'m',qty:Math.round(perimeter*0.8*floors),rate:r.pvc_32mm/6,note:''},
        {desc:'Overhead water tank (1000L)',unit:'units',qty:1,rate:r.sink_kitchen*4,note:'Polyethylene'},
        {desc:'Ball float valve + fittings',unit:'set',qty:1,rate:r.sink_kitchen*0.5,note:''},
        {desc:'Water pump (0.5HP)',unit:'unit',qty:1,rate:r.wc_unit*1.5,note:'Booster pump'},
      ]
    },
    {
      name: 'G. ELECTRICAL',
      items: [
        {desc:'2.5mm² electrical wire',unit:'m',qty:Math.round(A*(numBeds||3)*2.5),rate:r.wire_25mm,note:'Ring main'},
        {desc:'1.5mm² lighting wire',unit:'m',qty:Math.round(A*1.5),rate:r.wire_25mm*0.7,note:'Lighting circuit'},
        {desc:'Socket outlets (double)',unit:'pcs',qty:(numBeds||3)*numSockets,rate:r.paint_5L*0.5,note:''},
        {desc:'Light switches (single)',unit:'pcs',qty:Math.round((numBeds+3)*1.5),rate:r.paint_5L*0.3,note:''},
        {desc:'Distribution board (8-way MCB)',unit:'unit',qty:1,rate:r.door_wood*0.8,note:'Consumer unit'},
        {desc:'MCB circuit breakers (various)',unit:'pcs',qty:8,rate:r.paint_5L*0.6,note:''},
        {desc:'Conduit (PVC 20mm)',unit:'m',qty:Math.round(A*3),rate:r.wire_25mm*0.3,note:''},
        ...(inverterYN?[{desc:'Inverter/UPS (2kVA) + battery',unit:'set',qty:1,rate:r.inverter_kva,note:'Backup power'}]:[]),
        {desc:'Earth rod + earth wire',unit:'set',qty:1,rate:r.paint_5L*1.5,note:'Earthing system'},
      ]
    },
  ];

  // ── BUILD TABLE ──
  let allItems = [];
  let totalMat = 0;
  let tableHTML = '<table class="boq-table"><thead><tr><th>#</th><th>Description</th><th class="right">Qty</th><th>Unit</th><th class="right">Rate ('+cd.sym+')</th><th class="right">Amount ('+cd.sym+')</th><th>Notes</th></tr></thead><tbody>';

  let rowNum = 1;
  sections.forEach(sec => {
    tableHTML += `<tr class="section-row"><td colspan="7">${sec.name}</td></tr>`;
    sec.items.forEach(item => {
      if(!item.qty || item.qty==0) return;
      const amt = item.rate > 0 ? Math.round(item.rate * (+item.qty)) : 0;
      if(amt > 0) totalMat += amt;
      allItems.push({...item, amount:amt});
      tableHTML += `<tr>
        <td style="color:#9ca3af;">${rowNum++}</td>
        <td style="font-weight:600;">${item.desc}</td>
        <td class="right">${(+item.qty).toLocaleString()}</td>
        <td>${item.unit}</td>
        <td class="right">${item.rate>0?fmtN(item.rate):'—'}</td>
        <td class="right" style="color:${amt>0?'#2563EB':'#9ca3af'};">${amt>0?fmtN(amt):'Labour'}</td>
        <td style="color:#9ca3af;font-size:.72rem;">${item.note||''}</td>
      </tr>`;
    });
  });

  const labourCost = Math.round(totalMat * cd.labourRate);
  const subtotal = totalMat + labourCost;
  const contAmt = Math.round(subtotal * cont / 100);
  const grandTotal = subtotal + contAmt;

  tableHTML += `<tr class="total-row">
    <td colspan="5" style="font-weight:900;">MATERIAL SUBTOTAL</td>
    <td class="right">${sym}${fmtN(totalMat)}</td><td></td>
  </tr>
  <tr style="border-bottom:1px solid #e5e7eb;">
    <td colspan="5" style="font-weight:700;">Labour (${Math.round(cd.labourRate*100)}% of materials)</td>
    <td class="right">${sym}${fmtN(labourCost)}</td><td></td>
  </tr>
  <tr class="total-row">
    <td colspan="5" style="font-weight:900;font-size:1rem;">GRAND TOTAL (incl. Labour + ${cont}% Contingency)</td>
    <td class="right" style="font-size:1.1rem;">${sym}${fmtN(grandTotal)}</td><td></td>
  </tr>`;

  tableHTML += '</tbody></table>';

  // Update UI
  document.getElementById('priceNote').innerHTML=`📅 Prices based on ${cd.name} Q1 2025 market rates. Verify with local suppliers before finalising. Exchange rates may vary.`;
  document.getElementById('sumTotal').textContent=sym+fmtN(totalMat);
  document.getElementById('sumLabour').textContent=sym+fmtN(labourCost);
  document.getElementById('sumGrand').textContent=sym+fmtN(subtotal);
  document.getElementById('contPct').textContent=cont;
  document.getElementById('contAmt').textContent=sym+fmtN(contAmt);
  document.getElementById('boqTableWrap').innerHTML=tableHTML;

  document.getElementById('placeholderCard').style.display='none';
  document.getElementById('resultsCard').style.display='block';
  document.getElementById('resultsCard').scrollIntoView({behavior:'smooth',block:'start'});

  // Store for CSV export
  window._boqExportData = {sections, allItems, totalMat, labourCost, subtotal, contAmt, grandTotal, sym, countryCode, cd};
}

function showBoqError(message, fieldId){
  const results = document.getElementById('resultsCard');
  const placeholder = document.getElementById('placeholderCard');
  const note = document.getElementById('priceNote');
  placeholder.style.display='none';
  results.style.display='block';
  note.setAttribute('role','alert');
  note.textContent=message;
  document.getElementById('boqTableWrap').innerHTML='';
  window._boqExportData = null;
  const field = document.getElementById(fieldId);
  if(field){field.setAttribute('aria-invalid','true');field.focus();}
}

function exportCSV(){
  if(!window._boqExportData){generate();}
  const {allItems,totalMat,labourCost,subtotal,contAmt,grandTotal,sym,cd} = window._boqExportData;
  let csv='Item,Description,Qty,Unit,Rate ('+sym+'),Amount ('+sym+'),Notes\n';
  allItems.forEach((item,i)=>{
    csv+=`${i+1},"${item.desc}",${+item.qty},${item.unit},${item.rate||0},${item.amount||0},"${item.note||''}"\n`;
  });
  csv+=`,,,,Materials Total,${totalMat},\n`;
  csv+=`,,,,Labour,${labourCost},\n`;
  csv+=`,,,,Subtotal,${subtotal},\n`;
  csv+=`,,,,Contingency,${contAmt},\n`;
  csv+=`,,,,GRAND TOTAL,${grandTotal},\n`;

  const a=document.createElement('a');
  a.download='boq-'+cd.name.replace(/\s/g,'-').toLowerCase()+'.csv';
  a.href='data:text/csv;charset=utf-8,'+encodeURIComponent(csv);
  a.click();
}

function fmtN(n){return Math.round(n).toLocaleString('en');}
