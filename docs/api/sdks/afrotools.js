/**
 * AfroTools API Client — JavaScript/Node.js
 *
 * Usage (Browser):
 *   <script src="https://afrotools.com/docs/api/sdks/afrotools.js"></script>
 *   const client = new AfroTools('afro_your_api_key');
 *   const data = await client.tax.countries();
 *
 * Usage (Node.js):
 *   const AfroTools = require('./afrotools');
 *   const client = new AfroTools('afro_your_api_key');
 *   const data = await client.tax.calculate({ country: 'NG', income: 5000000 });
 *
 * @version 1.0.0
 * @license MIT
 */
class AfroTools {
  /**
   * Create an AfroTools API client.
   * @param {string} apiKey - Your AfroTools API key (starts with afro_)
   * @param {Object} [options]
   * @param {string} [options.baseURL=https://afrotools.com/api] - API base URL
   */
  constructor(apiKey, options = {}) {
    if (!apiKey) throw new Error('AfroTools: API key is required');
    this.apiKey = apiKey;
    this.baseURL = (options.baseURL || 'https://afrotools.com/api').replace(/\/+$/, '');

    this.tax = {
      /** List all supported African countries with tax info */
      countries: () => this._get('/tax'),
      /** Get tax info for a specific country */
      country: (code) => this._get(`/tax?country=${encodeURIComponent(code)}`),
      /** Calculate income tax (PAYE) */
      calculate: (params) => this._post('/tax', params),
    };

    this.forex = {
      /** Get latest exchange rates */
      latest: (params) => this._get('/forex', params),
    };

    this.fuel = {
      /** Get fuel prices, optionally filtered by country */
      prices: (country) => this._get(`/fuel${country ? '?country=' + encodeURIComponent(country) : ''}`),
    };

    this.rates = {
      /** Get all central bank interest rates */
      all: () => this._get('/rates'),
      /** Get interest rate for a specific country */
      country: (code) => this._get(`/rates?country=${encodeURIComponent(code)}`),
    };

    this.vat = {
      /** Calculate VAT (add or extract) */
      calculate: (params) => this._post('/vat', params),
      /** Get VAT rates for all countries */
      rates: () => this._get('/vat'),
    };
  }

  /**
   * @private
   */
  async _get(path, params = {}) {
    const url = new URL(this.baseURL + path);
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) url.searchParams.set(k, v);
    });
    const res = await fetch(url.toString(), {
      headers: { 'x-api-key': this.apiKey }
    });
    const data = await res.json();
    if (!res.ok) {
      throw Object.assign(new Error(data.error || `API error ${res.status}`), {
        status: res.status, data
      });
    }
    return data;
  }

  /**
   * @private
   */
  async _post(path, body) {
    const res = await fetch(this.baseURL + path, {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      throw Object.assign(new Error(data.error || `API error ${res.status}`), {
        status: res.status, data
      });
    }
    return data;
  }
}

// Universal module export
if (typeof module !== 'undefined' && module.exports) module.exports = AfroTools;
if (typeof window !== 'undefined') window.AfroTools = AfroTools;
