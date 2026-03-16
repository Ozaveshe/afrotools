(function(){
  window.AfroWidgets = window.AfroWidgets || {};
  window.AfroWidgets.DCACalc = function(container, opts) {
    opts = opts || {};
    var theme = opts.theme || 'light';
    var isDark = theme === 'dark';
    var bg = isDark ? '#1a1a2e' : '#fff';
    var text = isDark ? '#e2e8f0' : '#0f1419';
    var border = isDark ? '#334155' : '#e2e8f0';
    var accent = '#3b82f6';
    var inputBg = isDark ? '#0f172a' : '#f8fafc';
    var cardBg = isDark ? '#0f172a' : '#f8fafc';

    container.innerHTML = '<div class="aw-dca-calc" style="font-family:\'DM Sans\',system-ui,sans-serif;background:'+bg+';color:'+text+';border:1px solid '+border+';border-radius:10px;overflow:hidden">' +
      '<div style="padding:15px 22px;border-bottom:1px solid '+border+';background:'+cardBg+'">' +
        '<span style="font-size:.72rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase">DCA (Dollar Cost Averaging) Calculator</span>' +
      '</div>' +
      '<div style="padding:22px">' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px">' +
          '<div><label style="display:block;font-size:.72rem;font-weight:600;color:#64748b;margin-bottom:5px">Investment per Period ($)</label>' +
            '<input type="number" id="aw-dca-amount" value="100" min="1" step="10" style="width:100%;padding:9px 12px;border:1.5px solid '+border+';border-radius:7px;font-size:.82rem;background:'+inputBg+';color:'+text+';font-family:inherit;box-sizing:border-box"></div>' +
          '<div><label style="display:block;font-size:.72rem;font-weight:600;color:#64748b;margin-bottom:5px">Frequency</label>' +
            '<select id="aw-dca-freq" style="width:100%;padding:9px 12px;border:1.5px solid '+border+';border-radius:7px;font-size:.82rem;background:'+inputBg+';color:'+text+';font-family:inherit">' +
              '<option value="7">Weekly</option><option value="14">Bi-weekly</option><option value="30" selected>Monthly</option>' +
            '</select></div>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px">' +
          '<div><label style="display:block;font-size:.72rem;font-weight:600;color:#64748b;margin-bottom:5px">Duration (months)</label>' +
            '<input type="number" id="aw-dca-months" value="12" min="1" max="120" style="width:100%;padding:9px 12px;border:1.5px solid '+border+';border-radius:7px;font-size:.82rem;background:'+inputBg+';color:'+text+';font-family:inherit;box-sizing:border-box"></div>' +
          '<div><label style="display:block;font-size:.72rem;font-weight:600;color:#64748b;margin-bottom:5px">Starting Price ($)</label>' +
            '<input type="number" id="aw-dca-start" value="30000" min="0.01" step="100" style="width:100%;padding:9px 12px;border:1.5px solid '+border+';border-radius:7px;font-size:.82rem;background:'+inputBg+';color:'+text+';font-family:inherit;box-sizing:border-box"></div>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px">' +
          '<div><label style="display:block;font-size:.72rem;font-weight:600;color:#64748b;margin-bottom:5px">Current / End Price ($)</label>' +
            '<input type="number" id="aw-dca-end" value="45000" min="0.01" step="100" style="width:100%;padding:9px 12px;border:1.5px solid '+border+';border-radius:7px;font-size:.82rem;background:'+inputBg+';color:'+text+';font-family:inherit;box-sizing:border-box"></div>' +
          '<div><label style="display:block;font-size:.72rem;font-weight:600;color:#64748b;margin-bottom:5px">Price Volatility %</label>' +
            '<input type="number" id="aw-dca-vol" value="20" min="0" max="100" style="width:100%;padding:9px 12px;border:1.5px solid '+border+';border-radius:7px;font-size:.82rem;background:'+inputBg+';color:'+text+';font-family:inherit;box-sizing:border-box"></div>' +
        '</div>' +
        '<button id="aw-dca-btn" style="display:block;width:100%;padding:12px;border:none;border-radius:8px;font-size:.82rem;font-weight:700;cursor:pointer;background:linear-gradient(135deg,#1d4ed8,'+accent+');color:#fff;font-family:inherit">Calculate DCA</button>' +
        '<div id="aw-dca-result" style="display:none;margin-top:14px">' +
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">' +
            '<div style="text-align:center;padding:16px;background:'+(isDark?'#1e3a5f':'#eff6ff')+';border:1px solid '+(isDark?'#2563eb':'#bfdbfe')+';border-radius:8px;grid-column:1/-1"><div id="aw-dca-value" style="font-size:1.8rem;font-weight:800;color:'+accent+'"></div><div style="font-size:.68rem;color:#64748b;font-weight:600;text-transform:uppercase;margin-top:3px">Current Value</div></div>' +
            '<div style="text-align:center;padding:14px;background:'+cardBg+';border:1px solid '+border+';border-radius:8px"><div id="aw-dca-invested" style="font-size:1.3rem;font-weight:800;color:'+text+'"></div><div style="font-size:.68rem;color:#64748b;font-weight:600;text-transform:uppercase;margin-top:3px">Total Invested</div></div>' +
            '<div style="text-align:center;padding:14px;background:'+cardBg+';border:1px solid '+border+';border-radius:8px"><div id="aw-dca-avg" style="font-size:1.3rem;font-weight:800;color:'+text+'"></div><div style="font-size:.68rem;color:#64748b;font-weight:600;text-transform:uppercase;margin-top:3px">Avg Cost Basis</div></div>' +
            '<div style="text-align:center;padding:14px;background:'+cardBg+';border:1px solid '+border+';border-radius:8px"><div id="aw-dca-coins" style="font-size:1.3rem;font-weight:800;color:'+text+'"></div><div style="font-size:.68rem;color:#64748b;font-weight:600;text-transform:uppercase;margin-top:3px">Total Coins</div></div>' +
            '<div style="text-align:center;padding:14px;background:'+cardBg+';border:1px solid '+border+';border-radius:8px"><div id="aw-dca-roi" style="font-size:1.3rem;font-weight:800"></div><div style="font-size:.68rem;color:#64748b;font-weight:600;text-transform:uppercase;margin-top:3px">ROI %</div></div>' +
            '<div style="text-align:center;padding:14px;background:'+cardBg+';border:1px solid '+border+';border-radius:8px"><div id="aw-dca-purchases" style="font-size:1.3rem;font-weight:800;color:'+text+'"></div><div style="font-size:.68rem;color:#64748b;font-weight:600;text-transform:uppercase;margin-top:3px">Total Purchases</div></div>' +
            '<div style="text-align:center;padding:14px;background:'+cardBg+';border:1px solid '+border+';border-radius:8px"><div id="aw-dca-pnl" style="font-size:1.3rem;font-weight:800"></div><div style="font-size:.68rem;color:#64748b;font-weight:600;text-transform:uppercase;margin-top:3px">Profit / Loss</div></div>' +
          '</div>' +
        '</div>' +
        (opts.footerHTML ? '<div style="margin-top:14px">'+opts.footerHTML+'</div>' : '') +
      '</div>' +
    '</div>';

    function calc() {
      var amount = parseFloat(container.querySelector('#aw-dca-amount').value) || 0;
      var freqDays = parseInt(container.querySelector('#aw-dca-freq').value) || 30;
      var months = parseInt(container.querySelector('#aw-dca-months').value) || 12;
      var startPrice = parseFloat(container.querySelector('#aw-dca-start').value) || 0;
      var endPrice = parseFloat(container.querySelector('#aw-dca-end').value) || 0;
      var volatility = parseFloat(container.querySelector('#aw-dca-vol').value) / 100 || 0;

      if (amount <= 0 || startPrice <= 0 || endPrice <= 0) return;

      var totalDays = months * 30;
      var numPurchases = Math.floor(totalDays / freqDays);
      if (numPurchases < 1) numPurchases = 1;

      var totalCoins = 0;
      var totalInvested = 0;

      // Simulate price path from startPrice to endPrice with volatility
      for (var i = 0; i < numPurchases; i++) {
        var progress = i / (numPurchases - 1 || 1);
        // Linear interpolation with pseudo-random volatility
        var trend = startPrice + (endPrice - startPrice) * progress;
        var noise = 1 + (Math.sin(i * 3.7) * volatility);
        var price = trend * noise;
        if (price < 0.01) price = 0.01;

        var coins = amount / price;
        totalCoins += coins;
        totalInvested += amount;
      }

      var avgCost = totalInvested / totalCoins;
      var currentValue = totalCoins * endPrice;
      var profitLoss = currentValue - totalInvested;
      var roi = totalInvested > 0 ? ((profitLoss / totalInvested) * 100) : 0;
      var isProfit = profitLoss >= 0;

      var fmt = function(n) { return '$' + Math.abs(n).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };

      container.querySelector('#aw-dca-value').textContent = fmt(currentValue);
      container.querySelector('#aw-dca-invested').textContent = fmt(totalInvested);
      container.querySelector('#aw-dca-avg').textContent = fmt(avgCost);
      container.querySelector('#aw-dca-coins').textContent = totalCoins.toFixed(6);
      container.querySelector('#aw-dca-roi').textContent = roi.toFixed(2) + '%';
      container.querySelector('#aw-dca-roi').style.color = isProfit ? '#16a34a' : '#dc2626';
      container.querySelector('#aw-dca-purchases').textContent = numPurchases;
      container.querySelector('#aw-dca-pnl').textContent = (isProfit ? '+' : '-') + fmt(profitLoss);
      container.querySelector('#aw-dca-pnl').style.color = isProfit ? '#16a34a' : '#dc2626';

      container.querySelector('#aw-dca-result').style.display = 'block';
    }

    container.querySelector('#aw-dca-btn').addEventListener('click', calc);
  };
})();
