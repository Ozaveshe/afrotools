/* ===================================================================
   AfroTools WAEC Calculator — Main Application
   Aggregate calculation, admission checker, converter, requirements.
   =================================================================== */
(function () {
  'use strict';

  var state = { system: 'ng-waec', track: '', subjects: [], aggregate: 0, credits: 0 };
  var calcTimer = null;

  function $(id) { return document.getElementById(id); }
  function qs(sel, ctx) { return (ctx || document).querySelector(sel); }
  function qsa(sel, ctx) { return (ctx || document).querySelectorAll(sel); }
  function getSys() { return (typeof WAEC_EXAM_SYSTEMS !== 'undefined' && WAEC_EXAM_SYSTEMS[state.system]) ? WAEC_EXAM_SYSTEMS[state.system] : null; }
  function escHtml(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
  function track(ev, data) { if (typeof gtag === 'function') gtag('event', ev, data || {}); }

  // ─── INIT ────────────────────────────────────────────────────────
  function init() {
    populateExamSystems();
    setupTabs();
    setupSystemSelector();
    setupTrackSelector();
    setupFAQ();
    setupSharing();
    loadState();
    onSystemChange();
    if (state.subjects.length === 0) loadDefaultSubjects();
    track('tool_opened', { system: state.system });
  }
  document.addEventListener('DOMContentLoaded', init);

  // ─── TABS ────────────────────────────────────────────────────────
  function setupTabs() {
    qsa('.wc-tab').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var tabId = this.getAttribute('data-tab');
        qsa('.wc-tab').forEach(function (b) { b.classList.remove('active'); b.setAttribute('aria-selected', 'false'); });
        qsa('.wc-tab-content').forEach(function (c) { c.classList.remove('active'); });
        this.classList.add('active'); this.setAttribute('aria-selected', 'true');
        var panel = $(tabId); if (panel) panel.classList.add('active');
        if (tabId === 'tab-admission') setupAdmissionTab();
        if (tabId === 'tab-converter') renderConverterTable();
        if (tabId === 'tab-requirements') setupRequirementsTab();
        track('tab_switched', { to: tabId });
      });
    });
  }

  // ─── EXAM SYSTEM SELECTOR ───────────────────────────────────────
  function populateExamSystems() {
    var sel = $('examSystem');
    if (!sel || typeof WAEC_EXAM_SYSTEMS === 'undefined') return;
    sel.innerHTML = '';
    for (var key in WAEC_EXAM_SYSTEMS) {
      if (!WAEC_EXAM_SYSTEMS.hasOwnProperty(key)) continue;
      var sys = WAEC_EXAM_SYSTEMS[key];
      sel.innerHTML += '<option value="' + key + '">' + sys.flag + ' ' + sys.name + '</option>';
    }
    sel.value = state.system;
  }

  function setupSystemSelector() {
    var sel = $('examSystem');
    if (!sel) return;
    sel.addEventListener('change', function () {
      state.system = this.value;
      state.track = '';
      state.subjects = [];
      onSystemChange();
      loadDefaultSubjects();
      saveState();
    });
  }

  function onSystemChange() {
    var sys = getSys();
    if (!sys) return;
    updateBestOfInfo(sys);
    populateTracks();
    updateAggregateScale(sys);
  }

  function updateBestOfInfo(sys) {
    var el = $('bestOfInfo');
    if (!el) return;
    var text = sys.flag + ' <strong>' + sys.name + '</strong> \u2014 ';
    if (sys.bestOfRule) text += sys.bestOfRule;
    else text += 'Best ' + sys.bestOf + ' subjects';
    if (sys.minCredit) text += ' (minimum credit: ' + sys.minCredit + ')';
    el.innerHTML = text;
  }

  function updateAggregateScale(sys) {
    var maxLabel = $('aggMaxLabel');
    var bestOfLabel = $('resultBestOf');
    if (!sys) return;
    var max = sys.bestOf * 9;
    if (maxLabel) maxLabel.textContent = max + ' (Worst)';
    if (bestOfLabel) bestOfLabel.textContent = sys.bestOfRule || ('Best ' + sys.bestOf + ' subjects');
  }

  // ─── TRACKS ──────────────────────────────────────────────────────
  function populateTracks() {
    var trackGroup = $('trackGroup');
    var trackSel = $('trackSelect');
    if (!trackGroup || !trackSel) return;

    var subData = typeof WAEC_SUBJECTS !== 'undefined' ? WAEC_SUBJECTS[state.system] : null;
    if (!subData || !subData.tracks) { trackGroup.style.display = 'none'; return; }

    trackGroup.style.display = '';
    trackSel.innerHTML = '<option value="">Select Track (Optional)</option>';
    for (var key in subData.tracks) {
      if (!subData.tracks.hasOwnProperty(key)) continue;
      var t = subData.tracks[key];
      trackSel.innerHTML += '<option value="' + key + '">' + t.icon + ' ' + t.name + '</option>';
    }
    trackSel.innerHTML += '<option value="custom">\u270F\uFE0F Custom (pick my own)</option>';
    trackSel.value = state.track || '';
  }

  function setupTrackSelector() {
    var sel = $('trackSelect');
    if (!sel) return;
    sel.addEventListener('change', function () {
      state.track = this.value;
      state.subjects = [];
      loadDefaultSubjects();
      saveState();
    });
  }

  // ─── SUBJECTS ────────────────────────────────────────────────────
  function loadDefaultSubjects() {
    var sys = getSys();
    if (!sys) return;

    state.subjects = [];
    var subData = typeof WAEC_SUBJECTS !== 'undefined' ? WAEC_SUBJECTS[state.system] : null;

    // Add compulsory subjects
    var compulsory = (subData && subData.compulsory) ? subData.compulsory : (sys.includeCompulsory || []);
    compulsory.forEach(function (name) {
      state.subjects.push({ name: name, grade: '', compulsory: true });
    });

    // Add track subjects
    if (subData && subData.tracks && state.track && state.track !== 'custom' && subData.tracks[state.track]) {
      subData.tracks[state.track].subjects.forEach(function (name) {
        state.subjects.push({ name: name, grade: '', compulsory: false });
      });
    }

    // Ensure minimum subject count
    var needed = Math.max((sys.bestOf || 5) + 1, 6);
    while (state.subjects.length < needed) {
      state.subjects.push({ name: '', grade: '', compulsory: false });
    }

    renderSubjects();
  }

  function renderSubjects() {
    var container = $('subjectsContainer');
    if (!container) return;
    container.innerHTML = '';
    var sys = getSys();
    state.subjects.forEach(function (sub, idx) {
      container.appendChild(buildSubjectRow(sub, idx, sys));
    });
    scheduleCalc();
  }

  function buildSubjectRow(sub, idx, sys) {
    var row = document.createElement('div');
    row.className = 'wc-subject-row' + (sub.compulsory ? ' compulsory' : '');

    // Name
    var nameEl = document.createElement('div');
    nameEl.className = 'wc-subject-name';
    if (sub.compulsory) {
      nameEl.innerHTML = escHtml(sub.name) + ' <span class="tag">Required</span>';
    } else if (sub.name) {
      nameEl.textContent = sub.name;
    } else {
      var nameInput = document.createElement('input');
      nameInput.type = 'text';
      nameInput.className = 'wc-input';
      nameInput.placeholder = 'Subject name';
      nameInput.value = sub.name || '';
      nameInput.addEventListener('input', function () { state.subjects[idx].name = this.value; saveState(); });
      nameEl.appendChild(nameInput);
    }

    // Grade
    var gradeEl;
    if (sys && (sys.inputType === 'percentage' || sys.inputType === 'score')) {
      gradeEl = document.createElement('input');
      gradeEl.type = 'number';
      gradeEl.className = 'wc-input';
      gradeEl.placeholder = sys.inputType === 'score' ? '/20' : '%';
      gradeEl.min = '0';
      gradeEl.max = sys.inputType === 'score' ? String(sys.scoreMax || 20) : '100';
      gradeEl.step = '0.5';
      gradeEl.value = sub.grade || '';
      gradeEl.addEventListener('input', function () { state.subjects[idx].grade = this.value; scheduleCalc(); saveState(); });
    } else if (sys && sys.grades) {
      gradeEl = document.createElement('select');
      gradeEl.className = 'wc-grade-select';
      gradeEl.innerHTML = '<option value="">\u2014</option>';
      for (var g in sys.grades) {
        if (!sys.grades.hasOwnProperty(g)) continue;
        var opt = document.createElement('option');
        opt.value = g;
        opt.textContent = g + ' (' + sys.grades[g].label + ')';
        opt.style.color = sys.grades[g].color;
        if (sub.grade === g) opt.selected = true;
        gradeEl.appendChild(opt);
      }
      gradeEl.addEventListener('change', function () { state.subjects[idx].grade = this.value; scheduleCalc(); saveState(); });
    } else {
      gradeEl = document.createElement('input');
      gradeEl.type = 'text';
      gradeEl.className = 'wc-input';
      gradeEl.placeholder = 'Grade';
      gradeEl.value = sub.grade || '';
      gradeEl.addEventListener('input', function () { state.subjects[idx].grade = this.value; scheduleCalc(); saveState(); });
    }

    // Delete
    var delBtn = document.createElement('button');
    delBtn.className = 'wc-subject-delete';
    delBtn.innerHTML = '\u00D7';
    delBtn.setAttribute('aria-label', 'Remove subject');
    if (sub.compulsory) { delBtn.disabled = true; delBtn.style.opacity = '0.2'; delBtn.style.cursor = 'default'; }
    else delBtn.addEventListener('click', function () { state.subjects.splice(idx, 1); renderSubjects(); saveState(); });

    row.appendChild(nameEl);
    row.appendChild(gradeEl);
    row.appendChild(delBtn);
    return row;
  }

  // Add subject button
  document.addEventListener('DOMContentLoaded', function () {
    var btn = $('addSubjectBtn');
    if (btn) btn.addEventListener('click', function () {
      state.subjects.push({ name: '', grade: '', compulsory: false });
      renderSubjects();
      saveState();
    });
  });

  // ─── CALCULATION ─────────────────────────────────────────────────
  function scheduleCalc() { clearTimeout(calcTimer); calcTimer = setTimeout(calculate, 150); }

  function calculate() {
    var sys = getSys();
    if (!sys) return;

    // Get all subjects with valid grades
    var scored = [];
    var totalCredits = 0;

    state.subjects.forEach(function (sub) {
      if (!sub.grade) return;
      var points = getPoints(sub.grade, sys);
      if (points === null) return;
      scored.push({ name: sub.name, grade: sub.grade, points: points, compulsory: sub.compulsory });
      if (sys.grades && sys.minCredit) {
        var minPts = sys.grades[sys.minCredit] ? sys.grades[sys.minCredit].points : 6;
        if (points <= minPts) totalCredits++;
      }
    });

    if (scored.length === 0) {
      renderEmptyResults(sys);
      return;
    }

    // Sort by points (ascending = best first for WAEC-style, descending for KCSE)
    var isHigherBetter = (sys.id === 'ke-kcse');
    scored.sort(function (a, b) { return isHigherBetter ? b.points - a.points : a.points - b.points; });

    // Select best N, ensuring compulsory subjects are included
    var bestOf = sys.bestOf || 5;
    var selected = selectBest(scored, bestOf, sys);

    // Calculate aggregate
    var aggregate = 0;
    selected.forEach(function (s) { aggregate += s.points; });

    state.aggregate = aggregate;
    state.credits = totalCredits;

    // Classification
    var cls = getClassification(aggregate, sys);

    renderResults(aggregate, selected, scored.length, totalCredits, cls, sys, bestOf);
    renderEligibility(aggregate, totalCredits, sys);
    updateMobileBar(aggregate, cls);

    track('calculation_completed', { aggregate: aggregate, system: state.system, subjects: scored.length });
  }

  function getPoints(grade, sys) {
    if (sys.inputType === 'percentage' || sys.inputType === 'score') {
      var val = parseFloat(grade);
      return isNaN(val) ? null : val;
    }
    if (sys.grades && sys.grades[grade]) return sys.grades[grade].points;
    return null;
  }

  function selectBest(scored, bestOf, sys) {
    // Ensure compulsory subjects are always included
    var compulsory = scored.filter(function (s) { return s.compulsory; });
    var optional = scored.filter(function (s) { return !s.compulsory; });
    var remaining = bestOf - compulsory.length;
    if (remaining < 0) remaining = 0;
    return compulsory.concat(optional.slice(0, remaining));
  }

  function getClassification(aggregate, sys) {
    var ranges = sys.aggregateRanges || sys.classifications || sys.divisions;
    if (!ranges) return null;
    for (var i = 0; i < ranges.length; i++) {
      var r = ranges[i];
      if (aggregate >= r.min && aggregate <= r.max) return r;
    }
    return null;
  }

  // ─── RESULTS RENDERING ──────────────────────────────────────────
  function renderResults(aggregate, selected, totalSubjects, credits, cls, sys, bestOf) {
    var aggEl = $('resultAggregate');
    if (aggEl) aggEl.textContent = aggregate;

    var subsEl = $('resultSubjects');
    if (subsEl) subsEl.textContent = totalSubjects;

    var credEl = $('resultCredits');
    if (credEl) credEl.textContent = credits;

    // Aggregate bar
    var maxAgg = bestOf * 9;
    var minAgg = bestOf;
    var fill = $('aggFill');
    if (fill) {
      var pct = 100 - ((aggregate - minAgg) / (maxAgg - minAgg) * 100);
      fill.style.width = Math.max(pct, 2) + '%';
      fill.style.background = cls ? cls.color : 'var(--wc-text-muted)';
    }

    // Badge
    var badge = $('classBadge');
    if (badge && cls) {
      badge.textContent = cls.name;
      badge.style.background = hexToRgba(cls.color, 0.15);
      badge.style.color = cls.color;
    } else if (badge) {
      badge.textContent = 'Aggregate: ' + aggregate;
      badge.style.background = 'rgba(148,163,184,0.1)';
      badge.style.color = 'var(--wc-text-muted)';
    }

    // Selected subjects display
    var selEl = $('selectedSubjects');
    if (selEl && selected.length > 0) {
      selEl.style.display = '';
      selEl.innerHTML = '<strong>Best ' + bestOf + ':</strong> ' + selected.map(function (s) { return s.name + ' (' + s.grade + ')'; }).join(', ');
    }

    // Mark selected rows
    qsa('.wc-subject-row').forEach(function (row, idx) {
      row.classList.remove('selected');
    });
    // Re-mark selected
    selected.forEach(function (sel) {
      state.subjects.forEach(function (sub, idx) {
        if (sub.name === sel.name && sub.grade === sel.grade) {
          var rows = qsa('.wc-subject-row');
          if (rows[idx]) rows[idx].classList.add('selected');
        }
      });
    });
  }

  function renderEmptyResults(sys) {
    var aggEl = $('resultAggregate');
    if (aggEl) aggEl.textContent = '--';
    var badge = $('classBadge');
    if (badge) { badge.textContent = 'Enter grades to see classification'; badge.style.background = 'rgba(148,163,184,0.1)'; badge.style.color = 'var(--wc-text-muted)'; }
    var fill = $('aggFill');
    if (fill) fill.style.width = '0';
  }

  function renderEligibility(aggregate, credits, sys) {
    var list = $('eligibilityList');
    if (!list) return;
    if (credits === 0) { list.innerHTML = '<p style="font-size:0.82rem;color:var(--wc-text-muted);">Enter grades to check eligibility.</p>'; return; }

    var checks = [];
    var hasEng = state.subjects.some(function (s) { return s.name === 'English Language' && s.grade && getPoints(s.grade, sys) <= 6; });
    var hasMath = state.subjects.some(function (s) { return s.name === 'Mathematics' && s.grade && getPoints(s.grade, sys) <= 6; });

    checks.push({ label: 'English Language (C6+)', pass: hasEng });
    checks.push({ label: 'Mathematics (C6+)', pass: hasMath });
    checks.push({ label: '5 Credits minimum', pass: credits >= 5 });
    checks.push({ label: 'Aggregate \u2264 20', pass: aggregate <= 20 });

    list.innerHTML = checks.map(function (c) {
      var cls = c.pass ? 'pass' : 'fail';
      var icon = c.pass ? '\u2705' : '\u274C';
      return '<div class="wc-elig-item ' + cls + '"><span>' + c.label + '</span><span>' + icon + '</span></div>';
    }).join('');
  }

  function updateMobileBar(aggregate, cls) {
    var aggEl = $('mobileAgg');
    var clsEl = $('mobileClass');
    if (aggEl) aggEl.textContent = aggregate || '--';
    if (clsEl && cls) { clsEl.textContent = cls.name; clsEl.style.background = hexToRgba(cls.color, 0.15); clsEl.style.color = cls.color; }
    else if (clsEl) { clsEl.textContent = '\u2014'; clsEl.style.background = 'rgba(148,163,184,0.1)'; clsEl.style.color = 'var(--wc-text-muted)'; }
  }

  function hexToRgba(hex, a) { if (!hex || hex[0] !== '#') return 'rgba(148,163,184,'+a+')'; return 'rgba('+parseInt(hex.slice(1,3),16)+','+parseInt(hex.slice(3,5),16)+','+parseInt(hex.slice(5,7),16)+','+a+')'; }

  // ─── ADMISSION CHECKER (TAB 2) ──────────────────────────────────
  function setupAdmissionTab() {
    var country = state.system.startsWith('ng') ? 'ng' : state.system.startsWith('gh') ? 'gh' : null;
    if (!country || typeof WAEC_UNIVERSITIES === 'undefined' || !WAEC_UNIVERSITIES[country]) {
      $('tab-admission').querySelector('.wc-section').innerHTML = '<p style="color:var(--wc-text-secondary);">University admission checker is available for Nigerian and Ghanaian universities. Select a Nigerian or Ghanaian exam system to use this feature.</p>';
      return;
    }

    var uniData = WAEC_UNIVERSITIES[country];
    var groupSel = $('admUniGroup');
    var uniSel = $('admUniversity');
    var courseGroupSel = $('admCourseGroup');
    var courseSel = $('admCourse');

    // Populate university groups
    if (groupSel) {
      groupSel.innerHTML = '<option value="">Select type</option>';
      for (var gk in uniData.groups) {
        if (!uniData.groups.hasOwnProperty(gk)) continue;
        groupSel.innerHTML += '<option value="' + gk + '">' + uniData.groups[gk].label + '</option>';
      }
      groupSel.onchange = function () {
        var g = uniData.groups[this.value];
        if (!g || !uniSel) return;
        uniSel.innerHTML = '<option value="">Select university</option>';
        g.schools.forEach(function (s) {
          uniSel.innerHTML += '<option value="' + s.id + '" data-cutoff="' + s.cutoff + '">' + s.name + '</option>';
        });
      };
    }

    // Populate course groups
    if (courseGroupSel && typeof WAEC_COURSES !== 'undefined') {
      courseGroupSel.innerHTML = '<option value="">Select category</option>';
      for (var ck in WAEC_COURSES) {
        if (!WAEC_COURSES.hasOwnProperty(ck)) continue;
        courseGroupSel.innerHTML += '<option value="' + ck + '">' + WAEC_COURSES[ck].label + '</option>';
      }
      courseGroupSel.onchange = function () {
        var cat = WAEC_COURSES[this.value];
        if (!cat || !courseSel) return;
        courseSel.innerHTML = '<option value="">Select course</option>';
        cat.courses.forEach(function (c) {
          courseSel.innerHTML += '<option value="' + c.id + '">' + c.name + '</option>';
        });
      };
    }

    // Eligibility check button
    var btn = $('checkEligibilityBtn');
    if (btn) btn.onclick = checkAdmission;
  }

  function checkAdmission() {
    var courseGroupKey = ($('admCourseGroup') || {}).value;
    var courseKey = ($('admCourse') || {}).value;
    var uniGroupKey = ($('admUniGroup') || {}).value;
    var uniKey = ($('admUniversity') || {}).value;
    var jambScore = parseInt(($('admJamb') || {}).value) || 0;
    if (jambScore > 400) {
      jambScore = 400;
      var jambInput = $('admJamb');
      if (jambInput) jambInput.value = 400;
      showToast('Maximum JAMB score is 400');
    }

    if (!courseGroupKey || !courseKey) { showToast('Select a course first.'); return; }

    var cat = typeof WAEC_COURSES !== 'undefined' ? WAEC_COURSES[courseGroupKey] : null;
    if (!cat) return;
    var course = cat.courses.find(function (c) { return c.id === courseKey; });
    if (!course) return;

    // Check O-Level requirements
    var sys = getSys();
    var results = [];
    var allMet = true;

    course.required.forEach(function (reqSubject) {
      var found = state.subjects.find(function (s) { return s.name === reqSubject && s.grade; });
      var met = false;
      if (found && sys && sys.grades) {
        var pts = getPoints(found.grade, sys);
        var minPts = sys.grades[course.minGrade] ? sys.grades[course.minGrade].points : 6;
        met = pts !== null && pts <= minPts;
      }
      if (!met) allMet = false;
      results.push({ subject: reqSubject, met: met, grade: found ? found.grade : 'Not entered' });
    });

    // JAMB check
    var uniOption = $('admUniversity') ? $('admUniversity').selectedOptions[0] : null;
    var uniCutoff = uniOption ? parseInt(uniOption.getAttribute('data-cutoff')) || 0 : 0;
    var jambMet = jambScore >= Math.max(uniCutoff, course.typicalCutoff);

    // Render result
    var resultEl = $('admissionResult');
    if (!resultEl) return;

    var html = '<div class="wc-admission-card">';
    html += '<h3>' + escHtml(course.name) + '</h3>';
    html += '<div style="margin:12px 0;">';

    results.forEach(function (r) {
      var cls = r.met ? 'pass' : 'fail';
      var icon = r.met ? '\u2705' : '\u274C';
      html += '<div class="req"><span>' + icon + ' ' + escHtml(r.subject) + '</span><span style="font-family:var(--wc-mono);font-size:0.8rem;">' + r.grade + '</span></div>';
    });

    html += '</div>';

    if (jambScore > 0) {
      var jCls = jambMet ? 'pass' : 'fail';
      html += '<div class="wc-elig-item ' + jCls + '"><span>JAMB Score: ' + jambScore + '</span><span>' + (jambMet ? '\u2705 Above cut-off' : '\u274C Below cut-off (' + Math.max(uniCutoff, course.typicalCutoff) + ')') + '</span></div>';
    }

    html += '<div style="margin-top:12px;padding:12px;border-radius:8px;text-align:center;font-weight:600;' +
      (allMet ? 'background:rgba(16,185,129,0.1);color:#10B981;">O-Level Requirements Met \u2705' : 'background:rgba(239,68,68,0.08);color:#F87171;">Missing O-Level Requirements \u274C') +
      '</div>';

    if (course.jambSubjects) {
      html += '<div style="margin-top:8px;font-size:0.8rem;color:var(--wc-text-muted);">JAMB subjects: ' + course.jambSubjects.join(', ') + '</div>';
    }

    html += '</div>';
    resultEl.innerHTML = html;
  }

  // ─── GPA CONVERTER (TAB 3) ─────────────────────────────────────
  function renderConverterTable() {
    var container = $('converterTable');
    if (!container) return;
    container.innerHTML = '<table class="wc-ref-table"><thead><tr><th>O-Level Grade</th><th>Points</th><th>Nigerian 5.0</th><th>US 4.0</th><th>UK Class</th></tr></thead><tbody>' +
      convRow('A1', '1', '5.0 (A)', '4.0 (A)', 'First Class') +
      convRow('B2', '2', '4.0 (B)', '3.5 (B+)', 'Upper Second') +
      convRow('B3', '3', '3.5 (B)', '3.0 (B)', 'Upper Second') +
      convRow('C4', '4', '3.0 (C)', '2.5 (C+)', 'Lower Second') +
      convRow('C5', '5', '2.5 (C)', '2.0 (C)', 'Lower Second') +
      convRow('C6', '6', '2.0 (D)', '1.5 (D+)', 'Third Class') +
      convRow('D7', '7', '1.0 (E)', '1.0 (D)', 'Pass') +
      convRow('E8', '8', '0.5', '0.5', 'Fail') +
      convRow('F9', '9', '0.0 (F)', '0.0 (F)', 'Fail') +
      '</tbody></table>';
  }

  function convRow(g, pts, n5, us, uk) {
    return '<tr><td><strong>' + g + '</strong></td><td>' + pts + '</td><td>' + n5 + '</td><td>' + us + '</td><td>' + uk + '</td></tr>';
  }

  // ─── SUBJECT REQUIREMENTS (TAB 4) ──────────────────────────────
  function setupRequirementsTab() {
    var groupSel = $('reqCourseGroup');
    var courseSel = $('reqCourse');
    if (!groupSel || !courseSel || typeof WAEC_COURSES === 'undefined') return;

    groupSel.innerHTML = '<option value="">Select category</option>';
    for (var ck in WAEC_COURSES) {
      if (!WAEC_COURSES.hasOwnProperty(ck)) continue;
      groupSel.innerHTML += '<option value="' + ck + '">' + WAEC_COURSES[ck].label + '</option>';
    }

    groupSel.onchange = function () {
      var cat = WAEC_COURSES[this.value];
      if (!cat) return;
      courseSel.innerHTML = '<option value="">Select course</option>';
      cat.courses.forEach(function (c) {
        courseSel.innerHTML += '<option value="' + c.id + '">' + c.name + '</option>';
      });
    };

    courseSel.onchange = function () {
      var catKey = groupSel.value;
      var courseKey = this.value;
      if (!catKey || !courseKey) return;
      var cat = WAEC_COURSES[catKey];
      if (!cat) return;
      var course = cat.courses.find(function (c) { return c.id === courseKey; });
      if (!course) return;
      renderRequirements(course);
    };
  }

  function renderRequirements(course) {
    var el = $('requirementsResult');
    if (!el) return;

    var html = '<div class="wc-admission-card" style="margin-top:16px;">';
    html += '<h3>' + escHtml(course.name) + '</h3>';
    html += '<div style="margin:12px 0;">';
    html += '<div style="font-size:0.78rem;color:var(--wc-text-muted);margin-bottom:8px;text-transform:uppercase;letter-spacing:0.04em;">Required O-Level Subjects (min. ' + course.minGrade + ')</div>';

    course.required.forEach(function (s) {
      html += '<div class="req"><span>\u2713 ' + escHtml(s) + '</span><span style="font-size:0.8rem;color:var(--wc-accent);">min. ' + course.minGrade + '</span></div>';
    });

    html += '</div>';

    if (course.jambSubjects) {
      html += '<div style="margin-top:12px;padding:12px;background:var(--wc-primary-mid);border-radius:8px;">';
      html += '<div style="font-size:0.78rem;color:var(--wc-text-muted);margin-bottom:4px;text-transform:uppercase;">JAMB Subjects</div>';
      html += '<div style="font-size:0.88rem;color:var(--wc-text);">' + course.jambSubjects.join(', ') + '</div>';
      html += '</div>';
    }

    if (course.typicalCutoff) {
      html += '<div style="margin-top:8px;font-size:0.82rem;color:var(--wc-text-secondary);">Typical JAMB cut-off: <strong style="color:var(--wc-accent);">' + course.typicalCutoff + '+</strong></div>';
    }

    html += '</div>';
    el.innerHTML = html;
  }

  // ─── SHARING ─────────────────────────────────────────────────────
  function setupSharing() {
    var wa = $('shareWhatsapp'); if (wa) wa.addEventListener('click', function () { window.open('https://wa.me/?text=' + encodeURIComponent(getShareText()), '_blank'); track('result_shared', { method: 'whatsapp' }); });
    var tw = $('shareTwitter'); if (tw) tw.addEventListener('click', function () { window.open('https://twitter.com/intent/tweet?text=' + encodeURIComponent(getShareText()), '_blank'); track('result_shared', { method: 'twitter' }); });
    var cp = $('shareCopy'); if (cp) cp.addEventListener('click', function () { if (navigator.clipboard) navigator.clipboard.writeText(getShareText()).then(function () { showToast('Copied!'); }); track('result_shared', { method: 'copy' }); });
    var pdf = $('sharePdf'); if (pdf) pdf.addEventListener('click', function () { window.print(); track('result_shared', { method: 'pdf' }); });
  }

  function getShareText() {
    var sys = getSys();
    return 'My ' + (sys ? sys.name : 'WAEC') + ' Aggregate: ' + state.aggregate +
      ' | ' + state.credits + ' credits' +
      '\n\nCalculated with AfroTools \u{1F393}\nhttps://afrotools.com/tools/waec-calculator/';
  }

  // ─── FAQ ─────────────────────────────────────────────────────────
  function setupFAQ() {
    qsa('.wc-faq-q').forEach(function (q) {
      q.addEventListener('click', function () { this.parentElement.classList.toggle('open'); });
    });
  }

  // ─── PERSISTENCE ─────────────────────────────────────────────────
  function saveState() {
    try {
      localStorage.setItem('afrotools_waec', JSON.stringify({
        examSystem: state.system,
        track: state.track,
        subjects: state.subjects,
        aggregate: state.aggregate
      }));
    } catch (e) {}
  }

  function loadState() {
    try {
      var saved = localStorage.getItem('afrotools_waec');
      if (!saved) return;
      var data = JSON.parse(saved);
      if (data.examSystem && typeof WAEC_EXAM_SYSTEMS !== 'undefined' && WAEC_EXAM_SYSTEMS[data.examSystem]) {
        state.system = data.examSystem;
      }
      if (data.track) state.track = data.track;
      if (Array.isArray(data.subjects) && data.subjects.length > 0) {
        state.subjects = data.subjects;
      }
      var sel = $('examSystem');
      if (sel) sel.value = state.system;
    } catch (e) {}
  }

  // ─── TOAST ───────────────────────────────────────────────────────
  function showToast(msg) {
    if (typeof window.AfroToast === 'function') { window.AfroToast(msg); return; }
    if (typeof window.showToast === 'function') { window.showToast(msg); return; }
    var t = document.createElement('div');
    t.textContent = msg;
    t.style.cssText = 'position:fixed;bottom:72px;left:50%;transform:translateX(-50%);background:#111D2E;color:#E2E8F0;padding:10px 20px;border-radius:8px;font-size:0.85rem;z-index:9999;border:1px solid rgba(0,201,167,0.2);';
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 3000);
  }

})();
