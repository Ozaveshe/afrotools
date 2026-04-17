(function (window) {
  'use strict';

  var cache = {};
  var CACHE_TTL = 5 * 60 * 1000;
  var API_BASE = '/.netlify/functions';

  function getCached(key) {
    var entry = cache[key];
    if (!entry) return null;
    if (Date.now() - entry.ts > CACHE_TTL) return null;
    return entry.data;
  }

  function setCached(key, data) {
    cache[key] = { data: data, ts: Date.now() };
  }

  function authHeaders() {
    var token = window.AfroAuth && typeof window.AfroAuth.getSessionToken === 'function'
      ? window.AfroAuth.getSessionToken()
      : null;

    var headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = 'Bearer ' + token;
    return headers;
  }

  var CATEGORY_ALIASES = {
    informal_fx_rate: 'informal_fx_rate',
    forex_rate: 'informal_fx_rate',
    forex_rates: 'informal_fx_rate',
    remittance_quote: 'remittance_quote',
    remittance_quotes: 'remittance_quote',
    fuel_price: 'fuel_price',
    fuel_prices: 'fuel_price',
    transport_fare: 'transport_fare',
    transport_fares: 'transport_fare',
    transport: 'transport_fare',
    staple_price: 'staple_price',
    staple_prices: 'staple_price',
    product_price: 'staple_price',
    product_prices: 'staple_price',
    food_prices: 'staple_price',
    rent_listing: 'rent_listing',
    rent_listings: 'rent_listing',
    rent_housing: 'rent_listing',
    rent: 'rent_listing',
    lease_risk_report: 'lease_risk_report',
    lease_risk_check: 'lease_risk_report',
    salary_report: 'salary_report',
    salaries: 'salary_report',
    salary: 'salary_report',
    fintech_fee: 'fintech_fee',
    fintech_fees: 'fintech_fee',
    backup_power_cost: 'backup_power_cost',
    business_cost: 'backup_power_cost',
    business_costs: 'backup_power_cost',
    school_fee: 'school_fee',
    school_fees: 'school_fee',
    education_cost: 'school_fee',
    education_costs: 'school_fee',
    clinic_cost: 'clinic_cost',
    clinic_costs: 'clinic_cost',
    pharmacy_price: 'pharmacy_price',
    pharmacy_prices: 'pharmacy_price',
    wholesale_retail_spread: 'wholesale_retail_spread',
    wholesale_retail: 'wholesale_retail_spread'
  };

  var CATEGORIES = [
    { id: 'informal_fx_rate', vertical: 'fx_remittance', label: 'Informal FX Rates', emoji: 'FX', points: 12, bonus: 5, consensus: 3, window_days: 2, threshold: 0.08 },
    { id: 'remittance_quote', vertical: 'fx_remittance', label: 'Remittance Quotes', emoji: 'RM', points: 12, bonus: 5, consensus: 2, window_days: 7, threshold: 0.12 },
    { id: 'fuel_price', vertical: 'fuel_transport', label: 'Fuel Prices', emoji: 'FL', points: 8, bonus: 3, consensus: 2, window_days: 7, threshold: 0.2 },
    { id: 'transport_fare', vertical: 'fuel_transport', label: 'Transport Fares', emoji: 'TR', points: 8, bonus: 3, consensus: 3, window_days: 14, threshold: 0.2 },
    { id: 'staple_price', vertical: 'staple_basket', label: 'Staple Basket Prices', emoji: 'SB', points: 8, bonus: 3, consensus: 2, window_days: 14, threshold: 0.2 },
    { id: 'rent_listing', vertical: 'rent_intelligence', label: 'Rent Intelligence', emoji: 'RE', points: 15, bonus: 5, consensus: 2, window_days: 30, threshold: 0.2 },
    { id: 'lease_risk_report', vertical: 'rent_intelligence', label: 'Lease Risk Check', emoji: 'LK', points: 18, bonus: 5, consensus: 1, window_days: 30, threshold: 0 },
    { id: 'salary_report', vertical: 'salary_intelligence', label: 'Salary Intelligence', emoji: 'SA', points: 15, bonus: 0, consensus: 3, window_days: 90, threshold: 0.25 },
    { id: 'fintech_fee', vertical: 'fintech_fees', label: 'Fintech Fees', emoji: 'FF', points: 10, bonus: 5, consensus: 3, window_days: 30, threshold: 0.2 },
    { id: 'backup_power_cost', vertical: 'backup_power', label: 'Backup Power Costs', emoji: 'BP', points: 10, bonus: 4, consensus: 2, window_days: 30, threshold: 0.25 },
    { id: 'school_fee', vertical: 'school_fees', label: 'School Fees', emoji: 'SC', points: 10, bonus: 4, consensus: 2, window_days: 90, threshold: 0.2 },
    { id: 'clinic_cost', vertical: 'health_costs', label: 'Clinic Costs', emoji: 'CL', points: 12, bonus: 4, consensus: 2, window_days: 30, threshold: 0.2 },
    { id: 'pharmacy_price', vertical: 'health_costs', label: 'Pharmacy Prices', emoji: 'PH', points: 10, bonus: 4, consensus: 2, window_days: 30, threshold: 0.2 },
    { id: 'wholesale_retail_spread', vertical: 'wholesale_retail', label: 'Wholesale vs Retail', emoji: 'WR', points: 12, bonus: 4, consensus: 2, window_days: 21, threshold: 0.25 }
  ];

  var CATEGORY_FIELDS = {
    informal_fx_rate: [
      { key: 'base_currency', label: 'Base Currency', type: 'text', required: true, placeholder: 'e.g. USD' },
      { key: 'target_currency', label: 'Target Currency', type: 'text', required: true, placeholder: 'e.g. NGN' },
      { key: 'buy_rate', label: 'Buy Rate', type: 'number', required: true, min: 0 },
      { key: 'sell_rate', label: 'Sell Rate', type: 'number', required: false, min: 0 },
      { key: 'market_type', label: 'Market Type', type: 'select', required: true, options: ['Street', 'BDC', 'P2P', 'Community Dealer'] }
    ],
    remittance_quote: [
      { key: 'provider', label: 'Provider', type: 'text', required: true, placeholder: 'e.g. Wise, LemFi' },
      { key: 'send_country', label: 'From Country', type: 'text', required: true, placeholder: 'e.g. US' },
      { key: 'receive_country', label: 'To Country', type: 'text', required: true, placeholder: 'e.g. NG' },
      { key: 'send_amount', label: 'Send Amount', type: 'number', required: true, min: 0 },
      { key: 'fee_amount', label: 'Fee Amount', type: 'number', required: true, min: 0 },
      { key: 'received_amount', label: 'Recipient Gets', type: 'number', required: true, min: 0 },
      { key: 'delivery_minutes', label: 'Delivery Time (minutes)', type: 'number', required: false, min: 0 }
    ],
    fuel_price: [
      { key: 'fuel_type', label: 'Fuel Type', type: 'select', required: true, options: ['Petrol', 'Diesel', 'LPG', 'Kerosene'] },
      { key: 'price_per_unit', label: 'Price per Unit', type: 'number', required: true, min: 0 },
      { key: 'unit', label: 'Unit', type: 'select', required: true, options: ['Liter', 'Kilogram', 'Gallon'] },
      { key: 'station_name', label: 'Station or Seller', type: 'text', required: false }
    ],
    transport_fare: [
      { key: 'transport_type', label: 'Transport Type', type: 'select', required: true, options: ['Bus', 'Minibus', 'Ride-hail', 'Motorbike', 'Train', 'Ferry', 'Tricycle'] },
      { key: 'route_from', label: 'Route From', type: 'text', required: true },
      { key: 'route_to', label: 'Route To', type: 'text', required: true },
      { key: 'fare', label: 'Fare', type: 'number', required: true, min: 0 },
      { key: 'provider', label: 'Operator', type: 'text', required: false }
    ],
    staple_price: [
      { key: 'product_name', label: 'Item Name', type: 'text', required: true, placeholder: 'e.g. Rice 1kg' },
      { key: 'product_category', label: 'Category', type: 'select', required: true, options: ['Food Staples', 'Household', 'Produce', 'Protein', 'Other'] },
      { key: 'brand_name', label: 'Brand (optional)', type: 'text', required: false },
      { key: 'price', label: 'Observed Price', type: 'number', required: true, min: 0 },
      { key: 'market_name', label: 'Market or Store', type: 'text', required: false },
      { key: 'unit', label: 'Unit', type: 'text', required: false, placeholder: 'e.g. per kg, basket, pack' }
    ],
    rent_listing: [
      { key: 'property_type', label: 'Property Type', type: 'select', required: true, options: ['Room', 'Apartment', 'House', 'Studio', 'Shop', 'Office'] },
      { key: 'bedrooms', label: 'Bedrooms', type: 'number', required: false, min: 0 },
      { key: 'bathrooms', label: 'Bathrooms', type: 'number', required: false, min: 0 },
      { key: 'rent_amount', label: 'Quoted Rent', type: 'number', required: true, min: 0 },
      { key: 'rent_period', label: 'Rent Period', type: 'select', required: true, options: ['Monthly', 'Annual'] },
      { key: 'deposit_amount', label: 'Deposit Amount', type: 'number', required: false, min: 0 },
      { key: 'vacancy_status', label: 'Vacancy Status', type: 'select', required: false, options: ['Vacant', 'Occupied', 'Listed'] },
      { key: 'listing_url', label: 'Listing URL', type: 'url', required: false }
    ],
    lease_risk_report: [
      { key: 'listing_url', label: 'Listing URL', type: 'url', required: true },
      { key: 'landlord_name', label: 'Agent or Landlord Name', type: 'text', required: false },
      { key: 'property_type', label: 'Property Type', type: 'select', required: true, options: ['Room', 'Apartment', 'House', 'Studio', 'Shop', 'Office'] },
      { key: 'asking_rent', label: 'Asking Rent', type: 'number', required: true, min: 0 },
      { key: 'deposit_amount', label: 'Deposit Asked', type: 'number', required: false, min: 0 },
      { key: 'risk_score', label: 'Risk Score (0-100)', type: 'number', required: false, min: 0 },
      { key: 'scam_signals', label: 'Scam Signals (comma-separated)', type: 'text', required: false, placeholder: 'e.g. upfront fee, rushed viewing, no title docs' }
    ],
    salary_report: [
      { key: 'job_title', label: 'Job Title', type: 'text', required: true },
      { key: 'role_category', label: 'Role Category', type: 'select', required: true, options: ['Engineering', 'Design', 'Sales', 'Marketing', 'Operations', 'Finance', 'Healthcare', 'Education', 'Other'] },
      { key: 'industry', label: 'Industry', type: 'text', required: true },
      { key: 'experience_level', label: 'Experience Level', type: 'select', required: true, options: ['Entry', 'Mid', 'Senior', 'Lead', 'Executive'] },
      { key: 'monthly_gross', label: 'Monthly Gross Pay', type: 'number', required: true, min: 0 },
      { key: 'monthly_net', label: 'Monthly Net Pay', type: 'number', required: false, min: 0 },
      { key: 'company_size', label: 'Company Size', type: 'select', required: false, options: ['1-10', '11-50', '51-200', '200+'] },
      { key: 'sector', label: 'Sector', type: 'select', required: false, options: ['Private', 'Public', 'NGO', 'Contract'] }
    ],
    fintech_fee: [
      { key: 'provider', label: 'Provider', type: 'text', required: true },
      { key: 'transaction_type', label: 'Fee Type', type: 'select', required: true, options: ['Transfer', 'Withdrawal', 'Deposit', 'ATM', 'POS', 'USSD', 'Bill Payment'] },
      { key: 'amount_range', label: 'Amount Band', type: 'text', required: true, placeholder: 'e.g. 0-1000' },
      { key: 'fee_amount', label: 'Fee Amount', type: 'number', required: true, min: 0 },
      { key: 'transaction_channel', label: 'Channel', type: 'select', required: false, options: ['App', 'USSD', 'Agent', 'ATM', 'Branch'] }
    ],
    backup_power_cost: [
      { key: 'energy_type', label: 'Energy Type', type: 'select', required: true, options: ['Generator Fuel', 'Diesel', 'Petrol', 'LPG', 'Inverter Battery', 'Solar'] },
      { key: 'product_name', label: 'Product or Setup', type: 'text', required: false },
      { key: 'cost_amount', label: 'Observed Cost', type: 'number', required: true, min: 0 },
      { key: 'unit', label: 'Unit', type: 'text', required: false, placeholder: 'e.g. liter, refill, panel' },
      { key: 'quantity', label: 'Quantity', type: 'number', required: false, min: 0 },
      { key: 'runtime_hours', label: 'Runtime Hours (optional)', type: 'number', required: false, min: 0 }
    ],
    school_fee: [
      { key: 'institution_name', label: 'Institution Name', type: 'text', required: true },
      { key: 'education_level', label: 'Level', type: 'select', required: true, options: ['Primary', 'Secondary', 'University', 'Vocational', 'International'] },
      { key: 'institution_type', label: 'Institution Type', type: 'select', required: true, options: ['Public', 'Private', 'Faith-based', 'International'] },
      { key: 'annual_tuition', label: 'Annual Tuition', type: 'number', required: true, min: 0 },
      { key: 'extras_total', label: 'Extras Total', type: 'number', required: false, min: 0 },
      { key: 'period', label: 'Fee Period', type: 'select', required: true, options: ['Annual', 'Term', 'Semester', 'One-time'] }
    ],
    clinic_cost: [
      { key: 'facility_name', label: 'Facility Name', type: 'text', required: true },
      { key: 'facility_type', label: 'Facility Type', type: 'select', required: true, options: ['Clinic', 'Hospital', 'Health Centre', 'Private Practice'] },
      { key: 'service_name', label: 'Service Name', type: 'text', required: true, placeholder: 'e.g. Consultation, Scan, Delivery' },
      { key: 'cost_amount', label: 'Observed Cost', type: 'number', required: true, min: 0 },
      { key: 'wait_time_minutes', label: 'Wait Time (minutes)', type: 'number', required: false, min: 0 }
    ],
    pharmacy_price: [
      { key: 'pharmacy_name', label: 'Pharmacy Name', type: 'text', required: false },
      { key: 'medicine_name', label: 'Medicine Name', type: 'text', required: true },
      { key: 'brand_name', label: 'Brand', type: 'text', required: false },
      { key: 'dosage', label: 'Dosage', type: 'text', required: false, placeholder: 'e.g. 500mg' },
      { key: 'pack_size', label: 'Pack Size', type: 'text', required: false, placeholder: 'e.g. 10 tablets' },
      { key: 'price_amount', label: 'Observed Price', type: 'number', required: true, min: 0 }
    ],
    wholesale_retail_spread: [
      { key: 'market_name', label: 'Market Name', type: 'text', required: true },
      { key: 'product_name', label: 'Product Name', type: 'text', required: true },
      { key: 'brand_name', label: 'Brand', type: 'text', required: false },
      { key: 'wholesale_price', label: 'Wholesale Price', type: 'number', required: true, min: 0 },
      { key: 'retail_price', label: 'Retail Price', type: 'number', required: true, min: 0 },
      { key: 'spread_pct', label: 'Spread % (optional)', type: 'number', required: false, min: 0 }
    ]
  };

  var COUNTRIES = {
    DZ: 'Algeria', AO: 'Angola', BJ: 'Benin', BW: 'Botswana', BF: 'Burkina Faso', BI: 'Burundi',
    CV: 'Cabo Verde', CM: 'Cameroon', CF: 'Central African Republic', TD: 'Chad', KM: 'Comoros',
    CG: 'Congo', CD: 'DR Congo', DJ: 'Djibouti', EG: 'Egypt', GQ: 'Equatorial Guinea',
    ER: 'Eritrea', SZ: 'Eswatini', ET: 'Ethiopia', GA: 'Gabon', GM: 'Gambia', GH: 'Ghana',
    GN: 'Guinea', GW: 'Guinea-Bissau', CI: 'Cote d\'Ivoire', KE: 'Kenya', LS: 'Lesotho',
    LR: 'Liberia', LY: 'Libya', MG: 'Madagascar', MW: 'Malawi', ML: 'Mali', MR: 'Mauritania',
    MU: 'Mauritius', MA: 'Morocco', MZ: 'Mozambique', NA: 'Namibia', NE: 'Niger', NG: 'Nigeria',
    RW: 'Rwanda', ST: 'Sao Tome and Principe', SN: 'Senegal', SC: 'Seychelles', SL: 'Sierra Leone',
    SO: 'Somalia', ZA: 'South Africa', SS: 'South Sudan', SD: 'Sudan', TZ: 'Tanzania', TG: 'Togo',
    TN: 'Tunisia', UG: 'Uganda', ZM: 'Zambia', ZW: 'Zimbabwe'
  };

  var CURRENCIES = {
    DZ: 'DZD', AO: 'AOA', BJ: 'XOF', BW: 'BWP', BF: 'XOF', BI: 'BIF', CV: 'CVE', CM: 'XAF',
    CF: 'XAF', TD: 'XAF', KM: 'KMF', CG: 'XAF', CD: 'CDF', DJ: 'DJF', EG: 'EGP', GQ: 'XAF',
    ER: 'ERN', SZ: 'SZL', ET: 'ETB', GA: 'XAF', GM: 'GMD', GH: 'GHS', GN: 'GNF', GW: 'XOF',
    CI: 'XOF', KE: 'KES', LS: 'LSL', LR: 'LRD', LY: 'LYD', MG: 'MGA', MW: 'MWK', ML: 'XOF',
    MR: 'MRU', MU: 'MUR', MA: 'MAD', MZ: 'MZN', NA: 'NAD', NE: 'XOF', NG: 'NGN', RW: 'RWF',
    ST: 'STN', SN: 'XOF', SC: 'SCR', SL: 'SLE', SO: 'SOS', ZA: 'ZAR', SS: 'SSP', SD: 'SDG',
    TZ: 'TZS', TG: 'XOF', TN: 'TND', UG: 'UGX', ZM: 'ZMW', ZW: 'ZWL'
  };

  var RANKS = [
    { id: 'newcomer', label: 'Newcomer', min_points: 0, min_trust: 0, color: '#94a3b8' },
    { id: 'contributor', label: 'Contributor', min_points: 100, min_trust: 0, color: '#22c55e' },
    { id: 'trusted', label: 'Trusted', min_points: 500, min_trust: 70, color: '#3b82f6' },
    { id: 'expert', label: 'Expert', min_points: 2000, min_trust: 85, color: '#a855f7' },
    { id: 'legend', label: 'Legend', min_points: 10000, min_trust: 90, color: '#f59e0b' }
  ];

  function normalizeCategoryId(value) {
    if (!value) return null;
    return CATEGORY_ALIASES[String(value).trim().toLowerCase()] || null;
  }

  function getCategoryById(id) {
    var normalized = normalizeCategoryId(id) || id;
    return CATEGORIES.find(function (category) { return category.id === normalized; }) || null;
  }

  function getFieldsForCategory(id) {
    var normalized = normalizeCategoryId(id) || id;
    return CATEGORY_FIELDS[normalized] || [];
  }

  function getSubmissionPoints(id) {
    var category = getCategoryById(id);
    return category ? category.points : 5;
  }

  function getConfirmationBonus(id) {
    var category = getCategoryById(id);
    return category ? category.bonus : 0;
  }

  function calculateRank(points, trust) {
    var match = RANKS[0];
    for (var index = RANKS.length - 1; index >= 0; index -= 1) {
      if (points >= RANKS[index].min_points && trust >= RANKS[index].min_trust) {
        match = RANKS[index];
        break;
      }
    }
    return match;
  }

  function formatPoints(value) {
    if (value >= 10000) return (value / 1000).toFixed(1) + 'k';
    return Number(value || 0).toLocaleString();
  }

  function formatCash(points) {
    return '$' + (Number(points || 0) / 100).toFixed(2);
  }

  async function fetchJson(path, options, cacheKey) {
    if (cacheKey) {
      var cached = getCached(cacheKey);
      if (cached) return cached;
    }

    var response = await fetch(API_BASE + path, options || {});
    var json = await response.json();
    if (cacheKey && !json.error) setCached(cacheKey, json);
    return json;
  }

  var engine = {
    API_BASE: API_BASE,
    DAILY_LIMIT: 20,
    CATEGORIES: CATEGORIES,
    CATEGORY_FIELDS: CATEGORY_FIELDS,
    CATEGORY_ALIASES: CATEGORY_ALIASES,
    COUNTRIES: COUNTRIES,
    CURRENCIES: CURRENCIES,
    RANKS: RANKS,
    normalizeCategoryId: normalizeCategoryId,
    getCategoryById: getCategoryById,
    getFieldsForCategory: getFieldsForCategory,
    getSubmissionPoints: getSubmissionPoints,
    getConfirmationBonus: getConfirmationBonus,
    getCountryName: function (code) { return COUNTRIES[code] || code; },
    getCurrency: function (code) { return CURRENCIES[code] || 'USD'; },
    getRankInfo: function (id) {
      return RANKS.find(function (rank) { return rank.id === id; }) || RANKS[0];
    },
    calculateRank: calculateRank,
    formatPoints: formatPoints,
    formatCash: formatCash,
    getStreakBonus: function (days) {
      if (days >= 30) return 100;
      if (days >= 7) return 20;
      if (days >= 3) return 5;
      return 0;
    },
    submitContribution: async function (payload) {
      if (payload && payload.category && !payload.subtype) {
        payload.subtype = normalizeCategoryId(payload.category) || payload.category;
      }
      if (payload && payload.subtype && !payload.vertical) {
        var category = getCategoryById(payload.subtype);
        if (category) payload.vertical = category.vertical;
      }
      return fetchJson('/afropoints-submit', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload)
      });
    },
    getProfile: async function () {
      return fetchJson('/afropoints-profile', {
        headers: authHeaders()
      }, 'ap_profile');
    },
    saveOnboarding: async function (payload) {
      var result = await fetchJson('/afropoints-profile', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          action: 'onboarding',
          contributor_persona: payload.contributor_persona,
          regular_countries: payload.regular_countries || [],
          regular_cities: payload.regular_cities || [],
          regular_neighborhoods: payload.regular_neighborhoods || [],
          regular_routes: payload.regular_routes || [],
          coverage_categories: payload.coverage_categories || [],
          submission_frequency: payload.submission_frequency,
          payout_preference: payload.payout_preference,
          proof_comfort: payload.proof_comfort
        })
      });
      cache.ap_profile = null;
      return result;
    },
    getLeaderboard: async function (scope, period) {
      var cacheKey = 'ap_lb_' + (scope || 'global') + '_' + (period || 'all_time');
      return fetchJson('/afropoints-leaderboard?scope=' + encodeURIComponent(scope || 'global') + '&period=' + encodeURIComponent(period || 'all_time'), {
        headers: authHeaders()
      }, cacheKey);
    },
    getActivity: async function (limit) {
      return fetchJson('/afropoints-profile?action=activity&limit=' + encodeURIComponent(limit || 10), {
        headers: authHeaders()
      });
    },
    getBadges: async function () {
      return fetchJson('/afropoints-profile?action=badges', {
        headers: authHeaders()
      }, 'ap_badges');
    },
    requestCashout: async function (method, details, pointsAmount) {
      return fetchJson('/afropoints-cashout', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ method: method, details: details, points_amount: pointsAmount })
      });
    },
    getCashoutHistory: async function () {
      return fetchJson('/afropoints-cashout?action=history', {
        headers: authHeaders()
      });
    },
    submitBuyerLead: async function (payload) {
      return fetchJson('/data-buyer-leads', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload)
      });
    },
    getBuyerLeads: async function (params) {
      var query = params && params.status ? '?status=' + encodeURIComponent(params.status) : '';
      return fetchJson('/data-buyer-leads' + query, {
        headers: authHeaders()
      });
    }
  };

  window.AfroPointsEngine = engine;
})(window);
