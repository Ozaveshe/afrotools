(function(){
  window.AfroWidgets = window.AfroWidgets || {};
  window.AfroWidgets.CryptoConverter = function(container, opts) {
    opts = opts || {};
    var theme = opts.theme || 'light';
    var isDark = theme === 'dark';
    var bg = isDark ? '#1a1a2e' : '#fff';
    var text = isDark ? '#e2e8f0' : '#0f1419';
    var border = isDark ? '#334155' : '#e2e8f0';
    var accent = '#f59e0b';
    var inputBg = isDark ? '#0f172a' : '#f8fafc';

    var CRYPTOS = {
      bitcoin: { symbol: 'BTC', name: 'Bitcoin' },
      ethereum: { symbol: 'ETH', name: 'Ethereum' },
      tether: { symbol: 'USDT', name: 'Tether' },
      binancecoin: { symbol: 'BNB', name: 'BNB' },
      solana: { symbol: 'SOL', name: 'Solana' },
      ripple: { symbol: 'XRP', name: 'XRP' }
    };

    var CURRENCIES = {
      ngn: { symbol: '\u20A6', name: 'Nigerian Naira' },
      kes: { symbol: 'KES', name: 'Kenyan Shilling' },
      ghs: { symbol: 'GH\u20B5', name: 'Ghanaian Cedi' },
      zar: { symbol: 'R', name: 'South African Rand' },
      egp: { symbol: 'E\u00A3', name: 'Egyptian Pound' },
      usd: { symbol: '$', name: 'US Dollar' },
      eur: { symbol: '\u20AC', name: 'Euro' },
      gbp: { symbol: '\u00A3', name: 'British Pound' }
    };

    var CACHE_KEY = 'aw_crypto_rates';
    var CACHE_TTL = 10 * 60 * 1000;
    var rates = null;

    container.innerHTML = '<div class="aw-crypto-converter" style="font-family:\'DM Sans\',system-ui,sans-serif;background:'+bg+';color:'+text+';border:1px solid '+border+';border-radius:10px;overflow:hidden">' +
      '<div style="padding:15px 22px;border-bottom:1px solid '+border+';background:'+(isDark?'#0f172a':'#f8fafc')+'">' +
        '<span style="font-size:.72rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase">Crypto to African Currency</span>' +
      '</div>' +
      '<div style="padding:22px">' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px">' +
          '<div><label style="display:block;font-size:.72rem;font-weight:600;color:#64748b;margin-bottom:5px">Cryptocurrency</label>' +
            '<select id="aw-cc-crypto" style="width:100%;padding:9px 12px;border:1.5px solid '+border+';border-radius:7px;font-size:.82rem;background:'+inputBg+';color:'+text+';font-family:inherit">' +
              Object.keys(CRYPTOS).map(function(k){ return '<option value="'+k+'">'+CRYPTOS[k].symbol+' - '+CRYPTOS[k].name+'</option>'; }).join('') +
            '</select></div>' +
          '<div><label style="display:block;font-size:.72rem;font-weight:600;color:#64748b;margin-bottom:5px">Currency</label>' +
            '<select id="aw-cc-currency" style="width:100%;padding:9px 12px;border:1.5px solid '+border+';border-radius:7px;font-size:.82rem;background:'+inputBg+';color:'+text+';font-family:inherit">' +
              Object.keys(CURRENCIES).map(function(k){ return '<option value="'+k+'">'+CURRENCIES[k].symbol+' - '+CURRENCIES[k].name+'</option>'; }).join('') +
            '</select></div>' +
        '</div>' +
        '<div style="margin-bottom:14px"><label style="display:block;font-size:.72rem;font-weight:600;color:#64748b;margin-bottom:5px">Amount</label>' +
          '<input type="number" id="aw-cc-amount" value="1" min="0" step="0.01" style="width:100%;padding:9px 12px;border:1.5px solid '+border+';border-radius:7px;font-size:.82rem;background:'+inputBg+';color:'+text+';font-family:inherit;box-sizing:border-box">' +
        '</div>' +
        '<button id="aw-cc-btn" style="display:block;width:100%;padding:12px;border:none;border-radius:8px;font-size:.82rem;font-weight:700;cursor:pointer;background:linear-gradient(135deg,#d97706,'+accent+');color:#fff;font-family:inherit">Convert</button>' +
        '<div id="aw-cc-result" style="margin-top:14px;text-align:center;padding:20px;background:'+(isDark?'#1e293b':'#fffbeb')+';border:1px solid '+(isDark?'#334155':'#fde68a')+';border-radius:8px;display:none">' +
          '<div id="aw-cc-result-value" style="font-size:1.8rem;font-weight:800;color:'+accent+'"></div>' +
          '<div id="aw-cc-result-rate" style="font-size:.72rem;color:#64748b;margin-top:4px"></div>' +
        '</div>' +
        (opts.footerHTML ? '<div style="margin-top:14px">'+opts.footerHTML+'</div>' : '') +
      '</div>' +
    '</div>';

    function getCachedRates() {
      try {
        var cached = sessionStorage.getItem(CACHE_KEY);
        if (cached) {
          var parsed = JSON.parse(cached);
          if (Date.now() - parsed.timestamp < CACHE_TTL) return parsed.data;
        }
      } catch(e) {}
      return null;
    }

    function cacheRates(data) {
      try {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data: data }));
      } catch(e) {}
    }

    function fetchRates(cb) {
      var cached = getCachedRates();
      if (cached) { rates = cached; cb(); return; }
      var url = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tether,binancecoin,solana,ripple&vs_currencies=ngn,kes,ghs,zar,egp,usd,eur,gbp';
      var xhr = new XMLHttpRequest();
      xhr.open('GET', url);
      xhr.onload = function() {
        if (xhr.status === 200) {
          try {
            rates = JSON.parse(xhr.responseText);
            cacheRates(rates);
            cb();
          } catch(e) { cb('Parse error'); }
        } else { cb('API error: ' + xhr.status); }
      };
      xhr.onerror = function() { cb('Network error'); };
      xhr.send();
    }

    function convert() {
      var crypto = container.querySelector('#aw-cc-crypto').value;
      var currency = container.querySelector('#aw-cc-currency').value;
      var amount = parseFloat(container.querySelector('#aw-cc-amount').value) || 0;
      var resultDiv = container.querySelector('#aw-cc-result');
      var valueDiv = container.querySelector('#aw-cc-result-value');
      var rateDiv = container.querySelector('#aw-cc-result-rate');
      var btn = container.querySelector('#aw-cc-btn');

      btn.textContent = 'Loading...';
      fetchRates(function(err) {
        btn.textContent = 'Convert';
        if (err || !rates || !rates[crypto] || !rates[crypto][currency]) {
          valueDiv.textContent = 'Unable to fetch rates';
          rateDiv.textContent = err || 'Rate not available';
          resultDiv.style.display = 'block';
          return;
        }
        var rate = rates[crypto][currency];
        var result = amount * rate;
        var cur = CURRENCIES[currency];
        valueDiv.textContent = cur.symbol + ' ' + result.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        rateDiv.textContent = '1 ' + CRYPTOS[crypto].symbol + ' = ' + cur.symbol + ' ' + rate.toLocaleString('en');
        resultDiv.style.display = 'block';
      });
    }

    container.querySelector('#aw-cc-btn').addEventListener('click', convert);
  };
})();
