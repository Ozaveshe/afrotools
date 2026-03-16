(function(){
  window.AfroWidgets = window.AfroWidgets || {};
  window.AfroWidgets.cronBuilder = function(container, opts) {
    opts = opts || {};
    var theme = opts.theme || 'light';
    var isDark = theme === 'dark';
    var bg = isDark ? '#1a1a2e' : '#fff';
    var fg = isDark ? '#e0e0e0' : '#333';
    var inputBg = isDark ? '#16213e' : '#f5f7fa';
    var borderColor = isDark ? '#333' : '#ddd';
    var primary = '#007AFF';

    var fields = [
      {label:'Minute',id:'min',placeholder:'0-59 or *'},
      {label:'Hour',id:'hour',placeholder:'0-23 or *'},
      {label:'Day',id:'dom',placeholder:'1-31 or *'},
      {label:'Month',id:'mon',placeholder:'1-12 or *'},
      {label:'Weekday',id:'dow',placeholder:'0-6 or *'}
    ];

    container.innerHTML =
      '<div class="aw-cron-builder" style="font-family:\'DM Sans\',sans-serif;background:'+bg+';color:'+fg+';padding:20px;border-radius:10px;border:1px solid '+borderColor+'">' +
        '<div class="aw-field" style="margin-bottom:12px">' +
          '<label class="aw-label" style="display:block;font-size:13px;font-weight:600;margin-bottom:6px">Cron Expression</label>' +
          '<div style="display:flex;gap:8px">' +
            '<input type="text" class="aw-input aw-cron-expr" value="* * * * *" style="flex:1;padding:10px;border:1px solid '+borderColor+';border-radius:6px;font-family:\'Courier New\',monospace;font-size:15px;background:'+inputBg+';color:'+fg+';box-sizing:border-box;text-align:center;letter-spacing:2px">' +
            '<button class="aw-btn aw-cron-copy" style="padding:8px 12px;background:'+inputBg+';color:'+fg+';border:1px solid '+borderColor+';border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;font-family:inherit">Copy</button>' +
          '</div>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-bottom:12px">' +
          fields.map(function(f) {
            return '<div class="aw-field">' +
              '<label class="aw-label" style="display:block;font-size:11px;font-weight:600;margin-bottom:4px">'+f.label+'</label>' +
              '<input type="text" class="aw-input aw-cron-'+f.id+'" value="*" style="width:100%;padding:6px;border:1px solid '+borderColor+';border-radius:4px;font-family:\'Courier New\',monospace;font-size:13px;background:'+inputBg+';color:'+fg+';box-sizing:border-box;text-align:center" placeholder="'+f.placeholder+'">' +
            '</div>';
          }).join('') +
        '</div>' +
        '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px">' +
          '<button class="aw-btn aw-cron-preset" data-val="* * * * *" style="padding:4px 10px;background:'+inputBg+';color:'+fg+';border:1px solid '+borderColor+';border-radius:4px;cursor:pointer;font-size:11px;font-family:inherit">Every minute</button>' +
          '<button class="aw-btn aw-cron-preset" data-val="0 * * * *" style="padding:4px 10px;background:'+inputBg+';color:'+fg+';border:1px solid '+borderColor+';border-radius:4px;cursor:pointer;font-size:11px;font-family:inherit">Every hour</button>' +
          '<button class="aw-btn aw-cron-preset" data-val="0 0 * * *" style="padding:4px 10px;background:'+inputBg+';color:'+fg+';border:1px solid '+borderColor+';border-radius:4px;cursor:pointer;font-size:11px;font-family:inherit">Daily midnight</button>' +
          '<button class="aw-btn aw-cron-preset" data-val="0 9 * * 1-5" style="padding:4px 10px;background:'+inputBg+';color:'+fg+';border:1px solid '+borderColor+';border-radius:4px;cursor:pointer;font-size:11px;font-family:inherit">Weekdays 9am</button>' +
          '<button class="aw-btn aw-cron-preset" data-val="0 0 1 * *" style="padding:4px 10px;background:'+inputBg+';color:'+fg+';border:1px solid '+borderColor+';border-radius:4px;cursor:pointer;font-size:11px;font-family:inherit">Monthly</button>' +
        '</div>' +
        '<div class="aw-result-box aw-cron-desc" style="padding:10px;background:'+inputBg+';border:1px solid '+borderColor+';border-radius:6px;font-size:13px;margin-bottom:10px"></div>' +
        '<div class="aw-field">' +
          '<label class="aw-label" style="display:block;font-size:12px;font-weight:600;margin-bottom:4px">Next 5 Runs</label>' +
          '<div class="aw-cron-next" style="font-size:12px;font-family:\'Courier New\',monospace"></div>' +
        '</div>' +
        (opts.footerHTML ? '<div style="margin-top:12px">'+opts.footerHTML+'</div>' : '') +
      '</div>';

    var exprEl = container.querySelector('.aw-cron-expr');
    var descEl = container.querySelector('.aw-cron-desc');
    var nextEl = container.querySelector('.aw-cron-next');
    var fieldEls = {
      min: container.querySelector('.aw-cron-min'),
      hour: container.querySelector('.aw-cron-hour'),
      dom: container.querySelector('.aw-cron-dom'),
      mon: container.querySelector('.aw-cron-mon'),
      dow: container.querySelector('.aw-cron-dow')
    };

    function matchesCronField(val, field) {
      if (field === '*') return true;
      var parts = field.split(',');
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i].trim();
        if (p.indexOf('/') !== -1) {
          var ss = p.split('/');
          var step = parseInt(ss[1]);
          var base = ss[0] === '*' ? 0 : parseInt(ss[0]);
          if ((val - base) % step === 0 && val >= base) return true;
        } else if (p.indexOf('-') !== -1) {
          var range = p.split('-');
          if (val >= parseInt(range[0]) && val <= parseInt(range[1])) return true;
        } else {
          if (val === parseInt(p)) return true;
        }
      }
      return false;
    }

    function calculateNextRuns(parts, count) {
      var runs = [];
      var now = new Date();
      var d = new Date(now.getTime() + 60000);
      d.setSeconds(0, 0);
      var maxIter = 525600;
      for (var i = 0; i < maxIter && runs.length < count; i++) {
        if (matchesCronField(d.getMinutes(), parts[0]) &&
            matchesCronField(d.getHours(), parts[1]) &&
            matchesCronField(d.getDate(), parts[2]) &&
            matchesCronField(d.getMonth() + 1, parts[3]) &&
            matchesCronField(d.getDay(), parts[4])) {
          runs.push(new Date(d));
        }
        d = new Date(d.getTime() + 60000);
      }
      return runs;
    }

    function describeCron(parts) {
      var dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
      var monthNames = ['','January','February','March','April','May','June','July','August','September','October','November','December'];
      var desc = 'Runs ';

      if (parts[0] === '*' && parts[1] === '*') desc += 'every minute';
      else if (parts[0] === '*') desc += 'every minute of hour ' + parts[1];
      else if (parts[1] === '*') desc += 'at minute ' + parts[0] + ' of every hour';
      else desc += 'at ' + parts[1].padStart(2,'0') + ':' + parts[0].padStart(2,'0');

      if (parts[2] !== '*') desc += ', on day ' + parts[2];
      if (parts[3] !== '*') {
        var m = parseInt(parts[3]);
        desc += ', in ' + (monthNames[m] || parts[3]);
      }
      if (parts[4] !== '*') {
        var days = parts[4].split(',').map(function(d) {
          if (d.indexOf('-') !== -1) {
            var r = d.split('-');
            return (dayNames[+r[0]]||r[0]) + '-' + (dayNames[+r[1]]||r[1]);
          }
          return dayNames[+d] || d;
        }).join(', ');
        desc += ', on ' + days;
      }
      return desc;
    }

    function update() {
      var parts = exprEl.value.trim().split(/\s+/);
      if (parts.length !== 5) { descEl.textContent = 'Invalid: need exactly 5 fields'; nextEl.innerHTML = ''; return; }

      fieldEls.min.value = parts[0];
      fieldEls.hour.value = parts[1];
      fieldEls.dom.value = parts[2];
      fieldEls.mon.value = parts[3];
      fieldEls.dow.value = parts[4];

      descEl.textContent = describeCron(parts);
      var runs = calculateNextRuns(parts, 5);
      nextEl.innerHTML = runs.map(function(r) {
        return '<div style="padding:2px 0">' + r.toLocaleString() + '</div>';
      }).join('') || '<div style="color:#888">No upcoming runs found</div>';
    }

    function fieldUpdate() {
      exprEl.value = [fieldEls.min.value, fieldEls.hour.value, fieldEls.dom.value, fieldEls.mon.value, fieldEls.dow.value].join(' ');
      update();
    }

    exprEl.addEventListener('input', update);
    Object.keys(fieldEls).forEach(function(k) { fieldEls[k].addEventListener('input', fieldUpdate); });
    container.querySelectorAll('.aw-cron-preset').forEach(function(btn) {
      btn.addEventListener('click', function() { exprEl.value = this.dataset.val; update(); });
    });
    container.querySelector('.aw-cron-copy').addEventListener('click', function() {
      var btn = this;
      navigator.clipboard.writeText(exprEl.value).then(function() { btn.textContent = 'Copied!'; setTimeout(function(){ btn.textContent = 'Copy'; }, 1500); });
    });

    update();
  };
})();
