(function(){
  window.AfroWidgets = window.AfroWidgets || {};
  window.AfroWidgets.generatorFuel = function(container, opts) {
    opts = opts || {};
    var theme = opts.theme || 'light';
    var bg = theme === 'dark' ? '#1a1a2e' : '#fff';
    var text = theme === 'dark' ? '#e2e8f0' : '#0f1419';
    var muted = theme === 'dark' ? '#94a3b8' : '#64748b';
    var border = theme === 'dark' ? 'rgba(255,255,255,.12)' : '#e2e8f0';
    var inputBg = theme === 'dark' ? 'rgba(255,255,255,.06)' : '#f8fafc';
    var accent = opts.accent || '#ef4444';
    var uid = 'aw-gf-' + Math.random().toString(36).slice(2,8);

    var PRESETS = [
      {label:'2.5 kVA', val:2.5},
      {label:'5 kVA', val:5},
      {label:'10 kVA', val:10},
      {label:'20 kVA', val:20}
    ];

    var FUEL_PRICES = [
      {label:'Nigeria PMS', curr:'NGN', price:1100},
      {label:'Nigeria Diesel', curr:'NGN', price:1400},
      {label:'Kenya', curr:'KES', price:185},
      {label:'Ghana', curr:'GHS', price:16},
      {label:'South Africa', curr:'ZAR', price:25}
    ];

    var fieldStyle = 'width:100%;padding:8px 10px;border:1.5px solid ' + border + ';border-radius:7px;font-size:.85rem;font-weight:600;background:' + inputBg + ';color:' + text + ';outline:none;font-family:inherit;';

    container.innerHTML =
      '<div id="' + uid + '" style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:' + bg + ';color:' + text + ';border:1px solid ' + border + ';border-radius:12px;overflow:hidden;max-width:480px;">' +
        '<div style="padding:14px 18px;font-size:.85rem;font-weight:800;border-bottom:1px solid ' + border + ';">Generator Fuel Cost Calculator</div>' +
        '<div style="padding:16px 18px;">' +
          '<div style="margin-bottom:10px;">' +
            '<label style="font-size:.7rem;font-weight:700;color:' + muted + ';display:block;margin-bottom:4px;">Generator Size (kVA)</label>' +
            '<div style="display:flex;gap:4px;margin-bottom:6px;" id="' + uid + '-presets"></div>' +
            '<input type="number" id="' + uid + '-kva" value="5" min="0.5" step="0.5" style="' + fieldStyle + '">' +
          '</div>' +
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px;">' +
            '<div><label style="font-size:.7rem;font-weight:700;color:' + muted + ';display:block;margin-bottom:4px;">Fuel Type</label>' +
              '<select id="' + uid + '-fuel" style="' + fieldStyle + '"><option value="petrol">Petrol (PMS)</option><option value="diesel">Diesel (AGO)</option></select></div>' +
            '<div><label style="font-size:.7rem;font-weight:700;color:' + muted + ';display:block;margin-bottom:4px;">Load %</label>' +
              '<input type="number" id="' + uid + '-load" value="75" min="10" max="100" style="' + fieldStyle + '"></div>' +
          '</div>' +
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px;">' +
            '<div><label style="font-size:.7rem;font-weight:700;color:' + muted + ';display:block;margin-bottom:4px;">Hours/Day</label>' +
              '<input type="number" id="' + uid + '-hrs" value="6" min="1" max="24" style="' + fieldStyle + '"></div>' +
            '<div><label style="font-size:.7rem;font-weight:700;color:' + muted + ';display:block;margin-bottom:4px;">Days/Month</label>' +
              '<input type="number" id="' + uid + '-days" value="25" min="1" max="31" style="' + fieldStyle + '"></div>' +
          '</div>' +
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;">' +
            '<div><label style="font-size:.7rem;font-weight:700;color:' + muted + ';display:block;margin-bottom:4px;">Fuel Price/Litre</label>' +
              '<input type="number" id="' + uid + '-price" value="1100" min="0" step="0.01" style="' + fieldStyle + '"></div>' +
            '<div><label style="font-size:.7rem;font-weight:700;color:' + muted + ';display:block;margin-bottom:4px;">Currency</label>' +
              '<input type="text" id="' + uid + '-curr" value="NGN" style="' + fieldStyle + '"></div>' +
          '</div>' +
          '<div style="margin-bottom:12px;"><label style="font-size:.7rem;font-weight:700;color:' + muted + ';display:block;margin-bottom:4px;">Quick Fuel Price</label>' +
            '<div style="display:flex;flex-wrap:wrap;gap:4px;" id="' + uid + '-fuelPresets"></div></div>' +
          '<button id="' + uid + '-btn" style="width:100%;padding:11px;background:' + accent + ';color:#fff;border:none;border-radius:8px;font-size:.88rem;font-weight:700;cursor:pointer;">Calculate Fuel Costs</button>' +
          '<div id="' + uid + '-results" style="display:none;margin-top:16px;"></div>' +
        '</div>' +
        (opts.footerHTML ? '<div style="padding:10px 18px;border-top:1px solid ' + border + ';font-size:.72rem;color:' + muted + ';">' + opts.footerHTML + '</div>' : '') +
      '</div>';

    var presetBox = document.getElementById(uid + '-presets');
    PRESETS.forEach(function(p) {
      var btn = document.createElement('button');
      btn.textContent = p.label;
      btn.style.cssText = 'flex:1;padding:6px 4px;font-size:.68rem;font-weight:700;border:1.5px solid ' + border + ';background:' + inputBg + ';color:' + text + ';border-radius:5px;cursor:pointer;';
      btn.addEventListener('click', function() { document.getElementById(uid + '-kva').value = p.val; });
      presetBox.appendChild(btn);
    });

    var fuelPresetBox = document.getElementById(uid + '-fuelPresets');
    FUEL_PRICES.forEach(function(fp) {
      var btn = document.createElement('button');
      btn.textContent = fp.label;
      btn.style.cssText = 'padding:4px 10px;font-size:.65rem;font-weight:700;border:1px solid ' + border + ';background:' + inputBg + ';color:' + muted + ';border-radius:4px;cursor:pointer;';
      btn.addEventListener('click', function() {
        document.getElementById(uid + '-price').value = fp.price;
        document.getElementById(uid + '-curr').value = fp.curr;
      });
      fuelPresetBox.appendChild(btn);
    });

    function calculate() {
      var kva = parseFloat(document.getElementById(uid + '-kva').value) || 5;
      var fuelType = document.getElementById(uid + '-fuel').value;
      var loadPct = parseFloat(document.getElementById(uid + '-load').value) / 100;
      var hrsDay = parseFloat(document.getElementById(uid + '-hrs').value) || 6;
      var daysMonth = parseFloat(document.getElementById(uid + '-days').value) || 25;
      var fuelPrice = parseFloat(document.getElementById(uid + '-price').value) || 1100;
      var currency = document.getElementById(uid + '-curr').value || 'NGN';

      var consumptionRate = fuelType === 'diesel' ? 0.21 : 0.30;
      var literHour = kva * consumptionRate * loadPct;
      var literDay = literHour * hrsDay;
      var literMonth = literDay * daysMonth;
      var monthlyCost = literMonth * fuelPrice;
      var annualCost = monthlyCost * 12;
      var kwhMonth = kva * 0.8 * hrsDay * daysMonth;
      var costKwh = kwhMonth > 0 ? monthlyCost / kwhMonth : 0;

      var cardBg = theme === 'dark' ? 'rgba(255,255,255,.04)' : 'linear-gradient(135deg,#0f172a,#1e293b)';
      var statBox = 'flex:1;padding:10px;background:rgba(255,255,255,.06);border-radius:6px;text-align:center;';
      var statLbl = 'font-size:.55rem;font-weight:600;color:rgba(255,255,255,.35);text-transform:uppercase;margin-bottom:2px;';
      var statVal = 'font-size:1rem;font-weight:800;color:#fff;';

      var html = '<div style="background:' + cardBg + ';border-radius:10px;padding:20px;margin-bottom:12px;">' +
        '<div style="text-align:center;margin-bottom:14px;">' +
          '<div style="font-size:.65rem;color:rgba(255,255,255,.4);text-transform:uppercase;letter-spacing:.06em;">Monthly Fuel Cost</div>' +
          '<div style="font-size:2rem;font-weight:800;color:#f87171;">' + currency + ' ' + Math.round(monthlyCost).toLocaleString() + '</div>' +
          '<div style="font-size:.82rem;color:rgba(255,255,255,.5);">' + currency + ' ' + Math.round(annualCost).toLocaleString() + ' per year</div>' +
        '</div>' +
        '<div style="display:flex;gap:6px;">' +
          '<div style="' + statBox + '"><div style="' + statLbl + '">L/Hour</div><div style="' + statVal + '">' + literHour.toFixed(2) + '</div></div>' +
          '<div style="' + statBox + '"><div style="' + statLbl + '">L/Day</div><div style="' + statVal + '">' + literDay.toFixed(1) + '</div></div>' +
          '<div style="' + statBox + '"><div style="' + statLbl + '">L/Month</div><div style="' + statVal + '">' + literMonth.toFixed(0) + '</div></div>' +
        '</div>' +
      '</div>';

      html += '<div style="display:flex;justify-content:space-between;padding:8px 12px;background:' + inputBg + ';border:1px solid ' + border + ';border-radius:8px;margin-bottom:8px;">' +
        '<span style="font-size:.78rem;font-weight:600;color:' + text + ';">Cost per kWh</span>' +
        '<span style="font-size:.88rem;font-weight:800;color:' + accent + ';">' + currency + ' ' + costKwh.toFixed(2) + '</span></div>';

      html += '<div style="display:flex;justify-content:space-between;padding:8px 12px;background:' + inputBg + ';border:1px solid ' + border + ';border-radius:8px;">' +
        '<span style="font-size:.78rem;font-weight:600;color:' + text + ';">Energy produced per month</span>' +
        '<span style="font-size:.88rem;font-weight:800;color:' + text + ';">' + Math.round(kwhMonth).toLocaleString() + ' kWh</span></div>';

      document.getElementById(uid + '-results').innerHTML = html;
      document.getElementById(uid + '-results').style.display = 'block';
    }

    document.getElementById(uid + '-btn').addEventListener('click', calculate);
  };
})();
