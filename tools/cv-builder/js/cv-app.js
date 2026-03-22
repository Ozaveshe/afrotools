/* ═══════════════════════════════════════════════════════════════
   AfroTools CV Builder — Main Application
   Plain HTML/CSS/JS — No frameworks
   ═══════════════════════════════════════════════════════════════ */
'use strict';

const CVApp = (function() {
  // ── State ─────────────────────────────────────────────────
  let state = {
    data: createEmptyCV(),
    country: 'NG',
    template: 'slate',
    accentColor: 'var(--color-primary)',
    accentHex: '#007AFF',
    mobileView: 'edit', // 'edit' or 'preview'
    colOpen: {personal:true,summary:true,exp:true,edu:true,projs:false,skills:true,certs:false,langs:true,refs:true,extras:false,nysc:true,custom:false},
    savedCVs: [],
    currentCVId: null,
    autoSaveTimer: null,
    dirty: false,
  };

  // ── Helpers ───────────────────────────────────────────────
  const $ = s => document.querySelector(s);
  const $$ = s => document.querySelectorAll(s);
  const esc = s => { const d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; };
  const fmtMonth = v => { if (!v) return ''; if (!v.includes('-')) return v; const [y,m] = v.split('-'); const ms = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']; return ms[+m-1]+' '+y; };
  const fmtDOB = v => { if (!v) return ''; const d = new Date(v); const ms = ['January','February','March','April','May','June','July','August','September','October','November','December']; return d.getDate()+' '+ms[d.getMonth()]+' '+d.getFullYear(); };
  const toArr = s => s ? s.split(/[,;\n]/).map(x => x.trim()).filter(Boolean) : [];
  const descToHTML = t => {
    if (!t) return '';
    const ls = t.split('\n').filter(l => l.trim());
    if (ls.length <= 1) return '<p>' + esc(t) + '</p>';
    const hasBul = ls.some(l => /^[•\-\*\d+\.]/.test(l.trim()));
    if (hasBul) return '<ul>' + ls.map(l => '<li>' + esc(l.replace(/^[•\-\*]\s*/, '').replace(/^\d+\.\s*/, '')) + '</li>').join('') + '</ul>';
    return '<p>' + ls.map(l => esc(l)).join('<br/>') + '</p>';
  };

  function ago(ts) {
    const s = Math.floor((Date.now() - ts) / 1000);
    if (s < 60) return 'just now';
    if (s < 3600) return Math.floor(s/60) + 'm ago';
    if (s < 86400) return Math.floor(s/3600) + 'h ago';
    const d = Math.floor(s/86400);
    if (d < 30) return d + 'd ago';
    return new Date(ts).toLocaleDateString('en-GB', {day:'numeric', month:'short'});
  }

  // ── Score ─────────────────────────────────────────────────
  function calcScore(d) {
    const checks = [
      !!d.fn, !!d.ln, !!d.title, !!d.email, !!d.phone, !!d.loc,
      !!d.summary && d.summary.length > 30,
      d.exps.some(e => e.t && e.c),
      d.exps.some(e => e.d && e.d.length > 20),
      d.edus.some(e => e.deg && e.sch),
      !!(d.skills.h || d.skills.s || d.skills.t),
      d.langs.some(l => l.l),
      d.showRefs && d.refs.some(r => r.n && (r.p || r.e)),
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }

  function getScoreColor(score) {
    if (score >= 80) return '#007AFF';
    if (score >= 50) return '#f59e0b';
    return '#ef4444';
  }

  // ── State Updates ─────────────────────────────────────────
  function updateData(path, val) {
    const parts = path.split('.');
    const d = state.data;
    if (parts.length === 1) {
      d[parts[0]] = val;
    } else if (parts.length === 2) {
      if (typeof d[parts[0]] === 'object' && !Array.isArray(d[parts[0]])) {
        d[parts[0]] = { ...d[parts[0]], [parts[1]]: val };
      } else {
        d[parts[0]] = val;
      }
    } else if (parts.length === 3) {
      const idx = parseInt(parts[1]);
      if (Array.isArray(d[parts[0]]) && d[parts[0]][idx]) {
        d[parts[0]][idx] = { ...d[parts[0]][idx], [parts[2]]: val };
      }
    }
    state.dirty = true;
    renderPreviewDebounced();
    updateScore();
    scheduleAutoSave();
  }

  function setArrayData(key, arr) {
    state.data[key] = arr;
    state.dirty = true;
    renderEditor();
    renderPreview();
    updateScore();
    scheduleAutoSave();
  }

  // ── Auto Save ─────────────────────────────────────────────
  function scheduleAutoSave() {
    clearTimeout(state.autoSaveTimer);
    state.autoSaveTimer = setTimeout(() => {
      saveToLocalStorage();
    }, 2000);
  }

  function saveToLocalStorage() {
    try {
      const saveData = {
        data: state.data,
        country: state.country,
        template: state.template,
        accentColor: state.accentColor,
        accentHex: state.accentHex,
      };
      // Save current session
      localStorage.setItem('afro_cv_data', JSON.stringify(saveData));
      state.dirty = false;
      const el = $('.cv-auto-saved');
      if (el) el.textContent = 'Auto-saved \u2713';
      // Save version history (max 20 versions)
      saveVersionSnapshot(saveData);
    } catch(e) { /* quota exceeded or private browsing */ }
  }

  function saveVersionSnapshot(saveData) {
    try {
      const versions = JSON.parse(localStorage.getItem('afro_cv_versions') || '[]');
      // Only save if data actually changed (compare to last version)
      const last = versions[0];
      const currentStr = JSON.stringify(saveData.data);
      if (last && JSON.stringify(last.data) === currentStr) return;
      versions.unshift({
        timestamp: Date.now(),
        data: saveData.data,
        country: saveData.country,
        template: saveData.template,
      });
      // Keep max 20
      if (versions.length > 20) versions.length = 20;
      localStorage.setItem('afro_cv_versions', JSON.stringify(versions));
    } catch(e) { /* quota or storage error */ }
  }

  function loadFromLocalStorage() {
    try {
      const saved = localStorage.getItem('afro_cv_data');
      if (saved) {
        const p = JSON.parse(saved);
        if (p.data) {
          // Merge with defaults to handle new fields
          state.data = { ...createEmptyCV(), ...p.data };
          // Ensure arrays have proper structure
          if (!state.data.refs || !state.data.refs.length) state.data.refs = [{n:'',t:'',org:'',p:'',e:'',rel:''}];
          if (!state.data.exps || !state.data.exps.length) state.data.exps = [{t:'',c:'',l:'',s:'',e:'',cur:false,d:''}];
          if (!state.data.edus || !state.data.edus.length) state.data.edus = [{deg:'',sch:'',loc:'',y1:'',y2:'',g:''}];
        }
        if (p.country) state.country = p.country;
        if (p.template) state.template = p.template;
        if (p.accentColor) state.accentColor = p.accentColor;
        if (p.accentHex) state.accentHex = p.accentHex;
      }
    } catch(e) { /* parse error */ }
  }

  // ── Multi-CV Save System ──────────────────────────────────
  function loadSavedCVs() {
    try {
      const list = localStorage.getItem('afro_cv_list');
      state.savedCVs = list ? JSON.parse(list) : [];
    } catch(e) { state.savedCVs = []; }
  }

  function saveCVToList(name) {
    loadSavedCVs();
    const id = state.currentCVId || 'cv_' + Date.now();
    const entry = {
      id,
      title: name || 'Untitled CV',
      data: JSON.parse(JSON.stringify(state.data)),
      country: state.country,
      template: state.template,
      accentColor: state.accentColor,
      accentHex: state.accentHex,
      updatedAt: Date.now(),
      createdAt: state.savedCVs.find(c => c.id === id)?.createdAt || Date.now(),
    };
    const idx = state.savedCVs.findIndex(c => c.id === id);
    if (idx >= 0) state.savedCVs[idx] = entry;
    else state.savedCVs.unshift(entry);
    state.currentCVId = id;
    try { localStorage.setItem('afro_cv_list', JSON.stringify(state.savedCVs)); } catch(e) {}
    renderSavedCVs();
    showToast('CV saved: ' + name);
  }

  function loadCVFromList(id) {
    loadSavedCVs();
    const cv = state.savedCVs.find(c => c.id === id);
    if (!cv) return;
    state.data = { ...createEmptyCV(), ...cv.data };
    state.country = cv.country || 'NG';
    state.template = cv.template || 'slate';
    state.accentColor = cv.accentColor || 'var(--color-primary)';
    state.accentHex = cv.accentHex || '#007AFF';
    state.currentCVId = id;
    saveToLocalStorage();
    renderAll();
    showToast('Loaded: ' + cv.title);
  }

  function duplicateCV(id) {
    loadSavedCVs();
    const cv = state.savedCVs.find(c => c.id === id);
    if (!cv) return;
    const newEntry = {
      ...JSON.parse(JSON.stringify(cv)),
      id: 'cv_' + Date.now(),
      title: cv.title + ' (Copy)',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    state.savedCVs.unshift(newEntry);
    try { localStorage.setItem('afro_cv_list', JSON.stringify(state.savedCVs)); } catch(e) {}
    renderSavedCVs();
    showToast('Duplicated: ' + cv.title);
  }

  function deleteCV(id) {
    if (!confirm('Delete this saved CV?')) return;
    loadSavedCVs();
    state.savedCVs = state.savedCVs.filter(c => c.id !== id);
    if (state.currentCVId === id) state.currentCVId = null;
    try { localStorage.setItem('afro_cv_list', JSON.stringify(state.savedCVs)); } catch(e) {}
    renderSavedCVs();
    showToast('CV deleted');
  }

  function newCV() {
    state.data = createEmptyCV();
    state.currentCVId = null;
    saveToLocalStorage();
    renderAll();
  }

  // ── Toast ─────────────────────────────────────────────────
  function showToast(msg) {
    let toast = $('.cv-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'cv-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
  }

  // ── Score Update ──────────────────────────────────────────
  function updateScore() {
    const score = calcScore(state.data);
    const color = getScoreColor(score);
    const pctEl = $('.cv-score-pct');
    const fillEl = $('.cv-score-fill');
    const barEl = $('.cv-complete-bar');
    if (pctEl) { pctEl.textContent = score + '%'; pctEl.style.color = color; }
    if (fillEl) { fillEl.style.width = score + '%'; fillEl.style.background = color; }
    if (barEl) { barEl.style.width = score + '%'; barEl.style.background = color; }
  }

  // ── Build Editor Form ─────────────────────────────────────
  function renderEditor() {
    const formInner = $('.cv-form-inner');
    if (!formInner) return;
    const d = state.data;
    const norms = COUNTRY_NORMS[state.country] || COUNTRY_NORMS.OTHER;

    formInner.innerHTML = buildEditorHTML(d, norms);
    attachEditorEvents();
  }

  function buildEditorHTML(d, norms) {
    let html = '';

    // ── Personal Info ────────────────────────────────────
    html += sectionWrap('personal', '\u{1F464} Personal Information', `
      <div class="cv-row2">
        <input class="cv-inp" placeholder="First Name" value="${esc(d.fn)}" data-path="fn">
        <input class="cv-inp" placeholder="Last Name" value="${esc(d.ln)}" data-path="ln">
      </div>
      <input class="cv-inp" placeholder="Professional Title (e.g. Software Engineer)" value="${esc(d.title)}" data-path="title">
      <input class="cv-inp" type="email" placeholder="Email address" value="${esc(d.email)}" data-path="email">
      <div class="cv-row2">
        <div>
          <label class="cv-label">Phone</label>
          <div style="display:flex;gap:4px">
            <select class="cv-select" data-path="phoneCode" style="flex:0 0 90px;margin-bottom:0">
              ${PHONE_CODES.map(pc => `<option value="${pc.code}" ${d.phoneCode===pc.code?'selected':''}>${pc.code}</option>`).join('')}
            </select>
            <input class="cv-inp" type="tel" placeholder="Phone number" value="${esc(d.phone)}" data-path="phone" style="margin-bottom:0">
          </div>
        </div>
        <div>
          <label class="cv-label">Location</label>
          <input class="cv-inp" placeholder="City, Country" value="${esc(d.loc)}" data-path="loc" style="margin-bottom:0">
        </div>
      </div>
      <input class="cv-inp" placeholder="LinkedIn URL (optional)" value="${esc(d.linkedin)}" data-path="linkedin">
      <input class="cv-inp" placeholder="Website / Portfolio (optional)" value="${esc(d.web)}" data-path="web">
      <label class="cv-check-row">
        <input type="checkbox" ${d.showPhoto?'checked':''} data-path="showPhoto" data-type="bool">
        <span>Include photo</span>
      </label>
      ${d.showPhoto ? '<input type="file" accept="image/*" class="cv-file-input" id="cv-photo-input">' + (d.photo ? '<div style="margin-bottom:8px"><img src="'+d.photo+'" style="width:48px;height:48px;border-radius:6px;object-fit:cover" alt=""></div>' : '') : ''}
      ${(norms.dob||norms.gen||norms.mar||norms.nat) ? `
        <label class="cv-check-row">
          <input type="checkbox" ${d.sp?'checked':''} data-path="sp" data-type="bool">
          <span>Include personal details (${norms.n} format)</span>
        </label>
        ${d.sp ? `
          ${norms.dob ? `<div><label class="cv-label">Date of Birth</label><input class="cv-inp" type="date" value="${d.dob}" data-path="dob"></div>` : ''}
          <div class="cv-row2">
            ${norms.gen ? `<div><label class="cv-label">Gender</label><input class="cv-inp" placeholder="Gender" value="${esc(d.gen)}" data-path="gen" style="margin-bottom:0"></div>` : ''}
            ${norms.mar ? `<div><label class="cv-label">Marital Status</label><select class="cv-select" data-path="mar" style="margin-bottom:0"><option value="">Select...</option><option ${d.mar==='Single'?'selected':''}>Single</option><option ${d.mar==='Married'?'selected':''}>Married</option><option ${d.mar==='Divorced'?'selected':''}>Divorced</option><option ${d.mar==='Widowed'?'selected':''}>Widowed</option></select></div>` : ''}
          </div>
          ${norms.nat ? `<input class="cv-inp" placeholder="Nationality" value="${esc(d.nat)}" data-path="nat">` : ''}
          ${norms.so ? `<input class="cv-inp" placeholder="${norms.soL || 'State of Origin'}" value="${esc(d.so)}" data-path="so">` : ''}
          ${norms.so && state.country === 'NG' ? `<input class="cv-inp" placeholder="LGA (Local Government Area)" value="${esc(d.lga||'')}" data-path="lga">` : ''}
          ${norms.idField ? `<input class="cv-inp" placeholder="ID Number" value="${esc(d.idNumber||'')}" data-path="idNumber">` : ''}
          ${norms.dlField ? `<div><label class="cv-label">Driver's Licence</label><select class="cv-select" data-path="dlStatus"><option value="">Select...</option><option ${d.dlStatus==='Code 8 (Light motor vehicle)'?'selected':''}>Code 8 (Light motor vehicle)</option><option ${d.dlStatus==='Code 10 (Heavy motor vehicle)'?'selected':''}>Code 10 (Heavy motor vehicle)</option><option ${d.dlStatus==='Code 14 (Extra heavy)'?'selected':''}>Code 14 (Extra heavy)</option><option ${d.dlStatus==='Learner\'s licence'?'selected':''}>Learner's licence</option><option ${d.dlStatus==='None'?'selected':''}>None</option></select></div>` : ''}
          ${norms.healthField ? `<div><label class="cv-label">Health Status</label><input class="cv-inp" placeholder="e.g. Good" value="${esc(d.healthStatus||'')}" data-path="healthStatus"></div>` : ''}
          ${norms.milField ? `<div><label class="cv-label">Military Service Status</label><select class="cv-select" data-path="milStatus"><option value="">Select...</option><option ${d.milStatus==='Completed'?'selected':''}>Completed</option><option ${d.milStatus==='Exempted'?'selected':''}>Exempted</option><option ${d.milStatus==='Deferred'?'selected':''}>Deferred</option><option ${d.milStatus==='N/A'?'selected':''}>N/A</option></select></div>` : ''}
          ${norms.relField ? `<input class="cv-inp" placeholder="Religion (optional)" value="${esc(d.religion||'')}" data-path="religion">` : ''}
        ` : ''}
      ` : ''}
    `);

    // ── NYSC (Nigeria only) ──────────────────────────────
    if (state.country === 'NG') {
      html += sectionWrap('nysc', '\u{1F1F3}\u{1F1EC} NYSC Details', `
        <label class="cv-label">NYSC Status</label>
        <select class="cv-select" data-path="nyscStatus">
          <option value="">Select...</option>
          <option ${d.nyscStatus==='Completed'?'selected':''}>Completed</option>
          <option ${d.nyscStatus==='Currently Serving'?'selected':''}>Currently Serving</option>
          <option ${d.nyscStatus==='Exempted'?'selected':''}>Exempted</option>
          <option ${d.nyscStatus==='Not Applicable'?'selected':''}>Not Applicable</option>
        </select>
        ${d.nyscStatus === 'Completed' || d.nyscStatus === 'Currently Serving' ? `
          <div class="cv-row2">
            <div><label class="cv-label">Service Year</label><input class="cv-inp" placeholder="e.g. 2022/2023" value="${esc(d.nyscYear||'')}" data-path="nyscYear" style="margin-bottom:0"></div>
            <div><label class="cv-label">State of Deployment</label><input class="cv-inp" placeholder="e.g. Lagos State" value="${esc(d.nyscState||'')}" data-path="nyscState" style="margin-bottom:0"></div>
          </div>
          <input class="cv-inp" placeholder="Primary Place of Assignment (PPA)" value="${esc(d.nyscPPA||'')}" data-path="nyscPPA">
        ` : ''}
      `);
    }

    // ── National Service (Ghana) ─────────────────────────
    if (state.country === 'GH') {
      html += sectionWrap('nysc', '\u{1F1EC}\u{1F1ED} National Service', `
        <div class="cv-row2">
          <div><label class="cv-label">Service Year</label><input class="cv-inp" placeholder="e.g. 2022/2023" value="${esc(d.nsYear||'')}" data-path="nsYear" style="margin-bottom:0"></div>
          <div><label class="cv-label">Organisation</label><input class="cv-inp" placeholder="Where you served" value="${esc(d.nsOrg||'')}" data-path="nsOrg" style="margin-bottom:0"></div>
        </div>
      `);
    }

    // ── Summary ──────────────────────────────────────────
    const summaryLabel = state.country === 'NG' ? 'Career Objective / Professional Summary' : 'Professional Summary';
    html += sectionWrap('summary', '\u270D\uFE0F ' + summaryLabel, `
      <textarea class="cv-textarea" placeholder="Write 2\u20134 sentences summarising your experience, top skills, and career goal.&#10;&#10;Example: Results-driven software engineer with 5 years of experience building fintech products across West Africa..." data-path="summary" style="min-height:90px">${esc(d.summary)}</textarea>
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span style="font-size:10px;color:${d.summary.length >= 50 && d.summary.length <= 300 ? '#22c55e' : '#f59e0b'}">${d.summary.split(/\s+/).filter(Boolean).length} words</span>
        <button class="cv-btn cv-btn-ai" style="padding:4px 10px;font-size:11px" onclick="CVApp.aiImproveSection('summary')" title="Improve with AI">\u2728 Improve</button>
      </div>
    `);

    // ── Experience ───────────────────────────────────────
    html += sectionWrap('exp', '\u{1F4BC} Work Experience', `
      ${d.exps.map((e, i) => `
        ${i > 0 ? '<hr class="cv-item-divider">' : ''}
        <div class="cv-item-header">
          <span class="cv-item-num"><span class="cv-drag-handle" data-arr="exps" data-idx="${i}">\u2630</span> Role ${i+1}</span>
          ${d.exps.length > 1 ? `<button class="cv-remove-btn" data-remove="exps" data-idx="${i}">\u2715 Remove</button>` : ''}
        </div>
        <input class="cv-inp" placeholder="Job Title" value="${esc(e.t)}" data-path="exps.${i}.t">
        <input class="cv-inp" placeholder="Company / Organisation" value="${esc(e.c)}" data-path="exps.${i}.c">
        <input class="cv-inp" placeholder="Location (e.g. Lagos, Nigeria)" value="${esc(e.l)}" data-path="exps.${i}.l">
        <div class="cv-row2">
          <div><label class="cv-label">Start</label><input class="cv-inp" type="month" value="${e.s}" data-path="exps.${i}.s" style="margin-bottom:0"></div>
          <div><label class="cv-label">${e.cur?'Present':'End'}</label><input class="cv-inp" type="month" value="${e.e}" ${e.cur?'disabled':''} data-path="exps.${i}.e" style="margin-bottom:0;${e.cur?'opacity:0.5':''}"></div>
        </div>
        <label class="cv-check-row" style="margin-top:6px">
          <input type="checkbox" ${e.cur?'checked':''} data-path="exps.${i}.cur" data-type="bool">
          <span>I currently work here</span>
        </label>
        <textarea class="cv-textarea" placeholder="\u2022 Describe key achievements using bullet points&#10;\u2022 Use numbers where possible (e.g. Increased revenue by 30%)&#10;\u2022 Start each bullet with an action verb (Led, Built, Managed, Reduced...)" data-path="exps.${i}.d">${esc(e.d)}</textarea>
      `).join('')}
      <button class="cv-add-btn" data-add="exps">+ Add Another Role</button>
    `);

    // ── Education ────────────────────────────────────────
    html += sectionWrap('edu', '\u{1F393} Education', `
      ${d.edus.map((e, i) => `
        ${i > 0 ? '<hr class="cv-item-divider">' : ''}
        <div class="cv-item-header">
          <span class="cv-item-num"><span class="cv-drag-handle" data-arr="edus" data-idx="${i}">\u2630</span> Qualification ${i+1}</span>
          ${d.edus.length > 1 ? `<button class="cv-remove-btn" data-remove="edus" data-idx="${i}">\u2715 Remove</button>` : ''}
        </div>
        <label class="cv-label">Degree / Qualification</label>
        <select class="cv-select" data-path="edus.${i}.deg">
          <option value="">Select or type below...</option>
          ${DEGREE_OPTIONS.map(opt => opt.startsWith('---') ? `<option disabled>${opt}</option>` : `<option ${e.deg===opt?'selected':''}>${opt}</option>`).join('')}
        </select>
        ${e.deg === 'Other' || (!DEGREE_OPTIONS.includes(e.deg) && e.deg) ? `<input class="cv-inp" placeholder="Custom qualification" value="${esc(e.deg)}" data-path="edus.${i}.deg">` : ''}
        <input class="cv-inp" placeholder="University / School / Institution" value="${esc(e.sch)}" data-path="edus.${i}.sch">
        <input class="cv-inp" placeholder="Location" value="${esc(e.loc)}" data-path="edus.${i}.loc">
        <div class="cv-row3">
          <input class="cv-inp" placeholder="Start year" value="${esc(e.y1)}" data-path="edus.${i}.y1" style="margin-bottom:0">
          <input class="cv-inp" placeholder="End year" value="${esc(e.y2)}" data-path="edus.${i}.y2" style="margin-bottom:0">
          <input class="cv-inp" placeholder="Grade / Class" value="${esc(e.g)}" data-path="edus.${i}.g" style="margin-bottom:0">
        </div>
      `).join('')}
      <button class="cv-add-btn" data-add="edus">+ Add Qualification</button>
    `);

    // ── Skills ───────────────────────────────────────────
    html += sectionWrap('skills', '\u26A1 Skills', `
      <label class="cv-label">Technical / Hard Skills</label>
      <textarea class="cv-textarea" placeholder="Python, React, SQL, Data Analysis, Financial Modelling..." data-path="skills.h" style="min-height:52px">${esc(d.skills.h)}</textarea>
      <label class="cv-label">Soft Skills</label>
      <textarea class="cv-textarea" placeholder="Leadership, Communication, Problem Solving, Teamwork..." data-path="skills.s" style="min-height:52px">${esc(d.skills.s)}</textarea>
      <label class="cv-label">Tools & Software</label>
      <textarea class="cv-textarea" placeholder="Microsoft Office, Figma, Salesforce, QuickBooks..." data-path="skills.t" style="min-height:52px">${esc(d.skills.t)}</textarea>
    `);

    // ── Languages ────────────────────────────────────────
    html += sectionWrap('langs', '\u{1F310} Languages', `
      ${d.langs.map((lg, i) => `
        <div style="display:flex;gap:7px;margin-bottom:8px;align-items:center">
          <input class="cv-inp" placeholder="Language" value="${esc(lg.l)}" data-path="langs.${i}.l" style="flex:1;margin-bottom:0">
          <select class="cv-select" data-path="langs.${i}.lv" style="flex:0 0 130px;margin-bottom:0">
            ${LANG_LEVELS.map(lv => `<option ${lg.lv===lv?'selected':''}>${lv}</option>`).join('')}
          </select>
          ${d.langs.length > 1 ? `<button class="cv-remove-btn" data-remove="langs" data-idx="${i}">\u2715</button>` : ''}
        </div>
      `).join('')}
      <button class="cv-add-btn" data-add="langs">+ Add Language</button>
    `);

    // ── Projects ─────────────────────────────────────────
    html += sectionWrap('projs', '\u{1F680} Projects', `
      <label class="cv-check-row">
        <input type="checkbox" ${d.showProjs?'checked':''} data-path="showProjs" data-type="bool">
        <span>Include projects section</span>
      </label>
      ${d.showProjs ? `
        ${d.projs.map((p, i) => `
          ${i > 0 ? '<hr class="cv-item-divider">' : ''}
          <div class="cv-item-header">
            <span class="cv-item-num">Project ${i+1}</span>
            ${d.projs.length > 1 ? `<button class="cv-remove-btn" data-remove="projs" data-idx="${i}">\u2715</button>` : ''}
          </div>
          <input class="cv-inp" placeholder="Project Name" value="${esc(p.n)}" data-path="projs.${i}.n">
          <input class="cv-inp" placeholder="URL / GitHub (optional)" value="${esc(p.url)}" data-path="projs.${i}.url">
          <input class="cv-inp" placeholder="Tech Stack (e.g. React, Node.js, PostgreSQL)" value="${esc(p.tech||'')}" data-path="projs.${i}.tech">
          <textarea class="cv-textarea" placeholder="Brief description of the project and your role..." data-path="projs.${i}.d" style="min-height:52px">${esc(p.d)}</textarea>
        `).join('')}
        <button class="cv-add-btn" data-add="projs">+ Add Project</button>
      ` : ''}
    `);

    // ── Certifications ───────────────────────────────────
    html += sectionWrap('certs', '\u{1F3C5} Certifications & Professional Memberships', `
      ${d.certs.map((c, i) => `
        ${i > 0 ? '<hr class="cv-item-divider">' : ''}
        <input class="cv-inp" placeholder="Certification Name" value="${esc(c.n)}" data-path="certs.${i}.n">
        <div class="cv-row2">
          <input class="cv-inp" placeholder="Issued by" value="${esc(c.i)}" data-path="certs.${i}.i" style="margin-bottom:0">
          <input class="cv-inp" placeholder="Year" value="${esc(c.y)}" data-path="certs.${i}.y" style="margin-bottom:0">
        </div>
        ${d.certs.length > 1 ? `<button class="cv-remove-btn" style="margin-top:6px" data-remove="certs" data-idx="${i}">\u2715 Remove</button>` : ''}
      `).join('')}
      <button class="cv-add-btn" style="margin-top:8px" data-add="certs">+ Add Certification</button>
    `);

    // ── References ───────────────────────────────────────
    html += sectionWrap('refs', '\u{1F465} References', `
      <label class="cv-check-row">
        <input type="checkbox" ${d.showRefs?'checked':''} data-path="showRefs" data-type="bool">
        <span>Include references with full details</span>
      </label>
      ${!d.showRefs ? '<div class="cv-warning">\u26A0\uFE0F Most African employers expect references with full contact details. "Available on request" is often seen as lazy.</div>' : ''}
      ${d.showRefs ? `
        ${d.refs.map((r, i) => `
          ${i > 0 ? '<hr class="cv-item-divider">' : ''}
          <div class="cv-item-header">
            <span class="cv-item-num">Reference ${i+1}</span>
            ${d.refs.length > 1 ? `<button class="cv-remove-btn" data-remove="refs" data-idx="${i}">\u2715 Remove</button>` : ''}
          </div>
          <input class="cv-inp" placeholder="Full Name" value="${esc(r.n)}" data-path="refs.${i}.n">
          <input class="cv-inp" placeholder="Title / Position" value="${esc(r.t||'')}" data-path="refs.${i}.t">
          <input class="cv-inp" placeholder="Organisation" value="${esc(r.org||'')}" data-path="refs.${i}.org">
          <div class="cv-row2">
            <input class="cv-inp" type="email" placeholder="Email" value="${esc(r.e)}" data-path="refs.${i}.e" style="margin-bottom:0">
            <input class="cv-inp" type="tel" placeholder="Phone" value="${esc(r.p)}" data-path="refs.${i}.p" style="margin-bottom:0">
          </div>
          <input class="cv-inp" placeholder="Relationship (e.g. Former Manager)" value="${esc(r.rel||'')}" data-path="refs.${i}.rel">
        `).join('')}
        <button class="cv-add-btn" style="margin-top:8px" data-add="refs">+ Add Reference</button>
      ` : ''}
    `);

    // ── Extras ───────────────────────────────────────────
    html += sectionWrap('extras', '\u{1F3C6} Awards, Volunteering & Interests', `
      <label class="cv-label">Awards & Honours</label>
      <textarea class="cv-textarea" placeholder="Best Student Award, Regional Sales Champion..." data-path="extras.awards" style="min-height:52px">${esc(d.extras.awards)}</textarea>
      <label class="cv-label">Volunteer Experience</label>
      <textarea class="cv-textarea" placeholder="Red Cross Volunteer, Community cleanup organiser..." data-path="extras.volunteer" style="min-height:52px">${esc(d.extras.volunteer||'')}</textarea>
      <label class="cv-label">Professional Memberships</label>
      <textarea class="cv-textarea" placeholder="ICAN, CIPM, Nigeria Computer Society..." data-path="extras.memberships" style="min-height:52px">${esc(d.extras.memberships||'')}</textarea>
      <label class="cv-label">Interests & Hobbies</label>
      <textarea class="cv-textarea" placeholder="Football, Photography, Travelling, Open Source..." data-path="extras.hobbies" style="min-height:52px">${esc(d.extras.hobbies)}</textarea>
    `);

    // ── Custom Sections ──────────────────────────────────
    html += sectionWrap('custom', '➕ Custom Sections', `
      ${(d.customSections || []).map((cs, i) => `
        ${i > 0 ? '<hr class="cv-item-divider">' : ''}
        <div class="cv-item-header">
          <span class="cv-item-num">Section ${i+1}</span>
          <button class="cv-remove-btn" data-remove="customSections" data-idx="${i}">✕ Remove</button>
        </div>
        <input class="cv-inp" placeholder="Section Title (e.g. Publications, Awards)" value="${esc(cs.title||'')}" data-path="customSections.${i}.title">
        <textarea class="cv-textarea" placeholder="Section content..." data-path="customSections.${i}.content" style="min-height:60px">${esc(cs.content||'')}</textarea>
      `).join('')}
      <button class="cv-add-btn" data-add="customSections">+ Add Custom Section</button>
      <div style="margin-top:10px;font-size:10px;color:var(--color-text-subtle)">
        Suggested: Publications, Conferences, Awards, Volunteering, Professional Memberships, Hobbies
      </div>
    `);

    html += '<div style="height:20px"></div>';
    return html;
  }

  function sectionWrap(key, label, bodyHTML) {
    const open = state.colOpen[key] !== false;
    return `
      <div class="cv-section" data-section="${key}">
        <div class="cv-sec-head" data-toggle="${key}">
          <span class="cv-sec-label">${label}</span>
          <span class="cv-sec-toggle ${open ? '' : 'collapsed'}">\u25BE</span>
        </div>
        ${open ? `<div class="cv-section-body">${bodyHTML}</div>` : ''}
      </div>
    `;
  }

  // ── Attach Events ─────────────────────────────────────────
  function attachEditorEvents() {
    const form = $('.cv-form-inner');
    if (!form) return;

    // Input/textarea/select changes
    form.addEventListener('input', e => {
      const path = e.target.dataset.path;
      if (!path) return;
      const val = e.target.dataset.type === 'bool' ? e.target.checked : e.target.value;
      updateData(path, val);
    });

    // Scroll preview when user focuses a form field
    form.addEventListener('focusin', e => {
      const sec = e.target.closest('.cv-section');
      if (sec && sec.dataset.section) {
        clearTimeout(state._scrollTimer);
        state._scrollTimer = setTimeout(() => scrollPreviewToSection(sec.dataset.section), 200);
      }
    });

    form.addEventListener('change', e => {
      const path = e.target.dataset.path;
      if (!path) return;
      if (e.target.type === 'checkbox') {
        updateData(path, e.target.checked);
        // Re-render editor for conditional fields
        if (['showPhoto','sp','showProjs','showRefs','nyscStatus'].includes(path.split('.').pop())) {
          renderEditor();
          renderPreview();
        }
      } else {
        updateData(path, e.target.value);
        // Re-render for conditional fields like NYSC status or degree select
        if (path.includes('nyscStatus') || (path.includes('deg') && e.target.tagName === 'SELECT')) {
          renderEditor();
        }
      }
    });

    // Section toggles — scroll preview to matching section
    form.querySelectorAll('[data-toggle]').forEach(el => {
      el.addEventListener('click', () => {
        const key = el.dataset.toggle;
        state.colOpen[key] = !state.colOpen[key];
        renderEditor();
        if (state.colOpen[key]) scrollPreviewToSection(key);
      });
    });

    // Add buttons
    form.querySelectorAll('[data-add]').forEach(el => {
      el.addEventListener('click', () => {
        const key = el.dataset.add;
        const templates = {
          exps: {t:'',c:'',l:'',s:'',e:'',cur:false,d:''},
          edus: {deg:'',sch:'',loc:'',y1:'',y2:'',g:''},
          projs: {n:'',url:'',tech:'',d:''},
          certs: {n:'',i:'',y:''},
          langs: {l:'',lv:'Fluent'},
          refs: {n:'',t:'',org:'',p:'',e:'',rel:''},
          customSections: {title:'',content:''},
        };
        state.data[key] = [...state.data[key], templates[key]];
        renderEditor();
        renderPreview();
        scheduleAutoSave();
      });
    });

    // Remove buttons
    form.querySelectorAll('[data-remove]').forEach(el => {
      el.addEventListener('click', () => {
        const key = el.dataset.remove;
        const idx = parseInt(el.dataset.idx);
        state.data[key] = state.data[key].filter((_, i) => i !== idx);
        renderEditor();
        renderPreview();
        scheduleAutoSave();
      });
    });

    // Photo input
    const photoInput = document.getElementById('cv-photo-input');
    if (photoInput) {
      photoInput.addEventListener('change', e => {
        const f = e.target.files?.[0];
        if (f) {
          const r = new FileReader();
          r.onload = ev => {
            updateData('photo', ev.target.result);
            renderEditor();
          };
          r.readAsDataURL(f);
        }
      });
    }

    // Drag-and-drop reordering for array items
    let dragSrc = null;
    form.querySelectorAll('.cv-drag-handle').forEach(handle => {
      const parent = handle.closest('.cv-item-header')?.parentElement;
      if (!parent) return;
      parent.setAttribute('draggable', 'true');
      parent.addEventListener('dragstart', e => {
        dragSrc = { arr: handle.dataset.arr, idx: parseInt(handle.dataset.idx) };
        parent.classList.add('cv-dragging');
        e.dataTransfer.effectAllowed = 'move';
      });
      parent.addEventListener('dragend', () => {
        parent.classList.remove('cv-dragging');
        form.querySelectorAll('.cv-drag-over').forEach(el => el.classList.remove('cv-drag-over'));
        dragSrc = null;
      });
      parent.addEventListener('dragover', e => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        parent.classList.add('cv-drag-over');
      });
      parent.addEventListener('dragleave', () => parent.classList.remove('cv-drag-over'));
      parent.addEventListener('drop', e => {
        e.preventDefault();
        parent.classList.remove('cv-drag-over');
        if (!dragSrc || dragSrc.arr !== handle.dataset.arr) return;
        const toIdx = parseInt(handle.dataset.idx);
        if (dragSrc.idx === toIdx) return;
        const arr = [...state.data[dragSrc.arr]];
        const [moved] = arr.splice(dragSrc.idx, 1);
        arr.splice(toIdx, 0, moved);
        state.data[dragSrc.arr] = arr;
        renderEditor();
        renderPreview();
        scheduleAutoSave();
      });
    });
  }

  // ── Render Preview (debounced for typing perf) ──────────
  let _previewTimer = null;
  function renderPreviewDebounced() {
    clearTimeout(_previewTimer);
    _previewTimer = setTimeout(renderPreview, 80);
  }
  function renderPreview() {
    const preview = document.getElementById('cvpreview');
    if (!preview) return;
    const d = state.data;
    const norms = COUNTRY_NORMS[state.country] || COUNTRY_NORMS.OTHER;
    const ac = state.accentHex || '#007AFF';

    // Use template renderer
    if (typeof CVTemplates !== 'undefined' && CVTemplates[state.template]) {
      preview.innerHTML = CVTemplates[state.template](d, norms, ac);
    } else {
      // Fallback to Slate if template not found
      if (typeof CVTemplates !== 'undefined' && CVTemplates.slate) {
        preview.innerHTML = CVTemplates.slate(d, norms, ac);
      }
    }
  }

  // ── Scroll preview to match form section ──────────────────
  function scrollPreviewToSection(key) {
    const scrollContainer = document.querySelector('.cv-preview-scroll');
    const preview = document.getElementById('cvpreview');
    if (!scrollContainer || !preview) return;
    // Map form section keys to preview heading text patterns
    const map = {
      personal: null, // always at top
      summary: /summary|profile|objective/i,
      exp: /experience|employment/i,
      edu: /education/i,
      skills: /skills/i,
      langs: /language/i,
      projs: /project/i,
      certs: /certification|membership/i,
      refs: /reference/i,
      extras: /award|volunteer|interest|hobbi/i,
      nysc: /nysc|national service/i,
      custom: /custom/i
    };
    if (key === 'personal') { scrollContainer.scrollTop = 0; return; }
    const pattern = map[key];
    if (!pattern) return;
    // Search headings in the preview
    const headings = preview.querySelectorAll('h2, h3, [class*="sec-title"], [class*="section-title"]');
    for (const h of headings) {
      if (pattern.test(h.textContent)) {
        const rect = h.getBoundingClientRect();
        const containerRect = scrollContainer.getBoundingClientRect();
        scrollContainer.scrollTop += rect.top - containerRect.top - 20;
        return;
      }
    }
  }

  // ── Render Template Switcher ──────────────────────────────
  function renderTemplateSwitcher() {
    const top = $('.cv-preview-top');
    if (!top) return;
    let html = '';
    TEMPLATE_GROUPS.forEach((grp, gi) => {
      if (gi > 0) html += '<div class="cv-tmpl-sep"></div>';
      html += `<span class="cv-tmpl-group-label">${grp.label}</span>`;
      grp.items.forEach(t => {
        html += `<button class="cv-tmpl-btn ${state.template === t.id ? 'active' : ''}" data-tmpl="${t.id}">
          <span class="cv-tmpl-dot" style="background:${t.colors[0]}"></span>${t.name}
        </button>`;
      });
    });
    top.innerHTML = html;

    top.querySelectorAll('[data-tmpl]').forEach(btn => {
      btn.addEventListener('click', () => {
        state.template = btn.dataset.tmpl;
        renderTemplateSwitcher();
        renderPreview();
        scheduleAutoSave();
        trackEvent('template_selected', {template: state.template});
      });
    });
  }

  // ── Render Accent Colors ──────────────────────────────────
  function renderAccentColors() {
    const bar = $('.cv-colors');
    if (!bar) return;
    let html = '<span class="cv-color-label">Accent:</span>';
    ACCENT_COLORS.forEach(c => {
      html += `<div class="cv-color-dot ${state.accentColor === c.value ? 'active' : ''}" style="background:${c.hex}" data-accent="${c.value}" data-hex="${c.hex}" title="${c.label}"></div>`;
    });
    html += '<span class="cv-auto-saved">Auto-saved \u2713</span>';
    bar.innerHTML = html;

    bar.querySelectorAll('[data-accent]').forEach(dot => {
      dot.addEventListener('click', () => {
        state.accentColor = dot.dataset.accent;
        state.accentHex = dot.dataset.hex;
        renderAccentColors();
        renderPreview();
        scheduleAutoSave();
      });
    });
  }

  // ── Render Country Selector ───────────────────────────────
  function renderCountrySelector() {
    const sel = $('.cv-country-sel');
    if (!sel) return;
    sel.innerHTML = Object.entries(COUNTRY_NORMS).map(([k, v]) =>
      `<option value="${k}" ${state.country === k ? 'selected' : ''}>${v.f} ${v.n}</option>`
    ).join('');
  }

  // ── Render Score ──────────────────────────────────────────
  function renderScorePanel() {
    const panel = $('.cv-score');
    if (!panel) return;
    const score = calcScore(state.data);
    const color = getScoreColor(score);
    const norms = COUNTRY_NORMS[state.country] || COUNTRY_NORMS.OTHER;
    panel.innerHTML = `
      <div class="cv-score-row">
        <span class="cv-score-label">CV Completeness</span>
        <span class="cv-score-pct" style="color:${color}">${score}%</span>
      </div>
      <div class="cv-score-track">
        <div class="cv-score-fill" style="width:${score}%;background:${color}"></div>
      </div>
      ${norms.h ? `<div class="cv-score-hint">\u{1F4A1} ${norms.h}</div>` : ''}
    `;
  }

  // ── Render Saved CVs ──────────────────────────────────────
  function renderSavedCVs() {
    loadSavedCVs();
    const section = $('.cv-saved-section');
    const grid = $('.cv-saved-grid');
    if (!section || !grid) return;

    if (!state.savedCVs.length) {
      section.classList.remove('show');
      return;
    }
    section.classList.add('show');
    grid.innerHTML = state.savedCVs.map(cv => `
      <div class="cv-saved-card" data-cv-id="${cv.id}">
        <div class="cv-saved-card-name">${esc(cv.title)}</div>
        <div class="cv-saved-card-sub">${esc((cv.data.fn || '') + ' ' + (cv.data.ln || '')).trim() || 'No name'} \u00B7 ${cv.template || 'slate'}</div>
        <div class="cv-saved-card-footer">
          <span class="cv-saved-card-time">${ago(cv.updatedAt)}</span>
          <div class="cv-saved-card-actions">
            <button class="cv-edit-btn" data-load="${cv.id}">Edit</button>
            <button class="cv-dup-btn" data-dup="${cv.id}">Copy</button>
            <button class="cv-del-btn" data-del="${cv.id}">Delete</button>
          </div>
        </div>
      </div>
    `).join('');

    grid.querySelectorAll('[data-load]').forEach(btn => {
      btn.addEventListener('click', e => { e.stopPropagation(); loadCVFromList(btn.dataset.load); });
    });
    grid.querySelectorAll('[data-dup]').forEach(btn => {
      btn.addEventListener('click', e => { e.stopPropagation(); duplicateCV(btn.dataset.dup); });
    });
    grid.querySelectorAll('[data-del]').forEach(btn => {
      btn.addEventListener('click', e => { e.stopPropagation(); deleteCV(btn.dataset.del); });
    });
  }

  // ── Render All ────────────────────────────────────────────
  function renderAll() {
    renderCountrySelector();
    renderScorePanel();
    renderEditor();
    renderTemplateSwitcher();
    renderAccentColors();
    renderPreview();
    renderSavedCVs();
    updateScore();
  }

  // ── PDF Export ────────────────────────────────────────────
  async function downloadPDF() {
    const el = document.getElementById('cvpreview');
    if (!el) return;
    const btn = $('[data-action="pdf"]');
    if (btn) { btn.textContent = '\u23F3 Generating...'; btn.disabled = true; }
    try {
      await window.loadPdfLibs();
      const canvas = await html2canvas(el, { scale: 2, useCORS: true, logging: false, backgroundColor: '#fff' });
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new window.jspdf.jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pgW = pdf.internal.pageSize.getWidth();
      const pgH = pdf.internal.pageSize.getHeight();
      const ratio = canvas.height / canvas.width;
      const imgH = pgW * ratio;
      let y = 0;
      pdf.addImage(imgData, 'JPEG', 0, y, pgW, imgH);
      while (y + pgH < imgH) {
        y += pgH;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, -y, pgW, imgH);
      }
      // Watermark
      pdf.setFontSize(6);
      pdf.setTextColor(200);
      pdf.text('Generated with AfroTools.com', pgW/2, pgH - 3, {align: 'center'});
      const fn = ((state.data.fn || 'CV') + '_' + (state.data.ln || '') + '_CV_AfroTools.pdf').trim().replace(/\s+/g, '_');
      pdf.save(fn);
      trackEvent('cv_downloaded', {template: state.template, format: 'pdf'});
      showToast('PDF downloaded!');
    } catch(e) {
      console.error('PDF export failed:', e);
      alert('Download failed. Please try again.');
    } finally {
      if (btn) { btn.innerHTML = '\u{1F4E5} PDF'; btn.disabled = false; }
    }
  }

  function printCV() {
    const el = document.getElementById('cvpreview');
    if (!el) return;
    const w = window.open('', '_blank');
    w.document.write('<!DOCTYPE html><html><head><title>CV</title><link rel="stylesheet" href="/assets/css/tokens.min.css"><style>body{margin:0;padding:0}@page{margin:0;size:A4}*{-webkit-print-color-adjust:exact;print-color-adjust:exact}</style></head><body>');
    w.document.write(el.outerHTML);
    w.document.write('</body></html>');
    w.document.close();
    w.onload = () => { setTimeout(() => w.print(), 300); };
  }

  // ── Save Modal ────────────────────────────────────────────
  function showSaveModal() {
    let overlay = $('.cv-modal-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'cv-modal-overlay';
      overlay.innerHTML = `
        <div class="cv-modal">
          <h3>Save CV</h3>
          <input class="cv-inp" id="cv-save-name" placeholder="Name this CV (e.g. Banking CV, Tech CV)">
          <div class="cv-modal-actions">
            <button class="cv-btn cv-btn-ghost" style="color:var(--color-text-muted);border:1px solid var(--color-border)" id="cv-save-cancel">Cancel</button>
            <button class="cv-btn cv-btn-primary" id="cv-save-confirm">Save</button>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);

      document.getElementById('cv-save-cancel').addEventListener('click', () => overlay.classList.remove('open'));
      document.getElementById('cv-save-confirm').addEventListener('click', () => {
        const name = document.getElementById('cv-save-name').value.trim();
        if (!name) { document.getElementById('cv-save-name').focus(); return; }
        saveCVToList(name);
        overlay.classList.remove('open');
      });
      overlay.addEventListener('click', e => { if (e.target === overlay) overlay.classList.remove('open'); });
    }
    const nameInput = document.getElementById('cv-save-name');
    const existing = state.savedCVs.find(c => c.id === state.currentCVId);
    nameInput.value = existing ? existing.title : ((state.data.fn || '') + ' ' + (state.data.ln || '')).trim() + ' CV';
    overlay.classList.add('open');
    nameInput.focus();
  }

  // ── GA4 Tracking ──────────────────────────────────────────
  function trackEvent(name, params) {
    if (typeof gtag === 'function') {
      gtag('event', name, params);
    }
  }

  // ── Mobile Toggle ─────────────────────────────────────────
  function setupMobileToggle() {
    const toggle = $('.cv-mobile-toggle');
    if (!toggle) return;
    toggle.innerHTML = `
      <button class="active" data-view="edit">\u270F\uFE0F Edit</button>
      <button data-view="preview">\u{1F441}\uFE0F Preview</button>
    `;
    toggle.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        state.mobileView = btn.dataset.view;
        toggle.querySelectorAll('button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const formPanel = $('.cv-form-panel');
        const previewPanel = $('.cv-preview-panel');
        if (state.mobileView === 'edit') {
          formPanel?.classList.remove('hidden');
          previewPanel?.classList.add('hidden');
        } else {
          formPanel?.classList.add('hidden');
          previewPanel?.classList.remove('hidden');
          renderPreview();
        }
      });
    });
  }

  // ── AI Features (lazy-loaded) ─────────────────────────────
  function aiImproveSection(section) {
    // Load AI module if not loaded
    if (typeof CVAI === 'undefined') {
      const s = document.createElement('script');
      s.src = '/tools/cv-builder/js/cv-ai.js';
      s.onload = () => CVAI.improveSection(section, state.data, state.country);
      document.head.appendChild(s);
    } else {
      CVAI.improveSection(section, state.data, state.country);
    }
  }

  function aiAnalyzeCV() {
    if (typeof CVAI === 'undefined') {
      const s = document.createElement('script');
      s.src = '/tools/cv-builder/js/cv-ai.js';
      s.onload = () => CVAI.analyzeCV(state.data, state.country, state.template);
      document.head.appendChild(s);
    } else {
      CVAI.analyzeCV(state.data, state.country, state.template);
    }
  }

  function aiOpenChat() {
    if (typeof CVAI === 'undefined') {
      const s = document.createElement('script');
      s.src = '/tools/cv-builder/js/cv-ai.js';
      s.onload = () => CVAI.openChat(state.data, state.country);
      document.head.appendChild(s);
    } else {
      CVAI.openChat(state.data, state.country);
    }
  }

  // ── Init ──────────────────────────────────────────────────
  function init() {
    loadFromLocalStorage();
    loadSavedCVs();

    // Check URL params
    const params = new URLSearchParams(window.location.search);
    if (params.get('new') === '1') {
      newCV();
    } else if (params.get('cv')) {
      loadCVFromList(params.get('cv'));
    }

    renderAll();
    setupMobileToggle();

    // Country selector change
    const countrySel = $('.cv-country-sel');
    if (countrySel) {
      countrySel.addEventListener('change', e => {
        state.country = e.target.value;
        // Auto-set phone code
        const pc = PHONE_CODES.find(p => p.country === state.country);
        if (pc) state.data.phoneCode = pc.code;
        renderScorePanel();
        renderEditor();
        renderPreview();
        scheduleAutoSave();
      });
    }

    // Toolbar buttons
    document.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        switch(btn.dataset.action) {
          case 'pdf': downloadPDF(); break;
          case 'print': printCV(); break;
          case 'save': showSaveModal(); break;
          case 'new': newCV(); break;
          case 'analyze': aiAnalyzeCV(); break;
          case 'chat': aiOpenChat(); break;
          case 'import':
          case 'ats':
          case 'coverletter':
          case 'history':
            loadAdvanced(btn.dataset.action);
            break;
        }
      });
    });

    // Language selector
    const langSel = $('.cv-lang-sel');
    if (langSel) {
      langSel.addEventListener('change', e => {
        setUILang(e.target.value);
        renderAll();
      });
    }

    // Track page view
    trackEvent('page_view', {tool: 'cv-builder'});
  }

  // ── Load Advanced Features (lazy) ──────────────────────
  function loadAdvanced(action) {
    if (typeof CVAdvanced === 'undefined') {
      const s = document.createElement('script');
      s.src = '/tools/cv-builder/js/cv-advanced.js';
      s.onload = () => dispatchAdvanced(action);
      document.head.appendChild(s);
    } else {
      dispatchAdvanced(action);
    }
  }

  function dispatchAdvanced(action) {
    if (typeof CVAdvanced === 'undefined') return;
    switch(action) {
      case 'import': CVAdvanced.openImportModal(); break;
      case 'ats': CVAdvanced.runATSSimulator(state.data, state.country); break;
      case 'coverletter': CVAdvanced.openCoverLetterGenerator(state.data, state.country); break;
      case 'history': CVAdvanced.openVersionHistory(); break;
    }
  }

  // ── Public API ────────────────────────────────────────────
  return {
    init,
    getState: () => state,
    updateData,
    setArrayData,
    renderPreview,
    renderEditor,
    renderAll,
    downloadPDF,
    showToast,
    aiImproveSection,
    aiAnalyzeCV,
    aiOpenChat,
    saveCVToList,
    setTopState: function(key, val) { if (key in state) { state[key] = val; } },
    esc,
    fmtMonth,
    fmtDOB,
    toArr,
    descToHTML,
    calcScore,
    getScoreColor,
  };
})();

// Boot
document.addEventListener('DOMContentLoaded', CVApp.init);
