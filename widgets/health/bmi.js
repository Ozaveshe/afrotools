(function(){
  window.AfroWidgets = window.AfroWidgets || {};
  window.AfroWidgets.BMI = function(container, opts) {
    opts = opts || {};
    var theme = opts.theme || 'light';
    var isDark = theme === 'dark';
    var bg = isDark ? '#1a1a2e' : '#fff';
    var text = isDark ? '#e2e8f0' : '#0f1419';
    var border = isDark ? '#334155' : '#e2e8f0';
    var accent = '#2563eb';
    var inputBg = isDark ? '#0f172a' : '#f8fafc';
    var cardBg = isDark ? '#0f172a' : '#f8fafc';

    container.innerHTML = '<div class="aw-bmi" style="font-family:\'DM Sans\',system-ui,sans-serif;background:'+bg+';color:'+text+';border:1px solid '+border+';border-radius:10px;overflow:hidden">' +
      '<div style="padding:15px 22px;border-bottom:1px solid '+border+';background:'+cardBg+'">' +
        '<span style="font-size:.72rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase">BMI Calculator</span>' +
      '</div>' +
      '<div style="padding:22px">' +
        '<div style="margin-bottom:14px"><label style="display:block;font-size:.72rem;font-weight:600;color:#64748b;margin-bottom:5px">Unit System</label>' +
          '<select id="aw-bmi-unit" style="width:100%;padding:9px 12px;border:1.5px solid '+border+';border-radius:7px;font-size:.82rem;background:'+inputBg+';color:'+text+';font-family:inherit">' +
            '<option value="metric">Metric (cm, kg)</option><option value="imperial">Imperial (ft/in, lbs)</option>' +
          '</select></div>' +
        '<div id="aw-bmi-metric-fields" style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px">' +
          '<div><label style="display:block;font-size:.72rem;font-weight:600;color:#64748b;margin-bottom:5px">Height (cm)</label>' +
            '<input type="number" id="aw-bmi-height-cm" placeholder="170" min="50" max="250" style="width:100%;padding:9px 12px;border:1.5px solid '+border+';border-radius:7px;font-size:.82rem;background:'+inputBg+';color:'+text+';font-family:inherit;box-sizing:border-box"></div>' +
          '<div><label style="display:block;font-size:.72rem;font-weight:600;color:#64748b;margin-bottom:5px">Weight (kg)</label>' +
            '<input type="number" id="aw-bmi-weight-kg" placeholder="70" min="20" max="300" style="width:100%;padding:9px 12px;border:1.5px solid '+border+';border-radius:7px;font-size:.82rem;background:'+inputBg+';color:'+text+';font-family:inherit;box-sizing:border-box"></div>' +
        '</div>' +
        '<div id="aw-bmi-imperial-fields" style="display:none;margin-bottom:14px">' +
          '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px">' +
            '<div><label style="display:block;font-size:.72rem;font-weight:600;color:#64748b;margin-bottom:5px">Feet</label>' +
              '<input type="number" id="aw-bmi-feet" placeholder="5" min="1" max="8" style="width:100%;padding:9px 12px;border:1.5px solid '+border+';border-radius:7px;font-size:.82rem;background:'+inputBg+';color:'+text+';font-family:inherit;box-sizing:border-box"></div>' +
            '<div><label style="display:block;font-size:.72rem;font-weight:600;color:#64748b;margin-bottom:5px">Inches</label>' +
              '<input type="number" id="aw-bmi-inches" placeholder="7" min="0" max="11" style="width:100%;padding:9px 12px;border:1.5px solid '+border+';border-radius:7px;font-size:.82rem;background:'+inputBg+';color:'+text+';font-family:inherit;box-sizing:border-box"></div>' +
            '<div><label style="display:block;font-size:.72rem;font-weight:600;color:#64748b;margin-bottom:5px">Weight (lbs)</label>' +
              '<input type="number" id="aw-bmi-weight-lbs" placeholder="154" min="40" max="600" style="width:100%;padding:9px 12px;border:1.5px solid '+border+';border-radius:7px;font-size:.82rem;background:'+inputBg+';color:'+text+';font-family:inherit;box-sizing:border-box"></div>' +
          '</div>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px">' +
          '<div><label style="display:block;font-size:.72rem;font-weight:600;color:#64748b;margin-bottom:5px">Age</label>' +
            '<input type="number" id="aw-bmi-age" placeholder="25" min="2" max="120" style="width:100%;padding:9px 12px;border:1.5px solid '+border+';border-radius:7px;font-size:.82rem;background:'+inputBg+';color:'+text+';font-family:inherit;box-sizing:border-box"></div>' +
          '<div><label style="display:block;font-size:.72rem;font-weight:600;color:#64748b;margin-bottom:5px">Gender</label>' +
            '<select id="aw-bmi-gender" style="width:100%;padding:9px 12px;border:1.5px solid '+border+';border-radius:7px;font-size:.82rem;background:'+inputBg+';color:'+text+';font-family:inherit">' +
              '<option value="male">Male</option><option value="female">Female</option>' +
            '</select></div>' +
        '</div>' +
        '<button id="aw-bmi-btn" style="display:block;width:100%;padding:12px;border:none;border-radius:8px;font-size:.82rem;font-weight:700;cursor:pointer;background:linear-gradient(135deg,#1e40af,'+accent+');color:#fff;font-family:inherit">Calculate BMI</button>' +
        '<div id="aw-bmi-result" style="display:none;margin-top:14px">' +
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">' +
            '<div id="aw-bmi-score-box" style="text-align:center;padding:16px;border-radius:8px;grid-column:1/-1"></div>' +
            '<div style="text-align:center;padding:14px;background:'+cardBg+';border:1px solid '+border+';border-radius:8px"><div id="aw-bmi-bodyfat" style="font-size:1.3rem;font-weight:800;color:'+accent+'"></div><div style="font-size:.68rem;color:#64748b;font-weight:600;text-transform:uppercase;margin-top:3px">Est. Body Fat %</div></div>' +
            '<div style="text-align:center;padding:14px;background:'+cardBg+';border:1px solid '+border+';border-radius:8px"><div id="aw-bmi-healthy" style="font-size:1.3rem;font-weight:800;color:'+text+'"></div><div style="font-size:.68rem;color:#64748b;font-weight:600;text-transform:uppercase;margin-top:3px">Healthy Weight Range</div></div>' +
          '</div>' +
        '</div>' +
        (opts.footerHTML ? '<div style="margin-top:14px">'+opts.footerHTML+'</div>' : '') +
      '</div>' +
    '</div>';

    var unitSel = container.querySelector('#aw-bmi-unit');
    unitSel.addEventListener('change', function() {
      var isMetric = unitSel.value === 'metric';
      container.querySelector('#aw-bmi-metric-fields').style.display = isMetric ? 'grid' : 'none';
      container.querySelector('#aw-bmi-imperial-fields').style.display = isMetric ? 'none' : 'block';
    });

    function calc() {
      var unit = container.querySelector('#aw-bmi-unit').value;
      var age = parseFloat(container.querySelector('#aw-bmi-age').value) || 25;
      var gender = container.querySelector('#aw-bmi-gender').value;
      var heightCm, weightKg;

      if (unit === 'metric') {
        heightCm = parseFloat(container.querySelector('#aw-bmi-height-cm').value) || 0;
        weightKg = parseFloat(container.querySelector('#aw-bmi-weight-kg').value) || 0;
      } else {
        var feet = parseFloat(container.querySelector('#aw-bmi-feet').value) || 0;
        var inches = parseFloat(container.querySelector('#aw-bmi-inches').value) || 0;
        heightCm = (feet * 12 + inches) * 2.54;
        weightKg = (parseFloat(container.querySelector('#aw-bmi-weight-lbs').value) || 0) * 0.453592;
      }

      if (heightCm <= 0 || weightKg <= 0) return;

      var heightM = heightCm / 100;
      var bmi = weightKg / (heightM * heightM);

      var category, catColor;
      if (bmi < 18.5) { category = 'Underweight'; catColor = '#3b82f6'; }
      else if (bmi < 25) { category = 'Normal Weight'; catColor = '#22c55e'; }
      else if (bmi < 30) { category = 'Overweight'; catColor = '#f59e0b'; }
      else { category = 'Obese'; catColor = '#ef4444'; }

      // Body fat % estimate (Deurenberg formula)
      var sexVal = gender === 'male' ? 1 : 0;
      var bodyFat = (1.2 * bmi) + (0.23 * age) - (10.8 * sexVal) - 5.4;
      if (bodyFat < 3) bodyFat = 3;

      // Healthy weight range for height
      var minHealthy = 18.5 * heightM * heightM;
      var maxHealthy = 24.9 * heightM * heightM;

      var scoreBox = container.querySelector('#aw-bmi-score-box');
      scoreBox.style.background = catColor + '15';
      scoreBox.style.border = '1px solid ' + catColor + '40';
      scoreBox.innerHTML = '<div style="font-size:2.2rem;font-weight:900;color:'+catColor+'">' + bmi.toFixed(1) + '</div>' +
        '<div style="font-size:.85rem;font-weight:700;color:'+catColor+';margin-top:4px">' + category + '</div>';

      container.querySelector('#aw-bmi-bodyfat').textContent = bodyFat.toFixed(1) + '%';
      container.querySelector('#aw-bmi-healthy').textContent = minHealthy.toFixed(1) + ' - ' + maxHealthy.toFixed(1) + ' kg';

      container.querySelector('#aw-bmi-result').style.display = 'block';
    }

    container.querySelector('#aw-bmi-btn').addEventListener('click', calc);
  };
})();
