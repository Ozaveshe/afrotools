/**
 * AfroTools — Comoros PAYE Widget (DGI 2025)
 * Annual bands: 0% ≤300k, 10% 300-600k, 20% 600-1.2M, 30% 1.2-2.4M, 35% above 2.4M
 * CNPS 2.5% (deductible)
 */
(function() {
  'use strict';
  window.AfroWidgets = window.AfroWidgets || {};

  window.AfroWidgets.km_paye = function(container, opts) {
    opts = opts || {};
    var fmt = function(n) { return 'KMF ' + Math.round(n).toLocaleString('en'); };
    var pct = function(r) { return r.toFixed(1) + '%'; };

    // DGI annual progressive bands
    var BANDS = [
      { limit: 300000, rate: 0 },
      { limit: 300000, rate: 0.10 },
      { limit: 600000, rate: 0.20 },
      { limit: 1200000, rate: 0.30 },
      { limit: Infinity, rate: 0.35 }
    ];

    function calculate(grossAnnual) {
      var cnps = grossAnnual * 0.025;
      var taxable = Math.max(0, grossAnnual - cnps);
      var tax = 0, rem = taxable;
      for (var i = 0; i < BANDS.length; i++) {
        if (rem <= 0) break;
        var b = BANDS[i];
        var chunk = Math.min(rem, isFinite(b.limit) ? b.limit : rem);
        tax += chunk * b.rate;
        rem -= chunk;
      }
      var net = grossAnnual - cnps - tax;
      return {
        gross: grossAnnual, cnps: cnps, taxable: taxable,
        tax: tax, net: net,
        effectiveRate: grossAnnual > 0 ? tax / grossAnnual * 100 : 0
      };
    }

    container.innerHTML =
      '<div class="aw-title">\uD83C\uDDF0\uD83C\uDDF2 Comoros PAYE Calculator</div>' +
      '<div class="aw-field"><label class="aw-label">Monthly Gross Salary (KMF)</label>' +
        '<input class="aw-input" id="awKmGross" type="text" inputmode="numeric" placeholder="e.g. 300,000">' +
      '</div>' +
      '<button class="aw-btn aw-btn--primary" id="awKmCalc">Calculate PAYE</button>' +
      '<div id="awKmResult"></div>' +
      (opts.footerHTML || '');

    container.querySelector('#awKmCalc').addEventListener('click', function() {
      var monthly = parseFloat((container.querySelector('#awKmGross').value || '').replace(/[^0-9.]/g, '')) || 0;
      if (!monthly) return;
      var R = calculate(monthly * 12);
      container.querySelector('#awKmResult').innerHTML =
        '<div class="aw-result-box">' +
          '<div class="aw-result-label">Monthly Take-Home (DGI 2025)</div>' +
          '<div class="aw-result-main">' + fmt(R.net / 12) + '</div>' +
        '</div>' +
        '<div style="margin-top:12px">' +
          '<div class="aw-result-row"><span>Monthly Gross</span><span>' + fmt(monthly) + '</span></div>' +
          '<div class="aw-result-row"><span>CNPS (2.5%)</span><span>-' + fmt(R.cnps / 12) + '</span></div>' +
          '<div class="aw-result-row"><span>Taxable Income</span><span>' + fmt(R.taxable / 12) + '</span></div>' +
          '<hr class="aw-divider">' +
          '<div class="aw-result-row"><span>PAYE Tax</span><span style="color:#dc2626">-' + fmt(R.tax / 12) + '</span></div>' +
          '<div class="aw-result-row"><span>Effective Rate</span><span>' + pct(R.effectiveRate) + '</span></div>' +
          '<hr class="aw-divider">' +
          '<div class="aw-result-row" style="font-weight:700"><span>Net Salary</span><span style="color:#007AFF">' + fmt(R.net / 12) + '</span></div>' +
          '<div class="aw-result-row" style="font-weight:700"><span>Annual Net</span><span style="color:#007AFF">' + fmt(R.net) + '</span></div>' +
        '</div>';
    });

    container.querySelector('#awKmGross').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') container.querySelector('#awKmCalc').click();
    });
  };
})();
