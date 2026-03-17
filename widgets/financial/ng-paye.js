/**
 * AfroTools — Nigeria PAYE Widget (NTA 2026 + PITA 2025)
 * Real FIRS tax bands from ng-salary-tax.html
 */
(function(){
  'use strict';
  window.AfroWidgets = window.AfroWidgets || {};

  window.AfroWidgets.ng_paye = function(container, opts) {
    opts = opts || {};
    var fmt = function(n){ return '\u20A6' + Math.round(n).toLocaleString('en-NG'); };
    var pct = function(r){ return r.toFixed(1) + '%'; };

    // NTA 2026 bands (annual)
    var NTA_BANDS = [
      { limit: 800000, rate: 0 },
      { limit: 2200000, rate: 0.15 },
      { limit: 9000000, rate: 0.18 },
      { limit: 13000000, rate: 0.21 },
      { limit: 25000000, rate: 0.23 },
      { limit: Infinity, rate: 0.25 }
    ];

    // PITA 2025 bands (annual, on taxable after CRA)
    var PITA_BANDS = [
      { limit: 300000, rate: 0.07 },
      { limit: 300000, rate: 0.11 },
      { limit: 500000, rate: 0.15 },
      { limit: 500000, rate: 0.19 },
      { limit: 1600000, rate: 0.21 },
      { limit: Infinity, rate: 0.24 }
    ];

    function progressiveTax(income, bands) {
      var tax = 0, rem = income, bd = [];
      for (var i = 0; i < bands.length; i++) {
        if (rem <= 0) break;
        var b = bands[i];
        var chunk = Math.min(rem, isFinite(b.limit) ? b.limit : rem);
        var t = chunk * b.rate;
        bd.push({ rate: b.rate * 100, income: chunk, tax: t });
        tax += t; rem -= chunk;
      }
      return { tax: tax, bands: bd };
    }

    function calcNTA(gross, pensionRate) {
      var pension = gross * pensionRate;
      var nhf = gross * 0.025;
      var statutory = pension + nhf;
      var taxable = Math.max(0, gross - statutory);
      var r = progressiveTax(taxable, NTA_BANDS);
      var net = gross - statutory - r.tax;
      return { gross: gross, pension: pension, nhf: nhf, statutory: statutory, taxable: taxable, tax: r.tax, net: net, bands: r.bands, effectiveRate: gross > 0 ? r.tax / gross * 100 : 0 };
    }

    function calcPITA(gross, pensionRate) {
      var pension = gross * pensionRate;
      var nhf = gross * 0.025;
      var statutory = pension + nhf;
      var craBase = Math.max(200000, gross * 0.01);
      var cra = craBase + gross * 0.20;
      var taxable = Math.max(0, gross - statutory - cra);
      var r = progressiveTax(taxable, PITA_BANDS);
      var minTax = gross * 0.01;
      var finalTax = taxable > 0 ? Math.max(r.tax, minTax) : 0;
      var isExempt = gross <= 840000;
      var effectiveTax = isExempt ? 0 : finalTax;
      var net = gross - statutory - effectiveTax;
      return { gross: gross, pension: pension, nhf: nhf, statutory: statutory, cra: cra, taxable: taxable, tax: effectiveTax, net: net, bands: r.bands, effectiveRate: gross > 0 ? effectiveTax / gross * 100 : 0, isExempt: isExempt };
    }

    // Build UI
    container.innerHTML =
      '<div class="aw-title">\uD83C\uDDF3\uD83C\uDDEC Nigeria PAYE Calculator</div>' +
      '<div class="aw-tabs" id="awNgRegime">' +
        '<button class="aw-tab aw-tab--active" data-r="nta">NTA 2026</button>' +
        '<button class="aw-tab" data-r="pita">PITA 2025</button>' +
      '</div>' +
      '<div class="aw-field"><label class="aw-label">Annual Gross Salary (\u20A6)</label>' +
        '<input class="aw-input" id="awNgGross" type="text" inputmode="numeric" placeholder="e.g. 6,000,000">' +
      '</div>' +
      '<div class="aw-row">' +
        '<div class="aw-field"><label class="aw-label">Pension Rate</label>' +
          '<select class="aw-select" id="awNgPension"><option value="0.08">8% (Standard)</option><option value="0.10">10%</option><option value="0">None</option></select>' +
        '</div>' +
      '</div>' +
      '<button class="aw-btn aw-btn--primary" id="awNgCalc">Calculate PAYE</button>' +
      '<div id="awNgResult"></div>' +
      (opts.footerHTML || '');

    var regime = 'nta';
    var tabs = container.querySelectorAll('.aw-tab');
    for (var t = 0; t < tabs.length; t++) {
      tabs[t].addEventListener('click', (function(tab) {
        return function() {
          for (var j = 0; j < tabs.length; j++) tabs[j].classList.remove('aw-tab--active');
          tab.classList.add('aw-tab--active');
          regime = tab.getAttribute('data-r');
        };
      })(tabs[t]));
    }

    container.querySelector('#awNgCalc').addEventListener('click', function() {
      var raw = container.querySelector('#awNgGross').value.replace(/[^0-9.]/g, '');
      var gross = parseFloat(raw) || 0;
      if (!gross) return;
      var pensionRate = parseFloat(container.querySelector('#awNgPension').value);
      var R = regime === 'nta' ? calcNTA(gross, pensionRate) : calcPITA(gross, pensionRate);
      var d = container.querySelector('#awNgResult');
      d.innerHTML =
        '<div class="aw-result-box">' +
          '<div class="aw-result-label">Monthly Take-Home (' + (regime === 'nta' ? 'NTA 2026' : 'PITA 2025') + ')</div>' +
          '<div class="aw-result-main">' + fmt(R.net / 12) + '</div>' +
        '</div>' +
        '<div style="margin-top:12px">' +
          '<div class="aw-result-row"><span>Annual Gross</span><span>' + fmt(R.gross) + '</span></div>' +
          '<div class="aw-result-row"><span>Pension (' + (pensionRate * 100) + '%)</span><span>-' + fmt(R.pension) + '</span></div>' +
          '<div class="aw-result-row"><span>NHF (2.5%)</span><span>-' + fmt(R.nhf) + '</span></div>' +
          (regime === 'pita' ? '<div class="aw-result-row"><span>CRA</span><span>-' + fmt(R.cra) + '</span></div>' : '') +
          '<div class="aw-result-row"><span>Taxable Income</span><span>' + fmt(R.taxable) + '</span></div>' +
          '<hr class="aw-divider">' +
          '<div class="aw-result-row"><span>PAYE Tax</span><span style="color:#dc2626">-' + fmt(R.tax) + '</span></div>' +
          '<div class="aw-result-row"><span>Effective Rate</span><span>' + pct(R.effectiveRate) + '</span></div>' +
          '<hr class="aw-divider">' +
          '<div class="aw-result-row" style="font-weight:700"><span>Annual Net</span><span style="color:#007AFF">' + fmt(R.net) + '</span></div>' +
          '<div class="aw-result-row" style="font-weight:700"><span>Monthly Net</span><span style="color:#007AFF">' + fmt(R.net / 12) + '</span></div>' +
        '</div>';
    });

    // Enter key
    container.querySelector('#awNgGross').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') container.querySelector('#awNgCalc').click();
    });
  };
})();
