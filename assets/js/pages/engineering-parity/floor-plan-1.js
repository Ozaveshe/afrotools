/* -- Cost Data (per m2 in local currency) by city, finish quality -- */
var COSTS = {
  lagos:    {sym:'\u20A6',curr:'NGN',economy:180000,standard:280000,premium:420000,luxury:650000,labor:0.35},
  abuja:    {sym:'\u20A6',curr:'NGN',economy:200000,standard:300000,premium:450000,luxury:700000,labor:0.35},
  nairobi:  {sym:'KSh ',curr:'KES',economy:35000,standard:55000,premium:85000,luxury:130000,labor:0.30},
  mombasa:  {sym:'KSh ',curr:'KES',economy:30000,standard:48000,premium:75000,luxury:115000,labor:0.30},
  joburg:   {sym:'R',curr:'ZAR',economy:8000,standard:12000,premium:18000,luxury:28000,labor:0.30},
  capetown: {sym:'R',curr:'ZAR',economy:9000,standard:14000,premium:21000,luxury:32000,labor:0.30},
  accra:    {sym:'GHS ',curr:'GHS',economy:4000,standard:6500,premium:10000,luxury:15000,labor:0.30},
  kumasi:   {sym:'GHS ',curr:'GHS',economy:3500,standard:5500,premium:8500,luxury:13000,labor:0.30},
  dar:      {sym:'TSh ',curr:'TZS',economy:600000,standard:950000,premium:1400000,luxury:2200000,labor:0.30},
  cairo:    {sym:'E\u00A3',curr:'EGP',economy:12000,standard:18000,premium:28000,luxury:45000,labor:0.25}
};

/* Type multipliers (duplex costs more per m2 than bungalow) */
var TYPE_MULT = {bungalow:1.0, duplex:1.15, storey:1.2, apartment:1.1, commercial:1.25};

var SITE_FACTORS = {
  easy: {mult:1.00, label:'Easy urban access', risk:0, note:'Normal access and storage assumed.'},
  tight: {mult:1.06, label:'Tight urban plot', risk:1, note:'Adds waste, handling, and logistics friction.'},
  difficult: {mult:1.12, label:'Weak soil or slope', risk:2, note:'Allows more for foundations and temporary works.'},
  remote: {mult:1.15, label:'Remote or rainy access', risk:2, note:'Adds transport, weather, and idle-time risk.'}
};

var STAGE_PROFILE = {
  concept: {label:'Concept budget', confidence:42, range:'-25% to +35%', risk:2},
  design: {label:'Measured design', confidence:62, range:'-15% to +25%', risk:1},
  tender: {label:'Tender-ready BOQ', confidence:78, range:'-10% to +15%', risk:0},
  quote: {label:'Contractor quote', confidence:84, range:'-8% to +12%', risk:0}
};

/* Building works percentages before separate scope allowances */
var BREAKDOWN = [
  {cat:'Foundation & Substructure', pct:0.16},
  {cat:'Walls & Blockwork', pct:0.13},
  {cat:'Concrete Frame, Columns, Beams, Slabs', pct:0.12},
  {cat:'Roofing', pct:0.10},
  {cat:'Doors & Windows', pct:0.08},
  {cat:'Floor Finishes', pct:0.09},
  {cat:'Wall Finishes & Painting', pct:0.07},
  {cat:'Plumbing & Drainage', pct:0.08},
  {cat:'Electrical Installation', pct:0.07},
  {cat:'Kitchen, Bath, Fixtures, Sundries', pct:0.10}
];

/* -- Rooms -- */
var rooms = [];

