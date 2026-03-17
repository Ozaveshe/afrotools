/**
 * AfroTools — Ghana PAYE Widget (GRA 2026)
 * Real GRA 7-band tax, SSNIT from gh-paye.html
 */
(function(){
  'use strict';
  window.AfroWidgets = window.AfroWidgets || {};

  window.AfroWidgets.gh_paye = function(container, opts) {
    opts = opts || {};
    var fmt = function(n){ return 'GHS ' + Math.round(n).toLocaleString('en-GH'); };
    var pct = function(r){ return r.toFixed(1) + '%'; };

    // GRA 2026 monthly bands
    var BANDS = [
      { limit: 5880, rate: 0 },
      { limit: 1320, rate: 0.05 },
      { limit: 1560, rate: 0.10 },
      { limit: 38000, rate: 0.175 },
      { limit: 192000, rate: 0.25 },
      { limit: 360000, rate: 0.30 },
      { limit: Infinity, rate: 0.35 }
    ];

    var SSNIT_CAP = 61000;
    var SSNIT_EMP_RATE = 0.055;

    function progressiveTax(income) {
      var tax = 0, rem = income, bd = [];
      for (var i = 0; i < BANDS.length; i++) {
        if (rem <= 0) break;
        var b = BANDS[i];
        var chunk = Math.min(rem, isFinite(b.limit) ? b.limit : rem);
        var t = chunk * b.rate;
        if (t > 0) bd.push({ rate: b.rate * 100, income: chunk, tax: t });
        tax += t; rem -= chunk;
      }
      return { tax: tax, bands: bd };
    }

    function calculate(monthlyGross, includeSSNIT) {
      var basic = monthlyGross;
      var ssnitBase = Math.min(basic, SSNIT_CAP);
      var ssnit = includeSSNIT ? ssnitBase * SSNIT_EMP_RATE : 0;
      var chargeable = Math.max(0, monthlyGross - ssnit);
      var r = progressiveTax(chargeable);
      var net = monthlyGross - ssnit - r.tax;
      return { gross: monthlyGross, ssnit: ssnit, chargeable: chargeable, tax: r.tax, net: net, effectiveRate: monthlyGross > 0 ? r.tax / monthlyGross * 100 : 0, bands: r.bands };
    }

    container.innerHTML =
      '<div class="aw-title">\uD83C\uDDEC\uD83C\uDDED Ghana PAYE + SSNIT Calculator</div>' +
      '<div class="aw-field"><label class="aw-label">Monthly Gross Salary (GHS)</label>' +
        '<input class="aw-input" id="awGhGross" type="text" inputmode="numeric" placeholder="e.g. 10,000">' +
      '</div>' +
      '<button class="aw-btn aw-btn--primary" id="awGhCalc">Calculate PAYE</button>' +
      '<div id="awGhResult"></div>' +
      (opts.footerHTML || '');

    container.querySelector('#awGhCalc').addEventListener('click', function() {
      var gross = parseFloat((container.querySelector('#awGhGross').value || '').replace(/[^0-9.]/g, '')) || 0;
      if (!gross) return;
      var R = calculate(gross, true);
      container.querySelector('#awGhResult').innerHTML =
        '<div class="aw-result-box">' +
          '<div class="aw-result-label">Monthly Take-Home (GRA 2026)</div>' +
          '<div class="aw-result-main">' + fmt(R.net) + '</div>' +
        '</div>' +
        '<div style="margin-top:12px">' +
          '<div class="aw-result-row"><span>Gross Salary</span><span>' + fmt(R.gross) + '</span></div>' +
          '<div class="aw-result-row"><span>SSNIT (5.5%, cap ' + fmt(SSNIT_CAP) + ')</span><span>-' + fmt(R.ssnit) + '</span></div>' +
          '<div class="aw-result-row"><span>Chargeable Income</span><span>' + fmt(R.chargeable) + '</span></div>' +
          '<hr class="aw-divider">' +
          '<div class="aw-result-row"><span>PAYE Tax</span><span style="color:#dc2626">-' + fmt(R.tax) + '</span></div>' +
          '<div class="aw-result-row"><span>Effective Rate</span><span>' + pct(R.effectiveRate) + '</span></div>' +
          '<hr class="aw-divider">' +
          '<div class="aw-result-row" style="font-weight:700"><span>Net Salary</span><span style="color:#007AFF">' + fmt(R.net) + '</span></div>' +
          '<div class="aw-result-row" style="font-weight:700"><span>Annual Net</span><span style="color:#007AFF">' + fmt(R.net * 12) + '</span></div>' +
        '</div>';
    });

    container.querySelector('#awGhGross').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') container.querySelector('#awGhCalc').click();
    });
  };
})();
