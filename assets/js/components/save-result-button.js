/**
 * AFROTOOLS — <save-result-button> Web Component
 * ═══════════════════════════════════════════════════════════
 * Reusable save button for calculation results.
 * Requires: afro-history.js, supabase-auth.js, toast.js
 *
 * Usage:
 *   <save-result-button
 *     tool-slug="ng-paye"
 *     tool-name="Nigeria PAYE Calculator"
 *     country-code="NG"
 *     currency="NGN">
 *   </save-result-button>
 *
 *   // After calculation:
 *   document.querySelector('save-result-button')
 *     .setData({ inputs: {...}, outputs: {...} });
 *
 * ── INTEGRATION PATTERN FOR PAYE CALCULATORS ──────────────
 * 1. Add scripts to <head> or before </body>:
 *      <script src="/assets/js/supabase-auth.js"></script>
 *      <script src="/assets/js/afro-history.js" defer></script>
 *      <script src="/assets/js/components/save-result-button.js" defer></script>
 *
 * 2. Add the element inside the results card (after action-row):
 *      <save-result-button
 *        tool-slug="TOOL_SLUG"
 *        tool-name="TOOL_DISPLAY_NAME"
 *        country-code="XX"
 *        currency="CUR">
 *      </save-result-button>
 *
 * 3. After calculate() finishes, call:
 *      var saveBtn = document.querySelector('save-result-button');
 *      if (saveBtn) saveBtn.setData({
 *        inputs: { salary: gross, regime: 'nta', ... },
 *        outputs: { netMonthly: result.netMonthly, tax: result.tax, ... }
 *      });
 * ═══════════════════════════════════════════════════════════
 */
(function () {
  'use strict';

  // Inject styles once
  if (!document.getElementById('save-result-btn-styles')) {
    var style = document.createElement('style');
    style.id = 'save-result-btn-styles';
    style.textContent = [
      '.srb-wrap { display:flex; justify-content:center; padding:12px 22px 4px; }',
      '.srb-btn {',
      '  display:inline-flex; align-items:center; gap:6px;',
      '  padding:10px 20px; min-height:44px;',
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
      '  border-color:var(--color-brand, var(--color-primary, #007AFF));',
      '  color:var(--color-brand, var(--color-primary, #007AFF));',
      '  background:var(--color-brand-pale, var(--color-primary-pale, rgba(0,122,255,0.08)));',
      '}',
      '.srb-btn:disabled {',
      '  opacity:0.7; cursor:default;',
      '  border-color:var(--color-success, #3B82F6);',
      '  color:var(--color-success, #3B82F6);',
      '  background:var(--color-success-pale, rgba(59,130,246,0.08));',
      '}',
      '.srb-btn svg { flex-shrink:0; }',
      '@media (max-width:480px) {',
      '  .srb-wrap { padding:10px 16px 4px; }',
      '  .srb-btn { width:100%; justify-content:center; }',
      '}'
    ].join('\n');
    document.head.appendChild(style);
  }

  var BOOKMARK_SVG = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>';
  var CHECK_SVG = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';

  var SaveResultButton = function () {
    var el = Reflect.construct(HTMLElement, [], SaveResultButton);
    el._data = null;
    el._saving = false;
    return el;
  };

  SaveResultButton.prototype = Object.create(HTMLElement.prototype);
  SaveResultButton.prototype.constructor = SaveResultButton;

  SaveResultButton.prototype.connectedCallback = function () {
    this._render();
  };

  SaveResultButton.prototype.setData = function (data) {
    this._data = data;
    // Reset button if it was in "saved" state and new data comes in
    var btn = this.querySelector('.srb-btn');
    if (btn && btn.disabled) {
      btn.disabled = false;
      btn.innerHTML = BOOKMARK_SVG + ' Save Result';
    }
  };

  SaveResultButton.prototype._render = function () {
    this.innerHTML = '<div class="srb-wrap">'
      + '<button class="srb-btn" type="button">'
      + BOOKMARK_SVG + ' Save Result'
      + '</button></div>';

    var self = this;
    this.querySelector('.srb-btn').addEventListener('click', function () {
      self._handleClick();
    });
  };

  SaveResultButton.prototype._handleClick = async function () {
    if (this._saving) return;

    // Check login
    if (!window.AfroAuth || !AfroAuth.isLoggedIn || !AfroAuth.isLoggedIn()) {
      if (window.AfroAuthModal && AfroAuthModal.open) {
        AfroAuthModal.open('Sign in to save your calculations');
      }
      return;
    }

    // Check data
    if (!this._data || !this._data.inputs || !this._data.outputs) {
      if (window.AfroTools && AfroTools.toast) {
        AfroTools.toast.error('Run a calculation first');
      }
      return;
    }

    // Check AfroHistory
    if (!window.AfroHistory) {
      if (window.AfroTools && AfroTools.toast) {
        AfroTools.toast.error('Save feature unavailable');
      }
      return;
    }

    var btn = this.querySelector('.srb-btn');
    this._saving = true;
    btn.disabled = true;
    btn.innerHTML = BOOKMARK_SVG + ' Saving\u2026';

    var result = await window.AfroHistory.save({
      toolSlug: this.getAttribute('tool-slug') || '',
      toolName: this.getAttribute('tool-name') || '',
      countryCode: this.getAttribute('country-code') || '',
      currency: this.getAttribute('currency') || '',
      inputs: this._data.inputs,
      outputs: this._data.outputs
    });

    this._saving = false;

    if (result.saved) {
      btn.innerHTML = CHECK_SVG + ' Saved';
      btn.disabled = true;
      if (window.AfroTools && AfroTools.toast) {
        AfroTools.toast.success('Saved! <a href="/dashboard/" style="color:inherit;text-decoration:underline;">View in dashboard \u2192</a>');
      }
    } else if (result.reason === 'limit_reached') {
      btn.disabled = false;
      btn.innerHTML = BOOKMARK_SVG + ' Save Result';
      if (window.AfroTools && AfroTools.toast) {
        AfroTools.toast.info('Free limit reached (' + result.limit + '/month). <a href="/pricing/" style="color:inherit;text-decoration:underline;">Upgrade to Pro</a> for unlimited saves.');
      }
    } else if (result.reason === 'not_logged_in') {
      btn.disabled = false;
      btn.innerHTML = BOOKMARK_SVG + ' Save Result';
      if (window.AfroAuthModal && AfroAuthModal.open) {
        AfroAuthModal.open('Sign in to save your calculations');
      }
    } else {
      btn.disabled = false;
      btn.innerHTML = BOOKMARK_SVG + ' Save Result';
      if (window.AfroTools && AfroTools.toast) {
        AfroTools.toast.error('Could not save. Please try again.');
      }
    }
  };

  customElements.define('save-result-button', SaveResultButton);
})();
