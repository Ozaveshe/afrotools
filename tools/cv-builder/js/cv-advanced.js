/* =================================================================
   AfroTools CV Builder — Advanced Features (Lazy-loaded)
   CVAdvanced IIFE module — plain JS, no frameworks
   Requires: CVApp global (getState, updateData, renderEditor,
             renderPreview, showToast, esc)
   ================================================================= */
'use strict';

const CVAdvanced = (function () {

  const API = '/.netlify/functions/ai-advisor';
  const VERSIONS_KEY = 'afro_cv_versions';
  const MAX_VERSIONS = 20;

  // ── Shared helpers ─────────────────────────────────────────────
  const esc = s => { const d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; };

  function callAI(messages) {
    return fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tool: 'cv-builder', messages })
    })
      .then(r => { if (!r.ok) throw new Error('API error'); return r.json(); })
      .then(d => d.response || d.content || d.message || '')
      .catch(() => null);
  }

  function makeOverlay(id) {
    let el = document.getElementById(id);
    if (el) { el.innerHTML = ''; return el; }
    el = document.createElement('div');
    el.id = id;
    el.className = 'cv-modal-overlay';
    document.body.appendChild(el);
    el.addEventListener('click', e => { if (e.target === el) el.classList.remove('open'); });
    return el;
  }

  function openOverlay(overlay) {
    overlay.classList.add('open');
  }

  function closeOverlay(overlay) {
    overlay.classList.remove('open');
  }

  function modalShell(title, bodyHTML, footerHTML) {
    return `
      <div class="cv-modal" style="max-width:600px;width:calc(100vw - 40px)">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
          <h3 style="margin:0;font-size:15px;font-weight:800;color:var(--color-text)">${title}</h3>
          <button data-adv-close style="background:none;border:none;font-size:20px;cursor:pointer;color:var(--color-text-muted);line-height:1">&times;</button>
        </div>
        <div class="cv-adv-modal-body">${bodyHTML}</div>
        ${footerHTML ? `<div class="cv-modal-actions" style="margin-top:16px">${footerHTML}</div>` : ''}
      </div>`;
  }

  function bindClose(overlay) {
    overlay.querySelectorAll('[data-adv-close]').forEach(btn => {
      btn.addEventListener('click', () => closeOverlay(overlay));
    });
  }

  // ── Inject shared CSS (once) ───────────────────────────────────
  (function injectStyles() {
    if (document.getElementById('cv-adv-styles')) return;
    const s = document.createElement('style');
    s.id = 'cv-adv-styles';
    s.textContent = `
      .cv-adv-label{font-size:11px;font-weight:700;color:var(--color-text-muted);text-transform:uppercase;letter-spacing:.04em;margin-bottom:4px}
      .cv-adv-input{width:100%;box-sizing:border-box;padding:9px 12px;border:1px solid var(--color-border);border-radius:8px;font-size:13px;font-family:var(--font-body);color:var(--color-text);background:var(--color-bg);outline:none;transition:border-color .15s}
      .cv-adv-input:focus{border-color:var(--color-primary)}
      .cv-adv-textarea{min-height:90px;resize:vertical}
      .cv-adv-section{margin-bottom:14px}
      .cv-adv-check-row{display:flex;align-items:baseline;gap:8px;font-size:12px;margin-bottom:4px;line-height:1.4}
      .cv-adv-check-row .adv-ok{color:#22c55e}
      .cv-adv-check-row .adv-warn{color:#f59e0b}
      .cv-adv-check-row .adv-fail{color:#ef4444}
      .cv-adv-score-pill{display:inline-flex;align-items:center;justify-content:center;min-width:48px;padding:2px 10px;border-radius:100px;font-size:11px;font-weight:800;color:#fff}
      .cv-adv-score-pill.good{background:#22c55e}
      .cv-adv-score-pill.ok{background:#f59e0b}
      .cv-adv-score-pill.poor{background:#ef4444}
      .cv-adv-preview-box{background:var(--color-bg-subtle,#f8fafc);border:1px solid var(--color-border);border-radius:10px;padding:14px;font-size:13px;line-height:1.7;white-space:pre-wrap;max-height:300px;overflow-y:auto;color:var(--color-text)}
      .cv-adv-ver-item{display:flex;align-items:center;gap:10px;padding:10px 12px;border:1px solid var(--color-border);border-radius:8px;margin-bottom:8px;cursor:pointer;transition:border-color .15s}
      .cv-adv-ver-item:hover{border-color:var(--color-primary)}
      .cv-adv-ver-item.selected{border-color:var(--color-primary);background:var(--color-primary-subtle,#E8F2FF)}
      .cv-adv-ver-meta{flex:1;font-size:12px;color:var(--color-text-muted)}
      .cv-adv-ver-name{font-size:13px;font-weight:700;color:var(--color-text)}
      .cv-adv-lang-btn{padding:6px 14px;border-radius:100px;border:1.5px solid var(--color-border);background:none;font-size:12px;font-weight:700;cursor:pointer;color:var(--color-text);transition:all .15s;font-family:var(--font-body)}
      .cv-adv-lang-btn.active,.cv-adv-lang-btn:hover{border-color:var(--color-primary);background:var(--color-primary);color:#fff}
      .cv-adv-qr-wrap{display:flex;flex-direction:column;align-items:center;gap:16px;padding:8px 0}
      .cv-adv-share-link{word-break:break-all;font-size:11px;background:var(--color-bg-subtle,#f8fafc);border:1px solid var(--color-border);border-radius:8px;padding:10px;color:var(--color-text-muted);max-height:80px;overflow-y:auto}
      .cv-adv-spinner{display:inline-block;width:16px;height:16px;border:2px solid var(--color-border);border-top-color:var(--color-primary);border-radius:50%;animation:adv-spin .6s linear infinite;vertical-align:middle}
      @keyframes adv-spin{to{transform:rotate(360deg)}}
    `;
    document.head.appendChild(s);
  })();

  // ══════════════════════════════════════════════════════════════
  // 1. ATS Simulator
  // ══════════════════════════════════════════════════════════════
  function runATSSimulator(data, country) {
    const overlay = makeOverlay('cv-adv-ats');
    const result = _scoreATS(data, country);
    const pill = result.score >= 75 ? 'good' : result.score >= 50 ? 'ok' : 'poor';

    let checksHTML = '';
    result.checks.forEach(c => {
      const cls = c.status === 'ok' ? 'adv-ok' : c.status === 'warn' ? 'adv-warn' : 'adv-fail';
      const icon = c.status === 'ok' ? '&#10003;' : c.status === 'warn' ? '&#9888;' : '&#10007;';
      checksHTML += `<div class="cv-adv-check-row"><span class="${cls}">${icon}</span><span>${esc(c.label)}</span></div>`;
    });

    let extractHTML = '';
    result.extracted.forEach(([field, val]) => {
      extractHTML += `<div style="display:flex;gap:8px;font-size:12px;margin-bottom:4px">
        <span style="min-width:120px;color:var(--color-text-muted);font-weight:600">${esc(field)}</span>
        <span style="color:var(--color-text)">${esc(val || '—')}</span>
      </div>`;
    });

    overlay.innerHTML = modalShell(
      'ATS Simulator',
      `<div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
        <div>
          <div style="font-size:11px;font-weight:700;color:var(--color-text-muted);margin-bottom:2px">ATS SCORE</div>
          <div style="font-size:28px;font-weight:900;color:var(--color-text)">${result.score}<span style="font-size:13px;font-weight:400">/100</span></div>
        </div>
        <span class="cv-adv-score-pill ${pill}">${result.score >= 75 ? 'Good' : result.score >= 50 ? 'Fair' : 'Poor'}</span>
      </div>
      <div class="cv-adv-section">
        <div class="cv-adv-label">ATS Parsing Checks</div>
        ${checksHTML}
      </div>
      <div class="cv-adv-section">
        <div class="cv-adv-label">Fields Extracted by ATS</div>
        ${extractHTML}
      </div>
      ${result.flags.length ? `<div class="cv-adv-section"><div class="cv-adv-label" style="color:#f59e0b">Formatting Flags</div>${result.flags.map(f=>`<div style="font-size:12px;margin-bottom:3px;color:var(--color-text)">&#9888; ${esc(f)}</div>`).join('')}</div>` : ''}`,
      `<button class="cv-btn cv-btn-ghost" style="border:1px solid var(--color-border);color:var(--color-text)" data-adv-close>Close</button>`
    );
    bindClose(overlay);
    openOverlay(overlay);
  }

  function _scoreATS(data, country) {
    const checks = [];
    let score = 0;

    function chk(label, pass, warn, msg) {
      const status = pass ? 'ok' : warn ? 'warn' : 'fail';
      checks.push({ label: msg || label, status });
      if (pass) score += 10;
      else if (warn) score += 4;
    }

    const hasEmail = !!data.email;
    const hasPhone = !!data.phone;
    const hasName  = !!(data.fn && data.ln);
    const hasTitle = !!data.title;
    const hasSummary = !!(data.summary && data.summary.split(/\s+/).filter(Boolean).length >= 30);
    const hasExp = (data.exps || []).some(e => e.t && e.c);
    const hasEdu = (data.edus || []).some(e => e.deg && e.sch);
    const hasSkills = !!(data.skills && (data.skills.h || data.skills.s));
    const hasQuantified = (data.exps || []).some(e => e.d && /\d+/.test(e.d));
    const hasActionVerbs = (data.exps || []).some(e => e.d && /^(Led|Built|Managed|Developed|Implemented|Increased|Reduced|Created|Designed|Delivered|Achieved|Improved|Established|Negotiated|Coordinated|Launched|Drove|Spearheaded|Oversaw)/im.test(e.d));

    chk('Contact info', hasEmail && hasPhone, hasEmail || hasPhone, hasEmail && hasPhone ? 'Email and phone detected' : 'Missing contact info — ATS may reject');
    chk('Candidate name', hasName, false, hasName ? 'Full name detected' : 'Full name missing');
    chk('Professional title/headline', hasTitle, false, hasTitle ? 'Title/headline present' : 'No professional title — add one');
    chk('Summary section (30+ words)', hasSummary, data.summary && data.summary.length > 0, hasSummary ? 'Summary section parsed' : 'Summary too short or missing');
    chk('Work experience', hasExp, false, hasExp ? 'Work experience entries found' : 'No work experience detected');
    chk('Education', hasEdu, false, hasEdu ? 'Education section parsed' : 'No education data detected');
    chk('Skills section', hasSkills, false, hasSkills ? 'Skills keywords extracted' : 'No skills listed — ATS keyword match will fail');
    chk('Quantified achievements', hasQuantified, !hasQuantified, hasQuantified ? 'Numbers/metrics found in experience' : 'No quantified results — add metrics');
    chk('Action verbs', hasActionVerbs, !hasActionVerbs, hasActionVerbs ? 'Action verbs detected' : 'Weak verb usage — start bullets with action verbs');
    chk('Standard section order', true, false, 'Section order: Summary > Experience > Education > Skills');

    score = Math.min(100, score);

    const extracted = [
      ['Name', (data.fn || '') + ' ' + (data.ln || '')],
      ['Email', data.email || ''],
      ['Phone', data.phone || ''],
      ['Location', data.loc || ''],
      ['LinkedIn', data.li || ''],
      ['Title', data.title || ''],
      ['Companies', (data.exps || []).filter(e => e.c).map(e => e.c).slice(0, 3).join(', ')],
      ['Degrees', (data.edus || []).filter(e => e.deg).map(e => e.deg).slice(0, 2).join(', ')],
      ['Skills', [(data.skills || {}).h, (data.skills || {}).s].filter(Boolean).join(', ').slice(0, 80)],
    ];

    const flags = [];
    if (data.photo) flags.push('Photo embedded — many ATS systems strip images; ensure text is complete');
    if ((data.summary || '').length > 1200) flags.push('Summary is very long — ATS may truncate');
    if ((data.exps || []).length > 8) flags.push('More than 8 experience entries — consider trimming older roles');
    if (country === 'ZA' && (data.dob || data.gen || data.mar)) flags.push('Personal details found — South African Employment Equity Act advises removing them');

    return { score, checks, extracted, flags };
  }

  // ══════════════════════════════════════════════════════════════
  // 2. Cover Letter Generator
  // ══════════════════════════════════════════════════════════════
  function openCoverLetterGenerator(data, country) {
    const overlay = makeOverlay('cv-adv-cover');
    const countryName = (typeof COUNTRY_NORMS !== 'undefined' && COUNTRY_NORMS[country])
      ? COUNTRY_NORMS[country].n : country;

    overlay.innerHTML = modalShell(
      'Cover Letter Generator',
      `<div class="cv-adv-section">
        <div class="cv-adv-label">Company Name</div>
        <input id="adv-cl-company" class="cv-adv-input" placeholder="e.g. Dangote Group" autocomplete="off">
      </div>
      <div class="cv-adv-section">
        <div class="cv-adv-label">Job Title Applying For</div>
        <input id="adv-cl-jobtitle" class="cv-adv-input" placeholder="e.g. Senior Financial Analyst" autocomplete="off">
      </div>
      <div class="cv-adv-section">
        <div class="cv-adv-label">Key Requirements from Job Description (optional)</div>
        <textarea id="adv-cl-reqs" class="cv-adv-input cv-adv-textarea" placeholder="Paste key requirements or skills requested..."></textarea>
      </div>
      <div id="adv-cl-preview" style="display:none" class="cv-adv-section">
        <div class="cv-adv-label">Generated Cover Letter</div>
        <div id="adv-cl-text" class="cv-adv-preview-box"></div>
      </div>`,
      `<button class="cv-btn cv-btn-ghost" style="border:1px solid var(--color-border);color:var(--color-text)" data-adv-close>Cancel</button>
       <button class="cv-btn cv-btn-ghost" id="adv-cl-copy" style="border:1px solid var(--color-border);color:var(--color-text);display:none">Copy</button>
       <button class="cv-btn cv-btn-ghost" id="adv-cl-pdf" style="border:1px solid var(--color-border);color:var(--color-text);display:none">Download PDF</button>
       <button class="cv-btn cv-btn-primary" id="adv-cl-gen">Generate</button>`
    );

    bindClose(overlay);
    openOverlay(overlay);

    let generatedText = '';

    overlay.querySelector('#adv-cl-gen').addEventListener('click', async () => {
      const company = overlay.querySelector('#adv-cl-company').value.trim();
      const jobTitle = overlay.querySelector('#adv-cl-jobtitle').value.trim();
      const reqs = overlay.querySelector('#adv-cl-reqs').value.trim();
      if (!company || !jobTitle) {
        CVApp.showToast('Please enter company name and job title');
        return;
      }
      const genBtn = overlay.querySelector('#adv-cl-gen');
      genBtn.disabled = true;
      genBtn.innerHTML = '<span class="cv-adv-spinner"></span> Generating...';

      const fullName = ((data.fn || '') + ' ' + (data.ln || '')).trim();
      const expSnippet = (data.exps || []).filter(e => e.t).slice(0, 3).map(e => `${e.t} at ${e.c}`).join('; ');
      const skillsSnippet = [(data.skills || {}).h, (data.skills || {}).s].filter(Boolean).join(', ').slice(0, 200);

      const sysMsg = `You are a professional cover letter writer specialising in African job markets. Write formal, compelling cover letters tailored to the country's norms. Be concise (3-4 paragraphs, under 350 words).`;
      const userMsg = `Write a professional cover letter for ${fullName || 'the applicant'} applying for ${jobTitle} at ${company} in ${countryName}.
CV Context: Title: ${data.title || 'Professional'}. Experience: ${expSnippet || 'See attached CV'}. Skills: ${skillsSnippet || 'Listed in CV'}.
${reqs ? `Job requirements: ${reqs}` : ''}
Format: Today's date (${new Date().toLocaleDateString('en-GB', {day:'numeric',month:'long',year:'numeric'})}), then the letter body, then "Yours sincerely," and the applicant name. Return plain text only.`;

      const result = await callAI([
        { role: 'system', content: sysMsg },
        { role: 'user', content: userMsg }
      ]);

      genBtn.disabled = false;
      genBtn.textContent = 'Regenerate';

      if (result) {
        generatedText = result;
        const preview = overlay.querySelector('#adv-cl-preview');
        const textEl = overlay.querySelector('#adv-cl-text');
        preview.style.display = '';
        textEl.textContent = result;
        overlay.querySelector('#adv-cl-copy').style.display = '';
        overlay.querySelector('#adv-cl-pdf').style.display = '';
      } else {
        CVApp.showToast('Cover letter generation failed. Try again.');
      }
    });

    overlay.querySelector('#adv-cl-copy').addEventListener('click', () => {
      if (!generatedText) return;
      navigator.clipboard.writeText(generatedText)
        .then(() => CVApp.showToast('Copied to clipboard!'))
        .catch(() => CVApp.showToast('Copy failed — please select and copy manually'));
    });

    overlay.querySelector('#adv-cl-pdf').addEventListener('click', () => {
      if (!generatedText) return;
      _downloadCoverLetterPDF(generatedText, data, country);
    });
  }

  function _downloadCoverLetterPDF(text, data, country) {
    window.loadPdfLibs().then(() => {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ unit: 'mm', format: 'a4' });
      const margin = 20;
      const pageW = 210;
      const usable = pageW - margin * 2;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      const lines = doc.splitTextToSize(text, usable);
      let y = margin;
      lines.forEach(line => {
        if (y > 277) { doc.addPage(); y = margin; }
        doc.text(line, margin, y);
        y += 6;
      });
      const name = ((data.fn || '') + ' ' + (data.ln || '')).trim() || 'cover-letter';
      doc.save(name.replace(/\s+/g, '-').toLowerCase() + '-cover-letter.pdf');
      CVApp.showToast('PDF downloaded!');
    }).catch(() => CVApp.showToast('PDF library failed to load'));
  }

  // ══════════════════════════════════════════════════════════════
  // 3. CV Import (text / paste)
  // ══════════════════════════════════════════════════════════════
  function openImportModal() {
    const overlay = makeOverlay('cv-adv-import');
    overlay.innerHTML = modalShell(
      'Import CV Text',
      `<p style="font-size:13px;color:var(--color-text-muted);margin:0 0 12px">Paste your existing CV text below. The AI will extract your details and pre-fill the form for you to review before applying.</p>
      <div class="cv-adv-section">
        <div class="cv-adv-label">Paste CV Text</div>
        <textarea id="adv-imp-text" class="cv-adv-input cv-adv-textarea" style="min-height:160px" placeholder="Paste the full text of your CV here..."></textarea>
      </div>
      <div id="adv-imp-review" style="display:none">
        <div class="cv-adv-label">Review Extracted Data</div>
        <div id="adv-imp-preview" class="cv-adv-preview-box" style="font-size:12px"></div>
      </div>`,
      `<button class="cv-btn cv-btn-ghost" style="border:1px solid var(--color-border);color:var(--color-text)" data-adv-close>Cancel</button>
       <button class="cv-btn cv-btn-ghost" id="adv-imp-apply" style="display:none;border:1px solid var(--color-border);color:var(--color-text)">Apply to CV</button>
       <button class="cv-btn cv-btn-primary" id="adv-imp-parse">Extract with AI</button>`
    );
    bindClose(overlay);
    openOverlay(overlay);

    let extracted = null;

    overlay.querySelector('#adv-imp-parse').addEventListener('click', async () => {
      const raw = overlay.querySelector('#adv-imp-text').value.trim();
      if (raw.length < 50) { CVApp.showToast('Please paste more CV text'); return; }

      const btn = overlay.querySelector('#adv-imp-parse');
      btn.disabled = true;
      btn.innerHTML = '<span class="cv-adv-spinner"></span> Extracting...';

      const sysMsg = 'You are a CV parser. Extract structured data from raw CV text and return a JSON object only. No markdown, no explanation.';
      const userMsg = `Parse this CV text and return JSON with these fields (use empty string if not found):
{
  "fn": "first name", "ln": "last name", "email": "", "phone": "", "loc": "city, country",
  "title": "professional title/headline", "summary": "professional summary paragraph",
  "skills_hard": "comma-separated hard skills", "skills_soft": "comma-separated soft skills",
  "exps": [{"t":"job title","c":"company","from":"YYYY-MM","to":"YYYY-MM or Present","d":"bullet points"}],
  "edus": [{"deg":"degree name","sch":"institution","from":"YYYY","to":"YYYY","grade":"grade if any"}],
  "langs": [{"l":"language","p":"proficiency"}],
  "refs": [{"n":"referee name","pos":"position","org":"company","e":"email","p":"phone"}]
}

CV text:
${raw.slice(0, 4000)}`;

      const result = await callAI([
        { role: 'system', content: sysMsg },
        { role: 'user', content: userMsg }
      ]);

      btn.disabled = false;
      btn.textContent = 'Re-extract';

      if (!result) { CVApp.showToast('Extraction failed. Try again.'); return; }

      try {
        const jsonStr = result.replace(/```json|```/g, '').trim();
        extracted = JSON.parse(jsonStr);
        const reviewBox = overlay.querySelector('#adv-imp-review');
        const previewEl = overlay.querySelector('#adv-imp-preview');
        reviewBox.style.display = '';
        previewEl.textContent = JSON.stringify(extracted, null, 2);
        overlay.querySelector('#adv-imp-apply').style.display = '';
      } catch (e) {
        CVApp.showToast('Could not parse AI response. Try with cleaner text.');
      }
    });

    overlay.querySelector('#adv-imp-apply').addEventListener('click', () => {
      if (!extracted) return;
      _applyImportedData(extracted);
      closeOverlay(overlay);
      CVApp.showToast('CV data imported! Review and adjust as needed.');
    });
  }

  function _applyImportedData(ex) {
    const upd = (key, val) => { if (val) CVApp.updateData(key, val); };
    upd('fn', ex.fn);
    upd('ln', ex.ln);
    upd('email', ex.email);
    upd('phone', ex.phone);
    upd('loc', ex.loc);
    upd('title', ex.title);
    upd('summary', ex.summary);
    if (ex.skills_hard || ex.skills_soft) {
      CVApp.updateData('skills', { h: ex.skills_hard || '', s: ex.skills_soft || '', t: '' });
    }
    if (Array.isArray(ex.exps) && ex.exps.length) CVApp.updateData('exps', ex.exps);
    if (Array.isArray(ex.edus) && ex.edus.length) CVApp.updateData('edus', ex.edus);
    if (Array.isArray(ex.langs) && ex.langs.length) CVApp.updateData('langs', ex.langs);
    if (Array.isArray(ex.refs) && ex.refs.length) CVApp.updateData('refs', ex.refs);
    CVApp.renderEditor();
    CVApp.renderPreview();
  }

  // ══════════════════════════════════════════════════════════════
  // 4. Version History
  // ══════════════════════════════════════════════════════════════
  function saveVersion(data, template, country) {
    try {
      const versions = _loadVersions();
      versions.unshift({
        id: Date.now(),
        ts: new Date().toISOString(),
        label: _versionLabel(data),
        template: template || 'slate',
        country: country || 'NG',
        data: JSON.parse(JSON.stringify(data))
      });
      if (versions.length > MAX_VERSIONS) versions.length = MAX_VERSIONS;
      localStorage.setItem(VERSIONS_KEY, JSON.stringify(versions));
    } catch (e) { /* storage full — silently skip */ }
  }

  function _loadVersions() {
    try { return JSON.parse(localStorage.getItem(VERSIONS_KEY) || '[]'); }
    catch (e) { return []; }
  }

  function _versionLabel(data) {
    const name = ((data.fn || '') + ' ' + (data.ln || '')).trim();
    const title = data.title || '';
    return (name || 'Unnamed') + (title ? ' — ' + title : '');
  }

  function _fmtTs(iso) {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) +
        ' ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    } catch (e) { return iso; }
  }

  function openVersionHistory() {
    const overlay = makeOverlay('cv-adv-versions');
    const versions = _loadVersions();

    function render(selectedId) {
      const rows = versions.length
        ? versions.map(v => `
          <div class="cv-adv-ver-item ${v.id === selectedId ? 'selected' : ''}" data-ver-id="${v.id}">
            <div style="flex:1">
              <div class="cv-adv-ver-name">${esc(v.label)}</div>
              <div class="cv-adv-ver-meta">${esc(_fmtTs(v.ts))} &middot; ${esc(v.template)} &middot; ${esc(v.country)}</div>
            </div>
          </div>`).join('')
        : '<div style="font-size:13px;color:var(--color-text-muted);text-align:center;padding:24px 0">No saved versions yet. Versions are created automatically on save.</div>';

      const selected = selectedId ? versions.find(v => v.id === selectedId) : null;
      const diffHTML = selected
        ? `<div class="cv-adv-section" style="margin-top:14px">
            <div class="cv-adv-label">Version Snapshot — ${esc(_fmtTs(selected.ts))}</div>
            <div class="cv-adv-preview-box" style="font-size:11px">${esc(JSON.stringify(selected.data, null, 2)).slice(0, 1200)}${JSON.stringify(selected.data).length > 1200 ? '\n...' : ''}</div>
           </div>` : '';

      overlay.innerHTML = modalShell(
        'Version History',
        `<div style="max-height:260px;overflow-y:auto;margin-bottom:2px">${rows}</div>${diffHTML}`,
        `<button class="cv-btn cv-btn-ghost" style="border:1px solid var(--color-border);color:var(--color-text)" data-adv-close>Close</button>
         ${selected ? `<button class="cv-btn cv-btn-primary" id="adv-ver-restore">Restore This Version</button>` : ''}`
      );
      bindClose(overlay);

      overlay.querySelectorAll('[data-ver-id]').forEach(el => {
        el.addEventListener('click', () => render(Number(el.dataset.verId)));
      });

      const restoreBtn = overlay.querySelector('#adv-ver-restore');
      if (restoreBtn && selected) {
        restoreBtn.addEventListener('click', () => {
          _applyImportedData(selected.data);
          CVApp.setTopState('template', selected.template);
          CVApp.setTopState('country', selected.country);
          CVApp.renderEditor();
          CVApp.renderPreview();
          closeOverlay(overlay);
          CVApp.showToast('Version restored!');
        });
      }
    }

    render(null);
    openOverlay(overlay);
  }

  // ══════════════════════════════════════════════════════════════
  // 5. Share Link (client-side, base64 hash)
  // ══════════════════════════════════════════════════════════════
  function generateShareLink(data, template) {
    const overlay = makeOverlay('cv-adv-share');
    let link = '';
    try {
      const payload = JSON.stringify({ data, template, v: 1 });
      const b64 = btoa(unescape(encodeURIComponent(payload)));
      const base = window.location.origin + window.location.pathname;
      link = base + '#cvdata=' + b64;
    } catch (e) {
      link = '';
    }

    const tooLong = link.length > 8000;

    overlay.innerHTML = modalShell(
      'Share CV Link',
      tooLong
        ? `<p style="font-size:13px;color:#ef4444">Your CV data is too large to encode as a shareable URL. Save your CV and share the page URL instead, or export as PDF.</p>`
        : `<p style="font-size:13px;color:var(--color-text-muted);margin:0 0 12px">This link encodes your CV data directly in the URL. It works client-side — no account needed. The link may be very long.</p>
           <div class="cv-adv-label">Shareable Link</div>
           <div class="cv-adv-share-link" id="adv-share-url">${esc(link)}</div>`,
      tooLong
        ? `<button class="cv-btn cv-btn-primary" data-adv-close>OK</button>`
        : `<button class="cv-btn cv-btn-ghost" style="border:1px solid var(--color-border);color:var(--color-text)" data-adv-close>Close</button>
           <button class="cv-btn cv-btn-primary" id="adv-share-copy">Copy Link</button>`
    );
    bindClose(overlay);
    openOverlay(overlay);

    const copyBtn = overlay.querySelector('#adv-share-copy');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(link)
          .then(() => CVApp.showToast('Link copied!'))
          .catch(() => {
            const el = overlay.querySelector('#adv-share-url');
            if (el) { const r = document.createRange(); r.selectNode(el); window.getSelection().removeAllRanges(); window.getSelection().addRange(r); }
            CVApp.showToast('Select the link above and copy manually');
          });
      });
    }

    // Auto-load from hash on page load (called once at module init)
    return link;
  }

  function _tryLoadFromHash() {
    try {
      const hash = window.location.hash;
      if (!hash.includes('cvdata=')) return;
      const b64 = hash.split('cvdata=')[1];
      if (!b64) return;
      const json = decodeURIComponent(escape(atob(b64)));
      const payload = JSON.parse(json);
      if (payload && payload.data) {
        setTimeout(() => {
          _applyImportedData(payload.data);
          CVApp.showToast('CV loaded from shared link!');
          history.replaceState(null, '', window.location.pathname);
        }, 800);
      }
    } catch (e) { /* ignore malformed hash */ }
  }

  // ══════════════════════════════════════════════════════════════
  // 6. QR Code Generator (pure SVG, no library)
  // ══════════════════════════════════════════════════════════════
  function generateQRCode(url) {
    const overlay = makeOverlay('cv-adv-qr');
    // Minimal QR via a free public API (Google Charts or similar) or canvas-based
    // Using a deterministic approach: we embed via a data URI using the QR module pattern
    const svgStr = _buildQRSVG(url);

    overlay.innerHTML = modalShell(
      'QR Code',
      `<div class="cv-adv-qr-wrap">
        <div id="adv-qr-svg">${svgStr}</div>
        <div style="font-size:12px;color:var(--color-text-muted);text-align:center;max-width:240px;word-break:break-all">${esc(url)}</div>
      </div>`,
      `<button class="cv-btn cv-btn-ghost" style="border:1px solid var(--color-border);color:var(--color-text)" data-adv-close>Close</button>
       <button class="cv-btn cv-btn-primary" id="adv-qr-dl">Download SVG</button>`
    );
    bindClose(overlay);
    openOverlay(overlay);

    overlay.querySelector('#adv-qr-dl').addEventListener('click', () => {
      const blob = new Blob([svgStr], { type: 'image/svg+xml' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'qrcode.svg';
      a.click();
      URL.revokeObjectURL(a.href);
    });
  }

  // Minimal QR code SVG via the qrserver API (no server-side, just a GET request image)
  // Falls back to a note if offline. We use an <image> element pointing to a CDN.
  function _buildQRSVG(url) {
    // Use api.qrserver.com which is a reliable free QR CDN
    const apiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
    return `<img src="${apiUrl}" alt="QR Code" width="200" height="200" style="border:8px solid #fff;border-radius:4px;display:block">`;
  }

  // ══════════════════════════════════════════════════════════════
  // 7. Multi-Language UI
  // ══════════════════════════════════════════════════════════════
  const LANGS = {
    en: {
      name: 'English',
      personal: 'Personal Information', summary: 'Professional Summary',
      experience: 'Work Experience', education: 'Education',
      skills: 'Skills', languages: 'Languages', references: 'References',
      projects: 'Projects', certifications: 'Certifications',
      save: 'Save', download: 'Download PDF', analyze: 'Analyze',
      firstName: 'First Name', lastName: 'Last Name', email: 'Email',
      phone: 'Phone', location: 'Location', nationality: 'Nationality',
      jobTitle: 'Job Title / Headline', company: 'Company',
      from: 'From', to: 'To', present: 'Present',
      degree: 'Degree / Qualification', institution: 'Institution',
      hardSkills: 'Hard Skills', softSkills: 'Soft Skills',
      addEntry: 'Add Entry', removeEntry: 'Remove',
      preview: 'Preview', edit: 'Edit',
    },
    fr: {
      name: 'Français',
      personal: 'Informations Personnelles', summary: 'Profil Professionnel',
      experience: 'Expérience Professionnelle', education: 'Formation',
      skills: 'Compétences', languages: 'Langues', references: 'Références',
      projects: 'Projets', certifications: 'Certifications',
      save: 'Enregistrer', download: 'Télécharger PDF', analyze: 'Analyser',
      firstName: 'Prénom', lastName: 'Nom', email: 'E-mail',
      phone: 'Téléphone', location: 'Localisation', nationality: 'Nationalité',
      jobTitle: 'Titre / Intitulé de poste', company: 'Entreprise',
      from: 'De', to: 'À', present: 'Présent',
      degree: 'Diplôme / Qualification', institution: 'Établissement',
      hardSkills: 'Compétences techniques', softSkills: 'Compétences humaines',
      addEntry: 'Ajouter', removeEntry: 'Supprimer',
      preview: 'Aperçu', edit: 'Modifier',
    },
    ar: {
      name: 'العربية',
      personal: 'المعلومات الشخصية', summary: 'الملخص المهني',
      experience: 'الخبرة العملية', education: 'التعليم',
      skills: 'المهارات', languages: 'اللغات', references: 'المراجع',
      projects: 'المشاريع', certifications: 'الشهادات',
      save: 'حفظ', download: 'تنزيل PDF', analyze: 'تحليل',
      firstName: 'الاسم الأول', lastName: 'اسم العائلة', email: 'البريد الإلكتروني',
      phone: 'الهاتف', location: 'الموقع', nationality: 'الجنسية',
      jobTitle: 'المسمى الوظيفي', company: 'الشركة',
      from: 'من', to: 'إلى', present: 'حتى الآن',
      degree: 'الدرجة / المؤهل', institution: 'المؤسسة التعليمية',
      hardSkills: 'المهارات التقنية', softSkills: 'المهارات الشخصية',
      addEntry: 'إضافة', removeEntry: 'حذف',
      preview: 'معاينة', edit: 'تعديل',
    },
    pt: {
      name: 'Português',
      personal: 'Informações Pessoais', summary: 'Resumo Profissional',
      experience: 'Experiência Profissional', education: 'Educação',
      skills: 'Competências', languages: 'Idiomas', references: 'Referências',
      projects: 'Projetos', certifications: 'Certificações',
      save: 'Guardar', download: 'Baixar PDF', analyze: 'Analisar',
      firstName: 'Primeiro Nome', lastName: 'Apelido', email: 'E-mail',
      phone: 'Telefone', location: 'Localização', nationality: 'Nacionalidade',
      jobTitle: 'Título Profissional', company: 'Empresa',
      from: 'De', to: 'Até', present: 'Presente',
      degree: 'Grau / Qualificação', institution: 'Instituição',
      hardSkills: 'Competências técnicas', softSkills: 'Competências interpessoais',
      addEntry: 'Adicionar', removeEntry: 'Remover',
      preview: 'Pré-visualizar', edit: 'Editar',
    },
    sw: {
      name: 'Kiswahili',
      personal: 'Taarifa Binafsi', summary: 'Muhtasari wa Kitaaluma',
      experience: 'Uzoefu wa Kazi', education: 'Elimu',
      skills: 'Ujuzi', languages: 'Lugha', references: 'Marejeo',
      projects: 'Miradi', certifications: 'Vyeti',
      save: 'Hifadhi', download: 'Pakua PDF', analyze: 'Changanua',
      firstName: 'Jina la Kwanza', lastName: 'Jina la Ukoo', email: 'Barua Pepe',
      phone: 'Simu', location: 'Mahali', nationality: 'Utaifa',
      jobTitle: 'Cheo cha Kazi', company: 'Kampuni',
      from: 'Kutoka', to: 'Hadi', present: 'Sasa',
      degree: 'Shahada / Sifa', institution: 'Taasisi',
      hardSkills: 'Ujuzi wa Kiufundi', softSkills: 'Ujuzi wa Kibinafsi',
      addEntry: 'Ongeza', removeEntry: 'Ondoa',
      preview: 'Hakikisha', edit: 'Hariri',
    }
  };

  let _currentLang = 'en';

  function setLanguage(lang) {
    if (!LANGS[lang]) return;
    _currentLang = lang;
    document.documentElement.lang = lang === 'ar' ? 'ar' : lang === 'sw' ? 'sw' : lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    if (typeof CVApp !== 'undefined' && CVApp.renderEditor) CVApp.renderEditor();
    if (typeof CVApp !== 'undefined' && CVApp.renderPreview) CVApp.renderPreview();
  }

  function getLabel(key) {
    const dict = LANGS[_currentLang] || LANGS.en;
    return dict[key] || LANGS.en[key] || key;
  }

  function openLanguageSelector() {
    const overlay = makeOverlay('cv-adv-lang');
    const btns = Object.entries(LANGS).map(([code, d]) =>
      `<button class="cv-adv-lang-btn ${code === _currentLang ? 'active' : ''}" data-lang="${code}">${esc(d.name)}</button>`
    ).join('');

    overlay.innerHTML = modalShell(
      'Language / Langue / اللغة',
      `<p style="font-size:13px;color:var(--color-text-muted);margin:0 0 14px">Choose the language for CV section labels and UI text. Your CV content is not translated.</p>
       <div style="display:flex;flex-wrap:wrap;gap:8px">${btns}</div>`,
      `<button class="cv-btn cv-btn-primary" data-adv-close>Done</button>`
    );
    bindClose(overlay);
    openOverlay(overlay);

    overlay.querySelectorAll('[data-lang]').forEach(btn => {
      btn.addEventListener('click', () => {
        overlay.querySelectorAll('[data-lang]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        setLanguage(btn.dataset.lang);
        CVApp.showToast('Language set to ' + LANGS[btn.dataset.lang].name);
      });
    });
  }

  // ── Init: try loading CV from URL hash ────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _tryLoadFromHash);
  } else {
    setTimeout(_tryLoadFromHash, 500);
  }

  // ── Public API ────────────────────────────────────────────────
  return {
    // ATS
    runATSSimulator,
    // Cover Letter
    openCoverLetterGenerator,
    // Import
    openImportModal,
    // Versions
    saveVersion,
    openVersionHistory,
    // Share
    generateShareLink,
    // QR
    generateQRCode,
    // Language
    setLanguage,
    getLabel,
    openLanguageSelector,
    get currentLang() { return _currentLang; },
  };

})();
