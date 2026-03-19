(function(){
  'use strict';
  window.AfroWidgets = window.AfroWidgets || {};
  window.AfroWidgets.markup_calc = function(container, opts) {
    opts = opts || {};
    container.innerHTML =
      '<div class="aw-title">Markup Calculator</div>' +
      '<div class="aw-row">' +
        '<div class="aw-field"><label class="aw-label">Cost Price</label><input class="aw-input" id="aw-cost" type="number" min="0" step="0.01" inputmode="decimal" placeholder="0.00"></div>' +
        '<div class="aw-field"><label class="aw-label">Markup %</label><input class="aw-input" id="aw-markup" type="number" min="0" step="0.1" inputmode="decimal" placeholder="e.g. 50"></div>' +
      '</div>' +
      '<button class="aw-btn aw-btn--primary" id="aw-calc">Calculate</button>' +
      '<div class="aw-result-box" id="aw-res" style="display:none"></div>' +
      (opts.footerHTML || '');

    var fmt = function(n) { return n.toLocaleString('en', {minimumFractionDigits: 2, maximumFractionDigits: 2}); };

    function calc() {
      var cost = parseFloat(container.querySelector('#aw-cost').value) || 0;
      var markup = parseFloat(container.querySelector('#aw-markup').value) || 0;
      if (cost <= 0) return;

      var profit = cost * markup / 100;
      var sell = cost + profit;
      var margin = sell > 0 ? (profit / sell * 100) : 0;

      var res = container.querySelector('#aw-res');
      res.style.display = 'block';
      res.innerHTML =
        '<div class="aw-result-label">Selling Price</div>' +
        '<div class="aw-result-main">' + fmt(sell) + '</div>' +
        '<hr class="aw-divider">' +
        '<div class="aw-result-row"><span class="aw-result-label">Profit</span><span>' + fmt(profit) + '</span></div>' +
        '<div class="aw-result-row"><span class="aw-result-label">Profit Margin</span><span>' + margin.toFixed(1) + '%</span></div>';
    }

    container.querySelector('#aw-calc').addEventListener('click', calc);
    container.querySelectorAll('input').forEach(function(i) { i.addEventListener('keyup', function(e) { if (e.key === 'Enter') calc(); }); });
  };
})();
