(function(){
  'use strict';
  window.AfroWidgets = window.AfroWidgets || {};
  window.AfroWidgets.budget_planner = function(container, opts) {
    opts = opts || {};
    container.innerHTML =
      '<div class="aw-title">Budget Planner</div>' +
      '<div class="aw-field"><label class="aw-label">Monthly Income</label><input class="aw-input" id="aw-income" type="number" min="0" inputmode="decimal" placeholder="0"></div>' +
      '<div class="aw-field"><label class="aw-label">Housing / Rent</label><input class="aw-input" id="aw-rent" type="number" min="0" inputmode="decimal" placeholder="0"></div>' +
      '<div class="aw-row">' +
        '<div class="aw-field"><label class="aw-label">Food</label><input class="aw-input" id="aw-food" type="number" min="0" inputmode="decimal" placeholder="0"></div>' +
        '<div class="aw-field"><label class="aw-label">Transport</label><input class="aw-input" id="aw-transport" type="number" min="0" inputmode="decimal" placeholder="0"></div>' +
      '</div>' +
      '<div class="aw-row">' +
        '<div class="aw-field"><label class="aw-label">Utilities</label><input class="aw-input" id="aw-utilities" type="number" min="0" inputmode="decimal" placeholder="0"></div>' +
        '<div class="aw-field"><label class="aw-label">Other</label><input class="aw-input" id="aw-other" type="number" min="0" inputmode="decimal" placeholder="0"></div>' +
      '</div>' +
      '<button class="aw-btn aw-btn--primary" id="aw-calc">Calculate Budget</button>' +
      '<div class="aw-result-box" id="aw-res" style="display:none"></div>' +
      (opts.footerHTML || '');

    var fmt = function(n) { return Math.round(n).toLocaleString('en'); };

    function calc() {
      var income = parseFloat(container.querySelector('#aw-income').value) || 0;
      var cats = ['rent', 'food', 'transport', 'utilities', 'other'];
      var total = 0;
      cats.forEach(function(c) { total += parseFloat(container.querySelector('#aw-' + c).value) || 0; });
      if (income <= 0) return;

      var remaining = income - total;
      var savingsRate = (remaining / income * 100);
      var needs50 = income * 0.5;
      var wants30 = income * 0.3;
      var save20 = income * 0.2;

      var res = container.querySelector('#aw-res');
      res.style.display = 'block';
      res.innerHTML =
        '<div class="aw-result-row"><span class="aw-result-label">Total Expenses</span><span class="aw-result-main">' + fmt(total) + '</span></div>' +
        '<div class="aw-result-row"><span class="aw-result-label">Remaining</span><span class="aw-result-main">' + fmt(remaining) + '</span></div>' +
        '<div class="aw-result-row"><span class="aw-result-label">Savings Rate</span><span>' + savingsRate.toFixed(1) + '%</span></div>' +
        '<hr class="aw-divider">' +
        '<div class="aw-result-label">50/30/20 Rule Guide</div>' +
        '<div class="aw-result-row"><span class="aw-result-label">Needs (50%)</span><span>' + fmt(needs50) + '</span></div>' +
        '<div class="aw-result-row"><span class="aw-result-label">Wants (30%)</span><span>' + fmt(wants30) + '</span></div>' +
        '<div class="aw-result-row"><span class="aw-result-label">Savings (20%)</span><span>' + fmt(save20) + '</span></div>';
    }

    container.querySelector('#aw-calc').addEventListener('click', calc);
    container.querySelectorAll('input').forEach(function(i) { i.addEventListener('keyup', function(e) { if (e.key === 'Enter') calc(); }); });
  };
})();
