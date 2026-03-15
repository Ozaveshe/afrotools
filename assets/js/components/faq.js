/**
 * AFROTOOLS — FAQ Accordion Web Component
 * ===================================================================
 * Accessible FAQ accordion with Schema.org FAQPage structured data.
 *
 * Usage:
 *   <afro-faq items='[{"q":"What is PAYE?","a":"Pay As You Earn..."}]'></afro-faq>
 *
 *   Or with child elements:
 *   <afro-faq>
 *     <div data-q="What is PAYE?">Pay As You Earn is...</div>
 *     <div data-q="How is tax calculated?">Tax is calculated using...</div>
 *   </afro-faq>
 *
 * Attributes:
 *   items  - JSON array of {q, a} objects
 *   title  - Optional section title (default: 'Frequently Asked Questions')
 *   cols   - Number of columns: '1' or '2' (default: '2')
 *   schema - Set to 'false' to disable Schema.org injection
 * ===================================================================
 */

(function () {
  'use strict';

  const CSS = `
    :host { display: block; }

    .faq-wrap {
      padding: 48px 0;
    }

    .faq-eyebrow {
      display: block; font-size: 0.68rem; font-weight: 700;
      letter-spacing: 0.1em; text-transform: uppercase;
      color: var(--color-primary);
      margin-bottom: 6px;
    }

    .faq-title {
      font-size: clamp(1.3rem, 2.5vw, 1.7rem);
      font-weight: 800; color: var(--color-text, #1a2e22);
      letter-spacing: -0.02em; margin-bottom: 28px;
    }

    .faq-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    :host([cols="1"]) .faq-grid { grid-template-columns: 1fr; }

    .faq-item {
      border: 1px solid var(--color-border, #E8F0FE);
      border-radius: 10px;
      overflow: hidden;
      transition: border-color 0.15s;
    }
    .faq-item:hover { border-color: var(--color-primary); }
    .faq-item.open { border-color: var(--color-primary); }

    .faq-q {
      display: flex; align-items: center; justify-content: space-between;
      padding: 16px 20px;
      font-size: 0.88rem; font-weight: 700;
      color: var(--color-text, #1a2e22);
      background: none; border: none;
      cursor: pointer; width: 100%;
      text-align: left;
      font-family: inherit;
      gap: 12px;
      transition: background 0.15s;
    }
    .faq-q:hover { background: var(--color-bg, #EFF6FF); }
    .faq-q:focus-visible {
      outline: 2px solid var(--color-primary);
      outline-offset: -2px;
    }

    .faq-icon {
      flex-shrink: 0; width: 20px; height: 20px;
      display: flex; align-items: center; justify-content: center;
      transition: transform 0.25s ease;
      color: var(--color-primary);
    }
    .faq-item.open .faq-icon { transform: rotate(45deg); }

    .faq-a-wrap {
      max-height: 0; overflow: hidden;
      transition: max-height 0.3s ease;
    }
    .faq-item.open .faq-a-wrap { max-height: 600px; }

    .faq-a {
      padding: 0 20px 16px;
      font-size: 0.84rem; color: var(--color-text-muted, #3d6349);
      line-height: 1.75;
    }

    @media (max-width: 700px) {
      .faq-grid { grid-template-columns: 1fr; }
    }

    /* Dark mode */
    @media (prefers-color-scheme: dark) {
      .faq-title { color: #EFF6FF; }
      .faq-item { border-color: #2a3a30; }
      .faq-q { color: #EFF6FF; }
      .faq-q:hover { background: #1a2420; }
      .faq-a { color: #93A3B8; }
    }
  `;

  class AfroFaq extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
      this._render();
    }

    static get observedAttributes() { return ['items', 'title', 'cols']; }
    attributeChangedCallback() { if (this.isConnected) this._render(); }

    _getItems() {
      // Try attribute first
      const attr = this.getAttribute('items');
      if (attr) {
        try { return JSON.parse(attr); } catch {}
      }

      // Fallback: read child elements with data-q
      const children = this.querySelectorAll('[data-q]');
      if (children.length > 0) {
        return Array.from(children).map(el => ({
          q: el.getAttribute('data-q'),
          a: el.innerHTML.trim(),
        }));
      }

      return [];
    }

    _render() {
      const items = this._getItems();
      if (items.length === 0) {
        this.shadowRoot.innerHTML = '';
        return;
      }

      const title = this.getAttribute('title') || 'Frequently Asked Questions';
      const plusIcon = `<svg viewBox="0 0 20 20" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="10" y1="4" x2="10" y2="16"/><line x1="4" y1="10" x2="16" y2="10"/></svg>`;

      const faqItems = items.map((item, i) => `
        <div class="faq-item" data-idx="${i}">
          <button class="faq-q" aria-expanded="false" aria-controls="faq-a-${i}" id="faq-q-${i}">
            <span>${this._esc(item.q)}</span>
            <span class="faq-icon">${plusIcon}</span>
          </button>
          <div class="faq-a-wrap" id="faq-a-${i}" role="region" aria-labelledby="faq-q-${i}">
            <div class="faq-a">${item.a}</div>
          </div>
        </div>`).join('');

      this.shadowRoot.innerHTML = `
        <style>${CSS}</style>
        <div class="faq-wrap">
          <span class="faq-eyebrow">FAQ</span>
          <h2 class="faq-title">${this._esc(title)}</h2>
          <div class="faq-grid">${faqItems}</div>
        </div>`;

      this._bind();

      // Schema.org
      if (this.getAttribute('schema') !== 'false') {
        this._injectSchema(items);
      }
    }

    _bind() {
      const sr = this.shadowRoot;
      sr.querySelectorAll('.faq-q').forEach(btn => {
        btn.addEventListener('click', () => {
          const item = btn.closest('.faq-item');
          const isOpen = item.classList.contains('open');

          // Close all others (optional — remove for multi-open)
          // sr.querySelectorAll('.faq-item.open').forEach(el => {
          //   el.classList.remove('open');
          //   el.querySelector('.faq-q').setAttribute('aria-expanded', 'false');
          // });

          item.classList.toggle('open', !isOpen);
          btn.setAttribute('aria-expanded', String(!isOpen));
        });

        // Keyboard: Enter and Space handled by native button
      });
    }

    _esc(str) {
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    }

    _injectSchema(items) {
      const oldScript = document.querySelector('#afro-faq-schema');
      if (oldScript) oldScript.remove();

      const schema = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: items.map(item => ({
          '@type': 'Question',
          name: item.q,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.a.replace(/<[^>]*>/g, ''), // Strip HTML for schema
          },
        })),
      };

      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.id = 'afro-faq-schema';
      script.textContent = JSON.stringify(schema);
      document.head.appendChild(script);
    }
  }

  if (!customElements.get('afro-faq')) {
    customElements.define('afro-faq', AfroFaq);
  }
})();
