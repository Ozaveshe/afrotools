/**
 * AfroTools — Egypt PAYE Widget (ETA 2025)
 * Real ETA bands + bracket exclusion from eg-paye.html
 * Personal exemption EGP 20,000
 */
(function(){
  'use strict';
  window.AfroWidgets = window.AfroWidgets || {};

  window.AfroWidgets.eg_paye = function(container, opts) {
    opts = opts || {};
    var fmt = function(n){ return 'EGP ' + Math.round(n).toLocaleString('en-EG'); };
    var pct = function(r){ return r.toFixed(1) + '%'; };

    // ETA annual bands (on net taxable after personal exemption)
    var BANDS = [
      { limit: 40000, rate: 0 },
      { limit: 15000, rate: 0.10 },
      { limit: 15000, rate: 0.15 },
      { limit: 130000, rate: 0.20 },
      { limit: 200000, rate: 0.225 },
      { limit: 800000, rate: 0.25 },
      { limit: Infinity, rate: 0.275 }
    ];

    // Bracket exclusion rules
    var EXCLUSIONS = [
      { threshold: 600000, extraTax: 0 },
      { threshold: 700000, extraTax: 1500 },
      { threshold: 800000, extraTax: 2250 },
      { threshold: 900000, extraTax: 26000 },
      { threshold: 1000000, extraTax: 45000 },
      { threshold: 1200000, extraTax: 200000 }
    ];

    var PERSONAL_EXEMPTION = 20000;

    function calculate(annualGross) {
      var nati = Math.max(0, annualGross - PERSONAL_EXEMPTION);
      // Standard progressive
      var tax = 0, rem = nati, bd = [];
      for (var i = 0; i < BANDS.length; i++) {
        if (rem <= 0) break;
        var b = BANDS[i];
        var chunk = Math.min(rem, isFinite(b.limit) ? b.limit : rem);
        var t = chunk * b.rate;
        bd.push({ rate: b.rate * 100, income: chunk, tax: t });
        tax += t; rem -= chunk;
      }
      // Bracket exclusion
      var exclusionExtra = 0;
      for (var j = 0; j < EXCLUSIONS.length; j++) {
        if (nati > EXCLUSIONS[j].threshold) exclusionExtra += EXCLUSIONS[j].extraTax;
      }
      tax += exclusionExtra;
      var net = annualGross - tax;
      return { gross: annualGross, exemption: PERSONAL_EXEMPTION, nati: nati, tax: tax, exclusionExtra: exclusionExtra, net: net, effectiveRate: annualGross > 0 ? tax / annualGross * 100 : 0, bands: bd };
    }

    container.innerHTML =
      '<div class="aw-title">\uD83C\uDDEA\uD83C\uDDEC Egypt Income Tax Calculator</div>' +
      '<div class="aw-field"><label class="aw-label">Annual Gross Salary (EGP)</label>' +
        '<input class="aw-input" id="awEgGross" type="text" inputmode="numeric" placeholder="e.g. 300,000">' +
      '</div>' +
      '<button class="aw-btn aw-btn--primary" id="awEgCalc">Calculate Tax</button>' +
      '<div id="awEgResult"></div>' +
      (opts.footerHTML || '');

    container.querySelector('#awEgCalc').addEventListener('click', function() {
      var gross = parseFloat((container.querySelector('#awEgGross').value || '').replace(/[^0-9.]/g, '')) || 0;
      if (!gross) return;
      var R = calculate(gross);
      container.querySelector('#awEgResult').innerHTML =
        '<div class="aw-result-box">' +
          '<div class="aw-result-label">Monthly Take-Home (ETA 2025)</div>' +
          '<div class="aw-result-main">' + fmt(R.net / 12) + '</div>' +
        '</div>' +
        '<div style="margin-top:12px">' +
          '<div class="aw-result-row"><span>Annual Gross</span><span>' + fmt(R.gross) + '</span></div>' +
          '<div class="aw-result-row"><span>Personal Exemption</span><span>-' + fmt(R.exemption) + '</span></div>' +
          '<div class="aw-result-row"><span>Net Taxable (NATI)</span><span>' + fmt(R.nati) + '</span></div>' +
          '<hr class="aw-divider">' +
          '<div class="aw-result-row"><span>Income Tax</span><span style="color:#dc2626">-' + fmt(R.tax) + '</span></div>' +
          (R.exclusionExtra > 0 ? '<div class="aw-result-row"><span style="font-size:12px;opacity:.7">Incl. bracket exclusion</span><span style="font-size:12px;opacity:.7">+' + fmt(R.exclusionExtra) + '</span></div>' : '') +
          '<div class="aw-result-row"><span>Effective Rate</span><span>' + pct(R.effectiveRate) + '</span></div>' +
          '<hr class="aw-divider">' +
          '<div class="aw-result-row" style="font-weight:700"><span>Annual Net</span><span style="color:#007AFF">' + fmt(R.net) + '</span></div>' +
          '<div class="aw-result-row" style="font-weight:700"><span>Monthly Net</span><span style="color:#007AFF">' + fmt(R.net / 12) + '</span></div>' +
        '</div>';
    });

    container.querySelector('#awEgGross').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') container.querySelector('#awEgCalc').click();
    });
  };
})();
