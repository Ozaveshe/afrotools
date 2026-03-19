/**
 * AfroTools — Madagascar PAYE Widget (DGI 2025/26)
 * Monthly bands: 0% ≤MGA 350k, 20% above
 * CNaPS 1% capped MGA 1,610,000/mo
 */
(function() {
  'use strict';
  window.AfroWidgets = window.AfroWidgets || {};

  window.AfroWidgets.mg_paye = function(container, opts) {
    opts = opts || {};
    var fmt = function(n) { return 'MGA ' + Math.round(n).toLocaleString('en'); };
    var pct = function(r) { return r.toFixed(1) + '%'; };

    // DGI monthly progressive bands (IRSA)
    var BANDS = [
      { limit: 350000, rate: 0 },
      { limit: Infinity, rate: 0.20 }
    ];

    function calculate(gross) {
      var cnaps = Math.min(gross * 0.01, 1610000);
      var taxable = Math.max(0, gross - cnaps);
      var tax = 0, rem = taxable;
      for (var i = 0; i < BANDS.length; i++) {
        if (rem <= 0) break;
        var b = BANDS[i];
        var chunk = Math.min(rem, isFinite(b.limit) ? b.limit : rem);
        tax += chunk * b.rate;
        rem -= chunk;
      }
      var net = gross - cnaps - tax;
      return {
        gross: gross, cnaps: cnaps, taxable: taxable,
        tax: tax, net: net,
        effectiveRate: gross > 0 ? tax / gross * 100 : 0
      };
    }

    container.innerHTML =
      '<div class="aw-title">\uD83C\uDDF2\uD83C\uDDEC Madagascar PAYE Calculator</div>' +
      '<div class="aw-field"><label class="aw-label">Monthly Gross Salary (MGA)</label>' +
        '<input class="aw-input" id="awMgGross" type="text" inputmode="numeric" placeholder="e.g. 1,000,000">' +
      '</div>' +
      '<button class="aw-btn aw-btn--primary" id="awMgCalc">Calculate PAYE</button>' +
      '<div id="awMgResult"></div>' +
      (opts.footerHTML || '');

    container.querySelector('#awMgCalc').addEventListener('click', function() {
      var gross = parseFloat((container.querySelector('#awMgGross').value || '').replace(/[^0-9.]/g, '')) || 0;
      if (!gross) return;
      var R = calculate(gross);
      container.querySelector('#awMgResult').innerHTML =
        '<div class="aw-result-box">' +
          '<div class="aw-result-label">Monthly Take-Home (DGI 2025/26)</div>' +
          '<div class="aw-result-main">' + fmt(R.net) + '</div>' +
        '</div>' +
        '<div style="margin-top:12px">' +
          '<div class="aw-result-row"><span>Gross Salary</span><span>' + fmt(R.gross) + '</span></div>' +
          '<div class="aw-result-row"><span>CNaPS (1%, cap 1.61M)</span><span>-' + fmt(R.cnaps) + '</span></div>' +
          '<div class="aw-result-row"><span>Taxable Income</span><span>' + fmt(R.taxable) + '</span></div>' +
          '<hr class="aw-divider">' +
          '<div class="aw-result-row"><span>IRSA Tax</span><span style="color:#dc2626">-' + fmt(R.tax) + '</span></div>' +
          '<div class="aw-result-row"><span>Effective Rate</span><span>' + pct(R.effectiveRate) + '</span></div>' +
          '<hr class="aw-divider">' +
          '<div class="aw-result-row" style="font-weight:700"><span>Net Salary</span><span style="color:#007AFF">' + fmt(R.net) + '</span></div>' +
          '<div class="aw-result-row" style="font-weight:700"><span>Annual Net</span><span style="color:#007AFF">' + fmt(R.net * 12) + '</span></div>' +
        '</div>';
    });

    container.querySelector('#awMgGross').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') container.querySelector('#awMgCalc').click();
    });
  };
})();
