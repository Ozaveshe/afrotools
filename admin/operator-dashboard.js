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

  const iconPaths = {
    overview:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    images:'<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="1.5"/><path d="m3 16 5-5 5 5 3-3 5 5"/>',
    apps:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 5V3h8v2M3 10h18M9 10v11"/>',
    pulse:'<path d="M3 12h4l3-8 4 16 3-8h4"/>',
    sources:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c5 5 5 13 0 18-5-5-5-13 0-18"/>',
    evidence:'<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9zM14 3v6h6M8 13h8M8 17h5"/>',
    external:'<path d="M14 3h7v7M21 3l-9 9M10 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5"/>',
    lock:'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/>',
    logout:'<path d="M9 3H5v18h4M12 12h9m-4-4 4 4-4 4"/>',
    search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
    menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',
    plus:'<path d="M12 5v14M5 12h14"/>',
    download:'<path d="M12 3v12m-5-5 5 5 5-5M4 15v6h16v-6"/>',
    clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7v1"/>',
    chevron:'<path d="m9 5 6 7-6 7"/>'
  };
  function icon(name) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(iconPaths[name] || iconPaths.apps)+'</svg>'; }
  document.querySelectorAll('[data-icon]').forEach(el=>{el.innerHTML=icon(el.dataset.icon);});
  const views = {overview:'Overview',work:'Work & releases',automations:'Automation results',images:'Image library',pro:'Pro operations',health:'Repository health','source-review':'Source reviews',provenance:'Evidence & refresh'};
  const mobileNav = matchMedia('(max-width:980px)');
  function closeMenu(returnFocus=false) {
    document.body.classList.remove('nav-open'); $('sidebar-scrim').hidden=true;
    $('menu-toggle').setAttribute('aria-expanded','false'); document.querySelector('.app-body').inert=false;
    $('sidebar').inert=mobileNav.matches;
    if(returnFocus)$('menu-toggle').focus();
  }
  function showView(id, focus=false) {
    if(!Object.hasOwn(views,id))id='overview';
    document.querySelectorAll('.workspace-view').forEach(section=>{section.hidden=section.id!==id;});
    document.querySelectorAll('.sidebar [data-view]').forEach(a=>{if(a.dataset.view===id)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
    $('current-view').textContent=views[id]; document.title=views[id]+' · AfroTools Command centre';
    closeMenu();
    if(focus){const heading=$(id).querySelector('h1');heading.tabIndex=-1;heading.focus({preventScroll:true});window.scrollTo({top:0});}
  }
  function navigate(id){if(!Object.hasOwn(views,id))return;history.pushState(null,'','#'+id);showView(id,true);}
  window.addEventListener('hashchange',()=>showView(location.hash.slice(1),true));
  $('menu-toggle').addEventListener('click',()=>{document.body.classList.add('nav-open');$('sidebar').inert=false;$('sidebar-scrim').hidden=false;$('menu-toggle').setAttribute('aria-expanded','true');document.querySelector('.app-body').inert=true;$('sidebar').querySelector('a').focus();});
  $('sidebar-scrim').addEventListener('click',()=>closeMenu(true));
  $('nav-close').addEventListener('click',()=>closeMenu(true));
  mobileNav.addEventListener('change',()=>closeMenu());
  $('afro-theme-fallback-toggle').addEventListener('click',()=>window.AfroTools?.darkMode?.toggle());
  document.addEventListener('click',event=>{
    const target=event.target.closest('[data-view],[data-open-view]');if(!target)return;
    event.preventDefault();const id=target.dataset.view || target.dataset.openView;
    if(id==='images'){
      if(target.dataset.imageQueue)$('image-view').value=target.dataset.imageQueue;
      if(target.dataset.imageStatus!==undefined)$('image-status').value=target.dataset.imageStatus;
      page=0;renderImages();
    }
    if(id==='source-review'){$('source-state').value='review overdue';renderSources();}
    if(id==='pro' && target.dataset.proState){$('pro-state').value=target.dataset.proState;renderPro();}
    navigate(id);
  });
  const dialog=$('command-dialog');
  function renderDestinations(){
    const q=$('command-search').value.trim().toLowerCase();
    const destinations=[...Object.entries(views).map(([id,name])=>({name,route:'#'+id,section:true})),...(data?.pro || []).map(row=>({name:row.name,route:safePath(row.route),section:false}))].filter(row=>row.route&&row.name.toLowerCase().includes(q));
    $('command-results').innerHTML=destinations.map(row=>'<a href="'+esc(row.route)+'"'+(row.section?' data-view="'+esc(row.route.slice(1))+'"':'')+'>'+esc(row.name)+'<small>'+(row.section?'Workspace':'Pro app ↗')+'</small></a>').join('')||'<p class="ops-empty">No matching destinations. Try a section or app name.</p>';
  }
  function openSearch(){closeMenu();renderDestinations();dialog.showModal();$('command-search').focus();}
  $('command-open').addEventListener('click',openSearch);$('command-close').addEventListener('click',()=>dialog.close());
  $('command-search').addEventListener('input',renderDestinations);
  $('command-results').addEventListener('click',event=>{if(event.target.closest('a'))dialog.close();});
  dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
  document.addEventListener('keydown',event=>{if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k'){event.preventDefault();if(!dialog.open)openSearch();}if(event.key==='Escape'&&document.body.classList.contains('nav-open'))closeMenu(true);});
  let focusTasks=[];
  const focusKey='afrotools-operator-focus-v1';
  try{const saved=JSON.parse(localStorage.getItem(focusKey)||'[]');if(Array.isArray(saved))focusTasks=saved.filter(t=>t&&typeof t.text==='string'&&typeof t.id==='string').slice(0,20).map(t=>({id:t.id,text:t.text.slice(0,120),done:t.done===true}));}catch(_){/* Device storage is optional. */}
  function renderFocus(){
    $('focus-list').innerHTML=focusTasks.length?focusTasks.map(task=>'<div class="focus-row'+(task.done?' is-done':'')+'"><label><input type="checkbox" data-focus-check="'+esc(task.id)+'"'+(task.done?' checked':'')+'><span>'+esc(task.text)+'</span></label><button class="focus-delete" data-focus-delete="'+esc(task.id)+'" aria-label="Remove '+esc(task.text)+'">×</button></div>').join(''):'<div class="ops-empty"><strong>Make room for what matters.</strong>Add your next priority. Your list stays on this device.</div>';
  }
  function saveFocus(){try{localStorage.setItem(focusKey,JSON.stringify(focusTasks));$('action-status').textContent='Focus list saved on this device.';}catch(_){$('action-status').textContent='Device storage unavailable. This focus list will last for this visit only.';}renderFocus();}
  $('focus-form').addEventListener('submit',event=>{event.preventDefault();const text=$('focus-input').value.trim();if(!text)return;if(focusTasks.length>=20){$('action-status').textContent='Your focus list has 20 items. Remove one before adding another.';return;}focusTasks.push({id:crypto.randomUUID(),text,done:false});$('focus-input').value='';saveFocus();$('focus-input').focus();});
  $('focus-list').addEventListener('change',event=>{const target=event.target.closest('[data-focus-check]');if(!target)return;const task=focusTasks.find(t=>t.id===target.dataset.focusCheck);if(task){task.done=target.checked;saveFocus();$('focus-list').querySelector('[data-focus-check="'+CSS.escape(task.id)+'"]')?.focus();}});
  $('focus-list').addEventListener('click',event=>{const target=event.target.closest('[data-focus-delete]');if(!target)return;focusTasks=focusTasks.filter(t=>t.id!==target.dataset.focusDelete);saveFocus();$('focus-input').focus();});
  let toastTimer;new MutationObserver(()=>{clearTimeout(toastTimer);if($('action-status').textContent)toastTimer=setTimeout(()=>{$('action-status').textContent='';},6500);}).observe($('action-status'),{childList:true});
  $('today-label').textContent=new Intl.DateTimeFormat('en',{weekday:'long',month:'long',day:'numeric'}).format(new Date()).toUpperCase();
  showView(location.hash.slice(1));renderFocus();
  function count(value){return typeof value==='number'?value.toLocaleString('en'):'—';}
  function shortDate(value){const date=new Date(value);return Number.isNaN(date.getTime())?'Date unavailable':new Intl.DateTimeFormat('en',{day:'numeric',month:'short',year:'numeric'}).format(date);}
  function renderOverview(){
    const review=data.images.rows.filter(needsReview).length, overdue=data.sources.filter(r=>r.status==='review overdue').length;
    const active=data.pro.filter(r=>r.status==='active'), preview=data.pro.length-active.length;
    const metrics=[['Image assets',data.images.available?data.images.rows.length:null,'images','Audited inventory'],['Source reviews due',overdue,'sources','At snapshot date'],['Active Pro apps',active.length,'apps','Registry active'],['Published tools',data.registry?.canonicalPublishedTools,'overview','Canonical tool records']];
    $('overview-metrics').innerHTML=metrics.map(([label,value,i,note])=>'<article class="metric"><div class="metric-top"><span>'+esc(label)+'</span><span class="metric-icon">'+icon(i)+'</span></div><strong>'+count(value)+'</strong><small><span class="small-dot"></span>'+esc(note)+'</small></article>').join('');
    $('nav-images').textContent=count(data.images.rows.length);$('nav-sources').textContent=count(overdue);
    const queues=[['sources','amber','Source reviews overdue','Review source dates and affected routes.',overdue,'source-review',''],['images','','Image review signals','Check text, locale reuse, and review flags.',review,'images',' data-image-queue="inventory" data-image-status="review-signals"'],['apps','','Pro apps in preview','Work through the next readiness steps.',preview,'pro',' data-pro-state="preview"']];
    $('attention-list').innerHTML=queues.map(([i,tone,title,desc,n,view,attrs])=>'<button class="attention-row" data-open-view="'+view+'"'+attrs+'><span class="attention-icon '+tone+'">'+icon(i)+'</span><span class="attention-copy"><strong>'+title+'</strong><small>'+desc+'</small></span><span class="attention-value">'+count(n)+'</span><span class="attention-arrow">›</span></button>').join('');
    const placed=data.images.rows.filter(r=>r.status==='placed').length,total=data.images.rows.length,reserved=data.images.rows.filter(r=>r.status==='reserved-catalogue').length,other=total-placed-reserved;
    const pct=total?Math.round(placed/total*100):0;
    $('library-breakdown').innerHTML=data.images.available?'<div class="library-chart"><div class="donut"><svg viewBox="0 0 160 160" aria-hidden="true"><circle cx="80" cy="80" r="64"/><circle class="donut-value" cx="80" cy="80" r="64" pathLength="100" stroke-dasharray="'+pct+' 100"/></svg><div class="donut-label"><strong>'+pct+'%</strong><small>placed</small></div></div><div class="chart-legend">'+[['Placed',placed,''],['Reserved',reserved,'soft'],['Other states',other,'neutral']].map(([label,n,tone])=>'<div class="legend-row"><span class="legend-dot '+tone+'"></span>'+label+'<strong>'+count(n)+'</strong></div>').join('')+'</div></div><p class="library-note">'+count(data.batch.rows.length)+' generation tasks in the next batch. Track progress in your image workspace.</p>':'<p class="ops-empty">Image evidence is unavailable.</p>';
    $('quick-launch').innerHTML=active.slice(0,4).map(row=>'<a class="launch-link" href="'+esc(safePath(row.route))+'"><span class="app-monogram">'+esc(row.name.replace(/^Afro/,'').slice(0,2).toUpperCase())+'</span><span>'+esc(row.name)+'<small>Open workspace ↗</small></span></a>').join('')||'<p class="ops-empty">No active apps in this snapshot.</p>';
    $('overview-date').textContent='Repository snapshot · '+shortDate(data.generated_at);
    $('pro-summary').innerHTML='<span><strong>'+data.pro.length+'</strong> apps</span><span><strong>'+active.length+'</strong> registry active</span><span><strong>'+preview+'</strong> preview / shell</span>';
    stats('source-stats',[['Review overdue',overdue],['Within cadence',data.sources.filter(r=>r.status==='within review cadence').length],['Unknown date',data.sources.filter(r=>r.status==='unknown').length],['Sources recorded',data.sources.length]]);
    const grades=Object.entries(data.quality?.score_distribution_rows||{}),max=Math.max(1,...grades.map(([,n])=>n));
    $('quality-chart').innerHTML=grades.map(([grade,n])=>'<div class="grade-row"><span>'+esc(grade)+'</span><div class="grade-track"><span class="grade-fill" style="width:'+Math.max(0,n/max*100)+'%"></span></div><strong>'+count(n)+'</strong></div>').join('')||'<p class="ops-empty">No quality evidence available.</p>';
  }

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
    $('pro-list').innerHTML = rows.map(row=>`<article class="pro-item"><div class="app-card-top"><span class="app-monogram">${esc(row.name.replace(/^Afro/,'').slice(0,2).toUpperCase())}</span><span class="status-pill ${row.status==='active'?'active':''}">${esc(row.status==='active'?'Registry active':'Preview / shell')}</span></div><h3>${link(row.route,row.name)}</h3><p>${esc(row.state)}</p><small>Gate audit: ${esc(row.gate)} · Authored readiness: ${esc(row.readiness ?? 'not supplied')}</small><p>${esc(row.backing)}</p><p class="next-action"><strong>Next step</strong><br>${esc(row.next)}</p></article>`).join('');
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
    $('quality').textContent = data.quality ? `Report dated ${shortDate(data.quality.generated_at)} · Browser smoke ${data.quality.browser_smoke?.enabled ? 'included' : 'not included'}.` : 'Quality report unavailable.';
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
    renderImages(); renderPro(); renderSources(); renderOverview();
    window.dispatchEvent(new CustomEvent('operator-snapshot',{detail:data}));
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
  fetch('/api/operator-dashboard/snapshot.json', {cache:'no-store', credentials:'same-origin'}).then(response=>{if(!response.ok)throw Error('Snapshot unavailable');return response.json();}).then(payload=>{data=payload;render();}).catch(()=>{$('snapshot').textContent='Snapshot unavailable or session expired. Sign in again, or ask the operator to rebuild the snapshot.';$('overview-metrics').innerHTML='<div class="loading-state">Workspace data unavailable. <a href="/mc-7a2f9x.html">Sign in again</a> or open Evidence &amp; refresh.</div>';$('overview-date').textContent='Snapshot unavailable';});
}());
