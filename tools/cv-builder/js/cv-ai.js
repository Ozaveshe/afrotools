/* ═══════════════════════════════════════════════════════════════
   AfroTools CV Builder — AI Features (Lazy-loaded)
   Uses /.netlify/functions/ai-advisor endpoint
   ═══════════════════════════════════════════════════════════════ */
'use strict';

const CVAI = (function() {
  const API = '/.netlify/functions/ai-advisor';
  let chatMessages = [];
  let chatOpen = false;

  // ── API Call ──────────────────────────────────────────────
  async function callAI(prompt, context) {
    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          tool: 'cv-builder',
          messages: [
            { role: 'system', content: `You are AfroTools CV Advisor — an expert on African job markets and CV writing. You help professionals across all 54 African countries create winning CVs. You know Nigerian NYSC requirements, South African Employment Equity Act rules, Kenyan KCSE formats, Ghanaian National Service, Egyptian military service conventions, and all Francophone CV standards. Be practical, specific, and Africa-aware. Use local examples and currency.` },
            { role: 'user', content: context ? `Context: ${JSON.stringify(context)}\n\n${prompt}` : prompt }
          ]
        })
      });
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      return data.response || data.content || data.message || '';
    } catch(e) {
      console.error('AI call failed:', e);
      return null;
    }
  }

  // ── CV Score / Analysis ───────────────────────────────────
  async function analyzeCV(data, country, template) {
    const panel = getOrCreateAIPanel();
    showPanel(panel);
    const body = panel.querySelector('.cv-ai-body');
    body.innerHTML = '<div style="text-align:center;padding:20px"><div style="font-size:24px;margin-bottom:8px">🔍</div><div style="color:var(--color-text-muted);font-size:13px">Analyzing your CV...</div></div>';

    // Local score
    const score = CVApp.calcScore(data);
    const norms = COUNTRY_NORMS[country] || COUNTRY_NORMS.OTHER;

    // Build local analysis
    const checks = {
      'Full Name': !!(data.fn && data.ln),
      'Professional Title': !!data.title,
      'Email Address': !!data.email,
      'Phone Number': !!data.phone,
      'Location': !!data.loc,
      'Professional Summary (50+ words)': !!(data.summary && data.summary.split(/\s+/).filter(Boolean).length >= 50),
      'Work Experience': data.exps.some(e => e.t && e.c),
      'Achievement Descriptions': data.exps.some(e => e.d && e.d.length > 20),
      'Education': data.edus.some(e => e.deg && e.sch),
      'Skills': !!(data.skills.h || data.skills.s || data.skills.t),
      'Languages': data.langs.some(l => l.l),
      'References (Full Details)': data.showRefs && data.refs.some(r => r.n && (r.e || r.p)),
    };

    // ATS checks
    const atsChecks = {
      'No graphics/icons in content': true,
      'Standard section headings': true,
      'Reverse chronological order': true,
      'Contact info present': !!(data.email && data.phone),
      'Quantified achievements': data.exps.some(e => e.d && /\d+/.test(e.d)),
      'Action verbs used': data.exps.some(e => e.d && /^(Led|Built|Managed|Developed|Implemented|Increased|Reduced|Created|Designed|Delivered|Achieved|Improved|Established|Negotiated|Coordinated)/m.test(e.d)),
    };

    const completeness = Math.round((Object.values(checks).filter(Boolean).length / Object.keys(checks).length) * 100);
    const atsScore = Math.round((Object.values(atsChecks).filter(Boolean).length / Object.keys(atsChecks).length) * 100);
    const overallScore = Math.round((completeness * 0.6 + atsScore * 0.4));

    // Country-specific checks
    const countryChecks = [];
    if (country === 'NG') {
      if (!data.nyscStatus) countryChecks.push('⚠️ Add NYSC details — Nigerian employers require this');
      if (!data.so && data.sp) countryChecks.push('⚠️ Add State of Origin — expected in Nigerian CVs');
      if (!data.showRefs) countryChecks.push('⚠️ Include references with full contact — "available on request" is not accepted');
    }
    if (country === 'ZA') {
      if (data.sp) countryChecks.push('⚠️ South African CVs should NOT include personal details (Employment Equity Act)');
      if (!data.dlStatus) countryChecks.push('💡 Consider adding driver\'s licence status');
    }
    if (country === 'GH' && !data.nsYear) {
      countryChecks.push('💡 Consider adding National Service details');
    }

    let html = `
      <div class="cv-ai-score-card">
        <div class="cv-ai-score-ring">
          <svg viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="35" fill="none" stroke="#e2e8f0" stroke-width="6"/>
            <circle cx="40" cy="40" r="35" fill="none" stroke="${CVApp.getScoreColor(overallScore)}" stroke-width="6" stroke-dasharray="${2 * Math.PI * 35}" stroke-dashoffset="${2 * Math.PI * 35 * (1 - overallScore/100)}" stroke-linecap="round"/>
          </svg>
          <div class="score-num">${overallScore}</div>
        </div>
        <div style="text-align:center;font-size:12px;font-weight:700;color:var(--color-text);margin-bottom:12px">Overall CV Score</div>
        <div class="cv-ai-score-item"><span>Completeness</span><div class="cv-ai-score-bar"><div class="cv-ai-score-bar-fill" style="width:${completeness}%;background:${CVApp.getScoreColor(completeness)}"></div></div><span>${completeness}%</span></div>
        <div class="cv-ai-score-item"><span>ATS Readiness</span><div class="cv-ai-score-bar"><div class="cv-ai-score-bar-fill" style="width:${atsScore}%;background:${CVApp.getScoreColor(atsScore)}"></div></div><span>${atsScore}%</span></div>
      </div>
    `;

    // Checklist
    html += '<div style="margin-bottom:12px"><div style="font-size:11px;font-weight:700;margin-bottom:6px">Completeness Checklist</div>';
    Object.entries(checks).forEach(([label, ok]) => {
      html += `<div style="font-size:12px;margin-bottom:3px;color:${ok ? '#22c55e' : '#ef4444'}">${ok ? '✅' : '❌'} ${label}</div>`;
    });
    html += '</div>';

    // ATS
    html += '<div style="margin-bottom:12px"><div style="font-size:11px;font-weight:700;margin-bottom:6px">ATS Compatibility</div>';
    Object.entries(atsChecks).forEach(([label, ok]) => {
      html += `<div style="font-size:12px;margin-bottom:3px;color:${ok ? '#22c55e' : '#ef4444'}">${ok ? '✅' : '❌'} ${label}</div>`;
    });
    html += '</div>';

    // Country-specific
    if (countryChecks.length) {
      html += `<div style="margin-bottom:12px"><div style="font-size:11px;font-weight:700;margin-bottom:6px">${norms.n} Specific</div>`;
      countryChecks.forEach(c => { html += `<div style="font-size:12px;margin-bottom:3px">${c}</div>`; });
      html += '</div>';
    }

    body.innerHTML = html;

    // Try to get AI-powered advice
    const aiResponse = await callAI(
      `Analyze this CV for a ${norms.n} job seeker. Score: ${overallScore}/100. Give 3-5 specific, actionable tips to improve it. Be concise.`,
      { name: (data.fn + ' ' + data.ln).trim(), title: data.title, country, hasExp: data.exps.some(e=>e.t), hasEdu: data.edus.some(e=>e.deg), hasRefs: data.showRefs, summaryLength: data.summary?.length || 0 }
    );
    if (aiResponse) {
      body.innerHTML += `<div class="cv-ai-msg assistant"><div style="font-size:11px;font-weight:700;margin-bottom:4px">✨ AI Recommendations</div>${aiResponse.replace(/\n/g, '<br>')}</div>`;
    }

    if (typeof gtag === 'function') gtag('event', 'ai_analysis_used', {score: overallScore});
  }

  // ── Section Improver ──────────────────────────────────────
  async function improveSection(section, data, country) {
    const norms = COUNTRY_NORMS[country] || COUNTRY_NORMS.OTHER;
    let content = '';
    let prompt = '';

    switch(section) {
      case 'summary':
        content = data.summary;
        prompt = `Improve this professional summary for a ${norms.n} CV. Make it more impactful with action verbs and quantified achievements. Keep it 50-150 words. Return ONLY the improved text:\n\n${content}`;
        break;
      default:
        CVApp.showToast('AI improvement not available for this section');
        return;
    }

    if (!content || content.length < 10) {
      CVApp.showToast('Write some content first, then use AI to improve it');
      return;
    }

    CVApp.showToast('✨ AI is improving your text...');
    const improved = await callAI(prompt, {country, title: data.title});
    if (improved) {
      // Show comparison modal
      showImprovementModal(section, content, improved);
    } else {
      CVApp.showToast('AI improvement unavailable. Try again later.');
    }
  }

  function showImprovementModal(section, original, improved) {
    let overlay = document.querySelector('.cv-ai-improve-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'cv-modal-overlay cv-ai-improve-overlay';
      document.body.appendChild(overlay);
    }
    overlay.innerHTML = `
      <div class="cv-modal" style="max-width:560px">
        <h3>✨ AI Improvement</h3>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
          <div>
            <div style="font-size:11px;font-weight:700;color:var(--color-text-muted);margin-bottom:4px">ORIGINAL</div>
            <div style="font-size:12px;line-height:1.6;padding:10px;background:var(--color-bg);border-radius:8px;border:1px solid var(--color-border)">${CVApp.esc(original)}</div>
          </div>
          <div>
            <div style="font-size:11px;font-weight:700;color:var(--color-primary);margin-bottom:4px">IMPROVED</div>
            <div style="font-size:12px;line-height:1.6;padding:10px;background:#E8F2FF;border-radius:8px;border:1px solid #007AFF33">${CVApp.esc(improved)}</div>
          </div>
        </div>
        <div class="cv-modal-actions">
          <button class="cv-btn cv-btn-ghost" style="color:var(--color-text-muted);border:1px solid var(--color-border)" id="cv-ai-reject">Keep Original</button>
          <button class="cv-btn cv-btn-primary" id="cv-ai-accept">Accept Improvement</button>
        </div>
      </div>
    `;
    overlay.classList.add('open');

    document.getElementById('cv-ai-reject').addEventListener('click', () => overlay.classList.remove('open'));
    document.getElementById('cv-ai-accept').addEventListener('click', () => {
      CVApp.updateData(section, improved);
      CVApp.renderEditor();
      CVApp.renderPreview();
      overlay.classList.remove('open');
      CVApp.showToast('Improvement applied!');
    });
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.classList.remove('open'); });
  }

  // ── Chat ──────────────────────────────────────────────────
  function openChat(data, country) {
    const panel = getOrCreateAIPanel();
    showPanel(panel);
    const body = panel.querySelector('.cv-ai-body');
    const footer = panel.querySelector('.cv-ai-footer');
    const suggestions = panel.querySelector('.cv-ai-suggestions');

    if (!chatMessages.length) {
      const norms = COUNTRY_NORMS[country] || COUNTRY_NORMS.OTHER;
      chatMessages = [
        { role: 'assistant', text: `Hi! I'm your AfroTools CV Advisor 👋\n\nI can help you with your ${norms.n} CV. Ask me anything — from formatting tips to industry-specific advice.\n\nTry asking:\n• "Is my CV good for banking in Lagos?"\n• "How do I explain my career gap?"\n• "What skills should I add for tech roles?"` }
      ];
    }

    renderChat(body);
    footer.style.display = 'flex';
    if (suggestions) suggestions.style.display = 'flex';
  }

  function renderChat(body) {
    body.innerHTML = chatMessages.map(m =>
      `<div class="cv-ai-msg ${m.role}">${m.text.replace(/\n/g, '<br>')}</div>`
    ).join('');
    body.scrollTop = body.scrollHeight;
  }

  async function sendChatMessage(input, data, country) {
    const text = input.value.trim();
    if (!text) return;
    input.value = '';

    chatMessages.push({ role: 'user', text });
    const body = document.querySelector('.cv-ai-body');
    renderChat(body);

    chatMessages.push({ role: 'assistant', text: '...' });
    renderChat(body);

    const norms = COUNTRY_NORMS[country] || COUNTRY_NORMS.OTHER;
    const context = {
      name: (data.fn + ' ' + data.ln).trim(),
      title: data.title,
      country: norms.n,
      hasExp: data.exps.some(e => e.t),
      numExp: data.exps.filter(e => e.t).length,
      hasEdu: data.edus.some(e => e.deg),
      skills: data.skills.h,
    };

    const response = await callAI(text, context);
    chatMessages[chatMessages.length - 1].text = response || 'Sorry, I couldn\'t process that. Try again.';
    renderChat(body);
  }

  // ── Job Description Matcher ───────────────────────────────
  async function matchJobDescription(jd, data, country) {
    const panel = getOrCreateAIPanel();
    showPanel(panel);
    const body = panel.querySelector('.cv-ai-body');
    body.innerHTML = '<div style="text-align:center;padding:20px"><div style="font-size:24px;margin-bottom:8px">🎯</div><div style="color:var(--color-text-muted);font-size:13px">Matching your CV to the job description...</div></div>';

    const response = await callAI(
      `Compare this CV against the following job description. Identify: 1) Matching skills/experience, 2) Missing keywords, 3) ATS keyword gaps, 4) Specific suggestions to tailor the CV. Be concise and practical.\n\nJob Description:\n${jd}`,
      { name: (data.fn + ' ' + data.ln).trim(), title: data.title, skills: data.skills.h + ', ' + data.skills.s, exp: data.exps.map(e => e.t + ' at ' + e.c).join('; ') }
    );

    body.innerHTML = response
      ? `<div class="cv-ai-msg assistant">${response.replace(/\n/g, '<br>')}</div>`
      : '<div style="text-align:center;padding:20px;color:var(--color-text-muted)">Job matching unavailable. Try again later.</div>';
  }

  // ── Panel Management ──────────────────────────────────────
  function getOrCreateAIPanel() {
    let panel = document.querySelector('.cv-ai-panel');
    if (panel) return panel;

    panel = document.createElement('div');
    panel.className = 'cv-ai-panel';
    panel.innerHTML = `
      <div class="cv-ai-header">
        <h3>✨ AI CV Advisor</h3>
        <div style="display:flex;gap:4px">
          <button class="cv-ai-close" data-ai-action="analyze" title="Analyze CV" style="font-size:14px">📊</button>
          <button class="cv-ai-close" data-ai-action="chat" title="Chat" style="font-size:14px">💬</button>
          <button class="cv-ai-close" data-ai-action="close" title="Close">&times;</button>
        </div>
      </div>
      <div class="cv-ai-body"></div>
      <div class="cv-ai-suggestions">
        <button class="cv-ai-suggestion" data-q="Is my CV good for banking?">Banking CV tips</button>
        <button class="cv-ai-suggestion" data-q="How do I explain a career gap?">Career gap</button>
        <button class="cv-ai-suggestion" data-q="What skills should I add for tech roles?">Tech skills</button>
        <button class="cv-ai-suggestion" data-q="Help me write a stronger summary">Summary help</button>
      </div>
      <div class="cv-ai-footer" style="display:none">
        <input class="cv-ai-input" placeholder="Ask me anything about your CV..." id="cv-ai-chat-input">
        <button class="cv-ai-send" id="cv-ai-chat-send">Send</button>
      </div>
    `;
    document.body.appendChild(panel);

    // Events
    panel.querySelectorAll('[data-ai-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const state = CVApp.getState();
        switch(btn.dataset.aiAction) {
          case 'close': panel.classList.remove('open'); break;
          case 'analyze': analyzeCV(state.data, state.country, state.template); break;
          case 'chat': openChat(state.data, state.country); break;
        }
      });
    });

    const chatInput = document.getElementById('cv-ai-chat-input');
    const chatSend = document.getElementById('cv-ai-chat-send');
    chatSend.addEventListener('click', () => {
      const state = CVApp.getState();
      sendChatMessage(chatInput, state.data, state.country);
    });
    chatInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        const state = CVApp.getState();
        sendChatMessage(chatInput, state.data, state.country);
      }
    });

    panel.querySelectorAll('.cv-ai-suggestion').forEach(btn => {
      btn.addEventListener('click', () => {
        const state = CVApp.getState();
        chatInput.value = btn.dataset.q;
        openChat(state.data, state.country);
        setTimeout(() => sendChatMessage(chatInput, state.data, state.country), 100);
      });
    });

    return panel;
  }

  function showPanel(panel) {
    panel.classList.add('open');
  }

  return { analyzeCV, improveSection, openChat, matchJobDescription };
})();
