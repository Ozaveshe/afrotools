/**
 * AfroTools Email Gate — Two components in one file:
 *
 * 1. <afro-email-gate> — wraps download buttons, intercepts clicks (existing)
 * 2. <email-gate-modal> — programmatic modal triggered by pdf-export-button
 *
 * Usage of <email-gate-modal>:
 *   <email-gate-modal></email-gate-modal>
 *   gate.show(function onSuccess() { ... });
 *
 * Skips gate if:
 *   - User is logged in (afrotools-auth in localStorage)
 *   - User previously entered email (afrotools_lead_email or afrotools-email-gate)
 */
(function() {
  'use strict';

  var STORAGE_KEY = 'afrotools-email-gate';
  var LEAD_KEY = 'afrotools_lead_email';
  var FORM_NAME = 'pdf-leads';

  function getStoredEmail() {
    try { return localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEAD_KEY) || ''; } catch(e) { return ''; }
  }

  function storeEmail(email) {
    try {
      localStorage.setItem(STORAGE_KEY, email);
      localStorage.setItem(LEAD_KEY, email);
    } catch(e) {}
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

  function isLoggedIn() {
    try {
      var auth = localStorage.getItem('afrotools-auth');
      if (auth) { var u = JSON.parse(auth); return u && u.email; }
    } catch(e) {}
    return false;
  }

  function trackDownload(toolName) {
    if (typeof gtag === 'function') {
      gtag('event', 'pdf_download', { tool_name: toolName, method: 'email_gate' });
    }
  }

  function submitEmailToNetlify(email, toolName, country, extras) {
    var formData = {
      'form-name': FORM_NAME,
      'email': email,
      'tool': toolName || '',
      'country': country || '',
      'source': 'email-gate',
      'timestamp': new Date().toISOString()
    };
    if (extras) {
      if (extras.name) formData['name'] = extras.name;
      if (extras.company) formData['company'] = extras.company;
      if (extras.role) formData['role'] = extras.role;
    }
    var body = new URLSearchParams(formData);
    fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString()
    }).catch(function(){});
  }

  function submitLeadToApi(email, toolSlug, optIn) {
    try {
      fetch('/api/capture-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email,
          source: 'pdf-gate',
          toolSlug: toolSlug || '',
          optInDigest: !!optIn
        })
      }).catch(function(){});
    } catch(e) {}
  }

  // ── Animation styles (shared) ──────────────────
  function ensureStyles() {
    if (!document.getElementById('eg-styles')) {
      var style = document.createElement('style');
      style.id = 'eg-styles';
      style.textContent = '@keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes scaleIn{from{opacity:0;transform:scale(.92)}to{opacity:1;transform:scale(1)}}';
      document.head.appendChild(style);
    }
  }

  // ──────────────────────────────────────────────
  // Component 1: <afro-email-gate> (wraps buttons)
  // ──────────────────────────────────────────────
  class AfroEmailGate extends HTMLElement {
    constructor() {
      super();
      this._modal = null;
    }

    get toolName() { return this.getAttribute('tool-name') || 'AfroTools'; }
    get country() { return this.getAttribute('country') || ''; }

    connectedCallback() {
      var self = this;
      this.addEventListener('click', function(e) {
        var btn = e.target.closest('button, a, [role="button"]');
        if (!btn) return;
        e.preventDefault();
        e.stopPropagation();
        self._handleDownload(btn);
      });
    }

    _handleDownload(triggerBtn) {
      if (isProUser() || getStoredEmail() || isLoggedIn()) {
        trackDownload(this.toolName);
        this._triggerActualDownload();
        return;
      }
      this._showModal();
    }

    _showModal() {
      var self = this;
      if (this._modal) this._modal.remove();
      ensureStyles();

      var overlay = document.createElement('div');
      overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:99998;display:flex;align-items:center;justify-content:center;padding:20px;animation:fadeIn .2s;';

      var countryText = this.country ? 'We\'ll notify you when tax laws change in ' + this.country + '.' : 'We\'ll keep you updated with important changes.';

      var modal = document.createElement('div');
      modal.style.cssText = 'background:#fff;border-radius:20px;padding:36px 32px;max-width:420px;width:100%;box-shadow:0 24px 80px rgba(0,0,0,.3);animation:scaleIn .25s;font-family:inherit;';
      modal.innerHTML = ''
        + '<div style="text-align:center;margin-bottom:20px;">'
        + '<div style="font-size:2.4rem;margin-bottom:8px;">\uD83D\uDCC4</div>'
        + '<h3 style="font-size:1.15rem;font-weight:800;color:#111827;margin:0 0 6px;">Download Your Report</h3>'
        + '<p style="font-size:.85rem;color:#6B7280;line-height:1.6;margin:0;">Enter your email to get your PDF. ' + countryText + '</p>'
        + '</div>'
        + '<form id="eg-form" style="display:flex;flex-direction:column;gap:10px;">'
        + '<input type="email" id="eg-email" placeholder="your@email.com" required autocomplete="email" '
        + 'style="padding:13px 16px;border:1.5px solid #D1D5DB;border-radius:10px;font-size:.9rem;font-family:inherit;outline:none;transition:border-color .15s;">'
        + '<input type="text" name="name" placeholder="Full name" required autocomplete="name" '
        + 'style="padding:13px 16px;border:1.5px solid #D1D5DB;border-radius:10px;font-size:.9rem;font-family:inherit;outline:none;transition:border-color .15s;">'
        + '<input type="text" name="company" placeholder="Company" required autocomplete="organization" '
        + 'style="padding:13px 16px;border:1.5px solid #D1D5DB;border-radius:10px;font-size:.9rem;font-family:inherit;outline:none;transition:border-color .15s;">'
        + '<input type="text" name="role" placeholder="Job title" required autocomplete="organization-title" '
        + 'style="padding:13px 16px;border:1.5px solid #D1D5DB;border-radius:10px;font-size:.9rem;font-family:inherit;outline:none;transition:border-color .15s;">'
        + '<button type="submit" id="eg-submit" '
        + 'style="padding:13px;background:#007AFF;color:#fff;border:none;border-radius:10px;font-size:.9rem;font-weight:700;cursor:pointer;font-family:inherit;transition:background .15s;">'
        + 'Download PDF Report \u2192</button>'
        + '</form>'
        + '<p style="text-align:center;font-size:.72rem;color:#9CA3AF;margin:12px 0 0;">\uD83D\uDD12 No spam. Unsubscribe anytime.</p>';

      overlay.appendChild(modal);
      document.body.appendChild(overlay);
      this._modal = overlay;

      setTimeout(function(){ var inp = document.getElementById('eg-email'); if(inp) inp.focus(); }, 100);

      overlay.addEventListener('click', function(e) {
        if (e.target === overlay) { overlay.remove(); self._modal = null; }
      });

      var form = document.getElementById('eg-form');
      form.addEventListener('submit', function(e) {
        e.preventDefault();
        var email = document.getElementById('eg-email').value.trim();
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return;

        var nameVal = (form.querySelector('[name="name"]').value || '').trim();
        var companyVal = (form.querySelector('[name="company"]').value || '').trim();
        var roleVal = (form.querySelector('[name="role"]').value || '').trim();

        if (!nameVal || !companyVal || !roleVal) {
          form.querySelectorAll('input').forEach(function(inp) {
            if (!inp.value.trim()) inp.style.borderColor = '#EF4444';
          });
          return;
        }

        var btn = document.getElementById('eg-submit');
        btn.textContent = 'Generating...';
        btn.disabled = true;

        storeEmail(email);
        submitEmailToNetlify(email, self.toolName, self.country, { name: nameVal, company: companyVal, role: roleVal });
        trackDownload(self.toolName);

        setTimeout(function() {
          overlay.remove();
          self._modal = null;
          self._triggerActualDownload();
        }, 400);
      });
    }

    _triggerActualDownload() {
      if (typeof window.generatePdf === 'function') {
        window.generatePdf();
      } else if (typeof window.downloadPdf === 'function') {
        window.downloadPdf();
      } else if (typeof window.exportPdf === 'function') {
        window.exportPdf();
      } else if (typeof window.openPdfModal === 'function') {
        window.openPdfModal();
      } else {
        window.print();
      }
    }
  }

  if (!customElements.get('afro-email-gate')) {
    customElements.define('afro-email-gate', AfroEmailGate);
  }

  // ──────────────────────────────────────────────
  // Component 2: <email-gate-modal> (programmatic)
  // ──────────────────────────────────────────────
  class EmailGateModal extends HTMLElement {
    constructor() {
      super();
      this._callback = null;
      this._overlay = null;
    }

    connectedCallback() {
      // No visible UI — modal is triggered via .show()
    }

    show(callback) {
      this._callback = callback || null;

      if (isLoggedIn() || isProUser() || getStoredEmail()) {
        if (callback) callback();
        return;
      }

      this._renderModal();
    }

    _renderModal() {
      var self = this;
      if (this._overlay) this._overlay.remove();
      ensureStyles();

      var overlay = document.createElement('div');
      overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:99998;display:flex;align-items:center;justify-content:center;padding:20px;animation:fadeIn .2s;';
      this._overlay = overlay;

      var toolSlug = '';
      var pdfBtn = document.querySelector('pdf-export-button');
      if (pdfBtn) toolSlug = pdfBtn.getAttribute('tool-slug') || '';

      var modal = document.createElement('div');
      modal.style.cssText = 'background:#fff;border-radius:20px;padding:36px 32px;max-width:420px;width:100%;box-shadow:0 24px 80px rgba(0,0,0,.3);animation:scaleIn .25s;font-family:"DM Sans",system-ui,sans-serif;';
      modal.innerHTML = ''
        + '<div style="text-align:center;margin-bottom:20px;">'
        + '<div style="font-size:2.4rem;margin-bottom:8px;">\uD83D\uDCC4</div>'
        + '<h3 style="font-size:1.15rem;font-weight:800;color:#111827;margin:0 0 6px;">Download Your Tax Summary</h3>'
        + '<p style="font-size:.85rem;color:#6B7280;line-height:1.6;margin:0;">Enter your email to download your personalized PDF report.</p>'
        + '</div>'
        + '<form style="display:flex;flex-direction:column;gap:10px;">'
        + '<input type="email" placeholder="your@email.com" required autocomplete="email" '
        + 'style="padding:13px 16px;border:1.5px solid #D1D5DB;border-radius:10px;font-size:.9rem;font-family:inherit;outline:none;transition:border-color .15s;">'
        + '<label style="display:flex;align-items:flex-start;gap:8px;padding:4px 0;">'
        + '<input type="checkbox" checked style="width:18px;height:18px;accent-color:#007AFF;margin-top:2px;flex-shrink:0;">'
        + '<span style="font-size:.78rem;color:#6B7280;line-height:1.4;">Send me monthly financial tips (You can unsubscribe anytime)</span>'
        + '</label>'
        + '<button type="submit" '
        + 'style="padding:13px;background:#007AFF;color:#fff;border:none;border-radius:10px;font-size:.9rem;font-weight:700;cursor:pointer;font-family:inherit;transition:background .15s;">'
        + 'Download PDF \u2192</button>'
        + '</form>'
        + '<p style="text-align:center;font-size:.78rem;color:#9CA3AF;margin:14px 0 0;">Already have an account? <a href="/dashboard/" style="color:#007AFF;text-decoration:none;font-weight:600;">Log in</a></p>'
        + '<p style="text-align:center;font-size:.72rem;color:#9CA3AF;margin:8px 0 0;">\uD83D\uDD12 No spam. Unsubscribe anytime.</p>';

      overlay.appendChild(modal);
      document.body.appendChild(overlay);

      var emailInput = modal.querySelector('input[type="email"]');
      var checkbox = modal.querySelector('input[type="checkbox"]');
      var form = modal.querySelector('form');

      setTimeout(function(){ emailInput.focus(); }, 80);

      overlay.addEventListener('click', function(e) {
        if (e.target === overlay) { overlay.remove(); self._overlay = null; }
      });

      var escHandler = function(e) {
        if (e.key === 'Escape') { overlay.remove(); self._overlay = null; document.removeEventListener('keydown', escHandler); }
      };
      document.addEventListener('keydown', escHandler);

      form.addEventListener('submit', function(e) {
        e.preventDefault();
        var email = emailInput.value.trim();

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
          emailInput.style.borderColor = '#EF4444';
          emailInput.focus();
          return;
        }

        storeEmail(email);
        submitLeadToApi(email, toolSlug, checkbox.checked);

        if (typeof gtag === 'function') {
          gtag('event', 'lead_capture', { method: 'email_gate', tool_slug: toolSlug });
        }

        overlay.remove();
        self._overlay = null;
        document.removeEventListener('keydown', escHandler);
        if (self._callback) self._callback();
      });
    }
  }

  if (!customElements.get('email-gate-modal')) {
    customElements.define('email-gate-modal', EmailGateModal);
  }

})();
