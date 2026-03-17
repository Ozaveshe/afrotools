(function(){
  window.AfroWidgets = window.AfroWidgets || {};
  window.AfroWidgets.WaistHip = function(container, opts) {
    opts = opts || {};
    var theme = opts.theme || 'light';
    var isDark = theme === 'dark';
    var bg = isDark ? '#1a1a2e' : '#fff';
    var text = isDark ? '#e2e8f0' : '#0f1419';
    var border = isDark ? '#334155' : '#e2e8f0';
    var accent = '#7c3aed';
    var inputBg = isDark ? '#0f172a' : '#f8fafc';
    var cardBg = isDark ? '#0f172a' : '#f8fafc';
    var s = 'style="width:100%;padding:9px 12px;border:1.5px solid '+border+';border-radius:7px;font-size:.82rem;background:'+inputBg+';color:'+text+';font-family:inherit;box-sizing:border-box"';
    var lbl = 'style="display:block;font-size:.72rem;font-weight:600;color:#64748b;margin-bottom:5px"';

    container.innerHTML = '<div class="aw-whr" style="font-family:\'DM Sans\',system-ui,sans-serif;background:'+bg+';color:'+text+';border:1px solid '+border+';border-radius:10px;overflow:hidden">' +
      '<div style="padding:15px 22px;border-bottom:1px solid '+border+';background:'+cardBg+'">' +
        '<span style="font-size:.72rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase">Waist-to-Hip Ratio Calculator</span>' +
      '</div>' +
      '<div style="padding:22px">' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px">' +
          '<div><label '+lbl+'>Gender</label><select id="aw-whr-gender" '+s+'><option value="male">Male</option><option value="female">Female</option></select></div>' +
          '<div><label '+lbl+'>Unit</label><select id="aw-whr-unit" '+s+'><option value="cm">Centimetres (cm)</option><option value="in">Inches (in)</option></select></div>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px">' +
          '<div><label '+lbl+'>Waist Circumference</label><input type="number" id="aw-whr-waist" placeholder="85" step="0.1" min="30" max="250" '+s+'></div>' +
          '<div><label '+lbl+'>Hip Circumference</label><input type="number" id="aw-whr-hip" placeholder="100" step="0.1" min="30" max="250" '+s+'></div>' +
        '</div>' +
        '<p style="font-size:.72rem;color:#94a3b8;margin-bottom:16px">Measure waist at narrowest point (navel level). Measure hips at widest point.</p>' +
        '<button id="aw-whr-btn" style="display:block;width:100%;padding:12px;border:none;border-radius:8px;font-size:.82rem;font-weight:700;cursor:pointer;background:linear-gradient(135deg,#6d28d9,'+accent+');color:#fff;font-family:inherit">Calculate WHR</button>' +
        '<div id="aw-whr-result" style="display:none;margin-top:14px">' +
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">' +
            '<div id="aw-whr-score-box" style="text-align:center;padding:16px;border-radius:8px;grid-column:1/-1"></div>' +
            '<div style="text-align:center;padding:14px;background:'+cardBg+';border:1px solid '+border+';border-radius:8px"><div id="aw-whr-shape" style="font-size:1rem;font-weight:800;color:'+text+'"></div><div style="font-size:.68rem;color:#64748b;font-weight:600;text-transform:uppercase;margin-top:3px">Body Shape</div></div>' +
            '<div style="text-align:center;padding:14px;background:'+cardBg+';border:1px solid '+border+';border-radius:8px"><div id="aw-whr-risk" style="font-size:1rem;font-weight:800"></div><div style="font-size:.68rem;color:#64748b;font-weight:600;text-transform:uppercase;margin-top:3px">Risk Level</div></div>' +
          '</div>' +
          '<div id="aw-whr-advice" style="margin-top:12px;padding:14px 18px;border-radius:8px;font-size:.82rem;line-height:1.6"></div>' +
        '</div>' +
        (opts.footerHTML ? '<div style="margin-top:14px">'+opts.footerHTML+'</div>' : '') +
      '</div>' +
    '</div>';

    function calc() {
      var gender = container.querySelector('#aw-whr-gender').value;
      var unit = container.querySelector('#aw-whr-unit').value;
      var waist = parseFloat(container.querySelector('#aw-whr-waist').value) || 0;
      var hip = parseFloat(container.querySelector('#aw-whr-hip').value) || 0;
      if (waist <= 0 || hip <= 0) return;
      if (unit === 'in') { waist *= 2.54; hip *= 2.54; }

      var whr = waist / hip;
      var risk, riskColor, shape, advice;

      if (gender === 'female') {
        if (whr <= 0.80) { risk = 'Low Risk'; riskColor = '#007AFF'; shape = 'Pear Shape'; advice = 'Your WHR indicates low cardiovascular risk. Maintain your healthy lifestyle with regular exercise and balanced nutrition.'; }
        else if (whr <= 0.85) { risk = 'Moderate Risk'; riskColor = '#d97706'; shape = 'Intermediate'; advice = 'Your WHR suggests moderate risk. Consider increasing physical activity and reviewing your diet.'; }
        else { risk = 'High Risk'; riskColor = '#dc2626'; shape = 'Apple Shape'; advice = 'Your WHR indicates elevated cardiovascular risk. Consult a healthcare professional. Focus on reducing abdominal fat.'; }
      } else {
        if (whr <= 0.90) { risk = 'Low Risk'; riskColor = '#007AFF'; shape = 'Healthy Distribution'; advice = 'Your WHR indicates low cardiovascular risk. Continue maintaining a healthy weight.'; }
        else if (whr <= 0.99) { risk = 'Moderate Risk'; riskColor = '#d97706'; shape = 'Intermediate'; advice = 'Your WHR suggests moderate risk. Increase cardiovascular exercise and review your diet.'; }
        else { risk = 'High Risk'; riskColor = '#dc2626'; shape = 'Central Obesity'; advice = 'Your WHR indicates significantly elevated cardiovascular risk. Please consult a healthcare professional.'; }
      }

      var scoreBox = container.querySelector('#aw-whr-score-box');
      scoreBox.style.background = riskColor + '15';
      scoreBox.style.border = '1px solid ' + riskColor + '40';
      scoreBox.innerHTML = '<div style="font-size:2.2rem;font-weight:900;color:'+riskColor+'">' + whr.toFixed(2) + '</div>' +
        '<div style="display:inline-block;padding:6px 16px;border-radius:6px;font-size:.85rem;font-weight:700;margin-top:8px;background:'+riskColor+'20;color:'+riskColor+'">' + risk + '</div>';

      container.querySelector('#aw-whr-shape').textContent = shape;
      container.querySelector('#aw-whr-risk').textContent = risk;
      container.querySelector('#aw-whr-risk').style.color = riskColor;

      var adviceEl = container.querySelector('#aw-whr-advice');
      adviceEl.textContent = advice;
      adviceEl.style.background = riskColor + '10';
      adviceEl.style.border = '1px solid ' + riskColor + '30';
      adviceEl.style.color = isDark ? '#e2e8f0' : (riskColor === '#007AFF' ? '#166534' : riskColor === '#d97706' ? '#854d0e' : '#991b1b');

      container.querySelector('#aw-whr-result').style.display = 'block';
    }

    container.querySelector('#aw-whr-btn').addEventListener('click', calc);
  };
})();
