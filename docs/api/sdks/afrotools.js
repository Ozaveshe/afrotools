class AfroTools {
  constructor(apiKey, options = {}) {
    if (!apiKey) throw new Error('AfroTools: API key is required');
    this.apiKey = apiKey;
    this.baseURL = (options.baseURL || 'https://afrotools.com/api/v1').replace(/\/+$/, '');
    this.tax = {
      countries: () => this._get('/countries'),
      country: (country) => this._get('/tax/paye', { country }),
      calculate: (params) => this._post('/tax/paye', params),
      rates: (params = {}) => this._get('/tax/rates', params)
    };
    this.fx = {
      rates: (params = {}) => this._get('/fx/rates', params)
    };
    this.forex = this.fx;
    this.fuel = {
      prices: (params = {}) => this._get('/fuel/prices', typeof params === 'string' ? { country: params } : params)
    };
    this.countries = {
      list: () => this._get('/countries'),
      get: (code) => this._get('/countries', { code })
    };
  }

  async _get(path, params = {}) {
    const url = new URL(this.baseURL + path);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) url.searchParams.set(key, value);
    });
    const res = await fetch(url.toString(), { headers: { 'x-api-key': this.apiKey } });
    const data = await res.json();
    if (!res.ok) throw Object.assign(new Error(data.error || `API error ${res.status}`), { status: res.status, data });
    return data;
  }

  async _post(path, body) {
    const res = await fetch(this.baseURL + path, {
      method: 'POST',
      headers: { 'x-api-key': this.apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) throw Object.assign(new Error(data.error || `API error ${res.status}`), { status: res.status, data });
    return data;
  }
}

if (typeof module !== 'undefined' && module.exports) module.exports = AfroTools;
if (typeof window !== 'undefined') window.AfroTools = AfroTools;
