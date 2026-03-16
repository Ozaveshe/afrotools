(function(){
  window.AfroWidgets = window.AfroWidgets || {};
  window.AfroWidgets.japaCalculator = function(container, opts) {
    opts = opts || {};
    var theme = opts.theme || 'light';
    var bg = theme === 'dark' ? '#1a1a2e' : '#fff';
    var text = theme === 'dark' ? '#e2e8f0' : '#0f1419';
    var muted = theme === 'dark' ? '#94a3b8' : '#64748b';
    var border = theme === 'dark' ? 'rgba(255,255,255,.12)' : '#e2e8f0';
    var inputBg = theme === 'dark' ? 'rgba(255,255,255,.06)' : '#f8fafc';
    var accent = opts.accent || '#0071e3';
    var uid = 'aw-jc-' + Math.random().toString(36).slice(2,8);

    // Simplified DB: exchange rates, flight costs, visa fees, settlement costs
    var FX = {NG:1600,KE:130,GH:16,ZA:18.5,EG:30,ET:52,TZ:2500,UG:3800,RW:1300,SN:620,CM:620,CD:2500,ZM:25,ZW:80,MW:1700,MA:10};
    var CUR = {NG:'NGN',KE:'KES',GH:'GHS',ZA:'ZAR',EG:'EGP',ET:'ETB',TZ:'TZS',UG:'UGX',RW:'RWF',SN:'XOF',CM:'XAF',CD:'CDF',ZM:'ZMW',ZW:'ZWL',MW:'MWK',MA:'MAD'};
    var SYM = {NG:'\u20A6',KE:'KSh',GH:'GH\u20B5',ZA:'R',EG:'EGP',ET:'ETB',TZ:'TSh',UG:'USh',RW:'RF',SN:'CFA',CM:'CFA',CD:'CDF',ZM:'ZMW',ZW:'ZWL',MW:'MK',MA:'DH'};

    // Average costs in USD
    var FLIGHTS = {
      CA:900,US:950,UK:800,DE:750,NL:780,PT:700,FR:720,AU:1200,NZ:1400,AE:450,SG:800,IE:780
    };
    var VISA_FEES = {
      CA:{name:'Canada (Express Entry)',fee:1325,processing:1200},
      US:{name:'USA (H-1B)',fee:460,processing:800},
      UK:{name:'UK (Skilled Worker)',fee:1220,processing:600},
      DE:{name:'Germany (Job Seeker)',fee:75,processing:400},
      NL:{name:'Netherlands (HSM)',fee:320,processing:350},
      PT:{name:'Portugal (D7/Tech)',fee:180,processing:300},
      FR:{name:'France (Talent)',fee:200,processing:350},
      AU:{name:'Australia (Skilled)',fee:4115,processing:1000},
      NZ:{name:'New Zealand (SMC)',fee:680,processing:600},
      AE:{name:'UAE (Employment)',fee:300,processing:400},
      SG:{name:'Singapore (EP)',fee:200,processing:300},
      IE:{name:'Ireland (Critical Skills)',fee:1000,processing:500}
    };
    var SETTLEMENT = {
      CA:{rent:1800,deposit:3600,groceries:400,transport:120},
      US:{rent:2200,deposit:4400,groceries:450,transport:100},
      UK:{rent:1600,deposit:3200,groceries:380,transport:150},
      DE:{rent:1100,deposit:3300,groceries:300,transport:80},
      NL:{rent:1400,deposit:2800,groceries:320,transport:90},
      PT:{rent:900,deposit:1800,groceries:250,transport:50},
      FR:{rent:1200,deposit:2400,groceries:350,transport:75},
      AU:{rent:1800,deposit:3600,groceries:400,transport:100},
      NZ:{rent:1500,deposit:3000,groceries:350,transport:80},
      AE:{rent:1500,deposit:3000,groceries:350,transport:50},
      SG:{rent:2000,deposit:4000,groceries:400,transport:80},
      IE:{rent:1700,deposit:3400,groceries:350,transport:120}
    };

    var LOCAL_COSTS = {ielts:250,passport:100,police:50,medical:200};

    var fieldStyle = 'width:100%;padding:9px 10px;border:1.5px solid ' + border + ';border-radius:7px;font-size:.9rem;font-weight:600;background:' + inputBg + ';color:' + text + ';outline:none;font-family:inherit;';
    var checkStyle = 'display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border:1.5px solid ' + border + ';border-radius:6px;font-size:.78rem;font-weight:600;color:' + text + ';cursor:pointer;background:' + inputBg + ';';

    container.innerHTML =
      '<div id="' + uid + '" style="font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',sans-serif;background:' + bg + ';color:' + text + ';border:1px solid ' + border + ';border-radius:12px;overflow:hidden;max-width:520px;">' +
        '<div style="padding:14px 18px;font-size:.85rem;font-weight:800;border-bottom:1px solid ' + border + ';">Japa Cost Calculator</div>' +
        '<div style="padding:16px 18px;">' +
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;">' +
            '<div><label style="font-size:.7rem;font-weight:700;color:' + muted + ';display:block;margin-bottom:4px;">From (Country)</label>' +
              '<select id="' + uid + '-origin" style="' + fieldStyle + '">' +
                '<option value="NG">Nigeria</option><option value="KE">Kenya</option><option value="GH">Ghana</option><option value="ZA">South Africa</option>' +
                '<option value="EG">Egypt</option><option value="ET">Ethiopia</option><option value="TZ">Tanzania</option><option value="UG">Uganda</option>' +
                '<option value="CM">Cameroon</option><option value="SN">Senegal</option><option value="RW">Rwanda</option><option value="ZM">Zambia</option>' +
              '</select></div>' +
            '<div><label style="font-size:.7rem;font-weight:700;color:' + muted + ';display:block;margin-bottom:4px;">Destination</label>' +
              '<select id="' + uid + '-dest" style="' + fieldStyle + '">' +
                '<option value="CA">Canada</option><option value="US">United States</option><option value="UK">United Kingdom</option>' +
                '<option value="DE">Germany</option><option value="NL">Netherlands</option><option value="PT">Portugal</option><option value="AU">Australia</option>' +
                '<option value="NZ">New Zealand</option><option value="AE">UAE</option><option value="IE">Ireland</option>' +
              '</select></div>' +
          '</div>' +
          '<div style="margin-bottom:12px;">' +
            '<label style="font-size:.7rem;font-weight:700;color:' + muted + ';display:block;margin-bottom:6px;">Options</label>' +
            '<div style="display:flex;flex-wrap:wrap;gap:6px;">' +
              '<label style="' + checkStyle + '"><input type="checkbox" id="' + uid + '-ielts" checked> IELTS/PTE</label>' +
              '<label style="' + checkStyle + '"><input type="checkbox" id="' + uid + '-spouse"> Spouse</label>' +
              '<label style="' + checkStyle + '"><input type="checkbox" id="' + uid + '-kids"> Children</label>' +
              '<label style="' + checkStyle + '"><input type="checkbox" id="' + uid + '-consult"> Consultant</label>' +
            '</div>' +
          '</div>' +
          '<button id="' + uid + '-btn" style="width:100%;padding:12px;background:' + accent + ';color:#fff;border:none;border-radius:8px;font-size:.9rem;font-weight:700;cursor:pointer;">Calculate Total Japa Cost</button>' +
          '<div id="' + uid + '-results" style="display:none;margin-top:16px;">' +
            '<div id="' + uid + '-total" style="text-align:center;padding:20px;background:' + (theme==='dark'?'rgba(255,255,255,.04)':'linear-gradient(135deg,#0f172a,#1e293b)') + ';border-radius:10px;margin-bottom:14px;">' +
              '<div style="font-size:.65rem;color:rgba(255,255,255,.4);text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;">Estimated Total Cost</div>' +
              '<div id="' + uid + '-usd" style="font-size:2rem;font-weight:800;color:#38bdf8;"></div>' +
              '<div id="' + uid + '-local" style="font-size:.85rem;color:rgba(255,255,255,.5);margin-top:2px;"></div>' +
            '</div>' +
            '<div id="' + uid + '-breakdown" style=""></div>' +
          '</div>' +
        '</div>' +
        (opts.footerHTML ? '<div style="padding:10px 18px;border-top:1px solid ' + border + ';font-size:.72rem;color:' + muted + ';">' + opts.footerHTML + '</div>' : '') +
      '</div>';

    function fmtUSD(n) { return '$' + Math.round(n).toLocaleString(); }

    function calculate() {
      var origin = document.getElementById(uid + '-origin').value;
      var dest = document.getElementById(uid + '-dest').value;
      var needIelts = document.getElementById(uid + '-ielts').checked;
      var hasSpouse = document.getElementById(uid + '-spouse').checked;
      var hasKids = document.getElementById(uid + '-kids').checked;
      var hasConsult = document.getElementById(uid + '-consult').checked;

      var visa = VISA_FEES[dest] || {fee:500,processing:500};
      var settle = SETTLEMENT[dest] || {rent:1500,deposit:3000,groceries:350,transport:80};
      var flight = FLIGHTS[dest] || 800;
      var fx = FX[origin] || 1;
      var sym = SYM[origin] || '$';

      var items = [];
      var cats = {};
      function add(cat, name, usd) {
        items.push({cat:cat,name:name,usd:usd});
        cats[cat] = (cats[cat]||0) + usd;
      }

      // Pre-departure
      add('Pre-Departure', 'Passport (new/renewal)', LOCAL_COSTS.passport);
      add('Pre-Departure', 'Police clearance', LOCAL_COSTS.police);
      add('Pre-Departure', 'Medical exam', LOCAL_COSTS.medical);
      if (needIelts) add('Pre-Departure', 'IELTS/PTE exam', LOCAL_COSTS.ielts);
      if (hasConsult) add('Pre-Departure', 'Immigration consultant', 1500);

      // Visa & Immigration
      add('Visa & Immigration', visa.name || 'Visa application', visa.fee);
      add('Visa & Immigration', 'Biometrics & processing', visa.processing);
      if (hasSpouse) add('Visa & Immigration', 'Spouse dependent visa', Math.round(visa.fee * 0.7));
      if (hasKids) add('Visa & Immigration', 'Child dependent visa (x1)', Math.round(visa.fee * 0.5));

      // Travel
      add('Travel', 'One-way flight', flight);
      if (hasSpouse) add('Travel', 'Spouse flight', flight);
      if (hasKids) add('Travel', 'Child flight', Math.round(flight * 0.75));
      add('Travel', 'Travel insurance', 120);
      add('Travel', 'Airport transfer + luggage', 80);

      // Settlement (first 3 months)
      add('Settlement', 'Rent deposit (' + (settle.deposit > settle.rent * 2 ? '3' : '2') + ' months)', settle.deposit);
      add('Settlement', 'First month rent', settle.rent);
      add('Settlement', 'Groceries & essentials (3mo)', settle.groceries * 3);
      add('Settlement', 'Transport (3 months)', settle.transport * 3);
      add('Settlement', 'Furnishing basics', 800);
      add('Settlement', 'SIM + internet setup', 80);
      if (hasSpouse) add('Settlement', 'Spouse extra living (3mo)', (settle.groceries + settle.transport) * 2);
      if (hasKids) add('Settlement', 'Child extra living (3mo)', settle.groceries * 2);

      var total = 0;
      items.forEach(function(it) { total += it.usd; });
      var localTotal = total * fx;

      document.getElementById(uid + '-usd').textContent = fmtUSD(total) + ' USD';
      document.getElementById(uid + '-local').textContent = sym + ' ' + Math.round(localTotal).toLocaleString() + ' ' + (CUR[origin]||'');

      // Build breakdown by category
      var catOrder = ['Pre-Departure','Visa & Immigration','Travel','Settlement'];
      var html = '';
      catOrder.forEach(function(cat) {
        if (!cats[cat]) return;
        var catColor = cat==='Pre-Departure'?'#f59e0b':cat==='Visa & Immigration'?'#ef4444':cat==='Travel'?'#3b82f6':'#10b981';
        html += '<div style="margin-bottom:12px;">' +
          '<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:2px solid ' + catColor + ';">' +
            '<span style="font-size:.72rem;font-weight:700;color:' + catColor + ';text-transform:uppercase;">' + cat + '</span>' +
            '<span style="font-size:.78rem;font-weight:800;color:' + text + ';">' + fmtUSD(cats[cat]) + '</span>' +
          '</div>';
        items.forEach(function(it) {
          if (it.cat !== cat) return;
          html += '<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid ' + border + ';">' +
            '<span style="font-size:.75rem;color:' + text + ';">' + it.name + '</span>' +
            '<span style="font-size:.75rem;font-weight:700;color:' + text + ';">' + fmtUSD(it.usd) + '</span></div>';
        });
        html += '</div>';
      });

      // Grand total bar
      html += '<div style="display:flex;justify-content:space-between;padding:10px 12px;background:' + accent + ';border-radius:8px;margin-top:6px;">' +
        '<span style="font-size:.82rem;font-weight:800;color:#fff;">TOTAL</span>' +
        '<span style="font-size:.95rem;font-weight:800;color:#fff;">' + fmtUSD(total) + '</span></div>';

      document.getElementById(uid + '-breakdown').innerHTML = html;
      document.getElementById(uid + '-results').style.display = 'block';
    }

    document.getElementById(uid + '-btn').addEventListener('click', calculate);
  };
})();
