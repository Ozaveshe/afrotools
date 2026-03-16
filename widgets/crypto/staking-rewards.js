(function(){
  window.AfroWidgets = window.AfroWidgets || {};
  window.AfroWidgets.StakingRewards = function(container, opts) {
    opts = opts || {};
    var theme = opts.theme || 'light';
    var isDark = theme === 'dark';
    var bg = isDark ? '#1a1a2e' : '#fff';
    var text = isDark ? '#e2e8f0' : '#0f1419';
    var border = isDark ? '#334155' : '#e2e8f0';
    var accent = '#8b5cf6';
    var inputBg = isDark ? '#0f172a' : '#f8fafc';
    var cardBg = isDark ? '#0f172a' : '#f8fafc';

    container.innerHTML = '<div class="aw-staking" style="font-family:\'DM Sans\',system-ui,sans-serif;background:'+bg+';color:'+text+';border:1px solid '+border+';border-radius:10px;overflow:hidden">' +
      '<div style="padding:15px 22px;border-bottom:1px solid '+border+';background:'+cardBg+'">' +
        '<span style="font-size:.72rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase">Staking Rewards Calculator</span>' +
      '</div>' +
      '<div style="padding:22px">' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px">' +
          '<div><label style="display:block;font-size:.72rem;font-weight:600;color:#64748b;margin-bottom:5px">Amount Staked</label>' +
            '<input type="number" id="aw-stk-amount" value="1000" min="0" step="10" style="width:100%;padding:9px 12px;border:1.5px solid '+border+';border-radius:7px;font-size:.82rem;background:'+inputBg+';color:'+text+';font-family:inherit;box-sizing:border-box"></div>' +
          '<div><label style="display:block;font-size:.72rem;font-weight:600;color:#64748b;margin-bottom:5px">Token Price ($)</label>' +
            '<input type="number" id="aw-stk-price" value="1" min="0.0001" step="0.01" style="width:100%;padding:9px 12px;border:1.5px solid '+border+';border-radius:7px;font-size:.82rem;background:'+inputBg+';color:'+text+';font-family:inherit;box-sizing:border-box"></div>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px">' +
          '<div><label style="display:block;font-size:.72rem;font-weight:600;color:#64748b;margin-bottom:5px">APY (%)</label>' +
            '<input type="number" id="aw-stk-apy" value="12" min="0" max="1000" step="0.1" style="width:100%;padding:9px 12px;border:1.5px solid '+border+';border-radius:7px;font-size:.82rem;background:'+inputBg+';color:'+text+';font-family:inherit;box-sizing:border-box"></div>' +
          '<div><label style="display:block;font-size:.72rem;font-weight:600;color:#64748b;margin-bottom:5px">Staking Duration</label>' +
            '<select id="aw-stk-duration" style="width:100%;padding:9px 12px;border:1.5px solid '+border+';border-radius:7px;font-size:.82rem;background:'+inputBg+';color:'+text+';font-family:inherit">' +
              '<option value="30">30 Days</option><option value="90">90 Days</option><option value="180">180 Days</option><option value="365" selected>1 Year</option><option value="730">2 Years</option><option value="1095">3 Years</option>' +
            '</select></div>' +
        '</div>' +
        '<div style="margin-bottom:14px"><label style="display:block;font-size:.72rem;font-weight:600;color:#64748b;margin-bottom:5px">Compounding Frequency</label>' +
          '<select id="aw-stk-compound" style="width:100%;padding:9px 12px;border:1.5px solid '+border+';border-radius:7px;font-size:.82rem;background:'+inputBg+';color:'+text+';font-family:inherit">' +
            '<option value="1">Daily</option><option value="7">Weekly</option><option value="30" selected>Monthly</option><option value="365">Annually (No compounding)</option>' +
          '</select></div>' +
        '<button id="aw-stk-btn" style="display:block;width:100%;padding:12px;border:none;border-radius:8px;font-size:.82rem;font-weight:700;cursor:pointer;background:linear-gradient(135deg,#6d28d9,'+accent+');color:#fff;font-family:inherit">Calculate Rewards</button>' +
        '<div id="aw-stk-result" style="display:none;margin-top:14px">' +
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">' +
            '<div style="text-align:center;padding:16px;background:'+(isDark?'#2e1065':'#f5f3ff')+';border:1px solid '+(isDark?'#6d28d9':'#ddd6fe')+';border-radius:8px;grid-column:1/-1"><div id="aw-stk-rewards" style="font-size:1.8rem;font-weight:800;color:'+accent+'"></div><div style="font-size:.68rem;color:#64748b;font-weight:600;text-transform:uppercase;margin-top:3px">Total Rewards Earned</div></div>' +
            '<div style="text-align:center;padding:14px;background:'+cardBg+';border:1px solid '+border+';border-radius:8px"><div id="aw-stk-rewards-usd" style="font-size:1.3rem;font-weight:800;color:'+accent+'"></div><div style="font-size:.68rem;color:#64748b;font-weight:600;text-transform:uppercase;margin-top:3px">Rewards in USD</div></div>' +
            '<div style="text-align:center;padding:14px;background:'+cardBg+';border:1px solid '+border+';border-radius:8px"><div id="aw-stk-total" style="font-size:1.3rem;font-weight:800;color:'+text+'"></div><div style="font-size:.68rem;color:#64748b;font-weight:600;text-transform:uppercase;margin-top:3px">Total After Staking</div></div>' +
            '<div style="text-align:center;padding:14px;background:'+cardBg+';border:1px solid '+border+';border-radius:8px"><div id="aw-stk-daily" style="font-size:1.3rem;font-weight:800;color:'+text+'"></div><div style="font-size:.68rem;color:#64748b;font-weight:600;text-transform:uppercase;margin-top:3px">Daily Earnings</div></div>' +
            '<div style="text-align:center;padding:14px;background:'+cardBg+';border:1px solid '+border+';border-radius:8px"><div id="aw-stk-monthly" style="font-size:1.3rem;font-weight:800;color:'+text+'"></div><div style="font-size:.68rem;color:#64748b;font-weight:600;text-transform:uppercase;margin-top:3px">Monthly Earnings</div></div>' +
          '</div>' +
        '</div>' +
        (opts.footerHTML ? '<div style="margin-top:14px">'+opts.footerHTML+'</div>' : '') +
      '</div>' +
    '</div>';

    function calc() {
      var amount = parseFloat(container.querySelector('#aw-stk-amount').value) || 0;
      var price = parseFloat(container.querySelector('#aw-stk-price').value) || 1;
      var apy = parseFloat(container.querySelector('#aw-stk-apy').value) / 100 || 0;
      var days = parseInt(container.querySelector('#aw-stk-duration').value) || 365;
      var compoundDays = parseInt(container.querySelector('#aw-stk-compound').value) || 30;

      if (amount <= 0) return;

      // Compound interest: A = P * (1 + r/n)^(n*t)
      var periods = Math.floor(days / compoundDays);
      var ratePerPeriod = apy * compoundDays / 365;
      var totalTokens = amount * Math.pow(1 + ratePerPeriod, periods);
      var rewardsTokens = totalTokens - amount;
      var rewardsUSD = rewardsTokens * price;
      var totalUSD = totalTokens * price;
      var dailyTokens = rewardsTokens / days;
      var monthlyTokens = rewardsTokens / (days / 30);

      var fmt = function(n, d) { return n.toLocaleString('en', { minimumFractionDigits: d || 2, maximumFractionDigits: d || 2 }); };

      container.querySelector('#aw-stk-rewards').textContent = fmt(rewardsTokens, 4) + ' tokens';
      container.querySelector('#aw-stk-rewards-usd').textContent = '$' + fmt(rewardsUSD);
      container.querySelector('#aw-stk-total').textContent = fmt(totalTokens, 4) + ' tokens';
      container.querySelector('#aw-stk-daily').textContent = fmt(dailyTokens, 6) + ' / $' + fmt(dailyTokens * price);
      container.querySelector('#aw-stk-monthly').textContent = fmt(monthlyTokens, 4) + ' / $' + fmt(monthlyTokens * price);

      container.querySelector('#aw-stk-result').style.display = 'block';
    }

    container.querySelector('#aw-stk-btn').addEventListener('click', calc);
  };
})();
