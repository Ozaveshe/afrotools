/**
 * AfroTools — Chad PAYE Widget (DGI 2025)
 * Annual 8-band: 0% ≤290,580, 10% to 607,620, 15% to 1,320,600,
 * 20% to 2,508,900, 25% to 4,885,500, 30% to 9,638,700, 35% to 14,391,900, 40% above
 * CNPS 3.5% (deductible)
 */
(function() {
  'use strict';
  window.AfroWidgets = window.AfroWidgets || {};

  window.AfroWidgets.td_paye = function(container, opts) {
    opts = opts || {};
    var fmt = function(n) { return 'FCFA ' + Math.round(n).toLocaleString('en'); };
    var pct = function(r) { return r.toFixed(1) + '%'; };

    // DGI annual progressive bands (IRPP)
    var BANDS = [
      { limit: 290580, rate: 0 },
      { limit: 317040, rate: 0.10 },
      { limit: 712980, rate: 0.15 },
      { limit: 1188300, rate: 0.20 },
      { limit: 2376600, rate: 0.25 },
      { limit: 4753200, rate: 0.30 },
      { limit: 4753200, rate: 0.35 },
      { limit: Infinity, rate: 0.40 }
    ];

    function calculate(grossAnnual) {
      var cnps = grossAnnual * 0.035;
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
      '<div class="aw-title">\uD83C\uDDF9\uD83C\uDDE9 Chad PAYE Calculator</div>' +
      '<div class="aw-field"><label class="aw-label">Monthly Gross Salary (FCFA)</label>' +
        '<input class="aw-input" id="awTdGross" type="text" inputmode="numeric" placeholder="e.g. 400,000">' +
      '</div>' +
      '<button class="aw-btn aw-btn--primary" id="awTdCalc">Calculate PAYE</button>' +
      '<div id="awTdResult"></div>' +
      (opts.footerHTML || '');

    container.querySelector('#awTdCalc').addEventListener('click', function() {
      var monthly = parseFloat((container.querySelector('#awTdGross').value || '').replace(/[^0-9.]/g, '')) || 0;
      if (!monthly) return;
      var R = calculate(monthly * 12);
      container.querySelector('#awTdResult').innerHTML =
        '<div class="aw-result-box">' +
          '<div class="aw-result-label">Monthly Take-Home (DGI 2025)</div>' +
          '<div class="aw-result-main">' + fmt(R.net / 12) + '</div>' +
        '</div>' +
        '<div style="margin-top:12px">' +
          '<div class="aw-result-row"><span>Monthly Gross</span><span>' + fmt(monthly) + '</span></div>' +
          '<div class="aw-result-row"><span>CNPS (3.5%)</span><span>-' + fmt(R.cnps / 12) + '</span></div>' +
          '<div class="aw-result-row"><span>Taxable Income</span><span>' + fmt(R.taxable / 12) + '</span></div>' +
          '<hr class="aw-divider">' +
          '<div class="aw-result-row"><span>IRPP Tax</span><span style="color:#dc2626">-' + fmt(R.tax / 12) + '</span></div>' +
          '<div class="aw-result-row"><span>Effective Rate</span><span>' + pct(R.effectiveRate) + '</span></div>' +
          '<hr class="aw-divider">' +
          '<div class="aw-result-row" style="font-weight:700"><span>Net Salary</span><span style="color:#007AFF">' + fmt(R.net / 12) + '</span></div>' +
          '<div class="aw-result-row" style="font-weight:700"><span>Annual Net</span><span style="color:#007AFF">' + fmt(R.net) + '</span></div>' +
        '</div>';
    });

    container.querySelector('#awTdGross').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') container.querySelector('#awTdCalc').click();
    });
  };
})();
