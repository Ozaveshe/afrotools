/**
 * AFROTOOLS — Mobile Bottom Navigation
 * Web Component <mobile-nav> — fixed bottom bar on screens < 768px.
 *
 * Usage: Add to any page:
 *   <script src="/assets/js/components/mobile-nav.js" defer></script>
 *   <mobile-nav></mobile-nav>
 */
(function () {
  'use strict';

  var CSS = [
    ':host { display: none; }',
    '@media (max-width: 767px) {',
    '  :host {',
    '    display: block;',
    '    position: fixed; bottom: 0; left: 0; right: 0;',
    '    z-index: 9999;',
    '    background: #fff;',
    '    border-top: 1px solid #e5e7eb;',
    '    padding-bottom: env(safe-area-inset-bottom, 0px);',
    '    box-shadow: 0 -2px 12px rgba(0,0,0,.08);',
    '    font-family: var(--font-body, "DM Sans", system-ui, sans-serif);',
    '  }',
    '  .mn-bar {',
    '    display: flex;',
    '    justify-content: space-around;',
    '    align-items: center;',
    '    height: 56px;',
    '    max-width: 480px;',
    '    margin: 0 auto;',
    '  }',
    '  .mn-item {',
    '    display: flex; flex-direction: column; align-items: center;',
    '    justify-content: center; gap: 2px;',
    '    text-decoration: none;',
    '    color: #6B7280;',
    '    font-size: .65rem; font-weight: 600;',
    '    letter-spacing: .02em;',
    '    padding: 4px 0;',
    '    min-width: 56px;',
    '    transition: color .15s;',
    '    -webkit-tap-highlight-color: transparent;',
    '  }',
    '  .mn-item:active { transform: scale(.92); }',
    '  .mn-item.active { color: #007AFF; }',
    '  .mn-icon { font-size: 1.25rem; line-height: 1; }',
    '  .mn-item.active .mn-icon { filter: none; }',
    '}',
    '@media (prefers-color-scheme: dark) and (max-width: 767px) {',
    '  :host { background: #131D2E; border-color: #1E2D40; box-shadow: 0 -2px 12px rgba(0,0,0,.2); }',
    '  .mn-item { color: #8B9CB8; }',
    '  .mn-item.active { color: #4DA3FF; }',
    '}'
  ].join('\n');

  var TABS = [
    { icon: '\u2302', label: 'Home',  href: '/',                 match: /^\/$/ },
    { icon: '\uD83D\uDD27', label: 'Tools', href: '/search/',    match: /\/(search|tools|salary-tax|document-pdf|developer-tools|image-design|education|health|vat-business|uniquely-african|crypto|engineering|legal|ecommerce|data-productivity|language)\//i },
    { icon: '\uD83D\uDCC1', label: 'Vault', href: '/dashboard/vault/', match: /\/vault\//i },
    { icon: '\uD83D\uDC64', label: 'Me',    href: '/dashboard/', match: /\/dashboard\//i }
  ];

  class MobileNav extends HTMLElement {
    connectedCallback() {
      var shadow = this.attachShadow({ mode: 'open' });
      var style = document.createElement('style');
      style.textContent = CSS;
      shadow.appendChild(style);

      var bar = document.createElement('nav');
      bar.className = 'mn-bar';
      bar.setAttribute('aria-label', 'Mobile navigation');

      var path = location.pathname;
      for (var i = 0; i < TABS.length; i++) {
        var t = TABS[i];
        var a = document.createElement('a');
        a.href = t.href;
        a.className = 'mn-item';
        if (t.match.test(path)) a.classList.add('active');
        a.innerHTML = '<span class="mn-icon">' + t.icon + '</span>' + t.label;
        a.setAttribute('aria-label', t.label);
        bar.appendChild(a);
      }
      shadow.appendChild(bar);

      // Add body padding so content isn't hidden behind nav
      this._addBodyPadding();
    }

    _addBodyPadding() {
      if (window.matchMedia('(max-width: 767px)').matches) {
        document.body.style.paddingBottom = '64px';
      }
      window.matchMedia('(max-width: 767px)').addEventListener('change', function (e) {
        document.body.style.paddingBottom = e.matches ? '64px' : '';
      });
    }
  }

  if (!customElements.get('mobile-nav')) {
    customElements.define('mobile-nav', MobileNav);
  }
})();
