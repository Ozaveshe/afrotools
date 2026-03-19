/**
 * AfroTools — Gambia PAYE Widget (GRA 2025)
 * Annual bands: 0% ≤24k, 5% 24-36k, 10% 36-48k, 15% 48-60k, 20% 60-72k, 25% 72-100k, 30% above
 * SSHFC 5% (deductible)
 */
(function() {
  'use strict';
  window.AfroWidgets = window.AfroWidgets || {};

  window.AfroWidgets.gm_paye = function(container, opts) {
    opts = opts || {};
    var fmt = function(n) { return 'GMD ' + Math.round(n).toLocaleString('en'); };
    var pct = function(r) { return r.toFixed(1) + '%'; };

    // GRA annual progressive bands
    var BANDS = [
      { limit: 24000, rate: 0 },
      { limit: 12000, rate: 0.05 },
      { limit: 12000, rate: 0.10 },
      { limit: 12000, rate: 0.15 },
      { limit: 12000, rate: 0.20 },
      { limit: 28000, rate: 0.25 },
      { limit: Infinity, rate: 0.30 }
    ];

    function calculate(grossAnnual) {
      var sshfc = grossAnnual * 0.05;
      var taxable = Math.max(0, grossAnnual - sshfc);
      var tax = 0, rem = taxable;
      for (var i = 0; i < BANDS.length; i++) {
        if (rem <= 0) break;
        var b = BANDS[i];
        var chunk = Math.min(rem, isFinite(b.limit) ? b.limit : rem);
        tax += chunk * b.rate;
        rem -= chunk;
      }
      var net = grossAnnual - sshfc - tax;
      return {
        gross: grossAnnual, sshfc: sshfc, taxable: taxable,
        tax: tax, net: net,
        effectiveRate: grossAnnual > 0 ? tax / grossAnnual * 100 : 0
      };
    }

    container.innerHTML =
      '<div class="aw-title">\uD83C\uDDEC\uD83C\uDDF2 Gambia PAYE Calculator</div>' +
      '<div class="aw-field"><label class="aw-label">Monthly Gross Salary (GMD)</label>' +
        '<input class="aw-input" id="awGmGross" type="text" inputmode="numeric" placeholder="e.g. 20,000">' +
      '</div>' +
      '<button class="aw-btn aw-btn--primary" id="awGmCalc">Calculate PAYE</button>' +
      '<div id="awGmResult"></div>' +
      (opts.footerHTML || '');

    container.querySelector('#awGmCalc').addEventListener('click', function() {
      var monthly = parseFloat((container.querySelector('#awGmGross').value || '').replace(/[^0-9.]/g, '')) || 0;
      if (!monthly) return;
      var R = calculate(monthly * 12);
      container.querySelector('#awGmResult').innerHTML =
        '<div class="aw-result-box">' +
          '<div class="aw-result-label">Monthly Take-Home (GRA 2025)</div>' +
          '<div class="aw-result-main">' + fmt(R.net / 12) + '</div>' +
        '</div>' +
        '<div style="margin-top:12px">' +
          '<div class="aw-result-row"><span>Monthly Gross</span><span>' + fmt(monthly) + '</span></div>' +
          '<div class="aw-result-row"><span>SSHFC (5%)</span><span>-' + fmt(R.sshfc / 12) + '</span></div>' +
          '<div class="aw-result-row"><span>Taxable Income</span><span>' + fmt(R.taxable / 12) + '</span></div>' +
          '<hr class="aw-divider">' +
          '<div class="aw-result-row"><span>PAYE Tax</span><span style="color:#dc2626">-' + fmt(R.tax / 12) + '</span></div>' +
          '<div class="aw-result-row"><span>Effective Rate</span><span>' + pct(R.effectiveRate) + '</span></div>' +
          '<hr class="aw-divider">' +
          '<div class="aw-result-row" style="font-weight:700"><span>Net Salary</span><span style="color:#007AFF">' + fmt(R.net / 12) + '</span></div>' +
          '<div class="aw-result-row" style="font-weight:700"><span>Annual Net</span><span style="color:#007AFF">' + fmt(R.net) + '</span></div>' +
        '</div>';
    });

    container.querySelector('#awGmGross').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') container.querySelector('#awGmCalc').click();
    });
  };
})();
