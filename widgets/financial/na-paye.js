/**
 * AfroTools — Namibia PAYE Widget (NamRA 2025/26)
 * Annual bands: 0% ≤N$100k, 18% 100-150k, 25% 150-250k, 28% 250-500k,
 * 30% 500k-1M, 32% 1-1.5M, 37% above 1.5M
 * SSC N$81/mo flat
 */
(function() {
  'use strict';
  window.AfroWidgets = window.AfroWidgets || {};

  window.AfroWidgets.na_paye = function(container, opts) {
    opts = opts || {};
    var fmt = function(n) { return 'N$' + Math.round(n).toLocaleString('en'); };
    var pct = function(r) { return r.toFixed(1) + '%'; };

    // NamRA annual progressive bands
    var BANDS = [
      { limit: 100000, rate: 0 },
      { limit: 50000, rate: 0.18 },
      { limit: 100000, rate: 0.25 },
      { limit: 250000, rate: 0.28 },
      { limit: 500000, rate: 0.30 },
      { limit: 500000, rate: 0.32 },
      { limit: Infinity, rate: 0.37 }
    ];

    function calculate(grossAnnual) {
      var ssc = 81 * 12;
      var taxable = Math.max(0, grossAnnual - ssc);
      var tax = 0, rem = taxable;
      for (var i = 0; i < BANDS.length; i++) {
        if (rem <= 0) break;
        var b = BANDS[i];
        var chunk = Math.min(rem, isFinite(b.limit) ? b.limit : rem);
        tax += chunk * b.rate;
        rem -= chunk;
      }
      var net = grossAnnual - ssc - tax;
      return {
        gross: grossAnnual, ssc: ssc, taxable: taxable,
        tax: tax, net: net,
        effectiveRate: grossAnnual > 0 ? tax / grossAnnual * 100 : 0
      };
    }

    container.innerHTML =
      '<div class="aw-title">\uD83C\uDDF3\uD83C\uDDE6 Namibia PAYE Calculator</div>' +
      '<div class="aw-field"><label class="aw-label">Monthly Gross Salary (NAD)</label>' +
        '<input class="aw-input" id="awNaGross" type="text" inputmode="numeric" placeholder="e.g. 25,000">' +
      '</div>' +
      '<button class="aw-btn aw-btn--primary" id="awNaCalc">Calculate PAYE</button>' +
      '<div id="awNaResult"></div>' +
      (opts.footerHTML || '');

    container.querySelector('#awNaCalc').addEventListener('click', function() {
      var monthly = parseFloat((container.querySelector('#awNaGross').value || '').replace(/[^0-9.]/g, '')) || 0;
      if (!monthly) return;
      var R = calculate(monthly * 12);
      container.querySelector('#awNaResult').innerHTML =
        '<div class="aw-result-box">' +
          '<div class="aw-result-label">Monthly Take-Home (NamRA 2025/26)</div>' +
          '<div class="aw-result-main">' + fmt(R.net / 12) + '</div>' +
        '</div>' +
        '<div style="margin-top:12px">' +
          '<div class="aw-result-row"><span>Monthly Gross</span><span>' + fmt(monthly) + '</span></div>' +
          '<div class="aw-result-row"><span>SSC (N$81/mo flat)</span><span>-' + fmt(R.ssc / 12) + '</span></div>' +
          '<div class="aw-result-row"><span>Taxable Income</span><span>' + fmt(R.taxable / 12) + '</span></div>' +
          '<hr class="aw-divider">' +
          '<div class="aw-result-row"><span>PAYE Tax</span><span style="color:#dc2626">-' + fmt(R.tax / 12) + '</span></div>' +
          '<div class="aw-result-row"><span>Effective Rate</span><span>' + pct(R.effectiveRate) + '</span></div>' +
          '<hr class="aw-divider">' +
          '<div class="aw-result-row" style="font-weight:700"><span>Net Salary</span><span style="color:#007AFF">' + fmt(R.net / 12) + '</span></div>' +
          '<div class="aw-result-row" style="font-weight:700"><span>Annual Net</span><span style="color:#007AFF">' + fmt(R.net) + '</span></div>' +
        '</div>';
    });

    container.querySelector('#awNaGross').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') container.querySelector('#awNaCalc').click();
    });
  };
})();
