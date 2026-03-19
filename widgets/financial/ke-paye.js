/**
 * AfroTools — Kenya PAYE Widget (KRA 2025/26)
 * KRA monthly bands, NSSF Tier I/II, SHIF 2.75%, AHL 1.5%
 */
(function(){
  'use strict';
  window.AfroWidgets = window.AfroWidgets || {};

  window.AfroWidgets.ke_paye = function(container, opts) {
    opts = opts || {};
    var fmt = function(n){ return 'KSh ' + Math.round(n).toLocaleString('en-KE'); };
    var pct = function(r){ return r.toFixed(1) + '%'; };

    // KRA monthly tax bands
    var BANDS = [
      { limit: 24000, rate: 0.10 },
      { limit: 8333, rate: 0.25 },
      { limit: 467667, rate: 0.30 },
      { limit: 300000, rate: 0.325 },
      { limit: Infinity, rate: 0.35 }
    ];

    var PERSONAL_RELIEF = 2400;

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

    function calcNSSF(gross) {
      // 6% on earnings between KSh 8,000 (LEL) and KSh 72,000 (UEL)
      return Math.min(Math.max(0, gross - 8000), 64000) * 0.06;
    }

    function calculate(gross) {
      var nssf = calcNSSF(gross);
      var shif = Math.max(300, gross * 0.0275);
      var ahl = gross * 0.015; // does NOT reduce taxable income
      var taxable = Math.max(0, gross - nssf - shif);
      var grossTax = progressiveTax(taxable);
      var paye = Math.max(0, grossTax - PERSONAL_RELIEF);
      var totalDed = nssf + shif + ahl + paye;
      var net = gross - totalDed;
      return {
        gross: gross, nssf: nssf, shif: shif, ahl: ahl,
        taxable: taxable, grossTax: grossTax,
        personalRelief: PERSONAL_RELIEF, paye: paye,
        totalDed: totalDed, net: net,
        effectiveRate: gross > 0 ? paye / gross * 100 : 0
      };
    }

    container.innerHTML =
      '<div class="aw-title">\uD83C\uDDF0\uD83C\uDDEA Kenya PAYE Calculator</div>' +
      '<div class="aw-field"><label class="aw-label">Monthly Gross Salary (KSh)</label>' +
        '<input class="aw-input" id="awKeGross" type="text" inputmode="numeric" placeholder="e.g. 150,000">' +
      '</div>' +
      '<button class="aw-btn aw-btn--primary" id="awKeCalc">Calculate PAYE</button>' +
      '<div id="awKeResult"></div>' +
      (opts.footerHTML || '');

    container.querySelector('#awKeCalc').addEventListener('click', function() {
      var gross = parseFloat((container.querySelector('#awKeGross').value || '').replace(/[^0-9.]/g, '')) || 0;
      if (!gross) return;
      var R = calculate(gross);
      container.querySelector('#awKeResult').innerHTML =
        '<div class="aw-result-box">' +
          '<div class="aw-result-label">Monthly Take-Home (KRA 2025/26)</div>' +
          '<div class="aw-result-main">' + fmt(R.net) + '</div>' +
        '</div>' +
        '<div class="aw-result-box">' +
          '<div class="aw-result-row"><span>Gross Salary</span><span>' + fmt(R.gross) + '</span></div>' +
          '<div class="aw-result-row"><span>NSSF (6%)</span><span>-' + fmt(R.nssf) + '</span></div>' +
          '<div class="aw-result-row"><span>SHIF (2.75%)</span><span>-' + fmt(R.shif) + '</span></div>' +
          '<div class="aw-result-row"><span>Taxable Income</span><span>' + fmt(R.taxable) + '</span></div>' +
          '<div class="aw-result-row"><span>Tax Before Relief</span><span>' + fmt(R.grossTax) + '</span></div>' +
          '<div class="aw-result-row"><span>Personal Relief</span><span>-' + fmt(R.personalRelief) + '</span></div>' +
          '<hr class="aw-divider">' +
          '<div class="aw-result-row"><span>PAYE</span><span>-' + fmt(R.paye) + '</span></div>' +
          '<div class="aw-result-row"><span>AHL (1.5%)</span><span>-' + fmt(R.ahl) + '</span></div>' +
          '<div class="aw-result-row"><span>Effective Rate</span><span>' + pct(R.effectiveRate) + '</span></div>' +
          '<hr class="aw-divider">' +
          '<div class="aw-result-row"><span>Net Salary</span><span>' + fmt(R.net) + '</span></div>' +
          '<div class="aw-result-row"><span>Annual Net</span><span>' + fmt(R.net * 12) + '</span></div>' +
        '</div>';
    });

    container.querySelector('#awKeGross').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') container.querySelector('#awKeCalc').click();
    });
  };
})();
