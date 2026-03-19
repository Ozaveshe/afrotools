(function(){
  'use strict';
  window.AfroWidgets = window.AfroWidgets || {};
  window.AfroWidgets.tz_vat = function(container, opts) {
    opts = opts || {};
    var RATE = 18;
    var SYM = 'TZS';
    var NAME = 'Tanzania';
    var FLAG = '\uD83C\uDDF9\uD83C\uDDFF';
    var INFO = 'Standard rate 18%. Basic food and health services exempt. Authority: TRA. Filing: Monthly. Threshold: TZS 200M/yr.';
    var theme = opts.theme || 'light';
    var fmt = function(n) { return SYM + ' ' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ','); };
    var parseAmt = function(s) { return parseFloat((s || '').replace(/,/g, '')) || 0; };

    container.innerHTML =
      '<div class="aw aw--' + theme + '">' +
        '<div class="aw-title">' + FLAG + ' ' + NAME + ' VAT Calculator</div>' +
        '<div class="aw-tabs" data-ref="mode">' +
          '<button class="aw-tab aw-tab--active" data-m="add">Add VAT</button>' +
          '<button class="aw-tab" data-m="extract">Extract VAT</button>' +
        '</div>' +
        '<div class="aw-field">' +
          '<label class="aw-label" data-ref="label">Amount (excl. VAT)</label>' +
          '<input class="aw-input" data-ref="amount" type="text" inputmode="decimal" placeholder="0.00">' +
        '</div>' +
        '<button class="aw-btn aw-btn--primary" data-ref="calc">Calculate VAT (' + RATE + '%)</button>' +
        '<div class="aw-result-box" data-ref="result" style="display:none">' +
          '<div class="aw-result-label" data-ref="resLabel">Total (VAT inclusive)</div>' +
          '<div class="aw-result-main" data-ref="resMain"></div>' +
          '<div class="aw-divider"></div>' +
          '<div class="aw-result-row"><span>Net Amount</span><strong data-ref="net"></strong></div>' +
          '<div class="aw-result-row"><span>VAT (' + RATE + '%)</span><strong data-ref="vat"></strong></div>' +
          '<div class="aw-result-row"><span>Total</span><strong data-ref="total"></strong></div>' +
        '</div>' +
        '<div class="aw-footer">' + INFO + '</div>' +
        (opts.footerHTML ? '<div class="aw-footer">' + opts.footerHTML + '</div>' : '') +
      '</div>';

    var mode = 'add';
    var q = function(sel) { return container.querySelector(sel); };
    var tabs = container.querySelectorAll('[data-ref="mode"] .aw-tab');

    for (var t = 0; t < tabs.length; t++) {
      tabs[t].addEventListener('click', function() {
        mode = this.getAttribute('data-m');
        for (var j = 0; j < tabs.length; j++) tabs[j].classList.remove('aw-tab--active');
        this.classList.add('aw-tab--active');
        q('[data-ref="label"]').textContent = mode === 'add' ? 'Amount (excl. VAT)' : 'Amount (incl. VAT)';
      });
    }

    var calculate = function() {
      var amount = parseAmt(q('[data-ref="amount"]').value);
      if (amount <= 0) return;
      var rate = RATE / 100;
      var net, vat, total;
      if (mode === 'add') { net = amount; vat = net * rate; total = net + vat; }
      else { total = amount; net = total / (1 + rate); vat = total - net; }
      q('[data-ref="result"]').style.display = '';
      q('[data-ref="resLabel"]').textContent = mode === 'add' ? 'Total (VAT inclusive)' : 'Net Amount (excl. VAT)';
      q('[data-ref="resMain"]').textContent = fmt(mode === 'add' ? total : net);
      q('[data-ref="net"]').textContent = fmt(net);
      q('[data-ref="vat"]').textContent = fmt(vat);
      q('[data-ref="total"]').textContent = fmt(total);
    };

    q('[data-ref="calc"]').addEventListener('click', calculate);
    q('[data-ref="amount"]').addEventListener('keydown', function(e) { if (e.key === 'Enter') calculate(); });
  };
})();
