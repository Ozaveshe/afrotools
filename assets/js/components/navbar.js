/**
 * AFROTOOLS NAVBAR — Web Component
 * Colour: #f0f5f2 light sage — clean, breathable, distinctly African
 * Mobile drawer: untouched — white, perfect
 * Dropdown: JS-controlled for reliability (hover + click)
 */
(function () {
  'use strict';

  const TOOLS = [
    { label: 'Salary & Tax',        href: '/salary-tax',       icon: '💰', desc: 'PAYE, income tax, take-home' },
    { label: 'VAT & Business Tax',  href: '/vat-business-tax', icon: '🧾', desc: 'VAT, CIT, business levies' },
    { label: 'Mortgage & Property', href: '/mortgage',          icon: '🏠', desc: 'Loans, repayments, LTV' },
    { label: 'Business & ROI',      href: '/business-roi',      icon: '📈', desc: 'ROI, margins, break-even' },
    { label: 'Education',           href: '/education',         icon: '🎓', desc: 'Fees, student costs' },
    { label: 'Health & Insurance',  href: '/health-insurance',  icon: '🏥', desc: 'Premiums, cover, savings' },
  ];

  const MARK = `<svg viewBox="0 0 68 68" fill="none" xmlns="http://www.w3.org/2000/svg" style="height:30px;width:30px;flex-shrink:0">
    <polygon points="34,20 48,34 34,48 20,34" fill="#00c873"/>
    <polygon points="34,2  44,14 34,20 24,14" fill="#F5A623"/>
    <polygon points="34,48 44,60 34,68 24,60" fill="#008751"/>
    <polygon points="2,24  14,34 2,44  -10,34" fill="#5ddb9e" opacity="0.7"/>
    <polygon points="52,24 64,34 52,44 40,34"  fill="#5ddb9e" opacity="0.55"/>
  </svg>`;

  const CSS = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&display=swap');

    *, *::before, *::after {
      box-sizing: border-box; margin: 0; padding: 0;
      font-family: 'DM Sans', system-ui, -apple-system, sans-serif;
      -webkit-font-smoothing: antialiased;
    }
    :host { display: block; }

    /* ─────────────────────────────────────────────
       NAV SHELL — Crisp white
       Clean, high contrast. Green CTA + logo pop.
    ───────────────────────────────────────────── */
    nav {
      position: sticky; top: 0; z-index: 500;
      height: 60px;
      background: #ffffff;
      border-bottom: 1px solid #e9ede9;
      display: flex; align-items: center;
      padding: 0 20px;
      transition: box-shadow 0.2s;
    }
    nav.scrolled {
      box-shadow: 0 2px 16px rgba(0,0,0,0.08);
    }

    .inner {
      max-width: 1200px; margin: 0 auto; width: 100%;
      display: flex; align-items: center; gap: 4px;
    }

    /* ─────────────────────────────────────────────
       LOGO
    ───────────────────────────────────────────── */
    .logo {
      display: flex; align-items: center; gap: 9px;
      text-decoration: none; flex-shrink: 0; margin-right: 16px;
    }
    .logo-text { line-height: 1; }
    .logo-name {
      font-size: 1rem; font-weight: 800; letter-spacing: 0.02em;
      color: #111827;
    }
    .logo-name b { color: #008751; }
    .logo-tagline {
      font-size: 0.47rem; font-weight: 600; letter-spacing: 0.18em;
      text-transform: uppercase; color: #9ca3af;
      display: block; margin-top: 2px;
    }

    /* ─────────────────────────────────────────────
       NAV LINKS
    ───────────────────────────────────────────── */
    .nav-links {
      display: flex; align-items: center;
      list-style: none; flex: 1; gap: 2px;
    }
    li { position: relative; }

    .lnk {
      display: flex; align-items: center; gap: 5px;
      padding: 7px 12px; border-radius: 6px;
      font-size: 0.84rem; font-weight: 600;
      color: #374151;
      text-decoration: none; border: none; background: transparent;
      cursor: pointer; white-space: nowrap;
      transition: color 0.15s, background 0.15s;
      min-height: 40px;
    }
    .lnk:hover  { color: #008751; background: #f0f9f4; }
    .lnk.open   { color: #008751; background: #f0f9f4; }
    .lnk.active { color: #008751; }

    .chev {
      width: 8px; height: 5px; flex-shrink: 0;
      opacity: 0.4; transition: transform 0.2s, opacity 0.15s;
      color: #374151;
    }
    .lnk.open .chev { transform: rotate(180deg); opacity: 1; color: #008751; }

    /* ─────────────────────────────────────────────
       DROPDOWN — JS-driven, not CSS hover
       Visible when .lnk has class .open
    ───────────────────────────────────────────── */
    .drop {
      position: absolute; top: calc(100% + 10px); left: 50%;
      transform: translateX(-50%) translateY(-4px);
      width: 300px; background: #ffffff;
      border: 1px solid #e0ebe4;
      border-radius: 12px;
      box-shadow: 0 12px 40px rgba(0,60,30,0.14), 0 2px 8px rgba(0,0,0,0.06);
      padding: 6px; opacity: 0; visibility: hidden;
      transition: opacity 0.16s ease, visibility 0.16s ease, transform 0.16s ease;
      z-index: 600;
      pointer-events: none;
    }
    .drop.open {
      opacity: 1; visibility: visible;
      transform: translateX(-50%) translateY(0);
      pointer-events: all;
    }

    /* Caret pointer */
    .drop::before {
      content: ''; position: absolute; top: -5px; left: 50%;
      transform: translateX(-50%) rotate(45deg);
      width: 9px; height: 9px;
      background: #fff;
      border-left: 1px solid #e0ebe4;
      border-top: 1px solid #e0ebe4;
    }

    .drop-title {
      font-size: 0.59rem; font-weight: 700; letter-spacing: 0.1em;
      text-transform: uppercase; color: #9abeab;
      padding: 6px 10px 4px; display: block;
    }

    .dd {
      display: flex; align-items: center; gap: 11px;
      padding: 8px 10px; border-radius: 7px;
      text-decoration: none; transition: background 0.1s;
      min-height: 44px;
    }
    .dd:hover { background: #f0f9f4; }
    .dd-icon {
      width: 32px; height: 32px; border-radius: 7px;
      background: #f0f5f2;
      display: flex; align-items: center; justify-content: center;
      font-size: 0.95rem; flex-shrink: 0;
      transition: background 0.1s;
    }
    .dd:hover .dd-icon { background: #d4f0e3; }
    .dd-label { font-size: 0.82rem; font-weight: 600; color: #111827; line-height: 1.2; }
    .dd-desc  { font-size: 0.67rem; font-weight: 400; color: #6b7280; margin-top: 1px; }

    .drop-footer {
      margin-top: 4px; padding: 8px 10px 4px;
      border-top: 1px solid #f0f5f2;
      display: flex; align-items: center; justify-content: space-between;
    }
    .drop-footer-lbl { font-size: 0.67rem; font-weight: 500; color: #9ca3af; }
    .drop-footer-lnk {
      font-size: 0.7rem; font-weight: 700; color: #008751;
      text-decoration: none;
    }
    .drop-footer-lnk:hover { text-decoration: underline; }

    /* ─────────────────────────────────────────────
       RIGHT ACTIONS
    ───────────────────────────────────────────── */
    .right {
      display: flex; align-items: center; gap: 8px;
      flex-shrink: 0; margin-left: auto;
    }

    .countries-pill {
      font-size: 0.67rem; font-weight: 600;
      color: #6b7280;
      padding: 4px 10px; border-radius: 20px;
      border: 1px solid #e5e7eb;
      background: #f9fafb;
      white-space: nowrap;
    }

    .cta {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 8px 16px; border-radius: 6px;
      font-size: 0.8rem; font-weight: 700;
      text-decoration: none; background: #008751; color: #ffffff;
      border: none; cursor: pointer; white-space: nowrap;
      transition: background 0.15s, transform 0.12s;
      min-height: 38px;
      box-shadow: 0 1px 4px rgba(0,135,81,0.25);
    }
    .cta:hover  { background: #006b40; transform: translateY(-1px); }
    .cta:active { transform: translateY(0); }

    /* ─────────────────────────────────────────────
       HAMBURGER — dark lines on light bg
    ───────────────────────────────────────────── */
    .burger {
      display: none; flex-direction: column; justify-content: center; gap: 5px;
      width: 44px; height: 44px;
      background: transparent; border: none;
      cursor: pointer; padding: 10px; border-radius: 6px; flex-shrink: 0;
    }
    .burger:hover { background: #f3f4f6; }
    .burger span {
      display: block; width: 100%; height: 2px;
      background: #374151; border-radius: 2px;
      transition: all 0.22s;
    }
    .burger.open span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
    .burger.open span:nth-child(2) { opacity: 0; transform: scaleX(0); }
    .burger.open span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

    /* ─────────────────────────────────────────────
       MOBILE DRAWER — ✅ untouched, perfect as-is
       White drawer, dark text, large touch targets
    ───────────────────────────────────────────── */
    .mob {
      display: none; position: fixed;
      top: 60px; left: 0; right: 0; bottom: 0;
      background: #ffffff; z-index: 499;
      overflow-y: auto;
      flex-direction: column;
      opacity: 0; pointer-events: none;
      transition: opacity 0.2s;
      padding-bottom: env(safe-area-inset-bottom, 48px);
    }
    .mob.open { opacity: 1; pointer-events: all; }

    .mob-header {
      padding: 16px 20px 12px;
      border-bottom: 1px solid #f3f4f6;
    }
    .mob-header-label {
      font-size: 0.6rem; font-weight: 700; letter-spacing: 0.12em;
      text-transform: uppercase; color: #9ca3af;
    }

    .mob-link {
      display: flex; align-items: center; gap: 14px;
      padding: 14px 20px;
      border-bottom: 1px solid #f9fafb;
      text-decoration: none; transition: background 0.1s;
      min-height: 60px;
    }
    .mob-link:hover, .mob-link:active { background: #f9fafb; }
    .mob-icon {
      width: 40px; height: 40px; border-radius: 10px;
      background: #f3f4f6;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.2rem; flex-shrink: 0;
    }
    .mob-label { font-size: 0.95rem; font-weight: 600; color: #111827; }
    .mob-desc  { font-size: 0.72rem; font-weight: 400; color: #6b7280; margin-top: 2px; }

    .mob-footer {
      padding: 20px;
      border-top: 1px solid #f3f4f6;
      margin-top: 8px;
    }
    .mob-cta {
      display: flex; align-items: center; justify-content: center;
      padding: 15px; border-radius: 8px;
      font-size: 0.95rem; font-weight: 700;
      text-decoration: none; background: #008751; color: white;
      min-height: 52px;
    }
    .mob-countries {
      text-align: center; margin-top: 12px;
      font-size: 0.72rem; font-weight: 500; color: #9ca3af;
    }

    /* ─────────────────────────────────────────────
       RESPONSIVE
    ───────────────────────────────────────────── */
    @media (max-width: 860px) {
      .nav-links, .countries-pill { display: none; }
      .burger { display: flex; }
      .mob    { display: flex; }
      nav     { padding: 0 16px; }
    }
    @media (max-width: 480px) {
      .logo-tagline { display: none; }
      .logo-name { font-size: 0.95rem; }
      nav { height: 56px; }
      .mob { top: 56px; }
    }
  `;

  class AfroNavbar extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this._menuOpen = false;
      this._dropOpen = false;
    }

    static get observedAttributes() { return ['active']; }
    attributeChangedCallback() { this._render(); this._bind(); }
    connectedCallback()        { this._render(); this._bind(); }
    get active() { return this.getAttribute('active') || ''; }

    _toolsDropdown() {
      return `
        <span class="drop-title">Tool Categories</span>
        ${TOOLS.map(t => `
          <a href="${t.href}" class="dd">
            <div class="dd-icon">${t.icon}</div>
            <div>
              <div class="dd-label">${t.label}</div>
              <div class="dd-desc">${t.desc}</div>
            </div>
          </a>`).join('')}
        <div class="drop-footer">
          <span class="drop-footer-lbl">54 countries · 6 categories</span>
          <a href="/#categories" class="drop-footer-lnk">Browse all →</a>
        </div>`;
    }

    _mobileMenu() {
      return `
        <div class="mob-header">
          <span class="mob-header-label">Tool Categories</span>
        </div>
        ${TOOLS.map(t => `
          <a href="${t.href}" class="mob-link">
            <div class="mob-icon">${t.icon}</div>
            <div>
              <div class="mob-label">${t.label}</div>
              <div class="mob-desc">${t.desc}</div>
            </div>
          </a>`).join('')}
        <div class="mob-footer">
          <a href="/#newsletter" class="mob-cta">Get Updates →</a>
          <p class="mob-countries">🌍 54 countries · Africa's financial platform</p>
        </div>`;
    }

    _render() {
      const isTools = this.active === 'tools';
      this.shadowRoot.innerHTML = `
        <style>${CSS}</style>
        <nav role="navigation" aria-label="Main navigation">
          <div class="inner">
            <a href="/" class="logo" aria-label="AfroTools home">
              ${MARK}
              <div class="logo-text">
                <span class="logo-name">AFRO<b>TOOLS</b></span>
                <span class="logo-tagline">Africa's Financial Platform</span>
              </div>
            </a>

            <ul class="nav-links">
              <li>
                <button class="lnk${isTools ? ' active' : ''}" id="toolsBtn" type="button" aria-haspopup="true" aria-expanded="false">
                  Tools
                  <svg class="chev" viewBox="0 0 8 5" fill="none">
                    <polyline points="0.5,0.5 4,4.5 7.5,0.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
                <div class="drop" id="toolsDrop" role="menu">
                  ${this._toolsDropdown()}
                </div>
              </li>
            </ul>

            <div class="right">
              <span class="countries-pill">🌍 54 countries</span>
              <a href="/#newsletter" class="cta">Get Updates →</a>
              <button class="burger" type="button" aria-label="Open menu" aria-expanded="false">
                <span></span><span></span><span></span>
              </button>
            </div>
          </div>
        </nav>

        <div class="mob" role="dialog" aria-modal="true" aria-label="Navigation menu">
          ${this._mobileMenu()}
        </div>`;
    }

    _bind() {
      const sr      = this.shadowRoot;
      const nav     = sr.querySelector('nav');
      const burger  = sr.querySelector('.burger');
      const mob     = sr.querySelector('.mob');
      const toolsBtn= sr.querySelector('#toolsBtn');
      const toolsDrop=sr.querySelector('#toolsDrop');

      // ── Scroll shadow
      if (this._scrollFn) window.removeEventListener('scroll', this._scrollFn);
      this._scrollFn = () => nav.classList.toggle('scrolled', window.scrollY > 4);
      window.addEventListener('scroll', this._scrollFn, { passive: true });
      this._scrollFn();

      // ── Tools dropdown — JS-driven click + hover for robustness
      const openDrop = () => {
        this._dropOpen = true;
        toolsBtn.classList.add('open');
        toolsDrop.classList.add('open');
        toolsBtn.setAttribute('aria-expanded', 'true');
      };
      const closeDrop = () => {
        this._dropOpen = false;
        toolsBtn.classList.remove('open');
        toolsDrop.classList.remove('open');
        toolsBtn.setAttribute('aria-expanded', 'false');
      };

      // Click toggle
      toolsBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        this._dropOpen ? closeDrop() : openDrop();
      });

      // Hover open (desktop feel) — delay close so user can move into dropdown
      let hoverTimer;
      const li = toolsBtn?.closest('li');
      li?.addEventListener('mouseenter', () => { clearTimeout(hoverTimer); openDrop(); });
      li?.addEventListener('mouseleave', () => { hoverTimer = setTimeout(closeDrop, 120); });
      toolsDrop?.addEventListener('mouseenter', () => clearTimeout(hoverTimer));
      toolsDrop?.addEventListener('mouseleave', () => { hoverTimer = setTimeout(closeDrop, 120); });

      // Click outside to close
      if (this._outsideFn) document.removeEventListener('click', this._outsideFn);
      this._outsideFn = (e) => {
        if (!this.contains(e.target)) closeDrop();
      };
      document.addEventListener('click', this._outsideFn);

      // Escape key
      document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
          closeDrop();
          if (this._menuOpen) burger?.click();
        }
      });

      // ── Mobile hamburger — unchanged
      burger?.addEventListener('click', () => {
        this._menuOpen = !this._menuOpen;
        burger.classList.toggle('open', this._menuOpen);
        mob.classList.toggle('open', this._menuOpen);
        burger.setAttribute('aria-expanded', String(this._menuOpen));
        document.body.style.overflow = this._menuOpen ? 'hidden' : '';
      });

      mob?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
        this._menuOpen = false;
        burger?.classList.remove('open');
        mob.classList.remove('open');
        document.body.style.overflow = '';
      }));
    }
  }

  if (!customElements.get('afro-navbar')) {
    customElements.define('afro-navbar', AfroNavbar);
  }
})();
