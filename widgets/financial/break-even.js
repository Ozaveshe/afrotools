(function(){
  window.AfroWidgets = window.AfroWidgets || {};
  window.AfroWidgets.break_even = function(container, opts) {
    opts = opts || {};
    var theme = opts.theme || 'light';
    var isDark = theme === 'dark';
    var bg = isDark ? '#1e1e1e' : '#fff';
    var fg = isDark ? '#f0f0f0' : '#1a1a1a';
    var muted = isDark ? '#aaa' : '#666';
    var border = isDark ? '#333' : '#e0e0e0';
    var accent = '#E8590C';

    var uid = 'aw_be_' + Math.random().toString(36).substr(2,6);

    function inp(id, label, placeholder, type) {
      type = type || 'text';
      var im = type === 'text' ? ' inputmode="decimal"' : '';
      return '<div class="aw-field" style="margin-bottom:12px;"><label class="aw-label" style="display:block;font-size:0.85rem;color:'+muted+';margin-bottom:4px;">'+label+'</label><input class="aw-input" id="'+id+'"'+im+' type="'+type+'" placeholder="'+placeholder+'" style="width:100%;padding:10px;border:1px solid '+border+';border-radius:8px;font-size:1rem;background:'+bg+';color:'+fg+';box-sizing:border-box;" /></div>';
    }

    var html = '<div id="'+uid+'" style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:'+bg+';color:'+fg+';padding:20px;border-radius:12px;border:1px solid '+border+';max-width:420px;">';
    html += '<h3 style="margin:0 0 16px;font-size:1.1rem;">Break-Even Calculator</h3>';
    html += inp(uid+'_fixed', 'Total Fixed Costs', '500,000');
    html += inp(uid+'_var', 'Variable Cost per Unit', '200');
    html += inp(uid+'_price', 'Selling Price per Unit', '500');
    html += '<button class="aw-btn aw-btn--primary" id="'+uid+'_calc" style="width:100%;padding:12px;background:'+accent+';color:#fff;border:none;border-radius:8px;font-size:1rem;cursor:pointer;font-weight:600;">Calculate Break-Even</button>';

    html += '<div id="'+uid+'_result" class="aw-result-box" style="display:none;margin-top:16px;padding:16px;background:'+(isDark?'#2a2a2a':'#f7f7f7')+';border-radius:10px;">';
    html += '<div class="aw-result-label" style="font-size:0.8rem;color:'+muted+';">Break-Even Point</div>';
    html += '<div class="aw-result-main" id="'+uid+'_units" style="font-size:1.6rem;font-weight:700;margin:4px 0;color:'+accent+';"></div>';
    html += '<div class="aw-divider" style="border-top:1px solid '+border+';margin:12px 0;"></div>';
    html += '<div class="aw-result-row" style="display:flex;justify-content:space-between;margin-bottom:6px;"><span style="color:'+muted+';font-size:0.85rem;">Break-Even Revenue</span><strong id="'+uid+'_revenue" style="font-size:0.95rem;"></strong></div>';
    html += '<div class="aw-result-row" style="display:flex;justify-content:space-between;margin-bottom:6px;"><span style="color:'+muted+';font-size:0.85rem;">Contribution Margin</span><strong id="'+uid+'_margin" style="font-size:0.95rem;color:'+accent+';"></strong></div>';
    html += '<div class="aw-result-row" style="display:flex;justify-content:space-between;"><span style="color:'+muted+';font-size:0.85rem;">Contribution Margin %</span><strong id="'+uid+'_pct" style="font-size:0.95rem;"></strong></div>';
    html += '</div>';

    if (opts.footerHTML) html += '<div style="margin-top:12px;font-size:0.75rem;color:'+muted+';">'+opts.footerHTML+'</div>';
    html += '</div>';
    container.innerHTML = html;

    function fmt(v) { return v.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
    function parseAmt(s) { return parseFloat((s||'').replace(/,/g,'')) || 0; }

    document.getElementById(uid+'_calc').onclick = function() {
      var fixed = parseAmt(document.getElementById(uid+'_fixed').value);
      var varCost = parseAmt(document.getElementById(uid+'_var').value);
      var price = parseAmt(document.getElementById(uid+'_price').value);
      if (fixed <= 0 || price <= varCost) return;

      var contribMargin = price - varCost;
      var contribPct = (contribMargin / price) * 100;
      var beUnits = Math.ceil(fixed / contribMargin);
      var beRevenue = beUnits * price;

      document.getElementById(uid+'_result').style.display = 'block';
      document.getElementById(uid+'_units').textContent = beUnits.toLocaleString() + ' units';
      document.getElementById(uid+'_revenue').textContent = fmt(beRevenue);
      document.getElementById(uid+'_margin').textContent = fmt(contribMargin) + ' / unit';
      document.getElementById(uid+'_pct').textContent = contribPct.toFixed(1) + '%';
    };
  };
})();
