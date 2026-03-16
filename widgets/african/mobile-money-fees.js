(function(){
  window.AfroWidgets = window.AfroWidgets || {};
  window.AfroWidgets.mobileMoneyFees = function(container, opts) {
    opts = opts || {};
    var theme = opts.theme || 'light';
    var bg = theme === 'dark' ? '#1a1a2e' : '#fff';
    var text = theme === 'dark' ? '#e2e8f0' : '#0f1419';
    var muted = theme === 'dark' ? '#94a3b8' : '#64748b';
    var border = theme === 'dark' ? 'rgba(255,255,255,.12)' : '#e2e8f0';
    var inputBg = theme === 'dark' ? 'rgba(255,255,255,.06)' : '#f8fafc';
    var accent = opts.accent || '#0071e3';
    var uid = 'aw-mmf-' + Math.random().toString(36).slice(2,8);

    var PROVIDERS = {
      mpesa:{name:'M-Pesa',color:'#007AFF'},
      mtnmomo:{name:'MTN MoMo',color:'#FFCC00'},
      airtel:{name:'Airtel Money',color:'#ED1C24'},
      orange:{name:'Orange Money',color:'#FF6600'},
      wave:{name:'Wave',color:'#1AC8FF'},
      opay:{name:'OPay',color:'#2563EB'}
    };

    var FEE_TABLES = {
      KE:{sym:'KSh',name:'Kenya',
        mpesa:{send:[[100,0,0],[500,7,0],[1000,13,0],[2500,33,0],[5000,57,0],[10000,90,0],[20000,105,0],[50000,108,0],[300000,108,0]],withdraw:[[100,0,0],[500,11,0],[1000,29,0],[5000,69,0],[10000,115,0],[20000,185,0],[50000,278,0],[300000,309,0]],pay:[[Infinity,0,0]]},
        airtel:{send:[[500,5,0],[1000,10,0],[5000,45,0],[10000,75,0],[300000,0,0.003]],withdraw:[[500,15,0],[1000,28,0],[5000,62,0],[10000,100,0],[300000,0,0.006]],pay:[[Infinity,0,0]]}
      },
      NG:{sym:'\u20A6',name:'Nigeria',
        mtnmomo:{send:[[1000,10,0],[5000,25,0],[10000,50,0],[Infinity,0,0.005]],withdraw:[[1000,50,0],[5000,100,0],[10000,150,0],[Infinity,0,0.015]],pay:[[Infinity,0,0]]},
        opay:{send:[[1000,10,0],[5000,20,0],[10000,35,0],[Infinity,0,0.004]],withdraw:[[5000,52.5,0],[10000,52.5,0],[20000,105,0],[Infinity,0,0.015]],pay:[[Infinity,0,0]]},
        airtel:{send:[[1000,10,0],[5000,25,0],[10000,45,0],[Infinity,0,0.005]],withdraw:[[1000,50,0],[5000,100,0],[10000,150,0],[Infinity,0,0.015]],pay:[[Infinity,0,0]]}
      },
      GH:{sym:'\u20B5',name:'Ghana',
        mtnmomo:{send:[[50,0.5,0],[200,1,0],[500,1.5,0],[1000,3,0],[5000,8,0],[Infinity,0,0.003]],withdraw:[[50,0.5,0],[200,1.5,0],[500,3.5,0],[1000,4.5,0],[5000,9,0],[Infinity,0,0.0065]],pay:[[Infinity,0,0]]},
        airtel:{send:[[50,0.5,0],[200,1,0],[500,2,0],[1000,4,0],[Infinity,0,0.004]],withdraw:[[50,0.7,0],[200,1.5,0],[500,3.5,0],[1000,4.5,0],[Infinity,0,0.007]],pay:[[Infinity,0,0]]}
      },
      UG:{sym:'USh',name:'Uganda',
        mtnmomo:{send:[[2500,250,0],[5000,250,0],[15000,375,0],[30000,500,0],[60000,750,0],[Infinity,0,0.006]],withdraw:[[2500,750,0],[5000,750,0],[15000,1500,0],[30000,2000,0],[60000,2500,0],[Infinity,0,0.022]],pay:[[Infinity,0,0]]},
        airtel:{send:[[2500,250,0],[5000,250,0],[15000,350,0],[30000,500,0],[Infinity,0,0.006]],withdraw:[[2500,700,0],[5000,700,0],[15000,1400,0],[30000,1800,0],[Infinity,0,0.021]],pay:[[Infinity,0,0]]}
      },
      TZ:{sym:'TSh',name:'Tanzania',
        mpesa:{send:[[1000,0,0],[5000,500,0],[10000,650,0],[20000,900,0],[Infinity,0,0.0125]],withdraw:[[1000,350,0],[5000,800,0],[10000,1200,0],[20000,1600,0],[Infinity,0,0.017]],pay:[[Infinity,0,0]]},
        airtel:{send:[[1000,0,0],[5000,450,0],[10000,600,0],[Infinity,0,0.012]],withdraw:[[1000,350,0],[5000,750,0],[10000,1100,0],[Infinity,0,0.016]],pay:[[Infinity,0,0]]}
      },
      SN:{sym:'CFA',name:'Senegal',
        orange:{send:[[500,50,0],[2000,100,0],[10000,200,0],[Infinity,0,0.007]],withdraw:[[500,100,0],[2000,200,0],[10000,500,0],[Infinity,0,0.02]],pay:[[Infinity,0,0]]},
        wave:{send:[[Infinity,0,0.01]],withdraw:[[Infinity,0,0.01]],pay:[[Infinity,0,0]]}
      }
    };

    var fieldStyle = 'width:100%;padding:9px 10px;border:1.5px solid ' + border + ';border-radius:7px;font-size:.9rem;font-weight:600;background:' + inputBg + ';color:' + text + ';outline:none;font-family:inherit;';

    container.innerHTML =
      '<div id="' + uid + '" style="font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',sans-serif;background:' + bg + ';color:' + text + ';border:1px solid ' + border + ';border-radius:12px;overflow:hidden;max-width:520px;">' +
        '<div style="padding:14px 18px;font-size:.85rem;font-weight:800;border-bottom:1px solid ' + border + ';">Mobile Money Fee Checker</div>' +
        '<div style="padding:16px 18px;">' +
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;">' +
            '<div><label style="font-size:.7rem;font-weight:700;color:' + muted + ';display:block;margin-bottom:4px;">Country</label>' +
              '<select id="' + uid + '-country" style="' + fieldStyle + '"></select></div>' +
            '<div><label style="font-size:.7rem;font-weight:700;color:' + muted + ';display:block;margin-bottom:4px;">Amount</label>' +
              '<input type="number" id="' + uid + '-amount" value="5000" min="1" style="' + fieldStyle + '"></div>' +
          '</div>' +
          '<div style="margin-bottom:12px;"><label style="font-size:.7rem;font-weight:700;color:' + muted + ';display:block;margin-bottom:4px;">Transaction Type</label>' +
            '<select id="' + uid + '-type" style="' + fieldStyle + '">' +
              '<option value="send">Send Money</option><option value="withdraw">Withdraw Cash</option><option value="pay">Pay Merchant</option>' +
            '</select></div>' +
          '<button id="' + uid + '-btn" style="width:100%;padding:11px;background:' + accent + ';color:#fff;border:none;border-radius:8px;font-size:.88rem;font-weight:700;cursor:pointer;">Compare Fees</button>' +
          '<div id="' + uid + '-results" style="display:none;margin-top:14px;"></div>' +
        '</div>' +
        (opts.footerHTML ? '<div style="padding:10px 18px;border-top:1px solid ' + border + ';font-size:.72rem;color:' + muted + ';">' + opts.footerHTML + '</div>' : '') +
      '</div>';

    // Populate countries
    var countrySel = document.getElementById(uid + '-country');
    var keys = Object.keys(FEE_TABLES);
    keys.forEach(function(k) {
      var o = document.createElement('option');
      o.value = k; o.textContent = FEE_TABLES[k].name;
      countrySel.appendChild(o);
    });

    function getFee(tiers, amount) {
      for (var i = 0; i < tiers.length; i++) {
        if (amount <= tiers[i][0]) {
          return Math.max(tiers[i][1], amount * tiers[i][2]);
        }
      }
      var last = tiers[tiers.length - 1];
      return Math.max(last[1], amount * last[2]);
    }

    function calculate() {
      var country = countrySel.value;
      var amount = parseFloat(document.getElementById(uid + '-amount').value) || 0;
      var txType = document.getElementById(uid + '-type').value;
      var data = FEE_TABLES[country];
      if (!data || amount <= 0) return;

      var results = [];
      var providerKeys = Object.keys(data);
      providerKeys.forEach(function(pk) {
        if (pk === 'sym' || pk === 'name') return;
        var prov = PROVIDERS[pk];
        if (!prov) return;
        var tiers = data[pk][txType];
        if (!tiers) return;
        var fee = getFee(tiers, amount);
        results.push({name: prov.name, color: prov.color, fee: fee, pct: (fee / amount * 100)});
      });

      results.sort(function(a, b) { return a.fee - b.fee; });

      var html = '';
      results.forEach(function(r, i) {
        var isBest = i === 0 && results.length > 1;
        var cardBg = isBest ? (theme==='dark'?'rgba(34,197,94,.1)':'#f0fdf4') : inputBg;
        var cardBorder = isBest ? '#22c55e' : border;
        html += '<div style="background:' + cardBg + ';border:1.5px solid ' + cardBorder + ';border-radius:8px;padding:12px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;">' +
          '<div><div style="font-size:.82rem;font-weight:700;color:' + text + ';">' +
            '<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:' + r.color + ';margin-right:6px;"></span>' +
            r.name + (isBest ? ' <span style="font-size:.62rem;background:#22c55e;color:#fff;padding:1px 6px;border-radius:3px;font-weight:700;">CHEAPEST</span>' : '') +
          '</div></div>' +
          '<div style="text-align:right;"><div style="font-size:1rem;font-weight:800;color:' + accent + ';">' + data.sym + ' ' + r.fee.toLocaleString('en',{minimumFractionDigits:2,maximumFractionDigits:2}) + '</div>' +
          '<div style="font-size:.65rem;color:' + muted + ';">' + r.pct.toFixed(2) + '% of amount</div></div></div>';
      });

      if (results.length === 0) {
        html = '<div style="text-align:center;color:' + muted + ';font-size:.82rem;padding:16px;">No providers found for this country.</div>';
      }

      document.getElementById(uid + '-results').innerHTML = html;
      document.getElementById(uid + '-results').style.display = 'block';
    }

    document.getElementById(uid + '-btn').addEventListener('click', calculate);
    calculate();
  };
})();
