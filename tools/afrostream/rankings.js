/* AfroStream rankings: creator reach and live streamer activity. */
(function() {
  'use strict';

  var COUNTRY_META = {
    NG:{flag:"\uD83C\uDDF3\uD83C\uDDEC",name:"Nigeria"},
    KE:{flag:"\uD83C\uDDF0\uD83C\uDDEA",name:"Kenya"},
    ZA:{flag:"\uD83C\uDDFF\uD83C\uDDE6",name:"South Africa"},
    GH:{flag:"\uD83C\uDDEC\uD83C\uDDED",name:"Ghana"},
    EG:{flag:"\uD83C\uDDEA\uD83C\uDDEC",name:"Egypt"},
    TZ:{flag:"\uD83C\uDDF9\uD83C\uDDFF",name:"Tanzania"},
    UG:{flag:"\uD83C\uDDFA\uD83C\uDDEC",name:"Uganda"},
    SN:{flag:"\uD83C\uDDF8\uD83C\uDDF3",name:"Senegal"},
    CM:{flag:"\uD83C\uDDE8\uD83C\uDDF2",name:"Cameroon"},
    ET:{flag:"\uD83C\uDDEA\uD83C\uDDF9",name:"Ethiopia"},
    RW:{flag:"\uD83C\uDDF7\uD83C\uDDFC",name:"Rwanda"},
    MA:{flag:"\uD83C\uDDF2\uD83C\uDDE6",name:"Morocco"},
    DZ:{flag:"\uD83C\uDDE9\uD83C\uDDFF",name:"Algeria"},
    CI:{flag:"\uD83C\uDDE8\uD83C\uDDEE",name:"Cote d'Ivoire"},
    CD:{flag:"\uD83C\uDDE8\uD83C\uDDE9",name:"DR Congo"},
    TN:{flag:"\uD83C\uDDF9\uD83C\uDDF3",name:"Tunisia"}
  };

  var COUNTRY_NAME_TO_CODE = {};
  Object.keys(COUNTRY_META).forEach(function(code) {
    COUNTRY_NAME_TO_CODE[COUNTRY_META[code].name.toLowerCase()] = code;
  });

  var PLATFORM_ICONS = {
    youtube: '<span class="as-platform-icon as-pi-yt" title="YouTube">&#9654;</span>',
    twitch: '<span class="as-platform-icon as-pi-tw" title="Twitch">&#9670;</span>',
    tiktok: '<span class="as-platform-icon as-pi-tt" title="TikTok">&#9835;</span>',
    instagram: '<span class="as-platform-icon as-pi-ig" title="Instagram">&#9673;</span>',
    kick: '<span class="as-platform-icon as-pi-kk" title="Kick">K</span>',
    rumble: '<span class="as-platform-icon as-pi-rm" title="Rumble">R</span>',
    twitter: '<span class="as-platform-icon as-pi-rm" title="X">X</span>'
  };

  var CREATORS = [];
  var STREAMS = [];
  var SNAPSHOTS = { week:null, month:null, all:null };
  var PAGE_SIZE = 20;
  var currentPage = 1;
  var currentSort = 'score';
  var sortDir = 1;
  var currentMode = 'creators';
  var loadingError = '';

  function byId(id) { return document.getElementById(id); }

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function(ch) {
      return ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[ch];
    });
  }

  function escapeAttr(value) {
    return escapeHtml(value).replace(/`/g, '&#96;');
  }

  function safeUrl(value) {
    var url = String(value || '').trim();
    if (!url) return '';
    if (/^(https?:)?\/\//i.test(url) || url.charAt(0) === '/') return url.replace(/"/g, '%22');
    return '';
  }

  function normalizeName(value) {
    return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  }

  function slugify(value) {
    return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }

  function num(value) {
    if (typeof value === 'number' && isFinite(value)) return value;
    if (!value) return 0;
    var parsed = parseFloat(String(value).replace(/[^0-9.\-]/g, ''));
    return isFinite(parsed) ? parsed : 0;
  }

  function intNum(value) {
    return Math.round(num(value));
  }

  function fmtNum(value) {
    var n = intNum(value);
    if (n >= 1000000000) return (n / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B';
    if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    return String(n);
  }

  function fmtSigned(value) {
    var n = intNum(value);
    if (!n) return '0';
    return (n > 0 ? '+' : '') + fmtNum(n);
  }

  function fmtUSD(value) {
    var n = intNum(value);
    if (n >= 1000000) return '$' + (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (n >= 1000) return '$' + (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    return '$' + n;
  }

  function formatDate(value) {
    if (!value) return '';
    var date = new Date(value);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
  }

  function formatDateTime(value) {
    if (!value) return '';
    var date = new Date(value);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric', hour:'2-digit', minute:'2-digit' });
  }

  function daysAgo(days) {
    var date = new Date();
    date.setDate(date.getDate() - days);
    return date;
  }

  function logScore(value, max) {
    if (!value || value <= 0 || !max || max <= 1) return 0;
    return Math.min(100, Math.round(Math.log10(value) / Math.log10(max) * 100));
  }

  function getTier(score) {
    if (score >= 80) return 'legend';
    if (score >= 60) return 'elite';
    if (score >= 40) return 'established';
    if (score >= 20) return 'trending';
    return 'rising';
  }

  function consistencyScore(frequency) {
    var freq = String(frequency || '').toLowerCase();
    if (!freq) return 0;
    if (freq.indexOf('daily') !== -1) return 100;
    if (freq.indexOf('weekly') !== -1 && freq.indexOf('x') === -1) return 40;
    var match = freq.match(/(\d+)\s*x\s*\/?\s*week/);
    if (match) return Math.min(100, parseInt(match[1], 10) * 20);
    return 30;
  }

  function computeFallbackAfroScore(c) {
    var followerScore = logScore(c.followers, 200000000);
    var viewScore = logScore(c.peak, 10000000000);
    var growthScore = Math.max(0, Math.min(100, c.growth * 5));
    var engagementScore = logScore(c.followers > 0 ? c.peak / c.followers : 0, 100);
    var multiPlatformScore = Math.min(100, Math.round(((c.platforms || []).length || 1) / 4 * 100));
    return Math.max(0, Math.min(100, Math.round(
      followerScore * 0.25 +
      viewScore * 0.20 +
      growthScore * 0.20 +
      consistencyScore(c.frequency) * 0.15 +
      engagementScore * 0.10 +
      multiPlatformScore * 0.10
    )));
  }

  function countryMeta(rawCountry) {
    var raw = String(rawCountry || '').trim();
    var code = raw.length === 2 ? raw.toUpperCase() : (COUNTRY_NAME_TO_CODE[raw.toLowerCase()] || '').toUpperCase();
    return {
      code: code,
      meta: COUNTRY_META[code] || { flag:'', name: raw || 'Unknown' }
    };
  }

  function readCategories(value) {
    return String(value || '').toLowerCase().split(',').map(function(item) {
      return item.trim();
    }).filter(Boolean);
  }

  function readPlatforms(row) {
    var platforms = [];
    if (row.youtube_url) platforms.push('youtube');
    if (row.twitch_url) platforms.push('twitch');
    if (row.tiktok_url) platforms.push('tiktok');
    if (row.instagram_url) platforms.push('instagram');
    if (row.kick_url) platforms.push('kick');
    if (row.rumble_url) platforms.push('rumble');
    if (!platforms.length) {
      var primary = String(row.primary_platform || '').toLowerCase().trim();
      if (primary) platforms.push(primary);
    }
    return platforms.filter(function(value, index) {
      return value && platforms.indexOf(value) === index;
    });
  }

  function mapApiCreator(row) {
    var name = row.name || 'Unknown Creator';
    var country = countryMeta(row.country);
    var cats = readCategories(row.categories);
    var platforms = readPlatforms(row);
    var slug = row.slug || slugify(name);
    var avatarUrl = safeUrl(row.avatar || row.avatar_url || row.profile_image || row.image_url);
    var initials = String(name).split(/\s+/).map(function(part) { return part.charAt(0); }).join('').slice(0, 2).toUpperCase() || 'AS';
    var followerTotal = Math.max(
      intNum(row.total_followers),
      intNum(row.subscribers),
      intNum(row.youtube_subscribers || row.yt_subscribers) +
      intNum(row.twitch_followers) +
      intNum(row.tiktok_followers) +
      intNum(row.instagram_followers) +
      intNum(row.kick_followers) +
      intNum(row.rumble_followers)
    );
    var score = intNum(row.afro_score || row.score);
    var creator = {
      id: row.id || slug,
      slug: slug,
      name: name,
      avatar: initials,
      avatarUrl: avatarUrl,
      country: country.code,
      flag: country.meta.flag,
      countryName: country.meta.name,
      category: cats[0] || 'lifestyle',
      categories: cats,
      platforms: platforms,
      followers: followerTotal,
      gifts: intNum(row.gift_revenue),
      peak: intNum(row.total_views || row.yt_views || row.peak_viewers),
      networth: intNum(row.net_worth),
      growth: num(row.growth_pct || row.growth_rate),
      score: score,
      tier: String(row.afro_tier || '').toLowerCase().trim(),
      frequency: row.frequency || '',
      bio: row.bio || '',
      streamCount: 0,
      peakViewers: 0,
      streamScore: 0,
      _raw: row
    };
    if (!creator.score) creator.score = computeFallbackAfroScore(creator);
    if (!creator.tier) creator.tier = getTier(creator.score);
    return creator;
  }

  function mapStream(row) {
    var date = row.stream_date || row.started_at || row.created_at || '';
    return {
      id: row.id || normalizeName(row.creator_name || row.name) + '-' + date,
      creatorId: row.creator_id || '',
      name: row.creator_name || row.name || 'Unknown Streamer',
      title: row.title || '',
      platform: String(row.platform || '').toLowerCase().trim(),
      country: row.country || '',
      category: row.category || '',
      date: date,
      isLive: row.is_live === true || row.is_live === 'true',
      viewers: intNum(row.viewer_count || row.viewers),
      peakViewers: intNum(row.peak_viewers || row.viewer_count || row.viewers),
      url: safeUrl(row.url || row.stream_url || row.channel_url),
      _raw: row
    };
  }

  async function fetchJson(candidates) {
    var lastError = null;
    for (var i = 0; i < candidates.length; i++) {
      try {
        var res = await fetch(candidates[i], { credentials:'same-origin' });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        var json = await res.json();
        if (json && Array.isArray(json.data)) return json;
      } catch (error) {
        lastError = error;
      }
    }
    if (lastError) throw lastError;
    throw new Error('No API candidates');
  }

  async function fetchCreators() {
    var json = await fetchJson([
      '/api/afrostream/creators?sort=afro_score&limit=500',
      '/api/admin/afrostream/public/creators'
    ]);
    return json.data.filter(function(row) {
      return row.is_published !== false;
    }).map(mapApiCreator);
  }

  async function fetchStreams() {
    var json = await fetchJson([
      '/api/afrostream/streams?limit=500',
      '/api/admin/afrostream/public/streams'
    ]);
    return json.data.filter(function(row) {
      return row.is_published !== false;
    }).map(mapStream);
  }

  async function fetchSnapshots(period) {
    try {
      var json = await fetchJson([
        '/api/afrostream/snapshots?period=' + encodeURIComponent(period) + '&limit=1000'
      ]);
      return json;
    } catch (error) {
      return { success:false, data:[], count:0, period:period, dates:[], has_history:false };
    }
  }

  function streamDateInPeriod(stream, period) {
    if (period === 'all') return true;
    if (!stream.date) return false;
    var date = new Date(stream.date);
    if (isNaN(date.getTime())) return false;
    return date >= daysAgo(period === 'week' ? 7 : 30);
  }

  function emptyStreamStats() {
    return { count:0, peak:0, live:false, lastDate:'', platforms:{}, url:'' };
  }

  function buildStreamStats(period) {
    var byId = {};
    var byName = {};
    var filtered = STREAMS.filter(function(stream) {
      return streamDateInPeriod(stream, period);
    });

    filtered.forEach(function(stream) {
      var keys = [];
      if (stream.creatorId) keys.push('id:' + stream.creatorId);
      var normalized = normalizeName(stream.name);
      if (normalized) keys.push('name:' + normalized);
      keys.forEach(function(key) {
        var isIdKey = key.indexOf('id:') === 0;
        var bucket = isIdKey ? byId : byName;
        var id = key.slice(isIdKey ? 3 : 5);
        var stats = bucket[id] || emptyStreamStats();
        stats.count += 1;
        stats.peak = Math.max(stats.peak, stream.peakViewers || stream.viewers || 0);
        stats.live = stats.live || stream.isLive;
        stats.url = stats.url || stream.url;
        if (stream.platform) stats.platforms[stream.platform] = true;
        if (!stats.lastDate || (stream.date && stream.date > stats.lastDate)) stats.lastDate = stream.date;
        bucket[id] = stats;
      });
    });

    return { byId:byId, byName:byName, list:filtered };
  }

  function mergeStats(a, b) {
    a = a || emptyStreamStats();
    b = b || emptyStreamStats();
    var merged = emptyStreamStats();
    merged.count = Math.max(a.count, b.count);
    merged.peak = Math.max(a.peak, b.peak);
    merged.live = a.live || b.live;
    merged.lastDate = a.lastDate > b.lastDate ? a.lastDate : b.lastDate;
    merged.url = a.url || b.url;
    Object.keys(a.platforms || {}).forEach(function(key) { merged.platforms[key] = true; });
    Object.keys(b.platforms || {}).forEach(function(key) { merged.platforms[key] = true; });
    return merged;
  }

  function isLivePlatformCreator(creator) {
    var primary = String(creator._raw && creator._raw.primary_platform || '').toLowerCase();
    var platforms = creator.platforms || [];
    return primary === 'twitch' || primary === 'kick' || platforms.indexOf('twitch') !== -1 || platforms.indexOf('kick') !== -1;
  }

  function streamerScore(creator, stats) {
    var liveBonus = stats.live ? 18 : 0;
    var activity = Math.min(32, stats.count * 8);
    var audience = logScore(stats.peak, 100000) * 0.24;
    var reach = logScore(creator.followers || 0, 5000000) * 0.18;
    var focus = isLivePlatformCreator(creator) ? 8 : 0;
    return Math.max(1, Math.min(100, Math.round(liveBonus + activity + audience + reach + focus)));
  }

  function buildStreamerList(period) {
    var stats = buildStreamStats(period);
    var usedStreamNames = {};
    var list = [];

    CREATORS.forEach(function(creator) {
      var ownStats = mergeStats(stats.byId[String(creator.id)], stats.byName[normalizeName(creator.name)]);
      var include = ownStats.count > 0 || isLivePlatformCreator(creator);
      if (!include) return;
      var copy = Object.assign({}, creator);
      copy.streamCount = ownStats.count;
      copy.peakViewers = ownStats.peak;
      copy.isLive = ownStats.live;
      copy.streamUrl = ownStats.url;
      copy.lastStreamAt = ownStats.lastDate;
      copy.streamScore = streamerScore(copy, ownStats);
      copy.score = copy.streamScore;
      copy.streamerMode = true;
      copy.platforms = Array.from(new Set((copy.platforms || []).concat(Object.keys(ownStats.platforms || {}))));
      usedStreamNames[normalizeName(copy.name)] = true;
      list.push(copy);
    });

    stats.list.forEach(function(stream) {
      var key = normalizeName(stream.name);
      if (!key || usedStreamNames[key]) return;
      var country = countryMeta(stream.country);
      var streamOnly = {
        id: 'stream-' + key,
        slug: key.replace(/\s+/g, '-'),
        name: stream.name,
        avatar: stream.name.slice(0, 2).toUpperCase(),
        avatarUrl: '',
        country: country.code,
        flag: country.meta.flag,
        countryName: country.meta.name,
        category: String(stream.category || 'live').toLowerCase(),
        categories: stream.category ? [String(stream.category).toLowerCase()] : ['live'],
        platforms: stream.platform ? [stream.platform] : [],
        followers: 0,
        gifts: 0,
        peak: 0,
        networth: 0,
        growth: 0,
        score: 20 + Math.min(60, stream.peakViewers / 100),
        tier: 'rising',
        streamCount: 1,
        peakViewers: stream.peakViewers || stream.viewers || 0,
        isLive: stream.isLive,
        streamUrl: stream.url,
        lastStreamAt: stream.date,
        streamOnly: true
      };
      streamOnly.score = Math.max(1, Math.min(100, Math.round(streamOnly.score)));
      list.push(streamOnly);
    });

    return list;
  }

  function snapshotDeltaMap(period) {
    var snap = SNAPSHOTS[period] || { data:[], dates:[] };
    var rows = Array.isArray(snap.data) ? snap.data : [];
    var dates = Array.isArray(snap.dates) ? snap.dates.slice() : [];
    var grouped = {};
    rows.forEach(function(row) {
      var key = row.creator_id || row.creatorId || row.id;
      if (!key) return;
      (grouped[key] = grouped[key] || []).push(row);
    });

    var byId = {};
    Object.keys(grouped).forEach(function(key) {
      var group = grouped[key].slice().sort(function(a, b) {
        return String(a.snapshot_date || '').localeCompare(String(b.snapshot_date || ''));
      });
      if (group.length < 2) return;
      var first = group[0];
      var last = group[group.length - 1];
      byId[key] = {
        delta: intNum(last.total_followers) - intNum(first.total_followers),
        scoreDelta: intNum(last.afro_score) - intNum(first.afro_score),
        oldest: first.snapshot_date,
        latest: last.snapshot_date
      };
    });

    return {
      hasHistory: dates.length >= 2 && Object.keys(byId).length > 0,
      dates: dates,
      byId: byId,
      oldest: dates.length ? dates[0] : '',
      latest: dates.length ? dates[dates.length - 1] : ''
    };
  }

  function currentPeriod() {
    var active = document.querySelector('#periodPills .as-pill.active');
    return active ? active.dataset.value : 'all';
  }

  function currentCategory() {
    var active = document.querySelector('#categoryPills .as-pill.active');
    return active ? active.dataset.value : 'all';
  }

  function currentPlatform() {
    var active = document.querySelector('#platformPills .as-pill.active');
    return active ? active.dataset.value : 'all';
  }

  function getBaseList() {
    var period = currentPeriod();
    if (currentMode === 'streamers') return buildStreamerList(period);

    var list = CREATORS.map(function(creator) { return Object.assign({}, creator); });
    if (period !== 'all') {
      var deltas = snapshotDeltaMap(period);
      list.forEach(function(creator) {
        var delta = deltas.byId[String(creator.id)];
        if (delta) {
          creator.periodDelta = delta.delta;
          creator.periodScoreDelta = delta.scoreDelta;
          creator.periodOldest = delta.oldest;
          creator.periodLatest = delta.latest;
        }
      });
    }
    return list;
  }

  function compareValues(a, b, key) {
    var va;
    var vb;
    if (key === 'name') {
      va = String(a.name || '').toLowerCase();
      vb = String(b.name || '').toLowerCase();
      return sortDir * (va < vb ? -1 : va > vb ? 1 : 0);
    }
    if (key === 'country') {
      va = String(a.countryName || '').toLowerCase();
      vb = String(b.countryName || '').toLowerCase();
      return sortDir * (va < vb ? -1 : va > vb ? 1 : 0);
    }
    if (key === 'followers') { va = a.followers; vb = b.followers; }
    else if (key === 'gifts') { va = a.gifts; vb = b.gifts; }
    else if (key === 'peak') { va = currentMode === 'streamers' ? a.peakViewers : a.peak; vb = currentMode === 'streamers' ? b.peakViewers : b.peak; }
    else if (key === 'networth') { va = a.networth; vb = b.networth; }
    else if (key === 'growth') { va = a.growth; vb = b.growth; }
    else if (key === 'streams') { va = a.streamCount || 0; vb = b.streamCount || 0; }
    else if (key === 'rank') { va = a.baseRank || a.rank || 0; vb = b.baseRank || b.rank || 0; return sortDir * (va - vb); }
    else {
      var period = currentPeriod();
      if (currentMode === 'creators' && period !== 'all' && snapshotDeltaMap(period).hasHistory) {
        va = a.periodDelta || 0;
        vb = b.periodDelta || 0;
      } else {
        va = a.score || 0;
        vb = b.score || 0;
      }
    }
    return sortDir * ((vb || 0) - (va || 0));
  }

  function getFiltered() {
    var category = currentCategory();
    var country = byId('countryFilter') ? byId('countryFilter').value : 'all';
    var platform = currentPlatform();
    var search = byId('searchFilter') ? byId('searchFilter').value.toLowerCase().trim() : '';
    var streamStats = buildStreamStats(currentPeriod());

    var list = getBaseList().map(function(item) {
      var stats = mergeStats(streamStats.byId[String(item.id)], streamStats.byName[normalizeName(item.name)]);
      if (currentMode === 'creators') {
        item.streamCount = stats.count;
        item.peakViewers = stats.peak;
        item.isLive = stats.live;
      }
      return item;
    }).filter(function(creator) {
      if (category !== 'all' && creator.category !== category && (!creator.categories || creator.categories.indexOf(category) === -1)) return false;
      if (country !== 'all' && creator.country !== country) return false;
      if (platform !== 'all' && (!creator.platforms || creator.platforms.indexOf(platform) === -1)) return false;
      if (search && String(creator.name || '').toLowerCase().indexOf(search) === -1) return false;
      return true;
    });

    list.sort(function(a, b) {
      var primary = compareValues(a, b, currentSort);
      if (primary !== 0) return primary;
      return String(a.name || '').localeCompare(String(b.name || ''));
    });

    list.forEach(function(item, index) {
      item.rank = index + 1;
      if (!item.baseRank) item.baseRank = index + 1;
    });
    return list;
  }

  function platformIcons(platforms) {
    return (platforms || []).map(function(platform) {
      return PLATFORM_ICONS[platform] || '';
    }).join('');
  }

  function growthHTML(value) {
    var growth = num(value);
    if (growth > 0) return '<span class="as-growth as-growth-up">&#9650; +' + escapeHtml(growth.toFixed(growth % 1 ? 1 : 0)) + '%</span>';
    if (growth < 0) return '<span class="as-growth as-growth-down">&#9660; ' + escapeHtml(growth.toFixed(growth % 1 ? 1 : 0)) + '%</span>';
    return '<span class="as-growth">0%</span>';
  }

  function avatarGradient(name) {
    var h = 0;
    name = String(name || 'AfroStream');
    for (var i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
    var hue = Math.abs(h) % 360;
    return 'linear-gradient(135deg, hsl(' + hue + ',80%,60%), hsl(' + ((hue + 60) % 360) + ',70%,50%))';
  }

  function creatorHref(creator) {
    if (creator.streamOnly && creator.streamUrl) return creator.streamUrl;
    return 'creator.html?id=' + encodeURIComponent(creator.slug || creator.id || slugify(creator.name));
  }

  function avatarStyle(creator) {
    if (creator.avatarUrl) return 'background-image:url("' + escapeAttr(creator.avatarUrl) + '");background-size:cover;background-position:center';
    return 'background:' + avatarGradient(creator.name);
  }

  function streamNote(creator) {
    if (creator.isLive) return '<span class="as-row-note">Live now</span>';
    if (creator.lastStreamAt) return '<span class="as-row-note">Last ' + escapeHtml(formatDate(creator.lastStreamAt)) + '</span>';
    if (creator.peakViewers) return '<span class="as-row-note">Peak ' + fmtNum(creator.peakViewers) + ' viewers</span>';
    return '';
  }

  function renderStats() {
    var el = byId('rankingStats');
    if (!el) return;
    var streamers = buildStreamerList('all');
    var liveNow = STREAMS.filter(function(stream) { return stream.isLive; }).length;
    var dates = [];
    ['week', 'month', 'all'].forEach(function(period) {
      var snap = SNAPSHOTS[period];
      if (snap && Array.isArray(snap.dates)) {
        snap.dates.forEach(function(date) {
          if (dates.indexOf(date) === -1) dates.push(date);
        });
      }
    });
    dates.sort().reverse();
    var cards = [
      { value: fmtNum(CREATORS.length), label:'Published creators' },
      { value: fmtNum(streamers.length), label:'Live streamer candidates' },
      { value: fmtNum(liveNow), label:'Live now' },
      { value: dates.length ? formatDate(dates[0]) : 'Baseline pending', label:'Latest snapshot' }
    ];
    el.innerHTML = cards.map(function(card) {
      return '<div class="as-status-card"><span class="as-status-value">' + escapeHtml(card.value) + '</span><span class="as-status-label">' + escapeHtml(card.label) + '</span></div>';
    }).join('');
  }

  function renderDataNote() {
    var el = byId('dataNote');
    if (!el) return;
    var period = currentPeriod();
    var text = '';
    if (loadingError) {
      text = loadingError;
    } else if (currentMode === 'creators' && period !== 'all') {
      var deltas = snapshotDeltaMap(period);
      if (deltas.hasHistory) {
        text = 'This creator period view is sorted by follower movement between ' + formatDate(deltas.oldest) + ' and ' + formatDate(deltas.latest) + ', with AfroScore as the tie-breaker.';
      } else {
        text = 'Creator week and month rankings are now snapshot-backed. Today is the baseline, so this view falls back to all-time reach until at least two snapshot dates exist.';
      }
    } else if (currentMode === 'streamers') {
      text = period === 'all'
        ? 'Live Streamers ranks creators with live-platform presence using loaded stream history, live status, stream count, and peak viewers.'
        : 'Live Streamers uses actual stream_date activity for this period. Creator reach remains visible as context, but stream activity drives the ranking.';
    }
    el.hidden = !text;
    el.textContent = text;
  }

  function updateHeadings() {
    var title = byId('rankingTitle');
    var desc = byId('rankingDescription');
    if (!title || !desc) return;
    if (currentMode === 'streamers') {
      title.textContent = 'Full Live Streamer Ranking';
      desc.textContent = 'African live streamers ranked by stream activity, live status, peak viewers, and live-platform focus. Click any row to open the profile or stream.';
    } else {
      title.textContent = 'Full Creator Reach Ranking';
      desc.textContent = 'African creators ranked by AfroScore, cross-platform followers, views, growth, consistency, engagement, and platform presence.';
    }
  }

  function renderPodium(list) {
    var grid = byId('podiumGrid');
    if (!grid) return;
    if (list.length < 3) {
      grid.innerHTML = '<div class="as-empty-state" style="grid-column:1/-1">Not enough matching creators for a podium.</div>';
      return;
    }
    var order = [1, 0, 2];
    var medals = ['as-podium-gold', 'as-podium-silver', 'as-podium-bronze'];
    var labels = ['#1', '#2', '#3'];
    grid.innerHTML = order.map(function(displayIndex) {
      var creator = list[displayIndex];
      var statOneLabel = currentMode === 'streamers' ? 'Streams' : 'Followers';
      var statOneValue = currentMode === 'streamers' ? fmtNum(creator.streamCount || 0) : fmtNum(creator.followers);
      var statTwoLabel = currentMode === 'streamers' ? 'Peak' : 'Gifts';
      var statTwoValue = currentMode === 'streamers' ? fmtNum(creator.peakViewers || 0) : fmtUSD(creator.gifts);
      var statThreeLabel = currentMode === 'streamers' ? 'Followers' : 'Views';
      var statThreeValue = currentMode === 'streamers' ? fmtNum(creator.followers) : fmtNum(creator.peak);
      return '<a href="' + escapeAttr(creatorHref(creator)) + '" class="as-podium-card ' + medals[displayIndex] + '">' +
        '<div class="as-podium-rank">' + labels[displayIndex] + '</div>' +
        '<div class="as-podium-avatar" style="' + avatarStyle(creator) + '">' + (creator.avatarUrl ? '' : escapeHtml(creator.avatar)) + '</div>' +
        '<h3 class="as-podium-name">' + escapeHtml(creator.name) + '</h3>' +
        '<div class="as-podium-country">' + escapeHtml(creator.flag + ' ' + creator.countryName) + '</div>' +
        '<div class="as-podium-platforms">' + platformIcons(creator.platforms) + '</div>' +
        '<div class="as-podium-stats">' +
          '<div class="as-podium-stat"><span class="as-podium-stat-val">' + statOneValue + '</span><span class="as-podium-stat-lbl">' + statOneLabel + '</span></div>' +
          '<div class="as-podium-stat"><span class="as-podium-stat-val">' + statTwoValue + '</span><span class="as-podium-stat-lbl">' + statTwoLabel + '</span></div>' +
          '<div class="as-podium-stat"><span class="as-podium-stat-val">' + statThreeValue + '</span><span class="as-podium-stat-lbl">' + statThreeLabel + '</span></div>' +
        '</div>' +
        '<div class="as-podium-stat" style="margin-bottom:8px"><span class="as-networth-cell" style="font-size:1.125rem">' + fmtUSD(creator.networth) + '</span><span class="as-podium-stat-lbl">Est. Net Worth</span></div>' +
        '<span class="as-podium-cta">' + (creator.streamOnly ? 'Open stream' : 'View profile') + ' &rarr;</span>' +
      '</a>';
    }).join('');
  }

  function renderTable(list) {
    var body = byId('rankingsBody');
    if (!body) return;
    var show = list.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
    if (!show.length) {
      body.innerHTML = '<tr><td colspan="12"><div class="as-empty-state">No matching AfroStream entries found. Try clearing a filter or search term.</div></td></tr>';
      return;
    }
    body.innerHTML = show.map(function(creator) {
      var rankColorClass = creator.rank === 1 ? ' gold' : creator.rank === 2 ? ' silver' : creator.rank === 3 ? ' bronze' : '';
      var followerNote = creator.periodDelta != null ? '<span class="as-row-note">' + fmtSigned(creator.periodDelta) + ' in period</span>' : '';
      var viewsValue = currentMode === 'streamers' ? creator.peakViewers || 0 : creator.peak || 0;
      var rowCategory = creator.categories && creator.categories.length ? creator.categories.slice(0, 2).map(function(s) {
        return s.charAt(0).toUpperCase() + s.slice(1);
      }).join(' & ') : (creator.streamOnly ? 'Live Stream' : 'Creator');
      return '<tr class="as-table-row" tabindex="0" role="link" data-href="' + escapeAttr(creatorHref(creator)) + '">' +
        '<td class="as-td-rank"><span class="as-rank-num' + rankColorClass + '">' + creator.rank + '</span></td>' +
        '<td class="as-td-creator"><div class="as-creator-cell"><div class="as-creator-avatar-sm" style="' + avatarStyle(creator) + '">' + (creator.avatarUrl ? '' : escapeHtml(creator.avatar)) + '</div><span>' + escapeHtml(creator.name) + '</span></div></td>' +
        '<td>' + escapeHtml(creator.flag + ' ' + creator.countryName) + '</td>' +
        '<td>' + platformIcons(creator.platforms) + '</td>' +
        '<td style="font-size:.8rem;color:#64748b">' + escapeHtml(rowCategory) + '</td>' +
        '<td>' + fmtNum(creator.followers) + followerNote + '</td>' +
        '<td>' + fmtUSD(creator.gifts) + '</td>' +
        '<td>' + fmtNum(viewsValue) + '</td>' +
        '<td><span class="as-networth-cell">' + fmtUSD(creator.networth) + '</span></td>' +
        '<td>' + growthHTML(creator.growth) + '</td>' +
        '<td>' + fmtNum(creator.streamCount || 0) + streamNote(creator) + '</td>' +
        '<td><span class="as-score-badge">' + intNum(creator.score) + '</span></td>' +
      '</tr>';
    }).join('');
    bindRowClicks();
  }

  function bindRowClicks() {
    document.querySelectorAll('.as-table-row[data-href]').forEach(function(row) {
      row.addEventListener('click', function() {
        window.location.href = this.getAttribute('data-href');
      });
      row.addEventListener('keydown', function(event) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          window.location.href = this.getAttribute('data-href');
        }
      });
    });
  }

  function renderPagination(list) {
    var el = byId('pagination');
    if (!el) return;
    var totalPages = Math.ceil(list.length / PAGE_SIZE);
    if (totalPages <= 1) {
      el.innerHTML = '';
      return;
    }
    var start = Math.max(1, currentPage - 2);
    var end = Math.min(totalPages, start + 4);
    start = Math.max(1, end - 4);
    var html = '<button class="as-page-btn" data-page="1" ' + (currentPage === 1 ? 'disabled' : '') + '>&laquo;</button>';
    for (var p = start; p <= end; p++) {
      html += '<button class="as-page-btn' + (p === currentPage ? ' active' : '') + '" data-page="' + p + '">' + p + '</button>';
    }
    html += '<button class="as-page-btn" data-page="' + totalPages + '" ' + (currentPage === totalPages ? 'disabled' : '') + '>&raquo;</button>';
    el.innerHTML = html;
    el.querySelectorAll('[data-page]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var page = parseInt(this.dataset.page, 10) || 1;
        currentPage = Math.max(1, Math.min(totalPages, page));
        renderAll();
        var table = document.querySelector('.as-table-section');
        if (table) window.scrollTo({ top: table.offsetTop - 100, behavior:'smooth' });
      });
    });
  }

  function renderAll() {
    updateHeadings();
    renderStats();
    renderDataNote();
    var list = getFiltered();
    renderPodium(list);
    renderTable(list);
    renderPagination(list);
    syncFiltersToURL();
    if (window.AfroStreamSubnav && typeof window.AfroStreamSubnav.refresh === 'function') {
      window.AfroStreamSubnav.refresh();
    }
  }

  function setupPills(containerId) {
    var container = byId(containerId);
    if (!container) return;
    container.addEventListener('click', function(event) {
      var pill = event.target.closest('.as-pill');
      if (!pill || pill.disabled) return;
      container.querySelectorAll('.as-pill').forEach(function(item) { item.classList.remove('active'); });
      pill.classList.add('active');
      if (containerId === 'modePills') currentMode = pill.dataset.value || 'creators';
      currentPage = 1;
      renderAll();
    });
  }

  function syncFiltersToURL() {
    var params = new URLSearchParams();
    var period = currentPeriod();
    var category = currentCategory();
    var platform = currentPlatform();
    var country = byId('countryFilter') ? byId('countryFilter').value : 'all';
    var search = byId('searchFilter') ? byId('searchFilter').value.trim() : '';
    if (currentMode !== 'creators') params.set('mode', currentMode);
    if (period !== 'all') params.set('period', period);
    if (category !== 'all') params.set('category', category);
    if (platform !== 'all') params.set('platform', platform);
    if (country !== 'all') params.set('country', country);
    if (search) params.set('q', search);
    if (currentSort !== 'score') params.set('sort', currentSort);
    if (currentPage > 1) params.set('page', currentPage);
    var qs = params.toString();
    history.replaceState(null, '', window.location.pathname + (qs ? '?' + qs : ''));
  }

  function activatePill(containerId, value) {
    var container = byId(containerId);
    if (!container || !value) return false;
    var pill = null;
    container.querySelectorAll('.as-pill').forEach(function(item) {
      if (item.dataset.value === value) pill = item;
    });
    if (!pill) return false;
    container.querySelectorAll('.as-pill').forEach(function(item) { item.classList.remove('active'); });
    pill.classList.add('active');
    return true;
  }

  function loadFiltersFromURL() {
    var params = new URLSearchParams(window.location.search);
    if (activatePill('modePills', params.get('mode'))) currentMode = params.get('mode');
    activatePill('periodPills', params.get('period'));
    activatePill('categoryPills', params.get('category'));
    activatePill('platformPills', params.get('platform'));
    if (params.get('country') && byId('countryFilter')) byId('countryFilter').value = params.get('country');
    if (params.get('q') && byId('searchFilter')) {
      byId('searchFilter').value = params.get('q');
      if (byId('navSearch')) byId('navSearch').value = params.get('q');
    }
    if (params.get('sort')) {
      currentSort = params.get('sort');
      if (byId('sortFilter')) {
        Array.prototype.forEach.call(byId('sortFilter').options, function(option) {
          if (option.value === currentSort) byId('sortFilter').value = currentSort;
        });
      }
    }
    if (params.get('page')) currentPage = parseInt(params.get('page'), 10) || 1;
  }

  function initEvents() {
    setupPills('modePills');
    setupPills('periodPills');
    setupPills('categoryPills');
    setupPills('platformPills');
    if (byId('countryFilter')) byId('countryFilter').addEventListener('change', function() { currentPage = 1; renderAll(); });
    if (byId('sortFilter')) byId('sortFilter').addEventListener('change', function() {
      currentSort = this.value;
      currentPage = 1;
      sortDir = currentSort === 'name' || currentSort === 'country' ? 1 : 1;
      renderAll();
    });
    if (byId('searchFilter')) byId('searchFilter').addEventListener('input', function() {
      currentPage = 1;
      if (byId('navSearch')) byId('navSearch').value = this.value;
      renderAll();
    });
    if (byId('navSearch')) byId('navSearch').addEventListener('input', function() {
      if (byId('searchFilter')) byId('searchFilter').value = this.value;
      currentPage = 1;
      renderAll();
    });
    document.querySelectorAll('.as-table th[data-sort]').forEach(function(th) {
      th.style.cursor = 'pointer';
      th.addEventListener('click', function() {
        var nextSort = this.dataset.sort;
        if (currentSort === nextSort) sortDir *= -1;
        else {
          currentSort = nextSort;
          sortDir = currentSort === 'name' || currentSort === 'country' ? 1 : 1;
        }
        if (byId('sortFilter')) {
          Array.prototype.forEach.call(byId('sortFilter').options, function(option) {
            if (option.value === currentSort) byId('sortFilter').value = currentSort;
          });
        }
        currentPage = 1;
        renderAll();
      });
    });
  }

  function initReveal() {
    var els = document.querySelectorAll('.rv');
    if (!els.length) return;
    if (!('IntersectionObserver' in window)) {
      els.forEach(function(el) { el.classList.add('visible'); });
      return;
    }
    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold:0.08 });
    els.forEach(function(el) { observer.observe(el); });
  }

  async function init() {
    loadFiltersFromURL();
    initEvents();
    initReveal();
    if (byId('lastUpdated')) byId('lastUpdated').textContent = 'Loading AfroStream rankings...';
    try {
      var results = await Promise.all([
        fetchCreators(),
        fetchStreams(),
        fetchSnapshots('week'),
        fetchSnapshots('month'),
        fetchSnapshots('all')
      ]);
      CREATORS = results[0].sort(function(a, b) {
        return (b.score || 0) - (a.score || 0) || (b.followers || 0) - (a.followers || 0);
      });
      CREATORS.forEach(function(creator, index) { creator.baseRank = index + 1; });
      STREAMS = results[1];
      SNAPSHOTS.week = results[2];
      SNAPSHOTS.month = results[3];
      SNAPSHOTS.all = results[4];
      if (byId('lastUpdated')) {
        var allDates = SNAPSHOTS.all && SNAPSHOTS.all.dates ? SNAPSHOTS.all.dates : [];
        var latest = allDates.length ? allDates[allDates.length - 1] : '';
        byId('lastUpdated').textContent = latest
          ? 'Snapshot baseline: ' + formatDate(latest) + '. Page read: ' + formatDateTime(new Date())
          : 'Page read: ' + formatDateTime(new Date());
      }
    } catch (error) {
      loadingError = 'AfroStream rankings could not load from the public API: ' + error.message;
      if (byId('lastUpdated')) byId('lastUpdated').textContent = 'Rankings unavailable';
      CREATORS = [];
      STREAMS = [];
    }
    renderAll();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
