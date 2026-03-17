(function(){
  window.AfroWidgets = window.AfroWidgets || {};
  window.AfroWidgets.timeZone = function(container, opts) {
    opts = opts || {};
    var theme = opts.theme || 'light';
    var bg = theme === 'dark' ? '#1a1a2e' : '#fff';
    var text = theme === 'dark' ? '#e2e8f0' : '#0f1419';
    var muted = theme === 'dark' ? '#94a3b8' : '#64748b';
    var border = theme === 'dark' ? 'rgba(255,255,255,.12)' : '#e2e8f0';
    var inputBg = theme === 'dark' ? 'rgba(255,255,255,.06)' : '#f8fafc';
    var accent = opts.accent || '#0071e3';
    var uid = 'aw-tz-' + Math.random().toString(36).slice(2,8);

    var ZONES = [
      {g:'Africa',opts:[
        {v:'Africa/Lagos',l:'Lagos (WAT, UTC+1)'},{v:'Africa/Nairobi',l:'Nairobi (EAT, UTC+3)'},
        {v:'Africa/Johannesburg',l:'Johannesburg (SAST, UTC+2)'},{v:'Africa/Accra',l:'Accra (GMT, UTC+0)'},
        {v:'Africa/Cairo',l:'Cairo (EET, UTC+2)'},{v:'Africa/Casablanca',l:'Casablanca (WET, UTC+1)'},
        {v:'Africa/Addis_Ababa',l:'Addis Ababa (EAT, UTC+3)'},{v:'Africa/Dar_es_Salaam',l:'Dar es Salaam (EAT, UTC+3)'},
        {v:'Africa/Kigali',l:'Kigali (CAT, UTC+2)'},{v:'Africa/Kampala',l:'Kampala (EAT, UTC+3)'},
        {v:'Africa/Kinshasa',l:'Kinshasa (WAT, UTC+1)'}
      ]},
      {g:'International',opts:[
        {v:'Europe/London',l:'London (GMT/BST)'},{v:'America/New_York',l:'New York (EST/EDT)'},
        {v:'America/Los_Angeles',l:'Los Angeles (PST/PDT)'},{v:'Europe/Paris',l:'Paris (CET/CEST)'},
        {v:'Asia/Dubai',l:'Dubai (GST, UTC+4)'},{v:'Asia/Shanghai',l:'Beijing (CST, UTC+8)'},
        {v:'Asia/Tokyo',l:'Tokyo (JST, UTC+9)'},{v:'Asia/Kolkata',l:'Mumbai (IST, UTC+5:30)'},
        {v:'Australia/Sydney',l:'Sydney (AEST/AEDT)'}
      ]}
    ];

    var CITIES = [
      {name:'Lagos',tz:'Africa/Lagos'},{name:'Nairobi',tz:'Africa/Nairobi'},
      {name:'Johannesburg',tz:'Africa/Johannesburg'},{name:'Accra',tz:'Africa/Accra'},
      {name:'Cairo',tz:'Africa/Cairo'},{name:'London',tz:'Europe/London'},
      {name:'New York',tz:'America/New_York'},{name:'Dubai',tz:'Asia/Dubai'},
      {name:'Tokyo',tz:'Asia/Tokyo'},{name:'Sydney',tz:'Australia/Sydney'}
    ];

    function buildSelect() {
      var html = '';
      ZONES.forEach(function(g) {
        html += '<optgroup label="' + g.g + '">';
        g.opts.forEach(function(o) {
          html += '<option value="' + o.v + '">' + o.l + '</option>';
        });
        html += '</optgroup>';
      });
      return html;
    }

    var selHtml = buildSelect();
    var now = new Date();
    var localISO = new Date(now.getTime() - now.getTimezoneOffset()*60000).toISOString().slice(0,16);

    container.innerHTML =
      '<div id="' + uid + '" style="font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',sans-serif;background:' + bg + ';color:' + text + ';border:1px solid ' + border + ';border-radius:12px;overflow:hidden;max-width:560px;">' +
        '<div style="padding:14px 18px;font-size:.85rem;font-weight:800;border-bottom:1px solid ' + border + ';">Time Zone Converter</div>' +
        '<div style="padding:16px 18px;">' +
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">' +
            '<div>' +
              '<label style="font-size:.7rem;font-weight:700;color:' + muted + ';display:block;margin-bottom:4px;">From</label>' +
              '<select id="' + uid + '-fromTz" style="width:100%;padding:8px;border:1.5px solid ' + border + ';border-radius:7px;font-size:.78rem;background:' + inputBg + ';color:' + text + ';outline:none;">' + selHtml + '</select>' +
              '<input type="datetime-local" id="' + uid + '-fromTime" value="' + localISO + '" style="width:100%;padding:8px;border:1.5px solid ' + border + ';border-radius:7px;font-size:.8rem;background:' + inputBg + ';color:' + text + ';margin-top:6px;outline:none;">' +
              '<div id="' + uid + '-fromDisplay" style="font-size:1.6rem;font-weight:800;text-align:center;margin-top:8px;color:' + accent + ';">--:--</div>' +
              '<div id="' + uid + '-fromDate" style="font-size:.75rem;color:' + muted + ';text-align:center;">--</div>' +
            '</div>' +
            '<div>' +
              '<label style="font-size:.7rem;font-weight:700;color:' + muted + ';display:block;margin-bottom:4px;">To</label>' +
              '<select id="' + uid + '-toTz" style="width:100%;padding:8px;border:1.5px solid ' + border + ';border-radius:7px;font-size:.78rem;background:' + inputBg + ';color:' + text + ';outline:none;">' + selHtml + '</select>' +
              '<div style="text-align:center;margin-top:14px;">' +
                '<button id="' + uid + '-swap" style="padding:6px 14px;background:' + accent + ';color:#fff;border:none;border-radius:6px;font-size:.75rem;font-weight:700;cursor:pointer;">⇄ Swap</button>' +
              '</div>' +
              '<div id="' + uid + '-toDisplay" style="font-size:1.6rem;font-weight:800;text-align:center;margin-top:8px;color:' + accent + ';">--:--</div>' +
              '<div id="' + uid + '-toDate" style="font-size:.75rem;color:' + muted + ';text-align:center;">--</div>' +
              '<div style="text-align:center;"><span id="' + uid + '-dayInd" style="font-size:.68rem;font-weight:700;padding:2px 8px;border-radius:4px;display:inline-block;margin-top:4px;"></span></div>' +
            '</div>' +
          '</div>' +
          '<div style="margin-top:16px;border-top:1px solid ' + border + ';padding-top:12px;">' +
            '<div style="font-size:.68rem;font-weight:700;color:' + muted + ';text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px;">Live Clocks</div>' +
            '<div id="' + uid + '-clocks" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(100px,1fr));gap:8px;"></div>' +
          '</div>' +
        '</div>' +
        (opts.footerHTML ? '<div style="padding:10px 18px;border-top:1px solid ' + border + ';font-size:.72rem;color:' + muted + ';">' + opts.footerHTML + '</div>' : '') +
      '</div>';

    var root = document.getElementById(uid);
    var fromTz = document.getElementById(uid + '-fromTz');
    var toTz = document.getElementById(uid + '-toTz');
    var fromTime = document.getElementById(uid + '-fromTime');
    var fromDisplay = document.getElementById(uid + '-fromDisplay');
    var fromDate = document.getElementById(uid + '-fromDate');
    var toDisplay = document.getElementById(uid + '-toDisplay');
    var toDate = document.getElementById(uid + '-toDate');
    var dayInd = document.getElementById(uid + '-dayInd');
    var clocksGrid = document.getElementById(uid + '-clocks');
    var swapBtn = document.getElementById(uid + '-swap');

    toTz.value = 'Africa/Nairobi';

    function convert() {
      var ft = fromTz.value, tt = toTz.value, input = fromTime.value;
      if (!input) return;
      var d = new Date(input);
      try {
        fromDisplay.textContent = d.toLocaleString('en-US',{timeZone:ft,hour:'2-digit',minute:'2-digit',hour12:true});
        fromDate.textContent = d.toLocaleString('en-US',{timeZone:ft,weekday:'short',month:'short',day:'numeric'});
        toDisplay.textContent = d.toLocaleString('en-US',{timeZone:tt,hour:'2-digit',minute:'2-digit',hour12:true});
        toDate.textContent = d.toLocaleString('en-US',{timeZone:tt,weekday:'short',month:'short',day:'numeric'});
        var fd = d.toLocaleString('en-US',{timeZone:ft,day:'numeric'});
        var td = d.toLocaleString('en-US',{timeZone:tt,day:'numeric'});
        if (fd === td) {
          dayInd.textContent = 'Same day';
          dayInd.style.background = '#dcfce7'; dayInd.style.color = '#007AFF';
        } else {
          dayInd.textContent = parseInt(td) > parseInt(fd) ? 'Next day' : 'Previous day';
          dayInd.style.background = '#fef3c7'; dayInd.style.color = '#d97706';
        }
      } catch(e) {}
    }

    function updateClocks() {
      var now = new Date();
      clocksGrid.innerHTML = '';
      CITIES.forEach(function(c) {
        try {
          var t = now.toLocaleString('en-US',{timeZone:c.tz,hour:'2-digit',minute:'2-digit',hour12:true});
          var div = document.createElement('div');
          div.style.cssText = 'background:' + inputBg + ';border:1px solid ' + border + ';border-radius:6px;padding:8px;text-align:center;';
          div.innerHTML = '<div style="font-size:.68rem;font-weight:700;color:' + text + ';">' + c.name + '</div><div style="font-size:.95rem;font-weight:800;color:' + accent + ';">' + t + '</div>';
          clocksGrid.appendChild(div);
        } catch(e) {}
      });
    }

    fromTz.addEventListener('change', convert);
    toTz.addEventListener('change', convert);
    fromTime.addEventListener('change', convert);
    swapBtn.addEventListener('click', function() {
      var tmp = fromTz.value; fromTz.value = toTz.value; toTz.value = tmp;
      convert();
    });

    convert();
    updateClocks();
    setInterval(updateClocks, 60000);
  };
})();
