/**
 * AFROTOOLS AFRICA MAP — Interactive SVG Web Component
 * =====================================================================
 * <afro-map data-metric="fuel-petrol" data-colorscale="blue-red" data-unit="$/L"></afro-map>
 *
 * Methods:
 *   setData([{code, value, label}, ...])
 *   highlightCountry(code)
 *
 * Events:
 *   'country-click' => detail: {code, name, value}
 * =====================================================================
 */
(function () {
  'use strict';

  /* ── Country metadata: ISO2 → name + flag ──────────────── */
  const COUNTRIES = {
    DZ: { name: 'Algeria',                flag: '\u{1F1E9}\u{1F1FF}' },
    AO: { name: 'Angola',                 flag: '\u{1F1E6}\u{1F1F4}' },
    BJ: { name: 'Benin',                  flag: '\u{1F1E7}\u{1F1EF}' },
    BW: { name: 'Botswana',               flag: '\u{1F1E7}\u{1F1FC}' },
    BF: { name: 'Burkina Faso',           flag: '\u{1F1E7}\u{1F1EB}' },
    BI: { name: 'Burundi',                flag: '\u{1F1E7}\u{1F1EE}' },
    CV: { name: 'Cabo Verde',             flag: '\u{1F1E8}\u{1F1FB}' },
    CM: { name: 'Cameroon',               flag: '\u{1F1E8}\u{1F1F2}' },
    CF: { name: 'Central African Rep.',    flag: '\u{1F1E8}\u{1F1EB}' },
    TD: { name: 'Chad',                   flag: '\u{1F1F9}\u{1F1E9}' },
    KM: { name: 'Comoros',                flag: '\u{1F1F0}\u{1F1F2}' },
    CG: { name: 'Congo',                  flag: '\u{1F1E8}\u{1F1EC}' },
    CD: { name: 'DR Congo',               flag: '\u{1F1E8}\u{1F1E9}' },
    CI: { name: "C\u00f4te d'Ivoire",     flag: '\u{1F1E8}\u{1F1EE}' },
    DJ: { name: 'Djibouti',               flag: '\u{1F1E9}\u{1F1EF}' },
    EG: { name: 'Egypt',                  flag: '\u{1F1EA}\u{1F1EC}' },
    GQ: { name: 'Equatorial Guinea',      flag: '\u{1F1EC}\u{1F1F6}' },
    ER: { name: 'Eritrea',                flag: '\u{1F1EA}\u{1F1F7}' },
    SZ: { name: 'Eswatini',               flag: '\u{1F1F8}\u{1F1FF}' },
    ET: { name: 'Ethiopia',               flag: '\u{1F1EA}\u{1F1F9}' },
    GA: { name: 'Gabon',                  flag: '\u{1F1EC}\u{1F1E6}' },
    GM: { name: 'Gambia',                 flag: '\u{1F1EC}\u{1F1F2}' },
    GH: { name: 'Ghana',                  flag: '\u{1F1EC}\u{1F1ED}' },
    GN: { name: 'Guinea',                 flag: '\u{1F1EC}\u{1F1F3}' },
    GW: { name: 'Guinea-Bissau',          flag: '\u{1F1EC}\u{1F1FC}' },
    KE: { name: 'Kenya',                  flag: '\u{1F1F0}\u{1F1EA}' },
    LS: { name: 'Lesotho',                flag: '\u{1F1F1}\u{1F1F8}' },
    LR: { name: 'Liberia',                flag: '\u{1F1F1}\u{1F1F7}' },
    LY: { name: 'Libya',                  flag: '\u{1F1F1}\u{1F1FE}' },
    MG: { name: 'Madagascar',             flag: '\u{1F1F2}\u{1F1EC}' },
    MW: { name: 'Malawi',                 flag: '\u{1F1F2}\u{1F1FC}' },
    ML: { name: 'Mali',                   flag: '\u{1F1F2}\u{1F1F1}' },
    MR: { name: 'Mauritania',             flag: '\u{1F1F2}\u{1F1F7}' },
    MU: { name: 'Mauritius',              flag: '\u{1F1F2}\u{1F1FA}' },
    MA: { name: 'Morocco',                flag: '\u{1F1F2}\u{1F1E6}' },
    MZ: { name: 'Mozambique',             flag: '\u{1F1F2}\u{1F1FF}' },
    NA: { name: 'Namibia',                flag: '\u{1F1F3}\u{1F1E6}' },
    NE: { name: 'Niger',                  flag: '\u{1F1F3}\u{1F1EA}' },
    NG: { name: 'Nigeria',                flag: '\u{1F1F3}\u{1F1EC}' },
    RW: { name: 'Rwanda',                 flag: '\u{1F1F7}\u{1F1FC}' },
    ST: { name: 'S\u00e3o Tom\u00e9 & Pr\u00edncipe', flag: '\u{1F1F8}\u{1F1F9}' },
    SN: { name: 'Senegal',                flag: '\u{1F1F8}\u{1F1F3}' },
    SC: { name: 'Seychelles',             flag: '\u{1F1F8}\u{1F1E8}' },
    SL: { name: 'Sierra Leone',           flag: '\u{1F1F8}\u{1F1F1}' },
    SO: { name: 'Somalia',                flag: '\u{1F1F8}\u{1F1F4}' },
    ZA: { name: 'South Africa',           flag: '\u{1F1FF}\u{1F1E6}' },
    SS: { name: 'South Sudan',            flag: '\u{1F1F8}\u{1F1F8}' },
    SD: { name: 'Sudan',                  flag: '\u{1F1F8}\u{1F1E9}' },
    TZ: { name: 'Tanzania',               flag: '\u{1F1F9}\u{1F1FF}' },
    TG: { name: 'Togo',                   flag: '\u{1F1F9}\u{1F1EC}' },
    TN: { name: 'Tunisia',                flag: '\u{1F1F9}\u{1F1F3}' },
    UG: { name: 'Uganda',                 flag: '\u{1F1FA}\u{1F1EC}' },
    ZM: { name: 'Zambia',                 flag: '\u{1F1FF}\u{1F1F2}' },
    ZW: { name: 'Zimbabwe',               flag: '\u{1F1FF}\u{1F1FC}' }
  };

  /* ── Simplified SVG path data (viewBox 0 0 600 700) ────── */
  /* Each path is a simplified outline positioned geographically */
  const PATHS = {
    MA: 'M120,80 L155,75 170,90 160,120 130,130 105,115 100,95Z',
    DZ: 'M170,90 L220,75 260,85 270,130 260,180 220,200 180,180 160,140 160,120Z',
    TN: 'M220,70 L240,65 245,85 235,100 220,95Z',
    LY: 'M260,85 L310,80 350,95 355,145 340,185 300,195 270,180 260,180 270,130Z',
    EG: 'M355,95 L395,85 410,100 405,155 380,175 355,175 355,145Z',
    MR: 'M85,170 L130,155 155,175 155,215 130,235 95,225 80,200Z',
    ML: 'M130,170 L180,180 190,200 175,235 145,250 120,240 115,215 130,200Z',
    NE: 'M190,180 L240,175 270,180 275,210 260,240 230,250 200,240 190,220Z',
    TD: 'M275,180 L310,185 325,210 320,250 300,265 275,250 265,220Z',
    SD: 'M340,185 L380,175 400,200 395,250 375,275 350,275 330,260 325,230Z',
    ER: 'M400,195 L425,185 440,200 425,215 410,210Z',
    DJ: 'M435,220 L445,215 448,228 438,232Z',
    ET: 'M395,220 L435,215 445,235 440,265 415,280 385,275 375,255Z',
    SO: 'M445,230 L465,215 480,250 470,300 450,330 435,290 440,260Z',
    SN: 'M62,225 L90,220 100,235 85,245 65,240Z',
    GM: 'M65,237 L90,234 92,240 65,242Z',
    GW: 'M60,248 L78,244 82,255 68,258Z',
    GN: 'M72,255 L100,240 115,248 115,268 95,278 75,270Z',
    SL: 'M72,272 L90,265 95,280 82,290Z',
    LR: 'M85,285 L100,278 110,290 100,305 85,300Z',
    CI: 'M100,260 L130,252 140,270 135,295 115,305 100,295Z',
    BF: 'M130,228 L165,220 175,235 165,255 140,260 125,250Z',
    GH: 'M120,265 L140,260 145,290 130,305 118,300Z',
    TG: 'M148,265 L155,262 158,295 150,300 146,285Z',
    BJ: 'M160,258 L175,255 178,240 185,235 188,260 175,285 162,295 158,275Z',
    NG: 'M155,265 L190,255 215,260 230,250 245,265 240,290 225,310 200,315 175,305 162,290Z',
    CM: 'M225,280 L250,270 265,285 270,310 255,325 235,320 225,300Z',
    GQ: 'M220,325 L235,320 238,330 225,333Z',
    GA: 'M225,330 L245,325 255,340 250,360 235,365 225,350Z',
    CG: 'M255,325 L275,315 285,335 280,365 260,375 250,360 255,340Z',
    CD: 'M280,305 L320,295 345,310 355,340 345,375 325,395 300,400 280,385 270,365 275,340 280,320Z',
    CF: 'M265,265 L300,260 330,270 340,285 325,300 295,300 275,290Z',
    SS: 'M340,280 L370,275 380,295 370,315 350,320 335,305Z',
    UG: 'M375,310 L395,305 400,325 390,340 375,338 370,320Z',
    KE: 'M395,300 L420,290 435,310 430,345 410,360 390,350 390,330Z',
    RW: 'M370,340 L385,338 388,350 375,355Z',
    BI: 'M372,355 L385,352 388,365 375,368Z',
    TZ: 'M385,350 L415,355 425,380 415,410 395,415 380,400 375,375Z',
    AO: 'M240,375 L275,370 285,390 280,430 255,440 235,425 230,400Z',
    ZM: 'M300,385 L340,380 355,400 345,430 320,440 300,430 295,410Z',
    MW: 'M365,380 L378,375 382,405 375,420 365,410Z',
    MZ: 'M375,395 L400,385 415,410 410,460 390,480 370,470 365,440 370,420Z',
    NA: 'M235,440 L270,435 280,460 275,500 255,515 235,505 230,470Z',
    BW: 'M275,450 L305,440 315,465 305,490 285,498 275,480Z',
    ZW: 'M310,435 L340,430 355,450 345,475 320,480 310,465Z',
    ZA: 'M260,500 L310,490 340,500 360,480 375,490 370,530 340,555 310,560 280,545 255,525Z',
    LS: 'M315,530 L330,525 335,540 320,545Z',
    SZ: 'M355,490 L365,488 367,500 357,502Z',
    MG: 'M430,430 L450,420 460,445 458,490 445,510 430,500 425,465Z',
    KM: 'M415,415 L422,412 424,418 417,420Z',
    MU: 'M478,478 L485,475 487,482 480,484Z',
    SC: 'M468,390 L474,387 476,393 470,395Z',
    CV: 'M30,210 L38,207 40,215 33,217Z',
    ST: 'M200,330 L208,327 210,335 203,337Z'
  };

  /* ── Color scale utilities ─────────────────────────────── */
  function lerp(a, b, t) { return a + (b - a) * t; }

  function colorScale(value, min, max, scale) {
    if (max === min) return '#E2E8F0';
    const t = Math.max(0, Math.min(1, (value - min) / (max - min)));
    if (scale === 'green-red') {
      const r = Math.round(lerp(34, 239, t));
      const g = Math.round(lerp(197, 68, t));
      const b = Math.round(lerp(94, 68, t));
      return `rgb(${r},${g},${b})`;
    }
    // Default: blue-yellow-red
    if (t < 0.5) {
      const st = t * 2;
      const r = Math.round(lerp(0, 245, st));
      const g = Math.round(lerp(122, 166, st));
      const b = Math.round(lerp(255, 35, st));
      return `rgb(${r},${g},${b})`;
    }
    const st = (t - 0.5) * 2;
    const r = Math.round(lerp(245, 239, st));
    const g = Math.round(lerp(166, 68, st));
    const b = Math.round(lerp(35, 68, st));
    return `rgb(${r},${g},${b})`;
  }

  /* ── Styles ────────────────────────────────────────────── */
  const CSS = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=Instrument+Serif&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    :host{display:block;position:relative;width:100%;font-family:'DM Sans',system-ui,sans-serif}
    .map-wrap{position:relative;width:100%;max-width:600px;margin:0 auto}
    svg{width:100%;height:auto;display:block}
    .country{
      fill:#E2E8F0;stroke:#fff;stroke-width:0.5;cursor:pointer;
      transition:fill .15s ease,opacity .15s ease;
    }
    .country:hover{opacity:0.85;filter:brightness(1.15)}
    .country.selected{
      stroke:#007AFF;stroke-width:2;
      filter:drop-shadow(0 0 4px rgba(0,122,255,0.5));
    }
    .tooltip{
      position:absolute;pointer-events:none;z-index:50;
      background:#0A1628;color:#fff;padding:8px 12px;border-radius:8px;
      font-size:0.8rem;line-height:1.4;white-space:nowrap;
      box-shadow:0 4px 12px rgba(0,0,0,0.25);
      opacity:0;transition:opacity .15s ease;
      transform:translate(-50%,-100%);margin-top:-10px;
    }
    .tooltip.visible{opacity:1}
    .tooltip-flag{font-size:1.1rem;margin-right:4px}
    .tooltip-name{font-weight:600}
    .tooltip-value{color:#80BFFF;margin-left:6px}
    .legend{
      display:flex;align-items:center;gap:8px;margin-top:12px;
      font-size:0.75rem;color:#64748b;justify-content:center;
    }
    .legend-bar{
      width:160px;height:10px;border-radius:5px;
      background:linear-gradient(to right,#007AFF,#F5A623,#ef4444);
    }
    .legend.green-red .legend-bar{
      background:linear-gradient(to right,#22c55e,#ef4444);
    }
  `;

  class AfroMap extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this._data = {};
      this._min = 0;
      this._max = 0;
      this._selected = null;
    }

    connectedCallback() {
      this._render();
      this._bind();
    }

    static get observedAttributes() { return ['data-metric', 'data-colorscale', 'data-unit']; }
    attributeChangedCallback() { if (this.shadowRoot.querySelector('svg')) this._applyColors(); }

    get _scale() { return this.getAttribute('data-colorscale') || 'blue-red'; }
    get _unit() { return this.getAttribute('data-unit') || ''; }

    _render() {
      let paths = '';
      for (const [code, d] of Object.entries(PATHS)) {
        const meta = COUNTRIES[code] || { name: code, flag: '' };
        paths += `<path class="country" id="${code}" d="${d}" data-name="${meta.name}" data-flag="${meta.flag}"/>`;
      }
      this.shadowRoot.innerHTML = `
        <style>${CSS}</style>
        <div class="map-wrap">
          <svg viewBox="0 0 600 700" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Map of Africa">
            ${paths}
          </svg>
          <div class="tooltip" id="tip">
            <span class="tooltip-flag" id="tipFlag"></span>
            <span class="tooltip-name" id="tipName"></span>
            <span class="tooltip-value" id="tipVal"></span>
          </div>
          <div class="legend ${this._scale}" id="legend" style="display:none">
            <span id="legendMin"></span>
            <div class="legend-bar"></div>
            <span id="legendMax"></span>
          </div>
        </div>
      `;
    }

    _bind() {
      const svg = this.shadowRoot.querySelector('svg');
      const tip = this.shadowRoot.getElementById('tip');
      const tipFlag = this.shadowRoot.getElementById('tipFlag');
      const tipName = this.shadowRoot.getElementById('tipName');
      const tipVal = this.shadowRoot.getElementById('tipVal');
      const wrap = this.shadowRoot.querySelector('.map-wrap');

      svg.addEventListener('mousemove', (e) => {
        const path = e.target.closest('.country');
        if (!path) { tip.classList.remove('visible'); return; }
        const code = path.id;
        const meta = COUNTRIES[code] || {};
        const d = this._data[code];
        tipFlag.textContent = meta.flag || '';
        tipName.textContent = meta.name || code;
        tipVal.textContent = d ? `${d.label || d.value}${this._unit ? ' ' + this._unit : ''}` : '';
        const rect = wrap.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        tip.style.left = x + 'px';
        tip.style.top = y + 'px';
        tip.classList.add('visible');
      });

      svg.addEventListener('mouseleave', () => { tip.classList.remove('visible'); });

      svg.addEventListener('click', (e) => {
        const path = e.target.closest('.country');
        if (!path) return;
        const code = path.id;
        const meta = COUNTRIES[code] || {};
        const d = this._data[code];
        // Remove old selection
        const old = svg.querySelector('.selected');
        if (old) old.classList.remove('selected');
        path.classList.add('selected');
        this._selected = code;
        this.dispatchEvent(new CustomEvent('country-click', {
          bubbles: true, composed: true,
          detail: { code, name: meta.name || code, value: d ? d.value : null }
        }));
      });
    }

    /**
     * Set data for all countries
     * @param {Array<{code:string, value:number, label?:string}>} arr
     */
    setData(arr) {
      this._data = {};
      let min = Infinity, max = -Infinity;
      for (const item of arr) {
        this._data[item.code] = item;
        if (typeof item.value === 'number') {
          if (item.value < min) min = item.value;
          if (item.value > max) max = item.value;
        }
      }
      this._min = min === Infinity ? 0 : min;
      this._max = max === -Infinity ? 0 : max;
      this._applyColors();
    }

    _applyColors() {
      const svg = this.shadowRoot.querySelector('svg');
      if (!svg) return;
      for (const path of svg.querySelectorAll('.country')) {
        const d = this._data[path.id];
        if (d && typeof d.value === 'number') {
          path.style.fill = colorScale(d.value, this._min, this._max, this._scale);
        } else {
          path.style.fill = '#E2E8F0';
        }
      }
      // Update legend
      const legend = this.shadowRoot.getElementById('legend');
      if (this._min !== this._max) {
        legend.style.display = 'flex';
        legend.className = 'legend ' + this._scale;
        this.shadowRoot.getElementById('legendMin').textContent = this._min.toLocaleString() + (this._unit ? ' ' + this._unit : '');
        this.shadowRoot.getElementById('legendMax').textContent = this._max.toLocaleString() + (this._unit ? ' ' + this._unit : '');
      }
    }

    /**
     * Highlight a specific country
     * @param {string} code - ISO2 country code
     */
    highlightCountry(code) {
      const svg = this.shadowRoot.querySelector('svg');
      if (!svg) return;
      const old = svg.querySelector('.selected');
      if (old) old.classList.remove('selected');
      const el = svg.getElementById(code);
      if (el) {
        el.classList.add('selected');
        this._selected = code;
      }
    }
  }

  customElements.define('afro-map', AfroMap);
  window.AfroTools = window.AfroTools || {};
  window.AfroTools.AfroMap = AfroMap;
})();
