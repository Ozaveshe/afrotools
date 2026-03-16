/**
 * AfroTools — Kenya PAYE Widget (KRA 2025/26)
 * Real KRA bands, NSSF Tier I/II, SHIF 2.75% from ke-paye.html
 */
(function(){
  'use strict';
  window.AfroWidgets = window.AfroWidgets || {};

  window.AfroWidgets.ke_paye = function(container, opts) {
    opts = opts || {};
    var fmt = function(n){ return 'KES ' + Math.round(n).toLocaleString('en-KE'); };
    var pct = function(r){ return r.toFixed(1) + '%'; };

    // KRA monthly bands
    var BANDS = [
      { limit: 24000, rate: 0.10 },
      { limit: 8333, rate: 0.25 },
      { limit: 467667, rate: 0.30 },
      { limit: 300000, rate: 0.325 },
      { limit: Infinity, rate: 0.35 }
    ];

    function calcNSSF(gross) {
      var LEL = 8000, UEL = 72000;
      return Math.min(gross, LEL) * 0.06 + Math.max(0, Math.min(gross, UEL) - LEL) * 0.06;
    }

    function progressiveTax(taxable) {
      var tax = 0, rem = Math.max(0, taxable);
      var bd = [];
      for (var i = 0; i < BANDS.length; i++) {
        if (rem <= 0) break;
        var b = BANDS[i];
        var chunk = Math.min(rem, isFinite(b.limit) ? b.limit : rem);
        var t = chunk * b.rate;
        bd.push({ rate: b.rate * 100, income: chunk, tax: t });
        tax += t; rem -= chunk;
      }
      return { tax: tax, bands: bd };
    }

    function calculate(gross, includeNSSF, includeSHIF) {
      var nssf = includeNSSF ? calcNSSF(gross) : 0;
      var shif = includeSHIF ? Math.max(300, gross * 0.0275) : 0;
      var taxable = Math.max(0, gross - nssf - shif);
      var r = progressiveTax(taxable);
      var personalRelief = 2400;
      var paye = Math.max(0, r.tax - personalRelief);
      var ahl = gross * 0.015;
      var totalDed = nssf + shif + ahl + paye;
      var net = gross - totalDed;
      return { gross: gross, nssf: nssf, shif: shif, ahl: ahl, taxable: taxable, grossTax: r.tax, personalRelief: personalRelief, paye: paye, totalDed: totalDed, net: net, effectiveRate: gross > 0 ? paye / gross * 100 : 0 };
    }

    container.innerHTML =
      '<div class="aw-title">\uD83C\uDDF0\uD83C\uDDEA Kenya PAYE Calculator</div>' +
      '<div class="aw-field"><label class="aw-label">Monthly Gross Salary (KES)</label>' +
        '<input class="aw-input" id="awKeGross" type="text" inputmode="numeric" placeholder="e.g. 150,000">' +
      '</div>' +
      '<button class="aw-btn aw-btn--primary" id="awKeCalc">Calculate PAYE</button>' +
      '<div id="awKeResult"></div>' +
      (opts.footerHTML || '');

    container.querySelector('#awKeCalc').addEventListener('click', function() {
      var gross = parseFloat((container.querySelector('#awKeGross').value || '').replace(/[^0-9.]/g, '')) || 0;
      if (!gross) return;
      var R = calculate(gross, true, true);
      container.querySelector('#awKeResult').innerHTML =
        '<div class="aw-result-box">' +
          '<div class="aw-result-label">Monthly Take-Home (KRA 2025/26)</div>' +
          '<div class="aw-result-main">' + fmt(R.net) + '</div>' +
        '</div>' +
        '<div style="margin-top:12px">' +
          '<div class="aw-result-row"><span>Gross Salary</span><span>' + fmt(R.gross) + '</span></div>' +
          '<div class="aw-result-row"><span>NSSF (Tier I+II)</span><span>-' + fmt(R.nssf) + '</span></div>' +
          '<div class="aw-result-row"><span>SHIF (2.75%)</span><span>-' + fmt(R.shif) + '</span></div>' +
          '<div class="aw-result-row"><span>Taxable Income</span><span>' + fmt(R.taxable) + '</span></div>' +
          '<div class="aw-result-row"><span>Tax Before Relief</span><span>' + fmt(R.grossTax) + '</span></div>' +
          '<div class="aw-result-row"><span>Personal Relief</span><span>-' + fmt(R.personalRelief) + '</span></div>' +
          '<hr class="aw-divider">' +
          '<div class="aw-result-row"><span>PAYE</span><span style="color:#dc2626">-' + fmt(R.paye) + '</span></div>' +
          '<div class="aw-result-row"><span>AHL (1.5%)</span><span style="color:#dc2626">-' + fmt(R.ahl) + '</span></div>' +
          '<div class="aw-result-row"><span>Effective Rate</span><span>' + pct(R.effectiveRate) + '</span></div>' +
          '<hr class="aw-divider">' +
          '<div class="aw-result-row" style="font-weight:700"><span>Net Salary</span><span style="color:#16a34a">' + fmt(R.net) + '</span></div>' +
          '<div class="aw-result-row" style="font-weight:700"><span>Annual Net</span><span style="color:#16a34a">' + fmt(R.net * 12) + '</span></div>' +
        '</div>';
    });

    container.querySelector('#awKeGross').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') container.querySelector('#awKeCalc').click();
    });
  };
})();
