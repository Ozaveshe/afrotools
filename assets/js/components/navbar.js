/**
 * AFROTOOLS NAVBAR — Web Component
 * Usage:  <afro-navbar></afro-navbar>
 *         <afro-navbar theme="dark" active="tools"></afro-navbar>
 * Edit NAV_ITEMS to update every page at once.
 */
(function () {
  'use strict';

  const NAV_ITEMS = [
    {
      id: 'tools', label: 'Tools', labelFr: 'Outils',
      href: '/#categories', hasDropdown: true,
      dropdown: [
        { label: 'Salary & Tax',        labelFr: 'Salaire & Impôts',   href: '/salary-tax',       icon: '💰' },
        { label: 'VAT & Business Tax',  labelFr: 'TVA & Fiscalité',    href: '/vat-business-tax', icon: '🧾' },
        { label: 'Mortgage & Property', labelFr: 'Immobilier',          href: '/mortgage',          icon: '🏠' },
        { label: 'Business & ROI',      labelFr: 'Entreprise & ROI',   href: '/business-roi',      icon: '📈' },
        { label: 'Education',           labelFr: 'Éducation',           href: '/education',         icon: '🎓' },
        { label: 'Health & Insurance',  labelFr: 'Santé & Assurance',  href: '/health-insurance',  icon: '🏥' },
      ]
    },
    {
      id: 'countries', label: 'Countries', labelFr: 'Pays',
      href: '/#countries', hasDropdown: true,
      dropdown: [
        { label: '🇳🇬 Nigeria',       href: '/nigeria',      tag: 'live' },
        { label: '🇰🇪 Kenya',         href: '/kenya',        tag: 'live' },
        { label: '🇬🇭 Ghana',         href: '/ghana',        tag: 'live' },
        { label: '🇿🇦 South Africa',  href: '/south-africa', tag: 'live' },
        { label: '🇪🇬 Egypt',         href: '/egypt',        tag: 'live' },
        { label: '🇹🇿 Tanzania',      href: '/tanzania',     tag: 'live' },
        { label: 'All 54 Countries →', href: '/#countries',  tag: 'all'  },
      ]
    },
    { id: 'about', label: 'About', labelFr: 'À propos', href: '/about' },
  ];

  // ── MERIDIAN DIAMOND MARK (inline SVG, zero HTTP requests) ──
  const MARK = (dark) => `
    <svg viewBox="0 0 68 68" fill="none" xmlns="http://www.w3.org/2000/svg" style="height:36px;width:36px;flex-shrink:0">
      <polygon points="34,20 48,34 34,48 20,34" fill="${dark ? '#00c873' : '#008751'}"/>
      <polygon points="34,2  44,14 34,20 24,14" fill="#F5A623"/>
      <polygon points="34,48 44,60 34,68 24,60" fill="${dark ? '#008751' : '#005f39'}"/>
      <polygon points="2,24  14,34 2,44  -10,34" fill="${dark ? '#5ddb9e' : '#00a863'}" opacity="${dark ? '0.65' : '0.9'}"/>
      <polygon points="52,24 64,34 52,44 40,34"  fill="${dark ? '#5ddb9e' : '#007340'}" opacity="${dark ? '0.5'  : '0.9'}"/>
      <line x1="34" y1="20" x2="34" y2="48" stroke="#F5A623" stroke-width="0.8" opacity="${dark ? '0.28' : '0.35'}"/>
      <line x1="20" y1="34" x2="48" y2="34" stroke="#F5A623" stroke-width="0.8" opacity="${dark ? '0.28' : '0.35'}"/>
    </svg>`;

  const CSS = `
    :host { display: block; }

    nav {
      position: sticky; top: 0; z-index: 200;
      height: 60px; display: flex; align-items: center;
      padding: 0 32px;
      transition: background 0.28s ease, box-shadow 0.28s ease;
    }
    nav.light {
      background: rgba(255,255,255,0.97);
      border-bottom: 1px solid #d0e8d8;
      backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
    }
    nav.light.scrolled { box-shadow: 0 2px 24px rgba(0,0,0,0.07); }
    nav.dark  { background: transparent; border-bottom: 1px solid rgba(255,255,255,0.07); }
    nav.dark.scrolled {
      background: rgba(10,26,16,0.96);
      border-bottom-color: rgba(255,255,255,0.05);
      box-shadow: 0 2px 24px rgba(0,0,0,0.3);
      backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
    }

    .inner {
      max-width: 1200px; margin: 0 auto; width: 100%;
      display: flex; align-items: center; justify-content: space-between; gap: 20px;
    }

    /* Logo */
    .logo {
      display: flex; align-items: center; gap: 9px;
      text-decoration: none; flex-shrink: 0;
    }
    .logo-text { display: flex; flex-direction: column; gap: 2px; line-height: 1; }
    .logo-name {
      font-family: 'Barlow Condensed', 'Arial Narrow', sans-serif;
      font-size: 1.25rem; font-weight: 800; letter-spacing: 0.04em; line-height: 1;
    }
    .logo-sub {
      font-family: 'Barlow', Arial, sans-serif;
      font-size: 0.46rem; font-weight: 400;
      letter-spacing: 0.24em; text-transform: uppercase; line-height: 1;
    }
    nav.light .logo-name  { color: #0a1a10; }
    nav.light .logo-name b { color: #008751; font-weight: 800; }
    nav.light .logo-sub   { color: #7a9e87; }
    nav.dark  .logo-name  { color: #ffffff; }
    nav.dark  .logo-name b { color: #5ddb9e; font-weight: 800; }
    nav.dark  .logo-sub   { color: rgba(255,255,255,0.28); }

    /* Links */
    ul { display: flex; align-items: center; gap: 2px; list-style: none; }
    li { position: relative; }

    .lnk {
      display: flex; align-items: center; gap: 4px;
      padding: 7px 12px; border-radius: 4px;
      font-family: 'Barlow Condensed', 'Arial Narrow', sans-serif;
      font-size: 0.78rem; font-weight: 700; letter-spacing: 0.09em; text-transform: uppercase;
      text-decoration: none; border: none; background: transparent;
      cursor: pointer; white-space: nowrap; transition: all 0.15s;
    }
    .chev { width: 9px; height: 5px; transition: transform 0.18s; flex-shrink: 0; }
    li:hover .chev { transform: rotate(180deg); }

    nav.light .lnk        { color: #4e6e58; }
    nav.light .lnk:hover,
    nav.light .lnk.on     { color: #005f39; background: #eaf5ef; }
    nav.dark  .lnk        { color: rgba(255,255,255,0.52); }
    nav.dark  .lnk:hover,
    nav.dark  .lnk.on     { color: #5ddb9e; background: rgba(255,255,255,0.07); }

    /* Dropdown */
    .drop {
      position: absolute; top: calc(100% + 8px); left: 50%;
      transform: translateX(-50%) translateY(-4px);
      min-width: 210px; background: #fff;
      border: 1px solid #d0e8d8; border-radius: 8px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.1);
      padding: 5px; opacity: 0; visibility: hidden;
      transition: opacity 0.15s, visibility 0.15s, transform 0.15s; z-index: 10;
    }
    li:hover .drop,
    li:focus-within .drop { opacity: 1; visibility: visible; transform: translateX(-50%) translateY(0); }
    .dd {
      display: flex; align-items: center; gap: 9px;
      padding: 8px 11px; border-radius: 5px;
      font-family: 'Barlow', Arial, sans-serif;
      font-size: 0.83rem; color: #4e6e58;
      text-decoration: none; transition: background 0.12s, color 0.12s;
    }
    .dd:hover { background: #eaf5ef; color: #008751; }
    .dd-icon  { font-size: 0.92rem; flex-shrink: 0; }
    .dd-tag   {
      margin-left: auto;
      font-family: 'Barlow Condensed', sans-serif;
      font-size: 0.57rem; font-weight: 700; letter-spacing: 0.06em;
      text-transform: uppercase; padding: 2px 5px; border-radius: 3px;
      background: #d4f7e8; color: #005f39;
    }
    .dd.all   { font-weight: 600; color: #008751; border-top: 1px solid #d0e8d8; margin-top: 3px; padding-top: 10px; }

    /* Right */
    .right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }

    .lang { display: flex; gap: 1px; }
    .lbtn {
      font-family: 'Barlow Condensed', sans-serif;
      font-size: 0.68rem; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase;
      padding: 4px 8px; border-radius: 3px; border: 1px solid transparent;
      background: transparent; cursor: pointer; transition: all 0.13s;
    }
    nav.light .lbtn        { color: #9ab5a4; }
    nav.light .lbtn:hover,
    nav.light .lbtn.on     { background: #008751; color: white; border-color: #008751; }
    nav.dark  .lbtn        { color: rgba(255,255,255,0.28); }
    nav.dark  .lbtn:hover,
    nav.dark  .lbtn.on     { background: rgba(255,255,255,0.1); color: white; border-color: rgba(255,255,255,0.2); }

    .cta {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 8px 16px; border-radius: 4px;
      font-family: 'Barlow Condensed', sans-serif;
      font-size: 0.76rem; font-weight: 800; letter-spacing: 0.09em; text-transform: uppercase;
      text-decoration: none; background: #008751; color: white;
      border: 2px solid #008751; transition: all 0.15s;
    }
    nav.light .cta:hover { background: transparent; color: #008751; }
    nav.dark  .cta:hover { background: transparent; color: #5ddb9e; border-color: #5ddb9e; }

    /* Burger */
    .burger {
      display: none; flex-direction: column; justify-content: center; gap: 5px;
      width: 36px; height: 36px; background: transparent; border: none;
      cursor: pointer; padding: 6px; border-radius: 4px;
    }
    .burger span { display: block; width: 100%; height: 2px; border-radius: 2px; transition: all 0.22s; }
    nav.light .burger span { background: #0a1a10; }
    nav.dark  .burger span { background: white; }
    .burger.open span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
    .burger.open span:nth-child(2) { opacity: 0; transform: scaleX(0); }
    .burger.open span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

    /* Mobile drawer */
    .mob {
      display: none; position: fixed;
      top: 60px; left: 0; right: 0; bottom: 0;
      background: rgba(8,20,12,0.98); z-index: 199;
      overflow-y: auto; padding: 24px 28px 56px;
      flex-direction: column; opacity: 0; pointer-events: none;
      transition: opacity 0.22s;
    }
    .mob.open { opacity: 1; pointer-events: all; }
    .ml {
      display: flex; align-items: center; justify-content: space-between;
      padding: 15px 0; border-bottom: 1px solid rgba(255,255,255,0.07);
      font-family: 'Barlow Condensed', sans-serif;
      font-size: 1.55rem; font-weight: 800; text-transform: uppercase;
      color: white; text-decoration: none; transition: color 0.13s;
    }
    .ml:hover { color: #5ddb9e; }
    .ms { padding: 6px 0 12px 16px; border-bottom: 1px solid rgba(255,255,255,0.07); }
    .ms a {
      display: block; padding: 6px 0;
      font-family: 'Barlow', sans-serif; font-size: 0.875rem;
      color: rgba(255,255,255,0.42); text-decoration: none; transition: color 0.13s;
    }
    .ms a:hover { color: #5ddb9e; }
    .mcta {
      margin-top: 24px; display: flex; align-items: center; justify-content: center;
      padding: 16px; border-radius: 4px;
      font-family: 'Barlow Condensed', sans-serif;
      font-size: 1rem; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase;
      text-decoration: none; background: #008751; color: white;
    }

    @media (max-width: 900px) {
      ul, .lang, .cta { display: none; }
      .burger { display: flex; }
      .mob    { display: flex; }
      nav     { padding: 0 20px; }
    }
  `;

  class AfroNavbar extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this._lang = localStorage.getItem('afrotools_lang') || 'en';
      this._open = false;
    }
    static get observedAttributes() { return ['theme', 'active']; }
    attributeChangedCallback()      { this._render(); this._bind(); }
    connectedCallback()              { this._render(); this._bind(); }
    get theme()  { return this.getAttribute('theme')  || 'light'; }
    get active() { return this.getAttribute('active') || ''; }
    get isFr()   { return this._lang === 'fr'; }
    _t(item)     { return this.isFr && item.labelFr ? item.labelFr : item.label; }

    _links() {
      return NAV_ITEMS.map(item => {
        const act = this.active === item.id ? ' on' : '';
        const lbl = this._t(item);
        if (!item.hasDropdown)
          return `<li><a href="${item.href}" class="lnk${act}">${lbl}</a></li>`;
        const chev = `<svg class="chev" viewBox="0 0 9 5" fill="none"><polyline points="0.5,0.5 4.5,4.5 8.5,0.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
        const rows = item.dropdown.map(d => {
          const icon = d.icon ? `<span class="dd-icon">${d.icon}</span>` : '';
          const tag  = d.tag === 'live' ? `<span class="dd-tag">Live</span>` : '';
          return `<a href="${d.href}" class="dd${d.tag === 'all' ? ' all' : ''}">${icon}<span>${d.label}</span>${tag}</a>`;
        }).join('');
        return `<li><button class="lnk${act}" type="button">${lbl}${chev}</button><div class="drop">${rows}</div></li>`;
      }).join('');
    }

    _mobile() {
      return NAV_ITEMS.map(item => {
        const lbl = this._t(item);
        if (!item.hasDropdown) return `<a href="${item.href}" class="ml">${lbl}</a>`;
        const subs = item.dropdown.slice(0,6).map(d => `<a href="${d.href}">${d.label}</a>`).join('');
        return `<div><div class="ml" tabindex="0">${lbl}</div><div class="ms">${subs}</div></div>`;
      }).join('');
    }

    _render() {
      const dark = this.theme === 'dark';
      const cta  = this.isFr ? 'Mises à jour' : 'Get Updates';
      this.shadowRoot.innerHTML = `
        <style>@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800&family=Barlow:wght@400&display=swap');${CSS}</style>
        <nav class="${this.theme}" role="navigation" aria-label="Main navigation">
          <div class="inner">
            <a href="/" class="logo" aria-label="AfroTools home">
              ${MARK(dark)}
              <div class="logo-text">
                <span class="logo-name">AFRO<b>TOOLS</b></span>
                <span class="logo-sub">Africa's Financial Platform</span>
              </div>
            </a>
            <ul>${this._links()}</ul>
            <div class="right">
              <div class="lang">
                <button class="lbtn${!this.isFr ? ' on':''}" data-lang="en" type="button">EN</button>
                <button class="lbtn${this.isFr  ? ' on':''}" data-lang="fr" type="button">FR</button>
              </div>
              <a href="/#newsletter" class="cta">${cta} →</a>
              <button class="burger" type="button" aria-label="Open menu" aria-expanded="false"><span></span><span></span><span></span></button>
            </div>
          </div>
        </nav>
        <div class="mob" role="dialog" aria-label="Mobile menu">
          ${this._mobile()}
          <a href="/#newsletter" class="mcta">${cta} →</a>
        </div>`;
    }

    _bind() {
      const sr     = this.shadowRoot;
      const nav    = sr.querySelector('nav');
      const burger = sr.querySelector('.burger');
      const mob    = sr.querySelector('.mob');
      if (this._scrollFn) window.removeEventListener('scroll', this._scrollFn);
      this._scrollFn = () => nav.classList.toggle('scrolled', window.scrollY > 8);
      window.addEventListener('scroll', this._scrollFn, { passive: true });
      this._scrollFn();
      burger?.addEventListener('click', () => {
        this._open = !this._open;
        burger.classList.toggle('open', this._open);
        mob.classList.toggle('open', this._open);
        burger.setAttribute('aria-expanded', String(this._open));
        document.body.style.overflow = this._open ? 'hidden' : '';
      });
      mob?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
        this._open = false; burger?.classList.remove('open'); mob.classList.remove('open');
        document.body.style.overflow = '';
      }));
      sr.querySelectorAll('.lbtn').forEach(b => b.addEventListener('click', () => {
        this._lang = b.dataset.lang;
        localStorage.setItem('afrotools_lang', this._lang);
        this._render(); this._bind();
        this.dispatchEvent(new CustomEvent('afrotools:langchange', { bubbles: true, detail: { lang: this._lang } }));
      }));
      document.addEventListener('keydown', e => { if (e.key === 'Escape' && this._open) burger?.click(); });
    }
  }

  if (!customElements.get('afro-navbar')) customElements.define('afro-navbar', AfroNavbar);
})();
