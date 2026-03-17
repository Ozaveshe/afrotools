/* ═══════════════════════════════════════════════════════════════
   AfroTools CV Builder — 16 Template Renderers
   Each returns an HTML string for the #cvpreview container
   ═══════════════════════════════════════════════════════════════ */
'use strict';

const CVTemplates = (function() {
  const esc = CVApp.esc;
  const fmtMonth = CVApp.fmtMonth;
  const fmtDOB = CVApp.fmtDOB;
  const toArr = CVApp.toArr;
  const descToHTML = CVApp.descToHTML;

  // ── Shared Helpers ────────────────────────────────────────
  function getProps(d, norms) {
    const name = (d.fn + ' ' + d.ln).trim() || 'Your Name';
    const title = d.title || 'Professional Title';
    const contact = [
      d.email && '\u2709 ' + esc(d.email),
      d.phone && '\uD83D\uDCF1 ' + esc((d.phoneCode||'') + ' ' + d.phone),
      d.loc && '\uD83D\uDCCD ' + esc(d.loc),
      d.linkedin && '\uD83D\uDD17 ' + esc(d.linkedin),
      d.web && '\uD83C\uDF10 ' + esc(d.web),
    ].filter(Boolean);
    const personal = d.sp ? [
      d.dob && ('DOB: ' + fmtDOB(d.dob)),
      d.nat && esc(d.nat),
      d.gen && esc(d.gen),
      d.mar && esc(d.mar),
      d.so && esc(d.so),
      d.lga && ('LGA: ' + esc(d.lga)),
      d.idNumber && ('ID: ' + esc(d.idNumber)),
      d.dlStatus && ('Licence: ' + esc(d.dlStatus)),
      d.healthStatus && ('Health: ' + esc(d.healthStatus)),
      d.milStatus && ('Military: ' + esc(d.milStatus)),
      d.religion && esc(d.religion),
    ].filter(Boolean) : [];
    const nyscInfo = d.nyscStatus ? [
      'NYSC: ' + esc(d.nyscStatus),
      d.nyscYear && ('Year: ' + esc(d.nyscYear)),
      d.nyscState && ('State: ' + esc(d.nyscState)),
      d.nyscPPA && ('PPA: ' + esc(d.nyscPPA)),
    ].filter(Boolean) : [];
    const techSkills = toArr(d.skills.h);
    const softSkills = toArr(d.skills.s);
    const toolSkills = toArr(d.skills.t);
    const allSkills = [...techSkills, ...softSkills];
    const hasExp = d.exps.some(e => e.t || e.c);
    const hasEdu = d.edus.some(e => e.deg || e.sch);
    const hasProj = d.showProjs && d.projs.some(p => p.n);
    const hasCert = d.certs.some(c => c.n);
    const hasRef = d.showRefs && d.refs.some(r => r.n);
    const hasLang = d.langs.some(l => l.l);
    const hasNysc = nyscInfo.length > 0;
    const hasAwards = !!(d.extras.awards);
    const hasHobbies = !!(d.extras.hobbies);
    const hasVolunteer = !!(d.extras.volunteer);
    const hasMemberships = !!(d.extras.memberships);
    const hasCustom = d.customSections && d.customSections.some(cs => cs.title && cs.content);
    return { name, title, contact, personal, nyscInfo, techSkills, softSkills, toolSkills, allSkills, hasExp, hasEdu, hasProj, hasCert, hasRef, hasLang, hasNysc, hasAwards, hasHobbies, hasVolunteer, hasMemberships, hasCustom };
  }

  function photoHTML(d, size, radius, border) {
    if (!d.showPhoto || !d.photo) return '';
    return `<img style="width:${size}px;height:${size}px;border-radius:${radius};object-fit:cover;${border||''}" src="${d.photo}" alt="">`;
  }

  function expHTML(exps) {
    return exps.map(e => {
      if (!e.t && !e.c) return '';
      return `<div style="margin-bottom:9px">
        <div class="tpl-exp-title">${esc(e.t || 'Position')}</div>
        <div class="tpl-exp-meta">${esc(e.c)}${e.l ? ' \u00B7 ' + esc(e.l) : ''}${e.cur ? ' \u00B7 Present' : (e.s || e.e) ? ' \u00B7 ' + fmtMonth(e.s) + (e.e ? ' \u2013 ' + fmtMonth(e.e) : '') : ''}</div>
        ${e.d ? '<div class="tpl-exp-desc">' + descToHTML(e.d) + '</div>' : ''}
      </div>`;
    }).join('');
  }

  function eduHTML(edus) {
    return edus.map(e => {
      if (!e.deg && !e.sch) return '';
      return `<div style="margin-bottom:8px">
        <div class="tpl-edu-deg">${esc(e.deg || 'Qualification')}</div>
        <div class="tpl-edu-school">${esc(e.sch)}${e.loc ? ' \u00B7 ' + esc(e.loc) : ''}</div>
        ${(e.y1 || e.y2) ? `<div class="tpl-edu-year">${e.y1}${e.y2 ? ' \u2013 ' + e.y2 : ''}${e.g ? ' \u00B7 ' + esc(e.g) : ''}</div>` : ''}
      </div>`;
    }).join('');
  }

  function projHTML(projs) {
    return projs.map(p => {
      if (!p.n) return '';
      return `<div style="margin-bottom:8px">
        <div style="font-weight:700;font-size:9.5px">${esc(p.n)}${p.url ? '<span style="font-weight:400;color:#007AFF;margin-left:5px;font-size:8px">\uD83D\uDD17 ' + esc(p.url) + '</span>' : ''}</div>
        ${p.tech ? '<div style="font-size:7.5px;color:#888;margin-top:1px">' + esc(p.tech) + '</div>' : ''}
        ${p.d ? '<div style="font-size:8.5px;color:#666;line-height:1.4;margin-top:2px">' + esc(p.d) + '</div>' : ''}
      </div>`;
    }).join('');
  }

  function certHTML(certs) {
    return certs.map(c => {
      if (!c.n) return '';
      return `<div style="font-size:8.5px;margin-bottom:5px">
        <span class="tpl-cert-name">${esc(c.n)}</span>
        ${c.i ? '<span class="tpl-cert-issuer">\u00B7 ' + esc(c.i) + '</span>' : ''}
        ${c.y ? '<span class="tpl-cert-year">\u00B7 ' + c.y + '</span>' : ''}
      </div>`;
    }).join('');
  }

  function langHTML(langs) {
    return langs.filter(l => l.l).map(l =>
      `<div class="tpl-lang-row"><span>${esc(l.l)}</span><span class="tpl-lang-level">${l.lv}</span></div>`
    ).join('');
  }

  function refHTML(refs) {
    return refs.map(r => {
      if (!r.n) return '';
      return `<div style="margin-bottom:6px">
        <div class="tpl-ref-name">${esc(r.n)}</div>
        ${r.t ? '<div class="tpl-ref-pos">' + esc(r.t) + (r.org ? ' \u00B7 ' + esc(r.org) : '') + '</div>' : ''}
        <div class="tpl-ref-contact">${[r.e, r.p].filter(Boolean).join(' \u00B7 ')}</div>
      </div>`;
    }).join('');
  }

  function pillsHTML(items, bg, color) {
    if (!items.length) return '';
    return items.map(s => `<span class="tpl-skill-pill" style="background:${bg};color:${color}">${esc(s)}</span>`).join('');
  }

  function nyscHTML(info) {
    return info.map(i => `<div style="font-size:8px;margin-bottom:2px">${i}</div>`).join('');
  }

  function customSectionsHTML(d, secFn) {
    if (!d.customSections || !d.customSections.length) return '';
    return d.customSections.filter(cs => cs.title && cs.content).map(cs =>
      secFn(esc(cs.title), '<div style="font-size:8.5px;color:#555;line-height:1.6">' + descToHTML(cs.content) + '</div>')
    ).join('');
  }

  const watermark = '<div class="tpl-watermark">Generated with AfroTools.com</div>';

  // ═══════════════════════════════════════════════════════════
  // TEMPLATE 1: SLATE (sidebar, classic)
  // ═══════════════════════════════════════════════════════════
  function slate(d, norms, ac) {
    const p = getProps(d, norms);
    const secL = (label, content) => content ? `<div style="margin-bottom:11px"><div style="font-size:7.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.6px;color:#dbeafe;margin-bottom:5px;padding-bottom:3px;border-bottom:1px solid rgba(255,255,255,0.15)">${label}</div>${content}</div>` : '';
    const secR = (label, content) => content ? `<div style="margin-bottom:11px"><div style="font-size:7.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.6px;color:var(--color-text);margin-bottom:5px;padding-bottom:3px;border-bottom:2px solid ${ac}">${label}</div>${content}</div>` : '';

    return `<div style="font-family:'DM Sans',sans-serif;font-size:8.5px;line-height:1.5;color:#222;min-height:100%;display:flex">
      <div style="flex:0 0 37%;background:#1e293b;color:#e2e8f0;padding:22px 16px;display:flex;flex-direction:column;min-height:100%">
        ${photoHTML(d, 64, '6px', 'margin-bottom:12px;border:2px solid rgba(255,255,255,0.15);')}
        <div style="font-family:'Instrument Serif',Georgia,serif;font-size:17px;font-weight:600;margin-bottom:2px;color:#fff;line-height:1.2;font-style:italic">${p.name}</div>
        <div style="font-size:8.5px;color:${ac};font-weight:600;margin-bottom:14px;letter-spacing:0.5px">${p.title}</div>
        ${secL('Contact', p.contact.length ? '<div>' + p.contact.map(c => `<div style="font-size:8px;margin-bottom:3px;color:#94a3b8">${c}</div>`).join('') + '</div>' : '')}
        ${secL('Personal', p.personal.length ? '<div>' + p.personal.map(pp => `<div style="font-size:8px;margin-bottom:3px">${pp}</div>`).join('') + '</div>' : '')}
        ${p.hasNysc ? secL('NYSC', nyscHTML(p.nyscInfo)) : ''}
        ${secL('Skills', p.allSkills.length ? pillsHTML(p.allSkills, 'rgba(59,130,246,0.2)', '#93c5fd') : '')}
        ${secL('Tools', p.toolSkills.length ? '<div>' + p.toolSkills.map(t => `<div style="font-size:8px;margin-bottom:2px;color:#94a3b8">\u00B7 ${esc(t)}</div>`).join('') + '</div>' : '')}
        ${secL('Languages', p.hasLang ? langHTML(d.langs) : '')}
        ${secL('Interests', p.hasHobbies ? '<div style="font-size:8px;color:#94a3b8">' + esc(d.extras.hobbies) + '</div>' : '')}
      </div>
      <div style="flex:1;padding:22px 18px;background:#fff;min-height:100%">
        ${secR('Summary', d.summary ? '<div style="font-size:8.5px;color:#555;line-height:1.6">' + esc(d.summary) + '</div>' : '')}
        ${secR('Work Experience', p.hasExp ? expHTML(d.exps) : '')}
        ${secR('Education', p.hasEdu ? eduHTML(d.edus) : '')}
        ${secR('Projects', p.hasProj ? projHTML(d.projs) : '')}
        ${secR('Certifications', p.hasCert ? certHTML(d.certs) : '')}
        ${secR('Awards', p.hasAwards ? '<div style="font-size:8.5px;color:#555">' + descToHTML(d.extras.awards) + '</div>' : '')}
        ${secR('Volunteering', p.hasVolunteer ? '<div style="font-size:8.5px;color:#555">' + descToHTML(d.extras.volunteer) + '</div>' : '')}
        ${customSectionsHTML(d, secR)}
        ${secR('References', p.hasRef ? refHTML(d.refs) : '')}
        ${watermark}
      </div>
    </div>`;
  }

  // ═══════════════════════════════════════════════════════════
  // TEMPLATE 2: EMBER (warm, single column)
  // ═══════════════════════════════════════════════════════════
  function ember(d, norms, ac) {
    const p = getProps(d, norms);
    ac = ac || '#c2410c';
    const sec = (label, content) => content ? `<div style="margin-bottom:12px"><div style="font-size:8.5px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:${ac};padding-bottom:4px;border-bottom:1px solid ${ac};margin-bottom:7px">${label}</div>${content}</div>` : '';

    return `<div style="font-family:'DM Sans',sans-serif;font-size:8.5px;line-height:1.5;color:#1c1917;min-height:100%;padding:22px">
      <div style="display:flex;align-items:flex-start;margin-bottom:16px;padding-bottom:14px;border-bottom:3px solid ${ac}">
        ${photoHTML(d, 58, '4px', 'margin-right:14px;border:2px solid ' + ac + ';')}
        <div style="flex:1">
          <div style="font-family:'Instrument Serif',Georgia,serif;font-size:20px;font-weight:700;margin-bottom:2px;line-height:1.1;font-style:italic">${p.name}</div>
          <div style="font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:1.5px;color:${ac};margin-bottom:8px">${p.title}</div>
          <div style="display:flex;flex-wrap:wrap;gap:10px;font-size:8px;color:#888">${p.contact.map(c => `<span>${c}</span>`).join('')}</div>
        </div>
      </div>
      ${sec('Summary', d.summary ? '<div style="font-size:8.5px;color:#555;line-height:1.65">' + esc(d.summary) + '</div>' : '')}
      ${sec('Personal', p.personal.length ? '<div style="display:flex;flex-wrap:wrap;gap:4px 16px">' + p.personal.map(pp => `<span style="font-size:8.5px">${pp}</span>`).join('') + '</div>' : '')}
      ${p.hasNysc ? sec('NYSC', nyscHTML(p.nyscInfo)) : ''}
      ${sec('Work Experience', p.hasExp ? expHTML(d.exps) : '')}
      ${sec('Education', p.hasEdu ? eduHTML(d.edus) : '')}
      ${sec('Skills', (p.allSkills.length || p.toolSkills.length) ? pillsHTML([...p.allSkills, ...p.toolSkills], '#fff7ed', ac) : '')}
      ${sec('Languages', p.hasLang ? langHTML(d.langs) : '')}
      ${sec('Projects', p.hasProj ? projHTML(d.projs) : '')}
      ${sec('Certifications', p.hasCert ? certHTML(d.certs) : '')}
      ${customSectionsHTML(d, sec)}
      ${sec('References', p.hasRef ? refHTML(d.refs) : '')}
      ${watermark}
    </div>`;
  }

  // ═══════════════════════════════════════════════════════════
  // TEMPLATE 3: PHANTOM (centered, two-column body)
  // ═══════════════════════════════════════════════════════════
  function phantom(d, norms, ac) {
    const p = getProps(d, norms);
    const sec = (label, content) => content ? `<div style="margin-bottom:12px;break-inside:avoid"><div style="font-size:7.5px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#aaa;margin-bottom:6px;padding-bottom:3px;border-bottom:1px solid #eee">${label}</div>${content}</div>` : '';

    return `<div style="font-family:'DM Sans',sans-serif;font-size:8.5px;line-height:1.5;color:#000;min-height:100%;padding:24px">
      <div style="text-align:center;padding-bottom:16px;margin-bottom:16px;border-bottom:1px solid #000">
        ${d.showPhoto && d.photo ? `<img style="width:56px;height:56px;border-radius:50%;object-fit:cover;display:block;margin:0 auto 10px" src="${d.photo}" alt="">` : ''}
        <div style="font-family:'Instrument Serif',Georgia,serif;font-size:22px;font-weight:700;letter-spacing:-0.5px;margin-bottom:3px;font-style:italic">${p.name}</div>
        <div style="font-size:9px;color:#555;text-transform:uppercase;letter-spacing:2.5px;margin-bottom:8px">${p.title}</div>
        <div style="display:flex;justify-content:center;flex-wrap:wrap;gap:12px;font-size:8px;color:#bbb">${p.contact.map(c => `<span>${c}</span>`).join('')}</div>
      </div>
      <div style="columns:2;column-gap:20px">
        ${sec('Summary', d.summary ? '<div style="font-size:8.5px;color:#444;line-height:1.65">' + esc(d.summary) + '</div>' : '')}
        ${sec('Experience', p.hasExp ? expHTML(d.exps) : '')}
        ${sec('Projects', p.hasProj ? projHTML(d.projs) : '')}
        ${sec('Education', p.hasEdu ? eduHTML(d.edus) : '')}
        ${sec('Skills', (p.allSkills.length || p.toolSkills.length) ? '<div style="font-size:8.5px;color:#444;line-height:1.7">' + [...p.allSkills, ...p.toolSkills].map(s => esc(s)).join(' \u00B7 ') + '</div>' : '')}
        ${sec('Languages', p.hasLang ? langHTML(d.langs) : '')}
        ${sec('Certifications', p.hasCert ? certHTML(d.certs) : '')}
        ${customSectionsHTML(d, sec)}
        ${sec('References', p.hasRef ? refHTML(d.refs) : '')}
      </div>
      ${watermark}
    </div>`;
  }

  // ═══════════════════════════════════════════════════════════
  // TEMPLATE 4: INDIGO (gradient header)
  // ═══════════════════════════════════════════════════════════
  function indigo(d, norms, ac) {
    const p = getProps(d, norms);
    ac = ac || '#4338ca';
    const sec = (label, content) => content ? `<div style="margin-bottom:11px"><div style="font-size:7.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:${ac};padding-left:7px;border-left:3px solid ${ac};margin-bottom:6px">${label}</div>${content}</div>` : '';

    return `<div style="font-family:'DM Sans',sans-serif;font-size:8.5px;line-height:1.5;color:#222;min-height:100%">
      <div style="background:linear-gradient(135deg,${ac},${ac}cc);color:#fff;padding:18px 20px">
        <div style="display:flex;align-items:center;gap:14px">
          ${photoHTML(d, 60, '6px', 'border:2px solid rgba(255,255,255,0.3);flex-shrink:0;')}
          <div>
            <div style="font-family:'Instrument Serif',Georgia,serif;font-size:19px;font-weight:600;margin-bottom:2px;font-style:italic">${p.name}</div>
            <div style="font-size:9px;opacity:0.85;margin-bottom:7px">${p.title}</div>
            <div style="display:flex;flex-wrap:wrap;gap:10px;font-size:8px">${p.contact.map(c => `<span>${c}</span>`).join('')}</div>
          </div>
        </div>
      </div>
      <div style="padding:16px 20px">
        ${sec('Summary', d.summary ? '<div style="font-size:8.5px;color:#555;line-height:1.65">' + esc(d.summary) + '</div>' : '')}
        ${sec('Personal', p.personal.length ? '<div style="display:flex;flex-wrap:wrap;gap:3px 14px">' + p.personal.map(pp => `<span style="font-size:8.5px">${pp}</span>`).join('') + '</div>' : '')}
        ${p.hasNysc ? sec('NYSC', nyscHTML(p.nyscInfo)) : ''}
        ${sec('Work Experience', p.hasExp ? expHTML(d.exps) : '')}
        ${sec('Education', p.hasEdu ? eduHTML(d.edus) : '')}
        ${sec('Skills', (p.allSkills.length || p.toolSkills.length) ? pillsHTML([...p.allSkills, ...p.toolSkills], '#eef2ff', ac) : '')}
        ${sec('Languages', p.hasLang ? langHTML(d.langs) : '')}
        ${sec('Projects', p.hasProj ? projHTML(d.projs) : '')}
        ${sec('Certifications', p.hasCert ? certHTML(d.certs) : '')}
        ${customSectionsHTML(d, sec)}
        ${sec('References', p.hasRef ? refHTML(d.refs) : '')}
        ${watermark}
      </div>
    </div>`;
  }

  // ═══════════════════════════════════════════════════════════
  // TEMPLATE 5: NOIR (dark sidebar, wide)
  // ═══════════════════════════════════════════════════════════
  function noir(d, norms, ac) {
    const p = getProps(d, norms);
    const secD = (label, content) => content ? `<div style="margin-bottom:10px"><div style="font-size:7.5px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#64748b;margin-bottom:5px">${label}</div>${content}</div>` : '';
    const secL = (label, content) => content ? `<div style="margin-bottom:10px"><div style="font-size:7.5px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#888;margin-bottom:5px">${label}</div>${content}</div>` : '';

    return `<div style="font-family:'DM Sans',sans-serif;font-size:8.5px;line-height:1.5;color:#222;min-height:100%;display:flex">
      <div style="flex:0 0 42%;background:#0f172a;color:#e2e8f0;padding:20px 15px;display:flex;flex-direction:column;min-height:100%">
        ${photoHTML(d, 60, '50%', 'border:2px solid rgba(255,255,255,0.2);margin-bottom:12px;')}
        <div style="font-family:'Instrument Serif',Georgia,serif;font-size:16px;font-weight:700;letter-spacing:0.5px;margin-bottom:6px;color:#fff;line-height:1.2;font-style:italic">${p.name}</div>
        <div style="font-size:8.5px;color:#94a3b8;margin-bottom:14px;line-height:1.4">${p.title}</div>
        ${secD('Contact', p.contact.length ? '<div>' + p.contact.map(c => `<div style="font-size:7.5px;margin-bottom:3px;color:#94a3b8">${c}</div>`).join('') + '</div>' : '')}
        ${secD('Personal', p.personal.length ? '<div>' + p.personal.map(pp => `<div style="font-size:8px;margin-bottom:3px">${pp}</div>`).join('') + '</div>' : '')}
        ${p.hasNysc ? secD('NYSC', nyscHTML(p.nyscInfo)) : ''}
        ${secD('Skills', p.allSkills.length ? pillsHTML(p.allSkills, 'rgba(255,255,255,0.08)', '#e2e8f0') : '')}
        ${secD('Tools', p.toolSkills.length ? '<div>' + p.toolSkills.map(t => `<div style="font-size:8px;margin-bottom:2px;color:#94a3b8">\u00B7 ${esc(t)}</div>`).join('') + '</div>' : '')}
        ${secD('Languages', p.hasLang ? langHTML(d.langs) : '')}
        ${secD('Interests', p.hasHobbies ? '<div style="font-size:8px;color:#94a3b8">' + esc(d.extras.hobbies) + '</div>' : '')}
      </div>
      <div style="flex:1;padding:20px 16px;background:#fff;min-height:100%">
        ${secL('Summary', d.summary ? '<div style="font-size:8.5px;color:#555;line-height:1.65">' + esc(d.summary) + '</div>' : '')}
        ${secL('Work Experience', p.hasExp ? expHTML(d.exps) : '')}
        ${secL('Education', p.hasEdu ? eduHTML(d.edus) : '')}
        ${secL('Projects', p.hasProj ? projHTML(d.projs) : '')}
        ${secL('Certifications', p.hasCert ? certHTML(d.certs) : '')}
        ${secL('Awards', p.hasAwards ? '<div style="font-size:8.5px;color:#555">' + descToHTML(d.extras.awards) + '</div>' : '')}
        ${customSectionsHTML(d, secL)}
        ${secL('References', p.hasRef ? refHTML(d.refs) : '')}
        ${watermark}
      </div>
    </div>`;
  }

  // ═══════════════════════════════════════════════════════════
  // TEMPLATE 6: STONE (warm, earthy)
  // ═══════════════════════════════════════════════════════════
  function stone(d, norms, ac) {
    const p = getProps(d, norms);
    ac = ac || '#78716c';
    const sec = (label, content) => content ? `<div style="margin-bottom:12px"><div style="font-size:7.5px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:#44403c;padding-bottom:3px;border-bottom:2px solid ${ac};margin-bottom:7px">${label}</div>${content}</div>` : '';

    return `<div style="font-family:'DM Sans',sans-serif;font-size:8.5px;line-height:1.5;color:#292524;min-height:100%;padding:20px;background:#fffdf7">
      <div style="display:flex;align-items:flex-start;margin-bottom:14px;padding-bottom:12px;border-top:3px solid ${ac};padding-top:8px">
        ${photoHTML(d, 54, '4px', 'margin-right:12px;')}
        <div style="flex:1">
          <div style="font-family:'Instrument Serif',Georgia,serif;font-size:19px;font-weight:700;margin-bottom:2px;line-height:1.1;font-style:italic">${p.name}</div>
          <div style="font-size:9px;color:${ac};margin-bottom:7px">${p.title}</div>
          <div style="display:flex;flex-wrap:wrap;gap:10px;font-size:8px;color:#999">${p.contact.map(c => `<span>${c}</span>`).join('')}</div>
        </div>
      </div>
      ${sec('Summary', d.summary ? '<div style="font-size:8.5px;color:#555;line-height:1.65">' + esc(d.summary) + '</div>' : '')}
      ${sec('Personal', p.personal.length ? '<div style="display:flex;flex-wrap:wrap;gap:3px 14px">' + p.personal.map(pp => `<span style="font-size:8.5px">${pp}</span>`).join('') + '</div>' : '')}
      ${sec('Work Experience', p.hasExp ? expHTML(d.exps) : '')}
      ${sec('Education', p.hasEdu ? eduHTML(d.edus) : '')}
      ${sec('Skills', (p.allSkills.length || p.toolSkills.length) ? pillsHTML([...p.allSkills, ...p.toolSkills], '#fef3c7', '#92400e') : '')}
      ${sec('Languages', p.hasLang ? langHTML(d.langs) : '')}
      ${sec('Projects', p.hasProj ? projHTML(d.projs) : '')}
      ${sec('Certifications', p.hasCert ? certHTML(d.certs) : '')}
      ${customSectionsHTML(d, sec)}
      ${sec('References', p.hasRef ? refHTML(d.refs) : '')}
      ${watermark}
    </div>`;
  }

  // ═══════════════════════════════════════════════════════════
  // TEMPLATE 7: LAGOS CORPORATE (ATS-optimized, Nigerian banking)
  // ═══════════════════════════════════════════════════════════
  function lagos(d, norms, ac) {
    const p = getProps(d, norms);
    const navy = '#0A1628'; const blue = '#007AFF'; const gold = '#F5A623';
    const sec = (label, content) => content ? `<div style="margin-bottom:11px"><div style="font-size:7.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.7px;color:${navy};padding-bottom:3px;margin-bottom:6px;display:flex;align-items:center;gap:6px"><span style="flex:1;height:1px;background:${navy}33"></span>${label}<span style="flex:1;height:1px;background:${navy}33"></span></div>${content}</div>` : '';

    return `<div style="font-family:'DM Sans',sans-serif;font-size:8.5px;line-height:1.5;color:#111;min-height:100%">
      <div style="background:linear-gradient(135deg,${navy},#0d2040);color:#fff;padding:20px 22px;position:relative;overflow:hidden">
        <div style="position:absolute;top:-20px;right:-20px;width:120px;height:120px;border-radius:50%;background:rgba(245,166,35,0.12)"></div>
        <div style="display:flex;align-items:center;gap:14px;position:relative;z-index:1">
          ${photoHTML(d, 62, '50%', 'border:2px solid ' + gold + ';flex-shrink:0;')}
          <div>
            <div style="font-family:'Instrument Serif',Georgia,serif;font-size:20px;font-weight:700;margin-bottom:2px;line-height:1.1;font-style:italic">${p.name}</div>
            <div style="font-size:9px;color:${gold};font-weight:600;margin-bottom:8px;letter-spacing:0.3px">${p.title}</div>
            <div style="display:flex;flex-wrap:wrap;gap:10px;font-size:8px;color:rgba(255,255,255,0.75)">${p.contact.map(c => `<span>${c}</span>`).join('')}</div>
          </div>
        </div>
      </div>
      <div style="display:flex;min-height:100%">
        <div style="flex:0 0 33%;background:#EFF6FF;padding:16px 14px;border-right:1px solid #DBEAFE">
          ${sec('Personal', p.personal.length ? '<div>' + p.personal.map(pp => `<div style="font-size:8px;margin-bottom:3px;color:#333">${pp}</div>`).join('') + '</div>' : '')}
          ${p.hasNysc ? sec('NYSC', '<div>' + p.nyscInfo.map(i => `<div style="font-size:8px;margin-bottom:2px;color:#333">${i}</div>`).join('') + '</div>') : ''}
          ${sec('Skills', p.allSkills.length ? pillsHTML(p.allSkills, '#DBEAFE', navy) : '')}
          ${sec('Tools', p.toolSkills.length ? '<div>' + p.toolSkills.map(t => `<div style="font-size:8px;margin-bottom:2px;color:#555">\u00B7 ${esc(t)}</div>`).join('') + '</div>' : '')}
          ${sec('Languages', p.hasLang ? langHTML(d.langs) : '')}
          ${sec('Interests', p.hasHobbies ? '<div style="font-size:8px;color:#555">' + esc(d.extras.hobbies) + '</div>' : '')}
        </div>
        <div style="flex:1;padding:16px 18px;background:#fff">
          ${sec('Career Objective', d.summary ? '<div style="font-size:8.5px;color:#444;line-height:1.65">' + esc(d.summary) + '</div>' : '')}
          ${sec('Work Experience', p.hasExp ? expHTML(d.exps) : '')}
          ${sec('Education', p.hasEdu ? eduHTML(d.edus) : '')}
          ${sec('Projects', p.hasProj ? projHTML(d.projs) : '')}
          ${sec('Certifications', p.hasCert ? certHTML(d.certs) : '')}
          ${sec('Awards', p.hasAwards ? '<div style="font-size:8.5px;color:#444">' + descToHTML(d.extras.awards) + '</div>' : '')}
          ${customSectionsHTML(d, sec)}
          ${sec('References', p.hasRef ? refHTML(d.refs) : '')}
          ${watermark}
        </div>
      </div>
    </div>`;
  }

  // ═══════════════════════════════════════════════════════════
  // TEMPLATE 8: CAPE TOWN MODERN (clean, SA format)
  // ═══════════════════════════════════════════════════════════
  function cape(d, norms, ac) {
    const p = getProps(d, norms);
    const blue = ac || '#007AFF';
    const sec = (label, content) => content ? `<div style="margin-bottom:12px"><div style="font-size:8px;font-weight:800;text-transform:uppercase;letter-spacing:1.2px;color:${blue};margin-bottom:7px;padding-bottom:4px;border-bottom:2px solid #cce4ff">${label}</div>${content}</div>` : '';

    return `<div style="font-family:'DM Sans',sans-serif;font-size:8.5px;line-height:1.55;color:#111;min-height:100%;padding:24px;background:#fff">
      <div style="text-align:center;margin-bottom:18px;padding-bottom:16px;border-bottom:3px solid ${blue}">
        ${d.showPhoto && d.photo ? `<img style="width:64px;height:64px;border-radius:50%;object-fit:cover;border:3px solid ${blue};display:block;margin:0 auto 10px" src="${d.photo}" alt="">` : ''}
        <div style="font-family:'Instrument Serif',Georgia,serif;font-size:24px;font-weight:700;letter-spacing:-0.5px;margin-bottom:3px;color:#111;font-style:italic">${p.name}</div>
        <div style="font-size:10px;color:${blue};font-weight:600;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:8px">${p.title}</div>
        <div style="display:flex;justify-content:center;flex-wrap:wrap;gap:12px;font-size:8.5px;color:#888">${p.contact.map(c => `<span>${c}</span>`).join('')}</div>
      </div>
      ${d.summary ? `<div style="background:#E8F2FF;border-left:3px solid ${blue};padding:10px 14px;border-radius:0 6px 6px 0;margin-bottom:14px;font-size:8.5px;color:#333;line-height:1.65">${esc(d.summary)}</div>` : ''}
      ${sec('Personal', p.personal.length ? '<div style="display:flex;flex-wrap:wrap;gap:3px 14px">' + p.personal.map(pp => `<span style="font-size:8.5px">${pp}</span>`).join('') + '</div>' : '')}
      ${sec('Work Experience', p.hasExp ? expHTML(d.exps) : '')}
      ${sec('Education', p.hasEdu ? eduHTML(d.edus) : '')}
      <div style="display:grid;grid-template-columns:1fr 180px;gap:18px">
        <div>
          ${sec('Projects', p.hasProj ? projHTML(d.projs) : '')}
          ${sec('Awards', p.hasAwards ? '<div style="font-size:8.5px;color:#444">' + descToHTML(d.extras.awards) + '</div>' : '')}
        </div>
        <div>
          ${sec('Skills', p.allSkills.length ? '<div style="display:flex;flex-direction:column;gap:4px">' + p.allSkills.map(s => `<div style="font-size:8px;background:#f1f5f9;border-radius:4px;padding:2px 6px;color:#374151">${esc(s)}</div>`).join('') + '</div>' : '')}
          ${sec('Tools', p.toolSkills.length ? '<div>' + p.toolSkills.map(t => `<div style="font-size:8px;margin-bottom:2px;color:#555">\u00B7 ${esc(t)}</div>`).join('') + '</div>' : '')}
          ${sec('Languages', p.hasLang ? langHTML(d.langs) : '')}
          ${sec('Certifications', p.hasCert ? certHTML(d.certs) : '')}
        </div>
      </div>
      ${customSectionsHTML(d, sec)}
      ${sec('References', p.hasRef ? '<div style="display:flex;flex-wrap:wrap;gap:12px">' + d.refs.filter(r => r.n).map(r => `<div style="font-size:8.5px;flex:0 0 45%"><div style="font-weight:700">${esc(r.n)}</div>${r.t ? '<div style="color:#777">' + esc(r.t) + (r.org ? ' \u00B7 ' + esc(r.org) : '') + '</div>' : ''}<div style="color:#bbb;font-size:8px">${[r.e, r.p].filter(Boolean).join(' \u00B7 ')}</div></div>`).join('') + '</div>' : '')}
      ${watermark}
    </div>`;
  }

  // ═══════════════════════════════════════════════════════════
  // TEMPLATE 9: NAIROBI EXECUTIVE (East African, bold dividers)
  // ═══════════════════════════════════════════════════════════
  function nairobi(d, norms, ac) {
    const p = getProps(d, norms);
    const teal = '#0d7377';
    const sec = (label, content) => content ? `<div style="margin-bottom:12px"><div style="display:flex;align-items:center;gap:7px;margin-bottom:6px"><span style="width:3px;height:14px;background:${teal};border-radius:2px;flex-shrink:0"></span><span style="font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:${teal}">${label}</span></div>${content}</div>` : '';

    return `<div style="font-family:'DM Sans',sans-serif;font-size:8.5px;line-height:1.5;color:#1a1a1a;min-height:100%;padding:22px">
      <div style="display:flex;gap:14px;margin-bottom:18px;padding-bottom:14px;border-bottom:2px solid ${teal};align-items:flex-start">
        ${photoHTML(d, 62, '50%', 'border:2px solid ' + teal + ';flex-shrink:0;')}
        <div style="flex:1">
          <div style="font-family:'Instrument Serif',Georgia,serif;font-size:21px;font-weight:700;margin-bottom:2px;line-height:1.1;font-style:italic">${p.name}</div>
          <div style="font-size:9px;color:${teal};font-weight:600;text-transform:uppercase;letter-spacing:1px;margin-bottom:7px">${p.title}</div>
          <div style="display:flex;flex-wrap:wrap;gap:3px 14px">${p.contact.map(c => `<span style="font-size:8px;color:#666">${c}</span>`).join('')}</div>
        </div>
        ${p.allSkills.length ? `<div style="flex:0 0 160px;background:#EFF6FF;border-radius:8px;padding:10px"><div style="font-size:7.5px;font-weight:700;color:${teal};text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px">Key Skills</div>${pillsHTML(p.allSkills.slice(0,8), teal, '#fff')}</div>` : ''}
      </div>
      ${sec('Professional Summary', d.summary ? '<div style="font-size:8.5px;color:#444;line-height:1.65">' + esc(d.summary) + '</div>' : '')}
      ${sec('Personal', p.personal.length ? '<div style="display:flex;flex-wrap:wrap;gap:3px 14px">' + p.personal.map(pp => `<span style="font-size:8.5px">${pp}</span>`).join('') + '</div>' : '')}
      ${sec('Work Experience', p.hasExp ? expHTML(d.exps) : '')}
      ${sec('Education', p.hasEdu ? eduHTML(d.edus) : '')}
      <div style="display:flex;gap:16px">
        <div style="flex:1">
          ${sec('Tools & Software', p.toolSkills.length ? pillsHTML(p.toolSkills, '#f0f9ff', '#0369a1') : '')}
          ${sec('Languages', p.hasLang ? langHTML(d.langs) : '')}
        </div>
        <div style="flex:1">
          ${sec('Certifications', p.hasCert ? certHTML(d.certs) : '')}
          ${sec('Projects', p.hasProj ? projHTML(d.projs) : '')}
        </div>
      </div>
      ${customSectionsHTML(d, sec)}
      ${sec('References', p.hasRef ? '<div style="display:flex;flex-wrap:wrap;gap:12px">' + d.refs.filter(r => r.n).map(r => `<div style="font-size:8.5px;flex:0 0 45%"><div style="font-weight:700">${esc(r.n)}</div>${r.t ? '<div style="color:#777">' + esc(r.t) + (r.org ? ' \u00B7 ' + esc(r.org) : '') + '</div>' : ''}<div style="color:#bbb;font-size:8px">${[r.e, r.p].filter(Boolean).join(' \u00B7 ')}</div></div>`).join('') + '</div>' : '')}
      ${watermark}
    </div>`;
  }

  // ═══════════════════════════════════════════════════════════
  // TEMPLATE 10: ACCRA GRADUATE (entry-level, skills-first)
  // ═══════════════════════════════════════════════════════════
  function accra(d, norms, ac) {
    const p = getProps(d, norms);
    const gold = '#F5A623'; const amber = '#b45309';
    const sec = (label, content) => content ? `<div style="margin-bottom:11px"><div style="font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:${amber};margin-bottom:6px;padding-bottom:3px;border-bottom:1.5px solid ${amber}44">${label}</div>${content}</div>` : '';

    return `<div style="font-family:'DM Sans',sans-serif;font-size:8.5px;line-height:1.5;color:#1c1007;min-height:100%">
      <div style="background:linear-gradient(135deg,#78350f,${amber},#d97706);padding:20px 22px;color:#fff;position:relative;overflow:hidden">
        <div style="display:flex;align-items:center;gap:14px;position:relative">
          ${photoHTML(d, 62, '4px', 'border:2px solid rgba(255,255,255,0.4);flex-shrink:0;')}
          <div>
            <div style="font-family:'Instrument Serif',Georgia,serif;font-size:20px;font-weight:700;margin-bottom:2px;line-height:1.1;font-style:italic">${p.name}</div>
            <div style="font-size:9px;color:rgba(255,255,255,0.85);margin-bottom:7px;font-weight:500">${p.title}</div>
            <div style="display:flex;flex-wrap:wrap;gap:10px;font-size:8px;color:rgba(255,255,255,0.7)">${p.contact.map(c => `<span>${c}</span>`).join('')}</div>
          </div>
        </div>
      </div>
      <div style="display:flex;min-height:100%">
        <div style="flex:0 0 35%;background:#fffbeb;padding:16px 14px;border-right:1px solid #fde68a">
          ${sec('Personal', p.personal.length ? '<div>' + p.personal.map(pp => `<div style="font-size:8px;margin-bottom:3px">${pp}</div>`).join('') + '</div>' : '')}
          ${sec('Skills', p.allSkills.length ? pillsHTML(p.allSkills, '#fef3c7', amber) : '')}
          ${sec('Tools', p.toolSkills.length ? '<div>' + p.toolSkills.map(t => `<div style="font-size:8px;margin-bottom:2px;color:#78350f">\u00B7 ${esc(t)}</div>`).join('') + '</div>' : '')}
          ${sec('Languages', p.hasLang ? langHTML(d.langs) : '')}
          ${sec('Interests', p.hasHobbies ? '<div style="font-size:8px;color:#78350f">' + esc(d.extras.hobbies) + '</div>' : '')}
        </div>
        <div style="flex:1;padding:16px 18px;background:#fff">
          ${sec('About Me', d.summary ? '<div style="font-size:8.5px;color:#44403c;line-height:1.65">' + esc(d.summary) + '</div>' : '')}
          ${sec('Education', p.hasEdu ? eduHTML(d.edus) : '')}
          ${d.nsYear ? sec('National Service', '<div style="font-size:8.5px">' + esc(d.nsYear) + (d.nsOrg ? ' \u2014 ' + esc(d.nsOrg) : '') + '</div>') : ''}
          ${sec('Work Experience', p.hasExp ? expHTML(d.exps) : '')}
          ${sec('Volunteering', p.hasVolunteer ? '<div style="font-size:8.5px;color:#44403c">' + descToHTML(d.extras.volunteer) + '</div>' : '')}
          ${sec('Projects', p.hasProj ? projHTML(d.projs) : '')}
          ${sec('Certifications', p.hasCert ? certHTML(d.certs) : '')}
          ${sec('Awards', p.hasAwards ? '<div style="font-size:8.5px;color:#44403c">' + descToHTML(d.extras.awards) + '</div>' : '')}
          ${customSectionsHTML(d, sec)}
          ${sec('References', p.hasRef ? refHTML(d.refs) : '')}
          ${watermark}
        </div>
      </div>
    </div>`;
  }

  // ═══════════════════════════════════════════════════════════
  // TEMPLATE 11: CAIRO BILINGUAL (photo, formal)
  // ═══════════════════════════════════════════════════════════
  function cairo(d, norms, ac) {
    const p = getProps(d, norms);
    const navy = '#0A1628'; const blue = '#007AFF';
    const sec = (label, content) => content ? `<div style="margin-bottom:11px"><div style="font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:0.6px;color:${navy};margin-bottom:5px;padding-bottom:3px;border-bottom:2px solid ${blue}">${label}</div>${content}</div>` : '';

    return `<div style="font-family:'DM Sans',sans-serif;font-size:8.5px;line-height:1.5;color:#111;min-height:100%">
      <div style="background:${navy};color:#fff;padding:18px 22px">
        <div style="display:flex;align-items:center;gap:16px">
          ${photoHTML(d, 70, '4px', 'border:2px solid ' + blue + ';flex-shrink:0;')}
          <div style="flex:1">
            <div style="font-family:'Instrument Serif',Georgia,serif;font-size:21px;font-weight:700;margin-bottom:3px;font-style:italic">${p.name}</div>
            <div style="font-size:9px;color:${blue};font-weight:600;margin-bottom:6px">${p.title}</div>
            <div style="display:flex;flex-wrap:wrap;gap:8px;font-size:7.5px;color:rgba(255,255,255,0.65)">${p.contact.map(c => `<span>${c}</span>`).join('')}</div>
          </div>
        </div>
      </div>
      <div style="padding:18px 22px">
        ${sec('Professional Summary', d.summary ? '<div style="font-size:8.5px;color:#444;line-height:1.65">' + esc(d.summary) + '</div>' : '')}
        ${sec('Personal Information', p.personal.length ? '<div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 16px">' + p.personal.map(pp => `<div style="font-size:8.5px">${pp}</div>`).join('') + '</div>' : '')}
        ${sec('Work Experience', p.hasExp ? expHTML(d.exps) : '')}
        ${sec('Education', p.hasEdu ? eduHTML(d.edus) : '')}
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
          <div>
            ${sec('Skills', p.allSkills.length ? pillsHTML(p.allSkills, '#E8F2FF', navy) : '')}
            ${sec('Tools', p.toolSkills.length ? '<div>' + p.toolSkills.map(t => `<div style="font-size:8px;margin-bottom:2px">\u00B7 ${esc(t)}</div>`).join('') + '</div>' : '')}
          </div>
          <div>
            ${sec('Languages', p.hasLang ? langHTML(d.langs) : '')}
            ${sec('Certifications', p.hasCert ? certHTML(d.certs) : '')}
          </div>
        </div>
        ${sec('Projects', p.hasProj ? projHTML(d.projs) : '')}
        ${customSectionsHTML(d, sec)}
        ${sec('References', p.hasRef ? refHTML(d.refs) : '')}
        ${watermark}
      </div>
    </div>`;
  }

  // ═══════════════════════════════════════════════════════════
  // TEMPLATE 12: ABUJA GOVERNMENT (formal, dense, austere)
  // ═══════════════════════════════════════════════════════════
  function abuja(d, norms, ac) {
    const p = getProps(d, norms);
    const sec = (label, content) => content ? `<div style="margin-bottom:10px"><div style="font-size:8.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.3px;color:#1e293b;margin-bottom:5px;padding:3px 0;border-bottom:1.5px solid #333;border-top:1.5px solid #333">${label}</div>${content}</div>` : '';

    return `<div style="font-family:'DM Sans',sans-serif;font-size:8.5px;line-height:1.6;color:#111;min-height:100%;padding:20px;background:#fff">
      <div style="text-align:center;margin-bottom:14px;padding-bottom:10px;border-bottom:2px double #333">
        <div style="font-size:20px;font-weight:800;text-transform:uppercase;letter-spacing:1px;margin-bottom:2px">${p.name}</div>
        <div style="font-size:10px;color:#555;margin-bottom:6px">${p.title}</div>
        <div style="font-size:8px;color:#666">${p.contact.join(' | ')}</div>
      </div>
      ${sec('Career Objective', d.summary ? '<div style="font-size:8.5px;color:#333;line-height:1.7">' + esc(d.summary) + '</div>' : '')}
      ${sec('Personal Information', p.personal.length ? '<table style="width:100%;font-size:8.5px;border-collapse:collapse">' + p.personal.map(pp => `<tr><td style="padding:2px 8px 2px 0;color:#555;width:40%">${pp.split(':')[0] || ''}</td><td style="padding:2px 0">${pp.includes(':') ? pp.split(':').slice(1).join(':').trim() : pp}</td></tr>`).join('') + '</table>' : '')}
      ${p.hasNysc ? sec('NYSC Service', '<table style="width:100%;font-size:8.5px;border-collapse:collapse">' + p.nyscInfo.map(i => `<tr><td style="padding:2px 0">${i}</td></tr>`).join('') + '</table>') : ''}
      ${sec('Work Experience', p.hasExp ? expHTML(d.exps) : '')}
      ${sec('Educational Qualifications', p.hasEdu ? eduHTML(d.edus) : '')}
      ${sec('Skills', (p.allSkills.length || p.toolSkills.length) ? '<div style="font-size:8.5px">' + [...p.allSkills, ...p.toolSkills].map(s => esc(s)).join(', ') + '</div>' : '')}
      ${sec('Languages', p.hasLang ? langHTML(d.langs) : '')}
      ${sec('Professional Memberships', p.hasMemberships ? '<div style="font-size:8.5px">' + esc(d.extras.memberships) + '</div>' : '')}
      ${sec('Certifications', p.hasCert ? certHTML(d.certs) : '')}
      ${sec('Awards & Honours', p.hasAwards ? '<div style="font-size:8.5px">' + descToHTML(d.extras.awards) + '</div>' : '')}
      ${customSectionsHTML(d, sec)}
      ${sec('References', p.hasRef ? refHTML(d.refs) : '')}
      <div style="margin-top:16px;padding-top:10px;border-top:1px solid #999;font-size:8px;color:#555">
        <div style="font-weight:700;margin-bottom:4px">DECLARATION</div>
        <div>I hereby declare that the information contained in this CV is true and correct to the best of my knowledge.</div>
        <div style="margin-top:14px;display:flex;justify-content:space-between">
          <div>Signature: _______________________</div>
          <div>Date: _______________________</div>
        </div>
      </div>
      ${watermark}
    </div>`;
  }

  // ═══════════════════════════════════════════════════════════
  // TEMPLATE 13: KIGALI TECH (developer-focused)
  // ═══════════════════════════════════════════════════════════
  function kigali(d, norms, ac) {
    const p = getProps(d, norms);
    const blue = '#007AFF'; const purple = '#6366f1';
    const sec = (label, content) => content ? `<div style="margin-bottom:11px"><div style="font-size:7.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:${blue};margin-bottom:5px;padding-bottom:3px;border-bottom:1px solid #E8F2FF">${label}</div>${content}</div>` : '';

    return `<div style="font-family:'DM Sans',sans-serif;font-size:8.5px;line-height:1.5;color:#111;min-height:100%;display:flex">
      <div style="flex:0 0 38%;background:linear-gradient(180deg,#0A1628,#111D30);color:#e2e8f0;padding:20px 16px;display:flex;flex-direction:column;min-height:100%">
        ${photoHTML(d, 60, '8px', 'margin-bottom:12px;border:2px solid ' + blue + ';')}
        <div style="font-family:'JetBrains Mono',monospace;font-size:16px;font-weight:700;margin-bottom:2px;color:#fff">${p.name}</div>
        <div style="font-family:'JetBrains Mono',monospace;font-size:8px;color:${blue};margin-bottom:12px">${p.title}</div>
        <div style="margin-bottom:12px">${p.contact.map(c => `<div style="font-size:7.5px;margin-bottom:3px;color:#94a3b8;font-family:'JetBrains Mono',monospace">${c}</div>`).join('')}</div>
        ${d.web ? `<div style="margin-bottom:12px"><div style="font-size:7px;font-weight:700;color:#64748b;text-transform:uppercase;margin-bottom:4px">Portfolio</div><div style="font-size:8px;color:${blue}">${esc(d.web)}</div></div>` : ''}
        ${d.linkedin ? `<div style="margin-bottom:12px"><div style="font-size:7px;font-weight:700;color:#64748b;text-transform:uppercase;margin-bottom:4px">LinkedIn</div><div style="font-size:8px;color:${blue}">${esc(d.linkedin)}</div></div>` : ''}
        <div style="margin-bottom:12px"><div style="font-size:7px;font-weight:700;color:#64748b;text-transform:uppercase;margin-bottom:6px">Tech Stack</div>
          ${p.techSkills.length ? pillsHTML(p.techSkills, 'rgba(99,102,241,0.2)', '#a5b4fc') : ''}
        </div>
        <div style="margin-bottom:12px"><div style="font-size:7px;font-weight:700;color:#64748b;text-transform:uppercase;margin-bottom:6px">Tools</div>
          ${p.toolSkills.length ? '<div>' + p.toolSkills.map(t => `<div style="font-family:'JetBrains Mono',monospace;font-size:7.5px;margin-bottom:2px;color:#94a3b8">\u25B8 ${esc(t)}</div>`).join('') + '</div>' : ''}
        </div>
        ${p.hasLang ? `<div style="margin-bottom:12px"><div style="font-size:7px;font-weight:700;color:#64748b;text-transform:uppercase;margin-bottom:4px">Languages</div>${langHTML(d.langs)}</div>` : ''}
      </div>
      <div style="flex:1;padding:20px 18px;background:#fff">
        ${sec('About', d.summary ? '<div style="font-size:8.5px;color:#444;line-height:1.65">' + esc(d.summary) + '</div>' : '')}
        ${sec('Experience', p.hasExp ? expHTML(d.exps) : '')}
        ${sec('Projects', p.hasProj ? d.projs.filter(pp => pp.n).map(pp => `<div style="margin-bottom:8px;padding:6px 8px;background:#f8fafc;border-radius:6px;border:1px solid #e2e8f0"><div style="font-weight:700;font-size:9.5px">${esc(pp.n)}${pp.url ? '<span style="font-weight:400;color:' + blue + ';margin-left:5px;font-size:8px">\uD83D\uDD17 ' + esc(pp.url) + '</span>' : ''}</div>${pp.tech ? '<div style="margin-top:2px">' + pp.tech.split(',').map(t => `<span style="display:inline-block;padding:1px 5px;border-radius:3px;font-size:7px;font-weight:600;margin:1px;background:#E8F2FF;color:${blue};font-family:\'JetBrains Mono\',monospace">${esc(t.trim())}</span>`).join('') + '</div>' : ''}${pp.d ? '<div style="font-size:8px;color:#666;margin-top:2px">' + esc(pp.d) + '</div>' : ''}</div>`).join('') : '')}
        ${sec('Education', p.hasEdu ? eduHTML(d.edus) : '')}
        ${sec('Certifications', p.hasCert ? certHTML(d.certs) : '')}
        ${customSectionsHTML(d, sec)}
        ${sec('References', p.hasRef ? refHTML(d.refs) : '')}
        ${watermark}
      </div>
    </div>`;
  }

  // ═══════════════════════════════════════════════════════════
  // TEMPLATE 14: PAN-AFRICAN MINIMAL (ATS-guaranteed, pure text)
  // ═══════════════════════════════════════════════════════════
  function panaf(d, norms, ac) {
    const p = getProps(d, norms);
    const sec = (label, content) => content ? `<div style="margin-bottom:10px"><div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#000;margin-bottom:4px;padding-bottom:3px;border-bottom:1px solid #000">${label}</div>${content}</div>` : '';

    return `<div style="font-family:'DM Sans',sans-serif;font-size:9px;line-height:1.6;color:#000;min-height:100%;padding:22px;background:#fff">
      <div style="margin-bottom:14px;padding-bottom:10px;border-bottom:2px solid #000">
        <div style="font-size:20px;font-weight:800;margin-bottom:2px">${p.name}</div>
        <div style="font-size:10px;color:#333;margin-bottom:6px">${p.title}</div>
        <div style="font-size:8.5px;color:#555">${p.contact.join(' | ')}</div>
      </div>
      ${sec('Professional Summary', d.summary ? '<div style="color:#222">' + esc(d.summary) + '</div>' : '')}
      ${sec('Personal Details', p.personal.length ? '<div>' + p.personal.join(' | ') + '</div>' : '')}
      ${p.hasNysc ? sec('NYSC', '<div>' + p.nyscInfo.join(' | ') + '</div>') : ''}
      ${sec('Work Experience', p.hasExp ? d.exps.filter(e => e.t || e.c).map(e => `<div style="margin-bottom:8px"><div style="font-weight:700;font-size:9.5px">${esc(e.t)}</div><div style="font-size:9px;color:#333">${esc(e.c)}${e.l ? ', ' + esc(e.l) : ''} | ${fmtMonth(e.s)}${e.cur ? ' \u2013 Present' : e.e ? ' \u2013 ' + fmtMonth(e.e) : ''}</div>${e.d ? '<div style="margin-top:2px">' + descToHTML(e.d) + '</div>' : ''}</div>`).join('') : '')}
      ${sec('Education', p.hasEdu ? d.edus.filter(e => e.deg || e.sch).map(e => `<div style="margin-bottom:6px"><div style="font-weight:700">${esc(e.deg)}</div><div style="color:#333">${esc(e.sch)}${e.loc ? ', ' + esc(e.loc) : ''} | ${e.y1}${e.y2 ? '\u2013' + e.y2 : ''}${e.g ? ' | ' + esc(e.g) : ''}</div></div>`).join('') : '')}
      ${sec('Skills', (p.allSkills.length || p.toolSkills.length) ? '<div>' + [...p.allSkills, ...p.toolSkills].map(s => esc(s)).join(', ') + '</div>' : '')}
      ${sec('Languages', p.hasLang ? d.langs.filter(l => l.l).map(l => esc(l.l) + ' (' + l.lv + ')').join(', ') : '')}
      ${sec('Certifications', p.hasCert ? certHTML(d.certs) : '')}
      ${sec('Professional Memberships', p.hasMemberships ? '<div>' + esc(d.extras.memberships) + '</div>' : '')}
      ${sec('Awards', p.hasAwards ? '<div>' + descToHTML(d.extras.awards) + '</div>' : '')}
      ${sec('Volunteering', p.hasVolunteer ? '<div>' + descToHTML(d.extras.volunteer) + '</div>' : '')}
      ${customSectionsHTML(d, sec)}
      ${sec('References', p.hasRef ? d.refs.filter(r => r.n).map(r => `<div style="margin-bottom:5px"><span style="font-weight:700">${esc(r.n)}</span>${r.t ? ', ' + esc(r.t) : ''}${r.org ? ' (' + esc(r.org) + ')' : ''} | ${[r.e, r.p].filter(Boolean).join(' | ')}</div>`).join('') : '')}
      ${watermark}
    </div>`;
  }

  // ═══════════════════════════════════════════════════════════
  // TEMPLATE 15: FRANCOPHONE STANDARD (French CV format)
  // ═══════════════════════════════════════════════════════════
  function franco(d, norms, ac) {
    const p = getProps(d, norms);
    const blue = '#0063D1'; const navy = '#0A1628';
    const sec = (label, content) => content ? `<div style="margin-bottom:11px"><div style="font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:${blue};margin-bottom:5px;padding-bottom:3px;border-bottom:1.5px solid ${blue}">${label}</div>${content}</div>` : '';

    return `<div style="font-family:'DM Sans',sans-serif;font-size:8.5px;line-height:1.5;color:#111;min-height:100%">
      <div style="background:${navy};color:#fff;padding:18px 22px;display:flex;align-items:center;gap:16px">
        ${photoHTML(d, 68, '4px', 'border:2px solid ' + blue + ';flex-shrink:0;')}
        <div>
          <div style="font-family:'Instrument Serif',Georgia,serif;font-size:20px;font-weight:700;margin-bottom:3px;font-style:italic">${p.name}</div>
          <div style="font-size:9px;color:${blue};margin-bottom:6px">${p.title}</div>
          <div style="font-size:7.5px;color:rgba(255,255,255,0.65)">${p.contact.join(' | ')}</div>
        </div>
      </div>
      <div style="display:flex;min-height:100%">
        <div style="flex:0 0 35%;background:#f8fafc;padding:16px 14px;border-right:1px solid #e2e8f0">
          ${sec('\u00C9tat Civil', p.personal.length ? '<div>' + p.personal.map(pp => `<div style="font-size:8px;margin-bottom:3px">${pp}</div>`).join('') + '</div>' : '')}
          ${sec('Comp\u00E9tences', p.allSkills.length ? pillsHTML(p.allSkills, '#E8F2FF', blue) : '')}
          ${sec('Outils', p.toolSkills.length ? '<div>' + p.toolSkills.map(t => `<div style="font-size:8px;margin-bottom:2px">\u00B7 ${esc(t)}</div>`).join('') + '</div>' : '')}
          ${sec('Langues', p.hasLang ? langHTML(d.langs) : '')}
          ${sec('Loisirs', p.hasHobbies ? '<div style="font-size:8px">' + esc(d.extras.hobbies) + '</div>' : '')}
        </div>
        <div style="flex:1;padding:16px 18px;background:#fff">
          ${sec('Profil', d.summary ? '<div style="font-size:8.5px;color:#444;line-height:1.65">' + esc(d.summary) + '</div>' : '')}
          ${sec('Exp\u00E9rience Professionnelle', p.hasExp ? expHTML(d.exps) : '')}
          ${sec('Formation', p.hasEdu ? eduHTML(d.edus) : '')}
          ${sec('Projets', p.hasProj ? projHTML(d.projs) : '')}
          ${sec('Certifications', p.hasCert ? certHTML(d.certs) : '')}
          ${sec('R\u00E9f\u00E9rences', p.hasRef ? refHTML(d.refs) : '')}
          ${watermark}
        </div>
      </div>
    </div>`;
  }

  // ═══════════════════════════════════════════════════════════
  // TEMPLATE 16: DIASPORA / JAPA (international with equivalencies)
  // ═══════════════════════════════════════════════════════════
  function diaspora(d, norms, ac) {
    const p = getProps(d, norms);
    const blue = '#007AFF'; const purple = '#6366f1';
    const sec = (label, content) => content ? `<div style="margin-bottom:11px"><div style="font-size:7.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:${blue};margin-bottom:6px;display:flex;align-items:center;gap:6px"><span style="width:12px;height:2px;background:${blue};border-radius:1px"></span>${label}</div>${content}</div>` : '';

    // Equivalency notes
    const equivMap = {
      'WAEC / SSCE': 'Equivalent to UK GCSEs / US High School Diploma',
      'WASSCE': 'Equivalent to UK GCSEs / US High School Diploma',
      'NECO / SSCE': 'Equivalent to UK GCSEs / US High School Diploma',
      'KCSE': 'Equivalent to UK GCSEs / US High School Diploma',
      'Matric (Grade 12)': 'Equivalent to UK A-Levels / US High School Diploma',
      'OND (Ordinary National Diploma)': 'Equivalent to UK Foundation Degree',
      'HND (Higher National Diploma)': 'Equivalent to UK HND / Associate Degree',
      'B.Sc': 'Bachelor of Science (4-year degree)',
      'B.A': 'Bachelor of Arts (4-year degree)',
      'B.Eng': 'Bachelor of Engineering (5-year degree)',
      'MBBS / MBChB': 'Equivalent to US MD (Doctor of Medicine)',
    };

    const eduWithEquiv = d.edus.filter(e => e.deg || e.sch).map(e => {
      const equiv = equivMap[e.deg];
      return `<div style="margin-bottom:8px">
        <div class="tpl-edu-deg">${esc(e.deg || 'Qualification')}</div>
        ${equiv ? `<div style="font-size:7px;color:${purple};font-style:italic;margin-bottom:1px">${equiv}</div>` : ''}
        <div class="tpl-edu-school">${esc(e.sch)}${e.loc ? ' \u00B7 ' + esc(e.loc) : ''}</div>
        ${(e.y1 || e.y2) ? `<div class="tpl-edu-year">${e.y1}${e.y2 ? ' \u2013 ' + e.y2 : ''}${e.g ? ' \u00B7 ' + esc(e.g) : ''}</div>` : ''}
      </div>`;
    }).join('');

    return `<div style="font-family:'DM Sans',sans-serif;font-size:8.5px;line-height:1.5;color:#111;min-height:100%;padding:22px;background:#fff">
      <div style="display:flex;align-items:flex-start;gap:16px;margin-bottom:16px;padding-bottom:14px;border-bottom:2px solid ${blue}">
        ${photoHTML(d, 58, '6px', 'flex-shrink:0;border:2px solid ' + blue + ';')}
        <div style="flex:1">
          <div style="font-family:'Instrument Serif',Georgia,serif;font-size:20px;font-weight:700;margin-bottom:2px;font-style:italic">${p.name}</div>
          <div style="font-size:9px;color:${blue};font-weight:600;margin-bottom:8px">${p.title}</div>
          <div style="display:flex;flex-wrap:wrap;gap:8px;font-size:8px;color:#666">${p.contact.map(c => `<span>${c}</span>`).join('')}</div>
          ${d.linkedin ? `<div style="margin-top:4px;font-size:8px;color:${blue}">\uD83D\uDD17 ${esc(d.linkedin)}</div>` : ''}
        </div>
      </div>
      ${sec('Professional Summary', d.summary ? '<div style="font-size:8.5px;color:#444;line-height:1.65">' + esc(d.summary) + '</div>' : '')}
      ${sec('Work Experience', p.hasExp ? expHTML(d.exps) : '')}
      ${sec('Education & Qualifications', p.hasEdu ? eduWithEquiv : '')}
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
        <div>
          ${sec('Technical Skills', p.techSkills.length ? pillsHTML(p.techSkills, '#E8F2FF', blue) : '')}
          ${sec('Soft Skills', p.softSkills.length ? pillsHTML(p.softSkills, '#f3e8ff', purple) : '')}
        </div>
        <div>
          ${sec('Tools & Software', p.toolSkills.length ? '<div>' + p.toolSkills.map(t => `<div style="font-size:8px;margin-bottom:2px">\u00B7 ${esc(t)}</div>`).join('') + '</div>' : '')}
          ${sec('Languages', p.hasLang ? langHTML(d.langs) : '')}
        </div>
      </div>
      ${sec('Projects', p.hasProj ? projHTML(d.projs) : '')}
      ${sec('Certifications', p.hasCert ? certHTML(d.certs) : '')}
      ${customSectionsHTML(d, sec)}
      ${sec('References', p.hasRef ? refHTML(d.refs) : '')}
      ${watermark}
    </div>`;
  }

  // ── Public API ────────────────────────────────────────────
  return { slate, ember, phantom, indigo, noir, stone, lagos, cape, nairobi, accra, cairo, abuja, kigali, panaf, franco, diaspora };
})();
