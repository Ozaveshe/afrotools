/**
 * AfroTools — Sudan PAYE Widget (MoF 2026)
 * Monthly bands: 0% ≤10k, 5% 10-40k, 10% 40-70k, 15% above 70k
 * NSIF 8% (deductible)
 */
(function() {
  'use strict';
  window.AfroWidgets = window.AfroWidgets || {};

  window.AfroWidgets.sd_paye = function(container, opts) {
    opts = opts || {};
    var fmt = function(n) { return 'SDG ' + Math.round(n).toLocaleString('en'); };
    var pct = function(r) { return r.toFixed(1) + '%'; };

    // MoF monthly progressive bands
    var BANDS = [
      { limit: 10000, rate: 0 },
      { limit: 30000, rate: 0.05 },
      { limit: 30000, rate: 0.10 },
      { limit: Infinity, rate: 0.15 }
    ];

    function calculate(gross) {
      var nsif = gross * 0.08;
      var taxable = Math.max(0, gross - nsif);
      var tax = 0, rem = taxable;
      for (var i = 0; i < BANDS.length; i++) {
        if (rem <= 0) break;
        var b = BANDS[i];
        var chunk = Math.min(rem, isFinite(b.limit) ? b.limit : rem);
        tax += chunk * b.rate;
        rem -= chunk;
      }
      var net = gross - nsif - tax;
      return {
        gross: gross, nsif: nsif, taxable: taxable,
        tax: tax, net: net,
        effectiveRate: gross > 0 ? tax / gross * 100 : 0
      };
    }

    container.innerHTML =
      '<div class="aw-title">\uD83C\uDDF8\uD83C\uDDE9 Sudan PAYE Calculator</div>' +
      '<div class="aw-field"><label class="aw-label">Monthly Gross Salary (SDG)</label>' +
        '<input class="aw-input" id="awSdGross" type="text" inputmode="numeric" placeholder="e.g. 100,000">' +
      '</div>' +
      '<button class="aw-btn aw-btn--primary" id="awSdCalc">Calculate PAYE</button>' +
      '<div id="awSdResult"></div>' +
      (opts.footerHTML || '');

    container.querySelector('#awSdCalc').addEventListener('click', function() {
      var gross = parseFloat((container.querySelector('#awSdGross').value || '').replace(/[^0-9.]/g, '')) || 0;
      if (!gross) return;
      var R = calculate(gross);
      container.querySelector('#awSdResult').innerHTML =
        '<div class="aw-result-box">' +
          '<div class="aw-result-label">Monthly Take-Home (MoF 2026)</div>' +
          '<div class="aw-result-main">' + fmt(R.net) + '</div>' +
        '</div>' +
        '<div style="margin-top:12px">' +
          '<div class="aw-result-row"><span>Gross Salary</span><span>' + fmt(R.gross) + '</span></div>' +
          '<div class="aw-result-row"><span>NSIF (8%)</span><span>-' + fmt(R.nsif) + '</span></div>' +
          '<div class="aw-result-row"><span>Taxable Income</span><span>' + fmt(R.taxable) + '</span></div>' +
          '<hr class="aw-divider">' +
          '<div class="aw-result-row"><span>PAYE Tax</span><span style="color:#dc2626">-' + fmt(R.tax) + '</span></div>' +
          '<div class="aw-result-row"><span>Effective Rate</span><span>' + pct(R.effectiveRate) + '</span></div>' +
          '<hr class="aw-divider">' +
          '<div class="aw-result-row" style="font-weight:700"><span>Net Salary</span><span style="color:#007AFF">' + fmt(R.net) + '</span></div>' +
          '<div class="aw-result-row" style="font-weight:700"><span>Annual Net</span><span style="color:#007AFF">' + fmt(R.net * 12) + '</span></div>' +
        '</div>';
    });

    container.querySelector('#awSdGross').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') container.querySelector('#awSdCalc').click();
    });
  };
})();
