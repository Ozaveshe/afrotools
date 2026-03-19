/* ──────────────────────────────────────────────
   <share-result-button> — Web Component
   Shows a share button that opens a share menu
   with WhatsApp, Twitter, LinkedIn, Copy, Download
   ────────────────────────────────────────────── */
(function () {
  'use strict';

  var CSS = /* css */'\
    :host { display: block; }\
    .shb-wrap { position: relative; }\
    .shb-btn {\
      display: inline-flex; align-items: center; gap: 8px;\
      padding: 10px 20px; border-radius: 8px;\
      font: 600 0.82rem/1 "DM Sans", system-ui, sans-serif;\
      cursor: pointer; border: 1.5px solid var(--color-brand, #007AFF);\
      background: rgba(0,122,255,0.08); color: var(--color-brand, #007AFF);\
      transition: all 0.15s;\
    }\
    .shb-btn:hover { background: rgba(0,122,255,0.15); }\
    .shb-btn:disabled { opacity: 0.5; cursor: default; }\
    .shb-btn svg { flex-shrink: 0; }\
    \
    /* Overlay */\
    .shb-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 9998; }\
    .shb-overlay.open { display: block; }\
    \
    /* Menu — desktop dropdown */\
    .shb-menu {\
      display: none; position: absolute; bottom: calc(100% + 8px); left: 0;\
      background: #fff; border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.18);\
      min-width: 260px; padding: 8px 0; z-index: 9999;\
      animation: shb-in 0.15s ease;\
    }\
    .shb-menu.open { display: block; }\
    @keyframes shb-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }\
    \
    .shb-menu-head {\
      padding: 14px 18px 8px; font: 600 0.88rem/1.3 "DM Sans", system-ui, sans-serif;\
      color: #1a1a1a; border-bottom: 1px solid #f0f0f0; margin-bottom: 4px;\
    }\
    .shb-item {\
      display: flex; align-items: center; gap: 12px;\
      padding: 12px 18px; font: 500 0.82rem/1 "DM Sans", system-ui, sans-serif;\
      color: #333; cursor: pointer; border: none; background: none;\
      width: 100%; text-align: left; transition: background 0.1s;\
    }\
    .shb-item:hover { background: #f5f5f5; }\
    .shb-item svg, .shb-item span.shb-emoji { flex-shrink: 0; width: 22px; text-align: center; font-size: 1.1rem; }\
    \
    /* Mobile bottom sheet */\
    @media (max-width: 600px) {\
      .shb-menu {\
        position: fixed; bottom: 0; left: 0; right: 0; top: auto;\
        border-radius: 16px 16px 0 0; min-width: 100%;\
        padding-bottom: env(safe-area-inset-bottom, 12px);\
        animation: shb-slide 0.2s ease;\
      }\
      @keyframes shb-slide { from { transform: translateY(100%); } to { transform: translateY(0); } }\
      .shb-menu-head { padding: 18px 20px 12px; font-size: 1rem; }\
      .shb-item { padding: 16px 20px; font-size: 0.92rem; }\
    }\
    \
    @media (prefers-color-scheme: dark) {\
      .shb-menu { background: #131D2E; box-shadow: 0 8px 32px rgba(0,0,0,0.4); }\
      .shb-menu-head { color: #E2E8F0; border-color: #1E2D40; }\
      .shb-item { color: #C9D6E8; }\
      .shb-item:hover { background: #1E2D40; }\
    }\
  ';

  var SHARE_ICON = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>';

  class ShareResultButton extends HTMLElement {
    constructor() {
      super();
      this._result = null;
      this._cardCache = null;
      this._open = false;
      this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
      var style = document.createElement('style');
      style.textContent = CSS;
      this.shadowRoot.appendChild(style);

      var wrap = document.createElement('div');
      wrap.className = 'shb-wrap';
      wrap.innerHTML =
        '<button class="shb-btn" disabled>' + SHARE_ICON + ' Share Result</button>' +
        '<div class="shb-overlay"></div>' +
        '<div class="shb-menu">' +
          '<div class="shb-menu-head">Share your result</div>' +
          '<button class="shb-item" data-action="whatsapp"><span class="shb-emoji">📱</span> WhatsApp</button>' +
          '<button class="shb-item" data-action="twitter"><span class="shb-emoji">𝕏</span> Twitter / X</button>' +
          '<button class="shb-item" data-action="linkedin"><span class="shb-emoji">💼</span> LinkedIn</button>' +
          '<button class="shb-item" data-action="copy"><span class="shb-emoji">📋</span> Copy link</button>' +
          '<button class="shb-item" data-action="download"><span class="shb-emoji">📥</span> Download image</button>' +
        '</div>';
      this.shadowRoot.appendChild(wrap);

      this._btn = this.shadowRoot.querySelector('.shb-btn');
      this._menu = this.shadowRoot.querySelector('.shb-menu');
      this._overlay = this.shadowRoot.querySelector('.shb-overlay');

      var self = this;
      this._btn.addEventListener('click', function () { self._toggle(); });
      this._overlay.addEventListener('click', function () { self._close(); });

      this._menu.addEventListener('click', function (e) {
        var item = e.target.closest('[data-action]');
        if (item) self._handleAction(item.dataset.action);
      });
    }

    /* ── Public API ── */
    setResult(data) {
      this._result = data;
      this._cardCache = null;
      if (this._btn) this._btn.disabled = false;
    }

    /* ── Menu toggle ── */
    _toggle() {
      this._open ? this._close() : this._openMenu();
    }

    _openMenu() {
      this._open = true;
      this._menu.classList.add('open');
      this._overlay.classList.add('open');
    }

    _close() {
      this._open = false;
      this._menu.classList.remove('open');
      this._overlay.classList.remove('open');
    }

    /* ── Build optimized WhatsApp share text ── */
    _buildWhatsAppText(r, toolName, flag, shareUrl) {
      var emoji = this._getToolEmoji(toolName);
      var headline = r.headline || 'My Result';
      var text = emoji + ' ' + headline + ': ' + r.mainValue + '\n\n';

      /* Add up to 3 sub-values as compact stat line */
      var subs = (r.subValues || []).slice(0, 3);
      if (subs.length > 0) {
        var parts = [];
        for (var i = 0; i < subs.length; i++) {
          parts.push(subs[i].label + ': ' + subs[i].value);
        }
        text += parts.join(' | ') + '\n\n';
      }

      text += 'Calculate yours FREE \uD83D\uDC47\n' + shareUrl;
      return text;
    }

    _getToolEmoji(name) {
      if (!name) return '\uD83D\uDCCA';
      var n = name.toLowerCase();
      if (n.indexOf('paye') > -1 || n.indexOf('salary') > -1 || n.indexOf('tax') > -1) return '\uD83D\uDCB0';
      if (n.indexOf('vat') > -1) return '\uD83E\uDDFE';
      if (n.indexOf('currency') > -1 || n.indexOf('fx') > -1 || n.indexOf('rate') > -1) return '\uD83D\uDCB1';
      if (n.indexOf('pension') > -1 || n.indexOf('retirement') > -1) return '\uD83C\uDFE6';
      if (n.indexOf('loan') > -1 || n.indexOf('mortgage') > -1) return '\uD83C\uDFE0';
      if (n.indexOf('crypto') > -1 || n.indexOf('bitcoin') > -1) return '\u20BF';
      if (n.indexOf('budget') > -1 || n.indexOf('saving') > -1) return '\uD83D\uDCB0';
      if (n.indexOf('mobile money') > -1 || n.indexOf('m-pesa') > -1) return '\uD83D\uDCF1';
      return '\uD83D\uDCCA';
    }

    /* ── Actions ── */
    _handleAction(action) {
      this._close();
      if (!this._result || !window.AfroShare) return;

      var r = this._result;
      var toolName = this.getAttribute('tool-name') || 'Calculator';
      var toolSlug = this.getAttribute('tool-slug') || '';
      var flag = this.getAttribute('country-flag') || '';
      var pageUrl = window.location.origin + window.location.pathname;

      /* Generate compare link with inputs if available */
      var shareUrl = (AfroShare.generateCompareLink && r.inputs)
        ? AfroShare.generateCompareLink(toolSlug, r.inputs)
        : pageUrl;

      var shareText = r.headline
        ? this._buildWhatsAppText(r, toolName, flag, shareUrl)
        : 'Check out my result on AfroTools \u2192 ' + shareUrl;

      var self = this;

      switch (action) {
        case 'whatsapp':
          window.open(AfroShare.whatsappUrl(shareText), '_blank');
          break;

        case 'twitter':
          var tweetText = r.headline
            ? r.headline + ': ' + r.mainValue + '\n\nCalculate yours free \u2192 ' + shareUrl
            : 'Check out this tool on AfroTools \u2192 ' + shareUrl;
          window.open(AfroShare.twitterUrl(tweetText), '_blank');
          break;

        case 'linkedin':
          window.open(AfroShare.linkedinUrl(shareUrl), '_blank');
          break;

        case 'copy':
          AfroShare.copyToClipboard(shareUrl).then(function () {
            if (window.AfroTools && AfroTools.toast) AfroTools.toast('Link copied!', 'success');
          });
          break;

        case 'download':
          self._getCard().then(function (card) {
            if (card && card.blob) {
              AfroShare.downloadBlob(card.blob, 'afrotools-' + toolSlug + '.png');
            }
          });
          break;
      }

      /* GA4 */
      if (window.gtag) {
        gtag('event', 'share', { method: action, content_type: 'tool_result', item_id: toolSlug });
      }
    }

    /* ── Generate card (cached) ── */
    _getCard() {
      if (this._cardCache) return Promise.resolve(this._cardCache);
      if (!window.AfroShare || !this._result) return Promise.resolve(null);

      var r = this._result;
      var self = this;

      return AfroShare.generateCard({
        toolName: this.getAttribute('tool-name') || 'Calculator',
        headline: r.headline || '',
        mainValue: r.mainValue || '',
        subValues: r.subValues || [],
        countryFlag: this.getAttribute('country-flag') || '',
        brandColor: r.brandColor || undefined
      }).then(function (card) {
        self._cardCache = card;
        return card;
      });
    }
  }

  customElements.define('share-result-button', ShareResultButton);
})();
