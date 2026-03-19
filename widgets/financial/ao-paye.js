/**
 * AfroTools — Angola PAYE Widget (AGT 2026)
 * Monthly bands: 0% ≤100k, 10% 100-150k, 15% 150-200k, 20% 200-300k,
 * 21.5% 300-500k, 22.5% 500k-1M, 23.5% 1-1.5M, 24.5% 1.5-2M, 25% above 2M
 * INSS 3% (deductible)
 */
(function() {
  'use strict';
  window.AfroWidgets = window.AfroWidgets || {};

  window.AfroWidgets.ao_paye = function(container, opts) {
    opts = opts || {};
    var fmt = function(n) { return 'AOA ' + Math.round(n).toLocaleString('en'); };
    var pct = function(r) { return r.toFixed(1) + '%'; };

    // AGT monthly progressive bands (IRT)
    var BANDS = [
      { limit: 100000, rate: 0 },
      { limit: 50000, rate: 0.10 },
      { limit: 50000, rate: 0.15 },
      { limit: 100000, rate: 0.20 },
      { limit: 200000, rate: 0.215 },
      { limit: 500000, rate: 0.225 },
      { limit: 500000, rate: 0.235 },
      { limit: 500000, rate: 0.245 },
      { limit: Infinity, rate: 0.25 }
    ];

    function calculate(gross) {
      var inss = gross * 0.03;
      var taxable = Math.max(0, gross - inss);
      var tax = 0, rem = taxable;
      for (var i = 0; i < BANDS.length; i++) {
        if (rem <= 0) break;
        var b = BANDS[i];
        var chunk = Math.min(rem, isFinite(b.limit) ? b.limit : rem);
        tax += chunk * b.rate;
        rem -= chunk;
      }
      var net = gross - inss - tax;
      return {
        gross: gross, inss: inss, taxable: taxable,
        tax: tax, net: net,
        effectiveRate: gross > 0 ? tax / gross * 100 : 0
      };
    }

    container.innerHTML =
      '<div class="aw-title">\uD83C\uDDE6\uD83C\uDDF4 Angola PAYE Calculator</div>' +
      '<div class="aw-field"><label class="aw-label">Monthly Gross Salary (AOA)</label>' +
        '<input class="aw-input" id="awAoGross" type="text" inputmode="numeric" placeholder="e.g. 500,000">' +
      '</div>' +
      '<button class="aw-btn aw-btn--primary" id="awAoCalc">Calculate PAYE</button>' +
      '<div id="awAoResult"></div>' +
      (opts.footerHTML || '');

    container.querySelector('#awAoCalc').addEventListener('click', function() {
      var gross = parseFloat((container.querySelector('#awAoGross').value || '').replace(/[^0-9.]/g, '')) || 0;
      if (!gross) return;
      var R = calculate(gross);
      container.querySelector('#awAoResult').innerHTML =
        '<div class="aw-result-box">' +
          '<div class="aw-result-label">Monthly Take-Home (AGT 2026)</div>' +
          '<div class="aw-result-main">' + fmt(R.net) + '</div>' +
        '</div>' +
        '<div style="margin-top:12px">' +
          '<div class="aw-result-row"><span>Gross Salary</span><span>' + fmt(R.gross) + '</span></div>' +
          '<div class="aw-result-row"><span>INSS (3%)</span><span>-' + fmt(R.inss) + '</span></div>' +
          '<div class="aw-result-row"><span>Taxable Income</span><span>' + fmt(R.taxable) + '</span></div>' +
          '<hr class="aw-divider">' +
          '<div class="aw-result-row"><span>IRT Tax</span><span style="color:#dc2626">-' + fmt(R.tax) + '</span></div>' +
          '<div class="aw-result-row"><span>Effective Rate</span><span>' + pct(R.effectiveRate) + '</span></div>' +
          '<hr class="aw-divider">' +
          '<div class="aw-result-row" style="font-weight:700"><span>Net Salary</span><span style="color:#007AFF">' + fmt(R.net) + '</span></div>' +
          '<div class="aw-result-row" style="font-weight:700"><span>Annual Net</span><span style="color:#007AFF">' + fmt(R.net * 12) + '</span></div>' +
        '</div>';
    });

    container.querySelector('#awAoGross').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') container.querySelector('#awAoCalc').click();
    });
  };
})();
