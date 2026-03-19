/**
 * AfroTools — Sierra Leone PAYE Widget (NRA 2025/26)
 * Monthly bands: 0% ≤600k, 15% 600k-1.2M, 20% 1.2-1.8M, 25% 1.8-2.4M, 30% above
 * NASSIT 5% (deductible)
 */
(function() {
  'use strict';
  window.AfroWidgets = window.AfroWidgets || {};

  window.AfroWidgets.sl_paye = function(container, opts) {
    opts = opts || {};
    var fmt = function(n) { return 'SLE ' + Math.round(n).toLocaleString('en'); };
    var pct = function(r) { return r.toFixed(1) + '%'; };

    // NRA monthly progressive bands
    var BANDS = [
      { limit: 600000, rate: 0 },
      { limit: 600000, rate: 0.15 },
      { limit: 600000, rate: 0.20 },
      { limit: 600000, rate: 0.25 },
      { limit: Infinity, rate: 0.30 }
    ];

    function calculate(gross) {
      var nassit = gross * 0.05;
      var taxable = Math.max(0, gross - nassit);
      var tax = 0, rem = taxable;
      for (var i = 0; i < BANDS.length; i++) {
        if (rem <= 0) break;
        var b = BANDS[i];
        var chunk = Math.min(rem, isFinite(b.limit) ? b.limit : rem);
        tax += chunk * b.rate;
        rem -= chunk;
      }
      var net = gross - nassit - tax;
      return {
        gross: gross, nassit: nassit, taxable: taxable,
        tax: tax, net: net,
        effectiveRate: gross > 0 ? tax / gross * 100 : 0
      };
    }

    container.innerHTML =
      '<div class="aw-title">\uD83C\uDDF8\uD83C\uDDF1 Sierra Leone PAYE Calculator</div>' +
      '<div class="aw-field"><label class="aw-label">Monthly Gross Salary (SLE)</label>' +
        '<input class="aw-input" id="awSlGross" type="text" inputmode="numeric" placeholder="e.g. 5,000,000">' +
      '</div>' +
      '<button class="aw-btn aw-btn--primary" id="awSlCalc">Calculate PAYE</button>' +
      '<div id="awSlResult"></div>' +
      (opts.footerHTML || '');

    container.querySelector('#awSlCalc').addEventListener('click', function() {
      var gross = parseFloat((container.querySelector('#awSlGross').value || '').replace(/[^0-9.]/g, '')) || 0;
      if (!gross) return;
      var R = calculate(gross);
      container.querySelector('#awSlResult').innerHTML =
        '<div class="aw-result-box">' +
          '<div class="aw-result-label">Monthly Take-Home (NRA 2025/26)</div>' +
          '<div class="aw-result-main">' + fmt(R.net) + '</div>' +
        '</div>' +
        '<div style="margin-top:12px">' +
          '<div class="aw-result-row"><span>Gross Salary</span><span>' + fmt(R.gross) + '</span></div>' +
          '<div class="aw-result-row"><span>NASSIT (5%)</span><span>-' + fmt(R.nassit) + '</span></div>' +
          '<div class="aw-result-row"><span>Taxable Income</span><span>' + fmt(R.taxable) + '</span></div>' +
          '<hr class="aw-divider">' +
          '<div class="aw-result-row"><span>PAYE Tax</span><span style="color:#dc2626">-' + fmt(R.tax) + '</span></div>' +
          '<div class="aw-result-row"><span>Effective Rate</span><span>' + pct(R.effectiveRate) + '</span></div>' +
          '<hr class="aw-divider">' +
          '<div class="aw-result-row" style="font-weight:700"><span>Net Salary</span><span style="color:#007AFF">' + fmt(R.net) + '</span></div>' +
          '<div class="aw-result-row" style="font-weight:700"><span>Annual Net</span><span style="color:#007AFF">' + fmt(R.net * 12) + '</span></div>' +
        '</div>';
    });

    container.querySelector('#awSlGross').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') container.querySelector('#awSlCalc').click();
    });
  };
})();
