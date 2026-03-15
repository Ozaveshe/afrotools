/**
 * AFROTOOLS — Breadcrumb Web Component
 * ===================================================================
 * Auto-generates breadcrumb navigation from the URL path.
 * Injects Schema.org BreadcrumbList structured data.
 *
 * Usage:
 *   <afro-breadcrumb></afro-breadcrumb>
 *   <afro-breadcrumb dark></afro-breadcrumb>       <!-- white text for dark backgrounds -->
 *   <afro-breadcrumb home="Tools"></afro-breadcrumb> <!-- custom home label -->
 *
 * Attributes:
 *   dark    - Use light text (for dark hero sections)
 *   home    - Custom home label (default: "Home")
 *   labels  - JSON map of slug overrides: '{"ng-salary-tax":"Nigeria PAYE"}'
 * ===================================================================
 */

(function () {
  'use strict';

  /**
   * Pretty-print a URL slug: "ng-salary-tax" -> "Nigeria Salary Tax"
   */
  const SLUG_OVERRIDES = {
    'ng-salary-tax': 'Nigeria PAYE Calculator',
    'ke-paye': 'Kenya PAYE Calculator',
    'gh-paye': 'Ghana PAYE Calculator',
    'za-paye': 'South Africa PAYE',
    'eg-paye': 'Egypt PAYE Calculator',
    'tz-paye': 'Tanzania PAYE Calculator',
    'ng-vat': 'Nigeria VAT Calculator',
    'ke-vat': 'Kenya VAT Calculator',
    'gh-vat': 'Ghana VAT Calculator',
    'za-vat': 'South Africa VAT',
    'salary-tax': 'Salary & Tax',
    'document-pdf': 'Document & PDF',
    'image-design': 'Image & Design',
    'developer-tools': 'Developer Tools',
    'vat-business-tax': 'VAT & Business Tax',
    'data-productivity': 'Business & ROI',
    'all-tools': 'All Tools',
    'pdf-workspace': 'PDF Workspace',
    'currency-converter': 'Currency Converter',
    'cv-builder': 'CV Builder',
    'invoice-generator': 'Invoice Generator',
    'vat-calculator': 'VAT Calculator',
    'import-duty': 'Import Duty',
    'japa-calculator': 'Japa Calculator',
    'south-africa': 'South Africa',
    'dr-congo': 'DR Congo',
    'cote-divoire': "C\u00f4te d'Ivoire",
    'burkina-faso': 'Burkina Faso',
    'sierra-leone': 'Sierra Leone',
    'guinea-bissau': 'Guinea-Bissau',
    'cape-verde': 'Cape Verde',
    'sao-tome': 'S\u00e3o Tom\u00e9',
    'south-sudan': 'South Sudan',
    'eq-guinea': 'Equatorial Guinea',
  };

  function prettifySlug(slug) {
    if (SLUG_OVERRIDES[slug]) return SLUG_OVERRIDES[slug];
    return slug
      .replace(/-/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
  }

  const CSS = `
    :host { display: block; }
    nav {
      display: flex; align-items: center; gap: 6px;
      font-size: 0.72rem; font-weight: 500;
      letter-spacing: 0.06em;
      color: var(--bc-color, #6b7280);
      padding: 0;
      flex-wrap: wrap;
    }
    :host([dark]) nav { color: rgba(255,255,255,0.35); }

    a {
      color: inherit; text-decoration: none;
      transition: color 0.15s;
    }
    a:hover { color: var(--bc-hover, #5ddb9e); }
    :host([dark]) a:hover { color: #5ddb9e; }

    .sep { color: var(--bc-sep, #d1d5db); user-select: none; }
    :host([dark]) .sep { color: rgba(255,255,255,0.15); }

    .current {
      color: var(--bc-current, #111827);
      font-weight: 600;
    }
    :host([dark]) .current { color: rgba(255,255,255,0.7); }
  `;

  class AfroBreadcrumb extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
      this._render();
    }

    static get observedAttributes() { return ['home', 'labels']; }
    attributeChangedCallback() { this._render(); }

    _render() {
      const homeLabel = this.getAttribute('home') || 'Home';
      let customLabels = {};
      try {
        const labelsAttr = this.getAttribute('labels');
        if (labelsAttr) customLabels = JSON.parse(labelsAttr);
      } catch {}

      const allOverrides = { ...SLUG_OVERRIDES, ...customLabels };

      // Parse URL path into breadcrumb segments
      const path = window.location.pathname;
      const segments = path.split('/').filter(Boolean);

      // Build crumbs array
      const crumbs = [{ label: homeLabel, href: '/' }];
      let accumulated = '';
      for (let i = 0; i < segments.length; i++) {
        accumulated += '/' + segments[i];
        const isLast = i === segments.length - 1;
        const label = allOverrides[segments[i]] || prettifySlug(segments[i]);
        crumbs.push({
          label,
          href: isLast ? null : accumulated + '/',
          isLast,
        });
      }

      // Render HTML
      const html = crumbs.map((c, i) => {
        if (i === 0) {
          return `<a href="${c.href}">${this._esc(c.label)}</a>`;
        }
        const sep = '<span class="sep" aria-hidden="true">/</span>';
        if (c.isLast) {
          return `${sep}<span class="current" aria-current="page">${this._esc(c.label)}</span>`;
        }
        return `${sep}<a href="${c.href}">${this._esc(c.label)}</a>`;
      }).join('');

      this.shadowRoot.innerHTML = `
        <style>${CSS}</style>
        <nav aria-label="Breadcrumb">${html}</nav>`;

      // Inject Schema.org structured data
      this._injectSchema(crumbs);
    }

    _esc(str) {
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    }

    _injectSchema(crumbs) {
      // Remove old schema
      const oldScript = document.querySelector('#afro-breadcrumb-schema');
      if (oldScript) oldScript.remove();

      const origin = window.location.origin;
      const items = crumbs.map((c, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: c.label,
        item: c.href ? origin + c.href : origin + window.location.pathname,
      }));

      const schema = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items,
      };

      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.id = 'afro-breadcrumb-schema';
      script.textContent = JSON.stringify(schema);
      document.head.appendChild(script);
    }
  }

  if (!customElements.get('afro-breadcrumb')) {
    customElements.define('afro-breadcrumb', AfroBreadcrumb);
  }
})();
