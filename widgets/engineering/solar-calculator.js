(function(){
  window.AfroWidgets = window.AfroWidgets || {};
  window.AfroWidgets.solarCalculator = function(container, opts) {
    opts = opts || {};
    var theme = opts.theme || 'light';
    var bg = theme === 'dark' ? '#1a1a2e' : '#fff';
    var text = theme === 'dark' ? '#e2e8f0' : '#0f1419';
    var muted = theme === 'dark' ? '#94a3b8' : '#64748b';
    var border = theme === 'dark' ? 'rgba(255,255,255,.12)' : '#e2e8f0';
    var inputBg = theme === 'dark' ? 'rgba(255,255,255,.06)' : '#f8fafc';
    var accent = opts.accent || '#f59e0b';
    var uid = 'aw-sol-' + Math.random().toString(36).slice(2,8);

    var COUNTRIES = [
      {code:'NG',name:'Nigeria',psh:5.0,sym:'\u20A6',rate:1600},
      {code:'KE',name:'Kenya',psh:5.5,sym:'KSh',rate:130},
      {code:'GH',name:'Ghana',psh:5.2,sym:'GH\u20B5',rate:16},
      {code:'ZA',name:'South Africa',psh:5.8,sym:'R',rate:18.5},
      {code:'UG',name:'Uganda',psh:5.3,sym:'USh',rate:3800},
      {code:'TZ',name:'Tanzania',psh:5.4,sym:'TSh',rate:2500},
      {code:'EG',name:'Egypt',psh:6.2,sym:'E\u00A3',rate:30},
      {code:'ET',name:'Ethiopia',psh:5.6,sym:'Br',rate:52},
      {code:'RW',name:'Rwanda',psh:5.2,sym:'RF',rate:1300},
      {code:'SN',name:'Senegal',psh:5.8,sym:'CFA',rate:620},
      {code:'CM',name:'Cameroon',psh:4.9,sym:'CFA',rate:620},
      {code:'ZM',name:'Zambia',psh:5.5,sym:'K',rate:25},
      {code:'MA',name:'Morocco',psh:5.5,sym:'DH',rate:10}
    ];

    var BATT_DOD = {lead:0.5, gel:0.55, lifepo4:0.8};
    var BATT_EFF = {lead:0.85, gel:0.87, lifepo4:0.97};
    var BATT_UNIT_WH = 1200;

    var DEFAULT_APPLIANCES = [
      {name:'LED Lights (x4)', watts:40, hrs:6},
      {name:'Phone Chargers (x4)', watts:20, hrs:4},
      {name:'32-inch TV', watts:80, hrs:5},
      {name:'Laptop', watts:65, hrs:6},
      {name:'Fan (x2)', watts:150, hrs:8},
      {name:'Fridge', watts:150, hrs:24},
      {name:'WiFi Router', watts:15, hrs:24}
    ];

    var fieldStyle = 'width:100%;padding:8px 10px;border:1.5px solid ' + border + ';border-radius:7px;font-size:.85rem;font-weight:600;background:' + inputBg + ';color:' + text + ';outline:none;font-family:inherit;';
    var countryOpts = COUNTRIES.map(function(c) { return '<option value="' + c.code + '">' + c.name + ' (' + c.psh + ' PSH)</option>'; }).join('');

    container.innerHTML =
      '<div id="' + uid + '" style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:' + bg + ';color:' + text + ';border:1px solid ' + border + ';border-radius:12px;overflow:hidden;max-width:540px;">' +
        '<div style="padding:14px 18px;font-size:.85rem;font-weight:800;border-bottom:1px solid ' + border + ';">Solar System Calculator</div>' +
        '<div style="padding:16px 18px;">' +
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;">' +
            '<div><label style="font-size:.7rem;font-weight:700;color:' + muted + ';display:block;margin-bottom:4px;">Country</label><select id="' + uid + '-country" style="' + fieldStyle + '">' + countryOpts + '</select></div>' +
            '<div><label style="font-size:.7rem;font-weight:700;color:' + muted + ';display:block;margin-bottom:4px;">Battery Type</label>' +
              '<select id="' + uid + '-batt" style="' + fieldStyle + '"><option value="lifepo4">LiFePO4 (Best)</option><option value="gel">Gel</option><option value="lead">Lead-Acid</option></select></div>' +
          '</div>' +
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;">' +
            '<div><label style="font-size:.7rem;font-weight:700;color:' + muted + ';display:block;margin-bottom:4px;">Panel Watts</label><input type="number" id="' + uid + '-panel" value="400" style="' + fieldStyle + '"></div>' +
            '<div><label style="font-size:.7rem;font-weight:700;color:' + muted + ';display:block;margin-bottom:4px;">Backup Days</label><input type="number" id="' + uid + '-days" value="1" min="1" max="5" style="' + fieldStyle + '"></div>' +
          '</div>' +
          '<div style="margin-bottom:10px;">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">' +
              '<label style="font-size:.7rem;font-weight:700;color:' + muted + ';">Appliances</label>' +
              '<button id="' + uid + '-addApp" style="font-size:.68rem;padding:3px 10px;background:' + accent + ';color:#fff;border:none;border-radius:4px;cursor:pointer;font-weight:700;">+ Add</button>' +
            '</div>' +
            '<div id="' + uid + '-apps" style="max-height:180px;overflow-y:auto;"></div>' +
            '<div id="' + uid + '-totals" style="display:flex;gap:10px;margin-top:6px;"></div>' +
          '</div>' +
          '<button id="' + uid + '-btn" style="width:100%;padding:12px;background:' + accent + ';color:#fff;border:none;border-radius:8px;font-size:.9rem;font-weight:700;cursor:pointer;">Calculate Solar System</button>' +
          '<div id="' + uid + '-results" style="display:none;margin-top:16px;"></div>' +
        '</div>' +
        (opts.footerHTML ? '<div style="padding:10px 18px;border-top:1px solid ' + border + ';font-size:.72rem;color:' + muted + ';">' + opts.footerHTML + '</div>' : '') +
      '</div>';

    var appliances = JSON.parse(JSON.stringify(DEFAULT_APPLIANCES));

    function renderApps() {
      var html = '';
      appliances.forEach(function(a, i) {
        html += '<div style="display:grid;grid-template-columns:2fr 1fr 1fr auto;gap:4px;margin-bottom:4px;align-items:center;">' +
          '<input type="text" value="' + a.name + '" data-idx="' + i + '" data-f="name" style="' + fieldStyle + 'padding:5px 6px;font-size:.75rem;">' +
          '<input type="number" value="' + a.watts + '" data-idx="' + i + '" data-f="watts" style="' + fieldStyle + 'padding:5px 6px;font-size:.75rem;" placeholder="W">' +
          '<input type="number" value="' + a.hrs + '" data-idx="' + i + '" data-f="hrs" style="' + fieldStyle + 'padding:5px 6px;font-size:.75rem;" placeholder="hrs">' +
          '<button data-del="' + i + '" style="padding:4px 8px;background:rgba(239,68,68,.1);color:#ef4444;border:1px solid rgba(239,68,68,.2);border-radius:4px;cursor:pointer;font-size:.72rem;font-weight:700;">X</button></div>';
      });
      container.querySelector('#' + uid + '-apps').innerHTML = html;
      updateTotals();
    }

    function updateTotals() {
      var totalWh = 0, peakW = 0;
      appliances.forEach(function(a) { totalWh += a.watts * a.hrs; peakW += a.watts; });
      var boxStyle = 'flex:1;background:' + inputBg + ';border:1px solid ' + border + ';border-radius:6px;padding:6px;text-align:center;';
      container.querySelector('#' + uid + '-totals').innerHTML =
        '<div style="' + boxStyle + '"><div style="font-size:.58rem;font-weight:700;color:' + muted + ';text-transform:uppercase;">Daily</div><div style="font-size:.88rem;font-weight:800;color:' + accent + ';">' + totalWh.toLocaleString() + ' Wh</div></div>' +
        '<div style="' + boxStyle + '"><div style="font-size:.58rem;font-weight:700;color:' + muted + ';text-transform:uppercase;">Peak</div><div style="font-size:.88rem;font-weight:800;color:' + accent + ';">' + peakW + ' W</div></div>' +
        '<div style="' + boxStyle + '"><div style="font-size:.58rem;font-weight:700;color:' + muted + ';text-transform:uppercase;">+25% Buffer</div><div style="font-size:.88rem;font-weight:800;color:' + accent + ';">' + Math.round(totalWh * 1.25).toLocaleString() + ' Wh</div></div>';
    }

    var appsEl = container.querySelector('#' + uid + '-apps');
    appsEl.addEventListener('change', function(e) {
      var idx = e.target.dataset.idx;
      var f = e.target.dataset.f;
      if (idx !== undefined && f) {
        if (f === 'name') appliances[idx].name = e.target.value;
        else appliances[idx][f] = parseFloat(e.target.value) || 0;
        updateTotals();
      }
    });
    appsEl.addEventListener('click', function(e) {
      var del = e.target.dataset.del;
      if (del !== undefined) { appliances.splice(parseInt(del), 1); renderApps(); }
    });
    container.querySelector('#' + uid + '-addApp').addEventListener('click', function() {
      appliances.push({name:'New Appliance', watts:0, hrs:0}); renderApps();
    });

    function calculate() {
      var countryCode = container.querySelector('#' + uid + '-country').value;
      var country = null;
      for (var i = 0; i < COUNTRIES.length; i++) { if (COUNTRIES[i].code === countryCode) { country = COUNTRIES[i]; break; } }
      if (!country) country = COUNTRIES[0];
      var battType = container.querySelector('#' + uid + '-batt').value;
      var panelW = parseInt(container.querySelector('#' + uid + '-panel').value) || 400;
      var backupDays = parseInt(container.querySelector('#' + uid + '-days').value) || 1;

      var totalWh = 0, peakW = 0;
      appliances.forEach(function(a) { totalWh += a.watts * a.hrs; peakW += a.watts; });
      if (totalWh === 0) return;

      var adjustedWh = totalWh / 0.75;
      var psh = country.psh;
      var panelKW = adjustedWh / (psh * 1000);
      var numPanels = Math.ceil(panelKW * 1000 / panelW);
      var actualKWp = (numPanels * panelW) / 1000;

      var dod = BATT_DOD[battType];
      var eff = BATT_EFF[battType];
      var battKWhNeeded = (adjustedWh / 1000) * backupDays / (dod * eff);
      var numBatteries = Math.ceil(battKWhNeeded * 1000 / BATT_UNIT_WH);
      var actualBattKWh = (numBatteries * BATT_UNIT_WH) / 1000;

      var invKVA = Math.ceil((peakW * 1.2) / 1000 * 2) / 2;

      var panelCostUSD = numPanels * 220;
      var battCostUSD = numBatteries * (battType === 'lifepo4' ? 280 : battType === 'gel' ? 120 : 90);
      var invCostUSD = invKVA * 180;
      var totalCostUSD = (panelCostUSD + battCostUSD + invCostUSD) * 1.3;
      var totalLocal = totalCostUSD * country.rate;

      var cardBg = theme === 'dark' ? 'rgba(255,255,255,.04)' : 'linear-gradient(135deg,#0f172a,#1e293b)';
      var statBox = 'flex:1;padding:10px;background:rgba(255,255,255,.06);border-radius:6px;text-align:center;';
      var statLbl = 'font-size:.55rem;font-weight:600;color:rgba(255,255,255,.35);text-transform:uppercase;margin-bottom:2px;';
      var statVal = 'font-size:1rem;font-weight:800;color:#fff;';

      var html = '<div style="background:' + cardBg + ';border-radius:10px;padding:20px;margin-bottom:12px;">' +
        '<div style="text-align:center;margin-bottom:14px;">' +
          '<div style="font-size:.65rem;color:rgba(255,255,255,.4);text-transform:uppercase;letter-spacing:.06em;">Estimated System Cost</div>' +
          '<div style="font-size:2rem;font-weight:800;color:#38bdf8;">$' + Math.round(totalCostUSD).toLocaleString() + '</div>' +
          '<div style="font-size:.82rem;color:rgba(255,255,255,.5);">' + country.sym + ' ' + Math.round(totalLocal).toLocaleString() + '</div>' +
        '</div>' +
        '<div style="display:flex;gap:6px;">' +
          '<div style="' + statBox + '"><div style="' + statLbl + '">Panels</div><div style="' + statVal + '">' + numPanels + 'x ' + panelW + 'W</div><div style="font-size:.62rem;color:rgba(255,255,255,.35);">' + actualKWp.toFixed(1) + ' kWp</div></div>' +
          '<div style="' + statBox + '"><div style="' + statLbl + '">Batteries</div><div style="' + statVal + '">' + numBatteries + 'x 100Ah</div><div style="font-size:.62rem;color:rgba(255,255,255,.35);">' + actualBattKWh.toFixed(1) + ' kWh</div></div>' +
          '<div style="' + statBox + '"><div style="' + statLbl + '">Inverter</div><div style="' + statVal + '">' + invKVA.toFixed(1) + ' kVA</div></div>' +
        '</div>' +
      '</div>';

      html += '<div style="font-size:.68rem;font-weight:700;color:' + muted + ';text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px;">Cost Breakdown (USD)</div>';
      var items = [
        ['Solar Panels (' + numPanels + 'x)', panelCostUSD],
        ['Batteries (' + numBatteries + 'x ' + battType + ')', battCostUSD],
        ['Inverter (' + invKVA.toFixed(1) + ' kVA)', invCostUSD],
        ['Installation and Wiring (+30%)', (panelCostUSD + battCostUSD + invCostUSD) * 0.3]
      ];
      items.forEach(function(it) {
        html += '<div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid ' + border + ';font-size:.78rem;">' +
          '<span style="color:' + text + ';">' + it[0] + '</span><span style="font-weight:700;color:' + text + ';">$' + Math.round(it[1]).toLocaleString() + '</span></div>';
      });

      container.querySelector('#' + uid + '-results').innerHTML = html;
      container.querySelector('#' + uid + '-results').style.display = 'block';
    }

    container.querySelector('#' + uid + '-btn').addEventListener('click', calculate);
    renderApps();
  };
})();
