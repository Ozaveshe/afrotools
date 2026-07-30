/* ── Bar Data ── */
var BARS = {
  'R6':  {dia:6, wt:0.222, type:'R'},
  'R8':  {dia:8, wt:0.395, type:'R'},
  'R10': {dia:10, wt:0.617, type:'R'},
  'Y8':  {dia:8, wt:0.395, type:'Y'},
  'Y10': {dia:10, wt:0.617, type:'Y'},
  'Y12': {dia:12, wt:0.888, type:'Y'},
  'Y16': {dia:16, wt:1.579, type:'Y'},
  'Y20': {dia:20, wt:2.466, type:'Y'},
  'Y25': {dia:25, wt:3.854, type:'Y'},
  'Y32': {dia:32, wt:6.313, type:'Y'}
};

var STD_BAR_LENGTH = 12; // metres
var rowId = 0;
var barList = document.getElementById('barList');

function addBar(data) {
  var id = rowId++;
  var d = data || {size:'Y12', desc:'', length:6, qty:10};
  var sizeOpts = Object.keys(BARS).map(function(k) {
    return '<option value="' + k + '"' + (k === d.size ? ' selected' : '') + '>' + k + ' (' + BARS[k].dia + 'mm, ' + BARS[k].wt + ' kg/m)</option>';
  }).join('');
  var div = document.createElement('div');
  div.className = 'field-row-5';
  div.id = 'bar-' + id;
  div.innerHTML =
    '<div><label>Bar</label><select data-f="size" aria-label="Select option">' + sizeOpts + '</select></div>' +
    '<div><label>Description</label><input aria-label="E.g. Bottom bars in slab" type="text" data-f="desc" value="' + (d.desc||'') + '" placeholder="e.g. Bottom bars in slab"></div>' +
    '<div><label>Length (m)</label><input type="number" data-f="length" value="' + d.length + '" step="0.01" min="0.1" aria-label="Input value"></div>' +
    '<div><label>Quantity</label><input type="number" data-f="qty" value="' + d.qty + '" min="1" aria-label="Input value"></div>' +
    '<div><label>&nbsp;</label><button type="button" class="btn-remove" onclick="removeBar(' + id + ')">X</button></div>';
  barList.appendChild(div);
}

function removeBar(id) { document.getElementById('bar-' + id).remove(); }

