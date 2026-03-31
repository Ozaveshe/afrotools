/**
 * CreatorCalendar Engine — Data layer for Content Calendar & Planner
 * Handles posts, pillars, platforms, posting times, and African cultural calendar
 */
var CreatorCalendarEngine = (function () {
  'use strict';

  // ─── SUPABASE ───
  var _supabase = null;

  function getSupabase() {
    if (_supabase) return _supabase;
    if (window.AfroAuth && typeof AfroAuth.getSupabase === 'function') {
      _supabase = AfroAuth.getSupabase();
    } else if (window.supabase && window.supabase.createClient) {
      _supabase = window.supabase.createClient(
        'https://zpclagtgczsygrgztlts.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpwY2xhZ3RnY3pzeWdyZ3p0bHRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0NTg4MzIsImV4cCI6MjA4OTAzNDgzMn0._G-677vi2UTAhcU3t0aquvmd8lnQUBil53ok_Z623F0'
      );
    }
    return _supabase;
  }

  // ─── CACHE ───
  var _cache = {};
  function getCached(key) {
    var c = _cache[key];
    return c && Date.now() - c.ts < 1800000 ? c.data : null;
  }
  function setCached(key, data) { _cache[key] = { data: data, ts: Date.now() }; }

  // ─── REFERENCE: PLATFORMS ───
  var PLATFORMS = {
    instagram: { label: 'Instagram', short: 'IG', color: '#E1306C', icon: 'IG', charLimit: 2200 },
    tiktok:    { label: 'TikTok',    short: 'TT', color: '#00F2EA', icon: 'TT', charLimit: 4000 },
    youtube:   { label: 'YouTube',   short: 'YT', color: '#FF0000', icon: 'YT', charLimit: 5000 },
    twitter:   { label: 'X/Twitter', short: 'X',  color: '#111',    icon: 'X',  charLimit: 280 },
    linkedin:  { label: 'LinkedIn',  short: 'LI', color: '#0A66C2', icon: 'LI', charLimit: 3000 },
    facebook:  { label: 'Facebook',  short: 'FB', color: '#1877F2', icon: 'FB', charLimit: 63206 },
    newsletter:{ label: 'Newsletter',short: 'NL', color: '#FF6B6B', icon: 'NL', charLimit: 99999 }
  };

  // ─── REFERENCE: POST TYPES ───
  var POST_TYPES = ['post','reel','carousel','story','thread','video','article','newsletter','short'];

  // ─── REFERENCE: DEFAULT PILLARS ───
  var DEFAULT_PILLARS = [
    { name: 'Educational',       color: '#3B82F6', icon: '📚', target_percentage: 25 },
    { name: 'Entertaining',      color: '#F59E0B', icon: '🎭', target_percentage: 25 },
    { name: 'Promotional',       color: '#EF4444', icon: '📣', target_percentage: 20 },
    { name: 'Personal',          color: '#10B981', icon: '💭', target_percentage: 15 },
    { name: 'Behind the Scenes', color: '#8B5CF6', icon: '🎬', target_percentage: 15 }
  ];

  // ─── REFERENCE: OPTIMAL POSTING TIMES ───
  var OPTIMAL_TIMES = {
    NG: {
      instagram: ['07:00', '12:00', '19:00'],
      tiktok: ['09:00', '15:00', '21:00'],
      twitter: ['08:00', '12:30', '18:00'],
      youtube: ['14:00', '18:00'],
      linkedin: ['08:00', '12:00']
    },
    KE: {
      instagram: ['06:30', '12:00', '19:30'],
      tiktok: ['10:00', '16:00', '21:00'],
      twitter: ['07:30', '12:00', '18:30'],
      youtube: ['14:00', '19:00'],
      linkedin: ['08:00', '12:30']
    },
    ZA: {
      instagram: ['07:00', '12:00', '18:30'],
      tiktok: ['09:00', '15:00', '20:00'],
      twitter: ['08:00', '12:00', '17:30'],
      youtube: ['13:00', '18:00'],
      linkedin: ['07:30', '12:00']
    },
    GH: {
      instagram: ['07:00', '12:00', '19:00'],
      tiktok: ['09:00', '15:00', '21:00'],
      twitter: ['08:00', '12:30', '18:00'],
      youtube: ['14:00', '18:00'],
      linkedin: ['08:00', '12:00']
    },
    TZ: {
      instagram: ['06:30', '12:00', '19:00'],
      tiktok: ['09:00', '15:00', '20:30'],
      twitter: ['07:30', '12:00', '18:00'],
      youtube: ['14:00', '18:30'],
      linkedin: ['08:00', '12:00']
    },
    EG: {
      instagram: ['07:00', '13:00', '20:00'],
      tiktok: ['10:00', '16:00', '21:00'],
      twitter: ['08:00', '13:00', '19:00'],
      youtube: ['15:00', '19:00'],
      linkedin: ['08:00', '12:30']
    }
  };

  // ─── REFERENCE: AFRICAN CULTURAL CALENDAR ───
  var AFRICAN_EVENTS = {
    NG: [
      { month: 1,  day: 1,  name: "New Year's Day" },
      { month: 3,  day: null, name: 'Ramadan begins (varies)', recurring: true },
      { month: 5,  day: 27, name: 'Children\'s Day' },
      { month: 6,  day: 12, name: 'Democracy Day' },
      { month: 10, day: 1,  name: 'Independence Day' },
      { month: 11, day: null, name: 'Detty December prep season', recurring: true },
      { month: 12, day: null, name: 'Detty December (peak content)', recurring: true },
      { month: 12, day: 25, name: 'Christmas Day' }
    ],
    KE: [
      { month: 6,  day: 1,  name: 'Madaraka Day' },
      { month: 10, day: 10, name: 'Huduma Day' },
      { month: 10, day: 20, name: 'Mashujaa Day' },
      { month: 12, day: 12, name: 'Jamhuri Day' },
      { month: 12, day: 25, name: 'Christmas Day' }
    ],
    ZA: [
      { month: 3,  day: 21, name: 'Human Rights Day' },
      { month: 4,  day: 27, name: 'Freedom Day' },
      { month: 6,  day: 16, name: 'Youth Day' },
      { month: 8,  day: 9,  name: 'National Women\'s Day' },
      { month: 9,  day: 24, name: 'Heritage Day' },
      { month: 12, day: 16, name: 'Day of Reconciliation' }
    ],
    GH: [
      { month: 3,  day: 6,  name: 'Independence Day' },
      { month: 7,  day: 1,  name: 'Republic Day' },
      { month: 9,  day: 21, name: 'Founders\' Day' },
      { month: 12, day: null, name: 'Afrochella / Homecoming season', recurring: true }
    ],
    PAN: [
      { month: 1,  day: null, name: 'AFCON (if scheduled)', recurring: true },
      { month: 5,  day: 25, name: 'Africa Day' },
      { month: 6,  day: null, name: 'World Cup Qualifiers', recurring: true }
    ]
  };

  // ─── DATE UTILITIES ───
  function formatDate(d) {
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
  }

  function getWeekStart(date) {
    var d = new Date(date);
    var day = d.getDay();
    d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function getWeekDates(weekStart) {
    var dates = [];
    for (var i = 0; i < 7; i++) {
      var d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      dates.push(d);
    }
    return dates;
  }

  function getMonthDates(year, month) {
    var first = new Date(year, month, 1);
    var last = new Date(year, month + 1, 0);
    var startDay = first.getDay() === 0 ? 6 : first.getDay() - 1;
    var dates = [];
    var start = new Date(first);
    start.setDate(start.getDate() - startDay);
    for (var i = 0; i < 42; i++) {
      var d = new Date(start);
      d.setDate(d.getDate() + i);
      dates.push({ date: d, inMonth: d.getMonth() === month });
    }
    return dates;
  }

  function isToday(d) {
    var now = new Date();
    return d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate();
  }

  var DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  var DAY_NAMES_FULL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  var MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  // ─── DATA FETCHING (via Netlify function) ───
  var BASE_URL = '/.netlify/functions/creator-calendar';

  async function fetchPosts(params) {
    params = params || {};
    var qs = new URLSearchParams(params);
    qs.set('action', 'list-posts');
    var url = BASE_URL + '?' + qs.toString();
    try {
      var res = await fetch(url);
      if (!res.ok) throw new Error('Network error');
      return await res.json();
    } catch (err) {
      console.error('Error fetching posts:', err);
      return [];
    }
  }

  async function getWeekPosts(startDate) {
    var start = formatDate(startDate);
    var end = new Date(startDate);
    end.setDate(end.getDate() + 6);
    return fetchPosts({ start: start, end: formatDate(end) });
  }

  async function getMonthOverview(year, month) {
    var start = formatDate(new Date(year, month, 1));
    var end = formatDate(new Date(year, month + 1, 0));
    return fetchPosts({ start: start, end: end });
  }

  async function savePost(post) {
    try {
      var res = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save-post', post: post })
      });
      if (!res.ok) throw new Error('Save failed');
      return await res.json();
    } catch (err) {
      console.error('Error saving post:', err);
      return null;
    }
  }

  async function deletePost(postId) {
    try {
      var res = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete-post', id: postId })
      });
      if (!res.ok) throw new Error('Delete failed');
      return await res.json();
    } catch (err) {
      console.error('Error deleting post:', err);
      return null;
    }
  }

  async function fetchPillars() {
    try {
      var res = await fetch(BASE_URL + '?action=list-pillars');
      if (!res.ok) throw new Error('Network error');
      return await res.json();
    } catch (err) {
      console.error('Error fetching pillars:', err);
      return [];
    }
  }

  async function savePillar(pillar) {
    try {
      var res = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save-pillar', pillar: pillar })
      });
      if (!res.ok) throw new Error('Save failed');
      return await res.json();
    } catch (err) {
      console.error('Error saving pillar:', err);
      return null;
    }
  }

  // ─── BUSINESS LOGIC ───

  function getPillarBalance(posts) {
    var counts = {};
    var total = 0;
    posts.forEach(function (p) {
      if (p.pillar_name) {
        counts[p.pillar_name] = (counts[p.pillar_name] || 0) + 1;
        total++;
      }
    });
    var result = [];
    for (var name in counts) {
      result.push({
        name: name,
        count: counts[name],
        percentage: total > 0 ? Math.round((counts[name] / total) * 100) : 0
      });
    }
    return result.sort(function (a, b) { return b.count - a.count; });
  }

  function getContentGaps(posts, startDate, days) {
    days = days || 7;
    var dateSet = {};
    posts.forEach(function (p) {
      if (p.scheduled_date) dateSet[p.scheduled_date] = true;
    });
    var gaps = [];
    for (var i = 0; i < days; i++) {
      var d = new Date(startDate);
      d.setDate(d.getDate() + i);
      var key = formatDate(d);
      if (!dateSet[key]) gaps.push(key);
    }
    return gaps;
  }

  function suggestPostingTime(platform, country) {
    country = country || 'NG';
    platform = platform || 'instagram';
    var times = (OPTIMAL_TIMES[country] || OPTIMAL_TIMES.NG)[platform];
    return times || ['12:00'];
  }

  function getAfricanEvents(country, month) {
    var events = [];
    var countryEvents = AFRICAN_EVENTS[country] || [];
    var panEvents = AFRICAN_EVENTS.PAN || [];
    var all = countryEvents.concat(panEvents);
    all.forEach(function (e) {
      if (month === undefined || e.month === month + 1) {
        events.push(e);
      }
    });
    return events;
  }

  function groupPostsByDate(posts) {
    var groups = {};
    posts.forEach(function (p) {
      var key = p.scheduled_date || 'unscheduled';
      if (!groups[key]) groups[key] = [];
      groups[key].push(p);
    });
    return groups;
  }

  function duplicatePost(post, newDate, newPlatforms) {
    var clone = JSON.parse(JSON.stringify(post));
    delete clone.id;
    clone.scheduled_date = newDate || clone.scheduled_date;
    clone.platforms = newPlatforms || clone.platforms;
    clone.status = 'draft';
    return clone;
  }

  // ─── LOCAL STORAGE FALLBACK ───
  var LS_KEY = 'afro_creator_calendar';

  function getLocalPosts() {
    try {
      var data = localStorage.getItem(LS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) { return []; }
  }

  function saveLocalPosts(posts) {
    try { localStorage.setItem(LS_KEY, JSON.stringify(posts)); } catch (e) {}
  }

  function addLocalPost(post) {
    var posts = getLocalPosts();
    post.id = post.id || crypto.randomUUID();
    post.created_at = post.created_at || new Date().toISOString();
    post.updated_at = new Date().toISOString();
    var idx = posts.findIndex(function (p) { return p.id === post.id; });
    if (idx >= 0) posts[idx] = post; else posts.push(post);
    saveLocalPosts(posts);
    return post;
  }

  function deleteLocalPost(postId) {
    var posts = getLocalPosts().filter(function (p) { return p.id !== postId; });
    saveLocalPosts(posts);
  }

  function getLocalPillars() {
    try {
      var data = localStorage.getItem(LS_KEY + '_pillars');
      return data ? JSON.parse(data) : DEFAULT_PILLARS.map(function (p, i) {
        return Object.assign({ id: 'default_' + i }, p);
      });
    } catch (e) { return []; }
  }

  function saveLocalPillars(pillars) {
    try { localStorage.setItem(LS_KEY + '_pillars', JSON.stringify(pillars)); } catch (e) {}
  }

  // ─── PUBLIC API ───
  return {
    PLATFORMS: PLATFORMS,
    POST_TYPES: POST_TYPES,
    DEFAULT_PILLARS: DEFAULT_PILLARS,
    OPTIMAL_TIMES: OPTIMAL_TIMES,
    AFRICAN_EVENTS: AFRICAN_EVENTS,
    DAY_NAMES: DAY_NAMES,
    DAY_NAMES_FULL: DAY_NAMES_FULL,
    MONTH_NAMES: MONTH_NAMES,

    formatDate: formatDate,
    getWeekStart: getWeekStart,
    getWeekDates: getWeekDates,
    getMonthDates: getMonthDates,
    isToday: isToday,

    fetchPosts: fetchPosts,
    getWeekPosts: getWeekPosts,
    getMonthOverview: getMonthOverview,
    savePost: savePost,
    deletePost: deletePost,
    fetchPillars: fetchPillars,
    savePillar: savePillar,

    getPillarBalance: getPillarBalance,
    getContentGaps: getContentGaps,
    suggestPostingTime: suggestPostingTime,
    getAfricanEvents: getAfricanEvents,
    groupPostsByDate: groupPostsByDate,
    duplicatePost: duplicatePost,

    getLocalPosts: getLocalPosts,
    saveLocalPosts: saveLocalPosts,
    addLocalPost: addLocalPost,
    deleteLocalPost: deleteLocalPost,
    getLocalPillars: getLocalPillars,
    saveLocalPillars: saveLocalPillars
  };
})();
