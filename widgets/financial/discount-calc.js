(function(){
  window.AfroWidgets = window.AfroWidgets || {};
  window.AfroWidgets.discount_calc = function(container, opts) {
    container.innerHTML =
      '<div class="aw-title">\u{1f3f7}\ufe0f Discount Calculator</div>' +
      '<div class="aw-row">' +
        '<div class="aw-field"><label class="aw-label">Original Price</label><input class="aw-input" id="aw-orig" type="number" min="0" step="0.01" placeholder="0.00"></div>' +
        '<div class="aw-field"><label class="aw-label">Discount %</label><input class="aw-input" id="aw-disc" type="number" min="0" max="100" step="0.1" placeholder="e.g. 20"></div>' +
      '</div>' +
      '<button class="aw-btn aw-btn--primary" id="aw-calc">Calculate</button>' +
      '<div class="aw-result-box" id="aw-res" style="display:none"></div>' +
      (opts.footerHTML || '');
    function calc() {
      var orig = parseFloat(container.querySelector('#aw-orig').value) || 0;
      var disc = parseFloat(container.querySelector('#aw-disc').value) || 0;
      if (orig <= 0) return;
      var savings = orig * disc / 100;
      var sale = orig - savings;
      var f = function(n){return n.toLocaleString('en',{minimumFractionDigits:2,maximumFractionDigits:2})};
      var r = container.querySelector('#aw-res'); r.style.display='block';
      r.innerHTML = '<div class="aw-result-row"><span class="aw-result-label">Sale Price</span><span class="aw-result-main">'+f(sale)+'</span></div><div class="aw-result-row"><span class="aw-result-label">You Save</span><span class="aw-result-main" style="color:#007AFF">'+f(savings)+'</span></div><hr class="aw-divider"><div class="aw-result-row"><span class="aw-result-label">Original</span><span>'+f(orig)+'</span></div>';
    }
    container.querySelector('#aw-calc').addEventListener('click',calc);
  };
})();
