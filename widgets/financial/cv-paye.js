/**
 * AfroTools — Cape Verde PAYE Widget (DGCI 2025)
 * Annual bands: 0% ≤200k, 16.5% 200-450k, 21.5% 450-700k, 23.5% 700k-1M, 27.5% above 1M
 * INPS 8.5% (deductible)
 */
(function() {
  'use strict';
  window.AfroWidgets = window.AfroWidgets || {};

  window.AfroWidgets.cv_paye = function(container, opts) {
    opts = opts || {};
    var fmt = function(n) { return 'CVE ' + Math.round(n).toLocaleString('en'); };
    var pct = function(r) { return r.toFixed(1) + '%'; };

    // DGCI annual progressive bands (IUR)
    var BANDS = [
      { limit: 200000, rate: 0 },
      { limit: 250000, rate: 0.165 },
      { limit: 250000, rate: 0.215 },
      { limit: 300000, rate: 0.235 },
      { limit: Infinity, rate: 0.275 }
    ];

    function calculate(grossAnnual) {
      var inps = grossAnnual * 0.085;
      var taxable = Math.max(0, grossAnnual - inps);
      var tax = 0, rem = taxable;
      for (var i = 0; i < BANDS.length; i++) {
        if (rem <= 0) break;
        var b = BANDS[i];
        var chunk = Math.min(rem, isFinite(b.limit) ? b.limit : rem);
        tax += chunk * b.rate;
        rem -= chunk;
      }
      var net = grossAnnual - inps - tax;
      return {
        gross: grossAnnual, inps: inps, taxable: taxable,
        tax: tax, net: net,
        effectiveRate: grossAnnual > 0 ? tax / grossAnnual * 100 : 0
      };
    }

    container.innerHTML =
      '<div class="aw-title">\uD83C\uDDE8\uD83C\uDDFB Cape Verde PAYE Calculator</div>' +
      '<div class="aw-field"><label class="aw-label">Monthly Gross Salary (CVE)</label>' +
        '<input class="aw-input" id="awCvGross" type="text" inputmode="numeric" placeholder="e.g. 200,000">' +
      '</div>' +
      '<button class="aw-btn aw-btn--primary" id="awCvCalc">Calculate PAYE</button>' +
      '<div id="awCvResult"></div>' +
      (opts.footerHTML || '');

    container.querySelector('#awCvCalc').addEventListener('click', function() {
      var monthly = parseFloat((container.querySelector('#awCvGross').value || '').replace(/[^0-9.]/g, '')) || 0;
      if (!monthly) return;
      var R = calculate(monthly * 12);
      container.querySelector('#awCvResult').innerHTML =
        '<div class="aw-result-box">' +
          '<div class="aw-result-label">Monthly Take-Home (DGCI 2025)</div>' +
          '<div class="aw-result-main">' + fmt(R.net / 12) + '</div>' +
        '</div>' +
        '<div style="margin-top:12px">' +
          '<div class="aw-result-row"><span>Monthly Gross</span><span>' + fmt(monthly) + '</span></div>' +
          '<div class="aw-result-row"><span>INPS (8.5%)</span><span>-' + fmt(R.inps / 12) + '</span></div>' +
          '<div class="aw-result-row"><span>Taxable Income</span><span>' + fmt(R.taxable / 12) + '</span></div>' +
          '<hr class="aw-divider">' +
          '<div class="aw-result-row"><span>IUR Tax</span><span style="color:#dc2626">-' + fmt(R.tax / 12) + '</span></div>' +
          '<div class="aw-result-row"><span>Effective Rate</span><span>' + pct(R.effectiveRate) + '</span></div>' +
          '<hr class="aw-divider">' +
          '<div class="aw-result-row" style="font-weight:700"><span>Net Salary</span><span style="color:#007AFF">' + fmt(R.net / 12) + '</span></div>' +
          '<div class="aw-result-row" style="font-weight:700"><span>Annual Net</span><span style="color:#007AFF">' + fmt(R.net) + '</span></div>' +
        '</div>';
    });

    container.querySelector('#awCvGross').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') container.querySelector('#awCvCalc').click();
    });
  };
})();
