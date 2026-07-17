/**
 * AFROTOOLS CHAT PANEL — Web Component
 * AI Advisor · Light-first, Apple-inspired · Theme-aware · Markdown support
 *
 * Usage:
 *   <afro-chat tool="ng-paye" context="Gross: 5M, Net: 342K"></afro-chat>
 */
(function () {
  'use strict';

  /* ── AfroBot mascot SVG — circuit-faced robot ── */
  const AFROBOT_SVG = `
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <!-- Antenna -->
      <line x1="16" y1="2" x2="16" y2="6" stroke="#60b5ff" stroke-width="1.5" stroke-linecap="round"/>
      <circle cx="16" cy="1.5" r="1.5" fill="#0062CC"/>
      <!-- Head -->
      <rect x="5" y="6" width="22" height="18" rx="5" fill="#1a2e4a"/>
      <rect x="5" y="6" width="22" height="18" rx="5" stroke="#2a4a6e" stroke-width="1"/>
      <!-- Left eye -->
      <rect x="8.5" y="11" width="5" height="5" rx="1.5" fill="#0062CC" opacity=".9"/>
      <rect x="9.5" y="12" width="2" height="2" rx=".5" fill="#60b5ff"/>
      <!-- Right eye -->
      <rect x="18.5" y="11" width="5" height="5" rx="1.5" fill="#0062CC" opacity=".9"/>
      <rect x="19.5" y="12" width="2" height="2" rx=".5" fill="#60b5ff"/>
      <!-- Mouth / signal indicator -->
      <rect x="10" y="19.5" width="12" height="1.5" rx=".75" fill="#60b5ff" opacity=".6"/>
      <!-- Ears/connectors -->
      <rect x="2" y="12" width="3" height="4" rx="1" fill="#1a2e4a" stroke="#2a4a6e" stroke-width=".8"/>
      <rect x="27" y="12" width="3" height="4" rx="1" fill="#1a2e4a" stroke="#2a4a6e" stroke-width=".8"/>
      <!-- Circuit dots -->
      <circle cx="9" cy="9" r=".8" fill="#0062CC" opacity=".4"/>
      <circle cx="23" cy="9" r=".8" fill="#0062CC" opacity=".4"/>
    </svg>`;

  /* ── Copy icon SVG ── */
  const COPY_SVG = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;
  const CHECK_SVG = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
  const RETRY_SVG = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>`;

  /* ── Markdown-lite parser (bold, links, newlines — no XSS) ── */
  function parseMd(text) {
    let s = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    // Links: [text](url)
    s = s.replace(/\[([^\]]+)\]\(((?:https?:\/\/[^\s)]+|\/[^\s)]+))\)/g,
      '<a href="$2" target="_blank" rel="noopener">$1</a>');
    // Bold: **text**
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    // Inline code: `text`
    s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
    // Newlines
    s = s.replace(/\n/g, '<br>');
    return s;
  }

  /* ── Session storage key for conversation history ── */
  function storageKey(tool) { return 'afrochat_history_' + (tool || 'global'); }

  class AfroChat extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this._messages     = [];
      this._loading      = false;
      this._initialized  = false;
      this._lastErrorMsg = null;
      this._totalTokens  = { input: 0, output: 0 };
      this._turns        = 0;
    }

    static get observedAttributes() { return ['context', 'tool', 'greeting']; }
    get tool()     { return this.getAttribute('tool')     || ''; }
    get context()  { return this.getAttribute('context')  || ''; }
    get greeting() { return this.getAttribute('greeting') || ''; }

    connectedCallback() {
      this._render();
      this._bind();
      this._restoreHistory();
      this._initialized = true;
    }

    attributeChangedCallback(name, oldVal, newVal) {
      if (!this._initialized) return;
      if (name === 'context' && newVal && newVal !== oldVal) this._autoAnalyze();
    }

    /* ══════════════════════════════════════════════════
       RENDER
    ══════════════════════════════════════════════════ */
    _render() {
      this.shadowRoot.innerHTML = `
        <style>
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

          :host {
            --ac-primary: #0062CC;
            --ac-bg: #F8FAFD;
            --ac-card: #ffffff;
            --ac-border: #E2E8F0;
            --ac-text: #0f172a;
            --ac-text-muted: #64748b;
            --ac-msg-ai: #F1F5F9;
            --ac-msg-ai-border: #E2E8F0;
            --ac-input-bg: #ffffff;
            --ac-scrollbar: #CBD5E1;
            --ac-code-bg: #F1F5F9;
            --ac-shimmer-from: #F1F5F9;
            --ac-shimmer-to: #E2E8F0;
            display: block;
            font-family: 'DM Sans', -apple-system, 'SF Pro Text', system-ui, sans-serif;
          }

          @media (prefers-color-scheme: dark) {
            :host {
              --ac-bg: #0B1120;
              --ac-card: #131D2E;
              --ac-border: #1E2D40;
              --ac-text: #E2E8F0;
              --ac-text-muted: #8B9CB8;
              --ac-msg-ai: #1E293B;
              --ac-msg-ai-border: #1E2D40;
              --ac-input-bg: #131D2E;
              --ac-scrollbar: #1E2D40;
              --ac-code-bg: #1E293B;
              --ac-shimmer-from: #1E293B;
              --ac-shimmer-to: #2D3B4E;
            }
          }

          /* ── Card shell ── */
          .chat-card {
            background: var(--ac-card);
            border: 1px solid var(--ac-border);
            border-top: 3px solid var(--ac-primary);
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0,0,0,.04), 0 4px 12px rgba(0,0,0,.03);
          }

          /* ── Collapsed by default ── */
          .chat-card .chat-messages,
          .chat-card .chat-input-area,
          .chat-card .chat-disclaimer {
            display: none;
          }
          .chat-card.expanded .chat-messages {
            display: flex;
          }
          .chat-card.expanded .chat-input-area,
          .chat-card.expanded .chat-disclaimer {
            display: block;
          }

          /* ── Header ── */
          .chat-header {
            padding: 12px 16px;
            background: var(--ac-card);
            display: flex;
            align-items: center;
            gap: 10px;
            border-bottom: 1px solid var(--ac-border);
            cursor: pointer;
            user-select: none;
            transition: background .15s;
          }
          .chat-header:hover {
            background: var(--ac-bg);
          }
          .chat-toggle {
            font-size: .72rem;
            font-weight: 600;
            color: var(--ac-primary);
            margin-left: auto;
            white-space: nowrap;
          }
          .chat-card.expanded .chat-header {
            border-bottom: 1px solid var(--ac-border);
          }
          .chat-card:not(.expanded) .chat-header {
            border-bottom: none;
          }
          .bot-icon {
            flex-shrink: 0;
            width: 32px;
            height: 32px;
          }
          .header-text { flex: 1; min-width: 0; }
          .chat-title {
            font-size: 0.84rem;
            font-weight: 700;
            color: var(--ac-text);
            line-height: 1.2;
            letter-spacing: -.01em;
          }
          .chat-sub {
            font-size: 0.68rem;
            color: var(--ac-text-muted);
            margin-top: 1px;
          }
          .live-dot {
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background: var(--ac-primary);
            box-shadow: 0 0 6px var(--ac-primary);
            animation: ac-pulse 2.2s ease-in-out infinite;
            flex-shrink: 0;
          }
          @keyframes ac-pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: .4; transform: scale(.75); }
          }

          /* ── Messages area ── */
          .chat-messages {
            min-height: 120px;
            max-height: 360px;
            overflow-y: auto;
            padding: 16px;
            display: flex;
            flex-direction: column;
            gap: 10px;
            background: var(--ac-bg);
            scrollbar-width: thin;
            scrollbar-color: var(--ac-scrollbar) transparent;
          }
          .chat-messages::-webkit-scrollbar { width: 5px; }
          .chat-messages::-webkit-scrollbar-thumb {
            background: var(--ac-scrollbar);
            border-radius: 4px;
          }

          /* ── Empty state ── */
          .empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 24px 16px;
            text-align: center;
            color: var(--ac-text-muted);
          }
          .empty-state .empty-icon {
            width: 40px;
            height: 40px;
            opacity: .5;
          }
          .empty-state .empty-title {
            font-size: 0.84rem;
            font-weight: 600;
            color: var(--ac-text);
          }
          .empty-state .empty-desc {
            font-size: 0.76rem;
            line-height: 1.5;
            max-width: 280px;
          }
          .empty-state .empty-hint {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            margin-top: 4px;
            font-size: 0.7rem;
            color: var(--ac-primary);
            font-weight: 600;
          }

          /* ── Message bubbles ── */
          .msg {
            padding: 10px 14px;
            border-radius: 12px;
            font-size: 0.83rem;
            line-height: 1.65;
            max-width: 90%;
            word-break: break-word;
            position: relative;
          }
          .msg-user {
            background: var(--ac-primary);
            color: #fff;
            align-self: flex-end;
            border-bottom-right-radius: 4px;
          }
          .msg-ai {
            background: var(--ac-msg-ai);
            color: var(--ac-text);
            align-self: flex-start;
            border-bottom-left-radius: 4px;
            border: 1px solid var(--ac-msg-ai-border);
          }
          .msg-ai a {
            color: var(--ac-primary);
            text-decoration: underline;
            font-weight: 600;
          }
          .msg-ai a:hover { opacity: .8; }
          .msg-ai strong { font-weight: 700; }
          .msg-ai code {
            font-family: 'SF Mono', 'Fira Code', monospace;
            font-size: 0.78rem;
            background: var(--ac-code-bg);
            padding: 1px 5px;
            border-radius: 4px;
            border: 1px solid var(--ac-border);
          }
          .msg-system {
            background: transparent;
            color: var(--ac-text-muted);
            align-self: center;
            text-align: center;
            font-size: 0.76rem;
            font-style: italic;
            max-width: 100%;
          }
          .msg-error {
            background: rgba(220,53,69,.06);
            color: #DC3545;
            align-self: flex-start;
            border-left: 3px solid #DC3545;
            border-radius: 8px;
          }

          /* ── Copy button on AI messages ── */
          .msg-ai .msg-copy {
            position: absolute;
            top: 6px;
            right: 6px;
            background: var(--ac-card);
            border: 1px solid var(--ac-border);
            border-radius: 6px;
            padding: 4px 6px;
            cursor: pointer;
            color: var(--ac-text-muted);
            font-size: 0;
            line-height: 0;
            opacity: 0;
            transition: opacity .15s, background .15s, color .15s;
            display: flex;
            align-items: center;
            gap: 3px;
          }
          .msg-ai:hover .msg-copy { opacity: 1; }
          .msg-copy:hover {
            background: var(--ac-msg-ai);
            color: var(--ac-primary);
          }
          .msg-copy.copied {
            color: #22C55E;
            opacity: 1;
          }

          /* ── Retry button on errors ── */
          .msg-retry {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            margin-top: 6px;
            background: none;
            border: 1px solid #DC3545;
            border-radius: 6px;
            padding: 4px 10px;
            color: #DC3545;
            font-size: 0.72rem;
            font-weight: 600;
            font-family: inherit;
            cursor: pointer;
            transition: background .15s;
          }
          .msg-retry:hover { background: rgba(220,53,69,.06); }

          /* ── Shimmer loading skeleton ── */
          .chat-loading {
            align-self: flex-start;
            display: flex;
            flex-direction: column;
            gap: 8px;
            padding: 14px 16px;
            background: var(--ac-msg-ai);
            border: 1px solid var(--ac-msg-ai-border);
            border-radius: 12px;
            border-bottom-left-radius: 4px;
            width: 75%;
            max-width: 320px;
          }
          .chat-loading .shimmer-label {
            font-size: 0.7rem;
            color: var(--ac-text-muted);
            font-weight: 600;
            margin-bottom: 2px;
          }
          .shimmer-line {
            height: 10px;
            border-radius: 5px;
            background: linear-gradient(
              90deg,
              var(--ac-shimmer-from) 25%,
              var(--ac-shimmer-to) 50%,
              var(--ac-shimmer-from) 75%
            );
            background-size: 200% 100%;
            animation: ac-shimmer 1.4s ease-in-out infinite;
          }
          .shimmer-line:nth-child(2) { width: 100%; }
          .shimmer-line:nth-child(3) { width: 85%; animation-delay: .1s; }
          .shimmer-line:nth-child(4) { width: 60%; animation-delay: .2s; }
          @keyframes ac-shimmer {
            0%   { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }

          /* ── Input area ── */
          .chat-input-area {
            border-top: 1px solid var(--ac-border);
            background: var(--ac-card);
            padding: 12px 14px 8px;
          }
          .chat-input-row {
            display: flex;
            gap: 8px;
            align-items: flex-end;
          }
          .chat-input {
            flex: 1;
            background: var(--ac-input-bg);
            border: 1px solid var(--ac-border);
            border-radius: 10px;
            padding: 9px 13px;
            color: var(--ac-text);
            font-size: 0.82rem;
            font-family: inherit;
            outline: none;
            resize: none;
            transition: border-color .18s, box-shadow .18s;
          }
          .chat-input::placeholder { color: var(--ac-text-muted); opacity: .6; }
          .chat-input:focus {
            border-color: var(--ac-primary);
            box-shadow: 0 0 0 3px rgba(0,98,204,.1);
          }
          .chat-send {
            background: var(--ac-primary);
            color: #fff;
            border: none;
            border-radius: 10px;
            padding: 9px 18px;
            font-size: 0.78rem;
            font-weight: 700;
            cursor: pointer;
            font-family: inherit;
            white-space: nowrap;
            transition: background .18s, transform .1s;
          }
          .chat-send:hover { background: #0062D1; }
          .chat-send:active { transform: scale(.96); }
          .chat-send:disabled { opacity: .4; cursor: not-allowed; transform: none; }

          /* ── Character count ── */
          .input-meta {
            display: flex;
            justify-content: flex-end;
            padding: 4px 2px 0;
          }
          .char-count {
            font-size: 0.65rem;
            color: var(--ac-text-muted);
            opacity: 0;
            transition: opacity .15s;
          }
          .char-count.visible { opacity: 1; }
          .char-count.warn { color: #F59E0B; }
          .char-count.over { color: #DC3545; }

          /* ── Disclaimer footer ── */
          .chat-disclaimer {
            padding: 6px 16px 8px;
            background: var(--ac-card);
            font-size: 0.62rem;
            color: var(--ac-text-muted);
            text-align: center;
            opacity: .7;
            border-top: 1px solid var(--ac-border);
          }

          /* ── Typewriter cursor ── */
          @keyframes ac-blink { 0%,100%{opacity:1} 50%{opacity:0} }
          .msg-ai .tw-cursor {
            display: inline-block;
            width: 2px;
            height: 1em;
            background: var(--ac-primary);
            margin-left: 2px;
            vertical-align: text-bottom;
            animation: ac-blink .6s steps(1) infinite;
          }

          /* ── Token usage footer ── */
          .chat-usage {
            display: none;
            font-size: 0.62rem;
            color: var(--ac-text-muted);
            padding: 4px 16px;
            text-align: right;
            opacity: .6;
            font-family: 'JetBrains Mono', 'Fira Code', monospace;
          }
          .chat-card.expanded .chat-usage { display: block; }

          /* ── Compact button ── */
          .chat-compact {
            display: none;
            font-size: 0.66rem;
            font-weight: 600;
            color: var(--ac-primary);
            background: none;
            border: 1px dashed var(--ac-border);
            border-radius: 6px;
            padding: 4px 10px;
            cursor: pointer;
            align-self: center;
            transition: background .13s;
          }
          .chat-compact:hover { background: rgba(0,98,204,.06); }
          .chat-compact.visible { display: inline-flex; }

          /* ── Rate limit CTA (inline) ── */
          .rate-limit-inline {
            font-size: 0.76rem;
            color: var(--ac-text-muted);
            padding: 8px 12px;
            background: rgba(245,166,35,.06);
            border: 1px solid rgba(245,166,35,.15);
            border-radius: 8px;
            text-align: center;
            align-self: stretch;
          }
          .rate-limit-inline a {
            color: #F59E0B;
            font-weight: 700;
            text-decoration: underline;
          }
        </style>

        <div class="chat-card">
          <div class="chat-header" id="chatToggle">
            <div class="bot-icon">${AFROBOT_SVG}</div>
            <div class="header-text">
              <div class="chat-title">AI Advisor</div>
              <div class="chat-sub">Optional AI · provider required</div>
            </div>
            <span class="chat-toggle" id="toggleLabel">Open chat ▾</span>
            <div class="live-dot"></div>
          </div>

          <div class="chat-messages" id="messages"></div>

          <div class="chat-input-area">
            <div class="chat-input-row">
              <input class="chat-input" id="input" type="text"
                     placeholder="Ask a follow-up question\u2026" autocomplete="off"
                     maxlength="1000">
              <button class="chat-send" id="send">Send</button>
            </div>
            <div class="input-meta">
              <span class="char-count" id="charcount">0 / 1000</span>
            </div>
          </div>

          <div class="chat-usage" id="usage"></div>

          <div class="chat-disclaimer">
            AI responses may contain errors. Verify important information.
          </div>
        </div>
      `;
    }

    /* ══════════════════════════════════════════════════
       BIND EVENTS
    ══════════════════════════════════════════════════ */
    _bind() {
      const $ = s => this.shadowRoot.querySelector(s);
      const input = $('#input');
      const send  = $('#send');
      const cc    = $('#charcount');

      // Toggle chat open/closed
      $('#chatToggle').addEventListener('click', () => {
        const card = this.shadowRoot.querySelector('.chat-card');
        const label = $('#toggleLabel');
        card.classList.toggle('expanded');
        label.textContent = card.classList.contains('expanded') ? 'Close ▴' : 'Open chat ▾';
        if (card.classList.contains('expanded')) input.focus();
      });

      send.addEventListener('click', () => this._sendMessage());

      input.addEventListener('keydown', e => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this._sendMessage(); }
      });

      input.addEventListener('input', () => {
        const len = input.value.length;
        cc.textContent = len + ' / 1000';
        cc.classList.toggle('visible', len > 0);
        cc.classList.toggle('warn', len > 800 && len <= 1000);
        cc.classList.toggle('over', len >= 1000);
      });

      // Delegate clicks inside messages area
      this.shadowRoot.getElementById('messages').addEventListener('click', e => {
        const copyBtn = e.target.closest('.msg-copy');
        if (copyBtn) { this._handleCopy(copyBtn); return; }
        const retryBtn = e.target.closest('.msg-retry');
        if (retryBtn) { this._handleRetry(); return; }
      });
    }

    /* ══════════════════════════════════════════════════
       CONVERSATION HISTORY
    ══════════════════════════════════════════════════ */
    _restoreHistory() {
      try {
        const raw = sessionStorage.getItem(storageKey(this.tool));
        if (raw) {
          const saved = JSON.parse(raw);
          if (Array.isArray(saved) && saved.length) {
            this._messages = saved;
            saved.forEach(m => {
              if (m.role === 'user')      this._addMessage('user', m.content);
              else if (m.role === 'assistant') this._addMessage('assistant', m.content);
            });
            return;
          }
        }
      } catch (_) { /* ignore corrupt data */ }
      this._showEmptyState();
    }

    _persistHistory() {
      try {
        sessionStorage.setItem(storageKey(this.tool), JSON.stringify(this._messages));
      } catch (_) { /* quota exceeded — silent */ }
    }

    /* ══════════════════════════════════════════════════
       EMPTY STATE
    ══════════════════════════════════════════════════ */
    _showEmptyState() {
      const c = this.shadowRoot.getElementById('messages');
      if (this.greeting) {
        this._addMessage('system', this.greeting);
        return;
      }
      const el = document.createElement('div');
      el.className = 'empty-state';
      el.innerHTML = `
        <div class="empty-icon">${AFROBOT_SVG}</div>
        <div class="empty-title">AI Advisor</div>
        <div class="empty-desc">
          Run a calculation to get a personalised AI analysis, or type a question below.
        </div>
        <span class="empty-hint">
          ${RETRY_SVG} Try: "How can I reduce my tax?"
        </span>
      `;
      c.appendChild(el);
    }

    /* ══════════════════════════════════════════════════
       SEND / AUTO-ANALYZE
    ══════════════════════════════════════════════════ */
    async _sendMessage() {
      const input = this.shadowRoot.getElementById('input');
      const text  = input.value.trim();
      if (!text || this._loading) return;
      input.value = '';
      // Reset char counter
      const cc = this.shadowRoot.getElementById('charcount');
      cc.textContent = '0 / 1000';
      cc.classList.remove('visible', 'warn', 'over');
      // Clear empty state if present
      const empty = this.shadowRoot.querySelector('.empty-state');
      if (empty) empty.remove();

      this._addMessage('user', text);
      this._messages.push({ role: 'user', content: text });
      this._persistHistory();
      await this._callAI();
    }

    async _autoAnalyze() {
      if (this._loading) return;
      const ctx = this.context;
      if (!ctx) return;
      // Auto-expand when analysis runs
      const card = this.shadowRoot.querySelector('.chat-card');
      const label = this.shadowRoot.querySelector('#toggleLabel');
      if (card && !card.classList.contains('expanded')) {
        card.classList.add('expanded');
        if (label) label.textContent = 'Close \u25B4';
      }
      const prompt = `Based on this calculation: ${ctx}. Give a brief, helpful summary and key tips for an African user.`;
      this._messages = [{ role: 'user', content: prompt }];
      this._clearMessages();
      this._addMessage('system', 'Analysing your result\u2026');
      this._persistHistory();
      await this._callAI();
    }

    /* ══════════════════════════════════════════════════
       AI CALL
    ══════════════════════════════════════════════════ */
    async _callAI() {
      this._loading = true;
      this._lastErrorMsg = null;
      const send = this.shadowRoot.getElementById('send');
      send.disabled = true;
      this._showLoading();

      try {
        // Compact history if it's getting long (keep last 6 messages)
        const messagesToSend = this._getCompactedHistory();
        const lastMsg = messagesToSend[messagesToSend.length - 1].content;
        const history = messagesToSend.slice(0, -1);
        let reply, usage;
        if (typeof window.AfroTools !== 'undefined' && window.AfroTools.ai && typeof window.AfroTools.ai.ask === 'function') {
          reply = await window.AfroTools.ai.ask(lastMsg, '', history, { tool: this.tool, context: this.context });
        } else {
          const res = await fetch('/.netlify/functions/ai-advisor', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: lastMsg, messages: history, tool: this.tool, context: this.context })
          });
          if (!res.ok) throw new Error(`Request failed (${res.status})`);
          const data = await res.json();
          reply = data.reply || data.text || '';
          usage = data.usage || null;
        }
        this._hideLoading();
        // Typewriter effect for assistant messages
        await this._typewriterMessage(reply);
        this._messages.push({ role: 'assistant', content: reply });
        this._turns++;
        this._updateUsage(usage);
        this._persistHistory();
      } catch (err) {
        this._hideLoading();
        this._lastErrorMsg = this._messages[this._messages.length - 1]?.content || '';
        const isRateLimit = err.message && (err.message.includes('limit') || err.message.includes('rate'));
        this._addMessage('error', err.message || 'Something went wrong. Please try again.');
        if (isRateLimit) this._showRateLimitCTA();
      }

      this._loading = false;
      send.disabled = false;
    }

    /* ══════════════════════════════════════════════════
       TYPEWRITER — word-by-word rendering with cursor
    ══════════════════════════════════════════════════ */
    async _typewriterMessage(text) {
      const c = this.shadowRoot.getElementById('messages');
      const div = document.createElement('div');
      div.className = 'msg msg-ai';
      c.appendChild(div);

      const words = text.split(/(\s+)/); // keep whitespace tokens
      const cursor = document.createElement('span');
      cursor.className = 'tw-cursor';
      div.appendChild(cursor);

      let accumulated = '';
      for (let i = 0; i < words.length; i++) {
        accumulated += words[i];
        // Re-render parsed markdown every few words for performance
        if (i % 4 === 3 || i === words.length - 1) {
          div.innerHTML = parseMd(accumulated);
          div.appendChild(cursor);
          c.scrollTop = c.scrollHeight;
        }
        // 8ms per word-token for typewriter feel
        if (i < words.length - 1) {
          await new Promise(r => setTimeout(r, 8));
        }
      }

      // Remove cursor, add final parsed content + copy button
      div.innerHTML = parseMd(text);
      const copyBtn = document.createElement('button');
      copyBtn.className = 'msg-copy';
      copyBtn.innerHTML = COPY_SVG;
      copyBtn.setAttribute('aria-label', 'Copy message');
      copyBtn.dataset.text = text;
      div.appendChild(copyBtn);
      c.scrollTop = c.scrollHeight;
    }

    /* ══════════════════════════════════════════════════
       TOKEN USAGE TRACKING
    ══════════════════════════════════════════════════ */
    _updateUsage(usage) {
      if (usage) {
        this._totalTokens.input += usage.input_tokens || 0;
        this._totalTokens.output += usage.output_tokens || 0;
      }
      const el = this.shadowRoot.getElementById('usage');
      if (!el) return;
      const total = this._totalTokens.input + this._totalTokens.output;
      if (total > 0) {
        // Haiku pricing: ~$0.25/MTok input, ~$1.25/MTok output
        const cost = (this._totalTokens.input * 0.25 + this._totalTokens.output * 1.25) / 1000000;
        el.textContent = this._turns + ' turn' + (this._turns !== 1 ? 's' : '') +
          ' \u00B7 ~' + total.toLocaleString() + ' tokens' +
          (cost >= 0.001 ? ' \u00B7 ~$' + cost.toFixed(4) : '');
      } else {
        el.textContent = this._turns + ' turn' + (this._turns !== 1 ? 's' : '');
      }
    }

    /* ══════════════════════════════════════════════════
       HISTORY COMPACTION — keep last 6 messages, summarize rest
    ══════════════════════════════════════════════════ */
    _getCompactedHistory() {
      if (this._messages.length <= 8) return this._messages;

      // Keep last 6 messages, summarize older ones
      const older = this._messages.slice(0, -6);
      const recent = this._messages.slice(-6);

      // Build a brief summary of older messages
      const summary = older.map(m =>
        (m.role === 'user' ? 'User: ' : 'AI: ') +
        m.content.substring(0, 120) + (m.content.length > 120 ? '...' : '')
      ).join(' | ');

      // Ensure alternating roles: summary as user, then a placeholder assistant reply
      return [
        { role: 'user', content: '[Previous conversation summary: ' + summary + ']' },
        { role: 'assistant', content: 'Understood. I have context from our earlier conversation. How can I help?' },
        ...recent
      ];
    }

    /* ══════════════════════════════════════════════════
       MESSAGE RENDERING
    ══════════════════════════════════════════════════ */
    _addMessage(type, text) {
      const c   = this.shadowRoot.getElementById('messages');
      const cls = {
        user: 'msg-user', assistant: 'msg-ai',
        system: 'msg-system', error: 'msg-error'
      }[type] || 'msg-ai';

      const div = document.createElement('div');
      div.className = 'msg ' + cls;

      if (type === 'assistant') {
        // Non-typewriter fallback (history restore)
        div.innerHTML = parseMd(text);
        const copyBtn = document.createElement('button');
        copyBtn.className = 'msg-copy';
        copyBtn.innerHTML = COPY_SVG;
        copyBtn.setAttribute('aria-label', 'Copy message');
        copyBtn.dataset.text = text;
        div.appendChild(copyBtn);
      } else if (type === 'error') {
        div.textContent = text;
        // Retry button
        const retryBtn = document.createElement('button');
        retryBtn.className = 'msg-retry';
        retryBtn.innerHTML = RETRY_SVG + ' Retry';
        div.appendChild(retryBtn);
      } else if (type === 'system') {
        div.innerHTML = parseMd(text);
      } else {
        div.textContent = text;
      }

      c.appendChild(div);
      c.scrollTop = c.scrollHeight;
    }

    _clearMessages() {
      this.shadowRoot.getElementById('messages').innerHTML = '';
    }

    /* ══════════════════════════════════════════════════
       LOADING — Shimmer skeleton
    ══════════════════════════════════════════════════ */
    _showLoading() {
      const c = this.shadowRoot.getElementById('messages');
      const l = document.createElement('div');
      l.className = 'chat-loading';
      l.id = 'loader';
      l.innerHTML = `
        <div class="shimmer-label">Analysing your result\u2026</div>
        <div class="shimmer-line"></div>
        <div class="shimmer-line"></div>
        <div class="shimmer-line"></div>
      `;
      c.appendChild(l);
      c.scrollTop = c.scrollHeight;
    }

    _hideLoading() {
      const l = this.shadowRoot.getElementById('loader');
      if (l) l.remove();
    }

    /* ══════════════════════════════════════════════════
       COPY HANDLER
    ══════════════════════════════════════════════════ */
    _handleCopy(btn) {
      const text = btn.dataset.text || btn.closest('.msg-ai')?.textContent || '';
      navigator.clipboard.writeText(text).then(() => {
        btn.innerHTML = CHECK_SVG;
        btn.classList.add('copied');
        setTimeout(() => {
          btn.innerHTML = COPY_SVG;
          btn.classList.remove('copied');
        }, 1800);
      }).catch(() => {
        // Fallback: select text
        const range = document.createRange();
        range.selectNodeContents(btn.closest('.msg-ai'));
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      });
    }

    /* ══════════════════════════════════════════════════
       RETRY HANDLER
    ══════════════════════════════════════════════════ */
    _handleRetry() {
      if (this._loading) return;
      // Remove the error message from DOM
      const msgs = this.shadowRoot.getElementById('messages');
      const lastErr = msgs.querySelector('.msg-error:last-of-type');
      if (lastErr) lastErr.remove();
      // Remove rate-limit CTA if present
      const rl = msgs.querySelector('.rate-limit-inline');
      if (rl) rl.remove();
      // Re-run the AI call
      this._callAI();
    }

    /* ══════════════════════════════════════════════════
       RATE LIMIT CTA (inline)
    ══════════════════════════════════════════════════ */
    _showRateLimitCTA() {
      const c   = this.shadowRoot.getElementById('messages');
      const div = document.createElement('div');
      div.className = 'rate-limit-inline';
      div.innerHTML = 'You\u2019ve hit the daily limit. <a href="/dashboard/">Sign up free</a> for more AI questions.';
      c.appendChild(div);
      c.scrollTop = c.scrollHeight;
    }
  }

  if (!customElements.get('afro-chat')) {
    customElements.define('afro-chat', AfroChat);
  }
})();
