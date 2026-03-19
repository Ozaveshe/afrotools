(function(){
  window.AfroWidgets = window.AfroWidgets || {};
  window.AfroWidgets.GPA = function(container, opts) {
    opts = opts || {};
    var theme = opts.theme || 'light';
    var isDark = theme === 'dark';
    var bg = isDark ? '#1a1a2e' : '#fff';
    var text = isDark ? '#e2e8f0' : '#0f1419';
    var border = isDark ? '#334155' : '#e2e8f0';
    var accent = '#2563eb';
    var inputBg = isDark ? '#0f172a' : '#f8fafc';
    var cardBg = isDark ? '#0f172a' : '#f8fafc';

    var SYSTEMS = {
      'nigerian-5': {
        name: '\u{1F1F3}\u{1F1EC} Nigerian Federal (5.0)',
        scale: 5.0,
        grades: { 'A': 5.0, 'B': 4.0, 'C': 3.0, 'D': 2.0, 'E': 1.0, 'F': 0.0 },
        classes: [{ name: 'First Class', min: 4.50 }, { name: '2nd Upper', min: 3.50 }, { name: '2nd Lower', min: 2.40 }, { name: 'Third', min: 1.50 }, { name: 'Pass', min: 1.00 }, { name: 'Fail', min: 0 }]
      },
      'nigerian-4': {
        name: '\u{1F1F3}\u{1F1EC} Nigerian Private (4.0)',
        scale: 4.0,
        grades: { 'A': 4.0, 'B+': 3.5, 'B': 3.0, 'C+': 2.5, 'C': 2.0, 'D': 1.0, 'F': 0.0 },
        classes: [{ name: 'First Class', min: 3.60 }, { name: '2.1', min: 3.00 }, { name: '2.2', min: 2.50 }, { name: 'Third', min: 2.00 }, { name: 'Pass', min: 1.00 }, { name: 'Fail', min: 0 }]
      },
      'kenyan': {
        name: '\u{1F1F0}\u{1F1EA} Kenyan (4.0 +/-)',
        scale: 4.0,
        grades: { 'A': 4.0, 'A-': 3.7, 'B+': 3.3, 'B': 3.0, 'B-': 2.7, 'C+': 2.3, 'C': 2.0, 'C-': 1.7, 'D+': 1.3, 'D': 1.0, 'D-': 0.7, 'E': 0.0 },
        classes: [{ name: 'First Class', min: 3.60 }, { name: '2.1', min: 3.00 }, { name: '2.2', min: 2.50 }, { name: 'Pass', min: 2.00 }, { name: 'Fail', min: 0 }]
      },
      'ghanaian': {
        name: '\u{1F1EC}\u{1F1ED} Ghanaian (4.0)',
        scale: 4.0,
        grades: { 'A': 4.0, 'B+': 3.5, 'B': 3.0, 'C+': 2.5, 'C': 2.0, 'D+': 1.5, 'D': 1.0, 'F': 0.0 },
        classes: [{ name: 'First Class', min: 3.60 }, { name: '2.1', min: 3.00 }, { name: '2.2', min: 2.50 }, { name: 'Third', min: 2.00 }, { name: 'Fail', min: 0 }]
      },
      'sa': {
        name: '\u{1F1FF}\u{1F1E6} South African (%)',
        scale: 100,
        inputType: 'percentage',
        grades: null,
        classes: [{ name: 'Distinction', min: 75 }, { name: 'Merit', min: 70 }, { name: 'Credit', min: 60 }, { name: 'Pass', min: 50 }, { name: 'Fail', min: 0 }]
      },
      'east-african': {
        name: '\u{1F30D} East African (5.0)',
        scale: 5.0,
        grades: { 'A': 5.0, 'B+': 4.0, 'B': 3.5, 'C+': 3.0, 'C': 2.5, 'C-': 2.0, 'D': 1.5, 'F': 0.0 },
        classes: [{ name: 'First Class', min: 4.40 }, { name: '2.1', min: 3.60 }, { name: '2.2', min: 2.80 }, { name: 'Pass', min: 2.00 }, { name: 'Fail', min: 0 }]
      },
      'ethiopian': {
        name: '\u{1F1EA}\u{1F1F9} Ethiopian (4.0)',
        scale: 4.0,
        grades: { 'A+': 4.0, 'A': 4.0, 'A-': 3.75, 'B+': 3.5, 'B': 3.0, 'B-': 2.75, 'C+': 2.5, 'C': 2.0, 'C-': 1.75, 'D': 1.0, 'F': 0.0 },
        classes: [{ name: 'Great Distinction', min: 3.75 }, { name: 'Distinction', min: 3.50 }, { name: 'Very Great Credit', min: 3.00 }, { name: 'Great Credit', min: 2.50 }, { name: 'Pass', min: 2.00 }, { name: 'Fail', min: 0 }]
      },
      'francophone': {
        name: '\u{1F30D} Francophone (/20)',
        scale: 20,
        inputType: 'score',
        grades: null,
        classes: [{ name: 'Tr\u00e8s Bien', min: 16 }, { name: 'Bien', min: 14 }, { name: 'Assez Bien', min: 12 }, { name: 'Passable', min: 10 }, { name: 'Fail', min: 0 }]
      },
      'egyptian': {
        name: '\u{1F1EA}\u{1F1EC} Egyptian (%)',
        scale: 100,
        inputType: 'percentage',
        grades: null,
        classes: [{ name: 'Excellent', min: 85 }, { name: 'Very Good', min: 75 }, { name: 'Good', min: 65 }, { name: 'Pass', min: 50 }, { name: 'Fail', min: 0 }]
      }
    };

    var maxCourses = 10;
    var s = 'style="width:100%;padding:9px 12px;border:1.5px solid '+border+';border-radius:7px;font-size:.82rem;background:'+inputBg+';color:'+text+';font-family:inherit;box-sizing:border-box"';
    var lbl = 'style="display:block;font-size:.72rem;font-weight:600;color:#64748b;margin-bottom:5px"';

    function buildGradeInput(systemKey, idx) {
      var sys = SYSTEMS[systemKey];
      if (sys.inputType === 'percentage' || sys.inputType === 'score') {
        var placeholder = sys.inputType === 'score' ? '/20' : '%';
        var max = sys.inputType === 'score' ? '20' : '100';
        return '<input type="number" class="aw-gpa-grade" placeholder="'+placeholder+'" min="0" max="'+max+'" step="0.5" '+s+'>';
      }
      var h = '<select class="aw-gpa-grade" '+s+'><option value="">Grade</option>';
      for (var g in sys.grades) h += '<option value="'+g+'">'+g+' ('+sys.grades[g]+')</option>';
      return h + '</select>';
    }

    function buildCourseRows(systemKey) {
      var h = '';
      for (var i = 0; i < maxCourses; i++) {
        h += '<div style="display:grid;grid-template-columns:2fr 1fr 1fr;gap:8px;margin-bottom:8px;padding:8px;background:'+cardBg+';border-radius:6px">' +
          '<input type="text" class="aw-gpa-name" placeholder="Course '+(i+1)+'" '+s+'>' +
          '<input type="number" class="aw-gpa-credits" placeholder="Units" min="1" max="12" step="1" '+s+'>' +
          buildGradeInput(systemKey, i) +
        '</div>';
      }
      return h;
    }

    container.innerHTML = '<div class="aw-gpa" style="font-family:\'DM Sans\',system-ui,sans-serif;background:'+bg+';color:'+text+';border:1px solid '+border+';border-radius:10px;overflow:hidden">' +
      '<div style="padding:15px 22px;border-bottom:1px solid '+border+';background:'+cardBg+'">' +
        '<span style="font-size:.72rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase">GPA / CGPA Calculator</span>' +
      '</div>' +
      '<div style="padding:22px">' +
        '<div style="margin-bottom:14px"><label '+lbl+'>Grading System</label>' +
          '<select id="aw-gpa-system" '+s+'>' +
            Object.keys(SYSTEMS).map(function(k){ return '<option value="'+k+'">'+SYSTEMS[k].name+'</option>'; }).join('') +
          '</select></div>' +
        '<div style="margin-bottom:8px;display:grid;grid-template-columns:2fr 1fr 1fr;gap:8px;font-size:.68rem;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:.04em;padding:0 8px">' +
          '<span>Course Name</span><span>Credit Units</span><span>Grade</span>' +
        '</div>' +
        '<div id="aw-gpa-courses">' + buildCourseRows('nigerian-5') + '</div>' +
        '<button id="aw-gpa-btn" style="display:block;width:100%;padding:12px;border:none;border-radius:8px;font-size:.82rem;font-weight:700;cursor:pointer;background:linear-gradient(135deg,#1e40af,'+accent+');color:#fff;font-family:inherit;margin-top:14px">Calculate GPA</button>' +
        '<div id="aw-gpa-result" style="display:none;margin-top:14px">' +
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">' +
            '<div style="text-align:center;padding:16px;background:'+(isDark?'#1e3a5f':'#eff6ff')+';border:1px solid '+(isDark?'#2563eb':'#bfdbfe')+';border-radius:8px;grid-column:1/-1"><div id="aw-gpa-val" style="font-size:2.2rem;font-weight:900;color:'+accent+'"></div><div style="font-size:.68rem;color:#64748b;font-weight:600;text-transform:uppercase;margin-top:3px">GPA</div></div>' +
            '<div style="text-align:center;padding:14px;background:'+cardBg+';border:1px solid '+border+';border-radius:8px"><div id="aw-gpa-class" style="font-size:1rem;font-weight:800;color:'+accent+'"></div><div style="font-size:.68rem;color:#64748b;font-weight:600;text-transform:uppercase;margin-top:3px">Classification</div></div>' +
            '<div style="text-align:center;padding:14px;background:'+cardBg+';border:1px solid '+border+';border-radius:8px"><div id="aw-gpa-credits-total" style="font-size:1rem;font-weight:800;color:'+text+'"></div><div style="font-size:.68rem;color:#64748b;font-weight:600;text-transform:uppercase;margin-top:3px">Total Credits</div></div>' +
          '</div>' +
        '</div>' +
        (opts.footerHTML ? '<div style="margin-top:14px">'+opts.footerHTML+'</div>' : '') +
      '</div>' +
    '</div>';

    container.querySelector('#aw-gpa-system').addEventListener('change', function() {
      container.querySelector('#aw-gpa-courses').innerHTML = buildCourseRows(this.value);
    });

    function calc() {
      var systemKey = container.querySelector('#aw-gpa-system').value;
      var sys = SYSTEMS[systemKey];
      var gradeEls = container.querySelectorAll('.aw-gpa-grade');
      var creditEls = container.querySelectorAll('.aw-gpa-credits');
      var totalPoints = 0, totalCredits = 0;

      for (var i = 0; i < gradeEls.length; i++) {
        var credits = parseFloat(creditEls[i].value) || 0;
        if (credits <= 0) continue;

        if (sys.inputType === 'percentage' || sys.inputType === 'score') {
          var val = parseFloat(gradeEls[i].value);
          if (!isNaN(val) && val >= 0) {
            totalPoints += Math.min(val, sys.scale) * credits;
            totalCredits += credits;
          }
        } else {
          var grade = gradeEls[i].value;
          if (grade && sys.grades[grade] !== undefined) {
            totalPoints += sys.grades[grade] * credits;
            totalCredits += credits;
          }
        }
      }

      if (totalCredits === 0) return;

      var gpa = totalPoints / totalCredits;
      var classification = 'Fail';
      for (var j = 0; j < sys.classes.length; j++) {
        if (gpa >= sys.classes[j].min) { classification = sys.classes[j].name; break; }
      }

      container.querySelector('#aw-gpa-val').textContent = gpa.toFixed(2) + ' / ' + sys.scale;
      container.querySelector('#aw-gpa-class').textContent = classification;
      container.querySelector('#aw-gpa-credits-total').textContent = totalCredits;

      container.querySelector('#aw-gpa-result').style.display = 'block';
    }

    container.querySelector('#aw-gpa-btn').addEventListener('click', calc);
  };
})();
