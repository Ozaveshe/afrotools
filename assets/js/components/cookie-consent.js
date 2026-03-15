/**
 * AFROTOOLS — Cookie Consent Banner
 * ===================================================================
 * Self-initializing cookie consent bar. Auto-injects at the bottom of
 * the page on first visit. No HTML changes required.
 *
 * localStorage key: afrotools_cookie_consent
 * Values: "accepted" | "declined"
 *
 * If declined, GA4 tracking is disabled but functional cookies
 * (localStorage preferences, Supabase auth) continue to work.
 * ===================================================================
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'afrotools_cookie_consent';

  // Already consented — bail early
  var consent = null;
  try { consent = localStorage.getItem(STORAGE_KEY); } catch (e) {}
  if (consent === 'accepted' || consent === 'declined') {
    // If previously declined, disable GA4
    if (consent === 'declined') {
      disableGA4();
    }
    return;
  }

  // Build the banner
  var bar = document.createElement('div');
  bar.id = 'afro-cookie-consent';
  bar.setAttribute('role', 'dialog');
  bar.setAttribute('aria-label', 'Cookie consent');

  bar.innerHTML =
    '<div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;">' +
      '<p style="margin:0;flex:1;min-width:200px;font-size:13px;line-height:1.5;color:#d1d5db;">' +
        'AfroTools uses cookies for analytics and saving your preferences.' +
      '</p>' +
      '<div style="display:flex;gap:8px;flex-shrink:0;">' +
        '<button id="afro-cc-accept" style="' +
          'padding:8px 18px;background:#007aff;color:#fff;border:none;border-radius:6px;' +
          'font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;' +
          'transition:background .15s;' +
        '">Accept</button>' +
        '<a href="/privacy/" id="afro-cc-learn" style="' +
          'padding:8px 18px;color:#9ca3af;font-size:13px;font-weight:600;' +
          'text-decoration:none;display:flex;align-items:center;' +
          'transition:color .15s;' +
        '">Learn More</a>' +
        '<button id="afro-cc-close" aria-label="Dismiss" style="' +
          'background:none;border:none;color:#6b7280;font-size:18px;' +
          'cursor:pointer;padding:4px 8px;line-height:1;' +
        '">&times;</button>' +
      '</div>' +
    '</div>';

  // Style the bar
  var s = bar.style;
  s.position = 'fixed';
  s.bottom = '-80px';
  s.left = '0';
  s.right = '0';
  s.zIndex = '99999';
  s.background = '#111827';
  s.borderTop = '1px solid rgba(255,255,255,.08)';
  s.padding = '14px 24px';
  s.fontFamily = "'DM Sans', system-ui, sans-serif";
  s.transition = 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
  s.transform = 'translateY(0)';

  // Inject into page
  document.body.appendChild(bar);

  // Slide up after a brief delay
  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      bar.style.bottom = '0';
    });
  });

  // Hover states
  var acceptBtn = document.getElementById('afro-cc-accept');
  var learnLink = document.getElementById('afro-cc-learn');
  if (acceptBtn) {
    acceptBtn.addEventListener('mouseenter', function () { acceptBtn.style.background = '#0066d6'; });
    acceptBtn.addEventListener('mouseleave', function () { acceptBtn.style.background = '#007aff'; });
  }
  if (learnLink) {
    learnLink.addEventListener('mouseenter', function () { learnLink.style.color = '#fff'; });
    learnLink.addEventListener('mouseleave', function () { learnLink.style.color = '#9ca3af'; });
  }

  // Event handlers
  document.getElementById('afro-cc-accept').addEventListener('click', function () {
    saveConsent('accepted');
    hideBanner();
  });

  document.getElementById('afro-cc-close').addEventListener('click', function () {
    saveConsent('declined');
    disableGA4();
    hideBanner();
  });

  function saveConsent(value) {
    try { localStorage.setItem(STORAGE_KEY, value); } catch (e) {}
  }

  function hideBanner() {
    bar.style.bottom = '-80px';
    setTimeout(function () {
      if (bar.parentNode) bar.parentNode.removeChild(bar);
    }, 500);
  }

  function disableGA4() {
    // Disable GA4 by setting the window property
    window['ga-disable-G-D859CGF391'] = true;
  }
})();
