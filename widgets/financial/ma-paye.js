/**
 * AfroTools — Morocco PAYE Widget (DGI 2025)
 * Annual bands: 0% ≤30k, 10% 30-50k, 20% 50-60k, 30% 60-80k, 34% 80-180k, 38% above 180k
 * CNSS 4.48% (cap MAD 6k/mo = 72k/yr)
 */
(function() {
  'use strict';
  window.AfroWidgets = window.AfroWidgets || {};

  window.AfroWidgets.ma_paye = function(container, opts) {
    opts = opts || {};
    var fmt = function(n) { return 'MAD ' + Math.round(n).toLocaleString('en'); };
    var pct = function(r) { return r.toFixed(1) + '%'; };

    // DGI annual progressive bands
    var BANDS = [
      { limit: 30000, rate: 0 },
      { limit: 20000, rate: 0.10 },
      { limit: 10000, rate: 0.20 },
      { limit: 20000, rate: 0.30 },
      { limit: 100000, rate: 0.34 },
      { limit: Infinity, rate: 0.38 }
    ];

    function calculate(grossAnnual) {
      var cnssCeiling = 6000 * 12;
      var cnssBase = Math.min(grossAnnual, cnssCeiling);
      var cnss = cnssBase * 0.0448;
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
      '<div class="aw-title">\uD83C\uDDF2\uD83C\uDDE6 Morocco PAYE Calculator</div>' +
      '<div class="aw-field"><label class="aw-label">Monthly Gross Salary (MAD)</label>' +
        '<input class="aw-input" id="awMaGross" type="text" inputmode="numeric" placeholder="e.g. 15,000">' +
      '</div>' +
      '<button class="aw-btn aw-btn--primary" id="awMaCalc">Calculate PAYE</button>' +
      '<div id="awMaResult"></div>' +
      (opts.footerHTML || '');

    container.querySelector('#awMaCalc').addEventListener('click', function() {
      var monthly = parseFloat((container.querySelector('#awMaGross').value || '').replace(/[^0-9.]/g, '')) || 0;
      if (!monthly) return;
      var R = calculate(monthly * 12);
      container.querySelector('#awMaResult').innerHTML =
        '<div class="aw-result-box">' +
          '<div class="aw-result-label">Monthly Take-Home (DGI 2025)</div>' +
          '<div class="aw-result-main">' + fmt(R.net / 12) + '</div>' +
        '</div>' +
        '<div style="margin-top:12px">' +
          '<div class="aw-result-row"><span>Monthly Gross</span><span>' + fmt(monthly) + '</span></div>' +
          '<div class="aw-result-row"><span>CNSS (4.48%, cap 6k/mo)</span><span>-' + fmt(R.cnss / 12) + '</span></div>' +
          '<div class="aw-result-row"><span>Taxable Income</span><span>' + fmt(R.taxable / 12) + '</span></div>' +
          '<hr class="aw-divider">' +
          '<div class="aw-result-row"><span>IR Tax</span><span style="color:#dc2626">-' + fmt(R.tax / 12) + '</span></div>' +
          '<div class="aw-result-row"><span>Effective Rate</span><span>' + pct(R.effectiveRate) + '</span></div>' +
          '<hr class="aw-divider">' +
          '<div class="aw-result-row" style="font-weight:700"><span>Net Salary</span><span style="color:#007AFF">' + fmt(R.net / 12) + '</span></div>' +
          '<div class="aw-result-row" style="font-weight:700"><span>Annual Net</span><span style="color:#007AFF">' + fmt(R.net) + '</span></div>' +
        '</div>';
    });

    container.querySelector('#awMaGross').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') container.querySelector('#awMaCalc').click();
    });
  };
})();
