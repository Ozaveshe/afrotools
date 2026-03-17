/**
 * AfroIdeas Engine v2 — Supabase-powered Business Idea Database
 * 11,000+ ideas across 20 sectors and 54 African countries
 * Queries Supabase directly using the auth client.
 */
var AfroIdeasEngine = (function () {
  'use strict';

  var SECTORS = [
    { id: "transportation", name: "Transportation & Logistics", icon: "\uD83D\uDE9B", color: "#2563eb" },
    { id: "agriculture", name: "Agriculture & Agribusiness", icon: "\uD83C\uDF3E", color: "#16a34a" },
    { id: "food", name: "Food & Beverage", icon: "\uD83C\uDF7D\uFE0F", color: "#ea580c" },
    { id: "technology", name: "Technology & Digital Services", icon: "\uD83D\uDCBB", color: "#7c3aed" },
    { id: "retail", name: "Retail & E-commerce", icon: "\uD83D\uDED2", color: "#0891b2" },
    { id: "fintech", name: "Financial Services & Fintech", icon: "\uD83D\uDCB3", color: "#4f46e5" },
    { id: "construction", name: "Construction & Real Estate", icon: "\uD83C\uDFD7\uFE0F", color: "#b45309" },
    { id: "health", name: "Healthcare & Wellness", icon: "\uD83C\uDFE5", color: "#dc2626" },
    { id: "education", name: "Education & Training", icon: "\uD83C\uDF93", color: "#0d9488" },
    { id: "energy", name: "Energy & Utilities", icon: "\u26A1", color: "#ca8a04" },
    { id: "fashion", name: "Fashion & Textiles", icon: "\uD83D\uDC57", color: "#be185d" },
    { id: "tourism", name: "Tourism & Hospitality", icon: "\uD83C\uDFE8", color: "#059669" },
    { id: "media", name: "Media & Creative", icon: "\uD83C\uDFAC", color: "#9333ea" },
    { id: "manufacturing", name: "Manufacturing & Processing", icon: "\uD83C\uDFED", color: "#64748b" },
    { id: "services", name: "Professional Services", icon: "\uD83D\uDCBC", color: "#334155" },
    { id: "mining", name: "Mining & Natural Resources", icon: "\u26CF\uFE0F", color: "#78716c" },
    { id: "beauty", name: "Beauty & Personal Care", icon: "\u2728", color: "#ec4899" },
    { id: "logistics", name: "Warehousing & Supply Chain", icon: "\uD83C\uDFE0", color: "#0369a1" },
    { id: "waste", name: "Waste Management & Recycling", icon: "\u267B\uFE0F", color: "#059669" },
    { id: "telecom", name: "Telecommunications", icon: "\uD83D\uDCF6", color: "#6366f1" }
  ];

  var COUNTRIES = [
    { code: "NG", name: "Nigeria", currency: "NGN", symbol: "\u20A6" },
    { code: "KE", name: "Kenya", currency: "KES", symbol: "KSh" },
    { code: "ZA", name: "South Africa", currency: "ZAR", symbol: "R" },
    { code: "GH", name: "Ghana", currency: "GHS", symbol: "GH\u20B5" },
    { code: "ET", name: "Ethiopia", currency: "ETB", symbol: "Br" },
    { code: "EG", name: "Egypt", currency: "EGP", symbol: "E\u00A3" },
    { code: "TZ", name: "Tanzania", currency: "TZS", symbol: "TSh" },
    { code: "UG", name: "Uganda", currency: "UGX", symbol: "USh" },
    { code: "RW", name: "Rwanda", currency: "RWF", symbol: "RF" },
    { code: "SN", name: "Senegal", currency: "XOF", symbol: "CFA" },
    { code: "CI", name: "Cote d'Ivoire", currency: "XOF", symbol: "CFA" },
    { code: "CM", name: "Cameroon", currency: "XAF", symbol: "FCFA" },
    { code: "CD", name: "DR Congo", currency: "CDF", symbol: "FC" },
    { code: "MZ", name: "Mozambique", currency: "MZN", symbol: "MT" },
    { code: "MA", name: "Morocco", currency: "MAD", symbol: "MAD" },
    { code: "AO", name: "Angola", currency: "AOA", symbol: "Kz" },
    { code: "MG", name: "Madagascar", currency: "MGA", symbol: "Ar" },
    { code: "MW", name: "Malawi", currency: "MWK", symbol: "MK" },
    { code: "ZM", name: "Zambia", currency: "ZMW", symbol: "ZK" },
    { code: "ZW", name: "Zimbabwe", currency: "ZWL", symbol: "Z$" },
    { code: "ML", name: "Mali", currency: "XOF", symbol: "CFA" },
    { code: "BF", name: "Burkina Faso", currency: "XOF", symbol: "CFA" },
    { code: "NE", name: "Niger", currency: "XOF", symbol: "CFA" },
    { code: "TD", name: "Chad", currency: "XAF", symbol: "FCFA" },
    { code: "GN", name: "Guinea", currency: "GNF", symbol: "FG" },
    { code: "BJ", name: "Benin", currency: "XOF", symbol: "CFA" },
    { code: "TG", name: "Togo", currency: "XOF", symbol: "CFA" },
    { code: "SL", name: "Sierra Leone", currency: "SLE", symbol: "Le" },
    { code: "LR", name: "Liberia", currency: "LRD", symbol: "L$" },
    { code: "MR", name: "Mauritania", currency: "MRU", symbol: "UM" },
    { code: "ER", name: "Eritrea", currency: "ERN", symbol: "Nfk" },
    { code: "GM", name: "Gambia", currency: "GMD", symbol: "D" },
    { code: "BW", name: "Botswana", currency: "BWP", symbol: "P" },
    { code: "NA", name: "Namibia", currency: "NAD", symbol: "N$" },
    { code: "GA", name: "Gabon", currency: "XAF", symbol: "FCFA" },
    { code: "LS", name: "Lesotho", currency: "LSL", symbol: "M" },
    { code: "GW", name: "Guinea-Bissau", currency: "XOF", symbol: "CFA" },
    { code: "GQ", name: "Equatorial Guinea", currency: "XAF", symbol: "FCFA" },
    { code: "MU", name: "Mauritius", currency: "MUR", symbol: "Rs" },
    { code: "SZ", name: "Eswatini", currency: "SZL", symbol: "E" },
    { code: "DJ", name: "Djibouti", currency: "DJF", symbol: "Fdj" },
    { code: "CV", name: "Cape Verde", currency: "CVE", symbol: "$" },
    { code: "CF", name: "Central African Republic", currency: "XAF", symbol: "FCFA" },
    { code: "CG", name: "Republic of Congo", currency: "XAF", symbol: "FCFA" },
    { code: "KM", name: "Comoros", currency: "KMF", symbol: "CF" },
    { code: "ST", name: "Sao Tome and Principe", currency: "STN", symbol: "Db" },
    { code: "SC", name: "Seychelles", currency: "SCR", symbol: "SR" },
    { code: "SD", name: "Sudan", currency: "SDG", symbol: "SDG" },
    { code: "SS", name: "South Sudan", currency: "SSP", symbol: "SSP" },
    { code: "SO", name: "Somalia", currency: "SOS", symbol: "Sh" },
    { code: "LY", name: "Libya", currency: "LYD", symbol: "LD" },
    { code: "TN", name: "Tunisia", currency: "TND", symbol: "DT" },
    { code: "DZ", name: "Algeria", currency: "DZD", symbol: "DA" },
    { code: "BI", name: "Burundi", currency: "BIF", symbol: "FBu" }
  ];

  // Cache
  var _sb = null;
  var _cache = {};
  var _cacheTime = {};
  var CACHE_TTL = 5 * 60 * 1000; // 5 min

  function _getSupabase() {
    if (_sb) return _sb;
    if (window.AfroAuth && typeof AfroAuth.getSupabase === 'function') {
      _sb = AfroAuth.getSupabase();
    } else if (window.supabase && window.supabase.createClient) {
      _sb = window.supabase.createClient(
        'https://zpclagtgczsygrgztlts.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpwY2xhZ3RnY3pzeWdyZ3p0bHRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0NTg4MzIsImV4cCI6MjA4OTAzNDgzMn0._G-677vi2UTAhcU3t0aquvmd8lnQUBil53ok_Z623F0'
      );
    }
    return _sb;
  }

  function _cacheKey(params) {
    return JSON.stringify(params);
  }

  function _getCached(key) {
    if (_cache[key] && Date.now() - _cacheTime[key] < CACHE_TTL) return _cache[key];
    return null;
  }

  function _setCache(key, data) {
    _cache[key] = data;
    _cacheTime[key] = Date.now();
  }

  // Format currency amount
  function formatCurrency(amount, currencyCode) {
    var c = COUNTRIES.find(function (x) { return x.currency === currencyCode; });
    var sym = c ? c.symbol : currencyCode;
    if (amount >= 1000000000) return sym + (amount / 1000000000).toFixed(1) + 'B';
    if (amount >= 1000000) return sym + (amount / 1000000).toFixed(1) + 'M';
    if (amount >= 1000) return sym + (amount / 1000).toFixed(0) + 'K';
    return sym + amount;
  }

  /**
   * Query ideas from Supabase
   * @param {Object} params
   * @param {string} params.countryCode - e.g. "NG"
   * @param {string} [params.sector] - e.g. "food" or "all"
   * @param {number} [params.maxBudget] - filter by startup_cost_max
   * @param {string} [params.riskLevel] - "low","medium","high" or "all"
   * @param {string} [params.sortBy] - "breakeven","cost","revenue","votes","newest"
   * @param {string} [params.search] - text search
   * @param {number} [params.page] - page number (1-based)
   * @param {number} [params.pageSize] - default 24
   * @param {string} [params.source] - "seed","community","all" (default "all")
   * @returns {Promise<{ideas: Array, total: number, page: number, pages: number}>}
   */
  async function filterIdeas(params) {
    var sb = _getSupabase();
    if (!sb) return { ideas: [], total: 0, page: 1, pages: 0 };

    var cc = params.countryCode || 'NG';
    var page = params.page || 1;
    var pageSize = params.pageSize || 24;
    var offset = (page - 1) * pageSize;

    // Check cache
    var ck = _cacheKey(params);
    var cached = _getCached(ck);
    if (cached) return cached;

    // Build combined query across both tables
    var results = [];
    var total = 0;

    // Query seeded ideas
    if (!params.source || params.source === 'all' || params.source === 'seed') {
      var q = sb.from('business_ideas').select('*', { count: 'exact' });
      q = q.eq('country_code', cc);
      if (params.sector && params.sector !== 'all') q = q.eq('sector', params.sector);
      if (params.riskLevel && params.riskLevel !== 'all') q = q.eq('risk', params.riskLevel);
      if (params.maxBudget) q = q.lte('startup_cost_min', params.maxBudget);
      if (params.search) q = q.textSearch('fts', params.search);

      // Sort
      var sortBy = params.sortBy || 'breakeven';
      if (sortBy === 'breakeven') q = q.order('breakeven_months_min', { ascending: true });
      else if (sortBy === 'cost') q = q.order('startup_cost_min', { ascending: true });
      else if (sortBy === 'revenue') q = q.order('monthly_revenue_max', { ascending: false });
      else if (sortBy === 'votes') q = q.order('vote_count', { ascending: false });
      else if (sortBy === 'newest') q = q.order('created_at', { ascending: false });

      q = q.range(offset, offset + pageSize - 1);

      var res = await q;
      if (res.data) results = results.concat(res.data);
      if (res.count != null) total += res.count;
    }

    // Query community ideas
    if (params.source === 'all' || params.source === 'community') {
      var cq = sb.from('community_ideas').select('*', { count: 'exact' });
      cq = cq.eq('country_code', cc).eq('status', 'published');
      if (params.sector && params.sector !== 'all') cq = cq.eq('sector', params.sector);
      if (params.riskLevel && params.riskLevel !== 'all') cq = cq.eq('risk', params.riskLevel);
      if (params.maxBudget) cq = cq.lte('startup_cost_min', params.maxBudget);

      cq = cq.order('vote_count', { ascending: false });
      cq = cq.range(0, pageSize - 1);

      var cres = await cq;
      if (cres.data) results = results.concat(cres.data.map(function (r) { r._community = true; return r; }));
      if (cres.count != null) total += cres.count;
    }

    var out = {
      ideas: results,
      total: total,
      page: page,
      pages: Math.ceil(total / pageSize)
    };
    _setCache(ck, out);
    return out;
  }

  /**
   * Get a single idea by ID
   */
  async function getIdea(id) {
    var sb = _getSupabase();
    if (!sb) return null;
    var res = await sb.from('business_ideas').select('*').eq('id', id).single();
    if (res.data) return res.data;
    // Try community
    var cres = await sb.from('community_ideas').select('*').eq('id', id).single();
    if (cres.data) { cres.data._community = true; return cres.data; }
    return null;
  }

  /**
   * Get total count for a country
   */
  async function getCountForCountry(cc) {
    var sb = _getSupabase();
    if (!sb) return 0;
    var res = await sb.from('business_ideas').select('id', { count: 'exact', head: true }).eq('country_code', cc);
    return res.count || 0;
  }

  /**
   * Submit community idea (requires auth)
   */
  async function submitIdea(ideaData) {
    var sb = _getSupabase();
    if (!sb) throw new Error('Not connected');
    var user = (await sb.auth.getUser()).data.user;
    if (!user) throw new Error('Must be signed in to submit ideas');

    var row = {
      user_id: user.id,
      name: ideaData.name,
      sector: ideaData.sector,
      country_code: ideaData.countryCode,
      country_name: ideaData.countryName,
      cost_tier: ideaData.costTier,
      risk: ideaData.risk,
      description: ideaData.description,
      why_africa: ideaData.whyAfrica || '',
      revenue_model: ideaData.revenueModel || '',
      risks: ideaData.risks || [],
      startup_cost_min: ideaData.startupCostMin || 0,
      startup_cost_max: ideaData.startupCostMax || 0,
      currency: ideaData.currency,
      monthly_revenue_min: ideaData.monthlyRevenueMin || 0,
      monthly_revenue_max: ideaData.monthlyRevenueMax || 0,
      breakeven_months_min: ideaData.breakevenMin || 0,
      breakeven_months_max: ideaData.breakevenMax || 0,
      best_cities: ideaData.bestCities || [],
      tags: ideaData.tags || [],
      user_display_name: user.user_metadata && user.user_metadata.full_name || user.email.split('@')[0],
      status: 'published'
    };

    var res = await sb.from('community_ideas').insert(row).select().single();
    if (res.error) throw new Error(res.error.message);
    _cache = {}; // clear cache
    return res.data;
  }

  /**
   * Vote on an idea
   */
  async function voteIdea(ideaId, voteType, isCommunity) {
    var sb = _getSupabase();
    if (!sb) throw new Error('Not connected');
    var user = (await sb.auth.getUser()).data.user;
    if (!user) throw new Error('Must be signed in to vote');

    var col = isCommunity ? 'community_idea_id' : 'idea_id';
    // Upsert: delete existing vote then insert new one
    await sb.from('idea_votes').delete().eq('user_id', user.id).eq(col, ideaId);
    var row = { user_id: user.id, vote_type: voteType };
    row[col] = ideaId;
    var res = await sb.from('idea_votes').insert(row);
    if (res.error) throw new Error(res.error.message);
    _cache = {};
    return true;
  }

  /**
   * Save/unsave an idea
   */
  async function toggleSave(ideaId, isCommunity) {
    var sb = _getSupabase();
    if (!sb) throw new Error('Not connected');
    var user = (await sb.auth.getUser()).data.user;
    if (!user) throw new Error('Must be signed in to save ideas');

    var col = isCommunity ? 'community_idea_id' : 'idea_id';
    // Check if already saved
    var check = await sb.from('idea_saves').select('id').eq('user_id', user.id).eq(col, ideaId);
    if (check.data && check.data.length > 0) {
      await sb.from('idea_saves').delete().eq('id', check.data[0].id);
      return false; // unsaved
    }
    var row = { user_id: user.id };
    row[col] = ideaId;
    await sb.from('idea_saves').insert(row);
    return true; // saved
  }

  /**
   * Get user's saved idea IDs
   */
  async function getSavedIds() {
    var sb = _getSupabase();
    if (!sb) return [];
    var user = (await sb.auth.getUser()).data.user;
    if (!user) return [];
    var res = await sb.from('idea_saves').select('idea_id,community_idea_id').eq('user_id', user.id);
    if (!res.data) return [];
    return res.data.map(function (r) { return r.idea_id || r.community_idea_id; });
  }

  /**
   * Get user's votes
   */
  async function getUserVotes() {
    var sb = _getSupabase();
    if (!sb) return {};
    var user = (await sb.auth.getUser()).data.user;
    if (!user) return {};
    var res = await sb.from('idea_votes').select('idea_id,community_idea_id,vote_type').eq('user_id', user.id);
    if (!res.data) return {};
    var map = {};
    res.data.forEach(function (v) { map[v.idea_id || v.community_idea_id] = v.vote_type; });
    return map;
  }

  // Public API
  return {
    getSectors: function () { return SECTORS; },
    getCountries: function () { return COUNTRIES; },
    getCountry: function (code) { return COUNTRIES.find(function (c) { return c.code === code; }); },
    getSector: function (id) { return SECTORS.find(function (s) { return s.id === id; }); },
    formatCurrency: formatCurrency,
    filterIdeas: filterIdeas,
    getIdea: getIdea,
    getCountForCountry: getCountForCountry,
    submitIdea: submitIdea,
    voteIdea: voteIdea,
    toggleSave: toggleSave,
    getSavedIds: getSavedIds,
    getUserVotes: getUserVotes,
    getSectorCount: function () { return SECTORS.length; },
    getTotalIdeas: function () { return 11016; }
  };
})();
