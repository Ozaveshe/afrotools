(function(){
  window.AfroWidgets = window.AfroWidgets || {};
  window.AfroWidgets.loan_compare = function(container, opts) {
    opts = opts || {};
    var theme = opts.theme || 'light';
    var isDark = theme === 'dark';
    var bg = isDark ? '#1e1e1e' : '#fff';
    var fg = isDark ? '#f0f0f0' : '#1a1a1a';
    var muted = isDark ? '#aaa' : '#666';
    var border = isDark ? '#333' : '#e0e0e0';
    var accent = '#E8590C';
    var green = '#007AFF';

    var uid = 'aw_lnc_' + Math.random().toString(36).substr(2,6);

    function field(id, label, placeholder, type) {
      type = type || 'text';
      var im = type === 'text' ? ' inputmode="decimal"' : '';
      return '<div class="aw-field" style="margin-bottom:8px;"><label class="aw-label" style="display:block;font-size:0.8rem;color:'+muted+';margin-bottom:2px;">'+label+'</label><input class="aw-input" id="'+id+'"'+im+' type="'+type+'" placeholder="'+placeholder+'" style="width:100%;padding:8px;border:1px solid '+border+';border-radius:6px;font-size:0.9rem;background:'+bg+';color:'+fg+';box-sizing:border-box;" /></div>';
    }

    function loanCard(n) {
      var p = uid+'_l'+n;
      var h = '<div style="flex:1;min-width:180px;padding:12px;border:1px solid '+border+';border-radius:10px;">';
      h += '<h4 style="margin:0 0 8px;font-size:0.95rem;">Loan '+n+'</h4>';
      h += field(p+'_amt', 'Amount', '500,000');
      h += field(p+'_rate', 'Rate (%)', '15', 'number');
      h += field(p+'_term', 'Term (months)', '60', 'number');
      h += field(p+'_fees', 'Fees', '0');
      h += '<div id="'+p+'_res" style="display:none;margin-top:8px;padding:8px;background:'+(isDark?'#2a2a2a':'#f0f0f0')+';border-radius:6px;font-size:0.85rem;">';
      h += '<div style="display:flex;justify-content:space-between;"><span style="color:'+muted+';">Monthly</span><strong id="'+p+'_monthly"></strong></div>';
      h += '<div style="display:flex;justify-content:space-between;"><span style="color:'+muted+';">Total Interest</span><strong id="'+p+'_interest" style="color:'+accent+';"></strong></div>';
      h += '<div style="display:flex;justify-content:space-between;"><span style="color:'+muted+';">Total Cost</span><strong id="'+p+'_total"></strong></div>';
      h += '</div></div>';
      return h;
    }

    var html = '<div id="'+uid+'" style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:'+bg+';color:'+fg+';padding:20px;border-radius:12px;border:1px solid '+border+';max-width:520px;">';
    html += '<h3 style="margin:0 0 16px;font-size:1.1rem;">Loan Comparison</h3>';
    html += '<div style="display:flex;gap:12px;flex-wrap:wrap;">';
    html += loanCard(1) + loanCard(2);
    html += '</div>';
    html += '<button class="aw-btn aw-btn--primary" id="'+uid+'_calc" style="width:100%;padding:12px;margin-top:12px;background:'+accent+';color:#fff;border:none;border-radius:8px;font-size:1rem;cursor:pointer;font-weight:600;">Compare Loans</button>';
    html += '<div id="'+uid+'_verdict" style="display:none;margin-top:12px;padding:12px;border-radius:8px;text-align:center;font-weight:600;font-size:0.95rem;"></div>';

    if (opts.footerHTML) html += '<div style="margin-top:12px;font-size:0.75rem;color:'+muted+';">'+opts.footerHTML+'</div>';
    html += '</div>';
    container.innerHTML = html;

    function fmt(v) { return v.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
    function parseAmt(s) { return parseFloat((s||'').replace(/,/g,'')) || 0; }

    function calcLoan(n) {
      var p = uid+'_l'+n;
      var amt = parseAmt(document.getElementById(p+'_amt').value);
      var rate = parseFloat(document.getElementById(p+'_rate').value) || 0;
      var term = parseInt(document.getElementById(p+'_term').value) || 0;
      var fees = parseAmt(document.getElementById(p+'_fees').value);
      if (amt <= 0 || rate <= 0 || term <= 0) return null;

      var principal = amt + fees;
      var r = rate / 100 / 12;
      var monthly = principal * r * Math.pow(1+r,term) / (Math.pow(1+r,term) - 1);
      var totalCost = monthly * term;
      var totalInterest = totalCost - principal;

      document.getElementById(p+'_res').style.display = 'block';
      document.getElementById(p+'_monthly').textContent = fmt(monthly);
      document.getElementById(p+'_interest').textContent = fmt(totalInterest);
      document.getElementById(p+'_total').textContent = fmt(totalCost);

      return { monthly: monthly, interest: totalInterest, total: totalCost };
    }

    document.getElementById(uid+'_calc').onclick = function() {
      var r1 = calcLoan(1);
      var r2 = calcLoan(2);
      var verdict = document.getElementById(uid+'_verdict');
      if (r1 && r2) {
        verdict.style.display = 'block';
        if (r1.total < r2.total) {
          verdict.style.background = isDark ? '#1a3a1a' : '#dcfce7';
          verdict.style.color = green;
          verdict.textContent = 'Loan 1 saves you ' + fmt(r2.total - r1.total) + ' overall!';
        } else if (r2.total < r1.total) {
          verdict.style.background = isDark ? '#1a3a1a' : '#dcfce7';
          verdict.style.color = green;
          verdict.textContent = 'Loan 2 saves you ' + fmt(r1.total - r2.total) + ' overall!';
        } else {
          verdict.style.background = isDark ? '#2a2a2a' : '#f0f0f0';
          verdict.style.color = fg;
          verdict.textContent = 'Both loans cost the same!';
        }
      }
    };
  };
})();
