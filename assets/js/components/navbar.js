/**
 * AFROTOOLS NAVBAR — Everything Platform Edition
 * Mega-menu with 8 categories. Mobile drawer. Web Component.
 */
(function () {
  'use strict';

  const NAV_ITEMS = [
    {
      id: 'finance',
      label: 'Finance & Tax',
      icon: '💰',
      desc: 'Tax, payroll, budgeting',
      href: '/finance',
      color: '#e8f5ee',
      accent: '#008751',
      tools: [
        { label: 'Salary & Tax',       href: '/salary-tax',       icon: '💰', desc: 'PAYE, income tax, take-home' },
        { label: 'VAT & Business Tax', href: '/vat-business-tax', icon: '🧾', desc: 'VAT, CIT, withholding tax' },
        { label: 'Mortgage & Property',href: '/mortgage',         icon: '🏠', desc: 'Repayments, LTV, stamp duty' },
        { label: 'Business & ROI',     href: '/business-roi',     icon: '📈', desc: 'ROI, margins, break-even' },
      ]
    },
    {
      id: 'jobs',
      label: 'Jobs & Career',
      icon: '💼',
      desc: 'Salaries, CVs, market data',
      href: '/jobs',
      color: '#e8f0fe',
      accent: '#1a56db',
      tools: [
        { label: 'Salary Benchmarks',  href: '/jobs/salary-benchmarks', icon: '📊', desc: 'Compare pay by role & country' },
        { label: 'CV Builder',         href: '/jobs/cv-builder',         icon: '📄', desc: 'Africa-ready CV templates' },
        { label: 'Job Market Data',    href: '/jobs/market-data',        icon: '🔍', desc: 'Hiring trends by sector' },
        { label: 'Freelance Rates',    href: '/jobs/freelance-rates',    icon: '💻', desc: 'What to charge per country' },
      ]
    },
    {
      id: 'health',
      label: 'Health',
      icon: '🏥',
      desc: 'Insurance, costs, cover',
      href: '/health',
      color: '#fce8e8',
      accent: '#dc2626',
      tools: [
        { label: 'NHIF / SHIF',        href: '/health/nhif',       icon: '🏥', desc: 'Kenya health insurance calc' },
        { label: 'Insurance Premiums', href: '/health/insurance',   icon: '🛡️', desc: 'Compare cover by country' },
        { label: 'Hospital Cost Est.', href: '/health/costs',       icon: '💊', desc: 'Estimate treatment costs' },
        { label: 'Medical Aid SA',     href: '/health/medical-aid', icon: '❤️', desc: 'South Africa medical aid' },
      ]
    },
    {
      id: 'travel',
      label: 'Travel & Visa',
      icon: '✈️',
      desc: 'Visa, forex, cost of living',
      href: '/travel',
      color: '#f0e8fe',
      accent: '#7c3aed',
      tools: [
        { label: 'Visa Requirements',  href: '/travel/visa',      icon: '🛂', desc: 'African passport visa-free access' },
        { label: 'Forex Calculator',   href: '/travel/forex',     icon: '💱', desc: 'Live African currency rates' },
        { label: 'Cost of Living',     href: '/travel/cost',      icon: '🏙️', desc: 'Compare cities across Africa' },
        { label: 'Flight Cost Est.',   href: '/travel/flights',   icon: '✈️', desc: 'Budget for intra-Africa travel' },
      ]
    },
    {
      id: 'property',
      label: 'Property',
      icon: '🏘️',
      desc: 'Buy, rent, invest',
      href: '/property',
      color: '#fff3e0',
      accent: '#f57c00',
      tools: [
        { label: 'Mortgage Calculator',href: '/mortgage',          icon: '🏠', desc: 'Repayments across Africa' },
        { label: 'Rent vs Buy',        href: '/property/rent-buy', icon: '🔑', desc: 'Which makes sense for you?' },
        { label: 'Stamp Duty',         href: '/property/stamp-duty',icon: '📜', desc: 'Transfer taxes by country' },
        { label: 'Rental Yield',       href: '/property/yield',    icon: '💹', desc: 'Investment return on property' },
      ]
    },
    {
      id: 'education',
      label: 'Education',
      icon: '🎓',
      desc: 'Fees, loans, scholarships',
      href: '/education',
      color: '#e8fef6',
      accent: '#059669',
      tools: [
        { label: 'University Fees',    href: '/education/fees',        icon: '🎓', desc: 'Compare costs across Africa' },
        { label: 'Student Loans',      href: '/education/loans',       icon: '📚', desc: 'Repayment calculators' },
        { label: 'Scholarships',       href: '/education/scholarships',icon: '🏅', desc: 'African scholarship finder' },
        { label: 'Study Abroad Cost',  href: '/education/study-abroad',icon: '🌍', desc: 'Budget for overseas study' },
      ]
    },
    {
      id: 'lifestyle',
      label: 'Lifestyle',
      icon: '🛒',
      desc: 'Budget, inflation, cost',
      href: '/lifestyle',
      color: '#fef9e8',
      accent: '#d97706',
      tools: [
        { label: 'Budget Planner',     href: '/lifestyle/budget',     icon: '💳', desc: '50/30/20 rule for Africa' },
        { label: 'Inflation Tracker',  href: '/lifestyle/inflation',  icon: '📉', desc: 'Real purchasing power today' },
        { label: 'Cost Comparisons',   href: '/lifestyle/costs',      icon: '🛒', desc: 'What things cost by city' },
        { label: 'Savings Goals',      href: '/lifestyle/savings',    icon: '🏦', desc: 'How long to reach your target' },
      ]
    },
    {
      id: 'business',
      label: 'Business',
      icon: '📊',
      desc: 'Start, run, grow',
      href: '/business',
      color: '#f3e8fe',
      accent: '#9333ea',
      tools: [
        { label: 'Payroll Calculator', href: '/business/payroll',    icon: '💰', desc: 'Full employer cost per country' },
        { label: 'Break-even Calc',    href: '/business/break-even', icon: '📊', desc: 'When does your business pay?' },
        { label: 'Company Setup Cost', href: '/business/setup',      icon: '🏢', desc: 'Cost to register by country' },
        { label: 'Invoice Builder',    href: '/business/invoice',    icon: '🧾', desc: 'Africa-ready invoice generator' },
      ]
    },
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
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; font-family: 'DM Sans', system-ui, sans-serif; -webkit-font-smoothing: antialiased; }
    :host { display: block; }

    nav {
      position: sticky; top: 0; z-index: 500;
      height: 60px; background: #fff;
      border-bottom: 1px solid #e9ede9;
      display: flex; align-items: center;
      padding: 0 20px;
      transition: box-shadow 0.2s;
    }
    nav.scrolled { box-shadow: 0 2px 16px rgba(0,0,0,0.08); }

    .inner {
      max-width: 1200px; margin: 0 auto; width: 100%;
      display: flex; align-items: center; gap: 2px;
    }

    /* LOGO */
    .logo {
      display: flex; align-items: center; gap: 9px;
      text-decoration: none; flex-shrink: 0; margin-right: 12px;
    }
    .logo-name { font-size: 1rem; font-weight: 800; letter-spacing: 0.02em; color: #111827; }
    .logo-name b { color: #008751; }
    .logo-tag { font-size: 0.44rem; font-weight: 600; letter-spacing: 0.16em; text-transform: uppercase; color: #9ca3af; display: block; margin-top: 2px; }

    /* NAV LINKS */
    .nav-links { display: flex; align-items: center; list-style: none; flex: 1; gap: 0; }
    li { position: relative; }

    .lnk {
      display: flex; align-items: center; gap: 4px;
      padding: 7px 10px; border-radius: 6px;
      font-size: 0.81rem; font-weight: 600; color: #374151;
      text-decoration: none; border: none; background: transparent;
      cursor: pointer; white-space: nowrap;
      transition: color 0.13s, background 0.13s;
      min-height: 40px;
    }
    .lnk:hover, .lnk.open { color: #008751; background: #f0f9f4; }
    .chev { width: 7px; height: 4px; flex-shrink: 0; opacity: 0.4; transition: transform 0.18s, opacity 0.13s; }
    .lnk.open .chev { transform: rotate(180deg); opacity: 1; color: #008751; }

    /* MEGA MENU */
    .mega {
      position: fixed;
      top: 60px; left: 0; right: 0;
      background: #fff;
      border-bottom: 1px solid #e5ebe5;
      box-shadow: 0 16px 48px rgba(0,40,20,0.13), 0 2px 8px rgba(0,0,0,0.05);
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
      padding: 20px;
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 6px;
    }

    .mega-col {
      border-radius: 10px; padding: 14px;
      border: 1.5px solid transparent;
      transition: border-color 0.13s, background 0.13s;
    }
    .mega-col:hover { border-color: var(--col-accent, #008751); background: #fafdf9; }

    .mega-col-head {
      display: flex; align-items: center; gap: 9px;
      text-decoration: none; padding-bottom: 10px;
      border-bottom: 1px solid #f3f4f6;
      margin-bottom: 8px;
    }
    .mega-col-icon {
      width: 34px; height: 34px; border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      font-size: 1rem; flex-shrink: 0;
    }
    .mega-col-name { font-size: 0.83rem; font-weight: 800; color: #111827; line-height: 1.2; }
    .mega-col-desc { font-size: 0.65rem; font-weight: 400; color: #9ca3af; margin-top: 1px; }

    .mega-tool {
      display: flex; align-items: center; gap: 8px;
      padding: 6px 5px; border-radius: 6px;
      text-decoration: none;
      transition: background 0.1s;
      min-height: 38px;
    }
    .mega-tool:hover { background: #f0f9f4; }
    .mega-tool-icon { font-size: 0.85rem; flex-shrink: 0; width: 18px; text-align: center; }
    .mega-tool-label { font-size: 0.77rem; font-weight: 600; color: #374151; line-height: 1.2; }
    .mega-tool-desc { font-size: 0.64rem; font-weight: 400; color: #9ca3af; }

    .mega-footer {
      max-width: 1200px; margin: 0 auto;
      padding: 10px 20px 14px;
      border-top: 1px solid #f3f4f6;
      display: flex; align-items: center; justify-content: space-between;
    }
    .mega-footer-note { font-size: 0.68rem; color: #9ca3af; font-weight: 500; }
    .mega-footer-lnk { font-size: 0.72rem; font-weight: 700; color: #008751; text-decoration: none; }
    .mega-footer-lnk:hover { text-decoration: underline; }

    /* RIGHT */
    .right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; margin-left: auto; }
    .pill-54 { font-size: 0.66rem; font-weight: 600; color: #6b7280; padding: 4px 10px; border-radius: 20px; border: 1px solid #e5e7eb; background: #f9fafb; white-space: nowrap; }

    .btn-login {
      font-size: 0.79rem; font-weight: 600; color: #374151;
      padding: 7px 14px; border-radius: 6px;
      border: 1.5px solid #e5e7eb; background: #fff;
      text-decoration: none; white-space: nowrap;
      transition: all 0.13s; cursor: pointer;
    }
    .btn-login:hover { border-color: #008751; color: #008751; }

    .cta {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 8px 15px; border-radius: 6px;
      font-size: 0.79rem; font-weight: 700;
      text-decoration: none; background: #008751; color: #fff;
      border: none; cursor: pointer; white-space: nowrap;
      transition: background 0.13s, transform 0.1s;
      box-shadow: 0 1px 4px rgba(0,135,81,0.22);
    }
    .cta:hover  { background: #006940; transform: translateY(-1px); }
    .cta:active { transform: translateY(0); }

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
      top: 60px; left: 0; right: 0; bottom: 0;
      background: #fff; z-index: 498;
      overflow-y: auto; flex-direction: column;
      opacity: 0; pointer-events: none;
      transition: opacity 0.2s;
      padding-bottom: env(safe-area-inset-bottom, 48px);
    }
    .mob.open { opacity: 1; pointer-events: all; }

    .mob-section-label {
      font-size: 0.58rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase;
      color: #9ca3af; padding: 14px 20px 6px;
    }
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
    .mob-cat-label { font-size: 0.92rem; font-weight: 700; color: #111827; }
    .mob-cat-desc  { font-size: 0.7rem; font-weight: 400; color: #6b7280; margin-top: 1px; }
    .mob-arr { margin-left: auto; font-size: 0.7rem; color: #9ca3af; }

    .mob-footer {
      padding: 20px; border-top: 1px solid #f3f4f6; margin-top: 8px;
      display: flex; flex-direction: column; gap: 10px;
    }
    .mob-cta {
      display: flex; align-items: center; justify-content: center;
      padding: 15px; border-radius: 8px; font-size: 0.95rem; font-weight: 700;
      text-decoration: none; background: #008751; color: white; min-height: 52px;
    }
    .mob-login {
      display: flex; align-items: center; justify-content: center;
      padding: 13px; border-radius: 8px; font-size: 0.9rem; font-weight: 600;
      text-decoration: none; border: 1.5px solid #e5e7eb; color: #374151;
    }
    .mob-note { text-align: center; font-size: 0.7rem; font-weight: 500; color: #9ca3af; }

    /* RESPONSIVE */
    @media (max-width: 940px) {
      .nav-links, .pill-54, .btn-login { display: none; }
      .burger { display: flex; }
      .mob    { display: flex; }
      nav     { padding: 0 16px; }
    }
    @media (max-width: 480px) {
      .logo-tag { display: none; }
      nav { height: 56px; }
      .mob { top: 56px; }
    }
  `;

  class AfroNavbar extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this._menuOpen = false;
      this._megaOpen = false;
    }

    connectedCallback() { this._render(); this._bind(); }
    get active() { return this.getAttribute('active') || ''; }

    _megaContent() {
      return NAV_ITEMS.map(cat => `
        <div class="mega-col" style="--col-accent:${cat.accent}">
          <a href="${cat.href}" class="mega-col-head">
            <div class="mega-col-icon" style="background:${cat.color}">${cat.icon}</div>
            <div>
              <div class="mega-col-name">${cat.label}</div>
              <div class="mega-col-desc">${cat.desc}</div>
            </div>
          </a>
          ${cat.tools.map(t => `
            <a href="${t.href}" class="mega-tool">
              <span class="mega-tool-icon">${t.icon}</span>
              <div>
                <div class="mega-tool-label">${t.label}</div>
                <div class="mega-tool-desc">${t.desc}</div>
              </div>
            </a>`).join('')}
        </div>`).join('');
    }

    _mobileContent() {
      return NAV_ITEMS.map(cat => `
        <a href="${cat.href}" class="mob-cat">
          <div class="mob-cat-icon" style="background:${cat.color}">${cat.icon}</div>
          <div>
            <div class="mob-cat-label">${cat.label}</div>
            <div class="mob-cat-desc">${cat.desc}</div>
          </div>
          <span class="mob-arr">›</span>
        </a>`).join('');
    }

    _render() {
      this.shadowRoot.innerHTML = `
        <style>${CSS}</style>
        <nav role="navigation" aria-label="Main navigation">
          <div class="inner">
            <a href="/" class="logo" aria-label="AfroTools home">
              ${MARK}
              <div>
                <span class="logo-name">AFRO<b>TOOLS</b></span>
                <span class="logo-tag">Africa's Everything Platform</span>
              </div>
            </a>

            <ul class="nav-links">
              <li>
                <button class="lnk" id="allBtn" type="button" aria-haspopup="true" aria-expanded="false">
                  All Tools
                  <svg class="chev" viewBox="0 0 7 4" fill="none">
                    <polyline points="0.5,0.5 3.5,3.5 6.5,0.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
              </li>
              <li><a href="/salary-tax" class="lnk">Salary &amp; Tax</a></li>
              <li><a href="/tools/pdf-workspace" class="lnk">PDF Tools</a></li>
              <li><a href="/tools/currency-converter" class="lnk">Currency</a></li>
              <li><a href="/tools/cv-builder" class="lnk">CV Builder</a></li>
              <li><a href="/tools/vat-calculator" class="lnk">VAT</a></li>
            </ul>

            <div class="right">
              <span class="pill-54">🌍 54 countries</span>
              <a href="/login" class="btn-login">Sign in</a>
              <a href="/#newsletter" class="cta">Get Updates →</a>
              <button class="burger" type="button" aria-label="Open menu" aria-expanded="false">
                <span></span><span></span><span></span>
              </button>
            </div>
          </div>
        </nav>

        <div class="mega" id="mega" role="menu" aria-label="All tools">
          <div class="mega-inner">
            ${this._megaContent()}
          </div>
          <div class="mega-footer">
            <span class="mega-footer-note">🌍 54 African countries · free forever · no sign-up required</span>
            <a href="/all-tools" class="mega-footer-lnk">Browse all tools →</a>
          </div>
        </div>

        <div class="mob" role="dialog" aria-modal="true" aria-label="Navigation menu">
          <div class="mob-section-label">All Categories</div>
          ${this._mobileContent()}
          <div class="mob-footer">
            <a href="/#newsletter" class="mob-cta">Get Updates →</a>
            <a href="/login" class="mob-login">Sign In</a>
            <p class="mob-note">🌍 54 countries · always free · no sign-up required</p>
          </div>
        </div>`;
    }

    _bind() {
      const sr     = this.shadowRoot;
      const nav    = sr.querySelector('nav');
      const allBtn = sr.querySelector('#allBtn');
      const mega   = sr.querySelector('#mega');
      const burger = sr.querySelector('.burger');
      const mob    = sr.querySelector('.mob');

      // Scroll shadow
      if (this._scrollFn) window.removeEventListener('scroll', this._scrollFn);
      this._scrollFn = () => nav.classList.toggle('scrolled', window.scrollY > 4);
      window.addEventListener('scroll', this._scrollFn, { passive: true });
      this._scrollFn();

      const openMega  = () => { this._megaOpen = true;  allBtn.classList.add('open'); mega.classList.add('open'); allBtn.setAttribute('aria-expanded','true'); };
      const closeMega = () => { this._megaOpen = false; allBtn.classList.remove('open'); mega.classList.remove('open'); allBtn.setAttribute('aria-expanded','false'); };

      // Click toggle
      allBtn?.addEventListener('click', e => { e.stopPropagation(); this._megaOpen ? closeMega() : openMega(); });

      // Hover — keep open while moving between button and mega
      let hoverTimer;
      const navEl = allBtn?.closest('li');
      navEl?.addEventListener('mouseenter', () => { clearTimeout(hoverTimer); openMega(); });
      navEl?.addEventListener('mouseleave', () => { hoverTimer = setTimeout(closeMega, 150); });
      mega?.addEventListener('mouseenter', () => clearTimeout(hoverTimer));
      mega?.addEventListener('mouseleave', () => { hoverTimer = setTimeout(closeMega, 150); });

      // Click outside
      if (this._outsideFn) document.removeEventListener('click', this._outsideFn);
      this._outsideFn = e => { if (!this.contains(e.target)) closeMega(); };
      document.addEventListener('click', this._outsideFn);

      // Escape
      document.addEventListener('keydown', e => {
        if (e.key === 'Escape') { closeMega(); if (this._menuOpen) burger?.click(); }
      });

      // Mobile hamburger
      burger?.addEventListener('click', () => {
        this._menuOpen = !this._menuOpen;
        burger.classList.toggle('open', this._menuOpen);
        mob.classList.toggle('open', this._menuOpen);
        burger.setAttribute('aria-expanded', String(this._menuOpen));
        document.body.style.overflow = this._menuOpen ? 'hidden' : '';
        if (this._menuOpen) closeMega();
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
