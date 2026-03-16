(function(){
  window.AfroWidgets = window.AfroWidgets || {};
  window.AfroWidgets.Ovulation = function(container, opts) {
    opts = opts || {};
    var theme = opts.theme || 'light';
    var isDark = theme === 'dark';
    var bg = isDark ? '#1a1a2e' : '#fff';
    var text = isDark ? '#e2e8f0' : '#0f1419';
    var border = isDark ? '#334155' : '#e2e8f0';
    var accent = '#ec4899';
    var inputBg = isDark ? '#0f172a' : '#f8fafc';
    var cardBg = isDark ? '#0f172a' : '#f8fafc';
    var s = 'style="width:100%;padding:9px 12px;border:1.5px solid '+border+';border-radius:7px;font-size:.82rem;background:'+inputBg+';color:'+text+';font-family:inherit;box-sizing:border-box"';
    var lbl = 'style="display:block;font-size:.72rem;font-weight:600;color:#64748b;margin-bottom:5px"';

    container.innerHTML = '<div class="aw-ovulation" style="font-family:\'DM Sans\',system-ui,sans-serif;background:'+bg+';color:'+text+';border:1px solid '+border+';border-radius:10px;overflow:hidden">' +
      '<div style="padding:15px 22px;border-bottom:1px solid '+border+';background:'+cardBg+'">' +
        '<span style="font-size:.72rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase">Ovulation & Fertility Calculator</span>' +
      '</div>' +
      '<div style="padding:22px">' +
        '<div style="margin-bottom:14px"><label '+lbl+'>First Day of Last Period</label><input type="date" id="aw-ov-date" '+s+'></div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px">' +
          '<div><label '+lbl+'>Cycle Length (Days)</label>' +
            '<select id="aw-ov-cycle" '+s+'>' +
              (function(){ var h=''; for(var i=21;i<=35;i++) h+='<option value="'+i+'"'+(i===28?' selected':'')+'>'+i+' days'+(i===28?' (average)':'')+'</option>'; return h; })() +
            '</select></div>' +
          '<div><label '+lbl+'>Period Duration (Days)</label>' +
            '<select id="aw-ov-period" '+s+'>' +
              '<option value="3">3 days</option><option value="4">4 days</option><option value="5" selected>5 days</option><option value="6">6 days</option><option value="7">7 days</option>' +
            '</select></div>' +
        '</div>' +
        '<button id="aw-ov-btn" style="display:block;width:100%;padding:12px;border:none;border-radius:8px;font-size:.82rem;font-weight:700;cursor:pointer;background:linear-gradient(135deg,#db2777,'+accent+');color:#fff;font-family:inherit">Calculate Fertility Window</button>' +
        '<div id="aw-ov-result" style="display:none;margin-top:14px">' +
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">' +
            '<div style="text-align:center;padding:14px;background:'+(isDark?'#500724':'#fdf2f8')+';border:1px solid '+(isDark?'#9d174d':'#fce7f3')+';border-radius:8px"><div id="aw-ov-ovul" style="font-size:1.1rem;font-weight:800;color:'+accent+'"></div><div style="font-size:.68rem;color:#64748b;font-weight:600;text-transform:uppercase;margin-top:3px">Ovulation Date</div></div>' +
            '<div style="text-align:center;padding:14px;background:'+cardBg+';border:1px solid '+border+';border-radius:8px"><div id="aw-ov-fertile" style="font-size:1.1rem;font-weight:800;color:'+text+'"></div><div style="font-size:.68rem;color:#64748b;font-weight:600;text-transform:uppercase;margin-top:3px">Fertile Window</div></div>' +
            '<div style="text-align:center;padding:14px;background:'+cardBg+';border:1px solid '+border+';border-radius:8px"><div id="aw-ov-next" style="font-size:1.1rem;font-weight:800;color:'+text+'"></div><div style="font-size:.68rem;color:#64748b;font-weight:600;text-transform:uppercase;margin-top:3px">Next Period</div></div>' +
            '<div style="text-align:center;padding:14px;background:'+(isDark?'#500724':'#fdf2f8')+';border:1px solid '+(isDark?'#9d174d':'#fce7f3')+';border-radius:8px"><div id="aw-ov-due" style="font-size:1.1rem;font-weight:800;color:'+accent+'"></div><div style="font-size:.68rem;color:#64748b;font-weight:600;text-transform:uppercase;margin-top:3px">If Conceiving: Due Date</div></div>' +
          '</div>' +
          '<div style="margin-top:12px;padding:12px;background:'+(isDark?'#451a03':'#fef3c7')+';border:1px solid '+(isDark?'#92400e':'#fde68a')+';border-radius:8px;font-size:.75rem;color:'+(isDark?'#fde68a':'#92400e')+';line-height:1.6">This calculator provides estimates based on average cycle patterns. It should NOT be used as a sole method of contraception. Consult a healthcare professional for personalized advice.</div>' +
        '</div>' +
        (opts.footerHTML ? '<div style="margin-top:14px">'+opts.footerHTML+'</div>' : '') +
      '</div>' +
    '</div>';

    // Default to today
    var today = new Date();
    container.querySelector('#aw-ov-date').value = today.toISOString().split('T')[0];

    function calc() {
      var dateStr = container.querySelector('#aw-ov-date').value;
      if (!dateStr) return;
      var cycleLen = parseInt(container.querySelector('#aw-ov-cycle').value);

      var lp = new Date(dateStr + 'T00:00:00');
      var ovulationDay = cycleLen - 14;
      var ovulDate = new Date(lp.getTime() + ovulationDay * 86400000);
      var fertileStart = new Date(ovulDate.getTime() - 5 * 86400000);
      var fertileEnd = new Date(ovulDate.getTime() + 1 * 86400000);
      var nextPeriod = new Date(lp.getTime() + cycleLen * 86400000);
      var dueDate = new Date(lp.getTime() + 280 * 86400000);

      var fmtShort = { month: 'short', day: 'numeric' };
      var fmtLong = { weekday: 'short', month: 'short', day: 'numeric' };

      container.querySelector('#aw-ov-ovul').textContent = ovulDate.toLocaleDateString('en', fmtLong);
      container.querySelector('#aw-ov-fertile').textContent = fertileStart.toLocaleDateString('en', fmtShort) + ' - ' + fertileEnd.toLocaleDateString('en', fmtShort);
      container.querySelector('#aw-ov-next').textContent = nextPeriod.toLocaleDateString('en', fmtLong);
      container.querySelector('#aw-ov-due').textContent = dueDate.toLocaleDateString('en', { month: 'long', day: 'numeric', year: 'numeric' });

      container.querySelector('#aw-ov-result').style.display = 'block';
    }

    container.querySelector('#aw-ov-btn').addEventListener('click', calc);
  };
})();
