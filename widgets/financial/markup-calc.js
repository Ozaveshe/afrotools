(function(){
  window.AfroWidgets = window.AfroWidgets || {};
  window.AfroWidgets.markup_calc = function(container, opts) {
    container.innerHTML =
      '<div class="aw-title">\u{1f4c8} Markup Calculator</div>' +
      '<div class="aw-row">' +
        '<div class="aw-field"><label class="aw-label">Cost Price</label><input class="aw-input" id="aw-cost" type="number" min="0" step="0.01" placeholder="0.00"></div>' +
        '<div class="aw-field"><label class="aw-label">Markup %</label><input class="aw-input" id="aw-markup" type="number" min="0" step="0.1" placeholder="e.g. 50"></div>' +
      '</div>' +
      '<button class="aw-btn aw-btn--primary" id="aw-calc">Calculate</button>' +
      '<div class="aw-result-box" id="aw-res" style="display:none"></div>' +
      (opts.footerHTML || '');
    function calc() {
      var cost = parseFloat(container.querySelector('#aw-cost').value) || 0;
      var markup = parseFloat(container.querySelector('#aw-markup').value) || 0;
      if (cost <= 0) return;
      var added = cost * markup / 100;
      var sell = cost + added;
      var margin = added / sell * 100;
      var f = function(n){return n.toLocaleString('en',{minimumFractionDigits:2,maximumFractionDigits:2})};
      var r = container.querySelector('#aw-res'); r.style.display='block';
      r.innerHTML = '<div class="aw-result-row"><span class="aw-result-label">Selling Price</span><span class="aw-result-main">'+f(sell)+'</span></div><div class="aw-result-row"><span class="aw-result-label">Profit</span><span class="aw-result-main">'+f(added)+'</span></div><hr class="aw-divider"><div class="aw-result-row"><span class="aw-result-label">Profit Margin</span><span>'+margin.toFixed(1)+'%</span></div>';
    }
    container.querySelector('#aw-calc').addEventListener('click',calc);
  };
})();
