(function(){
  window.AfroWidgets = window.AfroWidgets || {};
  window.AfroWidgets.importDuty = function(container, opts) {
    opts = opts || {};
    var theme = opts.theme || 'light';
    var bg = theme === 'dark' ? '#1a1a2e' : '#fff';
    var text = theme === 'dark' ? '#e2e8f0' : '#0f1419';
    var muted = theme === 'dark' ? '#94a3b8' : '#64748b';
    var border = theme === 'dark' ? 'rgba(255,255,255,.12)' : '#e2e8f0';
    var inputBg = theme === 'dark' ? 'rgba(255,255,255,.06)' : '#f8fafc';
    var accent = opts.accent || '#0ea5e9';
    var uid = 'aw-id-' + Math.random().toString(36).slice(2,8);

    var COUNTRIES = {
      Nigeria:{flag:'\uD83C\uDDF3\uD83C\uDDEC',sym:'\u20A6',rate:1600,vat:7.5,
        duties:{Electronics:15,Clothing:20,Vehicles:35,Food:20,Building:10,Machinery:10,Cosmetics:15,Pharmaceuticals:5},
        levies:function(cif,fob,duty){return [{name:'CISS (1% FOB)',amount:fob*0.01},{name:'ETLS (0.5% CIF)',amount:cif*0.005},{name:'Surcharge (7% duty)',amount:duty*0.07}];},
        vatBase:function(cif,duty,lev){return cif+duty+lev;}
      },
      Kenya:{flag:'\uD83C\uDDF0\uD83C\uDDEA',sym:'KES',rate:130,vat:16,
        duties:{Electronics:12,Clothing:25,Vehicles:25,Food:15,Building:10,Machinery:10,Cosmetics:20,Pharmaceuticals:0},
        levies:function(cif){return [{name:'IDF (3.5% CIF)',amount:cif*0.035},{name:'RDL (2.5% CIF)',amount:cif*0.025}];},
        vatBase:function(cif,duty,lev){return cif+duty+lev;}
      },
      'South Africa':{flag:'\uD83C\uDDFF\uD83C\uDDE6',sym:'R',rate:18.5,vat:15,
        duties:{Electronics:0,Clothing:45,Vehicles:25,Food:15,Building:5,Machinery:5,Cosmetics:20,Pharmaceuticals:0},
        levies:function(){return [];},
        vatBase:function(cif,duty,lev){return cif+duty+lev;}
      },
      Ghana:{flag:'\uD83C\uDDEC\uD83C\uDDED',sym:'GHS',rate:16,vat:18.5,
        duties:{Electronics:10,Clothing:20,Vehicles:30,Food:25,Building:10,Machinery:10,Cosmetics:20,Pharmaceuticals:5},
        levies:function(cif,fob,duty){return [{name:'NHIL (2.5%)',amount:(cif+duty)*0.025},{name:'GETFund (1%)',amount:(cif+duty)*0.01},{name:'ECOWAS (0.5%)',amount:cif*0.005}];},
        vatBase:function(cif,duty){return cif+duty;}
      },
      Tanzania:{flag:'\uD83C\uDDF9\uD83C\uDDFF',sym:'TZS',rate:2500,vat:18,
        duties:{Electronics:10,Clothing:25,Vehicles:25,Food:15,Building:10,Machinery:10,Cosmetics:20,Pharmaceuticals:0},
        levies:function(cif){return [{name:'RDL (1.5% CIF)',amount:cif*0.015}];},
        vatBase:function(cif,duty,lev){return cif+duty+lev;}
      },
      Uganda:{flag:'\uD83C\uDDFA\uD83C\uDDEC',sym:'UGX',rate:3800,vat:18,
        duties:{Electronics:10,Clothing:25,Vehicles:25,Food:15,Building:10,Machinery:10,Cosmetics:20,Pharmaceuticals:0},
        levies:function(){return [];},
        vatBase:function(cif,duty){return cif+duty;}
      },
      Ethiopia:{flag:'\uD83C\uDDEA\uD83C\uDDF9',sym:'ETB',rate:52,vat:15,
        duties:{Electronics:20,Clothing:35,Vehicles:40,Food:20,Building:15,Machinery:15,Cosmetics:25,Pharmaceuticals:5},
        levies:function(cif){return [{name:'WHT (3% CIF)',amount:cif*0.03}];},
        vatBase:function(cif,duty){return cif+duty;}
      },
      Egypt:{flag:'\uD83C\uDDEA\uD83C\uDDEC',sym:'EGP',rate:30,vat:14,
        duties:{Electronics:20,Clothing:30,Vehicles:40,Food:25,Building:15,Machinery:15,Cosmetics:25,Pharmaceuticals:5},
        levies:function(){return [];},
        vatBase:function(cif,duty){return cif+duty;}
      }
    };

    var CATEGORIES = ['Electronics','Clothing','Vehicles','Food','Building','Machinery','Cosmetics','Pharmaceuticals'];

    var fieldStyle = 'width:100%;padding:9px 10px;border:1.5px solid ' + border + ';border-radius:7px;font-size:.9rem;font-weight:600;background:' + inputBg + ';color:' + text + ';outline:none;font-family:inherit;';

    var countryOpts = '';
    for(var k in COUNTRIES) countryOpts += '<option value="' + k + '">' + COUNTRIES[k].flag + ' ' + k + '</option>';
    var catOpts = CATEGORIES.map(function(c) { return '<option value="' + c + '">' + c + '</option>'; }).join('');

    container.innerHTML =
      '<div id="' + uid + '" style="font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',sans-serif;background:' + bg + ';color:' + text + ';border:1px solid ' + border + ';border-radius:12px;overflow:hidden;max-width:520px;">' +
        '<div style="padding:14px 18px;font-size:.85rem;font-weight:800;border-bottom:1px solid ' + border + ';">Import Duty Calculator</div>' +
        '<div style="padding:16px 18px;">' +
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px;">' +
            '<div><label style="font-size:.7rem;font-weight:700;color:' + muted + ';display:block;margin-bottom:4px;">Destination Country</label><select id="' + uid + '-country" style="' + fieldStyle + '">' + countryOpts + '</select></div>' +
            '<div><label style="font-size:.7rem;font-weight:700;color:' + muted + ';display:block;margin-bottom:4px;">Product Category</label><select id="' + uid + '-cat" style="' + fieldStyle + '">' + catOpts + '</select></div>' +
          '</div>' +
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;">' +
            '<div><label style="font-size:.7rem;font-weight:700;color:' + muted + ';display:block;margin-bottom:4px;">Goods Value (USD)</label><input type="number" id="' + uid + '-fob" placeholder="e.g. 1000" style="' + fieldStyle + '"></div>' +
            '<div><label style="font-size:.7rem;font-weight:700;color:' + muted + ';display:block;margin-bottom:4px;">Shipping Cost (USD)</label><input type="number" id="' + uid + '-ship" value="100" style="' + fieldStyle + '"></div>' +
          '</div>' +
          '<button id="' + uid + '-btn" style="width:100%;padding:11px;background:' + accent + ';color:#fff;border:none;border-radius:8px;font-size:.88rem;font-weight:700;cursor:pointer;">Calculate Landed Cost</button>' +
          '<div id="' + uid + '-results" style="display:none;margin-top:16px;"></div>' +
        '</div>' +
        (opts.footerHTML ? '<div style="padding:10px 18px;border-top:1px solid ' + border + ';font-size:.72rem;color:' + muted + ';">' + opts.footerHTML + '</div>' : '') +
      '</div>';

    function fmtUSD(n) { return '$' + Math.round(n).toLocaleString(); }
    function fmtLocal(n, sym) { return sym + ' ' + Math.round(n).toLocaleString(); }

    function calculate() {
      var dest = container.querySelector('#' + uid + '-country').value;
      var cat = container.querySelector('#' + uid + '-cat').value;
      var fob = parseFloat(container.querySelector('#' + uid + '-fob').value) || 0;
      var ship = parseFloat(container.querySelector('#' + uid + '-ship').value) || 0;
      if (fob <= 0) { alert('Enter a goods value'); return; }

      var c = COUNTRIES[dest];
      if (!c) return;
      var cif = fob + ship;
      var dutyRate = (c.duties[cat] || 15) / 100;
      var duty = cif * dutyRate;
      var levyItems = c.levies(cif, fob, duty, cat);
      var totalLevies = 0;
      levyItems.forEach(function(l) { totalLevies += l.amount; });
      var vatBase = c.vatBase(cif, duty, totalLevies);
      var vat = vatBase * (c.vat / 100);
      var totalUSD = cif + duty + totalLevies + vat;
      var totalLocal = totalUSD * c.rate;

      var cardBg = theme==='dark'?'rgba(255,255,255,.04)':'linear-gradient(135deg,#0f172a,#1e293b)';
      var html = '<div style="background:' + cardBg + ';border-radius:10px;padding:20px;text-align:center;margin-bottom:12px;">' +
        '<div style="font-size:.65rem;color:rgba(255,255,255,.4);text-transform:uppercase;letter-spacing:.06em;">Total Landed Cost</div>' +
        '<div style="font-size:1.8rem;font-weight:800;color:#38bdf8;">' + fmtLocal(totalLocal, c.sym) + '</div>' +
        '<div style="font-size:.82rem;color:rgba(255,255,255,.5);">' + fmtUSD(totalUSD) + ' USD at 1 USD = ' + c.sym + ' ' + c.rate + '</div></div>';

      // Breakdown
      html += '<div style="font-size:.68rem;font-weight:700;color:' + muted + ';text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px;">Cost Breakdown (USD)</div>';
      var rows = [
        ['Goods Value (FOB)', fmtUSD(fob)],
        ['Shipping & Insurance', fmtUSD(ship)],
        ['CIF Total', fmtUSD(cif)],
      ];
      rows.forEach(function(r) {
        html += '<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid ' + border + ';font-size:.78rem;"><span style="color:' + text + ';">' + r[0] + '</span><span style="font-weight:700;">' + r[1] + '</span></div>';
      });

      html += '<div style="font-size:.68rem;font-weight:700;color:#ef4444;text-transform:uppercase;letter-spacing:.06em;margin:10px 0 6px;">Duties & Levies</div>';
      html += '<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid ' + border + ';font-size:.78rem;"><span style="color:' + text + ';">Customs Duty (' + (dutyRate*100).toFixed(0) + '%)</span><span style="font-weight:700;color:#ef4444;">' + fmtUSD(duty) + '</span></div>';
      levyItems.forEach(function(l) {
        html += '<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid ' + border + ';font-size:.78rem;"><span style="color:' + text + ';">' + l.name + '</span><span style="font-weight:700;color:#ef4444;">' + fmtUSD(l.amount) + '</span></div>';
      });
      html += '<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid ' + border + ';font-size:.78rem;"><span style="color:' + text + ';">VAT (' + c.vat + '%)</span><span style="font-weight:700;color:#ef4444;">' + fmtUSD(vat) + '</span></div>';

      html += '<div style="display:flex;justify-content:space-between;padding:10px 12px;background:' + accent + ';border-radius:8px;margin-top:10px;"><span style="font-size:.82rem;font-weight:800;color:#fff;">TOTAL LANDED COST</span><span style="font-size:.95rem;font-weight:800;color:#fff;">' + fmtUSD(totalUSD) + '</span></div>';

      container.querySelector('#' + uid + '-results').innerHTML = html;
      container.querySelector('#' + uid + '-results').style.display = 'block';
    }

    container.querySelector('#' + uid + '-btn').addEventListener('click', calculate);
    container.querySelector('#' + uid + '-fob').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') calculate();
    });
  };
})();
