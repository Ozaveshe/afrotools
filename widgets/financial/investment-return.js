(function(){
  'use strict';
  window.AfroWidgets = window.AfroWidgets || {};
  window.AfroWidgets.investment_return = function(container, opts) {
    opts = opts || {};
    container.innerHTML =
      '<div class="aw-title">Investment Return Calculator</div>' +
      '<div class="aw-field"><label class="aw-label">Initial Investment</label><input class="aw-input" id="aw-initial" type="number" min="0" inputmode="decimal" placeholder="e.g. 100000"></div>' +
      '<div class="aw-field"><label class="aw-label">Monthly Contribution</label><input class="aw-input" id="aw-monthly" type="number" min="0" inputmode="decimal" placeholder="0" value="0"></div>' +
      '<div class="aw-row">' +
        '<div class="aw-field"><label class="aw-label">Annual Rate (%)</label><input class="aw-input" id="aw-rate" type="number" min="0" step="0.1" inputmode="decimal" value="10"></div>' +
        '<div class="aw-field"><label class="aw-label">Years</label><input class="aw-input" id="aw-years" type="number" min="1" inputmode="numeric" value="10"></div>' +
      '</div>' +
      '<div class="aw-field"><label class="aw-label">Compounding</label><select class="aw-select" id="aw-compound"><option value="12">Monthly</option><option value="4">Quarterly</option><option value="1">Annually</option></select></div>' +
      '<button class="aw-btn aw-btn--primary" id="aw-calc">Calculate Returns</button>' +
      '<div class="aw-result-box" id="aw-res" style="display:none"></div>' +
      (opts.footerHTML || '');

    var fmt = function(n) { return n.toLocaleString('en', {minimumFractionDigits: 2, maximumFractionDigits: 2}); };

    function calc() {
      var initial = parseFloat(container.querySelector('#aw-initial').value) || 0;
      var monthly = parseFloat(container.querySelector('#aw-monthly').value) || 0;
      var annualRate = parseFloat(container.querySelector('#aw-rate').value) || 0;
      var years = parseInt(container.querySelector('#aw-years').value) || 0;
      var compFreq = parseInt(container.querySelector('#aw-compound').value) || 12;
      if ((initial <= 0 && monthly <= 0) || years <= 0) return;

      var r = annualRate / 100 / 12;
      var n = years * 12;
      var balance = initial;
      for (var m = 0; m < n; m++) {
        balance += monthly;
        balance *= (1 + r);
      }

      var totalInvested = initial + monthly * n;
      var totalInterest = balance - totalInvested;
      var roi = totalInvested > 0 ? (totalInterest / totalInvested * 100) : 0;
      var rule72 = annualRate > 0 ? (72 / annualRate).toFixed(1) : 'N/A';

      var res = container.querySelector('#aw-res');
      res.style.display = 'block';
      res.innerHTML =
        '<div class="aw-result-label">Final Value</div>' +
        '<div class="aw-result-main">' + fmt(balance) + '</div>' +
        '<hr class="aw-divider">' +
        '<div class="aw-result-row"><span class="aw-result-label">Total Invested</span><span>' + fmt(totalInvested) + '</span></div>' +
        '<div class="aw-result-row"><span class="aw-result-label">Total Interest</span><span>' + fmt(totalInterest) + '</span></div>' +
        '<div class="aw-result-row"><span class="aw-result-label">ROI</span><span>' + roi.toFixed(1) + '%</span></div>' +
        '<div class="aw-result-row"><span class="aw-result-label">Rule of 72</span><span>' + rule72 + ' yrs to double</span></div>';
    }

    container.querySelector('#aw-calc').addEventListener('click', calc);
    container.querySelectorAll('input').forEach(function(i) { i.addEventListener('keyup', function(e) { if (e.key === 'Enter') calc(); }); });
  };
})();
