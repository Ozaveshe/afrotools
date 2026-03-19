/**
 * AfroTools — Mauritius PAYE Widget (MRA 2025)
 * Annual bands: 0% ≤390k, 10% 390-650k, 12.5% 650k-1M, 15% above 1M
 * CSG 3% (not deductible from tax)
 */
(function() {
  'use strict';
  window.AfroWidgets = window.AfroWidgets || {};

  window.AfroWidgets.mu_paye = function(container, opts) {
    opts = opts || {};
    var fmt = function(n) { return 'MUR ' + Math.round(n).toLocaleString('en'); };
    var pct = function(r) { return r.toFixed(1) + '%'; };

    // MRA annual progressive bands
    var BANDS = [
      { limit: 390000, rate: 0 },
      { limit: 260000, rate: 0.10 },
      { limit: 350000, rate: 0.125 },
      { limit: Infinity, rate: 0.15 }
    ];

    function calculate(grossAnnual) {
      var csg = grossAnnual * 0.03;
      var tax = 0, rem = grossAnnual;
      for (var i = 0; i < BANDS.length; i++) {
        if (rem <= 0) break;
        var b = BANDS[i];
        var chunk = Math.min(rem, isFinite(b.limit) ? b.limit : rem);
        tax += chunk * b.rate;
        rem -= chunk;
      }
      var net = grossAnnual - csg - tax;
      return {
        gross: grossAnnual, csg: csg, tax: tax, net: net,
        effectiveRate: grossAnnual > 0 ? tax / grossAnnual * 100 : 0
      };
    }

    container.innerHTML =
      '<div class="aw-title">\uD83C\uDDF2\uD83C\uDDFA Mauritius PAYE Calculator</div>' +
      '<div class="aw-field"><label class="aw-label">Monthly Gross Salary (MUR)</label>' +
        '<input class="aw-input" id="awMuGross" type="text" inputmode="numeric" placeholder="e.g. 80,000">' +
      '</div>' +
      '<button class="aw-btn aw-btn--primary" id="awMuCalc">Calculate PAYE</button>' +
      '<div id="awMuResult"></div>' +
      (opts.footerHTML || '');

    container.querySelector('#awMuCalc').addEventListener('click', function() {
      var monthly = parseFloat((container.querySelector('#awMuGross').value || '').replace(/[^0-9.]/g, '')) || 0;
      if (!monthly) return;
      var R = calculate(monthly * 12);
      container.querySelector('#awMuResult').innerHTML =
        '<div class="aw-result-box">' +
          '<div class="aw-result-label">Monthly Take-Home (MRA 2025)</div>' +
          '<div class="aw-result-main">' + fmt(R.net / 12) + '</div>' +
        '</div>' +
        '<div style="margin-top:12px">' +
          '<div class="aw-result-row"><span>Monthly Gross</span><span>' + fmt(monthly) + '</span></div>' +
          '<div class="aw-result-row"><span>CSG (3%)</span><span>-' + fmt(R.csg / 12) + '</span></div>' +
          '<hr class="aw-divider">' +
          '<div class="aw-result-row"><span>PAYE Tax</span><span style="color:#dc2626">-' + fmt(R.tax / 12) + '</span></div>' +
          '<div class="aw-result-row"><span>Effective Rate</span><span>' + pct(R.effectiveRate) + '</span></div>' +
          '<hr class="aw-divider">' +
          '<div class="aw-result-row" style="font-weight:700"><span>Net Salary</span><span style="color:#007AFF">' + fmt(R.net / 12) + '</span></div>' +
          '<div class="aw-result-row" style="font-weight:700"><span>Annual Net</span><span style="color:#007AFF">' + fmt(R.net) + '</span></div>' +
        '</div>';
    });

    container.querySelector('#awMuGross').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') container.querySelector('#awMuCalc').click();
    });
  };
})();
