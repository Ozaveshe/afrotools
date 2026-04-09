// /assets/js/components/related-tools.js
// ═══════════════════════════════════════════════════════════
// AFROTOOLS — Related Tools "You Might Also Like"
// Apple-quality UI · Custom tool cards · Image support
// ═══════════════════════════════════════════════════════════

class AfroRelatedTools extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }
  static get observedAttributes() { return ['category','current']; }
  connectedCallback() { this._render(); }
  attributeChangedCallback() { if (this.shadowRoot) this._render(); }

  // Per-category visual identity (matches tool-registry.js category values)
  _cat(c) {
    return ({
      'african':           { gradient:'linear-gradient(145deg,#1E3A5F 0%,var(--color-accent) 100%)', pill:'#DBEAFE', pillTxt:'#1E40AF', label:'Uniquely African'  },
      'education':         { gradient:'linear-gradient(145deg,#b45309 0%,#f59e0b 100%)', pill:'#fef3c7', pillTxt:'#92400e', label:'Education'         },
      'financial':         { gradient:'linear-gradient(145deg,#1d4ed8 0%,#3b82f6 100%)', pill:'#dbeafe', pillTxt:'#1e40af', label:'Finance'           },
      'document-pdf':      { gradient:'linear-gradient(145deg,#6d28d9 0%,#8b5cf6 100%)', pill:'#ede9fe', pillTxt:'#5b21b6', label:'PDF & Docs'        },
      'engineering':       { gradient:'linear-gradient(145deg,#b91c1c 0%,#ef4444 100%)', pill:'#fee2e2', pillTxt:'#991b1b', label:'Engineering'       },
      'data-productivity': { gradient:'linear-gradient(145deg,#0369a1 0%,#0ea5e9 100%)', pill:'#e0f2fe', pillTxt:'#0c4a6e', label:'Productivity'     },
      'health':            { gradient:'linear-gradient(145deg,#9d174d 0%,#ec4899 100%)', pill:'#fce7f3', pillTxt:'#831843', label:'Health'            },
      'legal':             { gradient:'linear-gradient(145deg,#92400e 0%,#d97706 100%)', pill:'#fef3c7', pillTxt:'#78350f', label:'Legal'             },
      'ecommerce':         { gradient:'linear-gradient(145deg,#1E40AF 0%,#3B82F6 100%)', pill:'#DBEAFE', pillTxt:'#1E40AF', label:'E-Commerce'        },
      'image-design':      { gradient:'linear-gradient(145deg,#312e81 0%,#6366f1 100%)', pill:'#e0e7ff', pillTxt:'#3730a3', label:'Design'            },
      'developer':         { gradient:'linear-gradient(145deg,#164e63 0%,#0ea5e9 100%)', pill:'#cffafe', pillTxt:'#155e75', label:'Developer Tools'   },
      'language':          { gradient:'linear-gradient(145deg,#1E3A5F 0%,#3B82F6 100%)', pill:'#DBEAFE', pillTxt:'#1E40AF', label:'Language'          },
      // legacy keys kept for backwards compat
      'salary-tax':        { gradient:'linear-gradient(145deg,#1d4ed8 0%,#3b82f6 100%)', pill:'#dbeafe', pillTxt:'#1e40af', label:'Salary & Tax'     },
      'pdf-docs':          { gradient:'linear-gradient(145deg,#6d28d9 0%,#8b5cf6 100%)', pill:'#ede9fe', pillTxt:'#5b21b6', label:'PDF & Docs'        },
    })[c] || { gradient:'linear-gradient(145deg,#374151,#6b7280)', pill:'#f3f4f6', pillTxt:'#374151', label: c };
  }

  _getTools() {
    const cat     = this.getAttribute('category') || '';
    const current = this.getAttribute('current')  || '';
    const all     = (typeof AFRO_TOOLS !== 'undefined') ? AFRO_TOOLS : [];
    const pageLang = document.documentElement.lang || 'en';
    const live    = all.filter(t => t.status === 'live' && t.id !== current && (t.lang || 'en') === pageLang);
    const same    = live.filter(t => t.category === cat).sort((a,b)=>(b.priority||0)-(a.priority||0));
    const others  = live.filter(t => t.category !== cat).sort((a,b)=>(b.estTraffic||0)-(a.estTraffic||0));
    let res = same.slice(0,6);
    if (res.length < 4) {
      const ids = new Set(res.map(t=>t.id));
      res = res.concat(others.filter(t=>!ids.has(t.id)).slice(0, 4-res.length));
    }
    return res.slice(0,6);
  }

  _render() {
    const tools = this._getTools();
    if (!tools.length) { this.shadowRoot.innerHTML=''; return; }
    const fallbackOnlyIds = new Set(['html-to-pdf','pdf-bates','pdf-chat','pdf-compare','pdf-convert','pdf-find-replace','pdf-image-convert','pdf-reorder','pdf-repair','pdf-to-audio','pdf-translate','pdf-workflow']);

    const cards = tools.map(t => {
      const cs   = this._cat(t.category);
      const img  = `/assets/img/tools/${t.id}.webp`;
      const imgFallback = `/assets/img/tools/${t.id}.svg`;
      const useImage = !fallbackOnlyIds.has(t.id);
      const desc = t.desc && t.desc.length > 50 ? t.desc.slice(0,48)+'…' : (t.desc||'');
      return `
        <a class="card" href="${t.href}" aria-label="${t.name}">
          <div class="card-visual" style="background:${cs.gradient}">
            ${useImage ? `<img class="card-img" src="${img}" alt="${t.name} icon"
                 loading="lazy"
                 onerror="this.onerror=function(){this.style.display='none';this.nextElementSibling.style.display='flex'};this.classList.add('card-img--icon');this.src='${imgFallback}'">` : ''}
            <div class="card-emoji" style="display:${useImage ? 'none' : 'flex'}" aria-hidden="true">${t.icon||'PDF'}</div>
          </div>
          <div class="card-body">
            <span class="pill" style="background:${cs.pill};color:${cs.pillTxt}">${cs.label}</span>
            <div class="card-name">${t.name}</div>
            <div class="card-desc">${desc}</div>
          </div>
          <div class="card-cta">
            <span class="cta-btn">Open tool</span>
            <svg class="cta-arrow" width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </a>`;
    }).join('');

    this.shadowRoot.innerHTML = `
      <style>
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :host {
          display: block;
          font-family: -apple-system, 'SF Pro Display', 'DM Sans', system-ui, sans-serif;
          background: #f5f5f7;
          padding: 40px 0 80px !important;
        }

        /* ── Section wrapper ── */
        .wrap {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
        }

        /* ── Header ── */
        .header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          margin-bottom: 20px;
          gap: 16px;
        }
        .header-left {}
        .eyebrow {
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: .1em;
          text-transform: uppercase;
          color: var(--color-primary);
          margin-bottom: 6px;
        }
        .title {
          font-size: 1.35rem;
          font-weight: 700;
          color: #1d1d1f;
          letter-spacing: -0.025em;
          line-height: 1.15;
        }
        .all-link {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--color-primary);
          text-decoration: none;
          white-space: nowrap;
          padding: 8px 18px;
          border-radius: 980px;
          background: rgba(0,122,255,.08);
          transition: background .18s;
        }
        .all-link:hover { background: rgba(0,122,255,.16); }

        /* ── Card grid ── */
        .grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
        }

        /* ── Card ── */
        .card {
          display: flex;
          flex-direction: column;
          background: #ffffff;
          border-radius: 14px;
          overflow: hidden;
          text-decoration: none;
          color: inherit;
          box-shadow: 0 1px 4px rgba(0,0,0,.06), 0 0 0 .5px rgba(0,0,0,.05);
          transition:
            transform .28s cubic-bezier(.34,1.56,.64,1),
            box-shadow .28s ease;
          will-change: transform;
        }
        .card:hover {
          transform: translateY(-4px) scale(1.01);
          box-shadow: 0 12px 28px rgba(0,0,0,.1), 0 1px 4px rgba(0,0,0,.06);
        }

        /* ── Visual header (image area) ── */
        .card-visual {
          height: 120px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          flex-shrink: 0;
        }
        /* Subtle noise texture overlay */
        .card-visual::after {
          content: '';
          position: absolute;
          inset: 0;
          background: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.04'/%3E%3C/svg%3E");
          pointer-events: none;
        }
        .card-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          position: absolute;
          inset: 0;
          z-index: 1;
        }
        .card-img--icon {
          width: 48px;
          height: 48px;
          object-fit: contain;
          position: relative;
          inset: auto;
          border-radius: 12px;
          background: rgba(255,255,255,.15);
          box-shadow: 0 2px 12px rgba(0,0,0,.2);
        }
        .card-emoji {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: rgba(255,255,255,.18);
          align-items: center;
          justify-content: center;
          font-size: 1.6rem;
          box-shadow: 0 2px 12px rgba(0,0,0,.18);
          position: relative;
          z-index: 1;
        }

        /* ── Card body ── */
        .card-body {
          padding: 10px 14px 8px;
          flex: 1;
        }
        .pill {
          display: inline-block;
          font-size: 0.6rem;
          font-weight: 700;
          letter-spacing: .04em;
          text-transform: uppercase;
          padding: 2px 7px;
          border-radius: 100px;
          margin-bottom: 5px;
        }
        .card-name {
          font-size: 0.82rem;
          font-weight: 700;
          color: #1d1d1f;
          letter-spacing: -0.01em;
          line-height: 1.25;
          margin-bottom: 3px;
        }
        .card-desc {
          font-size: 0.72rem;
          color: #6e6e73;
          line-height: 1.45;
        }

        /* ── CTA strip ── */
        .card-cta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 7px 14px 10px;
          border-top: 1px solid rgba(0,0,0,.05);
        }
        .cta-btn {
          font-size: 0.72rem;
          font-weight: 600;
          color: var(--color-primary);
        }
        .cta-arrow {
          color: var(--color-primary);
          transition: transform .2s;
        }
        .card:hover .cta-arrow { transform: translateX(3px); }

        /* ── Responsive ── */
        @media (max-width: 960px) {
          .grid { grid-template-columns: repeat(2,1fr); }
          .title { font-size: 1.3rem; }
        }
        @media (max-width: 600px) {
          :host { padding: 32px 0 40px; }
          .wrap { padding: 0 16px; }
          .header { flex-direction: column; align-items: flex-start; gap: 10px; margin-bottom: 20px; }
          .grid { grid-template-columns: 1fr 1fr; gap: 10px; }
          .title { font-size: 1.15rem; }
          .card-visual { height: 90px; }
          .card-emoji { width: 36px; height: 36px; border-radius: 8px; }
          .card-emoji { font-size: 1.1rem; }
          .card-name { font-size: 0.76rem; }
          .card-desc { font-size: 0.68rem; }
          .card-body { padding: 8px 10px 6px; }
          .card-cta { padding: 6px 10px 8px; }
          .cta-btn { font-size: 0.68rem; }
        }
      </style>

      <div class="wrap">
        <div class="header">
          <div class="header-left">
            <p class="eyebrow">More from AfroTools</p>
            <h2 class="title">You might also like</h2>
          </div>
          <a href="/all-tools/" class="all-link">
            Browse all tools
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2.5 6h7M7 3l3 3-3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </a>
        </div>
        <div class="grid">${cards}</div>
      </div>
    `;
  }
}

customElements.define('afro-related-tools', AfroRelatedTools);
