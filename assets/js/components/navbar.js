/**
 * AFROTOOLS NAVBAR — Everything Platform Edition
 * Mega-menu with 12 categories from tool registry. Mobile drawer. Web Component.
 */
(function () {
  'use strict';

  const NAV_ITEMS = [
    {
      id: 'financial', label: 'Salary & Tax', icon: '💰',
      desc: 'PAYE, income tax, take-home pay',
      href: '/salary-tax/', color: '#e8f0fd', accent: '#007AFF',
      tools: []
    },
    {
      id: 'document-pdf', label: 'Document & PDF', icon: '📄',
      desc: 'Merge, split, compress, convert',
      href: '/document-pdf/', color: '#eff6ff', accent: '#3b82f6',
      tools: []
    },
    {
      id: 'image-design', label: 'Image & Design', icon: '🖼️',
      desc: 'Compress, resize, QR codes',
      href: '/image-design/', color: '#fdf2f8', accent: '#ec4899',
      tools: []
    },
    {
      id: 'developer', label: 'Developer Tools', icon: '⌨️',
      desc: 'JSON, Base64, hash, regex',
      href: '/developer-tools/', color: '#ede9fe', accent: '#8b5cf6',
      tools: []
    },
    {
      id: 'education', label: 'Education', icon: '🎓',
      desc: 'GPA, WAEC, loans, fees',
      href: '/education/', color: '#EEF4FF', accent: '#3B82F6',
      tools: []
    },
    {
      id: 'health', label: 'Health & Agriculture', icon: '🏥',
      desc: 'BMI, SHIF, pregnancy, crops',
      href: '/health/', color: '#fce8e8', accent: '#dc2626',
      tools: []
    },
    {
      id: 'ecommerce', label: 'VAT & Business Tax', icon: '🧾',
      desc: 'VAT, margins, break-even',
      href: '/vat-business-tax/', color: '#fff7ed', accent: '#f59e0b',
      tools: []
    },
    {
      id: 'legal', label: 'Mortgage & Property', icon: '🏠',
      desc: 'Registration, compliance, property',
      href: '/legal/', color: '#e0f2fe', accent: '#0ea5e9',
      tools: []
    },
    {
      id: 'data-productivity', label: 'Business & ROI', icon: '📊',
      desc: 'Productivity, data, investment',
      href: '/data-productivity/', color: '#eef2ff', accent: '#6366f1',
      tools: []
    },
    {
      id: 'language', label: 'Language & Translation', icon: '🗣️',
      desc: 'Yoruba, Swahili, Hausa, Amharic',
      href: '/language/', color: '#faf5ff', accent: '#a855f7',
      tools: []
    },
    {
      id: 'crypto', label: 'Crypto & Web3', icon: '₿',
      desc: 'P2P rates, prices, stablecoins, arbitrage',
      href: '/crypto/', color: '#fff7ed', accent: '#f97316',
      tools: [
        { label: 'P2P Rate Comparator', href: '/crypto/p2p-rates/', emoji: '₿', badge: 'LIVE' },
        { label: 'Live Crypto Prices', href: '/crypto/prices/', emoji: '📊', badge: 'LIVE' },
        { label: 'Portfolio Tracker', href: '/crypto/portfolio/', emoji: '📁', badge: 'LIVE' },
        { label: 'DCA Calculator', href: '/crypto/dca-calculator/', emoji: '📈', badge: 'LIVE' },
        { label: 'Crypto Tax', href: '/crypto/tax-calculator/', emoji: '🧾', badge: 'LIVE' },
        { label: 'Profit Calculator', href: '/crypto/profit-calculator/', emoji: '💰', badge: 'LIVE' },
        { label: 'Mining Calculator', href: '/crypto/mining-calculator/', emoji: '⛏️', badge: 'LIVE' },
        { label: 'Stablecoin Tracker', href: '/crypto/stablecoins/', emoji: '💵', badge: 'LIVE' },
        { label: 'Crypto Remittance', href: '/crypto/remittance/', emoji: '🌐', badge: 'LIVE' },
        { label: 'Naira Arbitrage', href: '/crypto/arbitrage/', emoji: '⚡', badge: 'LIVE' },
        { label: 'Scam Checker', href: '/crypto/scam-checker/', emoji: '🛡️', badge: 'NEW' },
        { label: 'Address Validator', href: '/crypto/address-validator/', emoji: '🔍', badge: 'NEW' },
        { label: 'Exchange Ratings', href: '/crypto/exchange-ratings/', emoji: '⭐', badge: 'NEW' },
        { label: 'Contract Scanner', href: '/crypto/contract-scanner/', emoji: '📜', badge: 'NEW' },
        { label: 'Crypto Quiz', href: '/crypto/quiz/', emoji: '🧠', badge: 'NEW' },
      ]
    },
    {
      id: 'african', label: 'Uniquely African', icon: '🌍',
      desc: 'Japa, generator, ajo, mobile money',
      href: '/african/', color: '#fef2f2', accent: '#dc2626',
      tools: [
        { label: 'AfroKitchen Recipes', href: '/tools/afrokitchen/', emoji: '🍲', badge: 'NEW' },
      ]
    },
    {
      id: 'francophone', label: 'Outils en Français', icon: '🇫🇷',
      desc: 'Salaire net, TVA — 14 pays',
      href: '/fr/', color: '#eef6ff', accent: '#0055A4',
      tools: [
        { label: "Côte d'Ivoire — Salaire", href: '/fr/cote-divoire/calculateur-salaire-net', emoji: '🇨🇮' },
        { label: 'Sénégal — Salaire', href: '/fr/senegal/calculateur-salaire-net', emoji: '🇸🇳' },
        { label: 'Cameroun — Salaire', href: '/fr/cameroun/calculateur-salaire-net', emoji: '🇨🇲' },
        { label: 'RD Congo — Salaire', href: '/fr/rdc/calculateur-salaire-net', emoji: '🇨🇩' },
        { label: 'Maroc — Salaire', href: '/fr/maroc/calculateur-salaire-net', emoji: '🇲🇦' },
        { label: 'Algérie — Salaire', href: '/fr/algerie/calculateur-salaire-net', emoji: '🇩🇿' },
        { label: 'Tunisie — Salaire', href: '/fr/tunisie/calculateur-salaire-net', emoji: '🇹🇳' },
        { label: 'Mali — Salaire', href: '/fr/mali/calculateur-salaire-net', emoji: '🇲🇱' },
        { label: 'Burkina Faso — Salaire', href: '/fr/burkina-faso/calculateur-salaire-net', emoji: '🇧🇫' },
        { label: 'Niger — Salaire', href: '/fr/niger/calculateur-salaire-net', emoji: '🇳🇪' },
        { label: 'Guinée — Salaire', href: '/fr/guinee/calculateur-salaire-net', emoji: '🇬🇳' },
        { label: 'Congo — Salaire', href: '/fr/congo/calculateur-salaire-net', emoji: '🇨🇬' },
        { label: 'Gabon — Salaire', href: '/fr/gabon/calculateur-salaire-net', emoji: '🇬🇦' },
        { label: 'Togo — Salaire', href: '/fr/togo/calculateur-salaire-net', emoji: '🇹🇬' },
        { label: 'Tous les calculateurs TVA →', href: '/fr/', emoji: '🧾' },
      ]
    },
    {
      id: 'engineering', label: 'Engineering & CAD', icon: '🔧',
      desc: 'Solar, structural, borehole, CAD',
      href: '/engineering/', color: '#f5f5f4', accent: '#78716c',
      tools: [
        { label: 'AfroDraft 2D CAD', href: '/engineering/afrodraft/', emoji: '📐', badge: 'LIVE' },
        { label: 'Solar Calculator', href: '/tools/solar-calculator/', emoji: '☀️', badge: 'Soon' },
        { label: 'AfroPlan Floor Planner', href: '/engineering/floor-planner/', emoji: '🏗️', badge: 'NEW' },
        { label: 'Bill of Quantities', href: '/tools/boq-generator/', emoji: '📋', badge: 'Soon' },
      ]
    },
  ];

  const MARK = `<svg viewBox="0 0 68 68" fill="none" xmlns="http://www.w3.org/2000/svg" style="height:30px;width:30px;flex-shrink:0">
    <polygon points="34,20 48,34 34,48 20,34" fill="#007AFF"/>
    <polygon points="34,2  44,14 34,20 24,14" fill="#F5A623"/>
    <polygon points="34,48 44,60 34,68 24,60" fill="#0047AB"/>
    <polygon points="2,24  14,34 2,44  -10,34" fill="#007AFF" opacity="0.7"/>
    <polygon points="52,24 64,34 52,44 40,34"  fill="#007AFF" opacity="0.55"/>
  </svg>`;

  const CSS = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; font-family: 'DM Sans', system-ui, sans-serif; -webkit-font-smoothing: antialiased; }
    :host {
      display: block;
      position: sticky;
      top: 0;
      z-index: 500;
    }

    nav {
      position: relative;
      height: 60px;
      background: rgba(248, 250, 253, 0.95);
      backdrop-filter: blur(20px) saturate(180%);
      -webkit-backdrop-filter: blur(20px) saturate(180%);
      border-bottom: 1px solid rgba(0, 0, 0, 0.06);
      display: flex; align-items: center;
      padding: 0 20px;
      transition: box-shadow 0.2s;
    }
    nav.scrolled { box-shadow: 0 1px 0 rgba(0,0,0,0.06), 0 4px 24px rgba(0,0,0,0.04); }

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
    .logo-name b { color: #007AFF; }
    .logo-tag { font-size: 0.44rem; font-weight: 600; letter-spacing: 0.16em; text-transform: uppercase; color: #9ca3af; display: block; margin-top: 2px; }

    /* NAV LINKS */
    .nav-links { display: flex; align-items: center; list-style: none; flex: 1; gap: 0; overflow: hidden; min-width: 0; }
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
    .lnk:hover, .lnk.open { color: #007AFF; background: #EEF4FF; }
    .lnk.active { color: #007AFF; position: relative; }
    .lnk.active::after { content: ''; position: absolute; bottom: 2px; left: 50%; transform: translateX(-50%); width: 16px; height: 2px; background: #007AFF; border-radius: 2px; }
    .chev { width: 7px; height: 4px; flex-shrink: 0; opacity: 0.4; transition: transform 0.18s, opacity 0.13s; }
    .lnk.open .chev { transform: rotate(180deg); opacity: 1; color: #007AFF; }

    /* MEGA MENU */
    .mega {
      position: fixed;
      top: 60px; left: 0; right: 0;
      background: rgba(255,255,255,0.85);
      -webkit-backdrop-filter: saturate(180%) blur(20px);
      backdrop-filter: saturate(180%) blur(20px);
      border-bottom: 1px solid rgba(0,0,0,0.07);
      box-shadow: 0 16px 48px rgba(0,71,227,0.07), 0 2px 8px rgba(0,0,0,0.04);
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
      display: flex; align-items: center; gap: 9px;
      text-decoration: none; cursor: pointer;
    }
    .mega-col:hover { border-color: var(--col-accent, #007AFF); background: #f0f7ff; }

    .mega-col-icon {
      width: 34px; height: 34px; border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      font-size: 1rem; flex-shrink: 0;
    }
    .mega-col-name { font-size: 0.83rem; font-weight: 800; color: #111827; line-height: 1.2; }
    .mega-col-desc { font-size: 0.65rem; font-weight: 400; color: #9ca3af; margin-top: 1px; }

    .mega-footer {
      max-width: 1200px; margin: 0 auto;
      padding: 10px 20px 14px;
      border-top: 1px solid #f3f4f6;
      display: flex; align-items: center; justify-content: space-between;
    }
    .mega-footer-note { font-size: 0.68rem; color: #9ca3af; font-weight: 500; }
    .mega-footer-lnk { font-size: 0.72rem; font-weight: 700; color: #007AFF; text-decoration: none; }
    .mega-footer-lnk:hover { text-decoration: underline; }

    /* RIGHT */
    .right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; margin-left: auto; }
    .pill-54 { font-size: 0.66rem; font-weight: 600; color: #6b7280; padding: 4px 10px; border-radius: 20px; border: 1px solid #e5e7eb; background: #f9fafb; white-space: nowrap; }

    .btn-login {
      font-size: 0.79rem; font-weight: 600; color: #374151;
      padding: 7px 14px; border-radius: 980px;
      border: 1.5px solid rgba(0,0,0,0.12); background: rgba(0,0,0,0.03);
      text-decoration: none; white-space: nowrap;
      transition: all 0.13s; cursor: pointer;
    }
    .btn-login:hover { border-color: #007AFF; color: #007AFF; }

    .cta {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 8px 16px; border-radius: 980px;
      font-size: 0.79rem; font-weight: 700;
      text-decoration: none; background: #007AFF; color: #fff;
      border: none; cursor: pointer; white-space: nowrap;
      transition: background 0.13s, transform 0.1s;
      box-shadow: 0 1px 4px rgba(0,122,255,0.28);
    }
    .cta:hover  { background: #005BBF; transform: translateY(-1px); }
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
      padding: 15px; border-radius: 980px; font-size: 0.95rem; font-weight: 700;
      text-decoration: none; background: #007AFF; color: white; min-height: 52px;
    }
    .mob-login {
      display: flex; align-items: center; justify-content: center;
      padding: 13px; border-radius: 8px; font-size: 0.9rem; font-weight: 600;
      text-decoration: none; border: 1.5px solid #e5e7eb; color: #374151;
    }
    .mob-note { text-align: center; font-size: 0.7rem; font-weight: 500; color: #9ca3af; }

    /* RESPONSIVE — progressive collapse */
    .pill-54 { display: none; }
    @media (max-width: 1280px) {
      .cta-embed { display: none; }
    }
    @media (max-width: 1100px) {
      .cta { display: none; }
    }
    @media (max-width: 940px) {
      .nav-links, .pill-54, .cta { display: none; }
      .btn-login { border: none; padding: 4px 8px; max-width: none; overflow: hidden; font-size: 0.75rem; }
      .btn-login .nav-user-name, .btn-login .user-menu-name { display: none !important; width: 0 !important; height: 0 !important; overflow: hidden !important; font-size: 0 !important; }
      .btn-login span:first-child { margin-right: 0 !important; }
      .burger { display: flex; }
      .mob    { display: flex; }
      nav     { padding: 0 16px; max-width: 100vw !important; overflow-x: hidden !important; }
    }
    @media (max-width: 480px) {
      .logo-tag { display: none; }
      nav { height: 56px; }
      .mob { top: 56px; }
    }

    /* SEARCH BUTTON */
    .search-btn {
      display: flex; align-items: center; justify-content: center;
      width: 36px; height: 36px; border-radius: 980px;
      border: 1px solid rgba(0,0,0,0.1); background: rgba(0,0,0,0.04);
      cursor: pointer; color: #6b7280;
      transition: all 0.13s; flex-shrink: 0;
    }
    .search-btn:hover { border-color: #007AFF; color: #007AFF; background: #EEF4FF; }
    .search-btn svg { width: 16px; height: 16px; }
    .search-kbd {
      font-size: 0.55rem; font-weight: 600; color: #9ca3af;
      margin-left: 4px; background: #f3f4f6; border-radius: 4px;
      padding: 1px 5px; border: 1px solid #e5e7eb;
      display: none;
    }
    @media (min-width: 941px) {
      .search-btn { width: auto; padding: 0 10px; gap: 6px; }
      .search-kbd { display: inline; }
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
      font-size: 0.6rem; font-weight: 600; color: #9ca3af;
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
      font-size: 0.55rem; font-weight: 600; color: #9ca3af;
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
      font-size: 0.62rem; color: #9ca3af; font-weight: 500;
      display: flex; align-items: center; gap: 8px;
    }
    .search-footer-hint kbd {
      background: #f3f4f6; border: 1px solid #e5e7eb;
      border-radius: 3px; padding: 1px 5px;
      font-size: 0.58rem; font-weight: 600; font-family: inherit;
    }

    /* RECENT TOOLS in search */
    .search-section-label {
      font-size: 0.58rem; font-weight: 700; letter-spacing: 0.1em;
      text-transform: uppercase; color: #9ca3af;
      padding: 10px 12px 4px;
    }
    .recent-clear {
      font-size: 0.58rem; font-weight: 600; color: #007AFF;
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
    }
    .mob-search-bar:focus-within { border-color: #007AFF; background: #fff; }
    .mob-search-bar svg { width: 16px; height: 16px; color: #9ca3af; flex-shrink: 0; }
    .mob-search-input {
      flex: 1; border: none; outline: none;
      font-size: 0.9rem; font-weight: 500; color: #111827;
      font-family: 'DM Sans', system-ui, sans-serif;
      background: transparent;
    }
    .mob-search-input::placeholder { color: #c4c8cc; }
    .mob-search-results {
      padding: 0 8px 8px;
    }
    .mob-search-results .search-result {
      padding: 12px 12px;
    }
    .mob-search-results .search-result-icon {
      width: 36px; height: 36px;
    }
    .mob-search-empty {
      padding: 20px 16px; text-align: center;
      font-size: 0.8rem; color: #9ca3af; font-weight: 500;
    }
  `;

  class AfroNavbar extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this._menuOpen = false;
      this._megaOpen = false;
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
    get active() { return this.getAttribute('active') || ''; }

    _megaContent() {
      return NAV_ITEMS.map(cat => `
        <a href="${cat.href}" class="mega-col" style="--col-accent:${cat.accent}">
          <div class="mega-col-icon" style="background:${cat.color}">${cat.icon}</div>
          <div>
            <div class="mega-col-name">${cat.label}</div>
            <div class="mega-col-desc">${cat.desc}</div>
          </div>
        </a>`).join('');
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
              <li><a href="/salary-tax/" class="lnk">Salary &amp; Tax</a></li>
              <li><a href="/document-pdf/" class="lnk">PDF Tools</a></li>
              <li><a href="/developer-tools/" class="lnk">Dev Tools</a></li>
              <li><a href="/african/" class="lnk">African</a></li>
              <li><a href="/education/" class="lnk">Education</a></li>
              <li><a href="/blog/" class="lnk">Blog</a></li>
              <li><a href="/api/" class="lnk">API</a></li>
              <li><a href="/pro/" class="lnk" style="color:#F5A623;font-weight:700">Pro</a></li>
            </ul>

            <div class="right">
              <button class="search-btn" id="searchBtn" type="button" aria-label="Search tools">
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="8.5" cy="8.5" r="5.5"/><line x1="13" y1="13" x2="18" y2="18"/>
                </svg>
                <span class="search-kbd">Ctrl K</span>
              </button>
              <span class="pill-54">🌍 54 countries</span>
              <a href="/dashboard/" class="btn-login">Sign in</a>
              <a href="/widgets/demo/" class="cta cta-embed" style="background:transparent;border:1.5px solid var(--clr-accent,#007AFF);color:var(--clr-accent,#007AFF);font-size:12px;padding:7px 14px">Embed Tools</a>
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
            <a href="/all-tools/" class="mega-footer-lnk">Browse all tools →</a>
          </div>
        </div>

        <div class="mob" role="dialog" aria-modal="true" aria-label="Navigation menu">
          <div class="mob-search-bar">
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="8.5" cy="8.5" r="5.5"/><line x1="13" y1="13" x2="18" y2="18"/>
            </svg>
            <input class="mob-search-input" type="text" placeholder="Search tools..." aria-label="Search tools" autocomplete="off"/>
          </div>
          <div class="mob-search-results" id="mobSearchResults"></div>
          <div id="mobCategoriesWrap">
            <div class="mob-section-label">All Categories</div>
            ${this._mobileContent()}
          </div>
          <div class="mob-footer">
            <a href="/dashboard/" class="mob-login">Sign In</a>
            <a href="/dashboard/vault/" class="mob-vault-link" style="display:none;padding:10px 13px;border-radius:8px;font-size:0.85rem;font-weight:600;text-decoration:none;color:#007AFF;border:1.5px solid #007AFF;text-align:center;">📁 My Vault</a>
            <p class="mob-note">🌍 54 countries · always free · no sign-up required</p>
          </div>
        </div>

        <div class="search-overlay" id="searchOverlay" role="dialog" aria-modal="true" aria-label="Search tools">
          <div class="search-modal">
            <div class="search-input-wrap">
              <svg viewBox="0 0 20 20" fill="none" stroke="#9ca3af" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="8.5" cy="8.5" r="5.5"/><line x1="13" y1="13" x2="18" y2="18"/>
              </svg>
              <input class="search-input" id="searchInput" type="text" placeholder="Search tools…" aria-label="Search tools" autocomplete="off"/>
              <span class="search-esc" id="searchEsc">ESC</span>
            </div>
            <div class="search-results" id="searchResults">
              <div class="search-empty">
                <div class="search-empty-icon">🔍</div>
                <div class="search-empty-text">Search 100+ African tools</div>
                <div class="search-empty-hint">Try "PAYE", "PDF", "japa", "BMI"…</div>
              </div>
            </div>
            <div class="search-footer">
              <div class="search-footer-hint">
                <span><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
                <span><kbd>↵</kbd> open</span>
                <span><kbd>esc</kbd> close</span>
              </div>
            </div>
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

      // ── ACTIVE PAGE INDICATOR ──
      const path = window.location.pathname;
      sr.querySelectorAll('.nav-links .lnk[href]').forEach(link => {
        const href = link.getAttribute('href');
        if (href && href !== '/' && path.startsWith(href)) {
          link.classList.add('active');
        }
      });

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

      // ── SEARCH ──
      const searchBtn     = sr.querySelector('#searchBtn');
      const searchOverlay = sr.querySelector('#searchOverlay');
      const searchInput   = sr.querySelector('#searchInput');
      const searchResults = sr.querySelector('#searchResults');
      const searchEsc     = sr.querySelector('#searchEsc');
      const mobSearchInput   = sr.querySelector('.mob-search-input');
      const mobSearchResults = sr.querySelector('#mobSearchResults');
      const mobCategoriesWrap = sr.querySelector('#mobCategoriesWrap');

      // Mac detection for shortcut label
      const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.platform || navigator.userAgent || '');
      const kbdEl = sr.querySelector('.search-kbd');
      if (kbdEl) kbdEl.textContent = isMac ? '⌘ K' : 'Ctrl K';

      let _activeIdx = -1;

      const getTools = () => {
        if (typeof AFRO_TOOLS !== 'undefined' && Array.isArray(AFRO_TOOLS)) {
          var pageLang = document.documentElement.lang || 'en';
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

      const getCategoryLabel = (catId) => {
        const cat = NAV_ITEMS.find(c => c.id === catId);
        return cat ? cat.label : catId;
      };

      const searchTools = (query) => {
        const tools = getTools();
        if (!tools) return null;
        if (!query || query.length < 1) return [];
        const q = query.toLowerCase().trim();
        const scored = [];
        for (const t of tools) {
          const nameL = t.name.toLowerCase();
          const descL = t.desc.toLowerCase();
          let score = 0;
          if (nameL === q) score = 100;
          else if (nameL.startsWith(q)) score = 80;
          else if (nameL.includes(q)) score = 60;
          else if (descL.includes(q)) score = 30;
          else {
            const words = q.split(/\s+/);
            const allMatch = words.every(w => nameL.includes(w) || descL.includes(w));
            if (allMatch) score = 20;
          }
          if (score > 0) scored.push({ tool: t, score });
        }
        scored.sort((a, b) => b.score - a.score);
        return scored.slice(0, 8).map(s => s.tool);
      };

      const renderResults = (tools, query, container) => {
        if (tools === null) {
          container.innerHTML = '<div class="search-empty"><div class="search-empty-icon">⏳</div><div class="search-empty-text">Loading tools…</div><div class="search-empty-hint">Tool registry not loaded yet</div></div>';
          return;
        }
        if (!query || query.length < 1) {
          // Show recently used tools if any
          const recent = getRecent();
          if (recent.length > 0) {
            container.innerHTML = '<div class="search-section-label">Recently Used <button class="recent-clear" id="clearRecent">Clear</button></div>' +
              recent.map((t, i) => `
                <a href="${t.href}" class="search-result${i === 0 ? ' active' : ''}" data-idx="${i}">
                  <div class="search-result-icon">${escapeHtml(t.icon || '🔧')}</div>
                  <div>
                    <div class="search-result-name">${escapeHtml(t.name)}</div>
                  </div>
                </a>`).join('') +
              '<div class="search-section-label" style="padding-top:16px">All Tools</div>' +
              '<div class="search-empty" style="padding:16px"><div class="search-empty-hint">Type to search 400+ tools</div></div>';
            _activeIdx = 0;
            container.querySelector('#clearRecent')?.addEventListener('click', e => {
              e.preventDefault(); e.stopPropagation();
              try { localStorage.removeItem(RECENT_KEY); } catch {}
              container.innerHTML = '<div class="search-empty"><div class="search-empty-icon">🔍</div><div class="search-empty-text">Search 100+ African tools</div><div class="search-empty-hint">Try "PAYE", "PDF", "japa", "BMI"…</div></div>';
            });
            return;
          }
          container.innerHTML = '<div class="search-empty"><div class="search-empty-icon">🔍</div><div class="search-empty-text">Search 100+ African tools</div><div class="search-empty-hint">Try "PAYE", "PDF", "japa", "BMI"…</div></div>';
          return;
        }
        if (tools.length === 0) {
          container.innerHTML = '<div class="search-empty"><div class="search-empty-icon">😔</div><div class="search-empty-text">No tools found</div><div class="search-empty-hint">Try a different search term</div></div>';
          return;
        }
        _activeIdx = 0;
        container.innerHTML = tools.map((t, i) => `
          <a href="${t.href}" class="search-result${i === 0 ? ' active' : ''}" data-idx="${i}">
            <div class="search-result-icon">${escapeHtml(t.icon || '🔧')}</div>
            <div>
              <div class="search-result-name">${highlightMatch(t.name, query)}</div>
              <div class="search-result-desc">${escapeHtml(t.desc)}</div>
              <div class="search-result-cat">${escapeHtml(getCategoryLabel(t.category))}</div>
            </div>
          </a>`).join('');
      };

      const openSearch = () => {
        searchOverlay.classList.add('open');
        document.body.style.overflow = 'hidden';
        _activeIdx = -1;
        setTimeout(() => searchInput.focus(), 60);
      };

      const closeSearch = () => {
        searchOverlay.classList.remove('open');
        document.body.style.overflow = this._menuOpen ? 'hidden' : '';
        searchInput.value = '';
        searchResults.innerHTML = '<div class="search-empty"><div class="search-empty-icon">🔍</div><div class="search-empty-text">Search 100+ African tools</div><div class="search-empty-hint">Try "PAYE", "PDF", "japa", "BMI"…</div></div>';
        _activeIdx = -1;
      };

      // Open search
      searchBtn?.addEventListener('click', e => { e.stopPropagation(); openSearch(); });
      searchEsc?.addEventListener('click', closeSearch);

      // Click overlay to close
      searchOverlay?.addEventListener('click', e => { if (e.target === searchOverlay) closeSearch(); });

      // Search input handler
      let _debounce;
      searchInput?.addEventListener('input', () => {
        clearTimeout(_debounce);
        _debounce = setTimeout(() => {
          const q = searchInput.value.trim();
          const results = searchTools(q);
          renderResults(results, q, searchResults);
        }, 80);
      });

      // Keyboard nav in search
      searchInput?.addEventListener('keydown', e => {
        const items = searchResults.querySelectorAll('.search-result');
        if (!items.length) return;
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          _activeIdx = Math.min(_activeIdx + 1, items.length - 1);
          items.forEach((el, i) => el.classList.toggle('active', i === _activeIdx));
          items[_activeIdx]?.scrollIntoView({ block: 'nearest' });
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          _activeIdx = Math.max(_activeIdx - 1, 0);
          items.forEach((el, i) => el.classList.toggle('active', i === _activeIdx));
          items[_activeIdx]?.scrollIntoView({ block: 'nearest' });
        } else if (e.key === 'Enter') {
          e.preventDefault();
          if (_activeIdx >= 0 && items[_activeIdx]) {
            const href = items[_activeIdx].getAttribute('href');
            if (href) window.location.href = href;
          }
        }
      });

      // Click on result
      searchResults?.addEventListener('click', e => {
        const result = e.target.closest('.search-result');
        if (result) {
          closeSearch();
        }
      });

      // Global keyboard shortcuts (Ctrl+K / Cmd+K and Escape)
      if (this._searchKeyFn) document.removeEventListener('keydown', this._searchKeyFn);
      this._searchKeyFn = e => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
          e.preventDefault();
          if (searchOverlay.classList.contains('open')) closeSearch();
          else openSearch();
        }
        if (e.key === 'Escape' && searchOverlay.classList.contains('open')) {
          closeSearch();
        }
      };
      document.addEventListener('keydown', this._searchKeyFn);

      // ── MOBILE SEARCH ──
      let _mobDebounce;
      mobSearchInput?.addEventListener('input', () => {
        clearTimeout(_mobDebounce);
        _mobDebounce = setTimeout(() => {
          const q = mobSearchInput.value.trim();
          if (!q) {
            mobSearchResults.innerHTML = '';
            mobCategoriesWrap.style.display = '';
            return;
          }
          const results = searchTools(q);
          if (results === null) {
            mobSearchResults.innerHTML = '<div class="mob-search-empty">Loading tools…</div>';
            mobCategoriesWrap.style.display = 'none';
            return;
          }
          if (results.length === 0) {
            mobSearchResults.innerHTML = '<div class="mob-search-empty">No tools found</div>';
            mobCategoriesWrap.style.display = 'none';
            return;
          }
          mobCategoriesWrap.style.display = 'none';
          mobSearchResults.innerHTML = results.map(t => `
            <a href="${t.href}" class="search-result">
              <div class="search-result-icon">${escapeHtml(t.icon || '🔧')}</div>
              <div>
                <div class="search-result-name">${highlightMatch(t.name, q)}</div>
                <div class="search-result-desc">${escapeHtml(t.desc)}</div>
              </div>
            </a>`).join('');
        }, 100);
      });

      // Clear mobile search when closing drawer
      const origBurgerClick = () => {
        if (!this._menuOpen && mobSearchInput) {
          mobSearchInput.value = '';
          mobSearchResults.innerHTML = '';
          if (mobCategoriesWrap) mobCategoriesWrap.style.display = '';
        }
      };
      burger?.addEventListener('click', origBurgerClick);

      // ── AUTH STATE: update Sign-in button when user logs in/out ──
      const loginBtn = sr.querySelector('.btn-login');
      const mobLoginBtn = sr.querySelector('.mob-login');
      const mobVaultLink = sr.querySelector('.mob-vault-link');

      const updateAuthUI = () => {
        if (typeof AfroAuth === 'undefined' || !AfroAuth.isLoggedIn || !AfroAuth.isLoggedIn()) {
          // Not logged in — show Sign in
          if (loginBtn) { loginBtn.textContent = 'Sign in'; loginBtn.href = '/dashboard/'; }
          if (mobLoginBtn) { mobLoginBtn.textContent = 'Sign In'; mobLoginBtn.href = '/dashboard/'; }
          if (mobVaultLink) mobVaultLink.style.display = 'none';
          return;
        }
        const user = AfroAuth.getUser();
        const name = (user && user.name) ? user.name.split(' ')[0] : 'Dashboard';
        const initial = name[0].toUpperCase();
        // Desktop: show avatar initial + first name
        if (loginBtn) {
          loginBtn.href = '/dashboard/';
          loginBtn.innerHTML = '<span style="display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;background:#007AFF;color:#fff;border-radius:50%;font-size:10px;font-weight:800;margin-right:5px;">' + initial + '</span><span class="nav-user-name user-menu-name">' + name + '</span>';
        }
        // Mobile: show name + vault link
        if (mobLoginBtn) {
          mobLoginBtn.href = '/dashboard/';
          mobLoginBtn.textContent = name + ' \u2014 Dashboard';
        }
        if (mobVaultLink) mobVaultLink.style.display = '';
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
    }
  }

  if (!customElements.get('afro-navbar')) {
    customElements.define('afro-navbar', AfroNavbar);
  }

  /* ── ANIMATIONS: inject CSS + JS on every page for modern UI ── */
  (function _animations() {
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
  })();

  /* ── PRO GATE: inject on tool pages for upsell banners ── */
  (function _proGate() {
    const s = document.createElement('script'); s.src = '/assets/js/pro-gate.js'; s.defer = true;
    document.head.appendChild(s);
  })();

  /* ── SHARE IMAGE: auto-inject on tool pages with .action-row ── */
  (function _shareImage() {
    function tryInject() {
      if (document.querySelector('.action-row') && !document.getElementById('afro-share-img-js')) {
        const s = document.createElement('script'); s.id = 'afro-share-img-js';
        s.src = '/assets/js/share-image-inject.js'; s.defer = true;
        document.head.appendChild(s);
      }
    }
    if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', tryInject); }
    else { tryInject(); }
  })();

  /* ── PWA: inject manifest, theme-color & service worker from navbar (every page) ── */
  (function _pwa() {
    if (!document.querySelector('link[rel="manifest"]')) {
      const l = document.createElement('link'); l.rel = 'manifest'; l.href = '/manifest.json';
      document.head.appendChild(l);
    }
    if (!document.querySelector('meta[name="theme-color"]')) {
      const m = document.createElement('meta'); m.name = 'theme-color'; m.content = '#007AFF';
      document.head.appendChild(m);
    }
    const s = document.createElement('script'); s.src = '/assets/js/pwa-install.js'; s.defer = true;
    document.head.appendChild(s);
  })();

  /* ── SUPABASE AUTH: inject on every page for auth modal + session ── */
  (function _auth() {
    if (window._afroSupaAuthLoaded) return;
    if (!document.getElementById('afro-supabase-auth-js')) {
      const s = document.createElement('script'); s.id = 'afro-supabase-auth-js';
      s.src = '/assets/js/supabase-auth.js?v=5'; document.head.appendChild(s);
    }
  })();
})();
