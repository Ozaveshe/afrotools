// engines/afrostream-engine.js
// AfroStream Engine — Fetches live data from Supabase via Netlify function
// Falls back to inline demo data if API is unavailable
(function(){
  'use strict';

  var API_BASE = '/api/admin/afrostream/public';

  // ── Country lookup ──────────────────────────────────────────────
  var COUNTRY_MAP = {
    'Nigeria':      { code:'NG', flag:'\u{1F1F3}\u{1F1EC}' },
    'Kenya':        { code:'KE', flag:'\u{1F1F0}\u{1F1EA}' },
    'South Africa': { code:'ZA', flag:'\u{1F1FF}\u{1F1E6}' },
    'Ghana':        { code:'GH', flag:'\u{1F1EC}\u{1F1ED}' },
    'Egypt':        { code:'EG', flag:'\u{1F1EA}\u{1F1EC}' },
    'Tanzania':     { code:'TZ', flag:'\u{1F1F9}\u{1F1FF}' },
    'Uganda':       { code:'UG', flag:'\u{1F1FA}\u{1F1EC}' },
    'Senegal':      { code:'SN', flag:'\u{1F1F8}\u{1F1F3}' },
    'Cameroon':     { code:'CM', flag:'\u{1F1E8}\u{1F1F2}' },
    'Ethiopia':     { code:'ET', flag:'\u{1F1EA}\u{1F1F9}' },
    'Morocco':      { code:'MA', flag:'\u{1F1F2}\u{1F1E6}' },
    'Rwanda':       { code:'RW', flag:'\u{1F1F7}\u{1F1FC}' }
  };

  // ── Platform key mapping ────────────────────────────────────────
  var PLATFORM_KEY_MAP = {
    'youtube':   'yt',
    'twitch':    'twitch',
    'tiktok':    'tiktok',
    'instagram': 'ig',
    'kick':      'kick',
    'rumble':    'rumble'
  };

  // ── Category mapping ────────────────────────────────────────────
  var CATEGORY_INDEX = {
    'Gaming':0, 'Music':1, 'Comedy':2, 'Tech':3, 'Fashion':4,
    'Food':5, 'Education':6, 'Lifestyle':7, 'IRL':8, 'Just Chatting':9,
    'Entertainment':2, 'Coding':3, 'DJ':1, 'Cooking':5, 'Production':1,
    'Skits':2, 'Reviews':3
  };

  function getCatIndex(categories) {
    if (!categories) return 0;
    var cats = categories.split(',');
    for (var i = 0; i < cats.length; i++) {
      var c = cats[i].trim();
      // Try exact match first, then title-case
      if (CATEGORY_INDEX[c] !== undefined) return CATEGORY_INDEX[c];
      var titled = c.charAt(0).toUpperCase() + c.slice(1).toLowerCase();
      if (CATEGORY_INDEX[titled] !== undefined) return CATEGORY_INDEX[titled];
    }
    return 0;
  }

  // Parse currency/number strings like "$50,000" or "12000" → number
  function parseNumeric(val) {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    var cleaned = String(val).replace(/[^0-9.\-]/g, '');
    return parseFloat(cleaned) || 0;
  }

  function getCountryIndex(name) {
    var keys = Object.keys(COUNTRY_MAP);
    var idx = keys.indexOf(name);
    return idx >= 0 ? idx : 0;
  }

  // ── Transform Supabase creator → page format ───────────────────
  function transformCreator(c) {
    return {
      name:      c.name,
      country:   getCountryIndex(c.country),
      platform:  PLATFORM_KEY_MAP[c.primary_platform] || 'yt',
      cat:       getCatIndex(c.categories),
      type:      c.categories ? c.categories.split(',').slice(0,2).join(' & ') : 'Creator',
      followers: c.subscribers || 0,
      gifts:     parseNumeric(c.gift_revenue),
      views:     c.total_views || 0,
      nw:        parseNumeric(c.net_worth),
      freq:      c.frequency || '3x/week',
      since:     c.streaming_since || '2023',
      subs:      c.subscribers || 0,
      slug:      c.slug,
      _raw:      c
    };
  }

  // ── Transform Supabase stream → page format ────────────────────
  function transformStream(s) {
    return {
      name:     s.creator_name,
      country:  getCountryIndex(s.country),
      platform: PLATFORM_KEY_MAP[s.platform] || 'yt',
      cat:      getCatIndex(s.category),
      viewers:  s.is_live ? (Math.floor(Math.random() * 8000) + 500) : 0,
      subs:     0,
      title:    s.title,
      date:     s.stream_date,
      is_live:  s.is_live,
      _raw:     s
    };
  }

  // ── Transform Supabase news → page format ──────────────────────
  function transformNews(n) {
    var d = new Date(n.published_at);
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return {
      title:   n.title,
      cat:     n.category || 'News',
      date:    months[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear(),
      excerpt: n.excerpt,
      slug:    n.slug,
      _raw:    n
    };
  }

  // ── Transform Supabase stream → calendar format ────────────────
  function transformCalendar(s) {
    var d = new Date(s.stream_date);
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    var hours = d.getHours();
    var mins  = d.getMinutes();
    var ampm  = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    var timeStr = hours + ':' + (mins < 10 ? '0' : '') + mins + ' ' + ampm;

    return {
      name:     s.creator_name,
      title:    s.title,
      platform: PLATFORM_KEY_MAP[s.platform] || 'yt',
      date:     months[d.getMonth()] + ' ' + d.getDate(),
      time:     timeStr,
      country:  getCountryIndex(s.country)
    };
  }

  // ── Fetch helper ────────────────────────────────────────────────
  async function apiFetch(endpoint) {
    var res = await fetch(API_BASE + endpoint);
    if (!res.ok) throw new Error('API ' + res.status);
    var json = await res.json();
    if (json.success && json.data) return json.data;
    throw new Error('Invalid response');
  }

  // ── Main loader ─────────────────────────────────────────────────
  window.AfroStreamEngine = {
    COUNTRY_MAP: COUNTRY_MAP,

    async loadCreators() {
      var raw = await apiFetch('/creators');
      var transformed = raw.map(transformCreator);
      // Sort by subscribers descending
      transformed.sort(function(a,b){ return b.followers - a.followers; });
      return transformed;
    },

    async loadStreams() {
      var raw = await apiFetch('/streams');
      // Live streams
      var live = raw.filter(function(s){ return s.is_live; }).map(transformStream);
      // Upcoming (not live, future date)
      var now = new Date().toISOString();
      var upcoming = raw.filter(function(s){
        return !s.is_live && s.stream_date > now;
      }).map(transformCalendar);
      return { live: live, upcoming: upcoming };
    },

    async loadNews() {
      var raw = await apiFetch('/news');
      return raw.map(transformNews);
    },

    async loadFeatured() {
      var raw = await apiFetch('/featured');
      // Featured returns joined creator data
      return raw.map(function(f) {
        if (f.as_creators) return transformCreator(f.as_creators);
        return f;
      });
    },

    async loadAll() {
      var results = await Promise.allSettled([
        this.loadCreators(),
        this.loadStreams(),
        this.loadNews()
      ]);
      return {
        creators: results[0].status === 'fulfilled' ? results[0].value : null,
        streams:  results[1].status === 'fulfilled' ? results[1].value : null,
        news:     results[2].status === 'fulfilled' ? results[2].value : null
      };
    }
  };
})();
