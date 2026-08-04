// /assets/js/components/related-tools.js
// ═══════════════════════════════════════════════════════════
// AFROTOOLS — Related Tools "You Might Also Like"
// Apple-quality UI · Custom tool cards · Image support
// ═══════════════════════════════════════════════════════════

const HA_RELATED_FALLBACK = [
  { id:'ng-paye-ha', name:'Kalkuleta PAYE Najeriya', icon:'PAYE', desc:'Lissafa albashin hannu da cire-ciren PAYE a Hausa.', href:'/ha/najeriya/harajin-albashi/', category:'financial', status:'live', lang:'ha' },
  { id:'vat-calculator-ha', name:'Kalkuletan VAT', icon:'VAT', desc:'Kara ko cire VAT sannan ka tabbatar da adadin da hukumar da ta dace.', href:'/ha/kayan-aiki/kalkuletan-vat/', category:'ecommerce', status:'live', lang:'ha' },
  { id:'pdf-workspace-ha', name:'Wurin Aikin PDF', icon:'PDF', desc:'Zabi hada, raba, matsa ko saka lambobin shafi a PDF.', href:'/ha/kayan-aiki/wurin-aikin-pdf/', category:'document-pdf', status:'live', lang:'ha' },
  { id:'jamb-aggregate-ha', name:'Kalkuletan JAMB', icon:'JAMB', desc:'Lissafa jimillar UTME da Post-UTME don shirin admission.', href:'/ha/kayan-aiki/kalkuletan-jamb/', category:'education', status:'live', lang:'ha' },
  { id:'cv-builder-ha', name:'Mai Gina CV a Hausa', icon:'CV', desc:'Shirya bayanan CV a burauzarka ba tare da loda fayil ba.', href:'/ha/kayan-aiki/gina-cv/', category:'document-pdf', status:'live', lang:'ha' },
  { id:'farm-profit-nigeria-ha', name:'Ribar Gona Najeriya', icon:'ROI', desc:'Kiyasta kudin shiga, kashe kudi da ribar gona.', href:'/ha/kayan-aiki/ribar-gona/', category:'agriculture', status:'live', lang:'ha' }
];

