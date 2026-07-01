(function () {
  'use strict';

  function ShareResultButton() {
    var el = Reflect.construct(HTMLElement, [], ShareResultButton);
    el._result = null;
    el._cardCache = null;
    el._open = false;
    el.attachShadow({ mode: 'open' });
    return el;
  }

  ShareResultButton.prototype = Object.create(HTMLElement.prototype);
  ShareResultButton.prototype.constructor = ShareResultButton;

  function syncResultActionWrap(element) {
    var parent = element && element.parentElement;
    if (!parent || !parent.classList || !parent.classList.contains('result-actions')) return;
    var children = Array.prototype.slice.call(parent.children).filter(function (child) {
      return child.nodeType === 1;
    });
    var onlyResultButtons = children.length > 0 && children.every(function (child) {
      return child.tagName === 'SAVE-RESULT-BUTTON' || child.tagName === 'SHARE-RESULT-BUTTON';
    });
    if (!onlyResultButtons) return;
    var hasVisibleAction = children.some(function (child) {
      return !child.hidden;
    });
    if (hasVisibleAction) {
      parent.hidden = false;
      if (parent.dataset.resultActionsDisplay && parent.dataset.resultActionsDisplay !== 'none') parent.style.display = parent.dataset.resultActionsDisplay;
      else parent.style.display = 'flex';
      return;
    }
    if (!parent.dataset.resultActionsDisplay && parent.style.display) {
      parent.dataset.resultActionsDisplay = parent.style.display;
    }
    parent.hidden = true;
    parent.style.display = 'none';
  }

  ShareResultButton.prototype.connectedCallback = function () {
    this.hidden = true;
    this._render();
    this._applyLabels();
    syncResultActionWrap(this);
  };

  ShareResultButton.prototype.setResult = function (result) {
    this._result = result;
    this._cardCache = null;
    this.hidden = !result;
    if (this._btn) this._btn.disabled = !result;
    syncResultActionWrap(this);
  };

  ShareResultButton.prototype._render = function () {
    var style = document.createElement('style');
    style.textContent = [
      ':host { display:block; }',
      ':host([hidden]) { display:none; }',
      '.shb-wrap { position:relative; }',
      '.shb-btn {',
      '  display:inline-flex; align-items:center; justify-content:center; gap:8px;',
      '  min-height:44px; padding:10px 20px;',
      '  border-radius:8px; border:1.5px solid var(--color-brand, #0062CC);',
      '  background:rgba(0,122,255,0.08); color:var(--color-brand, #0062CC);',
      '  font:600 0.82rem/1 "DM Sans", system-ui, sans-serif;',
      '  cursor:pointer; transition:all 0.15s ease;',
      '}',
      '.shb-btn:hover:not(:disabled) { background:rgba(0,122,255,0.15); }',
      '.shb-btn:disabled { opacity:0.5; cursor:default; }',
      '.shb-btn svg { flex-shrink:0; }',
      '.shb-overlay { display:none; position:fixed; inset:0; background:rgba(15,23,42,0.44); z-index:9998; }',
      '.shb-overlay.open { display:block; }',
      '.shb-menu {',
      '  display:none; position:absolute; bottom:calc(100% + 8px); left:0;',
      '  min-width:260px; padding:8px 0; z-index:9999;',
      '  background:#fff; border-radius:12px;',
      '  box-shadow:0 8px 32px rgba(15,23,42,0.18);',
      '  animation:shb-in 0.15s ease;',
      '}',
      '.shb-menu.open { display:block; }',
      '@keyframes shb-in { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }',
      '.shb-menu-head {',
      '  padding:14px 18px 8px; margin-bottom:4px;',
      '  border-bottom:1px solid #f0f0f0; color:#111827;',
      '  font:700 0.88rem/1.3 "DM Sans", system-ui, sans-serif;',
      '}',
      '.shb-item {',
      '  display:flex; align-items:center; gap:12px;',
      '  width:100%; min-height:44px; padding:12px 18px;',
      '  border:0; background:transparent; color:#334155;',
      '  text-align:left; cursor:pointer;',
      '  font:600 0.82rem/1 "DM Sans", system-ui, sans-serif;',
      '}',
      '.shb-item:hover { background:#f8fafc; }',
      '.shb-mark {',
      '  width:26px; min-width:26px; height:24px;',
      '  display:inline-flex; align-items:center; justify-content:center;',
      '  border-radius:999px; background:#eff6ff; color:#0062CC;',
      '  font:700 0.68rem/1 "DM Sans", system-ui, sans-serif;',
      '}',
      '@media (max-width:600px) {',
      '  .shb-menu { position:fixed; inset:auto 0 0 0; min-width:100%; border-radius:16px 16px 0 0; padding-bottom:env(safe-area-inset-bottom, 12px); animation:shb-slide 0.2s ease; }',
      '  @keyframes shb-slide { from { transform:translateY(100%); } to { transform:translateY(0); } }',
      '  .shb-menu-head { padding:18px 20px 12px; font-size:1rem; }',
      '  .shb-item { padding:16px 20px; font-size:0.92rem; }',
      '}',
      '@media (prefers-color-scheme:dark) {',
      '  .shb-menu { background:#131D2E; box-shadow:0 8px 32px rgba(0,0,0,0.4); }',
      '  .shb-menu-head { color:#E2E8F0; border-color:#1E2D40; }',
      '  .shb-item { color:#C9D6E8; }',
      '  .shb-item:hover { background:#1E2D40; }',
      '  .shb-mark { background:#1E2D40; color:#93C5FD; }',
      '}'
    ].join('\n');
    this.shadowRoot.appendChild(style);

    var wrap = document.createElement('div');
    wrap.className = 'shb-wrap';
    wrap.innerHTML = [
      '<button class="shb-btn" type="button" disabled>',
      '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg> ',
      '<span class="shb-label">Share Result</span>',
      '</button>',
      '<div class="shb-overlay"></div>',
      '<div class="shb-menu">',
      '<div class="shb-menu-head">Share your result</div>',
      '<button class="shb-item" type="button" data-action="whatsapp"><span class="shb-mark">WA</span><span>WhatsApp</span></button>',
      '<button class="shb-item" type="button" data-action="twitter"><span class="shb-mark">X</span><span>Twitter / X</span></button>',
      '<button class="shb-item" type="button" data-action="linkedin"><span class="shb-mark">in</span><span>LinkedIn</span></button>',
      '<button class="shb-item" type="button" data-action="copy"><span class="shb-mark">URL</span><span class="shb-copy-label">Copy link</span></button>',
      '<button class="shb-item" type="button" data-action="download"><span class="shb-mark">PNG</span><span class="shb-download-label">Download image</span></button>',
      '</div>'
    ].join('');
    this.shadowRoot.appendChild(wrap);

    this._btn = this.shadowRoot.querySelector('.shb-btn');
    this._menu = this.shadowRoot.querySelector('.shb-menu');
    this._overlay = this.shadowRoot.querySelector('.shb-overlay');

    var self = this;
    this._btn.addEventListener('click', function () { self._toggle(); });
    this._overlay.addEventListener('click', function () { self._close(); });
    this._menu.addEventListener('click', function (event) {
      var action = event.target.closest('[data-action]');
      if (action) self._handleAction(action.dataset.action);
    });
  };

  ShareResultButton.prototype._applyLabels = function () {
    var label = this.shadowRoot.querySelector('.shb-label');
    if (label) label.textContent = this.getAttribute('button-label') || 'Share Result';

    var menuHead = this.shadowRoot.querySelector('.shb-menu-head');
    if (menuHead) menuHead.textContent = this.getAttribute('menu-label') || 'Share your result';

    var copy = this.shadowRoot.querySelector('.shb-copy-label');
    if (copy) copy.textContent = this.getAttribute('copy-label') || 'Copy link';

    var download = this.shadowRoot.querySelector('.shb-download-label');
    if (download) download.textContent = this.getAttribute('download-label') || 'Download image';
  };

  ShareResultButton.prototype._toggle = function () {
    if (this._open) this._close();
    else this._openMenu();
  };

  ShareResultButton.prototype._openMenu = function () {
    if (!this._result) return;
    this._open = true;
    this._menu.classList.add('open');
    this._overlay.classList.add('open');
  };

  ShareResultButton.prototype._close = function () {
    this._open = false;
    this._menu.classList.remove('open');
    this._overlay.classList.remove('open');
  };

  ShareResultButton.prototype._getToolMark = function (name) {
    var value = String(name || '').toLowerCase();
    if (value.indexOf('paye') > -1 || value.indexOf('salary') > -1 || value.indexOf('tax') > -1) return '$';
    if (value.indexOf('vat') > -1) return 'VAT';
    if (value.indexOf('currency') > -1 || value.indexOf('fx') > -1 || value.indexOf('rate') > -1) return 'FX';
    if (value.indexOf('pension') > -1 || value.indexOf('retirement') > -1) return 'RET';
    if (value.indexOf('loan') > -1 || value.indexOf('mortgage') > -1) return 'LOAN';
    return 'AT';
  };

  ShareResultButton.prototype._buildWhatsAppText = function (result, toolName, shareUrl) {
    var text = this._getToolMark(toolName) + ' ' + (result.headline || this.getAttribute('default-headline') || 'My result') + ': ' + result.mainValue + '\n\n';
    var subValues = (result.subValues || []).slice(0, 3);
    if (subValues.length) {
      text += subValues.map(function (item) {
        return item.label + ': ' + item.value;
      }).join(' | ') + '\n\n';
    }
    return text + (this.getAttribute('cta-label') || 'Calculate yours free') + '\n' + shareUrl;
  };

  ShareResultButton.prototype._handleAction = function (action) {
    this._close();
    if (!this._result || !window.AfroShare) return;

    var result = this._result;
    var toolName = this.getAttribute('tool-name') || 'Calculator';
    var toolSlug = this.getAttribute('tool-slug') || '';
    var baseUrl = window.location.origin + window.location.pathname;
    var shareUrl = window.AfroShare.generateCompareLink && result.inputs
      ? window.AfroShare.generateCompareLink(toolSlug, result.inputs)
      : baseUrl;
    var fallback = (this.getAttribute('fallback-share-label') || 'Check out my result on AfroTools') + ' -> ' + shareUrl;
    var shareText = result.headline ? this._buildWhatsAppText(result, toolName, shareUrl) : fallback;

    if (action === 'whatsapp') {
      window.open(window.AfroShare.whatsappUrl(shareText), '_blank');
    } else if (action === 'twitter') {
      var tweet = result.headline
        ? result.headline + ': ' + result.mainValue + '\n\n' + (this.getAttribute('cta-label') || 'Calculate yours free') + ' -> ' + shareUrl
        : (this.getAttribute('fallback-tool-label') || 'Check out this tool on AfroTools') + ' -> ' + shareUrl;
      window.open(window.AfroShare.twitterUrl(tweet), '_blank');
    } else if (action === 'linkedin') {
      window.open(window.AfroShare.linkedinUrl(shareUrl), '_blank');
    } else if (action === 'copy') {
      window.AfroShare.copyToClipboard(shareUrl).then(function () {
        if (window.AfroTools && window.AfroTools.toast) {
          if (typeof window.AfroTools.toast.success === 'function') window.AfroTools.toast.success('Link copied!');
          else if (typeof window.AfroTools.toast === 'function') window.AfroTools.toast('Link copied!', 'success');
        }
      });
    } else if (action === 'download') {
      this._getCard().then(function (card) {
        if (card && card.blob) window.AfroShare.downloadBlob(card.blob, 'afrotools-' + toolSlug + '.png');
      });
    }

    if (window.gtag) {
      window.gtag('event', 'share', {
        method: action,
        content_type: 'tool_result',
        item_id: toolSlug
      });
    }
  };

  ShareResultButton.prototype._getCard = function () {
    if (this._cardCache) return Promise.resolve(this._cardCache);
    if (!window.AfroShare || !this._result) return Promise.resolve(null);

    var result = this._result;
    var self = this;
    return window.AfroShare.generateCard({
      toolName: this.getAttribute('tool-name') || 'Calculator',
      headline: result.headline || '',
      mainValue: result.mainValue || '',
      subValues: result.subValues || [],
      countryFlag: this.getAttribute('country-flag') || '',
      brandColor: result.brandColor || undefined
    }).then(function (card) {
      self._cardCache = card;
      return card;
    });
  };

  if (!customElements.get('share-result-button')) {
    customElements.define('share-result-button', ShareResultButton);
  }
})();
