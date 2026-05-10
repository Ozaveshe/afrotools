/**
 * AFROTOOLS FOOTER — Web Component
 * Colours: dark navy #111827, accent Apple Blue via --color-primary (#007AFF)
 * Links: readable opacity — no more 0.18/0.25 ghost text
 * Font: DM Sans throughout (Barlow removed)
 */
(function () {
  'use strict';

  const YEAR = new Date().getFullYear();

  /* i18n: all 5 languages */
  const L = {
    tools:      { en: 'Tools', fr: 'Outils', sw: 'Zana', yo: 'Àwọn Iṣẹ́', ha: 'Kayan Aiki' },
    countries:  { en: 'Countries', fr: 'Pays', sw: 'Nchi', yo: 'Orílẹ̀-èdè', ha: 'Ƙasashe' },
    company:    { en: 'Company', fr: 'Entreprise', sw: 'Kampuni', yo: 'Ilé-iṣẹ́', ha: 'Kamfani' },
    legal:      { en: 'Legal', fr: 'Légal', sw: 'Sheria', yo: 'Òfin', ha: 'Doka' },
    logoTagline:{ en: "Africa's Everything Platform", ha: 'Dandalin kayan aikin Afirka' },
    nlEyebrow:  { en: 'Stay Updated', fr: 'Restez informé', sw: 'Pata Habari', yo: 'Ṣe Àjọjú', ha: 'Sabbin kayan aiki' },
    nlTitle:    { en: 'New tools. Every week. Free.', fr: 'Nouveaux outils. Gratuit.', sw: 'Zana mpya. Kila wiki. Bure.', yo: 'Iṣẹ́ tuntun. Ọ̀fẹ́.', ha: 'Sabbin kayan aiki da bayanai, kyauta.' },
    placeholder:{ en: 'your@email.com', fr: 'votre@email.com', sw: 'barua@pepe.com', yo: 'imeeli@rẹ.com', ha: 'adireshin imel dinka' },
    btnLabel:   { en: 'Notify Me →', fr: "M'inscrire →", sw: 'Nijulishe →', yo: 'Fara mọ́ →', ha: 'Sanar da ni →' },
    note:       { en: 'No spam. Unsubscribe anytime.', fr: 'Pas de spam. Désinscription facile.', sw: 'Hakuna taka. Jiondoe wakati wowote.', yo: 'Kò sí àdàlù. Yọ ara rẹ nígbàkígbà.', ha: 'Babu spam. Kana iya fita a kowane lokaci.' },
    tagline:    { en: 'Tax calculators, PDF tools, CV builder, currency tools and more — built for all 54 African nations. Free forever.',
                  fr: 'Calculateurs, outils PDF, CV, devises — pour les 54 nations africaines. Gratuit à jamais.',
                  sw: 'Vikokotoo vya kodi, zana za PDF, sarafu na zaidi — kwa mataifa yote 54 ya Afrika. Bure milele.',
                  yo: 'Àṣeàṣe owó-orí, iṣẹ́ PDF, owó — fún gbogbo orílẹ̀-èdè 54 Áfíríkà. Ọ̀fẹ́.',
                  ha: 'PAYE, VAT, PDF, CV, Naira da kayan kasuwanci domin Najeriya da kasashen Afirka 54. Kyauta.' },
    disc:       { en: 'AfroTools tools are for informational purposes only and do not constitute financial, tax, or legal advice. Always verify with a qualified professional or your country\'s revenue authority before making financial decisions.',
                  fr: "AfroTools est à titre informatif uniquement. Vérifiez auprès d'un professionnel qualifié avant toute décision financière.",
                  sw: 'Zana za AfroTools ni kwa madhumuni ya taarifa pekee. Hakikisha na mtaalamu aliyeidhinishwa kabla ya maamuzi ya kifedha.',
                  yo: 'Àwọn iṣẹ́ AfroTools jẹ́ fún ìfitónilétí nìkan. Ṣe ìjẹ́rìísí pẹ̀lú ọ̀jọ̀gbọ́n kí o tó ṣe ìpinnu owó.',
                  ha: 'Kayan aikin AfroTools na bayar da bayani ne kawai. Ba shawarar kudi, haraji ko doka ba ne. Ka tabbatar da sakamako wajen kwararre ko hukumar haraji kafin ka yanke hukunci.' },
    affDisc:    { en: 'Some tools include affiliate links to trusted partners. AfroTools may earn a commission at no extra cost to you.',
                  fr: "Certains outils contiennent des liens d'affiliation vers des partenaires de confiance. AfroTools peut percevoir une commission sans frais supplémentaires pour vous.",
                  sw: 'Baadhi ya zana zina viungo vya washirika kwa washirika wanaoaminiwa. AfroTools inaweza kupata tume bila gharama zaidi kwako.',
                  yo: 'Àwọn iṣẹ́ kan ní àwọn ọ̀nà ìsopọ̀ afilieti sí àwọn alábàáṣiṣẹ́pọ̀ tí a gbẹ́kẹ̀lé. AfroTools lè ní èrè láì ní idiyele àfikún fún ọ.',
                  ha: 'Wasu shafuka na iya dauke da affiliate links zuwa abokan hulda. AfroTools na iya samun commission ba tare da karin kudi daga gare ka ba.' },
    stats:      { countries: { en: 'African countries', fr: 'Pays africains', sw: 'Nchi za Afrika', yo: 'Orílẹ̀-èdè Áfíríkà', ha: 'Ƙasashen Afirka' },
                   categories: { en: 'Tool categories', fr: 'Catégories', sw: 'Kategoria', yo: 'Ẹ̀ka', ha: 'Rukunan kayan aiki' },
                   paye:       { en: 'PAYE countries live', fr: 'Pays PAYE en ligne', sw: 'Nchi za PAYE mubashara', yo: 'Àwọn orílẹ̀-èdè PAYE tó wà', ha: 'Kasashen PAYE da ke aiki' },
                   free:       { en: 'Always, forever', fr: 'Toujours gratuit', sw: 'Bure milele', yo: 'Ọ̀fẹ́ títí', ha: 'Kyauta har abada' } },
    freeValue:  { en: 'Free', ha: 'Kyauta' },
    privacy:    { en: 'Privacy', fr: 'Confidentialité', sw: 'Faragha', yo: 'Aṣírí', ha: 'Sirri' },
    terms:      { en: 'Terms', fr: 'Conditions', sw: 'Masharti', yo: 'Òfin', ha: 'Sharudda' },
    sitemap:    { en: 'Sitemap', ha: 'Taswirar shafi' },
    contact:    { en: 'Contact', ha: 'Tuntube mu' },
    emailLabel: { en: 'Email address', ha: 'Adireshin imel' },
    subscribed: { en: '✓ Subscribed!', ha: '✓ An yi rajista!' },
    retry:      { en: '✗ Try again', ha: '✗ Sake gwadawa' },
    builtWith:  { en: 'Built with ♥ for Africa', fr: 'Fait avec ♥ pour l\'Afrique', sw: 'Imejengwa kwa ♥ kwa Afrika', yo: 'A kọ́ pẹ̀lú ♥ fún Áfíríkà', ha: 'An gina shi don Afirka' },
  };

  const LINKS = {
    tools: [
      { en: 'Salary & Tax',        fr: 'Salaire & Impôts', sw: 'Mshahara & Kodi', yo: 'Owó Oṣù & Owó-Orí', ha: 'Albashi da PAYE', href: '/salary-tax/', hrefHa: '/ha/albashi-da-haraji/' },
      { en: 'PDF Workspace',       fr: 'Espace PDF',       sw: 'Eneo la PDF',     yo: 'Ibùdó PDF',          ha: 'Takardu da PDF', href: '/tools/pdf-workspace/', hrefHa: '/ha/takardu-da-pdf/' },
      { en: 'Education',           ha: 'Ilimi',             href: '/education/', hrefHa: '/ha/ilimi/', haOnly: true },
      { en: 'Language & Translation', ha: 'Harshe da Fassara', href: '/language/', hrefHa: '/ha/harshe-da-fassara/', haOnly: true },
      { en: 'CV Builder',          fr: 'Créer un CV',      sw: 'Tengeneza CV',     yo: 'Kọ CV',             ha: 'CV Builder',      href: '/tools/cv-builder/' },
      { en: 'Invoice Generator',   fr: 'Facture',          sw: 'Ankara',           yo: 'Iṣẹ́ Ìwé-Owó',      ha: 'Invoice Generator', href: '/tools/invoice-generator/' },
      { en: 'VAT Calculator',      fr: 'Calculateur TVA',  sw: 'Kikokotoo VAT',    yo: 'Àṣeàṣe VAT',       ha: 'VAT Calculator',  href: '/tools/vat-calculator/' },
      { en: 'Currency Converter',  fr: 'Convertisseur',    sw: 'Kubadili Sarafu',  yo: 'Iyípadà Owó',       ha: 'Canjin kudi',     href: '/tools/currency-converter/' },
    ],
    countries: [
      { en: 'All countries', ha: 'Duk kasashe', href: '/countries/', hrefHa: '/ha/kasashe/', haOnly: true },
      { en: 'Nigeria',      ha: 'Najeriya',       href: '/nigeria/', hrefHa: '/ha/najeriya/' },
      { en: 'Kenya',        ha: 'Kenya',           href: '/kenya/' },
      { en: 'Ghana',        ha: 'Ghana',           href: '/ghana/' },
      { en: 'South Africa', ha: 'Afirka ta Kudu',  href: '/south-africa/' },
      { en: 'Egypt',        ha: 'Masar',           href: '/egypt/' },
      { en: 'Tanzania',     ha: 'Tanzania',        href: '/tanzania/' },
    ],
    company: [
      { en: 'About',       fr: 'À propos',        sw: 'Kuhusu',        yo: 'Nípa Wa',          ha: 'Game da Mu',    href: '/about/' },
      { en: 'Blog',        fr: 'Blog',             sw: 'Blogu',         yo: 'Blọ́ọ̀gì',          ha: 'Blog',          href: '/blog/' },
      { en: 'Contact',     fr: 'Contact',          sw: 'Wasiliana',     yo: 'Kan Sí Wa',        ha: 'Tuntube Mu',    href: '/contact/' },
      { en: 'Changelog',   fr: 'Mises à jour',     sw: 'Mabadiliko',    yo: 'Àwọn Àyípadà',    ha: 'Canje-canje',   href: '/changelog/' },
      { en: 'All Tools',   fr: 'Tous les outils',  sw: 'Zana Zote',     yo: 'Gbogbo Iṣẹ́',      ha: 'Duk kayan aiki',href: '/all-tools/', hrefHa: '/ha/kayan-aiki/' },
      { en: 'API Docs',    fr: 'API Docs',         sw: 'API Docs',      yo: 'API Docs',         ha: 'API Docs',      href: '/api/' },
      { en: 'Embed Tools', fr: 'Intégrer',         sw: 'Chomeka Zana',  yo: 'Fi Iṣẹ́ Sínú',     ha: 'Saka Kayan Aiki', href: '/widgets/demo/' },
    ],
    legal: [
      { en: 'Privacy Policy', fr: 'Confidentialité', sw: 'Sera ya Faragha', yo: 'Ìlànà Aṣírí',  ha: 'Manufar sirri', href: '/privacy/' },
      { en: 'Terms of Use',   fr: 'Conditions',      sw: 'Masharti',        yo: 'Òfin Lílò',     ha: 'Sharuddan amfani', href: '/terms/' },
      { en: 'Sitemap',        fr: 'Plan du site',    sw: 'Ramani',          yo: 'Àtòjọ Ojú-ìwé', ha: 'Taswirar shafi',href: '/sitemap.xml' },
    ],
  };

  const MARK = `
    <svg viewBox="0 0 68 68" fill="none" xmlns="http://www.w3.org/2000/svg" style="height:34px;width:34px;flex-shrink:0">
      <polygon points="34,20 48,34 34,48 20,34" fill="#007AFF"/>
      <polygon points="34,2  44,14 34,20 24,14" fill="#F5A623"/>
      <polygon points="34,48 44,60 34,68 24,60" fill="#0047AB"/>
      <polygon points="2,24  14,34 2,44  -10,34" fill="#007AFF" opacity="0.6"/>
      <polygon points="52,24 64,34 52,44 40,34"  fill="#007AFF" opacity="0.48"/>
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
       #111827 — dark navy, clean and modern.
       Accent: Apple Blue #007AFF via --color-primary.
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
    .logo-name b { color: #3B8AE5; }
    .logo-tagline {
      font-size: 0.46rem; font-weight: 600;
      letter-spacing: 0.2em; text-transform: uppercase;
      color: #8B95A3; display: block; margin-top: 3px;
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
      color: #3B8AE5; margin-bottom: 6px;
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
    .nl-input:focus { border-color: var(--color-primary); background: rgba(255,255,255,0.09); }
    .nl-btn {
      padding: 11px 18px; flex-shrink: 0;
      background: var(--color-primary); color: white; border: none;
      border-radius: 6px;
      font-family: 'DM Sans', sans-serif;
      font-size: 0.82rem; font-weight: 700;
      cursor: pointer; transition: background 0.15s; white-space: nowrap;
    }
    .nl-btn:hover { background: #005BBF; }
    .nl-note {
      margin-top: 10px; font-size: 0.72rem;
      font-weight: 500; color: #8B95A3;
    }

    /* ─────────────────────────────────────────────
       LINKS GRID
       Col titles: Apple Blue via --color-primary.
       Links: #9ca3af — comfortably readable.
    ───────────────────────────────────────────── */
    .links {
      display: grid; grid-template-columns: repeat(4, 1fr);
      gap: 32px; padding: 44px 0;
      border-bottom: 1px solid #1f2937;
    }
    .col-title {
      font-size: 0.6rem; font-weight: 700;
      letter-spacing: 0.16em; text-transform: uppercase;
      color: #3B8AE5; margin-bottom: 14px;
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
      color: var(--color-primary); line-height: 1;
      letter-spacing: -0.02em;
    }
    .stats > div:last-child .stat-n { color: #f9fafb; }
    .stat-l {
      font-size: 0.72rem; font-weight: 500;
      color: #8B95A3; margin-top: 5px;
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
      color: #8B95A3;
    }
    .legal { display: flex; gap: 20px; flex-wrap: wrap; }
    .legal a {
      font-size: 0.75rem; font-weight: 500;
      color: #8B95A3; text-decoration: none;
      transition: color 0.13s;
    }
    .legal a:hover { color: #9ca3af; }

    /* Disclaimer — readable, not invisible */
    .disc {
      width: 100%; padding-top: 14px;
      border-top: 1px solid #1f2937;
      font-size: 0.7rem; font-weight: 400;
      color: #8B95A3; line-height: 1.7;
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
    .social a:hover { background: var(--color-primary); color: #fff; border-color: var(--color-primary); }

    .built-with {
      font-size: 0.78rem; font-weight: 500; color: #8B95A3;
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
    }

    connectedCallback() {
      // Detect language from URL prefix (matches i18n-detect.js logic)
      var segs = window.location.pathname.split('/');
      var first = segs[1];
      if (['fr','sw','yo','ha'].indexOf(first) !== -1) this._lang = first;
      else this._lang = document.documentElement.lang || 'en';
      this._render(); this._bind();
      document.addEventListener('afrotools:langchange', e => {
        this._lang = e.detail.lang; this._render(); this._bind();
      });
      document.addEventListener('afrotools:registry-ready', () => {
        this._render(); this._bind();
      });
    }

    _l(obj) { return obj[this._lang] || obj.en; }
    _t(item) { return item[this._lang] || item.en; }

    _col(titleObj, items) {
      const t = this._l(titleObj);
      const visibleItems = items.filter(i => this._lang === 'ha' || !i.haOnly);
      const links = visibleItems.map(i => `<a href="${this._linkHref(i)}" class="col-link">${this._t(i)}</a>`).join('');
      return `<div><div class="col-title">${t}</div>${links}</div>`;
    }

    _prefixHref(href) {
      if (this._lang === 'en' || href.startsWith('http') || href.startsWith('/sitemap')) return href;
      return '/' + this._lang + href;
    }

    _linkHref(item) {
      var href = item && item.href ? item.href : '#';
      if (this._lang === 'ha') return item.hrefHa || href;
      return this._prefixHref(href);
    }

    _footerHref(href, haHref) {
      if (this._lang === 'ha') return haHref || href;
      return this._prefixHref(href);
    }

    _getRegistryStats() {
      var categories = 31;
      var payeCountries = 54;
      var tools = Array.isArray(window.AFRO_TOOLS) ? window.AFRO_TOOLS : [];
      var registryCategories = window.AFRO_CATEGORIES && typeof window.AFRO_CATEGORIES === 'object'
        ? window.AFRO_CATEGORIES
        : null;

      if (registryCategories) {
        categories = Object.keys(registryCategories).length || categories;
      }

      if (tools.length) {
        var payeSet = new Set();
        tools.forEach(function(tool) {
          var countries = Array.isArray(tool.countries) ? tool.countries : [];
          var text = ((tool.name || '') + ' ' + (tool.href || '')).toLowerCase();
          var isLive = tool.status === 'live' || tool.status === 'new';
          var isCountrySpecific = countries.length === 1 && countries[0] !== 'ALL';
          var looksLikePaye = text.indexOf('paye') !== -1 || text.indexOf('salary-tax') !== -1 || text.indexOf('income tax') !== -1;
          if (isLive && isCountrySpecific && looksLikePaye) {
            payeSet.add(countries[0]);
          }
        });
        if (payeSet.size) payeCountries = payeSet.size;
      }

      return {
        countries: 54,
        categories: categories,
        payeCountries: payeCountries,
      };
    }

    _render() {
      const nlEyebrow = this._l(L.nlEyebrow);
      const nlTitle   = this._l(L.nlTitle);
      const ph        = this._l(L.placeholder);
      const btnLbl    = this._l(L.btnLabel);
      const note      = this._l(L.note);
      const tagline   = this._l(L.tagline);
      const disc      = this._l(L.disc);
      const affDisc   = this._l(L.affDisc);
      const emailLabel = this._l(L.emailLabel);
      const freeValue = this._l(L.freeValue);
      const stats     = this._getRegistryStats();

      this.shadowRoot.innerHTML = `
        <style>${CSS}</style>
        <footer role="contentinfo">
          <div class="wrap">

            <div class="top">
              <div>
                <a href="${this._footerHref('/', '/ha/')}" class="logo-row" aria-label="AfroTools home">
                  ${MARK}
                  <div>
                    <span class="logo-name">AFRO<b>TOOLS</b></span>
                    <span class="logo-tagline">${this._l(L.logoTagline)}</span>
                  </div>
                </a>
                <p class="tagline">${tagline}</p>
                <div class="social">
                  <a href="https://x.com/afrotoolsHQ" target="_blank" rel="noopener noreferrer" aria-label="X (Twitter)">&#120143;</a>
                  <a href="https://www.linkedin.com/company/afrotools/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">in</a>
                  <a href="https://www.facebook.com/afrotoolsHQ" target="_blank" rel="noopener noreferrer" aria-label="Facebook">f</a>
                </div>
                <p class="built-with">${this._l(L.builtWith)}</p>
              </div>
              <div>
                <div class="nl-eyebrow">${nlEyebrow}</div>
                <div class="nl-title">${nlTitle}</div>
                <form class="nl-form" name="newsletter" data-netlify="true" netlify-honeypot="bot-field" action="/thank-you/">
                  <input type="hidden" name="form-name" value="newsletter">
                  <p style="display:none"><input name="bot-field"></p>
                  <input type="hidden" name="source" value="footer">
                  <input class="nl-input" type="email" name="email" placeholder="${ph}" required aria-label="${emailLabel}">
                  <button class="nl-btn" type="submit">${btnLbl}</button>
                </form>
                <p class="nl-note">${note}</p>
              </div>
            </div>

            <div class="links">
              ${this._col(L.tools, LINKS.tools)}
              ${this._col(L.countries, LINKS.countries)}
              ${this._col(L.company, LINKS.company)}
              ${this._col(L.legal, LINKS.legal)}
            </div>

            <div class="stats">
              <div><div class="stat-n">${stats.countries}</div><div class="stat-l">${this._l(L.stats.countries)}</div></div>
              <div><div class="stat-n">${stats.categories}</div><div class="stat-l">${this._l(L.stats.categories)}</div></div>
              <div><div class="stat-n">${stats.payeCountries}</div><div class="stat-l">${this._l(L.stats.paye)}</div></div>
              <div><div class="stat-n">${freeValue}</div><div class="stat-l">${this._l(L.stats.free)}</div></div>
            </div>

            <div class="bottom">
              <p class="copy">© ${YEAR} AfroTools.com</p>
              <div class="legal">
                <a href="${this._footerHref('/privacy/')}">${this._l(L.privacy)}</a>
                <a href="${this._footerHref('/terms/')}">${this._l(L.terms)}</a>
                <a href="/sitemap.xml">${this._l(L.sitemap)}</a>
                <a href="${this._footerHref('/contact/')}">${this._l(L.contact)}</a>
              </div>
              <p class="disc">${disc}</p>
              <p class="disc">${affDisc}</p>
            </div>

          </div>
        </footer>`;
    }

    _bind() {
      this.shadowRoot.querySelector('form')?.addEventListener('submit', async e => {
        e.preventDefault();
        const btn = e.target.querySelector('button');
        const inp = e.target.querySelector('input[type="email"]');
        if (!inp || !inp.value || !inp.checkValidity()) return;
        btn.disabled = true;
        btn.textContent = '…';
        try {
          // Submit to Netlify Forms via POST (Shadow DOM forms are invisible to Netlify's build-time parser)
          const body = new URLSearchParams({
            'form-name': 'newsletter',
            'email': inp.value,
            'source': 'footer'
          }).toString();
          const res = await fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
          if (res.ok) {
            btn.textContent = this._l(L.subscribed);
            inp.value = '';
          } else {
            btn.textContent = this._l(L.retry);
          }
        } catch {
          btn.textContent = this._l(L.retry);
        }
        btn.disabled = false;
        setTimeout(() => { btn.textContent = this._l(L.btnLabel); }, 3000);
      });
    }
  }

  if (!customElements.get('afro-footer')) customElements.define('afro-footer', AfroFooter);

  /* ── Auto-load site-wide AI advisor (deferred until idle) ── */
  /* Uses chat bundle if available (from manifest), falls back to individual file */
  var _idle = window.requestIdleCallback || function(cb) { setTimeout(cb, 2000); };
  _idle(function() {
    if (document.querySelector('script[src*="site-assistant"]') || document.querySelector('script[src*="chat."]')) return;
    const s = document.createElement('script');
    // Try chat bundle first, fall back to individual file
    var bundlePath = document.documentElement.getAttribute('data-chat-bundle');
    s.src = bundlePath || '/assets/js/components/site-assistant.min.js';
    s.defer = true;
    document.head.appendChild(s);
  });

})();
