(function(){
  window.AfroWidgets = window.AfroWidgets || {};
  window.AfroWidgets.publicHolidays = function(container, opts) {
    opts = opts || {};
    var theme = opts.theme || 'light';
    var bg = theme === 'dark' ? '#1a1a2e' : '#fff';
    var text = theme === 'dark' ? '#e2e8f0' : '#0f1419';
    var muted = theme === 'dark' ? '#94a3b8' : '#64748b';
    var border = theme === 'dark' ? 'rgba(255,255,255,.12)' : '#e2e8f0';
    var inputBg = theme === 'dark' ? 'rgba(255,255,255,.06)' : '#f8fafc';
    var accent = opts.accent || '#0071e3';
    var uid = 'aw-ph-' + Math.random().toString(36).slice(2,8);

    var HOLIDAYS = {
      NG:[
        {d:'2025-01-01',n:"New Year's Day"},{d:'2025-03-30',n:'Eid al-Fitr (est.)'},{d:'2025-03-31',n:'Eid al-Fitr Day 2'},
        {d:'2025-04-18',n:'Good Friday'},{d:'2025-04-21',n:'Easter Monday'},{d:'2025-05-01',n:"Workers' Day"},
        {d:'2025-06-06',n:'Eid al-Adha (est.)'},{d:'2025-06-07',n:'Eid al-Adha Day 2'},{d:'2025-06-12',n:'Democracy Day'},
        {d:'2025-09-05',n:'Eid al-Maulid (est.)'},{d:'2025-10-01',n:'Independence Day'},
        {d:'2025-12-25',n:'Christmas Day'},{d:'2025-12-26',n:'Boxing Day'}
      ],
      KE:[
        {d:'2025-01-01',n:"New Year's Day"},{d:'2025-03-30',n:'Eid al-Fitr (est.)'},{d:'2025-04-18',n:'Good Friday'},
        {d:'2025-04-21',n:'Easter Monday'},{d:'2025-05-01',n:'Labour Day'},{d:'2025-06-01',n:'Madaraka Day'},
        {d:'2025-06-06',n:'Eid al-Adha (est.)'},{d:'2025-10-10',n:'Huduma Day'},{d:'2025-10-20',n:'Mashujaa Day'},
        {d:'2025-12-12',n:'Jamhuri Day'},{d:'2025-12-25',n:'Christmas Day'},{d:'2025-12-26',n:'Boxing Day'}
      ],
      ZA:[
        {d:'2025-01-01',n:"New Year's Day"},{d:'2025-03-21',n:'Human Rights Day'},{d:'2025-04-18',n:'Good Friday'},
        {d:'2025-04-21',n:'Family Day'},{d:'2025-04-27',n:'Freedom Day'},{d:'2025-05-01',n:"Workers' Day"},
        {d:'2025-06-16',n:'Youth Day'},{d:'2025-08-09',n:"Women's Day"},{d:'2025-09-24',n:'Heritage Day'},
        {d:'2025-12-16',n:'Reconciliation'},{d:'2025-12-25',n:'Christmas Day'},{d:'2025-12-26',n:'Day of Goodwill'}
      ],
      GH:[
        {d:'2025-01-01',n:"New Year's Day"},{d:'2025-01-07',n:'Constitution Day'},{d:'2025-03-06',n:'Independence Day'},
        {d:'2025-03-30',n:'Eid al-Fitr (est.)'},{d:'2025-04-18',n:'Good Friday'},{d:'2025-04-21',n:'Easter Monday'},
        {d:'2025-05-01',n:'May Day'},{d:'2025-05-25',n:'Africa Day'},{d:'2025-06-06',n:'Eid al-Adha (est.)'},
        {d:'2025-07-01',n:'Republic Day'},{d:'2025-08-04',n:"Founders' Day"},{d:'2025-09-21',n:'Nkrumah Day'},
        {d:'2025-12-25',n:'Christmas Day'},{d:'2025-12-26',n:'Boxing Day'}
      ],
      EG:[
        {d:'2025-01-07',n:'Coptic Christmas'},{d:'2025-01-25',n:'Revolution Day'},{d:'2025-03-30',n:'Eid al-Fitr (est.)'},
        {d:'2025-04-20',n:'Coptic Easter'},{d:'2025-04-21',n:'Sham el-Nessim'},{d:'2025-04-25',n:'Sinai Liberation'},
        {d:'2025-05-01',n:'Labour Day'},{d:'2025-06-06',n:'Eid al-Adha (est.)'},{d:'2025-06-30',n:'June 30 Revolution'},
        {d:'2025-07-23',n:'Revolution Day'},{d:'2025-10-06',n:'Armed Forces Day'},{d:'2025-09-05',n:'Mawlid al-Nabi (est.)'}
      ],
      TZ:[
        {d:'2025-01-01',n:"New Year's Day"},{d:'2025-01-12',n:'Zanzibar Revolution'},{d:'2025-03-30',n:'Eid al-Fitr (est.)'},
        {d:'2025-04-07',n:'Karume Day'},{d:'2025-04-18',n:'Good Friday'},{d:'2025-04-21',n:'Easter Monday'},
        {d:'2025-04-26',n:'Union Day'},{d:'2025-05-01',n:"Workers' Day"},{d:'2025-06-06',n:'Eid al-Adha (est.)'},
        {d:'2025-07-07',n:'Saba Saba'},{d:'2025-08-08',n:'Nane Nane'},{d:'2025-09-05',n:'Maulid (est.)'},
        {d:'2025-12-09',n:'Independence Day'},{d:'2025-12-25',n:'Christmas Day'},{d:'2025-12-26',n:'Boxing Day'}
      ]
    };

    var NAMES = {NG:'Nigeria',KE:'Kenya',ZA:'South Africa',GH:'Ghana',EG:'Egypt',TZ:'Tanzania'};
    var DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    var fieldStyle = 'width:100%;padding:9px 10px;border:1.5px solid ' + border + ';border-radius:7px;font-size:.9rem;font-weight:600;background:' + inputBg + ';color:' + text + ';outline:none;font-family:inherit;';

    container.innerHTML =
      '<div id="' + uid + '" style="font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',sans-serif;background:' + bg + ';color:' + text + ';border:1px solid ' + border + ';border-radius:12px;overflow:hidden;max-width:520px;">' +
        '<div style="padding:14px 18px;font-size:.85rem;font-weight:800;border-bottom:1px solid ' + border + ';">Public Holidays 2025</div>' +
        '<div style="padding:16px 18px;">' +
          '<div style="margin-bottom:12px;"><label style="font-size:.7rem;font-weight:700;color:' + muted + ';display:block;margin-bottom:4px;">Country</label>' +
            '<select id="' + uid + '-country" style="' + fieldStyle + '">' +
              '<option value="NG">Nigeria</option><option value="KE">Kenya</option><option value="ZA">South Africa</option><option value="GH">Ghana</option><option value="EG">Egypt</option><option value="TZ">Tanzania</option>' +
            '</select>' +
          '</div>' +
          '<div id="' + uid + '-countdown" style="text-align:center;padding:16px;background:' + (theme==='dark'?'rgba(255,255,255,.04)':'linear-gradient(135deg,#0f172a,#1e293b)') + ';border-radius:10px;margin-bottom:14px;">' +
            '<div id="' + uid + '-cdNum" style="font-size:2.2rem;font-weight:800;color:#38bdf8;">--</div>' +
            '<div style="font-size:.65rem;color:rgba(255,255,255,.4);text-transform:uppercase;letter-spacing:.06em;">Days Until Next Holiday</div>' +
            '<div id="' + uid + '-cdName" style="font-size:.82rem;color:rgba(255,255,255,.7);margin-top:4px;"></div>' +
          '</div>' +
          '<div id="' + uid + '-summary" style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:14px;"></div>' +
          '<div id="' + uid + '-list" style="max-height:300px;overflow-y:auto;"></div>' +
        '</div>' +
        (opts.footerHTML ? '<div style="padding:10px 18px;border-top:1px solid ' + border + ';font-size:.72rem;color:' + muted + ';">' + opts.footerHTML + '</div>' : '') +
      '</div>';

    function render() {
      var country = document.getElementById(uid + '-country').value;
      var holidays = HOLIDAYS[country] || [];
      var today = new Date(); today.setHours(0,0,0,0);

      var nextH = null;
      for (var i = 0; i < holidays.length; i++) {
        var hd = new Date(holidays[i].d + 'T00:00:00');
        if (hd >= today) { nextH = {name: holidays[i].n, date: hd}; break; }
      }

      if (nextH) {
        var daysUntil = Math.ceil((nextH.date - today) / 86400000);
        document.getElementById(uid + '-cdNum').textContent = daysUntil;
        document.getElementById(uid + '-cdName').textContent = nextH.name + ' \u2014 ' + nextH.date.toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long'});
      } else {
        document.getElementById(uid + '-cdNum').textContent = '--';
        document.getElementById(uid + '-cdName').textContent = 'All holidays have passed';
      }

      var total = holidays.length;
      var remaining = 0, weekendH = 0;
      holidays.forEach(function(h) {
        var hd = new Date(h.d + 'T00:00:00');
        if (hd >= today) remaining++;
        var dow = hd.getDay();
        if (dow === 0 || dow === 6) weekendH++;
      });

      var boxStyle = 'background:' + inputBg + ';border:1px solid ' + border + ';border-radius:6px;padding:10px;text-align:center;';
      var numStyle = 'font-size:1.3rem;font-weight:800;color:' + accent + ';';
      var lblStyle = 'font-size:.6rem;font-weight:700;color:' + muted + ';text-transform:uppercase;';
      document.getElementById(uid + '-summary').innerHTML =
        '<div style="' + boxStyle + '"><div style="' + numStyle + '">' + total + '</div><div style="' + lblStyle + '">Total</div></div>' +
        '<div style="' + boxStyle + '"><div style="' + numStyle + '">' + remaining + '</div><div style="' + lblStyle + '">Remaining</div></div>' +
        '<div style="' + boxStyle + '"><div style="' + numStyle + '">' + weekendH + '</div><div style="' + lblStyle + '">On Weekend</div></div>';

      var listHtml = '';
      holidays.forEach(function(h) {
        var hd = new Date(h.d + 'T00:00:00');
        var isPast = hd < today;
        var isNext = nextH && h.d === nextH.date.toISOString().split('T')[0];
        var dow = hd.getDay();
        var isWE = dow === 0 || dow === 6;
        var dateStr = hd.toLocaleDateString('en-GB',{day:'numeric',month:'short'});
        var statusColor = isPast ? muted : '#007AFF';
        var statusText = isPast ? 'Passed' : isNext ? 'Next Up' : 'Upcoming';
        var dayBg = isWE ? (theme==='dark'?'rgba(239,68,68,.15)':'#fef2f2') : (theme==='dark'?'rgba(0,122,255,.15)':'#eff6ff');
        var dayColor = isWE ? '#ef4444' : '#007AFF';

        listHtml += '<div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid ' + border + ';opacity:' + (isPast?'.5':'1') + ';">' +
          '<div><div style="font-size:.8rem;font-weight:600;color:' + text + ';">' + h.n + '</div>' +
          '<div style="font-size:.68rem;color:' + muted + ';">' + dateStr + ' <span style="display:inline-block;padding:1px 6px;border-radius:3px;background:' + dayBg + ';color:' + dayColor + ';font-size:.62rem;font-weight:700;">' + DAYS[dow] + '</span></div></div>' +
          '<span style="font-size:.65rem;font-weight:700;color:' + statusColor + ';">' + statusText + '</span></div>';
      });
      document.getElementById(uid + '-list').innerHTML = listHtml;
    }

    document.getElementById(uid + '-country').addEventListener('change', render);
    render();
  };
})();
