/**
 * AfroTools — Tunisia PAYE Widget (DGI 2025)
 * Annual bands (DT): 0% ≤5k, 26% 5-20k, 28% 20-30k, 32% 30-50k, 35% above 50k
 * CNSS 9.18% (deductible)
 */
(function() {
  'use strict';
  window.AfroWidgets = window.AfroWidgets || {};

  window.AfroWidgets.tn_paye = function(container, opts) {
    opts = opts || {};
    var fmt = function(n) { return 'DT ' + n.toFixed(3); };
    var pct = function(r) { return r.toFixed(1) + '%'; };

    // DGI annual progressive bands (IRPP)
    var BANDS = [
      { limit: 5000, rate: 0 },
      { limit: 15000, rate: 0.26 },
      { limit: 10000, rate: 0.28 },
      { limit: 20000, rate: 0.32 },
      { limit: Infinity, rate: 0.35 }
    ];

    function calculate(grossAnnual) {
      var cnss = grossAnnual * 0.0918;
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
      '<div class="aw-title">\uD83C\uDDF9\uD83C\uDDF3 Tunisia PAYE Calculator</div>' +
      '<div class="aw-field"><label class="aw-label">Monthly Gross Salary (DT)</label>' +
        '<input class="aw-input" id="awTnGross" type="text" inputmode="numeric" placeholder="e.g. 3,000">' +
      '</div>' +
      '<button class="aw-btn aw-btn--primary" id="awTnCalc">Calculate PAYE</button>' +
      '<div id="awTnResult"></div>' +
      (opts.footerHTML || '');

    container.querySelector('#awTnCalc').addEventListener('click', function() {
      var monthly = parseFloat((container.querySelector('#awTnGross').value || '').replace(/[^0-9.]/g, '')) || 0;
      if (!monthly) return;
      var R = calculate(monthly * 12);
      container.querySelector('#awTnResult').innerHTML =
        '<div class="aw-result-box">' +
          '<div class="aw-result-label">Monthly Take-Home (DGI 2025)</div>' +
          '<div class="aw-result-main">' + fmt(R.net / 12) + '</div>' +
        '</div>' +
        '<div style="margin-top:12px">' +
          '<div class="aw-result-row"><span>Monthly Gross</span><span>' + fmt(monthly) + '</span></div>' +
          '<div class="aw-result-row"><span>CNSS (9.18%)</span><span>-' + fmt(R.cnss / 12) + '</span></div>' +
          '<div class="aw-result-row"><span>Taxable Income</span><span>' + fmt(R.taxable / 12) + '</span></div>' +
          '<hr class="aw-divider">' +
          '<div class="aw-result-row"><span>IRPP Tax</span><span style="color:#dc2626">-' + fmt(R.tax / 12) + '</span></div>' +
          '<div class="aw-result-row"><span>Effective Rate</span><span>' + pct(R.effectiveRate) + '</span></div>' +
          '<hr class="aw-divider">' +
          '<div class="aw-result-row" style="font-weight:700"><span>Net Salary</span><span style="color:#007AFF">' + fmt(R.net / 12) + '</span></div>' +
          '<div class="aw-result-row" style="font-weight:700"><span>Annual Net</span><span style="color:#007AFF">' + fmt(R.net) + '</span></div>' +
        '</div>';
    });

    container.querySelector('#awTnGross').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') container.querySelector('#awTnCalc').click();
    });
  };
})();
