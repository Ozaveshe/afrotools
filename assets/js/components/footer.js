/**
 * AFROTOOLS FOOTER — Web Component
 * Usage: <afro-footer></afro-footer>
 * Edit LINKS config to update all pages at once.
 */
(function () {
  'use strict';

  const YEAR = new Date().getFullYear();

  const LINKS = {
    tools: [
      { en: 'Salary & Tax',        fr: 'Salaire & Impôts',   href: '/salary-tax' },
      { en: 'VAT & Business Tax',  fr: 'TVA & Fiscalité',    href: '/vat-business-tax' },
      { en: 'Mortgage & Property', fr: 'Immobilier',          href: '/mortgage' },
      { en: 'Business & ROI',      fr: 'Entreprise & ROI',   href: '/business-roi' },
      { en: 'Education',           fr: 'Éducation',           href: '/education' },
      { en: 'Health & Insurance',  fr: 'Santé & Assurance',  href: '/health-insurance' },
    ],
    countries: [
      { en: '🇳🇬 Nigeria',      href: '/nigeria' },
      { en: '🇰🇪 Kenya',        href: '/kenya' },
      { en: '🇬🇭 Ghana',        href: '/ghana' },
      { en: '🇿🇦 South Africa', href: '/south-africa' },
      { en: '🇪🇬 Egypt',        href: '/egypt' },
      { en: '🇹🇿 Tanzania',     href: '/tanzania' },
    ],
    company: [
      { en: 'About',      fr: 'À propos',   href: '/about' },
      { en: 'Contact',    fr: 'Contact',     href: '/contact' },
      { en: 'Advertise',  fr: 'Publicité',   href: '/advertise' },
      { en: 'API Access', fr: 'Accès API',   href: '/api' },
    ],
  };

  // Meridian Diamond — dark variant (footer is always dark bg)
  const MARK = `
    <svg viewBox="0 0 68 68" fill="none" xmlns="http://www.w3.org/2000/svg" style="height:34px;width:34px;flex-shrink:0">
      <polygon points="34,20 48,34 34,48 20,34" fill="#00c873"/>
      <polygon points="34,2  44,14 34,20 24,14" fill="#F5A623"/>
      <polygon points="34,48 44,60 34,68 24,60" fill="#008751"/>
      <polygon points="2,24  14,34 2,44  -10,34" fill="#5ddb9e" opacity="0.6"/>
      <polygon points="52,24 64,34 52,44 40,34"  fill="#5ddb9e" opacity="0.48"/>
      <line x1="34" y1="20" x2="34" y2="48" stroke="#F5A623" stroke-width="0.8" opacity="0.28"/>
      <line x1="20" y1="34" x2="48" y2="34" stroke="#F5A623" stroke-width="0.8" opacity="0.28"/>
    </svg>`;

  const CSS = `
    :host { display: block; }
    footer {
      background: #080f0a;
      border-top: 1px solid rgba(255,255,255,0.06);
      font-family: 'Barlow', Arial, sans-serif;
      color: white;
    }
    .wrap { max-width: 1200px; margin: 0 auto; padding: 0 32px; }

    /* ── TOP: logo + newsletter ── */
    .top {
      display: grid; grid-template-columns: 1fr 1fr;
      gap: 56px; padding: 64px 0 56px;
      border-bottom: 1px solid rgba(255,255,255,0.06);
      align-items: start;
    }
    .logo-row { display: flex; align-items: center; gap: 10px; text-decoration: none; margin-bottom: 16px; }
    .logo-text { display: flex; flex-direction: column; gap: 2px; line-height: 1; }
    .logo-name {
      font-family: 'Barlow Condensed', 'Arial Narrow', sans-serif;
      font-size: 1.2rem; font-weight: 800; letter-spacing: 0.04em;
      color: white;
    }
    .logo-name b { color: #5ddb9e; }
    .logo-tagline {
      font-family: 'Barlow', Arial, sans-serif;
      font-size: 0.46rem; font-weight: 400;
      letter-spacing: 0.22em; text-transform: uppercase;
      color: rgba(255,255,255,0.25);
    }
    .tagline {
      font-size: 0.83rem; font-weight: 300;
      color: rgba(255,255,255,0.35);
      line-height: 1.75; max-width: 320px;
    }

    /* Newsletter */
    .nl-eyebrow {
      font-family: 'Barlow Condensed', sans-serif;
      font-size: 0.62rem; font-weight: 700;
      letter-spacing: 0.2em; text-transform: uppercase;
      color: #5ddb9e; margin-bottom: 6px;
    }
    .nl-title {
      font-family: 'Barlow Condensed', sans-serif;
      font-size: 1.35rem; font-weight: 800;
      text-transform: uppercase; letter-spacing: 0.04em;
      color: white; line-height: 1.2; margin-bottom: 18px;
    }
    .nl-form { display: flex; gap: 8px; max-width: 400px; }
    .nl-input {
      flex: 1; min-width: 0;
      padding: 11px 14px;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 4px;
      font-family: 'Barlow', Arial, sans-serif;
      font-size: 0.875rem; color: white; outline: none;
      transition: border-color 0.18s;
    }
    .nl-input::placeholder { color: rgba(255,255,255,0.25); }
    .nl-input:focus { border-color: #008751; }
    .nl-btn {
      padding: 11px 18px; flex-shrink: 0;
      background: #008751; color: white; border: none;
      border-radius: 4px;
      font-family: 'Barlow Condensed', sans-serif;
      font-size: 0.78rem; font-weight: 800;
      letter-spacing: 0.08em; text-transform: uppercase;
      cursor: pointer; transition: background 0.18s; white-space: nowrap;
    }
    .nl-btn:hover { background: #00a863; }
    .nl-note {
      margin-top: 10px; font-size: 0.72rem;
      font-weight: 300; color: rgba(255,255,255,0.18);
    }

    /* ── LINKS GRID ── */
    .links {
      display: grid; grid-template-columns: repeat(3, 1fr);
      gap: 32px; padding: 52px 0;
      border-bottom: 1px solid rgba(255,255,255,0.06);
    }
    .col-title {
      font-family: 'Barlow Condensed', sans-serif;
      font-size: 0.6rem; font-weight: 700;
      letter-spacing: 0.2em; text-transform: uppercase;
      color: rgba(255,255,255,0.25); margin-bottom: 16px;
    }
    .col-link {
      display: block; padding: 3.5px 0;
      font-size: 0.83rem; font-weight: 300;
      color: rgba(255,255,255,0.42); text-decoration: none;
      transition: color 0.13s; line-height: 1.5;
    }
    .col-link:hover { color: #5ddb9e; }

    /* ── STATS ── */
    .stats {
      display: grid; grid-template-columns: repeat(4, 1fr);
      gap: 16px; padding: 36px 0;
      border-bottom: 1px solid rgba(255,255,255,0.06);
      text-align: center;
    }
    .stat-n {
      font-family: 'Barlow Condensed', sans-serif;
      font-size: 1.75rem; font-weight: 800; color: #5ddb9e; line-height: 1;
    }
    .stat-l {
      font-size: 0.72rem; font-weight: 300;
      color: rgba(255,255,255,0.28); margin-top: 4px;
    }

    /* ── BOTTOM ── */
    .bottom {
      display: flex; align-items: center;
      justify-content: space-between;
      padding: 20px 0; flex-wrap: wrap; gap: 12px;
    }
    .copy { font-size: 0.75rem; font-weight: 300; color: rgba(255,255,255,0.18); }
    .legal { display: flex; gap: 20px; }
    .legal a {
      font-size: 0.75rem; font-weight: 300;
      color: rgba(255,255,255,0.2); text-decoration: none; transition: color 0.13s;
    }
    .legal a:hover { color: rgba(255,255,255,0.55); }
    .disc {
      width: 100%; padding-top: 16px;
      border-top: 1px solid rgba(255,255,255,0.04);
      font-size: 0.7rem; font-weight: 300;
      color: rgba(255,255,255,0.1); line-height: 1.65;
    }

    @media (max-width: 900px) {
      .top   { grid-template-columns: 1fr; gap: 36px; }
      .links { grid-template-columns: 1fr 1fr; }
      .stats { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 560px) {
      .wrap  { padding: 0 20px; }
      .links { grid-template-columns: 1fr 1fr; gap: 24px; }
      .nl-form { flex-direction: column; }
      .bottom { flex-direction: column; align-items: flex-start; }
      .stats  { grid-template-columns: repeat(2, 1fr); }
    }
  `;

  class AfroFooter extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this._lang = localStorage.getItem('afrotools_lang') || 'en';
    }
    connectedCallback() {
      this._render(); this._bind();
      document.addEventListener('afrotools:langchange', e => {
        this._lang = e.detail.lang; this._render(); this._bind();
      });
    }
    get fr() { return this._lang === 'fr'; }
    _t(item) { return this.fr && item.fr ? item.fr : item.en; }

    _col(titleEn, titleFr, items) {
      const t     = this.fr && titleFr ? titleFr : titleEn;
      const links = items.map(i => `<a href="${i.href}" class="col-link">${this._t(i)}</a>`).join('');
      return `<div><div class="col-title">${t}</div>${links}</div>`;
    }

    _render() {
      const fr = this.fr;
      const nlEyebrow = fr ? 'Restez informé'           : 'Stay Updated';
      const nlTitle   = fr ? 'Nouveaux outils. Gratuit.' : 'New tools. Every week. Free.';
      const ph        = fr ? 'votre@email.com'           : 'your@email.com';
      const btnLbl    = fr ? 'M\'inscrire →'             : 'Notify Me →';
      const note      = fr ? 'Pas de spam. Désinscription facile.' : 'No spam. Unsubscribe anytime.';
      const tagline   = fr
        ? 'Calculateurs financiers pour les 54 nations africaines. Gratuit à jamais.'
        : 'Country-accurate financial calculators for all 54 African nations. Free forever.';
      const disc = fr
        ? 'AfroTools est à titre informatif uniquement. Vérifiez auprès d\'un professionnel qualifié avant toute décision financière.'
        : 'AfroTools calculators are for informational purposes only and do not constitute financial, tax, or legal advice. Always verify results with a qualified professional or the relevant tax authority.';

      this.shadowRoot.innerHTML = `
        <style>@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800&family=Barlow:wght@300;400&display=swap');${CSS}</style>
        <footer role="contentinfo">
          <div class="wrap">

            <div class="top">
              <div>
                <a href="/" class="logo-row" aria-label="AfroTools home">
                  ${MARK}
                  <div class="logo-text">
                    <span class="logo-name">AFRO<b>TOOLS</b></span>
                    <span class="logo-tagline">Africa's Financial Platform</span>
                  </div>
                </a>
                <p class="tagline">${tagline}</p>
              </div>
              <div>
                <div class="nl-eyebrow">${nlEyebrow}</div>
                <div class="nl-title">${nlTitle}</div>
                <form class="nl-form" name="newsletter" data-netlify="true">
                  <input class="nl-input" type="email" name="email" placeholder="${ph}" required aria-label="Email address">
                  <button class="nl-btn" type="submit">${btnLbl}</button>
                </form>
                <p class="nl-note">${note}</p>
              </div>
            </div>

            <div class="links">
              ${this._col('Tools', 'Outils', LINKS.tools)}
              ${this._col('Countries', 'Pays', LINKS.countries)}
              ${this._col('Company', 'Entreprise', LINKS.company)}
            </div>

            <div class="stats">
              <div><div class="stat-n">1,600+</div><div class="stat-l">${fr ? 'Outils planifiés' : 'Tools planned'}</div></div>
              <div><div class="stat-n">54</div><div class="stat-l">${fr ? 'Pays africains' : 'African countries'}</div></div>
              <div><div class="stat-n">6</div><div class="stat-l">${fr ? 'Catégories' : 'Tool categories'}</div></div>
              <div><div class="stat-n">Free</div><div class="stat-l">${fr ? 'Toujours gratuit' : 'Always, for everyone'}</div></div>
            </div>

            <div class="bottom">
              <p class="copy">© ${YEAR} AfroTools.com</p>
              <div class="legal">
                <a href="/privacy-policy">${fr ? 'Confidentialité' : 'Privacy'}</a>
                <a href="/terms-of-use">${fr ? 'Conditions' : 'Terms'}</a>
                <a href="/sitemap.xml">Sitemap</a>
                <a href="/contact">Contact</a>
              </div>
              <p class="disc">${disc}</p>
            </div>

          </div>
        </footer>`;
    }

    _bind() {
      this.shadowRoot.querySelector('form')?.addEventListener('submit', e => {
        e.preventDefault();
        const btn = e.target.querySelector('button');
        const inp = e.target.querySelector('input');
        if (inp.value && inp.checkValidity()) {
          btn.textContent = '✓';
          inp.value = '';
          setTimeout(() => { btn.textContent = this.fr ? 'M\'inscrire →' : 'Notify Me →'; }, 3000);
        }
      });
    }
  }

  if (!customElements.get('afro-footer')) customElements.define('afro-footer', AfroFooter);
})();
