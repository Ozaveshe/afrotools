/**
 * AfroTools Auto Email Gate
 * Automatically intercepts PDF download buttons and applies email gate.
 * Include this AFTER email-gate.js on any page with PDF downloads.
 *
 * Detects buttons with: onclick containing pdf/print, class containing pdf/download,
 * or text containing "Download PDF" / "Get My PDF" / "Export PDF"
 */
(function() {
  'use strict';

  var STORAGE_KEY = 'afrotools-email-gate';

  function getStoredEmail() {
    try { return localStorage.getItem(STORAGE_KEY) || ''; } catch(e) { return ''; }
  }

  function isProUser() {
    try {
      var auth = localStorage.getItem('afrotools-auth');
      if (auth) { var u = JSON.parse(auth); return u && u.tier === 'pro'; }
    } catch(e) {}
    return false;
  }

  // If already gated or Pro or returning user, don't interfere
  if (isProUser() || getStoredEmail()) return;

  // Wait for DOM
  document.addEventListener('DOMContentLoaded', function() {
    // Find PDF-related buttons
    var btns = document.querySelectorAll('[onclick*="pdf" i], [onclick*="print" i], .pdf-btn, .download-pdf, [data-action="pdf"]');
    btns.forEach(function(btn) {
      var origOnclick = btn.getAttribute('onclick');
      if (!origOnclick) return;

      // Store the original handler
      btn.removeAttribute('onclick');
      btn.dataset.origPdf = origOnclick;

      btn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();

        // Check again (user might have entered email since page load)
        if (isProUser() || getStoredEmail()) {
          // Execute original handler
          new Function(origOnclick).call(btn);
          return;
        }

        // Show email gate modal
        showEmailGateModal(function() {
          new Function(origOnclick).call(btn);
        });
      });
    });
  });

  function showEmailGateModal(onSuccess) {
    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:99998;display:flex;align-items:center;justify-content:center;padding:20px;';

    var toolName = document.title.split('—')[0].trim() || 'AfroTools';

    overlay.innerHTML = '<div style="background:#fff;border-radius:20px;padding:36px 32px;max-width:420px;width:100%;box-shadow:0 24px 80px rgba(0,0,0,.3);font-family:inherit;">'
      + '<div style="text-align:center;margin-bottom:20px;">'
      + '<div style="font-size:2.4rem;margin-bottom:8px;">📄</div>'
      + '<h3 style="font-size:1.15rem;font-weight:800;color:#111827;margin:0 0 6px;">Download Your Report</h3>'
      + '<p style="font-size:.85rem;color:#6B7280;line-height:1.6;margin:0;">Enter your email to get your PDF. We\'ll keep you updated with tax law changes.</p>'
      + '</div>'
      + '<form style="display:flex;flex-direction:column;gap:10px;">'
      + '<input type="email" placeholder="your@email.com" required autocomplete="email" style="padding:13px 16px;border:1.5px solid #D1D5DB;border-radius:10px;font-size:.9rem;font-family:inherit;outline:none;">'
      + '<input type="text" name="name" placeholder="Full name (optional)" autocomplete="name" style="padding:13px 16px;border:1.5px solid #D1D5DB;border-radius:10px;font-size:.9rem;font-family:inherit;outline:none;">'
      + '<input type="text" name="company" placeholder="Company (optional)" autocomplete="organization" style="padding:13px 16px;border:1.5px solid #D1D5DB;border-radius:10px;font-size:.9rem;font-family:inherit;outline:none;">'
      + '<input type="text" name="role" placeholder="Job title (optional)" autocomplete="organization-title" style="padding:13px 16px;border:1.5px solid #D1D5DB;border-radius:10px;font-size:.9rem;font-family:inherit;outline:none;">'
      + '<button type="submit" style="padding:13px;background:#007AFF;color:#fff;border:none;border-radius:10px;font-size:.9rem;font-weight:700;cursor:pointer;font-family:inherit;">Download PDF Report →</button>'
      + '</form>'
      + '<p style="text-align:center;font-size:.72rem;color:#9CA3AF;margin:12px 0 0;">🔒 No spam. Unsubscribe anytime.</p>'
      + '</div>';

    document.body.appendChild(overlay);

    var form = overlay.querySelector('form');
    var emailInp = overlay.querySelector('input');
    setTimeout(function(){ emailInp.focus(); }, 50);

    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) overlay.remove();
    });

    form.addEventListener('submit', function(e) {
      e.preventDefault();
      var email = emailInp.value.trim();
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return;

      var nameVal = (form.querySelector('[name="name"]').value || '').trim();
      var companyVal = (form.querySelector('[name="company"]').value || '').trim();
      var roleVal = (form.querySelector('[name="role"]').value || '').trim();

      try { localStorage.setItem(STORAGE_KEY, email); } catch(ex) {}

      // Submit to Netlify Forms
      var formData = {
        'form-name': 'pdf-leads',
        'email': email,
        'tool': toolName,
        'source': 'auto-email-gate'
      };
      if (nameVal) formData['name'] = nameVal;
      if (companyVal) formData['company'] = companyVal;
      if (roleVal) formData['role'] = roleVal;

      fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(formData).toString()
      }).catch(function(){});

      // GA4 tracking
      if (typeof gtag === 'function') {
        gtag('event', 'pdf_download', { tool_name: toolName, method: 'email_gate' });
      }

      overlay.remove();
      if (onSuccess) onSuccess();
    });
  }
})();
