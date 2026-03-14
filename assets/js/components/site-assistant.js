/**
 * AFROTOOLS SITE ASSISTANT — Floating AI Advisor
 * Explains tools · Navigates site · Recommends features
 * Persistent bottom-right floating panel · ROYGBIV glow · AfroBot mascot
 *
 * Drop <afro-site-assistant></afro-site-assistant> once in <body> (footer injects it automatically).
 * Or embed the script and it self-injects.
 */
(function () {
  'use strict';

  /* ═══════════════════════════════════════════════════
     AFROBOT SVG — reused from chat-panel
  ═══════════════════════════════════════════════════ */
  const BOT_SVG = `<svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <line x1="16" y1="2" x2="16" y2="6" stroke="#60b5ff" stroke-width="1.5" stroke-linecap="round"/>
    <circle cx="16" cy="1.5" r="1.5" fill="#0071E3"/>
    <rect x="5" y="6" width="22" height="18" rx="5" fill="#1a2e4a"/>
    <rect x="5" y="6" width="22" height="18" rx="5" stroke="#2a4a6e" stroke-width="1"/>
    <rect x="8.5" y="11" width="5" height="5" rx="1.5" fill="#0071E3" opacity=".9"/>
    <rect x="9.5" y="12" width="2" height="2" rx=".5" fill="#60b5ff"/>
    <rect x="18.5" y="11" width="5" height="5" rx="1.5" fill="#0071E3" opacity=".9"/>
    <rect x="19.5" y="12" width="2" height="2" rx=".5" fill="#60b5ff"/>
    <rect x="10" y="19.5" width="12" height="1.5" rx=".75" fill="#60b5ff" opacity=".6"/>
    <rect x="2" y="12" width="3" height="4" rx="1" fill="#1a2e4a" stroke="#2a4a6e" stroke-width=".8"/>
    <rect x="27" y="12" width="3" height="4" rx="1" fill="#1a2e4a" stroke="#2a4a6e" stroke-width=".8"/>
    <circle cx="9" cy="9" r=".8" fill="#0071E3" opacity=".4"/>
    <circle cx="23" cy="9" r=".8" fill="#0071E3" opacity=".4"/>
  </svg>`;

  /* ═══════════════════════════════════════════════════
     QUICK TOOL LINKS — curated site navigation cards
  ═══════════════════════════════════════════════════ */
  const QUICK_LINKS = [
    { icon: '💰', label: 'Salary & Tax',     href: '/salary-tax' },
    { icon: '📄', label: 'PDF Tools',        href: '/document-pdf' },
    { icon: '🖼️', label: 'Image Tools',     href: '/image-design' },
    { icon: '🏥', label: 'Health Tools',     href: '/health' },
    { icon: '🎓', label: 'Education',        href: '/education' },
    { icon: '⌨️', label: 'Developer',       href: '/developer-tools' },
    { icon: '🧾', label: 'VAT & Business',   href: '/vat-business-tax' },
    { icon: '🌍', label: 'All Tools',        href: '/all-tools' },
  ];

  /* ═══════════════════════════════════════════════════
     SYSTEM PROMPT — tells the AI who it is
  ═══════════════════════════════════════════════════ */
  const SYSTEM_PROMPT = `You are AfroBot, the AI advisor for AfroTools.com — Africa's #1 financial tools platform. You help users:
- Understand and use AfroTools' calculators and tools (tax, salary, PDF, health, image, education, developer tools, etc.)
- Navigate the site to find the right tool for their need
- Get quick answers on financial, health, education, and productivity questions relevant to Africa
- Learn about AfroTools features, subscription plans, and capabilities

AfroTools has 300+ tools across categories: Salary & Tax, PDF & Documents, Image & Design, Health & Agriculture, Education, Developer Tools, VAT & Business, Currency & Finance, African-specific tools, Legal, Engineering, and more.

Key tools include: PAYE calculators for Nigeria/Kenya/South Africa/Ghana, PDF merge/compress/sign, BMI calculator, pregnancy due date, currency converter, CV builder, invoice generator, unit converter, QR generator, and many more.

The site is free to use with AI advisors on premium tools. Keep responses concise (2–4 sentences unless more detail is needed), friendly, and Africa-focused. If asked about a specific country's tax/finance rules, be accurate. Always guide users toward the right tool on AfroTools.`;

  /* ═══════════════════════════════════════════════════
     SUGGESTED QUESTIONS
  ═══════════════════════════════════════════════════ */
  const SUGGESTIONS = [
    'How do I calculate my PAYE tax in Nigeria?',
    'What tools do you have for PDFs?',
    'Can you help me track my BMI?',
    'What\'s the best tool for my CV?',
    'How do I calculate import duty?',
    'What mortgage tools do you have?',
  ];

  /* ═══════════════════════════════════════════════════
     WEB COMPONENT
  ═══════════════════════════════════════════════════ */
  class AfroSiteAssistant extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this._open     = false;
      this._messages = [];
      this._loading  = false;
      this._welcomed = false;
    }

    connectedCallback() {
      this._render();
      this._bind();
      // Pulse hint after 4s on first visit
      setTimeout(() => this._showPulse(), 4000);
    }

    _render() {
      this.shadowRoot.innerHTML = `
        <style>
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

          :host {
            position: fixed;
            bottom: 24px;
            right: 24px;
            z-index: 99999;
            font-family: -apple-system, 'SF Pro Text', 'DM Sans', system-ui, sans-serif;
          }

          /* ── FAB trigger button ── */
          .fab {
            width: 56px;
            height: 56px;
            border-radius: 50%;
            background: linear-gradient(135deg, #0d1b2e 0%, #0a1628 100%);
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow:
              0 4px 20px rgba(0,113,227,.5),
              0 0 0 2px rgba(0,113,227,.3);
            transition: transform .22s cubic-bezier(.34,1.56,.64,1), box-shadow .22s ease;
            position: relative;
            padding: 0;
          }
          .fab:hover {
            transform: scale(1.1);
            box-shadow:
              0 8px 30px rgba(0,113,227,.6),
              0 0 0 3px rgba(0,113,227,.25);
          }
          .fab:active { transform: scale(.96); }

          /* Rainbow ring on fab */
          .fab-ring {
            position: absolute;
            inset: -3px;
            border-radius: 50%;
            background: linear-gradient(135deg,#ff0000,#ff7700,#ffee00,#00cc44,#0077ff,#6600cc,#cc00ff,#ff0000);
            background-size: 400% 400%;
            animation: rainbow-shift 4s linear infinite;
            z-index: -1;
            border-radius: 50%;
          }
          @keyframes rainbow-shift {
            0%   { background-position: 0% 50%; }
            50%  { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }

          /* Notification badge */
          .badge {
            position: absolute;
            top: -4px;
            right: -4px;
            width: 18px;
            height: 18px;
            background: #ef4444;
            border-radius: 50%;
            font-size: 0.6rem;
            font-weight: 800;
            color: #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid #fff;
            display: none;
          }
          .badge.show { display: flex; }

          /* Pulse hint tooltip */
          .hint {
            position: absolute;
            bottom: 68px;
            right: 0;
            background: #1a2e4a;
            color: #e0f0ff;
            font-size: 0.72rem;
            font-weight: 600;
            padding: 7px 13px;
            border-radius: 10px;
            white-space: nowrap;
            box-shadow: 0 4px 20px rgba(0,0,0,.4);
            opacity: 0;
            transform: translateY(6px) scale(.95);
            transition: opacity .3s, transform .3s;
            pointer-events: none;
          }
          .hint::after {
            content: '';
            position: absolute;
            bottom: -5px;
            right: 18px;
            width: 10px;
            height: 10px;
            background: #1a2e4a;
            clip-path: polygon(0 0,100% 0,50% 100%);
          }
          .hint.show { opacity: 1; transform: translateY(0) scale(1); }

          /* ── Panel ── */
          .panel-wrap {
            position: absolute;
            bottom: 68px;
            right: 0;
            width: 360px;
            max-width: calc(100vw - 32px);
            border-radius: 20px;
            padding: 2.5px;
            background: linear-gradient(135deg,#ff0000,#ff7700,#ffee00,#00cc44,#0077ff,#6600cc,#cc00ff,#ff0000);
            background-size: 400% 400%;
            animation: rainbow-shift 5s linear infinite;
            box-shadow:
              0 0 30px 4px rgba(0,119,255,.25),
              0 20px 50px rgba(0,0,0,.4);
            transform-origin: bottom right;
            transform: scale(.85) translateY(12px);
            opacity: 0;
            pointer-events: none;
            transition:
              transform .3s cubic-bezier(.34,1.56,.64,1),
              opacity .25s ease;
          }
          .panel-wrap.open {
            transform: scale(1) translateY(0);
            opacity: 1;
            pointer-events: all;
          }

          .panel {
            background: #0d1117;
            border-radius: 18px;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            max-height: min(560px, calc(100vh - 120px));
          }

          /* Header */
          .p-head {
            padding: 14px 16px;
            background: linear-gradient(135deg,#0d1117 0%,#111827 100%);
            display: flex;
            align-items: center;
            gap: 10px;
            border-bottom: 1px solid rgba(255,255,255,.07);
            flex-shrink: 0;
          }
          .p-head-text { flex:1; min-width:0; }
          .p-title {
            font-size: 0.88rem;
            font-weight: 700;
            color: #f0f6fc;
            letter-spacing: -.01em;
          }
          .p-sub {
            font-size: 0.68rem;
            color: #6e7681;
            margin-top: 1px;
          }
          .live-dot {
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background: #22c55e;
            box-shadow: 0 0 6px #22c55e;
            animation: pulse 2.2s ease-in-out infinite;
          }
          @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.45;transform:scale(.8)} }
          .p-badge {
            font-size: 0.56rem;
            font-weight: 800;
            color: #60b5ff;
            background: rgba(0,113,227,.18);
            padding: 2px 7px;
            border-radius: 100px;
            letter-spacing: .07em;
            text-transform: uppercase;
            border: 1px solid rgba(96,181,255,.2);
          }
          .close-btn {
            background: none;
            border: none;
            color: #484f58;
            cursor: pointer;
            padding: 4px;
            line-height:1;
            transition: color .18s;
          }
          .close-btn:hover { color: #c9d1d9; }

          /* Quick nav links */
          .quick-nav {
            padding: 10px 12px;
            display: grid;
            grid-template-columns: repeat(4,1fr);
            gap: 6px;
            border-bottom: 1px solid rgba(255,255,255,.06);
            flex-shrink: 0;
          }
          .qn-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 3px;
            padding: 7px 4px;
            border-radius: 10px;
            background: rgba(255,255,255,.04);
            text-decoration: none;
            color: #8b949e;
            font-size: 0.6rem;
            font-weight: 600;
            text-align: center;
            transition: background .18s, color .18s;
            cursor: pointer;
          }
          .qn-item:hover { background: rgba(0,113,227,.15); color: #60b5ff; }
          .qn-icon { font-size: 1rem; line-height:1; }

          /* Messages */
          .msgs {
            flex: 1;
            overflow-y: auto;
            padding: 12px 14px;
            display: flex;
            flex-direction: column;
            gap: 9px;
            min-height: 120px;
            scrollbar-width: thin;
            scrollbar-color: #21262d transparent;
          }
          .msgs::-webkit-scrollbar { width: 4px; }
          .msgs::-webkit-scrollbar-thumb { background: #21262d; border-radius:4px; }

          .msg {
            padding: 9px 12px;
            border-radius: 10px;
            font-size: 0.82rem;
            line-height: 1.65;
            max-width: 88%;
            word-break: break-word;
          }
          .msg-user {
            background: #0071E3;
            color: #fff;
            align-self: flex-end;
            border-bottom-right-radius: 2px;
          }
          .msg-ai {
            background: #161b22;
            color: #c9d1d9;
            align-self: flex-start;
            border-bottom-left-radius: 2px;
            border: 1px solid rgba(255,255,255,.07);
          }
          .msg-sys {
            background: transparent;
            color: #484f58;
            align-self: center;
            text-align: center;
            font-size: 0.72rem;
            font-style: italic;
            max-width: 100%;
          }
          .msg-err {
            background: rgba(220,53,69,.1);
            color: #f87171;
            align-self: flex-start;
            border-left: 3px solid #dc3545;
          }

          /* Typing indicator */
          .typing {
            display: flex;
            gap: 4px;
            padding: 9px 12px;
            align-self: flex-start;
            background: #161b22;
            border-radius: 10px;
            border-bottom-left-radius: 2px;
            border: 1px solid rgba(255,255,255,.07);
          }
          .typing span {
            width: 5px;
            height: 5px;
            background: #0071E3;
            border-radius: 50%;
            animation: dot-bounce .65s infinite alternate;
          }
          .typing span:nth-child(2) { animation-delay:.14s; }
          .typing span:nth-child(3) { animation-delay:.28s; }
          @keyframes dot-bounce { to { transform:translateY(-5px); opacity:.3; } }

          /* Suggestions */
          .suggestions {
            padding: 8px 12px 4px;
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            flex-shrink: 0;
          }
          .sug-btn {
            background: rgba(0,113,227,.1);
            border: 1px solid rgba(0,113,227,.25);
            color: #60b5ff;
            font-size: 0.68rem;
            font-weight: 600;
            padding: 5px 10px;
            border-radius: 100px;
            cursor: pointer;
            font-family: inherit;
            transition: background .18s;
            text-align: left;
          }
          .sug-btn:hover { background: rgba(0,113,227,.2); }

          /* Input row */
          .input-row {
            display: flex;
            gap: 8px;
            padding: 10px 12px 12px;
            border-top: 1px solid rgba(255,255,255,.06);
            background: #0d1117;
            flex-shrink: 0;
          }
          .chat-input {
            flex: 1;
            background: #161b22;
            border: 1px solid rgba(255,255,255,.1);
            border-radius: 9px;
            padding: 8px 12px;
            color: #e6edf3;
            font-size: 0.8rem;
            font-family: inherit;
            outline: none;
            resize: none;
            transition: border-color .18s;
          }
          .chat-input::placeholder { color: #30363d; }
          .chat-input:focus { border-color: rgba(0,113,227,.6); }
          .send-btn {
            background: #0071E3;
            color: #fff;
            border: none;
            border-radius: 9px;
            padding: 8px 14px;
            font-size: 0.76rem;
            font-weight: 700;
            cursor: pointer;
            font-family: inherit;
            white-space: nowrap;
            transition: background .18s, transform .1s;
          }
          .send-btn:hover { background: #0062c4; }
          .send-btn:active { transform: scale(.96); }
          .send-btn:disabled { opacity: .4; cursor: not-allowed; transform: none; }

          /* Responsive */
          @media (max-width: 480px) {
            :host { bottom: 16px; right: 14px; }
            .panel-wrap { width: calc(100vw - 28px); right: -14px; }
            .quick-nav { grid-template-columns: repeat(4,1fr); }
          }
        </style>

        <!-- FAB button -->
        <div class="fab-ring"></div>
        <button class="fab" id="fab" aria-label="Open AfroTools AI Advisor" title="AfroBot — AI Advisor">
          ${BOT_SVG}
          <div class="badge" id="badge">1</div>
        </button>
        <div class="hint" id="hint">Ask AfroBot anything ✨</div>

        <!-- Expandable panel -->
        <div class="panel-wrap" id="panel">
          <div class="panel">

            <!-- Header -->
            <div class="p-head">
              <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style="flex-shrink:0">
                <line x1="16" y1="2" x2="16" y2="6" stroke="#60b5ff" stroke-width="1.5" stroke-linecap="round"/>
                <circle cx="16" cy="1.5" r="1.5" fill="#0071E3"/>
                <rect x="5" y="6" width="22" height="18" rx="5" fill="#1a2e4a"/>
                <rect x="5" y="6" width="22" height="18" rx="5" stroke="#2a4a6e" stroke-width="1"/>
                <rect x="8.5" y="11" width="5" height="5" rx="1.5" fill="#0071E3" opacity=".9"/>
                <rect x="9.5" y="12" width="2" height="2" rx=".5" fill="#60b5ff"/>
                <rect x="18.5" y="11" width="5" height="5" rx="1.5" fill="#0071E3" opacity=".9"/>
                <rect x="19.5" y="12" width="2" height="2" rx=".5" fill="#60b5ff"/>
                <rect x="10" y="19.5" width="12" height="1.5" rx=".75" fill="#60b5ff" opacity=".6"/>
                <rect x="2" y="12" width="3" height="4" rx="1" fill="#1a2e4a" stroke="#2a4a6e" stroke-width=".8"/>
                <rect x="27" y="12" width="3" height="4" rx="1" fill="#1a2e4a" stroke="#2a4a6e" stroke-width=".8"/>
              </svg>
              <div class="p-head-text">
                <div class="p-title">AfroBot</div>
                <div class="p-sub">AI Site Advisor · AfroTools.com</div>
              </div>
              <div class="live-dot"></div>
              <span class="p-badge">AI</span>
              <button class="close-btn" id="close" aria-label="Close">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                </svg>
              </button>
            </div>

            <!-- Quick category navigation -->
            <div class="quick-nav" id="quicknav">
              ${QUICK_LINKS.map(l => `
                <a class="qn-item" href="${l.href}" title="${l.label}">
                  <span class="qn-icon">${l.icon}</span>
                  <span>${l.label}</span>
                </a>`).join('')}
            </div>

            <!-- Messages -->
            <div class="msgs" id="msgs">
              <div class="msg msg-sys">👋 Hi! I'm AfroBot. Ask me about any tool, or click a category above to explore.</div>
            </div>

            <!-- Suggestion chips (shown when no messages yet) -->
            <div class="suggestions" id="sugs">
              ${SUGGESTIONS.map(s => `<button class="sug-btn" data-q="${s}">${s}</button>`).join('')}
            </div>

            <!-- Input -->
            <div class="input-row">
              <input class="chat-input" id="inp" type="text" placeholder="Ask about any tool…" autocomplete="off">
              <button class="send-btn" id="send">Send →</button>
            </div>

          </div>
        </div>
      `;
    }

    _bind() {
      const fab   = this.shadowRoot.getElementById('fab');
      const panel = this.shadowRoot.getElementById('panel');
      const close = this.shadowRoot.getElementById('close');
      const inp   = this.shadowRoot.getElementById('inp');
      const send  = this.shadowRoot.getElementById('send');
      const hint  = this.shadowRoot.getElementById('hint');
      const badge = this.shadowRoot.getElementById('badge');
      const sugs  = this.shadowRoot.getElementById('sugs');

      fab.addEventListener('click', () => this._toggle());
      close.addEventListener('click', () => this._close());
      send.addEventListener('click', () => this._send());
      inp.addEventListener('keydown', e => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this._send(); }
      });

      // Suggestion chips
      sugs.addEventListener('click', e => {
        const btn = e.target.closest('.sug-btn');
        if (!btn) return;
        inp.value = btn.dataset.q;
        this._send();
      });

      // Close on backdrop click (outside panel)
      document.addEventListener('click', (e) => {
        if (!this._open) return;
        if (!this.contains(e.target) && !this.shadowRoot.contains(e.target)) this._close();
      });

      // Show badge initially to draw attention
      badge.classList.add('show');
    }

    _showPulse() {
      if (this._open) return;
      const hint = this.shadowRoot.getElementById('hint');
      hint.classList.add('show');
      setTimeout(() => hint.classList.remove('show'), 3500);
    }

    _toggle() {
      this._open ? this._close() : this._open_panel();
    }

    _open_panel() {
      this._open = true;
      const panel = this.shadowRoot.getElementById('panel');
      const badge = this.shadowRoot.getElementById('badge');
      const hint  = this.shadowRoot.getElementById('hint');
      panel.classList.add('open');
      badge.classList.remove('show');
      hint.classList.remove('show');
      // Welcome message with page context
      if (!this._welcomed) {
        this._welcomed = true;
        this._injectPageContext();
      }
      setTimeout(() => this.shadowRoot.getElementById('inp').focus(), 300);
    }

    _close() {
      this._open = false;
      this.shadowRoot.getElementById('panel').classList.remove('open');
    }

    _injectPageContext() {
      // Detect current page/tool for context
      const path  = window.location.pathname;
      const title = document.title || '';
      const toolH1 = document.querySelector('h1')?.textContent?.trim() || '';
      if (path !== '/' && path !== '/index.html') {
        const ctx = toolH1 || title.split('—')[0].trim();
        this._addMsg('sys', `📍 You're viewing: ${ctx}`);
      }
    }

    async _send() {
      const inp   = this.shadowRoot.getElementById('inp');
      const text  = inp.value.trim();
      if (!text || this._loading) return;
      inp.value = '';

      // Hide suggestions after first message
      this.shadowRoot.getElementById('sugs').style.display = 'none';

      this._addMsg('user', text);
      this._messages.push({ role: 'user', content: text });
      await this._callAI();
    }

    async _callAI() {
      this._loading = true;
      const send = this.shadowRoot.getElementById('send');
      send.disabled = true;
      this._showTyping();

      // Build context from current page
      const pageCtx = `User is on page: ${window.location.pathname}. Page title: ${document.title}`;

      try {
        let reply;
        if (typeof window.AfroTools !== 'undefined' && window.AfroTools.ai) {
          reply = await window.AfroTools.ai.ask(
            this._messages[this._messages.length - 1].content,
            SYSTEM_PROMPT + '\n\nPage context: ' + pageCtx,
            this._messages.slice(0, -1)
          );
        } else {
          // Fallback: smart offline responses
          reply = this._offlineReply(this._messages[this._messages.length - 1].content);
        }
        this._hideTyping();
        this._addMsg('ai', reply);
        this._messages.push({ role: 'assistant', content: reply });
      } catch (err) {
        this._hideTyping();
        const msg = err.message || 'Something went wrong. Please try again.';
        this._addMsg('err', msg);
      }
      this._loading = false;
      send.disabled = false;
    }

    _offlineReply(q) {
      q = q.toLowerCase();
      if (q.includes('paye') || q.includes('tax') || q.includes('salary'))
        return 'We have PAYE calculators for Nigeria, Kenya, South Africa, Ghana, and more. Head to the Salary & Tax category to find your country\'s calculator!';
      if (q.includes('pdf'))
        return 'AfroTools has 8+ PDF tools: merge, split, compress, add page numbers, add watermarks, password protect, sign, and workspace. Visit the Document & PDF section.';
      if (q.includes('bmi') || q.includes('weight') || q.includes('health'))
        return 'Our BMI Calculator gives you BMI, body fat estimate, macros, goal timeline, and health risk assessment. Find it in the Health category.';
      if (q.includes('cv') || q.includes('resume'))
        return 'Our CV Builder lets you create a professional resume with multiple templates, live preview, and PDF download. It\'s completely free!';
      if (q.includes('currency') || q.includes('exchange'))
        return 'The Currency Converter supports 160+ currencies with real-time rates. Also check the Remittance Compare tool to find the best rates for sending money across Africa.';
      return 'I\'m AfroBot! I can help you find the right tool on AfroTools. Try asking about salary calculators, PDF tools, health tools, or any specific need you have.';
    }

    _addMsg(type, text) {
      const msgs = this.shadowRoot.getElementById('msgs');
      const cls  = { user:'msg-user', ai:'msg-ai', sys:'msg-sys', err:'msg-err' }[type] || 'msg-ai';
      const div  = document.createElement('div');
      div.className = 'msg ' + cls;
      div.textContent = text;
      msgs.appendChild(div);
      msgs.scrollTop = msgs.scrollHeight;
    }

    _showTyping() {
      const msgs = this.shadowRoot.getElementById('msgs');
      const t    = document.createElement('div');
      t.className = 'typing'; t.id = 'typing';
      t.innerHTML = '<span></span><span></span><span></span>';
      msgs.appendChild(t);
      msgs.scrollTop = msgs.scrollHeight;
    }

    _hideTyping() {
      const t = this.shadowRoot.getElementById('typing');
      if (t) t.remove();
    }
  }

  if (!customElements.get('afro-site-assistant')) {
    customElements.define('afro-site-assistant', AfroSiteAssistant);
  }

  /* ═══════════════════════════════════════════════════
     AUTO-INJECT — add <afro-site-assistant> to body
     if not already present (script self-bootstrap)
  ═══════════════════════════════════════════════════ */
  function inject() {
    if (!document.querySelector('afro-site-assistant')) {
      const el = document.createElement('afro-site-assistant');
      document.body.appendChild(el);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }

})();
