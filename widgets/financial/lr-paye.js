/**
 * AfroTools — Liberia PAYE Widget (LRA 2025)
 * Annual bands: 0% ≤70k, 5% 70-200k, 15% 200-400k, 20% 400-600k, 25% above 600k
 * NASSCORP 3% (deductible)
 */
(function() {
  'use strict';
  window.AfroWidgets = window.AfroWidgets || {};

  window.AfroWidgets.lr_paye = function(container, opts) {
    opts = opts || {};
    var fmt = function(n) { return 'LRD ' + Math.round(n).toLocaleString('en'); };
    var pct = function(r) { return r.toFixed(1) + '%'; };

    // LRA annual progressive bands
    var BANDS = [
      { limit: 70000, rate: 0 },
      { limit: 130000, rate: 0.05 },
      { limit: 200000, rate: 0.15 },
      { limit: 200000, rate: 0.20 },
      { limit: Infinity, rate: 0.25 }
    ];

    function calculate(grossAnnual) {
      var nasscorp = grossAnnual * 0.03;
      var taxable = Math.max(0, grossAnnual - nasscorp);
      var tax = 0, rem = taxable;
      for (var i = 0; i < BANDS.length; i++) {
        if (rem <= 0) break;
        var b = BANDS[i];
        var chunk = Math.min(rem, isFinite(b.limit) ? b.limit : rem);
        tax += chunk * b.rate;
        rem -= chunk;
      }
      var net = grossAnnual - nasscorp - tax;
      return {
        gross: grossAnnual, nasscorp: nasscorp, taxable: taxable,
        tax: tax, net: net,
        effectiveRate: grossAnnual > 0 ? tax / grossAnnual * 100 : 0
      };
    }

    container.innerHTML =
      '<div class="aw-title">\uD83C\uDDF1\uD83C\uDDF7 Liberia PAYE Calculator</div>' +
      '<div class="aw-field"><label class="aw-label">Monthly Gross Salary (LRD)</label>' +
        '<input class="aw-input" id="awLrGross" type="text" inputmode="numeric" placeholder="e.g. 50,000">' +
      '</div>' +
      '<button class="aw-btn aw-btn--primary" id="awLrCalc">Calculate PAYE</button>' +
      '<div id="awLrResult"></div>' +
      (opts.footerHTML || '');

    container.querySelector('#awLrCalc').addEventListener('click', function() {
      var monthly = parseFloat((container.querySelector('#awLrGross').value || '').replace(/[^0-9.]/g, '')) || 0;
      if (!monthly) return;
      var R = calculate(monthly * 12);
      container.querySelector('#awLrResult').innerHTML =
        '<div class="aw-result-box">' +
          '<div class="aw-result-label">Monthly Take-Home (LRA 2025)</div>' +
          '<div class="aw-result-main">' + fmt(R.net / 12) + '</div>' +
        '</div>' +
        '<div style="margin-top:12px">' +
          '<div class="aw-result-row"><span>Monthly Gross</span><span>' + fmt(monthly) + '</span></div>' +
          '<div class="aw-result-row"><span>NASSCORP (3%)</span><span>-' + fmt(R.nasscorp / 12) + '</span></div>' +
          '<div class="aw-result-row"><span>Taxable Income</span><span>' + fmt(R.taxable / 12) + '</span></div>' +
          '<hr class="aw-divider">' +
          '<div class="aw-result-row"><span>PAYE Tax</span><span style="color:#dc2626">-' + fmt(R.tax / 12) + '</span></div>' +
          '<div class="aw-result-row"><span>Effective Rate</span><span>' + pct(R.effectiveRate) + '</span></div>' +
          '<hr class="aw-divider">' +
          '<div class="aw-result-row" style="font-weight:700"><span>Net Salary</span><span style="color:#007AFF">' + fmt(R.net / 12) + '</span></div>' +
          '<div class="aw-result-row" style="font-weight:700"><span>Annual Net</span><span style="color:#007AFF">' + fmt(R.net) + '</span></div>' +
        '</div>';
    });

    container.querySelector('#awLrGross').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') container.querySelector('#awLrCalc').click();
    });
  };
})();
