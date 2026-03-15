/**
 * AFROTOOLS — Country Tools Web Component
 * ===================================================================
 * Displays tool cards filtered by country from the AFRO_TOOLS registry.
 * Used on country hub pages to show all available tools for a country.
 *
 * Usage:
 *   <afro-country-tools country="NG"></afro-country-tools>
 *   <afro-country-tools country="KE" show-pan="true"></afro-country-tools>
 *   <afro-country-tools country="GH" category="financial" max="6"></afro-country-tools>
 *
 * Attributes:
 *   country  - ISO 3166-1 alpha-2 country code (required)
 *   category - Filter by category (optional)
 *   max      - Maximum number of tools to display (optional)
 *   show-pan - Show pan-African tools alongside country tools (default: 'true')
 *   title    - Section title (default: auto-generated from country name)
 *   cols     - Grid columns: '2', '3', or '4' (default: '3')
 *   status   - Filter by status: 'live', 'all' (default: 'live')
 * ===================================================================
 */

(function () {
  'use strict';

  // Country code → display name
  const COUNTRY_NAMES = {
    NG: 'Nigeria', KE: 'Kenya', GH: 'Ghana', ZA: 'South Africa',
    EG: 'Egypt', TZ: 'Tanzania', UG: 'Uganda', RW: 'Rwanda',
    ET: 'Ethiopia', SN: 'Senegal', CI: "Côte d'Ivoire", CM: 'Cameroon',
    MA: 'Morocco', DZ: 'Algeria', TN: 'Tunisia', LY: 'Libya',
    SD: 'Sudan', AO: 'Angola', MZ: 'Mozambique', ZM: 'Zambia',
    ZW: 'Zimbabwe', BW: 'Botswana', NA: 'Namibia', SZ: 'Eswatini',
    LS: 'Lesotho', MW: 'Malawi', MG: 'Madagascar', MU: 'Mauritius',
    SC: 'Seychelles', BI: 'Burundi', CD: 'DR Congo', CG: 'Republic of Congo',
    GA: 'Gabon', GQ: 'Equatorial Guinea', CF: 'Central African Republic',
    TD: 'Chad', NE: 'Niger', ML: 'Mali', BF: 'Burkina Faso',
    GN: 'Guinea', GW: 'Guinea-Bissau', SL: 'Sierra Leone', LR: 'Liberia',
    MR: 'Mauritania', GM: 'Gambia', CV: 'Cape Verde', ST: 'São Tomé & Príncipe',
    TG: 'Togo', BJ: 'Benin', SO: 'Somalia', DJ: 'Djibouti',
    ER: 'Eritrea', SS: 'South Sudan', KM: 'Comoros',
  };

  const CATEGORY_LABELS = {
    financial: 'Financial & Tax',
    'document-pdf': 'Document & PDF',
    'image-design': 'Image & Design',
    developer: 'Developer Tools',
    education: 'Education',
    health: 'Health',
    african: 'Uniquely African',
    business: 'Business',
    language: 'Language & Translation',
    legal: 'Legal & Government',
    engineering: 'Engineering',
    agriculture: 'Agriculture',
    'data-productivity': 'Data & Productivity',
  };

  const CSS = `
    :host { display: block; }

    .ct-wrap {
      padding: 48px 0;
    }

    .ct-header {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      margin-bottom: 28px;
      flex-wrap: wrap;
      gap: 12px;
    }

    .ct-eyebrow {
      display: block; font-size: 0.68rem; font-weight: 700;
      letter-spacing: 0.1em; text-transform: uppercase;
      color: var(--color-primary, #5ddb9e);
      margin-bottom: 6px;
    }

    .ct-title {
      font-size: clamp(1.3rem, 2.5vw, 1.7rem);
      font-weight: 800; color: var(--color-text, #1a2e22);
      letter-spacing: -0.02em; margin: 0;
    }

    .ct-count {
      font-size: 0.78rem; color: var(--color-text-muted, #3d6349);
      font-weight: 500;
    }

    /* Filter pills */
    .ct-filters {
      display: flex; gap: 8px; flex-wrap: wrap;
      margin-bottom: 20px;
    }
    .ct-pill {
      padding: 6px 14px; border-radius: 20px;
      font-size: 0.75rem; font-weight: 600;
      border: 1px solid var(--color-border, #e2e8e4);
      background: none; color: var(--color-text, #1a2e22);
      cursor: pointer; font-family: inherit;
      transition: all 0.15s;
    }
    .ct-pill:hover {
      border-color: var(--color-primary, #5ddb9e);
      background: rgba(93, 219, 158, 0.06);
    }
    .ct-pill.active {
      background: var(--color-primary, #5ddb9e);
      border-color: var(--color-primary, #5ddb9e);
      color: #0c1a10;
    }

    /* Tool grid */
    .ct-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }
    :host([cols="2"]) .ct-grid { grid-template-columns: repeat(2, 1fr); }
    :host([cols="4"]) .ct-grid { grid-template-columns: repeat(4, 1fr); }

    /* Tool card */
    .ct-card {
      border: 1px solid var(--color-border, #e2e8e4);
      border-radius: 12px;
      padding: 20px;
      text-decoration: none;
      display: flex; flex-direction: column;
      transition: border-color 0.15s, box-shadow 0.15s, transform 0.15s;
      position: relative;
      overflow: hidden;
    }
    .ct-card:hover {
      border-color: var(--color-primary, #5ddb9e);
      box-shadow: 0 4px 20px rgba(93, 219, 158, 0.08);
      transform: translateY(-2px);
    }
    .ct-card:focus-visible {
      outline: 2px solid var(--color-primary, #5ddb9e);
      outline-offset: -2px;
    }

    .ct-card-icon {
      font-size: 1.5rem;
      margin-bottom: 10px;
    }

    .ct-card-name {
      font-size: 0.88rem; font-weight: 700;
      color: var(--color-text, #1a2e22);
      margin-bottom: 6px;
      line-height: 1.3;
    }

    .ct-card-desc {
      font-size: 0.78rem;
      color: var(--color-text-muted, #3d6349);
      line-height: 1.6;
      flex: 1;
    }

    .ct-card-meta {
      display: flex; align-items: center; gap: 8px;
      margin-top: 12px; padding-top: 12px;
      border-top: 1px solid var(--color-border, #e2e8e4);
    }

    .ct-badge {
      font-size: 0.65rem; font-weight: 700;
      padding: 2px 8px; border-radius: 10px;
      text-transform: uppercase; letter-spacing: 0.04em;
    }
    .ct-badge.live {
      background: rgba(93, 219, 158, 0.12);
      color: #2a8a5a;
    }
    .ct-badge.new {
      background: rgba(93, 150, 219, 0.12);
      color: #2a5a8a;
    }
    .ct-badge.coming {
      background: rgba(180, 180, 180, 0.12);
      color: #6a7a6a;
    }
    .ct-badge.pan {
      background: rgba(219, 180, 93, 0.10);
      color: #8a6a2a;
    }

    .ct-card-arrow {
      margin-left: auto;
      color: var(--color-primary, #5ddb9e);
      opacity: 0; transition: opacity 0.15s, transform 0.15s;
    }
    .ct-card:hover .ct-card-arrow {
      opacity: 1; transform: translateX(2px);
    }

    /* Empty state */
    .ct-empty {
      text-align: center; padding: 48px 20px;
      color: var(--color-text-muted, #3d6349);
      font-size: 0.88rem;
    }

    /* Responsive */
    @media (max-width: 900px) {
      .ct-grid { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 560px) {
      .ct-grid { grid-template-columns: 1fr; }
      .ct-card { padding: 16px; }
    }

    /* Dark mode */
    @media (prefers-color-scheme: dark) {
      .ct-title { color: #e2f0e8; }
      .ct-card { border-color: #2a3a30; background: #111a14; }
      .ct-card:hover { border-color: #5ddb9e; box-shadow: 0 4px 20px rgba(93, 219, 158, 0.06); }
      .ct-card-name { color: #e2f0e8; }
      .ct-card-desc { color: #9cb8a8; }
      .ct-card-meta { border-color: #2a3a30; }
      .ct-pill { color: #c8dccf; border-color: #2a3a30; }
      .ct-pill:hover { background: rgba(93, 219, 158, 0.08); }
      .ct-pill.active { color: #0c1a10; }
    }
  `;

  const ARROW_SVG = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3l5 5-5 5"/></svg>`;

  class AfroCountryTools extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this._activeCategory = null;
    }

    connectedCallback() {
      this._render();
    }

    static get observedAttributes() { return ['country', 'category', 'max', 'show-pan', 'title', 'cols', 'status']; }
    attributeChangedCallback() { if (this.isConnected) this._render(); }

    _getTools() {
      if (typeof AFRO_TOOLS === 'undefined') return [];

      const country = (this.getAttribute('country') || '').toUpperCase();
      const categoryFilter = this.getAttribute('category') || null;
      const statusFilter = this.getAttribute('status') || 'live';
      const showPan = this.getAttribute('show-pan') !== 'false';
      const max = parseInt(this.getAttribute('max'), 10) || 0;

      let tools = AFRO_TOOLS.filter(t => {
        // Country match: country-specific or pan-African
        const countryMatch = t.countries.includes(country) ||
          (showPan && t.countries.includes('ALL'));
        if (!countryMatch) return false;

        // Status filter
        if (statusFilter === 'live' && t.status !== 'live' && t.status !== 'new') return false;

        // Category filter
        if (categoryFilter && t.category !== categoryFilter) return false;

        return true;
      });

      // Sort: country-specific first, then by priority desc
      tools.sort((a, b) => {
        const aLocal = a.countries.includes(country) ? 0 : 1;
        const bLocal = b.countries.includes(country) ? 0 : 1;
        if (aLocal !== bLocal) return aLocal - bLocal;
        return (b.priority || 0) - (a.priority || 0);
      });

      if (max > 0) tools = tools.slice(0, max);
      return tools;
    }

    _getCategories(tools) {
      const cats = new Map();
      for (const t of tools) {
        if (!cats.has(t.category)) {
          cats.set(t.category, 0);
        }
        cats.set(t.category, cats.get(t.category) + 1);
      }
      return cats;
    }

    _render() {
      const country = (this.getAttribute('country') || '').toUpperCase();
      if (!country) {
        this.shadowRoot.innerHTML = '';
        return;
      }

      const allTools = this._getTools();
      const categories = this._getCategories(allTools);
      const tools = this._activeCategory
        ? allTools.filter(t => t.category === this._activeCategory)
        : allTools;

      const countryName = COUNTRY_NAMES[country] || country;
      const title = this.getAttribute('title') || `Tools for ${countryName}`;

      // Category filter pills (only show if >1 category)
      let filtersHTML = '';
      if (categories.size > 1 && !this.getAttribute('category')) {
        const pills = [`<button class="ct-pill${!this._activeCategory ? ' active' : ''}" data-cat="">All (${allTools.length})</button>`];
        for (const [cat, count] of categories) {
          const label = CATEGORY_LABELS[cat] || cat;
          const active = this._activeCategory === cat ? ' active' : '';
          pills.push(`<button class="ct-pill${active}" data-cat="${cat}">${label} (${count})</button>`);
        }
        filtersHTML = `<div class="ct-filters">${pills.join('')}</div>`;
      }

      // Tool cards
      const cardsHTML = tools.length > 0
        ? tools.map(t => this._renderCard(t, country)).join('')
        : `<div class="ct-empty">No tools found for ${countryName}.</div>`;

      this.shadowRoot.innerHTML = `
        <style>${CSS}</style>
        <div class="ct-wrap">
          <div class="ct-header">
            <div>
              <span class="ct-eyebrow">${this._esc(countryName)}</span>
              <h2 class="ct-title">${this._esc(title)}</h2>
            </div>
            <span class="ct-count">${tools.length} tool${tools.length !== 1 ? 's' : ''} available</span>
          </div>
          ${filtersHTML}
          <div class="ct-grid">${cardsHTML}</div>
        </div>`;

      this._bind();
    }

    _renderCard(tool, country) {
      const isPan = tool.countries.includes('ALL');
      const statusBadge = tool.status === 'new'
        ? '<span class="ct-badge new">New</span>'
        : tool.status === 'live'
          ? ''
          : '<span class="ct-badge coming">Coming Soon</span>';
      const panBadge = isPan ? '<span class="ct-badge pan">Pan-African</span>' : '';
      const isClickable = tool.status === 'live' || tool.status === 'new';
      const tag = isClickable ? 'a' : 'div';
      const hrefAttr = isClickable ? ` href="${tool.href}"` : '';

      return `
        <${tag} class="ct-card"${hrefAttr}>
          <span class="ct-card-icon">${tool.icon}</span>
          <div class="ct-card-name">${this._esc(tool.name)}</div>
          <div class="ct-card-desc">${this._esc(tool.desc)}</div>
          <div class="ct-card-meta">
            ${statusBadge}${panBadge}
            <span class="ct-card-arrow">${ARROW_SVG}</span>
          </div>
        </${tag}>`;
    }

    _bind() {
      this.shadowRoot.querySelectorAll('.ct-pill').forEach(btn => {
        btn.addEventListener('click', () => {
          this._activeCategory = btn.dataset.cat || null;
          this._render();
        });
      });
    }

    _esc(str) {
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    }
  }

  if (!customElements.get('afro-country-tools')) {
    customElements.define('afro-country-tools', AfroCountryTools);
  }
})();
