/* AfroSEO project domain model. No network, DOM, analytics or implicit storage writes. */
(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.AfroSeoProjects = api;
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';
  var KEY = 'afroseo_projects_v2';
  var MAX_STATE = 4 * 1024 * 1024;
  var MAX_CSV = 2 * 1024 * 1024;
  var STATUSES = ['open', 'in-progress', 'done'];
  function fail(message) { throw new Error(message); }
  function bytes(value) { return new TextEncoder().encode(value).length; }
  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function text(value, max) {
    if (typeof value !== 'string' || value.length > max) fail('Invalid or oversized text field.');
    return value;
  }
  function number(value, max) {
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > max) fail('Invalid metric in saved data.');
    return value;
  }
  function timestamp(value) {
    text(value, 40);
    if (!Number.isFinite(Date.parse(value))) fail('Invalid observation date.');
    return value;
  }
  function pageUrl(raw) {
    var url;
    try { url = new URL(raw); } catch (_) { fail('Enter a full website URL, such as https://example.com.'); }
    if (!/^https?:$/.test(url.protocol) || url.username || url.password || (url.port && url.port !== '80' && url.port !== '443')) fail('Use an HTTP(S) URL without credentials or custom ports.');
    if (!url.hostname.includes('.') || /(?:^|\.)(?:localhost|local|internal)$/.test(url.hostname)) fail('Use a public website domain.');
    if (url.href.length > 2048) fail('The page URL is too long.');
    url.hash = '';
    return url;
  }
  function emptyState() { return { version: 2, selectedId: null, projects: [] }; }
  function selected(state) {
    var project = state.projects.find(function (p) { return p.id === state.selectedId; });
    if (!project) fail('Create or select a website project first.');
    return project;
  }
  function createProject(state, name, rawUrl) {
    name = text(name, 80).trim();
    if (!name) fail('Enter a project name.');
    var origin = pageUrl(rawUrl).origin;
    if (state.projects.some(function (p) { return p.origin === origin; })) fail('A project for this origin already exists. Select it instead.');
    if (state.projects.length >= 5) fail('This device supports five projects. Export a backup before deleting an old project.');
    var next = clone(state);
    var id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'project-' + Date.now() + '-' + Math.random().toString(36).slice(2);
    next.projects.push({ id: id, name: name, origin: origin, audits: [], fixes: {}, search: null });
    next.selectedId = id;
    return next;
  }
  function deleteProject(state, id) {
    var next = clone(state);
    next.projects = next.projects.filter(function (p) { return p.id !== id; });
    if (next.selectedId === id) next.selectedId = next.projects.length ? next.projects[0].id : null;
    return next;
  }
  function selectProject(state, id) {
    if (!state.projects.some(function (p) { return p.id === id; })) fail('Project not found.');
    return Object.assign({}, state, { selectedId: id });
  }
  function snapshot(report, origin) {
    var url = pageUrl(report.finalUrl || report.url).href;
    if (new URL(url).origin !== origin) fail('This page is outside the selected project origin.');
    if (!Array.isArray(report.categories) || !report.categories.length || report.categories.length > 20) fail('The audit report is incomplete. Re-run the audit.');
    var checks = [];
    var keys = new Set();
    report.categories.forEach(function (category) {
      text(category.id, 80);
      text(category.label, 160);
      if (!Array.isArray(category.checks) || !category.checks.length || category.checks.length > 100) fail('The audit report is incomplete.');
      category.checks.forEach(function (check) {
        var rule = category.id + ':' + text(check.label, 160);
        if (keys.has(rule)) fail('The audit has duplicate checks.');
        keys.add(rule);
        if (!['pass', 'warn', 'fail', 'info'].includes(check.status)) fail('Unknown audit check status.');
        checks.push({ rule: rule, id: text(check.id, 100), category: category.label, label: check.label, status: check.status, detail: text(check.detail || '', 3000), fix: text(check.fix || '', 3000), evidence: text(check.evidence || 'HTML observation / review guidance', 100) });
      });
    });
    return { url: url, fetchedAt: timestamp(report.fetchedAt), methodologyVersion: text(report.methodologyVersion || 'legacy', 40), score: number(report.score, 100), title: text(report.page && report.page.title || '', 1000), checks: checks };
  }
  function addAudit(state, report) {
    var next = clone(state);
    var p = selected(next);
    var observation = snapshot(report, p.origin);
    var urls = new Set(p.audits.map(function (a) { return a.url; }));
    if (!urls.has(observation.url) && urls.size >= 25) fail('This project holds 25 pages. Export a backup and start a new project to change scope.');
    var previous = p.audits.filter(function (a) { return a.url === observation.url; }).slice(-1)[0];
    if (previous && previous.methodologyVersion !== observation.methodologyVersion) {
      Object.values(p.fixes).forEach(function (fix) { if (fix.url === observation.url) fix.verifiedAt = null; });
    }
    observation.checks.forEach(function (check) {
      var key = observation.url + '|' + check.rule;
      var fix = p.fixes[key];
      if (check.status === 'fail' || check.status === 'warn') {
        p.fixes[key] = { key: key, url: observation.url, rule: check.rule, label: check.label, category: check.category, severity: check.status, detail: check.detail, fix: check.fix, evidence: check.evidence, status: fix && !fix.verifiedAt && fix.status != 'done' ? fix.status : 'open', firstSeen: fix ? fix.firstSeen : observation.fetchedAt, lastSeen: observation.fetchedAt, verifiedAt: null };
      } else if (check.status === 'pass' && fix && previous && previous.methodologyVersion === observation.methodologyVersion) {
        fix.verifiedAt = observation.fetchedAt;
      }
    });
    p.audits.push(observation);
    var same = p.audits.filter(function (a) { return a.url === observation.url; });
    if (same.length > 5) p.audits.splice(p.audits.indexOf(same[0]), 1);
    return next;
  }
  function setFixStatus(state, key, status) {
    if (!STATUSES.includes(status)) fail('Unknown fix status.');
    var next = clone(state);
    var fix = selected(next).fixes[key];
    if (!fix) fail('Fix not found.');
    fix.status = status;
    return next;
  }
  function fixQueue(project) {
    var impressions = new Map();
    if (project.search && project.search.current.dimension === 'page') project.search.current.rows.forEach(function (row) { impressions.set(row.key, row.impressions); });
    return Object.values(project.fixes).map(function (fix) { return Object.assign({}, fix, { impressions: impressions.has(fix.url) ? impressions.get(fix.url) : null }); }).sort(function (a, b) {
      return Number(!!a.verifiedAt) - Number(!!b.verifiedAt) || (a.severity === 'fail' ? 0 : 1) - (b.severity === 'fail' ? 0 : 1) || (b.impressions || 0) - (a.impressions || 0) || a.key.localeCompare(b.key);
    });
  }
  function scoreDelta(observations) {
    if (observations.length < 2) return null;
    var a = observations[observations.length - 2], b = observations[observations.length - 1];
    return a.url === b.url && a.methodologyVersion === b.methodologyVersion ? b.score - a.score : null;
  }
  function date(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) fail('Enter start and end dates in YYYY-MM-DD format.');
    var time = Date.parse(value + 'T00:00:00Z');
    if (!Number.isFinite(time) || new Date(time).toISOString().slice(0, 10) !== value) fail('Invalid calendar date.');
    return time;
  }
  function validatePeriod(period) {
    if (!period || date(period.start) > date(period.end)) fail('The period end date must be on or after its start.');
    if (date(period.end) - date(period.start) > 366 * 86400000) fail('Limit each export to one year.');
    return { start: period.start, end: period.end, filters: text(period.filters, 300).trim() || fail('Describe the matching search filters used for both exports.') };
  }
  // RFC 4180 quoting; also accepts semicolon and tab-separated exports.
  function parseCsv(raw) {
    if (typeof raw !== 'string' || bytes(raw) > MAX_CSV) fail('Choose a CSV no larger than 2 MB.');
    raw = raw.replace(/^\uFEFF/, '');
    var first = raw.split(/\r?\n/, 1)[0];
    var delimiter = first.includes('\t') ? '\t' : first.includes(';') && !first.includes(',') ? ';' : ',';
    var rows = [], row = [], cell = '', quoted = false, closed = false;
    function pushCell() { row.push(cell); cell = ''; closed = false; }
    function pushRow() { pushCell(); if (row.some(function (c) { return c.trim(); })) rows.push(row); row = []; if (rows.length > 10001) fail('Limit the export to 10,000 data rows.'); }
    for (var i = 0; i < raw.length; i++) {
      var c = raw[i];
      if (quoted) {
        if (c === '"') { if (raw[i + 1] === '"') { cell += '"'; i++; } else { quoted = false; closed = true; } }
        else cell += c;
      } else if (c === delimiter) pushCell();
      else if (c === '\r' || c === '\n') { if (c === '\r' && raw[i + 1] === '\n') i++; pushRow(); }
      else if (c === '"' && !cell && !closed) quoted = true;
      else if (closed || c === '"') fail('Malformed CSV quoting. Export the Pages or Queries table again.');
      else cell += c;
    }
    if (quoted) fail('Unclosed quote in the CSV. Export the file again.');
    if (cell || row.length || closed) pushRow();
    if (rows.length < 2) fail('The CSV has no data rows.');
    return rows;
  }
  function metric(value, integer) {
    var normalized = String(value).trim();
    if (!/^(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d+)?$/.test(normalized)) fail('Invalid numeric metric. Use an English GSC export with nonnegative numbers.');
    var result = Number(normalized.replace(/,/g, ''));
    if (!Number.isFinite(result) || result > Number.MAX_SAFE_INTEGER || (integer && !Number.isSafeInteger(result))) fail('Invalid numeric metric.');
    return result;
  }
  function summary(rows) {
    var out = { clicks: 0, impressions: 0, ctr: 0, position: null }, weighted = 0;
    rows.forEach(function (r) { out.clicks += r.clicks; out.impressions += r.impressions; weighted += r.impressions * r.position; });
    out.ctr = out.impressions ? out.clicks / out.impressions : 0;
    out.position = out.impressions ? weighted / out.impressions : null;
    return out;
  }
  function parseSearchCsv(raw, period, origin) {
    period = validatePeriod(period);
    var table = parseCsv(raw);
    var headers = table.shift().map(function (c) { return c.trim().toLowerCase(); });
    if (new Set(headers).size !== headers.length) fail('Duplicate CSV columns.');
    var pageIndex = headers.findIndex(function (c) { return ['top pages', 'page', 'pages'].includes(c); });
    var queryIndex = headers.findIndex(function (c) { return ['top queries', 'query', 'queries'].includes(c); });
    if ((pageIndex < 0) === (queryIndex < 0)) fail('Import one English GSC Pages or Queries table, not a combined or comparison export.');
    var indexes = ['clicks', 'impressions', 'position'].map(function (h) { var n = headers.indexOf(h); if (n < 0) fail('Missing ' + h + ' column. Use a single-period English GSC export.'); return n; });
    var dimension = pageIndex >= 0 ? 'page' : 'query';
    var seen = new Set();
    var rows = table.map(function (cells, i) {
      if (cells.length !== headers.length) fail('CSV column count does not match on row ' + (i + 2) + '.');
      var key = text(cells[dimension === 'page' ? pageIndex : queryIndex].trim(), 2048);
      if (!key) fail('Empty dimension value on row ' + (i + 2) + '.');
      if (dimension === 'page') { var url = pageUrl(key); key = url.href; if (origin && url.origin !== origin) fail('A CSV page belongs to a different origin. Export pages for ' + origin + '.'); }
      if (seen.has(key)) fail('Duplicate dimension row: export an aggregated Pages or Queries table.');
      seen.add(key);
      var clicks = metric(cells[indexes[0]], true), impressions = metric(cells[indexes[1]], true), position = metric(cells[indexes[2]], false);
      if (clicks > impressions || (impressions > 0 && position < 1)) fail('Inconsistent clicks, impressions or position on row ' + (i + 2) + '.');
      return { key: key, clicks: clicks, impressions: impressions, position: position };
    });
    return { dimension: dimension, period: period, rows: rows, summary: summary(rows) };
  }
  function compareSearch(previous, current) {
    if (previous.dimension !== current.dimension) fail('Both exports must have the same dimension: Pages or Queries.');
    var a = validatePeriod(previous.period), b = validatePeriod(current.period);
    if (date(a.end) >= date(b.start)) fail('Periods overlap or are out of order. Previous must end before current begins.');
    if (date(a.end) - date(a.start) !== date(b.end) - date(b.start)) fail('Use equal-length date ranges for a fair comparison.');
    if (a.filters !== b.filters) fail('Use the same filters for both exports.');
    var before = new Map(previous.rows.map(function (r) { return [r.key, r]; }));
    var after = new Map(current.rows.map(function (r) { return [r.key, r]; }));
    var keys = new Set([].concat(previous.rows, current.rows).map(function (r) { return r.key; }));
    var rows = Array.from(keys).map(function (key) {
      var p = before.get(key), c = after.get(key), matched = !!(p && c);
      return { key: key, previous: p || null, current: c || null, status: matched ? 'matched' : c ? 'new-in-export' : 'missing-from-export', clickDelta: matched ? c.clicks - p.clicks : null, ctrDelta: matched ? (c.impressions ? c.clicks / c.impressions : 0) - (p.impressions ? p.clicks / p.impressions : 0) : null, positionDelta: matched && p.impressions && c.impressions ? c.position - p.position : null };
    });
    rows.sort(function (a, b) { return (a.clickDelta === null ? Infinity : a.clickDelta) - (b.clickDelta === null ? Infinity : b.clickDelta) || a.key.localeCompare(b.key); });
    return { previous: previous, current: current, rows: rows };
  }
  function setSearch(state, previous, current) {
    var next = clone(state), p = selected(next);
    [previous, current].forEach(function (data) { if (data.dimension === 'page') data.rows.forEach(function (r) { if (pageUrl(r.key).origin !== p.origin) fail('CSV pages must match the project origin.'); }); });
    compareSearch(previous, current);
    p.search = { previous: previous, current: current };
    return next;
  }
  function validateSearch(data, origin) {
    if (!data || !['page', 'query'].includes(data.dimension) || !Array.isArray(data.rows) || !data.rows.length || data.rows.length > 10000) fail('Invalid search export in backup.');
    var seen = new Set();
    var rows = data.rows.map(function (r) {
      var key = text(r.key, 2048);
      if (!key.trim() || seen.has(key)) fail('Invalid or duplicate search row in backup.');
      seen.add(key);
      if (data.dimension === 'page' && (pageUrl(key).origin !== origin || pageUrl(key).href !== key)) fail('Invalid page origin in backup.');
      number(r.clicks, Number.MAX_SAFE_INTEGER); number(r.impressions, Number.MAX_SAFE_INTEGER); number(r.position, Number.MAX_SAFE_INTEGER);
      if (!Number.isSafeInteger(r.clicks) || !Number.isSafeInteger(r.impressions) || r.clicks > r.impressions || (r.impressions && r.position < 1)) fail('Invalid search metrics in backup.');
      return { key: key, clicks: r.clicks, impressions: r.impressions, position: r.position };
    });
    return { dimension: data.dimension, period: validatePeriod(data.period), rows: rows, summary: summary(rows) };
  }
  function restoreBackup(raw) {
    if (typeof raw !== 'string' || bytes(raw) > MAX_STATE) fail('Project backup must be smaller than 4 MB.');
    var state;
    try { state = JSON.parse(raw); } catch (_) { fail('The saved data or backup is not valid JSON. Export a backup before repairing storage.'); }
    if (!state || state.version !== 2) fail('Unsupported backup version. Expected AfroSEO version 2.');
    if (!Array.isArray(state.projects) || state.projects.length > 5) fail('Invalid projects in backup.');
    var ids = new Set(), origins = new Set();
    var projects = state.projects.map(function (p) {
      if (!p || typeof p !== 'object') fail('Invalid project in backup.');
      var id = text(p.id, 100), name = text(p.name, 80), origin = pageUrl(p.origin).origin;
      if (!id || !name.trim() || p.origin !== origin || ids.has(id) || origins.has(origin)) fail('Invalid or duplicate project in backup.');
      ids.add(id); origins.add(origin);
      if (!Array.isArray(p.audits) || p.audits.length > 125 || !p.fixes || typeof p.fixes !== 'object' || Array.isArray(p.fixes) || Object.keys(p.fixes).length > 2500) fail('Invalid audit history in backup.');
      var counts = new Map();
      var audits = p.audits.map(function (a) {
        if (!a || typeof a !== 'object') fail('Invalid audit observation in backup.');
        var url = pageUrl(a.url).href;
        if (url !== a.url || new URL(url).origin !== origin || !Array.isArray(a.checks) || !a.checks.length || a.checks.length > 200) fail('Invalid audit observation in backup.');
        counts.set(url, (counts.get(url) || 0) + 1);
        if (counts.size > 25 || counts.get(url) > 5) fail('Too many audit observations in backup.');
        var rules = new Set();
        var checks = a.checks.map(function (c) {
          if (!c || typeof c !== 'object') fail('Invalid check in backup.');
          if (!['pass', 'warn', 'fail', 'info'].includes(c.status) || rules.has(c.rule)) fail('Invalid check in backup.');
          rules.add(c.rule);
          return { rule: text(c.rule, 250), id: text(c.id, 100), category: text(c.category, 160), label: text(c.label, 160), status: c.status, detail: text(c.detail, 3000), fix: text(c.fix, 3000), evidence: text(c.evidence, 100) };
        });
        return { url: url, fetchedAt: timestamp(a.fetchedAt), methodologyVersion: text(a.methodologyVersion, 40), score: number(a.score, 100), title: text(a.title, 1000), checks: checks };
      });
      var fixes = {};
      Object.keys(p.fixes).forEach(function (key) {
        var f = p.fixes[key];
        if (!f || key !== f.url + '|' + f.rule || !counts.has(f.url) || !STATUSES.includes(f.status) || !['fail', 'warn'].includes(f.severity)) fail('Invalid fix in backup.');
        fixes[key] = { key: key, url: f.url, rule: text(f.rule, 250), label: text(f.label, 160), category: text(f.category, 160), severity: f.severity, detail: text(f.detail, 3000), fix: text(f.fix, 3000), evidence: text(f.evidence, 100), status: f.status, firstSeen: timestamp(f.firstSeen), lastSeen: timestamp(f.lastSeen), verifiedAt: f.verifiedAt === null ? null : timestamp(f.verifiedAt) };
      });
      var search = p.search ? { previous: validateSearch(p.search.previous, origin), current: validateSearch(p.search.current, origin) } : null;
      if (search) compareSearch(search.previous, search.current);
      return { id: id, name: name, origin: origin, audits: audits, fixes: fixes, search: search };
    });
    if ((projects.length && !ids.has(state.selectedId)) || (!projects.length && state.selectedId !== null)) fail('Invalid selected project in backup.');
    return { version: 2, selectedId: state.selectedId, projects: projects };
  }
  function persist(storage, state) {
    var raw = JSON.stringify(state);
    if (bytes(raw) > MAX_STATE) fail('Device storage limit reached. Export a backup, then remove an old project.');
    restoreBackup(raw);
    try { storage.setItem(KEY, raw); } catch (_) { fail('Could not save to device storage. Your last saved state is unchanged. Export a backup and free browser storage.'); }
  }
  function load(storage) {
    var raw;
    try { raw = storage.getItem(KEY); } catch (_) { fail('Saved projects are unavailable. Allow browser storage to continue.'); }
    return raw ? restoreBackup(raw) : emptyState();
  }
  function escape(value) { return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function renderProjectReport(project) {
    var queue = fixQueue(project);
    var body = '<h1>' + escape(project.name) + ' — SEO progress report</h1><p>' + escape(project.origin) + '</p><p>Exported ' + escape(new Date().toISOString()) + '</p><h2>Scope and evidence</h2><p>Manually selected pages, fetched HTML only. Scores are an AfroSEO checklist, not Google rankings. JavaScript rendering, index status, traffic causality and Core Web Vitals are not verified. Manual done is separate from an issue passing a later comparable audit.</p>';
    body += '<h2>Page observations</h2><table><tr><th>URL</th><th>Observed</th><th>Method</th><th>Checklist score</th></tr>' + project.audits.map(function (a) { return '<tr><td>' + escape(a.url) + '</td><td>' + escape(a.fetchedAt) + '</td><td>' + escape(a.methodologyVersion) + '</td><td>' + a.score + '/100</td></tr>'; }).join('') + '</table>';
    body += '<h2>Fix queue</h2>' + (queue.length ? queue.map(function (f) { return '<section><h3>' + escape(f.label) + '</h3><p>' + escape(f.url) + '</p><p>' + escape(f.detail) + '</p><p>Next step: ' + escape(f.fix) + '</p><p>Manual status: ' + escape(f.status) + '. Verification: ' + escape(f.verifiedAt || 'not yet verified') + '. Last observed: ' + escape(f.lastSeen) + '.</p></section>'; }).join('') : '<p>No recorded fixes.</p>');
    if (project.search) {
      var comparison = compareSearch(project.search.previous, project.search.current), a = comparison.previous, b = comparison.current;
      body += '<h2>Search Console export comparison</h2><p>Dimension: ' + escape(b.dimension) + '. Filters declared by user: ' + escape(b.period.filters) + '</p><p>Previous: ' + a.period.start + ' to ' + a.period.end + '. Current: ' + b.period.start + ' to ' + b.period.end + '.</p><p>Exported-row totals may differ from Search Console totals. Missing rows do not prove zero traffic. Position is impression-weighted; CTR is recalculated from counts. Changes do not prove that an SEO fix caused a traffic change.</p><table><tr><th>Dimension value</th><th>Coverage</th><th>Previous clicks</th><th>Current clicks</th><th>Click change</th></tr>' + comparison.rows.map(function (r) { return '<tr><td>' + escape(r.key) + '</td><td>' + escape(r.status) + '</td><td>' + (r.previous ? r.previous.clicks : 'Unknown') + '</td><td>' + (r.current ? r.current.clicks : 'Unknown') + '</td><td>' + (r.clickDelta === null ? 'Not comparable' : r.clickDelta) + '</td></tr>'; }).join('') + '</table>';
    }
    return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src &#39;none&#39;; style-src &#39;unsafe-inline&#39;"><title>' + escape(project.name) + ' | AfroSEO report</title><style>body{font:15px/1.6 system-ui,sans-serif;max-width:960px;margin:40px auto;padding:0 20px;color:#17212f}table{width:100%;border-collapse:collapse;table-layout:fixed}td,th{text-align:left;padding:8px;border-bottom:1px solid #ddd;overflow-wrap:anywhere}section{break-inside:avoid;border-bottom:1px solid #ddd}h1{line-height:1.2}@media print{body{margin:0;font-size:10pt}}</style></head><body>' + body + '</body></html>';
  }
  return { KEY: KEY, emptyState: emptyState, selected: selected, createProject: createProject, deleteProject: deleteProject, selectProject: selectProject, addAudit: addAudit, setFixStatus: setFixStatus, fixQueue: fixQueue, scoreDelta: scoreDelta, parseSearchCsv: parseSearchCsv, compareSearch: compareSearch, setSearch: setSearch, restoreBackup: restoreBackup, persist: persist, load: load, escape: escape, renderProjectReport: renderProjectReport };
});
