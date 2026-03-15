/**
 * AFROTOOLS RATE TICKER — Scrolling Forex Bar Web Component
 * =====================================================================
 * <afro-rate-ticker data-source="/data/forex/latest.json"></afro-rate-ticker>
 *
 * Displays a horizontally scrolling bar of 15 popular currency pairs
 * with rate and % change. Auto-scrolls, pauses on hover.
 * =====================================================================
 */
(function () {
  'use strict';

  /* ── Popular pairs to display ──────────────────────────── */
  const PAIRS = [
    { base: 'USD', quote: 'NGN', flag: '\u{1F1F3}\u{1F1EC}' },
    { base: 'USD', quote: 'KES', flag: '\u{1F1F0}\u{1F1EA}' },
    { base: 'USD', quote: 'ZAR', flag: '\u{1F1FF}\u{1F1E6}' },
    { base: 'USD', quote: 'GHS', flag: '\u{1F1EC}\u{1F1ED}' },
    { base: 'USD', quote: 'EGP', flag: '\u{1F1EA}\u{1F1EC}' },
    { base: 'EUR', quote: 'NGN', flag: '\u{1F1F3}\u{1F1EC}' },
    { base: 'GBP', quote: 'NGN', flag: '\u{1F1F3}\u{1F1EC}' },
    { base: 'USD', quote: 'TZS', flag: '\u{1F1F9}\u{1F1FF}' },
    { base: 'USD', quote: 'UGX', flag: '\u{1F1FA}\u{1F1EC}' },
    { base: 'USD', quote: 'RWF', flag: '\u{1F1F7}\u{1F1FC}' },
    { base: 'USD', quote: 'ETB', flag: '\u{1F1EA}\u{1F1F9}' },
    { base: 'USD', quote: 'XOF', flag: '\u{1F1F8}\u{1F1F3}' },
    { base: 'USD', quote: 'MAD', flag: '\u{1F1F2}\u{1F1E6}' },
    { base: 'BTC', quote: 'USD', flag: '\u20BF' },
    { base: 'ETH', quote: 'USD', flag: '\u039E' }
  ];

  const CSS = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    :host{
      display:block;font-family:'DM Sans',system-ui,sans-serif;
      height:36px;overflow:hidden;
      background:#0A1628;border-bottom:1px solid rgba(255,255,255,0.06);
    }
    .ticker-wrap{
      position:relative;width:100%;height:36px;overflow:hidden;
    }
    .ticker-track{
      display:flex;align-items:center;height:36px;
      width:max-content;
      animation:scroll-left var(--duration, 40s) linear infinite;
    }
    .ticker-track:hover{
      animation-play-state:paused;
    }
    @keyframes scroll-left{
      0%{transform:translateX(0)}
      100%{transform:translateX(-50%)}
    }
    .pair{
      display:inline-flex;align-items:center;gap:6px;
      padding:0 18px;white-space:nowrap;
      font-size:0.75rem;font-weight:500;color:rgba(255,255,255,0.8);
      border-right:1px solid rgba(255,255,255,0.06);
      height:36px;
    }
    .pair-flag{font-size:0.8rem}
    .pair-label{font-weight:600;color:#fff;letter-spacing:0.02em}
    .pair-rate{color:rgba(255,255,255,0.6);font-variant-numeric:tabular-nums}
    .pair-change{
      font-size:0.7rem;font-weight:700;padding:2px 6px;border-radius:4px;
      font-variant-numeric:tabular-nums;
    }
    .pair-change.up{color:#80BFFF;background:rgba(0,122,255,0.12)}
    .pair-change.down{color:#ef4444;background:rgba(239,68,68,0.1)}
    .pair-change.flat{color:rgba(255,255,255,0.4);background:rgba(255,255,255,0.05)}
    .loading{
      display:flex;align-items:center;justify-content:center;
      height:36px;color:rgba(255,255,255,0.4);font-size:0.75rem;
    }
    .dot{
      width:4px;height:4px;border-radius:50%;margin-right:6px;flex-shrink:0;
    }
    .dot.up{background:#007AFF}
    .dot.down{background:#ef4444}
    .dot.flat{background:rgba(255,255,255,0.3)}
  `;

  class AfroRateTicker extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this._liveData = null;
      this._rates = {};
    }

    connectedCallback() {
      this.shadowRoot.innerHTML = `<style>${CSS}</style><div class="loading">Loading rates\u2026</div>`;
      this._initData();
    }

    disconnectedCallback() {
      if (this._liveData && this._liveData.stop) this._liveData.stop();
    }

    _initData() {
      const src = this.getAttribute('data-source') || '/data/forex/latest.json';

      // If AfroTools.LiveData is available, use it
      if (window.AfroTools && window.AfroTools.LiveData) {
        this._liveData = new window.AfroTools.LiveData(src, {
          refreshInterval: 5 * 60 * 1000,
          cacheKey: 'afro-ticker-rates',
          cacheTTL: 10 * 60 * 1000,
          onUpdate: (data) => this._handleData(data),
          onError: () => this._renderFallback()
        });
        this._liveData.start();
      } else {
        // Standalone fetch
        this._fetchData(src);
      }
    }

    async _fetchData(url) {
      try {
        const resp = await fetch(url, { cache: 'no-cache' });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();
        this._handleData(data);
      } catch (e) {
        this._renderFallback();
      }
    }

    _handleData(data) {
      // Normalize: support {rates: {NGN: 1580}} or {data: [{pair, rate, change}]}
      if (data && data.rates) {
        this._rates = data.rates;
      } else if (data && Array.isArray(data.data)) {
        this._rates = {};
        for (const item of data.data) {
          if (item.pair) this._rates[item.pair] = item;
        }
      } else if (data && typeof data === 'object') {
        this._rates = data;
      }
      this._renderTicker();
    }

    _renderFallback() {
      // Show pairs with placeholder dashes
      this._rates = {};
      this._renderTicker();
    }

    _renderTicker() {
      const items = PAIRS.map(p => {
        const pairKey = `${p.base}/${p.quote}`;
        const altKey = p.quote; // For {rates: {NGN: 1580}} format
        let rate = '--';
        let change = 0;
        let changeStr = '0.00%';

        // Try to find rate in data
        const entry = this._rates[pairKey] || this._rates[altKey];
        if (entry && typeof entry === 'object') {
          rate = entry.rate || entry.value || entry.price || '--';
          change = entry.change || entry.change_pct || entry.pct || 0;
        } else if (typeof entry === 'number') {
          rate = entry;
        }

        if (typeof rate === 'number') {
          rate = rate >= 1000 ? rate.toLocaleString(undefined, { maximumFractionDigits: 2 })
            : rate >= 1 ? rate.toFixed(2)
            : rate.toFixed(4);
        }

        const dir = change > 0 ? 'up' : change < 0 ? 'down' : 'flat';
        const arrow = change > 0 ? '\u25B2' : change < 0 ? '\u25BC' : '';
        changeStr = `${arrow}${Math.abs(change).toFixed(2)}%`;

        return `
          <div class="pair">
            <span class="dot ${dir}"></span>
            <span class="pair-flag">${p.flag}</span>
            <span class="pair-label">${pairKey}</span>
            <span class="pair-rate">${rate}</span>
            <span class="pair-change ${dir}">${changeStr}</span>
          </div>`;
      }).join('');

      // Duplicate for seamless infinite scroll
      const track = items + items;

      // Adjust speed based on content width (~15 pairs * 180px = 2700px)
      const duration = PAIRS.length * 3; // ~45s for smooth scroll

      this.shadowRoot.innerHTML = `
        <style>${CSS}</style>
        <div class="ticker-wrap">
          <div class="ticker-track" style="--duration:${duration}s">
            ${track}
          </div>
        </div>
      `;
    }
  }

  customElements.define('afro-rate-ticker', AfroRateTicker);
  window.AfroTools = window.AfroTools || {};
  window.AfroTools.AfroRateTicker = AfroRateTicker;
})();
