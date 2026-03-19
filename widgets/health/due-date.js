(function(){
  window.AfroWidgets = window.AfroWidgets || {};
  window.AfroWidgets.due_date = function(container, opts) {
    opts = opts || {};
    var theme = opts.theme || 'light';
    var isDark = theme === 'dark';
    var bg = isDark ? '#1a1a2e' : '#fff';
    var text = isDark ? '#e2e8f0' : '#0f1419';
    var border = isDark ? '#334155' : '#e2e8f0';
    var accent = '#e84393';
    var inputBg = isDark ? '#0f172a' : '#f8fafc';
    var cardBg = isDark ? '#0f172a' : '#f8fafc';

    container.innerHTML = '<div class="aw-due-date" style="font-family:\'DM Sans\',system-ui,sans-serif;background:'+bg+';color:'+text+';border:1px solid '+border+';border-radius:10px;overflow:hidden">' +
      '<div style="padding:15px 22px;border-bottom:1px solid '+border+';background:'+cardBg+'">' +
        '<span class="aw-title" style="font-size:.72rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase">Pregnancy Due Date Calculator</span>' +
      '</div>' +
      '<div style="padding:22px">' +
        '<div class="aw-field" style="margin-bottom:14px">' +
          '<label class="aw-label" style="display:block;font-size:.72rem;font-weight:600;color:#64748b;margin-bottom:5px">Last Menstrual Period (LMP)</label>' +
          '<input type="date" class="aw-input aw-dd-lmp" style="width:100%;padding:9px 12px;border:1.5px solid '+border+';border-radius:7px;font-size:.82rem;background:'+inputBg+';color:'+text+';font-family:inherit;box-sizing:border-box">' +
        '</div>' +
        '<button class="aw-btn aw-btn--primary aw-dd-btn" style="display:block;width:100%;padding:12px;border:none;border-radius:8px;font-size:.82rem;font-weight:700;cursor:pointer;background:linear-gradient(135deg,#c2185b,'+accent+');color:#fff;font-family:inherit">Calculate Due Date</button>' +
        '<div class="aw-dd-result" style="display:none;margin-top:14px">' +
          '<div class="aw-result-box" style="text-align:center;padding:16px;background:'+(isDark?'#2d1b35':'#fdf2f8')+';border:1px solid '+(isDark?'#9b59b6':'#f9a8d4')+';border-radius:8px;margin-bottom:12px">' +
            '<div class="aw-result-label" style="font-size:.68rem;color:#64748b;font-weight:600;text-transform:uppercase;margin-bottom:3px">Estimated Due Date</div>' +
            '<div class="aw-result-main aw-dd-edd" style="font-size:1.6rem;font-weight:900;color:'+accent+'"></div>' +
          '</div>' +
          '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px">' +
            '<div style="text-align:center;padding:14px;background:'+cardBg+';border:1px solid '+border+';border-radius:8px">' +
              '<div class="aw-dd-weeks" style="font-size:1.3rem;font-weight:800;color:'+accent+'"></div>' +
              '<div style="font-size:.68rem;color:#64748b;font-weight:600;text-transform:uppercase;margin-top:3px">Weeks Pregnant</div>' +
            '</div>' +
            '<div style="text-align:center;padding:14px;background:'+cardBg+';border:1px solid '+border+';border-radius:8px">' +
              '<div class="aw-dd-trimester" style="font-size:1.3rem;font-weight:800;color:'+text+'"></div>' +
              '<div style="font-size:.68rem;color:#64748b;font-weight:600;text-transform:uppercase;margin-top:3px">Trimester</div>' +
            '</div>' +
            '<div style="text-align:center;padding:14px;background:'+cardBg+';border:1px solid '+border+';border-radius:8px">' +
              '<div class="aw-dd-remaining" style="font-size:1.3rem;font-weight:800;color:'+text+'"></div>' +
              '<div style="font-size:.68rem;color:#64748b;font-weight:600;text-transform:uppercase;margin-top:3px">Days Remaining</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
        (opts.footerHTML ? '<div class="aw-footer" style="margin-top:14px">'+opts.footerHTML+'</div>' : '') +
      '</div>' +
    '</div>';

    function calc() {
      var lmpInput = container.querySelector('.aw-dd-lmp').value;
      if (!lmpInput) return;

      var lmp = new Date(lmpInput);
      if (isNaN(lmp.getTime())) return;

      // Naegele's rule: due date = LMP + 280 days
      var dueDate = new Date(lmp.getTime() + 280 * 24 * 60 * 60 * 1000);
      var today = new Date();
      today.setHours(0, 0, 0, 0);

      var diffMs = today.getTime() - lmp.getTime();
      var totalDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
      var weeks = Math.floor(totalDays / 7);
      var days = totalDays % 7;

      var remaining = Math.floor((dueDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
      if (remaining < 0) remaining = 0;

      var trimester;
      if (weeks < 13) trimester = '1st';
      else if (weeks < 27) trimester = '2nd';
      else trimester = '3rd';

      var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      var eddStr = months[dueDate.getMonth()] + ' ' + dueDate.getDate() + ', ' + dueDate.getFullYear();

      container.querySelector('.aw-dd-edd').textContent = eddStr;
      container.querySelector('.aw-dd-weeks').textContent = weeks + 'w ' + days + 'd';
      container.querySelector('.aw-dd-trimester').textContent = trimester;
      container.querySelector('.aw-dd-remaining').textContent = remaining;
      container.querySelector('.aw-dd-result').style.display = 'block';
    }

    container.querySelector('.aw-dd-btn').addEventListener('click', calc);
    container.querySelector('.aw-dd-lmp').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') calc();
    });
  };
})();
