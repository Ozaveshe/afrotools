(function(){
  window.AfroWidgets = window.AfroWidgets || {};
  window.AfroWidgets.currency_converter = function(container, opts) {
    opts = opts || {};
    var theme = opts.theme || 'light';
    var isDark = theme === 'dark';
    var bg = isDark ? '#1e1e1e' : '#fff';
    var fg = isDark ? '#f0f0f0' : '#1a1a1a';
    var muted = isDark ? '#aaa' : '#666';
    var border = isDark ? '#333' : '#e0e0e0';
    var accent = '#E8590C';

    var currencies = {
      NGN:{name:'Nigerian Naira',symbol:'\u20A6'},
      KES:{name:'Kenyan Shilling',symbol:'KSh'},
      ZAR:{name:'South African Rand',symbol:'R'},
      GHS:{name:'Ghanaian Cedi',symbol:'GH\u20B5'},
      EGP:{name:'Egyptian Pound',symbol:'E\u00A3'},
      TZS:{name:'Tanzanian Shilling',symbol:'TSh'},
      UGX:{name:'Ugandan Shilling',symbol:'USh'},
      RWF:{name:'Rwandan Franc',symbol:'FRw'},
      ETB:{name:'Ethiopian Birr',symbol:'Birr'},
      MAD:{name:'Moroccan Dirham',symbol:'MAD'},
      XOF:{name:'CFA Franc BCEAO',symbol:'CFA'},
      XAF:{name:'CFA Franc BEAC',symbol:'FCFA'},
      USD:{name:'US Dollar',symbol:'$'},
      EUR:{name:'Euro',symbol:'\u20AC'},
      GBP:{name:'British Pound',symbol:'\u00A3'}
    };

    var uid = 'aw_cur_' + Math.random().toString(36).substr(2,6);
    var currOpts = '';
    var keys = Object.keys(currencies);
    for (var i = 0; i < keys.length; i++) {
      var sel1 = keys[i] === 'USD' ? ' selected' : '';
      currOpts += '<option value="'+keys[i]+'"'+sel1+'>'+keys[i]+' — '+currencies[keys[i]].name+'</option>';
    }

    var html = '<div id="'+uid+'" style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:'+bg+';color:'+fg+';padding:20px;border-radius:12px;border:1px solid '+border+';max-width:420px;">';
    html += '<h3 style="margin:0 0 16px;font-size:1.1rem;">Currency Converter</h3>';

    html += '<div class="aw-field" style="margin-bottom:12px;"><label class="aw-label" style="display:block;font-size:0.85rem;color:'+muted+';margin-bottom:4px;">Amount</label><input class="aw-input" id="'+uid+'_amount" type="text" inputmode="decimal" value="1000" placeholder="1000" style="width:100%;padding:10px;border:1px solid '+border+';border-radius:8px;font-size:1rem;background:'+bg+';color:'+fg+';box-sizing:border-box;" /></div>';

    html += '<div class="aw-field" style="margin-bottom:12px;"><label class="aw-label" style="display:block;font-size:0.85rem;color:'+muted+';margin-bottom:4px;">From</label><select class="aw-select" id="'+uid+'_from" style="width:100%;padding:10px;border:1px solid '+border+';border-radius:8px;font-size:0.95rem;background:'+bg+';color:'+fg+';">'+currOpts+'</select></div>';

    html += '<div style="text-align:center;margin-bottom:12px;"><button id="'+uid+'_swap" style="background:none;border:1px solid '+border+';border-radius:50%;width:36px;height:36px;cursor:pointer;font-size:1.2rem;color:'+fg+';">&#x21C5;</button></div>';

    var currOpts2 = '';
    for (var j = 0; j < keys.length; j++) {
      var sel2 = keys[j] === 'NGN' ? ' selected' : '';
      currOpts2 += '<option value="'+keys[j]+'"'+sel2+'>'+keys[j]+' — '+currencies[keys[j]].name+'</option>';
    }
    html += '<div class="aw-field" style="margin-bottom:12px;"><label class="aw-label" style="display:block;font-size:0.85rem;color:'+muted+';margin-bottom:4px;">To</label><select class="aw-select" id="'+uid+'_to" style="width:100%;padding:10px;border:1px solid '+border+';border-radius:8px;font-size:0.95rem;background:'+bg+';color:'+fg+';">'+currOpts2+'</select></div>';

    html += '<button class="aw-btn aw-btn--primary" id="'+uid+'_calc" style="width:100%;padding:12px;background:'+accent+';color:#fff;border:none;border-radius:8px;font-size:1rem;cursor:pointer;font-weight:600;">Convert</button>';

    html += '<div id="'+uid+'_result" class="aw-result-box" style="display:none;margin-top:16px;padding:16px;background:'+(isDark?'#2a2a2a':'#f7f7f7')+';border-radius:10px;">';
    html += '<div class="aw-result-label" style="font-size:0.8rem;color:'+muted+';">Converted Amount</div>';
    html += '<div class="aw-result-main" id="'+uid+'_converted" style="font-size:1.6rem;font-weight:700;margin:4px 0;color:'+accent+';"></div>';
    html += '<div class="aw-divider" style="border-top:1px solid '+border+';margin:12px 0;"></div>';
    html += '<div class="aw-result-row" style="display:flex;justify-content:space-between;margin-bottom:6px;"><span style="color:'+muted+';font-size:0.85rem;">Exchange Rate</span><strong id="'+uid+'_rate" style="font-size:0.95rem;"></strong></div>';
    html += '<div style="font-size:0.75rem;color:'+muted+';margin-top:8px;" id="'+uid+'_note">Rates via AfroWidgetCurrency API</div>';
    html += '</div>';

    if (opts.footerHTML) html += '<div style="margin-top:12px;font-size:0.75rem;color:'+muted+';">'+opts.footerHTML+'</div>';
    html += '</div>';
    container.innerHTML = html;

    function parseAmt(s) { return parseFloat((s||'').replace(/,/g,'')) || 0; }

    document.getElementById(uid+'_swap').onclick = function() {
      var fromEl = document.getElementById(uid+'_from');
      var toEl = document.getElementById(uid+'_to');
      var tmp = fromEl.value;
      fromEl.value = toEl.value;
      toEl.value = tmp;
    };

    document.getElementById(uid+'_calc').onclick = function() {
      var amount = parseAmt(document.getElementById(uid+'_amount').value);
      var from = document.getElementById(uid+'_from').value;
      var to = document.getElementById(uid+'_to').value;
      if (amount <= 0 || !from || !to) return;

      // Try AfroWidgetCurrency API first, fallback to open API
      var apiUrl = '';
      if (window.AfroWidgetCurrency && window.AfroWidgetCurrency.convert) {
        window.AfroWidgetCurrency.convert(from, to, amount, function(result) {
          showResult(result.converted, result.rate, from, to, amount);
        });
        return;
      }

      // Fallback: fetch from open exchange rates API
      apiUrl = 'https://api.exchangerate-api.com/v4/latest/' + from;
      fetch(apiUrl)
        .then(function(r) { return r.json(); })
        .then(function(data) {
          if (data.rates && data.rates[to]) {
            var rate = data.rates[to];
            showResult(amount * rate, rate, from, to, amount);
          } else {
            document.getElementById(uid+'_note').textContent = 'Rate not available for this pair.';
          }
        })
        .catch(function() {
          document.getElementById(uid+'_note').textContent = 'Could not fetch rates. Check your connection.';
        });
    };

    function showResult(converted, rate, from, to, amount) {
      var sym = currencies[to] ? currencies[to].symbol : to;
      document.getElementById(uid+'_result').style.display = 'block';
      document.getElementById(uid+'_converted').textContent = sym + ' ' + converted.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      document.getElementById(uid+'_rate').textContent = '1 ' + from + ' = ' + rate.toFixed(4) + ' ' + to;
      document.getElementById(uid+'_note').textContent = 'Rates from exchange API. Last updated: ' + new Date().toLocaleDateString();
    }
  };
})();
