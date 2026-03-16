(function(){
  window.AfroWidgets = window.AfroWidgets || {};
  window.AfroWidgets.JAMBAggregate = function(container, opts) {
    opts = opts || {};
    var theme = opts.theme || 'light';
    var isDark = theme === 'dark';
    var bg = isDark ? '#1a1a2e' : '#fff';
    var text = isDark ? '#e2e8f0' : '#0f1419';
    var border = isDark ? '#334155' : '#e2e8f0';
    var accent = '#2563eb';
    var inputBg = isDark ? '#0f172a' : '#f8fafc';
    var cardBg = isDark ? '#0f172a' : '#f8fafc';
    var s = 'style="width:100%;padding:9px 12px;border:1.5px solid '+border+';border-radius:7px;font-size:.82rem;background:'+inputBg+';color:'+text+';font-family:inherit;box-sizing:border-box"';
    var lbl = 'style="display:block;font-size:.72rem;font-weight:600;color:#64748b;margin-bottom:5px"';

    var FORMULAS = {
      standard: { name: 'Standard', desc: '(UTME/8) + (Post-UTME/2)', needsOlevel: false },
      unilag: { name: 'UNILAG', desc: '(UTME/4 x 0.5) + (Post-UTME x 0.5)', needsOlevel: false },
      ui: { name: 'UI', desc: '(UTME/4 x 0.375) + (Post-UTME x 0.25) + (O\'Level x 0.375)', needsOlevel: true },
      oau: { name: 'OAU', desc: '(UTME/8) + (Post-UTME/20 x 50)', needsOlevel: false },
      unn: { name: 'UNN', desc: '(UTME/400 x 50) + (Post-UTME/100 x 50)', needsOlevel: false }
    };

    var OLEVEL_GRADES = [
      { label: 'A1', value: 6 }, { label: 'B2', value: 5 }, { label: 'B3', value: 4 },
      { label: 'C4', value: 3 }, { label: 'C5', value: 2 }, { label: 'C6', value: 1 },
      { label: 'D7', value: 0 }, { label: 'E8', value: 0 }, { label: 'F9', value: 0 }
    ];

    var CUTOFFS = [
      { uni: 'UNILAG', course: 'Medicine', cutoff: 75 },
      { uni: 'UNILAG', course: 'Law', cutoff: 72 },
      { uni: 'UNILAG', course: 'Engineering', cutoff: 65 },
      { uni: 'UNILAG', course: 'Computer Science', cutoff: 62 },
      { uni: 'UNILAG', course: 'Accounting', cutoff: 60 },
      { uni: 'UI', course: 'Medicine', cutoff: 78 },
      { uni: 'UI', course: 'Law', cutoff: 73 },
      { uni: 'UI', course: 'Engineering', cutoff: 65 },
      { uni: 'UI', course: 'Computer Science', cutoff: 60 },
      { uni: 'UI', course: 'Economics', cutoff: 58 },
      { uni: 'OAU', course: 'Medicine', cutoff: 70 },
      { uni: 'OAU', course: 'Law', cutoff: 68 },
      { uni: 'OAU', course: 'Engineering', cutoff: 60 },
      { uni: 'OAU', course: 'Computer Science', cutoff: 55 },
      { uni: 'UNN', course: 'Medicine', cutoff: 72 },
      { uni: 'UNN', course: 'Law', cutoff: 68 },
      { uni: 'UNN', course: 'Engineering', cutoff: 60 },
      { uni: 'UNN', course: 'Computer Science', cutoff: 58 },
      { uni: 'ABU', course: 'Medicine', cutoff: 70 },
      { uni: 'ABU', course: 'Law', cutoff: 65 },
      { uni: 'ABU', course: 'Engineering', cutoff: 58 },
      { uni: 'UNIBEN', course: 'Medicine', cutoff: 68 },
      { uni: 'UNIBEN', course: 'Law', cutoff: 65 },
      { uni: 'UNIBEN', course: 'Engineering', cutoff: 58 },
      { uni: 'UNILORIN', course: 'Medicine', cutoff: 70 },
      { uni: 'UNILORIN', course: 'Engineering', cutoff: 58 },
      { uni: 'FUTA', course: 'Engineering', cutoff: 58 },
      { uni: 'FUTA', course: 'Computer Science', cutoff: 55 },
      { uni: 'LASU', course: 'Medicine', cutoff: 65 },
      { uni: 'LASU', course: 'Law', cutoff: 62 }
    ];

    // Build grade options for O'Level selects
    var gradeOpts = '<option value="">--</option>';
    for (var g = 0; g < OLEVEL_GRADES.length; g++) {
      gradeOpts += '<option value="'+OLEVEL_GRADES[g].value+'">'+OLEVEL_GRADES[g].label+' ('+OLEVEL_GRADES[g].value+')</option>';
    }

    // Build formula radio-style tabs
    var formulaTabs = '';
    var keys = ['standard','unilag','ui','oau','unn'];
    for (var f = 0; f < keys.length; f++) {
      var k = keys[f];
      var active = k === 'standard';
      formulaTabs += '<button class="aw-jamb-tab" data-formula="'+k+'" style="flex:1;padding:8px 4px;text-align:center;border:none;border-radius:6px;cursor:pointer;font-size:.72rem;font-weight:600;font-family:inherit;' +
        (active ? 'background:'+accent+';color:#fff' : 'background:transparent;color:'+text) + '">'+FORMULAS[k].name+'</button>';
    }

    // Build university select options
    var unis = [];
    for (var i = 0; i < CUTOFFS.length; i++) {
      if (unis.indexOf(CUTOFFS[i].uni) === -1) unis.push(CUTOFFS[i].uni);
    }
    var uniOpts = '<option value="">-- University --</option>';
    for (var u = 0; u < unis.length; u++) uniOpts += '<option value="'+unis[u]+'">'+unis[u]+'</option>';

    // Build O'Level subject rows
    var olevelRows = '';
    for (var j = 0; j < 5; j++) {
      olevelRows += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:6px">' +
        '<input type="text" class="aw-jamb-subj-name" placeholder="Subject '+(j+1)+'" '+s+'>' +
        '<select class="aw-jamb-subj-grade" '+s+'>'+gradeOpts+'</select>' +
      '</div>';
    }

    container.innerHTML = '<div class="aw-jamb" style="font-family:\'DM Sans\',system-ui,sans-serif;background:'+bg+';color:'+text+';border:1px solid '+border+';border-radius:10px;overflow:hidden">' +
      '<div style="padding:15px 22px;border-bottom:1px solid '+border+';background:'+cardBg+'">' +
        '<span style="font-size:.72rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase">JAMB Aggregate Score Calculator</span>' +
      '</div>' +
      '<div style="padding:22px">' +
        // Formula tabs
        '<div style="display:flex;gap:4px;background:'+(isDark?'#0f172a':'#f1f5f9')+';border-radius:8px;padding:4px;margin-bottom:14px">' + formulaTabs + '</div>' +
        '<div id="aw-jamb-desc" style="font-size:.72rem;color:#64748b;margin-bottom:14px;font-style:italic">'+FORMULAS.standard.desc+'</div>' +
        // UTME + Post-UTME
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px">' +
          '<div><label '+lbl+'>UTME Score (0-400)</label><input type="number" id="aw-jamb-utme" placeholder="250" min="0" max="400" '+s+'></div>' +
          '<div><label '+lbl+'>Post-UTME Score (0-100)</label><input type="number" id="aw-jamb-post" placeholder="65" min="0" max="100" '+s+'></div>' +
        '</div>' +
        // O'Level section (hidden by default)
        '<div id="aw-jamb-olevel" style="display:none;margin-bottom:14px">' +
          '<label '+lbl+'>O\'Level Grades (for UI formula)</label>' +
          olevelRows +
        '</div>' +
        // University + Course
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px">' +
          '<div><label '+lbl+'>University (optional)</label><select id="aw-jamb-uni" '+s+'>'+uniOpts+'</select></div>' +
          '<div><label '+lbl+'>Course</label><select id="aw-jamb-course" '+s+'><option value="">-- Select University First --</option></select></div>' +
        '</div>' +
        '<button id="aw-jamb-btn" style="display:block;width:100%;padding:12px;border:none;border-radius:8px;font-size:.82rem;font-weight:700;cursor:pointer;background:linear-gradient(135deg,#1e40af,'+accent+');color:#fff;font-family:inherit">Calculate Aggregate</button>' +
        '<div id="aw-jamb-result" style="display:none;margin-top:14px">' +
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">' +
            '<div style="text-align:center;padding:16px;background:'+(isDark?'#1e3a5f':'#eff6ff')+';border:1px solid '+(isDark?'#2563eb':'#bfdbfe')+';border-radius:8px;grid-column:1/-1"><div id="aw-jamb-score" style="font-size:2.4rem;font-weight:900;color:'+accent+'"></div><div id="aw-jamb-formula-used" style="font-size:.68rem;color:#64748b;font-weight:600;text-transform:uppercase;margin-top:3px"></div></div>' +
            '<div id="aw-jamb-cutoff-box" style="display:none;text-align:center;padding:14px;background:'+cardBg+';border:1px solid '+border+';border-radius:8px;grid-column:1/-1"><div id="aw-jamb-cutoff-text" style="font-size:.88rem;font-weight:700"></div></div>' +
          '</div>' +
          '<div id="aw-jamb-breakdown" style="margin-top:12px;padding:12px;background:'+cardBg+';border:1px solid '+border+';border-radius:8px;font-size:.78rem;color:#64748b;line-height:1.8;white-space:pre-line"></div>' +
        '</div>' +
        (opts.footerHTML ? '<div style="margin-top:14px">'+opts.footerHTML+'</div>' : '') +
      '</div>' +
    '</div>';

    var selectedFormula = 'standard';

    // Tab switching
    var tabs = container.querySelectorAll('.aw-jamb-tab');
    for (var t = 0; t < tabs.length; t++) {
      tabs[t].addEventListener('click', function() {
        selectedFormula = this.getAttribute('data-formula');
        for (var x = 0; x < tabs.length; x++) {
          tabs[x].style.background = 'transparent';
          tabs[x].style.color = text;
        }
        this.style.background = accent;
        this.style.color = '#fff';
        container.querySelector('#aw-jamb-desc').textContent = FORMULAS[selectedFormula].desc;
        container.querySelector('#aw-jamb-olevel').style.display = FORMULAS[selectedFormula].needsOlevel ? 'block' : 'none';
      });
    }

    // University -> Course filtering
    container.querySelector('#aw-jamb-uni').addEventListener('change', function() {
      var uni = this.value;
      var courseSel = container.querySelector('#aw-jamb-course');
      courseSel.innerHTML = '<option value="">-- Select Course --</option>';
      if (!uni) return;
      var courses = [];
      for (var c = 0; c < CUTOFFS.length; c++) {
        if (CUTOFFS[c].uni === uni && courses.indexOf(CUTOFFS[c].course) === -1) courses.push(CUTOFFS[c].course);
      }
      for (var cc = 0; cc < courses.length; cc++) {
        courseSel.innerHTML += '<option value="'+courses[cc]+'">'+courses[cc]+'</option>';
      }
    });

    function getOlevelTotal() {
      var gradeEls = container.querySelectorAll('.aw-jamb-subj-grade');
      var total = 0;
      for (var i = 0; i < gradeEls.length; i++) {
        var v = gradeEls[i].value;
        if (v !== '') total += parseInt(v);
      }
      return total;
    }

    function calc() {
      var utme = parseFloat(container.querySelector('#aw-jamb-utme').value);
      var postUtme = parseFloat(container.querySelector('#aw-jamb-post').value);
      if (isNaN(utme) || isNaN(postUtme)) return;
      if (utme < 0 || utme > 400 || postUtme < 0 || postUtme > 100) return;

      var aggregate = 0, steps = '';
      var olevel = getOlevelTotal();

      switch (selectedFormula) {
        case 'standard':
          aggregate = (utme / 8) + (postUtme / 2);
          steps = 'UTME: ' + utme + ' / 8 = ' + (utme/8).toFixed(2) + '\nPost-UTME: ' + postUtme + ' / 2 = ' + (postUtme/2).toFixed(2) + '\nAggregate: ' + aggregate.toFixed(2);
          break;
        case 'unilag':
          aggregate = ((utme / 4) * 0.5) + (postUtme * 0.5);
          steps = 'UTME: (' + utme + ' / 4) x 0.5 = ' + ((utme/4)*0.5).toFixed(2) + '\nPost-UTME: ' + postUtme + ' x 0.5 = ' + (postUtme*0.5).toFixed(2) + '\nAggregate: ' + aggregate.toFixed(2);
          break;
        case 'ui':
          if (olevel === 0) { steps = 'Please enter O\'Level grades for UI formula.'; break; }
          aggregate = ((utme / 4) * 0.375) + (postUtme * 0.25) + (olevel * 0.375);
          steps = 'UTME: (' + utme + ' / 4) x 0.375 = ' + ((utme/4)*0.375).toFixed(2) + '\nPost-UTME: ' + postUtme + ' x 0.25 = ' + (postUtme*0.25).toFixed(2) + '\nO\'Level: ' + olevel + ' x 0.375 = ' + (olevel*0.375).toFixed(2) + '\nAggregate: ' + aggregate.toFixed(2);
          break;
        case 'oau':
          aggregate = (utme / 8) + ((postUtme / 20) * 50);
          steps = 'UTME: ' + utme + ' / 8 = ' + (utme/8).toFixed(2) + '\nPost-UTME: (' + postUtme + ' / 20) x 50 = ' + ((postUtme/20)*50).toFixed(2) + '\nAggregate: ' + aggregate.toFixed(2);
          break;
        case 'unn':
          aggregate = ((utme / 400) * 50) + ((postUtme / 100) * 50);
          steps = 'UTME: (' + utme + ' / 400) x 50 = ' + ((utme/400)*50).toFixed(2) + '\nPost-UTME: (' + postUtme + ' / 100) x 50 = ' + ((postUtme/100)*50).toFixed(2) + '\nAggregate: ' + aggregate.toFixed(2);
          break;
      }

      container.querySelector('#aw-jamb-score').textContent = aggregate.toFixed(2);
      container.querySelector('#aw-jamb-formula-used').textContent = 'Formula: ' + FORMULAS[selectedFormula].name;
      container.querySelector('#aw-jamb-breakdown').textContent = steps;

      // Cutoff comparison
      var uni = container.querySelector('#aw-jamb-uni').value;
      var course = container.querySelector('#aw-jamb-course').value;
      var cutoffBox = container.querySelector('#aw-jamb-cutoff-box');
      if (uni && course) {
        var match = null;
        for (var c = 0; c < CUTOFFS.length; c++) {
          if (CUTOFFS[c].uni === uni && CUTOFFS[c].course === course) { match = CUTOFFS[c]; break; }
        }
        if (match) {
          var passes = aggregate >= match.cutoff;
          cutoffBox.style.display = 'block';
          cutoffBox.style.background = passes ? (isDark ? '#052e16' : '#dcfce7') : (isDark ? '#450a0a' : '#fef2f2');
          cutoffBox.style.borderColor = passes ? '#16a34a' : '#dc2626';
          container.querySelector('#aw-jamb-cutoff-text').innerHTML = uni + ' — ' + course + ': Cutoff <strong>' + match.cutoff + '</strong> | You: <strong>' + aggregate.toFixed(2) + '</strong> — <span style="color:' + (passes ? '#16a34a' : '#dc2626') + ';font-weight:800">' + (passes ? 'QUALIFIES' : 'BELOW CUTOFF') + '</span>';
        } else {
          cutoffBox.style.display = 'none';
        }
      } else {
        cutoffBox.style.display = 'none';
      }

      container.querySelector('#aw-jamb-result').style.display = 'block';
    }

    container.querySelector('#aw-jamb-btn').addEventListener('click', calc);
  };
})();
