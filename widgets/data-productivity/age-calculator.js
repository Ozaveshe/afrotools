(function(){
  window.AfroWidgets = window.AfroWidgets || {};
  window.AfroWidgets.ageCalculator = function(container, opts) {
    opts = opts || {};
    var theme = opts.theme || 'light';
    var bg = theme === 'dark' ? '#1a1a2e' : '#fff';
    var text = theme === 'dark' ? '#e2e8f0' : '#0f1419';
    var muted = theme === 'dark' ? '#94a3b8' : '#64748b';
    var border = theme === 'dark' ? 'rgba(255,255,255,.12)' : '#e2e8f0';
    var inputBg = theme === 'dark' ? 'rgba(255,255,255,.06)' : '#f8fafc';
    var accent = opts.accent || '#0071e3';
    var uid = 'aw-age-' + Math.random().toString(36).slice(2,8);

    container.innerHTML =
      '<div id="' + uid + '" style="font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',sans-serif;background:' + bg + ';color:' + text + ';border:1px solid ' + border + ';border-radius:12px;overflow:hidden;max-width:480px;">' +
        '<div style="padding:14px 18px;font-size:.85rem;font-weight:800;border-bottom:1px solid ' + border + ';">Age Calculator</div>' +
        '<div style="padding:16px 18px;">' +
          '<div style="margin-bottom:12px;">' +
            '<label style="font-size:.7rem;font-weight:700;color:' + muted + ';display:block;margin-bottom:4px;">Date of Birth</label>' +
            '<input type="date" id="' + uid + '-dob" value="1995-06-15" style="width:100%;padding:9px 10px;border:1.5px solid ' + border + ';border-radius:7px;font-size:.9rem;font-weight:600;background:' + inputBg + ';color:' + text + ';outline:none;">' +
          '</div>' +
          '<div style="margin-bottom:12px;">' +
            '<label style="font-size:.7rem;font-weight:700;color:' + muted + ';display:block;margin-bottom:4px;">Calculate At (default: today)</label>' +
            '<input type="date" id="' + uid + '-at" style="width:100%;padding:9px 10px;border:1.5px solid ' + border + ';border-radius:7px;font-size:.9rem;font-weight:600;background:' + inputBg + ';color:' + text + ';outline:none;">' +
          '</div>' +
          '<button id="' + uid + '-btn" style="width:100%;padding:11px;background:' + accent + ';color:#fff;border:none;border-radius:8px;font-size:.88rem;font-weight:700;cursor:pointer;">Calculate Age</button>' +
          '<div id="' + uid + '-results" style="display:none;margin-top:16px;">' +
            '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;">' +
              '<div style="background:' + inputBg + ';border:1px solid ' + border + ';border-radius:8px;padding:12px;text-align:center;"><div id="' + uid + '-yrs" style="font-size:1.6rem;font-weight:800;color:' + accent + ';">0</div><div style="font-size:.6rem;font-weight:700;color:' + muted + ';text-transform:uppercase;">Years</div></div>' +
              '<div style="background:' + inputBg + ';border:1px solid ' + border + ';border-radius:8px;padding:12px;text-align:center;"><div id="' + uid + '-mos" style="font-size:1.6rem;font-weight:800;color:' + accent + ';">0</div><div style="font-size:.6rem;font-weight:700;color:' + muted + ';text-transform:uppercase;">Months</div></div>' +
              '<div style="background:' + inputBg + ';border:1px solid ' + border + ';border-radius:8px;padding:12px;text-align:center;"><div id="' + uid + '-dys" style="font-size:1.6rem;font-weight:800;color:' + accent + ';">0</div><div style="font-size:.6rem;font-weight:700;color:' + muted + ';text-transform:uppercase;">Days</div></div>' +
            '</div>' +
            '<div id="' + uid + '-details" style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:10px;"></div>' +
            '<div id="' + uid + '-bday" style="display:none;background:#fef3c7;border:1px solid #f59e0b;border-radius:8px;padding:10px;text-align:center;font-size:.82rem;font-weight:700;color:#92400e;margin-top:10px;"></div>' +
          '</div>' +
        '</div>' +
        (opts.footerHTML ? '<div style="padding:10px 18px;border-top:1px solid ' + border + ';font-size:.72rem;color:' + muted + ';">' + opts.footerHTML + '</div>' : '') +
      '</div>';

    var root = document.getElementById(uid);
    var dobEl = document.getElementById(uid + '-dob');
    var atEl = document.getElementById(uid + '-at');
    var btn = document.getElementById(uid + '-btn');
    var results = document.getElementById(uid + '-results');

    atEl.value = new Date().toISOString().split('T')[0];

    function detailBox(label, val) {
      return '<div style="background:' + inputBg + ';border:1px solid ' + border + ';border-radius:6px;padding:8px;">' +
        '<div style="font-size:.6rem;font-weight:700;color:' + muted + ';text-transform:uppercase;">' + label + '</div>' +
        '<div style="font-size:.88rem;font-weight:800;color:' + text + ';margin-top:2px;">' + val + '</div></div>';
    }

    function calculate() {
      var dobStr = dobEl.value;
      var atStr = atEl.value;
      if (!dobStr) return;
      var dob = new Date(dobStr + 'T00:00:00');
      var now = atStr ? new Date(atStr + 'T00:00:00') : new Date();
      if (dob > now) { alert('Date of birth cannot be in the future'); return; }

      var years = now.getFullYear() - dob.getFullYear();
      var months = now.getMonth() - dob.getMonth();
      var days = now.getDate() - dob.getDate();
      if (days < 0) { months--; var prev = new Date(now.getFullYear(), now.getMonth(), 0); days += prev.getDate(); }
      if (months < 0) { years--; months += 12; }

      var diffMs = now - dob;
      var totalDays = Math.floor(diffMs / (1000*60*60*24));
      var totalWeeks = Math.floor(totalDays / 7);
      var totalMonths = years * 12 + months;
      var totalHours = Math.floor(diffMs / (1000*60*60));

      document.getElementById(uid + '-yrs').textContent = years;
      document.getElementById(uid + '-mos').textContent = months;
      document.getElementById(uid + '-dys').textContent = days;

      var nextBday = new Date(now.getFullYear(), dob.getMonth(), dob.getDate());
      if (nextBday <= now) nextBday = new Date(now.getFullYear() + 1, dob.getMonth(), dob.getDate());
      var daysUntil = Math.ceil((nextBday - now) / (1000*60*60*24));
      var isBirthday = (now.getMonth() === dob.getMonth() && now.getDate() === dob.getDate());

      // Zodiac
      var m = dob.getMonth() + 1, d = dob.getDate();
      var signs = [
        {s:'Capricorn',e:'\u2651',f:[12,22],t:[1,19]},{s:'Aquarius',e:'\u2652',f:[1,20],t:[2,18]},
        {s:'Pisces',e:'\u2653',f:[2,19],t:[3,20]},{s:'Aries',e:'\u2648',f:[3,21],t:[4,19]},
        {s:'Taurus',e:'\u2649',f:[4,20],t:[5,20]},{s:'Gemini',e:'\u264A',f:[5,21],t:[6,20]},
        {s:'Cancer',e:'\u264B',f:[6,21],t:[7,22]},{s:'Leo',e:'\u264C',f:[7,23],t:[8,22]},
        {s:'Virgo',e:'\u264D',f:[8,23],t:[9,22]},{s:'Libra',e:'\u264E',f:[9,23],t:[10,22]},
        {s:'Scorpio',e:'\u264F',f:[10,23],t:[11,21]},{s:'Sagittarius',e:'\u2650',f:[11,22],t:[12,21]}
      ];
      var zodiac = 'Unknown';
      signs.forEach(function(z) {
        if (z.f[0] > z.t[0]) { if ((m===z.f[0]&&d>=z.f[1])||(m===z.t[0]&&d<=z.t[1])) zodiac=z.e+' '+z.s; }
        else { if ((m===z.f[0]&&d>=z.f[1])||(m===z.t[0]&&d<=z.t[1])||(m>z.f[0]&&m<z.t[0])) zodiac=z.e+' '+z.s; }
      });

      var by = dob.getFullYear();
      var gen = by<=1945?'Silent Gen':by<=1964?'Baby Boomer':by<=1980?'Gen X':by<=1996?'Millennial':by<=2012?'Gen Z':'Gen Alpha';

      var detailsEl = document.getElementById(uid + '-details');
      detailsEl.innerHTML =
        detailBox('Total Months', totalMonths.toLocaleString()) +
        detailBox('Total Weeks', totalWeeks.toLocaleString()) +
        detailBox('Total Days', totalDays.toLocaleString()) +
        detailBox('Total Hours', totalHours.toLocaleString()) +
        detailBox('Next Birthday', isBirthday ? 'Today!' : daysUntil + ' days') +
        detailBox('Zodiac', zodiac) +
        detailBox('Generation', gen) +
        detailBox('Day Born', dob.toLocaleDateString('en-US',{weekday:'long'}));

      var bdayEl = document.getElementById(uid + '-bday');
      if (isBirthday) {
        bdayEl.textContent = 'Happy Birthday! You were born exactly ' + years + ' years ago today.';
        bdayEl.style.display = 'block';
      } else {
        bdayEl.style.display = 'none';
      }
      results.style.display = 'block';
    }

    btn.addEventListener('click', calculate);
    calculate();
  };
})();
