/**
 * AFROTOOLS NAVBAR — Web Component
 * Design: #111 navbar, #FAFAF8 body, green on CTA only
 * Font: DM Sans (matches tool pages)
 * Usage: <afro-navbar active="tools"></afro-navbar>
 *
 * The `theme` attribute is kept for compatibility but the navbar
 * is always #111 — it looks correct against any page background.
 */
(function () {
  'use strict';

  // ── Tools dropdown — 6 categories ──────────────────────────
  const TOOLS = [
    { label: 'Salary & Tax',        href: '/salary-tax',       icon: '💰', desc: 'PAYE, income tax, take-home' },
    { label: 'VAT & Business Tax',  href: '/vat-business-tax', icon: '🧾', desc: 'VAT, CIT, business levies' },
    { label: 'Mortgage & Property', href: '/mortgage',          icon: '🏠', desc: 'Loans, repayments, LTV' },
    { label: 'Business & ROI',      href: '/business-roi',      icon: '📈', desc: 'ROI, margins, break-even' },
    { label: 'Education',           href: '/education',         icon: '🎓', desc: 'Fees, student costs' },
    { label: 'Health & Insurance',  href: '/health-insurance',  icon: '🏥', desc: 'Premiums, cover, savings' },
  ];

  // ── Meridian Diamond — always light variant on dark navbar ──
  const MARK = `<svg viewBox="0 0 68 68" fill="none" xmlns="http://www.w3.org/2000/svg" style="height:34px;width:34px;flex-shrink:0">
    <polygon points="34,20 48,34 34,48 20,34" fill="#00c873"/>
    <polygon points="34,2  44,14 34,20 24,14" fill="#F5A623"/>
    <polygon points="34,48 44,60 34,68 24,60" fill="#008751"/>
    <polygon points="2,24  14,34 2,44  -10,34" fill="#5ddb9e" opacity="0.7"/>
    <polygon points="52,24 64,34 52,44 40,34"  fill="#5ddb9e" opacity="0.55"/>
    <line x1="34" y1="20" x2="34" y2="48" stroke="#F5A623" stroke-width="0.8" opacity="0.3"/>
    <line x1="20" y1="34" x2="48" y2="34" stroke="#F5A623" stroke-width="0.8" opacity="0.3"/>
  </svg>`;

  const CSS = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; font-family: 'DM Sans', system-ui, sans-serif; }
    :host { display: block; }

    /* ── NAV SHELL ── */
    nav {
      position: sticky; top: 0; z-index: 500;
      height: 62px;
      background: #111111;
      border-bottom: 1px solid #1e1e1e;
      display: flex; align-items: center;
      padding: 0 24px;
      transition: box-shadow 0.2s;
    }
    nav.scrolled {
      box-shadow: 0 1px 0 #1e1e1e, 0 4px 20px rgba(0,0,0,0.25);
    }

    /* ── INNER ── */
    .inner {
      max-width: 1200px; margin: 0 auto; width: 100%;
      display: flex; align-items: center; gap: 8px;
    }

    /* ── LOGO ── */
    .logo {
      display: flex; align-items: center; gap: 10px;
      text-decoration: none; flex-shrink: 0; margin-right: 16px;
    }
    .logo-text { display: flex; flex-direction: column; gap: 1px; line-height: 1; }
    .logo-name {
      font-size: 1.1rem; font-weight: 800; letter-spacing: -0.01em;
      color: #ffffff; line-height: 1;
    }
    .logo-name b { color: #00c873; font-weight: 800; }
    .logo-tagline {
      font-size: 0.5rem; font-weight: 500; letter-spacing: 0.2em;
      text-transform: uppercase; color: rgba(255,255,255,0.28);
    }

    /* ── NAV LINKS ── */
    .nav-links { display: flex; align-items: center; gap: 2px; list-style: none; flex: 1; }
    li { position: relative; }

    .lnk {
      display: flex; align-items: center; gap: 5px;
      padding: 8px 12px; border-radius: 5px;
      font-size: 0.82rem; font-weight: 600; letter-spacing: 0.01em;
      color: rgba(255,255,255,0.55);
      text-decoration: none; border: none; background: transparent;
      cursor: pointer; white-space: nowrap; transition: color 0.15s, background 0.15s;
    }
    .lnk:hover { color: #ffffff; background: rgba(255,255,255,0.07); }
    .lnk.active { color: #ffffff; }

    .chev {
      width: 8px; height: 5px; flex-shrink: 0; opacity: 0.4;
      transition: transform 0.18s, opacity 0.15s;
    }
    li:hover .chev { transform: rotate(180deg); opacity: 0.8; }

    /* ── DROPDOWN ── */
    .drop {
      position: absolute; top: calc(100% + 10px); left: 50%;
      transform: translateX(-50%) translateY(-6px);
      width: 280px; background: #ffffff;
      border: 1px solid #e5e5e5;
      border-radius: 10px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.08);
      padding: 6px; opacity: 0; visibility: hidden;
      transition: opacity 0.15s, visibility 0.15s, transform 0.15s;
      z-index: 10;
    }
    li:hover .drop,
    li:focus-within .drop {
      opacity: 1; visibility: visible; transform: translateX(-50%) translateY(0);
    }

    /* Drop arrow */
    .drop::before {
      content: ''; position: absolute; top: -5px; left: 50%;
      transform: translateX(-50%) rotate(45deg);
      width: 9px; height: 9px;
      background: #fff; border-left: 1px solid #e5e5e5; border-top: 1px solid #e5e5e5;
    }

    .drop-title {
      font-size: 0.6rem; font-weight: 700; letter-spacing: 0.1em;
      text-transform: uppercase; color: #aaaaaa;
      padding: 6px 10px 4px; display: block;
    }

    .dd {
      display: flex; align-items: center; gap: 11px;
      padding: 9px 10px; border-radius: 6px;
      text-decoration: none; transition: background 0.1s;
    }
    .dd:hover { background: #f5f5f5; }
    .dd-icon {
      width: 32px; height: 32px; border-radius: 7px;
      background: #f5f5f5; display: flex; align-items: center;
      justify-content: center; font-size: 1rem; flex-shrink: 0;
      transition: background 0.1s;
    }
    .dd:hover .dd-icon { background: #e8f5ee; }
    .dd-text { display: flex; flex-direction: column; gap: 1px; }
    .dd-label { font-size: 0.82rem; font-weight: 600; color: #111111; line-height: 1.2; }
    .dd-desc  { font-size: 0.68rem; font-weight: 400; color: #888888; }

    .drop-footer {
      margin-top: 4px; padding: 8px 10px 4px;
      border-top: 1px solid #f0f0f0;
      display: flex; align-items: center; justify-content: space-between;
    }
    .drop-footer-lbl { font-size: 0.68rem; font-weight: 500; color: #aaaaaa; }
    .drop-footer-lnk {
      font-size: 0.7rem; font-weight: 700; color: #008751;
      text-decoration: none; letter-spacing: 0.02em;
    }
    .drop-footer-lnk:hover { text-decoration: underline; }

    /* ── RIGHT ── */
    .right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; margin-left: auto; }

    /* Country count pill */
    .countries-pill {
      font-size: 0.68rem; font-weight: 500;
      color: rgba(255,255,255,0.35);
      padding: 4px 10px; border-radius: 20px;
      border: 1px solid rgba(255,255,255,0.1);
      white-space: nowrap; letter-spacing: 0.02em;
    }

    /* CTA */
    .cta {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 8px 16px; border-radius: 5px;
      font-size: 0.78rem; font-weight: 700; letter-spacing: 0.02em;
      text-decoration: none; background: #008751; color: #ffffff;
      border: none; cursor: pointer;
      transition: background 0.15s, transform 0.15s;
      white-space: nowrap;
    }
    .cta:hover { background: #006b40; transform: translateY(-1px); }
    .cta:active { transform: translateY(0); }

    /* ── HAMBURGER ── */
    .burger {
      display: none; flex-direction: column; justify-content: center; gap: 5px;
      width: 36px; height: 36px; background: transparent; border: none;
      cursor: pointer; padding: 7px; border-radius: 5px; flex-shrink: 0;
    }
    .burger:hover { background: rgba(255,255,255,0.07); }
    .burger span { display: block; width: 100%; height: 1.5px; background: rgba(255,255,255,0.8); border-radius: 2px; transition: all 0.22s; }
    .burger.open span:nth-child(1) { transform: translateY(6.5px) rotate(45deg); }
    .burger.open span:nth-child(2) { opacity: 0; transform: scaleX(0); }
    .burger.open span:nth-child(3) { transform: translateY(-6.5px) rotate(-45deg); }

    /* ── MOBILE DRAWER ── */
    .mob {
      display: none; position: fixed;
      top: 62px; left: 0; right: 0; bottom: 0;
      background: #0d0d0d; z-index: 499;
      overflow-y: auto; padding: 20px 24px 48px;
      flex-direction: column; gap: 0;
      opacity: 0; pointer-events: none;
      transition: opacity 0.2s;
    }
    .mob.open { opacity: 1; pointer-events: all; }

    .mob-section-title {
      font-size: 0.6rem; font-weight: 700; letter-spacing: 0.14em;
      text-transform: uppercase; color: rgba(255,255,255,0.28);
      padding: 20px 0 10px;
    }
    .mob-section-title:first-child { padding-top: 8px; }

    .mob-link {
      display: flex; align-items: center; gap: 12px;
      padding: 13px 0; border-bottom: 1px solid rgba(255,255,255,0.06);
      text-decoration: none; transition: color 0.13s;
    }
    .mob-link:hover { color: #00c873; }
    .mob-icon {
      width: 36px; height: 36px; border-radius: 8px;
      background: rgba(255,255,255,0.07);
      display: flex; align-items: center; justify-content: center;
      font-size: 1.1rem; flex-shrink: 0;
    }
    .mob-label { font-size: 0.95rem; font-weight: 600; color: rgba(255,255,255,0.85); }
    .mob-desc  { font-size: 0.72rem; font-weight: 400; color: rgba(255,255,255,0.35); margin-top: 1px; }

    .mob-cta {
      margin-top: 24px; display: flex; align-items: center; justify-content: center;
      padding: 15px; border-radius: 6px;
      font-size: 0.9rem; font-weight: 700;
      text-decoration: none; background: #008751; color: white;
      letter-spacing: 0.02em;
    }

    /* ── RESPONSIVE ── */
    @media (max-width: 860px) {
      .nav-links, .countries-pill { display: none; }
      .burger { display: flex; }
      .mob    { display: flex; }
      nav     { padding: 0 16px; }
    }
    @media (max-width: 480px) {
      .logo-tagline { display: none; }
    }
  `;

  class AfroNavbar extends HTMLElement {
    constructor() { super(); this.attachShadow({ mode: 'open' }); this._open = false; }
    static get observedAttributes() { return ['active']; }
    attributeChangedCallback()      { this._render(); this._bind(); }
    connectedCallback()              { this._render(); this._bind(); }
    get active() { return this.getAttribute('active') || ''; }

    _toolsDropdown() {
      const items = TOOLS.map(t => `
        <a href="${t.href}" class="dd">
          <div class="dd-icon">${t.icon}</div>
          <div class="dd-text">
            <span class="dd-label">${t.label}</span>
            <span class="dd-desc">${t.desc}</span>
          </div>
        </a>`).join('');
      return `
        <span class="drop-title">Tool Categories</span>
        ${items}
        <div class="drop-footer">
          <span class="drop-footer-lbl">54 countries · 6 categories</span>
          <a href="/#categories" class="drop-footer-lnk">Browse all tools →</a>
        </div>`;
    }

    _mobileMenu() {
      const links = TOOLS.map(t => `
        <a href="${t.href}" class="mob-link">
          <div class="mob-icon">${t.icon}</div>
          <div>
            <div class="mob-label">${t.label}</div>
            <div class="mob-desc">${t.desc}</div>
          </div>
        </a>`).join('');
      return `
        <span class="mob-section-title">Tools</span>
        ${links}
        <a href="/#newsletter" class="mob-cta">Get Updates →</a>`;
    }

    _render() {
      const isToolsActive = this.active === 'tools';
      this.shadowRoot.innerHTML = `
        <style>${CSS}</style>
        <nav role="navigation" aria-label="Main navigation">
          <div class="inner">

            <a href="/" class="logo" aria-label="AfroTools — Africa's Financial Platform">
              ${MARK}
              <div class="logo-text">
                <span class="logo-name">AFRO<b>TOOLS</b></span>
                <span class="logo-tagline">Africa's Financial Platform</span>
              </div>
            </a>

            <ul class="nav-links">
              <li>
                <button class="lnk${isToolsActive ? ' active' : ''}" type="button">
                  Tools
                  <svg class="chev" viewBox="0 0 8 5" fill="none">
                    <polyline points="0.5,0.5 4,4.5 7.5,0.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
                <div class="drop" role="menu">${this._toolsDropdown()}</div>
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
        <div class="mob" role="dialog" aria-label="Mobile menu">
          ${this._mobileMenu()}
        </div>`;
    }

    _bind() {
      const sr     = this.shadowRoot;
      const nav    = sr.querySelector('nav');
      const burger = sr.querySelector('.burger');
      const mob    = sr.querySelector('.mob');

      // Scroll shadow
      if (this._scrollFn) window.removeEventListener('scroll', this._scrollFn);
      this._scrollFn = () => nav.classList.toggle('scrolled', window.scrollY > 4);
      window.addEventListener('scroll', this._scrollFn, { passive: true });
      this._scrollFn();

      // Mobile toggle
      burger?.addEventListener('click', () => {
        this._open = !this._open;
        burger.classList.toggle('open', this._open);
        mob.classList.toggle('open', this._open);
        burger.setAttribute('aria-expanded', String(this._open));
        document.body.style.overflow = this._open ? 'hidden' : '';
      });

      mob?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
        this._open = false;
        burger?.classList.remove('open');
        mob.classList.remove('open');
        document.body.style.overflow = '';
      }));

      document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && this._open) burger?.click();
      });
    }
  }

  if (!customElements.get('afro-navbar')) customElements.define('afro-navbar', AfroNavbar);
})();