function suggestRooms() {
  var type = document.getElementById('buildType').value;
  rooms = [];
  if (type === 'bungalow') {
    rooms = [{name:'Living Room',w:5,l:5},{name:'Master Bedroom',w:4,l:4},{name:'Bedroom 2',w:3.5,l:3.5},{name:'Bedroom 3',w:3.5,l:3.5},{name:'Kitchen',w:3,l:3},{name:'Bathroom',w:2.5,l:2},{name:'Toilet',w:1.5,l:1.5},{name:'Corridor',w:6,l:1.5}];
  } else if (type === 'duplex') {
    rooms = [{name:'Living Room',w:5.5,l:5},{name:'Dining',w:4,l:3.5},{name:'Kitchen',w:3.5,l:3},{name:'Master Bedroom',w:4.5,l:4},{name:'Bedroom 2',w:3.5,l:3.5},{name:'Bedroom 3',w:3.5,l:3.5},{name:'Bedroom 4',w:3.5,l:3},{name:'Master Bath',w:3,l:2.5},{name:'Bathroom 2',w:2.5,l:2},{name:'Toilet (GF)',w:1.5,l:1.5},{name:'Staircase',w:3,l:1.5},{name:'Corridor',w:8,l:1.5}];
  } else if (type === 'commercial') {
    rooms = [{name:'Reception',w:6,l:4},{name:'Open Office',w:10,l:8},{name:'Manager Office',w:4,l:4},{name:'Meeting Room',w:5,l:4},{name:'Kitchenette',w:3,l:2.5},{name:'Server Room',w:3,l:2},{name:'Toilet Block',w:4,l:3},{name:'Corridor',w:10,l:2}];
  } else {
    rooms = [{name:'Living Room',w:5,l:5},{name:'Master Bedroom',w:4,l:4},{name:'Bedroom 2',w:3.5,l:3.5},{name:'Kitchen',w:3,l:3},{name:'Bathroom',w:2.5,l:2},{name:'Corridor',w:5,l:1.5}];
  }
  renderRooms();
}

function renderRooms() {
  var grid = document.getElementById('roomGrid');
  var totalArea = 0;
  grid.innerHTML = rooms.map(function(r, i) {
    var area = r.w * r.l;
    totalArea += area;
    return '<div class="room-card"><div class="room-name">' + r.name + '</div><div class="room-dim">' + r.w + ' x ' + r.l + ' m</div><div class="room-area">' + area.toFixed(1) + ' m2</div><button type="button" onclick="removeRoom(' + i + ')" style="font-size:.68rem;color:#dc2626;border:none;background:none;cursor:pointer;margin-top:4px">Remove</button></div>';
  }).join('');
  document.getElementById('totalArea').textContent = totalArea.toFixed(0) + ' m2';
  // Pre-fill add room inputs
  var sel = document.getElementById('addRoomType');
  var parts = sel.value.split(',');
  document.getElementById('addRoomW').value = parts[1];
  document.getElementById('addRoomL').value = parts[2];
}

function addRoom() {
  var sel = document.getElementById('addRoomType');
  var name = sel.value.split(',')[0];
  var w = parseFloat(document.getElementById('addRoomW').value) || 3;
  var l = parseFloat(document.getElementById('addRoomL').value) || 3;
  rooms.push({name: name, w: w, l: l});
  renderRooms();
}

function removeRoom(i) { rooms.splice(i, 1); renderRooms(); }

// Update add-room dimensions when room type changes
document.getElementById('addRoomType').addEventListener('change', function() {
  var parts = this.value.split(',');
  document.getElementById('addRoomW').value = parts[1];
  document.getElementById('addRoomL').value = parts[2];
});

function numVal(id, fallback) {
  var el = document.getElementById(id);
  var value = el ? parseFloat(el.value) : NaN;
  return Number.isFinite(value) ? value : fallback;
}

function selectText(id) {
  var el = document.getElementById(id);
  if (!el || el.selectedIndex < 0) return '';
  return el.options[el.selectedIndex].text.replace(/\s+/g, ' ').trim();
}

function money(c, value) {
  return c.sym + Math.round(value).toLocaleString();
}

function getScope() {
  var stageKey = document.getElementById('projectStage').value;
  var siteKey = document.getElementById('siteDifficulty').value;
  var stage = STAGE_PROFILE[stageKey] || STAGE_PROFILE.concept;
  var site = SITE_FACTORS[siteKey] || SITE_FACTORS.easy;
  return {
    stageKey: stageKey,
    stage: stage,
    siteKey: siteKey,
    site: site,
    preliminariesPct: numVal('preliminariesPct', 8) / 100,
    externalWorksPct: numVal('externalWorksPct', 10) / 100,
    professionalFeesPct: numVal('professionalFeesPct', 12) / 100,
    contingencyPct: numVal('contingencyPct', 15) / 100,
    escalationPct: numVal('escalationPct', 0) / 100,
    shellAllowancePct: numVal('shellAllowancePct', 18) / 100
  };
}

