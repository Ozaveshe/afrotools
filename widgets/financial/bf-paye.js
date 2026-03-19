/**
 * AfroTools — Burkina Faso PAYE Widget (DGI 2025)
 * Annual bands: 0% ≤300k, 8.25% 300-600k, 13.75% 600-900k, 16.5% 900k-1.5M, 22% 1.5-3M, 27.5% above
 * CNSS 5.5% (cap 600k/mo = 7.2M/yr, deductible)
 */
(function() {
  'use strict';
  window.AfroWidgets = window.AfroWidgets || {};

  window.AfroWidgets.bf_paye = function(container, opts) {
    opts = opts || {};
    var fmt = function(n) { return 'FCFA ' + Math.round(n).toLocaleString('en'); };
    var pct = function(r) { return r.toFixed(1) + '%'; };

    // DGI annual progressive bands (IUTS)
    var BANDS = [
      { limit: 300000, rate: 0 },
      { limit: 300000, rate: 0.0825 },
      { limit: 300000, rate: 0.1375 },
      { limit: 600000, rate: 0.165 },
      { limit: 1500000, rate: 0.22 },
      { limit: Infinity, rate: 0.275 }
    ];

    function calculate(grossAnnual) {
      var cnssCeiling = 600000 * 12;
      var cnssBase = Math.min(grossAnnual, cnssCeiling);
      var cnss = cnssBase * 0.055;
      var taxable = Math.max(0, grossAnnual - cnss);
      var tax = 0, rem = taxable;
      for (var i = 0; i < BANDS.length; i++) {
        if (rem <= 0) break;
        var b = BANDS[i];
        var chunk = Math.min(rem, isFinite(b.limit) ? b.limit : rem);
        tax += chunk * b.rate;
        rem -= chunk;
      }
      var net = grossAnnual - cnss - tax;
      return {
        gross: grossAnnual, cnss: cnss, taxable: taxable,
        tax: tax, net: net,
        effectiveRate: grossAnnual > 0 ? tax / grossAnnual * 100 : 0
      };
    }

    container.innerHTML =
      '<div class="aw-title">\uD83C\uDDE7\uD83C\uDDEB Burkina Faso PAYE Calculator</div>' +
      '<div class="aw-field"><label class="aw-label">Monthly Gross Salary (FCFA)</label>' +
        '<input class="aw-input" id="awBfGross" type="text" inputmode="numeric" placeholder="e.g. 300,000">' +
      '</div>' +
      '<button class="aw-btn aw-btn--primary" id="awBfCalc">Calculate PAYE</button>' +
      '<div id="awBfResult"></div>' +
      (opts.footerHTML || '');

    container.querySelector('#awBfCalc').addEventListener('click', function() {
      var monthly = parseFloat((container.querySelector('#awBfGross').value || '').replace(/[^0-9.]/g, '')) || 0;
      if (!monthly) return;
      var R = calculate(monthly * 12);
      container.querySelector('#awBfResult').innerHTML =
        '<div class="aw-result-box">' +
          '<div class="aw-result-label">Monthly Take-Home (DGI 2025)</div>' +
          '<div class="aw-result-main">' + fmt(R.net / 12) + '</div>' +
        '</div>' +
        '<div style="margin-top:12px">' +
          '<div class="aw-result-row"><span>Monthly Gross</span><span>' + fmt(monthly) + '</span></div>' +
          '<div class="aw-result-row"><span>CNSS (5.5%, cap 600k/mo)</span><span>-' + fmt(R.cnss / 12) + '</span></div>' +
          '<div class="aw-result-row"><span>Taxable Income</span><span>' + fmt(R.taxable / 12) + '</span></div>' +
          '<hr class="aw-divider">' +
          '<div class="aw-result-row"><span>IUTS Tax</span><span style="color:#dc2626">-' + fmt(R.tax / 12) + '</span></div>' +
          '<div class="aw-result-row"><span>Effective Rate</span><span>' + pct(R.effectiveRate) + '</span></div>' +
          '<hr class="aw-divider">' +
          '<div class="aw-result-row" style="font-weight:700"><span>Net Salary</span><span style="color:#007AFF">' + fmt(R.net / 12) + '</span></div>' +
          '<div class="aw-result-row" style="font-weight:700"><span>Annual Net</span><span style="color:#007AFF">' + fmt(R.net) + '</span></div>' +
        '</div>';
    });

    container.querySelector('#awBfGross').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') container.querySelector('#awBfCalc').click();
    });
  };
})();
