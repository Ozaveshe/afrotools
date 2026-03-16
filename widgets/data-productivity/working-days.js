(function(){
  window.AfroWidgets = window.AfroWidgets || {};
  window.AfroWidgets.workingDays = function(container, opts) {
    opts = opts || {};
    var theme = opts.theme || 'light';
    var bg = theme === 'dark' ? '#1a1a2e' : '#fff';
    var text = theme === 'dark' ? '#e2e8f0' : '#0f1419';
    var muted = theme === 'dark' ? '#94a3b8' : '#64748b';
    var border = theme === 'dark' ? 'rgba(255,255,255,.12)' : '#e2e8f0';
    var inputBg = theme === 'dark' ? 'rgba(255,255,255,.06)' : '#f8fafc';
    var accent = opts.accent || '#0071e3';
    var uid = 'aw-wd-' + Math.random().toString(36).slice(2,8);

    var HOLIDAYS = {
      ng:[{m:1,d:1,n:'New Year\'s Day'},{m:1,d:2,n:'New Year Holiday'},{m:3,d:21,n:'Eid al-Fitr (approx)'},{m:3,d:22,n:'Eid al-Fitr Day 2'},{m:5,d:1,n:'Workers\' Day'},{m:5,d:27,n:'Children\'s Day'},{m:5,d:28,n:'Eid al-Adha (approx)'},{m:6,d:12,n:'Democracy Day'},{m:10,d:1,n:'Independence Day'},{m:12,d:25,n:'Christmas Day'},{m:12,d:26,n:'Boxing Day'}],
      ke:[{m:1,d:1,n:'New Year\'s Day'},{m:4,d:3,n:'Good Friday'},{m:4,d:6,n:'Easter Monday'},{m:5,d:1,n:'Labour Day'},{m:6,d:1,n:'Madaraka Day'},{m:10,d:10,n:'Huduma Day'},{m:10,d:20,n:'Mashujaa Day'},{m:12,d:12,n:'Jamhuri Day'},{m:12,d:25,n:'Christmas'},{m:12,d:26,n:'Boxing Day'}],
      za:[{m:1,d:1,n:'New Year\'s Day'},{m:3,d:21,n:'Human Rights Day'},{m:4,d:3,n:'Good Friday'},{m:4,d:6,n:'Family Day'},{m:4,d:27,n:'Freedom Day'},{m:5,d:1,n:'Workers\' Day'},{m:6,d:16,n:'Youth Day'},{m:8,d:9,n:'Women\'s Day'},{m:9,d:24,n:'Heritage Day'},{m:12,d:16,n:'Reconciliation'},{m:12,d:25,n:'Christmas'},{m:12,d:26,n:'Goodwill Day'}],
      gh:[{m:1,d:1,n:'New Year\'s Day'},{m:1,d:7,n:'Constitution Day'},{m:3,d:6,n:'Independence Day'},{m:4,d:3,n:'Good Friday'},{m:4,d:6,n:'Easter Monday'},{m:5,d:1,n:'May Day'},{m:5,d:25,n:'Africa Day'},{m:7,d:1,n:'Republic Day'},{m:8,d:4,n:'Founders\' Day'},{m:9,d:21,n:'Nkrumah Day'},{m:12,d:1,n:'Farmers\' Day'},{m:12,d:25,n:'Christmas'},{m:12,d:26,n:'Boxing Day'}],
      none:[]
    };

    var fieldStyle = 'width:100%;padding:9px 10px;border:1.5px solid ' + border + ';border-radius:7px;font-size:.9rem;font-weight:600;background:' + inputBg + ';color:' + text + ';outline:none;font-family:inherit;';

    var today = new Date();
    var future = new Date(); future.setMonth(future.getMonth() + 3);
    var todayStr = today.toISOString().split('T')[0];
    var futureStr = future.toISOString().split('T')[0];

    container.innerHTML =
      '<div id="' + uid + '" style="font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',sans-serif;background:' + bg + ';color:' + text + ';border:1px solid ' + border + ';border-radius:12px;overflow:hidden;max-width:480px;">' +
        '<div style="padding:14px 18px;font-size:.85rem;font-weight:800;border-bottom:1px solid ' + border + ';">Working Days Calculator</div>' +
        '<div style="padding:16px 18px;">' +
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;">' +
            '<div><label style="font-size:.7rem;font-weight:700;color:' + muted + ';display:block;margin-bottom:4px;">Start Date</label><input type="date" id="' + uid + '-start" value="' + todayStr + '" style="' + fieldStyle + '"></div>' +
            '<div><label style="font-size:.7rem;font-weight:700;color:' + muted + ';display:block;margin-bottom:4px;">End Date</label><input type="date" id="' + uid + '-end" value="' + futureStr + '" style="' + fieldStyle + '"></div>' +
          '</div>' +
          '<div style="margin-bottom:12px;"><label style="font-size:.7rem;font-weight:700;color:' + muted + ';display:block;margin-bottom:4px;">Country (for public holidays)</label>' +
            '<select id="' + uid + '-country" style="' + fieldStyle + '">' +
              '<option value="ng">Nigeria</option><option value="ke">Kenya</option><option value="za">South Africa</option><option value="gh">Ghana</option><option value="none">No holidays (weekends only)</option>' +
            '</select>' +
          '</div>' +
          '<button id="' + uid + '-btn" style="width:100%;padding:11px;background:' + accent + ';color:#fff;border:none;border-radius:8px;font-size:.88rem;font-weight:700;cursor:pointer;">Calculate</button>' +
          '<div id="' + uid + '-results" style="display:none;margin-top:16px;background:' + (theme==='dark'?'rgba(255,255,255,.04)':'linear-gradient(135deg,#0f172a,#1e293b)') + ';border-radius:10px;padding:22px;text-align:center;">' +
            '<div style="font-size:.68rem;font-weight:700;color:rgba(255,255,255,.4);text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px;">Working Days</div>' +
            '<div id="' + uid + '-work" style="font-size:2.6rem;font-weight:800;color:#38bdf8;line-height:1;">0</div>' +
            '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:14px;">' +
              '<div style="padding:10px;background:rgba(255,255,255,.06);border-radius:6px;"><div style="font-size:.58rem;font-weight:600;color:rgba(255,255,255,.35);text-transform:uppercase;margin-bottom:2px;">Calendar</div><div id="' + uid + '-cal" style="font-size:1.1rem;font-weight:800;color:#fff;">0</div></div>' +
              '<div style="padding:10px;background:rgba(255,255,255,.06);border-radius:6px;"><div style="font-size:.58rem;font-weight:600;color:rgba(255,255,255,.35);text-transform:uppercase;margin-bottom:2px;">Weekends</div><div id="' + uid + '-we" style="font-size:1.1rem;font-weight:800;color:#fff;">0</div></div>' +
              '<div style="padding:10px;background:rgba(255,255,255,.06);border-radius:6px;"><div style="font-size:.58rem;font-weight:600;color:rgba(255,255,255,.35);text-transform:uppercase;margin-bottom:2px;">Holidays</div><div id="' + uid + '-hol" style="font-size:1.1rem;font-weight:800;color:#fff;">0</div></div>' +
            '</div>' +
          '</div>' +
          '<div id="' + uid + '-holList" style="margin-top:10px;"></div>' +
        '</div>' +
        (opts.footerHTML ? '<div style="padding:10px 18px;border-top:1px solid ' + border + ';font-size:.72rem;color:' + muted + ';">' + opts.footerHTML + '</div>' : '') +
      '</div>';

    function getHolidayDates(country, year) {
      var hols = HOLIDAYS[country] || [];
      return hols.map(function(h) { return {date: new Date(year, h.m - 1, h.d), name: h.n}; });
    }

    function calculate() {
      var startStr = document.getElementById(uid + '-start').value;
      var endStr = document.getElementById(uid + '-end').value;
      var country = document.getElementById(uid + '-country').value;
      if (!startStr || !endStr) { alert('Please select both dates'); return; }
      var start = new Date(startStr + 'T00:00:00');
      var end = new Date(endStr + 'T00:00:00');
      if (start > end) { alert('Start date must be before end date'); return; }

      var holidays = [];
      for (var y = start.getFullYear(); y <= end.getFullYear(); y++) {
        holidays = holidays.concat(getHolidayDates(country, y));
      }

      var calDays = 0, weekendDays = 0, holDays = 0, workDays = 0;
      var matchedHols = [];
      var d = new Date(start);

      while (d <= end) {
        calDays++;
        var dow = d.getDay();
        if (dow === 0 || dow === 6) {
          weekendDays++;
        } else {
          var isHol = false;
          for (var i = 0; i < holidays.length; i++) {
            if (holidays[i].date.getTime() === d.getTime()) {
              isHol = true;
              matchedHols.push({date: new Date(d), name: holidays[i].name});
              break;
            }
          }
          if (isHol) holDays++; else workDays++;
        }
        d.setDate(d.getDate() + 1);
      }

      document.getElementById(uid + '-work').textContent = workDays;
      document.getElementById(uid + '-cal').textContent = calDays;
      document.getElementById(uid + '-we').textContent = weekendDays;
      document.getElementById(uid + '-hol').textContent = holDays;
      document.getElementById(uid + '-results').style.display = 'block';

      var holList = document.getElementById(uid + '-holList');
      if (matchedHols.length > 0) {
        holList.innerHTML = '<div style="font-size:.68rem;font-weight:700;color:' + muted + ';text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px;">Public Holidays in Range</div>' +
          matchedHols.map(function(h) {
            return '<div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid ' + border + ';font-size:.75rem;"><span style="font-weight:600;color:' + text + ';">' + h.name + '</span><span style="color:' + muted + ';">' + h.date.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}) + '</span></div>';
          }).join('');
      } else {
        holList.innerHTML = '';
      }
    }

    document.getElementById(uid + '-btn').addEventListener('click', calculate);
    calculate();
  };
})();
