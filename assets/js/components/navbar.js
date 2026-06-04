/**
 * AFROTOOLS NAVBAR — Everything Platform Edition
 * Mega-menu with 34 categories from tool registry. Mobile drawer. Web Component.
 */
(function () {
  'use strict';

  const THEME_KEY = 'aft_theme';
  const THEME_STYLE_ID = 'afro-theme-standard';
  const THEME_LINK_ID = 'afro-theme-dark-css';
  const THEME_LINK_HREF = '/assets/css/theme-dark.min.css?v=a1713d60';
  const COUNTRY_SELECTOR_THEME_STYLE_ID = 'afro-country-theme';
  const THEME_COLOR_LIGHT = '#F8FAFD';
  const THEME_COLOR_DARK = '#09111F';
  const COUNTRY_SELECTOR_THEME_CSS = `
    :host([data-theme-dark]){color:#EEF5FF}
    :host([data-theme-dark]) .cs-label{color:#B8C7DC}
    :host([data-theme-dark]) .cs-trigger,
    :host([data-theme-dark]) .cs-panel,
    :host([data-theme-dark]) .cs-search{
      background:#121F33;color:#EEF5FF;border-color:#26364E;box-shadow:0 16px 38px rgba(0,0,0,.28)
    }
    :host([data-theme-dark]) .cs-trigger:hover{border-color:#3A4C68}
    :host([data-theme-dark]) .cs-name,
    :host([data-theme-dark]) .cs-option-name,
    :host([data-theme-dark]) .cs-search-input{color:#EEF5FF}
    :host([data-theme-dark]) .cs-meta,
    :host([data-theme-dark]) .cs-chevron,
    :host([data-theme-dark]) .cs-option-meta,
    :host([data-theme-dark]) .cs-empty{color:#9FB0C8}
    :host([data-theme-dark]) .cs-dot{background:rgba(96,165,250,.16);color:#BFDBFE}
    :host([data-theme-dark]) .cs-option{color:#EEF5FF}
    :host([data-theme-dark]) .cs-option:hover,
    :host([data-theme-dark]) .cs-option[aria-selected="true"]{background:rgba(96,165,250,.14);color:#BFDBFE}
    :host([data-theme-dark]) .cs-diaspora{color:#B8C7DC}
  `;
  const THEME_STANDARD_CSS = `
    :root[data-theme="light"]{
      color-scheme:light;
      --color-primary:#0062CC;--color-primary-dark:#0063D1;--color-primary-light:#4DA3FF;--color-primary-pale:rgba(0,122,255,.08);--color-primary-hover:#0063D1;--color-primary-soft:rgba(0,122,255,.08);--color-primary-rgb:0,122,255;--color-secondary:#0063D1;--color-secondary-rgb:0,99,209;--color-accent:#0063D1;--color-accent-light:#E8F2FF;--color-accent-hover:#004BA0;--color-accent-rgb:0,99,209;--color-bg:#F8FAFD;--color-bg-subtle:#F1F5F9;--color-bg-card:#fff;--color-surface:#fff;--color-surface-muted:#F1F5F9;--color-surface-raised:#fff;--color-surface-inset:#EEF4FA;--color-bg-dark:#0A1628;--color-bg-dark-alt:#111D30;--color-bg-hero:linear-gradient(135deg,#F0F7FF 0%,#E8F4FD 50%,#F5F0FF 100%);--color-text:#0f172a;--color-text-muted:#64748B;--color-text-subtle:#94A3B8;--color-text-inverse:#fff;--color-text-link:#0062CC;--color-link:#0062CC;--color-border:#E2E8F0;--color-border-strong:#CBD5E1;--color-border-subtle:#F1F5F9;--color-gold:#F5A623;--color-gold-pale:#fff3cd;--color-warning:#F59E0B;--color-warning-pale:rgba(245,158,11,.08);--color-success:#22c55e;--color-success-pale:rgba(34,197,94,.08);--color-info:#3B82F6;--color-info-pale:rgba(59,130,246,.08);--color-error:#EF4444;--color-error-pale:rgba(239,68,68,.08);--color-danger:#EF4444;--color-danger-pale:rgba(239,68,68,.08);--color-brand:#0062CC;--color-brand-dark:#0063D1;--color-brand-light:#4DA3FF;--color-brand-pale:#E8F2FF;--color-brand-subtle:rgba(0,122,255,.15);
    }
    :root[data-theme="dark"]{
      color-scheme:dark;
      --color-primary:#60A5FA;--color-primary-dark:#93C5FD;--color-primary-light:#BFDBFE;--color-primary-pale:rgba(96,165,250,.14);--color-primary-hover:#93C5FD;--color-primary-soft:rgba(96,165,250,.16);--color-primary-rgb:96,165,250;--color-secondary:#60A5FA;--color-secondary-rgb:96,165,250;--color-accent:#60A5FA;--color-accent-light:rgba(96,165,250,.16);--color-accent-hover:#93C5FD;--color-accent-rgb:96,165,250;--color-bg:#09111F;--color-bg-subtle:#101B2E;--color-bg-card:#121F33;--color-surface:#121F33;--color-surface-muted:#101B2E;--color-surface-raised:#17263D;--color-surface-inset:#0B1524;--color-bg-dark:#050B14;--color-bg-dark-alt:#0A1423;--color-bg-hero:linear-gradient(135deg,#08111F 0%,#101B2E 52%,#17263D 100%);--color-text:#EEF5FF;--color-text-muted:#B8C7DC;--color-text-subtle:#7E8FA8;--color-text-inverse:#07101D;--color-text-link:#93C5FD;--color-link:#93C5FD;--color-border:#26364E;--color-border-strong:#3A4C68;--color-border-subtle:#1A2A40;--color-gold:#FBBF24;--color-gold-pale:rgba(251,191,36,.16);--color-warning:#FBBF24;--color-warning-pale:rgba(251,191,36,.14);--color-success:#34D399;--color-success-pale:rgba(52,211,153,.14);--color-info:#60A5FA;--color-info-pale:rgba(96,165,250,.14);--color-error:#F87171;--color-error-pale:rgba(248,113,113,.14);--color-danger:#F87171;--color-danger-pale:rgba(248,113,113,.14);--color-brand:#60A5FA;--color-brand-dark:#93C5FD;--color-brand-light:#BFDBFE;--color-brand-pale:rgba(96,165,250,.14);--color-brand-subtle:rgba(96,165,250,.18);
    }
    @media (prefers-color-scheme:dark){
      :root:not([data-theme]){
        color-scheme:dark;
        --color-primary:#60A5FA;--color-primary-dark:#93C5FD;--color-primary-light:#BFDBFE;--color-primary-pale:rgba(96,165,250,.14);--color-primary-hover:#93C5FD;--color-primary-soft:rgba(96,165,250,.16);--color-primary-rgb:96,165,250;--color-secondary:#60A5FA;--color-secondary-rgb:96,165,250;--color-accent:#60A5FA;--color-accent-light:rgba(96,165,250,.16);--color-accent-hover:#93C5FD;--color-accent-rgb:96,165,250;--color-bg:#09111F;--color-bg-subtle:#101B2E;--color-bg-card:#121F33;--color-surface:#121F33;--color-surface-muted:#101B2E;--color-surface-raised:#17263D;--color-surface-inset:#0B1524;--color-bg-dark:#050B14;--color-bg-dark-alt:#0A1423;--color-bg-hero:linear-gradient(135deg,#08111F 0%,#101B2E 52%,#17263D 100%);--color-text:#EEF5FF;--color-text-muted:#B8C7DC;--color-text-subtle:#7E8FA8;--color-text-inverse:#07101D;--color-text-link:#93C5FD;--color-link:#93C5FD;--color-border:#26364E;--color-border-strong:#3A4C68;--color-border-subtle:#1A2A40;--color-gold:#FBBF24;--color-gold-pale:rgba(251,191,36,.16);--color-warning:#FBBF24;--color-warning-pale:rgba(251,191,36,.14);--color-success:#34D399;--color-success-pale:rgba(52,211,153,.14);--color-info:#60A5FA;--color-info-pale:rgba(96,165,250,.14);--color-error:#F87171;--color-error-pale:rgba(248,113,113,.14);--color-danger:#F87171;--color-danger-pale:rgba(248,113,113,.14);--color-brand:#60A5FA;--color-brand-dark:#93C5FD;--color-brand-light:#BFDBFE;--color-brand-pale:rgba(96,165,250,.14);--color-brand-subtle:rgba(96,165,250,.18);
      }
    }
    :root[data-theme="dark"] body{background:var(--color-bg)!important;color:var(--color-text)}
    :root[data-theme="dark"] h1,:root[data-theme="dark"] h2,:root[data-theme="dark"] h3,:root[data-theme="dark"] h4,:root[data-theme="dark"] h5,:root[data-theme="dark"] h6,:root[data-theme="dark"] .hero-h1,:root[data-theme="dark"] .card-title,:root[data-theme="dark"] .section-title{color:var(--color-text)!important}
    :root[data-theme="dark"] p,:root[data-theme="dark"] .hero-sub,:root[data-theme="dark"] .card-description,:root[data-theme="dark"] .card-sub,:root[data-theme="dark"] .section-description,:root[data-theme="dark"] .muted{color:var(--color-text-muted)!important}
    :root[data-theme="dark"] .card,:root[data-theme="dark"] .tc,:root[data-theme="dark"] .ut,:root[data-theme="dark"] .cat-card,:root[data-theme="dark"] .why-card,:root[data-theme="dark"] .tool-card,:root[data-theme="dark"] .hero-stats,:root[data-theme="dark"] .trusted-badge,:root[data-theme="dark"] .btn-secondary,:root[data-theme="dark"] .panel,:root[data-theme="dark"] .box{background:var(--color-surface)!important;color:var(--color-text)!important;border-color:var(--color-border)!important;box-shadow:0 10px 30px rgba(0,0,0,.22)}
    :root[data-theme="dark"] input,:root[data-theme="dark"] select,:root[data-theme="dark"] textarea{background:var(--color-surface-inset)!important;color:var(--color-text)!important;border-color:var(--color-border)!important}
    :root[data-theme="dark"] input::placeholder,:root[data-theme="dark"] textarea::placeholder{color:var(--color-text-subtle)!important}
    :root[data-theme="dark"] .hero:not(.tool-hero){background:var(--color-bg-hero)!important;border-color:var(--color-border)!important}
    :root[data-theme="dark"] a{color:inherit}
    :root[data-theme="dark"] .btn-primary,:root[data-theme="dark"] .btn-blue{background:#2563EB!important;color:#fff!important}
    :root[data-theme="dark"] .signup-bar,:root[data-theme="dark"] .hero-stats,:root[data-theme="dark"] .marquee-strip,:root[data-theme="dark"] .sec--light,:root[data-theme="dark"] .sec--white,:root[data-theme="dark"] .sec--showcase,:root[data-theme="dark"] .home-entry-section,:root[data-theme="dark"] .home-trust-section,:root[data-theme="dark"] .home-about-section,:root[data-theme="dark"] .testimonials-sec{background:var(--color-bg)!important;border-color:var(--color-border)!important;color:var(--color-text)!important}
    :root[data-theme="dark"] .sec--grey,:root[data-theme="dark"] .home-entry-section--tools{background:var(--color-bg-subtle)!important;border-color:var(--color-border)!important}
    :root[data-theme="dark"] .signup-bar-btn,:root[data-theme="dark"] .signup-bar-close,:root[data-theme="dark"] .trusted-badge,:root[data-theme="dark"] .btn-secondary,:root[data-theme="dark"] .hero-search,:root[data-theme="dark"] .search-dropdown,:root[data-theme="dark"] .home-preview-card,:root[data-theme="dark"] .preview-search-line,:root[data-theme="dark"] .preview-tool-row,:root[data-theme="dark"] .home-trust-row div,:root[data-theme="dark"] .country-picker-card,:root[data-theme="dark"] .country-picker-form select,:root[data-theme="dark"] .country-popular-list a,:root[data-theme="dark"] .home-tool-card,:root[data-theme="dark"] .preview-result-card,:root[data-theme="dark"] .showcase-tabs,:root[data-theme="dark"] .tcard{background:var(--color-surface)!important;border-color:var(--color-border)!important;color:var(--color-text)!important;box-shadow:0 16px 40px rgba(0,0,0,.22)!important}
    :root[data-theme="dark"] .hero-search{background:var(--color-surface-inset)!important;border-color:var(--color-border-strong)!important}
    :root[data-theme="dark"] .hero-search:focus-within{border-color:var(--color-primary)!important;box-shadow:var(--shadow-focus)!important}
    :root[data-theme="dark"] .signup-bar-close:hover,:root[data-theme="dark"] .btn-secondary:hover,:root[data-theme="dark"] .sd-item:hover,:root[data-theme="dark"] .sd-item.sd-focused,:root[data-theme="dark"] .sd-footer:hover,:root[data-theme="dark"] .showcase-tab:hover,:root[data-theme="dark"] .home-tool-card:hover,:root[data-theme="dark"] .country-popular-list a:hover{background:rgba(96,165,250,.14)!important;border-color:rgba(96,165,250,.42)!important;color:var(--color-primary-light)!important}
    :root[data-theme="dark"] .hero-h1,:root[data-theme="dark"] .hero-sub strong,:root[data-theme="dark"] .sec-h2,:root[data-theme="dark"] .sec-title,:root[data-theme="dark"] .home-entry-copy h2,:root[data-theme="dark"] .home-section-heading h2,:root[data-theme="dark"] .home-about-card h2,:root[data-theme="dark"] .home-trust-row strong,:root[data-theme="dark"] .home-tool-card strong,:root[data-theme="dark"] .home-trust-grid strong,:root[data-theme="dark"] .preview-tool-row strong,:root[data-theme="dark"] .sd-name,:root[data-theme="dark"] .tcard-name{color:var(--color-text)!important}
    :root[data-theme="dark"] .hero-sub,:root[data-theme="dark"] .sec-desc,:root[data-theme="dark"] .sec-sub,:root[data-theme="dark"] .home-section-heading p,:root[data-theme="dark"] .home-about-card p,:root[data-theme="dark"] .home-trust-row span,:root[data-theme="dark"] .home-tool-card p,:root[data-theme="dark"] .home-trust-grid p,:root[data-theme="dark"] .preview-kicker,:root[data-theme="dark"] .preview-tool-row small,:root[data-theme="dark"] .sd-meta,:root[data-theme="dark"] .sd-footer,:root[data-theme="dark"] .tcard-quote,:root[data-theme="dark"] .tcard-role{color:var(--color-text-muted)!important}
    :root[data-theme="dark"] .preview-tool-icon,:root[data-theme="dark"] .home-tool-card span,:root[data-theme="dark"] .tcard-avatar,:root[data-theme="dark"] .tcard-country,:root[data-theme="dark"] .sd-badge-live{background:rgba(96,165,250,.16)!important;color:var(--color-primary-light)!important}
    :root[data-theme="dark"] .hero-search svg,:root[data-theme="dark"] .hero-search input::placeholder{color:var(--color-text-subtle)!important}
    :root[data-theme="dark"] .hero-search input{color:var(--color-text)!important}
    :root[data-theme="dark"] .hero-search-btn,:root[data-theme="dark"] .country-picker-form button,:root[data-theme="dark"] .showcase-tab.active{background:#2563EB!important;color:#fff!important;border-color:#2563EB!important}
    :root[data-theme="dark"] #afro-cookie-consent{background:#07101D!important;border-top-color:rgba(255,255,255,.12)!important;box-shadow:0 -18px 44px rgba(0,0,0,.38)!important}
    :root[data-theme="dark"] #afro-cookie-consent p{color:var(--color-text-muted)!important}
    @media (max-width:720px){:root[data-theme="dark"] .hero-search{border-radius:12px!important;padding:6px!important}:root[data-theme="dark"] .hero-search input,:root[data-theme="dark"] .hero-search-btn{min-height:48px!important}:root[data-theme="dark"] .hero-search-btn{width:100%!important;margin:0!important}}
  `;

  function readThemePreference() {
    try { return localStorage.getItem(THEME_KEY); } catch (_) { return null; }
  }

  function writeThemePreference(theme) {
    try {
      if (theme === 'dark' || theme === 'light') localStorage.setItem(THEME_KEY, theme);
      else localStorage.removeItem(THEME_KEY);
    } catch (_) {}
  }

  function systemWantsDark() {
    return !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  }

  function effectiveTheme(theme) {
    var selected = theme || readThemePreference();
    if (selected === 'dark' || selected === 'light') return selected;
    return systemWantsDark() ? 'dark' : 'light';
  }

  function ensureThemeLink() {
    var existing = document.getElementById(THEME_LINK_ID);
    if (existing) {
      if (existing.getAttribute('href') !== THEME_LINK_HREF) existing.setAttribute('href', THEME_LINK_HREF);
      return;
    }
    var link = document.createElement('link');
    link.id = THEME_LINK_ID;
    link.rel = 'stylesheet';
    link.href = THEME_LINK_HREF;
    document.head.appendChild(link);
  }

  function ensureThemeStyle() {
    ensureThemeLink();
    var existing = document.getElementById(THEME_STYLE_ID);
    if (existing) {
      if (existing.dataset.afroThemeStandard !== 'nav') {
        existing.textContent = THEME_STANDARD_CSS;
        existing.dataset.afroThemeStandard = 'nav';
      }
      return;
    }
    var style = document.createElement('style');
    style.id = THEME_STYLE_ID;
    style.dataset.afroThemeStandard = 'nav';
    style.textContent = THEME_STANDARD_CSS;
    document.head.appendChild(style);
  }

  function syncThemeMeta(theme) {
    var effective = effectiveTheme(theme);
    document.documentElement.style.colorScheme = effective;
    var meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'theme-color';
      document.head.appendChild(meta);
    }
    meta.content = effective === 'dark' ? THEME_COLOR_DARK : THEME_COLOR_LIGHT;
  }

  function syncCountrySelectorThemes(theme) {
    var isDark = effectiveTheme(theme) === 'dark';
    var roots = [document];
    document.querySelectorAll('afro-navbar').forEach(function (nav) {
      if (nav.shadowRoot) roots.push(nav.shadowRoot);
    });
    roots.forEach(function (root) {
      root.querySelectorAll('afro-country-selector').forEach(function (selector) {
        if (selector.shadowRoot && !selector.shadowRoot.getElementById(COUNTRY_SELECTOR_THEME_STYLE_ID)) {
          var style = document.createElement('style');
          style.id = COUNTRY_SELECTOR_THEME_STYLE_ID;
          style.textContent = COUNTRY_SELECTOR_THEME_CSS;
          selector.shadowRoot.appendChild(style);
        }
        if (isDark) selector.setAttribute('data-theme-dark', '');
        else selector.removeAttribute('data-theme-dark');
      });
    });
  }

  function applyThemePreference(theme, options) {
    ensureThemeStyle();
    var selected = theme === 'dark' || theme === 'light' ? theme : 'auto';
    var active = effectiveTheme(selected);
    if (theme === 'dark' || theme === 'light') {
      document.documentElement.setAttribute('data-theme', theme);
      document.documentElement.setAttribute('data-theme-choice', theme);
    } else {
      document.documentElement.setAttribute('data-theme', active);
      document.documentElement.setAttribute('data-theme-choice', 'auto');
      theme = selected;
    }
    syncThemeMeta(active);
    syncCountrySelectorThemes(active);
    if (!options || !options.silent) {
      document.dispatchEvent(new CustomEvent('afrotools:theme-change', {
        detail: { theme: theme, activeTheme: active, isDark: active === 'dark' }
      }));
    }
  }

  try {
    const theme = readThemePreference();
    if (theme === 'dark' || theme === 'light') {
      document.documentElement.setAttribute('data-theme', theme);
    }
  } catch (_) {}

  ensureThemeStyle();
  applyThemePreference(readThemePreference() || 'auto', { silent: true });

  if (window.matchMedia) {
    var themeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    var handleSystemThemeChange = function () {
      if (!readThemePreference()) applyThemePreference('auto');
    };
    if (themeQuery.addEventListener) themeQuery.addEventListener('change', handleSystemThemeChange);
    else if (themeQuery.addListener) themeQuery.addListener(handleSystemThemeChange);
  }

  window.AfroTools = window.AfroTools || {};
  window.AfroTools.darkMode = window.AfroTools.darkMode || {
    toggle: function () {
      var next = effectiveTheme() === 'dark' ? 'light' : 'dark';
      writeThemePreference(next);
      applyThemePreference(next);
      return next;
    },
    set: function (theme) {
      writeThemePreference(theme);
      applyThemePreference(theme);
      return effectiveTheme(theme);
    },
    get: function () {
      return readThemePreference() || 'auto';
    },
    isDark: function () {
      return effectiveTheme() === 'dark';
    }
  };

  const NAV_ITEMS = [
    {
      id: 'financial', label: 'Salary & Tax', labelFr: 'Salaire & Impôts', labelSw: 'Mshahara & Kodi', icon: '💰',
      desc: 'PAYE, income tax, FX, crypto', descFr: 'PAYE, impôt, change, crypto', descSw: 'PAYE, kodi, sarafu, crypto',
      href: '/salary-tax/', hrefFr: '/fr/salary-tax/', hrefSw: '/sw/mshahara-na-kodi/', color: '#e8f0fd', accent: '#0062CC',
      tools: [
        { label: 'Nigeria PAYE Calculator', href: '/nigeria/ng-salary-tax', emoji: '🇳🇬', badge: 'LIVE' },
        { label: 'Kenya PAYE Calculator', href: '/kenya/ke-paye', emoji: '🇰🇪', badge: 'LIVE' },
        { label: 'South Africa SARS Tax', href: '/south-africa/za-paye', emoji: '🇿🇦', badge: 'LIVE' },
        { label: 'Ghana PAYE + SSNIT', href: '/ghana/gh-paye', emoji: '🇬🇭', badge: 'LIVE' },
        { label: 'Egypt Income Tax', href: '/egypt/eg-paye', emoji: '🇪🇬', badge: 'LIVE' },
        { label: 'AI Business Planner', href: '/tools/business-planner/', emoji: '📋', badge: 'LIVE' },
        { label: 'Mortgage Calculator', href: '/tools/mortgage-calculator/', emoji: '🏠', badge: 'LIVE' },
        { label: 'Bank Charges Comparator', href: '/tools/bank-charges/', emoji: '🏦', badge: 'LIVE' },
        { label: 'FIRE Calculator for Africa', href: '/tools/retirement-planner/', emoji: '🏖️', badge: 'LIVE' },
        { label: 'Minimum Wage Checker', href: '/tools/minimum-wage/', emoji: '💰', badge: 'NEW' },
        { label: 'Overtime Calculator', href: '/tools/overtime-calc/', emoji: '⏰', badge: 'NEW' },
        { label: 'Leave & PTO Calculator', href: '/tools/leave-calculator/', emoji: '🏖️', badge: 'NEW' },
        { label: 'Social Security Calculator', href: '/tools/social-security/', emoji: '🛡️', badge: 'NEW' },
        { label: 'Pension Projection', href: '/tools/pension-projection/', emoji: '📈', badge: 'NEW' },
        { label: 'All 54 PAYE Calculators →', href: '/salary-tax/', emoji: '💰' },
      ],
      toolsSw: [
        { label: 'PAYE Kenya', href: '/sw/kenya/kikokotoo-kodi-mshahara/', emoji: 'KE', badge: 'LIVE' },
        { label: 'PAYE Tanzania', href: '/sw/tanzania/kikokotoo-kodi-mshahara/', emoji: 'TZ', badge: 'LIVE' },
        { label: 'PAYE Uganda', href: '/sw/uganda/kikokotoo-kodi-mshahara/', emoji: 'UG', badge: 'LIVE' },
        { label: 'PAYE Rwanda', href: '/sw/rwanda/kikokotoo-kodi-mshahara/', emoji: 'RW', badge: 'LIVE' },
        { label: 'Kima cha chini cha mshahara', href: '/sw/zana/kikokotoo-kima-cha-chini-cha-mshahara/', emoji: 'MW', badge: 'LIVE' },
        { label: 'Muda wa ziada', href: '/sw/zana/kikokotoo-muda-wa-ziada/', emoji: 'OT', badge: 'LIVE' },
        { label: 'Likizo na PTO', href: '/sw/zana/kikokotoo-likizo/', emoji: 'PTO', badge: 'LIVE' },
        { label: 'NSSF, SHIF na hifadhi ya jamii', href: '/sw/zana/kikokotoo-michango-ya-hifadhi-ya-jamii/', emoji: 'NSSF', badge: 'LIVE' },
        { label: 'Linganisha mishahara', href: '/sw/zana/kilinganisha-mishahara/', emoji: 'SAL', badge: 'LIVE' },
        { label: 'Sarafu na FX', href: '/sw/sarafu/', emoji: 'FX', badge: 'LIVE' },
        { label: 'Kibadilishaji sarafu', href: '/sw/zana/kibadilishaji-sarafu/', emoji: 'FX', badge: 'LIVE' },
        { label: 'Zana zote za mishahara ->', href: '/sw/mshahara-na-kodi/', emoji: 'ALL' }
      ],
      toolsHa: [
        { label: 'Albashi da haraji', href: '/ha/albashi-da-haraji/', emoji: 'PAYE', badge: 'HA' },
        { label: 'PAYE na Najeriya', href: '/ha/najeriya/harajin-albashi/', emoji: 'NG', badge: 'HA' },
        { label: 'Kalkuletan VAT', href: '/ha/kayan-aiki/kalkuletan-vat/', emoji: 'VAT', badge: 'HA' },
        { label: 'CIT na Najeriya', href: '/ha/kayan-aiki/cit-najeriya/', emoji: 'CIT', badge: 'HA' },
        { label: 'WHT na Najeriya', href: '/ha/kayan-aiki/wht-najeriya/', emoji: 'WHT', badge: 'HA' },
        { label: 'Fansho Najeriya', href: '/ha/kayan-aiki/fansho-najeriya/', emoji: 'PEN', badge: 'HA' },
        { label: 'NHF Najeriya', href: '/ha/kayan-aiki/nhf-najeriya/', emoji: 'NHF', badge: 'HA' },
        { label: 'Mafi karancin albashi - shafi na Turanci', href: '/tools/minimum-wage/', emoji: 'MW', badge: 'EN' },
        { label: 'Duk kayan albashi ->', href: '/ha/albashi-da-haraji/', emoji: 'ALL' }
      ],
    },
    {
      id: 'hr-payroll', label: 'HR & Payroll', labelFr: 'RH & Paie', labelSw: 'Rasilimali Watu', icon: '💼',
      desc: 'Employee cost, leave, severance', descFr: 'Coût employé, congés, licenciement', descSw: 'Gharama, likizo, fidia',
      href: '/hr-payroll/', color: '#f0fdfa', accent: '#0d9488',
      tools: [
        { label: 'Employee Cost Calculator', href: '/tools/employee-cost/', emoji: '💸', badge: 'NEW' },
        { label: 'Contractor vs Employee', href: '/tools/contractor-vs-employee/', emoji: '⚖️', badge: 'NEW' },
        { label: 'Maternity/Paternity Leave', href: '/tools/maternity-leave/', emoji: '🤰', badge: 'NEW' },
        { label: 'Gratuity & Severance', href: '/tools/gratuity-calculator/', emoji: '💵', badge: 'NEW' },
        { label: 'Retrenchment Package', href: '/tools/retrenchment-calculator/', emoji: '📦', badge: 'NEW' },
        { label: 'Work Permit Cost Guide', href: '/tools/work-permit-cost/', emoji: '🛂', badge: 'NEW' },
        { label: 'Freelancer Rate Card', href: '/tools/freelancer-rate/', emoji: '📋', badge: 'NEW' },
        { label: 'Domestic Worker Guide', href: '/tools/domestic-worker/', emoji: '🏠', badge: 'NEW' },
        { label: 'All HR & Payroll Tools →', href: '/hr-payroll/', emoji: '💼' },
      ]
    },
    {
      id: 'document-pdf', label: 'Document & PDF', labelFr: 'Documents & PDF', labelSw: 'Nyaraka na PDF', icon: '📄',
      desc: 'Merge, split, compress, convert', descFr: 'Fusionner, diviser, compresser, convertir', descSw: 'Unganisha, gawanya, bana, badilisha',
      href: '/document-pdf/', hrefFr: '/fr/document-pdf/', hrefSw: '/sw/hati-na-pdf/', hrefHa: '/ha/takardu-da-pdf/', hrefYo: '/yo/iwe-ati-pdf/', color: '#eff6ff', accent: '#3b82f6',
      tools: [
        { label: 'CV / Resume Builder', href: '/tools/cv-builder/', emoji: '📝', badge: 'LIVE' },
        { label: 'PDF Editor', href: '/tools/pdf-editor/', emoji: '✏️', badge: 'LIVE' },
        { label: 'PDF Workspace', href: '/tools/pdf-workspace/', emoji: '📄', badge: 'LIVE' },
        { label: 'Invoice Generator', href: '/tools/invoice-generator/', emoji: '🧾', badge: 'LIVE' },
        { label: 'PDF Merge & Split', href: '/tools/pdf-merge-split/', emoji: '📑', badge: 'LIVE' },
        { label: 'PDF Compressor', href: '/tools/pdf-compress/', emoji: '🗜️', badge: 'LIVE' },
        { label: 'PDF Format Converter', href: '/tools/pdf-convert/', emoji: '🔄', badge: 'LIVE' },
        { label: 'AI Chat with PDF', href: '/tools/pdf-chat/', emoji: '💬', badge: 'NEW' },
        { label: 'PDF eSignature', href: '/tools/pdf-sign/', emoji: '✍️', badge: 'LIVE' },
        { label: 'Cover Letter Generator', href: '/tools/cover-letter-generator/', emoji: '✉️', badge: 'LIVE' },
        { label: 'All PDF Tools →', href: '/document-pdf/', emoji: '📄' },
      ],
      toolsFr: [
        { label: 'Fusionner et diviser PDF', href: '/fr/tools/fusionner-diviser-pdf/', emoji: '📑', badge: 'LIVE' },
        { label: 'Compresser PDF', href: '/fr/tools/compresser-pdf/', emoji: '🗜️', badge: 'LIVE' },
        { label: 'Convertir PDF', href: '/fr/tools/convertir-pdf/', emoji: '🔄', badge: 'LIVE' },
        { label: 'PDF en image', href: '/fr/tools/pdf-en-image/', emoji: '🖼️', badge: 'LIVE' },
        { label: 'Filigrane PDF', href: '/fr/tools/filigrane-pdf/', emoji: '💧', badge: 'LIVE' },
        { label: 'Numérotation PDF', href: '/fr/tools/numerotation-pdf/', emoji: '#', badge: 'LIVE' },
        { label: 'Comparer PDF', href: '/fr/tools/comparer-pdf/', emoji: '🔍', badge: 'LIVE' },
        { label: 'Réorganiser PDF', href: '/fr/tools/reorganiser-pdf/', emoji: '↕️', badge: 'LIVE' },
        { label: 'En-tête et pied de page PDF', href: '/fr/tools/entete-pied-pdf/', emoji: '📄', badge: 'LIVE' },
        { label: 'Numérotation Bates PDF', href: '/fr/tools/numerotation-bates-pdf/', emoji: '🏷️', badge: 'LIVE' },
        { label: 'Rechercher et remplacer PDF', href: '/fr/tools/rechercher-remplacer-pdf/', emoji: '✏️', badge: 'LIVE' },
        { label: 'Réparer PDF', href: '/fr/tools/reparer-pdf/', emoji: '🛠️', badge: 'LIVE' },
        { label: 'HTML en PDF', href: '/fr/tools/html-en-pdf/', emoji: '🌐', badge: 'LIVE' },
        { label: 'Remplir un formulaire PDF', href: '/fr/tools/remplir-formulaire-pdf/', emoji: '📝', badge: 'LIVE' },
      ],
      toolsSw: [
        { label: 'Kituo cha PDF', href: '/sw/zana/kituo-cha-pdf/', emoji: 'PDF', badge: 'LIVE' },
        { label: 'Hariri PDF', href: '/sw/zana/hariri-pdf/', emoji: 'PDF', badge: 'LIVE' },
        { label: 'Unganisha na gawanya PDF', href: '/sw/zana/unganisha-na-gawanya-pdf/', emoji: 'PDF', badge: 'LIVE' },
        { label: 'Bana PDF', href: '/sw/zana/kubana-pdf/', emoji: 'PDF', badge: 'LIVE' },
        { label: 'Badilisha format ya PDF', href: '/sw/zana/kubadilisha-format-pdf/', emoji: 'PDF', badge: 'LIVE' },
        { label: 'Saini PDF', href: '/sw/zana/kusaini-pdf/', emoji: 'PDF', badge: 'LIVE' },
        { label: 'Mjenzi wa CV', href: '/sw/zana/mjenzi-cv/', emoji: 'CV', badge: 'LIVE' },
        { label: 'Barua ya ombi', href: '/sw/zana/barua-ombi/', emoji: 'DOC', badge: 'LIVE' },
        { label: 'Kizalishaji ankara', href: '/sw/zana/kizalishaji-ankara/', emoji: 'INV', badge: 'LIVE' },
        { label: 'Zana zote za PDF ->', href: '/sw/hati-na-pdf/', emoji: 'ALL' }
      ],
      toolsHa: [
        { label: 'Takardu da PDF', href: '/ha/takardu-da-pdf/', emoji: 'PDF', badge: 'HA' },
        { label: 'Hada da raba PDF', href: '/ha/kayan-aiki/hada-da-raba-pdf/', emoji: 'PDF', badge: 'HA' },
        { label: 'Matsa PDF', href: '/ha/kayan-aiki/matsa-pdf/', emoji: 'PDF', badge: 'HA' },
        { label: 'Kirkiro takardar kudi', href: '/ha/kayan-aiki/kirkiro-invoice/', emoji: 'INV', badge: 'HA' },
        { label: 'Kirkiro Resit', href: '/ha/kayan-aiki/kirkiro-resit/', emoji: 'RCT', badge: 'HA' },
        { label: 'Naira zuwa kalmomi', href: '/ha/kayan-aiki/naira-zuwa-kalmomi/', emoji: 'NGN', badge: 'HA' },
        { label: 'Mai gina CV', href: '/ha/kayan-aiki/gina-cv/', emoji: 'CV', badge: 'HA' },
        { label: 'Wasikar neman aiki', href: '/ha/kayan-aiki/rubuta-wasikar-aiki/', emoji: 'LTR', badge: 'HA' },
        { label: 'Wurin aikin PDF', href: '/ha/kayan-aiki/wurin-aikin-pdf/', emoji: 'PDF', badge: 'HA' },
        { label: 'Canja PDF', href: '/ha/kayan-aiki/canza-pdf/', emoji: 'PDF', badge: 'HA' },
        { label: 'Sa hannu a PDF', href: '/ha/kayan-aiki/sanya-hannu-pdf/', emoji: 'PDF', badge: 'HA' },
        { label: 'Duk kayan PDF ->', href: '/ha/takardu-da-pdf/', emoji: 'ALL' }
      ],
      toolsYo: [
        { label: 'Ìwé àti PDF', href: '/yo/iwe-ati-pdf/', emoji: 'PDF', badge: 'YO' },
        { label: 'Ibi iṣẹ́ PDF', href: '/yo/awon-ise/wurin-pdf/', emoji: 'PDF', badge: 'YO' },
        { label: 'Hàdà àti pín PDF', href: '/yo/awon-ise/hada-ati-pin-pdf/', emoji: 'PDF', badge: 'YO' },
        { label: 'Dín ìwọ̀n PDF', href: '/yo/awon-ise/din-iwon-pdf/', emoji: 'PDF', badge: 'YO' },
        { label: 'Túntò ojú-iwe PDF', href: '/yo/awon-ise/tunto-pdf/', emoji: 'PDF', badge: 'YO' },
        { label: 'Kíriíro ìwé owó', href: '/yo/awon-ise/kiriiro-invoice/', emoji: 'INV', badge: 'YO' },
        { label: 'Kíriíro risiti', href: '/yo/awon-ise/kiriiro-risiti/', emoji: 'RCT', badge: 'YO' },
        { label: 'Naira sí ọ̀rọ̀', href: '/yo/awon-ise/naira-si-oro/', emoji: 'NGN', badge: 'YO' },
        { label: 'Yí PDF padà - ojú ìwé Gẹẹsi', href: '/tools/pdf-convert/', emoji: 'PDF', badge: 'EN' },
        { label: 'Gbogbo iṣẹ́ PDF ->', href: '/yo/iwe-ati-pdf/', emoji: 'ALL' }
      ],
    },
    {
      id: 'image-design', label: 'Image & Design', labelFr: 'Image & Design', labelSw: 'Picha na Ubunifu', icon: '🖼️',
      desc: 'Compress, resize, QR codes', descFr: 'Compresser, redimensionner, codes QR', descSw: 'Bana, badilisha ukubwa, misimbo QR',
      href: '/image-design/', hrefFr: '/fr/image-design/', color: '#fdf2f8', accent: '#ec4899',
      tools: [
        { label: 'Image Compressor', href: '/tools/image-compress/', emoji: '📷', badge: 'LIVE' },
        { label: 'Background Remover', href: '/tools/background-remover/', emoji: '✂️', badge: 'LIVE' },
        { label: 'Image Resizer & Converter', href: '/tools/image-resize/', emoji: '↔️', badge: 'LIVE' },
        { label: 'QR Code Generator', href: '/tools/qr-generator/', emoji: '📲', badge: 'LIVE' },
        { label: 'Passport Photo Tool', href: '/tools/passport-photo/', emoji: '📸', badge: 'LIVE' },
        { label: 'Meme Generator', href: '/tools/meme-generator/', emoji: '😂', badge: 'LIVE' },
        { label: 'Flyer & Poster Maker', href: '/tools/flyer-maker/', emoji: '📰', badge: 'LIVE' },
        { label: 'Logo Maker', href: '/tools/logo-maker/', emoji: '🏷️', badge: 'LIVE' },
        { label: 'Image to Text (OCR)', href: '/tools/image-to-text/', emoji: '🔤', badge: 'LIVE' },
        { label: 'All Image Tools →', href: '/image-design/', emoji: '🖼️' },
      ]
    },
    {
      id: 'developer', label: 'Developer Tools', labelFr: 'Outils Dev', labelSw: 'Zana za Wasanidi', icon: '⌨️',
      desc: 'JSON, Base64, hash, regex', descFr: 'JSON, Base64, hachage, regex', descSw: 'JSON, Base64, hash, regex',
      href: '/developer-tools/', hrefFr: '/fr/developer-tools/', color: '#ede9fe', accent: '#8b5cf6',
      tools: [
        { label: 'JSON Formatter & Validator', href: '/tools/json-formatter/', emoji: '{ }', badge: 'LIVE' },
        { label: 'API Tester (Postman Lite)', href: '/tools/api-tester/', emoji: '🧪', badge: 'LIVE' },
        { label: 'Regex Tester', href: '/tools/regex-tester/', emoji: '🔍', badge: 'LIVE' },
        { label: 'Base64 Encoder/Decoder', href: '/tools/base64/', emoji: '🔐', badge: 'LIVE' },
        { label: 'JWT Decoder', href: '/tools/jwt-decoder/', emoji: '🪙', badge: 'LIVE' },
        { label: 'Text/Code Diff Checker', href: '/tools/diff-checker/', emoji: '🔀', badge: 'LIVE' },
        { label: 'Markdown Editor', href: '/tools/markdown-editor/', emoji: '📝', badge: 'LIVE' },
        { label: 'USSD Code Simulator', href: '/tools/ussd-simulator/', emoji: '📞', badge: 'LIVE' },
        { label: 'African API Directory', href: '/tools/african-api-directory/', emoji: '🌍', badge: 'NEW' },
        { label: 'USSD Flow Builder', href: '/tools/ussd-flow-builder/', emoji: '📞', badge: 'NEW' },
        { label: 'African Domain Checker', href: '/tools/african-domains/', emoji: '🌐', badge: 'NEW' },
        { label: 'PWA Manifest Generator', href: '/tools/pwa-manifest/', emoji: '📱', badge: 'NEW' },
        { label: 'African Color Palette', href: '/tools/african-palette/', emoji: '🎨', badge: 'NEW' },
        { label: 'Hosting Cost Comparator', href: '/tools/hosting-compare/', emoji: '☁️', badge: 'NEW' },
        { label: 'Docker Compose Generator', href: '/tools/docker-compose-gen/', emoji: '🐳', badge: 'NEW' },
        { label: 'Commit Message Generator', href: '/tools/commit-message-gen/', emoji: '📝', badge: 'NEW' },
        { label: 'All Developer Tools →', href: '/developer-tools/', emoji: '⌨️' },
      ],
      toolsSw: [
        { label: 'Zana za Developer kwa Kiswahili', href: '/sw/zana-za-developer/', emoji: 'DEV', badge: 'LIVE' },
        { label: 'API ya AfroTools', href: '/sw/api/', emoji: 'API', badge: 'LIVE' },
        { label: 'Kituo cha Developer', href: '/sw/zana/kituo-cha-developer/', emoji: 'DEV', badge: 'LIVE' },
        { label: 'Kirekebisha JSON', href: '/sw/zana/kirekebisha-json/', emoji: 'JSON', badge: 'LIVE' },
        { label: 'Kijaribu API', href: '/sw/zana/kijaribu-api/', emoji: 'API', badge: 'LIVE' },
        { label: 'Kiigaji USSD', href: '/sw/zana/kiigaji-ussd/', emoji: 'USSD', badge: 'LIVE' },
        { label: 'Saraka ya API Afrika', href: '/sw/zana/saraka-ya-api-afrika/', emoji: 'API', badge: 'LIVE' }
      ]
    },
    {
      id: 'education', label: 'Education', labelFr: 'Éducation', labelSw: 'Elimu', icon: '🎓',
      desc: 'GPA, WAEC, loans, fees', descFr: 'GPA, WAEC, prêts, frais scolaires', descSw: 'GPA, NECTA, mikopo, ada',
      href: '/education/', hrefFr: '/fr/education/', hrefSw: '/sw/elimu/', color: '#EEF4FF', accent: '#3B82F6',
      tools: [
        { label: 'AfroJAMB Hub — CBT + AI Tutor', href: '/jamb/', emoji: '🎯', badge: 'NEW' },
        { label: 'JAMB CBT Mock Exam', href: '/jamb/cbt/', emoji: '⚡', badge: 'NEW' },
        { label: 'JAMB AI Tutor', href: '/jamb/tutor/', emoji: '🤖', badge: 'NEW' },
        { label: 'JAMB Past Questions Bank', href: '/jamb/past-questions/', emoji: '📚', badge: 'NEW' },
        { label: 'WAEC/NECO Grade Calculator', href: '/tools/waec-calculator/', emoji: '📋', badge: 'LIVE' },
        { label: 'JAMB Aggregate Calculator', href: '/tools/jamb-aggregate/', emoji: '🎓', badge: 'LIVE' },
        { label: 'GPA/CGPA Calculator', href: '/tools/gpa-calculator/', emoji: '🎓', badge: 'LIVE' },
        { label: 'Matric APS Score (SA)', href: '/tools/matric-points/', emoji: '🎓', badge: 'LIVE' },
        { label: 'School Fees Comparison Tool', href: '/tools/school-fees/', emoji: '🏫', badge: 'NEW' },
        { label: 'Study Abroad Cost Calculator', href: '/tools/study-abroad-cost/', emoji: '✈️', badge: 'NEW' },
        { label: 'Teacher Salary Scale Lookup', href: '/tools/teacher-salary/', emoji: '👨‍🏫', badge: 'NEW' },
        { label: 'Student Loan Repayment Calc', href: '/tools/student-loan-repay/', emoji: '💰', badge: 'NEW' },
        { label: 'NYSC Allowance Calculator', href: '/tools/nysc-allowance/', emoji: '🇳🇬', badge: 'NEW' },
        { label: 'Kenya HELB Calculator', href: '/tools/ke-helb/', emoji: '🇰🇪', badge: 'NEW' },
        { label: 'KCSE Grade Calculator', href: '/tools/kcse-calculator/', emoji: '🇰🇪', badge: 'NEW' },
        { label: 'Ghana NSS Allowance', href: '/tools/national-service-gh/', emoji: '🇬🇭', badge: 'NEW' },
        { label: 'University Admission Points', href: '/tools/university-admission/', emoji: '🎓', badge: 'NEW' },
        { label: 'Scholarship Finder', href: '/tools/scholarship-finder/', emoji: '🏆', badge: 'LIVE' },
        { label: 'Student Budget Planner', href: '/tools/student-budget/', emoji: '💸', badge: 'NEW' },
        { label: 'Coding Bootcamp Comparator', href: '/tools/coding-bootcamp/', emoji: '💻', badge: 'NEW' },
        { label: 'Exam Countdown Timer', href: '/tools/exam-countdown/', emoji: '⏳', badge: 'LIVE' },
        { label: 'Citation Generator', href: '/tools/citation-generator/', emoji: '📖', badge: 'LIVE' },
        { label: 'All Education Tools →', href: '/education/', emoji: '🎓' },
      ],
      toolsSw: [
        { label: 'Kituo cha elimu', href: '/sw/zana/kituo-elimu/', emoji: 'EDU', badge: 'LIVE' },
        { label: 'Kikokotoo cha WAEC na NECO', href: '/sw/zana/kikokotoo-waec-neco/', emoji: 'WAEC', badge: 'LIVE' },
        { label: 'Kikokotoo cha KCSE', href: '/sw/zana/kikokotoo-kcse/', emoji: 'KCSE', badge: 'LIVE' },
        { label: 'Kikokotoo cha JAMB', href: '/sw/zana/kikokotoo-jamb/', emoji: 'JAMB', badge: 'LIVE' },
        { label: 'GPA na CGPA', href: '/sw/zana/kikokotoo-gpa/', emoji: 'GPA', badge: 'LIVE' },
        { label: 'HELB Kenya', href: '/sw/zana/kikokotoo-helb-kenya/', emoji: 'HELB', badge: 'LIVE' },
        { label: 'Udhamini', href: '/sw/zana/udhamini/', emoji: 'SCH', badge: 'LIVE' },
        { label: 'Siku za mtihani', href: '/sw/zana/siku-za-mtihani/', emoji: 'EXAM', badge: 'LIVE' },
        { label: 'Zana zote za elimu ->', href: '/sw/elimu/', emoji: 'ALL' }
      ],
      toolsHa: [
        { label: 'Ilimi a Hausa', href: '/ha/ilimi/', emoji: 'EDU', badge: 'HA' },
        { label: 'JAMB Turanci', href: '/ha/jamb/turanci/', emoji: 'JAMB', badge: 'HA' },
        { label: 'JAMB Lissafi', href: '/ha/jamb/lissafi/', emoji: 'JAMB', badge: 'HA' },
        { label: 'JAMB Fisiks', href: '/ha/jamb/fisiks/', emoji: 'JAMB', badge: 'HA' },
        { label: 'JAMB Kimiyya', href: '/ha/jamb/kimiyya/', emoji: 'JAMB', badge: 'HA' },
        { label: 'JAMB Nazarin halittu', href: '/ha/jamb/halittu/', emoji: 'JAMB', badge: 'HA' },
        { label: 'Kalkuletan WAEC/NECO', href: '/ha/kayan-aiki/kalkuletan-waec-neco/', emoji: 'WAEC', badge: 'HA' },
        { label: 'Kalkuletan jimillar JAMB', href: '/ha/kayan-aiki/kalkuletan-jamb/', emoji: 'JAMB', badge: 'HA' },
        { label: 'Alawus na NYSC', href: '/ha/kayan-aiki/alawus-na-nysc/', emoji: 'NYSC', badge: 'HA' },
        { label: 'Kudin makaranta', href: '/ha/kayan-aiki/kwatanta-kudin-makaranta/', emoji: 'FEES', badge: 'HA' },
        { label: 'Kalkuletan GPA/CGPA', href: '/ha/kayan-aiki/kalkuletan-gpa-cgpa/', emoji: 'GPA', badge: 'HA' },
        { label: 'Neman tallafin karatu', href: '/ha/kayan-aiki/neman-tallafin-karatu/', emoji: 'AID', badge: 'HA' },
        { label: 'Kasafin dalibi', href: '/ha/kayan-aiki/kasafin-dalibi/', emoji: 'BDG', badge: 'HA' },
        { label: 'Duk kayan ilimi ->', href: '/ha/ilimi/', emoji: 'ALL' }
      ]
    },
    {
      id: 'health', label: 'Health & Wellness', labelFr: 'Santé & Bien-être', labelSw: 'Afya na Ustawi', icon: '🏥',
      desc: 'Disease tools, hospital costs, nutrition — 27 tools, always free', descFr: 'Maladies, frais d\'hôpital, nutrition — 27 outils', descSw: 'Magonjwa, gharama za hospitali, lishe — zana 27',
      href: '/health/', hrefFr: '/fr/health/', hrefSw: '/sw/afya/', hrefYo: '/yo/ilera/', color: '#fce8e8', accent: '#dc2626',
      tools: [
        { label: 'Medical Report Interpreter', href: '/tools/medical-report/', emoji: '🩺', badge: 'LIVE' },
        { label: 'Genotype Compatibility Checker', href: '/tools/genotype-checker/', emoji: '🧬', badge: 'NEW' },
        { label: 'Blood Group Compatibility', href: '/tools/blood-group/', emoji: '🩸', badge: 'NEW' },
        { label: 'Sickle Cell Genotype Advisor', href: '/tools/sickle-cell/', emoji: '🔬', badge: 'LIVE' },
        { label: 'Childbirth Cost Calculator', href: '/tools/childbirth-cost/', emoji: '🤱', badge: 'NEW' },
        { label: 'Drug/Medicine Price Comparator', href: '/tools/drug-price-compare/', emoji: '💊', badge: 'NEW' },
        { label: 'Dental Procedure Cost Estimator', href: '/tools/dental-cost/', emoji: '🦷', badge: 'NEW' },
        { label: 'Hospital Cost Estimator', href: '/tools/hospital-cost/', emoji: '🏥', badge: 'LIVE' },
        { label: 'African Meal Plan Generator', href: '/tools/african-meal-plan/', emoji: '🍽️', badge: 'NEW' },
        { label: 'Child Growth Chart (WHO)', href: '/tools/child-growth/', emoji: '📊', badge: 'NEW' },
        { label: 'Calorie Counter (African Foods)', href: '/health/calorie-counter/', emoji: '🍲', badge: 'LIVE' },
        { label: 'Maternal Mortality Risk Tool', href: '/tools/maternal-mortality/', emoji: '🤰', badge: 'NEW' },
        { label: 'All Health Tools →', href: '/health/', emoji: '🏥' },
      ],
      toolsSw: [
        { label: 'Afya na Ustawi', href: '/sw/afya/', emoji: 'HEALTH', badge: 'LIVE' },
        { label: 'Kikokotoo BMI', href: '/sw/zana/kikokotoo-bmi/', emoji: 'BMI', badge: 'LIVE' },
        { label: 'Shinikizo la damu', href: '/sw/zana/shinikizo-la-damu/', emoji: 'BP', badge: 'LIVE' },
        { label: 'Hatari ya kisukari', href: '/sw/zana/hatari-ya-kisukari/', emoji: 'DIAB', badge: 'LIVE' },
        { label: 'Gharama za hospitali', href: '/sw/zana/gharama-za-hospitali/', emoji: 'HSP', badge: 'LIVE' }
      ],
      toolsHa: [
        { label: 'Fassarar rahoton lafiya - shafi na Turanci', href: '/tools/medical-report/', emoji: 'LAB', badge: 'EN' },
        { label: 'Genotype da rukunin jini', href: '/ha/kayan-aiki/duba-genotype/', emoji: 'DNA', badge: 'HA' },
        { label: 'Jagorar sikila', href: '/ha/kayan-aiki/sickle-cell/', emoji: 'SC', badge: 'HA' },
        { label: 'Kudin asibiti', href: '/ha/kayan-aiki/kudin-asibiti/', emoji: 'HSP', badge: 'HA' },
        { label: 'Kwatanta farashin magani', href: '/ha/kayan-aiki/kwatanta-farashin-magani/', emoji: 'MED', badge: 'HA' },
        { label: 'Dacewar rukunin jini - shafi na Turanci', href: '/tools/blood-group/', emoji: 'BG', badge: 'EN' },
        { label: 'Kudin haihuwa', href: '/ha/kayan-aiki/kudin-haihuwa/', emoji: 'MAT', badge: 'HA' },
        { label: 'Tsarin abincin Afirka', href: '/ha/kayan-aiki/abincin-afirka/', emoji: 'MEAL', badge: 'HA' },
        { label: 'Duk kayan lafiya ->', href: '/ha/lafiya/', emoji: 'ALL' }
      ],
      toolsYo: [
        { label: 'Ìlera ni Yorùbá', href: '/yo/ilera/', emoji: 'HSP', badge: 'YO' },
        { label: 'Duba genotype', href: '/yo/awon-ise/duba-genotype/', emoji: 'DNA', badge: 'YO' },
        { label: 'Sickle cell ati genotype', href: '/yo/awon-ise/sickle-cell/', emoji: 'SC', badge: 'YO' },
        { label: 'Kalkuletan BMI', href: '/yo/awon-ise/kalkuletan-bmi/', emoji: 'BMI', badge: 'YO' },
        { label: 'Owó ilé ìwòsàn', href: '/yo/awon-ise/owo-ile-iwosan/', emoji: 'HSP', badge: 'YO' },
        { label: 'Ìtumọ̀ ìwé yàrá - ojú ìwé Gẹẹsi', href: '/tools/medical-report/', emoji: 'LAB', badge: 'EN' },
        { label: 'Blood group jinlẹ̀ - ojú ìwé Gẹẹsi', href: '/tools/blood-group/', emoji: 'BG', badge: 'EN' },
        { label: 'Gbogbo irinṣẹ ìlera ->', href: '/yo/ilera/', emoji: 'ALL' }
      ]
    },
    {
      id: 'insurance', label: 'Insurance', labelFr: 'Assurance', labelSw: 'Bima', icon: '🛡️',
      desc: 'Car, health, life, funeral, business, travel — 300+ calculators, 54 countries',
      descFr: 'Auto, santé, vie, obsèques, entreprise, voyage — 300+ calculateurs, 54 pays',
      descSw: 'Gari, afya, maisha, mazishi, biashara, safari — vikokotoo 300+, nchi 54',
      href: '/insurance/', hrefFr: '/fr/health-insurance/', color: '#f0f4f8', accent: '#1e3a5f',
      tools: [
        { label: 'Car Insurance Estimator', href: '/tools/car-insurance/', emoji: '🚗', badge: 'LIVE' },
        { label: 'Health Insurance Comparator', href: '/tools/health-insurance-compare/', emoji: '🏥', badge: 'LIVE' },
        { label: 'Life Insurance Calculator', href: '/tools/life-insurance-calc/', emoji: '💚', badge: 'LIVE' },
        { label: 'Funeral Insurance Calculator', href: '/tools/funeral-insurance/', emoji: '🕯️', badge: 'LIVE' },
        { label: 'Motor Third-Party Premium', href: '/tools/motor-third-party/', emoji: '🛣️', badge: 'LIVE' },
        { label: 'Business Insurance Estimator', href: '/tools/business-insurance/', emoji: '🏢', badge: 'LIVE' },
        { label: 'Travel Insurance Estimator', href: '/tools/travel-insurance/', emoji: '✈️', badge: 'LIVE' },
        { label: 'Workers Compensation', href: '/tools/workers-comp/', emoji: '👷', badge: 'LIVE' },
        { label: 'Health Contribution (NHIF/SHIF)', href: '/tools/health-contribution/', emoji: '🩺', badge: 'LIVE' },
        { label: 'All Insurance Tools →', href: '/insurance/', emoji: '🛡️' },
      ],
      toolsSw: [
        { label: 'Bima', href: '/sw/bima/', emoji: 'BIMA', badge: 'LIVE' },
        { label: 'Afya na Bima', href: '/sw/afya-na-bima/', emoji: 'HEALTH', badge: 'LIVE' },
        { label: 'Kilinganisha bima ya afya', href: '/sw/zana/kilinganisha-bima-ya-afya/', emoji: 'BIMA', badge: 'LIVE' },
        { label: 'Kikokotoo bima ya gari', href: '/sw/zana/kikokotoo-bima-ya-gari/', emoji: 'CAR', badge: 'LIVE' },
        { label: 'Kikokotoo bima ya biashara', href: '/sw/zana/kikokotoo-bima-ya-biashara/', emoji: 'BIZ', badge: 'LIVE' }
      ]
    },
    {
      id: 'fintech', label: 'Fintech & Banking', labelFr: 'Fintech & Banque', labelSw: 'Fintech na Benki', icon: '💳',
      desc: 'Savings, loans, mobile money, remittance — 54 countries',
      descFr: 'Épargne, prêts, mobile money, transferts — 54 pays',
      descSw: 'Akiba, mikopo, pesa za simu, uhamisho — nchi 54',
      href: '/fintech/', color: '#f5f3ff', accent: '#8b5cf6',
      tools: [
        { label: 'Remittance Fee Comparator', href: '/tools/remittance-compare/', emoji: '💸', badge: 'LIVE' },
        { label: 'Mobile Money vs Bank Transfer', href: '/tools/mobile-vs-bank/', emoji: '📱', badge: 'LIVE' },
        { label: 'Fixed Deposit Rate Comparator', href: '/tools/fixed-deposit/', emoji: '🏦', badge: 'LIVE' },
        { label: 'Treasury Bill Yield Calculator', href: '/tools/tbill-calc/', emoji: '📊', badge: 'LIVE' },
        { label: 'Real Return After Inflation', href: '/tools/real-return/', emoji: '📈', badge: 'LIVE' },
        { label: 'Loan Shark vs Bank Rate', href: '/tools/loan-shark-compare/', emoji: '⚠️', badge: 'LIVE' },
        { label: 'Microfinance Loan Calculator', href: '/tools/microfinance-loan/', emoji: '🤝', badge: 'LIVE' },
        { label: 'Digital Lending App Rates', href: '/tools/digital-lending/', emoji: '📲', badge: 'LIVE' },
        { label: 'SACCO/Credit Union Calculator', href: '/tools/sacco-calc/', emoji: '🏘️', badge: 'LIVE' },
        { label: 'Payment Gateway Fee Compare', href: '/tools/payment-gateway/', emoji: '💳', badge: 'LIVE' },
        { label: 'BNPL Cost Calculator', href: '/tools/bnpl-calc/', emoji: '🛒', badge: 'LIVE' },
        { label: 'Emergency Fund Calculator', href: '/tools/emergency-fund/', emoji: '🛡️', badge: 'LIVE' },
        { label: 'All Fintech Tools →', href: '/fintech/', emoji: '💳' },
      ],
      toolsSw: [
        { label: 'Fintech na Benki', href: '/sw/fintech/', emoji: 'FIN', badge: 'LIVE' },
        { label: 'Mali, Nyumba na Mikopo', href: '/sw/mali-na-mikopo/', emoji: 'LOAN', badge: 'LIVE' },
        { label: 'Kikokotoo cha mkopo wa nyumba', href: '/sw/zana/kikokotoo-mkopo-wa-nyumba/', emoji: 'LOAN', badge: 'LIVE' },
        { label: 'Mkopo wa gari', href: '/sw/zana/mkopo-wa-gari/', emoji: 'CAR', badge: 'LIVE' }
      ]
    },
    {
      id: 'agriculture', label: 'Agriculture', labelFr: 'Agriculture', labelSw: 'Kilimo', labelHa: 'Noma', icon: '🌾',
      desc: 'Crop yield, seed rate, fertilizer, irrigation, farm profit — 54 countries',
      descFr: 'Rendement, semences, engrais, irrigation, profit agricole — 54 pays',
      descSw: 'Mavuno, mbegu, mbolea, umwagiliaji, faida ya shamba — nchi 54',
      descHa: 'Amfanin gona, taki, riba, rogo da kasuwa ga Najeriya',
      href: '/agriculture/', hrefFr: '/fr/agriculture/', hrefSw: '/sw/kilimo/', hrefHa: '/ha/noma/', hrefYo: '/yo/ogbin/', color: '#E8F2FF', accent: '#007AFF',
      tools: [
        { label: 'Crop Yield Estimators', href: '/agriculture/crop-yield/', emoji: '🌱', badge: 'LIVE' },
        { label: 'Seed Rate Calculators', href: '/agriculture/seed-rate/', emoji: '🌿', badge: 'LIVE' },
        { label: 'Fertilizer Calculators', href: '/agriculture/fertilizer/', emoji: '🧪', badge: 'LIVE' },
        { label: 'Irrigation Calculators', href: '/agriculture/irrigation/', emoji: '💧', badge: 'LIVE' },
        { label: 'Farm Profit/Loss Calculator', href: '/agriculture/farm-profit/', emoji: '📊', badge: 'LIVE' },
      ],
      toolsSw: [
        { label: 'Kitovu cha kilimo', href: '/sw/kilimo/', emoji: 'AG', badge: 'LIVE' },
        { label: 'Makisio ya mavuno', href: '/sw/zana/makisio-ya-mavuno/', emoji: 'YLD', badge: 'LIVE' },
        { label: 'Kikokotoo cha mbolea', href: '/sw/zana/kikokotoo-mbolea/', emoji: 'NPK', badge: 'LIVE' },
        { label: 'Kikokotoo cha umwagiliaji', href: '/sw/zana/kikokotoo-umwagiliaji/', emoji: 'H2O', badge: 'LIVE' },
        { label: 'Mavuno Kenya', href: '/sw/kilimo/mavuno/kenya/', emoji: 'KE', badge: 'LIVE' },
        { label: 'Mbolea Tanzania', href: '/sw/kilimo/mbolea/tanzania/', emoji: 'TZ', badge: 'LIVE' },
        { label: 'Umwagiliaji Uganda', href: '/sw/kilimo/umwagiliaji/uganda/', emoji: 'UG', badge: 'LIVE' }
      ],
      toolsHa: [
        { label: 'Noma a Hausa', href: '/ha/noma/', emoji: 'AGR', badge: 'HA' },
        { label: 'Amfanin gona Najeriya', href: '/ha/noma/amfanin-gona-najeriya/', emoji: 'YLD', badge: 'HA' },
        { label: 'Taki Najeriya', href: '/ha/noma/taki-najeriya/', emoji: 'NPK', badge: 'HA' },
        { label: 'Ribar gona', href: '/ha/kayan-aiki/ribar-gona/', emoji: 'ROI', badge: 'HA' },
        { label: 'Sarrafa rogo', href: '/ha/kayan-aiki/sarrafa-rogo/', emoji: 'ROGO', badge: 'HA' },
        { label: 'Kwandon kasuwa', href: '/ha/kayan-aiki/kwandon-kasuwa/', emoji: 'BASK', badge: 'HA' },
        { label: 'Farashin kayayyakin gona', href: '/ha/kayan-aiki/farashin-kayayyakin-gona/', emoji: 'MKT', badge: 'HA' },
        { label: 'Abincin dabbobi', href: '/ha/kayan-aiki/abincin-dabbobi/', emoji: 'FEED', badge: 'HA' },
        { label: 'Ribar kiwon kifi', href: '/ha/kayan-aiki/ribar-kiwon-kifi/', emoji: 'FISH', badge: 'HA' },
        { label: 'Ban ruwa Najeriya', href: '/ha/noma/ban-ruwa-najeriya/', emoji: 'H2O', badge: 'HA' },
        { label: 'Yawan iri Najeriya', href: '/ha/noma/yawan-iri-najeriya/', emoji: 'IRI', badge: 'HA' },
        { label: 'Duk kayan noma ->', href: '/ha/noma/', emoji: 'ALL' }
      ],
      toolsYo: [
        { label: 'Ọ̀gbìn ni Yorùbá', href: '/yo/ogbin/', emoji: 'AGR', badge: 'YO' },
        { label: 'Èrè oko', href: '/yo/awon-ise/ere-ogbin/', emoji: 'ROI', badge: 'YO' },
        { label: 'Èso irúgbìn', href: '/yo/awon-ise/eso-irugbin/', emoji: 'YLD', badge: 'YO' },
        { label: 'Iwọn ajílẹ̀', href: '/yo/awon-ise/iwon-ajile/', emoji: 'NPK', badge: 'YO' },
        { label: 'Ṣíṣe rogo', href: '/yo/awon-ise/sise-rogo/', emoji: 'ROGO', badge: 'YO' },
        { label: 'Ìsúná ọ̀gbìn', href: '/yo/awon-ise/isuna-ogbin/', emoji: 'BUD', badge: 'YO' },
        { label: 'Àgbọn ọjà', href: '/yo/awon-ise/agbon-oja/', emoji: 'BASK', badge: 'YO' },
        { label: 'Iye ọjà ọ̀gbìn', href: '/yo/awon-ise/owo-oja-ogbin/', emoji: 'MKT', badge: 'YO' },
        { label: 'Oúnjẹ ẹranko', href: '/yo/awon-ise/ounje-eranko/', emoji: 'FEED', badge: 'YO' },
        { label: 'Èrè oko ẹja', href: '/yo/awon-ise/ere-oko-eja/', emoji: 'FISH', badge: 'YO' },
        { label: 'Omi oko - ojú ìwé Gẹẹsi', href: '/agriculture/irrigation/nigeria', emoji: 'H2O', badge: 'EN' },
        { label: 'Gbogbo iṣẹ́ ọ̀gbìn ->', href: '/yo/ogbin/', emoji: 'ALL' }
      ],
    },
    {
      id: 'ecommerce', label: 'VAT & Business Tax', labelFr: 'TVA & Fiscalité', labelSw: 'VAT na Kodi', icon: '🧾',
      desc: 'VAT, margins, break-even', descFr: 'TVA, marges, seuil de rentabilité', descSw: 'VAT, faida, hatua ya usawa',
      href: '/vat-business-tax/', hrefFr: '/fr/vat-business-tax/', hrefSw: '/sw/vat-na-kodi/', hrefHa: '/ha/kasuwanci-da-haraji/', hrefYo: '/yo/owo-ori-owo-ise/', color: '#fff7ed', accent: '#f59e0b',
      tools: [
        { label: 'Pan-African VAT Calculator', href: '/tools/vat-calculator/vat-calc', emoji: '💱', badge: 'LIVE' },
        { label: 'Nigeria VAT (7.5%)', href: '/nigeria/ng-vat', emoji: '🇳🇬', badge: 'LIVE' },
        { label: 'South Africa VAT (15%)', href: '/south-africa/za-vat', emoji: '🇿🇦', badge: 'LIVE' },
        { label: 'Kenya VAT (16%)', href: '/kenya/ke-vat', emoji: '🇰🇪', badge: 'LIVE' },
        { label: 'Ghana VAT + NHIL', href: '/ghana/gh-vat', emoji: '🇬🇭', badge: 'LIVE' },
        { label: 'Egypt VAT (14%)', href: '/egypt/eg-vat', emoji: '🇪🇬', badge: 'LIVE' },
        { label: 'All 50+ VAT Calculators →', href: '/vat-business-tax/', emoji: '🧾' },
      ],
      toolsSw: [
        { label: 'VAT nchi 54', href: '/sw/zana/kikokotoo-vat/', emoji: 'VAT', badge: 'LIVE' },
        { label: 'Mwongozo wa TIN', href: '/sw/zana/mwongozo-tin/', emoji: 'TIN', badge: 'LIVE' },
        { label: 'TIN Kenya', href: '/sw/zana/mwongozo-tin/kenya/', emoji: 'TIN', badge: 'LIVE' },
        { label: 'TIN Nigeria', href: '/sw/zana/mwongozo-tin/nigeria/', emoji: 'TIN', badge: 'LIVE' },
        { label: 'TIN Ghana', href: '/sw/zana/mwongozo-tin/ghana/', emoji: 'TIN', badge: 'LIVE' },
        { label: 'TIN Tanzania', href: '/sw/zana/mwongozo-tin/tanzania/', emoji: 'TIN', badge: 'LIVE' },
        { label: 'TIN Uganda', href: '/sw/zana/mwongozo-tin/uganda/', emoji: 'TIN', badge: 'LIVE' },
        { label: 'TIN Rwanda', href: '/sw/zana/mwongozo-tin/rwanda/', emoji: 'TIN', badge: 'LIVE' },
        { label: 'TIN South Africa', href: '/sw/zana/mwongozo-tin/south-africa/', emoji: 'TIN', badge: 'LIVE' },
        { label: 'Usajili wa biashara', href: '/sw/zana/usajili-biashara/', emoji: 'REG', badge: 'LIVE' },
        { label: 'Kizalishaji ankara', href: '/sw/zana/kizalishaji-ankara/', emoji: 'INV', badge: 'LIVE' },
        { label: 'Break-even', href: '/sw/zana/kikokotoo-break-even/', emoji: 'BE', badge: 'LIVE' },
        { label: 'Biashara na uzingatiaji', href: '/sw/biashara-na-uzingatiaji/', emoji: 'BIZ', badge: 'LIVE' },
        { label: 'Zana zote za VAT na biashara ->', href: '/sw/vat-na-kodi/', emoji: 'ALL' }
      ],
      toolsHa: [
        { label: 'Kalkuletan VAT', href: '/ha/kayan-aiki/kalkuletan-vat/', emoji: 'VAT', badge: 'HA' },
        { label: 'VAT da harajin kasuwanci', href: '/ha/kasuwanci-da-haraji/', emoji: 'TAX', badge: 'HA' },
        { label: 'PAYE na Najeriya', href: '/ha/najeriya/harajin-albashi/', emoji: 'PAYE', badge: 'HA' },
        { label: 'Kirkiro takardar kudi', href: '/ha/kayan-aiki/kirkiro-invoice/', emoji: 'INV', badge: 'HA' },
        { label: 'CIT na Najeriya', href: '/ha/kayan-aiki/cit-najeriya/', emoji: 'CIT', badge: 'HA' },
        { label: 'WHT na Najeriya', href: '/ha/kayan-aiki/wht-najeriya/', emoji: 'WHT', badge: 'HA' },
        { label: 'Jagorar TIN', href: '/ha/kayan-aiki/jagorar-tin-najeriya/', emoji: 'TIN', badge: 'HA' },
        { label: 'Rajistar kasuwanci', href: '/ha/kayan-aiki/rajistar-kasuwanci/', emoji: 'REG', badge: 'HA' },
        { label: 'Matakin rufe kudi - shafi na Turanci', href: '/tools/break-even/', emoji: 'BE', badge: 'EN' },
        { label: 'Duk kayan VAT ->', href: '/ha/kasuwanci-da-haraji/', emoji: 'ALL' }
      ],
      toolsYo: [
        { label: 'VAT àti owó-orí iṣẹ́', href: '/yo/owo-ori-owo-ise/', emoji: 'VAT', badge: 'YO' },
        { label: 'Kalkuletan VAT', href: '/yo/awon-ise/kalkuletan-vat/', emoji: 'VAT', badge: 'YO' },
        { label: 'Ìtọnisọna TIN', href: '/yo/awon-ise/tin-naijiria/', emoji: 'TIN', badge: 'YO' },
        { label: 'Kalkuletan CIT', href: '/yo/awon-ise/cit-naijiria/', emoji: 'CIT', badge: 'YO' },
        { label: 'Kalkuletan WHT', href: '/yo/awon-ise/wht-naijiria/', emoji: 'WHT', badge: 'YO' },
        { label: 'Ìforúkọsílẹ̀ iṣẹ́', href: '/yo/awon-ise/forukosile-owo-ise/', emoji: 'CAC', badge: 'YO' },
        { label: 'Kíriíro ìwé owó', href: '/yo/awon-ise/kiriiro-invoice/', emoji: 'INV', badge: 'YO' },
        { label: 'Kíriíro risiti', href: '/yo/awon-ise/kiriiro-risiti/', emoji: 'RCT', badge: 'YO' },
        { label: 'Break-even - ojú ìwé Gẹẹsi', href: '/tools/break-even/', emoji: 'BE', badge: 'EN' },
        { label: 'Gbogbo VAT àti owó-orí ->', href: '/yo/owo-ori-owo-ise/', emoji: 'ALL' }
      ],
    },
    {
      id: 'legal', label: 'Legal & Compliance', labelFr: 'Juridique & Conformité', labelSw: 'Kisheria & Uzingatiaji', icon: '⚖️',
      desc: 'Business registration, contracts, data privacy, personal legal — 54 countries',
      descFr: 'Enregistrement, contrats, confidentialité, juridique personnel — 54 pays',
      descSw: 'Usajili wa biashara, mikataba, faragha ya data, kisheria — nchi 54',
      href: '/legal/', hrefFr: '/fr/legal/', color: '#f5f3ff', accent: '#7c3aed',
      tools: [
        { label: 'Business Registration Checklist', href: '/tools/business-registration/', emoji: '📋', badge: 'LIVE' },
        { label: 'Company Type Selector', href: '/tools/company-type-selector/', emoji: '🏢', badge: 'LIVE' },
        { label: 'NDA Generator', href: '/tools/nda-generator/', emoji: '📄', badge: 'LIVE' },
        { label: 'Privacy Policy Generator', href: '/tools/privacy-policy-gen/', emoji: '🔒', badge: 'LIVE' },
        { label: 'Will / Testament Generator', href: '/tools/will-generator/', emoji: '📜', badge: 'LIVE' },
        { label: 'NDPA Compliance Checker', href: '/tools/ndpa-checker/', emoji: '🇳🇬', badge: 'LIVE' },
        { label: 'POPIA Compliance Checker', href: '/tools/popia-checker/', emoji: '🇿🇦', badge: 'LIVE' },
        { label: 'Child Support Calculator', href: '/tools/child-support/', emoji: '👶', badge: 'LIVE' },
        { label: 'Court Fee Calculator', href: '/tools/court-fees/', emoji: '⚖️', badge: 'LIVE' },
        { label: 'All Legal Tools →', href: '/legal/', emoji: '⚖️' },
      ],
      toolsSw: [
        { label: 'Kizalishaji NDA', href: '/sw/zana/kizalishaji-nda/', emoji: 'NDA', badge: 'LIVE' },
        { label: 'Azimio la bodi', href: '/sw/zana/azimio-la-bodi/', emoji: 'BODI', badge: 'LIVE' },
        { label: 'Tamko la kisheria', href: '/sw/zana/tamko-la-kisheria/', emoji: 'LAW', badge: 'LIVE' },
        { label: 'Nguvu ya wakili', href: '/sw/zana/nguvu-ya-wakili/', emoji: 'POA', badge: 'LIVE' }
      ]
    },
    {
      id: 'data-productivity', label: 'Business & ROI', labelFr: 'Business & ROI', labelSw: 'Biashara na Faida', icon: '📊',
      desc: 'Productivity, data, investment', descFr: 'Productivité, données, investissement', descSw: 'Tija, data, uwekezaji',
      href: '/data-productivity/', hrefFr: '/fr/data-productivity/', hrefSw: '/sw/data-na-tija/', color: '#eef2ff', accent: '#6366f1',
      tools: [
        { label: 'Monthly Budget Planner', href: '/tools/budget-planner/', emoji: '📋', badge: 'LIVE' },
        { label: 'Unit Converter (African)', href: '/tools/unit-converter/', emoji: '📏', badge: 'LIVE' },
        { label: 'Public Holiday Calendar', href: '/tools/public-holidays/', emoji: '📅', badge: 'LIVE' },
        { label: 'Working Days Calculator', href: '/tools/working-days/', emoji: '📆', badge: 'LIVE' },
        { label: 'Time Zone Converter', href: '/tools/time-zone/', emoji: '🕐', badge: 'LIVE' },
        { label: 'Age Calculator', href: '/tools/age-calculator/', emoji: '🎂', badge: 'LIVE' },
        { label: 'Pomodoro Timer', href: '/tools/pomodoro/', emoji: '🍅', badge: 'LIVE' },
        { label: 'All Business & ROI Tools →', href: '/data-productivity/', emoji: '📊' },
      ],
      toolsSw: [
        { label: 'Biashara na Faida', href: '/sw/biashara-na-faida/', emoji: 'ROI', badge: 'LIVE' },
        { label: 'Data na Tija', href: '/sw/data-na-tija/', emoji: 'DATA', badge: 'LIVE' },
        { label: 'Kikokotoo break-even', href: '/sw/zana/kikokotoo-break-even/', emoji: 'BE', badge: 'LIVE' },
        { label: 'Mpango bajeti', href: '/sw/zana/mpango-bajeti/', emoji: 'BUD', badge: 'LIVE' },
        { label: 'Unit economics', href: '/sw/zana/unit-economics/', emoji: 'UNIT', badge: 'LIVE' }
      ]
    },
    {
      id: 'language', label: 'Language & Translation', labelFr: 'Langues & Traduction', labelSw: 'Lugha na Tafsiri', icon: '🗣️',
      desc: 'Yoruba, Swahili, Hausa, Amharic', descFr: 'Yoruba, Swahili, Haoussa, Amharique', descSw: 'Kiyoruba, Kiswahili, Kihausa, Kiamhari',
      href: '/language/', hrefFr: '/fr/language/', hrefSw: '/sw/lugha-na-tafsiri/', hrefHa: '/ha/harshe-da-fassara/', hrefYo: '/yo/ede-ati-itumo/', color: '#faf5ff', accent: '#a855f7',
      tools: [
        { label: 'Nigerian Pidgin Translator', href: '/tools/pidgin-translator/', emoji: '🗣️', badge: 'LIVE' },
        { label: 'Swahili Translator', href: '/tools/swahili-translator/', emoji: '🌍', badge: 'LIVE' },
        { label: 'Yoruba Translator', href: '/tools/yoruba-translator/', emoji: '🇳🇬', badge: 'LIVE' },
        { label: 'Hausa Translator', href: '/tools/hausa-translator/', emoji: '🇳🇬', badge: 'LIVE' },
        { label: 'Amharic Translator', href: '/tools/amharic-translator/', emoji: '🇪🇹', badge: 'LIVE' },
        { label: 'African Name Meaning', href: '/tools/african-name-meaning/', emoji: '✨', badge: 'LIVE' },
        { label: 'Francophone Africa Translator', href: '/tools/french-african/', emoji: '🇨🇮', badge: 'LIVE' },
        { label: 'All Language Tools →', href: '/language/', emoji: '🗣️' },
      ],
      toolsSw: [
        { label: 'Lugha na Tafsiri', href: '/sw/lugha-na-tafsiri/', emoji: 'LANG', badge: 'LIVE' },
        { label: 'Mtafsiri wa Kiswahili', href: '/sw/zana/mtafsiri-wa-kiswahili/', emoji: 'SW', badge: 'LIVE' },
        { label: 'Mtafsiri wa Kifaransa Afrika', href: '/sw/zana/mtafsiri-wa-kifaransa-afrika/', emoji: 'FR', badge: 'LIVE' },
        { label: 'Kutafsiri PDF', href: '/sw/zana/kutafsiri-pdf/', emoji: 'PDF', badge: 'LIVE' },
        { label: 'Transliteration ya maandishi', href: '/sw/zana/transliteration-ya-maandishi/', emoji: 'TXT', badge: 'LIVE' }
      ],
      toolsHa: [
        { label: 'Mai fassara Hausa', href: '/ha/kayan-aiki/mai-fassara-hausa/', emoji: 'HA', badge: 'HA' },
        { label: 'Kalmomin kasuwa', href: '/ha/kayan-aiki/mai-fassara-hausa/', emoji: 'PHR', badge: 'HA' },
        { label: 'Sunayen Afirka', href: '/tools/african-name-meaning/', emoji: 'NAME', badge: 'EN' },
        { label: 'Karin magana', href: '/tools/african-proverbs/', emoji: 'PROV', badge: 'EN' },
        { label: 'Fassarar PDF - shafi na Turanci', href: '/tools/pdf-translate/', emoji: 'PDF', badge: 'EN' },
        { label: 'Mai fassara Yoruba - shafi na Turanci', href: '/tools/yoruba-translator/', emoji: 'YO', badge: 'EN' },
        { label: 'Mai fassara Swahili - shafi na Turanci', href: '/tools/swahili-translator/', emoji: 'SW', badge: 'EN' },
        { label: 'Duk kayan harshe ->', href: '/ha/harshe-da-fassara/', emoji: 'ALL' }
      ],
      toolsYo: [
        { label: 'Èdè àti Ìtumọ̀', href: '/yo/ede-ati-itumo/', emoji: 'LANG', badge: 'YO' },
        { label: 'Olùfàssara Yorùbá', href: '/yo/awon-ise/olufassara-yoruba/', emoji: 'YO', badge: 'YO' },
        { label: 'Yorùbá phrasebook tó gbooro - ojú ìwé Gẹẹsi', href: '/tools/yoruba-translator/', emoji: 'YO', badge: 'EN' },
        { label: 'Hausa translator - ojú ìwé Gẹẹsi', href: '/tools/hausa-translator/', emoji: 'HA', badge: 'EN' },
        { label: 'Igbo translator - ojú ìwé Gẹẹsi', href: '/tools/igbo-translator/', emoji: 'IG', badge: 'EN' },
        { label: 'Swahili translator - ojú ìwé Gẹẹsi', href: '/tools/swahili-translator/', emoji: 'SW', badge: 'EN' },
        { label: 'Pidgin translator - ojú ìwé Gẹẹsi', href: '/tools/pidgin-translator/', emoji: 'PG', badge: 'EN' },
        { label: 'Ìtumọ̀ PDF - ojú ìwé Gẹẹsi', href: '/tools/pdf-translate/', emoji: 'PDF', badge: 'EN' },
        { label: 'Gbogbo iṣẹ́ èdè ->', href: '/yo/ede-ati-itumo/', emoji: 'ALL' }
      ]
    },
    {
      id: 'african', label: 'Uniquely African', labelFr: 'Spécialités Africaines', labelSw: 'Vya Kiafrika', icon: '🌍',
      desc: 'Japa, generator, ajo, mobile money', descFr: 'Épargne collective, mobile money, recettes', descSw: 'Japa, jenereta, chama, pesa za simu',
      href: '/african/', hrefFr: '/fr/african/', color: '#fef2f2', accent: '#dc2626',
      tools: [
        { label: 'AfroPoints — Earn Money', href: '/tools/afropoints/', emoji: '🎯', badge: 'NEW' },
        { label: 'AfroAtlas Explorer', href: '/tools/afroatlas/', emoji: '🌍', badge: 'NEW' },
        { label: 'AfroKitchen Recipes', href: '/tools/afrokitchen/', emoji: '🍲', badge: 'LIVE' },
        { label: 'AfroConflict', href: '/tools/africa-conflict/', emoji: '⚔️', badge: 'LIVE' },
      ],
      toolsSw: [
        { label: 'Nchi za Afrika', href: '/sw/nchi/', emoji: 'AFR', badge: 'LIVE' },
        { label: 'Blogu ya Kiswahili', href: '/sw/blogu/', emoji: 'BLOG', badge: 'LIVE' },
        { label: 'Ada za pesa simu', href: '/sw/zana/ada-pesa-simu/', emoji: 'MOMO', badge: 'LIVE' },
        { label: 'Jikoni la AfroTools', href: '/sw/zana/jikoni/', emoji: 'FOOD', badge: 'LIVE' },
        { label: 'Zana zote za Kiswahili ->', href: '/sw/zana-zote/', emoji: 'ALL' }
      ]
    },
    {
      id: 'francophone', label: 'Outils en Français', icon: '🇫🇷',
      desc: 'Salaire net, TVA — 14 pays',
      href: '/fr/', color: '#eef6ff', accent: '#0055A4',
      tools: [
        { label: "Côte d'Ivoire — Salaire", href: '/fr/cote-divoire/calculateur-salaire-net', emoji: '🇨🇮', badge: 'LIVE' },
        { label: 'Sénégal — Salaire', href: '/fr/senegal/calculateur-salaire-net', emoji: '🇸🇳', badge: 'LIVE' },
        { label: 'Cameroun — Salaire', href: '/fr/cameroun/calculateur-salaire-net', emoji: '🇨🇲', badge: 'LIVE' },
        { label: 'RD Congo — Salaire', href: '/fr/rdc/calculateur-salaire-net', emoji: '🇨🇩', badge: 'LIVE' },
        { label: 'Maroc — Salaire', href: '/fr/maroc/calculateur-salaire-net', emoji: '🇲🇦', badge: 'LIVE' },
        { label: 'Algérie — Salaire', href: '/fr/algerie/calculateur-salaire-net', emoji: '🇩🇿', badge: 'LIVE' },
        { label: 'Tunisie — Salaire', href: '/fr/tunisie/calculateur-salaire-net', emoji: '🇹🇳', badge: 'LIVE' },
        { label: 'Mali — Salaire', href: '/fr/mali/calculateur-salaire-net', emoji: '🇲🇱', badge: 'LIVE' },
        { label: 'Burkina Faso — Salaire', href: '/fr/burkina-faso/calculateur-salaire-net', emoji: '🇧🇫', badge: 'LIVE' },
        { label: 'Niger — Salaire', href: '/fr/niger/calculateur-salaire-net', emoji: '🇳🇪', badge: 'LIVE' },
        { label: 'Guinée — Salaire', href: '/fr/guinee/calculateur-salaire-net', emoji: '🇬🇳', badge: 'LIVE' },
        { label: 'Congo — Salaire', href: '/fr/congo/calculateur-salaire-net', emoji: '🇨🇬', badge: 'LIVE' },
        { label: 'Gabon — Salaire', href: '/fr/gabon/calculateur-salaire-net', emoji: '🇬🇦', badge: 'LIVE' },
        { label: 'Togo — Salaire', href: '/fr/togo/calculateur-salaire-net', emoji: '🇹🇬', badge: 'LIVE' },
        { label: 'Tous les calculateurs TVA →', href: '/fr/', emoji: '🧾' },
      ]
    },
    {
      id: 'trade', label: 'Trade & Import', labelFr: 'Commerce & Import', labelSw: 'Biashara na Uagizaji', icon: '🚢',
      desc: 'LC, duties, incoterms, ECOWAS, SADC, AfCFTA', descFr: 'LC, droits de douane, incotermes', descSw: 'LC, ushuru, incoterms, ECOWAS, SADC, AfCFTA',
      href: '/trade/', hrefFr: '/fr/trade/', color: '#E8F2FF', accent: '#007AFF',
      tools: [
        { label: 'AfCFTA Tariff Tracker', href: '/tools/afcfta-tracker/', emoji: '🌍', badge: 'LIVE' },
        { label: 'Landed Cost Calculator', href: '/tools/landed-cost/', emoji: '📦', badge: 'LIVE' },
        { label: 'Shipping Cost Estimator', href: '/tools/shipping-estimator/', emoji: '🚢', badge: 'LIVE' },
        { label: 'FX Import Cost Impact', href: '/tools/fx-import-impact/', emoji: '💱', badge: 'LIVE' },
        { label: 'LC Fee Calculator', href: '/tools/lc-calculator/', emoji: '🏦', badge: 'LIVE' },
        { label: 'Export Docs Checklist', href: '/tools/export-docs/', emoji: '📋', badge: 'LIVE' },
        { label: 'Certificate of Origin', href: '/tools/coo-generator/', emoji: '📜', badge: 'LIVE' },
        { label: 'Port Demurrage Calculator', href: '/tools/demurrage-calculator/', emoji: '⚓', badge: 'LIVE' },
        { label: 'Incoterms 2020 Calculator', href: '/tools/incoterms-calculator/', emoji: '⚖️', badge: 'LIVE' },
        { label: 'Trade Finance Comparator', href: '/tools/trade-finance-comparator/', emoji: '💼', badge: 'NEW' },
        { label: 'Commodity Trade Tracker', href: '/tools/commodity-tracker/', emoji: '📈', badge: 'NEW' },
        { label: 'B2B Payment Comparator', href: '/tools/payment-comparator/', emoji: '💸', badge: 'NEW' },
        { label: 'ECOWAS Levy Calculator', href: '/tools/ecowas-levy/', emoji: '🌍', badge: 'NEW' },
        { label: 'SADC Rules of Origin', href: '/tools/sadc-roo/', emoji: '🌐', badge: 'NEW' },
        { label: 'EAC Common External Tariff', href: '/tools/eac-cet/', emoji: '🏷️', badge: 'NEW' },
        { label: 'Proforma Invoice Generator', href: '/tools/proforma-invoice/', emoji: '📄', badge: 'NEW' },
        { label: 'Packing List Generator', href: '/tools/packing-list/', emoji: '📦', badge: 'NEW' },
        { label: 'Bill of Lading Template', href: '/tools/bol-generator/', emoji: '🚢', badge: 'NEW' },
      ],
      toolsSw: [
        { label: 'Biashara ya nje', href: '/sw/biashara-ya-nje/', emoji: 'TRADE', badge: 'LIVE' },
        { label: 'Ushuru wa forodha', href: '/sw/zana/ushuru-forodha/', emoji: 'DUTY', badge: 'LIVE' },
        { label: 'Gharama iliyofika', href: '/sw/zana/kikokotoo-gharama-iliyofika/', emoji: 'COST', badge: 'LIVE' },
        { label: 'Ada za LC', href: '/sw/zana/ada-lc/', emoji: 'LC', badge: 'LIVE' },
        { label: 'Incoterms', href: '/sw/zana/kikokotoo-incoterms/', emoji: 'INC', badge: 'LIVE' },
        { label: 'Nyaraka za usafirishaji', href: '/sw/zana/orodha-nyaraka-usafirishaji/', emoji: 'DOC', badge: 'LIVE' }
      ]
    },
    {
      id: 'telecom', label: 'Telecom & Mobile', labelFr: 'Télécom & Mobile', labelSw: 'Mawasiliano', icon: '📱',
      desc: 'Data plans, USSD codes, roaming, ISPs', descFr: 'Forfaits data, codes USSD, itinérance', descSw: 'Mipango ya data, misimbo ya USSD',
      href: '/telecom/', hrefSw: '/sw/mawasiliano-na-mtandao/', hrefHa: '/ha/sadarwa/', hrefYo: '/yo/ibaraenisoro/', color: '#ECFEFF', accent: '#06B6D4',
      tools: [
        { label: 'Data Plan Comparator', href: '/telecom/data-plan-compare/', emoji: '📊', badge: 'LIVE' },
        { label: 'USSD Code Directory', href: '/telecom/ussd-directory/', emoji: '📱', badge: 'LIVE' },
        { label: 'Roaming Cost Calculator', href: '/telecom/roaming-cost/', emoji: '✈️', badge: 'LIVE' },
        { label: 'Mobile Money Fees', href: '/tools/mobile-money-fees/', emoji: '💸', badge: 'LIVE' },
        { label: 'Starlink vs Local ISP', href: '/telecom/starlink-compare/', emoji: '🛰️', badge: 'NEW' },
        { label: 'DStv/GOtv Comparator', href: '/telecom/tv-compare/', emoji: '📺', badge: 'NEW' },
        { label: 'Data Usage Calculator', href: '/telecom/data-usage-calc/', emoji: '📈', badge: 'LIVE' },
        { label: 'Airtime to Cash Value', href: '/telecom/airtime-value/', emoji: '💰', badge: 'NEW' },
        { label: 'Number Portability Guide', href: '/telecom/number-portability/', emoji: '🔄', badge: 'NEW' },
        { label: 'SIM Registration Checker', href: '/telecom/sim-registration/', emoji: '🪪', badge: 'NEW' },
        { label: 'Internet Speed vs Cost', href: '/telecom/internet-compare/', emoji: '🌐', badge: 'NEW' },
        { label: 'All Telecom Tools →', href: '/telecom/', emoji: '📱' },
      ],
      toolsSw: [
        { label: 'Mawasiliano na Mtandao', href: '/sw/mawasiliano-na-mtandao/', emoji: 'NET', badge: 'LIVE' },
        { label: 'Internet na intaneti', href: '/sw/zana/kilinganisha-intaneti/', emoji: 'NET', badge: 'LIVE' },
        { label: 'Starlink dhidi ya ISP za ndani', href: '/sw/zana/starlink-dhidi-ya-isp-za-ndani/', emoji: 'ISP', badge: 'LIVE' },
        { label: 'Fiber dhidi ya LTE na 5G', href: '/sw/zana/fiber-dhidi-ya-lte-na-5g/', emoji: '5G', badge: 'LIVE' },
        { label: 'Kiigaji USSD', href: '/sw/zana/kiigaji-ussd/', emoji: 'USSD', badge: 'LIVE' },
        { label: 'Ada za pesa simu', href: '/sw/zana/ada-pesa-simu/', emoji: 'MOMO', badge: 'LIVE' }
      ],
      toolsHa: [
        { label: 'Lambobin USSD', href: '/ha/kayan-aiki/lambobin-ussd/', emoji: 'USSD', badge: 'HA' },
        { label: 'Link din WhatsApp', href: '/ha/kayan-aiki/whatsapp-link/', emoji: 'WA', badge: 'HA' },
        { label: 'Kudin tura kudi ta waya', href: '/ha/kayan-aiki/kudin-tura-kudi-ta-waya/', emoji: 'FEE', badge: 'HA' },
        { label: 'Kiyasin amfani da intanet', href: '/ha/kayan-aiki/amfanin-bayanan-intanet/', emoji: 'GB', badge: 'HA' },
        { label: 'Rajistar layin waya da NIN', href: '/ha/kayan-aiki/rajistar-layin-waya-nin/', emoji: 'NIN', badge: 'HA' },
        { label: 'Kwatanta kunshin intanet', href: '/ha/kayan-aiki/kwatanta-kunshin-intanet/', emoji: 'GB', badge: 'HA' },
        { label: 'Darajar katin waya', href: '/ha/kayan-aiki/darajar-katin-waya/', emoji: 'KTN', badge: 'HA' },
        { label: 'Mai gwada USSD - shafi na Turanci', href: '/tools/ussd-simulator/', emoji: 'DEV', badge: 'EN' },
        { label: 'Duk kayan sadarwa ->', href: '/ha/sadarwa/', emoji: 'ALL' }
      ],
      toolsYo: [
        { label: 'Àwọn lambar USSD', href: '/yo/awon-ise/lambobin-ussd/', emoji: 'USSD', badge: 'YO' },
        { label: 'Ìjápọ̀ WhatsApp', href: '/yo/awon-ise/whatsapp-link/', emoji: 'WA', badge: 'YO' },
        { label: 'Ìṣirò GB oṣooṣù', href: '/yo/awon-ise/amulo-data/', emoji: 'GB', badge: 'YO' },
        { label: 'SIM, NIN ati BVN', href: '/yo/awon-ise/rajista-sim-nin/', emoji: 'NIN', badge: 'YO' },
        { label: 'Ìfiwéra pákẹ́ẹ̀jì GB - ojú ìwé Gẹẹsi', href: '/telecom/data-plan-compare/', emoji: 'GB', badge: 'EN' },
        { label: 'Ìdánwò USSD - ojú ìwé Gẹẹsi', href: '/tools/ussd-simulator/', emoji: 'USSD', badge: 'EN' },
        { label: 'Gbogbo ohun ìbáraẹnisọrọ ->', href: '/yo/ibaraenisoro/', emoji: 'ALL' }
      ]
    },
    {
      id: 'energy', label: 'Energy & Utilities', labelFr: 'Énergie & Utilitaires', labelSw: 'Nishati na Huduma', icon: '⚡',
      desc: 'Electricity tariff, solar ROI, generator fuel, water bills', descFr: 'Tarifs électricité, ROI solaire, coût générateur', descSw: 'Umeme, jua, mafuta ya jenereta, bili ya maji',
      href: '/energy/', color: '#FFFBEB', accent: '#F59E0B',
      tools: [
        { label: 'Electricity Tariff Calculator', href: '/tools/electricity-tariff/', emoji: '⚡', badge: 'LIVE' },
        { label: 'Solar Panel ROI Calculator', href: '/tools/solar-roi/', emoji: '☀️', badge: 'LIVE' },
        { label: 'Prepaid Meter Calculator', href: '/tools/prepaid-meter/', emoji: '🔢', badge: 'LIVE' },
        { label: 'Generator Fuel Cost', href: '/tools/generator-fuel/', emoji: '⛽', badge: 'LIVE' },
        { label: 'Solar vs Generator', href: '/tools/solar-vs-generator/', emoji: '⚖️', badge: 'LIVE' },
        { label: 'Electricity Bill Verifier', href: '/tools/electricity-bill-verify/', emoji: '🔍', badge: 'LIVE' },
        { label: 'Water Bill Calculator', href: '/tools/water-bill/', emoji: '💧', badge: 'LIVE' },
        { label: 'Gas / LPG Cost', href: '/tools/gas-lpg-cost/', emoji: '🔥', badge: 'LIVE' },
        { label: 'PayGo Solar Calculator', href: '/tools/paygo-solar/', emoji: '🌤️', badge: 'LIVE' },
        { label: 'Outage Cost (Business)', href: '/tools/outage-cost/', emoji: '🔌', badge: 'LIVE' },
        { label: 'Solar Sizing Calculator', href: '/tools/solar-sizing/', emoji: '🛠️', badge: 'LIVE' },
        { label: 'Battery & Inverter Sizing', href: '/tools/battery-sizing/', emoji: '🔋', badge: 'LIVE' },
        { label: 'Home Energy Audit', href: '/tools/energy-audit/', emoji: '🏠', badge: 'LIVE' },
        { label: 'Appliance Power Calculator', href: '/tools/appliance-power/', emoji: '🔌', badge: 'LIVE' },
        { label: 'Backup Duration Calculator', href: '/tools/backup-duration/', emoji: '🔦', badge: 'LIVE' },
        { label: 'Diesel vs Solar Farm', href: '/tools/diesel-vs-solar-farm/', emoji: '🌾', badge: 'LIVE' },
        { label: 'Mini-Grid Feasibility', href: '/tools/mini-grid-feasibility/', emoji: '🏘️', badge: 'LIVE' },
        { label: 'Carbon Footprint (Energy)', href: '/tools/carbon-footprint-energy/', emoji: '🌍', badge: 'LIVE' },
        { label: 'EV Charging Cost', href: '/tools/ev-charging/', emoji: '🚗', badge: 'LIVE' },
        { label: 'Biogas Digester ROI', href: '/tools/biogas-roi/', emoji: '🐄', badge: 'LIVE' },
        { label: 'All Energy Tools →', href: '/energy/', emoji: '⚡' },
      ]
    },
    {
      id: 'engineering', label: 'Engineering', labelFr: 'Ingénierie', labelSw: 'Uhandisi', icon: '🔧',
      desc: 'BOQ, concrete, electrical, rebar, roofing, construction budgets', descFr: 'Métré, béton, électrique, ferraillage', descSw: 'BOQ, zege, umeme, nondo, paa',
      href: '/engineering/', hrefSw: '/sw/ujenzi-na-uhandisi/', color: '#f5f5f4', accent: '#78716c',
      tools: [
        { label: 'BOQ Builder', href: '/tools/boq-builder/', emoji: '📋', badge: 'LIVE' },
        { label: 'Concrete Mix', href: '/tools/concrete-mix/', emoji: '🏗️', badge: 'LIVE' },
        { label: 'Electrical Load', href: '/tools/electrical-load/', emoji: '⚡', badge: 'LIVE' },
        { label: 'Rebar Calculator', href: '/tools/rebar-calculator/', emoji: '🔩', badge: 'NEW' },
        { label: 'Roof Material Calculator', href: '/tools/roof-calculator/', emoji: '🏗️', badge: 'LIVE' },
        { label: 'Tiles Calculator', href: '/tools/tiles-calc/', emoji: '🔲', badge: 'LIVE' },
        { label: 'Paint Coverage Calculator', href: '/tools/paint-calculator/', emoji: '🎨', badge: 'LIVE' },
        { label: 'Water Tank Size Calculator', href: '/tools/water-tank/', emoji: '💧', badge: 'LIVE' },
        { label: 'Borehole Cost Estimator', href: '/tools/borehole-cost/', emoji: '🌊', badge: 'LIVE' },
        { label: 'Home Renovation Budget', href: '/tools/home-renovation-cost/', emoji: '🏠', badge: 'LIVE' },
        { label: 'Structural Load Calculator', href: '/tools/structural-calc/', emoji: '📐', badge: 'LIVE' },
        { label: 'Septic Tank Size Calculator', href: '/tools/septic-tank/', emoji: '🚿', badge: 'NEW' },
        { label: 'Fence Cost Calculator', href: '/tools/fence-cost/', emoji: '🧱', badge: 'NEW' },
        { label: 'Swimming Pool Cost Estimator', href: '/tools/swimming-pool-cost/', emoji: '🏊', badge: 'NEW' },
        { label: 'Architectural Drawing Fee Calc', href: '/tools/architectural-fee/', emoji: '📏', badge: 'NEW' },
        { label: 'All Engineering Tools →', href: '/engineering/', emoji: '🔧' },
      ],
      toolsSw: [
        { label: 'Ujenzi na Uhandisi', href: '/sw/ujenzi-na-uhandisi/', emoji: 'ENG', badge: 'LIVE' },
        { label: 'Kikokotoo gharama za ujenzi', href: '/sw/zana/kikokotoo-gharama-za-ujenzi/', emoji: 'ENG', badge: 'LIVE' },
        { label: 'Mjenzi BOQ', href: '/sw/zana/mjenzi-boq/', emoji: 'BOQ', badge: 'LIVE' },
        { label: 'Kikokotoo nondo', href: '/sw/zana/kikokotoo-nondo/', emoji: 'REBAR', badge: 'LIVE' },
        { label: 'Mchanganyiko wa zege', href: '/sw/zana/mchanganyiko-wa-zege/', emoji: 'CONC', badge: 'LIVE' },
        { label: 'Vifaa vya paa', href: '/sw/zana/vifaa-vya-paa/', emoji: 'ROOF', badge: 'LIVE' },
        { label: 'Ukubwa wa tangi la maji', href: '/sw/zana/ukubwa-wa-tangi-la-maji/', emoji: 'H2O', badge: 'LIVE' }
      ]
    },
    {
      id: 'government', label: 'Government & Civic', labelFr: 'Gouvernement & Civique', labelSw: 'Serikali na Uraia', icon: '🏛️',
      desc: 'Passports, ID, voter registration, pensions, land fees — 20 tools',
      descFr: 'Passeports, identité, vote, retraites, foncier — 20 outils',
      descSw: 'Pasipoti, vitambulisho, upigaji kura, pensheni — zana 20',
      href: '/government/', color: '#eff6ff', accent: '#1d4ed8',
      tools: [
        { label: 'Passport Application Checklist', href: '/tools/passport-checklist/', emoji: '🛂', badge: 'NEW' },
        { label: 'Visa Requirement Checker (Africa)', href: '/tools/visa-checker/', emoji: '✈️', badge: 'NEW' },
        { label: 'National ID Registration Guide', href: '/tools/national-id-guide/', emoji: '🪪', badge: 'NEW' },
        { label: 'Voter Registration Guide', href: '/tools/voter-registration/', emoji: '🗳️', badge: 'NEW' },
        { label: 'National Pension Estimator', href: '/tools/national-pension/', emoji: '📈', badge: 'NEW' },
        { label: 'Land Registry Fee Calculator', href: '/tools/land-registry-fees/', emoji: '🏠', badge: 'NEW' },
        { label: 'Birth/Death Certificate Guide', href: '/tools/birth-death-cert/', emoji: '📜', badge: 'NEW' },
        { label: 'Marriage Certificate Guide', href: '/tools/marriage-cert/', emoji: '💍', badge: 'NEW' },
        { label: 'FOI Request Template', href: '/tools/foi-template/', emoji: '📋', badge: 'NEW' },
        { label: 'Government Scholarship Finder', href: '/tools/gov-scholarship/', emoji: '🎓', badge: 'NEW' },
        { label: 'Social Welfare Eligibility Checker', href: '/tools/social-welfare/', emoji: '🤝', badge: 'NEW' },
        { label: 'Public Holiday Calendar', href: '/tools/public-holidays/', emoji: '📅', badge: 'LIVE' },
        { label: 'Budget Allocation Comparator', href: '/tools/budget-comparator/', emoji: '📊', badge: 'NEW' },
        { label: 'All Government Tools →', href: '/government/', emoji: '🏛️' },
      ],
      toolsSw: [
        { label: 'Serikali na Nyaraka', href: '/sw/serikali-na-nyaraka/', emoji: 'GOV', badge: 'LIVE' },
        { label: 'Usajili wa biashara', href: '/sw/zana/usajili-biashara/', emoji: 'REG', badge: 'LIVE' },
        { label: 'Ada usajili wa ardhi', href: '/sw/zana/ada-usajili-wa-ardhi/', emoji: 'LAND', badge: 'LIVE' },
        { label: 'Vyeti vya kuzaliwa na kifo', href: '/sw/zana/vyeti-vya-kuzaliwa-na-kifo/', emoji: 'CERT', badge: 'LIVE' }
      ]
    },
    {
      id: 'small-business', label: 'Small Business', labelFr: 'Petites Entreprises', labelSw: 'Biashara Ndogo', icon: '🏪',
      desc: 'POS agents, mini-importation, market stalls, e-commerce — 45 tools',
      descFr: 'Agents POS, mini-import, marchés, e-commerce — 45 outils',
      descSw: 'Wakala wa POS, uagizaji, masoko, e-commerce — zana 45',
      href: '/small-business/', color: '#fff7ed', accent: '#ea580c',
      tools: [
        { label: 'Startup Runway Calculator', href: '/tools/startup-runway/', emoji: '🚀', badge: 'NEW' },
        { label: 'Market Size (TAM/SAM/SOM)', href: '/tools/tam-sam-som/', emoji: '📊', badge: 'NEW' },
        { label: 'Unit Economics Calculator', href: '/tools/unit-economics/', emoji: '💡', badge: 'NEW' },
        { label: 'Burn Rate Calculator', href: '/tools/burn-rate/', emoji: '🔥', badge: 'NEW' },
        { label: 'Cash Flow Forecast Tool', href: '/tools/cash-flow-forecast/', emoji: '💰', badge: 'NEW' },
        { label: 'POS Agent Business Calculator', href: '/tools/pos-agent/', emoji: '📱', badge: 'NEW' },
        { label: 'Mini-Importation Profit Calc', href: '/tools/mini-importation/', emoji: '📦', badge: 'NEW' },
        { label: 'Mama Put / Food Vendor Calc', href: '/tools/mama-put/', emoji: '🍲', badge: 'NEW' },
        { label: 'Marketplace Fee Comparator', href: '/tools/marketplace-fees/', emoji: '🛍️', badge: 'NEW' },
        { label: 'Market Stall Profit Calculator', href: '/tools/market-stall-profit/', emoji: '🏪', badge: 'LIVE' },
        { label: 'AI Business Planner', href: '/tools/business-planner/', emoji: '📋', badge: 'LIVE' },
        { label: 'Break-Even Calculator', href: '/tools/break-even/', emoji: '📉', badge: 'LIVE' },
        { label: 'Churn Rate Calculator', href: '/tools/churn-rate/', emoji: '🔄', badge: 'NEW' },
        { label: 'All SME Tools →', href: '/small-business/', emoji: '🏪' },
      ],
      toolsSw: [
        { label: 'Biashara Ndogo', href: '/sw/biashara-ndogo/', emoji: 'SME', badge: 'LIVE' },
        { label: 'Biashara na Faida', href: '/sw/biashara-na-faida/', emoji: 'ROI', badge: 'LIVE' },
        { label: 'Startup runway', href: '/sw/zana/startup-runway/', emoji: 'RUN', badge: 'LIVE' },
        { label: 'Mpango bajeti', href: '/sw/zana/mpango-bajeti/', emoji: 'BUD', badge: 'LIVE' },
        { label: 'Orodha ya side hustle', href: '/sw/zana/orodha-ya-side-hustle/', emoji: 'SIDE', badge: 'LIVE' }
      ]
    },
    {
      id: 'transport', label: 'Transport & Logistics', labelFr: 'Transport & Logistique', labelSw: 'Usafiri na Usafirishaji', icon: '🚛',
      desc: 'Fuel, vehicle import, ride fares, boda-boda — 54 countries',
      descFr: 'Carburant, importation véhicule, tarifs taxi, logistique — 54 pays',
      descSw: 'Mafuta, gari, nauli, boda-boda — nchi 54',
      href: '/transport/', color: '#fef3c7', accent: '#d97706',
      tools: [
        { label: 'Fuel Cost per Trip Calculator', href: '/tools/fuel-cost/', emoji: '⛽', badge: 'LIVE' },
        { label: 'Import Duty & Landed Cost Calculator', href: '/tools/import-duty/', emoji: 'BOX', badge: 'LIVE' },
        { label: 'Ride-Hailing Fare Estimator', href: '/tools/ride-fare/', emoji: '🛺', badge: 'LIVE' },
        { label: 'Boda-Boda/Okada Income Calc', href: '/tools/boda-income/', emoji: '🏍️', badge: 'LIVE' },
        { label: 'Matatu/Danfo Route Fare Calc', href: '/tools/matatu-fare/', emoji: '🚌', badge: 'LIVE' },
        { label: 'Delivery Cost Estimator', href: '/tools/delivery-cost/', emoji: '📦', badge: 'LIVE' },
        { label: 'Car Loan vs Cash Purchase', href: '/tools/car-loan-vs-cash/', emoji: '💰', badge: 'LIVE' },
        { label: 'Vehicle Import Checklist', href: '/tools/vehicle-registration/', emoji: '🪪', badge: 'LIVE' },
        { label: 'Road Worthiness Checklist', href: '/tools/roadworthiness/', emoji: '✅', badge: 'LIVE' },
        { label: 'Vehicle Depreciation Calc', href: '/tools/vehicle-depreciation/', emoji: '📉', badge: 'NEW' },
        { label: 'All Transport Tools →', href: '/transport/', emoji: '🚛' },
      ]
    },
    {
      id: 'personal-finance', label: 'Personal Finance', labelFr: 'Finance Personnelle', labelSw: 'Fedha Binafsi', icon: '💼',
      desc: 'Budgeting, life events, tax extensions — 25 tools for African realities',
      descFr: 'Budget, événements de vie, impôts — 25 outils pour réalités africaines',
      descSw: 'Bajeti, matukio ya maisha, kodi — zana 25 kwa hali ya Afrika',
      href: '/personal-finance/', color: '#f0fdf4', accent: '#16a34a',
      tools: [
        { label: '50/30/20 Budget Calculator', href: '/tools/50-30-20-budget/', emoji: '💰', badge: 'NEW' },
        { label: 'Zero-Based Budget Planner', href: '/tools/zero-based-budget/', emoji: '📋', badge: 'NEW' },
        { label: 'Annual Financial Review', href: '/tools/annual-financial-review/', emoji: '📅', badge: 'NEW' },
        { label: 'Multi-Income Tracker', href: '/tools/multi-income-tracker/', emoji: '💵', badge: 'NEW' },
        { label: 'Baby Cost Estimator', href: '/tools/baby-cost/', emoji: '👶', badge: 'NEW' },
        { label: 'Back-to-School Budget', href: '/tools/back-to-school/', emoji: '🎒', badge: 'NEW' },
        { label: 'WHT Calculator', href: '/tools/wht-calculator/', emoji: '🧾', badge: 'NEW' },
        { label: 'Side Hustle to Full-Time Calc', href: '/tools/side-hustle-to-fulltime/', emoji: '🚀', badge: 'NEW' },
        { label: 'Funeral Savings Planner', href: '/tools/funeral-savings/', emoji: '🕊️', badge: 'NEW' },
        { label: 'Wedding Budget (African)', href: '/tools/wedding-budget-african/', emoji: '💍', badge: 'NEW' },
        { label: 'All Personal Finance Tools →', href: '/personal-finance/', emoji: '💼' },
      ]
    },
    {
      id: 'diaspora', label: 'Diaspora', labelFr: 'Diaspora', labelSw: 'Diaspora', icon: '✈️',
      desc: 'Visa tracking, immigration, remittances — 17 tools for Africans abroad',
      descFr: 'Visa, immigration, transferts — 17 outils pour Africains à l\'étranger',
      descSw: 'Visa, uhamiaji, uhamisho — zana 17 kwa Waafrika nje',
      href: '/diaspora/', color: '#eff6ff', accent: '#2563eb',
      tools: [
        { label: 'Japa Calculator', href: '/tools/japa-calculator/', emoji: '🌍', badge: 'NEW' },
        { label: 'Visa Tracker', href: '/tools/visa-tracker/', emoji: '📝', badge: 'NEW' },
        { label: 'Immigration Points Calculator', href: '/tools/immigration-points/', emoji: '📊', badge: 'NEW' },
        { label: 'Cultural Adjustment Guide', href: '/tools/cultural-adjustment/', emoji: '🤝', badge: 'NEW' },
        { label: 'IELTS/TOEFL Score Converter', href: '/tools/ielts-toefl-converter/', emoji: '📚', badge: 'NEW' },
        { label: 'Embassy Wait Time Tracker', href: '/tools/embassy-wait-time/', emoji: '⏱️', badge: 'NEW' },
        { label: 'Money Transfer Tracker', href: '/tools/money-transfer-tracker/', emoji: '💸', badge: 'NEW' },
        { label: 'Cost of Living Comparator', href: '/tools/cost-of-living-compare/', emoji: '🏙️', badge: 'NEW' },
        { label: 'Double Taxation Checker', href: '/tools/double-taxation/', emoji: '🧾', badge: 'NEW' },
        { label: 'Diaspora Investment Calculator', href: '/tools/diaspora-investment/', emoji: '📈', badge: 'NEW' },
        { label: 'All Diaspora Tools →', href: '/diaspora/', emoji: '✈️' },
      ]
    },
    {
      id: 'religious-cultural', label: 'Religious & Cultural', labelFr: 'Religieux & Culturel', labelSw: 'Dini na Utamaduni', icon: '🕌',
      desc: 'Zakat, prayer times, Ramadan, halal, proverbs — Islamic, Christian & Traditional',
      descFr: 'Zakat, heures de prière, Ramadan, halal, proverbes — Islam, Christianisme & Tradition',
      descSw: 'Zaka, nyakati za sala, Ramadhan, halali, methali — Kiislamu, Kikristo & Jadi',
      href: '/religious-cultural/', color: '#fffbeb', accent: '#d97706',
      tools: [
        { label: 'Zakat Calculator', href: '/tools/zakat-calculator/', emoji: '🌙', badge: 'NEW' },
        { label: 'Prayer Times Calculator', href: '/tools/prayer-times/', emoji: '🕌', badge: 'NEW' },
        { label: 'Ramadan Timetable', href: '/tools/ramadan-timetable/', emoji: '📅', badge: 'NEW' },
        { label: 'Halal Compliance Checker', href: '/tools/halal-compliance/', emoji: '✅', badge: 'NEW' },
        { label: 'Hajj Budget Planner', href: '/tools/hajj-budget/', emoji: '🕋', badge: 'NEW' },
        { label: 'Islamic Calendar', href: '/tools/islamic-calendar/', emoji: '🗓️', badge: 'NEW' },
        { label: 'Tithe Calculator', href: '/tools/tithe-calculator/', emoji: '⛪', badge: 'NEW' },
        { label: 'Wedding Budget Planner', href: '/tools/wedding-budget/', emoji: '💒', badge: 'NEW' },
        { label: 'African Proverbs Library', href: '/tools/african-proverbs/', emoji: '📖', badge: 'NEW' },
        { label: 'Naming Ceremony Cost Calc', href: '/tools/naming-ceremony/', emoji: '🎉', badge: 'NEW' },
        { label: 'All Religious & Cultural Tools →', href: '/religious-cultural/', emoji: '🕌' },
      ],
      toolsSw: [
        { label: 'Dini na Utamaduni', href: '/sw/dini-na-utamaduni/', emoji: 'CULT', badge: 'LIVE' },
        { label: 'Kikokotoo cha zakat', href: '/sw/zana/kikokotoo-zakat/', emoji: 'ZK', badge: 'LIVE' },
        { label: 'Bajeti ya Hajj na Umrah', href: '/sw/zana/bajeti-ya-hajj-na-umrah/', emoji: 'HU', badge: 'LIVE' },
        { label: 'Bajeti ya harusi', href: '/sw/zana/bajeti-ya-harusi/', emoji: 'WED', badge: 'LIVE' },
        { label: 'Nyakati za swala na Qibla', href: '/sw/zana/nyakati-za-swala-na-qibla/', emoji: 'QIB', badge: 'LIVE' },
        { label: 'Ratiba ya Ramadhani', href: '/sw/zana/ratiba-ya-ramadhani/', emoji: 'RAM', badge: 'LIVE' }
      ]
    },
    {
      id: 'climate', label: 'Climate & Environment', labelFr: 'Climat & Environnement', labelSw: 'Hali ya Hewa na Mazingira', icon: '🌿',
      desc: 'Carbon credits, drought risk, flood risk, air quality, e-waste — 54 countries',
      descFr: 'Crédits carbone, risque sécheresse, qualité air, déchets — 54 pays',
      descSw: 'Mikopo ya kaboni, ukame, mafuriko, hali ya hewa — nchi 54',
      href: '/climate/', color: '#f0fdf4', accent: '#059669',
      tools: [
        { label: 'Carbon Credit Calculator', href: '/tools/carbon-credit/', emoji: '🌱', badge: 'NEW' },
        { label: 'Drought Risk Assessor', href: '/tools/drought-risk/', emoji: '☀️', badge: 'NEW' },
        { label: 'Flood Risk Calculator', href: '/tools/flood-risk/', emoji: '🌊', badge: 'NEW' },
        { label: 'Air Quality Index Tool', href: '/tools/air-quality/', emoji: '🌬️', badge: 'NEW' },
        { label: 'Tree Planting ROI', href: '/tools/tree-planting-roi/', emoji: '🌳', badge: 'NEW' },
        { label: 'E-Waste Value Calculator', href: '/tools/ewaste-value/', emoji: '♻️', badge: 'NEW' },
        { label: 'Water Scarcity Estimator', href: '/tools/water-scarcity/', emoji: '💧', badge: 'NEW' },
        { label: 'Recycling Revenue Calculator', href: '/tools/recycling-revenue/', emoji: '🗃️', badge: 'NEW' },
        { label: 'Sustainability Scorecard', href: '/tools/sustainability-scorecard/', emoji: '📊', badge: 'NEW' },
        { label: 'Charcoal vs Clean Energy', href: '/tools/charcoal-vs-clean/', emoji: '⚡', badge: 'NEW' },
        { label: 'All Climate Tools →', href: '/climate/', emoji: '🌿' },
      ]
    },
    {
      id: 'sports', label: 'Sports & Entertainment', labelFr: 'Sports & Divertissement', labelSw: 'Michezo na Burudani', icon: '⚽',
      desc: 'Betting odds, AFCON predictor, music royalties, Nollywood — 54 countries',
      descFr: 'Cotes paris, prédicteur AFCON, redevances musicales, Nollywood — 54 pays',
      descSw: 'Uwezekano wa kubeti, AFCON, mrabaha wa muziki — nchi 54',
      href: '/sports/', color: '#fdf4ff', accent: '#9333ea',
      tools: [
        { label: 'Betting Odds Calculator', href: '/tools/betting-odds/', emoji: '🎲', badge: 'NEW' },
        { label: 'AFCON Match Predictor', href: '/tools/afcon-predictor/', emoji: '🏆', badge: 'NEW' },
        { label: 'Fantasy Football Value Calc', href: '/tools/fantasy-football/', emoji: '⚽', badge: 'NEW' },
        { label: 'Betting Tax Calculator', href: '/tools/betting-tax/', emoji: '🧾', badge: 'NEW' },
        { label: 'Streaming Royalties Estimator', href: '/tools/streaming-royalties/', emoji: '🎵', badge: 'NEW' },
        { label: 'DJ Booking Rate Calculator', href: '/tools/dj-booking-rate/', emoji: '🎧', badge: 'NEW' },
        { label: 'Concert Budget Planner', href: '/tools/concert-budget/', emoji: '🎤', badge: 'NEW' },
        { label: 'Event Ticket Revenue Calc', href: '/tools/event-ticket-revenue/', emoji: '🎟️', badge: 'NEW' },
        { label: 'Nollywood Box Office Tracker', href: '/tools/nollywood-box-office/', emoji: '🎬', badge: 'NEW' },
        { label: 'Sports Scholarship Estimator', href: '/tools/sports-scholarship/', emoji: '🎓', badge: 'NEW' },
        { label: 'All Sports & Entertainment Tools →', href: '/sports/', emoji: '⚽' },
      ]
    },
    {
      id: 'mining', label: 'Mining & Extractives', labelFr: 'Mines & Extractives', labelSw: 'Madini na Uchimbaji', icon: '⛏️',
      desc: 'Gold, diamonds, oil, mining royalties — Africa holds 30% of world minerals',
      descFr: 'Or, diamants, pétrole, redevances minières — l\'Afrique détient 30% des minéraux',
      descSw: 'Dhahabu, almasi, mafuta, mrabaha wa madini — Afrika ina 30% ya madini',
      href: '/mining/', color: '#fef9c3', accent: '#ca8a04',
      tools: [
        { label: 'Gold Price Tracker', href: '/tools/gold-price-tracker/', emoji: '🥇', badge: 'NEW' },
        { label: 'Diamond Valuation Calculator', href: '/tools/diamond-valuation/', emoji: '💎', badge: 'NEW' },
        { label: 'Mining Royalty Calculator', href: '/tools/mining-royalty/', emoji: '📊', badge: 'NEW' },
        { label: 'Oil Production Estimator', href: '/tools/oil-production/', emoji: '🛢️', badge: 'NEW' },
        { label: 'Oil & Gas Revenue Calc', href: '/tools/oil-gas-revenue/', emoji: '⚡', badge: 'NEW' },
        { label: 'Artisanal Mining Income Calc', href: '/tools/artisanal-mining/', emoji: '⛏️', badge: 'NEW' },
        { label: 'Mining License Fee Estimator', href: '/tools/mining-license-fee/', emoji: '📋', badge: 'NEW' },
        { label: 'Mineral Export Duty Calc', href: '/tools/mineral-export-duty/', emoji: '🚢', badge: 'NEW' },
        { label: 'Mining Env. Impact Assessor', href: '/tools/mining-env-impact/', emoji: '🌿', badge: 'NEW' },
        { label: 'Petroleum Pricing Calculator', href: '/tools/petroleum-pricing/', emoji: '⛽', badge: 'NEW' },
        { label: 'All Mining Tools →', href: '/mining/', emoji: '⛏️' },
      ]
    },
    {
      id: 'creative', label: 'Creative Economy', labelFr: 'Économie Créative', labelSw: 'Uchumi wa Ubunifu', icon: '🎨',
      desc: 'Music royalties, Nollywood, African fashion, content creator tools',
      descFr: 'Droits musicaux, Nollywood, mode africaine, créateurs de contenu',
      descSw: 'Mrabaha wa muziki, Nollywood, mitindo ya Afrika, waundaji wa maudhui',
      href: '/creative/', color: '#FDF4FF', accent: '#DB2777',
      tools: [
        { label: 'ThumbnailForge — Thumbnail Maker', href: '/tools/creator-thumb/', emoji: '📸', badge: 'NEW' },
        { label: 'CarouselStudio — Carousel Maker', href: '/tools/creator-carousel/', emoji: '🎞️', badge: 'NEW' },
        { label: 'CreatorCalendar — Content Planner', href: '/tools/creator-calendar/', emoji: '📅', badge: 'NEW' },
        { label: 'CreatorPage — Link Page & Store', href: '/tools/creator-page/', emoji: '🔗', badge: 'NEW' },
        { label: 'CreatorPricing — Know Your Worth', href: '/tools/creator-pricing/', emoji: '💰', badge: 'LIVE' },
        { label: 'CreatorMoney — Finance Tracker', href: '/tools/creator-money/', emoji: '📊', badge: 'LIVE' },
        { label: 'CreatorSplit — Collab Splitter', href: '/tools/creator-split/', emoji: '🤝', badge: 'LIVE' },
        { label: 'CreatorInvoice — Invoice Builder', href: '/tools/creator-invoice/', emoji: '🧾', badge: 'LIVE' },
        { label: 'CreatorCanvas — Design Studio', href: '/tools/creator-canvas/', emoji: '🎨', badge: 'LIVE' },
        { label: 'CreatorKit — Media Kit Builder', href: '/tools/creator-kit/', emoji: '✨', badge: 'LIVE' },
        { label: 'CreatorDesk — Client & Project CRM', href: '/tools/creator-desk/', emoji: '📋', badge: 'LIVE' },
        { label: 'CreatorMind — AI Script & Brief Writer', href: '/tools/creator-mind/', emoji: '🔮', badge: 'LIVE' },
        { label: 'TitleSmith — Title & Headline Generator', href: '/tools/creator-titles/', emoji: '⚡', badge: 'NEW' },
        { label: 'BioForge — Platform Bio Generator', href: '/tools/creator-bios/', emoji: '🌿', badge: 'NEW' },
        { label: 'HookFactory — Video Hook Generator', href: '/tools/creator-hooks/', emoji: '🎣', badge: 'NEW' },
        { label: 'TagWave — Hashtag Generator', href: '/tools/creator-hashtags/', emoji: '#️⃣', badge: 'NEW' },
        { label: 'CaptionCraft — AI Caption Writer', href: '/tools/creator-captions/', emoji: '✍️', badge: 'NEW' },
        { label: 'ScriptPad — Video Script Generator', href: '/tools/creator-scripts/', emoji: '📝', badge: 'NEW' },
        { label: 'Repurpose — Content Repurposer', href: '/tools/creator-repurpose/', emoji: '♻️', badge: 'NEW' },
        { label: 'ResizeKit — Social Image Resizer', href: '/tools/creator-resize/', emoji: '✂️', badge: 'NEW' },
        { label: 'Music Royalty Splitter', href: '/tools/music-royalty-splitter/', emoji: '🎵', badge: 'NEW' },
        { label: 'Album/EP Release Budget', href: '/tools/album-budget/', emoji: '💿', badge: 'NEW' },
        { label: 'Fashion Brand Startup Cost', href: '/tools/fashion-brand-startup/', emoji: '👗', badge: 'NEW' },
        { label: 'YouTube Revenue Estimator', href: '/tools/youtube-revenue/', emoji: '▶️', badge: 'NEW' },
        { label: 'Influencer Rate Card Generator', href: '/tools/influencer-rate/', emoji: '📱', badge: 'NEW' },
        { label: 'TikTok/IG Engagement Rate Calc', href: '/tools/engagement-rate/', emoji: '📊', badge: 'NEW' },
        { label: 'Graphic Design Pricing', href: '/tools/graphic-design-pricing/', emoji: '🖼️', badge: 'NEW' },
        { label: 'Event Decoration Cost Calc', href: '/tools/event-decoration-cost/', emoji: '🎪', badge: 'NEW' },
        { label: 'Art Commission Price Calc', href: '/tools/art-commission/', emoji: '🎨', badge: 'NEW' },
        { label: 'CreatorStock — Stock Media Browser', href: '/tools/creator-stock/', emoji: '🖼️', badge: 'NEW' },
        { label: 'CreatorAnalytics — Performance Tracker', href: '/tools/creator-analytics/', emoji: '📈', badge: 'NEW' },
        { label: 'CreatorRecord — Screen Recorder', href: '/tools/creator-record/', emoji: '🎬', badge: 'NEW' },
        { label: 'CreatorPolish — AI Writing Tool', href: '/tools/creator-polish/', emoji: '✏️', badge: 'NEW' },
        { label: 'CreatorClip — Video Clipper', href: '/tools/creator-clip/', emoji: '🎞️', badge: 'NEW' },
        { label: 'CreatorVoice — Audio Recorder', href: '/tools/creator-voice/', emoji: '🎙️', badge: 'NEW' },
        { label: 'CreatorMail — Newsletter Builder', href: '/tools/creator-mail/', emoji: '📧', badge: 'NEW' },
        { label: 'CreatorClub — Membership Platform', href: '/tools/creator-club/', emoji: '🏆', badge: 'NEW' },
        { label: 'CreatorCourse — Course Builder', href: '/tools/creator-course/', emoji: '🎓', badge: 'NEW' },
        { label: 'CreatorResearch — AI Research', href: '/tools/creator-research/', emoji: '🔍', badge: 'NEW' },
        { label: 'CreatorTeam — Collaboration', href: '/tools/creator-team/', emoji: '👥', badge: 'NEW' },
        { label: 'CreatorBrand — Brand Kit Manager', href: '/tools/creator-brand/', emoji: '💎', badge: 'NEW' },
        { label: 'CreatorSchedule — Social Scheduler', href: '/tools/creator-schedule/', emoji: '📅', badge: 'NEW' },
        { label: 'All Creative Economy Tools →', href: '/creative/', emoji: '🎨' },
      ]
    },
    {
      id: 'afrostream', label: 'AfroStream', labelFr: 'AfroStream', labelSw: 'AfroStream', icon: '🎬',
      desc: 'African creator streaming hub — live streams, rankings, net worth, news',
      descFr: 'Hub de streaming pour créateurs africains — lives, classements, actualités',
      descSw: 'Kituo cha utiririshaji wa waundaji wa Afrika — moja kwa moja, viwango',
      href: '/tools/afrostream/', color: '#FAF5FF', accent: '#A855F7',
      tools: [
        { label: 'AfroStream — Live Now', href: '/tools/afrostream/', emoji: '🔴', badge: 'NEW' },
        { label: 'Creator Rankings', href: '/tools/afrostream/rankings.html', emoji: '🏆', badge: 'NEW' },
        { label: 'Creator News', href: '/tools/afrostream/news.html', emoji: '📰', badge: 'NEW' },
        { label: 'Stream Calendar', href: '/tools/afrostream/calendar.html', emoji: '📅', badge: 'NEW' },
        { label: 'Community Hub', href: '/tools/afrostream/community.html', emoji: '🤝', badge: 'NEW' },
      ]
    },
    {
      id: 'security', label: 'Security & Safety', labelFr: 'Sécurité & Sûreté', labelSw: 'Usalama na Ulinzi', icon: '🔒',
      desc: 'Home security, cybersecurity, business continuity, risk',
      descFr: 'Sécurité domicile, cybersécurité, continuité d\'activité',
      descSw: 'Usalama wa nyumba, mtandao, uendelevu wa biashara',
      href: '/security/', color: '#F8FAFC', accent: '#475569',
      tools: [
        { label: 'Home Security Cost Estimator', href: '/tools/home-security-cost/', emoji: '🏠', badge: 'NEW' },
        { label: 'CCTV System Cost Calculator', href: '/tools/cctv-cost/', emoji: '📷', badge: 'NEW' },
        { label: 'Cybersecurity Risk Assessment', href: '/tools/cybersecurity-assessment/', emoji: '💻', badge: 'NEW' },
        { label: 'Password Strength Checker', href: '/tools/password-strength/', emoji: '🔐', badge: 'NEW' },
        { label: 'Phishing Detection Quiz', href: '/tools/phishing-quiz/', emoji: '🎣', badge: 'NEW' },
        { label: 'Data Breach Cost Estimator', href: '/tools/data-breach-cost/', emoji: '⚠️', badge: 'NEW' },
        { label: 'Vehicle Tracker ROI Calculator', href: '/tools/vehicle-tracker-roi/', emoji: '🚗', badge: 'NEW' },
        { label: 'Fire Safety Compliance Checklist', href: '/tools/fire-safety-checklist/', emoji: '🔥', badge: 'NEW' },
        { label: 'All Security Tools →', href: '/security/', emoji: '🔒' },
      ]
    },
    {
      id: 'travel', label: 'Travel & Tourism', labelFr: 'Voyage & Tourisme', labelSw: 'Usafiri na Utalii', icon: '🌍',
      desc: 'Safari cost, beach holidays, airport transfers, packing lists',
      descFr: 'Coût safari, vacances plage, transferts aéroport, listes d\'emballage',
      descSw: 'Gharama ya safari, likizo pwani, usafiri wa uwanja',
      href: '/travel/', color: '#F0F9FF', accent: '#0EA5E9',
      tools: [
        { label: 'African Safari Cost Calculator', href: '/tools/safari-cost/', emoji: '🦁', badge: 'NEW' },
        { label: 'Beach Holiday Budget (Africa)', href: '/tools/beach-holiday-budget/', emoji: '🏖️', badge: 'NEW' },
        { label: 'Travel Vaccination Schedule', href: '/tools/travel-vaccination-cost/', emoji: '💉', badge: 'NEW' },
        { label: 'Airport Transfer Comparator', href: '/tools/airport-transfer/', emoji: '🚗', badge: 'NEW' },
        { label: 'Airbnb vs Hotel (Africa)', href: '/tools/airbnb-vs-hotel/', emoji: '🏨', badge: 'NEW' },
        { label: 'Festival Travel Budget', href: '/tools/festival-travel-budget/', emoji: '🎪', badge: 'NEW' },
        { label: 'Travel Packing List Generator', href: '/tools/travel-packing-list/', emoji: '🧳', badge: 'NEW' },
        { label: 'All Travel Tools →', href: '/travel/', emoji: '🌍' },
      ]
    },
    {
      id: 'career', label: 'Career & Development', labelFr: 'Carrière & Développement', labelSw: 'Kazi na Maendeleo', icon: '📈',
      desc: 'Salary negotiation, freelance, personal brand, retirement',
      descFr: 'Négociation salaire, freelance, marque personnelle, retraite',
      descSw: 'Mazungumzo ya mshahara, uhuru, chapa ya kibinafsi, kustaafu',
      href: '/career/', color: '#EEF2FF', accent: '#6366F1',
      tools: [
        { label: 'Salary Negotiation Calculator', href: '/tools/salary-negotiation/', emoji: '💼', badge: 'NEW' },
        { label: 'Career Switch Financial Impact', href: '/tools/career-switch/', emoji: '🔄', badge: 'NEW' },
        { label: 'Side Hustle Profitability Ranker', href: '/tools/side-hustle-ranker/', emoji: '💡', badge: 'NEW' },
        { label: 'Personal Brand Audit Tool', href: '/tools/personal-brand-audit/', emoji: '⭐', badge: 'NEW' },
        { label: 'LinkedIn Profile Optimizer', href: '/tools/linkedin-optimizer/', emoji: '🔗', badge: 'NEW' },
        { label: 'Interview Preparation Checklist', href: '/tools/interview-prep/', emoji: '✅', badge: 'NEW' },
        { label: 'Retirement Readiness Score', href: '/tools/retirement-readiness/', emoji: '🏖️', badge: 'NEW' },
        { label: 'Career Growth Trajectory Calc', href: '/tools/career-growth/', emoji: '📈', badge: 'NEW' },
        { label: 'All Career Tools →', href: '/career/', emoji: '📈' },
      ],
      toolsSw: [
        { label: 'Kazi na Ajira', href: '/sw/kazi-na-ajira/', emoji: 'JOB', badge: 'LIVE' },
        { label: 'Kazi na Nyaraka', href: '/sw/kazi-na-nyaraka/', emoji: 'DOC', badge: 'LIVE' },
        { label: 'Maandalizi ya mahojiano', href: '/sw/zana/maandalizi-ya-mahojiano/', emoji: 'INT', badge: 'LIVE' },
        { label: 'Majadiliano ya mshahara', href: '/sw/zana/majadiliano-ya-mshahara/', emoji: 'SAL', badge: 'LIVE' },
        { label: 'Tathmini ya ofa ya kazi', href: '/sw/zana/tathmini-ya-ofa-ya-kazi/', emoji: 'OFA', badge: 'LIVE' }
      ]
    },
    {
      id: 'afrowork', label: 'AfroWork Suite', labelFr: 'Suite AfroWork', labelSw: 'Mfumo wa AfroWork', icon: '⚙️',
      desc: 'Payroll OS, compliance calendar, salary database, AI labour law advisor, document generator',
      descFr: 'OS de paie, calendrier conformité, base salaires, conseiller juridique IA, générateur docs',
      descSw: 'Mfumo wa mishahara, kalenda ya uzingatifu, hifadhidata ya mishahara, mshauri wa kisheria AI',
      href: '/afrowork/', color: '#FFFBEB', accent: '#D97706',
      tools: [
        { label: 'AfroPayroll OS — Hire-to-Retire Workflow', href: '/tools/afropayroll-os/', emoji: '🔄', badge: 'LIVE' },
        { label: 'Compliance Calendar — Statutory Deadlines', href: '/tools/compliance-calendar/', emoji: '📅', badge: 'SOON' },
        { label: 'Regulatory Change Alerts', href: '/tools/regulatory-alerts/', emoji: '🔔', badge: 'NEW' },
        { label: 'AI Labour Law Advisor', href: '/tools/labour-law-advisor/', emoji: '⚖️', badge: 'SOON' },
        { label: 'AfroSalary Database', href: '/tools/afrosalary-db/', emoji: '📊', badge: 'SOON' },
        { label: 'Document Generator Suite', href: '/tools/doc-generator/', emoji: '📄', badge: 'LIVE' },
        { label: 'Payroll API — B2B', href: '/afrowork/api/', emoji: '🔌', badge: 'SOON' },
        { label: 'WhatsApp Payroll Bot', href: '/afrowork/whatsapp/', emoji: '💬', badge: 'SOON' },
        { label: 'All AfroWork Features →', href: '/afrowork/', emoji: '⚙️' },
      ],
      toolsSw: [
        { label: 'Mfumo wa AfroWork', href: '/afrowork/', emoji: 'WORK', badge: 'EN' },
        { label: 'Payroll OS', href: '/tools/afropayroll-os/', emoji: 'PAY', badge: 'EN' }
      ]
    },
  ];

  const SW_CATEGORY_HREFS = {
    financial: '/sw/mshahara-na-kodi/',
    'hr-payroll': '/sw/kazi-na-ajira/',
    'document-pdf': '/sw/hati-na-pdf/',
    'image-design': '/sw/picha-na-design/',
    developer: '/sw/zana-za-developer/',
    education: '/sw/elimu/',
    health: '/sw/afya/',
    insurance: '/sw/bima/',
    fintech: '/sw/fintech/',
    agriculture: '/sw/kilimo/',
    ecommerce: '/sw/vat-na-kodi/',
    legal: '/sw/biashara-na-uzingatiaji/',
    'data-productivity': '/sw/data-na-tija/',
    telecom: '/sw/mawasiliano-na-mtandao/',
    african: '/sw/nchi/',
    trade: '/sw/biashara-ya-nje/',
    government: '/sw/serikali-na-nyaraka/',
    'small-business': '/sw/biashara-ndogo/',
    transport: '/sw/usafiri-na-magari/',
    'personal-finance': '/sw/mali-na-mikopo/',
    diaspora: '/sw/serikali-na-nyaraka/',
    'religious-cultural': '/sw/dini-na-utamaduni/',
    climate: '/sw/hali-ya-hewa-na-mazingira/',
    energy: '/sw/nishati-na-huduma/',
    engineering: '/sw/ujenzi-na-uhandisi/',
        creative: '/sw/ubunifu-na-watayarishi/',
    career: '/sw/kazi-na-ajira/',
    afrowork: '/sw/kazi-na-ajira/'
  };

  const HA_CATEGORY_HREFS = {
    financial: '/ha/albashi-da-haraji/',
    'document-pdf': '/ha/takardu-da-pdf/',
    education: '/ha/ilimi/',
    health: '/ha/lafiya/',
    agriculture: '/ha/noma/',
    ecommerce: '/ha/kasuwanci-da-haraji/',
    language: '/ha/harshe-da-fassara/',
    telecom: '/ha/sadarwa/',
    african: '/countries/'
  };

  const YO_CATEGORY_HREFS = {
    financial: '/yo/owo-osu-ati-owo-ori/',
    'document-pdf': '/yo/iwe-ati-pdf/',
    education: '/yo/eko/',
    health: '/yo/ilera/',
    agriculture: '/yo/ogbin/',
    ecommerce: '/yo/owo-ori-owo-ise/',
    language: '/yo/ede-ati-itumo/',
    telecom: '/yo/ibaraenisoro/',
    african: '/yo/naijiria/'
  };

  // 16 categories for the Tools dropdown. Keep top-level navbar categories out of this grid.
  const TOOL_MENU_IDS = [
    'image-design', 'developer', 'education', 'health',
    'insurance', 'fintech', 'agriculture', 'legal',
    'language', 'trade', 'telecom', 'energy',
    'engineering', 'government', 'transport', 'personal-finance'
  ];

  const TOOL_MENU_COPY = {
    sw: {
      'image-design': { label: 'Picha na Design', desc: 'Bana picha, resize, QR na OCR' },
      developer: { label: 'Zana za Wasanidi', desc: 'JSON, API, Regex, SQL na USSD' },
      education: { label: 'Elimu na Mitihani', desc: 'GPA, ada, masomo na udhamini' },
      health: { label: 'Afya na Lishe', desc: 'Gharama za afya, lishe na vipimo' },
      insurance: { label: 'Bima', desc: 'Gari, afya, biashara na safari' },
      fintech: { label: 'Fintech na Benki', desc: 'Mikopo, akiba, mobile money, FX' },
      agriculture: { label: 'Kilimo', desc: 'Mavuno, mbolea, umwagiliaji, faida' },
      legal: { label: 'Biashara na Uzingatiaji', desc: 'TIN, leseni, mikataba na data' },
      language: { label: 'Lugha na Tafsiri', desc: 'Tafsiri, majina na lugha za Afrika' },
      trade: { label: 'Biashara ya Nje', desc: 'Forodha, HS code, AfCFTA na LC' },
      telecom: { label: 'Mawasiliano na Mtandao', desc: 'Data, USSD, roaming na ISP' },
      energy: { label: 'Nishati na Huduma', desc: 'Umeme, solar, generator na maji' },
      engineering: { label: 'Ujenzi na Uhandisi', desc: 'BOQ, zege, umeme na gharama' },
      government: { label: 'Serikali na Nyaraka', desc: 'Pasipoti, ID, KYC na vibali' },
      transport: { label: 'Usafiri na Magari', desc: 'Mafuta, magari, nauli na logistics' },
      'personal-finance': { label: 'Fedha Binafsi', desc: 'Bajeti, mikopo, akiba na kodi' }
    },
    yo: {
      'document-pdf': { label: 'Ìwé àti PDF', desc: 'PDF, invoice, risiti, Naira sí ọ̀rọ̀, hàdà PDF, pín PDF ati dín ìwọ̀n PDF ni Yorùbá' },
      'image-design': { label: 'Àwòrán àti Dísáìn', desc: 'Ojú ìwé Gẹẹsi: fífi àwòrán pọ, QR àti OCR' },
      developer: { label: 'Irinṣẹ́ Olùdàgbàsókè', desc: 'Ojú ìwé Gẹẹsi: JSON, API, Regex, SQL àti USSD' },
      education: { label: 'Ẹ̀kọ́ àti Ìdánwò', desc: 'JAMB, WAEC, NECO àti NYSC ni Yorùbá; GPA ṣi wà ní ojú Gẹẹsi' },
      health: { label: 'Ìlera àti Ìdílé', desc: 'Genotype, sickle cell, BMI ati owó ilé ìwòsàn ni Yorùbá' },
      insurance: { label: 'Ìdánilójú', desc: 'Ojú ìwé Gẹẹsi: ọkọ, ìlera, ìgbésí ayé àti ìrìnàjò' },
      fintech: { label: 'Fintech àti Bánkì', desc: 'Ojú ìwé Gẹẹsi: awin, ìfipamọ́, Naira àti FX' },
      agriculture: { label: 'Ọ̀gbìn', desc: 'Èrè oko, èso irúgbìn, rogo àti ajílẹ̀ ni Yorùbá' },
      legal: { label: 'Òfin àti Ìbámu', desc: 'Ojú ìwé Gẹẹsi: ìforúkọsílẹ̀, TIN, adehun àti aṣírí data' },
      language: { label: 'Èdè àti Ìtumọ̀', desc: 'Yorùbá phrasebook ati ìrànwọ́ ìkọ̀wé; Hausa, Igbo, Swahili ati PDF ṣi wà ní ojú Gẹẹsi' },
      trade: { label: 'Ìṣòwò àti Gbigbewọlé', desc: 'Ojú ìwé Gẹẹsi: kọ́ọ̀sítọ́ọ̀mù, HS code, AfCFTA àti LC' },
      telecom: { label: 'Ìbáraẹnisọrọ', desc: 'USSD, SIM, NIN, BVN, GB àti WhatsApp ni Yorùbá' },
      energy: { label: 'Agbára àti Ìpèsè', desc: 'Ojú ìwé Gẹẹsi: iná, solar, generator àti omi' },
      engineering: { label: 'Ìmọ̀ Ẹ̀rọ', desc: 'Ojú ìwé Gẹẹsi: BOQ, concrete, iná àti ikọ́lé' },
      government: { label: 'Ìjọba àti Ìwé', desc: 'Ojú ìwé Gẹẹsi: passport, ID, KYC, BVN àti NIN' },
      transport: { label: 'Ìrìnàjò àti Ọkọ', desc: 'Ojú ìwé Gẹẹsi: epo, ọkọ, delivery àti logistics' },
      'personal-finance': { label: 'Ìṣúná Ara Ẹni', desc: 'Ojú ìwé Gẹẹsi: budget, awin, ìfipamọ́, PAYE àti VAT' }
    },
    ha: {
      financial: { label: 'Albashi da PAYE', desc: 'PAYE, VAT, FX da harajin Najeriya' },
      'document-pdf': { label: 'Takardu da PDF', desc: 'Takardar kudi, CV, PDF da Naira cikin kalmomi' },
      ecommerce: { label: 'VAT da Haraji', desc: 'VAT, TIN, takardar kudi da harajin kasuwanci a Hausa' },
      'image-design': { label: 'Hoto da Zane', desc: 'Matsa hoto, resize, QR da OCR' },
      developer: { label: 'Kayan Masu gini', desc: 'JSON, API, USSD da kayan gwaji' },
      education: { label: 'Ilimi da Jarrabawa', desc: 'JAMB, WAEC, NECO, GPA da tallafin karatu' },
      health: { label: 'Lafiya da Asibiti', desc: 'Kudin asibiti, magani, genotype da abinci a Hausa' },
      insurance: { label: 'Inshora', desc: 'Mota, lafiya, rayuwa, kasuwanci da tafiya' },
      fintech: { label: 'Fasahar kudi da banki', desc: 'Lamuni, ajiya, kudin wayar hannu da canjin kudi' },
      agriculture: { label: 'Noma', desc: 'Amfanin gona, taki, ban ruwa da ribar gona' },
      legal: { label: "Doka da Bin Ka'ida", desc: 'Rajista, TIN, kwangila da sirrin bayanai' },
      language: { label: 'Harshe da Fassara', desc: 'Hausa, Yoruba, Swahili, Pidgin da Amharic; shafukan Turanci suna a fili' },
      trade: { label: 'Kasuwanci da Shigo da Kaya', desc: 'Kwastam, HS code, AfCFTA da LC' },
      telecom: { label: 'Sadarwa da Wayar Hannu', desc: 'Intanet, USSD, yawo da ISP' },
      energy: { label: 'Wuta da Makamashi', desc: 'Wutar lantarki, solar, generator da ruwa' },
      engineering: { label: 'Gini da Injiniya', desc: 'BOQ, kankare, lantarki da kudin gini' },
      government: { label: "Gwamnati da Takardu", desc: 'Passport, ID, NIN, BVN, KYC da permit' },
      african: { label: 'Kasashe da kayan Afirka', desc: 'Najeriya, kasashe, Naira, japa da kudin wayar hannu' },
      transport: { label: 'Sufuri da Motoci', desc: 'Mai, mota, farashin tafiya da sufuri' },
      'personal-finance': { label: 'Kudin Kai', desc: 'Kasafi, rance, ajiya, PAYE da VAT' }
    }
  };

  const BUSINESS_LINKS = [
    {
      label: 'Widgets',
      href: '/widgets/',
      icon: 'W',
      desc: 'Free embeds, Widget Pro, white-label setup, analytics, and lead capture.'
    },
    {
      label: 'API',
      href: '/api/',
      icon: 'API',
      desc: 'Sandbox keys, API Growth pilots, Pro access, and enterprise data subscriptions.'
    },
    {
      label: 'Sponsored Tools',
      href: '/sponsored-tools/',
      icon: 'SP',
      desc: 'Tool, category, and country sponsorship placements with pilot pricing.'
    },
    {
      label: 'Custom Calculators',
      href: '/custom-calculators/',
      icon: 'CC',
      desc: 'Branded calculators for HR, payroll, fintech, accounting, schools, and media.'
    },
    {
      label: 'Media Kit',
      href: '/media-kit/',
      icon: 'MK',
      desc: 'Audience, inventory, offer ladder, pricing ranges, placements, and FAQ.'
    }
  ];

  const SW_BUSINESS_LINKS = [
    { label: 'API ya AfroTools', href: '/sw/api/', icon: 'API', desc: 'Funguo za API, majaribio ya sandbox na huduma za data kwa bidhaa za Afrika.' },
    { label: 'Pendekeza zana', href: '/sw/pendekeza-zana/', icon: 'IDEA', desc: 'Tuambie zana, nchi au workflow ya biashara ambayo timu yako inahitaji.' },
    { label: 'Zana maalum', href: '/sw/wasiliana/', icon: 'B2B', desc: 'Ongea nasi kuhusu vikokotoo vya HR, payroll, fintech, shule au vyombo vya habari.' },
    { label: 'Biashara na VAT', href: '/sw/vat-na-kodi/', icon: 'VAT', desc: 'VAT, TIN, ankara, usajili na uzingatiaji wa biashara kwa Kiswahili.' },
    { label: 'Wasiliana nasi', href: '/sw/wasiliana/', icon: 'MAIL', desc: 'Sponsorship, ushirikiano, media na maswali ya biashara kwa timu ya AfroTools.' }
  ];

  const HA_BUSINESS_LINKS = [
    { label: 'Kayan sakawa - shafi na Turanci', href: '/widgets/', icon: 'W', desc: 'Shafi na Turanci don saka kayan aiki a shafin yanar gizo, Widget Pro, tsarin tambarin abokin ciniki, kididdiga da neman abokan hulda.' },
    { label: 'API na bayanai - shafi na Turanci', href: '/api/', icon: 'API', desc: 'Shafi na Turanci don mabudin gwaji, gwajin API, damar Pro da biyan kudin bayanan Afirka.' },
    { label: 'VAT da harajin kasuwanci', href: '/ha/kasuwanci-da-haraji/', icon: 'VAT', desc: 'Kalkuletan VAT, TIN, takardar kudi da hanyoyin harajin kasuwanci a Hausa.' },
    { label: 'Tallafin kayan aiki - shafi na Turanci', href: '/sponsored-tools/', icon: 'SP', desc: 'Shafi na Turanci don tallafa wa kayan aiki, rukuni ko shafin kasa tare da farashin gwaji.' },
    { label: 'Kalkuleta na musamman - shafi na Turanci', href: '/custom-calculators/', icon: 'CC', desc: "Shafi na Turanci don kalkuleta na ma'aikata, biyan albashi, fasahar kudi, lissafin kudi, makarantu da yada labarai." },
    { label: 'Kunshin yada labarai - shafi na Turanci', href: '/media-kit/', icon: 'MK', desc: 'Shafi na Turanci don bayanan masu karatu, wuraren talla, matakan tayin, farashi, wuraren sakawa da tambayoyi.' }
  ];

  const YO_BUSINESS_LINKS = [
    { label: 'Kayan ìfibọ̀ - ojú ìwé Gẹẹsi', href: '/widgets/', icon: 'W', desc: 'Ojú ìwé Gẹẹsi fún embed, Widget Pro, white-label, analytics àti lead capture.' },
    { label: 'API data - ojú ìwé Gẹẹsi', href: '/api/', icon: 'API', desc: 'Ojú ìwé Gẹẹsi fún sandbox keys, API pilots, Pro access àti ìforúkọsílẹ̀ data Afirika.' },
    { label: 'VAT àti owó-orí iṣẹ́', href: '/yo/owo-ori-owo-ise/', icon: 'VAT', desc: 'Ojú Yorùbá fún VAT, TIN, invoice, PAYE, CIT, WHT, CAC àti ìjápọ̀ Gẹẹsi tí a samisi.' },
    { label: 'Ìpolongo irinṣẹ - ojú ìwé Gẹẹsi', href: '/sponsored-tools/', icon: 'SP', desc: 'Ojú ìwé Gẹẹsi fún sponsorship irinṣẹ, ẹ̀ka tàbí ojú ìwé orílẹ̀-èdè.' },
    { label: 'Ìṣirò àkànṣe - ojú ìwé Gẹẹsi', href: '/custom-calculators/', icon: 'CC', desc: 'Ojú ìwé Gẹẹsi fún calculators HR, payroll, fintech, accounting, ilé-ẹ̀kọ́ àti media.' },
    { label: 'Media kit - ojú ìwé Gẹẹsi', href: '/media-kit/', icon: 'MK', desc: 'Ojú ìwé Gẹẹsi fún audience, inventory, pricing, placements àti FAQ.' }
  ];

  function localizedItemText(item, field, lang) {
    var overrides = TOOL_MENU_COPY[lang] && TOOL_MENU_COPY[lang][item.id];
    if (overrides && overrides[field]) return overrides[field];
    if (lang === 'fr' && item[field + 'Fr']) return item[field + 'Fr'];
    if (lang === 'sw' && item[field + 'Sw']) return item[field + 'Sw'];
    return item[field] || '';
  }

  function localizedBusinessLinks(lang) {
    if (lang === 'sw') return SW_BUSINESS_LINKS;
    if (lang === 'ha') return HA_BUSINESS_LINKS;
    if (lang === 'yo') return YO_BUSINESS_LINKS;
    return BUSINESS_LINKS;
  }

  const COUNTRY_LINKS = [
    { label: 'Nigeria', href: '/nigeria/' },
    { label: 'Kenya', href: '/kenya/' },
    { label: 'Ghana', href: '/ghana/' },
    { label: 'South Africa', href: '/south-africa/' },
    { label: 'Egypt', href: '/egypt/' },
    { label: 'Tanzania', href: '/tanzania/' },
    { label: 'Rwanda', href: '/rwanda/' },
    { label: 'Senegal', href: '/senegal/' },
  ];

  const COUNTRY_LINKS_HA = [
    { label: 'Najeriya', href: '/ha/najeriya/', slug: 'nigeria' },
    { label: 'Kenya - shafi na Turanci', href: '/kenya/', slug: 'kenya' },
    { label: 'Ghana - shafi na Turanci', href: '/ghana/', slug: 'ghana' },
    { label: 'Afirka ta Kudu - shafi na Turanci', href: '/south-africa/', slug: 'south-africa' },
    { label: 'Masar - shafi na Turanci', href: '/egypt/', slug: 'egypt' },
    { label: 'Tanzania - shafi na Turanci', href: '/tanzania/', slug: 'tanzania' },
    { label: 'Rwanda - shafi na Turanci', href: '/rwanda/', slug: 'rwanda' },
    { label: 'Senegal - shafi na Turanci', href: '/senegal/', slug: 'senegal' },
  ];

  const COUNTRY_LINKS_YO = [
    { label: 'Naijiria', href: '/yo/naijiria/', slug: 'nigeria' },
    { label: 'Kenya - ojú ìwé Gẹẹsi', href: '/kenya/', slug: 'kenya' },
    { label: 'Ghana - ojú ìwé Gẹẹsi', href: '/ghana/', slug: 'ghana' },
    { label: 'South Africa - ojú ìwé Gẹẹsi', href: '/south-africa/', slug: 'south-africa' },
    { label: 'Egypt - ojú ìwé Gẹẹsi', href: '/egypt/', slug: 'egypt' },
    { label: 'Tanzania - ojú ìwé Gẹẹsi', href: '/tanzania/', slug: 'tanzania' },
    { label: 'Rwanda - ojú ìwé Gẹẹsi', href: '/rwanda/', slug: 'rwanda' },
    { label: 'Senegal - ojú ìwé Gẹẹsi', href: '/senegal/', slug: 'senegal' },
  ];

  function localizedCountryLinks(lang) {
    if (lang === 'ha') return COUNTRY_LINKS_HA;
    if (lang === 'yo') return COUNTRY_LINKS_YO;
    return COUNTRY_LINKS;
  }

  const MARK = `<svg viewBox="0 0 68 68" fill="none" xmlns="http://www.w3.org/2000/svg" style="height:30px;width:30px;flex-shrink:0">
    <polygon points="34,20 48,34 34,48 20,34" fill="#0062CC"/>
    <polygon points="34,2  44,14 34,20 24,14" fill="#F5A623"/>
    <polygon points="34,48 44,60 34,68 24,60" fill="#0047AB"/>
    <polygon points="2,24  14,34 2,44  -10,34" fill="#0062CC" opacity="0.7"/>
    <polygon points="52,24 64,34 52,44 40,34"  fill="#0062CC" opacity="0.55"/>
  </svg>`;

  const CSS = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; font-family: 'DM Sans', system-ui, sans-serif; -webkit-font-smoothing: antialiased; }
    :host {
      display: block;
      position: sticky;
      top: 0;
      z-index: 500;
      --nav-shell-height: 64px;
      --nav-inline-pad: 20px;
      --nav-safe-top: env(safe-area-inset-top, 0px);
      --nav-safe-right: env(safe-area-inset-right, 0px);
      --nav-safe-bottom: env(safe-area-inset-bottom, 0px);
      --nav-safe-left: env(safe-area-inset-left, 0px);
    }

    nav {
      position: relative;
      height: var(--nav-shell-height);
      background: rgba(255, 255, 255, 0.98);
      backdrop-filter: blur(20px) saturate(180%);
      -webkit-backdrop-filter: blur(20px) saturate(180%);
      border-bottom: 1px solid rgba(0, 0, 0, 0.06);
      display: flex; align-items: center;
      padding: 0 max(var(--nav-inline-pad), var(--nav-safe-right)) 0 max(var(--nav-inline-pad), var(--nav-safe-left));
      transition: box-shadow 0.2s;
    }
    nav.scrolled { box-shadow: 0 1px 0 rgba(0,0,0,0.06); }

    .inner {
      max-width: min(1760px, calc(100vw - 32px)); margin: 0 auto; width: 100%;
      display: flex; align-items: center; gap: 10px;
    }

    /* LOGO */
    .logo {
      display: flex; align-items: center; gap: 9px;
      text-decoration: none; flex-shrink: 0; margin-right: 8px;
    }
    .logo-name { font-size: 1rem; font-weight: 800; letter-spacing: 0.02em; color: #111827; }
    .logo-name b { color: #0062CC; }
    .logo-tag { font-size: 0.44rem; font-weight: 600; letter-spacing: 0.16em; text-transform: uppercase; color: #475569; display: block; margin-top: 2px; }

    /* NAV LINKS */
    .nav-links { display: flex; align-items: center; justify-content: flex-start; list-style: none; flex: 1 1 auto; gap: 4px; overflow: hidden; min-width: 0; }
    li { position: relative; }

    .lnk {
      display: flex; align-items: center; gap: 4px;
      padding: 7px 12px; border-radius: 980px;
      font-size: 0.81rem; font-weight: 600; color: #374151;
      text-decoration: none; border: none; background: transparent;
      cursor: pointer; white-space: nowrap;
      transition: color 0.13s, background 0.13s;
      min-height: 40px;
    }
    .lnk:hover, .lnk.open { color: #0062CC; background: #EEF4FF; }
    .lnk.active { color: #0062CC; position: relative; }
    .lnk.active::after { content: ''; position: absolute; bottom: 2px; left: 50%; transform: translateX(-50%); width: 16px; height: 2px; background: #0062CC; border-radius: 2px; }
    .chev { width: 7px; height: 4px; flex-shrink: 0; opacity: 0.4; transition: transform 0.18s, opacity 0.13s; }
    .lnk.open .chev { transform: rotate(180deg); opacity: 1; color: #0062CC; }

    /* MEGA MENU */
    .mega {
      position: fixed;
      top: var(--nav-shell-height); left: 0; right: 0;
      background: rgba(255,255,255,0.97);
      -webkit-backdrop-filter: saturate(180%) blur(20px);
      backdrop-filter: saturate(180%) blur(20px);
      border-bottom: 1px solid rgba(0,0,0,0.07);
      box-shadow: 0 18px 42px rgba(15,23,42,0.08);
      opacity: 0; visibility: hidden;
      transform: translateY(-6px);
      transition: opacity 0.16s ease, visibility 0.16s ease, transform 0.16s ease;
      z-index: 499;
      pointer-events: none;
    }
    .mega.open {
      opacity: 1; visibility: visible;
      transform: translateY(0);
      pointer-events: all;
    }

    .mega-inner {
      max-width: 1200px; margin: 0 auto;
      padding: 22px 20px;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
    }
    .tools-mega-grid {
      max-width: 1240px;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 10px;
    }
    .business-mega-grid {
      max-width: 980px;
      grid-template-columns: repeat(5, minmax(0, 1fr));
      gap: 10px;
    }

    .mega-col {
      border-radius: 12px; padding: 15px;
      border: 1px solid #edf1f7;
      transition: border-color 0.13s, background 0.13s;
      display: flex; align-items: center; gap: 9px;
      text-decoration: none; cursor: pointer;
    }
    .mega-col:hover { border-color: var(--col-accent, #0062CC); background: #f8fbff; }
    .business-col {
      align-items: flex-start;
      flex-direction: column;
      min-height: 136px;
      gap: 10px;
    }
    .business-col .mega-col-icon {
      color: #0062CC;
      font-size: 0.72rem;
      font-weight: 800;
      letter-spacing: 0;
    }

    .mega-col-icon {
      width: 34px; height: 34px; border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      font-size: 1rem; flex-shrink: 0;
    }
    .mega-col-name { font-size: 0.83rem; font-weight: 600; color: #334155; line-height: 1.2; }
    .mega-col-desc { font-size: 0.65rem; font-weight: 400; color: #64748b; margin-top: 1px; }

    .mega-footer {
      max-width: 1200px; margin: 0 auto;
      padding: 10px 20px 14px;
      border-top: 1px solid #f3f4f6;
      display: flex; align-items: center; justify-content: space-between;
    }
    .mega-footer-note { font-size: 0.68rem; color: #64748b; font-weight: 600; }
    .mega-footer-lnk { font-size: 0.72rem; font-weight: 700; color: #0062CC; text-decoration: none; }
    .mega-footer-lnk:hover { text-decoration: underline; }

    .country-search-panel {
      grid-column: 1 / -1;
      display: grid;
      grid-template-columns: minmax(240px, 360px) 1fr;
      gap: 12px;
      align-items: start;
      padding: 2px 0 8px;
    }
    .country-search-label {
      display: block;
      margin-bottom: 6px;
      font-size: 0.68rem;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #64748b;
    }
    .country-search-box {
      display: flex;
      align-items: center;
      min-height: 44px;
      border: 1px solid #dbe3ef;
      border-radius: 12px;
      background: #fff;
      padding: 0 12px;
    }
    .country-search-box:focus-within {
      border-color: #0062CC;
      box-shadow: 0 0 0 3px rgba(0,98,204,0.12);
    }
    .country-search-input {
      width: 100%;
      border: 0;
      outline: 0;
      background: transparent;
      color: #111827;
      font: inherit;
      font-size: 0.88rem;
      font-weight: 600;
    }
    .country-search-input::placeholder { color: #94a3b8; font-weight: 500; }
    .country-search-results {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 8px;
      min-height: 0;
    }
    .country-search-results:empty { display: none; }
    .country-search-result {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      min-height: 44px;
      padding: 10px 12px;
      border-radius: 10px;
      border: 1px solid #edf1f7;
      color: #1f2937;
      text-decoration: none;
      background: #fff;
      font-size: 0.84rem;
      font-weight: 800;
    }
    .country-search-result:hover { border-color: #0062CC; color: #0062CC; background: #f8fbff; }
    .country-search-meta { color: #64748b; font-size: 0.68rem; font-weight: 700; }

    /* RIGHT */
    .right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; margin-left: auto; }
    .country-control-shell { width: 156px; flex: 0 0 156px; }
    afro-country-selector[variant="nav"] { width: 100% !important; max-width: 100%; }
    .pill-54 { font-size: 0.66rem; font-weight: 600; color: #6b7280; padding: 4px 10px; border-radius: 20px; border: 1px solid #e5e7eb; background: #f9fafb; white-space: nowrap; }

    .btn-login {
      display: inline-flex; align-items: center; justify-content: center;
      font-size: 0.79rem; font-weight: 600; color: #374151;
      padding: 7px 14px; border-radius: 980px;
      border: 1.5px solid rgba(0,0,0,0.12); background: rgba(0,0,0,0.03);
      text-decoration: none; white-space: nowrap;
      transition: all 0.13s; cursor: pointer;
      min-height: 40px;
    }
    .btn-login:hover { border-color: #0062CC; color: #0062CC; }
    .btn-login.is-user {
      width: 42px;
      min-width: 42px;
      padding: 0;
      gap: 0;
      border-color: rgba(0,0,0,0.12);
      background: #f8fafc;
    }
    .btn-login.is-user:hover {
      background: #EEF4FF;
      border-color: #0062CC;
    }
    .nav-user-avatar {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: #0062CC;
      color: #fff;
      font-size: 0.68rem;
      font-weight: 800;
      line-height: 1;
    }
    .nav-user-name {
      display: none;
    }
    .ap-nav-badge {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      min-height: 32px;
      background: rgba(245,158,11,0.12);
      color: #B45309;
      font-size: 0.68rem;
      font-weight: 800;
      padding: 3px 8px;
      border-radius: 100px;
      text-decoration: none;
      white-space: nowrap;
    }

    .btn-pro {
      display: inline-flex; align-items: center; justify-content: center;
      min-width: 56px; padding: 7px 14px; border-radius: 980px;
      border: 1.5px solid #BFDBFE;
      background: #fff;
      color: #0B63CE; text-decoration: none; white-space: nowrap;
      font-size: 0.78rem; font-weight: 700; letter-spacing: 0;
      transition: transform 0.13s, box-shadow 0.13s, background 0.13s, border-color 0.13s;
      box-shadow: 0 2px 8px rgba(15,23,42,0.05);
      min-height: 40px;
    }
    .btn-pro:hover {
      background: #EFF6FF;
      border-color: #0062CC;
      box-shadow: 0 5px 14px rgba(0,98,204,0.12);
      transform: translateY(-1px);
    }
    .btn-pro.is-free {
      background: #F8FAFC;
      border-color: #CBD5E1;
      color: #0F172A;
    }
    .btn-pro.is-pro {
      background: #ECFDF5;
      border-color: #A7F3D0;
      color: #047857;
      box-shadow: 0 3px 10px rgba(4,120,87,0.08);
    }

    .cta {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 8px 16px; border-radius: 980px;
      font-size: 0.79rem; font-weight: 700;
      text-decoration: none; background: #0062CC; color: #fff;
      border: none; cursor: pointer; white-space: nowrap;
      transition: background 0.13s, transform 0.1s;
      box-shadow: 0 1px 4px rgba(0,122,255,0.28);
      min-height: 40px;
    }
    .cta:hover  { background: #005BBF; transform: translateY(-1px); }
    .cta:active { transform: translateY(0); }

    /* LANGUAGE SWITCHER */
    .lang-switch { position: relative; display: flex; align-items: center; }
    .lang-btn {
      display: flex; align-items: center; gap: 4px;
      padding: 4px 8px; border-radius: 980px;
      font-size: 0.73rem; font-weight: 700; color: #374151;
      border: 1.5px solid rgba(0,0,0,0.1); background: rgba(0,0,0,0.02);
      cursor: pointer; white-space: nowrap; transition: all 0.13s;
      font-family: 'DM Sans', system-ui, sans-serif;
      min-height: 40px;
    }
    .lang-btn-label { transition: width 0.15s, opacity 0.15s; }
    .lang-btn:hover { border-color: #0062CC; color: #0062CC; background: #EEF4FF; }
    .lang-drop {
      display: none; position: absolute; top: calc(100% + 6px); right: 0;
      background: #fff; border-radius: 10px; border: 1px solid #e5e7eb;
      box-shadow: 0 8px 32px rgba(0,0,0,0.12); min-width: 150px; z-index: 600;
      overflow: hidden;
    }
    .lang-drop.open { display: block; }
    .lang-opt {
      display: flex; align-items: center; gap: 8px;
      padding: 10px 14px; font-size: 0.82rem; font-weight: 500; color: #374151;
      text-decoration: none; transition: background 0.1s; cursor: pointer;
    }
    .lang-opt:hover { background: #EEF4FF; }
    .lang-opt.active { font-weight: 700; color: #0062CC; background: #f0f7ff; }

    /* HAMBURGER */
    .burger {
      display: none; flex-direction: column; justify-content: center; gap: 5px;
      width: 44px; height: 44px; background: transparent; border: none;
      cursor: pointer; padding: 10px; border-radius: 6px; flex-shrink: 0;
    }
    .burger:hover { background: #f3f4f6; }
    .burger span { display: block; width: 100%; height: 2px; background: #374151; border-radius: 2px; transition: all 0.22s; }
    .burger.open span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
    .burger.open span:nth-child(2) { opacity: 0; transform: scaleX(0); }
    .burger.open span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

    /* MOBILE DRAWER */
    .mob {
      display: none; position: fixed;
      top: var(--nav-shell-height); left: 0; right: 0; bottom: 0;
      background: #fff; z-index: 498;
      overflow-y: auto; flex-direction: column;
      opacity: 1; visibility: hidden; pointer-events: none;
      transform: translateY(-6px);
      transition: transform 0.18s ease, visibility 0.18s ease;
      min-height: calc(100dvh - var(--nav-shell-height));
      overscroll-behavior: contain;
      -webkit-overflow-scrolling: touch;
      padding-right: var(--nav-safe-right);
      padding-bottom: calc(20px + var(--nav-safe-bottom));
      padding-left: var(--nav-safe-left);
    }
    .mob.open { opacity: 1; visibility: visible; pointer-events: all; transform: translateY(0); }
    .mob-country-context { padding: 16px 18px 0; }

    .mob-section-label {
      font-size: 0.68rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase;
      color: #9ca3af; padding: 14px 20px 6px;
    }
    .mob-country-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 8px;
      padding: 0 16px 8px;
    }
    .mob-country-link {
      min-height: 44px;
      display: flex; align-items: center; justify-content: center;
      padding: 10px 12px;
      border-radius: 10px;
      border: 1px solid #e5e7eb;
      color: #1f2937;
      background: #fff;
      font-size: 0.86rem;
      font-weight: 700;
      text-decoration: none;
    }
    .mob-country-link:hover { border-color: #0062CC; color: #0062CC; background: #f8fbff; }
    .mob-country-search {
      display: flex;
      align-items: center;
      min-height: 48px;
      margin: 0 16px 10px;
      padding: 0 12px;
      border-radius: 10px;
      border: 1px solid #dbe3ef;
      background: #fff;
    }
    .mob-country-search:focus-within {
      border-color: #0062CC;
      box-shadow: 0 0 0 3px rgba(0,98,204,0.12);
    }
    .mob-country-search-input {
      width: 100%;
      border: 0;
      outline: 0;
      background: transparent;
      color: #111827;
      font: inherit;
      font-size: 16px;
      font-weight: 600;
    }
    .mob-country-results {
      display: grid;
      grid-template-columns: 1fr;
      gap: 8px;
      padding: 0 16px 8px;
    }
    .mob-country-results:empty { display: none; }
    .mob-country-results .country-search-result { width: 100%; }
    .mob-cat {
      display: flex; align-items: center; gap: 12px;
      padding: 13px 20px; border-bottom: 1px solid #f9fafb;
      text-decoration: none; transition: background 0.1s; min-height: 58px;
    }
    .mob-cat:hover { background: #f9fafb; }
    .mob-cat-icon {
      width: 38px; height: 38px; border-radius: 9px;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.1rem; flex-shrink: 0;
    }
    .mob-cat-label { font-size: 0.92rem; font-weight: 600; color: #334155; }
    .mob-cat-desc  { font-size: 0.7rem; font-weight: 400; color: #6b7280; margin-top: 1px; }
    .mob-arr { margin-left: auto; font-size: 0.7rem; color: #9ca3af; }

    .mob-footer {
      padding: 20px; border-top: 1px solid #f3f4f6; margin-top: 8px;
      display: flex; flex-direction: column; gap: 10px;
    }
    .mob-footer a { min-height: 48px; }
    .mob-cta {
      display: flex; align-items: center; justify-content: center;
      padding: 15px; border-radius: 980px; font-size: 0.95rem; font-weight: 700;
      text-decoration: none; background: #0062CC; color: white; min-height: 52px;
    }
    .mob-login {
      display: flex; align-items: center; justify-content: center;
      padding: 13px; border-radius: 8px; font-size: 0.9rem; font-weight: 600;
      text-decoration: none; border: 1.5px solid #e5e7eb; color: #374151;
    }
    .mob-pro-link {
      display: flex; align-items: center; justify-content: center;
      padding: 13px; border-radius: 8px; font-size: 0.9rem; font-weight: 700;
      text-decoration: none; border: 1.5px solid #BFDBFE; color: #0B63CE; background: #fff;
      box-shadow: 0 2px 8px rgba(15,23,42,0.05);
    }
    .mob-pro-link.is-free {
      border-color: #CBD5E1;
      color: #0F172A;
      background: #F8FAFC;
    }
    .mob-pro-link.is-pro {
      border-color: #A7F3D0;
      color: #047857;
      background: #ECFDF5;
    }
    .mob-note { text-align: center; font-size: 0.7rem; font-weight: 500; color: #9ca3af; }

    /* RESPONSIVE — progressive collapse */
    .pill-54 { display: none; }
    @media (max-width: 1400px) {
      .inner { gap: 8px; }
      .logo { margin-right: 4px; }
      .lnk { padding-left: 10px; padding-right: 10px; }
      .right { gap: 6px; }
      .country-control-shell { width: 148px; flex-basis: 148px; }
      .search-btn .search-kbd { display: none; }
      .btn-pro { padding-left: 12px; padding-right: 12px; }
    }
    @media (max-width: 1120px) {
      .business-mega-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
    }
    @media (max-width: 1180px) {
      .nav-links li:nth-child(6) { display: none; }
    }
    @media (max-width: 1120px) {
      .nav-links li:nth-child(5) { display: none; }
    }
    @media (max-width: 1100px) {
      .country-control-shell { display: none; }
      .cta { display: none; }
      .lang-btn-label { display: none; }
      .lang-btn { padding: 5px 7px; font-size: 0.9rem; }
      .btn-pro { min-width: 0; padding: 7px 12px; }
    }
    @media (max-width: 940px) {
      .nav-links, .pill-54, .cta, .btn-pro { display: none; }
      .lang-switch { display: none; }
      .btn-login { display: none; }
      .btn-login .nav-user-name, .btn-login .user-menu-name { display: none !important; width: 0 !important; height: 0 !important; overflow: hidden !important; font-size: 0 !important; }
      .btn-login span:first-child { margin-right: 0 !important; }
      .burger { display: flex; }
      .mob    { display: flex; }
      nav     {
        padding-left: max(16px, var(--nav-safe-left));
        padding-right: max(16px, var(--nav-safe-right));
        max-width: 100vw !important;
        overflow-x: hidden !important;
      }
    }
    @media (max-width: 480px) {
      :host {
        --nav-shell-height: 56px;
        --nav-inline-pad: 16px;
      }
      .logo-tag { display: none; }
    }

    /* SEARCH BUTTON */
    .search-btn {
      display: flex; align-items: center; justify-content: center;
      width: 36px; height: 36px; border-radius: 980px;
      border: 1px solid rgba(0,0,0,0.1); background: rgba(0,0,0,0.04);
      cursor: pointer; color: #374151;
      transition: all 0.13s; flex-shrink: 0;
    }
    .search-btn:hover { border-color: #0062CC; color: #0062CC; background: #EEF4FF; }
    .theme-toggle {
      display: flex; align-items: center; justify-content: center;
      width: 40px; height: 40px; border-radius: 980px;
      border: 1px solid rgba(0,0,0,0.1); background: rgba(0,0,0,0.03);
      color: #475569; cursor: pointer; flex-shrink: 0;
      transition: color 0.13s, background 0.13s, border-color 0.13s, transform 0.13s;
    }
    .theme-toggle:hover { border-color: #0062CC; color: #0062CC; background: #EEF4FF; transform: translateY(-1px); }
    .theme-toggle svg { width: 17px; height: 17px; }
    .theme-icon-sun { display: none; }
    :host(.theme-dark) .theme-icon-moon { display: none; }
    :host(.theme-dark) .theme-icon-sun { display: block; }
    .search-btn:focus-visible, .theme-toggle:focus-visible, .lnk:focus-visible, .btn-login:focus-visible, .btn-pro:focus-visible, .mob-pro-link:focus-visible, .burger:focus-visible, .lang-btn:focus-visible, .mob-theme-toggle:focus-visible {
      outline: 3px solid rgba(0,98,204,0.22);
      outline-offset: 2px;
    }
    .search-btn svg { width: 16px; height: 16px; }
    .search-btn-label { display: none; font-size: 0.79rem; font-weight: 700; }
    .search-kbd {
      font-size: 0.65rem; font-weight: 600; color: #9ca3af;
      margin-left: 4px; background: #f3f4f6; border-radius: 4px;
      padding: 1px 5px; border: 1px solid #e5e7eb;
      display: none;
    }
    @media (min-width: 941px) {
      .search-btn { width: auto; padding: 0 10px; gap: 6px; }
      .search-btn-label { display: inline; }
      .search-kbd { display: inline; }
    }
    @media (max-width: 1320px) {
      .search-btn { width: 36px; padding: 0; gap: 0; }
      .search-btn-label, .search-kbd { display: none; }
    }

    /* SEARCH OVERLAY */
    .search-overlay {
      position: fixed; inset: 0; z-index: 9999;
      background: rgba(0,0,0,0.4);
      backdrop-filter: blur(4px);
      display: flex; align-items: flex-start; justify-content: center;
      padding-top: 12vh;
      opacity: 0; visibility: hidden;
      transition: opacity 0.16s, visibility 0.16s;
    }
    .search-overlay.open { opacity: 1; visibility: visible; }

    .search-modal {
      width: 100%; max-width: 560px;
      background: #fff; border-radius: 14px;
      box-shadow: 0 24px 80px rgba(0,0,0,0.2), 0 4px 16px rgba(0,0,0,0.08);
      overflow: hidden;
      transform: translateY(-12px) scale(0.97);
      transition: transform 0.18s ease;
      margin: 0 16px;
    }
    .search-overlay.open .search-modal {
      transform: translateY(0) scale(1);
    }

    .search-input-wrap {
      display: flex; align-items: center; gap: 10px;
      padding: 14px 18px;
      border-bottom: 1px solid #f3f4f6;
    }
    .search-input-wrap svg { width: 18px; height: 18px; color: #9ca3af; flex-shrink: 0; }
    .search-input {
      flex: 1; border: none; outline: none;
      font-size: 1rem; font-weight: 500; color: #111827;
      font-family: 'DM Sans', system-ui, sans-serif;
      background: transparent;
    }
    .search-input::placeholder { color: #c4c8cc; }
    .search-esc {
      font-size: 0.68rem; font-weight: 600; color: #9ca3af;
      background: #f3f4f6; border-radius: 4px;
      padding: 2px 7px; border: 1px solid #e5e7eb;
      cursor: pointer; flex-shrink: 0;
    }

    .search-results {
      max-height: 400px; overflow-y: auto;
      padding: 6px;
    }
    .search-results::-webkit-scrollbar { width: 6px; }
    .search-results::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 3px; }

    .search-result {
      display: flex; align-items: center; gap: 12px;
      padding: 10px 12px; border-radius: 10px;
      text-decoration: none; color: inherit;
      transition: background 0.1s;
      cursor: pointer;
    }
    .search-result:hover, .search-result.active {
      background: #EEF4FF;
    }
    .search-result-icon {
      width: 38px; height: 38px; border-radius: 9px;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.15rem; flex-shrink: 0;
      background: #f3f4f6;
    }
    .search-result-name {
      font-size: 0.85rem; font-weight: 700; color: #111827;
      line-height: 1.2;
    }
    .search-result-name mark {
      background: #DBEAFE; color: #1D4ED8;
      border-radius: 2px; padding: 0 1px;
    }
    .search-result-desc {
      font-size: 0.7rem; font-weight: 400; color: #6b7280;
      margin-top: 2px;
      display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden;
    }
    .search-result-cat {
      font-size: 0.65rem; font-weight: 600; color: #9ca3af;
      text-transform: uppercase; letter-spacing: 0.06em;
      margin-top: 2px;
    }

    .search-empty {
      padding: 32px 16px; text-align: center;
    }
    .search-empty-icon { font-size: 2rem; margin-bottom: 8px; }
    .search-empty-text { font-size: 0.85rem; font-weight: 600; color: #6b7280; }
    .search-empty-hint { font-size: 0.72rem; color: #9ca3af; margin-top: 4px; }

    .search-footer {
      padding: 10px 18px;
      border-top: 1px solid #f3f4f6;
      display: flex; align-items: center; justify-content: space-between;
    }
    .search-footer-hint {
      font-size: 0.68rem; color: #9ca3af; font-weight: 500;
      display: flex; align-items: center; gap: 8px;
    }
    .search-footer-hint kbd {
      background: #f3f4f6; border: 1px solid #e5e7eb;
      border-radius: 3px; padding: 1px 5px;
      font-size: 0.65rem; font-weight: 600; font-family: inherit;
    }

    /* RECENT TOOLS in search */
    .search-section-label {
      font-size: 0.68rem; font-weight: 700; letter-spacing: 0.1em;
      text-transform: uppercase; color: #9ca3af;
      padding: 10px 12px 4px;
    }
    .recent-clear {
      font-size: 0.68rem; font-weight: 600; color: #0062CC;
      cursor: pointer; float: right; background: none; border: none;
      font-family: inherit; padding: 0;
    }
    .recent-clear:hover { text-decoration: underline; }

    /* MOBILE SEARCH in drawer */
    .mob-search-bar {
      display: flex; align-items: center; gap: 10px;
      margin: 12px 16px 4px; padding: 11px 14px;
      border-radius: 10px; border: 1.5px solid #e5e7eb;
      background: #f9fafb;
      transition: border-color 0.13s;
      min-height: 52px;
    }
    .mob-search-bar:focus-within { border-color: #0062CC; background: #fff; }
    .mob-search-bar svg { width: 16px; height: 16px; color: #9ca3af; flex-shrink: 0; }
    .mob-search-input {
      flex: 1; border: none; outline: none;
      font-size: 16px; font-weight: 500; color: #111827;
      font-family: 'DM Sans', system-ui, sans-serif;
      background: transparent;
    }
    .mob-search-input::placeholder { color: #c4c8cc; }
    .mob-search-results {
      padding: 0 8px 8px;
    }
    .mob-search-results .search-result {
      padding: 12px 12px;
      min-height: 56px;
    }
    .mob-search-results .search-result-icon {
      width: 40px; height: 40px;
    }
    .mob-search-empty {
      padding: 20px 16px; text-align: center;
      font-size: 0.8rem; color: #9ca3af; font-weight: 500;
    }

    /* MOBILE LANGUAGE PICKER */
    .mob-lang-section { padding: 6px 16px 2px; }
    .mob-lang-row {
      display: flex; flex-wrap: wrap; gap: 8px;
    }
    .mob-lang-opt {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 8px 14px; border-radius: 980px;
      font-size: 0.82rem; font-weight: 600; color: #374151;
      text-decoration: none; border: 1.5px solid #e5e7eb;
      background: #f9fafb; transition: all 0.13s;
    }
    .mob-lang-opt:hover { border-color: #0062CC; color: #0062CC; background: #EEF4FF; }
    .mob-lang-opt.active { border-color: #0062CC; color: #0062CC; background: #EEF4FF; font-weight: 700; }

    .mob-theme-section { padding: 8px 16px 2px; }
    .mob-theme-toggle {
      width: 100%; min-height: 48px;
      display: flex; align-items: center; justify-content: space-between; gap: 12px;
      padding: 12px 14px; border-radius: 12px;
      border: 1.5px solid #e5e7eb; background: #f9fafb;
      color: #334155; font: inherit; font-size: 0.9rem; font-weight: 700;
      cursor: pointer;
    }
    .mob-theme-copy { display: flex; align-items: center; gap: 10px; }
    .mob-theme-copy svg { width: 17px; height: 17px; }
    .mob-theme-state { color: #64748b; font-size: 0.76rem; font-weight: 800; }

    :host(.theme-dark) nav {
      background: rgba(8,15,28,0.96);
      border-bottom-color: rgba(255,255,255,0.08);
      color: #EEF5FF;
    }
    :host(.theme-dark) nav.scrolled { box-shadow: 0 1px 0 rgba(255,255,255,0.08); }
    :host(.theme-dark) .logo-name,
    :host(.theme-dark) .lnk,
    :host(.theme-dark) .btn-login,
    :host(.theme-dark) .lang-btn,
    :host(.theme-dark) .mob-cat-label,
    :host(.theme-dark) .mega-col-name,
    :host(.theme-dark) .country-search-input,
    :host(.theme-dark) .mob-search-input,
    :host(.theme-dark) .mob-country-search-input,
    :host(.theme-dark) .search-input,
    :host(.theme-dark) .search-result-name {
      color: #EEF5FF;
    }
    :host(.theme-dark) .logo-tag,
    :host(.theme-dark) .mega-col-desc,
    :host(.theme-dark) .mega-footer-note,
    :host(.theme-dark) .country-search-label,
    :host(.theme-dark) .country-search-meta,
    :host(.theme-dark) .mob-section-label,
    :host(.theme-dark) .mob-cat-desc,
    :host(.theme-dark) .mob-note,
    :host(.theme-dark) .search-result-desc,
    :host(.theme-dark) .search-result-cat,
    :host(.theme-dark) .search-empty-text,
    :host(.theme-dark) .search-empty-hint {
      color: #9FB0C8;
    }
    :host(.theme-dark) .lnk:hover,
    :host(.theme-dark) .lnk.open,
    :host(.theme-dark) .search-btn:hover,
    :host(.theme-dark) .theme-toggle:hover,
    :host(.theme-dark) .lang-btn:hover,
    :host(.theme-dark) .lang-opt:hover,
    :host(.theme-dark) .lang-opt.active,
    :host(.theme-dark) .mob-lang-opt:hover,
    :host(.theme-dark) .mob-lang-opt.active,
    :host(.theme-dark) .mob-country-link:hover,
    :host(.theme-dark) .country-search-result:hover,
    :host(.theme-dark) .search-result:hover,
    :host(.theme-dark) .search-result.active {
      background: rgba(96,165,250,0.14);
      border-color: rgba(96,165,250,0.42);
      color: #BFDBFE;
    }
    :host(.theme-dark) .mega,
    :host(.theme-dark) .mob,
    :host(.theme-dark) .search-modal,
    :host(.theme-dark) .lang-drop {
      background: rgba(11,21,36,0.98);
      border-color: rgba(255,255,255,0.08);
      box-shadow: 0 24px 70px rgba(0,0,0,0.42);
    }
    :host(.theme-dark) .mob {
      background: #08111F;
      box-shadow: none;
    }
    :host(.theme-dark) .mega-footer,
    :host(.theme-dark) .search-input-wrap,
    :host(.theme-dark) .search-footer,
    :host(.theme-dark) .mob-footer,
    :host(.theme-dark) .mob-cat {
      border-color: rgba(255,255,255,0.08);
    }
    :host(.theme-dark) .mega-col,
    :host(.theme-dark) .country-search-box,
    :host(.theme-dark) .country-search-result,
    :host(.theme-dark) .mob-country-link,
    :host(.theme-dark) .mob-country-search,
    :host(.theme-dark) .mob-search-bar,
    :host(.theme-dark) .mob-lang-opt,
    :host(.theme-dark) .mob-theme-toggle,
    :host(.theme-dark) .search-result-icon,
    :host(.theme-dark) .search-kbd,
    :host(.theme-dark) .search-esc,
    :host(.theme-dark) .search-footer-hint kbd,
    :host(.theme-dark) .theme-toggle,
    :host(.theme-dark) .search-btn {
      background: rgba(18,31,51,0.94);
      border-color: rgba(255,255,255,0.10);
      color: #D9E6F7;
    }
    :host(.theme-dark) .btn-pro,
    :host(.theme-dark) .btn-login.is-user,
    :host(.theme-dark) .mob-pro-link {
      background: rgba(18,31,51,0.94);
      border-color: rgba(96,165,250,0.38);
      color: #BFDBFE;
      box-shadow: none;
    }
    :host(.theme-dark) .btn-pro.is-free,
    :host(.theme-dark) .mob-pro-link.is-free {
      background: rgba(18,31,51,0.94);
      color: #EEF5FF;
      border-color: rgba(255,255,255,0.12);
    }
    :host(.theme-dark) .btn-pro.is-pro,
    :host(.theme-dark) .mob-pro-link.is-pro {
      background: rgba(20,83,45,0.32);
      color: #86EFAC;
      border-color: rgba(74,222,128,0.34);
    }
    :host(.theme-dark) .burger:hover,
    :host(.theme-dark) .mob-cat:hover {
      background: rgba(255,255,255,0.06);
    }
    :host(.theme-dark) .burger span { background: #D9E6F7; }
    :host(.theme-dark) .search-results::-webkit-scrollbar-thumb { background: #3A4C68; }
    :host(.theme-dark) .mob-theme-state { color: #93C5FD; }
    :host(.theme-dark) .mob-cat-icon {
      background: rgba(96,165,250,0.16) !important;
      color: #BFDBFE !important;
    }
    :host(.theme-dark) .mob-arr { color: #7E8FA8; }
  `;

  class AfroNavbar extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this._menuOpen = false;
      this._megaOpen = false;
      this._lockedScrollY = 0;
      this._bodyLocked = false;
    }

    connectedCallback() {
      // P4-03: Inject favicon if not already present
      if (!document.querySelector('link[rel="icon"]')) {
        var link = document.createElement('link');
        link.rel = 'icon';
        link.type = 'image/svg+xml';
        link.href = '/assets/img/logo-mark.svg';
        document.head.appendChild(link);
      }
      this._render(); this._bind();
    }

    disconnectedCallback() {
      if (this._bodyLocked) this._unlockBodyScroll();
      if (this._themeChangeFn) document.removeEventListener('afrotools:theme-change', this._themeChangeFn);
    }
    get active() { return this.getAttribute('active') || ''; }

    _getLang() {
      var segs = window.location.pathname.split('/');
      var first = segs[1];
      if (['fr','sw','yo','ha'].indexOf(first) !== -1) return first;
      return document.documentElement.lang || 'en';
    }

    _languageHrefFor(targetLang, currentLang) {
      var path = window.location.pathname || '/';
      var key = path.replace(/\/index\.html$/, '/');
      if (key.length > 1 && key.charAt(key.length - 1) !== '/') key += '/';
      var routeMap = {
        '/': {
          en: '/',
          fr: '/fr/',
          sw: '/sw/',
          yo: '/yo/',
          ha: '/ha/'
        },
        '/fr/': {
          en: '/',
          fr: '/fr/',
          sw: '/sw/',
          yo: '/yo/',
          ha: '/ha/'
        },
        '/sw/': {
          en: '/',
          fr: '/fr/',
          sw: '/sw/',
          yo: '/yo/',
          ha: '/ha/'
        },
        '/ha/': {
          en: '/',
          fr: '/fr/',
          sw: '/sw/',
          yo: '/yo/',
          ha: '/ha/'
        },
        '/yo/': {
          en: '/',
          fr: '/fr/',
          sw: '/sw/',
          yo: '/yo/',
          ha: '/ha/'
        },
        '/all-tools/': {
          en: '/all-tools/',
          fr: '/fr/all-tools/',
          sw: '/sw/zana-zote/',
          yo: '/yo/awon-ise/',
          ha: '/ha/kayan-aiki/'
        },
        '/fr/all-tools/': {
          en: '/all-tools/',
          fr: '/fr/all-tools/',
          sw: '/sw/zana-zote/',
          yo: '/yo/awon-ise/',
          ha: '/ha/kayan-aiki/'
        },
        '/sw/zana-zote/': {
          en: '/all-tools/',
          fr: '/fr/all-tools/',
          sw: '/sw/zana-zote/',
          yo: '/yo/awon-ise/',
          ha: '/ha/kayan-aiki/'
        },
        '/ha/kayan-aiki/': {
          en: '/all-tools/',
          fr: '/fr/all-tools/',
          sw: '/sw/zana-zote/',
          yo: '/yo/awon-ise/',
          ha: '/ha/kayan-aiki/'
        },
        '/yo/awon-ise/': {
          en: '/all-tools/',
          fr: '/fr/all-tools/',
          sw: '/sw/zana-zote/',
          yo: '/yo/awon-ise/',
          ha: '/ha/kayan-aiki/'
        },
        '/nigeria/': {
          en: '/nigeria/',
          fr: '/fr/nigeria/',
          sw: '/sw/nigeria/',
          yo: '/yo/naijiria/',
          ha: '/ha/najeriya/'
        },
        '/fr/nigeria/': {
          en: '/nigeria/',
          fr: '/fr/nigeria/',
          sw: '/sw/nigeria/',
          yo: '/yo/naijiria/',
          ha: '/ha/najeriya/'
        },
        '/sw/nigeria/': {
          en: '/nigeria/',
          fr: '/fr/nigeria/',
          sw: '/sw/nigeria/',
          yo: '/yo/naijiria/',
          ha: '/ha/najeriya/'
        },
        '/ha/najeriya/': {
          en: '/nigeria/',
          fr: '/fr/nigeria/',
          sw: '/sw/nigeria/',
          yo: '/yo/naijiria/',
          ha: '/ha/najeriya/'
        },
        '/yo/naijiria/': {
          en: '/nigeria/',
          fr: '/fr/nigeria/',
          sw: '/sw/nigeria/',
          yo: '/yo/naijiria/',
          ha: '/ha/najeriya/'
        },
        '/agriculture/': {
          en: '/agriculture/',
          fr: '/fr/agriculture/',
          sw: '/sw/kilimo/',
          yo: '/yo/ogbin/',
          ha: '/ha/noma/'
        },
        '/fr/agriculture/': {
          en: '/agriculture/',
          fr: '/fr/agriculture/',
          sw: '/sw/kilimo/',
          yo: '/yo/ogbin/',
          ha: '/ha/noma/'
        },
        '/sw/kilimo/': {
          en: '/agriculture/',
          fr: '/fr/agriculture/',
          sw: '/sw/kilimo/',
          yo: '/yo/ogbin/',
          ha: '/ha/noma/'
        },
        '/ha/noma/': {
          en: '/agriculture/',
          fr: '/fr/agriculture/',
          sw: '/sw/kilimo/',
          yo: '/yo/ogbin/',
          ha: '/ha/noma/'
        },
        '/yo/ogbin/': {
          en: '/agriculture/',
          fr: '/fr/agriculture/',
          sw: '/sw/kilimo/',
          yo: '/yo/ogbin/',
          ha: '/ha/noma/'
        },
        '/salary-tax/': {
          en: '/salary-tax/',
          fr: '/fr/salary-tax/',
          sw: '/sw/mshahara-na-kodi/',
          yo: '/yo/owo-osu-ati-owo-ori/',
          ha: '/ha/albashi-da-haraji/'
        },
        '/fr/salary-tax/': {
          en: '/salary-tax/',
          fr: '/fr/salary-tax/',
          sw: '/sw/mshahara-na-kodi/',
          yo: '/yo/owo-osu-ati-owo-ori/',
          ha: '/ha/albashi-da-haraji/'
        },
        '/sw/mshahara-na-kodi/': {
          en: '/salary-tax/',
          fr: '/fr/salary-tax/',
          sw: '/sw/mshahara-na-kodi/',
          yo: '/yo/owo-osu-ati-owo-ori/',
          ha: '/ha/albashi-da-haraji/'
        },
        '/ha/albashi-da-haraji/': {
          en: '/salary-tax/',
          fr: '/fr/salary-tax/',
          sw: '/sw/mshahara-na-kodi/',
          yo: '/yo/owo-osu-ati-owo-ori/',
          ha: '/ha/albashi-da-haraji/'
        },
        '/yo/owo-osu-ati-owo-ori/': {
          en: '/salary-tax/',
          fr: '/fr/salary-tax/',
          sw: '/sw/mshahara-na-kodi/',
          yo: '/yo/owo-osu-ati-owo-ori/',
          ha: '/ha/albashi-da-haraji/'
        },
        '/vat-business-tax/': {
          en: '/vat-business-tax/',
          fr: '/fr/vat-business-tax/',
          sw: '/sw/biashara-na-uzingatiaji/',
          yo: '/yo/owo-ori-owo-ise/',
          ha: '/ha/kasuwanci-da-haraji/'
        },
        '/fr/vat-business-tax/': {
          en: '/vat-business-tax/',
          fr: '/fr/vat-business-tax/',
          sw: '/sw/biashara-na-uzingatiaji/',
          yo: '/yo/owo-ori-owo-ise/',
          ha: '/ha/kasuwanci-da-haraji/'
        },
        '/sw/biashara-na-uzingatiaji/': {
          en: '/vat-business-tax/',
          fr: '/fr/vat-business-tax/',
          sw: '/sw/biashara-na-uzingatiaji/',
          yo: '/yo/owo-ori-owo-ise/',
          ha: '/ha/kasuwanci-da-haraji/'
        },
        '/ha/kasuwanci-da-haraji/': {
          en: '/vat-business-tax/',
          fr: '/fr/vat-business-tax/',
          sw: '/sw/biashara-na-uzingatiaji/',
          yo: '/yo/owo-ori-owo-ise/',
          ha: '/ha/kasuwanci-da-haraji/'
        },
        '/yo/owo-ori-owo-ise/': {
          en: '/vat-business-tax/',
          fr: '/fr/vat-business-tax/',
          sw: '/sw/biashara-na-uzingatiaji/',
          yo: '/yo/owo-ori-owo-ise/',
          ha: '/ha/kasuwanci-da-haraji/'
        },
        '/document-pdf/': {
          en: '/document-pdf/',
          fr: '/fr/document-pdf/',
          sw: '/sw/hati-na-pdf/',
          yo: '/yo/iwe-ati-pdf/',
          ha: '/ha/takardu-da-pdf/'
        },
        '/fr/document-pdf/': {
          en: '/document-pdf/',
          fr: '/fr/document-pdf/',
          sw: '/sw/hati-na-pdf/',
          yo: '/yo/iwe-ati-pdf/',
          ha: '/ha/takardu-da-pdf/'
        },
        '/sw/hati-na-pdf/': {
          en: '/document-pdf/',
          fr: '/fr/document-pdf/',
          sw: '/sw/hati-na-pdf/',
          yo: '/yo/iwe-ati-pdf/',
          ha: '/ha/takardu-da-pdf/'
        },
        '/ha/takardu-da-pdf/': {
          en: '/document-pdf/',
          fr: '/fr/document-pdf/',
          sw: '/sw/hati-na-pdf/',
          yo: '/yo/iwe-ati-pdf/',
          ha: '/ha/takardu-da-pdf/'
        },
        '/yo/iwe-ati-pdf/': {
          en: '/document-pdf/',
          fr: '/fr/document-pdf/',
          sw: '/sw/hati-na-pdf/',
          yo: '/yo/iwe-ati-pdf/',
          ha: '/ha/takardu-da-pdf/'
        },
        '/language/': {
          en: '/language/',
          fr: '/fr/language/',
          sw: '/sw/lugha-na-tafsiri/',
          yo: '/yo/ede-ati-itumo/',
          ha: '/ha/harshe-da-fassara/'
        },
        '/fr/language/': {
          en: '/language/',
          fr: '/fr/language/',
          sw: '/sw/lugha-na-tafsiri/',
          yo: '/yo/ede-ati-itumo/',
          ha: '/ha/harshe-da-fassara/'
        },
        '/sw/lugha-na-tafsiri/': {
          en: '/language/',
          fr: '/fr/language/',
          sw: '/sw/lugha-na-tafsiri/',
          yo: '/yo/ede-ati-itumo/',
          ha: '/ha/harshe-da-fassara/'
        },
        '/ha/harshe-da-fassara/': {
          en: '/language/',
          fr: '/fr/language/',
          sw: '/sw/lugha-na-tafsiri/',
          yo: '/yo/ede-ati-itumo/',
          ha: '/ha/harshe-da-fassara/'
        },
        '/yo/ede-ati-itumo/': {
          en: '/language/',
          fr: '/fr/language/',
          sw: '/sw/lugha-na-tafsiri/',
          yo: '/yo/ede-ati-itumo/',
          ha: '/ha/harshe-da-fassara/'
        },
        '/education/': {
          en: '/education/',
          fr: '/fr/education/',
          sw: '/sw/elimu/',
          yo: '/yo/eko/',
          ha: '/ha/ilimi/'
        },
        '/fr/education/': {
          en: '/education/',
          fr: '/fr/education/',
          sw: '/sw/elimu/',
          yo: '/yo/eko/',
          ha: '/ha/ilimi/'
        },
        '/sw/elimu/': {
          en: '/education/',
          fr: '/fr/education/',
          sw: '/sw/elimu/',
          yo: '/yo/eko/',
          ha: '/ha/ilimi/'
        },
        '/ha/ilimi/': {
          en: '/education/',
          fr: '/fr/education/',
          sw: '/sw/elimu/',
          yo: '/yo/eko/',
          ha: '/ha/ilimi/'
        },
        '/yo/eko/': {
          en: '/education/',
          fr: '/fr/education/',
          sw: '/sw/elimu/',
          yo: '/yo/eko/',
          ha: '/ha/ilimi/'
        },
        '/telecom/': {
          en: '/telecom/',
          fr: '/fr/telecom/',
          sw: '/sw/mawasiliano-na-mtandao/',
          yo: '/yo/ibaraenisoro/',
          ha: '/ha/sadarwa/'
        },
        '/fr/telecom/': {
          en: '/telecom/',
          fr: '/fr/telecom/',
          sw: '/sw/mawasiliano-na-mtandao/',
          yo: '/yo/ibaraenisoro/',
          ha: '/ha/sadarwa/'
        },
        '/sw/mawasiliano-na-mtandao/': {
          en: '/telecom/',
          fr: '/fr/telecom/',
          sw: '/sw/mawasiliano-na-mtandao/',
          yo: '/yo/ibaraenisoro/',
          ha: '/ha/sadarwa/'
        },
        '/ha/sadarwa/': {
          en: '/telecom/',
          fr: '/fr/telecom/',
          sw: '/sw/mawasiliano-na-mtandao/',
          yo: '/yo/ibaraenisoro/',
          ha: '/ha/sadarwa/'
        },
        '/yo/ibaraenisoro/': {
          en: '/telecom/',
          fr: '/fr/telecom/',
          sw: '/sw/mawasiliano-na-mtandao/',
          yo: '/yo/ibaraenisoro/',
          ha: '/ha/sadarwa/'
        },
        '/health/': {
          en: '/health/',
          fr: '/fr/health/',
          sw: '/sw/afya/',
          yo: '/yo/ilera/',
          ha: '/ha/lafiya/'
        },
        '/fr/health/': {
          en: '/health/',
          fr: '/fr/health/',
          sw: '/sw/afya/',
          yo: '/yo/ilera/',
          ha: '/ha/lafiya/'
        },
        '/sw/afya/': {
          en: '/health/',
          fr: '/fr/health/',
          sw: '/sw/afya/',
          yo: '/yo/ilera/',
          ha: '/ha/lafiya/'
        },
        '/ha/lafiya/': {
          en: '/health/',
          fr: '/fr/health/',
          sw: '/sw/afya/',
          yo: '/yo/ilera/',
          ha: '/ha/lafiya/'
        },
        '/yo/ilera/': {
          en: '/health/',
          fr: '/fr/health/',
          sw: '/sw/afya/',
          yo: '/yo/ilera/',
          ha: '/ha/lafiya/'
        }
      };
      if (routeMap[key] && routeMap[key][targetLang]) return routeMap[key][targetLang];
      var yoEnglishRouteMap = {
        '/yo/naijiria/owo-ori-owo-osu/': '/nigeria/ng-salary-tax.html',
        '/yo/awon-ise/kalkuletan-vat/': '/tools/vat-calculator/',
        '/yo/awon-ise/kiriiro-invoice/': '/tools/invoice-generator/',
        '/yo/awon-ise/kiriiro-risiti/': '/tools/receipt-generator/',
        '/yo/awon-ise/naira-si-oro/': '/tools/naira-to-words/',
        '/yo/awon-ise/whatsapp-link/': '/tools/whatsapp-link/',
        '/yo/awon-ise/kalkuletan-jamb/': '/tools/jamb-aggregate/',
        '/yo/awon-ise/kalkuletan-waec-neco/': '/tools/waec-calculator/',
        '/yo/awon-ise/alawus-na-nysc/': '/tools/nysc-allowance/',
        '/yo/awon-ise/lambobin-ussd/': '/telecom/ussd-directory/',
        '/yo/awon-ise/rajista-sim-nin/': '/telecom/sim-registration/',
        '/yo/awon-ise/amulo-data/': '/telecom/data-usage-calc/',
        '/yo/awon-ise/duba-genotype/': '/tools/genotype-checker/',
        '/yo/awon-ise/sickle-cell/': '/tools/sickle-cell/',
        '/yo/awon-ise/kalkuletan-bmi/': '/tools/bmi-calculator/',
        '/yo/awon-ise/owo-ile-iwosan/': '/tools/hospital-cost/',
        '/yo/awon-ise/ere-ogbin/': '/agriculture/farm-profit/nigeria.html',
        '/yo/awon-ise/eso-irugbin/': '/agriculture/crop-yield/nigeria.html',
        '/yo/awon-ise/sise-rogo/': '/agriculture/cassava-processing/nigeria.html',
        '/yo/awon-ise/iwon-ajile/': '/agriculture/fertilizer/nigeria.html',
        '/yo/awon-ise/isuna-ogbin/': '/agriculture/farm-budget/',
        '/yo/awon-ise/agbon-oja/': '/tools/staple-basket/',
        '/yo/awon-ise/owo-oja-ogbin/': '/agriculture/commodity-prices/',
        '/yo/awon-ise/ounje-eranko/': '/agriculture/livestock-feed/nigeria.html',
        '/yo/awon-ise/ere-oko-eja/': '/agriculture/fish-farming/nigeria.html',
        '/yo/awon-ise/olufassara-yoruba/': '/tools/yoruba-translator/',
        '/yo/awon-ise/wurin-pdf/': '/tools/pdf-workspace/',
        '/yo/awon-ise/hada-ati-pin-pdf/': '/tools/pdf-merge-split/',
        '/yo/awon-ise/din-iwon-pdf/': '/tools/pdf-compress/',
        '/yo/awon-ise/tunto-pdf/': '/tools/pdf-reorder/',
        '/yo/awon-ise/tin-naijiria/': '/tools/tin-guide/',
        '/yo/awon-ise/cit-naijiria/': '/tools/ng-cit/',
        '/yo/awon-ise/wht-naijiria/': '/tools/ng-wht/',
        '/yo/awon-ise/forukosile-owo-ise/': '/tools/business-registration/'
      };
      if (currentLang === 'yo' && key.indexOf('/yo/') === 0) {
        if (targetLang === 'yo') return key;
        if (targetLang === 'en' && yoEnglishRouteMap[key]) return yoEnglishRouteMap[key];
        if (targetLang === 'fr') return '/fr/';
        if (targetLang === 'sw') return '/sw/';
        if (targetLang === 'ha') return '/ha/';
      }
      if (targetLang === 'yo') {
        for (var yoPath in yoEnglishRouteMap) {
          if (Object.prototype.hasOwnProperty.call(yoEnglishRouteMap, yoPath) && yoEnglishRouteMap[yoPath] === key) return yoPath;
        }
      }
      if (targetLang === 'yo') return '/yo/';
      var p = path;
      if (currentLang !== 'en') p = p.replace(new RegExp('^/' + currentLang + '(/|$)'), '/');
      return targetLang !== 'en' ? '/' + targetLang + (p.startsWith('/') ? '' : '/') + p : p;
    }

    _langSwitcherHTML() {
      var cur = this._getLang();
      var LANGS = [
        { code: 'en', label: 'English' },
        { code: 'fr', label: 'Français' },
        { code: 'sw', label: 'Kiswahili' },
        { code: 'yo', label: 'Yorùbá' },
        { code: 'ha', label: 'Hausa' },
      ];
      var curObj = LANGS.find(function(l){ return l.code === cur; }) || LANGS[0];
      var opts = LANGS.map(function(l) {
        var active = l.code === cur ? ' active' : '';
        var check = l.code === cur ? '✓' : '';
        var href = this._languageHrefFor(l.code, cur);
        return '<a href="' + href + '" class="lang-opt' + active + '"><span class="lang-opt-check">' + check + '</span>' + l.label + '</a>';
      }, this).join('');
      var switchLabel = cur === 'fr' ? 'Changer de langue' : cur === 'sw' ? 'Badili lugha' : cur === 'yo' ? 'Yí èdè padà' : cur === 'ha' ? 'Canja harshe' : 'Change language';
      return '<div class="lang-switch"><button class="lang-btn" id="langBtn" type="button" aria-label="' + switchLabel + '">🌐 <span class="lang-btn-label">' + curObj.label + '</span></button><div class="lang-drop" id="langDrop">' + opts + '</div></div>';
    }

    _navItems() {
      var lang = this._getLang();
      return (lang === 'fr' || lang === 'sw' || lang === 'yo' || lang === 'ha') ? NAV_ITEMS.filter(c => c.id !== 'francophone') : NAV_ITEMS;
    }

    _localizedHref(item, lang) {
      if (!item) return '#';
      var cur = lang || this._getLang();
      if (cur === 'fr' && item.hrefFr) return item.hrefFr;
      if (cur === 'sw') return SW_CATEGORY_HREFS[item.id] || item.hrefSw || item.href || '#';
      if (cur === 'ha') return HA_CATEGORY_HREFS[item.id] || item.hrefHa || item.href || '#';
      if (cur === 'yo') return YO_CATEGORY_HREFS[item.id] || item.hrefYo || item.href || '#';
      return item.href || '#';
    }

    _megaContent() {
      var lang = this._getLang();
      var isFr = lang === 'fr';
      var isSw = lang === 'sw';
      var featured = TOOL_MENU_IDS.map(id => this._navItems().find(c => c.id === id)).filter(Boolean);
      var html = featured.map(cat => {
        var href = this._localizedHref(cat, lang);
        var label = localizedItemText(cat, 'label', lang);
        var desc = localizedItemText(cat, 'desc', lang);
        return `
        <a href="${href}" class="mega-col" data-cat="${cat.id}" style="--col-accent:${cat.accent}">
          <div class="mega-col-icon" style="background:${cat.color}">${cat.icon}</div>
          <div>
            <div class="mega-col-name">${label}</div>
            <div class="mega-col-desc">${desc}</div>
          </div>
        </a>`;
      }).join('');
      return html;
    }

    _countriesHref() {
      var lang = this._getLang();
      if (lang === 'fr') return '/fr/countries/';
      if (lang === 'sw') return '/sw/nchi/';
      if (lang === 'yo') return '/yo/naijiria/';
      if (lang === 'ha') return '/countries/';
      return '/countries/';
    }

    _countriesContent() {
      var lang = this._getLang();
      var isFr = lang === 'fr';
      var isSw = lang === 'sw';
      var isYo = lang === 'yo';
      var isHa = lang === 'ha';
      var searchLabel = isSw ? 'Tafuta nchi' : isFr ? 'Rechercher un pays' : isYo ? 'Wá orílẹ̀-èdè' : isHa ? 'Nemi kasa' : 'Country search';
      var searchPlaceholder = isSw ? 'Tafuta Nigeria, Kenya...' : isFr ? 'Rechercher Nigeria, Kenya...' : isYo ? 'Wá Naijiria, Ghana, Kenya...' : isHa ? 'Nemi Najeriya, Ghana, Kenya...' : 'Search Nigeria, Kenya, Ghana...';
      var itemDesc = isSw ? 'Zana za nchi' : isFr ? 'Outils par pays' : isYo ? 'Ojú ìwé Gẹẹsi fún báyìí' : isHa ? 'Kayan aiki na kasa' : 'Country tools and tax pages';
      var countryLinks = localizedCountryLinks(lang);
      var html = `
        <div class="country-search-panel">
          <div>
            <label class="country-search-label" for="countrySearchInput">${searchLabel}</label>
            <div class="country-search-box">
              <input id="countrySearchInput" class="country-search-input" type="search" placeholder="${searchPlaceholder}" autocomplete="off" aria-label="${searchLabel}">
            </div>
          </div>
          <div class="country-search-results" id="countrySearchResults" role="listbox" aria-label="${searchLabel}"></div>
        </div>`;
      html += countryLinks.map(country => `
        <a href="${country.href || this._countryHref(country.label)}" class="mega-col" style="--col-accent:#0062CC">
          <div class="mega-col-icon" style="background:#EEF4FF">${country.label.charAt(0)}</div>
          <div>
            <div class="mega-col-name">${country.label}</div>
            <div class="mega-col-desc">${itemDesc}</div>
          </div>
        </a>`).join('');
      var allLabel = isSw ? 'Nchi zote 54 ->' : isFr ? 'Les 54 pays ->' : isYo ? 'Orílẹ̀-èdè 54 - ojú ìwé Gẹẹsi ->' : isHa ? 'Kasashe 54 - shafi na Turanci ->' : 'All 54 countries ->';
      var allDesc = isSw ? 'Chagua nchi yako' : isFr ? 'Choisissez votre pays' : isYo ? 'Yan orílẹ̀-èdè rẹ ní Gẹẹsi' : isHa ? 'Zabi kasa daga shafin Turanci' : 'Choose your country';
      html += `
        <a href="${this._countriesHref()}" class="mega-col" style="--col-accent:#0062CC">
          <div class="mega-col-icon" style="background:#EEF4FF">54</div>
          <div>
            <div class="mega-col-name">${allLabel}</div>
            <div class="mega-col-desc">${allDesc}</div>
          </div>
        </a>`;
      return html;
    }

    _businessContent() {
      var lang = this._getLang();
      return localizedBusinessLinks(lang).map(item => `
        <a href="${item.href}" class="mega-col business-col" style="--col-accent:#0062CC">
          <div class="mega-col-icon" style="background:#EEF4FF">${item.icon}</div>
          <div>
            <div class="mega-col-name">${item.label}</div>
            <div class="mega-col-desc">${item.desc}</div>
          </div>
        </a>`).join('');
    }

    _mobileBusinessContent() {
      var lang = this._getLang();
      return localizedBusinessLinks(lang).map(item => `
        <a href="${item.href}" class="mob-cat">
          <div class="mob-cat-icon" style="background:#EEF4FF;color:#0062CC;font-size:0.75rem;font-weight:800">${item.icon}</div>
          <div>
            <div class="mob-cat-label">${item.label}</div>
            <div class="mob-cat-desc">${item.desc}</div>
          </div>
          <span class="mob-arr">›</span>
        </a>`).join('');
    }

    _mobileContent() {
      var lang = this._getLang();
      var isFr = lang === 'fr';
      var isSw = lang === 'sw';
      var isYo = lang === 'yo';
      var isHa = lang === 'ha';
      var featured = TOOL_MENU_IDS.map(id => this._navItems().find(c => c.id === id)).filter(Boolean);
      var html = featured.map(cat => {
        var href = this._localizedHref(cat, lang);
        var label = localizedItemText(cat, 'label', lang);
        var desc = localizedItemText(cat, 'desc', lang);
        return `
        <a href="${href}" class="mob-cat">
          <div class="mob-cat-icon" style="background:${cat.color}">${cat.icon}</div>
          <div>
            <div class="mob-cat-label">${label}</div>
            <div class="mob-cat-desc">${desc}</div>
          </div>
          <span class="mob-arr">›</span>
        </a>`;
      }).join('');
      var allLabel = isSw ? 'Makundi Yote →' : isFr ? 'Toutes les catégories →' : isYo ? 'Gbogbo ẹ̀ka - ojú ìwé Gẹẹsi ->' : isHa ? 'Dukkan rukuni →' : 'All 28 Categories →';
      var allDesc = isSw ? 'Tazama makundi yote' : isFr ? 'Voir toutes les catégories' : isYo ? 'Wo gbogbo ẹ̀ka ní Gẹẹsi' : isHa ? 'Duba kowane rukuni na kayan aiki' : 'Browse every tool category';
      var allHref = isFr ? '/fr/categories/' : '/categories/';
      allLabel = isSw ? 'Zana zote za Kiswahili ->' : isFr ? 'Tous les outils ->' : isYo ? 'Gbogbo irinṣẹ - ojú ìwé Gẹẹsi ->' : isHa ? 'Duk kayan aikin Hausa ->' : 'All Tools ->';
      allDesc = isSw ? 'PAYE, PDF, VAT, nchi na makundi yote' : isFr ? 'Rechercher et filtrer tous les outils' : isYo ? 'PAYE, PDF, VAT, JAMB, WAEC àti orílẹ̀-èdè' : isHa ? 'PAYE, PDF, VAT, JAMB, WAEC da kasashe' : 'Search and filter every tool';
      allHref = isSw ? '/sw/zana-zote/' : isFr ? '/fr/all-tools/' : isHa ? '/ha/kayan-aiki/' : '/all-tools/';
      html += `
        <a href="${allHref}" class="mob-cat" style="border-top:2px solid #e5e7eb;margin-top:4px">
          <div class="mob-cat-icon" style="background:#EEF4FF">🧭</div>
          <div>
            <div class="mob-cat-label" style="color:#0062CC">${allLabel}</div>
            <div class="mob-cat-desc">${allDesc}</div>
          </div>
          <span class="mob-arr">›</span>
        </a>`;
      return html;
    }

    _mobileCountriesContent() {
      var lang = this._getLang();
      var html = localizedCountryLinks(lang).slice(0, 6).map(country => {
        return '<a href="' + (country.href || this._countryHref(country.label)) + '" class="mob-country-link">' + country.label + '</a>';
      }).join('');
      var allLabel = lang === 'sw' ? 'Nchi zote' : lang === 'fr' ? 'Tous les pays' : lang === 'yo' ? 'Gbogbo orílẹ̀-èdè - ojú ìwé Gẹẹsi' : lang === 'ha' ? 'Duk kasashe - shafi na Turanci' : 'All countries';
      html += '<a href="' + this._countriesHref() + '" class="mob-country-link">' + allLabel + '</a>';
      return html;
    }

    _countryHref(name) {
      var lang = this._getLang();
      var overrides = {
        'Cabo Verde': 'cape-verde',
        'Central African Republic': lang === 'sw' ? 'central-african-republic' : 'central-africa',
        'Côte d\'Ivoire': 'cote-divoire',
        'DR Congo': lang === 'en' ? 'drc' : 'dr-congo',
        'Republic of the Congo': 'congo',
        'Congo': 'congo',
        'São Tomé and Príncipe': 'sao-tome',
        'São Tomé & Príncipe': 'sao-tome',
      };
      var slug = overrides[name] || String(name || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/&/g, ' and ')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      if (lang === 'ha' && slug === 'nigeria') return '/ha/najeriya/';
      if (lang === 'yo' && slug === 'nigeria') return '/yo/naijiria/';
      var prefix = lang === 'fr' ? '/fr' : lang === 'sw' ? '/sw' : '';
      return slug ? prefix + '/' + slug + '/' : this._countriesHref();
    }

    _countrySearchItems(countries) {
      var lang = this._getLang();
      var source = Array.isArray(countries) && countries.length
        ? (lang === 'ha' || lang === 'yo' ? localizedCountryLinks(lang).concat(countries) : countries)
        : localizedCountryLinks(lang).map(function(country) {
          return { name: country.label, href: country.href, currency: country.currency || '' };
        });
      return source.map(country => {
        var name = country.name || country.label || '';
        return {
          label: name,
          href: country.href || this._countryHref(name),
          meta: country.currency || '',
        };
      });
    }

    _loadCountryData() {
      return new Promise(resolve => {
        if (Array.isArray(window.AFRICAN_COUNTRIES)) {
          resolve(window.AFRICAN_COUNTRIES);
          return;
        }
        var src = '/assets/js/data/african-countries.js';
        var existing = document.querySelector('script[src="' + src + '"], script[src$="/assets/js/data/african-countries.js"]');
        var finish = () => resolve(Array.isArray(window.AFRICAN_COUNTRIES) ? window.AFRICAN_COUNTRIES : []);
        if (existing) {
          existing.addEventListener('load', finish, { once: true });
          existing.addEventListener('error', () => resolve([]), { once: true });
          setTimeout(finish, 500);
          return;
        }
        var script = document.createElement('script');
        script.src = src;
        script.onload = finish;
        script.onerror = () => resolve([]);
        document.head.appendChild(script);
      });
    }

    _mobileLangHTML() {
      var cur = this._getLang();
      var LANGS = [
        { code: 'en', label: 'English', flag: '🇬🇧' },
        { code: 'fr', label: 'Français', flag: '🇫🇷' },
        { code: 'sw', label: 'Kiswahili', flag: '🇰🇪' },
        { code: 'yo', label: 'Yorùbá', flag: '🇳🇬' },
        { code: 'ha', label: 'Hausa', flag: '🇳🇬' },
      ];
      var opts = LANGS.map(function(l) {
        var active = l.code === cur ? ' active' : '';
        var href = this._languageHrefFor(l.code, cur);
        return '<a href="' + href + '" class="mob-lang-opt' + active + '">' + l.flag + ' ' + l.label + '</a>';
      }, this).join('');
      var langLabel = cur === 'fr' ? 'Langue' : cur === 'sw' ? 'Lugha' : cur === 'yo' ? 'Èdè' : cur === 'ha' ? 'Harshe' : 'Language';
      return '<div class="mob-lang-section"><div class="mob-section-label">' + langLabel + '</div><div class="mob-lang-row">' + opts + '</div></div>';
    }

    _escapeHtml(value) {
      return String(value == null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    _cleanDisplayName(value, fallback) {
      const cleaned = String(value || '')
        .replace(/<[^>]*>/g, ' ')
        .replace(/[<>]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      return cleaned || fallback || 'Dashboard';
    }

    _render() {
      var lang = this._getLang();
      var isFr = lang === 'fr';
      var isSw = lang === 'sw';
      var T = {
        homeHref:     isSw ? '/sw/'                         : isFr ? '/fr/'                                             : '/',
        tag:          isSw ? 'Zana za Afrika kwa Kiswahili'             : isFr ? 'La plateforme africaine'                          : "Africa's Everything Platform",
        allTools:     isSw ? 'Zana zote'                    : isFr ? 'Tous les outils'                                  : 'All Tools',
        tools:        isSw ? 'Zana'                         : isFr ? 'Outils'                                           : 'Tools',
        countries:    isSw ? 'Nchi'                         : isFr ? 'Pays'                                             : 'Countries',
        countriesHref:isSw ? '/sw/nchi/'                    : isFr ? '/fr/countries/'                                  : '/countries/',
        business:     isSw ? 'Kwa Biashara'                     : isFr ? 'Business'                                         : 'For business',
        businessNote: isSw ? 'API, zana maalum, VAT, ushirikiano na mawasiliano ya biashara' : isFr ? 'Widgets, API, sponsoring, calculateurs sur mesure' : 'Widgets, API, sponsorships, custom calculators, and media inventory',
        businessBrowse:isSw ? 'Wasiliana na timu ->'         : isFr ? 'Ouvrir le media kit ->'                           : 'Open media kit ->',
        businessBrowseHref:isSw ? '/sw/wasiliana/' : '/media-kit/',
        resources:    isSw ? 'Miongozo'                   : isFr ? 'Ressources'                                       : 'Resources',
        resourcesHref:isSw ? '/sw/blogu/'                         : isFr ? '/fr/blog/'                                        : '/blog/',
        search:       isSw ? 'Tafuta'                       : isFr ? 'Recherche'                                        : 'Search',
        startByCountry:isSw ? 'Anza kwa nchi'               : isFr ? 'Commencer par pays'                               : 'Start by country',
        countrySearchPh:isSw ? 'Tafuta nchi...'             : isFr ? 'Rechercher un pays...'                            : 'Search countries...',
        salaryTax:    isSw ? 'Mshahara na PAYE'          : isFr ? 'Salaire &amp; Impôts'                             : 'Salary &amp; Tax',
        salaryHref:   isSw ? '/sw/mshahara-na-kodi/'        : isFr ? '/fr/salary-tax/'                                  : '/salary-tax/',
        pdfTools:     isSw ? 'PDF na Nyaraka'                  : isFr ? 'Outils PDF'                                       : 'PDF Tools',
        pdfHref:      isSw ? '/sw/hati-na-pdf/'             : isFr ? '/fr/document-pdf/'                                : '/document-pdf/',
        devTools:     isSw ? 'Wasanidi'                   : isFr ? 'Outils Dev'                                       : 'Dev Tools',
        devHref:      isSw ? '/sw/zana-za-developer/'       : isFr ? '/fr/developer-tools/'                             : '/developer-tools/',
        african:      isSw ? 'Nchi na Zana za Afrika'                     : isFr ? 'Africain'                                         : 'African',
        africanHref:  isSw ? '/sw/nchi/'                    : isFr ? '/fr/african/'                                     : '/african/',
        education:    isSw ? 'Elimu'                        : isFr ? 'Éducation'                                        : 'Education',
        educationHref:isSw ? '/sw/elimu/'                   : isFr ? '/fr/education/'                                   : '/education/',
        insurance:    isSw ? 'Bima'                         : isFr ? 'Santé &amp; Assurance'                            : 'Insurance',
        insuranceHref:isSw ? '/sw/bima/'                    : isFr ? '/fr/health-insurance/'                            : '/insurance/',
        countries54:  isSw ? '🌍 Nchi 54'                   : isFr ? '🌍 54 pays'                                       : '🌍 54 countries',
        signIn:       isSw ? 'Ingia'                        : isFr ? 'Connexion'                                        : 'Sign in',
        ariaNav:      isSw ? 'Urambazaji mkuu'              : isFr ? 'Navigation principale'                            : 'Main navigation',
        ariaMenu:     isSw ? 'Menyu ya urambazaji'          : isFr ? 'Menu de navigation'                               : 'Navigation menu',
        ariaSearch:   isSw ? 'Tafuta zana'                  : isFr ? 'Rechercher des outils'                            : 'Search tools',
        megaNote:     isSw ? '🌍 Nchi 54 za Afrika · bure · bila usajili'       : isFr ? '🌍 54 pays africains · gratuit · sans inscription': '🌍 54 African countries · free forever · no sign-up required',
        browseAll:    isSw ? 'Tazama zana zote →'           : isFr ? 'Voir tous les outils →'                           : 'Browse all tools →',
        browseHref:   isSw ? '/sw/zana-zote/'               : isFr ? '/fr/all-tools/'                                   : '/all-tools/',
        allCats:      isSw ? 'Makundi yote'                 : isFr ? 'Toutes les catégories'                            : 'All Categories',
        searchPh:     isSw ? 'Tafuta PAYE, PDF, VAT, WAEC...'               : isFr ? 'Rechercher des outils...'                         : 'Search tools...',
        mobSignIn:    isSw ? 'Ingia'                        : isFr ? 'Connexion'                                        : 'Sign In',
        proHref:      isFr ? '/fr/pro/'                     : '/pro/',
        proLabel:     isSw ? 'Pro'                          : isFr ? 'Pro'                                              : 'Pro',
        proUpgrade:   isSw ? 'Pata Pro'                     : isFr ? 'Passer Pro'                                       : 'Upgrade Pro',
        proWorkspace: isSw ? 'Eneo la Pro'                  : isFr ? 'Espace Pro'                                       : 'Pro Workspace',
        dashboardHref:isFr ? '/fr/dashboard/'               : '/dashboard/',
        authHref:     (isFr ? '/fr/auth/' : '/auth/') + '?mode=login&next=' + encodeURIComponent(isFr ? '/fr/dashboard/' : '/dashboard/'),
        vaultHref:    isFr ? '/fr/dashboard/vault/'         : '/dashboard/vault/',
        mobNote:      isSw ? '🌍 Nchi 54 · bure · bila usajili'                 : isFr ? '🌍 54 pays · gratuit · sans inscription'          : '🌍 54 countries · always free · no sign-up required',
        srchEmpty:    isSw ? 'Tafuta zana za Kiswahili na Afrika'          : isFr ? '2 594+ outils africains'                            : 'Search 2,594+ African tools',
        srchHint:     isSw ? 'Jaribu "PAYE", "PDF", "kodi", "BMI"…'            : isFr ? 'Essayez "PAYE", "salaire", "TVA"…'               : 'Try "PAYE", "PDF", "japa", "BMI"…',
        countriesFooterNote: isSw ? 'Nchi 54 za Afrika' : '54 African countries',
        viewAll:      isSw ? 'Tazama zote'                    : 'View all',
        loadingTools: isSw ? 'Inapakia zana…'                 : 'Loading tools…',
        registryWait: isSw ? 'Orodha ya zana bado inapakia'  : 'Tool registry not loaded yet',
        recentlyUsed: isSw ? 'Zilizotumika hivi karibuni'      : 'Recently Used',
        clearRecent:  isSw ? 'Futa'                           : 'Clear',
        vaultLabel:   isSw ? 'Hifadhi yangu'                   : 'My Vault',
        allToolsLabel:isSw ? 'Zana zote'                      : 'All Tools',
        typeToSearch: isSw ? 'Andika PAYE, PDF, VAT, WAEC au jina la nchi' : 'Type to search 2,594+ tools',
        noToolsFound: isSw ? 'Hakuna zana iliyopatikana'       : 'No tools found',
        differentSearch: isSw ? 'Jaribu neno jingine'          : 'Try a different search term',
        themeLabel:   isSw ? 'Mandhari' : isFr ? 'Theme' : 'Theme',
        themeLight:   isSw ? 'Mwanga' : isFr ? 'Clair' : 'Light',
        themeDark:    isSw ? 'Giza' : isFr ? 'Sombre' : 'Dark',
        themeToLight: isSw ? 'Badili kwenda mwanga' : isFr ? 'Passer en mode clair' : 'Switch to light mode',
        themeToDark:  isSw ? 'Badili kwenda giza' : isFr ? 'Passer en mode sombre' : 'Switch to dark mode',
      };
      var T_BY_LANG = {
        yo: {
          homeHref: '/yo/',
          tag: 'Pẹpẹ irinṣẹ Afirika',
          allTools: 'Gbogbo irinṣẹ',
          tools: 'Irinṣẹ',
          countries: 'Naijiria',
          countriesHref: '/yo/naijiria/',
          business: 'Fún iṣẹ́',
          businessNote: 'Ojú ìwé Gẹẹsi: widgets, API, sponsorships, calculators àkànṣe àti media kit',
          businessBrowse: 'Ṣí media kit - ojú ìwé Gẹẹsi ->',
          businessBrowseHref: '/media-kit/',
          resources: 'Ìmọ̀ràn - ojú ìwé Gẹẹsi',
          resourcesHref: '/blog/',
          search: 'Wa',
          startByCountry: 'Bẹ̀rẹ̀ pẹ̀lú orílẹ̀-èdè',
          countrySearchPh: 'Wá orílẹ̀-èdè...',
          salaryTax: 'Owó oṣù ati owó-orí',
          salaryHref: '/yo/owo-osu-ati-owo-ori/',
          pdfTools: 'PDF ati iwe',
          pdfHref: '/yo/iwe-ati-pdf/',
          education: 'Ẹ̀kọ́',
          educationHref: '/yo/eko/',
          signIn: 'Wọlé - Gẹẹsi',
          ariaNav: 'Ìrìnàjò àkọ́kọ́',
          ariaMenu: 'Menyu ìrìnàjò',
          ariaSearch: 'Wa irinṣẹ',
          megaNote: 'Orílẹ̀-èdè Afirika 54 · ọfẹ · kò sí ìforúkọsílẹ̀',
          browseAll: 'Wo gbogbo irinṣẹ ->',
          browseHref: '/yo/awon-ise/',
          allCats: 'Gbogbo Ẹ̀ka',
          searchPh: 'Wa irinṣẹ...',
          mobSignIn: 'Wọlé - Gẹẹsi',
          proLabel: 'Pro',
          proUpgrade: 'Ṣí Pro - Gẹẹsi',
          proWorkspace: 'Pro Workspace - Gẹẹsi',
          mobNote: 'Orílẹ̀-èdè 54 · ọfẹ · kò sí ìforúkọsílẹ̀',
          srchEmpty: 'Wa irinṣẹ Afirika 2,594+',
          srchHint: 'Gbìyànjú "PAYE", "PDF", "owó-orí"...',
          countriesFooterNote: 'Orílẹ̀-èdè 54 ti Afirika',
          viewAll: 'Wo gbogbo rẹ̀',
          loadingTools: 'Ó ń kojú irinṣẹ...',
          registryWait: 'Àtòjọ irinṣẹ kò tíì parí kíkójú',
          recentlyUsed: 'Èyí tí a lo laipẹ',
          clearRecent: 'Pa rẹ́',
          vaultLabel: 'Vault mi',
          allToolsLabel: 'Irinṣẹ Yorùbá',
          typeToSearch: 'Tẹ PAYE, PDF, VAT, JAMB, WAEC tàbí Naijiria',
          noToolsFound: 'A kò rí irinṣẹ kankan',
          differentSearch: 'Gbìyànjú ọ̀rọ̀ míràn tàbí orúkọ orílẹ̀-èdè',
          themeLabel: 'Àwọ̀n ojú',
          themeLight: 'Ìmọ́lẹ̀',
          themeDark: 'Òkùnkùn',
          themeToLight: 'Yí padà sí ìmọ́lẹ̀',
          themeToDark: 'Yí padà sí òkùnkùn'
        },
        ha: {
          homeHref: '/ha/',
          tag: 'Dandalin kayan aikin Afirka',
          allTools: 'Dukkan kayan aiki',
          tools: 'Kayan aiki',
          countries: 'Kasashe',
          countriesHref: '/countries/',
          business: 'Na kasuwanci',
          businessNote: 'Kayan sakawa, API, tallafi, kalkuleta na musamman da kunshin yada labarai',
          businessBrowse: 'Bude media kit ->',
          businessBrowseHref: '/media-kit/',
          resources: 'Albarkatu',
          resourcesHref: '/blog/',
          search: 'Bincike',
          startByCountry: 'Fara da kasa',
          countrySearchPh: 'Nemi kasa...',
          salaryTax: 'Albashi da PAYE',
          salaryHref: '/ha/albashi-da-haraji/',
          pdfTools: 'PDF da Takardu',
          pdfHref: '/ha/takardu-da-pdf/',
          devTools: 'Developer',
          devHref: '/developer-tools/',
          african: 'Kasashe da kayan Afirka',
          africanHref: '/countries/',
          education: 'Ilimi',
          educationHref: '/ha/ilimi/',
          insurance: 'Insurance',
          insuranceHref: '/insurance/',
          signIn: 'Shiga',
          ariaNav: 'Babban kewayawa',
          ariaMenu: 'Menu na kewayawa',
          ariaSearch: 'Bincika kayan aiki',
          megaNote: 'Kasashen Afirka 54 · kyauta · babu rajista',
          browseAll: 'Duba duk kayan aiki ->',
          browseHref: '/ha/kayan-aiki/',
          allCats: 'Dukkan Rukuni',
          searchPh: 'Bincika PAYE, PDF, VAT, JAMB, WAEC...',
          mobSignIn: 'Shiga',
          proLabel: 'Pro',
          proUpgrade: 'Samu Pro',
          proWorkspace: 'Wurin Pro',
          mobNote: 'Kasashe 54 · kyauta · babu rajista',
          srchEmpty: 'Bincika kayan aikin Hausa da Afirka',
          srchHint: 'Gwada "PAYE", "JAMB", "WAEC", "PDF"...',
          countriesFooterNote: 'Kasashe 54 na Afirka - shafi na Turanci',
          viewAll: 'Duba duka',
          loadingTools: 'Ana loda kayan aiki...',
          registryWait: 'Jerin kayan aiki bai gama lodi ba',
          recentlyUsed: 'An yi amfani da su kwanan nan',
          clearRecent: 'Goge',
          vaultLabel: 'Vault dina',
          allToolsLabel: 'Kayan aikin Hausa',
          typeToSearch: 'Rubuta PAYE, PDF, VAT, JAMB, WAEC ko Nigeria',
          noToolsFound: 'Ba a sami kayan aiki ba',
          differentSearch: 'Gwada wata kalma ko sunan kasa',
          themeLabel: 'Jigo',
          themeLight: 'Haske',
          themeDark: 'Duhu',
          themeToLight: 'Canza zuwa haske',
          themeToDark: 'Canza zuwa duhu'
        }
      };
      if (T_BY_LANG[lang]) Object.assign(T, T_BY_LANG[lang]);

      this.shadowRoot.innerHTML = `
        <style>${CSS}</style>
        <nav role="navigation" aria-label="${T.ariaNav}">
          <div class="inner">
            <a href="${T.homeHref}" class="logo" aria-label="AfroTools home">
              ${MARK}
              <div>
                <span class="logo-name">AFRO<b>TOOLS</b></span>
                <span class="logo-tag">${T.tag}</span>
              </div>
            </a>

            <ul class="nav-links">
              <li>
                <button class="lnk" id="allBtn" type="button" aria-haspopup="true" aria-expanded="false">
                  ${T.tools}
                  <svg class="chev" viewBox="0 0 7 4" fill="none">
                    <polyline points="0.5,0.5 3.5,3.5 6.5,0.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
              </li>
              <li>
                <button class="lnk" id="countriesBtn" type="button" aria-haspopup="true" aria-expanded="false">
                  ${T.countries}
                  <svg class="chev" viewBox="0 0 7 4" fill="none">
                    <polyline points="0.5,0.5 3.5,3.5 6.5,0.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
              </li>
              <li><a href="${T.salaryHref}" class="lnk">${T.salaryTax}</a></li>
              <li><a href="${T.pdfHref}" class="lnk">${T.pdfTools || 'PDF'}</a></li>
              <li>
                <button class="lnk" id="businessBtn" type="button" aria-haspopup="true" aria-expanded="false">
                  ${T.business}
                  <svg class="chev" viewBox="0 0 7 4" fill="none">
                    <polyline points="0.5,0.5 3.5,3.5 6.5,0.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
              </li>
              <li><a href="${T.resourcesHref}" class="lnk">${T.resources}</a></li>
            </ul>

            <div class="right">
              <div class="country-control-shell">
                <afro-country-selector variant="nav" redirect="country" label="${isSw ? 'Badili nchi' : isFr ? 'Changer de pays' : lang === 'ha' ? 'Canja kasa' : 'Change country'}" ${isSw ? 'search-placeholder="Tafuta nchi 54 za Afrika" search-label="Tafuta nchi" currency-label="sarafu" diaspora-prefix="Ninaishi nje ya nchi lakini nasimamia fedha nchini " empty-message="Hakuna nchi iliyopatikana. Jaribu Nigeria, Kenya, Ghana au Afrika Kusini."' : ''}></afro-country-selector>
              </div>
              ${this._langSwitcherHTML()}
              <button class="theme-toggle" id="themeToggle" type="button" aria-label="${T.themeToDark}" title="${T.themeToDark}" aria-pressed="false" data-to-dark="${T.themeToDark}" data-to-light="${T.themeToLight}" data-state-dark="${T.themeDark}" data-state-light="${T.themeLight}">
                <svg class="theme-icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5 7.5 7.5 0 1 0 20.5 14.5Z"/>
                </svg>
                <svg class="theme-icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.57 4.57l1.41 1.41M18.02 18.02l1.41 1.41M2.5 12h2M19.5 12h2M4.57 19.43l1.41-1.41M18.02 5.98l1.41-1.41"/>
                </svg>
              </button>
              <button class="search-btn cp-trigger" id="searchBtn" type="button" aria-label="${T.ariaSearch}">
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="8.5" cy="8.5" r="5.5"/><line x1="13" y1="13" x2="18" y2="18"/>
                </svg>
                <span class="search-btn-label">${T.search}</span>
                <span class="search-kbd cp-trigger-kbd">Ctrl K</span>
              </button>
              <a href="${T.proHref}" class="btn-pro" data-pro-nav="true">${T.proLabel}</a>
              <a href="${T.authHref}" class="btn-login">${T.signIn}</a>
              <button class="burger" type="button" aria-label="${isSw ? 'Fungua menyu' : isFr ? 'Ouvrir le menu' : lang === 'ha' ? 'Bude menu' : 'Open menu'}" aria-expanded="false">
                <span></span><span></span><span></span>
              </button>
            </div>
          </div>
        </nav>

        <div class="mega" id="mega" role="menu" aria-label="${T.allTools}">
          <div class="mega-inner tools-mega-grid">
            ${this._megaContent()}
          </div>
          <div class="mega-footer">
            <span class="mega-footer-note">${T.megaNote}</span>
            <a href="${T.browseHref}" class="mega-footer-lnk">${T.browseAll}</a>
          </div>
        </div>

        <div class="mega" id="countriesMega" role="menu" aria-label="${T.countries}">
          <div class="mega-inner">
            ${this._countriesContent()}
          </div>
          <div class="mega-footer">
            <span class="mega-footer-note">${T.countries} - ${T.countriesFooterNote}</span>
            <a href="${T.countriesHref}" class="mega-footer-lnk">${T.viewAll}</a>
          </div>
        </div>

        <div class="mega" id="businessMega" role="menu" aria-label="${T.business}">
          <div class="mega-inner business-mega-grid">
            ${this._businessContent()}
          </div>
          <div class="mega-footer">
            <span class="mega-footer-note">${T.businessNote}</span>
            <a href="${T.businessBrowseHref}" class="mega-footer-lnk">${T.businessBrowse}</a>
          </div>
        </div>

        <div class="mob" role="dialog" aria-modal="true" aria-label="${T.ariaMenu}">
          <div class="mob-search-bar">
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="8.5" cy="8.5" r="5.5"/><line x1="13" y1="13" x2="18" y2="18"/>
            </svg>
            <input class="mob-search-input" type="text" placeholder="${T.searchPh}" aria-label="${T.ariaSearch}" autocomplete="off"/>
          </div>
            <div class="mob-search-results" id="mobSearchResults" role="listbox" aria-label="${isSw ? 'Matokeo ya utafutaji' : lang === 'ha' ? 'Sakamakon bincike' : 'Search results'}"></div>
          <div class="mob-theme-section">
            <button class="mob-theme-toggle" id="mobThemeToggle" type="button" aria-label="${T.themeToDark}" aria-pressed="false" data-to-dark="${T.themeToDark}" data-to-light="${T.themeToLight}" data-state-dark="${T.themeDark}" data-state-light="${T.themeLight}">
              <span class="mob-theme-copy">
                <svg class="theme-icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5 7.5 7.5 0 1 0 20.5 14.5Z"/>
                </svg>
                <svg class="theme-icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.57 4.57l1.41 1.41M18.02 18.02l1.41 1.41M2.5 12h2M19.5 12h2M4.57 19.43l1.41-1.41M18.02 5.98l1.41-1.41"/>
                </svg>
                <span>${T.themeLabel}</span>
              </span>
              <span class="mob-theme-state">${T.themeLight}</span>
            </button>
          </div>
          <div class="mob-country-block">
            <div class="mob-section-label">${T.startByCountry}</div>
            <div class="mob-country-search">
              <input id="mobileCountrySearchInput" class="mob-country-search-input" type="search" placeholder="${T.countrySearchPh}" autocomplete="off" aria-label="${T.startByCountry}">
            </div>
            <div class="mob-country-results" id="mobileCountrySearchResults" role="listbox" aria-label="${T.startByCountry}"></div>
            <div class="mob-country-grid">${this._mobileCountriesContent()}</div>
          </div>
          <div class="mob-business-block">
            <div class="mob-section-label">${T.business}</div>
            ${this._mobileBusinessContent()}
          </div>
          <div id="mobCategoriesWrap">
            <div class="mob-section-label">${T.allCats}</div>
            ${this._mobileContent()}
          </div>
          ${this._mobileLangHTML()}
          <div class="mob-country-context">
            <afro-country-selector variant="mobile" redirect="country" diaspora label="${T.startByCountry}" ${isSw ? 'search-placeholder="Tafuta nchi 54 za Afrika" search-label="Tafuta nchi" currency-label="sarafu" diaspora-prefix="Ninaishi nje ya nchi lakini nasimamia fedha nchini " empty-message="Hakuna nchi iliyopatikana. Jaribu Nigeria, Kenya, Ghana au Afrika Kusini."' : ''}></afro-country-selector>
          </div>
          <div class="mob-footer">
            <a href="${T.proHref}" class="mob-pro-link" data-pro-nav="mobile">${T.proLabel}</a>
            <a href="${T.authHref}" class="mob-login">${T.mobSignIn}</a>
            <a href="${T.vaultHref}" class="mob-vault-link" style="display:none;padding:10px 13px;border-radius:8px;font-size:0.85rem;font-weight:600;text-decoration:none;color:#0062CC;border:1.5px solid #0062CC;text-align:center;">📁 ${T.vaultLabel}</a>
            <a href="/tools/afropoints/" class="mob-points-link" style="display:none;padding:10px 13px;border-radius:8px;font-size:0.85rem;font-weight:600;text-decoration:none;color:#F59E0B;border:1.5px solid rgba(245,158,11,0.3);background:rgba(245,158,11,0.06);text-align:center;">🎯 AfroPoints</a>
            <p class="mob-note">${T.mobNote}</p>
          </div>
        </div>

`;
    }

    _bind() {
      const sr     = this.shadowRoot;
      const nav    = sr.querySelector('nav');
      const allBtn = sr.querySelector('#allBtn');
      const mega   = sr.querySelector('#mega');
      const countriesBtn = sr.querySelector('#countriesBtn');
      const countriesMega = sr.querySelector('#countriesMega');
      const businessBtn = sr.querySelector('#businessBtn');
      const businessMega = sr.querySelector('#businessMega');
      const searchBtn = sr.querySelector('#searchBtn');
      const themeBtn = sr.querySelector('#themeToggle');
      const mobThemeBtn = sr.querySelector('#mobThemeToggle');
      const burger = sr.querySelector('.burger');
      const mob    = sr.querySelector('.mob');

      const syncThemeControls = () => {
        const isDark = effectiveTheme() === 'dark';
        this.classList.toggle('theme-dark', isDark);
        syncCountrySelectorThemes(isDark ? 'dark' : 'light');
        [themeBtn, mobThemeBtn].forEach(btn => {
          if (!btn) return;
          const label = isDark ? btn.dataset.toLight : btn.dataset.toDark;
          btn.setAttribute('aria-label', label || (isDark ? 'Switch to light mode' : 'Switch to dark mode'));
          btn.setAttribute('title', label || '');
          btn.setAttribute('aria-pressed', isDark ? 'true' : 'false');
          const state = btn.querySelector('.mob-theme-state');
          if (state) state.textContent = isDark ? (btn.dataset.stateDark || 'Dark') : (btn.dataset.stateLight || 'Light');
        });
      };
      const toggleTheme = () => {
        const next = effectiveTheme() === 'dark' ? 'light' : 'dark';
        writeThemePreference(next);
        applyThemePreference(next);
        syncThemeControls();
      };
      themeBtn?.addEventListener('click', toggleTheme);
      mobThemeBtn?.addEventListener('click', toggleTheme);
      if (this._themeChangeFn) document.removeEventListener('afrotools:theme-change', this._themeChangeFn);
      this._themeChangeFn = syncThemeControls;
      document.addEventListener('afrotools:theme-change', this._themeChangeFn);
      syncThemeControls();

      // Scroll shadow
      if (this._scrollFn) window.removeEventListener('scroll', this._scrollFn);
      this._scrollFn = () => nav.classList.toggle('scrolled', window.scrollY > 4);
      window.addEventListener('scroll', this._scrollFn, { passive: true });
      this._scrollFn();

      const openMega  = () => {
        this._megaOpen = true;
        closeCountries();
        closeBusiness();
        allBtn?.classList.add('open');
        mega?.classList.add('open');
        allBtn?.setAttribute('aria-expanded','true');
      };
      const closeMega = () => {
        this._megaOpen = false;
        allBtn?.classList.remove('open');
        mega?.classList.remove('open');
        allBtn?.setAttribute('aria-expanded','false');
      };
      const openCountries = () => {
        this._countriesOpen = true;
        closeMega();
        closeBusiness();
        countriesBtn?.classList.add('open');
        countriesMega?.classList.add('open');
        countriesBtn?.setAttribute('aria-expanded','true');
      };
      const closeCountries = () => {
        this._countriesOpen = false;
        countriesBtn?.classList.remove('open');
        countriesMega?.classList.remove('open');
        countriesBtn?.setAttribute('aria-expanded','false');
      };
      const openBusiness = () => {
        this._businessOpen = true;
        closeMega();
        closeCountries();
        businessBtn?.classList.add('open');
        businessMega?.classList.add('open');
        businessBtn?.setAttribute('aria-expanded','true');
      };
      const closeBusiness = () => {
        this._businessOpen = false;
        businessBtn?.classList.remove('open');
        businessMega?.classList.remove('open');
        businessBtn?.setAttribute('aria-expanded','false');
      };
      const closeMenus = () => { closeMega(); closeCountries(); closeBusiness(); };
      const resetMobileSearch = () => {
        const mobSearchInput = sr.querySelector('.mob-search-input');
        const mobSearchResults = sr.querySelector('#mobSearchResults');
        const mobCategoriesWrap = sr.querySelector('#mobCategoriesWrap');
        const mobCountryBlock = sr.querySelector('.mob-country-block');
        const mobBusinessBlock = sr.querySelector('.mob-business-block');
        const mobileCountrySearchInput = sr.querySelector('#mobileCountrySearchInput');
        const mobileCountrySearchResults = sr.querySelector('#mobileCountrySearchResults');
        if (mobSearchInput) mobSearchInput.value = '';
        if (mobSearchResults) mobSearchResults.innerHTML = '';
        if (mobCategoriesWrap) mobCategoriesWrap.style.display = '';
        if (mobCountryBlock) mobCountryBlock.style.display = '';
        if (mobBusinessBlock) mobBusinessBlock.style.display = '';
        if (mobileCountrySearchInput) mobileCountrySearchInput.value = '';
        if (mobileCountrySearchResults) mobileCountrySearchResults.innerHTML = '';
      };
      const setMenuOpen = (isOpen) => {
        this._menuOpen = isOpen;
        burger?.classList.toggle('open', this._menuOpen);
        mob?.classList.toggle('open', this._menuOpen);
        burger?.setAttribute('aria-expanded', String(this._menuOpen));
        if (this._menuOpen) {
          closeMenus();
          this._lockBodyScroll();
          return;
        }
        this._unlockBodyScroll();
        resetMobileSearch();
      };

      // Click toggle
      allBtn?.addEventListener('click', e => { e.stopPropagation(); this._megaOpen ? closeMega() : openMega(); });
      countriesBtn?.addEventListener('click', e => { e.stopPropagation(); this._countriesOpen ? closeCountries() : openCountries(); });
      businessBtn?.addEventListener('click', e => { e.stopPropagation(); this._businessOpen ? closeBusiness() : openBusiness(); });
      searchBtn?.addEventListener('click', e => {
        e.preventDefault();
        if (typeof window.__openCommandPalette === 'function') {
          window.__openCommandPalette();
          return;
        }
        window.location.href = this._getLang() === 'sw' ? '/sw/zana-zote/' : '/search/';
      });

      // Hover — keep open while moving between button and mega
      let hoverTimer;
      const navEl = allBtn?.closest('li');
      navEl?.addEventListener('mouseenter', () => { clearTimeout(hoverTimer); openMega(); });
      navEl?.addEventListener('mouseleave', () => { hoverTimer = setTimeout(closeMega, 200); });
      mega?.addEventListener('mouseenter', () => clearTimeout(hoverTimer));
      mega?.addEventListener('mouseleave', () => { hoverTimer = setTimeout(closeMega, 200); });

      let countriesHoverTimer;
      const countriesNavEl = countriesBtn?.closest('li');
      countriesNavEl?.addEventListener('mouseenter', () => { clearTimeout(countriesHoverTimer); openCountries(); });
      countriesNavEl?.addEventListener('mouseleave', () => { countriesHoverTimer = setTimeout(closeCountries, 200); });
      countriesMega?.addEventListener('mouseenter', () => clearTimeout(countriesHoverTimer));
      countriesMega?.addEventListener('mouseleave', () => { countriesHoverTimer = setTimeout(closeCountries, 200); });

      let businessHoverTimer;
      const businessNavEl = businessBtn?.closest('li');
      businessNavEl?.addEventListener('mouseenter', () => { clearTimeout(businessHoverTimer); openBusiness(); });
      businessNavEl?.addEventListener('mouseleave', () => { businessHoverTimer = setTimeout(closeBusiness, 200); });
      businessMega?.addEventListener('mouseenter', () => clearTimeout(businessHoverTimer));
      businessMega?.addEventListener('mouseleave', () => { businessHoverTimer = setTimeout(closeBusiness, 200); });

      // Tool sub-panels: disabled — category cards navigate directly to their pages

      // Click outside
      if (this._outsideFn) document.removeEventListener('click', this._outsideFn);
      this._outsideFn = e => { if (!this.contains(e.target)) closeMenus(); };
      document.addEventListener('click', this._outsideFn);

      // Language switcher toggle
      const langBtn = sr.querySelector('#langBtn');
      const langDrop = sr.querySelector('#langDrop');
      langBtn?.addEventListener('click', e => {
        e.stopPropagation();
        langDrop.classList.toggle('open');
      });
      document.addEventListener('click', () => langDrop?.classList.remove('open'));

      // Escape
      document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
          closeMenus();
          langDrop?.classList.remove('open');
          if (this._menuOpen) setMenuOpen(false);
        }
      });

      // Mobile hamburger
      burger?.addEventListener('click', () => {
        setMenuOpen(!this._menuOpen);
      });

      mob?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
        setMenuOpen(false);
      }));

      // ── ACTIVE PAGE INDICATOR ──
      const path = window.location.pathname;
      sr.querySelectorAll('.nav-links .lnk[href]').forEach(link => {
        const href = link.getAttribute('href');
        if (href && href !== '/' && path.startsWith(href)) {
          link.classList.add('active');
        }
      });
      const activePath = path.replace(/^\/(fr|sw)(?=\/)/, '');
      if (/^\/(countries|nchi|nigeria|kenya|ghana|south-africa|egypt|tanzania|rwanda|senegal)(\/|$)/.test(activePath)) {
        countriesBtn?.classList.add('active');
      }
      if (/^\/(all-tools|zana-zote|categories|tools|zana)(\/|$)/.test(activePath)) {
        allBtn?.classList.add('active');
      }
      if (/^\/(widgets|api|sponsored-tools|custom-calculators|media-kit|business-enquiry)(\/|$)/.test(activePath)) {
        businessBtn?.classList.add('active');
      }

      // ── RECENTLY USED TOOLS (localStorage) ──
      const RECENT_KEY = 'aft_recent_tools';
      const MAX_RECENT = 5;

      const getRecent = () => {
        try {
          return JSON.parse(localStorage.getItem(RECENT_KEY)) || [];
        } catch { return []; }
      };

      const saveRecent = (tool) => {
        try {
          let recent = getRecent().filter(t => t.href !== tool.href);
          recent.unshift(tool);
          if (recent.length > MAX_RECENT) recent = recent.slice(0, MAX_RECENT);
          localStorage.setItem(RECENT_KEY, JSON.stringify(recent));
        } catch {}
      };

      // Track page visit as recently used
      if (typeof AFRO_TOOLS !== 'undefined' && Array.isArray(AFRO_TOOLS)) {
        const currentTool = AFRO_TOOLS.find(t => t.status === 'live' && path.startsWith(t.href));
        if (currentTool) {
          saveRecent({ name: currentTool.name, href: currentTool.href, icon: currentTool.icon || '🔧' });
        }
      }

      // ── SEARCH (desktop handled by command-palette.js) ──
      const mobSearchInput   = sr.querySelector('.mob-search-input');
      const mobSearchResults = sr.querySelector('#mobSearchResults');
      const mobCategoriesWrap = sr.querySelector('#mobCategoriesWrap');
      const mobCountryBlock = sr.querySelector('.mob-country-block');
      const mobBusinessBlock = sr.querySelector('.mob-business-block');
      const countrySearchInput = sr.querySelector('#countrySearchInput');
      const countrySearchResults = sr.querySelector('#countrySearchResults');
      const mobileCountrySearchInput = sr.querySelector('#mobileCountrySearchInput');
      const mobileCountrySearchResults = sr.querySelector('#mobileCountrySearchResults');

      let _activeIdx = -1;

      // Swahili discovery fallback: current pages may load an older minified registry,
      // so map English source rows to verified /sw/ pages until the registry bundle is refreshed.
      const SW_DISCOVERY_OVERRIDES = {
        "afcfta-tracker": { name: "Ufuatiliaji wa Ushuru wa AfCFTA", desc: "Pima akiba ya ushuru inayoweza kutokea chini ya AfCFTA kwa corridor ya biashara, bila kudai eligibility rasmi.", href: "/sw/zana/ufuatiliaji-ushuru-afcfta/", category: "ecommerce", lang: 'sw' },
        "ajo-chama-calc": { name: "Kikokotoo cha Ajo, Chama na Tontine", desc: "Panga mzunguko wa Ajo, Chama, Tontine au Stokvel: wanachama, mchango, pool, malipo na adhabu.", href: "/sw/zana/kikokotoo-ajo-chama-tontine/", category: "ecommerce", lang: 'sw' },
        "annual-returns": { name: "Marejesho ya mwaka ya kampuni", desc: "Orodha ya marejesho ya mwaka ya kampuni za Afrika: nyaraka, msajili, hatari za kuchelewa kuwasilisha na maandalizi ya kukabidhi kwa katibu wa kampuni au mhasibu.", href: "/sw/zana/marejesho-ya-mwaka-ya-kampuni/", category: "ecommerce", lang: 'sw' },
        "ao-paye": { name: "Kikokotoo cha Kodi ya Mshahara Angola 2026", desc: "Kikokotoo cha PAYE kwa Angola 2026. Viwango vya AGT 0%–25%, INSS 3%. Hesabu mshahara wako halisi kwa Kwanza ya Angola (AOA). Bila malipo.", href: "/sw/angola/kikokotoo-kodi-mshahara/", category: "financial", lang: 'sw' },
        "ao-vat": { name: "Kikokotoo cha VAT Angola 14%", desc: "Kokotoa VAT, kodi ya ongezeko la thamani, kwa Angola: ongeza VAT, toa VAT kutoka bei iliyojumuisha kodi, na panga ankara kwa AOA.", href: "/sw/angola/kikokotoo-vat/", category: "ecommerce", lang: 'sw' },
        "bf-paye": { name: "Kikokotoo cha Kodi ya Mshahara Burkina Faso 2026 — DGI IUTS", desc: "Kokotoa mshahara wako halisi baada ya kodi ya DGI IUTS Burkina Faso, CNSS 5.5%. Mabanda ya kodi 0%–31%. Bure, haraka.", href: "/sw/burkina-faso/kikokotoo-kodi-mshahara/", category: "financial", lang: 'sw' },
        "bf-vat": { name: "Kikokotoo cha VAT Burkina Faso 18%", desc: "Kokotoa VAT, kodi ya ongezeko la thamani, kwa Burkina Faso: ongeza VAT, toa VAT kutoka bei iliyojumuisha kodi, na panga ankara kwa XOF.", href: "/sw/burkina-faso/kikokotoo-vat/", category: "ecommerce", lang: 'sw' },
        "bi-vat": { name: "Kikokotoo cha VAT Burundi 18%", desc: "Kokotoa VAT, kodi ya ongezeko la thamani, kwa Burundi: ongeza VAT, toa VAT kutoka bei iliyojumuisha kodi, na panga ankara kwa BIF.", href: "/sw/burundi/kikokotoo-vat/", category: "ecommerce", lang: 'sw' },
        "biogas-roi": { name: "Faida ya Biogas", desc: "Kadiria ROI ya biogas kwa waste, gesi, mbolea na gharama za mfumo.", href: "/sw/zana/faida-ya-biogas/", category: "ecommerce", lang: 'sw' },
        "bj-paye": { name: "Kikokotoo cha Kodi ya Mshahara Benin 2026 — DGI PAYE", desc: "Kokotoa mshahara wako halisi baada ya kodi ya DGI Benin, CNPS 2.5%. Mabanda ya kodi 0%–25%. Bure, haraka.", href: "/sw/benin/kikokotoo-kodi-mshahara/", category: "financial", lang: 'sw' },
        "bj-vat": { name: "Kikokotoo cha VAT Benin 18%", desc: "Kokotoa VAT, kodi ya ongezeko la thamani, kwa Benin: ongeza VAT, toa VAT kutoka bei iliyojumuisha kodi, na panga ankara kwa XOF.", href: "/sw/benin/kikokotoo-vat/", category: "ecommerce", lang: 'sw' },
        "break-even": { name: "Kikokotoo cha Break-even | Kiwango cha Kufikia Faida", desc: "Kokotoa break-even, vitengo vinavyohitajika, mapato, contribution margin na margin ya usalama kwa biashara yako.", href: "/sw/zana/kikokotoo-break-even/", category: "ecommerce", lang: 'sw' },
        "business-insurance": { name: "Bima ya Biashara Afrika | Makadirio ya SME", desc: "Panga bima ya biashara kwa SME: moto, wizi, public liability, professional indemnity na goods in transit kwa nchi 15 zinazoungwa mkono.", href: "/sw/zana/kikokotoo-bima-ya-biashara/", category: "ecommerce", lang: 'sw' },
        "business-license": { name: "Leseni ya Biashara Afrika | Vibali na Mamlaka kwa Sekta", desc: "Kagua leseni na vibali vya biashara kwa sekta kama retail, food, construction, healthcare, finance, education, transport na agriculture.", href: "/sw/zana/leseni-ya-biashara/", category: "ecommerce", lang: 'sw' },
        "business-plan": { name: "Mjenzi wa Mpango wa Biashara", desc: "Andaa muhtasari wa mpango wa biashara kwa Kiswahili: wateja, mapato, gharama, operesheni, hatari na hatua zinazofuata.", href: "/sw/zana/mjenzi-mpango-wa-biashara/", category: "ecommerce", lang: 'sw' },
        "business-planner": { name: "Mpangaji wa Biashara AI", desc: "Panga hatua za biashara, mawazo ya mapato na orodha ya utekelezaji kwa mtindo wa AI kwa Kiswahili.", href: "/sw/zana/mpangaji-wa-biashara-ai/", category: "ecommerce", lang: 'sw' },
        "business-registration": { name: "Usajili wa Biashara Afrika | Mwongozo wa Kiswahili", desc: "Angalia mamlaka ya usajili, aina za kampuni, gharama, muda na hatua baada ya usajili wa biashara katika nchi za Afrika.", href: "/sw/zana/usajili-biashara/", category: "ecommerce", lang: 'sw' },
        "bw-paye": { name: "Kikokotoo cha Kodi ya Mshahara Botswana 2025/26", desc: "Kikokotoo cha PAYE kwa Botswana 2025/26. Viwango vya BURS 0%–25%. Hakuna pensheni ya lazima. Hesabu mshahara wako halisi kwa Pula (BWP). Bila malipo.", href: "/sw/botswana/kikokotoo-kodi-mshahara/", category: "financial", lang: 'sw' },
        "bw-vat": { name: "Kikokotoo cha VAT Botswana 14%", desc: "Kokotoa VAT, kodi ya ongezeko la thamani, kwa Botswana: ongeza VAT, toa VAT kutoka bei iliyojumuisha kodi, na panga ankara kwa BWP.", href: "/sw/botswana/kikokotoo-vat/", category: "ecommerce", lang: 'sw' },
        "cassava-processing-calculator": { name: "Faida ya Usindikaji Mihogo | Cassava Processing", desc: "Kadiria faida ya kusindika cassava kuwa garri, unga, chips, starch au bidhaa nyingine.", href: "/sw/zana/faida-ya-usindikaji-mihogo/", category: "ecommerce", lang: 'sw' },
        "cd-paye": { name: "Kikokotoo cha Kodi ya Mshahara Jamhuri ya Kidemokrasia ya Kongo 2026 — PAYE CDF", desc: "Kokotoa mshahara wako halisi baada ya kodi ya mapato na INSS Jamhuri ya Kidemokrasia ya Kongo. CDF. Bure, haraka.", href: "/sw/dr-congo/kikokotoo-kodi-mshahara/", category: "financial", lang: 'sw' },
        "cd-vat": { name: "Kikokotoo cha VAT DR Congo 16%", desc: "Kokotoa VAT, kodi ya ongezeko la thamani, kwa DR Congo: ongeza VAT, toa VAT kutoka bei iliyojumuisha kodi, na panga ankara kwa CDF.", href: "/sw/dr-congo/kikokotoo-vat/", category: "ecommerce", lang: 'sw' },
        "cf-paye": { name: "Kikokotoo cha Kodi ya Mshahara CAR 2026 — PAYE XAF", desc: "Kokotoa mshahara wako halisi baada ya kodi ya mapato na OCSS Jamhuri ya Afrika ya Kati. XAF. Bure, haraka.", href: "/sw/central-african-republic/kikokotoo-kodi-mshahara/", category: "financial", lang: 'sw' },
        "cf-vat": { name: "Kikokotoo cha VAT Jamhuri ya Afrika ya Kati 19%", desc: "Kokotoa VAT, kodi ya ongezeko la thamani, kwa Jamhuri ya Afrika ya Kati: ongeza VAT, toa VAT kutoka bei iliyojumuisha kodi, na panga ankara kwa XAF.", href: "/sw/central-african-republic/kikokotoo-vat/", category: "ecommerce", lang: 'sw' },
        "cg-paye": { name: "Kikokotoo cha Kodi ya Mshahara Jamhuri ya Kongo 2026 — PAYE XAF", desc: "Kokotoa mshahara wako halisi baada ya kodi ya mapato na CNSS Jamhuri ya Kongo. XAF. Bure, haraka.", href: "/sw/congo/kikokotoo-kodi-mshahara/", category: "financial", lang: 'sw' },
        "cg-vat": { name: "Kikokotoo cha VAT Kongo 18.9%", desc: "Kokotoa VAT, kodi ya ongezeko la thamani, kwa Kongo: ongeza VAT, toa VAT kutoka bei iliyojumuisha kodi, na panga ankara kwa XAF.", href: "/sw/congo/kikokotoo-vat/", category: "ecommerce", lang: 'sw' },
        "ci-paye": { name: "Kikokotoo cha Kodi ya Mshahara Pwani ya Pembe 2026 — DGI PAYE", desc: "Kokotoa mshahara wako halisi baada ya kodi ya DGI Côte d'Ivoire, CNPS 6.3%. Mabanda ya kodi 0%–25%. Bure, haraka, bila kujisajili.", href: "/sw/cote-divoire/kikokotoo-kodi-mshahara/", category: "financial", lang: 'sw' },
        "ci-vat": { name: "Kikokotoo cha VAT Pwani ya Pembe 18%", desc: "Kokotoa VAT, kodi ya ongezeko la thamani, kwa Pwani ya Pembe: ongeza VAT, toa VAT kutoka bei iliyojumuisha kodi, na panga ankara kwa XOF.", href: "/sw/cote-divoire/kikokotoo-vat/", category: "ecommerce", lang: 'sw' },
        "cm-paye": { name: "Kikokotoo cha Kodi ya Mshahara Kameruni 2026 — DGI PAYE", desc: "Kokotoa mshahara wako halisi baada ya kodi ya DGI Kameruni, CNPS 4.2%. Mabanda ya kodi 10%–35%. Bure, haraka, bila kujisajili.", href: "/sw/cameroon/kikokotoo-kodi-mshahara/", category: "financial", lang: 'sw' },
        "cm-vat": { name: "Kikokotoo cha VAT Kameruni 19.25%", desc: "Kokotoa VAT, kodi ya ongezeko la thamani, kwa Kameruni: ongeza VAT, toa VAT kutoka bei iliyojumuisha kodi, na panga ankara kwa XAF.", href: "/sw/cameroon/kikokotoo-vat/", category: "ecommerce", lang: 'sw' },
        "company-type-selector": { name: "Kichagua aina ya kampuni Afrika", desc: "Jibu maswali 6 kuchagua sole proprietor, private company, public company, partnership, NGO, branch au subsidiary kwa biashara ya Afrika.", href: "/sw/zana/kichagua-aina-ya-kampuni/", category: "ecommerce", lang: 'sw' },
        "cover-letter": { name: "Kizalishaji cha Barua ya Ombi la Kazi — Kiswahili & Kiingereza", desc: "Tengeneza barua ya ombi la kazi kwa Kiswahili au Kiingereza. Violezo vya kitaalamu kwa sekta za teknolojia, fedha, afya, elimu, na zaidi. Pakua PDF bure bila usajili.", href: "/sw/zana/barua-ombi/", category: "document-pdf", lang: 'sw' },
        "creator-invoice": { name: "Ankara ya Mtayarishi", desc: "Andaa makadirio ya ankara ya mtayarishi kwa line items, VAT ya hiari, discount, total na ujumbe wa malipo.", href: "/sw/zana/ankara-ya-mtayarishi/", category: "document-pdf", lang: 'sw' },
        "crop-insurance-calc": { name: "Kikokotoo cha Bima ya Mazao Afrika", desc: "Chagua nchi na pima makadirio ya bima ya mazao kwa shamba, aina ya zao, eneo na hatari za msimu kwa nchi 15.", href: "/sw/zana/kikokotoo-bima-ya-mazao/", category: "agriculture", lang: 'sw' },
        "crop-yield-burundi": { name: "Kikokotoo cha Mavuno ya Mazao Burundi - AfroTools", desc: "Kadiria mavuno ya mazao yako kwa Burundi. Mahindi, muhogo, maharage, kahawa, viazi na mazao mengine katika kanda zote za kilimo.", href: "/sw/kilimo/mavuno/burundi/", category: "agriculture", lang: 'sw' },
        "crop-yield-estimator": { name: "Makisio ya Mavuno ya Mazao Afrika", desc: "Kadiria mavuno ya mazao kwa eneo, yield kwa hekta, hasara baada ya mavuno na bei ya kuuza.", href: "/sw/zana/makisio-ya-mavuno/", category: "agriculture", lang: 'sw' },
        "crop-yield-kenya": { name: "Kikokotoo cha Mavuno ya Mazao Kenya - AfroTools", desc: "Kadiria mavuno ya mazao yako kwa Kenya. Mahindi, mpunga, ngano, maharage na mazao mengine katika kanda zote za kilimo.", href: "/sw/kilimo/mavuno/kenya/", category: "agriculture", lang: 'sw' },
        "crop-yield-rwanda": { name: "Kikokotoo cha Mavuno ya Mazao Rwanda - AfroTools", desc: "Kadiria mavuno ya mazao yako kwa Rwanda. Mahindi, viazi, maharage, kahawa, chai na mazao mengine katika kanda zote za kilimo.", href: "/sw/kilimo/mavuno/rwanda/", category: "agriculture", lang: 'sw' },
        "crop-yield-tanzania": { name: "Kikokotoo cha Mavuno ya Mazao Tanzania - AfroTools", desc: "Kadiria mavuno ya mazao yako kwa Tanzania. Mahindi, mpunga, ngano, maharage na mazao mengine katika kanda 6 za kilimo.", href: "/sw/kilimo/mavuno/tanzania/", category: "agriculture", lang: 'sw' },
        "crop-yield-uganda": { name: "Kikokotoo cha Mavuno ya Mazao Uganda - AfroTools", desc: "Kadiria mavuno ya mazao yako kwa Uganda. Mahindi, ndizi, kahawa, mpunga, maharage na mazao mengine katika kanda zote za kilimo.", href: "/sw/kilimo/mavuno/uganda/", category: "agriculture", lang: 'sw' },
        "cv-builder": { name: "Mjenzi wa CV | Violezo vya Kitaalamu kwa Afrika", desc: "Tengeneza CV yako ya kitaalamu kwa dakika chache. Violezo 16+ kwa nchi za Afrika: Nigeria, Kenya, Ghana, Afrika Kusini. Pakua PDF bure, bila usajili.", href: "/sw/zana/mjenzi-cv/", category: "document-pdf", lang: 'sw' },
        "cv-paye": { name: "Kikokotoo cha Kodi ya Mshahara Cabo Verde 2026 — INPS IUR", desc: "Kokotoa mshahara wako halisi baada ya kodi ya IUR, INPS Cabo Verde. Banda la kodi 0%–27.5%. Bure, haraka, bila kujisajili.", href: "/sw/cape-verde/kikokotoo-kodi-mshahara/", category: "financial", lang: 'sw' },
        "cv-vat": { name: "Kikokotoo cha VAT Cabo Verde 15%", desc: "Kokotoa VAT, kodi ya ongezeko la thamani, kwa Cabo Verde: ongeza VAT, toa VAT kutoka bei iliyojumuisha kodi, na panga ankara kwa CVE.", href: "/sw/cape-verde/kikokotoo-vat/", category: "ecommerce", lang: 'sw' },
        "diesel-vs-solar-farm": { name: "Dizeli dhidi ya Solar Shambani", desc: "Linganishia pampu au shughuli za shamba zinazotumia diesel dhidi ya solar kwa gharama na payback.", href: "/sw/zana/dizeli-dhidi-ya-solar-shambani/", category: "agriculture", lang: 'sw' },
        "dj-paye": { name: "Kikokotoo cha Kodi ya Mshahara Jibuti 2026 — PAYE DJF", desc: "Kokotoa kodi ya mshahara (IRPP) na Bima ya Jamii kwa Jibuti 2026. Mabanda ya kodi 6, sarafu DJF. Zana ya bure ya kuhesabu mshahara halisi.", href: "/sw/djibouti/kikokotoo-kodi-mshahara/", category: "financial", lang: 'sw' },
        "dj-vat": { name: "Kikokotoo cha VAT Djibouti 10%", desc: "Kokotoa VAT, kodi ya ongezeko la thamani, kwa Djibouti: ongeza VAT, toa VAT kutoka bei iliyojumuisha kodi, na panga ankara kwa DJF.", href: "/sw/djibouti/kikokotoo-vat/", category: "ecommerce", lang: 'sw' },
        "document-pdf": { name: "Hati na PDF - Zana za nyaraka kwa Kiswahili", desc: "Hati na PDF kwa Kiswahili: unganisha, gawanya, bana, saini, linda na panga PDF, kisha unganisha na ankara, CV, barua na mikataba.", href: "/sw/hati-na-pdf/", category: "document-pdf", lang: 'sw' },
        "domestic-worker": { name: "Mshahara wa Mfanyakazi wa Nyumbani", desc: "Panga mshahara, masaa, leave na benefits kwa mfanyakazi wa nyumbani kwa makadirio ya HR, si uamuzi wa kisheria.", href: "/sw/zana/mshahara-wa-mfanyakazi-wa-nyumbani/", category: "financial", lang: 'sw' },
        "dz-paye": { name: "Kikokotoo cha Kodi ya Mshahara Aljeria 2026 — DGI PAYE", desc: "Kokotoa mshahara wako halisi baada ya kodi ya DGI na CNAS Aljeria. Mabanda 0%–35%. Bure, haraka, bila kujisajili.", href: "/sw/algeria/kikokotoo-kodi-mshahara/", category: "financial", lang: 'sw' },
        "dz-vat": { name: "Kikokotoo cha VAT Algeria 19%", desc: "Kokotoa VAT, kodi ya ongezeko la thamani, kwa Algeria: ongeza VAT, toa VAT kutoka bei iliyojumuisha kodi, na panga ankara kwa DZD.", href: "/sw/algeria/kikokotoo-vat/", category: "ecommerce", lang: 'sw' },
        "eg-paye": { name: "Kikokotoo cha Kodi ya Mshahara Misri 2025 — ETA NOSI", desc: "Kikokotoo cha kodi ya mshahara Misri 2025. Viwango vya ETA (0%–27.5%), NOSI 11%, msamaha wa kibinafsi EGP 20,000. Pata mshahara halisi wako kwa EGP.", href: "/sw/egypt/kikokotoo-kodi-mshahara/", category: "financial", lang: 'sw' },
        "eg-vat": { name: "Kikokotoo cha VAT Misri 14%", desc: "Kokotoa VAT, kodi ya ongezeko la thamani, kwa Misri: ongeza VAT, toa VAT kutoka bei iliyojumuisha kodi, na panga ankara kwa EGP.", href: "/sw/egypt/kikokotoo-vat/", category: "ecommerce", lang: 'sw' },
        "er-paye": { name: "Kikokotoo cha Kodi ya Mshahara Eritrea 2026 — PAYE ERN", desc: "Kokotoa kodi ya mshahara na Bima ya Jamii kwa Eritrea 2026. Mabanda ya kodi 7, sarafu ERN. Zana ya bure ya kuhesabu mshahara halisi.", href: "/sw/eritrea/kikokotoo-kodi-mshahara/", category: "financial", lang: 'sw' },
        "et-paye": { name: "Kikokotoo cha Kodi ya Mshahara Ethiopia 2026 — ERCA", desc: "Kikokotoo cha kodi ya mshahara Ethiopia 2025/26. Viwango vya ERCA (0%–35%), Mfuko wa Pensheni 7%, mwajiri 11%. Pata mshahara halisi wako kwa ETB.", href: "/sw/ethiopia/kikokotoo-kodi-mshahara/", category: "financial", lang: 'sw' },
        "et-vat": { name: "Kikokotoo cha VAT Ethiopia 15%", desc: "Kokotoa VAT, kodi ya ongezeko la thamani, kwa Ethiopia: ongeza VAT, toa VAT kutoka bei iliyojumuisha kodi, na panga ankara kwa ETB.", href: "/sw/ethiopia/kikokotoo-vat/", category: "ecommerce", lang: 'sw' },
        "export-docs": { name: "Nyaraka za Usafirishaji Mazao Afrika", desc: "Orodha ya ukaguzi ya nyaraka za export, AfCFTA, HS code, vyeti, ankara na gharama za maandalizi ya kusafirisha mazao.", href: "/sw/zana/nyaraka-za-usafirishaji-mazao/", category: "agriculture", lang: 'sw' },
        "farm-loans-hub": { name: "Ustahiki wa Mkopo wa Shamba | Agro Loan", desc: "Kagua maandalizi ya mkopo wa shamba kwa mapato, gharama, deni, collateral na uwezo wa kulipa.", href: "/sw/zana/ustahiki-wa-mkopo-wa-shamba/", category: "agriculture", lang: 'sw' },
        "farm-payroll-calculator": { name: "Mishahara ya Wafanyakazi wa Shamba", desc: "Kadiria payroll ya wafanyakazi wa shamba, casual labour, deductions na michango ya mwajiri.", href: "/sw/zana/mishahara-ya-wafanyakazi-wa-shamba/", category: "agriculture", lang: 'sw' },
        "farm-profit-calculator": { name: "Faida na Hasara ya Shamba Afrika", desc: "Kokotoa mapato, gharama, break-even yield na ROI ya msimu wa shamba.", href: "/sw/zana/faida-na-hasara-ya-shamba/", category: "agriculture", lang: 'sw' },
        "fertilizer-burundi": { name: "Kikokotoo cha Mbolea Burundi - AfroTools", desc: "Hesabu mahitaji ya mbolea NPK kwa Burundi. Mapendekezo ya bidhaa za mbolea, bei za soko BIF, na ratiba ya matumizi kwa mazao yako.", href: "/sw/kilimo/mbolea/burundi/", category: "agriculture", lang: 'sw' },
        "fertilizer-calculator": { name: "Kikokotoo cha Mbolea na NPK Afrika", desc: "Kadiria mifuko ya mbolea, gharama na subsidy kwa kutumia mahitaji ya NPK au kg kwa hekta.", href: "/sw/zana/kikokotoo-mbolea/", category: "agriculture", lang: 'sw' },
        "fertilizer-kenya": { name: "Kikokotoo cha Mbolea Kenya - AfroTools", desc: "Hesabu mahitaji ya mbolea NPK kwa Kenya. Mapendekezo ya bidhaa za mbolea, bei za soko, na ratiba ya matumizi kwa mazao yako.", href: "/sw/kilimo/mbolea/kenya/", category: "agriculture", lang: 'sw' },
        "fertilizer-rwanda": { name: "Kikokotoo cha Mbolea Rwanda - AfroTools", desc: "Hesabu mahitaji ya mbolea NPK kwa Rwanda. Mapendekezo ya bidhaa za mbolea, bei za soko RWF, na ratiba ya matumizi kwa mazao yako.", href: "/sw/kilimo/mbolea/rwanda/", category: "agriculture", lang: 'sw' },
        "fertilizer-tanzania": { name: "Kikokotoo cha Mbolea Tanzania - AfroTools", desc: "Hesabu mahitaji ya mbolea NPK kwa Tanzania. Mapendekezo ya bidhaa za mbolea, bei za soko, na ratiba ya matumizi kwa mazao yako.", href: "/sw/kilimo/mbolea/tanzania/", category: "agriculture", lang: 'sw' },
        "fertilizer-uganda": { name: "Kikokotoo cha Mbolea Uganda - AfroTools", desc: "Hesabu mahitaji ya mbolea NPK kwa Uganda. Mapendekezo ya bidhaa za mbolea, bei za soko UGX, na ratiba ya matumizi.", href: "/sw/kilimo/mbolea/uganda/", category: "agriculture", lang: 'sw' },
        "fish-farming-roi": { name: "Faida ya Ufugaji Samaki Afrika", desc: "Kadiria mapato, feed cost, fingerlings, mortality na ROI ya catfish, tilapia au trout.", href: "/sw/zana/faida-ya-ufugaji-samaki/", category: "ecommerce", lang: 'sw' },
        "foreign-company-reg": { name: "Usajili wa kampuni ya kigeni Afrika", desc: "Mwongozo wa kupanga usajili wa kampuni ya kigeni: tawi, kampuni tanzu, ofisi ya uwakilishi, JV, mshirika wa ndani, sekta, vibali na ukaguzi wa msajili kwa nchi 16.", href: "/sw/zana/usajili-wa-kampuni-ya-kigeni/", category: "ecommerce", lang: 'sw' },
        "forex-profit": { name: "Kikokotoo cha Faida ya Forex | Pips, Thamani ya Pip na P&L", desc: "Kokotoa faida au hasara ya forex kwa Kiswahili. Pima pips, thamani ya pip, position size na P&L kwa jozi kuu na sarafu za Afrika.", href: "/sw/zana/kikokotoo-faida-forex/", category: "ecommerce", lang: 'sw' },
        "freelance-invoice": { name: "Ankara ya Freelancer", desc: "Tengeneza makadirio ya ankara ya freelancer kwa subtotal, VAT/kodi, discount, due date na payment note.", href: "/sw/zana/ankara-ya-freelancer/", category: "document-pdf", lang: 'sw' },
        "ga-paye": { name: "Kikokotoo cha Kodi ya Mshahara Gabon 2026 — PAYE XAF", desc: "Kokotoa mshahara wako halisi baada ya kodi ya mapato na CNSS Gabon. XAF. Bure, haraka, sahihi.", href: "/sw/gabon/kikokotoo-kodi-mshahara/", category: "financial", lang: 'sw' },
        "ga-vat": { name: "Kikokotoo cha VAT Gabon 18%", desc: "Kokotoa VAT, kodi ya ongezeko la thamani, kwa Gabon: ongeza VAT, toa VAT kutoka bei iliyojumuisha kodi, na panga ankara kwa XAF.", href: "/sw/gabon/kikokotoo-vat/", category: "ecommerce", lang: 'sw' },
        "gh-paye": { name: "Kikokotoo cha Kodi ya Mshahara Ghana 2026 — GRA SSNIT", desc: "Kikokotoo cha kodi ya mshahara Ghana 2026. Viwango vya GRA mabanda 7 (0%–35%), SSNIT Tier I/II/III, unafuu wa kibinafsi. Pata mshahara halisi wako kwa GHS.", href: "/sw/ghana/kikokotoo-kodi-mshahara/", category: "financial", lang: 'sw' },
        "gh-vat": { name: "Kikokotoo cha VAT Ghana 20%", desc: "Kokotoa VAT, kodi ya ongezeko la thamani, kwa Ghana: ongeza VAT, toa VAT kutoka bei iliyojumuisha kodi, na panga ankara kwa GHS.", href: "/sw/ghana/kikokotoo-vat/", category: "ecommerce", lang: 'sw' },
        "gm-paye": { name: "Kikokotoo cha Kodi ya Mshahara Gambia 2026 — GRA PAYE", desc: "Kokotoa mshahara wako halisi baada ya kodi ya GRA, SSHFC Gambia. Banda la kodi 0%–35%. Bure, haraka, bila kujisajili.", href: "/sw/gambia/kikokotoo-kodi-mshahara/", category: "financial", lang: 'sw' },
        "gm-vat": { name: "Kikokotoo cha VAT Gambia 15%", desc: "Kokotoa VAT, kodi ya ongezeko la thamani, kwa Gambia: ongeza VAT, toa VAT kutoka bei iliyojumuisha kodi, na panga ankara kwa GMD.", href: "/sw/gambia/kikokotoo-vat/", category: "ecommerce", lang: 'sw' },
        "gn-paye": { name: "Kikokotoo cha Kodi ya Mshahara Guinea 2026 — DNI PAYE", desc: "Kokotoa mshahara wako halisi baada ya kodi ya DNI Guinea, CNSS 5%. Mabanda ya kodi 0%–35%. Bure, haraka.", href: "/sw/guinea/kikokotoo-kodi-mshahara/", category: "financial", lang: 'sw' },
        "gn-vat": { name: "Kikokotoo cha VAT Guinea 18%", desc: "Kokotoa VAT, kodi ya ongezeko la thamani, kwa Guinea: ongeza VAT, toa VAT kutoka bei iliyojumuisha kodi, na panga ankara kwa GNF.", href: "/sw/guinea/kikokotoo-vat/", category: "ecommerce", lang: 'sw' },
        "gq-paye": { name: "Kikokotoo cha Kodi ya Mshahara Guinea ya Ikweta 2026 — PAYE XAF", desc: "Kokotoa mshahara wako halisi baada ya kodi ya mapato na INSESO Guinea ya Ikweta. XAF. Bure, haraka.", href: "/sw/equatorial-guinea/kikokotoo-kodi-mshahara/", category: "financial", lang: 'sw' },
        "gq-vat": { name: "Kikokotoo cha VAT Guinea ya Ikweta 15%", desc: "Kokotoa VAT, kodi ya ongezeko la thamani, kwa Guinea ya Ikweta: ongeza VAT, toa VAT kutoka bei iliyojumuisha kodi, na panga ankara kwa XAF.", href: "/sw/equatorial-guinea/kikokotoo-vat/", category: "ecommerce", lang: 'sw' },
        "gw-paye": { name: "Kikokotoo cha Kodi ya Mshahara Guinea-Bissau 2026 — DGCI PAYE", desc: "Kokotoa mshahara wako halisi baada ya kodi ya DGCI, INSS Guinea-Bissau. Banda la kodi 0%–30%. Bure, haraka, bila kujisajili.", href: "/sw/guinea-bissau/kikokotoo-kodi-mshahara/", category: "financial", lang: 'sw' },
        "gw-vat": { name: "Kikokotoo cha VAT Guinea-Bissau 17%", desc: "Kokotoa VAT, kodi ya ongezeko la thamani, kwa Guinea-Bissau: ongeza VAT, toa VAT kutoka bei iliyojumuisha kodi, na panga ankara kwa XOF.", href: "/sw/guinea-bissau/kikokotoo-vat/", category: "ecommerce", lang: 'sw' },
        "harvest-date-estimator": { name: "Makisio ya Tarehe ya Mavuno Afrika", desc: "Kadiria tarehe ya kuvuna kulingana na tarehe ya kupanda, muda wa kukomaa na ucheleweshaji wa msimu.", href: "/sw/zana/makisio-tarehe-ya-mavuno/", category: "agriculture", lang: 'sw' },
        "hosting-compare": { name: "Kulinganisha Hosting - gharama na fit kwa developers Afrika", desc: "Linganisha hosting options kwa source dates, payment fit, ops effort, pricing risk na deployment recommendations.", href: "/sw/zana/kulinganisha-hosting/", category: "ecommerce", lang: 'sw' },
        "html-to-pdf": { name: "HTML kwenda PDF - geuza HTML au rich text kuwa PDF", desc: "Badilisha HTML au rich text kuwa PDF kwenye kivinjari kwa templates, CSS, header, footer, namba za kurasa, margins na live preview.", href: "/sw/zana/html-kwenda-pdf/", category: "document-pdf", lang: 'sw' },
        "import-duty": { name: "Kikokotoo cha Ushuru wa Forodha Afrika", desc: "Kadiria ushuru wa forodha, VAT, levies na gharama ya kuingiza bidhaa. Tumia viwango vya makadirio kutoka ukurasa wa Kiingereza na thibitisha na mamlaka ya forodha.", href: "/sw/zana/ushuru-forodha/", category: "ecommerce", lang: 'sw' },
        "invoice-factoring": { name: "Kikokotoo cha Factoring ya Ankara", desc: "Pima advance, ada, reserve na gharama ya APR unapouza ankara ili kupata pesa mapema.", href: "/sw/zana/factoring-ankara/", category: "document-pdf", lang: 'sw' },
        "invoice-generator": { name: "Kizalishaji cha Ankara | Ankara ya PDF kwa Kiswahili", desc: "Tengeneza ankara ya biashara kwa Kiswahili, ongeza bidhaa, VAT, maelezo ya mteja, kisha chapisha au pakua PDF.", href: "/sw/zana/kizalishaji-ankara/", category: "document-pdf", lang: 'sw' },
        "irrigation-burundi": { name: "Kikokotoo cha Umwagiliaji Burundi", desc: "Hesabu mahitaji ya maji ya umwagiliaji kwa mazao Burundi. Bajeti ya maji kwa mahindi, kahawa, chai, viazi katika kanda mbalimbali za kilimo.", href: "/sw/kilimo/umwagiliaji/burundi/", category: "agriculture", lang: 'sw' },
        "irrigation-calculator": { name: "Kikokotoo cha Umwagiliaji Afrika", desc: "Kadiria mahitaji ya maji, gharama ya pumping na ratiba ya umwagiliaji kwa shamba.", href: "/sw/zana/kikokotoo-umwagiliaji/", category: "agriculture", lang: 'sw' },
        "irrigation-kenya": { name: "Kikokotoo cha Umwagiliaji Kenya", desc: "Hesabu mahitaji ya maji ya umwagiliaji kwa mazao Kenya. Bajeti ya maji ya kila mwezi kwa chai, mahindi, ngano, kahawa, avokado katika kanda 7 za kilimo.", href: "/sw/kilimo/umwagiliaji/kenya/", category: "agriculture", lang: 'sw' },
        "irrigation-rwanda": { name: "Kikokotoo cha Umwagiliaji Rwanda", desc: "Hesabu mahitaji ya maji ya umwagiliaji kwa mazao Rwanda. Bajeti ya maji kwa mahindi, viazi, kahawa, chai katika kanda mbalimbali za kilimo.", href: "/sw/kilimo/umwagiliaji/rwanda/", category: "agriculture", lang: 'sw' },
        "irrigation-tanzania": { name: "Kikokotoo cha Umwagiliaji Tanzania", desc: "Hesabu mahitaji ya maji ya umwagiliaji kwa mazao Tanzania. Bajeti ya maji ya kila mwezi kwa mahindi, mpunga, ngano, kahawa, chai katika kanda 7 za kilimo.", href: "/sw/kilimo/umwagiliaji/tanzania/", category: "agriculture", lang: 'sw' },
        "irrigation-uganda": { name: "Kikokotoo cha Umwagiliaji Uganda", desc: "Hesabu mahitaji ya maji ya umwagiliaji kwa mazao Uganda. Bajeti ya maji kwa mahindi, mpunga, kahawa, ndizi, chai katika kanda mbalimbali za kilimo.", href: "/sw/kilimo/umwagiliaji/uganda/", category: "agriculture", lang: 'sw' },
        "ke-vat": { name: "Kikokotoo cha VAT Kenya 16%", desc: "Kokotoa VAT, kodi ya ongezeko la thamani, kwa Kenya: ongeza VAT, toa VAT kutoka bei iliyojumuisha kodi, na panga ankara kwa KES.", href: "/sw/kenya/kikokotoo-vat/", category: "ecommerce", lang: 'sw' },
        "km-paye": { name: "Kikokotoo cha Kodi ya Mshahara Komoro 2026 — PAYE KMF", desc: "Kokotoa kodi ya mshahara (IRPP) na CNPS kwa Komoro 2026. Mabanda ya kodi 7, sarafu KMF. Zana ya bure ya kuhesabu mshahara halisi.", href: "/sw/comoros/kikokotoo-kodi-mshahara/", category: "financial", lang: 'sw' },
        "km-vat": { name: "Kikokotoo cha VAT Comoro 10%", desc: "Kokotoa VAT, kodi ya ongezeko la thamani, kwa Comoro: ongeza VAT, toa VAT kutoka bei iliyojumuisha kodi, na panga ankara kwa KMF.", href: "/sw/comoros/kikokotoo-vat/", category: "ecommerce", lang: 'sw' },
        "land-registry-fees": { name: "Ada za Usajili wa Ardhi Afrika", desc: "Kadiria ada za usajili wa ardhi, stamp duty, survey, wakili na gharama za uhamisho.", href: "/sw/zana/ada-usajili-wa-ardhi/", category: "ecommerce", lang: 'sw' },
        "leave-calculator": { name: "Kikokotoo cha Likizo Afrika 2026 - Likizo ya Mwaka, Malipo na Mpango wa Wazazi", desc: "Angalia haki za likizo kwa nchi 54 za Afrika, kokotoa siku ulizopata, hesabu malipo ya likizo ambayo haijatumika, panga likizo ya uzazi au baba, na tafuta wikendi ndefu kwa Kiswahili.", href: "/sw/zana/kikokotoo-likizo/", category: "financial", lang: 'sw' },
        "lr-paye": { name: "Kikokotoo cha Kodi ya Mshahara Liberia 2026 — LRA PAYE", desc: "Kokotoa mshahara wako halisi baada ya kodi ya LRA na NASSCORP Liberia. Mabanda ya kodi 0%–25%, NASSCORP 4% mfanyakazi + 6% mwajiri. Bure, haraka, bila kujisajili.", href: "/sw/liberia/kikokotoo-kodi-mshahara/", category: "financial", lang: 'sw' },
        "lr-vat": { name: "Kikokotoo cha VAT Liberia 10%", desc: "Kokotoa VAT, kodi ya ongezeko la thamani, kwa Liberia: ongeza VAT, toa VAT kutoka bei iliyojumuisha kodi, na panga ankara kwa LRD.", href: "/sw/liberia/kikokotoo-vat/", category: "ecommerce", lang: 'sw' },
        "ls-paye": { name: "Kikokotoo cha Kodi ya Mshahara Lesotho 2025/26", desc: "Kikokotoo cha PAYE kwa Lesotho 2025/26. Viwango vya LRA 20%–30%, punguzo la M10,560/mwaka. Hesabu mshahara wako halisi kwa Loti (LSL). Bila malipo.", href: "/sw/lesotho/kikokotoo-kodi-mshahara/", category: "financial", lang: 'sw' },
        "ls-vat": { name: "Kikokotoo cha VAT Lesotho 15%", desc: "Kokotoa VAT, kodi ya ongezeko la thamani, kwa Lesotho: ongeza VAT, toa VAT kutoka bei iliyojumuisha kodi, na panga ankara kwa LSL.", href: "/sw/lesotho/kikokotoo-vat/", category: "ecommerce", lang: 'sw' },
        "ly-paye": { name: "Kikokotoo cha Kodi ya Mshahara Libya 2026 — PAYE LYD", desc: "Kokotoa mshahara wako halisi baada ya kodi ya mapato na michango ya hifadhi ya jamii Libya. LYD. Bure, haraka.", href: "/sw/libya/kikokotoo-kodi-mshahara/", category: "financial", lang: 'sw' },
        "ma-paye": { name: "Kikokotoo cha Kodi ya Mshahara Moroko 2025 — DGI CNSS", desc: "Kikokotoo cha kodi ya mshahara Moroko 2025. Viwango vya DGI (0%–38%), CNSS 4.48%, AMO 2.26%. Hesabu za mwaka. Pata mshahara halisi wako kwa MAD.", href: "/sw/morocco/kikokotoo-kodi-mshahara/", category: "financial", lang: 'sw' },
        "ma-vat": { name: "Kikokotoo cha VAT Moroko 20%", desc: "Kokotoa VAT, kodi ya ongezeko la thamani, kwa Moroko: ongeza VAT, toa VAT kutoka bei iliyojumuisha kodi, na panga ankara kwa MAD.", href: "/sw/morocco/kikokotoo-vat/", category: "ecommerce", lang: 'sw' },
        "mama-put": { name: "Kikokotoo cha Faida ya Mama Put na Chakula cha Mtaani", desc: "Kadiria mapato, gharama za viungo, kodi, wafanyakazi na faida ya biashara ya chakula kama Mama Put, kibanda au mlo wa haraka.", href: "/sw/zana/faida-ya-mama-put/", category: "ecommerce", lang: 'sw' },
        "market-stall-profit": { name: "Kikokotoo cha Faida ya Kibanda Sokoni", desc: "Pima faida ya kibanda sokoni kwa bidhaa, gharama za kila siku, siku za soko na margin.", href: "/sw/zana/faida-ya-kibanda-sokoni/", category: "ecommerce", lang: 'sw' },
        "merchant-fees": { name: "Ada ya Kupokea Malipo kwa Mfanyabiashara | MDR na Mchanganyiko wa Malipo", desc: "Kokotoa ada ya kupokea malipo kwa biashara kwa Kiswahili. Pima kadi, POS, pesa za simu, bank transfer na cash ili kuona kiwango cha ada kilichochanganywa.", href: "/sw/zana/ada-mfanyabiashara/", category: "ecommerce", lang: 'sw' },
        "mg-paye": { name: "Kikokotoo cha Kodi ya Mshahara Madagaska 2025/26", desc: "Kikokotoo cha PAYE kwa Madagaska (Madagascar) 2025/26. Kodi 0%–20%, CNAPS 1%. Hesabu mshahara kwa Ariary ya Madagaska (MGA). Bila malipo.", href: "/sw/madagascar/kikokotoo-kodi-mshahara/", category: "financial", lang: 'sw' },
        "mg-vat": { name: "Kikokotoo cha VAT Madagascar 20%", desc: "Kokotoa VAT, kodi ya ongezeko la thamani, kwa Madagascar: ongeza VAT, toa VAT kutoka bei iliyojumuisha kodi, na panga ankara kwa MGA.", href: "/sw/madagascar/kikokotoo-vat/", category: "ecommerce", lang: 'sw' },
        "mini-importation": { name: "Faida ya Mini-Importation", desc: "Pima faida ya mini-importation kwa gharama ya bidhaa, usafirishaji, ushuru, gharama za kutoa mzigo, FX, idadi na bei ya kuuza.", href: "/sw/zana/faida-ya-mini-importation/", category: "ecommerce", lang: 'sw' },
        "minimum-wage": { name: "Kikokotoo cha Kima cha Chini cha Mshahara Afrika 2026", desc: "Angalia kima cha chini cha mshahara kwa nchi zote 54 za Afrika. Uhakiki wa ulinganifu, pengo la gharama ya maisha, mabadiliko ya kihistoria, sekta maalumu na tahadhari za nchi.", href: "/sw/zana/kikokotoo-kima-cha-chini-cha-mshahara/", category: "financial", lang: 'sw' },
        "minimum-wage-legal": { name: "Kikokotoo cha Kima cha Chini cha Mshahara Afrika 2026", desc: "Angalia kima cha chini cha mshahara kwa nchi zote 54 za Afrika. Uhakiki wa ulinganifu, pengo la gharama ya maisha, mabadiliko ya kihistoria, sekta maalumu na tahadhari za nchi.", href: "/sw/zana/kikokotoo-kima-cha-chini-cha-mshahara/", category: "financial", lang: 'sw' },
        "ml-paye": { name: "Kikokotoo cha Kodi ya Mshahara Mali 2026 — DGI ITS PAYE", desc: "Kokotoa mshahara wako halisi baada ya kodi ya DGI ITS Mali, INPS 3.6%. Mabanda ya kodi 0%–36%. Bure, haraka, bila kujisajili.", href: "/sw/mali/kikokotoo-kodi-mshahara/", category: "financial", lang: 'sw' },
        "ml-vat": { name: "Kikokotoo cha VAT Mali 18%", desc: "Kokotoa VAT, kodi ya ongezeko la thamani, kwa Mali: ongeza VAT, toa VAT kutoka bei iliyojumuisha kodi, na panga ankara kwa XOF.", href: "/sw/mali/kikokotoo-vat/", category: "ecommerce", lang: 'sw' },
        "mr-paye": { name: "Kikokotoo cha Kodi ya Mshahara Mauritania 2026 — ITS PAYE", desc: "Kokotoa mshahara wako halisi baada ya kodi ya ITS, CNSS Mauritania. Banda la kodi 0%–40%. Bure, haraka, bila kujisajili.", href: "/sw/mauritania/kikokotoo-kodi-mshahara/", category: "financial", lang: 'sw' },
        "mr-vat": { name: "Kikokotoo cha VAT Mauritania 16%", desc: "Kokotoa VAT, kodi ya ongezeko la thamani, kwa Mauritania: ongeza VAT, toa VAT kutoka bei iliyojumuisha kodi, na panga ankara kwa MRU.", href: "/sw/mauritania/kikokotoo-vat/", category: "ecommerce", lang: 'sw' },
        "mu-paye": { name: "Kikokotoo cha Kodi ya Mshahara Morisi 2025/26", desc: "Kikokotoo cha PAYE kwa Morisi (Mauritius) 2025/26. Viwango vya MRA 0%–20%, CSG 3%, NSF 2.5%. Hesabu mshahara kwa Rupia ya Morisi (MUR). Bila malipo.", href: "/sw/mauritius/kikokotoo-kodi-mshahara/", category: "financial", lang: 'sw' },
        "mu-vat": { name: "Kikokotoo cha VAT Morisi 15%", desc: "Kokotoa VAT, kodi ya ongezeko la thamani, kwa Morisi: ongeza VAT, toa VAT kutoka bei iliyojumuisha kodi, na panga ankara kwa MUR.", href: "/sw/mauritius/kikokotoo-vat/", category: "ecommerce", lang: 'sw' },
        "mw-paye": { name: "Kikokotoo cha Kodi ya Mshahara Malawi 2025/26", desc: "Kikokotoo cha PAYE kwa Malawi 2025/26. Viwango vya MRA 0%–35%. Hesabu mshahara wako halisi kwa Kwacha ya Malawi (MWK). Bila malipo.", href: "/sw/malawi/kikokotoo-kodi-mshahara/", category: "financial", lang: 'sw' },
        "mw-vat": { name: "Kikokotoo cha VAT Malawi 16.5%", desc: "Kokotoa VAT, kodi ya ongezeko la thamani, kwa Malawi: ongeza VAT, toa VAT kutoka bei iliyojumuisha kodi, na panga ankara kwa MWK.", href: "/sw/malawi/kikokotoo-vat/", category: "ecommerce", lang: 'sw' },
        "mz-paye": { name: "Kikokotoo cha Kodi ya Mshahara Msumbiji 2025/26", desc: "Kikokotoo cha PAYE kwa Msumbiji (Mozambique) 2025/26. Viwango vya AT 0%–32%, INSS 3%. Hesabu mshahara wako halisi kwa Metical (MZN). Bila malipo.", href: "/sw/mozambique/kikokotoo-kodi-mshahara/", category: "financial", lang: 'sw' },
        "mz-vat": { name: "Kikokotoo cha VAT Msumbiji 17%", desc: "Kokotoa VAT, kodi ya ongezeko la thamani, kwa Msumbiji: ongeza VAT, toa VAT kutoka bei iliyojumuisha kodi, na panga ankara kwa MZN.", href: "/sw/mozambique/kikokotoo-vat/", category: "ecommerce", lang: 'sw' },
        "na-paye": { name: "Kikokotoo cha Kodi ya Mshahara Namibia 2025/26", desc: "Kikokotoo cha PAYE kwa Namibia 2025/26. Viwango vya NamRA 0%–37%, SSC N$81/mwezi. Hesabu mshahara wako halisi kwa Dola ya Namibia (NAD). Bila malipo.", href: "/sw/namibia/kikokotoo-kodi-mshahara/", category: "financial", lang: 'sw' },
        "na-vat": { name: "Kikokotoo cha VAT Namibia 15%", desc: "Kokotoa VAT, kodi ya ongezeko la thamani, kwa Namibia: ongeza VAT, toa VAT kutoka bei iliyojumuisha kodi, na panga ankara kwa NAD.", href: "/sw/namibia/kikokotoo-vat/", category: "ecommerce", lang: 'sw' },
        "nafdac-registration": { name: "Usajili wa Bidhaa Afrika | NAFDAC, KEBS, SABS na FDA Ghana", desc: "Makadirio ya Kiswahili ya usajili wa bidhaa: NAFDAC, KEBS, SABS, FDA Ghana, aina ya bidhaa, origin, SKU na nyaraka za kuandaa.", href: "/sw/zana/usajili-wa-bidhaa/", category: "ecommerce", lang: 'sw' },
        "ne-paye": { name: "Kikokotoo cha Kodi ya Mshahara Nijeri 2026 — DGI IRPP", desc: "Kokotoa mshahara wako halisi baada ya kodi ya DGI Nijeri, CNSS 5.25%. Mabanda ya kodi 0%–35%. Bure, haraka.", href: "/sw/niger/kikokotoo-kodi-mshahara/", category: "financial", lang: 'sw' },
        "ne-vat": { name: "Kikokotoo cha VAT Niger 19%", desc: "Kokotoa VAT, kodi ya ongezeko la thamani, kwa Niger: ongeza VAT, toa VAT kutoka bei iliyojumuisha kodi, na panga ankara kwa XOF.", href: "/sw/niger/kikokotoo-vat/", category: "ecommerce", lang: 'sw' },
        "ng-paye": { name: "Kikokotoo cha Kodi ya Mshahara Nigeria 2026 — FIRS NTA & PITA", desc: "Kikokotoo cha kodi ya mshahara Nigeria 2026. Viwango vya FIRS NTA 2026 na PITA 2025 — mabanda sita ya kodi, pensheni 8%, NHF 2.5%. Pata mshahara halisi wako kwa NGN.", href: "/sw/nigeria/kikokotoo-kodi-mshahara/", category: "financial", lang: 'sw' },
        "ng-vat": { name: "Kikokotoo cha VAT Nigeria 7.5%", desc: "Kokotoa VAT, kodi ya ongezeko la thamani, kwa Nigeria: ongeza VAT, toa VAT kutoka bei iliyojumuisha kodi, na panga ankara kwa NGN.", href: "/sw/nigeria/kikokotoo-vat/", category: "ecommerce", lang: 'sw' },
        "overtime-calc": { name: "Kikokotoo cha Muda wa Ziada Afrika 2026 - Nchi 54", desc: "Kokotoa malipo ya muda wa ziada kwa kutumia sheria za kazi za nchi yako barani Afrika. Viwango vya siku ya kazi, wikendi, sikukuu za umma na zamu ya usiku kwa nchi zote 54.", href: "/sw/zana/kikokotoo-muda-wa-ziada/", category: "financial", lang: 'sw' },
        "pdf-bates": { name: "Namba Bates za PDF - Bates numbering na audit CSV", desc: "Weka namba Bates kwenye PDF moja au kundi la PDF kwa mpangilio endelevu, prefix, suffix, ZIP export na audit CSV ndani ya kivinjari.", href: "/sw/zana/namba-bates-pdf/", category: "document-pdf", lang: 'sw' },
        "pdf-chat": { name: "Chat na PDF - uliza maswali kuhusu hati", desc: "Pakia PDF yenye maandishi, uliza maswali, pata muhtasari, tafuta kurasa na nukuu za ukurasa kwa tahadhari ya AI na local fallback.", href: "/sw/zana/chat-na-pdf/", category: "document-pdf", lang: 'sw' },
        "pdf-compare": { name: "Kulinganisha PDF - text diff na visual review", desc: "Linganisha PDF mbili kwa text diff, visual diff, ukurasa uliobadilika, zinafananaity na ripoti ya review kwenye kivinjari.", href: "/sw/zana/kulinganisha-pdf/", category: "document-pdf", lang: 'sw' },
        "pdf-compress": { name: "Kubana PDF - Punguza ukubwa wa faili kwa faragha", desc: "Bana PDF kwa Kiswahili kwa kutumia mipangilio ya ubora, ripoti ya ukubwa na usindikaji wa ndani ya kivinjari.", href: "/sw/zana/kubana-pdf/", category: "document-pdf", lang: 'sw' },
        "pdf-convert": { name: "Kubadilisha Format ya PDF - Panga aina za faili", desc: "Badilisha format ya PDF kwa matumizi ya ofisi, kushiriki na kuhifadhi. Matokeo hutegemea aina na ubora wa faili chanzo.", href: "/sw/zana/kubadilisha-format-pdf/", category: "document-pdf", lang: 'sw' },
        "pdf-editor": { name: "Hariri PDF - Ongeza maandishi, maumbo na maelezo", desc: "Hariri PDF kwa kuongeza maandishi, maumbo, alama na maelezo ya kuona. Tumia kama zana ya maandalizi, si uhakiki wa kisheria.", href: "/sw/zana/hariri-pdf/", category: "document-pdf", lang: 'sw' },
        "pdf-find-replace": { name: "Tafuta na Badilisha PDF - visual text replacement", desc: "Tafuta maandishi kwenye PDF, kagua match, badilisha kwa visual overlay, export PDF na CSV audit kwenye kivinjari.", href: "/sw/zana/tafuta-na-badilisha-pdf/", category: "document-pdf", lang: 'sw' },
        "pdf-form-filler": { name: "Kujaza Fomu za PDF - Andika kwenye fomu na pakua", desc: "Jaza fomu za PDF kwa Kiswahili kwa kuongeza maandishi na sehemu za taarifa kabla ya kupakua nakala yako.", href: "/sw/zana/kujaza-fomu-pdf/", category: "document-pdf", lang: 'sw' },
        "pdf-header-footer": { name: "Kichwa na Kijachini cha PDF - Kichwa na footer", desc: "Ongeza header na footer kwenye PDF kwa jina la kampuni, tarehe, namba za kurasa au alama za mradi.", href: "/sw/zana/kichwa-na-kijachini-pdf/", category: "document-pdf", lang: 'sw' },
        "pdf-image-convert": { name: "Kubadilisha PDF na Picha - PDF kwenda picha na picha kwenda PDF", desc: "Badilisha PDF kuwa picha au picha kuwa PDF kwa Kiswahili. Tumia JPG, PNG na mipangilio ya ubora kwenye kivinjari chako.", href: "/sw/zana/kubadilisha-pdf-na-picha/", category: "document-pdf", lang: 'sw' },
        "pdf-merge-split": { name: "Unganisha na Gawanya PDF - Chagua kurasa na masafa", desc: "Unganisha PDF, pangilia faili, chagua masafa ya kurasa, toa kurasa maalum au gawanya PDF kwa Kiswahili kwenye kivinjari chako.", href: "/sw/zana/unganisha-na-gawanya-pdf/", category: "document-pdf", lang: 'sw' },
        "pdf-ocr": { name: "OCR ya PDF - Toa maandishi kwenye PDF au picha", desc: "Tumia OCR kutoa maandishi kutoka PDF au picha. Kagua matokeo kabla ya kutumia kwa nyaraka rasmi.", href: "/sw/zana/ocr-pdf/", category: "document-pdf", lang: 'sw' },
        "pdf-page-numbers": { name: "Namba za Kurasa za PDF - Weka kurasa na muundo", desc: "Ongeza namba za kurasa kwenye PDF kwa Kiswahili. Chagua mahali, ukurasa wa kuanza, muundo na mtindo wa maandishi.", href: "/sw/zana/namba-za-kurasa-pdf/", category: "document-pdf", lang: 'sw' },
        "pdf-password": { name: "Linda PDF kwa Nenosiri - AES-256 kwenye kivinjari", desc: "Linda PDF kwa nenosiri kwa Kiswahili. Tumia AES-256 inapopatikana na kagua tahadhari kabla ya kutuma nyaraka nyeti.", href: "/sw/zana/kulinda-pdf-kwa-nenosiri/", category: "document-pdf", lang: 'sw' },
        "pdf-redact": { name: "Kuficha Taarifa kwenye PDF - Ficha taarifaion kwa faragha", desc: "Fanya redaction ya PDF kwa kuficha taarifa nyeti kabla ya kushiriki nyaraka. Hakiki faili kabla ya kuituma rasmi.", href: "/sw/zana/kuficha-taarifa-pdf/", category: "document-pdf", lang: 'sw' },
        "pdf-reorder": { name: "Kupanga Kurasa za PDF - Panga upya, rotate na delete", desc: "Panga upya kurasa za PDF, zungusha au ondoa kurasa usizohitaji kabla ya kupakua faili jipya.", href: "/sw/zana/kupanga-kurasa-pdf/", category: "document-pdf", lang: 'sw' },
        "pdf-repair": { name: "Kurekebisha PDF - jaribu kufungua faili zilizoharibika", desc: "Jaribu kurekebisha PDF zilizoharibika kwa qpdf, normalize na salvage ya kurasa kwenye kivinjari, ukiwa na ripoti ya JSON au CSV.", href: "/sw/zana/kurekebisha-pdf/", category: "document-pdf", lang: 'sw' },
        "pdf-sign": { name: "Kusaini PDF - Chora, andika au pakia saini", desc: "Ongeza saini kwenye PDF kwa kuchora, kuandika au kupakia picha ya saini. Zana ya kupanga saini kwenye kurasa za PDF.", href: "/sw/zana/kusaini-pdf/", category: "document-pdf", lang: 'sw' },
        "pdf-to-audio": { name: "PDF kwenda Sauti - sikiliza hati zako", desc: "Badilisha PDF yenye maandishi kuwa kusikiliza kwa browser voices au AI voice mode, pamoja na speed, pitch, cleanup, bookmarks na export.", href: "/sw/zana/pdf-kwenda-sauti/", category: "document-pdf", lang: 'sw' },
        "pdf-translate": { name: "Kutafsiri PDF - tafsiri hati kwa tahadhari", desc: "Tafsiri maandishi ya PDF kwa API, AI context au local glossary draft, pamoja na bilingual review na export ya handoff pack.", href: "/sw/zana/kutafsiri-pdf/", category: "document-pdf", lang: 'sw' },
        "pdf-watermark": { name: "Watermark PDF - Weka alama ya siri, draft au chapa", desc: "Ongeza watermark kwenye PDF kwa maandishi, nembo au alama ya siri. Tumia ukurasa wote au kurasa maalum kwenye kivinjari.", href: "/sw/zana/watermark-pdf/", category: "document-pdf", lang: 'sw' },
        "pdf-workflow": { name: "Workflow ya PDF - jenga mtiririko wa kazi za PDF", desc: "Jenga workflow ya PDF kwa repair, optimize, compress, watermark, page numbers, rotate, merge, encrypt na report export kwenye kivinjari.", href: "/sw/zana/workflow-ya-pdf/", category: "document-pdf", lang: 'sw' },
        "pdf-workspace": { name: "Nafasi ya Kazi ya PDF - Unganisha, gawanya na panga PDF", desc: "Tumia nafasi ya kazi ya PDF kwa Kiswahili: unganisha, gawanya, panga, zungusha, bana na pakua PDF kwenye kivinjari chako bila kupakia faili kwenye seva.", href: "/sw/zana/nafasi-pdf/", category: "document-pdf", lang: 'sw' },
        "planting-calendar": { name: "Kalenda ya Kupanda Mazao Afrika", desc: "Panga mwezi wa kupanda na makadirio ya kuvuna kwa zao, eneo la hali ya hewa na muda wa kukomaa.", href: "/sw/zana/kalenda-ya-kupanda-mazao/", category: "agriculture", lang: 'sw' },
        "pos-agent": { name: "Kikokotoo cha Faida ya Wakala POS", desc: "Kadiria mapato, commission, float, gharama na ROI ya wakala POS au mobile money.", href: "/sw/zana/faida-ya-wakala-pos/", category: "ecommerce", lang: 'sw' },
        "poultry-roi-calculator": { name: "Faida ya Ufugaji Kuku Afrika", desc: "Kadiria ROI ya broilers au layers kwa vifaranga, chakula, mortality, bei ya kuuza na gharama za banda.", href: "/sw/zana/faida-ya-ufugaji-kuku/", category: "ecommerce", lang: 'sw' },
        "profit-margin": { name: "Kikokotoo cha Margin ya Faida | Markup na Bei Lengwa", desc: "Kokotoa margin ya faida, markup, ROI, bei lengwa, break-even na gharama ya bidhaa kwa biashara za Afrika.", href: "/sw/zana/kikokotoo-margin-ya-faida/", category: "ecommerce", lang: 'sw' },
        "proforma-invoice": { name: "Kizalishaji cha Ankara Proforma", desc: "Tengeneza rasimu ya ankara proforma kwa bei ya nukuu, Incoterms, VAT, gharama za usafirishaji na taarifa za mnunuzi na muuzaji.", href: "/sw/zana/ankara-proforma/", category: "document-pdf", lang: 'sw' },
        "property-cgt": { name: "Kikokotoo cha CGT ya Mali Afrika", desc: "Kadiria CGT, yaani kodi ya faida ya mtaji, unapouza mali baada ya gharama za kununua, kuboresha na kuuza.", href: "/sw/zana/kodi-ya-faida-ya-mali/", category: "ecommerce", lang: 'sw' },
        "property-roi": { name: "Faida ya Uwekezaji wa Nyumba | ROI ya Mali", desc: "Kokotoa ROI ya mali isiyohamishika kwa pango, ukuaji wa thamani, gharama na muda wa uwekezaji.", href: "/sw/zana/faida-ya-uwekezaji-wa-nyumba/", category: "ecommerce", lang: 'sw' },
        "public-holidays": { name: "Kalenda Likizo za Umma Afrika", desc: "Angalia likizo za umma kwa nchi kadhaa za Afrika, filter upcoming holidays na export .ics kwa calendar.", href: "/sw/zana/kalenda-likizo-za-umma/", category: "financial", lang: 'sw' },
        "real-return": { name: "Faida Halisi Baada ya Mfumuko wa Bei", desc: "Pima kama riba yako inashinda mfumuko wa bei na kuona thamani halisi ya akiba au uwekezaji.", href: "/sw/zana/faida-halisi-baada-ya-mfumuko/", category: "ecommerce", lang: 'sw' },
        "rental-yield": { name: "Kikokotoo cha Mavuno ya Upangishaji", desc: "Kokotoa gross yield, net yield na mapato ya upangishaji baada ya matengenezo, vacancy na ada.", href: "/sw/zana/mavuno-ya-upangishaji/", category: "agriculture", lang: 'sw' },
        "rw-vat": { name: "Kikokotoo cha VAT Rwanda 18%", desc: "Kokotoa VAT, kodi ya ongezeko la thamani, kwa Rwanda: ongeza VAT, toa VAT kutoka bei iliyojumuisha kodi, na panga ankara kwa RWF.", href: "/sw/rwanda/kikokotoo-vat/", category: "ecommerce", lang: 'sw' },
        "salary-negotiation": { name: "Majadiliano ya Mshahara", desc: "Panga counter-offer kwa kutumia mshahara wa sasa, ofa uliyopewa, market midpoint na confidence ya negotiation.", href: "/sw/zana/majadiliano-ya-mshahara/", category: "financial", lang: 'sw' },
        "sc-paye": { name: "Kikokotoo cha Kodi ya Mshahara Shelisheli 2025/26", desc: "Kikokotoo cha PAYE kwa Shelisheli (Seychelles) 2025/26. Viwango vya SRC 0%–30%, pensheni 3%. Hesabu mshahara kwa Rupia ya Shelisheli (SCR). Bila malipo.", href: "/sw/seychelles/kikokotoo-kodi-mshahara/", category: "financial", lang: 'sw' },
        "sc-vat": { name: "Kikokotoo cha VAT Shelisheli 15%", desc: "Kokotoa VAT, kodi ya ongezeko la thamani, kwa Shelisheli: ongeza VAT, toa VAT kutoka bei iliyojumuisha kodi, na panga ankara kwa SCR.", href: "/sw/seychelles/kikokotoo-vat/", category: "ecommerce", lang: 'sw' },
        "sd-paye": { name: "Kikokotoo cha Kodi ya Mshahara Sudani 2026 — PAYE SDG", desc: "Kokotoa mshahara wako halisi baada ya kodi ya mapato na hifadhi ya jamii Sudani. SDG. Bure, haraka.", href: "/sw/sudan/kikokotoo-kodi-mshahara/", category: "financial", lang: 'sw' },
        "sd-vat": { name: "Kikokotoo cha VAT Sudan 17%", desc: "Kokotoa VAT, kodi ya ongezeko la thamani, kwa Sudan: ongeza VAT, toa VAT kutoka bei iliyojumuisha kodi, na panga ankara kwa SDG.", href: "/sw/sudan/kikokotoo-vat/", category: "ecommerce", lang: 'sw' },
        "shipping-estimator": { name: "Makisio ya Gharama za Usafirishaji wa Biashara", desc: "Kadiria gharama za usafirishaji wa biashara kwa bahari, ndege, LCL au kontena kutoka masoko ya nje hadi bandari za Afrika.", href: "/sw/zana/makisio-ya-usafirishaji-wa-biashara/", category: "ecommerce", lang: 'sw' },
        "sl-paye": { name: "Kikokotoo cha Kodi ya Mshahara Sierra Leone 2026 — NRA PAYE", desc: "Kokotoa mshahara wako halisi baada ya kodi ya NRA, NASSIT Sierra Leone. Banda la kodi 0%–30%. Bure, haraka, bila kujisajili.", href: "/sw/sierra-leone/kikokotoo-kodi-mshahara/", category: "financial", lang: 'sw' },
        "sl-vat": { name: "Kikokotoo cha VAT Sierra Leone 15%", desc: "Kokotoa VAT, kodi ya ongezeko la thamani, kwa Sierra Leone: ongeza VAT, toa VAT kutoka bei iliyojumuisha kodi, na panga ankara kwa SLL.", href: "/sw/sierra-leone/kikokotoo-vat/", category: "ecommerce", lang: 'sw' },
        "sn-paye": { name: "Kikokotoo cha Kodi ya Mshahara Senegali 2026 — DGID PAYE", desc: "Kokotoa mshahara wako halisi baada ya kodi ya DGID Senegali, CSS 5.6%. Mabanda ya kodi 0%–40%. Bure, haraka, bila kujisajili.", href: "/sw/senegal/kikokotoo-kodi-mshahara/", category: "financial", lang: 'sw' },
        "sn-vat": { name: "Kikokotoo cha VAT Senegali 18%", desc: "Kokotoa VAT, kodi ya ongezeko la thamani, kwa Senegali: ongeza VAT, toa VAT kutoka bei iliyojumuisha kodi, na panga ankara kwa XOF.", href: "/sw/senegal/kikokotoo-vat/", category: "ecommerce", lang: 'sw' },
        "so-paye": { name: "Kikokotoo cha Kodi ya Mshahara Somalia 2026 — PAYE SOS", desc: "Kokotoa mshahara wako halisi baada ya kodi ya mapato Somalia. SOS/USD. Bure, haraka, bila kujisajili.", href: "/sw/somalia/kikokotoo-kodi-mshahara/", category: "financial", lang: 'sw' },
        "social-security": { name: "Kikokotoo cha Michango ya Hifadhi ya Jamii Afrika 2026 - NSSF, SSNIT, UIF, CNPS", desc: "Kokotoa michango ya mfanyakazi na mwajiri kwa hifadhi ya jamii katika nchi 54 za Afrika. NSSF, SSNIT, UIF, CNPS na PenCom pamoja na vikomo, ngazi na mgawanyo wa kina kwa sarafu ya ndani.", href: "/sw/zana/kikokotoo-michango-ya-hifadhi-ya-jamii/", category: "financial", lang: 'sw' },
        "solar-roi": { name: "Faida ya Solar na payback", desc: "Kadiria payback, ROI na akiba ya mfumo wa solar kwa kutumia gharama, bili ya umeme na matumizi ya kWh.", href: "/sw/zana/faida-ya-solar/", category: "ecommerce", lang: 'sw' },
        "ss-paye": { name: "Kikokotoo cha Kodi ya Mshahara Sudani Kusini 2025/26 — PAYE SSP", desc: "Kokotoa mshahara wako halisi baada ya kodi ya mapato na hifadhi ya jamii Sudani Kusini. PAYE ya NRA 0%–20% na NSIF 8%/17%. SSP. Bure, haraka.", href: "/sw/south-sudan/kikokotoo-kodi-mshahara/", category: "financial", lang: 'sw' },
        "st-paye": { name: "Kikokotoo cha Kodi ya Mshahara São Tomé 2026 — PAYE STN", desc: "Kokotoa mshahara wako halisi baada ya kodi ya mapato na INSS São Tomé na Príncipe. STN. Bure, haraka, sahihi.", href: "/sw/sao-tome/kikokotoo-kodi-mshahara/", category: "financial", lang: 'sw' },
        "st-vat": { name: "Kikokotoo cha VAT Sao Tome na Principe 15%", desc: "Kokotoa VAT, kodi ya ongezeko la thamani, kwa Sao Tome na Principe: ongeza VAT, toa VAT kutoka bei iliyojumuisha kodi, na panga ankara kwa STN.", href: "/sw/sao-tome/kikokotoo-vat/", category: "ecommerce", lang: 'sw' },
        "sustainability-scorecard": { name: "Kadi ya Uendelevu wa Biashara", desc: "Pima biashara yako kwenye nishati, maji, taka, manunuzi, usalama wa wafanyakazi na utayari wa kutoa taarifa.", href: "/sw/zana/kadi-ya-uendelevu-wa-biashara/", category: "ecommerce", lang: 'sw' },
        "sz-paye": { name: "Kikokotoo cha Kodi ya Mshahara Eswatini 2025/26", desc: "Kikokotoo cha PAYE kwa Eswatini 2025/26. Viwango vya SRA 20%–33%, SNPF 5%, punguzo la E8,200/mwaka. Hesabu mshahara kwa Lilangeni (SZL). Bila malipo.", href: "/sw/eswatini/kikokotoo-kodi-mshahara/", category: "financial", lang: 'sw' },
        "sz-vat": { name: "Kikokotoo cha VAT Eswatini 15%", desc: "Kokotoa VAT, kodi ya ongezeko la thamani, kwa Eswatini: ongeza VAT, toa VAT kutoka bei iliyojumuisha kodi, na panga ankara kwa SZL.", href: "/sw/eswatini/kikokotoo-vat/", category: "ecommerce", lang: 'sw' },
        "td-paye": { name: "Kikokotoo cha Kodi ya Mshahara Chad 2026 — PAYE XAF", desc: "Kokotoa mshahara wako halisi baada ya kodi ya mapato na CNPS Chadi. XAF. Bure, haraka, sahihi.", href: "/sw/chad/kikokotoo-kodi-mshahara/", category: "financial", lang: 'sw' },
        "td-vat": { name: "Kikokotoo cha VAT Chadi 18%", desc: "Kokotoa VAT, kodi ya ongezeko la thamani, kwa Chadi: ongeza VAT, toa VAT kutoka bei iliyojumuisha kodi, na panga ankara kwa XAF.", href: "/sw/chad/kikokotoo-vat/", category: "ecommerce", lang: 'sw' },
        "teacher-salary": { name: "Mshahara wa Mwalimu | Teacher Scale", desc: "Kadiria nafasi yako kwenye teacher scale kwa level ya shule, aina ya mwajiri na miaka ya uzoefu bila kudai scale rasmi.", href: "/sw/zana/mshahara-wa-mwalimu/", category: "financial", lang: 'sw' },
        "telecom-business-internet": { name: "Kikokotoo Intaneti ya Biashara", desc: "Kadiria intaneti ya biashara kwa wafanyakazi, Mbps, matumizi, backup na gharama za mtoa huduma. Matokeo ni ya kupanga, si bei rasmi.", href: "/sw/zana/kikokotoo-intaneti-ya-biashara/", category: "ecommerce", lang: 'sw' },
        "telecom-sim-reg": { name: "Ukaguzi Usajili wa SIM", desc: "Kagua mahitaji ya usajili wa SIM, KYC, NIN, Ghana Card, passport au ID ya nchi. Tumia kama orodha ya ukaguzi, si uamuzi rasmi wa mamlaka.", href: "/sw/zana/ukaguzi-usajili-wa-sim/", category: "ecommerce", lang: 'sw' },
        "telecom-whatsapp-vs-sms": { name: "WhatsApp Business dhidi ya SMS", desc: "Linganishia WhatsApp Business API na SMS nyingi kwa gharama, reach, aina ya ujumbe na breakeven ya biashara.", href: "/sw/zana/whatsapp-business-dhidi-ya-sms/", category: "ecommerce", lang: 'sw' },
        "tg-paye": { name: "Kikokotoo cha Kodi ya Mshahara Togo 2026 — OTR PAYE", desc: "Kokotoa mshahara wako halisi baada ya kodi ya OTR Togo, CNPS 2.5%. Mabanda ya kodi 0%–25%. Bure, haraka.", href: "/sw/togo/kikokotoo-kodi-mshahara/", category: "financial", lang: 'sw' },
        "tg-vat": { name: "Kikokotoo cha VAT Togo 18%", desc: "Kokotoa VAT, kodi ya ongezeko la thamani, kwa Togo: ongeza VAT, toa VAT kutoka bei iliyojumuisha kodi, na panga ankara kwa XOF.", href: "/sw/togo/kikokotoo-vat/", category: "ecommerce", lang: 'sw' },
        "tin-guide": { name: "Mwongozo wa TIN Afrika | Nchi 54 kwa Kiswahili", desc: "Mwongozo wa Kiswahili wa TIN, PIN, TRN na namba za kodi kwa nchi zote 54 za Afrika.", href: "/sw/zana/mwongozo-tin/", category: "ecommerce", lang: 'sw' },
        "tn-paye": { name: "Kikokotoo cha Kodi ya Mshahara Tunisia 2026 — IRPP PAYE", desc: "Kokotoa mshahara wako halisi baada ya kodi ya IRPP na CNSS Tunisia. Mabanda 0%–35%. Bure, haraka, bila kujisajili.", href: "/sw/tunisia/kikokotoo-kodi-mshahara/", category: "financial", lang: 'sw' },
        "tn-vat": { name: "Kikokotoo cha VAT Tunisia 19%", desc: "Kokotoa VAT, kodi ya ongezeko la thamani, kwa Tunisia: ongeza VAT, toa VAT kutoka bei iliyojumuisha kodi, na panga ankara kwa TND.", href: "/sw/tunisia/kikokotoo-vat/", category: "ecommerce", lang: 'sw' },
        "trade-credit": { name: "Masharti ya Mkopo wa Biashara", desc: "Linganisha kuchukua punguzo la malipo ya mapema dhidi ya kutumia trade credit hadi tarehe ya mwisho.", href: "/sw/zana/masharti-ya-mkopo-wa-biashara/", category: "ecommerce", lang: 'sw' },
        "trade-finance-comparator": { name: "Kilinganisha Fedha za Biashara | LC, T/T, CAD na SBLC", desc: "Linganisha gharama na hatari za LC, T/T, CAD, SBLC na njia nyingine za malipo ya kimataifa.", href: "/sw/zana/kilinganisha-fedha-za-biashara/", category: "ecommerce", lang: 'sw' },
        "trademark-registration": { name: "Usajili wa Alama ya Biashara Afrika | ARIPO, OAPI na Nice", desc: "Mwongozo wa Kiswahili wa usajili wa trademark, search, Nice Classification, ARIPO, OAPI, Madrid na njia za kuwasilisha kitaifa.", href: "/sw/zana/usajili-wa-alama-ya-biashara/", category: "ecommerce", lang: 'sw' },
        "tree-planting-roi": { name: "Faida ya Kupanda Miti", desc: "Kadiria survival, gharama, carbon, matunda, timber au ecosystem value ya kupanda miti.", href: "/sw/zana/faida-ya-kupanda-miti/", category: "ecommerce", lang: 'sw' },
        "tz-vat": { name: "Kikokotoo cha VAT Tanzania 18%", desc: "Kokotoa VAT, kodi ya ongezeko la thamani, kwa Tanzania: ongeza VAT, toa VAT kutoka bei iliyojumuisha kodi, na panga ankara kwa TZS.", href: "/sw/tanzania/kikokotoo-vat/", category: "ecommerce", lang: 'sw' },
        "ug-vat": { name: "Kikokotoo cha VAT Uganda 18%", desc: "Kokotoa VAT, kodi ya ongezeko la thamani, kwa Uganda: ongeza VAT, toa VAT kutoka bei iliyojumuisha kodi, na panga ankara kwa UGX.", href: "/sw/uganda/kikokotoo-vat/", category: "ecommerce", lang: 'sw' },
        "vat-calc-pan-african": { name: "Kikokotoo cha VAT Afrika | Nchi 54", desc: "Kokotoa VAT, kodi ya ongezeko la thamani, kwa nchi zote 54 za Afrika na uunganishe matokeo na ankara, TIN na usajili wa biashara.", href: "/sw/zana/kikokotoo-vat/", category: "ecommerce", lang: 'sw' },
        "hajj-budget": { name: "Bajeti ya Hajj na Umrah", desc: "Panga akiba ya Hajj au Umrah kwa kifurushi, nauli ya ndege, visa, chakula, usafiri na akiba ya dharura.", href: "/sw/zana/bajeti-ya-hajj-na-umrah/", category: "religious-cultural", lang: 'sw' },
        "zakat-calculator": { name: "Kikokotoo cha Zakat (Zaka)", desc: "Kokotoa zakat ya fedha, dhahabu, biashara na madeni kwa kupanga nisab. Tumia kama makadirio, si fatwa au uamuzi rasmi.", href: "/sw/zana/kikokotoo-zakat/", category: "religious-cultural", lang: 'sw' },
        "vat-calculator": { name: "Kikokotoo cha VAT Afrika | Nchi 54", desc: "Kokotoa VAT, kodi ya ongezeko la thamani, kwa nchi zote 54 za Afrika na uunganishe matokeo na ankara, TIN na usajili wa biashara.", href: "/sw/zana/kikokotoo-vat/", category: "ecommerce", lang: 'sw' },
        "sw-ushuru-kuagiza-gari": { name: "Ushuru wa Kuagiza Gari Afrika", desc: "Kadiria duty, VAT, excise na levies za kuagiza gari. Thibitisha viwango na mamlaka ya forodha kabla ya kununua.", href: "/sw/zana/ushuru-kuagiza-gari/", category: "ecommerce", lang: 'sw' },
        "vehicle-registration": { name: "Usajili na Nyaraka za Gari", desc: "Kagua renewal, road tax, inspection, plates, insurance proof na nyaraka za gari. Thibitisha na mamlaka ya usajili.", href: "/sw/zana/usajili-na-nyaraka-za-gari/", category: "ecommerce", lang: 'sw' },
        "vehicle-tracker-roi": { name: "Faida ya Tracker ya Gari", desc: "Kadiria ROI ya GPS tracker kwa fuel savings, insurance discount, theft recovery risk, subscription na installation cost.", href: "/sw/zana/faida-ya-tracker-ya-gari/", category: "ecommerce", lang: 'sw' },
        "voter-registration": { name: "Usajili wa Mpiga Kura Afrika | INEC, IEBC, IEC na Status", desc: "Mwongozo wa Kiswahili wa usajili wa mpiga kura, eligibility, ID, commission, portal na status kwa nchi kadhaa za Afrika.", href: "/sw/zana/usajili-wa-mpiga-kura/", category: "ecommerce", lang: 'sw' },
        "watermark-bulk": { name: "Watermark Nyingi - weka alama kwenye faili nyingi", desc: "Weka watermark kwenye picha nyingi kwa proofs, listings, media ya jumuiya na drafts ndani ya browser, kisha pakua batch.", href: "/sw/zana/watermark-nyingi/", category: "document-pdf", lang: 'sw' },
        "winding-up": { name: "Orodha ya Kufunga Kampuni | Winding-up", desc: "Panga winding-up au kufunga kampuni: njia ya hiari, wadai, uthibitisho wa kodi, kuuza mali, kufuta usajili na hatari kwa wakurugenzi katika nchi 16.", href: "/sw/zana/kufunga-kampuni/", category: "ecommerce", lang: 'sw' },
        "za-paye": { name: "Kikokotoo cha Kodi ya Mshahara Afrika Kusini 2025/26 — SARS", desc: "Kikokotoo cha kodi ya mshahara Afrika Kusini 2025/26. SARS mabanda 7 (18%–45%), UIF 1%, punguzo la pensheni 27.5%, mikopo ya kodi ya matibabu. Mshahara halisi kwa ZAR.", href: "/sw/south-africa/kikokotoo-kodi-mshahara/", category: "financial", lang: 'sw' },
        "za-vat": { name: "Kikokotoo cha VAT Afrika Kusini 15%", desc: "Kokotoa VAT, kodi ya ongezeko la thamani, kwa Afrika Kusini: ongeza VAT, toa VAT kutoka bei iliyojumuisha kodi, na panga ankara kwa ZAR.", href: "/sw/south-africa/kikokotoo-vat/", category: "ecommerce", lang: 'sw' },
        "zm-paye": { name: "Kikokotoo cha Kodi ya Mshahara Zambia 2025/26", desc: "Kikokotoo cha kodi ya mshahara (PAYE) kwa Zambia 2025/26. Viwango vya ZRA 0%–37.5%, NAPSA 5%. Hesabu sahihi kwa Kwacha ya Zambia (ZMW). Bila malipo.", href: "/sw/zambia/kikokotoo-kodi-mshahara/", category: "financial", lang: 'sw' },
        "zm-vat": { name: "Kikokotoo cha VAT Zambia 16%", desc: "Kokotoa VAT, kodi ya ongezeko la thamani, kwa Zambia: ongeza VAT, toa VAT kutoka bei iliyojumuisha kodi, na panga ankara kwa ZMW.", href: "/sw/zambia/kikokotoo-vat/", category: "ecommerce", lang: 'sw' },
        "zw-paye": { name: "Kikokotoo cha Kodi ya Mshahara Zimbabwe 2025/26", desc: "Kikokotoo cha PAYE kwa Zimbabwe 2025/26. Viwango vya ZIMRA 0%–40%, NSSA 3.5%. Inasaidia USD na ZWG. Hesabu sahihi bila malipo.", href: "/sw/zimbabwe/kikokotoo-kodi-mshahara/", category: "financial", lang: 'sw' },
        "zw-vat": { name: "Kikokotoo cha VAT Zimbabwe 15%", desc: "Kokotoa VAT, kodi ya ongezeko la thamani, kwa Zimbabwe: ongeza VAT, toa VAT kutoka bei iliyojumuisha kodi, na panga ankara kwa ZWL.", href: "/sw/zimbabwe/kikokotoo-vat/", category: "ecommerce", lang: 'sw' }
      };

      const normalizeDiscoveryHref = href => String(href || '').replace(/^https?:\/\/[^/]+/, '').replace(/\/$/, '');

      const HA_DISCOVERY_OVERRIDES = {
        "ng-paye": { name: "Kalkuleta PAYE Najeriya", desc: "Kokoto albashi, PAYE, fansho da NHF na Najeriya. An fi dacewa da ma'aikata da masu albashi a Arewa.", href: "/ha/najeriya/harajin-albashi/", category: "financial", lang: 'ha' },
        "ng-paye-ha": { name: "Kalkuleta PAYE Najeriya", desc: "Kokoto albashi, PAYE, fansho da NHF na Najeriya. An fi dacewa da ma'aikata da masu albashi a Arewa.", href: "/ha/najeriya/harajin-albashi/", category: "financial", lang: 'ha' },
        "vat-calc-pan-african": { name: "Kalkuletan VAT na Afirka", desc: "Kara ko cire VAT, gina takardar kudi, lissafa rike VAT kuma kwatanta adadin VAT na kasashe 54 a Hausa.", href: "/ha/kayan-aiki/kalkuletan-vat/", category: "ecommerce", lang: 'ha', status: 'live', phase: 'LIVE' },
        "vat-calculator": { name: "Kalkuletan VAT na Afirka", desc: "Kara ko cire VAT, gina takardar kudi, lissafa rike VAT kuma kwatanta adadin VAT na kasashe 54 a Hausa.", href: "/ha/kayan-aiki/kalkuletan-vat/", category: "ecommerce", lang: 'ha', status: 'live', phase: 'LIVE' },
        "vat-calculator-ha": { name: "Kalkuletan VAT na Afirka", desc: "Kara ko cire VAT, gina takardar kudi, lissafa rike VAT kuma kwatanta adadin VAT na kasashe 54 a Hausa.", href: "/ha/kayan-aiki/kalkuletan-vat/", category: "ecommerce", lang: 'ha', status: 'live', phase: 'LIVE' },
        "vat-business-tax-ha": { name: "VAT da Harajin Kasuwanci", desc: "Hub din Hausa don VAT, TIN, takardar kudi, PAYE, CIT da WHT; tabbatar da FIRS ko kwararren haraji kafin yanke hukunci.", href: "/ha/kasuwanci-da-haraji/", category: "ecommerce", lang: 'ha', status: 'live', phase: 'LIVE' },
        "ng-vat": { name: "VAT na Najeriya", desc: "Hanyar Hausa don VAT; tabbatar da VAT daga FIRS ko kwararre kafin amfani.", href: "/ha/kayan-aiki/kalkuletan-vat/", category: "ecommerce", lang: 'ha', status: 'live', phase: 'LIVE' },
        "ng-cit": { name: "Kalkuletan CIT Najeriya", desc: "Lissafa harajin kudin shiga na kamfani, ragin kudin kadarori da rarar ci gaba a Hausa.", href: "/ha/kayan-aiki/cit-najeriya/", category: "financial", lang: 'ha', status: 'live', phase: 'LIVE' },
        "ng-cit-ha": { name: "Kalkuletan CIT Najeriya", desc: "Lissafa harajin kudin shiga na kamfani, ragin kudin kadarori da rarar ci gaba a Hausa.", href: "/ha/kayan-aiki/cit-najeriya/", category: "financial", lang: 'ha', status: 'live', phase: 'LIVE' },
        "ng-wht": { name: "Kalkuletan WHT Najeriya", desc: "Kiyasta kudin WHT da za a rike daga biyan kudi, haya, kaya, kwangila da ayyuka a Hausa.", href: "/ha/kayan-aiki/wht-najeriya/", category: "financial", lang: 'ha', status: 'live', phase: 'LIVE' },
        "ng-wht-ha": { name: "Kalkuletan WHT Najeriya", desc: "Kiyasta kudin WHT da za a rike daga biyan kudi, haya, kaya, kwangila da ayyuka a Hausa.", href: "/ha/kayan-aiki/wht-najeriya/", category: "financial", lang: 'ha', status: 'live', phase: 'LIVE' },
        "tin-guide": { name: "Jagorar TIN Najeriya", desc: "Jagorar Hausa don TIN a Najeriya: takardu, kudi, lokaci da hanyar tabbatarwa.", href: "/ha/kayan-aiki/jagorar-tin-najeriya/", category: "ecommerce", lang: 'ha', status: 'live', phase: 'LIVE' },
        "tin-guide-nigeria-ha": { name: "Jagorar TIN Najeriya", desc: "Jagorar Hausa don TIN a Najeriya: takardu, kudi, lokaci da hanyar tabbatarwa.", href: "/ha/kayan-aiki/jagorar-tin-najeriya/", category: "ecommerce", lang: 'ha', status: 'live', phase: 'LIVE' },
        "ng-pension": { name: "Kalkuletan Fansho Najeriya", desc: "Kiyasta gudummawar CPS, kudin RSA da kudin ritaya a Hausa.", href: "/ha/kayan-aiki/fansho-najeriya/", category: "financial", lang: 'ha', status: 'live', phase: 'LIVE' },
        "ng-pension-ha": { name: "Kalkuletan Fansho Najeriya", desc: "Kiyasta gudummawar CPS, kudin RSA da kudin ritaya a Hausa.", href: "/ha/kayan-aiki/fansho-najeriya/", category: "financial", lang: 'ha', status: 'live', phase: 'LIVE' },
        "ng-nhf": { name: "Kalkuletan NHF Najeriya", desc: "Lissafa gudummawar NHF, biyan lamunin gida da iyakar iya biya a Hausa.", href: "/ha/kayan-aiki/nhf-najeriya/", category: "financial", lang: 'ha', status: 'live', phase: 'LIVE' },
        "ng-nhf-ha": { name: "Kalkuletan NHF Najeriya", desc: "Lissafa gudummawar NHF, biyan lamunin gida da iyakar iya biya a Hausa.", href: "/ha/kayan-aiki/nhf-najeriya/", category: "financial", lang: 'ha', status: 'live', phase: 'LIVE' },
        "document-pdf": { name: "Takardu da PDF", desc: "Hub din Hausa don hada PDF, raba PDF, matsa PDF, CV, takardar kudi da kayan takardu.", href: "/ha/takardu-da-pdf/", category: "document-pdf", lang: 'ha' },
        "document-pdf-ha": { name: "Takardu da PDF", desc: "Hub din Hausa don hada PDF, raba PDF, matsa PDF, CV, takardar kudi da kayan takardu.", href: "/ha/takardu-da-pdf/", category: "document-pdf", lang: 'ha' },
        "invoice-generator": { name: "Kirkiro takardar kudi", desc: "Kirkiri takardar kudi da VAT, bayanan biyan kudi, fitar da PDF, ajiyar JSON da hanyar rabawa a Hausa.", href: "/ha/kayan-aiki/kirkiro-invoice/", category: "document-pdf", lang: 'ha' },
        "invoice-generator-ha": { name: "Kirkiro takardar kudi", desc: "Kirkiri takardar kudi da VAT, bayanan biyan kudi, fitar da PDF, ajiyar JSON da hanyar rabawa a Hausa.", href: "/ha/kayan-aiki/kirkiro-invoice/", category: "document-pdf", lang: 'ha' },
        "receipt-generator": { name: "Kirkiro Resit", desc: "Kirkiro resit mai VAT, QR, daftarin da aka ajiye, PDF, TXT, CSV, JSON da zabin bugawa a Hausa.", href: "/ha/kayan-aiki/kirkiro-resit/", category: "document-pdf", lang: 'ha' },
        "receipt-generator-ha": { name: "Kirkiro Resit", desc: "Kirkiro resit mai VAT, QR, daftarin da aka ajiye, PDF, TXT, CSV, JSON da zabin bugawa a Hausa.", href: "/ha/kayan-aiki/kirkiro-resit/", category: "document-pdf", lang: 'ha' },
        "naira-to-words": { name: "Naira zuwa kalmomi", desc: "Mayar da adadin Naira zuwa rubutun kalmomi domin cheque, resit, takardar kudi ko takardu.", href: "/ha/kayan-aiki/naira-zuwa-kalmomi/", category: "document-pdf", lang: 'ha' },
        "naira-to-words-ha": { name: "Naira zuwa kalmomi", desc: "Mayar da adadin Naira zuwa rubutun kalmomi domin cheque, resit, takardar kudi ko takardu.", href: "/ha/kayan-aiki/naira-zuwa-kalmomi/", category: "document-pdf", lang: 'ha' },
        "education-ha": { name: "Ilimi a Hausa", desc: "Hub din Hausa don JAMB, WAEC, NECO, NYSC, GPA, tallafin karatu da kudin makaranta.", href: "/ha/ilimi/", category: "education", lang: 'ha' },
        "school-fees": { name: "Kwatanta kudin makaranta", desc: "Shafin Hausa don kudin koyarwa, karin kudade da iya biya; shafin kwatancen Turanci yana nan idan an bukata.", href: "/ha/kayan-aiki/kwatanta-kudin-makaranta/", category: "education", lang: 'ha' },
        "jamb-aggregate": { name: "Kalkuletan jimillar JAMB", desc: "Lissafa jimillar maki na JAMB da iyakar maki ta sashen jami'o'in Najeriya a Hausa.", href: "/ha/kayan-aiki/kalkuletan-jamb/", category: "education", lang: 'ha' },
        "waec-calculator": { name: "Kalkuletan WAEC/NECO", desc: "Kokoto WAEC, NECO, O'Level da cancantar JAMB cikin sauki a Hausa.", href: "/ha/kayan-aiki/kalkuletan-waec-neco/", category: "education", lang: 'ha' },
        "nysc-allowance": { name: "Kalkuletan alawus na NYSC", desc: "Kokoto alawus na NYSC, karin kudin jiha, kudin gefe da kasafin wata a Hausa.", href: "/ha/kayan-aiki/alawus-na-nysc/", category: "education", lang: 'ha' },
        "jamb-english-ha": { name: "JAMB Turanci a Hausa", desc: "Jagorar Hausa don fahimtar karatu, kalmomi, jimla da atisaye.", href: "/ha/jamb/turanci/", category: "education", lang: 'ha', status: 'live', phase: 'LIVE' },
        "jamb-mathematics-ha": { name: "JAMB Lissafi a Hausa", desc: "Jagorar Hausa don algebra, geometry, kididdiga da dabarun JAMB.", href: "/ha/jamb/lissafi/", category: "education", lang: 'ha', status: 'live', phase: 'LIVE' },
        "jamb-physics-ha": { name: "JAMB Fisiks a Hausa", desc: "Jagorar Hausa don motsi, zafi, haske da wutar lantarki.", href: "/ha/jamb/fisiks/", category: "education", lang: 'ha', status: 'live', phase: 'LIVE' },
        "jamb-chemistry-ha": { name: "JAMB Kimiyya a Hausa", desc: "Jagorar Hausa don atom, sinadarai da lissafin Kimiyya.", href: "/ha/jamb/kimiyya/", category: "education", lang: 'ha', status: 'live', phase: 'LIVE' },
        "jamb-biology-ha": { name: "JAMB Nazarin Halittu a Hausa", desc: "Jagorar Hausa don kwayar halitta, gado, muhalli da jikin mutum.", href: "/ha/jamb/halittu/", category: "education", lang: 'ha', status: 'live', phase: 'LIVE' },
        "gpa-calculator": { name: "Kalkuletan GPA/CGPA", desc: "Lissafa GPA na zango da CGPA daga maki da raka a Hausa.", href: "/ha/kayan-aiki/kalkuletan-gpa-cgpa/", category: "education", lang: 'ha', status: 'live', phase: 'LIVE' },
        "gpa-calculator-ha": { name: "Kalkuletan GPA/CGPA", desc: "Lissafa GPA na zango da CGPA daga maki da raka a Hausa.", href: "/ha/kayan-aiki/kalkuletan-gpa-cgpa/", category: "education", lang: 'ha', status: 'live', phase: 'LIVE' },
        "scholarship-finder": { name: "Mai nemo tallafin karatu", desc: "Shirya neman tallafi, takardu, matakin karatu da hanyar tabbatar da asalin dama a Hausa.", href: "/ha/kayan-aiki/neman-tallafin-karatu/", category: "education", lang: 'ha', status: 'live', phase: 'LIVE' },
        "scholarship-finder-ha": { name: "Mai nemo tallafin karatu", desc: "Shirya neman tallafi, takardu, matakin karatu da hanyar tabbatar da asalin dama a Hausa.", href: "/ha/kayan-aiki/neman-tallafin-karatu/", category: "education", lang: 'ha', status: 'live', phase: 'LIVE' },
        "student-budget": { name: "Kasafin dalibi", desc: "Kiyasta kudin makaranta, haya, abinci, sufuri da ragowar kudi a Hausa.", href: "/ha/kayan-aiki/kasafin-dalibi/", category: "education", lang: 'ha', status: 'live', phase: 'LIVE' },
        "student-budget-ha": { name: "Kasafin dalibi", desc: "Kiyasta kudin makaranta, haya, abinci, sufuri da ragowar kudi a Hausa.", href: "/ha/kayan-aiki/kasafin-dalibi/", category: "education", lang: 'ha', status: 'live', phase: 'LIVE' },
        "hausa-translator": { name: "Mai fassara Hausa", desc: "Kundin jimlolin Hausa, kasuwa, tafiya da rubutun farko a Hausa.", href: "/ha/kayan-aiki/mai-fassara-hausa/", category: "language", lang: 'ha', status: 'live', phase: 'LIVE' },
        "hausa-translator-ha": { name: "Mai fassara Hausa", desc: "Kundin jimlolin Hausa, kasuwa, tafiya da rubutun farko a Hausa.", href: "/ha/kayan-aiki/mai-fassara-hausa/", category: "language", lang: 'ha', status: 'live', phase: 'LIVE' },
        "language-ha": { name: "Harshe da Fassara a Hausa", desc: "Hub din Hausa yana nuna mai fassara, kundin jimloli, fassarar PDF da shafukan Turanci a fili.", href: "/ha/harshe-da-fassara/", category: "language", lang: 'ha', status: 'live', phase: 'LIVE' },
        "telecom-ussd": { name: "Lambobin USSD", desc: "Lambobin USSD na sadarwa, banki, bayanan intanet, katin waya, ragowar kudi da kudin wayar hannu.", href: "/ha/kayan-aiki/lambobin-ussd/", category: "telecom", lang: 'ha' },
        "whatsapp-link": { name: "Mai gina link din WhatsApp", desc: "Gina hanyar wa.me, sako, QR da tarin hanyoyi ga kasuwanci.", href: "/ha/kayan-aiki/whatsapp-link/", category: "telecom", lang: 'ha' },
        "telecom-data-usage": { name: "Kiyasin amfani da intanet", desc: "Kiyasta GB da ake bukata a wata daga lilo, bidiyo, kira, karatu da aiki a Hausa.", href: "/ha/kayan-aiki/amfanin-bayanan-intanet/", category: "telecom", lang: 'ha', status: 'live', phase: 'LIVE' },
        "telecom-data-usage-ha": { name: "Kiyasin amfani da intanet", desc: "Kiyasta GB da ake bukata a wata daga lilo, bidiyo, kira, karatu da aiki a Hausa.", href: "/ha/kayan-aiki/amfanin-bayanan-intanet/", category: "telecom", lang: 'ha', status: 'live', phase: 'LIVE' },
        "telecom-data-plan-ha": { name: "Kwatanta kunshin intanet", desc: "Kwatanta kamfanin sadarwa, GB, farashi da tsawon aiki; tabbatar da farashi daga manhaja ko USSD.", href: "/ha/kayan-aiki/kwatanta-kunshin-intanet/", category: "telecom", lang: 'ha', status: 'live', phase: 'LIVE' },
        "telecom-airtime-ha": { name: "Darajar katin waya", desc: "Kiyasta darajar katin waya idan ana maida shi kudi, tare da gargadin tabbatar da biyan kudi.", href: "/ha/kayan-aiki/darajar-katin-waya/", category: "telecom", lang: 'ha', status: 'live', phase: 'LIVE' },
        "mobile-money-fees": { name: "Kudin tura kudi ta waya", desc: "Kiyasta caji da jimillar tura kudi ta waya a Hausa; tabbatar da manhajar biya ko wakili.", href: "/ha/kayan-aiki/kudin-tura-kudi-ta-waya/", category: "telecom", lang: 'ha', status: 'live', phase: 'LIVE' },
        "mobile-money-fees-ha": { name: "Kudin tura kudi ta waya", desc: "Kiyasta caji da jimillar tura kudi ta waya a Hausa; tabbatar da manhajar biya ko wakili.", href: "/ha/kayan-aiki/kudin-tura-kudi-ta-waya/", category: "telecom", lang: 'ha', status: 'live', phase: 'LIVE' },
        "sim-registration": { name: "Rajistar layin waya da NIN", desc: "Jagorar Hausa don shirya rajistar layin waya, NIN, shaida da abin da za a duba.", href: "/ha/kayan-aiki/rajistar-layin-waya-nin/", category: "telecom", lang: 'ha', status: 'live', phase: 'LIVE' },
        "sim-registration-ha": { name: "Rajistar layin waya da NIN", desc: "Jagorar Hausa don shirya rajistar layin waya, NIN, shaida da abin da za a duba.", href: "/ha/kayan-aiki/rajistar-layin-waya-nin/", category: "telecom", lang: 'ha', status: 'live', phase: 'LIVE' },
        "ussd-simulator": { name: "Mai gwada USSD - shafi na Turanci", desc: "Gwada tsarin USSD ko menu na fasahar kudi da taimakon kwastoma kafin kaddamarwa.", href: "/tools/ussd-simulator/", category: "developer", lang: 'en' },
        "farm-profit-calculator": { name: "Ribar gona", desc: "Kokoto kudin iri, taki, aiki, sufuri, asara bayan girbi da ROI a Najeriya.", href: "/ha/kayan-aiki/ribar-gona/", category: "agriculture", lang: 'ha' },
        "farm-profit-nigeria": { name: "Ribar gona Najeriya", desc: "Kokoto ribar noma a Najeriya: rogo, masara, shinkafa, doya da dawa.", href: "/ha/kayan-aiki/ribar-gona/", category: "agriculture", lang: 'ha' },
        "crop-yield-estimator": { name: "Amfanin gona Najeriya", desc: "Kiyasta amfanin gona, asara bayan girbi, farashin sayarwa da yawan amfanin gona.", href: "/ha/noma/amfanin-gona-najeriya/", category: "agriculture", lang: 'ha' },
        "crop-yield-nigeria": { name: "Amfanin gona Najeriya", desc: "Kiyasta tan a hekta, jimillar amfanin gona da zangon kudin shiga ga amfanin gona a Najeriya.", href: "/ha/noma/amfanin-gona-najeriya/", category: "agriculture", lang: 'ha' },
        "fertilizer-calculator": { name: "Kalkuletan Taki / NPK", desc: "Kiyasta buhunan taki, NPK, tallafi da kudin taki a gona.", href: "/ha/noma/taki-najeriya/", category: "agriculture", lang: 'ha' },
        "fertilizer-nigeria": { name: "Taki Najeriya", desc: "Kiyasta NPK, Urea, buhunan taki, tallafi da jadawalin amfani ga amfanin gona a Najeriya.", href: "/ha/noma/taki-najeriya/", category: "agriculture", lang: 'ha' },
        "irrigation-nigeria": { name: "Ban ruwa Najeriya", desc: "Kiyasta bukatar ruwa, jadawalin ban ruwa, asarar ruwa da kudin aiki a Hausa.", href: "/ha/noma/ban-ruwa-najeriya/", category: "agriculture", lang: 'ha', status: 'live', phase: 'LIVE' },
        "irrigation-nigeria-ha": { name: "Ban ruwa Najeriya", desc: "Kiyasta bukatar ruwa, jadawalin ban ruwa, asarar ruwa da kudin aiki a Hausa.", href: "/ha/noma/ban-ruwa-najeriya/", category: "agriculture", lang: 'ha', status: 'live', phase: 'LIVE' },
        "seed-rate-nigeria-ha": { name: "Yawan iri Najeriya", desc: "Kiyasta yawan iri, kayan dasa, tazarar shuka, yawan tsiro da kudin iri a Hausa.", href: "/ha/noma/yawan-iri-najeriya/", category: "agriculture", lang: 'ha', status: 'live', phase: 'LIVE' },
        "cassava-processing-calculator": { name: "Sarrafa rogo Najeriya", desc: "Kwatanta garri, garin fufu, HQCF, gutsuren rogo da sitaci ta riba da lokacin dawo da jari.", href: "/ha/kayan-aiki/sarrafa-rogo/", category: "agriculture", lang: 'ha' },
        "staple-basket": { name: "Kwandon kasuwa", desc: "Duba farashin kwandon abinci, kiyasin gida da rahoton farashi da aka duba a Hausa.", href: "/ha/kayan-aiki/kwandon-kasuwa/", category: "agriculture", lang: 'ha' },
        "commodity-prices": { name: "Farashin kayayyakin gona", desc: "Kiyasta kudin shiga daga farashin kayayyakin gona, sufuri da ragin lalacewa a Hausa.", href: "/ha/kayan-aiki/farashin-kayayyakin-gona/", category: "agriculture", lang: 'ha', status: 'live', phase: 'LIVE' },
        "commodity-prices-ha": { name: "Farashin kayayyakin gona", desc: "Kiyasta kudin shiga daga farashin kayayyakin gona, sufuri da ragin lalacewa a Hausa.", href: "/ha/kayan-aiki/farashin-kayayyakin-gona/", category: "agriculture", lang: 'ha', status: 'live', phase: 'LIVE' },
        "livestock-feed-nigeria": { name: "Kalkuletan abincin dabbobi", desc: "Kiyasta yawan abincin shanu, awaki ko tumaki da kudin ciyarwa a Najeriya a Hausa.", href: "/ha/kayan-aiki/abincin-dabbobi/", category: "agriculture", lang: 'ha', status: 'live', phase: 'LIVE' },
        "livestock-feed-nigeria-ha": { name: "Kalkuletan abincin dabbobi", desc: "Kiyasta yawan abincin shanu, awaki ko tumaki da kudin ciyarwa a Najeriya a Hausa.", href: "/ha/kayan-aiki/abincin-dabbobi/", category: "agriculture", lang: 'ha', status: 'live', phase: 'LIVE' },
        "fish-farming-nigeria": { name: "Kalkuletan ribar kiwon kifi", desc: "Kiyasta kudin shiga, kudin abinci da ribar kiwon kifi a Najeriya a Hausa.", href: "/ha/kayan-aiki/ribar-kiwon-kifi/", category: "agriculture", lang: 'ha', status: 'live', phase: 'LIVE' },
        "fish-farming-nigeria-ha": { name: "Kalkuletan ribar kiwon kifi", desc: "Kiyasta kudin shiga, kudin abinci da ribar kiwon kifi a Najeriya a Hausa.", href: "/ha/kayan-aiki/ribar-kiwon-kifi/", category: "agriculture", lang: 'ha', status: 'live', phase: 'LIVE' },
        "medical-report": { name: "Fassarar rahoton lafiya - shafi na Turanci", desc: "Fuskar amfani tana Turanci tukuna; yi amfani da ita a matsayin shafi na Turanci domin bayanin sakamakon gwaji.", href: "/tools/medical-report/", category: "health", lang: 'en' },
        "genotype-checker": { name: "Genotype da rukunin jini", desc: "Duba AA, AS, SS, AC, SC, CC da rukunin jini a Hausa; tabbatar da genotype da dakin gwaji ko kwararren lafiya.", href: "/ha/kayan-aiki/duba-genotype/", category: "health", lang: 'ha', status: 'live', phase: 'LIVE' },
        "sickle-cell": { name: "Jagorar Genotype da Sikila", desc: "Fahimci yiwuwar gado da jadawalin Punnett a Hausa; bayani ne kawai, ba ganewar cuta ba.", href: "/ha/kayan-aiki/sickle-cell/", category: "health", lang: 'ha', status: 'live', phase: 'LIVE' },
        "hospital-cost": { name: "Kudin asibiti", desc: "Kiyasta kudin asibiti, haihuwa, hotunan gwaji da hidimomin magani a Hausa; tabbatar da asibiti.", href: "/ha/kayan-aiki/kudin-asibiti/", category: "health", lang: 'ha' },
        "drug-price-compare": { name: "Kwatanta farashin magani", desc: "Kwatanta maganin kamfani da na gama gari a Hausa; tabbatar da likitan magunguna ko likita.", href: "/ha/kayan-aiki/kwatanta-farashin-magani/", category: "health", lang: 'ha' },
        "childbirth-cost": { name: "Kudin haihuwa", desc: "Kiyasta ANC, haihuwa, kulawar bayan haihuwa da karin kudin magani a Hausa; ba shawarar likita ba.", href: "/ha/kayan-aiki/kudin-haihuwa/", category: "health", lang: 'ha' },
        "african-meal-plan": { name: "Tsarin abincin Afirka", desc: "Gina tsarin abinci na kwanaki 7 da calories, BMR/TDEE da jerin siyayya a Hausa.", href: "/ha/kayan-aiki/abincin-afirka/", category: "health", lang: 'ha' },
        "cv-builder": { name: "Mai gina CV", desc: "Fara tsara CV da suna, buri, kwarewa, ilimi da aiki a Hausa.", href: "/ha/kayan-aiki/gina-cv/", category: "document-pdf", lang: 'ha', status: 'live', phase: 'LIVE' },
        "cv-builder-ha": { name: "Mai gina CV", desc: "Fara tsara CV da suna, buri, kwarewa, ilimi da aiki a Hausa.", href: "/ha/kayan-aiki/gina-cv/", category: "document-pdf", lang: 'ha', status: 'live', phase: 'LIVE' },
        "cover-letter": { name: "Rubuta wasikar neman aiki", desc: "Gina daftarin wasikar neman aiki daga mukami, kamfani da kwarewar da ta dace.", href: "/ha/kayan-aiki/rubuta-wasikar-aiki/", category: "document-pdf", lang: 'ha', status: 'live', phase: 'LIVE' },
        "cover-letter-ha": { name: "Rubuta wasikar neman aiki", desc: "Gina daftarin wasikar neman aiki daga mukami, kamfani da kwarewar da ta dace.", href: "/ha/kayan-aiki/rubuta-wasikar-aiki/", category: "document-pdf", lang: 'ha', status: 'live', phase: 'LIVE' },
        "pdf-workspace": { name: "Wurin aikin PDF", desc: "Zabi hada PDF, raba PDF, matsa PDF ko bude cikakken wurin aikin Turanci a fili.", href: "/ha/kayan-aiki/wurin-aikin-pdf/", category: "document-pdf", lang: 'ha', status: 'live', phase: 'LIVE' },
        "pdf-workspace-ha": { name: "Wurin aikin PDF", desc: "Zabi hada PDF, raba PDF, matsa PDF ko bude cikakken wurin aikin Turanci a fili.", href: "/ha/kayan-aiki/wurin-aikin-pdf/", category: "document-pdf", lang: 'ha', status: 'live', phase: 'LIVE' },
        "pdf-convert-ha": { name: "Canja PDF", desc: "Shafin Hausa don shirya canja PDF, Word, Excel, CSV, rubutu ko hoto kafin bude cikakken kayan aikin Turanci.", href: "/ha/kayan-aiki/canza-pdf/", category: "document-pdf", lang: 'ha', status: 'live', phase: 'LIVE' },
        "pdf-editor": { name: "Gyara PDF - shafi na Turanci", desc: "Gyara PDF cikin burauza, kara rubutu, saini ko alama. Fuskar amfani tana Turanci tukuna.", href: "/tools/pdf-editor/", category: "document-pdf", lang: 'en' },
        "pdf-merge-split": { name: "Hada da raba PDF", desc: "Hada PDFs ko raba shafuka cikin sauki.", href: "/ha/kayan-aiki/hada-da-raba-pdf/", category: "document-pdf", lang: 'ha' },
        "pdf-merge-split-ha": { name: "Hada da raba PDF", desc: "Hada PDFs ko raba shafuka cikin sauki.", href: "/ha/kayan-aiki/hada-da-raba-pdf/", category: "document-pdf", lang: 'ha' },
        "pdf-compress": { name: "Matsa PDF", desc: "Rage girman PDF domin loda fayil, imel ko WhatsApp.", href: "/ha/kayan-aiki/matsa-pdf/", category: "document-pdf", lang: 'ha' },
        "pdf-compress-ha": { name: "Matsa PDF", desc: "Rage girman PDF domin loda fayil, imel ko WhatsApp.", href: "/ha/kayan-aiki/matsa-pdf/", category: "document-pdf", lang: 'ha' }
      };

      const localizeSwDiscoveryTool = (tool) => {
        const override = SW_DISCOVERY_OVERRIDES[tool.id];
        return override ? Object.assign({}, tool, override, { lang: 'sw', status: tool.status || 'live' }) : null;
      };

      const localizeHaDiscoveryTool = (tool) => {
        const override = HA_DISCOVERY_OVERRIDES[tool.id];
        return override ? Object.assign({}, tool, override, { lang: override.lang || 'ha', status: override.status || tool.status || 'live' }) : null;
      };

      const dedupeToolsByHref = (items) => {
        const seen = new Set();
        return items.filter(tool => {
          const key = normalizeDiscoveryHref(tool.href || tool.id);
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
      };

      let toolRegistryLoadPromise = null;
      const ensureToolRegistry = () => {
        if (typeof AFRO_TOOLS !== 'undefined' && Array.isArray(AFRO_TOOLS)) {
          return Promise.resolve(AFRO_TOOLS);
        }
        if (toolRegistryLoadPromise) return toolRegistryLoadPromise;
        toolRegistryLoadPromise = new Promise(resolve => {
          let settled = false;
          const finish = () => {
            if (settled) return;
            settled = true;
            document.removeEventListener('afrotools:registry-ready', onReady);
            resolve((typeof AFRO_TOOLS !== 'undefined' && Array.isArray(AFRO_TOOLS)) ? AFRO_TOOLS : null);
          };
          const onReady = () => finish();
          document.addEventListener('afrotools:registry-ready', onReady, { once: true });
          const existing = document.querySelector('script[src*="tool-registry"]');
          if (existing) {
            if (typeof AFRO_TOOLS !== 'undefined' && Array.isArray(AFRO_TOOLS)) finish();
            else setTimeout(finish, 250);
            return;
          }
          const script = document.createElement('script');
          script.src = '/assets/js/components/tool-registry.min.js';
          script.defer = true;
          script.onload = finish;
          script.onerror = finish;
          document.head.appendChild(script);
        });
        return toolRegistryLoadPromise;
      };

      const getTools = () => {
        if (typeof AFRO_TOOLS !== 'undefined' && Array.isArray(AFRO_TOOLS)) {
          var pageLang = this._getLang();
          if (pageLang === 'sw') {
            var swTools = AFRO_TOOLS.filter(t => (t.status === 'live' || t.status === 'new') && (t.lang || 'en') === 'sw');
            var swHrefs = new Set(swTools.map(t => normalizeDiscoveryHref(t.href || t.id)));
            var swFallbackTools = AFRO_TOOLS
              .filter(t => (t.status === 'live' || t.status === 'new') && (t.lang || 'en') === 'en')
              .map(localizeSwDiscoveryTool)
              .filter(Boolean)
              .filter(t => !swHrefs.has(normalizeDiscoveryHref(t.href || t.id)));

            return dedupeToolsByHref(swTools.concat(swFallbackTools));
          }

          if (pageLang === 'ha') {
            var haTools = AFRO_TOOLS.filter(t => (t.status === 'live' || t.status === 'new') && (t.lang || 'en') === 'ha');
            var haHrefs = new Set(haTools.map(t => normalizeDiscoveryHref(t.href || t.id)));
            var haFallbackTools = AFRO_TOOLS
              .filter(t => (t.status === 'live' || t.status === 'new') && (t.lang || 'en') === 'en')
              .map(localizeHaDiscoveryTool)
              .filter(Boolean)
              .filter(t => !haHrefs.has(normalizeDiscoveryHref(t.href || t.id)));

            return dedupeToolsByHref(haTools.concat(haFallbackTools));
          }

          return AFRO_TOOLS.filter(t => t.status === 'live' && (t.lang || 'en') === pageLang);
        }
        return null;
      };

      const escapeHtml = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');

      const highlightMatch = (text, query) => {
        if (!query) return escapeHtml(text);
        const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return escapeHtml(text).replace(new RegExp('(' + escaped + ')', 'gi'), '<mark>$1</mark>');
      };

      const normalizeSearchText = value => String(value || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();

      const SW_SEARCH_INTENT_TARGETS = {
        paye: ['/sw/mshahara-na-kodi/paye', '/sw/mshahara-na-kodi', '/sw/kenya/kikokotoo-kodi-mshahara', '/sw/tanzania/kikokotoo-kodi-mshahara', '/sw/uganda/kikokotoo-kodi-mshahara'],
        mshahara: ['/sw/mshahara-na-kodi', '/sw/mshahara-na-kodi/paye', '/sw/zana/kikokotoo-kima-cha-chini-cha-mshahara', '/sw/kenya/kikokotoo-kodi-mshahara', '/sw/tanzania/kikokotoo-kodi-mshahara'],
        vat: ['/sw/zana/kikokotoo-vat', '/sw/vat-na-kodi', '/sw/biashara-na-uzingatiaji', '/sw/kenya/kikokotoo-vat', '/sw/tanzania/kikokotoo-vat', '/sw/uganda/kikokotoo-vat'],
        fedha: ['/sw/fintech', '/sw/mali-na-mikopo', '/sw/sarafu', '/sw/zana/kibadilishaji-sarafu', '/sw/zana/ulinganisho-uhamishaji-pesa'],
        sheria: ['/sw/serikali-na-nyaraka', '/sw/kazi-na-nyaraka', '/sw/zana/tamko-la-kisheria', '/sw/zana/ustahiki-wa-msaada-wa-kisheria', '/sw/zana/gdpr-dhidi-ya-sheria-za-afrika'],
        kazi: ['/sw/kazi-na-ajira', '/sw/kazi-na-nyaraka', '/sw/mshahara-na-kodi', '/sw/zana/mjenzi-cv', '/sw/zana/barua-ombi'],
        hajj: ['/sw/zana/bajeti-ya-hajj-na-umrah', '/sw/dini-na-utamaduni'],
        zakat: ['/sw/zana/kikokotoo-zakat', '/sw/dini-na-utamaduni'],
        ujenzi: ['/sw/ujenzi-na-uhandisi', '/sw/zana/kikokotoo-gharama-za-ujenzi', '/sw/zana/mjenzi-boq', '/sw/zana/kikokotoo-nondo', '/sw/zana/mchanganyiko-wa-zege'],
        internet: ['/sw/zana/kilinganisha-intaneti', '/sw/mawasiliano-na-mtandao', '/sw/zana/kikokotoo-intaneti-ya-biashara'],
        tafsiri: ['/sw/lugha-na-tafsiri', '/sw/zana/mtafsiri-wa-kiswahili', '/sw/zana/kutafsiri-pdf', '/sw/zana/mtafsiri-wa-kifaransa-afrika'],
        mkopo: ['/sw/mali-na-mikopo', '/sw/zana/kikokotoo-mkopo-wa-nyumba', '/sw/zana/mkopo-wa-gari', '/sw/zana/ustahiki-wa-mkopo-wa-shamba'],
        sarafu: ['/sw/sarafu', '/sw/mshahara-na-kodi/fx', '/sw/zana/kibadilishaji-sarafu', '/sw/fintech'],
        cv: ['/sw/zana/mjenzi-cv', '/sw/kazi-na-nyaraka', '/sw/kazi-na-ajira', '/sw/hati-na-pdf'],
        tin: ['/sw/zana/mwongozo-tin', '/sw/biashara-na-uzingatiaji', '/sw/vat-na-kodi'],
        bima: ['/sw/bima', '/sw/afya-na-bima', '/sw/zana/kilinganisha-bima-ya-afya', '/sw/zana/kikokotoo-bima-ya-gari', '/sw/zana/kikokotoo-bima-ya-biashara'],
        pdf: ['/sw/hati-na-pdf', '/sw/zana-za-pdf', '/sw/zana/kituo-cha-pdf', '/sw/zana/hariri-pdf', '/sw/zana/chat-na-pdf']
      };

      const SW_SEARCH_DIRECT_RESULTS = {
        blogu: [
          { name: 'Blogu ya AfroTools kwa Kiswahili', desc: 'Daraja la Kiswahili kwa makala za PAYE, VAT, fedha, mobile money na kilimo. Baadhi ya makala hufunguka kwa Kiingereza.', href: '/sw/blogu/', icon: 'B', status: 'live', priority: 120 }
        ],
        mshahara: [
          { name: 'Mshahara na Kodi', desc: 'Kitovu cha PAYE, mshahara, kima cha chini, muda wa ziada, likizo na hifadhi ya jamii kwa Afrika.', href: '/sw/mshahara-na-kodi/', icon: 'PAYE', status: 'live', priority: 120 },
          { name: 'Vikokotoo vya PAYE', desc: 'Tafuta kikokotoo cha kodi ya mshahara kwa nchi husika na ufungue njia ya PAYE inayofaa.', href: '/sw/mshahara-na-kodi/paye/', icon: 'PAYE', status: 'live', priority: 110 }
        ],
        kazi: [
          { name: 'Kazi na Ajira', desc: 'Kitovu cha CV, mahojiano, ofa, majadiliano ya mshahara, mikataba na nyaraka za kazi.', href: '/sw/kazi-na-ajira/', icon: 'JOB', status: 'live', priority: 120 },
          { name: 'Kazi na Nyaraka', desc: 'Zana za barua ya ombi, CV, mkataba wa ajira, payslip na nyaraka za HR.', href: '/sw/kazi-na-nyaraka/', icon: 'DOC', status: 'live', priority: 110 }
        ],
        api: [
          { name: 'API ya AfroTools kwa Kiswahili', desc: 'Daraja la Kiswahili kuelekea API, endpoints, JSON, token na bei ambazo bado zina nyaraka za Kiingereza.', href: '/sw/api/', icon: 'API', status: 'live', priority: 120 },
          { name: 'Saraka ya API za Afrika', desc: 'Mwongozo wa Kiswahili wa kuchagua API za fedha, kodi, sarafu na data za Afrika.', href: '/sw/zana/saraka-ya-api-afrika/', icon: 'API', status: 'live', priority: 110 },
          { name: 'Kituo cha Developer', desc: 'Zana za developer zinazobaki ndani ya kivinjari, pamoja na madaraja kwenda nyaraka za API.', href: '/sw/zana/kituo-cha-developer/', icon: 'DEV', status: 'live', priority: 100 },
          { name: 'Zana za Developer kwa Kiswahili', desc: 'Kitovu cha JSON, SQL, API testing, USSD, Docker, PWA na zana za kivinjari kwa wasanidi.', href: '/sw/zana-za-developer/', icon: 'DEV', status: 'live', priority: 95 }
        ],
        internet: [
          { name: 'Mawasiliano na Mtandao', desc: 'Kitovu cha Kiswahili kwa data, intaneti, ISP, LTE, 5G, roaming, USSD, SMS na WhatsApp Business.', href: '/sw/mawasiliano-na-mtandao/', icon: 'NET', status: 'live', priority: 120 },
          { name: 'Kilinganisha Intaneti', desc: 'Linganisha gharama, kasi, fiber, LTE, 5G na ISP kwa matumizi ya nyumbani au biashara.', href: '/sw/zana/kilinganisha-intaneti/', icon: 'NET', status: 'live', priority: 110 }
        ],
        tafsiri: [
          { name: 'Lugha na Tafsiri', desc: 'Kitovu cha watafsiri, lugha za Afrika, transliteration na tafsiri za hati kwa tahadhari.', href: '/sw/lugha-na-tafsiri/', icon: 'LANG', status: 'live', priority: 120 },
          { name: 'Mtafsiri wa Kiswahili', desc: 'Msaada wa Kiswahili na kamusi ya misemo kwa biashara, kazi na mawasiliano ya kila siku.', href: '/sw/zana/mtafsiri-wa-kiswahili/', icon: 'LANG', status: 'live', priority: 110 },
          { name: 'Kutafsiri PDF', desc: 'Tafsiri hati kwa tahadhari; hakiki tafsiri za kisheria, matibabu au rasmi na mtaalamu.', href: '/sw/zana/kutafsiri-pdf/', icon: 'PDF', status: 'live', priority: 100 }
        ],
        ujenzi: [
          { name: 'Ujenzi na Uhandisi', desc: 'Kitovu cha CAD, BOQ, zege, nondo, paa, gharama na upangaji wa miradi ya ujenzi.', href: '/sw/ujenzi-na-uhandisi/', icon: 'ENG', status: 'live', priority: 120 },
          { name: 'Kikokotoo Gharama za Ujenzi', desc: 'Kadiria gharama za kazi, vifaa, contingency na hatua za mradi kabla ya kuomba bei rasmi.', href: '/sw/zana/kikokotoo-gharama-za-ujenzi/', icon: 'ENG', status: 'live', priority: 110 }
        ],
        mkopo: [
          { name: 'Mali, Nyumba na Mikopo', desc: 'Kitovu cha mikopo, nyumba, uwezo wa kulipa na zana za kupanga kabla ya kusaini.', href: '/sw/mali-na-mikopo/', icon: 'LOAN', status: 'live', priority: 120 },
          { name: 'Kikokotoo cha Mkopo wa Nyumba', desc: 'Kadiria malipo, riba, muda na uwezo wa kulipa mkopo wa nyumba kwa muktadha wa Afrika.', href: '/sw/zana/kikokotoo-mkopo-wa-nyumba/', icon: 'LOAN', status: 'live', priority: 110 }
        ]
      };

      const getCategoryLabel = (catId) => {
        const cat = NAV_ITEMS.find(c => c.id === catId);
        return cat ? localizedItemText(cat, 'label', this._getLang()) : catId;
      };

      const searchTools = (query) => {
        const tools = getTools();
        if (!tools) return null;
        if (!query || query.length < 1) return [];
        const q = normalizeSearchText(query);
        const queryTokens = q.split(/\s+/).filter(Boolean);
        const pageLang = this._getLang();
        const intentTargets = pageLang === 'sw' ? (SW_SEARCH_INTENT_TARGETS[q] || []) : [];
        const directResults = pageLang === 'sw' ? (SW_SEARCH_DIRECT_RESULTS[q] || []) : [];
        const scored = [];
        for (const t of tools) {
          const nameL = normalizeSearchText(t.name);
          const descL = normalizeSearchText(t.desc);
          const metaL = [
            descL,
            normalizeSearchText(t.href || ''),
            normalizeSearchText(t.id || ''),
            normalizeSearchText(t.category || '')
          ].join(' ');
          let score = 0;
          if (nameL === q) score = 100;
          else if (nameL.startsWith(q)) score = 80;
          else if (nameL.includes(q)) score = 60;
          else if (metaL.includes(q)) score = 30;
          else {
            const allMatch = queryTokens.every(w => nameL.includes(w) || metaL.includes(w));
            if (allMatch) score = 20;
          }
          const intentRank = intentTargets.indexOf(normalizeDiscoveryHref(t.href || t.id));
          if (intentRank !== -1) score += 90 - (intentRank * 10);
          if (score > 0) scored.push({ tool: t, score });
        }
        scored.sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
          return (b.tool.priority || 0) - (a.tool.priority || 0);
        });
        const seen = new Set();
        return directResults.concat(scored.map(s => s.tool)).filter(tool => {
          const key = normalizeDiscoveryHref(tool.href || tool.id);
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        }).slice(0, 8);
      };

      const normalizeCountryQuery = value => String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();

      const renderCountryResults = (input, container, limit) => {
        if (!input || !container) return;
        var lang = this._getLang();
        var countryUi = {
          loading: lang === 'sw' ? 'Inapakia nchi...' : lang === 'ha' ? 'Ana loda kasashe...' : lang === 'yo' ? 'Ó ń kojú àwọn orílẹ̀-èdè...' : 'Loading countries...',
          empty: lang === 'sw' ? 'Hakuna nchi inayolingana' : lang === 'ha' ? 'Ba a sami kasar da ta dace ba' : lang === 'yo' ? 'A kò rí orílẹ̀-èdè tó bá mu' : 'No exact country found',
          viewAll: lang === 'sw' ? 'Nchi zote' : lang === 'ha' ? 'Duk kasashe' : lang === 'yo' ? 'Wo gbogbo rẹ̀' : 'View all',
          open: lang === 'sw' ? 'Fungua' : lang === 'ha' ? 'Bude' : lang === 'yo' ? 'Ṣí' : 'Open',
        };
        var query = input.value.trim();
        if (!query) {
          container.innerHTML = '';
          return;
        }
        container.innerHTML = '<div class="country-search-result" aria-live="polite">' + countryUi.loading + '</div>';
        this._loadCountryData().then(countries => {
          var q = normalizeCountryQuery(query);
          var results = this._countrySearchItems(countries).filter(country => {
            return normalizeCountryQuery(country.label + ' ' + country.meta).indexOf(q) !== -1;
          }).slice(0, limit || 6);
          if (!results.length) {
            container.innerHTML = '<a class="country-search-result" href="' + this._countriesHref() + '"><span>' + countryUi.empty + '</span><span class="country-search-meta">' + countryUi.viewAll + '</span></a>';
            return;
          }
          container.innerHTML = results.map(country => {
            return '<a class="country-search-result" role="option" href="' + country.href + '"><span>' + escapeHtml(country.label) + '</span><span class="country-search-meta">' + escapeHtml(country.meta || countryUi.open) + '</span></a>';
          }).join('');
        });
      };

      const bindCountrySearch = (input, container, limit) => {
        if (!input || !container) return;
        input.addEventListener('focus', () => this._loadCountryData());
        input.addEventListener('input', () => renderCountryResults(input, container, limit));
        input.addEventListener('keydown', e => {
          if (e.key !== 'Enter') return;
          e.preventDefault();
          var first = container.querySelector('a');
          window.location.href = first ? first.href : this._countriesHref();
        });
      };

      bindCountrySearch(countrySearchInput, countrySearchResults, 6);
      bindCountrySearch(mobileCountrySearchInput, mobileCountrySearchResults, 5);

      // ── Search capture: send queries to /api/capture-search for product intelligence ──
      let _captureTimer = null;
      let _captureCount = 0;
      const _captureSessionId = (() => {
        try {
          let sid = sessionStorage.getItem('_afro_search_sid');
          if (!sid) { sid = crypto.randomUUID(); sessionStorage.setItem('_afro_search_sid', sid); }
          return sid;
        } catch { return null; }
      })();

      const captureSearch = (query, resultsCount, source) => {
        clearTimeout(_captureTimer);
        if (!query || query.length < 2 || _captureCount >= 20) return;
        _captureTimer = setTimeout(() => {
          _captureCount++;
          try {
            const payload = JSON.stringify({
              query: query.slice(0, 200),
              results_count: resultsCount,
              source: source || 'navbar',
              page_url: location.href,
              session_id: _captureSessionId
            });
            if (navigator.sendBeacon) {
              navigator.sendBeacon('/api/capture-search', payload);
            }
          } catch {}
        }, 500);
      };

      const renderResults = (tools, query, container) => {
        const lang = this._getLang();
        const searchUi = {
          loadingTools: lang === 'sw' ? 'Inapakia zana…' : lang === 'ha' ? 'Ana loda kayan aiki...' : lang === 'yo' ? 'Ó ń kojú irinṣẹ...' : 'Loading tools…',
          registryWait: lang === 'sw' ? 'Orodha ya zana bado inapakia' : lang === 'ha' ? 'Jerin kayan aiki bai gama lodi ba' : lang === 'yo' ? 'Àtòjọ irinṣẹ kò tíì parí kíkójú' : 'Tool registry not loaded yet',
          recentlyUsed: lang === 'sw' ? 'Zilizotumika hivi karibuni' : lang === 'ha' ? 'An yi amfani da su kwanan nan' : lang === 'yo' ? 'Èyí tí a lo laipẹ' : 'Recently Used',
          clearRecent: lang === 'sw' ? 'Futa' : lang === 'ha' ? 'Goge' : lang === 'yo' ? 'Pa rẹ́' : 'Clear',
          allToolsLabel: lang === 'sw' ? 'Zana zote za Kiswahili' : lang === 'ha' ? 'Kayan aikin Hausa' : lang === 'yo' ? 'Irinṣẹ Yorùbá' : 'All Tools',
          typeToSearch: lang === 'sw' ? 'Andika PAYE, PDF, VAT, WAEC au jina la nchi' : lang === 'ha' ? 'Rubuta PAYE, PDF, VAT, JAMB, WAEC ko Nigeria' : lang === 'yo' ? 'Tẹ PAYE, PDF, VAT, JAMB, WAEC tàbí Naijiria' : 'Type to search 2,594+ tools',
          searchEmpty: lang === 'sw' ? 'Tafuta zana za Kiswahili na Afrika' : lang === 'ha' ? 'Bincika kayan aikin Hausa da Afirka' : lang === 'yo' ? 'Wá irinṣẹ Yoruba àti Afirika' : 'Search 2,594+ African tools',
          searchHint: lang === 'sw' ? 'Jaribu "PAYE", "PDF", "VAT", "WAEC"...' : lang === 'ha' ? 'Gwada "PAYE", "JAMB", "WAEC", "PDF"...' : lang === 'yo' ? 'Gbìyànjú "PAYE", "JAMB", "WAEC", "PDF"...' : 'Try "PAYE", "PDF", "japa", "BMI"...',
          noToolsFound: lang === 'sw' ? 'Hakuna zana iliyopatikana' : lang === 'ha' ? 'Ba a sami kayan aiki ba' : lang === 'yo' ? 'A kò rí irinṣẹ kankan' : 'No tools found',
          differentSearch: lang === 'sw' ? 'Jaribu neno jingine au jina la nchi' : lang === 'ha' ? 'Gwada wata kalma ko sunan kasa' : lang === 'yo' ? 'Gbìyànjú ọ̀rọ̀ míràn tàbí orúkọ orílẹ̀-èdè' : 'Try a different search term',
        };
        if (tools === null) {
          container.innerHTML = '<div class="search-empty"><div class="search-empty-icon">⏳</div><div class="search-empty-text">' + searchUi.loadingTools + '</div><div class="search-empty-hint">' + searchUi.registryWait + '</div></div>';
          return;
        }
        if (!query || query.length < 1) {
          // Show recently used tools if any
          const recent = getRecent();
          if (recent.length > 0) {
            container.innerHTML = '<div class="search-section-label">' + searchUi.recentlyUsed + ' <button class="recent-clear" id="clearRecent">' + searchUi.clearRecent + '</button></div>' +
              recent.map((t, i) => `
                <a href="${t.href}" class="search-result${i === 0 ? ' active' : ''}" data-idx="${i}" role="option" aria-selected="${i === 0}">
                  <div class="search-result-icon">${escapeHtml(t.icon || '🔧')}</div>
                  <div>
                    <div class="search-result-name">${escapeHtml(t.name)}</div>
                  </div>
                </a>`).join('') +
              '<div class="search-section-label" style="padding-top:16px">' + searchUi.allToolsLabel + '</div>' +
              '<div class="search-empty" style="padding:16px"><div class="search-empty-hint">' + searchUi.typeToSearch + '</div></div>';
            _activeIdx = 0;
            container.querySelector('#clearRecent')?.addEventListener('click', e => {
              e.preventDefault(); e.stopPropagation();
              try { localStorage.removeItem(RECENT_KEY); } catch {}
              container.innerHTML = '<div class="search-empty"><div class="search-empty-icon">🔍</div><div class="search-empty-text">' + searchUi.searchEmpty + '</div><div class="search-empty-hint">' + searchUi.searchHint + '</div></div>';
            });
            return;
          }
          container.innerHTML = '<div class="search-empty"><div class="search-empty-icon">🔍</div><div class="search-empty-text">' + searchUi.searchEmpty + '</div><div class="search-empty-hint">' + searchUi.searchHint + '</div></div>';
          return;
        }
        if (tools.length === 0) {
          container.innerHTML = '<div class="search-empty"><div class="search-empty-icon">😔</div><div class="search-empty-text">' + searchUi.noToolsFound + '</div><div class="search-empty-hint">' + searchUi.differentSearch + '</div></div>';
          return;
        }
        _activeIdx = 0;
        container.innerHTML = tools.map((t, i) => `
          <a href="${t.href}" class="search-result${i === 0 ? ' active' : ''}" data-idx="${i}" role="option" aria-selected="${i === 0}">
            <div class="search-result-icon">${escapeHtml(t.icon || '🔧')}</div>
            <div>
              <div class="search-result-name">${highlightMatch(t.name, query)}</div>
              <div class="search-result-desc">${escapeHtml(t.desc)}</div>
              <div class="search-result-cat">${escapeHtml(getCategoryLabel(t.category))}</div>
            </div>
          </a>`).join('');
      };

      // ── MOBILE SEARCH (desktop search handled by command-palette.js) ──
      const mobileSearchText = () => {
        var lang = this._getLang();
        return {
          loading: lang === 'sw' ? 'Inapakia zana...' : lang === 'ha' ? 'Ana loda kayan aiki...' : lang === 'yo' ? 'Ó ń kojú irinṣẹ...' : 'Loading tools...',
          empty: lang === 'sw' ? 'Hakuna zana iliyopatikana' : lang === 'ha' ? 'Ba a sami kayan aiki ba' : lang === 'yo' ? 'A kò rí irinṣẹ kankan' : 'No tools found',
        };
      };
      let _mobDebounce;
      mobSearchInput?.addEventListener('input', () => {
        clearTimeout(_mobDebounce);
        _mobDebounce = setTimeout(() => {
          const q = mobSearchInput.value.trim();
          if (!q) {
            mobSearchResults.innerHTML = '';
            mobCategoriesWrap.style.display = '';
            if (mobCountryBlock) mobCountryBlock.style.display = '';
            if (mobBusinessBlock) mobBusinessBlock.style.display = '';
            return;
          }
          const results = searchTools(q);
          if (results === null) {
            mobSearchResults.innerHTML = '<div class="mob-search-empty">' + mobileSearchText().loading + '</div>';
            mobCategoriesWrap.style.display = 'none';
            if (mobCountryBlock) mobCountryBlock.style.display = 'none';
            if (mobBusinessBlock) mobBusinessBlock.style.display = 'none';
            ensureToolRegistry().then(tools => {
              if (mobSearchInput.value.trim() !== q) return;
              if (Array.isArray(tools)) {
                mobSearchInput.dispatchEvent(new Event('input', { bubbles: true }));
              } else {
                mobSearchResults.innerHTML = '<div class="mob-search-empty">' + mobileSearchText().empty + '</div>';
              }
            });
            return;
          }
          if (results.length === 0) {
            mobSearchResults.innerHTML = '<div class="mob-search-empty">' + mobileSearchText().empty + '</div>';
            mobCategoriesWrap.style.display = 'none';
            if (mobCountryBlock) mobCountryBlock.style.display = 'none';
            if (mobBusinessBlock) mobBusinessBlock.style.display = 'none';
            // Analytics: track mobile search no results
            if (q && q.length >= 2 && window.AfroTools?.analytics) {
              window.AfroTools.analytics.trackSearch(q, 0, 'navbar');
              window.AfroTools.analytics.trackSearchNoResults(q, 'navbar');
            }
            captureSearch(q, 0, 'navbar');
            return;
          }
          mobCategoriesWrap.style.display = 'none';
          if (mobCountryBlock) mobCountryBlock.style.display = 'none';
          if (mobBusinessBlock) mobBusinessBlock.style.display = 'none';
          mobSearchResults.innerHTML = results.map(t => `
            <a href="${t.href}" class="search-result" role="option">
              <div class="search-result-icon">${escapeHtml(t.icon || '🔧')}</div>
              <div>
                <div class="search-result-name">${highlightMatch(t.name, q)}</div>
                <div class="search-result-desc">${escapeHtml(t.desc)}</div>
              </div>
            </a>`).join('');
          // Analytics: track mobile search
          if (q && q.length >= 2 && window.AfroTools?.analytics) {
            window.AfroTools.analytics.trackSearch(q, results.length, 'navbar');
          }
          captureSearch(q, results.length, 'navbar');
        }, 100);
      });

      // Clear mobile search when closing drawer
      // ── AUTH STATE: update Sign-in button when user logs in/out ──
      const loginBtn = sr.querySelector('.btn-login');
      const proBtn = sr.querySelector('.btn-pro');
      const mobLoginBtn = sr.querySelector('.mob-login');
      const mobProLink = sr.querySelector('.mob-pro-link');
      const mobVaultLink = sr.querySelector('.mob-vault-link');
      const mobPointsLink = sr.querySelector('.mob-points-link');

      var _apBadgeLoaded = false;
      var _apBadgeRequestToken = '';
      var _proNavRequestToken = 0;
      const readNavJson = (key) => {
        try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch(e) { return null; }
      };
      const isExpiredProValue = (value) => {
        if (!value) return false;
        var time = Date.parse(value);
        return !Number.isNaN(time) && time <= Date.now();
      };
      const sameNavUser = (base, extra) => {
        if (!base || !extra) return false;
        if (base.id && extra.id && base.id === extra.id) return true;
        if (base.email && extra.email && String(base.email).toLowerCase() === String(extra.email).toLowerCase()) return true;
        return false;
      };
      const mergeCachedProUser = (user, status) => {
        if (!user || !user.id) return null;
        var merged = Object.assign({}, user);
        var profile = status && status.profile || status && status.user || null;
        if (profile && sameNavUser(user, profile)) {
          merged = Object.assign(merged, profile, {
            tier: profile.subscription_tier || profile.tier || merged.tier || 'free',
            subscription_tier: profile.subscription_tier || profile.tier || merged.subscription_tier || merged.tier || 'free',
            subscription_expires_at: profile.subscription_expires_at || merged.subscription_expires_at || null
          });
        }
        var cachedProfile = readNavJson('afro_profile_cache');
        if (cachedProfile && cachedProfile.user && sameNavUser(user, cachedProfile.user)) {
          var cachedUser = cachedProfile.user;
          merged = Object.assign(merged, cachedUser, {
            tier: cachedUser.subscription_tier || cachedUser.tier || merged.tier || 'free',
            subscription_tier: cachedUser.subscription_tier || cachedUser.tier || merged.subscription_tier || merged.tier || 'free',
            subscription_expires_at: cachedUser.subscription_expires_at || merged.subscription_expires_at || null
          });
        }
        var cachedStatus = readNavJson('afro_pro_status_cache');
        var cacheFresh = cachedStatus && cachedStatus.cachedAt && Date.now() - Number(cachedStatus.cachedAt) < 5 * 60 * 1000;
        var cacheMatches = cachedStatus && (!cachedStatus.email || String(cachedStatus.email).toLowerCase() === String(user.email || '').toLowerCase());
        if (cacheFresh && cacheMatches) {
          merged.tier = cachedStatus.tier || merged.tier;
          merged.subscription_tier = cachedStatus.tier || merged.subscription_tier || merged.tier;
          merged.subscription_expires_at = cachedStatus.expiresAt || merged.subscription_expires_at || null;
          if (cachedStatus.isPro && !isExpiredProValue(merged.subscription_expires_at)) {
            merged.tier = merged.tier || 'pro';
            merged.subscription_tier = merged.subscription_tier || 'pro';
          }
        }
        return merged;
      };
      const isProUser = (user) => {
        var tier = String((user && (user.subscription_tier || user.tier || user.plan)) || '').toLowerCase();
        var role = String((user && user.role) || '').toLowerCase();
        var expiry = user && (user.subscription_expires_at || user.pro_expires_at || user.expires_at);
        return (role === 'admin' || role === 'owner' || ['pro', 'premium', 'team', 'business', 'enterprise', 'lifetime', 'trialing'].indexOf(tier) !== -1) && !isExpiredProValue(expiry);
      };
      const setProNav = (user, status) => {
        user = mergeCachedProUser(user, status);
        var _lang = this._getLang();
        var _proHref = _lang === 'fr' ? '/fr/pro/' : '/pro/';
        var _workspaceHref = _lang === 'fr' ? '/fr/pro/' : '/pro/workspace/';
        var _isPro = isProUser(user);
        var _hasUser = !!(user && user.id);
        var _label = _isPro
          ? (_lang === 'sw' ? 'Eneo la Pro' : _lang === 'fr' ? 'Espace Pro' : _lang === 'ha' ? 'Wurin Pro' : 'Pro Workspace')
          : _hasUser
            ? (_lang === 'sw' ? 'Pata Pro' : _lang === 'fr' ? 'Passer Pro' : _lang === 'ha' ? 'Samu Pro' : 'Upgrade Pro')
            : 'Pro';
        var _href = _isPro ? _workspaceHref : _proHref;
        var _proAria = _isPro
          ? (_lang === 'sw' ? 'Fungua eneo la AfroTools Pro' : _lang === 'fr' ? 'Ouvrir l’espace Pro AfroTools' : _lang === 'ha' ? 'Bude wurin AfroTools Pro' : 'Open AfroTools Pro Workspace')
          : (_lang === 'fr' ? 'Ouvrir les offres AfroTools Pro' : _lang === 'ha' ? 'Bude tsarin AfroTools Pro' : 'Open AfroTools Pro plans');
        if (proBtn) {
          proBtn.textContent = _label;
          proBtn.href = _href;
          proBtn.className = 'btn-pro' + (_isPro ? ' is-pro' : _hasUser ? ' is-free' : '');
          proBtn.setAttribute('aria-label', _proAria);
        }
        if (mobProLink) {
          mobProLink.textContent = _isPro ? _label : (_hasUser ? _label : 'AfroTools Pro');
          mobProLink.href = _href;
          mobProLink.className = 'mob-pro-link' + (_isPro ? ' is-pro' : _hasUser ? ' is-free' : '');
          mobProLink.setAttribute('aria-label', _proAria);
        }
      };
      const refreshProNavFromGate = (user) => {
        if (!user || !user.id || !window.AfroProGate || typeof window.AfroProGate.getStatus !== 'function') return;
        var requestToken = ++_proNavRequestToken;
        window.AfroProGate.getStatus({ fresh: false }).then(function(status) {
          if (requestToken !== _proNavRequestToken) return;
          if (!window.AfroAuth || !AfroAuth.isLoggedIn || !AfroAuth.isLoggedIn()) return;
          var activeUser = AfroAuth.getUser ? AfroAuth.getUser() : user;
          if (!sameNavUser(user, activeUser)) return;
          setProNav(activeUser, status);
        }).catch(function() {});
      };
      const resetSignedOutAuthUI = () => {
        _apBadgeLoaded = false;
        _apBadgeRequestToken = '';
        sr.querySelectorAll('.ap-nav-badge').forEach(function(el) { el.remove(); });
        setProNav(null);
        if (mobVaultLink) mobVaultLink.style.display = 'none';
        if (mobPointsLink) {
          mobPointsLink.style.display = 'none';
          mobPointsLink.textContent = '🎯 AfroPoints';
        }
      };
      const clearRejectedAuth = (reason) => {
        if (window.AfroAuthSessionBridge && typeof window.AfroAuthSessionBridge.clear === 'function') {
          window.AfroAuthSessionBridge.clear(reason);
          return;
        }
        try {
          localStorage.removeItem('afro_auth_v2');
          localStorage.removeItem('afro_session_v3');
          localStorage.removeItem('afro_profile_cache');
        } catch(e) {}
        window.dispatchEvent(new CustomEvent('afro-auth-change', { detail: { user: null, authenticated: false, reason: reason || 'session-rejected' } }));
      };
      const updateAuthUI = () => {
        var _lang = this._getLang();
        var _dashboardHref = _lang === 'fr' ? '/fr/dashboard/' : '/dashboard/';
        var _authHref = (_lang === 'fr' ? '/fr/auth/' : '/auth/') + '?mode=login&next=' + encodeURIComponent(_dashboardHref);
        var _dashboardLabel = _lang === 'fr' ? 'Tableau de bord' : _lang === 'ha' ? 'Allon aiki' : 'Dashboard';
        setProNav(null);
        if (typeof AfroAuth === 'undefined' || !AfroAuth.isLoggedIn || !AfroAuth.isLoggedIn()) {
          resetSignedOutAuthUI();
          // Not logged in — show Sign in (i18n)
          var _signLabel = _lang === 'sw' ? 'Ingia' : _lang === 'fr' ? 'Connexion' : _lang === 'ha' ? 'Shiga' : 'Sign in';
          if (loginBtn) {
            loginBtn.className = 'btn-login';
            loginBtn.textContent = _signLabel;
            loginBtn.href = _authHref;
            loginBtn.removeAttribute('aria-label');
            loginBtn.removeAttribute('title');
            loginBtn.onclick = function(e) { if (typeof AfroAuth !== 'undefined' && AfroAuth.openModal) { e.preventDefault(); AfroAuth.openModal(); } };
          }
          if (mobLoginBtn) {
            mobLoginBtn.textContent = _signLabel;
            mobLoginBtn.href = _authHref;
            mobLoginBtn.onclick = function(e) { if (typeof AfroAuth !== 'undefined' && AfroAuth.openModal) { e.preventDefault(); AfroAuth.openModal(); } };
          }
          return;
        }
        const user = AfroAuth.getUser();
        setProNav(user);
        refreshProNavFromGate(user);
        const displayName = this._cleanDisplayName(user && user.name, _dashboardLabel);
        const name = displayName.split(' ')[0] || _dashboardLabel;
        const safeName = this._escapeHtml(name);
        const initial = this._escapeHtml((name[0] || 'D').toUpperCase());
        // Desktop: show avatar initial + first name
        if (loginBtn) {
          loginBtn.className = 'btn-login is-user';
          loginBtn.href = _dashboardHref;
          loginBtn.onclick = null;
          loginBtn.setAttribute('aria-label', displayName + ' - ' + _dashboardLabel);
          loginBtn.setAttribute('title', displayName + ' - ' + _dashboardLabel);
          loginBtn.innerHTML = '<span class="nav-user-avatar" aria-hidden="true">' + initial + '</span><span class="nav-user-name user-menu-name">' + safeName + '</span>';
        }
        // AfroPoints badge — show points balance next to avatar (once only)
        if (!_apBadgeLoaded) {
          _apBadgeLoaded = true;
          try {
            var token = AfroAuth.getSessionToken ? AfroAuth.getSessionToken() : null;
            if (token) {
              _apBadgeRequestToken = token;
              fetch('/.netlify/functions/afropoints-profile', { headers: { Authorization: 'Bearer ' + token } })
                .then(function(r) {
                  if (r.status === 401 || r.status === 403) {
                    resetSignedOutAuthUI();
                    clearRejectedAuth('afropoints-profile-rejected');
                    return null;
                  }
                  return r.json();
                })
                .then(function(p) {
                  if (!p || p.error || !(p.current_balance >= 0)) return;
                  var activeToken = null;
                  try { activeToken = AfroAuth.getSessionToken ? AfroAuth.getSessionToken() : null; } catch(e) {}
                  if (!AfroAuth.isLoggedIn || !AfroAuth.isLoggedIn() || activeToken !== _apBadgeRequestToken) return;
                  sr.querySelectorAll('.ap-nav-badge').forEach(function(el) { el.remove(); });
                  var badge = document.createElement('a');
                  badge.href = '/tools/afropoints/';
                  badge.className = 'ap-nav-badge';
                  badge.title = 'AfroPoints Balance';
                  var pts = p.current_balance || 0;
                  var display = pts >= 10000 ? (pts / 1000).toFixed(1) + 'k' : pts.toLocaleString();
                  badge.textContent = '🎯 ' + display;
                  if (p.current_streak > 0) badge.textContent += ' 🔥';
                  if (loginBtn && loginBtn.parentNode) loginBtn.parentNode.insertBefore(badge, loginBtn.nextSibling);
                  // Update mobile points link with balance
                  if (mobPointsLink) mobPointsLink.textContent = '🎯 AfroPoints — ' + display + (p.current_streak > 0 ? ' 🔥' : '');
                }).catch(function() {});
            }
          } catch(e) {}
        }
        // Mobile: show name + vault link
        if (mobLoginBtn) {
          mobLoginBtn.href = _dashboardHref;
          mobLoginBtn.onclick = null;
          mobLoginBtn.textContent = name + ' \u2014 ' + _dashboardLabel;
        }
        if (mobVaultLink) mobVaultLink.style.display = '';
        if (mobPointsLink) mobPointsLink.style.display = '';
      };

      // Run on initial load (auth may already be ready)
      const tryInitialAuth = () => {
        if (typeof AfroAuth !== 'undefined' && AfroAuth.isLoggedIn) {
          updateAuthUI();
        }
      };
      // Check immediately and also after a short delay (auth script may not be loaded yet)
      tryInitialAuth();
      setTimeout(tryInitialAuth, 500);
      setTimeout(tryInitialAuth, 1500);

      // Listen for auth state changes
      window.addEventListener('afro-auth-change', updateAuthUI);
      window.addEventListener('afro-pro-gate-ready', updateAuthUI);
      window.addEventListener('dashboard-auth-state-change', function(event) {
        var state = event && event.detail && event.detail.state;
        if (state === 'signedOut' || state === 'sessionError') {
          resetSignedOutAuthUI();
          clearRejectedAuth('dashboard-' + state);
        }
      });
    }

    _lockBodyScroll() {
      if (this._bodyLocked) return;
      this._lockedScrollY = window.scrollY || window.pageYOffset || 0;
      document.body.style.position = 'fixed';
      document.body.style.top = '-' + this._lockedScrollY + 'px';
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      this._bodyLocked = true;
    }

    _unlockBodyScroll() {
      if (!this._bodyLocked) return;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      window.scrollTo(0, this._lockedScrollY || 0);
      this._bodyLocked = false;
    }
  }

  function _globalNavLang() {
    var segs = window.location.pathname.split('/');
    var first = segs[1];
    if (['fr','sw','yo','ha'].indexOf(first) !== -1) return first;
    return document.documentElement.lang || 'en';
  }

  function _markEnglishOnlyToolsForLang(tools, lang) {
    if ((lang !== 'sw' && lang !== 'yo') || !Array.isArray(tools)) return tools;
    var localizedRoot = '/' + lang + '/';
    var marker = lang === 'yo' ? '(ojú ìwé Gẹẹsi)' : '(Kiingereza tu)';
    return tools.map(function(tool) {
      var href = tool.href || '';
      if (href.indexOf(localizedRoot) === 0 || tool.badge === 'EN') return tool;
      var copy = Object.assign({}, tool);
      if (copy.label && copy.label.indexOf(marker) === -1) {
        copy.label += ' ' + marker;
      }
      copy.badge = 'EN';
      return copy;
    });
  }

  function _localizedGlobalNavItems() {
    var lang = _globalNavLang();
    if (lang !== 'fr' && lang !== 'sw' && lang !== 'yo' && lang !== 'ha') return NAV_ITEMS;
    return NAV_ITEMS.map(function(item) {
      var copy = Object.assign({}, item);
      if (lang === 'fr') {
        if (item.hrefFr) copy.href = item.hrefFr;
        if (item.labelFr) copy.label = item.labelFr;
        if (item.descFr) copy.desc = item.descFr;
        if (item.toolsFr) copy.tools = item.toolsFr;
      } else if (lang === 'sw') {
        var swHref = SW_CATEGORY_HREFS[item.id] || item.hrefSw;
        if (swHref) copy.href = swHref;
        copy.label = localizedItemText(item, 'label', lang);
        copy.desc = localizedItemText(item, 'desc', lang);
        copy.tools = item.toolsSw || _markEnglishOnlyToolsForLang(item.tools, lang);
      } else if (lang === 'ha') {
        var haHref = HA_CATEGORY_HREFS[item.id] || item.hrefHa;
        if (haHref) copy.href = haHref;
        copy.label = localizedItemText(item, 'label', lang);
        copy.desc = localizedItemText(item, 'desc', lang);
        if (item.toolsHa) copy.tools = item.toolsHa;
      } else if (lang === 'yo') {
        var yoHref = YO_CATEGORY_HREFS[item.id] || item.hrefYo;
        if (yoHref) copy.href = yoHref;
        copy.label = localizedItemText(item, 'label', lang);
        copy.desc = localizedItemText(item, 'desc', lang);
        copy.tools = item.toolsYo || _markEnglishOnlyToolsForLang(item.tools, lang);
      }
      return copy;
    });
  }

  /* Expose localized NAV_ITEMS globally for command palette + other consumers */
  window.__AFRO_NAV_ITEMS = _localizedGlobalNavItems();
  window.__AFRO_BUSINESS_NAV_ITEMS = localizedBusinessLinks(_globalNavLang()).slice();

  if (!customElements.get('afro-navbar')) {
    customElements.define('afro-navbar', AfroNavbar);
  }

  (function _countrySelectorLoader() {
    if (customElements.get('afro-country-selector')) return;
    if (document.querySelector('script[src*="country-selector.js"]')) return;
    var s = document.createElement('script');
    s.id = 'afro-country-selector-js';
    s.src = '/assets/js/components/country-selector.js?v=2';
    s.defer = true;
    document.head.appendChild(s);
  })();

  /* ── LAZY-LOAD AUTH SYSTEM (every page gets login/signup capability) ── */
  function _hasLocalAuthHint() {
    try {
      return !!(window.localStorage && (localStorage.getItem('afro_auth_v2') || localStorage.getItem('afro_session_v3')));
    } catch (err) {
      return false;
    }
  }

  setTimeout(function() {
    function _authLS(src, cb) {
      if (document.querySelector('script[src*="' + src.split('/').pop() + '"]')) { if (cb) cb(); return; }
      var s = document.createElement('script');
      s.src = src;
      s.onload = function() { if (cb) cb(); };
      s.onerror = function() { if (cb) cb(); };
      document.body.appendChild(s);
    }
    function _canUseAuthCookieBridge() {
      try {
        var host = window.location.hostname || '';
        return !/^(localhost|127\.0\.0\.1|::1)$/.test(host) || !!window.AFROTOOLS_ENABLE_LOCAL_AUTH_API;
      } catch (err) {
        return true;
      }
    }
    _authLS('/assets/js/data/african-countries.js', function() {
      _authLS('/assets/js/afro-auth.js', function() {
        _authLS('/assets/js/components/auth-modal.js', function() {
          if (_canUseAuthCookieBridge()) _authLS('/assets/js/auth-cookie-upgrade.js?v=4');
        });
      });
    });
  }, _hasLocalAuthHint() ? 800 : 12000);

  /* ── PWA: inject manifest, theme-color & service worker from navbar (every page) ── */
  (function _pwa() {
    if (!document.querySelector('link[rel="manifest"]')) {
      const l = document.createElement('link'); l.rel = 'manifest'; l.href = '/manifest.json';
      document.head.appendChild(l);
    }
    if (!document.querySelector('meta[name="theme-color"]')) {
      const m = document.createElement('meta'); m.name = 'theme-color'; m.content = '#0062CC';
      document.head.appendChild(m);
    }
    const s = document.createElement('script'); s.src = '/assets/js/pwa-install.js'; s.defer = true;
    document.head.appendChild(s);
  })();

  /* ── DEFERRED SCRIPTS: load after main thread is idle ── */
  var _idle = window.requestIdleCallback || function(cb) { setTimeout(cb, 1500); };

  /* Analytics: load early (not idle-deferred) so auto-tracking initializes on DOMContentLoaded */
  if (!document.getElementById('afro-analytics-js')) {
    var _as = document.createElement('script'); _as.id = 'afro-analytics-js';
    _as.src = '/assets/js/lib/analytics.js'; document.head.appendChild(_as);
  }

  _idle(function() {
    /* Animations */
    var skipDecorativeMotion = false;
    try {
      skipDecorativeMotion = window.matchMedia && window.matchMedia('(max-width: 720px), (prefers-reduced-motion: reduce)').matches;
    } catch (err) {}
    if (skipDecorativeMotion) {
      document.querySelectorAll('.rv, .rv-scale').forEach(function(el) { el.classList.add('in'); });
    } else {
      if (!document.getElementById('afro-animations-css')) {
        var l = document.createElement('link'); l.id = 'afro-animations-css';
        l.rel = 'stylesheet'; l.href = '/assets/css/animations.css';
        document.head.appendChild(l);
      }
      if (!document.getElementById('afro-animations-js')) {
        var s = document.createElement('script'); s.id = 'afro-animations-js';
        s.src = '/assets/js/animations.js'; s.defer = true;
        document.head.appendChild(s);
      }
    }

    /* Error boundary (global error handler + UI helpers) */
    if (!document.getElementById('afro-error-boundary-js')) {
      var eb = document.createElement('script'); eb.id = 'afro-error-boundary-js';
      eb.src = '/assets/js/lib/error-boundary.js'; eb.defer = true;
      document.head.appendChild(eb);
    }

    /* Command Palette (Ctrl+K search) */
    if (!document.getElementById('afro-cmd-palette-js')) {
      var cp = document.createElement('script'); cp.id = 'afro-cmd-palette-js';
      cp.src = '/assets/js/components/command-palette.js'; cp.defer = true;
      document.head.appendChild(cp);
    }

    /* Pro gate */
    if (window.AfroProGate || document.getElementById('afro-pro-gate-js') || document.querySelector('script[src*="/assets/js/pro-gate.js"]')) {
      window.dispatchEvent(new CustomEvent('afro-pro-gate-ready'));
    } else {
      var pg = document.createElement('script'); pg.id = 'afro-pro-gate-js'; pg.src = '/assets/js/pro-gate.js'; pg.defer = true;
      pg.onload = function() { window.dispatchEvent(new CustomEvent('afro-pro-gate-ready')); };
      document.head.appendChild(pg);
    }

    /* Share image (tool pages only) */
    if (document.querySelector('.action-row') && !document.getElementById('afro-share-img-js')) {
      var si = document.createElement('script'); si.id = 'afro-share-img-js';
      si.src = '/assets/js/share-image-inject.js'; si.defer = true;
      document.head.appendChild(si);
    }
  });

  /* Auth: load afro-auth.js (consolidated Supabase auth) */
  setTimeout(function() { _idle(function() {
    if (window._afroAuthLoaded) return;
    if (!document.getElementById('afro-auth-js')) {
      var s = document.createElement('script'); s.id = 'afro-auth-js';
      s.src = '/assets/js/afro-auth.js?v=6'; document.head.appendChild(s);
    }
  }); }, _hasLocalAuthHint() ? 800 : 12000);
})();
