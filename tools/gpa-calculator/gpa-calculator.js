/* ===================================================================
   AfroTools GPA Calculator — Main Application
   All calculation logic, UI rendering, and interaction handling.
   =================================================================== */

(function () {
  'use strict';

  // ─── STATE ───────────────────────────────────────────────────────
  var state = {
    system: 'nigerian-federal',
    semesters: [],
    semesterCount: 0,
    activeTab: 'tab-semester',
    cgpa: 0,
    totalCredits: 0,
    totalPoints: 0,
    classification: ''
  };

  var calcTimer = null;
  var dykTimer = null;
  var dykIndex = 0;

  // ─── HELPERS ─────────────────────────────────────────────────────
  function $(id) { return document.getElementById(id); }
  function qs(sel, ctx) { return (ctx || document).querySelector(sel); }
  function qsa(sel, ctx) { return (ctx || document).querySelectorAll(sel); }

  function getSystem() {
    return (typeof GPA_GRADING_SYSTEMS !== 'undefined' && GPA_GRADING_SYSTEMS[state.system])
      ? GPA_GRADING_SYSTEMS[state.system]
      : null;
  }

  function clamp(val, min, max) { return Math.max(min, Math.min(max, val)); }

  function track(event, data) {
    if (typeof gtag === 'function') {
      gtag('event', event, data || {});
    }
  }

  // ─── INIT ────────────────────────────────────────────────────────
  function init() {
    loadState();
    populatePresets();
    setupTabs();
    setupSystemSelector();
    setupPresetSelector();
    setupSemesterButtons();
    setupFAQ();
    setupSharing();
    setupConverterScales();
    setupWhatIfModes();
    renderAllSemesters();
    updateDYK();
    startDYKRotation();

    if (state.semesters.length === 0) {
      addSemester();
    }

    track('tool_opened', { system: state.system });
  }

  document.addEventListener('DOMContentLoaded', init);

  // ─── TABS ────────────────────────────────────────────────────────
  function setupTabs() {
    qsa('.gpa-tab').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var tabId = this.getAttribute('data-tab');
        switchTab(tabId);
        track('tab_switched', { to: tabId });
      });
    });
  }

  function switchTab(tabId) {
    state.activeTab = tabId;
    qsa('.gpa-tab').forEach(function (b) { b.classList.remove('active'); b.setAttribute('aria-selected', 'false'); });
    qsa('.gpa-tab-content').forEach(function (c) { c.classList.remove('active'); });
    var btn = qs('[data-tab="' + tabId + '"]');
    if (btn) { btn.classList.add('active'); btn.setAttribute('aria-selected', 'true'); }
    var panel = $(tabId);
    if (panel) panel.classList.add('active');

    // Refresh what-if course list when switching to that tab
    if (tabId === 'tab-whatif') populateReplaceCourses();
  }

  // ─── SYSTEM SELECTOR ────────────────────────────────────────────
  function setupSystemSelector() {
    var sel = $('gradingSystem');
    if (!sel) return;
    sel.value = state.system;
    sel.addEventListener('change', function () {
      state.system = this.value;
      onSystemChange();
    });
  }

  function onSystemChange() {
    updateAllGradeDropdowns();
    scheduleCalc();
    updateDYK();
    updateResultScale();
    populateConverterScales();
    populateWhatIfClasses();
    saveState();
  }

  function updateResultScale() {
    var sys = getSystem();
    if (!sys) return;
    var scaleText = '/ ' + (sys.scale === 100 ? '100%' : sys.scale.toFixed(2));
    var el = $('resultScale');
    if (el) el.textContent = scaleText;
    var mob = $('mobileScale');
    if (mob) mob.textContent = scaleText;
  }

  // ─── PRESETS ─────────────────────────────────────────────────────
  function populatePresets() {
    var sel = $('presetSelect');
    if (!sel || typeof GPA_COURSE_PRESETS === 'undefined') return;
    sel.innerHTML = '<option value="">Custom \u2014 I\'ll enter my own</option>';
    for (var key in GPA_COURSE_PRESETS) {
      if (GPA_COURSE_PRESETS.hasOwnProperty(key)) {
        var p = GPA_COURSE_PRESETS[key];
        sel.innerHTML += '<option value="' + key + '">' + p.icon + ' ' + p.name + '</option>';
      }
    }
  }

  function setupPresetSelector() {
    var sel = $('presetSelect');
    var semSel = $('semesterPresetSelect');
    var semGroup = $('semesterPresetGroup');
    if (!sel) return;

    sel.addEventListener('change', function () {
      var key = this.value;
      if (!key || typeof GPA_COURSE_PRESETS === 'undefined') {
        if (semGroup) semGroup.style.display = 'none';
        return;
      }
      var preset = GPA_COURSE_PRESETS[key];
      if (!preset) return;

      // Populate semester selector
      if (semSel && semGroup) {
        semGroup.style.display = '';
        semSel.innerHTML = '';
        for (var s in preset.semesters) {
          if (preset.semesters.hasOwnProperty(s)) {
            semSel.innerHTML += '<option value="' + s + '">Semester ' + s + '</option>';
          }
        }
      }
    });

    if (semSel) {
      semSel.addEventListener('change', function () {
        loadPreset();
      });
    }

    // Also load when preset changes and semester is already selected
    sel.addEventListener('change', function () {
      if (this.value && semSel && semSel.value) {
        loadPreset();
      }
    });
  }

  function loadPreset() {
    var presetKey = $('presetSelect').value;
    var semNum = $('semesterPresetSelect').value;
    if (!presetKey || !semNum || typeof GPA_COURSE_PRESETS === 'undefined') return;

    var preset = GPA_COURSE_PRESETS[presetKey];
    if (!preset || !preset.semesters[semNum]) return;

    var courses = preset.semesters[semNum].map(function (c) {
      return { name: c.name, credits: c.credits, grade: '' };
    });

    // Add as a new semester with prefilled courses
    var sem = {
      id: state.semesterCount++,
      label: preset.name + ' \u2014 Semester ' + semNum,
      courses: courses,
      collapsed: false
    };
    state.semesters.push(sem);
    renderAllSemesters();
    saveState();
    track('preset_loaded', { faculty: presetKey, semester: semNum });
  }

  // ─── SEMESTER MANAGEMENT ─────────────────────────────────────────
  function setupSemesterButtons() {
    var addBtn = $('addSemesterBtn');
    if (addBtn) addBtn.addEventListener('click', function () { addSemester(); });

    var clearBtn = $('clearAllBtn');
    if (clearBtn) clearBtn.addEventListener('click', function () {
      if (confirm('Clear all semesters and start fresh?')) {
        state.semesters = [];
        state.semesterCount = 0;
        addSemester();
        saveState();
      }
    });
  }

  function addSemester() {
    var num = state.semesters.length + 1;
    var sem = {
      id: state.semesterCount++,
      label: 'Semester ' + num,
      courses: [
        { name: '', credits: '', grade: '' },
        { name: '', credits: '', grade: '' },
        { name: '', credits: '', grade: '' },
        { name: '', credits: '', grade: '' }
      ],
      collapsed: false
    };
    state.semesters.push(sem);
    renderAllSemesters();
    saveState();
  }

  function removeSemester(idx) {
    state.semesters.splice(idx, 1);
    renderAllSemesters();
    saveState();
  }

  function addCourse(semIdx) {
    state.semesters[semIdx].courses.push({ name: '', credits: '', grade: '' });
    renderSemester(semIdx);
    scheduleCalc();
    saveState();

    // Focus the new course name input
    var container = $('sem-body-' + semIdx);
    if (container) {
      var inputs = container.querySelectorAll('.gpa-course-input[data-field="name"]');
      if (inputs.length > 0) inputs[inputs.length - 1].focus();
    }
  }

  function removeCourse(semIdx, courseIdx) {
    state.semesters[semIdx].courses.splice(courseIdx, 1);
    renderSemester(semIdx);
    scheduleCalc();
    saveState();
  }

  function updateCourse(semIdx, courseIdx, field, value) {
    var course = state.semesters[semIdx].courses[courseIdx];
    if (!course) return;

    if (field === 'credits') {
      var num = parseFloat(value);
      if (value !== '' && (isNaN(num) || num < 0 || num > 30)) return;
    }

    course[field] = value;
    scheduleCalc();
    saveState();
  }

  function toggleSemester(idx) {
    state.semesters[idx].collapsed = !state.semesters[idx].collapsed;
    var el = qs('[data-sem="' + idx + '"]');
    if (el) el.classList.toggle('collapsed');
  }

  // ─── RENDERING ───────────────────────────────────────────────────
  function renderAllSemesters() {
    var container = $('semestersContainer');
    if (!container) return;
    container.innerHTML = '';
    state.semesters.forEach(function (sem, idx) {
      container.appendChild(buildSemesterEl(sem, idx));
    });
    calculate();
  }

  function renderSemester(semIdx) {
    var oldEl = qs('[data-sem="' + semIdx + '"]');
    if (!oldEl) return renderAllSemesters();
    var newEl = buildSemesterEl(state.semesters[semIdx], semIdx);
    oldEl.replaceWith(newEl);
  }

  function buildSemesterEl(sem, idx) {
    var sys = getSystem();
    var div = document.createElement('div');
    div.className = 'gpa-semester' + (sem.collapsed ? ' collapsed' : '');
    div.setAttribute('data-sem', idx);

    // Header
    var header = document.createElement('div');
    header.className = 'gpa-semester-header';
    header.setAttribute('role', 'button');
    header.setAttribute('aria-expanded', sem.collapsed ? 'false' : 'true');
    header.innerHTML = '<h3>' + escHtml(sem.label) +
      ' <span class="sem-gpa" id="semGpa-' + idx + '"></span></h3>' +
      '<div class="gpa-semester-toggle">\u25BC</div>';
    header.addEventListener('click', function () { toggleSemester(idx); });
    div.appendChild(header);

    // Body
    var body = document.createElement('div');
    body.className = 'gpa-semester-body';
    body.id = 'sem-body-' + idx;

    // Labels
    var labels = document.createElement('div');
    labels.className = 'gpa-course-labels';
    labels.innerHTML = '<span>Course Name</span><span>Credits</span><span>Grade</span><span></span>';
    body.appendChild(labels);

    // Course cards
    sem.courses.forEach(function (course, cIdx) {
      body.appendChild(buildCourseCard(idx, cIdx, course, sys));
    });

    // Add course button
    var addBtn = document.createElement('button');
    addBtn.className = 'gpa-add-course';
    addBtn.textContent = '+ Add Course';
    addBtn.addEventListener('click', function () { addCourse(idx); });
    body.appendChild(addBtn);

    // Remove semester button (if more than 1)
    if (state.semesters.length > 1) {
      var rmDiv = document.createElement('div');
      rmDiv.style.cssText = 'margin-top:8px; text-align:right;';
      var rmBtn = document.createElement('button');
      rmBtn.className = 'gpa-btn gpa-btn-danger';
      rmBtn.textContent = 'Remove Semester';
      rmBtn.style.fontSize = '0.78rem';
      rmBtn.addEventListener('click', function () {
        if (confirm('Remove this semester?')) removeSemester(idx);
      });
      rmDiv.appendChild(rmBtn);
      body.appendChild(rmDiv);
    }

    div.appendChild(body);
    return div;
  }

  function buildCourseCard(semIdx, courseIdx, course, sys) {
    var card = document.createElement('div');
    card.className = 'gpa-course-card';

    // Name input with autocomplete
    var nameWrap = document.createElement('div');
    nameWrap.className = 'gpa-autocomplete-wrap';

    var nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.className = 'gpa-course-input';
    nameInput.setAttribute('data-field', 'name');
    nameInput.placeholder = 'Start typing course name...';
    nameInput.value = course.name || '';
    nameInput.setAttribute('aria-label', 'Course name');
    nameInput.setAttribute('autocomplete', 'off');
    nameInput.addEventListener('input', function () {
      updateCourse(semIdx, courseIdx, 'name', this.value);
      showAutoComplete(this, nameWrap);
    });
    nameInput.addEventListener('keydown', function (e) { handleAutoCompleteKey(e, nameWrap); });
    nameInput.addEventListener('blur', function () {
      setTimeout(function () { hideAutoComplete(nameWrap); }, 200);
    });

    nameWrap.appendChild(nameInput);

    // Credits input
    var credInput = document.createElement('input');
    credInput.type = 'number';
    credInput.className = 'gpa-course-input';
    credInput.setAttribute('data-field', 'credits');
    credInput.placeholder = 'Cr';
    credInput.min = '0';
    credInput.max = '30';
    credInput.step = '0.5';
    credInput.value = course.credits || '';
    credInput.setAttribute('aria-label', 'Credit units');
    credInput.addEventListener('input', function () { updateCourse(semIdx, courseIdx, 'credits', this.value); });

    // Grade input (select or number depending on system)
    var gradeEl;
    if (sys && (sys.inputType === 'percentage' || sys.inputType === 'score')) {
      gradeEl = document.createElement('input');
      gradeEl.type = 'number';
      gradeEl.className = 'gpa-course-input';
      gradeEl.placeholder = sys.inputType === 'score' ? '/20' : '%';
      gradeEl.min = '0';
      gradeEl.max = sys.inputType === 'score' ? String(sys.scoreMax || 20) : '100';
      gradeEl.step = '0.5';
      gradeEl.value = course.grade || '';
      gradeEl.setAttribute('aria-label', 'Grade score');
      gradeEl.addEventListener('input', function () { updateCourse(semIdx, courseIdx, 'grade', this.value); });
    } else {
      gradeEl = document.createElement('select');
      gradeEl.className = 'gpa-grade-select';
      gradeEl.setAttribute('aria-label', 'Grade');
      gradeEl.innerHTML = '<option value="">—</option>';
      if (sys && sys.grades) {
        for (var g in sys.grades) {
          if (sys.grades.hasOwnProperty(g)) {
            var opt = document.createElement('option');
            opt.value = g;
            opt.textContent = g + ' (' + sys.grades[g].points.toFixed(1) + ')';
            if (course.grade === g) opt.selected = true;
            gradeEl.appendChild(opt);
          }
        }
      }
      gradeEl.addEventListener('change', function () { updateCourse(semIdx, courseIdx, 'grade', this.value); });
    }

    // Delete button
    var delBtn = document.createElement('button');
    delBtn.className = 'gpa-course-delete';
    delBtn.innerHTML = '\u00D7';
    delBtn.setAttribute('aria-label', 'Remove course');
    delBtn.addEventListener('click', function () { removeCourse(semIdx, courseIdx); });

    card.appendChild(nameWrap);
    card.appendChild(credInput);
    card.appendChild(gradeEl);
    card.appendChild(delBtn);

    return card;
  }

  function updateAllGradeDropdowns() {
    // Full re-render is simplest and correct when system changes
    renderAllSemesters();
  }

  function escHtml(str) {
    var d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  // ─── CALCULATION ENGINE ──────────────────────────────────────────
  function scheduleCalc() {
    clearTimeout(calcTimer);
    calcTimer = setTimeout(calculate, 150);
  }

  function calculate() {
    var sys = getSystem();
    if (!sys) return;

    var grandTotalPoints = 0;
    var grandTotalCredits = 0;
    var semGpas = [];

    state.semesters.forEach(function (sem, idx) {
      var semPoints = 0;
      var semCredits = 0;

      sem.courses.forEach(function (course) {
        var credits = parseFloat(course.credits);
        if (!course.grade || isNaN(credits) || credits <= 0) return;

        var points = getCoursePoints(course.grade, sys);
        if (points === null) return;

        semPoints += points * credits;
        semCredits += credits;
      });

      var semGpa = semCredits > 0 ? semPoints / semCredits : 0;
      semGpas.push({ gpa: semGpa, credits: semCredits });

      // Update inline semester GPA
      var semGpaEl = $('semGpa-' + idx);
      if (semGpaEl) {
        semGpaEl.textContent = semCredits > 0 ? semGpa.toFixed(2) : '';
      }

      grandTotalPoints += semPoints;
      grandTotalCredits += semCredits;
    });

    var cgpa = grandTotalCredits > 0 ? grandTotalPoints / grandTotalCredits : 0;
    state.cgpa = cgpa;
    state.totalCredits = grandTotalCredits;
    state.totalPoints = grandTotalPoints;

    // Classification
    var cls = getClassification(cgpa, sys);
    state.classification = cls ? cls.name : '';

    renderResults(cgpa, grandTotalCredits, grandTotalPoints, cls, sys, semGpas);
    renderScholarships(cgpa, sys);
    updateMobileBar(cgpa, cls, sys);

    track('calculation_completed', {
      gpa: cgpa.toFixed(2),
      system: state.system,
      courses: grandTotalCredits > 0 ? state.semesters.reduce(function (n, s) { return n + s.courses.length; }, 0) : 0
    });

    // Sync GPA to education profile
    if (typeof EduProfileSync !== 'undefined' && cgpa > 0) {
      EduProfileSync.update({
        gpa_value: parseFloat(cgpa.toFixed(2)),
        gpa_scale: String(sys.scale)
      });
    }
  }

  function getCoursePoints(grade, sys) {
    if (sys.inputType === 'percentage' || sys.inputType === 'score') {
      var val = parseFloat(grade);
      if (isNaN(val)) return null;
      return clamp(val, 0, sys.scale);
    }
    if (sys.grades && sys.grades[grade]) {
      return sys.grades[grade].points;
    }
    return null;
  }

  function getClassification(gpa, sys) {
    if (!sys || !sys.classes) return null;
    for (var i = 0; i < sys.classes.length; i++) {
      var c = sys.classes[i];
      if (gpa >= c.min && gpa <= c.max) return c;
    }
    return null;
  }

  // ─── RESULTS RENDERING ──────────────────────────────────────────
  function renderResults(cgpa, totalCredits, totalPoints, cls, sys, semGpas) {
    // CGPA display
    animateCounter($('resultCgpa'), cgpa, sys.scale <= 20 ? 2 : 2);
    updateResultScale();

    // Stats
    var credEl = $('resultCredits');
    if (credEl) credEl.textContent = totalCredits.toFixed(1);
    var ptsEl = $('resultPoints');
    if (ptsEl) ptsEl.textContent = totalPoints.toFixed(2);

    // Class badge
    var badge = $('classBadge');
    if (badge) {
      if (cls) {
        badge.textContent = (cls.icon || '') + ' ' + cls.name;
        badge.style.background = hexToRgba(cls.color, 0.1);
        badge.style.color = cls.color;
      } else if (totalCredits > 0) {
        badge.textContent = 'Calculating...';
        badge.style.background = 'rgba(148,163,184,0.08)';
        badge.style.color = 'var(--gpa-text-muted)';
      } else {
        badge.textContent = 'Enter grades to see your class';
        badge.style.background = 'rgba(148,163,184,0.08)';
        badge.style.color = 'var(--gpa-text-muted)';
      }
    }

    // Gauge
    renderGauge(cgpa, sys.scale);

    // Pulse animation on results card
    var glassCard = qs('.gpa-glass-card');
    if (glassCard && totalCredits > 0) {
      glassCard.classList.remove('gpa-pulse');
      void glassCard.offsetWidth; // reflow
      glassCard.classList.add('gpa-pulse');
    }

    // Semester trend
    renderTrend(semGpas, sys.scale);
  }

  function animateCounter(el, target, decimals) {
    if (!el) return;
    var start = parseFloat(el.textContent) || 0;
    var diff = target - start;
    if (Math.abs(diff) < 0.001) { el.textContent = target.toFixed(decimals); return; }

    var duration = 600;
    var startTime = null;

    function step(ts) {
      if (!startTime) startTime = ts;
      var progress = Math.min((ts - startTime) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      el.textContent = (start + diff * eased).toFixed(decimals);
      if (progress < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  }

  function renderGauge(gpa, maxScale) {
    var fill = $('gaugeFill');
    if (!fill) return;

    var ratio = maxScale > 0 ? clamp(gpa / maxScale, 0, 1) : 0;

    // SVG arc: semicircle from (20,100) to (180,100), radius 80
    // Total arc length = pi * 80 ≈ 251.33
    var arcLen = Math.PI * 80;
    fill.style.strokeDasharray = arcLen;
    fill.style.strokeDashoffset = arcLen * (1 - ratio);

    // Color based on ratio
    var color;
    if (ratio >= 0.9) color = '#059669';
    else if (ratio >= 0.7) color = '#10B981';
    else if (ratio >= 0.5) color = '#D97706';
    else if (ratio >= 0.3) color = '#EA580C';
    else color = '#DC2626';

    fill.style.stroke = color;
  }

  function renderTrend(semGpas, maxScale) {
    var trendWrap = $('semesterTrend');
    var barsEl = $('trendBars');
    if (!trendWrap || !barsEl) return;

    var valid = semGpas.filter(function (s) { return s.credits > 0; });
    if (valid.length < 2) {
      trendWrap.style.display = 'none';
      return;
    }

    trendWrap.style.display = '';
    barsEl.innerHTML = '';

    valid.forEach(function (s, i) {
      var pct = maxScale > 0 ? (s.gpa / maxScale) * 100 : 0;
      var bar = document.createElement('div');
      bar.className = 'gpa-trend-bar';
      bar.style.height = Math.max(pct, 5) + '%';
      bar.innerHTML = '<span class="tip">S' + (i + 1) + ': ' + s.gpa.toFixed(2) + '</span>';
      barsEl.appendChild(bar);
    });
  }

  function hexToRgba(hex, alpha) {
    if (!hex || hex.charAt(0) !== '#') return 'rgba(148,163,184,' + alpha + ')';
    var r = parseInt(hex.slice(1, 3), 16);
    var g = parseInt(hex.slice(3, 5), 16);
    var b = parseInt(hex.slice(5, 7), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
  }

  // ─── SCHOLARSHIP MATCHER ─────────────────────────────────────────
  function renderScholarships(cgpa, sys) {
    var list = $('scholarshipsList');
    if (!list || typeof GPA_SCHOLARSHIPS === 'undefined') return;
    if (state.totalCredits === 0) {
      list.innerHTML = '<p style="font-size:0.82rem; color:var(--gpa-text-muted);">Calculate your GPA to see scholarship matches.</p>';
      return;
    }

    // Normalize to 4.0 for comparison
    var gpa4;
    if (sys.scale === 5 || sys.scale === 5.0) {
      gpa4 = cgpa * 0.8;
    } else if (sys.scale === 4 || sys.scale === 4.0) {
      gpa4 = cgpa;
    } else if (sys.scale === 100) {
      // Percentage to 4.0 rough conversion
      if (cgpa >= 85) gpa4 = 4.0;
      else if (cgpa >= 75) gpa4 = 3.5;
      else if (cgpa >= 65) gpa4 = 3.0;
      else if (cgpa >= 50) gpa4 = 2.0;
      else gpa4 = 1.0;
    } else if (sys.scale === 20) {
      // /20 to 4.0
      gpa4 = (cgpa / 20) * 4.0;
    } else {
      gpa4 = (cgpa / sys.scale) * 4.0;
    }

    var html = '';
    GPA_SCHOLARSHIPS.forEach(function (sch) {
      var status, statusClass;
      if (sch.minGPA4 === 0) {
        status = 'No GPA min';
        statusClass = 'eligible';
      } else if (gpa4 >= sch.minGPA4 + 0.2) {
        status = 'Eligible';
        statusClass = 'eligible';
      } else if (gpa4 >= sch.minGPA4 - 0.1) {
        status = 'Borderline';
        statusClass = 'borderline';
      } else {
        status = 'Below req.';
        statusClass = 'ineligible';
      }

      html += '<div class="gpa-scholarship-item">' +
        '<span class="gpa-scholarship-name">' + sch.icon + ' ' + escHtml(sch.name) + '</span>' +
        '<span class="gpa-scholarship-status ' + statusClass + '">' + status + '</span>' +
        '</div>';
    });

    list.innerHTML = html;
  }

  // ─── MOBILE BAR ──────────────────────────────────────────────────
  function updateMobileBar(cgpa, cls, sys) {
    var gpaEl = $('mobileGpa');
    var classEl = $('mobileClass');
    if (gpaEl) gpaEl.textContent = cgpa.toFixed(2);
    if (classEl && cls) {
      classEl.textContent = cls.name;
      classEl.style.background = hexToRgba(cls.color, 0.1);
      classEl.style.color = cls.color;
    } else if (classEl) {
      classEl.textContent = '\u2014';
      classEl.style.background = 'rgba(148,163,184,0.08)';
      classEl.style.color = 'var(--gpa-text-muted)';
    }
  }

  // ─── DID YOU KNOW ────────────────────────────────────────────────
  function updateDYK() {
    var el = $('dykText');
    if (!el) return;

    // Try system-specific fact first
    var sys = getSystem();
    if (sys && sys.fact && Math.random() < 0.4) {
      el.textContent = sys.fact;
      return;
    }

    if (typeof GPA_FUN_FACTS !== 'undefined' && GPA_FUN_FACTS.length > 0) {
      dykIndex = (dykIndex + 1) % GPA_FUN_FACTS.length;
      el.style.opacity = '0';
      setTimeout(function () {
        el.textContent = GPA_FUN_FACTS[dykIndex];
        el.style.opacity = '1';
      }, 300);
    }
  }

  function startDYKRotation() {
    dykTimer = setInterval(updateDYK, 10000);
  }

  // ─── FAQ ─────────────────────────────────────────────────────────
  function setupFAQ() {
    qsa('.gpa-faq-q').forEach(function (q) {
      q.addEventListener('click', function () {
        this.parentElement.classList.toggle('open');
      });
    });
  }

  // ─── TRANSCRIPT UPLOAD (TAB 2) ──────────────────────────────────
  (function setupTranscript() {
    document.addEventListener('DOMContentLoaded', function () {
      var parseBtn = $('parseTranscriptBtn');
      if (parseBtn) parseBtn.addEventListener('click', parseTranscript);

      var downloadBtn = $('downloadSampleBtn');
      if (downloadBtn) downloadBtn.addEventListener('click', downloadSampleCsv);

      // CSV drop zone
      var dropZone = $('csvDropZone');
      var fileInput = $('csvFileInput');
      if (dropZone && fileInput) {
        dropZone.addEventListener('click', function () { fileInput.click(); });
        dropZone.addEventListener('dragover', function (e) { e.preventDefault(); this.classList.add('dragover'); });
        dropZone.addEventListener('dragleave', function () { this.classList.remove('dragover'); });
        dropZone.addEventListener('drop', function (e) {
          e.preventDefault();
          this.classList.remove('dragover');
          if (e.dataTransfer.files.length > 0) handleCsvFile(e.dataTransfer.files[0]);
        });
        fileInput.addEventListener('change', function () {
          if (this.files.length > 0) handleCsvFile(this.files[0]);
        });
      }
    });
  })();

  // Try to normalize a grade string to match the current grading system
  function normalizeGrade(gradeStr, sys) {
    if (!gradeStr) return '';
    gradeStr = gradeStr.trim();

    // For percentage/score systems, just return the numeric value
    if (sys && (sys.inputType === 'percentage' || sys.inputType === 'score')) {
      var num = parseFloat(gradeStr.replace('%', ''));
      return isNaN(num) ? '' : String(num);
    }

    // For letter grade systems, try matching
    if (!sys || !sys.grades) return gradeStr;

    // Direct match (case-sensitive)
    if (sys.grades[gradeStr]) return gradeStr;

    // Case-insensitive match
    var upper = gradeStr.toUpperCase();
    for (var g in sys.grades) {
      if (sys.grades.hasOwnProperty(g) && g.toUpperCase() === upper) return g;
    }

    // Try without spaces
    var cleaned = upper.replace(/\s/g, '');
    for (var g2 in sys.grades) {
      if (sys.grades.hasOwnProperty(g2) && g2.toUpperCase().replace(/\s/g, '') === cleaned) return g2;
    }

    // If it looks like a percentage, try to map it to a letter grade
    var pctVal = parseFloat(gradeStr.replace('%', ''));
    if (!isNaN(pctVal) && pctVal >= 0 && pctVal <= 100) {
      for (var g3 in sys.grades) {
        if (sys.grades.hasOwnProperty(g3)) {
          var info = sys.grades[g3];
          if (pctVal >= info.min && pctVal <= info.max) return g3;
        }
      }
    }

    return gradeStr; // return as-is, will show as invalid
  }

  function isValidGrade(grade, sys) {
    if (!grade || !sys) return false;
    if (sys.inputType === 'percentage' || sys.inputType === 'score') {
      var val = parseFloat(grade);
      return !isNaN(val) && val >= 0 && val <= sys.scale;
    }
    return sys.grades && sys.grades.hasOwnProperty(grade);
  }

  function parseTranscript() {
    var text = ($('transcriptText') || {}).value || '';
    if (!text.trim()) {
      showToast('Please paste transcript text first.');
      return;
    }

    var sys = getSystem();
    var courses = [];
    var lines = text.split('\n');
    lines.forEach(function (line) {
      line = line.trim();
      if (!line) return;

      // Skip header-like lines
      if (/^(course|subject|code|name|credit|grade|unit|score)/i.test(line)) return;
      if (/^[-=]+$/.test(line)) return;

      var parsed = null;

      // Tab-separated: "ENG 101\tEngineering Mathematics I\t3\tA" or "Course Name\t3\tA"
      var tabParts = line.split('\t');
      if (tabParts.length >= 3) {
        if (tabParts.length >= 4) {
          parsed = { name: (tabParts[0] + ' ' + tabParts[1]).trim(), credits: tabParts[2].trim(), grade: tabParts[3].trim() };
        } else {
          parsed = { name: tabParts[0].trim(), credits: tabParts[1].trim(), grade: tabParts[2].trim() };
        }
      }

      // Comma-separated
      if (!parsed) {
        var commaParts = line.split(',').map(function(p) { return p.trim().replace(/^["']|["']$/g, ''); });
        if (commaParts.length >= 3 && commaParts[0]) {
          // Handle "Code, Name, Credits, Grade" (4 cols) or "Name, Credits, Grade" (3 cols)
          if (commaParts.length >= 4 && !isNaN(parseFloat(commaParts[2]))) {
            parsed = { name: (commaParts[0] + ' ' + commaParts[1]).trim(), credits: commaParts[2].trim(), grade: commaParts[3].trim() };
          } else {
            parsed = { name: commaParts[0].trim(), credits: commaParts[1].trim(), grade: commaParts[2].trim() };
          }
        }
      }

      // Pipe-separated: "Course Name | 3 | A"
      if (!parsed && line.indexOf('|') !== -1) {
        var pipeParts = line.split('|').map(function(p) { return p.trim(); });
        if (pipeParts.length >= 3) {
          parsed = { name: pipeParts[0], credits: pipeParts[1], grade: pipeParts[2] };
        }
      }

      // Space-separated with regex: "Course Name 3 A" or "ENG 101 Engineering Mathematics 3 B+"
      if (!parsed) {
        var match = line.match(/^(.+?)\s+(\d+(?:\.\d+)?)\s+([A-Fa-f][+-]?|[\d.]+%?)$/);
        if (match) {
          parsed = { name: match[1].trim(), credits: match[2], grade: match[3].trim() };
        }
      }

      if (parsed) {
        // Clean up credits
        var cr = parseFloat(parsed.credits);
        if (isNaN(cr) || cr <= 0 || cr > 30) return;
        parsed.credits = String(cr);

        // Normalize grade
        parsed.grade = normalizeGrade(parsed.grade, sys);

        courses.push(parsed);
      }
    });

    if (courses.length === 0) {
      showToast('No courses found. Try format: "Course Name, 3, A" or tab-separated.');
      return;
    }

    renderTranscriptPreview(courses, 'transcriptPreview');
  }

  function parseCsvLine(line) {
    var fields = [];
    var current = '';
    var inQuotes = false;
    for (var i = 0; i < line.length; i++) {
      var ch = line[i];
      if (ch === '"') {
        if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ',' && !inQuotes) {
        fields.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    fields.push(current.trim());
    return fields;
  }

  function handleCsvFile(file) {
    if (!file.name.match(/\.csv$/i)) {
      showToast('Please upload a .csv file');
      return;
    }

    var reader = new FileReader();
    reader.onload = function (e) {
      var sys = getSystem();
      var lines = e.target.result.split(/\r?\n/);
      var courses = [];

      // Detect header
      var headerLine = lines[0] || '';
      var headers = parseCsvLine(headerLine.toLowerCase());
      var nameCol = -1, creditCol = -1, gradeCol = -1, codeCol = -1, semesterCol = -1;

      headers.forEach(function(h, i) {
        h = h.replace(/^["']|["']$/g, '').trim();
        if (/^(course\s*name|name|subject|title)$/i.test(h)) nameCol = i;
        else if (/^(course\s*code|code|id)$/i.test(h)) codeCol = i;
        else if (/^(credit|credits|units?|credit\s*units?|hours?)$/i.test(h)) creditCol = i;
        else if (/^(grade|score|mark|result)$/i.test(h)) gradeCol = i;
        else if (/^(semester|sem|term|level)$/i.test(h)) semesterCol = i;
      });

      // If no headers detected, assume: Name/Code, Credits, Grade (or Code, Name, Credits, Grade)
      var startRow = 1;
      if (nameCol === -1 && creditCol === -1 && gradeCol === -1) {
        startRow = 0; // No header row
      }

      for (var i = startRow; i < lines.length; i++) {
        var line = lines[i].trim();
        if (!line) continue;

        var parts = parseCsvLine(line);
        if (parts.length < 3) continue;

        var name, credits, grade;

        if (nameCol !== -1 || creditCol !== -1 || gradeCol !== -1) {
          // Use detected column mapping
          var codePart = codeCol !== -1 && parts[codeCol] ? parts[codeCol] : '';
          var namePart = nameCol !== -1 && parts[nameCol] ? parts[nameCol] : '';
          name = codePart ? (codePart + ' ' + namePart).trim() : namePart;
          credits = creditCol !== -1 ? parts[creditCol] : parts[1];
          grade = gradeCol !== -1 ? parts[gradeCol] : parts[parts.length - 1];
        } else {
          // Fallback: try to detect layout
          if (parts.length >= 4 && !isNaN(parseFloat(parts[2]))) {
            // Code, Name, Credits, Grade
            name = (parts[0] + ' ' + parts[1]).trim();
            credits = parts[2];
            grade = parts[3];
          } else {
            // Name, Credits, Grade
            name = parts[0];
            credits = parts[1];
            grade = parts[2];
          }
        }

        // Clean values
        name = (name || '').replace(/^["']|["']$/g, '').trim();
        credits = (credits || '').replace(/^["']|["']$/g, '').trim();
        grade = (grade || '').replace(/^["']|["']$/g, '').trim();

        var cr = parseFloat(credits);
        if (!name || isNaN(cr) || cr <= 0 || cr > 30) continue;

        grade = normalizeGrade(grade, sys);
        courses.push({ name: name, credits: String(cr), grade: grade });
      }

      if (courses.length === 0) {
        showToast('No valid courses found in CSV. Check format: Course Name, Credits, Grade');
        return;
      }
      renderTranscriptPreview(courses, 'csvPreview');
    };
    reader.readAsText(file);
  }

  function renderTranscriptPreview(courses, containerId) {
    var container = $(containerId);
    if (!container) return;
    var sys = getSystem();

    var validCount = 0;
    var invalidCount = 0;
    courses.forEach(function(c) {
      if (isValidGrade(c.grade, sys)) validCount++;
      else invalidCount++;
    });

    var html = '<div style="margin-top:16px;">' +
      '<h3 style="font-size:0.9rem; color:var(--gpa-text); margin-bottom:4px;">Parsed ' + courses.length + ' courses</h3>';

    if (invalidCount > 0) {
      html += '<p style="font-size:0.8rem; color:var(--gpa-error); margin-bottom:8px;">' +
        invalidCount + ' course(s) have unrecognized grades for the current grading system. They will be imported but you may need to fix the grade.</p>';
    }

    html += '<table class="gpa-preview-table"><thead><tr><th>Course</th><th>Credits</th><th>Grade</th><th>Status</th></tr></thead><tbody>';

    courses.forEach(function (c) {
      var valid = isValidGrade(c.grade, sys);
      var statusHtml = valid
        ? '<span style="color:var(--gpa-success);">&#x2713;</span>'
        : '<span style="color:var(--gpa-error);">&#x2717;</span>';
      html += '<tr><td>' + escHtml(c.name) + '</td><td>' + escHtml(String(c.credits)) + '</td>' +
        '<td class="' + (valid ? 'grade-valid' : 'grade-invalid') + '">' + escHtml(c.grade || '—') + '</td>' +
        '<td style="text-align:center;">' + statusHtml + '</td></tr>';
    });

    html += '</tbody></table>' +
      '<div style="margin-top:12px; display:flex; gap:8px; flex-wrap:wrap;">' +
      '<button class="gpa-btn gpa-btn-primary" id="confirmParsed-' + containerId + '">Add as New Semester</button>';

    if (invalidCount > 0) {
      html += '<button class="gpa-btn gpa-btn-secondary" id="fixGrades-' + containerId + '">Add Valid Only (' + validCount + ')</button>';
    }

    html += '</div></div>';

    container.innerHTML = html;

    // Add all courses
    var confirmBtn = $('confirmParsed-' + containerId);
    if (confirmBtn) {
      confirmBtn.addEventListener('click', function () {
        addParsedSemester(courses);
      });
    }

    // Add valid only
    var fixBtn = $('fixGrades-' + containerId);
    if (fixBtn) {
      fixBtn.addEventListener('click', function () {
        var validCourses = courses.filter(function(c) { return isValidGrade(c.grade, sys); });
        if (validCourses.length === 0) {
          showToast('No valid courses to add.');
          return;
        }
        addParsedSemester(validCourses);
      });
    }
  }

  function addParsedSemester(courses) {
    var sem = {
      id: state.semesterCount++,
      label: 'Imported Semester',
      courses: courses.map(function (c) {
        return { name: c.name, credits: c.credits, grade: c.grade };
      }),
      collapsed: false
    };
    state.semesters.push(sem);
    renderAllSemesters();
    saveState();
    switchTab('tab-semester');
    showToast('Semester added with ' + courses.length + ' courses!');
  }

  function downloadSampleCsv() {
    var sys = getSystem();
    var csv;

    if (sys && (sys.inputType === 'percentage' || sys.inputType === 'score')) {
      var maxLabel = sys.inputType === 'score' ? '/20' : '%';
      csv = 'Course Name,Credits,Grade\n' +
        'Engineering Mathematics I,3,78\n' +
        'Engineering Physics,3,65\n' +
        'Engineering Drawing,2,82\n' +
        'Workshop Practice,1,71\n' +
        'General English,2,88';
    } else if (sys && sys.grades) {
      // Use actual grades from the system
      var gradeKeys = Object.keys(sys.grades);
      var sampleGrades = [gradeKeys[0] || 'A', gradeKeys[1] || 'B', gradeKeys[0] || 'A', gradeKeys[2] || 'B', gradeKeys[0] || 'A'];
      csv = 'Course Name,Credits,Grade\n' +
        'Engineering Mathematics I,3,' + sampleGrades[0] + '\n' +
        'Engineering Physics,3,' + sampleGrades[1] + '\n' +
        'Engineering Drawing,2,' + sampleGrades[2] + '\n' +
        'Workshop Practice,1,' + sampleGrades[3] + '\n' +
        'General English,2,' + sampleGrades[4];
    } else {
      csv = 'Course Name,Credits,Grade\nEngineering Mathematics I,3,A\nEngineering Physics,3,B\nEngineering Drawing,2,A\nWorkshop Practice,1,B\nGeneral English,2,A';
    }

    var blob = new Blob([csv], { type: 'text/csv' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'sample_transcript.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  // ─── GPA CONVERTER (TAB 3) ──────────────────────────────────────

  // Conversion tables: define proper non-linear mappings
  // Each entry maps a normalized ratio (0-1) to specific scale values
  var CONVERSION_TABLE = [
    // ratio,   5.0,   4.0,   pct,   /20,   us4.0,  uk-desc
    { ratio: 1.00, n5: 5.00, n4: 4.00, pct: 95, fr: 19, us: 4.00, uk: 'First Class' },
    { ratio: 0.90, n5: 4.50, n4: 3.60, pct: 85, fr: 17, us: 3.70, uk: 'First Class' },
    { ratio: 0.80, n5: 4.00, n4: 3.20, pct: 75, fr: 15, us: 3.30, uk: 'Upper Second (2:1)' },
    { ratio: 0.70, n5: 3.50, n4: 2.80, pct: 65, fr: 13, us: 3.00, uk: 'Upper Second (2:1)' },
    { ratio: 0.60, n5: 3.00, n4: 2.40, pct: 57, fr: 11, us: 2.50, uk: 'Lower Second (2:2)' },
    { ratio: 0.50, n5: 2.40, n4: 2.00, pct: 50, fr: 10, us: 2.00, uk: 'Lower Second (2:2)' },
    { ratio: 0.35, n5: 1.50, n4: 1.50, pct: 45, fr: 8,  us: 1.50, uk: 'Third Class' },
    { ratio: 0.20, n5: 1.00, n4: 1.00, pct: 40, fr: 6,  us: 1.00, uk: 'Pass' },
    { ratio: 0.00, n5: 0.00, n4: 0.00, pct: 0,  fr: 0,  us: 0.00, uk: 'Fail' }
  ];

  var CONVERTER_SCALES = [
    { id: '5.0', label: 'Nigerian Federal (5.0)', max: 5.0, key: 'n5' },
    { id: '4.0', label: 'Nigerian Private / Kenyan / Ghanaian (4.0)', max: 4.0, key: 'n4' },
    { id: 'pct', label: 'Percentage (South African / Egyptian)', max: 100, key: 'pct' },
    { id: '20', label: 'Francophone (/20)', max: 20, key: 'fr' },
    { id: 'us4', label: 'US GPA (4.0)', max: 4.0, key: 'us' },
    { id: 'uk', label: 'UK Classification', max: 100, key: 'uk' }
  ];

  function setupConverterScales() {
    populateConverterScales();
    var btn = $('convertBtn');
    if (btn) btn.addEventListener('click', convertGPA);

    // Auto-convert on input change
    var fromVal = $('convertFromValue');
    if (fromVal) fromVal.addEventListener('input', function() { convertGPA(); });
    var fromSel = $('convertFrom');
    if (fromSel) fromSel.addEventListener('change', function() {
      updateConverterPlaceholder();
      convertGPA();
    });
    var toSel = $('convertTo');
    if (toSel) toSel.addEventListener('change', function() { convertGPA(); });

    renderReferenceTable();
    updateConverterPlaceholder();
  }

  function updateConverterPlaceholder() {
    var fromScale = ($('convertFrom') || {}).value;
    var input = $('convertFromValue');
    if (!input) return;
    var scale = CONVERTER_SCALES.find(function(s) { return s.id === fromScale; });
    if (!scale) return;
    if (fromScale === 'uk') {
      input.placeholder = 'e.g. 70';
      input.step = '1';
    } else if (fromScale === 'pct') {
      input.placeholder = 'e.g. 75';
      input.step = '1';
    } else if (fromScale === '20') {
      input.placeholder = 'e.g. 15.5';
      input.step = '0.5';
    } else {
      input.placeholder = 'e.g. ' + (scale.max * 0.8).toFixed(2);
      input.step = '0.01';
    }
  }

  function populateConverterScales() {
    var from = $('convertFrom');
    var to = $('convertTo');
    if (!from || !to) return;

    [from, to].forEach(function (sel) {
      sel.innerHTML = '';
      CONVERTER_SCALES.forEach(function (s) {
        // Skip UK as a "from" option — it's categorical, not numeric
        if (sel === from && s.id === 'uk') return;
        sel.innerHTML += '<option value="' + s.id + '">' + s.label + '</option>';
      });
    });

    from.value = '5.0';
    to.value = 'us4';
  }

  function interpolateInTable(value, fromKey, toKey) {
    // Find the two rows that bracket the value
    for (var i = 0; i < CONVERSION_TABLE.length - 1; i++) {
      var upper = CONVERSION_TABLE[i];
      var lower = CONVERSION_TABLE[i + 1];
      var upperVal = upper[fromKey];
      var lowerVal = lower[fromKey];

      if (typeof upperVal === 'string' || typeof lowerVal === 'string') continue;

      if (value >= lowerVal && value <= upperVal) {
        // Linear interpolation between the two rows
        var range = upperVal - lowerVal;
        var t = range > 0 ? (value - lowerVal) / range : 0;

        if (typeof upper[toKey] === 'string') {
          // UK classification — return the string for the bracket
          return value >= upper[fromKey] ? upper[toKey] : lower[toKey];
        }

        return lower[toKey] + t * (upper[toKey] - lower[toKey]);
      }
    }

    // Value above max or below min
    if (value >= CONVERSION_TABLE[0][fromKey]) {
      return CONVERSION_TABLE[0][toKey];
    }
    return CONVERSION_TABLE[CONVERSION_TABLE.length - 1][toKey];
  }

  function convertGPA() {
    var fromScale = ($('convertFrom') || {}).value;
    var toScale = ($('convertTo') || {}).value;
    var value = parseFloat(($('convertFromValue') || {}).value);

    var output = $('conversionOutput');
    if (!output) return;

    if (isNaN(value)) {
      output.style.display = 'none';
      return;
    }

    var fromInfo = CONVERTER_SCALES.find(function (s) { return s.id === fromScale; });
    var toInfo = CONVERTER_SCALES.find(function (s) { return s.id === toScale; });
    if (!fromInfo || !toInfo) return;

    // Clamp input
    value = clamp(value, 0, fromInfo.max);

    // Use table interpolation for accurate conversion
    var converted = interpolateInTable(value, fromInfo.key, toInfo.key);

    // Get UK classification for any conversion
    var ukClass = '';
    if (toScale === 'uk') {
      ukClass = interpolateInTable(value, fromInfo.key, 'uk');
    }

    output.style.display = '';

    if (toScale === 'uk') {
      // Show classification instead of number
      var ukPct = interpolateInTable(value, fromInfo.key, 'pct');
      output.innerHTML = '<div class="from-val">' + value.toFixed(2) + ' <span style="font-size:0.8rem;color:var(--gpa-text-muted);">' + fromInfo.label + '</span></div>' +
        '<div style="font-size:1.2rem; color:var(--gpa-accent); margin:8px 0;">\u2192</div>' +
        '<div class="to-val" style="color:var(--gpa-accent);">' + ukClass + '</div>' +
        '<div style="margin-top:6px; font-size:0.82rem; color:var(--gpa-text-secondary);">\u2248 ' + Math.round(ukPct) + '% equivalent</div>';
    } else {
      var displayVal = typeof converted === 'number' ? converted.toFixed(2) : converted;
      var suffix = toScale === 'pct' ? '%' : '';
      output.innerHTML = '<div class="from-val">' + value.toFixed(2) + ' <span style="font-size:0.8rem;color:var(--gpa-text-muted);">' + fromInfo.label + '</span></div>' +
        '<div style="font-size:1.2rem; color:var(--gpa-accent); margin:8px 0;">\u2192</div>' +
        '<div class="to-val" style="color:var(--gpa-accent);">' + displayVal + suffix + ' <span style="font-size:0.8rem;color:var(--gpa-text-muted);">' + toInfo.label + '</span></div>';

      // Also show UK classification for context
      var ukForContext = interpolateInTable(value, fromInfo.key, 'uk');
      if (ukForContext && ukForContext !== 'Fail') {
        output.innerHTML += '<div style="margin-top:6px; font-size:0.82rem; color:var(--gpa-text-secondary);">UK equivalent: ' + ukForContext + '</div>';
      }
    }
  }

  function renderReferenceTable() {
    var table = $('referenceTable');
    if (!table) return;

    table.innerHTML = '<thead><tr>' +
      '<th>Nigerian 5.0</th><th>Nigerian/Kenya 4.0</th><th>US 4.0</th><th>Percentage</th><th>/20</th><th>UK Class</th>' +
      '</tr></thead><tbody>' +
      refRow('5.00', '4.00', '4.00', '90-100%', '18-20', 'First Class') +
      refRow('4.50', '3.60', '3.70', '80-89%', '16-17', 'First Class') +
      refRow('4.00', '3.20', '3.30', '70-79%', '14-15', 'Upper Second (2:1)') +
      refRow('3.50', '2.80', '3.00', '60-69%', '12-13', 'Upper Second (2:1)') +
      refRow('3.00', '2.40', '2.50', '55-59%', '11', 'Lower Second (2:2)') +
      refRow('2.40', '2.00', '2.00', '50-54%', '10', 'Lower Second (2:2)') +
      refRow('1.50', '1.50', '1.50', '45-49%', '8-9', 'Third Class') +
      refRow('1.00', '1.00', '1.00', '40-44%', '6-7', 'Pass') +
      refRow('0.00', '0.00', '0.00', '< 40%', '< 6', 'Fail') +
      '</tbody>';
  }

  function refRow(n5, n4, us, pct, fr, uk) {
    return '<tr><td>' + n5 + '</td><td>' + n4 + '</td><td>' + us + '</td><td>' + pct + '</td><td>' + fr + '</td><td>' + uk + '</td></tr>';
  }

  // ─── WHAT-IF CALCULATOR (TAB 4) ─────────────────────────────────
  function setupWhatIfModes() {
    // Mode switcher
    qsa('.gpa-whatif-mode').forEach(function (btn) {
      btn.addEventListener('click', function () {
        qsa('.gpa-whatif-mode').forEach(function (b) { b.classList.remove('active'); });
        qsa('.gpa-whatif-form').forEach(function (f) { f.classList.remove('active'); });
        this.classList.add('active');
        var formId = 'whatif-' + this.getAttribute('data-mode');
        var form = $(formId);
        if (form) form.classList.add('active');
      });
    });

    // Buttons
    var tgBtn = $('calcTargetGpaBtn');
    if (tgBtn) tgBtn.addEventListener('click', calcTargetGPA);

    var tcBtn = $('calcTargetClassBtn');
    if (tcBtn) tcBtn.addEventListener('click', calcTargetClass);

    var grBtn = $('calcReplaceBtn');
    if (grBtn) grBtn.addEventListener('click', calcGradeReplace);

    populateWhatIfClasses();

    // Auto-fill current CGPA/credits from calculation state
    setupWhatIfAutoFill();
  }

  function setupWhatIfAutoFill() {
    // Auto-fill when switching to what-if tab
    var origSwitchTab = switchTab;
    // We can't override switchTab easily, so use mutation on the tab
    // Instead, add a click handler to what-if tab that fills in current values
    var whatifTabBtn = $('tabBtn-whatif');
    if (whatifTabBtn) {
      whatifTabBtn.addEventListener('click', function() {
        autoFillWhatIf();
      });
    }
  }

  function autoFillWhatIf() {
    if (state.totalCredits > 0) {
      var fields = [
        { id: 'wfCurrentCgpa', val: state.cgpa.toFixed(2) },
        { id: 'wfCurrentCredits', val: state.totalCredits.toFixed(0) },
        { id: 'wfClassCurrentCgpa', val: state.cgpa.toFixed(2) },
        { id: 'wfClassCurrentCredits', val: state.totalCredits.toFixed(0) }
      ];
      fields.forEach(function(f) {
        var el = $(f.id);
        if (el && !el.value) el.value = f.val;
      });
    }
  }

  function populateWhatIfClasses() {
    var sel = $('wfTargetClass');
    if (!sel) return;
    var sys = getSystem();
    if (!sys || !sys.classes) return;

    sel.innerHTML = '<option value="">Select target class</option>';
    sys.classes.forEach(function (c) {
      if (c.name.toLowerCase() !== 'fail' && c.name.toLowerCase().indexOf('fail') === -1) {
        sel.innerHTML += '<option value="' + c.min + '">' + c.name + ' (' + c.min.toFixed(2) + '+)</option>';
      }
    });
  }

  function populateReplaceCourses() {
    var sel = $('wfReplaceCourse');
    var gradeSel = $('wfReplaceGrade');
    if (!sel) return;

    sel.innerHTML = '<option value="">Select a course</option>';
    var hasCourses = false;
    state.semesters.forEach(function (sem, sIdx) {
      sem.courses.forEach(function (c, cIdx) {
        if (c.name && c.credits && c.grade) {
          hasCourses = true;
          sel.innerHTML += '<option value="' + sIdx + '-' + cIdx + '">' +
            escHtml(c.name) + ' (Grade: ' + c.grade + ', ' + c.credits + ' cr)</option>';
        }
      });
    });

    if (!hasCourses) {
      sel.innerHTML = '<option value="">Enter courses in Semester GPA tab first</option>';
    }

    // Populate grade select — handle both letter grade and percentage/score systems
    if (gradeSel) {
      var sys = getSystem();
      gradeSel.innerHTML = '<option value="">Select new grade</option>';
      if (sys && sys.grades) {
        for (var g in sys.grades) {
          if (sys.grades.hasOwnProperty(g)) {
            gradeSel.innerHTML += '<option value="' + g + '">' + g + ' (' + sys.grades[g].points.toFixed(1) + ')</option>';
          }
        }
      } else if (sys && (sys.inputType === 'percentage' || sys.inputType === 'score')) {
        // For percentage/score systems, replace the select with an input
        var parent = gradeSel.parentNode;
        var label = parent.querySelector('label');
        if (label) label.setAttribute('for', 'wfReplaceGradeInput');

        var input = document.createElement('input');
        input.type = 'number';
        input.id = 'wfReplaceGradeInput';
        input.className = 'gpa-course-input';
        input.placeholder = sys.inputType === 'score' ? 'New score /20' : 'New score %';
        input.min = '0';
        input.max = String(sys.scale);
        input.step = '0.5';
        input.style.padding = '10px 12px';
        input.style.fontSize = '0.9rem';
        gradeSel.replaceWith(input);
      }
    }
  }

  function calcTargetGPA() {
    var currentCgpa = parseFloat(($('wfCurrentCgpa') || {}).value);
    var currentCredits = parseFloat(($('wfCurrentCredits') || {}).value);
    var targetCgpa = parseFloat(($('wfTargetCgpa') || {}).value);
    var upcomingCredits = parseFloat(($('wfUpcomingCredits') || {}).value);

    if (isNaN(currentCgpa) || isNaN(currentCredits) || isNaN(targetCgpa) || isNaN(upcomingCredits) || upcomingCredits <= 0) {
      showToast('Please fill all fields.');
      return;
    }

    var sys = getSystem();
    var maxGpa = sys ? sys.scale : 5.0;

    // Validate inputs against scale
    if (currentCgpa > maxGpa) {
      showToast('Current CGPA cannot exceed ' + maxGpa.toFixed(2));
      return;
    }
    if (targetCgpa > maxGpa) {
      showToast('Target CGPA cannot exceed ' + maxGpa.toFixed(2));
      return;
    }

    var needed = (targetCgpa * (currentCredits + upcomingCredits) - currentCgpa * currentCredits) / upcomingCredits;

    var resultEl = $('whatifResult');
    if (!resultEl) return;

    if (needed > maxGpa) {
      resultEl.innerHTML = '<div class="gpa-whatif-result impossible">' +
        '<div style="font-size:1.5rem; margin-bottom:4px;">\u274C Impossible</div>' +
        '<p style="font-size:0.85rem;">You would need a <strong>' + needed.toFixed(2) + '</strong> GPA, but the maximum is <strong>' + maxGpa.toFixed(2) + '</strong>.</p>' +
        '<p style="font-size:0.82rem; color:var(--gpa-text-muted); margin-top:8px;">Try a lower target or more upcoming credits.</p></div>';
    } else if (needed > maxGpa * 0.9) {
      resultEl.innerHTML = '<div class="gpa-whatif-result difficult">' +
        '<div style="font-size:1.5rem; margin-bottom:4px;">\u26A0\uFE0F Difficult</div>' +
        '<p style="font-size:0.85rem;">You need a <strong style="font-family:var(--gpa-mono);">' + needed.toFixed(2) + '</strong> GPA next semester.</p>' +
        '<p style="font-size:0.82rem; color:var(--gpa-text-muted); margin-top:4px;">That\'s ' + (needed / maxGpa * 100).toFixed(0) + '% of the maximum \u2014 very challenging but possible.</p></div>';
    } else if (needed < 0) {
      resultEl.innerHTML = '<div class="gpa-whatif-result possible">' +
        '<div style="font-size:1.5rem; margin-bottom:4px;">\u2705 Already There!</div>' +
        '<p style="font-size:0.85rem;">You\'ve already exceeded your target. Any positive GPA will keep you above ' + targetCgpa.toFixed(2) + '.</p></div>';
    } else {
      resultEl.innerHTML = '<div class="gpa-whatif-result possible">' +
        '<div style="font-size:1.5rem; margin-bottom:4px;">\u2705 Possible</div>' +
        '<p style="font-size:0.85rem;">You need a minimum <strong style="font-family:var(--gpa-mono);">' + needed.toFixed(2) + '</strong> GPA next semester.</p></div>';
    }
  }

  function calcTargetClass() {
    var currentCgpa = parseFloat(($('wfClassCurrentCgpa') || {}).value);
    var currentCredits = parseFloat(($('wfClassCurrentCredits') || {}).value);
    var targetMin = parseFloat(($('wfTargetClass') || {}).value);
    var upcomingCredits = parseFloat(($('wfClassUpcomingCredits') || {}).value);

    if (isNaN(currentCgpa) || isNaN(currentCredits) || isNaN(targetMin) || isNaN(upcomingCredits) || upcomingCredits <= 0) {
      showToast('Please fill all fields.');
      return;
    }

    var sys = getSystem();
    var maxGpa = sys ? sys.scale : 5.0;

    if (currentCgpa > maxGpa) {
      showToast('Current CGPA cannot exceed ' + maxGpa.toFixed(2));
      return;
    }

    var needed = (targetMin * (currentCredits + upcomingCredits) - currentCgpa * currentCredits) / upcomingCredits;

    // Find class name
    var className = '';
    if (sys && sys.classes) {
      for (var i = 0; i < sys.classes.length; i++) {
        if (sys.classes[i].min === targetMin) { className = sys.classes[i].name; break; }
      }
    }

    var resultEl = $('whatifResult');
    if (!resultEl) return;

    if (needed > maxGpa) {
      resultEl.innerHTML = '<div class="gpa-whatif-result impossible">' +
        '<div style="font-size:1.5rem; margin-bottom:4px;">\u274C Cannot Reach ' + escHtml(className) + '</div>' +
        '<p style="font-size:0.85rem;">You would need <strong>' + needed.toFixed(2) + '</strong>, but max is <strong>' + maxGpa.toFixed(2) + '</strong>.</p>' +
        '<p style="font-size:0.82rem; color:var(--gpa-text-muted); margin-top:8px;">Consider taking more credits to spread the requirement.</p></div>';
    } else if (needed > maxGpa * 0.9) {
      resultEl.innerHTML = '<div class="gpa-whatif-result difficult">' +
        '<div style="font-size:1.5rem; margin-bottom:4px;">\u26A0\uFE0F Challenging Target</div>' +
        '<p style="font-size:0.85rem;">To reach <strong>' + escHtml(className) + '</strong>, you need <strong style="font-family:var(--gpa-mono);">' + needed.toFixed(2) + '</strong> across ' + upcomingCredits + ' credits.</p>' +
        '<p style="font-size:0.82rem; color:var(--gpa-text-muted); margin-top:4px;">That\'s ' + (needed / maxGpa * 100).toFixed(0) + '% of max \u2014 difficult but achievable.</p></div>';
    } else if (needed <= 0) {
      resultEl.innerHTML = '<div class="gpa-whatif-result possible">' +
        '<div style="font-size:1.5rem; margin-bottom:4px;">\u2705 Already ' + escHtml(className) + '!</div>' +
        '<p style="font-size:0.85rem;">You\'ve already met the minimum. Keep it up!</p></div>';
    } else {
      resultEl.innerHTML = '<div class="gpa-whatif-result possible">' +
        '<div style="font-size:1.5rem; margin-bottom:4px;">\u{1F3AF} Target: ' + escHtml(className) + '</div>' +
        '<p style="font-size:0.85rem;">You need a minimum <strong style="font-family:var(--gpa-mono);">' + needed.toFixed(2) + '</strong> GPA across your remaining ' + upcomingCredits + ' credits.</p></div>';
    }
  }

  function calcGradeReplace() {
    var courseKey = ($('wfReplaceCourse') || {}).value;
    // Check for either select or input for new grade
    var gradeSelect = $('wfReplaceGrade');
    var gradeInput = $('wfReplaceGradeInput');
    var newGrade = gradeSelect ? gradeSelect.value : (gradeInput ? gradeInput.value : '');

    if (!courseKey || !newGrade) { showToast('Select a course and new grade.'); return; }

    var parts = courseKey.split('-');
    var semIdx = parseInt(parts[0]);
    var courseIdx = parseInt(parts[1]);
    var course = state.semesters[semIdx] && state.semesters[semIdx].courses[courseIdx];
    if (!course) return;

    var sys = getSystem();
    if (!sys) return;

    // Calculate current CGPA
    var currentTotal = { points: 0, credits: 0 };
    state.semesters.forEach(function (sem) {
      sem.courses.forEach(function (c) {
        var cr = parseFloat(c.credits);
        if (!c.grade || isNaN(cr) || cr <= 0) return;
        var pts = getCoursePoints(c.grade, sys);
        if (pts === null) return;
        currentTotal.points += pts * cr;
        currentTotal.credits += cr;
      });
    });

    // Recalculate with replaced grade
    var oldPts = getCoursePoints(course.grade, sys);
    var newPts = getCoursePoints(newGrade, sys);
    var cr = parseFloat(course.credits);
    if (oldPts === null || newPts === null || isNaN(cr)) {
      showToast('Invalid grade value.');
      return;
    }

    var newTotalPoints = currentTotal.points - (oldPts * cr) + (newPts * cr);
    var newCgpa = currentTotal.credits > 0 ? newTotalPoints / currentTotal.credits : 0;
    var oldCgpa = currentTotal.credits > 0 ? currentTotal.points / currentTotal.credits : 0;
    var diff = newCgpa - oldCgpa;

    var resultEl = $('whatifResult');
    if (!resultEl) return;

    // Get classifications
    var oldClass = getClassification(oldCgpa, sys);
    var newClass = getClassification(newCgpa, sys);
    var classChange = '';
    if (oldClass && newClass && oldClass.name !== newClass.name) {
      classChange = '<div style="margin-top:8px; font-size:0.82rem; font-weight:600; color:var(--gpa-accent);">' +
        'Classification: ' + oldClass.name + ' \u2192 ' + newClass.name + '</div>';
    }

    var cls = diff > 0 ? 'possible' : diff < 0 ? 'impossible' : 'difficult';
    resultEl.innerHTML = '<div class="gpa-whatif-result ' + cls + '">' +
      '<div style="font-size:0.85rem; margin-bottom:8px;">If you retake <strong>' + escHtml(course.name) + '</strong> and get <strong>' + escHtml(newGrade) + '</strong>:</div>' +
      '<div style="display:flex; justify-content:center; gap:24px; font-family:var(--gpa-mono);">' +
      '<div><div style="font-size:0.7rem; color:var(--gpa-text-muted);">OLD CGPA</div><div style="font-size:1.3rem;">' + oldCgpa.toFixed(2) + '</div></div>' +
      '<div style="font-size:1.3rem; align-self:center;">\u2192</div>' +
      '<div><div style="font-size:0.7rem; color:var(--gpa-text-muted);">NEW CGPA</div><div style="font-size:1.3rem; color:var(--gpa-accent);">' + newCgpa.toFixed(2) + '</div></div>' +
      '</div>' +
      '<div style="margin-top:8px; font-size:0.82rem; color:var(--gpa-text-secondary);">Change: ' + (diff >= 0 ? '+' : '') + diff.toFixed(3) + '</div>' +
      classChange + '</div>';
  }

  // ─── SHARING ─────────────────────────────────────────────────────
  function setupSharing() {
    var waBtn = $('shareWhatsapp');
    if (waBtn) waBtn.addEventListener('click', shareWhatsApp);

    var twBtn = $('shareTwitter');
    if (twBtn) twBtn.addEventListener('click', shareTwitter);

    var cpBtn = $('shareCopy');
    if (cpBtn) cpBtn.addEventListener('click', shareCopy);

    var pdfBtn = $('sharePdf');
    if (pdfBtn) pdfBtn.addEventListener('click', sharePdf);
  }

  function getShareText() {
    var sys = getSystem();
    var sysName = sys ? sys.name : state.system;
    return 'My CGPA: ' + state.cgpa.toFixed(2) + '/' + (sys ? sys.scale : '5.0') +
      (state.classification ? ' (' + state.classification + ')' : '') +
      ' | ' + state.totalCredits + ' credits' +
      ' | ' + sysName +
      '\n\nCalculated with AfroTools GPA Calculator \u{1F393}\nhttps://afrotools.com/tools/gpa-calculator/';
  }

  function shareWhatsApp() {
    window.open('https://wa.me/?text=' + encodeURIComponent(getShareText()), '_blank');
    track('result_shared', { method: 'whatsapp' });
  }

  function shareTwitter() {
    window.open('https://twitter.com/intent/tweet?text=' + encodeURIComponent(getShareText()), '_blank');
    track('result_shared', { method: 'twitter' });
  }

  function shareCopy() {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(getShareText()).then(function () {
        showToast('Result copied to clipboard!');
      });
    }
    track('result_shared', { method: 'copy' });
  }

  function sharePdf() {
    window.print();
    track('result_shared', { method: 'pdf' });
  }

  // ─── PERSISTENCE ─────────────────────────────────────────────────
  function saveState() {
    try {
      localStorage.setItem('afroGpaCalculator', JSON.stringify({
        semesters: state.semesters,
        currentSystem: state.system,
        semesterCount: state.semesterCount
      }));
    } catch (e) { /* quota exceeded, silent fail */ }
    // Cloud sync
    if (window.EduCloudSync) {
      EduCloudSync.save('gpa', {
        system: state.system,
        semesters: state.semesters,
        cgpa: state.cgpa || null,
        totalCredits: state.totalCredits || 0,
        updated_at: new Date().toISOString()
      });
    }
  }

  function loadState() {
    try {
      var saved = localStorage.getItem('afroGpaCalculator');
      if (!saved) return;
      var data = JSON.parse(saved);

      if (Array.isArray(data.semesters)) {
        state.semesters = data.semesters;
      }
      if (data.currentSystem && typeof GPA_GRADING_SYSTEMS !== 'undefined' && GPA_GRADING_SYSTEMS[data.currentSystem]) {
        state.system = data.currentSystem;
      }
      if (typeof data.semesterCount === 'number') {
        state.semesterCount = data.semesterCount;
      } else {
        state.semesterCount = state.semesters.length;
      }

      var sel = $('gradingSystem');
      if (sel) sel.value = state.system;
    } catch (e) {
      state.semesters = [];
      state.system = 'nigerian-federal';
      state.semesterCount = 0;
    }
  }

  // ─── COURSE NAME AUTOCOMPLETE ─────────────────────────────────
  function getSuggestions() {
    // Combine preset courses + global suggestions
    var all = [];
    if (typeof GPA_COURSE_SUGGESTIONS !== 'undefined') {
      all = all.concat(GPA_COURSE_SUGGESTIONS);
    }
    // Also pull from loaded presets
    if (typeof GPA_COURSE_PRESETS !== 'undefined') {
      for (var key in GPA_COURSE_PRESETS) {
        if (!GPA_COURSE_PRESETS.hasOwnProperty(key)) continue;
        var p = GPA_COURSE_PRESETS[key];
        for (var s in p.semesters) {
          if (!p.semesters.hasOwnProperty(s)) continue;
          p.semesters[s].forEach(function (c) {
            if (all.indexOf(c.name) === -1) all.push(c.name);
          });
        }
      }
    }
    return all;
  }

  function showAutoComplete(input, wrap) {
    var query = input.value.trim().toLowerCase();
    if (query.length < 2) { hideAutoComplete(wrap); return; }

    var suggestions = getSuggestions();
    var matches = suggestions.filter(function (s) {
      return s.toLowerCase().indexOf(query) !== -1;
    }).slice(0, 8);

    if (matches.length === 0) { hideAutoComplete(wrap); return; }

    var list = wrap.querySelector('.gpa-autocomplete-list');
    if (!list) {
      list = document.createElement('div');
      list.className = 'gpa-autocomplete-list';
      list.setAttribute('role', 'listbox');
      wrap.appendChild(list);
    }

    list.innerHTML = '';
    matches.forEach(function (m) {
      var item = document.createElement('div');
      item.className = 'gpa-autocomplete-item';
      item.setAttribute('role', 'option');

      // Highlight matching text
      var idx = m.toLowerCase().indexOf(query);
      if (idx !== -1) {
        item.innerHTML = escHtml(m.substring(0, idx)) +
          '<mark>' + escHtml(m.substring(idx, idx + query.length)) + '</mark>' +
          escHtml(m.substring(idx + query.length));
      } else {
        item.textContent = m;
      }

      item.addEventListener('mousedown', function (e) {
        e.preventDefault(); // prevent blur
        input.value = m;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        hideAutoComplete(wrap);
        // Auto-focus credits field
        var card = wrap.closest('.gpa-course-card');
        if (card) {
          var credInput = card.querySelector('input[data-field="credits"]');
          if (credInput && !credInput.value) credInput.focus();
        }
      });

      list.appendChild(item);
    });

    list.classList.add('show');
    wrap._highlightIdx = -1;
  }

  function hideAutoComplete(wrap) {
    var list = wrap.querySelector('.gpa-autocomplete-list');
    if (list) list.classList.remove('show');
  }

  function handleAutoCompleteKey(e, wrap) {
    var list = wrap.querySelector('.gpa-autocomplete-list');
    if (!list || !list.classList.contains('show')) return;

    var items = list.querySelectorAll('.gpa-autocomplete-item');
    if (items.length === 0) return;

    var idx = wrap._highlightIdx || -1;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      idx = Math.min(idx + 1, items.length - 1);
      highlightItem(items, idx);
      wrap._highlightIdx = idx;
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      idx = Math.max(idx - 1, 0);
      highlightItem(items, idx);
      wrap._highlightIdx = idx;
    } else if (e.key === 'Enter' && idx >= 0) {
      e.preventDefault();
      items[idx].dispatchEvent(new MouseEvent('mousedown'));
    } else if (e.key === 'Escape') {
      hideAutoComplete(wrap);
    }
  }

  function highlightItem(items, idx) {
    for (var i = 0; i < items.length; i++) {
      items[i].classList.toggle('highlighted', i === idx);
    }
    if (items[idx]) items[idx].scrollIntoView({ block: 'nearest' });
  }

  // ─── TOAST ───────────────────────────────────────────────────────
  function showToast(msg) {
    if (typeof window.AfroToast === 'function') {
      window.AfroToast(msg);
    } else if (typeof window.showToast === 'function') {
      window.showToast(msg);
    } else {
      // Fallback: simple toast
      var t = document.createElement('div');
      t.textContent = msg;
      t.style.cssText = 'position:fixed;bottom:72px;left:50%;transform:translateX(-50%);background:#0f172a;color:#E2E8F0;padding:10px 20px;border-radius:8px;font-size:0.85rem;z-index:9999;border:1px solid rgba(0,135,81,0.3);box-shadow:0 4px 12px rgba(0,0,0,0.15);';
      document.body.appendChild(t);
      setTimeout(function () { t.remove(); }, 3000);
    }
  }

})();
