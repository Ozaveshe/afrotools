const MATERIAL_WIDTHS = { longspan: 0.76, longspan07: 0.76, steptile: 0.42, metcoppo: 0.77, corrugated: 0.66 };

document.getElementById('material').addEventListener('change', function() {
  document.getElementById('coverWidth').value = MATERIAL_WIDTHS[this.value] || 0.76;
});

function calculate() {
  const bL = +document.getElementById('bldgLength').value;
  const bW = +document.getElementById('bldgWidth').value;
  const roofType = document.getElementById('roofType').value;
  const pitch = +document.getElementById('roofPitch').value;
  const overhang = +document.getElementById('overhang').value;
  const coverW = +document.getElementById('coverWidth').value;
  const wastePct = +document.getElementById('wastage').value;
  const material = document.getElementById('material').value;

  const pitchRad = pitch * Math.PI / 180;
  const slopeFactor = 1 / Math.cos(pitchRad);

  // Effective dimensions with overhang
  const effL = bL + (2 * overhang);
  const effW = bW + (2 * overhang);

  let roofArea = 0;
  let ridgeLength = 0;
  let sheetsAcross = 0;
  let slopeLength = 0;

  if (roofType === 'gable') {
    slopeLength = (effW / 2) * slopeFactor;
    roofArea = 2 * effL * slopeLength;
    ridgeLength = effL;
    sheetsAcross = Math.ceil(effL / coverW);
  } else if (roofType === 'hip') {
    slopeLength = (effW / 2) * slopeFactor;
    roofArea = effL * effW * slopeFactor; // approximate
    ridgeLength = effL - effW + (effW * 0.5); // hip ridge
    sheetsAcross = Math.ceil(effL / coverW);
  } else {
    slopeLength = effW * slopeFactor;
    roofArea = effL * slopeLength;
    ridgeLength = 0;
    sheetsAcross = Math.ceil(effL / coverW);
  }

  const sheetsExact = roofArea / (coverW * slopeLength);
  const wasteSheets = Math.ceil(sheetsExact * (wastePct / 100));
  const totalSheets = Math.ceil(sheetsExact) + wasteSheets;
  const ridgeCaps = Math.ceil(ridgeLength / 0.9);
  const nails = totalSheets * 20;
  const nailKg = Math.ceil(nails / 80); // ~80 nails per kg

  let html = '';
  html += `<div class="result-box"><div class="num">${roofArea.toFixed(1)} m2</div><div class="lbl">Total Toiture Surface</div></div>`;
  html += `<div class="result-box"><div class="num">${totalSheets}</div><div class="lbl">feuilles nécessaires</div></div>`;
  html += `<div class="result-box"><div class="num">${slopeLength.toFixed(2)}m</div><div class="lbl">Slope Longueur</div></div>`;
  html += `<div class="result-box"><div class="num">${ridgeCaps}</div><div class="lbl">Ridge Caps</div></div>`;
  document.getElementById('resultGrid').innerHTML = html;

  // Materials table
  let table = '<tr><th>Poste</th><th style="text-align:right">Quantité</th><th style="text-align:right">Notes</th></tr>';
  table += `<tr><td>Feuilles de toiture</td><td style="text-align:right">${totalSheets} pièces</td><td style="text-align:right">${slopeLength.toFixed(2)}m de longueur chacune</td></tr>`;
  table += `<tr><td>Ridge Caps</td><td style="text-align:right">${ridgeCaps} pièces</td><td style="text-align:right">${ridgeLength.toFixed(1)}m ridge</td></tr>`;
  table += `<tr><td>toiture Nails</td><td style="text-align:right">${nailKg} kg</td><td style="text-align:right">~${nails} nails total</td></tr>`;
  table += `<tr><td>Valley Gutter</td><td style="text-align:right">${roofType === 'hip' ? Math.ceil(slopeLength * 4 / 2) + 'm' : 'N/A'}</td><td style="text-align:right">${roofType === 'hip' ? 'Hip Toiture valleys' : ''}</td></tr>`;
  const fasciaM = Math.ceil((2 * (bL + bW)) + 2);
  table += `<tr><td>Fascia Board</td><td style="text-align:right">${fasciaM}m</td><td style="text-align:right">Bâtiment perimeter</td></tr>`;
  table += `<tr><td><strong>Informations et hypothèses du calcul</strong></td><td style="text-align:right"><strong>${totalSheets} feuilles</strong></td><td style="text-align:right"><strong>${roofArea.toFixed(0)} m2</strong></td></tr>`;

  // ── Truss Calculation ──
  const trussSpacing = 0.9; // 900mm standard
  const numTrusses = Math.ceil(bL / trussSpacing) + 1;
  const trussSpan = bW + (overhang * 2); // total span including overhangs
  const rafterLen = slopeLength + 0.3; // rafter + bird's mouth
  const timberPerTruss = (rafterLen * 2) + trussSpan + (trussSpan * 0.5); // 2 rafters + bottom chord + web members
  const totalTimberM = timberPerTruss * numTrusses;
  const purlinsM = bL * Math.ceil(slopeLength / 1.2) * sections; // purlins at 1.2m spacing

  table += `<tr><td colspan="3" style="background:#f8fafc;font-weight:800;color:#1e293b;padding-top:12px">Bois / Truss Estimer</td></tr>`;
  table += `<tr><td>Trusses (at ${(trussSpacing*1000).toFixed(0)}mm spacing)</td><td style="text-align:right">${numTrusses} trusses</td><td style="text-align:right">Span: ${trussSpan.toFixed(1)}m</td></tr>`;
  table += `<tr><td>Bois per truss (2×6 or 50×150mm)</td><td style="text-align:right">${timberPerTruss.toFixed(1)}m</td><td style="text-align:right">2 rafters + chord + web</td></tr>`;
  table += `<tr><td>Total truss Bois</td><td style="text-align:right">${totalTimberM.toFixed(0)}m</td><td style="text-align:right">${(totalTimberM * 0.05 * 0.15).toFixed(2)} m³</td></tr>`;
  table += `<tr><td>Purlins (2×4 or 50×100mm)</td><td style="text-align:right">${purlinsM.toFixed(0)}m</td><td style="text-align:right">At 1.2m spacing on slope</td></tr>`;
  table += `<tr><td>Fascia Board</td><td style="text-align:right">${fasciaM}m</td><td style="text-align:right">Bâtiment perimeter</td></tr>`;
  table += `<tr><td>Gutter (PVC)</td><td style="text-align:right">${fasciaM}m</td><td style="text-align:right">Same as fascia run</td></tr>`;

  document.getElementById('materialsTable').innerHTML = table;

  // ── Truss results in grid ──
  var existingHtml = document.getElementById('resultGrid').innerHTML;
  existingHtml += `<div class="result-box"><div class="num">${numTrusses}</div><div class="lbl">Trusses</div></div>`;
  existingHtml += `<div class="result-box"><div class="num">${totalTimberM.toFixed(0)}m</div><div class="lbl">Truss Bois</div></div>`;
  document.getElementById('resultGrid').innerHTML = existingHtml;

  document.getElementById('resultCard').style.display = 'block';
  document.getElementById('resultCard').scrollIntoView({ behavior: 'smooth', block: 'start' });
}
