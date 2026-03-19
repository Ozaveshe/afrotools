/**
 * AfroTools — Eswatini PAYE Widget (SRA 2025/26)
 * Annual bands: 20% ≤E41k, 25% 41-80k, 30% 80-100k, 33% above 100k
 * Rebate E8,200/yr. SNPF 5% capped E600/mo
 */
(function() {
  'use strict';
  window.AfroWidgets = window.AfroWidgets || {};

  window.AfroWidgets.sz_paye = function(container, opts) {
    opts = opts || {};
    var fmt = function(n) { return 'E' + Math.round(n).toLocaleString('en'); };
    var pct = function(r) { return r.toFixed(1) + '%'; };

    // SRA annual progressive bands
    var BANDS = [
      { limit: 41000, rate: 0.20 },
      { limit: 39000, rate: 0.25 },
      { limit: 20000, rate: 0.30 },
      { limit: Infinity, rate: 0.33 }
    ];

    function calculate(grossAnnual) {
      var snpf = Math.min(grossAnnual * 0.05, 600 * 12);
      var tax = 0, rem = grossAnnual;
      for (var i = 0; i < BANDS.length; i++) {
        if (rem <= 0) break;
        var b = BANDS[i];
        var chunk = Math.min(rem, isFinite(b.limit) ? b.limit : rem);
        tax += chunk * b.rate;
        rem -= chunk;
      }
      tax = Math.max(0, tax - 8200);
      var net = grossAnnual - snpf - tax;
      return {
        gross: grossAnnual, snpf: snpf, tax: tax, net: net,
        effectiveRate: grossAnnual > 0 ? tax / grossAnnual * 100 : 0
      };
    }

    container.innerHTML =
      '<div class="aw-title">\uD83C\uDDF8\uD83C\uDDFF Eswatini PAYE Calculator</div>' +
      '<div class="aw-field"><label class="aw-label">Monthly Gross Salary (SZL)</label>' +
        '<input class="aw-input" id="awSzGross" type="text" inputmode="numeric" placeholder="e.g. 10,000">' +
      '</div>' +
      '<button class="aw-btn aw-btn--primary" id="awSzCalc">Calculate PAYE</button>' +
      '<div id="awSzResult"></div>' +
      (opts.footerHTML || '');

    container.querySelector('#awSzCalc').addEventListener('click', function() {
      var monthly = parseFloat((container.querySelector('#awSzGross').value || '').replace(/[^0-9.]/g, '')) || 0;
      if (!monthly) return;
      var R = calculate(monthly * 12);
      container.querySelector('#awSzResult').innerHTML =
        '<div class="aw-result-box">' +
          '<div class="aw-result-label">Monthly Take-Home (SRA 2025/26)</div>' +
          '<div class="aw-result-main">' + fmt(R.net / 12) + '</div>' +
        '</div>' +
        '<div style="margin-top:12px">' +
          '<div class="aw-result-row"><span>Monthly Gross</span><span>' + fmt(monthly) + '</span></div>' +
          '<div class="aw-result-row"><span>SNPF (5%, cap E600/mo)</span><span>-' + fmt(R.snpf / 12) + '</span></div>' +
          '<hr class="aw-divider">' +
          '<div class="aw-result-row"><span>PAYE (after E8,200 rebate)</span><span style="color:#dc2626">-' + fmt(R.tax / 12) + '</span></div>' +
          '<div class="aw-result-row"><span>Effective Rate</span><span>' + pct(R.effectiveRate) + '</span></div>' +
          '<hr class="aw-divider">' +
          '<div class="aw-result-row" style="font-weight:700"><span>Net Salary</span><span style="color:#007AFF">' + fmt(R.net / 12) + '</span></div>' +
          '<div class="aw-result-row" style="font-weight:700"><span>Annual Net</span><span style="color:#007AFF">' + fmt(R.net) + '</span></div>' +
        '</div>';
    });

    container.querySelector('#awSzGross').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') container.querySelector('#awSzCalc').click();
    });
  };
})();
