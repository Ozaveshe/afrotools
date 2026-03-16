(function(){
  window.AfroWidgets = window.AfroWidgets || {};
  window.AfroWidgets.investment_return = function(container, opts) {
    opts = opts || {};
    var theme = opts.theme || 'light';
    var isDark = theme === 'dark';
    var bg = isDark ? '#1e1e1e' : '#fff';
    var fg = isDark ? '#f0f0f0' : '#1a1a1a';
    var muted = isDark ? '#aaa' : '#666';
    var border = isDark ? '#333' : '#e0e0e0';
    var accent = '#E8590C';

    var uid = 'aw_inv_' + Math.random().toString(36).substr(2,6);
    var html = '<div id="'+uid+'" style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:'+bg+';color:'+fg+';padding:20px;border-radius:12px;border:1px solid '+border+';max-width:420px;">';
    html += '<h3 style="margin:0 0 16px;font-size:1.1rem;">Investment Return Calculator</h3>';

    html += '<div class="aw-field" style="margin-bottom:12px;"><label class="aw-label" style="display:block;font-size:0.85rem;color:'+muted+';margin-bottom:4px;">Initial Investment</label><input class="aw-input" id="'+uid+'_initial" type="text" inputmode="decimal" placeholder="100,000" style="width:100%;padding:10px;border:1px solid '+border+';border-radius:8px;font-size:1rem;background:'+bg+';color:'+fg+';box-sizing:border-box;" /></div>';
    html += '<div class="aw-field" style="margin-bottom:12px;"><label class="aw-label" style="display:block;font-size:0.85rem;color:'+muted+';margin-bottom:4px;">Monthly Contribution</label><input class="aw-input" id="'+uid+'_monthly" type="text" inputmode="decimal" placeholder="10,000" style="width:100%;padding:10px;border:1px solid '+border+';border-radius:8px;font-size:1rem;background:'+bg+';color:'+fg+';box-sizing:border-box;" /></div>';
    html += '<div class="aw-field" style="margin-bottom:12px;"><label class="aw-label" style="display:block;font-size:0.85rem;color:'+muted+';margin-bottom:4px;">Expected Annual Return (%)</label><input class="aw-input" id="'+uid+'_rate" type="number" step="0.1" value="10" style="width:100%;padding:10px;border:1px solid '+border+';border-radius:8px;font-size:1rem;background:'+bg+';color:'+fg+';box-sizing:border-box;" /></div>';
    html += '<div class="aw-field" style="margin-bottom:12px;"><label class="aw-label" style="display:block;font-size:0.85rem;color:'+muted+';margin-bottom:4px;">Compounding</label><select class="aw-select" id="'+uid+'_compound" style="width:100%;padding:10px;border:1px solid '+border+';border-radius:8px;font-size:0.95rem;background:'+bg+';color:'+fg+';"><option value="12">Monthly</option><option value="4">Quarterly</option><option value="1">Annually</option></select></div>';
    html += '<div class="aw-field" style="margin-bottom:12px;"><label class="aw-label" style="display:block;font-size:0.85rem;color:'+muted+';margin-bottom:4px;">Investment Period (years)</label><input class="aw-input" id="'+uid+'_years" type="number" value="10" style="width:100%;padding:10px;border:1px solid '+border+';border-radius:8px;font-size:1rem;background:'+bg+';color:'+fg+';box-sizing:border-box;" /></div>';

    html += '<button class="aw-btn aw-btn--primary" id="'+uid+'_calc" style="width:100%;padding:12px;background:'+accent+';color:#fff;border:none;border-radius:8px;font-size:1rem;cursor:pointer;font-weight:600;">Calculate Returns</button>';

    html += '<div id="'+uid+'_result" class="aw-result-box" style="display:none;margin-top:16px;padding:16px;background:'+(isDark?'#2a2a2a':'#f7f7f7')+';border-radius:10px;">';
    html += '<div class="aw-result-label" style="font-size:0.8rem;color:'+muted+';">Future Value</div>';
    html += '<div class="aw-result-main" id="'+uid+'_future" style="font-size:1.6rem;font-weight:700;margin:4px 0;color:'+accent+';"></div>';
    html += '<div class="aw-divider" style="border-top:1px solid '+border+';margin:12px 0;"></div>';
    html += '<div class="aw-result-row" style="display:flex;justify-content:space-between;margin-bottom:6px;"><span style="color:'+muted+';font-size:0.85rem;">Total Invested</span><strong id="'+uid+'_invested" style="font-size:0.95rem;"></strong></div>';
    html += '<div class="aw-result-row" style="display:flex;justify-content:space-between;margin-bottom:6px;"><span style="color:'+muted+';font-size:0.85rem;">Total Returns</span><strong id="'+uid+'_returns" style="font-size:0.95rem;color:'+accent+';"></strong></div>';
    html += '<div class="aw-result-row" style="display:flex;justify-content:space-between;margin-bottom:6px;"><span style="color:'+muted+';font-size:0.85rem;">ROI</span><strong id="'+uid+'_roi" style="font-size:0.95rem;"></strong></div>';
    html += '<div class="aw-result-row" style="display:flex;justify-content:space-between;"><span style="color:'+muted+';font-size:0.85rem;">CAGR</span><strong id="'+uid+'_cagr" style="font-size:0.95rem;"></strong></div>';
    html += '</div>';

    if (opts.footerHTML) html += '<div style="margin-top:12px;font-size:0.75rem;color:'+muted+';">'+opts.footerHTML+'</div>';
    html += '</div>';
    container.innerHTML = html;

    function fmt(v) { return v.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
    function parseAmt(s) { return parseFloat((s||'').replace(/,/g,'')) || 0; }

    document.getElementById(uid+'_calc').onclick = function() {
      var initial = parseAmt(document.getElementById(uid+'_initial').value);
      var monthly = parseAmt(document.getElementById(uid+'_monthly').value);
      var annualRate = parseFloat(document.getElementById(uid+'_rate').value) || 0;
      var compoundsPerYear = parseInt(document.getElementById(uid+'_compound').value) || 12;
      var years = parseInt(document.getElementById(uid+'_years').value) || 10;
      if (initial <= 0 && monthly <= 0) return;

      var r = annualRate / 100 / compoundsPerYear;
      var totalPeriods = compoundsPerYear * years;
      var periodsPerContrib = compoundsPerYear / 12; // contributions are monthly

      // Simulate year by year
      var balance = initial;
      for (var m = 0; m < years * 12; m++) {
        balance += monthly;
        balance *= (1 + (annualRate / 100 / 12));
      }

      var totalInvested = initial + (monthly * years * 12);
      var totalReturns = balance - totalInvested;
      var roi = totalInvested > 0 ? (totalReturns / totalInvested * 100) : 0;
      var cagr = totalInvested > 0 && years > 0 ? (Math.pow(balance / (initial || 1), 1 / years) - 1) * 100 : 0;

      document.getElementById(uid+'_result').style.display = 'block';
      document.getElementById(uid+'_future').textContent = fmt(balance);
      document.getElementById(uid+'_invested').textContent = fmt(totalInvested);
      document.getElementById(uid+'_returns').textContent = fmt(totalReturns);
      document.getElementById(uid+'_roi').textContent = roi.toFixed(1) + '%';
      document.getElementById(uid+'_cagr').textContent = cagr.toFixed(2) + '%';
    };
  };
})();
