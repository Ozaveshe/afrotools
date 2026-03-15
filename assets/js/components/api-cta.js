/**
 * AFROTOOLS API CTA — Web Component
 * =====================================================================
 * Dark-background call-to-action block for API products.
 *
 * <afro-api-cta
 *   data-api-name="AfroFX API"
 *   data-description="Live African forex rates for 42 currencies. 15-minute updates."
 *   data-docs-url="/docs/api/"
 *   data-signup-url="/docs/api/#signup">
 * </afro-api-cta>
 * =====================================================================
 */
(function () {
  'use strict';

  const CSS = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=Instrument+Serif&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    :host{display:block;font-family:'DM Sans',system-ui,sans-serif}
    .cta{
      background:#0A1628;color:#fff;
      padding:48px 24px;border-radius:16px;
      position:relative;overflow:hidden;
    }
    .cta::before{
      content:'';position:absolute;top:-60%;right:-20%;
      width:400px;height:400px;border-radius:50%;
      background:radial-gradient(circle,rgba(0,122,255,0.12) 0%,transparent 70%);
      pointer-events:none;
    }
    .inner{
      max-width:900px;margin:0 auto;position:relative;z-index:1;
      display:grid;grid-template-columns:1fr 1fr;gap:40px;align-items:center;
    }
    .content{}
    .badge{
      display:inline-block;background:rgba(0,122,255,0.15);color:#80BFFF;
      font-size:0.7rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;
      padding:4px 10px;border-radius:20px;margin-bottom:16px;
    }
    h2{
      font-family:'Instrument Serif',Georgia,serif;
      font-size:1.75rem;font-weight:400;line-height:1.25;
      margin-bottom:12px;color:#fff;
    }
    .desc{
      color:rgba(255,255,255,0.65);font-size:0.9rem;line-height:1.6;
      margin-bottom:24px;max-width:380px;
    }
    .actions{display:flex;gap:12px;flex-wrap:wrap}
    .btn{
      display:inline-flex;align-items:center;gap:6px;
      padding:12px 20px;border-radius:8px;font-size:0.85rem;font-weight:600;
      text-decoration:none;transition:all .15s ease;cursor:pointer;border:none;
    }
    .btn-primary{
      background:#007AFF;color:#fff;
    }
    .btn-primary:hover{background:#0063D1}
    .btn-secondary{
      background:rgba(255,255,255,0.08);color:#fff;
      border:1px solid rgba(255,255,255,0.15);
    }
    .btn-secondary:hover{background:rgba(255,255,255,0.14)}
    .code-block{
      background:#111D30;border:1px solid rgba(255,255,255,0.08);
      border-radius:12px;padding:20px;font-family:'JetBrains Mono','Fira Code',monospace;
      font-size:0.78rem;line-height:1.7;overflow-x:auto;
    }
    .code-line{display:block;white-space:pre}
    .code-comment{color:rgba(255,255,255,0.35)}
    .code-key{color:#80BFFF}
    .code-str{color:#F5A623}
    .code-punct{color:rgba(255,255,255,0.5)}
    @media(max-width:768px){
      .inner{grid-template-columns:1fr;gap:24px}
      h2{font-size:1.4rem}
      .code-block{font-size:0.72rem;padding:14px}
    }
  `;

  class AfroApiCta extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
      this._render();
    }

    static get observedAttributes() {
      return ['data-api-name', 'data-description', 'data-docs-url', 'data-signup-url'];
    }
    attributeChangedCallback() { if (this.shadowRoot.querySelector('.cta')) this._render(); }

    _render() {
      const name = this.getAttribute('data-api-name') || 'AfroTools API';
      const desc = this.getAttribute('data-description') || 'Real-time data for African markets.';
      const docsUrl = this.getAttribute('data-docs-url') || '/docs/api/';
      const signupUrl = this.getAttribute('data-signup-url') || '/docs/api/#signup';

      // Build example endpoint from name
      const endpoint = name.toLowerCase().includes('forex') || name.toLowerCase().includes('fx')
        ? 'forex/latest'
        : 'data/latest';

      this.shadowRoot.innerHTML = `
        <style>${CSS}</style>
        <section class="cta" role="region" aria-label="${name} call to action">
          <div class="inner">
            <div class="content">
              <span class="badge">Developer API</span>
              <h2>${name}</h2>
              <p class="desc">${desc}</p>
              <div class="actions">
                <a class="btn btn-primary" href="${docsUrl}">View API Docs \u2192</a>
                <a class="btn btn-secondary" href="${signupUrl}">Get Free API Key \u2192</a>
              </div>
            </div>
            <div class="code-block" aria-label="API example">
              <span class="code-line"><span class="code-comment">// Example request</span></span>
              <span class="code-line"><span class="code-key">GET</span> <span class="code-str">https://api.afrotools.com/${endpoint}</span></span>
              <span class="code-line"></span>
              <span class="code-line"><span class="code-comment">// Response</span></span>
              <span class="code-line"><span class="code-punct">{</span></span>
              <span class="code-line">  <span class="code-key">"status"</span><span class="code-punct">:</span> <span class="code-str">"ok"</span><span class="code-punct">,</span></span>
              <span class="code-line">  <span class="code-key">"updated"</span><span class="code-punct">:</span> <span class="code-str">"2026-03-15T12:00:00Z"</span><span class="code-punct">,</span></span>
              <span class="code-line">  <span class="code-key">"base"</span><span class="code-punct">:</span> <span class="code-str">"USD"</span><span class="code-punct">,</span></span>
              <span class="code-line">  <span class="code-key">"rates"</span><span class="code-punct">: {</span></span>
              <span class="code-line">    <span class="code-key">"NGN"</span><span class="code-punct">:</span> <span class="code-str">1580.50</span><span class="code-punct">,</span></span>
              <span class="code-line">    <span class="code-key">"KES"</span><span class="code-punct">:</span> <span class="code-str">129.35</span><span class="code-punct">,</span></span>
              <span class="code-line">    <span class="code-key">"ZAR"</span><span class="code-punct">:</span> <span class="code-str">18.42</span></span>
              <span class="code-line">  <span class="code-punct">}</span></span>
              <span class="code-line"><span class="code-punct">}</span></span>
            </div>
          </div>
        </section>
      `;
    }
  }

  customElements.define('afro-api-cta', AfroApiCta);
  window.AfroTools = window.AfroTools || {};
  window.AfroTools.AfroApiCta = AfroApiCta;
})();
