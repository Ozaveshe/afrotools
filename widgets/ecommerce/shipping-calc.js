(function(){
  window.AfroWidgets = window.AfroWidgets || {};
  window.AfroWidgets.shippingCalc = function(container, opts) {
    opts = opts || {};
    var theme = opts.theme || 'light';
    var bg = theme === 'dark' ? '#1a1a2e' : '#fff';
    var text = theme === 'dark' ? '#e2e8f0' : '#0f1419';
    var muted = theme === 'dark' ? '#94a3b8' : '#64748b';
    var border = theme === 'dark' ? 'rgba(255,255,255,.12)' : '#e2e8f0';
    var inputBg = theme === 'dark' ? 'rgba(255,255,255,.06)' : '#f8fafc';
    var accent = opts.accent || '#007AFF';
    var uid = 'aw-sc2-' + Math.random().toString(36).slice(2,8);

    var CARRIERS = [
      {name:'DHL Express',domestic:15,intra:45,intl:65,perKg:8,time:{domestic:'1-2 days',intra:'3-5 days',intl:'3-5 days'}},
      {name:'FedEx',domestic:18,intra:50,intl:60,perKg:9,time:{domestic:'1-3 days',intra:'4-7 days',intl:'3-5 days'}},
      {name:'UPS',domestic:16,intra:48,intl:62,perKg:8.5,time:{domestic:'2-3 days',intra:'5-7 days',intl:'3-6 days'}},
      {name:'GIG Logistics',domestic:5,intra:30,intl:45,perKg:4,time:{domestic:'1-3 days',intra:'5-10 days',intl:'7-14 days'}},
      {name:'Sendy',domestic:3,intra:25,intl:0,perKg:2.5,time:{domestic:'1-2 days',intra:'3-7 days',intl:'N/A'}},
      {name:'The Courier Guy',domestic:6,intra:28,intl:40,perKg:5,time:{domestic:'1-3 days',intra:'5-10 days',intl:'7-14 days'}},
      {name:'Aramex',domestic:10,intra:35,intl:50,perKg:6,time:{domestic:'2-3 days',intra:'4-7 days',intl:'4-7 days'}},
      {name:'NIPOST / PostNet',domestic:2,intra:15,intl:25,perKg:2,time:{domestic:'3-7 days',intra:'10-21 days',intl:'14-30 days'}}
    ];

    var AFRICAN = ['NG','KE','ZA','GH','EG','TZ'];
    var COUNTRY_OPTS = [
      {v:'NG',l:'Nigeria'},{v:'KE',l:'Kenya'},{v:'ZA',l:'South Africa'},{v:'GH',l:'Ghana'},
      {v:'EG',l:'Egypt'},{v:'TZ',l:'Tanzania'},{v:'US',l:'United States'},{v:'UK',l:'United Kingdom'},
      {v:'CN',l:'China'},{v:'AE',l:'UAE'},{v:'DE',l:'Germany'},{v:'FR',l:'France'}
    ];

    var fieldStyle = 'width:100%;padding:9px 10px;border:1.5px solid ' + border + ';border-radius:7px;font-size:.9rem;font-weight:600;background:' + inputBg + ';color:' + text + ';outline:none;font-family:inherit;';
    var selOpts = COUNTRY_OPTS.map(function(c) { return '<option value="' + c.v + '">' + c.l + '</option>'; }).join('');

    container.innerHTML =
      '<div id="' + uid + '" style="font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',sans-serif;background:' + bg + ';color:' + text + ';border:1px solid ' + border + ';border-radius:12px;overflow:hidden;max-width:520px;">' +
        '<div style="padding:14px 18px;font-size:.85rem;font-weight:800;border-bottom:1px solid ' + border + ';">Shipping Cost Estimator</div>' +
        '<div style="padding:16px 18px;">' +
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px;">' +
            '<div><label style="font-size:.7rem;font-weight:700;color:' + muted + ';display:block;margin-bottom:4px;">Ship From</label><select id="' + uid + '-from" style="' + fieldStyle + '">' + selOpts + '</select></div>' +
            '<div><label style="font-size:.7rem;font-weight:700;color:' + muted + ';display:block;margin-bottom:4px;">Ship To</label><select id="' + uid + '-to" style="' + fieldStyle + '">' + selOpts + '</select></div>' +
          '</div>' +
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px;">' +
            '<div><label style="font-size:.7rem;font-weight:700;color:' + muted + ';display:block;margin-bottom:4px;">Weight (kg)</label><input type="number" id="' + uid + '-weight" value="5" min="0.1" step="0.1" style="' + fieldStyle + '"></div>' +
            '<div><label style="font-size:.7rem;font-weight:700;color:' + muted + ';display:block;margin-bottom:4px;">Package Type</label>' +
              '<select id="' + uid + '-pkg" style="' + fieldStyle + '"><option value="parcel">Parcel</option><option value="document">Document</option><option value="pallet">Pallet</option></select></div>' +
          '</div>' +
          '<div style="margin-bottom:12px;">' +
            '<label style="font-size:.7rem;font-weight:700;color:' + muted + ';display:block;margin-bottom:4px;">Dimensions (cm) - optional for volumetric weight</label>' +
            '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;">' +
              '<input type="number" id="' + uid + '-l" placeholder="L" min="0" style="' + fieldStyle + '">' +
              '<input type="number" id="' + uid + '-w" placeholder="W" min="0" style="' + fieldStyle + '">' +
              '<input type="number" id="' + uid + '-h" placeholder="H" min="0" style="' + fieldStyle + '">' +
            '</div>' +
          '</div>' +
          '<button id="' + uid + '-btn" style="width:100%;padding:11px;background:' + accent + ';color:#fff;border:none;border-radius:8px;font-size:.88rem;font-weight:700;cursor:pointer;">Compare Carriers</button>' +
          '<div id="' + uid + '-results" style="display:none;margin-top:14px;"></div>' +
        '</div>' +
        (opts.footerHTML ? '<div style="padding:10px 18px;border-top:1px solid ' + border + ';font-size:.72rem;color:' + muted + ';">' + opts.footerHTML + '</div>' : '') +
      '</div>';

    // Default to different countries
    document.getElementById(uid + '-to').value = 'UK';

    function calculate() {
      var from = document.getElementById(uid + '-from').value;
      var to = document.getElementById(uid + '-to').value;
      var weight = parseFloat(document.getElementById(uid + '-weight').value) || 1;
      var l = parseFloat(document.getElementById(uid + '-l').value) || 0;
      var w = parseFloat(document.getElementById(uid + '-w').value) || 0;
      var h = parseFloat(document.getElementById(uid + '-h').value) || 0;
      var pkgType = document.getElementById(uid + '-pkg').value;

      var volWeight = (l > 0 && w > 0 && h > 0) ? (l * w * h) / 5000 : 0;
      var chargeWeight = Math.max(weight, volWeight);
      var isDomestic = from === to;
      var isIntraAfrica = !isDomestic && AFRICAN.indexOf(from) !== -1 && AFRICAN.indexOf(to) !== -1;
      var isIntl = !isDomestic && !isIntraAfrica;

      var results = [];
      CARRIERS.forEach(function(c) {
        var base, time;
        if (isDomestic) { base = c.domestic; time = c.time.domestic; }
        else if (isIntraAfrica) { base = c.intra; time = c.time.intra; }
        else { base = c.intl; time = c.time.intl; }

        if (base === 0) return;

        var cost = base + (chargeWeight * c.perKg);
        if (pkgType === 'document') cost *= 0.6;
        if (pkgType === 'pallet') cost *= 3;
        cost = Math.round(cost * 100) / 100;

        results.push({name: c.name, cost: cost, time: time});
      });

      results.sort(function(a, b) { return a.cost - b.cost; });

      var routeType = isDomestic ? 'Domestic' : isIntraAfrica ? 'Intra-Africa' : 'International';
      var html = '<div style="font-size:.78rem;color:' + muted + ';margin-bottom:10px;">Charged weight: <strong style="color:' + text + ';">' + chargeWeight.toFixed(1) + ' kg</strong> (actual: ' + weight + 'kg' + (volWeight > 0 ? ', volumetric: ' + volWeight.toFixed(1) + 'kg' : '') + ') \u2014 ' + routeType + '</div>';

      results.forEach(function(r, i) {
        var isCheapest = i === 0 && results.length > 1;
        var cardBg = isCheapest ? (theme==='dark'?'rgba(0,122,255,.1)':'#eff6ff') : inputBg;
        var cardBorder = isCheapest ? '#007AFF' : border;
        html += '<div style="background:' + cardBg + ';border:1.5px solid ' + cardBorder + ';border-radius:8px;padding:12px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;">' +
          '<div><div style="font-size:.82rem;font-weight:700;color:' + text + ';">' + r.name + (isCheapest ? ' <span style="font-size:.62rem;background:#007AFF;color:#fff;padding:1px 6px;border-radius:3px;">CHEAPEST</span>' : '') + '</div>' +
          '<div style="font-size:.7rem;color:' + muted + ';">Est. delivery: ' + r.time + '</div></div>' +
          '<div style="text-align:right;"><div style="font-size:1.05rem;font-weight:800;color:' + accent + ';">$' + r.cost.toFixed(2) + '</div>' +
          '<div style="font-size:.62rem;color:' + muted + ';">USD estimate</div></div></div>';
      });

      if (results.length === 0) {
        html += '<div style="text-align:center;padding:16px;color:' + muted + ';font-size:.82rem;">No carriers available for this route.</div>';
      }

      document.getElementById(uid + '-results').innerHTML = html;
      document.getElementById(uid + '-results').style.display = 'block';
    }

    document.getElementById(uid + '-btn').addEventListener('click', calculate);
  };
})();
