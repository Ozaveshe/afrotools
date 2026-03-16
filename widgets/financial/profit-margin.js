(function(){
  window.AfroWidgets = window.AfroWidgets || {};
  window.AfroWidgets.profit_margin = function(container, opts) {
    opts = opts || {};
    var theme = opts.theme || 'light';
    var isDark = theme === 'dark';
    var bg = isDark ? '#1e1e1e' : '#fff';
    var fg = isDark ? '#f0f0f0' : '#1a1a1a';
    var muted = isDark ? '#aaa' : '#666';
    var border = isDark ? '#333' : '#e0e0e0';
    var accent = '#E8590C';

    var uid = 'aw_pm_' + Math.random().toString(36).substr(2,6);
    var html = '<div id="'+uid+'" style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:'+bg+';color:'+fg+';padding:20px;border-radius:12px;border:1px solid '+border+';max-width:420px;">';
    html += '<h3 style="margin:0 0 16px;font-size:1.1rem;">Profit Margin Calculator</h3>';

    html += '<div style="display:flex;gap:4px;margin-bottom:12px;">';
    html += '<button class="aw-btn" id="'+uid+'_mCalc" style="flex:1;padding:8px;border:2px solid '+accent+';background:'+accent+';color:#fff;border-radius:8px;cursor:pointer;font-size:0.85rem;">Calculate Margin</button>';
    html += '<button class="aw-btn" id="'+uid+'_mTarget" style="flex:1;padding:8px;border:2px solid '+border+';background:transparent;color:'+fg+';border-radius:8px;cursor:pointer;font-size:0.85rem;">Target Margin</button>';
    html += '</div>';

    // Calculate mode fields
    html += '<div id="'+uid+'_calcFields">';
    html += '<div class="aw-field" style="margin-bottom:12px;"><label class="aw-label" style="display:block;font-size:0.85rem;color:'+muted+';margin-bottom:4px;">Cost Price</label><input class="aw-input" id="'+uid+'_cost" type="text" inputmode="decimal" placeholder="0" style="width:100%;padding:10px;border:1px solid '+border+';border-radius:8px;font-size:1rem;background:'+bg+';color:'+fg+';box-sizing:border-box;" /></div>';
    html += '<div class="aw-field" style="margin-bottom:12px;"><label class="aw-label" style="display:block;font-size:0.85rem;color:'+muted+';margin-bottom:4px;">Selling Price</label><input class="aw-input" id="'+uid+'_sell" type="text" inputmode="decimal" placeholder="0" style="width:100%;padding:10px;border:1px solid '+border+';border-radius:8px;font-size:1rem;background:'+bg+';color:'+fg+';box-sizing:border-box;" /></div>';
    html += '</div>';

    // Target mode fields
    html += '<div id="'+uid+'_targetFields" style="display:none;">';
    html += '<div class="aw-field" style="margin-bottom:12px;"><label class="aw-label" style="display:block;font-size:0.85rem;color:'+muted+';margin-bottom:4px;">Cost Price</label><input class="aw-input" id="'+uid+'_tCost" type="text" inputmode="decimal" placeholder="0" style="width:100%;padding:10px;border:1px solid '+border+';border-radius:8px;font-size:1rem;background:'+bg+';color:'+fg+';box-sizing:border-box;" /></div>';
    html += '<div class="aw-field" style="margin-bottom:12px;"><label class="aw-label" style="display:block;font-size:0.85rem;color:'+muted+';margin-bottom:4px;">Target Margin (%)</label><input class="aw-input" id="'+uid+'_tMargin" type="number" step="0.1" placeholder="30" style="width:100%;padding:10px;border:1px solid '+border+';border-radius:8px;font-size:1rem;background:'+bg+';color:'+fg+';box-sizing:border-box;" /></div>';
    html += '</div>';

    html += '<button class="aw-btn aw-btn--primary" id="'+uid+'_calc" style="width:100%;padding:12px;background:'+accent+';color:#fff;border:none;border-radius:8px;font-size:1rem;cursor:pointer;font-weight:600;">Calculate</button>';

    html += '<div id="'+uid+'_result" class="aw-result-box" style="display:none;margin-top:16px;padding:16px;background:'+(isDark?'#2a2a2a':'#f7f7f7')+';border-radius:10px;">';
    html += '<div class="aw-result-label" style="font-size:0.8rem;color:'+muted+';" id="'+uid+'_resLabel">Profit Margin</div>';
    html += '<div class="aw-result-main" id="'+uid+'_resMain" style="font-size:1.6rem;font-weight:700;margin:4px 0;color:'+accent+';"></div>';
    html += '<div class="aw-divider" style="border-top:1px solid '+border+';margin:12px 0;"></div>';
    html += '<div class="aw-result-row" style="display:flex;justify-content:space-between;margin-bottom:6px;"><span style="color:'+muted+';font-size:0.85rem;">Profit</span><strong id="'+uid+'_profit" style="font-size:0.95rem;color:'+accent+';"></strong></div>';
    html += '<div class="aw-result-row" style="display:flex;justify-content:space-between;margin-bottom:6px;"><span style="color:'+muted+';font-size:0.85rem;">Margin %</span><strong id="'+uid+'_marginPct" style="font-size:0.95rem;"></strong></div>';
    html += '<div class="aw-result-row" style="display:flex;justify-content:space-between;"><span style="color:'+muted+';font-size:0.85rem;">Markup %</span><strong id="'+uid+'_markupPct" style="font-size:0.95rem;"></strong></div>';
    html += '</div>';

    if (opts.footerHTML) html += '<div style="margin-top:12px;font-size:0.75rem;color:'+muted+';">'+opts.footerHTML+'</div>';
    html += '</div>';
    container.innerHTML = html;

    var currentMode = 'calc';
    var mCalcBtn = document.getElementById(uid+'_mCalc');
    var mTargetBtn = document.getElementById(uid+'_mTarget');

    function fmt(v) { return v.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
    function parseAmt(s) { return parseFloat((s||'').replace(/,/g,'')) || 0; }

    mCalcBtn.onclick = function() {
      currentMode = 'calc';
      mCalcBtn.style.background = accent; mCalcBtn.style.color = '#fff'; mCalcBtn.style.borderColor = accent;
      mTargetBtn.style.background = 'transparent'; mTargetBtn.style.color = fg; mTargetBtn.style.borderColor = border;
      document.getElementById(uid+'_calcFields').style.display = 'block';
      document.getElementById(uid+'_targetFields').style.display = 'none';
    };
    mTargetBtn.onclick = function() {
      currentMode = 'target';
      mTargetBtn.style.background = accent; mTargetBtn.style.color = '#fff'; mTargetBtn.style.borderColor = accent;
      mCalcBtn.style.background = 'transparent'; mCalcBtn.style.color = fg; mCalcBtn.style.borderColor = border;
      document.getElementById(uid+'_calcFields').style.display = 'none';
      document.getElementById(uid+'_targetFields').style.display = 'block';
    };

    document.getElementById(uid+'_calc').onclick = function() {
      var cost, sell, profit, margin, markup;

      if (currentMode === 'calc') {
        cost = parseAmt(document.getElementById(uid+'_cost').value);
        sell = parseAmt(document.getElementById(uid+'_sell').value);
        if (cost <= 0 || sell <= 0) return;
        profit = sell - cost;
        margin = (profit / sell) * 100;
        markup = (profit / cost) * 100;
      } else {
        cost = parseAmt(document.getElementById(uid+'_tCost').value);
        var targetMargin = parseFloat(document.getElementById(uid+'_tMargin').value) || 0;
        if (cost <= 0 || targetMargin >= 100) return;
        sell = cost / (1 - (targetMargin / 100));
        profit = sell - cost;
        margin = targetMargin;
        markup = (profit / cost) * 100;
      }

      document.getElementById(uid+'_result').style.display = 'block';
      document.getElementById(uid+'_resLabel').textContent = currentMode === 'calc' ? 'Profit Margin' : 'Required Selling Price';
      document.getElementById(uid+'_resMain').textContent = currentMode === 'calc' ? margin.toFixed(1) + '%' : fmt(sell);
      document.getElementById(uid+'_profit').textContent = fmt(profit);
      document.getElementById(uid+'_marginPct').textContent = margin.toFixed(1) + '%';
      document.getElementById(uid+'_markupPct').textContent = markup.toFixed(1) + '%';
    };
  };
})();
