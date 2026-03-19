/**
 * AfroTools — Senegal PAYE Widget (DGID 2025)
 * Annual bands: 0% ≤630k, 20% 630k-1.5M, 30% 1.5M-4M, 35% 4M-8M, 37% 8M-13.5M, 40% above
 * IPRES 5.6% + CSS 5.6% (both deductible)
 */
(function() {
  'use strict';
  window.AfroWidgets = window.AfroWidgets || {};

  window.AfroWidgets.sn_paye = function(container, opts) {
    opts = opts || {};
    var fmt = function(n) { return 'FCFA ' + Math.round(n).toLocaleString('en'); };
    var pct = function(r) { return r.toFixed(1) + '%'; };

    // DGID annual progressive bands
    var BANDS = [
      { limit: 630000, rate: 0 },
      { limit: 870000, rate: 0.20 },
      { limit: 2500000, rate: 0.30 },
      { limit: 4000000, rate: 0.35 },
      { limit: 5500000, rate: 0.37 },
      { limit: Infinity, rate: 0.40 }
    ];

    function calculate(grossAnnual) {
      var ipres = grossAnnual * 0.056;
      var css = grossAnnual * 0.056;
      var totalSS = ipres + css;
      var taxable = Math.max(0, grossAnnual - totalSS);
      var tax = 0, rem = taxable;
      for (var i = 0; i < BANDS.length; i++) {
        if (rem <= 0) break;
        var b = BANDS[i];
        var chunk = Math.min(rem, isFinite(b.limit) ? b.limit : rem);
        tax += chunk * b.rate;
        rem -= chunk;
      }
      var net = grossAnnual - totalSS - tax;
      return {
        gross: grossAnnual, ipres: ipres, css: css, totalSS: totalSS,
        taxable: taxable, tax: tax, net: net,
        effectiveRate: grossAnnual > 0 ? tax / grossAnnual * 100 : 0
      };
    }

    container.innerHTML =
      '<div class="aw-title">\uD83C\uDDF8\uD83C\uDDF3 Senegal PAYE Calculator</div>' +
      '<div class="aw-field"><label class="aw-label">Monthly Gross Salary (FCFA)</label>' +
        '<input class="aw-input" id="awSnGross" type="text" inputmode="numeric" placeholder="e.g. 1,000,000">' +
      '</div>' +
      '<button class="aw-btn aw-btn--primary" id="awSnCalc">Calculate PAYE</button>' +
      '<div id="awSnResult"></div>' +
      (opts.footerHTML || '');

    container.querySelector('#awSnCalc').addEventListener('click', function() {
      var monthly = parseFloat((container.querySelector('#awSnGross').value || '').replace(/[^0-9.]/g, '')) || 0;
      if (!monthly) return;
      var R = calculate(monthly * 12);
      container.querySelector('#awSnResult').innerHTML =
        '<div class="aw-result-box">' +
          '<div class="aw-result-label">Monthly Take-Home (DGID 2025)</div>' +
          '<div class="aw-result-main">' + fmt(R.net / 12) + '</div>' +
        '</div>' +
        '<div style="margin-top:12px">' +
          '<div class="aw-result-row"><span>Monthly Gross</span><span>' + fmt(monthly) + '</span></div>' +
          '<div class="aw-result-row"><span>IPRES (5.6%)</span><span>-' + fmt(R.ipres / 12) + '</span></div>' +
          '<div class="aw-result-row"><span>CSS (5.6%)</span><span>-' + fmt(R.css / 12) + '</span></div>' +
          '<div class="aw-result-row"><span>Taxable Income</span><span>' + fmt(R.taxable / 12) + '</span></div>' +
          '<hr class="aw-divider">' +
          '<div class="aw-result-row"><span>PAYE Tax</span><span style="color:#dc2626">-' + fmt(R.tax / 12) + '</span></div>' +
          '<div class="aw-result-row"><span>Effective Rate</span><span>' + pct(R.effectiveRate) + '</span></div>' +
          '<hr class="aw-divider">' +
          '<div class="aw-result-row" style="font-weight:700"><span>Net Salary</span><span style="color:#007AFF">' + fmt(R.net / 12) + '</span></div>' +
          '<div class="aw-result-row" style="font-weight:700"><span>Annual Net</span><span style="color:#007AFF">' + fmt(R.net) + '</span></div>' +
        '</div>';
    });

    container.querySelector('#awSnGross').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') container.querySelector('#awSnCalc').click();
    });
  };
})();
