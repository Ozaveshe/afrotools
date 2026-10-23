(function () {
  'use strict';

  let installPrompt = null;
  let pendingConsentObserver = null;
  let pendingBodyOpen = false;
  let consentResolvedInSession = false;

  const INSTALL_COPY = {
    en: {
      title: 'Install AfroTools',
      body: 'Add AfroTools to your device for easy access.',
      install: 'Install',
      dismiss: 'Dismiss'
    },
    fr: {
      title: 'Installer AfroTools',
      body: 'Ajoutez AfroTools à votre appareil pour y accéder facilement.',
      install: 'Installer',
      dismiss: 'Fermer'
    },
    sw: {
      title: 'Sakinisha AfroTools',
      body: 'Ongeza AfroTools kwenye kifaa chako ili uifikie kwa urahisi.',
      install: 'Sakinisha',
      dismiss: 'Funga'
    },
    ha: {
      title: 'Shigar da AfroTools',
      body: "Ƙara AfroTools a na'urarka don buɗe shi cikin sauƙi.",
      install: 'Shigar',
      dismiss: 'Rufe'
    },
    yo: {
      title: 'Fi AfroTools sí ẹ̀rọ',
      body: 'Fi AfroTools sí ẹ̀rọ rẹ fún lílò tó rọrùn.',
      install: 'Fi sí ẹ̀rọ',
      dismiss: 'Pa Dé'
    }
  };

  function installLocale() {
    // Match the navbar's routed-locale contract; browser preference must not
    // replace the language of the page the visitor has chosen.
    const routeLocale = window.location.pathname.split('/')[1];
    if (routeLocale !== 'en' && Object.prototype.hasOwnProperty.call(INSTALL_COPY, routeLocale)) return routeLocale;
    const pageLocale = String(document.documentElement.lang || 'en').trim().toLowerCase().replace(/_/g, '-').split('-')[0];
    return Object.prototype.hasOwnProperty.call(INSTALL_COPY, pageLocale) ? pageLocale : 'en';
  }


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

  // Shared notices occupy normal flow; keep an active tool/view anchored when
  // automatic insertion/removal changes preceding page height. Never move main.
  function preserveNoticeView(change) {
    var active = document.activeElement;
    var focused = active && active !== document.body && active.closest && !active.closest('[data-afro-flow-notice]');
    var anchor = focused ? active : null;
    if (!anchor && window.scrollY > 0 && document.elementFromPoint) {
      var nav = document.querySelector('afro-navbar');
      var top = nav ? nav.getBoundingClientRect().bottom : 0;
      anchor = document.elementFromPoint(window.innerWidth / 2, Math.min(top + 16, window.innerHeight / 2));
      if (anchor && anchor.closest && anchor.closest('[data-afro-flow-notice]')) anchor = document.querySelector('main,[role="main"]');
    }
    var oldTop = anchor && anchor.getBoundingClientRect ? anchor.getBoundingClientRect().top : null;
    change();
    if (oldTop === null) return;
    var restore = function () {
      if (!anchor.isConnected || (focused && document.activeElement !== active)) return;
      var delta = anchor.getBoundingClientRect().top - oldTop;
      if (delta) window.scrollBy({ left: 0, top: delta, behavior: 'instant' });
    };
    if (window.requestAnimationFrame) window.requestAnimationFrame(restore); else restore();
  }

  function placeNotice(notice, preserveView) {
    function branch(node) {
      while (node && node.parentNode && node.parentNode !== document.body) node = node.parentNode;
      return node && node.parentNode === document.body ? node : null;
    }
    var nav = branch(document.querySelector('afro-navbar'));
    var main = branch(document.querySelector('main,[role="main"]'));
    var reference = nav && (!main || !nav.contains(main)) ? nav.nextSibling : main || document.body.firstChild;
    var insert = function () { document.body.insertBefore(notice, reference || null); };
    if (preserveView) preserveNoticeView(insert); else insert();
  }

  function stopWaitingForConsent() {
    if (pendingConsentObserver) pendingConsentObserver.disconnect();
    pendingConsentObserver = null;
  }

  function consentNoticePending() {
    return document.getElementById('afro-cookie-consent') || (!consentResolvedInSession && !localStorage.getItem('afrotools_cookie_consent'));
  }

  window.addEventListener('afrotools:cookie-consent', event => {
    if (event.detail && (event.detail.status === 'accepted' || event.detail.status === 'declined')) {
      consentResolvedInSession = true;
      if (pendingConsentObserver && !consentNoticePending()) {
        stopWaitingForConsent();
        if (window.requestAnimationFrame) window.requestAnimationFrame(showInstallBanner); else setTimeout(showInstallBanner, 0);
      }
    }
  });

  function showInstallBanner() {
    if (document.getElementById('afro-pwa-banner')) return;
    if (!installPrompt || localStorage.getItem('afro_pwa_dismissed')) { stopWaitingForConsent(); return; }
    if (!document.body) {
      if (!pendingBodyOpen) {
        pendingBodyOpen = true;
        document.addEventListener('DOMContentLoaded', () => { pendingBodyOpen = false; showInstallBanner(); }, { once: true });
      }
      return;
    }
    if (consentNoticePending()) {
      if (!pendingConsentObserver) {
        pendingConsentObserver = new MutationObserver(() => {
          if (consentNoticePending()) return;
          stopWaitingForConsent();
          // Let consent removal restore its active view before inserting PWA.
          if (window.requestAnimationFrame) window.requestAnimationFrame(showInstallBanner); else setTimeout(showInstallBanner, 0);
        });
        pendingConsentObserver.observe(document.body, { childList: true });
      }
      return;
    }
    stopWaitingForConsent();
    let previousActive = document.activeElement;
    const rememberToolFocus = event => {
      const target = event.target;
      if (target && target !== document.body && target.closest && !target.closest('[data-afro-flow-notice]')) previousActive = target;
    };
    document.addEventListener('focusin', rememberToolFocus);

    const locale = installLocale();
    const copy = INSTALL_COPY[locale];
    const banner = document.createElement('div');
    banner.lang = locale;
    banner.id = 'afro-pwa-banner';
    banner.setAttribute('data-afro-flow-notice', '');
    banner.innerHTML = `
      <style>
        #afro-pwa-banner{box-sizing:border-box;position:relative;grid-column:1/-1;margin:12px auto;background:#111827;border:1px solid #1f2937;border-radius:12px;padding:.875rem clamp(.625rem,3vw,1.25rem);display:flex;flex-wrap:wrap;align-items:center;gap:.75rem;box-shadow:0 8px 32px rgba(0,0,0,.4);font-family:'DM Sans',system-ui,sans-serif;max-width:720px;width:calc(100% - 24px);min-width:0;overflow-anchor:none;scroll-margin-block-start:76px}
        #afro-pwa-banner .pwa-icon{flex:0 0 auto;font-size:1.5rem;align-self:start}
        #afro-pwa-banner .pwa-text{flex:1 1 220px;min-width:0;color:#d1d5db;font-size:.85rem;line-height:1.4;overflow-wrap:anywhere}
        #afro-pwa-banner .pwa-text strong{color:#fff;display:block;font-size:.9rem}
        #afro-pwa-banner .pwa-btn{box-sizing:border-box;min-width:44px;min-height:44px;max-width:100%;padding:.5rem 1rem;border-radius:8px;border:none;font-weight:600;font-size:.8rem;cursor:pointer;font-family:inherit;white-space:normal;overflow-wrap:anywhere}
        #afro-pwa-banner .pwa-btn:focus-visible{outline:3px solid #93c5fd;outline-offset:2px}
        #afro-pwa-banner .pwa-install{flex:0 1 auto;background:var(--color-primary);color:#fff}
        #afro-pwa-banner .pwa-install:hover{background:#0062CC}
        #afro-pwa-banner .pwa-close{flex:0 0 44px;margin-left:auto;background:transparent;color:#d1d5db;font-size:1.1rem;padding:.25rem .5rem}
      </style>
      <span class="pwa-icon">📱</span>
      <div class="pwa-text">
        <strong>${copy.title}</strong>
        ${copy.body}
      </div>
      <button class="pwa-btn pwa-install" id="afro-pwa-install">${copy.install}</button>
      <button class="pwa-btn pwa-close" id="afro-pwa-close" aria-label="${copy.dismiss}">&times;</button>
    `;
    placeNotice(banner, true);

    const removeBanner = () => {
      document.removeEventListener('focusin', rememberToolFocus);
      const restoreFocus = banner.contains(document.activeElement) && previousActive && previousActive.isConnected && previousActive !== document.body;
      if (restoreFocus) {
        const top = previousActive.getBoundingClientRect().top;
        banner.remove();
        window.scrollBy({ left: 0, top: previousActive.getBoundingClientRect().top - top, behavior: 'instant' });
        previousActive.focus({ preventScroll: true });
        previousActive.scrollIntoView({ block: 'nearest', behavior: 'instant' });
      } else preserveNoticeView(() => banner.remove());
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
