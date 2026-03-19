/**
 * AfroTools — Zimbabwe PAYE Widget (ZIMRA 2025/26)
 * Annual USD bands: 0% ≤$6k, 20% 6-12k, 25% 12-36k, 30% 36-60k, 35% 60-120k, 40% above
 * NSSA 3.5% (deductible)
 */
(function() {
  'use strict';
  window.AfroWidgets = window.AfroWidgets || {};

  window.AfroWidgets.zw_paye = function(container, opts) {
    opts = opts || {};
    var fmt = function(n) { return '$' + Math.round(n).toLocaleString('en'); };
    var pct = function(r) { return r.toFixed(1) + '%'; };

    // ZIMRA annual progressive bands
    var BANDS = [
      { limit: 6000, rate: 0 },
      { limit: 6000, rate: 0.20 },
      { limit: 24000, rate: 0.25 },
      { limit: 24000, rate: 0.30 },
      { limit: 60000, rate: 0.35 },
      { limit: Infinity, rate: 0.40 }
    ];

    function calculate(grossAnnual) {
      var nssa = grossAnnual * 0.035;
      var taxable = Math.max(0, grossAnnual - nssa);
      var tax = 0, rem = taxable;
      for (var i = 0; i < BANDS.length; i++) {
        if (rem <= 0) break;
        var b = BANDS[i];
        var chunk = Math.min(rem, isFinite(b.limit) ? b.limit : rem);
        tax += chunk * b.rate;
        rem -= chunk;
      }
      var net = grossAnnual - nssa - tax;
      return {
        gross: grossAnnual, nssa: nssa, taxable: taxable,
        tax: tax, net: net,
        effectiveRate: grossAnnual > 0 ? tax / grossAnnual * 100 : 0
      };
    }

    container.innerHTML =
      '<div class="aw-title">\uD83C\uDDFF\uD83C\uDDFC Zimbabwe PAYE Calculator</div>' +
      '<div class="aw-field"><label class="aw-label">Monthly Gross Salary (USD)</label>' +
        '<input class="aw-input" id="awZwGross" type="text" inputmode="numeric" placeholder="e.g. 2,000">' +
      '</div>' +
      '<button class="aw-btn aw-btn--primary" id="awZwCalc">Calculate PAYE</button>' +
      '<div id="awZwResult"></div>' +
      (opts.footerHTML || '');

    container.querySelector('#awZwCalc').addEventListener('click', function() {
      var monthly = parseFloat((container.querySelector('#awZwGross').value || '').replace(/[^0-9.]/g, '')) || 0;
      if (!monthly) return;
      var R = calculate(monthly * 12);
      container.querySelector('#awZwResult').innerHTML =
        '<div class="aw-result-box">' +
          '<div class="aw-result-label">Monthly Take-Home (ZIMRA 2025/26)</div>' +
          '<div class="aw-result-main">' + fmt(R.net / 12) + '</div>' +
        '</div>' +
        '<div style="margin-top:12px">' +
          '<div class="aw-result-row"><span>Monthly Gross</span><span>' + fmt(monthly) + '</span></div>' +
          '<div class="aw-result-row"><span>NSSA (3.5%)</span><span>-' + fmt(R.nssa / 12) + '</span></div>' +
          '<div class="aw-result-row"><span>Taxable Income</span><span>' + fmt(R.taxable / 12) + '</span></div>' +
          '<hr class="aw-divider">' +
          '<div class="aw-result-row"><span>PAYE Tax</span><span style="color:#dc2626">-' + fmt(R.tax / 12) + '</span></div>' +
          '<div class="aw-result-row"><span>Effective Rate</span><span>' + pct(R.effectiveRate) + '</span></div>' +
          '<hr class="aw-divider">' +
          '<div class="aw-result-row" style="font-weight:700"><span>Net Salary</span><span style="color:#007AFF">' + fmt(R.net / 12) + '</span></div>' +
          '<div class="aw-result-row" style="font-weight:700"><span>Annual Net</span><span style="color:#007AFF">' + fmt(R.net) + '</span></div>' +
        '</div>';
    });

    container.querySelector('#awZwGross').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') container.querySelector('#awZwCalc').click();
    });
  };
})();
