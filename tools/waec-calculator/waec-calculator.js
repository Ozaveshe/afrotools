(function () {
  'use strict';

  var STORAGE_KEY = 'afrotools_waec';
  var state = {
    system: 'ng-waec-neco',
    pathway: 'science',
    subjects: []
  };

  var SYSTEMS = {
    'ng-waec-neco': {
      name: 'Nigeria — WAEC or NECO',
      metric: 'Best-five planning index',
      info: 'Records your A1–F9 results, counts credits, and produces a best-five planning index. It does not predict admission.',
      subjects: [
        { name: 'English Language', compulsory: true },
        { name: 'Mathematics', compulsory: true },
        { name: 'Civic Education', compulsory: false },
        { name: '', compulsory: false },
        { name: '', compulsory: false },
        { name: '', compulsory: false },
        { name: '', compulsory: false },
        { name: '', compulsory: false },
        { name: '', compulsory: false }
      ]
    },
    'gh-wassce': {
      name: 'Ghana — WASSCE',
      metric: 'Three core + three elective aggregate',
      info: 'Uses English, Core Mathematics, your programme core, and the best three entered electives. Confirm the exact programme rules with the institution.',
      subjects: [
        { name: 'English Language', compulsory: true, role: 'core' },
        { name: 'Core Mathematics', compulsory: true, role: 'core' },
        { name: 'Integrated Science', compulsory: true, role: 'programme-core' },
        { name: 'Social Studies', compulsory: false, role: 'alternate-core' },
        { name: '', compulsory: false, role: 'elective' },
        { name: '', compulsory: false, role: 'elective' },
        { name: '', compulsory: false, role: 'elective' },
        { name: '', compulsory: false, role: 'elective' }
      ]
    }
  };

  function byId(id) {
    return document.getElementById(id);
  }

  function escapeHtml(value) {
    var element = document.createElement('div');
    element.textContent = String(value || '');
    return element.innerHTML;
  }

  function announce(message) {
    var target = byId('wcFormStatus');
    if (target) target.textContent = message || '';
  }

  function track(eventName, metadata) {
    if (typeof window.gtag === 'function') window.gtag('event', eventName, metadata || {});
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        examSystem: state.system,
        pathway: state.pathway,
        subjects: state.subjects
      }));
    } catch (error) {
      // The calculator still works when local storage is unavailable.
    }
  }

  function load() {
    try {
      var saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      if (SYSTEMS[saved.examSystem]) state.system = saved.examSystem;
      if (saved.pathway === 'science' || saved.pathway === 'non-science') state.pathway = saved.pathway;
      if (Array.isArray(saved.subjects) && saved.subjects.length) state.subjects = saved.subjects;
    } catch (error) {
      // Invalid local data is ignored.
    }
  }

  function freshSubjects() {
    return SYSTEMS[state.system].subjects.map(function (subject) {
      return Object.assign({ grade: '' }, subject);
    });
  }

  function syncGhanaProgrammeCore() {
    if (state.system !== 'gh-wassce') return;
    state.subjects.forEach(function (subject) {
      if (subject.name === 'Integrated Science') subject.compulsory = state.pathway === 'science';
      if (subject.name === 'Social Studies') subject.compulsory = state.pathway === 'non-science';
    });
  }

  function renderSystemControls() {
    var systemSelect = byId('examSystem');
    systemSelect.innerHTML = Object.keys(SYSTEMS).map(function (id) {
      return '<option value="' + id + '">' + SYSTEMS[id].name + '</option>';
    }).join('');
    systemSelect.value = state.system;

    var pathwayGroup = byId('trackGroup');
    var pathwaySelect = byId('trackSelect');
    if (state.system === 'gh-wassce') {
      pathwayGroup.style.display = '';
      pathwayGroup.querySelector('label').textContent = 'Programme core used';
      pathwaySelect.setAttribute('aria-label', 'Choose Ghana programme core');
      pathwaySelect.innerHTML = [
        '<option value="science">Science programme — Integrated Science</option>',
        '<option value="non-science">Non-science programme — Social Studies</option>'
      ].join('');
      pathwaySelect.value = state.pathway;
    } else {
      pathwayGroup.style.display = 'none';
    }
  }

  function renderSubjects() {
    syncGhanaProgrammeCore();
    var container = byId('subjectsContainer');
    container.innerHTML = '';
    state.subjects.forEach(function (subject, index) {
      var row = document.createElement('div');
      row.className = 'wc-subject-row' + (subject.compulsory ? ' compulsory' : '');

      var nameWrap = document.createElement('div');
      nameWrap.className = 'wc-subject-name';
      if (subject.name && subject.compulsory) {
        nameWrap.appendChild(document.createTextNode(subject.name + ' '));
        var tag = document.createElement('span');
        tag.className = 'tag';
        tag.textContent = 'Included';
        nameWrap.appendChild(tag);
      } else {
        var nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.className = 'wc-input';
        nameInput.value = subject.name || '';
        nameInput.placeholder = subject.role === 'alternate-core' ? 'Other core subject' : 'Subject name';
        nameInput.setAttribute('aria-label', 'Subject name ' + (index + 1));
        if (subject.name === 'Integrated Science' || subject.name === 'Social Studies') nameInput.readOnly = true;
        nameInput.addEventListener('input', function () {
          state.subjects[index].name = this.value;
          calculate();
        });
        nameWrap.appendChild(nameInput);
      }

      var gradeSelect = document.createElement('select');
      gradeSelect.className = 'wc-grade-select';
      gradeSelect.setAttribute('aria-label', 'Grade for ' + (subject.name || ('subject ' + (index + 1))));
      gradeSelect.innerHTML = '<option value="">Select grade</option>' +
        Object.keys(window.WAECPlannerEngine.grades).map(function (grade) {
          var detail = window.WAECPlannerEngine.grades[grade];
          return '<option value="' + grade + '">' + grade + ' — ' + detail.label + '</option>';
        }).join('');
      gradeSelect.value = subject.grade || '';
      gradeSelect.addEventListener('change', function () {
        state.subjects[index].grade = this.value;
        calculate();
      });

      var remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'wc-subject-delete';
      remove.setAttribute('aria-label', 'Remove subject ' + (index + 1));
      remove.textContent = '×';
      if (subject.compulsory || subject.name === 'Integrated Science' || subject.name === 'Social Studies') {
        remove.disabled = true;
        remove.style.opacity = '0.2';
      } else {
        remove.addEventListener('click', function () {
          state.subjects.splice(index, 1);
          renderSubjects();
          calculate();
        });
      }

      row.appendChild(nameWrap);
      row.appendChild(gradeSelect);
      row.appendChild(remove);
      container.appendChild(row);
    });
  }

  function getResult() {
    if (state.system === 'gh-wassce') {
      return window.WAECPlannerEngine.calculateGhana(state.subjects, state.pathway);
    }
    return window.WAECPlannerEngine.calculateNigeria(state.subjects);
  }

  function setResultText(id, value) {
    var element = byId(id);
    if (element) element.textContent = value;
  }

  function renderChecks(result) {
    var list = byId('eligibilityList');
    list.innerHTML = result.checks.map(function (check) {
      return '<div class="wc-elig-item ' + (check.pass ? 'pass' : 'warning') + '">' +
        '<span>' + escapeHtml(check.label) + '</span><span>' + (check.pass ? '✓' : 'Review') + '</span></div>';
    }).join('') +
      '<p class="wc-check-note">' + escapeHtml(result.note) + '</p>';
  }

  function calculate() {
    var result = getResult();
    var value = result.value === null ? '--' : String(result.value);
    setResultText('resultAggregate', value);
    setResultText('mobileAgg', value);
    setResultText('resultSubjects', String(result.entered));
    setResultText('resultCredits', String(result.credits));
    setResultText('resultBestOf', result.metricLabel);
    setResultText('classBadge', result.complete ? 'Ready for official requirement checks' : 'Add the required results');
    setResultText('mobileClass', result.complete ? 'Plan ready' : 'Incomplete');
    setResultText('aggMaxLabel', state.system === 'gh-wassce' ? '54 (Highest)' : '45 (Highest)');

    var resultLabel = document.querySelector('.wc-result-label');
    if (resultLabel) resultLabel.textContent = result.metricLabel;
    var minLabel = document.querySelector('.wc-agg-labels span:first-child');
    if (minLabel) minLabel.textContent = state.system === 'gh-wassce' ? '6 (Lowest)' : '5 (Lowest)';

    var badge = byId('classBadge');
    if (badge) {
      badge.style.background = result.complete ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)';
      badge.style.color = result.complete ? '#047857' : '#b45309';
    }
    var fill = byId('aggFill');
    if (fill) {
      var max = state.system === 'gh-wassce' ? 54 : 45;
      var min = state.system === 'gh-wassce' ? 6 : 5;
      var width = result.value === null ? 0 : Math.max(3, 100 - ((result.value - min) / (max - min) * 100));
      fill.style.width = width + '%';
      fill.style.background = result.complete ? 'var(--wc-success)' : 'var(--wc-amber)';
    }

    var selected = byId('selectedSubjects');
    if (selected) {
      selected.style.display = result.selected.length ? '' : 'none';
      selected.innerHTML = result.selected.length
        ? '<strong>Counted:</strong> ' + result.selected.map(function (row) {
          return escapeHtml(row.name) + ' (' + row.grade + ')';
        }).join(', ')
        : '';
    }
    renderChecks(result);
    save();
    track('calculation_completed', {
      tool_id: 'waec-calculator',
      system: state.system,
      complete: result.complete,
      entered_subject_count: result.entered,
      credit_count: result.credits
    });
  }

  function renderReference() {
    var table = byId('converterTable');
    if (!table) return;
    table.innerHTML = '<table class="wc-ref-table"><thead><tr><th>Result grade</th><th>Planning point</th><th>Result category</th></tr></thead><tbody>' +
      Object.keys(window.WAECPlannerEngine.grades).map(function (grade) {
        var detail = window.WAECPlannerEngine.grades[grade];
        return '<tr><td><strong>' + grade + '</strong></td><td>' + detail.points + '</td><td>' + detail.label + '</td></tr>';
      }).join('') +
      '</tbody></table><p class="wc-check-note">These points support the planning summaries on this page. They are not a university GPA conversion.</p>';
  }

  function setupTabs() {
    document.querySelectorAll('.wc-tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        var target = this.getAttribute('data-tab');
        document.querySelectorAll('.wc-tab').forEach(function (item) {
          item.classList.remove('active');
          item.setAttribute('aria-selected', 'false');
        });
        document.querySelectorAll('.wc-tab-content').forEach(function (panel) {
          panel.classList.remove('active');
        });
        this.classList.add('active');
        this.setAttribute('aria-selected', 'true');
        var panel = byId(target);
        if (panel) panel.classList.add('active');
      });
    });
  }

  function shareText() {
    var result = getResult();
    return SYSTEMS[state.system].name + '\n' +
      result.metricLabel + ': ' + (result.value === null ? 'Incomplete' : result.value) + '\n' +
      'Credits recorded: ' + result.credits + '\n' +
      result.note + '\nhttps://afrotools.com/tools/waec-calculator/';
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    var textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    textarea.remove();
    return Promise.resolve();
  }

  function setupShare() {
    byId('shareWhatsapp').addEventListener('click', function () {
      window.open('https://wa.me/?text=' + encodeURIComponent(shareText()), '_blank', 'noopener');
    });
    byId('shareTwitter').addEventListener('click', function () {
      window.open('https://twitter.com/intent/tweet?text=' + encodeURIComponent(shareText()), '_blank', 'noopener');
    });
    byId('shareCopy').addEventListener('click', function () {
      copyText(shareText()).then(function () { announce('Result summary copied.'); });
    });
    byId('sharePdf').addEventListener('click', function () {
      window.print();
    });
  }

  function setupFaq() {
    document.querySelectorAll('.wc-faq-q').forEach(function (question) {
      question.setAttribute('tabindex', '0');
      question.setAttribute('role', 'button');
      function toggle() {
        question.parentElement.classList.toggle('open');
      }
      question.addEventListener('click', toggle);
      question.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          toggle();
        }
      });
    });
  }

  window.loadWaecSample = function () {
    state.system = 'ng-waec-neco';
    state.subjects = [
      { name: 'English Language', grade: 'B3', compulsory: true },
      { name: 'Mathematics', grade: 'B2', compulsory: true },
      { name: 'Civic Education', grade: 'A1', compulsory: false },
      { name: 'Biology', grade: 'A1', compulsory: false },
      { name: 'Chemistry', grade: 'B3', compulsory: false },
      { name: 'Physics', grade: 'C4', compulsory: false },
      { name: 'Economics', grade: 'C5', compulsory: false }
    ];
    renderSystemControls();
    renderSubjects();
    calculate();
    announce('Sample Nigeria results loaded. Review the credit audit and official next steps.');
  };

  window.clearWaecGrades = function () {
    state.subjects = freshSubjects();
    renderSubjects();
    calculate();
    announce('Grades cleared.');
  };

  document.addEventListener('DOMContentLoaded', function () {
    if (!window.WAECPlannerEngine) {
      announce('The result engine did not load. Refresh the page and try again.');
      return;
    }
    load();
    if (!state.subjects.length) state.subjects = freshSubjects();
    renderSystemControls();
    renderSubjects();
    renderReference();
    setupTabs();
    setupShare();
    setupFaq();

    byId('examSystem').addEventListener('change', function () {
      state.system = this.value;
      state.pathway = 'science';
      state.subjects = freshSubjects();
      renderSystemControls();
      renderSubjects();
      calculate();
      announce('Exam system changed. Enter the results shown on your official statement.');
    });
    byId('trackSelect').addEventListener('change', function () {
      state.pathway = this.value;
      syncGhanaProgrammeCore();
      renderSubjects();
      calculate();
      announce('Programme core changed. Confirm the choice with the programme you plan to apply for.');
    });
    byId('addSubjectBtn').addEventListener('click', function () {
      state.subjects.push({ name: '', grade: '', compulsory: false, role: 'elective' });
      renderSubjects();
      calculate();
    });

    calculate();
    track('tool_opened', { tool_id: 'waec-calculator', system: state.system });
  });
})();
