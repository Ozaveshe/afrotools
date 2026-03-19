/**
 * AfroTools — Equatorial Guinea PAYE Widget (DGI 2025)
 * Annual bands: 0% ≤1M, 10% 1-3M, 15% 3-5M, 20% 5-10M, 25% 10-15M, 30% 15-25M, 35% above
 * Social Security 4.5% (deductible)
 */
(function() {
  'use strict';
  window.AfroWidgets = window.AfroWidgets || {};

  window.AfroWidgets.gq_paye = function(container, opts) {
    opts = opts || {};
    var fmt = function(n) { return 'FCFA ' + Math.round(n).toLocaleString('en'); };
    var pct = function(r) { return r.toFixed(1) + '%'; };

    // DGI annual progressive bands
    var BANDS = [
      { limit: 1000000, rate: 0 },
      { limit: 2000000, rate: 0.10 },
      { limit: 2000000, rate: 0.15 },
      { limit: 5000000, rate: 0.20 },
      { limit: 5000000, rate: 0.25 },
      { limit: 10000000, rate: 0.30 },
      { limit: Infinity, rate: 0.35 }
    ];

    function calculate(grossAnnual) {
      var ss = grossAnnual * 0.045;
      var taxable = Math.max(0, grossAnnual - ss);
      var tax = 0, rem = taxable;
      for (var i = 0; i < BANDS.length; i++) {
        if (rem <= 0) break;
        var b = BANDS[i];
        var chunk = Math.min(rem, isFinite(b.limit) ? b.limit : rem);
        tax += chunk * b.rate;
        rem -= chunk;
      }
      var net = grossAnnual - ss - tax;
      return {
        gross: grossAnnual, ss: ss, taxable: taxable,
        tax: tax, net: net,
        effectiveRate: grossAnnual > 0 ? tax / grossAnnual * 100 : 0
      };
    }

    container.innerHTML =
      '<div class="aw-title">\uD83C\uDDEC\uD83C\uDDF6 Equatorial Guinea PAYE Calculator</div>' +
      '<div class="aw-field"><label class="aw-label">Monthly Gross Salary (FCFA)</label>' +
        '<input class="aw-input" id="awGqGross" type="text" inputmode="numeric" placeholder="e.g. 1,000,000">' +
      '</div>' +
      '<button class="aw-btn aw-btn--primary" id="awGqCalc">Calculate PAYE</button>' +
      '<div id="awGqResult"></div>' +
      (opts.footerHTML || '');

    container.querySelector('#awGqCalc').addEventListener('click', function() {
      var monthly = parseFloat((container.querySelector('#awGqGross').value || '').replace(/[^0-9.]/g, '')) || 0;
      if (!monthly) return;
      var R = calculate(monthly * 12);
      container.querySelector('#awGqResult').innerHTML =
        '<div class="aw-result-box">' +
          '<div class="aw-result-label">Monthly Take-Home (DGI 2025)</div>' +
          '<div class="aw-result-main">' + fmt(R.net / 12) + '</div>' +
        '</div>' +
        '<div style="margin-top:12px">' +
          '<div class="aw-result-row"><span>Monthly Gross</span><span>' + fmt(monthly) + '</span></div>' +
          '<div class="aw-result-row"><span>Social Security (4.5%)</span><span>-' + fmt(R.ss / 12) + '</span></div>' +
          '<div class="aw-result-row"><span>Taxable Income</span><span>' + fmt(R.taxable / 12) + '</span></div>' +
          '<hr class="aw-divider">' +
          '<div class="aw-result-row"><span>PAYE Tax</span><span style="color:#dc2626">-' + fmt(R.tax / 12) + '</span></div>' +
          '<div class="aw-result-row"><span>Effective Rate</span><span>' + pct(R.effectiveRate) + '</span></div>' +
          '<hr class="aw-divider">' +
          '<div class="aw-result-row" style="font-weight:700"><span>Net Salary</span><span style="color:#007AFF">' + fmt(R.net / 12) + '</span></div>' +
          '<div class="aw-result-row" style="font-weight:700"><span>Annual Net</span><span style="color:#007AFF">' + fmt(R.net) + '</span></div>' +
        '</div>';
    });

    container.querySelector('#awGqGross').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') container.querySelector('#awGqCalc').click();
    });
  };
})();
