(function(){
  window.AfroWidgets = window.AfroWidgets || {};
  window.AfroWidgets.mortgage = function(container, opts) {
    opts = opts || {};
    var theme = opts.theme || 'light';
    var isDark = theme === 'dark';
    var bg = isDark ? '#1e1e1e' : '#fff';
    var fg = isDark ? '#f0f0f0' : '#1a1a1a';
    var muted = isDark ? '#aaa' : '#666';
    var border = isDark ? '#333' : '#e0e0e0';
    var accent = '#E8590C';

    var uid = 'aw_mort_' + Math.random().toString(36).substr(2,6);
    var COUNTRIES = {
      NG:{name:'Nigeria',currency:'\u20A6',rates:[{name:'NHF Loan',rate:6},{name:'Commercial Bank',rate:22}]},
      KE:{name:'Kenya',currency:'KSh',rates:[{name:'KCB Mortgage',rate:13},{name:'Standard Bank',rate:14.5}]},
      ZA:{name:'South Africa',currency:'R',rates:[{name:'Standard Variable',rate:11.75},{name:'Fixed Rate',rate:11.25}]},
      GH:{name:'Ghana',currency:'GH\u20B5',rates:[{name:'Bank Mortgage',rate:28},{name:'Housing Finance',rate:32}]},
      EG:{name:'Egypt',currency:'E\u00A3',rates:[{name:'Bank Mortgage',rate:10},{name:'Social Housing',rate:7}]},
      TZ:{name:'Tanzania',currency:'TSh',rates:[{name:'Standard Mortgage',rate:18}]},
      RW:{name:'Rwanda',currency:'FRw',rates:[{name:'BK Mortgage',rate:16}]},
      UG:{name:'Uganda',currency:'USh',rates:[{name:'Bank Mortgage',rate:20}]},
      MA:{name:'Morocco',currency:'MAD',rates:[{name:'Fixed Rate',rate:4.5},{name:'Variable Rate',rate:3.5}]},
      ZM:{name:'Zambia',currency:'ZK',rates:[{name:'Bank Mortgage',rate:25}]}
    };

    var countryOpts = '<option value="">-- Select country --</option>';
    var keys = Object.keys(COUNTRIES).sort(function(a,b){ return COUNTRIES[a].name.localeCompare(COUNTRIES[b].name); });
    for (var i = 0; i < keys.length; i++) {
      countryOpts += '<option value="'+keys[i]+'">'+COUNTRIES[keys[i]].name+'</option>';
    }

    var html = '<div id="'+uid+'" style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:'+bg+';color:'+fg+';padding:20px;border-radius:12px;border:1px solid '+border+';max-width:420px;">';
    html += '<h3 style="margin:0 0 16px;font-size:1.1rem;">Mortgage Calculator</h3>';
    html += '<div class="aw-field" style="margin-bottom:12px;"><label class="aw-label" style="display:block;font-size:0.85rem;color:'+muted+';margin-bottom:4px;">Country</label><select class="aw-select" id="'+uid+'_country" style="width:100%;padding:10px;border:1px solid '+border+';border-radius:8px;font-size:0.95rem;background:'+bg+';color:'+fg+';">'+countryOpts+'</select></div>';
    html += '<div class="aw-field" style="margin-bottom:12px;"><label class="aw-label" style="display:block;font-size:0.85rem;color:'+muted+';margin-bottom:4px;">Loan Type</label><select class="aw-select" id="'+uid+'_loantype" style="width:100%;padding:10px;border:1px solid '+border+';border-radius:8px;font-size:0.95rem;background:'+bg+';color:'+fg+';"><option value="">Select country first</option></select></div>';
    html += '<div class="aw-field" style="margin-bottom:12px;"><label class="aw-label" style="display:block;font-size:0.85rem;color:'+muted+';margin-bottom:4px;">Property Price</label><input class="aw-input" id="'+uid+'_price" type="text" inputmode="decimal" placeholder="0.00" style="width:100%;padding:10px;border:1px solid '+border+';border-radius:8px;font-size:1rem;background:'+bg+';color:'+fg+';box-sizing:border-box;" /></div>';
    html += '<div class="aw-field" style="margin-bottom:12px;"><label class="aw-label" style="display:block;font-size:0.85rem;color:'+muted+';margin-bottom:4px;">Down Payment</label><input class="aw-input" id="'+uid+'_down" type="text" inputmode="decimal" placeholder="0.00" style="width:100%;padding:10px;border:1px solid '+border+';border-radius:8px;font-size:1rem;background:'+bg+';color:'+fg+';box-sizing:border-box;" /></div>';
    html += '<div class="aw-field" style="margin-bottom:12px;"><label class="aw-label" style="display:block;font-size:0.85rem;color:'+muted+';margin-bottom:4px;">Annual Interest Rate (%)</label><input class="aw-input" id="'+uid+'_rate" type="number" step="0.01" placeholder="10" style="width:100%;padding:10px;border:1px solid '+border+';border-radius:8px;font-size:1rem;background:'+bg+';color:'+fg+';box-sizing:border-box;" /></div>';
    html += '<div class="aw-field" style="margin-bottom:12px;"><label class="aw-label" style="display:block;font-size:0.85rem;color:'+muted+';margin-bottom:4px;">Loan Term (years)</label><input class="aw-input" id="'+uid+'_term" type="number" value="20" placeholder="20" style="width:100%;padding:10px;border:1px solid '+border+';border-radius:8px;font-size:1rem;background:'+bg+';color:'+fg+';box-sizing:border-box;" /></div>';
    html += '<button class="aw-btn aw-btn--primary" id="'+uid+'_calc" style="width:100%;padding:12px;background:'+accent+';color:#fff;border:none;border-radius:8px;font-size:1rem;cursor:pointer;font-weight:600;">Calculate Mortgage</button>';

    html += '<div id="'+uid+'_result" class="aw-result-box" style="display:none;margin-top:16px;padding:16px;background:'+(isDark?'#2a2a2a':'#f7f7f7')+';border-radius:10px;">';
    html += '<div class="aw-result-label" style="font-size:0.8rem;color:'+muted+';">Monthly Payment</div>';
    html += '<div class="aw-result-main" id="'+uid+'_monthly" style="font-size:1.6rem;font-weight:700;margin:4px 0;color:'+accent+';"></div>';
    html += '<div class="aw-divider" style="border-top:1px solid '+border+';margin:12px 0;"></div>';
    html += '<div class="aw-result-row" style="display:flex;justify-content:space-between;margin-bottom:6px;"><span style="color:'+muted+';font-size:0.85rem;">Loan Amount</span><strong id="'+uid+'_loan" style="font-size:0.95rem;"></strong></div>';
    html += '<div class="aw-result-row" style="display:flex;justify-content:space-between;margin-bottom:6px;"><span style="color:'+muted+';font-size:0.85rem;">Total Interest</span><strong id="'+uid+'_interest" style="font-size:0.95rem;color:'+accent+';"></strong></div>';
    html += '<div class="aw-result-row" style="display:flex;justify-content:space-between;margin-bottom:6px;"><span style="color:'+muted+';font-size:0.85rem;">Total Cost</span><strong id="'+uid+'_totalcost" style="font-size:0.95rem;"></strong></div>';
    html += '</div>';

    if (opts.footerHTML) html += '<div style="margin-top:12px;font-size:0.75rem;color:'+muted+';">'+opts.footerHTML+'</div>';
    html += '</div>';
    container.innerHTML = html;

    var countryEl = document.getElementById(uid+'_country');
    var loantypeEl = document.getElementById(uid+'_loantype');
    var rateEl = document.getElementById(uid+'_rate');

    function fmt(v, sym) { return sym + ' ' + v.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
    function parseAmt(s) { return parseFloat((s||'').replace(/,/g,'')) || 0; }

    countryEl.onchange = function() {
      var c = COUNTRIES[countryEl.value];
      if (!c) { loantypeEl.innerHTML = '<option value="">Select country first</option>'; return; }
      var h = '';
      for (var j = 0; j < c.rates.length; j++) {
        h += '<option value="'+c.rates[j].rate+'">'+c.rates[j].name+' ('+c.rates[j].rate+'%)</option>';
      }
      loantypeEl.innerHTML = h;
      rateEl.value = c.rates[0].rate;
    };
    loantypeEl.onchange = function() { rateEl.value = loantypeEl.value; };

    document.getElementById(uid+'_calc').onclick = function() {
      var code = countryEl.value;
      var price = parseAmt(document.getElementById(uid+'_price').value);
      var down = parseAmt(document.getElementById(uid+'_down').value);
      var annualRate = parseFloat(rateEl.value) || 0;
      var years = parseInt(document.getElementById(uid+'_term').value) || 20;
      if (price <= 0 || annualRate <= 0) return;

      var sym = code && COUNTRIES[code] ? COUNTRIES[code].currency : '$';
      var principal = Math.max(0, price - down);
      var r = annualRate / 100 / 12;
      var n = years * 12;
      var monthly = principal * r * Math.pow(1+r,n) / (Math.pow(1+r,n) - 1);
      var totalCost = monthly * n;
      var totalInterest = totalCost - principal;

      document.getElementById(uid+'_result').style.display = 'block';
      document.getElementById(uid+'_monthly').textContent = fmt(monthly, sym);
      document.getElementById(uid+'_loan').textContent = fmt(principal, sym);
      document.getElementById(uid+'_interest').textContent = fmt(totalInterest, sym);
      document.getElementById(uid+'_totalcost').textContent = fmt(totalCost, sym);
    };
  };
})();
