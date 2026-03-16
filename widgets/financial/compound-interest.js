(function(){
  window.AfroWidgets = window.AfroWidgets || {};
  window.AfroWidgets.compound_interest = function(container, opts) {
    opts = opts || {};
    var theme = opts.theme || 'light';
    var isDark = theme === 'dark';
    var bg = isDark ? '#1e1e1e' : '#fff';
    var fg = isDark ? '#f0f0f0' : '#1a1a1a';
    var muted = isDark ? '#aaa' : '#666';
    var border = isDark ? '#333' : '#e0e0e0';
    var accent = '#E8590C';

    var uid = 'aw_ci_' + Math.random().toString(36).substr(2,6);
    var html = '<div id="'+uid+'" style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:'+bg+';color:'+fg+';padding:20px;border-radius:12px;border:1px solid '+border+';max-width:420px;">';
    html += '<h3 style="margin:0 0 16px;font-size:1.1rem;">Compound Interest Calculator</h3>';

    html += '<div class="aw-field" style="margin-bottom:12px;"><label class="aw-label" style="display:block;font-size:0.85rem;color:'+muted+';margin-bottom:4px;">Principal Amount</label><input class="aw-input" id="'+uid+'_principal" type="text" inputmode="decimal" placeholder="100,000" style="width:100%;padding:10px;border:1px solid '+border+';border-radius:8px;font-size:1rem;background:'+bg+';color:'+fg+';box-sizing:border-box;" /></div>';
    html += '<div class="aw-field" style="margin-bottom:12px;"><label class="aw-label" style="display:block;font-size:0.85rem;color:'+muted+';margin-bottom:4px;">Annual Interest Rate (%)</label><input class="aw-input" id="'+uid+'_rate" type="number" step="0.1" value="10" style="width:100%;padding:10px;border:1px solid '+border+';border-radius:8px;font-size:1rem;background:'+bg+';color:'+fg+';box-sizing:border-box;" /></div>';
    html += '<div class="aw-field" style="margin-bottom:12px;"><label class="aw-label" style="display:block;font-size:0.85rem;color:'+muted+';margin-bottom:4px;">Compounds per Year</label><select class="aw-select" id="'+uid+'_n" style="width:100%;padding:10px;border:1px solid '+border+';border-radius:8px;font-size:0.95rem;background:'+bg+';color:'+fg+';"><option value="1">Annually (1)</option><option value="2">Semi-Annually (2)</option><option value="4">Quarterly (4)</option><option value="12" selected>Monthly (12)</option><option value="365">Daily (365)</option></select></div>';
    html += '<div class="aw-field" style="margin-bottom:12px;"><label class="aw-label" style="display:block;font-size:0.85rem;color:'+muted+';margin-bottom:4px;">Time Period (years)</label><input class="aw-input" id="'+uid+'_years" type="number" value="5" style="width:100%;padding:10px;border:1px solid '+border+';border-radius:8px;font-size:1rem;background:'+bg+';color:'+fg+';box-sizing:border-box;" /></div>';
    html += '<div class="aw-field" style="margin-bottom:12px;"><label class="aw-label" style="display:block;font-size:0.85rem;color:'+muted+';margin-bottom:4px;">Monthly Addition (optional)</label><input class="aw-input" id="'+uid+'_addition" type="text" inputmode="decimal" placeholder="0" style="width:100%;padding:10px;border:1px solid '+border+';border-radius:8px;font-size:1rem;background:'+bg+';color:'+fg+';box-sizing:border-box;" /></div>';

    html += '<button class="aw-btn aw-btn--primary" id="'+uid+'_calc" style="width:100%;padding:12px;background:'+accent+';color:#fff;border:none;border-radius:8px;font-size:1rem;cursor:pointer;font-weight:600;">Calculate</button>';

    html += '<div id="'+uid+'_result" class="aw-result-box" style="display:none;margin-top:16px;padding:16px;background:'+(isDark?'#2a2a2a':'#f7f7f7')+';border-radius:10px;">';
    html += '<div class="aw-result-label" style="font-size:0.8rem;color:'+muted+';">Final Amount</div>';
    html += '<div class="aw-result-main" id="'+uid+'_final" style="font-size:1.6rem;font-weight:700;margin:4px 0;color:'+accent+';"></div>';
    html += '<div class="aw-divider" style="border-top:1px solid '+border+';margin:12px 0;"></div>';
    html += '<div class="aw-result-row" style="display:flex;justify-content:space-between;margin-bottom:6px;"><span style="color:'+muted+';font-size:0.85rem;">Total Invested</span><strong id="'+uid+'_invested" style="font-size:0.95rem;"></strong></div>';
    html += '<div class="aw-result-row" style="display:flex;justify-content:space-between;margin-bottom:6px;"><span style="color:'+muted+';font-size:0.85rem;">Interest Earned</span><strong id="'+uid+'_interest" style="font-size:0.95rem;color:'+accent+';"></strong></div>';
    html += '<div class="aw-result-row" style="display:flex;justify-content:space-between;margin-bottom:6px;"><span style="color:'+muted+';font-size:0.85rem;">Effective Annual Rate</span><strong id="'+uid+'_ear" style="font-size:0.95rem;"></strong></div>';
    html += '<div id="'+uid+'_table" style="margin-top:12px;font-size:0.8rem;max-height:200px;overflow-y:auto;"></div>';
    html += '</div>';

    if (opts.footerHTML) html += '<div style="margin-top:12px;font-size:0.75rem;color:'+muted+';">'+opts.footerHTML+'</div>';
    html += '</div>';
    container.innerHTML = html;

    function fmt(v) { return v.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
    function parseAmt(s) { return parseFloat((s||'').replace(/,/g,'')) || 0; }

    document.getElementById(uid+'_calc').onclick = function() {
      var P = parseAmt(document.getElementById(uid+'_principal').value);
      var annualRate = parseFloat(document.getElementById(uid+'_rate').value) || 0;
      var n = parseInt(document.getElementById(uid+'_n').value) || 12;
      var t = parseInt(document.getElementById(uid+'_years').value) || 5;
      var monthlyAdd = parseAmt(document.getElementById(uid+'_addition').value);
      if (P <= 0 && monthlyAdd <= 0) return;

      var r = annualRate / 100;
      // A = P(1 + r/n)^(nt) for principal
      // For monthly additions, simulate month by month
      var balance = P;
      var totalAdded = P;
      var yearlyData = [];

      for (var yr = 1; yr <= t; yr++) {
        for (var m = 0; m < 12; m++) {
          balance += monthlyAdd;
          totalAdded += monthlyAdd;
          // Apply interest per compounding period
          var periodsThisMonth = n / 12;
          for (var cp = 0; cp < periodsThisMonth; cp++) {
            balance *= (1 + r / n);
          }
        }
        yearlyData.push({year: yr, balance: balance, invested: totalAdded, interest: balance - totalAdded});
      }

      var interestEarned = balance - totalAdded;
      var ear = (Math.pow(1 + r/n, n) - 1) * 100;

      document.getElementById(uid+'_result').style.display = 'block';
      document.getElementById(uid+'_final').textContent = fmt(balance);
      document.getElementById(uid+'_invested').textContent = fmt(totalAdded);
      document.getElementById(uid+'_interest').textContent = fmt(interestEarned);
      document.getElementById(uid+'_ear').textContent = ear.toFixed(2) + '%';

      // Year-by-year table
      var tbl = '<table style="width:100%;border-collapse:collapse;"><tr style="border-bottom:1px solid '+border+';"><th style="text-align:left;padding:4px;">Year</th><th style="text-align:right;padding:4px;">Balance</th><th style="text-align:right;padding:4px;">Interest</th></tr>';
      for (var y = 0; y < yearlyData.length; y++) {
        tbl += '<tr style="border-bottom:1px solid '+(isDark?'#333':'#eee')+';"><td style="padding:4px;">'+yearlyData[y].year+'</td><td style="text-align:right;padding:4px;">'+fmt(yearlyData[y].balance)+'</td><td style="text-align:right;padding:4px;color:'+accent+';">'+fmt(yearlyData[y].interest)+'</td></tr>';
      }
      tbl += '</table>';
      document.getElementById(uid+'_table').innerHTML = tbl;
    };
  };
})();
