/**
 * AfroTools — Ghana PAYE Widget (GRA 2026)
 * GRA 7-band monthly tax, SSNIT 5.5% capped at GH₵61,000/month
 */
(function(){
  'use strict';
  window.AfroWidgets = window.AfroWidgets || {};

  window.AfroWidgets.gh_paye = function(container, opts) {
    opts = opts || {};
    var fmt = function(n){ return 'GH\u20B5 ' + Math.round(n).toLocaleString('en-GH'); };
    var pct = function(r){ return r.toFixed(1) + '%'; };

    // GRA 2026 monthly tax bands
    var BANDS = [
      { limit: 490, rate: 0 },
      { limit: 110, rate: 0.05 },
      { limit: 130, rate: 0.10 },
      { limit: 3166.67, rate: 0.175 },
      { limit: 16000, rate: 0.25 },
      { limit: 30000, rate: 0.30 },
      { limit: Infinity, rate: 0.35 }
    ];

    var SSNIT_CAP = 61000;
    var SSNIT_RATE = 0.055;

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
      var ssnitBase = Math.min(gross, SSNIT_CAP);
      var ssnit = ssnitBase * SSNIT_RATE;
      var chargeable = Math.max(0, gross - ssnit);
      var tax = progressiveTax(chargeable);
      var net = gross - ssnit - tax;
      return {
        gross: gross, ssnit: ssnit, chargeable: chargeable,
        tax: tax, net: net,
        effectiveRate: gross > 0 ? tax / gross * 100 : 0
      };
    }

    container.innerHTML =
      '<div class="aw-title">\uD83C\uDDEC\uD83C\uDDED Ghana PAYE + SSNIT Calculator</div>' +
      '<div class="aw-field"><label class="aw-label">Monthly Gross Salary (GH\u20B5)</label>' +
        '<input class="aw-input" id="awGhGross" type="text" inputmode="numeric" placeholder="e.g. 10,000">' +
      '</div>' +
      '<button class="aw-btn aw-btn--primary" id="awGhCalc">Calculate PAYE</button>' +
      '<div id="awGhResult"></div>' +
      (opts.footerHTML || '');

    container.querySelector('#awGhCalc').addEventListener('click', function() {
      var gross = parseFloat((container.querySelector('#awGhGross').value || '').replace(/[^0-9.]/g, '')) || 0;
      if (!gross) return;
      var R = calculate(gross);
      container.querySelector('#awGhResult').innerHTML =
        '<div class="aw-result-box">' +
          '<div class="aw-result-label">Monthly Take-Home (GRA 2026)</div>' +
          '<div class="aw-result-main">' + fmt(R.net) + '</div>' +
        '</div>' +
        '<div class="aw-result-box">' +
          '<div class="aw-result-row"><span>Gross Salary</span><span>' + fmt(R.gross) + '</span></div>' +
          '<div class="aw-result-row"><span>SSNIT (5.5%, cap ' + fmt(SSNIT_CAP) + ')</span><span>-' + fmt(R.ssnit) + '</span></div>' +
          '<div class="aw-result-row"><span>Chargeable Income</span><span>' + fmt(R.chargeable) + '</span></div>' +
          '<hr class="aw-divider">' +
          '<div class="aw-result-row"><span>PAYE Tax</span><span>-' + fmt(R.tax) + '</span></div>' +
          '<div class="aw-result-row"><span>Effective Rate</span><span>' + pct(R.effectiveRate) + '</span></div>' +
          '<hr class="aw-divider">' +
          '<div class="aw-result-row"><span>Net Salary</span><span>' + fmt(R.net) + '</span></div>' +
          '<div class="aw-result-row"><span>Annual Net</span><span>' + fmt(R.net * 12) + '</span></div>' +
        '</div>';
    });

    container.querySelector('#awGhGross').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') container.querySelector('#awGhCalc').click();
    });
  };
})();
