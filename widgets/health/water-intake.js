(function(){
  window.AfroWidgets = window.AfroWidgets || {};
  window.AfroWidgets.water_intake = function(container, opts) {
    opts = opts || {};
    var theme = opts.theme || 'light';
    var isDark = theme === 'dark';
    var bg = isDark ? '#1a1a2e' : '#fff';
    var text = isDark ? '#e2e8f0' : '#0f1419';
    var border = isDark ? '#334155' : '#e2e8f0';
    var accent = '#0891b2';
    var inputBg = isDark ? '#0f172a' : '#f8fafc';
    var cardBg = isDark ? '#0f172a' : '#f8fafc';

    container.innerHTML = '<div class="aw-water-intake" style="font-family:\'DM Sans\',system-ui,sans-serif;background:'+bg+';color:'+text+';border:1px solid '+border+';border-radius:10px;overflow:hidden">' +
      '<div style="padding:15px 22px;border-bottom:1px solid '+border+';background:'+cardBg+'">' +
        '<span class="aw-title" style="font-size:.72rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase">Daily Water Intake Calculator</span>' +
      '</div>' +
      '<div style="padding:22px">' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px">' +
          '<div class="aw-field">' +
            '<label class="aw-label" style="display:block;font-size:.72rem;font-weight:600;color:#64748b;margin-bottom:5px">Weight (kg)</label>' +
            '<input type="number" class="aw-input aw-wi-weight" placeholder="70" min="20" max="300" style="width:100%;padding:9px 12px;border:1.5px solid '+border+';border-radius:7px;font-size:.82rem;background:'+inputBg+';color:'+text+';font-family:inherit;box-sizing:border-box">' +
          '</div>' +
          '<div class="aw-field">' +
            '<label class="aw-label" style="display:block;font-size:.72rem;font-weight:600;color:#64748b;margin-bottom:5px">Activity Level</label>' +
            '<select class="aw-select aw-wi-activity" style="width:100%;padding:9px 12px;border:1.5px solid '+border+';border-radius:7px;font-size:.82rem;background:'+inputBg+';color:'+text+';font-family:inherit">' +
              '<option value="1.0">Sedentary</option>' +
              '<option value="1.1">Light Activity</option>' +
              '<option value="1.2" selected>Moderate Activity</option>' +
              '<option value="1.3">Active</option>' +
              '<option value="1.4">Very Active</option>' +
            '</select>' +
          '</div>' +
        '</div>' +
        '<button class="aw-btn aw-btn--primary aw-wi-btn" style="display:block;width:100%;padding:12px;border:none;border-radius:8px;font-size:.82rem;font-weight:700;cursor:pointer;background:linear-gradient(135deg,#0e7490,'+accent+');color:#fff;font-family:inherit">Calculate Water Intake</button>' +
        '<div class="aw-wi-result" style="display:none;margin-top:14px">' +
          '<div class="aw-result-box" style="text-align:center;padding:16px;background:'+(isDark?'#0c2d3e':'#ecfeff')+';border:1px solid '+(isDark?'#0891b2':'#a5f3fc')+';border-radius:8px;margin-bottom:12px">' +
            '<div class="aw-result-label" style="font-size:.68rem;color:#64748b;font-weight:600;text-transform:uppercase;margin-bottom:3px">Daily Water Intake</div>' +
            '<div class="aw-result-main aw-wi-liters" style="font-size:2.2rem;font-weight:900;color:'+accent+'"></div>' +
          '</div>' +
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">' +
            '<div style="text-align:center;padding:14px;background:'+cardBg+';border:1px solid '+border+';border-radius:8px">' +
              '<div class="aw-wi-glasses" style="font-size:1.3rem;font-weight:800;color:'+accent+'"></div>' +
              '<div style="font-size:.68rem;color:#64748b;font-weight:600;text-transform:uppercase;margin-top:3px">Glasses (250ml)</div>' +
            '</div>' +
            '<div style="text-align:center;padding:14px;background:'+cardBg+';border:1px solid '+border+';border-radius:8px">' +
              '<div class="aw-wi-ml" style="font-size:1.3rem;font-weight:800;color:'+text+'"></div>' +
              '<div style="font-size:.68rem;color:#64748b;font-weight:600;text-transform:uppercase;margin-top:3px">Millilitres</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
        (opts.footerHTML ? '<div class="aw-footer" style="margin-top:14px">'+opts.footerHTML+'</div>' : '') +
      '</div>' +
    '</div>';

    function calc() {
      var weight = parseFloat(container.querySelector('.aw-wi-weight').value) || 0;
      var multiplier = parseFloat(container.querySelector('.aw-wi-activity').value) || 1.0;
      if (weight <= 0) return;

      // Base: weight * 0.033 liters, adjusted by activity multiplier
      var liters = weight * 0.033 * multiplier;
      var ml = Math.round(liters * 1000);
      var glasses = Math.round(ml / 250);

      container.querySelector('.aw-wi-liters').textContent = liters.toFixed(1) + ' L';
      container.querySelector('.aw-wi-glasses').textContent = glasses;
      container.querySelector('.aw-wi-ml').textContent = ml.toLocaleString();
      container.querySelector('.aw-wi-result').style.display = 'block';
    }

    container.querySelector('.aw-wi-btn').addEventListener('click', calc);
    container.querySelector('.aw-wi-weight').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') calc();
    });
  };
})();
