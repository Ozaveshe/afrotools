// /assets/js/components/related-tools.js
// ═══════════════════════════════════════════════════════════
// AFROTOOLS — Related Tools Web Component
// Shows tool recommendations at the bottom of every tool page
// ═══════════════════════════════════════════════════════════

class AfroRelatedTools extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  static get observedAttributes() {
    return ['category', 'current'];
  }

  connectedCallback() {
    this._render();
  }

  attributeChangedCallback() {
    if (this.shadowRoot) this._render();
  }

  _getTools() {
    const category = this.getAttribute('category') || '';
    const current = this.getAttribute('current') || '';
    const allTools = (typeof AFRO_TOOLS !== 'undefined') ? AFRO_TOOLS : [];

    // Only live tools, exclude current tool
    const liveTools = allTools.filter(t => t.status === 'live' && t.id !== current);

    // Same category tools, sorted by priority descending
    const sameCategory = liveTools
      .filter(t => t.category === category)
      .sort((a, b) => (b.priority || 0) - (a.priority || 0));

    // Popular tools from other categories, sorted by estTraffic descending
    const otherPopular = liveTools
      .filter(t => t.category !== category)
      .sort((a, b) => (b.estTraffic || 0) - (a.estTraffic || 0));

    // Build result: prefer same category, fill with popular if needed
    const maxTools = 6;
    const minTools = 4;
    let result = sameCategory.slice(0, maxTools);

    if (result.length < minTools) {
      const needed = minTools - result.length;
      const ids = new Set(result.map(t => t.id));
      const fillers = otherPopular.filter(t => !ids.has(t.id)).slice(0, needed);
      result = result.concat(fillers);
    }

    // Cap at 6
    return result.slice(0, maxTools);
  }

  _render() {
    const tools = this._getTools();
    if (tools.length === 0) {
      this.shadowRoot.innerHTML = '';
      return;
    }

    const cards = tools.map(tool => `
      <a href="${tool.href}" class="rt-card">
        <span class="rt-icon">${tool.icon}</span>
        <div class="rt-info">
          <span class="rt-name">${tool.name}</span>
          <span class="rt-desc">${tool.desc}</span>
        </div>
      </a>
    `).join('');

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: 'DM Sans', system-ui, -apple-system, sans-serif;
          max-width: 1200px;
          margin: 0 auto;
          padding: 48px 20px 32px;
        }
        .rt-header {
          text-align: center;
          margin-bottom: 32px;
        }
        .rt-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1a1a1a;
          margin: 0 0 8px;
        }
        .rt-subtitle {
          font-size: 0.95rem;
          color: #666;
          margin: 0;
        }
        .rt-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }
        .rt-card {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 16px;
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          text-decoration: none;
          color: inherit;
          transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .rt-card:hover {
          transform: translateY(-3px);
          border-color: #0071E3;
          box-shadow: 0 4px 12px rgba(0, 113, 227, 0.1);
        }
        .rt-icon {
          font-size: 1.75rem;
          flex-shrink: 0;
          line-height: 1;
          margin-top: 2px;
        }
        .rt-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 0;
        }
        .rt-name {
          font-size: 0.95rem;
          font-weight: 600;
          color: #1a1a1a;
          line-height: 1.3;
        }
        .rt-desc {
          font-size: 0.8rem;
          color: #666;
          line-height: 1.45;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .rt-browse {
          text-align: center;
        }
        .rt-browse a {
          display: inline-block;
          font-size: 0.95rem;
          font-weight: 600;
          color: #0071E3;
          text-decoration: none;
          padding: 10px 24px;
          border: 2px solid #0071E3;
          border-radius: 8px;
          transition: background 0.2s ease, color 0.2s ease;
        }
        .rt-browse a:hover {
          background: #0071E3;
          color: #fff;
        }
        @media (max-width: 900px) {
          .rt-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 560px) {
          :host {
            padding: 32px 16px 24px;
          }
          .rt-grid {
            grid-template-columns: 1fr;
          }
          .rt-title {
            font-size: 1.25rem;
          }
        }
      </style>
      <div class="rt-header">
        <h2 class="rt-title">You might also like</h2>
        <p class="rt-subtitle">Discover more free tools on AfroTools</p>
      </div>
      <div class="rt-grid">${cards}</div>
      <div class="rt-browse">
        <a href="/all-tools/">Browse all tools &rarr;</a>
      </div>
    `;
  }
}

customElements.define('afro-related-tools', AfroRelatedTools);
