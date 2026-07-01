(function () {
  'use strict';

  if (!document.getElementById('save-result-btn-styles')) {
    var style = document.createElement('style');
    style.id = 'save-result-btn-styles';
    style.textContent = [
      '.srb-wrap { display:flex; padding:0; }',
      '.srb-btn {',
      '  display:inline-flex; align-items:center; justify-content:center; gap:6px;',
      '  min-height:44px; padding:10px 20px;',
      '  border:1.5px solid var(--color-border, #e2e8f0);',
      '  border-radius:var(--radius-md, 10px);',
      '  background:var(--color-bg-card, #fff);',
      '  color:var(--color-text, #0f172a);',
      '  font-family:var(--font-body, "DM Sans", sans-serif);',
      '  font-size:var(--text-sm, 0.875rem);',
      '  font-weight:var(--weight-semibold, 600);',
      '  cursor:pointer;',
      '  transition:all var(--transition-fast, 150ms ease);',
      '  -webkit-tap-highlight-color:transparent;',
      '}',
      '.srb-btn:hover:not(:disabled) {',
      '  border-color:var(--color-brand, var(--color-primary, #0062CC));',
      '  color:var(--color-brand, var(--color-primary, #0062CC));',
      '  background:var(--color-brand-pale, var(--color-primary-pale, rgba(0,122,255,0.08)));',
      '}',
      '.srb-btn:disabled { opacity:0.55; cursor:default; }',
      '.srb-btn svg { flex-shrink:0; }',
      '@media (max-width:480px) {',
      '  .srb-btn { width:100%; }',
      '}'
    ].join('\n');
    document.head.appendChild(style);
  }

  var icon = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>';
  var savedIcon = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>';

  function toast(type, message) {
    if (!window.AfroTools || !window.AfroTools.toast) return;
    var api = window.AfroTools.toast;
    if (typeof api[type] === 'function') api[type](message);
    else if (typeof api === 'function') api(message, type);
  }

  function openAuth(message) {
    if (window.AfroAuthModal && typeof window.AfroAuthModal.open === 'function') {
      window.AfroAuthModal.open(message);
    } else {
      toast('info', message);
    }
  }

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

  function SaveResultButton() {
    var el = Reflect.construct(HTMLElement, [], SaveResultButton);
    el._data = null;
    el._saving = false;
    return el;
  }

  SaveResultButton.prototype = Object.create(HTMLElement.prototype);
  SaveResultButton.prototype.constructor = SaveResultButton;

  SaveResultButton.prototype.connectedCallback = function () {
    this._render();
    this.hidden = true;
    syncResultActionWrap(this);
  };

  SaveResultButton.prototype.setData = function (data) {
    this._data = data;
    this.hidden = !(data && data.inputs && data.outputs);
    var button = this.querySelector('.srb-btn');
    if (button) {
      button.disabled = this.hidden;
      button.innerHTML = icon + ' Save Result';
    }
    syncResultActionWrap(this);
  };

  SaveResultButton.prototype._render = function () {
    this.innerHTML = '<div class="srb-wrap"><button class="srb-btn" type="button" disabled>' + icon + ' Save Result</button></div>';
    var self = this;
    var button = this.querySelector('.srb-btn');
    if (button) {
      button.addEventListener('click', function () {
        self._handleClick();
      });
    }
  };

  SaveResultButton.prototype._handleClick = async function () {
    if (this._saving) return;

    if (!window.AfroAuth || !window.AfroAuth.isLoggedIn || !window.AfroAuth.isLoggedIn()) {
      openAuth('Sign in to save your calculations');
      return;
    }

    if (!this._data || !this._data.inputs || !this._data.outputs) {
      toast('error', 'Run a calculation first');
      return;
    }

    if (!window.AfroHistory) {
      toast('error', 'Save feature unavailable');
      return;
    }

    var button = this.querySelector('.srb-btn');
    this._saving = true;
    if (button) {
      button.disabled = true;
      button.innerHTML = icon + ' Saving...';
    }

    var result = await window.AfroHistory.save({
      toolSlug: this.getAttribute('tool-slug') || '',
      toolName: this.getAttribute('tool-name') || '',
      countryCode: this.getAttribute('country-code') || '',
      currency: this.getAttribute('currency') || '',
      inputs: this._data.inputs,
      outputs: this._data.outputs
    });

    this._saving = false;

    if (result && result.saved) {
      if (button) {
        button.innerHTML = savedIcon + ' Saved';
        button.disabled = true;
      }
      toast('success', 'Saved! <a href="/dashboard/" style="color:inherit;text-decoration:underline;">View in dashboard -></a>');
      return;
    }

    if (button) {
      button.disabled = false;
      button.innerHTML = icon + ' Save Result';
    }

    if (result && result.reason === 'limit_reached') {
      toast('info', 'Free limit reached (' + result.limit + '/month). <a href="/pricing/" style="color:inherit;text-decoration:underline;">Upgrade to Pro</a> for unlimited saves.');
    } else if (result && result.reason === 'not_logged_in') {
      openAuth('Sign in to save your calculations');
    } else {
      toast('error', 'Could not save. Please try again.');
    }
  };

  if (!customElements.get('save-result-button')) {
    customElements.define('save-result-button', SaveResultButton);
  }
})();
