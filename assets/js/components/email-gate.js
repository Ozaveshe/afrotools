/**
 * AfroTools Email Gate Web Component
 * Intercepts PDF download clicks, shows email modal, then triggers download.
 * Usage: <afro-email-gate tool-name="Nigeria PAYE" country="Nigeria">
 *          <button class="download-btn">Download PDF Report</button>
 *        </afro-email-gate>
 *
 * Behavior:
 * - First visit: modal collects email -> Netlify Forms -> triggers download
 * - Return visit: email in localStorage -> skips modal, downloads directly
 * - Pro users: gate bypassed entirely
 * - All downloads tracked in GA4
 */
(function() {
  'use strict';

  var STORAGE_KEY = 'afrotools-email-gate';
  var FORM_NAME = 'pdf-leads';

  function getStoredEmail() {
    try { return localStorage.getItem(STORAGE_KEY) || ''; } catch(e) { return ''; }
  }

  function storeEmail(email) {
    try { localStorage.setItem(STORAGE_KEY, email); } catch(e) {}
  }

  function isProUser() {
    try {
      var auth = localStorage.getItem('afrotools-auth');
      if (auth) {
        var u = JSON.parse(auth);
        return u && u.tier === 'pro';
      }
    } catch(e) {}
    return false;
  }

  function trackDownload(toolName) {
    if (typeof gtag === 'function') {
      gtag('event', 'pdf_download', { tool_name: toolName, method: 'email_gate' });
    }
  }

  function submitEmailToNetlify(email, toolName, country) {
    var body = new URLSearchParams({
      'form-name': FORM_NAME,
      'email': email,
      'tool': toolName || '',
      'country': country || '',
      'source': 'email-gate',
      'timestamp': new Date().toISOString()
    });
    fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString()
    }).catch(function(){});
  }

  class AfroEmailGate extends HTMLElement {
    constructor() {
      super();
      this._modal = null;
    }

    get toolName() { return this.getAttribute('tool-name') || 'AfroTools'; }
    get country() { return this.getAttribute('country') || ''; }

    connectedCallback() {
      var self = this;
      // Intercept all button/link clicks inside
      this.addEventListener('click', function(e) {
        var btn = e.target.closest('button, a, [role="button"]');
        if (!btn) return;
        e.preventDefault();
        e.stopPropagation();
        self._handleDownload(btn);
      });
    }

    _handleDownload(triggerBtn) {
      var self = this;

      // Pro users bypass entirely
      if (isProUser()) {
        trackDownload(this.toolName);
        this._triggerActualDownload();
        return;
      }

      // Returning user with stored email
      var stored = getStoredEmail();
      if (stored) {
        trackDownload(this.toolName);
        this._triggerActualDownload();
        return;
      }

      // First time: show modal
      this._showModal();
    }

    _showModal() {
      var self = this;
      if (this._modal) this._modal.remove();

      var overlay = document.createElement('div');
      overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:99998;display:flex;align-items:center;justify-content:center;padding:20px;animation:fadeIn .2s;';

      var countryText = this.country ? 'We\'ll notify you when tax laws change in ' + this.country + '.' : 'We\'ll keep you updated with important changes.';

      var modal = document.createElement('div');
      modal.style.cssText = 'background:#fff;border-radius:20px;padding:36px 32px;max-width:420px;width:100%;box-shadow:0 24px 80px rgba(0,0,0,.3);animation:scaleIn .25s;font-family:inherit;';
      modal.innerHTML = ''
        + '<div style="text-align:center;margin-bottom:20px;">'
        + '<div style="font-size:2.4rem;margin-bottom:8px;">📄</div>'
        + '<h3 style="font-size:1.15rem;font-weight:800;color:#111827;margin:0 0 6px;">Download Your Report</h3>'
        + '<p style="font-size:.85rem;color:#6B7280;line-height:1.6;margin:0;">Enter your email to get your PDF. ' + countryText + '</p>'
        + '</div>'
        + '<form id="eg-form" style="display:flex;flex-direction:column;gap:10px;">'
        + '<input type="email" id="eg-email" placeholder="your@email.com" required autocomplete="email" '
        + 'style="padding:13px 16px;border:1.5px solid #D1D5DB;border-radius:10px;font-size:.9rem;font-family:inherit;outline:none;transition:border-color .15s;">'
        + '<button type="submit" id="eg-submit" '
        + 'style="padding:13px;background:#007AFF;color:#fff;border:none;border-radius:10px;font-size:.9rem;font-weight:700;cursor:pointer;font-family:inherit;transition:background .15s;">'
        + 'Download PDF Report →</button>'
        + '</form>'
        + '<p style="text-align:center;font-size:.72rem;color:#9CA3AF;margin:12px 0 0;">🔒 No spam. Unsubscribe anytime.</p>';

      overlay.appendChild(modal);
      document.body.appendChild(overlay);
      this._modal = overlay;

      // Focus email input
      setTimeout(function(){ var inp = document.getElementById('eg-email'); if(inp) inp.focus(); }, 100);

      // Close on overlay click
      overlay.addEventListener('click', function(e) {
        if (e.target === overlay) { overlay.remove(); self._modal = null; }
      });

      // Form submit
      var form = document.getElementById('eg-form');
      form.addEventListener('submit', function(e) {
        e.preventDefault();
        var email = document.getElementById('eg-email').value.trim();
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return;

        var btn = document.getElementById('eg-submit');
        btn.textContent = 'Generating...';
        btn.disabled = true;

        // Store, submit, track, download
        storeEmail(email);
        submitEmailToNetlify(email, self.toolName, self.country);
        trackDownload(self.toolName);

        setTimeout(function() {
          overlay.remove();
          self._modal = null;
          self._triggerActualDownload();
        }, 400);
      });

      // Add CSS animations if not already present
      if (!document.getElementById('eg-styles')) {
        var style = document.createElement('style');
        style.id = 'eg-styles';
        style.textContent = '@keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes scaleIn{from{opacity:0;transform:scale(.92)}to{opacity:1;transform:scale(1)}}';
        document.head.appendChild(style);
      }
    }

    _triggerActualDownload() {
      // Try calling the page's existing download function
      if (typeof window.generatePdf === 'function') {
        window.generatePdf();
      } else if (typeof window.downloadPdf === 'function') {
        window.downloadPdf();
      } else if (typeof window.exportPdf === 'function') {
        window.exportPdf();
      } else if (typeof window.openPdfModal === 'function') {
        window.openPdfModal();
      } else {
        // Fallback: browser print
        window.print();
      }
    }
  }

  if (!customElements.get('afro-email-gate')) {
    customElements.define('afro-email-gate', AfroEmailGate);
  }
})();
