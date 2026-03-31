/**
 * <wise-cta> — Wise Affiliate CTA Web Component
 * AfroTools affiliate partner component
 *
 * Attributes:
 *   context  — remittance | currency | paye | vat | invoice | budget | mobile-money | general
 *   country  — optional country name for personalisation (e.g. "Nigeria")
 *
 * Usage:
 *   <wise-cta context="remittance" country="Nigeria"></wise-cta>
 */
(function () {
  'use strict';

  const AFFILIATE_URL = 'https://wise.prf.hn/click/camref:1011l5EEWt';

  const MESSAGES = {
    remittance: {
      headline: 'Send Money with Wise — Save Up to 6x on Fees',
      subtext:  'Wise uses the real mid-market rate with no hidden markups. Trusted by 16M+ customers worldwide.',
      button:   'Compare with Wise →',
    },
    currency: {
      headline: 'Need to Actually Send Money?',
      subtext:  'You\'ve checked the rate — now send it. Wise gives you the real mid-market rate with transparent fees.',
      button:   'Send with Wise →',
    },
    paye: {
      headline: 'Working Abroad? Send Money Home Cheaper',
      subtext:  'If you\'re earning overseas, Wise lets you send money to family at the real exchange rate — no bank markups.',
      button:   'Try Wise →',
    },
    vat: {
      headline: 'Doing Business Across Borders?',
      subtext:  'Wise Business lets you send and receive in 40+ currencies with the real exchange rate. No hidden fees.',
      button:   'Open Wise Business →',
    },
    invoice: {
      headline: 'Get Paid from International Clients Faster',
      subtext:  'Wise Business gives you local account details in 10+ currencies so clients pay you like a local.',
      button:   'Get Wise Business →',
    },
    budget: {
      headline: 'Stretch Your Budget Further',
      subtext:  'Save on international transfers with the real exchange rate. No bank markups, no hidden fees.',
      button:   'See Wise Rates →',
    },
    'mobile-money': {
      headline: 'Send to Mobile Money with Wise',
      subtext:  'Wise supports M-Pesa, MTN Mobile Money, Airtel Money and more. Real rate, low fees.',
      button:   'Send with Wise →',
    },
    general: {
      headline: 'Send & Receive Money Across Africa',
      subtext:  'Wise uses the real mid-market exchange rate. Trusted by 16M+ customers in 170+ countries.',
      button:   'Try Wise Free →',
    },
  };

  const WISE_LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 22" fill="currentColor" aria-hidden="true" focusable="false" style="height:20px;width:auto">
    <text x="0" y="17" font-family="DM Sans, system-ui, sans-serif" font-weight="800" font-size="20" letter-spacing="-0.5">wise</text>
  </svg>`;

  const CSS = `
    :host { display: block; }

    .wise-cta-card {
      background: var(--color-bg-subtle, #f5f5f7);
      border: 1px solid var(--color-border, #e2e8f0);
      border-radius: 18px;
      padding: 24px;
      margin-top: 32px;
      margin-bottom: 16px;
      max-width: 720px;
      box-sizing: border-box;
    }

    .wise-cta-logo {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
      color: var(--color-text-muted, #6e6e73);
    }

    .wise-cta-badge {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--color-text-subtle, #86868b);
      background: var(--color-bg, #e8e8ed);
      padding: 2px 8px;
      border-radius: 980px;
      border: 1px solid var(--color-border, #e2e8f0);
    }

    .wise-cta-headline {
      font-family: 'DM Sans', system-ui, sans-serif;
      font-size: 18px;
      font-weight: 700;
      color: var(--color-text, #1d1d1f);
      margin: 0 0 8px 0;
      line-height: 1.3;
    }

    .wise-cta-subtext {
      font-size: 14px;
      line-height: 1.5;
      color: var(--color-text-muted, #6e6e73);
      margin: 0 0 16px 0;
    }

    .wise-cta-button {
      display: inline-block;
      background: var(--color-primary, #007AFF);
      color: #fff;
      font-family: 'DM Sans', system-ui, sans-serif;
      font-size: 14px;
      font-weight: 600;
      padding: 10px 24px;
      border-radius: 980px;
      text-decoration: none;
      transition: opacity 0.2s ease;
      cursor: pointer;
    }

    .wise-cta-button:hover {
      opacity: 0.85;
    }

    .wise-cta-button:focus-visible {
      outline: 2px solid var(--color-primary, #007AFF);
      outline-offset: 3px;
    }

    .wise-cta-disclosure {
      font-size: 11px;
      color: var(--color-text-subtle, #86868b);
      margin: 12px 0 0 0;
      line-height: 1.4;
    }

    @media (prefers-color-scheme: dark) {
      .wise-cta-card {
        background: var(--color-bg-subtle, #131D2E);
        border-color: var(--color-border, #1E2D40);
      }
      .wise-cta-headline { color: var(--color-text, #E2E8F0); }
      .wise-cta-badge {
        background: var(--color-bg-card, #1E2D40);
        border-color: var(--color-border, #2A3D55);
      }
    }

    @media (max-width: 480px) {
      .wise-cta-card { padding: 18px; }
      .wise-cta-headline { font-size: 16px; }
    }
  `;

  class WiseCta extends HTMLElement {
    connectedCallback() {
      this._render();
    }

    static get observedAttributes() {
      return ['context', 'country'];
    }

    attributeChangedCallback() {
      if (this.shadowRoot) this._render();
    }

    _render() {
      if (!this.shadowRoot) {
        this.attachShadow({ mode: 'open' });
      }

      const context = this.getAttribute('context') || 'general';
      const country = this.getAttribute('country') || '';
      const msg = MESSAGES[context] || MESSAGES.general;

      const safeContext = context.replace(/'/g, "\\'");
      const safeCountry = (country || 'unknown').replace(/'/g, "\\'");

      this.shadowRoot.innerHTML = `
        <style>${CSS}</style>
        <div class="wise-cta-card">
          <div class="wise-cta-logo">
            ${WISE_LOGO_SVG}
            <span class="wise-cta-badge">Partner</span>
          </div>
          <h3 class="wise-cta-headline">${msg.headline}</h3>
          <p class="wise-cta-subtext">${msg.subtext}</p>
          <a href="${AFFILIATE_URL}"
             target="_blank"
             rel="sponsored noopener"
             class="wise-cta-button"
             data-context="${context}"
             data-country="${country || 'unknown'}"
          >${msg.button}</a>
          <p class="wise-cta-disclosure">AfroTools may earn a commission at no extra cost to you.</p>
        </div>`;

      // Attach GA4 click tracker after render
      const btn = this.shadowRoot.querySelector('.wise-cta-button');
      if (btn) {
        btn.addEventListener('click', () => {
          if (typeof gtag === 'function') {
            gtag('event', 'affiliate_click', {
              partner:  'wise',
              tool:     safeContext,
              country:  safeCountry,
            });
          }
        });
      }
    }
  }

  if (!customElements.get('wise-cta')) {
    customElements.define('wise-cta', WiseCta);
  }
})();
