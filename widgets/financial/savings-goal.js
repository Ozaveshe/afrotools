(function(){
  window.AfroWidgets = window.AfroWidgets || {};
  window.AfroWidgets.savings_goal = function(container, opts) {
    opts = opts || {};
    var theme = opts.theme || 'light';
    var isDark = theme === 'dark';
    var bg = isDark ? '#1e1e1e' : '#fff';
    var fg = isDark ? '#f0f0f0' : '#1a1a1a';
    var muted = isDark ? '#aaa' : '#666';
    var border = isDark ? '#333' : '#e0e0e0';
    var accent = '#E8590C';

    var uid = 'aw_sav_' + Math.random().toString(36).substr(2,6);
    var html = '<div id="'+uid+'" style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:'+bg+';color:'+fg+';padding:20px;border-radius:12px;border:1px solid '+border+';max-width:420px;">';
    html += '<h3 style="margin:0 0 16px;font-size:1.1rem;">Savings Goal Calculator</h3>';

    html += '<div class="aw-field" style="margin-bottom:12px;"><label class="aw-label" style="display:block;font-size:0.85rem;color:'+muted+';margin-bottom:4px;">Target Amount</label><input class="aw-input" id="'+uid+'_target" type="text" inputmode="decimal" placeholder="1,000,000" style="width:100%;padding:10px;border:1px solid '+border+';border-radius:8px;font-size:1rem;background:'+bg+';color:'+fg+';box-sizing:border-box;" /></div>';
    html += '<div class="aw-field" style="margin-bottom:12px;"><label class="aw-label" style="display:block;font-size:0.85rem;color:'+muted+';margin-bottom:4px;">Current Savings</label><input class="aw-input" id="'+uid+'_current" type="text" inputmode="decimal" placeholder="0" style="width:100%;padding:10px;border:1px solid '+border+';border-radius:8px;font-size:1rem;background:'+bg+';color:'+fg+';box-sizing:border-box;" /></div>';
    html += '<div class="aw-field" style="margin-bottom:12px;"><label class="aw-label" style="display:block;font-size:0.85rem;color:'+muted+';margin-bottom:4px;">Timeframe (months)</label><input class="aw-input" id="'+uid+'_months" type="number" value="12" style="width:100%;padding:10px;border:1px solid '+border+';border-radius:8px;font-size:1rem;background:'+bg+';color:'+fg+';box-sizing:border-box;" /></div>';
    html += '<div class="aw-field" style="margin-bottom:12px;"><label class="aw-label" style="display:block;font-size:0.85rem;color:'+muted+';margin-bottom:4px;">Annual Interest Rate (%)</label><input class="aw-input" id="'+uid+'_rate" type="number" step="0.1" value="5" style="width:100%;padding:10px;border:1px solid '+border+';border-radius:8px;font-size:1rem;background:'+bg+';color:'+fg+';box-sizing:border-box;" /></div>';
    html += '<div class="aw-field" style="margin-bottom:12px;"><label class="aw-label" style="display:block;font-size:0.85rem;color:'+muted+';margin-bottom:4px;">Annual Inflation Rate (%)</label><input class="aw-input" id="'+uid+'_inflation" type="number" step="0.1" value="0" style="width:100%;padding:10px;border:1px solid '+border+';border-radius:8px;font-size:1rem;background:'+bg+';color:'+fg+';box-sizing:border-box;" /></div>';

    html += '<button class="aw-btn aw-btn--primary" id="'+uid+'_calc" style="width:100%;padding:12px;background:'+accent+';color:#fff;border:none;border-radius:8px;font-size:1rem;cursor:pointer;font-weight:600;">Calculate</button>';

    html += '<div id="'+uid+'_result" class="aw-result-box" style="display:none;margin-top:16px;padding:16px;background:'+(isDark?'#2a2a2a':'#f7f7f7')+';border-radius:10px;">';
    html += '<div class="aw-result-label" style="font-size:0.8rem;color:'+muted+';">Monthly Savings Needed</div>';
    html += '<div class="aw-result-main" id="'+uid+'_monthly" style="font-size:1.6rem;font-weight:700;margin:4px 0;color:'+accent+';"></div>';
    html += '<div class="aw-divider" style="border-top:1px solid '+border+';margin:12px 0;"></div>';
    html += '<div class="aw-result-row" style="display:flex;justify-content:space-between;margin-bottom:6px;"><span style="color:'+muted+';font-size:0.85rem;">Total Deposits</span><strong id="'+uid+'_deposits" style="font-size:0.95rem;"></strong></div>';
    html += '<div class="aw-result-row" style="display:flex;justify-content:space-between;margin-bottom:6px;"><span style="color:'+muted+';font-size:0.85rem;">Interest Earned</span><strong id="'+uid+'_interest" style="font-size:0.95rem;color:'+accent+';"></strong></div>';
    html += '<div class="aw-result-row" style="display:flex;justify-content:space-between;"><span style="color:'+muted+';font-size:0.85rem;">Adjusted Goal (inflation)</span><strong id="'+uid+'_adjusted" style="font-size:0.95rem;"></strong></div>';
    html += '</div>';

    if (opts.footerHTML) html += '<div style="margin-top:12px;font-size:0.75rem;color:'+muted+';">'+opts.footerHTML+'</div>';
    html += '</div>';
    container.innerHTML = html;

    function fmt(v) { return v.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
    function parseAmt(s) { return parseFloat((s||'').replace(/,/g,'')) || 0; }

    document.getElementById(uid+'_calc').onclick = function() {
      var target = parseAmt(document.getElementById(uid+'_target').value);
      var current = parseAmt(document.getElementById(uid+'_current').value);
      var months = parseInt(document.getElementById(uid+'_months').value) || 12;
      var annualRate = parseFloat(document.getElementById(uid+'_rate').value) || 0;
      var annualInflation = parseFloat(document.getElementById(uid+'_inflation').value) || 0;
      if (target <= 0 || months <= 0) return;

      var monthlyRate = annualRate / 100 / 12;
      var monthlyInflation = annualInflation / 100 / 12;

      // Adjust goal for inflation
      var adjustedGoal = target * Math.pow(1 + monthlyInflation, months);
      var needed = adjustedGoal - current * Math.pow(1 + monthlyRate, months);

      // Monthly deposit using future value of annuity formula
      var monthlyDeposit;
      if (monthlyRate > 0) {
        monthlyDeposit = needed * monthlyRate / (Math.pow(1 + monthlyRate, months) - 1);
      } else {
        monthlyDeposit = needed / months;
      }
      if (monthlyDeposit < 0) monthlyDeposit = 0;

      var totalDeposits = monthlyDeposit * months + current;
      var interestEarned = adjustedGoal - totalDeposits;

      document.getElementById(uid+'_result').style.display = 'block';
      document.getElementById(uid+'_monthly').textContent = fmt(monthlyDeposit);
      document.getElementById(uid+'_deposits').textContent = fmt(totalDeposits);
      document.getElementById(uid+'_interest').textContent = fmt(Math.max(0, interestEarned));
      document.getElementById(uid+'_adjusted').textContent = fmt(adjustedGoal);
    };
  };
})();
