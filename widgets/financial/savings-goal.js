(function(){
  'use strict';
  window.AfroWidgets = window.AfroWidgets || {};
  window.AfroWidgets.savings_goal = function(container, opts) {
    opts = opts || {};
    container.innerHTML =
      '<div class="aw-title">Savings Goal Calculator</div>' +
      '<div class="aw-field"><label class="aw-label">Target Amount</label><input class="aw-input" id="aw-target" type="number" min="0" inputmode="decimal" placeholder="e.g. 1000000"></div>' +
      '<div class="aw-field"><label class="aw-label">Current Savings</label><input class="aw-input" id="aw-current" type="number" min="0" inputmode="decimal" placeholder="0" value="0"></div>' +
      '<div class="aw-row">' +
        '<div class="aw-field"><label class="aw-label">Interest Rate (%)</label><input class="aw-input" id="aw-rate" type="number" min="0" step="0.1" inputmode="decimal" value="5"></div>' +
        '<div class="aw-field"><label class="aw-label">Time (months)</label><input class="aw-input" id="aw-months" type="number" min="1" inputmode="numeric" value="12"></div>' +
      '</div>' +
      '<button class="aw-btn aw-btn--primary" id="aw-calc">Calculate</button>' +
      '<div class="aw-result-box" id="aw-res" style="display:none"></div>' +
      (opts.footerHTML || '');

    var fmt = function(n) { return n.toLocaleString('en', {minimumFractionDigits: 2, maximumFractionDigits: 2}); };

    function calc() {
      var target = parseFloat(container.querySelector('#aw-target').value) || 0;
      var current = parseFloat(container.querySelector('#aw-current').value) || 0;
      var rate = parseFloat(container.querySelector('#aw-rate').value) || 0;
      var months = parseInt(container.querySelector('#aw-months').value) || 0;
      if (target <= 0 || months <= 0) return;

      var r = rate / 100 / 12;
      var monthly;
      if (r > 0) {
        var growthFactor = Math.pow(1 + r, months);
        monthly = (target - current * growthFactor) / ((growthFactor - 1) / r);
      } else {
        monthly = (target - current) / months;
      }
      if (monthly < 0) monthly = 0;

      var totalDeposits = monthly * months + current;
      var interestEarned = target - totalDeposits;

      var res = container.querySelector('#aw-res');
      res.style.display = 'block';
      res.innerHTML =
        '<div class="aw-result-label">Monthly Savings Needed</div>' +
        '<div class="aw-result-main">' + fmt(monthly) + '</div>' +
        '<hr class="aw-divider">' +
        '<div class="aw-result-row"><span class="aw-result-label">Total Deposits</span><span>' + fmt(totalDeposits) + '</span></div>' +
        '<div class="aw-result-row"><span class="aw-result-label">Interest Earned</span><span>' + fmt(Math.max(0, interestEarned)) + '</span></div>';
    }

    container.querySelector('#aw-calc').addEventListener('click', calc);
    container.querySelectorAll('input').forEach(function(i) { i.addEventListener('keyup', function(e) { if (e.key === 'Enter') calc(); }); });
  };
})();
