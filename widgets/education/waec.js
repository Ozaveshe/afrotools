(function(){
  window.AfroWidgets = window.AfroWidgets || {};
  window.AfroWidgets.WAEC = function(container, opts) {
    opts = opts || {};
    var theme = opts.theme || 'light';
    var isDark = theme === 'dark';
    var bg = isDark ? '#1a1a2e' : '#fff';
    var text = isDark ? '#e2e8f0' : '#0f1419';
    var border = isDark ? '#334155' : '#e2e8f0';
    var accent = '#059669';
    var inputBg = isDark ? '#0f172a' : '#f8fafc';
    var cardBg = isDark ? '#0f172a' : '#f8fafc';
    var s = 'style="width:100%;padding:9px 12px;border:1.5px solid '+border+';border-radius:7px;font-size:.82rem;background:'+inputBg+';color:'+text+';font-family:inherit;box-sizing:border-box"';
    var lbl = 'style="display:block;font-size:.72rem;font-weight:600;color:#64748b;margin-bottom:5px"';

    var GRADE_POINTS = { 'A1': 1, 'B2': 2, 'B3': 3, 'C4': 4, 'C5': 5, 'C6': 6, 'D7': 7, 'E8': 8, 'F9': 9 };

    var SUBJECTS = ['English Language', 'Mathematics', 'Physics', 'Chemistry', 'Biology',
      'Economics', 'Government', 'Literature', 'Geography', 'Accounting',
      'Commerce', 'CRS/IRS', 'Civic Education', 'Agricultural Science', 'Further Mathematics'];

    var gradeOpts = '<option value="">Grade</option>';
    for (var g in GRADE_POINTS) gradeOpts += '<option value="'+g+'">'+g+' ('+GRADE_POINTS[g]+')</option>';

    var subjOpts = '<option value="">-- Subject --</option>';
    for (var si = 0; si < SUBJECTS.length; si++) subjOpts += '<option value="'+SUBJECTS[si]+'">'+SUBJECTS[si]+'</option>';

    // Build mode tabs
    var modeTabStyle = function(active) {
      return 'style="flex:1;padding:8px 4px;text-align:center;border:none;border-radius:6px;cursor:pointer;font-size:.72rem;font-weight:600;font-family:inherit;' +
        (active ? 'background:'+accent+';color:#fff' : 'background:transparent;color:'+text) + '"';
    };

    // Build 9 subject rows
    var subjectRows = '';
    for (var i = 0; i < 9; i++) {
      subjectRows += '<div style="display:grid;grid-template-columns:2fr 1fr;gap:8px;margin-bottom:6px">' +
        '<select class="aw-waec-subj" '+s+'>'+subjOpts+'</select>' +
        '<select class="aw-waec-grade" '+s+'>'+gradeOpts+'</select>' +
      '</div>';
    }

    container.innerHTML = '<div class="aw-waec" style="font-family:\'DM Sans\',system-ui,sans-serif;background:'+bg+';color:'+text+';border:1px solid '+border+';border-radius:10px;overflow:hidden">' +
      '<div style="padding:15px 22px;border-bottom:1px solid '+border+';background:'+cardBg+'">' +
        '<span style="font-size:.72rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase">WAEC / NECO Grade Calculator</span>' +
      '</div>' +
      '<div style="padding:22px">' +
        // Mode tabs
        '<div style="display:flex;gap:4px;background:'+(isDark?'#0f172a':'#f1f5f9')+';border-radius:8px;padding:4px;margin-bottom:14px">' +
          '<button class="aw-waec-mode" data-mode="nigeria" '+modeTabStyle(true)+'>Nigeria (Best 5)</button>' +
          '<button class="aw-waec-mode" data-mode="ghana" '+modeTabStyle(false)+'>Ghana WASSCE (Best 6)</button>' +
        '</div>' +
        '<div id="aw-waec-mode-desc" style="font-size:.72rem;color:#64748b;margin-bottom:14px;font-style:italic">Nigerian WAEC/NECO: Sum of best 5 subject grades (A1=1 ... F9=9)</div>' +
        // Subject rows
        '<div style="margin-bottom:6px;display:grid;grid-template-columns:2fr 1fr;gap:8px;font-size:.68rem;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:.04em">' +
          '<span>Subject</span><span>Grade</span>' +
        '</div>' +
        subjectRows +
        '<button id="aw-waec-btn" style="display:block;width:100%;padding:12px;border:none;border-radius:8px;font-size:.82rem;font-weight:700;cursor:pointer;background:linear-gradient(135deg,#047857,'+accent+');color:#fff;font-family:inherit;margin-top:14px">Calculate Aggregate</button>' +
        '<div id="aw-waec-result" style="display:none;margin-top:14px">' +
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">' +
            '<div id="aw-waec-agg-box" style="text-align:center;padding:16px;border-radius:8px;grid-column:1/-1"><div id="aw-waec-agg" style="font-size:2.4rem;font-weight:900"></div><div id="aw-waec-agg-label" style="font-size:.68rem;color:#64748b;font-weight:600;text-transform:uppercase;margin-top:3px"></div></div>' +
            '<div style="text-align:center;padding:14px;background:'+cardBg+';border:1px solid '+border+';border-radius:8px"><div id="aw-waec-class" style="font-size:1rem;font-weight:800"></div><div style="font-size:.68rem;color:#64748b;font-weight:600;text-transform:uppercase;margin-top:3px">Classification</div></div>' +
            '<div style="text-align:center;padding:14px;background:'+cardBg+';border:1px solid '+border+';border-radius:8px"><div id="aw-waec-count" style="font-size:1rem;font-weight:800;color:'+text+'"></div><div style="font-size:.68rem;color:#64748b;font-weight:600;text-transform:uppercase;margin-top:3px">Subjects Entered</div></div>' +
          '</div>' +
        '</div>' +
        (opts.footerHTML ? '<div style="margin-top:14px">'+opts.footerHTML+'</div>' : '') +
      '</div>' +
    '</div>';

    var currentMode = 'nigeria';

    // Mode tab switching
    var modeTabs = container.querySelectorAll('.aw-waec-mode');
    for (var m = 0; m < modeTabs.length; m++) {
      modeTabs[m].addEventListener('click', function() {
        currentMode = this.getAttribute('data-mode');
        for (var x = 0; x < modeTabs.length; x++) {
          modeTabs[x].style.background = 'transparent';
          modeTabs[x].style.color = text;
        }
        this.style.background = accent;
        this.style.color = '#fff';
        container.querySelector('#aw-waec-mode-desc').textContent = currentMode === 'nigeria'
          ? 'Nigerian WAEC/NECO: Sum of best 5 subject grades (A1=1 ... F9=9)'
          : 'Ghana WASSCE: Sum of best 6 subject grades (A1=1 ... F9=9)';
      });
    }

    function calc() {
      var gradeEls = container.querySelectorAll('.aw-waec-grade');
      var subjEls = container.querySelectorAll('.aw-waec-subj');
      var points = [];

      for (var i = 0; i < gradeEls.length; i++) {
        var grade = gradeEls[i].value;
        var subj = subjEls[i].value;
        if (grade && subj && GRADE_POINTS[grade] !== undefined) {
          points.push(GRADE_POINTS[grade]);
        }
      }

      if (points.length === 0) return;

      points.sort(function(a, b) { return a - b; });

      var bestN = currentMode === 'nigeria' ? 5 : 6;
      var best = points.slice(0, bestN);
      var aggregate = 0;
      for (var j = 0; j < best.length; j++) aggregate += best[j];

      var classification, classColor;
      if (currentMode === 'nigeria') {
        if (aggregate <= 9) { classification = 'First Class'; classColor = '#16a34a'; }
        else if (aggregate <= 15) { classification = 'Credit'; classColor = '#d97706'; }
        else if (aggregate <= 20) { classification = 'Pass'; classColor = '#2563eb'; }
        else { classification = 'Fail'; classColor = '#dc2626'; }
      } else {
        // Ghana WASSCE
        if (aggregate <= 12) { classification = 'Excellent'; classColor = '#16a34a'; }
        else if (aggregate <= 18) { classification = 'Credit'; classColor = '#d97706'; }
        else if (aggregate <= 24) { classification = 'Pass'; classColor = '#2563eb'; }
        else { classification = 'Needs Improvement'; classColor = '#dc2626'; }
      }

      var aggBox = container.querySelector('#aw-waec-agg-box');
      aggBox.style.background = classColor + '15';
      aggBox.style.border = '1px solid ' + classColor + '40';
      container.querySelector('#aw-waec-agg').textContent = aggregate;
      container.querySelector('#aw-waec-agg').style.color = classColor;
      container.querySelector('#aw-waec-agg-label').textContent = 'Best ' + bestN + ' Aggregate';
      container.querySelector('#aw-waec-class').textContent = classification;
      container.querySelector('#aw-waec-class').style.color = classColor;
      container.querySelector('#aw-waec-count').textContent = points.length;

      container.querySelector('#aw-waec-result').style.display = 'block';
    }

    container.querySelector('#aw-waec-btn').addEventListener('click', calc);
  };
})();
