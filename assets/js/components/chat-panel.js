/**
 * AFROTOOLS CHAT PANEL — Web Component
 * AI Advisor · Dark navy theme · AfroBot mascot · Rainbow glow
 *
 * Usage:
 *   <afro-chat tool="ng-paye" context="Gross: 5M, Net: 342K"></afro-chat>
 */
(function () {
  'use strict';

  // AfroBot mascot SVG — circuit-faced robot
  const AFROBOT_SVG = `
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <!-- Antenna -->
      <line x1="16" y1="2" x2="16" y2="6" stroke="#60b5ff" stroke-width="1.5" stroke-linecap="round"/>
      <circle cx="16" cy="1.5" r="1.5" fill="#5ddb9e"/>
      <!-- Head -->
      <rect x="5" y="6" width="22" height="18" rx="5" fill="#1a2e4a"/>
      <rect x="5" y="6" width="22" height="18" rx="5" stroke="#2a4a6e" stroke-width="1"/>
      <!-- Left eye -->
      <rect x="8.5" y="11" width="5" height="5" rx="1.5" fill="#5ddb9e" opacity=".9"/>
      <rect x="9.5" y="12" width="2" height="2" rx=".5" fill="#60b5ff"/>
      <!-- Right eye -->
      <rect x="18.5" y="11" width="5" height="5" rx="1.5" fill="#5ddb9e" opacity=".9"/>
      <rect x="19.5" y="12" width="2" height="2" rx=".5" fill="#60b5ff"/>
      <!-- Mouth / signal indicator -->
      <rect x="10" y="19.5" width="12" height="1.5" rx=".75" fill="#60b5ff" opacity=".6"/>
      <!-- Ears/connectors -->
      <rect x="2" y="12" width="3" height="4" rx="1" fill="#1a2e4a" stroke="#2a4a6e" stroke-width=".8"/>
      <rect x="27" y="12" width="3" height="4" rx="1" fill="#1a2e4a" stroke="#2a4a6e" stroke-width=".8"/>
      <!-- Circuit dots -->
      <circle cx="9" cy="9" r=".8" fill="#5ddb9e" opacity=".4"/>
      <circle cx="23" cy="9" r=".8" fill="#5ddb9e" opacity=".4"/>
    </svg>`;

  class AfroChat extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this._messages   = [];
      this._loading    = false;
      this._initialized = false;
    }

    static get observedAttributes() { return ['context','tool','greeting']; }
    get tool()     { return this.getAttribute('tool')     || ''; }
    get context()  { return this.getAttribute('context')  || ''; }
    get greeting() { return this.getAttribute('greeting') || ''; }

    connectedCallback()  { this._render(); this._bind(); this._initialized = true; }

    attributeChangedCallback(name, oldVal, newVal) {
      if (!this._initialized) return;
      if (name === 'context' && newVal && newVal !== oldVal) this._autoAnalyze();
    }

    _render() {
      this.shadowRoot.innerHTML = `
        <style>
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

          :host {
            display: block;
            font-family: -apple-system, 'SF Pro Text', 'DM Sans', system-ui, sans-serif;
          }

          /* ── Rainbow glow container ── */
          .glow-ring {
            border-radius: 16px;
            padding: 2px;
            background: linear-gradient(
              135deg,
              #ff0000, #ff7700, #ffee00, #00cc44, #0077ff, #6600cc, #cc00ff, #ff0000
            );
            background-size: 400% 400%;
            animation: rainbow-shift 5s linear infinite;
            box-shadow:
              0 0 18px 2px rgba(0,119,255,.35),
              0 0 32px 4px rgba(102,0,204,.2),
              0 0 8px 1px rgba(255,119,0,.25);
          }
          @keyframes rainbow-shift {
            0%   { background-position: 0% 50%; }
            50%  { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }

          /* ── Inner panel ── */
          .chat-wrap {
            background: #0d1117;
            border-radius: 14px;
            overflow: hidden;
          }

          /* ── Header ── */
          .chat-header {
            padding: 12px 16px;
            background: linear-gradient(135deg, #0d1117 0%, #111827 100%);
            display: flex;
            align-items: center;
            gap: 10px;
            border-bottom: 1px solid rgba(255,255,255,.06);
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
            color: #f0f6fc;
            line-height: 1.2;
            letter-spacing: -.01em;
          }
          .chat-sub {
            font-size: 0.68rem;
            color: #6e7681;
            margin-top: 1px;
          }
          .chat-badge {
            font-size: 0.58rem;
            font-weight: 800;
            color: #60b5ff;
            background: rgba(93,219,158,.18);
            padding: 2px 8px;
            border-radius: 100px;
            letter-spacing: .06em;
            text-transform: uppercase;
            border: 1px solid rgba(96,181,255,.2);
          }
          /* Live pulse dot */
          .live-dot {
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background: #22c55e;
            box-shadow: 0 0 6px #22c55e;
            animation: pulse 2.2s ease-in-out infinite;
            flex-shrink: 0;
          }
          @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.45;transform:scale(.8)} }

          /* ── Messages area ── */
          .chat-messages {
            min-height: 120px;
            max-height: 340px;
            overflow-y: auto;
            padding: 14px 16px;
            display: flex;
            flex-direction: column;
            gap: 10px;
            scrollbar-width: thin;
            scrollbar-color: #21262d transparent;
          }
          .chat-messages::-webkit-scrollbar { width: 4px; }
          .chat-messages::-webkit-scrollbar-thumb { background: #21262d; border-radius: 4px; }

          .msg {
            padding: 9px 13px;
            border-radius: 10px;
            font-size: 0.83rem;
            line-height: 1.65;
            max-width: 90%;
            word-break: break-word;
          }
          .msg-user {
            background: var(--color-primary);
            color: #fff;
            align-self: flex-end;
            border-bottom-right-radius: 2px;
          }
          .msg-ai {
            background: #161b22;
            color: #c9d1d9;
            align-self: flex-start;
            border-bottom-left-radius: 2px;
            border: 1px solid rgba(255,255,255,.06);
          }
          .msg-system {
            background: transparent;
            color: #484f58;
            align-self: center;
            text-align: center;
            font-size: 0.75rem;
            font-style: italic;
            max-width: 100%;
          }
          .msg-error {
            background: rgba(220,53,69,.12);
            color: #f87171;
            align-self: flex-start;
            border-left: 3px solid #dc3545;
          }

          /* ── Typing indicator ── */
          .chat-loading {
            display: flex;
            gap: 4px;
            padding: 9px 13px;
            align-self: flex-start;
            background: #161b22;
            border-radius: 10px;
            border-bottom-left-radius: 2px;
            border: 1px solid rgba(255,255,255,.06);
          }
          .chat-loading span {
            width: 6px;
            height: 6px;
            background: var(--color-primary);
            border-radius: 50%;
            animation: bounce .65s infinite alternate;
          }
          .chat-loading span:nth-child(2) { animation-delay: .14s; }
          .chat-loading span:nth-child(3) { animation-delay: .28s; }
          @keyframes bounce { to { transform: translateY(-5px); opacity:.35; } }

          /* ── Input area ── */
          .chat-input-wrap {
            display: flex;
            gap: 8px;
            padding: 12px 14px;
            border-top: 1px solid rgba(255,255,255,.06);
            background: #0d1117;
          }
          .chat-input {
            flex: 1;
            background: #161b22;
            border: 1px solid rgba(255,255,255,.1);
            border-radius: 9px;
            padding: 9px 13px;
            color: #e6edf3;
            font-size: 0.82rem;
            font-family: inherit;
            outline: none;
            resize: none;
            transition: border-color .18s;
          }
          .chat-input::placeholder { color: #30363d; }
          .chat-input:focus { border-color: rgba(93,219,158,.6); }
          .chat-send {
            background: var(--color-primary);
            color: #fff;
            border: none;
            border-radius: 9px;
            padding: 9px 15px;
            font-size: 0.78rem;
            font-weight: 700;
            cursor: pointer;
            font-family: inherit;
            white-space: nowrap;
            transition: background .18s, transform .1s;
          }
          .chat-send:hover { background: #0062c4; }
          .chat-send:active { transform: scale(.96); }
          .chat-send:disabled { opacity: .45; cursor: not-allowed; transform: none; }

          /* ── Rate limit CTA ── */
          .rate-limit {
            padding: 8px 16px;
            background: rgba(245,166,35,.08);
            border-top: 1px solid rgba(245,166,35,.18);
            font-size: 0.76rem;
            color: #6e7681;
          }
          .rate-limit a { color: #f5a623; text-decoration: underline; }
        </style>

        <div class="glow-ring">
          <div class="chat-wrap">
            <div class="chat-header">
              <div class="bot-icon">${AFROBOT_SVG}</div>
              <div class="header-text">
                <div class="chat-title">AI Advisor</div>
                <div class="chat-sub">Powered by Claude · AfroTools</div>
              </div>
              <div class="live-dot"></div>
              <span class="chat-badge">AI</span>
            </div>
            <div class="chat-messages" id="messages">
              <div class="msg msg-system">${this.greeting || 'Run a calculation to get your personalised AI analysis — or ask me anything below.'}</div>
            </div>
            <div class="chat-input-wrap">
              <input class="chat-input" id="input" type="text"
                     placeholder="Ask a follow-up question…" autocomplete="off">
              <button class="chat-send" id="send">Send →</button>
            </div>
          </div>
        </div>
      `;
    }

    _bind() {
      const input = this.shadowRoot.getElementById('input');
      const send  = this.shadowRoot.getElementById('send');
      send.addEventListener('click',  () => this._sendMessage());
      input.addEventListener('keydown', e => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this._sendMessage(); }
      });
    }

    async _sendMessage() {
      const input = this.shadowRoot.getElementById('input');
      const text  = input.value.trim();
      if (!text || this._loading) return;
      input.value = '';
      this._addMessage('user', text);
      this._messages.push({ role: 'user', content: text });
      await this._callAI();
    }

    async _autoAnalyze() {
      if (this._loading) return;
      const ctx = this.context;
      if (!ctx) return;
      const prompt = `Based on this calculation: ${ctx}. Give a brief, helpful summary and key tips for an African user.`;
      this._messages = [{ role: 'user', content: prompt }];
      this._clearMessages();
      this._addMessage('system', 'Analysing your result…');
      await this._callAI();
    }

    async _callAI() {
      this._loading = true;
      const send = this.shadowRoot.getElementById('send');
      send.disabled = true;
      this._showLoading();
      try {
        const reply = await window.AfroTools.ai.ask(
          this._messages[this._messages.length - 1].content,
          '',
          this._messages.slice(0, -1),
          { tool: this.tool, context: this.context }
        );
        this._hideLoading();
        this._addMessage('assistant', reply);
        this._messages.push({ role: 'assistant', content: reply });
      } catch (err) {
        this._hideLoading();
        this._addMessage('error', err.message);
        if (err.message.includes('limit') || err.message.includes('rate')) this._showRateLimitCTA();
      }
      this._loading = false;
      send.disabled = false;
    }

    _addMessage(type, text) {
      const c   = this.shadowRoot.getElementById('messages');
      const cls = { user:'msg-user', assistant:'msg-ai', system:'msg-system', error:'msg-error' }[type] || 'msg-ai';
      const div = document.createElement('div');
      div.className = 'msg ' + cls;
      div.textContent = text;
      c.appendChild(div);
      c.scrollTop = c.scrollHeight;
    }

    _clearMessages() { this.shadowRoot.getElementById('messages').innerHTML = ''; }

    _showLoading() {
      const c = this.shadowRoot.getElementById('messages');
      const l = document.createElement('div');
      l.className = 'chat-loading'; l.id = 'loader';
      l.innerHTML = '<span></span><span></span><span></span>';
      c.appendChild(l); c.scrollTop = c.scrollHeight;
    }

    _hideLoading() {
      const l = this.shadowRoot.getElementById('loader');
      if (l) l.remove();
    }

    _showRateLimitCTA() {
      const c   = this.shadowRoot.getElementById('messages');
      const div = document.createElement('div');
      div.className = 'rate-limit';
      div.innerHTML = '<a href="/dashboard/">Sign up free</a> for more AI questions per day.';
      c.appendChild(div);
    }
  }

  if (!customElements.get('afro-chat')) {
    customElements.define('afro-chat', AfroChat);
  }
})();