class AfroRelatedTools extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }
  static get observedAttributes() { return ['category','current']; }
  connectedCallback() {
    if (this._getSsrTools().length || window.AFRO_RELATED_TOOLS) {
      this._render();
      return;
    }
    this._deferDataLoad();
  }
  disconnectedCallback() {
    if (this._dataObserver) this._dataObserver.disconnect();
  }
  attributeChangedCallback() {
    if (this.isConnected && (this._getSsrTools().length || window.AFRO_RELATED_TOOLS)) this._render();
  }

  _deferDataLoad() {
    const load = () => {
      if (this._dataObserver) this._dataObserver.disconnect();
      AfroRelatedTools.loadData().then(() => {
        if (this.isConnected) this._render();
      }).catch(() => {
        // Related links are supplementary. Leave the component empty if the
        // deferred dataset is unavailable rather than delaying the page.
      });
    };
    if (!('IntersectionObserver' in window)) {
      window.setTimeout(load, 1200);
      return;
    }
    this._dataObserver = new IntersectionObserver((entries) => {
      if (entries.some(entry => entry.isIntersecting)) load();
    }, { rootMargin: '400px 0px' });
    this._dataObserver.observe(this);
  }

  static loadData() {
    if (window.AFRO_RELATED_TOOLS) return Promise.resolve(window.AFRO_RELATED_TOOLS);
    if (AfroRelatedTools._dataPromise) return AfroRelatedTools._dataPromise;
    AfroRelatedTools._dataPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector('script[src*="related-tools-data"]');
      const script = existing || document.createElement('script');
      const finish = () => window.AFRO_RELATED_TOOLS ? resolve(window.AFRO_RELATED_TOOLS) : reject(new Error('Related tools data unavailable'));
      script.addEventListener('load', finish, { once: true });
      script.addEventListener('error', reject, { once: true });
      if (!existing) {
        script.src = '/assets/js/components/related-tools-data.min.js';
        script.async = true;
        document.head.appendChild(script);
      }
    });
    return AfroRelatedTools._dataPromise;
  }

  // Category labels match tool-registry.js category values.
  _cat(c) {
    return ({
      'african':           { label:'Uniquely African' },
      'education':         { label:'Education' },
      'financial':         { label:'Finance' },
      'document-pdf':      { label:'PDF & Docs' },
      'engineering':       { label:'Engineering' },
      'data-productivity': { label:'Productivity' },
      'health':            { label:'Health' },
      'legal':             { label:'Legal' },
      'ecommerce':         { label:'E-Commerce' },
      'image-design':      { label:'Design' },
      'developer':         { label:'Developer Tools' },
      'language':          { label:'Language' },
      // legacy keys kept for backwards compat
      'salary-tax':        { label:'Salary & Tax' },
      'pdf-docs':          { label:'PDF & Docs' },
    })[c] || { label: c || 'Tools' };
  }

  _monogram(t) {
    const words = String((t && (t.name || t.id)) || 'AT')
      .replace(/[^\p{L}\p{N}]+/gu, ' ')
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    if (!words.length) return 'AT';
    return words.slice(0, 3).map(word => word[0]).join('').toLocaleUpperCase();
  }

  _imageKey(t) {
    const hasResolvedImage = t && Object.prototype.hasOwnProperty.call(t, 'imageExt');
    if (hasResolvedImage) {
      const resolvedExt = t.imageExt;
      const resolvedKey = typeof t.imageKey === 'string' ? t.imageKey.trim() : '';
      return (resolvedExt === 'svg' || resolvedExt === 'webp') ? resolvedKey : '';
    }
    const candidates = [
      t && t.imageKey,
      t && t.imageId,
      t && t.sourceId,
      t && t.id
    ].filter(v => typeof v === 'string' && v.trim()).map(v => v.trim());
    const extMap = (typeof TOOL_CARD_IMAGE_EXTENSIONS !== 'undefined') ? TOOL_CARD_IMAGE_EXTENSIONS : null;
    if (extMap) {
      const match = candidates.find(key => extMap[key]);
      return match || '';
    }
    return candidates[0] || '';
  }

  _imageExt(t, imageKey) {
    if (t && Object.prototype.hasOwnProperty.call(t, 'imageExt')) {
      return (t.imageExt === 'svg' || t.imageExt === 'webp') ? t.imageExt : '';
    }
    const extMap = (typeof TOOL_CARD_IMAGE_EXTENSIONS !== 'undefined') ? TOOL_CARD_IMAGE_EXTENSIONS : null;
    if (extMap && imageKey && extMap[imageKey]) return extMap[imageKey];
    // The manifest ships with the lazily-loaded registry; before it arrives,
    // assume webp — the card's onerror chain tries svg then the monogram.
    return imageKey ? 'webp' : '';
  }

  _getSsrTools() {
    if (this.getAttribute('data-ssr') !== '1') return [];
    const category = this.getAttribute('category') || '';
    return Array.from(this.querySelectorAll('[data-related-tools-ssr] a[data-related-tool]')).map(link => ({
      id: link.getAttribute('data-id') || '',
      name: link.getAttribute('data-name') || link.textContent.trim(),
      icon: link.getAttribute('data-icon') || '',
      desc: link.getAttribute('data-desc') || '',
      href: link.getAttribute('href') || '#',
      category: link.getAttribute('data-category') || category,
      lang: document.documentElement.lang || 'en'
    })).filter(tool => tool.name && tool.href !== '#').slice(0, 6);
  }

  _getTools() {
    const ssrTools = this._getSsrTools();
    if (ssrTools.length) return ssrTools;

    const cat     = this.getAttribute('category') || '';
    const current = this.getAttribute('current')  || '';
    const pageLang = document.documentElement.lang || 'en';
    const relatedData = window.AFRO_RELATED_TOOLS || null;

    if (pageLang.toLowerCase().startsWith('ha')) {
      const registry = (typeof AFRO_TOOLS !== 'undefined' && Array.isArray(AFRO_TOOLS)) ? AFRO_TOOLS : HA_RELATED_FALLBACK;
      const live = registry.filter(t => t.status === 'live' && t.id !== current && t.lang === 'ha' && String(t.href || '').startsWith('/ha/'));
      const same = live.filter(t => t.category === cat).sort((a,b)=>(b.priority||0)-(a.priority||0));
      const others = live.filter(t => t.category !== cat).sort((a,b)=>(b.priority||0)-(a.priority||0));
      const res = same.slice(0, 6);
      const ids = new Set(res.map(t => t.id));
      return res.concat(others.filter(t => !ids.has(t.id)).slice(0, Math.max(0, 6 - res.length))).slice(0, 6);
    }

    if (relatedData && !Array.isArray(relatedData) && relatedData.buckets && relatedData.fallback) {
      const bucketKey = `${pageLang}::${cat}`;
      const same = (relatedData.buckets[bucketKey] || []).filter(t => t.id !== current);
      const fallback = (relatedData.fallback[pageLang] || []).filter(t => t.id !== current);
      let res = same.slice(0, 6);
      if (res.length < 4) {
        const ids = new Set(res.map(t => t.id));
        res = res.concat(fallback.filter(t => !ids.has(t.id)).slice(0, 4 - res.length));
      }
      return res.slice(0, 6);
    }

    const all = Array.isArray(relatedData)
      ? relatedData
      : ((typeof AFRO_TOOLS !== 'undefined') ? AFRO_TOOLS : []);
    const live = all.filter(t => t.status === 'live' && t.id !== current && (t.lang || 'en') === pageLang);
    const same = live.filter(t => t.category === cat).sort((a,b)=>(b.priority||0)-(a.priority||0));
    const others = live.filter(t => t.category !== cat).sort((a,b)=>(b.estTraffic||0)-(a.estTraffic||0));
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
    const pageLanguage = (document.documentElement.lang || 'en').toLowerCase();
    const isHausa = pageLanguage.startsWith('ha');
    const isFrench = pageLanguage.startsWith('fr');
    const categoryHa = {
      african:'Na Afirka', education:'Ilimi', financial:'Kudi', 'document-pdf':'Takardu da PDF',
      engineering:'Injiniya', 'data-productivity':'Tsarin aiki', health:'Lafiya', legal:'Doka',
      ecommerce:'Kasuwanci', 'image-design':'Zane', developer:'Masu gini', language:'Harshe',
      agriculture:'Noma', telecom:'Sadarwa'
    };
    const categoryFr = {
      african:'Spécificités africaines', education:'Éducation', financial:'Finance',
      'document-pdf':'PDF et documents', engineering:'Ingénierie',
      'data-productivity':'Productivité', health:'Santé', legal:'Droit',
      ecommerce:'Commerce', 'image-design':'Design', developer:'Développement',
      language:'Langues', agriculture:'Agriculture', telecom:'Télécoms',
      'salary-tax':'Salaire et impôts', 'pdf-docs':'PDF et documents'
    };
    const fallbackOnlyIds = new Set(['html-to-pdf','pdf-bates','pdf-chat','pdf-compare','pdf-convert','pdf-find-replace','pdf-image-convert','pdf-reorder','pdf-repair','pdf-to-audio','pdf-translate','pdf-workflow']);

    const cards = tools.map(t => {
      const cs   = this._cat(t.category);
      const imageKey = this._imageKey(t);
      const imageExt = this._imageExt(t, imageKey);
      const fallbackExt = imageExt === 'svg' ? 'webp' : 'svg';
      const encodedImageKey = imageKey ? encodeURIComponent(imageKey) : '';
      const img  = imageExt && encodedImageKey ? `/assets/img/tools/${encodedImageKey}.${imageExt}` : '';
      const imgFallback = imageExt && encodedImageKey ? `/assets/img/tools/${encodedImageKey}.${fallbackExt}` : '';
      const useImage = Boolean(imageExt && encodedImageKey && !fallbackOnlyIds.has(t.id) && !fallbackOnlyIds.has(imageKey));
      const desc = t.desc && t.desc.length > 50 ? t.desc.slice(0,48)+'…' : (t.desc||'');
      const categoryLabel = isHausa
        ? (categoryHa[t.category] || 'Kayan aiki')
        : isFrench
          ? (categoryFr[t.category] || cs.label || 'Outil')
          : cs.label;
      return `
        <a class="card" href="${t.href}" aria-label="${t.name}">
          <div class="card-visual">
            ${useImage ? `<img class="card-img" src="${img}" alt=""
                 loading="lazy"
                 onerror="this.onerror=function(){this.style.display='none';this.nextElementSibling.style.display='flex'};this.classList.add('card-img--icon');this.src='${imgFallback}'">` : ''}
            <div class="card-monogram" style="display:${useImage ? 'none' : 'flex'}" aria-hidden="true">${this._monogram(t)}</div>
          </div>
          <div class="card-body">
            <span class="category-meta">${categoryLabel}</span>
            <div class="card-name">${t.name}</div>
            <div class="card-desc">${desc}</div>
          </div>
          <div class="card-cta">
            <span class="cta-btn">${isHausa ? 'Bude kayan aiki' : isFrench ? 'Ouvrir l’outil' : 'Open tool'}</span>
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
          font-family: 'DM Sans', system-ui, -apple-system, sans-serif;
          color: var(--color-text, #172033);
          background: var(--color-bg, #f7f9fc);
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
          letter-spacing: 0;
          color: var(--color-primary);
          margin-bottom: 6px;
        }
        .title {
          font-size: 1.35rem;
          font-weight: 700;
          color: var(--color-text, #172033);
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
          padding: 6px 0;
          border-radius: 0;
          background: transparent;
          transition: color .18s;
        }
        .all-link:hover { color: var(--color-primary-dark, #004ba0); }

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
          background: var(--color-surface, #fff);
          border: 1px solid var(--color-border, #d7dee8);
          border-radius: var(--radius-md, 10px);
          overflow: hidden;
          text-decoration: none;
          color: inherit;
          box-shadow: var(--shadow-sm, 0 1px 2px rgba(15,23,42,.05));
          transition: border-color .18s ease, box-shadow .18s ease;
        }
        .card:hover {
          border-color: rgba(var(--color-primary-rgb, 0,98,204), .38);
          box-shadow: var(--shadow-sm, 0 1px 2px rgba(15,23,42,.05));
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
          background: var(--color-bg-subtle, #eef3f7);
        }
        /* Subtle noise texture overlay */
        .card-visual::after {
          display: none;
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
          border-radius: var(--radius-sm, 6px);
          background: transparent;
        }
        .card-monogram {
          width: 48px;
          height: 48px;
          border: 1px solid var(--color-border, #d7dee8);
          border-radius: var(--radius-sm, 6px);
          background: var(--color-surface, #fff);
          color: var(--color-text-secondary, #526173);
          align-items: center;
          justify-content: center;
          font-size: .82rem;
          font-weight: 800;
          letter-spacing: .04em;
          position: relative;
          z-index: 1;
        }

        /* ── Card body ── */
        .card-body {
          padding: 10px 14px 8px;
          flex: 1;
        }
        .category-meta {
          display: inline-block;
          font-size: 0.68rem;
          font-weight: 700;
          color: var(--color-text-muted, #64748b);
          letter-spacing: 0;
          margin-bottom: 5px;
        }
        .card-name {
          font-size: 0.82rem;
          font-weight: 700;
          color: var(--color-text, #172033);
          letter-spacing: -0.01em;
          line-height: 1.25;
          margin-bottom: 3px;
        }
        .card-desc {
          font-size: 0.72rem;
          color: var(--color-text-muted, #64748b);
          line-height: 1.45;
        }

        /* ── CTA strip ── */
        .card-cta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 7px 14px 10px;
          border-top: 1px solid var(--color-border, #d7dee8);
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
          .card-monogram { width: 36px; height: 36px; }
          .card-name { font-size: 0.76rem; }
          .card-desc { font-size: 0.68rem; }
          .card-body { padding: 8px 10px 6px; }
          .card-cta { padding: 6px 10px 8px; }
          .cta-btn { font-size: 0.68rem; }
        }
        @media (max-width: 480px) {
          .grid { grid-template-columns: 1fr; }
          .card-visual { height: 112px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .card, .cta-arrow, .all-link { transition: none; }
          .card:hover .cta-arrow { transform: none; }
        }

        :host-context(html[data-theme="dark"]) {
          color: var(--color-text, #eef5ff);
          background: var(--color-bg, #0b1524);
        }
        :host-context(html[data-theme="dark"]) .card,
        :host-context(html[data-theme="dark"]) .card-monogram {
          background: var(--color-surface, #131d2e);
          border-color: var(--color-border, #334155);
        }
        :host-context(html[data-theme="dark"]) .card-visual {
          background: var(--color-bg-subtle, #182438);
        }
        :host-context(html[data-theme="dark"]) .title,
        :host-context(html[data-theme="dark"]) .card-name {
          color: var(--color-text, #eef5ff);
        }
      </style>

      <div class="wrap">
        <div class="header">
          <div class="header-left">
            <p class="eyebrow">${isHausa ? 'Karin kayan AfroTools' : isFrench ? 'Plus d’outils AfroTools' : 'More from AfroTools'}</p>
            <h2 class="title">${isHausa ? 'Wata kila za ka kuma so' : isFrench ? 'Ces outils peuvent aussi vous aider' : 'You might also like'}</h2>
          </div>
          <a href="${isHausa ? '/ha/kayan-aiki/' : isFrench ? '/fr/tools/' : '/tools/'}" class="all-link">
            ${isHausa ? 'Duba duk kayan aiki' : isFrench ? 'Voir tous les outils' : 'Browse all tools'}
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

function applyDayOneTwoRefinement() {
  const categoryRoots = [
    '.diaspora-tool-focus',
    '.career-tool-focus',
    '.security-tool-focus',
    '.personal-finance-tool-focus',
    '.small-business-focus',
    '.small-business-tool-focus',
    '.fintech-focus',
    '.fintech-payment-focus'
  ];
  const related = document.querySelector('afro-related-tools[category]');
  const category = related ? related.getAttribute('category') : '';
  const dayOneTwoCategories = [
    'diaspora',
    'career',
    'security',
    'personal-finance',
    'small-business',
    'fintech'
  ];
  const isScopedCategory = dayOneTwoCategories.includes(category);
  if (
    !document.body ||
    (!document.body.matches(categoryRoots.join(',')) && !isScopedCategory)
  ) return;

  if (!document.querySelector('link[data-day1-day2-ui-refinement]')) {
    const stylesheet = document.createElement('link');
    stylesheet.rel = 'stylesheet';
    stylesheet.href = '/assets/css/day1-day2-ui-refinement.css';
    stylesheet.dataset.day1Day2UiRefinement = 'true';
    document.head.appendChild(stylesheet);
  }

  if (!document.querySelector('main,[role="main"]')) {
    const hero = document.querySelector('.tool-hero,.rc-hero');
    const heroSibling = hero && hero.nextElementSibling;
    const primary = document.querySelector(
      '.ds-tool-layout,.en-tool-layout,.en-tool-layout-wide,.tool-main,.tool-main-inner,.fin-main'
    ) || (
      heroSibling &&
      heroSibling.matches('.container,.tool-layout,.page-main') &&
      heroSibling
    );
    if (primary) primary.setAttribute('role', 'main');
  }

  document.querySelectorAll('.remove-btn,.btn-del,.btn-del-row,.btn-rm').forEach((button) => {
    if (!button.getAttribute('aria-label')) button.setAttribute('aria-label', 'Remove item');
  });
}

applyDayOneTwoRefinement();
document.addEventListener('DOMContentLoaded', applyDayOneTwoRefinement, { once: true });

customElements.define('afro-related-tools', AfroRelatedTools);
