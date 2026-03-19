/**
 * AfroTools — Algeria PAYE Widget (DGI 2025)
 * Annual bands: 0% ≤240k, 23% 240-480k, 27% 480-960k, 30% 960k-1.92M, 33% 1.92-3.84M, 35% above
 * CNAS 9% (deductible)
 */
(function() {
  'use strict';
  window.AfroWidgets = window.AfroWidgets || {};

  window.AfroWidgets.dz_paye = function(container, opts) {
    opts = opts || {};
    var fmt = function(n) { return 'DA ' + Math.round(n).toLocaleString('en'); };
    var pct = function(r) { return r.toFixed(1) + '%'; };

    // DGI annual progressive bands (IRG)
    var BANDS = [
      { limit: 240000, rate: 0 },
      { limit: 240000, rate: 0.23 },
      { limit: 480000, rate: 0.27 },
      { limit: 960000, rate: 0.30 },
      { limit: 1920000, rate: 0.33 },
      { limit: Infinity, rate: 0.35 }
    ];

    function calculate(grossAnnual) {
      var cnas = grossAnnual * 0.09;
      var taxable = Math.max(0, grossAnnual - cnas);
      var tax = 0, rem = taxable;
      for (var i = 0; i < BANDS.length; i++) {
        if (rem <= 0) break;
        var b = BANDS[i];
        var chunk = Math.min(rem, isFinite(b.limit) ? b.limit : rem);
        tax += chunk * b.rate;
        rem -= chunk;
      }
      var net = grossAnnual - cnas - tax;
      return {
        gross: grossAnnual, cnas: cnas, taxable: taxable,
        tax: tax, net: net,
        effectiveRate: grossAnnual > 0 ? tax / grossAnnual * 100 : 0
      };
    }

    container.innerHTML =
      '<div class="aw-title">\uD83C\uDDE9\uD83C\uDDFF Algeria PAYE Calculator</div>' +
      '<div class="aw-field"><label class="aw-label">Monthly Gross Salary (DA)</label>' +
        '<input class="aw-input" id="awDzGross" type="text" inputmode="numeric" placeholder="e.g. 150,000">' +
      '</div>' +
      '<button class="aw-btn aw-btn--primary" id="awDzCalc">Calculate PAYE</button>' +
      '<div id="awDzResult"></div>' +
      (opts.footerHTML || '');

    container.querySelector('#awDzCalc').addEventListener('click', function() {
      var monthly = parseFloat((container.querySelector('#awDzGross').value || '').replace(/[^0-9.]/g, '')) || 0;
      if (!monthly) return;
      var R = calculate(monthly * 12);
      container.querySelector('#awDzResult').innerHTML =
        '<div class="aw-result-box">' +
          '<div class="aw-result-label">Monthly Take-Home (DGI 2025)</div>' +
          '<div class="aw-result-main">' + fmt(R.net / 12) + '</div>' +
        '</div>' +
        '<div style="margin-top:12px">' +
          '<div class="aw-result-row"><span>Monthly Gross</span><span>' + fmt(monthly) + '</span></div>' +
          '<div class="aw-result-row"><span>CNAS (9%)</span><span>-' + fmt(R.cnas / 12) + '</span></div>' +
          '<div class="aw-result-row"><span>Taxable Income</span><span>' + fmt(R.taxable / 12) + '</span></div>' +
          '<hr class="aw-divider">' +
          '<div class="aw-result-row"><span>IRG Tax</span><span style="color:#dc2626">-' + fmt(R.tax / 12) + '</span></div>' +
          '<div class="aw-result-row"><span>Effective Rate</span><span>' + pct(R.effectiveRate) + '</span></div>' +
          '<hr class="aw-divider">' +
          '<div class="aw-result-row" style="font-weight:700"><span>Net Salary</span><span style="color:#007AFF">' + fmt(R.net / 12) + '</span></div>' +
          '<div class="aw-result-row" style="font-weight:700"><span>Annual Net</span><span style="color:#007AFF">' + fmt(R.net) + '</span></div>' +
        '</div>';
    });

    container.querySelector('#awDzGross').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') container.querySelector('#awDzCalc').click();
    });
  };
})();
