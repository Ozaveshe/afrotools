(function(){
  window.AfroWidgets = window.AfroWidgets || {};
  window.AfroWidgets.et_vat = function(container, opts) {
    opts = opts || {};
    var theme = opts.theme || 'light';
    var isDark = theme === 'dark';
    var bg = isDark ? '#1e1e1e' : '#fff';
    var fg = isDark ? '#f0f0f0' : '#1a1a1a';
    var muted = isDark ? '#aaa' : '#666';
    var border = isDark ? '#333' : '#e0e0e0';
    var accent = '#E8590C';
    var RATE = 15;
    var COUNTRY = 'Ethiopia';
    var CURRENCY = 'Birr';
    var INFO = 'Standard rate 15%. Reduced rate 10%. Food, health, services exempt. Authority: MoR. Filing: Monthly. Threshold: ETB 500K/yr.';

    var uid = 'aw_etvat_' + Math.random().toString(36).substr(2,6);
    var html = '<div id="'+uid+'" style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:'+bg+';color:'+fg+';padding:20px;border-radius:12px;border:1px solid '+border+';max-width:420px;">';
    html += '<h3 style="margin:0 0 4px;font-size:1.1rem;">'+COUNTRY+' VAT Calculator</h3>';
    html += '<p style="margin:0 0 14px;font-size:0.82rem;color:'+muted+';">Standard rate: '+RATE+'%</p>';
    html += '<div style="display:flex;gap:4px;margin-bottom:12px;"><button class="aw-btn" id="'+uid+'_addBtn" style="flex:1;padding:8px;border:2px solid '+accent+';background:'+accent+';color:#fff;border-radius:8px;cursor:pointer;font-size:0.85rem;">Add VAT</button><button class="aw-btn" id="'+uid+'_extBtn" style="flex:1;padding:8px;border:2px solid '+border+';background:transparent;color:'+fg+';border-radius:8px;cursor:pointer;font-size:0.85rem;">Extract VAT</button></div>';
    html += '<div class="aw-field" style="margin-bottom:12px;"><label class="aw-label" id="'+uid+'_lbl" style="display:block;font-size:0.85rem;color:'+muted+';margin-bottom:4px;">Amount (excl. VAT)</label><input class="aw-input" id="'+uid+'_amt" type="text" inputmode="decimal" placeholder="0.00" style="width:100%;padding:10px;border:1px solid '+border+';border-radius:8px;font-size:1rem;background:'+bg+';color:'+fg+';box-sizing:border-box;" /></div>';
    html += '<button class="aw-btn aw-btn--primary" id="'+uid+'_calc" style="width:100%;padding:12px;background:'+accent+';color:#fff;border:none;border-radius:8px;font-size:1rem;cursor:pointer;font-weight:600;">Calculate VAT</button>';
    html += '<div id="'+uid+'_result" class="aw-result-box" style="display:none;margin-top:16px;padding:16px;background:'+(isDark?'#2a2a2a':'#f7f7f7')+';border-radius:10px;">';
    html += '<div class="aw-result-label" style="font-size:0.8rem;color:'+muted+';" id="'+uid+'_resLbl">Total (VAT inclusive)</div>';
    html += '<div class="aw-result-main" id="'+uid+'_resMain" style="font-size:1.6rem;font-weight:700;margin:4px 0;color:'+accent+';"></div>';
    html += '<div class="aw-divider" style="border-top:1px solid '+border+';margin:12px 0;"></div>';
    html += '<div class="aw-result-row" style="display:flex;justify-content:space-between;margin-bottom:6px;"><span style="color:'+muted+';font-size:0.85rem;">Net Amount</span><strong id="'+uid+'_net" style="font-size:0.95rem;"></strong></div>';
    html += '<div class="aw-result-row" style="display:flex;justify-content:space-between;margin-bottom:6px;"><span style="color:'+muted+';font-size:0.85rem;">VAT ('+RATE+'%)</span><strong id="'+uid+'_vat" style="font-size:0.95rem;color:'+accent+';"></strong></div>';
    html += '<div class="aw-result-row" style="display:flex;justify-content:space-between;"><span style="color:'+muted+';font-size:0.85rem;">Total</span><strong id="'+uid+'_total" style="font-size:0.95rem;"></strong></div></div>';
    html += '<p style="margin:14px 0 0;font-size:0.75rem;color:'+muted+';line-height:1.4;">'+INFO+'</p>';
    if (opts.footerHTML) html += '<div style="margin-top:8px;font-size:0.75rem;color:'+muted+';">'+opts.footerHTML+'</div>';
    html += '</div>';
    container.innerHTML = html;
    var mode = 'add';
    function fmt(v) { return CURRENCY + ' ' + v.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
    function parseAmt(s) { return parseFloat((s||'').replace(/,/g,'')) || 0; }
    document.getElementById(uid+'_addBtn').onclick = function() { mode = 'add'; this.style.background = accent; this.style.color = '#fff'; this.style.borderColor = accent; var o = document.getElementById(uid+'_extBtn'); o.style.background = 'transparent'; o.style.color = fg; o.style.borderColor = border; document.getElementById(uid+'_lbl').textContent = 'Amount (excl. VAT)'; };
    document.getElementById(uid+'_extBtn').onclick = function() { mode = 'extract'; this.style.background = accent; this.style.color = '#fff'; this.style.borderColor = accent; var o = document.getElementById(uid+'_addBtn'); o.style.background = 'transparent'; o.style.color = fg; o.style.borderColor = border; document.getElementById(uid+'_lbl').textContent = 'Amount (incl. VAT)'; };
    function calculate() { var amount = parseAmt(document.getElementById(uid+'_amt').value); if (amount <= 0) return; var rate = RATE / 100; var net, vat, total; if (mode === 'add') { net = amount; vat = net * rate; total = net + vat; } else { total = amount; net = total / (1 + rate); vat = total - net; } document.getElementById(uid+'_result').style.display = 'block'; document.getElementById(uid+'_resLbl').textContent = mode === 'add' ? 'Total (VAT inclusive)' : 'Net Amount (excl. VAT)'; document.getElementById(uid+'_resMain').textContent = fmt(mode === 'add' ? total : net); document.getElementById(uid+'_net').textContent = fmt(net); document.getElementById(uid+'_vat').textContent = fmt(vat); document.getElementById(uid+'_total').textContent = fmt(total); }
    document.getElementById(uid+'_calc').onclick = calculate;
    document.getElementById(uid+'_amt').addEventListener('keydown', function(e) { if (e.key === 'Enter') calculate(); });
  };
})();