/* ── Calculate ── */
function calculate() {
  var rows = barList.querySelectorAll('.field-row-5');
  if (!rows.length) { alert('Please add at least one bar.'); return; }

  var sel = document.getElementById('country');
  var opt = sel.options[sel.selectedIndex];
  var pricePerTonne = parseFloat(opt.dataset.price);
  var sym = opt.dataset.sym;
  var wastePct = 1 + parseInt(document.getElementById('wastage').value) / 100;

  var totalWeight = 0, totalLength = 0, totalBars = 0;
  var bbsData = [];

  rows.forEach(function(row, idx) {
    var size = row.querySelector('[data-f="size"]').value;
    var desc = row.querySelector('[data-f="desc"]').value || 'Bar ' + (idx + 1);
    var length = parseFloat(row.querySelector('[data-f="length"]').value) || 0;
    var qty = parseInt(row.querySelector('[data-f="qty"]').value) || 0;
    var bar = BARS[size];
    if (!bar || length <= 0 || qty <= 0) return;

    var totalLen = length * qty;
    var weight = bar.wt * totalLen;
    var fullBars = Math.ceil((length * qty) / STD_BAR_LENGTH);
    var lapLen = bar.dia * 40; // tension lap in mm

    totalWeight += weight;
    totalLength += totalLen;
    totalBars += qty;

    bbsData.push({
      mark: idx + 1,
      size: size,
      dia: bar.dia,
      desc: desc,
      length: length,
      qty: qty,
      totalLen: totalLen,
      weight: weight,
      fullBars: fullBars,
      lapLen: lapLen,
      wtPerM: bar.wt
    });
  });

  var weightWithWaste = totalWeight * wastePct;
  var tonnes = weightWithWaste / 1000;
  var cost = Math.round(tonnes * pricePerTonne);

  // Display totals
  document.getElementById('totalWeight').textContent = weightWithWaste.toFixed(0) + ' kg (' + tonnes.toFixed(2) + ' tonnes)';
  document.getElementById('totalBars').textContent = totalBars + ' bars | ' + totalLength.toFixed(1) + ' metres total length | ' + Math.round((wastePct - 1) * 100) + '% wastage included';

  // Result grid
  document.getElementById('resultGrid').innerHTML =
    '<div class="result-box"><div class="r-val">' + totalWeight.toFixed(0) + ' kg</div><div class="r-lbl">Net Weight</div></div>' +
    '<div class="result-box"><div class="r-val">' + weightWithWaste.toFixed(0) + ' kg</div><div class="r-lbl">With Wastage</div></div>' +
    '<div class="result-box"><div class="r-val">' + tonnes.toFixed(2) + ' t</div><div class="r-lbl">Tonnes</div></div>' +
    '<div class="result-box"><div class="r-val">' + totalBars + '</div><div class="r-lbl">Total Bars</div></div>' +
    '<div class="result-box"><div class="r-val">' + totalLength.toFixed(1) + ' m</div><div class="r-lbl">Total Length</div></div>' +
    '<div class="result-box"><div class="r-val">' + Math.ceil(totalLength / STD_BAR_LENGTH) + '</div><div class="r-lbl">12m Bars to Order</div></div>';

  // BBS Table
  var html = '<thead><tr><th>Mark</th><th>Size</th><th>Description</th><th class="num">Length (m)</th><th class="num">No.</th><th class="num">Total (m)</th><th class="num">Weight (kg)</th><th class="num">12m Bars</th></tr></thead><tbody>';
  bbsData.forEach(function(b) {
    html += '<tr><td>' + b.mark + '</td><td><strong>' + b.size + '</strong></td><td>' + b.desc + '</td><td class="num">' + b.length.toFixed(2) + '</td><td class="num">' + b.qty + '</td><td class="num">' + b.totalLen.toFixed(1) + '</td><td class="num">' + b.weight.toFixed(1) + '</td><td class="num">' + b.fullBars + '</td></tr>';
  });
  html += '</tbody><tfoot><tr><td colspan="4"><strong>TOTAL</strong></td><td class="num"><strong>' + totalBars + '</strong></td><td class="num"><strong>' + totalLength.toFixed(1) + '</strong></td><td class="num"><strong>' + totalWeight.toFixed(1) + '</strong></td><td class="num"><strong>' + Math.ceil(totalLength / STD_BAR_LENGTH) + '</strong></td></tr></tfoot>';
  document.getElementById('bbsTable').innerHTML = html;

  // Cost
  document.getElementById('costSection').innerHTML =
    '<h4 style="font-size:.82rem;font-weight:700;color:#065F46;margin-bottom:6px">Estimated Steel Cost</h4>' +
    '<div style="font-size:1.3rem;font-weight:900;color:#065F46">' + sym + cost.toLocaleString() + '</div>' +
    '<div style="font-size:.75rem;color:#6B7280;margin-top:4px">' + tonnes.toFixed(2) + ' tonnes × ' + sym + pricePerTonne.toLocaleString() + '/tonne (incl. ' + Math.round((wastePct - 1) * 100) + '% wastage). Prices are indicative — verify with your supplier.</div>';

  document.getElementById('results').style.display = 'block';
  document.getElementById('results').scrollIntoView({behavior:'smooth'});
}

/* ── PDF Export ── */
async function exportPDF() {
  var total = document.getElementById('totalWeight').textContent;
  var rows = Array.prototype.map.call(
    document.querySelectorAll('#bbsTable tbody tr'),
    function(row) {
      var cells = row.querySelectorAll('td');
      return {
        label: cells[1] ? cells[1].textContent.trim() : '',
        value: Array.prototype.map.call(cells, function(cell) {
          return cell.textContent.trim();
        }).slice(2).join(' | ')
      };
    }
  ).filter(function(row) { return row.label; });
  if (!window.AfroToolsEngineeringPdf || typeof window.AfroToolsEngineeringPdf.download !== 'function') {
    throw new Error('PDF export is unavailable');
  }
  return window.AfroToolsEngineeringPdf.download({
    title: 'Bar Bending Schedule',
    heroStats: [{ label: 'Total Weight', value: total }],
    sections: [{ title: 'Reinforcement Bars', rows: rows }],
    disclaimer: 'Planning schedule only. A structural engineer must verify bar sizes, laps, anchorage and cutting lengths.',
    filename: 'afrotools-bar-bending-schedule.pdf'
  });
}

document.addEventListener('click', function(event) {
  var button = event.target.closest('[data-engineering-local-pdf="rebar-calc"]');
  if (!button) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  exportPDF().catch(function(error) {
    console.error('Rebar PDF export failed:', error);
  });
}, true);

function shareResult() {
  var total = document.getElementById('totalWeight').textContent;
  var text = 'Rebar: ' + total + '\nCalculated with AfroTools\nhttps://afrotools.com/tools/rebar-calculator/';
  if (navigator.share) { navigator.share({title:'Rebar Calculator | AfroTools',text:text}).catch(function(){}); }
  else { navigator.clipboard.writeText(text).then(function(){alert('Copied!');}); }
}

// Init with sample bars
addBar({size:'Y16', desc:'Bottom bars (main)', length:5.8, qty:8});
addBar({size:'Y12', desc:'Top bars (distribution)', length:3.8, qty:12});
addBar({size:'R8', desc:'Stirrups / links', length:1.2, qty:24});
addBar({size:'Y20', desc:'Column bars', length:3.5, qty:16});
