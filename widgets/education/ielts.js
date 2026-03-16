(function(){
  window.AfroWidgets = window.AfroWidgets || {};
  window.AfroWidgets.IELTS = function(container, opts) {
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

    var IELTS_TO_TOEFL = {
      '9.0': '118-120', '8.5': '115-117', '8.0': '110-114', '7.5': '102-109',
      '7.0': '94-101', '6.5': '79-93', '6.0': '60-78', '5.5': '46-59',
      '5.0': '35-45', '4.5': '32-34', '4.0': '0-31'
    };

    var LEVEL_DESC = {
      '9': 'Expert User',
      '8.5': 'Very Good User',
      '8': 'Very Good User',
      '7.5': 'Good User',
      '7': 'Good User',
      '6.5': 'Competent User',
      '6': 'Competent User',
      '5.5': 'Modest User',
      '5': 'Modest User',
      '4.5': 'Limited User',
      '4': 'Limited User',
      '3.5': 'Extremely Limited',
      '3': 'Extremely Limited'
    };

    var REQUIREMENTS = [
      { dest: 'UK Skilled Worker Visa', overall: 6.0, min: 5.5 },
      { dest: 'UK Student Visa (Tier 4)', overall: 5.5, min: 5.5 },
      { dest: 'Canada Express Entry (CLB 7)', overall: 6.0, min: 6.0 },
      { dest: 'Canada Study Permit', overall: 6.0, min: 5.5 },
      { dest: 'Australia Skilled (190)', overall: 7.0, min: 6.0 },
      { dest: 'Australia Student Visa', overall: 5.5, min: 5.0 },
      { dest: 'New Zealand Skilled Migrant', overall: 6.5, min: 6.0 },
      { dest: 'Ireland Work Permit', overall: 6.5, min: 6.0 },
      { dest: 'Top UK University', overall: 7.0, min: 6.5 },
      { dest: 'Average UK University', overall: 6.0, min: 5.5 },
      { dest: 'Canadian University', overall: 6.5, min: 6.0 },
      { dest: 'Nursing (UK NMC)', overall: 7.0, min: 7.0 }
    ];

    // Build band score options (0.0 - 9.0 in 0.5 steps)
    var bandOpts = '';
    for (var b = 0; b <= 18; b++) {
      var val = (b * 0.5).toFixed(1);
      var sel = val === '6.0' ? ' selected' : '';
      bandOpts += '<option value="'+val+'"'+sel+'>'+val+'</option>';
    }

    container.innerHTML = '<div class="aw-ielts" style="font-family:\'DM Sans\',system-ui,sans-serif;background:'+bg+';color:'+text+';border:1px solid '+border+';border-radius:10px;overflow:hidden">' +
      '<div style="padding:15px 22px;border-bottom:1px solid '+border+';background:'+cardBg+'">' +
        '<span style="font-size:.72rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase">IELTS & TOEFL Score Calculator</span>' +
      '</div>' +
      '<div style="padding:22px">' +
        '<p style="font-size:.78rem;color:#64748b;margin-bottom:14px">Enter your band score for each component (0.0 - 9.0)</p>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:12px;margin-bottom:14px">' +
          '<div><label '+lbl+'>Listening</label><select id="aw-ielts-l" '+s+'>'+bandOpts+'</select></div>' +
          '<div><label '+lbl+'>Reading</label><select id="aw-ielts-r" '+s+'>'+bandOpts+'</select></div>' +
          '<div><label '+lbl+'>Writing</label><select id="aw-ielts-w" '+s+'>'+bandOpts+'</select></div>' +
          '<div><label '+lbl+'>Speaking</label><select id="aw-ielts-s" '+s+'>'+bandOpts+'</select></div>' +
        '</div>' +
        '<button id="aw-ielts-btn" style="display:block;width:100%;padding:12px;border:none;border-radius:8px;font-size:.82rem;font-weight:700;cursor:pointer;background:linear-gradient(135deg,#6d28d9,'+accent+');color:#fff;font-family:inherit">Calculate Overall Score</button>' +
        '<div id="aw-ielts-result" style="display:none;margin-top:14px">' +
          // Overall score display
          '<div style="text-align:center;padding:24px;background:'+(isDark?'#2e1065':'linear-gradient(135deg,#f5f3ff,#ede9fe)')+';border-radius:10px">' +
            '<div id="aw-ielts-overall" style="font-size:3.2rem;font-weight:900;color:#6d28d9;line-height:1"></div>' +
            '<div style="font-size:.72rem;color:#7c3aed;font-weight:600;margin-top:6px;text-transform:uppercase;letter-spacing:.08em">Overall Band Score</div>' +
            '<div id="aw-ielts-level" style="font-size:.82rem;color:#475569;margin-top:8px"></div>' +
          '</div>' +
          // Component scores
          '<div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:10px;margin-top:14px">' +
            '<div style="text-align:center;padding:12px 6px;background:'+cardBg+';border-radius:8px;border:1px solid '+border+'"><div id="aw-ielts-cl" style="font-size:1.2rem;font-weight:800;color:#6d28d9"></div><div style="font-size:.65rem;color:#64748b;font-weight:600;text-transform:uppercase;margin-top:3px">Listening</div></div>' +
            '<div style="text-align:center;padding:12px 6px;background:'+cardBg+';border-radius:8px;border:1px solid '+border+'"><div id="aw-ielts-cr" style="font-size:1.2rem;font-weight:800;color:#6d28d9"></div><div style="font-size:.65rem;color:#64748b;font-weight:600;text-transform:uppercase;margin-top:3px">Reading</div></div>' +
            '<div style="text-align:center;padding:12px 6px;background:'+cardBg+';border-radius:8px;border:1px solid '+border+'"><div id="aw-ielts-cw" style="font-size:1.2rem;font-weight:800;color:#6d28d9"></div><div style="font-size:.65rem;color:#64748b;font-weight:600;text-transform:uppercase;margin-top:3px">Writing</div></div>' +
            '<div style="text-align:center;padding:12px 6px;background:'+cardBg+';border-radius:8px;border:1px solid '+border+'"><div id="aw-ielts-cs" style="font-size:1.2rem;font-weight:800;color:#6d28d9"></div><div style="font-size:.65rem;color:#64748b;font-weight:600;text-transform:uppercase;margin-top:3px">Speaking</div></div>' +
          '</div>' +
          // TOEFL conversion
          '<div style="text-align:center;padding:14px;background:'+cardBg+';border:1px solid '+border+';border-radius:8px;margin-top:14px"><div id="aw-ielts-toefl" style="font-size:1.1rem;font-weight:800;color:'+accent+'"></div><div style="font-size:.68rem;color:#64748b;font-weight:600;text-transform:uppercase;margin-top:3px">TOEFL iBT Equivalent</div></div>' +
          // Requirements table
          '<div id="aw-ielts-reqs" style="margin-top:14px;border:1px solid '+border+';border-radius:8px;overflow:hidden;max-height:300px;overflow-y:auto"></div>' +
        '</div>' +
        (opts.footerHTML ? '<div style="margin-top:14px">'+opts.footerHTML+'</div>' : '') +
      '</div>' +
    '</div>';

    function calc() {
      var l = parseFloat(container.querySelector('#aw-ielts-l').value);
      var r = parseFloat(container.querySelector('#aw-ielts-r').value);
      var w = parseFloat(container.querySelector('#aw-ielts-w').value);
      var sp = parseFloat(container.querySelector('#aw-ielts-s').value);

      var avg = (l + r + w + sp) / 4;
      // IELTS rounding: round to nearest 0.5
      var overall = Math.round(avg * 2) / 2;
      var minComp = Math.min(l, r, w, sp);

      container.querySelector('#aw-ielts-overall').textContent = overall.toFixed(1);
      var levelKey = String(overall % 1 === 0 ? overall : overall);
      container.querySelector('#aw-ielts-level').textContent = LEVEL_DESC[levelKey] || LEVEL_DESC[String(Math.floor(overall))] || '';

      container.querySelector('#aw-ielts-cl').textContent = l.toFixed(1);
      container.querySelector('#aw-ielts-cr').textContent = r.toFixed(1);
      container.querySelector('#aw-ielts-cw').textContent = w.toFixed(1);
      container.querySelector('#aw-ielts-cs').textContent = sp.toFixed(1);

      // TOEFL conversion
      var toeflKey = overall.toFixed(1);
      container.querySelector('#aw-ielts-toefl').textContent = IELTS_TO_TOEFL[toeflKey] || 'N/A';

      // Requirements table
      var thS = 'style="text-align:left;padding:8px;background:'+(isDark?'#2e1065':'#f5f3ff')+';color:#6d28d9;font-weight:700;font-size:.7rem;text-transform:uppercase;letter-spacing:.06em;border-bottom:2px solid '+(isDark?'#7c3aed':'#ddd6fe')+'"';
      var tdS = 'style="padding:8px;border-bottom:1px solid '+border+';font-size:.78rem;color:'+text+'"';
      var table = '<table style="width:100%;border-collapse:collapse"><thead><tr>' +
        '<th '+thS+'>Destination</th><th '+thS+' style="text-align:center">Required</th><th '+thS+' style="text-align:center">Status</th>' +
        '</tr></thead><tbody>';

      for (var i = 0; i < REQUIREMENTS.length; i++) {
        var req = REQUIREMENTS[i];
        var meetsOverall = overall >= req.overall;
        var meetsMin = minComp >= req.min;
        var pass = meetsOverall && meetsMin;
        table += '<tr><td '+tdS+'>' + req.dest + '</td>' +
          '<td '+tdS+' style="text-align:center">' + req.overall + '+ (min ' + req.min + ')</td>' +
          '<td '+tdS+' style="text-align:center;font-weight:700;color:' + (pass ? '#16a34a' : '#dc2626') + '">' + (pass ? 'MEETS' : 'BELOW') + '</td></tr>';
      }
      table += '</tbody></table>';
      container.querySelector('#aw-ielts-reqs').innerHTML = table;

      container.querySelector('#aw-ielts-result').style.display = 'block';
    }

    container.querySelector('#aw-ielts-btn').addEventListener('click', calc);
  };
})();
