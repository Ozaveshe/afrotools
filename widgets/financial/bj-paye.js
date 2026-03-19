/**
 * AfroTools — Benin PAYE Widget (DGI 2025)
 * Annual bands: 0% ≤300k, 10% 300-840k, 15% 840k-1.68M, 25% 1.68-3.36M, 30% 3.36-8.4M, 35% above
 * CNSS 3.6% (deductible)
 */
(function() {
  'use strict';
  window.AfroWidgets = window.AfroWidgets || {};

  window.AfroWidgets.bj_paye = function(container, opts) {
    opts = opts || {};
    var fmt = function(n) { return 'FCFA ' + Math.round(n).toLocaleString('en'); };
    var pct = function(r) { return r.toFixed(1) + '%'; };

    // DGI annual progressive bands (IPTS)
    var BANDS = [
      { limit: 300000, rate: 0 },
      { limit: 540000, rate: 0.10 },
      { limit: 840000, rate: 0.15 },
      { limit: 1680000, rate: 0.25 },
      { limit: 5040000, rate: 0.30 },
      { limit: Infinity, rate: 0.35 }
    ];

    function calculate(grossAnnual) {
      var cnss = grossAnnual * 0.036;
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
      '<div class="aw-title">\uD83C\uDDE7\uD83C\uDDEF Benin PAYE Calculator</div>' +
      '<div class="aw-field"><label class="aw-label">Monthly Gross Salary (FCFA)</label>' +
        '<input class="aw-input" id="awBjGross" type="text" inputmode="numeric" placeholder="e.g. 400,000">' +
      '</div>' +
      '<button class="aw-btn aw-btn--primary" id="awBjCalc">Calculate PAYE</button>' +
      '<div id="awBjResult"></div>' +
      (opts.footerHTML || '');

    container.querySelector('#awBjCalc').addEventListener('click', function() {
      var monthly = parseFloat((container.querySelector('#awBjGross').value || '').replace(/[^0-9.]/g, '')) || 0;
      if (!monthly) return;
      var R = calculate(monthly * 12);
      container.querySelector('#awBjResult').innerHTML =
        '<div class="aw-result-box">' +
          '<div class="aw-result-label">Monthly Take-Home (DGI 2025)</div>' +
          '<div class="aw-result-main">' + fmt(R.net / 12) + '</div>' +
        '</div>' +
        '<div style="margin-top:12px">' +
          '<div class="aw-result-row"><span>Monthly Gross</span><span>' + fmt(monthly) + '</span></div>' +
          '<div class="aw-result-row"><span>CNSS (3.6%)</span><span>-' + fmt(R.cnss / 12) + '</span></div>' +
          '<div class="aw-result-row"><span>Taxable Income</span><span>' + fmt(R.taxable / 12) + '</span></div>' +
          '<hr class="aw-divider">' +
          '<div class="aw-result-row"><span>IPTS Tax</span><span style="color:#dc2626">-' + fmt(R.tax / 12) + '</span></div>' +
          '<div class="aw-result-row"><span>Effective Rate</span><span>' + pct(R.effectiveRate) + '</span></div>' +
          '<hr class="aw-divider">' +
          '<div class="aw-result-row" style="font-weight:700"><span>Net Salary</span><span style="color:#007AFF">' + fmt(R.net / 12) + '</span></div>' +
          '<div class="aw-result-row" style="font-weight:700"><span>Annual Net</span><span style="color:#007AFF">' + fmt(R.net) + '</span></div>' +
        '</div>';
    });

    container.querySelector('#awBjGross').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') container.querySelector('#awBjCalc').click();
    });
  };
})();
