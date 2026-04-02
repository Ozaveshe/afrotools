/* AfroPoints Engine — points calculation, ranks, badges, anti-fraud */
var AfroPointsEngine = (function () {
  'use strict';

  // ── Supabase (DATA instance) ──────────────────────────────
  var DATA_URL = 'https://jbmhfpkzbgyeodsqhprx.supabase.co';
  var DATA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpibWhmcGt6Ymd5ZW9kc3FocHJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc1NjcyMjMsImV4cCI6MjA1MzE0MzIyM30.gFjKFVjFJMqven0X-iejTXBAW7kkjczVCZsDZA8CPiA';
  var db = null;

  function getDB() {
    if (db) return db;
    if (window.AfroAuth && typeof AfroAuth.getSupabase === 'function') {
      db = AfroAuth.getSupabase();
    } else if (window.supabase && window.supabase.createClient) {
      db = window.supabase.createClient(DATA_URL, DATA_KEY);
    }
    return db;
  }

  // ── Cache ─────────────────────────────────────────────────
  var cache = {};
  function getCached(k) { var c = cache[k]; return c && Date.now() - c.ts < 5 * 60000 ? c.d : null; }
  function setCached(k, d) { cache[k] = { d: d, ts: Date.now() }; }

  // ── Category config ───────────────────────────────────────
  var CATEGORIES = [
    { id: 'product_price',  label: 'Consumer Prices',       emoji: '🏷️', points: 5,  bonus: 3, consensus: 2, window_days: 7,  threshold: 0.20 },
    { id: 'forex_rate',     label: 'Informal Forex Rates',  emoji: '💱', points: 8,  bonus: 5, consensus: 3, window_days: 1,  threshold: 0.05 },
    { id: 'fuel_price',     label: 'Fuel & Energy Prices',  emoji: '⛽', points: 5,  bonus: 3, consensus: 2, window_days: 7,  threshold: 0.20 },
    { id: 'rent',           label: 'Rent & Property',       emoji: '🏠', points: 10, bonus: 5, consensus: 3, window_days: 30, threshold: 0.30 },
    { id: 'transport',      label: 'Transport Costs',       emoji: '🚌', points: 5,  bonus: 3, consensus: 3, window_days: 14, threshold: 0.20 },
    { id: 'salary',         label: 'Salary & Wages',        emoji: '💰', points: 15, bonus: 0, consensus: 5, window_days: 90, threshold: 0 },
    { id: 'business_cost',  label: 'Business Costs',        emoji: '🏪', points: 10, bonus: 5, consensus: 3, window_days: 30, threshold: 0.30 },
    { id: 'meal_price',     label: 'Food & Meal Prices',    emoji: '🍽️', points: 5,  bonus: 3, consensus: 2, window_days: 14, threshold: 0.20 },
    { id: 'fintech_fee',    label: 'Mobile Money & Banking',emoji: '📱', points: 8,  bonus: 5, consensus: 3, window_days: 30, threshold: 0.20 },
    { id: 'education_cost', label: 'Education Costs',       emoji: '🎓', points: 8,  bonus: 3, consensus: 3, window_days: 90, threshold: 0.30 }
  ];

  // ── Category field definitions (for dynamic forms) ────────
  var CATEGORY_FIELDS = {
    product_price: [
      { key: 'product_name',     label: 'Product Name',     type: 'text',   required: true, placeholder: 'e.g. 1kg Rice' },
      { key: 'product_category', label: 'Product Category',  type: 'select', required: true, options: ['Food & Groceries','Household','Building Materials','Personal Care','Electronics','Clothing','Other'] },
      { key: 'brand',            label: 'Brand (optional)',  type: 'text',   required: false },
      { key: 'price',            label: 'Price',            type: 'number', required: true, min: 0 },
      { key: 'store_type',       label: 'Store Type',       type: 'select', required: true, options: ['Supermarket','Open Market','Kiosk/Shop','Online','Wholesale'] }
    ],
    forex_rate: [
      { key: 'base_currency',  label: 'From Currency', type: 'text',   required: true, placeholder: 'e.g. USD' },
      { key: 'target_currency',label: 'To Currency',   type: 'text',   required: true, placeholder: 'e.g. NGN' },
      { key: 'buy_rate',       label: 'Buy Rate',      type: 'number', required: true, min: 0 },
      { key: 'sell_rate',      label: 'Sell Rate',     type: 'number', required: true, min: 0 },
      { key: 'source_type',    label: 'Source',        type: 'select', required: true, options: ['Bureau de Change','Street','App/Online'] }
    ],
    fuel_price: [
      { key: 'fuel_type', label: 'Fuel Type', type: 'select', required: true, options: ['Petrol (PMS)','Diesel (AGO)','Kerosene (DPK)','Cooking Gas (LPG)','Charcoal'] },
      { key: 'price_per_unit', label: 'Price per Unit', type: 'number', required: true, min: 0 },
      { key: 'unit', label: 'Unit', type: 'select', required: true, options: ['Liter','Kilogram','Bag'] },
      { key: 'station_name', label: 'Station (optional)', type: 'text', required: false }
    ],
    rent: [
      { key: 'property_type', label: 'Property Type', type: 'select', required: true, options: ['Apartment','House','Room','Shop','Office'] },
      { key: 'bedrooms', label: 'Bedrooms', type: 'number', required: true, min: 0 },
      { key: 'rent_amount', label: 'Rent Amount', type: 'number', required: true, min: 0 },
      { key: 'rent_period', label: 'Rent Period', type: 'select', required: true, options: ['Monthly','Annual'] },
      { key: 'is_furnished', label: 'Furnished?', type: 'select', required: true, options: ['Yes','No'] }
    ],
    transport: [
      { key: 'transport_type', label: 'Transport Type', type: 'select', required: true, options: ['Bus','Minibus/Danfo','Motorcycle/Okada','Ride-hail','Train','Ferry','Tricycle/Keke'] },
      { key: 'route_from', label: 'From', type: 'text', required: true, placeholder: 'e.g. Ikeja' },
      { key: 'route_to', label: 'To', type: 'text', required: true, placeholder: 'e.g. Lekki' },
      { key: 'fare', label: 'Fare', type: 'number', required: true, min: 0 },
      { key: 'provider', label: 'Provider (optional)', type: 'text', required: false, placeholder: 'e.g. BRT, Bolt' }
    ],
    salary: [
      { key: 'job_title', label: 'Job Title', type: 'text', required: true },
      { key: 'industry', label: 'Industry', type: 'select', required: true, options: ['Technology','Finance','Healthcare','Education','Oil & Gas','Agriculture','Retail','Manufacturing','Government','NGO/Non-profit','Other'] },
      { key: 'experience_years', label: 'Years of Experience', type: 'number', required: true, min: 0 },
      { key: 'monthly_gross', label: 'Monthly Gross Salary', type: 'number', required: true, min: 0 },
      { key: 'monthly_net', label: 'Monthly Net (optional)', type: 'number', required: false, min: 0 },
      { key: 'company_size', label: 'Company Size', type: 'select', required: true, options: ['1-10','11-50','51-200','200+'] },
      { key: 'sector', label: 'Sector', type: 'select', required: true, options: ['Public','Private','NGO'] }
    ],
    business_cost: [
      { key: 'business_type', label: 'Business Type', type: 'text', required: true, placeholder: 'e.g. Restaurant, Barber Shop' },
      { key: 'cost_category', label: 'Cost Category', type: 'select', required: true, options: ['Rent','Power/Generator','Internet','Staff Wages','Inventory','Transport','Other'] },
      { key: 'monthly_amount', label: 'Monthly Amount', type: 'number', required: true, min: 0 },
      { key: 'business_size', label: 'Business Size', type: 'select', required: true, options: ['Solo','2-5 employees','6-20 employees','20+'] }
    ],
    meal_price: [
      { key: 'meal_name', label: 'Meal/Dish Name', type: 'text', required: true, placeholder: 'e.g. Jollof Rice' },
      { key: 'meal_type', label: 'Meal Type', type: 'select', required: true, options: ['Breakfast','Lunch','Dinner','Snack','Drink'] },
      { key: 'price', label: 'Price', type: 'number', required: true, min: 0 },
      { key: 'venue_type', label: 'Venue Type', type: 'select', required: true, options: ['Street Food','Buka/Local','Restaurant','Fast Food','Hotel'] },
      { key: 'venue_name', label: 'Venue Name (optional)', type: 'text', required: false }
    ],
    fintech_fee: [
      { key: 'provider', label: 'Provider', type: 'select', required: true, options: ['M-Pesa','MTN MoMo','Airtel Money','OPay','PalmPay','Chipper Cash','Bank Transfer','Other'] },
      { key: 'transaction_type', label: 'Transaction Type', type: 'select', required: true, options: ['Transfer','Withdrawal','Deposit','Bill Payment'] },
      { key: 'amount_range', label: 'Amount Range', type: 'select', required: true, options: ['0-1000','1001-5000','5001-20000','20001-100000','100000+'] },
      { key: 'fee_amount', label: 'Fee Amount', type: 'number', required: true, min: 0 }
    ],
    education_cost: [
      { key: 'cost_type', label: 'Cost Type', type: 'select', required: true, options: ['Tuition','Exam Fee','Textbook','Tutoring','Uniform','Transport'] },
      { key: 'education_level', label: 'Education Level', type: 'select', required: true, options: ['Primary','Secondary','University','Postgrad','Vocational'] },
      { key: 'institution_type', label: 'Institution Type', type: 'select', required: true, options: ['Public','Private','International'] },
      { key: 'amount', label: 'Amount', type: 'number', required: true, min: 0 },
      { key: 'period', label: 'Period', type: 'select', required: true, options: ['Term','Semester','Year','One-time'] },
      { key: 'institution_name', label: 'Institution (optional)', type: 'text', required: false }
    ]
  };

  // ── Countries ─────────────────────────────────────────────
  var COUNTRIES = {
    DZ:'Algeria',AO:'Angola',BJ:'Benin',BW:'Botswana',BF:'Burkina Faso',BI:'Burundi',CV:'Cabo Verde',CM:'Cameroon',CF:'Central African Republic',TD:'Chad',KM:'Comoros',CG:'Congo',CD:'DR Congo',DJ:'Djibouti',EG:'Egypt',GQ:'Equatorial Guinea',ER:'Eritrea',SZ:'Eswatini',ET:'Ethiopia',GA:'Gabon',GM:'Gambia',GH:'Ghana',GN:'Guinea',GW:'Guinea-Bissau',CI:"Cote d'Ivoire",KE:'Kenya',LS:'Lesotho',LR:'Liberia',LY:'Libya',MG:'Madagascar',MW:'Malawi',ML:'Mali',MR:'Mauritania',MU:'Mauritius',MA:'Morocco',MZ:'Mozambique',NA:'Namibia',NE:'Niger',NG:'Nigeria',RW:'Rwanda',ST:'Sao Tome and Principe',SN:'Senegal',SC:'Seychelles',SL:'Sierra Leone',SO:'Somalia',ZA:'South Africa',SS:'South Sudan',SD:'Sudan',TZ:'Tanzania',TG:'Togo',TN:'Tunisia',UG:'Uganda',ZM:'Zambia',ZW:'Zimbabwe'
  };

  var CURRENCIES = {
    DZ:'DZD',AO:'AOA',BJ:'XOF',BW:'BWP',BF:'XOF',BI:'BIF',CV:'CVE',CM:'XAF',CF:'XAF',TD:'XAF',KM:'KMF',CG:'XAF',CD:'CDF',DJ:'DJF',EG:'EGP',GQ:'XAF',ER:'ERN',SZ:'SZL',ET:'ETB',GA:'XAF',GM:'GMD',GH:'GHS',GN:'GNF',GW:'XOF',CI:'XOF',KE:'KES',LS:'LSL',LR:'LRD',LY:'LYD',MG:'MGA',MW:'MWK',ML:'XOF',MR:'MRU',MU:'MUR',MA:'MAD',MZ:'MZN',NA:'NAD',NE:'XOF',NG:'NGN',RW:'RWF',ST:'STN',SN:'XOF',SC:'SCR',SL:'SLE',SO:'SOS',ZA:'ZAR',SS:'SSP',SD:'SDG',TZ:'TZS',TG:'XOF',TN:'TND',UG:'UGX',ZM:'ZMW',ZW:'ZWL'
  };

  // ── Rank definitions ──────────────────────────────────────
  var RANKS = [
    { id: 'newcomer',     label: 'Newcomer',     min_points: 0,     min_trust: 0,  color: '#94a3b8' },
    { id: 'contributor',  label: 'Contributor',   min_points: 100,   min_trust: 0,  color: '#22c55e' },
    { id: 'trusted',      label: 'Trusted',       min_points: 500,   min_trust: 70, color: '#3b82f6' },
    { id: 'expert',       label: 'Expert',        min_points: 2000,  min_trust: 85, color: '#a855f7' },
    { id: 'legend',       label: 'Legend',         min_points: 10000, min_trust: 90, color: '#f59e0b' }
  ];

  // ── Points for actions ────────────────────────────────────
  function getSubmissionPoints(category) {
    var cat = CATEGORIES.find(function (c) { return c.id === category; });
    return cat ? cat.points : 5;
  }
  function getConfirmationBonus(category) {
    var cat = CATEGORIES.find(function (c) { return c.id === category; });
    return cat ? cat.bonus : 3;
  }

  // ── Rank calculation ──────────────────────────────────────
  function calculateRank(totalEarned, trustScore) {
    var rank = RANKS[0];
    for (var i = RANKS.length - 1; i >= 0; i--) {
      if (totalEarned >= RANKS[i].min_points && trustScore >= RANKS[i].min_trust) {
        rank = RANKS[i];
        break;
      }
    }
    return rank;
  }

  // ── Streak bonus ──────────────────────────────────────────
  function getStreakBonus(streak) {
    if (streak >= 30) return 100;
    if (streak >= 7) return 20;
    if (streak >= 3) return 5;
    return 0;
  }

  // ── Trust score adjustment ────────────────────────────────
  function adjustTrust(currentTrust, confirmed) {
    if (confirmed) return Math.min(100, currentTrust + 1);
    return Math.max(0, currentTrust - 5);
  }

  // ── Anti-fraud: rate limit check (client-side hint) ───────
  var DAILY_LIMIT = 20;
  var COOLDOWN_MS = 24 * 60 * 60 * 1000;

  // ── Format helpers ────────────────────────────────────────
  function formatPoints(n) {
    if (n >= 10000) return (n / 1000).toFixed(1) + 'k';
    return n.toLocaleString();
  }
  function formatCash(points) {
    return '$' + (points / 100).toFixed(2);
  }

  // ── API calls via Netlify functions ───────────────────────
  var API_BASE = '/.netlify/functions';

  function getAuthHeaders() {
    var token = window.AfroAuth && AfroAuth.getSessionToken ? AfroAuth.getSessionToken() : null;
    var h = { 'Content-Type': 'application/json' };
    if (token) h['Authorization'] = 'Bearer ' + token;
    return h;
  }

  async function submitContribution(data) {
    var res = await fetch(API_BASE + '/afropoints-submit', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  }

  async function getProfile() {
    var ck = 'ap_profile';
    var cached = getCached(ck);
    if (cached) return cached;
    var res = await fetch(API_BASE + '/afropoints-profile', { headers: getAuthHeaders() });
    var data = await res.json();
    if (data && !data.error) setCached(ck, data);
    return data;
  }

  async function getLeaderboard(scope, period) {
    scope = scope || 'global';
    period = period || 'all_time';
    var ck = 'ap_lb_' + scope + '_' + period;
    var cached = getCached(ck);
    if (cached) return cached;
    var res = await fetch(API_BASE + '/afropoints-leaderboard?scope=' + encodeURIComponent(scope) + '&period=' + encodeURIComponent(period), { headers: getAuthHeaders() });
    var data = await res.json();
    if (Array.isArray(data)) setCached(ck, data);
    return data;
  }

  async function getActivity(limit) {
    limit = limit || 10;
    var res = await fetch(API_BASE + '/afropoints-profile?action=activity&limit=' + limit, { headers: getAuthHeaders() });
    return res.json();
  }

  async function getBadges() {
    var ck = 'ap_badges';
    var cached = getCached(ck);
    if (cached) return cached;
    var res = await fetch(API_BASE + '/afropoints-profile?action=badges', { headers: getAuthHeaders() });
    var data = await res.json();
    if (Array.isArray(data)) setCached(ck, data);
    return data;
  }

  async function requestCashout(method, details, points) {
    var res = await fetch(API_BASE + '/afropoints-cashout', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ method: method, details: details, points_amount: points })
    });
    return res.json();
  }

  async function getCashoutHistory() {
    var res = await fetch(API_BASE + '/afropoints-cashout?action=history', { headers: getAuthHeaders() });
    return res.json();
  }

  // ── Public API ────────────────────────────────────────────
  return {
    CATEGORIES: CATEGORIES,
    CATEGORY_FIELDS: CATEGORY_FIELDS,
    COUNTRIES: COUNTRIES,
    CURRENCIES: CURRENCIES,
    RANKS: RANKS,
    DAILY_LIMIT: DAILY_LIMIT,

    getSubmissionPoints: getSubmissionPoints,
    getConfirmationBonus: getConfirmationBonus,
    calculateRank: calculateRank,
    getStreakBonus: getStreakBonus,
    adjustTrust: adjustTrust,
    formatPoints: formatPoints,
    formatCash: formatCash,

    submitContribution: submitContribution,
    getProfile: getProfile,
    getLeaderboard: getLeaderboard,
    getActivity: getActivity,
    getBadges: getBadges,
    requestCashout: requestCashout,
    getCashoutHistory: getCashoutHistory,

    getCategoryById: function (id) { return CATEGORIES.find(function (c) { return c.id === id; }); },
    getFieldsForCategory: function (id) { return CATEGORY_FIELDS[id] || []; },
    getCountryName: function (code) { return COUNTRIES[code] || code; },
    getCurrency: function (code) { return CURRENCIES[code] || 'USD'; },
    getRankInfo: function (id) { return RANKS.find(function (r) { return r.id === id; }) || RANKS[0]; }
  };
})();
