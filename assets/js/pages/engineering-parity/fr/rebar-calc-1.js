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
    '<div><label>Bar</label><select data-f="size" aria-label="Sélectionnez une option.">' + sizeOpts + '</select></div>' +
    '<div><label>Description</label><input aria-label="E.g. Bottom bars in slab" type="text" data-f="desc" value="' + (d.desc||'') + '" placeholder="e.g. Bottom bars in slab"></div>' +
    '<div><label>Longueur (m)</label><input type="number" data-f="length" value="' + d.length + '" step="0.01" min="0.1" aria-label="Input value"></div>' +
    '<div><label>Quantité</label><input type="number" data-f="qty" value="' + d.qty + '" min="1" aria-label="Input value"></div>' +
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
  var wastagePct = parseInt(document.getElementById('wastage').value);
  var inputRows = Array.prototype.map.call(rows, function(row, idx) {
    return {size:row.querySelector('[data-f="size"]').value,description:row.querySelector('[data-f="desc"]').value||'Bar '+(idx+1),length:parseFloat(row.querySelector('[data-f="length"]').value),quantity:parseInt(row.querySelector('[data-f="qty"]').value)};
  });
  var result = EngineeringMaterialsEngine.rebar({rows:inputRows,wastagePct:wastagePct,pricePerTonne:pricePerTonne});
  if (result.error) { alert('Please add at least one valid bar.'); return; }
  var totalWeight=result.totalWeight,totalLength=result.totalLength,totalBars=result.totalBars,weightWithWaste=result.weightWithWaste,tonnes=result.tonnes,cost=result.cost;
  var bbsData=result.schedule.map(function(b){return {mark:b.mark,size:b.size,dia:b.dia,desc:b.description,length:b.length,qty:b.quantity,totalLen:b.totalLength,weight:b.weight,fullBars:b.fullBars,lapLen:b.lapLengthMm,wtPerM:b.weightPerM};});
  var wastePct = 1 + wastagePct / 100;

  // Display totals
  document.getElementById('totalWeight').textContent = weightWithWaste.toFixed(0) + ' kg (' + tonnes.toFixed(2) + ' tonnes)';
  document.getElementById('totalBars').textContent = totalBars + ' barres | ' + totalLength.toFixed(1) + ' mètres de longueur totale | ' + Math.round((wastePct - 1) * 100) + '% de perte incluse';

  // Result grid
  document.getElementById('resultGrid').innerHTML =
    '<div class="result-box"><div class="r-val">' + totalWeight.toFixed(0) + ' kg</div><div class="r-lbl">Net Weight</div></div>' +
    '<div class="result-box"><div class="r-val">' + weightWithWaste.toFixed(0) + ' kg</div><div class="r-lbl">Avec pertes</div></div>' +
    '<div class="result-box"><div class="r-val">' + tonnes.toFixed(2) + ' t</div><div class="r-lbl">Tonnes</div></div>' +
    '<div class="result-box"><div class="r-val">' + totalBars + '</div><div class="r-lbl">Nombre total de barres</div></div>' +
    '<div class="result-box"><div class="r-val">' + totalLength.toFixed(1) + ' m</div><div class="r-lbl">Total Longueur</div></div>' +
    '<div class="result-box"><div class="r-val">' + Math.ceil(totalLength / STD_BAR_LENGTH) + '</div><div class="r-lbl">Barres de 12 m to Order</div></div>';

  // BBS Table
  var html = '<thead><tr><th>Repère</th><th>Diamètre</th><th>Description</th><th class="num">Longueur (m)</th><th class="num">Non.</th><th class="num">Total (m)</th><th class="num">Poids (kg)</th><th class="num">Barres de 12 m</th></tr></thead><tbody>';
  bbsData.forEach(function(b) {
    html += '<tr><td>' + b.mark + '</td><td><strong>' + b.size + '</strong></td><td>' + b.desc + '</td><td class="num">' + b.length.toFixed(2) + '</td><td class="num">' + b.qty + '</td><td class="num">' + b.totalLen.toFixed(1) + '</td><td class="num">' + b.weight.toFixed(1) + '</td><td class="num">' + b.fullBars + '</td></tr>';
  });
  html += '</tbody><tfoot><tr><td colspan="4"><strong>TOTAL</strong></td><td class="num"><strong>' + totalBars + '</strong></td><td class="num"><strong>' + totalLength.toFixed(1) + '</strong></td><td class="num"><strong>' + totalWeight.toFixed(1) + '</strong></td><td class="num"><strong>' + Math.ceil(totalLength / STD_BAR_LENGTH) + '</strong></td></tr></tfoot>';
  document.getElementById('bbsTable').innerHTML = html;

  // Cost
  document.getElementById('costSection').innerHTML =
    '<h4 style="font-size:.82rem;font-weight:700;color:#065F46;margin-bottom:6px">Coût estimé de l’acier</h4>' +
    '<div style="font-size:1.3rem;font-weight:900;color:#065F46">' + sym + cost.toLocaleString() + '</div>' +
    '<div style="font-size:.75rem;color:#6B7280;margin-top:4px">' + tonnes.toFixed(2) + ' tonnes × ' + sym + pricePerTonne.toLocaleString() + '/tonne (avec ' + Math.round((wastePct - 1) * 100) + '% de perte). Les prix sont indicatifs — vérifiez-les auprès de votre fournisseur.</div>';

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
    throw new Error('PDF Exporter is unavailable');
  }
  return window.AfroToolsEngineeringPdf.download({
    title: 'Bordereau de façonnage des armatures',
    heroStats: [{ label: 'Poids total', value: total }],
    sections: [{ title: 'Barres d’armature', rows: rows }],
    disclaimer: 'Bordereau de planification uniquement. Un ingénieur structure doit vérifier les diamètres, recouvrements, ancrages et longueurs de coupe.',
    filename: 'afrotools-bar-bending-schedule.pdf'
  });
}

document.addEventListener('click', function(event) {
  var button = event.target.closest('[data-engineering-local-pdf="rebar-calc"]');
  if (!button) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  exportPDF().catch(function(error) {
    console.error('Rebar PDF Exporter failed:', error);
  });
}, true);

function shareResult() {
  var total = document.getElementById('totalWeight').textContent;
  var text = 'Rebar: ' + total + '\nCalculated with AfroTools\nhttps://afrotools.com/Outils/rebar-Calculateur/';
  if (navigator.share) { navigator.share({title:'Rebar Calculateur | AfroTools',text:text}).catch(function(){}); }
  else { navigator.clipboard.writeText(text).then(function(){alert('Copied!');}); }
}

// Init with sample bars
addBar({size:'Y16', desc:'Barres inférieures principales', length:5.8, qty:8});
addBar({size:'Y12', desc:'Barres supérieures de répartition', length:3.8, qty:12});
addBar({size:'R8', desc:'Étriers et cadres', length:1.2, qty:24});
addBar({size:'Y20', desc:'Barres de poteau', length:3.5, qty:16});
