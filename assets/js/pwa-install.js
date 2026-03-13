/**
 * AFROTOOLS PWA — Install prompt + service worker registration
 * Injected by navbar component on every page.
 */
(function () {
  'use strict';

  let _deferredPrompt = null;

  /* ── Register service worker ── */
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js')
        .then(reg => { if (reg.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' }); })
        .catch(() => {});
    });
  }

  /* ── Manifest link ── */
  if (!document.querySelector('link[rel="manifest"]')) {
    const link = document.createElement('link');
    link.rel = 'manifest';
    link.href = '/manifest.json';
    document.head.appendChild(link);
  }

  /* ── Theme color ── */
  if (!document.querySelector('meta[name="theme-color"]')) {
    const meta = document.createElement('meta');
    meta.name = 'theme-color';
    meta.content = '#0c1a10';
    document.head.appendChild(meta);
  }

  /* ── Install prompt ── */
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    _deferredPrompt = e;

    // Don't show if user dismissed before
    if (localStorage.getItem('afro_pwa_dismissed')) return;

    setTimeout(() => _showInstallBanner(), 3000);
  });

  function _showInstallBanner() {
    if (document.getElementById('afro-pwa-banner')) return;

    const banner = document.createElement('div');
    banner.id = 'afro-pwa-banner';
    banner.innerHTML = `
      <style>
        #afro-pwa-banner{position:fixed;bottom:1rem;left:50%;transform:translateX(-50%);z-index:10000;background:#111827;border:1px solid #1f2937;border-radius:12px;padding:.875rem 1.25rem;display:flex;align-items:center;gap:.75rem;box-shadow:0 8px 32px rgba(0,0,0,.4);font-family:'DM Sans',system-ui,sans-serif;max-width:420px;width:calc(100% - 2rem);animation:afro-pwa-slide .4s ease}
        @keyframes afro-pwa-slide{from{transform:translateX(-50%) translateY(100%);opacity:0}to{transform:translateX(-50%) translateY(0);opacity:1}}
        #afro-pwa-banner .pwa-icon{font-size:1.5rem;flex-shrink:0}
        #afro-pwa-banner .pwa-text{flex:1;color:#d1d5db;font-size:.85rem;line-height:1.4}
        #afro-pwa-banner .pwa-text strong{color:#fff;display:block;font-size:.9rem}
        #afro-pwa-banner .pwa-btn{padding:.5rem 1rem;border-radius:8px;border:none;font-weight:600;font-size:.8rem;cursor:pointer;font-family:inherit}
        #afro-pwa-banner .pwa-install{background:#008751;color:#fff}
        #afro-pwa-banner .pwa-install:hover{background:#00a863}
        #afro-pwa-banner .pwa-close{background:transparent;color:#6b7280;font-size:1.1rem;padding:.25rem .5rem}
      </style>
      <span class="pwa-icon">📱</span>
      <div class="pwa-text">
        <strong>Install AfroTools</strong>
        Quick access to all tools, even offline.
      </div>
      <button class="pwa-btn pwa-install" id="afro-pwa-install">Install</button>
      <button class="pwa-btn pwa-close" id="afro-pwa-close" aria-label="Dismiss">&times;</button>
    `;
    document.body.appendChild(banner);

    document.getElementById('afro-pwa-install').addEventListener('click', async () => {
      if (!_deferredPrompt) return;
      _deferredPrompt.prompt();
      const { outcome } = await _deferredPrompt.userChoice;
      _deferredPrompt = null;
      banner.remove();
      if (typeof gtag === 'function') gtag('event', 'pwa_install', { outcome });
    });

    document.getElementById('afro-pwa-close').addEventListener('click', () => {
      banner.remove();
      localStorage.setItem('afro_pwa_dismissed', '1');
    });
  }

  /* ── Listen for SW updates ── */
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      // New service worker activated — optionally notify user
    });
  }
})();
