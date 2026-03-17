/**
 * fp-cost.js — AfroPlan Construction Cost Estimator
 * Lazy-loaded IIFE that exports FPCost.
 * Depends on CSS classes defined in floor-planner.css.
 */
(function (global) {
  'use strict';

  /* =========================================================
   * 1. MATERIAL PRICES
   * ========================================================= */
  const MATERIAL_PRICES = {
    NG: {
      name: 'Nigeria',
      currency: '₦',
      currencyCode: 'NGN',
      cement: 8500,
      block6: 450,
      block9: 550,
      sandTrip: 120000,
      graniteTrip: 180000,
      rod12mm: 6500,
      rod16mm: 12000,
      roofingSheet: 7500,
      doorFlush: 45000,
      doorSecurity: 150000,
      windowSliding: 65000,
      windowCasement: 55000,
      tilesPerSqm: 4500,
      paintBucket: 35000,
      labourPercent: 0.5,
    },
    KE: {
      name: 'Kenya',
      currency: 'KES',
      currencyCode: 'KES',
      cement: 1200,
      block6: 120,
      block9: 150,
      sandTrip: 18000,
      graniteTrip: 27000,
      rod12mm: 950,
      rod16mm: 1800,
      roofingSheet: 1100,
      doorFlush: 6500,
      doorSecurity: 22000,
      windowSliding: 9500,
      windowCasement: 8000,
      tilesPerSqm: 650,
      paintBucket: 5000,
      labourPercent: 0.5,
    },
    GH: {
      name: 'Ghana',
      currency: 'GH₵',
      currencyCode: 'GHS',
      cement: 85,
      block6: 8,
      block9: 10,
      sandTrip: 1400,
      graniteTrip: 2200,
      rod12mm: 75,
      rod16mm: 140,
      roofingSheet: 90,
      doorFlush: 550,
      doorSecurity: 1800,
      windowSliding: 780,
      windowCasement: 660,
      tilesPerSqm: 55,
      paintBucket: 420,
      labourPercent: 0.5,
    },
    ZA: {
      name: 'South Africa',
      currency: 'R',
      currencyCode: 'ZAR',
      cement: 120,
      block6: 18,
      block9: 24,
      sandTrip: 2500,
      graniteTrip: 3800,
      rod12mm: 130,
      rod16mm: 250,
      roofingSheet: 160,
      doorFlush: 950,
      doorSecurity: 3200,
      windowSliding: 1400,
      windowCasement: 1200,
      tilesPerSqm: 95,
      paintBucket: 750,
      labourPercent: 0.5,
    },
    TZ: {
      name: 'Tanzania',
      currency: 'TZS',
      currencyCode: 'TZS',
      cement: 18000,
      block6: 1500,
      block9: 1900,
      sandTrip: 280000,
      graniteTrip: 420000,
      rod12mm: 16000,
      rod16mm: 30000,
      roofingSheet: 18000,
      doorFlush: 110000,
      doorSecurity: 370000,
      windowSliding: 160000,
      windowCasement: 135000,
      tilesPerSqm: 11000,
      paintBucket: 85000,
      labourPercent: 0.5,
    },
    EG: {
      name: 'Egypt',
      currency: 'E£',
      currencyCode: 'EGP',
      cement: 250,
      block6: 15,
      block9: 20,
      sandTrip: 3500,
      graniteTrip: 5500,
      rod12mm: 200,
      rod16mm: 380,
      roofingSheet: 220,
      doorFlush: 1400,
      doorSecurity: 4500,
      windowSliding: 2000,
      windowCasement: 1700,
      tilesPerSqm: 130,
      paintBucket: 1100,
      labourPercent: 0.5,
    },
  };

  /* =========================================================
   * 2. HELPERS
   * ========================================================= */

  /**
   * Format a number as currency with proper symbol and thousand separators.
   * @param {number} amount
   * @param {string|object} countryOrPrices — country code string or prices object
   * @returns {string}
   */
  function formatCurrency(amount, countryOrPrices) {
    const prices =
      typeof countryOrPrices === 'string'
        ? MATERIAL_PRICES[countryOrPrices] || MATERIAL_PRICES.NG
        : countryOrPrices;
    const symbol = prices.currency || '';
    const formatted = Math.round(amount).toLocaleString('en-US');
    return `${symbol} ${formatted}`;
  }

  function wallLength(wall) {
    const dx = wall.x2 - wall.x1;
    const dy = wall.y2 - wall.y1;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /* =========================================================
   * 3. ESTIMATE
   * ========================================================= */

  /**
   * @param {object} planData
   * @param {string} countryCode
   * @returns {object} result with line items and totals
   */
  function estimate(planData, countryCode) {
    const code = (countryCode || 'NG').toUpperCase();
    const p = Object.assign({}, MATERIAL_PRICES[code] || MATERIAL_PRICES.NG);

    const walls = planData.walls || [];
    const doors = planData.doors || [];
    const windows = planData.windows || [];
    const totalArea = planData.totalArea || 0;

    // --- Wall metrics ---
    let totalWallLength = 0;
    let wall6mArea = 0;   // 150mm walls
    let wall9mArea = 0;   // 225mm walls

    walls.forEach(function (w) {
      const len = wallLength(w);
      totalWallLength += len;
      const thickness = w.thickness || 150;
      if (thickness >= 200) {
        wall9mArea += len;
      } else {
        wall6mArea += len;
      }
    });

    const wallHeight = 3.0;
    const totalWallArea = totalWallLength * wallHeight;
    const wall6Area = wall6mArea * wallHeight;
    const wall9Area = wall9mArea * wallHeight;

    // Perimeter approximation (sum of all wall lengths)
    const perimeter = totalWallLength;

    // --- Blocks ---
    const blockFaceArea6 = 0.45 * 0.225; // 6-inch face
    const blockFaceArea9 = 0.45 * 0.225; // same face, different depth
    const blocks6 = (wall6Area / blockFaceArea6) * 1.1;
    const blocks9 = (wall9Area / blockFaceArea9) * 1.1;
    const totalBlocks6 = Math.ceil(blocks6);
    const totalBlocks9 = Math.ceil(blocks9);

    // --- Cement ---
    const cementMortarBags = Math.ceil((totalBlocks6 + totalBlocks9) / 40);
    const cementPlasterBags = Math.ceil((totalWallArea * 2) / 5);
    const totalCementBags = cementMortarBags + cementPlasterBags;

    // --- Sand ---
    const sandTrips = Math.ceil((cementMortarBags + cementPlasterBags) * 0.04);

    // --- Granite ---
    const graniteTrips = Math.ceil(totalArea * 0.3);

    // --- Iron rods ---
    const rods12mm = Math.ceil(perimeter * 2);
    const rods16mm = Math.ceil(perimeter * 0.5);

    // --- Roofing ---
    const roofingSheets = Math.ceil((totalArea * 1.15) / 2.4);

    // --- Doors ---
    let doorsFlush = 0;
    let doorsSecurity = 0;
    doors.forEach(function (d) {
      const sub = (d.subtype || '').toLowerCase();
      if (sub === 'security' || sub === 'metal') {
        doorsSecurity += 1;
      } else {
        doorsFlush += 1;
      }
    });

    // --- Windows ---
    let windowsSliding = 0;
    let windowsCasement = 0;
    windows.forEach(function (w) {
      const sub = (w.subtype || '').toLowerCase();
      if (sub === 'casement') {
        windowsCasement += 1;
      } else {
        windowsSliding += 1;
      }
    });

    // --- Tiles ---
    const tilesSqm = totalArea;

    // --- Paint ---
    const paintBuckets = Math.ceil((totalWallArea * 2) / 12 / 20);

    // --- Cost calculations ---
    const costCement = totalCementBags * p.cement;
    const costBlocks6 = totalBlocks6 * p.block6;
    const costBlocks9 = totalBlocks9 * p.block9;
    const costSand = sandTrips * p.sandTrip;
    const costGranite = graniteTrips * p.graniteTrip;
    const costRods12 = rods12mm * p.rod12mm;
    const costRods16 = rods16mm * p.rod16mm;
    const costRoofing = roofingSheets * p.roofingSheet;
    const costDoorsFlush = doorsFlush * p.doorFlush;
    const costDoorsSecurity = doorsSecurity * p.doorSecurity;
    const costWindowsSliding = windowsSliding * p.windowSliding;
    const costWindowsCasement = windowsCasement * p.windowCasement;
    const costTiles = tilesSqm * p.tilesPerSqm;
    const costPaint = paintBuckets * p.paintBucket;

    const totalMaterialCost =
      costCement +
      costBlocks6 +
      costBlocks9 +
      costSand +
      costGranite +
      costRods12 +
      costRods16 +
      costRoofing +
      costDoorsFlush +
      costDoorsSecurity +
      costWindowsSliding +
      costWindowsCasement +
      costTiles +
      costPaint;

    const labourCost = totalMaterialCost * p.labourPercent;
    const grandTotal = totalMaterialCost + labourCost;

    // --- Line items ---
    const lineItems = [
      { item: 'Cement (Mortar + Plaster)', qty: totalCementBags, unit: 'Bags', unitPrice: p.cement, total: costCement, key: 'cement' },
      { item: '6-inch Blocks (150mm walls)', qty: totalBlocks6, unit: 'Blocks', unitPrice: p.block6, total: costBlocks6, key: 'block6' },
      { item: '9-inch Blocks (225mm walls)', qty: totalBlocks9, unit: 'Blocks', unitPrice: p.block9, total: costBlocks9, key: 'block9' },
      { item: 'Sharp Sand', qty: sandTrips, unit: 'Trips', unitPrice: p.sandTrip, total: costSand, key: 'sandTrip' },
      { item: 'Granite / Hardcore', qty: graniteTrips, unit: 'Trips', unitPrice: p.graniteTrip, total: costGranite, key: 'graniteTrip' },
      { item: 'Iron Rod 12mm', qty: rods12mm, unit: 'Lengths', unitPrice: p.rod12mm, total: costRods12, key: 'rod12mm' },
      { item: 'Iron Rod 16mm', qty: rods16mm, unit: 'Lengths', unitPrice: p.rod16mm, total: costRods16, key: 'rod16mm' },
      { item: 'Roofing Sheets (0.55mm Long-span)', qty: roofingSheets, unit: 'Sheets', unitPrice: p.roofingSheet, total: costRoofing, key: 'roofingSheet' },
      { item: 'Flush Doors', qty: doorsFlush, unit: 'Doors', unitPrice: p.doorFlush, total: costDoorsFlush, key: 'doorFlush' },
      { item: 'Security Doors', qty: doorsSecurity, unit: 'Doors', unitPrice: p.doorSecurity, total: costDoorsSecurity, key: 'doorSecurity' },
      { item: 'Sliding Windows', qty: windowsSliding, unit: 'Windows', unitPrice: p.windowSliding, total: costWindowsSliding, key: 'windowSliding' },
      { item: 'Casement Windows', qty: windowsCasement, unit: 'Windows', unitPrice: p.windowCasement, total: costWindowsCasement, key: 'windowCasement' },
      { item: 'Floor Tiles', qty: Math.ceil(tilesSqm), unit: 'sqm', unitPrice: p.tilesPerSqm, total: costTiles, key: 'tilesPerSqm' },
      { item: 'Paint (20L buckets)', qty: paintBuckets, unit: 'Buckets', unitPrice: p.paintBucket, total: costPaint, key: 'paintBucket' },
    ];

    return {
      countryCode: code,
      prices: p,
      lineItems: lineItems,
      totalMaterialCost: totalMaterialCost,
      labourCost: labourCost,
      grandTotal: grandTotal,
      meta: {
        totalWallLength: totalWallLength,
        totalWallArea: totalWallArea,
        totalArea: totalArea,
        perimeter: perimeter,
      },
    };
  }

  /* =========================================================
   * 4. RENDER ESTIMATE
   * ========================================================= */

  /**
   * Returns an HTML string for the cost estimate UI.
   * @param {object} result — output of estimate()
   * @param {string} countryCode
   * @returns {string}
   */
  function renderEstimate(result, countryCode) {
    const code = countryCode || result.countryCode || 'NG';
    const p = result.prices || MATERIAL_PRICES[code] || MATERIAL_PRICES.NG;

    // Country selector options
    const countryOptions = Object.keys(MATERIAL_PRICES)
      .map(function (cc) {
        const selected = cc === code ? ' selected' : '';
        return `<option value="${cc}"${selected}>${MATERIAL_PRICES[cc].name} (${MATERIAL_PRICES[cc].currencyCode})</option>`;
      })
      .join('');

    // Summary cards
    const summaryCards = `
<div class="fp-cost-summary">
  <div class="fp-cost-card">
    <span class="fp-cost-card-label">Material Cost</span>
    <span class="fp-cost-card-value">${formatCurrency(result.totalMaterialCost, p)}</span>
  </div>
  <div class="fp-cost-card">
    <span class="fp-cost-card-label">Labour Cost</span>
    <span class="fp-cost-card-value">${formatCurrency(result.labourCost, p)}</span>
  </div>
  <div class="fp-cost-card fp-cost-total">
    <span class="fp-cost-card-label">Total Estimate</span>
    <span class="fp-cost-card-value">${formatCurrency(result.grandTotal, p)}</span>
  </div>
</div>`;

    // BOQ table rows
    const tableRows = result.lineItems
      .map(function (row, idx) {
        if (row.qty === 0) return '';
        return `
<tr data-row="${idx}" data-key="${row.key}">
  <td>${row.item}</td>
  <td style="text-align:right;">${row.qty.toLocaleString('en-US')}</td>
  <td>${row.unit}</td>
  <td style="text-align:right;">
    <input
      type="number"
      class="fp-boq-editable"
      data-row="${idx}"
      data-key="${row.key}"
      value="${row.unitPrice}"
      min="0"
      step="1"
      aria-label="Unit price for ${row.item}"
      style="width:9ch; font-family:var(--font-mono,monospace); color:var(--color-text); background:transparent; border:1px solid var(--color-primary); border-radius:3px; padding:2px 4px; text-align:right;"
    />
  </td>
  <td style="text-align:right;" data-total-cell="${idx}">${formatCurrency(row.total, p)}</td>
</tr>`;
      })
      .join('');

    // Labour row
    const labourRow = `
<tr class="fp-boq-labour-row" style="font-style:italic; color:var(--color-text);">
  <td colspan="4" style="text-align:right;">Labour (${Math.round((p.labourPercent || 0.5) * 100)}% of materials)</td>
  <td style="text-align:right;" id="fp-boq-labour-total">${formatCurrency(result.labourCost, p)}</td>
</tr>`;

    // Grand total row
    const totalRow = `
<tr style="font-weight:700; color:var(--color-primary);">
  <td colspan="4" style="text-align:right;">GRAND TOTAL</td>
  <td style="text-align:right;" id="fp-boq-grand-total">${formatCurrency(result.grandTotal, p)}</td>
</tr>`;

    const boqTable = `
<div style="overflow-x:auto; margin-top:1rem;">
  <table class="fp-boq-table" id="fp-boq-table" style="width:100%; border-collapse:collapse; font-family:var(--font-mono,monospace); color:var(--color-text);">
    <thead>
      <tr style="border-bottom:2px solid var(--color-primary); color:var(--color-primary);">
        <th style="text-align:left; padding:6px 8px;">Item</th>
        <th style="text-align:right; padding:6px 8px;">Qty</th>
        <th style="text-align:left; padding:6px 8px;">Unit</th>
        <th style="text-align:right; padding:6px 8px;">Unit Price</th>
        <th style="text-align:right; padding:6px 8px;">Total</th>
      </tr>
    </thead>
    <tbody>
      ${tableRows}
      ${labourRow}
    </tbody>
    <tfoot>
      ${totalRow}
    </tfoot>
  </table>
</div>`;

    // Controls bar
    const controls = `
<div style="display:flex; gap:0.75rem; align-items:center; flex-wrap:wrap; margin-top:1rem;">
  <label style="display:flex; align-items:center; gap:0.4rem; color:var(--color-text); font-size:0.875rem;">
    Country:
    <select
      id="fp-cost-country-select"
      style="font-family:var(--font-mono,monospace); color:var(--color-text); background:var(--color-surface,transparent); border:1px solid var(--color-primary); border-radius:4px; padding:4px 8px; cursor:pointer;"
    >
      ${countryOptions}
    </select>
  </label>
  <button
    id="fp-boq-download-pdf"
    type="button"
    style="margin-left:auto; padding:6px 14px; background:var(--color-primary); color:var(--color-bg,#fff); border:none; border-radius:4px; cursor:pointer; font-size:0.875rem; font-family:inherit;"
  >
    Download BOQ as PDF
  </button>
</div>`;

    // Inline script to wire up editable inputs and country selector
    const inlineScript = `
<script>
(function () {
  var tableEl = document.getElementById('fp-boq-table');
  if (!tableEl) return;

  // Re-calculate totals when a unit price input changes
  tableEl.addEventListener('change', function (e) {
    var input = e.target;
    if (!input.classList.contains('fp-boq-editable')) return;
    var rowIdx = input.getAttribute('data-row');
    var qty = parseFloat(tableEl.querySelector('tr[data-row="' + rowIdx + '"] td:nth-child(2)').textContent.replace(/,/g, '')) || 0;
    var unitPrice = parseFloat(input.value) || 0;
    var newTotal = qty * unitPrice;

    // Update cell
    var totalCell = tableEl.querySelector('[data-total-cell="' + rowIdx + '"]');
    if (totalCell) {
      // Re-use formatCurrency if FPCost is available
      if (window.FPCost) {
        totalCell.textContent = window.FPCost.formatCurrency(newTotal, document.getElementById('fp-cost-country-select').value || 'NG');
      } else {
        totalCell.textContent = Math.round(newTotal).toLocaleString('en-US');
      }
    }

    // Recalculate material total
    var materialTotal = 0;
    tableEl.querySelectorAll('[data-total-cell]').forEach(function (cell) {
      var raw = cell.textContent.replace(/[^0-9.]/g, '');
      materialTotal += parseFloat(raw) || 0;
    });

    var labourPct = ${p.labourPercent || 0.5};
    var labourTotal = materialTotal * labourPct;
    var grandTotal = materialTotal + labourTotal;
    var cc = (document.getElementById('fp-cost-country-select') || {}).value || '${code}';

    var labourCell = document.getElementById('fp-boq-labour-total');
    var grandCell = document.getElementById('fp-boq-grand-total');

    if (window.FPCost) {
      if (labourCell) labourCell.textContent = window.FPCost.formatCurrency(labourTotal, cc);
      if (grandCell) grandCell.textContent = window.FPCost.formatCurrency(grandTotal, cc);
    }
  });

  // Country selector — re-run estimate with new prices
  var countrySelect = document.getElementById('fp-cost-country-select');
  if (countrySelect && window.FPCost && window._fpLastPlanData) {
    countrySelect.addEventListener('change', function () {
      var newCode = countrySelect.value;
      var result = window.FPCost.estimate(window._fpLastPlanData, newCode);
      var html = window.FPCost.renderEstimate(result, newCode);
      var container = tableEl.closest('.fp-cost-container');
      if (container) container.innerHTML = html;
    });
  }
})();
<\/script>`;

    return `<div class="fp-cost-container">${controls}${summaryCards}${boqTable}${inlineScript}</div>`;
  }

  /* =========================================================
   * 5. PUBLIC API
   * ========================================================= */
  const FPCost = {
    MATERIAL_PRICES: MATERIAL_PRICES,
    estimate: estimate,
    renderEstimate: renderEstimate,
    formatCurrency: formatCurrency,
  };

  // Export
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = FPCost;
  } else {
    global.FPCost = FPCost;
  }
})(typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : this);
