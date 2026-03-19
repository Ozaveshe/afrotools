(function(){
  'use strict';
  window.AfroWidgets = window.AfroWidgets || {};
  window.AfroWidgets.profit_margin = function(container, opts) {
    opts = opts || {};
    container.innerHTML =
      '<div class="aw-title">Profit Margin Calculator</div>' +
      '<div class="aw-row">' +
        '<div class="aw-field"><label class="aw-label">Cost Price</label><input class="aw-input" id="aw-cost" type="number" min="0" step="0.01" inputmode="decimal" placeholder="0.00"></div>' +
        '<div class="aw-field"><label class="aw-label">Selling Price</label><input class="aw-input" id="aw-sell" type="number" min="0" step="0.01" inputmode="decimal" placeholder="0.00"></div>' +
      '</div>' +
      '<button class="aw-btn aw-btn--primary" id="aw-calc">Calculate</button>' +
      '<div class="aw-result-box" id="aw-res" style="display:none"></div>' +
      (opts.footerHTML || '');

    var fmt = function(n) { return n.toLocaleString('en', {minimumFractionDigits: 2, maximumFractionDigits: 2}); };

    function calc() {
      var cost = parseFloat(container.querySelector('#aw-cost').value) || 0;
      var sell = parseFloat(container.querySelector('#aw-sell').value) || 0;
      if (cost <= 0 || sell <= 0) return;

      var profit = sell - cost;
      var margin = (profit / sell) * 100;
      var markup = (profit / cost) * 100;

      var res = container.querySelector('#aw-res');
      res.style.display = 'block';
      res.innerHTML =
        '<div class="aw-result-label">Gross Profit</div>' +
        '<div class="aw-result-main">' + fmt(profit) + '</div>' +
        '<hr class="aw-divider">' +
        '<div class="aw-result-row"><span class="aw-result-label">Profit Margin</span><span>' + margin.toFixed(1) + '%</span></div>' +
        '<div class="aw-result-row"><span class="aw-result-label">Markup</span><span>' + markup.toFixed(1) + '%</span></div>';
    }

    container.querySelector('#aw-calc').addEventListener('click', calc);
    container.querySelectorAll('input').forEach(function(i) { i.addEventListener('keyup', function(e) { if (e.key === 'Enter') calc(); }); });
  };
})();
