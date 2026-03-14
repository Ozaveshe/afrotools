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
      'african':           { gradient:'linear-gradient(145deg,#005731 0%,#008751 100%)', pill:'#d1fae5', pillTxt:'#064e3b', label:'Uniquely African'  },
      'education':         { gradient:'linear-gradient(145deg,#b45309 0%,#f59e0b 100%)', pill:'#fef3c7', pillTxt:'#92400e', label:'Education'         },
      'financial':         { gradient:'linear-gradient(145deg,#1d4ed8 0%,#3b82f6 100%)', pill:'#dbeafe', pillTxt:'#1e40af', label:'Finance'           },
      'document-pdf':      { gradient:'linear-gradient(145deg,#6d28d9 0%,#8b5cf6 100%)', pill:'#ede9fe', pillTxt:'#5b21b6', label:'PDF & Docs'        },
      'engineering':       { gradient:'linear-gradient(145deg,#b91c1c 0%,#ef4444 100%)', pill:'#fee2e2', pillTxt:'#991b1b', label:'Engineering'       },
      'data-productivity': { gradient:'linear-gradient(145deg,#0369a1 0%,#0ea5e9 100%)', pill:'#e0f2fe', pillTxt:'#0c4a6e', label:'Productivity'     },
      'health':            { gradient:'linear-gradient(145deg,#9d174d 0%,#ec4899 100%)', pill:'#fce7f3', pillTxt:'#831843', label:'Health'            },
      'legal':             { gradient:'linear-gradient(145deg,#92400e 0%,#d97706 100%)', pill:'#fef3c7', pillTxt:'#78350f', label:'Legal'             },
      'ecommerce':         { gradient:'linear-gradient(145deg,#047857 0%,#10b981 100%)', pill:'#d1fae5', pillTxt:'#065f46', label:'E-Commerce'        },
      'image-design':      { gradient:'linear-gradient(145deg,#312e81 0%,#6366f1 100%)', pill:'#e0e7ff', pillTxt:'#3730a3', label:'Design'            },
      'developer':         { gradient:'linear-gradient(145deg,#164e63 0%,#0ea5e9 100%)', pill:'#cffafe', pillTxt:'#155e75', label:'Developer Tools'   },
      'language':          { gradient:'linear-gradient(145deg,#14532d 0%,#22c55e 100%)', pill:'#dcfce7', pillTxt:'#15803d', label:'Language'          },
      // legacy keys kept for backwards compat
      'salary-tax':        { gradient:'linear-gradient(145deg,#1d4ed8 0%,#3b82f6 100%)', pill:'#dbeafe', pillTxt:'#1e40af', label:'Salary & Tax'     },
      'pdf-docs':          { gradient:'linear-gradient(145deg,#6d28d9 0%,#8b5cf6 100%)', pill:'#ede9fe', pillTxt:'#5b21b6', label:'PDF & Docs'        },
    })[c] || { gradient:'linear-gradient(145deg,#374151,#6b7280)', pill:'#f3f4f6', pillTxt:'#374151', label: c };
  }

  _getTools() {
    const cat     = this.getAttribute('category') || '';
    const current = this.getAttribute('current')  || '';
    const all     = (typeof AFRO_TOOLS !== 'undefined') ? AFRO_TOOLS : [];
    const live    = all.filter(t => t.status === 'live' && t.id !== current);
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

    const cards = tools.map(t => {
      const cs   = this._cat(t.category);
      const img  = `/assets/img/tool-icons/${t.id}.png`;
      const desc = t.desc && t.desc.length > 68 ? t.desc.slice(0,66)+'…' : (t.desc||'');
      return `
        <a class="card" href="${t.href}" aria-label="${t.name}">
          <div class="card-visual" style="background:${cs.gradient}">
            <img class="card-img" src="${img}" alt="${t.name} icon"
                 width="56" height="56" loading="lazy"
                 onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
            <div class="card-emoji" style="display:none" aria-hidden="true">${t.icon||'🔧'}</div>
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
          padding: 56px 0 60px;
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
          margin-bottom: 32px;
          gap: 16px;
        }
        .header-left {}
        .eyebrow {
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: .1em;
          text-transform: uppercase;
          color: #0071E3;
          margin-bottom: 6px;
        }
        .title {
          font-size: 1.65rem;
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
          color: #0071E3;
          text-decoration: none;
          white-space: nowrap;
          padding: 8px 18px;
          border-radius: 980px;
          background: rgba(0,113,227,.08);
          transition: background .18s;
        }
        .all-link:hover { background: rgba(0,113,227,.16); }

        /* ── Card grid ── */
        .grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 18px;
        }

        /* ── Card ── */
        .card {
          display: flex;
          flex-direction: column;
          background: #ffffff;
          border-radius: 18px;
          overflow: hidden;
          text-decoration: none;
          color: inherit;
          /* Apple-style lifted card */
          box-shadow: 0 2px 8px rgba(0,0,0,.06), 0 0 0 .5px rgba(0,0,0,.06);
          transition:
            transform .28s cubic-bezier(.34,1.56,.64,1),
            box-shadow .28s ease;
          will-change: transform;
        }
        .card:hover {
          transform: translateY(-6px) scale(1.01);
          box-shadow: 0 16px 40px rgba(0,0,0,.12), 0 2px 8px rgba(0,0,0,.06);
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
          width: 60px;
          height: 60px;
          object-fit: contain;
          border-radius: 14px;
          background: rgba(255,255,255,.15);
          box-shadow: 0 4px 20px rgba(0,0,0,.22), 0 0 0 1px rgba(255,255,255,.12);
          position: relative;
          z-index: 1;
        }
        .card-emoji {
          width: 60px;
          height: 60px;
          border-radius: 14px;
          background: rgba(255,255,255,.18);
          align-items: center;
          justify-content: center;
          font-size: 1.9rem;
          box-shadow: 0 4px 20px rgba(0,0,0,.2);
          position: relative;
          z-index: 1;
        }

        /* ── Card body ── */
        .card-body {
          padding: 16px 18px 10px;
          flex: 1;
        }
        .pill {
          display: inline-block;
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: .05em;
          text-transform: uppercase;
          padding: 3px 9px;
          border-radius: 100px;
          margin-bottom: 8px;
        }
        .card-name {
          font-size: 0.95rem;
          font-weight: 700;
          color: #1d1d1f;
          letter-spacing: -0.015em;
          line-height: 1.3;
          margin-bottom: 5px;
        }
        .card-desc {
          font-size: 0.78rem;
          color: #6e6e73;
          line-height: 1.55;
        }

        /* ── CTA strip ── */
        .card-cta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 18px 14px;
          border-top: 1px solid rgba(0,0,0,.05);
        }
        .cta-btn {
          font-size: 0.78rem;
          font-weight: 600;
          color: #0071E3;
        }
        .cta-arrow {
          color: #0071E3;
          transition: transform .2s;
        }
        .card:hover .cta-arrow { transform: translateX(4px); }

        /* ── Responsive ── */
        @media (max-width: 960px) {
          .grid { grid-template-columns: repeat(2,1fr); }
          .title { font-size: 1.4rem; }
        }
        @media (max-width: 600px) {
          :host { padding: 40px 0 48px; }
          .wrap { padding: 0 16px; }
          .header { flex-direction: column; align-items: flex-start; gap: 12px; }
          .grid { grid-template-columns: 1fr; gap: 14px; }
          .title { font-size: 1.25rem; }
          /* Horizontal scroll on mobile for better UX */
          .grid {
            display: flex;
            flex-wrap: nowrap;
            overflow-x: auto;
            gap: 14px;
            scroll-snap-type: x mandatory;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
            padding-bottom: 4px;
          }
          .grid::-webkit-scrollbar { display: none; }
          .card {
            min-width: 260px;
            scroll-snap-align: start;
            flex-shrink: 0;
          }
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
