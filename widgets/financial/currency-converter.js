(function(){
  'use strict';
  window.AfroWidgets = window.AfroWidgets || {};
  window.AfroWidgets.currency_converter = function(container, opts) {
    opts = opts || {};
    var currencies = [
      'NGN', 'KES', 'ZAR', 'GHS', 'EGP', 'TZS', 'UGX', 'RWF', 'ETB', 'MAD',
      'XOF', 'XAF', 'ZMW', 'MWK', 'BWP', 'USD', 'EUR', 'GBP', 'CNY', 'JPY'
    ];
    var fromOpts = '';
    var toOpts = '';
    for (var i = 0; i < currencies.length; i++) {
      var c = currencies[i];
      fromOpts += '<option value="' + c + '"' + (c === 'USD' ? ' selected' : '') + '>' + c + '</option>';
      toOpts += '<option value="' + c + '"' + (c === 'NGN' ? ' selected' : '') + '>' + c + '</option>';
    }

    container.innerHTML =
      '<div class="aw-title">Currency Converter</div>' +
      '<div class="aw-field"><label class="aw-label">Amount</label><input class="aw-input" id="aw-amt" type="number" min="0" inputmode="decimal" value="1000"></div>' +
      '<div class="aw-row">' +
        '<div class="aw-field"><label class="aw-label">From</label><select class="aw-select" id="aw-from">' + fromOpts + '</select></div>' +
        '<div class="aw-field"><label class="aw-label">To</label><select class="aw-select" id="aw-to">' + toOpts + '</select></div>' +
      '</div>' +
      '<button class="aw-btn aw-btn--primary" id="aw-calc">Convert</button>' +
      '<div class="aw-result-box" id="aw-res" style="display:none"></div>' +
      (opts.footerHTML || '');

    var fmt = function(n) { return n.toLocaleString('en', {minimumFractionDigits: 2, maximumFractionDigits: 2}); };

    function showResult(converted, rate, from, to) {
      var res = container.querySelector('#aw-res');
      res.style.display = 'block';
      res.innerHTML =
        '<div class="aw-result-label">Converted Amount</div>' +
        '<div class="aw-result-main">' + to + ' ' + fmt(converted) + '</div>' +
        '<hr class="aw-divider">' +
        '<div class="aw-result-row"><span class="aw-result-label">Rate</span><span>1 ' + from + ' = ' + rate.toFixed(4) + ' ' + to + '</span></div>';
    }

    function calc() {
      var amount = parseFloat(container.querySelector('#aw-amt').value) || 0;
      var from = container.querySelector('#aw-from').value;
      var to = container.querySelector('#aw-to').value;
      if (amount <= 0 || !from || !to) return;

      if (window.AfroWidgetCurrency && window.AfroWidgetCurrency.convert) {
        window.AfroWidgetCurrency.convert(from, to, amount, function(result) {
          showResult(result.converted, result.rate, from, to);
        });
        return;
      }

      fetch('https://api.exchangerate-api.com/v4/latest/' + from)
        .then(function(r) { return r.json(); })
        .then(function(data) {
          if (data.rates && data.rates[to]) {
            showResult(amount * data.rates[to], data.rates[to], from, to);
          }
        })
        .catch(function() {
          var res = container.querySelector('#aw-res');
          res.style.display = 'block';
          res.innerHTML = '<div class="aw-result-label">Could not fetch rates. Check connection.</div>';
        });
    }

    container.querySelector('#aw-calc').addEventListener('click', calc);
    container.querySelector('#aw-amt').addEventListener('keyup', function(e) { if (e.key === 'Enter') calc(); });
  };
})();
