;(function () {
  'use strict';

  var COUNTRY_MAP = {
    Nigeria: { code: 'NG', flag: '\uD83C\uDDF3\uD83C\uDDEC' },
    Kenya: { code: 'KE', flag: '\uD83C\uDDF0\uD83C\uDDEA' },
    'South Africa': { code: 'ZA', flag: '\uD83C\uDDFF\uD83C\uDDE6' },
    Ghana: { code: 'GH', flag: '\uD83C\uDDEC\uD83C\uDDED' },
    Egypt: { code: 'EG', flag: '\uD83C\uDDEA\uD83C\uDDEC' },
    Tanzania: { code: 'TZ', flag: '\uD83C\uDDF9\uD83C\uDDFF' },
    Uganda: { code: 'UG', flag: '\uD83C\uDDFA\uD83C\uDDEC' },
    Senegal: { code: 'SN', flag: '\uD83C\uDDF8\uD83C\uDDF3' },
    Cameroon: { code: 'CM', flag: '\uD83C\uDDE8\uD83C\uDDF2' },
    Ethiopia: { code: 'ET', flag: '\uD83C\uDDEA\uD83C\uDDF9' },
    Morocco: { code: 'MA', flag: '\uD83C\uDDF2\uD83C\uDDE6' },
    Rwanda: { code: 'RW', flag: '\uD83C\uDDF7\uD83C\uDDFC' },
    Algeria: { code: 'DZ', flag: '\uD83C\uDDE9\uD83C\uDDFF' },
    'DR Congo': { code: 'CD', flag: '\uD83C\uDDE8\uD83C\uDDE9' },
    "Cote d'Ivoire": { code: 'CI', flag: '\uD83C\uDDE8\uD83C\uDDEE' },
    Tunisia: { code: 'TN', flag: '\uD83C\uDDF9\uD83C\uDDF3' }
  };

  var PLATFORM_CODE = {
    youtube: 'yt',
    twitch: 'twitch',
    tiktok: 'tiktok',
    instagram: 'ig',
    kick: 'kick',
    rumble: 'rumble'
  };

  var CATEGORY_TO_INDEX = {
    Gaming: 0,
    Music: 1,
    Comedy: 2,
    Tech: 3,
    Fashion: 4,
    Food: 5,
    Education: 6,
    Lifestyle: 7,
    IRL: 8,
    'Just Chatting': 9,
    Entertainment: 2,
    Coding: 3,
    DJ: 1,
    Cooking: 5,
    Production: 1,
    Skits: 2,
    Reviews: 3,
    Variety: 9,
    Reaction: 2,
    Dance: 1,
    Faith: 6,
    Prayer: 6,
    DIY: 3,
    Crafts: 3,
    Matchmaking: 9,
    Community: 9,
    Esports: 0,
    RPG: 0,
    Survival: 0,
    Health: 6,
    Design: 4,
    Business: 3,
    Shoutcasting: 0,
    MTG: 0
  };

  var COUNTRY_INDEX_BY_CODE = {};

  function buildCountryIndex() {
    var keys = Object.keys(COUNTRY_MAP);
    for (var i = 0; i < keys.length; i++) {
      COUNTRY_INDEX_BY_CODE[COUNTRY_MAP[keys[i]].code] = i;
    }
  }

  function normalizeNameKey(value) {
    return String(value || '').trim().replace(/\s+/g, ' ').toLowerCase();
  }

  function categoryIndex(value) {
    if (!value) return 0;
    var parts = String(value).split(',');
    for (var i = 0; i < parts.length; i++) {
      var raw = parts[i].trim();
      if (CATEGORY_TO_INDEX[raw] !== undefined) return CATEGORY_TO_INDEX[raw];
      var normalized = raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
      if (CATEGORY_TO_INDEX[normalized] !== undefined) return CATEGORY_TO_INDEX[normalized];
    }
    return 0;
  }

  function numericValue(value) {
    if (typeof value === 'number') return value;
    if (!value) return 0;
    var cleaned = String(value).replace(/[^0-9.\-]/g, '');
    return parseFloat(cleaned) || 0;
  }

  function countryIndex(value) {
    if (value && String(value).length <= 3 && COUNTRY_INDEX_BY_CODE[value] !== undefined) {
      return COUNTRY_INDEX_BY_CODE[value];
    }
    var idx = Object.keys(COUNTRY_MAP).indexOf(value);
    return idx >= 0 ? idx : 0;
  }

  function extractYouTubeVideoId(value) {
    if (!value) return '';
    var str = String(value).trim();
    if (!str) return '';
    if (/^[A-Za-z0-9_-]{11}$/.test(str)) return str;
    var patterns = [
      /[?&]v=([A-Za-z0-9_-]{11})/i,
      /youtu\.be\/([A-Za-z0-9_-]{11})/i,
      /youtube\.com\/(?:live|shorts|embed)\/([A-Za-z0-9_-]{11})/i
    ];
    for (var i = 0; i < patterns.length; i++) {
      var match = str.match(patterns[i]);
      if (match) return match[1];
    }
    return '';
  }

  function normalizeThumbnailUrl(value) {
    if (!value) return '';

    if (Array.isArray(value)) {
      for (var ai = 0; ai < value.length; ai++) {
        var arrUrl = normalizeThumbnailUrl(value[ai]);
        if (arrUrl) return arrUrl;
      }
      return '';
    }

    if (typeof value === 'object') {
      var keys = ['url', 'src', 'secure_url', 'thumbnail_url', 'thumbnailUrl', 'image', 'thumbnail', 'poster', 'original', 'large', 'medium', 'small', 'sm'];
      for (var ki = 0; ki < keys.length; ki++) {
        var next = normalizeThumbnailUrl(value[keys[ki]]);
        if (next) return next;
      }
      return '';
    }

    var str = String(value).trim();
    if (!str || str === 'null' || str === 'undefined' || str === '[object Object]') return '';

    if ((str.charAt(0) === '{' || str.charAt(0) === '[') && str.indexOf('http') !== 0) {
      try {
        return normalizeThumbnailUrl(JSON.parse(str));
      } catch (e) {}
    }

    str = str
      .replace(/\\u0026/g, '&')
      .replace(/\\\//g, '/')
      .replace(/&amp;/g, '&')
      .replace(/^\/\//, 'https://')
      .replace(/^http:\/\//i, 'https://')
      .replace(/\{width\}/g, '440')
      .replace(/\{height\}/g, '248');

    var youtubeId = extractYouTubeVideoId(str);
    if (youtubeId) return 'https://img.youtube.com/vi/' + youtubeId + '/hqdefault.jpg';

    return /^https?:\/\//i.test(str) ? str : '';
  }

  function pickFirstThumbnail(raw) {
    if (!raw) return '';
    var values = [
      raw.thumbnail,
      raw.thumbnail_url,
      raw.thumbnailUrl,
      raw.image,
      raw.image_url,
      raw.imageUrl,
      raw.poster,
      raw.cover,
      raw.banner_image,
      raw.url
    ];
    for (var i = 0; i < values.length; i++) {
      var url = normalizeThumbnailUrl(values[i]);
      if (url) return url;
    }
    return '';
  }

  function pickAvatar(raw) {
    if (!raw) return '';
    var values = [
      raw.avatar,
      raw.avatar_url,
      raw.profile_image,
      raw.image,
      raw.image_url,
      raw.imageUrl,
      raw.cover,
      raw.banner_image
    ];
    for (var i = 0; i < values.length; i++) {
      var url = normalizeThumbnailUrl(values[i]);
      if (url) return url;
    }
    return '';
  }

  function creatorPlatforms(raw) {
    var platforms = [];
    if (raw.youtube_url) platforms.push('yt');
    if (raw.twitch_url) platforms.push('twitch');
    if (raw.tiktok_url) platforms.push('tiktok');
    if (raw.instagram_url) platforms.push('ig');
    if (raw.kick_url) platforms.push('kick');
    if (!platforms.length) platforms.push(PLATFORM_CODE[raw.primary_platform] || 'yt');
    return platforms;
  }

  function mapCreator(raw) {
    return {
      name: raw.name,
      country: countryIndex(raw.country),
      platform: PLATFORM_CODE[raw.primary_platform] || 'yt',
      platforms: creatorPlatforms(raw),
      cat: categoryIndex(raw.categories),
      type: raw.categories ? raw.categories.split(',').slice(0, 2).join(' & ') : 'Creator',
      followers: raw.subscribers || 0,
      gifts: numericValue(raw.gift_revenue),
      views: raw.total_views || 0,
      nw: numericValue(raw.net_worth),
      freq: raw.frequency || '3x/week',
      since: raw.streaming_since || '2023',
      subs: raw.subscribers || 0,
      slug: raw.slug,
      avatar: pickAvatar(raw) || null,
      score: raw.afro_score || 0,
      tier: raw.afro_tier || 'rising',
      _raw: raw
    };
  }

  function mapNews(raw) {
    var published = new Date(raw.published_at);
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return {
      title: raw.title,
      cat: raw.category || 'News',
      date: months[published.getMonth()] + ' ' + published.getDate() + ', ' + published.getFullYear(),
      excerpt: raw.excerpt,
      slug: raw.slug,
      _raw: raw
    };
  }

  function mapUpcomingStream(raw) {
    var date = new Date(raw.stream_date);
    var hours = date.getHours();
    var minutes = date.getMinutes();
    var suffix = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    var time = hours + ':' + (minutes < 10 ? '0' : '') + minutes + ' ' + suffix;
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return {
      name: raw.creator_name,
      title: raw.title,
      platform: PLATFORM_CODE[raw.platform] || 'yt',
      date: months[date.getMonth()] + ' ' + date.getDate(),
      time: time,
      country: countryIndex(raw.country),
      _raw: raw
    };
  }

  function resolveCreatorSubscribers(creator) {
    if (!creator) return 0;
    if (creator._raw && creator._raw.subscribers) return creator._raw.subscribers;
    return creator.subscribers || creator.subs || creator.followers || 0;
  }

  function resolveCreatorAvatar(creator) {
    if (!creator) return '';
    return creator.avatar || pickAvatar(creator._raw || creator) || '';
  }

  async function fetchPublic(path) {
    var response = await fetch('/api/admin/afrostream/public' + path);
    if (!response.ok) throw new Error('API ' + response.status);
    var payload = await response.json();
    if (payload.success && payload.data) return payload.data;
    throw new Error('Invalid response');
  }

  buildCountryIndex();

  window.AfroStreamEngine = {
    COUNTRY_MAP: COUNTRY_MAP,

    loadCreators: async function () {
      var creators = (await fetchPublic('/creators')).map(mapCreator);
      creators.sort(function (a, b) {
        return (b.score || 0) - (a.score || 0) || b.followers - a.followers;
      });
      return creators;
    },

    loadStreams: async function (creators) {
      var rows = await fetchPublic('/streams');
      var creatorMap = {};

      if (creators && creators.length) {
        creators.forEach(function (creator) {
          var key = normalizeNameKey(creator.name);
          if (key) creatorMap[key] = creator;
          if (creator.slug) creatorMap[normalizeNameKey(creator.slug)] = creator;
          if (creator._raw && creator._raw.slug) creatorMap[normalizeNameKey(creator._raw.slug)] = creator;
        });
      }

      var live = rows.filter(function (row) {
        return row.is_live;
      }).map(function (row) {
        var creator = creatorMap[normalizeNameKey(row.creator_name)] || creatorMap[normalizeNameKey(row.name)];
        return {
          name: row.creator_name,
          country: countryIndex(row.country || (creator && creator._raw ? creator._raw.country : '')),
          platform: PLATFORM_CODE[(row.platform || '').toLowerCase()] || 'yt',
          cat: categoryIndex(row.category),
          viewers: row.viewer_count || 0,
          subs: resolveCreatorSubscribers(creator),
          avatar: pickAvatar(row) || resolveCreatorAvatar(creator) || null,
          title: row.title,
          date: row.stream_date,
          is_live: row.is_live,
          url: row.url || '',
          thumbnail: pickFirstThumbnail(row),
          _raw: row
        };
      });

      var now = new Date().toISOString();
      var upcoming = rows.filter(function (row) {
        return !row.is_live && row.stream_date > now;
      }).map(mapUpcomingStream);

      return { live: live, upcoming: upcoming };
    },

    loadNews: async function () {
      return (await fetchPublic('/news')).map(mapNews);
    },

    loadFeatured: async function () {
      return (await fetchPublic('/featured')).map(function (item) {
        return item.as_creators ? mapCreator(item.as_creators) : item;
      });
    },

    loadAll: async function () {
      var rawCreators = [];
      var creators = null;

      try {
        rawCreators = await fetchPublic('/creators');
        creators = rawCreators.map(mapCreator);
        creators.sort(function (a, b) {
          return (b.score || 0) - (a.score || 0) || b.followers - a.followers;
        });
      } catch (error) {
        creators = null;
      }

      var results = await Promise.allSettled([
        this.loadStreams(rawCreators),
        this.loadNews()
      ]);

      return {
        creators: creators,
        streams: results[0].status === 'fulfilled' ? results[0].value : null,
        news: results[1].status === 'fulfilled' ? results[1].value : null
      };
    }
  };
})();
