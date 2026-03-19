/**
 * <save-to-vault> Web Component
 *
 * Drop-in button for saving tool-generated PDFs to the user's vault.
 *
 * Attributes:
 *   tool-slug  (required)  — identifier for the originating tool
 *   file-name  (required)  — default file name for the upload
 *
 * API:
 *   el.setFile(blob, fileName?)  — provide the PDF blob to upload
 */
(function () {
  'use strict';

  var STYLES = [
    ':host { display: inline-block; }',
    '.stv-btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px;',
    '  border: 1.5px solid #007AFF; border-radius: 8px; background: #fff; color: #007AFF;',
    '  font-family: "DM Sans", sans-serif; font-size: 0.85rem; font-weight: 600;',
    '  cursor: pointer; transition: all 150ms ease; white-space: nowrap; }',
    '.stv-btn:hover { background: #007AFF; color: #fff; }',
    '.stv-btn:disabled { opacity: .5; cursor: not-allowed; }',
    '.stv-btn.uploading { pointer-events: none; opacity: .7; }',
    '.stv-btn svg { width: 16px; height: 16px; flex-shrink: 0; }',
    '.stv-msg { font-size: 0.8rem; margin-top: 4px; }',
    '.stv-msg.success { color: #16a34a; }',
    '.stv-msg.error { color: #dc2626; }',
    '.stv-msg a { color: #007AFF; text-decoration: none; font-weight: 600; }',
    '.stv-msg a:hover { text-decoration: underline; }',
    '@media (prefers-color-scheme: dark) {',
    '  .stv-btn { background: #131D2E; color: #4DA3FF; border-color: #4DA3FF; }',
    '  .stv-btn:hover { background: #4DA3FF; color: #0A1628; }',
    '  .stv-msg.success { color: #6EE7B7; }',
    '  .stv-msg a { color: #4DA3FF; }',
    '}'
  ].join('\n');

  var ICON_VAULT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/><path d="M12 10v6"/><path d="m9 13 3-3 3 3"/></svg>';

  var ICON_SPINNER = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" opacity=".25"/><path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"><animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.8s" repeatCount="indefinite"/></path></svg>';

  class SaveToVault extends HTMLElement {
    constructor() {
      super();
      this._blob = null;
      this._fileName = '';
      this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
      this._render();
    }

    /** Provide the file blob to upload */
    setFile(blob, fileName) {
      this._blob = blob;
      if (fileName) this._fileName = fileName;
      // Reset state
      var msg = this.shadowRoot.querySelector('.stv-msg');
      if (msg) msg.remove();
      var btn = this.shadowRoot.querySelector('.stv-btn');
      if (btn) {
        btn.disabled = false;
        btn.classList.remove('uploading');
        btn.innerHTML = ICON_VAULT + ' Save to Vault';
      }
    }

    _render() {
      this.shadowRoot.innerHTML = '<style>' + STYLES + '</style>'
        + '<button class="stv-btn">' + ICON_VAULT + ' Save to Vault</button>';

      this.shadowRoot.querySelector('.stv-btn').addEventListener('click', this._handleClick.bind(this));
    }

    async _handleClick() {
      // Check login
      if (typeof AfroAuth === 'undefined' || !AfroAuth.isLoggedIn || !AfroAuth.isLoggedIn()) {
        if (typeof AfroAuthModal !== 'undefined' && AfroAuthModal.open) {
          AfroAuthModal.open();
        } else {
          window.location.href = '/dashboard/';
        }
        return;
      }

      if (!this._blob) {
        this._showMsg('Generate a document first.', 'error');
        return;
      }

      var btn = this.shadowRoot.querySelector('.stv-btn');
      btn.classList.add('uploading');
      btn.innerHTML = ICON_SPINNER + ' Saving\u2026';
      btn.disabled = true;

      // Remove old messages
      var old = this.shadowRoot.querySelector('.stv-msg');
      if (old) old.remove();

      try {
        // Load vault module if needed
        if (typeof AfroVault === 'undefined') {
          await new Promise(function (resolve, reject) {
            var s = document.createElement('script');
            s.src = '/assets/js/afro-vault.js';
            s.onload = resolve;
            s.onerror = reject;
            document.head.appendChild(s);
          });
        }

        var result = await AfroVault.uploadBlob({
          blob: this._blob,
          fileName: this._fileName || this.getAttribute('file-name') || 'document.pdf',
          toolSlug: this.getAttribute('tool-slug') || '',
          tags: []
        });

        if (result.uploaded) {
          btn.innerHTML = ICON_VAULT + ' Saved';
          this._showMsg('Saved to vault \u2713 <a href="/dashboard/vault/">View vault \u2192</a>', 'success');
        } else if (result.reason === 'limit_reached') {
          btn.innerHTML = ICON_VAULT + ' Vault Full';
          this._showMsg('Vault full. <a href="/dashboard/#upgrade">Upgrade to Pro</a> for ' + (result.limit === 5 ? '50' : 'more') + ' documents.', 'error');
        } else if (result.reason === 'not_logged_in') {
          btn.innerHTML = ICON_VAULT + ' Save to Vault';
          btn.disabled = false;
          btn.classList.remove('uploading');
          if (typeof AfroAuthModal !== 'undefined' && AfroAuthModal.open) AfroAuthModal.open();
        } else {
          btn.innerHTML = ICON_VAULT + ' Save to Vault';
          btn.disabled = false;
          btn.classList.remove('uploading');
          this._showMsg('Upload failed. Please try again.', 'error');
        }
      } catch (err) {
        console.error('[SaveToVault]', err);
        btn.innerHTML = ICON_VAULT + ' Save to Vault';
        btn.disabled = false;
        btn.classList.remove('uploading');
        this._showMsg('Something went wrong. Please try again.', 'error');
      }
    }

    _showMsg(html, type) {
      var old = this.shadowRoot.querySelector('.stv-msg');
      if (old) old.remove();
      var div = document.createElement('div');
      div.className = 'stv-msg ' + (type || '');
      div.innerHTML = html;
      this.shadowRoot.appendChild(div);
    }
  }

  if (!customElements.get('save-to-vault')) {
    customElements.define('save-to-vault', SaveToVault);
  }
})();
