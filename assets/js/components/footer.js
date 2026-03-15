/**
 * AFROTOOLS FOOTER — Web Component
 * Colours: dark forest #0d1f16 (warmer than #080f0a, harmonises with sage navbar)
 * Links: readable opacity — no more 0.18/0.25 ghost text
 * Font: DM Sans throughout (Barlow removed)
 */
(function () {
  'use strict';

  const YEAR = new Date().getFullYear();

  const LINKS = {
    tools: [
      { en: 'Salary & Tax',        fr: 'Salaire & Impôts',   href: '/salary-tax/' },
      { en: 'PDF Workspace',       fr: 'Espace PDF',          href: '/tools/pdf-workspace/' },
      { en: 'Currency Converter',  fr: 'Convertisseur',       href: '/tools/currency-converter/' },
      { en: 'CV Builder',          fr: 'Créer un CV',         href: '/tools/cv-builder/' },
      { en: 'Invoice Generator',   fr: 'Facture',             href: '/tools/invoice-generator/' },
      { en: 'VAT Calculator',      fr: 'Calculateur TVA',     href: '/tools/vat-calculator/' },
    ],
    countries: [
      { en: '🇳🇬 Nigeria',      href: '/nigeria/' },
      { en: '🇰🇪 Kenya',        href: '/kenya/' },
      { en: '🇬🇭 Ghana',        href: '/ghana/' },
      { en: '🇿🇦 South Africa', href: '/south-africa/' },
      { en: '🇪🇬 Egypt',        href: '/egypt/' },
      { en: '🇹🇿 Tanzania',     href: '/tanzania/' },
    ],
    company: [
      { en: 'About',       fr: '\u00C0 propos',   href: '/about/' },
      { en: 'Contact',     fr: 'Contact',    href: '/contact/' },
      { en: 'Changelog',   fr: 'Mises \u00e0 jour', href: '/changelog/' },
      { en: 'All Tools',   fr: 'Tous les outils', href: '/all-tools/' },
    ],
    legal: [
      { en: 'Privacy Policy', fr: 'Confidentialit\u00e9', href: '/privacy-policy' },
      { en: 'Terms of Use',   fr: 'Conditions',           href: '/terms-of-use' },
      { en: 'Sitemap',        fr: 'Plan du site',         href: '/sitemap.xml' },
    ],
  };

  const MARK = `
    <svg viewBox="0 0 68 68" fill="none" xmlns="http://www.w3.org/2000/svg" style="height:34px;width:34px;flex-shrink:0">
      <polygon points="34,20 48,34 34,48 20,34" fill="#5ddb9e"/>
      <polygon points="34,2  44,14 34,20 24,14" fill="#F5A623"/>
      <polygon points="34,48 44,60 34,68 24,60" fill="#0047AB"/>
      <polygon points="2,24  14,34 2,44  -10,34" fill="#5ddb9e" opacity="0.6"/>
      <polygon points="52,24 64,34 52,44 40,34"  fill="#5ddb9e" opacity="0.48"/>
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
       SHELL
       #0d1f16 — dark forest green, warm not cold.
       Reads as intentional, not just "dark mode".
       Harmonises with the sage #f0f5f2 navbar.
    ───────────────────────────────────────────── */
    footer {
      background: #111827;
      border-top: 2px solid #1f2937;
      color: #d1d5db;
    }
    .wrap { max-width: 1200px; margin: 0 auto; padding: 0 32px; }

    /* ─────────────────────────────────────────────
       TOP — logo + newsletter
    ───────────────────────────────────────────── */
    .top {
      display: grid; grid-template-columns: 1fr 1fr;
      gap: 56px; padding: 56px 0 48px;
      border-bottom: 1px solid #1f2937;
      align-items: start;
    }

    .logo-row {
      display: flex; align-items: center; gap: 10px;
      text-decoration: none; margin-bottom: 14px;
    }
    .logo-name {
      font-size: 1.1rem; font-weight: 800;
      letter-spacing: 0.02em; color: #ffffff;
    }
    .logo-name b { color: #5ddb9e; }
    .logo-tagline {
      font-size: 0.46rem; font-weight: 600;
      letter-spacing: 0.2em; text-transform: uppercase;
      color: #6b7280; display: block; margin-top: 3px;
    }

    /* Tagline under logo — readable, not ghost */
    .tagline {
      font-size: 0.85rem; font-weight: 400;
      color: #9ca3af;
      line-height: 1.7; max-width: 300px;
    }

    /* Newsletter */
    .nl-eyebrow {
      font-size: 0.6rem; font-weight: 700;
      letter-spacing: 0.18em; text-transform: uppercase;
      color: #5ddb9e; margin-bottom: 6px;
    }
    .nl-title {
      font-size: 1.25rem; font-weight: 800;
      color: #f9fafb; line-height: 1.25; margin-bottom: 18px;
      letter-spacing: -0.02em;
    }
    .nl-form { display: flex; gap: 8px; max-width: 400px; }
    .nl-input {
      flex: 1; min-width: 0;
      padding: 11px 14px;
      background: rgba(255,255,255,0.05);
      border: 1px solid #374151;
      border-radius: 6px;
      font-family: 'DM Sans', sans-serif;
      font-size: 0.875rem; color: #f3f4f6; outline: none;
      transition: border-color 0.18s;
    }
    .nl-input::placeholder { color: #6b7280; }
    .nl-input:focus { border-color: #5ddb9e; background: rgba(255,255,255,0.09); }
    .nl-btn {
      padding: 11px 18px; flex-shrink: 0;
      background: #5ddb9e; color: white; border: none;
      border-radius: 6px;
      font-family: 'DM Sans', sans-serif;
      font-size: 0.82rem; font-weight: 700;
      cursor: pointer; transition: background 0.15s; white-space: nowrap;
    }
    .nl-btn:hover { background: #005BBF; }
    .nl-note {
      margin-top: 10px; font-size: 0.72rem;
      font-weight: 500; color: #6b7280;
    }

    /* ─────────────────────────────────────────────
       LINKS GRID
       Col titles: visible sage. Links: #a8c8b8 —
       comfortably readable, not straining to see.
    ───────────────────────────────────────────── */
    .links {
      display: grid; grid-template-columns: repeat(4, 1fr);
      gap: 32px; padding: 44px 0;
      border-bottom: 1px solid #1f2937;
    }
    .col-title {
      font-size: 0.6rem; font-weight: 700;
      letter-spacing: 0.16em; text-transform: uppercase;
      color: #5ddb9e; margin-bottom: 14px;
    }
    .col-link {
      display: block; padding: 4px 0;
      font-size: 0.84rem; font-weight: 500;
      color: #9ca3af;
      text-decoration: none;
      transition: color 0.13s; line-height: 1.5;
    }
    .col-link:hover { color: #ffffff; }

    /* ─────────────────────────────────────────────
       STATS — numbers that pop
    ───────────────────────────────────────────── */
    .stats {
      display: grid; grid-template-columns: repeat(4, 1fr);
      gap: 16px; padding: 32px 0;
      border-bottom: 1px solid #1f2937;
      text-align: center;
    }
    .stat-n {
      font-size: 1.8rem; font-weight: 800;
      color: #5ddb9e; line-height: 1;
      letter-spacing: -0.02em;
    }
    .stat-l {
      font-size: 0.72rem; font-weight: 500;
      color: #6b7280; margin-top: 5px;
    }

    /* ─────────────────────────────────────────────
       BOTTOM BAR
    ───────────────────────────────────────────── */
    .bottom {
      display: flex; align-items: center;
      justify-content: space-between;
      padding: 20px 0; flex-wrap: wrap; gap: 12px;
    }
    .copy {
      font-size: 0.75rem; font-weight: 500;
      color: #6b7280;
    }
    .legal { display: flex; gap: 20px; flex-wrap: wrap; }
    .legal a {
      font-size: 0.75rem; font-weight: 500;
      color: #6b7280; text-decoration: none;
      transition: color 0.13s;
    }
    .legal a:hover { color: #9ca3af; }

    /* Disclaimer — readable, not invisible */
    .disc {
      width: 100%; padding-top: 14px;
      border-top: 1px solid #1f2937;
      font-size: 0.7rem; font-weight: 400;
      color: #6b7280; line-height: 1.7;
    }

    /* ─────────────────────────────────────────────
       RESPONSIVE
    ───────────────────────────────────────────── */
    /* Social links */
    .social { display: flex; gap: 12px; margin-top: 16px; }
    .social a {
      width: 36px; height: 36px; border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      background: rgba(255,255,255,0.06); border: 1px solid #374151;
      color: #9ca3af; text-decoration: none; font-size: 1rem;
      transition: all 0.15s;
    }
    .social a:hover { background: #5ddb9e; color: #fff; border-color: #5ddb9e; }

    .built-with {
      font-size: 0.78rem; font-weight: 500; color: #6b7280;
      margin-top: 18px;
    }

    @media (max-width: 900px) {
      .top   { grid-template-columns: 1fr; gap: 36px; padding: 40px 0 36px; }
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
      this._lang = 'en';
      try { this._lang = localStorage.getItem('afrotools_lang') || 'en'; } catch(e) {}
    }

    connectedCallback() {
      this._render(); this._bind();
      document.addEventListener('afrotools:langchange', e => {
        this._lang = e.detail.lang; this._render(); this._bind();
      });
    }

    get fr() { return this._lang === 'fr'; }
    _t(item)  { return this.fr && item.fr ? item.fr : item.en; }

    _col(titleEn, titleFr, items) {
      const t     = this.fr && titleFr ? titleFr : titleEn;
      const links = items.map(i => `<a href="${i.href}" class="col-link">${this._t(i)}</a>`).join('');
      return `<div><div class="col-title">${t}</div>${links}</div>`;
    }

    _render() {
      const fr = this.fr;
      const nlEyebrow = fr ? 'Restez informé'            : 'Stay Updated';
      const nlTitle   = fr ? 'Nouveaux outils. Gratuit.' : 'New tools. Every week. Free.';
      const ph        = fr ? 'votre@email.com'            : 'your@email.com';
      const btnLbl    = fr ? "M'inscrire →"               : 'Notify Me →';
      const note      = fr ? 'Pas de spam. Désinscription facile.' : 'No spam. Unsubscribe anytime.';
      const tagline   = fr
        ? 'Calculateurs, outils PDF, CV, devises — pour les 54 nations africaines. Gratuit à jamais.'
        : 'Tax calculators, PDF tools, CV builder, currency tools and more — built for all 54 African nations. Free forever.';
      const disc = fr
        ? "AfroTools est à titre informatif uniquement. Vérifiez auprès d'un professionnel qualifié avant toute décision financière."
        : 'AfroTools tools are for informational purposes only and do not constitute financial, tax, or legal advice. Always verify with a qualified professional or your country\'s revenue authority before making financial decisions.';

      this.shadowRoot.innerHTML = `
        <style>${CSS}</style>
        <footer role="contentinfo">
          <div class="wrap">

            <div class="top">
              <div>
                <a href="/" class="logo-row" aria-label="AfroTools home">
                  ${MARK}
                  <div>
                    <span class="logo-name">AFRO<b>TOOLS</b></span>
                    <span class="logo-tagline">Africa's Everything Platform</span>
                  </div>
                </a>
                <p class="tagline">${tagline}</p>
                <div class="social">
                  <a href="https://twitter.com/afrotools" target="_blank" rel="noopener" aria-label="Twitter / X">&#120143;</a>
                  <a href="https://linkedin.com/company/afrotools" target="_blank" rel="noopener" aria-label="LinkedIn">in</a>
                  <a href="https://github.com/Ozaveshe/afrotools" target="_blank" rel="noopener" aria-label="GitHub">GH</a>
                </div>
                <p class="built-with">Built with &#9829; for Africa</p>
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
              ${this._col('Legal', 'L\u00e9gal', LINKS.legal)}
            </div>

            <div class="stats">
              <div><div class="stat-n">54</div><div class="stat-l">${fr ? 'Pays africains' : 'African countries'}</div></div>
              <div><div class="stat-n">12</div><div class="stat-l">${fr ? 'Catégories' : 'Tool categories'}</div></div>
              <div><div class="stat-n">8</div><div class="stat-l">${fr ? 'Calculateurs PAYE' : 'PAYE calculators'}</div></div>
              <div><div class="stat-n">Free</div><div class="stat-l">${fr ? 'Toujours gratuit' : 'Always, forever'}</div></div>
            </div>

            <div class="bottom">
              <p class="copy">© ${YEAR} AfroTools.com</p>
              <div class="legal">
                <a href="/privacy-policy">${fr ? 'Confidentialité' : 'Privacy'}</a>
                <a href="/terms-of-use">${fr ? 'Conditions' : 'Terms'}</a>
                <a href="/sitemap.xml">Sitemap</a>
                <a href="/contact/">Contact</a>
              </div>
              <p class="disc">${disc}</p>
            </div>

          </div>
        </footer>`;
    }

    _bind() {
      this.shadowRoot.querySelector('form')?.addEventListener('submit', async e => {
        e.preventDefault();
        const btn = e.target.querySelector('button');
        const inp = e.target.querySelector('input');
        if (inp.value && inp.checkValidity()) {
          btn.disabled = true;
          btn.textContent = '…';
          try {
            // Submit to Netlify Forms via POST (Shadow DOM forms are invisible to Netlify's build-time parser)
            const formData = new URLSearchParams();
            formData.append('form-name', 'newsletter');
            formData.append('email', inp.value);
            await fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: formData.toString() });
            btn.textContent = '✓ Done';
            inp.value = '';
          } catch {
            btn.textContent = '✓ Done';
            inp.value = '';
          }
          btn.disabled = false;
          setTimeout(() => { btn.textContent = this.fr ? "M'inscrire →" : 'Notify Me →'; }, 3000);
        }
      });
    }
  }

  if (!customElements.get('afro-footer')) customElements.define('afro-footer', AfroFooter);

  /* ── Auto-load site-wide AI advisor ── */
  (function loadSiteAssistant() {
    if (document.querySelector('script[src*="site-assistant"]')) return;
    const s = document.createElement('script');
    s.src   = '/assets/js/components/site-assistant.min.js';
    s.defer = true;
    document.head.appendChild(s);
  })();

})();
