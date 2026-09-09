(function () {
  'use strict';
  window.addEventListener('pageshow', event => { if (event.persisted) location.reload(); });
  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  function safePath(value) {
    if (typeof value !== 'string' || /[\\?#\x00-\x20]/.test(value)) return null;
    const clean = value.replace(/^\//, '');
    if (!clean || clean.startsWith('/') || clean.split('/').some(p => p === '..' || p === '.') || /[:%]/.test(clean)) return null;
    return '/' + clean;
  }
  function link(path, label) { const url = safePath(path); if (url && (/^\/(admin|docs|reports|scripts|netlify)\//.test(url) || url.startsWith('/data/image-generation/') || url.endsWith('.md'))) return esc(label || path); return url ? `<a href="${esc(url)}">${esc(label || path)}</a>` : esc(label || path); }
  function stats(id, values) { $(id).innerHTML = values.map(([label,value]) => `<div class="stat"><strong>${esc(value ?? 'Unavailable')}</strong>${esc(label)}</div>`).join(''); }
  function table(id, heads, rows) { $(id).innerHTML = `<table><thead><tr>${heads.map(h=>`<th scope="col">${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map((cell,i)=>`<td data-label="${esc(heads[i])}">${cell}</td>`).join('')}</tr>`).join('')}</tbody></table>`; }
  let data, filtered = [], page = 0;
  const pageSize = 30;
  let progress = {};
  const progressStates = ['pending','in progress','ready for review','done'];
  const progressKey = 'afrotools-operator-image-progress-v1';
  try { const saved = JSON.parse(localStorage.getItem(progressKey) || '{}'); if (saved && typeof saved === 'object' && !Array.isArray(saved)) progress = saved; } catch (_) { /* Storage may be unavailable; exports still work. */ }
  function taskState(id) { return progressStates.includes(progress[id]) ? progress[id] : 'pending'; }
  function isUnassigned(row) { return !Array.isArray(row.placements) || row.placements.length === 0; }
  function needsReview(row) { return /^(review|needs-review|duplicate-review|pending)$/.test(row.status) || /^(not-reviewed|contains-text|unknown)$/.test(row.text_status) || row.locale_reuse === 'review'; }
  function renderImages() {
    if (!data) return;
    const batch = $('image-view').value === 'batch';
    const source = batch ? data.batch : data.images;
    const query = $('image-search').value.trim().toLowerCase();
    filtered = source.rows.filter(row => {
      const status = $('image-status').value;
      return (!query || JSON.stringify(row).toLowerCase().includes(query)) &&
        (!status || (status === 'review-signals' ? needsReview(row) : String(row.status) === status)) &&
        (!$('image-family').value || row.family === $('image-family').value) &&
        (!$('image-reuse').value || ($('image-reuse').value === 'approved' ? row.locale_reuse === true : row.locale_reuse !== true)) &&
        (!$('image-locale').value || (row.placements || []).some(p => p.locale === $('image-locale').value));
    }).sort((a,b) => batch ? (a.order ?? Infinity) - (b.order ?? Infinity) || Number(b.priority || 0) - Number(a.priority || 0) : Number(needsReview(b)) - Number(needsReview(a)) || Number(isUnassigned(b)) - Number(isUnassigned(a)) || String(a.path).localeCompare(String(b.path)));
    const start = page * pageSize;
    $('image-count').textContent = source.available ? `${filtered.length} matches. Showing ${filtered.length ? start+1 : 0}–${Math.min(start+pageSize, filtered.length)}. ${batch ? 'Batch' : 'Inventory'} dated ${source.generated_at || 'unknown'}.` : 'Image audit data unavailable. Integrate the parent image inventory, then rebuild the dashboard snapshot.';
    $('previous').disabled = page === 0;
    $('next').disabled = start + pageSize >= filtered.length;
    $('export-images').disabled = !filtered.length;
    table('image-table', ['Image / task','Placement / destination','Review / reuse','State / priority'], filtered.slice(start,start+pageSize).map(row => {
      const url = safePath(row.path);
      const preview = !batch && url && row.local_file !== false ? `<a href="${esc(url)}"><img src="${esc(url)}" alt="Preview: ${esc(row.path)}" loading="lazy"></a>` : !batch ? '<small>Asset not available on this release</small>' : '';
      const placements = batch ? link(row.route, row.route) : (row.placements || []).slice(0,12).map(p => `${link(p.path,p.path)} <small>${esc(p.kind)} · ${esc(p.locale)}</small>`).join('') || 'No detected references';
      return [`${preview}<strong>${esc(row.name || row.id)}</strong><small>${esc(row.path)}</small><small>${esc(row.family || '')} ${esc(row.width ? row.width+' × '+row.height : JSON.stringify(row.dimensions || ''))}</small>`,
        placements + (!batch && row.placements?.length > 12 ? `<small>${row.placements.length-12} more in export</small>` : ''),
        `${esc(row.review_note || row.reason || row.text_status || 'Review not recorded')}<small>Locale reuse: ${esc(typeof row.locale_reuse === 'object' ? JSON.stringify(row.locale_reuse) : row.locale_reuse === true ? (batch ? 'planned; review generated output' : 'approved in audit') : row.locale_reuse === false ? 'not approved' : row.locale_reuse || 'unknown')}</small>${row.duplicate_of ? `<small>Duplicate of ${esc(row.duplicate_of)}</small>` : ''}${row.reference_image ? `<small>Reference: ${row.local_reference === false ? esc(row.reference_image)+' (not available on this release)' : link(row.reference_image)}</small>` : ''}${row.prompt ? `<details><summary>Generation prompt and alt text</summary><p>${esc(row.prompt)}</p><p>Alt: ${esc(row.alt)}</p></details>` : ''}`,
        `${esc(row.status || 'unknown')}<small>${batch ? 'Priority: '+esc(row.priority ?? 'unknown') : isUnassigned(row) ? 'No detected references' : row.placements.length+' references'}</small>${batch ? `<label>Device task progress<select class="form-select" data-task="${esc(row.id)}" aria-label="Task progress: ${esc(row.name || row.id)}">${progressStates.map(state=>`<option${taskState(row.id)===state?' selected':''}>${state}</option>`).join('')}</select></label>` : ''}`];
    }));
  }
  function download(name, content, type) {
    const url = URL.createObjectURL(new Blob([content], {type}));
    const a = document.createElement('a'); a.href=url; a.download=name; a.click(); setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  function csvCell(value) { let text = typeof value === 'object' ? JSON.stringify(value) : String(value ?? ''); if (/^[=+@\-\t\r]/.test(text)) text = "'"+text; return '"'+text.replace(/"/g,'""')+'"'; }
  function renderPro() {
    if (!data) return;
    const q = $('pro-search').value.toLowerCase();
    const rows = data.pro.filter(row => JSON.stringify(row).toLowerCase().includes(q) && (!$('pro-state').value || ($('pro-state').value === 'active' ? row.status === 'active' : row.status !== 'active')));
    $('pro-count').textContent = `${rows.length} app definitions. Readiness is registry-authored, not a live acceptance score.`;
    $('pro-list').innerHTML = rows.map(row=>`<article class="pro-item"><h3>${link(row.route,row.name)}</h3><p>${esc(row.state)} · ${esc(row.status)}</p><small>Recorded gate audit: ${esc(row.gate)} · Authored readiness: ${esc(row.readiness ?? 'not supplied')}</small><p>${esc(row.backing)}</p><p><strong>Next:</strong> ${esc(row.next)}</p></article>`).join('');
  }
  function renderSources() {
    if (!data) return;
    const q = $('source-search').value.toLowerCase();
    const state = $('source-state').value;
    const rows = data.sources.filter(row => (!q || JSON.stringify(row).toLowerCase().includes(q)) && (!state || row.status === state));
    $('source-count').textContent = `${rows.length} matches. Showing the first 50; full ledger is linked in Evidence and refresh.`;
    table('sources', ['Source','Review evidence','Action'], rows.slice(0,50).map(row=>[esc(row.name),`${esc(row.date || 'No review date')}<small>Cadence: ${esc(row.cadence ?? 'unknown')} days</small>`,`${esc(row.status)}<small>${row.route ? link(row.route,'Open affected route') : 'No route recorded'}</small>`]));
  }
  function render() {
    $('snapshot').textContent = `Snapshot generated ${data.generated_at}. Repository ${data.revision?.slice(0,12) || 'unknown'}. Source dates appear below; generation does not refresh their evidence.`;
    const r = data.registry || {};
    stats('repo-stats', [['Canonical published tool records',r.canonicalPublishedTools],['Expanded English experiences',r.expandedLiveToolExperiences],['Published widgets',r.publishedWidgets],['Published site languages',r.siteLanguages]]);
    stats('image-stats', [['Image files',data.images.available ? data.images.rows.length : null],['Audit unassigned files',data.images.available ? data.images.rows.filter(r=>r.status==='unassigned').length : null],['Review signals',data.images.available ? data.images.rows.filter(needsReview).length : null],['Generation tasks',data.batch.available ? data.batch.rows.length : null]]);
    $('quality').textContent = data.quality ? `Recorded quality grades (rows): ${JSON.stringify(data.quality.score_distribution_rows)}. Browser smoke ${data.quality.browser_smoke?.enabled ? 'enabled in report' : 'not run in report'}. Dated ${data.quality.generated_at}.` : 'Quality report unavailable.';
    $('calculation').textContent = data.calculation ? `Calculation fixtures dated ${data.calculation.asOf}: ${data.calculation.fixtures.passed} passed, ${data.calculation.fixtures.failed} failed. Review backlog: ${Object.entries(data.calculation.reviewBacklog).map(([key,value]) => key.replace(/([A-Z])/g, ' $1').toLowerCase()+': '+value).join('; ')}.` : 'Calculation evidence unavailable.';
    table('localization', ['Locale / launch state','Native pages','Shell / fallback','Unavailable'], Object.entries(data.localization?.byLocale || {}).map(([locale,row])=>[`${esc(locale)} · ${esc(row.launchStatus)}`,esc(row.native),`${esc(row.localizedShell)} shell / ${esc(row.englishFallback)} fallback`,esc(row.unavailable)]));
    $('live').textContent = data.live.note;
    $('build').textContent = data.build.note;
    table('evidence', ['Source / scope','Date / fingerprint','Refresh command'], data.evidence.map(row=>[`${row.local_file === false || row.status === 'unavailable' ? esc(row.file) : link(row.file)}<small>${esc(row.status)}</small>`,`${esc(row.source_date || 'Source timestamp not recorded')}<small>${esc(row.sha256 || 'No file')}</small>${row.source_commit ? `<small>Audit source commit: ${esc(row.source_commit)}</small>` : ''}`,row.command ? `<code>${esc(row.command)}</code><button class="btn btn-secondary" data-copy="${esc(row.command)}">Copy command</button>` : 'Unavailable']));
    $('image-status').innerHTML = '<option value="">All states</option><option value="review-signals">Review signals</option>'+[...new Set([...data.images.rows,...data.batch.rows].map(r=>r.status).filter(Boolean))].sort().map(v=>`<option>${esc(v)}</option>`).join('');
    const families = [...new Set(data.images.rows.map(r=>r.family).filter(Boolean))].sort();
    $('image-family').innerHTML += families.map(v=>`<option>${esc(v)}</option>`).join('');
    const locales = [...new Set(data.images.rows.flatMap(r=>(r.placements||[]).map(p=>p.locale)).filter(Boolean))].sort();
    $('image-locale').innerHTML += locales.map(v=>`<option>${esc(v)}</option>`).join('');
    renderImages(); renderPro(); renderSources();
  }
  ['image-view','image-search','image-status','image-family','image-locale','image-reuse'].forEach(id=>$(id).addEventListener('input',()=>{page=0;renderImages();}));
  ['pro-search','pro-state'].forEach(id=>$(id).addEventListener('input',renderPro));
  ['source-search','source-state'].forEach(id=>$(id).addEventListener('input',renderSources));
  $('image-table').addEventListener('change', event => {
    const select = event.target.closest('[data-task]'); if (!select) return;
    progress[select.dataset.task] = select.value;
    try { localStorage.setItem(progressKey, JSON.stringify(progress)); $('action-status').textContent='Task progress saved on this device. The canonical audit and generation status are unchanged.'; }
    catch (_) { $('action-status').textContent='Device storage unavailable. Export CSV to retain task progress before leaving.'; }
  });
  $('previous').addEventListener('click',()=>{page--;renderImages();});
  $('next').addEventListener('click',()=>{page++;renderImages();});
  $('export-images').addEventListener('click',()=>{
    const fields = ['id','name','path','status','device_task_progress','priority','family','placements','text_status','locale_reuse','review_note','route','reference_image','prompt','alt'];
    download('image-queue.csv', '\uFEFF'+[fields.map(csvCell).join(','),...filtered.map(row=>fields.map(f=>csvCell(f === 'device_task_progress' ? ($('image-view').value === 'batch' ? taskState(row.id) : '') : row[f])).join(','))].join('\r\n'),'text/csv;charset=utf-8');
    $('action-status').textContent = `Exported ${filtered.length} filtered rows.`;
  });
  document.addEventListener('click',async event=>{ const button=event.target.closest('[data-copy]'); if(!button)return; try {await navigator.clipboard.writeText(button.dataset.copy);$('action-status').textContent='Command copied. Run it in the repository; this dashboard does not execute commands.';} catch (_) {$('action-status').textContent='Clipboard unavailable. Select and copy the visible command.';} });
  fetch('/api/operator-dashboard/snapshot.json', {cache:'no-store', credentials:'same-origin'}).then(response=>{if(!response.ok)throw Error('Snapshot unavailable');return response.json();}).then(payload=>{data=payload;render();}).catch(()=>{$('snapshot').textContent='Snapshot unavailable or session expired. Sign in again, or ask the operator to rebuild the snapshot.';});
}());
