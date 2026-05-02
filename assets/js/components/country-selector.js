(function(window, document) {
  'use strict';

  var STORAGE_KEY = 'afrotools.countryContext.v1';
  var LEGACY_KEY = 'afro_selected_country';
  var SYNC_FLAG_KEY = 'afrotools.countryContext.lastProfileSync';

  var COUNTRIES = [
    { code: 'DZ', name: 'Algeria', slug: 'algeria', region: 'North Africa', currency: 'DZD', currencySymbol: 'DA', languages: 'Arabic, Tamazight, French' },
    { code: 'AO', name: 'Angola', slug: 'angola', region: 'Southern Africa', currency: 'AOA', currencySymbol: 'Kz', languages: 'Portuguese' },
    { code: 'BJ', name: 'Benin', slug: 'benin', region: 'West Africa', currency: 'XOF', currencySymbol: 'CFA', languages: 'French, Fon, Yoruba' },
    { code: 'BW', name: 'Botswana', slug: 'botswana', region: 'Southern Africa', currency: 'BWP', currencySymbol: 'P', languages: 'English, Setswana' },
    { code: 'BF', name: 'Burkina Faso', slug: 'burkina-faso', region: 'West Africa', currency: 'XOF', currencySymbol: 'CFA', languages: 'French, Moore, Dioula' },
    { code: 'BI', name: 'Burundi', slug: 'burundi', region: 'East Africa', currency: 'BIF', currencySymbol: 'FBu', languages: 'Kirundi, French, English' },
    { code: 'CV', name: 'Cabo Verde', slug: 'cabo-verde', region: 'West Africa', currency: 'CVE', currencySymbol: 'CVE', languages: 'Portuguese, Kriolu' },
    { code: 'CM', name: 'Cameroon', slug: 'cameroon', region: 'Central Africa', currency: 'XAF', currencySymbol: 'FCFA', languages: 'English, French' },
    { code: 'CF', name: 'Central African Republic', slug: 'central-african-republic', region: 'Central Africa', currency: 'XAF', currencySymbol: 'FCFA', languages: 'French, Sango' },
    { code: 'TD', name: 'Chad', slug: 'chad', region: 'Central Africa', currency: 'XAF', currencySymbol: 'FCFA', languages: 'French, Arabic' },
    { code: 'KM', name: 'Comoros', slug: 'comoros', region: 'Indian Ocean', currency: 'KMF', currencySymbol: 'CF', languages: 'Comorian, Arabic, French' },
    { code: 'CG', name: 'Congo', slug: 'congo-brazzaville', region: 'Central Africa', currency: 'XAF', currencySymbol: 'FCFA', languages: 'French, Lingala, Kituba' },
    { code: 'CD', name: 'DR Congo', slug: 'dr-congo', region: 'Central Africa', currency: 'CDF', currencySymbol: 'FC', languages: 'French, Lingala, Swahili' },
    { code: 'CI', name: "Cote d'Ivoire", slug: 'cote-d-ivoire', region: 'West Africa', currency: 'XOF', currencySymbol: 'CFA', languages: 'French' },
    { code: 'DJ', name: 'Djibouti', slug: 'djibouti', region: 'East Africa', currency: 'DJF', currencySymbol: 'Fdj', languages: 'French, Arabic, Somali, Afar' },
    { code: 'EG', name: 'Egypt', slug: 'egypt', region: 'North Africa', currency: 'EGP', currencySymbol: 'EGP', languages: 'Arabic' },
    { code: 'GQ', name: 'Equatorial Guinea', slug: 'equatorial-guinea', region: 'Central Africa', currency: 'XAF', currencySymbol: 'FCFA', languages: 'Spanish, French, Portuguese' },
    { code: 'ER', name: 'Eritrea', slug: 'eritrea', region: 'East Africa', currency: 'ERN', currencySymbol: 'Nfk', languages: 'Tigrinya, Arabic, English' },
    { code: 'SZ', name: 'Eswatini', slug: 'eswatini', region: 'Southern Africa', currency: 'SZL', currencySymbol: 'E', languages: 'English, siSwati' },
    { code: 'ET', name: 'Ethiopia', slug: 'ethiopia', region: 'East Africa', currency: 'ETB', currencySymbol: 'Br', languages: 'Amharic, Oromo, Tigrinya' },
    { code: 'GA', name: 'Gabon', slug: 'gabon', region: 'Central Africa', currency: 'XAF', currencySymbol: 'FCFA', languages: 'French' },
    { code: 'GM', name: 'Gambia', slug: 'gambia', region: 'West Africa', currency: 'GMD', currencySymbol: 'D', languages: 'English, Mandinka, Wolof' },
    { code: 'GH', name: 'Ghana', slug: 'ghana', region: 'West Africa', currency: 'GHS', currencySymbol: 'GHc', languages: 'English, Akan, Ewe, Ga' },
    { code: 'GN', name: 'Guinea', slug: 'guinea', region: 'West Africa', currency: 'GNF', currencySymbol: 'FG', languages: 'French, Fulani, Malinke, Susu' },
    { code: 'GW', name: 'Guinea-Bissau', slug: 'guinea-bissau', region: 'West Africa', currency: 'XOF', currencySymbol: 'CFA', languages: 'Portuguese, Creole' },
    { code: 'KE', name: 'Kenya', slug: 'kenya', region: 'East Africa', currency: 'KES', currencySymbol: 'KSh', languages: 'English, Swahili' },
    { code: 'LS', name: 'Lesotho', slug: 'lesotho', region: 'Southern Africa', currency: 'LSL', currencySymbol: 'L', languages: 'English, Sesotho' },
    { code: 'LR', name: 'Liberia', slug: 'liberia', region: 'West Africa', currency: 'LRD', currencySymbol: 'L$', languages: 'English' },
    { code: 'LY', name: 'Libya', slug: 'libya', region: 'North Africa', currency: 'LYD', currencySymbol: 'LD', languages: 'Arabic' },
    { code: 'MG', name: 'Madagascar', slug: 'madagascar', region: 'Indian Ocean', currency: 'MGA', currencySymbol: 'Ar', languages: 'Malagasy, French' },
    { code: 'MW', name: 'Malawi', slug: 'malawi', region: 'Southern Africa', currency: 'MWK', currencySymbol: 'MK', languages: 'English, Chichewa' },
    { code: 'ML', name: 'Mali', slug: 'mali', region: 'West Africa', currency: 'XOF', currencySymbol: 'CFA', languages: 'French, Bambara' },
    { code: 'MR', name: 'Mauritania', slug: 'mauritania', region: 'West Africa', currency: 'MRU', currencySymbol: 'UM', languages: 'Arabic, French' },
    { code: 'MU', name: 'Mauritius', slug: 'mauritius', region: 'Indian Ocean', currency: 'MUR', currencySymbol: 'Rs', languages: 'English, French, Creole' },
    { code: 'MA', name: 'Morocco', slug: 'morocco', region: 'North Africa', currency: 'MAD', currencySymbol: 'MAD', languages: 'Arabic, Tamazight, French' },
    { code: 'MZ', name: 'Mozambique', slug: 'mozambique', region: 'Southern Africa', currency: 'MZN', currencySymbol: 'MT', languages: 'Portuguese' },
    { code: 'NA', name: 'Namibia', slug: 'namibia', region: 'Southern Africa', currency: 'NAD', currencySymbol: 'N$', languages: 'English, Afrikaans, Oshiwambo' },
    { code: 'NE', name: 'Niger', slug: 'niger', region: 'West Africa', currency: 'XOF', currencySymbol: 'CFA', languages: 'French, Hausa, Zarma' },
    { code: 'NG', name: 'Nigeria', slug: 'nigeria', region: 'West Africa', currency: 'NGN', currencySymbol: 'NGN', languages: 'English, Hausa, Yoruba, Igbo' },
    { code: 'RW', name: 'Rwanda', slug: 'rwanda', region: 'East Africa', currency: 'RWF', currencySymbol: 'RF', languages: 'Kinyarwanda, English, French, Swahili' },
    { code: 'ST', name: 'Sao Tome and Principe', slug: 'sao-tome-and-principe', region: 'Central Africa', currency: 'STN', currencySymbol: 'Db', languages: 'Portuguese' },
    { code: 'SN', name: 'Senegal', slug: 'senegal', region: 'West Africa', currency: 'XOF', currencySymbol: 'CFA', languages: 'French, Wolof' },
    { code: 'SC', name: 'Seychelles', slug: 'seychelles', region: 'Indian Ocean', currency: 'SCR', currencySymbol: 'SR', languages: 'English, French, Seychellois Creole' },
    { code: 'SL', name: 'Sierra Leone', slug: 'sierra-leone', region: 'West Africa', currency: 'SLE', currencySymbol: 'Le', languages: 'English, Krio' },
    { code: 'SO', name: 'Somalia', slug: 'somalia', region: 'East Africa', currency: 'SOS', currencySymbol: 'Sh', languages: 'Somali, Arabic' },
    { code: 'ZA', name: 'South Africa', slug: 'south-africa', region: 'Southern Africa', currency: 'ZAR', currencySymbol: 'R', languages: 'English, Zulu, Xhosa, Afrikaans' },
    { code: 'SS', name: 'South Sudan', slug: 'south-sudan', region: 'East Africa', currency: 'SSP', currencySymbol: 'SSP', languages: 'English' },
    { code: 'SD', name: 'Sudan', slug: 'sudan', region: 'North Africa', currency: 'SDG', currencySymbol: 'SDG', languages: 'Arabic, English' },
    { code: 'TZ', name: 'Tanzania', slug: 'tanzania', region: 'East Africa', currency: 'TZS', currencySymbol: 'TSh', languages: 'Swahili, English' },
    { code: 'TG', name: 'Togo', slug: 'togo', region: 'West Africa', currency: 'XOF', currencySymbol: 'CFA', languages: 'French, Ewe, Kabiye' },
    { code: 'TN', name: 'Tunisia', slug: 'tunisia', region: 'North Africa', currency: 'TND', currencySymbol: 'DT', languages: 'Arabic, French' },
    { code: 'UG', name: 'uganda', slug: 'uganda', region: 'East Africa', currency: 'UGX', currencySymbol: 'USh', languages: 'English, Swahili, Luganda' },
    { code: 'ZM', name: 'Zambia', slug: 'zambia', region: 'Southern Africa', currency: 'ZMW', currencySymbol: 'ZK', languages: 'English, Bemba, Nyanja' },
    { code: 'ZW', name: 'Zimbabwe', slug: 'zimbabwe', region: 'Southern Africa', currency: 'ZWL', currencySymbol: 'Z$', languages: 'English, Shona, Ndebele' }
  ];

  COUNTRIES.forEach(function(country) {
    if (country.code === 'UG') country.name = 'Uganda';
  });

  var COUNTRY_BY_CODE = {};
  var COUNTRY_BY_SLUG = {};
  COUNTRIES.forEach(function(country) {
    COUNTRY_BY_CODE[country.code] = country;
    COUNTRY_BY_SLUG[country.slug] = country;
  });

  var COUNTRY_PROFILES = {
    NG: {
      payeName: 'Nigeria PAYE Calculator',
      payeHref: '/nigeria/ng-salary-tax',
      vatName: 'Nigeria VAT Calculator',
      vatHref: '/nigeria/ng-vat',
      taxRef: 'FIRS PAYE, pension, NHF and national payroll assumptions.',
      legal: 'Nigeria legal and government guidance varies by federal and state authority.',
      apiExample: 'curl https://api.afrotools.com/v1/tax/paye?country=NG&currency=NGN'
    },
    KE: {
      payeName: 'Kenya PAYE Calculator',
      payeHref: '/kenya/ke-paye',
      vatName: 'Kenya VAT Calculator',
      vatHref: '/kenya/ke-vat',
      taxRef: 'KRA PAYE with SHIF/NSSF, AHL and relief references.',
      legal: 'Kenya tools show country-specific references, but official KRA and regulator notices remain authoritative.',
      apiExample: 'curl https://api.afrotools.com/v1/tax/paye?country=KE&currency=KES'
    },
    GH: {
      payeName: 'Ghana PAYE Calculator',
      payeHref: '/ghana/gh-paye',
      vatName: 'Ghana VAT Calculator',
      vatHref: '/ghana/gh-vat',
      taxRef: 'GRA PAYE and VAT workflow references.',
      legal: 'Ghana business and tax tools should be checked against current GRA guidance.'
    },
    ZA: {
      payeName: 'South Africa PAYE Calculator',
      payeHref: '/south-africa/za-paye',
      vatName: 'South Africa VAT Calculator',
      vatHref: '/south-africa/za-vat',
      taxRef: 'SARS PAYE, UIF and VAT references.',
      legal: 'South Africa tools should be checked against current SARS and labour guidance.'
    }
  };

  function cloneCountry(country, extra) {
    if (!country) return null;
    var copy = {};
    Object.keys(country).forEach(function(key) { copy[key] = country[key]; });
    if (extra) Object.keys(extra).forEach(function(key) { copy[key] = extra[key]; });
    return copy;
  }

  function normalize(value) {
    return String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
  }

  function getCountry(value) {
    if (!value) return null;
    var raw = String(value).trim();
    var upper = raw.toUpperCase();
    if (COUNTRY_BY_CODE[upper]) return COUNTRY_BY_CODE[upper];
    var slug = raw.toLowerCase().replace(/^\/|\/$/g, '');
    if (COUNTRY_BY_SLUG[slug]) return COUNTRY_BY_SLUG[slug];
    var needle = normalize(raw);
    for (var i = 0; i < COUNTRIES.length; i += 1) {
      if (normalize(COUNTRIES[i].name) === needle || normalize(COUNTRIES[i].slug) === needle) return COUNTRIES[i];
    }
    return null;
  }

  function getCountryFromPath() {
    var first = (window.location.pathname || '').split('/').filter(Boolean)[0];
    return first ? getCountry(first) : null;
  }

  function getCountryFromSearch() {
    try {
      var params = new URLSearchParams(window.location.search || '');
      var value = params.get('country') || params.get('country_code');
      return value ? getCountry(value) : null;
    } catch (err) {
      return null;
    }
  }

  function readStored() {
    try {
      var raw = window.localStorage && window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        var country = getCountry(parsed.code || parsed.slug || parsed.name);
        if (country) return cloneCountry(country, { diaspora: !!parsed.diaspora, selectedAt: parsed.selectedAt || null });
      }
      var legacy = window.localStorage && window.localStorage.getItem(LEGACY_KEY);
      if (legacy) return cloneCountry(getCountry(legacy));
    } catch (err) {}
    return null;
  }

  function saveSelected(country, options) {
    var selected = cloneCountry(country, {
      diaspora: !!(options && options.diaspora),
      selectedAt: new Date().toISOString()
    });
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
        code: selected.code,
        name: selected.name,
        slug: selected.slug,
        region: selected.region,
        currency: selected.currency,
        currencySymbol: selected.currencySymbol,
        diaspora: selected.diaspora,
        selectedAt: selected.selectedAt
      }));
      window.localStorage.setItem(LEGACY_KEY, selected.code);
    } catch (err) {}
    return selected;
  }

  function getSelected() {
    return readStored() || cloneCountry(getCountryFromSearch()) || cloneCountry(getCountryFromPath()) || cloneCountry(getCountry('NG'));
  }

  function profileFor(country) {
    if (!country) country = getSelected();
    var profile = COUNTRY_PROFILES[country.code] || {};
    var code = country.code.toLowerCase();
    var generated = {
      payeName: country.name + ' PAYE Calculator',
      payeHref: '/' + country.slug + '/' + code + '-paye',
      vatName: country.name + ' VAT Calculator',
      vatHref: '/' + country.slug + '/' + code + '-vat',
      taxRef: country.name + ' tax, salary and business references.',
      legal: country.name + ' legal and government tools are informational and should be checked against official notices.',
      apiExample: 'curl https://api.afrotools.com/v1/tax/paye?country=' + country.code + '&currency=' + country.currency
    };
    Object.keys(profile).forEach(function(key) { generated[key] = profile[key]; });
    generated.currencyLabel = country.currency + ' currency';
    generated.languageHint = country.languages || 'English and local languages';
    return generated;
  }

  function getTokenMaybe() {
    try {
      if (window.AfroAuth && typeof window.AfroAuth.getSessionToken === 'function') {
        var token = window.AfroAuth.getSessionToken();
        if (token) return Promise.resolve(token);
      }
      if (window.AfroAuth && typeof window.AfroAuth.getSessionTokenAsync === 'function') {
        return window.AfroAuth.getSessionTokenAsync().then(function(token) { return token || null; }).catch(function() { return null; });
      }
      var cached = window.localStorage && window.localStorage.getItem('afro_session_v3');
      return Promise.resolve(cached || null);
    } catch (err) {
      return Promise.resolve(null);
    }
  }

  function looksSignedIn() {
    try {
      if (window.AfroAuth && typeof window.AfroAuth.isLoggedIn === 'function') return !!window.AfroAuth.isLoggedIn();
      var raw = window.localStorage && window.localStorage.getItem('afro_auth_v2');
      if (!raw) return false;
      var parsed = JSON.parse(raw);
      return !!(parsed && parsed.email);
    } catch (err) {
      return false;
    }
  }

  function syncProfile(country) {
    country = country || getSelected();
    if (!country || !looksSignedIn()) return Promise.resolve({ ok: false, skipped: 'signed-out' });
    return getTokenMaybe().then(function(token) {
      if (!token) return { ok: false, skipped: 'missing-token' };
      return fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({
          country: country.name,
          country_code: country.code,
          currency: country.currency,
          onboarding_completed: true
        })
      }).then(function(res) {
        try {
          window.localStorage.setItem(SYNC_FLAG_KEY, JSON.stringify({ code: country.code, ok: res.ok, syncedAt: new Date().toISOString() }));
        } catch (err) {}
        return { ok: res.ok, status: res.status };
      }).catch(function(err) {
        return { ok: false, error: err && err.message ? err.message : 'profile sync failed' };
      });
    });
  }

  function setText(selector, text) {
    Array.prototype.forEach.call(document.querySelectorAll(selector), function(el) {
      el.textContent = text;
    });
  }

  function setHref(selector, href) {
    Array.prototype.forEach.call(document.querySelectorAll(selector), function(el) {
      el.setAttribute('href', href);
    });
  }

  function applyPersonalization(country) {
    country = country || getSelected();
    if (!country) return;
    var profile = profileFor(country);

    setText('[data-country-name]', country.name);
    setText('[data-country-code]', country.code);
    setText('[data-country-currency]', country.currency);
    setText('[data-country-currency-label]', profile.currencyLabel);
    setText('[data-country-language]', profile.languageHint);
    setText('[data-country-tax-ref]', profile.taxRef);
    setText('[data-country-legal-note]', profile.legal);
    setText('[data-country-api-example]', profile.apiExample);
    setText('[data-country-paye-name]', profile.payeName);
    setText('[data-country-vat-name]', profile.vatName);
    setHref('[data-country-paye-href]', profile.payeHref);
    setHref('[data-country-vat-href]', profile.vatHref);
    setHref('[data-country-home-href]', '/' + country.slug + '/');
    setHref('[data-country-tools-href]', '/tools/?country=' + encodeURIComponent(country.code));

    var currencyBadge = document.getElementById('home-preview-currency-badge');
    if (currencyBadge) currencyBadge.textContent = profile.currencyLabel;
    var currencyCode = document.getElementById('home-preview-currency-code');
    if (currencyCode) currencyCode.textContent = country.currency;
    var previewMeta = document.getElementById('home-preview-paye-meta');
    if (previewMeta) previewMeta.textContent = profile.taxRef;
    var previewVatMeta = document.getElementById('home-preview-vat-meta');
    if (previewVatMeta) previewVatMeta.textContent = country.currency + ' business VAT workflow';
    var resultCopy = document.getElementById('home-preview-country-copy');
    if (resultCopy) resultCopy.textContent = 'Suggestions, examples and disclaimers now use ' + country.name + ' context.';
  }

  function emitSelected(country, source) {
    applyPersonalization(country);
    try {
      window.dispatchEvent(new CustomEvent('afro-country-change', {
        detail: { country: cloneCountry(country), source: source || 'country-selector' }
      }));
    } catch (err) {}
  }

  function countryUrl(country) {
    country = country || getSelected();
    return country ? '/' + country.slug + '/' : '/countries/';
  }

  function toolsUrl(country) {
    country = country || getSelected();
    return country ? '/tools/?country=' + encodeURIComponent(country.code) : '/tools/';
  }

  var CSS = [
    ':host{display:block;font-family:var(--font-body,"DM Sans",system-ui,sans-serif);color:#0f172a}',
    '.cs{position:relative;width:100%;min-width:0}',
    '.cs-label{display:block;margin:0 0 8px;font-size:0.78rem;font-weight:800;color:#334155;letter-spacing:0;text-transform:none}',
    '.cs-trigger{width:100%;min-height:44px;display:flex;align-items:center;justify-content:space-between;gap:10px;border:1.5px solid #dbe4ef;background:#fff;color:#0f172a;border-radius:12px;padding:10px 12px;font:inherit;font-weight:800;cursor:pointer;box-shadow:0 1px 3px rgba(15,23,42,.06);transition:border-color .18s ease,box-shadow .18s ease,transform .18s ease}',
    '.cs-trigger:hover{border-color:#0062cc;box-shadow:0 8px 18px rgba(0,98,204,.08)}',
    '.cs-trigger:focus-visible,.cs-search:focus-visible,.cs-option:focus-visible{outline:3px solid rgba(0,98,204,.22);outline-offset:2px}',
    '.cs-main{display:flex;align-items:center;gap:8px;min-width:0}',
    '.cs-dot{width:22px;height:22px;border-radius:999px;background:#eef5ff;color:#0062cc;display:inline-flex;align-items:center;justify-content:center;font-size:.72rem;font-weight:900;flex:0 0 auto}',
    '.cs-selected{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.cs-meta{display:block;font-size:.7rem;font-weight:700;color:#64748b;margin-top:1px}',
    '.cs-chevron{width:16px;height:16px;flex:0 0 auto;color:#64748b;transition:transform .18s ease}',
    '.cs[data-open="true"] .cs-chevron{transform:rotate(180deg)}',
    '.cs-panel{position:absolute;z-index:900;top:calc(100% + 8px);left:0;right:0;background:#fff;border:1px solid #dbe4ef;border-radius:14px;box-shadow:0 22px 55px rgba(15,23,42,.16);padding:10px;max-height:min(460px,70vh);overflow:auto}',
    '.cs-panel[hidden]{display:none}',
    '.cs-search{width:100%;min-height:42px;border:1.5px solid #dbe4ef;border-radius:10px;padding:10px 11px;font:inherit;font-weight:700;color:#0f172a}',
    '.cs-diaspora{display:flex;gap:8px;align-items:flex-start;margin:10px 2px 4px;color:#475569;font-size:.76rem;line-height:1.35;font-weight:700}',
    '.cs-diaspora input{margin-top:2px;accent-color:#0062cc}',
    '.cs-group{padding-top:10px}',
    '.cs-group-title{font-size:.67rem;font-weight:900;color:#94a3b8;text-transform:uppercase;letter-spacing:.08em;padding:8px 4px 5px}',
    '.cs-option{width:100%;display:flex;align-items:center;justify-content:space-between;gap:10px;border:0;background:transparent;color:#0f172a;text-align:left;border-radius:9px;padding:9px 8px;cursor:pointer;font:inherit}',
    '.cs-option:hover{background:#f3f8ff}',
    '.cs-option[aria-selected="true"]{background:#eef5ff;color:#0062cc}',
    '.cs-option-name{font-size:.86rem;font-weight:800}',
    '.cs-option-meta{font-size:.72rem;color:#64748b;font-weight:700}',
    '.cs-empty{padding:14px 6px;color:#64748b;font-size:.82rem;font-weight:700}',
    ':host([variant="nav"]){width:156px}',
    ':host([variant="nav"]) .cs-label{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)}',
    ':host([variant="nav"]) .cs-trigger{min-height:40px;border-radius:999px;padding:7px 10px}',
    ':host([variant="nav"]) .cs-meta{display:none}',
    ':host([variant="nav"]) .cs-selected{font-size:.78rem}',
    ':host([variant="mobile"]) .cs-panel,:host([variant="hero"]) .cs-panel,:host([variant="inline"]) .cs-panel{position:absolute}',
    '@media (max-width:640px){.cs-panel{position:fixed;left:14px;right:14px;top:76px;max-height:calc(100vh - 104px)}:host([variant="nav"]){width:140px}}'
  ].join('');

  class CountrySelector extends HTMLElement {
    connectedCallback() {
      this.attachShadowOnce();
      this._country = getSelected();
      this._query = '';
      this._open = false;
      this.render();
      this.bind();
    }

    attachShadowOnce() {
      if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    }

    bind() {
      var self = this;
      if (this._bound) return;
      this._bound = true;
      this.shadowRoot.addEventListener('click', function(event) {
      var trigger = event.target.closest('.cs-trigger');
      if (trigger) {
        self.setOpen(!self._open);
        return;
      }
      var option = event.target.closest('.cs-option');
      if (option) {
        self.select(option.getAttribute('data-code'));
      }
      });
      this.shadowRoot.addEventListener('input', function(event) {
      if (event.target.classList.contains('cs-search')) {
        self._query = event.target.value || '';
        self.renderOptions();
      }
      });
      this.shadowRoot.addEventListener('change', function(event) {
      if (event.target.classList.contains('cs-diaspora-input') && self._country) {
        var selected = saveSelected(self._country, { diaspora: event.target.checked });
        self._country = selected;
        emitSelected(selected, 'diaspora-toggle');
      }
      });
      document.addEventListener('click', function(event) {
      if (!self.contains(event.target)) self.setOpen(false);
      });
      window.addEventListener('afro-auth-change', function() {
      if (self.hasAttribute('sync-profile')) syncProfile(getSelected());
      });
    }

    setOpen(open) {
      this._open = !!open;
      var root = this.shadowRoot;
      var shell = root && root.querySelector('.cs');
      var panel = root && root.querySelector('.cs-panel');
      var trigger = root && root.querySelector('.cs-trigger');
      if (shell) shell.setAttribute('data-open', this._open ? 'true' : 'false');
      if (panel) panel.hidden = !this._open;
      if (trigger) trigger.setAttribute('aria-expanded', this._open ? 'true' : 'false');
      if (this._open) {
        var input = root.querySelector('.cs-search');
        if (input) setTimeout(function() { input.focus(); }, 20);
      }
    }

    select(code) {
      var country = getCountry(code);
      if (!country) return;
      var diasporaInput = this.shadowRoot.querySelector('.cs-diaspora-input');
      var selected = saveSelected(country, { diaspora: !!(diasporaInput && diasporaInput.checked) });
      this._country = selected;
      this._query = '';
      this._open = false;
      this.render();
      emitSelected(selected, this.id || 'country-selector');
      if (this.hasAttribute('sync-profile')) syncProfile(selected);

      var redirect = this.getAttribute('redirect') || 'none';
      if (redirect === 'country') window.location.href = countryUrl(selected);
      if (redirect === 'tools') window.location.href = toolsUrl(selected);
    }

    render() {
      var selected = this._country || getSelected();
      var label = this.getAttribute('label') || 'Choose country';
      var showDiaspora = this.hasAttribute('diaspora');
      this.shadowRoot.innerHTML = [
      '<style>' + CSS + '</style>',
      '<div class="cs" data-open="' + (this._open ? 'true' : 'false') + '">',
      '<label class="cs-label" id="country-selector-label">' + escapeHtml(label) + '</label>',
      '<button class="cs-trigger" type="button" aria-haspopup="listbox" aria-expanded="' + (this._open ? 'true' : 'false') + '" aria-labelledby="country-selector-label">',
      '<span class="cs-main"><span class="cs-dot" aria-hidden="true">' + escapeHtml(selected.code) + '</span><span><span class="cs-selected">' + escapeHtml(selected.name) + '</span><span class="cs-meta">' + escapeHtml(selected.currency + ' currency') + '</span></span></span>',
      '<svg class="cs-chevron" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      '</button>',
      '<div class="cs-panel" role="listbox" aria-label="' + escapeHtml(label) + '" ' + (this._open ? '' : 'hidden') + '>',
      '<input class="cs-search" type="search" placeholder="Search 54 African countries" autocomplete="off" aria-label="Search countries" value="' + escapeHtml(this._query || '') + '">',
      showDiaspora ? '<label class="cs-diaspora"><input class="cs-diaspora-input" type="checkbox" ' + (selected.diaspora ? 'checked' : '') + '> <span>I live abroad but manage money in <strong>' + escapeHtml(selected.name) + '</strong>.</span></label>' : '',
      '<div class="cs-options"></div>',
      '</div>',
      '</div>'
    ].join('');
      this.renderOptions();
    }

    renderOptions() {
      var selected = this._country || getSelected();
      var query = normalize(this._query || '');
      var groups = {};
      COUNTRIES.forEach(function(country) {
      var haystack = normalize(country.name + ' ' + country.code + ' ' + country.region + ' ' + country.currency);
      if (query && haystack.indexOf(query) === -1) return;
      if (!groups[country.region]) groups[country.region] = [];
      groups[country.region].push(country);
      });
      var regions = ['North Africa', 'West Africa', 'Central Africa', 'East Africa', 'Southern Africa', 'Indian Ocean'];
      var html = '';
      regions.forEach(function(region) {
      if (!groups[region] || !groups[region].length) return;
      html += '<div class="cs-group"><div class="cs-group-title">' + escapeHtml(region) + '</div>';
      groups[region].forEach(function(country) {
        html += '<button class="cs-option" type="button" role="option" data-code="' + escapeHtml(country.code) + '" aria-selected="' + (selected && selected.code === country.code ? 'true' : 'false') + '">';
        html += '<span><span class="cs-option-name">' + escapeHtml(country.name) + '</span><span class="cs-option-meta">' + escapeHtml(country.region + ' - ' + country.currency) + '</span></span>';
        html += '<span class="cs-option-meta">' + escapeHtml(country.code) + '</span>';
        html += '</button>';
      });
      html += '</div>';
      });
      if (!html) html = '<div class="cs-empty">No country found. Try Nigeria, Kenya, Ghana, or South Africa.</div>';
      var options = this.shadowRoot && this.shadowRoot.querySelector('.cs-options');
      if (options) options.innerHTML = html;
    }
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  window.AfroCountry = {
    all: function() { return COUNTRIES.map(function(country) { return cloneCountry(country); }); },
    get: function(value) { return cloneCountry(getCountry(value)); },
    getSelected: function() { return cloneCountry(getSelected()); },
    select: function(value, options) {
      var country = getCountry(value);
      if (!country) return null;
      var selected = saveSelected(country, options || {});
      emitSelected(selected, 'api');
      if (options && options.syncProfile) syncProfile(selected);
      return cloneCountry(selected);
    },
    profileFor: function(value) {
      var country = value && value.code ? value : getCountry(value);
      return profileFor(country || getSelected());
    },
    countryUrl: countryUrl,
    toolsUrl: toolsUrl,
    syncProfile: syncProfile,
    applyPersonalization: applyPersonalization,
    storageKey: STORAGE_KEY
  };

  if ('customElements' in window && !customElements.get('afro-country-selector')) {
    customElements.define('afro-country-selector', CountrySelector);
  }

  function boot() {
    var routeCountry = cloneCountry(getCountryFromSearch()) || cloneCountry(getCountryFromPath());
    var selected = readStored() || routeCountry || cloneCountry(getCountry('NG'));
    applyPersonalization(selected);
    if (!readStored() && routeCountry) saveSelected(selected, { diaspora: false });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})(window, document);
