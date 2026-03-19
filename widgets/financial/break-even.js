(function(){
  'use strict';
  window.AfroWidgets = window.AfroWidgets || {};
  window.AfroWidgets.break_even = function(container, opts) {
    opts = opts || {};
    container.innerHTML =
      '<div class="aw-title">Break-Even Calculator</div>' +
      '<div class="aw-field"><label class="aw-label">Fixed Costs</label><input class="aw-input" id="aw-fixed" type="number" min="0" inputmode="decimal" placeholder="e.g. 500000"></div>' +
      '<div class="aw-row">' +
        '<div class="aw-field"><label class="aw-label">Variable Cost / Unit</label><input class="aw-input" id="aw-var" type="number" min="0" inputmode="decimal" placeholder="e.g. 200"></div>' +
        '<div class="aw-field"><label class="aw-label">Selling Price / Unit</label><input class="aw-input" id="aw-price" type="number" min="0" inputmode="decimal" placeholder="e.g. 500"></div>' +
      '</div>' +
      '<button class="aw-btn aw-btn--primary" id="aw-calc">Calculate</button>' +
      '<div class="aw-result-box" id="aw-res" style="display:none"></div>' +
      (opts.footerHTML || '');

    var fmt = function(n) { return n.toLocaleString('en', {minimumFractionDigits: 2, maximumFractionDigits: 2}); };

    function calc() {
      var fixed = parseFloat(container.querySelector('#aw-fixed').value) || 0;
      var varCost = parseFloat(container.querySelector('#aw-var').value) || 0;
      var price = parseFloat(container.querySelector('#aw-price').value) || 0;
      if (fixed <= 0 || price <= varCost) return;

      var margin = price - varCost;
      var marginPct = (margin / price) * 100;
      var units = Math.ceil(fixed / margin);
      var revenue = units * price;

      var res = container.querySelector('#aw-res');
      res.style.display = 'block';
      res.innerHTML =
        '<div class="aw-result-label">Break-Even Point</div>' +
        '<div class="aw-result-main">' + units.toLocaleString('en') + ' units</div>' +
        '<hr class="aw-divider">' +
        '<div class="aw-result-row"><span class="aw-result-label">Break-Even Revenue</span><span>' + fmt(revenue) + '</span></div>' +
        '<div class="aw-result-row"><span class="aw-result-label">Contribution Margin</span><span>' + fmt(margin) + ' / unit</span></div>' +
        '<div class="aw-result-row"><span class="aw-result-label">Contribution Margin %</span><span>' + marginPct.toFixed(1) + '%</span></div>';
    }

    container.querySelector('#aw-calc').addEventListener('click', calc);
    container.querySelectorAll('input').forEach(function(i) { i.addEventListener('keyup', function(e) { if (e.key === 'Enter') calc(); }); });
  };
})();
