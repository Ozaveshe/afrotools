(function(){
  window.AfroWidgets = window.AfroWidgets || {};
  window.AfroWidgets.ProfitLoss = function(container, opts) {
    opts = opts || {};
    var theme = opts.theme || 'light';
    var isDark = theme === 'dark';
    var bg = isDark ? '#1a1a2e' : '#fff';
    var text = isDark ? '#e2e8f0' : '#0f1419';
    var border = isDark ? '#334155' : '#e2e8f0';
    var accent = '#007AFF';
    var inputBg = isDark ? '#0f172a' : '#f8fafc';
    var cardBg = isDark ? '#0f172a' : '#f8fafc';

    container.innerHTML = '<div class="aw-profit-loss" style="font-family:\'DM Sans\',system-ui,sans-serif;background:'+bg+';color:'+text+';border:1px solid '+border+';border-radius:10px;overflow:hidden">' +
      '<div style="padding:15px 22px;border-bottom:1px solid '+border+';background:'+cardBg+'">' +
        '<span style="font-size:.72rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase">Crypto Profit / Loss Calculator</span>' +
      '</div>' +
      '<div style="padding:22px">' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px">' +
          '<div><label style="display:block;font-size:.72rem;font-weight:600;color:#64748b;margin-bottom:5px">Buy Price</label>' +
            '<input type="number" id="aw-pl-buy" placeholder="e.g. 25000" min="0" step="0.01" style="width:100%;padding:9px 12px;border:1.5px solid '+border+';border-radius:7px;font-size:.82rem;background:'+inputBg+';color:'+text+';font-family:inherit;box-sizing:border-box"></div>' +
          '<div><label style="display:block;font-size:.72rem;font-weight:600;color:#64748b;margin-bottom:5px">Sell Price</label>' +
            '<input type="number" id="aw-pl-sell" placeholder="e.g. 30000" min="0" step="0.01" style="width:100%;padding:9px 12px;border:1.5px solid '+border+';border-radius:7px;font-size:.82rem;background:'+inputBg+';color:'+text+';font-family:inherit;box-sizing:border-box"></div>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px">' +
          '<div><label style="display:block;font-size:.72rem;font-weight:600;color:#64748b;margin-bottom:5px">Quantity</label>' +
            '<input type="number" id="aw-pl-qty" value="1" min="0" step="0.0001" style="width:100%;padding:9px 12px;border:1.5px solid '+border+';border-radius:7px;font-size:.82rem;background:'+inputBg+';color:'+text+';font-family:inherit;box-sizing:border-box"></div>' +
          '<div><label style="display:block;font-size:.72rem;font-weight:600;color:#64748b;margin-bottom:5px">Fees (total)</label>' +
            '<input type="number" id="aw-pl-fees" value="0" min="0" step="0.01" style="width:100%;padding:9px 12px;border:1.5px solid '+border+';border-radius:7px;font-size:.82rem;background:'+inputBg+';color:'+text+';font-family:inherit;box-sizing:border-box"></div>' +
        '</div>' +
        '<button id="aw-pl-btn" style="display:block;width:100%;padding:12px;border:none;border-radius:8px;font-size:.82rem;font-weight:700;cursor:pointer;background:linear-gradient(135deg,#007AFF,'+accent+');color:#fff;font-family:inherit">Calculate Profit / Loss</button>' +
        '<div id="aw-pl-result" style="display:none;margin-top:14px">' +
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">' +
            '<div id="aw-pl-pnl" style="text-align:center;padding:16px;border-radius:8px;grid-column:1/-1"></div>' +
            '<div style="text-align:center;padding:14px;background:'+cardBg+';border:1px solid '+border+';border-radius:8px"><div id="aw-pl-roi" style="font-size:1.3rem;font-weight:800"></div><div style="font-size:.68rem;color:#64748b;font-weight:600;text-transform:uppercase;margin-top:3px">ROI %</div></div>' +
            '<div style="text-align:center;padding:14px;background:'+cardBg+';border:1px solid '+border+';border-radius:8px"><div id="aw-pl-total-cost" style="font-size:1.3rem;font-weight:800;color:'+text+'"></div><div style="font-size:.68rem;color:#64748b;font-weight:600;text-transform:uppercase;margin-top:3px">Total Cost</div></div>' +
            '<div style="text-align:center;padding:14px;background:'+cardBg+';border:1px solid '+border+';border-radius:8px"><div id="aw-pl-total-rev" style="font-size:1.3rem;font-weight:800;color:'+text+'"></div><div style="font-size:.68rem;color:#64748b;font-weight:600;text-transform:uppercase;margin-top:3px">Total Revenue</div></div>' +
            '<div style="text-align:center;padding:14px;background:'+cardBg+';border:1px solid '+border+';border-radius:8px"><div id="aw-pl-breakeven" style="font-size:1.3rem;font-weight:800;color:'+text+'"></div><div style="font-size:.68rem;color:#64748b;font-weight:600;text-transform:uppercase;margin-top:3px">Break-even Price</div></div>' +
          '</div>' +
        '</div>' +
        (opts.footerHTML ? '<div style="margin-top:14px">'+opts.footerHTML+'</div>' : '') +
      '</div>' +
    '</div>';

    function calc() {
      var buy = parseFloat(container.querySelector('#aw-pl-buy').value) || 0;
      var sell = parseFloat(container.querySelector('#aw-pl-sell').value) || 0;
      var qty = parseFloat(container.querySelector('#aw-pl-qty').value) || 0;
      var fees = parseFloat(container.querySelector('#aw-pl-fees').value) || 0;

      if (buy <= 0 || sell <= 0 || qty <= 0) return;

      var totalCost = (buy * qty) + fees;
      var totalRevenue = sell * qty;
      var profitLoss = totalRevenue - totalCost;
      var roi = totalCost > 0 ? ((profitLoss / totalCost) * 100) : 0;
      var breakeven = qty > 0 ? (totalCost / qty) : 0;
      var isProfit = profitLoss >= 0;

      var fmt = function(n) { return '$' + Math.abs(n).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };

      var pnlDiv = container.querySelector('#aw-pl-pnl');
      pnlDiv.style.background = isProfit ? '#dcfce7' : '#fee2e2';
      pnlDiv.style.border = '1px solid ' + (isProfit ? '#86efac' : '#fecaca');
      pnlDiv.innerHTML = '<div style="font-size:1.8rem;font-weight:800;color:'+(isProfit?'#007AFF':'#dc2626')+'">'+(isProfit?'+':'-')+fmt(profitLoss)+'</div>' +
        '<div style="font-size:.68rem;color:'+(isProfit?'#166534':'#991b1b')+';font-weight:600;text-transform:uppercase;margin-top:3px">'+(isProfit?'Profit':'Loss')+'</div>';

      container.querySelector('#aw-pl-roi').textContent = roi.toFixed(2) + '%';
      container.querySelector('#aw-pl-roi').style.color = isProfit ? '#007AFF' : '#dc2626';
      container.querySelector('#aw-pl-total-cost').textContent = fmt(totalCost);
      container.querySelector('#aw-pl-total-rev').textContent = fmt(totalRevenue);
      container.querySelector('#aw-pl-breakeven').textContent = fmt(breakeven);

      container.querySelector('#aw-pl-result').style.display = 'block';
    }

    container.querySelector('#aw-pl-btn').addEventListener('click', calc);
  };
})();
