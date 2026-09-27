(function () {
  'use strict';
  function track(name, values) {
    var analytics = window.AfroTools && window.AfroTools.analytics;
    if (analytics && typeof analytics.track === 'function') analytics.track(name, values);
  }
  document.addEventListener('click', function (event) {
    var link = event.target.closest('.edu-task, .edu-tool-card, .edu-directory-links a, .edu-return a, .edu-secondary a');
    if (!link) return;
    var route = link.getAttribute('href') || '';
    if (!/^\/[a-z0-9/-]+\/$/.test(route)) return;
    var name = link.classList.contains('edu-task') ? 'education_task_start'
      : link.closest('.edu-return') ? 'education_saved_work_opened' : 'education_tool_opened';
    track(name, { route: route });
  });
  var query = document.getElementById('education-search');
  if (!query) return;
  var country = document.getElementById('education-country');
  var exam = document.getElementById('education-exam');
  var status = document.getElementById('education-search-status');
  var empty = document.getElementById('education-no-results');
  var clear = document.getElementById('education-clear');
  var starting = document.getElementById('education-starting-tools');
  var directory = document.getElementById('directory');
  var links = Array.prototype.slice.call(directory.querySelectorAll('.edu-directory-links [data-education-tool]'));
  var featured = Array.prototype.slice.call(document.querySelectorAll('.edu-tool-grid [data-education-tool]'));
  var groups = Array.prototype.slice.call(directory.querySelectorAll('.edu-directory-group'));
  var wasEmpty = false;
  function matches(link) {
    var terms = (query.value || '').trim().toLowerCase().split(/\s+/).filter(Boolean);
    var haystack = link.getAttribute('data-search') || '';
    var countries = (link.getAttribute('data-country') || '').split(/\s+/);
    var exams = (link.getAttribute('data-exam') || '').split(/\s+/);
    return terms.every(function (term) { return haystack.indexOf(term) !== -1; }) &&
      (!country.value || countries.indexOf('ALL') !== -1 || countries.indexOf(country.value) !== -1) &&
      (!exam.value || exams.indexOf(exam.value) !== -1);
  }
  function update() {
    var visible = 0;
    var active = Boolean(query.value.trim() || country.value || exam.value);
    links.forEach(function (link) {
      var show = matches(link);
      link.hidden = !show;
      if (show) visible++;
    });
    var featuredCount = 0;
    featured.forEach(function (link) {
      link.hidden = !matches(link);
      if (!link.hidden) featuredCount++;
    });
    starting.hidden = active && featuredCount === 0;
    groups.forEach(function (group) {
      var hasMatch = Boolean(group.querySelector('.edu-directory-links a:not([hidden])'));
      group.hidden = !hasMatch;
      if (active && hasMatch) group.open = true;
      else if (!active) group.open = group.getAttribute('data-default-open') === 'true';
    });
    status.textContent = visible + (visible === 1 ? ' tool matches.' : ' tools match.');
    clear.hidden = !active;
    empty.hidden = visible !== 0;
    if (visible === 0 && !wasEmpty) track('education_discovery_empty', {
      country_code: country.value || 'all', exam: exam.value || 'all'
    });
    wasEmpty = visible === 0;
  }
  clear.addEventListener('click', function () {
    query.value = '';
    country.value = '';
    exam.value = '';
    update();
    query.focus();
  });
  [query, country, exam].forEach(function (field) { field.addEventListener(field === query ? 'input' : 'change', update); });
  update();
})();
