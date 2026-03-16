(function(){
  window.AfroWidgets = window.AfroWidgets || {};
  window.AfroWidgets.vat_calc = function(container, opts) {
    opts = opts || {};
    var theme = opts.theme || 'light';
    var isDark = theme === 'dark';
    var bg = isDark ? '#1e1e1e' : '#fff';
    var fg = isDark ? '#f0f0f0' : '#1a1a1a';
    var muted = isDark ? '#aaa' : '#666';
    var border = isDark ? '#333' : '#e0e0e0';
    var accent = '#E8590C';

    var DB = {
      NG:{name:'Nigeria',currency:'\u20A6',rate:7.5},
      KE:{name:'Kenya',currency:'KES',rate:16},
      ZA:{name:'South Africa',currency:'R',rate:15},
      GH:{name:'Ghana',currency:'GHS',rate:21.9},
      TZ:{name:'Tanzania',currency:'TSh',rate:18},
      RW:{name:'Rwanda',currency:'FRw',rate:18},
      UG:{name:'Uganda',currency:'USh',rate:18},
      ET:{name:'Ethiopia',currency:'Birr',rate:15},
      EG:{name:'Egypt',currency:'E\u00A3',rate:14},
      MA:{name:'Morocco',currency:'MAD',rate:20},
      DZ:{name:'Algeria',currency:'DA',rate:19},
      TN:{name:'Tunisia',currency:'TND',rate:19},
      CM:{name:'Cameroon',currency:'FCFA',rate:19.25},
      SN:{name:'Senegal',currency:'CFA',rate:18},
      CI:{name:'Ivory Coast',currency:'CFA',rate:18},
      AO:{name:'Angola',currency:'Kz',rate:14},
      CD:{name:'DRC',currency:'FC',rate:16},
      ZM:{name:'Zambia',currency:'ZK',rate:16},
      ZW:{name:'Zimbabwe',currency:'ZWL',rate:15},
      BW:{name:'Botswana',currency:'P',rate:14},
      NA:{name:'Namibia',currency:'N$',rate:15},
      MZ:{name:'Mozambique',currency:'MT',rate:16},
      MW:{name:'Malawi',currency:'MK',rate:16.5},
      MU:{name:'Mauritius',currency:'Rs',rate:15},
      MG:{name:'Madagascar',currency:'Ar',rate:20},
      DJ:{name:'Djibouti',currency:'Fdj',rate:10},
      SC:{name:'Seychelles',currency:'Rs',rate:15},
      SZ:{name:'Eswatini',currency:'L',rate:15},
      LS:{name:'Lesotho',currency:'L',rate:15},
      CV:{name:'Cape Verde',currency:'$',rate:15},
      LR:{name:'Liberia',currency:'LD$',rate:10},
      SL:{name:'Sierra Leone',currency:'Le',rate:15},
      GM:{name:'Gambia',currency:'D',rate:15},
      MR:{name:'Mauritania',currency:'UM',rate:16},
      BJ:{name:'Benin',currency:'CFA',rate:18},
      BF:{name:'Burkina Faso',currency:'CFA',rate:18},
      ML:{name:'Mali',currency:'CFA',rate:18},
      NE:{name:'Niger',currency:'CFA',rate:19},
      TG:{name:'Togo',currency:'CFA',rate:18},
      GN:{name:'Guinea',currency:'FG',rate:18},
      TD:{name:'Chad',currency:'CFA',rate:18},
      GA:{name:'Gabon',currency:'CFA',rate:18},
      CG:{name:'Congo',currency:'CFA',rate:18.9},
      GQ:{name:'Equatorial Guinea',currency:'CFA',rate:15},
      CF:{name:'Central African Rep.',currency:'CFA',rate:19},
      ST:{name:'Sao Tome',currency:'Db',rate:15},
      SD:{name:'Sudan',currency:'SDG',rate:17},
      SS:{name:'South Sudan',currency:'SSP',rate:18},
      BI:{name:'Burundi',currency:'FBu',rate:18},
      KM:{name:'Comoros',currency:'CF',rate:10},
      SO:{name:'Somalia',currency:'Sh',rate:0},
      ER:{name:'Eritrea',currency:'Nfk',rate:0},
      LY:{name:'Libya',currency:'LD',rate:0}
    };

    var countryOptions = '';
    var sorted = Object.keys(DB).sort(function(a,b){ return DB[a].name.localeCompare(DB[b].name); });
    for (var i = 0; i < sorted.length; i++) {
      var c = sorted[i];
      countryOptions += '<option value="'+c+'">'+DB[c].name+' — '+DB[c].rate+'%</option>';
    }

    var uid = 'aw_vat_' + Math.random().toString(36).substr(2,6);
    var html = '<div id="'+uid+'" style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:'+bg+';color:'+fg+';padding:20px;border-radius:12px;border:1px solid '+border+';max-width:420px;">';
    html += '<h3 style="margin:0 0 16px;font-size:1.1rem;">Pan-African VAT Calculator</h3>';

    html += '<div class="aw-field" style="margin-bottom:12px;"><label class="aw-label" style="display:block;font-size:0.85rem;color:'+muted+';margin-bottom:4px;">Country</label>';
    html += '<select class="aw-select" id="'+uid+'_country" style="width:100%;padding:10px;border:1px solid '+border+';border-radius:8px;font-size:0.95rem;background:'+bg+';color:'+fg+';">';
    html += '<option value="">-- Select country --</option>' + countryOptions + '</select></div>';

    html += '<div style="display:flex;gap:4px;margin-bottom:12px;">';
    html += '<button class="aw-btn" id="'+uid+'_addBtn" style="flex:1;padding:8px;border:2px solid '+accent+';background:'+accent+';color:#fff;border-radius:8px;cursor:pointer;font-size:0.85rem;">Add VAT</button>';
    html += '<button class="aw-btn" id="'+uid+'_extBtn" style="flex:1;padding:8px;border:2px solid '+border+';background:transparent;color:'+fg+';border-radius:8px;cursor:pointer;font-size:0.85rem;">Extract VAT</button>';
    html += '</div>';

    html += '<div class="aw-field" style="margin-bottom:12px;"><label class="aw-label" id="'+uid+'_amtLabel" style="display:block;font-size:0.85rem;color:'+muted+';margin-bottom:4px;">Amount (excl. VAT)</label>';
    html += '<input class="aw-input" id="'+uid+'_amount" type="text" inputmode="decimal" placeholder="0.00" style="width:100%;padding:10px;border:1px solid '+border+';border-radius:8px;font-size:1rem;background:'+bg+';color:'+fg+';box-sizing:border-box;" /></div>';

    html += '<button class="aw-btn aw-btn--primary" id="'+uid+'_calc" style="width:100%;padding:12px;background:'+accent+';color:#fff;border:none;border-radius:8px;font-size:1rem;cursor:pointer;font-weight:600;">Calculate VAT</button>';

    html += '<div id="'+uid+'_result" class="aw-result-box" style="display:none;margin-top:16px;padding:16px;background:'+(isDark?'#2a2a2a':'#f7f7f7')+';border-radius:10px;">';
    html += '<div class="aw-result-label" style="font-size:0.8rem;color:'+muted+';" id="'+uid+'_resLabel">Total (VAT inclusive)</div>';
    html += '<div class="aw-result-main" id="'+uid+'_resMain" style="font-size:1.6rem;font-weight:700;margin:4px 0;color:'+accent+';"></div>';
    html += '<div class="aw-divider" style="border-top:1px solid '+border+';margin:12px 0;"></div>';
    html += '<div class="aw-result-row" style="display:flex;justify-content:space-between;margin-bottom:6px;"><span style="color:'+muted+';font-size:0.85rem;">Net Amount</span><strong id="'+uid+'_net" style="font-size:0.95rem;"></strong></div>';
    html += '<div class="aw-result-row" style="display:flex;justify-content:space-between;margin-bottom:6px;"><span style="color:'+muted+';font-size:0.85rem;">VAT Amount</span><strong id="'+uid+'_vat" style="font-size:0.95rem;color:'+accent+';"></strong></div>';
    html += '<div class="aw-result-row" style="display:flex;justify-content:space-between;"><span style="color:'+muted+';font-size:0.85rem;">Total</span><strong id="'+uid+'_total" style="font-size:0.95rem;"></strong></div>';
    html += '</div>';

    if (opts.footerHTML) html += '<div style="margin-top:12px;font-size:0.75rem;color:'+muted+';">'+opts.footerHTML+'</div>';
    html += '</div>';

    container.innerHTML = html;

    var mode = 'add';
    var root = document.getElementById(uid);
    var countryEl = document.getElementById(uid+'_country');
    var amountEl = document.getElementById(uid+'_amount');
    var addBtn = document.getElementById(uid+'_addBtn');
    var extBtn = document.getElementById(uid+'_extBtn');
    var calcBtn = document.getElementById(uid+'_calc');
    var resultBox = document.getElementById(uid+'_result');
    var amtLabel = document.getElementById(uid+'_amtLabel');

    function fmt(v, sym) { return sym + ' ' + v.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
    function parseAmt(s) { return parseFloat((s||'').replace(/,/g,'')) || 0; }

    addBtn.onclick = function() {
      mode = 'add'; addBtn.style.background = accent; addBtn.style.color = '#fff'; addBtn.style.borderColor = accent;
      extBtn.style.background = 'transparent'; extBtn.style.color = fg; extBtn.style.borderColor = border;
      amtLabel.textContent = 'Amount (excl. VAT)';
    };
    extBtn.onclick = function() {
      mode = 'extract'; extBtn.style.background = accent; extBtn.style.color = '#fff'; extBtn.style.borderColor = accent;
      addBtn.style.background = 'transparent'; addBtn.style.color = fg; addBtn.style.borderColor = border;
      amtLabel.textContent = 'Amount (incl. VAT)';
    };

    function calculate() {
      var code = countryEl.value;
      var amount = parseAmt(amountEl.value);
      if (!code || !DB[code] || amount <= 0) return;
      var d = DB[code];
      var rate = d.rate / 100;
      var net, vat, total;
      if (mode === 'add') { net = amount; vat = net * rate; total = net + vat; }
      else { total = amount; net = total / (1 + rate); vat = total - net; }
      resultBox.style.display = 'block';
      document.getElementById(uid+'_resLabel').textContent = mode === 'add' ? 'Total (VAT inclusive)' : 'Net Amount (excl. VAT)';
      document.getElementById(uid+'_resMain').textContent = fmt(mode === 'add' ? total : net, d.currency);
      document.getElementById(uid+'_net').textContent = fmt(net, d.currency);
      document.getElementById(uid+'_vat').textContent = fmt(vat, d.currency) + ' (' + d.rate + '%)';
      document.getElementById(uid+'_total').textContent = fmt(total, d.currency);
    }

    calcBtn.onclick = calculate;
    amountEl.addEventListener('keydown', function(e) { if (e.key === 'Enter') calculate(); });
  };
})();
