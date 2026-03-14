/**
 * AFROTOOLS CHAT PANEL — Web Component
 * Reusable conversational AI advisor panel for any tool page.
 *
 * Usage:
 *   <afro-chat tool="ng-paye" context="Gross: 5M, Net: 342K"></afro-chat>
 *
 * Attributes:
 *   tool     — tool ID for system prompt context (e.g., "ng-paye", "medical-report")
 *   context  — live calculation data string (updated after each calculation)
 *   greeting — optional initial greeting message
 */
(function () {
  'use strict';

  class AfroChat extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this._messages = [];   // { role: 'user'|'assistant', content: string }
      this._loading = false;
      this._initialized = false;
    }

    static get observedAttributes() { return ['context', 'tool', 'greeting']; }

    get tool() { return this.getAttribute('tool') || ''; }
    get context() { return this.getAttribute('context') || ''; }
    get greeting() { return this.getAttribute('greeting') || ''; }

    connectedCallback() {
      this._render();
      this._bind();
      this._initialized = true;
    }

    attributeChangedCallback(name, oldVal, newVal) {
      if (!this._initialized) return;
      if (name === 'context' && newVal && newVal !== oldVal) {
        // Auto-trigger AI analysis when context changes (new calculation)
        this._autoAnalyze();
      }
    }

    _render() {
      this.shadowRoot.innerHTML = `
        <style>
          :host { display: block; font-family: 'DM Sans', system-ui, -apple-system, sans-serif; }
          .chat-wrap { background: #0f1a12; border-radius: 12px; overflow: hidden; border: 1px solid #1a2e1f; }
          .chat-header { padding: 14px 16px; background: linear-gradient(135deg, #0a1a10 0%, #132818 100%); display: flex; align-items: center; gap: 10px; border-bottom: 1px solid #1a2e1f; }
          .chat-dot { width: 8px; height: 8px; border-radius: 50%; background: #00c873; animation: pulse 2s infinite; flex-shrink: 0; }
          @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .4; } }
          .chat-title { color: #e5e7eb; font-size: 0.85rem; font-weight: 600; flex: 1; }
          .chat-badge { font-size: 0.6rem; font-weight: 800; color: #00c873; background: rgba(0,200,115,.12); padding: 2px 8px; border-radius: 100px; letter-spacing: .05em; }
          .chat-messages { max-height: 360px; overflow-y: auto; padding: 12px 16px; display: flex; flex-direction: column; gap: 10px; scrollbar-width: thin; scrollbar-color: #1a2e1f transparent; }
          .chat-messages::-webkit-scrollbar { width: 4px; }
          .chat-messages::-webkit-scrollbar-thumb { background: #1a2e1f; border-radius: 4px; }
          .msg { padding: 10px 14px; border-radius: 10px; font-size: 0.84rem; line-height: 1.6; max-width: 92%; word-break: break-word; }
          .msg-user { background: #008751; color: #fff; align-self: flex-end; border-bottom-right-radius: 2px; }
          .msg-ai { background: #162419; color: #d1d5db; align-self: flex-start; border-bottom-left-radius: 2px; }
          .msg-system { background: transparent; color: #6b7280; align-self: center; text-align: center; font-size: 0.78rem; font-style: italic; }
          .msg-error { background: rgba(220,53,69,.15); color: #f87171; align-self: flex-start; border-left: 3px solid #dc3545; }
          .chat-loading { display: flex; gap: 4px; padding: 10px 14px; align-self: flex-start; }
          .chat-loading span { width: 6px; height: 6px; background: #00c873; border-radius: 50%; animation: bounce .6s infinite alternate; }
          .chat-loading span:nth-child(2) { animation-delay: .15s; }
          .chat-loading span:nth-child(3) { animation-delay: .3s; }
          @keyframes bounce { to { transform: translateY(-6px); opacity: .4; } }
          .chat-input-wrap { display: flex; gap: 8px; padding: 12px 16px; border-top: 1px solid #1a2e1f; background: #0a1a10; }
          .chat-input { flex: 1; background: #162419; border: 1px solid #1a2e1f; border-radius: 8px; padding: 10px 14px; color: #e5e7eb; font-size: 0.84rem; font-family: inherit; outline: none; resize: none; }
          .chat-input::placeholder { color: #4b5563; }
          .chat-input:focus { border-color: #008751; }
          .chat-send { background: #008751; color: #fff; border: none; border-radius: 8px; padding: 10px 16px; font-size: 0.8rem; font-weight: 700; cursor: pointer; font-family: inherit; white-space: nowrap; transition: background .2s; }
          .chat-send:hover { background: #00a863; }
          .chat-send:disabled { opacity: .5; cursor: not-allowed; }
          .rate-limit { padding: 8px 16px; background: rgba(245,166,35,.1); border-top: 1px solid rgba(245,166,35,.2); }
          .rate-limit a { color: #F5A623; font-size: 0.78rem; text-decoration: underline; }
          .remaining { color: #4b5563; font-size: 0.7rem; text-align: right; padding: 2px 16px 4px; }
        </style>
        <div class="chat-wrap">
          <div class="chat-header">
            <span class="chat-dot"></span>
            <span class="chat-title">AI Advisor</span>
            <span class="chat-badge">AI</span>
          </div>
          <div class="chat-messages" id="messages">
            <div class="msg msg-system">${this.greeting || 'Calculate to get your AI analysis, or ask a question below.'}</div>
          </div>
          <div class="chat-input-wrap">
            <input class="chat-input" id="input" type="text" placeholder="Ask a follow-up question..." autocomplete="off">
            <button class="chat-send" id="send">Send</button>
          </div>
        </div>
      `;
    }

    _bind() {
      const input = this.shadowRoot.getElementById('input');
      const send = this.shadowRoot.getElementById('send');

      send.addEventListener('click', () => this._sendMessage());
      input.addEventListener('keydown', e => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this._sendMessage();
        }
      });
    }

    async _sendMessage() {
      const input = this.shadowRoot.getElementById('input');
      const text = input.value.trim();
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

      // Auto-generate a summary request
      const prompt = `Based on this calculation: ${ctx}. Give me a brief, helpful summary and any tips.`;
      this._messages = [{ role: 'user', content: prompt }];
      this._clearMessages();
      this._addMessage('system', 'Analyzing your calculation...');

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
          '', // system prompt handled server-side via tool ID
          this._messages.slice(0, -1),
          { tool: this.tool, context: this.context }
        );
        this._hideLoading();
        this._addMessage('assistant', reply);
        this._messages.push({ role: 'assistant', content: reply });
      } catch (err) {
        this._hideLoading();
        const isRateLimit = err.message.includes('limit') || err.message.includes('rate');
        this._addMessage(isRateLimit ? 'error' : 'error', err.message);
        if (isRateLimit) {
          this._showRateLimitCTA();
        }
      }

      this._loading = false;
      send.disabled = false;
    }

    _addMessage(type, text) {
      const container = this.shadowRoot.getElementById('messages');
      const cls = type === 'user' ? 'msg-user' : type === 'error' ? 'msg-error' : type === 'system' ? 'msg-system' : 'msg-ai';
      const div = document.createElement('div');
      div.className = 'msg ' + cls;
      div.textContent = text;
      container.appendChild(div);
      container.scrollTop = container.scrollHeight;
    }

    _clearMessages() {
      const container = this.shadowRoot.getElementById('messages');
      container.innerHTML = '';
    }

    _showLoading() {
      const container = this.shadowRoot.getElementById('messages');
      const loader = document.createElement('div');
      loader.className = 'chat-loading';
      loader.id = 'loader';
      loader.innerHTML = '<span></span><span></span><span></span>';
      container.appendChild(loader);
      container.scrollTop = container.scrollHeight;
    }

    _hideLoading() {
      const loader = this.shadowRoot.getElementById('loader');
      if (loader) loader.remove();
    }

    _showRateLimitCTA() {
      const container = this.shadowRoot.getElementById('messages');
      const div = document.createElement('div');
      div.className = 'rate-limit';
      div.innerHTML = '<a href="/dashboard/">Sign up free</a> for more AI questions per day.';
      container.appendChild(div);
    }
  }

  if (!customElements.get('afro-chat')) {
    customElements.define('afro-chat', AfroChat);
  }
})();
