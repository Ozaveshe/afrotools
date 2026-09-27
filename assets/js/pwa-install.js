(function () {
  'use strict';

  let installPrompt = null;

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js').then(registration => {
        if (registration.waiting) registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }).catch(() => {});
    });
    navigator.serviceWorker.addEventListener('controllerchange', () => {});
  }

  if (!document.querySelector('link[rel="manifest"]')) {
    const manifest = document.createElement('link');
    manifest.rel = 'manifest';
    manifest.href = '/manifest.json';
    document.head.appendChild(manifest);
  }
  if (!document.querySelector('meta[name="theme-color"]')) {
    const theme = document.createElement('meta');
    theme.name = 'theme-color';
    theme.content = '#0062CC';
    document.head.appendChild(theme);
  }

  function showInstallBanner() {
    if (document.getElementById('afro-pwa-banner')) return;

    const banner = document.createElement('div');
    banner.id = 'afro-pwa-banner';
    banner.innerHTML = `
      <style>
        #afro-pwa-banner{position:fixed;bottom:1rem;left:50%;transform:translateX(-50%);z-index:100000;background:#111827;border:1px solid #1f2937;border-radius:12px;padding:.875rem 1.25rem;display:flex;align-items:center;gap:.75rem;box-shadow:0 8px 32px rgba(0,0,0,.4);font-family:'DM Sans',system-ui,sans-serif;max-width:420px;width:calc(100% - 2rem);animation:afro-pwa-slide .4s ease}
        @keyframes afro-pwa-slide{from{transform:translateX(-50%) translateY(100%);opacity:0}to{transform:translateX(-50%) translateY(0);opacity:1}}
        #afro-pwa-banner .pwa-icon{font-size:1.5rem;flex-shrink:0}
        #afro-pwa-banner .pwa-text{flex:1;color:#d1d5db;font-size:.85rem;line-height:1.4}
        #afro-pwa-banner .pwa-text strong{color:#fff;display:block;font-size:.9rem}
        #afro-pwa-banner .pwa-btn{padding:.5rem 1rem;border-radius:8px;border:none;font-weight:600;font-size:.8rem;cursor:pointer;font-family:inherit}
        #afro-pwa-banner .pwa-install{background:var(--color-primary);color:#fff}
        #afro-pwa-banner .pwa-install:hover{background:#0062CC}
        #afro-pwa-banner .pwa-close{background:transparent;color:#d1d5db;font-size:1.1rem;min-width:44px;min-height:44px;padding:.25rem .5rem}
        @media(max-width:600px){afro-site-assistant{top:auto!important;right:14px!important;bottom:var(--afro-pwa-banner-clearance,160px)!important;left:auto!important}}
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

    // The assistant lives in a shadow root, so its drawer needs a local
    // height rule when the banner lifts its trigger on narrow screens.
    const assistantStyleId = 'afro-pwa-assistant-clearance';
    const syncAssistantPanel = () => {
      if (!banner.isConnected) return;
      const shadow = document.querySelector('afro-site-assistant')?.shadowRoot;
      if (!shadow || shadow.getElementById(assistantStyleId)) return;
      const style = document.createElement('style');
      style.id = assistantStyleId;
      style.textContent = '@media(max-width:600px){.panel{max-height:min(560px,calc(100vh - 120px - var(--afro-pwa-banner-clearance,0px)))!important}}';
      shadow.appendChild(style);
    };
    const assistantObserver = new MutationObserver(syncAssistantPanel);
    assistantObserver.observe(document.body, { childList: true });
    customElements.whenDefined('afro-site-assistant').then(syncAssistantPanel);
    syncAssistantPanel();

    const updateClearance = () => {
      // Include the banner's 1rem bottom offset and a 12px gap above it.
      document.documentElement.style.setProperty('--afro-pwa-banner-clearance', `${Math.ceil(banner.getBoundingClientRect().height) + 28}px`);
    };
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(updateClearance) : null;
    if (observer) observer.observe(banner);
    window.addEventListener('resize', updateClearance);
    updateClearance();

    const removeBanner = () => {
      assistantObserver.disconnect();
      document.querySelector('afro-site-assistant')?.shadowRoot?.getElementById(assistantStyleId)?.remove();
      if (observer) observer.disconnect();
      window.removeEventListener('resize', updateClearance);
      document.documentElement.style.removeProperty('--afro-pwa-banner-clearance');
      banner.remove();
    };

    document.getElementById('afro-pwa-install').addEventListener('click', async () => {
      if (!installPrompt) return;
      installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      installPrompt = null;
      removeBanner();
      if (typeof gtag === 'function') gtag('event', 'pwa_install', { outcome });
    });
    document.getElementById('afro-pwa-close').addEventListener('click', () => {
      removeBanner();
      localStorage.setItem('afro_pwa_dismissed', '1');
    });
  }

  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    installPrompt = event;
    if (!localStorage.getItem('afro_pwa_dismissed')) setTimeout(showInstallBanner, 3000);
  });
})();