function renderConfidence(scope, totalArea, grossArea, totalCost, c) {
  var confidence = Math.max(30, Math.min(90,
    scope.stage.confidence -
    scope.site.risk * 7 -
    Math.max(0, scope.contingencyPct - 0.10) * 60 +
    (totalArea >= 80 ? 4 : -4)
  ));
  document.getElementById('confidenceFill').style.width = confidence + '%';
  document.getElementById('estimateSummary').innerHTML =
    '<div><span>Estimate Stage</span><strong>' + scope.stage.label + '</strong></div>' +
    '<div><span>Expected Range</span><strong>' + scope.stage.range + '</strong></div>' +
    '<div><span>Gross Floor Area</span><strong>' + grossArea.toFixed(0) + ' m2</strong></div>' +
    '<div><span>Confidence</span><strong>' + confidence + '%</strong></div>';

  var notes = [
    'Measured room area is ' + totalArea.toFixed(0) + ' m2; grossed up by ' + Math.round(scope.shellAllowancePct * 100) + '% for walls, circulation, stairs, and unlisted service space.',
    scope.site.note,
    'Total includes preliminaries, external works, professional fees, contingency, and escalation as separate allowances.',
    'Excluded: land, demolition, statutory approvals, finance charges, loose furniture, appliances, specialist equipment, and taxes not included in local rates.'
  ];
  document.getElementById('estimateNotes').innerHTML = notes.map(function(note) {
    return '<li>' + note + '</li>';
  }).join('');
}

/* -- Calculate -- */
function calculate() {
  if (!rooms.length) { alert('Please add at least one room.'); return; }

  var totalArea = rooms.reduce(function(s, r) { return s + r.w * r.l; }, 0);
  var loc = document.getElementById('location').value;
  var quality = document.getElementById('finishQuality').value;
  var bType = document.getElementById('buildType').value;
  var c = COSTS[loc];
  if (!c) { alert('Location data not found.'); return; }
  var scope = getScope();

  var baseCostPerM2 = c[quality];
  var typeMult = TYPE_MULT[bType] || 1;
  var directCostPerM2 = Math.round(baseCostPerM2 * typeMult * scope.site.mult);
  var grossArea = totalArea * (1 + scope.shellAllowancePct);
  var buildingWorksCost = Math.round(grossArea * directCostPerM2);

  var preliminaries = buildingWorksCost * scope.preliminariesPct;
  var subtotalWithPrelims = buildingWorksCost + preliminaries;
  var externalWorks = subtotalWithPrelims * scope.externalWorksPct;
  var professionalFees = subtotalWithPrelims * scope.professionalFeesPct;
  var contingencyBase = subtotalWithPrelims + externalWorks + professionalFees;
  var contingency = contingencyBase * scope.contingencyPct;
  var escalation = (contingencyBase + contingency) * scope.escalationPct;
  var totalCost = Math.round(contingencyBase + contingency + escalation);
  var blendedCostPerM2 = Math.round(totalCost / grossArea);

  // Grand total
  document.getElementById('grandTotal').textContent = money(c, totalCost);
  document.getElementById('costPerSqm').textContent = money(c, blendedCostPerM2) + ' per m2 x ' + grossArea.toFixed(0) + ' m2 gross (' + quality + ' finish, ' + bType + ', ' + scope.stage.label.toLowerCase() + ')';
  renderConfidence(scope, totalArea, grossArea, totalCost, c);

  // Breakdown table
  var html = '<thead><tr><th>Category</th><th>Basis</th><th class="num">Estimated Cost (' + c.curr + ')</th></tr></thead><tbody>';
  html += '<tr class="cat-row"><td colspan="3">Measured building works</td></tr>';
  BREAKDOWN.forEach(function(b) {
    var cost = Math.round(buildingWorksCost * b.pct);
    html += '<tr><td>' + b.cat + '</td><td>' + Math.round(b.pct * 100) + '% of works</td><td class="num">' + money(c, cost) + '</td></tr>';
  });
  html += '<tr class="cat-row"><td colspan="3">Project allowances</td></tr>';
  [
    ['Preliminaries', scope.preliminariesPct, preliminaries, 'of building works'],
    ['External Works', scope.externalWorksPct, externalWorks, 'of works + prelims'],
    ['Professional Fees', scope.professionalFeesPct, professionalFees, 'of works + prelims'],
    ['Contingency', scope.contingencyPct, contingency, 'of cost plan subtotal'],
    ['Price Escalation', scope.escalationPct, escalation, 'of subtotal + contingency']
  ].forEach(function(row) {
    html += '<tr><td>' + row[0] + '</td><td>' + Math.round(row[1] * 100) + '% ' + row[3] + '</td><td class="num">' + money(c, row[2]) + '</td></tr>';
  });
  html += '<tr class="total-row"><td>TOTAL</td><td>' + scope.site.label + '</td><td class="num">' + money(c, totalCost) + '</td></tr>';
  html += '</tbody>';
  document.getElementById('breakdownTable').innerHTML = html;

  // Timeline
  var monthsBase = {bungalow:6, duplex:10, storey:12, apartment:14, commercial:8};
  var qualityMult = {economy:0.8, standard:1, premium:1.2, luxury:1.5};
  var siteTimeMult = {easy:1, tight:1.1, difficult:1.18, remote:1.25};
  var months = Math.round((monthsBase[bType] || 8) * (qualityMult[quality] || 1) * (siteTimeMult[scope.siteKey] || 1));
  document.getElementById('timelineCards').innerHTML =
    '<div class="tl-item"><div class="tl-label">Foundation</div><div class="tl-value">' + Math.max(1, Math.round(months * 0.15)) + ' months</div></div>' +
    '<div class="tl-item"><div class="tl-label">Structure</div><div class="tl-value">' + Math.max(1, Math.round(months * 0.30)) + ' months</div></div>' +
    '<div class="tl-item"><div class="tl-label">Roofing</div><div class="tl-value">' + Math.max(1, Math.round(months * 0.10)) + ' months</div></div>' +
    '<div class="tl-item"><div class="tl-label">Finishes</div><div class="tl-value">' + Math.max(1, Math.round(months * 0.30)) + ' months</div></div>' +
    '<div class="tl-item"><div class="tl-label">Services + External</div><div class="tl-value">' + Math.max(1, Math.round(months * 0.15)) + ' months</div></div>' +
    '<div class="tl-item" style="background:#EFF6FF;border-color:#BFDBFE"><div class="tl-label">Total Duration</div><div class="tl-value" style="color:#0062CC">' + months + ' months</div></div>';

  document.getElementById('results').style.display = 'block';
  document.getElementById('results').scrollIntoView({behavior:'smooth'});
}

