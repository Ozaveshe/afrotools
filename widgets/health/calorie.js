(function(){
  window.AfroWidgets = window.AfroWidgets || {};
  window.AfroWidgets.Calorie = function(container, opts) {
    opts = opts || {};
    var theme = opts.theme || 'light';
    var isDark = theme === 'dark';
    var bg = isDark ? '#1a1a2e' : '#fff';
    var text = isDark ? '#e2e8f0' : '#0f1419';
    var border = isDark ? '#334155' : '#e2e8f0';
    var accent = '#ea580c';
    var inputBg = isDark ? '#0f172a' : '#f8fafc';
    var cardBg = isDark ? '#0f172a' : '#f8fafc';

    var s = 'style="width:100%;padding:9px 12px;border:1.5px solid '+border+';border-radius:7px;font-size:.82rem;background:'+inputBg+';color:'+text+';font-family:inherit;box-sizing:border-box"';
    var lbl = 'style="display:block;font-size:.72rem;font-weight:600;color:#64748b;margin-bottom:5px"';

    container.innerHTML = '<div class="aw-calorie" style="font-family:\'DM Sans\',system-ui,sans-serif;background:'+bg+';color:'+text+';border:1px solid '+border+';border-radius:10px;overflow:hidden">' +
      '<div style="padding:15px 22px;border-bottom:1px solid '+border+';background:'+cardBg+'">' +
        '<span style="font-size:.72rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase">Daily Calorie Calculator</span>' +
      '</div>' +
      '<div style="padding:22px">' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px">' +
          '<div><label '+lbl+'>Age</label><input type="number" id="aw-cal-age" placeholder="25" min="10" max="100" '+s+'></div>' +
          '<div><label '+lbl+'>Gender</label><select id="aw-cal-gender" '+s+'><option value="male">Male</option><option value="female">Female</option></select></div>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px">' +
          '<div><label '+lbl+'>Height (cm)</label><input type="number" id="aw-cal-height" placeholder="170" min="100" max="250" '+s+'></div>' +
          '<div><label '+lbl+'>Weight (kg)</label><input type="number" id="aw-cal-weight" placeholder="70" min="30" max="300" '+s+'></div>' +
        '</div>' +
        '<div style="margin-bottom:14px"><label '+lbl+'>Activity Level</label>' +
          '<select id="aw-cal-activity" '+s+'>' +
            '<option value="1.2">Sedentary (little or no exercise)</option>' +
            '<option value="1.375">Lightly Active (1-3 days/week)</option>' +
            '<option value="1.55" selected>Moderately Active (3-5 days/week)</option>' +
            '<option value="1.725">Very Active (6-7 days/week)</option>' +
            '<option value="1.9">Extra Active (physical job + exercise)</option>' +
          '</select></div>' +
        '<button id="aw-cal-btn" style="display:block;width:100%;padding:12px;border:none;border-radius:8px;font-size:.82rem;font-weight:700;cursor:pointer;background:linear-gradient(135deg,#9a3412,'+accent+');color:#fff;font-family:inherit">Calculate Calories</button>' +
        '<div id="aw-cal-result" style="display:none;margin-top:14px">' +
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">' +
            '<div style="text-align:center;padding:16px;background:'+(isDark?'#431407':'#fff7ed')+';border:1px solid '+(isDark?'#9a3412':'#fed7aa')+';border-radius:8px;grid-column:1/-1"><div id="aw-cal-tdee" style="font-size:1.8rem;font-weight:800;color:'+accent+'"></div><div style="font-size:.68rem;color:#64748b;font-weight:600;text-transform:uppercase;margin-top:3px">Daily Calories (TDEE)</div></div>' +
            '<div style="text-align:center;padding:14px;background:'+cardBg+';border:1px solid '+border+';border-radius:8px"><div id="aw-cal-bmr" style="font-size:1.3rem;font-weight:800;color:'+text+'"></div><div style="font-size:.68rem;color:#64748b;font-weight:600;text-transform:uppercase;margin-top:3px">BMR</div></div>' +
            '<div style="text-align:center;padding:14px;background:'+cardBg+';border:1px solid '+border+';border-radius:8px"><div id="aw-cal-lose" style="font-size:1.3rem;font-weight:800;color:#007AFF"></div><div style="font-size:.68rem;color:#64748b;font-weight:600;text-transform:uppercase;margin-top:3px">To Lose Weight</div></div>' +
            '<div style="text-align:center;padding:14px;background:'+cardBg+';border:1px solid '+border+';border-radius:8px"><div id="aw-cal-gain" style="font-size:1.3rem;font-weight:800;color:#dc2626"></div><div style="font-size:.68rem;color:#64748b;font-weight:600;text-transform:uppercase;margin-top:3px">To Gain Weight</div></div>' +
            '<div style="text-align:center;padding:14px;background:'+cardBg+';border:1px solid '+border+';border-radius:8px"><div id="aw-cal-protein" style="font-size:1.3rem;font-weight:800;color:'+text+'"></div><div style="font-size:.68rem;color:#64748b;font-weight:600;text-transform:uppercase;margin-top:3px">Protein (g)</div></div>' +
          '</div>' +
        '</div>' +
        (opts.footerHTML ? '<div style="margin-top:14px">'+opts.footerHTML+'</div>' : '') +
      '</div>' +
    '</div>';

    function calc() {
      var age = parseFloat(container.querySelector('#aw-cal-age').value) || 0;
      var gender = container.querySelector('#aw-cal-gender').value;
      var height = parseFloat(container.querySelector('#aw-cal-height').value) || 0;
      var weight = parseFloat(container.querySelector('#aw-cal-weight').value) || 0;
      var activity = parseFloat(container.querySelector('#aw-cal-activity').value) || 1.55;

      if (age <= 0 || height <= 0 || weight <= 0) return;

      // Mifflin-St Jeor equation
      var bmr;
      if (gender === 'male') {
        bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;
      } else {
        bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161;
      }

      var tdee = bmr * activity;
      var lose = tdee - 500;
      var gain = tdee + 500;
      var protein = Math.round(weight * 1.6);

      container.querySelector('#aw-cal-tdee').textContent = Math.round(tdee) + ' kcal';
      container.querySelector('#aw-cal-bmr').textContent = Math.round(bmr) + ' kcal';
      container.querySelector('#aw-cal-lose').textContent = Math.round(lose) + ' kcal';
      container.querySelector('#aw-cal-gain').textContent = Math.round(gain) + ' kcal';
      container.querySelector('#aw-cal-protein').textContent = protein + 'g';

      container.querySelector('#aw-cal-result').style.display = 'block';
    }

    container.querySelector('#aw-cal-btn').addEventListener('click', calc);
  };
})();
