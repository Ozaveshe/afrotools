(function fertilizerCalcController(root) {
  'use strict';
  var engine = root.AfroTools && root.AfroTools.FertilizerCalcEngine;
  var data = root.AfroTools && root.AfroTools.FertilizerCalcData;
  function id(value) { return document.getElementById(value); }
  function calculate() {
    var result = engine.calculate({
      cropId: id('crop').value,
      area: id('area').value,
      soil: id('soil').value,
      target: id('yieldTarget').value,
      currency: id('currency').value
    }, data);
    if (!result.ok) return result;
    var p = result.perHectare;
    var t = result.totals;
    var b = result.bags;
    var c = result.cost;
    id('summaryCards').innerHTML =
      '<div class="result-card highlight"><div class="result-label">Nitrogen (N)</div><div class="result-value">' + t.n + '<span class="result-unit"> kg</span></div></div>' +
      '<div class="result-card highlight"><div class="result-label">Phosphorus (P2O5)</div><div class="result-value">' + t.p + '<span class="result-unit"> kg</span></div></div>' +
      '<div class="result-card highlight"><div class="result-label">Potassium (K2O)</div><div class="result-value">' + t.k + '<span class="result-unit"> kg</span></div></div>' +
      '<div class="result-card"><div class="result-label">Per Hectare</div><div class="result-value">' + p.n + ':' + p.p + ':' + p.k + '<span class="result-unit"> N:P:K kg/ha</span></div></div>';
    id('npkVisual').innerHTML =
      '<div class="npk-bar"><div class="npk-n" style="width:' + (p.n / (p.n + p.p + p.k) * 100).toFixed(1) + '%"></div><div class="npk-p" style="width:' + (p.p / (p.n + p.p + p.k) * 100).toFixed(1) + '%"></div><div class="npk-k" style="width:' + (p.k / (p.n + p.p + p.k) * 100).toFixed(1) + '%"></div></div>' +
      '<div class="npk-legend"><span class="ln">N ' + result.ratioPercent.n + '%</span><span class="lp">P ' + result.ratioPercent.p + '%</span><span class="lk">K ' + result.ratioPercent.k + '%</span></div>';
    var schedule = '<thead><tr><th>Timing</th><th>Application</th></tr></thead><tbody>';
    result.schedule.forEach(function scheduleRow(value, index) {
      schedule += '<tr><td style="font-weight:600">Stage ' + (index + 1) + '</td><td>' + value + '</td></tr>';
    });
    id('scheduleTable').innerHTML = schedule + '</tbody>';
    id('costCards').innerHTML =
      '<div class="result-card"><div class="result-label">Urea (46-0-0)</div><div class="result-value">' + b.urea + '<span class="result-unit"> bags (50kg)</span></div><div style="font-size:.8rem;color:#64748b;margin-top:.25rem">' + c.symbol + c.urea.toLocaleString() + '</div></div>' +
      '<div class="result-card"><div class="result-label">NPK 15-15-15</div><div class="result-value">' + b.npk15 + '<span class="result-unit"> bags (50kg)</span></div><div style="font-size:.8rem;color:#64748b;margin-top:.25rem">' + c.symbol + c.npk15.toLocaleString() + '</div></div>' +
      '<div class="result-card highlight"><div class="result-label">Total Est. Cost</div><div class="result-value">' + c.symbol + c.total.toLocaleString() + '</div></div>';
    id('costNote').textContent = result.subsidy || 'Prices are approximate ' + result.input.currency + ' market rates for 50kg bags. Actual prices vary by location, supplier, and season.';
    var cattle = result.organicEquivalent.cattleTonnes;
    var poultry = result.organicEquivalent.poultryTonnes;
    id('organicEquiv').innerHTML = '<strong>&#x1F33F; Organic Equivalent:</strong> To supply equivalent NPK using well-decomposed <strong>cattle manure</strong> (~0.5% N, 0.25% P, 0.5% K), apply approximately <strong>' + cattle + '&#x2013;' + (cattle + 2) + ' tonnes/ha</strong>. Using <strong>poultry manure</strong> (~3% N, 2% P, 1.5% K): roughly <strong>' + poultry + '&#x2013;' + (poultry + 1) + ' tonnes/ha</strong>. Compost: 8&#x2013;12 t/ha depending on quality. Best practice: combine 50% organic + 50% inorganic on depleted soils for improved soil structure and cost savings.';
    if (result.microTip) {
      id('microTips').innerHTML = '<strong>&#x1F52C; Micronutrient Tips:</strong> ' + result.microTip;
      id('microTips').style.display = 'block';
    } else id('microTips').style.display = 'none';
    id('yieldCards').innerHTML =
      '<div class="result-card highlight"><div class="result-label">Expected Yield</div><div class="result-value">' + result.yieldEstimate.toFixed(1) + '<span class="result-unit"> ' + result.crop.unit + '</span></div></div>' +
      '<div class="result-card"><div class="result-label">Yield Target</div><div class="result-value">' + result.input.target.charAt(0).toUpperCase() + result.input.target.slice(1) + '</div></div>' +
      '<div class="result-card"><div class="result-label">Total Area</div><div class="result-value">' + result.input.area + '<span class="result-unit"> hectares</span></div></div>';
    id('results').style.display = 'block';
    id('results').scrollIntoView({ behavior: 'smooth' });
    root.FERTILIZER_CALC_LAST_RESULT = result;
    return result;
  }
  root.calculate = calculate;
  root.AfroTools.FertilizerCalcController = { calculate: calculate };
})(typeof window !== 'undefined' ? window : globalThis);