/* -- PDF -- */
async function exportPDF() {
  var total = document.getElementById('grandTotal').textContent;
  var sub = document.getElementById('costPerSqm').textContent;
  var breakdownRows = Array.prototype.map.call(
    document.querySelectorAll('#breakdownTable tr'),
    function(row) {
      var cells = row.querySelectorAll('th,td');
      return {
        label: cells[0] ? cells[0].textContent.trim() : '',
        value: cells.length ? cells[cells.length - 1].textContent.trim() : ''
      };
    }
  ).filter(function(row) { return row.label && row.value && row.label !== row.value; });
  var roomRows = rooms.map(function(room) {
    return {
      label: room.name,
      value: room.w + ' x ' + room.l + ' m (' + (room.w * room.l).toFixed(1) + ' m2)'
    };
  });

  if (!window.AfroToolsEngineeringPdf || typeof window.AfroToolsEngineeringPdf.download !== 'function') {
    throw new Error('PDF export is unavailable');
  }
  return window.AfroToolsEngineeringPdf.download({
    title: 'Building Cost Estimate',
    subtitle: sub,
    heroStats: [
      { label: 'Estimated Total', value: total, highlight: true },
      { label: 'Rooms', value: String(rooms.length) }
    ],
    sections: [
      { title: 'Cost Breakdown', rows: breakdownRows },
      { title: 'Rooms', rows: roomRows }
    ],
    disclaimer: 'Planning estimate only. Verify quantities and contract pricing with a qualified quantity surveyor.',
    filename: 'afrotools-building-cost-estimate.pdf'
  });
}

document.addEventListener('click', function(event) {
  var button = event.target.closest('[data-engineering-local-pdf="floor-plan"]');
  if (!button) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  exportPDF().catch(function(error) {
    console.error('Floor plan PDF export failed:', error);
  });
}, true);

function shareResult() {
  var total = document.getElementById('grandTotal').textContent;
  var sub = document.getElementById('costPerSqm').textContent;
  var text = 'Building Cost Estimate: ' + total + '\n' + sub + '\nEstimated with AfroTools\nhttps://afrotools.com/tools/floor-plan/';
  if (navigator.share) { navigator.share({title:'Building Cost | AfroTools',text:text}).catch(function(){}); }
  else { navigator.clipboard.writeText(text).then(function(){alert('Copied!');}); }
}

// Init with default bungalow
suggestRooms();
