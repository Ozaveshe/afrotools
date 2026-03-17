/**
 * AfroPrices Engine v1 — AI-Powered Price Comparison for Africa
 * Coordinates across Supabase product DB, affiliate APIs, and community prices.
 * Supports 10 African countries with platforms, physical markets, and categories.
 */
var AfroPricesEngine = (function () {
  'use strict';

  // ============================================
  // SUPABASE CLIENT
  // ============================================
  var _sb = null;

  function _getSupabase() {
    if (_sb) return _sb;
    if (window.AfroAuth && typeof AfroAuth.getSupabase === 'function') {
      _sb = AfroAuth.getSupabase();
    } else if (window.supabase && window.supabase.createClient) {
      _sb = window.supabase.createClient(
        'https://jbmhfpkzbgyeodsqhprx.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpibWhmcGt6Ymd5ZW9kc3FocHJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIxMTY2MDcsImV4cCI6MjA1NzY5MjYwN30.gVLMsMVjqEMOCMCFnPBHaf8njEhNPGUB2v3XnDnlqSM'
      );
    }
    return _sb;
  }

  // ============================================
  // IN-MEMORY CACHE
  // ============================================
  var _cache = {};
  var CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours

  function _getCached(key) {
    var entry = _cache[key];
    if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.data;
    return null;
  }

  function _setCache(key, data) {
    _cache[key] = { data: data, ts: Date.now() };
  }

  // ============================================
  // SUPPORTED COUNTRIES + PLATFORMS
  // ============================================
  var countries = {
    "NG": {
      name: "Nigeria",
      flag: "🇳🇬",
      currency: { code: "NGN", symbol: "₦" },
      platforms: [
        { name: "Jumia Nigeria", url: "https://www.jumia.com.ng", type: "affiliate", hasApi: true, affiliate: "jumia", logo: "jumia" },
        { name: "Konga", url: "https://www.konga.com", type: "affiliate", hasApi: true, affiliate: "konga", logo: "konga" },
        { name: "Slot Systems", url: "https://www.slot.ng", type: "retail", hasApi: false, logo: "slot" },
        { name: "Pointek", url: "https://www.pointekonline.com", type: "retail", hasApi: false, logo: "pointek" },
        { name: "3CHub", url: "https://www.3chub.com", type: "retail", hasApi: false, logo: "3chub" }
      ],
      physicalMarkets: [
        { name: "Computer Village, Ikeja", city: "Lagos", speciality: "electronics", tip: "Africa's largest electronics market. Prices 10-30% below retail. Bargain hard. Check warranty carefully.", lat: 6.6018, lng: 3.3515 },
        { name: "Alaba International Market", city: "Lagos", speciality: "electronics", tip: "Wholesale electronics. Best for bulk. Beware of refurbished items sold as new.", lat: 6.4631, lng: 3.3108 },
        { name: "Onitsha Main Market", city: "Onitsha", speciality: "general", tip: "West Africa's largest market by volume. Everything available.", lat: 6.1441, lng: 6.7886 },
        { name: "Wuse Market", city: "Abuja", speciality: "general", tip: "Abuja's main commercial market. Good variety.", lat: 9.0765, lng: 7.4898 },
        { name: "Ariaria International Market", city: "Aba", speciality: "fashion, shoes", tip: "Shoe capital of Nigeria. Great for leather goods and fashion.", lat: 5.1067, lng: 7.3667 }
      ]
    },
    "KE": {
      name: "Kenya",
      flag: "🇰🇪",
      currency: { code: "KES", symbol: "KSh" },
      platforms: [
        { name: "Jumia Kenya", url: "https://www.jumia.co.ke", type: "affiliate", hasApi: true, affiliate: "jumia", logo: "jumia" },
        { name: "Kilimall", url: "https://www.kilimall.co.ke", type: "affiliate", hasApi: true, affiliate: "kilimall", logo: "kilimall" },
        { name: "Masoko (Safaricom)", url: "https://www.masoko.com", type: "retail", hasApi: false, logo: "masoko" },
        { name: "Phoneplace Kenya", url: "https://phoneplace.co.ke", type: "retail", hasApi: false, logo: "phoneplace" }
      ],
      physicalMarkets: [
        { name: "Luthuli Avenue", city: "Nairobi", speciality: "electronics", tip: "Nairobi's electronics hub. Many shops side by side — compare at least 3 before buying." },
        { name: "Gikomba Market", city: "Nairobi", speciality: "fashion, second-hand", tip: "Biggest second-hand market in East Africa. Amazing deals on clothes." },
        { name: "Nyamakima", city: "Nairobi", speciality: "general wholesale", tip: "Wholesale electronics and general goods. Cash preferred." }
      ]
    },
    "GH": {
      name: "Ghana",
      flag: "🇬🇭",
      currency: { code: "GHS", symbol: "GH₵" },
      platforms: [
        { name: "Jumia Ghana", url: "https://www.jumia.com.gh", type: "affiliate", hasApi: true, affiliate: "jumia", logo: "jumia" },
        { name: "Tonaton", url: "https://tonaton.com", type: "classifieds", hasApi: false, logo: "tonaton" },
        { name: "Jiji Ghana", url: "https://jiji.com.gh", type: "classifieds", hasApi: false, logo: "jiji" }
      ],
      physicalMarkets: [
        { name: "Makola Market", city: "Accra", speciality: "general", tip: "Accra's iconic central market. Everything from electronics to food." },
        { name: "Kwame Nkrumah Circle", city: "Accra", speciality: "electronics", tip: "Hub for electronics and phone accessories." },
        { name: "Kejetia Market", city: "Kumasi", speciality: "general", tip: "Largest open-air market in West Africa." }
      ]
    },
    "ZA": {
      name: "South Africa",
      flag: "🇿🇦",
      currency: { code: "ZAR", symbol: "R" },
      platforms: [
        { name: "Takealot", url: "https://www.takealot.com", type: "affiliate", hasApi: true, affiliate: "takealot", logo: "takealot" },
        { name: "Bob Shop", url: "https://www.bobshop.co.za", type: "retail", hasApi: false, logo: "bobshop" },
        { name: "Makro", url: "https://www.makro.co.za", type: "retail", hasApi: false, logo: "makro" },
        { name: "Game", url: "https://www.game.co.za", type: "retail", hasApi: false, logo: "game" },
        { name: "PriceCheck", url: "https://www.pricecheck.co.za", type: "aggregator", hasApi: false, logo: "pricecheck" }
      ],
      physicalMarkets: [
        { name: "China Mall", city: "Johannesburg", speciality: "electronics, general", tip: "Budget electronics and general goods. Quality varies." },
        { name: "Oriental Plaza", city: "Johannesburg", speciality: "general", tip: "Historic market with a wide variety of goods." }
      ]
    },
    "EG": {
      name: "Egypt",
      flag: "🇪🇬",
      currency: { code: "EGP", symbol: "E£" },
      platforms: [
        { name: "Jumia Egypt", url: "https://www.jumia.com.eg", type: "affiliate", hasApi: true, affiliate: "jumia", logo: "jumia" },
        { name: "Amazon Egypt", url: "https://www.amazon.eg", type: "retail", hasApi: false, logo: "amazon" },
        { name: "Noon Egypt", url: "https://www.noon.com/egypt-en", type: "retail", hasApi: false, logo: "noon" },
        { name: "B.Tech", url: "https://btech.com", type: "retail", hasApi: false, logo: "btech" }
      ],
      physicalMarkets: [
        { name: "Khan el-Khalili", city: "Cairo", speciality: "general, souvenirs", tip: "Historic bazaar. Great for souvenirs and traditional goods." },
        { name: "Ataba Market", city: "Cairo", speciality: "electronics", tip: "Cairo's electronics hub. Compare prices carefully." }
      ]
    },
    "TZ": {
      name: "Tanzania",
      flag: "🇹🇿",
      currency: { code: "TZS", symbol: "TSh" },
      platforms: [
        { name: "Jumia Tanzania", url: "https://www.jumia.co.tz", type: "affiliate", hasApi: true, affiliate: "jumia", logo: "jumia" },
        { name: "Kupatana", url: "https://kupatana.com", type: "classifieds", hasApi: false, logo: "kupatana" }
      ],
      physicalMarkets: [
        { name: "Kariakoo Market", city: "Dar es Salaam", speciality: "general, electronics", tip: "Dar's largest market. Very crowded but amazing variety." }
      ]
    },
    "MA": {
      name: "Morocco",
      flag: "🇲🇦",
      currency: { code: "MAD", symbol: "MAD" },
      platforms: [
        { name: "Jumia Maroc", url: "https://www.jumia.ma", type: "affiliate", hasApi: true, affiliate: "jumia", logo: "jumia" },
        { name: "Avito", url: "https://www.avito.ma", type: "classifieds", hasApi: false, logo: "avito" },
        { name: "Electroplanet", url: "https://www.electroplanet.ma", type: "retail", hasApi: false, logo: "electroplanet" }
      ],
      physicalMarkets: [
        { name: "Derb Ghallef", city: "Casablanca", speciality: "electronics, general", tip: "Casablanca's electronics souk. Cash only, bargain expected." }
      ]
    },
    "UG": {
      name: "Uganda",
      flag: "🇺🇬",
      currency: { code: "UGX", symbol: "USh" },
      platforms: [
        { name: "Jumia Uganda", url: "https://www.jumia.ug", type: "affiliate", hasApi: true, affiliate: "jumia", logo: "jumia" },
        { name: "Jiji Uganda", url: "https://jiji.ug", type: "classifieds", hasApi: false, logo: "jiji" }
      ],
      physicalMarkets: [
        { name: "Kikuubo", city: "Kampala", speciality: "general wholesale", tip: "Kampala's main trading hub. Wholesale prices available." },
        { name: "Wandegeya", city: "Kampala", speciality: "electronics", tip: "Good for phones and electronics near Makerere University." }
      ]
    },
    "RW": {
      name: "Rwanda",
      flag: "🇷🇼",
      currency: { code: "RWF", symbol: "FRw" },
      platforms: [
        { name: "HeHe", url: "https://hfrw.com", type: "retail", hasApi: false, logo: "hehe" },
        { name: "Murukali", url: "https://murukali.com", type: "retail", hasApi: false, logo: "murukali" }
      ],
      physicalMarkets: [
        { name: "Kimironko Market", city: "Kigali", speciality: "general", tip: "Kigali's main market. Clean and well-organised." }
      ]
    },
    "CI": {
      name: "Côte d'Ivoire",
      flag: "🇨🇮",
      currency: { code: "XOF", symbol: "FCFA" },
      platforms: [
        { name: "Jumia Côte d'Ivoire", url: "https://www.jumia.ci", type: "affiliate", hasApi: true, affiliate: "jumia", logo: "jumia" }
      ],
      physicalMarkets: [
        { name: "Marché de Treichville", city: "Abidjan", speciality: "general", tip: "Abidjan's central market district." },
        { name: "Marché d'Adjamé", city: "Abidjan", speciality: "electronics, general", tip: "Electronics and general goods. Very busy." }
      ]
    }
  };

  // ============================================
  // PRODUCT CATEGORIES
  // ============================================
  var categories = [
    { id: "phones", name: "Phones & Tablets", icon: "📱", subcategories: ["Smartphones", "Feature Phones", "Tablets", "Phone Accessories", "Screen Protectors & Cases"] },
    { id: "electronics", name: "Electronics", icon: "💻", subcategories: ["Laptops", "TVs", "Speakers & Audio", "Gaming", "Cameras", "Computer Accessories"] },
    { id: "appliances", name: "Home Appliances", icon: "🏠", subcategories: ["Generators", "Solar Panels & Inverters", "Refrigerators", "Air Conditioners", "Washing Machines", "Kitchen Appliances", "Fans"] },
    { id: "fashion", name: "Fashion", icon: "👗", subcategories: ["Men's Clothing", "Women's Clothing", "Shoes", "Bags", "Watches", "Jewelry", "African Fashion / Ankara"] },
    { id: "groceries", name: "Groceries & Food", icon: "🛒", subcategories: ["Staples (Rice, Garri, Maize)", "Cooking Oil", "Beverages", "Baby Food", "Snacks"] },
    { id: "health", name: "Health & Beauty", icon: "💊", subcategories: ["Skincare", "Hair Care", "Supplements", "Pharmaceuticals", "Personal Care"] },
    { id: "building", name: "Building Materials", icon: "🧱", subcategories: ["Cement", "Roofing Sheets", "Iron Rods", "Paint", "Plumbing", "Electrical Fittings", "Tiles"] },
    { id: "automotive", name: "Automotive", icon: "🚗", subcategories: ["Car Parts", "Tyres", "Car Electronics", "Lubricants"] }
  ];

  // ============================================
  // MOCK DATA (for development before affiliate APIs)
  // ============================================
  var MOCK_PRODUCTS = {
    "NG": [
      { name: "Samsung Galaxy A15 (128GB)", brand: "Samsung", category: "phones", image: "", listings: [
        { source: "Jumia Nigeria", type: "affiliate", price: 142000, currency: "NGN", inStock: true, url: "https://www.jumia.com.ng/samsung-galaxy-a15", delivery: "2-5 days", rating: 4.2 },
        { source: "Konga", type: "affiliate", price: 138500, currency: "NGN", inStock: true, url: "https://www.konga.com/samsung-galaxy-a15", delivery: "3-7 days", rating: 4.0 },
        { source: "Slot Systems", type: "retail", price: 145000, currency: "NGN", inStock: true, url: "https://www.slot.ng" },
        { source: "Computer Village, Ikeja", type: "market", priceMin: 125000, priceMax: 135000, currency: "NGN", tip: "Bargain expected. Cash only." }
      ]},
      { name: "iPhone 15 (128GB)", brand: "Apple", category: "phones", image: "", listings: [
        { source: "Jumia Nigeria", type: "affiliate", price: 850000, currency: "NGN", inStock: true, url: "https://www.jumia.com.ng/iphone-15" },
        { source: "Slot Systems", type: "retail", price: 830000, currency: "NGN", inStock: true, url: "https://www.slot.ng" },
        { source: "Computer Village, Ikeja", type: "market", priceMin: 750000, priceMax: 800000, currency: "NGN", tip: "Ensure box is sealed. Check IMEI." }
      ]},
      { name: "Tecno Spark 20 Pro+", brand: "Tecno", category: "phones", image: "", listings: [
        { source: "Jumia Nigeria", type: "affiliate", price: 165000, currency: "NGN", inStock: true, url: "https://www.jumia.com.ng/tecno-spark-20-pro" },
        { source: "Konga", type: "affiliate", price: 162000, currency: "NGN", inStock: true, url: "https://www.konga.com/tecno-spark-20-pro" },
        { source: "Computer Village, Ikeja", type: "market", priceMin: 145000, priceMax: 155000, currency: "NGN" }
      ]},
      { name: 'HP Laptop 15 (Intel i5, 8GB RAM)', brand: 'HP', category: 'electronics', image: '', listings: [
        { source: 'Jumia Nigeria', type: 'affiliate', price: 450000, currency: 'NGN', inStock: true, url: 'https://www.jumia.com.ng/hp-laptop-15' },
        { source: 'Slot Systems', type: 'retail', price: 465000, currency: 'NGN', inStock: true },
        { source: 'Computer Village, Ikeja', type: 'market', priceMin: 380000, priceMax: 420000, currency: 'NGN', tip: 'Check for warranty card.' }
      ]},
      { name: "Hisense 43\" Smart TV", brand: "Hisense", category: "electronics", image: "", listings: [
        { source: "Jumia Nigeria", type: "affiliate", price: 225000, currency: "NGN", inStock: true, url: "https://www.jumia.com.ng/hisense-43-smart-tv" },
        { source: "Konga", type: "affiliate", price: 218000, currency: "NGN", inStock: true }
      ]},
      { name: "Dangote Cement (50kg bag)", brand: "Dangote", category: "building", image: "", listings: [
        { source: "Retail", type: "retail", price: 7500, currency: "NGN", inStock: true },
        { source: "Onitsha Main Market", type: "market", priceMin: 6800, priceMax: 7200, currency: "NGN", tip: "Wholesale prices for 100+ bags." }
      ]},
      { name: "Elepaq 3.5KVA Generator", brand: "Elepaq", category: "appliances", image: "", listings: [
        { source: "Jumia Nigeria", type: "affiliate", price: 285000, currency: "NGN", inStock: true },
        { source: "Computer Village, Ikeja", type: "market", priceMin: 250000, priceMax: 270000, currency: "NGN" }
      ]},
      { name: "50kg Bag of Rice (Foreign)", brand: "Various", category: "groceries", image: "", listings: [
        { source: "Retail", type: "retail", price: 82000, currency: "NGN", inStock: true },
        { source: "Onitsha Main Market", type: "market", priceMin: 75000, priceMax: 80000, currency: "NGN", tip: "Buy in bulk for better prices." }
      ]}
    ],
    "KE": [
      { name: "Samsung Galaxy A15 (128GB)", brand: "Samsung", category: "phones", image: "", listings: [
        { source: "Jumia Kenya", type: "affiliate", price: 21500, currency: "KES", inStock: true, url: "https://www.jumia.co.ke/samsung-galaxy-a15" },
        { source: "Kilimall", type: "affiliate", price: 20800, currency: "KES", inStock: true },
        { source: "Luthuli Avenue", type: "market", priceMin: 18000, priceMax: 20000, currency: "KES", tip: "Compare at least 3 shops." }
      ]},
      { name: "iPhone 15 (128GB)", brand: "Apple", category: "phones", image: "", listings: [
        { source: "Jumia Kenya", type: "affiliate", price: 129000, currency: "KES", inStock: true },
        { source: "Luthuli Avenue", type: "market", priceMin: 115000, priceMax: 125000, currency: "KES" }
      ]}
    ],
    "ZA": [
      { name: "Samsung Galaxy A15 (128GB)", brand: "Samsung", category: "phones", image: "", listings: [
        { source: "Takealot", type: "affiliate", price: 3999, currency: "ZAR", inStock: true, url: "https://www.takealot.com/samsung-galaxy-a15" },
        { source: "Game", type: "retail", price: 4199, currency: "ZAR", inStock: true },
        { source: "Makro", type: "retail", price: 3899, currency: "ZAR", inStock: true }
      ]},
      { name: "iPhone 15 (128GB)", brand: "Apple", category: "phones", image: "", listings: [
        { source: "Takealot", type: "affiliate", price: 19999, currency: "ZAR", inStock: true },
        { source: "Game", type: "retail", price: 20499, currency: "ZAR", inStock: true }
      ]}
    ],
    "GH": [
      { name: "Samsung Galaxy A15 (128GB)", brand: "Samsung", category: "phones", image: "", listings: [
        { source: "Jumia Ghana", type: "affiliate", price: 2150, currency: "GHS", inStock: true },
        { source: "Makola Market", type: "market", priceMin: 1800, priceMax: 2000, currency: "GHS" }
      ]}
    ],
    "EG": [
      { name: "Samsung Galaxy A15 (128GB)", brand: "Samsung", category: "phones", image: "", listings: [
        { source: "Jumia Egypt", type: "affiliate", price: 6500, currency: "EGP", inStock: true },
        { source: "Amazon Egypt", type: "retail", price: 6200, currency: "EGP", inStock: true },
        { source: "Noon Egypt", type: "retail", price: 6350, currency: "EGP", inStock: true }
      ]}
    ]
  };

  // Mock price history data
  var MOCK_PRICE_HISTORY = {
    "Samsung Galaxy A15 (128GB)__NG": [
      { date: "2025-12-01", price: 155000 }, { date: "2025-12-15", price: 152000 },
      { date: "2026-01-01", price: 150000 }, { date: "2026-01-15", price: 148000 },
      { date: "2026-02-01", price: 145000 }, { date: "2026-02-15", price: 143000 },
      { date: "2026-03-01", price: 142000 }, { date: "2026-03-15", price: 141000 }
    ],
    "iPhone 15 (128GB)__NG": [
      { date: "2025-12-01", price: 920000 }, { date: "2025-12-15", price: 900000 },
      { date: "2026-01-01", price: 880000 }, { date: "2026-01-15", price: 870000 },
      { date: "2026-02-01", price: 860000 }, { date: "2026-02-15", price: 850000 },
      { date: "2026-03-01", price: 845000 }, { date: "2026-03-15", price: 840000 }
    ]
  };

  // ============================================
  // TRENDING SEARCHES BY COUNTRY
  // ============================================
  var trendingSearches = {
    "NG": ["iPhone 15 price", "Samsung A15", "Generator prices", "Cement price today", "Ankara fabric", "Laptop under 300k", "Used iPhone 13", "Solar panel price"],
    "KE": ["Samsung A15 price", "iPhone 15 Kenya", "Laptop deals Nairobi", "TV prices Kenya", "Second-hand phones"],
    "ZA": ["iPhone 15 Takealot", "Samsung Galaxy", "Best laptop deals", "PS5 price South Africa", "TV specials"],
    "GH": ["iPhone 15 Ghana", "Samsung phones", "Laptop prices Accra", "Generator price"],
    "EG": ["iPhone 15 Egypt", "Samsung Galaxy", "Laptop deals Cairo", "Noon offers"],
    "TZ": ["Samsung phones Tanzania", "iPhone price Dar", "Generator price"],
    "MA": ["iPhone 15 Maroc", "Samsung Galaxy", "Electroplanet offres"],
    "UG": ["Samsung phones Uganda", "iPhone 15 Kampala", "Laptop deals"],
    "RW": ["Samsung phones Rwanda", "iPhone 15 Kigali"],
    "CI": ["iPhone 15 Abidjan", "Samsung Galaxy", "Ordinateur portable"]
  };

  // ============================================
  // SEARCH LOGIC
  // ============================================

  /**
   * Search products — coordinates across mock data, Supabase, and (future) affiliate APIs
   * @param {string} query - Search term
   * @param {string} countryCode - 2-letter country code
   * @param {string} [categoryId] - Optional category filter
   * @returns {Promise<Object>} Search results
   */
  async function searchProducts(query, countryCode, categoryId) {
    if (!query || !countryCode || !countries[countryCode]) {
      return { query: query, country: null, results: [], physicalMarkets: [], error: 'Invalid query or country' };
    }

    var country = countries[countryCode];
    var cacheKey = (query + '__' + countryCode + '__' + (categoryId || '')).toLowerCase();
    var cached = _getCached(cacheKey);
    if (cached) return cached;

    var results = [];

    // Layer 1: Try Supabase product database
    try {
      var sbResults = await _searchSupabase(query, countryCode, categoryId);
      if (sbResults && sbResults.length > 0) {
        results = results.concat(sbResults);
      }
    } catch (e) {
      console.warn('AfroPrices: Supabase search failed, using mock data', e);
    }

    // Layer 2: If no Supabase results, use mock data
    if (results.length === 0) {
      var mockResults = _searchMock(query, countryCode, categoryId);
      results = results.concat(mockResults);
    }

    // Layer 3: Try affiliate API search (via Netlify function)
    // This is called in parallel but we don't block on it
    // Future: _searchAffiliateAPIs(query, countryCode)

    // Deduplicate by product name
    var seen = {};
    var deduped = [];
    for (var i = 0; i < results.length; i++) {
      var key = results[i].name.toLowerCase();
      if (!seen[key]) {
        seen[key] = true;
        deduped.push(results[i]);
      }
    }

    var response = {
      query: query,
      country: country,
      countryCode: countryCode,
      results: deduped,
      physicalMarkets: country.physicalMarkets || [],
      trending: trendingSearches[countryCode] || [],
      timestamp: Date.now()
    };

    _setCache(cacheKey, response);
    return response;
  }

  /**
   * Search Supabase product DB
   */
  async function _searchSupabase(query, countryCode, categoryId) {
    var sb = _getSupabase();
    if (!sb) return [];

    try {
      // Search products table using text search
      var productQuery = sb
        .from('products')
        .select('id, name, brand, category, subcategory, description, image_url, specs, global_avg_price_usd')
        .or('name.ilike.%' + query + '%,brand.ilike.%' + query + '%,description.ilike.%' + query + '%')
        .limit(20);

      if (categoryId) {
        productQuery = productQuery.eq('category', categoryId);
      }

      var { data: products, error } = await productQuery;
      if (error || !products || products.length === 0) return [];

      // For each product, get its price listings for this country
      var productIds = products.map(function (p) { return p.id; });
      var { data: listings } = await sb
        .from('price_listings')
        .select('*')
        .in('product_id', productIds)
        .eq('country_code', countryCode)
        .order('price', { ascending: true });

      // Also get community prices
      var { data: communityPrices } = await sb
        .from('community_prices')
        .select('*')
        .in('product_id', productIds)
        .eq('country_code', countryCode)
        .eq('status', 'verified')
        .order('created_at', { ascending: false })
        .limit(10);

      // Merge listings into products
      var results = products.map(function (product) {
        var productListings = (listings || []).filter(function (l) { return l.product_id === product.id; });
        var productCommunity = (communityPrices || []).filter(function (c) { return c.product_id === product.id; });

        var allListings = productListings.map(function (l) {
          return {
            source: l.source_name,
            type: l.source_type,
            price: l.price,
            currency: l.currency_code,
            inStock: l.in_stock,
            url: l.source_url,
            lastVerified: l.last_verified,
            verifiedBy: l.verified_by
          };
        });

        // Add community prices as listings
        productCommunity.forEach(function (cp) {
          allListings.push({
            source: cp.market_name || 'Community',
            type: 'community',
            price: cp.price,
            currency: cp.currency_code,
            city: cp.city,
            submittedAt: cp.created_at,
            upvotes: cp.upvotes,
            downvotes: cp.downvotes,
            photoUrl: cp.photo_url
          });
        });

        return {
          id: product.id,
          name: product.name,
          brand: product.brand,
          category: product.category,
          image: product.image_url,
          specs: product.specs,
          listings: allListings
        };
      }).filter(function (p) { return p.listings.length > 0; });

      return results;
    } catch (e) {
      console.warn('AfroPrices: Supabase query error', e);
      return [];
    }
  }

  /**
   * Search mock data (fallback)
   */
  function _searchMock(query, countryCode, categoryId) {
    var mockData = MOCK_PRODUCTS[countryCode] || [];
    var q = query.toLowerCase();

    return mockData.filter(function (product) {
      var nameMatch = product.name.toLowerCase().indexOf(q) !== -1;
      var brandMatch = product.brand && product.brand.toLowerCase().indexOf(q) !== -1;
      var catMatch = !categoryId || product.category === categoryId;
      return (nameMatch || brandMatch) && catMatch;
    });
  }

  // ============================================
  // PRICE HISTORY
  // ============================================

  async function getPriceHistory(productName, countryCode) {
    var cacheKey = 'history__' + productName + '__' + countryCode;
    var cached = _getCached(cacheKey);
    if (cached) return cached;

    // Try Supabase first
    var sb = _getSupabase();
    if (sb) {
      try {
        var { data } = await sb
          .from('price_history')
          .select('price, currency_code, source_name, recorded_at')
          .eq('country_code', countryCode)
          .order('recorded_at', { ascending: true })
          .limit(90);

        if (data && data.length > 0) {
          _setCache(cacheKey, data);
          return data;
        }
      } catch (e) { /* fall through to mock */ }
    }

    // Mock data fallback
    var mockKey = productName + '__' + countryCode;
    var history = MOCK_PRICE_HISTORY[mockKey] || [];
    _setCache(cacheKey, history);
    return history;
  }

  // ============================================
  // COMMUNITY PRICE SUBMISSION
  // ============================================

  async function submitCommunityPrice(data) {
    // Validate
    if (!data.productName || !data.price || !data.countryCode || !data.currencyCode) {
      return { success: false, error: 'Missing required fields' };
    }

    // Validate price is reasonable (positive number)
    if (isNaN(data.price) || data.price <= 0) {
      return { success: false, error: 'Invalid price' };
    }

    // Call Netlify function
    try {
      var response = await fetch('/.netlify/functions/afroprices-submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_name: data.productName,
          product_id: data.productId || null,
          country_code: data.countryCode,
          city: data.city || '',
          market_name: data.marketName || '',
          price: data.price,
          currency_code: data.currencyCode,
          photo_url: data.photoUrl || null
        })
      });
      var result = await response.json();
      return result;
    } catch (e) {
      console.error('AfroPrices: Submit failed', e);
      return { success: false, error: 'Network error. Please try again.' };
    }
  }

  // ============================================
  // PRICE ALERTS
  // ============================================

  async function setPriceAlert(data) {
    if (!data.productId || !data.targetPrice || !data.email || !data.countryCode) {
      return { success: false, error: 'Missing required fields' };
    }

    var sb = _getSupabase();
    if (!sb) return { success: false, error: 'Database not available' };

    try {
      var country = countries[data.countryCode];
      var { error } = await sb.from('price_alerts').insert({
        product_id: data.productId,
        country_code: data.countryCode,
        target_price: data.targetPrice,
        currency_code: country.currency.code,
        email: data.email,
        is_active: true
      });

      if (error) return { success: false, error: error.message };
      return { success: true, message: 'Price alert set! We\'ll notify you when the price drops.' };
    } catch (e) {
      return { success: false, error: 'Failed to set alert' };
    }
  }

  // ============================================
  // AI INSIGHT PROMPT BUILDER
  // ============================================

  function buildAIPrompt(query, countryCode, results) {
    var country = countries[countryCode];
    if (!country) return '';

    var platformNames = country.platforms.map(function (p) { return p.name; }).join(', ');
    var marketNames = country.physicalMarkets.map(function (m) { return m.name; }).join(', ');

    var resultsContext = '';
    if (results && results.length > 0) {
      resultsContext = results.map(function (r) {
        var priceInfo = r.listings.map(function (l) {
          if (l.priceMin && l.priceMax) {
            return l.source + ': ' + country.currency.symbol + l.priceMin.toLocaleString() + '-' + country.currency.symbol + l.priceMax.toLocaleString();
          }
          return l.source + ': ' + country.currency.symbol + (l.price || 0).toLocaleString() + (l.type === 'community' ? ' (community)' : '');
        }).join(', ');
        return r.name + ' — ' + priceInfo;
      }).join('\n');
    }

    return 'The user in ' + country.name + ' is searching for "' + query + '".\n\n' +
      'SEARCH RESULTS:\n' + (resultsContext || 'No results found yet.') + '\n\n' +
      'Available platforms: ' + platformNames + '\n' +
      'Physical markets: ' + marketNames + '\n\n' +
      'Provide: 1) Best value option (not just lowest price — consider warranty, delivery, trust) 2) Price range in ' + country.currency.code + ' 3) Buying tips for this product in ' + country.name + ' 4) Whether now is good to buy or prices may drop. Keep under 100 words. Use ' + country.currency.symbol + ' for prices.';
  }

  /**
   * Get AI insight via the existing ai-advisor function
   */
  async function getAIInsight(query, countryCode, results) {
    var prompt = buildAIPrompt(query, countryCode, results);
    if (!prompt) return null;

    try {
      var response = await fetch('/.netlify/functions/ai-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: 'afroprices',
          message: prompt
        })
      });
      var data = await response.json();
      return data.reply || null;
    } catch (e) {
      console.warn('AfroPrices: AI insight failed', e);
      return null;
    }
  }

  // ============================================
  // AFFILIATE LINK BUILDER
  // ============================================

  function buildAffiliateLink(platform, productUrl, affiliateId) {
    if (!productUrl) return '#';
    switch (platform) {
      case 'jumia':
        return productUrl + (productUrl.indexOf('?') > -1 ? '&' : '?') + 'tag=' + (affiliateId || 'afrotools');
      case 'konga':
        return productUrl + (productUrl.indexOf('?') > -1 ? '&' : '?') + 'ref=' + (affiliateId || 'afrotools');
      case 'takealot':
        return productUrl + (productUrl.indexOf('?') > -1 ? '&' : '?') + 'via=' + (affiliateId || 'afrotools');
      case 'kilimall':
        return productUrl + (productUrl.indexOf('?') > -1 ? '&' : '?') + 'aff=' + (affiliateId || 'afrotools');
      default:
        return productUrl;
    }
  }

  // ============================================
  // UTILITY: FORMAT PRICE
  // ============================================

  function formatPrice(amount, currencySymbol) {
    if (typeof amount !== 'number') return '—';
    return currencySymbol + amount.toLocaleString('en', { maximumFractionDigits: 0 });
  }

  function formatPriceRange(min, max, currencySymbol) {
    return currencySymbol + min.toLocaleString('en', { maximumFractionDigits: 0 }) +
      ' – ' + currencySymbol + max.toLocaleString('en', { maximumFractionDigits: 0 });
  }

  // ============================================
  // PUBLIC API
  // ============================================

  return {
    getCountries: function () {
      return Object.entries(countries).map(function (entry) {
        var code = entry[0], c = entry[1];
        return { code: code, name: c.name, flag: c.flag, currency: c.currency, platformCount: c.platforms.length, marketCount: c.physicalMarkets.length };
      });
    },
    getCountry: function (code) { return countries[code] || null; },
    getCategories: function () { return categories; },
    getCategory: function (id) { return categories.find(function (c) { return c.id === id; }) || null; },
    getMarkets: function (countryCode) { return countries[countryCode] ? countries[countryCode].physicalMarkets : []; },
    getPlatforms: function (countryCode) { return countries[countryCode] ? countries[countryCode].platforms : []; },
    getTrending: function (countryCode) { return trendingSearches[countryCode] || trendingSearches['NG']; },
    searchProducts: searchProducts,
    getPriceHistory: getPriceHistory,
    submitCommunityPrice: submitCommunityPrice,
    setPriceAlert: setPriceAlert,
    getAIInsight: getAIInsight,
    buildAffiliateLink: buildAffiliateLink,
    buildAIPrompt: buildAIPrompt,
    formatPrice: formatPrice,
    formatPriceRange: formatPriceRange
  };

})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = AfroPricesEngine;
}
