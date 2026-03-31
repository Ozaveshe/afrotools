/**
 * CreatorPricing Engine — Smart Pricing Calculator
 * IIFE module for African creative professional rate calculation
 */
var CreatorPricingEngine = (function () {
  'use strict';

  // ── AUTH HELPERS ──
  var supabaseClient = null;
  function getSupabase() {
    if (supabaseClient) return supabaseClient;
    if (window.AfroAuth && typeof AfroAuth.getSupabase === 'function') {
      supabaseClient = AfroAuth.getSupabase();
      return supabaseClient;
    }
    return null;
  }
  function getUserId() {
    if (window.AfroAuth && AfroAuth.user) return AfroAuth.user.id;
    return null;
  }
  function scopedKey(base) {
    var uid = getUserId();
    return uid ? base + '_' + uid : base;
  }

  // ── COUNTRIES & CURRENCIES ──
  var COUNTRIES = {
    NG: { name: 'Nigeria', flag: '🇳🇬', currency: 'NGN', symbol: '₦', col: 0.35 },
    KE: { name: 'Kenya', flag: '🇰🇪', currency: 'KES', symbol: 'KES ', col: 0.55 },
    ZA: { name: 'South Africa', flag: '🇿🇦', currency: 'ZAR', symbol: 'R', col: 0.85 },
    GH: { name: 'Ghana', flag: '🇬🇭', currency: 'GHS', symbol: 'GH₵', col: 0.40 },
    TZ: { name: 'Tanzania', flag: '🇹🇿', currency: 'TZS', symbol: 'TZS ', col: 0.30 },
    EG: { name: 'Egypt', flag: '🇪🇬', currency: 'EGP', symbol: 'EGP ', col: 0.50 },
    ET: { name: 'Ethiopia', flag: '🇪🇹', currency: 'ETB', symbol: 'ETB ', col: 0.25 },
    UG: { name: 'Uganda', flag: '🇺🇬', currency: 'UGX', symbol: 'UGX ', col: 0.28 },
    RW: { name: 'Rwanda', flag: '🇷🇼', currency: 'RWF', symbol: 'RWF ', col: 0.35 },
    SN: { name: 'Senegal', flag: '🇸🇳', currency: 'XOF', symbol: 'CFA ', col: 0.38 },
    CI: { name: "Côte d'Ivoire", flag: '🇨🇮', currency: 'XOF', symbol: 'CFA ', col: 0.42 },
    CM: { name: 'Cameroon', flag: '🇨🇲', currency: 'XAF', symbol: 'CFA ', col: 0.32 },
    MA: { name: 'Morocco', flag: '🇲🇦', currency: 'MAD', symbol: 'MAD ', col: 0.60 },
    TN: { name: 'Tunisia', flag: '🇹🇳', currency: 'TND', symbol: 'TND ', col: 0.55 },
    BW: { name: 'Botswana', flag: '🇧🇼', currency: 'BWP', symbol: 'BWP ', col: 0.65 }
  };

  // ── CRAFTS & SPECIALTIES ──
  var CRAFTS = [
    { id: 'photography', label: 'Photography', icon: '📷',
      specialties: ['Wedding', 'Portrait', 'Product', 'Fashion', 'Event', 'Real Estate', 'Food', 'Documentary'] },
    { id: 'videography', label: 'Videography / Film', icon: '🎬',
      specialties: ['Music Video', 'Wedding Film', 'Documentary', 'Commercial', 'Corporate', 'Social Media', 'Short Film'] },
    { id: 'design', label: 'Graphic Design', icon: '✏️',
      specialties: ['Brand Identity', 'Social Media', 'Print', 'Packaging', 'UI/UX', 'Motion Graphics', 'Infographics'] },
    { id: 'music', label: 'Music Production', icon: '🎵',
      specialties: ['Afrobeats', 'Amapiano', 'Gospel', 'Highlife', 'Bongo', 'Gengetone', 'Jingles', 'Film Score'] },
    { id: 'writing', label: 'Writing / Copywriting', icon: '✍️',
      specialties: ['Blog/SEO', 'Copywriting', 'Technical', 'Ghostwriting', 'Script', 'PR/Communications', 'Academic'] },
    { id: 'development', label: 'Web / App Dev', icon: '💻',
      specialties: ['Frontend', 'Backend', 'Full Stack', 'Mobile App', 'WordPress', 'E-commerce', 'API/Integration'] },
    { id: 'social-media', label: 'Social Media Mgmt', icon: '📱',
      specialties: ['Strategy', 'Content Creation', 'Community Mgmt', 'Paid Ads', 'Influencer', 'Analytics'] },
    { id: 'fashion', label: 'Fashion Design', icon: '✂️',
      specialties: ['Bespoke/Custom', 'Ready-to-Wear', 'Bridal', 'Accessories', 'Styling', 'Costume'] },
    { id: 'illustration', label: 'Illustration / Art', icon: '🎨',
      specialties: ['Digital Art', 'Editorial', 'Children\'s Book', 'Comic/Manga', 'Murals', 'Portraits', 'NFT Art'] },
    { id: 'voiceover', label: 'Voice Over / Audio', icon: '🎙️',
      specialties: ['Commercial', 'Narration', 'Podcast', 'IVR/Phone', 'Animation', 'Audiobook'] },
    { id: 'events', label: 'Event Planning', icon: '📅',
      specialties: ['Weddings', 'Corporate', 'Concerts', 'Birthday/Social', 'Conference', 'Decor Only'] },
    { id: 'other', label: 'Other', icon: '✨', specialties: [] }
  ];

  var EXPERIENCE_LEVELS = [
    { id: 'beginner', label: 'Beginner', desc: '0–1 year', multiplier: 0.55 },
    { id: 'developing', label: 'Developing', desc: '1–3 years', multiplier: 0.75 },
    { id: 'established', label: 'Established', desc: '3–5 years', multiplier: 1.0 },
    { id: 'expert', label: 'Expert', desc: '5–10 years', multiplier: 1.35 },
    { id: 'master', label: 'Master', desc: '10+ years', multiplier: 1.8 }
  ];

  // ── BASE RATES (daily, in USD equivalent for normalization) ──
  // Researched baseline for "Established" level in a mid-tier African city
  var BASE_RATES_USD = {
    photography:  { min: 80, max: 200, median: 130 },
    videography:  { min: 120, max: 300, median: 200 },
    design:       { min: 60, max: 160, median: 100 },
    music:        { min: 100, max: 280, median: 170 },
    writing:      { min: 40, max: 120, median: 70 },
    development:  { min: 100, max: 300, median: 180 },
    'social-media': { min: 40, max: 120, median: 70 },
    fashion:      { min: 60, max: 180, median: 110 },
    illustration: { min: 50, max: 150, median: 90 },
    voiceover:    { min: 50, max: 160, median: 95 },
    events:       { min: 80, max: 250, median: 150 },
    other:        { min: 50, max: 150, median: 90 }
  };

  // Specialty multipliers (relative to craft base)
  var SPECIALTY_MULT = {
    // Photography
    'Wedding': 1.4, 'Portrait': 0.9, 'Product': 1.1, 'Fashion': 1.3, 'Event': 1.0,
    'Real Estate': 1.0, 'Food': 1.05, 'Documentary': 1.2,
    // Videography
    'Music Video': 1.3, 'Wedding Film': 1.4, 'Commercial': 1.5, 'Corporate': 1.2,
    'Social Media': 0.8, 'Short Film': 1.1,
    // Design
    'Brand Identity': 1.3, 'Print': 0.9, 'Packaging': 1.2, 'UI/UX': 1.4, 'Motion Graphics': 1.3,
    'Infographics': 0.85,
    // Music
    'Afrobeats': 1.2, 'Amapiano': 1.2, 'Gospel': 0.9, 'Highlife': 1.0, 'Bongo': 0.95,
    'Gengetone': 1.0, 'Jingles': 1.3, 'Film Score': 1.5,
    // Writing
    'Blog/SEO': 0.85, 'Copywriting': 1.2, 'Technical': 1.3, 'Ghostwriting': 1.4,
    'Script': 1.1, 'PR/Communications': 1.15, 'Academic': 0.7,
    // Dev
    'Frontend': 1.0, 'Backend': 1.1, 'Full Stack': 1.2, 'Mobile App': 1.3,
    'WordPress': 0.75, 'E-commerce': 1.15, 'API/Integration': 1.2,
    // Social
    'Strategy': 1.3, 'Content Creation': 1.0, 'Community Mgmt': 0.8,
    'Paid Ads': 1.2, 'Influencer': 1.1, 'Analytics': 1.1,
    // Fashion
    'Bespoke/Custom': 1.2, 'Ready-to-Wear': 1.0, 'Bridal': 1.5, 'Accessories': 0.8,
    'Styling': 1.1, 'Costume': 1.0,
    // Illustration
    'Digital Art': 1.0, 'Editorial': 1.1, "Children's Book": 1.0, 'Comic/Manga': 0.9,
    'Murals': 1.3, 'Portraits': 0.95, 'NFT Art': 1.2,
    // Voiceover
    'Narration': 1.0, 'Podcast': 0.8, 'IVR/Phone': 0.9, 'Animation': 1.1, 'Audiobook': 1.05,
    // Events
    'Weddings': 1.4, 'Concerts': 1.3, 'Conference': 1.2, 'Birthday/Social': 0.85, 'Decor Only': 0.75
  };

  // City premium multipliers (relative to national average)
  var CITY_MULT = {
    // Nigeria
    'Lagos': 1.35, 'Abuja': 1.2, 'Port Harcourt': 1.0, 'Ibadan': 0.85, 'Kano': 0.75,
    // Kenya
    'Nairobi': 1.3, 'Mombasa': 0.9, 'Kisumu': 0.75,
    // South Africa
    'Johannesburg': 1.25, 'Cape Town': 1.3, 'Durban': 1.0, 'Pretoria': 1.1,
    // Ghana
    'Accra': 1.3, 'Kumasi': 0.85, 'Tamale': 0.7,
    // Tanzania
    'Dar es Salaam': 1.25, 'Arusha': 0.9, 'Dodoma': 0.75,
    // Egypt
    'Cairo': 1.3, 'Alexandria': 1.0, 'Giza': 1.1,
    // Others
    'Addis Ababa': 1.2, 'Kampala': 1.15, 'Kigali': 1.15,
    'Dakar': 1.2, 'Abidjan': 1.25, 'Douala': 1.1, 'Yaoundé': 1.0,
    'Casablanca': 1.25, 'Rabat': 1.1, 'Tunis': 1.2,
    'Gaborone': 1.15
  };

  // Approximate USD-to-local exchange rates (updated periodically)
  var FX_RATES = {
    NGN: 1600, KES: 130, ZAR: 18.5, GHS: 16, TZS: 2650, EGP: 50,
    ETB: 130, UGX: 3750, RWF: 1350, XOF: 610, XAF: 610,
    MAD: 10, TND: 3.1, BWP: 14
  };

  // ── PROJECT BREAKDOWN TEMPLATES ──
  var PROJECT_TYPES = {
    photography: [
      { name: 'Half-day shoot (4hrs)', hourMult: 0.5 },
      { name: 'Full-day shoot (8hrs)', hourMult: 1.0 },
      { name: 'Wedding (full day)', hourMult: 2.5 },
      { name: 'Per edited photo', hourMult: 0.04 },
      { name: 'Photo + video combo', hourMult: 1.8 }
    ],
    videography: [
      { name: 'Short-form video (30–60s)', hourMult: 0.6 },
      { name: 'Music video', hourMult: 2.0 },
      { name: 'Corporate video (3–5 min)', hourMult: 1.5 },
      { name: 'Wedding film', hourMult: 2.5 },
      { name: 'Social media reel', hourMult: 0.3 }
    ],
    design: [
      { name: 'Logo design', hourMult: 1.5 },
      { name: 'Social media set (10 posts)', hourMult: 1.0 },
      { name: 'Flyer / poster', hourMult: 0.4 },
      { name: 'Brand identity package', hourMult: 4.0 },
      { name: 'Presentation deck', hourMult: 0.8 }
    ],
    music: [
      { name: 'Beat/instrumental', hourMult: 0.8 },
      { name: 'Full track production', hourMult: 2.0 },
      { name: 'Mixing & mastering', hourMult: 0.6 },
      { name: 'Jingle (30s)', hourMult: 1.0 },
      { name: 'Album production (10 tracks)', hourMult: 12.0 }
    ],
    writing: [
      { name: 'Blog post (1000 words)', hourMult: 0.4 },
      { name: 'Website copy (5 pages)', hourMult: 1.5 },
      { name: 'Social media captions (30)', hourMult: 0.8 },
      { name: 'Press release', hourMult: 0.5 },
      { name: 'Ebook / whitepaper', hourMult: 3.0 }
    ],
    development: [
      { name: 'Landing page', hourMult: 1.0 },
      { name: 'Full website (5–10 pages)', hourMult: 5.0 },
      { name: 'E-commerce store', hourMult: 8.0 },
      { name: 'Mobile app (MVP)', hourMult: 15.0 },
      { name: 'API integration', hourMult: 2.0 }
    ],
    'social-media': [
      { name: 'Monthly management', hourMult: 3.0 },
      { name: 'Strategy document', hourMult: 1.5 },
      { name: 'Ad campaign setup', hourMult: 1.0 },
      { name: 'Content calendar (1 month)', hourMult: 1.0 },
      { name: 'Audit & report', hourMult: 0.8 }
    ],
    fashion: [
      { name: 'Custom outfit', hourMult: 1.5 },
      { name: 'Bridal gown', hourMult: 4.0 },
      { name: 'Aso-ebi set', hourMult: 1.0 },
      { name: 'Collection (10 pieces)', hourMult: 10.0 },
      { name: 'Styling session', hourMult: 0.6 }
    ],
    illustration: [
      { name: 'Single illustration', hourMult: 0.6 },
      { name: 'Character design', hourMult: 1.0 },
      { name: 'Book cover', hourMult: 1.2 },
      { name: 'Comic page', hourMult: 0.8 },
      { name: 'Mural design', hourMult: 3.0 }
    ],
    voiceover: [
      { name: 'Radio commercial (30s)', hourMult: 0.5 },
      { name: 'Narration (per minute)', hourMult: 0.15 },
      { name: 'IVR / phone system', hourMult: 0.6 },
      { name: 'Podcast intro', hourMult: 0.3 },
      { name: 'Audiobook (per hour)', hourMult: 1.5 }
    ],
    events: [
      { name: 'Birthday party', hourMult: 1.0 },
      { name: 'Wedding coordination', hourMult: 3.0 },
      { name: 'Corporate event', hourMult: 2.0 },
      { name: 'Concert / show', hourMult: 2.5 },
      { name: 'Decoration only', hourMult: 0.7 }
    ],
    other: [
      { name: 'Half-day project', hourMult: 0.5 },
      { name: 'Full-day project', hourMult: 1.0 },
      { name: 'Multi-day project', hourMult: 3.0 }
    ]
  };

  // ── CACHE ──
  var cache = {};
  function getCached(key) {
    var c = cache[key];
    if (c && Date.now() - c.ts < 1800000) return c.data;
    return null;
  }
  function setCached(key, data) {
    cache[key] = { data: data, ts: Date.now() };
  }

  // ── CORE CALCULATION ──
  function calculateRate(profile) {
    var craft = profile.craft || 'other';
    var specialty = profile.specialty || '';
    var countryCode = profile.country || 'NG';
    var city = profile.city || '';
    var experience = profile.experience || 'established';

    var country = COUNTRIES[countryCode] || COUNTRIES.NG;
    var currency = profile.currency || country.currency;
    var fx = FX_RATES[currency] || 1;

    // Base rate in local currency
    var base = BASE_RATES_USD[craft] || BASE_RATES_USD.other;
    var minUSD = base.min;
    var maxUSD = base.max;
    var medUSD = base.median;

    // Apply specialty multiplier
    var specMult = SPECIALTY_MULT[specialty] || 1.0;
    minUSD *= specMult;
    maxUSD *= specMult;
    medUSD *= specMult;

    // Apply experience multiplier
    var expLevel = EXPERIENCE_LEVELS.find(function (l) { return l.id === experience; }) || EXPERIENCE_LEVELS[2];
    minUSD *= expLevel.multiplier;
    maxUSD *= expLevel.multiplier;
    medUSD *= expLevel.multiplier;

    // Apply city multiplier
    var cityMult = CITY_MULT[city] || 1.0;
    minUSD *= cityMult;
    maxUSD *= cityMult;
    medUSD *= cityMult;

    // Apply cost-of-living factor
    var colFactor = country.col || 0.5;
    // Adjust: higher COL = higher rates, but the base already accounts for mid-tier
    var colMult = 0.6 + (colFactor * 0.8);
    minUSD *= colMult;
    maxUSD *= colMult;
    medUSD *= colMult;

    // Convert to local currency
    var rateMin = Math.round(minUSD * fx);
    var rateMax = Math.round(maxUSD * fx);
    var rateMedian = Math.round(medUSD * fx);

    // Round to nice numbers
    rateMin = roundNice(rateMin, currency);
    rateMax = roundNice(rateMax, currency);
    rateMedian = roundNice(rateMedian, currency);

    // Compute hourly and project rates
    var hourlyMin = Math.round(rateMin / 8);
    var hourlyMax = Math.round(rateMax / 8);

    return {
      daily: { min: rateMin, max: rateMax, median: rateMedian },
      hourly: { min: roundNice(hourlyMin, currency), max: roundNice(hourlyMax, currency), median: roundNice(Math.round(rateMedian / 8), currency) },
      project: { min: Math.round(rateMin * 1.5), max: Math.round(rateMax * 2.5), median: Math.round(rateMedian * 2) },
      currency: currency,
      symbol: country.symbol,
      experience: expLevel,
      craft: craft,
      specialty: specialty,
      country: countryCode,
      city: city
    };
  }

  function roundNice(n, currency) {
    // Round to sensible increments based on currency magnitude
    if (n < 100) return Math.round(n / 5) * 5;
    if (n < 1000) return Math.round(n / 50) * 50;
    if (n < 10000) return Math.round(n / 500) * 500;
    if (n < 100000) return Math.round(n / 5000) * 5000;
    return Math.round(n / 10000) * 10000;
  }

  // ── MARKET COMPARISON ──
  function getComparison(profile, rate) {
    var dailyMed = rate.daily.median;

    // Simulate city/national averages relative to the calculated rate
    var cityAvg = Math.round(dailyMed * 0.85);
    var nationalAvg = Math.round(dailyMed * 0.7);
    var top10 = Math.round(dailyMed * 1.6);

    // Percentile estimation based on experience
    var pctMap = { beginner: 20, developing: 35, established: 55, expert: 72, master: 88 };
    var percentile = pctMap[profile.experience] || 50;

    // City premium adjustment
    var cityMult = CITY_MULT[profile.city] || 1.0;
    if (cityMult > 1.2) percentile = Math.min(percentile + 8, 95);
    if (cityMult < 0.85) percentile = Math.max(percentile - 8, 10);

    return {
      yourEstimate: dailyMed,
      cityAvg: roundNice(cityAvg, rate.currency),
      nationalAvg: roundNice(nationalAvg, rate.currency),
      top10pct: roundNice(top10, rate.currency),
      percentileRank: percentile
    };
  }

  // ── PROJECT BREAKDOWN ──
  function getBreakdown(craft, rate) {
    var types = PROJECT_TYPES[craft] || PROJECT_TYPES.other;
    return types.map(function (t) {
      var min = roundNice(Math.round(rate.daily.min * t.hourMult), rate.currency);
      var max = roundNice(Math.round(rate.daily.max * t.hourMult), rate.currency);
      return { name: t.name, min: min, max: max };
    });
  }

  // ── FORMAT HELPERS ──
  function formatRate(amount, currency) {
    var c = null;
    for (var code in COUNTRIES) {
      if (COUNTRIES[code].currency === currency) { c = COUNTRIES[code]; break; }
    }
    var sym = c ? c.symbol : (currency + ' ');

    if (amount >= 1000000) {
      return sym + (amount / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    return sym + amount.toLocaleString('en-US');
  }

  function formatRange(min, max, currency) {
    return formatRate(min, currency) + ' — ' + formatRate(max, currency);
  }

  // ── GETTERS ──
  function getSpecialties(craftId) {
    var craft = CRAFTS.find(function (c) { return c.id === craftId; });
    return craft ? craft.specialties : [];
  }

  function getCountries() { return COUNTRIES; }
  function getCrafts() { return CRAFTS; }
  function getExperienceLevels() { return EXPERIENCE_LEVELS; }
  function getCities(countryCode) {
    var cityMap = {
      NG: ['Lagos', 'Abuja', 'Port Harcourt', 'Ibadan', 'Kano'],
      KE: ['Nairobi', 'Mombasa', 'Kisumu'],
      ZA: ['Johannesburg', 'Cape Town', 'Durban', 'Pretoria'],
      GH: ['Accra', 'Kumasi', 'Tamale'],
      TZ: ['Dar es Salaam', 'Arusha', 'Dodoma'],
      EG: ['Cairo', 'Alexandria', 'Giza'],
      ET: ['Addis Ababa'],
      UG: ['Kampala'],
      RW: ['Kigali'],
      SN: ['Dakar'],
      CI: ['Abidjan'],
      CM: ['Douala', 'Yaoundé'],
      MA: ['Casablanca', 'Rabat'],
      TN: ['Tunis'],
      BW: ['Gaborone']
    };
    return cityMap[countryCode] || [];
  }

  // ── PUBLIC API ──
  return {
    COUNTRIES: COUNTRIES,
    CRAFTS: CRAFTS,
    EXPERIENCE_LEVELS: EXPERIENCE_LEVELS,
    PROJECT_TYPES: PROJECT_TYPES,
    calculateRate: calculateRate,
    getComparison: getComparison,
    getBreakdown: getBreakdown,
    formatRate: formatRate,
    formatRange: formatRange,
    getSpecialties: getSpecialties,
    getCountries: getCountries,
    getCrafts: getCrafts,
    getExperienceLevels: getExperienceLevels,
    getCities: getCities
  };
})();
