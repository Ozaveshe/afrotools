/**
 * AFROTOOLS SITE ASSISTANT v3 — Floating AI Advisor
 * Apple-inspired, light-first design with system theme detection.
 * Explains tools · Navigates site · Recommends features · Gives direct links
 * Light/Dark theme toggle · Markdown links · Copy messages · Clear chat
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
    <circle cx="16" cy="1.5" r="1.5" fill="#007AFF"/>
    <rect x="5" y="6" width="22" height="18" rx="5" fill="#1a2e4a"/>
    <rect x="5" y="6" width="22" height="18" rx="5" stroke="#2a4a6e" stroke-width="1"/>
    <rect x="8.5" y="11" width="5" height="5" rx="1.5" fill="#007AFF" opacity=".9"/>
    <rect x="9.5" y="12" width="2" height="2" rx=".5" fill="#60b5ff"/>
    <rect x="18.5" y="11" width="5" height="5" rx="1.5" fill="#007AFF" opacity=".9"/>
    <rect x="19.5" y="12" width="2" height="2" rx=".5" fill="#60b5ff"/>
    <rect x="10" y="19.5" width="12" height="1.5" rx=".75" fill="#60b5ff" opacity=".6"/>
    <rect x="2" y="12" width="3" height="4" rx="1" fill="#1a2e4a" stroke="#2a4a6e" stroke-width=".8"/>
    <rect x="27" y="12" width="3" height="4" rx="1" fill="#1a2e4a" stroke="#2a4a6e" stroke-width=".8"/>
    <circle cx="9" cy="9" r=".8" fill="#007AFF" opacity=".4"/>
    <circle cx="23" cy="9" r=".8" fill="#007AFF" opacity=".4"/>
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
     BUILD TOOL DIRECTORY from registry (for AI context)
  ═══════════════════════════════════════════════════ */
  function buildToolDirectory() {
    if (typeof AFRO_TOOLS === 'undefined' || !Array.isArray(AFRO_TOOLS)) return '';
    const liveTools = AFRO_TOOLS.filter(t => t.status === 'live');
    const lines = liveTools.map(t => `- ${t.name} (${t.icon}): ${t.href}`);
    return '\n\nTool directory with direct links (ALWAYS use these exact hrefs when recommending tools):\n' + lines.join('\n');
  }

  /* ═══════════════════════════════════════════════════
     SYSTEM PROMPT — tells the AI who it is
  ═══════════════════════════════════════════════════ */
  const BASE_SYSTEM_PROMPT = `You are AfroBot, the AI advisor for AfroTools.com — Africa's #1 financial tools platform. You help users:
- Understand and use AfroTools' calculators and tools (tax, salary, PDF, health, image, education, developer tools, etc.)
- Navigate the site to find the right tool for their need
- Get quick answers on financial, health, education, and productivity questions relevant to Africa
- Learn about AfroTools features, subscription plans, and capabilities

AfroTools has 300+ tools across categories: Salary & Tax, PDF & Documents, Image & Design, Health & Agriculture, Education, Developer Tools, VAT & Business, Currency & Finance, African-specific tools, Legal, Engineering, and more.

IMPORTANT RULES:
1. When a user asks about a tool or asks for a link, ALWAYS provide the direct link from the tool directory below. Format links as: [Tool Name](https://afrotools.com/path)
2. Never say "I can't provide links" — you have the full directory.
3. Keep responses concise (2-4 sentences unless more detail is needed), friendly, and Africa-focused.
4. If asked about a specific country's tax/finance rules, be accurate.
5. Always guide users toward the right tool on AfroTools.
6. You can use **bold** for emphasis and [text](url) for links. Do NOT use markdown headers (#) or bullet lists with dashes.
7. When listing multiple tools, put each on its own line.`;

  /* ═══════════════════════════════════════════════════
     SUGGESTED QUESTIONS
  ═══════════════════════════════════════════════════ */
  const SUGGESTIONS = [
    'Give me the link to the Nigeria PAYE calculator',
    'What PDF tools do you have?',
    'I need to calculate my BMI',
    'Help me build my CV',
    'How do I calculate import duty?',
    'What mortgage tools do you have?',
  ];

  /* ═══════════════════════════════════════════════════
     DESIGN TOKENS — light-first Apple-inspired palette
  ═══════════════════════════════════════════════════ */
  const LIGHT_VARS = {
    fabBg: '#ffffff',
    fabShadow: '0 2px 16px rgba(0,122,255,0.18), 0 4px 24px rgba(0,0,0,0.08)',
    fabHoverShadow: '0 4px 24px rgba(0,122,255,0.28), 0 8px 32px rgba(0,0,0,0.10)',
    panelBg: '#ffffff',
    panelShadow: '0 12px 40px rgba(0,0,0,0.12)',
    headerBg: '#F8FAFD',
    title: '#0f172a',
    sub: '#64748b',
    border: '#E2E8F0',
    msgAiBg: '#F1F5F9',
    msgAiColor: '#1e293b',
    msgAiBorder: '#E2E8F0',
    inputBg: '#ffffff',
    inputBorder: '#E2E8F0',
    inputColor: '#0f172a',
    inputPlaceholder: '#94a3b8',
    qnBg: '#F1F5F9',
    qnColor: '#64748b',
    qnHoverBg: 'rgba(0,122,255,0.08)',
    sysMsgColor: '#94a3b8',
    scrollThumb: '#cbd5e1',
    badgeBg: '#007AFF',
    sugBg: 'transparent',
    sugBorder: '#E2E8F0',
    sugColor: '#007AFF',
    sugHoverBg: 'rgba(0,122,255,0.06)',
    copyBg: 'rgba(0,0,0,0.06)',
    aiBadgeBg: 'rgba(0,122,255,0.08)',
    aiBadgeColor: '#007AFF',
    aiBadgeBorder: 'rgba(0,122,255,0.15)',
    linkColor: '#007AFF',
  };

  const DARK_VARS = {
    fabBg: '#131D2E',
    fabShadow: '0 2px 16px rgba(0,122,255,0.22), 0 4px 24px rgba(0,0,0,0.3)',
    fabHoverShadow: '0 4px 24px rgba(0,122,255,0.35), 0 8px 32px rgba(0,0,0,0.35)',
    panelBg: '#131D2E',
    panelShadow: '0 12px 40px rgba(0,0,0,0.4)',
    headerBg: '#0B1120',
    title: '#E2E8F0',
    sub: '#8B9CB8',
    border: '#1E2D40',
    msgAiBg: '#0B1120',
    msgAiColor: '#E2E8F0',
    msgAiBorder: '#1E2D40',
    inputBg: '#0B1120',
    inputBorder: '#1E2D40',
    inputColor: '#E2E8F0',
    inputPlaceholder: '#4A5568',
    qnBg: 'rgba(255,255,255,0.04)',
    qnColor: '#8B9CB8',
    qnHoverBg: 'rgba(0,122,255,0.15)',
    sysMsgColor: '#64748b',
    scrollThumb: '#1E2D40',
    badgeBg: '#007AFF',
    sugBg: 'transparent',
    sugBorder: '#1E2D40',
    sugColor: '#60b5ff',
    sugHoverBg: 'rgba(0,122,255,0.12)',
    copyBg: 'rgba(255,255,255,0.08)',
    aiBadgeBg: 'rgba(0,122,255,0.12)',
    aiBadgeColor: '#60b5ff',
    aiBadgeBorder: 'rgba(96,181,255,0.18)',
    linkColor: '#60b5ff',
  };

  /* ═══════════════════════════════════════════════════
     PARSE MARKDOWN-LITE (bold + links, no XSS)
  ═══════════════════════════════════════════════════ */
  function parseMd(text) {
    // Escape HTML
    let s = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    // Links: [text](url) — only allow http/https/relative paths
    s = s.replace(/\[([^\]]+)\]\(((?:https?:\/\/[^\s)]+|\/[^\s)]+))\)/g,
      '<a href="$2" target="_blank" rel="noopener" style="color:var(--link-color,#007AFF);text-decoration:underline;font-weight:600">$1</a>');
    // Bold: **text**
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    // Newlines
    s = s.replace(/\n/g, '<br>');
    return s;
  }

  /* ═══════════════════════════════════════════════════
     DETECT SYSTEM THEME
  ═══════════════════════════════════════════════════ */
  function detectSystemTheme() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }

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
      this._hasBeenOpened = !!localStorage.getItem('afrobot_opened');

      // Theme: use localStorage if set, otherwise detect system preference
      const stored = localStorage.getItem('afrobot_theme');
      this._theme = stored || detectSystemTheme();
    }

    connectedCallback() {
      this._render();
      this._bind();
      this._applyTheme();

      // Listen for system theme changes (only matters if user hasn't overridden)
      this._mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      this._mediaHandler = (e) => {
        if (!localStorage.getItem('afrobot_theme')) {
          this._theme = e.matches ? 'dark' : 'light';
          this._applyTheme();
        }
      };
      this._mediaQuery.addEventListener('change', this._mediaHandler);
    }

    disconnectedCallback() {
      if (this._mediaQuery && this._mediaHandler) {
        this._mediaQuery.removeEventListener('change', this._mediaHandler);
      }
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
            font-family: 'DM Sans', -apple-system, 'SF Pro Text', system-ui, sans-serif;
          }

          /* ── FAB trigger button ── */
          .fab {
            width: 56px;
            height: 56px;
            border-radius: 50%;
            background: var(--fab-bg, #ffffff);
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: var(--fab-shadow, 0 2px 16px rgba(0,122,255,0.18), 0 4px 24px rgba(0,0,0,0.08));
            transition: transform .22s cubic-bezier(.34,1.56,.64,1), box-shadow .22s ease;
            position: relative;
            padding: 0;
          }
          .fab:hover {
            transform: scale(1.08);
            box-shadow: var(--fab-hover-shadow, 0 4px 24px rgba(0,122,255,0.28), 0 8px 32px rgba(0,0,0,0.10));
          }
          .fab:active { transform: scale(.95); }

          /* Subtle blue dot badge — replaces old red "1" badge */
          .badge {
            position: absolute;
            top: 0px;
            right: 0px;
            width: 10px;
            height: 10px;
            background: #007AFF;
            border-radius: 50%;
            display: none;
            border: 2px solid var(--fab-bg, #ffffff);
            box-shadow: 0 0 6px rgba(0,122,255,0.4);
          }
          .badge.show { display: block; }

          /* ── Panel ── */
          .panel-wrap {
            position: absolute;
            bottom: 68px;
            right: 0;
            width: 380px;
            max-width: calc(100vw - 32px);
            border-radius: 20px;
            background: var(--panel-bg, #ffffff);
            box-shadow: var(--panel-shadow, 0 12px 40px rgba(0,0,0,0.12));
            transform-origin: bottom right;
            transform: scale(.88) translateY(10px);
            opacity: 0;
            pointer-events: none;
            transition:
              transform .28s cubic-bezier(.34,1.56,.64,1),
              opacity .22s ease;
            overflow: hidden;
          }
          .panel-wrap.open {
            transform: scale(1) translateY(0);
            opacity: 1;
            pointer-events: all;
          }

          .panel {
            display: flex;
            flex-direction: column;
            max-height: min(560px, calc(100vh - 120px));
            transition: background .25s ease;
          }

          /* Header */
          .p-head {
            padding: 14px 16px;
            background: var(--header-bg, #F8FAFD);
            display: flex;
            align-items: center;
            gap: 10px;
            border-bottom: 1px solid var(--border, #E2E8F0);
            flex-shrink: 0;
            transition: background .25s, border-color .25s;
          }
          .p-head-text { flex:1; min-width:0; }
          .p-title {
            font-size: 0.88rem;
            font-weight: 700;
            color: var(--title, #0f172a);
            letter-spacing: -.01em;
            transition: color .25s;
          }
          .p-sub {
            font-size: 0.68rem;
            color: var(--sub, #64748b);
            margin-top: 1px;
            transition: color .25s;
          }
          .live-dot {
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background: #34D399;
            box-shadow: 0 0 6px rgba(52,211,153,0.5);
            animation: pulse 2.2s ease-in-out infinite;
          }
          @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.45;transform:scale(.8)} }
          .p-badge {
            font-size: 0.52rem;
            font-weight: 700;
            color: var(--ai-badge-color, #007AFF);
            background: var(--ai-badge-bg, rgba(0,122,255,0.08));
            padding: 2px 6px;
            border-radius: 6px;
            letter-spacing: .05em;
            text-transform: uppercase;
            border: 1px solid var(--ai-badge-border, rgba(0,122,255,0.15));
            transition: color .25s, background .25s, border-color .25s;
          }

          /* Header action buttons */
          .head-actions {
            display: flex;
            align-items: center;
            gap: 2px;
          }
          .head-btn {
            background: none;
            border: none;
            color: var(--sub, #64748b);
            cursor: pointer;
            padding: 5px;
            line-height: 1;
            border-radius: 8px;
            transition: color .18s, background .18s;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .head-btn:hover { color: var(--title, #0f172a); background: var(--qn-bg, #F1F5F9); }
          .head-btn svg { width: 15px; height: 15px; }

          /* Quick nav links */
          .quick-nav {
            padding: 10px 12px;
            display: grid;
            grid-template-columns: repeat(4,1fr);
            gap: 6px;
            border-bottom: 1px solid var(--border, #E2E8F0);
            flex-shrink: 0;
            transition: border-color .25s;
          }
          .qn-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
            padding: 8px 4px;
            border-radius: 10px;
            background: var(--qn-bg, #F1F5F9);
            text-decoration: none;
            color: var(--qn-color, #64748b);
            font-size: 0.6rem;
            font-weight: 600;
            text-align: center;
            transition: background .18s, color .18s;
            cursor: pointer;
          }
          .qn-item:hover { background: var(--qn-hover-bg, rgba(0,122,255,0.08)); color: #007AFF; }
          .qn-icon { font-size: 1rem; line-height:1; }

          /* Messages */
          .msgs {
            flex: 1;
            overflow-y: auto;
            padding: 12px 14px;
            display: flex;
            flex-direction: column;
            gap: 9px;
            min-height: 140px;
            scrollbar-width: thin;
            scrollbar-color: var(--scroll-thumb, #cbd5e1) transparent;
            transition: scrollbar-color .25s;
          }
          .msgs::-webkit-scrollbar { width: 4px; }
          .msgs::-webkit-scrollbar-thumb { background: var(--scroll-thumb, #cbd5e1); border-radius:4px; }

          .msg {
            padding: 9px 12px;
            border-radius: 14px;
            font-size: 0.82rem;
            line-height: 1.65;
            max-width: 88%;
            word-break: break-word;
            position: relative;
          }
          .msg a { text-decoration: underline; font-weight: 600; }
          .msg-user {
            background: #007AFF;
            color: #fff;
            align-self: flex-end;
            border-bottom-right-radius: 4px;
          }
          .msg-user a { color: #fff; }
          .msg-ai {
            background: var(--msg-ai-bg, #F1F5F9);
            color: var(--msg-ai-color, #1e293b);
            align-self: flex-start;
            border-bottom-left-radius: 4px;
            border: 1px solid var(--msg-ai-border, #E2E8F0);
            transition: background .25s, color .25s, border-color .25s;
          }
          .msg-ai a { color: var(--link-color, #007AFF); }
          .msg-sys {
            background: transparent;
            color: var(--sys-msg-color, #94a3b8);
            align-self: center;
            text-align: center;
            font-size: 0.72rem;
            font-style: italic;
            max-width: 100%;
            transition: color .25s;
          }
          .msg-err {
            background: rgba(220,53,69,.08);
            color: #ef4444;
            align-self: flex-start;
            border-left: 3px solid #ef4444;
            border-radius: 10px;
          }

          /* Copy button on messages */
          .msg-copy {
            position: absolute;
            top: 4px;
            right: 4px;
            background: var(--copy-bg, rgba(0,0,0,0.06));
            border: none;
            border-radius: 6px;
            color: inherit;
            font-size: 0.6rem;
            padding: 2px 6px;
            cursor: pointer;
            opacity: 0;
            transition: opacity .18s;
            font-family: inherit;
          }
          .msg:hover .msg-copy { opacity: .7; }
          .msg-copy:hover { opacity: 1 !important; }

          /* Tool cards injected by AI */
          .tool-card {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 10px 12px;
            background: var(--qn-bg, #F1F5F9);
            border: 1px solid var(--border, #E2E8F0);
            border-radius: 12px;
            text-decoration: none;
            color: inherit;
            transition: background .18s, transform .1s;
            margin-top: 6px;
          }
          .tool-card:hover { background: var(--qn-hover-bg, rgba(0,122,255,0.08)); transform: translateY(-1px); }
          .tool-card-icon { font-size: 1.4rem; flex-shrink: 0; }
          .tool-card-info { flex: 1; min-width: 0; }
          .tool-card-name { font-weight: 700; font-size: 0.8rem; color: var(--title, #0f172a); }
          .tool-card-desc { font-size: 0.68rem; color: var(--sub, #64748b); margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
          .tool-card-arrow { color: #007AFF; font-weight: 700; font-size: 0.9rem; }

          /* Typing indicator */
          .typing {
            display: flex;
            gap: 4px;
            padding: 9px 12px;
            align-self: flex-start;
            background: var(--msg-ai-bg, #F1F5F9);
            border-radius: 14px;
            border-bottom-left-radius: 4px;
            border: 1px solid var(--msg-ai-border, #E2E8F0);
          }
          .typing span {
            width: 5px;
            height: 5px;
            background: #007AFF;
            border-radius: 50%;
            animation: dot-bounce .65s infinite alternate;
          }
          .typing span:nth-child(2) { animation-delay:.14s; }
          .typing span:nth-child(3) { animation-delay:.28s; }
          @keyframes dot-bounce { to { transform:translateY(-5px); opacity:.3; } }

          /* Suggestions — subtle outlined pills */
          .suggestions {
            padding: 8px 12px 4px;
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            flex-shrink: 0;
          }
          .sug-btn {
            background: var(--sug-bg, transparent);
            border: 1px solid var(--sug-border, #E2E8F0);
            color: var(--sug-color, #007AFF);
            font-size: 0.68rem;
            font-weight: 600;
            padding: 5px 10px;
            border-radius: 100px;
            cursor: pointer;
            font-family: inherit;
            transition: background .18s, border-color .18s;
            text-align: left;
          }
          .sug-btn:hover { background: var(--sug-hover-bg, rgba(0,122,255,0.06)); border-color: #007AFF; }

          /* Input row */
          .input-row {
            display: flex;
            gap: 8px;
            padding: 10px 12px 12px;
            border-top: 1px solid var(--border, #E2E8F0);
            background: var(--panel-bg, #ffffff);
            flex-shrink: 0;
            transition: background .25s, border-color .25s;
          }
          .chat-input {
            flex: 1;
            background: var(--input-bg, #ffffff);
            border: 1px solid var(--input-border, #E2E8F0);
            border-radius: 10px;
            padding: 8px 12px;
            color: var(--input-color, #0f172a);
            font-size: 0.8rem;
            font-family: inherit;
            outline: none;
            resize: none;
            transition: border-color .18s, background .25s, color .25s;
          }
          .chat-input::placeholder { color: var(--input-placeholder, #94a3b8); }
          .chat-input:focus { border-color: #007AFF; box-shadow: 0 0 0 3px rgba(0,122,255,0.1); }
          .send-btn {
            background: #007AFF;
            color: #fff;
            border: none;
            border-radius: 10px;
            padding: 8px 14px;
            font-size: 0.76rem;
            font-weight: 700;
            cursor: pointer;
            font-family: inherit;
            white-space: nowrap;
            transition: background .18s, transform .1s;
          }
          .send-btn:hover { background: #0062cc; }
          .send-btn:active { transform: scale(.96); }
          .send-btn:disabled { opacity: .4; cursor: not-allowed; transform: none; }

          /* Responsive */
          @media (max-width: 480px) {
            :host { bottom: 16px; right: 14px; }
            .panel-wrap { width: calc(100vw - 28px); right: -14px; }
          }
        </style>

        <!-- FAB button -->
        <button class="fab" id="fab" aria-label="Open AfroTools AI Advisor" title="AfroBot — AI Advisor">
          ${BOT_SVG}
          <div class="badge" id="badge"></div>
        </button>

        <!-- Expandable panel -->
        <div class="panel-wrap" id="panel">
          <div class="panel" id="panelInner">

            <!-- Header -->
            <div class="p-head">
              <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style="flex-shrink:0">
                <line x1="16" y1="2" x2="16" y2="6" stroke="#60b5ff" stroke-width="1.5" stroke-linecap="round"/>
                <circle cx="16" cy="1.5" r="1.5" fill="#007AFF"/>
                <rect x="5" y="6" width="22" height="18" rx="5" fill="#1a2e4a"/>
                <rect x="5" y="6" width="22" height="18" rx="5" stroke="#2a4a6e" stroke-width="1"/>
                <rect x="8.5" y="11" width="5" height="5" rx="1.5" fill="#007AFF" opacity=".9"/>
                <rect x="9.5" y="12" width="2" height="2" rx=".5" fill="#60b5ff"/>
                <rect x="18.5" y="11" width="5" height="5" rx="1.5" fill="#007AFF" opacity=".9"/>
                <rect x="19.5" y="12" width="2" height="2" rx=".5" fill="#60b5ff"/>
                <rect x="10" y="19.5" width="12" height="1.5" rx=".75" fill="#60b5ff" opacity=".6"/>
                <rect x="2" y="12" width="3" height="4" rx="1" fill="#1a2e4a" stroke="#2a4a6e" stroke-width=".8"/>
                <rect x="27" y="12" width="3" height="4" rx="1" fill="#1a2e4a" stroke="#2a4a6e" stroke-width=".8"/>
              </svg>
              <div class="p-head-text">
                <div class="p-title">AfroBot</div>
                <div class="p-sub">AI Advisor</div>
              </div>
              <div class="live-dot"></div>
              <span class="p-badge">AI</span>
              <div class="head-actions">
                <button class="head-btn" id="themeBtn" aria-label="Toggle theme" title="Switch light/dark">
                  <svg viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="3.5" stroke="currentColor" stroke-width="1.5"/><path d="M8 1.5v1.5M8 13v1.5M1.5 8H3M13 8h1.5M3.4 3.4l1.1 1.1M11.5 11.5l1.1 1.1M3.4 12.6l1.1-1.1M11.5 4.5l1.1-1.1" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>
                </button>
                <button class="head-btn" id="clearBtn" aria-label="Clear chat" title="Clear conversation">
                  <svg viewBox="0 0 16 16" fill="none"><path d="M4 5h8M6 5V4a1 1 0 011-1h2a1 1 0 011 1v1M5 5v7a1 1 0 001 1h4a1 1 0 001-1V5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </button>
                <button class="head-btn" id="close" aria-label="Close">
                  <svg viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
                </button>
              </div>
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
              <div class="msg msg-sys">Hi! I'm AfroBot. Ask me about any tool, or click a category above to explore. I can give you direct links!</div>
            </div>

            <!-- Suggestion chips -->
            <div class="suggestions" id="sugs">
              ${SUGGESTIONS.map(s => `<button class="sug-btn" data-q="${s}">${s}</button>`).join('')}
            </div>

            <!-- Input -->
            <div class="input-row">
              <input class="chat-input" id="inp" type="text" placeholder="Ask about any tool..." autocomplete="off">
              <button class="send-btn" id="send">Send</button>
            </div>

          </div>
        </div>
      `;
    }

    _bind() {
      const sr    = this.shadowRoot;
      const fab   = sr.getElementById('fab');
      const close = sr.getElementById('close');
      const inp   = sr.getElementById('inp');
      const send  = sr.getElementById('send');
      const sugs  = sr.getElementById('sugs');
      const themeBtn = sr.getElementById('themeBtn');
      const clearBtn = sr.getElementById('clearBtn');

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

      // Theme toggle
      themeBtn.addEventListener('click', () => {
        this._theme = this._theme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('afrobot_theme', this._theme);
        this._applyTheme();
      });

      // Clear chat
      clearBtn.addEventListener('click', () => {
        this._messages = [];
        const msgs = sr.getElementById('msgs');
        msgs.innerHTML = '<div class="msg msg-sys">Chat cleared. Ask me anything!</div>';
        sr.getElementById('sugs').style.display = '';
      });

      // Copy on message click
      sr.getElementById('msgs').addEventListener('click', e => {
        const copyBtn = e.target.closest('.msg-copy');
        if (!copyBtn) return;
        const msg = copyBtn.closest('.msg');
        if (!msg) return;
        const text = msg.innerText.replace(/Copy$/, '').trim();
        navigator.clipboard.writeText(text).then(() => {
          copyBtn.textContent = 'Copied!';
          setTimeout(() => { copyBtn.textContent = 'Copy'; }, 1500);
        });
      });

      // Close on outside click
      document.addEventListener('click', (e) => {
        if (!this._open) return;
        if (!this.contains(e.target) && !this.shadowRoot.contains(e.target)) this._close();
      });

      // Show subtle blue dot badge only if panel has never been opened
      if (!this._hasBeenOpened) {
        sr.getElementById('badge').classList.add('show');
      }
    }

    _applyTheme() {
      const vars = this._theme === 'light' ? LIGHT_VARS : DARK_VARS;
      const sr = this.shadowRoot;
      const panel = sr.getElementById('panelInner');
      const panelWrap = sr.getElementById('panel');
      const fab = sr.getElementById('fab');
      const badge = sr.getElementById('badge');
      if (!panel) return;

      // FAB theming
      fab.style.setProperty('--fab-bg', vars.fabBg);
      fab.style.setProperty('--fab-shadow', vars.fabShadow);
      fab.style.setProperty('--fab-hover-shadow', vars.fabHoverShadow);
      fab.style.background = vars.fabBg;
      fab.style.boxShadow = vars.fabShadow;

      // Badge border matches fab bg
      badge.style.borderColor = vars.fabBg;

      // Panel wrap theming
      panelWrap.style.setProperty('--panel-bg', vars.panelBg);
      panelWrap.style.setProperty('--panel-shadow', vars.panelShadow);
      panelWrap.style.background = vars.panelBg;
      panelWrap.style.boxShadow = vars.panelShadow;

      // Panel inner CSS vars
      panel.style.setProperty('--panel-bg', vars.panelBg);
      panel.style.setProperty('--header-bg', vars.headerBg);
      panel.style.setProperty('--title', vars.title);
      panel.style.setProperty('--sub', vars.sub);
      panel.style.setProperty('--border', vars.border);
      panel.style.setProperty('--msg-ai-bg', vars.msgAiBg);
      panel.style.setProperty('--msg-ai-color', vars.msgAiColor);
      panel.style.setProperty('--msg-ai-border', vars.msgAiBorder);
      panel.style.setProperty('--input-bg', vars.inputBg);
      panel.style.setProperty('--input-border', vars.inputBorder);
      panel.style.setProperty('--input-color', vars.inputColor);
      panel.style.setProperty('--input-placeholder', vars.inputPlaceholder);
      panel.style.setProperty('--qn-bg', vars.qnBg);
      panel.style.setProperty('--qn-color', vars.qnColor);
      panel.style.setProperty('--qn-hover-bg', vars.qnHoverBg);
      panel.style.setProperty('--sys-msg-color', vars.sysMsgColor);
      panel.style.setProperty('--scroll-thumb', vars.scrollThumb);
      panel.style.setProperty('--sug-bg', vars.sugBg);
      panel.style.setProperty('--sug-border', vars.sugBorder);
      panel.style.setProperty('--sug-color', vars.sugColor);
      panel.style.setProperty('--sug-hover-bg', vars.sugHoverBg);
      panel.style.setProperty('--copy-bg', vars.copyBg);
      panel.style.setProperty('--ai-badge-bg', vars.aiBadgeBg);
      panel.style.setProperty('--ai-badge-color', vars.aiBadgeColor);
      panel.style.setProperty('--ai-badge-border', vars.aiBadgeBorder);
      panel.style.setProperty('--link-color', vars.linkColor);

      // Update theme button icon
      const btn = sr.getElementById('themeBtn');
      if (this._theme === 'light') {
        btn.innerHTML = '<svg viewBox="0 0 16 16" fill="none"><path d="M13.5 8.5a5.5 5.5 0 01-6-6C4 3.5 1.5 6.5 1.5 10a5.5 5.5 0 0011 0c0-.5 0-1-.5-1.5z" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        btn.title = 'Switch to dark mode';
      } else {
        btn.innerHTML = '<svg viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="3.5" stroke="currentColor" stroke-width="1.5"/><path d="M8 1.5v1.5M8 13v1.5M1.5 8H3M13 8h1.5M3.4 3.4l1.1 1.1M11.5 11.5l1.1 1.1M3.4 12.6l1.1-1.1M11.5 4.5l1.1-1.1" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>';
        btn.title = 'Switch to light mode';
      }
    }

    _toggle() {
      this._open ? this._close() : this._open_panel();
    }

    _open_panel() {
      this._open = true;
      const panel = this.shadowRoot.getElementById('panel');
      const badge = this.shadowRoot.getElementById('badge');
      panel.classList.add('open');

      // Hide badge on first open and remember
      badge.classList.remove('show');
      if (!this._hasBeenOpened) {
        this._hasBeenOpened = true;
        localStorage.setItem('afrobot_opened', '1');
      }

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
      const path  = window.location.pathname;
      const title = document.title || '';
      const toolH1 = document.querySelector('h1')?.textContent?.trim() || '';
      if (path !== '/' && path !== '/index.html') {
        const ctx = toolH1 || title.split('\u2014')[0].trim();
        this._addMsg('sys', '\uD83D\uDCCD You\'re viewing: ' + ctx);
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

      // Build context
      const pageCtx = 'User is on page: ' + window.location.pathname + '. Page title: ' + document.title;
      const toolDir = buildToolDirectory();
      const systemPrompt = BASE_SYSTEM_PROMPT + toolDir + '\n\nPage context: ' + pageCtx;

      try {
        let reply;
        if (typeof window.AfroTools !== 'undefined' && window.AfroTools.ai) {
          reply = await window.AfroTools.ai.ask(
            this._messages[this._messages.length - 1].content,
            systemPrompt,
            this._messages.slice(0, -1)
          );
        } else {
          reply = this._offlineReply(this._messages[this._messages.length - 1].content);
        }
        this._hideTyping();
        this._addMsg('ai', reply);
        this._messages.push({ role: 'assistant', content: reply });

        // Check if reply mentions any tools — inject tool cards
        this._injectToolCards(reply);
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
      // Try to find matching tools from registry
      if (typeof AFRO_TOOLS !== 'undefined') {
        const matches = AFRO_TOOLS.filter(t => t.status === 'live' && (
          q.includes(t.name.toLowerCase()) ||
          t.name.toLowerCase().split(/\s+/).some(w => w.length > 3 && q.includes(w.toLowerCase()))
        )).slice(0, 3);
        if (matches.length > 0) {
          return matches.map(t => t.name + ': https://afrotools.com' + t.href).join('\n') + '\n\nClick any link above to open the tool!';
        }
      }

      if (q.includes('paye') || q.includes('tax') || q.includes('salary'))
        return 'We have PAYE calculators for 54 African countries! Here are the most popular:\n\n[Nigeria PAYE Calculator](https://afrotools.com/nigeria/ng-salary-tax)\n[Kenya PAYE Calculator](https://afrotools.com/kenya/ke-paye)\n[South Africa SARS Tax](https://afrotools.com/south-africa/za-paye)\n[Ghana PAYE + SSNIT](https://afrotools.com/ghana/gh-paye)\n\nHead to [Salary & Tax](https://afrotools.com/salary-tax) to find your country!';
      if (q.includes('pdf'))
        return 'AfroTools has 8+ PDF tools:\n\n[PDF Workspace](https://afrotools.com/tools/pdf-workspace) — Split, merge, rotate, compress\n[PDF Sign](https://afrotools.com/tools/pdf-sign) — Add digital signatures\n[PDF Compress](https://afrotools.com/tools/pdf-compress) — Reduce file size\n[PDF Password](https://afrotools.com/tools/pdf-password) — Protect with password\n\nAll files stay in your browser — never uploaded!';
      if (q.includes('bmi') || q.includes('weight') || q.includes('health'))
        return 'Our BMI Calculator gives you BMI, body fat estimate, macros, and health risk assessment. Find it in the [Health category](https://afrotools.com/health).';
      if (q.includes('cv') || q.includes('resume'))
        return 'Our [CV Builder](https://afrotools.com/tools/cv-builder) lets you create a professional resume with multiple templates, live preview, and PDF download. Completely free!';
      if (q.includes('currency') || q.includes('exchange'))
        return 'The [Currency Converter](https://afrotools.com/tools/currency-converter) supports 160+ currencies with real-time rates.';
      if (q.includes('link') || q.includes('url'))
        return 'I can give you direct links to any tool! Just tell me which tool you need. For example: "Give me the link to the Nigeria PAYE calculator" or "Where is the PDF merger?"';
      return 'I\'m AfroBot! I can help you find the right tool and give you **direct links**. Try asking:\n\n"Give me the link to Nigeria PAYE"\n"What PDF tools do you have?"\n"I need a CV builder"';
    }

    /** Inject clickable tool cards if the AI response mentions known tools */
    _injectToolCards(reply) {
      if (typeof AFRO_TOOLS === 'undefined') return;
      const lower = reply.toLowerCase();
      const mentioned = AFRO_TOOLS.filter(t => t.status === 'live' && (
        lower.includes(t.href) || lower.includes(t.name.toLowerCase())
      )).slice(0, 3); // max 3 cards

      if (mentioned.length === 0) return;

      const msgs = this.shadowRoot.getElementById('msgs');
      mentioned.forEach(t => {
        const card = document.createElement('a');
        card.className = 'tool-card';
        card.href = t.href;
        card.innerHTML = `
          <span class="tool-card-icon">${t.icon}</span>
          <div class="tool-card-info">
            <div class="tool-card-name">${t.name}</div>
            <div class="tool-card-desc">${t.desc}</div>
          </div>
          <span class="tool-card-arrow">&rsaquo;</span>
        `;
        msgs.appendChild(card);
      });
      msgs.scrollTop = msgs.scrollHeight;
    }

    _addMsg(type, text) {
      const msgs = this.shadowRoot.getElementById('msgs');
      const cls  = { user:'msg-user', ai:'msg-ai', sys:'msg-sys', err:'msg-err' }[type] || 'msg-ai';
      const div  = document.createElement('div');
      div.className = 'msg ' + cls;

      if (type === 'ai') {
        // Parse markdown links and bold
        div.innerHTML = parseMd(text);
        // Add copy button
        const copyBtn = document.createElement('button');
        copyBtn.className = 'msg-copy';
        copyBtn.textContent = 'Copy';
        div.appendChild(copyBtn);
      } else if (type === 'sys') {
        div.innerHTML = parseMd(text);
      } else {
        div.textContent = text;
      }

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
