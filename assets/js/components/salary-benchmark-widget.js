/**
 * <salary-benchmark> — Web Component
 * Shows how a user's salary compares to aggregated benchmarks.
 *
 * Attributes:
 *   country-code (required) — e.g. "NG"
 *   currency     (required) — e.g. "NGN"
 *   user-gross   (set after calc) — monthly gross
 *   user-net     (set after calc) — monthly net
 */
(function () {
  'use strict';

  // Cache benchmark data per country (avoids refetching on every calc)
  var _cache = {};

  class SalaryBenchmark extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this._data = null;
    }

    static get observedAttributes() {
      return ['user-gross', 'user-net'];
    }

    connectedCallback() {
      this._render();
      this._fetchBenchmark();
    }

    attributeChangedCallback(name) {
      if (name === 'user-gross' || name === 'user-net') {
        this._render();
      }
    }

    async _fetchBenchmark() {
      var cc = this.getAttribute('country-code');
      if (!cc) return;

      // Use cache if available
      if (_cache[cc]) {
        this._data = _cache[cc];
        this._render();
        return;
      }

      try {
        var res = await fetch('/api/salary-benchmarks?country=' + cc);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        var data = await res.json();
        _cache[cc] = data;
        this._data = data;
        this._render();
      } catch (err) {
        console.warn('[salary-benchmark] Fetch failed:', err.message);
        this._data = { insufficient_data: true, sample_size: 0 };
        this._render();
      }
    }

    /**
     * Estimate percentile using linear interpolation.
     * Assumes roughly normal distribution between p25 and p75.
     */
    _estimatePercentile(userVal, p25, median, p75) {
      if (!userVal || !p25 || !median || !p75) return null;
      if (userVal <= p25) {
        return Math.max(1, Math.round(25 * (userVal / p25)));
      }
      if (userVal <= median) {
        return Math.round(25 + 25 * ((userVal - p25) / (median - p25)));
      }
      if (userVal <= p75) {
        return Math.round(50 + 25 * ((userVal - median) / (p75 - median)));
      }
      // Above p75
      return Math.min(99, Math.round(75 + 25 * Math.min(1, (userVal - p75) / (p75 - median))));
    }

    _formatCurrency(val) {
      var currency = this.getAttribute('currency') || '';
      var symbol = { NGN: '₦', KES: 'KSh', ZAR: 'R', GHS: '₵', EGP: 'E£', UGX: 'USh', TZS: 'TSh', RWF: 'RF', ETB: 'Br', XOF: 'CFA', XAF: 'FCFA', MAD: 'MAD', MUR: '₨' }[currency] || currency + ' ';
      if (val >= 1000000) return symbol + (val / 1000000).toFixed(1) + 'M';
      if (val >= 1000) return symbol + Math.round(val / 1000) + 'k';
      return symbol + Math.round(val).toLocaleString();
    }

    _render() {
      var userGross = parseFloat(this.getAttribute('user-gross'));
      var data = this._data;
      var hasUser = userGross > 0;

      // Not yet loaded
      if (!data && !hasUser) {
        this.shadowRoot.innerHTML = '';
        return;
      }

      // Insufficient data state
      if (data && data.insufficient_data) {
        this.shadowRoot.innerHTML = this._styles() + '\n' +
          '<div class="bm-card coming-soon">' +
            '<div class="bm-header">' +
              '<span class="bm-icon">📊</span>' +
              '<span class="bm-title">Salary Benchmark — Coming Soon</span>' +
            '</div>' +
            '<p class="bm-desc">We need more data for your country. Your calculation helps build this!</p>' +
            '<p class="bm-sample">Currently: ' + (data.sample_size || 0) + ' data points (need 10+)</p>' +
          '</div>';
        return;
      }

      // No data yet, still loading
      if (!data) {
        this.shadowRoot.innerHTML = this._styles() + '\n' +
          '<div class="bm-card loading">' +
            '<div class="bm-header">' +
              '<span class="bm-icon">📊</span>' +
              '<span class="bm-title">Loading benchmark data…</span>' +
            '</div>' +
          '</div>';
        return;
      }

      // Has data + user input — full display
      if (hasUser && data.gross) {
        var pctile = this._estimatePercentile(userGross, data.gross.p25, data.gross.median, data.gross.p75);
        var cc = this.getAttribute('country-code') || '';
        var countryNames = { NG: 'Nigeria', KE: 'Kenya', ZA: 'South Africa', GH: 'Ghana', EG: 'Egypt', TZ: 'Tanzania', UG: 'Uganda', RW: 'Rwanda', ET: 'Ethiopia', CM: 'Cameroon', SN: 'Senegal', CI: 'Ivory Coast', MA: 'Morocco', TN: 'Tunisia' };
        var countryName = countryNames[cc] || cc;

        // Calculate user position on the bar (0-100%)
        var barMin = data.gross.p25 * 0.5;
        var barMax = data.gross.p75 * 1.5;
        var userPos = Math.max(2, Math.min(98, ((userGross - barMin) / (barMax - barMin)) * 100));
        var p25Pos = Math.max(0, Math.min(100, ((data.gross.p25 - barMin) / (barMax - barMin)) * 100));
        var medPos = Math.max(0, Math.min(100, ((data.gross.median - barMin) / (barMax - barMin)) * 100));
        var p75Pos = Math.max(0, Math.min(100, ((data.gross.p75 - barMin) / (barMax - barMin)) * 100));

        this.shadowRoot.innerHTML = this._styles() + '\n' +
          '<div class="bm-card">' +
            '<div class="bm-header">' +
              '<span class="bm-icon">📊</span>' +
              '<span class="bm-title">How You Compare</span>' +
            '</div>' +
            '<p class="bm-user-gross">Your gross: ' + this._formatCurrency(userGross) + '/mo</p>' +
            '<p class="bm-rank">You earn more than <strong>' + pctile + '%</strong> of earners in ' + countryName + '</p>' +
            '<div class="bm-bar-wrap">' +
              '<div class="bm-bar">' +
                '<div class="bm-bar-fill" style="width:' + pctile + '%"></div>' +
                '<div class="bm-marker bm-p25" style="left:' + p25Pos + '%"><span class="bm-marker-label">p25</span></div>' +
                '<div class="bm-marker bm-med" style="left:' + medPos + '%"><span class="bm-marker-label">median</span></div>' +
                '<div class="bm-marker bm-p75" style="left:' + p75Pos + '%"><span class="bm-marker-label">p75</span></div>' +
                '<div class="bm-user-marker" style="left:' + userPos + '%"><span class="bm-user-arrow">▲</span><span class="bm-user-label">YOU</span></div>' +
              '</div>' +
              '<div class="bm-labels">' +
                '<span style="left:' + p25Pos + '%">' + this._formatCurrency(data.gross.p25) + '</span>' +
                '<span style="left:' + medPos + '%">' + this._formatCurrency(data.gross.median) + '</span>' +
                '<span style="left:' + p75Pos + '%">' + this._formatCurrency(data.gross.p75) + '</span>' +
              '</div>' +
            '</div>' +
            '<div class="bm-footer">' +
              '<span class="bm-sample">Based on ' + data.sample_size.toLocaleString() + ' calculations</span>' +
            '</div>' +
          '</div>';
        return;
      }

      // Data loaded but no user calculation yet — show teaser
      this.shadowRoot.innerHTML = this._styles() + '\n' +
        '<div class="bm-card teaser">' +
          '<div class="bm-header">' +
            '<span class="bm-icon">📊</span>' +
            '<span class="bm-title">Salary Benchmark Available</span>' +
          '</div>' +
          '<p class="bm-desc">Calculate your salary above to see how you compare to ' + (data.sample_size || 0).toLocaleString() + ' earners in your country.</p>' +
        '</div>';
    }

    _styles() {
      return '<style>' +
        ':host{display:block;margin-top:16px;font-family:"DM Sans",system-ui,sans-serif}' +
        '.bm-card{background:#eff6ff;border:1px solid #BFDBFE;border-radius:12px;padding:20px 22px;max-width:100%}' +
        '.bm-card.coming-soon{background:#fefce8;border-color:#fde68a}' +
        '.bm-card.loading{background:#f8fafc;border-color:#e2e8f0}' +
        '.bm-card.teaser{background:#f8fafc;border-color:#e2e8f0}' +
        '.bm-header{display:flex;align-items:center;gap:8px;margin-bottom:12px}' +
        '.bm-icon{font-size:1.15rem}' +
        '.bm-title{font-weight:700;font-size:0.92rem;color:#1e293b;letter-spacing:-0.01em}' +
        '.bm-user-gross{font-size:0.85rem;color:#334155;margin:0 0 4px}' +
        '.bm-rank{font-size:0.85rem;color:#475569;margin:0 0 16px;line-height:1.5}' +
        '.bm-rank strong{color:#007AFF;font-weight:700}' +
        '.bm-bar-wrap{position:relative;margin-bottom:30px}' +
        '.bm-bar{position:relative;height:10px;background:#e2e8f0;border-radius:6px;overflow:visible}' +
        '.bm-bar-fill{height:100%;background:linear-gradient(90deg,#60B5FF,#007AFF);border-radius:6px;transition:width 0.6s ease}' +
        '.bm-marker{position:absolute;top:0;width:2px;height:10px;background:#94a3b8;transform:translateX(-1px)}' +
        '.bm-marker-label{position:absolute;top:-16px;left:50%;transform:translateX(-50%);font-size:0.6rem;color:#94a3b8;text-transform:uppercase;letter-spacing:0.04em;white-space:nowrap}' +
        '.bm-user-marker{position:absolute;top:14px;transform:translateX(-50%);text-align:center}' +
        '.bm-user-arrow{color:#007AFF;font-size:0.7rem;display:block;line-height:1}' +
        '.bm-user-label{font-size:0.6rem;font-weight:800;color:#007AFF;letter-spacing:0.08em}' +
        '.bm-labels{position:relative;height:18px;margin-top:4px}' +
        '.bm-labels span{position:absolute;transform:translateX(-50%);font-size:0.65rem;color:#64748b;white-space:nowrap}' +
        '.bm-footer{display:flex;align-items:center;justify-content:space-between;gap:8px}' +
        '.bm-sample{font-size:0.72rem;color:#94a3b8}' +
        '.bm-desc{font-size:0.82rem;color:#475569;margin:0;line-height:1.6}' +
        '@media(max-width:640px){.bm-card{padding:16px 14px}.bm-marker-label{font-size:0.55rem}.bm-labels span{font-size:0.58rem}}' +
        '@media(prefers-color-scheme:dark){.bm-card{background:#131D2E;border-color:#1E2D40}.bm-title{color:#E2E8F0}.bm-user-gross,.bm-rank{color:#C9D6E8}.bm-bar{background:#1E2D40}.bm-labels span{color:#8B9CB8}.bm-card.coming-soon{background:#1E2D40;border-color:#2A3D55}.bm-card.loading,.bm-card.teaser{background:#131D2E;border-color:#1E2D40}.bm-desc{color:#94A3B8}}' +
      '</style>';
    }
  }

  customElements.define('salary-benchmark', SalaryBenchmark);
})();
