/**
 * AfroTools — Tanzania PAYE Widget (TRA 2025/26)
 * TRA 5-band monthly tax, NSSF 10% employee contribution
 */
(function(){
  'use strict';
  window.AfroWidgets = window.AfroWidgets || {};

  window.AfroWidgets.tz_paye = function(container, opts) {
    opts = opts || {};
    var fmt = function(n){ return 'TZS ' + Math.round(n).toLocaleString('en-TZ'); };
    var pct = function(r){ return r.toFixed(1) + '%'; };

    // TRA monthly bands (on taxable income after NSSF)
    var BANDS = [
      { limit: 270000, rate: 0 },
      { limit: 250000, rate: 0.08 },
      { limit: 240000, rate: 0.20 },
      { limit: 240000, rate: 0.25 },
      { limit: Infinity, rate: 0.30 }
    ];

    var NSSF_RATE = 0.10;

    function progressiveTax(income) {
      var tax = 0, rem = Math.max(0, income);
      for (var i = 0; i < BANDS.length; i++) {
        if (rem <= 0) break;
        var b = BANDS[i];
        var chunk = Math.min(rem, isFinite(b.limit) ? b.limit : rem);
        tax += chunk * b.rate;
        rem -= chunk;
      }
      return tax;
    }

    function calculate(gross) {
      var nssf = gross * NSSF_RATE;
      var taxable = Math.max(0, gross - nssf);
      var tax = progressiveTax(taxable);
      var net = gross - nssf - tax;
      // Employer-only levies (informational)
      var sdl = gross * 0.035;
      var wcf = gross * 0.005;
      return {
        gross: gross, nssf: nssf, taxable: taxable,
        tax: tax, net: net, sdl: sdl, wcf: wcf,
        effectiveRate: gross > 0 ? tax / gross * 100 : 0
      };
    }

    container.innerHTML =
      '<div class="aw-title">\uD83C\uDDF9\uD83C\uDDFF Tanzania PAYE Calculator</div>' +
      '<div class="aw-field"><label class="aw-label">Monthly Gross Salary (TZS)</label>' +
        '<input class="aw-input" id="awTzGross" type="text" inputmode="numeric" placeholder="e.g. 1,500,000">' +
      '</div>' +
      '<button class="aw-btn aw-btn--primary" id="awTzCalc">Calculate PAYE</button>' +
      '<div id="awTzResult"></div>' +
      (opts.footerHTML || '');

    container.querySelector('#awTzCalc').addEventListener('click', function() {
      var gross = parseFloat((container.querySelector('#awTzGross').value || '').replace(/[^0-9.]/g, '')) || 0;
      if (!gross) return;
      var R = calculate(gross);
      container.querySelector('#awTzResult').innerHTML =
        '<div class="aw-result-box">' +
          '<div class="aw-result-label">Monthly Take-Home (TRA 2025/26)</div>' +
          '<div class="aw-result-main">' + fmt(R.net) + '</div>' +
        '</div>' +
        '<div class="aw-result-box">' +
          '<div class="aw-result-row"><span>Gross Salary</span><span>' + fmt(R.gross) + '</span></div>' +
          '<div class="aw-result-row"><span>NSSF (10%)</span><span>-' + fmt(R.nssf) + '</span></div>' +
          '<div class="aw-result-row"><span>Taxable Income</span><span>' + fmt(R.taxable) + '</span></div>' +
          '<hr class="aw-divider">' +
          '<div class="aw-result-row"><span>PAYE Tax</span><span>-' + fmt(R.tax) + '</span></div>' +
          '<div class="aw-result-row"><span>Effective Rate</span><span>' + pct(R.effectiveRate) + '</span></div>' +
          '<hr class="aw-divider">' +
          '<div class="aw-result-row"><span>Net Salary</span><span>' + fmt(R.net) + '</span></div>' +
          '<div class="aw-result-row"><span>Annual Net</span><span>' + fmt(R.net * 12) + '</span></div>' +
          '<hr class="aw-divider">' +
          '<div class="aw-result-row"><span>Employer SDL (3.5%)</span><span>' + fmt(R.sdl) + '</span></div>' +
          '<div class="aw-result-row"><span>Employer WCF (0.5%)</span><span>' + fmt(R.wcf) + '</span></div>' +
        '</div>';
    });

    container.querySelector('#awTzGross').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') container.querySelector('#awTzCalc').click();
    });
  };
})();
