(function () {
  'use strict';
  var core = window.AfroSeoProjects;
  var root = document.getElementById('seoProjects');
  if (!core || !root) return;
  var state = core.emptyState(), writable = true, page = 0, fixPage = 0, busy = false, auditProjectId = null;
  var esc = core.escape;
  function el(id) { return document.getElementById(id); }
  function message(value, error) { el('projectStatus').textContent = value; el('projectStatus').dataset.error = error ? 'true' : 'false'; }
  function commit(next, notice) {
    if (!writable) throw Error('Existing saved data could not be read. Export the recovery backup before restoring a valid backup.');
    core.persist(window.localStorage, next);
    state = next;
    render();
    if (notice) message(notice);
  }
  function action(fn) { try { fn(); } catch (error) { message(error.message || 'The action could not be completed.', true); } }
  function download(content, filename, type) {
    var url = URL.createObjectURL(new Blob([content], { type: type }));
    var link = document.createElement('a'); link.href = url; link.download = filename;
    document.body.appendChild(link); link.click(); link.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }
  function num(value) { return value === null ? '—' : Number(value).toLocaleString('en', { maximumFractionDigits: 1 }); }
  function signed(value) { return value === null ? '—' : (value > 0 ? '+' : '') + num(value); }
  function pct(value) { return (value * 100).toFixed(2) + '%'; }
  function period(prefix) { return { start: el(prefix + 'Start').value, end: el(prefix + 'End').value, filters: el('searchFilters').value }; }
  function clearImportInputs() { ['previousFile', 'currentFile', 'previousStart', 'previousEnd', 'currentStart', 'currentEnd'].forEach(function (id) { el(id).value = ''; }); }
  function render() {
    el('projectSelect').innerHTML = state.projects.map(function (p) { return '<option value="' + esc(p.id) + '">' + esc(p.name) + ' · ' + esc(p.origin) + '</option>'; }).join('') || '<option value="">No projects yet</option>';
    el('projectSelect').value = state.selectedId || '';
    var hasProject = !!state.selectedId;
    el('projectDashboard').hidden = !hasProject;
    el('projectEmpty').hidden = hasProject;
    el('deleteProject').disabled = !hasProject || busy;
    el('projectSelect').disabled = busy;
    el('restoreProjects').disabled = busy;
    el('createProjectForm').querySelectorAll('input,button').forEach(function (node) { node.disabled = busy; });
    el('exportProjectReport').disabled = !hasProject || busy;
    if (!hasProject) return;
    var p = core.selected(state), queue = core.fixQueue(p);
    el('projectNameDisplay').textContent = p.name;
    el('projectOriginDisplay').textContent = p.origin;
    el('metricPages').textContent = new Set(p.audits.map(function (a) { return a.url; })).size;
    el('metricOpen').textContent = queue.filter(function (f) { return !f.verifiedAt && f.status !== 'done'; }).length;
    el('metricDone').textContent = queue.filter(function (f) { return !f.verifiedAt && f.status === 'done'; }).length;
    el('metricVerified').textContent = queue.filter(function (f) { return f.verifiedAt; }).length;
    renderPages(p); renderFixes(p); renderSearch(p);
  }
  function renderPages(p) {
    var urls = Array.from(new Set(p.audits.map(function (a) { return a.url; })));
    el('projectPagesRows').innerHTML = urls.map(function (url) {
      var history = p.audits.filter(function (a) { return a.url === url; }), a = history[history.length - 1];
      return '<tr><td><strong>' + esc(a.title || url) + '</strong><small>' + esc(url) + '</small></td><td>' + a.score + '/100<small>Change: ' + signed(core.scoreDelta(history)) + '</small></td><td>' + esc(a.fetchedAt.slice(0, 16).replace('T', ' ')) + ' UTC<small>Method ' + esc(a.methodologyVersion) + '</small></td><td><button type="button" class="ses-btn" data-project-audit="' + esc(url) + '">Re-audit page</button></td></tr>';
    }).join('') || '<tr><td colspan="4">No project pages yet. Run a page audit below to begin.</td></tr>';
  }
  function renderFixes(p) {
    var filter = el('fixFilter').value;
    var rows = core.fixQueue(p).filter(function (f) { return filter === 'all' || (filter === 'verified' ? !!f.verifiedAt : !f.verifiedAt); });
    fixPage = Math.min(fixPage, Math.max(0, Math.ceil(rows.length / 25) - 1));
    el('fixRows').innerHTML = rows.slice(fixPage * 25, fixPage * 25 + 25).map(function (f) {
      return '<tr><td><span class="asp-pill">' + (f.verifiedAt ? 'Verified resolved' : f.severity === 'fail' ? 'Failure' : 'Review') + '</span><br><strong>' + esc(f.label) + '</strong><small>' + esc(f.url) + '</small><small>' + (f.impressions === null ? 'Page impressions not imported' : num(f.impressions) + ' imported page impressions') + '</small></td><td><p>' + esc(f.detail) + '</p><details><summary>Recommended action and evidence</summary><p>' + esc(f.fix) + '</p><small>' + esc(f.evidence) + ' · Last observed ' + esc(f.lastSeen.slice(0, 10)) + '</small></details></td><td>' + (f.verifiedAt ? 'Passed recheck<small>' + esc(f.verifiedAt.slice(0, 10)) + '</small>' : '<label for="fix-' + esc(encodeURIComponent(f.key)) + '">Work status</label><select id="fix-' + esc(encodeURIComponent(f.key)) + '" data-fix-key="' + esc(f.key) + '">' + ['open', 'in-progress', 'done'].map(function (s) { return '<option value="' + s + '"' + (f.status === s ? ' selected' : '') + '>' + { open: 'Open', 'in-progress': 'In progress', done: 'Done — recheck needed' }[s] + '</option>'; }).join('') + '</select>') + '</td></tr>';
    }).join('') || '<tr><td colspan="3">No fixes in this view. Run an audit or change the filter.</td></tr>';
    el('fixPageLabel').textContent = rows.length ? 'Showing ' + (fixPage * 25 + 1) + '–' + Math.min(rows.length, fixPage * 25 + 25) + ' of ' + rows.length : '0 fixes';
    el('fixPrev').disabled = fixPage === 0; el('fixNext').disabled = (fixPage + 1) * 25 >= rows.length;
  }
  function recommendation(r) {
    if (r.status !== 'matched') return 'Check export coverage before drawing a conclusion.';
    if (r.clickDelta < 0 && r.ctrDelta < 0 && r.current.impressions >= r.previous.impressions) return 'Review title, snippet and search intent; impressions held up while CTR fell.';
    if (r.clickDelta < 0) return 'Review demand, position, competitors and page changes. The cause is not established.';
    return 'Monitor the next comparable period; this change does not prove causality.';
  }
  function renderSearch(p) {
    el('searchResults').hidden = !p.search;
    if (!p.search) return;
    var comparison = core.compareSearch(p.search.previous, p.search.current), a = comparison.previous, b = comparison.current;
    el('searchScope').textContent = 'Imported ' + b.dimension + ' rows · ' + a.period.start + '–' + a.period.end + ' compared with ' + b.period.start + '–' + b.period.end + ' · ' + b.period.filters;
    el('searchTotals').textContent = 'Exported-row totals: clicks ' + num(a.summary.clicks) + ' → ' + num(b.summary.clicks) + '; impressions ' + num(a.summary.impressions) + ' → ' + num(b.summary.impressions) + '; CTR ' + pct(a.summary.ctr) + ' → ' + pct(b.summary.ctr) + '; weighted position ' + num(a.summary.position) + ' → ' + num(b.summary.position) + '.';
    var query = el('searchRowFilter').value.trim().toLowerCase();
    var rows = comparison.rows.filter(function (r) { return r.key.toLowerCase().includes(query); });
    page = Math.min(page, Math.max(0, Math.ceil(rows.length / 25) - 1));
    el('searchRows').innerHTML = rows.slice(page * 25, page * 25 + 25).map(function (r) {
      return '<tr><td>' + esc(r.key) + '<small>' + esc(r.status.replace(/-/g, ' ')) + '</small><details><summary>What to review</summary><p>' + esc(recommendation(r)) + '</p></details></td><td>' + (r.previous ? num(r.previous.clicks) : 'Unknown') + ' → ' + (r.current ? num(r.current.clicks) : 'Unknown') + '<small>Change ' + signed(r.clickDelta) + '</small></td><td>' + (r.previous ? num(r.previous.impressions) : 'Unknown') + ' → ' + (r.current ? num(r.current.impressions) : 'Unknown') + '</td><td>' + (r.ctrDelta === null ? '—' : signed(r.ctrDelta * 100) + ' pp') + '<small>Position ' + signed(r.positionDelta) + ' (negative improves)</small></td></tr>';
    }).join('') || '<tr><td colspan="4">No matching rows.</td></tr>';
    el('searchPageLabel').textContent = rows.length ? 'Showing ' + (page * 25 + 1) + '–' + Math.min(rows.length, page * 25 + 25) + ' of ' + rows.length : '0 rows';
    el('searchPrev').disabled = page === 0; el('searchNext').disabled = (page + 1) * 25 >= rows.length;
  }
  el('createProjectForm').addEventListener('submit', function (event) {
    event.preventDefault(); action(function () { commit(core.createProject(state, el('newProjectName').value, el('newProjectUrl').value), 'Project created on this device. Audit a page to build your fix queue.'); el('newProjectName').value = ''; el('newProjectUrl').value = ''; el('auditUrl').value = core.selected(state).origin + '/'; clearImportInputs(); });
  });
  el('projectSelect').addEventListener('change', function () { action(function () { page = 0; fixPage = 0; commit(core.selectProject(state, el('projectSelect').value)); clearImportInputs(); el('auditUrl').value = core.selected(state).origin + '/'; }); });
  el('deleteProject').addEventListener('click', function () {
    if (!state.selectedId || !window.confirm('Delete this project from this device? Export a backup first if you need to keep its audits and search data.')) return;
    action(function () { commit(core.deleteProject(state, state.selectedId), 'Project deleted from this device.'); clearImportInputs(); });
  });
  el('backupProjects').addEventListener('click', function () { action(function () { var raw = writable ? JSON.stringify(state) : window.localStorage.getItem(core.KEY); download(raw || '{}', 'afroseo-projects-backup.json', 'application/json'); message('Backup downloaded. It contains your website and imported search data; keep it private.'); }); });
  el('restoreProjects').addEventListener('change', async function () {
    var file = this.files[0]; if (!file) return;
    try {
      if (file.size > 4 * 1024 * 1024) throw Error('Backup must be smaller than 4 MB.');
      var next = core.restoreBackup(await file.text());
      if (window.confirm('Replace all projects on this device with this validated backup? Download your current backup first if needed.')) {
        core.persist(window.localStorage, next); state = next; writable = true; render(); clearImportInputs(); message('Backup restored to this device.');
      }
    } catch (error) { message(error.message, true); }
    this.value = '';
  });
  el('exportProjectReport').addEventListener('click', function () { action(function () { download(core.renderProjectReport(core.selected(state)), 'afroseo-progress-report.html', 'text/html'); message('Report downloaded. Open it and choose Print to save as PDF. Review private search queries before sharing.'); }); });
  el('fixRows').addEventListener('change', function (event) { var key = event.target.dataset.fixKey, id = event.target.id; if (key) action(function () { commit(core.setFixStatus(state, key, event.target.value), 'Work status saved. Re-audit the page to verify the fix.'); if (el(id)) el(id).focus({ preventScroll: true }); }); });
  el('fixFilter').addEventListener('change', function () { fixPage = 0; render(); });
  el('searchRowFilter').addEventListener('input', function () { page = 0; renderSearch(core.selected(state)); });
  ['fixPrev', 'fixNext', 'searchPrev', 'searchNext'].forEach(function (id) { el(id).addEventListener('click', function () { if (id.startsWith('fix')) fixPage += id.endsWith('Next') ? 1 : -1; else page += id.endsWith('Next') ? 1 : -1; render(); }); });
  el('projectPagesRows').addEventListener('click', function (event) {
    var button = event.target.closest('[data-project-audit]');
    if (!button || busy || el('auditBtn').disabled) return;
    el('auditUrl').value = button.dataset.projectAudit; el('auditForm').requestSubmit(); el('auditTitle').scrollIntoView({ block: 'start' });
  });
  el('importSearchForm').addEventListener('submit', async function (event) {
    event.preventDefault(); if (busy) return;
    var projectId = state.selectedId;
    try {
      var p = core.selected(state), previousFile = el('previousFile').files[0], currentFile = el('currentFile').files[0];
      if (!previousFile || !currentFile) throw Error('Select both CSV exports.');
      if (previousFile.size > 2097152 || currentFile.size > 2097152) throw Error('Each CSV must be no larger than 2 MB.');
      busy = true; el('importSearchBtn').disabled = true; el('auditBtn').disabled = true; render();
      message('Reading exports locally. No search data is being uploaded.');
      var periods = [period('previous'), period('current')];
      var files = await Promise.all([previousFile.text(), currentFile.text()]);
      if (projectId !== state.selectedId) throw Error('Project changed during import. Select the files again.');
      var a = core.parseSearchCsv(files[0], periods[0], p.origin), b = core.parseSearchCsv(files[1], periods[1], p.origin);
      page = 0; commit(core.setSearch(state, a, b), 'Search comparison saved locally. Missing export rows remain unknown.');
    } catch (error) { message(error.message, true); }
    finally { busy = false; el('importSearchBtn').disabled = false; el('auditBtn').disabled = false; render(); }
  });
  window.AfroSeoWorkspace = {
    auditStarted: function () { auditProjectId = state.selectedId; busy = true; render(); },
    auditFinished: function () { busy = false; render(); },
    observe: function (report) { if (!auditProjectId) return; if (state.selectedId !== auditProjectId) { message('Project changed during the audit. The standalone result was not saved to a project.', true); return; } action(function () { commit(core.addAudit(state, report), 'Page observation saved. The fix queue reflects the latest comparable checks.'); }); }
  };
  try { state = core.load(window.localStorage); } catch (error) { writable = false; message(error.message, true); }
  render();
})();
